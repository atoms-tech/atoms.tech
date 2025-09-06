import type { SupabaseBrowserClient } from '@/lib/atoms-api/adapters/supabase.client';
import type { SupabaseServerClient } from '@/lib/atoms-api/adapters/supabase.server';
import {
  chunkrService,
  type TaskResponse,
} from '@/lib/services/chunkr';

type SupabaseAny = SupabaseBrowserClient | SupabaseServerClient;

// OCR domain wraps Chunkr tasks
export function createOcrDomain(_supabase: SupabaseAny) {
  return {
    async processFiles(files: File[]): Promise<string[]> {
      return chunkrService.processFiles(files);
    },
    async status(taskId: string): Promise<TaskResponse> {
      return chunkrService.getTaskStatus({ taskId });
    },
  };
}

export type OcrDomain = ReturnType<typeof createOcrDomain>;
