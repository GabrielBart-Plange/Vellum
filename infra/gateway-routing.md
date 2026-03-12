# Gateway Routing Strategy (MVP)

This document captures the regional routing strategy for payments and currencies, per the monetization shell.

Routing table (summary):
- Ghana / West Africa: Paystack (MoMo, local cards)
- Nigeria: Paystack (NGN pricing)
- Europe / North America: Stripe (USD/EUR)
- Rest of world: Flutterwave (fallback)

Fee expectations (illustrative):
- Paystack Ghana: 1.95%
- Paystack Nigeria: 1.5% + NGN 100
- Stripe international: 2.9% + $0.30
- Flutterwave Africa: 1.4% + $0.20

Display rules:
- Always display prices in local currency (GHS primary); USD shown only for diaspora.
- MoMo CTA is primary for Ghanaian users.

Notes:
- Build reconciliation hooks to map gateway settlements to creator payouts; ensure idempotent operations for retries.
