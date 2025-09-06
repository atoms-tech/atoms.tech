import type { SupabaseBrowserClient } from '@/lib/atoms-api/adapters/supabase.client';
import type { SupabaseServerClient } from '@/lib/atoms-api/adapters/supabase.server';
import {
  gumloopService,
  type StartPipelineParams,
  type StartPipelineResponse,
  type PipelineRunStatusResponse,
} from '@/lib/services/gumloop';

type SupabaseAny = SupabaseBrowserClient | SupabaseServerClient;

// Pipelines domain wraps Gumloop flows
export function createPipelinesDomain(_supabase: SupabaseAny) {
  return {
    async uploadFiles(files: File[]): Promise<string[]> {
      return gumloopService.uploadFiles(files);
    },
    async start(params: StartPipelineParams): Promise<StartPipelineResponse> {
      return gumloopService.startPipeline(params);
    },
    async status(runId: string): Promise<PipelineRunStatusResponse> {
      return gumloopService.getPipelineRun({ runId });
    },
  };
}

export type PipelinesDomain = ReturnType<typeof createPipelinesDomain>;
