/* ============================================================
   Naveya — Design Tokens  ·  window.G
   Direction: "PEACOCK & SLATE" (chosen 2026-07-22)
     peacock-teal action + interactive/focus accent, on cool teal-slate
     neutrals; ink-graphite primary buttons; states reserved for data.
   Light + Dark at parity, OKLCH-authored (hex here for inline styles).
   Type: Hanken Grotesk (UI) · Mukta (Devanagari) · Anek (display) · JetBrains Mono (figures).

   This flat light/dark shape is the INTERIM ergonomic form for the in-browser
   canvas (no build step). The authoritative future is the three-tier
   ref -> sys -> cmp token system + codegen described in
   docs/design-tokens-research.md §5; the flat `G.light.*` keys map 1:1 onto
   `G.sys.color.*` when codegen lands. Do not hardcode hex in screens — read G.
   ============================================================ */
(function () {
  // ---- Semantic color, per theme (data-state colors are brand-independent) ----
  const light = {
    bg: "#F6F8F9", surface: "#FBFCFD", raised: "#FFFFFF", border: "#DAE1E4",
    ink: "#1B2427", inkMuted: "#57646A",
    accent: "#007B88", accentSoft: "#DCEFF1", onAccent: "#FFFFFF",   // peacock-teal: focus / active / record rule
    action: "#1B2427", onAction: "#F6F8F9",                           // primary button = ink graphite (collision-free)
    brass: "#7E7350",                                                 // verified / on-the-record signal
    success: "#317A45", warning: "#BB7E00", danger: "#D72E2D", info: "#2A7195",
    onSuccess: "#FFFFFF", onWarning: "#1B2427", onDanger: "#FFFFFF", onInfo: "#FFFFFF",
    // focus ring is accent at reduced alpha (2px ring + 2px offset)
    focus: "rgba(0,123,136,.55)",
  };
  const dark = {
    bg: "#0E1416", surface: "#151C1F", raised: "#1D262A", border: "#2C363A",
    ink: "#EAEEEF", inkMuted: "#9BA7AB",
    accent: "#28BAC1", accentSoft: "#103033", onAccent: "#06191B",
    action: "#EAEEEF", onAction: "#0E1416",
    brass: "#C9B678",
    success: "#71C791", warning: "#E9B452", danger: "#EF675C", info: "#6DB5DA",
    onSuccess: "#08160B", onWarning: "#241A05", onDanger: "#2A0B09", onInfo: "#06171F",
    focus: "rgba(40,186,193,.55)",
  };

  const G = {
    // ---- theme state (screens should drive mode via React state/context and
    //      read G.theme(mode); G.c/G.mode are the static default for artboards) ----
    mode: "light",
    light, dark,
    c: light,
    theme(m) { return m === "dark" ? dark : light; },
    setMode(m) { G.mode = m === "dark" ? "dark" : "light"; G.c = G.theme(G.mode); return G.c; },

    // ---- Type families (both scripts first-class; Devanagari auto-switches by unicode-range) ----
    sans: "'Hanken Grotesk', system-ui, -apple-system, 'Segoe UI', sans-serif",
    deva: "'Mukta', 'Hanken Grotesk', system-ui, sans-serif",
    display: "'Anek Latin', 'Hanken Grotesk', sans-serif",
    displayDeva: "'Anek Devanagari', 'Mukta', sans-serif",
    mono: "'JetBrains Mono', ui-monospace, 'IBM Plex Mono', Menlo, monospace",
    fw: { r: 400, m: 500, sb: 600, b: 700 },

    // role -> { px, lh (Latin), lhDeva, weight, ls, feat? }
    // Devanagari line-heights are ~+20% for shirorekha + matras + conjuncts; Deva letter-spacing is ALWAYS 0.
    type: {
      display: { px: 40, lh: 44, lhDeva: 52, weight: 600, ls: "-0.02em" },
      h1:      { px: 26, lh: 32, lhDeva: 38, weight: 600, ls: "-0.01em" },
      h2:      { px: 20, lh: 28, lhDeva: 32, weight: 600, ls: "-0.005em" },
      h3:      { px: 16, lh: 24, lhDeva: 28, weight: 600, ls: "0" },
      body:    { px: 14, lh: 20, lhDeva: 24, weight: 400, ls: "0" },
      caption: { px: 12.5, lh: 18, lhDeva: 20, weight: 400, ls: "+0.004em" },
      cell:    { px: 13, lh: 18, lhDeva: 22, weight: 400, ls: "0", feat: "'tnum' 1, 'lnum' 1" },
      figure:  { px: 13, lh: 18, lhDeva: 18, weight: 500, ls: "0", feat: "'tnum' 1, 'lnum' 1" },
    },

    // ---- Space (4px base, key = px/4, Tailwind 1:1) ----
    sp: { 0: 0, px: 1, "0.5": 2, 1: 4, "1.5": 6, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48, 16: 64, 20: 80, 24: 96 },

    // ---- Radius (crisp controls @6, soft surfaces, concentric: inner = outer − padding) ----
    r: { none: 0, xs: 4, sm: 6, md: 8, lg: 12, xl: 16, "2xl": 20, pill: 9999 },

    // ---- Elevation, per theme. Light = soft cool shadow; Dark = surface ladder + top-lit hairline.
    //      Data rows NEVER get elevation — registers use rules/borders. ----
    el: {
      light: {
        0: "none",
        1: "0 1px 2px -1px rgba(22,28,45,.08), 0 1px 3px rgba(22,28,45,.06)",
        2: "0 4px 8px -2px rgba(22,28,45,.10), 0 2px 4px -2px rgba(22,28,45,.06)",
        3: "0 12px 24px -6px rgba(22,28,45,.14), 0 4px 8px -4px rgba(22,28,45,.08)",
        4: "0 24px 48px -12px rgba(22,28,45,.22), 0 8px 16px -8px rgba(22,28,45,.12)",
        5: "0 32px 64px -16px rgba(22,28,45,.28), 0 12px 24px -12px rgba(22,28,45,.16)",
      },
      dark: {
        0: "none",
        1: "inset 0 1px 0 rgba(255,255,255,.05)",
        2: "inset 0 1px 0 rgba(255,255,255,.06), 0 4px 12px rgba(0,0,0,.4)",
        3: "inset 0 1px 0 rgba(255,255,255,.07), 0 16px 40px rgba(0,0,0,.5)",
        4: "0 24px 56px rgba(0,0,0,.6)",
      },
    },
    // dark elevation-by-surface ladder (lighter surface = higher)
    surf: { canvas: "#0E1416", 1: "#151C1F", 2: "#1D262A", 3: "#232D31", 4: "#283338" },
    surfBorder: "rgba(255,255,255,.07)",

    // ---- Motion (snappy productivity ramp; swap the whole map for reduced-motion, never global-kill) ----
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
      const r = G.type[role] || G.type.body;
      const deva = script === "deva";
      const s = {
        fontFamily: deva ? (role === "display" || role === "h1" ? G.displayDeva : G.deva) : (role === "display" ? G.display : G.sans),
        fontSize: r.px,
        lineHeight: (deva ? r.lhDeva : r.lh) / r.px,
        fontWeight: r.weight,
        letterSpacing: deva ? "0" : r.ls,
      };
      if (r.feat) s.fontFeatureSettings = r.feat;
      return s;
    },
  };

  window.G = G;
})();
