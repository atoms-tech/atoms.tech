import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/supabaseServer';
import HomeDashboard from './components/HomeDashboard.client';
import { getAuthUser, getUserProfile } from '@/lib/db';

export default async function DashboardPage() {
    return <HomeDashboard />;
}
