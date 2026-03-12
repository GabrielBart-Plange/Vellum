# Monetization Shell Backlog (MVP-oriented)

This backlog translates the Monetization Strategy shell into executable work items with clear acceptance criteria and owners. It focuses on a lean, testable MVP path and phased rollout plan (M1 → M6).

## Epics
- Epic 1: Plausible MVP payments (Coins & Tips) wiring
- Epic 2: Subscriptions MVP (Vellum Prime) and revenue pool plumbing
- Epic 3: XP, Levels, and Ascension MVP (Level 0–9 UI and Level 10 go-live)
- Epic 4: Creator monetization bubbles (payouts, coin-to-creator routing)
- Epic 5: Denormalization & Firestore read-storm mitigation
- Epic 6: Gateways routing & currency display rules (GHS-first)

## Phase-wise User Stories (high level)

### Phase M1 – Coins & Tips MVP
- As a reader, I can purchase Essence Coins and use them to tip authors.
- As a creator, I can receive coins as tips and view a basic earnings report.
- As a reader, I see ads in the Free tier and no ads in paid tiers.
- Acceptance criteria:
  - Coin purchases complete via Paystack/Stripe routing for the target region.
  - Tip transactions update the creator balance and transaction history.
  - Basic analytics for coin adoption are collected (purchases, tips).

### Phase M2 – Prime Subscriptions MVP
- As a reader, I can subscribe to Vellum Prime (GHS 15/mo, USD equivalent) and access ad-free reading with early access.
- Acceptance criteria:
  - Subscription purchases integrated with gateway routing (region-aware).
  - Revenue pool tracking starts recording creator shares from subscription revenue.

### Phase M3 – Creator Payouts & Revenue Pool
- As a creator, I qualify for the subscription pool payout and receive a payout cadence.
- Acceptance criteria:
  - Subscriptions revenue pool is calculated (65% to creators).
  - Creator reads-based payout is computed and disbursed.

### Phase M4 – Nexus Tier & XP UI
- Implement Level 0–9 XP UI (ruler bar) and Nexus tier features.
- Acceptance criteria:
  - XP events recorded (read, comment, review, refer).
  - Nexus tier unlocks visible to users meeting criteria.

### Phase M5 – Ascension (Level 10)
- Go-live of one-time Ascension fee (GHS 150).
- Acceptance criteria:
  - Ascension payment flows work; Chronicler benefits enabled.

### Phase M6 – Privilege & Grand Archivist
- Roll out Privilege Chapters and Grand Archivist program.
- Acceptance criteria:
  - Privilege chapters priced and accessible to eligible creators.

## Data & API surface (starter)
- Core entities: Users, Stories, Chapters, Reads, Subscriptions, Coins, XP, Ascensions, Chroniclers, Payments, Revenue, Admin/config.
- MVP endpoints (placeholder):
  - POST /api/payments/coins/purchase
  - POST /api/payments/subscription
  - POST /api/reads/track
  - POST /api/ascensions/trigger
  - GET /api/creators/:id/earnings

## Acceptance criteria (overall)
- Denormalization fix applied to avoid read storms; progress document caching in place.
- Local-first currency display with GHS primary, USD shown for diaspora.
- Gateways wired with region routing rules and basic reconciliation.
- Basic dashboards exist for readers and creators to view earnings and XP progress.

## Risks & mitigations (brief)
- Read storm due to Firestore reads: implement denormalized metadata, caching, and query optimization before monetization goes live.
- Gateway disruptions: implement retry, idempotency, and settlement reconciliation.

Owner notes: This backlog is a living artifact; update with estimates and owners as team alignment grows.
