/**
 * Minimal "ping" email — proves that a React Email .tsx renders to an HTML
 * string inside the Deno edge runtime (JSX configured via ../../deno.json).
 *
 * This is intentionally self-contained (it does not import the authoring
 * `emails/` design system) so the render proof has zero cross-runtime coupling.
 * The 21 real templates live in `cf-website/emails/*.tsx` and are rendered by
 * the authoring toolchain; see ../render.ts for how HTML reaches sendEmail().
 */
import * as React from "react";
import { Body, Container, Head, Html, Preview, Text } from "@react-email/components";

export interface PingProps {
  name?: string;
}

export function Ping({ name = "עולם" }: PingProps) {
  return (
    <Html lang="he" dir="rtl">
      <Head />
      <Preview>ClinicFlow render pipeline — ping</Preview>
      <Body style={{ backgroundColor: "#f8fafb", fontFamily: "Heebo, Arial, sans-serif" }}>
        <Container style={{ maxWidth: "600px", margin: "0 auto", padding: "24px" }}>
          <Text style={{ fontSize: "18px", color: "#1a2332", textAlign: "right" }}>
            שלום {name} — צינור הרינדור עובד ✅
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default Ping;
