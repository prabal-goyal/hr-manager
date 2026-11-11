---
name: tilde-trips-workdir-guard
description: A bare "~" anywhere in a Bash command (even inside a heredoc comment) is blocked by guard-workdir-boundary
metadata:
  type: reference
---

`guard-workdir-boundary` blocks a Bash call containing a tilde, including one buried in heredoc
CONTENT rather than in a path. Writing a source comment that said "about 40%" as `~40%` inside a
`cat >> file <<'EOF'` block was refused as "filesystem exploration outside the repository".

Nothing is written when it fires, so the append simply does not happen — re-run with the tilde
removed (spell it "about", "approximately", or use U+2248 if a symbol is really wanted). Same
applies to `$HOME`.

Worth remembering because the error message points at filesystem exploration, which sends you
looking for the wrong bug in a 400-line heredoc.
