/* ============================================================================
   Naveya — FREE EXPLORATION E · "Editorial premium"
   ----------------------------------------------------------------------------
   Visual system: "The Staff Daily" — a broadsheet front page, not an admin
   tool. Type is the lead instrument:
     · Display: Rozha One (ITF fatface, native Latin + Devanagari — the SAME
       display voice in both languages, no bolt-on pairing).
     · Text/UI: Schibsted Grotesk (Latin) / Mukta (Devanagari).
     · Figures: Spline Sans Mono — every rupee and time is tabular.
   Colour commitment: one deep ultramarine ink band carries the hero (real
   surface area), vermilion is the single editorial accent, the page ground is
   cool paper white (NOT cream) / press-ink dark. Composition: masthead with a
   double rule, full-bleed hero, a correction-box notice, a 31-day ledger
   strip, then three numbered columns with hairline dividers, folio footer.
   Classic JSX runtime · no imports · inline styles · self-contained IIFE.
   ========================================================================= */
/* @jsxRuntime classic */
(function () {
  const { useState } = React;

  /* ---------- Indian-grouped rupees (lakh/crore), always exact ---------- */
  function inr(n) {
    const neg = n < 0;
    const parts = Math.abs(n).toFixed(2).split(".");
    const i = parts[0];
    const s =
      i.length > 3
        ? i.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + i.slice(-3)
        : i;
    return (neg ? "−" : "") + "₹" + s + "." + parts[1];
  }

  /* ------------------------------ fonts ------------------------------ */
  const F = {
    disp: "'Rozha One', serif",
    text: function (lang) {
      return lang === "hi"
        ? "'Mukta','Schibsted Grotesk',sans-serif"
        : "'Schibsted Grotesk','Mukta',sans-serif";
    },
    mono: function (lang) {
      return lang === "hi"
        ? "'Spline Sans Mono','Mukta',monospace"
        : "'Spline Sans Mono',monospace";
    },
  };
  function caps(lang, ls) {
    return {
      textTransform: "uppercase",
      letterSpacing: lang === "hi" ? 0.3 : ls == null ? 1.4 : ls,
    };
  }

  /* ------------------------------ themes ------------------------------ */
  const THEMES = {
    light: {
      page: "#F5F5F0",
      panel: "#FFFFFF",
      ink: "#191A20",
      sub: "#50525C",
      hair: "#D9D8CE",
      cobalt: "#1B2A9E",
      cobaltMark: "#1B2A9E",
      onCobalt: "#FFFFFF",
      onCobaltSub: "#C9D0FF",
      cobaltHair: "rgba(255,255,255,0.34)",
      accent: "#E8452A",
      accentText: "#B23315",
      tagText: "#101014",
      focus: "#1B2A9E",
    },
    dark: {
      page: "#101118",
      panel: "#171923",
      ink: "#EFEDE4",
      sub: "#A9ABB8",
      hair: "#2B2D3A",
      cobalt: "#1E2CA4",
      cobaltMark: "#8B96FF",
      onCobalt: "#F2F3FF",
      onCobaltSub: "#C9D0FF",
      cobaltHair: "rgba(242,243,255,0.30)",
      accent: "#FF6B4A",
      accentText: "#FF7E5C",
      tagText: "#101014",
      focus: "#8B96FF",
    },
  };

  /* ---------------------------- shared data ---------------------------- */
  const PAY = {
    basic: 52325, hra: 20930, other: 31395,
    pf: 6279, tds: 11739, pt: 200,
    gross: 104650, ded: 18218, net: 86432,
  };
  const LEAVES = [
    { left: 8, total: 12 },
    { left: 6.5, total: 10 },
    { left: 12, total: 20 },
  ];
  const SUNDAYS = [2, 9, 16, 23, 30];
  const HOLIDAY_DAYS = [15, 28];
  const PAST_MARKS = { 1: "P", 3: "P", 4: "P", 5: "Lv", 6: "P", 7: "P", 8: "P", 10: "Lt", 11: "P" };
  const TODAY_D = 11;

  /* ---------------------------- strings ---------------------------- */
  const STR = {
    en: {
      brandTag: "The Staff Daily",
      school: "Sunrise Public School",
      light: "Light", dark: "Dark",
      langLabel: "Language", themeLabel: "Theme",
      kicker: "Tuesday, 11 August 2026 — Employee home",
      greetA: "Good afternoon,",
      greetB: "Ananya.",
      identity: "Ananya Rao · PGT — Physics · NAV-0142 · Sunrise Public School",
      today: "Today",
      verified: "Fingerprint verified",
      inLbl: "Clock-in · Main Gate",
      outLbl: "Clock-out",
      inTime: "07:52", outTime: "—",
      notOut: "Not yet clocked out",
      effLbl: "Effective so far",
      effVal: "5h 42m",
      prov: "Biometric · Main Gate · ESSL K90 · 07:52:14 IST",
      noticeTag: "Action required",
      noticeBody: "HR requests an updated copy of your PAN card.",
      noticeFrom: "Document request · HR, Sunrise Public School",
      noticeDue: "Due Thursday, 20 August",
      respond: "Respond",
      s1: "Attendance register", s1sub: "August 2026",
      legend: { P: "Present", Lv: "Leave", Lt: "Late", Su: "Sunday", H: "Holiday" },
      marks: { P: "P", Lv: "Lv", Lt: "Lt", Su: "Su", H: "H" },
      totals: "8 present · 1 late · 1 leave · 15 working days remaining",
      s2: "Leave balances", s2sub: "As of 11 Aug",
      leaveLabels: ["Casual leave", "Sick leave", "Earned leave"],
      leaveSubs: ["4 days used this year", "3.5 days used this year", "8 days used this year"],
      s3: "Latest payslip", s3sub: "July 2026",
      credited: "Credited Fri, 31 July · Salary A/c ····4321",
      net: "Net pay", earn: "Earnings", ded: "Deductions",
      payRows: ["Basic pay", "House rent allowance", "Other allowances"],
      dedRows: ["Provident fund", "TDS (income tax)", "Professional tax"],
      viewSlip: "View full payslip →",
      s4: "Upcoming holidays", s4sub: "Next four",
      hols: [
        { d: "Sat, 15 Aug", n: "Independence Day", w: "in 4 days" },
        { d: "Fri, 28 Aug", n: "Raksha Bandhan", w: "in 17 days" },
        { d: "Fri, 4 Sep", n: "Janmashtami", w: "in 24 days" },
        { d: "Fri, 2 Oct", n: "Gandhi Jayanti", w: "in 52 days" },
      ],
      footerL: "Naveya — HR & payroll for Indian schools",
      footerR: "Data as of Tue, 11 Aug 2026 · 13:34 IST",
    },
    hi: {
      brandTag: "स्टाफ़ दैनिक",
      school: "सनराइज़ पब्लिक स्कूल",
      light: "लाइट", dark: "डार्क",
      langLabel: "भाषा", themeLabel: "थीम",
      kicker: "मंगलवार, 11 अगस्त 2026 — कर्मचारी मुखपृष्ठ",
      greetA: "नमस्ते,",
      greetB: "अनन्या।",
      identity: "अनन्या राव · पीजीटी — भौतिकी · NAV-0142 · सनराइज़ पब्लिक स्कूल",
      today: "आज",
      verified: "फ़िंगरप्रिंट सत्यापित",
      inLbl: "आगमन · मुख्य द्वार",
      outLbl: "प्रस्थान",
      inTime: "07:52", outTime: "—",
      notOut: "अभी प्रस्थान नहीं",
      effLbl: "अब तक प्रभावी समय",
      effVal: "5 घं 42 मि",
      prov: "बायोमेट्रिक · मुख्य द्वार · ESSL K90 · 07:52:14 IST",
      noticeTag: "कार्रवाई आवश्यक",
      noticeBody: "एचआर ने आपके पैन कार्ड की अद्यतन प्रति मांगी है।",
      noticeFrom: "दस्तावेज़ अनुरोध · एचआर, सनराइज़ पब्लिक स्कूल",
      noticeDue: "नियत तिथि — गुरुवार, 20 अगस्त",
      respond: "जवाब दें",
      s1: "उपस्थिति पंजिका", s1sub: "अगस्त 2026",
      legend: { P: "उपस्थित", Lv: "अवकाश", Lt: "विलंब", Su: "रविवार", H: "छुट्टी" },
      marks: { P: "उ", Lv: "अव", Lt: "वि", Su: "र", H: "छ" },
      totals: "8 उपस्थित · 1 विलंब · 1 अवकाश · 15 कार्य-दिवस शेष",
      s2: "अवकाश शेष", s2sub: "11 अगस्त तक",
      leaveLabels: ["आकस्मिक अवकाश", "चिकित्सा अवकाश", "अर्जित अवकाश"],
      leaveSubs: ["इस वर्ष 4 दिन उपयोग", "इस वर्ष 3.5 दिन उपयोग", "इस वर्ष 8 दिन उपयोग"],
      s3: "नवीनतम वेतन पर्ची", s3sub: "जुलाई 2026",
      credited: "शुक्र, 31 जुलाई को जमा · वेतन खाता ····4321",
      net: "शुद्ध वेतन", earn: "आय", ded: "कटौतियाँ",
      payRows: ["मूल वेतन", "मकान किराया भत्ता", "अन्य भत्ते"],
      dedRows: ["भविष्य निधि", "टीडीएस (आयकर)", "व्यवसाय कर"],
      viewSlip: "पूरी वेतन पर्ची देखें →",
      s4: "आगामी छुट्टियाँ", s4sub: "अगली चार",
      hols: [
        { d: "शनि, 15 अगस्त", n: "स्वतंत्रता दिवस", w: "4 दिन में" },
        { d: "शुक्र, 28 अगस्त", n: "रक्षा बंधन", w: "17 दिन में" },
        { d: "शुक्र, 4 सितंबर", n: "जन्माष्टमी", w: "24 दिन में" },
        { d: "शुक्र, 2 अक्टूबर", n: "गांधी जयंती", w: "52 दिन में" },
      ],
      footerL: "Naveya — भारतीय स्कूलों के लिए एचआर और वेतन प्रणाली",
      footerR: "डेटा: मंगल, 11 अगस्त 2026 · 13:34 IST तक",
    },
  };

  /* ------------------------ tiny inline artwork ------------------------ */
  function FingerprintGlyph(props) {
    return (
      <svg width={props.size || 13} height={props.size || 13} viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"
        style={{ display: "block" }}>
        <path d="M12 4.5a7.5 7.5 0 0 1 7.5 7.5c0 2.4-.35 4.8-1.1 6.9" />
        <path d="M12 8.2a3.8 3.8 0 0 1 3.8 3.8c0 2.6-.3 5.2-1 7.6" />
        <path d="M12 12c0 2.9-.5 5.8-1.5 8.3" />
        <path d="M8.6 6.2A7.5 7.5 0 0 0 4.5 12c0 1.7.2 3.4.6 5" />
        <path d="M8.2 12a3.8 3.8 0 0 1 1-2.6" />
      </svg>
    );
  }
  function CheckGlyph(props) {
    return (
      <svg width={props.size || 11} height={props.size || 11} viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"
        aria-hidden="true" style={{ display: "block" }}>
        <path d="M4 12.5 10 18.5 20 6" />
      </svg>
    );
  }

  /* --------------------------- shared atoms --------------------------- */
  function Seg(props) {
    const t = props.t, lang = props.lang;
    return (
      <div role="group" aria-label={props.label}
        style={{ display: "flex", border: "1px solid " + t.ink }}>
        {props.items.map(function (it) {
          const active = props.value === it.v;
          return (
            <button key={it.v} className="hee-f" data-he={props.name + "-" + it.v}
              aria-pressed={active} onClick={function () { props.onChange(it.v); }}
              style={{
                appearance: "none", border: "none", cursor: "pointer",
                padding: "7px 14px", margin: 0,
                fontFamily: it.dev ? F.text("hi") : F.text(lang),
                fontSize: 11, fontWeight: 700, lineHeight: 1.4,
                textTransform: "uppercase", letterSpacing: it.dev ? 0.3 : 1.2,
                background: active ? t.ink : "transparent",
                color: active ? t.page : t.ink,
              }}>
              {it.label}
            </button>
          );
        })}
      </div>
    );
  }

  function SectionHead(props) {
    const t = props.t, lang = props.lang;
    return (
      <div style={{
        display: "flex", alignItems: "baseline", gap: 14,
        borderBottom: "2px solid " + t.ink, paddingBottom: 12, marginBottom: 22,
      }}>
        <span style={{ fontFamily: F.disp, fontSize: 22, lineHeight: 1, color: t.accentText }}>
          {props.num}
        </span>
        <span style={Object.assign(
          { fontFamily: F.text(lang), fontWeight: 700, fontSize: 13, color: t.ink,
            lineHeight: lang === "hi" ? 1.6 : 1.3 },
          caps(lang, 1.6)
        )}>
          {props.title}
        </span>
        <span style={{
          marginLeft: "auto", fontFamily: F.mono(lang), fontSize: 11, color: t.sub,
          letterSpacing: lang === "hi" ? 0.2 : 0.8, textTransform: "uppercase",
        }}>
          {props.sub}
        </span>
      </div>
    );
  }

  /* ============================== screen ============================== */
  function HomeE() {
    const [mode, setMode] = useState("light");
    const [lang, setLang] = useState("en");
    const t = THEMES[mode];
    const L = STR[lang];
    const bodyLH = lang === "hi" ? 1.8 : 1.5;

    const markColor = {
      P: t.ink, Lv: t.cobaltMark, Lt: t.accentText, Su: t.sub, H: t.sub,
    };

    function cellFor(d) {
      if (d <= TODAY_D) {
        const m = PAST_MARKS[d] || (SUNDAYS.indexOf(d) >= 0 ? "Su" : null);
        return { m: m, pre: false };
      }
      if (HOLIDAY_DAYS.indexOf(d) >= 0) return { m: "H", pre: true };
      if (SUNDAYS.indexOf(d) >= 0) return { m: "Su", pre: true };
      return { m: null, pre: true };
    }

    const leader = (
      <span aria-hidden="true" style={{
        flex: 1, borderBottom: "1px dotted " + t.hair,
        margin: "0 10px", transform: "translateY(-4px)",
      }} />
    );

    function payRow(label, amount, strong) {
      return (
        <div key={label} style={{ display: "flex", alignItems: "baseline", padding: "7px 0" }}>
          <span style={{
            fontFamily: F.text(lang), fontSize: strong ? 14 : 13.5,
            fontWeight: strong ? 700 : 400, color: strong ? t.ink : t.sub,
            lineHeight: bodyLH,
          }}>{label}</span>
          {leader}
          <span style={{
            fontFamily: F.mono("en"), fontSize: strong ? 14 : 13.5,
            fontWeight: strong ? 700 : 500, color: t.ink, whiteSpace: "nowrap",
            fontVariantNumeric: "tabular-nums",
          }}>{amount}</span>
        </div>
      );
    }

    return (
      <div style={{
        minHeight: "100vh", background: t.page, color: t.ink,
        fontFamily: F.text(lang),
      }}>
        <style>{
          ".hee-f{outline:none}" +
          ".hee-f:focus-visible{outline:3px solid " + t.focus + ";outline-offset:2px}"
        }</style>

        {/* ------------------------- masthead ------------------------- */}
        <div style={{ display: "flex", alignItems: "center", gap: 22, padding: "22px 72px 16px" }}>
          <span style={{ fontFamily: F.disp, fontSize: 30, lineHeight: 1, color: t.ink }}>
            Naveya
          </span>
          <span aria-hidden="true" style={{ width: 1, height: 24, background: t.hair }} />
          <span style={Object.assign(
            { fontFamily: F.mono(lang), fontSize: 11, color: t.sub },
            caps(lang, 2)
          )}>
            {L.brandTag}
          </span>
          <span style={Object.assign(
            { marginLeft: "auto", fontFamily: F.mono(lang), fontSize: 11, color: t.sub },
            caps(lang, 1.2)
          )}>
            {L.school}
          </span>
          <Seg name="lang" label={L.langLabel} t={t} lang={lang} value={lang} onChange={setLang}
            items={[{ v: "en", label: "EN" }, { v: "hi", label: "हिंदी", dev: true }]} />
          <Seg name="mode" label={L.themeLabel} t={t} lang={lang} value={mode} onChange={setMode}
            items={[{ v: "light", label: L.light }, { v: "dark", label: L.dark }]} />
        </div>
        <div style={{ margin: "0 72px", borderTop: "3px solid " + t.ink }} />
        <div style={{ margin: "3px 72px 0", borderTop: "1px solid " + t.ink }} />

        {/* ---------------------- hero: cobalt band ---------------------- */}
        <div style={{ marginTop: 24, background: t.cobalt, color: t.onCobalt, padding: "54px 72px 58px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 540px", columnGap: 88 }}>
            {/* greeting */}
            <div>
              <div style={Object.assign(
                { fontFamily: F.mono(lang), fontSize: 11.5, color: t.onCobaltSub },
                caps(lang, 2.2)
              )}>
                {L.kicker}
              </div>
              <h1 style={{
                margin: "20px 0 0", fontFamily: F.disp, fontWeight: 400,
                fontSize: lang === "hi" ? 68 : 84,
                lineHeight: lang === "hi" ? 1.34 : 1.04,
                color: t.onCobalt, letterSpacing: lang === "hi" ? 0 : -0.5,
              }}>
                {L.greetA}<br />{L.greetB}
              </h1>
              <div style={{
                marginTop: 28, fontFamily: F.text(lang), fontSize: 16,
                lineHeight: bodyLH, color: t.onCobaltSub, fontWeight: 500,
              }}>
                {L.identity}
              </div>
            </div>

            {/* today panel */}
            <div style={{ borderLeft: "1px solid " + t.cobaltHair, paddingLeft: 56, display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <span style={Object.assign(
                  { fontFamily: F.text(lang), fontWeight: 700, fontSize: 12.5,
                    lineHeight: lang === "hi" ? 1.6 : 1.3 },
                  caps(lang, 2)
                )}>
                  {L.today}
                </span>
                <span style={{
                  marginLeft: "auto", display: "flex", alignItems: "center", gap: 7,
                  border: "1px solid " + t.cobaltHair, padding: "5px 11px",
                  fontFamily: F.mono(lang), fontSize: 10, textTransform: "uppercase",
                  letterSpacing: lang === "hi" ? 0.2 : 1, color: t.onCobalt,
                  lineHeight: lang === "hi" ? 1.7 : 1.4,
                }}>
                  <CheckGlyph />{L.verified}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 40, marginTop: 30 }}>
                <div>
                  <div style={Object.assign(
                    { fontFamily: F.mono(lang), fontSize: 11, color: t.onCobaltSub,
                      lineHeight: lang === "hi" ? 1.7 : 1.4 },
                    caps(lang, 1.2)
                  )}>
                    {L.inLbl}
                  </div>
                  <div style={{ marginTop: 10, fontFamily: F.disp, fontSize: 58, lineHeight: 1 }}>
                    {L.inTime}
                  </div>
                </div>
                <div>
                  <div style={Object.assign(
                    { fontFamily: F.mono(lang), fontSize: 11, color: t.onCobaltSub,
                      lineHeight: lang === "hi" ? 1.7 : 1.4 },
                    caps(lang, 1.2)
                  )}>
                    {L.outLbl}
                  </div>
                  <div aria-hidden="true" style={{ marginTop: 10, fontFamily: F.disp, fontSize: 58, lineHeight: 1 }}>
                    {L.outTime}
                  </div>
                  <div style={{
                    marginTop: 8, fontFamily: F.text(lang), fontSize: 12.5,
                    color: t.onCobaltSub, lineHeight: lang === "hi" ? 1.7 : 1.4,
                  }}>
                    {L.notOut}
                  </div>
                </div>
              </div>

              <div style={{
                marginTop: 28, borderTop: "1px solid " + t.cobaltHair, paddingTop: 20,
                display: "flex", alignItems: "baseline",
              }}>
                <span style={Object.assign(
                  { fontFamily: F.mono(lang), fontSize: 11, color: t.onCobaltSub,
                    lineHeight: lang === "hi" ? 1.7 : 1.4 },
                  caps(lang, 1.2)
                )}>
                  {L.effLbl}
                </span>
                <span style={{ marginLeft: "auto", fontFamily: F.disp, fontSize: 34, lineHeight: lang === "hi" ? 1.3 : 1 }}>
                  {L.effVal}
                </span>
              </div>

              <div style={{
                marginTop: 22, display: "flex", alignItems: "center", gap: 9,
                fontFamily: F.mono(lang), fontSize: 10.5, color: t.onCobaltSub,
                textTransform: "uppercase", letterSpacing: lang === "hi" ? 0.2 : 1,
                lineHeight: lang === "hi" ? 1.7 : 1.4,
              }}>
                <FingerprintGlyph />{L.prov}
              </div>
            </div>
          </div>
        </div>

        {/* ------------------- notice: correction box ------------------- */}
        <div style={{ padding: "28px 72px 0" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 28,
            border: "2px solid " + t.ink,
            background: t.panel, padding: "20px 32px",
          }}>
            <span style={Object.assign(
              { fontFamily: F.text(lang), fontWeight: 700, fontSize: 11,
                background: t.accent, color: t.tagText, padding: "6px 11px",
                whiteSpace: "nowrap", lineHeight: lang === "hi" ? 1.6 : 1.3 },
              caps(lang, 1.4)
            )}>
              {L.noticeTag}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: F.text(lang), fontSize: 17, fontWeight: 600, lineHeight: bodyLH, color: t.ink }}>
                {L.noticeBody}
              </div>
              <div style={{
                marginTop: 5, fontFamily: F.mono(lang), fontSize: 11, color: t.sub,
                lineHeight: lang === "hi" ? 1.7 : 1.4,
              }}>
                {L.noticeFrom} · <span style={{ color: t.accentText, fontWeight: 600 }}>{L.noticeDue}</span>
              </div>
            </div>
            <button className="hee-f" data-he="respond" onClick={function () {}}
              style={Object.assign(
                { appearance: "none", border: "none", cursor: "pointer",
                  background: t.ink, color: t.page, padding: "13px 26px",
                  fontFamily: F.text(lang), fontWeight: 700, fontSize: 12,
                  lineHeight: lang === "hi" ? 1.6 : 1.3 },
                caps(lang, 1.4)
              )}>
              {L.respond}
            </button>
          </div>
        </div>

        {/* ---------------- 01 · attendance register strip ---------------- */}
        <div style={{ padding: "52px 72px 0" }}>
          <SectionHead num="01" title={L.s1} sub={L.s1sub} t={t} lang={lang} />
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(31, 1fr)",
            border: "1px solid " + t.hair, background: t.panel,
          }}>
            {Array.apply(null, Array(31)).map(function (_, idx) {
              const d = idx + 1;
              const c = cellFor(d);
              const isToday = d === TODAY_D;
              return (
                <div key={d} style={{
                  borderRight: d < 31 ? "1px solid " + t.hair : "none",
                  padding: "10px 2px 12px", textAlign: "center",
                  background: isToday
                    ? (mode === "light" ? "rgba(27,42,158,0.08)" : "rgba(139,150,255,0.12)")
                    : "transparent",
                  boxShadow: isToday ? "inset 0 -3px 0 " + t.cobaltMark : "none",
                }}>
                  <div style={{
                    fontFamily: F.mono("en"), fontSize: 10.5,
                    color: isToday ? t.cobaltMark : t.sub,
                    fontWeight: isToday ? 700 : 400,
                  }}>{d}</div>
                  <div style={{
                    marginTop: 6, minHeight: lang === "hi" ? 22 : 18,
                    fontFamily: F.text(lang),
                    fontWeight: c.pre ? 500 : 700, fontSize: 12.5,
                    lineHeight: lang === "hi" ? 1.6 : 1.4,
                    color: c.m ? (c.pre ? t.sub : markColor[c.m]) : "transparent",
                  }}>{c.m ? L.marks[c.m] : "·"}</div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", marginTop: 14, gap: 24, flexWrap: "wrap" }}>
            {["P", "Lv", "Lt", "Su", "H"].map(function (k) {
              return (
                <span key={k} style={{ display: "inline-flex", alignItems: "baseline", gap: 7 }}>
                  <span style={{
                    fontFamily: F.text(lang), fontWeight: 700, fontSize: 12,
                    color: markColor[k], lineHeight: lang === "hi" ? 1.6 : 1.4,
                  }}>{L.marks[k]}</span>
                  <span style={{
                    fontFamily: F.text(lang), fontSize: 12, color: t.sub,
                    lineHeight: lang === "hi" ? 1.6 : 1.4,
                  }}>{L.legend[k]}</span>
                </span>
              );
            })}
            <span style={{
              marginLeft: "auto", fontFamily: F.mono(lang), fontSize: 11.5, color: t.sub,
              lineHeight: lang === "hi" ? 1.7 : 1.4,
            }}>
              {L.totals}
            </span>
          </div>
        </div>

        {/* ------------- 02 / 03 / 04 · three numbered columns ------------- */}
        <div style={{ padding: "52px 72px 0" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.15fr 1fr" }}>

            {/* 02 · leave balances */}
            <div style={{ paddingRight: 44 }}>
              <SectionHead num="02" title={L.s2} sub={L.s2sub} t={t} lang={lang} />
              {LEAVES.map(function (lv, i) {
                return (
                  <div key={i} style={{
                    padding: "15px 0 17px",
                    borderBottom: i < LEAVES.length - 1 ? "1px solid " + t.hair : "none",
                  }}>
                    <div style={{ display: "flex", alignItems: "baseline" }}>
                      <span style={{
                        fontFamily: F.text(lang), fontSize: 15, fontWeight: 600,
                        color: t.ink, lineHeight: bodyLH,
                      }}>{L.leaveLabels[i]}</span>
                      <span style={{
                        marginLeft: "auto", fontFamily: F.mono("en"), fontSize: 22,
                        fontWeight: 600, color: t.ink, fontVariantNumeric: "tabular-nums",
                      }}>
                        {String(lv.left)}
                        <span style={{ fontSize: 12, fontWeight: 500, color: t.sub }}> / {lv.total}</span>
                      </span>
                    </div>
                    <div style={{ marginTop: 10, height: 4, background: t.hair, position: "relative" }}>
                      <div style={{
                        position: "absolute", top: 0, bottom: 0, left: 0,
                        width: (lv.left / lv.total) * 100 + "%", background: t.cobaltMark,
                      }} />
                    </div>
                    <div style={{
                      marginTop: 8, fontFamily: F.mono(lang), fontSize: 11, color: t.sub,
                      lineHeight: lang === "hi" ? 1.7 : 1.4,
                    }}>{L.leaveSubs[i]}</div>
                  </div>
                );
              })}
            </div>

            {/* 03 · latest payslip */}
            <div style={{ borderLeft: "1px solid " + t.hair, padding: "0 44px" }}>
              <SectionHead num="03" title={L.s3} sub={L.s3sub} t={t} lang={lang} />
              <div style={{
                fontFamily: F.mono(lang), fontSize: 11, color: t.sub,
                lineHeight: lang === "hi" ? 1.7 : 1.4,
              }}>{L.credited}</div>
              <div style={{ display: "flex", alignItems: "baseline", marginTop: 14 }}>
                <span style={Object.assign(
                  { fontFamily: F.text(lang), fontWeight: 700, fontSize: 12.5,
                    color: t.ink, lineHeight: lang === "hi" ? 1.6 : 1.3 },
                  caps(lang, 1.6)
                )}>{L.net}</span>
                <span style={{
                  marginLeft: "auto", fontFamily: F.mono("en"), fontSize: 34, fontWeight: 700,
                  color: t.ink, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap",
                }}>{inr(PAY.net)}</span>
              </div>
              <div style={{ marginTop: 16, borderTop: "2px solid " + t.ink, paddingTop: 10 }}>
                {payRow(L.payRows[0], inr(PAY.basic))}
                {payRow(L.payRows[1], inr(PAY.hra))}
                {payRow(L.payRows[2], inr(PAY.other))}
                {payRow(L.earn, inr(PAY.gross), true)}
              </div>
              <div style={{ marginTop: 8, borderTop: "1px solid " + t.hair, paddingTop: 8 }}>
                {payRow(L.dedRows[0], inr(-PAY.pf))}
                {payRow(L.dedRows[1], inr(-PAY.tds))}
                {payRow(L.dedRows[2], inr(-PAY.pt))}
                {payRow(L.ded, inr(-PAY.ded), true)}
              </div>
              <button className="hee-f" data-he="view-slip" onClick={function () {}}
                style={{
                  appearance: "none", background: "none", border: "none", cursor: "pointer",
                  padding: 0, marginTop: 16, fontFamily: F.text(lang), fontSize: 13.5,
                  fontWeight: 600, color: t.ink, textDecoration: "underline",
                  textUnderlineOffset: 3, lineHeight: bodyLH,
                }}>
                {L.viewSlip}
              </button>
            </div>

            {/* 04 · upcoming holidays */}
            <div style={{ borderLeft: "1px solid " + t.hair, paddingLeft: 44 }}>
              <SectionHead num="04" title={L.s4} sub={L.s4sub} t={t} lang={lang} />
              {L.hols.map(function (h, i) {
                return (
                  <div key={i} style={{
                    display: "flex", alignItems: "baseline", gap: 16, padding: "14px 0",
                    borderBottom: i < L.hols.length - 1 ? "1px solid " + t.hair : "none",
                  }}>
                    <span style={{
                      fontFamily: F.mono(lang), fontSize: 11, color: t.sub,
                      minWidth: lang === "hi" ? 108 : 92, whiteSpace: "nowrap",
                      lineHeight: lang === "hi" ? 1.7 : 1.4,
                    }}>{h.d}</span>
                    <span style={{
                      fontFamily: F.text(lang), fontSize: 16, fontWeight: 600,
                      color: t.ink, lineHeight: bodyLH,
                    }}>{h.n}</span>
                    <span style={{
                      marginLeft: "auto", fontFamily: F.mono(lang), fontSize: 11,
                      color: t.sub, whiteSpace: "nowrap",
                      lineHeight: lang === "hi" ? 1.7 : 1.4,
                    }}>{h.w}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ----------------------------- folio ----------------------------- */}
        <div style={{ margin: "60px 72px 0", borderTop: "3px solid " + t.ink }} />
        <div style={{ margin: "3px 72px 0", borderTop: "1px solid " + t.ink }} />
        <div style={{ display: "flex", alignItems: "baseline", padding: "16px 72px 44px" }}>
          <span style={{ fontFamily: F.text(lang), fontSize: 12.5, color: t.sub, lineHeight: bodyLH }}>
            {L.footerL}
          </span>
          <span style={{
            marginLeft: "auto", fontFamily: F.mono(lang), fontSize: 11, color: t.sub,
            lineHeight: lang === "hi" ? 1.7 : 1.4,
          }}>
            {L.footerR}
          </span>
        </div>
      </div>
    );
  }

  window.HomeExplore = window.HomeExplore || {};
  window.HomeExplore.E = HomeE;
})();
