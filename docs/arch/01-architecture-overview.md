# Application Architecture Overview

## System Architecture

### Tech Stack

- **Frontend**: Next.js 14+ (App Router)
- **Database**: Supabase (PostgreSQL)
- **State Management**:
    - Zustand for global state
    - React Query for server state
    - React Context for organization scope
- **Type Safety**: TypeScript with Zod validation
- **Authentication**: Supabase Auth

### Core Design Principles

1. **Organization-Centric Architecture**

    - All operations happen within organization context
    - Hierarchical data access patterns
    - Role-based permission system

2. **Performance-First Development**

    - Server Components by default
    - Client Components for interactivity
    - Edge-ready API routes
    - Optimized data fetching

3. **Type Safety and Validation**

    - End-to-end type safety
    - Runtime validation with Zod
    - Database type generation

4. **Real-time Capabilities**
    - Supabase real-time subscriptions
    - Optimistic updates
    - Conflict resolution

## Application Structure

```
├── app/                        # Next.js App Router
│   ├── (auth)/                # Authentication routes
│   ├── (marketing)/           # Public routes
│   └── org/                   # Organization routes
│       └── [orgSlug]/         # Org-specific routes
├── components/                # Shared components
├── config/                    # Configuration
├── features/                  # Feature modules
├── hooks/                     # Shared hooks
├── lib/                       # Core utilities
├── providers/                # Context providers
├── services/                 # External services
├── store/                    # Global state
└── types/                    # TypeScript types
```

## Key Features

1. **Organization Management**

    - Organization CRUD
    - Member management
    - Role-based permissions
    - Activity tracking

2. **Document Management**

    - Document CRUD
    - Block-based content
    - Real-time collaboration
    - Version history

3. **Requirements Management**
    - Requirement tracking
    - Status management
    - AI analysis
    - Export capabilities

## Development Workflow

1. **Local Development**

    ```bash
    # Initial setup
    npm install
    npm run dev
    ```

2. **Type Safety**

    ```bash
    # Generate types from Supabase
    npm run types:generate

    # Type check
    npm run type-check
    ```

3. **Testing**

    ```bash
    # Run tests
    npm run test

    # Run E2E tests
    npm run test:e2e
    ```

## Next Steps

See the following documentation sections for detailed implementation guides:

1. Database Schema and Types (02-database.md)
2. Authentication and Authorization (03-auth.md)
3. Organization Context and Providers (04-organization.md)
4. State Management Patterns (05-state.md)
5. API and Data Fetching (06-api.md)
6. Feature Implementation Guides (07-features.md)
