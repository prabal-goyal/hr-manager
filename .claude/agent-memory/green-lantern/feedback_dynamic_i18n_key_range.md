---
name: dynamic-i18n-key-range
description: a t("prefix." + var) call needs every value `var` can take declared, not just "the prefix exists" — an orphan/missing-key checker that whitelists dynamic prefixes will pass while the screen prints the raw key
metadata:
  type: feedback
---

When copy is looked up as `t("pys.mon." + dt.m)`, declare the **whole domain** of the variable (all 12 months, every enum member), not only the values the happy-path data happens to use.

**Why:** on `design/v3/pages/py-salary.jsx` I declared `pys.mon.4` through `pys.mon.10` because the demo clock is August. A superseded ledger row dated *31 March 2026* and an audit stamp dated *28 March 2026* then rendered literally as **"31 pys.mon.3 2026"** on screen, in both languages. My own parity/orphan checker did not catch it: it treats `pys.mon.` as a "dynamic prefix" and stops validating, so every key under that prefix is assumed fine. The i18n guard and the DOM assertions were all green; only reading a screenshot found it. This is the same failure family as [[interpolated-string-as-label]] — a placeholder shipping to the eye while every automated check passes.

**How to apply:** two habits. (1) For any `t(prefix + var)`, declare the full enum/range up front (months 1–12, all statuses, all units) even if today's mock data uses three of them — the extra keys cost nothing and cannot be orphaned because the checker skips dynamic prefixes anyway. (2) Add a positive check: scan the rendered Hindi DOM for a **Latin-alphabet dotted token** (`/\b[a-z0-9]+(\.[A-Za-z0-9_]+)+\b/`), which is what an unresolved key looks like in `kit.jsx`'s `translate()` (it returns the key itself as a "visible signal").
