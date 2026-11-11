---
name: affordance-grep-not-prose
description: prove a governance-forbidden action is absent by grepping CONTROL labels (buttons, links, menuitems), never page prose — the copy that explains the rule contains the banned verb
metadata:
  type: feedback
---

When proving a screen does not offer a forbidden action (Employee has no Edit/Replace/Delete/Upload on a document, M4), grep the **labels of interactive elements** — `button`, `a[href]`, `[role="menuitem"]`, plus `aria-label` — not `document.body.innerText`.

**Why:** the copy that *states the governance rule* necessarily contains the banned verb. On v3 Documents, "Nothing here is ever removed. A newer copy takes over from the old one" tripped a naive `body.innerText.includes("remove")` check — the best sentence on the page failed the test that was supposed to protect it. Same trap for "you never **add** or change a document yourself" and "no need for you to **add** one yourself". Writing the rule down in the interface is the point; the ban is on *controls*, not on words.

**How to apply:**
- Two-tier check. (a) Prose: only phrases that could never be explanatory — `"add a document"`, `"upload document"`, `"drag and drop"`, `"browse files"`, plus `input[type=file]` / `[draggable=true]` count = 0. (b) Controls: a regex of the banned verbs over every control label, with the legitimate exception anchored — e.g. every `upload` must co-occur with `response` / `उत्तर`, because responding to a `DocumentUpdateRequest` is the one write an employee has.
- **Portal menus only exist in the DOM while open.** `UI3.ActionMenu` renders through `ReactDOM.createPortal`, so you must click each `button[aria-haspopup="menu"]`, harvest `[role="menuitem"]`, then `Escape` — otherwise the row menus, which are exactly where a stray Delete would hide, are never inspected.
- Assert the *positive* governance property too: every `aria-disabled="true"` menu item must carry its reason (ui-compliance-requirements §0 "visible, disabled, with the reason in words"). A disabled item with no reason is as much a defect as a forbidden one.

Related: [[v3-documents-profile-governance]], [[reference-puppeteer-verification]].
