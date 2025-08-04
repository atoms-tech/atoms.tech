import { render, screen, fireEvent } from '@/test-utils';
import { ErrorCard } from '../error-card';

describe('ErrorCard Component', () => {
    const defaultProps = {
        title: 'Error Title',
        message: 'This is an error message',
    };

    it('renders with title and message', () => {
        render(<ErrorCard {...defaultProps} />);
        
        expect(screen.getByText('Error Title')).toBeInTheDocument();
        expect(screen.getByText('This is an error message')).toBeInTheDocument();
        expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('renders without action buttons', () => {
        render(<ErrorCard {...defaultProps} />);
        
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('renders with retry button', () => {
        const handleRetry = jest.fn();
        const retryButton = {
            onClick: handleRetry,
            text: 'Try Again'
        };

        render(
            <ErrorCard 
                {...defaultProps} 
                retryButton={retryButton}
            />
        );
        
        const button = screen.getByRole('button', { name: 'Try Again' });
        expect(button).toBeInTheDocument();
        expect(button).toHaveClass('variant-outline');
        
        fireEvent.click(button);
        expect(handleRetry).toHaveBeenCalledTimes(1);
    });

    it('renders with redirect button', () => {
        const handleRedirect = jest.fn();
        const redirectButton = {
            onClick: handleRedirect,
            text: 'Go Home'
        };

        render(
            <ErrorCard 
                {...defaultProps} 
                redirectButton={redirectButton}
            />
        );
        
        const button = screen.getByRole('button', { name: 'Go Home' });
        expect(button).toBeInTheDocument();
        expect(button).toHaveClass('variant-default');
        
        fireEvent.click(button);
        expect(handleRedirect).toHaveBeenCalledTimes(1);
    });

    it('renders with both retry and redirect buttons', () => {
        const handleRetry = jest.fn();
        const handleRedirect = jest.fn();
        
        const retryButton = {
            onClick: handleRetry,
            text: 'Retry'
        };
        
        const redirectButton = {
            onClick: handleRedirect,
            text: 'Back to Home'
        };

        render(
            <ErrorCard 
                {...defaultProps} 
                retryButton={retryButton}
                redirectButton={redirectButton}
            />
        );
        
        expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Back to Home' })).toBeInTheDocument();
        
        fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
        expect(handleRetry).toHaveBeenCalledTimes(1);
        
        fireEvent.click(screen.getByRole('button', { name: 'Back to Home' }));
        expect(handleRedirect).toHaveBeenCalledTimes(1);
    });

    it('has correct layout structure', () => {
        render(<ErrorCard {...defaultProps} />);
        
        const container = screen.getByRole('alert').closest('div');
        expect(container).toHaveClass(
            'flex',
            'min-h-screen',
            'items-center',
            'justify-center',
            'p-4'
        );
        
        const alert = screen.getByRole('alert');
        expect(alert).toHaveClass('max-w-md');
    });

    it('has correct button container layout when buttons are present', () => {
        const retryButton = {
            onClick: jest.fn(),
            text: 'Retry'
        };

        render(
            <ErrorCard 
                {...defaultProps} 
                retryButton={retryButton}
            />
        );
        
        const buttonContainer = screen.getByRole('button').closest('div');
        expect(buttonContainer).toHaveClass('mt-4', 'flex', 'gap-2');
    });

    it('displays error content properly within Alert component', () => {
        render(<ErrorCard {...defaultProps} />);
        
        const alert = screen.getByRole('alert');
        expect(alert).toHaveAttribute('class', expect.stringContaining('border-destructive'));
        
        const title = screen.getByText('Error Title');
        const message = screen.getByText('This is an error message');
        
        expect(alert).toContainElement(title);
        expect(alert).toContainElement(message);
        expect(message).toHaveClass('mt-2');
    });

    it('handles complex error messages', () => {
        const complexMessage = 'Network request failed. Please check your internet connection and try again.';
        
        render(
            <ErrorCard 
                title="Network Error"
                message={complexMessage}
            />
        );
        
        expect(screen.getByText(complexMessage)).toBeInTheDocument();
    });
});