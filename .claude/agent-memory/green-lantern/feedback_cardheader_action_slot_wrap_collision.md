---
name: cardheader-action-slot-wrap-collision
description: kit.jsx's Card `action` prop visually collides with a long, multi-line `title` because CardHeader vertically centres the action against the whole wrapped title block when an icon is present
metadata:
  type: feedback
---

`kit.jsx`'s `CardHeader` sets `alignItems: icon ? "center" : "flex-start"` on
the header row. When a `Card`'s `title` is long enough to wrap to 2-3 lines in
a narrow detail column (the 400px `L.colNarrow` pattern every HR file uses
for its list+detail split), an `action` node (e.g. a `StatusMark` chip)
vertically centres against that *whole* wrapped block instead of sitting
level with the first line — on a long ticket subject like "Payslip variance
— August" wrapped to 3 lines, the SLA badge visually overlapped the
subtitle/body content below it. Caught by a full-page screenshot during
`hr-helpdesk.jsx`'s HR-32 build, not by reading the JSX (the flex layout is
individually correct — two side-by-side items with `minWidth:0`/`flexShrink:0`
— it just doesn't look right once the title genuinely wraps).

**Why:** `hr.jsx`'s `DocDetail` (HR-09) already avoids this: it never passes a
`StatusMark` as `Card`'s `action` prop — it renders the mark in its own
`flexWrap` row in the *body*, right under `title`/`sub`. That precedent is the
fix, and it was hiding in plain sight before this collision made it obvious
why the precedent exists.

**How to apply:** when a Card's title is demo content whose length isn't
fixed (a ticket subject, a free-text name, anything not a short fixed label),
do NOT put a state/status mark in `Card`'s `action` prop. Put it in the body,
in its own `flexWrap` row below `sub`, matching `hr.jsx`'s `DocDetail`. Reserve
`action` for short, fixed-width controls (a single icon button, a short link)
where a title collision genuinely cannot happen. Verify with a real
screenshot at the actual column width, not just a JSX read — this bug is
invisible in the source and only shows once real (long) demo content wraps.
