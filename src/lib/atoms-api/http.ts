export function getBackendBaseUrl(): string | null {
    const url =
        process.env.NEXT_PUBLIC_ATOMS_BACKEND_URL || process.env.ATOMS_BACKEND_URL || '';
    return url ? url.replace(/\/$/, '') : null;
}

type QueryScalar = string | number | boolean;
type QueryValue = QueryScalar | QueryScalar[] | null | undefined;

export async function http<T = unknown>(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    path: string,
    options: {
        query?: Record<string, QueryValue>;
        body?: unknown;
        headers?: Record<string, string>;
    } = {},
): Promise<T> {
    const base = getBackendBaseUrl();
    if (!base) throw new Error('Backend base URL not configured');
    const url = new URL(base + path);
    if (options.query) {
        for (const [k, v] of Object.entries(options.query)) {
            if (v === undefined || v === null) continue;
            if (Array.isArray(v))
                (v as QueryScalar[]).forEach((vi) =>
                    url.searchParams.append(k, String(vi)),
                );
            else url.searchParams.set(k, String(v as QueryScalar));
        }
    }
    const resInit: RequestInit = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        },
        credentials: 'include',
    };
    if (method !== 'GET' && options.body !== undefined) {
        resInit.body = JSON.stringify(options.body);
    }
    const res = await fetch(url.toString(), resInit);
    if (res.status === 204) return undefined as unknown as T;
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const message = (data && (data.message || data.error)) || `HTTP ${res.status}`;
        throw new Error(message);
    }
    return data as T;
}
