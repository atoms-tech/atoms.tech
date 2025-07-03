import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserServer } from '@/lib/db/server';
import { getUserRecentActivityPaginatedServer } from '@/lib/db/server/home.server';

export async function GET(request: NextRequest) {
    try {
        // Get authenticated user
        const user = await getAuthUserServer();
        const userId = user.user.id;
        
        // Get query parameters
        const { searchParams } = new URL(request.url);
        const cursor = searchParams.get('cursor') || undefined;
        const limit = parseInt(searchParams.get('limit') || '10');
        const requestedUserId = searchParams.get('userId');
        
        // Verify user can only access their own activity
        if (requestedUserId && requestedUserId !== userId) {
            return NextResponse.json(
                { error: 'Unauthorized access to user activity' },
                { status: 403 }
            );
        }
        
        // Validate limit
        if (limit > 50) {
            return NextResponse.json(
                { error: 'Limit cannot exceed 50 items' },
                { status: 400 }
            );
        }
        
        // Fetch paginated activity
        const paginatedActivity = await getUserRecentActivityPaginatedServer(
            userId,
            limit,
            cursor
        );
        
        return NextResponse.json(paginatedActivity);
        
    } catch (error) {
        console.error('Error fetching paginated activity:', error);
        return NextResponse.json(
            { error: 'Failed to fetch activity' },
            { status: 500 }
        );
    }
}
