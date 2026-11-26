# Historical Allpay payments

ClinicFlow checkout uses Grow. The legacy Allpay callback accepts historical notifications using the api11 signature and authenticates a separate merchant lookup for the same order, currency and amount. It binds the full account ID supplied at initiation to the original account and recorded plan. This callback sends no email. Current lifetime pricing is ₪1,499; older basic, professional and full product links retain their historical pricing for settlement and supported upgrade credit.

A successful notification writes its payment evidence and purchase in one transaction. Existing purchase records and previously settled references cannot reactivate a disabled license on replay. A confirmed full refund excludes that receipt from download and online activation eligibility. A surviving verified historical tier stays available. Partial refunds require a billing decision and preserve an existing entitlement. Financial purchase history is retained.

For a report of an old charge, confirm the order reference and live status in the merchant dashboard. A source-independent status check is essential because the api11 example signature omits numeric JSON values. Under api11, status 1 means paid, 3 fully refunded and 4 partially refunded. Unknown accounts, conflicting IDs, amounts, currencies, and unproven upgrade credits go to reconciliation. Restrict access to the dashboard and billing database to authorized staff. Inspect partial cases with an aggregate query first.

```sql
select state, count(*) from public.allpay_settlements group by state;
```

A provider-side reversal only reaches this handler when a signed callback is delivered and its fresh status lookup sees the reversal. For a refund made directly in the merchant dashboard, verify eligibility independently and reconcile the reference with support. Chargeback and token event formats require separate handling. The api11 status response does not guarantee a test-mode indicator; ensure the configured merchant credentials belong to the live integration before enabling a legacy provider. No historical account rows are backfilled by the migration.

[Allpay api11 reference and signing example](https://www.allpay.co.il/en/api-reference) · [Allpay version history and current event delivery limits](https://allpay.to/docs/api-reference.htm)
