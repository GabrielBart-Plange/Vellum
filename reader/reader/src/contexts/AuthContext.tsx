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

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }): React.ReactElement {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Subscribe to auth state changes
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);

    const signIn = async (email: string, password: string): Promise<void> => {
        try {
            setError(null);
            setLoading(true);
            const credential = await signInWithEmailAndPassword(auth, email, password);
            await syncReaderProfile(credential.user);
            // User state will be updated by onAuthStateChanged
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
            const credential = await signInWithPopup(auth, provider);
            await syncReaderProfile(credential.user);
            // User state will be updated by onAuthStateChanged
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

            // Broadcast logout event to other tabs/apps immediately
            // This ensures Creator app signs out even if network to Firebase is flaky
            const authChannel = new BroadcastChannel('auth_sync');
            authChannel.postMessage({ type: 'LOGOUT' });
            authChannel.close();

            await firebaseSignOut(auth);
            // User state will be updated by onAuthStateChanged
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
        loading,
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
        const baseProfile = {
            username: user.displayName || user.email?.split('@')[0] || 'Reader',
            email: user.email || '',
        };

        if (!snap.exists()) {
            await setDoc(ref, {
                ...baseProfile,
                roles: ['reader'],
                createdAt: serverTimestamp(),
            }, { merge: true });
        } else {
            const data = snap.data();
            const roles = Array.isArray(data.roles) ? data.roles : [];
            const nextRoles = roles.includes('reader') ? roles : [...roles, 'reader'];
            await setDoc(ref, {
                ...baseProfile,
                roles: nextRoles,
                updatedAt: serverTimestamp(),
            }, { merge: true });
        }
    } catch (error) {
        console.error("Reader profile sync failed:", error);
    }
}
