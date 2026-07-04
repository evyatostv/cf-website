/**
 * ClinicFlow · React Email → HTML render helper (Deno).
 *
 * Runtime-renders a React Email component to an HTML string using
 * `npm:@react-email/render`. JSX is compiled by Deno via ../deno.json
 * (compilerOptions.jsx = "react-jsx", jsxImportSource = "npm:react").
 *
 * Usage from a wiring function:
 *
 *   import { render } from "../_shared/render.ts";
 *   import { Ping } from "../_shared/emails/ping.tsx";
 *   import { sendEmail } from "../_shared/send-email.ts";
 *
 *   const html = await render(<Ping name="שרון" />);
 *   await sendEmail({ to, subject, html });
 */
import * as React from "react";
import { render as reactEmailRender } from "@react-email/render";

export interface RenderOptions {
  /** Also produce a plaintext version (pass through to sendEmail as `text`). */
  plainText?: boolean;
  /** Pretty-print the HTML (default false — smaller payload). */
  pretty?: boolean;
}

/** Render a React Email element to an email-client-safe HTML string. */
export function render(
  element: React.ReactElement,
  options: RenderOptions = {},
): Promise<string> {
  return reactEmailRender(element, {
    plainText: options.plainText ?? false,
    pretty: options.pretty ?? false,
  });
}
