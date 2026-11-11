/* ============================================================
   attendance.jsx — "My Attendance" monthly muster register, ported
   from design/mockups/AttendanceMuster.dc.html's register grammar
   down to SINGLE-EMPLOYEE scope (the group mockup musters 214 staff
   across 3 groups; this is one teacher's own August 2026 record).

   CONTENT ONLY — no rail/shell; renders into the full-bleed content
   region to the right of the approved Home variant A rail (mounted
   by a separate wiring pass). Composes ONLY from window.UI2
   (design/v2/kit.jsx). Classic-JSX-runtime IIFE, no imports/exports.
   Exposes window.Pages2.Attendance.

   Layout: the 31 days are laid out as a real Aug-2026 CALENDAR grid
   (Mon..Sun columns) with one Register ROW per calendar week — this
   is what gives the register its "hairline rows + numbered gutter"
   (rule 2) while still reading day-1-through-31 left-to-right, the
   same skimming pattern as the group muster mockup, just folded onto
   multiple lines instead of one 31-wide strip. Each day cell is a
   real <button> (keyboard-focusable, aria-pressed) so any day can be
   selected to drive the day-detail panel below the register (timeline
   + punches + device provenance + pay impact) — the panel is this
   page's answer to "what does today's biometric record actually
   mean for my pay", which the flat P/A/L/H mark alone can't show.

   One language rendered at a time via the shared LangProvider's lang
   state; page-local copy not already in kit.jsx's STRINGS table is
   translated through a small local dictionary (STR2/useL(), same
   pattern as pages/payslips.jsx and pages/docsprofile.jsx).
   ============================================================ */
