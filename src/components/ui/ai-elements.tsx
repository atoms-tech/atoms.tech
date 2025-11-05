'use client';

import * as React from 'react';
import { Loader2, Pencil, ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { TypingIndicator } from '@/components/ui/typing-indicator';

// Streaming cursor animation
const blinkKeyframes = `
@keyframes blink {
    0%, 50% {
        opacity: 1;
    }
    51%, 100% {
        opacity: 0;
    }
}
`;

if (typeof document !== 'undefined') {
    const styleId = 'streaming-cursor-animation';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = blinkKeyframes;
        document.head.appendChild(style);
    }
}

interface ConversationRootProps extends React.HTMLAttributes<HTMLDivElement> {
    // Additional props can be added here if needed
}

export const Conversation = React.forwardRef<HTMLDivElement, ConversationRootProps>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn('flex h-full flex-col rounded-xl border bg-background shadow-sm', className)}
            {...props}
        />
    ),
);
Conversation.displayName = 'ConversationRoot';

interface ConversationHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    // Additional props can be added here if needed
}
export const ConversationHeader = ({ className, ...props }: ConversationHeaderProps) => (
    <div className={cn('border-b px-4 py-3', className)} {...props} />
);

interface ConversationBodyProps extends React.HTMLAttributes<HTMLDivElement> {
    // Additional props can be added here if needed
}
export const ConversationBody = ({ className, ...props }: ConversationBodyProps) => (
    <div className={cn('flex-1 px-3 py-4', className)} {...props} />
);

interface ConversationMessagesProps extends React.HTMLAttributes<HTMLDivElement> {
    scrollable?: boolean;
}

export const ConversationMessages = React.forwardRef<HTMLDivElement, ConversationMessagesProps>(
    ({ children, className, scrollable = true, ...props }, ref) => {
        // Filter out conflicting props for ScrollArea
        const { dir, ...scrollAreaProps } = props;
        
        if (scrollable) {
            return (
                <ScrollArea ref={ref} className={cn('h-full pr-2', className)} dir={dir} {...scrollAreaProps}>
                    <div className="space-y-4">{children}</div>
                </ScrollArea>
            );
        }

        return (
            <div ref={ref} className={cn('space-y-4', className)} {...props}>
                {children}
            </div>
        );
    },
);
ConversationMessages.displayName = 'ConversationMessages';

interface ConversationFooterProps extends React.HTMLAttributes<HTMLDivElement> {
    // Additional props can be added here if needed
}
export const ConversationFooter = ({ className, ...props }: ConversationFooterProps) => (
    <div className={cn('border-t px-4 py-3', className)} {...props} />
);

export interface ConversationMessageProps extends React.HTMLAttributes<HTMLDivElement> {
    role: 'user' | 'assistant' | 'system' | 'tool';
    isStreaming?: boolean;
    timestamp?: Date;
    editable?: boolean;
    onEdit?: () => void;
    isEditing?: boolean;
    branchCount?: number;
    activeBranchIndex?: number;
    onSwitchBranch?: (direction: 'prev' | 'next') => void;
}

export const ConversationMessage: React.FC<ConversationMessageProps> = ({
    children,
    role,
    isStreaming,
    timestamp,
    editable,
    onEdit,
    isEditing = false,
    branchCount = 1,
    activeBranchIndex = 0,
    onSwitchBranch,
    className,
    ...props
}) => {
    const isUser = role === 'user';
    const [isHovered, setIsHovered] = React.useState(false);

    // Check if content is empty (for typing indicator)
    const hasContent = React.useMemo(() => {
        if (typeof children === 'string') {
            return children.trim().length > 0;
        }
        if (React.isValidElement(children)) {
            // Check if the element has text content
            const textContent = React.Children.toArray(children)
                .map(child => {
                    if (typeof child === 'string') return child;
                    if (React.isValidElement(child)) {
                        // Try to extract text from props
                        return (child.props as any)?.children || '';
                    }
                    return '';
                })
                .join('');
            return textContent.trim().length > 0;
        }
        return false;
    }, [children]);

    const bubbleClasses = cn(
        'w-fit max-w-full sm:max-w-[42rem] rounded-none px-4 py-3 text-sm shadow-sm text-left',
        // Add smooth transition for expanding content
        'transition-all duration-200 ease-out',
        isUser ? 'ml-auto bg-primary text-primary-foreground' : 'bg-muted text-foreground',
        className,
    );

    return (
        <div 
            className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')} 
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            {...props}
        >
            <div className="flex flex-col gap-1 relative">
                {/* Edit button - top right, only on hover for user messages */}
                {isUser && editable && onEdit && !isEditing && (isHovered || isEditing) && (
                    <div className="absolute -top-1 -right-1 z-10">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 bg-background/90 hover:bg-background shadow-sm border border-border"
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit();
                            }}
                        >
                            <Pencil className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                )}
                
                {/* Branch navigation - shown when editing */}
                {isEditing && branchCount > 1 && onSwitchBranch && (
                    <div className="absolute -top-1 -right-1 z-10 flex flex-col items-center gap-0.5 bg-background/90 shadow-sm border border-border rounded px-1 py-0.5">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            onClick={(e) => {
                                e.stopPropagation();
                                onSwitchBranch('prev');
                            }}
                        >
                            <ChevronLeft className="h-3 w-3" />
                        </Button>
                        <span className="text-[9px] leading-none py-0.5 text-center min-w-[1.5rem]">
                            {activeBranchIndex + 1}
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            onClick={(e) => {
                                e.stopPropagation();
                                onSwitchBranch('next');
                            }}
                        >
                            <ChevronRight className="h-3 w-3" />
                        </Button>
                    </div>
                )}
                
                <div className={bubbleClasses}>
                    {/* Show typing indicator if streaming with no content, otherwise show content */}
                    {isStreaming && !isUser && !hasContent ? (
                        <TypingIndicator size="sm" className="text-muted-foreground" />
                    ) : (
                        <>
                            {children}
                            {isStreaming && !isUser && hasContent && (
                                <span
                                    className="inline-block w-[3px] h-4 ml-1.5 align-middle"
                                    aria-label="Streaming"
                                    role="status"
                                    style={{
                                        animation: 'blink 1s ease-in-out infinite',
                                        backgroundColor: 'hsl(var(--foreground))',
                                        opacity: 1,
                                        marginLeft: '4px',
                                    }}
                                />
                            )}
                        </>
                    )}
                </div>
                {isStreaming && !isUser && (
                    <div className="flex items-center gap-2 px-1 text-[11px] text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>{hasContent ? 'Generating response...' : 'Thinking...'}</span>
                    </div>
                )}
                <div className="flex items-center justify-between px-1 text-[11px] text-muted-foreground">
                    <span>
                        {timestamp
                            ? timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : ''}
                    </span>
                </div>
            </div>
        </div>
    );
};

