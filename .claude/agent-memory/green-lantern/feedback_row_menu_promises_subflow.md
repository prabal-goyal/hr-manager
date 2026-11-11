---
name: feedback-row-menu-promises-subflow
description: an ActionMenu item labelled "Deactivate user" / "Assign a role" must open THAT flow directly, not just select the record and land on the general detail view — caught via scripted interaction clicks, not a screenshot.
metadata:
  type: feedback
---

While building GA-04's Users register, every row's `⋯` `ActionMenu` item (`Assign a role`, `Reset MFA`, `Deactivate user`) originally just called `setSelectedId(user.id)` — which opens the general `UserDetailPanel`, not the sub-flow the label promises. A static screenshot of the closed menu looks completely correct (the labels are right, the menu opens); the defect only surfaces once you actually click through — the admin has to find and click a SECOND, differently-scoped control inside the detail panel to reach what the row menu already claimed to open.

**Why:** an `ActionMenu` item and a detail-panel-internal button can share an English label ("Deactivate user") while doing different things (select vs. actually open that panel), and nothing in the type system or the visual review catches that — only driving the click sequence with puppeteer and asserting on the POST-CLICK DOM (not just "did a menu with the right item exist") surfaced it. Fixed with a one-shot `openAction` prop + a `useEffect` keyed on `[openAction, user.id]` that flips the right local sub-panel state and calls back to clear the pending action, so the row menu is a real shortcut, not a decoy.

**How to apply:** whenever a row/card exposes both (a) a `⋯` menu that names a specific action and (b) a detail view that contains a control with the same or similar name, drive the FULL interaction chain in verification (click the menu item → assert the actual sub-flow's own markers appear, e.g. a required-field or a step title) rather than stopping at "the menu has the right label." This generalises [[feedback_affordance_grep_not_prose]] one level deeper: grepping the rendered DOM for the right CONTROL label is necessary but not sufficient — you also have to click it and check what it lands you on.
