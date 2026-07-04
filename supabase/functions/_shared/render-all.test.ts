/**
 * ClinicFlow · render-all proof.
 *
 * For EACH of the 21 registry templates: render it through the SAME seam the
 * wiring functions use (`sendTemplate`'s internal render + prop adapters) with
 * its realistic fixture props, and assert the output is a real, RTL, Hebrew,
 * on-brand email carrying the expected CTA / key / receipt value.
 *
 * This is the evidence that "all emails work with code."
 *
 * Run from `supabase/functions/`:
 *   deno test -A --no-check --config deno.json _shared/render-all.test.ts
 * or:
 *   deno task test:emails
 */
import {
  assert,
  assertStringIncludes,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { EMAIL_IDS, EMAILS, type EmailId } from "./email-registry.ts";
import { __renderForTest, REGISTERED_TEMPLATE_IDS } from "./send-template.ts";
import { FIXTURES } from "./emails/fixtures.ts";

/** Hebrew letters range — proves the body contains real Hebrew, not just markup. */
const HEBREW_RE = /[֐-׿]{3,}/;

/**
 * Per-id "load-bearing" assertions: substrings that MUST appear, proving the
 * fixture props (including adapter-remapped URLs / keys / receipt values)
 * actually reached the rendered HTML — a template that ignored its props and
 * fell back to its own defaults would still be RTL+Hebrew, so these catch drift.
 */
const EXPECT: { [Id in EmailId]: string[] } = {
  "confirm-email": ["auth/confirm?token=eyJhbGci-demo", "אימות"],
  "magic-link": ["429-8153", "auth/magic?token=eyJhbGci-demo"],
  "reset-password": ["auth/reset?token=eyJhbGci-demo", "איפוס"],
  "change-email": ["sharon.clinic@gmail.com", "auth/change?token=eyJhbGci-demo"],
  "welcome": ["ד״ר שרון לוי", "ClinicFlow"],

  "order-confirmation": ["CF-10428", "₪1,411", "₪215"], // receipt values
  "license-delivery": ["CF-FULL-7Q2M-4K9X-A1D3", "download"], // license key + CTA
  "upgrade-confirmation": ["ClinicFlow Pro", "ClinicFlow Full", "₪721"], // receipt
  "payment-failed": ["checkout/retry?session=cs_test_a1b2", "₪1,411"], // CTA + amount
  "refund-confirmation": ["RF-20915", "₪1,411"], // receipt
  "device-reactivation": ["MacBook Pro", "CF-FULL-••••-A1D3", "2 ביולי 2026"], // receipt

  "trial-started": ["16 ביולי 2026", "download"], // endDate + CTA
  "trial-ending": ["16 ביולי 2026", "/pricing"], // adapted pricingUrl→upgradeUrl
  "trial-ended": ["/pricing", "קריאה בלבד"], // adapted pricingUrl→buyUrl
  "win-back": ["/pricing?ref=winback"], // adapted pricingUrl→resumeUrl

  "renewal-upcoming": ["1 באוגוסט 2026", "₪149", "account/renew"], // receipt + CTA
  "renewal-confirmation": ["1 באוגוסט 2027", "₪149"], // receipt
  "updates-lapsed": ["account/renew", "לתמיד"], // CTA

  "contact-received": ["SUP-4471", "לייבא רשומות מטופלים"], // ticket + preview
  "sales-response": ["/premium", "יעל", "Premium"], // CTA + agent
  "policy-update": ["/terms", "/privacy", "1 באוגוסט 2026"], // both links + date
};

Deno.test("registry ⇄ components: all 21 ids are registered", () => {
  assert(
    EMAIL_IDS.length === 21,
    `expected 21 registry ids, got ${EMAIL_IDS.length}`,
  );
  const registered = new Set(REGISTERED_TEMPLATE_IDS);
  for (const id of EMAIL_IDS) {
    assert(registered.has(id), `id "${id}" has no registered component`);
    assert(FIXTURES[id] !== undefined, `id "${id}" has no fixture`);
    assert(EXPECT[id] !== undefined, `id "${id}" has no expectations`);
  }
});

for (const id of EMAIL_IDS) {
  Deno.test(`render · ${id}`, async () => {
    const html = await __renderForTest(id, FIXTURES[id]);

    // 1 · non-empty, real document
    assert(html.length > 200, `${id}: html too short (${html.length})`);
    assertStringIncludes(html, "<html");

    // 2 · RTL + Hebrew locale
    assertStringIncludes(html, 'dir="rtl"');
    assertStringIncludes(html, 'lang="he"');

    // 3 · real Hebrew body text
    assert(HEBREW_RE.test(html), `${id}: no Hebrew text found`);

    // 4 · registry subject/preheader wiring is present (preheader is inlined)
    assertStringIncludes(html, EMAILS[id].preheader.slice(0, 12));

    // 5 · per-id load-bearing CTA / key / receipt / link values
    for (const needle of EXPECT[id]) {
      assertStringIncludes(html, needle);
    }

    // 6 · lifecycle mail must carry the unsubscribe line; transactional must not
    if (EMAILS[id].unsubscribe) {
      assertStringIncludes(html, "להסרה מרשימת התפוצה");
    } else {
      assert(
        !html.includes("להסרה מרשימת התפוצה"),
        `${id}: transactional email must NOT show an unsubscribe line`,
      );
    }
  });

  Deno.test(`plaintext · ${id}`, async () => {
    const text = await __renderForTest(id, FIXTURES[id], { plainText: true });
    assert(text.length > 20, `${id}: plaintext too short`);
    assert(HEBREW_RE.test(text), `${id}: plaintext has no Hebrew`);
    assert(!/<html|<body/i.test(text), `${id}: plaintext still contains tags`);
  });
}
