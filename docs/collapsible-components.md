# Collapsible Components Documentation

## Overview

The collapsible components system provides a comprehensive set of reusable components for creating expandable/collapsible UI sections with persistent state, smooth animations, and full accessibility support.

## Features

- ✅ **Persistent State**: Automatically saves expand/collapse state across sessions
- ✅ **Smooth Animations**: Powered by Framer Motion with multiple animation types
- ✅ **Accessibility**: Full WCAG compliance with ARIA attributes and keyboard navigation
- ✅ **Nested Support**: Unlimited nesting levels with automatic indentation
- ✅ **TypeScript**: Complete type safety and IntelliSense support
- ✅ **Customizable**: Extensive customization options for styling and behavior
- ✅ **Performance**: Optimized for 60fps animations with reduced motion support

## Components

### CollapsibleSection

The main collapsible component with full feature set.

```tsx
import { CollapsibleSection } from '@/components/ui/collapsible-section';

<CollapsibleSection
    id="my-section"
    title="Click to expand"
    defaultOpen={false}
    persistKey="my-section-state"
>
    <p>This content will be collapsible!</p>
</CollapsibleSection>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `id` | `string` | Required | Unique identifier for the section |
| `title` | `ReactNode` | - | Header content (can be JSX) |
| `children` | `ReactNode` | Required | Content to show/hide |
| `defaultOpen` | `boolean` | `false` | Initial open state |
| `persistKey` | `string` | - | Key for localStorage persistence |
| `sessionOnly` | `boolean` | `false` | Use sessionStorage instead |
| `disabled` | `boolean` | `false` | Disable interaction |
| `animationType` | `'content' \| 'fade' \| 'scale' \| 'slide'` | `'content'` | Animation style |
| `animationSpeed` | `'fast' \| 'normal' \| 'slow'` | `'normal'` | Animation duration |
| `showChevron` | `boolean` | `true` | Show expand/collapse icon |
| `chevronPosition` | `'left' \| 'right'` | `'right'` | Icon position |
| `onToggle` | `(isOpen: boolean) => void` | - | Toggle callback |
| `renderHeader` | `(props) => ReactNode` | - | Custom header renderer |

### CollapsibleToggle

Standalone toggle component for custom implementations.

```tsx
import { CollapsibleToggle } from '@/components/ui/collapsible-toggle';

<CollapsibleToggle
    iconType="chevron"
    tooltip="Toggle section"
    isActive={isOpen}
    onClick={handleToggle}
/>
```

### Accordion

Multi-section accordion with single or multiple selection modes.

```tsx
import { Accordion } from '@/components/ui/accordion';

<Accordion
    type="single"
    items={[
        {
            id: 'item-1',
            title: 'Section 1',
            content: <div>Content 1</div>,
        },
        {
            id: 'item-2',
            title: 'Section 2',
            content: <div>Content 2</div>,
        },
    ]}
/>
```

## Hooks

### useCollapsibleState

Core hook for managing collapsible state with persistence.

```tsx
import { useCollapsibleState } from '@/hooks/useCollapsibleState';

const { isOpen, toggle, setOpen } = useCollapsibleState({
    id: 'my-section',
    defaultOpen: false,
    persistKey: 'my-section-state',
});
```

### useCollapsibleGroup

Hook for managing multiple collapsible sections as a group.

```tsx
import { useCollapsibleGroup } from '@/hooks/useCollapsibleState';

const {
    states,
    expandAll,
    collapseAll,
    toggleAll,
    allOpen,
    openCount,
} = useCollapsibleGroup([
    { id: 'section-1', defaultOpen: true },
    { id: 'section-2', defaultOpen: false },
]);
```

## Animation Types

### Content (Default)
Height-based animation that smoothly expands/collapses content.

### Fade
Simple opacity transition for subtle effects.

### Scale
Scales content in/out with opacity for dramatic effect.

### Slide
Horizontal width-based animation.

### Staggered
Animates child elements with staggered timing.

## Accessibility Features

- **ARIA Attributes**: Proper `aria-expanded`, `aria-controls`, and `aria-labelledby`
- **Keyboard Navigation**: Enter and Space key support
- **Focus Management**: Proper focus indicators and tab order
- **Screen Reader Support**: Announces state changes
- **Reduced Motion**: Respects `prefers-reduced-motion` setting

## Persistence

### localStorage (Default)
```tsx
<CollapsibleSection
    id="my-section"
    persistKey="my-section-state"
    title="Persistent Section"
>
    Content here
</CollapsibleSection>
```

### sessionStorage
```tsx
<CollapsibleSection
    id="my-section"
    sessionOnly={true}
    title="Session-only Section"
>
    Content here
</CollapsibleSection>
```

### Custom Storage
```tsx
const { isOpen, toggle } = useCollapsibleState({
    id: 'my-section',
    persistKey: `user-${userId}-section-state`,
});
```

## Nested Sections

```tsx
<CollapsibleSection id="parent" title="Parent Section">
    <p>Parent content</p>
    
    <NestedCollapsibleSection id="child-1" title="Child 1">
        <p>Child 1 content</p>
        
        <NestedCollapsibleSection id="grandchild" title="Grandchild">
            <p>Deeply nested content</p>
        </NestedCollapsibleSection>
    </NestedCollapsibleSection>
    
    <NestedCollapsibleSection id="child-2" title="Child 2">
        <p>Child 2 content</p>
    </NestedCollapsibleSection>
</CollapsibleSection>
```

## Custom Headers

```tsx
<CollapsibleSection
    id="custom"
    renderHeader={({ isOpen, toggle, disabled }) => (
        <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg">
            <div className="flex items-center gap-3">
                <Settings className="h-5 w-5" />
                <span className="font-semibold">Custom Header</span>
            </div>
            <Button onClick={toggle} disabled={disabled}>
                {isOpen ? 'Hide' : 'Show'}
            </Button>
        </div>
    )}
>
    Custom content here
</CollapsibleSection>
```

## Migration from FoldingCard

The existing `FoldingCard` component has been enhanced to use the new system while maintaining backward compatibility:

```tsx
// Legacy mode (old behavior)
<FoldingCard
    title="My Card"
    legacyMode={true}
>
    Content
</FoldingCard>

// Enhanced mode (new features)
<FoldingCard
    title="My Card"
    persistKey="my-card-state"
    animationType="scale"
>
    Content
</FoldingCard>
```

## Performance Considerations

- Components use React.memo to prevent unnecessary re-renders
- Animations are optimized for 60fps performance
- localStorage operations are debounced
- Reduced motion is automatically detected and respected
- Large content is efficiently handled with proper overflow management

## Browser Support

- Modern browsers with ES2018+ support
- Graceful degradation for older browsers
- localStorage/sessionStorage fallbacks included
