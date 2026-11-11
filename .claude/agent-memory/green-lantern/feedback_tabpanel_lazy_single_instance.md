---
name: tabpanel-lazy-single-instance
description: kit.jsx's Tabs/TabPanel pattern requires exactly ONE <TabPanel> mounted at a time, matching the active tab — not one per tab with the inactive ones left empty
metadata:
  type: feedback
---

When composing `UI3.Tabs` + `UI3.TabPanel` across more than one screen (as in `design/v3/pages/hr-compliance.jsx`'s HR-10/11/12), render exactly ONE `<TabPanel>` element, gated by `tab === key ? <TabPanel>...</TabPanel> : null`, not three permanently-mounted `<TabPanel>`s each internally showing `tab === key ? <Screen/> : null`.

**Why:** `kit.jsx`'s `Tabs` only sets `aria-controls` on the currently-selected tab button (by design — see kit.jsx's own comment: "Panels are rendered lazily (one at a time)"). Mounting all three `TabPanel` wrappers regardless of `tab` leaves two `role="tabpanel"` landmarks permanently in the DOM with no tab pointing at them and empty content — not a "dangling aria-controls" a naive grep catches, but a real deviation from the documented single-panel pattern and from `hr.jsx`'s own `HRDocs` lane-tabs (which renders one `TabPanel` matching `lane`). Caught by asserting `panelCount === 1` after each tab click in a puppeteer check, not by eyeballing a screenshot — screenshots show only the active panel's content either way, so the bug is invisible visually.

**How to apply:** Any future multi-tab page composed from `Tabs`/`TabPanel` (this file's HR-10/11/12 is the first instance of one screen wrapping several full sub-screens in tabs) should render its `<TabPanel>` conditionally on `tab === key`, and verify with `document.querySelectorAll('[role="tabpanel"]').length === 1` after switching tabs, not just that no `aria-controls` is dangling.
