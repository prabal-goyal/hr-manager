/* ============================================================
   Naveya — Home EXPLORATION B · "Bento / modular"
   window.HomeExplore.B
   ------------------------------------------------------------
   Deliberate override of the shipped "radius 0 / hairline rows /
   no shadow" rules (user rejected the built artefact): generous
   radius, soft depth, cards that breathe, a bento board of
   DIFFERENT-sized tiles composing to 1680px.
   Colors: window.G2 only (no hardcoded hex).
   Type (per exploration brief, local to this file):
     Anek Latin (display EN) · Anek Devanagari (display HI +
     Devanagari fallback) · Hanken Grotesk 500 13.5 (UI) ·
     JetBrains Mono (figures/money).
   ============================================================ */
(function () {
  const { useState } = React;
  const G2 = window.G2;

  /* ---------- fonts (local to this exploration) ---------- */
  const F = {
    ui: "'Hanken Grotesk','Anek Devanagari',system-ui,sans-serif",
    dispEn: "'Anek Latin','Anek Devanagari',system-ui,sans-serif",
    dispHi: "'Anek Devanagari',system-ui,sans-serif",
    mono: "'JetBrains Mono',ui-monospace,Menlo,monospace",
  };

  /* ---------- money: Indian lakh-crore grouping, never abbreviated ---------- */
  function inr(n) {
    const neg = n < 0;
    const parts = Math.abs(n).toFixed(2).split(".");
    let s = parts[0].slice(-3);
    let rest = parts[0].slice(0, -3);
    while (rest.length) { s = rest.slice(-2) + "," + s; rest = rest.slice(0, -2); }
    return (neg ? "−₹" : "₹") + s + "." + parts[1];
  }

  /* ---------- i18n — whole screen in ONE language ---------- */
  const STR = {
    en: {
      brand: "NAVEYA",
      navHome: "Home", navAtt: "My Attendance", navLeave: "Leave", navPay: "Payslips",
      navDocs: "Documents", navProfile: "Profile", navSub: "Substitutions",
      greeting: "Good afternoon, Ananya",
      roleLine: "PGT Physics · NAV-0142 · Sunrise Public School, Whitefield",
      lastNet: "Last net pay · July",
      today: "Today", dateToday: "Tuesday, 11 August 2026", inProgress: "In progress",
      ofTarget: "of 8:00 target",
      lblIn: "In", lblBrk: "Break", lblOut: "Out",
      gate: "Main Gate · MG-02", breakSpan: "11:10 – 11:45", projected: "expected 15:30",
      provenance: "Biometric verified · ESSL Main Gate MG-02 · last sync 12:31",
      legendWorked: "Worked", legendBreak: "Break", legendLeft: "Remaining", now: "now",
      regTitle: "August register", regCaption: "1 – 11 August 2026",
      thDate: "Date", thIn: "In", thOut: "Out", thHrs: "Hours", thStatus: "Status",
      stPresent: "Present", stLate: "Late", stLeave: "Leave", stOff: "Weekly off", stProg: "In progress",
      workedSoFar: "49:51 worked till 10 Aug",
      sumPresent: "Present 6", sumLate: "Late 1", sumLeave: "Leave 1", sumOff: "Off 2",
      leaveTitle: "Leave balances", leaveCaption: "Policy year Apr 2026 – Mar 2027",
      ltEL: "Earned", ltCL: "Casual", ltSL: "Sick", ltComp: "Comp-off",
      ofTotal: function (n) { return "of " + n; },
      payTitle: "July 2026 · Payslip", netPay: "Net pay",
      gross: "Gross earnings", deductions: "Deductions",
      credited: "Credited Fri, 31 July", download: "Download payslip (PDF)",
      actionOverline: "Action needed",
      actionTitle: "HR has requested an update to your PAN record.",
      actionDue: "Respond by Fri, 14 August", actionBtn: "Respond",
      holTitle: "Next holiday", holName: "Independence Day",
      holWhen: "Sat, 15 August · in 4 days", holNext: "Then · Raksha Bandhan, Fri 28 Aug",
      reqTitle: "My requests", reqEmpty: "All clear — nothing pending",
      reqEmptySub: "Approved and past requests live under Leave.",
      reqNew: "New leave request",
      themeAria: "Switch theme",
      days: { sun: "Sun", mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat" },
    },
    hi: {
      brand: "NAVEYA",
      navHome: "होम", navAtt: "मेरी उपस्थिति", navLeave: "अवकाश", navPay: "वेतन पर्ची",
      navDocs: "दस्तावेज़", navProfile: "प्रोफ़ाइल", navSub: "प्रतिस्थापन",
      greeting: "नमस्ते, अनन्या",
      roleLine: "पीजीटी भौतिकी · NAV-0142 · सनराइज़ पब्लिक स्कूल, व्हाइटफ़ील्ड",
      lastNet: "पिछला शुद्ध वेतन · जुलाई",
      today: "आज", dateToday: "मंगलवार, 11 अगस्त 2026", inProgress: "जारी",
      ofTarget: "लक्ष्य 8:00 में से",
      lblIn: "आगमन", lblBrk: "ब्रेक", lblOut: "प्रस्थान",
      gate: "मुख्य द्वार · MG-02", breakSpan: "11:10 – 11:45", projected: "संभावित 15:30",
      provenance: "बायोमेट्रिक सत्यापित · ESSL मुख्य द्वार MG-02 · अंतिम सिंक 12:31",
      legendWorked: "कार्य", legendBreak: "ब्रेक", legendLeft: "शेष", now: "अभी",
      regTitle: "अगस्त रजिस्टर", regCaption: "1 – 11 अगस्त 2026",
      thDate: "दिनांक", thIn: "आगमन", thOut: "प्रस्थान", thHrs: "घंटे", thStatus: "स्थिति",
      stPresent: "उपस्थित", stLate: "विलंब", stLeave: "अवकाश", stOff: "साप्ताहिक अवकाश", stProg: "जारी",
      workedSoFar: "10 अगस्त तक 49:51 कार्य",
      sumPresent: "उपस्थित 6", sumLate: "विलंब 1", sumLeave: "अवकाश 1", sumOff: "साप्ताहिक 2",
      leaveTitle: "अवकाश शेष", leaveCaption: "नीति वर्ष अप्रैल 2026 – मार्च 2027",
      ltEL: "अर्जित", ltCL: "आकस्मिक", ltSL: "चिकित्सा", ltComp: "प्रतिपूरक",
      ofTotal: function (n) { return n + " में से"; },
      payTitle: "जुलाई 2026 · वेतन पर्ची", netPay: "शुद्ध वेतन",
      gross: "सकल आय", deductions: "कटौतियाँ",
      credited: "शुक्र, 31 जुलाई को जमा", download: "वेतन पर्ची डाउनलोड करें (PDF)",
      actionOverline: "कार्रवाई आवश्यक",
      actionTitle: "एचआर ने आपके पैन रिकॉर्ड के अद्यतन का अनुरोध किया है।",
      actionDue: "शुक्र, 14 अगस्त तक उत्तर दें", actionBtn: "उत्तर दें",
      holTitle: "अगली छुट्टी", holName: "स्वतंत्रता दिवस",
      holWhen: "शनि, 15 अगस्त · 4 दिन में", holNext: "फिर · रक्षा बंधन, शुक्र 28 अगस्त",
      reqTitle: "मेरे अनुरोध", reqEmpty: "सब स्पष्ट — कुछ भी लंबित नहीं",
      reqEmptySub: "स्वीकृत और पुराने अनुरोध ‘अवकाश’ में मिलेंगे।",
      reqNew: "नया अवकाश अनुरोध",
      themeAria: "थीम बदलें",
      days: { sun: "रवि", mon: "सोम", tue: "मंगल", wed: "बुध", thu: "गुरु", fri: "शुक्र", sat: "शनि" },
    },
  };

  /* ---------- mock data (realistic Indian school) ---------- */
  const REG = [
    { d: 1, day: "sat", tin: "07:26", tout: "12:10", hrs: "4:44", st: "present" },
    { d: 2, day: "sun", st: "off" },
    { d: 3, day: "mon", tin: "07:22", tout: "15:41", hrs: "8:19", st: "present" },
    { d: 4, day: "tue", tin: "07:31", tout: "15:36", hrs: "8:05", st: "present" },
    { d: 5, day: "wed", tin: "08:12", tout: "15:52", hrs: "7:40", st: "late" },
    { d: 6, day: "thu", tin: "07:19", tout: "15:33", hrs: "8:14", st: "present" },
    { d: 7, day: "fri", st: "leave" },
    { d: 8, day: "sat", tin: "07:28", tout: "12:04", hrs: "4:36", st: "present" },
    { d: 9, day: "sun", st: "off" },
    { d: 10, day: "mon", tin: "07:25", tout: "15:38", hrs: "8:13", st: "present" },
    { d: 11, day: "tue", tin: "07:24", tout: null, hrs: "4:32", st: "prog", today: true },
  ];
  const PAY = { gross: 104300, deductions: -17850, net: 86450 };
  const LEAVES = [
    { key: "ltEL", left: 8, total: 18, ck: "ltEL" },
    { key: "ltCL", left: 5, total: 12, ck: "ltCasual" },
    { key: "ltSL", left: 6, total: 10, ck: "ltSick" },
    { key: "ltComp", left: 1, total: 3, ck: "ltComp" },
  ];
  /* timeline geometry: 07:00 → 16:00 (percent of span) */
  const TL = {
    ticks: [{ p: 0, l: "07:00" }, { p: 22.2, l: "09:00" }, { p: 44.4, l: "11:00" }, { p: 66.7, l: "13:00" }, { p: 88.9, l: "15:00" }],
    work1: { a: 4.4, b: 46.3 }, brk: { a: 46.3, b: 52.8 }, work2: { a: 52.8, b: 61.3 },
    left: { a: 61.3, b: 94.4 }, now: 61.3,
  };

  /* ---------- tiny icon set (stroke SVG, no emoji) ---------- */
  function Svg(props) {
    return (
      <svg width={props.s || 20} height={props.s || 20} viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth={props.w || 1.7} strokeLinecap="round"
        strokeLinejoin="round" aria-hidden="true" style={props.style}>{props.children}</svg>
    );
  }
  const ICONS = {
    home: (s) => <Svg s={s}><path d="M3.5 10.5 12 3.5l8.5 7" /><path d="M5.5 9.5V20h13V9.5" /></Svg>,
    att: (s) => <Svg s={s}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3.2 2" /></Svg>,
    leave: (s) => <Svg s={s}><rect x="3.5" y="5" width="17" height="15.5" rx="2" /><path d="M3.5 9.5h17M8 3v4M16 3v4" /></Svg>,
    pay: (s) => <Svg s={s}><rect x="3" y="6" width="18" height="12" rx="2" /><circle cx="12" cy="12" r="2.6" /><path d="M6.4 9.5h.01M17.6 14.5h.01" /></Svg>,
    docs: (s) => <Svg s={s}><path d="M6 3.5h7.5L18 8v12.5H6z" /><path d="M13.5 3.5V8H18" /></Svg>,
    profile: (s) => <Svg s={s}><circle cx="12" cy="8.2" r="3.4" /><path d="M5 20c1.4-3.6 4-5.2 7-5.2s5.6 1.6 7 5.2" /></Svg>,
    sub: (s) => <Svg s={s}><path d="M4 8h13" /><path d="m14 4.5 3.5 3.5L14 11.5" /><path d="M20 16H7" /><path d="m10 12.5-3.5 3.5L10 19.5" /></Svg>,
    finger: (s) => <Svg s={s}><path d="M8 12a4 4 0 0 1 8 0c0 3-.5 5.5-1.5 7.5" /><path d="M12 12c0 3.2-.4 5.6-1.4 8" /><path d="M5.5 9a7.5 7.5 0 0 1 13 0" /></Svg>,
    sun: (s) => <Svg s={s}><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8" /></Svg>,
    moon: (s) => <Svg s={s}><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" /></Svg>,
    arrow: (s) => <Svg s={s}><path d="M4 12h15" /><path d="m14 6.5 5.5 5.5-5.5 5.5" /></Svg>,
  };

  /* ---------- ring (SVG donut) ---------- */
  function Ring({ size, stroke, frac, color, track, children }) {
    const r = (size - stroke) / 2;
    const C = 2 * Math.PI * r;
    return (
      <div style={{ position: "relative", width: size, height: size, flex: "none" }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)", display: "block" }} aria-hidden="true">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={(C * Math.min(frac, 1)) + " " + C} strokeLinecap="round" />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
          {children}
        </div>
      </div>
    );
  }

  /* ---------- abstract background motif — "drafting compass" ----------
     An architectural compass/sundial drawing of my own invention (NOT a
     tree): concentric survey rings + a ruled fan of bearings + tick
     crosses, anchored top-right; a quiet echo of quarter-arcs bottom-left.
     Drawn at very low stroke opacity; every card above it is opaque, so
     it only ever lives in the page gutters — never under text. */
  function Motif({ c, mode }) {
    const o = mode === "light" ? 0.05 : 0.06;
    const cx = 760, cy = 130;
    const rings = [80, 160, 240, 320, 410, 500];
    const fan = [];
    for (let a = 100; a <= 172; a += 12) {
      const rad = (a * Math.PI) / 180;
      fan.push([cx + 540 * Math.cos(rad), cy + 540 * Math.sin(rad)]);
    }
    const crosses = [[300, 470], [560, 640], [180, 240], [700, 700]];
    return (
      <React.Fragment>
        <svg width="980" height="920" viewBox="0 0 980 920" aria-hidden="true"
          style={{ position: "fixed", top: -30, right: -140, pointerEvents: "none", zIndex: 0 }}>
          <g stroke={c.ink} strokeOpacity={o} fill="none" strokeWidth="1.2">
            {rings.map(function (r, i) { return <circle key={i} cx={cx} cy={cy} r={r} />; })}
            {fan.map(function (p, i) { return <line key={i} x1={cx} y1={cy} x2={p[0]} y2={p[1]} />; })}
          </g>
          <circle cx={cx} cy={cy} r={285} fill="none" stroke={c.accent} strokeOpacity={mode === "light" ? 0.09 : 0.12}
            strokeWidth="2" strokeDasharray="3 7" />
          <g stroke={c.ink} strokeOpacity={o * 1.4} strokeWidth="1.2">
            {crosses.map(function (p, i) {
              return <g key={i}><line x1={p[0] - 7} y1={p[1]} x2={p[0] + 7} y2={p[1]} /><line x1={p[0]} y1={p[1] - 7} x2={p[0]} y2={p[1] + 7} /></g>;
            })}
          </g>
        </svg>
        <svg width="520" height="420" viewBox="0 0 520 420" aria-hidden="true"
          style={{ position: "fixed", bottom: -40, left: 64, pointerEvents: "none", zIndex: 0 }}>
          <g stroke={c.ink} strokeOpacity={o * 0.9} fill="none" strokeWidth="1.2">
            <path d="M0 420 A 300 300 0 0 1 300 120" transform="translate(-140 40)" />
            <path d="M0 420 A 380 380 0 0 1 380 40" transform="translate(-140 40)" />
            <path d="M0 420 A 460 460 0 0 1 460 -40" transform="translate(-140 40)" />
          </g>
        </svg>
      </React.Fragment>
    );
  }

  /* ---------- shared card shell ---------- */
  function Tile({ c, mode, col, row, fill, border, pad, style, children }) {
    return (
      <section style={Object.assign({
        gridColumn: col, gridRow: row,
        background: fill || c.surface,
        border: "1px solid " + (border || c.border),
        borderRadius: 16,
        boxShadow: G2.el[mode][1],
        padding: pad == null ? 24 : pad,
        position: "relative", zIndex: 1, overflow: "hidden",
        display: "flex", flexDirection: "column", minWidth: 0,
      }, style)}>{children}</section>
    );
  }

  /* ---------- status chip (label + dot glyph — never colour alone) ---------- */
  function Chip({ c, kind, label, deva }) {
    const map = {
      present: { bg: c.presentTint, tx: c.presentText, dot: c.present },
      late: { bg: c.lateTint, tx: c.lateText, dot: c.late },
      leave: { bg: c.leaveTint, tx: c.leaveText, dot: c.leave },
      off: { bg: c.offTint, tx: c.offText, dot: c.off },
      prog: { bg: c.accentSoft, tx: c.accent, dot: c.accent },
    };
    const m = map[kind] || map.off;
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 6, background: m.bg, color: m.tx,
        borderRadius: 999, padding: deva ? "2px 10px 3px" : "3px 10px", fontSize: 12,
        fontWeight: 600, fontFamily: F.ui, lineHeight: deva ? "20px" : "17px", whiteSpace: "nowrap",
      }}>
        <span style={{ width: 7, height: 7, borderRadius: 999, background: m.dot, flex: "none" }} />
        {label}
      </span>
    );
  }

  /* ================================================================
     THE SCREEN
     ================================================================ */
  function HomeB() {
    const [mode, setMode] = useState("light");
    const [lang, setLang] = useState("en");
    const c = G2.theme(mode);
    const dkc = G2.theme("dark"); // deep tile palette (brass on peacock ink), both modes
    const t = STR[lang];
    const deva = lang === "hi";
    const disp = deva ? F.dispHi : F.dispEn;
    const lh = function (latin, hindi) { return deva ? hindi : latin; };

    const NAV = [
      { k: "home", icon: "home", label: t.navHome, active: true },
      { k: "att", icon: "att", label: t.navAtt },
      { k: "leave", icon: "leave", label: t.navLeave },
      { k: "pay", icon: "pay", label: t.navPay },
      { k: "docs", icon: "docs", label: t.navDocs },
      { k: "profile", icon: "profile", label: t.navProfile },
      { k: "sub", icon: "sub", label: t.navSub },
    ];

    const caption = { fontFamily: F.ui, fontSize: 12, lineHeight: lh("17px", "20px"), fontWeight: 600, letterSpacing: deva ? 0 : "0.06em", textTransform: deva ? "none" : "uppercase", color: c.inkMuted };
    const tileTitle = { fontFamily: disp, fontSize: 17, lineHeight: lh("23px", "28px"), fontWeight: 600, color: c.ink, margin: 0 };
    const body = { fontFamily: F.ui, fontSize: 13.5, lineHeight: lh("20px", "24px"), fontWeight: 500, color: c.ink };
    const mono = function (px, color, weight) {
      return { fontFamily: F.mono, fontSize: px, fontWeight: weight || 500, color: color || c.ink, fontFeatureSettings: "'tnum' 1,'lnum' 1", fontVariantNumeric: "tabular-nums" };
    };

    /* ---- register cell grid ---- */
    const regCols = deva ? "104px 76px 76px 1fr 132px" : "96px 76px 76px 1fr 118px";

    const stLabel = { present: t.stPresent, late: t.stLate, leave: t.stLeave, off: t.stOff, prog: t.stProg };

    return (
      <div lang={lang} style={{ minHeight: "100vh", background: c.bg, fontFamily: F.ui, color: c.ink, colorScheme: mode }}>
        <style>{`
          html,body{margin:0}
          button, a { cursor: pointer; }
          button:focus-visible, a:focus-visible {
            outline: none;
            box-shadow: 0 0 0 2px ${c.bg}, 0 0 0 4.5px ${c.focus};
          }
          ::selection { background: ${c.sel}; }
        `}</style>

        <Motif c={c} mode={mode} />

        {/* ================= left rail — 84px, dark, icon over label ================= */}
        <nav aria-label="Primary" style={{
          position: "fixed", top: 0, left: 0, bottom: 0, width: 84, background: c.shell,
          display: "flex", flexDirection: "column", alignItems: "stretch", zIndex: 3,
        }}>
          <div style={{
            height: 64, display: "flex", alignItems: "center", justifyContent: "center",
            color: c.onShell, fontFamily: F.dispEn, fontWeight: 700, fontSize: 15, letterSpacing: "0.14em",
          }}>N</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: "6px 8px" }}>
            {NAV.map(function (item) {
              return (
                <button key={item.k} aria-current={item.active ? "page" : undefined} style={{
                  position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  padding: deva ? "9px 2px 8px" : "10px 2px 9px", border: "none", borderRadius: 10,
                  background: item.active ? c.shellActive : "transparent",
                  color: item.active ? c.onShell : c.onShellMuted,
                  fontFamily: F.ui, fontSize: 10, fontWeight: 600, lineHeight: deva ? "15px" : "13px",
                  width: "100%",
                }}>
                  {item.active ? <span aria-hidden="true" style={{ position: "absolute", left: -8, top: 10, bottom: 10, width: 3, borderRadius: 2, background: c.accent === dkc.accent ? c.accent : dkc.accent }} /> : null}
                  {ICONS[item.icon](20)}
                  <span style={{ maxWidth: 74, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* ================= content ================= */}
        <main style={{ marginLeft: 84, position: "relative", zIndex: 1, padding: "28px 40px 48px", maxWidth: 1600, boxSizing: "border-box" }}>

          {/* ---- masthead: greeting + net payable + toggles ---- */}
          <header style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, marginBottom: 24, flexWrap: "wrap" }}>
            <div style={{ minWidth: 0 }}>
              <div style={Object.assign({}, caption, { marginBottom: 4 })}>{t.dateToday}</div>
              <h1 style={{ fontFamily: disp, fontSize: 30, lineHeight: lh("38px", "48px"), fontWeight: 700, letterSpacing: deva ? 0 : "-0.015em", margin: 0, color: c.ink }}>{t.greeting}</h1>
              <div style={{ fontFamily: F.ui, fontSize: 13.5, lineHeight: lh("20px", "24px"), fontWeight: 500, color: c.inkMuted, marginTop: 4 }}>{t.roleLine}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, flex: "none" }}>
              {/* net payable — sacred */}
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2,
                background: c.surface, border: "1px solid " + c.border, borderRadius: 12,
                boxShadow: G2.el[mode][1], padding: "10px 16px",
              }}>
                <span style={{ fontFamily: F.ui, fontSize: 11.5, fontWeight: 600, color: c.inkMuted, lineHeight: lh("15px", "18px") }}>{t.lastNet}</span>
                <span style={Object.assign({}, mono(16, c.ink, 600), { lineHeight: "20px", textAlign: "right" })}>{inr(PAY.net)}</span>
              </div>
              {/* language — whole screen in ONE language */}
              <div role="group" aria-label="Language" style={{ display: "flex", background: c.surface, border: "1px solid " + c.border, borderRadius: 999, padding: 3, boxShadow: G2.el[mode][1] }}>
                {[{ k: "en", l: "EN" }, { k: "hi", l: "हिंदी" }].map(function (o) {
                  const on = lang === o.k;
                  return (
                    <button key={o.k} aria-pressed={on} onClick={function () { setLang(o.k); }} style={{
                      border: "none", borderRadius: 999, padding: "5px 14px 6px",
                      background: on ? c.accent : "transparent", color: on ? c.onAccent : c.inkMuted,
                      fontFamily: F.ui, fontSize: 12.5, fontWeight: 700, lineHeight: "18px",
                    }}>{o.l}</button>
                  );
                })}
              </div>
              {/* theme */}
              <button aria-label={t.themeAria} onClick={function () { setMode(mode === "light" ? "dark" : "light"); }} style={{
                width: 38, height: 38, borderRadius: 999, border: "1px solid " + c.border,
                background: c.surface, color: c.inkMuted, display: "flex", alignItems: "center",
                justifyContent: "center", boxShadow: G2.el[mode][1],
              }}>{mode === "light" ? ICONS.moon(18) : ICONS.sun(18)}</button>
            </div>
          </header>

          {/* ================= BENTO BOARD =================
              12-col grid · 92px row units · tiles deliberately differ
              in size AND kind: 5x4 hero · 7x6 register · 3x2 action ·
              2x2 holiday · 5x3 rings · 4x3 deep payslip · 3x3 quiet. */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gridAutoRows: 92, gap: 20 }}>

            {/* ---------- HERO · Today (5 cols × 4 rows) ---------- */}
            <Tile c={c} mode={mode} col="1 / span 5" row="1 / span 4">
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
                <h2 style={tileTitle}>{t.today}</h2>
                <Chip c={c} kind="prog" label={t.inProgress} deva={deva} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 28, marginTop: 18, flex: 1, minHeight: 0 }}>
                <Ring size={168} stroke={14} frac={272 / 480} color={c.accent} track={c.sunken}>
                  <span style={Object.assign({}, mono(30, c.ink, 600), { lineHeight: "34px" })}>4:32</span>
                  <span style={{ fontFamily: F.ui, fontSize: 11.5, fontWeight: 600, color: c.inkMuted, lineHeight: lh("15px", "19px"), maxWidth: 110 }}>{t.ofTarget}</span>
                </Ring>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: deva ? 10 : 14, minWidth: 0 }}>
                  {[
                    { l: t.lblIn, v: "07:24", sub: t.gate },
                    { l: t.lblBrk, v: "0:35", sub: t.breakSpan },
                    { l: t.lblOut, v: "—", sub: t.projected },
                  ].map(function (r, i) {
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, borderBottom: i < 2 ? "1px solid " + c.rule : "none", paddingBottom: i < 2 ? (deva ? 8 : 11) : 0 }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontFamily: F.ui, fontSize: 12.5, fontWeight: 700, color: c.ink, lineHeight: lh("17px", "21px") }}>{r.l}</div>
                          <div style={{ fontFamily: F.ui, fontSize: 11.5, fontWeight: 500, color: c.inkFaint, lineHeight: lh("15px", "19px"), whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.sub}</div>
                        </div>
                        <span style={Object.assign({}, mono(16, c.ink, 600), { lineHeight: "20px" })}>{r.v}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* day timeline */}
              <div style={{ marginTop: 16 }}>
                <div style={{ position: "relative", height: 12, borderRadius: 6, background: c.sunken }}>
                  {[
                    { s: TL.work1, bg: c.accent }, { s: TL.brk, bg: c.off }, { s: TL.work2, bg: c.accent },
                  ].map(function (seg, i) {
                    return <span key={i} style={{ position: "absolute", top: 0, bottom: 0, left: seg.s.a + "%", width: (seg.s.b - seg.s.a) + "%", background: seg.bg, borderRadius: 6 }} />;
                  })}
                  <span style={{ position: "absolute", top: 1, bottom: 1, left: TL.left.a + "%", width: (TL.left.b - TL.left.a) + "%", border: "1.5px dashed " + c.borderStrong, borderRadius: 6, boxSizing: "border-box" }} />
                  <span aria-hidden="true" style={{ position: "absolute", top: -4, bottom: -4, left: TL.now + "%", width: 2, background: c.ink, borderRadius: 1 }} />
                  <span style={Object.assign({}, mono(10, c.inkMuted, 600), { position: "absolute", top: -18, left: TL.now + "%", transform: "translateX(-50%)", lineHeight: "14px" })}>12:31</span>
                </div>
                <div style={{ position: "relative", height: 16, marginTop: 4 }}>
                  {TL.ticks.map(function (k, i) {
                    return <span key={i} style={Object.assign({}, mono(10, c.inkFaint), { position: "absolute", left: k.p + "%", transform: i === 0 ? "none" : "translateX(-50%)", lineHeight: "14px" })}>{k.l}</span>;
                  })}
                </div>
                {/* legend — shape + label, never colour alone */}
                <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: deva ? 4 : 6, flexWrap: "wrap" }}>
                  {[
                    { l: t.legendWorked, sw: { background: c.accent } },
                    { l: t.legendBreak, sw: { background: c.off } },
                    { l: t.legendLeft, sw: { border: "1.5px dashed " + c.borderStrong, background: "transparent" } },
                  ].map(function (g, i) {
                    return (
                      <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: F.ui, fontSize: 11.5, fontWeight: 600, color: c.inkMuted, lineHeight: lh("15px", "19px") }}>
                        <span style={Object.assign({ width: 14, height: 8, borderRadius: 3, boxSizing: "border-box" }, g.sw)} />
                        {g.l}
                      </span>
                    );
                  })}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: deva ? 8 : 10, color: c.inkFaint }}>
                  {ICONS.finger(14)}
                  <span style={{ fontFamily: F.ui, fontSize: 11.5, fontWeight: 500, lineHeight: lh("15px", "19px") }}>{t.provenance}</span>
                </div>
              </div>
            </Tile>

            {/* ---------- HERO · August register (7 cols × 6 rows) ---------- */}
            <Tile c={c} mode={mode} col="6 / span 7" row="1 / span 6" pad={0}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, padding: "22px 24px 14px" }}>
                <h2 style={tileTitle}>{t.regTitle}</h2>
                <span style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 600, color: c.inkFaint, lineHeight: lh("17px", "20px") }}>{t.regCaption}</span>
              </div>
              {/* head */}
              <div style={{ display: "grid", gridTemplateColumns: regCols, gap: 8, padding: "0 24px 8px", borderBottom: "1px solid " + c.ruleStrong }}>
                {[t.thDate, t.thIn, t.thOut, t.thHrs, t.thStatus].map(function (h, i) {
                  return <span key={i} style={Object.assign({}, caption, { fontSize: 11, textAlign: i === 3 ? "right" : i === 4 ? "right" : "left" })}>{h}</span>;
                })}
              </div>
              {/* rows — flex so the register fills its bento cell edge-to-edge */}
              <div style={{ flex: 1, minHeight: 0, overflow: "hidden", padding: "2px 0", display: "flex", flexDirection: "column" }}>
                {REG.map(function (r, i) {
                  const dim = r.st === "off";
                  return (
                    <div key={i} style={{
                      display: "grid", gridTemplateColumns: regCols, gap: 8, alignItems: "center",
                      padding: "0 24px", flex: "1 0 auto", minHeight: deva ? 39 : 38,
                      background: r.today ? c.sel : i % 2 ? c.alt : "transparent",
                      borderLeft: r.today ? "3px solid " + c.accent : "3px solid transparent",
                    }}>
                      <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: r.today ? 700 : 600, color: dim ? c.inkFaint : c.ink, lineHeight: lh("18px", "22px"), whiteSpace: "nowrap" }}>
                        {t.days[r.day]}&nbsp;<span style={mono(12.5, dim ? c.inkFaint : c.inkMuted, 500)}>{r.d}</span>
                      </span>
                      <span style={Object.assign({}, mono(13, dim ? c.inkFaint : c.ink), { lineHeight: "18px" })}>{r.tin || "—"}</span>
                      <span style={Object.assign({}, mono(13, dim ? c.inkFaint : c.ink), { lineHeight: "18px" })}>{r.tout || "—"}</span>
                      <span style={Object.assign({}, mono(13, dim ? c.inkFaint : c.ink, 600), { lineHeight: "18px", textAlign: "right" })}>{r.hrs || "—"}</span>
                      <span style={{ textAlign: "right" }}><Chip c={c} kind={r.st} label={stLabel[r.st]} deva={deva} /></span>
                    </div>
                  );
                })}
              </div>
              {/* footer summary — figures that sum */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: deva ? "10px 24px 12px" : "12px 24px 14px", borderTop: "1px solid " + c.ruleStrong, background: c.covered, flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Chip c={c} kind="present" label={t.sumPresent} deva={deva} />
                  <Chip c={c} kind="late" label={t.sumLate} deva={deva} />
                  <Chip c={c} kind="leave" label={t.sumLeave} deva={deva} />
                  <Chip c={c} kind="off" label={t.sumOff} deva={deva} />
                </div>
                <span style={Object.assign({}, mono(12.5, c.inkMuted, 600), { lineHeight: "18px" })}>{t.workedSoFar}</span>
              </div>
            </Tile>

            {/* ---------- ACTION · accent-filled (3 cols × 2 rows) ---------- */}
            <Tile c={c} mode={mode} col="1 / span 3" row="5 / span 2" fill={c.accent} border="transparent" pad={20}>
              <span style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, letterSpacing: deva ? 0 : "0.08em", textTransform: deva ? "none" : "uppercase", color: c.onAccent, opacity: 0.75, lineHeight: lh("15px", "18px") }}>{t.actionOverline}</span>
              <p style={{ fontFamily: deva ? F.dispHi : F.dispEn, fontSize: deva ? 14.5 : 15.5, lineHeight: lh("21px", "23px"), fontWeight: 600, color: c.onAccent, margin: deva ? "5px 0 0" : "7px 0 0" }}>{t.actionTitle}</p>
              <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <span style={{ fontFamily: F.ui, fontSize: 11.5, fontWeight: 600, color: c.onAccent, opacity: 0.8, lineHeight: lh("15px", "19px") }}>{t.actionDue}</span>
                <button style={{
                  border: "none", borderRadius: 999, background: c.onAccent, color: c.accent,
                  fontFamily: F.ui, fontSize: 12.5, fontWeight: 700, padding: deva ? "6px 16px 7px" : "7px 16px 8px",
                  lineHeight: lh("17px", "20px"), display: "inline-flex", alignItems: "center", gap: 6, flex: "none",
                }}>{t.actionBtn}{ICONS.arrow(14)}</button>
              </div>
            </Tile>

            {/* ---------- HOLIDAY · soft-filled (2 cols × 2 rows) ---------- */}
            <Tile c={c} mode={mode} col="4 / span 2" row="5 / span 2" fill={c.holidayTint} border="transparent" pad={20}>
              <span style={Object.assign({}, caption, { color: c.holidayText })}>{t.holTitle}</span>
              <div style={{ fontFamily: disp, fontSize: deva ? 17 : 18, lineHeight: lh("24px", "27px"), fontWeight: 700, color: c.ink, marginTop: 6 }}>{t.holName}</div>
              <div style={{ fontFamily: F.ui, fontSize: 12.5, fontWeight: 600, color: c.holidayText, lineHeight: lh("17px", "21px"), marginTop: 3 }}>{t.holWhen}</div>
              <div style={{ marginTop: "auto", paddingTop: 8, borderTop: "1px solid " + c.rule, fontFamily: F.ui, fontSize: 11.5, fontWeight: 500, color: c.inkMuted, lineHeight: lh("15px", "19px") }}>{t.holNext}</div>
            </Tile>

            {/* ---------- LEAVE RINGS (5 cols × 3 rows) ---------- */}
            <Tile c={c} mode={mode} col="1 / span 5" row="7 / span 3">
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
                <h2 style={tileTitle}>{t.leaveTitle}</h2>
                <span style={{ fontFamily: F.ui, fontSize: 11.5, fontWeight: 500, color: c.inkFaint, lineHeight: lh("15px", "19px") }}>{t.leaveCaption}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: deva ? 6 : 8, flex: 1 }}>
                {LEAVES.map(function (lv) {
                  return (
                    <div key={lv.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: deva ? 6 : 10, flex: 1, minWidth: 0 }}>
                      <Ring size={92} stroke={9} frac={lv.left / lv.total} color={c[lv.ck]} track={c[lv.ck + "Tint"]}>
                        <span style={Object.assign({}, mono(20, c.ink, 600), { lineHeight: "24px" })}>{lv.left}</span>
                      </Ring>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontFamily: F.ui, fontSize: 12.5, fontWeight: 700, color: c[lv.ck + "Text"], lineHeight: lh("17px", "21px") }}>{t[lv.key]}</div>
                        <div style={{ fontFamily: F.ui, fontSize: 11.5, fontWeight: 500, color: c.inkFaint, lineHeight: lh("15px", "19px") }}>{t.ofTotal(lv.total)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Tile>

            {/* ---------- PAYSLIP · deep peacock + brass (4 cols × 3 rows) ---------- */}
            <Tile c={c} mode={mode} col="6 / span 4" row="7 / span 3"
              fill={mode === "light" ? G2.light.shell : G2.surf[2]}
              border={mode === "light" ? "transparent" : G2.surfBorder} pad={24}>
              <span style={{ fontFamily: F.ui, fontSize: 11, fontWeight: 700, letterSpacing: deva ? 0 : "0.08em", textTransform: deva ? "none" : "uppercase", color: dkc.onShellMuted, lineHeight: lh("15px", "18px") }}>{t.payTitle}</span>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginTop: deva ? 8 : 12 }}>
                <span style={{ fontFamily: F.ui, fontSize: 13, fontWeight: 600, color: dkc.onShell, lineHeight: lh("18px", "22px") }}>{t.netPay}</span>
                <span style={Object.assign({}, mono(26, dkc.seal, 600), { lineHeight: "32px", textAlign: "right" })}>{inr(PAY.net)}</span>
              </div>
              <div style={{ marginTop: deva ? 10 : 14, display: "flex", flexDirection: "column", gap: deva ? 6 : 8 }}>
                {[
                  { l: t.gross, v: inr(PAY.gross) },
                  { l: t.deductions, v: inr(PAY.deductions) },
                ].map(function (r, i) {
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
                      <span style={{ fontFamily: F.ui, fontSize: 12.5, fontWeight: 500, color: dkc.onShellMuted, lineHeight: lh("17px", "21px") }}>{r.l}</span>
                      <span style={Object.assign({}, mono(13.5, dkc.onShell, 500), { lineHeight: "18px", textAlign: "right" })}>{r.v}</span>
                    </div>
                  );
                })}
                <div style={{ borderTop: "1px solid " + dkc.rule, paddingTop: deva ? 6 : 8, display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
                  <span style={{ fontFamily: F.ui, fontSize: 12.5, fontWeight: 700, color: dkc.onShell, lineHeight: lh("17px", "21px") }}>{t.netPay}</span>
                  <span style={Object.assign({}, mono(13.5, dkc.seal, 600), { lineHeight: "18px", textAlign: "right" })}>{inr(PAY.net)}</span>
                </div>
              </div>
              <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <span style={{ fontFamily: F.ui, fontSize: 11.5, fontWeight: 500, color: dkc.onShellMuted, lineHeight: lh("15px", "19px") }}>{t.credited}</span>
                <a href="#payslip" style={{ fontFamily: F.ui, fontSize: 12.5, fontWeight: 700, color: dkc.accent, textDecoration: "underline", textUnderlineOffset: 3, lineHeight: lh("17px", "21px"), borderRadius: 6 }}>{t.download}</a>
              </div>
            </Tile>

            {/* ---------- MY REQUESTS · illustrated quiet state (3 cols × 3 rows) ---------- */}
            <Tile c={c} mode={mode} col="10 / span 3" row="7 / span 3">
              <h2 style={tileTitle}>{t.reqTitle}</h2>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 4, padding: "6px 4px" }}>
                {/* quiet illustration: an empty tray under a settled check-seal */}
                <svg width="132" height="86" viewBox="0 0 132 86" aria-hidden="true" style={{ marginBottom: 6 }}>
                  <ellipse cx="66" cy="76" rx="46" ry="6" fill={c.sunken} />
                  <path d="M28 44h20l8 10h20l8-10h20v22a6 6 0 0 1-6 6H34a6 6 0 0 1-6-6z"
                    fill={c.accentSoft} stroke={c.accent} strokeWidth="1.6" strokeLinejoin="round" />
                  <path d="M28 44 40 24h52l12 20" fill="none" stroke={c.borderStrong} strokeWidth="1.6" strokeLinejoin="round" />
                  <circle cx="98" cy="20" r="13" fill={c.surface} stroke={c.present} strokeWidth="1.8" />
                  <path d="m92.5 20.5 3.5 3.5 7-7.5" fill="none" stroke={c.present} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="46" y1="10" x2="52" y2="10" stroke={c.borderStrong} strokeWidth="1.6" strokeLinecap="round" />
                  <line x1="49" y1="7" x2="49" y2="13" stroke={c.borderStrong} strokeWidth="1.6" strokeLinecap="round" />
                </svg>
                <div style={{ fontFamily: F.ui, fontSize: 13.5, fontWeight: 700, color: c.ink, lineHeight: lh("19px", "23px") }}>{t.reqEmpty}</div>
                <div style={{ fontFamily: F.ui, fontSize: 12, fontWeight: 500, color: c.inkFaint, lineHeight: lh("17px", "20px"), maxWidth: 240 }}>{t.reqEmptySub}</div>
              </div>
              <button style={{
                alignSelf: "center", border: "1px solid " + c.borderStrong, borderRadius: 999,
                background: "transparent", color: c.accent, fontFamily: F.ui, fontSize: 12.5,
                fontWeight: 700, padding: deva ? "6px 18px 7px" : "7px 18px 8px", lineHeight: lh("17px", "20px"),
              }}>{t.reqNew}</button>
            </Tile>
          </div>
        </main>
      </div>
    );
  }

  window.HomeExplore = window.HomeExplore || {};
  window.HomeExplore.B = HomeB;
})();
