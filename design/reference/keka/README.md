# Keka — captured reference

Real screenshots from Keka (`voxturr.keka.com`, the user's own tenant), captured read-only on 2026-08-11. Keka is the benchmark the user keeps pointing at: *"keka looks so clean"*, *"more keka — like its icons, regularize option in each column"*, *"we also need similar column headers and other tabs etc, take it from there"*.

**Use these images directly.** Do not work from a second-hand description of them — that was the failure mode the user called out: *"only our recon via agents is not right way, we need to combine it with actual things from keka."* Open the file, look at it, then design.

## Files

| File | What it shows |
|---|---|
| `attendance-log-row-menu.jpg` | The attendance page in full: the three-card row (Attendance Stats · Timings · Actions), the "Logs & Requests" heading with the 24-hour-format toggle, the four tabs, the period pills, the column headers, and **the `⋯` row menu opened** — Regularize · Apply On Duty · Apply Partial Day · Request Leave |
| `attendance-calendar-tab.jpg` | The Calendar tab — month grid Mon→Sun, month nav, `W-OFF` chips on non-working days |
| `attendance-requests-tab.jpg` | The Attendance Requests tab — separate sections for *Work From Home / On Duty*, *Regularization*, and *Partial Day* requests, each with a date range, a `⋮` menu, and an empty state |
| `attendance-log-feb-penalties.jpg` | **February 2026** — the month with the most history. Shows `PENALTY` pills (pink, with a **chevron — a penalty is a drill-in, not just a label**), `W-OFF` pills, and whole-row tinting by state (lavender for penalty days, warm cream for weekly-offs). The one populated row (Sat 28 Feb) shows the full row anatomy: thin effective-hours **ring**, break, gross, an **orange outlined smiley** in ARRIVAL, and an **amber `!`** in LOG |
| `attendance-log-feb-scrolled.jpg` | The same month scrolled — how a long month reads as a continuous ruled list |
| `attendance-log-feb-late-checkins.jpg` | **The rows that actually have punches** — 3, 4 and 5 Feb. Each shows the empty effective-hours ring, `0h 0m`, and in ARRIVAL a **tortoise glyph + the exact lateness** (`4:36:17 late`, `1:29:24 late`, `1:24:43 late`), with an amber `!` in LOG |
| `glyph-tortoise-late-zoom.png` | **Close-up of the tortoise glyph.** Thin-stroke amber outline, ~1.5px, friendly and simple, sitting left of the lateness duration. This is the expressive-state language to adopt |
| `calendar-shift-schedule-top.jpg` | The Calendar tab — which is really a **shift-schedule** calendar (`/me/attendance/shiftschedule`) |
| `calendar-shift-schedule-full.jpg` | The whole 6-week grid: every working day prints its **shift window** (`10:00 AM – 7:00 PM`), Sat/Sun carry `W-OFF`, holidays print `HOLIDAY`, today is marked with a small corner triangle |

## What to take, and what not to

**Take the structure and the interaction patterns:**
- Actions live **on the row** (`⋯` per row), not only in a separate form.
- Column set: `DATE · ATTENDANCE VISUAL · EFFECTIVE HOURS · BREAK TAKEN · GROSS HOURS · ARRIVAL · LOG`.
- The at-a-glance cards above the log; tabs for log / calendar / requests; period pills; a format toggle.
- **Thin-stroke outline icons** (~1.5–2px), light and simple — never filled or heavy.
- **Expressive glyphs carry state, always beside a word or figure — never colour alone:**
  - **Tortoise** (amber outline) + the exact lateness, e.g. `🐢 1:29:24 late` — see `glyph-tortoise-late-zoom.png`
  - **Smiley** (orange outline) for a worked weekly-off
  - **Amber `!`** in LOG for a missing/incomplete punch
  These are the single biggest reason Keka reads human rather than mechanical. Draw our own in the same thin-outline language — do not use emoji.
- Row-level state tinting plus a small uppercase pill (`W-OFF`, `PENALTY`).
- Warm, human empty states ("Hurray! No pending leave requests"), not "No data".

**Do not take:** Keka's purple, its typography, its card styling, or its brand. Naveya renders these patterns in the v3 peacock language — see `DESIGN.md`.

**Translate rather than copy** where our domain differs: our period pills follow the **academic session** (back to April), not a rolling calendar year; "Overtime Requests" becomes **Overtime & extra duty** (exam duty, extra classes, hostel-warden duty, per M9); and the "My Team" stats row belongs to Department Head, not to an employee's own screen.

## A limitation of this tenant — read before drawing conclusions

**This Keka account has sparse attendance data.** Most rows read *"No Time Entries Logged"*. The genuinely populated rows are **3, 4, 5 and 28 February 2026** — those four carry the ring, the arrival glyph and the log flag, and are the anatomy reference. So these captures show Keka's **structure, states and interactions** faithfully, but they do **not** show a densely-populated table.

Do not infer from these that Keka's tables are sparse — ours must be designed for a **full month of real rows**. Where you need to see how a populated row behaves, use the one populated row in `attendance-log-feb-penalties.jpg` as the anatomy reference and extrapolate.

## Deliberately not captured

Keka's **My Finances** page was reviewed but **not saved here** — it renders the account holder's real bank account number, IFSC, date of birth, parent's name and address. Storing that in the repo would commit real personal data to git.

The patterns worth knowing from it, without the data:
- PAN renders masked as `XXXXXX858P`, Aadhaar as `XXXX-XXXX-9468`, each with a **reveal** control beside it.
- Verified documents carry a green **VERIFIED** chip and a `n file(s)` attachment link.
- A payroll summary strip runs `LAST PROCESSED CYCLE · WORKING DAYS · LOSS OF PAY · PAYSLIP`.
- **Keka does *not* mask the bank account number.** Naveya must — see `docs/ui-compliance-requirements.md`. This is a case where we deliberately diverge from the benchmark.
