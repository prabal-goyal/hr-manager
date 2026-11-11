---
name: v3-documents-profile-governance
description: the two compliance-sensitive ESS screens (design/v3/pages/documents.jsx + profile.jsx) — how M4 document governance and O3 PII masking were turned into layout, and the MaskedField/DefRow/Trail promotion candidates
metadata:
  type: project
---

`design/v3/pages/documents.jsx` (`window.Pages3.Documents`) and `design/v3/pages/profile.jsx` (`window.Pages3.Profile`), built 2026-09-03 against `docs/ui-compliance-requirements.md` (gordon's obligations register) rather than from the module spec alone.

**Why:** these are the two screens where a designer's muscle memory produces a policy violation — an Edit button on a staff document (R2 in gordon's risk table) and a PII-bearing profile header (R3). The compliance doc exists precisely so no screen draws an affordance the system must later refuse; it is the governing document for anything touching documents, PII, consent or money.

**How to apply — the patterns these two established, reusable on every later screen:**

- **Absent vs disabled-with-reason is a real distinction, and mixing them leaks.** A right the role *never* holds is not drawn at all (no Replace/Delete/Upload anywhere on Documents). A right that exists but whose *state* precondition is unmet stays visible and disabled **with the reason printed under the label** — `UI3.ActionMenu`'s `disabled` + `reason` fields are built for exactly this (`"Open the file" / "Nothing is on record yet"` on a not-on-record row).
- **A "request a correction" must be a message, never a write.** On Profile, every HR-owned field's only affordance is "Ask HR to correct something", which raises an M15.1 helpdesk ticket. O4 is explicit that a correction request which creates or replaces a `StaffDocument` is the same M4 violation wearing a polite label.
- **The live record does not change while a response is pending** (M4 rule 3) — say so *on the row*: `"Your renewal is with HR — this copy has not changed"` next to a still-`Expired` status. That one sub-line is the whole state machine made visible.
- **Mask in the DOM, not in CSS.** `MaskedField` conditionally renders the full value; masked means the string is absent from the document entirely. `full: null` means *no revealable form exists* (Aadhaar — §3 "never display a full Aadhaar anywhere"), and then the control is absent and replaced by a word, not disabled.
- **One reveal at a time.** Opening a second identifier re-masks the first. Cheap to build, easy to assert, and it means a profile left open on a staffroom desktop is never a screenful of identifiers.
- **Document types the school does *not* hold are rows in the same register**, marked `Not on record`, with the remedy always "HR has asked you for this" — never an upload. Merging held and not-held into one register is what let the summary chips double as the state legend and still sum to the row count.
- **DPDP has to be a surface.** "What the school holds about you, and why" = group · why · kept-until · lawful-basis chip, with the single consent-based group carrying a withdrawal whose consequence is stated in plain words *and* which says pay is unaffected (O1 forbids implying statutory processing depends on consent).
- **Express retention as an absolute date** ("Kept until 31 Mar 2035"), never a duration ("8 years"). A duration is a policy constant typed into a screen — the same class of defect as the "15% variance gate" gordon flagged (F5 / `guard-hardcoded-values`).

**Promotion candidates raised here** (defined locally because kit.jsx was out of scope): `MaskedField` (third independent appearance — strongest candidate), `DefRow` (label/value definition row, defined identically in both files), `Trail` (append-only history list with no controls at all).

Related: [[affordance-grep-not-prose]], [[naveya-masked-pii-pattern]], [[v3-attendance-keka-rebuild]], [[dead-space-relocates]].
