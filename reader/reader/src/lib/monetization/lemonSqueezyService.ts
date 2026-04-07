import { db } from "@/lib/firebase";
import { doc, getDoc, Timestamp } from "firebase/firestore";

const LEMONSQUEEZY_API_KEY = process.env.LEMONSQUEEZY_API_KEY;
const LEMONSQUEEZY_STORE_ID = process.env.LEMONSQUEEZY_STORE_ID;
const API_BASE = "https://api.lemonsqueezy.com/v1";

interface CheckoutOptions {
    userId: string;
    userEmail: string;
    variantId: string; // LemonSqueezy Variant ID for the Inklet package
    embed?: boolean;
}

/**
 * Service for handling LemonSqueezy global payments
 */
export const lemonSqueezyService = {
    /**
     * Creates a checkout URL for a specific Inklet package
     */
    async createCheckout(options: CheckoutOptions) {
        try {
            const response = await fetch(`${API_BASE}/checkouts`, {
                method: "POST",
                headers: {
                    "Accept": "application/vnd.api+json",
                    "Content-Type": "application/vnd.api+json",
                    "Authorization": `Bearer ${LEMONSQUEEZY_API_KEY}`
                },
                body: JSON.stringify({
                    data: {
                        type: "checkouts",
                        attributes: {
                            checkout_data: {
                                email: options.userEmail,
                                custom: {
                                    user_id: options.userId
                                }
                            }
                        },
                        relationships: {
                            store: {
                                data: {
                                    type: "stores",
                                    id: LEMONSQUEEZY_STORE_ID
                                }
                            },
                            variant: {
                                data: {
                                    type: "variants",
                                    id: options.variantId
                                }
                            }
                        }
                    }
                })
            });

            const data = await response.json();
            return data.data.attributes.url;
        } catch (error) {
            console.error("Error creating LemonSqueezy checkout:", error);
            throw error;
        }
    },

    /**
     * Logic for validating webhooks from LemonSqueezy
     * Note: This should be used in an API route
     */
    validateWebhookSignature(body: string, signature: string, secret: string) {
        // Implementation for crypto signature verification
        // (Standard HMAC-SHA256)
    }
};
