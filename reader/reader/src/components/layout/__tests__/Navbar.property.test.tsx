/**
 * Property-Based Tests for Navbar Sign-Out Behavior
 * Feature: reader-engagement-enhancements
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactNode } from 'react';
import * as fc from 'fast-check';
import Navbar from '../Navbar';
import { AuthProvider } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { usePathname, useRouter } from 'next/navigation';

// Mock Firebase modules
jest.mock('@/lib/firebase', () => ({
    auth: {
        currentUser: null,
    },
    db: {},
}));

jest.mock('firebase/auth', () => ({
    signInWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChanged: jest.fn(),
    User: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
    collection: jest.fn(() => ({})),
    query: jest.fn(() => ({})),
    orderBy: jest.fn(() => ({})),
    onSnapshot: jest.fn((_q, onNext) => {
        onNext?.({ docs: [] });
        return jest.fn();
    }),
    where: jest.fn(() => ({})),
    doc: jest.fn(() => ({})),
    updateDoc: jest.fn(),
    writeBatch: jest.fn(() => ({ update: jest.fn(), commit: jest.fn().mockResolvedValue(undefined) })),
    limit: jest.fn(() => ({})),
    getDoc: jest.fn().mockResolvedValue({ exists: () => false, data: () => ({}) }),
    setDoc: jest.fn().mockResolvedValue(undefined),
    serverTimestamp: jest.fn(() => ({ seconds: Date.now() / 1000 })),
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

// Mock Next.js router
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
    usePathname: jest.fn(),
}));

describe('Navbar Sign-Out Property-Based Tests', () => {
    let mockPush: jest.Mock;
    let mockRouter: { push: jest.Mock; pathname?: string; query?: Record<string, string>; asPath?: string };

    beforeEach(() => {
        jest.clearAllMocks();
        mockPush = jest.fn();
        mockRouter = {
            push: mockPush,
            pathname: '/',
            query: {},
            asPath: '/',
        };
        (useRouter as jest.Mock).mockReturnValue(mockRouter);
        (usePathname as jest.Mock).mockReturnValue('/');
    });

    /**
     * Property 4: Sign-out clears authentication and redirects
     * Validates: Requirements 1.8
     * 
     * This property verifies that for any authenticated user, when they sign out:
     * 1. The Firebase signOut function is called
     * 2. The authentication state is cleared (user becomes null)
     * 3. The user is redirected to the home page
     */
    test('Property 4: Sign-out clears authentication and redirects', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.record({
                    uid: fc.uuid(),
                    email: fc.emailAddress(),
                    displayName: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
                }),
                async (userData) => {
                    // Create a mock authenticated user
                    const mockUser: Partial<User> = {
                        uid: userData.uid,
                        email: userData.email,
                        displayName: userData.displayName,
                    };

                    let authCallback: ((user: User | null) => void) | null = null;

                    // Mock onAuthStateChanged to start with authenticated user
                    (onAuthStateChanged as jest.Mock).mockImplementation((authInstance, callback) => {
                        authCallback = callback;
                        // Initially call with authenticated user
                        callback(mockUser as User);
                        return jest.fn(); // Return unsubscribe function
                    });

                    // Mock signOut to simulate successful sign-out
                    (firebaseSignOut as jest.Mock).mockImplementation(async () => {
                        // Simulate Firebase clearing the auth state
                        if (authCallback) {
                            authCallback(null);
                        }
                        return Promise.resolve();
                    });

                    // Render the Navbar with AuthProvider
                    const { unmount } = render(
                        <AuthProvider>
                            <Navbar />
                        </AuthProvider>
                    );

                    // Wait for initial auth state to load
                    await waitFor(() => {
                        const signOutButtons = screen.getAllByText('Sign Out');
                        expect(signOutButtons.length).toBeGreaterThan(0);
                    });

                    // Verify user is authenticated (Sign Out button is visible)
                    const signOutButtons = screen.getAllByText('Sign Out');
                    expect(signOutButtons.length).toBeGreaterThan(0);
                    const signOutButton = signOutButtons[0]; // Use the first one (desktop button)

                    // Click the sign-out button
                    const user = userEvent.setup();
                    await user.click(signOutButton);

                    // Property assertions:
                    // 1. Firebase signOut should be called
                    await waitFor(() => {
                        expect(firebaseSignOut).toHaveBeenCalledWith(auth);
                    });

                    // 2. User should be redirected to home page
                    await waitFor(() => {
                        expect(mockPush).toHaveBeenCalledWith('/');
                    });

                    // 3. Authentication state should be cleared
                    // After sign-out, the auth callback is called with null
                    // This causes the UI to update and show "Sign In" instead of "Sign Out"
                    await waitFor(() => {
                        expect(screen.queryAllByText('Sign Out')).toHaveLength(0);
                        const signInButtons = screen.getAllByText('Sign In');
                        expect(signInButtons.length).toBeGreaterThan(0);
                    });

                    // Cleanup
                    unmount();
                }
            ),
            { numRuns: 20 }
        );
    }, 30000); // 30 second timeout for property-based test

    /**
     * Additional test: Verify sign-out button is only visible for authenticated users
     * This ensures that the sign-out functionality is only available when a user is authenticated.
     */
    test('Property 4 (variant): Sign-out button only visible for authenticated users', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.boolean(), // Whether user is authenticated
                fc.record({
                    uid: fc.uuid(),
                    email: fc.emailAddress(),
                    displayName: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
                }),
                async (isAuthenticated, userData) => {
                    const mockUser: Partial<User> | null = isAuthenticated ? {
                        uid: userData.uid,
                        email: userData.email,
                        displayName: userData.displayName,
                    } : null;

                    // Mock onAuthStateChanged based on authentication state
                    (onAuthStateChanged as jest.Mock).mockImplementation((authInstance, callback) => {
                        callback(mockUser as User | null);
                        return jest.fn();
                    });

                    // Render the Navbar
                    const { unmount } = render(
                        <AuthProvider>
                            <Navbar />
                        </AuthProvider>
                    );

                    // Wait for auth state to load
                    await waitFor(() => {
                        if (isAuthenticated) {
                            const signOutButtons = screen.getAllByText('Sign Out');
                            expect(signOutButtons.length).toBeGreaterThan(0);
                        } else {
                            const signInButtons = screen.getAllByText('Sign In');
                            expect(signInButtons.length).toBeGreaterThan(0);
                        }
                    }, { timeout: 3000 });

                    // Property assertion: Sign-out button visibility matches authentication state
                    if (isAuthenticated) {
                        const signOutButtons = screen.getAllByText('Sign Out');
                        expect(signOutButtons.length).toBeGreaterThan(0);
                        expect(screen.queryAllByText('Sign In')).toHaveLength(0);
                    } else {
                        const signInButtons = screen.getAllByText('Sign In');
                        expect(signInButtons.length).toBeGreaterThan(0);
                        expect(screen.queryAllByText('Sign Out')).toHaveLength(0);
                    }

                    // Cleanup
                    unmount();
                }
            ),
            { numRuns: 20 }
        );
    }, 30000); // 30 second timeout for property-based test

    /**
     * Additional test: Verify sign-out handles errors gracefully
     * This ensures that if sign-out fails, the error is handled and doesn't crash the app.
     */
    test('Property 4 (variant): Sign-out handles errors gracefully', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.record({
                    uid: fc.uuid(),
                    email: fc.emailAddress(),
                    displayName: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
                    errorCode: fc.constantFrom(
                        'auth/network-request-failed',
                        'auth/too-many-requests',
                        'auth/internal-error'
                    ),
                }),
                async (userData) => {
                    const mockUser: Partial<User> = {
                        uid: userData.uid,
                        email: userData.email,
                        displayName: userData.displayName,
                    };

                    // Mock onAuthStateChanged to start with authenticated user
                    (onAuthStateChanged as jest.Mock).mockImplementation((authInstance, callback) => {
                        callback(mockUser as User);
                        return jest.fn();
                    });

                    // Mock signOut to simulate an error
                    const mockError = new Error('Sign out failed');
                    (mockError as any).code = userData.errorCode;
                    (firebaseSignOut as jest.Mock).mockRejectedValue(mockError);

                    // Mock console.error to verify error logging
                    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

                    // Render the Navbar
                    const { unmount } = render(
                        <AuthProvider>
                            <Navbar />
                        </AuthProvider>
                    );

                    // Wait for auth state to load
                    await waitFor(() => {
                        const buttons = screen.getAllByText('Sign Out');
                        expect(buttons.length).toBeGreaterThan(0);
                    });

                    // Click the sign-out button
                    const user = userEvent.setup();
                    const signOutButtons = screen.getAllByText('Sign Out');
                    const signOutButton = signOutButtons[0]; // Use the first one (desktop button)
                    await user.click(signOutButton);

                    // Property assertion: Error should be logged
                    await waitFor(() => {
                        expect(consoleErrorSpy).toHaveBeenCalledWith('Sign out error:', expect.any(Error));
                    });

                    // User should still see the Sign Out button (error didn't clear auth state)
                    const buttonsAfterError = screen.getAllByText('Sign Out');
                    expect(buttonsAfterError.length).toBeGreaterThan(0);

                    consoleErrorSpy.mockRestore();

                    // Cleanup
                    unmount();
                }
            ),
            { numRuns: 20 }
        );
    }, 30000); // 30 second timeout for property-based test
});
