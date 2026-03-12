/**
 * Unit Tests for Login Page
 * Feature: reader-engagement-enhancements
 * Requirements: 1.3, 1.6, 9.3
 * Task: 3.1 Create login page component
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import '@testing-library/jest-dom';
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

describe('LoginPage Component', () => {
    const mockPush = jest.fn();
    const mockSignIn = jest.fn();
    const mockSearchParams = {
        get: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
        (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
        (useAuth as jest.Mock).mockReturnValue({
            signIn: mockSignIn,
            user: null,
            loading: false,
            error: null,
        });
        mockSearchParams.get.mockReturnValue(null);
    });

    describe('Form rendering', () => {
        test('should render email and password input fields', () => {
            render(<LoginPage />);

            const emailInput = screen.getByPlaceholderText('ARCHIVIST MAIL');
            const passwordInput = screen.getByPlaceholderText('ACCESS CODE');

            expect(emailInput).toBeInTheDocument();
            expect(passwordInput).toBeInTheDocument();
            expect(emailInput).toHaveAttribute('type', 'email');
            expect(passwordInput).toHaveAttribute('type', 'password');
        });

        test('should render submit button with correct text', () => {
            render(<LoginPage />);

            const submitButton = screen.getByRole('button', { name: /enter archives/i });
            expect(submitButton).toBeInTheDocument();
            expect(submitButton).toHaveAttribute('type', 'submit');
        });

        test('should render signup link', () => {
            render(<LoginPage />);

            const signupLink = screen.getByText(/join the archives/i);
            expect(signupLink).toBeInTheDocument();
            expect(signupLink.closest('a')).toHaveAttribute('href', '/signup');
        });

        test('should use glass-panel styling for consistency', () => {
            const { container } = render(<LoginPage />);

            const glassPanel = container.querySelector('.glass-panel');
            expect(glassPanel).toBeInTheDocument();
        });
    });

    describe('Form validation', () => {
        test('should require email field', () => {
            render(<LoginPage />);

            const emailInput = screen.getByPlaceholderText('ARCHIVIST MAIL');
            expect(emailInput).toHaveAttribute('required');
        });

        test('should require password field', () => {
            render(<LoginPage />);

            const passwordInput = screen.getByPlaceholderText('ACCESS CODE');
            expect(passwordInput).toHaveAttribute('required');
        });
    });

    describe('Authentication flow', () => {
        test('should call signIn with email and password on form submit', async () => {
            mockSignIn.mockResolvedValueOnce(undefined);

            render(<LoginPage />);

            const emailInput = screen.getByPlaceholderText('ARCHIVIST MAIL');
            const passwordInput = screen.getByPlaceholderText('ACCESS CODE');
            const submitButton = screen.getByRole('button', { name: /enter archives/i });

            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.change(passwordInput, { target: { value: 'password123' } });
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
            });
        });

        test('should redirect to / on successful authentication', async () => {
            mockSignIn.mockResolvedValueOnce(undefined);

            render(<LoginPage />);

            const emailInput = screen.getByPlaceholderText('ARCHIVIST MAIL');
            const passwordInput = screen.getByPlaceholderText('ACCESS CODE');
            const submitButton = screen.getByRole('button', { name: /enter archives/i });

            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.change(passwordInput, { target: { value: 'password123' } });
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(mockPush).toHaveBeenCalledWith('/');
            });
        });

        test('should redirect to returnUrl if provided', async () => {
            mockSignIn.mockResolvedValueOnce(undefined);
            mockSearchParams.get.mockReturnValue('/novels/123');

            render(<LoginPage />);

            const emailInput = screen.getByPlaceholderText('ARCHIVIST MAIL');
            const passwordInput = screen.getByPlaceholderText('ACCESS CODE');
            const submitButton = screen.getByRole('button', { name: /enter archives/i });

            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.change(passwordInput, { target: { value: 'password123' } });
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(mockPush).toHaveBeenCalledWith('/novels/123');
            });
        });

        test('should display error message on authentication failure', async () => {
            const errorMessage = 'Invalid email or password';
            mockSignIn.mockRejectedValueOnce(new Error(errorMessage));

            render(<LoginPage />);

            const emailInput = screen.getByPlaceholderText('ARCHIVIST MAIL');
            const passwordInput = screen.getByPlaceholderText('ACCESS CODE');
            const submitButton = screen.getByRole('button', { name: /enter archives/i });

            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText(errorMessage)).toBeInTheDocument();
            });
        });

        test('should show loading state during authentication', async () => {
            mockSignIn.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

            render(<LoginPage />);

            const emailInput = screen.getByPlaceholderText('ARCHIVIST MAIL');
            const passwordInput = screen.getByPlaceholderText('ACCESS CODE');
            const submitButton = screen.getByRole('button', { name: /enter archives/i });

            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.change(passwordInput, { target: { value: 'password123' } });
            fireEvent.click(submitButton);

            // Check for loading text on the submit button specifically
            await waitFor(() => {
                expect(submitButton).toHaveTextContent(/authenticating/i);
            });

            // Check that inputs are disabled
            expect(emailInput).toBeDisabled();
            expect(passwordInput).toBeDisabled();
            expect(submitButton).toBeDisabled();
        });
    });

    describe('Error handling', () => {
        test('should display user-friendly error messages (Requirement 9.1)', async () => {
            const errorMessage = 'Network error. Please check your connection';
            mockSignIn.mockRejectedValueOnce(new Error(errorMessage));

            render(<LoginPage />);

            const emailInput = screen.getByPlaceholderText('ARCHIVIST MAIL');
            const passwordInput = screen.getByPlaceholderText('ACCESS CODE');
            const submitButton = screen.getByRole('button', { name: /enter archives/i });

            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.change(passwordInput, { target: { value: 'password123' } });
            fireEvent.click(submitButton);

            await waitFor(() => {
                const errorElement = screen.getByText(errorMessage);
                expect(errorElement).toBeInTheDocument();
                expect(errorElement.closest('div')).toHaveClass('bg-red-500/10');
            });
        });

        test('should clear error message on new submission attempt', async () => {
            const errorMessage = 'Invalid credentials';
            mockSignIn.mockRejectedValueOnce(new Error(errorMessage));

            render(<LoginPage />);

            const emailInput = screen.getByPlaceholderText('ARCHIVIST MAIL');
            const passwordInput = screen.getByPlaceholderText('ACCESS CODE');
            const submitButton = screen.getByRole('button', { name: /enter archives/i });

            // First attempt - should fail
            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(screen.getByText(errorMessage)).toBeInTheDocument();
            });

            // Second attempt - error should be cleared before new attempt
            mockSignIn.mockResolvedValueOnce(undefined);
            fireEvent.change(passwordInput, { target: { value: 'correctpassword' } });
            fireEvent.click(submitButton);

            // Error should be cleared immediately on new submission
            await waitFor(() => {
                expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
            });
        });
    });

    describe('Return URL handling (Requirement 9.3)', () => {
        test('should handle returnUrl query parameter', async () => {
            mockSignIn.mockResolvedValueOnce(undefined);
            mockSearchParams.get.mockReturnValue('/novels/123/chapter/456');

            render(<LoginPage />);

            const emailInput = screen.getByPlaceholderText('ARCHIVIST MAIL');
            const passwordInput = screen.getByPlaceholderText('ACCESS CODE');
            const submitButton = screen.getByRole('button', { name: /enter archives/i });

            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.change(passwordInput, { target: { value: 'password123' } });
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(mockSearchParams.get).toHaveBeenCalledWith('returnUrl');
                expect(mockPush).toHaveBeenCalledWith('/novels/123/chapter/456');
            });
        });

        test('should default to / when no returnUrl is provided', async () => {
            mockSignIn.mockResolvedValueOnce(undefined);
            mockSearchParams.get.mockReturnValue(null);

            render(<LoginPage />);

            const emailInput = screen.getByPlaceholderText('ARCHIVIST MAIL');
            const passwordInput = screen.getByPlaceholderText('ACCESS CODE');
            const submitButton = screen.getByRole('button', { name: /enter archives/i });

            fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
            fireEvent.change(passwordInput, { target: { value: 'password123' } });
            fireEvent.click(submitButton);

            await waitFor(() => {
                expect(mockPush).toHaveBeenCalledWith('/');
            });
        });
    });
});
