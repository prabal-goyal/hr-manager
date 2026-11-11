/* @jsxRuntime classic */
/* ============================================================
   Naveya — Design Tokens v3 · window.G3
   CANONICAL. Direction: "STAFFROOM TERRACOTTA" (approved 2026-09-03).

   This is a TOKEN REBASE of v3, not a redesign. The information
   architecture approved for Login, Home and My Attendance is
   unchanged; what moved is the palette, the type, the card language
   and the warmth. Every semantic token NAME is stable, so kit.jsx and
   screens.jsx keep working — a screen never learns a colour's name,
   only its job.

   Lineage: the warm system explored at design/v2/explore/home-d.jsx
   ("Staffroom Terracotta") won over the earlier "Peacock" synthesis.
   design/tokens.jsx (window.G) and design/v2/tokens.jsx (window.G2)
   remain untouched history.

   THE SYSTEM
   · Ground is CREAM (#FAF3EA), cards are white, rules are warm sand.
   · The rail is COCOA (#3E2A1F) in both themes — narrow, calm,
     receding, Keka-shaped. Colour energy is spent on DATA, never on
     chrome. Only the rail's hue moved; its structure did not.
   · Clay (#C14D29) is the accent — fills, rings, active marks.
     Deep clay (#A03D1D) is `action`: the text-safe clay. Clay on
     cream is 4.37:1 (fine for a fill or a 3:1 UI mark, short of
     4.5:1 body text) so text uses `action` (6.0:1 on cream).
   · Sage = present/success. Honey = holiday/warning/seal.
   · Dark mode is WARM — espresso grounds, lifted clay. A warm system
     with a cold dark mode reads broken.
   · Every pairing below holds WCAG AA (4.5:1 body, 3:1 large/UI).

   THE TYPE — TWO FACES, TWO JOBS (chosen 2026-10-12 on v3-type.html;
   replaced the Bricolage Grotesque / Hanken Grotesk / Red Hat Mono
   stack). These ARE the faces that load — design/v3.html's Google
   Fonts link is the contract, and the v2 bug was tokens naming fonts
   the page never rendered:
     Inter                EVERY word — headings AND body (400–800).
                          A heading is 600 at a negative tracking and
                          the body is 400; that is the whole of the
                          difference one family needs.
     Roboto               EVERY figure (400–700). NOT a monospace, and
                          it does not need to be: what lines a money
                          column up is tabular lining figures, which
                          G3.fig() asks for by name, and every digit
                          then takes the same advance width.
     Hind                 the last link in every fallback chain, so
                          ₹ never boxes out — Roboto does not carry
                          the rupee sign (400–700)

   Head roles carry `w` (600, Inter).

   Never hardcode a colour in kit.jsx or screens.jsx — read G3.
   ============================================================ */
