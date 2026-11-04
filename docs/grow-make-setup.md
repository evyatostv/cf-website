# Grow payments through Make

ClinicFlow uses the existing Supabase Edge Function architecture. The public payment initializer is `POST /functions/v1/create-grow-payment`; the callback is `POST /functions/v1/grow-webhook`. There is no Next.js `/api` route in this repository.

## Vercel/Supabase secrets

Set these as server-side Supabase Edge Function secrets (never `VITE_` and never browser-exposed):

- `MAKE_PAYMENT_WEBHOOK_URL`: the Make Custom Webhook URL that starts the payment-link scenario.
- `MAKE_CALLBACK_SECRET`: long random secret shared only with Make’s HTTP callback module.
- `NEXT_PUBLIC_APP_URL`: `https://www.clinic-flow.co.il` (used server-side here for return URLs; despite the name it must not be placed in client-exposed Vite env files).
- `SITE_URL`: optional backward-compatible fallback for the return URL.

## Make scenario 1 — create the payment link

1. Add **Webhooks → Custom webhook** and copy its URL into `MAKE_PAYMENT_WEBHOOK_URL`.
2. Add **Grow → Create Payment Link** with a manually-created Grow production connection. Use **sending mode `none`**, payment type **payments**, and the incoming `amount`, `packageName`, customer name, email, phone, and `orderId` values.
3. Use one product: product name `packageName`, price `amount / 100`, quantity `1`, and the merchant’s configured VAT type. Set **Notify URL** to the incoming `notifyUrl`, **Success URL** to `successUrl`, and custom field 1 to `orderId`.
4. Return the Grow output payment URL to the caller using Make’s webhook response module as `{ "paymentUrl": "<Grow payment URL>" }`.

The Grow connection is created in Make via Grow (production) or Grow Sandbox. Grow’s own interface performs OTP verification. Do not put the business identifier or OTP in source control or send it to ClinicFlow.

## Make scenario 2 — payment notification

1. Add **Grow → Notify URL Webhook** and configure the same Grow connection.
2. Map the Grow notification’s order/custom field, transaction identifier, status, amount, and currency.
3. Add **Grow → Approve Transaction** after the notification is received.
4. Add **HTTP → Make a request** to `https://<supabase-project>.supabase.co/functions/v1/grow-webhook`, POST JSON `{ orderId, transactionId, status, amount, currency }`, and add header `x-make-callback-secret: <MAKE_CALLBACK_SECRET>`.

If a notification lacks a transaction ID or the amount/currency does not match the pending order, ClinicFlow records `MANUAL_REVIEW` and does not activate a license.

## Testing

Use a Grow Sandbox connection. The official sandbox test card `4580458045804580` is for regular single-payment tests; wallet methods may create real charges even in sandbox. Test success, failed/cancelled status, duplicate callbacks, wrong amount, missing transaction ID, and returning before callback. Verify the order becomes `PAID`, `user_access.is_active` becomes true, and exactly one `purchases` row/license key exists.

## Operational notes

Apply the migration before enabling the scenario. Existing Allpay/Stripe flows remain untouched. Payment data contains order/transaction information only; patient data is never sent to Grow or Make. Refunds are manual through Grow/Make’s **Refund Transaction** action and should be followed by an authorized internal review before revoking access.
