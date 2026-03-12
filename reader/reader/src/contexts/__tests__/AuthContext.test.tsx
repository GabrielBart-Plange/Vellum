/**
 * Unit Tests for AuthContext
 * Feature: reader-engagement-enhancements
 * Requirements: 1.4, 1.6, 1.8
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { ReactNode } from 'react';
import { AuthProvider, useAuth } from '../AuthContext';
import { auth } from '@/lib/firebase';
import {
    User,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    AuthError,
} from 'firebase/auth';

// Mock Firebase modules
jest.mock('@/lib/firebase', () => ({
    auth: {
        currentUser: null,
    },
}));

jest.mock('firebase/auth', () => ({
    signInWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChanged: jest.fn(),
    GoogleAuthProvider: jest.fn(),
    signInWithPopup: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
    doc: jest.fn(),
    getDoc: jest.fn(),
    setDoc: jest.fn(),
    serverTimestamp: jest.fn(),
}));

jest.mock('@/lib/monetization/xpService', () => ({
    getXPProfile: jest.fn().mockResolvedValue({
        xp: 0,
        level: 0,
        isChronicler: false,
        chroniclerStatus: 'none',
        legacyPoints: 0,
        updatedAt: { toMillis: () => Date.now() }
    }),
}));

jest.mock('@/lib/monetization/coinService', () => ({
    getEssenceWallet: jest.fn().mockResolvedValue({
        balance: 0,
        lifetimeEarned: 0,
        lifetimeSpent: 0,
        updatedAt: { toMillis: () => Date.now() }
    }),
}));

jest.mock('@/lib/monetization/subscriptionService', () => ({
    getSubscriptionTier: jest.fn().mockResolvedValue({
        tier: 'free',
        expiresAt: null
    }),
}));

describe('AuthContext Unit Tests', () => {
    const mockUser: Partial<User> = {
        uid: 'test-uid-123',
        email: 'test@example.com',
        displayName: 'Test User',
    };

    const wrapper = ({ children }: { children: ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
    );

    beforeEach(() => {
        jest.clearAllMocks();

        // Default mock for onAuthStateChanged - no user initially
        (onAuthStateChanged as jest.Mock).mockImplementation((authInstance, callback) => {
            callback(null);
            return jest.fn(); // Return unsubscribe function
        });
    });

    describe('Sign-in scenarios', () => {
        test('should successfully sign in with valid credentials', async () => {
            // Mock successful sign-in
            (signInWithEmailAndPassword as jest.Mock).mockResolvedValueOnce({
                user: mockUser,
            });

            // Mock onAuthStateChanged to update user after sign-in
            let authCallback: ((user: User | null) => void) | null = null;
            (onAuthStateChanged as jest.Mock).mockImplementation((authInstance, callback) => {
                authCallback = callback;
                callback(null); // Start with no user
                return jest.fn();
            });

            const { result } = renderHook(() => useAuth(), { wrapper });

            // Wait for initial loading to complete
            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            // Perform sign-in
            await act(async () => {
                await result.current.signIn('test@example.com', 'password123');
            });

            // Simulate Firebase updating the auth state
            await act(async () => {
                if (authCallback) {
                    await (authCallback as any)(mockUser as User);
                }
            });

            // Wait for user and monetization to load
            await waitFor(() => {
                expect(result.current.loading).toBe(false);
                expect(result.current.monetizationLoading).toBe(false);
            });

            // Verify sign-in was called with correct credentials
            expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
                auth,
                'test@example.com',
                'password123'
            );

            // Verify user is set after auth state change
            await waitFor(() => {
                expect(result.current.user).not.toBeNull();
                expect(result.current.user?.uid).toBe('test-uid-123');
                expect(result.current.user?.email).toBe('test@example.com');
            });

            // Verify no error
            expect(result.current.error).toBeNull();
        });

        test('should handle sign-in failure with invalid email', async () => {
            const authError: Partial<AuthError> = {
                code: 'auth/invalid-email',
                message: 'Invalid email',
                name: 'FirebaseError',
            };

            (signInWithEmailAndPassword as jest.Mock).mockRejectedValueOnce(authError);

            const { result } = renderHook(() => useAuth(), { wrapper });

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            // Attempt sign-in with invalid email
            await act(async () => {
                try {
                    await result.current.signIn('invalid-email', 'password123');
                } catch (error) {
                    // Expected to throw
                }
            });

            // Verify error message is set
            expect(result.current.error).toBe('Please enter a valid email address');
            expect(result.current.user).toBeNull();
        });

        test('should handle sign-in failure with wrong password', async () => {
            const authError: Partial<AuthError> = {
                code: 'auth/wrong-password',
                message: 'Wrong password',
                name: 'FirebaseError',
            };

            (signInWithEmailAndPassword as jest.Mock).mockRejectedValueOnce(authError);

            const { result } = renderHook(() => useAuth(), { wrapper });

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            await act(async () => {
                try {
                    await result.current.signIn('test@example.com', 'wrongpassword');
                } catch (error) {
                    // Expected to throw
                }
            });

            expect(result.current.error).toBe('Incorrect password');
            expect(result.current.user).toBeNull();
        });

        test('should handle sign-in failure with user not found', async () => {
            const authError: Partial<AuthError> = {
                code: 'auth/user-not-found',
                message: 'User not found',
                name: 'FirebaseError',
            };

            (signInWithEmailAndPassword as jest.Mock).mockRejectedValueOnce(authError);

            const { result } = renderHook(() => useAuth(), { wrapper });

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            await act(async () => {
                try {
                    await result.current.signIn('nonexistent@example.com', 'password123');
                } catch (error) {
                    // Expected to throw
                }
            });

            expect(result.current.error).toBe('No account found with this email');
            expect(result.current.user).toBeNull();
        });

        test('should handle sign-in failure with too many requests', async () => {
            const authError: Partial<AuthError> = {
                code: 'auth/too-many-requests',
                message: 'Too many requests',
                name: 'FirebaseError',
            };

            (signInWithEmailAndPassword as jest.Mock).mockRejectedValueOnce(authError);

            const { result } = renderHook(() => useAuth(), { wrapper });

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            await act(async () => {
                try {
                    await result.current.signIn('test@example.com', 'password123');
                } catch (error) {
                    // Expected to throw
                }
            });

            expect(result.current.error).toBe('Too many failed attempts. Please try again later');
        });

        test('should handle sign-in failure with network error', async () => {
            const authError: Partial<AuthError> = {
                code: 'auth/network-request-failed',
                message: 'Network error',
                name: 'FirebaseError',
            };

            (signInWithEmailAndPassword as jest.Mock).mockRejectedValueOnce(authError);

            const { result } = renderHook(() => useAuth(), { wrapper });

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            await act(async () => {
                try {
                    await result.current.signIn('test@example.com', 'password123');
                } catch (error) {
                    // Expected to throw
                }
            });

            expect(result.current.error).toBe('Network error. Please check your connection');
        });

        test('should handle sign-in failure with invalid credentials', async () => {
            const authError: Partial<AuthError> = {
                code: 'auth/invalid-credential',
                message: 'Invalid credential',
                name: 'FirebaseError',
            };

            (signInWithEmailAndPassword as jest.Mock).mockRejectedValueOnce(authError);

            const { result } = renderHook(() => useAuth(), { wrapper });

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            await act(async () => {
                try {
                    await result.current.signIn('test@example.com', 'password123');
                } catch (error) {
                    // Expected to throw
                }
            });

            expect(result.current.error).toBe('Invalid email or password');
        });

        test('should handle sign-in failure with unknown error code', async () => {
            const authError: Partial<AuthError> = {
                code: 'auth/unknown-error',
                message: 'Unknown error',
                name: 'FirebaseError',
            };

            (signInWithEmailAndPassword as jest.Mock).mockRejectedValueOnce(authError);

            const { result } = renderHook(() => useAuth(), { wrapper });

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            await act(async () => {
                try {
                    await result.current.signIn('test@example.com', 'password123');
                } catch (error) {
                    // Expected to throw
                }
            });

            expect(result.current.error).toBe('An error occurred. Please try again');
        });

        test('should clear previous error on new sign-in attempt', async () => {
            // First attempt - fail
            const authError: Partial<AuthError> = {
                code: 'auth/wrong-password',
                message: 'Wrong password',
                name: 'FirebaseError',
            };

            (signInWithEmailAndPassword as jest.Mock)
                .mockRejectedValueOnce(authError)
                .mockResolvedValueOnce({ user: mockUser });

            let authCallback: ((user: User | null) => void) | null = null;
            (onAuthStateChanged as jest.Mock).mockImplementation((authInstance, callback) => {
                authCallback = callback;
                callback(null);
                return jest.fn();
            });

            const { result } = renderHook(() => useAuth(), { wrapper });

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            // First attempt - should fail
            await act(async () => {
                try {
                    await result.current.signIn('test@example.com', 'wrongpassword');
                } catch (error) {
                    // Expected to throw
                }
            });

            expect(result.current.error).toBe('Incorrect password');

            // Second attempt - should succeed and clear error
            await act(async () => {
                await result.current.signIn('test@example.com', 'correctpassword');
            });

            // Simulate auth state update
            await act(async () => {
                if (authCallback) {
                    await (authCallback as any)(mockUser as User);
                }
            });

            await waitFor(() => {
                expect(result.current.error).toBeNull();
                expect(result.current.user).not.toBeNull();
                expect(result.current.monetizationLoading).toBe(false);
            });
        });
    });

    describe('Sign-out scenarios', () => {
        test('should successfully sign out authenticated user', async () => {
            (firebaseSignOut as jest.Mock).mockResolvedValueOnce(undefined);

            let authCallback: ((user: User | null) => void) | null = null;
            (onAuthStateChanged as jest.Mock).mockImplementation((authInstance, callback) => {
                authCallback = callback;
                // Start with authenticated user
                callback(mockUser as User);
                return jest.fn();
            });

            const { result } = renderHook(() => useAuth(), { wrapper });

            // Wait for user and monetization to load
            await waitFor(() => {
                expect(result.current.user).not.toBeNull();
                expect(result.current.loading).toBe(false);
                expect(result.current.monetizationLoading).toBe(false);
            });

            // Perform sign-out
            await act(async () => {
                await result.current.signOut();
            });

            // Simulate Firebase clearing the auth state
            await act(async () => {
                if (authCallback) {
                    await (authCallback as any)(null);
                }
            });

            // Verify sign-out was called
            expect(firebaseSignOut).toHaveBeenCalledWith(auth);

            // Verify user is cleared
            await waitFor(() => {
                expect(result.current.user).toBeNull();
            });

            // Verify no error
            expect(result.current.error).toBeNull();
        });

        test('should handle sign-out failure', async () => {
            const authError: Partial<AuthError> = {
                code: 'auth/network-request-failed',
                message: 'Network error',
                name: 'FirebaseError',
            };

            (firebaseSignOut as jest.Mock).mockRejectedValueOnce(authError);

            let authCallback: ((user: User | null) => void) | null = null;
            (onAuthStateChanged as jest.Mock).mockImplementation((authInstance, callback) => {
                authCallback = callback;
                callback(mockUser as User);
                return jest.fn();
            });

            const { result } = renderHook(() => useAuth(), { wrapper });

            await waitFor(() => {
                expect(result.current.user).not.toBeNull();
                expect(result.current.loading).toBe(false);
                expect(result.current.monetizationLoading).toBe(false);
            });

            // Attempt sign-out
            await act(async () => {
                try {
                    await result.current.signOut();
                } catch (error) {
                    // Expected to throw
                }
            });

            // Verify error is set
            expect(result.current.error).toBe('Network error. Please check your connection');

            // User should still be authenticated since sign-out failed
            expect(result.current.user).not.toBeNull();
        });

        test('should clear error on successful sign-out after previous error', async () => {
            // First attempt - fail
            const authError: Partial<AuthError> = {
                code: 'auth/network-request-failed',
                message: 'Network error',
                name: 'FirebaseError',
            };

            (firebaseSignOut as jest.Mock)
                .mockRejectedValueOnce(authError)
                .mockResolvedValueOnce(undefined);

            let authCallback: ((user: User | null) => void) | null = null;
            (onAuthStateChanged as jest.Mock).mockImplementation((authInstance, callback) => {
                authCallback = callback;
                callback(mockUser as User);
                return jest.fn();
            });

            const { result } = renderHook(() => useAuth(), { wrapper });

            await waitFor(() => {
                expect(result.current.user).not.toBeNull();
                expect(result.current.loading).toBe(false);
            });

            // First attempt - should fail
            await act(async () => {
                try {
                    await result.current.signOut();
                } catch (error) {
                    // Expected to throw
                }
            });

            expect(result.current.error).toBe('Network error. Please check your connection');

            // Second attempt - should succeed
            await act(async () => {
                await result.current.signOut();
            });

            // Simulate auth state update
            act(() => {
                if (authCallback) {
                    authCallback(null);
                }
            });

            await waitFor(() => {
                expect(result.current.error).toBeNull();
                expect(result.current.user).toBeNull();
            });
        });
    });

    describe('Loading states', () => {
        test('should start with loading true on initial mount', () => {
            let authCallback: ((user: User | null) => void) | null = null;
            (onAuthStateChanged as jest.Mock).mockImplementation((authInstance, callback) => {
                authCallback = callback;
                // Don't call callback immediately to test loading state
                return jest.fn();
            });

            const { result } = renderHook(() => useAuth(), { wrapper });

            // Should be loading initially
            expect(result.current.loading).toBe(true);
            expect(result.current.user).toBeNull();
        });

        test('should set loading false after auth state is determined', async () => {
            let authCallback: ((user: User | null) => void) | null = null;
            (onAuthStateChanged as jest.Mock).mockImplementation((authInstance, callback) => {
                authCallback = callback;
                // Simulate async auth state check
                setTimeout(() => callback(null), 10);
                return jest.fn();
            });

            const { result } = renderHook(() => useAuth(), { wrapper });

            // Initially loading
            expect(result.current.loading).toBe(true);

            // Wait for loading to complete
            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.user).toBeNull();
        });

        test('should set loading true during sign-in and false after completion', async () => {
            (signInWithEmailAndPassword as jest.Mock).mockImplementation(() => {
                return new Promise((resolve) => {
                    setTimeout(() => resolve({ user: mockUser }), 50);
                });
            });

            let authCallback: ((user: User | null) => void) | null = null;
            (onAuthStateChanged as jest.Mock).mockImplementation((authInstance, callback) => {
                authCallback = callback;
                callback(null);
                return jest.fn();
            });

            const { result } = renderHook(() => useAuth(), { wrapper });

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            // Start sign-in
            let signInPromise: Promise<void>;
            act(() => {
                signInPromise = result.current.signIn('test@example.com', 'password123');
            });

            // Should be loading during sign-in
            await waitFor(() => {
                expect(result.current.loading).toBe(true);
            });

            // Wait for sign-in to complete
            await act(async () => {
                await signInPromise;
            });

            // Should not be loading after completion
            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });
        });

        test('should set loading true during sign-out and false after completion', async () => {
            (firebaseSignOut as jest.Mock).mockImplementation(() => {
                return new Promise((resolve) => {
                    setTimeout(() => resolve(undefined), 50);
                });
            });

            let authCallback: ((user: User | null) => void) | null = null;
            (onAuthStateChanged as jest.Mock).mockImplementation((authInstance, callback) => {
                authCallback = callback;
                callback(mockUser as User);
                return jest.fn();
            });

            const { result } = renderHook(() => useAuth(), { wrapper });

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
                expect(result.current.user).not.toBeNull();
            });

            // Start sign-out
            let signOutPromise: Promise<void>;
            act(() => {
                signOutPromise = result.current.signOut();
            });

            // Should be loading during sign-out
            await waitFor(() => {
                expect(result.current.loading).toBe(true);
            });

            // Wait for sign-out to complete
            await act(async () => {
                await signOutPromise;
            });

            // Should not be loading after completion
            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });
        });

        test('should set loading false even if sign-in fails', async () => {
            const authError: Partial<AuthError> = {
                code: 'auth/wrong-password',
                message: 'Wrong password',
                name: 'FirebaseError',
            };

            (signInWithEmailAndPassword as jest.Mock).mockRejectedValueOnce(authError);

            const { result } = renderHook(() => useAuth(), { wrapper });

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            // Attempt sign-in
            await act(async () => {
                try {
                    await result.current.signIn('test@example.com', 'wrongpassword');
                } catch (error) {
                    // Expected to throw
                }
            });

            // Loading should be false even after error
            expect(result.current.loading).toBe(false);
        });

        test('should set loading false even if sign-out fails', async () => {
            const authError: Partial<AuthError> = {
                code: 'auth/network-request-failed',
                message: 'Network error',
                name: 'FirebaseError',
            };

            (firebaseSignOut as jest.Mock).mockRejectedValueOnce(authError);

            let authCallback: ((user: User | null) => void) | null = null;
            (onAuthStateChanged as jest.Mock).mockImplementation((authInstance, callback) => {
                authCallback = callback;
                callback(mockUser as User);
                return jest.fn();
            });

            const { result } = renderHook(() => useAuth(), { wrapper });

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            // Attempt sign-out
            await act(async () => {
                try {
                    await result.current.signOut();
                } catch (error) {
                    // Expected to throw
                }
            });

            // Loading should be false even after error
            expect(result.current.loading).toBe(false);
        });
    });

    describe('useAuth hook', () => {
        test('should throw error when used outside AuthProvider', () => {
            // Suppress console.error for this test
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

            expect(() => {
                renderHook(() => useAuth());
            }).toThrow('useAuth must be used within an AuthProvider');

            consoleSpy.mockRestore();
        });
    });

    describe('Auth state subscription', () => {
        test('should subscribe to auth state changes on mount', () => {
            renderHook(() => useAuth(), { wrapper });

            expect(onAuthStateChanged).toHaveBeenCalledWith(auth, expect.any(Function));
        });

        test('should unsubscribe from auth state changes on unmount', () => {
            const unsubscribeMock = jest.fn();
            (onAuthStateChanged as jest.Mock).mockImplementation(() => {
                return unsubscribeMock;
            });

            const { unmount } = renderHook(() => useAuth(), { wrapper });

            unmount();

            expect(unsubscribeMock).toHaveBeenCalled();
        });

        test('should update user when auth state changes', async () => {
            let authCallback: ((user: User | null) => void) | null = null;
            (onAuthStateChanged as jest.Mock).mockImplementation((authInstance, callback) => {
                authCallback = callback;
                callback(null); // Start with no user
                return jest.fn();
            });

            const { result } = renderHook(() => useAuth(), { wrapper });

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
                expect(result.current.user).toBeNull();
            });

            // Simulate auth state change (user signs in elsewhere)
            act(() => {
                if (authCallback) {
                    authCallback(mockUser as User);
                }
            });

            // User should be updated
            await waitFor(() => {
                expect(result.current.user).not.toBeNull();
                expect(result.current.user?.uid).toBe('test-uid-123');
            });
        });
    });
});
