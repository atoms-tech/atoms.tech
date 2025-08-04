import { render, screen, fireEvent, waitFor } from '@/test-utils';
import { MultiSelect, MultiSelectOption } from '../multi-select';

const mockOptions: MultiSelectOption[] = [
    { label: 'Option 1', value: 'option1' },
    { label: 'Option 2', value: 'option2' },
    { label: 'Option 3', value: 'option3' },
    { label: 'Option 4', value: 'option4' },
];

describe('MultiSelect Component', () => {
    const defaultProps = {
        values: [],
        options: mockOptions,
        onChange: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders with placeholder when no values selected', () => {
        render(<MultiSelect {...defaultProps} />);
        
        expect(screen.getByText('Select options...')).toBeInTheDocument();
    });

    it('renders with custom placeholder', () => {
        const customPlaceholder = 'Choose items...';
        render(
            <MultiSelect 
                {...defaultProps} 
                placeholder={customPlaceholder} 
            />
        );
        
        expect(screen.getByText(customPlaceholder)).toBeInTheDocument();
    });

    it('displays selected values as badges', () => {
        const selectedValues = ['option1', 'option2'];
        render(
            <MultiSelect 
                {...defaultProps} 
                values={selectedValues}
            />
        );
        
        expect(screen.getByText('Option 1')).toBeInTheDocument();
        expect(screen.getByText('Option 2')).toBeInTheDocument();
        expect(screen.queryByText('Select options...')).not.toBeInTheDocument();
    });

    it('opens popover when clicked', async () => {
        render(<MultiSelect {...defaultProps} />);
        
        const trigger = screen.getByText('Select options...');
        fireEvent.click(trigger);
        
        await waitFor(() => {
            expect(screen.getByPlaceholderText('Search options...')).toBeInTheDocument();
        });
    });

    it('displays all options in the popover', async () => {
        render(<MultiSelect {...defaultProps} />);
        
        const trigger = screen.getByText('Select options...');
        fireEvent.click(trigger);
        
        await waitFor(() => {
            mockOptions.forEach(option => {
                expect(screen.getByText(option.label)).toBeInTheDocument();
            });
        });
    });

    it('calls onChange when option is selected', async () => {
        const onChange = jest.fn();
        render(
            <MultiSelect 
                {...defaultProps} 
                onChange={onChange}
            />
        );
        
        const trigger = screen.getByText('Select options...');
        fireEvent.click(trigger);
        
        await waitFor(() => {
            const option1 = screen.getByText('Option 1');
            fireEvent.click(option1);
        });
        
        expect(onChange).toHaveBeenCalledWith(['option1']);
    });

    it('calls onChange when option is deselected', async () => {
        const onChange = jest.fn();
        render(
            <MultiSelect 
                {...defaultProps} 
                values={['option1']}
                onChange={onChange}
            />
        );
        
        const trigger = screen.getByText('Option 1').closest('div');
        fireEvent.click(trigger!);
        
        await waitFor(() => {
            const option1 = screen.getByText('Option 1');
            fireEvent.click(option1);
        });
        
        expect(onChange).toHaveBeenCalledWith([]);
    });

    it('removes value when X button is clicked on badge', () => {
        const onChange = jest.fn();
        render(
            <MultiSelect 
                {...defaultProps} 
                values={['option1', 'option2']}
                onChange={onChange}
            />
        );
        
        const removeButtons = screen.getAllByRole('button');
        const removeButton = removeButtons.find(button => 
            button.querySelector('svg')
        );
        
        fireEvent.click(removeButton!);
        
        expect(onChange).toHaveBeenCalledWith(['option2']);
    });

    it('handles disabled state', () => {
        render(
            <MultiSelect 
                {...defaultProps} 
                disabled={true}
            />
        );
        
        const container = screen.getByText('Select options...').closest('div');
        expect(container).toHaveClass('cursor-not-allowed', 'opacity-50');
    });

    it('applies custom className', () => {
        const customClass = 'custom-multiselect';
        render(
            <MultiSelect 
                {...defaultProps} 
                className={customClass}
            />
        );
        
        const container = screen.getByText('Select options...').closest('div');
        expect(container).toHaveClass(customClass);
    });

    it('shows selected state in options dropdown', async () => {
        render(
            <MultiSelect 
                {...defaultProps} 
                values={['option1']}
            />
        );
        
        const trigger = screen.getByText('Option 1').closest('div');
        fireEvent.click(trigger!);
        
        await waitFor(() => {
            const option1Item = screen.getByText('Option 1').closest('div');
            expect(option1Item).toHaveClass('bg-accent', 'text-accent-foreground');
        });
    });

    it('shows "No options found" when search has no results', async () => {
        render(<MultiSelect {...defaultProps} />);
        
        const trigger = screen.getByText('Select options...');
        fireEvent.click(trigger);
        
        await waitFor(() => {
            const searchInput = screen.getByPlaceholderText('Search options...');
            fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
        });
        
        await waitFor(() => {
            expect(screen.getByText('No options found.')).toBeInTheDocument();
        });
    });

    it('filters options based on search input', async () => {
        render(<MultiSelect {...defaultProps} />);
        
        const trigger = screen.getByText('Select options...');
        fireEvent.click(trigger);
        
        await waitFor(() => {
            const searchInput = screen.getByPlaceholderText('Search options...');
            fireEvent.change(searchInput, { target: { value: 'Option 1' } });
        });
        
        await waitFor(() => {
            expect(screen.getByText('Option 1')).toBeInTheDocument();
            expect(screen.queryByText('Option 2')).not.toBeInTheDocument();
        });
    });

    it('handles multiple selections correctly', async () => {
        const onChange = jest.fn();
        render(
            <MultiSelect 
                {...defaultProps} 
                onChange={onChange}
            />
        );
        
        const trigger = screen.getByText('Select options...');
        fireEvent.click(trigger);
        
        await waitFor(() => {
            fireEvent.click(screen.getByText('Option 1'));
        });
        
        expect(onChange).toHaveBeenCalledWith(['option1']);
        
        // Simulate state update
        render(
            <MultiSelect 
                {...defaultProps} 
                values={['option1']}
                onChange={onChange}
            />
        );
        
        const trigger2 = screen.getByText('Option 1').closest('div');
        fireEvent.click(trigger2!);
        
        await waitFor(() => {
            fireEvent.click(screen.getByText('Option 2'));
        });
        
        expect(onChange).toHaveBeenLastCalledWith(['option1', 'option2']);
    });

    it('handles empty options array', () => {
        render(
            <MultiSelect 
                values={[]}
                options={[]}
                onChange={jest.fn()}
            />
        );
        
        expect(screen.getByText('Select options...')).toBeInTheDocument();
    });

    it('displays value when option is not found in options array', () => {
        render(
            <MultiSelect 
                {...defaultProps}
                values={['unknown-value']}
            />
        );
        
        expect(screen.getByText('unknown-value')).toBeInTheDocument();
    });

    it('stops propagation when removing badge to prevent popover toggle', () => {
        const onChange = jest.fn();
        render(
            <MultiSelect 
                {...defaultProps} 
                values={['option1']}
                onChange={onChange}
            />
        );
        
        const removeButtons = screen.getAllByRole('button');
        const removeButton = removeButtons.find(button => 
            button.querySelector('svg')
        );
        
        // Create a click event to test stopPropagation
        const clickEvent = new MouseEvent('click', { bubbles: true });
        const stopPropagationSpy = jest.spyOn(clickEvent, 'stopPropagation');
        
        fireEvent.click(removeButton!, clickEvent);
        
        expect(onChange).toHaveBeenCalledWith([]);
    });
});