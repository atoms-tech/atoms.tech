Agent Chat Architecture

Overview
- Goal: A role-aware assistant that can answer questions and perform actions across Organizations/Projects/Documents/Requirements/Tests.
- FE streams tokens; BE orchestrates LLM + tool calls; tools enforce org/project scope.

Components
- Chat API: `/chat/sessions`, `/chat/messages`, `/chat/stream`
- Orchestrator: tool registry, router, retry/circuit-breakers
- Tools:
  - requirements.search/listByDocument/listByProject
  - requirements.update/softDelete
  - projects.get/listMembers
  - documents.listBlocks, columns.listByBlock
  - properties.createMany/update/updatePositions
  - testing.create/update/list relations
  - files.getPublicUrl (read-only)
  - workflows.run (Gumloop replacement)

Session & Memory
- Session row (sessionId, userId, orgId, projectId?, createdAt)
- Messages table (role: user/assistant/tool, content, toolName?, args?, result?)
- Summaries table (sessionId, summaryText, updatedAt)

Tool Contract
```jsonc
{
  "name": "requirements.update",
  "description": "Update requirement fields by id",
  "inputSchema": {
    "type": "object",
    "required": ["id", "updates"],
    "properties": {
      "id": { "type": "string" },
      "updates": { "type": "object", "additionalProperties": true }
    }
  }
}
```

Execution Rules
- Validate tool inputs against JSON Schema.
- Check authorization (org/project membership + role) before execution.
- Log tool call + result (PII redacted).

Routing Strategy
- Top-level LLM decides to answer directly or call tools.
- Cap tool calls per message (e.g., 5); terminate with best effort summary.
- Aggregate results into structured cards for FE rendering.

Security
- Signed JWT for requests; server injects secure context (userId, orgId, projectId) to tools.
- Block tools when context missing or role insufficient.

Observability
- Track per-tool latency, failure reasons; set SLOs.
- Emit traces for each request (OpenTelemetry).

Future
- Add Workflow builder + agent “playbooks” for repeatable sequences.
- Add multi-agent collaboration (planner/critic/executor) gated by org settings.

