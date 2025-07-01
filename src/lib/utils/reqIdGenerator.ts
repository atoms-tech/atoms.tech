/**
 * Auto REQ-ID Generation Utility
 * Provides intelligent requirement ID generation with conflict resolution
 */

export interface ReqIdConfig {
  prefix: string;
  separator: string;
  numberLength: number;
  startNumber: number;
  includeCategory: boolean;
  categoryMap: Record<string, string>;
}

export interface ExistingRequirement {
  id: string;
  reqId: string;
  category?: string;
}

export interface GeneratedReqId {
  reqId: string;
  isUnique: boolean;
  suggestedAlternatives?: string[];
  category?: string;
}

export class ReqIdGenerator {
  private config: ReqIdConfig;
  private existingIds: Set<string>;

  constructor(config: Partial<ReqIdConfig> = {}) {
    this.config = {
      prefix: 'REQ',
      separator: '-',
      numberLength: 3,
      startNumber: 1,
      includeCategory: false,
      categoryMap: {
        functional: 'FUNC',
        'non-functional': 'NFUNC',
        business: 'BUS',
        technical: 'TECH',
        security: 'SEC',
        performance: 'PERF',
        usability: 'UX',
        interface: 'INT',
        data: 'DATA',
        system: 'SYS',
      },
      ...config,
    };
    this.existingIds = new Set();
  }

  /**
   * Set existing requirements to avoid ID conflicts
   */
  setExistingRequirements(requirements: ExistingRequirement[]): void {
    this.existingIds = new Set(requirements.map(req => req.reqId.toUpperCase()));
  }

  /**
   * Generate a new requirement ID
   */
  generateReqId(category?: string): GeneratedReqId {
    const baseId = this.buildBaseId(category);
    const reqId = this.findUniqueId(baseId);
    
    return {
      reqId,
      isUnique: !this.existingIds.has(reqId.toUpperCase()),
      category,
    };
  }

  /**
   * Generate multiple requirement IDs
   */
  generateBulkReqIds(count: number, category?: string): GeneratedReqId[] {
    const results: GeneratedReqId[] = [];
    
    for (let i = 0; i < count; i++) {
      const generated = this.generateReqId(category);
      results.push(generated);
      // Add to existing IDs to avoid duplicates in the same batch
      this.existingIds.add(generated.reqId.toUpperCase());
    }
    
    return results;
  }

  /**
   * Validate a requirement ID format
   */
  validateReqId(reqId: string): {
    isValid: boolean;
    errors: string[];
    suggestions?: string[];
  } {
    const errors: string[] = [];
    const upperReqId = reqId.toUpperCase();

    // Check format
    const expectedPattern = this.buildPattern();
    const regex = new RegExp(`^${expectedPattern}$`, 'i');
    
    if (!regex.test(reqId)) {
      errors.push(`ID format should match pattern: ${this.getPatternDescription()}`);
    }

    // Check for conflicts
    if (this.existingIds.has(upperReqId)) {
      errors.push('This ID already exists');
    }

    // Check length
    if (reqId.length > 50) {
      errors.push('ID is too long (maximum 50 characters)');
    }

    if (reqId.length < 3) {
      errors.push('ID is too short (minimum 3 characters)');
    }

    const suggestions = errors.length > 0 ? this.generateSuggestions(reqId) : undefined;

    return {
      isValid: errors.length === 0,
      errors,
      suggestions,
    };
  }

  /**
   * Get the next available number for a given prefix
   */
  getNextAvailableNumber(basePrefix: string): number {
    let number = this.config.startNumber;
    
    while (true) {
      const testId = `${basePrefix}${this.config.separator}${this.padNumber(number)}`;
      if (!this.existingIds.has(testId.toUpperCase())) {
        return number;
      }
      number++;
    }
  }

  /**
   * Parse an existing requirement ID to extract components
   */
  parseReqId(reqId: string): {
    prefix?: string;
    category?: string;
    number?: number;
    isValid: boolean;
  } {
    const parts = reqId.split(this.config.separator);
    
    if (parts.length < 2) {
      return { isValid: false };
    }

    const prefix = parts[0];
    const numberPart = parts[parts.length - 1];
    const number = parseInt(numberPart, 10);

    let category: string | undefined;
    if (this.config.includeCategory && parts.length === 3) {
      category = parts[1];
    }

    return {
      prefix,
      category,
      number: isNaN(number) ? undefined : number,
      isValid: !isNaN(number) && prefix.length > 0,
    };
  }

  /**
   * Get configuration for display purposes
   */
  getConfig(): ReqIdConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ReqIdConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get pattern description for user guidance
   */
  getPatternDescription(): string {
    if (this.config.includeCategory) {
      return `${this.config.prefix}${this.config.separator}[CATEGORY]${this.config.separator}[NUMBER]`;
    }
    return `${this.config.prefix}${this.config.separator}[NUMBER]`;
  }

  /**
   * Build base ID without number
   */
  private buildBaseId(category?: string): string {
    let baseId = this.config.prefix;
    
    if (this.config.includeCategory && category) {
      const categoryCode = this.config.categoryMap[category.toLowerCase()] || category.toUpperCase();
      baseId += `${this.config.separator}${categoryCode}`;
    }
    
    return baseId;
  }

  /**
   * Find a unique ID by incrementing the number
   */
  private findUniqueId(baseId: string): string {
    const number = this.getNextAvailableNumber(baseId);
    return `${baseId}${this.config.separator}${this.padNumber(number)}`;
  }

  /**
   * Pad number with leading zeros
   */
  private padNumber(number: number): string {
    return number.toString().padStart(this.config.numberLength, '0');
  }

  /**
   * Build regex pattern for validation
   */
  private buildPattern(): string {
    let pattern = this.config.prefix;
    
    if (this.config.includeCategory) {
      pattern += `\\${this.config.separator}[A-Z]+`;
    }
    
    pattern += `\\${this.config.separator}\\d{${this.config.numberLength},}`;
    
    return pattern;
  }

  /**
   * Generate suggestions for invalid IDs
   */
  private generateSuggestions(invalidId: string): string[] {
    const suggestions: string[] = [];
    
    // Try to fix common issues
    const cleaned = invalidId.replace(/[^A-Za-z0-9-_]/g, '').toUpperCase();
    
    // Suggest with proper prefix
    if (!cleaned.startsWith(this.config.prefix)) {
      const generated = this.generateReqId();
      suggestions.push(generated.reqId);
    }
    
    // Suggest alternatives
    for (let i = 0; i < 3; i++) {
      const generated = this.generateReqId();
      if (!suggestions.includes(generated.reqId)) {
        suggestions.push(generated.reqId);
      }
    }
    
    return suggestions.slice(0, 3);
  }
}

/**
 * Default instance for common usage
 */
export const defaultReqIdGenerator = new ReqIdGenerator();

/**
 * Utility functions for common operations
 */
export const reqIdUtils = {
  /**
   * Quick generation with default settings
   */
  generate: (category?: string) => defaultReqIdGenerator.generateReqId(category),
  
  /**
   * Quick validation with default settings
   */
  validate: (reqId: string) => defaultReqIdGenerator.validateReqId(reqId),
  
  /**
   * Set existing requirements for conflict checking
   */
  setExisting: (requirements: ExistingRequirement[]) => 
    defaultReqIdGenerator.setExistingRequirements(requirements),
  
  /**
   * Parse requirement ID
   */
  parse: (reqId: string) => defaultReqIdGenerator.parseReqId(reqId),
};
