---
name: project-prototype-vs-real-repo
description: This repo is a prototype/design repo only; the real Naveya build happens in a separate new TypeScript project
metadata:
  type: project
---

As of 2026-11-09 the user said E:\navya\navya is "just prototype only" — the real Naveya product (real frontend components, real backend services) will be set up as a completely different project.

**Why:** the prototype holds docs/specs and the design canvas (design/v3); the user wants a clean production codebase.

**How to apply:** treat this repo's docs/specs/DESIGN.md as reference input, not as the place for production code. Architecture/stack advice should be self-contained and portable to the new repo rather than tied to this repo's agent roster or guard hooks. The production stack is TypeScript end-to-end (NestJS + Drizzle + Postgres RLS + BullMQ + Better Auth, Next.js web, Expo mobile), chosen by the user 2026-11-09 over the prototype's Django/GraphQL/Flutter plan. The portable baseline doc is docs/architecture.md in this repo, meant to be copied into the new repo.
