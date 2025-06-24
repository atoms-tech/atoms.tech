import type {
    RequirementPattern,
    DetectedRequirementMatch,
    LabelParserResult,
    AutoDetectionConfig,
} from '@/types/diagram-element-links.types';
import type { Requirement } from '@/types/base/requirements.types';

// Default requirement patterns for auto-detection
export const DEFAULT_REQUIREMENT_PATTERNS: RequirementPattern[] = [
    // Standard requirement ID patterns
    {
        pattern: /\b(REQ|REQUIREMENT)[-_\s]*(\d{3,})\b/gi,
        type: 'requirement_id',
        confidence: 0.9,
    },
    {
        pattern: /\b(R|RQ)[-_\s]*(\d{2,})\b/gi,
        type: 'requirement_id',
        confidence: 0.8,
    },
    // Functional requirement patterns
    {
        pattern: /\b(FR|FUNC|FUNCTIONAL)[-_\s]*(\d{2,})\b/gi,
        type: 'requirement_id',
        confidence: 0.85,
    },
    // Non-functional requirement patterns
    {
        pattern: /\b(NFR|NON[-_\s]*FUNC|NONFUNCTIONAL)[-_\s]*(\d{2,})\b/gi,
        type: 'requirement_id',
        confidence: 0.85,
    },
    // User story patterns
    {
        pattern: /\b(US|USER[-_\s]*STORY|STORY)[-_\s]*(\d{2,})\b/gi,
        type: 'requirement_id',
        confidence: 0.8,
    },
    // Epic patterns
    {
        pattern: /\b(EP|EPIC)[-_\s]*(\d{2,})\b/gi,
        type: 'requirement_id',
        confidence: 0.75,
    },
    // Feature patterns
    {
        pattern: /\b(FEAT|FEATURE)[-_\s]*(\d{2,})\b/gi,
        type: 'requirement_id',
        confidence: 0.75,
    },
    // Generic ID patterns with prefixes
    {
        pattern: /\b([A-Z]{2,4})[-_\s]*(\d{2,})\b/gi,
        type: 'requirement_id',
        confidence: 0.6,
    },
    // Requirement keywords
    {
        pattern: /\b(shall|must|should|will|may|can)\s+\w+/gi,
        type: 'keyword',
        confidence: 0.4,
    },
    // Common requirement phrases
    {
        pattern: /\b(the system|user|application|software)\s+(shall|must|should|will)\b/gi,
        type: 'keyword',
        confidence: 0.5,
    },
];

// Default auto-detection configuration
export const DEFAULT_AUTO_DETECTION_CONFIG: AutoDetectionConfig = {
    enabled: true,
    patterns: DEFAULT_REQUIREMENT_PATTERNS,
    minConfidence: 0.6,
    autoLinkThreshold: 0.8,
    showSuggestions: true,
};

/**
 * Parse text from diagram elements to detect potential requirement references
 */
export function parseElementText(
    elementId: string,
    elementText: string,
    patterns: RequirementPattern[] = DEFAULT_REQUIREMENT_PATTERNS
): LabelParserResult {
    const matches: DetectedRequirementMatch[] = [];

    // Apply each pattern to the text
    patterns.forEach(pattern => {
        const regex = new RegExp(pattern.pattern.source, pattern.pattern.flags);
        let match;

        while ((match = regex.exec(elementText)) !== null) {
            matches.push({
                text: match[0],
                pattern,
                confidence: pattern.confidence,
                startIndex: match.index,
                endIndex: match.index + match[0].length,
            });
        }
    });

    // Sort matches by confidence and position
    matches.sort((a, b) => {
        if (a.confidence !== b.confidence) {
            return b.confidence - a.confidence;
        }
        return a.startIndex - b.startIndex;
    });

    return {
        elementId,
        elementText,
        matches,
        suggestedLinks: [], // Will be populated by matchWithRequirements
    };
}

/**
 * Match detected patterns with actual requirements from the database
 */
