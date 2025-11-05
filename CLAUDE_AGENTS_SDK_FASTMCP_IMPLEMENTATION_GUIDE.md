# Claude Agents SDK + FastMCP - Complete Implementation Guide

**Date:** 2025-11-05  
**Status:** Research Complete - Ready for Implementation  
**Based on:** Official Anthropic documentation + FastMCP 2.0 documentation

---

## 🎯 Executive Summary

This guide provides complete implementation details for:
1. **Claude Agents SDK** - Building autonomous agents with Claude
2. **FastMCP** - Building MCP servers and clients in Python
3. **Integration Patterns** - Combining both for production-ready agents

---

## 📚 Part 1: Claude Agents SDK Deep Dive

### Core Concept: The Agent Loop

Claude Code (now Claude Agent SDK) operates in a specific feedback loop:

```
gather context → take action → verify work → repeat
```

This loop is the foundation for all agent implementations.

### 1.1 Gathering Context

#### Agentic Search & File System

The file system represents information that can be pulled into the model's context.

**Key Insight:** Claude uses bash scripts like `grep` and `tail` to load large files into context.

**Example:**
```python
# Email agent storing conversations
# Structure: Conversations/
#   - user1_thread1.txt
#   - user2_thread1.txt
#   - ...

# Claude can search these with bash:
# grep -r "subject: meeting" Conversations/
```

**Best Practice:** Folder and file structure becomes a form of context engineering.

#### Semantic Search

- **When to use:** Need faster results or more variations
- **When NOT to use:** Start with agentic search first
- **Implementation:** Chunk context → embed as vectors → query vectors

**Recommendation:** Start with agentic search, add semantic search only if needed.

#### Subagents

**Two main benefits:**
1. **Parallelization:** Spin up multiple subagents for different tasks simultaneously
2. **Context Management:** Subagents use isolated context windows, only send relevant info back

**Example:**
```python
# Email agent with search subagents
@mcp.tool
async def search_emails(query: str, ctx: Context):
    # Spin off multiple search subagents in parallel
    subagent1 = await ctx.spawn_subagent("search inbox", query)
    subagent2 = await ctx.spawn_subagent("search sent", query)
    subagent3 = await ctx.spawn_subagent("search drafts", query)
    
    # Each returns only relevant excerpts, not full threads
    results = await asyncio.gather(subagent1, subagent2, subagent3)
    return combine_results(results)
```

#### Compaction

**Problem:** Agents running for long periods run out of context.

**Solution:** Claude Agent SDK's `compact` feature automatically summarizes previous messages when context limit approaches.

**Implementation:** Built on Claude Code's compact slash command.

### 1.2 Taking Action

#### Tools

**Key Principle:** Tools are prominent in Claude's context window, making them the primary actions Claude will consider.

**Best Practices:**
- Design tools to maximize context efficiency
- Tools should be primary actions you want your agent to take
- See Anthropic's blog: "Writing effective tools for agents – with agents"

**Example:**
```python
@mcp.tool
def fetch_inbox(limit: int = 50) -> list[dict]:
    """Fetch recent emails from inbox"""
    return get_emails(folder="inbox", limit=limit)

@mcp.tool
def search_emails(query: str, folder: str = "all") -> list[dict]:
    """Search emails by query"""
    return search(query=query, folder=folder)
```

#### Bash & Scripts

**Use Case:** General-purpose tool for flexible work using a computer.

**Example:**
```python
# User has important info in PDF attachments
# Claude can write code to:
# 1. Download PDF
# 2. Convert to text
# 3. Search across it

@mcp.tool
async def analyze_attachment(attachment_url: str, ctx: Context) -> str:
    await ctx.info(f"Downloading {attachment_url}...")
    
    # Claude writes and executes bash script
    script = """
    curl -o temp.pdf {url}
    pdftotext temp.pdf temp.txt
    grep -i "important keyword" temp.txt
    """.format(url=attachment_url)
    
    result = await ctx.execute_bash(script)
    return result
```

