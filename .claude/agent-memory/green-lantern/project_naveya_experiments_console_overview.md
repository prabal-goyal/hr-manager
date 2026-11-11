---
name: naveya-experiments-console-overview
description: design/v2/experiments/ payroll-run-console + overview-dashboard — the approved non-register compositions (state machine, bridge waterfall, horizon axis, control board) and their layout rules
metadata:
  type: project
---

Two experiment screens landed 2026-08-11 under `design/v2/experiments/`
(entries `design/v2-x.html`, `design/v2-x2.html`), expanding STAFFROOM
beyond the register grammar. Both are self-contained IIFEs (kit.jsx was
off-limits mid-rewrite): local fonts (Anek/Hanken/JetBrains — G2.sans/
deva still stale), local `inr()` (paise ints → lakh-crore), colors only
from `window.G2`.

**Payroll run console** (`payroll-run-console.jsx`,
`window.Experiments.PayrollRunConsole`): full-screen takeover (no rail —
justified for a run). Shapes: 7-station process spine (state machine),
center-axis reconciliation "Bridge" (Jul net + signed causes = Aug net,
computed never typed), exception queue + Jul/Aug component dossier,
maker-checker gate footer (sign blocked while exceptions open; checker
release locked in maker session). Brass = additions, red = reductions;
teal accent only on active station/selection.

**Overview dashboard** (`overview-dashboard.jsx`,
`window.Experiments.OverviewDashboard`): admin landing, standard 84px
rail drawn locally. Coordinator's two banned failure modes: KPI-tile
grid, and dead margins at 1680px (previous attempt's bug was a centred
~1200px column). The accepted answer is a **control board of four
DIFFERENT instruments**, flex-ratio full-bleed (no maxWidth): action
ledger whose money lines sum to the masthead figure; campus × period
cover matrix (sums both axes); 30-day "horizon" time axis (statutory ₹
flags above, expiries below, overdue pinned red at left edge); pulse
strip (mini run spine · headcount · leave pressure · helpdesk aging
bars). An under-filled column is treated as a bug — fill with a real
subordinate instrument (Out-today roster), not whitespace.

**Why:** these are the reference compositions if/when M6 payroll console
and M15 overview go to `frontend/`; the coordinator explicitly approved
the invention ("exactly the kind of invention this needed").

**How to apply:** for any new dense screen, reach for a *different
instrument per region* rather than repeating one shape; verify at
1680px wide AND in Hindi (see [[hindi-lineheight-overflow]] — lives in
design/v2's agent-memory); every figure region closes with a computed
total under a double rule (3px div with top+bottom hairlines).
