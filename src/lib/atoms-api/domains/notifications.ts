import type { SupabaseBrowserClient } from '@/lib/atoms-api/adapters/supabase.client';
import type { SupabaseServerClient } from '@/lib/atoms-api/adapters/supabase.server';
import type { Tables } from '@/types/base/database.types';

export type Notification = Tables<'notifications'>;

type SupabaseAny = SupabaseBrowserClient | SupabaseServerClient;

export function createNotificationsDomain(supabase: SupabaseAny) {
  return {
    async listByUser(userId: string, extra?: Record<string, unknown>): Promise<Notification[]> {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (extra) {
        for (const [k, v] of Object.entries(extra)) {
          if (v !== undefined) {
            query = query.eq(k as string, v as unknown as string | number | boolean | null);
          }
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as Notification[]) ?? [];
    },

    async unreadCount(userId: string): Promise<number> {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('unread', true);
      if (error) throw error;
      return count ?? 0;
    },
  };
}

export type NotificationsDomain = ReturnType<typeof createNotificationsDomain>;
