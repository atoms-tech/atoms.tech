export interface ModelDisplayInfo {
    id: string;
    displayName: string;
    providerLabel?: string;
}

const MODEL_NAME_OVERRIDES: Record<string, string> = {
    'claude-sonnet-4-5@20250929': 'Claude Sonnet 4.5',
    'claude-haiku-4-5@20250929': 'Claude Haiku 4.5',
    'claude-3-5-sonnet-20241022': 'Claude 3.5 Sonnet',
    'claude-3-5-haiku-20241022': 'Claude 3.5 Haiku',
    'claude-3-opus-20240229': 'Claude 3 Opus',
    'gpt-4o': 'GPT-4o',
    'gpt-4o-mini': 'GPT-4o Mini',
    'gpt-4-turbo': 'GPT-4 Turbo',
    'gpt-3.5-turbo': 'GPT-3.5 Turbo',
    'gemini-2-5-pro': 'Gemini 2.5 Pro',
    'gemini-2-5-flash': 'Gemini 2.5 Flash',
};

const TOKEN_OVERRIDES: Record<string, string> = {
    gpt: 'GPT',
    claude: 'Claude',
    sonnet: 'Sonnet',
    haiku: 'Haiku',
    opus: 'Opus',
    flash: 'Flash',
    pro: 'Pro',
    mini: 'Mini',
    ultra: 'Ultra',
};

const PROVIDER_OVERRIDES: Record<string, string> = {
    anthropic: 'Anthropic',
    openai: 'OpenAI',
    google: 'Google',
    vertex: 'Google Vertex AI',
};

/**
 * Format a model identifier into a display-friendly name and provider label.
 */
export function formatModelDisplayName(modelId: string, ownedBy?: string): ModelDisplayInfo {
    if (!modelId) {
        return { id: modelId, displayName: modelId };
    }

    if (MODEL_NAME_OVERRIDES[modelId]) {
        return {
            id: modelId,
            displayName: MODEL_NAME_OVERRIDES[modelId],
            providerLabel: getProviderLabel(ownedBy),
        };
    }

    const baseId = modelId.split('@')[0];
    const sanitized = baseId.replace(/[:_]/g, '-');
    const dotted = sanitized.replace(/(\d)-(?=\d)/g, '$1.');

    const parts = dotted.split('-').filter(Boolean);
    const displayName = parts
        .map((part) => {
            const lower = part.toLowerCase();
            if (TOKEN_OVERRIDES[lower]) {
                return TOKEN_OVERRIDES[lower];
            }
            if (/^[a-z]{1}\d+[a-z]?$/i.test(part)) {
                return part.toUpperCase();
            }
            if (/^\d+(\.\d+)?$/.test(part)) {
                return part;
            }
            return lower.charAt(0).toUpperCase() + lower.slice(1);
        })
        .join(' ');

    return {
        id: modelId,
        displayName: displayName || modelId,
        providerLabel: getProviderLabel(ownedBy),
    };
}

function getProviderLabel(raw?: string): string | undefined {
    if (!raw) return undefined;
    const normalized = raw.trim().toLowerCase();
    return PROVIDER_OVERRIDES[normalized] || raw;
}