#### Code Generation

**Key Insight:** Code is precise, composable, and infinitely reusable.

**Example Use Case:** File creation in Claude.AI
- Claude writes Python scripts to create Excel, PowerPoint, Word documents
- Ensures consistent formatting and complex functionality

**Email Agent Example:**
```python
@mcp.tool
def create_email_rule(condition: str, action: str) -> str:
    """Create a rule for inbound emails"""
    # Generate Python code for the rule
    code = f"""
def email_rule_{hash(condition)}(email):
    if {condition}:
        {action}
        return True
    return False
"""
    # Save and register the rule
    save_rule(code)
    return f"Rule created: {condition} → {action}"
```

#### MCPs (Model Context Protocol)

**Purpose:** Standardized integrations to external services.

**Benefits:**
- Handles authentication and API calls automatically
- No custom integration code needed
- No OAuth flow management required

**Example:**
```python
# Email agent searching Slack and Asana
@mcp.tool
async def check_team_context(topic: str, ctx: Context) -> dict:
    # MCP handles auth and API calls
    slack_results = await ctx.call_mcp_tool("search_slack_messages", {
        "query": topic,
        "channels": ["#general", "#support"]
    })
    
    asana_tasks = await ctx.call_mcp_tool("get_asana_tasks", {
        "project": "customer-support",
        "search": topic
    })
    
    return {
        "slack": slack_results,
        "asana": asana_tasks
    }
```

### 1.3 Verifying Work

#### Defining Rules

**Best Form of Feedback:** Clearly defined rules for output, then explain which rules failed and why.

**Example: Code Linting**
- Generate TypeScript (better than JavaScript)
- Provides multiple layers of feedback
- More in-depth feedback = better results

**Email Example:**
```python
@mcp.tool
def send_email(to: str, subject: str, body: str) -> dict:
    """Send an email with validation"""
    errors = []
    warnings = []
    
    # Rule 1: Valid email address
    if not is_valid_email(to):
        errors.append(f"Invalid email address: {to}")
    
    # Rule 2: User has sent email before
    if not has_sent_to(to):
        warnings.append(f"First time sending to {to}")
    
    # Rule 3: Subject not empty
    if not subject.strip():
        errors.append("Subject cannot be empty")
    
    if errors:
        return {"success": False, "errors": errors, "warnings": warnings}
    
    # Send email
    result = send(to, subject, body)
    return {"success": True, "message_id": result.id, "warnings": warnings}
```

#### Visual Feedback

**Use Case:** Visual tasks like UI generation or testing.

**Example:**
```python
@mcp.tool
async def generate_email_html(content: str, ctx: Context) -> str:
    """Generate HTML email with visual verification"""
    html = generate_html(content)
    
    # Screenshot the rendered HTML
    screenshot = await ctx.screenshot_html(html)
    
    # Ask Claude to verify visually
    verification = await ctx.sample(
        f"Does this email look correct? Check:\n"
        f"- Layout: Are elements positioned correctly?\n"
        f"- Styling: Do colors, fonts match intent?\n"
        f"- Content hierarchy: Is information in right order?\n"
        f"- Responsiveness: Does it look broken or cramped?\n"
        f"\n[Image: {screenshot}]"
    )
    
    if "looks good" in verification.text.lower():
        return html
    else:
        # Iterate based on feedback
        return await generate_email_html(content + f"\nFeedback: {verification.text}", ctx)
```

**MCP Server Integration:** Use Playwright MCP server for automated visual feedback.

#### LLM as a Judge

**Use Case:** Fuzzy rules where performance boost is worth the cost.

**Tradeoffs:**
- Not very robust
- Heavy latency cost
- Useful when any boost in performance is worth it

