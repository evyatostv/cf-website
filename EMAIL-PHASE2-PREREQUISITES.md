# Trial email prerequisites

ClinicFlow Full costs ₪1,499 for the first computer and ₪1,199 for each additional computer on the same account, paid once. Its purchase confirmation comes from a verified Grow order. See [Grow and Make setup](docs/grow-make-setup.md).

The optional trial worker handles three events: an approaching trial end, expiry, and a follow-up for an expired trial. Leave `LIFECYCLE_EMAILS_ENABLED` unset until a supported trial activation flow populates the user's trial plan, start time and expiry, and the intended recipients and sending schedule have been confirmed. A deployed worker requires the existing cron credential. An authenticated invocation with the feature disabled returns before any mail is sent.

Exercise lifecycle changes with synthetic data using `node --test tests/trial-expiration.test.mjs`. The checks cover a paid upgrade racing with expiry, trial extension, prior deactivation, and the set of campaigns the worker can run.

Historical renewal templates are design artifacts. ClinicFlow Full has no annual renewal checkout. Existing updates-end dates are irrelevant to purchase confirmations and trial campaigns. Device activation has a separate server-side flow.
