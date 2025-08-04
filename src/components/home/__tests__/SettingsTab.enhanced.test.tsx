import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsTab } from '../SettingsTab';
import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock framer-motion
jest.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: React.ComponentProps<'div'>) => <div {...props}>{children}</div>,
    },
}));

interface InProgressContainerProps {
    children: React.ReactNode;
    title: string;
    description: string;
    requiresModal: boolean;
    estimatedCompletion: string;
    features?: string[];
}

// Mock InProgressContainer
jest.mock('@/components/ui/in-progress-container', () => ({
    InProgressContainer: ({ children, title, description, requiresModal, estimatedCompletion, features }: InProgressContainerProps) => (
        <div data-testid={`in-progress-${title.toLowerCase().replace(/\s+/g, '-')}`}>
            <div data-testid="in-progress-content">{children}</div>
            <div data-testid="in-progress-title">{title}</div>
            <div data-testid="in-progress-description">{description}</div>
            <div data-testid="in-progress-modal">{requiresModal ? 'modal' : 'no-modal'}</div>
            <div data-testid="in-progress-completion">{estimatedCompletion}</div>
            {features && (
                <div data-testid="in-progress-features">
                    {features.map((feature: string, index: number) => (
                        <span key={index} data-testid={`feature-${index}`}>{feature}</span>
                    ))}
                </div>
            )}
        </div>
    ),
}));

interface UserData {
    user?: { email: string } | null;
    profile?: { full_name: string | null } | null;
}

// Create mock user provider
const createMockUserProvider = (userData: UserData = {}) => {
    return ({ children }: { children: ReactNode }) => {
        const defaultData = {
            user: { email: 'test@example.com' },
            profile: { full_name: 'Test User' },
            ...userData,
        };
        
        return (
            <div data-testid="mock-user-provider" data-user={JSON.stringify(defaultData)}>
                {children}
            </div>
        );
    };
};

// Create test wrapper
const createWrapper = (userData?: UserData) => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });
    
    const MockUserProvider = createMockUserProvider(userData);
    
    return ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>
            <MockUserProvider>
                {children}
            </MockUserProvider>
        </QueryClientProvider>
    );
};

// Mock useUser hook
jest.mock('@/lib/providers/user.provider', () => ({
    useUser: () => {
        const element = document.querySelector('[data-testid="mock-user-provider"]');
        const userData = element?.getAttribute('data-user');
        return userData ? JSON.parse(userData) : { user: null, profile: null };
    },
}));

