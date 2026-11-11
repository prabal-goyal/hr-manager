/* @jsxRuntime classic */
/* ============================================================
   Naveya — Component Kit v3 · window.UI3
   CANONICAL. Pairs with design/v3/tokens.jsx (window.G3),
   direction "STAFFROOM TERRACOTTA" (cream ground, cocoa rail, clay
   accent). The kit reads every colour, family and radius from G3, so
   the 2026-09-03 warm rebase changed tokens, not components.

   Layout language: exploration A (Keka-style cards — containment,
   real padding, soft radius, colour-blocked cards, rings, illustrated
   quiet states, low-opacity page motif) PLUS exploration C's
   full-width welcome band.

   Rules encoded here so screens cannot break them:
   · No hex literals — every colour comes from G3.
   · Every figure renders through Figure/inr in JetBrains Mono,
     tabular, Indian lakh-crore grouped, never abbreviated.
   · One language at a time. t() only; no dual "Today | आज" labels.
   · Radius is non-zero, cards carry border + soft shadow.
   · Tables only exist inside <Register>, which lives inside a Card.
   · State is glyph + word, never colour alone.
   ============================================================ */
(function () {
  const G3 = window.G3;
  const { useState, useEffect, useContext, createContext, useMemo, useCallback, useRef } = React;

  /* ============================================================
     1. MONEY / FIGURES
     ============================================================ */

  /* Indian lakh-crore grouping with paise. ₹1,26,44,180.00
     Never 12,644,180. Never 1.26Cr. Never truncated. */
  function inr(n, opts) {
    const o = opts || {};
    const neg = n < 0;
    const fixed = Math.abs(n).toFixed(o.paise === false ? 0 : 2);
    const parts = fixed.split(".");
    const intPart = parts[0];
    const dec = parts[1];
    const last3 = intPart.length > 3 ? intPart.slice(-3) : intPart;
    const rest = intPart.length > 3 ? intPart.slice(0, -3) : "";
    const grouped = rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + last3 : last3;
    return (neg ? "−" : "") + "₹" + grouped + (dec ? "." + dec : "");
  }

  /* plain integer grouping (counts, days) — same Indian system */
  function num(n) {
    const s = String(Math.abs(Math.round(n)));
    const last3 = s.length > 3 ? s.slice(-3) : s;
    const rest = s.length > 3 ? s.slice(0, -3) : "";
    const g = rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + last3 : last3;
    return (n < 0 ? "−" : "") + g;
  }

  /* minutes -> localized duration. Demo content is translated too. */
  function dur(min, lang) {
    if (min == null) return "—";
    const h = Math.floor(min / 60);
    const m = String(min % 60).padStart(2, "0");
    return h + "h " + m + "m";
  }

  function Figure({ value, size, weight, color, align, style, title }) {
    return (
      <span
        title={title}
        style={G3.fig(size || "sm", Object.assign(
          { fontWeight: weight || 500, color: color, textAlign: align || undefined, display: align ? "block" : "inline" },
          style || {}
        ))}
      >
        {value}
      </span>
    );
  }

  /* ============================================================
     2. i18n — one language at a time, en + hi complete
     ============================================================ */
  const STRINGS = { en: {} };

  /* ONE TABLE. The product ships in English; a dict that still carries
     a second script has it ignored rather than half-loaded. */
  function addStrings(dict) {
    const src = dict && (dict.en || dict);
    if (!src) return;
    Object.keys(src).forEach((k) => { STRINGS.en[k] = src[k]; });
  }

  function translate(lang, key, vars) {
    let out = STRINGS.en[key];
    if (out == null) return key; /* visible signal: a missing string */
    if (typeof out === "function") return out(vars || {});
    if (vars) {
      Object.keys(vars).forEach((v) => { out = out.split("{" + v + "}").join(String(vars[v])); });
    }
    return out;
  }

  const LangCtx = createContext(null);

  /* The provider stays, because `t` and `ty` are how every string
     reaches a screen. What it no longer does is choose. */
  function LangProvider({ children }) {
    const value = useMemo(() => ({
      lang: "en",
      script: "latin",
      t: (key, vars) => translate("en", key, vars),
      ty: (role, extra) => G3.t(role, "latin", extra),
      dur: (min) => dur(min, "en"),
    }), []);
    return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
  }

  function useLang() {
    const ctx = useContext(LangCtx);
    if (!ctx) throw new Error("useLang outside LangProvider");
    return ctx;
  }

  /* ============================================================
     3. Theme
     ============================================================ */
  const ThemeCtx = createContext(null);

  function ThemeProvider({ initialMode, children }) {
    const [mode, setModeRaw] = useState(initialMode === "dark" ? "dark" : "light");
    const setMode = useCallback((m) => {
      const next = m === "dark" ? "dark" : "light";
      setModeRaw(next);
      try { localStorage.setItem("naveya-theme", next); } catch (e) { /* storage unavailable */ }
      if (document && document.documentElement) document.documentElement.dataset.theme = next;
    }, []);
    useEffect(() => { if (document && document.documentElement) document.documentElement.dataset.theme = mode; }, [mode]);
    const c = G3.theme(mode);
    const value = useMemo(() => ({
      mode,
      setMode,
      c,
      toggle: () => setMode(mode === "dark" ? "light" : "dark"),
      shadow: (step) => G3.shadow(mode, step),
    }), [mode, setMode, c]);
    return (
      <ThemeCtx.Provider value={value}>
        <style>{
          "*{box-sizing:border-box}" +
          "body{margin:0;background:" + c.page + ";}" +
          ".nv3 button{font-family:inherit;cursor:pointer}" +
          ".nv3 :focus-visible{outline:2px solid " + c.focus + ";outline-offset:2px;border-radius:" + G3.r.sm + "px}" +
          ".nv3 ::selection{background:" + c.sel + "}" +
          /* a register row you can act on lifts under the pointer; one
             you cannot stays flat. The actions cell lifts a shade
             further, so the menu reads as its own target. */
          ".nv3 tr.nv3-row-live:hover{background:" + c.sunken + "}" +
          ".nv3 tr.nv3-row-live{transition:background " + G3.mo.hover + "}" +
          /* a whole card you can open lifts the same way a live row
             does -- the arrow says it goes somewhere, the lift says
             the pointer is on it */
          ".nv3 .nv3-tile{transition:background " + G3.mo.hover + ", border-color " + G3.mo.hover + "}" +
          /* INLINE STYLES BEAT A STYLESHEET. Every tile that set its own
             rest background inline — which is all four of them — had a
             hover rule that never once applied. In an inline-style
             product the only way a hover state can win is !important. */
          ".nv3 .nv3-tile:hover{background:" + c.sunken + " !important;border-color:" + c.borderStrong + " !important}" +
          /* WHEN A WRAPPED ROW REORDERS ITSELF. Home's three columns
             fit side by side down to a 1252px window; under that the
             row wraps, and the column holding what is live for her
             right now would land at the bottom. It goes first
             instead -- the only breakpoint in the product, and it
             exists because the alternative is scrolling past four
             cards to find out whether you are clocked in. */
          "@media (max-width: 1251px){.nv3 .nv3-live-first{order:-1}}" +
          /* THE TOP BAR is fixed; the page starts under it (and under
             the sub-tab row when a section adds one). Sticky panels
             move down by the same amount, and the per-page theme
             buttons step aside -- the account menu holds that now. */
          ".nv3:has(> .nv3-topbar) > main{padding-top:" + G3.layout.topBarH + "px}" +
          ".nv3:has(> .nv3-topbar .nv3-subtabs) > main{padding-top:" + (G3.layout.topBarH + G3.layout.subTabsH) + "px}" +
          ".nv3:has(> .nv3-topbar) > main [style*=\"position: sticky\"]{top:" + (G3.layout.topBarH + G3.layout.gap) + "px !important}" +
          ".nv3:has(> .nv3-topbar .nv3-subtabs) > main [style*=\"position: sticky\"]{top:" + (G3.layout.topBarH + G3.layout.subTabsH + G3.layout.gap) + "px !important}" +
          ".nv3:has(> .nv3-topbar) > main .nv3-theme-toggle{display:none !important}" +
          /* THE PHONE. Under layout.phoneMax the rail gives its width
             back and the TabBar takes the bottom edge; the gutter
             tightens; the page keeps clear of the bar; the decorative
             motif goes, because on a 390px screen it sits under data.
             !important because every one of these is set inline. */
          "@media (max-width: " + G3.layout.phoneMax + "px){" +
            ".nv3 .nv3-rail{width:0 !important;flex:0 0 0px !important}" +
            ".nv3 .nv3-rail-col{display:none !important}" +
            ".nv3 .nv3-tabbar{display:flex !important}" +
            ".nv3 .nv3-topbar{left:0 !important}" +
            ".nv3 .nv3-topbar-wide{display:none !important}" +
            ".nv3 .nv3-topbar-search{flex:0 0 40px !important;padding:0 !important;justify-content:center}" +
            /* a register is wider than a phone; it scrolls inside its
               card instead of pushing the page sideways */
            ".nv3 main table{display:block;max-width:100%;overflow-x:auto}" +
            /* a chip may wrap its words rather than run past its card */
            ".nv3 main .nv3-chip{max-width:100% !important;white-space:normal !important}" +
            /* the six-column boards (Payroll home) stack: money is never
               squeezed until it truncates */
            ".nv3 main [style*=\"repeat(6, minmax(0\"]{grid-template-columns:minmax(0,1fr) !important}" +
            ".nv3 main [style*=\"repeat(6, minmax(0\"] > *{grid-column:1 / -1 !important}" +
            /* a page header holding the campus switch wraps it onto its
               own line, and the switch scrolls rather than overflowing */
            ".nv3 main div:has(> div > .nv3-campus-switch), .nv3 main div:has(> .nv3-campus-switch){flex-wrap:wrap !important}" +
            ".nv3 main .nv3-campus-switch{max-width:100%;overflow-x:auto}" +
            /* column dividers become stray left stripes once a row wraps */
            ".nv3 main [data-wrap-divider]{border-left:none !important;padding-left:0 !important}" +
            /* the layout.colNarrow side panel (13 screens) is wider than
               a phone: it drops under its main column at full width */
            ".nv3 main div:has(> [style*=\"flex: 0 0 " + G3.layout.colNarrow + "px\"]){flex-wrap:wrap !important}" +
            ".nv3 main [style*=\"flex: 0 0 " + G3.layout.colNarrow + "px\"]{flex:1 1 100% !important;width:100% !important;position:static !important}" +
            ".nv3 main > div[aria-hidden=\"true\"]{display:none !important}" +
            ".nv3 main > div:not([aria-hidden=\"true\"]){" +
              "padding-left:" + G3.layout.phonePadX + "px !important;" +
              "padding-right:" + G3.layout.phonePadX + "px !important;" +
              "padding-bottom:calc(" + (G3.layout.tabBarH + G3.layout.gap) + "px + env(safe-area-inset-bottom)) !important}" +
          "}" +
          "@media (prefers-reduced-motion: reduce){.nv3 *{transition-duration:.01ms !important;animation-duration:.01ms !important}}"
        }</style>
        {children}
      </ThemeCtx.Provider>
    );
  }

  function useTheme() {
    const ctx = useContext(ThemeCtx);
    if (!ctx) throw new Error("useTheme outside ThemeProvider");
    return ctx;
  }

  /* ============================================================
     4. Icons — 20px stroke set, currentColor
     ============================================================ */
  const PATHS = {
    home: <path d="M3.5 9.5 10 3.8l6.5 5.7M5 8.6V16h10V8.6M8.2 16v-3.8h3.6V16" />,
    attendance: <g><rect x="3" y="4.5" width="14" height="12" rx="1.6" /><path d="M3 8.2h14M7 3v3M13 3v3M7.2 12.2l1.9 1.9 3.7-3.7" /></g>,
    leave: <g><rect x="3" y="4.5" width="14" height="12" rx="1.6" /><path d="M3 8.2h14M7 3v3M13 3v3M7.6 12.6h4.8" /></g>,
    payslip: <g><rect x="2.6" y="5.4" width="14.8" height="9.4" rx="1.6" /><circle cx="10" cy="10.1" r="2.2" /><path d="M5.2 8v.01M14.8 12.3v.01" /></g>,
    document: <path d="M5.6 3h5.9L15 6.5V17H5.6zM11.1 3v3.6h3.6M7.6 10.4h4.8M7.6 13.4h4.8" />,
    profile: <g><circle cx="10" cy="7" r="3" /><path d="M4.6 16.6c.8-3 3-4.6 5.4-4.6s4.6 1.6 5.4 4.6" /></g>,
    payroll: <g><rect x="3" y="3.4" width="14" height="13.2" rx="1.6" /><path d="M6.4 7.2h7.2M6.4 10.2h4.4M6.4 13.2h5.8" /></g>,
    staff: <g><circle cx="7.4" cy="7.2" r="2.6" /><path d="M2.8 16.4c.6-2.7 2.4-4.2 4.6-4.2s4 1.5 4.6 4.2" /><path d="M13.4 5.2a2.6 2.6 0 0 1 0 5M14.6 12.6c1.5.5 2.4 1.9 2.7 3.8" /></g>,
    filing: <g><path d="M4.4 3.6h11.2v12.8H4.4z" /><path d="M7.2 7h5.6M7.2 10h5.6M7.2 13h3.2" /></g>,
    scan: <g><path d="M3 7V4.6A1.6 1.6 0 0 1 4.6 3H7M13 3h2.4A1.6 1.6 0 0 1 17 4.6V7M17 13v2.4a1.6 1.6 0 0 1-1.6 1.6H13M7 17H4.6A1.6 1.6 0 0 1 3 15.4V13" /><path d="M6.6 10h6.8" /></g>,
    sun: <g><circle cx="10" cy="10" r="3.4" /><path d="M10 2.8v2M10 15.2v2M2.8 10h2M15.2 10h2M4.9 4.9l1.4 1.4M13.7 13.7l1.4 1.4M15.1 4.9l-1.4 1.4M6.3 13.7l-1.4 1.4" /></g>,
    moon: <path d="M16.2 12.2A6.8 6.8 0 0 1 7.8 3.8a6.8 6.8 0 1 0 8.4 8.4z" />,
    check: <path d="M4.4 10.4l3.5 3.5 7.7-7.8" />,
    alert: <g><path d="M10 3.4 17.2 16H2.8z" /><path d="M10 8v3.4M10 13.6v.01" /></g>,
    clock: <g><circle cx="10" cy="10" r="7" /><path d="M10 5.8V10l2.8 1.8" /></g>,
    download: <path d="M10 3.6v8.8M6.4 9.2 10 12.8l3.6-3.6M4 15.6h12" />,
    arrow: <path d="M4.2 10h11M11 5.8 15.2 10 11 14.2" />,
    signout: <path d="M12.4 6V4.4H4v11.2h8.4V14M8.6 10h8.2M14.4 7.4 17 10l-2.6 2.6" />,
    lock: <g><rect x="4.4" y="8.6" width="11.2" height="7.6" rx="1.6" /><path d="M7 8.6V6.6a3 3 0 0 1 6 0v2" /></g>,
    /* row-action + Keka-parity additions — same thin stroke-only idiom.
       "more"/"list" carry a small solid-dot accent (a 1px stroked ring
       reads as nothing at 14-18px); every other new glyph is pure stroke. */
    more: <g><circle cx="4.6" cy="10" r="1.3" fill="currentColor" stroke="none" /><circle cx="10" cy="10" r="1.3" fill="currentColor" stroke="none" /><circle cx="15.4" cy="10" r="1.3" fill="currentColor" stroke="none" /></g>,
    briefcase: <g><rect x="3" y="7.2" width="14" height="9" rx="1.6" /><path d="M7.4 7.2V5.6a1.6 1.6 0 0 1 1.6-1.6h2a1.6 1.6 0 0 1 1.6 1.6v1.6" /><path d="M3 11.4h14" /></g>,
    half: <g><circle cx="10" cy="10" r="7" /><path d="M10 3a7 7 0 0 1 0 14z" fill="currentColor" stroke="none" /></g>,
    list: <g><path d="M6.4 5.6h9.4M6.4 10h9.4M6.4 14.4h9.4" /><circle cx="3.4" cy="5.6" r="0.9" fill="currentColor" stroke="none" /><circle cx="3.4" cy="10" r="0.9" fill="currentColor" stroke="none" /><circle cx="3.4" cy="14.4" r="0.9" fill="currentColor" stroke="none" /></g>,
    globe: <g><circle cx="10" cy="10" r="7" /><path d="M3 10h14M10 3c2.3 2 2.3 12 0 14M10 3c-2.3 2-2.3 12 0 14" /></g>,
    arrowUp: <path d="M10 16V4.6M5.6 9 10 4.6 14.4 9" />,
    festival: <g><path d="M10 2.8v1.9M4.9 5.1l1.4 1.4M15.1 5.1l-1.4 1.4" /><path d="M5.2 16.8c0-3.6 2.1-6 4.8-6s4.8 2.4 4.8 6" /><path d="M2.8 16.8h14.4" /></g>,
    mail: <g><rect x="2.8" y="4.6" width="14.4" height="10.8" rx="1.8" /><path d="M3.6 6.2 10 11l6.4-4.8" /></g>,
    plus: <path d="M10 4.4v11.2M4.4 10h11.2" />,
    /* a handset, for the SMS half of a one-time code. The dot is the
       speaker grille; without it the glyph reads as a blank card. */
    phone: <g><rect x="5.6" y="2.6" width="8.8" height="14.8" rx="2" /><path d="M8.8 5h2.4" /><circle cx="10" cy="14.4" r="0.9" fill="currentColor" stroke="none" /></g>,
    /* DISCLOSURE, not navigation. `arrow` laid on its side reads as
       a download; a caret is the one mark that means "there is more
       of this under here". It points DOWN at rest and turns 180. */
    chevron: <path d="M5.8 8.2 10 12.4l4.2-4.2" />,
    /* top bar: find, be told, and the requests tray */
    search: <g><circle cx="9" cy="9" r="5.2" /><path d="M13 13l3.8 3.8" /></g>,
    bell: <path d="M5.2 13.6V9.2a4.8 4.8 0 0 1 9.6 0v4.4l1.4 1.8H3.8zM8.2 17.2a1.9 1.9 0 0 0 3.6 0" />,
    inbox: <g><path d="M3 11.2 5 4.6h10l2 6.6v4.6H3z" /><path d="M3 11.2h4l1 2h4l1-2h4" /></g>,
    close: <path d="M5.5 5.5l9 9M14.5 5.5l-9 9" />,
  };

  /* thin-stroke outline set: one consistent weight everywhere (~1.7px in
     a 20-unit viewBox, so it scales proportionally at any render size —
     14-18px chip glyphs read the same weight as the 20px rail icons).
     Do not pass a heavier strokeWidth per-call; if a glyph reads too
     light at a specific size, that is a size problem, not a weight one. */
  function Icon({ name, size, style, strokeWidth }) {
    const d = PATHS[name] || PATHS.home;
    const s = size || 20;
    return (
      <svg
        width={s} height={s} viewBox="0 0 20 20" fill="none" stroke="currentColor"
        strokeWidth={strokeWidth || 1.7} strokeLinecap="round" strokeLinejoin="round"
        style={style} aria-hidden="true" focusable="false"
      >
        {d}
      </svg>
    );
  }

  /* the authored nav (नाव) boat mark — a hull on a waterline with a
     mast and sail. Naveya = "of the boat / vessel". Not a logo cliche,
     not kitsch. */
  function BoatMark({ size, style }) {
    const s = size || 34;
    return (
      <svg width={s} height={s} viewBox="0 0 40 40" fill="none" style={style} aria-hidden="true" focusable="false">
        <g stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M6 25.5h28" />
          <path d="M8.5 25.5c3.2 5.6 7.3 8.4 11.5 8.4s8.3-2.8 11.5-8.4" />
          <path d="M20 25.5V7.5" />
          <path d="M20 7.5c5.6 2.7 8.6 7.5 9.6 14" />
        </g>
        <circle cx="11.5" cy="9.5" r="1.9" fill="currentColor" />
      </svg>
    );
  }

  /* ============================================================
     5. Artwork — "Corridor Study"
     Nested school-corridor arches, offset paper planes, ledger rules
     and register ticks. Colour-parameterised so one drawing serves
     both the welcome band and the faint page ground.
     ============================================================ */
  function Artwork({ line, brass, accent, planeA, planeB, style, width }) {
    const arch = (cx, base, rad) =>
      "M " + (cx - rad) + " " + base + " A " + rad + " " + rad + " 0 0 1 " + (cx + rad) + " " + base;
    const ticks = [];
    for (let x = 36; x <= 744; x += 16) ticks.push(<line key={"t" + x} x1={x} y1={214} x2={x} y2={219} stroke={line} strokeWidth="1" />);
    const dots = [];
    for (let row = 0; row < 3; row++) {
      for (let q = 0; q < 7; q++) dots.push(<circle key={"d" + row + "-" + q} cx={40 + q * 14} cy={30 + row * 14} r="1.3" fill={line} />);
    }
    return (
      <svg width={width || 780} height={230 * ((width || 780) / 780)} viewBox="0 0 780 230" fill="none" style={style} aria-hidden="true" focusable="false">
        {[148, 160, 172, 184, 196].map((y) => (
          <line key={y} x1="28" y1={y} x2="752" y2={y} stroke={line} strokeWidth="1" />
        ))}
        <rect x="404" y="24" width="212" height="178" fill={planeA} transform="rotate(-4 510 113)" />
        <rect x="448" y="42" width="212" height="172" fill={planeB} transform="rotate(3 554 128)" />
        {[96, 78, 60, 42].map((rad, i) => (
          <path key={"a" + rad} d={arch(560, 206, rad)} stroke={i === 0 ? brass : line} strokeWidth={i === 0 ? 1.6 : 1} />
        ))}
        {[64, 48, 32].map((rad, i) => (
          <path key={"b" + rad} d={arch(348, 206, rad)} stroke={i === 0 ? accent : line} strokeWidth={i === 0 ? 1.4 : 1} />
        ))}
        {[48, 32, 18].map((rad, i) => (
          <path key={"c" + rad} d={arch(708, 206, rad)} stroke={i === 2 ? brass : line} strokeWidth="1" />
        ))}
        <line x1="252" y1="206" x2="768" y2="206" stroke={brass} strokeWidth="1.2" />
        <circle cx="286" cy="58" r="34" stroke={brass} strokeWidth="1.2" />
        <path d="M286 24v10M286 82v10M252 58h10M310 58h10" stroke={brass} strokeWidth="1" />
        <path d="M700 22h56v56" stroke={accent} strokeWidth="1.2" />
        <path d="M756 78A56 56 0 0 0 700 22" stroke={accent} strokeWidth="1.2" />
        {ticks}
        {dots}
      </svg>
    );
  }

  /* the page-ground motif: the same study, barely there, under all cards */
  function Motif({ top, right, scale }) {
    const { c, mode } = useTheme();
    const dark = mode === "dark";
    return (
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          right: right == null ? -70 : right,
          top: top == null ? 420 : top,
          pointerEvents: "none",
          zIndex: 0,
          transform: "scale(" + (scale || 1.35) + ")",
          transformOrigin: "top right",
          opacity: dark ? 0.4 : 0.55,
        }}
      >
        <Artwork
          line={c.motifLine}
          brass={c.motifBrass}
          accent={c.motifAccent}
          planeA={c.motifPlaneA}
          planeB={c.motifPlaneB}
        />
      </div>
    );
  }

  /* ambient linework for the sign-in brand panel: quiet water lines */
  function PanelRipples({ style }) {
    return (
      <svg viewBox="0 0 760 190" preserveAspectRatio="xMidYMax slice" style={style} aria-hidden="true" focusable="false">
        <g fill="none" stroke="currentColor" strokeOpacity="0.14" strokeWidth="1.4">
          <path d="M-20 44 Q 170 16 380 44 T 780 44" />
          <path d="M-20 84 Q 170 56 380 84 T 780 84" />
          <path d="M-20 124 Q 170 96 380 124 T 780 124" />
          <path d="M-20 164 Q 170 136 380 164 T 780 164" />
        </g>
      </svg>
    );
  }

  /* ---- flat scene illustrations (ported from the winning "Staffroom
     Terracotta" exploration, design/v2/explore/home-d.jsx). Every fill
     is a G3 role: clay roof, sage foliage, cocoa trunk, honey sun. The
     only picture-only tokens are illoWall / illoSun. ---- */

  /* the schoolhouse, tree and morning sun that anchor the home hero */
  function SchoolScene({ width }) {
    const { c } = useTheme();
    const w = width || 330;
    return (
      <svg width={w} height={Math.round((w * 132) / 330)} viewBox="0 0 330 132" fill="none" aria-hidden="true" focusable="false" style={{ display: "block" }}>
        <circle cx="258" cy="38" r="27" fill={c.illoSun} opacity=".18" />
        <circle cx="258" cy="38" r="20" fill={c.illoSun} />
        {/* soft ground — the ellipses run past the viewBox and the SVG clips them */}
        <ellipse cx="70" cy="150" rx="130" ry="52" fill={c.presentTint} />
        <ellipse cx="285" cy="158" rx="150" ry="58" fill={c.accentSoft} />
        <g>
          <rect x="150" y="66" width="76" height="48" rx="5" fill={c.illoWall} />
          <path d="M144 68 188 40l44 28Z" fill={c.accent} />
          <rect x="180" y="86" width="16" height="28" rx="3" fill={c.action} />
          <rect x="158" y="78" width="13" height="12" rx="2.5" fill={c.illoSun} opacity=".8" />
          <rect x="205" y="78" width="13" height="12" rx="2.5" fill={c.illoSun} opacity=".8" />
          <circle cx="188" cy="60" r="6" fill={c.surface} />
          <path d="M188 57v3l2 1.5" stroke={c.ink} strokeWidth="1.3" strokeLinecap="round" fill="none" />
        </g>
        <g>
          <rect x="106" y="88" width="7" height="26" rx="3" fill={c.rail} opacity=".75" />
          <circle cx="109" cy="74" r="20" fill={c.present} opacity=".85" />
          <circle cx="95" cy="84" r="12" fill={c.present} opacity=".6" />
        </g>
        <path d="M60 40c3-3 6-3 9 0M76 32c3-3 6-3 9 0" stroke={c.inkFaint} strokeWidth="1.6" strokeLinecap="round" fill="none" />
      </svg>
    );
  }

  /* an HR-initiated request waiting on the employee: a form in an open
     envelope. The badge is a CLOCK ("awaiting"), deliberately not a
     plus — a plus would imply the employee can add a document, which
     document governance forbids (they only ever respond to a request). */
  function RequestArt({ width }) {
    const { c } = useTheme();
    const w = width || 76;
    return (
      <svg width={w} height={Math.round((w * 64) / 76)} viewBox="0 0 76 64" fill="none" aria-hidden="true" focusable="false" style={{ display: "block" }}>
        <rect x="8" y="20" width="60" height="38" rx="7" fill={c.raised} stroke={c.brassBorder} strokeWidth="1.5" />
        <rect x="20" y="6" width="36" height="34" rx="4" fill={c.surface} stroke={c.border} strokeWidth="1.5" />
        <path d="M26 15h24M26 21h24M26 27h16" stroke={c.inkFaint} strokeWidth="2" strokeLinecap="round" />
        <path d="M8 27l30 18 30-18" stroke={c.brassBorder} strokeWidth="1.5" fill="none" />
        <circle cx="62" cy="14" r="9" fill={c.accent} />
        <path d="M62 9.4V14l3 1.9" stroke={c.onAccent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    );
  }

  /* ============================================================
     6. Toggles
     ============================================================ */
  function ThemeToggle({ onDark }) {
    const { mode, toggle, c, shadow } = useTheme();
    const { t } = useLang();
    const label = mode === "dark" ? t("theme.toLight") : t("theme.toDark");
    return (
      <button
        type="button" onClick={toggle} aria-label={label} title={label}
        className="nv3-theme-toggle"
        style={{
          width: 34, height: 34, borderRadius: G3.r.pill,
          border: "1px solid " + (onDark ? c.railBorder : c.border),
          background: onDark ? "transparent" : c.surface,
          color: onDark ? c.onRailMuted : c.inkMuted,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: onDark ? "none" : shadow(1),
          transition: "color " + G3.mo.hover,
        }}
      >
        <Icon name={mode === "dark" ? "sun" : "moon"} size={17} />
      </button>
    );
  }

  /* The language switcher is gone with the second script. The export
     survives as nothing at all, so a page that has not dropped its
     mount yet renders nothing rather than throwing. */
  function LangSwitcher() { return null; }

  /* ============================================================
     7. Rail — role-scoped nav. RBAC = permission x scope: the rail
     takes a role, resolves its permission set, and filters items.
     One app, one rail, filtered per role.
     ============================================================ */
  /* Screen keys are globally unique, so routing stays a flat table. A role's
     rail carries its OWN work first, then the self-service it is also
     entitled to — a department head still takes leave. `group` drives the
     divider between the two. Screen codes cite docs/screen-inventory.md. */
  const NAV_ITEMS = [
    /* employee self-service (EMP-*) */
    { key: "home", icon: "home", label: "nav.home", perm: "self.home.view", group: "self" },
    { key: "attendance", icon: "attendance", label: "nav.attendance", perm: "self.attendance.read", group: "self" },
    { key: "leave", icon: "leave", label: "nav.leave", perm: "self.leave.read", group: "self" },
    { key: "payslips", icon: "payslip", label: "nav.payslips", perm: "self.payslip.read", group: "self" },
    { key: "documents", icon: "document", label: "nav.documents", perm: "self.document.respond", group: "self" },
    { key: "profile", icon: "profile", label: "nav.profile", perm: "self.profile.read", group: "self" },
    /* EMP-20 / DH-05 — the department, read as a roster. A teacher
       puts a name to a face before she asks for cover; a head of
       department had no screen at all that simply listed who is on
       her team, only queues of what they had asked for. */
    { key: "myTeam", icon: "staff", label: "nav.myTeam", perm: "self.team.view", group: "self" },
    /* Department Head (DH-01/02/03/05) */
    { key: "dhHome", icon: "home", label: "nav.dhHome", perm: "dept.home.view", group: "role" },
    /* DH-05 — the same screen as the teacher's My team below, in the
       half of the rail where it is her work rather than her own. A
       role holds `dept.team.read` or `self.team.view`, never both, so
       it can never appear twice. */
    { key: "myTeam", icon: "staff", label: "nav.myTeam", perm: "dept.team.read", group: "role" },
    { key: "dhLeave", icon: "leave", label: "nav.dhLeave", perm: "dept.leave.approve", group: "role" },
    { key: "dhAttendance", icon: "attendance", label: "nav.dhAttendance", perm: "dept.attendance.read", group: "role" },
    /* Campus Principal (PR-01/02/03) */
    { key: "prHome", icon: "home", label: "nav.prHome", perm: "campus.home.view", group: "role" },
    { key: "prAttendance", icon: "attendance", label: "nav.prAttendance", perm: "campus.attendance.read", group: "role" },
    { key: "prLeave", icon: "leave", label: "nav.prLeave", perm: "campus.leave.escalation", group: "role" },
    { key: "staff", icon: "staff", label: "nav.staff", perm: "campus.staff.read", group: "role" },
    /* Director (DR-01/02/03) — trust-wide. Leave oversight, the
       signature on long absences, and (designer, 2026-09-24) a
       read-only campus view: he supervises no register, but he is
       accountable for both schools being staffed. */
    { key: "drHome", icon: "globe", label: "nav.drHome", perm: "dir.home.view", group: "role" },
    { key: "drCampus", icon: "attendance", label: "nav.drCampus", perm: "dir.campus.read", group: "role" },
    { key: "staff", icon: "staff", label: "nav.staff", perm: "dir.staff.read", group: "role" },
    { key: "drLeave", icon: "leave", label: "nav.drLeave", perm: "dir.leave.decide", group: "role" },
    /* HR Operator (HR-01/02/09) */
    { key: "hrHome", icon: "home", label: "nav.hrHome", perm: "hr.queue.view", group: "role" },
    { key: "hrStaff", icon: "staff", label: "nav.hrStaff", perm: "staff.read", group: "role" },
    /* Doc control absorbed Compliance on 2026-09-25 (designer): both
       were about the same objects — a document, its verification, its
       expiry — and a person looking for "the expired certificates"
       had to guess which of two rail items held them. */
    { key: "hrDocs", icon: "document", label: "nav.hrDocs", perm: "documents.control", group: "role" },
    { key: "hrLogins", icon: "lock", label: "nav.hrLogins", perm: "staff.logins.manage", group: "role" },
    { key: "hrHiring", icon: "briefcase", label: "nav.hrHiring", perm: "hr.hiring.manage", group: "role" },
    { key: "hrLifecycle", icon: "staff", label: "nav.hrLifecycle", perm: "hr.lifecycle.manage", group: "role" },
    { key: "hrLeaveAtt", icon: "leave", label: "nav.hrLeaveAtt", perm: "hr.leave.admin", group: "role" },
    /* attendance left the leave module on 2026-09-28: punches, their
       corrections and the shifts they are measured against are their
       own day's work, and nobody looked for them under "Leave admin" */
    { key: "hrAttendance", icon: "attendance", label: "nav.hrAttendance", perm: "hr.attendance.admin", group: "role" },
    /* everything an employee asks for ON TOP of their salary --
       reimbursements, loans, overtime, the rise an appraisal agreed
       -- gathered on 2026-10-08 into one module with one approval
       chain. HR is the first approver on all four; payroll is the
       last. They were four objects in four places before this. */
    { key: "hrPay", icon: "payslip", label: "nav.hrPay", perm: "hr.payrequests.manage", group: "role" },
    { key: "hrHelp", icon: "list", label: "nav.hrHelp", perm: "hr.helpdesk.manage", group: "role" },
    { key: "hrReports", icon: "filing", label: "nav.hrReports", perm: "hr.reports.view", group: "role" },
    /* Employee — wave 2 (EMP task/detail screens grouped into two sections) */
    { key: "empTasks", icon: "list", label: "nav.empTasks", perm: "self.requests.manage", group: "self" },
    { key: "empMore", icon: "filing", label: "nav.empMore", perm: "self.more.view", group: "self" },
    /* Payroll Officer (PY-01..PY-18) — restructured 2026-10-07. Eight
       single-purpose modules replace five, of which one ("Operations")
       held eight screens behind two levels of tabs. The order is the
       order the month is worked: check the days, run it, then the
       standing registers that feed the next one. "Salary" and
       "Operations" are gone — the first mixed rules with people, the
       second was named after what it was not. */
    { key: "pyHome", icon: "home", label: "nav.pyHome", perm: "payroll.home.view", group: "role" },
    { key: "pyRun", icon: "payroll", label: "nav.pyRun", perm: "payroll.run.read", group: "role" },
    { key: "pyPeople", icon: "staff", label: "nav.pyPeople", perm: "payroll.salary.manage", group: "role" },
    { key: "pyAdjust", icon: "list", label: "nav.pyAdjust", perm: "payroll.adjust.manage", group: "role" },
    { key: "pyExits", icon: "briefcase", label: "nav.pyExits", perm: "payroll.exits.manage", group: "role" },
    { key: "pyRules", icon: "payslip", label: "nav.pyRules", perm: "payroll.rules.manage", group: "role" },
    { key: "pyReports", icon: "filing", label: "nav.pyReports", perm: "payroll.reports.view", group: "role" },
    /* Accountant (AC-01/02/03) */
    { key: "acHome", icon: "festival", label: "nav.acHome", perm: "statutory.calendar.view", group: "role" },
    { key: "acGate", icon: "lock", label: "nav.acGate", perm: "makerchecker.approve", group: "role" },
    { key: "acLiability", icon: "filing", label: "nav.acLiability", perm: "statutory.liability.read", group: "role" },
    /* the filing half of the role: where each return stands (AC-04),
       the workspace that validates and generates one (AC-05), the
       bonus run (AC-06), the declarations behind TDS (AC-07) and the
       contributions every filing is built from (AC-08) */
    { key: "acFilings", icon: "document", label: "nav.acFilings", perm: "statutory.file", group: "role" },
    { key: "acBonus", icon: "festival", label: "nav.acBonus", perm: "statutory.file", group: "role" },
    { key: "acDecl", icon: "scan", label: "nav.acDecl", perm: "statutory.liability.read", group: "role" },
    { key: "acContrib", icon: "list", label: "nav.acContrib", perm: "statutory.liability.read", group: "role" },
    { key: "acReports", icon: "filing", label: "nav.acReports", perm: "statutory.liability.read", group: "role" },
    /* Group Admin (GA-01/04/08) */
    { key: "gaHome", icon: "globe", label: "nav.gaHome", perm: "group.overview.view", group: "role" },
    { key: "gaSystems", icon: "lock", label: "nav.gaSystems", perm: "group.systems.manage", group: "role" },
    { key: "gaUsers", icon: "staff", label: "nav.gaUsers", perm: "group.users.manage", group: "role" },
    { key: "gaAudit", icon: "filing", label: "nav.gaAudit", perm: "group.audit.read", group: "role" },
  ];

  /* Every role is also an employee, so each carries the self.* set. */
  const SELF = ["self.requests.manage", "self.more.view", "self.home.view", "self.attendance.read", "self.leave.read", "self.payslip.read", "self.document.respond", "self.profile.read"];
  const ROLE_PERMISSIONS = {
    employee: SELF.concat(["self.team.view"]),
    /* DH-02 now holds BOTH her department's approvals and her own
       leave, so the self-service Leave screen is a task she opens from
       it (apply + balances), not a second rail item called the same
       thing. */
    deptHead: ["dept.home.view", "dept.leave.approve", "dept.attendance.read", "dept.team.read"]
      .concat(SELF.filter((p) => p !== "self.home.view" && p !== "self.leave.read")),
    principal: ["campus.home.view", "campus.attendance.read", "campus.leave.escalation", "campus.staff.read"]
      .concat(SELF.filter((p) => p !== "self.home.view" && p !== "self.leave.read" && p !== "self.more.view")),
    /* The director has no attendance and no leave of his own — the top
       of the chain applies to nobody — and (designer, 2026-09-24) he is
       not an EMPLOYEE of the school either: no salary runs through this
       system for him and no staff file is kept on him, so Payslips and
       Documents are absent from the rail rather than opening somebody
       else's record. What remains of the self-service set is the
       profile: who he is and how he signs in. */
    director: ["dir.home.view", "dir.campus.read", "dir.staff.read", "dir.leave.decide", "self.profile.read"],
    hr: ["hr.queue.view", "staff.read", "staff.logins.manage", "documents.control", "hr.compliance.view", "hr.hiring.manage",
         "hr.offers.manage", "hr.lifecycle.manage", "hr.leave.admin", "hr.attendance.admin", "hr.payrequests.manage",
         "hr.helpdesk.manage", "hr.reports.view"]
      .concat(SELF.filter((p) => p !== "self.home.view")),
    payrollOfficer: ["payroll.home.view", "payroll.run.read", "payroll.salary.manage",
                     "payroll.adjust.manage", "payroll.exits.manage", "payroll.rules.manage", "payroll.reports.view"]
      .concat(SELF.filter((p) => p !== "self.home.view")),
    accountant: ["statutory.calendar.view", "makerchecker.approve", "statutory.liability.read",
                 "statutory.file"].concat(SELF.filter((p) => p !== "self.home.view")),
    groupAdmin: ["group.overview.view", "group.users.manage", "group.audit.read", "group.systems.manage"].concat(SELF.filter((p) => p !== "self.home.view")),
  };
  const ROLES = Object.keys(ROLE_PERMISSIONS);

  /* fallback avatar text when a page passes no user — a role, not a person */
  const ROLE_INITIALS = {
    employee: "AR", deptHead: "DH", principal: "PR", director: "DR", hr: "HR",
    payrollOfficer: "PY", accountant: "AC", groupAdmin: "GA",
  };

  /* WHO is signed in, per role — the self-service pages (My Attendance,
     Leave, Payslips) are the same screens for every role, but the
     person, their designation, who approves their leave and whether
     they are VACATION staff (teachers: no earned leave, school
     vacations instead — M8 applies_to_vacation_staff) differ. The
     class-cover features exist only for the Employee (teacher) role. */
  const PROFILES = {
    employee:       { name: "Ananya Rao",       titleKey: "prof.t.employee",  id: "NAV-0142", vacationStaff: true,  cover: true,  work: "teaching", approverKey: "prof.a.hod" },
    deptHead:       { name: "Anjali Deshpande", titleKey: "prof.t.deptHead",  id: "NAV-0103", vacationStaff: true,  cover: false, work: "teaching", approverKey: "prof.a.principal" },
    principal:      { name: "Radhika Menon",    titleKey: "prof.t.principal", id: "NAV-0011", vacationStaff: true,  cover: false, work: "teaching", approverKey: "prof.a.trust", topOfChain: true },
    director:       { name: "Arvind Bhatia",    titleKey: "prof.t.director",  id: "NAV-0002", vacationStaff: false, cover: false, work: "office",   approverKey: "prof.a.trust", topOfChain: true },
    hr:             { name: "Meera Iyer",       titleKey: "prof.t.hr",        id: "NAV-0021", vacationStaff: false, cover: false, work: "office",   approverKey: "prof.a.principal" },
    payrollOfficer: { name: "Sunita Kulkarni",  titleKey: "prof.t.payroll",   id: "NAV-0031", vacationStaff: false, cover: false, work: "office",   approverKey: "prof.a.principal" },
    accountant:     { name: "Rajiv Menon",      titleKey: "prof.t.accountant", id: "NAV-0009", vacationStaff: false, cover: false, work: "office",  approverKey: "prof.a.principal" },
    groupAdmin:     { name: "Kavita Rao",       titleKey: "prof.t.groupAdmin", id: "NAV-0007", vacationStaff: false, cover: false, work: "office",  approverKey: "prof.a.trust" },
  };
  function profileFor(role) { return PROFILES[role] || PROFILES.employee; }

  /* the one-line "who am I" under a self-service page title. Built
     from the signed-in person rather than printed, because three
     screens read it and a teacher, an HR operator and a Group Admin
     are not the same person. */
  const IDENTITY_KEY = {
    hr: "ident.hr", groupAdmin: "ident.groupAdmin",
    payrollOfficer: "ident.payroll", accountant: "ident.accountant",
    deptHead: "ident.deptHead", principal: "ident.principal", director: "ident.director",
  };
  function identityKeyFor(role) { return IDENTITY_KEY[role] || "home.identity"; }
  addStrings({
    en: {
      "prof.t.employee": "PGT · Physics", "prof.t.deptHead": "Head of Science", "prof.t.principal": "Principal",
      "ident.hr": "HR Operator \u00b7 NAV-0021 \u00b7 Sunrise Public School, Indiranagar",
      "ident.groupAdmin": "Group Admin \u00b7 NAV-0007 \u00b7 Sunrise Education Trust, both campuses",
      "ident.payroll": "Payroll Officer \u00b7 NAV-0031 \u00b7 Sunrise Education Trust, both campuses",
      "ident.accountant": "Accountant \u00b7 NAV-0009 \u00b7 Sunrise Education Trust, both campuses",
      "ident.deptHead": "Head of Science \u00b7 NAV-0103 \u00b7 Sunrise Public School, Indiranagar",
      "ident.principal": "Principal \u00b7 NAV-0011 \u00b7 Sunrise Public School, Indiranagar",
      "ident.director": "Director \u00b7 NAV-0002 \u00b7 Sunrise Education Trust",
      "prof.t.director": "Director · Trust office", "prof.t.hr": "HR Operator", "prof.t.payroll": "Payroll Officer", "prof.t.accountant": "Accountant", "prof.t.groupAdmin": "Group Admin",
      "prof.a.hod": "Anjali Deshpande", "prof.a.hodLong": "Anjali Deshpande, Head of Science",
      "prof.a.principal": "Radhika Menon", "prof.a.principalLong": "Radhika Menon, Principal",
      "prof.a.trust": "Trust office", "prof.a.trustLong": "the Trust office",
      "prof.a.director": "Arvind Bhatia", "prof.a.directorLong": "Arvind Bhatia, Director",
    },
  });

  /* avatars: a bank of tints picked by NAME, not the accent. The
     hash is deterministic, so one person wears one tint everywhere;
     `fallback` is what a palette with no bank keeps using. */
  function avatarTone(name, c, fallback) {
    const bank = c && c.avatarBank;
    if (!bank || !bank.length) return fallback || { bg: c.sunken, fg: c.inkMuted };
    const s = String(name || "");
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return bank[h % bank.length];
  }

  function permissionsFor(role) { return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.employee; }
  function navItemsFor(role) {
    const perms = permissionsFor(role);
    const mine = NAV_ITEMS.filter((it) => perms.indexOf(it.perm) !== -1);
    /* A role's OWN work leads; the self-service it also holds follows.
       Without this the array order buried each operator's home mid-rail
       and every non-employee role opened on their personal attendance. */
    return mine.filter((it) => it.group === "role")
      .concat(mine.filter((it) => it.group !== "role"));
  }

  /* THE PHONE RAIL. Below layout.phoneMax the vertical rail is hidden
     by the stylesheet and this bar takes over: the role's first
     sections sit under the thumb, and when a role carries more than
     fit, the last slot opens a sheet holding the rest. Rendered always
     and shown by CSS, so a rotate or a resize needs no state. */
  function TabBar({ sections, current, onOpen }) {
    const { c, shadow } = useTheme();
    const { t } = useLang();
    const [moreOpen, setMoreOpen] = useState(false);
    const firstMoreItem = useRef(null);
    const moreButton = useRef(null);
    const L = G3.layout;

    const overflows = sections.length > L.tabSlots;
    const onBar = overflows ? sections.slice(0, L.tabSlots - 1) : sections;
    const inSheet = overflows ? sections.slice(L.tabSlots - 1) : [];
    const isCurrent = (sec) => !!current && current.key === sec.key;
    const sheetHoldsCurrent = inSheet.some(isCurrent);

    useEffect(() => {
      if (!moreOpen) return undefined;
      if (firstMoreItem.current) firstMoreItem.current.focus();
      function onKey(e) {
        if (e.key !== "Escape") return;
        setMoreOpen(false);
        if (moreButton.current) moreButton.current.focus();
      }
      document.addEventListener("keydown", onKey);
      return () => document.removeEventListener("keydown", onKey);
    }, [moreOpen]);

    function open(sec) {
      setMoreOpen(false);
      onOpen(sec);
    }

    /* a tab is a fifth of a phone wide: a label with a ".short"
       string uses it there ("My Attendance" -> "Attendance") */
    function tabLabel(key) {
      const short = t(key + ".short");
      return short === key + ".short" ? t(key) : short;
    }

    function tab(key, icon, label, on, extra) {
      return (
        <button
          key={key} type="button"
          {...extra}
          style={{
            flex: "1 1 0", minWidth: 0, minHeight: L.tabBarH, border: "none", background: "transparent",
            color: on ? c.onRail : c.onRailMuted,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
            padding: "6px 2px",
          }}
        >
          <span style={{ color: on ? c.railAccent : "inherit", display: "flex" }}><Icon name={icon} size={22} /></span>
          <span
            style={{
              fontFamily: G3.font.ui, fontSize: 12, fontWeight: 600, lineHeight: 1.2,
              maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}
          >
            {tabLabel(label)}
          </span>
        </button>
      );
    }

    return (
      <React.Fragment>
        <div
          className="nv3-tabbar"
          style={{
            display: "none", position: "fixed", left: 0, right: 0, bottom: 0, zIndex: G3.z.tabBar,
            background: c.rail, paddingBottom: "env(safe-area-inset-bottom)",
            boxShadow: "0 -1px 0 " + c.border,
          }}
        >
          {onBar.map((sec) => tab(sec.key, sec.icon, sec.label, isCurrent(sec), {
            "aria-current": isCurrent(sec) ? "page" : undefined,
            onClick: () => open(sec),
          }))}
          {overflows
            ? tab("nv3-more", "more", "nav.tabMore", sheetHoldsCurrent || moreOpen, {
                ref: moreButton,
                "aria-expanded": moreOpen,
                "aria-controls": "nv3-more-sheet",
                onClick: () => setMoreOpen(!moreOpen),
              })
            : null}
        </div>
        {moreOpen ? (
          <div className="nv3-tabbar-sheet" style={{ position: "fixed", inset: 0, zIndex: G3.z.sheet }}>
            <div aria-hidden="true" onClick={() => setMoreOpen(false)} style={{ position: "absolute", inset: 0, background: c.rail, opacity: 0.55 }} />
            <div
              id="nv3-more-sheet" role="dialog" aria-modal="true" aria-label={t("nav.tabMoreTitle")}
              style={{
                position: "absolute", left: 0, right: 0, bottom: "calc(" + L.tabBarH + "px + env(safe-area-inset-bottom))",
                background: c.surface, color: c.ink,
                borderRadius: G3.r.lg + "px " + G3.r.lg + "px 0 0", padding: "8px 8px 12px",
                maxHeight: "70vh", overflowY: "auto", boxShadow: shadow(3),
              }}
            >
              {inSheet.map((sec, i) => {
                const on = isCurrent(sec);
                return (
                  <button
                    key={sec.key} type="button"
                    ref={i === 0 ? firstMoreItem : undefined}
                    aria-current={on ? "page" : undefined}
                    onClick={() => open(sec)}
                    style={{
                      width: "100%", minHeight: 48, border: "none", borderRadius: G3.r.md,
                      background: on ? c.accentSoft : "transparent", color: on ? c.action : c.ink,
                      display: "flex", alignItems: "center", gap: 14, padding: "10px 14px", textAlign: "left",
                      fontFamily: G3.font.ui, fontSize: 15, fontWeight: on ? 700 : 500,
                    }}
                  >
                    <Icon name={sec.icon} size={20} />
                    {t(sec.label)}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </React.Fragment>
    );
  }

  /* SECTIONS. The rail holds at most eight places; a section that
     gathers several screens shows them as sub-tabs under the top bar.
     An operator's own self-service screens fold into one "Me" section
     (the Keka "Me" hub) — an employee, who has nothing else, keeps
     them as top-level places. Unlisted screens are their own section. */
  const SECTION_OF = {
    hrStaff: "people", hrLifecycle: "people", hrLogins: "people",
    hrAttendance: "time", hrLeaveAtt: "time",
    hrPay: "hrRequests", hrHelp: "hrRequests",
    acLiability: "dues", acContrib: "dues", acDecl: "dues",
    acFilings: "filings", acBonus: "filings",
    profile: "profileMe", empMore: "profileMe",
  };
  const SECTION_META = {
    people: { icon: "staff", label: "nav.sec.people" },
    time: { icon: "attendance", label: "nav.sec.time" },
    hrRequests: { icon: "inbox", label: "nav.sec.requests" },
    dues: { icon: "filing", label: "nav.sec.dues" },
    filings: { icon: "document", label: "nav.sec.filings" },
    profileMe: { icon: "profile", label: "nav.profile" },
    me: { icon: "profile", label: "nav.sec.me" },
  };
  /* the label a screen wears as a sub-tab, where its rail label would
     repeat the section's name or say something vaguer than it is */
  const TAB_LABEL = { empMore: "nav.empMore.tab" };

  function sectionsFor(role) {
    const items = navItemsFor(role || "employee");
    const operator = items.some((it) => it.group === "role");
    const sections = [];
    items.forEach((it) => {
      const key = operator && it.group === "self" ? "me" : (SECTION_OF[it.key] || it.key);
      let sec = sections.find((s) => s.key === key);
      if (!sec) {
        const meta = SECTION_META[key] || { icon: it.icon, label: it.label };
        sec = { key: key, icon: meta.icon, label: meta.label, self: key === "me", items: [] };
        sections.push(sec);
      }
      sec.items.push(Object.assign({}, it, { tabLabel: TAB_LABEL[it.key] || it.label }));
    });
    return sections;
  }

  function sectionOf(sections, key) {
    return sections.find((s) => s.items.some((it) => it.key === key)) || null;
  }

  function Rail({ role, active, onNavigate, initials, user }) {
    const { c } = useTheme();
    const { t } = useLang();
    const sections = sectionsFor(role);
    const current = sectionOf(sections, active);
    /* the top bar lives in shell.jsx, loaded after this file; every
       screen mounts the Rail, so the Rail is where the bar is mounted */
    const TopBar = window.Shell3 && window.Shell3.TopBar;

    function openSection(sec) {
      if (!onNavigate) return;
      const first = sec.items[0].key;
      if (first !== active) onNavigate(first);
    }

    return (
      <React.Fragment>
        {TopBar ? (
          <TopBar role={role || "employee"} active={active} sections={sections} current={current}
                  onNavigate={onNavigate} initials={initials} user={user} />
        ) : null}
        <nav
          className="nv3-rail"
          aria-label={t("nav.aria")}
          style={{ width: G3.layout.rail, flex: "0 0 " + G3.layout.rail + "px", background: c.rail }}
        >
          <TabBar sections={sections} current={current} onOpen={openSection} />
          <div className="nv3-rail-col" style={{ position: "sticky", top: 0, height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", padding: "16px 0 18px", gap: 2, overflow: "hidden" }}>
            <div
              aria-hidden="true"
              style={{
                width: 38, height: 38, borderRadius: G3.r.md, background: c.accent, color: c.onAccent,
                display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, flexShrink: 0,
              }}
            >
              <BoatMark size={24} />
            </div>
            <div
              className="nv3-rail-scroll"
              style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, minHeight: 0, width: "100%", alignItems: "center", overflowY: "auto", scrollbarWidth: "none" }}
            >
              {sections.map((sec, i) => {
                const on = !!current && current.key === sec.key;
                return (
                  <React.Fragment key={"s" + sec.key}>
                    {/* the school's work above, this person's own below */}
                    {sec.self && i > 0 ? (
                      <div aria-hidden="true" style={{ width: 52, height: 1, background: c.onRailMuted, opacity: 0.28, margin: "10px 0 8px", flexShrink: 0 }} />
                    ) : null}
                    <button
                      type="button"
                      aria-current={on ? "page" : undefined}
                      onClick={() => openSection(sec)}
                      style={{
                        width: 76, border: "none", borderRadius: G3.r.md,
                        background: on ? c.railActive : "transparent",
                        color: on ? c.onRail : c.onRailMuted,
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
                        padding: "10px 2px 8px", transition: "background " + G3.mo.hover, flexShrink: 0,
                      }}
                    >
                      <span style={{ color: on ? c.railAccent : "inherit", display: "flex" }}><Icon name={sec.icon} size={20} /></span>
                      <span style={{ fontFamily: G3.font.ui, fontSize: 12, fontWeight: 600, textAlign: "center", lineHeight: 1.25 }}>
                        {t(sec.label)}
                      </span>
                      {on ? <span aria-hidden="true" style={{ width: 16, height: 3, borderRadius: 2, background: c.railAccent, marginTop: 1 }} /> : null}
                    </button>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </nav>
      </React.Fragment>
    );
  }

  /* ============================================================
     8. Cards
     ============================================================ */
  /* a card's title mark: a small tinted rounded square carrying the
     card's subject icon. `iconTone` names a DATA ROLE, so the mark
     inherits the same tint/text pair the rest of the system uses for
     that role — no bespoke colour per card. */
  const ICON_TONES = {
    accent: (c) => ({ bg: c.accentSoft, fg: c.action }),
    present: (c) => ({ bg: c.presentTint, fg: c.presentText }),
    brass: (c) => ({ bg: c.brassSoft, fg: c.brass }),
    leave: (c) => ({ bg: c.leaveTint, fg: c.leaveText }),
    off: (c) => ({ bg: c.offTint, fg: c.offText }),
    danger: (c) => ({ bg: c.dangerTint, fg: c.dangerText }),
    late: (c) => ({ bg: c.lateTint, fg: c.lateText }),
    info: (c) => ({ bg: c.ltELTint, fg: c.ltELText }),
  };

  function TitleMark({ icon, iconTone, size }) {
    const { c } = useTheme();
    const tone = (ICON_TONES[iconTone] || ICON_TONES.accent)(c);
    const s = size || 32;
    return (
      <span
        aria-hidden="true"
        style={{
          width: s, height: s, borderRadius: G3.r.sm, flex: "0 0 auto",
          background: tone.bg, color: tone.fg,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <Icon name={icon} size={Math.round(s * 0.55)} />
      </span>
    );
  }

  function CardHeader({ title, sub, action, tone, subTone, icon, iconTone }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <header style={{ display: "flex", flexWrap: "wrap", alignItems: icon ? "center" : "flex-start", justifyContent: "space-between", gap: 14, rowGap: 10, marginBottom: 14 }}>
        <div style={{ minWidth: 0, display: "flex", alignItems: "center", gap: 11 }}>
          {icon ? <TitleMark icon={icon} iconTone={iconTone} /> : null}
          <div style={{ minWidth: 0 }}>
            <h2 style={ty("h2", { margin: 0, color: tone || c.ink })}>{title}</h2>
            {sub ? <div style={ty("small", { color: subTone || c.inkMuted, marginTop: 3 })}>{sub}</div> : null}
          </div>
        </div>
        {action ? <div style={{ flexShrink: 0, paddingTop: 2 }}>{action}</div> : null}
      </header>
    );
  }

  function Card({ id, title, sub, action, tone, subTone, icon, iconTone, fill, border, pad, elev, style, children }) {
    const { c, mode, shadow } = useTheme();
    const padding = pad == null ? G3.layout.cardPad : pad;
    return (
      <section
        id={id}
        style={Object.assign(
          {
            background: fill || c.surface,
            border: "1px solid " + (border || c.border),
            borderRadius: G3.r.card,
            boxShadow: shadow(elev == null ? 1 : elev),
            padding: padding,
            position: "relative",
            zIndex: 1,
            color: tone || c.ink,
          },
          style || {}
        )}
        data-mode={mode}
      >
        {title ? <div style={{ padding: padding === 0 ? G3.layout.cardPad + "px " + G3.layout.cardPad + "px 0" : 0 }}>
          <CardHeader title={title} sub={sub} action={action} tone={tone} subTone={subTone} icon={icon} iconTone={iconTone} />
        </div> : null}
        {children}
      </section>
    );
  }

  /* colour-blocked card (exploration A's signature): a solid accent or
     brass surface. Contrast pairs are resolved per theme so the fill is
     never a light-theme colour dropped into dark. */
  function ColorCard(props) {
    const { c, mode } = useTheme();
    const dark = mode === "dark";
    const kind = props.kind || "accent";
    let fill, tone, subTone, border;
    if (kind === "brass") {
      fill = dark ? c.brassSoft : c.brass;
      tone = dark ? c.brass : c.onBrass;
      subTone = c.onBrassMuted;
      border = dark ? c.brassBorder : "transparent";
    } else {
      fill = dark ? c.accentSoft : c.accent;
      tone = dark ? c.ink : c.onAccent;
      subTone = c.onAccentMuted;
      border = dark ? c.border : "transparent";
    }
    return (
      <Card
        {...props}
        fill={fill} tone={tone} subTone={subTone} border={border}
        elev={props.elev == null ? 2 : props.elev}
      >
        {props.children}
      </Card>
    );
  }

  /* ============================================================
     9. Welcome band — exploration C's hero, full width.
     Greeting + identity left, the headline figure right, abstract
     artwork behind. Always rail cocoa so it anchors both themes.
     ============================================================ */
  function WelcomeBand({ kicker, title, meta, figureLabel, figureValue, figureNote, figureNoteIcon }) {
    const { c, mode, shadow } = useTheme();
    const { ty, lang } = useLang();
    const dk = G3.dark;
    return (
      <section
        style={{
          position: "relative", overflow: "hidden",
          borderRadius: G3.r["2xl"],
          background: c.rail,
          border: mode === "dark" ? "1px solid " + c.border : "none",
          boxShadow: shadow(2),
          padding: "32px 40px 34px",
          minHeight: 178,
        }}
      >
        {/* the same curved linework as the sign-in brand panel, carried
            across the bottom of the band so the two cocoa surfaces
            share one motif */}
        <PanelRipples
          style={{ position: "absolute", left: 0, right: 0, bottom: -10, width: "100%", height: 132,
                   color: c.onRail, opacity: 0.9, pointerEvents: "none" }}
        />
        <Artwork
          line={c.railLine}
          brass={dk.brass}
          accent={dk.accent}
          planeA={c.railPlaneA}
          planeB={c.railPlaneB}
          style={{ position: "absolute", right: -24, bottom: -10, opacity: 0.62, pointerEvents: "none" }}
        />
        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 40, flexWrap: "wrap" }}>
          <div style={{ minWidth: 320 }}>
            {kicker ? <div style={ty("small", { color: c.onRailMuted, marginBottom: 6 })}>{kicker}</div> : null}
            <h1 style={ty("display", { margin: 0, color: c.onRail })}>{title}</h1>
            {meta ? <div style={ty("small", { color: c.onRailMuted, marginTop: 8 })}>{meta}</div> : null}
          </div>
          {figureValue ? (
            <div
              style={{
                background: G3.dark.page, border: "1px solid " + c.railBorder,
                borderRadius: G3.r.xl, padding: "16px 24px", minWidth: 306,
                boxShadow: G3.el.dark[2],
              }}
            >
              <div style={ty("small", { color: c.onRailMuted, marginBottom: 6 })}>{figureLabel}</div>
              <Figure value={figureVal(figureValue)} size="xl" weight={600} color={c.onRail} align="right" style={{ letterSpacing: "-0.015em" }} />
              {figureNote ? (
                <div style={ty("caption", { color: c.onRailMuted, marginTop: 7, display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" })}>
                  {figureNoteIcon ? <span style={{ color: dk.present, display: "flex" }}><Icon name={figureNoteIcon} size={13} /></span> : null}
                  <span>{figureNote}</span>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>
    );
  }
  function figureVal(v) { return typeof v === "number" ? inr(v) : v; }

  /* ============================================================
     10. Buttons, links, fields
     ============================================================ */
  /* kind: primary | danger | brass | ghost | quiet | secondary (default,
     and the default is OUTLINED). Every surface gets exactly one
     filled button; everything beside it is secondary. An outlined
     "confirm" next to an outlined "cancel" is two equal choices. */
  function Button({ kind, size, full, onClick, children, type, onDark, iconLeft, iconRight, disabled }) {
    const { c } = useTheme();
    const { ty } = useLang();
    const k = kind || "secondary";
    const base = {
      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
      borderRadius: G3.r.md, cursor: disabled ? "not-allowed" : "pointer",
      padding: size === "lg" ? "0 22px" : "0 17px",
      height: size === "lg" ? 50 : size === "sm" ? 34 : 40,
      width: full ? "100%" : undefined,
      transition: "background " + G3.mo.hover + ", border-color " + G3.mo.hover,
      opacity: disabled ? 0.55 : 1,
    };
    let skin;
    if (k === "primary") skin = { background: c.action, color: c.onAction, border: "1px solid " + c.action };
    /* a filled refusal. A panel whose whole purpose is to decline
       still needs ONE primary -- making it the accent would say
       "proceed" in the colour the product uses for every other
       proceed, so it is filled in danger instead of outlined into
       the same weight as Cancel. */
    else if (k === "danger") skin = { background: c.danger, color: c.onDanger, border: "1px solid " + c.danger };
    /* AN OUTLINED REFUSAL, for a destructive action standing in a row
       of ordinary ones. Filled danger beside a filled primary is two
       shouts; this one is the weight of a secondary and the colour of
       a warning, which is what "close the opening" actually is. */
    else if (k === "dangerOutline") skin = { background: "transparent", color: c.dangerText, border: "1px solid " + c.danger };
    /* and its opposite: an action that moves something ON, outlined so
       it can stand beside a primary without fighting it */
    else if (k === "successOutline") skin = { background: "transparent", color: c.presentText, border: "1px solid " + c.present };
    else if (k === "brass") skin = { background: c.brass, color: c.onBrass, border: "1px solid " + c.brass };
    else if (k === "ghost") skin = { background: "transparent", color: onDark ? c.onRail : c.ink, border: "1px solid " + (onDark ? c.railBorderStrong : c.borderStrong) };
    else if (k === "quiet") skin = { background: "transparent", color: c.inkMuted, border: "1px solid transparent" };
    else skin = { background: c.surface, color: c.ink, border: "1px solid " + c.borderStrong };
    return (
      <button
        type={type || "button"} disabled={!!disabled} onClick={disabled ? undefined : onClick} aria-disabled={disabled ? "true" : undefined}
        style={ty("ui", Object.assign(base, skin, { fontWeight: 600 }))}
      >
        {iconLeft ? <Icon name={iconLeft} size={16} /> : null}
        {children}
        {iconRight ? <Icon name={iconRight} size={16} /> : null}
      </button>
    );
  }

  /* a person in a list. Initials, never a photograph: the canvas has
     no photographs and a grey circle with a silhouette says less than
     two letters do. aria-hidden — the name is always beside it. */
  function kitInitials(name) {
    const parts = String(name || "").split(" ").filter(Boolean);
    return ((parts[0] || "")[0] || "") + ((parts[1] || "")[0] || "");
  }
  function Avatar({ name, size, tone }) {
    const { c } = useTheme();
    const s = size || 32;
    return (
      <span aria-hidden="true" style={{
        width: s, height: s, borderRadius: G3.r.pill, flexShrink: 0,
        background: tone ? c[tone + "Tint"] : c.sunken,
        color: tone ? c[tone + "Text"] : c.inkMuted,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontFamily: G3.font.ui, fontSize: s * 0.36, fontWeight: 700, letterSpacing: "0.01em",
      }}>{kitInitials(name)}</span>
    );
  }

  function LinkButton({ children, onClick, color, onDark }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <button
        type="button" onClick={onClick}
        style={ty("small", {
          /* the padding is the touch target; the equal negative margin
             gives it back to the layout, so the link sits where it read
             before and is 31px tall instead of 19 */
          background: "none", border: "none", padding: "6px 4px", margin: "-6px -4px",
          color: color || (onDark ? c.onRail : c.action),
          fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
          textDecoration: "underline", textUnderlineOffset: 3, textDecorationThickness: 1,
        })}
      >
        {children}
      </button>
    );
  }

  function Field({ id, label, hint, error, children }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div style={{ marginBottom: 20 }}>
        <label htmlFor={id} style={ty("small", { display: "block", color: c.ink, fontWeight: 600, marginBottom: 7 })}>{label}</label>
        {children}
        {error ? <div role="alert" style={ty("caption", { color: c.dangerText, marginTop: 6 })}>{error}</div> : null}
        {!error && hint ? <div style={ty("caption", { color: c.inkMuted, marginTop: 6 })}>{hint}</div> : null}
      </div>
    );
  }

  function Input({ id, type, value, onChange, placeholder, autoComplete, invalid, trailing, inputMode, size, readOnly, ariaLabel, min, max }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div style={{ position: "relative" }}>
        <input
          id={id} name={id} type={type || "text"} value={value} inputMode={inputMode}
          readOnly={readOnly ? true : undefined}
          /* a date field that can be wrong about which days exist is
             not a date field: min and max are the picker's own guard */
          min={min} max={max}
          onChange={onChange && !readOnly ? (e) => onChange(e.target.value) : undefined}
          placeholder={placeholder} autoComplete={autoComplete}
          /* a placeholder is not a label: it is gone the moment
             somebody types, and a screen reader may never say it */
          aria-label={ariaLabel}
          aria-invalid={invalid ? "true" : undefined}
          spellCheck="false"
          style={ty(size === "sm" ? "small" : "body", {
            width: "100%", height: size === "sm" ? G3.layout.controlH : G3.layout.fieldH,
            border: "1px solid " + (invalid ? c.danger : readOnly ? c.rule : c.borderStrong),
            borderRadius: G3.r.md, background: readOnly ? c.sunken : c.surface, color: c.ink,
            padding: trailing ? "0 88px 0 15px" : size === "sm" ? "0 13px" : "0 15px",
            outlineOffset: 1, cursor: readOnly ? "default" : undefined,
          })}
        />
        {trailing ? (
          <div style={{ position: "absolute", right: 7, top: "50%", transform: "translateY(-50%)" }}>{trailing}</div>
        ) : null}
      </div>
    );
  }

  function Select({ id, value, onChange, options, size, ariaLabel, disabled }) {
    const { c } = useTheme();
    const { ty } = useLang();
    const pad = size === "sm" ? 13 : 15;
    return (
      <span style={{ position: "relative", display: "block", width: "100%" }}>
        <select
          id={id} name={id} value={value} aria-label={ariaLabel}
          disabled={disabled ? true : undefined}
          onChange={onChange && !disabled ? (e) => onChange(e.target.value) : undefined}
          style={ty(size === "sm" ? "small" : "body", {
            width: "100%", height: size === "sm" ? G3.layout.controlH : G3.layout.fieldH,
            border: "1px solid " + (disabled ? c.rule : c.borderStrong), borderRadius: G3.r.md,
            background: disabled ? c.sunken : c.surface, color: c.ink,
            cursor: disabled ? "default" : undefined, opacity: 1,
            appearance: "none", WebkitAppearance: "none", MozAppearance: "none",
            padding: "0 " + (pad + 20) + "px 0 " + pad + "px",
          })}
        >
          {(options || []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {/* the chevron is inset by the SAME padding the text uses, so the
            control is symmetrical — the native arrow could not be moved */}
        <span aria-hidden="true" style={{
          position: "absolute", insetInlineEnd: pad, top: "50%", transform: "translateY(-50%)",
          color: c.inkMuted, display: "flex", pointerEvents: "none",
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M6 9.5 12 15.5 18 9.5" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </span>
    );
  }

  /* ============================================================
     11. Chips, status marks, seal
     ============================================================ */
  function Chip({ children, bg, fg, mono, style }) {
    const { c } = useTheme();
    const { ty } = useLang();
    const base = {
      display: "inline-flex", alignItems: "center", gap: 6,
      background: bg || c.sunken, color: fg || c.inkMuted,
      borderRadius: G3.r.pill, padding: "3px 11px", fontWeight: 600, whiteSpace: "nowrap",
    };
    return <span className="nv3-chip" style={mono ? G3.fig("xs", Object.assign(base, { fontWeight: 600 }, style || {})) : ty("small", Object.assign(base, style || {}))}>{children}</span>;
  }

  /* state is NEVER colour alone: a glyph mark plus the word. */
  const STATE_GLYPH = {
    present: "check", late: "clock", absent: "alert", leave: "leave",
    off: "arrow", holiday: "leave", missing: "alert", penalty: "alert",
    progress: "clock", pending: "clock", verified: "check",
  };

  function StatusMark({ role, word, count, glyph }) {
    const { c } = useTheme();
    const key = role || "present";
    const tint = c[key + "Tint"] || c.sunken;
    const text = c[key + "Text"] || c.inkMuted;
    const g = glyph || STATE_GLYPH[key] || "check";
    return (
      <Chip bg={tint} fg={text}>
        <span aria-hidden="true" style={{ display: "flex" }}><Icon name={g} size={12} /></span>
        <span>{word}</span>
        {count != null ? <span style={G3.fig("xs", { fontWeight: 700 })}>{num(count)}</span> : null}
      </Chip>
    );
  }

  /* brass verification seal — "stamped, on the record" */
  function Seal({ label, sub }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
        <span
          aria-hidden="true"
          style={{
            width: 30, height: 30, borderRadius: G3.r.pill,
            border: "1.5px solid " + c.brass, color: c.brass,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}
        >
          <Icon name="check" size={15} />
        </span>
        <span>
          <span style={ty("small", { display: "block", color: c.ink, fontWeight: 600 })}>{label}</span>
          {sub ? <span style={ty("caption", { display: "block", color: c.inkMuted })}>{sub}</span> : null}
        </span>
      </div>
    );
  }

  /* ============================================================
     12. Ring (hours) + Donut (leave type)
     ============================================================ */
  function Ring({ size, stroke, frac, track, bar, children }) {
    const s = size || 118;
    const w = stroke || 10;
    const rad = (s - w) / 2;
    const circ = 2 * Math.PI * rad;
    const f = Math.min(1, Math.max(0, frac || 0));
    return (
      <div style={{ position: "relative", width: s, height: s, flexShrink: 0 }}>
        <svg width={s} height={s} aria-hidden="true" focusable="false">
          <circle cx={s / 2} cy={s / 2} r={rad} fill="none" stroke={track} strokeWidth={w} />
          <circle
            cx={s / 2} cy={s / 2} r={rad} fill="none" stroke={bar} strokeWidth={w}
            strokeLinecap="round" strokeDasharray={circ * f + " " + circ}
            transform={"rotate(-90 " + s / 2 + " " + s / 2 + ")"}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
          {children}
        </div>
      </div>
    );
  }

  /* leave-type donut: colour says WHICH leave, the word says it too */
  function Donut({ typeKey, have, total, label, caption, size }) {
    const { c } = useTheme();
    const { ty } = useLang();
    const solid = c[typeKey] || c.accent;
    const text = c[typeKey + "Text"] || c.ink;
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 9, minWidth: 96 }}>
        <Ring size={size || 88} stroke={9} frac={total ? have / total : 0} track={c.sunken} bar={solid}>
          <Figure value={num(have)} size="lg" weight={600} color={text} />
          <span style={ty("caption", { color: c.inkFaint, marginTop: 1 })}>{caption}</span>
        </Ring>
        <span style={ty("small", { color: c.ink, fontWeight: 600, textAlign: "center" })}>{label}</span>
      </div>
    );
  }

  /* ============================================================
     13. Day timeline
     segments: [{ from, to, role, dashed }] in decimal hours
     ============================================================ */
  function DayTimeline({ start, end, segments, nowAt, ticks, compact, height }) {
    const { c } = useTheme();
    const s = start == null ? 7.5 : start;
    const e = end == null ? 17.5 : end;
    const span = e - s;
    const pct = (h) => ((h - s) / span) * 100 + "%";
    const wpct = (a, b) => ((b - a) / span) * 100 + "%";
    const barH = height || (compact ? 7 : 12);
    return (
      <div>
        <div style={{ position: "relative", height: barH, background: c.sunken, borderRadius: G3.r.xs, overflow: "visible" }}>
          {(segments || []).map((sg, i) => (
            <div
              key={i}
              style={{
                position: "absolute", left: pct(sg.from), width: wpct(sg.from, sg.to), top: 0, bottom: 0,
                background: sg.dashed ? (c[sg.role + "Tint"] || c.sunken) : (c[sg.role] || c.accent),
                border: sg.dashed ? "1px dashed " + c.borderStrong : "none",
                borderRadius: G3.r.xs,
              }}
            />
          ))}
          {nowAt != null ? (
            <React.Fragment>
              <div style={{ position: "absolute", left: pct(nowAt), top: -4, bottom: -4, width: 2, background: c.accent, borderRadius: 1 }} />
              <div style={{ position: "absolute", left: "calc(" + pct(nowAt) + " - 3px)", top: -8, width: 8, height: 8, borderRadius: G3.r.pill, background: c.accent }} />
            </React.Fragment>
          ) : null}
        </div>
        {compact ? null : (
          <div style={{ position: "relative", height: 18, marginTop: 6 }}>
            {(ticks || [8, 10, 12, 14, 16]).map((h) => (
              <span key={h} style={G3.fig("micro", { position: "absolute", left: pct(h), transform: "translateX(-50%)", color: c.inkFaint })}>
                {String(h).padStart(2, "0") + ":00"}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ============================================================
     13a. Meter — a horizontal quantity bar. Used wherever "how much of
     a whole" is the question (leave left of quota, how far through the
     school day). `bar` accepts a role colour or a role-built gradient;
     `knob` pins a physical marker at the fill's end. The figure always
     sits beside it — shape first, then the number.
     ============================================================ */
  function Meter({ frac, bar, track, height, knob, radius, label }) {
    const { c } = useTheme();
    const f = Math.min(1, Math.max(0, frac || 0));
    const h = height || 8;
    const rad = radius == null ? G3.r.pill : radius;
    return (
      <div
        role={label ? "img" : undefined} aria-label={label}
        style={{ position: "relative", height: h, borderRadius: rad, background: track || c.gutter }}
      >
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: f * 100 + "%", borderRadius: rad, background: bar || c.accent }} />
        {knob ? (
          <span
            aria-hidden="true"
            style={{
              position: "absolute", left: f * 100 + "%", top: "50%", transform: "translate(-50%,-50%)",
              width: h + 8, height: h + 8, borderRadius: G3.r.pill,
              background: c.knob, border: "4px solid " + c.accent, boxShadow: c.knobShadow,
            }}
          />
        ) : null}
      </div>
    );
  }

  /* ============================================================
     13b. Switch — a real toggle (not a checkbox skin). Used for
     binary display preferences (24-hour format, etc.) — never for
     an action that changes a record (those are Buttons, so the
     maker-checker/idempotency rules in CLAUDE.md still apply).
     ============================================================ */
  function Switch({ checked, onChange, label, id }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <label htmlFor={id} style={{ display: "inline-flex", alignItems: "center", gap: 9, cursor: "pointer" }}>
        {label ? <span style={ty("small", { color: c.inkMuted, fontWeight: 600 })}>{label}</span> : null}
        <span
          role="switch" aria-checked={checked ? "true" : "false"} id={id} tabIndex={0}
          onClick={() => onChange && onChange(!checked)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onChange && onChange(!checked); } }}
          style={{
            width: 36, height: 21, borderRadius: G3.r.pill, flexShrink: 0, position: "relative",
            background: checked ? c.accent : c.borderStrong, transition: "background " + G3.mo.hover,
          }}
        >
          <span
            aria-hidden="true"
            style={{
              position: "absolute", top: 2, left: checked ? 17 : 2, width: 17, height: 17, borderRadius: G3.r.pill,
              background: c.knob, boxShadow: c.knobShadow, transition: "left " + G3.mo.hover,
            }}
          />
        </span>
      </label>
    );
  }

  /* ============================================================
     13c. Tabs — a plain text tab row with an underline + accent
     weight on the active tab (Keka-structure: tabs are content
     switches, never a route change).

     A COMPLETE ARIA tab pattern, not half of one: the tablist owns
     roving tabindex + Left/Right/Home/End, and every tab is bound to
     its <TabPanel> by id/aria-controls/aria-labelledby. Panels are
     rendered lazily (one at a time), so `aria-controls` is set only
     on the selected tab — a dangling IDREF is a worse defect than an
     omitted optional attribute. ALWAYS pair Tabs with TabPanel and
     pass the same `idBase`; a tablist with no tabpanel is a broken
     pattern for a screen reader, which is exactly the bug this
     replaces.
     ============================================================ */
  function tabBtnId(base, key) { return (base || "tabs") + "-tab-" + key; }
  function tabPanelId(base, key) { return (base || "tabs") + "-panel-" + key; }

  /* `size="lg"` for a module whose tabs ARE its navigation: at the
     default scale a tab row reads as a caption and disappears into the
     page above it (designer, 2026-09-28: "the tabs are small and not
     visible amidst information"). */
  function Tabs({ items, active, onChange, ariaLabel, idBase, size }) {
    const { c } = useTheme();
    const { ty } = useLang();
    const btnRefs = useRef({});
    const big = size === "lg";

    function goTo(key) {
      if (onChange) onChange(key);
      /* every tab button is already mounted, so focusing the new tab
         synchronously is safe — no ref read inside a state updater */
      const el = btnRefs.current[key];
      if (el) el.focus();
    }

    function onKeyDown(e) {
      const i = items.findIndex((it) => it.key === active);
      if (i === -1) return;
      let next = null;
      if (e.key === "ArrowRight") next = items[(i + 1) % items.length];
      else if (e.key === "ArrowLeft") next = items[(i - 1 + items.length) % items.length];
      else if (e.key === "Home") next = items[0];
      else if (e.key === "End") next = items[items.length - 1];
      if (!next) return;
      e.preventDefault();
      goTo(next.key);
    }

    return (
      <div
        role="tablist" aria-label={ariaLabel} onKeyDown={onKeyDown}
        style={{ display: "flex", gap: 4, borderBottom: "1px solid " + c.rule }}
      >
        {items.map((it) => {
          const on = it.key === active;
          return (
            <button
              key={it.key} type="button" role="tab"
              id={tabBtnId(idBase, it.key)}
              aria-selected={on ? "true" : "false"}
              aria-controls={on ? tabPanelId(idBase, it.key) : undefined}
              tabIndex={on ? 0 : -1}
              ref={(el) => { btnRefs.current[it.key] = el; }}
              onClick={() => onChange && onChange(it.key)}
              style={ty(big ? "body" : "small", {
                background: "none", border: "none",
                borderBottom: (big ? "3px solid " : "2px solid ") + (on ? c.accent : "transparent"),
                padding: big ? "13px 18px 11px" : "10px 14px 9px", marginBottom: -1,
                color: on ? c.ink : c.inkMuted, fontWeight: on ? 700 : 600, cursor: "pointer",
              })}
            >
              {it.label}
            </button>
          );
        })}
      </div>
    );
  }

  /* The other half of the pattern. tabIndex=0 because a panel can hold
     nothing focusable (an empty state) — without it a keyboard user
     could never reach that panel's content. */
  function TabPanel({ idBase, tabKey, style, children }) {
    return (
      <div
        role="tabpanel"
        id={tabPanelId(idBase, tabKey)}
        aria-labelledby={tabBtnId(idBase, tabKey)}
        tabIndex={0}
        style={style}
      >
        {children}
      </div>
    );
  }

  /* ============================================================
     13d. ActionMenu — a "⋯" / "⋮" popover menu, used both for a
     Register row's per-row actions and a section's header actions.
     Renders through a portal (position:fixed on document.body) so
     it is never clipped by an ancestor Card's layout — the trigger
     can live inside a table cell with a narrow column and the menu
     still draws in full.

     items: [{ key, icon, label, tone, disabled, reason, onSelect }]
     `tone` is "go" (the accepting act) or "danger" (the refusing
     one) -- the two decisions a reader scans a menu looking for.
     Both colour the icon and the label AND tint the row once it is
     the active one, so the decision is a state and not just text in
     a colour. Everything else stays neutral: if three items were
     coloured, none of them would be.
     disabled items stay in the menu, dimmed, with the reason printed
     under the label (the "visible, disabled, with the reason in
     words" rule in docs/ui-compliance-requirements.md) — never
     hidden, never a bare disabled control with no explanation.
     ============================================================ */
  /* ============================================================
     14b. CAMPUS SWITCH — one control, every desk.

     A trust runs more than one campus, and almost every list in the
     product is a list OF one. Before this the control was hand-rolled
     in five files, which had already drifted: one offered "Both my
     campuses" and the others did not, and three of them spelled the
     campus names into their own string tables, so a campus could be
     renamed in one module and not its neighbour.

     The kit owns the ids, the words and the control. `campusOptions`
     feeds a Select (a filter row, a form field); `inCampus` is the
     filter itself, and it treats "both" and "nothing chosen" alike so
     a caller cannot forget the all-case.

     It is a group of toggles rather than a tablist: the pages that
     carry it already have real tabs, and two tablists on one screen
     make the arrow keys ambiguous.
     ============================================================ */
  const CAMPUS_IDS = ["indiranagar", "whitefield"];
  const CAMPUS_ALL = "both";

  /* The roll store and the leave store key a campus `lf.c.main`; the
     HR modules key it `indiranagar`. Both spellings are load-bearing,
     so the translation lives here and nowhere else. */
  const CAMPUS_STORE_KEY = { indiranagar: "lf.c.main", whitefield: "lf.c.north" };
  function campusKeyOf(id) { return CAMPUS_STORE_KEY[id] || null; }
  function campusIdOf(storeKey) {
    const hit = CAMPUS_IDS.filter((id) => CAMPUS_STORE_KEY[id] === storeKey)[0];
    return hit || null;
  }
  /* the store-key form of `inCampus`, for rows that carry `campusKey` */
  function inCampusKey(scopeId, storeKey) {
    return !scopeId || scopeId === CAMPUS_ALL || CAMPUS_STORE_KEY[scopeId] === storeKey;
  }

  function campusLabel(t, id) {
    return id === CAMPUS_ALL || id == null ? t("kit.campus.both") : t("kit.campus." + id);
  }

  /* options for a Select. `both: false` drops the all-case (a form
     field names ONE campus — a record cannot be filed at both). */
  function campusOptions(t, opts) {
    const o = opts || {};
    const list = CAMPUS_IDS.map((id) => ({ value: id, label: t("kit.campus." + id) }));
    if (o.both === false) return list;
    const all = { value: CAMPUS_ALL, label: t(o.allKey || "kit.campus.both") };
    return o.allFirst ? [all].concat(list) : list.concat([all]);
  }

  /* Does a row belong in the current scope? A row with NO campus is
     not campus-less, it is trust-wide — a pay rule that names no
     campus applies to both — so it belongs in every scope. People
     always have one (`campusOfCode` always answers), so this only
     ever loosens configuration, never a list of staff. */
  function inCampus(scope, id) {
    return !scope || scope === CAMPUS_ALL || !id || id === scope || id === CAMPUS_ALL;
  }

  /* HR-02's register, which is the roll and therefore the authority on
     where somebody works. Everything else reads this rather than
     keeping a second copy. */
  const CAMPUS_BY_CODE = {
    "NAV-0011": "indiranagar", "NAV-0034": "indiranagar", "NAV-0054": "indiranagar",
    "NAV-0067": "indiranagar", "NAV-0088": "indiranagar", "NAV-0118": "indiranagar",
    "NAV-0142": "indiranagar", "NAV-0161": "indiranagar", "NAV-0176": "indiranagar",
    "NAV-0199": "whitefield", "NAV-0207": "indiranagar", "NAV-0221": "whitefield",
    "NAV-0233": "whitefield", "NAV-0245": "whitefield", "NAV-0250": "indiranagar",
    "NAV-0263": "whitefield",
  };

  /* A staff number not on the register still has to land somewhere, and
     it has to land in the SAME place on every screen that names it —
     otherwise a person is on one campus in the payroll register and
     another in the settlement. The digits decide, 3 in 5 to
     Indiranagar, which is the ratio of the two rolls. */
  function campusOfCode(code) {
    if (!code) return CAMPUS_IDS[0];
    if (CAMPUS_BY_CODE[code]) return CAMPUS_BY_CODE[code];
    const n = parseInt(String(code).replace(/\D/g, ""), 10);
    if (!n && n !== 0) return CAMPUS_IDS[0];
    return (n % 5) < 3 ? "indiranagar" : "whitefield";
  }

  function CampusSwitch({ value, onChange, both, ariaLabel, size }) {
    const { c, shadow } = useTheme();
    const { t } = useLang();
    const sm = size === "sm";
    const opts = CAMPUS_IDS.map((id) => ({ id: id, label: t("kit.campus." + id) }))
      .concat(both === false ? [] : [{ id: CAMPUS_ALL, label: t("kit.campus.both") }]);
    return (
      <div
        className="nv3-campus-switch"
        role="group" aria-label={ariaLabel || t("kit.campus.aria")}
        style={{
          display: "inline-flex", padding: 3, borderRadius: G3.r.pill,
          border: "1px solid " + c.border, background: c.surface, boxShadow: shadow(1),
        }}
      >
        {opts.map((o) => {
          const on = o.id === value || (o.id === CAMPUS_ALL && !value);
          return (
            <button
              key={o.id} type="button" aria-pressed={on ? "true" : "false"}
              onClick={() => onChange && onChange(o.id)}
              style={{
                border: "none", borderRadius: G3.r.pill, cursor: "pointer",
                padding: sm ? "6px 12px" : "7px 14px", whiteSpace: "nowrap",
                background: on ? c.accent : "transparent", color: on ? c.onAccent : c.inkMuted,
                fontFamily: G3.font.ui, fontSize: sm ? 12 : 12.5, fontWeight: 600,
              }}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    );
  }

  /* `face` replaces the glyph with any trigger content (the top bar's
     avatar uses it); the menu itself is unchanged */
  function ActionMenu({ ariaLabel, items, glyph, size, face }) {
    const { c, shadow } = useTheme();
    const { ty } = useLang();
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState(null);
    const [activeIdx, setActiveIdx] = useState(0);
    const triggerRef = useRef(null);
    const menuRef = useRef(null);
    const itemRefs = useRef([]);

    function close(returnFocus) {
      setOpen(false);
      if (returnFocus && triggerRef.current) triggerRef.current.focus();
    }

    /* Anchored geometry, shared by the first open and every reposition.
       Returns null once the trigger row has scrolled out of the viewport. */
    function computePos() {
      if (!triggerRef.current) return null;
      const r = triggerRef.current.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return null;
      const estH = Math.min(items.length * 56 + 16, 420);
      const above = r.bottom + estH + 8 > window.innerHeight;
      const width = 268;
      return {
        left: Math.max(8, Math.min(r.right - width, window.innerWidth - width - 8)),
        top: above ? Math.max(8, r.top - estH - 6) : r.bottom + 6,
      };
    }

    function openMenu() {
      setPos(computePos());
      const firstEnabled = items.findIndex((it) => !it.disabled);
      setActiveIdx(firstEnabled === -1 ? 0 : firstEnabled);
      setOpen(true);
    }

    useEffect(() => {
      if (!open) return;
      function onDocMouseDown(e) {
        if (menuRef.current && menuRef.current.contains(e.target)) return;
        if (triggerRef.current && triggerRef.current.contains(e.target)) return;
        close(false);
      }
      function onDocKey(e) {
        if (e.key === "Escape") { e.preventDefault(); close(true); }
      }
      /* Follow the row instead of vanishing. Closing on any scroll event
         raced with trackpad inertia (and with scroll-into-view): a menu
         opened mid-glide flashed and disappeared before it could be read.
         Reposition on scroll, and close only once the row itself has
         left the viewport. */
      function onReflow() {
        const next = computePos();
        if (!next) { close(false); return; }
        setPos(next);
      }
      document.addEventListener("mousedown", onDocMouseDown);
      document.addEventListener("keydown", onDocKey);
      window.addEventListener("scroll", onReflow, true);
      window.addEventListener("resize", onReflow);
      return () => {
        document.removeEventListener("mousedown", onDocMouseDown);
        document.removeEventListener("keydown", onDocKey);
        window.removeEventListener("scroll", onReflow, true);
        window.removeEventListener("resize", onReflow);
      };
      // eslint-disable-next-line
    }, [open]);

    useEffect(() => {
      if (open && itemRefs.current[activeIdx]) itemRefs.current[activeIdx].focus();
    }, [open, activeIdx]);

    function onItemKeyDown(e, idx, it) {
      if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((idx + 1) % items.length); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((idx - 1 + items.length) % items.length); }
      else if (e.key === "Home") { e.preventDefault(); setActiveIdx(0); }
      else if (e.key === "End") { e.preventDefault(); setActiveIdx(items.length - 1); }
      else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (!it.disabled) { it.onSelect && it.onSelect(); close(true); } }
      else if (e.key === "Escape") { e.preventDefault(); close(true); }
      else if (e.key === "Tab") { close(false); }
    }

    const s = size || 28;
    return (
      <React.Fragment>
        <button
          ref={triggerRef} type="button" aria-haspopup="menu" aria-expanded={open} aria-label={ariaLabel}
          onClick={() => (open ? close(true) : openMenu())}
          style={{
            width: face ? "auto" : s, height: s, borderRadius: G3.r.pill, border: "1px solid " + (open ? c.borderStrong : "transparent"),
            background: open ? c.sunken : "transparent", color: face ? c.ink : c.inkMuted,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            gap: face ? 10 : 0, padding: face ? "0 10px 0 4px" : 0,
          }}
        >
          {face || <Icon name={glyph || "more"} size={16} />}
        </button>
        {open && pos ? ReactDOM.createPortal(
          <div
            ref={menuRef} role="menu" aria-label={ariaLabel}
            style={{
              position: "fixed", top: pos.top, left: pos.left, width: 268,
              background: c.surface, border: "1px solid " + c.border, borderRadius: G3.r.lg,
              boxShadow: shadow(3), padding: 6, zIndex: 1000,
            }}
          >
            {items.map((it, idx) => {
              const toned = it.tone === "danger" || it.tone === "go";
              const fg = it.tone === "danger" ? c.dangerText : it.tone === "go" ? c.presentText : null;
              const tint = it.tone === "danger" ? c.dangerTint : it.tone === "go" ? c.presentTint : c.sunken;
              const on = idx === activeIdx;
              return (
              <button
                key={it.key}
                ref={(el) => { itemRefs.current[idx] = el; }}
                role="menuitem" aria-disabled={it.disabled ? "true" : undefined}
                tabIndex={on ? 0 : -1}
                onKeyDown={(e) => onItemKeyDown(e, idx, it)}
                onClick={() => { if (it.disabled) return; it.onSelect && it.onSelect(); close(true); }}
                style={{
                  display: "flex", gap: 10, alignItems: "flex-start", width: "100%", textAlign: "left",
                  border: "none", background: on ? tint : "transparent",
                  borderRadius: G3.r.md, padding: "9px 10px", cursor: it.disabled ? "default" : "pointer",
                  opacity: it.disabled ? 0.6 : 1,
                }}
              >
                {it.icon ? (
                  <span
                    aria-hidden="true"
                    style={{
                      display: "flex", marginTop: 1, flexShrink: 0,
                      color: it.disabled ? c.inkFaint : toned ? fg : c.inkMuted,
                    }}
                  >
                    <Icon name={it.icon} size={16} />
                  </span>
                ) : null}
                <span style={{ minWidth: 0 }}>
                  <span
                    style={ty("small", {
                      display: "block", fontWeight: 600,
                      color: it.disabled ? c.inkFaint : toned ? fg : c.ink,
                    })}
                  >
                    {it.label}
                  </span>
                  {it.reason ? <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 2, fontWeight: 500 })}>{it.reason}</span> : null}
                </span>
              </button>
              );
            })}
          </div>,
          document.body
        ) : null}
      </React.Fragment>
    );
  }

  /* ============================================================
     14. Register — the record surface. A table that ONLY exists
     inside a card: card header, mono column labels, comfortable
     rows, a totals row whose figures sum.
     columns: [{ key, label, align, mono, width, weight }]
     rows: [{ id, cells: { key: node|string }, tone, highlight }]
     totals: { label, cells: { key: node|string } }
     ============================================================ */
  function Register({ title, sub, action, chips, columns, rows, totals, footer, onSelect }) {
    const { c } = useTheme();
    const { ty } = useLang();
    const pad = G3.layout.cardPad;
    const th = (col) => ty("colLabel", {
      color: c.inkFaint, textAlign: col.align || "left", padding: "0 10px 9px",
      textTransform: "uppercase", whiteSpace: "nowrap", width: col.width,
    });
    return (
      <Card pad={0}>
        <div style={{ padding: pad + "px " + pad + "px 0" }}>
          <CardHeader title={title} sub={sub} action={action} />
          {chips ? <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>{chips}</div> : null}
        </div>
        <div style={{ padding: "0 " + (pad - 10) + "px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid " + c.ruleStrong }}>
                {columns.map((col) => <th key={col.key} scope="col" style={th(col)}>{col.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.id == null ? i : row.id}
                  /* the WHOLE row is the target when the caller wants one —
                     a name that is the only hit area is a 4px-tall link */
                  tabIndex={onSelect ? 0 : undefined}
                  aria-current={onSelect && row.highlight ? "true" : undefined}
                  onClick={onSelect ? () => onSelect(row.id) : undefined}
                  onKeyDown={onSelect ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(row.id); } } : undefined}
                  className={onSelect || row.live ? "nv3-row-live" : undefined}
                  style={{
                    borderBottom: i < rows.length - 1 ? "1px solid " + c.rule : "none",
                    background: row.highlight ? c.sel : row.tone === "dim" ? c.alt : undefined,
                    cursor: onSelect ? "pointer" : undefined,
                    outlineOffset: -2,
                  }}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      style={col.mono
                        ? G3.fig("sm", { padding: "10px 10px", textAlign: col.align || "left", color: row.tone === "dim" ? c.inkFaint : c.ink, fontWeight: col.weight || 500, verticalAlign: "middle", whiteSpace: "nowrap" })
                        : ty("small", { padding: "10px 10px", textAlign: col.align || "left", color: row.tone === "dim" ? c.inkFaint : c.ink, verticalAlign: "middle" })}
                    >
                      {row.cells[col.key] == null ? "—" : row.cells[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            {totals ? (
              <tfoot>
                <tr style={{ borderTop: "2px solid " + c.ruleStrong }}>
                  {columns.map((col, i) => (
                    <td
                      key={col.key}
                      style={col.mono
                        ? G3.fig("md", { padding: "13px 10px", textAlign: col.align || "left", color: c.ink, fontWeight: 600, whiteSpace: "nowrap" })
                        : ty("small", { padding: "13px 10px", textAlign: col.align || "left", color: c.ink, fontWeight: 700 })}
                    >
                      {totals.cells[col.key] != null ? totals.cells[col.key] : (i === 0 ? totals.label : null)}
                    </td>
                  ))}
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div>
        {footer ? (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, padding: "14px " + pad + "px 18px", borderTop: "1px solid " + c.rule, marginTop: 4 }}>
            {footer}
          </div>
        ) : <div style={{ height: 8 }} />}
      </Card>
    );
  }

  /* ============================================================
     15. Empty / loading / error states — every data view ships all three
     ============================================================ */
  function DeskArt() {
    const { c } = useTheme();
    return (
      <svg width="152" height="102" viewBox="0 0 150 100" fill="none" aria-hidden="true" focusable="false">
        <circle cx="75" cy="52" r="42" fill={c.accentSoft} />
        <g stroke={c.inkFaint} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="34" y="52" width="62" height="7" rx="2" />
          <path d="M40 59v24M90 59v24M40 70h50" />
          <path d="M106 46v37M124 46v37M106 62h18M104 46h22" />
          <circle cx="52" cy="26" r="9" />
          <path d="M52 21v5l3.5 2" />
        </g>
        <rect x="62" y="44" width="20" height="8" rx="1.5" fill={c.brass} opacity="0.85" />
        <rect x="66" y="40" width="16" height="4" rx="1" fill={c.accent} opacity="0.55" />
      </svg>
    );
  }

  function EmptyState({ head, body, action, art, compact }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 10, padding: compact ? "8px 8px 4px" : "14px 12px 10px", flex: 1 }}>
        {art || <DeskArt />}
        <div style={ty("h3", { color: c.ink })}>{head}</div>
        {body ? <p style={ty("small", { color: c.inkMuted, margin: 0, maxWidth: 330 })}>{body}</p> : null}
        {action ? <div style={{ marginTop: 4 }}>{action}</div> : null}
      </div>
    );
  }

  function Skeleton({ w, h, radius, style }) {
    const { c } = useTheme();
    return (
      <div
        aria-hidden="true"
        style={Object.assign({
          width: w || "100%", height: h || 14,
          borderRadius: radius == null ? G3.r.xs : radius,
          background: c.sunken,
          animation: "nv3pulse 1.4s ease-in-out infinite",
        }, style || {})}
      />
    );
  }

  function ErrorState({ head, body, action }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 9, padding: "16px 12px" }}>
        <span style={{ color: c.danger, display: "flex" }}><Icon name="alert" size={26} /></span>
        <div style={ty("h3", { color: c.ink })}>{head}</div>
        {body ? <p style={ty("small", { color: c.inkMuted, margin: 0, maxWidth: 330 })}>{body}</p> : null}
        {action ? <div style={{ marginTop: 4 }}>{action}</div> : null}
      </div>
    );
  }

  /* ============================================================
     16. Kit-owned strings (nav, toggles, generic states)
     ============================================================ */
  addStrings({
    en: {
      "nav.group.self": "Yours",
      "nav.tabMore": "More",
      "nav.attendance.short": "Attendance",
      "nav.sec.people": "People",
      "nav.sec.time": "Time",
      "nav.sec.requests": "Requests",
      "nav.sec.dues": "Dues",
      "nav.sec.filings": "Filings",
      "nav.sec.me": "Me",
      "nav.empMore.tab": "More services",
      "nav.tabMoreTitle": "More places",
      "nav.aria": "Naveya",
      "nav.home": "Home",
      "nav.attendance": "My Attendance",
      "nav.leave": "Leave",
      "nav.payslips": "Payslips",
      "nav.documents": "Documents",
      "nav.profile": "Profile",
      "nav.myTeam": "My team",
      "nav.staff": "Staff",
      "nav.staff": "Staff",
      "nav.payroll": "Payroll",
      "nav.filings": "Filings",
      "nav.dhHome": "Home",
      "nav.dhLeave": "Leave",
      "nav.dhAttendance": "Dept attendance",
      "nav.prHome": "Home",
      "nav.prAttendance": "Campus",
      "nav.prLeave": "Leave",
      "nav.drHome": "Home",
      "nav.drCampus": "Campuses",
      "nav.drLeave": "Leave",
      "nav.hrHome": "Home",
      "nav.hrStaff": "Staff",
      "nav.hrDocs": "Doc control",
      "nav.hrLogins": "Staff logins",
      "nav.hrCompliance": "Compliance",
      "nav.hrHiring": "Hiring",
      "nav.hrLifecycle": "Lifecycle",
      "nav.hrLeaveAtt": "Leave admin",
      "nav.hrAttendance": "Attendance",
      "nav.hrPay": "Pay requests",
      "nav.hrHelp": "Helpdesk",
      "nav.hrReports": "Reports",
      "nav.empTasks": "Requests",
      "kit.close": "Close",
      "kit.campus.indiranagar": "Indiranagar",
      "kit.campus.whitefield": "Whitefield",
      "kit.campus.both": "Both my campuses",
      "kit.campus.all": "Every campus",
      "kit.campus.aria": "Choose a campus",
      "kit.campus.label": "Campus",
      "kit.file.choose": "Choose a file",
      "kit.file.change": "Choose a different file",
      "kit.file.none": "No file chosen yet",
      "nav.empMore": "More",
      "nav.gaSystems": "Systems",
      "nav.pyHome": "Home",
      "nav.pyRun": "Payroll run",
      "nav.pyPeople": "Staff & salaries",
      "nav.pyAdjust": "Adjustments",
      "nav.pyExits": "Exits",
      "nav.pyRules": "Pay rules",
      "nav.pyReports": "Registers",
      "nav.acHome": "Calendar",
      "nav.acGate": "Approvals",
      "nav.acLiability": "Liability",
      "nav.acFilings": "Filings",
      "nav.acBonus": "Bonus",
      "nav.acDecl": "Declarations",
      "nav.acContrib": "Contributions",
      "nav.acReports": "Reports",
      "nav.gaHome": "Overview",
      "nav.gaUsers": "Users",
      "nav.gaAudit": "Audit log",
      "nav.selfGroup": "Mine",
      "nav.roleGroup": "Work",
      "theme.toDark": "Switch to dark theme",
      "theme.toLight": "Switch to light theme",
      "user.name": "Ananya Rao",
      "role.employee": "Employee",
      "role.deptHead": "Department Head",
      "role.principal": "Campus Principal",
      "role.hr": "HR Operator",
      "role.payrollOfficer": "Payroll Operator",
      "role.accountant": "Accountant",
      "role.groupAdmin": "Group Admin",
      "state.loading": "Loading",
      "state.error": "Could not load this",
      "state.retry": "Try again",
    },
  });

  /* ============================================================
     TIP — a small explanation on hover AND on focus, portalled so a
     card's overflow can never clip it. It is never the only carrier
     of a fact: whatever it says must also be legible on the page for
     somebody who is not hovering (a legend, a caption, a word in the
     row). It explains; it does not inform.
     ============================================================ */
  function Tip({ label, children, body, width, grow }) {
    const { c, shadow } = useTheme();
    const { ty } = useLang();
    const [rect, setRect] = useState(null);
    const ref = useRef(null);
    const W = width || 240;
    const show = () => { if (ref.current) setRect(ref.current.getBoundingClientRect()); };
    const hide = () => setRect(null);
    const left = rect ? Math.max(8, Math.min(rect.left + rect.width / 2 - W / 2, window.innerWidth - W - 8)) : 0;
    const above = rect ? rect.top > 200 : false;
    return (
      <span
        ref={ref} tabIndex={0} aria-label={label}
        onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}
        onKeyDown={(e) => { if (e.key === "Escape") hide(); }}
        style={{
          display: grow ? "flex" : "inline-flex", alignItems: "center", cursor: "help", borderRadius: 6,
          flex: grow ? "1 1 auto" : undefined, minWidth: grow ? 0 : undefined,
        }}
      >
        {children}
        {rect ? ReactDOM.createPortal(
          <div
            role="tooltip"
            style={Object.assign({
              position: "fixed", left: left, width: W, zIndex: 1600, pointerEvents: "none",
              background: c.surface, border: "1px solid " + c.border, borderRadius: G3.r.lg,
              boxShadow: shadow(3), padding: "11px 13px",
            }, above ? { top: rect.top - 8, transform: "translateY(-100%)" } : { top: rect.bottom + 8 })}
          >
            {body}
          </div>,
          document.body
        ) : null}
      </span>
    );
  }

  /* ============================================================
     SEGMENT DONUT — a whole divided into named parts (a roll of
     teachers, a queue by state). One arc per segment, drawn in the
     order given, with a hairline gap so two adjacent segments never
     read as one.

     It is never the only carrier: the caller puts the figure in the
     middle and the words beside it, so the chart is the shape of the
     answer and the legend IS the answer. A donut with four slices and
     no legend is decoration.
     ============================================================ */
  /* A WHOLE DIVIDED, ACROSS THE FULL WIDTH. One bar, one segment per
     part, a hairline between them. Every segment carries its count and
     its name in the legend underneath, so nothing is told apart by
     colour alone; a legend entry can also be the filter, because a
     chart beside a separate row of buttons is two objects doing one
     job. Zero-valued parts keep their legend row and lose their
     segment — "none at this stage" is a fact worth seeing. */
  function StackBar({ segments, height, label, legend, onPick, picked }) {
    const { c } = useTheme();
    const { ty } = useLang();
    const h = height || 10;
    const live = (segments || []).filter((s) => s.value > 0);
    const total = live.reduce((sum, s) => sum + s.value, 0);
    return (
      <div>
        <div
          role="img" aria-label={label}
          style={{ display: "flex", gap: 2, height: h, borderRadius: G3.r.pill, overflow: "hidden", background: c.gutter }}
        >
          {total === 0
            ? null
            : live.map((s) => (
                <span
                  key={s.key} aria-hidden="true"
                  style={{ flex: s.value, background: s.color, transition: "flex " + G3.mo.hover }}
                />
              ))}
        </div>
        {legend !== true ? null : (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
            {(segments || []).map((s) => {
              const on = picked === s.key;
              const Tag = onPick ? "button" : "span";
              return (
                <Tag
                  key={s.key}
                  {...(onPick ? { type: "button", onClick: () => onPick(on ? null : s.key), "aria-pressed": on } : {})}
                  style={Object.assign(ty("caption", {
                    display: "inline-flex", alignItems: "baseline", gap: 7,
                    border: "1px solid " + (on ? c.borderStrong : "transparent"),
                    background: on ? c.sel : "transparent",
                    borderRadius: G3.r.pill, padding: "4px 11px 4px 9px",
                    color: c.inkMuted, cursor: onPick ? "pointer" : "default",
                  }))}
                >
                  <span aria-hidden="true" style={{ width: 9, height: 9, borderRadius: 3, background: s.value ? s.color : c.gutter, flexShrink: 0, alignSelf: "center" }} />
                  <span style={G3.fig("sm", { color: s.value ? c.ink : c.inkFaint, fontWeight: 700 })}>{s.value}</span>
                  <span style={{ color: on ? c.ink : c.inkMuted, fontWeight: on ? 700 : 400 }}>{s.label}</span>
                </Tag>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  /* SWATCH -- the colour a figure is, and nothing else.

     This slot has now held four things. A 4px rule under the number,
     which was a bar drawn at full width whatever the number said. An
     arc, which draws a SHARE -- and half the figures on this product
     are not a share of anything, so the ring closed and a strip read
     "full here, half there". A sparkline, which needs a history.

     Each of those tried to say something about ONE figure, and three
     times out of six there was nothing true to say about one figure on
     its own. A swatch says what colour it is, which is always true, and
     the shape of the set moves to the bar under the strip. */
  function Swatch({ tone, size, hollow }) {
    const { c } = useTheme();
    const n = size || 13;
    const col = tone || c.chartBlue;
    return (
      <span
        aria-hidden="true"
        style={{
          width: n, height: n, borderRadius: 4, flexShrink: 0, display: "block",
          /* a figure that IS the bar is drawn hollow: a reader hunting for
             its colour among the bands would never find it, because the
             whole bar is it */
          background: hollow ? "transparent" : col,
          boxShadow: hollow ? "inset 0 0 0 2.5px " + col : "none",
        }}
      />
    );
  }

  /* THE FIGURE AS A QUANTITY, AND WHAT KIND OF ONE.

     Only where the WHOLE value is a quantity -- "58", "2,540",
     "\u20b91,55,73,560.00", "23 days". A date or a sentence is not a number
     ("July 2026, on 2 Aug" is not seven), and a figure with none takes
     no band at all.

     The KIND matters because a bar may only lay one kind end to end.
     Five lakh rupees beside five settlements is not a composition; it
     is a rounding error with a colour, and it filled nine bars with a
     single band before this existed. Money is money, a value carrying
     a unit is that unit, and everything else is a plain count. */
  function metricQuantity(m) {
    const v = m.value;
    let n = null;
    let kind = "count";
    if (typeof m.n === "number" && isFinite(m.n)) {
      n = m.n;
    } else if (typeof v === "number") {
      n = isFinite(v) ? v : null;
    } else if (typeof v === "string") {
      const hit = /^([^\d\-]{0,2})(\d[\d,]*(?:\.\d+)?)\s*([a-z%]{0,6})$/i.exec(v.trim());
      if (hit) {
        const parsed = Number(hit[2].replace(/,/g, ""));
        if (isFinite(parsed)) {
          n = parsed;
          if (/[\u20b9$\u00a3\u20ac]/.test(hit[1])) kind = "money";
          else if (hit[3]) kind = "u:" + hit[3].toLowerCase();
        }
      }
    }
    if (n == null) return null;
    if (m.unit) kind = "u:" + String(m.unit).toLowerCase();
    return { v: n, kind: kind };
  }

  /* ONE METRIC. The figure is the hierarchy; the box beside it is the
     key to its band in the bar under the strip. `note` says what the
     figure is out of, in words. */
  function MetricCell({ label, value, unit, tone, note, mark, first, warn, hollow }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div
        style={{
          padding: first ? "0 22px 0 0" : "0 22px",
          borderInlineStart: first ? "none" : "1px solid " + c.rule,
          minWidth: 0, display: "flex", flexDirection: "column", gap: 0,
        }}
      >
        {/* a label WRAPS rather than truncating: "OVERDUE DOCUMENT REQU..."
            is not a label, it is a riddle */}
        <div style={ty("caption", {
          color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
          marginBottom: 9, minHeight: 28,
        })}>{label}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
          <Swatch tone={tone} hollow={hollow} />
          <span style={{ display: "flex", alignItems: "baseline", gap: 6, minWidth: 0 }}>
            <Figure value={value} size="xl" weight={700} color={warn ? (tone || c.dangerText) : c.ink} />
            {unit ? <span style={ty("small", { color: c.inkMuted })}>{unit}</span> : null}
          </span>
        </div>
        {note ? <div style={ty("caption", { color: c.inkMuted, marginTop: 9 })}>{note}</div> : null}
        {mark ? <div style={{ marginTop: 8 }}>{mark}</div> : null}
      </div>
    );
  }

  /* METRIC STRIP -- the figures, and the one bar they add up to.

     The bar is SEAMLESS and runs the full width on purpose: it is one
     statement about one population, and a row of gapped segments reads
     as several. Each band is the colour of the figure above it, so the
     swatch is the key and no legend is needed — a legend would print
     every count a second time, which is what made the old one clutter.

     A figure that is the SUM of the others takes no band (`total: true`),
     and neither does one belonging to another population (`bar: false`):
     drawing either would count the same people twice. With fewer than
     two bands left there is nothing to compare, and no bar is drawn. */
  function MetricStrip({ metrics, pad, style }) {
    const { c } = useTheme();
    const { ty } = useLang();
    const list = metrics || [];
    const px = pad == null ? 20 : pad;

    const candidates = list
      .filter(function (m) { return !m.total && m.bar !== false; })
      .map(function (m) {
        const q = metricQuantity(m);
        return q && q.v > 0 ? { k: m.k, label: m.label, tone: m.tone || c.chartBlue, v: q.v, kind: q.kind } : null;
      })
      .filter(Boolean);
    /* the largest group of one kind wins, and a tie goes to whichever
       kind the strip names first -- so a row of counts with one money
       figure in it draws the counts, and a row of money draws the money */
    const byKind = {};
    candidates.forEach(function (b) { (byKind[b.kind] = byKind[b.kind] || []).push(b); });
    let bands = [];
    Object.keys(byKind).forEach(function (kind) {
      if (byKind[kind].length > bands.length) bands = byKind[kind];
    });
    const whole = bands.reduce(function (a, b) { return a + b.v; }, 0);
    const show = bands.length > 1 && whole > 0;

    return (
      <div style={style}>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          paddingInline: px,
        }}>
          {list.map(function (m, i) {
            return (
              <MetricCell
                key={m.k} first={i === 0}
                label={m.label} value={m.value} unit={m.unit}
                tone={m.tone} warn={m.warn} note={m.note} mark={m.mark}
                hollow={show && bands.filter(function (b) { return b.k === m.k; }).length === 0}
              />
            );
          })}
        </div>
        {show ? (
          <div style={{ paddingInline: px, marginTop: 18 }}>
            <div
              role="img"
              aria-label={bands.map(function (b) { return b.label + " " + b.v; }).join(", ")}
              style={{ display: "flex", height: 10, borderRadius: G3.r.pill, overflow: "hidden", background: c.gutter }}
            >
              {bands.map(function (b) {
                return (
                  <span key={b.k} aria-hidden="true"
                    style={{ flex: b.v, background: b.tone, transition: "flex " + G3.mo.hover }} />
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  /* FIGURE BLOCKS -- the leave balance's shape, for any day's figures.

     The shape the designer settled on, and it is the leave module's:
     each figure takes a column divided by a hairline, with its name
     over it, the count and what it is out of, ITS OWN BAR (one meter a
     column, not one stacked bar across them -- the columns are not
     parts of each other here), and one line underneath.

     THAT LINE IS INFORMATIONAL, NEVER EXPLANATORY. "In before the
     grace period closed" explains what the figure means, which the
     reader already knows from its name; "Karan Mehta" tells them
     something the figure cannot. A figure says how many, the line says
     who -- or when, or how marked.

     Each item: { k, label, value, text, unit, frac, tone, note, warn }
     `text` prints instead of the count (a ratio), `frac` fills the
     meter, and `warn` turns the line amber and bold where it is the
     thing somebody has to act on. */
  function FigureBlocks({ items, style }) {
    const { c } = useTheme();
    const { ty } = useLang();
    const list = (items || []).filter(Boolean);
    /* THE HAIRLINE IS BETWEEN COLUMNS, NEVER DOWN THE EDGE. Every
       block carries its rule on the left and the strip is pulled one
       pixel left inside a clipping box, so the first block of EVERY
       row -- not just the first row -- has its rule trimmed off. A
       divider hanging down the left edge of a wrapped row is the tell
       that a layout was built for one width. */
    return (
      <div style={Object.assign({ overflow: "hidden" }, style || {})}>
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
        alignItems: "flex-start", rowGap: 26, marginLeft: -1,
      }}>
        {list.map(function (m) {
          return (
            <div key={m.k} style={{
              minWidth: 0, paddingLeft: 22, paddingRight: 22,
              borderLeft: "1px solid " + c.border,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
                <span aria-hidden="true" style={{
                  width: 10, height: 10, borderRadius: G3.r.pill, flexShrink: 0,
                  background: m.hollow ? "transparent" : m.tone,
                  border: m.hollow ? "1.5px solid " + m.tone : "none",
                }} />
                <span style={ty("h3", { color: c.ink })}>{m.label}</span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 }}>
                <Figure
                  value={m.text != null ? m.text : num(m.value)} size={30} weight={700}
                  color={c.ink} style={{ lineHeight: 1.1 }}
                />
                {m.unit ? <span style={ty("small", { color: c.inkMuted })}>{m.unit}</span> : null}
              </div>
              <Meter
                frac={m.frac || 0} bar={m.tone} track={c.sunken} height={10}
                label={m.label + " " + (m.text != null ? m.text : num(m.value))}
              />
              {m.note ? (
                <div style={ty("caption", {
                  color: m.warn ? c.lateText : c.inkMuted,
                  fontWeight: m.warn ? 700 : 500, marginTop: 10,
                })}>{m.note}</div>
              ) : null}
            </div>
          );
        })}
      </div>
      </div>
    );
  }

  function SegmentDonut({ segments, size, stroke, label, children }) {
    const { c } = useTheme();
    const s = size || 116;
    const w = stroke || 12;
    const rad = (s - w) / 2;
    const circ = 2 * Math.PI * rad;
    const live = (segments || []).filter((x) => x.value > 0);
    const total = live.reduce((sum, x) => sum + x.value, 0);
    /* a gap only where there is more than one slice to separate */
    const gap = live.length > 1 ? Math.min(6, circ * 0.012) : 0;

    let at = 0;
    const arcs = live.map((x) => {
      const len = Math.max(0, (x.value / total) * circ - gap);
      const arc = { key: x.key, color: x.color, len: len, offset: -at };
      at += (x.value / total) * circ;
      return arc;
    });

    return (
      <div role="img" aria-label={label} style={{ position: "relative", width: s, height: s, flexShrink: 0 }}>
        <svg width={s} height={s} aria-hidden="true" focusable="false">
          <circle cx={s / 2} cy={s / 2} r={rad} fill="none" stroke={c.sunken} strokeWidth={w} />
          {arcs.map((a) => (
            <circle
              key={a.key} cx={s / 2} cy={s / 2} r={rad} fill="none"
              stroke={a.color} strokeWidth={w}
              strokeDasharray={a.len + " " + (circ - a.len)}
              strokeDashoffset={a.offset}
              transform={"rotate(-90 " + s / 2 + " " + s / 2 + ")"}
            />
          ))}
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
          {children}
        </div>
      </div>
    );
  }

  /* ============================================================
     SIDE SCREEN — the one side panel. A task that ends (apply,
     regularise, claim, choose an action) opens here instead of
     unrolling on the page beneath the record it is about to join.
     Escape closes it, Tab is trapped inside it, the page behind
     does not scroll, and focus goes back to whatever opened it.
     ============================================================ */
  const SS_FOCUSABLE = "button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])";
  let ssSeq = 0;

  /* FileField — a visually-hidden native file input behind a real
     button, so choosing a file stays keyboard- and screen-reader-
     usable. Uncontrolled by design (a file input cannot be
     controlled); the caller tracks the chosen name through onPick.
     Promoted from emp-tasks.jsx 2026-09-25: five tabs there and two
     dialogs on the HR record all need it, and a document upload typed
     into a TEXT BOX is a lie about what the screen does. */
  function FileField({ id, fileName, onPick, hint, invalid, accept }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const inputRef = useRef(null);
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <Button kind="secondary" size="sm" iconLeft="download" onClick={() => inputRef.current && inputRef.current.click()}>
            {fileName ? t("kit.file.change") : t("kit.file.choose")}
          </Button>
          {fileName ? (
            <span style={ty("caption", { color: c.ink, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 })}>
              <span aria-hidden="true" style={{ display: "flex", color: c.presentText }}><Icon name="check" size={13} /></span>
              {fileName}
            </span>
          ) : (
            <span style={ty("caption", { color: c.inkFaint })}>{t("kit.file.none")}</span>
          )}
          <input
            ref={inputRef} id={id} type="file" accept={accept} aria-invalid={invalid ? "true" : undefined}
            style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0 }}
            onChange={(e) => { const f = e.target.files && e.target.files[0]; onPick && onPick(f ? f.name : null); }}
          />
        </div>
        {hint ? <div style={ty("caption", { color: invalid ? c.dangerText : c.inkFaint, marginTop: 6 })}>{hint}</div> : null}
      </div>
    );
  }

  /* A NAMED RETURN AT PAGE LEVEL. An internal screen that replaces the
     page (a campus's staff register, one person's record) is not a
     dialog: Escape does not close it and the rail's active item still
     says where you are. So it says where back goes, in words, above
     the title — "Back to the group overview", never a bare arrow. */
  function BackBar({ label, onBack }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <button
        type="button" onClick={onBack}
        style={ty("small", {
          display: "inline-flex", alignItems: "center", gap: 7, border: "1px solid " + c.border,
          background: c.surface, padding: "7px 14px 7px 11px", borderRadius: G3.r.pill,
          color: c.accent, fontWeight: 600, cursor: "pointer", marginBottom: 14,
        })}
      >
        <span aria-hidden="true" style={{ display: "flex", transform: "scaleX(-1)" }}><Icon name="arrow" size={14} /></span>
        <span>{label}</span>
      </button>
    );
  }

  function SideScreen({ title, sub, onClose, footer, children, head, width, back, avatar }) {
    const { c, shadow } = useTheme();
    const { t, ty } = useLang();
    const boxRef = useRef(null);
    const titleId = useMemo(() => { ssSeq += 1; return "ui3-side-" + ssSeq; }, []);
    useEffect(() => {
      const prev = document.activeElement;
      const box = boxRef.current;
      function onKey(e) {
        if (e.key === "Escape") { e.preventDefault(); onClose(); return; }
        if (e.key === "Tab" && box) {
          const items = Array.prototype.slice.call(box.querySelectorAll(SS_FOCUSABLE));
          if (!items.length) return;
          const first = items[0], last = items[items.length - 1];
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      }
      document.addEventListener("keydown", onKey);
      if (box) box.focus();
      const old = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = old; if (prev && prev.focus) prev.focus(); };
      // eslint-disable-next-line
    }, []);
    return ReactDOM.createPortal(
      <div style={{ position: "fixed", inset: 0, zIndex: 2000 }}>
        <div aria-hidden="true" onMouseDown={onClose} style={{ position: "absolute", inset: 0, background: c.rail, opacity: 0.55 }} />
        <div
          ref={boxRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId}
          style={{
            position: "absolute", top: 0, right: 0, bottom: 0, width: width || 640, maxWidth: "100%",
            background: c.surface, borderLeft: "1px solid " + c.border, boxShadow: shadow(4),
            display: "flex", flexDirection: "column", outline: "none",
            borderRadius: G3.r.lg + "px 0 0 " + G3.r.lg + "px",
          }}
        >
          <div style={{ padding: "22px 24px 16px", borderBottom: "1px solid " + c.rule }}>
            {/* a named return, not a close: the reader who arrived here
                from somewhere else is told where "back" goes */}
            {back ? (
              <button
                type="button" onClick={back.onBack}
                style={ty("small", { display: "inline-flex", alignItems: "center", gap: 6, border: "none", background: "none", padding: 0, marginBottom: 12, color: c.accent, fontWeight: 600, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 })}
              >
                <span aria-hidden="true" style={{ display: "flex", transform: "scaleX(-1)" }}><Icon name="arrow" size={14} /></span>
                <span>{back.label}</span>
              </button>
            ) : null}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
              {avatar ? <span style={{ marginTop: 2 }}><Avatar name={avatar} size={40} /></span> : null}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 id={titleId} style={ty("h1", { margin: 0, color: c.ink })}>{title}</h2>
                {sub ? <div style={ty("small", { color: c.inkMuted, marginTop: 5 })}>{sub}</div> : null}
              </div>
              <button
                type="button" onClick={onClose} aria-label={t("kit.close")} title={t("kit.close")}
                style={{ width: 34, height: 34, borderRadius: G3.r.pill, border: "1px solid " + c.border, background: c.surface, color: c.inkMuted, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            {head}
          </div>
          <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "20px 24px 8px" }}>{children}</div>
          {/* THE FOOT SITS ON THE RIGHT, as it does in every dialog in
              the product: the hand that is about to press something
              ends up there, and a row of controls hanging off the left
              of a 660px sheet reads as unfinished. */}
          {footer ? <div style={{ padding: "14px 24px 18px", borderTop: "1px solid " + c.rule, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12, flexWrap: "wrap" }}>{footer}</div> : null}
        </div>
      </div>,
      document.body
    );
  }

  /* BAND — how a screen full of figures opens.

     A heading and ONE strip of figures, each with an arc saying how
     much of the whole it is.

     It used to be three things: a stacked bar across the top, a row of
     legend chips under it, and then the figures with a coloured rule
     beneath each. That is one fact drawn three times — and the chips
     carried counts that appeared again, larger, two inches below them.
     Designer ruling (2026-10-14): drop the bar and the chips, keep the
     figures, and let the chart be small enough to sit beside a number.

     The mark beside a figure has been four things, and three of them
     tried to say something about ONE figure — a rule, an arc, a line.
     Three times out of six there was nothing true to say about one
     figure on its own. So the mark is a colour and the shape is a
     single bar for the whole strip.

     `metrics` take { k, label, value, note, tone }. The mark beside a
     figure is a SWATCH — the colour it is, and nothing else — and the
     shape of the set is one seamless bar across the full width beneath
     them, each band in the colour of the figure above it. `n` gives the
     bar a count where the value is not one itself; `total: true` and
     `bar: false` keep a figure out of the bar, because a sum of the
     others or a different population drawn as a band counts the same
     people twice. */
  function Band({ head, sub, action, metrics, foot, children, style }) {
    const { c } = useTheme();
    const { ty } = useLang();

    return (
      <section aria-label={head} style={Object.assign({
        border: "1px solid " + c.rule, borderRadius: G3.r.md, background: c.surface,
        overflow: "hidden", marginBottom: G3.layout.gap,
      }, style || {})}>
        {/* NO HEADING OVER A BAND OF FIGURES (designer, everywhere).
            Each figure carries its own label and its own line; a title
            over the row of them, and a sentence under the title, was
            the band saying twice what the figures already say. The
            head stays as the section's accessible name, and the
            action — the one thing a band holds that its figures cannot
            — keeps its corner. */}
        {action ? (
          <header style={{ padding: "16px 20px 0", display: "flex", justifyContent: "flex-end" }}>
            <div style={{ flexShrink: 0 }}>{action}</div>
          </header>
        ) : null}
        <MetricStrip metrics={metrics} style={{ padding: (action ? 18 : 20) + "px 0 20px" }} />
        {/* and the thing the figures describe, where the band opens a
            section rather than standing on its own */}
        {children ? (
          <div style={{ borderTop: "1px solid " + c.rule, padding: "18px 20px 4px" }}>{children}</div>
        ) : null}
        {/* a band can carry one line under its figures — the rule that
            governs everything above it, where there is one */}
        {foot ? (
          <div style={{ borderTop: "1px solid " + c.rule, padding: "13px 20px 15px" }}>
            <span style={ty("caption", { color: c.inkFaint })}>{foot}</span>
          </div>
        ) : null}
      </section>
    );
  }

  /* SPLIT — one population cut in two, and the halves side by side.

     The sibling of Band, and built from different parts on purpose. A
     band answers HOW MUCH, in figures over coloured rules. A split
     answers WHO, in names — so it has no bar and no meters, the counts
     sit in a chip beside a plain verdict, the halves are divided by a
     VERTICAL rule rather than horizontal ones, and the half that wants
     the reader is tinted while the half that does not is left plain.
     That asymmetry is the whole point: a band treats its four metrics
     alike because they are four readings of one thing, and a split
     does not, because one of its halves is work and the other is not.

     `sides` is two entries (three is a table, not a split):
       { key, label, count, verdict, empty, urgent, tone, tint, children }
     `urgent` tints the heading strip — the strip alone, never the
     column, and with no stroke on it. */
  function Split({ head, sub, action, sides, foot, style }) {
    const { c } = useTheme();
    const { ty } = useLang();
    const list = (sides || []).filter(Boolean);
    return (
      <section aria-label={head} style={Object.assign({
        border: "1px solid " + c.rule, borderRadius: G3.r.md, background: c.surface,
        overflow: "hidden",
      }, style || {})}>
        <header style={{
          padding: "16px 20px 14px", display: "flex", alignItems: "flex-start",
          justifyContent: "space-between", gap: 16, flexWrap: "wrap",
        }}>
          <div style={{ minWidth: 0 }}>
            <h2 style={ty("h3", { margin: 0, color: c.ink })}>{head}</h2>
            {sub ? <p style={ty("caption", { color: c.inkMuted, margin: "4px 0 0", maxWidth: "90ch" })}>{sub}</p> : null}
          </div>
          {action ? <div style={{ flexShrink: 0 }}>{action}</div> : null}
        </header>
        <div style={{
          borderTop: "1px solid " + c.rule, display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(330px, 1fr))",
        }}>
          {list.map(function (sd, i) {
            return (
              <div key={sd.key} style={{
                minWidth: 0,
                /* the vertical rule IS the division — it is what makes
                   this read as two halves rather than one long list */
                borderInlineStart: i ? "1px solid " + c.rule : "none",
              }}>
                <div style={{
                  /* the strip reads as a column header, so it carries a
                     hairline under it whether or not it is tinted — the
                     plain half had nothing holding it off its own rows */
                  padding: "12px 20px 11px",
                  borderBottom: "1px solid " + c.rule,
                  background: sd.urgent ? (sd.tint || c.lateTint) : "transparent",
                  display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap",
                }}>
                  <span style={ty("caption", {
                    color: sd.urgent ? (sd.tone || c.lateText) : c.inkFaint,
                    fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
                  })}>{sd.label}</span>
                  {sd.count != null ? (
                    <span style={G3.fig("sm", {
                      color: sd.urgent ? (sd.tone || c.lateText) : c.ink, fontWeight: 700,
                      background: sd.urgent ? c.surface : c.sunken,
                      borderRadius: G3.r.pill, padding: "1px 9px",
                    })}>{num(sd.count)}</span>
                  ) : null}
                  <span style={ty("caption", {
                    color: sd.urgent ? (sd.tone || c.lateText) : c.inkMuted,
                    flex: "1 1 160px", minWidth: 0,
                  })}>{sd.verdict}</span>
                </div>
                <div style={{ padding: "4px 20px 16px" }}>
                  {sd.children || (
                    <p style={ty("small", { color: c.inkMuted, margin: "8px 0 0" })}>{sd.empty}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {foot ? (
          <div style={{ borderTop: "1px solid " + c.rule, padding: "13px 20px 15px" }}>
            <span style={ty("caption", { color: c.inkFaint })}>{foot}</span>
          </div>
        ) : null}
      </section>
    );
  }

  /* MODAL — an act that interrupts, centred over what it acts on.

     The product already had SideScreen for a surface you READ beside
     the page. What it lacked was the dialog for a surface you ACT in:
     three files had hand-rolled their own centred portal, which is how
     focus traps and scroll locks end up subtly different per screen.

     Use a Modal when the action needs a decision and a reason and the
     reader should not lose their place: recording a payment, excluding
     somebody from a return, correcting a challan. Use SideScreen when
     the reader is looking something up. Use neither for a control that
     belongs inline.

     The behaviour is the same as SideScreen's by construction — focus
     moves in and comes back, Escape closes, the page behind cannot
     scroll, and the backdrop is a dismissal, not decoration. */
  function Modal({ title, sub, icon, iconTone, onClose, footer, children, width, danger }) {
    const { c, shadow } = useTheme();
    const { t, ty } = useLang();
    const boxRef = useRef(null);
    const titleId = useMemo(() => { ssSeq += 1; return "ui3-modal-" + ssSeq; }, []);
    useEffect(() => {
      const prev = document.activeElement;
      const box = boxRef.current;
      function onKey(e) {
        if (e.key === "Escape") { e.stopPropagation(); onClose && onClose(); return; }
        if (e.key !== "Tab" || !box) return;
        const items = [].slice.call(box.querySelectorAll(
          'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
        )).filter(function (el) { return el.offsetParent !== null; });
        if (!items.length) return;
        const first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
      document.addEventListener("keydown", onKey);
      if (box) box.focus();
      const old = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return function () {
        document.removeEventListener("keydown", onKey);
        document.body.style.overflow = old;
        if (prev && prev.focus) prev.focus();
      };
      // eslint-disable-next-line
    }, []);
    return ReactDOM.createPortal(
      <div style={{
        position: "fixed", inset: 0, zIndex: 2100, display: "flex",
        alignItems: "flex-start", justifyContent: "center", padding: "56px 20px 24px", overflowY: "auto",
      }}>
        <div aria-hidden="true" onMouseDown={onClose}
          style={{ position: "fixed", inset: 0, background: c.rail, opacity: 0.55 }} />
        <div
          ref={boxRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId}
          style={{
            position: "relative", width: width || 560, maxWidth: "100%",
            background: c.surface, border: "1px solid " + c.border, borderRadius: G3.r.card,
            boxShadow: shadow(4), outline: "none", display: "flex", flexDirection: "column",
          }}
        >
          <div style={{ padding: "20px 22px 14px", display: "flex", alignItems: "flex-start", gap: 14 }}>
            {icon ? <TitleMark icon={icon} iconTone={iconTone || (danger ? "danger" : "accent")} size={32} /> : null}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 id={titleId} style={ty("h3", { margin: 0, color: c.ink })}>{title}</h2>
              {sub ? <p style={ty("caption", { color: c.inkMuted, margin: "5px 0 0" })}>{sub}</p> : null}
            </div>
            <button
              type="button" onClick={onClose} aria-label={t("kit.close")} title={t("kit.close")}
              style={{
                width: 32, height: 32, borderRadius: G3.r.pill, border: "1px solid " + c.border,
                background: c.surface, color: c.inkMuted, display: "flex", alignItems: "center",
                justifyContent: "center", flexShrink: 0, cursor: "pointer",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <div style={{ padding: "0 22px 4px" }}>{children}</div>
          {footer ? (
            <div style={{
              padding: "14px 22px 18px", marginTop: 14, borderTop: "1px solid " + c.rule,
              display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
            }}>{footer}</div>
          ) : null}
        </div>
      </div>,
      document.body
    );
  }

  /* ============================================================
     export
     ============================================================ */
  window.UI3 = {
    /* theme + language */
    ThemeProvider, useTheme, ThemeToggle,
    LangProvider, useLang, t: translate, addStrings, strings: STRINGS,
    /* chrome */
    Rail, navItemsFor, sectionsFor, sectionOf, permissionsFor, avatarTone, NAV_ITEMS, ROLE_PERMISSIONS, ROLES, profileFor, translate,
    WelcomeBand, Motif, Artwork, PanelRipples, BoatMark, SchoolScene, RequestArt,
    /* surfaces */
    Card, CardHeader, ColorCard, Register, TitleMark, Band, Split,
    /* controls */
    Button, LinkButton, Field, Input, Select, Switch, Tabs, TabPanel, ActionMenu, SideScreen, Modal, BackBar, FileField,
    CampusSwitch, campusOptions, campusLabel, inCampus, CAMPUS_IDS, CAMPUS_ALL,
    campusKeyOf, campusIdOf, inCampusKey, campusOfCode, CAMPUS_BY_CODE,
    /* data */
    Ring, Donut, SegmentDonut, StackBar, Swatch, MetricCell, MetricStrip, FigureBlocks, DayTimeline, Meter, Chip, StatusMark, Seal, Figure, Tip, Avatar, identityKeyFor, inr, num, dur,
    /* states */
    EmptyState, ErrorState, Skeleton, DeskArt, Icon,
  };
})();
