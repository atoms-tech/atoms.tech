import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/supabaseServer';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const organizationId = searchParams.get('organizationId');

        if (!organizationId) {
            return NextResponse.json(
                { error: 'Organization ID is required' },
                { status: 400 },
            );
        }

        // Verify user has access to organization
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 },
            );
        }

        // Check organization membership
        const { data: membership } = await supabase
            .from('organization_members')
            .select('role')
            .eq('organization_id', organizationId)
            .eq('user_id', user.id)
            .single();

        if (!membership) {
            return NextResponse.json(
                { error: 'Access denied' },
                { status: 403 },
            );
        }

        // Get MCP configurations for organization
        const { data: configurations, error } = await (
            supabase as unknown as {
                from: (table: string) => {
                    select: (columns?: string) => {
                        eq: (
                            column: string,
                            value: unknown,
                        ) => {
                            order: (
                                column: string,
                                options?: { ascending: boolean },
                            ) => Promise<{ data: unknown; error: unknown }>;
                        };
                    };
                };
            }
        )
            .from('mcp_configurations')
            .select('*')
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Failed to fetch MCP configurations:', error);
            return NextResponse.json(
                { error: 'Failed to fetch MCP configurations' },
                { status: 500 },
            );
        }

        return NextResponse.json({ configurations });
    } catch (error) {
        console.error('MCP API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const body = await request.json();
        const { organizationId, name, type, configuration } = body;

        if (!organizationId || !name || !type || !configuration) {
            return NextResponse.json(
                { error: 'Missing required parameters' },
                { status: 400 },
            );
        }

        // Verify user has access to organization
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 },
            );
        }

        // Check organization membership and admin role
        const { data: membership } = await supabase
            .from('organization_members')
            .select('role')
            .eq('organization_id', organizationId)
            .eq('user_id', user.id)
            .single();

        if (!membership || !['owner', 'admin'].includes(membership.role)) {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 },
            );
        }

        // Validate configuration based on type
        const validationResult = validateMCPConfiguration(type, configuration);
        if (!validationResult.valid) {
            return NextResponse.json(
                { error: validationResult.error },
                { status: 400 },
            );
        }

        // Create MCP configuration
        const { data: newConfiguration, error } = await (
            supabase as unknown as {
                from: (table: string) => {
                    insert: (data: Record<string, unknown>) => {
                        select: () => {
                            single: () => Promise<{
                                data: unknown;
                                error: unknown;
                            }>;
                        };
                    };
                };
            }
        )
            .from('mcp_configurations')
            .insert({
                organization_id: organizationId,
                name,
                type,
                configuration,
                created_by: user.id,
                is_active: true,
            })
            .select()
            .single();

        if (error) {
            console.error('Failed to create MCP configuration:', error);
            if (error.code === '23505') {
                // Unique constraint violation
                return NextResponse.json(
                    { error: 'Configuration with this name already exists' },
                    { status: 409 },
                );
            }
            return NextResponse.json(
                { error: 'Failed to create MCP configuration' },
                { status: 500 },
            );
        }

        return NextResponse.json(
            { configuration: newConfiguration },
            { status: 201 },
        );
    } catch (error) {
        console.error('MCP API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const supabase = await createClient();
        const body = await request.json();
        const { id, organizationId, name, type, configuration, isActive } =
            body;

        if (!id || !organizationId) {
            return NextResponse.json(
                { error: 'ID and organization ID are required' },
                { status: 400 },
            );
        }

        // Verify user has access to organization
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 },
            );
        }

        // Check organization membership and admin role
        const { data: membership } = await supabase
            .from('organization_members')
            .select('role')
            .eq('organization_id', organizationId)
            .eq('user_id', user.id)
            .single();

        if (!membership || !['owner', 'admin'].includes(membership.role)) {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 },
            );
        }

        // Validate configuration if provided
        if (type && configuration) {
            const validationResult = validateMCPConfiguration(
                type,
                configuration,
            );
            if (!validationResult.valid) {
                return NextResponse.json(
                    { error: validationResult.error },
                    { status: 400 },
                );
            }
        }

        // Update MCP configuration
        const updateData: Record<string, unknown> = { updated_at: new Date() };
        if (name !== undefined) updateData.name = name;
        if (type !== undefined) updateData.type = type;
        if (configuration !== undefined)
            updateData.configuration = configuration;
        if (isActive !== undefined) updateData.is_active = isActive;

        const { data: updatedConfiguration, error } = await (
            supabase as unknown as {
                from: (table: string) => {
                    update: (data: Record<string, unknown>) => {
                        eq: (
                            column: string,
                            value: unknown,
                        ) => {
                            eq: (
                                column: string,
                                value: unknown,
                            ) => {
                                select: () => {
                                    single: () => Promise<{
                                        data: unknown;
                                        error: unknown;
                                    }>;
                                };
                            };
                        };
                    };
                };
            }
        )
            .from('mcp_configurations')
            .update(updateData)
            .eq('id', id)
            .eq('organization_id', organizationId)
            .select()
            .single();

        if (error) {
            console.error('Failed to update MCP configuration:', error);
            return NextResponse.json(
                { error: 'Failed to update MCP configuration' },
                { status: 500 },
            );
        }

        if (!updatedConfiguration) {
            return NextResponse.json(
                { error: 'Configuration not found' },
                { status: 404 },
            );
        }

        return NextResponse.json({ configuration: updatedConfiguration });
    } catch (error) {
        console.error('MCP API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const organizationId = searchParams.get('organizationId');

        if (!id || !organizationId) {
            return NextResponse.json(
                { error: 'ID and organization ID are required' },
                { status: 400 },
            );
        }

        // Verify user has access to organization
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 },
            );
        }

        // Check organization membership and admin role
        const { data: membership } = await supabase
            .from('organization_members')
            .select('role')
            .eq('organization_id', organizationId)
            .eq('user_id', user.id)
            .single();

        if (!membership || !['owner', 'admin'].includes(membership.role)) {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 },
            );
        }

        // Delete MCP configuration
        const { error } = await (
            supabase as unknown as {
                from: (table: string) => {
                    delete: () => {
                        eq: (
                            column: string,
                            value: unknown,
                        ) => {
                            eq: (
                                column: string,
                                value: unknown,
                            ) => Promise<{ error: unknown }>;
                        };
                    };
                };
            }
        )
            .from('mcp_configurations')
            .delete()
            .eq('id', id)
            .eq('organization_id', organizationId);

        if (error) {
            console.error('Failed to delete MCP configuration:', error);
            return NextResponse.json(
                { error: 'Failed to delete MCP configuration' },
                { status: 500 },
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('MCP API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}

// Helper function to validate MCP configuration
function validateMCPConfiguration(
    type: string,
    configuration: Record<string, unknown>,
): { valid: boolean; error?: string } {
    switch (type) {
        case 'webhook':
            if (!configuration.webhookUrl) {
                return { valid: false, error: 'Webhook URL is required' };
            }
            if (!isValidUrl(configuration.webhookUrl as string)) {
                return { valid: false, error: 'Invalid webhook URL' };
            }
            break;

        case 'api':
            if (!configuration.baseUrl) {
                return {
                    valid: false,
                    error: 'Base URL is required for API integration',
                };
            }
            if (!isValidUrl(configuration.baseUrl as string)) {
                return { valid: false, error: 'Invalid base URL' };
            }
            break;

        case 'custom':
            // Custom integrations can have flexible configuration
            break;

        default:
            return { valid: false, error: 'Invalid integration type' };
    }

    return { valid: true };
}

function isValidUrl(string: string): boolean {
    try {
        new URL(string);
        return true;
    } catch {
        return false;
    }
}
