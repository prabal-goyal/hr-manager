/* ============================================================
   pages/dashboard.jsx — Naveya Employee Dashboard / Home,
   rebuilt FULL-BLEED to the register grammar skeleton (a-d):
     (a) ActionBar   — breadcrumb "Home", campus picker
     (b) Masthead     — kicker + big Anek title/Devanagari companion/meta
                         left, JetBrains Mono headline figure right,
                         closed by the 2px accent rule
     (c) Register(s)  — Today strip, This month's muster (Register),
                         leave-balance strip — dense, full width, no
                         card grid, hairline rows, totals footer
     (d) StatusFooter — governing rule + counts closing the screen

   Composes ONLY from window.UI2 (kit.jsx) + window.G2 (tokens.jsx).
   Classic-JSX-runtime IIFE, no imports/exports, inline styles only.
   CONTENT ONLY — no rail/shell here; design/v2/shell.jsx (the
   approved Home-variant-A rail/topbar, design/v2/variants/home-a.jsx)
   mounts this. The shell's TopBar already carries the global
   ThemeToggle + LangSwitcher, so this page's ActionBar does NOT
   duplicate them — only page-local controls (CampusPicker) live
   here. Fonts are read through window.UI2.Fonts (kit.jsx-local
   Anek/Hanken routing) per
   .claude/agent-memory/green-lantern/register_grammar_kit.md — never
   through window.G2.sans/G2.deva directly (tokens.jsx still ships
   Figtree/Mukta there).

   Rule 6 ("one open field at a time"): the ONLY accent-ring element
   on this screen is the HR action-needed field at the bottom. The
   month register deliberately does NOT flag any row — flagging both
   a register row and a standalone action field would compete.
   ============================================================ */