export function matchWithRequirements(
    parserResult: LabelParserResult,
    requirements: Requirement[],
    config: AutoDetectionConfig = DEFAULT_AUTO_DETECTION_CONFIG
): LabelParserResult {
    const suggestedLinks: LabelParserResult['suggestedLinks'] = [];

    // Create lookup maps for efficient matching
    const requirementsByExternalId = new Map<string, Requirement>();
    const requirementsByName = new Map<string, Requirement>();
    const requirementsByKeywords = new Map<string, Requirement[]>();

    requirements.forEach(req => {
        if (req.external_id) {
            requirementsByExternalId.set(req.external_id.toLowerCase(), req);
        }
        
        requirementsByName.set(req.name.toLowerCase(), req);

        // Index by keywords in name and description
        const keywords = extractKeywords(req.name + ' ' + (req.description || ''));
        keywords.forEach(keyword => {
            if (!requirementsByKeywords.has(keyword)) {
                requirementsByKeywords.set(keyword, []);
            }
            requirementsByKeywords.get(keyword)!.push(req);
        });
    });

    // Match each detected pattern
    parserResult.matches.forEach(match => {
        const matchedRequirements = findMatchingRequirements(
            match,
            requirementsByExternalId,
            requirementsByName,
            requirementsByKeywords
        );

        matchedRequirements.forEach(({ requirement, confidence, reason }) => {
            // Check if this requirement is already suggested
            const existingSuggestion = suggestedLinks.find(
                link => link.requirementId === requirement.id
            );

            if (existingSuggestion) {
                // Update confidence if this match is better
                if (confidence > existingSuggestion.confidence) {
                    existingSuggestion.confidence = confidence;
                    existingSuggestion.reason = reason;
                }
            } else {
                suggestedLinks.push({
                    requirementId: requirement.id,
                    confidence,
                    reason,
                });
            }
        });
    });

    // Filter by minimum confidence and sort
    const filteredSuggestions = suggestedLinks
        .filter(link => link.confidence >= config.minConfidence)
        .sort((a, b) => b.confidence - a.confidence);

    return {
        ...parserResult,
        suggestedLinks: filteredSuggestions,
    };
}

/**
 * Find requirements that match a detected pattern
 */
function findMatchingRequirements(
    match: DetectedRequirementMatch,
    requirementsByExternalId: Map<string, Requirement>,
    requirementsByName: Map<string, Requirement>,
    requirementsByKeywords: Map<string, Requirement[]>
): Array<{ requirement: Requirement; confidence: number; reason: string }> {
    const results: Array<{ requirement: Requirement; confidence: number; reason: string }> = [];
    const matchText = match.text.toLowerCase();

    // Direct external ID match
    if (match.pattern.type === 'requirement_id') {
        // Extract the ID part from the match
        const idMatch = matchText.match(/(\d+)/);
        if (idMatch) {
            const idNumber = idMatch[1];
            
            // Try various ID formats
            const possibleIds = [
                matchText.replace(/[-_\s]+/g, ''),
                matchText.replace(/[-_\s]+/g, '-'),
                idNumber,
                `req-${idNumber}`,
                `requirement-${idNumber}`,
                `r-${idNumber}`,
                `fr-${idNumber}`,
                `nfr-${idNumber}`,
            ];

            possibleIds.forEach(possibleId => {
                const requirement = requirementsByExternalId.get(possibleId);
                if (requirement) {
                    results.push({
                        requirement,
                        confidence: match.confidence,
                        reason: `External ID match: ${possibleId}`,
                    });
                }
            });
        }
    }

    // Name-based matching
    const requirement = requirementsByName.get(matchText);
    if (requirement) {
        results.push({
            requirement,
            confidence: match.confidence * 0.9, // Slightly lower confidence for name matches
            reason: `Name match: ${matchText}`,
        });
    }

    // Keyword-based matching
    if (match.pattern.type === 'keyword') {
        const keywords = extractKeywords(matchText);
        keywords.forEach(keyword => {
            const matchingRequirements = requirementsByKeywords.get(keyword) || [];
            matchingRequirements.forEach(req => {
                results.push({
                    requirement: req,
                    confidence: match.confidence * 0.7, // Lower confidence for keyword matches
                    reason: `Keyword match: ${keyword}`,
                });
            });
        });
    }

    return results;
}

/**
 * Extract meaningful keywords from text
 */
function extractKeywords(text: string): string[] {
    const stopWords = new Set([
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
        'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
        'will', 'would', 'could', 'should', 'may', 'might', 'can', 'shall', 'must',
    ]);

    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2 && !stopWords.has(word))
        .filter((word, index, arr) => arr.indexOf(word) === index); // Remove duplicates
}

/**
 * Batch process multiple elements for auto-detection
 */
export function batchParseElements(
    elements: Array<{ id: string; text?: string; type?: string }>,
    requirements: Requirement[],
    config: AutoDetectionConfig = DEFAULT_AUTO_DETECTION_CONFIG
): LabelParserResult[] {
    return elements
        .filter(element => element.text && element.text.trim().length > 0)
        .map(element => {
            const parserResult = parseElementText(element.id, element.text!, config.patterns);
            return matchWithRequirements(parserResult, requirements, config);
        })
        .filter(result => result.suggestedLinks.length > 0);
}

/**
 * Get auto-link suggestions that meet the threshold
 */
export function getAutoLinkSuggestions(
    parserResults: LabelParserResult[],
    autoLinkThreshold: number = 0.8
): Array<{ elementId: string; requirementId: string; confidence: number; reason: string }> {
    const suggestions: Array<{ elementId: string; requirementId: string; confidence: number; reason: string }> = [];

    parserResults.forEach(result => {
        result.suggestedLinks.forEach(link => {
            if (link.confidence >= autoLinkThreshold) {
                suggestions.push({
                    elementId: result.elementId,
                    requirementId: link.requirementId,
                    confidence: link.confidence,
                    reason: link.reason,
                });
            }
        });
    });

    return suggestions.sort((a, b) => b.confidence - a.confidence);
}
