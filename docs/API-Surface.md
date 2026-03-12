# API Surface (Monetization MVP) – Placeholder

This document sketches the minimal API surface required to support the MVP monetization flows. Implementations should align with the data model in Firestore and gateway integrations.

Endpoints (placeholders):
- POST /api/payments/coins/purchase
- POST /api/payments/subscription
- POST /api/reads/track
- POST /api/ascensions/trigger
- GET /api/creators/:id/earnings
- POST /api/creators/:id/tip

Key payloads (examples):
- coins purchase: { userId, amountCoins, gateway, currency }
- subscription: { userId, tier }
- track read: { userId, chapterId, action: 'read'|'comment'|'review' }
- ascension: { userId, action }

Security:
- Auth tokens or session management per existing app; ensure CORS and environment handling are per project standards.

Notes:
- This is a placeholder surface to anchor planning. Exact shapes will be refined during API scoping.
