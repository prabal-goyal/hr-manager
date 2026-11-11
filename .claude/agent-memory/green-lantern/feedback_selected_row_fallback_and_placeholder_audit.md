---
name: selected-row-fallback-and-placeholder-audit
description: a list+detail screen's `selected` state needs a computed fallback (not raw useState(null)), and every {placeholder} string needs its call site audited, not eyeballed
metadata:
  type: feedback
---

Two real bugs caught by interactive puppeteer testing (not screenshots) while building `design/v3/pages/hr-hiring.jsx`'s HR-16/17 pipeline:

1. **Empty detail panel on first load.** `const [selected, setSelected] = useState(null)` meant the register-plus-detail layout (list on the left, `ApplicationDetail` on the right — the same shape as `hr.jsx`'s HRDocs / `hr-compliance.jsx`'s VerifyResponses) showed "Pick a candidate" even though a row existed, because nothing set an initial selection on mount, and advancing a candidate out of the currently-viewed stage left `selected` pointing at an ID no longer in the filtered lane. Fixed with a derived value: `const effectiveSelectedId = laneApps.some(a => a.id === selected) ? selected : (laneApps[0] ? laneApps[0].id : null)`, used everywhere instead of the raw `selected` state — `setSelected` still drives explicit picks, but the fallback keeps the panel populated whenever a row exists.
2. **Silent `{placeholder}` bugs.** `"hrh.ext.title": "Extend the closing date — {title}"` was called as `t("hrh.ext.title", { title: "" })` (a copy-paste stub never filled in), and `"hrh.prev.closes": "Applications close {date}"` was used as a `DefRow` *label* while the actual date was rendered as the row's separate value — so the UI literally printed the string `{date}` next to the real date. Both passed every automated check (key parity, no orphans, zero console errors, screenshots) because nothing renders as broken-looking; they only surface if you read the actual interpolated text.

**Why:** neither bug produces a console error, a missing key, or a visual glitch a screenshot comparison would flag — they are "correct-looking" strings with a dangling token, invisible to structural checks.

**How to apply:** (a) any list+detail screen needs a computed/derived selection fallback, not a bare `useState(null)`, and must be re-derived whenever the filtered list changes for a reason other than the user's own click (stage change, filter change, an action that moves the selected row out of view). (b) for every i18n key containing `{word}`, grep its literal `t("key"` call sites and confirm each one passes a `vars` object whose keys match the placeholders — do this as a scripted pass over the whole file before calling a dispatch done, not by re-reading the strings dict.
