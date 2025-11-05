/**
 * MCP Services - Main Export
 *
 * Centralized export for all MCP (Model Context Protocol) services.
 * MCP servers handle their own OAuth - no centralized OAuth proxy needed.
 */

// Export Registry Services
export { registryClient } from './registry-client.service';
export { serverValidation } from './server-validation.service';
export { multiRegistryService } from './multi-registry.service';
export { curationEngine } from './curation-engine.service';

/**
 * Version information
 */
export const MCP_SERVICES_VERSION = '3.0.0'; // Updated for native MCP OAuth
