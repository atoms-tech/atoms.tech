/**
 * MCP Server Validation Service
 *
 * Validates server configurations and performs security checks
 * before installation.
 */

import { MCPRegistryServer } from './registry-client.service';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  securityRisks: SecurityRisk[];
}

export interface SecurityRisk {
  level: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  description: string;
  mitigation?: string;
}

export interface ServerCompatibility {
  compatible: boolean;
  platform: boolean;
  runtime: boolean;
  dependencies: boolean;
  issues: string[];
}

/**
 * Server Validation Service
 *
 * Validates MCP servers for security, compatibility, and compliance
 */
class ServerValidationService {
  /**
   * Validate a server configuration
   */
  validateServer(server: MCPRegistryServer): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const securityRisks: SecurityRisk[] = [];

    // Required fields validation
    this.validateRequiredFields(server, errors);

    // Transport validation
    this.validateTransport(server, errors, warnings);

    // Authentication validation
    this.validateAuthentication(server, errors, warnings);

    // Security risk assessment
    this.assessSecurityRisks(server, securityRisks);

    // Publisher validation
    this.validatePublisher(server, warnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      securityRisks,
    };
  }

  /**
   * Check server compatibility with current environment
   */
  checkCompatibility(server: MCPRegistryServer): ServerCompatibility {
    const issues: string[] = [];
    let platform = true;
    let runtime = true;
    let dependencies = true;

    // Check transport compatibility
    if (server.transport.type === 'stdio') {
      // STDIO requires Node.js runtime for NPX commands
      if (server.transport.command === 'npx') {
        if (typeof window !== 'undefined') {
          runtime = false;
          issues.push('STDIO servers with NPX cannot run in browser environment');
        }
      }
    }

    // Check authentication compatibility
    if (server.auth && server.auth.type !== 'none') {
      // Ensure OAuth provider is supported
      if (server.auth.type === 'oauth' && !server.auth.provider) {
        dependencies = false;
        issues.push('OAuth authentication requires a valid provider');
      }
    }

    // Platform-specific checks
    if (typeof window !== 'undefined') {
      // Browser environment
      if (server.transport.type === 'stdio') {
        platform = false;
        issues.push('STDIO transport not supported in browser');
      }
    }

    const compatible = platform && runtime && dependencies;

    return {
      compatible,
      platform,
      runtime,
      dependencies,
      issues,
    };
  }

  /**
   * Validate a server before installation
   */
  async validateForInstallation(
    server: MCPRegistryServer,
    installContext: {
      userId: string;
      organizationId?: string;
      scope: 'user' | 'organization';
    }
  ): Promise<ValidationResult> {
    const validation = this.validateServer(server);

    // Additional installation-specific checks
    // Note: OAuth servers may not always have a provider field in registry,
    // so we'll allow installation and handle provider configuration later
    // if (server.auth?.type === 'oauth' && !server.auth.provider) {
    //   validation.errors.push('OAuth server requires a configured provider');
    //   validation.valid = false;
    // }

    // Check compatibility
    // Note: Compatibility checks are warnings, not blockers for installation
    // Servers can be installed even if they have compatibility warnings
    const compatibility = this.checkCompatibility(server);
    if (!compatibility.compatible) {
      compatibility.issues.forEach(issue => {
        validation.warnings.push(issue);
      });
    }

    // Scope-specific validation
    if (installContext.scope === 'organization' && !installContext.organizationId) {
      validation.errors.push('Organization ID required for organization-scoped installation');
      validation.valid = false;
    }

    return validation;
  }

  /**
   * Validate required fields
   */
  private validateRequiredFields(server: MCPRegistryServer, errors: string[]): void {
    if (!server.namespace) {
      errors.push('Server namespace is required');
    }

    if (!server.name) {
      errors.push('Server name is required');
    }

    // Description is optional in database schema (can be NULL)
    // if (!server.description) {
    //   errors.push('Server description is required');
    // }

    // Publisher is optional - can be stored in metadata
    // if (!server.publisher) {
    //   errors.push('Server publisher is required');
    // }

    if (!server.transport) {
      errors.push('Server transport configuration is required');
    }
  }

  /**
   * Validate transport configuration
   */
  private validateTransport(
    server: MCPRegistryServer,
    errors: string[],
    warnings: string[]
  ): void {
    const { transport } = server;

    if (!transport.type) {
      errors.push('Transport type is required');
      return;
    }

    switch (transport.type) {
      case 'stdio':
        // STDIO command is preferred but not strictly required (can be configured later)
        if (!transport.command) {
          warnings.push('STDIO transport command not specified - may need manual configuration');
        }
        // Warn about STDIO limitations
        warnings.push('STDIO transport may have limited compatibility in browser environments');
        break;

      case 'sse':
      case 'http':
        if (!transport.url) {
          errors.push(`${transport.type.toUpperCase()} transport requires a URL`);
        } else {
          // Validate URL format
          try {
            new URL(transport.url);
          } catch {
            errors.push(`Invalid transport URL: ${transport.url}`);
          }

          // Warn about HTTPS in production (but don't block installation)
          if (
            process.env.NODE_ENV === 'production' &&
            !transport.url.startsWith('https://')
          ) {
            warnings.push('Production servers should use HTTPS for security');
          }
        }
        break;

      default:
        errors.push(`Unsupported transport type: ${transport.type}`);
    }
  }

  /**
   * Validate authentication configuration
   */
  private validateAuthentication(
    server: MCPRegistryServer,
    errors: string[],
    warnings: string[]
  ): void {
    if (!server.auth) {
      warnings.push('Server does not specify authentication requirements');
      return;
    }

    const { auth } = server;

    switch (auth.type) {
      case 'oauth':
        // OAuth provider may be configured later, so this is a warning, not an error
        if (!auth.provider) {
          warnings.push('OAuth provider not specified - may need manual configuration');
        }
        if (!auth.scopes || auth.scopes.length === 0) {
          warnings.push('OAuth server does not specify required scopes');
        }
        break;

      case 'api-key':
      case 'bearer':
        warnings.push(`${auth.type} authentication requires manual credential configuration`);
        break;

      case 'none':
        // No validation needed
        break;

      default:
        warnings.push(`Unknown authentication type: ${auth.type}`);
    }
  }

  /**
   * Assess security risks
   */
  private assessSecurityRisks(
    server: MCPRegistryServer,
    risks: SecurityRisk[]
  ): void {
    // Unverified publisher risk
    if (!server.publisherVerified) {
      risks.push({
        level: 'medium',
        category: 'Publisher Trust',
        description: 'Publisher is not verified',
        mitigation: 'Review server code and permissions before installation',
      });
    }

    // STDIO command execution risk
    if (server.transport.type === 'stdio') {
      risks.push({
        level: 'medium',
        category: 'Code Execution',
        description: 'STDIO servers execute arbitrary commands on your system',
        mitigation: 'Review the command and arguments before installation',
      });
    }

    // Broad OAuth scopes risk
    if (server.auth?.type === 'oauth' && server.auth.scopes) {
      const broadScopes = ['admin', 'write', 'delete', 'full'];
      const hasBroadScope = server.auth.scopes.some(scope =>
        broadScopes.some(broad => scope.toLowerCase().includes(broad))
      );

      if (hasBroadScope) {
        risks.push({
          level: 'high',
          category: 'Permissions',
          description: 'Server requests broad OAuth permissions',
          mitigation: 'Review requested scopes and ensure they are necessary',
        });
      }
    }

    // No authentication risk
    if (!server.auth || server.auth.type === 'none') {
      if (server.transport.type !== 'stdio') {
        risks.push({
          level: 'low',
          category: 'Authentication',
          description: 'Server does not require authentication',
          mitigation: 'Ensure the server does not handle sensitive data',
        });
      }
    }

    // Outdated server risk
    if (server.lastUpdated) {
      const daysSinceUpdate = this.getDaysSinceUpdate(server.lastUpdated);
      if (daysSinceUpdate > 365) {
        risks.push({
          level: 'medium',
          category: 'Maintenance',
          description: `Server has not been updated in ${Math.floor(daysSinceUpdate / 30)} months`,
          mitigation: 'Check for known issues and consider alternatives',
        });
      }
    }
  }

  /**
   * Validate publisher
   */
  private validatePublisher(server: MCPRegistryServer, warnings: string[]): void {
    // Check for missing repository
    if (!server.repository) {
      warnings.push('Server does not specify a source code repository');
    }

    // Check for missing license
    if (!server.license) {
      warnings.push('Server does not specify a license');
    }

    // Check for missing homepage
    if (!server.homepage) {
      warnings.push('Server does not specify a homepage or documentation');
    }
  }

  /**
   * Calculate days since last update
   */
  private getDaysSinceUpdate(lastUpdated: string): number {
    const now = new Date();
    const updated = new Date(lastUpdated);
    const diff = now.getTime() - updated.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Get security risk level summary
   */
  getSecurityRiskLevel(risks: SecurityRisk[]): 'safe' | 'low' | 'medium' | 'high' | 'critical' {
    if (risks.length === 0) return 'safe';

    const hasCritical = risks.some(r => r.level === 'critical');
    if (hasCritical) return 'critical';

    const hasHigh = risks.some(r => r.level === 'high');
    if (hasHigh) return 'high';

    const hasMedium = risks.some(r => r.level === 'medium');
    if (hasMedium) return 'medium';

    return 'low';
  }
}

// Export singleton instance
export const serverValidation = new ServerValidationService();
