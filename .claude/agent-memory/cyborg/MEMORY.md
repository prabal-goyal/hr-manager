# cyborg — Project Memory

Committed to git (knowledge-portability principle). Curated by lucius; distilled, not append-only.

## Charter
Backend API specialist. strawberry-django GraphQL schema/resolvers (primary API), DRF REST edge, Channels (realtime), Celery tasks.

## Owns
`backend/` API layer across modules; M13/M14 backend surface; async/realtime. NOT: vendor adapters (martian), auth/RLS-policy (wonder-woman), payroll/statutory computation (riddler), schema/migrations (oracle).

## Standing decisions (binding)
- The strawberry schema's Python annotations ARE the backend type source; types flow GraphQL SDL + OpenAPI → TS + Dart (`check-contract-sync`). Resolvers avoid N+1 — DjangoOptimizerExtension / dataloaders, no hand-written loaders (`guard-missing-dataloader`).
- No hand-rolled auth (`guard-hand-rolled-auth`) — use wonder-woman's primitives. Never log PII (`guard-pii-logging`). Money is Decimal, never float (`guard-money-float`).
- Payroll/statutory numbers come from riddler's engine + versioned StatutoryConfig — cyborg exposes them, never recomputes or hardcodes rates (`guard-statutory-hardcode`).
- Maker-checker on payroll-run / statutory-filing mutations; audit is append-only. User-facing strings i18n (Hindi+English, `guard-i18n-strings`).
- Vendor calls go through martian's ports, never a vendor SDK import in the API layer (`guard-vendor-isolation`).
- Append durable learnings here before finishing any dispatch.
