# Slash Command System

A comprehensive, extensible slash command system for React applications with support for both regular input fields and rich text editors (TipTap).

## ✨ Features

- **Smart Detection**: Automatically detects "/" at word boundaries with fuzzy search
- **Keyboard Navigation**: Full keyboard control with arrow keys, Enter, Tab, and Escape
- **Extensible Architecture**: Plugin-like system for custom commands and categories
- **TipTap Integration**: Native support for rich text editors with command execution
- **Customizable UI**: Themed autocomplete dropdown with icons and descriptions
- **Performance Optimized**: Debounced search, memoized results, and efficient rendering
- **TypeScript Support**: Fully typed with comprehensive interfaces
- **Testing Ready**: Comprehensive test suite with Jest and React Testing Library

## 🚀 Quick Start

### 1. Wrap your app with SlashCommandProvider

```tsx
import { SlashCommandProvider } from '@/components/ui/slash-commands';

function App() {
  return (
    <SlashCommandProvider>
      <YourApp />
    </SlashCommandProvider>
  );
}
```

### 2. Use SlashCommandInput for basic inputs

```tsx
import { SlashCommandInput, useDefaultSlashCommands } from '@/components/ui/slash-commands';

function MyComponent() {
  useDefaultSlashCommands(); // Register default commands
  const [value, setValue] = useState('');
  
  return (
    <SlashCommandInput
      value={value}
      onChange={setValue}
      placeholder="Type / for commands..."
      onCommandExecuted={(commandId) => {
        console.log('Command executed:', commandId);
      }}
    />
  );
}
```

### 3. For TipTap integration

```tsx
import { TextBlockWithSlashCommands } from '@/components/custom/BlockCanvas/components/TextBlockWithSlashCommands';

function RichTextEditor() {
  return (
    <TextBlockWithSlashCommands
      block={blockData}
      onUpdate={handleUpdate}
      onDelete={handleDelete}
      onSelect={handleSelect}
    />
  );
}
```

## 📚 API Reference

### SlashCommand Interface

```typescript
interface SlashCommand {
  id: string;                    // Unique identifier
  name: string;                  // Display name
  description: string;           // Description shown in autocomplete
  icon?: LucideIcon;            // Optional icon component
  category?: string;            // Category for grouping
  keywords?: string[];          // Additional search keywords
  execute: (context: SlashCommandContext) => void | Promise<void>;
  parameters?: SlashCommandParameter[];  // Command parameters
  isAvailable?: (context: Partial<SlashCommandContext>) => boolean;
}
```

### SlashCommandContext

```typescript
interface SlashCommandContext {
  editor?: Editor;              // TipTap editor instance
  input?: HTMLInputElement | HTMLTextAreaElement;  // Input element
  cursorPosition: number;       // Current cursor position
  selectedText?: string;        // Selected text
  insertText: (text: string) => void;           // Insert text function
  replaceText: (start: number, end: number, text: string) => void;
  query: string;               // Query that triggered the command
}
```

## 🎯 Default Commands

The system comes with a comprehensive set of default commands:

### Text Formatting
- `/h1`, `/h2`, `/h3` - Headings
- `/bold` - Bold text
- `/italic` - Italic text
- `/underline` - Underlined text
- `/code` - Inline code

### Structure
- `/bullet-list` - Bullet list
- `/numbered-list` - Numbered list
- `/quote` - Blockquote
- `/divider` - Horizontal rule

### Content
- `/link` - Insert link
- `/image` - Insert image
- `/table` - Insert table

### Utility
- `/date` - Current date
- `/time` - Current time
- `/clear` - Clear current line

## 🔧 Creating Custom Commands

```typescript
import { SlashCommand } from '@/components/ui/slash-commands/types';
import { Calendar } from 'lucide-react';

const customCommand: SlashCommand = {
  id: 'custom-timestamp',
  name: 'Timestamp',
  description: 'Insert current timestamp',
  icon: Calendar,
  category: 'utility',
  keywords: ['time', 'now', 'stamp'],
  execute: ({ insertText }) => {
    const timestamp = new Date().toISOString();
    insertText(timestamp);
  },
};

// Register the command
function MyComponent() {
  useSlashCommand(customCommand);
  // ... rest of component
}
```

## ⌨️ Keyboard Shortcuts

- **/** - Trigger slash command autocomplete
- **Arrow Up/Down** - Navigate through commands
- **Enter** - Execute selected command
- **Tab** - Execute selected command
- **Escape** - Close autocomplete
- **Backspace** - Close autocomplete if query becomes empty

## 🎨 Customization

### Custom Registry Options

```typescript
const customRegistry = new SlashCommandRegistry({
  maxResults: 15,        // Maximum commands to show
  minQueryLength: 1,     // Minimum query length to trigger search
  searchDebounce: 200,   // Debounce delay in milliseconds
});

<SlashCommandProvider registry={customRegistry}>
  <App />
</SlashCommandProvider>
```

### Custom Styling

The autocomplete dropdown uses CSS classes that can be customized:

```css
.slash-command-active {
  background-color: rgba(59, 130, 246, 0.1);
  border-radius: 3px;
}
```

## 🧪 Testing

The system includes comprehensive tests. Run them with:

```bash
npm test slash-commands.test.tsx
```

## 📁 File Structure

```
src/
├── components/ui/slash-commands/
│   ├── types.ts                      # TypeScript definitions
│   ├── SlashCommandProvider.tsx      # React context provider
│   ├── SlashCommandAutocomplete.tsx  # Autocomplete UI component
│   ├── SlashCommandInput.tsx         # Enhanced input wrapper
│   └── index.ts                      # Public exports
├── lib/slash-commands/
│   ├── registry.ts                   # Command registry
│   ├── default-commands.ts           # Built-in commands
│   └── tiptap-extension.ts           # TipTap integration
├── hooks/
│   ├── useSlashCommands.ts           # Main command hook
│   └── useSlashCommandRegistry.ts    # Registry management hooks
└── __tests__/
    └── slash-commands.test.tsx       # Test suite
```

## 🔄 Integration with Existing Components

The slash command system is designed to integrate seamlessly with existing components:

1. **Input Fields**: Use `SlashCommandInput` as a drop-in replacement
2. **TipTap Editors**: Use the enhanced `TextBlockWithSlashCommands`
3. **Custom Components**: Use the `useSlashCommands` hook directly

## 🚀 Performance Considerations

- **Debounced Search**: Prevents excessive API calls during typing
- **Memoized Results**: Caches search results for better performance
- **Efficient Rendering**: Only re-renders when necessary
- **Lazy Loading**: Commands can be loaded on-demand

## 📝 License

This slash command system is part of the atoms.tech project and follows the same licensing terms.
