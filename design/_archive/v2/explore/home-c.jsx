/* ============================================================
   Naveya — Home EXPLORATION C · "Welcome band + sectioned cards"
   Most atmospheric of the three parallel explorations.

   Deliberate overrides of the shipped design system (user call,
   2026-08-11: "put things in cards like figma… keka looks so clean"):
   soft radius, sectioned cards with headers, real depth, abstract
   background artwork. Colours read live from window.G2 — no hex here
   beyond structural white/black alpha overlays.

   Artwork: "Corridor Study" — an invented abstract composition of
   nested school-corridor arches, offset paper planes and fine ledger
   rules, in brass + teal on peacock ink. NOT Keka's tree, no kitsch.

   window.HomeExplore.C
   ============================================================ */
window.HomeExplore = window.HomeExplore || {};
(function () {
  const G2 = window.G2;
  const { useState } = React;

  /* ---------------- type stack (dispatch: Anek display · Hanken UI 500/13.5 · JetBrains money) ---------------- */
  const F = {
    disp: "'Anek Latin', 'Anek Devanagari', system-ui, sans-serif",
    dispHi: "'Anek Devanagari', 'Anek Latin', system-ui, sans-serif",
    ui: "'Hanken Grotesk', system-ui, -apple-system, sans-serif",
    uiHi: "'Anek Devanagari', 'Hanken Grotesk', system-ui, sans-serif",
    mono: "'JetBrains Mono', 'Anek Devanagari', ui-monospace, Menlo, monospace",
  };
  function tp(role, lang) {
    const s = G2.t(role, lang === "hi" ? "deva" : "latin");
    const head = role === "display" || role === "h1" || role === "h2" || role === "h3";
    s.fontFamily = lang === "hi" ? (head ? F.dispHi : F.uiHi) : head ? F.disp : F.ui;
    if (!head) {
      s.fontWeight = Math.max(500, s.fontWeight);
      if (role === "body") s.fontSize = 13.5;
    }
    return s;
  }
  const mono = (px, w) => ({
    fontFamily: F.mono,
    fontSize: px,
    fontWeight: w || 500,
    fontFeatureSettings: "'tnum' 1, 'lnum' 1",
    fontVariantNumeric: "tabular-nums lining-nums",
  });

  /* ---------------- money: Indian lakh-crore grouping, paise, never abbreviated ---------------- */
  function inr(n) {
    const neg = n < 0;
    const [i, d] = Math.abs(n).toFixed(2).split(".");
    const s =
      i.length > 3
        ? i.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + i.slice(-3)
        : i;
    return (neg ? "−" : "") + "₹" + s + "." + d;
  }
  const fmtH = (min, lang) => {
    const h = Math.floor(min / 60), m = String(min % 60).padStart(2, "0");
    return lang === "hi" ? h + "घं " + m + "मि" : h + "h " + m + "m";
  };

  /* ---------------- strings — whole screen in ONE language ---------------- */
  const STR = {
    en: {
      nav: { home: "Home", att: "My Attendance", leave: "Leave", pay: "Payslips", docs: "Documents", prof: "Profile", subs: "Substitutions" },
      crumb: "Home",
      dateLong: "Tuesday, 11 August 2026",
      greet: "Good afternoon, Ananya",
      identity: "PGT, Physics · NAV-0142 · Sunrise Public School, Indiranagar",
      netLabel: "Net pay · July 2026",
      credited: "Credited to HDFC ••6841 on 31 July",
      today: "Today",
      todayAction: "Regularise",
      workedSub: "of 8h 00m",
      workedLabel: "worked so far",
      tIn: "In", tBreak: "Break", tOut: "Out",
      breakVal: "35m · 12:30–13:05",
      outExpected: "expected 16:30",
      provenance: "Marked via eSSL biometric · Gate 2, Senior Block",
      attTitle: "Attendance · August 2026",
      attAction: "Open register",
      attRange: "1–11 Aug",
      cols: { date: "Date", day: "Day", status: "Status", in_: "In", out: "Out", hrs: "Hours", src: "Source" },
      stPresent: "Present", stLate: "Late", stLeave: "On leave", stOff: "Weekly off", stProg: "In progress",
      sumPresent: "Present", sumLate: "Late", sumLeave: "Leave", sumOff: "Off",
      docTitle: "Action needed",
      docHead: "Document update requested",
      docBody: "HR has requested a fresh copy of your PAN card (name correction). You upload — HR verifies.",
      docMeta: "Requested by Meera Nair (HR) · 8 Aug · due 18 Aug",
      docCta: "Respond now",
      leaveTitle: "Leave balances",
      leaveAction: "Apply",
      leaveAsOf: "as on 11 Aug",
      lvOf: "of",
      lvLeft: "days left",
      lv: { el: "Earned", cl: "Casual", sl: "Sick", co: "Comp-off" },
      payTitle: "Latest payslip",
      payAction: "All payslips",
      payMonth: "July 2026",
      gross: "Gross earnings", ded: "Deductions", net: "Net pay",
      dl: "Download PDF",
      holTitle: "Upcoming holidays",
      holAction: "Full calendar",
      inDays: (n) => "in " + n + " days",
      subsTitle: "Substitutions",
      subsAction: "My duties",
      subsQuiet: "No substitution duty today.",
      subsQuiet2: "Your free periods stay yours.",
      days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      aug: "Aug", sep: "Sep",
      themeTo: "Switch to dark theme", themeToL: "Switch to light theme",
      srcCl: "CL · approved",
      school: "Sunrise Public School",
    },
    hi: {
      nav: { home: "होम", att: "मेरी उपस्थिति", leave: "अवकाश", pay: "वेतन पर्ची", docs: "दस्तावेज़", prof: "प्रोफ़ाइल", subs: "प्रतिस्थापन" },
      crumb: "होम",
      dateLong: "मंगलवार, 11 अगस्त 2026",
      greet: "नमस्ते, अनन्या",
      identity: "पीजीटी, भौतिक विज्ञान · NAV-0142 · सनराइज़ पब्लिक स्कूल, इंदिरानगर",
      netLabel: "शुद्ध वेतन · जुलाई 2026",
      credited: "31 जुलाई को HDFC ••6841 में जमा",
      today: "आज",
      todayAction: "नियमित करें",
      workedSub: "8घं 00मि में से",
      workedLabel: "अब तक कार्य",
      tIn: "प्रवेश", tBreak: "विराम", tOut: "प्रस्थान",
      breakVal: "35मि · 12:30–13:05",
      outExpected: "अनुमानित 16:30",
      provenance: "eSSL बायोमेट्रिक से दर्ज · गेट 2, सीनियर ब्लॉक",
      attTitle: "उपस्थिति · अगस्त 2026",
      attAction: "रजिस्टर खोलें",
      attRange: "1–11 अगस्त",
      cols: { date: "दिनांक", day: "दिन", status: "स्थिति", in_: "प्रवेश", out: "प्रस्थान", hrs: "घंटे", src: "स्रोत" },
      stPresent: "उपस्थित", stLate: "विलंबित", stLeave: "अवकाश पर", stOff: "साप्ताहिक अवकाश", stProg: "जारी",
      sumPresent: "उपस्थित", sumLate: "विलंब", sumLeave: "अवकाश", sumOff: "अवकाश-दिन",
      docTitle: "कार्रवाई आवश्यक",
      docHead: "दस्तावेज़ अद्यतन का अनुरोध",
      docBody: "HR ने आपके पैन कार्ड की नई प्रति मांगी है (नाम सुधार)। आप अपलोड करें — HR सत्यापित करेगा।",
      docMeta: "मीरा नायर (HR) द्वारा · 8 अगस्त · नियत 18 अगस्त",
      docCta: "अभी जवाब दें",
      leaveTitle: "अवकाश शेष",
      leaveAction: "आवेदन करें",
      leaveAsOf: "11 अगस्त तक",
      lvOf: "में से",
      lvLeft: "दिन शेष",
      lv: { el: "अर्जित", cl: "आकस्मिक", sl: "चिकित्सा", co: "प्रतिपूरक" },
      payTitle: "नवीनतम वेतन पर्ची",
      payAction: "सभी पर्चियाँ",
      payMonth: "जुलाई 2026",
      gross: "सकल आय", ded: "कटौतियाँ", net: "शुद्ध वेतन",
      dl: "PDF डाउनलोड करें",
      holTitle: "आगामी छुट्टियाँ",
      holAction: "पूरा कैलेंडर",
      inDays: (n) => n + " दिन में",
      subsTitle: "प्रतिस्थापन",
      subsAction: "मेरी ड्यूटी",
      subsQuiet: "आज कोई प्रतिस्थापन ड्यूटी नहीं।",
      subsQuiet2: "आपके खाली पीरियड आपके ही रहेंगे।",
      days: ["रवि", "सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि"],
      aug: "अग", sep: "सित",
      themeTo: "डार्क थीम पर जाएँ", themeToL: "लाइट थीम पर जाएँ",
      srcCl: "आकस्मिक · स्वीकृत",
      school: "सनराइज़ पब्लिक स्कूल",
    },
  };

  /* ---------------- data (realistic, Ananya Rao · NAV-0142) ---------------- */
  const NET = 86430.0, GROSS = 104500.0, DED = 18070.0; // gross − deductions = net ✓
  const ATT = [
    { d: 11, wd: 2, st: "prog", in_: "07:52", out: "—", min: 345, src: "eSSL · Gate 2" },
    { d: 10, wd: 1, st: "leave", in_: "—", out: "—", min: null, src: "cl" },
    { d: 9, wd: 0, st: "off", in_: "—", out: "—", min: null, src: "" },
    { d: 8, wd: 6, st: "present", in_: "07:48", out: "13:10", min: 322, src: "eSSL · Gate 1" },
    { d: 7, wd: 5, st: "present", in_: "07:45", out: "16:35", min: 495, src: "eSSL · Gate 2" },
    { d: 6, wd: 4, st: "present", in_: "07:50", out: "16:31", min: 486, src: "eSSL · Gate 2" },
    { d: 5, wd: 3, st: "late", in_: "08:21", out: "16:40", min: 464, src: "eSSL · Gate 2" },
    { d: 4, wd: 2, st: "present", in_: "07:47", out: "16:30", min: 488, src: "eSSL · Gate 2" },
    { d: 3, wd: 1, st: "present", in_: "07:51", out: "16:33", min: 487, src: "eSSL · Gate 2" },
  ];
  const LV = [
    { k: "el", have: 8, of: 12 },
    { k: "cl", have: 5, of: 8 },
    { k: "sl", have: 4, of: 6 },
    { k: "co", have: 1, of: 2 },
  ];
  const HOL = [
    { d: 15, m: "aug", wd: 6, en: "Independence Day", hi: "स्वतंत्रता दिवस", inD: 4 },
    { d: 4, m: "sep", wd: 5, en: "Janmashtami", hi: "जन्माष्टमी", inD: 24 },
    { d: 14, m: "sep", wd: 1, en: "Ganesh Chaturthi", hi: "गणेश चतुर्थी", inD: 34 },
  ];

  /* ---------------- icons (20px stroke) ---------------- */
  const Ic = (paths) =>
    function Icon({ size = 20, style }) {
      return (
        <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">
          {paths}
        </svg>
      );
    };
  const IcHome = Ic(<path d="M3.5 9.5 10 3.8l6.5 5.7M5 8.6V16h10V8.6M8.2 16v-3.8h3.6V16" />);
  const IcAtt = Ic([<rect key="r" x="3" y="4.5" width="14" height="12" rx="1.5" />, <path key="p" d="M3 8h14M7 3v3M13 3v3M7.2 12.2l1.9 1.9 3.7-3.7" />]);
  const IcLeave = Ic([<rect key="r" x="3" y="4.5" width="14" height="12" rx="1.5" />, <path key="p" d="M3 8h14M7 3v3M13 3v3M7.5 12.5h5" />]);
  const IcPay = Ic([<rect key="r" x="2.5" y="5.5" width="15" height="9.5" rx="1.5" />, <circle key="c" cx="10" cy="10.2" r="2.2" />, <path key="p" d="M5 8v.01M15 12.5v.01" />]);
  const IcDoc = Ic(<path d="M5.5 3h6l3.5 3.5V17h-9.5zM11 3v4h4M7.5 10.5h5M7.5 13.5h5" />);
  const IcProf = Ic([<circle key="c" cx="10" cy="7" r="3" />, <path key="p" d="M4.5 16.5c.8-3 3-4.5 5.5-4.5s4.7 1.5 5.5 4.5" />]);
  const IcSubs = Ic(<path d="M4 7h10.5M12 4.5 14.5 7 12 9.5M16 13H5.5M8 10.5 5.5 13 8 15.5" />);
  const IcScan = Ic([<path key="a" d="M3 7V4.5A1.5 1.5 0 0 1 4.5 3H7M13 3h2.5A1.5 1.5 0 0 1 17 4.5V7M17 13v2.5a1.5 1.5 0 0 1-1.5 1.5H13M7 17H4.5A1.5 1.5 0 0 1 3 15.5V13" />, <path key="b" d="M6.5 10h7" />]);
  const IcSun = Ic([<circle key="c" cx="10" cy="10" r="3.4" />, <path key="p" d="M10 2.8v2M10 15.2v2M2.8 10h2M15.2 10h2M4.9 4.9l1.4 1.4M13.7 13.7l1.4 1.4M15.1 4.9l-1.4 1.4M6.3 13.7l-1.4 1.4" />]);
  const IcMoon = Ic(<path d="M16.2 12.2A6.8 6.8 0 0 1 7.8 3.8a6.8 6.8 0 1 0 8.4 8.4z" />);

  /* ---------------- "Corridor Study" — invented abstract artwork ----------------
     Nested corridor arches + offset paper planes + ledger rules + register
     ticks. Colour-parameterised so the same drawing serves the hero band
     (brass/teal on peacock ink) and the faint page-ground motif. */
  function CorridorStudy({ line, brass, teal, planeA, planeB, style }) {
    const arch = (cx, base, r) => "M " + (cx - r) + " " + base + " A " + r + " " + r + " 0 0 1 " + (cx + r) + " " + base;
    const ticks = [];
    for (let x = 36; x <= 744; x += 16) ticks.push(<line key={"t" + x} x1={x} y1={214} x2={x} y2={219} stroke={line} strokeWidth="1" />);
    const dots = [];
    for (let r = 0; r < 3; r++) for (let q = 0; q < 7; q++) dots.push(<circle key={"d" + r + "-" + q} cx={40 + q * 14} cy={30 + r * 14} r="1.3" fill={line} />);
    return (
      <svg width="780" height="230" viewBox="0 0 780 230" fill="none" style={style} aria-hidden="true">
        {[148, 160, 172, 184, 196].map((y) => (
          <line key={y} x1="28" y1={y} x2="752" y2={y} stroke={line} strokeWidth="1" />
        ))}
        <rect x="404" y="24" width="212" height="178" fill={planeA} transform="rotate(-4 510 113)" />
        <rect x="448" y="42" width="212" height="172" fill={planeB} transform="rotate(3 554 128)" />
        {[96, 78, 60, 42].map((r, i) => (
          <path key={"a" + r} d={arch(560, 206, r)} stroke={i === 0 ? brass : line} strokeWidth={i === 0 ? 1.6 : 1} />
        ))}
        {[64, 48, 32].map((r, i) => (
          <path key={"b" + r} d={arch(348, 206, r)} stroke={i === 0 ? teal : line} strokeWidth={i === 0 ? 1.4 : 1} />
        ))}
        {[48, 32, 18].map((r, i) => (
          <path key={"c" + r} d={arch(708, 206, r)} stroke={i === 2 ? brass : line} strokeWidth="1" />
        ))}
        <line x1="252" y1="206" x2="768" y2="206" stroke={brass} strokeWidth="1.2" />
        <circle cx="286" cy="58" r="34" stroke={brass} strokeWidth="1.2" />
        <path d="M286 24v10M286 82v10M252 58h10M310 58h10" stroke={brass} strokeWidth="1" />
        <path d="M700 22h56v56" stroke={teal} strokeWidth="1.2" />
        <path d="M756 78A56 56 0 0 0 700 22" stroke={teal} strokeWidth="1.2" />
        {ticks}
        {dots}
      </svg>
    );
  }

  /* ---------------- quiet-state illustration: the empty staffroom desk ---------------- */
  function DeskArt({ c }) {
    return (
      <svg width="150" height="100" viewBox="0 0 150 100" fill="none" aria-hidden="true">
        <circle cx="75" cy="52" r="42" fill={c.accentSoft} />
        <g stroke={c.inkFaint} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="34" y="52" width="62" height="7" rx="2" />
          <path d="M40 59v24M90 59v24M40 70h50" />
          <path d="M106 46v37M124 46v37M106 62h18M104 46h22" />
          <circle cx="52" cy="26" r="9" />
          <path d="M52 21v5l3.5 2" />
        </g>
        <rect x="62" y="44" width="20" height="8" rx="1.5" fill={c.seal} opacity="0.85" />
        <rect x="66" y="40" width="16" height="4" rx="1" fill={c.accent} opacity="0.55" />
      </svg>
    );
  }

  /* ---------------- small parts ---------------- */
  function Chip({ bg, fg, children, style }) {
    return (
      <span style={{ display: "inline-block", background: bg, color: fg, borderRadius: 999, padding: "3px 10px", fontSize: 12, fontWeight: 600, lineHeight: 1.5, whiteSpace: "nowrap", ...style }}>
        {children}
      </span>
    );
  }
  function Ring({ size = 64, stroke = 7, frac, color, track, center, centerStyle, sub, subStyle }) {
    const r = (size - stroke) / 2, C = 2 * Math.PI * r;
    return (
      <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} viewBox={"0 0 " + size + " " + size} aria-hidden="true">
          <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
          <circle
            cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none"
            strokeLinecap="round" strokeDasharray={C * Math.min(1, Math.max(0, frac)) + " " + C}
            transform={"rotate(-90 " + size / 2 + " " + size / 2 + ")"}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
          <span style={centerStyle}>{center}</span>
          {sub ? <span style={subStyle}>{sub}</span> : null}
        </div>
      </div>
    );
  }
  function Card({ c, mode, title, titleColor, action, children, bg, border, pad = 20, style }) {
    const lang = Card.lang;
    return (
      <section
        style={{
          background: bg || c.surface,
          border: "1px solid " + (border || c.border),
          borderRadius: 12,
          boxShadow: G2.el[mode][1],
          padding: pad,
          position: "relative",
          zIndex: 1,
          ...style,
        }}
      >
        {title ? (
          <header style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
            <h3 style={{ margin: 0, color: titleColor || c.ink, ...tp("h3", lang) }}>{title}</h3>
            {action || null}
          </header>
        ) : null}
        {children}
      </section>
    );
  }
  function LinkAction({ c, onClick, children, color }) {
    return (
      <button
        onClick={onClick}
        style={{ background: "none", border: "none", padding: 0, color: color || c.accent, fontFamily: "inherit", fontSize: 12.5, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
      >
        {children}
      </button>
    );
  }

  /* ---------------- day timeline ---------------- */
  function DayTimeline({ c, t, lang }) {
    const start = 7.5, end = 17.5, span = end - start;
    const pct = (h) => ((h - start) / span) * 100 + "%";
    const wpct = (a, b) => ((b - a) / span) * 100 + "%";
    const seg = (a, b, color, dashed) => (
      <div key={a} style={{ position: "absolute", left: pct(a), width: wpct(a, b), top: 0, bottom: 0, background: color, borderRadius: 5, border: dashed ? "1px dashed " + c.borderStrong : "none" }} />
    );
    return (
      <div>
        <div style={{ position: "relative", height: 12, background: c.sunken, borderRadius: 6 }}>
          {seg(7.867, 12.5, c.present)}
          {seg(12.5, 13.083, c.off)}
          {seg(13.083, 14.2, c.present)}
          {seg(14.2, 16.5, c.presentTint, true)}
          <div style={{ position: "absolute", left: pct(14.2), top: -4, bottom: -4, width: 2, background: c.accent, borderRadius: 1 }} />
          <div style={{ position: "absolute", left: "calc(" + pct(14.2) + " - 3px)", top: -8, width: 8, height: 8, borderRadius: 999, background: c.accent }} />
        </div>
        <div style={{ position: "relative", height: 18, marginTop: 6 }}>
          {[8, 10, 12, 14, 16].map((h) => (
            <span key={h} style={{ position: "absolute", left: pct(h), transform: "translateX(-50%)", color: c.inkFaint, ...mono(10.5) }}>
              {String(h).padStart(2, "0") + ":00"}
            </span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 28, marginTop: 12, flexWrap: "wrap" }}>
          {[
            { l: t.tIn, v: "07:52", chip: { bg: c.presentTint, fg: c.presentText } },
            { l: t.tBreak, v: t.breakVal, chip: { bg: c.offTint, fg: c.offText } },
            { l: t.tOut, v: "— · " + t.outExpected, chip: { bg: c.missingTint, fg: c.missingText } },
          ].map((s) => (
            <div key={s.l}>
              <div style={{ color: c.inkFaint, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4, ...tp("caption", lang), fontSize: 10.5 }}>{s.l}</div>
              <Chip bg={s.chip.bg} fg={s.chip.fg} style={{ ...mono(12.5, 600), fontFamily: F.mono }}>{s.v}</Chip>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, color: c.inkMuted, ...tp("small", lang) }}>
          <IcScan size={16} style={{ color: c.seal, flexShrink: 0 }} />
          <span>{t.provenance}</span>
        </div>
      </div>
    );
  }

  /* ---------------- rail ---------------- */
  function Rail({ c, t, lang }) {
    const items = [
      { k: "home", I: IcHome, active: true },
      { k: "att", I: IcAtt },
      { k: "leave", I: IcLeave },
      { k: "pay", I: IcPay },
      { k: "docs", I: IcDoc },
      { k: "prof", I: IcProf },
      { k: "subs", I: IcSubs },
    ];
    return (
      <nav aria-label="Main" style={{ width: 84, flexShrink: 0, background: c.shell }}>
        <div style={{ position: "sticky", top: 0, height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", padding: "16px 0 18px", gap: 2, overflow: "hidden" }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: c.accent, color: c.onAccent, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.disp, fontWeight: 700, fontSize: 18, marginBottom: 14, flexShrink: 0 }}>N</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, minHeight: 0, width: "100%", alignItems: "center" }}>
            {items.map(({ k, I, active }) => (
              <button
                key={k}
                aria-current={active ? "page" : undefined}
                style={{
                  width: 76, border: "none", cursor: "pointer", borderRadius: 10,
                  background: active ? c.shellActive : "transparent",
                  color: active ? c.onShell : c.onShellMuted,
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                  padding: "9px 2px 7px", position: "relative", fontFamily: "inherit",
                }}
              >
                {active ? <span style={{ position: "absolute", left: 0, top: 10, bottom: 10, width: 3, borderRadius: 2, background: c.accent }} /> : null}
                <I size={20} />
                <span style={{ fontSize: 9.5, fontWeight: 600, lineHeight: 1.25, textAlign: "center", fontFamily: lang === "hi" ? F.uiHi : F.ui }}>{t.nav[k]}</span>
              </button>
            ))}
          </div>
          <div style={{ width: 34, height: 34, borderRadius: 999, background: c.shellActive, color: c.onShell, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11.5, fontWeight: 700, fontFamily: F.ui, flexShrink: 0 }} title="Ananya Rao">AR</div>
        </div>
      </nav>
    );
  }

  /* ================================================================ */
  function HomeC() {
    const [mode, setMode] = useState("light");
    const [lang, setLang] = useState("en");
    const c = G2.theme(mode);
    const t = STR[lang];
    Card.lang = lang;
    const dk = G2.dark; // hero band is always peacock-ink; its art reads dark-theme accents
    const stMap = {
      present: { bg: c.presentTint, fg: c.presentText, l: t.stPresent },
      late: { bg: c.lateTint, fg: c.lateText, l: t.stLate },
      leave: { bg: c.leaveTint, fg: c.leaveText, l: t.stLeave },
      off: { bg: c.offTint, fg: c.offText, l: t.stOff },
      prog: { bg: c.accentSoft, fg: mode === "dark" ? c.accent : c.action, l: t.stProg },
    };
    const lvColor = { el: [c.ltEL, c.ltELText], cl: [c.ltCasual, c.ltCasualText], sl: [c.ltSick, c.ltSickText], co: [c.ltComp, c.ltCompText] };
    const thead = { textAlign: "left", padding: "8px 10px", color: c.inkFaint, textTransform: "uppercase", letterSpacing: "0.06em", ...tp("caption", lang), fontSize: 10.5, borderBottom: "1px solid " + c.borderStrong };
    const td = { padding: "9px 10px", borderBottom: "1px solid " + c.rule, color: c.ink, verticalAlign: "middle" };

    return (
      <div className="hx" style={{ display: "flex", minHeight: "100vh", background: c.bg, fontFamily: lang === "hi" ? F.uiHi : F.ui, color: c.ink }}>
        <style>{`
          .hx button{cursor:pointer}
          .hx :focus-visible{outline:2px solid ${c.accent};outline-offset:2px;border-radius:6px}
        `}</style>
        <Rail c={c} t={t} lang={lang} />

        {/* ---------------- content ---------------- */}
        <main style={{ flex: 1, minWidth: 0, position: "relative" }}>
          {/* continuing ground motif — very faint, sits UNDER all cards */}
          <div style={{ position: "absolute", right: -70, top: 430, opacity: mode === "dark" ? 0.35 : 0.5, pointerEvents: "none", zIndex: 0, transform: "scale(1.35)", transformOrigin: "top right" }}>
            <CorridorStudy
              line={mode === "dark" ? "rgba(231,237,238,.05)" : "rgba(24,36,42,.05)"}
              brass={mode === "dark" ? "rgba(222,180,100,.10)" : "rgba(138,106,47,.12)"}
              teal={mode === "dark" ? "rgba(40,186,193,.08)" : "rgba(0,112,124,.10)"}
              planeA={mode === "dark" ? "rgba(231,237,238,.015)" : "rgba(24,36,42,.015)"}
              planeB={mode === "dark" ? "rgba(222,180,100,.02)" : "rgba(138,106,47,.025)"}
            />
          </div>

          <div style={{ position: "relative", zIndex: 1, padding: "20px 36px 44px", maxWidth: 1560, margin: "0 auto" }}>
            {/* top strip: crumb + toggles */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ color: c.inkMuted, ...tp("small", lang) }}>
                <span style={{ fontWeight: 700, color: c.ink }}>{t.crumb}</span>
                <span style={{ margin: "0 8px", color: c.inkFaint }}>·</span>
                <span>{t.school}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div role="group" aria-label="Language" style={{ display: "flex", background: c.surface, border: "1px solid " + c.border, borderRadius: 999, padding: 3, boxShadow: G2.el[mode][1] }}>
                  {[["en", "EN"], ["hi", "हिंदी"]].map(([k, label]) => (
                    <button
                      key={k}
                      aria-pressed={lang === k}
                      onClick={() => setLang(k)}
                      style={{
                        border: "none", borderRadius: 999, padding: "4px 12px",
                        background: lang === k ? c.accent : "transparent",
                        color: lang === k ? c.onAccent : c.inkMuted,
                        fontWeight: 700, fontSize: 12,
                        fontFamily: k === "hi" ? F.uiHi : F.ui,
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <button
                  aria-label={mode === "light" ? t.themeTo : t.themeToL}
                  title={mode === "light" ? t.themeTo : t.themeToL}
                  onClick={() => setMode(mode === "light" ? "dark" : "light")}
                  style={{ width: 34, height: 34, borderRadius: 999, border: "1px solid " + c.border, background: c.surface, color: c.inkMuted, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: G2.el[mode][1] }}
                >
                  {mode === "light" ? <IcMoon size={17} /> : <IcSun size={17} />}
                </button>
              </div>
            </div>

            {/* ============ HERO WELCOME BAND — always peacock ink, "Corridor Study" ============ */}
            <section
              style={{
                position: "relative", overflow: "hidden", borderRadius: 14,
                background: c.shell, boxShadow: G2.el[mode][2],
                border: mode === "dark" ? "1px solid " + c.border : "none",
                padding: lang === "hi" ? "30px 40px 32px" : "34px 40px 36px",
                marginBottom: 24, minHeight: 172,
              }}
            >
              <CorridorStudy
                line="rgba(232,241,241,.13)"
                brass={dk.seal}
                teal={dk.accent}
                planeA="rgba(232,241,241,.045)"
                planeB="rgba(222,180,100,.06)"
                style={{ position: "absolute", right: -30, bottom: -8, opacity: 0.85, pointerEvents: "none" }}
              />
              <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 40, flexWrap: "wrap" }}>
                <div style={{ minWidth: 320 }}>
                  <div style={{ color: c.onShellMuted, marginBottom: 8, ...tp("caption", lang), letterSpacing: "0.05em", textTransform: "uppercase" }}>{t.dateLong}</div>
                  <h1 style={{ margin: 0, color: c.onShell, ...tp("display", lang) }}>{t.greet}</h1>
                  <div style={{ color: c.onShellMuted, marginTop: 8, ...tp("small", lang) }}>{t.identity}</div>
                </div>
                <div style={{ background: "rgba(232,241,241,.06)", border: "1px solid rgba(232,241,241,.14)", borderRadius: 10, padding: "16px 22px", minWidth: 300 }}>
                  <div style={{ color: c.onShellMuted, marginBottom: 6, ...tp("caption", lang), letterSpacing: "0.05em", textTransform: "uppercase" }}>{t.netLabel}</div>
                  <div style={{ color: c.onShell, textAlign: "right", ...mono(31, 600) }}>{inr(NET)}</div>
                  <div style={{ color: c.onShellMuted, marginTop: 6, textAlign: "right", ...tp("caption", lang) }}>{t.credited}</div>
                </div>
              </div>
            </section>

            {/* ============ sectioned cards: wide primary + supporting column ============ */}
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 430px", gap: 24, alignItems: "start" }}>
              {/* ---- primary column ---- */}
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                {/* Today */}
                <Card c={c} mode={mode} title={t.today + " · " + t.dateLong} action={<LinkAction c={c}>{t.todayAction}</LinkAction>}>
                  <div style={{ display: "flex", gap: 32, alignItems: "flex-start" }}>
                    <div style={{ textAlign: "center", flexShrink: 0 }}>
                      <Ring
                        size={118} stroke={10} frac={345 / 480}
                        color={c.present} track={c.sunken}
                        center={fmtH(345, lang)} centerStyle={{ color: c.ink, ...mono(lang === "hi" ? 14 : 16.5, 600) }}
                        sub={t.workedSub} subStyle={{ color: c.inkFaint, marginTop: 2, ...tp("caption", lang), fontSize: 10.5 }}
                      />
                      <div style={{ color: c.inkMuted, marginTop: 8, ...tp("caption", lang) }}>{t.workedLabel}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0, paddingTop: 6 }}>
                      <DayTimeline c={c} t={t} lang={lang} />
                    </div>
                  </div>
                </Card>

                {/* Month attendance — table INSIDE a card, real header + padding */}
                <Card c={c} mode={mode} title={t.attTitle} action={<LinkAction c={c}>{t.attAction}</LinkAction>}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                    <Chip bg={c.presentTint} fg={c.presentText}>{t.sumPresent + " 7"}</Chip>
                    <Chip bg={c.lateTint} fg={c.lateText}>{t.sumLate + " 1"}</Chip>
                    <Chip bg={c.leaveTint} fg={c.leaveText}>{t.sumLeave + " 1"}</Chip>
                    <Chip bg={c.offTint} fg={c.offText}>{t.sumOff + " 2"}</Chip>
                    <span style={{ marginLeft: "auto", color: c.inkFaint, alignSelf: "center", ...tp("caption", lang) }}>{t.attRange}</span>
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={thead}>{t.cols.date}</th>
                        <th style={thead}>{t.cols.day}</th>
                        <th style={thead}>{t.cols.status}</th>
                        <th style={{ ...thead, textAlign: "right" }}>{t.cols.in_}</th>
                        <th style={{ ...thead, textAlign: "right" }}>{t.cols.out}</th>
                        <th style={{ ...thead, textAlign: "right" }}>{t.cols.hrs}</th>
                        <th style={thead}>{t.cols.src}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ATT.map((r, i) => {
                        const s = stMap[r.st];
                        const last = i === ATT.length - 1;
                        return (
                          <tr key={r.d} style={r.st === "prog" ? { background: c.sel } : undefined}>
                            <td style={{ ...td, borderBottom: last ? "none" : td.borderBottom, ...mono(12.5, 600), width: 70 }}>{r.d + " " + t.aug}</td>
                            <td style={{ ...td, borderBottom: last ? "none" : td.borderBottom, color: c.inkMuted, ...tp("small", lang), width: 90 }}>{t.days[r.wd]}</td>
                            <td style={{ ...td, borderBottom: last ? "none" : td.borderBottom }}><Chip bg={s.bg} fg={s.fg}>{s.l}</Chip></td>
                            <td style={{ ...td, borderBottom: last ? "none" : td.borderBottom, textAlign: "right", ...mono(12.5) }}>{r.in_}</td>
                            <td style={{ ...td, borderBottom: last ? "none" : td.borderBottom, textAlign: "right", ...mono(12.5) }}>{r.out}</td>
                            <td style={{ ...td, borderBottom: last ? "none" : td.borderBottom, textAlign: "right", ...mono(12.5, 600) }}>{r.min == null ? "—" : fmtH(r.min, lang)}</td>
                            <td style={{ ...td, borderBottom: last ? "none" : td.borderBottom, color: c.inkMuted, ...tp("small", lang) }}>{r.src === "cl" ? t.srcCl : r.src || "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </Card>

                {/* Substitutions — illustrated quiet state, wide */}
                <Card c={c} mode={mode} title={t.subsTitle} action={<LinkAction c={c}>{t.subsAction}</LinkAction>}>
                  <div style={{ display: "flex", alignItems: "center", gap: 28, padding: "2px 4px 6px" }}>
                    <DeskArt c={c} />
                    <div>
                      <div style={{ color: c.ink, fontWeight: 700, ...tp("body", lang) }}>{t.subsQuiet}</div>
                      <div style={{ color: c.inkMuted, marginTop: 3, ...tp("small", lang) }}>{t.subsQuiet2}</div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* ---- supporting column ---- */}
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                {/* Document request — brass-filled action card (M4: she responds, HR verifies) */}
                <Card c={c} mode={mode} bg={c.sealSoft} border={mode === "dark" ? "rgba(222,180,100,.30)" : "rgba(138,106,47,.35)"} title={t.docTitle} titleColor={mode === "dark" ? dk.seal : c.seal}>
                  <div style={{ color: c.ink, fontWeight: 700, marginBottom: 6, ...tp("body", lang) }}>{t.docHead}</div>
                  <div style={{ color: c.inkMuted, ...tp("small", lang) }}>{t.docBody}</div>
                  <div style={{ color: c.inkFaint, marginTop: 10, ...tp("caption", lang) }}>{t.docMeta}</div>
                  <button
                    style={{
                      marginTop: 14, border: "none", borderRadius: 8, padding: "9px 18px",
                      background: c.seal, color: mode === "dark" ? c.sealSoft : c.onAccent,
                      fontWeight: 700, fontSize: 13, fontFamily: "inherit",
                    }}
                  >
                    {t.docCta}
                  </button>
                </Card>

                {/* Leave balances — rings */}
                <Card
                  c={c} mode={mode} title={t.leaveTitle}
                  action={
                    <span style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
                      <span style={{ color: c.inkFaint, ...tp("caption", lang) }}>{t.leaveAsOf}</span>
                      <LinkAction c={c}>{t.leaveAction}</LinkAction>
                    </span>
                  }
                >
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 12px" }}>
                    {LV.map((l) => (
                      <div key={l.k} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <Ring
                          size={62} stroke={7} frac={l.have / l.of}
                          color={lvColor[l.k][0]} track={c.sunken}
                          center={String(l.have)} centerStyle={{ color: lvColor[l.k][1], ...mono(17, 700) }}
                        />
                        <div>
                          <div style={{ color: c.ink, fontWeight: 700, ...tp("small", lang) }}>{t.lv[l.k]}</div>
                          <div style={{ color: c.inkMuted, ...tp("caption", lang) }}>{t.lvOf + " " + l.of + " · " + t.lvLeft}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Latest payslip — accent-filled card; figures sum */}
                <Card c={c} mode={mode} bg={c.accent} border="transparent" title={t.payTitle} titleColor={c.onAccent}
                  action={<LinkAction c={c} color={c.onAccent}>{t.payAction}</LinkAction>}>
                  <div style={{ color: c.onAccent, opacity: 0.78, marginBottom: 12, ...tp("small", lang) }}>{t.payMonth}</div>
                  {[
                    [t.gross, inr(GROSS)],
                    [t.ded, "−" + inr(DED).slice(0)],
                  ].map(([l, v]) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "5px 0", color: c.onAccent }}>
                      <span style={{ opacity: 0.82, ...tp("small", lang) }}>{l}</span>
                      <span style={mono(13.5)}>{v}</span>
                    </div>
                  ))}
                  <div style={{ borderTop: "1px solid " + (mode === "dark" ? "rgba(8,24,26,.35)" : "rgba(232,241,241,.35)"), margin: "8px 0 10px" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", color: c.onAccent }}>
                    <span style={{ fontWeight: 700, ...tp("body", lang) }}>{t.net}</span>
                    <span style={mono(21, 700)}>{inr(NET)}</span>
                  </div>
                  <button
                    style={{
                      marginTop: 16, width: "100%", borderRadius: 8, padding: "9px 0",
                      background: "transparent", color: c.onAccent,
                      border: "1.5px solid " + (mode === "dark" ? "rgba(8,24,26,.45)" : "rgba(232,241,241,.5)"),
                      fontWeight: 700, fontSize: 13, fontFamily: "inherit",
                    }}
                  >
                    {t.dl}
                  </button>
                </Card>

                {/* Upcoming holidays */}
                <Card c={c} mode={mode} title={t.holTitle} action={<LinkAction c={c}>{t.holAction}</LinkAction>}>
                  {HOL.map((h, i) => (
                    <div key={h.en} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 0", borderBottom: i < HOL.length - 1 ? "1px solid " + c.rule : "none" }}>
                      <div style={{ width: 46, height: 46, borderRadius: 10, background: c.holidayTint, color: c.holidayText, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={mono(15, 700)}>{h.d}</span>
                        <span style={{ ...tp("caption", lang), fontSize: 9.5, lineHeight: 1.1 }}>{t[h.m]}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: c.ink, fontWeight: 700, ...tp("small", lang) }}>{lang === "hi" ? h.hi : h.en}</div>
                        <div style={{ color: c.inkMuted, ...tp("caption", lang) }}>{t.days[h.wd]}</div>
                      </div>
                      <Chip bg={c.holidayTint} fg={c.holidayText}>{t.inDays(h.inD)}</Chip>
                    </div>
                  ))}
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  window.HomeExplore.C = HomeC;
})();
