import { render, screen } from '@testing-library/react';

import '@testing-library/jest-dom/vitest';

// Simple test to verify Jest setup
describe('Example Test', () => {
    it('should pass basic test', () => {
        expect(true).toBe(true);
    });

    it('should render a simple component', () => {
        const TestComponent = () => <div>Hello Test</div>;
        render(<TestComponent />);
        expect(screen.getByText('Hello Test')).toBeInTheDocument();
    });

    it('should handle basic math', () => {
        expect(2 + 2).toBe(4);
    });

    it('should handle string operations', () => {
        expect('hello'.toUpperCase()).toBe('HELLO');
    });
});
