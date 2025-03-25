import { Database } from './database.types';

export type TraceLink = Database['public']['Tables']['trace_links']['Row'];

export type Assignment = Database['public']['Tables']['assignments']['Row'];

export type AuditLog = Database['public']['Tables']['audit_logs']['Row'];

export type BillingCache = Database['public']['Tables']['billing_cache']['Row'];

export type Notification = Database['public']['Tables']['notifications']['Row'];

export type UserRole = Database['public']['Tables']['user_roles']['Row'];