**Example:**
```python
@mcp.tool
async def draft_email(to: str, topic: str, ctx: Context) -> str:
    """Draft an email with tone verification"""
    # Generate draft
    draft = await generate_draft(to, topic)
    
    # Get user's previous emails for tone reference
    previous_emails = get_previous_emails(to, limit=5)
    
    # Have subagent judge the tone
    tone_check = await ctx.spawn_subagent(
        "tone_checker",
        f"Compare this draft to previous emails and verify tone matches:\n"
        f"Draft: {draft}\n"
        f"Previous: {previous_emails}"
    )
    
    if tone_check.approved:
        return draft
    else:
        # Regenerate with feedback
        return await draft_email(to, topic + f"\nTone feedback: {tone_check.feedback}", ctx)
```

### 1.4 Testing and Improving Agents

**Key Questions to Ask:**

1. **If agent misunderstands the task:**
   - Is it missing key information?
   - Can you alter search APIs to make it easier to find what it needs?

2. **If agent fails repeatedly:**
   - Can you add a formal rule in tool calls to identify and fix the failure?

3. **If agent can't fix errors:**
   - Can you give it more useful or creative tools to approach the problem differently?

4. **If performance varies as you add features:**
   - Build a representative test set for programmatic evaluations (evals)
   - Base on customer usage

---

## 📚 Part 2: FastMCP Deep Dive

### 2.1 Core Architecture

FastMCP is the production-ready framework for building MCP servers and clients in Python.

**Key Differentiators:**
- Enterprise auth (Google, GitHub, Azure, Auth0, WorkOS)
- Deployment tools (FastMCP Cloud, self-hosted)
- Testing utilities (in-memory transport)
- Advanced patterns (composition, proxying, OpenAPI generation)

### 2.2 Building MCP Servers

#### Basic Server

```python
from fastmcp import FastMCP

mcp = FastMCP("Demo Server 🚀")

@mcp.tool
def add(a: int, b: int) -> int:
    """Add two numbers"""
    return a + b

if __name__ == "__main__":
    mcp.run()  # Default: STDIO transport
```

#### Tools with Context

```python
from fastmcp import FastMCP, Context

mcp = FastMCP("My Server")

@mcp.tool
async def process_data(uri: str, ctx: Context):
    # Log to client
    await ctx.info(f"Processing {uri}...")
    
    # Read resource from server
    data = await ctx.read_resource(uri)
    
    # Ask client LLM to summarize
    summary = await ctx.sample(f"Summarize: {data.content[:500]}")
    
    return summary.text
```

#### Resources (Static and Dynamic)

```python
# Static resource
@mcp.resource("config://version")
def get_version():
    return "2.0.1"

# Dynamic resource template
@mcp.resource("users://{user_id}/profile")
def get_profile(user_id: int):
    return {"name": f"User {user_id}", "status": "active"}
```

#### Prompts

```python
@mcp.prompt
def summarize_request(text: str) -> str:
    """Generate a prompt asking for a summary"""
    return f"Please summarize the following text:\n\n{text}"
```

### 2.3 MCP Clients

#### Basic Client Usage

```python
from fastmcp import Client

async def main():
    # Connect via stdio to local script
    async with Client("my_server.py") as client:
        tools = await client.list_tools()
        result = await client.call_tool("add", {"a": 5, "b": 3})
        print(f"Result: {result.content[0].text}")
```

#### In-Memory Testing

```python
from fastmcp import FastMCP, Client

mcp = FastMCP("My Server")

@mcp.tool
def multiply(a: int, b: int) -> int:
    return a * b

async def test_server():
    # Connect via in-memory transport (no process management!)
    async with Client(mcp) as client:
        result = await client.call_tool("multiply", {"a": 5, "b": 3})
        assert result.content[0].text == "15"
```

#### Multi-Server Client

