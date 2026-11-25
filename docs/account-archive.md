# Account closure

The daily worker processes requests after their seven-day cancellation period. Each request uses its authenticated account ID. A new signup with the same email receives a different ID and must establish its own entitlement.

Closing an account removes its login and device access and detaches its orders and purchases. Order and capture identifiers, payment amounts, timestamps and any verified reversals remain available for financial reconciliation. Archived orders cannot grant a license. A verified payment arriving after closure requires a merchant review in Grow before a refund decision. The worker never refunds money. Storage owned by the account pauses erasure for support review. An unexpected database error rolls back every change for that request.

The audit log retains the request ID, a hash of the email and the completion date. A hashed email can still be matched with a known email. Set retention periods for the financial ledger, consent evidence, deletion audit and separate email-only marketing records with the person responsible for privacy and accounting. This change does not set those periods. Offline installations may keep working until their next license check. Local clinical data remains on the clinician’s device.
