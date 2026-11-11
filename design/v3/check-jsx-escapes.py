# -*- coding: utf-8 -*-
"""A \\uXXXX sequence inside a JS string literal is the character it
names. In JSX *text* it is four literal characters, printed on the
page. That bug has shipped four times in four design rounds and the
54-screen smoke test cannot see it, because the page renders fine —
it just says the wrong thing.

Run from design/:   python v3/check-jsx-escapes.py
Exits 1 and lists every offender.
"""
import io
import re
import sys
import glob

BS = chr(92)
PATTERN = re.compile(re.escape(BS) + "u[0-9a-fA-F]{4}")

def in_code(line, at):
    """True when `at` sits inside a string or a regex literal.

    A tiny scanner rather than a quote count, because `/.../` is the
    third way to write a literal in JavaScript and a character class
    inside one is exactly where \\uXXXX belongs."""
    i = 0
    quote = None          # the delimiter we are inside, or None
    prev = ""             # the last token-ish character before i
    while i < at:
        ch = line[i]
        if quote:
            if ch == BS:
                i += 2
                continue
            if ch == quote:
                quote = None
            i += 1
            continue
        if ch in "\"'`":
            quote = ch
        elif ch == "/" and i + 1 < len(line) and line[i + 1] not in "/*":
            # a slash opens a regex only where a value may start
            if prev in "(=[,:&|!?+-*%{;" or prev == "":
                quote = "/"
        if not ch.isspace():
            prev = ch
        i += 1
    return quote is not None


bad = []
for path in sorted(glob.glob("v3/**/*.jsx", recursive=True)):
    text = io.open(path, encoding="utf-8").read()
    for n, line in enumerate(text.split("\n"), 1):
        stripped = line.strip()
        if stripped.startswith("*") or stripped.startswith("/*") or stripped.startswith("//"):
            continue  # a comment explaining the trap is not the trap
        for m in PATTERN.finditer(line):
            if in_code(line, m.start()):
                continue
            bad.append(path + ":" + str(n) + "  " + line.strip()[:100])

if bad:
    print("escape sequences rendering as literal text:")
    for b in bad:
        print("  " + b)
    sys.exit(1)
print("clean: no escape sequences in JSX text")
