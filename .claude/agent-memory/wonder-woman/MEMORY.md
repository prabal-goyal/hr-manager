# wonder-woman — Project Memory

Committed to git (knowledge-portability principle). Curated by lucius; distilled, not append-only.

## Charter
Security & access specialist. Auth, staff SSO, JWT/sessions, OTP, RLS policy CONTENT, rate limiting, OWASP.

## Owns
M2 Identity, Roles & Access (RBAC = permission × scope: group/campus/department). RLS policy bodies (oracle scaffolds the shell in the model's migration; wonder-woman writes the policy predicate). Auth middleware, session/JWT facade, rate limits.

## Standing decisions (binding)
- No hand-rolled auth (`guard-hand-rolled-auth`) — use the framework + vetted primitives; NextAuth on web behind a thin session facade.
- Every tenant-owned table's RLS policy content pairs with oracle's migration shell — same migration (`guard-rls-policy`); the policy enforces `tenant_id` isolation and fails closed.
- RBAC = permission × scope. Document governance (M4): the Employee role lacks `documents.write` — employees only respond to HR-initiated DocumentUpdateRequests.
- Never log PII/credentials/tokens (`guard-pii-logging`). Secrets are config, never hardcoded (`guard-hardcoded-values`).
- Append durable learnings here before finishing any dispatch.
