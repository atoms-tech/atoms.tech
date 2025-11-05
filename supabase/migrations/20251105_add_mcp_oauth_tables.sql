-- MCP OAuth support tables
-- Stores transaction state for FastMCP OAuth proxy orchestration

set check_function_bodies = off;

create table if not exists public.mcp_oauth_transactions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade,
    organization_id uuid references public.organizations(id) on delete cascade,
    mcp_namespace text not null,
    provider_key text not null,
    status text not null check (status in ('pending', 'authorized', 'failed', 'cancelled')),
    authorization_url text,
    code_challenge text,
    code_verifier text,
    state text,
    scopes text[],
    upstream_metadata jsonb default '{}'::jsonb,
    error jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    completed_at timestamptz,
    constraint mcp_oauth_transactions_user_scope check (
        (organization_id is null) or (user_id is not null)
    )
);

create table if not exists public.mcp_oauth_tokens (
    id uuid primary key default gen_random_uuid(),
    transaction_id uuid not null references public.mcp_oauth_transactions(id) on delete cascade,
    user_id uuid references auth.users(id) on delete cascade,
    organization_id uuid references public.organizations(id) on delete cascade,
    mcp_namespace text not null,
    provider_key text not null,
    access_token text,
    refresh_token text,
    token_type text,
    scope text,
    expires_at timestamptz,
    issued_at timestamptz not null default now(),
    upstream_response jsonb default '{}'::jsonb
);

create index if not exists idx_mcp_oauth_transactions_user
    on public.mcp_oauth_transactions (user_id);

create index if not exists idx_mcp_oauth_transactions_org
    on public.mcp_oauth_transactions (organization_id);

create index if not exists idx_mcp_oauth_tokens_user
    on public.mcp_oauth_tokens (user_id);

create index if not exists idx_mcp_oauth_tokens_org
    on public.mcp_oauth_tokens (organization_id);

create index if not exists idx_mcp_oauth_tokens_namespace
    on public.mcp_oauth_tokens (mcp_namespace);

create or replace function public.update_mcp_oauth_transactions_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger trigger_update_mcp_oauth_transactions_updated_at
    before update on public.mcp_oauth_transactions
    for each row
    execute function public.update_mcp_oauth_transactions_updated_at();

alter table public.mcp_oauth_transactions enable row level security;
alter table public.mcp_oauth_tokens enable row level security;

create policy "Users can manage their OAuth transactions"
    on public.mcp_oauth_transactions
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

create policy "Org admins can view organization OAuth transactions"
    on public.mcp_oauth_transactions
    for select
    using (
        organization_id in (
            select organization_id
            from public.organization_members
            where user_id = auth.uid()
              and role in ('owner', 'admin')
        )
    );

create policy "Users can read their OAuth tokens"
    on public.mcp_oauth_tokens
    for select
    using (user_id = auth.uid());

create policy "Org admins can read organization OAuth tokens"
    on public.mcp_oauth_tokens
    for select
    using (
        organization_id in (
            select organization_id
            from public.organization_members
            where user_id = auth.uid()
              and role in ('owner', 'admin')
        )
    );

