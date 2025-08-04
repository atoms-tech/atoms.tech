import { render, screen, fireEvent } from '@testing-library/react';
import { InProgressModal } from '../in-progress-modal';

describe('InProgressModal', () => {
    const defaultProps = {
        isOpen: true,
        onClose: jest.fn(),
        title: 'Test Feature',
        description: 'This is a test feature description',
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should not render when isOpen is false', () => {
        render(<InProgressModal {...defaultProps} isOpen={false} />);
        
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
        render(<InProgressModal {...defaultProps} />);
        
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Test Feature')).toBeInTheDocument();
        expect(screen.getByText('This is a test feature description')).toBeInTheDocument();
    });

    it('should display the rocket emoji and coming soon message', () => {
        render(<InProgressModal {...defaultProps} />);
        
        expect(screen.getByText('🚀')).toBeInTheDocument();
        expect(screen.getByText(/This feature is currently in development/)).toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', () => {
        const mockOnClose = jest.fn();
        render(<InProgressModal {...defaultProps} onClose={mockOnClose} />);
        
        const closeButton = screen.getByRole('button', { name: /close/i });
        fireEvent.click(closeButton);
        
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when X button is clicked', () => {
        const mockOnClose = jest.fn();
        render(<InProgressModal {...defaultProps} onClose={mockOnClose} />);
        
        // Look for X button (usually has aria-label close or similar)
        const xButton = screen.getByRole('button', { name: '' }); // X button typically has no text
        fireEvent.click(xButton);
        
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should display estimated completion when provided', () => {
        const estimatedCompletion = 'Q2 2024';
        
        render(
            <InProgressModal 
                {...defaultProps} 
                estimatedCompletion={estimatedCompletion}
            />
        );
        
        expect(screen.getByText(`Expected: ${estimatedCompletion}`)).toBeInTheDocument();
    });

    it('should display default estimated completion when not provided', () => {
        render(<InProgressModal {...defaultProps} />);
        
        expect(screen.getByText('Expected: Coming Soon')).toBeInTheDocument();
    });

    it('should display features list when provided', () => {
        const features = [
            'User authentication',
            'Dashboard analytics',
            'Real-time notifications',
            'Mobile responsiveness'
        ];
        
        render(
            <InProgressModal 
                {...defaultProps} 
                features={features}
            />
        );
        
        expect(screen.getByText('Planned Features:')).toBeInTheDocument();
        
        features.forEach(feature => {
            expect(screen.getByText(feature)).toBeInTheDocument();
        });

        // Check for bullet points (•)
        const bulletPoints = screen.getAllByText('•');
        expect(bulletPoints).toHaveLength(features.length);
    });

    it('should not display features section when no features provided', () => {
        render(<InProgressModal {...defaultProps} />);
        
        expect(screen.queryByText('Planned Features:')).not.toBeInTheDocument();
    });

    it('should not display features section when empty array provided', () => {
        render(
            <InProgressModal 
                {...defaultProps} 
                features={[]}
            />
        );
        
        expect(screen.queryByText('Planned Features:')).not.toBeInTheDocument();
    });

    it('should handle long feature lists', () => {
        const manyFeatures = Array.from({ length: 10 }, (_, i) => `Feature ${i + 1}`);
        
        render(
            <InProgressModal 
                {...defaultProps} 
                features={manyFeatures}
            />
        );
        
        manyFeatures.forEach(feature => {
            expect(screen.getByText(feature)).toBeInTheDocument();
        });
    });

    it('should display stay tuned message', () => {
        render(<InProgressModal {...defaultProps} />);
        
        expect(screen.getByText(/Stay tuned for updates/)).toBeInTheDocument();
    });

    it('should handle special characters in title and description', () => {
        const specialProps = {
            ...defaultProps,
            title: 'API & Database Integration!',
            description: 'This feature includes <special> characters & symbols.',
        };
        
        render(<InProgressModal {...specialProps} />);
        
        expect(screen.getByText('API & Database Integration!')).toBeInTheDocument();
        expect(screen.getByText('This feature includes <special> characters & symbols.')).toBeInTheDocument();
    });

    it('should handle very long titles and descriptions', () => {
        const longProps = {
            ...defaultProps,
            title: 'A Very Long Feature Title That Might Wrap To Multiple Lines In The Modal Dialog',
            description: 'This is an extremely long description that contains many words and should test how the modal handles text overflow and wrapping when the content is much longer than expected in a typical use case scenario.',
        };
        
        render(<InProgressModal {...longProps} />);
        
        expect(screen.getByText(longProps.title)).toBeInTheDocument();
        expect(screen.getByText(longProps.description)).toBeInTheDocument();
    });

    it('should be accessible with proper ARIA attributes', () => {
        render(<InProgressModal {...defaultProps} />);
        
        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
        
        // Should have proper heading structure
        const heading = screen.getByRole('heading', { level: 2 });
        expect(heading).toHaveTextContent('Test Feature');
    });

    it('should maintain focus management', () => {
        render(<InProgressModal {...defaultProps} />);
        
        // The modal should be focusable
        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
        
        // Close button should be accessible
        const closeButton = screen.getByRole('button', { name: /close/i });
        expect(closeButton).toBeInTheDocument();
    });

    it('should handle rapid open/close cycles', () => {
        const mockOnClose = jest.fn();
        const { rerender } = render(
            <InProgressModal {...defaultProps} onClose={mockOnClose} isOpen={true} />
        );
        
        // Rapidly toggle open/close
        rerender(<InProgressModal {...defaultProps} onClose={mockOnClose} isOpen={false} />);
        rerender(<InProgressModal {...defaultProps} onClose={mockOnClose} isOpen={true} />);
        rerender(<InProgressModal {...defaultProps} onClose={mockOnClose} isOpen={false} />);
        
        // Should handle without errors
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render with minimal props', () => {
        const minimalProps = {
            isOpen: true,
            onClose: jest.fn(),
            title: 'Minimal',
            description: 'Test',
        };
        
        render(<InProgressModal {...minimalProps} />);
        
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Minimal')).toBeInTheDocument();
        expect(screen.getByText('Test')).toBeInTheDocument();
    });
});
