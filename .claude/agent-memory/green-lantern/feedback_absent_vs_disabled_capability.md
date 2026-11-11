---
name: absent-vs-disabled-capability
description: The offered / disabled-with-reason / absent rule turns on WHICH question failed — capability (absent) vs this instance (disabled) — and the screen-inventory and compliance docs contradict each other on the maker's Approve control.
metadata:
  type: feedback
---

Two governance documents disagree about the checker's Approve control, and AC-02 is where it bites:

- `docs/screen-inventory.md` PY-07 says Approve is **hidden** for the maker.
- `docs/ui-compliance-requirements.md` **A38** says Approve is **visible + disabled with the rule** for the maker, and **absent** for a role without `payroll.approve`.

On PY-07 they happen to agree, because that screen's maker also lacks the permission — so `pages/payroll.jsx` draws Approve absent with both reasons printed. On AC-02 the checker genuinely holds the permission, so the two rules diverge and the choice has to be deliberate.

**The rule that resolves it — ask which question failed:**
- *Do I carry this capability, at this scope?* No → the control is **ABSENT**. Drawing a disabled one enumerates the permission model and the org chart to someone outside it.
- *I carry it, but does this instance forbid ME?* (maker = me, inputs stale, precondition unmet) → the control is **VISIBLE, DISABLED, with the reason in the first person**. Hiding it here makes the gate look broken rather than principled, and the refusal is the teaching.

**Why:** the whole point of maker-checker is that the person who prepared it can SEE the button and be told, by name, that it is not theirs to press. A hidden button teaches nothing and reads as a bug.

**How to apply:** on any approval/release surface, model capability as `(perm, scope)` held by the session, separately from item state. Demonstrate BOTH branches on the same screen if you can — `design/v3/pages/accountant.jsx` puts a bonus run the session prepared (disabled, first-person rule) next to a run at a legal entity where the session's capability is not granted (no control at all, plus a sentence saying why nothing is drawn). Flag the doc conflict upward; do not silently pick one. See [[project_v3_accountant_screens]] and [[project_v3_documents_profile_governance]].
