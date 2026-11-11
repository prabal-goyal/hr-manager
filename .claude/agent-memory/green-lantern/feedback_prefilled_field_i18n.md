---
name: prefilled-field-i18n
description: a demo-prefilled input must store "untouched = null" and resolve through t() at render, or the sample text freezes in whichever language the page booted in
metadata:
  type: feedback
---

A form field that ships with sample content must hold **`null` while untouched** and resolve its value as `raw === null ? t("key") : raw` at render time — never `useState(t("key"))`.

**Why:** `useState(t(...))` evaluates once, so the placeholder sentence keeps the boot language forever. Toggle to हिंदी and the whole screen translates except the one field a screenshot reviewer will look straight at. This is the same class of bug as [[i18n-demo-content-leaks]] (mock row content needs `t()` too), but it survives the usual fix because the string *is* translated — it is just captured too early.

**How to apply:** any `Input`/`TextArea`/`Select` in a `design/v3/pages/*.jsx` prototype that is pre-populated for the demo. Typing sets the raw value and the field stops following the toggle, which is correct — a user's own words are not translatable. Verify by diffing `document.body.innerText` across `?lang=en` and `?lang=hi`, not by eye.
