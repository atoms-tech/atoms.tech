import { NextRequest, NextResponse } from 'next/server';

import {
    GetPipelineRunParams,
    StartPipelineParams,
    gumloopService,
} from '@/lib/services/gumloop';
import { createClient } from '@/lib/supabase/supabaseServer';
import { BillingCacheSchema } from '@/types/validation';

// import { rateLimit } from '@/lib/middleware/rateLimit';

type ActionType = 'startPipeline' | 'getPipelineStatus';

interface BaseRequest {
    action: ActionType;
}

interface StartPipelineRequest extends BaseRequest, StartPipelineParams {
    action: 'startPipeline';
}

interface GetPipelineStatusRequest extends BaseRequest, GetPipelineRunParams {
    action: 'getPipelineStatus';
}

type ApiRequest = StartPipelineRequest | GetPipelineStatusRequest;

export async function POST(request: NextRequest) {
    try {
        // Parse and validate request body
        const body = (await request.json()) as ApiRequest;

        if (!body.action) {
            return NextResponse.json(
                { error: 'Action is required' },
                { status: 400 },
            );
        }

        switch (body.action) {
            case 'startPipeline': {
                const pipelineResponse =
                    await gumloopService.startPipeline(body);

                // increment the API usage counter
                const supabase = await createClient();

                // select one
                const { data, error } = await supabase
                    .from('billing_cache')
                    .select('*')
                    .eq('organization_id', body.organizationId);

                if (error) throw error;

                const billingRecord = BillingCacheSchema.parse(data[0]);

                // @ts-expect-error The property exists
                billingRecord.current_period_usage.api_calls += 1;
                if (!billingRecord.current_period_usage) {
                    throw new Error('No billing record found');
                }

                // Update the record in database
                const { data: updateData, error: updateError } = await supabase
                    .from('billing_cache')
                    .update({
                        current_period_usage: {
                            // @ts-expect-error The property exists
                            ...billingRecord.current_period_usage,
                        },
                    })
                    .eq('organization_id', body.organizationId)
                    .select();

                if (updateError) throw updateError;

                console.log('updateData', updateData);

                return NextResponse.json(pipelineResponse);
            }

            case 'getPipelineStatus': {
                const status = await gumloopService.getPipelineRun(body);
                return NextResponse.json(status);
            }

            default:
                return NextResponse.json(
                    { error: 'Invalid action' },
                    { status: 400 },
                );
        }
    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : 'An error occurred',
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
            return NextResponse.json(
                { error: 'Run ID is required' },
                { status: 400 },
            );
        }

        const status = await gumloopService.getPipelineRun({ runId });
        return NextResponse.json(status);
    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : 'An error occurred',
            },
            { status: 500 },
        );
    }
}
