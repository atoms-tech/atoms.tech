import { NextRequest, NextResponse } from 'next/server';

import { atomsApiServer } from '@/lib/atoms-api/server';
import type { StartPipelineParams } from '@/lib/services/gumloop';

// import { createClient } from '@/lib/supabase/supabaseServer';

export async function POST(request: NextRequest) {
    try {
        // Parse and validate request body
        const body = (await request.json()) as StartPipelineParams;

        const api = await atomsApiServer();
        const pipelineResponse = await api.pipelines.start(body);

        return NextResponse.json(pipelineResponse);
    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'An error occurred',
            },
            { status: 500 },
        );
    }
}

// GET method for pipeline status checks
export async function GET(request: NextRequest) {
    try {
        const runId = request.nextUrl.searchParams.get('runId');
        if (!runId) {
            return NextResponse.json({ error: 'Run ID is required' }, { status: 400 });
        }

        // const organizationId = request.nextUrl.searchParams.get('organizationId');

        const api = await atomsApiServer();
        const status = await api.pipelines.status(runId);

        // if (status.state == PipelineRunState.DONE) {
        //     console.log(
        //         `Adding ${status.credit_cost} cost to the billing cache`,
        //     );

        //     // increment the API usage counter
        //     const supabase = await createClient();
        //     const { data: billingRecord, error } = await supabase
        //         .from('billing_cache')
        //         .select('*')
        //         .eq('organization_id', organizationId)
        //         .single();

        //     if (error) throw error;

        //     // @ts-expect-error The property exists
        //     billingRecord.current_period_usage.api_calls += status.credit_cost;
        //     if (!billingRecord.current_period_usage) {
        //         throw new Error('No billing record found');
        //     }

        //     // Update the record in database
        //     const { error: updateError } = await supabase
        //         .from('billing_cache')
        //         .update({
        //             current_period_usage: {
        //                 // @ts-expect-error The property exists
        //                 ...billingRecord.current_period_usage,
        //             },
        //         })
        //         .eq('organization_id', organizationId)
        //         .select();

        //     if (updateError) throw updateError;
        // }

        return NextResponse.json(status);
    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'An error occurred',
            },
            { status: 500 },
        );
    }
}
