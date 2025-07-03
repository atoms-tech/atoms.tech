#!/usr/bin/env tsx

/**
 * Script to populate analytics data with realistic audit log entries
 * This creates sample activity data for the analytics dashboard
 */
import { createClient } from '@supabase/supabase-js';

import { Database } from '../src/types/base/database.types';

// Initialize Supabase client
const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

interface PopulateOptions {
    orgId: string;
    projectId?: string;
    daysBack?: number;
    activitiesPerDay?: number;
}

// Sample activity types and their weights (higher = more common)
const ACTIVITY_TYPES = [
    { action: 'created', weight: 20 },
    { action: 'updated', weight: 50 },
    { action: 'viewed', weight: 30 },
    { action: 'deleted', weight: 5 },
    { action: 'restored', weight: 3 },
    { action: 'duplicated', weight: 8 },
    { action: 'shared', weight: 10 },
    { action: 'exported', weight: 7 },
];

const ENTITY_TYPES = ['document', 'block', 'requirement'];

// Generate realistic timestamps over the past N days
function generateTimestamps(
    daysBack: number,
    activitiesPerDay: number,
): Date[] {
    const timestamps: Date[] = [];
    const now = new Date();

    for (let day = 0; day < daysBack; day++) {
        const dayStart = new Date(now.getTime() - day * 24 * 60 * 60 * 1000);
        dayStart.setHours(9, 0, 0, 0); // Start at 9 AM

        const dayEnd = new Date(dayStart);
        dayEnd.setHours(18, 0, 0, 0); // End at 6 PM

        // Generate random activities throughout the day
        const activitiesForDay = Math.floor(
            activitiesPerDay * (0.5 + Math.random()),
        );

        for (let i = 0; i < activitiesForDay; i++) {
            const randomTime = new Date(
                dayStart.getTime() +
                    Math.random() * (dayEnd.getTime() - dayStart.getTime()),
            );
            timestamps.push(randomTime);
        }
    }

    return timestamps.sort((a, b) => a.getTime() - b.getTime());
}

// Select random activity type based on weights
function selectRandomActivity(): string {
    const totalWeight = ACTIVITY_TYPES.reduce(
        (sum, type) => sum + type.weight,
        0,
    );
    let random = Math.random() * totalWeight;

    for (const type of ACTIVITY_TYPES) {
        random -= type.weight;
        if (random <= 0) {
            return type.action;
        }
    }

    return 'updated'; // fallback
}

// Generate realistic old_data and new_data based on entity type and action
function generateActivityData(
    entityType: string,
    action: string,
    entityData: any,
) {
    const baseData = {
        id: entityData.id,
        name: entityData.name || `${entityType} ${entityData.id.slice(0, 8)}`,
        created_at: entityData.created_at,
        updated_at: new Date().toISOString(),
        version: (entityData.version || 1) + 1,
    };

    switch (action) {
        case 'created':
            return {
                old_data: null,
                new_data: baseData,
            };

        case 'updated':
            const oldData = { ...baseData, version: baseData.version - 1 };
            const newData = {
                ...baseData,
                name: baseData.name + ' (updated)',
                description: `Updated ${entityType} with new content`,
            };
            return { old_data: oldData, new_data: newData };

        case 'deleted':
            return {
                old_data: baseData,
                new_data: { ...baseData, is_deleted: true },
            };

        case 'restored':
            return {
                old_data: { ...baseData, is_deleted: true },
                new_data: { ...baseData, is_deleted: false },
            };

        case 'duplicated':
            return {
                old_data: baseData,
                new_data: {
                    ...baseData,
                    id: `${baseData.id}_copy`,
                    name: `${baseData.name} (copy)`,
                },
            };

        default:
            return {
                old_data: baseData,
                new_data: baseData,
            };
    }
}

