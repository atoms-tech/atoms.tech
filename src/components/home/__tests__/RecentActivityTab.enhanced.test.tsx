import { render, screen } from '@testing-library/react';
import { RecentActivityTab } from '../RecentActivityTab';
import { UserProvider } from '@/lib/providers/user.provider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

// Mock framer-motion
jest.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
}));

// Mock user provider data
const createMockUserProvider = (userData: any = {}) => {
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
const createWrapper = (userData?: any) => {
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
    UserProvider: ({ children }: { children: ReactNode }) => children,
}));

describe('RecentActivityTab', () => {
    beforeEach(() => {
        // Mock Date for consistent greeting tests
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should render greeting with full name when available', () => {
        const userData = {
            user: { email: 'test@example.com' },
            profile: { full_name: 'John Doe' },
        };
        
        render(<RecentActivityTab />, { wrapper: createWrapper(userData) });
        
        expect(screen.getByText(/John Doe/)).toBeInTheDocument();
    });

    it('should render greeting with email username when no full name', () => {
        const userData = {
            user: { email: 'johndoe@example.com' },
            profile: { full_name: null },
        };
        
        render(<RecentActivityTab />, { wrapper: createWrapper(userData) });
        
        expect(screen.getByText(/johndoe/)).toBeInTheDocument();
    });

    it('should render empty greeting when no user data', () => {
        const userData = {
            user: null,
            profile: null,
        };
        
        render(<RecentActivityTab />, { wrapper: createWrapper(userData) });
        
        // Should still render the greeting structure
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('should show morning greeting', () => {
        // Set time to 9 AM
        jest.setSystemTime(new Date('2024-01-01 09:00:00'));
        
        const userData = {
            user: { email: 'test@example.com' },
            profile: { full_name: 'Test User' },
        };
        
        render(<RecentActivityTab />, { wrapper: createWrapper(userData) });
        
        expect(screen.getByText(/Good morning/)).toBeInTheDocument();
    });

    it('should show afternoon greeting', () => {
        // Set time to 3 PM
        jest.setSystemTime(new Date('2024-01-01 15:00:00'));
        
        const userData = {
            user: { email: 'test@example.com' },
            profile: { full_name: 'Test User' },
        };
        
        render(<RecentActivityTab />, { wrapper: createWrapper(userData) });
        
        expect(screen.getByText(/Good afternoon/)).toBeInTheDocument();
    });

    it('should show evening greeting', () => {
        // Set time to 8 PM
        jest.setSystemTime(new Date('2024-01-01 20:00:00'));
        
        const userData = {
            user: { email: 'test@example.com' },
            profile: { full_name: 'Test User' },
        };
        
        render(<RecentActivityTab />, { wrapper: createWrapper(userData) });
        
        expect(screen.getByText(/Good evening/)).toBeInTheDocument();
    });

    it('should render quick action buttons', () => {
        render(<RecentActivityTab />, { wrapper: createWrapper() });
        
        expect(screen.getByText('Create New Project')).toBeInTheDocument();
        expect(screen.getByText('New Document')).toBeInTheDocument();
        expect(screen.getByText('Invite Team')).toBeInTheDocument();
    });

    it('should render recent activity section', () => {
        render(<RecentActivityTab />, { wrapper: createWrapper() });
        
        expect(screen.getByText('Recent Activity')).toBeInTheDocument();
        expect(screen.getByText('Your latest actions and updates')).toBeInTheDocument();
    });

    it('should show empty state when no activities', () => {
        render(<RecentActivityTab />, { wrapper: createWrapper() });
        
        expect(screen.getByText('No recent activity')).toBeInTheDocument();
        expect(screen.getByText('Start working on projects to see activity here')).toBeInTheDocument();
        expect(screen.getByText('Browse Projects')).toBeInTheDocument();
    });

    it('should display project count information', () => {
        render(<RecentActivityTab />, { wrapper: createWrapper() });
        
        expect(screen.getByText(/You have access to 3 projects across 3 organizations/)).toBeInTheDocument();
    });

    it('should handle edge case of midnight time', () => {
        // Set time to midnight
        jest.setSystemTime(new Date('2024-01-01 00:00:00'));
        
        const userData = {
            user: { email: 'test@example.com' },
            profile: { full_name: 'Test User' },
        };
        
        render(<RecentActivityTab />, { wrapper: createWrapper(userData) });
        
        expect(screen.getByText(/Good morning/)).toBeInTheDocument();
    });

    it('should handle edge case of noon time', () => {
        // Set time to exactly noon
        jest.setSystemTime(new Date('2024-01-01 12:00:00'));
        
        const userData = {
            user: { email: 'test@example.com' },
            profile: { full_name: 'Test User' },
        };
        
        render(<RecentActivityTab />, { wrapper: createWrapper(userData) });
        
        expect(screen.getByText(/Good afternoon/)).toBeInTheDocument();
    });

    it('should handle edge case of 6 PM time', () => {
        // Set time to exactly 6 PM
        jest.setSystemTime(new Date('2024-01-01 18:00:00'));
        
        const userData = {
            user: { email: 'test@example.com' },
            profile: { full_name: 'Test User' },
        };
        
        render(<RecentActivityTab />, { wrapper: createWrapper(userData) });
        
        expect(screen.getByText(/Good evening/)).toBeInTheDocument();
    });

    it('should extract email username correctly', () => {
        const userData = {
            user: { email: 'complex.email+tag@example.co.uk' },
            profile: { full_name: null },
        };
        
        render(<RecentActivityTab />, { wrapper: createWrapper(userData) });
        
        expect(screen.getByText(/complex.email\+tag/)).toBeInTheDocument();
    });

    it('should handle empty email gracefully', () => {
        const userData = {
            user: { email: '' },
            profile: { full_name: null },
        };
        
        render(<RecentActivityTab />, { wrapper: createWrapper(userData) });
        
        // Should still render without crashing
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('should render with proper semantic structure', () => {
        render(<RecentActivityTab />, { wrapper: createWrapper() });
        
        // Should have proper heading hierarchy
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
        
        // Should have buttons with proper roles
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
    });

    it('should handle very long display names', () => {
        const userData = {
            user: { email: 'test@example.com' },
            profile: { full_name: 'This Is A Very Long Full Name That Might Cause Layout Issues' },
        };
        
        render(<RecentActivityTab />, { wrapper: createWrapper(userData) });
        
        expect(screen.getByText(/This Is A Very Long Full Name That Might Cause Layout Issues/)).toBeInTheDocument();
    });

    it('should maintain motion animation props', () => {
        render(<RecentActivityTab />, { wrapper: createWrapper() });
        
        // The motion.div should be rendered (mocked as regular div)
        const container = screen.getByRole('heading', { level: 1 }).closest('div');
        expect(container).toBeInTheDocument();
    });
});
