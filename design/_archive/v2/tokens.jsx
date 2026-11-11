/* ============================================================
   Naveya — Design Tokens v2  ·  window.G2
   Codename "STAFFROOM"  ·  Direction: "PEACOCK INK"
   (design/shell-options.html · option C, approved 2026-08-11)
   Chrome layout = Home variant A (narrow Keka-style rail).

   Reset from "Peacock & Slate" (design/tokens.jsx, window.G) —
   that direction was rejected as "too bland and robotic". STAFFROOM
   is deliberately warm, committed-colour, and expressive: a
   calm peacock-ink chrome with all colour energy in the DATA,
   character glyphs instead of geometric marks, hours-ring + colour
   day-timeline instead of numeric dumps.

   Light + dark at parity (dark is deep teal-black, NOT neutral gray).
   Type: Figtree (UI) · Mukta (Devanagari) · JetBrains Mono (money/IDs only).

   Same interim ergonomic flat-map shape as window.G (no build step,
   in-browser canvas). Do not hardcode hex in screens/kit — read G2.
   ============================================================ */
(function () {
  // ---- Semantic color, per theme ----
  // Four vivid data roles (present/late/absent/leave) + two secondary
  // states (off/holiday) + one ambiguous state (missing) — every role
  // ships a solid, a soft tint (chip background), and a text shade
  // sized for AA on its own tint.
  const light = {
    // shell (narrow left rail + thin top bar) — deep peacock ink.
    // CALM CHROME: the rail recedes; all colour energy lives in the data.
    shell: "#0F2229", shell2: "#0F2229", onShell: "#E8F1F1", onShellMuted: "rgba(232,241,241,.62)",
    shellActive: "rgba(255,255,255,.10)", shellHover: "rgba(255,255,255,.06)",

    // canvas / surfaces
    bg: "#F7FAFA", surface: "#FFFFFF", raised: "#FFFFFF", sunken: "#EDF4F4",
    border: "#E3EAEB", borderStrong: "#CFDCDE",
    ink: "#18242A", inkMuted: "#5D6E74", inkFaint: "#8B9CA1",
    gutter: "#EDF4F4", alt: "rgba(24,36,42,.015)", sel: "rgba(0,112,124,.06)",
    covered: "rgba(24,36,42,.04)", rule: "rgba(24,36,42,.09)", ruleStrong: "rgba(24,36,42,.16)",

    // brand / accent / focus
    accent: "#00707C", accentSoft: "#D9EEEF", onAccent: "#FFFFFF",
    action: "#00636E", onAction: "#FFFFFF",
    focus: "rgba(0,112,124,.55)",

    // four vivid data roles — used everywhere (chips, glyphs, timeline, rings)
    present: "#1C8C5A", presentTint: "#E1F3EA", presentText: "#146045",
    late: "#C4870C", lateTint: "#FAEFD8", lateText: "#805806",
    absent: "#CE4257", absentTint: "#FAE5E9", absentText: "#92283A",
    leave: "#6C63C7", leaveTint: "#E9E7F7", leaveText: "#443C94",

    // secondary states — weekly-off / holiday / ambiguous (missing swipe)
    off: "#6E8288", offTint: "#E9EFF0", offText: "#47585D",
    holiday: "#B8790F", holidayTint: "#F7EAD2", holidayText: "#7A5209",
    missing: "#7A8E94", missingTint: "#E7EEF0", missingText: "#4E6166",
    penalty: "#A83D6B", penaltyTint: "#F8E4EE", penaltyText: "#7A2A4C",

    // leave-TYPE palette (distinct semantic space from attendance-STATE
    // colors above — a leave donut's colour says "which leave type",
    // never "present/absent"): EL/vacation, Casual, Sick, Comp-off.
    ltEL: "#4C7FBF", ltELTint: "#E4ECF8", ltELText: "#2E4F7D",
    ltCasual: "#6C63C7", ltCasualTint: "#E9E7F7", ltCasualText: "#443C94",
    ltSick: "#2F8F8A", ltSickTint: "#E1F1EF", ltSickText: "#1B5A56",
    ltComp: "#C2913F", ltCompTint: "#F8EDD9", ltCompText: "#7D5A1E",

    // generic state aliases (Badge/StatusPill: approvals, filings, etc.)
    success: "#1C8C5A", onSuccess: "#FFFFFF",
    warning: "#C4870C", onWarning: "#FFFFFF",
    danger: "#CE4257", onDanger: "#FFFFFF",
    info: "#0E9AAE", onInfo: "#FFFFFF",

    // verification seal — warm brass reads as "stamped/on the record"
    seal: "#8A6A2F", sealSoft: "#F0E8D8",
  };

  const dark = {
    // shell stays peacock but deeper — never neutral gray
    shell: "#08100F", shell2: "#08100F", onShell: "#E7EDEE", onShellMuted: "rgba(231,237,238,.60)",
    shellActive: "rgba(255,255,255,.10)", shellHover: "rgba(255,255,255,.06)",

    // deep teal-black canvas, not neutral gray
    bg: "#0D1417", surface: "#131B1F", raised: "#1D272B", sunken: "#0F181B",
    border: "#232E32", borderStrong: "#31403F",
    ink: "#E7EDEE", inkMuted: "#93A3A8", inkFaint: "#6C7C81",
    gutter: "#0F181B", alt: "rgba(255,255,255,.015)", sel: "rgba(40,186,193,.10)",
    covered: "rgba(255,255,255,.04)", rule: "rgba(255,255,255,.09)", ruleStrong: "rgba(255,255,255,.16)",

    accent: "#28BAC1", accentSoft: "#0E2E30", onAccent: "#08181A",
    action: "#28BAC1", onAction: "#08181A",
    focus: "rgba(40,186,193,.55)",

    present: "#45C48A", presentTint: "#102E22", presentText: "#8BE0B8",
    late: "#E0A83E", lateTint: "#2E2408", lateText: "#F0C978",
    absent: "#E8697C", absentTint: "#331319", absentText: "#F5AAB5",
    leave: "#948CE0", leaveTint: "#1D1B33", leaveText: "#C6C1F2",

    off: "#92A6AC", offTint: "#1A2427", offText: "#C2D2D6",
    holiday: "#E0AC4A", holidayTint: "#2E2408", holidayText: "#F0CE8E",
    missing: "#9DB0B6", missingTint: "#1B2528", missingText: "#CBDADE",
    penalty: "#DB84AE", penaltyTint: "#331A26", penaltyText: "#F3B9D4",

    ltEL: "#7FA6E0", ltELTint: "#1B2738", ltELText: "#B7D0F2",
    ltCasual: "#948CE0", ltCasualTint: "#1D1B33", ltCasualText: "#C6C1F2",
    ltSick: "#4FBDB6", ltSickTint: "#132A28", ltSickText: "#9BE0DA",
    ltComp: "#E0AC55", ltCompTint: "#332508", ltCompText: "#F0CE8E",

    success: "#45C48A", onSuccess: "#062014",
    warning: "#E0A83E", onWarning: "#241A05",
    danger: "#E8697C", onDanger: "#2A0B11",
    info: "#2ABFD2", onInfo: "#04191D",

    seal: "#DEB464", sealSoft: "#26200F",
  };

  const G2 = {
    mode: "light",
    light, dark,
    c: light,
    theme(m) { return m === "dark" ? dark : light; },
    setMode(m) { G2.mode = m === "dark" ? "dark" : "light"; G2.c = G2.theme(G2.mode); return G2.c; },

    // ---- Type families ----
    sans: "'Figtree', system-ui, -apple-system, 'Segoe UI', sans-serif",
    deva: "'Mukta', 'Figtree', system-ui, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, 'IBM Plex Mono', Menlo, monospace",
    fw: { r: 400, m: 500, sb: 600, b: 700, xb: 800 },

    // role -> { px, lh (Latin), lhDeva, weight, ls } — bigger, friendlier
    // headings than the retired system; Devanagari line-heights ~+25%
    // for shirorekha + matras + conjuncts; Deva letter-spacing ALWAYS 0.
    type: {
      display: { px: 34, lh: 40, lhDeva: 50, weight: 700, ls: "-0.015em" },
      h1:      { px: 27, lh: 34, lhDeva: 42, weight: 700, ls: "-0.01em" },
      h2:      { px: 20, lh: 27, lhDeva: 33, weight: 700, ls: "-0.005em" },
      h3:      { px: 16, lh: 22, lhDeva: 27, weight: 600, ls: "0" },
      body:    { px: 14.5, lh: 22, lhDeva: 27, weight: 400, ls: "0" },
      small:   { px: 13, lh: 19, lhDeva: 23, weight: 400, ls: "0" },
      caption: { px: 12, lh: 17, lhDeva: 20, weight: 500, ls: "+0.002em" },
      cell:    { px: 13, lh: 18, lhDeva: 22, weight: 400, ls: "0", feat: "'tnum' 1, 'lnum' 1" },
      figure:  { px: 13, lh: 18, lhDeva: 18, weight: 500, ls: "0", feat: "'tnum' 1, 'lnum' 1" },
    },

    // ---- Register metrics (from the shipped design system) ----
    metric: { frameW: 1240, frameH: 828, rail: 214, rowMuster: 34, rowRegister: 40,
              ruleHair: 1, ruleAccent: 2, minMonoCaps: 9.5, minBody: 11 },

    // ---- Space (4px base; design-system gaps 1,2,6,7,9,14,22,48) ----
    sp: { 0: 0, px: 1, "0.5": 2, 1: 4, "1.5": 6, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48, 16: 64, 20: 80, 24: 96 },

    // ---- Radius — ZERO. Design system: "Nothing rounded. Registers have corners."
    //      (pill kept only for the rare true pill: lang switch / avatar) ----
    r: { none: 0, xs: 0, sm: 0, md: 0, lg: 0, xl: 0, "2xl": 0, pill: 9999 },

    // ---- Elevation — cool ink-tinted soft shadows, real elevation (not hairline-only) ----
    el: {
      light: {
        0: "none",
        1: "0 1px 2px -1px rgba(6,32,38,.10), 0 1px 3px rgba(6,32,38,.07)",
        2: "0 6px 14px -4px rgba(6,32,38,.14), 0 2px 6px -2px rgba(6,32,38,.08)",
        3: "0 14px 28px -8px rgba(6,32,38,.18), 0 4px 10px -4px rgba(6,32,38,.10)",
        4: "0 26px 52px -14px rgba(6,32,38,.24), 0 10px 20px -8px rgba(6,32,38,.14)",
        5: "0 34px 68px -18px rgba(6,32,38,.30), 0 14px 28px -12px rgba(6,32,38,.18)",
      },
      dark: {
        0: "none",
        1: "inset 0 1px 0 rgba(220,244,248,.05)",
        2: "inset 0 1px 0 rgba(220,244,248,.06), 0 6px 16px rgba(0,0,0,.45)",
        3: "inset 0 1px 0 rgba(220,244,248,.07), 0 18px 44px rgba(0,0,0,.55)",
        4: "0 28px 60px rgba(0,0,0,.65)",
      },
    },
    surf: { canvas: "#0C1517", 1: "#121F22", 2: "#17272B", 3: "#1D3035", 4: "#24393F" },
    surfBorder: "rgba(220,244,248,.08)",

    // ---- Motion ----
    mo: {
      dur: { instant: 75, fast: 120, base: 180, slow: 280, slower: 420 },
      ease: {
        outQuart: "cubic-bezier(.25,1,.5,1)",
        outQuint: "cubic-bezier(.22,1,.36,1)",
        outExpo: "cubic-bezier(.16,1,.3,1)",
        inOutQuart: "cubic-bezier(.76,0,.24,1)",
        standard: "cubic-bezier(.2,0,0,1)",
      },
      hover: "120ms cubic-bezier(.25,1,.5,1)",
      press: "90ms cubic-bezier(.25,1,.5,1)",
      enter: "180ms cubic-bezier(.16,1,.3,1)",
      exit: "140ms cubic-bezier(.25,1,.5,1)",
      expand: "200ms cubic-bezier(.76,0,.24,1)",
      page: "280ms cubic-bezier(.76,0,.24,1)",
      modal: "280ms cubic-bezier(.16,1,.3,1)",
      reduced: { hover: "80ms linear", press: "0ms", enter: "80ms linear", exit: "80ms linear", expand: "0ms", page: "100ms linear", modal: "100ms linear" },
    },

    // ---- helper: build a CSS style object for a type role (script: 'latin' | 'deva') ----
    t(role, script) {
      const r = G2.type[role] || G2.type.body;
      const deva = script === "deva";
      const s = {
        fontFamily: deva ? G2.deva : G2.sans,
        fontSize: r.px,
        lineHeight: (deva ? r.lhDeva : r.lh) / r.px,
        fontWeight: r.weight,
        letterSpacing: deva ? "0" : r.ls,
      };
      if (r.feat) s.fontFeatureSettings = r.feat;
      return s;
    },
  };

  window.G2 = G2;
})();
