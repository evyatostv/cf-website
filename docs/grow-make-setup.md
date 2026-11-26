# Grow payments through Make

ClinicFlow uses the existing Supabase Edge Function architecture. The public payment initializer is `POST /functions/v1/create-grow-payment`; the callback is `POST /functions/v1/grow-webhook`. There is no Next.js `/api` route in this repository.

## Vercel/Supabase secrets

Set these as server-side Supabase Edge Function secrets (never `VITE_` and never browser-exposed):

- `MAKE_PAYMENT_WEBHOOK_URL`: the Make Custom Webhook URL that starts the payment-link scenario.
- `MAKE_GROW_NOTIFY_URL`: the HTTPS Make notification trigger from scenario 2, distinct from the link-creation trigger. Grow posts its event here.
- `MAKE_CALLBACK_SECRET`: long random secret shared only with Make’s HTTP callback module.
- `NEXT_PUBLIC_APP_URL`: `https://www.clinic-flow.co.il` (used server-side here for return URLs; despite the name it must not be placed in client-exposed Vite env files).
- `SITE_URL`: optional backward-compatible fallback for the return URL.

## Make scenario 1 — create the payment link

1. Add **Webhooks → Custom webhook** and copy its URL into `MAKE_PAYMENT_WEBHOOK_URL`.
2. Add **Grow → Create Payment Link** with the merchant connection. Choose sending mode **none**, payment type **payments** and one product.
3. Map the incoming webhook bundle as shown below. The server sends a numeric price in shekels and a separate amount in agorot. For the first paid seat these are `1499` and `149900`; for each additional seat on the same eligible account they are `1199` and `119900`. Always use the stored order values. An additional-seat link issued earlier at the former price can still settle for its original amount. New checkout requests for that pending order go to support to reconcile the old link before issuing another.

| Grow field | Value in Make |
| --- | --- |
| Product Name | `packageName` |
| Price | `price` as a single numeric token |
| Currency (if shown) | `currency` (`ILS`) |
| Quantity | Fixed number `1` |
| Full Name | `customer.fullName` |
| Phone | `customer.phone` as text, preserving the leading zero |
| Email | `customer.email` |
| Notify URL | `notifyUrl` |
| Success URL | `successUrl` |
| Cancellation URL (if available) | `cancelUrl` |
| Custom field 1 | `orderId` |

4. Use the merchant’s configured VAT type. The expected checkout total is ₪1,499 for one license. If Make reports an invalid price, inspect the Price mapping for an extra currency token. If the name or phone is empty, inspect the nested `customer` object in that execution. Keep the scenario failed when required customer data is missing so support can investigate the order.
5. Return the Grow output payment URL to the caller using Make’s webhook response module as `{ "paymentUrl": "<Grow payment URL>" }`.

The Grow connection is created in Make via Grow (production) or Grow Sandbox. Grow’s own interface performs OTP verification. Do not put the business identifier or OTP in source control or send it to ClinicFlow.

## Make scenario 2 — payment notification

1. Add **Grow → Notify URL Webhook** and configure the same Grow connection.
2. Map the Grow notification’s order/custom field, transaction identifier, status, amount, and currency.
3. Use **Grow → Approve Transaction** to acknowledge the notification. Before forwarding a paid event, independently verify the captured transaction, order reference, charged amount and currency using the merchant connection. If the integration cannot supply that evidence, hold the order for reconciliation.
4. Add **HTTP → Make a request** to `https://<supabase-project>.supabase.co/functions/v1/grow-webhook`, POST JSON `{ orderId, transactionId, status, amount, currency }`, and add header `x-make-callback-secret: <MAKE_CALLBACK_SECRET>`. Send canonical `paid` only for a verified capture and express the charged amount in agorot. A generic approval, a successful API request and the customer’s return URL each carry insufficient evidence of settlement.

A notification missing its transaction ID is rejected. An authenticated settled transaction with a mismatched amount or currency places a pending order in manual review.

## Testing

Use a Grow Sandbox connection. The official sandbox test card `4580458045804580` is for regular single-payment tests; wallet methods may create real charges even in sandbox. Test success, failed/cancelled status, duplicate callbacks, wrong amount, missing transaction ID, and returning before callback. Verify the order becomes `PAID`, `user_access.is_active` becomes true, and exactly one `purchases` row/license key exists.

## Operational notes

Apply the migration before enabling the scenario. Existing Allpay/Stripe flows remain untouched. Payment data contains order/transaction information only; patient data is never sent to Grow or Make. Refunds are manual through Grow/Make’s **Refund Transaction** action and should be followed by an authorized internal review before revoking access.

## התאמת רישיון להחזר או להכחשת עסקה

אישור תשלום ב־Grow וזיכוי ב־Grow הם פעולות נפרדות. לפני שינוי רישיון בודקים במערכת הסוחר את ההזמנה, מזהה החיוב המקורי, הסכום, המטבע ומספר האסמכתה של הזיכוי או של ההכרעה הסופית. בהחזר חלקי או בהכחשת עסקה שעדיין פתוחה, משאירים את הרישיון פעיל ומעבירים לבדיקה. את הפעולה הכספית מבצעים במערכת הסוחר. כלי התמיכה שלהלן מעדכן את הרישיון לאחר קבלת האישור.

