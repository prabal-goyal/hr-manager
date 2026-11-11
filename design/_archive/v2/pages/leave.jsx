/* ============================================================
   design/v2/pages/leave.jsx — Naveya "Leave ledger" (STAFFROOM v2).
   Composes ONLY from window.UI2 (design/v2/kit.jsx) + window.G2.
   Self-contained IIFE, classic-JSX runtime, no imports/exports,
   inline styles only. CONTENT ONLY — a wiring agent mounts this
   inside the approved shell/rail; this file owns its own ActionBar,
   Masthead, register(s) and StatusFooter but not the app chrome.
   Exposes: window.Pages2.Leave

   i18n: extends window.UI2.STRINGS.{en,hi} in place (additive,
   "leave.*" namespace) so the SAME useLang()/t() the rest of the
   app uses picks these strings up — no separate local dictionary.
   Reuses a few keys kit.jsx already ships (leave.applyLeave,
   leave.vacationHint, leave.casual/sick/comp, leave.daysAvailable,
   leave.na) instead of redefining them.
   ============================================================ */
(function () {
  const { useState } = React;
  const G = window.G2;
  const UI2 = window.UI2;
  const {
    useTheme, useLang, Icon, Button, Field, Input, Select, Chip, Mark,
    Card, SectionHeader, Figure, Avatar, ActionBar, Masthead,
    StatusFooter, Register, inr, Fonts,
  } = UI2;

  // ---------------------------------------------------------------
  // i18n — additive registration into the shared kit STRINGS table.
  // ---------------------------------------------------------------
  const STRINGS_EN = {
    "leave.title": "Leave ledger",
    "leave.titleDeva": "अवकाश बही",
    "leave.kicker": "LEAVE LEDGER · SESSION 2026–27 · TERM 2",
    "leave.meta": "PGT · NAV-1042 · Sunrise Public School, Sector 21",
    "leave.availableKicker": "TOTAL AVAILABLE",
    "leave.asOf": "As of",
    "leave.ledgerHeading": "Leave-type ledger",
    "leave.historyHeading": "Recent applications",
    "leave.colType": "LEAVE TYPE", "leave.colOpening": "OPENING",
    "leave.colCredited": "CREDITED", "leave.colDebited": "DEBITED",
    "leave.colAvailable": "AVAILABLE", "leave.colState": "STATE",
    "leave.type.el.title": "Earned Leave / Vacation",
    "leave.type.cl.title": "Casual Leave",
    "leave.type.sl.title": "Sick Leave",
    "leave.type.comp.title": "Comp-off",
    "leave.type.lop.title": "Loss of Pay",
    "leave.state.inLieu": "Granted in lieu",
    "leave.state.fixedGrant": "Fixed annual grant",
    "leave.state.accrues": "Accrues on verified duty",
    "leave.state.unpaid": "Unpaid",
    "leave.totalsLabel": "SESSION TOTAL",
    "leave.colRecord": "RECORD", "leave.colApplied": "APPLIED",
    "leave.colDates": "DATES", "leave.colDays": "DAYS", "leave.colStatus": "STATUS",
    "leave.statusApproved": "Approved", "leave.statusPending": "Pending",
    "leave.statusRejected": "Rejected",
    "leave.fromLabel": "From", "leave.toLabel": "To",
    "leave.dayType": "Day type", "leave.dayFull": "Full day",
    "leave.dayHalf": "Half day", "leave.dayPeriod": "Period-level",
    "leave.periodsLabel": "Periods",
    "leave.period.p12": "Periods 1–2", "leave.period.p34": "Periods 3–4",
    "leave.period.p56": "Periods 5–6", "leave.period.p78": "Periods 7–8",
    "leave.reasonLabel": "Reason",
    "leave.reasonPlaceholder": "Brief reason for leave",
    "leave.reasonRequired": "Reason is required before submitting",
    "leave.submit": "Submit for approval", "leave.saveDraft": "Save draft",
    "leave.approverLabel": "Approver",
    "leave.approverName": "Meera Iyer",
    "leave.approverRole": "Principal · Sunrise Public School",
    "leave.previewLabel": "Preview",
    "leave.requestedDays": "Requested", "leave.paidDaysLabel": "Paid days",
    "leave.lopDaysLabel": "LOP days",
    "leave.blackoutOverlapPrefix": "Exam blackout",
    "leave.blackoutOverlapSuffix": "restricted — this request overlaps the window; approval needs HoD sign-off.",
    "leave.blackoutInfoSuffix": "restricted for all teaching staff.",
    "leave.sessionBadge": "SESSION 2026–27",
    "leave.campusChip": "Sunrise Public School · Sector 21",
    "leave.footerRule": "No more than 2 staff from one department on Casual Leave the same day",
    "leave.footerNoteSuffix": "request pending approval",
    "leave.footerTag": "ACADEMIC YEAR 2026–27",
    "leave.hintSingleDayOnly": "Half-day and period-level apply to single-day requests only",
  };
  const STRINGS_HI = {
    "leave.title": "अवकाश बही",
    "leave.titleDeva": "अवकाश बही",
    "leave.kicker": "अवकाश बही · सत्र 2026–27 · टर्म 2",
    "leave.meta": "PGT · NAV-1042 · Sunrise Public School, Sector 21",
    "leave.availableKicker": "कुल उपलब्ध",
    "leave.asOf": "अद्यतन",
    "leave.ledgerHeading": "अवकाश-प्रकार बही",
    "leave.historyHeading": "हाल के आवेदन",
    "leave.colType": "अवकाश प्रकार", "leave.colOpening": "प्रारंभिक",
    "leave.colCredited": "जमा", "leave.colDebited": "नामे",
    "leave.colAvailable": "उपलब्ध", "leave.colState": "स्थिति",
    "leave.type.el.title": "अर्जित अवकाश / वेकेशन",
    "leave.type.cl.title": "आकस्मिक अवकाश",
    "leave.type.sl.title": "बीमारी अवकाश",
    "leave.type.comp.title": "कॉम्प-ऑफ",
    "leave.type.lop.title": "बिना वेतन अवकाश",
    "leave.state.inLieu": "प्रतिस्थानी रूप में स्वीकृत",
    "leave.state.fixedGrant": "निश्चित वार्षिक अनुदान",
    "leave.state.accrues": "सत्यापित ड्यूटी पर अर्जित",
    "leave.state.unpaid": "अवैतनिक",
    "leave.totalsLabel": "सत्र कुल",
    "leave.colRecord": "अभिलेख", "leave.colApplied": "आवेदित",
    "leave.colDates": "तिथियाँ", "leave.colDays": "दिन", "leave.colStatus": "स्थिति",
    "leave.statusApproved": "स्वीकृत", "leave.statusPending": "लंबित",
    "leave.statusRejected": "अस्वीकृत",
    "leave.fromLabel": "से", "leave.toLabel": "तक",
    "leave.dayType": "दिन प्रकार", "leave.dayFull": "पूरा दिन",
    "leave.dayHalf": "आधा दिन", "leave.dayPeriod": "अवधि-स्तर",
    "leave.periodsLabel": "अवधियाँ",
    "leave.period.p12": "अवधि 1–2", "leave.period.p34": "अवधि 3–4",
    "leave.period.p56": "अवधि 5–6", "leave.period.p78": "अवधि 7–8",
    "leave.reasonLabel": "कारण",
    "leave.reasonPlaceholder": "अवकाश का संक्षिप्त कारण",
    "leave.reasonRequired": "जमा करने से पहले कारण आवश्यक है",
    "leave.submit": "स्वीकृति हेतु जमा करें", "leave.saveDraft": "मसौदा सहेजें",
    "leave.approverLabel": "स्वीकृतकर्ता",
    "leave.approverName": "मीरा अय्यर",
    "leave.approverRole": "प्रधानाचार्य · Sunrise Public School",
    "leave.previewLabel": "पूर्वावलोकन",
    "leave.requestedDays": "अनुरोधित", "leave.paidDaysLabel": "सवैतनिक दिन",
    "leave.lopDaysLabel": "बिना वेतन दिन",
    "leave.blackoutOverlapPrefix": "परीक्षा अवधि",
    "leave.blackoutOverlapSuffix": "प्रतिबंधित — यह अनुरोध उस अवधि से मेल खाता है; स्वीकृति हेतु विभागाध्यक्ष की सहमति आवश्यक है।",
    "leave.blackoutInfoSuffix": "सभी शिक्षण स्टाफ के लिए प्रतिबंधित।",
    "leave.sessionBadge": "सत्र 2026–27",
    "leave.campusChip": "Sunrise Public School · Sector 21",
    "leave.footerRule": "एक विभाग से एक ही दिन 2 से अधिक स्टाफ आकस्मिक अवकाश पर नहीं",
    "leave.footerNoteSuffix": "अनुरोध स्वीकृति हेतु लंबित",
    "leave.footerTag": "शैक्षणिक वर्ष 2026–27",
    "leave.hintSingleDayOnly": "आधा दिन और अवधि-स्तर केवल एकल-दिवसीय अनुरोधों पर लागू होते हैं",
  };
  if (UI2.STRINGS) {
    Object.assign(UI2.STRINGS.en, STRINGS_EN);
    Object.assign(UI2.STRINGS.hi, STRINGS_HI);
  }

  // ---------------------------------------------------------------
  // Date helpers (presentation-layer only; no vendor calendar wired)
  // ---------------------------------------------------------------
  function diffDaysInclusive(a, b) {
    if (!a || !b) return 0;
    const d1 = new Date(a + "T00:00:00");
    const d2 = new Date(b + "T00:00:00");
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0;
    const days = Math.round((d2 - d1) / 86400000) + 1;
    return days > 0 ? days : 0;
  }
  function rangesOverlap(aStart, aEnd, bStart, bEnd) {
    if (!aStart || !aEnd) return false;
    return aStart <= bEnd && bStart <= aEnd;
  }

  // ---------------------------------------------------------------
  // Reference data — academic year Apr 2026 -> Mar 2027, Term 2.
  // Vacation staff (this employee, PGT NAV-1042): Earned Leave is
  // NOT accrued — vacation is granted in lieu, so EL/Vacation is
  // dash-valued in the ledger (see leave.vacationHint note below it).
  // ---------------------------------------------------------------
  const BLACKOUT = { start: "2026-09-14", end: "2026-09-20", label: "14–20 Sep 2026" };

  const LEDGER = [
    { key: "EL", titleKey: "leave.type.el.title", opening: null, credit: null, debit: null, closing: null, tone: "inkMuted", glyph: "◌", stateKey: "leave.state.inLieu" },
    { key: "CL", titleKey: "leave.type.cl.title", opening: 12, credit: 0, debit: 5, closing: 7, tone: "present", glyph: "⦾", stateKey: "leave.state.fixedGrant" },
    { key: "SL", titleKey: "leave.type.sl.title", opening: 10, credit: 0, debit: 2, closing: 8, tone: "present", glyph: "⦾", stateKey: "leave.state.fixedGrant" },
    { key: "COMP", titleKey: "leave.type.comp.title", opening: 0, credit: 3, debit: 1, closing: 2, tone: "accent", glyph: "⦾", stateKey: "leave.state.accrues" },
    { key: "LOP", titleKey: "leave.type.lop.title", opening: null, credit: null, debit: 3, closing: null, tone: "danger", glyph: "▣", stateKey: "leave.state.unpaid" },
  ];

  const HISTORY = [
    { key: "NAV-LV-2041", applied: "15 Jul 2026", typeKey: "leave.type.cl.title", dates: "20–21 Jul 2026", days: 2, status: "Approved" },
    { key: "NAV-LV-2038", applied: "02 Jul 2026", typeKey: "leave.type.sl.title", dates: "03 Jul 2026 · Half day", days: 0.5, status: "Pending" },
    { key: "NAV-LV-2029", applied: "18 Jun 2026", typeKey: "leave.type.comp.title", dates: "22 Jun 2026", days: 1, status: "Approved" },
    { key: "NAV-LV-2015", applied: "05 Jun 2026", typeKey: "leave.type.cl.title", dates: "08 Jun 2026 · Periods 5–6", days: 0.25, status: "Rejected" },
    { key: "NAV-LV-1994", applied: "10 May 2026", typeKey: "leave.type.lop.title", dates: "12–13 May 2026", days: 2, status: "Approved" },
  ];

  const LEAVE_TYPE_OPTIONS = [
    { value: "CL", key: "cl", titleKey: "leave.type.cl.title", balance: 7 },
    { value: "SL", key: "sl", titleKey: "leave.type.sl.title", balance: 8 },
    { value: "COMP", key: "comp", titleKey: "leave.type.comp.title", balance: 2 },
    { value: "LOP", key: "lop", titleKey: "leave.type.lop.title", balance: 0, isLOP: true },
  ];

  const PERIOD_SLOTS = [
    { value: "p12", labelKey: "leave.period.p12", frac: 0.25 },
    { value: "p34", labelKey: "leave.period.p34", frac: 0.25 },
    { value: "p56", labelKey: "leave.period.p56", frac: 0.25 },
    { value: "p78", labelKey: "leave.period.p78", frac: 0.25 },
  ];

  const DAY_MODES = [
    { value: "full", labelKey: "leave.dayFull" },
    { value: "half", labelKey: "leave.dayHalf" },
    { value: "period", labelKey: "leave.dayPeriod" },
  ];

  // ---------------------------------------------------------------
  // fmtDays(n) — for Register TOTALS cells only (a plain string, so
  // the outer totals-row div's own font/weight styling applies — a
  // <Figure/> node carries its own inline font styles that would
  // override the totals row's emphasize sizing). Row-level cells use
  // <Figure/> directly for the richer tabular-mono treatment.
  // ---------------------------------------------------------------
  function fmtDays(n) {
    return inr(n, 2);
  }

  // ---------------------------------------------------------------
  // DayFigure — a day-count figure (not money): Figure with an empty
  // currency symbol keeps the tight right-aligned tabular-mono look
  // without a stray ₹. Dash for N/A (EL in-lieu / LOP has no balance).
  // ---------------------------------------------------------------
  function DayFigure({ value, weight, color }) {
    const { c } = useTheme();
    if (value === null || value === undefined) {
      return <span style={{ fontFamily: Fonts.mono, fontSize: 13, color: c.inkFaint }}>—</span>;
    }
    return <Figure value={value} currency="" display size={13} weight={weight || 500} color={color} />;
  }

  // ---------------------------------------------------------------
  // Register cell text — nowrap + ellipsis, matches Register's own
  // column-header defensive styling; keeps every row single-line so
  // the numbered gutter (fixed row height) never drifts out of sync
  // with a row that grew taller than rowHeight from wrapped text.
  // ---------------------------------------------------------------
  function CellText({ children, muted, mono }) {
    const { c } = useTheme();
    return (
      <span style={{
        fontFamily: mono ? Fonts.mono : Fonts.sans, fontSize: mono ? 12.5 : 13.5,
        fontWeight: mono ? 600 : 600, color: muted ? c.inkMuted : c.ink,
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block",
      }}>
        {children}
      </span>
    );
  }

  // ---------------------------------------------------------------
  // Local form primitives not (yet) in the kit — Textarea and a
  // day-mode segmented control. Candidates for kit promotion; see
  // the dispatch report.
  // ---------------------------------------------------------------
  function Textarea({ value, onChange, placeholder, rows, error }) {
    const { c } = useTheme();
    const [focused, setFocused] = useState(false);
    return (
      <textarea
        value={value} onChange={onChange} placeholder={placeholder} rows={rows || 3}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          font: "inherit", fontFamily: Fonts.sans, fontSize: 14, width: "100%", boxSizing: "border-box",
          resize: "vertical", borderRadius: 0, background: c.surface, color: c.ink,
          border: `1.5px solid ${error ? c.danger : focused ? c.accent : c.border}`,
          outline: focused ? `2px solid ${c.focus}` : "2px solid transparent", outlineOffset: 2,
          padding: `${G.sp[2]}px ${G.sp[3]}px`, transition: `border 120ms ${G.mo.ease.outQuart}`,
        }}
      />
    );
  }

  function DaySegmented({ options, value, onChange, disabled }) {
    const { c } = useTheme();
    return (
      <div style={{ display: "inline-flex", border: `1px solid ${c.border}`, width: "fit-content" }}>
        {options.map((o, i) => {
          const active = o.value === value;
          return (
            <button
              key={o.value} type="button" disabled={disabled} onClick={() => onChange(o.value)}
              style={{
                fontFamily: Fonts.sans, fontSize: 12.5, fontWeight: 600, padding: "7px 14px",
                background: active ? c.action : "transparent", color: active ? c.onAction : c.ink,
                border: "none", borderRadius: 0,
                borderRight: i < options.length - 1 ? `1px solid ${c.border}` : "none",
                cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.45 : 1,
              }}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    );
  }

  function PreviewRow({ label, value, tone, last }) {
    const { c } = useTheme();
    const color = tone === "success" ? c.present : tone === "danger" ? c.danger : tone === "muted" ? c.inkMuted : c.ink;
    return (
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "baseline",
        padding: `${G.sp["1.5"]}px 0`, borderBottom: last ? "none" : `1px solid ${c.rule}`,
      }}>
        <span style={{ fontFamily: Fonts.sans, fontSize: 13, color: c.ink }}>{label}</span>
        <Figure value={value} currency="" display size={14} weight={600} color={color} />
      </div>
    );
  }

  // ---------------------------------------------------------------
  // ApplyLeavePanel — grammar rule 6, "one open field": the ONLY
  // accent ring on the screen sits on this panel (no Register row is
  // flagged). Live LOP/paid-days preview + exam-blackout awareness.
  // Submit stays enabled even when invalid (never a disabled-submit
  // dead-end) — validation surfaces on click via the Field error.
  // ---------------------------------------------------------------
  function ApplyLeavePanel() {
    const { c } = useTheme();
    const { t } = useLang();
    const [leaveType, setLeaveType] = useState("CL");
    const [fromDate, setFromDate] = useState("2026-08-24");
    const [toDate, setToDate] = useState("2026-08-25");
    const [dayMode, setDayMode] = useState("full");
    const [periodSlot, setPeriodSlot] = useState(PERIOD_SLOTS[0].value);
    const [reason, setReason] = useState("");
    const [attempted, setAttempted] = useState(false);

    const singleDay = !!fromDate && !!toDate && fromDate === toDate;
    const effectiveMode = singleDay ? dayMode : "full";
    const slot = PERIOD_SLOTS.find((p) => p.value === periodSlot) || PERIOD_SLOTS[0];
    const totalDays = !fromDate || !toDate
      ? 0
      : singleDay
        ? (effectiveMode === "half" ? 0.5 : effectiveMode === "period" ? slot.frac : 1)
        : diffDaysInclusive(fromDate, toDate);

    const type = LEAVE_TYPE_OPTIONS.find((o) => o.value === leaveType) || LEAVE_TYPE_OPTIONS[0];
    const paidDays = type.isLOP ? 0 : Math.min(type.balance, totalDays);
    const lopDays = type.isLOP ? totalDays : Math.max(0, totalDays - type.balance);
    const blackout = rangesOverlap(fromDate, toDate, BLACKOUT.start, BLACKOUT.end);
    const reasonError = attempted && !reason.trim() ? t("leave.reasonRequired") : undefined;

    return (
      <Card padding={G.sp[6]} style={{ boxShadow: `inset 0 0 0 1.5px ${c.accent}` }}>
        <div style={{ display: "flex", gap: G.sp[8], flexWrap: "wrap" }}>
          <div style={{ flex: "1.3 1 360px", minWidth: 300, display: "flex", flexDirection: "column", gap: G.sp[4] }}>
            <Field label={t("leave.colType")} required>
              <Select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value)}
                options={LEAVE_TYPE_OPTIONS.map((o) => ({
                  value: o.value,
                  label: o.isLOP ? t(o.titleKey) : `${t(o.titleKey)} · ${o.balance.toFixed(2)} ${t("leave.daysAvailable")}`,
                }))}
              />
            </Field>

            <div style={{ display: "flex", gap: G.sp[3], flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 140px" }}>
                <Field label={t("leave.fromLabel")}>
                  <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                </Field>
              </div>
              <div style={{ flex: "1 1 140px" }}>
                <Field label={t("leave.toLabel")}>
                  <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                </Field>
              </div>
            </div>

            <Field label={t("leave.dayType")} hint={!singleDay ? t("leave.hintSingleDayOnly") : undefined}>
              <DaySegmented
                options={DAY_MODES.map((m) => ({ value: m.value, label: t(m.labelKey) }))}
                value={effectiveMode} onChange={setDayMode} disabled={!singleDay}
              />
            </Field>

            {singleDay && dayMode === "period" && (
              <Field label={t("leave.periodsLabel")}>
                <Select
                  value={periodSlot} onChange={(e) => setPeriodSlot(e.target.value)}
                  options={PERIOD_SLOTS.map((p) => ({ value: p.value, label: t(p.labelKey) }))}
                />
              </Field>
            )}

            <Field label={t("leave.reasonLabel")} required error={reasonError}>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t("leave.reasonPlaceholder")} rows={3} error={reasonError} />
            </Field>

            <div style={{ display: "flex", gap: G.sp[3], marginTop: G.sp[1] }}>
              <Button variant="primary" onClick={() => setAttempted(true)}>{t("leave.submit")}</Button>
              <Button variant="ghost">{t("leave.saveDraft")}</Button>
            </div>
          </div>

          <div style={{ flex: "1 1 260px", minWidth: 260, borderLeft: `1px solid ${c.rule}`, paddingLeft: G.sp[6], display: "flex", flexDirection: "column", gap: G.sp[5] }}>
            <div>
              <div style={{ fontFamily: Fonts.mono, fontSize: 10.5, letterSpacing: ".08em", textTransform: "uppercase", color: c.inkMuted, marginBottom: G.sp[2] }}>{t("leave.approverLabel")}</div>
              <div style={{ display: "flex", alignItems: "center", gap: G.sp[3] }}>
                <Avatar initials="MI" size={30} />
                <div>
                  <div style={{ fontFamily: Fonts.sans, fontSize: 13, fontWeight: 600, color: c.ink }}>{t("leave.approverName")}</div>
                  <div style={{ fontFamily: Fonts.sans, fontSize: 11.5, color: c.inkMuted }}>{t("leave.approverRole")}</div>
                </div>
              </div>
            </div>

            <div>
              <div style={{ fontFamily: Fonts.mono, fontSize: 10.5, letterSpacing: ".08em", textTransform: "uppercase", color: c.inkMuted, marginBottom: G.sp[2] }}>{t("leave.previewLabel")}</div>
              <PreviewRow label={t("leave.requestedDays")} value={totalDays} />
              <PreviewRow label={t("leave.paidDaysLabel")} value={paidDays} tone="success" />
              <PreviewRow label={t("leave.lopDaysLabel")} value={lopDays} tone={lopDays > 0 ? "danger" : "muted"} last />
            </div>

            {blackout ? (
              <div style={{ display: "flex", gap: G.sp[2], alignItems: "flex-start" }}>
                <Icon name="alert" size={13} color={c.danger} strokeWidth={2.2} style={{ marginTop: 2, flex: "0 0 auto" }} />
                <span style={{ fontFamily: Fonts.sans, fontSize: 12, color: c.danger }}>
                  {t("leave.blackoutOverlapPrefix")} {BLACKOUT.label}: {t("leave.blackoutOverlapSuffix")}
                </span>
              </div>
            ) : (
              <div style={{ display: "flex", gap: G.sp[2], alignItems: "flex-start" }}>
                <Icon name="calendar" size={13} color={c.inkMuted} style={{ marginTop: 2, flex: "0 0 auto" }} />
                <span style={{ fontFamily: Fonts.sans, fontSize: 11.5, color: c.inkMuted }}>
                  {t("leave.blackoutOverlapPrefix")} {BLACKOUT.label}: {t("leave.blackoutInfoSuffix")}
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  }

  // ---------------------------------------------------------------
  // Leave — top-level page content
  // ---------------------------------------------------------------
  function Leave() {
    const { c } = useTheme();
    const { t, lang } = useLang();

    const openingTotal = LEDGER.reduce((s, r) => s + (r.opening || 0), 0);
    const creditTotal = LEDGER.reduce((s, r) => s + (r.credit || 0), 0);
    const debitTotal = LEDGER.reduce((s, r) => s + (r.debit || 0), 0);
    const closingTotal = LEDGER.reduce((s, r) => s + (r.closing || 0), 0);
    const daysTotal = HISTORY.reduce((s, r) => s + r.days, 0);
    const pendingCount = HISTORY.filter((r) => r.status === "Pending").length;

    const ledgerColumns = [
      { key: "type", label: t("leave.colType"), flex: 1.8, align: "left" },
      { key: "opening", label: t("leave.colOpening"), width: 100, align: "right", mono: true },
      { key: "credit", label: t("leave.colCredited"), width: 100, align: "right", mono: true },
      { key: "debit", label: t("leave.colDebited"), width: 100, align: "right", mono: true },
      { key: "closing", label: t("leave.colAvailable"), width: 110, align: "right", mono: true, emphasize: true },
      { key: "state", label: t("leave.colState"), width: 200, align: "left" },
    ];
    const ledgerRows = LEDGER.map((r) => ({
      key: r.key,
      cells: {
        type: <CellText>{t(r.titleKey)}</CellText>,
        opening: <DayFigure value={r.opening} />,
        credit: <DayFigure value={r.credit} />,
        debit: <DayFigure value={r.debit} color={r.debit ? c.danger : undefined} />,
        closing: <DayFigure value={r.closing} weight={700} />,
        state: <Mark tone={r.tone} glyph={r.glyph}>{t(r.stateKey)}</Mark>,
      },
    }));

    const historyColumns = [
      { key: "id", label: t("leave.colRecord"), width: 108, align: "left", mono: true },
      { key: "applied", label: t("leave.colApplied"), width: 96, align: "left", mono: true },
      { key: "type", label: t("leave.colType"), flex: 1.1, align: "left" },
      { key: "dates", label: t("leave.colDates"), flex: 1.5, align: "left" },
      { key: "days", label: t("leave.colDays"), width: 80, align: "right", mono: true },
      { key: "status", label: t("leave.colStatus"), width: 140, align: "left" },
    ];
    const historyRows = HISTORY.map((h) => ({
      key: h.key,
      cells: {
        id: <CellText mono muted>{h.key}</CellText>,
        applied: <CellText mono muted>{h.applied}</CellText>,
        type: <CellText>{t(h.typeKey)}</CellText>,
        dates: <CellText muted>{h.dates}</CellText>,
        days: <Figure value={h.days} currency="" display size={13} weight={600} color={c.danger} />,
        status: (
          <Mark status={h.status}>
            {h.status === "Approved" ? t("leave.statusApproved") : h.status === "Pending" ? t("leave.statusPending") : t("leave.statusRejected")}
          </Mark>
        ),
      },
    }));

    return (
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
        <ActionBar breadcrumbs={[t("nav.home"), t("nav.leave")]} badge={t("leave.sessionBadge")}>
          <Chip tone="info" size="sm">{t("leave.campusChip")}</Chip>
          <Button variant="primary" size="sm" onClick={() => {
            const el = document.getElementById("tn2-apply-leave-panel");
            if (el && el.scrollIntoView) el.scrollIntoView({ behavior: "smooth", block: "start" });
          }}>{t("leave.applyLeave")}</Button>
        </ActionBar>

        <Masthead
          kicker={t("leave.kicker")}
          title={t("leave.title")}
          titleDeva={lang === "hi" ? undefined : t("leave.titleDeva")}
          meta={t("leave.meta")}
          figureKicker={t("leave.availableKicker")}
          figureValue={closingTotal}
          figureCurrency=""
          figureSub={`${t("leave.asOf")} 10 Aug 2026`}
        />

        <div style={{ flex: "1 1 auto", minHeight: 0, overflowY: "auto" }}>
          <div style={{ padding: `${G.sp[6]}px ${G.sp[6]}px ${G.sp[8]}px`, display: "flex", flexDirection: "column", gap: G.sp[8] }}>

            <div>
              <SectionHeader>{t("leave.ledgerHeading")}</SectionHeader>
              <Register
                columns={ledgerColumns}
                rows={ledgerRows}
                totals={{
                  label: t("leave.totalsLabel"),
                  cells: {
                    opening: fmtDays(openingTotal),
                    credit: fmtDays(creditTotal),
                    debit: fmtDays(debitTotal),
                    closing: fmtDays(closingTotal),
                  },
                }}
              />
              <div style={{ display: "flex", gap: G.sp[2], alignItems: "flex-start", marginTop: G.sp[2] }}>
                <Icon name="info" size={13} color={c.inkMuted} style={{ marginTop: 2, flex: "0 0 auto" }} />
                <span style={{ fontFamily: Fonts.sans, fontSize: 11.5, color: c.inkMuted }}>{t("leave.vacationHint")}</span>
              </div>
            </div>

            <div id="tn2-apply-leave-panel">
              <SectionHeader>{t("leave.applyLeave")}</SectionHeader>
              <ApplyLeavePanel />
            </div>

            <div>
              <SectionHeader>{t("leave.historyHeading")}</SectionHeader>
              <Register
                columns={historyColumns}
                rows={historyRows}
                totals={{
                  label: t("leave.totalsLabel"),
                  labelSpan: 4,
                  cells: { days: fmtDays(daysTotal) },
                }}
              />
            </div>

          </div>
        </div>

        <StatusFooter
          rule={t("leave.footerRule")}
          note={pendingCount ? `${pendingCount} ${t("leave.footerNoteSuffix")}` : undefined}
          tag={t("leave.footerTag")}
        />
      </div>
    );
  }

  window.Pages2 = window.Pages2 || {};
  window.Pages2.Leave = Leave;
})();
