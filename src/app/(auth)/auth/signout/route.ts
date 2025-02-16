import { signOut } from '@/app/(auth)/auth/actions';

export async function POST() {
    await signOut();
    return new Response(null, { status: 200 });
}
