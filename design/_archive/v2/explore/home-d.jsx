/* @jsxRuntime classic */
/* ============================================================
   NAVEYA — FREE EXPLORATION D · "Warm, friendly, human product"
   Visual system: "Staffroom Terracotta"
   - Warm cream canvas, cocoa rail, clay + sage + honey accents
   - Fraunces (display, EN) · Plus Jakarta Sans (UI) · Mukta (हिंदी)
   - Spline Sans Mono for every figure (tabular, exact, Indian grouping)
   - Soft 16–20px radii, gentle warm shadows, flat inline illustration
   Self-contained IIFE. No imports. Inline styles only.
   ============================================================ */
(function () {
  var useState = React.useState;

  /* ---------- palettes (light + dark, both intentional) ---------- */
  var PALETTES = {
    light: {
      canvas: "#FAF3EA",
      card: "#FFFFFF",
      cardWarm: "#FFF9F1",
      border: "#EBDCCB",
      borderSoft: "#F3E9DB",
      ink: "#3A2A21",
      soft: "#77614F",
      faint: "#A08A75",
      clay: "#C14D29",
      clayDeep: "#A03D1D",
      clayTint: "#F9E7DC",
      onClay: "#FFFFFF",
      sage: "#2F6B42",
      sageTint: "#E2EFE3",
      honey: "#7E5306",
      honeyTint: "#FBEED2",
      honeyBorder: "#EAD49F",
      railBg: "#3E2A1F",
      railInk: "#F6E9DC",
      railMuted: "#C2A48C",
      railLine: "rgba(246,233,220,.14)",
      shadow: "0 1px 2px rgba(83,49,29,.05), 0 10px 28px rgba(83,49,29,.08)",
      focus: "#B34718",
      track: "#F1E3D1",
      illoWall: "#F6DDC4",
      illoSun: "#EBB550"
    },
    dark: {
      canvas: "#201612",
      card: "#2B1F18",
      cardWarm: "#31231A",
      border: "#463428",
      borderSoft: "#3B2C21",
      ink: "#F5E9DC",
      soft: "#C9B19C",
      faint: "#9B8470",
      clay: "#E68153",
      clayDeep: "#F0946A",
      clayTint: "rgba(230,129,83,.16)",
      onClay: "#2B1207",
      sage: "#9CCFA6",
      sageTint: "rgba(122,192,138,.16)",
      honey: "#E9BE68",
      honeyTint: "rgba(233,190,104,.13)",
      honeyBorder: "rgba(233,190,104,.35)",
      railBg: "#170F0A",
      railInk: "#F1E4D6",
      railMuted: "#A78D75",
      railLine: "rgba(241,228,214,.10)",
      shadow: "0 1px 2px rgba(0,0,0,.35), 0 12px 32px rgba(0,0,0,.38)",
      focus: "#F0946A",
      track: "#3D2D21",
      illoWall: "#4A3527",
      illoSun: "#D9A845"
    }
  };

  /* ---------- typography ---------- */
  function sansFor(lang) {
    return lang === "hi"
      ? "'Mukta','Wix Madefor Text',sans-serif"
      : "'Wix Madefor Text','Mukta',sans-serif";
  }
  /* Young Serif ships a single chunky 400 — warm without synthetic bold */
  function displayFor(lang) {
    return lang === "hi" ? "'Mukta',sans-serif" : "'Young Serif','Mukta',serif";
  }
  function displayWeight(lang) {
    return lang === "hi" ? 700 : 400;
  }
  var MONO = "'Spline Sans Mono','Mukta',monospace";

  /* ---------- money: Indian lakh–crore grouping, always exact ---------- */
  function inr(n) {
    var neg = n < 0;
    var parts = Math.abs(n).toFixed(2).split(".");
    var i = parts[0];
    var f = parts[1];
    var g;
    if (i.length > 3) {
      var last3 = i.slice(-3);
      var rest = i.slice(0, -3);
      var chunks = [];
      while (rest.length > 2) {
        chunks.unshift(rest.slice(-2));
        rest = rest.slice(0, -2);
      }
      if (rest.length) chunks.unshift(rest);
      g = chunks.join(",") + "," + last3;
    } else {
      g = i;
    }
    return (neg ? "−" : "") + "₹" + g + "." + f;
  }

  /* Money: ₹ sign in the UI face, digits in mono so columns align */
  function Money(props) {
    var c = props.c;
    var s = inr(props.value); // e.g. "₹94,800.00" or "−₹5,688.00"
    var idx = s.indexOf("₹");
    var sign = s.slice(0, idx + 1);
    var digits = s.slice(idx + 1);
    return (
      <span
        style={{
          fontFamily: MONO,
          fontVariantNumeric: "tabular-nums",
          fontSize: props.size || 15,
          fontWeight: props.weight || 500,
          color: props.color || c.ink,
          letterSpacing: "-0.01em",
          whiteSpace: "nowrap"
        }}
      >
        <span style={{ fontFamily: sansFor("en"), fontWeight: 600, marginRight: 1 }}>{sign}</span>
        {digits}
      </span>
    );
  }

  /* ---------- i18n — the whole screen renders in ONE language ---------- */
  var L = {
    en: {
      crumb: "Employee home",
      nav_home: "Home",
      nav_att: "Attendance",
      nav_leave: "Leave",
      nav_pay: "Payslips",
      nav_docs: "Documents",
      nav_hol: "Holiday calendar",
      nav_help: "Help & support",
      nav_out: "Sign out",
      greeting: "Good afternoon, Ananya",
      gsub: "Tuesday, 11 August 2026 · Sunrise Public School, Indiranagar Campus",
      role: "PGT · Physics",
      empid: "NAV-0142",
      today_title: "Today at school",
      ontime: "On time",
      in_label: "Clocked in",
      in_src: "Face scan · Gate 2 device",
      out_label: "Expected out",
      now_label: "Now",
      eff_label: "Effective so far",
      eff_val: "6h 08m",
      today_note: "All good — today’s attendance is already marked for you.",
      month_title: "August attendance",
      lg_p: "Present",
      lg_l: "Leave",
      lg_h: "Holiday",
      lg_w: "Week off",
      lg_t: "Today",
      sum_line: "So far: 7 present · 1 leave · 2 week offs",
      day_heads: ["S", "M", "T", "W", "T", "F", "S"],
      leave_title: "Leave you can take",
      leave_sub: "Available now, of this year’s quota",
      lv_cl: "Casual leave",
      lv_el: "Earned leave",
      lv_ml: "Medical leave",
      left_of: "left of",
      apply: "Apply for leave",
      pay_title: "July payslip",
      credited: "Credited 31 Jul · HDFC ••4321",
      net_label: "Take-home pay",
      more_than: "₹1,250.00 more than June",
      row_gross: "Gross earnings",
      row_pf: "Provident fund",
      row_pt: "Professional tax",
      row_tds: "Income tax (TDS)",
      ytd: "Paid to you this year so far",
      download: "Download payslip",
      doc_title: "A request needs you",
      doc_status: "Awaiting your response",
      doc_body:
        "Meera from HR needs a fresh copy of your PAN card for this year’s tax filing. It takes about two minutes.",
      doc_by: "Respond by Wed, 20 August",
      doc_from: "Requested by Meera Iyer (HR) · 8 Aug",
      doc_cta: "Upload response",
      doc_view: "View details",
      hol_title: "Upcoming holidays",
      hol_note: "School stays closed on these days.",
      in_days_4: "in 4 days",
      in_days_17: "in 17 days",
      in_days_24: "in 24 days",
      hol_1: "Independence Day",
      hol_1d: "Sat, 15 August",
      hol_2: "Raksha Bandhan",
      hol_2d: "Fri, 28 August",
      hol_3: "Janmashtami",
      hol_3d: "Fri, 4 September",
      hol_more: "View the full calendar",
      help_title: "Stuck on something?",
      help_body: "Write to the school HR desk — they usually reply within a day.",
      help_mail: "hr@sunrisepublic.edu.in",
      theme_light: "Light",
      theme_dark: "Dark",
      aria_lang: "Choose language",
      aria_theme: "Switch colour theme",
      aria_avatar: "Your profile"
    },
    hi: {
      crumb: "कर्मचारी होम",
      nav_home: "होम",
      nav_att: "उपस्थिति",
      nav_leave: "छुट्टियाँ",
      nav_pay: "वेतन पर्चियाँ",
      nav_docs: "दस्तावेज़",
      nav_hol: "अवकाश कैलेंडर",
      nav_help: "सहायता",
      nav_out: "साइन आउट",
      greeting: "नमस्ते, अनन्या जी",
      gsub:
        "मंगलवार, 11 अगस्त 2026 · सनराइज़ पब्लिक स्कूल, इंदिरानगर परिसर",
      role: "पीजीटी · भौतिक विज्ञान",
      empid: "NAV-0142",
      today_title: "आज विद्यालय में",
      ontime: "समय पर",
      in_label: "आगमन",
      in_src: "फ़ेस स्कैन · गेट 2 डिवाइस",
      out_label: "अपेक्षित प्रस्थान",
      now_label: "अभी",
      eff_label: "अब तक प्रभावी समय",
      eff_val: "6 घं 08 मि",
      today_note:
        "सब ठीक है — आज की आपकी उपस्थिति दर्ज हो चुकी है।",
      month_title: "अगस्त की उपस्थिति",
      lg_p: "उपस्थित",
      lg_l: "छुट्टी",
      lg_h: "अवकाश",
      lg_w: "साप्ताहिक अवकाश",
      lg_t: "आज",
      sum_line:
        "अब तक: 7 उपस्थित · 1 छुट्टी · 2 साप्ताहिक",
      day_heads: ["र", "सो", "मं", "बु", "गु", "शु", "श"],
      leave_title: "उपलब्ध छुट्टियाँ",
      leave_sub: "इस वर्ष के कोटे में से अभी उपलब्ध",
      lv_cl: "आकस्मिक अवकाश",
      lv_el: "अर्जित अवकाश",
      lv_ml: "चिकित्सा अवकाश",
      left_of: "शेष, कुल",
      apply: "छुट्टी के लिए आवेदन करें",
      pay_title: "जुलाई वेतन पर्ची",
      credited: "31 जुलाई को जमा · HDFC ••4321",
      net_label: "शुद्ध वेतन (टेक-होम)",
      more_than: "जून से ₹1,250.00 अधिक",
      row_gross: "सकल आय",
      row_pf: "भविष्य निधि",
      row_pt: "वृत्ति कर",
      row_tds: "आयकर (टीडीएस)",
      ytd: "इस वर्ष अब तक आपको भुगतान",
      download: "वेतन पर्ची डाउनलोड करें",
      doc_title: "एक अनुरोध आपकी प्रतीक्षा में है",
      doc_status: "आपके उत्तर की प्रतीक्षा",
      doc_body:
        "एचआर से मीरा को इस वर्ष की कर फ़ाइलिंग के लिए आपके पैन कार्ड की नई प्रति चाहिए। इसमें लगभग दो मिनट लगेंगे।",
      doc_by: "बुध, 20 अगस्त तक उत्तर दें",
      doc_from: "मीरा अय्यर (एचआर) द्वारा अनुरोध · 8 अगस्त",
      doc_cta: "उत्तर अपलोड करें",
      doc_view: "विवरण देखें",
      hol_title: "आगामी अवकाश",
      hol_note: "इन दिनों विद्यालय बंद रहेगा।",
      in_days_4: "4 दिन में",
      in_days_17: "17 दिन में",
      in_days_24: "24 दिन में",
      hol_1: "स्वतंत्रता दिवस",
      hol_1d: "शनि, 15 अगस्त",
      hol_2: "रक्षाबंधन",
      hol_2d: "शुक्र, 28 अगस्त",
      hol_3: "जन्माष्टमी",
      hol_3d: "शुक्र, 4 सितंबर",
      hol_more: "पूरा कैलेंडर देखें",
      help_title: "कहीं अटक गए हैं?",
      help_body:
        "स्कूल एचआर डेस्क को लिखें — आमतौर पर एक दिन में उत्तर मिल जाता है।",
      help_mail: "hr@sunrisepublic.edu.in",
      theme_light: "लाइट",
      theme_dark: "डार्क",
      aria_lang: "भाषा चुनें",
      aria_theme: "थीम बदलें",
      aria_avatar: "आपकी प्रोफ़ाइल"
    }
  };

  /* ---------- tiny icon set (stroke, round caps — friendly) ---------- */
  function svgBase(size, children, extra) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        style={extra || null}
      >
        {children}
      </svg>
    );
  }
  function stroke(c) {
    return { stroke: c, strokeWidth: 1.9, strokeLinecap: "round", strokeLinejoin: "round", fill: "none" };
  }
  var Icons = {
    home: function (c, s) {
      return svgBase(s, <path d="M4 11.5 12 4.5l8 7V20a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1v-8.5Z" {...stroke(c)} />);
    },
    cal: function (c, s) {
      return svgBase(s, [
        <rect key="a" x="4" y="5.5" width="16" height="15" rx="2.5" {...stroke(c)} />,
        <path key="b" d="M4 10h16M8.5 3.5v3.5M15.5 3.5v3.5" {...stroke(c)} />,
        <path key="c" d="m9.2 15 2 2 3.6-3.8" {...stroke(c)} />
      ]);
    },
    leaf: function (c, s) {
      return svgBase(s, [
        <path key="a" d="M6 18C6 10 11 5.5 19 5c.4 8-4 13-11 13" {...stroke(c)} />,
        <path key="b" d="M6 18c2.5-4.5 6-8 9.5-9.5" {...stroke(c)} />
      ]);
    },
    note: function (c, s) {
      return svgBase(s, [
        <rect key="a" x="3.5" y="6" width="17" height="12.5" rx="2.5" {...stroke(c)} />,
        <circle key="b" cx="12" cy="12.2" r="2.6" {...stroke(c)} />,
        <path key="c" d="M6.5 9.2v.01M17.5 15.2v.01" {...stroke(c)} />
      ]);
    },
    file: function (c, s) {
      return svgBase(s, [
        <path key="a" d="M7 3.5h6.5L18.5 8.5V19a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 19V5A1.5 1.5 0 0 1 7 3.5Z" {...stroke(c)} />,
        <path key="b" d="M13.5 3.5v5h5M9 13h6M9 16.2h4" {...stroke(c)} />
      ]);
    },
    fest: function (c, s) {
      return svgBase(s, [
        <path key="a" d="M12 3.5v2M5.6 6.6l1.4 1.4M18.4 6.6 17 8" {...stroke(c)} />,
        <path key="b" d="M6 20.5c0-4.5 2.6-7.5 6-7.5s6 3 6 7.5" {...stroke(c)} />,
        <path key="c" d="M3.5 20.5h17" {...stroke(c)} />
      ]);
    },
    help: function (c, s) {
      return svgBase(s, [
        <circle key="a" cx="12" cy="12" r="8.5" {...stroke(c)} />,
        <path key="b" d="M9.6 9.5A2.4 2.4 0 0 1 14.4 10c0 1.6-2.4 1.9-2.4 3.4M12 16.6v.01" {...stroke(c)} />
      ]);
    },
    out: function (c, s) {
      return svgBase(s, [
        <path key="a" d="M14 4.5H7A1.5 1.5 0 0 0 5.5 6v12A1.5 1.5 0 0 0 7 19.5h7" {...stroke(c)} />,
        <path key="b" d="M10.5 12h9m0 0-3.2-3.2M19.5 12l-3.2 3.2" {...stroke(c)} />
      ]);
    },
    sun: function (c, s) {
      return svgBase(s, [
        <circle key="a" cx="12" cy="12" r="4" {...stroke(c)} />,
        <path key="b" d="M12 3v2M12 19v2M3 12h2M19 12h2M5.4 5.4l1.4 1.4M17.2 17.2l1.4 1.4M18.6 5.4l-1.4 1.4M6.8 17.2l-1.4 1.4" {...stroke(c)} />
      ]);
    },
    moon: function (c, s) {
      return svgBase(s, <path d="M20 13.6A8.2 8.2 0 0 1 10.4 4 8.4 8.4 0 1 0 20 13.6Z" {...stroke(c)} />);
    },
    check: function (c, s) {
      return svgBase(s, <path d="m5 12.5 4.5 4.5L19 7.5" {...stroke(c)} />);
    },
    clock: function (c, s) {
      return svgBase(s, [
        <circle key="a" cx="12" cy="12" r="8.5" {...stroke(c)} />,
        <path key="b" d="M12 7.5V12l3 2" {...stroke(c)} />
      ]);
    },
    scan: function (c, s) {
      return svgBase(s, [
        <path key="a" d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16" {...stroke(c)} />,
        <circle key="b" cx="12" cy="10.5" r="2.4" {...stroke(c)} />,
        <path key="c" d="M8 16.8c.9-1.6 2.3-2.5 4-2.5s3.1.9 4 2.5" {...stroke(c)} />
      ]);
    },
    up: function (c, s) {
      return svgBase(s, <path d="M12 19V5m0 0-5 5m5-5 5 5" {...stroke(c)} />);
    },
    mail: function (c, s) {
      return svgBase(s, [
        <rect key="a" x="3.5" y="5.5" width="17" height="13" rx="2.5" {...stroke(c)} />,
        <path key="b" d="m4.5 7.5 7.5 5.5 7.5-5.5" {...stroke(c)} />
      ]);
    },
    arrow: function (c, s) {
      return svgBase(s, <path d="M5 12h14m0 0-4.5-4.5M19 12l-4.5 4.5" {...stroke(c)} />);
    }
  };

  /* ---------- illustrations (authored inline, flat + warm) ---------- */
  function HeroIllo(props) {
    var c = props.c;
    return (
      <svg width="330" height="132" viewBox="0 0 330 132" fill="none" aria-hidden="true" style={{ display: "block" }}>
        {/* sun */}
        <circle cx="258" cy="38" r="20" fill={c.illoSun} />
        <circle cx="258" cy="38" r="27" fill={c.illoSun} opacity=".18" />
        {/* soft hills */}
        <ellipse cx="70" cy="150" rx="130" ry="52" fill={c.sageTint} />
        <ellipse cx="285" cy="158" rx="150" ry="58" fill={c.clayTint} />
        {/* schoolhouse */}
        <g>
          <rect x="150" y="66" width="76" height="48" rx="5" fill={c.illoWall} />
          <path d="M144 68 188 40l44 28Z" fill={c.clay} />
          <rect x="180" y="86" width="16" height="28" rx="3" fill={c.clayDeep} />
          <rect x="158" y="78" width="13" height="12" rx="2.5" fill={c.illoSun} opacity=".8" />
          <rect x="205" y="78" width="13" height="12" rx="2.5" fill={c.illoSun} opacity=".8" />
          <circle cx="188" cy="60" r="6" fill={c.canvas} />
          <path d="M188 57v3l2 1.5" stroke={c.ink} strokeWidth="1.3" strokeLinecap="round" fill="none" />
        </g>
        {/* tree */}
        <g>
          <rect x="106" y="88" width="7" height="26" rx="3" fill={c.railBg} opacity=".75" />
          <circle cx="109" cy="74" r="20" fill={c.sage} opacity=".85" />
          <circle cx="95" cy="84" r="12" fill={c.sage} opacity=".6" />
        </g>
        {/* birds */}
        <path d="M60 40c3-3 6-3 9 0M76 32c3-3 6-3 9 0" stroke={c.faint} strokeWidth="1.6" strokeLinecap="round" fill="none" />
      </svg>
    );
  }

  function DocIllo(props) {
    var c = props.c;
    return (
      <svg width="76" height="64" viewBox="0 0 76 64" fill="none" aria-hidden="true" style={{ display: "block" }}>
        <rect x="8" y="20" width="60" height="38" rx="7" fill={c.honeyTint} stroke={c.honeyBorder} strokeWidth="1.5" />
        <rect x="20" y="6" width="36" height="34" rx="4" fill={c.card} stroke={c.border} strokeWidth="1.5" />
        <path d="M26 15h24M26 21h24M26 27h16" stroke={c.faint} strokeWidth="2" strokeLinecap="round" />
        <path d="M8 27l30 18 30-18" stroke={c.honeyBorder} strokeWidth="1.5" fill="none" />
        <circle cx="62" cy="14" r="9" fill={c.clay} />
        <path d="M62 10.5v7M58.5 14h7" stroke={c.onClay} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }

  /* ---------- shared bits ---------- */
  function Chip(props) {
    var c = props.c;
    var tones = {
      sage: { bg: c.sageTint, fg: c.sage, bd: "transparent" },
      clay: { bg: c.clayTint, fg: c.clayDeep, bd: "transparent" },
      honey: { bg: c.honeyTint, fg: c.honey, bd: c.honeyBorder },
      plain: { bg: c.borderSoft, fg: c.soft, bd: "transparent" }
    };
    var t = tones[props.tone || "plain"];
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: t.bg,
          color: t.fg,
          border: "1px solid " + t.bd,
          borderRadius: 999,
          padding: props.pad || "5px 12px",
          fontSize: props.size || 12.5,
          fontWeight: 600,
          lineHeight: props.lh || 1.35,
          whiteSpace: "nowrap"
        }}
      >
        {props.icon ? Icons[props.icon](t.fg, 14) : null}
        {props.children}
      </span>
    );
  }

  function Card(props) {
    var c = props.c;
    return (
      <section
        style={Object.assign(
          {
            background: props.warm ? c.cardWarm : c.card,
            border: "1px solid " + (props.borderColor || c.border),
            borderRadius: 20,
            boxShadow: c.shadow,
            padding: props.pad == null ? 22 : props.pad,
            overflow: "hidden",
            position: "relative"
          },
          props.style || {}
        )}
      >
        {props.children}
      </section>
    );
  }

  function CardTitle(props) {
    var c = props.c;
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: props.mb == null ? 16 : props.mb }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {props.icon ? (
            <span
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: props.iconBg || c.clayTint,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flex: "0 0 auto"
              }}
            >
              {Icons[props.icon](props.iconColor || c.clayDeep, 17)}
            </span>
          ) : null}
          <h2
            style={{
              margin: 0,
              fontFamily: props.display,
              fontSize: props.size || 18,
              fontWeight: props.display.indexOf("Young Serif") >= 0 ? 400 : 700,
              color: c.ink,
              lineHeight: props.lhead,
              letterSpacing: props.display.indexOf("Young Serif") >= 0 ? "0" : "-0.01em"
            }}
          >
            {props.children}
          </h2>
        </div>
        {props.right || null}
      </div>
    );
  }

  /* ---------- the screen ---------- */
  function HomeD(props) {
    var st1 = useState(props && props.initialMode ? props.initialMode : "light");
    var mode = st1[0], setMode = st1[1];
    var st2 = useState(props && props.initialLang ? props.initialLang : "en");
    var lang = st2[0], setLang = st2[1];

    var c = PALETTES[mode];
    var t = function (k) { return L[lang][k]; };
    var SANS = sansFor(lang);
    var DISPLAY = displayFor(lang);
    var DWT = displayWeight(lang);
    /* Devanagari needs ~25% taller line-heights — budgeted here */
    var lhBody = lang === "hi" ? 1.75 : 1.5;
    var lhHead = lang === "hi" ? 1.45 : 1.18;
    var lhSmall = lang === "hi" ? 1.65 : 1.45;

    var btnBase = {
      fontFamily: SANS,
      border: "none",
      background: "transparent",
      padding: 0,
      margin: 0,
      color: "inherit",
      fontSize: 14,
      lineHeight: lhSmall,
      cursor: "pointer"
    };

    /* --- data (realistic, mock) --- */
    var marks = { 1: "P", 2: "W", 3: "P", 4: "P", 5: "L", 6: "P", 7: "P", 8: "P", 9: "W", 10: "P" };
    var planned = { 15: "H", 16: "W", 23: "W", 30: "W" };
    var TODAY = 11;
    var DAYS = 31;
    var FIRST_DOW = 6; /* 1 Aug 2026 = Saturday */

    var leaves = [
      { key: "lv_cl", have: 8, of: 12, haveStr: "8" },
      { key: "lv_el", have: 14.5, of: 20, haveStr: "14.5" },
      { key: "lv_ml", have: 6, of: 10, haveStr: "6" }
    ];

    var payRows = [
      { key: "row_gross", v: 94800 },
      { key: "row_pf", v: -5688 },
      { key: "row_pt", v: -200 },
      { key: "row_tds", v: -10480 }
    ];
    var NET = 78432;
    var YTD = 861204;

    var holidays = [
      { name: "hol_1", date: "hol_1d", days: "in_days_4", d: "15", m: lang === "hi" ? "अग" : "Aug" },
      { name: "hol_2", date: "hol_2d", days: "in_days_17", d: "28", m: lang === "hi" ? "अग" : "Aug" },
      { name: "hol_3", date: "hol_3d", days: "in_days_24", d: "04", m: lang === "hi" ? "सित" : "Sep" }
    ];

    var navItems = [
      { icon: "home", key: "nav_home", active: true },
      { icon: "cal", key: "nav_att" },
      { icon: "leaf", key: "nav_leave" },
      { icon: "note", key: "nav_pay" },
      { icon: "file", key: "nav_docs" },
      { icon: "fest", key: "nav_hol" }
    ];

    /* mark cell tones — colour ALWAYS paired with a letter */
    function markTone(m) {
      if (m === "P") return { bg: c.sageTint, fg: c.sage };
      if (m === "L") return { bg: c.clayTint, fg: c.clayDeep };
      if (m === "H") return { bg: c.honeyTint, fg: c.honey };
      if (m === "W") return { bg: c.borderSoft, fg: c.faint };
      return { bg: "transparent", fg: c.faint };
    }

    /* --- calendar cells --- */
    var cells = [];
    var i;
    for (i = 0; i < FIRST_DOW; i++) cells.push(null);
    for (i = 1; i <= DAYS; i++) cells.push(i);

    function dayCell(d, idx) {
      if (d === null) return <div key={"e" + idx} />;
      var m = marks[d] || planned[d] || null;
      var isToday = d === TODAY;
      var isFuture = d > TODAY;
      var tone = m ? markTone(m) : null;
      return (
        <div
          key={"d" + d}
          style={{
            borderRadius: 12,
            padding: "7px 4px 6px",
            textAlign: "center",
            background: m ? tone.bg : "transparent",
            opacity: isFuture && m ? 0.55 : 1,
            border: isToday ? "2px solid " + c.clay : "2px solid transparent",
            minHeight: lang === "hi" ? 52 : 48
          }}
        >
          <div style={{ fontFamily: MONO, fontSize: 13, fontWeight: isToday ? 700 : 500, color: isFuture && !m ? c.faint : c.ink, lineHeight: 1.3 }}>
            {d < 10 ? "0" + d : "" + d}
          </div>
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".06em", color: isToday ? c.clayDeep : m ? tone.fg : "transparent", lineHeight: 1.4 }}>
            {isToday ? "•" : m || " "}
          </div>
        </div>
      );
    }

    /* ============================ render ============================ */
    return (
      <div
        className="hd-root"
        style={{
          display: "flex",
          minHeight: "100vh",
          background: c.canvas,
          color: c.ink,
          fontFamily: SANS,
          fontSize: 14.5,
          lineHeight: lhBody,
          transition: "background .25s ease, color .25s ease"
        }}
      >
        <style>{
          ".hd-root :focus-visible { outline: 3px solid " + c.focus + "; outline-offset: 2px; border-radius: 10px; }\n" +
          ".hd-root ::selection { background: " + c.clayTint + "; }"
        }</style>

        {/* ---------------- rail ---------------- */}
        <nav
          aria-label="Naveya"
          style={{
            width: 248,
            flex: "0 0 248px",
            background: c.railBg,
            color: c.railInk,
            display: "flex",
            flexDirection: "column",
            padding: "26px 16px 20px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 10px", marginBottom: 30 }}>
            <span
              aria-hidden="true"
              style={{
                width: 34,
                height: 34,
                borderRadius: 11,
                background: c.clay,
                color: c.onClay,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Young Serif',serif",
                fontWeight: 400,
                fontSize: 18
              }}
            >
              n
            </span>
            <span style={{ fontFamily: "'Young Serif',serif", fontSize: 21, fontWeight: 400, letterSpacing: "0" }}>
              naveya
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {navItems.map(function (it) {
              return (
                <button
                  key={it.key}
                  type="button"
                  aria-current={it.active ? "page" : undefined}
                  style={Object.assign({}, btnBase, {
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 12px",
                    borderRadius: 12,
                    background: it.active ? c.clay : "transparent",
                    color: it.active ? c.onClay : c.railMuted,
                    fontWeight: it.active ? 700 : 500,
                    fontSize: 14.5,
                    textAlign: "left"
                  })}
                >
                  {Icons[it.icon](it.active ? c.onClay : c.railMuted, 19)}
                  <span>{t(it.key)}</span>
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: "auto", borderTop: "1px solid " + c.railLine, paddingTop: 14, display: "flex", flexDirection: "column", gap: 3 }}>
            <button type="button" style={Object.assign({}, btnBase, { display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 12, color: c.railMuted, fontSize: 14.5 })}>
              {Icons.help(c.railMuted, 19)}
              <span>{t("nav_help")}</span>
            </button>
            <button type="button" style={Object.assign({}, btnBase, { display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 12, color: c.railMuted, fontSize: 14.5 })}>
              {Icons.out(c.railMuted, 19)}
              <span>{t("nav_out")}</span>
            </button>
          </div>
        </nav>

        {/* ---------------- main ---------------- */}
        <main style={{ flex: 1, minWidth: 0, padding: "24px 40px 48px" }}>
          {/* top bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <span style={{ color: c.faint, fontWeight: 600, fontSize: 13.5, letterSpacing: ".02em" }}>{t("crumb")}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {/* language toggle */}
              <div
                role="group"
                aria-label={t("aria_lang")}
                style={{ display: "inline-flex", background: c.card, border: "1px solid " + c.border, borderRadius: 999, padding: 3 }}
              >
                {[
                  { id: "en", label: "EN" },
                  { id: "hi", label: "हिंदी" }
                ].map(function (o) {
                  var on = lang === o.id;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      aria-pressed={on}
                      onClick={function () { setLang(o.id); }}
                      style={Object.assign({}, btnBase, {
                        fontFamily: o.id === "hi" ? "'Mukta',sans-serif" : SANS,
                        padding: "5px 14px",
                        borderRadius: 999,
                        fontSize: 13,
                        fontWeight: 700,
                        background: on ? c.ink : "transparent",
                        color: on ? c.card : c.soft
                      })}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
              {/* theme toggle */}
              <button
                type="button"
                aria-label={t("aria_theme")}
                aria-pressed={mode === "dark"}
                onClick={function () { setMode(mode === "light" ? "dark" : "light"); }}
                style={Object.assign({}, btnBase, {
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: c.card,
                  border: "1px solid " + c.border,
                  borderRadius: 999,
                  padding: "6px 14px",
                  fontSize: 13,
                  fontWeight: 700,
                  color: c.soft
                })}
              >
                {mode === "light" ? Icons.moon(c.soft, 15) : Icons.sun(c.soft, 15)}
                <span>{mode === "light" ? t("theme_dark") : t("theme_light")}</span>
              </button>
              {/* avatar */}
              <button
                type="button"
                aria-label={t("aria_avatar")}
                style={Object.assign({}, btnBase, {
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 9,
                  background: c.card,
                  border: "1px solid " + c.border,
                  borderRadius: 999,
                  padding: "4px 14px 4px 4px"
                })}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 999,
                    background: c.sageTint,
                    color: c.sage,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: 12.5
                  }}
                >
                  AR
                </span>
                <span style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 600, color: c.soft }}>NAV-0142</span>
              </button>
            </div>
          </div>

          {/* greeting hero */}
          <Card c={c} warm={true} pad={0} style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, padding: "26px 8px 22px 30px" }}>
              <div style={{ minWidth: 0 }}>
                <h1
                  style={{
                    margin: 0,
                    fontFamily: DISPLAY,
                    fontSize: lang === "hi" ? 30 : 33,
                    fontWeight: DWT,
                    lineHeight: lhHead,
                    letterSpacing: lang === "hi" ? "0" : "-0.01em"
                  }}
                >
                  {t("greeting")}
                </h1>
                <p style={{ margin: "8px 0 14px", color: c.soft, fontSize: 15, lineHeight: lhBody }}>{t("gsub")}</p>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Chip c={c} tone="clay" lh={lhSmall}>{t("role")}</Chip>
                  <Chip c={c} tone="plain" lh={lhSmall}>
                    <span style={{ fontFamily: MONO, fontWeight: 600 }}>{t("empid")}</span>
                  </Chip>
                </div>
              </div>
              <div style={{ flex: "0 0 auto", alignSelf: "flex-end" }}>
                <HeroIllo c={c} />
              </div>
            </div>
          </Card>

          {/* three independent columns (flex, not grid — no row-sync gaps) */}
          <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
            {/* ------- column A ------- */}
            <div style={{ flex: "1.32 1 0", minWidth: 0, display: "flex", flexDirection: "column", gap: 24 }}>
              {/* today */}
              <Card c={c}>
                <CardTitle
                  c={c}
                  display={DISPLAY}
                  lhead={lhHead}
                  icon="clock"
                  right={<Chip c={c} tone="sage" icon="check" lh={lhSmall}>{t("ontime")}</Chip>}
                >
                  {t("today_title")}
                </CardTitle>

                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                  <div>
                    <div style={{ fontFamily: MONO, fontSize: 30, fontWeight: 700, letterSpacing: "-0.01em", lineHeight: 1.15 }}>07:42</div>
                    <div style={{ color: c.soft, fontSize: 13, fontWeight: 600, marginTop: 4, lineHeight: lhSmall }}>{t("in_label")}</div>
                  </div>
                  <div style={{ textAlign: "center", paddingTop: 6 }}>
                    <div style={{ fontFamily: MONO, fontSize: 15, fontWeight: 600, color: c.clayDeep }}>14:20</div>
                    <div style={{ color: c.faint, fontSize: 12, fontWeight: 600, lineHeight: lhSmall }}>{t("now_label")}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: MONO, fontSize: 30, fontWeight: 700, letterSpacing: "-0.01em", lineHeight: 1.15, color: c.faint }}>15:30</div>
                    <div style={{ color: c.soft, fontSize: 13, fontWeight: 600, marginTop: 4, lineHeight: lhSmall }}>{t("out_label")}</div>
                  </div>
                </div>

                {/* day progress */}
                <div style={{ position: "relative", height: 10, borderRadius: 999, background: c.track, margin: "14px 0 18px" }}>
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "85%", borderRadius: 999, background: "linear-gradient(90deg, " + c.sage + ", " + c.clay + ")" }} />
                  <div
                    style={{
                      position: "absolute",
                      left: "85%",
                      top: "50%",
                      transform: "translate(-50%,-50%)",
                      width: 18,
                      height: 18,
                      borderRadius: 999,
                      background: c.card,
                      border: "4px solid " + c.clay,
                      boxShadow: c.shadow
                    }}
                  />
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <Chip c={c} tone="plain" icon="scan" lh={lhSmall}>{t("in_src")}</Chip>
                  <div style={{ fontSize: 13.5, color: c.soft, lineHeight: lhSmall }}>
                    {t("eff_label")}{" "}
                    <span style={{ fontFamily: MONO, fontWeight: 700, color: c.ink, fontSize: 14.5 }}>{t("eff_val")}</span>
                  </div>
                </div>
                <p style={{ margin: "14px 0 0", padding: "10px 14px", borderRadius: 12, background: c.sageTint, color: c.sage, fontSize: 13.5, fontWeight: 600, lineHeight: lhSmall, display: "flex", gap: 8, alignItems: "center" }}>
                  {Icons.check(c.sage, 15)}
                  <span>{t("today_note")}</span>
                </p>
              </Card>

              {/* month attendance */}
              <Card c={c}>
                <CardTitle c={c} display={DISPLAY} lhead={lhHead} icon="cal" right={
                  <span style={{ fontSize: 12.5, color: c.soft, fontWeight: 600, lineHeight: lhSmall }}>{t("sum_line")}</span>
                }>
                  {t("month_title")}
                </CardTitle>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 6 }}>
                  {t("day_heads").map(function (d, di) {
                    return (
                      <div key={"h" + di} style={{ textAlign: "center", fontSize: 11.5, fontWeight: 700, color: c.faint, letterSpacing: ".05em", paddingBottom: 4, lineHeight: lhSmall }}>
                        {d}
                      </div>
                    );
                  })}
                  {cells.map(dayCell)}
                </div>

                {/* legend — words + letters, never colour alone */}
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap", borderTop: "1px solid " + c.borderSoft, paddingTop: 14, marginTop: 8 }}>
                  {[
                    { m: "P", k: "lg_p" },
                    { m: "L", k: "lg_l" },
                    { m: "H", k: "lg_h" },
                    { m: "W", k: "lg_w" }
                  ].map(function (lg) {
                    var tone = markTone(lg.m);
                    return (
                      <span key={lg.m} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: c.soft, fontWeight: 600, lineHeight: lhSmall }}>
                        <span style={{ width: 20, height: 20, borderRadius: 6, background: tone.bg, color: tone.fg, fontSize: 10.5, fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{lg.m}</span>
                        {t(lg.k)}
                      </span>
                    );
                  })}
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: c.soft, fontWeight: 600, lineHeight: lhSmall }}>
                    <span style={{ width: 20, height: 20, borderRadius: 6, border: "2px solid " + c.clay, display: "inline-block" }} />
                    {t("lg_t")}
                  </span>
                </div>
              </Card>
            </div>

            {/* ------- column B ------- */}
            <div style={{ flex: "1.05 1 0", minWidth: 0, display: "flex", flexDirection: "column", gap: 24 }}>
              {/* payslip */}
              <Card c={c}>
                <CardTitle c={c} display={DISPLAY} lhead={lhHead} icon="note" right={
                  <Chip c={c} tone="sage" icon="check" lh={lhSmall}>{t("credited")}</Chip>
                }>
                  {t("pay_title")}
                </CardTitle>

                <div style={{ background: c.cardWarm, border: "1px solid " + c.borderSoft, borderRadius: 16, padding: "16px 18px", marginBottom: 14 }}>
                  <div style={{ fontSize: 13, color: c.soft, fontWeight: 600, marginBottom: 4, lineHeight: lhSmall }}>{t("net_label")}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
                    <Money c={c} value={NET} size={32} weight={700} />
                    <Chip c={c} tone="sage" icon="up" size={12} pad="3px 10px" lh={lhSmall}>{t("more_than")}</Chip>
                  </div>
                </div>

                <div>
                  {payRows.map(function (r, ri) {
                    return (
                      <div key={r.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "9px 2px", borderBottom: ri < payRows.length - 1 ? "1px dashed " + c.borderSoft : "none" }}>
                        <span style={{ fontSize: 13.5, color: c.soft, fontWeight: 500, lineHeight: lhSmall }}>{t(r.key)}</span>
                        <Money c={c} value={r.v} size={14} color={r.v < 0 ? c.clayDeep : c.ink} />
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, borderTop: "1px solid " + c.border, marginTop: 6, paddingTop: 12 }}>
                  <span style={{ fontSize: 13, color: c.faint, fontWeight: 600, lineHeight: lhSmall }}>{t("ytd")}</span>
                  <Money c={c} value={YTD} size={15} weight={700} />
                </div>

                <button
                  type="button"
                  style={Object.assign({}, btnBase, {
                    marginTop: 16,
                    width: "100%",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    background: c.clay,
                    color: c.onClay,
                    borderRadius: 13,
                    padding: "12px 16px",
                    fontSize: 14.5,
                    fontWeight: 700
                  })}
                >
                  {t("download")}
                  {Icons.arrow(c.onClay, 16)}
                </button>
              </Card>

              {/* leave balances */}
              <Card c={c}>
                <CardTitle c={c} display={DISPLAY} lhead={lhHead} icon="leaf" iconBg={c.sageTint} iconColor={c.sage}>
                  {t("leave_title")}
                </CardTitle>
                <p style={{ margin: "-8px 0 16px", color: c.faint, fontSize: 13, fontWeight: 500, lineHeight: lhSmall }}>{t("leave_sub")}</p>

                <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
                  {leaves.map(function (lv) {
                    var pct = Math.round((lv.have / lv.of) * 100);
                    return (
                      <div key={lv.key}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                          <span style={{ fontSize: 13.5, fontWeight: 600, color: c.ink, lineHeight: lhSmall }}>{t(lv.key)}</span>
                          <span style={{ fontFamily: MONO, fontSize: 13.5, color: c.soft }}>
                            <span style={{ fontWeight: 700, color: c.ink, fontSize: 15 }}>{lv.haveStr}</span>
                            {" "}{t("left_of")} {lv.of}
                          </span>
                        </div>
                        <div style={{ height: 8, borderRadius: 999, background: c.track }}>
                          <div style={{ width: pct + "%", height: "100%", borderRadius: 999, background: c.sage }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  style={Object.assign({}, btnBase, {
                    marginTop: 18,
                    width: "100%",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    background: "transparent",
                    color: c.clayDeep,
                    border: "1.5px solid " + c.clay,
                    borderRadius: 13,
                    padding: "10px 16px",
                    fontSize: 14,
                    fontWeight: 700
                  })}
                >
                  {t("apply")}
                </button>
              </Card>
            </div>

            {/* ------- column C ------- */}
            <div style={{ flex: "0.98 1 0", minWidth: 0, display: "flex", flexDirection: "column", gap: 24 }}>
              {/* document request — needs her response */}
              <Card c={c} borderColor={c.honeyBorder} style={{ background: c.honeyTint }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
                  <Chip c={c} tone="honey" icon="clock" lh={lhSmall}>{t("doc_status")}</Chip>
                  <DocIllo c={c} />
                </div>
                <h2 style={{ margin: "0 0 8px", fontFamily: DISPLAY, fontSize: 19, fontWeight: DWT, lineHeight: lhHead }}>{t("doc_title")}</h2>
                <p style={{ margin: "0 0 12px", color: c.soft, fontSize: 13.5, lineHeight: lhBody }}>{t("doc_body")}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 7, color: c.honey, fontSize: 13, fontWeight: 700, marginBottom: 4, lineHeight: lhSmall }}>
                  {Icons.cal(c.honey, 15)}
                  <span>{t("doc_by")}</span>
                </div>
                <div style={{ color: c.faint, fontSize: 12.5, marginBottom: 16, lineHeight: lhSmall }}>{t("doc_from")}</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    style={Object.assign({}, btnBase, {
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      background: c.clay,
                      color: c.onClay,
                      borderRadius: 12,
                      padding: "10px 16px",
                      fontSize: 13.5,
                      fontWeight: 700
                    })}
                  >
                    {t("doc_cta")}
                  </button>
                  <button
                    type="button"
                    style={Object.assign({}, btnBase, {
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      background: c.card,
                      color: c.ink,
                      border: "1px solid " + c.border,
                      borderRadius: 12,
                      padding: "10px 16px",
                      fontSize: 13.5,
                      fontWeight: 700
                    })}
                  >
                    {t("doc_view")}
                  </button>
                </div>
              </Card>

              {/* holidays */}
              <Card c={c}>
                <CardTitle c={c} display={DISPLAY} lhead={lhHead} icon="fest" iconBg={c.honeyTint} iconColor={c.honey}>
                  {t("hol_title")}
                </CardTitle>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {holidays.map(function (h, hi2) {
                    return (
                      <div key={h.name} style={{ display: "flex", alignItems: "center", gap: 14, padding: "11px 0", borderBottom: hi2 < holidays.length - 1 ? "1px dashed " + c.borderSoft : "none" }}>
                        <div style={{ flex: "0 0 auto", width: 46, height: 48, borderRadius: 13, background: c.clayTint, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontFamily: MONO, fontSize: 16, fontWeight: 700, color: c.clayDeep, lineHeight: 1.15 }}>{h.d}</span>
                          <span style={{ fontSize: 10.5, fontWeight: 700, color: c.clayDeep, lineHeight: 1.3 }}>{h.m}</span>
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, lineHeight: lhSmall }}>{t(h.name)}</div>
                          <div style={{ fontSize: 12.5, color: c.faint, lineHeight: lhSmall }}>{t(h.date)}</div>
                        </div>
                        <Chip c={c} tone="plain" size={12} pad="4px 10px" lh={lhSmall}>{t(h.days)}</Chip>
                      </div>
                    );
                  })}
                </div>
                <p style={{ margin: "10px 0 0", fontSize: 12.5, color: c.faint, lineHeight: lhSmall }}>{t("hol_note")}</p>
                <button type="button" style={Object.assign({}, btnBase, { marginTop: 8, color: c.clayDeep, fontSize: 13.5, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 7 })}>
                  {t("hol_more")}
                  {Icons.arrow(c.clayDeep, 15)}
                </button>
              </Card>

              {/* help */}
              <Card c={c} warm={true}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span style={{ width: 34, height: 34, borderRadius: 11, background: c.sageTint, display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}>
                    {Icons.mail(c.sage, 18)}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: DISPLAY, fontSize: 15.5, fontWeight: DWT, lineHeight: lhHead, marginBottom: 4 }}>{t("help_title")}</div>
                    <p style={{ margin: 0, fontSize: 13, color: c.soft, lineHeight: lhBody }}>{t("help_body")}</p>
                    <a
                      href="mailto:hr@sunrisepublic.edu.in"
                      style={{ display: "inline-block", marginTop: 6, fontFamily: MONO, fontSize: 12.5, fontWeight: 600, color: c.clayDeep, textDecoration: "none", borderBottom: "1px solid " + c.clayTint }}
                    >
                      {t("help_mail")}
                    </a>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
    );
  }

  window.HomeExplore = window.HomeExplore || {};
  window.HomeExplore.D = HomeD;
})();