```python
from fastmcp import Client

# Standard MCP configuration
config = {
    "mcpServers": {
        "weather": {"url": "https://weather-api.example.com/mcp"},
        "assistant": {"command": "python", "args": ["./assistant_server.py"]}
    }
}

client = Client(config)

async def main():
    async with client:
        # Access tools with server prefixes
        forecast = await client.call_tool("weather_get_forecast", {"city": "London"})
        answer = await client.call_tool("assistant_answer_question", {"query": "What is MCP?"})
```

### 2.4 Server Composition

**Two Methods:**

1. **`mount()`** - Live link to another server
2. **`import_server()`** - Static copy of server's capabilities

#### Mounting Servers

```python
from fastmcp import FastMCP, Client

# Create parent server
parent = FastMCP("Parent Server")

# Mount a remote server
async def setup():
    remote_client = Client("https://api.example.com/mcp")
    await parent.mount(remote_client, prefix="remote")

# Now parent has all remote server's tools with "remote_" prefix
```

#### Importing Servers

```python
from fastmcp import FastMCP

# Create servers
weather_server = FastMCP("Weather")
news_server = FastMCP("News")

# Create parent and import
parent = FastMCP("Aggregator")
parent.import_server(weather_server, prefix="weather")
parent.import_server(news_server, prefix="news")

# Parent now has static copies of all tools
```

### 2.5 Authentication

#### Server-Side Auth

```python
from fastmcp import FastMCP
from fastmcp.server.auth.providers.google import GoogleProvider

# Configure OAuth provider
auth = GoogleProvider(
    client_id="your-client-id",
    client_secret="your-client-secret",
    base_url="https://myserver.com"
)

# Protect server
mcp = FastMCP("Protected Server", auth=auth)

@mcp.tool
def protected_tool() -> str:
    return "This requires authentication!"

if __name__ == "__main__":
    mcp.run(transport="http", port=8000)
```

#### Client-Side Auth

```python
from fastmcp import Client

async def main():
    # Automatic OAuth flow
    async with Client("https://protected-server.com/mcp", auth="oauth") as client:
        # Browser opens automatically for OAuth
        result = await client.call_tool("protected_tool")
```

### 2.6 Deployment

#### Local Development

```bash
fastmcp run server.py
```

#### HTTP/SSE Production

```python
if __name__ == "__main__":
    # HTTP (recommended)
    mcp.run(transport="http", host="0.0.0.0", port=8000)
    
    # SSE (for compatibility)
    mcp.run(transport="sse", host="0.0.0.0", port=8000)
```

#### FastMCP Cloud

```bash
# Deploy to FastMCP Cloud
fastmcp deploy server.py

# Get instant HTTPS endpoint with built-in auth
# https://your-server.fastmcp.cloud
```

---

## 🔧 Part 3: Integration Patterns

### 3.1 atomsAgent with FastMCP

**Current Implementation:**
- atomsAgent uses Claude Agents SDK for AI
- Needs FastMCP server for MCP tools
- Needs FastMCP client for connecting to external MCP servers

**Architecture:**

```
atomsAgent (FastAPI)
├── Claude Agents SDK (AI)
├── FastMCP Server (Built-in Tools)
│   ├── search_requirements
│   ├── create_requirement
│   ├── analyze_document
│   └── search_codebase
└── FastMCP Client (External MCP Servers)
    ├── User's configured servers
    ├── Organization servers
    └── Project-specific servers
```

### 3.2 Implementation: FastMCP Server in atomsAgent

**File:** `src/atomsAgent/mcp/server.py`

