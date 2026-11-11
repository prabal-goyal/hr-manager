---
name: feedback-devanagari-slice-truncation
description: never derive a short-form label by slice(0,1)-ing a full Devanagari word — combining marks (anusvara etc.) sit as separate code points after the base consonant and can make two different weekdays/words collapse to the same visible glyph
metadata:
  type: feedback
---

Building the Attendance "Timings" card's weekday pills (M T W T F S S), the first pass derived the single-letter pill from the full localized weekday word: `t("att.d" + wd).slice(0, 1)`. In English this is safe (M/T/W/T/F/S/S — Keka's own reference uses the same T/T and S/S collisions and relies on position, which is an accepted convention). In Hindi it silently produced TWO IDENTICAL PILLS: शुक्र (Friday) and शनि (Saturday) both slice to "श". This did not throw, did not look broken in isolation — it only showed up as an ambiguity when screenshotting the full Hindi row side by side and reading it as a human would.

**Why:** treating a translated string as "the same shape as English, just in Devanagari" is the exact class of assumption `docs/ui-compliance-requirements.md` O12 and `DESIGN.md`'s "one language at a time" principle warn against — an abbreviation scheme designed for the source language's letter-collision profile does not survive translation. English's collision (T/T, S/S) is tolerable there because it's the *conventional*, expected shape for a weekday-initial row; the same output in Hindi is not a convention users already expect, so it just reads as broken.

**How to apply:** whenever a UI needs a deliberately-short form of a label (weekday initials, column abbreviations, avatar initials from a translated name) — never derive it algorithmically from the full localized string (`slice`, `charAt(0)`, etc.) across more than one language. Author the short forms as their own dedicated i18n keys (e.g. `att2.wd.1`..`att2.wd.0`) so a human translator picks values that are actually distinct in that script, and check the full row/set renders with no visual duplicates in EVERY shipped language before calling it done — not just the language you drafted in first.
