/* @jsxRuntime classic */
/* ============================================================
   Naveya — EXPERIMENT: Overview Dashboard (admin/leadership landing)
   "The morning control board" — four instruments, no KPI tiles:
     1. Action ledger  — ranked triage; money lines sum to masthead
     2. Cover board    — campus × period matrix of uncovered classes
     3. The horizon    — 30-day axis: statutory ₹ above, expiries below
     4. Pulse strip    — run state · headcount · leave pressure · helpdesk
   Self-contained: reads window.G2 only (fonts local — G2.sans/deva stale).
   ============================================================ */
(function () {
  const G = window.G2;
  const { useState } = React;

  const F = {
    display: "'Anek Latin', system-ui, sans-serif",
    deva: "'Anek Devanagari', system-ui, sans-serif",
    sans: "'Hanken Grotesk', system-ui, sans-serif",
    mono: "'JetBrains Mono', ui-monospace, Menlo, monospace",
  };

  /* ---------- money: integer paise → Indian lakh-crore grouping ---------- */
  function inr(paise) {
    const neg = paise < 0;
    const abs = Math.abs(paise);
    const r = Math.floor(abs / 100);
    const p = String(abs % 100).padStart(2, "0");
    let s = String(r), out;
    if (s.length > 3) {
      const last3 = s.slice(-3);
      let rest = s.slice(0, -3);
      const parts = [];
      while (rest.length > 2) { parts.unshift(rest.slice(-2)); rest = rest.slice(0, -2); }
      if (rest) parts.unshift(rest);
      out = parts.join(",") + "," + last3;
    } else out = s;
    return (neg ? "−" : "") + "₹" + out + "." + p;
  }

  /* ---------- type helpers (G2 scale, local families) ---------- */
  function ty(role, lang, over) {
    const r = G.type[role] || G.type.body;
    const deva = lang === "hi";
    const s = {
      fontFamily: deva ? F.deva : F.sans,
      fontSize: r.px, fontWeight: r.weight,
      lineHeight: (deva ? r.lhDeva : r.lh) / r.px,
      letterSpacing: deva ? "0" : r.ls,
    };
    if (r.feat) s.fontFeatureSettings = r.feat;
    return Object.assign(s, over);
  }
  const mono = (px, w, over) => Object.assign({
    fontFamily: F.mono, fontSize: px, fontWeight: w || 500, lineHeight: 1.35,
    fontFeatureSettings: "'tnum' 1, 'lnum' 1",
  }, over);
  /* caps kicker that switches to Devanagari (letter-spacing 0) in HI */
  const capsL = (lang, px, w, over) => Object.assign({
    fontFamily: lang === "hi" ? F.deva : F.mono,
    fontSize: px, fontWeight: w || 600,
    lineHeight: lang === "hi" ? 1.6 : 1.35,
    letterSpacing: lang === "hi" ? "0" : "0.08em",
    textTransform: "uppercase",
    fontFeatureSettings: "'tnum' 1, 'lnum' 1",
  }, over);

  function MarkWord({ glyph, word, color, lang, px }) {
    return (
      <span style={{ color, whiteSpace: "nowrap" }}>
        <span style={mono(px || 11, 600)}>{glyph} </span>
        <span style={ty("caption", lang, { fontSize: px || 11, fontWeight: 600, color })}>{word}</span>
      </span>
    );
  }

  function TogBtn({ label, active, onClick, c, lang, testid }) {
    return (
      <button type="button" data-nvx={testid} aria-pressed={!!active} onClick={onClick}
        style={Object.assign({
          appearance: "none", cursor: "pointer", background: "transparent",
          border: "none", borderBottom: active ? "2px solid " + c.accent : "2px solid transparent",
          color: active ? c.ink : c.inkMuted, padding: "6px 8px 4px", borderRadius: 0,
        }, capsL(lang, 10.5, active ? 700 : 500, { lineHeight: 1.35 }))}>
        {label}
      </button>
    );
  }

  /* ---------- strings ---------- */
  const STR = {
    en: {
      group: "SHARAD EDUCATION SOCIETY · PUNE", today: "TUE · 11 AUG 2026",
      langEn: "EN", langHi: "हिंदी", toDark: "◐ DARK", toLight: "◐ LIGHT",
      nav: ["Overview", "Attendance", "Leave", "Payroll", "Statutory", "Substitutions", "Documents", "Helpdesk"],
      kicker: "OVERVIEW · 4 CAMPUSES · MORNING BOARD",
      title: "Tuesday, 11 August", companion: "मंगलवार, 11 अगस्त",
      meta: "410 staff on rolls · 388 marked in by 08:45 · 22 out — 17 on leave · 5 unmarked",
      headLabel: "AWAITING YOUR DECISION",
      headSub: (n, m) => n + " actions · " + m + " carry money",
      qTitle: "Needs you before noon", qSub: "ranked by what blocks money or people",
      qDue: "DUE", qMoney: "AMOUNT", qState: "STATE",
      qFootLabel: (m) => "Money awaiting decisions — " + m + " items",
      sOpen: "Open", sDue: "Due", sOverdue: "Overdue", sReview: "In review", sUrgent: "Urgent",
      cbTitle: "Cover board — today",
      cbSub: (need, cov, open) => need + " periods need cover · " + cov + " assigned · " + open + " open",
      cbLegend: "✓ n covered · ◼ n uncovered · periods 1–8",
      cbTotal: "GAPS", cbAll: "All campuses",
      outTitle: "Out today", outSub: "17 on leave · 5 unmarked",
      outMore: "+11 on leave · +3 unmarked", outUn: "unmarked",
      hzTitle: "The horizon — next 30 days",
      hzSub: (amt) => amt + " statutory falling due",
      hzToday: "TODAY", hzStat: "STATUTORY — DEPOSIT & FILE", hzDocs: "EXPIRIES — PEOPLE & PAPERS",
      hzIn: (d) => "in " + d + "d", hzOver: (d) => d + "d overdue",
      psRun: "PAYROLL RUN — RUN-2026-08",
      psRunLine1: "04 Variance triage — 11/14 resolved",
      psRunLine2: "● 3 open exceptions — sign-off blocked",
      psHead: "HEADCOUNT — AUGUST", psOnRolls: "on rolls",
      psJoin: "▲ 3 joined this month — F. Qureshi +2",
      psExit: "▼ 2 exits — T. Lakshmi Narayanan · 14 Aug",
      psNotice: "● 1 on notice — S. Kulkarni · last day 30 Sep",
      psLeave: "LEAVE PRESSURE",
      psLeave1: "17 on leave today · 9 requests pending",
      psLeave2: "◼ Blackout 24–29 Aug — Unit Test I",
      psLeave3: "● 2 requests clash with exam duty",
      psHelp: "HELPDESK — 13 OPEN",
      psAge1: "under 24h", psAge2: "1–3 days", psAge3: "over 3 days",
    },
    hi: {
      group: "शारद एजुकेशन सोसायटी · पुणे", today: "मंगल · 11 अग॰ 2026",
      langEn: "EN", langHi: "हिंदी", toDark: "◐ गहरा", toLight: "◐ हल्का",
      nav: ["अवलोकन", "उपस्थिति", "अवकाश", "वेतन", "सांविधिक", "स्थानापन्न", "दस्तावेज़", "हेल्पडेस्क"],
      kicker: "अवलोकन · 4 परिसर · प्रातः पटल",
      title: "मंगलवार, 11 अगस्त", companion: "Tuesday, 11 August",
      meta: "410 कर्मचारी · 08:45 तक 388 उपस्थित · 22 बाहर — 17 अवकाश पर · 5 अचिह्नित",
      headLabel: "आपके निर्णय की प्रतीक्षा में",
      headSub: (n, m) => n + " कार्रवाइयाँ · " + m + " में राशि",
      qTitle: "दोपहर से पहले आपकी ज़रूरत", qSub: "जो राशि या लोगों को रोकता है, उसी क्रम में",
      qDue: "देय", qMoney: "राशि", qState: "स्थिति",
      qFootLabel: (m) => "निर्णय-प्रतीक्षित राशि — " + m + " मद",
      sOpen: "खुला", sDue: "देय", sOverdue: "अतिदेय", sReview: "समीक्षा में", sUrgent: "अत्यावश्यक",
      cbTitle: "स्थानापन्न पटल — आज",
      cbSub: (need, cov, open) => need + " कालांश में शिक्षक चाहिए · " + cov + " नियुक्त · " + open + " खुले",
      cbLegend: "✓ n नियुक्त · ◼ n बिना शिक्षक · कालांश 1–8",
      cbTotal: "रिक्त", cbAll: "सभी परिसर",
      outTitle: "आज अनुपस्थित", outSub: "17 अवकाश पर · 5 अचिह्नित",
      outMore: "+11 अवकाश पर · +3 अचिह्नित", outUn: "अचिह्नित",
      hzTitle: "क्षितिज — अगले 30 दिन",
      hzSub: (amt) => amt + " सांविधिक देय",
      hzToday: "आज", hzStat: "सांविधिक — जमा व दाख़िल", hzDocs: "समाप्ति — लोग व दस्तावेज़",
      hzIn: (d) => d + " दिन में", hzOver: (d) => d + " दिन अतिदेय",
      psRun: "वेतन रन — RUN-2026-08",
      psRunLine1: "04 अंतर समीक्षा — 11/14 निपटे",
      psRunLine2: "● 3 खुले अपवाद — हस्ताक्षर अवरुद्ध",
      psHead: "कर्मचारी संख्या — अगस्त", psOnRolls: "कार्यरत",
      psJoin: "▲ इस माह 3 नियुक्त — फ़. क़ुरैशी +2",
      psExit: "▼ 2 सेवा-समाप्ति — टी. लक्ष्मी नारायणन · 14 अग॰",
      psNotice: "● 1 सूचना-अवधि में — एस. कुलकर्णी · अंतिम दिन 30 सित॰",
      psLeave: "अवकाश दबाव",
      psLeave1: "आज 17 अवकाश पर · 9 आवेदन लंबित",
      psLeave2: "◼ अवरोध 24–29 अग॰ — इकाई परीक्षा I",
      psLeave3: "● 2 आवेदन परीक्षा ड्यूटी से टकराते हैं",
      psHelp: "हेल्पडेस्क — 13 खुले",
      psAge1: "24 घंटे से कम", psAge2: "1–3 दिन", psAge3: "3 दिन से अधिक",
    },
  };

  /* ---------- data: action ledger ---------- */
  const QUEUE = [
    { id: "q1", domain: { en: "PAYROLL", hi: "वेतन" }, state: "open", money: 8117900,
      text: { en: "August run — 3 variance exceptions block maker sign-off", hi: "अगस्त रन — 3 अंतर अपवाद हस्ताक्षर रोक रहे हैं" },
      sub: { en: "RUN-2026-08 · 11/14 resolved", hi: "RUN-2026-08 · 11/14 निपटे" },
      due: { en: "17:00 today", hi: "आज 17:00" } },
    { id: "q2", domain: { en: "F&F", hi: "अंतिम भुगतान" }, state: "review", money: 21526400,
      text: { en: "F&F settlement awaits checker — T. Lakshmi Narayanan", hi: "अंतिम भुगतान जाँचकर्ता प्रतीक्षित — टी. लक्ष्मी नारायणन" },
      sub: { en: "Exit 14 Aug · NAV-0076 · PGT Chemistry", hi: "सेवा-समाप्ति 14 अग॰ · NAV-0076 · पीजीटी रसायन" },
      due: { en: "by 14 Aug", hi: "14 अग॰ तक" } },
    { id: "q3", domain: { en: "STATUTORY", hi: "सांविधिक" }, state: "due", money: 41286000,
      text: { en: "PF ECR for July — file & deposit", hi: "जुलाई का पीएफ ईसीआर — दाख़िल व जमा करें" },
      sub: { en: "EPFO portal · 410 members", hi: "ईपीएफ़ओ पोर्टल · 410 सदस्य" },
      due: { en: "15 Aug · in 4d", hi: "15 अग॰ · 4 दिन में" } },
    { id: "q4", domain: { en: "APPROVALS", hi: "अनुमोदन" }, state: "open", money: 4231800,
      text: { en: "12 reimbursement claims pending approval", hi: "12 प्रतिपूर्ति दावे अनुमोदन हेतु लंबित" },
      sub: { en: "oldest 6 days · 4 medical", hi: "सबसे पुराना 6 दिन · 4 चिकित्सा" },
      due: { en: "this week", hi: "इस सप्ताह" } },
    { id: "q5", domain: { en: "COVER", hi: "स्थानापन्न" }, state: "urgent", money: null,
      text: { en: "Period 3 at Baner — 2 classes still uncovered", hi: "बाणेर में तीसरा कालांश — 2 कक्षाएँ अब भी बिना शिक्षक" },
      sub: { en: "Std VII-B Maths · Std IX-A Science", hi: "कक्षा VII-ब गणित · IX-अ विज्ञान" },
      due: { en: "09:50 today", hi: "आज 09:50" } },
    { id: "q6", domain: { en: "DOCUMENTS", hi: "दस्तावेज़" }, state: "overdue", money: null,
      text: { en: "Police verification overdue — Rekha Iyer", hi: "पुलिस सत्यापन अतिदेय — रेखा अय्यर" },
      sub: { en: "NAV-0142 · PRT · Wakad Campus", hi: "NAV-0142 · पीआरटी · वाकड परिसर" },
      due: { en: "6d overdue", hi: "6 दिन अतिदेय" } },
    { id: "q7", domain: { en: "LEAVE", hi: "अवकाश" }, state: "open", money: null,
      text: { en: "9 leave requests pending — 2 clash with exam duty", hi: "9 अवकाश आवेदन लंबित — 2 परीक्षा ड्यूटी से टकराते हैं" },
      sub: { en: "Unit Test I begins 24 Aug", hi: "इकाई परीक्षा I — 24 अग॰ से" },
      due: { en: "by 20 Aug", hi: "20 अग॰ तक" } },
    { id: "q8", domain: { en: "HELPDESK", hi: "हेल्पडेस्क" }, state: "open", money: null,
      text: { en: "3 tickets older than 3 days", hi: "3 टिकट 3 दिन से पुराने" },
      sub: { en: "2 payroll queries · 1 transfer request", hi: "2 वेतन प्रश्न · 1 स्थानांतरण अनुरोध" },
      due: { en: "—", hi: "—" } },
  ];
  const MONEY_ITEMS = QUEUE.filter((q) => q.money !== null);
  const MONEY_TOTAL = MONEY_ITEMS.reduce((s, q) => s + q.money, 0);

  /* ---------- data: cover board (campus × period) ---------- */
  /* cells: { period: { n: classes needing cover, cov: covered so far } } */
  const CAMPUS = [
    { name: "Kothrud", hi: "कोथरुड", present: 146, total: 152, cells: { 1: { n: 2, cov: 2 }, 3: { n: 1, cov: 1 }, 6: { n: 1, cov: 0 } } },
    { name: "Baner", hi: "बाणेर", present: 91, total: 98, cells: { 3: { n: 2, cov: 0 }, 4: { n: 1, cov: 1 }, 7: { n: 1, cov: 1 } } },
    { name: "Aundh", hi: "औंध", present: 88, total: 92, cells: { 2: { n: 1, cov: 1 }, 5: { n: 1, cov: 0 } } },
    { name: "Wakad", hi: "वाकड", present: 63, total: 68, cells: { 1: { n: 1, cov: 1 } } },
  ];
  const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];
  const campusNeed = (cp) => PERIODS.reduce((s, p) => s + (cp.cells[p] ? cp.cells[p].n : 0), 0);
  const campusCov = (cp) => PERIODS.reduce((s, p) => s + (cp.cells[p] ? cp.cells[p].cov : 0), 0);
  const NEED_ALL = CAMPUS.reduce((s, cp) => s + campusNeed(cp), 0);
  const COV_ALL = CAMPUS.reduce((s, cp) => s + campusCov(cp), 0);

  /* ---------- data: out today (6 leave + 2 unmarked shown; 22 total) ---------- */
  const OUT = [
    { name: "Ritu Malhotra", hi: "रितु मल्होत्रा", campus: "Kothrud", campusHi: "कोथरुड", type: "CL" },
    { name: "P. Srinivasan", hi: "पी. श्रीनिवासन", campus: "Baner", campusHi: "बाणेर", type: "SL" },
    { name: "Neha Kulkarni", hi: "नेहा कुलकर्णी", campus: "Aundh", campusHi: "औंध", type: "EL" },
    { name: "Joseph Mathew", hi: "जोसेफ़ मैथ्यू", campus: "Kothrud", campusHi: "कोथरुड", type: "CL" },
    { name: "Kavita Jadhav", hi: "कविता जाधव", campus: "Wakad", campusHi: "वाकड", type: "SL" },
    { name: "A. Rehman Shaikh", hi: "अ. रहमान शेख़", campus: "Baner", campusHi: "बाणेर", type: "CL" },
    { name: "Sunita Pawar", hi: "सुनीता पवार", campus: "Kothrud", campusHi: "कोथरुड", type: "?" },
    { name: "D. Chatterjee", hi: "डी. चटर्जी", campus: "Aundh", campusHi: "औंध", type: "?" },
  ];

  /* ---------- data: horizon (days from today; negative = overdue) ---------- */
  const HZ_STAT = [
    { id: "pf", days: 4, amt: 41286000, label: { en: "PF ECR — Jul", hi: "पीएफ ईसीआर — जुलाई" }, date: { en: "15 AUG", hi: "15 अग॰" } },
    { id: "esi", days: 10, amt: 10844200, label: { en: "ESI — Jul", hi: "ईएसआई — जुलाई" }, date: { en: "21 AUG", hi: "21 अग॰" } },
    { id: "pt", days: 20, amt: 4180000, label: { en: "PT — Maharashtra", hi: "पीटी — महाराष्ट्र" }, date: { en: "31 AUG", hi: "31 अग॰" } },
    { id: "tds", days: 27, amt: 68421000, label: { en: "TDS deposit — Aug", hi: "टीडीएस जमा — अगस्त" }, date: { en: "07 SEP", hi: "07 सित॰" } },
  ];
  const HZ_STAT_TOTAL = HZ_STAT.reduce((s, x) => s + x.amt, 0);
  const HZ_DOCS = [
    { id: "pol", days: -6, label: { en: "Police verification — R. Iyer", hi: "पुलिस सत्यापन — रे. अय्यर" }, sub: { en: "NAV-0142", hi: "NAV-0142" } },
    { id: "med", days: 14, label: { en: "Medical fitness ×2", hi: "चिकित्सा स्वस्थता ×2" }, sub: { en: "25 AUG", hi: "25 अग॰" } },
    { id: "bed", days: 17, label: { en: "B.Ed verification — 1", hi: "बी.एड सत्यापन — 1" }, sub: { en: "28 AUG", hi: "28 अग॰" } },
    { id: "con", days: 21, label: { en: "Contract renewals ×4", hi: "अनुबंध नवीनीकरण ×4" }, sub: { en: "01 SEP", hi: "01 सित॰" } },
    { id: "bus", days: 25, label: { en: "Bus driver licences ×2", hi: "बस चालक लाइसेंस ×2" }, sub: { en: "05 SEP", hi: "05 सित॰" } },
  ];

  /* ================= sections ================= */

  function Rail({ c, t, lang }) {
    const icons = ["⌂", "▤", "◔", "₹", "§", "⇄", "▣", "◈"];
    return (
      <div style={{ width: 84, flex: "none", background: c.shell, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "16px 0 12px", textAlign: "center", borderBottom: "1px solid rgba(255,255,255,.10)" }}>
          <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 20, letterSpacing: "0.06em", color: c.onShell }}>N</span>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflow: "hidden", paddingTop: 6 }}>
          {t.nav.map((label, i) => {
            const active = i === 0;
            return (
              <button key={i} type="button" data-nvx={"nav-" + i} aria-current={active ? "page" : undefined}
                style={{
                  display: "block", width: "100%", appearance: "none", background: active ? c.shellActive : "transparent",
                  border: "none", borderLeft: active ? "2px solid " + c.accent : "2px solid transparent",
                  padding: "9px 2px 8px", cursor: "pointer", textAlign: "center", borderRadius: 0,
                }}>
                <span style={{ display: "block", fontFamily: F.mono, fontSize: 15, lineHeight: 1.2, color: active ? c.onShell : c.onShellMuted }}>{icons[i]}</span>
                <span style={{
                  display: "block", marginTop: 2,
                  fontFamily: lang === "hi" ? F.deva : F.sans, fontSize: 9.5, fontWeight: 600,
                  lineHeight: lang === "hi" ? 1.6 : 1.3, letterSpacing: lang === "hi" ? "0" : "0.02em",
                  color: active ? c.onShell : c.onShellMuted,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  function TopStrip({ c, t, lang, mode, setMode, setLang }) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "0 24px", height: 42, borderBottom: "1px solid " + c.ruleStrong, flex: "none" }}>
        <span style={capsL(lang, 10, 600, { color: c.inkMuted, lineHeight: 1.35 })}>{t.group}</span>
        <span style={{ flex: 1 }} />
        <span style={mono(10.5, 500, { color: c.inkFaint, fontFamily: lang === "hi" ? F.deva : F.mono })}>{t.today}</span>
        <span style={{ width: 1, height: 16, background: c.ruleStrong }} />
        <TogBtn c={c} lang={lang} label={t.langEn} active={lang === "en"} onClick={() => setLang("en")} testid="lang-en" />
        <TogBtn c={c} lang={lang} label={t.langHi} active={lang === "hi"} onClick={() => setLang("hi")} testid="lang-hi" />
        <span style={{ width: 1, height: 16, background: c.ruleStrong }} />
        <TogBtn c={c} lang={lang} label={mode === "light" ? t.toDark : t.toLight} onClick={() => setMode(mode === "light" ? "dark" : "light")} testid="theme" />
      </div>
    );
  }

  function Masthead({ c, t, lang }) {
    const disp = lang === "hi" ? F.deva : F.display;
    return (
      <div style={{ display: "flex", alignItems: "flex-end", gap: 24, padding: "14px 24px 12px", borderBottom: "1px solid " + c.ruleStrong, flex: "none" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={capsL(lang, 10.5, 600, { color: c.accent, letterSpacing: lang === "hi" ? "0" : "0.1em" })}>{t.kicker}</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginTop: 2 }}>
            <span style={{ fontFamily: disp, fontWeight: 700, fontSize: 32, lineHeight: lang === "hi" ? 1.45 : 1.15, letterSpacing: lang === "hi" ? "0" : "-0.015em", color: c.ink }}>{t.title}</span>
            <span style={{ fontFamily: lang === "hi" ? F.display : F.deva, fontSize: 14.5, color: c.inkFaint, lineHeight: 1.5 }}>{t.companion}</span>
          </div>
          <div style={ty("small", lang, { color: c.inkMuted, marginTop: 3 })}>{t.meta}</div>
        </div>
        <div style={{ textAlign: "right", flex: "none" }}>
          <div style={capsL(lang, 10, 600, { color: c.inkMuted, letterSpacing: lang === "hi" ? "0" : "0.1em" })}>{t.headLabel}</div>
          <div style={mono(34, 600, { color: c.ink, lineHeight: 1.2 })}>{inr(MONEY_TOTAL)}</div>
          <div style={ty("caption", lang, { color: c.inkFaint, fontWeight: 500, marginTop: 1 })}>{t.headSub(QUEUE.length, MONEY_ITEMS.length)}</div>
        </div>
      </div>
    );
  }

  const STATE_META = (c, t) => ({
    open: { glyph: "●", word: t.sOpen, color: c.warning },
    due: { glyph: "◆", word: t.sDue, color: c.warning },
    overdue: { glyph: "!", word: t.sOverdue, color: c.danger },
    review: { glyph: "◇", word: t.sReview, color: c.info },
    urgent: { glyph: "◼", word: t.sUrgent, color: c.danger },
  });

  function ActionLedger({ c, t, lang }) {
    const meta = STATE_META(c, t);
    return (
      <div style={{ flex: 58, minWidth: 0, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden", padding: "12px 24px 10px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flex: "none" }}>
          <span style={ty("h3", lang, { color: c.ink })}>{t.qTitle}</span>
          <span style={ty("caption", lang, { color: c.inkFaint, fontWeight: 500 })}>{t.qSub}</span>
          <span style={{ flex: 1 }} />
          <span style={capsL(lang, 9.5, 600, { color: c.inkFaint })}>{t.qDue}</span>
          <span style={{ width: 86 }} />
          <span style={capsL(lang, 9.5, 600, { color: c.inkFaint, width: 130, textAlign: "right" })}>{t.qMoney}</span>
          <span style={capsL(lang, 9.5, 600, { color: c.inkFaint, width: 96, textAlign: "right" })}>{t.qState}</span>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", marginTop: 6, borderTop: "1px solid " + c.ruleStrong }}>
          {QUEUE.map((q, i) => {
            const m = meta[q.state];
            return (
              <div key={q.id} style={{ display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid " + c.rule, padding: "4px 0" }}>
                <span style={mono(15, 600, { color: c.inkFaint, width: 26, flex: "none", textAlign: "right" })}>{String(i + 1).padStart(2, "0")}</span>
                <span style={capsL(lang, 9.5, 600, { color: c.inkMuted, width: 92, flex: "none", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" })}>{q.domain[lang]}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={ty("small", lang, { fontWeight: 600, color: c.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" })}>{q.text[lang]}</div>
                  <div style={ty("caption", lang, { fontWeight: 500, color: c.inkMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" })}>{q.sub[lang]}</div>
                </div>
                <span style={mono(11, 500, { color: q.state === "overdue" || q.state === "urgent" ? c.danger : c.inkMuted, width: 110, flex: "none", textAlign: "right", fontFamily: lang === "hi" ? F.deva : F.mono })}>{q.due[lang]}</span>
                <span style={mono(12.5, 600, { color: c.ink, width: 130, flex: "none", textAlign: "right" })}>{q.money === null ? <span style={{ color: c.inkFaint }}>—</span> : inr(q.money)}</span>
                <span style={{ width: 96, flex: "none", textAlign: "right" }}>
                  <MarkWord glyph={m.glyph} word={m.word} color={m.color} lang={lang} px={10.5} />
                </span>
              </div>
            );
          })}
        </div>
        <div style={{ flex: "none", marginTop: 6 }}>
          <div style={{ height: 3, borderTop: "1px solid " + c.ink, borderBottom: "1px solid " + c.ink }} />
          <div style={{ display: "flex", alignItems: "baseline", padding: "6px 0 0" }}>
            <span style={ty("caption", lang, { fontWeight: 700, color: c.ink })}>{t.qFootLabel(MONEY_ITEMS.length)}</span>
            <span style={{ flex: 1 }} />
            <span style={mono(16, 700, { color: c.ink })}>{inr(MONEY_TOTAL)}</span>
            <span style={{ width: 96, flex: "none" }} />
          </div>
        </div>
      </div>
    );
  }

  function CoverBoard({ c, t, lang }) {
    const cellW = 44;
    return (
      <div style={{ flex: 42, minWidth: 0, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden", padding: "12px 24px 10px", borderLeft: "1px solid " + c.ruleStrong }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flex: "none" }}>
          <span style={ty("h3", lang, { color: c.ink })}>{t.cbTitle}</span>
          <span style={{ flex: 1 }} />
          <span style={mono(10.5, 500, { color: c.inkMuted, fontFamily: lang === "hi" ? F.deva : F.mono })}>{t.cbSub(NEED_ALL, COV_ALL, NEED_ALL - COV_ALL)}</span>
        </div>
        <div style={{ marginTop: 6, borderTop: "1px solid " + c.ruleStrong, flex: 1, minHeight: 0, overflow: "auto" }}>
          {/* header row */}
          <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid " + c.rule, padding: "4px 0" }}>
            <span style={{ flex: 1, minWidth: 120 }} />
            {PERIODS.map((p) => (
              <span key={p} style={mono(10, 600, { color: c.inkFaint, width: cellW, flex: "none", textAlign: "center" })}>{p}</span>
            ))}
            <span style={capsL(lang, 9.5, 600, { color: c.inkFaint, width: 60, flex: "none", textAlign: "right" })}>{t.cbTotal}</span>
          </div>
          {CAMPUS.map((cp) => {
            const need = campusNeed(cp), cov = campusCov(cp), open = need - cov;
            return (
              <div key={cp.name} style={{ display: "flex", alignItems: "center", borderBottom: "1px solid " + c.rule, padding: "7px 0" }}>
                <div style={{ flex: 1, minWidth: 120 }}>
                  <div style={ty("small", lang, { fontWeight: 600, color: c.ink })}>{lang === "hi" ? cp.hi : cp.name}</div>
                  <div style={mono(10, 500, { color: c.inkFaint })}>{cp.present}/{cp.total}</div>
                </div>
                {PERIODS.map((p) => {
                  const cell = cp.cells[p];
                  if (!cell) return <span key={p} style={mono(11, 500, { color: c.inkFaint, width: cellW, flex: "none", textAlign: "center" })}>·</span>;
                  const gap = cell.n - cell.cov;
                  return (
                    <span key={p} style={{ width: cellW, flex: "none", textAlign: "center" }}>
                      {gap > 0
                        ? <span style={mono(11, 700, { color: c.danger, background: c.absentTint, padding: "2px 5px" })}>◼{gap}</span>
                        : <span style={mono(11, 600, { color: c.present })}>✓{cell.cov}</span>}
                    </span>
                  );
                })}
                <span style={mono(12, 700, { color: open > 0 ? c.danger : c.present, width: 60, flex: "none", textAlign: "right" })}>{open}</span>
              </div>
            );
          })}
          {/* totals row under double rule */}
          <div style={{ height: 3, borderTop: "1px solid " + c.ink, borderBottom: "1px solid " + c.ink, marginTop: 2 }} />
          <div style={{ display: "flex", alignItems: "center", padding: "5px 0" }}>
            <span style={Object.assign({ flex: 1, minWidth: 120 }, ty("caption", lang, { fontWeight: 700, color: c.ink }))}>{t.cbAll}</span>
            {PERIODS.map((p) => {
              const gap = CAMPUS.reduce((s, cp) => s + (cp.cells[p] ? cp.cells[p].n - cp.cells[p].cov : 0), 0);
              return <span key={p} style={mono(11, 700, { color: gap > 0 ? c.danger : c.inkFaint, width: cellW, flex: "none", textAlign: "center" })}>{gap > 0 ? gap : "·"}</span>;
            })}
            <span style={mono(12.5, 700, { color: c.danger, width: 60, flex: "none", textAlign: "right" })}>{NEED_ALL - COV_ALL}</span>
          </div>
          <div style={mono(9.5, 500, { color: c.inkFaint, padding: "4px 0 0", fontFamily: lang === "hi" ? F.deva : F.mono })}>{t.cbLegend}</div>
          {/* out-today roster — resolves the masthead's "22 out" */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 14, borderTop: "1px solid " + c.ruleStrong, paddingTop: 8 }}>
            <span style={ty("h3", lang, { color: c.ink })}>{t.outTitle}</span>
            <span style={mono(14, 700, { color: c.ink })}>22</span>
            <span style={{ flex: 1 }} />
            <span style={mono(10.5, 500, { color: c.inkMuted, fontFamily: lang === "hi" ? F.deva : F.mono })}>{t.outSub}</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", marginTop: 4 }}>
            {OUT.map((o) => {
              const un = o.type === "?";
              return (
                <div key={o.name} style={{ width: "50%", display: "flex", alignItems: "baseline", gap: 8, borderBottom: "1px solid " + c.rule, padding: "4px 12px 4px 0" }}>
                  <span style={ty("caption", lang, { fontWeight: 600, color: c.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" })}>{lang === "hi" ? o.hi : o.name}</span>
                  <span style={mono(9.5, 500, { color: c.inkFaint, fontFamily: lang === "hi" ? F.deva : F.mono })}>{lang === "hi" ? o.campusHi : o.campus}</span>
                  <span style={{ flex: 1 }} />
                  {un
                    ? <MarkWord glyph="?" word={t.outUn} color={c.danger} lang={lang} px={9.5} />
                    : <span style={mono(9.5, 700, { color: c.leaveText, background: c.leaveTint, padding: "1px 5px" })}>{o.type}</span>}
                </div>
              );
            })}
          </div>
          <div style={mono(9.5, 500, { color: c.inkFaint, padding: "5px 0 0", fontFamily: lang === "hi" ? F.deva : F.mono })}>{t.outMore}</div>
        </div>
      </div>
    );
  }

  function Horizon({ c, t, lang }) {
    const H = 172;
    const px = (days) => Math.max(0, Math.min(100, 3 + (days / 30) * 94));
    const weekTicks = [
      { d: 7, lab: { en: "18 AUG", hi: "18 अग॰" } },
      { d: 14, lab: { en: "25 AUG", hi: "25 अग॰" } },
      { d: 21, lab: { en: "01 SEP", hi: "01 सित॰" } },
      { d: 28, lab: { en: "08 SEP", hi: "08 सित॰" } },
    ];
    return (
      <div style={{ flex: "none", borderTop: "1px solid " + c.ruleStrong, padding: "10px 24px 6px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <span style={ty("h3", lang, { color: c.ink })}>{t.hzTitle}</span>
          <span style={capsL(lang, 9.5, 600, { color: c.seal })}>{t.hzStat}</span>
          <span style={mono(11.5, 600, { color: c.seal })}>{t.hzSub(inr(HZ_STAT_TOTAL))}</span>
          <span style={{ flex: 1 }} />
          <span style={capsL(lang, 9.5, 600, { color: c.inkMuted })}>{t.hzDocs}</span>
        </div>
        <div style={{ position: "relative", height: H, marginTop: 2 }}>
          {/* axis */}
          <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 1, background: c.ruleStrong }} />
          {/* day ticks */}
          {Array.from({ length: 31 }, (_, d) => (
            <div key={d} style={{ position: "absolute", left: px(d) + "%", top: "50%", width: 1, height: d % 7 === 0 && d > 0 ? 8 : 4, marginTop: d % 7 === 0 && d > 0 ? -4 : -2, background: c.ruleStrong }} />
          ))}
          {weekTicks.map((w) => (
            <span key={w.d} style={mono(9, 500, { color: c.inkFaint, position: "absolute", left: w.d === 28 ? undefined : w.d >= 21 ? px(w.d) + "%" : px(w.d) + "%", right: w.d === 28 ? (100 - px(28)) - 3 + "%" : undefined, top: "50%", marginTop: 6, transform: w.d === 28 ? undefined : "translateX(-50%)", fontFamily: lang === "hi" ? F.deva : F.mono })}>{w.lab[lang]}</span>
          ))}
          {/* today marker */}
          <div style={{ position: "absolute", left: px(0) + "%", top: 26, bottom: 26, width: 2, background: c.ink }} />
          <span style={capsL(lang, 9, 700, { color: c.ink, position: "absolute", left: px(0) + "%", top: 12, marginLeft: 6 })}>{t.hzToday}</span>
          {/* statutory above the axis */}
          {HZ_STAT.map((x) => (
            <div key={x.id} style={{ position: "absolute", left: px(x.days) + "%", bottom: "50%", width: 1, height: 16, background: c.seal }}>
              <div style={{ position: "absolute", bottom: 16, left: 0, whiteSpace: "nowrap" }}>
                <div style={ty("caption", lang, { fontWeight: 600, color: c.ink })}>{x.label[lang]}</div>
                <div style={mono(11.5, 600, { color: c.seal })}>{inr(x.amt)}</div>
                <div style={mono(9.5, 500, { color: c.inkFaint, fontFamily: lang === "hi" ? F.deva : F.mono })}>{x.date[lang]} · {t.hzIn(x.days)}</div>
              </div>
            </div>
          ))}
          {/* documents below the axis (staggered two levels) */}
          {HZ_DOCS.map((x, i) => {
            const over = x.days < 0;
            const lvl = over ? 0 : i % 2;
            return (
              <div key={x.id} style={{ position: "absolute", left: px(x.days) + "%", top: "50%", width: 1, height: over ? 14 : lvl === 0 ? 14 : 40, background: over ? c.danger : c.borderStrong }}>
                <div style={{ position: "absolute", top: over ? 14 : lvl === 0 ? 14 : 40, left: 0, whiteSpace: "nowrap" }}>
                  <div style={ty("caption", lang, { fontWeight: 600, color: over ? c.danger : c.ink })}>{over ? "! " : ""}{x.label[lang]}</div>
                  <div style={mono(9.5, 500, { color: over ? c.danger : c.inkFaint, fontFamily: lang === "hi" ? F.deva : F.mono })}>{over ? t.hzOver(-x.days) : x.sub[lang]}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function Pulse({ c, t, lang }) {
    const zone = { flex: 1, minWidth: 0, padding: "10px 24px 12px", borderLeft: "1px solid " + c.rule, overflow: "hidden" };
    const cap = (txt, color) => <div style={capsL(lang, 9.5, 600, { color: color || c.inkFaint })}>{txt}</div>;
    const line = (txt, color, mt) => <div style={ty("caption", lang, { fontWeight: 500, color: color || c.inkMuted, marginTop: mt === undefined ? 4 : mt, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" })}>{txt}</div>;
    const ages = [
      { lab: t.psAge1, n: 6, color: c.present },
      { lab: t.psAge2, n: 4, color: c.warning },
      { lab: t.psAge3, n: 3, color: c.danger },
    ];
    const maxAge = 6;
    return (
      <div style={{ display: "flex", borderTop: "1px solid " + c.ruleStrong, flex: "none", minHeight: 118 }}>
        <div style={Object.assign({}, zone, { borderLeft: "none" })}>
          {cap(t.psRun)}
          <div style={{ marginTop: 5 }}>
            <span style={mono(13, 600, { color: c.present })}>✓ ✓ ✓ </span>
            <span style={mono(13, 600, { color: c.accent })}>● </span>
            <span style={mono(13, 600, { color: c.inkFaint })}>○ ○ ·</span>
          </div>
          {line(t.psRunLine1, c.ink)}
          {line(t.psRunLine2, c.warning, 2)}
        </div>
        <div style={zone}>
          {cap(t.psHead)}
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 3 }}>
            <span style={mono(21, 700, { color: c.ink })}>410</span>
            <span style={ty("caption", lang, { fontWeight: 500, color: c.inkFaint })}>{t.psOnRolls}</span>
          </div>
          {line(t.psJoin, c.present, 2)}
          {line(t.psExit, c.danger, 2)}
          {line(t.psNotice, c.warning, 2)}
        </div>
        <div style={zone}>
          {cap(t.psLeave)}
          {line(t.psLeave1, c.ink, 5)}
          {line(t.psLeave2, c.danger, 2)}
          {line(t.psLeave3, c.warning, 2)}
        </div>
        <div style={zone}>
          {cap(t.psHelp)}
          <div style={{ marginTop: 6 }}>
            {ages.map((a) => (
              <div key={a.lab} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={ty("caption", lang, { fontWeight: 500, color: c.inkMuted, width: 110, flex: "none", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" })}>{a.lab}</span>
                <span style={{ flex: 1, minWidth: 20, position: "relative", height: 9 }}>
                  <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: (a.n / maxAge) * 100 + "%", background: a.color }} />
                </span>
                <span style={mono(11.5, 600, { color: a.color, width: 22, flex: "none", textAlign: "right" })}>{a.n}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ================= root ================= */
  function OverviewDashboard() {
    const [mode, setMode] = useState("light");
    const [lang, setLang] = useState("en");
    const c = G.theme(mode);
    const t = STR[lang];
    return (
      <div className="nvx" lang={lang} style={{ height: "100vh", display: "flex", background: c.bg, color: c.ink, overflow: "hidden" }}>
        <style>{".nvx button:focus-visible{outline:2px solid " + c.accent + ";outline-offset:1px;} .nvx ::selection{background:" + c.accentSoft + ";}"}</style>
        <Rail c={c} t={t} lang={lang} />
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
          <TopStrip c={c} t={t} lang={lang} mode={mode} setMode={setMode} setLang={setLang} />
          <Masthead c={c} t={t} lang={lang} />
          <div style={{ flex: 1, minHeight: 0, display: "flex", overflow: "hidden" }}>
            <ActionLedger c={c} t={t} lang={lang} />
            <CoverBoard c={c} t={t} lang={lang} />
          </div>
          <Horizon c={c} t={t} lang={lang} />
          <Pulse c={c} t={t} lang={lang} />
        </div>
      </div>
    );
  }

  window.Experiments = window.Experiments || {};
  window.Experiments.OverviewDashboard = OverviewDashboard;
})();
