---
name: batched-edit-script-partial-loss
description: a multi-replacement python edit script that asserts and dies mid-way writes nothing, silently discarding the replacements that already succeeded in that batch
metadata:
  type: feedback
---

When editing a large `design/v3/pages/*.jsx` with a python script that does several
`assert old in s; s = s.replace(old, new)` steps and writes the file **once at the end**, an
assertion failure on step 5 throws away steps 1-4 as well. The traceback names only the failed
step, so it reads like "one edit didn't apply" when in fact *none* did.

**Why:** this bit twice on `py-ops.jsx`. A batch that added the PY-15 create/compute flow died on
its last replacement; the next, smaller batch then successfully rewrote `{sel.state === "draft" ?`
into `{isDraft && showSplit ?` — referencing two constants the lost batch was supposed to have
declared. The result was a component that crashed on mount (`isDraft is not defined`) and unmounted
the whole page, which the outer-tab-only screenshot matrix happily reported as passing
([[nested-tab-branch-never-clicked]]).

**How to apply:**
- After ANY assertion failure in a batched edit script, do not just fix the failing anchor and
  re-run that one step. Re-verify every replacement in that batch with a `grep` for its marker
  before continuing.
- Prefer one script per logical change over one script per turn; a failed small script loses
  little.
- After a run of scripted edits, grep the file for each new i18n key / const you believe you
  added (`for m in key1 key2 ...; do grep -c ...; done`) before running the browser checks.
