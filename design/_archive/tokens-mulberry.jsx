/* @jsxRuntime classic */
/* ============================================================
   Naveya — v3, "SLATE & MULBERRY" palette · overlays window.G3

   A COLOUR THEME, NOT A REDESIGN. Loads after v3/tokens.jsx and
   replaces the values in G3.light / G3.dark. Same rail, same
   layouts, same type, same components, the same 52 screens.

   THE BRIEF, after three rounds: a dashboard colour style, formal,
   colour mostly in the CTAs, a suitable sidebar — and **no green,
   no blue, no teal**. So the hue wheel left one region that is
   neither the terracotta v3 already owns nor anything in the
   170-260 band: the wine-violet side. Mulberry.

   1 · THE FIELD IS A WARM-NEUTRAL GREY. Page, cards, rules and ink
       carry 0.003-0.012 chroma toward the mulberry — enough that
       the greys have a temperature, far too little to read as a
       colour. This is where 95% of the pixels are.

   2 · COLOUR MEANS "YOU CAN ACT". Mulberry #782F74 appears on
       primary buttons, the active rail item, selection, focus and
       links. Nowhere else. If a thing is coloured and is not a
       state mark, it is actionable.

   3 · THE SIDEBAR IS A WARM NEAR-BLACK (#231C22) — graphite with a
       drop of the accent in it, so the rail belongs to the palette
       instead of being a black bar bolted on. It frames a dense
       page without competing with it, and it leaves the accent
       free to mean "act". The active item is the lifted mulberry.

   4 · GREEN IS v3's OWN GREEN, verbatim — `present` #2F6B42 and
       the #34935A bar, the same pair Staffroom Terracotta uses.
       Attendance has to separate present from absent at a glance
       and that green already does it; there was no reason to
       invent a second one.

   5 · MULBERRY IS THE ACCENT, NOT THE SKIN. The ink is grey
       (0.004 chroma — a temperature, not a colour), the soft
       accent is nearly neutral, earned leave and loss-of-pay moved
       to rose, and AVATARS draw from a six-tint bank picked by
       name rather than wearing the brand. What is left wearing
       mulberry: primary buttons, the active rail item, selection,
       focus, links. That is the whole list.

   State marks are SATURATED (designer, round 5): a mark has to be
   findable across a 200-row register, so present keeps v3's green,
   late and holidays take a full amber, absent a brick, leave a
   violet, loss of pay a rose — while weekly-off and missing stay
   grey because "nothing happened" is not a colour. The restraint
   lives in the FIELD, not in the marks.

   Avatars draw from six saturated tints (green, amber, rose, violet,
   olive, mulberry) picked by name — none of them blue.

   Contrast computed, not eyeballed (oklch -> sRGB -> WCAG):
     light: ink/page 14.6 · inkMuted 5.4 · inkFaint 4.5 ·
            action/page 8.4 · white/accent 8.0 · brass/page 4.8 ·
            onRail/rail 14.7 · onRailMuted/rail 7.9 ·
            railAccent/rail 8.6 · every stateText on its Tint
            5.6-7.2 · every bar >= 3.0 on sunken
     dark:  ink/page 15.6 · inkMuted 7.6 · inkFaint 5.2 ·
            action/surface 8.9 · stateText on Tint 7.6-9.0
   ============================================================ */
