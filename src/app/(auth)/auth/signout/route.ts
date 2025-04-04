import { signOut } from '@/app/(auth)/auth/actions';

export async function POST() {
    const result = await signOut();
    return result;
}
