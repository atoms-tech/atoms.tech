type LogContext = Record<string, unknown>;

const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

const normalizeContext = (context?: LogContext): LogContext | undefined => {
    if (!context) {
        return undefined;
    }

    const entries = Object.entries(context).filter(([_, value]) => value !== undefined);

    return entries.length > 0 ? Object.fromEntries(entries) : undefined;
};

const serializeError = (error: unknown): LogContext => {
    if (error instanceof Error) {
        const serialized: LogContext = {
            name: error.name,
            message: error.message,
        };

        if (error.stack && isDevelopment) {
            serialized.stack = error.stack;
        }

        if ('cause' in error && error.cause) {
            serialized.cause = serializeError(error.cause);
        }

        return serialized;
    }

    if (typeof error === 'object' && error !== null) {
        return error as LogContext;
    }

    return { value: error };
};

const logWithLevel = (
    level: 'info' | 'warn' | 'error',
    message: string,
    payload?: LogContext,
): void => {
    const formattedPayload = normalizeContext(payload);

    switch (level) {
        case 'info':
            if (!isTest && isDevelopment) {
                console.info(message, formattedPayload);
            }
            break;
        case 'warn':
            if (!isTest) {
                console.warn(message, formattedPayload);
            }
            break;
        case 'error':
            console.error(message, formattedPayload);
            break;
        default:
            break;
    }
};

export const logger = {
    info(message: string, context?: LogContext): void {
        logWithLevel('info', message, context);
    },
    warn(message: string, context?: LogContext): void {
        logWithLevel('warn', message, context);
    },
    error(message: string, error?: unknown, context?: LogContext): void {
        const payload: LogContext = {
            ...normalizeContext(context),
            ...(error !== undefined ? serializeError(error) : {}),
        };

        logWithLevel('error', message, payload);
    },
};

export type { LogContext };
