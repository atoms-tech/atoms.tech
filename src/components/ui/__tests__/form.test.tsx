import { render, screen } from '@/test-utils';
import { useForm } from 'react-hook-form';
import { 
    Form, 
    FormItem, 
    FormLabel, 
    FormControl, 
    FormDescription, 
    FormMessage, 
    FormField,
    useFormField
} from '../form';

// Test component to test form functionality
const TestFormComponent = () => {
    const form = useForm({
        defaultValues: {
            email: '',
            password: ''
        }
    });

    return (
        <Form {...form}>
            <form>
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <input 
                                    type="email" 
                                    placeholder="Enter email"
                                    {...field}
                                />
                            </FormControl>
                            <FormDescription>
                                We'll never share your email.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </form>
        </Form>
    );
};

// Test component with validation error
const TestFormWithError = () => {
    const form = useForm({
        defaultValues: { email: '' }
    });

    // Set an error manually for testing
    form.setError('email', { 
        type: 'required', 
        message: 'Email is required' 
    });

    return (
        <Form {...form}>
            <form>
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <input type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </form>
        </Form>
    );
};

describe('Form Components', () => {
    describe('Form', () => {
        it('renders form with all components', () => {
            render(<TestFormComponent />);
            
            expect(screen.getByLabelText('Email')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
            expect(screen.getByText("We'll never share your email.")).toBeInTheDocument();
        });
    });

    describe('FormItem', () => {
        it('renders with correct styling', () => {
            render(<TestFormComponent />);
            
            const formItem = screen.getByLabelText('Email').closest('div');
            expect(formItem).toHaveClass('space-y-2');
        });

        it('has correct display name', () => {
            expect(FormItem.displayName).toBe('FormItem');
        });
    });

    describe('FormLabel', () => {
        it('renders correctly', () => {
            render(<TestFormComponent />);
            
            const label = screen.getByText('Email');
            expect(label).toBeInTheDocument();
            expect(label.tagName).toBe('LABEL');
        });

        it('shows error styling when field has error', () => {
            render(<TestFormWithError />);
            
            const label = screen.getByText('Email');
            expect(label).toHaveClass('text-destructive');
        });

        it('has correct display name', () => {
            expect(FormLabel.displayName).toBe('FormLabel');
        });
    });

    describe('FormControl', () => {
        it('renders input correctly', () => {
            render(<TestFormComponent />);
            
            const input = screen.getByPlaceholderText('Enter email');
            expect(input).toBeInTheDocument();
            expect(input).toHaveAttribute('type', 'email');
        });

        it('has correct accessibility attributes', () => {
            render(<TestFormComponent />);
            
            const input = screen.getByPlaceholderText('Enter email');
            expect(input).toHaveAttribute('aria-describedby');
            expect(input).toHaveAttribute('aria-invalid', 'false');
        });

        it('sets aria-invalid to true when field has error', () => {
            render(<TestFormWithError />);
            
            const input = screen.getByRole('textbox');
            expect(input).toHaveAttribute('aria-invalid', 'true');
        });

        it('has correct display name', () => {
            expect(FormControl.displayName).toBe('FormControl');
        });
    });

    describe('FormDescription', () => {
        it('renders description text', () => {
            render(<TestFormComponent />);
            
            const description = screen.getByText("We'll never share your email.");
            expect(description).toBeInTheDocument();
            expect(description.tagName).toBe('P');
            expect(description).toHaveClass('text-[0.8rem]', 'text-muted-foreground');
        });

        it('has correct display name', () => {
            expect(FormDescription.displayName).toBe('FormDescription');
        });
    });

    describe('FormMessage', () => {
        it('does not render when no error', () => {
            render(<TestFormComponent />);
            
            // No error message should be visible
            expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
        });

        it('renders error message when field has error', () => {
            render(<TestFormWithError />);
            
            const errorMessage = screen.getByText('Email is required');
            expect(errorMessage).toBeInTheDocument();
            expect(errorMessage.tagName).toBe('P');
            expect(errorMessage).toHaveClass('text-[0.8rem]', 'font-medium', 'text-destructive');
        });

        it('has correct display name', () => {
            expect(FormMessage.displayName).toBe('FormMessage');
        });
    });

    describe('useFormField hook', () => {
        it('throws error when used outside FormField', () => {
            const TestComponent = () => {
                useFormField(); // This should throw
                return <div>Test</div>;
            };

            // Suppress console.error for this test
            const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
            
            expect(() => render(<TestComponent />)).toThrow(
                'useFormField should be used within <FormField>'
            );

            consoleError.mockRestore();
        });
    });

    describe('FormField accessibility', () => {
        it('connects label to input properly', () => {
            render(<TestFormComponent />);
            
            const label = screen.getByText('Email');
            const input = screen.getByPlaceholderText('Enter email');
            
            expect(label).toHaveAttribute('for', input.id);
        });

        it('connects description to input with aria-describedby', () => {
            render(<TestFormComponent />);
            
            const input = screen.getByPlaceholderText('Enter email');
            const description = screen.getByText("We'll never share your email.");
            
            expect(input.getAttribute('aria-describedby')).toContain(description.id);
        });
    });
});