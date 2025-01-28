# Authentication and Middleware Implementation

## Supabase Authentication Setup

### 1. Auth Provider Implementation

```typescript
// providers/supabase-auth.tsx
'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect } from 'react';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({
  children,
  initialSession,
}: {
  children: React.ReactNode;
  initialSession: Session | null;
}) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(initialSession);
  const [user, setUser] = useState<User | null>(initialSession?.user ?? null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Initialize Supabase client
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      router.refresh();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      router.refresh();
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    router.refresh();
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      signIn,
      signUp,
      signOut,
      isLoading,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

### 2. Server-Side Auth Utils

```typescript
// lib/auth/server.ts
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';
import { Database } from '@/types/supabase';

export async function getSession() {
    const cookieStore = cookies();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    cookieStore.set({ name, value, ...options });
                },
                remove(name: string, options: CookieOptions) {
                    cookieStore.set({ name, value: '', ...options });
                },
            },
        },
    );

    const {
        data: { session },
    } = await supabase.auth.getSession();
    return session;
}

export async function getUser() {
    const session = await getSession();
    return session?.user ?? null;
}

export async function getUserProfile() {
    const user = await getUser();
    if (!user) return null;

    const supabase = createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!,
    );

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    return profile;
}
```

## Middleware Implementation

### 1. Root Middleware

```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Database } from '@/types/supabase';

export async function middleware(req: NextRequest) {
    const res = NextResponse.next();
    const supabase = createMiddlewareClient<Database>({ req, res });

    // Refresh session if expired
    const {
        data: { session },
    } = await supabase.auth.getSession();

    // Authentication check
    const isAuthRoute = req.nextUrl.pathname.startsWith('/auth');
    const isApiRoute = req.nextUrl.pathname.startsWith('/api');
    const isOrgRoute = req.nextUrl.pathname.startsWith('/org');

    // Handle authentication routes
    if (isAuthRoute) {
        if (session) {
            // Redirect to dashboard if already authenticated
            return NextResponse.redirect(new URL('/org', req.url));
        }
        return res;
    }

    // Protected routes
    if (isOrgRoute || isApiRoute) {
        if (!session) {
            // Redirect to login if not authenticated
            return NextResponse.redirect(new URL('/auth/login', req.url));
        }

        // For organization routes, verify organization access
        if (isOrgRoute) {
            const orgSlug = req.nextUrl.pathname.split('/')[2];
            if (orgSlug) {
                try {
                    // Verify organization membership
                    const { data: membership } = await supabase
                        .from('organization_members')
                        .select('role')
                        .eq('organization_slug', orgSlug)
                        .eq('user_id', session.user.id)
                        .single();

                    if (!membership) {
                        return NextResponse.redirect(new URL('/403', req.url));
                    }
                } catch (error) {
                    console.error(
                        'Error verifying organization access:',
                        error,
                    );
                    return NextResponse.redirect(new URL('/500', req.url));
                }
            }
        }
    }

    return res;
}

// Specify which routes should be processed by the middleware
export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|public/).*)',
    ],
};
```

### 2. Organization Middleware

```typescript
// middleware/organization.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function withOrganization(
    req: NextRequest,
    handler: (context: {
        org: Organization;
        membership: OrganizationMember;
    }) => Promise<NextResponse>,
) {
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req, res });

    try {
        // Get organization from URL
        const orgSlug = req.nextUrl.pathname.split('/')[2];
        if (!orgSlug) {
            return NextResponse.redirect(new URL('/404', req.url));
        }

        // Get organization data
        const { data: org } = await supabase
            .from('organizations')
            .select('*')
            .eq('slug', orgSlug)
            .single();

        if (!org) {
            return NextResponse.redirect(new URL('/404', req.url));
        }

        // Get user's membership
        const { data: membership } = await supabase
            .from('organization_members')
            .select('*')
            .eq('organization_id', org.id)
            .eq('user_id', session.user.id)
            .single();

        if (!membership) {
            return NextResponse.redirect(new URL('/403', req.url));
        }

        // Call handler with context
        return handler({ org, membership });
    } catch (error) {
        console.error('Organization middleware error:', error);
        return NextResponse.redirect(new URL('/500', req.url));
    }
}
```

### 3. Permission Middleware

```typescript
// middleware/permissions.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export type Permission = 'read' | 'write' | 'admin';

export const withPermissions = (permissions: Permission[]) => {
    return async (
        req: NextRequest,
        handler: (context: {
            permissions: Permission[];
        }) => Promise<NextResponse>,
    ) => {
        const res = NextResponse.next();
        const supabase = createMiddlewareClient({ req, res });

        try {
            // Get user's role in the organization
            const orgSlug = req.nextUrl.pathname.split('/')[2];
            const { data: membership } = await supabase
                .from('organization_members')
                .select('role')
                .eq('organization_slug', orgSlug)
                .eq('user_id', session.user.id)
                .single();

            if (!membership) {
                return NextResponse.redirect(new URL('/403', req.url));
            }

            // Check if user has required permissions
            const hasPermission = permissions.every((permission) =>
                hasPermissionForRole(membership.role, permission),
            );

            if (!hasPermission) {
                return NextResponse.redirect(new URL('/403', req.url));
            }

            return handler({ permissions });
        } catch (error) {
            console.error('Permission middleware error:', error);
            return NextResponse.redirect(new URL('/500', req.url));
        }
    };
};

function hasPermissionForRole(role: string, permission: Permission): boolean {
    const rolePermissions: Record<string, Permission[]> = {
        owner: ['read', 'write', 'admin'],
        admin: ['read', 'write', 'admin'],
        member: ['read', 'write'],
        viewer: ['read'],
    };

    return rolePermissions[role]?.includes(permission) ?? false;
}
```

## Authentication Flows

### 1. Sign In Flow

```typescript
// app/auth/login/page.tsx
'use client';

import { useAuth } from '@/providers/supabase-auth';

export default function LoginPage() {
  const { signIn, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signIn(email, password);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    // Login form implementation
  );
}
```

### 2. Auth Callback Handler

```typescript
// app/auth/callback/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');

    if (code) {
        const cookieStore = cookies();
        const supabase = createRouteHandlerClient({
            cookies: () => cookieStore,
        });
        await supabase.auth.exchangeCodeForSession(code);
    }

    // URL to redirect to after sign in process completes
    return NextResponse.redirect(requestUrl.origin);
}
```

## Security Best Practices

1. **Session Management**

    - Server-side session validation
    - Automatic token refresh
    - Secure cookie handling

2. **Permission Management**

    - Role-based access control
    - Granular permissions
    - Resource-level access control

3. **Error Handling**

    - Secure error messages
    - Proper error logging
    - Graceful fallbacks

4. **API Security**
    - Request validation
    - Rate limiting
    - CORS configuration
