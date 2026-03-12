Monetization Service (Skeleton)

This folder holds a minimal Express/TypeScript backend skeleton for MVP monetization APIs (coins, subscriptions, reads, ascension). It is not wired into the main repo yet and serves as a starting point for implementation.

What’s included:
- Basic API surface (placeholders)
- Package.json describing dev/build/start scripts
- Simple TS source (src/index.ts) exposing endpoints

Next steps:
- Wire in Firestore access via firebase-admin
- Implement gateway integrations for Paystack/Stripe/Flutterwave
- Add authentication, validation, and error handling
- Integrate with frontend apps via consistent API surface