(function () {
  /* ------------------------------------------------------------
     COLOUR — semantic maps, light + dark at parity.
     Contrast ratios quoted are measured, not estimated.
     ------------------------------------------------------------ */
  const light = {
    /* page ground + surfaces */
    page: "#FAF3EA",       /* cream canvas */
    surface: "#FFFFFF",    /* card */
    raised: "#FFF9F1",     /* warm card, one step up */
    sunken: "#F3E9DB",
    gutter: "#F1E3D1",
    alt: "rgba(58,42,33,.02)",
    sel: "rgba(193,77,41,.14)",

    /* the left rail — cocoa, both themes. Narrow, calm, Keka-shaped. */
    rail: "#3E2A1F",
    onRail: "#F6E9DC",           /* 11.32:1 on rail */
    onRailMuted: "#CBAF99",      /*  6.51:1 on rail */
    railActive: "rgba(246,233,220,.12)",
    railHover: "rgba(246,233,220,.07)",
    /* the rail is dark in BOTH themes, so an accent drawn ON it must be
       the lifted clay — light-mode clay on cocoa is only 2.8:1. */
    railAccent: "#E68153",       /*  4.90:1 on rail */
    railBorder: "rgba(246,233,220,.20)",
    railBorderStrong: "rgba(246,233,220,.34)",
    railLine: "rgba(246,233,220,.13)",
    railPlaneA: "rgba(246,233,220,.045)",
    railPlaneB: "rgba(233,190,104,.06)",

    /* ink */
    ink: "#3A2A21",        /* 12.44:1 on page · 13.70:1 on card */
    inkMuted: "#77614F",   /*  5.29:1 on page ·  5.82:1 on card */
    inkFaint: "#826B58",   /*  4.55:1 on page ·  5.00:1 on card */

    /* rules + borders */
    border: "#EBDCCB",
    borderStrong: "#DCC7B0",
    rule: "rgba(58,42,33,.10)",
    ruleStrong: "rgba(58,42,33,.20)",

    /* brand + action.
       accent = clay, for FILLS / rings / active marks (4.37:1 on cream,
       4.82:1 on card — a 3:1 UI mark either way).
       action = deep clay, the TEXT-SAFE clay (6.00:1 on cream). */
    accent: "#C14D29",
    accentSoft: "#F9E7DC",
    onAccent: "#FFFFFF",         /* 4.82:1 on clay */
    action: "#A03D1D",           /* 6.00:1 on cream, 6.60:1 on card */
    onAction: "#FFFFFF",         /* 6.60:1 on deep clay */
    focus: "rgba(179,71,24,.65)",
    /* text/linework drawn on a solid clay fill (ColorCard kind=accent) */
    onAccentMuted: "rgba(255,255,255,.78)",
    onAccentRule: "rgba(255,255,255,.22)",
    onAccentTrack: "rgba(255,255,255,.26)",
    onAccentWork: "rgba(255,255,255,.92)",
    onAccentBreak: "rgba(255,255,255,.48)",

    /* verification seal — honey, "stamped / on the record" */
    brass: "#7E5306",            /* 6.10:1 on cream */
    brassSoft: "#FBEED2",
    onBrass: "#FFFFFF",          /* 6.72:1 on honey */
    brassBorder: "rgba(233,190,104,.42)",
    onBrassMuted: "rgba(255,255,255,.78)",
    onBrassRule: "rgba(255,255,255,.24)",
    onBrassWash: "rgba(255,255,255,.15)",

    /* ---- data roles: attendance STATE ---- (every *Text on its own
       *Tint measures 6.5–7.5:1) */
    /* categorical ramp for a stacked bar or a donut. Vivid on purpose:
       these are FILLS, never text, and each one clears 3:1 on the card
       so a segment is visible to somebody who cannot tell it from its
       neighbour by hue. Ordered so that adjacent slots differ in hue
       AND in lightness, which is what makes a bar readable when four
       segments sit side by side. */
    chartBlue: "#2F74B0", chartTeal: "#10897A", chartAmber: "#D08A12",
    chartPurple: "#8E44C0", chartGreen: "#2E9E5B", chartRed: "#CE3A50",
    chartClay: "#C14D29", chartSand: "#A3907F",

    /* chart fills: the same states, lifted for a donut or a
       stacked bar, where a text-tuned colour goes muddy */
    presentChart: "#34935A", lateChart: "#C8871A", absentChart: "#C33A4E",
    /* a reading that has not come in is a CATEGORY, not an absence of
       one: drawn in a grey it read as a figure that does not matter */
    leaveChart: "#A05F9A", missingChart: "#3F6FA8",
    present: "#2F6B42", presentTint: "#E2EFE3", presentText: "#245536",
    presentBar: "#34935A",       /* vivid sage for time-worked bars · 3.2:1 on sunken */
    late: "#A9700A", lateTint: "#FBEED2", lateText: "#7E5306",
    lateVivid: "#B25A00",        /* late-arrival time on white / card · 4.8:1 */
    absent: "#B3243C", absentTint: "#FAE3E7", absentText: "#8C1B2E",
    leave: "#8A4E85", leaveTint: "#F6E7F3", leaveText: "#6B3A66",
    off: "#7A6A5E", offTint: "#EFE6DC", offText: "#55483E",
    holiday: "#A9700A", holidayTint: "#FBEED2", holidayText: "#7E5306",
    missing: "#857468", missingTint: "#F0E8E0", missingText: "#5C4E44",
    penalty: "#A34260", penaltyTint: "#F8E5EA", penaltyText: "#7C2E46",

    /* ---- data roles: leave TYPE (a separate semantic space from
       attendance state — a donut's colour says WHICH leave, never
       "present/absent") ---- */
    ltEL: "#3F6E8C", ltELTint: "#E5EEF3", ltELText: "#2C5169",
    ltCasual: "#8A4E85", ltCasualTint: "#F6E7F3", ltCasualText: "#6B3A66",
    ltSick: "#2F7B6E", ltSickTint: "#DFEFEB", ltSickText: "#1F5A50",
    ltComp: "#A9700A", ltCompTint: "#FBEED2", ltCompText: "#7E5306",
    /* vivid fills for leave-balance bars (graphics, ≥3:1 on sunken) */
    ltCasualBar: "#8E44C0", ltSickBar: "#2A8C63", ltCompBar: "#B86E00", ltELBar: "#2F74B0",

    /* generic status aliases (approvals, filings, maker-checker) */
    success: "#2F6B42", onSuccess: "#FFFFFF",
    warning: "#A9700A", onWarning: "#FFFFFF",
    danger: "#B3243C", dangerTint: "#FAE3E7", dangerText: "#8C1B2E", onDanger: "#FFFFFF",
    info: "#2F6E8C", onInfo: "#FFFFFF",

    /* a physical control's knob (Switch) — a lit surface, not a colour */
    knob: "#FFFDFA",
    knobShadow: "0 1px 3px rgba(83,49,29,.38)",

    /* flat illustration grounds — the schoolhouse wall and the sun.
       These are PICTURE colours, not UI colours: they are never behind
       text and never carry state, so they sit outside the contrast
       system on purpose. Everything else in an illustration reuses a
       semantic role (accent roof, present foliage, rail trunk). */
    illoWall: "#F6DDC4",
    illoSun: "#EBB550",

    /* the page-ground "Corridor Study" motif */
    motifLine: "rgba(58,42,33,.055)",
    motifBrass: "rgba(126,83,6,.13)",
    motifAccent: "rgba(193,77,41,.11)",
    motifPlaneA: "rgba(58,42,33,.018)",
    motifPlaneB: "rgba(126,83,6,.028)",
  };

  const dark = {
    page: "#1D1410",       /* espresso */
    surface: "#2A1E18",
    raised: "#33241C",
    sunken: "#16100D",
    gutter: "#16100D",
    alt: "rgba(245,233,220,.02)",
    sel: "rgba(230,129,83,.18)",

    rail: "#150E0B",
    onRail: "#F1E4D6",           /* 15.29:1 on rail */
    onRailMuted: "#BCA189",      /*  7.82:1 on rail */
    railActive: "rgba(241,228,214,.10)",
    railHover: "rgba(241,228,214,.06)",
    railAccent: "#F0946A",
    railBorder: "rgba(241,228,214,.20)",
    railBorderStrong: "rgba(241,228,214,.34)",
    railLine: "rgba(241,228,214,.13)",
    railPlaneA: "rgba(241,228,214,.045)",
    railPlaneB: "rgba(233,190,104,.06)",

    ink: "#F5E9DC",        /* 13.54:1 on surface */
    inkMuted: "#C0A793",   /*  7.08:1 on surface */
    inkFaint: "#9B8470",   /*  4.57:1 on surface */

    border: "#453329",
    borderStrong: "#57422F",
    rule: "rgba(245,233,220,.10)",
    ruleStrong: "rgba(245,233,220,.20)",

    accent: "#E68153",           /* 5.88:1 on surface, 6.58:1 on page */
    accentSoft: "#38231A",
    onAccent: "#2B1207",         /* 6.40:1 on lifted clay */
    action: "#F0946A",           /* 7.05:1 on surface */
    onAction: "#2B1207",
    focus: "rgba(240,148,106,.70)",
    onAccentMuted: "#C0A793",
    onAccentRule: "rgba(245,233,220,.14)",
    onAccentTrack: "rgba(245,233,220,.12)",
    onAccentWork: "#6FC087",
    onAccentBreak: "#B09A88",

    brass: "#E9BE68",            /* 9.27:1 on surface */
    brassSoft: "#33270F",
    onBrass: "#241905",
    brassBorder: "rgba(233,190,104,.34)",
    onBrassMuted: "rgba(233,190,104,.74)",
    onBrassRule: "rgba(233,190,104,.22)",
    onBrassWash: "rgba(233,190,104,.13)",

    /* categorical ramp — lifted off the dark surface rather than
       darkened, the same seven hues in the same order */
    chartBlue: "#6FA8D8", chartTeal: "#3FC2AE", chartAmber: "#E8B254",
    chartPurple: "#C08BE6", chartGreen: "#5FC98A", chartRed: "#F0808F",
    chartClay: "#E8825C", chartSand: "#C2AE9B",

    /* chart fills: the same states, lifted for a donut or a
       stacked bar, where a text-tuned colour goes muddy */
    presentChart: "#6FC087", lateChart: "#E5B25F", absentChart: "#F0736F",
    leaveChart: "#D08FC7", missingChart: "#7FB0E0",
    present: "#6FC087", presentTint: "#17291C", presentText: "#A6DBB4",
    presentBar: "#62C985",
    late: "#E5B25F", lateTint: "#2E2209", lateText: "#F0CE8E",
    lateVivid: "#F2A33A",
    absent: "#F0736F", absentTint: "#331516", absentText: "#F5AAA8",
    leave: "#D08FC7", leaveTint: "#2C1B2A", leaveText: "#E7BCE0",
    off: "#B09A88", offTint: "#251B16", offText: "#D3C0AF",
    holiday: "#E5B25F", holidayTint: "#2E2209", holidayText: "#F0CE8E",
    missing: "#B4A091", missingTint: "#241B17", missingText: "#D8C7B8",
    penalty: "#E28FA6", penaltyTint: "#33191F", penaltyText: "#F2BACA",

    ltEL: "#86B2CE", ltELTint: "#16242C", ltELText: "#B7D5E6",
    ltCasual: "#D08FC7", ltCasualTint: "#2C1B2A", ltCasualText: "#E7BCE0",
    ltSick: "#63C0AF", ltSickTint: "#122926", ltSickText: "#9FDCD1",
    ltComp: "#E5B25F", ltCompTint: "#2E2209", ltCompText: "#F0CE8E",
    ltCasualBar: "#C58AEC", ltSickBar: "#5FCB95", ltCompBar: "#F2B544", ltELBar: "#6FB0E6",

    success: "#6FC087", onSuccess: "#0E2314",
    warning: "#E5B25F", onWarning: "#2A1D05",
    danger: "#F0736F", dangerTint: "#331516", dangerText: "#F5AAA8", onDanger: "#2E0C0B",
    info: "#86B2CE", onInfo: "#0E1A21",

    knob: "#F5E9DC",
    knobShadow: "0 1px 3px rgba(0,0,0,.55)",

    illoWall: "#4A3527",
    illoSun: "#D9A845",

    motifLine: "rgba(245,233,220,.05)",
    motifBrass: "rgba(233,190,104,.10)",
    motifAccent: "rgba(230,129,83,.09)",
    motifPlaneA: "rgba(245,233,220,.015)",
    motifPlaneB: "rgba(233,190,104,.02)",
  };

  /* ------------------------------------------------------------
     TYPE — the REAL families. Whatever design/v3.html loads is
     exactly what is named here; that pairing is the contract.
     ------------------------------------------------------------ */
  const font = {
    /* headings and body are one family: the scale separates them by
       weight and tracking, not by a second face */
    display: "'Inter', 'Hind', system-ui, sans-serif",
    ui: "'Inter', 'Hind', system-ui, -apple-system, 'Segoe UI', sans-serif",
    /* every figure. Roboto is a sans, not a typewriter — tabular
       lining figures are what make a column stack, and `fig()` asks
       for them. The chain ENDS in Hind so ₹ always renders. */
    mono: "'Roboto', 'Hind', system-ui, sans-serif",
  };

  /* role -> size, line-height, weight, tracking. Head roles carry
     w (Inter, 600), and large heads take a little negative tracking —
     Inter sets wide by default at display sizes. */
  const type = {
    hero:    { px: 40,   lh: 1.1,  w: 600, ls: "-0.02em",  head: true },
    display: { px: 30,   lh: 1.14, w: 600, ls: "-0.018em", head: true },
    h1:      { px: 24,   lh: 1.2,  w: 600, ls: "-0.014em", head: true },
    h2:      { px: 18,   lh: 1.28, w: 600, ls: "-0.008em", head: true },
    h3:      { px: 15.5, lh: 1.36, w: 600, ls: "-0.004em", head: true },
    body:    { px: 14.5, lh: 1.55, w: 400, ls: "0" },
    ui:      { px: 13.5, lh: 1.48, w: 500, ls: "0" },
    small:   { px: 12.5, lh: 1.48, w: 500, ls: "0" },
    caption: { px: 12,   lh: 1.44, w: 600, ls: "0" },
    /* functional mono column labels (Register head) */
    colLabel:{ px: 10.5, lh: 1.3,   w: 600, ls: "0.07em", mono: true },
  };

  /* figure sizes — every one of these renders in font.mono, tnum+lnum */
  const figure = {
    xl: 34, lg: 22, md: 17, sm: 13.5, xs: 12, micro: 10.5,
    feat: "'tnum' 1, 'lnum' 1",
  };

  /* ------------------------------------------------------------
     SPACE · RADIUS (softer — the warm system rounds) · ELEVATION
     ------------------------------------------------------------ */
  const sp = { 0: 0, px: 1, 1: 4, 1.5: 6, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 28, 8: 32, 10: 40, 12: 48, 16: 64, 20: 80 };

  const r = {
    none: 0,
    xs: 8,      /* chips inner, tiny marks, timeline bars */
    sm: 10,     /* dense controls */
    md: 12,     /* inputs, buttons, rail items */
    lg: 16,     /* inner boxes, popovers */
    card: 20,   /* CARDS — the baseline of the warm system */
    xl: 18,     /* figure box inside the welcome band */
    "2xl": 26,  /* welcome band, hero surfaces */
    pill: 999,
  };

  /* warm shadows — cocoa-tinted, never a neutral/cold drop */
  const el = {
    light: {
      0: "none",
      1: "0 1px 2px -1px rgba(83,49,29,.10), 0 1px 3px rgba(83,49,29,.07)",
      2: "0 6px 16px -4px rgba(83,49,29,.14), 0 2px 6px -2px rgba(83,49,29,.08)",
      3: "0 14px 30px -8px rgba(83,49,29,.18), 0 4px 10px -4px rgba(83,49,29,.10)",
      4: "0 26px 54px -14px rgba(83,49,29,.24), 0 10px 20px -8px rgba(83,49,29,.14)",
    },
    dark: {
      0: "none",
      1: "inset 0 1px 0 rgba(245,233,220,.05)",
      2: "inset 0 1px 0 rgba(245,233,220,.06), 0 6px 16px rgba(0,0,0,.48)",
      3: "inset 0 1px 0 rgba(245,233,220,.07), 0 18px 44px rgba(0,0,0,.58)",
      4: "0 28px 60px rgba(0,0,0,.68)",
    },
  };

  const mo = {
    dur: { instant: 75, fast: 120, base: 180, slow: 280 },
    ease: {
      out: "cubic-bezier(.22,1,.36,1)",
      outExpo: "cubic-bezier(.16,1,.3,1)",
      inOut: "cubic-bezier(.76,0,.24,1)",
      standard: "cubic-bezier(.2,0,0,1)",
    },
    hover: "120ms cubic-bezier(.22,1,.36,1)",
    press: "90ms cubic-bezier(.22,1,.36,1)",
    enter: "180ms cubic-bezier(.16,1,.3,1)",
  };

  /* layout metrics — the rail width is a token, never a magic number */
  const layout = {
    rail: 84,
    contentMax: 1560,
    contentPadX: 40,
    gap: 24,
    colNarrow: 400,
    cardPad: 22,
    fieldH: 50,
    /* the compact control height: what a filter row uses, so a pill, a
       select and a search box are the same object at a glance */
    controlH: 42,
    /* the phone layout: below phoneMax the rail becomes a bottom tab
       bar of at most tabSlots items (the last one "More" when a role
       carries more), and the page gutter tightens to phonePadX */
    phoneMax: 767,
    tabBarH: 64,
    tabSlots: 5,
    phonePadX: 16,
    /* the global top bar (search, notifications, account) and the
       sub-tab row a multi-screen section adds under it */
    topBarH: 60,
    subTabsH: 46,
    searchW: 440,
  };

  /* stacking for the layers added with the phone layout. Existing
     layers in kit.jsx: action menu 1000 · tooltip 1600 · drawer 2000 ·
     dialog 2100 — the tab bar sits under all of them so a menu opened
     near the bottom of a phone is never hidden behind it. */
  const z = {
    topBar: 850,
    tabBar: 900,
    sheet: 950,
    panel: 1000,
    palette: 2050,
  };

  const G3 = {
    name: "Naveya v3 · Staffroom Terracotta",
    light,
    dark,
    theme(m) { return m === "dark" ? dark : light; },

    font,
    type,
    figure,
    sp, r, el, mo, layout, z,

    /* build a style object for a type role.
       `script` is accepted and ignored; it is the shape every call
       site already passes. Returns families from `font` — the
       real ones, so anything reading tokens alone is correct. */
    t(role, script, extra) {
      const spec = type[role] || type.ui;
      const s = {
        fontFamily: spec.mono ? font.mono : (spec.head ? font.display : font.ui),
        fontSize: spec.px,
        lineHeight: spec.lh,
        fontWeight: spec.w,
        letterSpacing: spec.ls,
      };
      if (spec.mono) s.fontFeatureSettings = figure.feat;
      return extra ? Object.assign(s, extra) : s;
    },

    /* build a style object for a figure. ALL money/time/counts use this. */
    fig(size, extra) {
      const s = {
        fontFamily: font.mono,
        fontSize: typeof size === "number" ? size : (figure[size] || figure.sm),
        fontWeight: 500,
        fontFeatureSettings: figure.feat,
        fontVariantNumeric: "tabular-nums lining-nums",
        letterSpacing: "0",
      };
      return extra ? Object.assign(s, extra) : s;
    },

    /* elevation for a mode, by step */
    shadow(mode, step) {
      const set = el[mode === "dark" ? "dark" : "light"];
      return set[step] != null ? set[step] : set[1];
    },
  };

  window.G3 = G3;
})();
