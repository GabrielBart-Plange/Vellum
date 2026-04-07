import { lemonSqueezyService } from "./lemonSqueezyService";
import { purchaseInklets as paystackPurchase } from "./coinService";

type PaymentProvider = 'lemonsqueezy' | 'paystack' | 'mock';

interface PurchaseParams {
    userId: string;
    userEmail: string;
    amount: number;
    packageId?: string; // Specific ID for LemonSqueezy variants
    provider?: PaymentProvider;
}

/**
 * Orchestrator for hybrid payment routing
 */
export const paymentFactory = {
    /**
     * Determines the best provider based on user metadata or explicit choice
     */
    async initiateInkletPurchase(params: PurchaseParams) {
        const provider = params.provider || this.determineBestProvider();

        if (provider === 'lemonsqueezy') {
            if (!params.packageId) throw new Error("Package ID required for LemonSqueezy");
            return {
                type: 'url',
                url: await lemonSqueezyService.createCheckout({
                    userId: params.userId,
                    userEmail: params.userEmail,
                    variantId: params.packageId
                })
            };
        }

        if (provider === 'paystack') {
            // Existing Paystack flow
            return {
                type: 'paystack',
                userId: params.userId,
                amount: params.amount
            };
        }

        // Default to mock for dev
        return { type: 'mock', success: true };
    },

    /**
     * Logic to detect if user should use Paystack (Local) or LemonSqueezy (Global)
     * In a real app, this would use a Geo-IP service or user settings
     */
    determineBestProvider(): PaymentProvider {
        // For now, default to LemonSqueezy for global robustness
        // But can be extended with window.navigator.language or similar checks
        return 'lemonsqueezy';
    }
};
