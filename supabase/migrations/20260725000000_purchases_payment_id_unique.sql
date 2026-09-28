-- SEC-005: make webhook purchase recording idempotent.
--
-- Problem: a replayed AllPay/Stripe webhook re-INSERTs a `purchases` row because
-- `payment_id` has no uniqueness constraint (see allpay-webhook/index.ts and
-- stripe-webhook). Forgery/replay of the *grant* is already defended (the plan is
-- derived from the signed order_id and re-verified against AllPay), but duplicate
-- purchase rows still accumulate on replay, corrupting accounting / upgrade-credit.
--
-- Fix: collapse existing duplicates, then enforce uniqueness on non-null
-- payment_id so a replay becomes a no-op. Legacy/manual rows may carry a null
-- payment_id, so the index is partial.

-- 1. Collapse existing duplicates, keeping the earliest row per payment_id.
DELETE FROM public.purchases a
USING public.purchases b
WHERE a.payment_id IS NOT NULL
  AND a.payment_id = b.payment_id
  AND (a.purchased_at, a.ctid) > (b.purchased_at, b.ctid);

-- 2. Enforce uniqueness on non-null payment_id.
CREATE UNIQUE INDEX IF NOT EXISTS purchases_payment_id_uniq
  ON public.purchases (payment_id)
  WHERE payment_id IS NOT NULL;
