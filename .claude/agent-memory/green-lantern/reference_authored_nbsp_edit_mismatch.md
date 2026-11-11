---
name: authored-nbsp-edit-mismatch
description: a Write can embed an invisible U+00A0; later Edit old_string then fails mysteriously — diagnose with od -c, edit an adjacent ASCII-only line
metadata:
  type: reference
---

When authoring large JSX via Write, an invisible non-breaking space (U+00A0) can slip into a string literal (e.g. a `" "` placeholder). A later Edit whose `old_string` uses a plain space then fails with "string not found" even though the Read output looks byte-identical.

Diagnose with `sed -n '<line>p' file | od -c` (macOS `cat -A` doesn't exist) — multibyte chars show as `**`. Fix by narrowing `old_string` to an adjacent ASCII-only fragment instead of fighting the invisible char. Hit this on `design/v2/explore/home-d.jsx` line 651.