מפעיל עם הרשאת ניהול למסד הנתונים של ClinicFlow יכול להריץ מתוך מאגר האתר את הבדיקה הבאה. מחליפים את הערכים שבסוגריים המסולסלים בפרטים המאומתים של אותה עסקה.

```sh
node scripts/reconcile-grow-reversal.mjs \
  --order '{CLINICFLOW_ORDER_UUID}' --capture '{ORIGINAL_GROW_TRANSACTION_ID}' \
  --amount-agorot '{ORIGINAL_CHARGED_AGOROT}' --currency ILS --kind full_refund \
  --reference '{GROW_REFUND_REFERENCE}'
```

הבדיקה מחזירה `READY` ומציגה כמה רישיונות Grow יישארו בחשבון. רק לאחר התאמה מלאה, מריצים שוב את אותה פקודה עם `--apply --confirm-order '{CLINICFLOW_ORDER_UUID}'`. להכרעה סופית בהכחשת עסקה לטובת בעל הכרטיס משתמשים ב־`--kind lost_chargeback` ובאסמכתת ההכרעה. כל שינוי מתועד לפי הזמנה ואסמכתה. השדה recorded_by עשוי להכיל תפקיד מסד נתונים משותף. לתיעוד זהות המפעיל שומרים ברשומת התמיכה את שמו ואת אותה אסמכתה. הרצה חוזרת של אותה התאמה תחזיר `ALREADY_RECORDED`.

השרת פוסל את הרישיון של אותה עסקה. מחשב אחר ששויך לרכישה תקפה ממשיך לעבוד. כשלא נותר רישיון מתאים, השרת מפסיק להנפיק קישורי הורדה חדשים. לקישור שכבר הונפק יש תוקף של עד חמש דקות. מחשב שעובד ללא אינטרנט יוכל לקבל את השינוי בבדיקת הרישוי הבאה כשהוא מחובר. נתוני המטופלים נשארים במחשב.

Grow מתעדת פעולה מפורשת לזיכוי מלא או חלקי. יש לוודא בחשבון הסוחר אם קיימת התראה מאומתת המתאימה לסוג האירוע לפני שמפעילים טיפול אוטומטי. [פעולות Grow ב־Make](https://developers.grow.business/docs/grow-app-for-make) · [התראות Grow](https://developers.grow.business/docs/webhooks)

## Lost payment link

A connection timeout can leave an order pending with no URL. Give the customer the status link shown after checkout. Use the ClinicFlow order UUID to match its Make execution and Grow merchant record. If a payable link or an unresolved charge exists, keep the order pending and reconcile it through Grow. A time limit or the customer's report alone cannot establish that a link is unpaid.

Once Grow confirms there was no capture **and** no checkout link can still be paid, record the merchant case reference. After one hour, an authorized database operator can preview closure in the linked project:

```sql
select public.support_close_unpaid_grow_link('<order-uuid>', '<merchant-case-reference>');
```

Only a `READY` result permits closure. Run the same command with a third argument `true` to mark this order cancelled and allow the customer to restart checkout. The reference remains recorded against this order. Any later unexpected capture goes to manual review for reconciliation. This command makes no request to Grow and cannot cancel an active payment link, refund a customer, or grant a license.

### זיהוי המחשב לפני זיכוי

כששתי רכישות הן בסך ₪1,499, הסכום לבדו אינו מזהה מחשב. בכל הפעלה השרת משייך את המחשב לרכישה פנויה. בבדיקה המקדימה מצמידים את מזהה ההזמנה למזהה החיוב של Grow. השדה `remaining_grow_seats` מציג את מספר הרישיונות מרכישות Grow שיישארו. רישיון היסטורי תקף, אם קיים, נבדק בנפרד.

אם שויך מחשב לרכישה שזוכתה, בדיקת הרישוי המקוונת הבאה תשלול את הגישה של אותו מחשב. המחשב ששויך לרכישה התקפה ממשיך לעבוד. אם המחשב שזוכה היה המחשב הראשי, השירות מעדכן את השיוך הראשי למחשב שכבר הופעל ברכישה התקפה. זיכוי רכישה שעדיין לא שויכה למחשב מקטין את מספר ההפעלות הפנויות. חזרה על אותה אסמכתה לאותו חיוב אינה מבטלת רישיון נוסף.

### Read-only production preflight

From a linked production checkout with an authenticated Supabase CLI, run
`node scripts/checkout-readiness.mjs win mac` (or specify just the customer's platform).
Exit 0 means the listed static prerequisites pass on every requested platform.
Exit 2 means prerequisites are missing or the effective bucket/provider is overridden
and needs verification. Exit 1 means the inspection could not be completed.
Only metadata, function versions and boolean checks are printed. This command
does not open an order, call Make, download an installer or process payment.
A nonempty installer needs independent signature and install verification.
Presence of a secret cannot verify its value, Make scenario activation or mapping.
Only a separately authorized end-to-end payment observation can confirm capture,
authenticated notification and paid delivery together.
