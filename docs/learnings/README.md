# Learnings

Project-wide lessons — the ones that change how anyone working on Naveya should
work, not notes about a single bug.

`CLAUDE.md` routes here. **lucius** owns this directory: it distils learnings
after bugs, reviews, QA gates and phase retros.

Where a lesson belongs:

| Scope | Destination |
|---|---|
| One agent's craft | `.claude/agent-memory/<agent>/MEMORY.md` |
| Project-wide | here |
| Changes how everyone works | `CLAUDE.md`, or an ADR in `docs/adr/` |

One file per lesson, named for the lesson rather than the incident. Say what was
believed, what turned out to be true, and what to do differently — a lesson that
only records what broke is a bug report.
