import { render, screen } from '@/test-utils';
import { Alert, AlertTitle, AlertDescription } from '../alert';

describe('Alert Component', () => {
    describe('Alert', () => {
        it('renders with default variant', () => {
            render(<Alert data-testid="alert">Test alert</Alert>);
            
            const alert = screen.getByTestId('alert');
            expect(alert).toBeInTheDocument();
            expect(alert).toHaveAttribute('role', 'alert');
            expect(alert).toHaveClass('bg-background', 'text-foreground');
        });

        it('renders with destructive variant', () => {
            render(
                <Alert variant="destructive" data-testid="alert">
                    Destructive alert
                </Alert>
            );
            
            const alert = screen.getByTestId('alert');
            expect(alert).toHaveClass('border-destructive/50', 'text-destructive');
        });

        it('applies custom className', () => {
            const customClass = 'custom-alert-class';
            render(
                <Alert className={customClass} data-testid="alert">
                    Custom class alert
                </Alert>
            );
            
            const alert = screen.getByTestId('alert');
            expect(alert).toHaveClass(customClass);
        });

        it('forwards HTML attributes', () => {
            render(
                <Alert data-testid="alert" data-custom="test">
                    Test alert
                </Alert>
            );
            
            const alert = screen.getByTestId('alert');
            expect(alert).toHaveAttribute('data-custom', 'test');
        });

        it('has correct display name', () => {
            expect(Alert.displayName).toBe('Alert');
        });
    });

    describe('AlertTitle', () => {
        it('renders correctly', () => {
            render(<AlertTitle>Alert Title</AlertTitle>);
            
            const title = screen.getByRole('heading', { level: 5 });
            expect(title).toBeInTheDocument();
            expect(title).toHaveTextContent('Alert Title');
            expect(title).toHaveClass('mb-1', 'font-medium', 'leading-none', 'tracking-tight');
        });

        it('applies custom className', () => {
            const customClass = 'custom-title-class';
            render(<AlertTitle className={customClass}>Title</AlertTitle>);
            
            const title = screen.getByRole('heading', { level: 5 });
            expect(title).toHaveClass(customClass);
        });

        it('has correct display name', () => {
            expect(AlertTitle.displayName).toBe('AlertTitle');
        });
    });

    describe('AlertDescription', () => {
        it('renders correctly', () => {
            render(<AlertDescription>Alert description text</AlertDescription>);
            
            const description = screen.getByText('Alert description text');
            expect(description).toBeInTheDocument();
            expect(description).toHaveClass('text-sm', '[&_p]:leading-relaxed');
        });

        it('applies custom className', () => {
            const customClass = 'custom-description-class';
            render(
                <AlertDescription className={customClass}>
                    Description
                </AlertDescription>
            );
            
            const description = screen.getByText('Description');
            expect(description).toHaveClass(customClass);
        });

        it('has correct display name', () => {
            expect(AlertDescription.displayName).toBe('AlertDescription');
        });
    });

    describe('Alert Complete Example', () => {
        it('renders alert with title and description', () => {
            render(
                <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>Something went wrong. Please try again.</AlertDescription>
                </Alert>
            );

            expect(screen.getByRole('alert')).toBeInTheDocument();
            expect(screen.getByRole('heading', { level: 5 })).toHaveTextContent('Error');
            expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument();
        });
    });
});