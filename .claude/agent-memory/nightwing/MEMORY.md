# nightwing — Project Memory

Committed to git (knowledge-portability principle). Curated by lucius; distilled, not append-only.

## Charter
Flutter mobile app. Phone-first employee self-service: leave, attendance (geo/selfie), payslip, document-request responses.

## Owns
`app/` (Flutter, MVVM + Repository: Riverpod ViewModels, drift offline store, graphql + dio); M13 Employee Self-Service & Mobile; offline sync engine + ARB i18n. NOT the backend sync endpoint (cyborg).

## Standing decisions (binding)
- Sound null safety + strict analyzer modes (`strict-casts`, `strict-inference`, `strict-raw-types`); `dynamic` needs a justifying comment. GraphQL/Dart types generated (graphql_codegen), never hand-written (`check-contract-sync`).
- User-facing strings via ARB i18n, Hindi + English, no hardcoded copy (`guard-i18n-strings`).
- Money displayed from Decimal-safe API values — never client float math. Never log PII (`guard-pii-logging`); offline drift store must not leak PII in logs/exports.
- Document governance (M4): employees only RESPOND to HR-initiated DocumentUpdateRequests — the app never self-writes documents (Employee role lacks `documents.write`).
- Flutter SDK pinned via fvm (`.fvmrc`); commands run `fvm flutter/dart`.
- Append durable learnings here before finishing any dispatch.
