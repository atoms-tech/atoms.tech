from google.adk.agents.llm_agent import Agent
from pydantic import BaseModel, Field
from google.adk.tools.mcp_tool.mcp_toolset import MCPToolset
from google.adk.tools.mcp_tool.mcp_session_manager import SseConnectionParams

BASE = "https://mcp.atoms.tech"
PATH = "/api/mcp"
TOKEN = ""

class StructuredRequirementOutput(BaseModel):
    ears: str = Field(description="enhanced and precise EARS format of the user's requirement")
    incose: str = Field(description="enhanced and precise INCOSE format of the user's requirement")


# tools = MCPToolset(
#         connection_params=SseConnectionParams( url=f"{BASE}{PATH}")
#     )
# print(tools)
root_agent = Agent(
    model='gemini-2.5-flash',
    name='root_agent',
    description='Agent to analyze raw user defined requirements and generate a structured requirements.',
    instruction='Given user\'s raw requirements and extracted text from documents, analyze the requirements and generate a structured requirements.',
    output_schema=StructuredRequirementOutput,
    tools=[],
)
