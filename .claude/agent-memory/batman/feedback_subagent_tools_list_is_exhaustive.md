# A subagent's `tools:` frontmatter is exhaustive — it silently excludes MCP

Confirmed by probe, 2026-09-06. All 13 roster agents carried:

```
tools: Read, Write, Edit, Glob, Grep, Bash
```

A dispatched green-lantern reported its ACTUAL tool list as `Read, Write, Edit,
Bash` and **zero** `mcp__*` tools. So every TrackFlow instruction we had given
those agents — the whole `## TrackFlow Protocol` section added in `e6b4760` —
was inert. They could not have made a single call.

**The list is an allowlist, not an addition.** Naming any tool in frontmatter
excludes everything unnamed, MCP servers included. Omitting `tools:` entirely
inherits everything; naming six tools grants exactly six.

## Why it stayed invisible

Two failures compounded, and each one alone would have hidden the other:

1. No tools, so no call could be made.
2. `CLAUDE.md` still declared TrackFlow **"DEFERRED — wired at dev start"**, so
   the agent read that, concluded tracking did not apply to it yet, and
   reported "TrackFlow integration is not wired" as a *correct* finding.

The agent never errored. It reasoned its way to standing down and said so
politely. **A missing capability plus a stale instruction reads as compliance**
— which is exactly the "work that happened and left no trace" failure the
devkit's own `AGENT-PROTOCOL.md` §0 exists to prevent.

## Standing rule

When adding a roster agent, or when a protocol says agents must call a service:
**verify with a probe agent that asks for its own tool list.** Do not infer
capability from the definition file, and never from the fact that the tool works
in the main session — the orchestrator's tools are not the roster's tools.

At the time this was fixed by granting the TrackFlow MCP tools to all 13 roster
agents. TrackFlow was removed from the project on 2026-11-07, so those grants are
gone; the allowlist lesson still applies to any MCP server added later.

## Definitions are cached PER AGENT TYPE, at that type's first dispatch

Not per session. Verified both ways, minutes apart, in one session:

| Probe | Dispatched before the edit? | Sees `mcp__trackflow__*`? |
|---|---|---|
| `green-lantern` | yes, twice | **no** — kept the stale definition |
| `oracle` | no, first use | **yes** — and completed a real `get_work_item` |

So a definition edit reaches any agent type that has **not yet run** in this
session, immediately and with no restart. A type already dispatched keeps the
version it was loaded with until the session ends.

The trap: the file on disk shows the new tools while an already-used agent
plainly lacks them, so re-reading the file proves nothing, and re-probing the
SAME agent type appears to prove the fix failed. Probe a type that has not run
yet — or restart, which resets every type.

CLAUDE.md appears to follow the same shape: the stale "deferred" wording reached
the already-cached `green-lantern` after the file had been rewritten.