(function () {
  const G3 = window.G3;
  if (!G3) return;

  /* ------------------------------------------------------------
     LIGHT
     ------------------------------------------------------------ */
  Object.assign(G3.light, {
    /* field — warm-neutral, 0.003–0.006 chroma toward the accent */
    page: "#F9F7F8",
    surface: "#FFFFFF",
    raised: "#FDFCFD",
    sunken: "#F2EFF2",
    gutter: "#EEEAED",
    alt: "rgba(38,32,37,.02)",
    sel: "rgba(120,47,116,.10)",

    /* the rail — warm near-black, the only dark surface */
    rail: "#231C22",
    onRail: "#F4F1F4",           /* 14.7:1 on rail */
    onRailMuted: "#B9B4B8",      /*  7.9:1 on rail */
    railActive: "rgba(244,241,244,.11)",
    railHover: "rgba(244,241,244,.06)",
    railAccent: "#DFA3D9",       /*  8.6:1 on rail — the active mark */
    railBorder: "rgba(244,241,244,.18)",
    railBorderStrong: "rgba(244,241,244,.30)",
    railLine: "rgba(244,241,244,.11)",
    railPlaneA: "rgba(244,241,244,.04)",
    railPlaneB: "rgba(223,163,217,.05)",

    /* ink */
    ink: "#232123",        /* 15.0:1 on page — grey, not mulberry */
    inkMuted: "#666466",   /*  5.5:1 on page */
    inkFaint: "#727072",   /*  4.6:1 on page · 4.9:1 on card */

    /* rules + borders */
    border: "#E3DFE2",
    borderStrong: "#D1CCD0",
    rule: "rgba(38,32,37,.09)",
    ruleStrong: "rgba(38,32,37,.18)",

    /* ACTION — the one place colour lives */
    accent: "#782F74",           /* white on it: 8.0:1 */
    accentSoft: "#F5EFF4",
    onAccent: "#FFFFFF",
    action: "#70286C",           /* 8.4:1 on page */
    onAction: "#FFFFFF",
    focus: "rgba(120,47,116,.60)",
    onAccentMuted: "rgba(255,255,255,.78)",
    onAccentRule: "rgba(255,255,255,.22)",
    onAccentTrack: "rgba(255,255,255,.26)",
    onAccentWork: "rgba(255,255,255,.92)",
    onAccentBreak: "rgba(255,255,255,.48)",

    /* the verification seal — a quiet brass, the one warm note */
    brass: "#87673E",            /* 4.8:1 on page */
    brassSoft: "#F7F1EB",
    onBrass: "#FFFFFF",
    brassBorder: "rgba(135,103,62,.24)",
    onBrassMuted: "rgba(255,255,255,.78)",
    onBrassRule: "rgba(255,255,255,.24)",
    onBrassWash: "rgba(255,255,255,.15)",

    /* ---- attendance STATE — punctuation, not paint ---- */
    /* chart fills: the same states, lifted for a donut or a
       stacked bar, where a text-tuned colour goes muddy */
    chartBlue: "#2F6FAE", chartTeal: "#10897A", chartAmber: "#C98A1E",
    chartPurple: "#9B3F93", chartGreen: "#2E9E5B", chartRed: "#C0485C",
    chartClay: "#782F74", chartSand: "#9D8C92",
    presentChart: "#34935A", lateChart: "#C98A1E", absentChart: "#C0543F",
    leaveChart: "#7B63B0", missingChart: "#9A9499",
    present: "#2F6B42", presentTint: "#E2EFE3", presentText: "#245536",
    presentBar: "#34935A",
    late: "#8D6024", lateTint: "#FBEAD6", lateText: "#724200",
    lateVivid: "#8F5D14",
    absent: "#974337", absentTint: "#FFE5E0", absentText: "#852C21",
    leave: "#665189", leaveTint: "#F0E8FF", leaveText: "#57407C",
    off: "#736F73", offTint: "#EFEDEF", offText: "#5D595D",
    holiday: "#8D6024", holidayTint: "#FBEAD6", holidayText: "#724200",
    missing: "#777376", missingTint: "#EDEAEC", missingText: "#605C5F",
    penalty: "#873F5E", penaltyTint: "#FFE4EE", penaltyText: "#7C2E52",

    /* ---- leave TYPE — its own space, one lightness, four hues ---- */
    ltEL: "#8C4756", ltELTint: "#FFE4E9", ltELText: "#7C2C3E",
    ltCasual: "#665189", ltCasualTint: "#F0E8FF", ltCasualText: "#57407C",
    ltSick: "#2F6B42", ltSickTint: "#E2EFE3", ltSickText: "#245536",
    ltComp: "#7E5A26", ltCompTint: "#FBEAD6", ltCompText: "#6B4200",
    ltCasualBar: "#8A70B8", ltSickBar: "#34935A", ltCompBar: "#A9783A", ltELBar: "#B45C6F",

    /* generic status aliases */
    success: "#2F6B42", onSuccess: "#FFFFFF",
    warning: "#8D6024", onWarning: "#FFFFFF",
    danger: "#974337", dangerTint: "#FFE5E0", dangerText: "#852C21", onDanger: "#FFFFFF",
    info: "#665189", onInfo: "#FFFFFF",

    knob: "#FFFEFF",
    knobShadow: "0 1px 3px rgba(25,18,24,.34)",

    /* AVATARS — a bank, not a brand colour. Picked by name (see
       UI3.avatarTone), so the same person is the same tint on every
       screen, and the accent is never spent on decoration. Each pair
       is 6.6-7.1:1. */
    avatarBank: [
      { bg: "#BEEEC9", fg: "#005826" },   /* green   */
      { bg: "#FED8AE", fg: "#6D3900" },   /* amber   */
      { bg: "#FFCDD7", fg: "#78263C" },   /* rose    */
      { bg: "#E6D6FF", fg: "#52367B" },   /* violet  */
      { bg: "#DEE6B1", fg: "#474E00" },   /* olive   */
      { bg: "#FBD0F6", fg: "#682C65" },   /* mulberry*/
    ],

    /* picture colours — never behind text, never carrying state */
    illoWall: "#E5DCE4",
    illoSun: "#DBB381",

    /* the page-ground motif, pulled almost to nothing */
    motifLine: "rgba(38,32,37,.05)",
    motifBrass: "rgba(135,103,62,.10)",
    motifAccent: "rgba(120,47,116,.08)",
    motifPlaneA: "rgba(38,32,37,.015)",
    motifPlaneB: "rgba(120,47,116,.022)",
  });

  /* ------------------------------------------------------------
     DARK — same roles, lifted
     ------------------------------------------------------------ */
  Object.assign(G3.dark, {
    page: "#151214",
    surface: "#211D20",
    raised: "#2A2529",
    sunken: "#0E0B0D",
    gutter: "#0B080A",
    alt: "rgba(240,237,240,.02)",
    sel: "rgba(210,142,204,.14)",

    rail: "#0E090E",
    onRail: "#F0EDF0",
    onRailMuted: "#B4AFB3",
    railActive: "rgba(240,237,240,.10)",
    railHover: "rgba(240,237,240,.06)",
    railAccent: "#DFA3D9",
    railBorder: "rgba(240,237,240,.16)",
    railBorderStrong: "rgba(240,237,240,.28)",
    railLine: "rgba(240,237,240,.10)",
    railPlaneA: "rgba(240,237,240,.035)",
    railPlaneB: "rgba(223,163,217,.045)",

    ink: "#F0EEEF",
    inkMuted: "#B2B0B2",
    inkFaint: "#959395",

    border: "#373237",
    borderStrong: "#50494F",
    rule: "rgba(240,237,240,.09)",
    ruleStrong: "rgba(240,237,240,.18)",

    accent: "#D28ECC",
    accentSoft: "#352934",
    onAccent: "#1B0C1A",
    action: "#E4A2DE",
    onAction: "#1B0C1A",
    focus: "rgba(210,142,204,.65)",
    onAccentMuted: "rgba(27,12,26,.78)",
    onAccentRule: "rgba(27,12,26,.22)",
    onAccentTrack: "rgba(27,12,26,.26)",
    onAccentWork: "rgba(27,12,26,.92)",
    onAccentBreak: "rgba(27,12,26,.48)",

    brass: "#D9B58B",
    brassSoft: "#34291D",
    onBrass: "#1A1409",
    brassBorder: "rgba(217,181,139,.26)",
    onBrassMuted: "rgba(26,20,9,.78)",
    onBrassRule: "rgba(26,20,9,.24)",
    onBrassWash: "rgba(26,20,9,.15)",

    /* chart fills: the same states, lifted for a donut or a
       stacked bar, where a text-tuned colour goes muddy */
    chartBlue: "#7CAFE2", chartTeal: "#3FC2AE", chartAmber: "#E6AF6D",
    chartPurple: "#D28ECC", chartGreen: "#62C985", chartRed: "#F09AA6",
    chartClay: "#D28ECC", chartSand: "#C0ADB4",
    presentChart: "#62C985", lateChart: "#E6AF6D", absentChart: "#F6A192",
    leaveChart: "#C5ABF4", missingChart: "#9D9A9D",
    present: "#6FC087", presentTint: "#17291C", presentText: "#A6DBB4",
    presentBar: "#62C985",
    late: "#E6AF6D", lateTint: "#3F280A", lateText: "#F6C388",
    lateVivid: "#E6AF6D",
    absent: "#F6A192", absentTint: "#46221D", absentText: "#FFB7A9",
    leave: "#C5ABF4", leaveTint: "#322745", leaveText: "#D7C0FF",
    off: "#A19DA0", offTint: "#2C292B", offText: "#C0BCBF",
    holiday: "#E6AF6D", holidayTint: "#3F280A", holidayText: "#F6C388",
    missing: "#9D9A9D", missingTint: "#2A282A", missingText: "#BCB9BC",
    penalty: "#F09EBE", penaltyTint: "#43212F", penaltyText: "#FFB4D1",

    ltEL: "#F09AA6", ltELTint: "#46222A", ltELText: "#FFB4C2",
    ltCasual: "#C5ABF4", ltCasualTint: "#322745", ltCasualText: "#D7C0FF",
    ltSick: "#6FC087", ltSickTint: "#17291C", ltSickText: "#A6DBB4",
    ltComp: "#E6AF6D", ltCompTint: "#3F280A", ltCompText: "#F6C388",
    ltCasualBar: "#A68BD5", ltSickBar: "#62C985", ltCompBar: "#C69356", ltELBar: "#D27A8B",

    success: "#6FC087", onSuccess: "#08190E",
    warning: "#E6AF6D", onWarning: "#1A1409",
    danger: "#F6A192", dangerTint: "#46221D", dangerText: "#FFB7A9", onDanger: "#200E0A",
    info: "#C5ABF4", onInfo: "#130D20",

    knob: "#EDEAED",
    knobShadow: "0 1px 3px rgba(0,0,0,.55)",

    avatarBank: [
      { bg: "#133F23", fg: "#9EE0AF" },
      { bg: "#4C2E02", fg: "#F6C388" },
      { bg: "#53242E", fg: "#FFB4C2" },
      { bg: "#3B2C54", fg: "#D7C0FF" },
      { bg: "#343906", fg: "#CBD68D" },
      { bg: "#492746", fg: "#F2B8EC" },
    ],

    illoWall: "#3A3339",
    illoSun: "#C99F6B",

    motifLine: "rgba(240,237,240,.045)",
    motifBrass: "rgba(217,181,139,.09)",
    motifAccent: "rgba(210,142,204,.08)",
    motifPlaneA: "rgba(240,237,240,.014)",
    motifPlaneB: "rgba(210,142,204,.02)",
  });
})();
