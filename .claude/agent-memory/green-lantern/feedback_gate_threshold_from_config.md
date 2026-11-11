---
name: gate-threshold-from-config
description: a policy threshold on a screen must come from a versioned, attributed config object — and rows below the gate are still shown, never auto-cleared
metadata:
  type: feedback
---

A threshold, gate or limit that a screen displays is **read from a versioned, effective-dated,
attributed policy object** — never written into a translated string — and every row it filters
is still listed, marked "below the gate", not suppressed.

**Why:** gordon found both halves of this as real defects in the pre-v3 payroll console
(`docs/ui-compliance-requirements.md` §8-F5 and §8-F6): the variance gate was the literal
`15%` typed into a screen, and seven money variances "below the gate" were auto-cleared with
no list, no drill-in and no record of the rule that suppressed them. Design mocks leak into
implementation, so a number typed into a mock becomes a number hardcoded in production; and a
variance nobody looked at is a variance that ships. The same rule is why `O9` forbids printing
any statutory rate/ceiling/slab — those are shown as an AMOUNT plus the config version they
were read from, never as a rate.

**How to apply:** model it as `PAY_POLICY = { v, effectiveFrom, varPct, varAbs }` beside the
`StatutoryConfig` snapshots, compute the flag from the object (`varCrossed(row)`), and render
the gate with its provenance line — "*Set in payroll policy v2026.2, effective 1 April 2026,
published by the group administrator. It is not a number this screen owns, and it is not a
statutory figure.*" Then show every row that moved, with a `Crossed the gate` /
`Below the gate` mark, and let the operator dismiss one only by explaining it. When verifying,
grep the *rendered DOM* for `/[\d.,]+\s?%/` and assert the only match is the gate itself —
that catches a statutory percentage sneaking into copy far more reliably than re-reading the
file.

Related: [[v3-payroll-operator-screens]].
