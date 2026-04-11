#!/usr/bin/env node
/**
 * Auto blog post generator for ClinicFlow
 * Called by GitHub Actions every Sunday.
 * Reads existing slugs → asks Groq to write a new post → appends to blog-posts.ts
 */

import Groq from 'groq-sdk';
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

// ── 3. Call Groq ─────────────────────────────────────────────────────────────
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const today = new Date().toISOString().split('T')[0];

const prompt = `You write blog posts for ClinicFlow — a clinic management SaaS for private clinics in Israel.

Rules:
- Write ONLY in Hebrew (title, description, content). Slugs must be English kebab-case.
- Content: 500–900 words, practical and specific, no corporate speak
- Use real examples and numbers where relevant
- Do NOT write about how to use the ClinicFlow software itself
- HTML tags allowed in content: h2, p, ul, li, strong — nothing else
- The image must be a REAL Unsplash photo ID. Format: https://images.unsplash.com/photo-XXXXX?w=640&q=80
- Return ONLY valid JSON — no markdown fences, no explanation, just the raw JSON object.

Today's date: ${today}

Existing blog post slugs (do NOT repeat these topics):
${existingSlugs.join('\n')}

Topic pool — pick the most interesting topic NOT yet covered:
${TOPICS.join('\n')}

Return a JSON object with these fields:
{
  "slug": "english-kebab-case",
  "title": "Hebrew title",
  "description": "Hebrew 1-2 sentence description",
  "image": "https://images.unsplash.com/photo-XXXXX?w=640&q=80",
  "category": "one of: ניהול מטופלים | ניהול מרפאה | תיעוד רפואי | אבטחת מידע | ניהול כספי | ניהול תורים | נוכחות דיגיטלית | חוויית מטופל | שיווק",
  "author": "צוות ClinicFlow",
  "createdAt": "${today}",
  "readTime": "X דקות קריאה",
  "content": "full HTML string in Hebrew, 500-900 words, using h2/p/ul/li/strong tags"
}`;

console.log('Calling Groq API…');
const completion = await groq.chat.completions.create({
  model: 'llama-3.3-70b-versatile',
  messages: [{ role: 'user', content: prompt }],
  temperature: 0.7,
});

const rawText = completion.choices[0].message.content.trim();

// ── 4. Parse JSON response ───────────────────────────────────────────────────
const jsonStr = rawText.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();

let post;
try {
  post = JSON.parse(jsonStr);
} catch (e) {
  console.error('Failed to parse JSON response:\n', jsonStr.slice(0, 500));
  process.exit(1);
}

// Validate required fields
const required = ['slug', 'title', 'description', 'image', 'category', 'author', 'createdAt', 'readTime', 'content'];
for (const field of required) {
  if (!post[field]) {
    console.error(`Missing field: ${field}`);
    process.exit(1);
  }
}

if (existingSlugs.includes(post.slug)) {
  console.error(`Slug '${post.slug}' already exists — aborting to avoid duplicate`);
  process.exit(1);
}

console.log(`New post slug: ${post.slug}`);

// ── 5. Serialize to TypeScript object literal ────────────────────────────────
// Use backtick template literal for content to safely handle multiline HTML
const tsObject = `{
    slug: '${post.slug}',
    title: '${post.title.replace(/'/g, "\\'")}',
    description: '${post.description.replace(/'/g, "\\'")}',
    image: '${post.image}',
    category: '${post.category}',
    author: '${post.author}',
    createdAt: '${post.createdAt}',
    readTime: '${post.readTime}',
    content: \`${post.content.replace(/`/g, '\\`')}\`,
  }`;

// ── 6. Append to blog-posts.ts ──────────────────────────────────────────────
const INSERTION_MARKER = '];\n\nexport const categoryColors';
const insertPos = fileContent.indexOf(INSERTION_MARKER);
if (insertPos === -1) {
  console.error('Could not find insertion marker in blog-posts.ts');
  process.exit(1);
}

const newFileContent =
  fileContent.slice(0, insertPos) +
  '  ' +
  tsObject +
  ',\n' +
  fileContent.slice(insertPos);

fs.writeFileSync(BLOG_FILE, newFileContent, 'utf-8');
console.log(`✓ Post '${post.slug}' appended to blog-posts.ts`);
