import { render, screen, fireEvent } from '@/test-utils';
import { Checkbox } from '../checkbox';

describe('Checkbox Component', () => {
    it('renders without label', () => {
        render(<Checkbox data-testid="checkbox" />);
        
        const checkbox = screen.getByTestId('checkbox');
        expect(checkbox).toBeInTheDocument();
        expect(checkbox).toHaveAttribute('type', 'checkbox');
        expect(checkbox).toHaveClass('sr-only', 'peer');
    });

    it('renders with label', () => {
        const labelText = 'Accept terms and conditions';
        render(<Checkbox label={labelText} data-testid="checkbox" />);
        
        expect(screen.getByText(labelText)).toBeInTheDocument();
        expect(screen.getByTestId('checkbox')).toBeInTheDocument();
    });

    it('applies custom className to toggle element', () => {
        const customClass = 'custom-toggle-class';
        render(<Checkbox className={customClass} data-testid="checkbox" />);
        
        // Custom class is applied to the visual toggle div
        const toggleDiv = screen.getByTestId('checkbox').nextElementSibling;
        expect(toggleDiv).toHaveClass(customClass);
    });

    it('applies custom labelClassName', () => {
        const customLabelClass = 'custom-label-class';
        render(
            <Checkbox 
                label="Test label" 
                labelClassName={customLabelClass}
                data-testid="checkbox"
            />
        );
        
        const label = screen.getByText('Test label');
        expect(label).toHaveClass(customLabelClass);
    });

    it('applies custom wrapperClassName', () => {
        const customWrapperClass = 'custom-wrapper-class';
        render(
            <Checkbox 
                wrapperClassName={customWrapperClass}
                data-testid="checkbox"
            />
        );
        
        const wrapper = screen.getByTestId('checkbox').closest('label');
        expect(wrapper).toHaveClass(customWrapperClass);
    });

    it('handles checked state', () => {
        render(<Checkbox defaultChecked data-testid="checkbox" />);
        
        const checkbox = screen.getByTestId('checkbox');
        expect(checkbox).toBeChecked();
    });

    it('handles disabled state', () => {
        render(<Checkbox disabled data-testid="checkbox" />);
        
        const checkbox = screen.getByTestId('checkbox');
        expect(checkbox).toBeDisabled();
    });

    it('handles onChange events', () => {
        const handleChange = jest.fn();
        render(<Checkbox onChange={handleChange} data-testid="checkbox" />);
        
        const checkbox = screen.getByTestId('checkbox');
        fireEvent.click(checkbox);
        
        expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it('forwards HTML attributes', () => {
        render(
            <Checkbox 
                data-testid="checkbox"
                data-custom="test-value"
                name="test-checkbox"
                value="test"
            />
        );
        
        const checkbox = screen.getByTestId('checkbox');
        expect(checkbox).toHaveAttribute('data-custom', 'test-value');
        expect(checkbox).toHaveAttribute('name', 'test-checkbox');
        expect(checkbox).toHaveAttribute('value', 'test');
    });

    it('has accessible structure', () => {
        render(<Checkbox label="Accessible checkbox" data-testid="checkbox" />);
        
        const checkbox = screen.getByTestId('checkbox');
        const label = checkbox.closest('label');
        
        expect(label).toBeInTheDocument();
        expect(label).toHaveClass('inline-flex', 'items-center', 'cursor-pointer');
    });

    it('shows correct visual states with peer classes', () => {
        render(<Checkbox data-testid="checkbox" />);
        
        const checkbox = screen.getByTestId('checkbox');
        const toggleDiv = checkbox.nextElementSibling;
        
        // Check that peer classes are applied correctly
        expect(toggleDiv).toHaveClass(
            'relative',
            'w-11',
            'h-6',
            'bg-gray-200',
            'peer-focus:outline-none',
            'rounded-full',
            'peer',
            'dark:bg-gray-700'
        );
    });
});