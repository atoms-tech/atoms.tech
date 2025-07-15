import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/supabaseServer';

interface AdvancedSettings {
    debugMode: boolean;
    customPrompts: string;
    apiTimeout: number;
    maxRetries: number;
    enableLogging: boolean;
    logLevel: string;
}

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

        // Get advanced settings from organization_agent_settings
        const { data: settings, error: settingsError } = await supabase
            .from('organization_agent_settings')
            .select('advanced_settings')
            .eq('organization_id', orgId)
            .single();

        if (settingsError && settingsError.code !== 'PGRST116') {
            console.error('Error fetching advanced settings:', settingsError);
            return NextResponse.json(
                { error: 'Failed to fetch settings' },
                { status: 500 },
            );
        }

        // Return default settings if none exist
        const defaultSettings: AdvancedSettings = {
            debugMode: false,
            customPrompts: '',
            apiTimeout: 30,
            maxRetries: 3,
            enableLogging: true,
            logLevel: 'info',
        };

        const advancedSettings = settings?.advanced_settings || defaultSettings;

        return NextResponse.json(advancedSettings);
    } catch (error) {
        console.error('Error in advanced settings GET:', error);
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
        const advancedSettings: AdvancedSettings = await request.json();
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

        // Validate the settings
        const validatedSettings: AdvancedSettings = {
            debugMode: Boolean(advancedSettings.debugMode),
            customPrompts: String(advancedSettings.customPrompts || ''),
            apiTimeout: Math.max(
                5,
                Math.min(300, Number(advancedSettings.apiTimeout) || 30),
            ),
            maxRetries: Math.max(
                0,
                Math.min(10, Number(advancedSettings.maxRetries) || 3),
            ),
            enableLogging: Boolean(advancedSettings.enableLogging),
            logLevel: ['error', 'warn', 'info', 'debug'].includes(
                advancedSettings.logLevel,
            )
                ? advancedSettings.logLevel
                : 'info',
        };

        // Update or create the settings
        const { data: updatedSettings, error: updateError } = await supabase
            .from('organization_agent_settings')
            .upsert({
                organization_id: orgId,
                advanced_settings: validatedSettings as Record<string, unknown>,
                updated_at: new Date().toISOString(),
            })
            .select('advanced_settings')
            .single();

        if (updateError) {
            console.error('Error updating advanced settings:', updateError);
            return NextResponse.json(
                { error: 'Failed to update settings' },
                { status: 500 },
            );
        }

        return NextResponse.json(updatedSettings.advanced_settings);
    } catch (error) {
        console.error('Error in advanced settings PUT:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}
