# Vellum Payout & Operations Blueprint

This document formalizes the payout workflow for Vellum authors, addressing how funds are collected, how earnings are calculated, and how they are dispersed, while ensuring the platform strictly remains profitable (preventing transaction fees from eating the platform cut).

## 1. The Low-Stress Payout Model (MVP)

To protect the platform from fraud, chargebacks, and complex API edge-cases, Vellum will use a **Manual, Net-30, Threshold-based** payout system.

*   **The Ledger System:** Earnings are strictly tracked virtually in Firestore (`CreatorMonetizationProfile.payoutBalance`). No money automatically moves during a tipping event.
*   **The Minimum Threshold:** Authors must accumulate a minimum of **GHS 200** (or $20 for international authors) in their `payoutBalance` before the "Request Withdrawal" button activates.
*   **The Schedule (Net-30):** Authors can submit a withdrawal request at any time. However, to account for clearing times and potential chargebacks, payouts are batched and executed on the **10th of the following month**.
*   **The Method:** The developer manually approves the withdrawal in the Admin panel and executes the transfer via the Paystack Dashboard (for local MoMo) or PayPal/Swift (for international). The `payoutBalance` in Firestore is then zeroed out.

## 2. The Grand Ledger (Who Buys, Who Earns, Who Profits)

Vellum has four distinct purchasable assets. To avoid platform bankruptcy, it is highly critical to properly route this revenue. 

### A. Gilt (The Hard Currency)
*   **Who Buys:** The Reader (to permanently unlock chapters and tip authors).
*   **Who Pays the PSP Fee:** The Dev (Vellum).
*   **Who Earns:** The Author (70% of value) and the Level 9 Pool (5% of value).
*   **Who Profits:** The Dev retains the remaining ~25% after PSP fees.

### B. Inklets (The Soft Currency)
*   **Who Buys:** The Reader (to temporarily unlock chapters/FastPass).
*   **Who Pays the PSP Fee:** The Dev.
*   **Who Earns:** **Nobody.** Inklets are a gamification mechanic. Authors are not paid real cash when a reader uses an Inklet (even a purchased one) to unlock a chapter. If you paid authors for Inklet unlocks, readers could bankrupt you by exploiting free Daily Check-in Inklets.
*   **Who Profits:** **The Dev keeps 100%** of the revenue from purchased Inklets (minus PSP fees).

### C. Subscriptions (Plus & Pro)
*   **Who Buys:** The Reader (for ad-free reading, early access, and monthly bonuses).
*   **Who Pays the PSP Fee:** The Dev.
*   **Who Earns:** **Nobody.** Subscriptions are platform revenue.
*   **Who Profits:** **The Dev keeps 100%** (minus PSP fees). This funds server costs and marketing.

