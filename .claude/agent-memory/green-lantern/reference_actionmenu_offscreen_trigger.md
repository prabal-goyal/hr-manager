---
name: actionmenu-offscreen-trigger
description: kit ActionMenu refuses to open when its trigger is outside the viewport — a puppeteer row-menu click below the fold silently does nothing; scrollIntoView first
metadata:
  type: reference
---

`UI3.ActionMenu`'s `computePos()` returns `null` when `rect.bottom < 0 || rect.top > window.innerHeight`, and the portal renders only on `open && pos`. So a programmatic `el.click()` on a row menu that sits below the fold sets `open = true`, renders nothing, and the test reports "no menu items" as if the component were broken.

Always scroll first:

```js
tr.scrollIntoView({ block: "center" });
tr.querySelector('button[aria-haspopup="menu"]').click();
```

The trigger's stable selector is `button[aria-haspopup="menu"]`; items are `[role="menuitem"]` **portaled to `document.body`**, so query them from the document, not from inside the row. A disabled item keeps its `aria-disabled="true"` and prints its reason as a second line inside the same button, so `item.innerText` contains label + reason — assert on both (that is how "the disabled control names run PR-2026-07" gets proved).

This is the row-level twin of the viewport gotcha in `reference_puppeteer_verification`; see also `feedback_row_menu_promises_subflow` for what to assert once the menu is open.
