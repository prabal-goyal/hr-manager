/* @jsxRuntime classic */
/* ============================================================================
   Naveya — Employee Home, FREE EXPLORATION F: "SIGNAL"
   Lane: modern, vivid, high-craft product tool (Linear/Raycast/Vercel energy,
   copied from none of them).

   The system, invented for this exploration:
   - DARK-FIRST. Tinted indigo near-black (#0A0D14), layered four-deep
     (canvas → rail → surface → raised/inset), luminous top wash, hairlines
     at 7%/14% alpha. Light theme is designed separately (cool paper, not
     an inversion).
   - COLOUR IS SIGNAL, not decoration: green = presence, violet = leave,
     amber = money, coral = action-needed, blue = brand/interactive.
     Every state also carries a mark or a word — never colour alone.
   - TYPE: Manrope (UI), JetBrains Mono (every number, every micro-label),
     Anek Devanagari (Hindi, with ~25% taller leading budgeted).
   - DATA IS ENGINEERED: a real shift timeline (ticks, band, elapsed, now),
     a 31-cell attendance register strip, segmented leave gauges, a net-pay
     sparkline, proportional earning/deduction bars. No KPI-tile heroes.
   - Money: exact, Indian lakh-crore grouping, tabular mono. Never truncated.
   ========================================================================= */