(function () {
  const { Fragment, useState } = React;
  const G = window.G2;
  const {
    useTheme, useLang, Button, Icon, Mark, MusterMark, Figure, Fonts,
    ActionBar, Masthead, StatusFooter, Register, DayTimeline, withAlpha,
  } = window.UI2;

  function noop() {}
  function pad2(n) { return String(n).padStart(2, "0"); }

  // ---------------------------------------------------------------
  // Page-local i18n dictionary — page-specific copy not already in
  // kit.jsx's shared STRINGS table. Bound to the SAME lang the global
  // switcher drives (via useLang()'s `lang`), so there is still only
  // ever one language on screen. "LOP" (Loss of Pay) is kept as-is in
  // both languages, matching how payslips.jsx keeps PF/ESI/PT/TDS as
  // the real statutory/HR abbreviations rather than translating them.
  // ---------------------------------------------------------------
  const STR2 = {
    en: {
      "crumb.muster": "Monthly muster",
      "badge.term": "TERM 2 · 2026–27",

      "masthead.kicker": "Muster roll · 26 working days · 5 declared holidays",
      "masthead.title": "August 2026",
      "masthead.titleDeva": "उपस्थिति पंजी",

      "fig.attendance": "Attendance",
      "fig.lop": "LOP days",
      "fig.uncovered": "Uncovered",
      "fig.uncoveredSub": "Exceptions awaiting regularisation",

      "action.download": "Download muster",
      "action.regularise": "Regularise attendance",

      "legend.title": "Muster marks",
      "legend.exception": "Needs regularisation",

      "col.week": "Week of", "col.mon": "Mon", "col.tue": "Tue", "col.wed": "Wed",
      "col.thu": "Thu", "col.fri": "Fri", "col.sat": "Sat", "col.sun": "Sun",
      "col.present": "Present", "col.lop": "LOP", "col.hrs": "Hrs",

      "totals.label": "August 2026 · 26 working days",

      "panel.title": "Day record",
      "panel.timeline": "Timeline",
      "panel.punches": "Punches",
      "panel.device": "Device provenance",
      "panel.payImpact": "Pay impact",

      "punch.in": "In", "punch.out": "Out",
      "punch.breakOut": "Break out", "punch.breakIn": "Break in",
      "punch.notCaptured": "Not captured", "punch.estimated": "estimated",

      "noPunch.absent": "No punches were recorded at any gate.",
      "noPunch.leave": "On approved leave — no attendance expected.",
      "noPunch.holiday": "Declared holiday — no attendance expected.",
      "noPunch.off": "Weekly off — not a working day.",

      "device.normal": "Captured at Gate-2 · Biometric (ZKTeco F18) · both punches matched",
      "device.missing": "IN captured at Gate-2 Biometric. OUT not captured — device offline 17:10–18:20 (maintenance log #MG-2291). Hours estimated from the weekly timetable.",
      "device.halfDay": "Captured at Gate-2 · Biometric — early departure, Principal approval pending.",
      "device.na": "No device record for this day.",

      "pay.normal": "Full day credited · no deduction",
      "pay.absent": "Unauthorised absence · 1 day LOP applied",
      "pay.leaveCasual": "Casual Leave, approved by HR · fully paid",
      "pay.leaveSick": "Sick Leave, approved by HR · fully paid",
      "pay.holiday": "Paid holiday · included in salary",
      "pay.off": "Weekly off · not a working day, no deduction",
      "pay.missing": "Hours estimated · pending regularisation, auto-resolves in 3 working days",
      "pay.halfDay": "Half-day · pending Principal approval — 0.5 day LOP if unresolved by the payroll freeze",

      "leave.approvedBy": "Approved by Anita Verma, HR · 05 Aug 2026",
      "status.pendingRegularisation": "Pending regularisation",
      "status.pendingApproval": "Pending approval",

      "footer.rule": "No LOP is applied until the payroll freeze on 31 August — regularise exceptions before then",
      "footer.note": "Biometric + timetable sources reconciled 06:10 IST",
      "footer.tag": "Δ 2 EXCEPTIONS PENDING",

      "unit.aug": "Aug", "unit.augFull": "August",
    },
    hi: {
      "crumb.muster": "मासिक उपस्थिति पंजी",
      "badge.term": "सत्र 2 · 2026–27",

      "masthead.kicker": "उपस्थिति पंजी · 26 कार्यदिवस · 5 घोषित अवकाश",
      "masthead.title": "अगस्त 2026",
      "masthead.titleDeva": "उपस्थिति पंजी",

      "fig.attendance": "उपस्थिति",
      "fig.lop": "LOP दिन",
      "fig.uncovered": "अनसुलझे",
      "fig.uncoveredSub": "नियमितीकरण की प्रतीक्षा में अपवाद",

      "action.download": "पंजी डाउनलोड करें",
      "action.regularise": "उपस्थिति नियमित करें",

      "legend.title": "पंजी चिह्न",
      "legend.exception": "नियमितीकरण आवश्यक",

      "col.week": "सप्ताह", "col.mon": "सोम", "col.tue": "मंगल", "col.wed": "बुध",
      "col.thu": "गुरु", "col.fri": "शुक्र", "col.sat": "शनि", "col.sun": "रवि",
      "col.present": "उपस्थित", "col.lop": "LOP", "col.hrs": "घंटे",

      "totals.label": "अगस्त 2026 · 26 कार्यदिवस",

      "panel.title": "दिन का अभिलेख",
      "panel.timeline": "समयरेखा",
      "panel.punches": "पंचिंग प्रविष्टियाँ",
      "panel.device": "डिवाइस स्रोत",
      "panel.payImpact": "वेतन प्रभाव",

      "punch.in": "प्रवेश", "punch.out": "प्रस्थान",
      "punch.breakOut": "ब्रेक प्रारंभ", "punch.breakIn": "ब्रेक समाप्त",
      "punch.notCaptured": "दर्ज नहीं हुआ", "punch.estimated": "अनुमानित",

      "noPunch.absent": "किसी भी गेट पर कोई पंचिंग दर्ज नहीं हुई।",
      "noPunch.leave": "स्वीकृत अवकाश पर — उपस्थिति अपेक्षित नहीं।",
      "noPunch.holiday": "घोषित अवकाश — उपस्थिति अपेक्षित नहीं।",
      "noPunch.off": "साप्ताहिक अवकाश — कार्यदिवस नहीं।",

      "device.normal": "गेट-2 पर दर्ज · बायोमेट्रिक (ZKTeco F18) · दोनों पंच मेल खाए",
      "device.missing": "गेट-2 बायोमेट्रिक पर IN दर्ज हुआ। OUT दर्ज नहीं हुआ — डिवाइस 17:10–18:20 तक ऑफ़लाइन रहा (रखरखाव लॉग #MG-2291)। घंटे साप्ताहिक समय-सारणी से अनुमानित।",
      "device.halfDay": "गेट-2 बायोमेट्रिक पर दर्ज — जल्दी प्रस्थान, प्रिंसिपल की स्वीकृति लंबित।",
      "device.na": "इस दिन के लिए कोई डिवाइस अभिलेख नहीं।",

      "pay.normal": "पूर्ण दिन जमा · कोई कटौती नहीं",
      "pay.absent": "अनधिकृत अनुपस्थिति · 1 दिन का LOP लागू",
      "pay.leaveCasual": "आकस्मिक अवकाश, HR द्वारा स्वीकृत · पूर्ण वेतन सहित",
      "pay.leaveSick": "बीमारी अवकाश, HR द्वारा स्वीकृत · पूर्ण वेतन सहित",
      "pay.holiday": "सवेतन अवकाश · वेतन में शामिल",
      "pay.off": "साप्ताहिक अवकाश · कार्यदिवस नहीं, कोई कटौती नहीं",
      "pay.missing": "घंटे अनुमानित · नियमितीकरण लंबित, 3 कार्यदिवसों में स्वतः सुलझेगा",
      "pay.halfDay": "आधा दिन · प्रिंसिपल की स्वीकृति लंबित — पेरोल फ़्रीज़ तक अनसुलझा रहने पर 0.5 दिन का LOP",

      "leave.approvedBy": "अनीता वर्मा, HR द्वारा स्वीकृत · 05 अग. 2026",
      "status.pendingRegularisation": "नियमितीकरण लंबित",
      "status.pendingApproval": "स्वीकृति लंबित",

      "footer.rule": "31 अगस्त को पेरोल फ़्रीज़ तक कोई LOP लागू नहीं होता — उससे पहले अपवाद नियमित करें",
      "footer.note": "बायोमेट्रिक + समय-सारणी स्रोत 06:10 IST पर मिलान किए गए",
      "footer.tag": "Δ 2 अपवाद लंबित",

      "unit.aug": "अग.", "unit.augFull": "अगस्त",
    },
  };

  function useL() {
    const { lang } = useLang();
    return function L(key) {
      const table = STR2[lang] || STR2.en;
      return table[key] !== undefined ? table[key] : (STR2.en[key] !== undefined ? STR2.en[key] : key);
    };
  }

  // ---------------------------------------------------------------
  // Shared demo identity — same employee as pages/docsprofile.jsx
  // (Priya Sharma, NAV-0142, PGT · Chemistry, Sunrise Public School)
  // so a wiring pass that stitches these pages into one session shows
  // one consistent person, not three different teachers.
  // ---------------------------------------------------------------
  const EMPLOYEE = {
    name: "Priya Sharma", id: "NAV-0142", role: "PGT · Chemistry",
    campus: "Sunrise Public School",
  };
  const MONTHLY_GROSS = 68400; // used only to show the LOP deduction figure

  // ---------------------------------------------------------------
  // August 2026 muster data — one row per calendar day. 1 Aug 2026 is
  // a Saturday (same fact the group AttendanceMuster.dc.html mockup
  // uses). code: P present · A absent(unauthorised, LOP) · L leave ·
  // H declared holiday · "·" weekly off (Sunday). `exception` marks a
  // present day with an unresolved biometric/approval issue.
  // ---------------------------------------------------------------
  const DAY_DATA = {
    1: { code: "P", hours: 7.9 }, 2: { code: "·", hours: 0 },
    3: { code: "P", hours: 8.1 }, 4: { code: "P", hours: 7.8 }, 5: { code: "P", hours: 8.0 },
    6: { code: "A", hours: 0 }, 7: { code: "P", hours: 8.2 }, 8: { code: "P", hours: 7.6 },
    9: { code: "·", hours: 0 },
    10: { code: "P", hours: 8.0 }, 11: { code: "L", hours: 0 }, 12: { code: "P", hours: 7.9 },
    13: { code: "P", hours: 8.1 }, 14: { code: "P", hours: 7.7 }, 15: { code: "H", hours: 0 },
    16: { code: "·", hours: 0 },
    17: { code: "P", hours: 8.0 }, 18: { code: "P", hours: 7.9 },
    19: { code: "P", hours: 7.6, exception: "missingSwipe" },
    20: { code: "H", hours: 0 }, 21: { code: "P", hours: 8.1 }, 22: { code: "P", hours: 7.8 },
    23: { code: "·", hours: 0 },
    24: { code: "L", hours: 0 }, 25: { code: "P", hours: 8.0 }, 26: { code: "H", hours: 0 },
    27: { code: "P", hours: 4.1, exception: "halfDay" },
    28: { code: "H", hours: 0 }, 29: { code: "P", hours: 7.9 },
    30: { code: "·", hours: 0 },
    31: { code: "H", hours: 0 },
  };
  const LEAVE_TYPE = { 11: "casual", 24: "sick" };
  const HOLIDAY_NAMES = {
    15: { en: "Independence Day", hi: "स्वतंत्रता दिवस" },
    20: { en: "Regional Festival Holiday", hi: "क्षेत्रीय पर्व अवकाश" },
    26: { en: "Janmashtami", hi: "जन्माष्टमी" },
    28: { en: "Raksha Bandhan", hi: "रक्षाबंधन" },
    31: { en: "Founder's Day", hi: "स्थापना दिवस" },
  };

  // Mon..Sun calendar grid: one row per week, null where the day falls
  // outside August (partial first/last rows).
  function buildWeeks() {
    const weeks = [];
    let cur = [null, null, null, null, null, null, null];
    for (let day = 1; day <= 31; day++) {
      const dow = new Date(2026, 7, day).getDay(); // 0=Sun..6=Sat
      const idx = (dow + 6) % 7; // Mon=0..Sun=6
      cur[idx] = day;
      if (idx === 6) { weeks.push(cur); cur = [null, null, null, null, null, null, null]; }
    }
    if (cur.some(function (d) { return d !== null; })) weeks.push(cur);
    return weeks;
  }
  const WEEKS = buildWeeks();
  const DOW_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

  function weekTotals(week) {
    let present = 0, lop = 0, hours = 0;
    week.forEach(function (d) {
      if (d == null) return;
      const rec = DAY_DATA[d];
      if (rec.code === "P") present++;
      if (rec.code === "A") lop++;
      hours += rec.hours || 0;
    });
    return { present: present, lop: lop, hours: hours };
  }
  function weekLabel(week, L) {
    const real = week.filter(function (d) { return d != null; });
    if (!real.length) return "";
    const a = real[0], b = real[real.length - 1];
    const unit = L("unit.aug");
    return a === b ? (pad2(a) + " " + unit) : (pad2(a) + "–" + pad2(b) + " " + unit);
  }

  function computeMonthTotals() {
    let present = 0, lop = 0, leave = 0, holiday = 0, hours = 0, uncovered = 0, sundays = 0;
    Object.keys(DAY_DATA).forEach(function (k) {
      const rec = DAY_DATA[k];
      if (rec.code === "P") present++;
      if (rec.code === "A") lop++;
      if (rec.code === "L") leave++;
      if (rec.code === "H") holiday++;
      if (rec.code === "·") sundays++;
      hours += rec.hours || 0;
      if (rec.exception) uncovered++;
    });
    const workingDays = 31 - sundays;
    const scheduled = workingDays - holiday;
    const pct = scheduled > 0 ? (present / scheduled) * 100 : 0;
    return { present: present, lop: lop, leave: leave, holiday: holiday, hours: hours, uncovered: uncovered, workingDays: workingDays, scheduled: scheduled, pct: pct };
  }
  const MONTH_TOTALS = computeMonthTotals();
  const DAILY_RATE = MONTHLY_GROSS / MONTH_TOTALS.workingDays;

  function dayAriaLabel(day, rec, lang, t, L) {
    const dateObj = new Date(2026, 7, day);
    const weekday = dateObj.toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", { weekday: "long" });
    const statusLabel = rec.code === "P" ? t("today.present")
      : rec.code === "A" ? t("glyph.absent")
      : rec.code === "L" ? t("glyph.onLeave")
      : rec.code === "H" ? t("glyph.holiday")
      : t("glyph.weeklyOff");
    return day + " " + L("unit.augFull") + ", " + weekday + " — " + statusLabel;
  }

  // ---------------------------------------------------------------
  // DayCell — one calendar-day button inside the Register grid: the
  // day number (mono, tiny) over a MusterMark. A small marigold/late
  // dot marks the ONE open field — a day with an unresolved biometric
  // or approval exception (grammar rule 6: the accent ring appears
  // only where the employee must act, never decoratively).
  // ---------------------------------------------------------------
  function DayCell({ day, code, exception, selected, onSelect, ariaLabel }) {
    const { c } = useTheme();
    if (day == null) return <div style={{ width: "100%", height: "100%" }} />;
    return (
      <button
        type="button"
        onClick={function () { onSelect(day); }}
        aria-pressed={selected}
        aria-label={ariaLabel}
        style={{
          width: "100%", height: "100%", minHeight: 30, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 2, padding: "3px 0", margin: 0,
          border: "none", cursor: "pointer", font: "inherit", boxSizing: "border-box", position: "relative",
          background: selected ? withAlpha(c.accent, 0.14) : "transparent",
          boxShadow: selected ? ("inset 0 0 0 1.5px " + c.accent) : "none",
        }}
      >
        <span style={{ fontFamily: Fonts.mono, fontSize: 8, color: c.inkFaint, lineHeight: 1 }}>{pad2(day)}</span>
        <MusterMark code={code} size={16} />
        {exception && (
          <span aria-hidden="true" style={{ position: "absolute", top: 3, right: 5, width: 5, height: 5, borderRadius: "50%", background: c.late }} />
        )}
      </button>
    );
  }

  // ---------------------------------------------------------------
  // Legend — the P/A/L/H/· vocabulary spelled out once, inline (this
  // page doesn't own the rail, where the group mockup normally parks
  // its legend), plus the exception dot's meaning.
  // ---------------------------------------------------------------
  function Legend({ L, t }) {
    const { c } = useTheme();
    const items = [
      { code: "P", label: t("today.present") },
      { code: "A", label: t("glyph.absent") },
      { code: "L", label: t("glyph.onLeave") },
      { code: "H", label: t("glyph.holiday") },
      { code: "·", label: t("glyph.weeklyOff") },
    ];
    return (
      <div style={{ display: "flex", alignItems: "center", gap: G.sp[6], flexWrap: "wrap", padding: G.sp[2] + "px " + G.sp[6] + "px", borderBottom: "1px solid " + c.rule }}>
        <span style={{ fontFamily: Fonts.mono, fontSize: 9.5, letterSpacing: ".1em", textTransform: "uppercase", color: c.inkMuted }}>{L("legend.title")}</span>
        {items.map(function (it) {
          return (
            <span key={it.code} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: c.inkMuted }}>
              <MusterMark code={it.code} size={14} />{it.label}
            </span>
          );
        })}
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: c.inkMuted }}>
          <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: "50%", background: c.late, flex: "0 0 auto" }} />
          {L("legend.exception")}
        </span>
      </div>
    );
  }

  // ---------------------------------------------------------------
  // MetricFigure — Masthead's `right` slot: three plain (non-money)
  // mono figures side by side (attendance % / LOP days / uncovered),
  // matching Masthead's own figureKicker+Figure scale without routing
  // percentages/counts through Figure's ₹-prefixed inr() formatting.
  // ---------------------------------------------------------------
  function MetricFigure({ kicker, value, suffix, color, sub }) {
    const { c } = useTheme();
    return (
      <div style={{ textAlign: "right" }}>
        {kicker && <div style={{ fontFamily: Fonts.mono, fontSize: G.metric.minMonoCaps, letterSpacing: ".13em", textTransform: "uppercase", color: c.inkMuted }}>{kicker}</div>}
        <div style={{ fontFamily: Fonts.mono, fontSize: 34, fontWeight: 600, lineHeight: "42px", letterSpacing: "-0.02em", color: color || c.ink, fontFeatureSettings: "'tnum' 1, 'lnum' 1" }}>
          {value}{suffix && <span style={{ fontSize: 19, opacity: 0.6 }}>{suffix}</span>}
        </div>
        {sub && <div style={{ fontFamily: Fonts.sans, fontSize: 11, color: c.inkMuted, marginTop: 2, maxWidth: 150 }}>{sub}</div>}
      </div>
    );
  }

  // ---------------------------------------------------------------
  // Day-detail panel — timeline + punches + device provenance + pay
  // impact for whichever day is selected in the register above.
  // ---------------------------------------------------------------
  const IN_MIN = 555; // 09:15
  function punchInfo(kind, hours) {
    if (kind === "present") {
      const outMin = IN_MIN + 30 + Math.round(hours * 60);
      return { inMin: IN_MIN, breakStart: 750, breakEnd: 780, outMin: outMin, missingOut: false };
    }
    if (kind === "missing") {
      const estOut = IN_MIN + 30 + Math.round(hours * 60);
      return { inMin: IN_MIN, breakStart: 750, breakEnd: 780, outMin: null, estimatedOutMin: estOut, missingOut: true };
    }
    if (kind === "halfDay") {
      const outMin = IN_MIN + Math.round(hours * 60);
      return { inMin: IN_MIN, breakStart: null, breakEnd: null, outMin: outMin, missingOut: false };
    }
    return null;
  }
  function minutesTo12h(min) {
    const h = Math.floor(min / 60), m = min % 60;
    const ap = h >= 12 ? "PM" : "AM";
    let h12 = h % 12; if (h12 === 0) h12 = 12;
    return pad2(h12) + ":" + pad2(m) + " " + ap;
  }
  function buildDetail(day, lang) {
    const rec = DAY_DATA[day];
    const code = rec.code;
    if (code === "A") return { kind: "absent" };
    if (code === "L") return { kind: "leave", leaveType: LEAVE_TYPE[day] || "casual" };
    if (code === "H") { const nm = HOLIDAY_NAMES[day] || {}; return { kind: "holiday", name: nm[lang] || nm.en }; }
    if (code === "·") return { kind: "off" };
    if (rec.exception === "missingSwipe") return { kind: "missing", hours: rec.hours };
    if (rec.exception === "halfDay") return { kind: "halfDay", hours: rec.hours };
    return { kind: "present", hours: rec.hours };
  }

  function PanelLabel({ children }) {
    const { c } = useTheme();
    return <div style={{ fontFamily: Fonts.mono, fontSize: 9.5, letterSpacing: ".1em", textTransform: "uppercase", color: c.inkMuted, marginBottom: 8 }}>{children}</div>;
  }

  function NoPunchNote({ text }) {
    const { c } = useTheme();
    return (
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 12px", background: c.alt, border: "1px solid " + c.rule, boxSizing: "border-box" }}>
        <Icon name="info" size={14} color={c.inkFaint} style={{ marginTop: 1, flex: "0 0 auto" }} />
        <span style={{ fontFamily: Fonts.sans, fontSize: 12.5, color: c.inkMuted, lineHeight: 1.5 }}>{text}</span>
      </div>
    );
  }

  function PunchRow({ label, time, missing, estimate, L }) {
    const { c } = useTheme();
    return (
      <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid " + c.rule, fontFamily: Fonts.sans, fontSize: 12.5 }}>
        <span style={{ color: c.inkMuted }}>{label}</span>
        {missing ? (
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontFamily: Fonts.mono, color: c.late }}>{L("punch.notCaptured")}</span>
            {estimate != null && <span style={{ fontFamily: Fonts.mono, color: c.inkFaint, fontSize: 11 }}>({minutesTo12h(estimate)} {L("punch.estimated")})</span>}
          </span>
        ) : (
          <span style={{ fontFamily: Fonts.mono, color: c.ink, fontFeatureSettings: "'tnum' 1, 'lnum' 1" }}>{minutesTo12h(time)}</span>
        )}
      </div>
    );
  }

  function noPunchText(kind, L) {
    if (kind === "leave") return L("noPunch.leave");
    if (kind === "holiday") return L("noPunch.holiday");
    if (kind === "off") return L("noPunch.off");
    return L("noPunch.absent");
  }
  function deviceText(detail, L) {
    if (detail.kind === "present") return L("device.normal");
    if (detail.kind === "missing") return L("device.missing");
    if (detail.kind === "halfDay") return L("device.halfDay");
    return L("device.na");
  }
  function payImpactBlock(detail, L, c) {
    if (detail.kind === "absent") {
      return (
        <div>
          <Mark tone="danger" glyph="▣">{L("pay.absent")}</Mark>
          <div style={{ marginTop: 6 }}><Figure value={DAILY_RATE} negative color={c.danger} /></div>
        </div>
      );
    }
    if (detail.kind === "leave") {
      return (
        <div>
          <Mark tone="leave" glyph="◌">{detail.leaveType === "sick" ? L("pay.leaveSick") : L("pay.leaveCasual")}</Mark>
          <div style={{ fontFamily: Fonts.sans, fontSize: 11.5, color: c.inkMuted, marginTop: 6 }}>{L("leave.approvedBy")}</div>
        </div>
      );
    }
    if (detail.kind === "holiday") return <Mark tone="holiday" glyph="◍">{L("pay.holiday")}</Mark>;
    if (detail.kind === "off") return <Mark tone="off" glyph="·">{L("pay.off")}</Mark>;
    if (detail.kind === "missing") return <Mark tone="late" glyph="◌">{L("pay.missing")}</Mark>;
    if (detail.kind === "halfDay") return <Mark tone="late" glyph="◌">{L("pay.halfDay")}</Mark>;
    return <Mark tone="present" glyph="⦾">{L("pay.normal")}</Mark>;
  }

  function DetailPanel({ day, L, lang, t }) {
    const { c } = useTheme();
    const rec = DAY_DATA[day];
    const detail = buildDetail(day, lang);
    const dateObj = new Date(2026, 7, day);
    const locale = lang === "hi" ? "hi-IN" : "en-IN";
    const weekdayName = dateObj.toLocaleDateString(locale, { weekday: "long" });
    const dateLabel = dateObj.toLocaleDateString(locale, { day: "2-digit", month: "long", year: "numeric" });

    const statusMark = (function () {
      if (detail.kind === "present") return { tone: "present", glyph: "⦾", label: t("today.present") };
      if (detail.kind === "absent") return { tone: "danger", glyph: "▣", label: t("glyph.absent") };
      if (detail.kind === "leave") return { tone: "leave", glyph: "◌", label: t("glyph.onLeave") };
      if (detail.kind === "holiday") return { tone: "holiday", glyph: "◍", label: t("glyph.holiday") };
      if (detail.kind === "off") return { tone: "off", glyph: "·", label: t("glyph.weeklyOff") };
      if (detail.kind === "missing") return { tone: "late", glyph: "◌", label: L("status.pendingRegularisation") };
      return { tone: "late", glyph: "◌", label: L("status.pendingApproval") };
    })();

    const punches = (detail.kind === "present" || detail.kind === "missing" || detail.kind === "halfDay")
      ? punchInfo(detail.kind, detail.hours) : null;

    return (
      <div style={{ border: "1px solid " + c.rule, boxSizing: "border-box" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: G.sp[3], padding: G.sp[4] + "px " + G.sp[5] + "px", borderBottom: "1px solid " + c.rule, background: c.alt, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontFamily: Fonts.mono, fontSize: G.metric.minMonoCaps, letterSpacing: ".13em", textTransform: "uppercase", color: c.inkMuted }}>{L("panel.title")}</div>
            <div style={{ fontFamily: Fonts.display, fontSize: 20, fontWeight: 600, letterSpacing: "-0.01em", color: c.ink, marginTop: 2 }}>{weekdayName}, {dateLabel}</div>
            {detail.kind === "holiday" && <div style={{ fontFamily: Fonts.sans, fontSize: 12.5, color: c.holiday, marginTop: 2 }}>{detail.name}</div>}
          </div>
          <Mark tone={statusMark.tone} glyph={statusMark.glyph}>{statusMark.label}</Mark>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: G.sp[6], padding: G.sp[5] + "px" }}>
          <div style={{ flex: "1 1 320px", minWidth: 280 }}>
            <PanelLabel>{L("panel.timeline")}</PanelLabel>
            {punches ? (
              <Fragment>
                <DayTimeline
                  startMin={480} endMin={1140}
                  worked={[[punches.inMin, punches.outMin != null ? punches.outMin : punches.estimatedOutMin]]}
                  breaks={punches.breakStart != null ? [[punches.breakStart, punches.breakEnd]] : []}
                />
                <div style={{ marginTop: G.sp[4] }}>
                  <PanelLabel>{L("panel.punches")}</PanelLabel>
                  <PunchRow label={L("punch.in")} time={punches.inMin} L={L} />
                  {punches.breakStart != null && <PunchRow label={L("punch.breakOut")} time={punches.breakStart} L={L} />}
                  {punches.breakStart != null && <PunchRow label={L("punch.breakIn")} time={punches.breakEnd} L={L} />}
                  <PunchRow label={L("punch.out")} time={punches.outMin} missing={punches.missingOut} estimate={punches.missingOut ? punches.estimatedOutMin : null} L={L} />
                </div>
              </Fragment>
            ) : (
              <NoPunchNote text={noPunchText(detail.kind, L)} />
            )}
          </div>

          <div style={{ flex: "1 1 220px", minWidth: 220 }}>
            <PanelLabel>{L("panel.device")}</PanelLabel>
            <div style={{ fontFamily: Fonts.sans, fontSize: 13, color: c.ink, lineHeight: 1.5 }}>{deviceText(detail, L)}</div>
          </div>

          <div style={{ flex: "1 1 240px", minWidth: 240 }}>
            <PanelLabel>{L("panel.payImpact")}</PanelLabel>
            {payImpactBlock(detail, L, c)}
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------
  // AttendanceMuster — the exported, content-only screen.
  // ---------------------------------------------------------------
  function AttendanceMuster() {
    const { c } = useTheme();
    const { lang, t } = useLang();
    const L = useL();
    const [selectedDay, setSelectedDay] = useState(19); // opens on the unresolved exception day

    const columns = [
      { key: "week", label: L("col.week"), flex: 1 },
      { key: "mon", label: L("col.mon"), width: 46, align: "center" },
      { key: "tue", label: L("col.tue"), width: 46, align: "center" },
      { key: "wed", label: L("col.wed"), width: 46, align: "center" },
      { key: "thu", label: L("col.thu"), width: 46, align: "center" },
      { key: "fri", label: L("col.fri"), width: 46, align: "center" },
      { key: "sat", label: L("col.sat"), width: 46, align: "center" },
      { key: "sun", label: L("col.sun"), width: 46, align: "center" },
      { key: "present", label: L("col.present"), width: 68, align: "right", mono: true },
      { key: "lop", label: L("col.lop"), width: 56, align: "right", mono: true },
      { key: "hrs", label: L("col.hrs"), width: 80, align: "right", mono: true, emphasize: true },
    ];

    const rows = WEEKS.map(function (week, wi) {
      const wt = weekTotals(week);
      const cells = {
        week: <span style={{ fontFamily: Fonts.mono, fontSize: 12, color: c.inkMuted }}>{weekLabel(week, L)}</span>,
      };
      week.forEach(function (day, di) {
        const key = DOW_KEYS[di];
        if (day == null) { cells[key] = null; return; }
        const rec = DAY_DATA[day];
        cells[key] = (
          <DayCell
            day={day} code={rec.code} exception={!!rec.exception}
            selected={selectedDay === day} onSelect={setSelectedDay}
            ariaLabel={dayAriaLabel(day, rec, lang, t, L)}
          />
        );
      });
      cells.present = <span>{wt.present}</span>;
      cells.lop = <span style={{ color: wt.lop > 0 ? c.danger : c.inkFaint }}>{wt.lop > 0 ? wt.lop : "—"}</span>;
      cells.hrs = <span>{wt.hours.toFixed(1)}h</span>;
      return { key: "wk" + wi, cells: cells };
    });

    const totalsRow = {
      label: L("totals.label"), labelSpan: 8,
      cells: {
        present: <span style={{ color: c.ink }}>{MONTH_TOTALS.present}</span>,
        lop: <span style={{ color: MONTH_TOTALS.lop > 0 ? c.danger : c.inkFaint }}>{MONTH_TOTALS.lop > 0 ? MONTH_TOTALS.lop : "—"}</span>,
        hrs: <span>{MONTH_TOTALS.hours.toFixed(1)}h</span>,
      },
    };

    const employeeMeta = [EMPLOYEE.name, EMPLOYEE.role, EMPLOYEE.id, EMPLOYEE.campus].join(" · ");

    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, background: c.bg }}>
        <ActionBar breadcrumbs={[t("nav.attendance"), L("crumb.muster")]} badge={L("badge.term")}>
          <Button variant="ghost" size="sm" onClick={noop}>
            <Icon name="document" size={13} color={c.ink} />{L("action.download")}
          </Button>
          <Button variant="primary" size="sm" onClick={noop}>
            {L("action.regularise")} · {MONTH_TOTALS.uncovered}
          </Button>
        </ActionBar>

        <Masthead
          kicker={L("masthead.kicker")}
          title={L("masthead.title")}
          titleDeva={L("masthead.titleDeva")}
          meta={employeeMeta}
          right={
            <div style={{ display: "flex", gap: G.sp[6] }}>
              <MetricFigure kicker={L("fig.attendance")} value={MONTH_TOTALS.pct.toFixed(1)} suffix="%" />
              <MetricFigure kicker={L("fig.lop")} value={MONTH_TOTALS.lop} color={MONTH_TOTALS.lop > 0 ? c.danger : c.ink} />
              <MetricFigure kicker={L("fig.uncovered")} value={MONTH_TOTALS.uncovered} color={MONTH_TOTALS.uncovered > 0 ? c.seal : c.ink} sub={L("fig.uncoveredSub")} />
            </div>
          }
        />

        <div style={{ flex: "1 1 auto", minHeight: 0, overflowY: "auto" }}>
          <Legend L={L} t={t} />

          <div style={{ padding: "0 " + G.sp[6] + "px" }}>
            <Register columns={columns} rows={rows} totals={totalsRow} rowHeight={G.metric.rowMuster} />
          </div>

          <div style={{ margin: G.sp[6] + "px", padding: 0 }}>
            <DetailPanel day={selectedDay} L={L} lang={lang} t={t} />
          </div>
        </div>

        <StatusFooter rule={L("footer.rule")} note={L("footer.note")} tag={L("footer.tag")} />
      </div>
    );
  }

  window.Pages2 = window.Pages2 || {};
  window.Pages2.Attendance = AttendanceMuster;
})();
