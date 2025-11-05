export interface OAuthProviderSummary {
  key: string;
  name: string;
  scopes: string[];
  uses_pkce: boolean;
  authorization_endpoint: string;
}

export interface OAuthTransaction {
  transaction_id: string;
  authorization_url: string | null;
  status: string;
  provider_key: string;
  error?: Record<string, unknown> | null;
}

export interface OAuthFlowOptions {
  providerKey: string;
  mcpNamespace: string;
  organizationId?: string;
  scopes?: string[];
  pollIntervalMs?: number;
  timeoutMs?: number;
  authMetadata?: Record<string, unknown>;
}

export interface OAuthFlowResult {
  status: 'authorized' | 'failed' | 'cancelled' | 'timeout';
  transaction?: OAuthTransaction;
  error?: string;
}

const DEFAULT_POLL_INTERVAL = 2000;
const DEFAULT_TIMEOUT = 5 * 60 * 1000; // 5 minutes

const delay = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    let timer: number | undefined;

    const cleanup = () => {
      if (timer !== undefined) {
        window.clearTimeout(timer);
        timer = undefined;
      }
      if (signal) {
        signal.removeEventListener('abort', onAbort);
      }
    };

    const onAbort = () => {
      cleanup();
      reject(new DOMException('Aborted', 'AbortError'));
    };

    timer = window.setTimeout(() => {
      cleanup();
      resolve();
    }, ms);

    if (signal) {
      signal.addEventListener('abort', onAbort);
    }
  });

async function fetchJSON<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  if (!response.ok) {
    let detail: unknown;
    try {
      detail = await response.json();
    } catch (error) {
      detail = await response.text();
    }
    throw new Error(
      `Request failed (${response.status}): ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`,
    );
  }
  return response.json() as Promise<T>;
}

export async function fetchOAuthProviders(): Promise<OAuthProviderSummary[]> {
  const data = await fetchJSON<{ providers: OAuthProviderSummary[] }>(
    '/api/mcp/oauth/providers',
  );
  return data.providers;
}

export async function startOAuthTransaction(options: OAuthFlowOptions): Promise<OAuthTransaction> {
  const body = {
    providerKey: options.providerKey,
    mcpNamespace: options.mcpNamespace,
    organizationId: options.organizationId,
    scopes: options.scopes,
    authMetadata: options.authMetadata,
  };
  const data = await fetchJSON<{ transaction: OAuthTransaction }>(
    '/api/mcp/oauth/start',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
  return data.transaction;
}

export async function fetchOAuthStatus(transactionId: string): Promise<OAuthTransaction> {
  const data = await fetchJSON<{ transaction: OAuthTransaction }>(
    `/api/mcp/oauth/status/${encodeURIComponent(transactionId)}`,
  );
  return data.transaction;
}

function openPopup(url: string): Window | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const width = 480;
  const height = 720;
  const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
  const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2);

  const features = `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`;
  return window.open(url, 'atoms-mcp-oauth', features);
}

export async function runOAuthFlow(options: OAuthFlowOptions): Promise<OAuthFlowResult> {
  if (typeof window === 'undefined') {
    throw new Error('OAuth flow can only run in a browser context');
  }

  const transaction = await startOAuthTransaction(options);

  if (!transaction.authorization_url) {
    throw new Error('OAuth provider did not return an authorization URL');
  }

  const popup = openPopup(transaction.authorization_url);
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT;
  const pollInterval = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL;
  const abortController = new AbortController();

  let resolved = false;

  const cleanup = () => {
    if (resolved) return;
    abortController.abort();
    if (popup && !popup.closed) {
      popup.close();
    }
    window.removeEventListener('message', onMessage);
    window.clearTimeout(timeoutHandle);
  };

  const finalize = (result: OAuthFlowResult) => {
    if (!resolved) {
      resolved = true;
      cleanup();
      finalResolve(result);
    }
  };

  const onMessage = (event: MessageEvent) => {
    if (!event.data || typeof event.data !== 'object') return;
    const payload = event.data as Record<string, unknown>;
    if (payload.provider !== options.providerKey || typeof payload.status !== 'string') {
      return;
    }

    if (payload.status === 'authorized') {
      fetchOAuthStatus(transaction.transaction_id)
        .then(current => finalize({ status: 'authorized', transaction: current }))
        .catch(() => finalize({ status: 'authorized', transaction }));
    } else if (payload.status === 'failed') {
      const errorMessage = payload.error ? JSON.stringify(payload.error) : 'OAuth flow failed';
      fetchOAuthStatus(transaction.transaction_id)
        .then(current => finalize({ status: 'failed', transaction: current, error: errorMessage }))
        .catch(() => finalize({ status: 'failed', transaction, error: errorMessage }));
    }
  };

  window.addEventListener('message', onMessage);

  const timeoutHandle = window.setTimeout(() => {
    finalize({ status: 'timeout', transaction, error: 'OAuth flow timed out' });
  }, timeoutMs);

  const pollLoop = async () => {
    try {
      while (!abortController.signal.aborted) {
        const current = await fetchOAuthStatus(transaction.transaction_id);
        if (current.status !== 'pending') {
          if (current.status === 'authorized') {
            finalize({ status: 'authorized', transaction: current });
          } else if (current.status === 'cancelled') {
            finalize({ status: 'cancelled', transaction: current });
          } else if (current.status === 'failed') {
            finalize({
              status: 'failed',
              transaction: current,
              error: current.error ? JSON.stringify(current.error) : 'OAuth flow failed',
            });
          }
          return;
        }
        await delay(pollInterval, abortController.signal);
      }
    } catch (error) {
      if (!abortController.signal.aborted) {
        finalize({
          status: 'failed',
          transaction,
          error: error instanceof Error ? error.message : 'Polling failed',
        });
      }
    }
  };

  let finalResolve: (value: OAuthFlowResult) => void;

  const resultPromise = new Promise<OAuthFlowResult>((resolve) => {
    finalResolve = resolve;
  });

  void pollLoop();

  // Handle popup being closed manually before completion
  const closeWatcher = window.setInterval(() => {
    if (popup && popup.closed) {
      window.clearInterval(closeWatcher);
      finalize({ status: 'cancelled', transaction, error: 'Popup closed by user' });
    }
  }, 500);

  resultPromise.finally(() => {
    window.clearInterval(closeWatcher);
  });

  return resultPromise;
}