```python
from fastmcp import FastMCP
from supabase import create_client
import os

# Create FastMCP server
mcp = FastMCP("atoms-tools")

@mcp.tool
def search_requirements(
    query: str,
    project_id: str | None = None,
    status: str | None = None
) -> dict:
    """Search requirements in the database"""
    supabase = create_client(
        os.getenv("SUPABASE_URL"),
        os.getenv("SUPABASE_SERVICE_KEY")
    )
    
    query_builder = supabase.table("requirements").select("*")
    
    if project_id:
        query_builder = query_builder.eq("project_id", project_id)
    if status:
        query_builder = query_builder.eq("status", status)
    
    # Full-text search
    query_builder = query_builder.textSearch("title,description", query)
    
    result = query_builder.execute()
    return {"results": result.data, "count": len(result.data)}

@mcp.tool
def create_requirement(
    project_id: str,
    title: str,
    description: str,
    priority: str = "medium",
    status: str = "draft"
) -> dict:
    """Create a new requirement"""
    supabase = create_client(
        os.getenv("SUPABASE_URL"),
        os.getenv("SUPABASE_SERVICE_KEY")
    )
    
    result = supabase.table("requirements").insert({
        "project_id": project_id,
        "title": title,
        "description": description,
        "priority": priority,
        "status": status,
    }).execute()
    
    return {"success": True, "requirement": result.data[0]}

@mcp.tool
async def analyze_document(document_id: str, ctx: Context) -> dict:
    """Analyze a document and extract insights"""
    # Get document from Supabase
    supabase = create_client(
        os.getenv("SUPABASE_URL"),
        os.getenv("SUPABASE_SERVICE_KEY")
    )
    
    doc = supabase.table("documents").select("*").eq("id", document_id).single().execute()
    
    # Use Claude to analyze
    analysis = await ctx.sample(
        f"Analyze this document and extract key insights:\n\n{doc.data['content']}"
    )
    
    return {
        "document_id": document_id,
        "analysis": analysis.text,
        "insights": extract_insights(analysis.text)
    }

@mcp.tool
def search_codebase(query: str, file_pattern: str = "*") -> dict:
    """Search the codebase for code matching the query"""
    import subprocess
    
    # Use ripgrep for fast searching
    result = subprocess.run(
        ["rg", query, "--glob", file_pattern, "--json"],
        capture_output=True,
        text=True
    )
    
    matches = [json.loads(line) for line in result.stdout.split("\n") if line]
    
    return {
        "query": query,
        "matches": matches,
        "count": len(matches)
    }

if __name__ == "__main__":
    mcp.run()
```

### 3.3 Implementation: MCP Composition in atomsAgent

**File:** `src/atomsAgent/mcp/composition.py`

```python
from fastmcp import FastMCP, Client
from typing import List
import os

async def compose_user_servers(
    base_mcp: FastMCP,
    user_id: str,
    org_id: str | None = None,
    project_id: str | None = None
) -> FastMCP:
    """Compose MCP servers based on user context"""
    
    # Get user's configured servers from database
    servers = await get_user_mcp_servers(user_id, org_id, project_id)
    
    for server in servers:
        if server.scope == "user":
            # Import user's personal servers (static copy)
            client = Client(
                server.url,
                auth="oauth" if server.requires_auth else None
            )
            async with client:
                await base_mcp.import_server(client, prefix=f"user_{server.name}")
        
        elif server.scope == "organization":
            # Mount organization servers (live link)
            client = Client(
                server.url,
                auth="oauth" if server.requires_auth else None
            )
            await base_mcp.mount(client, prefix=f"org_{server.name}")
        
        elif server.scope == "project":
            # Mount project-specific servers (live link)
            client = Client(
                server.url,
                auth="oauth" if server.requires_auth else None
            )
            await base_mcp.mount(client, prefix=f"proj_{server.name}")
    
    return base_mcp

async def get_user_mcp_servers(
    user_id: str,
    org_id: str | None = None,
    project_id: str | None = None
) -> List[dict]:
    """Get user's configured MCP servers from database"""
    from supabase import create_client
    
    supabase = create_client(
        os.getenv("SUPABASE_URL"),
        os.getenv("SUPABASE_SERVICE_KEY")
    )
    
    query = supabase.table("mcp_servers").select("*").eq("user_id", user_id)
    
    if org_id:
        query = query.or_(f"org_id.eq.{org_id}")
    if project_id:
        query = query.or_(f"project_id.eq.{project_id}")
    
    result = query.execute()
    return result.data
```

