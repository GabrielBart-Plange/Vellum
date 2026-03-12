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
import { MonetizationProfile } from '@/types';
import { getXPProfile } from '@/lib/monetization/xpService';
import { getEssenceWallet } from '@/lib/monetization/coinService';
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
                        getEssenceWallet(user.uid),
                        getSubscriptionTier(user.uid)
                    ]);

                    setMonetization({
                        subscriptionTier: subResult.tier,
                        subscriptionExpiresAt: subResult.expiresAt,
                        xpProfile: xpResult,
                        essenceWallet: walletResult
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
        const hasExistsMethod = typeof (snap as { exists?: unknown } | undefined)?.exists === 'function';
        if (!hasExistsMethod || !(snap as { exists: () => boolean }).exists()) {
            await setDoc(ref, {
                username: user.displayName || user.email?.split('@')[0] || 'Reader',
                email: user.email || '',
                roles: ['reader'],
                createdAt: serverTimestamp(),
            }, { merge: true });
        } else {
            const data = (snap as { data: () => Record<string, unknown> }).data();
            const roles = Array.isArray(data.roles) ? data.roles : [];
            const nextRoles = roles.includes('reader') ? roles : [...roles, 'reader'];

            // Only update email and roles, preserve custom username if it exists
            const updatePayload: { email: string; roles: string[]; updatedAt: ReturnType<typeof serverTimestamp>; username?: string } = {
                email: user.email || '',
                roles: nextRoles,
                updatedAt: serverTimestamp(),
            };

            // Only set a default username if the field is currently missing/empty in Firestore
            if (!data.username) {
                updatePayload.username = user.displayName || user.email?.split('@')[0] || 'Reader';
            }

            await setDoc(ref, updatePayload, { merge: true });
        }
    } catch (error) {
        console.error("Reader profile sync failed:", error);
    }
}
