---
name: feedback-v3-role-pages-not-wired
description: A dispatch brief claiming "v3.html is already wired" for a new role page has twice been inaccurate — grep the harness yourself, and verify by intercepting the HTML response rather than copying the harness.
metadata:
  type: feedback
---

The DH-01/02/03 dispatch stated "I wired v3.html and the rail" for `dhHome`/`dhLeave`/`dhAttendance`. `kit.jsx`'s `NAV_ITEMS`/`ROLE_PERMISSIONS` for `deptHead` WERE already present (rail truly wired), and `v3.html`'s `ROUTES`/`CODES` tables already referenced `P.DHHome` etc — but the `<script src="v3/pages/depthead.jsx">` tag itself was absent, so `window.Pages3.DHHome` would have stayed `undefined` and every dept-head screen would silently render `NotBuilt` until someone added that one line.

**Why:** with six role-page dispatches likely running in parallel (each forbidden from editing `v3.html`), the coordinator plausibly intends a single integration pass to add all six script tags at once after every agent finishes — "wired" in the brief may mean "the routing tables reference your keys," not "your script tag is loaded." Don't infer the stronger claim.

**How to apply:** for any dispatch that says a shared harness file is "already wired" but forbids editing it, `grep` that file for your own script tag / route keys before trusting the claim. Confirmed AGAIN on the AC-01/02/03 dispatch (2026-09-03), where a MID-TASK correction explicitly said "v3.html now has the script tag for your file" and it still did not — the six role-page tags landed for `depthead/principal/hr/payroll/groupadmin` but not `accountant`.

**The better workaround — intercept, do not copy.** Rather than writing a disposable `design/v3-tmp-*.html` (a repo file you must remember to delete, and which drifts from the real harness), inject the tag into the HTML response in flight with puppeteer:

```js
await page.setRequestInterception(true);
page.on("request", async (req) => {
  if (req.url().includes("/v3.html")) {
    let html = await fetchText("http://127.0.0.1:8934/v3.html");   // node:http GET
    html = html.replace('<script type="text/babel" data-presets="tenure">', TAG + '<script type="text/babel" data-presets="tenure">');
    return req.respond({ status: 200, contentType: "text/html; charset=utf-8", body: html });
  }
  req.continue();
});
```

Nothing on disk changes, the page loads the REAL harness (so a later coordinator edit to `v3.html` is picked up automatically), the `?role=&screen=&theme=&lang=` deep-link contract still works, and there is no cleanup step to forget. See [[project_v3_depthead_screens]] and [[project_v3_accountant_screens]].

**Third confirmation (2026-09-06, HR-26..30 dispatch).** The brief said "Already routed at `?role=hr&screen=hrLeaveAtt`" — and `ROUTES`/`CODES` did carry the key, but no `<script src="v3/pages/hr-leaveatt.jsx">` tag existed. Worse, mid-dispatch two SIBLING agents added their own tags to `v3.html` (`hr-compliance.jsx`, `hr-record.jsx`) while my brief forbade me from editing it. "Routed" means the routing table, never the script tag. Intercept and verify; then say plainly in the report that one line is still missing, and name it.
