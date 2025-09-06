import type { SupabaseBrowserClient } from '@/lib/atoms-api/adapters/supabase.client';
import type { SupabaseServerClient } from '@/lib/atoms-api/adapters/supabase.server';
import type { Profile } from '@/lib/atoms-api/domains/types';
import type {
  AuthResponse,
  OAuthResponse,
  SignInWithPasswordCredentials,
  SignUpWithPasswordCredentials,
  VerifyOtpParams,
  Provider as OAuthProvider,
} from '@supabase/supabase-js';

type SupabaseAny = SupabaseBrowserClient | SupabaseServerClient;

export function createAuthDomain(supabase: SupabaseAny) {
  return {
    // Returns the current auth user (if any)
    async getUser() {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return data.user ?? null;
    },

    // Returns the Profile row for a given user id
    async getProfile(userId: string): Promise<Profile | null> {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error && error.code !== 'PGRST116') throw error; // not found -> null
      return data ?? null;
    },

    async getByEmail(email: string): Promise<Profile | null> {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('email', email)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data ?? null;
    },

    async updateProfile(userId: string, data: Partial<Profile>): Promise<Profile> {
      const { data: updated, error } = await (supabase as SupabaseBrowserClient)
        .from('profiles')
        .update(data)
        .eq('id', userId)
        .select('*')
        .single();
      if (error) throw error;
      return updated as Profile;
    },

    async listProfiles(select: string = 'email, full_name, id, is_approved, created_at') {
      const { data, error } = await (supabase as SupabaseBrowserClient)
        .from('profiles')
        .select(select)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Array<Pick<Profile, 'email' | 'full_name' | 'id' | 'is_approved' | 'created_at'>>;
    },

    async setApproval(userId: string, isApproved: boolean) {
      const { error } = await (supabase as SupabaseBrowserClient)
        .from('profiles')
        .update({ is_approved: isApproved })
        .eq('id', userId);
      if (error) throw error;
      return { userId, isApproved };
    },

    // Auth flows exposed so UI never imports Supabase directly
    async signInWithPassword(
      credentials: SignInWithPasswordCredentials,
    ): Promise<AuthResponse> {
      return await (supabase as SupabaseServerClient).auth.signInWithPassword(credentials);
    },

    async signUp(credentials: SignUpWithPasswordCredentials & { options?: { data?: Record<string, unknown>; emailRedirectTo?: string } }): Promise<AuthResponse> {
      return await (supabase as SupabaseServerClient).auth.signUp(credentials as SignUpWithPasswordCredentials);
    },

    async signOut(): Promise<{ error: AuthResponse['error'] }> {
      const { error } = await (supabase as SupabaseServerClient).auth.signOut();
      return { error } as { error: AuthResponse['error'] };
    },

    async exchangeCodeForSession(code: string): Promise<AuthResponse> {
      return await (supabase as SupabaseServerClient).auth.exchangeCodeForSession(code);
    },

    async verifyOtp(params: VerifyOtpParams): Promise<{ data: unknown; error: AuthResponse['error'] }> {
      const { data, error } = await (supabase as SupabaseServerClient).auth.verifyOtp(params);
      return { data, error } as { data: unknown; error: AuthResponse['error'] };
    },

    async signInWithOAuth(params: { provider: OAuthProvider; options?: { redirectTo?: string } }): Promise<OAuthResponse> {
      return await (supabase as SupabaseServerClient).auth.signInWithOAuth(params);
    },
  };
}

export type AuthDomain = ReturnType<typeof createAuthDomain>;