export interface PromptInputProps {
    value: string;
    placeholder?: string;
    disabled?: boolean;
    submitLabel?: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
    onKeyDown?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
    textareaRef?: React.Ref<HTMLTextAreaElement>;
    maxHeightPercentage?: number; // Percentage of chat height (default 35%)
    attachButton?: React.ReactNode; // Optional attach files button to include in the row
}

export const PromptInput: React.FC<PromptInputProps> = ({
    value,
    placeholder,
    disabled,
    submitLabel = 'Send',
    onChange,
    onSubmit,
    onKeyDown,
    textareaRef,
    maxHeightPercentage = 35,
    attachButton,
}) => {
    const textareaInternalRef = React.useRef<HTMLTextAreaElement>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [maxHeight, setMaxHeight] = React.useState<number>(200); // Default max height

    // Combine refs
    const combinedRef = React.useCallback(
        (node: HTMLTextAreaElement | null) => {
            if (textareaRef) {
                if (typeof textareaRef === 'function') {
                    textareaRef(node);
                } else {
                    (textareaRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
                }
            }
            textareaInternalRef.current = node;
        },
        [textareaRef],
    );

    // Calculate max height based on container height
    React.useEffect(() => {
        const updateMaxHeight = () => {
            if (containerRef.current) {
                // Find the Conversation container by walking up the DOM
                let chatContainer = containerRef.current.parentElement;
                let attempts = 0;
                while (chatContainer && attempts < 5) {
                    // The Conversation component has flex flex-col classes
                    if (chatContainer.classList.contains('flex') && chatContainer.classList.contains('flex-col')) {
                        break;
                    }
                    chatContainer = chatContainer.parentElement;
                    attempts++;
                }
                
                // Fallback: use viewport height if container not found
                const containerHeight = chatContainer?.clientHeight || window.innerHeight;
                const calculatedMaxHeight = (containerHeight * maxHeightPercentage) / 100;
                setMaxHeight(Math.max(150, Math.min(calculatedMaxHeight, 400))); // Min 150px, max 400px
            }
        };

        // Initial calculation with a small delay to ensure DOM is ready
        const timeoutId = setTimeout(updateMaxHeight, 100);
        
        // Use ResizeObserver for more accurate updates
        let resizeObserver: ResizeObserver | null = null;
        if (containerRef.current?.parentElement) {
            resizeObserver = new ResizeObserver(updateMaxHeight);
            resizeObserver.observe(containerRef.current.parentElement);
        }
        
        window.addEventListener('resize', updateMaxHeight);
        return () => {
            clearTimeout(timeoutId);
            resizeObserver?.disconnect();
            window.removeEventListener('resize', updateMaxHeight);
        };
    }, [maxHeightPercentage]);

    // Auto-resize textarea
    React.useEffect(() => {
        const textarea = textareaInternalRef.current;
        if (textarea) {
            // Reset height to auto to get the correct scrollHeight
            textarea.style.height = 'auto';
            const scrollHeight = textarea.scrollHeight;
            const minHeight = 44; // Minimum height for single line
            const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
            textarea.style.height = `${newHeight}px`;
        }
    }, [value, maxHeight]);

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (onKeyDown) {
            onKeyDown(event);
        }
        // Allow Enter+Shift for new line, Enter alone submits
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            onSubmit();
        }
    };

    return (
        <div ref={containerRef} className="flex items-end gap-2">
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    onSubmit();
                }}
                className="flex-1 flex items-end gap-2"
            >
                {attachButton && (
                    <div className="shrink-0">
                        {attachButton}
                    </div>
                )}
                <Textarea
                    ref={combinedRef}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className={cn(
                        'resize-none overflow-y-auto transition-all duration-200 ease-out',
                        'min-h-[44px] max-h-[400px]',
                        'px-3 py-2.5',
                    )}
                    style={{
                        maxHeight: `${maxHeight}px`,
                    }}
                    disabled={disabled}
                    rows={1}
                />
                <Button
                    type="submit"
                    size="sm"
                    disabled={disabled || value.trim().length === 0}
                    className="h-[44px] px-4 shrink-0"
                >
                    {disabled ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        submitLabel
                    )}
                </Button>
            </form>
        </div>
    );
};
