# Verify an existing Grow Sandbox payment

Use a dedicated authenticated Make scenario containing only **Get Payment Link Info**
on the Grow Sandbox connection. The test requires an already-paid sandbox charge
of ₪2,698 for two computer licenses. The scenario returns the normalized fields
documented in [the Make integration guide](../../docs/grow-make-setup.md).

Install the test dependency with `npm install --prefix scripts/grow-sandbox-qa` on a
machine running Node 24 or newer. Run `node scripts/grow-sandbox-qa/verify.mjs --setup-only`
to check that its temporary PostgreSQL server starts on loopback port 54863.
Run `node scripts/grow-sandbox-qa/verify.mjs --stdin` with an input stream from
your secret manager. Its JSON object accepts these keys:

- `readbackUrl` and `apiKey` for the dedicated sandbox Make readback scenario.
- `paymentLinkProcessId`, `paymentLinkProcessToken` and `transactionId` for the
  verified sandbox payment.
- Optional `orderId` when the sandbox link contains the original ClinicFlow UUID.

Alternatively, provide `MAKE_GROW_READBACK_URL`, `MAKE_GROW_READBACK_KEY`,
`GROW_SANDBOX_LINK_ID`, `GROW_SANDBOX_LINK_TOKEN`, `GROW_SANDBOX_TRANSACTION_ID`
and optional `GROW_SANDBOX_ORDER_ID` through the environment and omit `--stdin`.
Keep actual values out of command arguments, shell history, support tickets and git.

The script runs the actual edge handler and provider-validation source twice,
with a local database adapter and real HTTPS requests to Make. Success requires
both merchant readbacks, exactly two local seats, a single local purchase and one
queued receipt. The local database is discarded. This tests merchant readback and
replay behavior independently of the real Grow notification transport and email delivery.
