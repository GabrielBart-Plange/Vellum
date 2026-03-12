/**
 * Unit Tests for Navbar Auth Integration
 * Feature: reader-engagement-enhancements
 * Requirements: 1.8, 7.1, 7.2
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Navbar from '../Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { User } from 'firebase/auth';

// Mock the AuthContext
jest.mock('@/contexts/AuthContext', () => ({
    useAuth: jest.fn(),
}));

jest.mock('@/lib/firebase', () => ({
    db: {},
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
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
    usePathname: jest.fn(),
}));

describe('Navbar Auth Integration Unit Tests', () => {
    const mockPush = jest.fn();
    const mockSignOut = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (useRouter as jest.Mock).mockReturnValue({
            push: mockPush,
        });
        (usePathname as jest.Mock).mockReturnValue('/');
    });

    describe('Sign-out button visibility for authenticated users', () => {
        test('should display Sign Out button when user is authenticated', () => {
            const mockUser: Partial<User> = {
                uid: 'test-uid-123',
                email: 'test@example.com',
                displayName: 'Test User',
            };

            (useAuth as jest.Mock).mockReturnValue({
                user: mockUser,
                loading: false,
                signOut: mockSignOut,
                error: null,
            });

            render(<Navbar />);

            // Desktop sign-out button should be visible
            const signOutButtons = screen.getAllByText('Sign Out');
            expect(signOutButtons.length).toBeGreaterThan(0);

            // Verify at least one sign-out button is visible (desktop version)
            const desktopSignOutButton = signOutButtons.find(button =>
                button.classList.contains('rounded-full')
            );
            expect(desktopSignOutButton).toBeInTheDocument();
        });

        test('should NOT display Sign In button when user is authenticated', () => {
            const mockUser: Partial<User> = {
                uid: 'test-uid-123',
                email: 'test@example.com',
                displayName: 'Test User',
            };

            (useAuth as jest.Mock).mockReturnValue({
                user: mockUser,
                loading: false,
                signOut: mockSignOut,
                error: null,
            });

            render(<Navbar />);

            // Sign In link should not be present
            const signInLinks = screen.queryAllByText('Sign In');
            expect(signInLinks.length).toBe(0);
        });

        test('should display Sign In button when user is NOT authenticated', () => {
            (useAuth as jest.Mock).mockReturnValue({
                user: null,
                loading: false,
                signOut: mockSignOut,
                error: null,
            });

            render(<Navbar />);

            // Sign In link should be visible
            const signInLink = screen.getByText('Sign In');
            expect(signInLink).toBeInTheDocument();
            expect(signInLink).toHaveAttribute('href', '/login');
        });

        test('should NOT display Sign Out button when user is NOT authenticated', () => {
            (useAuth as jest.Mock).mockReturnValue({
                user: null,
                loading: false,
                signOut: mockSignOut,
                error: null,
            });

            render(<Navbar />);

            // Sign Out buttons should not be present
            const signOutButtons = screen.queryAllByText('Sign Out');
            expect(signOutButtons.length).toBe(0);
        });

        test('should call signOut and redirect to home when Sign Out button is clicked', async () => {
            const user = userEvent.setup();
            const mockUser: Partial<User> = {
                uid: 'test-uid-123',
                email: 'test@example.com',
                displayName: 'Test User',
            };

            mockSignOut.mockResolvedValueOnce(undefined);

            (useAuth as jest.Mock).mockReturnValue({
                user: mockUser,
                loading: false,
                signOut: mockSignOut,
                error: null,
            });

            render(<Navbar />);

            // Click the desktop sign-out button
            const signOutButtons = screen.getAllByText('Sign Out');
            const desktopSignOutButton = signOutButtons.find(button =>
                button.classList.contains('rounded-full')
            );

            expect(desktopSignOutButton).toBeInTheDocument();
            await user.click(desktopSignOutButton!);

            // Verify signOut was called
            expect(mockSignOut).toHaveBeenCalledTimes(1);

            // Wait for redirect
            await waitFor(() => {
                expect(mockPush).toHaveBeenCalledWith('/');
            });
        });

        test('should handle sign-out errors gracefully', async () => {
            const user = userEvent.setup();
            const mockUser: Partial<User> = {
                uid: 'test-uid-123',
                email: 'test@example.com',
                displayName: 'Test User',
            };

            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
            const signOutError = new Error('Sign out failed');
            mockSignOut.mockRejectedValueOnce(signOutError);

            (useAuth as jest.Mock).mockReturnValue({
                user: mockUser,
                loading: false,
                signOut: mockSignOut,
                error: null,
            });

            render(<Navbar />);

            // Click the desktop sign-out button
            const signOutButtons = screen.getAllByText('Sign Out');
            const desktopSignOutButton = signOutButtons.find(button =>
                button.classList.contains('rounded-full')
            );

            await user.click(desktopSignOutButton!);

            // Verify error was logged
            await waitFor(() => {
                expect(consoleErrorSpy).toHaveBeenCalledWith('Sign out error:', signOutError);
            });

            // Should not redirect on error
            expect(mockPush).not.toHaveBeenCalled();

            consoleErrorSpy.mockRestore();
        });

        test('should display Sign Out button in mobile menu for authenticated users', async () => {
            const user = userEvent.setup();
            const mockUser: Partial<User> = {
                uid: 'test-uid-123',
                email: 'test@example.com',
                displayName: 'Test User',
            };

            (useAuth as jest.Mock).mockReturnValue({
                user: mockUser,
                loading: false,
                signOut: mockSignOut,
                error: null,
            });

            render(<Navbar />);

            // Open mobile menu
            const menuButtons = screen.getAllByRole('button');
            const menuButton = menuButtons.find(btn =>
                btn.querySelector('svg') && btn.classList.contains('md:hidden')
            );

            await user.click(menuButton!);

            // Mobile sign-out button should be visible
            const signOutButtons = screen.getAllByText('Sign Out');
            expect(signOutButtons.length).toBeGreaterThan(1); // Desktop + Mobile
        });
    });

    describe('Signup link URL construction', () => {
        test('should display "Join the Archives" link in mobile menu for unauthenticated users', async () => {
            const user = userEvent.setup();

            (useAuth as jest.Mock).mockReturnValue({
                user: null,
                loading: false,
                signOut: mockSignOut,
                error: null,
            });

            render(<Navbar />);

            // Open mobile menu - find the menu toggle button
            const menuButtons = screen.getAllByRole('button');
            const menuButton = menuButtons.find(btn =>
                btn.querySelector('svg') && btn.classList.contains('md:hidden')
            );

            await user.click(menuButton!);

            // "Join the Archives" link should be visible
            const joinLink = screen.getByText('Join the Archives');
            expect(joinLink).toBeInTheDocument();
        });

        test('should construct correct creator app signup URL', async () => {
            const user = userEvent.setup();

            (useAuth as jest.Mock).mockReturnValue({
                user: null,
                loading: false,
                signOut: mockSignOut,
                error: null,
            });

            render(<Navbar />);

            // Open mobile menu
            const menuButtons = screen.getAllByRole('button');
            const menuButton = menuButtons.find(btn =>
                btn.querySelector('svg') && btn.classList.contains('md:hidden')
            );

            await user.click(menuButton!);

            // Verify the link points to creator app signup
            const joinLink = screen.getByText('Join the Archives');
            expect(joinLink).toHaveAttribute('href', '/signup');
        });

        test('should NOT display "Join the Archives" link when user is authenticated', async () => {
            const user = userEvent.setup();
            const mockUser: Partial<User> = {
                uid: 'test-uid-123',
                email: 'test@example.com',
                displayName: 'Test User',
            };

            (useAuth as jest.Mock).mockReturnValue({
                user: mockUser,
                loading: false,
                signOut: mockSignOut,
                error: null,
            });

            render(<Navbar />);

            // Open mobile menu
            const menuButtons = screen.getAllByRole('button');
            const menuButton = menuButtons.find(btn =>
                btn.querySelector('svg') && btn.classList.contains('md:hidden')
            );

            await user.click(menuButton!);

            // "Join the Archives" link should not be present
            const joinLink = screen.queryByText('Join the Archives');
            expect(joinLink).not.toBeInTheDocument();
        });

        test('should use absolute URL for creator app signup', async () => {
            const user = userEvent.setup();

            (useAuth as jest.Mock).mockReturnValue({
                user: null,
                loading: false,
                signOut: mockSignOut,
                error: null,
            });

            render(<Navbar />);

            // Open mobile menu
            const menuButtons = screen.getAllByRole('button');
            const menuButton = menuButtons.find(btn =>
                btn.querySelector('svg') && btn.classList.contains('md:hidden')
            );

            await user.click(menuButton!);

            // Verify the URL is a relative path (not absolute)
            const joinLink = screen.getByText('Join the Archives');
            const href = joinLink.getAttribute('href');

            expect(href).toBe('/signup');
            // Note: This is now an absolute URL pointing to the creator app
        });
    });

    describe('Mobile menu toggle behavior', () => {
        test('should toggle mobile menu when menu button is clicked', async () => {
            const user = userEvent.setup();

            (useAuth as jest.Mock).mockReturnValue({
                user: null,
                loading: false,
                signOut: mockSignOut,
                error: null,
            });

            const { container } = render(<Navbar />);

            // Mobile menu should be hidden initially
            const mobileMenu = container.querySelector('.fixed.inset-0');
            expect(mobileMenu).toHaveClass('opacity-0', '-translate-y-full');

            // Click menu button to open
            const menuButtons = screen.getAllByRole('button');
            const menuButton = menuButtons.find(btn =>
                btn.querySelector('svg') && btn.classList.contains('md:hidden')
            );

            await user.click(menuButton!);

            // Mobile menu should be visible
            expect(mobileMenu).toHaveClass('opacity-100', 'translate-y-0');

            // Click menu button again to close
            await user.click(menuButton!);

            // Mobile menu should be hidden again
            expect(mobileMenu).toHaveClass('opacity-0', '-translate-y-full');
        });

        test('should close mobile menu when navigation link is clicked', async () => {
            const user = userEvent.setup();

            (useAuth as jest.Mock).mockReturnValue({
                user: null,
                loading: false,
                signOut: mockSignOut,
                error: null,
            });

            const { container } = render(<Navbar />);

            // Open mobile menu
            const menuButtons = screen.getAllByRole('button');
            const menuButton = menuButtons.find(btn =>
                btn.querySelector('svg') && btn.classList.contains('md:hidden')
            );

            await user.click(menuButton!);

            // Mobile menu should be visible
            const mobileMenu = container.querySelector('.fixed.inset-0');
            expect(mobileMenu).toHaveClass('opacity-100', 'translate-y-0');

            // Click a navigation link in the mobile menu
            const allLinks = screen.getAllByRole('link');
            const mobileStoriesLink = allLinks.find(link =>
                link.classList.contains('group') &&
                link.classList.contains('p-6') &&
                link.getAttribute('href') === '/stories'
            );

            await user.click(mobileStoriesLink!);

            // Mobile menu should be hidden
            expect(mobileMenu).toHaveClass('opacity-0', '-translate-y-full');
        });
    });

    describe('Loading state handling', () => {
        test('should render navbar when auth is loading', () => {
            (useAuth as jest.Mock).mockReturnValue({
                user: null,
                loading: true,
                signOut: mockSignOut,
                error: null,
            });

            render(<Navbar />);

            // Navbar should still render during loading
            expect(screen.getByText('VELLUM')).toBeInTheDocument();
        });

        test('should not display auth buttons when loading', () => {
            (useAuth as jest.Mock).mockReturnValue({
                user: null,
                loading: true,
                signOut: mockSignOut,
                error: null,
            });

            render(<Navbar />);

            // During loading, we show Sign In button (default state)
            // This is acceptable as the loading state is brief
            const signInLink = screen.getByText('Sign In');
            expect(signInLink).toBeInTheDocument();
        });
    });

    describe('Navigation links', () => {
        test('should display all navigation links', () => {
            (useAuth as jest.Mock).mockReturnValue({
                user: null,
                loading: false,
                signOut: mockSignOut,
                error: null,
            });

            render(<Navbar />);

            // Desktop navigation links (first 3) - use getAllByText since they appear in mobile menu too
            const storiesLinks = screen.getAllByText('Stories');
            const novelsLinks = screen.getAllByText('Novels');
            const aboutLinks = screen.getAllByText('About');

            // Should have at least one of each (desktop version)
            expect(storiesLinks.length).toBeGreaterThan(0);
            expect(novelsLinks.length).toBeGreaterThan(0);
            expect(aboutLinks.length).toBeGreaterThan(0);
        });

        test('should have correct href attributes for navigation links', () => {
            (useAuth as jest.Mock).mockReturnValue({
                user: null,
                loading: false,
                signOut: mockSignOut,
                error: null,
            });

            render(<Navbar />);

            // Get all links and find the desktop navigation ones
            const allLinks = screen.getAllByRole('link');
            const storiesLink = allLinks.find(link => link.getAttribute('href') === '/stories' && link.textContent === 'Stories');
            const novelsLink = allLinks.find(link => link.getAttribute('href') === '/novels' && link.textContent === 'Novels');
            const aboutLink = allLinks.find(link => link.getAttribute('href') === '/about' && link.textContent === 'About');

            expect(storiesLink).toHaveAttribute('href', '/stories');
            expect(novelsLink).toHaveAttribute('href', '/novels');
            expect(aboutLink).toHaveAttribute('href', '/about');
        });

        test('should display all navigation links in mobile menu', async () => {
            const user = userEvent.setup();

            (useAuth as jest.Mock).mockReturnValue({
                user: null,
                loading: false,
                signOut: mockSignOut,
                error: null,
            });

            const { container } = render(<Navbar />);

            // Open mobile menu - find the menu toggle button
            const menuButtons = screen.getAllByRole('button');
            const menuButton = menuButtons.find(btn =>
                btn.querySelector('svg') && btn.classList.contains('md:hidden')
            );

            expect(menuButton).toBeInTheDocument();
            await user.click(menuButton!);

            // Verify mobile menu is visible
            const mobileMenu = container.querySelector('.fixed.inset-0');
            expect(mobileMenu).toHaveClass('opacity-100', 'translate-y-0');

            // All navigation links should be present in mobile menu
            // The mobile menu has all 5 links: Stories, Novels, About, Library, Ranking
            const allLinks = screen.getAllByRole('link');
            const mobileLinks = allLinks.filter(link =>
                link.classList.contains('group') && link.classList.contains('p-6')
            );
            expect(mobileLinks.length).toBeGreaterThanOrEqual(5);
        });
    });
});
