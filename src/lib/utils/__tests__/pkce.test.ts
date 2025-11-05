import { describe, expect, it } from 'vitest';

import {
    base64UrlDecode,
    base64UrlEncode,
    generateCodeChallenge,
    generateCodeVerifier,
    generatePKCE,
    isValidCodeVerifier,
} from '../pkce';

describe('PKCE Utilities', () => {
    describe('generateCodeVerifier', () => {
        it('should generate a code verifier', () => {
            const verifier = generateCodeVerifier();
            expect(verifier).toBeDefined();
            expect(typeof verifier).toBe('string');
        });

        it('should generate verifier with correct length', () => {
            const verifier = generateCodeVerifier();
            expect(verifier.length).toBeGreaterThanOrEqual(43);
            expect(verifier.length).toBeLessThanOrEqual(128);
        });

        it('should generate unique verifiers', () => {
            const verifier1 = generateCodeVerifier();
            const verifier2 = generateCodeVerifier();
            expect(verifier1).not.toBe(verifier2);
        });

        it('should only contain valid characters', () => {
            const verifier = generateCodeVerifier();
            expect(verifier).toMatch(/^[A-Za-z0-9\-._~]+$/);
        });
    });

    describe('generateCodeChallenge', () => {
        it('should generate a code challenge from verifier', async () => {
            const verifier = generateCodeVerifier();
            const challenge = await generateCodeChallenge(verifier);
            expect(challenge).toBeDefined();
            expect(typeof challenge).toBe('string');
        });

        it('should generate consistent challenge for same verifier', async () => {
            const verifier = 'test-verifier-123';
            const challenge1 = await generateCodeChallenge(verifier);
            const challenge2 = await generateCodeChallenge(verifier);
            expect(challenge1).toBe(challenge2);
        });

        it('should generate different challenges for different verifiers', async () => {
            const verifier1 = 'test-verifier-1';
            const verifier2 = 'test-verifier-2';
            const challenge1 = await generateCodeChallenge(verifier1);
            const challenge2 = await generateCodeChallenge(verifier2);
            expect(challenge1).not.toBe(challenge2);
        });
    });

    describe('generatePKCE', () => {
        it('should generate complete PKCE pair', async () => {
            const pkce = await generatePKCE();
            expect(pkce).toBeDefined();
            expect(pkce.codeVerifier).toBeDefined();
            expect(pkce.codeChallenge).toBeDefined();
            expect(pkce.codeChallengeMethod).toBe('S256');
        });

        it('should generate valid verifier and challenge', async () => {
            const pkce = await generatePKCE();
            expect(isValidCodeVerifier(pkce.codeVerifier)).toBe(true);
            expect(pkce.codeChallenge.length).toBeGreaterThan(0);
        });
    });

    describe('base64UrlEncode', () => {
        it('should encode byte array to base64url', () => {
            const input = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
            const encoded = base64UrlEncode(input);
            expect(encoded).toBeDefined();
            expect(typeof encoded).toBe('string');
        });

        it('should not contain padding', () => {
            const input = new Uint8Array([72, 101, 108, 108, 111]);
            const encoded = base64UrlEncode(input);
            expect(encoded).not.toContain('=');
        });

        it('should use URL-safe characters', () => {
            const input = new Uint8Array(32).fill(255);
            const encoded = base64UrlEncode(input);
            expect(encoded).not.toContain('+');
            expect(encoded).not.toContain('/');
        });
    });

    describe('base64UrlDecode', () => {
        it('should decode base64url to byte array', () => {
            const input = 'SGVsbG8';
            const decoded = base64UrlDecode(input);
            expect(decoded).toBeInstanceOf(Uint8Array);
        });

        it('should correctly decode encoded data', () => {
            const original = new Uint8Array([72, 101, 108, 108, 111]);
            const encoded = base64UrlEncode(original);
            const decoded = base64UrlDecode(encoded);
            expect(decoded).toEqual(original);
        });
    });

    describe('isValidCodeVerifier', () => {
        it('should validate correct verifier', () => {
            const verifier = generateCodeVerifier();
            expect(isValidCodeVerifier(verifier)).toBe(true);
        });

        it('should reject verifier that is too short', () => {
            const verifier = 'short';
            expect(isValidCodeVerifier(verifier)).toBe(false);
        });

        it('should reject verifier that is too long', () => {
            const verifier = 'a'.repeat(129);
            expect(isValidCodeVerifier(verifier)).toBe(false);
        });

        it('should reject verifier with invalid characters', () => {
            const verifier = 'a'.repeat(43) + '!@#$';
            expect(isValidCodeVerifier(verifier)).toBe(false);
        });

        it('should accept verifier with valid special characters', () => {
            const verifier = 'a'.repeat(40) + '-._~';
            expect(isValidCodeVerifier(verifier)).toBe(true);
        });
    });
});

