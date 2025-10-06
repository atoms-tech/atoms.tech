from google.adk.tools.mcp_tool.mcp_session_manager import SseConnectionParams
from google.adk.tools.mcp_tool.mcp_toolset import MCPToolset
from google.adk.agents import LlmAgent

### Making MCP Toolset whihch will be available to agent as native tools

### TODO : Add auth tokens

mcp_toolset = MCPToolset(
    connection_params=SseConnectionParams(
        url="https://mcp.atoms.tech/api/mcp",
        headers={"Authorization": "<YOUR_TOKEN_IF_NEEDED>"}
    )
)

### Making LLM Agent with MCP Toolset
req_agent = LlmAgent(
    name="requirements_analyzer",
    model="gemini-2.0-flash",
    description="An agent that analyzes requirements against document content for completeness and clarity.",
    instruction="Use the given tools to analyze the requirements based on the provided document content. Provide a summary of findings and suggest improvements if necessary. If tools are not working just return simple analysis based on the input.",
    tools=[mcp_toolset],
)