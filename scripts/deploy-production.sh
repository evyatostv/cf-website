#!/bin/sh
set -eu

npm run typecheck
npm run build
npx vercel --prod

echo "Deployment finished. Verify:"
echo "  https://www.clinic-flow.co.il/"
echo "  https://www.clinic-flow.co.il/clinic-software-for-private-doctors"
echo "  https://www.clinic-flow.co.il/contact?intent=demo"
echo "  https://www.clinic-flow.co.il/pricing"
python3 ../research/marketing/verify_live_funnel.py
