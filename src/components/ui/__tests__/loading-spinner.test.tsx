import { render, screen } from '@/test-utils';
import { LoadingSpinner } from '../loading-spinner';

describe('LoadingSpinner Component', () => {
    it('renders with default size (md)', () => {
        render(<LoadingSpinner data-testid="spinner" />);
        
        const spinner = screen.getByTestId('spinner');
        expect(spinner).toBeInTheDocument();
        expect(spinner).toHaveClass('w-6', 'h-6');
    });

    it('renders with small size', () => {
        render(<LoadingSpinner size="sm" data-testid="spinner" />);
        
        const spinner = screen.getByTestId('spinner');
        expect(spinner).toHaveClass('w-4', 'h-4');
    });

    it('renders with medium size', () => {
        render(<LoadingSpinner size="md" data-testid="spinner" />);
        
        const spinner = screen.getByTestId('spinner');
        expect(spinner).toHaveClass('w-6', 'h-6');
    });

    it('renders with large size', () => {
        render(<LoadingSpinner size="lg" data-testid="spinner" />);
        
        const spinner = screen.getByTestId('spinner');
        expect(spinner).toHaveClass('w-8', 'h-8');
    });

    it('applies base spinner classes', () => {
        render(<LoadingSpinner data-testid="spinner" />);
        
        const spinner = screen.getByTestId('spinner');
        expect(spinner).toHaveClass(
            'animate-spin',
            'rounded-full',
            'border-2',
            'border-current',
            'border-t-transparent'
        );
    });

    it('applies custom className', () => {
        const customClass = 'custom-spinner-class';
        render(
            <LoadingSpinner 
                className={customClass} 
                data-testid="spinner" 
            />
        );
        
        const spinner = screen.getByTestId('spinner');
        expect(spinner).toHaveClass(customClass);
    });

    it('combines size classes with custom className', () => {
        const customClass = 'text-blue-500';
        render(
            <LoadingSpinner 
                size="lg"
                className={customClass} 
                data-testid="spinner" 
            />
        );
        
        const spinner = screen.getByTestId('spinner');
        expect(spinner).toHaveClass('w-8', 'h-8', customClass);
    });

    it('is a div element', () => {
        render(<LoadingSpinner data-testid="spinner" />);
        
        const spinner = screen.getByTestId('spinner');
        expect(spinner.tagName).toBe('DIV');
    });

    it('has proper accessibility implications (no text content)', () => {
        render(<LoadingSpinner data-testid="spinner" />);
        
        const spinner = screen.getByTestId('spinner');
        expect(spinner).toBeEmptyDOMElement();
    });

    describe('Size variants', () => {
        const sizes = [
            { size: 'sm' as const, classes: ['w-4', 'h-4'] },
            { size: 'md' as const, classes: ['w-6', 'h-6'] },
            { size: 'lg' as const, classes: ['w-8', 'h-8'] }
        ];

        sizes.forEach(({ size, classes }) => {
            it(`applies correct classes for ${size} size`, () => {
                render(<LoadingSpinner size={size} data-testid="spinner" />);
                
                const spinner = screen.getByTestId('spinner');
                classes.forEach(className => {
                    expect(spinner).toHaveClass(className);
                });
            });
        });
    });

    describe('Visual appearance', () => {
        it('has spinning animation', () => {
            render(<LoadingSpinner data-testid="spinner" />);
            
            const spinner = screen.getByTestId('spinner');
            expect(spinner).toHaveClass('animate-spin');
        });

        it('has circular border styling', () => {
            render(<LoadingSpinner data-testid="spinner" />);
            
            const spinner = screen.getByTestId('spinner');
            expect(spinner).toHaveClass(
                'rounded-full',
                'border-2',
                'border-current',
                'border-t-transparent'
            );
        });
    });
});