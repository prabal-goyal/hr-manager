---
name: feedback-theme-toggle-single-instance
description: don't add a second/global ThemeToggle on top of a shell that already renders one — they visually overlap and clip adjacent chrome; theme mode state already persists across route changes on its own.
metadata:
  type: feedback
---

While wiring `design/prototype.jsx` for the Naveya Peacock & Slate rebuild, I initially rendered a fixed-position `ThemeToggle` in the app root AND relied on `EmployeeShell`'s own top-bar `ThemeToggle` (required by the dispatch spec). Puppeteer screenshots showed the two toggles visually colliding near the top-right corner and clipping the adjacent "View admin console" button off the visible viewport.

**Why:** `ThemeProvider`'s `mode` is independent React state from whatever screen/route state the app uses to pick which view to render — toggling dark mode on the Employee Home screen and then navigating to Login (or signing out) preserves dark mode automatically, because both screens read from the same `ThemeProvider` ancestor. A second global toggle wasn't needed for "verify Login in dark too" — it added visual clutter instead.

**How to apply:** when a dispatch says "wrap in ThemeProvider with a global ThemeToggle," first check whether a per-shell/per-screen toggle (already required elsewhere in the same spec) already satisfies "global" by virtue of the shared provider ancestor. Only add a second, app-level toggle if a screen with NO shell/chrome at all (e.g., a bare Login) genuinely needs one visible on that exact screen — and even then, prefer navigating through the app (sign-in → toggle in shell → sign-out) to verify that screen in both themes before adding a redundant control.
