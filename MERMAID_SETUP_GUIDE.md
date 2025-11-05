# Mermaid Diagram Support Setup Guide

**Purpose:** Add Mermaid diagram rendering to artifact display  
**Time Required:** 15-30 minutes  
**Difficulty:** Easy

---

## 📋 What is Mermaid?

Mermaid is a JavaScript library that generates diagrams from text definitions. It supports:
- Flowcharts
- Sequence diagrams
- Class diagrams
- State diagrams
- Entity relationship diagrams
- Gantt charts
- And more!

---

## 🚀 Installation

### Step 1: Install Mermaid

```bash
cd /path/to/atoms.tech
npm install mermaid
```

Or with yarn:
```bash
yarn add mermaid
```

Or with pnpm:
```bash
pnpm add mermaid
```

### Step 2: Verify Installation

Check that mermaid is in your package.json:
```bash
grep mermaid package.json
```

You should see:
```json
"mermaid": "^10.x.x"
```

---

## ✅ Components Already Created

The following components are already created and ready to use:

1. **`MermaidPreview.tsx`** - Main Mermaid rendering component
2. **`MermaidFallback.tsx`** - Fallback when mermaid is not installed
3. **`ArtifactRenderer.tsx`** - Updated to use MermaidPreview

---

## 🧪 Testing Mermaid Rendering

### Test 1: Simple Flowchart

Send this message to the agent:

```
Create a flowchart showing a login process.

<artifact type="mermaid" title="Login Flow">
graph TD
    A[Start] --> B{User Logged In?}
    B -->|Yes| C[Show Dashboard]
    B -->|No| D[Show Login Page]
    D --> E[Enter Credentials]
    E --> F{Valid?}
    F -->|Yes| C
    F -->|No| D
    C --> G[End]
</artifact>
```

### Test 2: Sequence Diagram

```
<artifact type="mermaid" title="API Request Flow">
sequenceDiagram
    participant Client
    participant API
    participant Database
    
    Client->>API: POST /api/data
    API->>Database: Query data
    Database-->>API: Return results
    API-->>Client: JSON response
</artifact>
```

### Test 3: Class Diagram

```
<artifact type="mermaid" title="User System Classes">
classDiagram
    class User {
        +String name
        +String email
        +login()
        +logout()
    }
    class Admin {
        +String role
        +manageUsers()
    }
    User <|-- Admin
</artifact>
```

### Test 4: State Diagram

```
<artifact type="mermaid" title="Order States">
stateDiagram-v2
    [*] --> Pending
    Pending --> Processing
    Processing --> Shipped
    Processing --> Cancelled
    Shipped --> Delivered
    Delivered --> [*]
    Cancelled --> [*]
</artifact>
```

### Test 5: Gantt Chart

```
<artifact type="mermaid" title="Project Timeline">
gantt
    title Project Development
    dateFormat  YYYY-MM-DD
    section Planning
    Requirements    :a1, 2024-01-01, 7d
    Design         :a2, after a1, 5d
    section Development
    Backend        :a3, after a2, 14d
    Frontend       :a4, after a2, 14d
    section Testing
    QA Testing     :a5, after a3, 7d
</artifact>
```

---

## 🎨 Customization

### Theme Configuration

The MermaidPreview component uses the default theme. To customize:

**File:** `src/components/custom/AgentChat/MermaidPreview.tsx`

```typescript
mermaid.initialize({
    startOnLoad: false,
    theme: 'default', // Options: 'default', 'dark', 'forest', 'neutral'
    securityLevel: 'loose',
    fontFamily: 'inherit',
    // Add more config options
    flowchart: {
        curve: 'basis',
        padding: 20,
    },
});
```

### Dark Mode Support

To support dark mode, update the initialization:

```typescript
const isDark = document.documentElement.classList.contains('dark');

mermaid.initialize({
    startOnLoad: false,
    theme: isDark ? 'dark' : 'default',
    securityLevel: 'loose',
    fontFamily: 'inherit',
});
```

---

## 🐛 Troubleshooting

### Mermaid not rendering

**Problem:** Diagrams show "Rendering diagram..." forever

**Solutions:**
1. Check browser console for errors
2. Verify mermaid is installed: `npm list mermaid`
3. Clear Next.js cache: `rm -rf .next`
4. Restart dev server

### Syntax errors in diagrams

**Problem:** "Failed to render diagram" error

**Solutions:**
1. Check diagram syntax at https://mermaid.live
2. Ensure proper indentation
3. Check for typos in keywords
4. Verify diagram type is supported

### Styling issues

**Problem:** Diagrams don't match site theme

**Solutions:**
1. Update mermaid theme in initialization
2. Add custom CSS for `.mermaid-container`
3. Use CSS variables for colors

---

## 📚 Mermaid Resources

- **Official Docs:** https://mermaid.js.org/
- **Live Editor:** https://mermaid.live
- **Syntax Guide:** https://mermaid.js.org/intro/syntax-reference.html
- **Examples:** https://mermaid.js.org/ecosystem/integrations.html

---

## 🎯 Features

### Supported Diagram Types

- ✅ Flowcharts (`graph`, `flowchart`)
- ✅ Sequence diagrams (`sequenceDiagram`)
- ✅ Class diagrams (`classDiagram`)
- ✅ State diagrams (`stateDiagram`)
- ✅ Entity relationship (`erDiagram`)
- ✅ Gantt charts (`gantt`)
- ✅ Pie charts (`pie`)
- ✅ Git graphs (`gitGraph`)
- ✅ User journey (`journey`)
- ✅ Requirement diagrams (`requirementDiagram`)

### Component Features

- ✅ Dynamic loading (code splitting)
- ✅ Error handling with fallback
- ✅ Loading states
- ✅ Unique diagram IDs
- ✅ Responsive rendering
- ✅ Dark mode ready

---

## 📊 Performance

Mermaid is loaded dynamically (lazy loaded) to avoid increasing initial bundle size:

```typescript
const mermaid = (await import('mermaid')).default;
```

This means:
- ✅ Faster initial page load
- ✅ Only loads when needed
- ✅ Smaller bundle size
- ✅ Better performance

---

## ✅ Checklist

After installation, verify:

- [ ] Mermaid installed in package.json
- [ ] MermaidPreview component exists
- [ ] ArtifactRenderer imports MermaidPreview
- [ ] Test flowchart renders correctly
- [ ] Test sequence diagram renders correctly
- [ ] Error handling works (invalid syntax)
- [ ] Loading state shows briefly
- [ ] Diagrams are responsive
- [ ] Dark mode works (if applicable)

---

**Status:** ✅ Ready to use after `npm install mermaid`

**Next:** Test with various diagram types and customize theme if needed

