/**
 * PKCE (Proof Key for Code Exchange) Utilities
 *
 * Implements RFC 7636 for enhanced OAuth 2.0 security
 * https://datatracker.ietf.org/doc/html/rfc7636
 */

export interface PKCEPair {
    codeVerifier: string;
    codeChallenge: string;
    codeChallengeMethod: 'S256' | 'plain';
}

/**
 * Generate a cryptographically secure random code verifier
 * Must be between 43-128 characters, using unreserved characters
 */
export function generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return base64UrlEncode(array);
}

/**
 * Generate code challenge from verifier using SHA-256
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return base64UrlEncode(new Uint8Array(hash));
}

/**
 * Generate complete PKCE pair (verifier + challenge)
 */
export async function generatePKCE(): Promise<PKCEPair> {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    return {
        codeVerifier,
        codeChallenge,
        codeChallengeMethod: 'S256',
    };
}

/**
 * Base64 URL encoding (RFC 4648)
 * Converts byte array to base64url format
 */
export function base64UrlEncode(array: Uint8Array): string {
    return btoa(String.fromCharCode(...array))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

/**
 * Base64 URL decoding
 */
export function base64UrlDecode(str: string): Uint8Array {
    // Restore padding
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');

    // Decode
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

/**
 * Validate code verifier format
 */
export function isValidCodeVerifier(verifier: string): boolean {
    // Must be 43-128 characters
    if (verifier.length < 43 || verifier.length > 128) {
        return false;
    }

    // Must only contain unreserved characters
    const unreservedChars = /^[A-Za-z0-9\-._~]+$/;
    return unreservedChars.test(verifier);
}
