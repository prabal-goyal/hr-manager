---
name: nested-tabs-panel-count
description: "exactly one tabpanel mounted" must be verified per-tablist, not as a page-wide DOM count, once a page nests one Tabs group inside another
metadata:
  type: feedback
---

Building `design/v3/pages/hr-hiring.jsx`'s Pipeline & screening tab (HR-16/17), the outer `HRHiring` shell's three tabs (Requisitions/Postings/Pipeline) each render via `UI3.Tabs`/`TabPanel`, and the Pipeline tab's own body renders a SECOND, independent `Tabs`/`TabPanel` pair for the seven stage columns (Applied/Screening/.../Rejected). A naive verification script asserting `document.querySelectorAll('[role="tabpanel"]').length === 1` failed on the Pipeline tab (found 2) even though both tab groups were individually correct — one outer panel (for "pipeline") plus one inner panel (for whichever stage was active).

**Why:** [[tabpanel-lazy-single-instance]]'s rule ("exactly one `<TabPanel>` mounted at a time") is about a SINGLE tablist's panels, not a whole-page invariant. A page that legitimately nests one tab group inside a panel of another (this file's PipelineTab is the first instance of that shape in v3) will always show `N` panels where `N` = the number of *distinct, independent* tablists currently rendered, not 1.

**How to apply:** when a screen might contain more than one `Tabs`/`TabPanel` group, verify PER TABLIST instead of page-wide: for every `[role="tablist"]`, assert exactly one of its own `[role="tab"]` children is `aria-selected="true"`, that tab's `aria-controls` resolves to exactly one existing panel, and no other tab in that same tablist still carries `aria-controls`. Then assert the total panel count on the page equals the total tablist count (not 1). A page-wide `panelCount === 1` check is still correct and sufficient for any page with only ONE tab group.
