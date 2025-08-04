import { render, screen, fireEvent } from '@/test-utils';
import { Heart } from 'lucide-react';
import { FoldingCard } from '../folding-card';

describe('FoldingCard Component', () => {
    const defaultProps = {
        title: 'Test Card Title',
        children: <div>Card content</div>,
    };

    it('renders with title', () => {
        render(<FoldingCard {...defaultProps} />);
        
        expect(screen.getByText('Test Card Title')).toBeInTheDocument();
        expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('starts closed by default', () => {
        render(<FoldingCard {...defaultProps} />);
        
        expect(screen.queryByText('Card content')).not.toBeInTheDocument();
        // Should show ChevronDown when closed
        expect(screen.getByTestId('lucide-chevron-down')).toBeInTheDocument();
    });

    it('starts open when defaultOpen is true', () => {
        render(<FoldingCard {...defaultProps} defaultOpen={true} />);
        
        expect(screen.getByText('Card content')).toBeInTheDocument();
        // Should show ChevronUp when open
        expect(screen.getByTestId('lucide-chevron-up')).toBeInTheDocument();
    });

    it('toggles content when clicked', () => {
        render(<FoldingCard {...defaultProps} />);
        
        const button = screen.getByRole('button');
        
        // Initially closed
        expect(screen.queryByText('Card content')).not.toBeInTheDocument();
        
        // Click to open
        fireEvent.click(button);
        expect(screen.getByText('Card content')).toBeInTheDocument();
        expect(screen.getByTestId('lucide-chevron-up')).toBeInTheDocument();
        
        // Click to close
        fireEvent.click(button);
        expect(screen.queryByText('Card content')).not.toBeInTheDocument();
        expect(screen.getByTestId('lucide-chevron-down')).toBeInTheDocument();
    });

    it('renders with icon', () => {
        const icon = <Heart data-testid="heart-icon" />;
        render(<FoldingCard {...defaultProps} icon={icon} />);
        
        expect(screen.getByTestId('heart-icon')).toBeInTheDocument();
        
        const iconContainer = screen.getByTestId('heart-icon').closest('div');
        expect(iconContainer).toHaveClass(
            'rounded-full',
            'bg-primary/10',
            'dark:bg-gray-800',
            'p-3'
        );
    });

    it('applies icon styling correctly', () => {
        const icon = <Heart data-testid="heart-icon" />;
        render(<FoldingCard {...defaultProps} icon={icon} />);
        
        const heartIcon = screen.getByTestId('heart-icon');
        expect(heartIcon).toHaveClass('h-6', 'w-6', 'text-primary');
    });

    it('applies custom className', () => {
        const customClass = 'custom-folding-card';
        render(
            <FoldingCard 
                {...defaultProps} 
                className={customClass}
                data-testid="folding-card"
            />
        );
        
        const card = screen.getByTestId('folding-card');
        expect(card).toHaveClass(customClass);
    });

    it('applies custom contentClassName when open', () => {
        const customContentClass = 'custom-content-class';
        render(
            <FoldingCard 
                {...defaultProps} 
                defaultOpen={true}
                contentClassName={customContentClass}
            />
        );
        
        const content = screen.getByText('Card content').closest('div');
        expect(content).toHaveClass(customContentClass);
    });

    it('handles disabled state', () => {
        render(<FoldingCard {...defaultProps} disabled={true} />);
        
        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
        
        // Should not toggle when disabled
        fireEvent.click(button);
        expect(screen.queryByText('Card content')).not.toBeInTheDocument();
    });

    it('has correct button structure', () => {
        render(<FoldingCard {...defaultProps} />);
        
        const button = screen.getByRole('button');
        expect(button).toHaveClass(
            'flex',
            'items-center',
            'gap-4',
            'w-full',
            'cursor-pointer'
        );
    });

    it('has correct header layout', () => {
        render(<FoldingCard {...defaultProps} />);
        
        const title = screen.getByText('Test Card Title');
        const titleContainer = title.closest('div');
        
        expect(titleContainer).toHaveClass('flex-grow', 'text-left');
        
        const headerRow = title.closest('.flex.justify-between');
        expect(headerRow).toHaveClass('flex', 'justify-between', 'items-center');
    });

    it('adjusts content margin when icon is present', () => {
        const icon = <Heart data-testid="heart-icon" />;
        render(
            <FoldingCard 
                {...defaultProps} 
                icon={icon}
                defaultOpen={true}
            />
        );
        
        const content = screen.getByText('Card content').closest('div');
        expect(content).toHaveClass('mt-4', 'ml-16');
    });

    it('does not add icon margin when no icon', () => {
        render(<FoldingCard {...defaultProps} defaultOpen={true} />);
        
        const content = screen.getByText('Card content').closest('div');
        expect(content).toHaveClass('mt-4');
        expect(content).not.toHaveClass('ml-16');
    });

    it('forwards props to Card component', () => {
        render(
            <FoldingCard 
                {...defaultProps} 
                data-testid="folding-card"
                data-custom="test-value"
            />
        );
        
        const card = screen.getByTestId('folding-card');
        expect(card).toHaveAttribute('data-custom', 'test-value');
    });

    it('renders complex content correctly', () => {
        const complexContent = (
            <div>
                <p>Paragraph 1</p>
                <p>Paragraph 2</p>
                <button>Action Button</button>
            </div>
        );
        
        render(
            <FoldingCard 
                title="Complex Card"
                defaultOpen={true}
            >
                {complexContent}
            </FoldingCard>
        );
        
        expect(screen.getByText('Paragraph 1')).toBeInTheDocument();
        expect(screen.getByText('Paragraph 2')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Action Button' })).toBeInTheDocument();
    });

    it('has proper accessibility structure', () => {
        render(<FoldingCard {...defaultProps} />);
        
        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
        
        const title = screen.getByText('Test Card Title');
        expect(title.tagName).toBe('H3');
        expect(title).toHaveClass('font-semibold', 'mb-1');
    });

    it('maintains state correctly across multiple toggles', () => {
        render(<FoldingCard {...defaultProps} />);
        
        const button = screen.getByRole('button');
        
        // Initial state: closed
        expect(screen.queryByText('Card content')).not.toBeInTheDocument();
        
        // First toggle: open
        fireEvent.click(button);
        expect(screen.getByText('Card content')).toBeInTheDocument();
        
        // Second toggle: closed
        fireEvent.click(button);
        expect(screen.queryByText('Card content')).not.toBeInTheDocument();
        
        // Third toggle: open again
        fireEvent.click(button);
        expect(screen.getByText('Card content')).toBeInTheDocument();
    });
});