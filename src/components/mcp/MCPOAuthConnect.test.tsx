/**
 * Unit tests for MCPOAuthConnect component
 *
 * These tests verify the OAuth connection modal behavior
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MCPOAuthConnect } from './MCPOAuthConnect';

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
    }),
}));

// Mock toast hook
const mockToast = jest.fn();
jest.mock('@/components/ui/use-toast', () => ({
    useToast: () => ({
        toast: mockToast,
    }),
}));

describe('MCPOAuthConnect', () => {
    const mockOnClose = jest.fn();
    const mockOnSuccess = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        global.fetch = jest.fn();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    const renderComponent = (props = {}) => {
        return render(
            <MCPOAuthConnect
                isOpen={true}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
                {...props}
            />
        );
    };

    describe('Rendering', () => {
        it('should render the modal when isOpen is true', () => {
            renderComponent();
            expect(screen.getByText('Connect OAuth Provider')).toBeInTheDocument();
        });

        it('should not render when isOpen is false', () => {
            renderComponent({ isOpen: false });
            expect(screen.queryByText('Connect OAuth Provider')).not.toBeInTheDocument();
        });

        it('should render all OAuth provider buttons', () => {
            renderComponent();
            expect(screen.getByText('GitHub')).toBeInTheDocument();
            expect(screen.getByText('Google')).toBeInTheDocument();
            expect(screen.getByText('Azure AD')).toBeInTheDocument();
            expect(screen.getByText('Auth0')).toBeInTheDocument();
        });

        it('should render cancel button', () => {
            renderComponent();
            expect(screen.getByText('Cancel')).toBeInTheDocument();
        });
    });

    describe('OAuth Flow', () => {
        it('should initiate OAuth flow when provider is selected', async () => {
            const mockAuthUrl = 'https://github.com/oauth/authorize?...';
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    authUrl: mockAuthUrl,
                    state: 'test-state',
                    provider: 'github',
                }),
            });

            renderComponent();

            const githubButton = screen.getByText('GitHub').closest('button');
            fireEvent.click(githubButton!);

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith(
                    '/api/mcp/oauth/init',
                    expect.objectContaining({
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ provider: 'github' }),
                    })
                );
            });

            await waitFor(() => {
                expect(mockToast).toHaveBeenCalledWith(
                    expect.objectContaining({
                        variant: 'default',
                        title: 'Redirecting to OAuth provider',
                    })
                );
            });

            await waitFor(() => {
                expect(mockPush).toHaveBeenCalledWith(mockAuthUrl);
            });
        });

        it('should display loading state during OAuth initialization', async () => {
            (global.fetch as jest.Mock).mockImplementation(
                () => new Promise((resolve) => setTimeout(resolve, 1000))
            );

            renderComponent();

            const githubButton = screen.getByText('GitHub').closest('button');
            fireEvent.click(githubButton!);

            await waitFor(() => {
                expect(screen.getByText('Connecting...')).toBeInTheDocument();
            });
        });

        it('should disable other providers during OAuth initialization', async () => {
            (global.fetch as jest.Mock).mockImplementation(
                () => new Promise((resolve) => setTimeout(resolve, 1000))
            );

            renderComponent();

            const githubButton = screen.getByText('GitHub').closest('button');
            fireEvent.click(githubButton!);

            await waitFor(() => {
                const googleButton = screen.getByText('Google').closest('button');
                expect(googleButton).toBeDisabled();
            });
        });
    });

    describe('Error Handling', () => {
        it('should display error when API request fails', async () => {
            const errorMessage = 'Failed to initialize OAuth flow';
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 500,
                json: async () => ({ error: errorMessage }),
            });

            renderComponent();

            const githubButton = screen.getByText('GitHub').closest('button');
            fireEvent.click(githubButton!);

            await waitFor(() => {
                expect(screen.getByText(errorMessage)).toBeInTheDocument();
            });

            expect(mockToast).toHaveBeenCalledWith(
                expect.objectContaining({
                    variant: 'destructive',
                    title: 'OAuth Connection Failed',
                })
            );
        });

        it('should handle missing authUrl in response', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ state: 'test-state' }), // Missing authUrl
            });

            renderComponent();

            const githubButton = screen.getByText('GitHub').closest('button');
            fireEvent.click(githubButton!);

            await waitFor(() => {
                expect(
                    screen.getByText('No authorization URL received from server')
                ).toBeInTheDocument();
            });
        });

        it('should handle network errors', async () => {
            (global.fetch as jest.Mock).mockRejectedValueOnce(
                new Error('Network error')
            );

            renderComponent();

            const githubButton = screen.getByText('GitHub').closest('button');
            fireEvent.click(githubButton!);

            await waitFor(() => {
                expect(screen.getByText('Network error')).toBeInTheDocument();
            });
        });

        it('should clear error when modal is closed and reopened', async () => {
            const errorMessage = 'Test error';
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                json: async () => ({ error: errorMessage }),
            });

            const { rerender } = renderComponent();

            const githubButton = screen.getByText('GitHub').closest('button');
            fireEvent.click(githubButton!);

            await waitFor(() => {
                expect(screen.getByText(errorMessage)).toBeInTheDocument();
            });

            // Close modal
            rerender(
                <MCPOAuthConnect
                    isOpen={false}
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                />
            );

            // Reopen modal
            rerender(
                <MCPOAuthConnect
                    isOpen={true}
                    onClose={mockOnClose}
                    onSuccess={mockOnSuccess}
                />
            );

            expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
        });
    });

    describe('User Interactions', () => {
        it('should call onClose when cancel button is clicked', () => {
            renderComponent();

            const cancelButton = screen.getByText('Cancel');
            fireEvent.click(cancelButton);

            expect(mockOnClose).toHaveBeenCalled();
        });

        it('should prevent closing during OAuth flow', async () => {
            (global.fetch as jest.Mock).mockImplementation(
                () => new Promise((resolve) => setTimeout(resolve, 1000))
            );

            renderComponent();

            const githubButton = screen.getByText('GitHub').closest('button');
            fireEvent.click(githubButton!);

            await waitFor(() => {
                const cancelButton = screen.getByText('Cancel');
                expect(cancelButton).toBeDisabled();
            });
        });

        it('should call onSuccess after successful OAuth initialization', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    authUrl: 'https://provider.com/auth',
                    state: 'test-state',
                }),
            });

            renderComponent();

            const githubButton = screen.getByText('GitHub').closest('button');
            fireEvent.click(githubButton!);

            await waitFor(
                () => {
                    expect(mockOnSuccess).toHaveBeenCalled();
                },
                { timeout: 1000 }
            );
        });
    });

    describe('Accessibility', () => {
        it('should have proper dialog role', () => {
            renderComponent();
            expect(screen.getByRole('dialog')).toBeInTheDocument();
        });

        it('should have accessible provider buttons', () => {
            renderComponent();
            const buttons = screen.getAllByRole('button');
            expect(buttons.length).toBeGreaterThan(0);
            buttons.forEach((button) => {
                expect(button).toBeVisible();
            });
        });
    });
});
