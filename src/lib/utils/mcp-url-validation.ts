/**
 * MCP Server URL Validation Utilities
 * 
 * Validates MCP server URLs to ensure they point to actual MCP endpoints
 * and not to GitHub repositories or other invalid targets
 */

export interface URLValidationResult {
    valid: boolean;
    error?: string;
    warning?: string;
    normalizedUrl?: string;
}

/**
 * Validate an MCP server URL
 * 
 * @param url - The URL to validate
 * @param transportType - The transport type (http, sse, stdio)
 * @returns Validation result with error/warning messages
 */
export function validateMCPServerURL(
    url: string | null | undefined,
    transportType: 'http' | 'sse' | 'stdio'
): URLValidationResult {
    // STDIO doesn't need URL validation
    if (transportType === 'stdio') {
        return { valid: true };
    }

    // URL is required for HTTP/SSE
    if (!url || url.trim() === '') {
        return {
            valid: false,
            error: `URL is required for ${transportType.toUpperCase()} transport`,
        };
    }

    const trimmedUrl = url.trim();

    // Check for placeholder URLs
    if (trimmedUrl === '{}' || trimmedUrl === '{url}' || trimmedUrl === 'undefined' || trimmedUrl === 'null') {
        return {
            valid: false,
            error: 'URL is a placeholder. Please provide a valid MCP server endpoint URL.',
        };
    }

    // Validate URL format
    let parsedUrl: URL;
    try {
        parsedUrl = new URL(trimmedUrl);
    } catch {
        return {
            valid: false,
            error: 'Invalid URL format. Please provide a valid HTTP/HTTPS URL.',
        };
    }

    // Check protocol
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return {
            valid: false,
            error: `Invalid protocol: ${parsedUrl.protocol}. Only HTTP and HTTPS are supported.`,
        };
    }

    // Check for GitHub repository URLs
    if (isGitHubRepositoryURL(parsedUrl)) {
        return {
            valid: false,
            error: 'This URL points to a GitHub repository, not an MCP server endpoint. Please provide the actual server URL (e.g., https://api.example.com/mcp/).',
        };
    }

    // Check for other code hosting platforms
    if (isCodeHostingURL(parsedUrl)) {
        return {
            valid: false,
            error: 'This URL points to a code repository, not an MCP server endpoint. Please provide the actual server URL.',
        };
    }

    // Warn about localhost in production
    if (process.env.NODE_ENV === 'production' && isLocalhostURL(parsedUrl)) {
        return {
            valid: true,
            warning: 'Localhost URLs will not work in production. Use a publicly accessible URL.',
            normalizedUrl: trimmedUrl,
        };
    }

    // Warn about HTTP in production
    if (process.env.NODE_ENV === 'production' && parsedUrl.protocol === 'http:') {
        return {
            valid: true,
            warning: 'HTTP URLs are not secure. Consider using HTTPS in production.',
            normalizedUrl: trimmedUrl,
        };
    }

    // Normalize URL (remove trailing slash if present)
    const normalizedUrl = trimmedUrl.endsWith('/') ? trimmedUrl.slice(0, -1) : trimmedUrl;

    return {
        valid: true,
        normalizedUrl,
    };
}

/**
 * Check if URL points to a GitHub repository
 */
function isGitHubRepositoryURL(url: URL): boolean {
    if (url.hostname !== 'github.com') {
        return false;
    }

    // GitHub repo URLs: github.com/owner/repo
    // MCP endpoints would be: api.github.com or custom domains
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    // If it has exactly 2 path parts (owner/repo), it's a repository
    if (pathParts.length === 2) {
        return true;
    }

    // If it has more parts but doesn't look like an API endpoint
    if (pathParts.length > 2 && !url.pathname.includes('/api/')) {
        return true;
    }

    return false;
}

/**
 * Check if URL points to a code hosting platform
 */
function isCodeHostingURL(url: URL): boolean {
    const codeHostingDomains = [
        'gitlab.com',
        'bitbucket.org',
        'gitea.com',
        'codeberg.org',
        'sourceforge.net',
    ];

    return codeHostingDomains.some(domain => url.hostname.endsWith(domain));
}

/**
 * Check if URL is localhost
 */
function isLocalhostURL(url: URL): boolean {
    return ['localhost', '127.0.0.1', '0.0.0.0', '::1'].includes(url.hostname);
}

/**
 * Extract potential MCP endpoint from a GitHub repository URL
 * 
 * @param repoUrl - GitHub repository URL
 * @returns Suggested endpoint URL or null if can't determine
 */
export function suggestMCPEndpointFromRepo(repoUrl: string): string | null {
    try {
        const url = new URL(repoUrl);
        
        if (!isGitHubRepositoryURL(url)) {
            return null;
        }

        // Can't automatically determine the endpoint
        // User needs to check the repository's README or documentation
        return null;
    } catch {
        return null;
    }
}

