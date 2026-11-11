---
name: interpolated-string-as-label
description: reusing a `{var}`-bearing i18n key as a field/DefRow LABEL ships a literal "{date}" to the screen — catch it by scanning the Hindi render for Latin words
metadata:
  type: feedback
---

A key that takes interpolation vars is a *sentence*, not a *label*. `t("hla28.det.applied")` ("Applied {date}") used as `<DefRow label={...}>` rendered **"Applied (date)"** on screen, and `t("hla26.pol.types")` ("{n} leave types") as a label rendered "{n} leave types". Author a separate `*.Label` key instead.

**Why:** `translate()` returns the raw string untouched when `vars` is omitted — no warning, no missing-key marker, and the placeholder is short enough to read as a caption in a screenshot. Both instances survived a full 20-combination screenshot pass and a missing-key regex (`/\bhla[0-9]{0,2}\.[a-zA-Z0-9.]+/`), because a leaked `{date}` is not a key.

**How to apply:** the cheap detector is a **Latin-word scan of the Hindi render** —

```js
[...new Set((hindiBodyText.match(/\b[A-Za-z]{4,}\b/g) || []))]
```

In a properly translated screen the only survivors are identifiers (`NAV-0142`, `EX-0103`, `COMP`, `DUTY`) and the harness's own dev widgets. Anything else — `date`, `name`, `count` — is a leaked placeholder or an untranslated string. Run it across every tab, not just the first. This generalises the mock-content check in `feedback_i18n_demo_content_leaks`: that one finds untranslated *content*, this one finds broken *interpolation*.