### 3.4 Integration with Claude Client

**File:** `src/atomsAgent/services/claude_client.py` (enhancement)

```python
from anthropic import AnthropicVertex
from fastmcp import FastMCP, Client
from atomsAgent.mcp.server import mcp as built_in_tools
from atomsAgent.mcp.composition import compose_user_servers

class ClaudeAgentClient:
    def __init__(self, ...):
        # Existing initialization
        ...
        
        # Initialize FastMCP server with built-in tools
        self.mcp_server = built_in_tools
        
    async def create_completion(
        self,
        messages: list[dict],
        user_id: str,
        org_id: str | None = None,
        project_id: str | None = None,
        **kwargs
    ):
        # Compose MCP servers based on user context
        composed_mcp = await compose_user_servers(
            self.mcp_server,
            user_id=user_id,
            org_id=org_id,
            project_id=project_id
        )
        
        # Get all available tools from composed MCP server
        async with Client(composed_mcp) as client:
            tools_list = await client.list_tools()
            
            # Convert MCP tools to Claude tool format
            claude_tools = [
                {
                    "name": tool.name,
                    "description": tool.description,
                    "input_schema": tool.inputSchema
                }
                for tool in tools_list.tools
            ]
        
        # Create completion with tools
        response = await self.client.messages.create(
            model=self.model,
            messages=messages,
            tools=claude_tools,
            **kwargs
        )
        
        # Handle tool calls
        if response.stop_reason == "tool_use":
            for content in response.content:
                if content.type == "tool_use":
                    # Execute tool via MCP client
                    async with Client(composed_mcp) as client:
                        result = await client.call_tool(
                            content.name,
                            content.input
                        )
                        
                        # Add tool result to messages
                        messages.append({
                            "role": "assistant",
                            "content": response.content
                        })
                        messages.append({
                            "role": "user",
                            "content": [{
                                "type": "tool_result",
                                "tool_use_id": content.id,
                                "content": result.content[0].text
                            }]
                        })
            
            # Continue conversation with tool results
            return await self.create_completion(
                messages=messages,
                user_id=user_id,
                org_id=org_id,
                project_id=project_id,
                **kwargs
            )
        
        return response
```

---

## 🎯 Implementation Checklist

### Phase 1: FastMCP Server (6-8 hours)

- [ ] Create `src/atomsAgent/mcp/server.py`
- [ ] Implement `search_requirements` tool
- [ ] Implement `create_requirement` tool
- [ ] Implement `analyze_document` tool
- [ ] Implement `search_codebase` tool
- [ ] Test tools with FastMCP client
- [ ] Add error handling and logging

### Phase 2: MCP Composition (4-6 hours)

- [ ] Create `src/atomsAgent/mcp/composition.py`
- [ ] Implement `compose_user_servers` function
- [ ] Implement `get_user_mcp_servers` function
- [ ] Add database schema for MCP server configuration
- [ ] Test composition with multiple servers
- [ ] Add OAuth support for external servers

### Phase 3: Claude Integration (3-4 hours)

- [ ] Update `claude_client.py` to use FastMCP
- [ ] Convert MCP tools to Claude tool format
- [ ] Handle tool calls and results
- [ ] Test end-to-end flow
- [ ] Add subagent support
- [ ] Add context management

### Phase 4: Artifact Generation (2-3 hours)

- [ ] Create `src/atomsAgent/services/artifacts.py`
- [ ] Implement artifact detection regex
- [ ] Extract artifacts from responses
- [ ] Format for frontend rendering
- [ ] Test with various artifact types

### Phase 5: Tool Approval Flow (3-4 hours)

- [ ] Add approval metadata to tools
- [ ] Implement approval request/response
- [ ] Update frontend to show approval UI
- [ ] Test approval flow end-to-end

---

**Total Estimated Effort:** 18-25 hours

**Status:** ✅ Research Complete - Ready for Implementation

