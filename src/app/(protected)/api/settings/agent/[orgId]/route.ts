import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/supabaseServer';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ orgId: string }> },
) {
    try {
        const { orgId } = await params;
        const supabase = await createClient();

        // Get the current user
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 },
            );
        }

        // Verify user has access to this organization
        const { data: membership, error: membershipError } = await supabase
            .from('organization_members')
            .select('role')
            .eq('organization_id', orgId)
            .eq('user_id', user.id)
            .single();

        if (membershipError || !membership) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Get or create agent settings for this organization
        const { data: settings, error: settingsError } = await supabase
            .from('organization_agent_settings')
            .select('*')
            .eq('organization_id', orgId)
            .single();

        if (settingsError && settingsError.code === 'PGRST116') {
            // Settings don't exist, create default settings
            const defaultSettings = {
                organization_id: orgId,
                mcp_integrations: {},
                advanced_settings: {
                    debugMode: false,
                    customPrompts: '',
                    apiTimeout: 30,
                    maxRetries: 3,
                    enableLogging: true,
                    logLevel: 'info',
                },
            };

            const { data: newSettings, error: createError } = await supabase
                .from('organization_agent_settings')
                .insert(defaultSettings)
                .select()
                .single();

            if (createError) {
                console.error('Error creating agent settings:', createError);
                return NextResponse.json(
                    { error: 'Failed to create settings' },
                    { status: 500 },
                );
            }

            settings = newSettings;
        } else if (settingsError) {
            console.error('Error fetching agent settings:', settingsError);
            return NextResponse.json(
                { error: 'Failed to fetch settings' },
                { status: 500 },
            );
        }

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Error in agent settings GET:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ orgId: string }> },
) {
    try {
        const { orgId } = await params;
        const body = await request.json();
        const supabase = await createClient();

        // Get the current user
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 },
            );
        }

        // Verify user has access to this organization
        const { data: membership, error: membershipError } = await supabase
            .from('organization_members')
            .select('role')
            .eq('organization_id', orgId)
            .eq('user_id', user.id)
            .single();

        if (membershipError || !membership) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Update the settings
        const { data: updatedSettings, error: updateError } = await supabase
            .from('organization_agent_settings')
            .upsert({
                organization_id: orgId,
                ...body,
                updated_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (updateError) {
            console.error('Error updating agent settings:', updateError);
            return NextResponse.json(
                { error: 'Failed to update settings' },
                { status: 500 },
            );
        }

        return NextResponse.json(updatedSettings);
    } catch (error) {
        console.error('Error in agent settings PUT:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}
