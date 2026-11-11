/* @jsxRuntime classic */
/* ============================================================
   Naveya — Home EXPLORATION A · "Keka-faithful"
   Light canvas + white floating cards (soft radius, real padding),
   narrow-left / wide-right two-column composition, two colour-blocked
   cards, leave-balance rings, illustrated quiet state, low-contrast
   architectural colonnade motif on the page ground.

   DELIBERATE overrides of the shipped flat system (user feedback
   2026-08-10: "put things in cards like figma… keka looks so clean"):
   radius 12 on cards, cards float on the canvas with soft shadow,
   generous padding. Colours are read from window.G2 — no hex here.

   Self-contained: defines every component locally. Exposes
   window.HomeExplore.A. Do not import kit.jsx.
   ============================================================ */
(function () {
  const G2 = window.G2;
  const { useState, useContext, createContext } = React;

  /* ---------- local type families (exploration brief: Anek/Hanken) ---------- */
  const F = {
    display: "'Anek Latin', 'Anek Devanagari', system-ui, sans-serif",
    ui: "'Hanken Grotesk', 'Anek Devanagari', system-ui, sans-serif",
    deva: "'Anek Devanagari', system-ui, sans-serif",
    mono: G2.mono,
  };

  /* role -> latin/deva sizes. Devanagari gets ~25% taller line-height. */
  const TY = {
    display: { px: 30, lh: 1.18, lhD: 1.5, w: 700, fam: "display", ls: "-0.015em" },
    h2:      { px: 17, lh: 1.3,  lhD: 1.6, w: 700, fam: "display", ls: "-0.005em" },
    h3:      { px: 15, lh: 1.35, lhD: 1.65, w: 600, fam: "ui", ls: "0" },
    ui:      { px: 13.5, lh: 1.45, lhD: 1.8, w: 500, fam: "ui", ls: "0" },
    small:   { px: 12.5, lh: 1.45, lhD: 1.8, w: 500, fam: "ui", ls: "0" },
    caption: { px: 11, lh: 1.4, lhD: 1.7, w: 600, fam: "ui", ls: "0.06em" },
  };

  const Ctx = createContext(null);
  const useApp = () => useContext(Ctx);

  function ty(role, lang, extra) {
    const r = TY[role] || TY.ui;
    const deva = lang === "hi";
    return Object.assign(
      {
        fontFamily: deva ? F.deva : F[r.fam],
        fontSize: r.px,
        lineHeight: deva ? r.lhD : r.lh,
        fontWeight: r.w,
        letterSpacing: deva ? "0" : r.ls,
      },
      extra || {}
    );
  }

  /* ---------- Indian lakh-crore money, never abbreviated ---------- */
  function inr(n) {
    const neg = n < 0;
    const [i, d] = Math.abs(n).toFixed(2).split(".");
    const last3 = i.slice(-3);
    const rest = i.slice(0, -3);
    const grouped = rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + last3 : last3;
    return (neg ? "−₹" : "₹") + grouped + "." + d;
  }
  const mono = (px, extra) =>
    Object.assign(
      { fontFamily: F.mono, fontSize: px, fontWeight: 500, fontVariantNumeric: "tabular-nums lining-nums", letterSpacing: "0" },
      extra || {}
    );

  /* ---------- strings — whole screen in ONE language ---------- */
  const STR = {
    en: {
      navHome: "Home", navAtt: "My Attendance", navLeave: "Leave", navPay: "Payslips",
      navDocs: "Documents", navProfile: "Profile", navSubs: "Substitutions",
      greeting: "Good morning, Ananya", dateLine: "Tuesday, 11 August 2026",
      roleLine: "PGT · Physics · NAV-0142 · Sunrise Public School, Indiranagar",
      netPayable: "Net payable · July 2026", credited: "Credited 31 Jul",
      light: "Light", dark: "Dark",
      todayTitle: "Today", shift: "Shift 07:45 – 15:30", asOf: "as of 14:01",
      worked: "Worked", breakW: "Break", remaining: "Remaining",
      inLbl: "In", outLbl: "Out", breakLbl: "Break",
      provenance: "Biometric · Gate 2 · ESSL K30",
      payslipTitle: "Latest payslip", payslipMonth: "July 2026",
      grossLbl: "Gross earnings", dedLbl: "Deductions", netLbl: "Net pay", viewPayslip: "View payslip",
      holTitle: "Upcoming holidays", holCal: "School calendar 2026–27",
      hol1: "Raksha Bandhan", hol1d: "Fri · 28 Aug", hol2: "Janmashtami", hol2d: "Fri · 4 Sep",
      hol3: "Gandhi Jayanti", hol3d: "Fri · 2 Oct",
      docTitle: "Action needed", docChip: "Awaiting your response",
      docName: "PAN card — updated copy", docBy: "Requested by HR · Meera Iyer",
      docDue: "Due 18 Aug 2026",
      docNote: "The PAN copy on file is low-resolution. Please upload a clear scan of the original.",
      docRespond: "Respond", docView: "View request",
      leaveTitle: "Leave balances", leaveSub: "Year 2026–27 · as accrued",
      el: "Earned", cl: "Casual", sl: "Sick", co: "Comp-off", ofWord: "of", leftWord: "left",
      applyLeave: "Apply for leave",
      attTitle: "This month — Attendance", attSub: "August 2026 · Sunrise Public School",
      colDate: "Date", colDay: "Day", colIn: "In", colOut: "Out", colHours: "Hours", colStatus: "Status",
      stPresent: "Present", stLate: "Late", stLeave: "Casual leave", stOff: "Weekly off",
      sumPresent: "Present", sumLate: "Late", sumLeave: "Leave", sumOff: "Off",
      totalLbl: "Hours this month", fullReg: "Open full register",
      quietTitle: "Substitutions", quietHead: "No substitution periods today",
      quietBody: "Your timetable is unchanged. If a duty is assigned, it will appear here first.",
      monAbbr: "Aug",
      days: { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun" },
    },
    hi: {
      navHome: "होम", navAtt: "मेरी उपस्थिति", navLeave: "अवकाश", navPay: "वेतन पर्ची",
      navDocs: "दस्तावेज़", navProfile: "प्रोफ़ाइल", navSubs: "प्रतिस्थापन",
      greeting: "सुप्रभात, अनन्या", dateLine: "मंगलवार, 11 अगस्त 2026",
      roleLine: "पीजीटी · भौतिकी · NAV-0142 · सनराइज़ पब्लिक स्कूल, इंदिरानगर",
      netPayable: "शुद्ध देय · जुलाई 2026", credited: "31 जुलाई को जमा",
      light: "लाइट", dark: "डार्क",
      todayTitle: "आज", shift: "पाली 07:45 – 15:30", asOf: "14:01 तक",
      worked: "कार्य", breakW: "विराम", remaining: "शेष",
      inLbl: "आगमन", outLbl: "प्रस्थान", breakLbl: "विराम",
      provenance: "बायोमेट्रिक · गेट 2 · ESSL K30",
      payslipTitle: "नवीनतम वेतन पर्ची", payslipMonth: "जुलाई 2026",
      grossLbl: "सकल आय", dedLbl: "कटौतियाँ", netLbl: "शुद्ध वेतन", viewPayslip: "वेतन पर्ची देखें",
      holTitle: "आगामी अवकाश", holCal: "विद्यालय कैलेंडर 2026–27",
      hol1: "रक्षाबंधन", hol1d: "शुक्र · 28 अगस्त", hol2: "जन्माष्टमी", hol2d: "शुक्र · 4 सितंबर",
      hol3: "गांधी जयंती", hol3d: "शुक्र · 2 अक्टूबर",
      docTitle: "कार्रवाई आवश्यक", docChip: "आपके उत्तर की प्रतीक्षा",
      docName: "पैन कार्ड — अद्यतन प्रति", docBy: "एचआर द्वारा अनुरोधित · मीरा अय्यर",
      docDue: "अंतिम तिथि 18 अगस्त 2026",
      docNote: "रिकॉर्ड में उपलब्ध पैन प्रति धुंधली है। कृपया मूल दस्तावेज़ की स्पष्ट स्कैन अपलोड करें।",
      docRespond: "जवाब दें", docView: "अनुरोध देखें",
      leaveTitle: "अवकाश शेष", leaveSub: "वर्ष 2026–27 · अर्जित अनुसार",
      el: "अर्जित", cl: "आकस्मिक", sl: "चिकित्सा", co: "प्रतिपूरक", ofWord: "में से", leftWord: "शेष",
      applyLeave: "अवकाश के लिए आवेदन करें",
      attTitle: "इस माह — उपस्थिति", attSub: "अगस्त 2026 · सनराइज़ पब्लिक स्कूल",
      colDate: "तिथि", colDay: "दिन", colIn: "आगमन", colOut: "प्रस्थान", colHours: "घंटे", colStatus: "स्थिति",
      stPresent: "उपस्थित", stLate: "विलंब", stLeave: "आकस्मिक अवकाश", stOff: "साप्ताहिक अवकाश",
      sumPresent: "उपस्थित", sumLate: "विलंब", sumLeave: "अवकाश", sumOff: "साप्ताहिक",
      totalLbl: "इस माह के घंटे", fullReg: "पूरा रजिस्टर खोलें",
      quietTitle: "प्रतिस्थापन", quietHead: "आज कोई प्रतिस्थापन कालांश नहीं",
      quietBody: "आपकी समय-सारणी अपरिवर्तित है। कोई कार्य सौंपे जाने पर वह सबसे पहले यहीं दिखेगा।",
      monAbbr: "अगस्त",
      days: { mon: "सोम", tue: "मंगल", wed: "बुध", thu: "गुरु", fri: "शुक्र", sat: "शनि", sun: "रवि" },
    },
  };

  /* hours formatter — demo content is translated too */
  const fmtH = (lang, h, m) =>
    lang === "hi" ? h + "घं " + String(m).padStart(2, "0") + "मि" : h + "h " + String(m).padStart(2, "0") + "m";
  const fmtM = (lang, m) => (lang === "hi" ? m + "मि" : m + "m");

  /* ---------- data (realistic; hours sum to the stated total) ---------- */
  const ATT_ROWS = [
    { d: 10, day: "mon", tin: "07:48", tout: "15:34", h: [7, 21], st: "present" },
    { d: 9,  day: "sun", tin: null,    tout: null,    h: null,    st: "off" },
    { d: 8,  day: "sat", tin: "07:55", tout: "12:10", h: [4, 15], st: "present" },
    { d: 7,  day: "fri", tin: "08:26", tout: "15:31", h: [6, 40], st: "late" },
    { d: 6,  day: "thu", tin: "07:51", tout: "15:30", h: [7, 14], st: "present" },
    { d: 5,  day: "wed", tin: null,    tout: null,    h: null,    st: "leave" },
    { d: 4,  day: "tue", tin: "07:46", tout: "15:32", h: [7, 21], st: "present" },
    { d: 3,  day: "mon", tin: "07:53", tout: "15:29", h: [7, 11], st: "present" },
    { d: 2,  day: "sun", tin: null,    tout: null,    h: null,    st: "off" },
    { d: 1,  day: "sat", tin: "07:58", tout: "12:05", h: [4, 7],  st: "present" },
  ];
  const ATT_TOTAL = [44, 9]; /* 2649 min — the rows above sum to this */

  const PAY = { gross: 104600, ded: 18158, net: 86442 }; /* net = gross − ded */

  const LEAVES = [
    { key: "el", have: 8, total: 12, role: "ltEL" },
    { key: "cl", have: 5, total: 8, role: "ltCasual" },
    { key: "sl", have: 4, total: 10, role: "ltSick" },
    { key: "co", have: 1, total: 2, role: "ltComp" },
  ];

  /* ============================================================
     primitives
     ============================================================ */
  function Card({ fill, border, pad, style, children }) {
    const { c, mode } = useApp();
    return (
      <section
        style={Object.assign(
          {
            background: fill || c.surface,
            border: "1px solid " + (border || c.border),
            borderRadius: 12,
            boxShadow: (G2.el[mode] || G2.el.light)[1],
            padding: pad == null ? 22 : pad,
            position: "relative",
            overflow: "hidden",
          },
          style || {}
        )}
      >
        {children}
      </section>
    );
  }

  function CardHead({ title, sub, right, tone }) {
    const { c, lang } = useApp();
    return (
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
        <div>
          <h2 style={ty("h2", lang, { margin: 0, color: tone || c.ink })}>{title}</h2>
          {sub ? <div style={ty("small", lang, { color: tone ? "inherit" : c.inkMuted, opacity: tone ? 0.8 : 1, marginTop: 2 })}>{sub}</div> : null}
        </div>
        {right || null}
      </div>
    );
  }

  function Chip({ glyph, word, bg, fg }) {
    const { lang } = useApp();
    return (
      <span
        style={ty("small", lang, {
          display: "inline-flex", alignItems: "center", gap: 6,
          background: bg, color: fg, fontWeight: 600,
          padding: "3px 10px", borderRadius: 999, whiteSpace: "nowrap",
        })}
      >
        <span aria-hidden="true" style={{ fontSize: 11 }}>{glyph}</span>
        {word}
      </span>
    );
  }

  function Ring({ size, stroke, frac, track, bar, children }) {
    const r = (size - stroke) / 2;
    const C = 2 * Math.PI * r;
    return (
      <div style={{ position: "relative", width: size, height: size, flex: "0 0 auto" }}>
        <svg width={size} height={size} aria-hidden="true">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
          <circle
            cx={size / 2} cy={size / 2} r={r} fill="none" stroke={bar} strokeWidth={stroke}
            strokeDasharray={C * Math.min(1, Math.max(0, frac)) + " " + C}
            strokeLinecap="round" transform={"rotate(-90 " + size / 2 + " " + size / 2 + ")"}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          {children}
        </div>
      </div>
    );
  }

  function LinkBtn({ children, onClick }) {
    const { c, lang } = useApp();
    return (
      <button
        type="button" onClick={onClick || (() => {})}
        style={ty("small", lang, {
          background: "none", border: "none", padding: 0, cursor: "pointer",
          color: c.accent, fontWeight: 600, textDecoration: "underline",
          textUnderlineOffset: 3, textDecorationThickness: 1,
        })}
      >
        {children}
      </button>
    );
  }

  function Btn({ children, kind, onClick }) {
    const { c, lang } = useApp();
    const primary = kind === "primary";
    return (
      <button
        type="button" onClick={onClick || (() => {})}
        style={ty("ui", lang, {
          background: primary ? c.action : "transparent",
          color: primary ? c.onAction : c.ink,
          border: "1px solid " + (primary ? c.action : c.borderStrong),
          borderRadius: 8, padding: "8px 18px", fontWeight: 600, cursor: "pointer",
        })}
      >
        {children}
      </button>
    );
  }

  /* ============================================================
     rail icons — 20×20 stroke SVGs
     ============================================================ */
  const ic = (d, extra) => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d={d} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      {extra || null}
    </svg>
  );
  const ICONS = {
    home: ic("M3.5 10 L10 4 L16.5 10 M5 8.8 V16 H8.2 V12 H11.8 V16 H15 V8.8"),
    att: ic("M4 5 H16 V16.5 H4 Z M4 8.5 H16 M7 12.5 L9 14.5 L13 10.5 M7 3.5 V6 M13 3.5 V6"),
    leave: ic("M4.5 15.5 C4.5 8.5 9.5 4.5 15.5 4.5 C15.5 11.5 11 15.5 4.5 15.5 Z M4.5 15.5 C7 12.5 10 9.5 13 7"),
    pay: ic("M2.8 6 H17.2 V14 H2.8 Z", <circle cx="10" cy="10" r="2.3" stroke="currentColor" strokeWidth="1.6" fill="none" />),
    docs: ic("M5 2.8 H11.6 L15 6.2 V17.2 H5 Z M11.4 3 V6.5 H14.8 M7.4 10 H12.6 M7.4 13 H12.6"),
    profile: ic("M10 9.4 A3 3 0 1 0 10 3.4 A3 3 0 0 0 10 9.4 Z M3.8 17 C4.4 13.6 7 12 10 12 C13 12 15.6 13.6 16.2 17"),
    subs: ic("M12.5 2.8 L15.8 6 L12.5 9.2 M15.8 6 H5.5 M7.5 17.2 L4.2 14 L7.5 10.8 M4.2 14 H14.5"),
  };

  function Rail({ active }) {
    const { c, t, lang } = useApp();
    /* the rail is always dark — its accent marks read from the DARK
       token set so contrast holds in both modes (token read, not hex) */
    const railAccent = G2.dark.accent;
    const items = [
      { k: "home", l: t.navHome }, { k: "att", l: t.navAtt }, { k: "leave", l: t.navLeave },
      { k: "pay", l: t.navPay }, { k: "docs", l: t.navDocs }, { k: "profile", l: t.navProfile },
      { k: "subs", l: t.navSubs },
    ];
    return (
      <nav
        aria-label="Naveya"
        style={{
          width: 84, flex: "0 0 84px", background: c.shell, display: "flex",
          flexDirection: "column", alignItems: "center", padding: "18px 0 16px", gap: 4,
          overflowY: "auto",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            width: 38, height: 38, borderRadius: 10, background: railAccent,
            color: G2.dark.onAccent, display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: F.display, fontWeight: 700, fontSize: 19, marginBottom: 18,
          }}
        >
          N
        </div>
        {items.map((it) => {
          const on = it.k === active;
          return (
            <button
              key={it.k} type="button" aria-current={on ? "page" : undefined}
              style={{
                width: 72, border: "none", cursor: "pointer", borderRadius: 10,
                background: on ? c.shellActive : "transparent",
                color: on ? c.onShell : c.onShellMuted,
                display: "flex", flexDirection: "column", alignItems: "center",
                gap: 4, padding: "9px 2px 7px", marginBottom: 2,
              }}
            >
              <span style={{ color: on ? railAccent : "inherit", display: "flex" }}>{ICONS[it.k]}</span>
              <span
                style={{
                  fontFamily: lang === "hi" ? F.deva : F.ui, fontSize: 9.5, fontWeight: 600,
                  lineHeight: lang === "hi" ? 1.6 : 1.25, textAlign: "center", letterSpacing: lang === "hi" ? 0 : "0.02em",
                }}
              >
                {it.l}
              </span>
              {on ? (
                <span aria-hidden="true" style={{ width: 16, height: 3, borderRadius: 2, background: railAccent }} />
              ) : null}
            </button>
          );
        })}
      </nav>
    );
  }

  /* ============================================================
     page-ground motif — a quiet colonnade (arched corridor bays),
     architectural, very low opacity, never behind body text columns
     ============================================================ */
  function Motif() {
    const { c, mode } = useApp();
    const arch = (x, w, h) => {
      const r = w / 2;
      return "M" + x + ",420 L" + x + "," + (420 - h + r) +
        " A" + r + "," + r + " 0 0 1 " + (x + w) + "," + (420 - h + r) +
        " L" + (x + w) + ",420";
    };
    return (
      <svg
        width="760" height="420" viewBox="0 0 760 420" aria-hidden="true"
        style={{
          position: "absolute", right: -30, bottom: 0, pointerEvents: "none",
          opacity: mode === "dark" ? 0.1 : 0.07,
        }}
      >
        <g fill="none" stroke={c.accent} strokeWidth="2">
          <path d={arch(20, 120, 300)} />
          <path d={arch(170, 120, 330)} />
          <path d={arch(320, 120, 360)} />
          <path d={arch(470, 120, 330)} />
          <path d={arch(620, 120, 300)} />
          {/* inner arch echo per bay */}
          <path d={arch(40, 80, 270)} strokeWidth="1.2" />
          <path d={arch(190, 80, 300)} strokeWidth="1.2" />
          <path d={arch(340, 80, 330)} strokeWidth="1.2" />
          <path d={arch(490, 80, 300)} strokeWidth="1.2" />
          <path d={arch(640, 80, 270)} strokeWidth="1.2" />
          {/* ground line + plinth rules */}
          <path d="M0,420 H760" strokeWidth="2.5" />
          <path d="M0,398 H760" strokeWidth="1" />
        </g>
      </svg>
    );
  }

  /* ============================================================
     masthead
     ============================================================ */
  function SunIcon() {
    return (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
        <circle cx="7.5" cy="7.5" r="3" stroke="currentColor" strokeWidth="1.4" />
        <path d="M7.5 1 V2.6 M7.5 12.4 V14 M1 7.5 H2.6 M12.4 7.5 H14 M3 3 L4.1 4.1 M10.9 10.9 L12 12 M12 3 L10.9 4.1 M4.1 10.9 L3 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  }
  function MoonIcon() {
    return (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
        <path d="M12.5 9.5 A5.5 5.5 0 1 1 5.5 2.5 A4.5 4.5 0 0 0 12.5 9.5 Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    );
  }

  function TogglePill({ options, value, onChange, ariaLabel }) {
    const { c } = useApp();
    return (
      <div role="group" aria-label={ariaLabel} style={{ display: "inline-flex", background: c.sunken, border: "1px solid " + c.border, borderRadius: 999, padding: 3 }}>
        {options.map((o) => {
          const on = o.value === value;
          return (
            <button
              key={o.value} type="button" onClick={() => onChange(o.value)} aria-pressed={on}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                fontFamily: o.deva ? F.deva : F.ui, fontSize: 12, fontWeight: 600,
                lineHeight: o.deva ? 1.6 : 1.3,
                border: "none", cursor: "pointer", borderRadius: 999, padding: "4px 12px",
                background: on ? c.surface : "transparent",
                color: on ? c.ink : c.inkMuted,
                boxShadow: on ? "0 1px 2px rgba(0,0,0,.12)" : "none",
              }}
            >
              {o.icon || null}
              {o.label}
            </button>
          );
        })}
      </div>
    );
  }

  function Masthead() {
    const { c, t, lang, setLang, mode, setMode } = useApp();
    return (
      <header style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
        <div>
          <div style={ty("small", lang, { color: c.inkMuted, fontWeight: 600 })}>{t.dateLine}</div>
          <h1 style={ty("display", lang, { margin: "4px 0 4px", color: c.ink })}>{t.greeting}</h1>
          <div style={ty("small", lang, { color: c.inkMuted })}>{t.roleLine}</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* net payable — sacred money */}
          <div style={{ textAlign: "right" }}>
            <div style={ty("caption", lang, { color: c.inkMuted, textTransform: lang === "hi" ? "none" : "uppercase" })}>{t.netPayable}</div>
            <div style={mono(24, { color: c.ink, fontWeight: 600, textAlign: "right", marginTop: 2 })}>{inr(PAY.net)}</div>
            <div style={ty("caption", lang, { color: c.presentText, marginTop: 2, display: "flex", alignItems: "center", gap: 5, justifyContent: "flex-end" })}>
              <span aria-hidden="true">✓</span>{t.credited}
            </div>
          </div>
          <div aria-hidden="true" style={{ width: 1, height: 44, background: c.borderStrong }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
            <TogglePill
              ariaLabel="Language"
              options={[{ value: "en", label: "EN" }, { value: "hi", label: "हिंदी", deva: true }]}
              value={lang} onChange={setLang}
            />
            <TogglePill
              ariaLabel="Theme"
              options={[
                { value: "light", label: t.light, icon: <SunIcon /> },
                { value: "dark", label: t.dark, icon: <MoonIcon /> },
              ]}
              value={mode} onChange={setMode}
            />
          </div>
          <div
            aria-hidden="true"
            style={{
              width: 46, height: 46, borderRadius: 999, background: c.accentSoft,
              color: c.accent, display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: F.display, fontWeight: 700, fontSize: 16, border: "1px solid " + c.border,
            }}
          >
            AR
          </div>
        </div>
      </header>
    );
  }

  /* ============================================================
     LEFT column cards
     ============================================================ */
  function TodayCard() {
    const { c, t, lang, mode } = useApp();
    const dark = mode === "dark";
    /* colour-blocked: light = solid accent; dark = deep accentSoft */
    const fill = dark ? c.accentSoft : c.accent;
    const fg = dark ? c.ink : c.onAccent;
    const fgMut = dark ? c.inkMuted : "rgba(255,255,255,.72)";
    const ringBar = dark ? c.accent : c.onAccent;
    const ringTrack = dark ? "rgba(255,255,255,.10)" : "rgba(255,255,255,.28)";
    /* worked 5h44 of 7h15 */
    const frac = (5 * 60 + 44) / (7 * 60 + 15);
    /* timeline 07:45→15:30 = 465 min: work 07:52–11:05, break 11:05–11:30, work 11:30–14:01, remaining */
    const seg = (a, b) => ((b - a) / 465) * 100;
    const m = (hh, mm) => hh * 60 + mm - (7 * 60 + 45);
    const segs = [
      { w: seg(0, m(7, 52)), col: "transparent" },
      { w: seg(m(7, 52), m(11, 5)), col: dark ? c.present : "rgba(255,255,255,.92)" },
      { w: seg(m(11, 5), m(11, 30)), col: dark ? c.late : "rgba(255,255,255,.45)" },
      { w: seg(m(11, 30), m(14, 1)), col: dark ? c.present : "rgba(255,255,255,.92)" },
    ];
    const legend = [
      { word: t.worked, col: dark ? c.present : "rgba(255,255,255,.92)", glyph: "■" },
      { word: t.breakW, col: dark ? c.late : "rgba(255,255,255,.45)", glyph: "■" },
      { word: t.remaining, col: dark ? "rgba(255,255,255,.18)" : "rgba(255,255,255,.22)", glyph: "■" },
    ];
    return (
      <Card fill={fill} border={dark ? c.border : "transparent"} style={{ color: fg }}>
        <CardHead
          title={t.todayTitle} tone={fg}
          sub={<span style={{ color: fgMut }}>{t.shift} · {t.asOf}</span>}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <Ring size={124} stroke={11} frac={frac} track={ringTrack} bar={ringBar}>
            <span style={mono(21, { color: fg, fontWeight: 600 })}>{fmtH(lang, 5, 44)}</span>
            <span style={ty("caption", lang, { color: fgMut, marginTop: 2 })}>{t.ofWord} {fmtH(lang, 7, 15)}</span>
          </Ring>
          <div style={{ flex: 1, minWidth: 0 }}>
            {[
              [t.inLbl, "07:52"], [t.breakLbl, fmtM(lang, 25)], [t.outLbl, "—"],
            ].map((r, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "5px 0", borderBottom: i < 2 ? "1px solid " + (dark ? c.rule : "rgba(255,255,255,.18)") : "none" }}>
                <span style={ty("small", lang, { color: fgMut, fontWeight: 600 })}>{r[0]}</span>
                <span style={mono(14, { color: fg })}>{r[1]}</span>
              </div>
            ))}
          </div>
        </div>
        {/* day timeline */}
        <div style={{ marginTop: 18 }}>
          <div style={{ display: "flex", height: 10, borderRadius: 6, overflow: "hidden", background: dark ? "rgba(255,255,255,.08)" : "rgba(255,255,255,.22)" }}>
            {segs.map((s, i) => (
              <div key={i} style={{ width: s.w + "%", background: s.col }} />
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
            {["07:45", "10:00", "12:00", "14:00", "15:30"].map((x) => (
              <span key={x} style={mono(10, { color: fgMut })}>{x}</span>
            ))}
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap" }}>
            {legend.map((l, i) => (
              <span key={i} style={ty("caption", lang, { color: fgMut, display: "inline-flex", gap: 6, alignItems: "center" })}>
                <span aria-hidden="true" style={{ color: l.col, fontSize: 10 }}>{l.glyph}</span>{l.word}
              </span>
            ))}
          </div>
        </div>
        {/* provenance */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16, paddingTop: 12, borderTop: "1px solid " + (dark ? c.rule : "rgba(255,255,255,.18)") }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" style={{ color: fgMut }}>
            <path d="M7 3.2 A3.8 3.8 0 0 1 10.8 7 V9 M7 5.2 A1.8 1.8 0 0 1 8.8 7 V10.5 M7 7 V11.5 M5.2 6 A1.8 1.8 0 0 0 5.2 8 V10" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
          </svg>
          <span style={ty("caption", lang, { color: fgMut })}>{t.provenance}</span>
        </div>
      </Card>
    );
  }

  function PayslipCard() {
    const { c, t, lang } = useApp();
    const rows = [
      [t.grossLbl, PAY.gross, false],
      [t.dedLbl, -PAY.ded, false],
      [t.netLbl, PAY.net, true],
    ];
    return (
      <Card>
        <CardHead title={t.payslipTitle} sub={t.payslipMonth} right={<LinkBtn>{t.viewPayslip}</LinkBtn>} />
        {rows.map((r, i) => (
          <div
            key={i}
            style={{
              display: "flex", justifyContent: "space-between", alignItems: "baseline",
              padding: r[2] ? "10px 0 2px" : "7px 0",
              borderTop: r[2] ? "2px solid " + c.ruleStrong : "none",
              borderBottom: !r[2] ? "1px solid " + c.rule : "none",
              marginTop: r[2] ? 6 : 0,
            }}
          >
            <span style={ty(r[2] ? "h3" : "small", lang, { color: r[2] ? c.ink : c.inkMuted })}>{r[0]}</span>
            <span style={mono(r[2] ? 18 : 13.5, { color: r[2] ? c.ink : c.inkMuted, fontWeight: r[2] ? 600 : 500, textAlign: "right" })}>
              {inr(r[1])}
            </span>
          </div>
        ))}
      </Card>
    );
  }

  function HolidayCard() {
    const { c, t, lang, mode } = useApp();
    const dark = mode === "dark";
    /* second colour-block: warm brass seal */
    const fill = dark ? c.sealSoft : c.seal;
    const fgTop = dark ? c.seal : c.onAccent; /* onAccent is white in light */
    const fgMut = dark ? "rgba(222,180,100,.75)" : "rgba(255,255,255,.75)";
    const rows = [
      [t.hol1, t.hol1d], [t.hol2, t.hol2d], [t.hol3, t.hol3d],
    ];
    return (
      <Card fill={fill} border={dark ? c.border : "transparent"} style={{ color: fgTop }}>
        <CardHead title={t.holTitle} tone={fgTop} sub={<span style={{ color: fgMut }}>{t.holCal}</span>} />
        {rows.map((r, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "8px 0", borderBottom: i < rows.length - 1 ? "1px solid " + (dark ? "rgba(222,180,100,.18)" : "rgba(255,255,255,.22)") : "none" }}>
            <span style={ty("ui", lang, { color: fgTop, fontWeight: 600 })}>{r[0]}</span>
            <span style={mono(12.5, { color: fgMut })}>{r[1]}</span>
          </div>
        ))}
      </Card>
    );
  }

  /* ============================================================
     RIGHT column cards
     ============================================================ */
  function DocRequestCard() {
    const { c, t, lang } = useApp();
    return (
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 320 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <h2 style={ty("h2", lang, { margin: 0, color: c.ink })}>{t.docTitle}</h2>
              <Chip glyph="!" word={t.docChip} bg={c.lateTint} fg={c.lateText} />
            </div>
            <div style={ty("h3", lang, { color: c.ink })}>{t.docName}</div>
            <div style={ty("small", lang, { color: c.inkMuted, marginTop: 3 })}>
              {t.docBy} · {t.docDue}
            </div>
            <p style={ty("small", lang, { color: c.inkMuted, margin: "8px 0 0", maxWidth: 560 })}>{t.docNote}</p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", paddingTop: 4 }}>
            <Btn kind="primary">{t.docRespond}</Btn>
            <Btn>{t.docView}</Btn>
          </div>
        </div>
      </Card>
    );
  }

  function LeaveCard() {
    const { c, t, lang } = useApp();
    return (
      <Card style={{ flex: "1.35 1 0", minWidth: 0 }}>
        <CardHead title={t.leaveTitle} sub={t.leaveSub} right={<LinkBtn>{t.applyLeave}</LinkBtn>} />
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
          {LEAVES.map((lv) => (
            <div key={lv.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flex: 1, minWidth: 100 }}>
              <Ring size={92} stroke={9} frac={lv.have / lv.total} track={c.sunken} bar={c[lv.role]}>
                <span style={mono(20, { color: c.ink, fontWeight: 600 })}>{lv.have}</span>
                <span style={ty("caption", lang, { color: c.inkFaint })}>{t.ofWord} {lv.total}</span>
              </Ring>
              <span style={ty("small", lang, { color: c[lv.role + "Text"], fontWeight: 600, textAlign: "center" })}>{t[lv.key]}</span>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  /* quiet-state illustration — an open notebook, pen at rest (line art) */
  function QuietIllo() {
    const { c } = useApp();
    return (
      <svg width="128" height="86" viewBox="0 0 128 86" fill="none" aria-hidden="true">
        <g stroke={c.inkFaint} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          {/* open notebook */}
          <path d="M18 66 C30 58 48 58 62 64 C76 58 94 58 106 66 L106 30 C94 22 76 22 62 28 C48 22 30 22 18 30 Z" />
          <path d="M62 28 V64" />
          {/* page rules */}
          <path d="M28 38 C38 33 50 33 56 36 M28 46 C38 41 50 41 56 44 M28 54 C38 49 50 49 56 52" strokeWidth="1.1" />
          <path d="M68 36 C74 33 86 33 96 38 M68 44 C74 41 86 41 96 46" strokeWidth="1.1" />
        </g>
        {/* pen resting across, accent */}
        <g stroke={c.accent} strokeWidth="1.8" strokeLinecap="round">
          <path d="M74 56 L102 44" />
          <path d="M102 44 L108 41.5 L105.5 47.5 Z" fill={c.accent} strokeWidth="1.2" />
        </g>
        {/* calm dots */}
        <g fill={c.inkFaint}>
          <circle cx="22" cy="14" r="1.6" /><circle cx="34" cy="9" r="1.2" /><circle cx="46" cy="13" r="1" />
        </g>
      </svg>
    );
  }

  function QuietCard() {
    const { c, t, lang } = useApp();
    return (
      <Card style={{ flex: "1 1 0", minWidth: 0, display: "flex", flexDirection: "column" }}>
        <CardHead title={t.quietTitle} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 10, padding: "4px 10px 8px" }}>
          <QuietIllo />
          <div style={ty("h3", lang, { color: c.ink })}>{t.quietHead}</div>
          <p style={ty("small", lang, { color: c.inkMuted, margin: 0, maxWidth: 320 })}>{t.quietBody}</p>
        </div>
      </Card>
    );
  }

  const ST_META = {
    present: { glyph: "✓", tint: "presentTint", text: "presentText", word: "stPresent" },
    late: { glyph: "▲", tint: "lateTint", text: "lateText", word: "stLate" },
    leave: { glyph: "◆", tint: "leaveTint", text: "leaveText", word: "stLeave" },
    off: { glyph: "—", tint: "offTint", text: "offText", word: "stOff" },
  };

  function AttendanceCard() {
    const { c, t, lang } = useApp();
    const th = ty("caption", lang, { color: c.inkFaint, textTransform: lang === "hi" ? "none" : "uppercase", textAlign: "left", padding: "0 0 8px", fontWeight: 700 });
    const sums = [
      { k: "sumPresent", n: 6, st: "present" },
      { k: "sumLate", n: 1, st: "late" },
      { k: "sumLeave", n: 1, st: "leave" },
      { k: "sumOff", n: 2, st: "off" },
    ];
    return (
      <Card pad={0}>
        {/* proper card header, padded — the table lives INSIDE the card */}
        <div style={{ padding: "20px 22px 0" }}>
          <CardHead
            title={t.attTitle} sub={t.attSub}
            right={
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                {sums.map((s) => (
                  <Chip key={s.k} glyph={ST_META[s.st].glyph} word={t[s.k] + " " + s.n} bg={c[ST_META[s.st].tint]} fg={c[ST_META[s.st].text]} />
                ))}
              </div>
            }
          />
        </div>
        <div style={{ padding: "0 22px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid " + c.ruleStrong }}>
                <th style={th}>{t.colDate}</th>
                <th style={th}>{t.colDay}</th>
                <th style={Object.assign({}, th, { textAlign: "right" })}>{t.colIn}</th>
                <th style={Object.assign({}, th, { textAlign: "right" })}>{t.colOut}</th>
                <th style={Object.assign({}, th, { textAlign: "right" })}>{t.colHours}</th>
                <th style={Object.assign({}, th, { textAlign: "left", paddingLeft: 26 })}>{t.colStatus}</th>
              </tr>
            </thead>
            <tbody>
              {ATT_ROWS.map((r, i) => {
                const meta = ST_META[r.st];
                const dim = r.st === "off";
                return (
                  <tr key={i} style={{ borderBottom: i < ATT_ROWS.length - 1 ? "1px solid " + c.rule : "none", background: dim ? c.alt : "transparent" }}>
                    <td style={{ padding: "9px 0" }}>
                      <span style={mono(13, { color: dim ? c.inkFaint : c.ink })}>{r.d} {t.monAbbr}</span>
                    </td>
                    <td style={ty("small", lang, { color: dim ? c.inkFaint : c.inkMuted })}>{t.days[r.day]}</td>
                    <td style={mono(13, { color: dim ? c.inkFaint : c.ink, textAlign: "right", display: "table-cell" })}>{r.tin || "—"}</td>
                    <td style={mono(13, { color: dim ? c.inkFaint : c.ink, textAlign: "right" })}>{r.tout || "—"}</td>
                    <td style={mono(13, { color: dim ? c.inkFaint : c.ink, textAlign: "right" })}>{r.h ? fmtH(lang, r.h[0], r.h[1]) : "—"}</td>
                    <td style={{ paddingLeft: 26 }}>
                      <Chip glyph={meta.glyph} word={t[meta.word]} bg={c[meta.tint]} fg={c[meta.text]} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* footer — figures sum */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 22px 18px", borderTop: "2px solid " + c.ruleStrong, marginTop: 2 }}>
          <LinkBtn>{t.fullReg}</LinkBtn>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <span style={ty("small", lang, { color: c.inkMuted, fontWeight: 600 })}>{t.totalLbl}</span>
            <span style={mono(16, { color: c.ink, fontWeight: 600 })}>{fmtH(lang, ATT_TOTAL[0], ATT_TOTAL[1])}</span>
          </div>
        </div>
      </Card>
    );
  }

  /* ============================================================
     root
     ============================================================ */
  function HomeA() {
    const [mode, setMode] = useState("light");
    const [lang, setLang] = useState("en");
    const c = G2.theme(mode);
    const t = STR[lang];
    const ctx = { c, mode, setMode, lang, setLang, t };
    return (
      <Ctx.Provider value={ctx}>
        <style>{
          ":focus-visible{outline:2px solid " + c.focus + ";outline-offset:2px;}" +
          "button{-webkit-tap-highlight-color:transparent;}" +
          "::selection{background:" + c.sel + ";}"
        }</style>
        <div style={{ display: "flex", height: "100vh", background: c.bg, fontFamily: lang === "hi" ? F.deva : F.ui, color: c.ink }}>
          <Rail active="home" />
          <main style={{ flex: 1, minWidth: 0, position: "relative", overflowY: "auto" }}>
            <div style={{ position: "relative", maxWidth: 1560, margin: "0 auto", padding: "30px 40px 150px" }}>
              <Motif />
              <Masthead />
              {/* two-column: narrow left stack + wide right */}
              <div style={{ display: "flex", gap: 24, marginTop: 26, alignItems: "flex-start" }}>
                <div style={{ flex: "0 0 400px", display: "flex", flexDirection: "column", gap: 24, minWidth: 0 }}>
                  <TodayCard />
                  <PayslipCard />
                  <HolidayCard />
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 24, minWidth: 0 }}>
                  <DocRequestCard />
                  <div style={{ display: "flex", gap: 24, alignItems: "stretch", flexWrap: "wrap" }}>
                    <LeaveCard />
                    <QuietCard />
                  </div>
                  <AttendanceCard />
                </div>
              </div>
            </div>
          </main>
        </div>
      </Ctx.Provider>
    );
  }

  window.HomeExplore = window.HomeExplore || {};
  window.HomeExplore.A = HomeA;
})();
