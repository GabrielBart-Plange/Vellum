# Firestore Schema Starter (Monetization-focused)

This document provides a concise starter schema for the Firestore data model aligned with the monetization shell. It is intentionally lightweight and designed to evolve with implementation details.

Collections and key fields:
- users: userId (string, PK), locale, country, subscriptionId, xp, level, ascensionStatus, coinsBalance, createdAt, lastActive
- stories: storyId, authorId, title, coverImage, tags, createdAt, updatedAt, status
- chapters: chapterId, storyId, title, contentPreview, publishedAt, priceInCoins (optional)
- reads: readId, userId, chapterId, timestamp, duration, completed
- comments: commentId, userId, chapterId, content, createdAt
- subscriptions: subscriptionId, userId, tier (Free|Prime|Nexus), start, end, status
- coins: coinPackId, userId, amount, price, purchasedAt
- xp: userId, level, currentXp, xpHistory
- ascensions: userId, ascended, ascensionDate
- chroniclers: userId, tier, active, monthlyPayoutShare
- payments: paymentId, userId, gateway, amount, currency, status, createdAt
- revenue: poolType (subscription, coins, tips), amount, date
- admin/config: thresholds, pricePoints, etc.

Notes:
- This is a baseline starter; adjust field names/types to fit your persistence and ORM choices.
- Consider indexes for userId, chapterId, storyId, and composite queries (e.g., reads by userId, by month).
