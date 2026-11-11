---
name: vendor-adapter
description: Use when integrating any third-party vendor (SDK or API) into the Naveya backend broker — scaffolds port, adapter, contract tests, outbox events, and degraded-mode handling. Naveya vendors: zkteco/essl/matrix/realtime/spectra (biometric/attendance), msg91/gupshup/twilio (messaging), tally, razorpay, EPFO/ESIC/TRACES (statutory portals).
---

# Vendor Adapter (ports & adapters)

Dispatch to **martian**. All vendor SDKs stay isolated in `backend/integrations/adapters/` — no vendor import leaks into services, resolvers, or views (`guard-vendor-isolation` enforces).

1. **Port first:** define/extend the vendor-neutral interface in `backend/integrations/ports.py` — canonical Naveya types only (e.g. `AttendancePunch`, `MessageSend`, `PaymentIntent`, `StatutoryFiling`). No vendor-specific fields leak upward.

2. **Adapter:** one module `backend/integrations/adapters/<vendor>.py`. ALL vendor imports and API calls live here. Config via env vars / tenant-scoped secrets, never committed. Naveya vendor families:
   - **Biometric / attendance:** zkteco, essl, matrix, realtime, spectra
   - **Messaging (SMS/WhatsApp/voice):** msg91, gupshup, twilio
   - **Accounting:** tally
   - **Payments:** razorpay
   - **Statutory portals:** EPFO, ESIC, TRACES

3. **Contract tests, TDD:** recorded fixtures for the happy path AND the documented failure modes — connection drop, delayed/late data (biometric devices buffer punches offline), vendor error response, signature-verification failure (webhooks), portal downtime/maintenance window (EPFO/ESIC/TRACES). Each failure mode has a documented, tested **degraded-mode** behavior: Ops alert, retry with backoff, dead-letter, or manual-entry / manual-filing fallback prompt. Never silently drop.

4. **Broker wiring:** inbound (device punch, webhook callback) → verify signature → normalize to the canonical type → persist → fan out; outbound (send message, initiate payment, submit filing) → **outbox event in the same DB transaction** → Celery delivery with retry + dead-letter. Never inline HTTP in views/resolvers. Webhook receivers live on the DRF REST edge (see strawberry-api skill) and hand straight to the broker.

5. **Governance:** money is `Decimal`; never log PII or vendor payloads carrying PAN/Aadhaar/UAN/ESIC/bank data (`guard-pii-logging`); statutory filing outputs go through maker-checker and append-only audit.

6. **Gate:** deathstroke review; **gordon `/compliance-check`** if PII, payroll, statutory, or documents cross the boundary; register the vendor in `docs/development-specification.md` (integration table) via an ADR if it's a new port.