(function () {
  const { useState } = React;
  const G = window.G2;
  const {
    useTheme, useLang, ActionBar, Masthead, StatusFooter, Register,
    Mark, MusterMark, HoursRing, DayTimeline, LeaveDonut, Card,
    SectionHeader, Button, Select, Chip,
    Fonts,
  } = window.UI2;

  const NOW_MIN = 796; // 13:16 — same reference clock as variants/home-a.jsx's TodayModule

  // ---------------------------------------------------------------
  // Local i18n overlay — this page's copy that isn't already in the
  // kit's shared STRINGS table (kit.jsx). Reuses today.*/leave.*/
  // action.*/glyph.*/week.* wherever the kit already carries the
  // right vocabulary (attendance-state words are shared across the
  // whole app, not re-declared per screen).
  // ---------------------------------------------------------------
  const LOCAL_STRINGS = {
    en: {
      "dash.kicker": "MY RECORD · AUGUST 2026",
      "dash.metaLine": "PGT · NAV-0142 · Sunrise Public School",
      "dash.figureKicker": "NET PAYABLE · JULY",
      "dash.figureSub": "Credited 31 Jul · payslip ready",
      "dash.campusAria": "Switch campus",
      "dash.colDate": "DATE", "dash.colMark": "MARK", "dash.colIn": "IN",
      "dash.colOut": "OUT", "dash.colEffective": "EFFECTIVE", "dash.colStatus": "STATUS",
      "dash.monthRegisterTitle": "This month’s attendance",
      "dash.registerTag": "AUGUST 2026 · MUSTER",
      "dash.totalsLabel": "TOTAL",
      "dash.daysMarked": "days marked",
      "dash.pendingStatus": "Pending",
      "dash.footerRule": "Effective hours exclude break time; arrivals after 09:15 are marked late.",
      "dash.footerNoteDays": "days recorded this month",
      "dash.footerNotePresent": "marked present",
      "dash.d1": "Sat, 1 Aug", "dash.d2": "Sun, 2 Aug", "dash.d3": "Mon, 3 Aug",
      "dash.d4": "Tue, 4 Aug", "dash.d5": "Wed, 5 Aug", "dash.d6": "Thu, 6 Aug",
      "dash.d7": "Fri, 7 Aug", "dash.d8": "Sat, 8 Aug", "dash.d9": "Sun, 9 Aug",
      "dash.d10": "Mon, 10 Aug", "dash.d11": "Tue, 11 Aug",
    },
    hi: {
      "dash.kicker": "मेरा रिकॉर्ड · अगस्त 2026",
      "dash.metaLine": "पीजीटी · NAV-0142 · Sunrise Public School",
      "dash.figureKicker": "शुद्ध देय राशि · जुलाई",
      "dash.figureSub": "31 जुलाई को जमा · वेतन पर्ची तैयार",
      "dash.campusAria": "कैंपस बदलें",
      "dash.colDate": "दिनांक", "dash.colMark": "चिह्न", "dash.colIn": "प्रवेश",
      "dash.colOut": "प्रस्थान", "dash.colEffective": "प्रभावी", "dash.colStatus": "स्थिति",
      "dash.monthRegisterTitle": "इस माह की उपस्थिति",
      "dash.registerTag": "अगस्त 2026 · हाज़िरी रजिस्टर",
      "dash.totalsLabel": "कुल",
      "dash.daysMarked": "दिन दर्ज",
      "dash.pendingStatus": "लंबित",
      "dash.footerRule": "प्रभावी घंटों में ब्रेक समय शामिल नहीं; 09:15 के बाद आगमन को देर से माना जाता है।",
      "dash.footerNoteDays": "इस माह दर्ज किए गए दिन",
      "dash.footerNotePresent": "उपस्थित दर्ज",
      "dash.d1": "शनि, 1 अग", "dash.d2": "रवि, 2 अग", "dash.d3": "सोम, 3 अग",
      "dash.d4": "मंगल, 4 अग", "dash.d5": "बुध, 5 अग", "dash.d6": "गुरु, 6 अग",
      "dash.d7": "शुक्र, 7 अग", "dash.d8": "शनि, 8 अग", "dash.d9": "रवि, 9 अग",
      "dash.d10": "सोम, 10 अग", "dash.d11": "मंगल, 11 अग",
    },
  };
  function useT2() {
    const { t, lang } = useLang();
    const t2 = (key) => {
      const table = LOCAL_STRINGS[lang] || LOCAL_STRINGS.en;
      return table[key] !== undefined ? table[key] : t(key);
    };
    return { t2, t, lang };
  }

  function greetingKeyForMinutes(min) {
    if (min < 12 * 60) return "home.goodMorning";
    if (min < 17 * 60) return "home.goodAfternoon";
    return "home.goodEvening";
  }

  const CAMPUS_OPTIONS = [
    "Sunrise Public School",
    "Sunrise Global School, Rohini",
    "Sunrise Little Scholars, Dwarka",
  ];

  // ---------------------------------------------------------------
  // CampusPicker — page-local; a wider "school switcher" belongs in
  // the kit once a second screen needs it (e.g. an HR admin route
  // that spans campuses) — kept local here since only Home needs it
  // today and its width/placement is Home-specific.
  // ---------------------------------------------------------------
  function CampusPicker() {
    const { t2 } = useT2();
    const [campus, setCampus] = useState(CAMPUS_OPTIONS[0]);
    return (
      <div style={{ width: 232 }}>
        <Select
          value={campus}
          onChange={(e) => setCampus(e.target.value)}
          options={CAMPUS_OPTIONS}
          aria-label={t2("dash.campusAria")}
        />
      </div>
    );
  }

  // ---------------------------------------------------------------
  // Metric — small right-aligned mono label/value pair (In/Break/Out).
  // ---------------------------------------------------------------
  function Metric({ label, value, muted }) {
    const { c } = useTheme();
    return (
      <div style={{ textAlign: "right" }}>
        <div style={{ fontFamily: Fonts.sans, fontSize: 11, color: c.inkMuted }}>{label}</div>
        <div style={{
          fontFamily: Fonts.mono, fontSize: 13.5, fontWeight: 600, color: muted ? c.inkMuted : c.ink,
          marginTop: 2, fontFeatureSettings: "'tnum' 1, 'lnum' 1",
        }}>{value}</div>
      </div>
    );
  }

  // ---------------------------------------------------------------
  // TodayStrip — HoursRing + full-width DayTimeline + In/Break/Out.
  // Card at its default flat level (hairline border, no shadow) —
  // grammar rule 2 still holds; this is a register-adjacent panel,
  // not a card-grid tile.
  // ---------------------------------------------------------------
  function TodayStrip() {
    const { c } = useTheme();
    const { t, t2 } = useT2();
    const S = 540, E = 1110; // 09:00 -> 18:30 in minutes-from-midnight
    const now = NOW_MIN;
    const worked = [[542, 705], [765, now]];
    const brk = [[705, 765]];
    const effHours = ((705 - 542) + (now - 765)) / 60; // 3h 14m

    return (
      <Card padding={0} style={{ overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: G.sp[3], padding: `${G.sp[4]}px ${G.sp[5]}px ${G.sp[3]}px`, flexWrap: "wrap" }}>
          <span style={{ fontFamily: Fonts.display, fontSize: 20, fontWeight: 600, color: c.ink }}>{t("today.today")}</span>
          <Chip tone="present" icon="check">{t("today.present")}</Chip>
          <span style={{ fontFamily: Fonts.mono, fontSize: 12, color: c.inkMuted, fontFeatureSettings: "'tnum' 1, 'lnum' 1" }}>{t2("dash.d11")}</span>
          <div style={{ marginLeft: "auto", display: "flex", gap: G.sp[6], flexWrap: "wrap" }}>
            <Metric label={t("today.in")} value="09:02" />
            <Metric label={t("today.break")} value="1h 00m" />
            <Metric label={t("today.out")} value="—" muted />
          </div>
        </div>
        <div style={{ padding: `${G.sp[2]}px ${G.sp[5]}px ${G.sp[5]}px`, display: "flex", gap: G.sp[6], alignItems: "center", flexWrap: "wrap" }}>
          <HoursRing hours={effHours} target={8} size={92} label={t("today.target")} />
          <div style={{ flex: "1 1 420px", minWidth: 280 }}>
            <DayTimeline startMin={S} endMin={E} worked={worked} breaks={brk} now={now} />
            <div style={{ marginTop: G.sp[3], fontFamily: Fonts.sans, fontSize: 12, color: c.inkMuted }}>
              {t("today.recordedAt")} &nbsp;·&nbsp; <Button variant="link" size="sm">{t("today.viewFullTimecard")}</Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // ---------------------------------------------------------------
  // MonthRegister — "This month" muster: the Register primitive with
  // date/mark/in/out/effective/status columns, a double-rule totals
  // footer summing days marked + effective hours. No row is flagged
  // (rule 6 reserves the accent ring for the HR action field below).
  // ---------------------------------------------------------------
  const DAY_ROWS = [
    { d: "dash.d1", muster: "·", kind: "off" },
    { d: "dash.d2", muster: "·", kind: "off" },
    { d: "dash.d3", muster: "P", in: "09:04", out: "17:32", eff: { h: 7, m: 58 }, kind: "onTime" },
    { d: "dash.d4", muster: "P", in: "09:41", out: "17:35", eff: { h: 7, m: 24 }, kind: "late" },
    { d: "dash.d5", muster: "P", in: "08:58", out: "17:30", eff: { h: 8, m: 2 }, kind: "onTime" },
    { d: "dash.d6", muster: "P", in: "09:07", out: "17:20", eff: { h: 7, m: 43 }, kind: "onTime" },
    { d: "dash.d7", muster: "P", in: "09:05", out: "17:40", eff: { h: 8, m: 5 }, kind: "onTime" },
    { d: "dash.d8", muster: "P", in: "10:00", out: "12:50", eff: { h: 2, m: 50 }, kind: "offWorked" },
    { d: "dash.d9", muster: "·", kind: "off" },
    { d: "dash.d10", muster: "L", kind: "leave" },
    { d: "dash.d11", muster: "P", in: "09:02", out: null, eff: { h: 3, m: 14 }, kind: "inProgress" },
  ];

  function effToString(eff) {
    if (!eff) return "—";
    return eff.m ? `${eff.h}h ${eff.m}m` : `${eff.h}h`;
  }

  function StatusForKind(kind, t, t2) {
    switch (kind) {
      case "onTime": return { tone: "present", glyph: "⦾", label: t("glyph.onTime") };
      case "late": return { tone: "late", glyph: "◐", label: t("glyph.late") };
      case "leave": return { tone: "leave", glyph: "◌", label: `${t("glyph.onLeave")} · ${t("leave.casual")}` };
      case "offWorked": return { tone: "off", glyph: "⦾", label: t("glyph.weeklyOffWorked") };
      case "inProgress": return { tone: "inkMuted", glyph: "◌", label: t("week.inProgress") };
      default: return { tone: "off", glyph: "·", label: t("glyph.weeklyOff") };
    }
  }

  function MonthRegister({ onNavigate }) {
    const { c } = useTheme();
    const { t, t2 } = useT2();

    const presentCount = DAY_ROWS.filter((r) => r.muster === "P").length;
    const totalMinutes = DAY_ROWS.reduce((sum, r) => sum + (r.eff ? r.eff.h * 60 + r.eff.m : 0), 0);
    const totalH = Math.floor(totalMinutes / 60), totalM = totalMinutes % 60;

    const columns = [
      { key: "date", label: t2("dash.colDate"), flex: 1.25 },
      { key: "mark", label: t2("dash.colMark"), width: 56, align: "center" },
      { key: "in", label: t2("dash.colIn"), width: 84, align: "right", mono: true },
      { key: "out", label: t2("dash.colOut"), width: 84, align: "right", mono: true },
      { key: "effective", label: t2("dash.colEffective"), width: 104, align: "right", mono: true, emphasize: true },
      { key: "status", label: t2("dash.colStatus"), flex: 1.7 },
    ];

    const rows = DAY_ROWS.map((r) => {
      const st = StatusForKind(r.kind, t, t2);
      return {
        key: r.d,
        cells: {
          date: <span style={{ fontFamily: Fonts.sans, fontSize: 13.5, color: c.ink }}>{t2(r.d)}</span>,
          mark: <MusterMark code={r.muster} />,
          in: <span>{r.in || "—"}</span>,
          out: <span>{r.out || "—"}</span>,
          effective: <span>{effToString(r.eff)}</span>,
          status: <Mark tone={st.tone} glyph={st.glyph}>{st.label}</Mark>,
        },
      };
    });

    const totals = {
      label: t2("dash.totalsLabel"),
      labelSpan: 2,
      cells: {
        effective: <span>{effToString({ h: totalH, m: totalM })}</span>,
        status: <span style={{ fontFamily: Fonts.mono, fontSize: 12.5, color: c.inkMuted }}>{presentCount} {t2("dash.daysMarked")}</span>,
      },
    };

    return (
      <div>
        <div style={{ fontFamily: Fonts.mono, fontSize: G.metric.minMonoCaps, letterSpacing: ".1em", textTransform: "uppercase", color: c.inkMuted, marginBottom: 6 }}>
          {t2("dash.registerTag")}
        </div>
        <SectionHeader action={t("week.viewFullAttendance")} onAction={() => onNavigate && onNavigate("attendance")}>
          {t2("dash.monthRegisterTitle")}
        </SectionHeader>
        <Register columns={columns} rows={rows} totals={totals} />
      </div>
    );
  }

  // ---------------------------------------------------------------
  // LeaveBalanceStrip — compact, quiet donuts (size 64, not the
  // full-size 108 default) + mono figures, per the brief's "donuts
  // only if they stay small and quiet".
  // ---------------------------------------------------------------
  function LeaveBalanceStrip({ onNavigate }) {
    const { t } = useLang();
    return (
      <div>
        <SectionHeader action={t("leave.applyLeave")} onAction={() => onNavigate && onNavigate("leave")} info={t("leave.vacationHint")}>
          {t("leave.leaveBalance")}
        </SectionHeader>
        <div style={{ display: "flex", flexWrap: "wrap", gap: G.sp[8] }}>
          <LeaveDonut size={64} typeKey="EL" value={null} label={t("leave.vacation")} sublabel={t("leave.na")} />
          <LeaveDonut size={64} typeKey="Casual" value={4} max={8} label={t("leave.casual")} sublabel={t("leave.daysAvailable")} />
          <LeaveDonut size={64} typeKey="Sick" value={6} max={10} label={t("leave.sick")} sublabel={t("leave.daysAvailable")} />
          <LeaveDonut size={64} typeKey="Comp" value={2} max={5} label={t("leave.comp")} sublabel={t("leave.daysAvailable")} />
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------
  // ActionField — the ONE open field on this screen (grammar rule 6):
  // an accent ring on an otherwise flat/hairline panel, reserved for
  // the single thing the employee must act on. State carried by
  // `Mark` ("Pending"), never a filled colour banner.
  // ---------------------------------------------------------------
  function ActionField({ onRespond }) {
    const { c } = useTheme();
    const { t, t2 } = useT2();
    return (
      <Card
        padding={0}
        style={{ boxShadow: `inset 0 0 0 1.5px ${c.accent}` }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: G.sp[4], flexWrap: "wrap", padding: `${G.sp[4]}px ${G.sp[5]}px` }}>
          <div style={{ flex: "1 1 320px", minWidth: 0 }}>
            <div style={{ fontFamily: Fonts.mono, fontSize: G.metric.minMonoCaps, letterSpacing: ".1em", textTransform: "uppercase", color: c.accent }}>
              {t("action.actionNeeded")}
            </div>
            <div style={{ fontFamily: Fonts.sans, fontSize: 14, fontWeight: 600, color: c.ink, marginTop: 4 }}>{t("action.respondRequest")}</div>
            <div style={{ fontFamily: Fonts.sans, fontSize: 12.5, color: c.inkMuted, marginTop: 2 }}>
              <span title="A character-and-antecedent check certificate issued by the local police station">{t("action.policeVerification")}</span> · {t("action.requestedByHR")}
            </div>
          </div>
          <Mark status="Pending">{t2("dash.pendingStatus")}</Mark>
          <Button variant="primary" size="sm" onClick={onRespond} style={{ flex: "0 0 auto" }}>{t("action.respond")}</Button>
        </div>
      </Card>
    );
  }

  // ---------------------------------------------------------------
  // Dashboard — the full-bleed page content. No max-width wrapper,
  // no side margins: fills the content region the shell hands it.
  // ---------------------------------------------------------------
  function Dashboard({ onNavigate }) {
    const { c } = useTheme();
    const { t, t2, lang } = useT2();

    const presentCount = DAY_ROWS.filter((r) => r.muster === "P").length;
    const footerNote = `${DAY_ROWS.length} ${t2("dash.footerNoteDays")} · ${presentCount} ${t2("dash.footerNotePresent")}`;
    const greeting = t(greetingKeyForMinutes(NOW_MIN));

    return (
      <div style={{ display: "flex", flexDirection: "column", width: "100%", minHeight: "100%", background: c.bg }}>
        <ActionBar breadcrumbs={[t("nav.home")]}>
          <CampusPicker />
        </ActionBar>

        <Masthead
          kicker={t2("dash.kicker")}
          title={`${greeting}, Ananya`}
          titleDeva={lang === "hi" ? undefined : "अनन्या शर्मा"}
          meta={t2("dash.metaLine")}
          figureKicker={t2("dash.figureKicker")}
          figureValue={68240}
          figureSub={t2("dash.figureSub")}
        />

        <div style={{ padding: `${G.sp[6]}px ${G.sp[6]}px`, display: "flex", flexDirection: "column", gap: G.sp[8] }}>
          <TodayStrip />
          <MonthRegister onNavigate={onNavigate} />
          <LeaveBalanceStrip onNavigate={onNavigate} />
          <ActionField onRespond={() => onNavigate && onNavigate("documents")} />
        </div>

        <StatusFooter rule={t2("dash.footerRule")} note={footerNote} tag={t2("dash.registerTag")} />
      </div>
    );
  }

  window.Pages2 = window.Pages2 || {};
  window.Pages2.Dashboard = Dashboard;
})();
