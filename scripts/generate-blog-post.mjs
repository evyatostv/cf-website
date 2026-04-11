#!/usr/bin/env node
/**
 * Auto blog post generator for ClinicFlow
 * Called by GitHub Actions every 2 days.
 * Reads existing slugs → asks Gemini to write a new post → appends to blog-posts.ts
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BLOG_FILE = path.resolve(__dirname, '../src-2/app/data/blog-posts.ts');

// ── 1. Read existing slugs ──────────────────────────────────────────────────
const fileContent = fs.readFileSync(BLOG_FILE, 'utf-8');
const slugMatches = [...fileContent.matchAll(/slug:\s*['"]([^'"]+)['"]/g)];
const existingSlugs = slugMatches.map((m) => m[1]).filter((s) => s !== 'string');

console.log(`Found ${existingSlugs.length} existing posts: ${existingSlugs.join(', ')}`);

// ── 2. Topic pool ───────────────────────────────────────────────────────────
const TOPICS = [
  'Google reviews and reputation management for private doctors',
  'Social media (Instagram/Facebook) for private clinics in Israel',
  'Pricing transparency in private clinics — building trust',
  'Work-life balance for private practitioners in Israel',
  'Building word-of-mouth referrals as a doctor',
  'WhatsApp communication with patients — dos and donts',
  'First impressions at the clinic — waiting room design that works',
  'Email newsletters for private clinics — is it worth it?',
  'Managing negative patient reviews online',
  'Video marketing on YouTube/Reels for doctors',
  'How to build a referral network between specialists',
  'Reducing no-shows with smart reminder strategies',
  'Photography tips for clinic marketing — what to shoot',
  'Doctor personal branding — standing out in a crowded market',
  'End-of-year patient retention tactics for private clinics',
];

// ── 3. Call Gemini ──────────────────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
const today = new Date().toISOString().split('T')[0];

const prompt = `You write blog posts for ClinicFlow — a clinic management SaaS for private clinics in Israel.

Rules:
- Write ONLY in Hebrew (title, description, content). Slugs must be English kebab-case.
- Content: 500–900 words, practical and specific, no corporate speak
- Use real examples and numbers where relevant
- Do NOT write about how to use the ClinicFlow software itself
- HTML tags allowed in content: h2, p, ul, li, strong — nothing else
- The image must be a REAL Unsplash photo ID. Format: https://images.unsplash.com/photo-XXXXX?w=640&q=80
  Choose a professional/business/medical photo relevant to the topic. Avoid generic stock-photo-looking images.
- Return ONLY the raw TypeScript object literal — start with { and end with } — no code fences, no explanation.

Today's date: ${today}

Existing blog post slugs (do NOT repeat these topics):
${existingSlugs.join('\n')}

Topic pool — pick the most interesting topic NOT yet covered:
${TOPICS.join('\n')}

Write a complete TypeScript object literal matching this interface:
{
  slug: string;          // English kebab-case, unique
  title: string;         // Hebrew
  description: string;   // Hebrew, 1–2 sentences
  image: string;         // Unsplash URL (real photo ID)
  category: string;      // one of: 'ניהול מטופלים' | 'ניהול מרפאה' | 'תיעוד רפואי' | 'אבטחת מידע' | 'ניהול כספי' | 'ניהול תורים' | 'נוכחות דיגיטלית' | 'חוויית מטופל' | 'שיווק'
  author: string;        // always 'צוות ClinicFlow'
  createdAt: string;     // '${today}'
  readTime: string;      // e.g. '6 דקות קריאה'
  content: string;       // full HTML in Hebrew, 500–900 words
}`;

// Retry up to 3 times with 60s delay for rate limit errors
async function callWithRetry(retries = 3, delayMs = 60000) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Calling Gemini API… (attempt ${i + 1})`);
      return await model.generateContent(prompt);
    } catch (err) {
      if (err.status === 429 && i < retries - 1) {
        console.log(`Rate limited. Waiting 60s before retry…`);
        await new Promise((r) => setTimeout(r, delayMs));
      } else {
        throw err;
      }
    }
  }
}

const result = await callWithRetry();
const rawText = result.response.text().trim();

// ── 4. Validate we got an object ────────────────────────────────────────────
// Strip markdown code fences if Gemini adds them despite instructions
const cleaned = rawText.replace(/^```(?:typescript|ts|json)?\n?/i, '').replace(/\n?```$/i, '').trim();

if (!cleaned.startsWith('{') || !cleaned.endsWith('}')) {
  console.error('Unexpected response format:\n', cleaned.slice(0, 500));
  process.exit(1);
}

// Quick sanity: ensure the slug doesn't already exist
const newSlugMatch = cleaned.match(/slug:\s*['"]([^'"]+)['"]/);
if (!newSlugMatch) {
  console.error('Could not extract slug from response');
  process.exit(1);
}
const newSlug = newSlugMatch[1];
if (existingSlugs.includes(newSlug)) {
  console.error(`Slug '${newSlug}' already exists — aborting to avoid duplicate`);
  process.exit(1);
}

console.log(`New post slug: ${newSlug}`);

// ── 5. Append to blog-posts.ts ──────────────────────────────────────────────
const INSERTION_MARKER = '];\n\nexport const categoryColors';
const insertPos = fileContent.indexOf(INSERTION_MARKER);
if (insertPos === -1) {
  console.error('Could not find insertion marker in blog-posts.ts');
  process.exit(1);
}

const newFileContent =
  fileContent.slice(0, insertPos) +
  '  ' +
  cleaned +
  ',\n' +
  fileContent.slice(insertPos);

fs.writeFileSync(BLOG_FILE, newFileContent, 'utf-8');
console.log(`✓ Post '${newSlug}' appended to blog-posts.ts`);
