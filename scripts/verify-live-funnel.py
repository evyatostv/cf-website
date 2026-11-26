#!/usr/bin/env python3
"""Verify the public ClinicFlow funnel after a production deployment."""
from urllib.request import urlopen

checks = {
    "https://www.clinic-flow.co.il/": ["ClinicFlow"],
    "https://www.clinic-flow.co.il/clinic-software-for-private-doctors": ["intent=demo"],
    "https://www.clinic-flow.co.il/contact?intent=demo": ["email"],
    "https://www.clinic-flow.co.il/pricing": ["1,499"],
}
failures = []
for url, needles in checks.items():
    try:
        with urlopen(url, timeout=20) as response:
            html = response.read().decode("utf-8", "ignore")
            status = response.status
    except Exception as exc:
        failures.append(f"{url}: {exc}")
        continue
    missing = [needle for needle in needles if needle not in html]
    if status != 200 or missing:
        failures.append(f"{url}: status={status}, missing={missing}")

home = urlopen("https://www.clinic-flow.co.il/", timeout=20).read().decode("utf-8", "ignore")
if "1,499 ₪ בתשלום חד פעמי" in home or "כל היכולות כלולות במלואן ברישיון ClinicFlow לצמיתות" in home:
    failures.append("homepage still contains the removed price callout")
if failures:
    raise SystemExit("FAIL: live funnel verification\n- " + "\n- ".join(failures))
print("PASS: live ClinicFlow funnel is healthy and homepage price callout is absent")
