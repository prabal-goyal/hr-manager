---
name: naveya-masked-pii-pattern
description: PII field-gating pattern (mask + explicit reveal) used on Documents AND Profile screens; not yet in window.UI kit — now a 2x-confirmed candidate.
metadata:
  type: project
---

`design/kit.jsx` has no shared masked-PII component yet. For `design/screens/documents.jsx` (Identity category — PAN/Aadhaar) and again for `design/screens/profile.jsx` (Statutory & Bank — PAN/Aadhaar/UAN/bank account), I built the same private `MaskedValue` component: renders the masked string by default (mono, tabular-nums) with a `Button variant="link" size="sm"` "Reveal"/"Hide" toggle — no icon glyph available for eye/eye-off in the current Icon set, so text-link is the fallback affordance. Fields with no PII risk (IFSC code) or that are structurally not-applicable (ESIC above the wage ceiling) get their own row variant (`plain` / `na`) rather than being forced through the mask+reveal shape — don't mask what isn't sensitive, and don't render a blank/zeroed value when "not applicable" is the true state.

**Why:** PRODUCT.md/DESIGN.md require PII (PAN/Aadhaar/UAN/ESIC/bank/salary) to be field-gated — masked by default, explicit reveal, never splashed. No kit primitive existed to satisfy this consistently, and it has now been independently re-implemented identically twice.

**How to apply:** Any future screen showing PAN/Aadhaar/UAN/ESIC/bank fields should reuse this same mask+reveal shape until it's promoted into `window.UI` (e.g. as `UI.MaskedField`) — with this second confirmed instance, promotion should happen on the next kit-touching dispatch rather than being deferred again. Flag to two-face/kit owner as a candidate addition rather than re-inventing per screen. Also: `UI.Seal` (brass) was used with a custom label ("On record" on Documents, "Confirmed"/"Verified" on Profile) distinct from `StatusPill`'s "Verified" label to avoid saying "Verified" twice on the same row — Seal marks the record-keeping fact, StatusPill marks the verification state.
