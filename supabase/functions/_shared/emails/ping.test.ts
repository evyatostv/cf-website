/**
 * Proof that the Deno runtime renders a React Email .tsx to HTML.
 *
 * Run from `supabase/functions/`:
 *   deno test -A _shared/emails/ping.test.ts
 * or, for a quick visual check:
 *   deno run -A _shared/emails/ping.test.ts
 */
import { assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import * as React from "react";
import { render } from "../render.ts";
import { Ping } from "./ping.tsx";

async function renderPing(): Promise<string> {
  return await render(React.createElement(Ping, { name: "שרון" }));
}

Deno.test("ping template renders to HTML", async () => {
  const html = await renderPing();
  assertStringIncludes(html, "<html");
  assertStringIncludes(html, 'dir="rtl"');
  assertStringIncludes(html, "שרון");
  assertStringIncludes(html, "צינור הרינדור עובד");
});

// Allow `deno run` to print the output for a manual eyeball.
if (import.meta.main) {
  const html = await renderPing();
  console.log(html);
  console.log("\n--- render OK, length:", html.length, "chars ---");
}
