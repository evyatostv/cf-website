# Historical Stripe payments

Grow is the current ClinicFlow checkout. This callback handles historical Stripe transactions. Check that the correct live webhook signing secret and a server-side Stripe key with read access to PaymentIntents, charges, Checkout Sessions, line items and disputes are configured. A missing key results in a retryable failure. It has no effect on Grow.

The callback verifies the raw event with Stripe's SDK. For each supported live event it looks up the current paid intent, captured charge, and associated Checkout Session. An unpaid completed session waits for a later successful asynchronous notification. Both Checkout and PaymentIntent events resolve to one intent. Older receipts recorded under the session ID are recognized. A signed account UUID, exact ILS amount, historical purchase price, and an independently recorded previous receipt for any upgrade credit are required. Existing configured Checkout Price IDs are also matched. Email alone cannot identify an account.

A fully refunded charge or full lost dispute removes the matching receipt from online activation and download eligibility. A completed partial refund or partial loss requires billing review. An existing entitlement is preserved pending that decision. A previously disabled account is never reactivated by redelivery of its old receipt. Verify disputed charges in the Stripe dashboard before any operator change. No customer email is sent from this callback.

Review delayed notifications in the Stripe Dashboard, then check aggregate settlement counts in the billing database. Signed event bodies, email addresses and raw Stripe errors are excluded from application logs. Missing historical metadata, conflicting credits, and archived accounts require operator reconciliation. Verify ownership and payment evidence before adjusting access.

```sql
select state,count(*) from public.stripe_settlements group by state;
```

[Stripe Checkout fulfillment](https://docs.stripe.com/checkout/fulfillment) · [PaymentIntent](https://docs.stripe.com/api/payment_intents/object) · [Charge](https://docs.stripe.com/api/charges/object) · [Checkout Session lookup](https://docs.stripe.com/api/checkout/sessions/list)
