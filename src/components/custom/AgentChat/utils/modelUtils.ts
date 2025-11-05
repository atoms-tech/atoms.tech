export interface ModelDisplayInfo {
    id: string;
    displayName: string;
    providerLabel?: string;
}

const MODEL_NAME_OVERRIDES: Record<string, string> = {
    // Vertex AI Claude models (primary)
    'claude-sonnet-4-5@20250929': 'Sonnet 4.5',
    'claude-sonnet-4-5@20250929-1m': 'Sonnet 4.5 (Max)',
    'claude-haiku-4-5@20251001': 'Haiku 4.5',

    // Legacy models (for backwards compatibility)
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
    googlevertexai: 'Google Vertex AI',
    vertex: 'Google Vertex AI',
    vertexai: 'Google Vertex AI',
    meta: 'Meta',
    metaai: 'Meta AI',
    bedrock: 'Amazon Bedrock',
    amazonbedrock: 'Amazon Bedrock',
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

    const rawParts = dotted.split('-').filter(Boolean);
    const trimmedParts = [...rawParts];

    while (trimmedParts.length > 1 && /^\d{6,}$/.test(trimmedParts[trimmedParts.length - 1])) {
        trimmedParts.pop();
    }

    const displayTokens: string[] = [];
    for (let index = 0; index < trimmedParts.length; index += 1) {
        const part = trimmedParts[index];
        const next = trimmedParts[index + 1];

        if (/^\d+$/.test(part) && next && /^\d+$/.test(next) && next.length <= 2) {
            displayTokens.push(`${part}.${next}`);
            index += 1;
            continue;
        }

        displayTokens.push(formatToken(part));
    }

    const displayName = displayTokens.join(' ').trim();

    return {
        id: modelId,
        displayName: displayName || modelId,
        providerLabel: getProviderLabel(ownedBy),
    };
}

function getProviderLabel(raw?: string): string | undefined {
    if (!raw) return undefined;
    const cleaned = raw.replace(/[^A-Za-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!cleaned) return undefined;
    const normalized = cleaned.replace(/[^A-Za-z0-9]/g, '').toLowerCase();
    if (normalized && PROVIDER_OVERRIDES[normalized]) {
        return PROVIDER_OVERRIDES[normalized];
    }
    const dashed = cleaned.replace(/\s+/g, '-').toLowerCase();
    if (PROVIDER_OVERRIDES[dashed]) {
        return PROVIDER_OVERRIDES[dashed];
    }
    return cleaned.replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatToken(part: string): string {
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
}
