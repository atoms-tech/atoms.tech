import { ApiErrorClass, createApiError } from '@/lib/api/errors';

export function normalizeError(err: unknown, fallbackMessage: string): ApiErrorClass {
    if (err instanceof ApiErrorClass) return err;
    const message = err instanceof Error ? err.message : fallbackMessage;
    return createApiError.internal(message, { cause: err });
}

export { ApiErrorClass, createApiError } from '@/lib/api/errors';
