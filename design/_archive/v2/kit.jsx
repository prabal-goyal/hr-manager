/* ============================================================
   kit.jsx v2 — Naveya shared component kit (window.UI2)
   Direction: "Peacock Ink" register grammar (design/v2/tokens.jsx,
   window.G2 — colour/spacing/radius already updated to the shipped
   design system, design/mockups/Naveya Design System.dc.html).
   Self-contained IIFE, classic-JSX-runtime, no imports/exports,
   inline styles only, colors/spacing/type read from window.G2.
   design/v2/screens.jsx + variants/*.jsx compose ONLY from window.UI2.

   RESET (2026-08-11, coordinator note): the register is the primary
   object, not a card dashboard. Rows are hairlines (not cards, not
   rounded, no shadow inside data); every register closes with a
   double-rule totals footer; state is a mono glyph + word (Mark),
   never a filled pill; radius is 0 everywhere except genuine pill
   controls (lang switch, avatar, theme toggle) and the round brass
   verification Seal. tokens.jsx (G2) was NOT edited in this pass —
   it does not yet carry the Anek/Hanken Grotesk type family, so this
   file defines FONT_SANS/FONT_DEVA/FONT_DISPLAY locally (see below)
   and every direct fontFamily in this file reads those constants
   instead of window.G2's own. G2.sans/G2.deva (Figtree/Mukta)
   are still used internally by G2.t()'s returned fontFamily UNLESS a
   caller in this file routes through the local `typeStyle()` wrapper,
   which overrides the family to the shipped Anek/Hanken pair while
   keeping G2's size/line-height/weight scale.

   API surface kept intentionally stable so design/v2/variants/home-a.jsx
   and design/v2/screens.jsx do not hard-break: components that were
   "wrong-headed" against the register grammar (Card, Chip, StatusPill,
   DayLogRow, Seal, Figure) changed LOOK, not name or prop shape.
   ============================================================ */
