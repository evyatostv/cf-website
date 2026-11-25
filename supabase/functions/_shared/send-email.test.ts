import { sendEmail } from "./send-email.ts";
import { assertEquals, assertRejects } from "jsr:@std/assert@1";

Deno.test("only a provider message ID confirms email acceptance", async () => {
  const fetchBefore = globalThis.fetch;
  const keyBefore = Deno.env.get("RESEND_API_KEY");
  const message = { to: "synthetic@example.test", subject: "Test", html: "Test" };
  Deno.env.set("RESEND_API_KEY", "synthetic-test-token");
  try {
    for (const body of ["", "null", "{}", '{"id":42}', '{"id":" "}']) {
      globalThis.fetch = async () => new Response(body);
      await assertRejects(() => sendEmail(message), Error, "did not confirm");
    }
    globalThis.fetch = async () => Response.json({ detail: message.to }, { status: 422 });
    const rejected = await assertRejects(() => sendEmail(message), Error);
    assertEquals(rejected.message, "sendEmail: Resend responded 422");
    globalThis.fetch = async () => Response.json({ id: "synthetic-message-id" });
    assertEquals(await sendEmail(message), { id: "synthetic-message-id" });
  } finally {
    globalThis.fetch = fetchBefore;
    if (keyBefore === undefined) Deno.env.delete("RESEND_API_KEY");
    else Deno.env.set("RESEND_API_KEY", keyBefore);
  }
});
