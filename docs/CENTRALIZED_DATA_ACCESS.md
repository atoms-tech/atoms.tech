Centralized Data Access

Policy

- UI code MUST NOT import Supabase directly.
- All data access goes through atoms-api domains (`src/lib/atoms-api/domains/*`).
- Supabase usage is allowed only inside:
    - atoms-api domains/adapters (centralized library)
    - auth/middleware where strictly necessary (Edge caveat noted)

Enforcement

- ESLint blocks imports of `@/lib/supabase/supabaseBrowser` and `@/lib/supabase/supabaseServer` outside adapters.
- Script guard: `npm run check:centralized` fails if UI files use `.supabase` or import supabase directly.

How to extend a domain

1. Add method in `src/lib/atoms-api/domains/<domain>.ts` using Supabase queries.
2. Keep return types narrow (DTOs if needed) and normalize errors.
3. Update docs in `src/lib/atoms-api/README.md` with examples.

Migration Path to .NET

- When a .NET endpoint is ready, add an HTTP call (behind a feature flag like `NEXT_PUBLIC_ATOMS_BACKEND_URL`).
- Keep Supabase code as the fallback; switch per-domain when stable.
- Do not change UI import sites — only the domain implementation.
