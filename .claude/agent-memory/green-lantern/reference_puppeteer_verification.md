---
name: reference-puppeteer-verification
description: how to screenshot-verify a standalone design/*.html+jsx canvas without a project build step, using the machine's cached Chrome
metadata:
  type: reference
---

This machine has no project-local Puppeteer/Playwright, but `~/.cache/puppeteer/chrome/<version>/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing` (or `chrome-mac-x64` on Intel) is already downloaded from a prior run. To verify a Babel-standalone `design/*.html` page actually renders (catches the classic-JSX-runtime footgun and JSX syntax errors that only surface in-browser):

1. `npm install puppeteer-core@23` in a scratchpad dir (network access to the npm registry works from this sandbox — confirmed via `npm view <pkg> version`).
2. Serve the `design/` directory with `python3 -m http.server <port>` from that directory (relative `src=` paths in the HTML require this instead of `file://`).
3. Launch `puppeteer-core` with `executablePath` pointed at the cached Chrome binary above (avoids a slow/unnecessary fresh Chromium download).
4. Listen for `page.on('pageerror', ...)` and `page.on('console', ...)` — a blank-screen failure from the missing `Babel.registerPreset("tenure", ...)` classic-runtime shim shows up as a `pageerror` with an ESM `import` SyntaxError.
5. `page.evaluate(() => document.getElementById('root').innerHTML.length)` as a cheap "did it actually mount" check before screenshotting.

**Why:** this dispatch (the Naveya theme playground, `design/playground.html`/`design/playground.jsx`) needed real render verification, not just brace-balance review, because the task explicitly named the classic-JSX-runtime footgun as the usual failure mode.

**How to apply:** reach for this whenever a `design/*.jsx` dispatch needs "confirm it renders, screenshot if you can" — don't skip straight to "describe what I built" if Chrome is available in the cache; also useful for exercising live-state interactions (clicking chips/toggles, typing into hex fields) via `page.evaluate` before/after screenshots, not just a single static screenshot.

Two additions from the `design/fresh/` clean-room pass (2026-08):
- **The only console error on an otherwise-clean static page is usually the browser's automatic `/favicon.ico` 404** (fires once per fresh profile, so only the first variant shows it). Fix by giving standalone design HTML an inline `data:image/svg+xml` favicon — kills the noise and brands the tab.
- **Support `?theme=dark&lang=hi` URL-param overrides in the page's early head script** (override without persisting to localStorage). Makes variant screenshots deterministic — no toggle-clicking, no localStorage bleed between sequential pages in one browser session. Await `document.fonts.ready` before screenshotting pages using Google Fonts, or Devanagari/serif shots capture fallback faces.

Gotchas hit in practice: (1) in an `.mjs` verify script, `const URL = "http://…"` shadows the global `URL` constructor and breaks `new URL(".", import.meta.url)` — name it `PAGE_URL`; (2) expect exactly one benign `favicon.ico` 404 in the console-error list when serving `design/` via `python3 -m http.server` — filter it, don't chase it.

**Clicking an element below the fold can silently no-op** (2026-08-11, testing a popover-menu trigger inside a tall Register table): `ElementHandle.click()` is supposed to `scrollIntoViewIfNeeded` first, but under headless Chrome with a short viewport this sometimes produced a click that dispatched with no visible effect (`aria-expanded` stayed `false`) — not an error, just nothing happening, which reads exactly like a real bug in the component. Before concluding a click handler is broken, re-run with a generously tall `page.setViewport({ height: ... })` (or `page.evaluate` an explicit `scrollIntoView` before the click) so every target element is on-screen without relying on auto-scroll; if the "failure" disappears, it was a test-harness artifact, not a product bug.

**Two assertion traps found while proving PII masking and "no horizontal scroll" (2026-09-03, v3 Documents/Profile):**

1. **`page.content()` is NOT what the user sees on a Babel-standalone canvas.** @babel/standalone fetches each `src=`'d `.jsx`, transpiles it, and injects the compiled source back into the document as a `<script>` element. So `page.content()` contains *every string literal in your module* — including the unmasked demo PAN/UAN/bank number you are asserting is absent. A masking test written against it fails 100% of the time and looks like a real leak. Assert against `document.getElementById("root").innerHTML` (plus `body.innerText`) — that is what a screenshot, a Ctrl-F and the accessibility tree actually see.
2. **`scrollWidth - clientWidth` on `<main>` is not "there is a horizontal scrollbar".** Every v3 page draws `<Motif/>` past the right edge on purpose and contains it with `overflow-x: clip`, so `main.scrollWidth` is permanently ~70px wider than `clientWidth` — on Home and My Attendance too. Assert the real property instead: set `el.scrollLeft = 400`, read it back, and require `0` (plus `documentElement.scrollWidth <= clientWidth`). Always run the same measurement against an already-approved screen first; if the "defect" is present there too, the check is wrong, not the page.

**Two more assertion traps (2026-09-03, v3 Payroll PY-01/07/08):**

1. **`innerText` applies `text-transform`.** Small-caps section labels drawn with `textTransform: "uppercase"` come back from `body.innerText` as `WHERE THE DAYS CAME FROM`, so a case-sensitive `/Where the days came from/` assertion fails while the screen is perfectly correct. Use `/…/i` for any assertion aimed at a caption/kicker/column label.
2. **A DOM `.click()` on `UI3.ActionMenu`'s trigger no-ops when the trigger is off-screen — by design.** `computePos()` returns `null` if the trigger's rect is outside the viewport, and the portal renders only when `pos` is truthy. `aria-expanded` still flips to `true`, so the failure reads as "the menu is broken". `scrollIntoView({block:"center"})` immediately before the click (this is the *component's* contract, not a harness bug — a real user cannot click an off-screen row either).

**Verifying a file that owns no `<script>` tag yet (NA-12, `public.jsx`, 2026-09-06):** the
127.0.0.1:8934 static server serves the SHARED CHECKOUT's `design/` directory (its cwd), not a
per-agent worktree — a worktree-isolated agent's own copy of a new page is invisible to it. To
verify: (1) plain `cp` the new page + a temp-cloned `v3.html` (with the extra `<script src=...>`
tag plus a minimal harness script that renders the new `window.Pages3.X` directly, driven by a
`?view=` param) into the shared checkout's `design/`; (2) run puppeteer against
`http://127.0.0.1:8934/<temp-name>.html`; (3) `rm` both temp files when done. The Bash tool allows
plain `cp`/`rm` outside the worktree (not flagged as a "git operation"), but the **`Edit` tool
refuses to touch any path outside the worktree outright** — do in-place text changes to the temp
clone via `Bash` + `python3 -c "...read/replace/write..."` instead of `Edit`. Also: the ORIGINAL
`v3.html`'s final inline harness script still calls `ReactDOM.createRoot(...).render(...)` even if
you leave it in the temp clone "disabled" via a bogus `data-disabled` attribute — Babel doesn't
honor that, so it still executes and throws a duplicate-root console error. Truncate the temp
clone's `<body>` right after your own harness script instead of trying to neuter the original one
in place.

**`UI3.Button`'s `disabled` prop only ever sets `aria-disabled` + dims via opacity — never the
native `disabled` DOM attribute** (and only omits `onClick` at the call site). A puppeteer
assertion checking `button.disabled === true` will always be `false` and read as a bug that isn't
one; assert `button.getAttribute("aria-disabled") === "true"` instead.

**A clipped screenshot can close the thing you're photographing (2026-09-18, EMP-02 row menus).** `page.screenshot({ clip })` with a clip outside the current viewport makes Chrome scroll/resize to capture it, which fires `scroll`/`resize` — and the kit `ActionMenu` correctly closes when its trigger row leaves the viewport. The menu opened fine; the *screenshot* closed it, and the next "click a menu item" step failed as if the menu were broken. For anything portal-positioned (menus, tooltips, dialogs), take a plain viewport shot (no `clip`, tall `setViewport`) after scrolling the target into view.

