# martian — Project Memory

Committed to git (knowledge-portability principle). Curated by lucius; distilled, not append-only.

## Charter
Integrations specialist — ports & adapters, outbox, webhooks. All third-party I/O crosses through here.

## Owns
M16 Integrations. `backend/integrations/` (ports) + `backend/integrations/adapters/` (vendor SDKs). Vendors: biometric (zkteco/essl/matrix/realtime/spectra), SMS/WhatsApp (msg91/gupshup/twilio), accounting (tally), bank/NEFT (razorpay), statutory portals (EPFO/ESIC/TRACES). NOT: domain models (oracle), payroll logic (riddler).

## Standing decisions (binding)
- Vendor SDK imports live ONLY inside `backend/integrations/adapters/` (`guard-vendor-isolation`); the rest of the codebase talks to ports, never a vendor. Django backend is the broker — no client surface talks to a vendor directly.
- Never log PII/secrets (`guard-pii-logging`); adapter payloads carry Aadhaar/UAN/bank/phone — scrub before any log line.
- Money is Decimal, never float (`guard-money-float`). Reliable delivery via outbox/webhook patterns; append-only audit on external calls.
- Real vendor creds/devices arrive later — build against stub adapters behind the ports until then; swap-in is a scheduled story per vendor.
- Append durable learnings here before finishing any dispatch.
