# atomsAgent MCP Serialization Fix

## Problem

The atomsAgent backend is crashing with:
```
TypeError: Object of type FastMCP is not JSON serializable
```

This occurs in `claude_agent_sdk/_internal/transport/subprocess_cli.py` at line 169:
```python
json.dumps({"mcpServers": servers_for_cli})
```

## Root Cause

The MCP servers configuration contains `FastMCP` objects which cannot be directly serialized to JSON. The Claude Agent SDK expects a dictionary/JSON-serializable format, not FastMCP instances.

## Solution

The atomsAgent code needs to be modified to convert FastMCP objects to JSON-serializable dictionaries before passing them to the Claude Agent SDK.

### Location

File: `atomsAgent/services/claude_client.py` (or wherever MCP servers are configured)

### Fix

**Before:**
```python
# Passing FastMCP objects directly
servers_for_cli = {
    "server_name": fastmcp_instance  # ❌ Not JSON serializable
}
```

**After:**
```python
# Convert FastMCP to JSON-serializable config
servers_for_cli = {}
for name, server in mcp_servers.items():
    if isinstance(server, FastMCP):
        # Extract the configuration from FastMCP
        servers_for_cli[name] = {
            "command": server.command if hasattr(server, 'command') else "python",
            "args": server.args if hasattr(server, 'args') else [],
            "env": server.env if hasattr(server, 'env') else {}
        }
    elif isinstance(server, dict):
        # Already a dict, use as-is
        servers_for_cli[name] = server
    else:
        # Convert to dict representation
        servers_for_cli[name] = {
            "command": str(server),
            "args": [],
            "env": {}
        }
```

## Alternative Solution: Use MCP Server Registry Format

If the FastMCP objects are coming from the database, ensure they're being converted to the proper format:

```python
def serialize_mcp_server(server):
    """Convert MCP server to JSON-serializable format"""
    if isinstance(server, dict):
        return server
    
    # For FastMCP or other objects
    config = {
        "command": getattr(server, 'command', 'python'),
        "args": getattr(server, 'args', []),
        "env": getattr(server, 'env', {})
    }
    
    # Add transport-specific config
    if hasattr(server, 'transport'):
        if server.transport == 'stdio':
            config['transport'] = 'stdio'
        elif server.transport == 'sse':
            config['transport'] = 'sse'
            config['url'] = getattr(server, 'url', '')
    
    return config

# Usage
servers_for_cli = {
    name: serialize_mcp_server(server)
    for name, server in mcp_servers.items()
}
```

## Database Schema Fix

Additionally, there's a database schema mismatch. The error shows:
```
column mcp_servers.is_enabled does not exist
Hint: Perhaps you meant to reference the column "mcp_servers.enabled"
```

### Fix in atomsAgent

Find any code querying `mcp_servers.is_enabled` and change to `mcp_servers.enabled`:

**Before:**
```python
query = supabase.table('mcp_servers').select('*').eq('is_enabled', True)
```

**After:**
```python
query = supabase.table('mcp_servers').select('*').eq('enabled', True)
```

## Testing

After applying the fix:

1. Restart atomsAgent:
   ```bash
   # In atomsAgent directory
   pkill -f atomsAgent
   python -m atomsAgent
   ```

2. Test chat streaming:
   ```bash
   cd atoms.tech
   npm run dev
   ```

3. Send a message in the chat interface

4. Verify no errors in atomsAgent logs

## Expected Behavior

- ✅ No `TypeError: Object of type FastMCP is not JSON serializable`
- ✅ No `column mcp_servers.is_enabled does not exist` errors
- ✅ Chat streaming works smoothly
- ✅ MCP tools are available to the agent

## Files to Check in atomsAgent

1. `atomsAgent/services/claude_client.py` - MCP server configuration
2. `atomsAgent/services/mcp_manager.py` - MCP server loading
3. `atomsAgent/api/routes/mcp.py` - MCP API endpoints
4. Any file that queries `mcp_servers` table

## Quick Search Commands

```bash
# Find is_enabled usage
cd /path/to/atomsAgent
grep -r "is_enabled" --include="*.py"

# Find FastMCP usage
grep -r "FastMCP" --include="*.py"

# Find mcp_servers queries
grep -r "mcp_servers" --include="*.py"
```

## Notes

- The atomsAgent codebase is located outside of this repository
- You'll need to apply these fixes in the atomsAgent Python package
- After fixing, consider adding type hints and validation to prevent this issue

