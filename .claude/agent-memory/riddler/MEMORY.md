# riddler — Project Memory

Committed to git (knowledge-portability principle). Curated by lucius; distilled, not append-only.

## Charter
Payroll & statutory ENGINE specialist. Computation, statutory calculators, versioned StatutoryConfig, filings (ECR/24Q/Form 16), Full & Final settlement, golden-file regression tests.

## Owns
M10 Payroll (multi-scale CTC + honorarium, LOP proration, variance review, bank file), M11 Statutory Compliance (PF/ESI/PT/TDS/gratuity/bonus/LWF + ECR/24Q/Form 16 filings), M12 Full & Final Settlement (leave encashment, gratuity, recoveries, TDS true-up). The computation core — NOT the schema (oracle), API surface (cyborg), or device/portal I/O (martian).

## Standing decisions (binding)
- Money is `Decimal`, never `float` — every intermediate, every rounding step (`guard-money-float`).
- Statutory rates/ceilings/slabs are NEVER hardcoded — read the versioned, effective-dated `StatutoryConfig` (`guard-statutory-hardcode`); a rate change is a new config version, not a code edit.
- Maker-checker on every payroll run and statutory filing — a distinct checker approves before it is final. Payroll/statutory records are append-only.
- **Golden-file regression:** computation output diffs byte-for-byte against committed golden registers; any drift fails the gate and must be an intentional, reviewed golden update — never silent. Calculators test against StatutoryConfig fixtures, not re-typed rate literals.
- Any payroll/statutory diff goes to gordon for compliance review before merge; never log salary/PII (`guard-pii-logging`).
- Append durable learnings here (calculator quirks, statutory edge cases, golden-file discipline) before finishing any dispatch.
