---
name: v3-hr-compliance-screens
description: design/v3/pages/hr-compliance.jsx — HR-10 (verify document response), HR-11 (expiry watchlist), HR-12 (child-safety board); one file, three tabs, cross-linked mock data
metadata:
  type: project
---

`design/v3/pages/hr-compliance.jsx` implements HR-10/11/12 as one component (`window.Pages3.HRCompliance`) with `UI3.Tabs`/`UI3.TabPanel` holding three sub-screens (see [[tabpanel-lazy-single-instance]] for the one real bug this composition produced). Routed at `?role=hr&screen=hrCompliance`; `v3.html` does not yet carry the `<script src="v3/pages/hr-compliance.jsx">` tag (same as every other still-unwired role page — see [[feedback_v3_role_pages_not_wired]]), verified via a cloned-harness sed-inject + delete, per [[reference_verify_via_cloned_harness]].

**Cross-screen data reuse (not a parallel cast):** the staff roster (Ananya Rao NAV-0142, Rohit Malhotra, Suresh Kamath, Farah Sheikh, Lakshmi Venkat, Manjunath Gowda, Arvind Krishnan, Neha Bhatt, Ramesh Iyengar, Zoya Ahmed, etc.) is lifted verbatim from `hr.jsx`'s HR-01/02/09 STAFF/DOC_QUEUE arrays. Ananya Rao's police-verification fact (verified, valid 31 Jul 2027) is the *exact* record `documents.jsx` renders on her own Documents screen — same fact, HR audience vs employee audience. `hr.jsx`'s existing overdue document requests (Manjunath's driver licence, Lakshmi's medical fitness, Neha's police-verification request) reappear on HR-11's watchlist as "already in progress," so the three screens read as one school's real state, not independent fixtures.

**Child-safety board (HR-12) design decisions:**
- Headline is "N of Total not cleared **for this filter**" (never a bare "all clear" that could be a narrow-filter artefact) — an explicit success state exists (brass ColorCard, "All N staff in this view are cleared today") and is reachable live by narrowing the filter to a subset that happens to be fully verified.
- Sort: uncleared-with-student-contact first, then uncleared-without-contact, then cleared-but-expiring, then fully verified last — a numeric rank table, not a bespoke comparator per state.
- "Flag for restricted duty" is explicitly marked in its own confirm-dialog body as a proposal (`ui-compliance-requirements.md` HR-12 `[proposed]` — the spec mandates tracking the gap but names no consequence).

**Unresolved-by-spec flags carried into the build (not invented, not blocking):** ui-compliance's `§9-Q5` ("who exactly may open a police/BGV record?") is undecided; this file proceeds under `hr.compliance.view` + `documents.verify`/`documents.manage` as the working assumption and says so in a header comment. Separately, **`kit.jsx`'s `ROLE_PERMISSIONS.principal` does not include `hr.compliance.view`**, so a Campus Principal cannot reach HR-12 via the rail today even though screen-inventory names Principal as an HR-12 viewer (their own campus's child-safety exposure) — a real gap, flagged here rather than fixed (kit.jsx is off-limits for this dispatch).

**Kit-primitive gotcha hit mid-build:** `UI3.Switch` already renders its own `<label>` wrapping the passed `label` text — wrapping it in a second `<label><span>{label}</span><Switch .../></label>` produces nested `<label>` elements and the visible text twice. Check a kit component's own render before adding a redundant wrapper.