async function populateAnalyticsData(options: PopulateOptions) {
    const { orgId, projectId, daysBack = 30, activitiesPerDay = 15 } = options;

    console.log(`🚀 Starting analytics data population for org: ${orgId}`);

    try {
        // Get existing documents and blocks
        let documentsQuery = supabase
            .from('documents')
            .select('*')
            .eq('is_deleted', false);

        if (projectId) {
            documentsQuery = documentsQuery.eq('project_id', projectId);
        }

        const { data: documents, error: docsError } = await documentsQuery;
        if (docsError) throw docsError;

        const { data: blocks, error: blocksError } = await supabase
            .from('blocks')
            .select('*')
            .eq('is_deleted', false)
            .in('document_id', documents?.map((d) => d.id) || []);

        if (blocksError) throw blocksError;

        // Get users from the organization
        const { data: orgMembers, error: membersError } = await supabase
            .from('organization_members')
            .select('user_id')
            .eq('organization_id', orgId);

        if (membersError) throw membersError;

        // Get user profiles separately
        const userIds = orgMembers?.map((m) => m.user_id) || [];
        const { data: users, error: usersError } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .in('id', userIds);

        if (usersError) throw usersError;

        if (documents?.length === 0 || users.length === 0) {
            console.log(
                '❌ No documents or users found. Cannot populate analytics data.',
            );
            return;
        }

        console.log(
            `📊 Found ${documents?.length} documents, ${blocks?.length} blocks, ${users.length} users`,
        );

        // Generate timestamps
        const timestamps = generateTimestamps(daysBack, activitiesPerDay);
        console.log(
            `⏰ Generated ${timestamps.length} activity timestamps over ${daysBack} days`,
        );

        // Create audit log entries
        const auditLogs = [];

        for (const timestamp of timestamps) {
            // Select random user
            const user = users[Math.floor(Math.random() * users.length)];

            // Select random entity (document or block)
            const allEntities = [
                ...(documents?.map((d) => ({ ...d, type: 'document' })) || []),
                ...(blocks?.map((b) => ({ ...b, type: 'block' })) || []),
            ];

            if (allEntities.length === 0) continue;

            const entity =
                allEntities[Math.floor(Math.random() * allEntities.length)];
            const action = selectRandomActivity();
            const { old_data, new_data } = generateActivityData(
                entity.type,
                action,
                entity,
            );

            auditLogs.push({
                action,
                actor_id: user.id,
                entity_id: entity.id,
                entity_type: entity.type,
                old_data,
                new_data,
                created_at: timestamp.toISOString(),
                metadata: {
                    version:
                        (entity.version || 1) + Math.floor(Math.random() * 5),
                    source: 'analytics_population_script',
                    user_agent: 'Mozilla/5.0 (Analytics Script)',
                    ip_address: '127.0.0.1',
                },
            });
        }

        // Insert audit logs in batches
        const batchSize = 100;
        let inserted = 0;

        for (let i = 0; i < auditLogs.length; i += batchSize) {
            const batch = auditLogs.slice(i, i + batchSize);

            const { error: insertError } = await supabase
                .from('audit_logs')
                .insert(batch);

            if (insertError) {
                console.error(
                    `❌ Error inserting batch ${i / batchSize + 1}:`,
                    insertError,
                );
                continue;
            }

            inserted += batch.length;
            console.log(
                `✅ Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(auditLogs.length / batchSize)} (${inserted}/${auditLogs.length} total)`,
            );
        }

        console.log(`🎉 Successfully populated ${inserted} audit log entries!`);
        console.log(`📈 Analytics dashboard should now show real data`);
    } catch (error) {
        console.error('❌ Error populating analytics data:', error);
        throw error;
    }
}

// Main execution
async function main() {
    const orgId = process.argv[2];
    const projectId = process.argv[3];

    if (!orgId) {
        console.error(
            '❌ Usage: tsx scripts/populate-analytics-data.ts <orgId> [projectId]',
        );
        console.error(
            '   Example: tsx scripts/populate-analytics-data.ts 46bddba6-f612-4bb8-b5d0-5b0be00c945c',
        );
        process.exit(1);
    }

    await populateAnalyticsData({
        orgId,
        projectId,
        daysBack: 30,
        activitiesPerDay: 20,
    });
}

if (require.main === module) {
    main().catch(console.error);
}

export { populateAnalyticsData };
