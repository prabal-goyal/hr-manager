# -*- coding: utf-8 -*-
"""The accent is the colour of an ACTION, never of a QUANTITY.

`accent` and `chartClay` are the same terracotta, and terracotta sits
beside the crimson that means something is wrong. A band that paints a
plain population in one and a failure in the other shows two reds, and
the bigger of them means nothing bad at all -- which is what a designer
read off HR's sign-in band: a huge red bar for "9 accounts".

So on anything that draws a quantity -- a band metric's `tone`, a bar
segment's `color`, a meter, a donut slice -- the palette is:

    chartRed      a count of something WRONG: overdue, locked, past the
                  service level, rejected, expired, missing
    chartAmber    waiting, due, a clock running
    chartGreen    done, settled, signed in
    chartBlue
    chartTeal     plain categories, populations and money
    chartPurple
    chartSand

The accent stays where it belongs: buttons, links, the pressed segment
of a switch, a back arrow. This guard looks at `tone:` and at `tone={`, and at a `color:` that
sits in an object with a `key`/`label` beside it, which is the shape of
a bar segment -- so a link's `color: c.accent` is left alone. Both
spellings of `tone` matter: the first pass missed the JSX-attribute
form and left a terracotta underline on "Still joining", which is the
one a designer read as red.

Run: python design/v3/check-chart-accent.py
"""
import glob
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
# chartClay IS accent -- the same #C14D29 under a second name -- so a
# page never writes it at all. The earlier regex wanted the exact
# spelling `tone={c.chartClay}` and sailed past
# `tone={postsLeft ? c.chartClay : c.chartGreen}`.
CLAY = re.compile(r"\bc\.chartClay\b|\"chartClay\"")
# ...and the accent may not be a tone, a bar or a named slice, however
# the expression around it is written
TONE = re.compile(r"(?:tone|bar)(?::\s*|=\{)[^\n;]*?\bc\.accent\b")
SEG = re.compile(r"color:\s*c\.accent\b(?=[,\s}])")

hits = []
for path in sorted(glob.glob(os.path.join(ROOT, "pages", "*.jsx"))) + [os.path.join(ROOT, "kit.jsx")]:
    src = io.open(path, encoding="utf-8").read()
    name = os.path.basename(path)
    for rx in (CLAY, TONE):
        for m in rx.finditer(src):
            hits.append((name, src.count("\n", 0, m.start()) + 1, m.group(0)[:60]))
    for m in SEG.finditer(src):
        near = src[max(0, m.start() - 110):m.start()]
        if "key:" in near or "label:" in near:
            hits.append((name, src.count("\n", 0, m.start()) + 1, m.group(0)))

if hits:
    print("the accent is painting a quantity in %d place(s):" % len(hits))
    for n, ln, what in hits:
        print("  %s:%d  %s" % (n, ln, what))
    print("\nuse a chart colour instead; red only where something is wrong.")
    sys.exit(1)

print("clean: the accent paints no quantity")
