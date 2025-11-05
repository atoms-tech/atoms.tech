/**
 * MCP Components
 *
 * Barrel exports for MCP-related components
 * OAuth now handled by atomsAgent FastMCP proxy
 */

// Marketplace components
export { ServerCard } from './ServerCard';
export { ServerDetailModal } from './ServerDetailModal';
export { MCPServerConfigDialog } from './MCPServerConfigDialog';
export { EnhancedMarketplace } from './EnhancedMarketplace';

// Panel components
export { MCPPanel } from './MCPPanel';
export { InstalledServersView } from './InstalledServersView';
export { MCPSystemSettings } from './MCPSystemSettings';
export { MCPProfiles } from './MCPProfiles';

// Backwards compatibility aliases
export { EnhancedMarketplace as MCPTabs } from './EnhancedMarketplace';
export { EnhancedMarketplace as MarketplaceTabs } from './EnhancedMarketplace';
export { EnhancedMarketplace as ServerMarketplace } from './EnhancedMarketplace';
