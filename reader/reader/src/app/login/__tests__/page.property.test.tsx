/**
 * Property-Based Tests for Login Page
 * Feature: reader-engagement-enhancements
 */

import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import * as fc from 'fast-check';
import LoginPage from '../page';
import { useAuth } from '@/contexts/AuthContext';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
    useSearchParams: jest.fn(),
}));

// Mock AuthContext
jest.mock('@/contexts/AuthContext', () => ({
    useAuth: jest.fn(),
}));

describe('LoginPage Property-Based Tests', () => {
    const mockPush = jest.fn();
    const mockSignIn = jest.fn();
    const mockSearchParams = {
        get: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        cleanup(); // Clean up any previous renders
        (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
        (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
        (useAuth as jest.Mock).mockReturnValue({
            signIn: mockSignIn,
            user: null,
            loading: false,
            error: null,
        });
    });

    afterEach(() => {
        cleanup(); // Clean up after each test
    });

    /**
     * Property 1: Successful authentication redirects to home
     * Validates: Requirements 1.5
     * 
     * This property verifies that for any valid user credentials, when authentication
     * succeeds, the user should be redirected to the homepage (or returnUrl if provided).
     */
    test('Property 1: Successful authentication redirects to home', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.record({
                    email: fc.emailAddress(),
                    password: fc.string({ minLength: 6, maxLength: 128 }),
                    returnUrl: fc.option(
                        fc.oneof(
                            fc.constant('/'),
                            fc.constant('/novels/123'),
                            fc.constant('/stories/456'),
                            fc.constant('/novels/123/chapter/456'),
                            fc.webPath()
                        ),
                        { nil: null }
                    ),
                }),
                async ({ email, password, returnUrl }) => {
                    // Clean up any previous renders
                    cleanup();

                    // Reset mocks for this iteration
                    mockSignIn.mockClear();
                    mockPush.mockClear();

                    // Setup: Mock successful authentication
                    mockSignIn.mockResolvedValueOnce(undefined);
                    mockSearchParams.get.mockReturnValue(returnUrl);

                    // Render the login page
                    render(<LoginPage />);

                    // Find form elements
                    const emailInput = screen.getByPlaceholderText('ARCHIVIST MAIL');
                    const passwordInput = screen.getByPlaceholderText('ACCESS CODE');
                    const submitButton = screen.getByRole('button', { name: /enter archives/i });

                    // Fill in the form with generated credentials
                    fireEvent.change(emailInput, { target: { value: email } });
                    fireEvent.change(passwordInput, { target: { value: password } });

                    // Submit the form
                    fireEvent.click(submitButton);

                    // Wait for authentication to complete
                    await waitFor(() => {
                        expect(mockSignIn).toHaveBeenCalledWith(email, password);
                    });

                    // Property assertion: User should be redirected
                    const expectedRedirect = returnUrl || '/';
                    await waitFor(() => {
                        expect(mockPush).toHaveBeenCalledWith(expectedRedirect);
                    });

                    // Verify that signIn was called exactly once
                    expect(mockSignIn).toHaveBeenCalledTimes(1);

                    // Verify that push was called exactly once
                    expect(mockPush).toHaveBeenCalledTimes(1);

                    // Clean up after this iteration
                    cleanup();
                }
            ),
            { numRuns: 20 }
        );
    });

    /**
     * Property 1 (variant): Successful authentication always redirects somewhere
     * 
     * This variant ensures that successful authentication ALWAYS results in a redirect,
     * never leaving the user on the login page.
     */
    test('Property 1 (variant): Successful authentication always redirects', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.record({
                    email: fc.emailAddress(),
                    password: fc.string({ minLength: 6, maxLength: 128 }),
                    hasReturnUrl: fc.boolean(),
                }),
                async ({ email, password, hasReturnUrl }) => {
                    // Clean up any previous renders
                    cleanup();

                    // Reset mocks for this iteration
                    mockSignIn.mockClear();
                    mockPush.mockClear();

                    // Setup: Mock successful authentication
                    mockSignIn.mockResolvedValueOnce(undefined);

                    // Randomly decide whether to provide a returnUrl
                    const returnUrl = hasReturnUrl ? '/novels/test-novel' : null;
                    mockSearchParams.get.mockReturnValue(returnUrl);

                    // Render the login page
                    render(<LoginPage />);

                    // Find form elements
                    const emailInput = screen.getByPlaceholderText('ARCHIVIST MAIL');
                    const passwordInput = screen.getByPlaceholderText('ACCESS CODE');
                    const submitButton = screen.getByRole('button', { name: /enter archives/i });

                    // Fill in and submit the form
                    fireEvent.change(emailInput, { target: { value: email } });
                    fireEvent.change(passwordInput, { target: { value: password } });
                    fireEvent.click(submitButton);

                    // Wait for authentication to complete
                    await waitFor(() => {
                        expect(mockSignIn).toHaveBeenCalled();
                    });

                    // Property assertion: Router push must have been called (redirect occurred)
                    await waitFor(() => {
                        expect(mockPush).toHaveBeenCalled();
                    });

                    // Verify the redirect target is valid
                    const redirectTarget = mockPush.mock.calls[0][0];
                    expect(typeof redirectTarget).toBe('string');
                    expect(redirectTarget.length).toBeGreaterThan(0);
                    expect(redirectTarget.startsWith('/')).toBe(true);

                    // Clean up after this iteration
                    cleanup();
                }
            ),
            { numRuns: 20 }
        );
    });

    /**
     * Property 1 (variant): Default redirect is always / when no returnUrl
     * 
     * This variant specifically tests that when no returnUrl is provided,
     * the default redirect is always /, regardless of credentials.
     */
    test('Property 1 (variant): Default redirect is / when no returnUrl', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.record({
                    email: fc.emailAddress(),
                    password: fc.string({ minLength: 6, maxLength: 128 }),
                }),
                async ({ email, password }) => {
                    // Clean up any previous renders
                    cleanup();

                    // Reset mocks for this iteration
                    mockSignIn.mockClear();
                    mockPush.mockClear();

                    // Setup: Mock successful authentication with no returnUrl
                    mockSignIn.mockResolvedValueOnce(undefined);
                    mockSearchParams.get.mockReturnValue(null);

                    // Render the login page
                    render(<LoginPage />);

                    // Find form elements
                    const emailInput = screen.getByPlaceholderText('ARCHIVIST MAIL');
                    const passwordInput = screen.getByPlaceholderText('ACCESS CODE');
                    const submitButton = screen.getByRole('button', { name: /enter archives/i });

                    // Fill in and submit the form
                    fireEvent.change(emailInput, { target: { value: email } });
                    fireEvent.change(passwordInput, { target: { value: password } });
                    fireEvent.click(submitButton);

                    // Wait for authentication to complete
                    await waitFor(() => {
                        expect(mockSignIn).toHaveBeenCalled();
                    });

                    // Property assertion: Must redirect to / specifically
                    await waitFor(() => {
                        expect(mockPush).toHaveBeenCalledWith('/');
                    });

                    // Clean up after this iteration
                    cleanup();
                }
            ),
            { numRuns: 20 }
        );
    });
});
