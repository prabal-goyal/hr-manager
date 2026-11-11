---
name: feedback-shared-http-server-port-parallel-agents
description: when multiple design-canvas agents verify in parallel against the same fixed port (8934, per the puppeteer-verification reference memory), only the first `python3 -m http.server` bind wins — later agents' server commands silently no-op and their requests are served by a SIBLING agent's process instead.
metadata:
  type: feedback
---

During a 3-way parallel Home-variant dispatch (2026-08-11, variants A/B/C each a different agent), running `python3 -m http.server 8934` from `design/` to verify `v2-b.html` produced no server log output at all for MY requests — `curl`/puppeteer against `127.0.0.1:8934` still returned 200 and rendered correctly, but the access log (`/tmp/httpserver_vb.log`) only showed `GET /v2-a.html` entries. Root cause: another agent already had port 8934 bound; my own `http.server` invocation failed to bind (silently, since it was backgrounded) and my traffic was actually served by the OTHER agent's still-running process. Harmless in this case ONLY because both processes serve the identical `design/` directory tree, so file content was correct regardless of which process answered.

**Why this matters:** (1) don't trust "my server's log is empty" as evidence of failure if the actual HTTP responses look right — check for a bind conflict before assuming something is broken; (2) killing "your" server at cleanup (`pkill -f "http.server 8934"`) may actually kill a SIBLING AGENT'S still-in-use server, disrupting their verification mid-task — this happened here and could not be undone.

**How to apply:** in any future parallel-dispatch wave where multiple agents verify design-canvas HTML via `python3 -m http.server <port>`, either (a) pick a port derived from something unique to the agent/task (e.g. a random high port, or hash of the variant letter) instead of reusing the fixed `8934` from the puppeteer-verification memory literally, or (b) if reusing 8934, treat any successful curl/render as sufficient verification and SKIP the `pkill` cleanup step entirely — leave the shared server running for siblings rather than risk tearing down someone else's in-flight verification.
