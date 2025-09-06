Claude Guidance (Anthropic)

Recommended Models
- Claude 3.7 Sonnet: balanced quality, long context, strong tool-use.
- Claude 3.7 Haiku: faster, cheaper, good for routing/simple tasks.

Defaults
- Temperature: 0.2–0.5 (lower for tool calls/precision)
- Max output tokens: 1024–2048 (tune per endpoint)
- Top_p: default; Set top_k only when needed.

Tool Use
- Provide JSON tool definitions (name, description, input_schema).
- Ask Claude to respond with tool calls as JSON when invoking tools.
- Validate and execute tools server-side; return results as tool messages.

Prompt Template (system)
"""
You are Atoms Assistant. You help users manage organizations, projects, documents, requirements, tests and workflows.
Follow these rules:
- Only use tools you are authorized for given the secure context.
- Prefer concise answers. When calling tools, return only JSON.
- Never leak internal tokens or secrets.
"""

Prompt Template (user → assistant)
- Include secure context (userId, orgId, projectId?) server-side, not in the user-visible prompt.
- Provide a brief task and allow Claude to choose tools.

Error Handling
- Catch tool errors, retry once with clarified inputs, otherwise summarize failure.
- For missing permissions, explain the restriction and suggest contacting an org admin.

Safety
- Redact PII before logging.
- Enforce max tool-calls per message.
- Disallow file writes or network calls outside approved tools.

Observability
- Log tokens, tool calls, and latency; trace each step.
- Capture exemplars for quality tuning.

