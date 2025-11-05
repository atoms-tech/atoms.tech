/**
 * Artifact Extraction Utilities
 * 
 * Client-side utilities for extracting and formatting artifacts from Claude responses.
 */

import type { Artifact } from '@/components/custom/AgentChat/ArtifactRenderer';

// Regex patterns for artifact detection
const ARTIFACT_PATTERN = /<artifact\s+type="([^"]+)"\s+title="([^"]+)"(?:\s+language="([^"]+)")?\s*>(.*?)<\/artifact>/gis;

const CODE_BLOCK_PATTERN = /```(\w+)\s+(?:\/\/|#)\s*artifact:\s*([^\n]+)\n(.*?)```/gis;

export interface ExtractedArtifacts {
    cleanedText: string;
    artifacts: Artifact[];
}

/**
 * Extract artifacts from text content
 */
export function extractArtifacts(text: string): ExtractedArtifacts {
    const artifacts: Artifact[] = [];
    let cleanedText = text;

    // Extract explicit artifact tags
    const artifactMatches = Array.from(text.matchAll(ARTIFACT_PATTERN));
    for (const match of artifactMatches) {
        const [, type, title, language, content] = match;
        
        const artifact: Artifact = {
            id: generateArtifactId(title),
            type: type as Artifact['type'],
            title,
            language: language || undefined,
            content: content.trim(),
            renderMode: getRenderMode(type as Artifact['type']),
            editable: true,
        };

        // Add type-specific metadata
        if (type === 'react') {
            artifact.framework = 'react';
            artifact.language = language || 'tsx';
        }

        artifacts.push(artifact);
    }

    // Extract code block artifacts
    const codeBlockMatches = Array.from(text.matchAll(CODE_BLOCK_PATTERN));
    for (const match of codeBlockMatches) {
        const [, language, title, content] = match;
        
        artifacts.push({
            id: generateArtifactId(title),
            type: 'code',
            title: title.trim(),
            language,
            content: content.trim(),
            renderMode: 'code',
            editable: true,
        });
    }

    // Remove artifact tags from text
    cleanedText = cleanedText.replace(ARTIFACT_PATTERN, '');
    cleanedText = cleanedText.replace(CODE_BLOCK_PATTERN, '');
    cleanedText = cleanedText.trim();

    return {
        cleanedText,
        artifacts,
    };
}

/**
 * Generate a unique artifact ID from title
 */
function generateArtifactId(title: string): string {
    const base = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    
    const hash = Math.random().toString(36).substring(2, 10);
    
    return `${base}-${hash}`;
}

/**
 * Get render mode for artifact type
 */
function getRenderMode(type: string): Artifact['renderMode'] {
    switch (type) {
        case 'react':
        case 'html':
            return 'preview';
        case 'mermaid':
            return 'diagram';
        case 'svg':
            return 'svg';
        default:
            return 'code';
    }
}

/**
 * Check if text contains artifacts
 */
export function hasArtifacts(text: string): boolean {
    return ARTIFACT_PATTERN.test(text) || CODE_BLOCK_PATTERN.test(text);
}

/**
 * Format artifact for display
 */
export function formatArtifactForDisplay(artifact: Artifact): Artifact {
    return {
        ...artifact,
        renderMode: artifact.renderMode || getRenderMode(artifact.type),
        editable: artifact.editable !== false,
    };
}