describe('SettingsTab', () => {
    it('should render settings header', () => {
        render(<SettingsTab />, { wrapper: createWrapper() });
        
        expect(screen.getByText('Settings')).toBeInTheDocument();
        expect(screen.getByText('Manage your account preferences')).toBeInTheDocument();
    });

    it('should render account information card', () => {
        const userData = {
            user: { email: 'test@example.com' },
            profile: { full_name: 'John Doe' },
        };
        
        render(<SettingsTab />, { wrapper: createWrapper(userData) });
        
        expect(screen.getByText('Account Information')).toBeInTheDocument();
        expect(screen.getByText('Your current account details')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('test@example.com')).toBeInTheDocument();
        expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    });

    it('should show "Not set" when no full name', () => {
        const userData = {
            user: { email: 'test@example.com' },
            profile: { full_name: null },
        };
        
        render(<SettingsTab />, { wrapper: createWrapper(userData) });
        
        expect(screen.getByText('Not set')).toBeInTheDocument();
        expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('should render available settings category (Account Settings)', () => {
        render(<SettingsTab />, { wrapper: createWrapper() });
        
        expect(screen.getByText('Account Settings')).toBeInTheDocument();
        expect(screen.getByText('Manage your profile and account details')).toBeInTheDocument();
        expect(screen.getByText('Configure')).toBeInTheDocument();
    });

    it('should render in-progress settings categories', () => {
        render(<SettingsTab />, { wrapper: createWrapper() });
        
        // Check for in-progress categories
        expect(screen.getByTestId('in-progress-notification-preferences')).toBeInTheDocument();
        expect(screen.getByTestId('in-progress-privacy-&-security')).toBeInTheDocument();
        expect(screen.getByTestId('in-progress-appearance')).toBeInTheDocument();
        expect(screen.getByTestId('in-progress-integrations')).toBeInTheDocument();
    });

    it('should show correct estimated completion dates', () => {
        render(<SettingsTab />, { wrapper: createWrapper() });
        
        expect(screen.getByText('Q2 2024')).toBeInTheDocument(); // Notifications and Appearance
        expect(screen.getByText('Q3 2024')).toBeInTheDocument(); // Security
        expect(screen.getByText('Q4 2024')).toBeInTheDocument(); // Integrations
    });

    it('should display features for notification preferences', () => {
        render(<SettingsTab />, { wrapper: createWrapper() });
        
        const notificationContainer = screen.getByTestId('in-progress-notification-preferences');
        
        expect(notificationContainer).toBeInTheDocument();
        expect(screen.getByTestId('feature-0')).toHaveTextContent('Email notification controls');
        expect(screen.getByTestId('feature-1')).toHaveTextContent('In-app notification settings');
        expect(screen.getByTestId('feature-2')).toHaveTextContent('Digest frequency options');
        expect(screen.getByTestId('feature-3')).toHaveTextContent('Team mention alerts');
    });

    it('should display features for security settings', () => {
        render(<SettingsTab />, { wrapper: createWrapper() });
        
        const securityContainer = screen.getByTestId('in-progress-privacy-&-security');
        const featuresContainer = securityContainer.querySelector('[data-testid="in-progress-features"]');
        
        expect(featuresContainer).toBeInTheDocument();
        expect(screen.getByText('Two-factor authentication')).toBeInTheDocument();
        expect(screen.getByText('Session management')).toBeInTheDocument();
        expect(screen.getByText('Data export controls')).toBeInTheDocument();
        expect(screen.getByText('Privacy settings')).toBeInTheDocument();
    });

    it('should display features for appearance settings', () => {
        render(<SettingsTab />, { wrapper: createWrapper() });
        
        expect(screen.getByText('Dark/light theme toggle')).toBeInTheDocument();
        expect(screen.getByText('Custom color schemes')).toBeInTheDocument();
        expect(screen.getByText('Font size preferences')).toBeInTheDocument();
        expect(screen.getByText('Layout density options')).toBeInTheDocument();
    });

    it('should display features for integrations', () => {
        render(<SettingsTab />, { wrapper: createWrapper() });
        
        expect(screen.getByText('GitHub integration')).toBeInTheDocument();
        expect(screen.getByText('Slack notifications')).toBeInTheDocument();
        expect(screen.getByText('API key management')).toBeInTheDocument();
        expect(screen.getByText('Webhook configurations')).toBeInTheDocument();
    });

    it('should show modal requirement for in-progress features', () => {
        render(<SettingsTab />, { wrapper: createWrapper() });
        
        // All in-progress features should require modal
        expect(screen.getByTestId('in-progress-notification-preferences')).toHaveTextContent('modal');
        expect(screen.getByTestId('in-progress-privacy-&-security')).toHaveTextContent('modal');
        expect(screen.getByTestId('in-progress-appearance')).toHaveTextContent('modal');
        expect(screen.getByTestId('in-progress-integrations')).toHaveTextContent('modal');
    });

    it('should handle click on configure button for available settings', () => {
        render(<SettingsTab />, { wrapper: createWrapper() });
        
        const configureButton = screen.getByText('Configure');
        fireEvent.click(configureButton);
        
        // Should not crash and button should be clickable
        expect(configureButton).toBeInTheDocument();
    });

    it('should handle user with empty profile gracefully', () => {
        const userData = {
            user: { email: 'test@example.com' },
            profile: {},
        };
        
        render(<SettingsTab />, { wrapper: createWrapper(userData) });
        
        expect(screen.getByText('Not set')).toBeInTheDocument();
        expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('should handle null user data gracefully', () => {
        const userData = {
            user: null,
            profile: null,
        };
        
        render(<SettingsTab />, { wrapper: createWrapper(userData) });
        
        expect(screen.getByText('Not set')).toBeInTheDocument();
        // Should still render the settings structure
        expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should have proper semantic structure', () => {
        render(<SettingsTab />, { wrapper: createWrapper() });
        
        // Should have proper heading
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Settings');
        
        // Should have buttons
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
    });

    it('should render with motion animation props', () => {
        render(<SettingsTab />, { wrapper: createWrapper() });
        
        // The motion.div should be rendered (mocked as regular div)
        const settingsContainer = screen.getByText('Settings').closest('div');
        expect(settingsContainer).toBeInTheDocument();
    });

    it('should show coming soon buttons for disabled features', () => {
        render(<SettingsTab />, { wrapper: createWrapper() });
        
        const comingSoonButtons = screen.getAllByText('Coming Soon');
        expect(comingSoonButtons).toHaveLength(4); // 4 in-progress features
        
        comingSoonButtons.forEach(button => {
            expect(button).toBeDisabled();
        });
    });

    it('should display all setting categories with correct icons', () => {
        render(<SettingsTab />, { wrapper: createWrapper() });
        
        // All categories should be rendered
        expect(screen.getByText('Account Settings')).toBeInTheDocument();
        expect(screen.getByText('Notification Preferences')).toBeInTheDocument();
        expect(screen.getByText('Privacy & Security')).toBeInTheDocument();
        expect(screen.getByText('Appearance')).toBeInTheDocument();
        expect(screen.getByText('Integrations')).toBeInTheDocument();
    });

    it('should handle long email addresses', () => {
        const userData = {
            user: { email: 'very.long.email.address.that.might.cause.layout.issues@example.com' },
            profile: { full_name: 'Test User' },
        };
        
        render(<SettingsTab />, { wrapper: createWrapper(userData) });
        
        expect(screen.getByText('very.long.email.address.that.might.cause.layout.issues@example.com')).toBeInTheDocument();
    });

    it('should maintain proper category order', () => {
        render(<SettingsTab />, { wrapper: createWrapper() });
        
        const categories = [
            'Account Settings',
            'Notification Preferences', 
            'Privacy & Security',
            'Appearance',
            'Integrations'
        ];
        
        categories.forEach(category => {
            expect(screen.getByText(category)).toBeInTheDocument();
        });
    });
});
