---
name: dom-dump-includes-jsx-source
description: On the design canvas, page.content() contains the Babel-injected module source, so "PII absent from the DOM" must be asserted against the rendered tree only
metadata:
  type: feedback
---

To prove a value is **absent from the DOM until revealed**, walk the rendered tree and
ignore `<script>` / `<style>` — never assert against `page.content()` or `document.documentElement.outerHTML`.

**Why:** `design/*.html` transpiles `.jsx` in the browser with Babel standalone, which appends the
module's SOURCE TEXT as a `<script>` node. Every demo constant — PAN, UAN, account number — is
therefore in `page.content()` no matter what is rendered. My first masking run reported four
false FAILs on a screen that was, in fact, correctly masked; I nearly "fixed" working code.

**How to apply:** in the puppeteer check, collect text nodes plus every attribute value of every
non-script element:

```js
const SURFACE = () => { const parts=[]; const walk=(el)=>{
  if (el.tagName==='SCRIPT'||el.tagName==='STYLE') return;
  for (const a of el.attributes||[]) parts.push(a.value);
  if (typeof el.value==='string') parts.push(el.value);
  for (const n of el.childNodes) { if (n.nodeType===3) parts.push(n.nodeValue); else if (n.nodeType===1) walk(n); }
}; walk(document.body); return parts.join(''); };
```

Attributes matter as much as text: the point of the rule is that a `title=`, `data-*` or `value=`
leak is just as bad as a visible one. `document.body.innerText` alone would miss those.

Beware two adjacent false positives while you are here: a UAN is also 12 digits, so a regex for
"Aadhaar-shaped" matches a legitimately-revealed UAN — assert on the specific synthetic Aadhaar
string instead. See [[v3-hr-record]] and [[naveya-masked-pii-pattern]].
