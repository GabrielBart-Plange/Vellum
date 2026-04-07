'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
    User,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    AuthError,
    GoogleAuthProvider,
    signInWithPopup,
    sendPasswordResetEmail
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { MonetizationProfile, VelluxWallet, VelluxTier } from '@/types';
import { getXPProfile } from '@/lib/monetization/xpService';
import { getInkletWallet } from '@/lib/monetization/coinService';
import { getSubscriptionTier } from '@/lib/monetization/subscriptionService';

interface AuthContextType {
    user: User | null;
    monetization: MonetizationProfile | null;
    loading: boolean;
    monetizationLoading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }): React.ReactElement {
    const [user, setUser] = useState<User | null>(null);
    const [monetization, setMonetization] = useState<MonetizationProfile | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [monetizationLoading, setMonetizationLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Subscribe to auth state changes
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);

            if (user) {
                // Initialize/Sync profile first
                await syncReaderProfile(user);

                // Load monetization data (non-blocking for main login)
                setMonetizationLoading(true);
                try {
                    const [xpResult, walletResult, subResult] = await Promise.all([
                        getXPProfile(user.uid),
                        getInkletWallet(user.uid),
                        getSubscriptionTier(user.uid)
                    ]);

                    const userData = (walletResult as any)._raw || {};
                    const velluxWallets: VelluxWallet[] = [
                        { tier: 'gold' as VelluxTier, amount: userData.vellux_gold_balance || 0, lastReceivedAt: walletResult.updatedAt },
                        { tier: 'diamond' as VelluxTier, amount: userData.vellux_diamond_balance || 0, lastReceivedAt: walletResult.updatedAt },
                        { tier: 'platinum' as VelluxTier, amount: userData.vellux_platinum_balance || 0, lastReceivedAt: walletResult.updatedAt }
                    ];

                    setMonetization({
                        subscriptionTier: subResult.tier,
                        subscriptionExpiresAt: subResult.expiresAt,
                        xpProfile: xpResult,
                        giltBalance: userData.giltBalance ?? 0,
                        inkletWallet: walletResult,
                        velluxWallets: velluxWallets
                    });
                } catch (err) {
                    console.error("Failed to load monetization profile:", err);
                } finally {
                    setMonetizationLoading(false);
                }
            } else {
                setMonetization(null);
            }

            setLoading(false);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);

    const signIn = async (email: string, password: string): Promise<void> => {
        try {
            setError(null);
            setLoading(true);
            await signInWithEmailAndPassword(auth, email, password);
            // User state and profile sync handled by onAuthStateChanged
        } catch (err) {
            const authError = err as AuthError;
            setError(getAuthErrorMessage(authError));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const signInWithGoogle = async (): Promise<void> => {
        try {
            setError(null);
            setLoading(true);
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
            // User state and profile sync handled by onAuthStateChanged
        } catch (err) {
            const authError = err as AuthError;
            setError(getAuthErrorMessage(authError));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const signOut = async (): Promise<void> => {
        try {
            setError(null);
            setLoading(true);

            const authChannel = new BroadcastChannel('auth_sync');
            authChannel.postMessage({ type: 'LOGOUT' });
            authChannel.close();

            await firebaseSignOut(auth);
            setMonetization(null);
        } catch (err) {
            const authError = err as AuthError;
            setError(getAuthErrorMessage(authError));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const resetPassword = async (email: string): Promise<void> => {
        try {
            setError(null);
            setLoading(true);
            await sendPasswordResetEmail(auth, email);
        } catch (err) {
            const authError = err as AuthError;
            setError(getAuthErrorMessage(authError));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const value: AuthContextType = {
        user,
        monetization,
        loading,
        monetizationLoading,
        signIn,
        signInWithGoogle,
        signOut,
        resetPassword,
        error,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// Helper function to convert Firebase Auth error codes to user-friendly messages
function getAuthErrorMessage(error: AuthError): string {
    const errorMessages: Record<string, string> = {
        'auth/invalid-email': 'Please enter a valid email address',
        'auth/user-disabled': 'This account has been disabled',
        'auth/user-not-found': 'No account found with this email',
        'auth/wrong-password': 'Incorrect password',
        'auth/too-many-requests': 'Too many failed attempts. Please try again later',
        'auth/network-request-failed': 'Network error. Please check your connection',
        'auth/invalid-credential': 'Invalid email or password',
    };
    return errorMessages[error.code] || 'An error occurred. Please try again';
}

async function syncReaderProfile(user: User): Promise<void> {
    try {
        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);
        
        let referralId: string;
        let updatePayload: any = {
            email: user.email || '',
            updatedAt: serverTimestamp(),
        };

        if (!snap.exists()) {
            referralId = `ARC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
            
            // Check for attribution from ReferralTracker
            let referredBy = null;
            if (typeof window !== "undefined") {
                referredBy = sessionStorage.getItem("vellum_referral_id");
            }

            updatePayload = {
                ...updatePayload,
                username: user.displayName || user.email?.split('@')[0] || 'Reader',
                roles: ['reader'],
                referralId,
                referredBy,
                createdAt: serverTimestamp(),
            };

            // Trigger referral reward in the background (Archivist's Echo)
            if (referredBy) {
                const { referralService } = await import('@/lib/monetization/referralService');
                referralService.awardReferralBonus(referredBy, user.uid)
                    .catch(err => console.error("[Referral Reward] Failed to trigger redemption:", err));
            }
        } else {
            const data = snap.data();
            const roles = Array.isArray(data.roles) ? data.roles : [];
            const nextRoles = roles.includes('reader') ? roles : [...roles, 'reader'];
            referralId = data.referralId || `ARC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

            updatePayload = {
                ...updatePayload,
                roles: nextRoles,
                referralId,
            };

            if (!data.username) {
                updatePayload.username = user.displayName || user.email?.split('@')[0] || 'Reader';
            }
        }

        await setDoc(ref, updatePayload, { merge: true });
    } catch (error) {
        console.error("Reader profile sync failed:", error);
    }
}
