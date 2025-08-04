import { render, screen, fireEvent } from '@/test-utils';
import { Switch } from '../switch';

describe('Switch Component', () => {
    it('renders correctly', () => {
        render(<Switch data-testid="switch" />);
        
        const switchElement = screen.getByTestId('switch');
        expect(switchElement).toBeInTheDocument();
        expect(switchElement).toHaveAttribute('role', 'switch');
    });

    it('has correct default state (unchecked)', () => {
        render(<Switch data-testid="switch" />);
        
        const switchElement = screen.getByTestId('switch');
        expect(switchElement).toHaveAttribute('aria-checked', 'false');
        expect(switchElement).toHaveAttribute('data-state', 'unchecked');
    });

    it('handles checked state', () => {
        render(<Switch defaultChecked data-testid="switch" />);
        
        const switchElement = screen.getByTestId('switch');
        expect(switchElement).toHaveAttribute('aria-checked', 'true');
        expect(switchElement).toHaveAttribute('data-state', 'checked');
    });

    it('handles controlled checked state', () => {
        const { rerender } = render(<Switch checked={false} data-testid="switch" />);
        
        let switchElement = screen.getByTestId('switch');
        expect(switchElement).toHaveAttribute('aria-checked', 'false');
        
        rerender(<Switch checked={true} data-testid="switch" />);
        
        switchElement = screen.getByTestId('switch');
        expect(switchElement).toHaveAttribute('aria-checked', 'true');
    });

    it('calls onCheckedChange when clicked', () => {
        const handleChange = jest.fn();
        render(
            <Switch 
                onCheckedChange={handleChange} 
                data-testid="switch" 
            />
        );
        
        const switchElement = screen.getByTestId('switch');
        fireEvent.click(switchElement);
        
        expect(handleChange).toHaveBeenCalledWith(true);
    });

    it('handles disabled state', () => {
        render(<Switch disabled data-testid="switch" />);
        
        const switchElement = screen.getByTestId('switch');
        expect(switchElement).toBeDisabled();
        expect(switchElement).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50');
    });

    it('does not call onCheckedChange when disabled', () => {
        const handleChange = jest.fn();
        render(
            <Switch 
                disabled 
                onCheckedChange={handleChange} 
                data-testid="switch" 
            />
        );
        
        const switchElement = screen.getByTestId('switch');
        fireEvent.click(switchElement);
        
        expect(handleChange).not.toHaveBeenCalled();
    });

    it('applies custom className', () => {
        const customClass = 'custom-switch-class';
        render(
            <Switch 
                className={customClass} 
                data-testid="switch" 
            />
        );
        
        const switchElement = screen.getByTestId('switch');
        expect(switchElement).toHaveClass(customClass);
    });

    it('applies base styling classes', () => {
        render(<Switch data-testid="switch" />);
        
        const switchElement = screen.getByTestId('switch');
        expect(switchElement).toHaveClass(
            'peer',
            'inline-flex',
            'h-6',
            'w-11',
            'shrink-0',
            'cursor-pointer',
            'items-center',
            'rounded-full',
            'border-2',
            'border-transparent',
            'transition-colors'
        );
    });

    it('has correct focus styles', () => {
        render(<Switch data-testid="switch" />);
        
        const switchElement = screen.getByTestId('switch');
        expect(switchElement).toHaveClass(
            'focus-visible:outline-none',
            'focus-visible:ring-2',
            'focus-visible:ring-ring',
            'focus-visible:ring-offset-2',
            'focus-visible:ring-offset-background'
        );
    });

    it('shows correct visual state for unchecked', () => {
        render(<Switch data-testid="switch" />);
        
        const switchElement = screen.getByTestId('switch');
        expect(switchElement).toHaveClass('data-[state=unchecked]:bg-input');
    });

    it('shows correct visual state for checked', () => {
        render(<Switch defaultChecked data-testid="switch" />);
        
        const switchElement = screen.getByTestId('switch');
        expect(switchElement).toHaveClass('data-[state=checked]:bg-primary');
    });

    it('contains thumb element with correct styling', () => {
        render(<Switch data-testid="switch" />);
        
        const switchElement = screen.getByTestId('switch');
        const thumb = switchElement.querySelector('[data-radix-switch-thumb]');
        
        expect(thumb).toBeInTheDocument();
        expect(thumb).toHaveClass(
            'pointer-events-none',
            'block',
            'h-5',
            'w-5',
            'rounded-full',
            'bg-background',
            'shadow-lg',
            'ring-0',
            'transition-transform'
        );
    });

    it('has correct thumb position for unchecked state', () => {
        render(<Switch data-testid="switch" />);
        
        const switchElement = screen.getByTestId('switch');
        const thumb = switchElement.querySelector('[data-radix-switch-thumb]');
        
        expect(thumb).toHaveClass('data-[state=unchecked]:translate-x-0');
    });

    it('has correct thumb position for checked state', () => {
        render(<Switch defaultChecked data-testid="switch" />);
        
        const switchElement = screen.getByTestId('switch');
        const thumb = switchElement.querySelector('[data-radix-switch-thumb]');
        
        expect(thumb).toHaveClass('data-[state=checked]:translate-x-5');
    });

    it('forwards HTML attributes', () => {
        render(
            <Switch 
                data-testid="switch"
                data-custom="test-value"
                name="test-switch"
                value="test"
                id="switch-1"
            />
        );
        
        const switchElement = screen.getByTestId('switch');
        expect(switchElement).toHaveAttribute('data-custom', 'test-value');
        expect(switchElement).toHaveAttribute('name', 'test-switch');
        expect(switchElement).toHaveAttribute('value', 'test');
        expect(switchElement).toHaveAttribute('id', 'switch-1');
    });

    it('has correct display name', () => {
        expect(Switch.displayName).toBe('Switch');
    });

    it('supports keyboard navigation', () => {
        const handleChange = jest.fn();
        render(
            <Switch 
                onCheckedChange={handleChange} 
                data-testid="switch" 
            />
        );
        
        const switchElement = screen.getByTestId('switch');
        
        // Focus the switch
        switchElement.focus();
        expect(switchElement).toHaveFocus();
        
        // Press Enter to toggle
        fireEvent.keyDown(switchElement, { key: 'Enter' });
        expect(handleChange).toHaveBeenCalledWith(true);
        
        // Press Space to toggle
        fireEvent.keyDown(switchElement, { key: ' ' });
        expect(handleChange).toHaveBeenCalledTimes(2);
    });

    describe('Accessibility', () => {
        it('has correct ARIA attributes', () => {
            render(<Switch data-testid="switch" />);
            
            const switchElement = screen.getByTestId('switch');
            expect(switchElement).toHaveAttribute('role', 'switch');
            expect(switchElement).toHaveAttribute('aria-checked', 'false');
        });

        it('supports aria-label', () => {
            render(
                <Switch 
                    aria-label="Enable notifications"
                    data-testid="switch" 
                />
            );
            
            const switchElement = screen.getByTestId('switch');
            expect(switchElement).toHaveAttribute('aria-label', 'Enable notifications');
        });

        it('supports aria-describedby', () => {
            render(
                <Switch 
                    aria-describedby="switch-description"
                    data-testid="switch" 
                />
            );
            
            const switchElement = screen.getByTestId('switch');
            expect(switchElement).toHaveAttribute('aria-describedby', 'switch-description');
        });
    });
});