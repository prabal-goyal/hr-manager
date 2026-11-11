---
name: project-naveya-content-width-balance
description: every Naveya employee screen shares one CONTENT_MAX=1200 centered content column (margin auto) — a coordinator-added scope item (2026-07-22) fixing "content hugs the left, big void on the right/below" on wide desktop viewports.
metadata:
  type: project
---

Each employee screen's root wrapper (`EmployeeHome`, `Attendance`, `Leave`, `Payslips`, `Documents`, `Profile`) previously set its own inconsistent `maxWidth` (980/1040/1080) with NO `margin: auto`, so on a wide viewport the content hugged the shell's left edge (sidebar + a little padding) leaving a large unbalanced void on the right, and Home in particular ended visually short with a blank band below the two-column area. This was flagged mid-dispatch by BATMAN as user feedback ("too much empty space on all screens"), added to an already-in-flight impeccable-critique fix sweep.

**Fix applied:** a single `const CONTENT_MAX = 1200;` constant is now duplicated at the top of `design/screens.jsx` AND each of `design/screens/{attendance,leave,payslips,documents,profile}.jsx` (each file is its own classic-JSX IIFE with no import/export — see [design canvas conventions](project_design_canvas_conventions.md) — so there is no shared-module mechanism to define it once; it must be kept in sync by hand across files, same value, same name, commented as "matches design/screens.jsx's CONTENT_MAX"). Every screen's root wrapper became `style={{ maxWidth: CONTENT_MAX, margin: "0 auto" }}`. For Home specifically, vertical emptiness was ALSO fixed by adding real content (a "This week" mini-register — see below), not just widening.

**Why:** DESIGN.md's "phone-first for the employee surface" language is about the Flutter app, not an excuse for a cramped/off-center desktop web column; Linear/Stripe-grade restraint (the brand's stated reference) still centers a comfortable-width reading column on wide viewports rather than left-hugging or edge-to-edge stretching.

**How to apply:** any NEW employee screen file must declare its own `CONTENT_MAX = 1200` (copy the exact comment/value) and center its root wrapper the same way — don't reintroduce a bespoke maxWidth. If Home-style vertical density becomes an issue again (a screen "ends high"), prefer adding a genuine ledger/register-shaped module over just further widening — see the "This week" `Mark`-based mini-register added to `EmployeeHome`'s right column, which fixed both the emptiness AND the "Home is a card dashboard, not a register" critique finding at once.