(function () {
  "use strict";
  const { useState, useContext, createContext } = React;

  /* ---------------------------------------------------------------- themes */
  const THEMES = {
    dark: {
      mode: "dark",
      canvas: "#0A0D14",
      canvasWash:
        "radial-gradient(1100px 420px at 18% -8%, rgba(110,155,255,0.075), transparent 62%), radial-gradient(900px 380px at 92% -12%, rgba(62,207,142,0.05), transparent 60%), #0A0D14",
      rail: "#0D111B",
      surface: "#10151F",
      raised: "#161C29",
      inset: "#0B0F18",
      line: "rgba(154,168,200,0.15)",
      lineSoft: "rgba(154,168,200,0.07)",
      text: "#E9EDF5",
      sub: "#9AA5BC",
      faint: "#606B84",
      accent: "#6E9BFF",
      accentInk: "#0A0D14",
      accentSoft: "rgba(110,155,255,0.13)",
      green: "#3ECF8E",
      greenSoft: "rgba(62,207,142,0.13)",
      violet: "#A78BFA",
      violetSoft: "rgba(167,139,250,0.14)",
      amber: "#FFC24B",
      amberBar: "#FFC24B",
      amberSoft: "rgba(255,194,75,0.13)",
      coral: "#FF7E5C",
      coralInk: "#20100A",
      coralSoft: "rgba(255,126,92,0.12)",
      shiftBand: "rgba(154,168,200,0.18)",
      shadow: "0 1px 0 rgba(255,255,255,0.035) inset, 0 12px 30px rgba(2,5,11,0.45)",
      chipShadow: "0 1px 0 rgba(255,255,255,0.05) inset",
    },
    light: {
      mode: "light",
      canvas: "#F4F6FA",
      canvasWash:
        "radial-gradient(1100px 420px at 18% -8%, rgba(46,91,224,0.055), transparent 62%), #F4F6FA",
      rail: "#FBFCFE",
      surface: "#FFFFFF",
      raised: "#F4F6FB",
      inset: "#EDF0F6",
      line: "rgba(22,32,58,0.13)",
      lineSoft: "rgba(22,32,58,0.06)",
      text: "#151B29",
      sub: "#4C566C",
      faint: "#8A92A6",
      accent: "#2E5BE0",
      accentInk: "#FFFFFF",
      accentSoft: "rgba(46,91,224,0.09)",
      green: "#0B8A57",
      greenSoft: "rgba(11,138,87,0.10)",
      violet: "#6547D6",
      violetSoft: "rgba(101,71,214,0.10)",
      amber: "#8F6400",
      amberBar: "#E3A63A",
      amberSoft: "rgba(227,166,58,0.16)",
      coral: "#C2401E",
      coralInk: "#FFFFFF",
      coralSoft: "rgba(194,64,30,0.09)",
      shiftBand: "rgba(22,32,58,0.12)",
      shadow: "0 1px 2px rgba(16,24,40,0.05), 0 10px 26px rgba(16,24,40,0.06)",
      chipShadow: "none",
    },
  };

  /* ------------------------------------------------------------------ i18n */
  const STR = {
    en: {
      brand: "Naveya",
      school: "Sunrise Public School",
      nav: {
        home: "Home", attendance: "Attendance", leave: "Leave", pay: "Pay",
        documents: "Documents", holidays: "Holidays", settings: "Settings",
      },
      search: "Search anything",
      week: "Week 33",
      greet: "Good afternoon, Ananya",
      dateLine: "Tuesday, 11 August 2026",
      roleLine: "PGT, Physics · NAV-0142 · Sunrise Public School, Koramangala Campus",
      themeToLight: "Switch to light theme",
      themeToDark: "Switch to dark theme",
      notifications: "Notifications",
      today: {
        tag: "Today · Tue, 11 Aug",
        status: "Clocked in",
        shift: "Shift 08:30 – 16:00",
        provenance: "Biometric · ZKTeco K40 · Gate 2",
        verified: "Verified device",
        in: "In", out: "Out", effective: "Effective",
        inSub: "Gate 2 · biometric",
        outVal: "—", outSub: "expected 16:00",
        effVal: "5h 12m", effSub: "69% of 7h 30m",
        now: "now",
      },
      month: {
        tag: "August 2026",
        title: "Attendance register",
        summary: "8 present · 1 leave · 1 late",
        open: "Open register",
        legend: { P: "Present", L: "Leave", H: "Holiday", W: "Weekly off", A: "Absent", late: "Late arrival" },
        marks: { P: "P", L: "L", H: "H", W: "W", A: "A" },
      },
      leave: {
        tag: "Balances",
        title: "Leave balance",
        ofTotal: "of",
        left: "left",
        asOn: "Balances as on 11 Aug 2026",
        apply: "Apply for leave",
        types: [
          { code: "CL", name: "Casual leave" },
          { code: "SL", name: "Sick leave" },
          { code: "EL", name: "Earned leave" },
          { code: "RH", name: "Restricted holiday" },
        ],
      },
      pay: {
        tag: "July 2026",
        title: "Latest payslip",
        net: "Net pay",
        credited: "Credited 31 Jul · HDFC ••6721",
        trend: "Net pay · last 6 months",
        months: ["Feb", "Mar", "Apr", "May", "Jun", "Jul"],
        earnings: "Earnings",
        deductions: "Deductions",
        download: "Download payslip",
        eItems: ["Basic pay", "House rent (HRA)", "Special allowance", "Transport"],
        dItems: ["Provident fund", "Income tax (TDS)", "Professional tax", "Group insurance"],
      },
      holidays: {
        tag: "Upcoming",
        title: "Holidays",
        inDays: (n) => "in " + n + " days",
        items: [
          { chip: "15 AUG", day: "Saturday", name: "Independence Day", away: 4 },
          { chip: "28 AUG", day: "Friday", name: "Raksha Bandhan", away: 17 },
          { chip: "14 SEP", day: "Monday", name: "Ganesh Chaturthi", away: 34 },
          { chip: "02 OCT", day: "Friday", name: "Gandhi Jayanti", away: 52 },
        ],
      },
      doc: {
        tag: "Action needed",
        title: "Bank account proof",
        body: "HR has requested a cancelled cheque or passbook copy for your salary account migration. Your response goes back to HR for verification.",
        due: "Due Tue, 18 Aug",
        by: "Requested by Meera Iyer · HR",
        steps: ["You upload the proof", "HR verifies and records it"],
        cta: "Respond now",
        view: "View request",
      },
      user: { name: "Ananya Rao", id: "NAV-0142" },
    },
    hi: {
      brand: "Naveya",
      school: "सनराइज़ पब्लिक स्कूल",
      nav: {
        home: "होम", attendance: "उपस्थिति", leave: "अवकाश", pay: "वेतन",
        documents: "दस्तावेज़", holidays: "छुट्टियाँ", settings: "सेटिंग्स",
      },
      search: "कुछ भी खोजें",
      week: "सप्ताह 33",
      greet: "नमस्ते, अनन्या",
      dateLine: "मंगलवार, 11 अगस्त 2026",
      roleLine: "पीजीटी, भौतिक विज्ञान · NAV-0142 · सनराइज़ पब्लिक स्कूल, कोरमंगला परिसर",
      themeToLight: "लाइट थीम पर जाएँ",
      themeToDark: "डार्क थीम पर जाएँ",
      notifications: "सूचनाएँ",
      today: {
        tag: "आज · मंगल, 11 अगस्त",
        status: "उपस्थित — इन",
        shift: "पाली 08:30 – 16:00",
        provenance: "बायोमेट्रिक · ZKTeco K40 · गेट 2",
        verified: "सत्यापित डिवाइस",
        in: "आगमन", out: "प्रस्थान", effective: "प्रभावी",
        inSub: "गेट 2 · बायोमेट्रिक",
        outVal: "—", outSub: "अनुमानित 16:00",
        effVal: "5घं 12मि", effSub: "7घं 30मि का 69%",
        now: "अभी",
      },
      month: {
        tag: "अगस्त 2026",
        title: "उपस्थिति पंजिका",
        summary: "8 उपस्थित · 1 अवकाश · 1 विलंब",
        open: "पंजिका खोलें",
        legend: { P: "उपस्थित", L: "अवकाश", H: "छुट्टी", W: "साप्ताहिक अवकाश", A: "अनुपस्थित", late: "विलंब से आगमन" },
        marks: { P: "उ", L: "अव", H: "छु", W: "स", A: "अन" },
      },
      leave: {
        tag: "शेष",
        title: "अवकाश शेष",
        ofTotal: "में से",
        left: "शेष",
        asOn: "11 अगस्त 2026 तक का शेष",
        apply: "अवकाश आवेदन करें",
        types: [
          { code: "CL", name: "आकस्मिक अवकाश" },
          { code: "SL", name: "बीमारी अवकाश" },
          { code: "EL", name: "अर्जित अवकाश" },
          { code: "RH", name: "वैकल्पिक छुट्टी" },
        ],
      },
      pay: {
        tag: "जुलाई 2026",
        title: "नवीनतम वेतन पर्ची",
        net: "शुद्ध वेतन",
        credited: "31 जुलाई को जमा · HDFC ••6721",
        trend: "शुद्ध वेतन · पिछले 6 माह",
        months: ["फ़र", "मार्च", "अप्रै", "मई", "जून", "जुल"],
        earnings: "आय",
        deductions: "कटौतियाँ",
        download: "वेतन पर्ची डाउनलोड करें",
        eItems: ["मूल वेतन", "मकान किराया भत्ता", "विशेष भत्ता", "परिवहन भत्ता"],
        dItems: ["भविष्य निधि (EPF)", "आयकर (TDS)", "व्यावसायिक कर", "समूह बीमा"],
      },
      holidays: {
        tag: "आगामी",
        title: "छुट्टियाँ",
        inDays: (n) => n + " दिन में",
        items: [
          { chip: "15 अग", day: "शनिवार", name: "स्वतंत्रता दिवस", away: 4 },
          { chip: "28 अग", day: "शुक्रवार", name: "रक्षा बंधन", away: 17 },
          { chip: "14 सित", day: "सोमवार", name: "गणेश चतुर्थी", away: 34 },
          { chip: "02 अक्टू", day: "शुक्रवार", name: "गांधी जयंती", away: 52 },
        ],
      },
      doc: {
        tag: "कार्रवाई आवश्यक",
        title: "बैंक खाता प्रमाण",
        body: "वेतन खाता स्थानांतरण के लिए HR ने रद्द चेक या पासबुक की प्रति मांगी है। आपका जवाब सत्यापन हेतु HR के पास जाएगा।",
        due: "नियत: मंगल, 18 अगस्त",
        by: "अनुरोध: मीरा अय्यर · HR",
        steps: ["आप प्रमाण अपलोड करें", "HR सत्यापन कर दर्ज करे"],
        cta: "अभी जवाब दें",
        view: "अनुरोध देखें",
      },
      user: { name: "अनन्या राव", id: "NAV-0142" },
    },
  };

  /* ----------------------------------------------------------- data (mock) */
  const PAY = {
    net: 87432,
    gross: 112850,
    dedTotal: 25418,
    earnings: [52000, 26000, 28350, 6500],
    deductions: [6240, 16978, 200, 2000],
    trend: [84120, 84120, 86310, 86310, 86310, 87432],
  };
  const LEAVE = [
    { code: "CL", left: 8, total: 12 },
    { code: "SL", left: 5.5, total: 10 },
    { code: "EL", left: 14, total: 20 },
    { code: "RH", left: 1, total: 2 },
  ];
  const SUNDAYS = { 2: 1, 9: 1, 16: 1, 23: 1, 30: 1 };
  const HOLIDAYS = { 15: 1, 28: 1 };

  /* --------------------------------------------------------------- helpers */
  /* Indian lakh-crore grouping. inr(12644180) → "₹1,26,44,180.00" */
  const inr = (n) => {
    const neg = n < 0;
    const parts = Math.abs(n).toFixed(2).split(".");
    const i = parts[0];
    const last3 = i.slice(-3);
    const rest = i.slice(0, -3);
    const grouped = rest
      ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + last3
      : last3;
    return (neg ? "-₹" : "₹") + grouped + "." + parts[1];
  };
  const num = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

  const Ctx = createContext(null);
  const useC = () => useContext(Ctx);

  const fmt = {
    ui: (lang) =>
      lang === "hi"
        ? "'Anek Devanagari','Manrope',sans-serif"
        : "'Manrope','Anek Devanagari',sans-serif",
    mono: "'JetBrains Mono','Anek Devanagari',monospace",
  };

  function useHover() {
    const [h, set] = useState(false);
    return [h, { onMouseEnter: () => set(true), onMouseLeave: () => set(false) }];
  }

  /* ----------------------------------------------------------------- icons */
  const sp = (size) => ({
    width: size, height: size, viewBox: "0 0 24 24", fill: "none",
    stroke: "currentColor", strokeWidth: 1.7,
    strokeLinecap: "round", strokeLinejoin: "round",
    style: { display: "block", flex: "none" },
  });
  const Icons = {
    home: (s) => (
      <svg {...sp(s)}><path d="M3.5 10.6 12 3.6l8.5 7" /><path d="M5.8 9.6V20h12.4V9.6" /><path d="M10 20v-5.4h4V20" /></svg>
    ),
    clock: (s) => (
      <svg {...sp(s)}><circle cx="12" cy="12" r="8.4" /><path d="M12 7.6V12l3.1 1.9" /></svg>
    ),
    calx: (s) => (
      <svg {...sp(s)}><rect x="3.8" y="5" width="16.4" height="15" rx="2.2" /><path d="M3.8 9.6h16.4" /><path d="M8.2 3.2v3.4M15.8 3.2v3.4" /><path d="M9.4 14.8h5.2" /></svg>
    ),
    wallet: (s) => (
      <svg {...sp(s)}><path d="M4 7.6h14.2a1.8 1.8 0 0 1 1.8 1.8v7.8a1.8 1.8 0 0 1-1.8 1.8H5.8A1.8 1.8 0 0 1 4 17.2V7.6z" /><path d="M4 7.6V7a1.9 1.9 0 0 1 1.9-1.9H17" /><circle cx="16.3" cy="13.3" r="1.05" fill="currentColor" stroke="none" /></svg>
    ),
    doc: (s) => (
      <svg {...sp(s)}><path d="M6.2 3.6h7.6l4 4v12.8H6.2z" /><path d="M13.8 3.6V7.8H18" /><path d="M9.2 12.8h5.6M9.2 16h4" /></svg>
    ),
    flag: (s) => (
      <svg {...sp(s)}><path d="M5.5 21V4" /><path d="M5.5 5h11.6l-2.4 3.4 2.4 3.4H5.5" /></svg>
    ),
    gear: (s) => (
      <svg {...sp(s)}><circle cx="12" cy="12" r="3" /><path d="M12 3v2.6M12 18.4V21M3 12h2.6M18.4 12H21M5.9 5.9l1.8 1.8M16.3 16.3l1.8 1.8M18.1 5.9l-1.8 1.8M7.7 16.3l-1.8 1.8" /></svg>
    ),
    bell: (s) => (
      <svg {...sp(s)}><path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.6 2H4.4z" /><path d="M10.2 20.6a2 2 0 0 0 3.6 0" /></svg>
    ),
    search: (s) => (
      <svg {...sp(s)}><circle cx="10.8" cy="10.8" r="6.3" /><path d="m20 20-4.7-4.7" /></svg>
    ),
    sun: (s) => (
      <svg {...sp(s)}><circle cx="12" cy="12" r="4" /><path d="M12 2.8v2M12 19.2v2M2.8 12h2M19.2 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4" /></svg>
    ),
    moon: (s) => (
      <svg {...sp(s)}><path d="M20 13.6A8 8 0 1 1 10.4 4 6.4 6.4 0 0 0 20 13.6z" /></svg>
    ),
    finger: (s) => (
      <svg {...sp(s)}><path d="M12 11.2a3.4 3.4 0 0 0-3.4 3.4c0 1.8-.3 3.1-.8 4.3" /><path d="M12 11.2a3.4 3.4 0 0 1 3.4 3.4c0 1.9.2 3.3.6 4.4" /><path d="M12 7.5a7.1 7.1 0 0 0-7.1 7.1c0 1.3-.2 2.5-.5 3.4" /><path d="M12 7.5a7.1 7.1 0 0 1 7.1 7.1c0 1.2.1 2.4.4 3.3" /><path d="M12 14.6v5.8" /></svg>
    ),
    download: (s) => (
      <svg {...sp(s)}><path d="M12 4v10.4" /><path d="m7.6 10.6 4.4 4.4 4.4-4.4" /><path d="M4.5 19.6h15" /></svg>
    ),
    arrow: (s) => (
      <svg {...sp(s)}><path d="M4.5 12h14" /><path d="m13 6.5 5.5 5.5-5.5 5.5" /></svg>
    ),
    check: (s) => (
      <svg {...sp(s)}><path d="m4.8 12.6 4.4 4.4L19.2 6.6" /></svg>
    ),
    alert: (s) => (
      <svg {...sp(s)}><circle cx="12" cy="12" r="8.6" /><path d="M12 7.6v5" /><path d="M12 16.2h.01" /></svg>
    ),
    cal: (s) => (
      <svg {...sp(s)}><rect x="3.8" y="5" width="16.4" height="15" rx="2.2" /><path d="M3.8 9.6h16.4" /><path d="M8.2 3.2v3.4M15.8 3.2v3.4" /></svg>
    ),
    chevr: (s) => (
      <svg {...sp(s)}><path d="m9 6 6 6-6 6" /></svg>
    ),
  };

  /* ------------------------------------------------------------ primitives */
  function Micro({ text, color, right, style }) {
    const { T, lang } = useC();
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, ...style }}>
        <span style={{ width: 7, height: 7, borderRadius: 2, background: color || T.faint, flex: "none" }} />
        <span style={{
          fontFamily: fmt.mono, fontSize: 10, fontWeight: 600,
          letterSpacing: lang === "hi" ? 0.4 : 1.35, textTransform: "uppercase",
          color: T.faint, whiteSpace: "nowrap",
        }}>{text}</span>
        {right ? <span style={{ marginLeft: "auto" }}>{right}</span> : null}
      </div>
    );
  }

  function Panel({ children, style, pad }) {
    const { T } = useC();
    return (
      <section style={{
        background: T.surface, border: "1px solid " + T.line,
        borderRadius: 14, boxShadow: T.shadow,
        padding: pad === undefined ? 22 : pad,
        display: "flex", flexDirection: "column", minWidth: 0,
        ...style,
      }}>{children}</section>
    );
  }

  function Btn({ children, icon, tone, onClick, testid, style }) {
    const { T, lang } = useC();
    const [h, hov] = useHover();
    const tones = {
      primary: {
        background: h ? T.accent : T.accent, color: T.accentInk,
        border: "1px solid transparent", filter: h ? "brightness(1.08)" : "none",
      },
      coral: {
        background: T.coral, color: T.coralInk,
        border: "1px solid transparent", filter: h ? "brightness(1.07)" : "none",
      },
      ghost: {
        background: h ? T.raised : "transparent", color: T.sub,
        border: "1px solid " + T.line,
      },
    };
    return (
      <button
        type="button" className="hff" onClick={onClick} data-test={testid} {...hov}
        style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "9px 15px", borderRadius: 9, cursor: "pointer",
          fontFamily: fmt.ui(lang), fontSize: 13, fontWeight: 600,
          lineHeight: lang === "hi" ? 1.5 : 1.2,
          transition: "filter 120ms ease, background 120ms ease",
          ...tones[tone || "ghost"], ...style,
        }}
      >
        {icon ? icon : null}
        {children}
      </button>
    );
  }

  function IconBtn({ icon, label, onClick, testid, badge }) {
    const { T } = useC();
    const [h, hov] = useHover();
    return (
      <button
        type="button" className="hff" aria-label={label} title={label}
        onClick={onClick} data-test={testid} {...hov}
        style={{
          position: "relative", width: 36, height: 36, borderRadius: 9,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          background: h ? T.raised : "transparent",
          border: "1px solid " + (h ? T.line : T.lineSoft),
          color: T.sub, cursor: "pointer", transition: "background 120ms ease",
        }}
      >
        {icon}
        {badge ? (
          <span style={{
            position: "absolute", top: 6, right: 6, width: 7, height: 7,
            borderRadius: 99, background: T.coral,
            boxShadow: "0 0 0 2px " + T.surface,
          }} />
        ) : null}
      </button>
    );
  }

  function LangSeg() {
    const { T, lang, setLang } = useC();
    const seg = (code, text, testid) => {
      const on = lang === code;
      return (
        <button
          type="button" className="hff" data-test={testid}
          onClick={() => setLang(code)} aria-pressed={on}
          style={{
            padding: "6px 12px", borderRadius: 7, border: "none", cursor: "pointer",
            fontFamily: code === "hi" ? "'Anek Devanagari',sans-serif" : fmt.mono,
            fontSize: 11.5, fontWeight: 600, lineHeight: 1.4,
            background: on ? T.raised : "transparent",
            color: on ? T.text : T.faint,
            boxShadow: on ? "0 0 0 1px " + T.line : "none",
          }}
        >{text}</button>
      );
    };
    return (
      <div style={{
        display: "inline-flex", gap: 3, padding: 3, borderRadius: 9,
        background: T.inset, border: "1px solid " + T.lineSoft,
      }}>
        {seg("en", "EN", "lang-en")}
        {seg("hi", "हिंदी", "lang-hi")}
      </div>
    );
  }

  /* --------------------------------------------------------------- sidebar */
  function BrandMark({ size }) {
    const { T } = useC();
    const s = size || 30;
    return (
      <svg width={s} height={s} viewBox="0 0 32 32" style={{ display: "block", flex: "none" }} aria-hidden="true">
        <rect x="1.5" y="1.5" width="29" height="29" rx="8.5" fill={T.accentSoft} stroke={T.accent} strokeWidth="1.4" />
        <path d="M10 22.5v-13l12 13v-13" fill="none" stroke={T.accent} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  function NavItem({ id, icon, label, active, badge }) {
    const { T, lang } = useC();
    const [h, hov] = useHover();
    return (
      <a
        href="#" className="hff" {...hov} onClick={(e) => e.preventDefault()}
        aria-current={active ? "page" : undefined}
        style={{
          position: "relative", display: "flex", alignItems: "center", gap: 11,
          padding: "9px 12px", borderRadius: 9, textDecoration: "none",
          fontFamily: fmt.ui(lang), fontSize: 13.5, fontWeight: active ? 700 : 500,
          lineHeight: lang === "hi" ? 1.55 : 1.25,
          color: active ? T.text : h ? T.text : T.sub,
          background: active ? T.accentSoft : h ? T.raised : "transparent",
          transition: "background 120ms ease, color 120ms ease",
        }}
      >
        {active ? (
          <span style={{
            position: "absolute", left: -12, top: 8, bottom: 8, width: 3,
            borderRadius: 99, background: T.accent,
          }} />
        ) : null}
        <span style={{ color: active ? T.accent : "inherit", display: "flex" }}>{icon}</span>
        <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
        {badge ? (
          <span style={{
            fontFamily: fmt.mono, fontSize: 10.5, fontWeight: 700,
            color: T.coral, background: T.coralSoft, border: "1px solid " + T.coral + "44",
            padding: "1px 7px", borderRadius: 99,
          }}>{badge}</span>
        ) : null}
      </a>
    );
  }

  function Sidebar() {
    const { T, t, lang } = useC();
    return (
      <aside style={{
        width: 238, flex: "none", background: T.rail,
        borderRight: "1px solid " + T.lineSoft,
        display: "flex", flexDirection: "column",
        padding: "20px 12px 16px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "0 8px 18px" }}>
          <BrandMark />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: "'Manrope',sans-serif", fontSize: 15.5, fontWeight: 800, letterSpacing: -0.2, color: T.text }}>{t.brand}</div>
            <div style={{
              fontFamily: fmt.ui(lang), fontSize: 10.5, color: T.faint, marginTop: 1,
              lineHeight: lang === "hi" ? 1.5 : 1.3,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>{t.school}</div>
          </div>
        </div>
        <div style={{ height: 1, background: T.lineSoft, margin: "0 -12px 14px" }} />
        <nav style={{ display: "flex", flexDirection: "column", gap: 2 }} aria-label="Main">
          <NavItem id="home" icon={Icons.home(17)} label={t.nav.home} active />
          <NavItem id="att" icon={Icons.clock(17)} label={t.nav.attendance} />
          <NavItem id="leave" icon={Icons.calx(17)} label={t.nav.leave} />
          <NavItem id="pay" icon={Icons.wallet(17)} label={t.nav.pay} />
          <NavItem id="docs" icon={Icons.doc(17)} label={t.nav.documents} badge="1" />
          <NavItem id="hol" icon={Icons.flag(17)} label={t.nav.holidays} />
        </nav>
        <div style={{ flex: 1 }} />
        <nav style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 12 }} aria-label="Secondary">
          <NavItem id="settings" icon={Icons.gear(17)} label={t.nav.settings} />
        </nav>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: 10, borderRadius: 11,
          background: T.surface, border: "1px solid " + T.lineSoft,
        }}>
          <span style={{
            width: 32, height: 32, borderRadius: 99, flex: "none",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            background: T.accentSoft, color: T.accent, border: "1px solid " + T.accent + "55",
            fontFamily: "'Manrope',sans-serif", fontSize: 12, fontWeight: 800,
          }}>AR</span>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontFamily: fmt.ui(lang), fontSize: 12.5, fontWeight: 700, color: T.text,
              lineHeight: lang === "hi" ? 1.5 : 1.25,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>{t.user.name}</div>
            <div style={{ fontFamily: fmt.mono, fontSize: 10.5, color: T.faint, marginTop: 1 }}>{t.user.id}</div>
          </div>
        </div>
      </aside>
    );
  }

  /* ---------------------------------------------------------------- header */
  function Header() {
    const { T, t, lang, mode, setMode } = useC();
    const [sh, shov] = useHover();
    return (
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 22 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h1 style={{
              margin: 0, fontFamily: fmt.ui(lang), fontSize: 25, fontWeight: 800,
              letterSpacing: lang === "hi" ? 0 : -0.5, color: T.text,
              lineHeight: lang === "hi" ? 1.45 : 1.15,
            }}>{t.greet}</h1>
            <span style={{
              fontFamily: fmt.mono, fontSize: 10.5, fontWeight: 600, color: T.accent,
              background: T.accentSoft, border: "1px solid " + T.accent + "44",
              padding: "3px 9px", borderRadius: 99, whiteSpace: "nowrap",
            }}>{t.week}</span>
          </div>
          <div style={{
            fontFamily: fmt.ui(lang), fontSize: 13, color: T.sub, marginTop: 5,
            lineHeight: lang === "hi" ? 1.6 : 1.4,
          }}>
            {t.dateLine}
            <span style={{ color: T.faint }}>{" · "}{t.roleLine}</span>
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 9, flex: "none" }}>
          <button
            type="button" className="hff" {...shov}
            style={{
              display: "inline-flex", alignItems: "center", gap: 9,
              height: 36, padding: "0 12px", borderRadius: 9, cursor: "pointer",
              background: sh ? T.raised : T.surface, border: "1px solid " + T.line,
              color: T.faint, fontFamily: fmt.ui(lang), fontSize: 12.5,
              transition: "background 120ms ease",
            }}
          >
            {Icons.search(15)}
            <span style={{ lineHeight: lang === "hi" ? 1.5 : 1.2 }}>{t.search}</span>
            <span style={{
              fontFamily: fmt.mono, fontSize: 10, fontWeight: 600, color: T.faint,
              border: "1px solid " + T.line, borderRadius: 5, padding: "2px 5px",
              background: T.inset, boxShadow: T.chipShadow,
            }}>⌘K</span>
          </button>
          <LangSeg />
          <IconBtn
            testid="theme-toggle"
            icon={mode === "dark" ? Icons.sun(16) : Icons.moon(16)}
            label={mode === "dark" ? t.themeToLight : t.themeToDark}
            onClick={() => setMode(mode === "dark" ? "light" : "dark")}
          />
          <IconBtn icon={Icons.bell(16)} label={t.notifications} badge />
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------- today: timeline */
  function Timeline() {
    const { T, t } = useC();
    const start = 480, end = 1020;
    const pct = (m) => (((m - start) / (end - start)) * 100).toFixed(3) + "%";
    const wpct = (a, b) => (((b - a) / (end - start)) * 100).toFixed(3) + "%";
    const shiftS = 510, shiftE = 960, inM = 522, nowM = 834;
    const hours = [480, 540, 600, 660, 720, 780, 840, 900, 960, 1020];
    const hl = ["08", "09", "10", "11", "12", "13", "14", "15", "16", "17"];
    return (
      <div style={{ position: "relative", height: 96, marginTop: 20 }}>
        {/* now marker + chip */}
        <div style={{ position: "absolute", left: pct(nowM), top: 6, bottom: 34, width: 2, background: T.text, borderRadius: 2, transform: "translateX(-1px)" }} />
        <div style={{
          position: "absolute", left: pct(nowM), top: -4, transform: "translateX(-50%)",
          fontFamily: fmt.mono, fontSize: 10.5, fontWeight: 700, color: T.canvas,
          background: T.text, borderRadius: 6, padding: "2px 8px", whiteSpace: "nowrap",
        }}>13:54 · {t.today.now}</div>
        {/* track */}
        <div style={{ position: "absolute", left: 0, right: 0, top: 46, height: 8, borderRadius: 99, background: T.inset, border: "1px solid " + T.lineSoft }} />
        {/* shift band */}
        <div style={{ position: "absolute", left: pct(shiftS), width: wpct(shiftS, shiftE), top: 46, height: 8, borderRadius: 99, background: T.shiftBand }} />
        {/* elapsed (in → now) */}
        <div style={{ position: "absolute", left: pct(inM), width: wpct(inM, nowM), top: 46, height: 8, borderRadius: 99, background: T.green }} />
        {/* in marker */}
        <div style={{
          position: "absolute", left: pct(inM), top: 43, width: 14, height: 14,
          transform: "translateX(-7px)", borderRadius: 99,
          background: T.surface, border: "3px solid " + T.green,
        }} />
        <div style={{
          position: "absolute", left: pct(inM), top: 62, transform: "translateX(-50%)",
          fontFamily: fmt.mono, fontSize: 10, fontWeight: 600, color: T.green, whiteSpace: "nowrap",
        }}>08:42</div>
        {/* shift boundary brackets */}
        {[shiftS, shiftE].map((m, i) => (
          <div key={i} style={{ position: "absolute", left: pct(m), top: 38, width: 1, height: 24, background: T.line }} />
        ))}
        {/* hour ticks + labels */}
        {hours.map((m, i) => (
          <React.Fragment key={m}>
            <div style={{ position: "absolute", left: pct(m), top: 58, width: 1, height: 5, background: T.line }} />
            <div style={{
              position: "absolute", left: pct(m), top: 78, transform: "translateX(-50%)",
              fontFamily: fmt.mono, fontSize: 9.5, color: T.faint,
            }}>{hl[i]}</div>
          </React.Fragment>
        ))}
      </div>
    );
  }

  function Readout({ label, value, sub, color }) {
    const { T, lang } = useC();
    return (
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontFamily: fmt.ui(lang), fontSize: 11.5, fontWeight: 600, color: T.faint,
          lineHeight: lang === "hi" ? 1.5 : 1.3, marginBottom: 4,
        }}>{label}</div>
        <div style={{
          fontFamily: fmt.mono, fontSize: 21, fontWeight: 700, letterSpacing: -0.3,
          color: color || T.text, fontVariantNumeric: "tabular-nums",
          lineHeight: lang === "hi" ? 1.4 : 1.1,
        }}>{value}</div>
        <div style={{
          fontFamily: fmt.ui(lang), fontSize: 11, color: T.faint, marginTop: 3,
          lineHeight: lang === "hi" ? 1.5 : 1.3,
        }}>{sub}</div>
      </div>
    );
  }

  function TodayPanel() {
    const { T, t, lang } = useC();
    return (
      <Panel style={{ flex: "1.55 1 0" }}>
        <Micro text={t.today.tag} color={T.green} right={
          <span style={{ fontFamily: fmt.mono, fontSize: 11, color: T.faint }}>{t.today.shift}</span>
        } />
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 16, flexWrap: "wrap" }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "6px 13px", borderRadius: 99,
            background: T.greenSoft, border: "1px solid " + T.green + "55",
          }}>
            <span style={{ width: 8, height: 8, borderRadius: 99, background: T.green }} />
            <span style={{
              fontFamily: fmt.ui(lang), fontSize: 13, fontWeight: 700, color: T.green,
              lineHeight: lang === "hi" ? 1.5 : 1.2,
            }}>{t.today.status}</span>
          </span>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "6px 13px", borderRadius: 99,
            background: T.raised, border: "1px solid " + T.lineSoft, color: T.sub,
          }}>
            {Icons.finger(14)}
            <span style={{
              fontFamily: fmt.ui(lang), fontSize: 12, lineHeight: lang === "hi" ? 1.5 : 1.2,
            }}>{t.today.provenance}</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: T.green }}>
              {Icons.check(12)}
              <span style={{
                fontFamily: fmt.ui(lang), fontSize: 11.5, fontWeight: 600,
                lineHeight: lang === "hi" ? 1.5 : 1.2,
              }}>{t.today.verified}</span>
            </span>
          </span>
        </div>
        <Timeline />
        <div style={{ height: 1, background: T.lineSoft, margin: "16px 0" }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.4fr", gap: 18 }}>
          <Readout label={t.today.in} value="08:42" sub={t.today.inSub} color={T.green} />
          <Readout label={t.today.out} value={t.today.outVal} sub={t.today.outSub} />
          <Readout label={t.today.effective} value={t.today.effVal} sub={t.today.effSub} />
        </div>
      </Panel>
    );
  }

  /* ----------------------------------------------------- document request */
  function DocRequest() {
    const { T, t, lang } = useC();
    return (
      <Panel style={{ flex: "1 1 0", position: "relative", overflow: "hidden" }}>
        <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: T.coral }} />
        <Micro text={t.doc.tag} color={T.coral} right={
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: T.coral }}>
            {Icons.alert(14)}
          </span>
        } />
        <h2 style={{
          margin: "14px 0 0", fontFamily: fmt.ui(lang), fontSize: 17.5, fontWeight: 800,
          color: T.text, letterSpacing: lang === "hi" ? 0 : -0.2,
          lineHeight: lang === "hi" ? 1.5 : 1.25,
        }}>{t.doc.title}</h2>
        <p style={{
          margin: "8px 0 0", fontFamily: fmt.ui(lang), fontSize: 12.8, color: T.sub,
          lineHeight: lang === "hi" ? 1.85 : 1.55,
        }}>{t.doc.body}</p>
        {/* governance mini-flow: employee responds, HR verifies — never self-write */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10, marginTop: 16,
          padding: "11px 13px", borderRadius: 10,
          background: T.inset, border: "1px solid " + T.lineSoft,
        }}>
          {t.doc.steps.map((s, i) => (
            <React.Fragment key={i}>
              {i > 0 ? (
                <span style={{ flex: "0 1 26px", minWidth: 12, height: 1, background: T.line }} />
              ) : null}
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <span style={{
                  width: 18, height: 18, borderRadius: 99, flex: "none",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  fontFamily: fmt.mono, fontSize: 9.5, fontWeight: 700,
                  background: i === 0 ? T.coral : "transparent",
                  color: i === 0 ? T.coralInk : T.faint,
                  border: "1px solid " + (i === 0 ? T.coral : T.line),
                }}>{i + 1}</span>
                <span style={{
                  fontFamily: fmt.ui(lang), fontSize: 11.3, fontWeight: i === 0 ? 700 : 500,
                  color: i === 0 ? T.text : T.faint,
                  lineHeight: lang === "hi" ? 1.55 : 1.3,
                }}>{s}</span>
              </span>
            </React.Fragment>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            padding: "5px 11px", borderRadius: 99,
            background: T.coralSoft, border: "1px solid " + T.coral + "55",
            color: T.coral, fontFamily: fmt.ui(lang), fontSize: 11.5, fontWeight: 700,
            lineHeight: lang === "hi" ? 1.5 : 1.2,
          }}>
            {Icons.cal(13)}
            {t.doc.due}
          </span>
          <span style={{
            fontFamily: fmt.ui(lang), fontSize: 11.5, color: T.faint,
            lineHeight: lang === "hi" ? 1.5 : 1.3,
          }}>{t.doc.by}</span>
        </div>
        <div style={{ display: "flex", gap: 9, marginTop: 16 }}>
          <Btn tone="coral" icon={Icons.arrow(15)} testid="doc-respond">{t.doc.cta}</Btn>
          <Btn tone="ghost">{t.doc.view}</Btn>
        </div>
      </Panel>
    );
  }

  /* --------------------------------------------------- month register strip */
  function MonthStrip() {
    const { T, t, lang } = useC();
    const marks = t.month.marks;
    const toneFor = (st) => ({
      P: { bg: T.greenSoft, fg: T.green, bd: T.green + "44" },
      L: { bg: T.violetSoft, fg: T.violet, bd: T.violet + "44" },
      H: { bg: T.amberSoft, fg: T.amber, bd: T.amberBar + "55" },
      W: { bg: T.raised, fg: T.faint, bd: "transparent" },
      A: { bg: T.coralSoft, fg: T.coral, bd: T.coral + "44" },
    }[st]);
    const cells = [];
    for (let d = 1; d <= 31; d++) {
      let st = null;
      if (SUNDAYS[d]) st = "W";
      else if (HOLIDAYS[d]) st = "H";
      else if (d === 4) st = "L";
      else if (d <= 11) st = "P";
      cells.push({ d, st, late: d === 6, today: d === 11, future: d > 11 });
    }
    const legend = [
      ["P", t.month.legend.P], ["L", t.month.legend.L], ["H", t.month.legend.H],
      ["W", t.month.legend.W], ["A", t.month.legend.A],
    ];
    return (
      <Panel>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
          <Micro text={t.month.tag} color={T.green} />
          <span style={{
            fontFamily: fmt.ui(lang), fontSize: 14.5, fontWeight: 800, color: T.text,
            letterSpacing: lang === "hi" ? 0 : -0.2, lineHeight: lang === "hi" ? 1.5 : 1.2,
          }}>{t.month.title}</span>
          <span style={{ marginLeft: "auto", fontFamily: fmt.mono, fontSize: 11.5, color: T.sub, fontVariantNumeric: "tabular-nums" }}>
            {t.month.summary}
          </span>
          <a href="#" className="hff" onClick={(e) => e.preventDefault()} style={{
            display: "inline-flex", alignItems: "center", gap: 5, textDecoration: "none",
            fontFamily: fmt.ui(lang), fontSize: 12.5, fontWeight: 700, color: T.accent,
            lineHeight: lang === "hi" ? 1.5 : 1.2, borderRadius: 6,
          }}>
            {t.month.open}{Icons.chevr(13)}
          </a>
        </div>
        <div style={{ display: "flex", gap: 5 }}>
          {cells.map((c) => {
            const tone = c.st ? toneFor(c.st) : null;
            return (
              <div
                key={c.d}
                title={"Aug " + c.d + (c.st ? " · " + t.month.legend[c.st] : "")}
                style={{
                  flex: "1 1 0", minWidth: 0, height: 56, borderRadius: 8,
                  position: "relative", overflow: "hidden",
                  background: tone ? tone.bg : "transparent",
                  border: c.today
                    ? "2px solid " + T.green
                    : "1px solid " + (tone && tone.bd !== "transparent" ? tone.bd : T.lineSoft),
                  opacity: c.future && c.st ? 0.55 : 1,
                  display: "flex", flexDirection: "column", alignItems: "center",
                  justifyContent: "center", gap: 3,
                }}
              >
                <span style={{
                  fontFamily: fmt.mono, fontSize: 9.5, color: c.st && !c.future ? (tone ? tone.fg : T.faint) : T.faint,
                  opacity: 0.85, fontVariantNumeric: "tabular-nums",
                }}>{c.d < 10 ? "0" + c.d : c.d}</span>
                <span style={{
                  fontFamily: lang === "hi" ? "'Anek Devanagari',sans-serif" : fmt.mono,
                  fontSize: lang === "hi" ? 11 : 11.5, fontWeight: 700,
                  color: tone ? tone.fg : T.lineSoft, lineHeight: 1.2,
                }}>{c.st ? marks[c.st] : "·"}</span>
                {c.late ? (
                  <span style={{ position: "absolute", left: 6, right: 6, bottom: 4, height: 3, borderRadius: 99, background: T.amberBar }} />
                ) : null}
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 14, flexWrap: "wrap" }}>
          {legend.map(([k, label]) => {
            const tone = toneFor(k);
            return (
              <span key={k} style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                <span style={{
                  width: 17, height: 17, borderRadius: 5, background: tone.bg,
                  border: "1px solid " + (tone.bd === "transparent" ? T.lineSoft : tone.bd),
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  fontFamily: lang === "hi" ? "'Anek Devanagari',sans-serif" : fmt.mono,
                  fontSize: 8.5, fontWeight: 700, color: tone.fg,
                }}>{marks[k]}</span>
                <span style={{
                  fontFamily: fmt.ui(lang), fontSize: 11.5, color: T.sub,
                  lineHeight: lang === "hi" ? 1.5 : 1.3,
                }}>{label}</span>
              </span>
            );
          })}
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
            <span style={{ width: 17, height: 5, borderRadius: 99, background: T.amberBar }} />
            <span style={{
              fontFamily: fmt.ui(lang), fontSize: 11.5, color: T.sub,
              lineHeight: lang === "hi" ? 1.5 : 1.3,
            }}>{t.month.legend.late}</span>
          </span>
        </div>
      </Panel>
    );
  }

  /* --------------------------------------------------------------- payslip */
  function Sparkline() {
    const { T, t } = useC();
    const vals = PAY.trend;
    const W = 258, H = 58, P = 7;
    const min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
    const x = (i) => P + (i * (W - 2 * P)) / (vals.length - 1);
    const y = (v) => H - P - ((v - min) / (max - min)) * (H - 2 * P);
    const pts = vals.map((v, i) => x(i).toFixed(1) + "," + y(v).toFixed(1)).join(" ");
    const area = P + "," + H + " " + pts + " " + (W - P) + "," + H;
    return (
      <div style={{ width: W, flex: "none" }}>
        <div style={{ fontFamily: fmt.mono, fontSize: 10, letterSpacing: 0.6, textTransform: "uppercase", color: T.faint, marginBottom: 8 }}>
          {t.pay.trend}
        </div>
        <svg width={W} height={H} viewBox={"0 0 " + W + " " + H} style={{ display: "block" }} aria-hidden="true">
          <polygon points={area} fill={T.amberSoft} />
          <polyline points={pts} fill="none" stroke={T.amberBar} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          <circle cx={x(vals.length - 1)} cy={y(vals[vals.length - 1])} r="6.5" fill={T.amberSoft} />
          <circle cx={x(vals.length - 1)} cy={y(vals[vals.length - 1])} r="3.2" fill={T.amberBar} />
        </svg>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
          {t.pay.months.map((m) => (
            <span key={m} style={{ fontFamily: fmt.mono, fontSize: 9.5, color: T.faint }}>{m}</span>
          ))}
        </div>
      </div>
    );
  }

  function MoneyRow({ name, amount, frac, barColor }) {
    const { T, lang } = useC();
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <span style={{
          flex: "0 0 46%", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          fontFamily: fmt.ui(lang), fontSize: 12.3, color: T.sub,
          lineHeight: lang === "hi" ? 1.6 : 1.35,
        }}>{name}</span>
        <span style={{ flex: 1, height: 5, borderRadius: 99, background: T.inset, overflow: "hidden" }}>
          <span style={{ display: "block", width: (frac * 100).toFixed(1) + "%", height: "100%", borderRadius: 99, background: barColor }} />
        </span>
        <span style={{
          flex: "none", fontFamily: fmt.mono, fontSize: 12, fontWeight: 600, color: T.text,
          fontVariantNumeric: "tabular-nums", minWidth: 92, textAlign: "right",
        }}>{inr(amount)}</span>
      </div>
    );
  }

  function PayPanel() {
    const { T, t, lang } = useC();
    const eMax = Math.max.apply(null, PAY.earnings);
    const dMax = Math.max.apply(null, PAY.deductions);
    return (
      <Panel style={{ flex: "1.5 1 0" }}>
        <Micro text={t.pay.tag} color={T.amberBar} right={
          <span style={{
            fontFamily: fmt.ui(lang), fontSize: 14.5, fontWeight: 800, color: T.text,
            letterSpacing: lang === "hi" ? 0 : -0.2, lineHeight: lang === "hi" ? 1.5 : 1.2,
          }}>{t.pay.title}</span>
        } />
        <div style={{ display: "flex", alignItems: "flex-start", gap: 26, marginTop: 18 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: fmt.ui(lang), fontSize: 11.5, fontWeight: 600, color: T.faint,
              lineHeight: lang === "hi" ? 1.5 : 1.3,
            }}>{t.pay.net}</div>
            <div style={{
              fontFamily: fmt.mono, fontSize: 33, fontWeight: 700, letterSpacing: -0.8,
              color: T.text, fontVariantNumeric: "tabular-nums", marginTop: 4, lineHeight: 1.1,
            }}>{inr(PAY.net)}</div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6, marginTop: 9,
              fontFamily: fmt.ui(lang), fontSize: 11.8, color: T.sub,
              lineHeight: lang === "hi" ? 1.6 : 1.35,
            }}>
              <span style={{ color: T.green, display: "inline-flex" }}>{Icons.check(13)}</span>
              {t.pay.credited}
            </div>
            <div style={{ marginTop: 16 }}>
              <Btn tone="ghost" icon={Icons.download(14)}>{t.pay.download}</Btn>
            </div>
          </div>
          <Sparkline />
        </div>
        <div style={{ height: 1, background: T.lineSoft, margin: "18px 0 16px" }} />
        <div style={{ display: "flex", gap: 26 }}>
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 9 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{
                fontFamily: fmt.mono, fontSize: 10, letterSpacing: lang === "hi" ? 0.3 : 0.8,
                textTransform: "uppercase", color: T.amber, fontWeight: 700,
              }}>{t.pay.earnings}</span>
              <span style={{ fontFamily: fmt.mono, fontSize: 11.5, fontWeight: 700, color: T.text, fontVariantNumeric: "tabular-nums" }}>{inr(PAY.gross)}</span>
            </div>
            {PAY.earnings.map((v, i) => (
              <MoneyRow key={i} name={t.pay.eItems[i]} amount={v} frac={v / eMax} barColor={T.amberBar} />
            ))}
          </div>
          <div style={{ width: 1, background: T.lineSoft }} />
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 9 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{
                fontFamily: fmt.mono, fontSize: 10, letterSpacing: lang === "hi" ? 0.3 : 0.8,
                textTransform: "uppercase", color: T.coral, fontWeight: 700,
              }}>{t.pay.deductions}</span>
              <span style={{ fontFamily: fmt.mono, fontSize: 11.5, fontWeight: 700, color: T.text, fontVariantNumeric: "tabular-nums" }}>{inr(-PAY.dedTotal)}</span>
            </div>
            {PAY.deductions.map((v, i) => (
              <MoneyRow key={i} name={t.pay.dItems[i]} amount={v} frac={v / dMax} barColor={T.coral} />
            ))}
          </div>
        </div>
      </Panel>
    );
  }

  /* ------------------------------------------------------------ leave panel */
  function LeavePanel() {
    const { T, t, lang } = useC();
    return (
      <Panel style={{ flex: "1 1 0" }}>
        <Micro text={t.leave.tag} color={T.violet} right={
          <span style={{
            fontFamily: fmt.ui(lang), fontSize: 14.5, fontWeight: 800, color: T.text,
            letterSpacing: lang === "hi" ? 0 : -0.2, lineHeight: lang === "hi" ? 1.5 : 1.2,
          }}>{t.leave.title}</span>
        } />
        <div style={{ display: "flex", flexDirection: "column", gap: 15, marginTop: 18, flex: 1, justifyContent: "space-evenly" }}>
          {LEAVE.map((lv, i) => {
            const meta = t.leave.types[i];
            const frac = lv.left / lv.total;
            return (
              <div key={lv.code}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 9, marginBottom: 6 }}>
                  <span style={{
                    fontFamily: fmt.mono, fontSize: 10, fontWeight: 700, color: T.violet,
                    background: T.violetSoft, border: "1px solid " + T.violet + "44",
                    padding: "1px 6px", borderRadius: 5,
                  }}>{lv.code}</span>
                  <span style={{
                    fontFamily: fmt.ui(lang), fontSize: 12.5, color: T.sub, minWidth: 0,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    lineHeight: lang === "hi" ? 1.6 : 1.35,
                  }}>{meta.name}</span>
                  <span style={{ marginLeft: "auto", fontFamily: fmt.mono, fontSize: 12.5, fontVariantNumeric: "tabular-nums" }}>
                    <span style={{ fontWeight: 700, color: T.text }}>{num(lv.left)}</span>
                    <span style={{ color: T.faint }}>{" / " + num(lv.total)}</span>
                  </span>
                </div>
                <div style={{ height: 6, borderRadius: 99, background: T.inset, overflow: "hidden", border: "1px solid " + T.lineSoft }}>
                  <div style={{ width: (frac * 100).toFixed(1) + "%", height: "100%", borderRadius: 99, background: T.violet }} />
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 18 }}>
          <Btn tone="primary" icon={Icons.calx(14)}>{t.leave.apply}</Btn>
          <span style={{
            fontFamily: fmt.ui(lang), fontSize: 10.8, color: T.faint,
            lineHeight: lang === "hi" ? 1.5 : 1.3,
          }}>{t.leave.asOn}</span>
        </div>
      </Panel>
    );
  }

  /* --------------------------------------------------------- holidays panel */
  function HolidayRow({ item, first }) {
    const { T, t, lang } = useC();
    const [h, hov] = useHover();
    return (
      <div {...hov} style={{
        display: "flex", alignItems: "center", gap: 12, flex: "1 0 auto",
        padding: "10px 8px", borderRadius: 9, margin: "0 -8px",
        background: h ? T.raised : "transparent",
        borderTop: first ? "none" : "1px solid " + T.lineSoft,
        transition: "background 120ms ease",
      }}>
        <span style={{
          flex: "none", minWidth: 52, textAlign: "center",
          fontFamily: lang === "hi" ? "'Anek Devanagari',sans-serif" : fmt.mono,
          fontSize: 10.5, fontWeight: 700, letterSpacing: lang === "hi" ? 0 : 0.5,
          color: first ? T.amber : T.sub,
          background: first ? T.amberSoft : T.raised,
          border: "1px solid " + (first ? T.amberBar + "55" : T.lineSoft),
          borderRadius: 7, padding: "5px 8px", lineHeight: 1.35,
        }}>{item.chip}</span>
        <span style={{ minWidth: 0, flex: 1 }}>
          <span style={{
            display: "block", fontFamily: fmt.ui(lang), fontSize: 13, fontWeight: 700,
            color: T.text, lineHeight: lang === "hi" ? 1.55 : 1.3,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>{item.name}</span>
          <span style={{
            display: "block", fontFamily: fmt.ui(lang), fontSize: 11, color: T.faint,
            lineHeight: lang === "hi" ? 1.5 : 1.3, marginTop: 1,
          }}>{item.day}</span>
        </span>
        <span style={{
          flex: "none", fontFamily: fmt.mono, fontSize: 10.8, color: first ? T.amber : T.faint,
          fontVariantNumeric: "tabular-nums",
        }}>{t.holidays.inDays(item.away)}</span>
      </div>
    );
  }

  function HolidaysPanel() {
    const { T, t, lang } = useC();
    return (
      <Panel style={{ flex: "1 1 0" }}>
        <Micro text={t.holidays.tag} color={T.amberBar} right={
          <span style={{
            fontFamily: fmt.ui(lang), fontSize: 14.5, fontWeight: 800, color: T.text,
            letterSpacing: lang === "hi" ? 0 : -0.2, lineHeight: lang === "hi" ? 1.5 : 1.2,
          }}>{t.holidays.title}</span>
        } />
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", flex: 1 }}>
          {t.holidays.items.map((it, i) => (
            <HolidayRow key={it.name} item={it} first={i === 0} />
          ))}
        </div>
      </Panel>
    );
  }

  /* ------------------------------------------------------------------ root */
  function HomeF() {
    const [mode, setMode] = useState("dark");
    const [lang, setLang] = useState("en");
    const T = THEMES[mode];
    const t = STR[lang];
    const ctx = { T, t, mode, lang, setMode, setLang };
    return (
      <Ctx.Provider value={ctx}>
        <style>{
          ".hff{outline:none;}" +
          ".hff:focus-visible{outline:2px solid " + T.accent + ";outline-offset:2px;}" +
          "::selection{background:" + T.accentSoft + ";}"
        }</style>
        <div style={{
          display: "flex", minHeight: "100vh", background: T.canvasWash,
          color: T.text, fontFamily: fmt.ui(lang),
          WebkitFontSmoothing: "antialiased",
        }}>
          <Sidebar />
          <main style={{ flex: 1, minWidth: 0, padding: "24px 30px 30px" }}>
            <Header />
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", gap: 16, alignItems: "stretch" }}>
                <TodayPanel />
                <DocRequest />
              </div>
              <MonthStrip />
              <div style={{ display: "flex", gap: 16, alignItems: "stretch" }}>
                <PayPanel />
                <LeavePanel />
                <HolidaysPanel />
              </div>
            </div>
          </main>
        </div>
      </Ctx.Provider>
    );
  }

  window.HomeExplore = window.HomeExplore || {};
  window.HomeExplore.F = HomeF;
})();
