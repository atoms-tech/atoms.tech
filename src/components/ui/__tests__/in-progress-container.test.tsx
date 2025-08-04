import { render, screen, fireEvent } from '@testing-library/react';
import { InProgressContainer } from '../in-progress-container';

// Mock the InProgressModal component
jest.mock('../in-progress-modal', () => ({
    InProgressModal: ({ isOpen, onClose, title, description, features, estimatedCompletion }: {
        isOpen: boolean;
        onClose: () => void;
        title: string;
        description: string;
        features?: string[];
        estimatedCompletion?: string;
    }) => (
        isOpen ? (
            <div data-testid="in-progress-modal">
                <h2>{title}</h2>
                <p>{description}</p>
                <p>{estimatedCompletion}</p>
                {features && (
                    <ul>
                        {features.map((feature, index) => (
                            <li key={index}>{feature}</li>
                        ))}
                    </ul>
                )}
                <button onClick={onClose}>Close</button>
            </div>
        ) : null
    ),
}));

describe('InProgressContainer', () => {
    const defaultProps = {
        title: 'Test Feature',
        description: 'This is a test feature',
        children: <div>Test content</div>,
    };

    it('should render children and basic props', () => {
        render(<InProgressContainer {...defaultProps} />);
        
        expect(screen.getByText('Test content')).toBeInTheDocument();
        expect(screen.getByTestId('in-progress-test-feature')).toBeInTheDocument();
        expect(screen.getByTestId('trigger-test-feature')).toBeInTheDocument();
    });

    it('should generate correct test IDs from title', () => {
        const propsWithSpaces = {
            ...defaultProps,
            title: 'Multi Word Feature Name',
        };
        
        render(<InProgressContainer {...propsWithSpaces} />);
        
        expect(screen.getByTestId('in-progress-multi-word-feature-name')).toBeInTheDocument();
        expect(screen.getByTestId('trigger-multi-word-feature-name')).toBeInTheDocument();
    });

    it('should not have role=button when requiresModal is false', () => {
        render(<InProgressContainer {...defaultProps} requiresModal={false} />);
        
        const trigger = screen.getByTestId('trigger-test-feature');
        expect(trigger).not.toHaveAttribute('role', 'button');
        expect(trigger).not.toHaveClass('cursor-pointer');
    });

    it('should have role=button when requiresModal is true', () => {
        render(<InProgressContainer {...defaultProps} requiresModal={true} />);
        
        const trigger = screen.getByTestId('trigger-test-feature');
        expect(trigger).toHaveAttribute('role', 'button');
        expect(trigger).toHaveClass('cursor-pointer');
    });

    it('should not show modal initially', () => {
        render(<InProgressContainer {...defaultProps} requiresModal={true} />);
        
        expect(screen.queryByTestId('in-progress-modal')).not.toBeInTheDocument();
    });

    it('should show modal when clicked and requiresModal is true', () => {
        render(<InProgressContainer {...defaultProps} requiresModal={true} />);
        
        const trigger = screen.getByTestId('trigger-test-feature');
        fireEvent.click(trigger);
        
        expect(screen.getByTestId('in-progress-modal')).toBeInTheDocument();
        expect(screen.getByText('Test Feature')).toBeInTheDocument();
        expect(screen.getByText('This is a test feature')).toBeInTheDocument();
    });

    it('should not show modal when clicked and requiresModal is false', () => {
        render(<InProgressContainer {...defaultProps} requiresModal={false} />);
        
        const trigger = screen.getByTestId('trigger-test-feature');
        fireEvent.click(trigger);
        
        expect(screen.queryByTestId('in-progress-modal')).not.toBeInTheDocument();
    });

    it('should call onModalOpen when modal is opened', () => {
        const mockOnModalOpen = jest.fn();
        
        render(
            <InProgressContainer 
                {...defaultProps} 
                requiresModal={true} 
                onModalOpen={mockOnModalOpen}
            />
        );
        
        const trigger = screen.getByTestId('trigger-test-feature');
        fireEvent.click(trigger);
        
        expect(mockOnModalOpen).toHaveBeenCalledTimes(1);
    });

    it('should close modal when close button is clicked', () => {
        render(<InProgressContainer {...defaultProps} requiresModal={true} />);
        
        // Open modal
        const trigger = screen.getByTestId('trigger-test-feature');
        fireEvent.click(trigger);
        
        expect(screen.getByTestId('in-progress-modal')).toBeInTheDocument();
        
        // Close modal
        const closeButton = screen.getByText('Close');
        fireEvent.click(closeButton);
        
        expect(screen.queryByTestId('in-progress-modal')).not.toBeInTheDocument();
    });

    it('should pass estimatedCompletion to modal', () => {
        const estimatedCompletion = 'Q3 2024';
        
        render(
            <InProgressContainer 
                {...defaultProps} 
                requiresModal={true}
                estimatedCompletion={estimatedCompletion}
            />
        );
        
        const trigger = screen.getByTestId('trigger-test-feature');
        fireEvent.click(trigger);
        
        expect(screen.getByText(estimatedCompletion)).toBeInTheDocument();
    });

    it('should pass features to modal', () => {
        const features = ['Feature 1', 'Feature 2', 'Feature 3'];
        
        render(
            <InProgressContainer 
                {...defaultProps} 
                requiresModal={true}
                features={features}
            />
        );
        
        const trigger = screen.getByTestId('trigger-test-feature');
        fireEvent.click(trigger);
        
        features.forEach(feature => {
            expect(screen.getByText(feature)).toBeInTheDocument();
        });
    });

    it('should use default estimatedCompletion when not provided', () => {
        render(<InProgressContainer {...defaultProps} requiresModal={true} />);
        
        const trigger = screen.getByTestId('trigger-test-feature');
        fireEvent.click(trigger);
        
        expect(screen.getByText('Coming Soon')).toBeInTheDocument();
    });

    it('should handle empty features array', () => {
        render(
            <InProgressContainer 
                {...defaultProps} 
                requiresModal={true}
                features={[]}
            />
        );
        
        const trigger = screen.getByTestId('trigger-test-feature');
        fireEvent.click(trigger);
        
        // Modal should still render without errors
        expect(screen.getByTestId('in-progress-modal')).toBeInTheDocument();
    });

    it('should handle complex title with special characters', () => {
        const complexTitle = 'API & Database Integration!';
        
        render(
            <InProgressContainer 
                {...defaultProps}
                title={complexTitle}
            />
        );
        
        // Should create valid test IDs by replacing special characters
        expect(screen.getByTestId('in-progress-api-&-database-integration!')).toBeInTheDocument();
        expect(screen.getByTestId('trigger-api-&-database-integration!')).toBeInTheDocument();
    });

    it('should maintain modal state independently for multiple instances', () => {
        render(
            <div>
                <InProgressContainer 
                    title="Feature 1"
                    description="Description 1"
                    requiresModal={true}
                >
                    <div>Content 1</div>
                </InProgressContainer>
                <InProgressContainer 
                    title="Feature 2"
                    description="Description 2"
                    requiresModal={true}
                >
                    <div>Content 2</div>
                </InProgressContainer>
            </div>
        );
        
        // Open first modal
        const trigger1 = screen.getByTestId('trigger-feature-1');
        fireEvent.click(trigger1);
        
        expect(screen.getByText('Feature 1')).toBeInTheDocument();
        expect(screen.queryByText('Feature 2')).not.toBeInTheDocument();
        
        // Close first modal
        fireEvent.click(screen.getByText('Close'));
        
        // Open second modal
        const trigger2 = screen.getByTestId('trigger-feature-2');
        fireEvent.click(trigger2);
        
        expect(screen.getByText('Feature 2')).toBeInTheDocument();
        expect(screen.queryByText('Feature 1')).not.toBeInTheDocument();
    });
});
