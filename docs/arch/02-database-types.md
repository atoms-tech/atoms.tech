# Database and Type System

## Database Schema

### Core Tables

1. **organizations**

```sql
create table organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  description text,
  type text not null,
  logo_url text,
  billing_plan text not null default 'free',
  billing_cycle text not null default 'monthly',
  max_members int not null default 5,
  max_monthly_requests int not null default 1000,
  settings jsonb default '{}',
  metadata jsonb default '{}',
  member_count int not null default 0,
  storage_used bigint not null default 0,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  status text not null default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  is_deleted boolean default false,
  deleted_at timestamp with time zone,
  deleted_by uuid references auth.users(id)
);

-- Indexes
create index organizations_slug_idx on organizations(slug);
create index organizations_created_by_idx on organizations(created_by);
create index organizations_status_idx on organizations(status);
```

2. **documents**

```sql
create table documents (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id),
  name text not null,
  description text,
  slug text not null,
  tags text[] default array[]::text[],
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  version int not null default 1,
  is_deleted boolean default false,
  deleted_at timestamp with time zone,
  deleted_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Indexes
create index documents_project_id_idx on documents(project_id);
create index documents_slug_idx on documents(slug);
create index documents_created_by_idx on documents(created_by);
```

### Type Definitions

1. **Zod Schemas**

```typescript
// types/schema.ts
import { z } from 'zod';

// Common fields for all entities
const commonFields = {
    created_at: z.string().datetime(),
    updated_at: z.string().datetime().optional(),
    is_deleted: z.boolean().default(false),
    deleted_at: z.string().datetime().nullable(),
    deleted_by: z.string().uuid().nullable(),
    version: z.number().optional(),
};

// Organization Schema
export const organizationSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1),
    slug: z.string().min(1),
    description: z.string().nullable(),
    type: z.string(),
    logo_url: z.string().url().nullable(),
    billing_plan: z.string(),
    billing_cycle: z.string(),
    max_members: z.number(),
    max_monthly_requests: z.number(),
    settings: z.record(z.unknown()).nullable(),
    metadata: z.record(z.unknown()).nullable(),
    member_count: z.number(),
    storage_used: z.number(),
    created_by: z.string().uuid(),
    updated_by: z.string().uuid().nullable(),
    status: z.string(),
    ...commonFields,
});

// Document Schema
export const documentSchema = z.object({
    id: z.string().uuid(),
    project_id: z.string().uuid(),
    name: z.string(),
    description: z.string().nullable(),
    slug: z.string(),
    tags: z.array(z.string()).nullable(),
    created_by: z.string().uuid(),
    updated_by: z.string().uuid().nullable(),
    ...commonFields,
});

// Export types
export type Organization = z.infer<typeof organizationSchema>;
export type Document = z.infer<typeof documentSchema>;
```

2. **Supabase Types Generation**

```typescript
// types/supabase.ts
export type Database = {
    public: {
        Tables: {
            organizations: {
                Row: Organization;
                Insert: Omit<Organization, 'id' | 'created_at'>;
                Update: Partial<Omit<Organization, 'id'>>;
            };
            documents: {
                Row: Document;
                Insert: Omit<Document, 'id' | 'created_at'>;
                Update: Partial<Omit<Document, 'id'>>;
            };
            // ... other tables
        };
    };
};
```

## Type Safety Utilities

1. **Type Guards**

```typescript
// utils/typeGuards.ts
export function isOrganization(obj: unknown): obj is Organization {
    return organizationSchema.safeParse(obj).success;
}

export function isDocument(obj: unknown): obj is Document {
    return documentSchema.safeParse(obj).success;
}
```

2. **Validation Utilities**

```typescript
// utils/validation.ts
export const validateOrganization = (data: unknown) => {
    const result = organizationSchema.safeParse(data);
    if (!result.success) {
        throw new ValidationError('Invalid organization data', result.error);
    }
    return result.data;
};

export const validateDocument = (data: unknown) => {
    const result = documentSchema.safeParse(data);
    if (!result.success) {
        throw new ValidationError('Invalid document data', result.error);
    }
    return result.data;
};
```

## Database Access Patterns

1. **Query Builder Types**

```typescript
// types/queries.ts
export type QueryOptions = {
    select?: string[];
    filter?: Record<string, unknown>;
    sort?: { field: string; direction: 'asc' | 'desc' }[];
    page?: number;
    limit?: number;
};

export type QueryResult<T> = {
    data: T[];
    count: number;
    hasMore: boolean;
};
```

2. **Database Client**

```typescript
// lib/db.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

export const createDatabaseClient = (type: 'server' | 'client') => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey =
        type === 'server'
            ? process.env.SUPABASE_SERVICE_KEY!
            : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    return createClient<Database>(supabaseUrl, supabaseKey);
};
```

## Migrations and Seeding

1. **Migration Management**

```sql
-- migrations/01_initial_schema.sql
-- Create core tables

-- migrations/02_indexes.sql
-- Add indexes for performance

-- migrations/03_functions.sql
-- Add database functions
```

2. **Seed Data**

```typescript
// scripts/seed.ts
import { createDatabaseClient } from '../lib/db';

async function seed() {
    const supabase = createDatabaseClient('server');

    // Insert seed data
    await supabase.from('organizations').insert([
        // Seed organizations
    ]);

    // Insert other seed data
}
```

## Best Practices

1. **Type Safety**

    - Always use Zod schemas for validation
    - Generate and use Supabase types
    - Use type guards for runtime checks

2. **Performance**

    - Create appropriate indexes
    - Use efficient queries
    - Implement connection pooling

3. **Maintenance**
    - Keep migrations versioned
    - Document schema changes
    - Maintain test data
