/* @jsxRuntime classic */
/* ============================================================
   Naveya — EXPERIMENT: Payroll Run Console
   A process screen, not a register: state-machine spine →
   variance bridge (Jul → Aug reconciliation waterfall) →
   exception triage + dossier → maker-checker gate.
   Self-contained: reads window.G2 (colors/scale) only.
   Fonts are local consts (G2.sans/deva are stale — see memory).
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
  const inrS = (p) => (p > 0 ? "+" : "") + inr(p);

  /* ---------- strings (en + hi — whole screen renders in ONE language) ---------- */
  const STR = {
    en: {
      console: "PAYROLL RUN CONSOLE", runId: "RUN-2026-08", today: "11 AUG 2026",
      langEn: "EN", langHi: "हिंदी", toDark: "◐ DARK", toLight: "◐ LIGHT",
      kicker: "PAYROLL · AUGUST 2026 · ALL CAMPUSES",
      title: "August Payroll Run", companion: "अगस्त वेतन रन",
      meta: "410 staff on rolls · 4 campuses · Cycle 01–31 Aug 2026 · Snapshot 11 Aug 09:02",
      headLabel: "NET PAYABLE — PROVISIONAL",
      stateDraft: "DRAFT", stateSubmitted: "SUBMITTED — AWAITING CHECKER",
      stDone: "Done", stActive: "In progress", stPending: "Pending", stLocked: "Locked",
      stations: ["Snapshot", "Pre-flight", "Compute", "Variance triage", "Maker sign-off", "Checker approval", "Disbursement"],
      stSub1: "410 staff · 09:02", stSub2: "6/6 checks · 09:07", stSub3: "410/410 · 09:14",
      resolved: "resolved", ready: "ready to sign", signedShort: "signed 16:05",
      afterApproval: "T+1 after approval", awaitingMaker: "awaiting maker",
      openWord: (n) => n + " open",
      bridgeTitle: "Movement since July", bridgeSub: "Every rupee reconciled — opening + movement = closing",
      opening: "July net — paid 31 Jul", movement: "Net movement", closing: "August net — provisional",
      add: "ADD", less: "LESS",
      qTitle: "Exception triage",
      qFlag: "flagged", qClr: "cleared", qHeld: "held", qOpen: "open",
      qAuto: "7 more auto-cleared below the 15% variance gate",
      sOpen: "Open", sCleared: "Cleared", sHeld: "Held",
      dJul: "JUL", dAug: "AUG", dDelta: "Δ", dNet: "Net pay", dVs: "vs Jul", dNew: "new joiner",
      actClear: "✓ Mark cleared", actHold: "◼ Hold payout", actReopen: "○ Reopen",
      lockedAfterSubmit: "Locked after submission",
      fGross: "Gross earnings", fDed: "Less: deductions", fNet: "Net payable",
      fHeld: (n, amt) => "◼ " + amt + " withheld from bank file — " + n + " payouts held",
      maker: "MAKER — PREPARED BY", checker: "CHECKER — APPROVED BY",
      makerName: "Kavita Sharma", makerRole: "HR & Payroll Officer · NAV-0007",
      checkerName: "Dr. R. Venkataraman", checkerRole: "Director — Finance · NAV-0002",
      signSubmit: "Sign & submit →", approve: "Approve & release",
      blockNote: (n) => "● " + n + " open exceptions block sign-off",
      readyNote: "✓ All exceptions resolved — ready to sign",
      signedNote: "✓ Signed 11 Aug 2026 · 16:05",
      hash: "SNAPSHOT SHA a3f91c…e2d4",
      needChecker: "● Requires checker's own session",
      awaitMakerNote: "○ Awaiting maker submission",
      bankNote: "Bank file is generated only after checker approval.",
    },
    hi: {
      console: "वेतन रन कंसोल", runId: "RUN-2026-08", today: "11 अग॰ 2026",
      langEn: "EN", langHi: "हिंदी", toDark: "◐ गहरा", toLight: "◐ हल्का",
      kicker: "वेतन · अगस्त 2026 · सभी परिसर",
      title: "अगस्त वेतन रन", companion: "August Payroll Run",
      meta: "410 कर्मचारी · 4 परिसर · चक्र 01–31 अगस्त 2026 · स्नैपशॉट 11 अग॰ 09:02",
      headLabel: "देय निवल — अनंतिम",
      stateDraft: "प्रारूप", stateSubmitted: "प्रस्तुत — जाँचकर्ता प्रतीक्षित",
      stDone: "पूर्ण", stActive: "चालू", stPending: "लंबित", stLocked: "अवरुद्ध",
      stations: ["स्नैपशॉट", "पूर्व-जाँच", "गणना", "अंतर समीक्षा", "निर्माता हस्ताक्षर", "जाँचकर्ता अनुमोदन", "भुगतान"],
      stSub1: "410 कर्मचारी · 09:02", stSub2: "6/6 जाँचें · 09:07", stSub3: "410/410 · 09:14",
      resolved: "निपटे", ready: "हस्ताक्षर हेतु तैयार", signedShort: "हस्ताक्षरित 16:05",
      afterApproval: "अनुमोदन के बाद T+1", awaitingMaker: "निर्माता प्रतीक्षित",
      openWord: (n) => n + " खुले",
      bridgeTitle: "जुलाई से बदलाव", bridgeSub: "हर रुपये का मिलान — आरंभ + बदलाव = समापन",
      opening: "जुलाई निवल — 31 जुलाई को भुगतान", movement: "कुल बदलाव", closing: "अगस्त निवल — अनंतिम",
      add: "जोड़", less: "घटाव",
      qTitle: "अपवाद समीक्षा",
      qFlag: "चिह्नित", qClr: "निपटे", qHeld: "रोके", qOpen: "खुले",
      qAuto: "15% अंतर सीमा से नीचे 7 और स्वतः निपटे",
      sOpen: "खुला", sCleared: "निपटाया", sHeld: "रोका",
      dJul: "जुलाई", dAug: "अगस्त", dDelta: "अंतर", dNet: "निवल वेतन", dVs: "जुलाई की तुलना में", dNew: "नई नियुक्ति",
      actClear: "✓ निपटाया चिह्नित करें", actHold: "◼ भुगतान रोकें", actReopen: "○ पुनः खोलें",
      lockedAfterSubmit: "प्रस्तुति के बाद अवरुद्ध",
      fGross: "सकल आय", fDed: "घटाएँ: कटौतियाँ", fNet: "देय निवल",
      fHeld: (n, amt) => "◼ " + amt + " बैंक फ़ाइल से रोके गए — " + n + " भुगतान रोके",
      maker: "निर्माता — तैयारकर्ता", checker: "जाँचकर्ता — अनुमोदक",
      makerName: "कविता शर्मा", makerRole: "मानव संसाधन व वेतन अधिकारी · NAV-0007",
      checkerName: "डॉ. आर. वेंकटरमन", checkerRole: "निदेशक — वित्त · NAV-0002",
      signSubmit: "हस्ताक्षर कर प्रस्तुत करें →", approve: "अनुमोदित कर जारी करें",
      blockNote: (n) => "● " + n + " खुले अपवाद हस्ताक्षर रोकते हैं",
      readyNote: "✓ सभी अपवाद निपटे — हस्ताक्षर हेतु तैयार",
      signedNote: "✓ हस्ताक्षरित 11 अगस्त 2026 · 16:05",
      hash: "स्नैपशॉट SHA a3f91c…e2d4",
      needChecker: "● जाँचकर्ता का अपना सत्र आवश्यक",
      awaitMakerNote: "○ निर्माता की प्रस्तुति प्रतीक्षित",
      bankNote: "बैंक फ़ाइल केवल जाँचकर्ता अनुमोदन के बाद बनती है।",
    },
  };

  const COMP_LABEL = {
    basic: { en: "Basic pay", hi: "मूल वेतन" },
    da: { en: "Dearness allowance", hi: "महँगाई भत्ता" },
    hra: { en: "House rent allowance", hi: "मकान किराया भत्ता" },
    arr: { en: "DA arrears (Apr–Jul)", hi: "म.भ. बकाया (अप्रैल–जुलाई)" },
    notice: { en: "Notice recovery", hi: "सूचना-अवधि वसूली" },
    pf: { en: "PF — employee", hi: "भविष्य निधि — कर्मचारी" },
    tds: { en: "TDS", hi: "स्रोत कर (टीडीएस)" },
  };

  /* ---------- the bridge: authored movement causes (paise) ---------- */
  const JUL_NET = 1249361000; /* ₹1,24,93,610.00 paid 31 Jul */
  const GROSS_AUG = 1581230400; /* ₹1,58,12,304.00 */
  const CAUSES = [
    { id: "inc", amt: 18430000, label: { en: "Annual increments", hi: "वार्षिक वेतन-वृद्धि" }, note: { en: "118 staff", hi: "118 कर्मचारी" } },
    { id: "join", amt: 23150000, label: { en: "New joiners", hi: "नई नियुक्तियाँ" }, note: { en: "3 staff · pro-rata", hi: "3 कर्मचारी · यथानुपात" } },
    { id: "exit", amt: -14280000, label: { en: "Exits & F&F", hi: "सेवा-समाप्ति व अंतिम भुगतान" }, note: { en: "2 staff", hi: "2 कर्मचारी" } },
    { id: "lop", amt: -8734200, label: { en: "Loss of pay", hi: "अवैतनिक अवकाश" }, note: { en: "26.5 days", hi: "26.5 दिन" } },
    { id: "arr", amt: 6412000, label: { en: "DA arrears", hi: "महँगाई भत्ता बकाया" }, note: { en: "revised w.e.f. Apr", hi: "अप्रैल से संशोधित" } },
    { id: "sub", amt: 1840000, label: { en: "Substitution & overtime", hi: "स्थानापन्न व अतिरिक्त कार्य" }, note: { en: "142 periods", hi: "142 कालांश" } },
    { id: "stat", amt: -314800, label: { en: "Statutory shifts", hi: "सांविधिक परिवर्तन" }, note: { en: "PT slab · PF ceiling", hi: "पीटी स्लैब · पीएफ सीमा" } },
  ];
  const MOVEMENT = CAUSES.reduce((s, x) => s + x.amt, 0);
  const AUG_NET = JUL_NET + MOVEMENT; /* everything sums — computed, never typed */

  /* ---------- exceptions: comps are [key, julPaise, augPaise] ---------- */
  const EXC = [
    { id: "e1", name: "Meenakshi Iyer", nameHi: "मीनाक्षी अय्यर", nav: "NAV-0214",
      role: { en: "TGT Mathematics", hi: "टीजीटी गणित" }, campus: { en: "Kothrud Campus", hi: "कोथरुड परिसर" },
      cause: { en: "Increment + DA arrears overlap", hi: "वेतन-वृद्धि + म.भ. बकाया एक साथ" }, init: "open",
      comps: [["basic", 5820000, 6340000], ["da", 1222200, 1466200], ["hra", 2328000, 2536000], ["arr", 0, 976000], ["pf", -698600, -761000], ["tds", -489000, -730400]] },
    { id: "e2", name: "Farhan Qureshi", nameHi: "फ़रहान क़ुरैशी", nav: "NAV-0451",
      role: { en: "PGT Physics", hi: "पीजीटी भौतिकी" }, campus: { en: "Aundh Campus", hi: "औंध परिसर" },
      cause: { en: "New joiner — 11 of 30 days", hi: "नई नियुक्ति — 30 में से 11 दिन" }, init: "open",
      comps: [["basic", 0, 1980000], ["hra", 0, 792000], ["da", 0, 415800], ["pf", 0, -237600]] },
    { id: "e3", name: "Anita Deshpande", nameHi: "अनीता देशपांडे", nav: "NAV-0333",
      role: { en: "TGT English", hi: "टीजीटी अंग्रेज़ी" }, campus: { en: "Wakad Campus", hi: "वाकड परिसर" },
      cause: { en: "Tax regime switched — TDS trued up", hi: "कर व्यवस्था बदली — टीडीएस समायोजित" }, init: "open",
      comps: [["basic", 6100000, 6100000], ["hra", 2440000, 2440000], ["da", 1281000, 1281000], ["pf", -732000, -732000], ["tds", -510000, -1131400]] },
    { id: "e4", name: "Gurpreet Kaur", nameHi: "गुरप्रीत कौर", nav: "NAV-0299",
      role: { en: "Librarian", hi: "पुस्तकालयाध्यक्ष" }, campus: { en: "Baner Campus", hi: "बाणेर परिसर" },
      cause: { en: "Bank account changed on 08 Aug", hi: "बैंक खाता 08 अग॰ को बदला" }, init: "held",
      comps: [["basic", 3850000, 3850000], ["hra", 1540000, 1540000], ["da", 808500, 808500], ["pf", -462000, -462000], ["tds", -145000, -145000]] },
    { id: "e5", name: "T. Lakshmi Narayanan", nameHi: "टी. लक्ष्मी नारायणन", nav: "NAV-0076",
      role: { en: "PGT Chemistry", hi: "पीजीटी रसायन" }, campus: { en: "Kothrud Campus", hi: "कोथरुड परिसर" },
      cause: { en: "Exit 14 Aug — notice recovery, F&F pending", hi: "14 अग॰ सेवा-समाप्ति — सूचना-वसूली, अंतिम भुगतान लंबित" }, init: "held",
      comps: [["basic", 7200000, 3360000], ["hra", 2880000, 1344000], ["da", 1512000, 705600], ["notice", 0, -2160000], ["pf", -864000, -403200], ["tds", -980000, -320000]] },
    { id: "e6", name: "Rohit Bansal", nameHi: "रोहित बंसल", nav: "NAV-0388",
      role: { en: "PRT", hi: "पीआरटी" }, campus: { en: "Baner Campus", hi: "बाणेर परिसर" },
      cause: { en: "9 LOP days — net down sharply", hi: "9 अवैतनिक दिवस — निवल में भारी कमी" }, init: "cleared",
      comps: [["basic", 4200000, 2940000], ["hra", 1680000, 1176000], ["da", 882000, 617400], ["pf", -504000, -352800], ["tds", -210000, -90000]] },
    { id: "e7", name: "Sr. Alphonsa Joseph", nameHi: "सि. अल्फ़ोंसा जोज़ेफ़", nav: "NAV-0102",
      role: { en: "Vice Principal", hi: "उप-प्राचार्या" }, campus: { en: "Kothrud Campus", hi: "कोथरुड परिसर" },
      cause: { en: "PF wage ceiling applied mid-year", hi: "पीएफ वेतन सीमा वर्ष-मध्य लागू" }, init: "cleared",
      comps: [["basic", 9100000, 9100000], ["hra", 3640000, 3640000], ["da", 1911000, 1911000], ["pf", -1092000, -180000], ["tds", -1420000, -1650000]] },
  ];
  const AUTO_CLEARED = 7; /* below the 15% gate, not shown */
  const FLAGGED = EXC.length + AUTO_CLEARED;
  const julOf = (e) => e.comps.reduce((s, x) => s + x[1], 0);
  const augOf = (e) => e.comps.reduce((s, x) => s + x[2], 0);

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
  const caps = (px, w, over) => mono(px, w, Object.assign({ letterSpacing: "0.08em", textTransform: "uppercase" }, over));

  /* ---------- tiny primitives ---------- */
  function MarkWord({ glyph, word, color, lang, px }) {
    return (
      <span style={{ color, whiteSpace: "nowrap" }}>
        <span style={mono(px || 11, 600)}>{glyph} </span>
        <span style={ty("caption", lang, { fontSize: px || 11, fontWeight: 600, color })}>{word}</span>
      </span>
    );
  }

  function Btn({ label, onClick, disabled, primary, c, lang, testid, pressed }) {
    const base = {
      appearance: "none", cursor: disabled ? "not-allowed" : "pointer",
      border: "1px solid " + (primary && !disabled ? c.action : c.borderStrong),
      background: primary && !disabled ? c.action : "transparent",
      color: primary && !disabled ? c.onAction : disabled ? c.inkFaint : c.ink,
      padding: "7px 14px", borderRadius: 0,
      opacity: disabled ? 0.65 : 1,
    };
    return (
      <button type="button" data-nvx={testid} aria-pressed={pressed} disabled={disabled}
        onClick={onClick} style={Object.assign(base, ty("caption", lang, { fontWeight: 600 }))}>
        {label}
      </button>
    );
  }

  function TogBtn({ label, active, onClick, c, lang, testid }) {
    return (
      <button type="button" data-nvx={testid} aria-pressed={!!active} onClick={onClick}
        style={Object.assign({
          appearance: "none", cursor: "pointer", background: "transparent",
          border: "none", borderBottom: active ? "2px solid " + c.accent : "2px solid transparent",
          color: active ? c.ink : c.inkMuted, padding: "6px 8px 4px", borderRadius: 0,
        }, caps(10.5, active ? 700 : 500))}>
        {label}
      </button>
    );
  }

  /* ================= sections ================= */

  function TopStrip({ c, t, lang, mode, setMode, setLang }) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "0 20px", height: 44, borderBottom: "1px solid " + c.ruleStrong, flex: "none" }}>
        <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 15, letterSpacing: "0.14em", color: c.ink }}>NAVEYA</span>
        <span style={{ width: 1, height: 16, background: c.ruleStrong }} />
        <span style={caps(10.5, 600, { color: c.inkMuted, fontFamily: lang === "hi" ? F.deva : F.mono, letterSpacing: lang === "hi" ? "0" : "0.08em" })}>{t.console}</span>
        <span style={mono(10.5, 500, { color: c.inkFaint })}>{t.runId}</span>
        <span style={{ flex: 1 }} />
        <span style={mono(10.5, 500, { color: c.inkFaint })}>{t.today}</span>
        <span style={{ width: 1, height: 16, background: c.ruleStrong }} />
        <TogBtn c={c} lang={lang} label={t.langEn} active={lang === "en"} onClick={() => setLang("en")} testid="lang-en" />
        <TogBtn c={c} lang={lang} label={t.langHi} active={lang === "hi"} onClick={() => setLang("hi")} testid="lang-hi" />
        <span style={{ width: 1, height: 16, background: c.ruleStrong }} />
        <TogBtn c={c} lang={lang} label={mode === "light" ? t.toDark : t.toLight} onClick={() => setMode(mode === "light" ? "dark" : "light")} testid="theme" />
      </div>
    );
  }

  function Masthead({ c, t, lang, stage }) {
    const disp = lang === "hi" ? F.deva : F.display;
    const stateWord = stage === "submitted" ? t.stateSubmitted : t.stateDraft;
    const stateColor = stage === "submitted" ? c.warning : c.inkMuted;
    return (
      <div style={{ display: "flex", alignItems: "flex-end", gap: 24, padding: "18px 20px 14px", borderBottom: "1px solid " + c.ruleStrong, flex: "none" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={caps(10.5, 600, { color: c.accent, fontFamily: lang === "hi" ? F.deva : F.mono, letterSpacing: lang === "hi" ? "0" : "0.1em" })}>{t.kicker}</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginTop: 2 }}>
            <span style={{ fontFamily: disp, fontWeight: 700, fontSize: 34, lineHeight: lang === "hi" ? 1.45 : 1.15, letterSpacing: lang === "hi" ? "0" : "-0.015em", color: c.ink }}>{t.title}</span>
            <span style={{ fontFamily: lang === "hi" ? F.display : F.deva, fontSize: 15, color: c.inkFaint, lineHeight: 1.5 }}>{t.companion}</span>
          </div>
          <div style={ty("small", lang, { color: c.inkMuted, marginTop: 4 })}>{t.meta}</div>
        </div>
        <div style={{ textAlign: "right", flex: "none" }}>
          <div style={caps(10, 600, { color: c.inkMuted, fontFamily: lang === "hi" ? F.deva : F.mono, letterSpacing: lang === "hi" ? "0" : "0.1em" })}>{t.headLabel}</div>
          <div style={mono(38, 600, { color: c.ink, lineHeight: 1.2 })}>{inr(AUG_NET)}</div>
          <div style={{ marginTop: 2 }}>
            <MarkWord glyph={stage === "submitted" ? "◆" : "◇"} word={stateWord} color={stateColor} lang={lang} px={10.5} />
          </div>
        </div>
      </div>
    );
  }

  function Spine({ c, t, lang, openCount, stage }) {
    /* state machine: 0..2 done · 3 triage · 4 maker · 5 checker · 6 disburse */
    const triageDone = openCount === 0;
    const makerDone = stage === "submitted";
    const states = [
      "done", "done", "done",
      triageDone ? "done" : "active",
      makerDone ? "done" : triageDone ? "active" : "pending",
      makerDone ? "active" : "pending",
      "locked",
    ];
    const subs = [
      t.stSub1, t.stSub2, t.stSub3,
      (FLAGGED - openCount) + "/" + FLAGGED + " " + t.resolved,
      makerDone ? t.signedShort : triageDone ? t.ready : t.openWord(openCount),
      makerDone ? "—" : t.awaitingMaker,
      t.afterApproval,
    ];
    const glyphOf = { done: "✓", active: "●", pending: "○", locked: "·" };
    const wordOf = { done: t.stDone, active: t.stActive, pending: t.stPending, locked: t.stLocked };
    const colorOf = { done: c.present, active: c.accent, pending: c.inkFaint, locked: c.inkFaint };
    return (
      <div style={{ display: "flex", borderBottom: "1px solid " + c.ruleStrong, flex: "none" }}>
        {t.stations.map((name, i) => {
          const st = states[i];
          return (
            <div key={i} style={{
              flex: 1, minWidth: 0, padding: "10px 12px 8px",
              borderLeft: i === 0 ? "none" : "1px solid " + c.rule,
              borderBottom: st === "active" ? "2px solid " + c.accent : "2px solid transparent",
              background: st === "active" ? c.sel : "transparent",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={mono(10.5, 600, { color: st === "active" ? c.accent : c.inkFaint })}>{String(i + 1).padStart(2, "0")}</span>
                <MarkWord glyph={glyphOf[st]} word={wordOf[st]} color={colorOf[st]} lang={lang} px={10} />
              </div>
              <div style={ty("caption", lang, { fontSize: 13, fontWeight: 600, color: st === "pending" || st === "locked" ? c.inkMuted : c.ink, marginTop: 2, textTransform: "none", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" })}>{name}</div>
              <div style={mono(10, 500, { color: c.inkFaint, marginTop: 2, fontFamily: lang === "hi" ? F.deva : F.mono, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" })}>{subs[i]}</div>
            </div>
          );
        })}
      </div>
    );
  }

  function Bridge({ c, t, lang }) {
    const maxAbs = Math.max.apply(null, CAUSES.map((x) => Math.abs(x.amt)));
    const doubleRule = { height: 3, borderTop: "1px solid " + c.ink, borderBottom: "1px solid " + c.ink };
    return (
      <div style={{ flex: 11, minWidth: 0, display: "flex", flexDirection: "column", padding: "16px 20px", overflow: "auto" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <span style={ty("h3", lang, { color: c.ink })}>{t.bridgeTitle}</span>
          <span style={ty("caption", lang, { color: c.inkFaint, fontWeight: 500 })}>{t.bridgeSub}</span>
        </div>
        {/* opening */}
        <div style={{ display: "flex", alignItems: "baseline", padding: "12px 0 8px", borderBottom: "1px solid " + c.ruleStrong }}>
          <span style={ty("small", lang, { fontWeight: 600, color: c.ink })}>{t.opening}</span>
          <span style={{ flex: 1 }} />
          <span style={mono(15, 600, { color: c.ink })}>{inr(JUL_NET)}</span>
        </div>
        {/* causes — center-axis waterfall */}
        <div style={{ flex: "none" }}>
          {CAUSES.map((x) => {
            const pos = x.amt > 0;
            const half = (Math.abs(x.amt) / maxAbs) * 50;
            const barCol = pos ? c.seal : c.danger;
            return (
              <div key={x.id} style={{ display: "flex", alignItems: "center", borderBottom: "1px solid " + c.rule, padding: "7px 0" }}>
                <div style={{ width: 230, flex: "none", paddingRight: 12 }}>
                  <div style={ty("small", lang, { fontWeight: 600, color: c.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" })}>{x.label[lang]}</div>
                  <div style={mono(10, 500, { color: c.inkFaint, fontFamily: lang === "hi" ? F.deva : F.mono })}>{x.note[lang]}</div>
                </div>
                <div style={{ flex: 1, alignSelf: "stretch", position: "relative", minWidth: 60 }}>
                  <div style={{ position: "absolute", left: "50%", top: -8, bottom: -8, width: 1, background: c.ruleStrong }} />
                  <div style={{
                    position: "absolute", top: "50%", marginTop: -6, height: 12,
                    left: pos ? "50%" : (50 - half) + "%",
                    width: Math.max(half, 0.4) + "%",
                    background: barCol,
                  }} />
                </div>
                <div style={{ width: 66, flex: "none", textAlign: "right" }}>
                  <MarkWord glyph={pos ? "▲" : "▼"} word={pos ? t.add : t.less} color={pos ? c.seal : c.danger} lang={lang} px={10} />
                </div>
                <div style={{ width: 132, flex: "none", textAlign: "right" }}>
                  <span style={mono(13, 600, { color: c.ink })}>{inrS(x.amt)}</span>
                </div>
              </div>
            );
          })}
        </div>
        {/* movement subtotal */}
        <div style={{ display: "flex", alignItems: "baseline", padding: "8px 0", borderBottom: "1px solid " + c.ruleStrong }}>
          <span style={ty("small", lang, { fontWeight: 600, color: c.inkMuted })}>{t.movement}</span>
          <span style={{ flex: 1 }} />
          <span style={mono(13.5, 600, { color: MOVEMENT >= 0 ? c.seal : c.danger })}>{inrS(MOVEMENT)}</span>
        </div>
        {/* closing under a double rule */}
        <div style={{ marginTop: 10 }}>
          <div style={doubleRule} />
          <div style={{ display: "flex", alignItems: "baseline", padding: "8px 0 0" }}>
            <span style={ty("body", lang, { fontWeight: 700, color: c.ink })}>{t.closing}</span>
            <span style={{ flex: 1 }} />
            <span style={mono(20, 700, { color: c.ink })}>{inr(AUG_NET)}</span>
          </div>
        </div>
      </div>
    );
  }

  function Queue({ c, t, lang, states, sel, setSel }) {
    const counts = { cleared: AUTO_CLEARED, held: 0, open: 0 };
    EXC.forEach((e) => { counts[states[e.id]] += 1; });
    const stateMeta = {
      open: { glyph: "○", word: t.sOpen, color: c.warning },
      cleared: { glyph: "✓", word: t.sCleared, color: c.present },
      held: { glyph: "◼", word: t.sHeld, color: c.danger },
    };
    return (
      <div style={{ display: "flex", flexDirection: "column", minHeight: 0, flex: "0 1 auto", maxHeight: "46%", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, padding: "16px 20px 8px", flex: "none" }}>
          <span style={ty("h3", lang, { color: c.ink })}>{t.qTitle}</span>
          <span style={{ flex: 1 }} />
          <span style={mono(10.5, 500, { color: c.inkMuted, fontFamily: lang === "hi" ? F.deva : F.mono })}>
            {FLAGGED} {t.qFlag} · <span style={{ color: c.present }}>{counts.cleared} {t.qClr}</span> · <span style={{ color: c.danger }}>{counts.held} {t.qHeld}</span> · <span style={{ color: c.warning }}>{counts.open} {t.qOpen}</span>
          </span>
        </div>
        <div style={{ overflowY: "auto", minHeight: 0 }}>
          {EXC.map((e) => {
            const st = stateMeta[states[e.id]];
            const delta = augOf(e) - julOf(e);
            const active = sel === e.id;
            return (
              <button key={e.id} type="button" data-nvx={"exc-" + e.id} aria-pressed={active} onClick={() => setSel(e.id)}
                style={{
                  display: "flex", alignItems: "center", width: "100%", textAlign: "left", gap: 10,
                  padding: "7px 20px 7px 18px", background: active ? c.sel : "transparent",
                  border: "none", borderLeft: active ? "2px solid " + c.accent : "2px solid transparent",
                  borderBottom: "1px solid " + c.rule, cursor: "pointer", borderRadius: 0,
                }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                    <span style={ty("small", lang, { fontWeight: 600, color: c.ink, whiteSpace: "nowrap" })}>{lang === "hi" ? e.nameHi : e.name}</span>
                    <span style={mono(10, 500, { color: c.inkFaint })}>{e.nav}</span>
                  </div>
                  <div style={ty("caption", lang, { fontWeight: 500, color: c.inkMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" })}>{e.cause[lang]}</div>
                </div>
                <span style={mono(12, 600, { color: c.ink, flex: "none" })}>{inrS(delta)}</span>
                <span style={{ flex: "none", width: 76, textAlign: "right" }}>
                  <MarkWord glyph={st.glyph} word={st.word} color={st.color} lang={lang} px={10} />
                </span>
              </button>
            );
          })}
        </div>
        <div style={mono(10, 500, { color: c.inkFaint, padding: "6px 20px", borderBottom: "1px solid " + c.ruleStrong, fontFamily: lang === "hi" ? F.deva : F.mono })}>✓ {t.qAuto}</div>
      </div>
    );
  }

  function Dossier({ c, t, lang, states, setStates, sel, stage }) {
    const e = EXC.find((x) => x.id === sel) || EXC[0];
    const jul = julOf(e), aug = augOf(e), delta = aug - jul;
    const pct = jul === 0 ? null : Math.round((delta / jul) * 1000) / 10;
    const st = states[e.id];
    const locked = stage === "submitted";
    const set = (v) => setStates(Object.assign({}, states, { [e.id]: v }));
    const cell = (v) => v === 0 ? <span style={{ color: c.inkFaint }}>—</span> : inr(v);
    return (
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", padding: "12px 20px 14px", overflow: "auto" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span style={ty("h3", lang, { color: c.ink })}>{lang === "hi" ? e.nameHi : e.name}</span>
          <span style={mono(10.5, 500, { color: c.inkFaint })}>{e.nav}</span>
          <span style={{ flex: 1 }} />
          <span style={mono(11, 600, { color: delta >= 0 ? c.seal : c.danger, fontFamily: lang === "hi" ? F.deva : F.mono })}>
            {pct === null ? t.dNew : (delta >= 0 ? "▲ +" : "▼ ") + pct + "% " + t.dVs}
          </span>
        </div>
        <div style={ty("caption", lang, { color: c.inkMuted, fontWeight: 500, marginTop: 1 })}>{e.role[lang]} · {e.campus[lang]} · {e.cause[lang]}</div>
        {/* comparison matrix */}
        <div style={{ marginTop: 8 }}>
          <div style={{ display: "flex", borderBottom: "1px solid " + c.ruleStrong, paddingBottom: 3 }}>
            <span style={{ flex: 1 }} />
            <span style={caps(9.5, 600, { color: c.inkFaint, width: 96, textAlign: "right", fontFamily: lang === "hi" ? F.deva : F.mono, letterSpacing: lang === "hi" ? "0" : "0.08em" })}>{t.dJul}</span>
            <span style={caps(9.5, 600, { color: c.inkFaint, width: 96, textAlign: "right", fontFamily: lang === "hi" ? F.deva : F.mono, letterSpacing: lang === "hi" ? "0" : "0.08em" })}>{t.dAug}</span>
            <span style={caps(9.5, 600, { color: c.inkFaint, width: 90, textAlign: "right", fontFamily: lang === "hi" ? F.deva : F.mono, letterSpacing: lang === "hi" ? "0" : "0.08em" })}>{t.dDelta}</span>
          </div>
          {e.comps.map(([k, j, a]) => {
            const d = a - j;
            return (
              <div key={k} style={{ display: "flex", alignItems: "baseline", borderBottom: "1px solid " + c.rule, padding: "4px 0" }}>
                <span style={ty("caption", lang, { fontWeight: 500, color: j < 0 || a < 0 ? c.inkMuted : c.ink, flex: 1, minWidth: 0 })}>{COMP_LABEL[k][lang]}</span>
                <span style={mono(11.5, 500, { color: j < 0 ? c.danger : c.ink, width: 96, textAlign: "right" })}>{cell(j)}</span>
                <span style={mono(11.5, 500, { color: a < 0 ? c.danger : c.ink, width: 96, textAlign: "right" })}>{cell(a)}</span>
                <span style={mono(11.5, 600, { color: d === 0 ? c.inkFaint : d > 0 ? c.seal : c.danger, width: 90, textAlign: "right" })}>{d === 0 ? "·" : inrS(d)}</span>
              </div>
            );
          })}
          <div style={{ height: 3, borderTop: "1px solid " + c.ink, borderBottom: "1px solid " + c.ink, marginTop: 4 }} />
          <div style={{ display: "flex", alignItems: "baseline", padding: "5px 0 0" }}>
            <span style={ty("caption", lang, { fontWeight: 700, color: c.ink, flex: 1 })}>{t.dNet}</span>
            <span style={mono(12.5, 700, { color: c.ink, width: 96, textAlign: "right" })}>{inr(jul)}</span>
            <span style={mono(12.5, 700, { color: c.ink, width: 96, textAlign: "right" })}>{inr(aug)}</span>
            <span style={mono(12.5, 700, { color: delta === 0 ? c.inkFaint : delta > 0 ? c.seal : c.danger, width: 90, textAlign: "right" })}>{delta === 0 ? "·" : inrS(delta)}</span>
          </div>
        </div>
        <span style={{ flex: 1 }} />
        <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center" }}>
          {st !== "cleared" && <Btn c={c} lang={lang} label={t.actClear} onClick={() => set("cleared")} disabled={locked} testid="act-clear" />}
          {st !== "held" && <Btn c={c} lang={lang} label={t.actHold} onClick={() => set("held")} disabled={locked} testid="act-hold" />}
          {st !== "open" && <Btn c={c} lang={lang} label={t.actReopen} onClick={() => set("open")} disabled={locked} testid="act-reopen" />}
          {locked && <span style={ty("caption", lang, { color: c.inkFaint, fontWeight: 500 })}>{t.lockedAfterSubmit}</span>}
        </div>
      </div>
    );
  }

  function GateFooter({ c, t, lang, states, stage, setStage, openCount }) {
    const heldList = EXC.filter((e) => states[e.id] === "held");
    const heldSum = heldList.reduce((s, e) => s + augOf(e), 0);
    const deductions = GROSS_AUG - AUG_NET;
    const canSign = openCount === 0 && stage !== "submitted";
    const rowsty = { display: "flex", alignItems: "baseline", padding: "2px 0" };
    return (
      <div style={{ display: "flex", borderTop: "1px solid " + c.ruleStrong, flex: "none", minHeight: 128 }}>
        {/* totals */}
        <div style={{ width: 330, flex: "none", padding: "12px 20px", borderRight: "1px solid " + c.rule }}>
          <div style={rowsty}>
            <span style={ty("caption", lang, { fontWeight: 500, color: c.inkMuted, flex: 1 })}>{t.fGross}</span>
            <span style={mono(12, 500, { color: c.ink })}>{inr(GROSS_AUG)}</span>
          </div>
          <div style={rowsty}>
            <span style={ty("caption", lang, { fontWeight: 500, color: c.inkMuted, flex: 1 })}>{t.fDed}</span>
            <span style={mono(12, 500, { color: c.danger })}>{inr(-deductions)}</span>
          </div>
          <div style={{ height: 3, borderTop: "1px solid " + c.ink, borderBottom: "1px solid " + c.ink, margin: "4px 0" }} />
          <div style={rowsty}>
            <span style={ty("caption", lang, { fontWeight: 700, color: c.ink, flex: 1 })}>{t.fNet}</span>
            <span style={mono(15, 700, { color: c.ink })}>{inr(AUG_NET)}</span>
          </div>
          {heldList.length > 0 && (
            <div style={ty("caption", lang, { color: c.danger, fontWeight: 600, marginTop: 5 })}>{t.fHeld(heldList.length, inr(heldSum))}</div>
          )}
        </div>
        {/* maker */}
        <div style={{ flex: 1, minWidth: 0, padding: "12px 20px", borderRight: "1px solid " + c.rule, display: "flex", flexDirection: "column" }}>
          <div style={caps(9.5, 600, { color: c.inkFaint, fontFamily: lang === "hi" ? F.deva : F.mono, letterSpacing: lang === "hi" ? "0" : "0.1em" })}>{t.maker}</div>
          <div style={ty("body", lang, { fontWeight: 700, color: c.ink, marginTop: 3 })}>{t.makerName}</div>
          <div style={ty("caption", lang, { fontWeight: 500, color: c.inkMuted })}>{t.makerRole}</div>
          <div style={{ flex: 1, minHeight: 6 }} />
          {stage === "submitted" ? (
            <div>
              <div style={ty("caption", lang, { fontWeight: 600, color: c.present })}>{t.signedNote}</div>
              <div style={mono(9.5, 500, { color: c.inkFaint, marginTop: 2 })}>{t.hash}</div>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <Btn c={c} lang={lang} primary label={t.signSubmit} disabled={!canSign} onClick={() => setStage("submitted")} testid="sign-submit" />
              <span style={ty("caption", lang, { fontWeight: 600, color: canSign ? c.present : c.warning })}>
                {canSign ? t.readyNote : t.blockNote(openCount)}
              </span>
            </div>
          )}
        </div>
        {/* checker */}
        <div style={{ flex: 1, minWidth: 0, padding: "12px 20px", display: "flex", flexDirection: "column" }}>
          <div style={caps(9.5, 600, { color: c.inkFaint, fontFamily: lang === "hi" ? F.deva : F.mono, letterSpacing: lang === "hi" ? "0" : "0.1em" })}>{t.checker}</div>
          <div style={ty("body", lang, { fontWeight: 700, color: c.ink, marginTop: 3 })}>{t.checkerName}</div>
          <div style={ty("caption", lang, { fontWeight: 500, color: c.inkMuted })}>{t.checkerRole}</div>
          <div style={{ flex: 1, minHeight: 6 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <Btn c={c} lang={lang} label={t.approve} disabled testid="approve" />
            <span style={ty("caption", lang, { fontWeight: 600, color: stage === "submitted" ? c.warning : c.inkFaint })}>
              {stage === "submitted" ? t.needChecker : t.awaitMakerNote}
            </span>
          </div>
          <div style={ty("caption", lang, { color: c.inkFaint, fontWeight: 500, marginTop: 4 })}>{t.bankNote}</div>
        </div>
      </div>
    );
  }

  /* ================= root ================= */
  function PayrollRunConsole() {
    const [mode, setMode] = useState("light");
    const [lang, setLang] = useState("en");
    const [sel, setSel] = useState("e1");
    const [stage, setStage] = useState("triage");
    const [states, setStates] = useState(() => {
      const m = {};
      EXC.forEach((e) => { m[e.id] = e.init; });
      return m;
    });
    const c = G.theme(mode);
    const t = STR[lang];
    const openCount = EXC.reduce((n, e) => n + (states[e.id] === "open" ? 1 : 0), 0);
    return (
      <div className="nvx" lang={lang} style={{ height: "100vh", display: "flex", flexDirection: "column", background: c.bg, color: c.ink, overflow: "hidden" }}>
        <style>{".nvx button:focus-visible{outline:2px solid " + c.accent + ";outline-offset:1px;} .nvx ::selection{background:" + c.accentSoft + ";}"}</style>
        <TopStrip c={c} t={t} lang={lang} mode={mode} setMode={setMode} setLang={setLang} />
        <Masthead c={c} t={t} lang={lang} stage={stage} />
        <Spine c={c} t={t} lang={lang} openCount={openCount} stage={stage} />
        <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
          <Bridge c={c} t={t} lang={lang} />
          <div style={{ width: 1, background: c.ruleStrong, flex: "none" }} />
          <div style={{ flex: 9, minWidth: 0, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
            <Queue c={c} t={t} lang={lang} states={states} sel={sel} setSel={setSel} />
            <Dossier c={c} t={t} lang={lang} states={states} setStates={setStates} sel={sel} stage={stage} />
          </div>
        </div>
        <GateFooter c={c} t={t} lang={lang} states={states} stage={stage} setStage={setStage} openCount={openCount} />
      </div>
    );
  }

  window.Experiments = window.Experiments || {};
  window.Experiments.PayrollRunConsole = PayrollRunConsole;
})();