(function () {
  const { createContext, useContext, useState, useEffect, useCallback, Fragment } = React;
  const G = window.G2;

  // ---------------------------------------------------------------
  // Color helpers
  // ---------------------------------------------------------------
  function hexToRgb(hex) {
    const h = hex.replace("#", "");
    const full = h.length === 3 ? h.split("").map((ch) => ch + ch).join("") : h;
    const n = parseInt(full, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  function withAlpha(hex, alpha) {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  const TABULAR = { fontFeatureSettings: "'tnum' 1, 'lnum' 1" };

  // ---------------------------------------------------------------
  // Type families for the register grammar. tokens.jsx (G2.sans /
  // G2.deva) still ships Figtree/Mukta and is NOT edited in this
  // pass — every direct fontFamily in THIS file reads these consts
  // instead (kit.jsx-local, not window.G2), matching the shipped
  // design system (design/mockups/*.dc.html): Anek Latin for display
  // mastheads, Anek Devanagari for the bilingual companion line,
  // Hanken Grotesk for UI text, JetBrains Mono for every figure/
  // column-label/mono glyph. `typeStyle()` wraps G2.t() so callers
  // keep G2's size/line-height/weight scale but get the correct
  // family. Load the four families via <link> in v2.html/v2-a.html.
  // ---------------------------------------------------------------
  const FONT_SANS = "'Hanken Grotesk', 'Figtree', system-ui, -apple-system, 'Segoe UI', sans-serif";
  const FONT_DEVA = "'Anek Devanagari', 'Mukta', 'Figtree', system-ui, sans-serif";
  const FONT_DISPLAY = "'Anek Latin', 'Figtree', system-ui, sans-serif";
  const FONT_MONO = G.mono; // already JetBrains Mono in tokens.jsx

  function typeStyle(role, script) {
    const s = G.t(role, script);
    const deva = script === "deva";
    return { ...s, fontFamily: deva ? FONT_DEVA : (role === "display" ? FONT_DISPLAY : FONT_SANS) };
  }

  // ---------------------------------------------------------------
  // inr(n) — Indian lakh-crore digit grouping, decimal-exact, NEVER
  // abbreviated (₹1,26,44,180.00, never 1.26Cr). Returns a plain
  // magnitude string with no currency symbol or sign — callers
  // (Figure, Register, Masthead) prepend ₹ / − themselves so the
  // glyphs can be styled independently (smaller ₹, smaller paise).
  // ---------------------------------------------------------------
  function inr(n, decimals) {
    const dp = decimals === undefined ? 2 : decimals;
    const num = Number(n);
    const abs = Math.abs(Number.isFinite(num) ? num : 0);
    const fixed = abs.toFixed(dp);
    const [intPart, decPart] = fixed.split(".");
    let out;
    if (intPart.length <= 3) {
      out = intPart;
    } else {
      const last3 = intPart.slice(-3);
      let rest = intPart.slice(0, -3);
      const groups = [];
      while (rest.length > 2) {
        groups.unshift(rest.slice(-2));
        rest = rest.slice(0, -2);
      }
      if (rest) groups.unshift(rest);
      out = groups.join(",") + "," + last3;
    }
    return dp > 0 ? out + "." + decPart : out;
  }

  // ---------------------------------------------------------------
  // fitFontSize — measure-independent auto-fit: picks the largest
  // font size (up to maxSize) whose estimated glyph-advance width
  // (charCount * charWidthEm * fontSize) still fits maxWidthPx. No
  // DOM measurement/ResizeObserver — purely computed from the string
  // length and the box geometry, so it is correct on first paint,
  // never overflows, and works identically for Latin or Devanagari
  // (pass a larger charWidthEm for Devanagari's wider conjuncts).
  // ---------------------------------------------------------------
  function fitFontSize(text, maxWidthPx, maxSize, charWidthEm, minSize) {
    const len = Math.max(1, String(text == null ? "" : text).length);
    const cw = charWidthEm || 0.62;
    const byWidth = maxWidthPx / (len * cw);
    return Math.max(minSize || 8, Math.min(maxSize, byWidth));
  }
  function isDevanagariText(text) {
    return /[ऀ-ॿ]/.test(String(text || ""));
  }

  // ---------------------------------------------------------------
  // i18n — ONE language rendered at a time. Never "English । हिंदी"
  // simultaneously (that pattern is retired). A tiny t(key) lookup
  // against a flat dotted-key strings table, en + hi for every
  // user-facing string this kit/screens.jsx renders.
  // ---------------------------------------------------------------
  const STRINGS = {
    en: {
      "common.lightMode": "Light mode", "common.darkMode": "Dark mode",
      "common.notifications": "Notifications", "common.signOut": "Sign out",
      "common.viewAdminConsole": "View admin console", "common.language": "Language",
      "common.support": "Support", "common.privacy": "Privacy",
      "common.viewAll": "View all", "common.download": "Download",
      "common.hide": "Hide", "common.reveal": "Reveal", "common.info": "What's this?",

      "nav.home": "Home", "nav.attendance": "My Attendance", "nav.leave": "Leave",
      "nav.payslips": "Payslips", "nav.documents": "Documents", "nav.profile": "Profile",
      "nav.substitution": "Substitutions",

      "login.welcomeBack": "Welcome back",
      "login.signInPrompt": "Sign in to Sunrise Vidya Group",
      "login.workEmail": "Work email", "login.password": "Password", "login.forgot": "Forgot?",
      "login.continue": "Continue", "login.signingIn": "Signing in…", "login.or": "or",
      "login.sso": "Sign in with school SSO",
      "login.authError": "Email or password is incorrect. Please try again, or use “Forgot?” to reset it.",
      "login.emailRequired": "Work email is required", "login.emailInvalid": "Enter a valid email address",
      "login.passwordRequired": "Password is required",
      "login.emailPlaceholder": "you@school.edu", "login.passwordPlaceholder": "Enter your password",
      "login.campusSummary": "Sunrise Vidya Group · 3 campuses · 214 staff",

      "home.goodMorning": "Good morning", "home.goodAfternoon": "Good afternoon", "home.goodEvening": "Good evening",
      "home.roleLine": "PGT · EMP-014 · Sunrise Public School",

      "today.today": "Today", "today.present": "Present", "today.in": "In",
      "today.effective": "Effective", "today.effectiveHint": "Hours actually worked so far, break time excluded",
      "today.break": "Break", "today.out": "Out",
      "today.recordedAt": "Recorded at Gate-2 · biometric", "today.viewFullTimecard": "View full timecard",
      "today.target": "of 8h target",

      "glyph.onTime": "On time", "glyph.late": "Late", "glyph.absent": "Absent",
      "glyph.onLeave": "On leave", "glyph.halfDay": "Half day", "glyph.weeklyOff": "Weekly off",
      "glyph.weeklyOffWorked": "Worked on weekly-off", "glyph.holiday": "Holiday",
      "glyph.missingSwipe": "Missing swipe", "glyph.penalty": "Penalty",

      "leave.leaveBalance": "Leave balance", "leave.applyLeave": "Apply leave",
      "leave.vacation": "Vacation", "leave.casual": "Casual", "leave.sick": "Sick", "leave.comp": "Comp-off",
      "leave.daysAvailable": "days available", "leave.na": "N/A", "leave.vacationHint": "Granted in lieu of Earned Leave for vacation staff",

      "payslip.payslips": "Payslips", "payslip.netPay": "Net Pay", "payslip.credited": "Credited",
      "payslip.paid": "Paid", "payslip.payday": "Payday", "payslip.paydayMsg": "Your July salary has been credited",

      "action.actionNeeded": "Action needed", "action.respondRequest": "Respond to HR document request",
      "action.policeVerification": "Police verification", "action.requestedByHR": "requested by HR",
      "action.respond": "Respond",

      "upcoming.upcoming": "Upcoming", "upcoming.independenceDay": "Independence Day",
      "upcoming.nationalHoliday": "National holiday", "upcoming.summerVacation": "Summer vacation",
      "upcoming.termBreak": "Term break",

      "week.thisWeek": "This week", "week.weeklyPattern": "Weekly pattern",
      "week.viewFullAttendance": "View full attendance", "week.inProgress": "In progress",
      "week.scheduled": "Scheduled", "week.recentDays": "Recent days",

      "empty.noLeaveTitle": "Hurray! No pending leave requests",
      "empty.noLeaveDesc": "Request leave any time — it'll show up here",
      "empty.noDocsTitle": "All caught up on documents",
      "empty.noDocsDesc": "HR hasn't asked you for anything right now",
      "empty.comingSoonDesc": "We're still building this screen — check back soon",

      "recent.row1Title": "Wed, 20 Jul", "recent.row1Sub": "Arrived 9:42 · 42 min late",
      "recent.row2Title": "Fri, 24 Jul", "recent.row2Sub": "Missing swipe — flagged for HR review",
      "recent.row3Title": "Sun, 19 Jul", "recent.row3Sub": "Worked a scheduled weekly-off",
      "pill.wOff": "W-OFF",
    },
    hi: {
      "common.lightMode": "लाइट मोड", "common.darkMode": "डार्क मोड",
      "common.notifications": "सूचनाएं", "common.signOut": "साइन आउट करें",
      "common.viewAdminConsole": "एडमिन कंसोल देखें", "common.language": "भाषा",
      "common.support": "सहायता", "common.privacy": "गोपनीयता",
      "common.viewAll": "सभी देखें", "common.download": "डाउनलोड करें",
      "common.hide": "छिपाएं", "common.reveal": "दिखाएं", "common.info": "यह क्या है?",

      "nav.home": "होम", "nav.attendance": "मेरी उपस्थिति", "nav.leave": "अवकाश",
      "nav.payslips": "वेतन पर्ची", "nav.documents": "दस्तावेज़", "nav.profile": "प्रोफ़ाइल",
      "nav.substitution": "प्रतिस्थापन",

      "login.welcomeBack": "वापसी पर स्वागत है",
      "login.signInPrompt": "Sunrise Vidya Group में साइन इन करें",
      "login.workEmail": "कार्य ईमेल", "login.password": "पासवर्ड", "login.forgot": "भूल गए?",
      "login.continue": "जारी रखें", "login.signingIn": "साइन इन हो रहा है…", "login.or": "या",
      "login.sso": "स्कूल SSO से साइन इन करें",
      "login.authError": "ईमेल या पासवर्ड गलत है। कृपया पुनः प्रयास करें, या रीसेट करने के लिए “भूल गए?” का उपयोग करें।",
      "login.emailRequired": "कार्य ईमेल आवश्यक है", "login.emailInvalid": "एक मान्य ईमेल पता दर्ज करें",
      "login.passwordRequired": "पासवर्ड आवश्यक है",
      "login.emailPlaceholder": "you@school.edu", "login.passwordPlaceholder": "अपना पासवर्ड दर्ज करें",
      "login.campusSummary": "Sunrise Vidya Group · 3 परिसर · 214 कर्मचारी",

      "home.goodMorning": "सुप्रभात", "home.goodAfternoon": "शुभ दोपहर", "home.goodEvening": "शुभ संध्या",
      "home.roleLine": "पीजीटी · EMP-014 · Sunrise Public School",

      "today.today": "आज", "today.present": "उपस्थित", "today.in": "प्रवेश",
      "today.effective": "प्रभावी घंटे", "today.effectiveHint": "अब तक वास्तव में काम किए गए घंटे, ब्रेक समय छोड़कर",
      "today.break": "ब्रेक", "today.out": "प्रस्थान",
      "today.recordedAt": "गेट-2 पर दर्ज · बायोमेट्रिक", "today.viewFullTimecard": "पूरा टाइमकार्ड देखें",
      "today.target": "8 घंटे के लक्ष्य में से",

      "glyph.onTime": "समय पर", "glyph.late": "देर से", "glyph.absent": "अनुपस्थित",
      "glyph.onLeave": "अवकाश पर", "glyph.halfDay": "आधा दिन", "glyph.weeklyOff": "साप्ताहिक अवकाश",
      "glyph.weeklyOffWorked": "साप्ताहिक अवकाश पर कार्य किया", "glyph.holiday": "छुट्टी",
      "glyph.missingSwipe": "स्वाइप गुम", "glyph.penalty": "दंड",

      "leave.leaveBalance": "अवकाश शेष", "leave.applyLeave": "अवकाश हेतु आवेदन करें",
      "leave.vacation": "अवकाश (वेकेशन)", "leave.casual": "आकस्मिक", "leave.sick": "बीमारी", "leave.comp": "कॉम्प-ऑफ",
      "leave.daysAvailable": "दिन उपलब्ध", "leave.na": "लागू नहीं", "leave.vacationHint": "वेकेशन स्टाफ के लिए अर्जित अवकाश के बदले दिया गया",

      "payslip.payslips": "वेतन पर्चियाँ", "payslip.netPay": "शुद्ध वेतन", "payslip.credited": "जमा किया गया",
      "payslip.paid": "भुगतान हुआ", "payslip.payday": "वेतन दिवस", "payslip.paydayMsg": "आपका जुलाई का वेतन जमा कर दिया गया है",

      "action.actionNeeded": "आवश्यक कार्रवाई", "action.respondRequest": "HR दस्तावेज़ अनुरोध का जवाब दें",
      "action.policeVerification": "पुलिस सत्यापन", "action.requestedByHR": "HR द्वारा अनुरोधित",
      "action.respond": "जवाब दें",

      "upcoming.upcoming": "आगामी", "upcoming.independenceDay": "स्वतंत्रता दिवस",
      "upcoming.nationalHoliday": "राष्ट्रीय अवकाश", "upcoming.summerVacation": "ग्रीष्मकालीन अवकाश",
      "upcoming.termBreak": "सत्र अवकाश",

      "week.thisWeek": "यह सप्ताह", "week.weeklyPattern": "साप्ताहिक पैटर्न",
      "week.viewFullAttendance": "पूरी उपस्थिति देखें", "week.inProgress": "जारी है",
      "week.scheduled": "निर्धारित", "week.recentDays": "हाल के दिन",

      "empty.noLeaveTitle": "वाह! कोई लंबित अवकाश अनुरोध नहीं",
      "empty.noLeaveDesc": "कभी भी अवकाश के लिए आवेदन करें — यह यहां दिखेगा",
      "empty.noDocsTitle": "दस्तावेज़ों पर सब कुछ अपडेट है",
      "empty.noDocsDesc": "फ़िलहाल HR ने आपसे कुछ नहीं मांगा है",
      "empty.comingSoonDesc": "हम अभी भी यह स्क्रीन बना रहे हैं — जल्द ही वापस देखें",

      "recent.row1Title": "बुध, 20 जुल", "recent.row1Sub": "9:42 बजे पहुंचीं · 42 मिनट देर से",
      "recent.row2Title": "शुक्र, 24 जुल", "recent.row2Sub": "स्वाइप गुम — HR समीक्षा हेतु चिह्नित",
      "recent.row3Title": "रवि, 19 जुल", "recent.row3Sub": "निर्धारित साप्ताहिक अवकाश पर कार्य किया",
      "pill.wOff": "अवकाश-कार्य",
    },
  };

  const LangCtx = createContext(null);
  function useLang() {
    const ctx = useContext(LangCtx);
    if (!ctx) {
      const fallback = (key) => (STRINGS.en[key] !== undefined ? STRINGS.en[key] : key);
      return { lang: "en", setLang: () => {}, toggle: () => {}, t: fallback };
    }
    return ctx;
  }
  function LangProvider({ initialLang, children }) {
    const [lang, setLang] = useState(initialLang === "hi" ? "hi" : "en");
    const toggle = useCallback(() => setLang((l) => (l === "hi" ? "en" : "hi")), []);
    const t = useCallback((key) => {
      const table = STRINGS[lang] || STRINGS.en;
      if (table[key] !== undefined) return table[key];
      return STRINGS.en[key] !== undefined ? STRINGS.en[key] : key;
    }, [lang]);
    return <LangCtx.Provider value={{ lang, setLang, toggle, t }}>{children}</LangCtx.Provider>;
  }

  function LangSwitcher({ size }) {
    const { lang, setLang, t } = useLang();
    const { c } = useTheme();
    const opts = [{ v: "en", l: "EN" }, { v: "hi", l: "हिंदी" }];
    return (
      <div
        role="group"
        aria-label={t("common.language")}
        style={{ display: "inline-flex", border: `1px solid ${withAlpha("#FFFFFF", 0.28)}`, borderRadius: G.r.pill, overflow: "hidden", flex: "0 0 auto" }}
      >
        {opts.map((o) => {
          const active = lang === o.v;
          return (
            <button
              key={o.v}
              type="button"
              data-nvx={"lang-" + o.v}
              aria-pressed={active}
              onClick={() => setLang(o.v)}
              style={{
                fontFamily: o.v === "hi" ? FONT_DEVA : FONT_SANS, fontSize: size === "sm" ? 11.5 : 12.5, fontWeight: 600,
                padding: size === "sm" ? "4px 9px" : "5px 12px",
                background: active ? "#FFFFFF" : "transparent",
                color: active ? c.shell : c.onShellMuted,
                border: "none", cursor: "pointer",
              }}
            >
              {o.l}
            </button>
          );
        })}
      </div>
    );
  }

  // ---------------------------------------------------------------
  // Theme: context + provider + reduced-motion
  // ---------------------------------------------------------------
  const ThemeCtx = createContext(null);
  function useTheme() {
    const ctx = useContext(ThemeCtx);
    if (!ctx) {
      return { mode: "light", c: G.light, toggle: () => {}, mo: G.mo, el: G.el.light, reduced: false };
    }
    return ctx;
  }

  function useReducedMotionPreference() {
    const [reduced, setReduced] = useState(false);
    useEffect(() => {
      if (!window.matchMedia) return undefined;
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      setReduced(mq.matches);
      const handler = (e) => setReduced(e.matches);
      if (mq.addEventListener) mq.addEventListener("change", handler);
      else if (mq.addListener) mq.addListener(handler);
      return () => {
        if (mq.removeEventListener) mq.removeEventListener("change", handler);
        else if (mq.removeListener) mq.removeListener(handler);
      };
    }, []);
    return reduced;
  }

  function ensureGlobalStyleTag() {
    if (typeof document === "undefined") return null;
    let tag = document.getElementById("tn2-kit-global-style");
    if (!tag) {
      tag = document.createElement("style");
      tag.id = "tn2-kit-global-style";
      document.head.appendChild(tag);
    }
    return tag;
  }

  function ThemeProvider({ initialMode, overrides, children }) {
    const [mode, setMode] = useState(initialMode === "dark" ? "dark" : "light");
    const reduced = useReducedMotionPreference();
    // `overrides` (optional): { light: {...partialColorMap}, dark: {...partialColorMap} }
    // — used ONLY by design/v2/tweaker.jsx to live-preview edited tokens
    // against the real kit/screens. Screens.jsx never passes this; the
    // shipped app always reads G2 unmodified.
    const base = G.theme(mode);
    const c = overrides && overrides[mode] ? { ...base, ...overrides[mode] } : base;
    const mo = reduced ? G.mo.reduced : G.mo;
    const el = G.el[mode];
    const toggle = useCallback(() => setMode((m) => (m === "dark" ? "light" : "dark")), []);
    const value = { mode, c, toggle, setMode, reduced, mo, el };

    useEffect(() => {
      const tag = ensureGlobalStyleTag();
      if (!tag) return;
      tag.textContent =
        "button:focus-visible, [role=\"button\"]:focus-visible, a:focus-visible, " +
        "input:focus-visible, select:focus-visible, textarea:focus-visible { " +
        "outline: 2px solid " + c.focus + "; outline-offset: 2px; }" +
        "@keyframes tn2-spin { to { transform: rotate(360deg); } }" +
        "@keyframes tn2-pulse { 0%, 100% { opacity: .35; } 50% { opacity: 1; } }";
    }, [c.focus]);

    return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
  }

  // ---------------------------------------------------------------
  // Icon — warmer, rounded nav/chrome icon set. strokeLinecap/Linejoin
  // are round (not the retired system's square-terminal geometry).
  // ---------------------------------------------------------------
  function Icon({ name, size, color, strokeWidth, style }) {
    const { c } = useTheme();
    const s = size || 16;
    const stroke = color || c.ink;
    const sw = strokeWidth || 1.9;
    const common = {
      width: s, height: s, viewBox: "0 0 24 24", fill: "none", stroke,
      strokeWidth: sw, strokeLinecap: "round", strokeLinejoin: "round", style,
    };
    const glyphs = {
      home: (
        <Fragment>
          <path d="M4 11.5 12 4l8 7.5" />
          <path d="M6.5 10v9.5h11V10" />
          <path d="M10 19.5v-5.5h4v5.5" />
        </Fragment>
      ),
      calendar: (
        <Fragment>
          <rect x="4" y="5.5" width="16" height="14.5" rx="3" />
          <path d="M8 3.5v4M16 3.5v4M4.5 10h15" />
        </Fragment>
      ),
      wallet: (
        <Fragment>
          <rect x="3" y="6.5" width="18" height="12" rx="3" />
          <path d="M3 10.5h18" />
          <circle cx="16.5" cy="14.5" r="1.4" fill={stroke} stroke="none" />
        </Fragment>
      ),
      document: (
        <Fragment>
          <path d="M6.5 3.5h8l4 4v13h-12z" />
          <path d="M14.5 3.5v4h4" />
          <path d="M9 12.5h6M9 16h6" />
        </Fragment>
      ),
      user: (
        <Fragment>
          <circle cx="12" cy="8.3" r="3.6" />
          <path d="M5 20v-.7a7 7 0 0 1 14 0v.7" />
        </Fragment>
      ),
      bell: (
        <Fragment>
          <path d="M6.5 17v-6.2a5.5 5.5 0 0 1 11 0V17" />
          <path d="M4.5 17h15" />
          <path d="M10 20a2 2 0 0 0 4 0" />
        </Fragment>
      ),
      check: <path d="M4.5 12.5 9.5 17.5 19.5 6" />,
      chevron: <path d="M6.5 9 12 15 17.5 9" />,
      search: (
        <Fragment>
          <circle cx="10.2" cy="10.2" r="6" />
          <path d="M20.5 20.5 14.6 14.6" />
        </Fragment>
      ),
      plus: (
        <Fragment>
          <path d="M12 5.5v13M5.5 12h13" />
        </Fragment>
      ),
      logout: (
        <Fragment>
          <path d="M9.5 4.5h-4v15h4" />
          <path d="M21 12H10" />
          <path d="M15.5 7l5 5-5 5" />
        </Fragment>
      ),
      alert: (
        <Fragment>
          <path d="M12 3.5 21 20h-18z" strokeLinejoin="round" />
          <path d="M12 9.5v4" />
          <circle cx="12" cy="17" r="0.9" fill={stroke} stroke="none" />
        </Fragment>
      ),
      clock: (
        <Fragment>
          <circle cx="12" cy="12" r="8.7" />
          <path d="M12 7.2V12l3.6 2" />
        </Fragment>
      ),
      sun: (
        <Fragment>
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 2.5v3M12 18.5v3M4.5 12h3M16.5 12h3M6 6l2.2 2.2M15.8 15.8 18 18M6 18l2.2-2.2M15.8 8.2 18 6" />
        </Fragment>
      ),
      moon: <path d="M20 14.7A8.5 8.5 0 1 1 9.3 4a6.8 6.8 0 0 0 10.7 10.7z" fill={stroke} stroke="none" />,
      globe: (
        <Fragment>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M3.5 12h17M12 3.5c2.6 2.4 4 5.3 4 8.5s-1.4 6.1-4 8.5c-2.6-2.4-4-5.3-4-8.5s1.4-6.1 4-8.5z" />
        </Fragment>
      ),
      info: (
        <Fragment>
          <circle cx="12" cy="12" r="8.7" />
          <path d="M12 11v5.5" />
          <circle cx="12" cy="7.8" r="0.9" fill={stroke} stroke="none" />
        </Fragment>
      ),
      swap: (
        <Fragment>
          <path d="M4.5 8.5h13.5M14.5 4.5l4 4-4 4" />
          <path d="M19.5 15.5H6M9.5 11.5l-4 4 4 4" />
        </Fragment>
      ),
    };
    return <svg {...common}>{glyphs[name] || null}</svg>;
  }

  // ---------------------------------------------------------------
  // ThemeToggle
  // ---------------------------------------------------------------
  function ThemeToggle({ size, onDark }) {
    const { mode, toggle, c } = useTheme();
    const { t } = useLang();
    const s = size || 32;
    const chromeMode = !!onDark;
    return (
      <button
        onClick={toggle}
        data-nvx="theme"
        aria-label={mode === "dark" ? t("common.lightMode") : t("common.darkMode")}
        title={mode === "dark" ? t("common.lightMode") : t("common.darkMode")}
        style={{
          width: s, height: s, borderRadius: G.r.pill,
          border: chromeMode ? `1px solid ${withAlpha("#FFFFFF", 0.28)}` : `1px solid ${c.border}`,
          background: chromeMode ? "transparent" : c.surface,
          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flex: "0 0 auto",
          transition: `background ${G.mo.hover}`,
        }}
      >
        <Icon name={mode === "dark" ? "sun" : "moon"} size={15} color={chromeMode ? c.onShell : c.ink} />
      </button>
    );
  }

  // ---------------------------------------------------------------
  // Spinner
  // ---------------------------------------------------------------
  function Spinner({ size, color, style }) {
    const { reduced } = useTheme();
    const s = size || 14;
    return (
      <svg
        width={s} height={s} viewBox="0 0 24 24" aria-hidden="true"
        style={{ flex: "0 0 auto", animation: reduced ? "tn2-pulse 900ms ease-in-out infinite" : "tn2-spin 700ms linear infinite", ...style }}
      >
        <circle cx="12" cy="12" r="9" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeDasharray="38 18" />
      </svg>
    );
  }

  // ---------------------------------------------------------------
  // Button
  // ---------------------------------------------------------------
  function Button({ variant, size, disabled, loading, onClick, children, style, type, ariaLabel }) {
    const { c, mo } = useTheme();
    const [hover, setHover] = useState(false);
    const [press, setPress] = useState(false);
    const v = variant || "primary";
    const sz = size || "md";
    const isLink = v === "link";
    const isIcon = v === "icon";
    const isDisabled = !!disabled || !!loading;
    const variants = {
      primary: { bg: c.action, fg: c.onAction, border: "transparent" },
      accent: { bg: c.accent, fg: c.onAccent, border: "transparent" },
      ghost: { bg: hover ? withAlpha(c.ink, 0.06) : "transparent", fg: c.ink, border: c.border },
      link: { bg: "transparent", fg: c.accent, border: "transparent" },
      icon: { bg: hover ? withAlpha(c.ink, 0.06) : "transparent", fg: c.ink, border: "transparent" },
    };
    const vv = variants[v] || variants.primary;
    const padY = sz === "sm" ? G.sp[1.5] : G.sp[2];
    const padX = sz === "sm" ? G.sp[3] : G.sp[4];
    const dims = isIcon ? { width: sz === "sm" ? 30 : 34, height: sz === "sm" ? 30 : 34 } : {};
    return (
      <button
        type={type || "button"}
        disabled={isDisabled}
        aria-label={ariaLabel}
        aria-busy={loading || undefined}
        onClick={onClick}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => { setHover(false); setPress(false); }}
        onMouseDown={() => setPress(true)}
        onMouseUp={() => setPress(false)}
        style={{
          fontFamily: FONT_SANS, fontSize: sz === "sm" ? 12.5 : 13.5, fontWeight: 600,
          padding: isLink ? 0 : isIcon ? 0 : `${padY}px ${padX}px`,
          borderRadius: isLink ? 0 : G.r.md,
          background: vv.bg, color: vv.fg, border: isLink ? "none" : `1px solid ${vv.border}`,
          display: isIcon ? "inline-flex" : isLink ? "inline-block" : "inline-flex",
          alignItems: isLink ? undefined : "center",
          justifyContent: isIcon ? "center" : undefined,
          gap: !isIcon && !isLink ? 6 : undefined,
          cursor: isDisabled ? "not-allowed" : "pointer",
          opacity: isDisabled ? 0.45 : 1,
          textDecoration: isLink && hover && !isDisabled ? "underline" : "none",
          transform: press && !isDisabled && !isLink ? "scale(.98)" : "scale(1)",
          transition: `transform ${mo.hover}, background ${mo.hover}`,
          ...dims,
          ...style,
        }}
      >
        {loading && <Spinner size={sz === "sm" ? 12 : 13} color={vv.fg} />}
        {children}
      </button>
    );
  }

  // ---------------------------------------------------------------
  // Field / Input / Select
  // ---------------------------------------------------------------
  function Field({ label, labelAction, onLabelAction, hint, error, required, children }) {
    const { c } = useTheme();
    return (
      <label style={{ display: "flex", flexDirection: "column", gap: 6, fontFamily: FONT_SANS }}>
        {(label || labelAction) && (
          <span style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontSize: 12.5, color: c.inkMuted, fontWeight: 500 }}>
              {label}{required && <span style={{ color: c.danger }}> *</span>}
            </span>
            {labelAction && (
              <button
                type="button" onClick={onLabelAction}
                style={{ fontFamily: FONT_SANS, fontSize: 12, fontWeight: 600, color: c.accent, background: "transparent", border: "none", padding: 0, cursor: "pointer" }}
              >
                {labelAction}
              </button>
            )}
          </span>
        )}
        {children}
        {error
          ? <span style={{ fontSize: 11.5, color: c.danger, display: "flex", alignItems: "center", gap: 4 }}>
              <Icon name="alert" size={12} color={c.danger} strokeWidth={2.2} />{error}
            </span>
          : hint ? <span style={{ fontSize: 11.5, color: c.inkMuted }}>{hint}</span> : null}
      </label>
    );
  }

  function fieldBoxStyle(c, focused, hasError) {
    return {
      font: "inherit", fontFamily: FONT_SANS, fontSize: 14, width: "100%", boxSizing: "border-box",
      borderRadius: G.r.md, background: c.surface, color: c.ink,
      border: `1.5px solid ${hasError ? c.danger : focused ? c.accent : c.border}`,
      outline: focused ? `2px solid ${c.focus}` : "2px solid transparent", outlineOffset: 2,
      transition: `border 120ms ${G.mo.ease.outQuart}`,
    };
  }

  function Input({ value, onChange, type, placeholder, error, onFocus, onBlur, ...rest }) {
    const { c } = useTheme();
    const [focused, setFocused] = useState(false);
    return (
      <input
        type={type || "text"} value={value} onChange={onChange} placeholder={placeholder}
        onFocus={(e) => { setFocused(true); if (onFocus) onFocus(e); }}
        onBlur={(e) => { setFocused(false); if (onBlur) onBlur(e); }}
        style={{ ...fieldBoxStyle(c, focused, !!error), padding: `${G.sp[2]}px ${G.sp[3]}px` }}
        {...rest}
      />
    );
  }

  function Select({ value, onChange, options, placeholder, ...rest }) {
    const { c } = useTheme();
    const [focused, setFocused] = useState(false);
    const opts = options || [];
    return (
      <div style={{ position: "relative", width: "100%" }}>
        <select
          value={value} onChange={onChange}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{ ...fieldBoxStyle(c, focused, false), padding: `${G.sp[2]}px 28px ${G.sp[2]}px ${G.sp[3]}px`, appearance: "none", WebkitAppearance: "none", cursor: "pointer" }}
          {...rest}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {opts.map((o) => {
            const val = typeof o === "string" ? o : o.value;
            const label = typeof o === "string" ? o : o.label;
            return <option key={val} value={val}>{label}</option>;
          })}
        </select>
        <span style={{ position: "absolute", right: G.sp[3], top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
          <Icon name="chevron" size={13} color={c.inkMuted} />
        </span>
      </div>
    );
  }

  // ---------------------------------------------------------------
  // Chip / StatusPill — fill+text(+icon) state encoding, never
  // hue-alone. `tone` reads a state-role key straight off G2.c.
  // ---------------------------------------------------------------
  const TONE_KEYS = {
    present: ["present", "presentTint", "presentText"],
    late: ["late", "lateTint", "lateText"],
    absent: ["absent", "absentTint", "absentText"],
    leave: ["leave", "leaveTint", "leaveText"],
    off: ["off", "offTint", "offText"],
    holiday: ["holiday", "holidayTint", "holidayText"],
    missing: ["missing", "missingTint", "missingText"],
    penalty: ["penalty", "penaltyTint", "penaltyText"],
    success: ["success", "presentTint", "presentText"],
    warning: ["warning", "lateTint", "lateText"],
    danger: ["danger", "absentTint", "absentText"],
    info: ["info", "leaveTint", "leaveText"],
    neutral: ["inkMuted", "sunken", "inkMuted"],
  };
  function toneColors(c, tone) {
    const keys = TONE_KEYS[tone] || TONE_KEYS.neutral;
    return { solid: c[keys[0]], tint: c[keys[1]], text: c[keys[2]] };
  }
  function toneColor(c, tone) {
    if (!tone) return c.inkMuted;
    if (c[tone] !== undefined) return c[tone];
    return toneColors(c, tone).solid;
  }

  // ---------------------------------------------------------------
  // Chip — a small colour-tinted tag. Grammar rule 4 ("state is a
  // mark, not a pill") retires the FILLED PILL for record/attendance
  // STATE — use `Mark` for that. Chip stays for genuine small labels
  // (employment-class letter, a count) and is now SQUARE (radius 0),
  // matching the design system's "Employment class chip" component.
  // ---------------------------------------------------------------
  function Chip({ tone, icon, children, uppercase, size }) {
    const { c } = useTheme();
    const t = toneColors(c, tone);
    const sm = size === "sm";
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 5, background: t.tint, color: t.text,
        fontFamily: FONT_SANS, fontSize: sm ? 10.5 : 11.5, fontWeight: 700, padding: sm ? "2px 8px" : "3px 10px",
        borderRadius: G.r.none, whiteSpace: "nowrap", letterSpacing: uppercase ? ".04em" : 0,
        textTransform: uppercase ? "uppercase" : "none",
      }}>
        {icon && <Icon name={icon} size={sm ? 10 : 11} color={t.text} strokeWidth={2.4} />}
        {children}
      </span>
    );
  }

  // ---------------------------------------------------------------
  // Mark — grammar rule 4: record/workflow STATE is a mono glyph plus
  // a coloured word, never a filled pill (reserved fills stay on
  // money + absence so status never competes with data). `status`
  // is a convenience map for the common record-state vocabulary
  // (Filed / In review / Held / Approved / Draft ...); pass `tone`
  // (any window.G2 colour-role key: present/absent/late/leave/off/
  // holiday/missing/penalty/seal/danger/accent/inkMuted/…) + `glyph`
  // directly for anything else. `children` overrides the label text.
  // ---------------------------------------------------------------
  const RECORD_STATE_MARKS = {
    Filed: { glyph: "⦾", tone: "seal" },
    Verified: { glyph: "⦾", tone: "seal" },
    Approved: { glyph: "⦾", tone: "present" },
    Paid: { glyph: "⦾", tone: "present" },
    Present: { glyph: "⦾", tone: "present" },
    "In review": { glyph: "◌", tone: "inkMuted" },
    Processing: { glyph: "◌", tone: "inkMuted" },
    Pending: { glyph: "◌", tone: "inkMuted" },
    Draft: { glyph: "◌", tone: "inkMuted" },
    Held: { glyph: "▣", tone: "danger" },
    Rejected: { glyph: "▣", tone: "danger" },
    Absent: { glyph: "▣", tone: "danger" },
  };

  function Mark({ status, tone, glyph, size, children }) {
    const { c } = useTheme();
    const preset = status && RECORD_STATE_MARKS[status];
    const finalGlyph = glyph || (preset && preset.glyph) || "●";
    const finalTone = tone || (preset && preset.tone) || "inkMuted";
    const color = toneColor(c, finalTone);
    const sz = size || 12.5;
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: FONT_SANS, fontSize: sz, fontWeight: 500, color, whiteSpace: "nowrap" }}>
        <span aria-hidden="true" style={{ fontFamily: FONT_MONO, fontSize: Math.max(9, sz - 1.5), lineHeight: 1 }}>{finalGlyph}</span>
        <span>{children !== undefined ? children : status}</span>
      </span>
    );
  }

  function StatusPill({ status }) {
    return <Mark status={status}>{status}</Mark>;
  }

  // ---------------------------------------------------------------
  // MusterMark — the P/A/L/H/· attendance-muster swatch: a small
  // square (never a circle/pill — "registers have corners"), filled
  // for Absent/Leave, ring-only for Present/Not-scheduled so the
  // eye reads exceptions first (design system §04 "Muster mark").
  // ---------------------------------------------------------------
  function MusterMark({ code, size }) {
    const { c } = useTheme();
    const cfg = {
      P: { bg: "transparent", fg: c.inkMuted, ring: `inset 0 0 0 1px ${c.ruleStrong}` },
      A: { bg: c.absent, fg: "#FFFFFF", ring: "none" },
      L: { bg: c.seal, fg: "#FFFFFF", ring: "none" },
      H: { bg: c.sunken, fg: c.absent, ring: "none" },
      "·": { bg: "transparent", fg: c.inkFaint, ring: `inset 0 0 0 1px ${c.rule}` },
    }[code] || { bg: "transparent", fg: c.inkFaint, ring: `inset 0 0 0 1px ${c.rule}` };
    const w = size || 20;
    return (
      <span aria-label={code} style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", width: w, height: w * 1.1,
        fontFamily: FONT_MONO, fontSize: 10.5, fontWeight: 700, background: cfg.bg, color: cfg.fg, boxShadow: cfg.ring,
        flex: "0 0 auto",
      }}>
        {code}
      </span>
    );
  }

  // ---------------------------------------------------------------
  // Glyph — the character set. THIN-STROKE OUTLINE (not filled),
  // ~1.8-2px stroke in the state colour, circular, friendly faces —
  // never emoji, never square-terminal geometry. Matches the live
  // Keka reference the coordinator captured (outlined smiley / "!").
  // ---------------------------------------------------------------
  function Glyph({ kind, size, tint }) {
    const { c } = useTheme();
    const s = size || 28;
    const toneMap = {
      onTime: "present", weeklyOffWorked: "late", late: "late", absent: "absent",
      onLeave: "leave", halfDay: "seal", weeklyOff: "off", holiday: "holiday", missingSwipe: "missing",
    };
    const tone = toneMap[kind] || "off";
    const stroke = c[tone] || c.inkMuted;
    const sw = 1.8;
    const bg = tint ? (c[TONE_KEYS[tone] ? TONE_KEYS[tone][1] : "sunken"] || c.sunken) : "none";

    function face(inner) {
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          {tint && <circle cx="12" cy="12" r="11.4" fill={bg} />}
          <circle cx="12" cy="12" r="9.3" stroke={stroke} strokeWidth={sw} />
          {inner}
        </svg>
      );
    }

    if (kind === "onTime" || kind === "weeklyOffWorked") {
      return face(
        <Fragment>
          <circle cx="9" cy="10.3" r="0.95" fill={stroke} />
          <circle cx="15" cy="10.3" r="0.95" fill={stroke} />
          <path d="M8.3 14 Q12 17 15.7 14" stroke={stroke} strokeWidth={sw} strokeLinecap="round" fill="none" />
        </Fragment>
      );
    }
    if (kind === "absent") {
      return face(
        <Fragment>
          <path d="M7.7 9 9.9 11.2M9.9 9 7.7 11.2" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
          <path d="M14.1 9 16.3 11.2M16.3 9 14.1 11.2" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
          <path d="M8.3 15.6 Q12 13.2 15.7 15.6" stroke={stroke} strokeWidth={sw} strokeLinecap="round" fill="none" />
        </Fragment>
      );
    }
    if (kind === "onLeave") {
      return face(
        <Fragment>
          <path d="M17.8 4.2 19.6 2.6M19 6.4 21.3 6M17 2.2 18 4.4" stroke={stroke} strokeWidth={1.4} strokeLinecap="round" />
          <path d="M8 10.4 Q9.1 11.6 10.2 10.4" stroke={stroke} strokeWidth={sw} strokeLinecap="round" fill="none" />
          <path d="M13.8 10.4 Q14.9 11.6 16 10.4" stroke={stroke} strokeWidth={sw} strokeLinecap="round" fill="none" />
          <path d="M8.6 14.2 Q12 16.4 15.4 14.2" stroke={stroke} strokeWidth={sw} strokeLinecap="round" fill="none" />
        </Fragment>
      );
    }
    if (kind === "late") {
      // outline-drawn tortoise — same stroke language as the faces.
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          {tint && <circle cx="12" cy="12" r="11.4" fill={bg} />}
          <path d="M5 15c0-3.4 3.1-6 7-6s7 2.6 7 6-3.1 4.6-7 4.6S5 18.4 5 15z" stroke={stroke} strokeWidth={sw} />
          <path d="M8.3 11.6c1.2-.7 2.6-1 3.7-1s2.5.3 3.7 1" stroke={stroke} strokeWidth={1.4} strokeLinecap="round" />
          <circle cx="17.6" cy="12.6" r="2.1" stroke={stroke} strokeWidth={sw} />
          <circle cx="18.4" cy="12.1" r="0.5" fill={stroke} />
          <path d="M7 18.4 6 20M10 19.3l-.6 1.9M14.6 19.3l.6 1.9M17.6 18.4l1 1.6" stroke={stroke} strokeWidth={1.4} strokeLinecap="round" />
        </svg>
      );
    }
    if (kind === "halfDay") {
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          {tint && <circle cx="12" cy="12" r="11.4" fill={bg} />}
          <path d="M12 2.7A9.3 9.3 0 0 0 12 21.3" stroke={stroke} strokeWidth={sw} />
          <path d="M12 2.7A9.3 9.3 0 0 1 12 21.3" stroke={stroke} strokeWidth={sw} strokeDasharray="2.4 2.6" />
          <circle cx="8.7" cy="10.4" r="0.95" fill={stroke} />
          <path d="M13.8 10.4 Q14.9 11.4 16 10.4" stroke={stroke} strokeWidth={sw} strokeLinecap="round" fill="none" />
          <path d="M9 14.4 Q12 16 14.6 14.7" stroke={stroke} strokeWidth={sw} strokeLinecap="round" fill="none" />
        </svg>
      );
    }
    if (kind === "weeklyOff") {
      return face(
        <Fragment>
          <path d="M8 10.4 Q9.1 11.6 10.2 10.4" stroke={stroke} strokeWidth={sw} strokeLinecap="round" fill="none" />
          <path d="M13.8 10.4 Q14.9 11.6 16 10.4" stroke={stroke} strokeWidth={sw} strokeLinecap="round" fill="none" />
          <path d="M9 14.9h6" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
          <path d="M16.6 4.6h2.6l-2.6 2.6h2.6" stroke={stroke} strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </Fragment>
      );
    }
    if (kind === "holiday") {
      const rays = [0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const x1 = 12 + 10.4 * Math.cos(rad), y1 = 12 + 10.4 * Math.sin(rad);
        const x2 = 12 + 12.4 * Math.cos(rad), y2 = 12 + 12.4 * Math.sin(rad);
        return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} strokeWidth={1.4} strokeLinecap="round" />;
      });
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          {tint && <circle cx="12" cy="12" r="13.4" fill={bg} />}
          {rays}
          <circle cx="12" cy="12" r="9.3" stroke={stroke} strokeWidth={sw} />
          <circle cx="9" cy="10.6" r="0.9" fill={stroke} />
          <circle cx="15" cy="10.6" r="0.9" fill={stroke} />
          <path d="M8.6 14 Q12 16.2 15.4 14" stroke={stroke} strokeWidth={sw} strokeLinecap="round" fill="none" />
        </svg>
      );
    }
    if (kind === "missingSwipe") {
      // amber outlined "!" circle — literal per live-product reference.
      return face(
        <Fragment>
          <path d="M12 7.6v5.6" stroke={stroke} strokeWidth={2.1} strokeLinecap="round" />
          <circle cx="12" cy="16.4" r="1.05" fill={stroke} />
        </Fragment>
      );
    }
    return face(null);
  }

  // ---------------------------------------------------------------
  // HoursRing — the signature metric object. SVG donut, value in
  // the centre, thin-stroke `variant="thin"` for compact inline use.
  //
  // FIX (coordinator-reported bug): the hours figure ("3h 14m") could
  // overflow the ring / read off-centre because its font size was a
  // fixed fraction of the ring diameter regardless of string length
  // ("12h" and "3h 14m" are very different widths at the same size),
  // and a stray trailing space (`{m ? ... : ""}`) skewed the visual
  // centroid when minutes were 0. Fixed by: (1) building the value
  // string with no trailing whitespace, (2) auto-fitting BOTH the
  // value and the label to the ring's inner inscribed square via
  // `fitFontSize` (measure-independent — computed from string length
  // + geometry, correct on first paint, works for Devanagari labels
  // too), and (3) true flex+text-align centring with a width cap so
  // the text can never escape the ring's inner diameter at any size.
  // ---------------------------------------------------------------
  function HoursRing({ hours, target, size, variant, label }) {
    const { c } = useTheme();
    const s = size || (variant === "thin" ? 44 : 84);
    const thin = variant === "thin";
    const sw = thin ? 4 : 9;
    const r = s / 2 - sw / 2 - 1;
    const circ = 2 * Math.PI * r;
    const frac = Math.max(0, Math.min(1, target ? hours / target : 0));
    const h = Math.floor(hours || 0);
    const m = Math.round(((hours || 0) - h) * 60);
    const valueText = m ? `${h}h ${m}m` : `${h}h`;

    // Largest square inscribed inside the ring's inner edge (radius
    // minus half the stroke) — text centred here can never touch the
    // stroke at any ring size.
    const innerR = Math.max(0, r - sw / 2 - 1);
    const innerBoxW = innerR * Math.SQRT2;
    const valueSize = fitFontSize(valueText, innerBoxW * 0.92, s * 0.24, 0.64, 9);
    const labelCharW = isDevanagariText(label) ? 0.82 : 0.58;
    const labelSize = label ? fitFontSize(label, innerBoxW * 0.94, s * 0.1, labelCharW, 7.5) : 0;

    return (
      <div style={{ position: "relative", width: s, height: s, flex: "0 0 auto" }}>
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
          <circle cx={s / 2} cy={s / 2} r={r} fill="none" stroke={c.sunken} strokeWidth={sw} />
          <circle
            cx={s / 2} cy={s / 2} r={r} fill="none" stroke={c.present} strokeWidth={sw}
            strokeLinecap="round" strokeDasharray={`${circ} ${circ}`} strokeDashoffset={circ * (1 - frac)}
            transform={`rotate(-90 ${s / 2} ${s / 2})`}
          />
        </svg>
        {!thin && (
          <div style={{
            position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 1, boxSizing: "border-box",
          }}>
            <span style={{
              fontFamily: FONT_MONO, fontSize: valueSize, lineHeight: 1, fontWeight: 600, color: c.ink,
              whiteSpace: "nowrap", maxWidth: `${innerBoxW}px`, textAlign: "center", ...TABULAR,
            }}>{valueText}</span>
            {label && (
              <span style={{
                fontFamily: FONT_SANS, fontSize: labelSize, lineHeight: 1.2, color: c.inkMuted,
                whiteSpace: "nowrap", maxWidth: `${innerBoxW}px`, textAlign: "center",
                overflow: "hidden", textOverflow: "ellipsis",
              }}>{label}</span>
            )}
          </div>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------
  // LeaveDonut — a colour donut per leave TYPE (own colour from the
  // leave-type palette, not the attendance-state palette). Value +
  // label in the centre, replaces the old ruled ledger row.
  // ---------------------------------------------------------------
  function LeaveDonut({ typeKey, value, max, label, sublabel, size }) {
    const { c } = useTheme();
    const s = size || 108;
    const sw = 9;
    const r = s / 2 - sw / 2 - 1;
    const circ = 2 * Math.PI * r;
    const isNA = value === null || value === undefined;
    const solid = c["lt" + typeKey] || c.accent;
    const tint = c["lt" + typeKey + "Tint"] || c.sunken;
    const frac = isNA ? 0 : Math.max(0, Math.min(1, max ? value / max : 0));
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: G.sp[2], flex: "1 1 130px", minWidth: 116 }}>
        <div style={{ position: "relative", width: s, height: s }}>
          <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
            <circle cx={s / 2} cy={s / 2} r={r} fill="none" stroke={tint} strokeWidth={sw} />
            {!isNA && (
              <circle
                cx={s / 2} cy={s / 2} r={r} fill="none" stroke={solid} strokeWidth={sw}
                strokeLinecap="round" strokeDasharray={`${circ} ${circ}`} strokeDashoffset={circ * (1 - frac)}
                transform={`rotate(-90 ${s / 2} ${s / 2})`}
              />
            )}
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: G.mono, fontSize: s * 0.26, fontWeight: 600, color: isNA ? c.inkFaint : c.ink, ...TABULAR }}>{isNA ? "—" : value}</span>
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: c.ink }}>{label}</div>
          {sublabel && <div style={{ fontFamily: FONT_SANS, fontSize: 11, color: c.inkMuted, marginTop: 1 }}>{sublabel}</div>}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------
  // DayTimeline — colour day-timeline: worked/break/current segments
  // as a rounded pill bar + hour ticks below.
  // ---------------------------------------------------------------
  function DayTimeline({ startMin, endMin, worked, breaks, now }) {
    const { c } = useTheme();
    const pc = (m) => Math.max(0, Math.min(100, ((m - startMin) / (endMin - startMin)) * 100));
    const hourMarks = [];
    for (let h = Math.ceil(startMin / 60); h <= Math.floor(endMin / 60); h += 2) hourMarks.push(h);
    return (
      <div>
        <div style={{ position: "relative", height: 14 }}>
          <div style={{ position: "absolute", top: 2, left: 0, right: 0, height: 10, background: c.sunken, borderRadius: G.r.pill }} />
          {(worked || []).map(([a, b], i) => (
            <div key={"w" + i} style={{ position: "absolute", top: 2, height: 10, left: `${pc(a)}%`, width: `${Math.max(pc(b) - pc(a), 1)}%`, background: c.present, borderRadius: G.r.pill }} />
          ))}
          {(breaks || []).map(([a, b], i) => (
            <div key={"b" + i} title="Break" style={{ position: "absolute", top: 2, height: 10, left: `${pc(a)}%`, width: `${Math.max(pc(b) - pc(a), 1)}%`, background: c.holiday, opacity: 0.55, borderRadius: G.r.pill }} />
          ))}
          {now !== undefined && (
            <div style={{ position: "absolute", top: -2, left: `${pc(now)}%`, width: 2.5, height: 18, background: c.accent, borderRadius: 2, transform: "translateX(-50%)" }} />
          )}
        </div>
        <div style={{ position: "relative", height: 14, marginTop: 6 }}>
          {hourMarks.map((h) => (
            <span key={h} style={{ position: "absolute", left: `${pc(h * 60)}%`, transform: "translateX(-50%)", fontFamily: G.mono, fontSize: 9.5, color: c.inkFaint, ...TABULAR }}>{h}:00</span>
          ))}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------
  // WeekStripChart — "Weekly pattern" bar chart. Simple coloured
  // bars with day labels, NOT a dense ruled grid.
  // ---------------------------------------------------------------
  function WeekStripChart({ days, maxHours }) {
    const { c } = useTheme();
    const { t } = useLang();
    const max = maxHours || 8;
    const trackH = 84;
    return (
      <div style={{ display: "flex", alignItems: "flex-end", gap: G.sp[3], padding: `${G.sp[2]}px 0` }}>
        {(days || []).map((d) => {
          const tone = d.state; // present | late | absent | leave | off | holiday | future
          const color = tone === "future" ? c.sunken : (c[tone] || c.inkFaint);
          const h = d.hours ? Math.max((Math.min(d.hours, max) / max) * trackH, 6) : (tone === "future" ? 0 : 4);
          return (
            <div key={d.day} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: 1 }}>
              <div style={{ height: trackH, display: "flex", alignItems: "flex-end", width: "100%", justifyContent: "center" }}>
                {tone === "future" ? (
                  <div style={{ width: 16, height: 16, borderRadius: G.r.pill, border: `1.6px dashed ${c.border}`, marginBottom: 0 }} />
                ) : (
                  <div style={{
                    width: 16, height: h, borderRadius: G.r.pill, background: color,
                    boxShadow: d.today ? `0 0 0 3px ${withAlpha(c.accent, 0.22)}` : "none",
                  }} />
                )}
              </div>
              <div style={{ fontFamily: G.mono, fontSize: 11, fontWeight: 600, color: d.today ? c.accent : c.ink }}>{d.day}</div>
              <div style={{ fontFamily: FONT_SANS, fontSize: 10, color: c.inkMuted }}>{d.wd}</div>
            </div>
          );
        })}
      </div>
    );
  }

  // ---------------------------------------------------------------
  // DayLogRow — grammar rule 2: rows are HAIRLINES, not cards. A
  // full-tint background read as a card in a list; now a plain row
  // with a hairline bottom rule and a left accent bar in the row's
  // tone colour (same "one open field" visual language SubstitutionBoard
  // uses for its selected candidate row), state carried by `Mark`
  // instead of an uppercase filled pill.
  // ---------------------------------------------------------------
  function DayLogRow({ tone, glyph, title, subtitle, meta, pillLabel, last }) {
    const { c } = useTheme();
    const tc = toneColors(c, tone);
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: G.sp[3], padding: `${G.sp[2]}px ${G.sp[3]}px`,
        borderBottom: last ? "none" : `1px solid ${c.rule}`,
        boxShadow: `inset 2px 0 0 ${tc.solid}`, boxSizing: "border-box",
      }}>
        <Glyph kind={glyph} size={24} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: FONT_SANS, fontSize: 13, fontWeight: 600, color: c.ink }}>{title}</div>
          {subtitle && <div style={{ fontFamily: FONT_SANS, fontSize: 11.5, color: c.inkMuted, marginTop: 1 }}>{subtitle}</div>}
        </div>
        {meta && <div style={{ fontFamily: FONT_MONO, fontSize: 12.5, fontWeight: 600, color: c.ink, ...TABULAR }}>{meta}</div>}
        {pillLabel && <Mark tone={tone}>{pillLabel}</Mark>}
      </div>
    );
  }

  // ---------------------------------------------------------------
  // Card / Tile — Card no longer carries data-surface chrome by
  // default: grammar rule 2 bans shadow/card-radius inside data, so
  // `level` now defaults to 0 (flat, hairline `c.rule` border, radius
  // 0 — the same panel treatment as a Register). Pass an explicit
  // `level` (1-5) ONLY for a genuine floating layer — a popover,
  // menu, modal — where G2's elevation shadows still apply.
  // ---------------------------------------------------------------
  function Card({ level, padding, style, children }) {
    const { mode, c } = useTheme();
    const lvl = level || 0;
    const isDark = mode === "dark";
    const flat = lvl === 0;
    const bg = flat ? c.surface : (isDark ? (G.surf[lvl] || G.surf[1]) : c.raised);
    const border = flat ? `1px solid ${c.rule}` : (isDark ? `1px solid ${G.surfBorder}` : `1px solid ${c.border}`);
    const shadow = flat ? "none" : ((G.el[mode] && G.el[mode][lvl]) || G.el[mode][1]);
    return (
      <div style={{ background: bg, border, borderRadius: G.r.none, boxShadow: shadow, padding: padding === undefined ? G.sp[5] : padding, ...style }}>
        {children}
      </div>
    );
  }

  function Tile({ tone, icon, label, value, sub, onClick }) {
    const { c } = useTheme();
    const tc = toneColors(c, tone);
    const Comp = onClick ? "button" : "div";
    return (
      <Comp
        onClick={onClick}
        type={onClick ? "button" : undefined}
        style={{
          display: "flex", flexDirection: "column", gap: G.sp[2], padding: G.sp[4],
          background: tc.tint, borderRadius: G.r.none, border: "none", textAlign: "left",
          font: "inherit", cursor: onClick ? "pointer" : "default", flex: "1 1 140px", minWidth: 130,
        }}
      >
        {icon && <Glyph kind={icon} size={26} />}
        <div style={{ fontFamily: FONT_MONO, fontSize: 22, fontWeight: 700, color: tc.text, ...TABULAR }}>{value}</div>
        <div style={{ fontFamily: FONT_SANS, fontSize: 12.5, fontWeight: 600, color: c.ink }}>{label}</div>
        {sub && <div style={{ fontFamily: FONT_SANS, fontSize: 11, color: c.inkMuted }}>{sub}</div>}
      </Comp>
    );
  }

  // ---------------------------------------------------------------
  // SectionHeader
  // ---------------------------------------------------------------
  function SectionHeader({ children, action, onAction, info }) {
    const { c } = useTheme();
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: G.sp[3], gap: G.sp[2] }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ ...typeStyle("h3", "latin"), color: c.ink }}>{children}</span>
          {info && <span title={info} style={{ display: "inline-flex", cursor: "help" }}><Icon name="info" size={14} color={c.inkFaint} /></span>}
        </span>
        {action && <Button variant="link" size="sm" onClick={onAction}>{action}</Button>}
      </div>
    );
  }

  // ---------------------------------------------------------------
  // Figure — tabular-mono ₹, Indian lakh-crore grouping via inr(),
  // decimal-exact, NEVER abbreviated (₹1,26,44,180.00, never 1.26Cr).
  // `display` mode is the Masthead-scale treatment: a smaller ₹ glyph
  // and smaller paise flanking a large integer part, per the shipped
  // design system's "Figure" type role.
  // ---------------------------------------------------------------
  function Figure({ value, currency, size, weight, color, negative, display }) {
    const { c } = useTheme();
    const num = Number(value) || 0;
    const isNeg = negative !== undefined ? negative : num < 0;
    const col = color || (isNeg ? c.danger : c.ink);
    const sym = currency === undefined ? "₹" : currency;
    const sz = size || 13;
    const [intPart, decPart] = inr(Math.abs(num)).split(".");
    if (display) {
      return (
        <span style={{ fontFamily: FONT_MONO, fontSize: sz, fontWeight: weight || 600, color: col, letterSpacing: "-0.02em", ...TABULAR }}>
          {isNeg && "−"}
          <span style={{ fontSize: sz * 0.6, opacity: 0.62 }}>{sym}</span>
          {intPart}
          <span style={{ fontSize: sz * 0.6, opacity: 0.6 }}>.{decPart}</span>
        </span>
      );
    }
    return (
      <span style={{ fontFamily: FONT_MONO, fontSize: sz, fontWeight: weight || 500, color: col, ...TABULAR }}>
        {isNeg ? "−" : ""}{sym} {intPart}.{decPart}
      </span>
    );
  }

  // ---------------------------------------------------------------
  // Avatar — genuine pill (circular), keeps G.r.pill by design.
  // ---------------------------------------------------------------
  function Avatar({ initials, size }) {
    const { c } = useTheme();
    const s = size || 34;
    return (
      <div style={{
        width: s, height: s, borderRadius: G.r.pill, background: c.accentSoft, border: `1px solid ${c.border}`,
        display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto",
        fontFamily: FONT_SANS, fontWeight: 700, fontSize: s * 0.34, color: c.accent,
      }}>
        {initials}
      </div>
    );
  }

  // ---------------------------------------------------------------
  // Seal — the round brass verification stamp (design system §04):
  // a rotated circular double-ring with a mono "VERIFIED" caption, an
  // optional Devanagari word, and a mono date — never a generic green
  // check badge. Circular geometry is intentional (not a G2.r scale
  // value; the seal is iconography, not data-row chrome).
  // ---------------------------------------------------------------
  function Seal({ label, sublabel, date, size }) {
    const { c } = useTheme();
    const s = size || 86;
    const inner = Math.max(0, s - 14);
    return (
      <div
        role="img"
        aria-label={[label || "Verified", sublabel, date].filter(Boolean).join(" · ")}
        style={{
          width: s, height: s, borderRadius: "50%", border: `1.5px solid ${c.seal}`, color: c.seal,
          display: "flex", alignItems: "center", justifyContent: "center", transform: "rotate(-9deg)", flex: "0 0 auto",
        }}
      >
        <div style={{
          width: inner, height: inner, borderRadius: "50%", border: `1px dashed ${c.seal}`,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1, textAlign: "center",
        }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: Math.max(6.5, s * 0.087), letterSpacing: ".16em" }}>{(label || "Verified").toUpperCase()}</div>
          {sublabel && <div style={{ fontFamily: FONT_DEVA, fontSize: s * 0.17, lineHeight: 1.2, fontWeight: 600 }}>{sublabel}</div>}
          {date && <div style={{ fontFamily: FONT_MONO, fontSize: Math.max(6, s * 0.08), letterSpacing: ".12em" }}>{date}</div>}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------
  // Ledger — earnings/deductions, ruled subtotals, emphasized Net Pay
  // ---------------------------------------------------------------
  function Ledger({ earnings, deductions, net, earningsLabel, deductionsLabel, totalLabel, netLabel }) {
    const { c } = useTheme();
    const sum = (arr) => (arr || []).reduce((s, pair) => s + pair[1], 0);
    const earnTotal = sum(earnings), dedTotal = sum(deductions);
    const netVal = net === undefined ? earnTotal - dedTotal : net;

    function Col({ label, rows }) {
      const rowsArr = rows || [];
      const total = sum(rowsArr);
      return (
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontFamily: FONT_SANS, fontSize: 11.5, fontWeight: 700, letterSpacing: ".03em", color: c.inkMuted, textTransform: "uppercase", marginBottom: G.sp[2] }}>{label}</div>
          {rowsArr.map(([l, v]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: `${G.sp["1.5"]}px 0`, borderBottom: `1px solid ${c.rule}` }}>
              <span style={{ fontFamily: FONT_SANS, fontSize: 13.5, color: c.ink }}>{l}</span>
              <Figure value={v} />
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", padding: `${G.sp[2]}px 0`, borderTop: `2px solid ${c.ruleStrong}`, marginTop: G.sp[1] }}>
            <span style={{ fontFamily: FONT_SANS, fontSize: 13.5, fontWeight: 600, color: c.ink }}>{totalLabel || "Total"}</span>
            <Figure value={total} weight={600} />
          </div>
        </div>
      );
    }

    return (
      <div>
        <div style={{ display: "flex", gap: G.sp[8], flexWrap: "wrap", background: c.surface, border: `1px solid ${c.rule}`, borderRadius: G.r.none, padding: G.sp[6] }}>
          <Col label={earningsLabel || "Earnings"} rows={earnings} />
          <Col label={deductionsLabel || "Deductions"} rows={deductions} />
        </div>
        {/* Net Pay — grammar rule 3 "everything sums": a double-rule
            total row (two hairlines via border + offset box-shadow),
            not a rounded colour pill. */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "baseline",
          background: c.sel, borderTop: `1px solid ${c.ruleStrong}`, boxShadow: `0 -4px 0 0 ${c.ruleStrong}`,
          padding: `${G.sp[3]}px ${G.sp[4]}px`, marginTop: G.sp[1] + 4,
        }}>
          <span style={{ fontFamily: FONT_SANS, fontSize: 15, fontWeight: 600, color: c.ink }}>{netLabel || "Net Pay"}</span>
          <Figure value={netVal} size={20} weight={700} color={c.accent} />
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------
  // PaydayMoment — warm celebratory treatment when a payslip is newly
  // credited. Tasteful: soft radiating rings behind the figure, no
  // confetti/emoji, no gradient numerals.
  // ---------------------------------------------------------------
  function PaydayMoment({ period, netPay, creditedOn, statusLabel, paydayLabel, paydayMsg, onDownload, downloadLabel }) {
    const { c } = useTheme();
    return (
      <Card padding={0} style={{ overflow: "hidden", position: "relative" }}>
        <svg width="180" height="180" viewBox="0 0 180 180" style={{ position: "absolute", right: -30, top: -30, opacity: 0.5 }} aria-hidden="true">
          <circle cx="90" cy="90" r="86" fill="none" stroke={c.accentSoft} strokeWidth="1.4" />
          <circle cx="90" cy="90" r="64" fill="none" stroke={c.accentSoft} strokeWidth="1.4" />
          <circle cx="90" cy="90" r="42" fill="none" stroke={c.accentSoft} strokeWidth="1.4" />
        </svg>
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: G.sp[4], padding: `${G.sp[5]}px ${G.sp[5]}px`, flexWrap: "wrap" }}>
          <Glyph kind="onTime" size={40} tint />
          <div style={{ flex: "1 1 160px", minWidth: 0 }}>
            <div style={{ fontFamily: FONT_SANS, fontSize: 11.5, fontWeight: 700, color: c.accent, textTransform: "uppercase", letterSpacing: ".04em" }}>{paydayLabel}</div>
            <div style={{ fontFamily: FONT_SANS, fontSize: 13.5, fontWeight: 600, color: c.ink, marginTop: 2 }}>{period}</div>
            <div style={{ fontFamily: FONT_SANS, fontSize: 12, color: c.inkMuted, marginTop: 1 }}>{paydayMsg} · {creditedOn}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: FONT_SANS, fontSize: 11, color: c.inkMuted }}>{statusLabel}</div>
            <Figure value={netPay} size={19} weight={700} />
          </div>
          <Button variant="ghost" size="sm" onClick={onDownload}>{downloadLabel}</Button>
        </div>
      </Card>
    );
  }

  // ---------------------------------------------------------------
  // MaskedValue — PII field-gated: masked by default, explicit reveal
  // ---------------------------------------------------------------
  function MaskedValue({ masked, full, size, style }) {
    const { c } = useTheme();
    const { t } = useLang();
    const [revealed, setRevealed] = useState(false);
    return (
      <div style={{ display: "flex", alignItems: "center", gap: G.sp[2], ...style }}>
        <span style={{ fontFamily: G.mono, fontSize: size || 12.5, color: c.ink, ...TABULAR }}>{revealed ? full : masked}</span>
        <Button variant="link" size="sm" onClick={() => setRevealed((r) => !r)}>{revealed ? t("common.hide") : t("common.reveal")}</Button>
      </div>
    );
  }

  // ---------------------------------------------------------------
  // Illustration — small, warm, on-palette line-art scenes for empty
  // states (a resting character + a simple prop). Never a bare
  // "no data" icon.
  // ---------------------------------------------------------------
  function Illustration({ kind, size }) {
    const { c } = useTheme();
    const s = size || 96;
    if (kind === "leave") {
      return (
        <svg width={s} height={s} viewBox="0 0 96 96" fill="none" aria-hidden="true">
          <ellipse cx="48" cy="82" rx="30" ry="4" fill={c.sunken} />
          <rect x="18" y="34" width="34" height="26" rx="4" stroke={c.leave} strokeWidth="2" />
          <path d="M18 42h34" stroke={c.leave} strokeWidth="2" />
          <path d="M26 34v-6M44 34v-6" stroke={c.leave} strokeWidth="2" strokeLinecap="round" />
          <circle cx="72" cy="44" r="15" stroke={c.present} strokeWidth="2" />
          <path d="M65.5 44.5 Q68 47 70.5 44.5" stroke={c.present} strokeWidth="1.8" strokeLinecap="round" fill="none" />
          <circle cx="66.5" cy="40.5" r="0.9" fill={c.present} />
          <circle cx="76.5" cy="40.5" r="0.9" fill={c.present} />
        </svg>
      );
    }
    if (kind === "documents") {
      return (
        <svg width={s} height={s} viewBox="0 0 96 96" fill="none" aria-hidden="true">
          <ellipse cx="48" cy="82" rx="30" ry="4" fill={c.sunken} />
          <path d="M30 20h24l12 12v38H30z" stroke={c.accent} strokeWidth="2" />
          <path d="M54 20v12h12" stroke={c.accent} strokeWidth="2" />
          <path d="M38 46h20M38 56h20M38 66h12" stroke={c.accent} strokeWidth="2" strokeLinecap="round" />
          <circle cx="70" cy="66" r="13" stroke={c.present} strokeWidth="2" />
          <path d="M64.5 66.5 8.5 3.8" stroke="none" />
          <path d="M64.5 66 68 69.5 76 61.5" stroke={c.present} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      );
    }
    return (
      <svg width={s} height={s} viewBox="0 0 96 96" fill="none" aria-hidden="true">
        <ellipse cx="48" cy="82" rx="28" ry="4" fill={c.sunken} />
        <circle cx="48" cy="46" r="20" stroke={c.off} strokeWidth="2" />
        <path d="M40 44 Q42.5 46.5 45 44" stroke={c.off} strokeWidth="1.8" strokeLinecap="round" fill="none" />
        <path d="M51 44 Q53.5 46.5 56 44" stroke={c.off} strokeWidth="1.8" strokeLinecap="round" fill="none" />
        <path d="M40 54 Q48 58 56 54" stroke={c.off} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      </svg>
    );
  }

  // ---------------------------------------------------------------
  // EmptyState — warm/encouraging copy + a small illustrated scene.
  // Never a bare "No data".
  // ---------------------------------------------------------------
  function EmptyState({ illustration, title, description, action, onAction }) {
    const { c } = useTheme();
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: G.sp[3], padding: `${G.sp[8]}px ${G.sp[4]}px` }}>
        <Illustration kind={illustration} />
        <div style={{ ...typeStyle("h3", "latin"), color: c.ink }}>{title}</div>
        {description && <div style={{ fontFamily: FONT_SANS, fontSize: 13, color: c.inkMuted, maxWidth: 380 }}>{description}</div>}
        {action && <Button variant="ghost" size="sm" onClick={onAction} style={{ marginTop: G.sp[1] }}>{action}</Button>}
      </div>
    );
  }

  // ---------------------------------------------------------------
  // Skeleton
  // ---------------------------------------------------------------
  function Skeleton({ width, height, radius, style }) {
    const { c } = useTheme();
    return (
      <div aria-hidden="true" style={{
        width: width === undefined ? "100%" : width, height: height || 14,
        borderRadius: radius === undefined ? G.r.xs : radius, background: withAlpha(c.ink, 0.08),
        animation: "tn2-pulse 1200ms ease-in-out infinite", ...style,
      }} />
    );
  }

  // =================================================================
  // REGISTER GRAMMAR PRIMITIVES — the vocabulary every dense data
  // screen (payroll register, attendance muster, substitution board)
  // composes from. See design/mockups/*.dc.html for the shipped
  // reference and design/mockups/Naveya Design System.dc.html §03.
  // =================================================================

  // ---------------------------------------------------------------
  // ActionBar — slim breadcrumb-left / controls-right strip (rule
  // grammar skeleton element "a"). `badge` is the small mono-caps
  // phase/status tag (e.g. "PHASE 2") sitting after the breadcrumb.
  // ---------------------------------------------------------------
  function ActionBar({ breadcrumbs, badge, children }) {
    const { c } = useTheme();
    const crumbs = breadcrumbs || [];
    return (
      <div style={{
        height: 50, flex: "0 0 50px", display: "flex", alignItems: "center", gap: G.sp[2],
        padding: `0 ${G.sp[5]}px`, borderBottom: `1px solid ${c.rule}`, boxSizing: "border-box",
      }}>
        {crumbs.map((b, i) => (
          <Fragment key={i}>
            {i > 0 && <span style={{ color: c.inkFaint, fontSize: 12 }}>›</span>}
            <span style={{
              fontFamily: FONT_SANS, fontSize: 12.5, color: i === crumbs.length - 1 ? c.ink : c.inkMuted,
              fontWeight: i === crumbs.length - 1 ? 600 : 400, whiteSpace: "nowrap",
            }}>{b}</span>
          </Fragment>
        ))}
        {badge && (
          <span style={{
            marginLeft: G.sp[1], padding: "3px 7px", fontFamily: FONT_MONO, fontSize: 10, fontWeight: 600,
            letterSpacing: ".08em", background: c.sealSoft, color: c.seal, whiteSpace: "nowrap",
          }}>{badge}</span>
        )}
        <div style={{ flex: 1, minWidth: G.sp[2] }} />
        <div style={{ display: "flex", alignItems: "center", gap: G.sp[2] }}>{children}</div>
      </div>
    );
  }

  // ---------------------------------------------------------------
  // Masthead — grammar skeleton element "b": mono kicker + a big
  // Anek Latin display title (+ Devanagari companion + meta line) on
  // the left, and a big right-aligned JetBrains Mono FIGURE with its
  // own kicker/sub-line on the right. Closed by the 2px accent rule
  // ("the record has a margin" — the same mark that runs down every
  // Register's left gutter). Pass EITHER figureValue (formatted via
  // Figure/inr) OR a fully custom `right` node.
  // ---------------------------------------------------------------
  function Masthead({ kicker, title, titleDeva, meta, figureKicker, figureValue, figureCurrency, figureNegative, figureSub, right, dense }) {
    const { c } = useTheme();
    const titleSize = dense ? 27 : 34;
    const titleLh = dense ? 34 : 40;
    return (
      <div style={{
        flex: "0 0 auto", padding: `${dense ? G.sp[4] : G.sp[5]}px ${G.sp[6]}px ${G.sp[4]}px`,
        display: "flex", alignItems: "flex-end", gap: G.sp[8], flexWrap: "wrap",
        borderBottom: `${G.metric.ruleAccent}px solid ${c.accent}`, boxSizing: "border-box",
      }}>
        <div style={{ flex: "1 1 320px", minWidth: 0 }}>
          {kicker && (
            <div style={{ fontFamily: FONT_MONO, fontSize: G.metric.minMonoCaps, letterSpacing: ".13em", textTransform: "uppercase", color: c.inkMuted }}>{kicker}</div>
          )}
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: titleSize, fontWeight: 600, letterSpacing: "-0.022em", lineHeight: `${titleLh}px`, color: c.ink, marginTop: 4 }}>{title}</div>
          {(titleDeva || meta) && (
            <div style={{ display: "flex", alignItems: "baseline", gap: 9, marginTop: 2, flexWrap: "wrap" }}>
              {titleDeva && <span style={{ fontFamily: FONT_DEVA, fontSize: 16, lineHeight: "24px", color: c.inkMuted }}>{titleDeva}</span>}
              {titleDeva && meta && <span style={{ color: c.inkFaint }}>।</span>}
              {meta && <span style={{ fontFamily: FONT_SANS, fontSize: 12.5, color: c.inkMuted }}>{meta}</span>}
            </div>
          )}
        </div>
        {(figureValue !== undefined || right) && (
          <div style={{ textAlign: "right", flex: "0 0 auto" }}>
            {right ? right : (
              <Fragment>
                {figureKicker && (
                  <div style={{ fontFamily: FONT_MONO, fontSize: G.metric.minMonoCaps, letterSpacing: ".13em", textTransform: "uppercase", color: c.inkMuted }}>{figureKicker}</div>
                )}
                <Figure value={figureValue} currency={figureCurrency} negative={figureNegative} display size={dense ? 28 : 36} />
                {figureSub && <div style={{ fontFamily: FONT_SANS, fontSize: 11.5, color: c.inkMuted, marginTop: 2 }}>{figureSub}</div>}
              </Fragment>
            )}
          </div>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------
  // StatusFooter — grammar skeleton element "d": a slim governing-
  // rule + counts bar closing every register screen.
  // ---------------------------------------------------------------
  function StatusFooter({ rule, note, tag }) {
    const { c } = useTheme();
    return (
      <div style={{
        height: 44, flex: "0 0 44px", display: "flex", alignItems: "center", gap: G.sp[3],
        padding: `0 ${G.sp[5]}px`, borderTop: `1px solid ${c.rule}`, boxSizing: "border-box",
        fontFamily: FONT_SANS, fontSize: 11.5, color: c.inkMuted,
      }}>
        {rule && <span>{rule}</span>}
        {rule && note && <span style={{ opacity: 0.6 }}>।</span>}
        {note && <span>{note}</span>}
        <div style={{ flex: 1 }} />
        {tag && <span style={{ fontFamily: FONT_MONO, letterSpacing: ".05em", color: c.inkMuted }}>{tag}</span>}
      </div>
    );
  }

  // ---------------------------------------------------------------
  // Register — the full-bleed table shell every dense data screen is
  // built from. Implements ALL six grammar rules:
  //   1. record margin — 2px accent left rule + numbered gutter
  //   2. hairline rows — 1px rules @ ~9%, alternating tint, no card
  //   3. everything sums — double-rule totals footer (border + an
  //      offset box-shadow line, since 2px `border-style:double`
  //      doesn't render two visible hairlines at this weight)
  //   4. state is a mark — cell content is caller-supplied; compose
  //      with `Mark`/`MusterMark`, never render a filled pill here
  //   5. figures resolve rightward — set `col.align`/`col.mono` per
  //      column so identity sits left and money sits right
  //   6. one open field — pass `row.flagged` for the accent-ring row
  //      the administrator must act on (e.g. an unassigned period)
  //
  // columns: [{ key, label, width?, flex?, align?, mono? }]
  // rows:    [{ key, cells: { [colKey]: node }, tone?, flagged? }]
  // totals:  { label, labelSpan?, cells: { [colKey]: node } }
  // ---------------------------------------------------------------
  function Register({ columns, rows, totals, rowHeight, gutter, emptyState }) {
    const { c } = useTheme();
    const cols = columns || [];
    const list = rows || [];
    const rh = rowHeight || G.metric.rowRegister;
    const showGutter = gutter !== false;
    const gridTemplate = cols.map((col) => (col.width ? `${col.width}px` : `${col.flex || 1}fr`)).join(" ");
    const labelSpan = (totals && totals.labelSpan) || 1;

    return (
      <div style={{ display: "flex", width: "100%", boxSizing: "border-box" }}>
        {showGutter && (
          <div style={{
            width: 26, flex: "0 0 26px", borderRight: `${G.metric.ruleAccent}px solid ${c.accent}`,
            background: c.gutter, paddingTop: rh, boxSizing: "border-box",
          }}>
            {list.map((r, i) => (
              <div key={r.key || i} style={{
                height: rh, display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: FONT_MONO, fontSize: 9.5, color: c.inkFaint, ...TABULAR,
              }}>
                {String(i + 1).padStart(2, "0")}
              </div>
            ))}
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          <div style={{
            display: "grid", gridTemplateColumns: gridTemplate, height: rh, alignItems: "end",
            borderBottom: `1px solid ${c.ruleStrong}`, boxSizing: "border-box",
          }}>
            {cols.map((col) => (
              <div key={col.key} style={{
                padding: `0 ${G.sp[2]}px ${G.sp[2]}px`, fontFamily: FONT_MONO, fontSize: G.metric.minMonoCaps,
                fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", color: c.inkMuted,
                textAlign: col.align || "left", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                boxSizing: "border-box",
              }}>
                {col.label}
              </div>
            ))}
          </div>

          {list.length === 0 && emptyState ? (
            <div>{emptyState}</div>
          ) : list.map((r, i) => (
            <div key={r.key || i} style={{
              display: "grid", gridTemplateColumns: gridTemplate, minHeight: rh,
              borderBottom: `1px solid ${c.rule}`, boxSizing: "border-box",
              background: r.tone ? withAlpha(toneColor(c, r.tone), 0.08) : (i % 2 ? c.alt : "transparent"),
              boxShadow: r.flagged ? `inset 0 0 0 1.5px ${c.accent}` : "none",
            }}>
              {cols.map((col) => (
                <div key={col.key} style={{
                  padding: `0 ${G.sp[2]}px`, display: "flex", alignItems: "center", minWidth: 0, boxSizing: "border-box",
                  justifyContent: col.align === "right" ? "flex-end" : col.align === "center" ? "center" : "flex-start",
                  fontFamily: col.mono ? FONT_MONO : FONT_SANS, fontSize: col.mono ? 12.5 : 13.5, color: c.ink,
                  ...(col.mono ? TABULAR : null),
                }}>
                  {r.cells ? r.cells[col.key] : null}
                </div>
              ))}
            </div>
          ))}

          {totals && (
            <div style={{
              display: "grid", gridTemplateColumns: gridTemplate, minHeight: rh + 12,
              borderTop: `1px solid ${c.ruleStrong}`, boxShadow: `0 -4px 0 0 ${c.ruleStrong}`,
              background: c.sel, boxSizing: "border-box",
            }}>
              {totals.label && (
                <div style={{
                  gridColumn: `1 / span ${labelSpan}`, display: "flex", alignItems: "center", padding: `0 ${G.sp[2]}px`,
                  fontFamily: FONT_MONO, fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: c.inkMuted,
                }}>
                  {totals.label}
                </div>
              )}
              {cols.map((col, i) => {
                if (totals.label && i < labelSpan) return null;
                const val = totals.cells && totals.cells[col.key];
                return (
                  <div key={col.key} style={{
                    display: "flex", alignItems: "center", padding: `0 ${G.sp[2]}px`, minWidth: 0, boxSizing: "border-box",
                    justifyContent: col.align === "right" ? "flex-end" : col.align === "center" ? "center" : "flex-start",
                    fontFamily: FONT_MONO, fontSize: col.emphasize ? 17 : 13, fontWeight: col.emphasize ? 700 : 600, color: c.ink,
                    ...TABULAR,
                  }}>
                    {val}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  window.UI2 = {
    ThemeProvider, useTheme, ThemeToggle,
    LangProvider, useLang, LangSwitcher, STRINGS,
    Icon, Spinner, Button, Field, Input, Select,
    Chip, StatusPill, Mark, MusterMark, Glyph,
    HoursRing, LeaveDonut, DayTimeline, WeekStripChart, DayLogRow,
    Card, Tile, SectionHeader, Figure,
    Ledger, PaydayMoment, Avatar, Seal,
    MaskedValue, EmptyState, Illustration, Skeleton,
    ActionBar, Masthead, StatusFooter, Register,
    inr, typeStyle, withAlpha, toneColors, toneColor,
    Fonts: { sans: FONT_SANS, deva: FONT_DEVA, display: FONT_DISPLAY, mono: FONT_MONO },
  };
})();
