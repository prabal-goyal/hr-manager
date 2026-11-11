---
name: verify-via-cloned-harness
description: how to puppeteer-verify a new Pages3 file before the shared v3.html script tag exists, without editing v3.html
metadata:
  type: reference
---

When a dispatch says "I wired v3.html and the rail" but the `<script src="v3/pages/<yours>.jsx">` tag is not actually present yet (the coordinator batches that edit after all parallel role-file agents finish, to avoid N agents all editing the same shared `v3.html`), do not wait and do not edit `v3.html` yourself — it is explicitly out of scope and other agents are editing role files concurrently.

Instead: `cp design/v3.html design/_verify_<yourname>.html`, insert your own script tag with `sed`, point puppeteer at `http://127.0.0.1:8934/_verify_<yourname>.html?role=...&screen=...`, run the full check suite, then `rm` the temp file before finishing. The real `v3.html`'s `ROUTES`/`CODES` tables already contain your screen keys (that part IS pre-wired), so once the coordinator's batched script-tag edit lands, the page routes for free — your clone only proves the component itself is correct.

This is distinct from [[reference-puppeteer-verification]] (which is about the Chrome-cache/no-build-step setup) and from [[feedback-shared-http-server-port-parallel-agents]] (which is about not killing a sibling's `http.server` on 8934) — this note is specifically about the shared *routing* file, not the shared server process. Same principle either way: never touch a file five other agents are also touching; clone, verify, delete.