### D. Vellux (Support Tokens / "Golden Castles")
*   **Who Buys:** The Reader (to boost a story's ranking and support the author).
*   **Who Pays the PSP Fee:** The Dev.
*   **Who Earns:** **The Author (30% of the token's value).** In the Webnovel ecosystem, massive gifts (like "Golden Castles") are shared with the creator as a premium tip.
*   **Who Profits:** **The Dev keeps ~70%** (minus PSP fees).

---

## 3. Comprehensive Payment Math (The Finals)

*(Assumption: 1 USD = 12.00 GHS. Lemon Squeezy minimum package is $5.00 to offset the $0.50 flat fee.)*

### Category 1: Gilt (Revenue Shared with Authors)
| Item | Paystack (Local) | Lemon Squeezy ($5 Min) | Dev Cash Received | Owed to Author/Pool | **Dev Net Profit** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Tier 1 (300 Gilt)** | **GHS 60.00** | **$5.00** | LS: $4.25 (GHS 51) / PS: GHS 58.83 | GHS 45.00 | **LS: GHS 6.00 / PS: GHS 13.83** |
| **Tier 2 (600 Gilt)** | **GHS 120.00** | **$10.00** | LS: $9.00 (GHS 108) / PS: GHS 117.66| GHS 90.00 | **LS: GHS 18.00 / PS: GHS 27.66** |
| **Tier 3 (1500 Gilt)**| **GHS 300.00** | **$25.00** | LS: $23.25 (GHS 279) / PS: GHS 294.15| GHS 225.00| **LS: GHS 54.00 / PS: GHS 69.15** |

### Category 2: Subscriptions (100% Dev Profit)
*Note: To bypass the Lemon Squeezy minimums, weekly billing is disabled internationally. Global users are billed monthly.*

| Tier | Paystack (Local) | Lemon Squeezy (Global) | PSP Fee | **Dev Net Profit** |
| :--- | :--- | :--- | :--- | :--- |
| **Plus** | **GHS 10.00** (Weekly) | **$5.00** (Monthly) | LS: $0.75 / PS: GHS 0.20 | **LS: $4.25 (GHS 51/mo) / PS: GHS 9.80/wk** |
| **Pro** | **GHS 30.00** (Monthly)| **$10.00** (Monthly) | LS: $1.00 / PS: GHS 0.59 | **LS: $9.00 (GHS 108/mo) / PS: GHS 29.41/mo** |

### Category 3: Inklet Bundles (100% Dev Profit)
| Bundle | Paystack (Local) | Lemon Squeezy (Global) | PSP Fee | **Dev Net Profit** |
| :--- | :--- | :--- | :--- | :--- |
| **Pouch (100 Inklets)** | **GHS 2.00** | N/A (Too low for LS) | PS: GHS 0.04 | **GHS 1.96** |
| **Chest (500 Inklets)** | **GHS 10.00** | N/A (Too low for LS) | PS: GHS 0.20 | **GHS 9.80** |
| **Coffer (1200+ Inklets)**| **GHS 20.00** | **$5.00** (Premium 3000 Inklets) | LS: $0.75 / PS: GHS 0.39 | **LS: $4.25 (GHS 51) / PS: GHS 19.61** |

### Category 4: Vellux Tokens (High-Tier Author Support)
*Rule: Authors receive a flat 30% of the token's GHS base value.*

| Token | Paystack (Local) | Lemon Squeezy (Global) | Dev Cash Received (After PSP) | Owed to Author (30%) | **Dev Net Profit** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Gold** | **GHS 50.00** | **$5.00** | LS: $4.25 (GHS 51) / PS: GHS 49.02 | **GHS 15.00** | **LS: GHS 36.00 / PS: GHS 34.02** |
| **Diamond** | **GHS 100.00**| **$10.00** | LS: $9.00 (GHS 108) / PS: GHS 98.05 | **GHS 30.00** | **LS: GHS 78.00 / PS: GHS 68.05** |
| **Platinum**| **GHS 250.00**| **$25.00** | LS: $23.25 (GHS 279) / PS: GHS 245.12 | **GHS 75.00** | **LS: GHS 204.00 / PS: GHS 170.12** |

## 4. Recommended Roadmap

1.  **Phase 1 (Database):** Ensure `payoutBalance` reliably increments in GHS during Chapter Purchases and Gilt Tipping.
2.  **Phase 2 (Author UI):** Build the "My Wallet" tab for authors, displaying:
    *   Pending Balance (GHS).
    *   Threshold Progress Bar (e.g., GHS 120 / GHS 200).
    *   "Request Withdrawal" Button (disabled until threshold).
3.  **Phase 3 (Admin UI):** Build a simple admin dashboard table listing `payout_requests` allowing the developer to mark them as "Paid".

---

## Appendix: Multi-Currency & Exchange Rates

A major benefit of using Lemon Squeezy (MoR) is that you do not need to manually configure prices for Euros, Pounds, or Naira.

### How Different Currencies Flow:
1.  **What the Reader Pays:** Vellum's international base prices are set in **USD**. When a user from Germany visits the Lemon Squeezy checkout page, Lemon Squeezy automatically converts the $5.00 base price into Euros (e.g., ~€4.70) based on real-time exchange rates and adds their local VAT. The German user pays in Euros.
2.  **What the Dev Earns:** Lemon Squeezy absorbs the Euros, takes their fee, and converts the remainder back into **USD** in your Dashboard. When payouts occur, that USD is deposited directly via Swift into your bank in Ghana, where your bank converts it to **GHS**.
3.  **What the Author Earns:** Because exchange rates fluctuate daily, tying an author's earnings directly to foreign currencies is an accounting nightmare. Vellum solves this by tying all author earnings to the internal Gilt standard: **10 Gilt = GHS 2.00**. 
    *   *Result:* Regardless of whether a reader bought their Gilt using Euros, Yen, or Dollars, when they tip an author 100 Gilt, the author is owed exactly **GHS 14.00** locally. This completely protects the platform and the authors from forex volatility.
