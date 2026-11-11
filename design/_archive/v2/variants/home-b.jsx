/* ============================================================
   home-b.jsx — Naveya Employee Home, VARIANT B
   "Light, calm chrome (no dark slab at all)"

   Composes ONLY from window.G2 (design/v2/tokens.jsx) and window.UI2
   (design/v2/kit.jsx) — does not edit either. This file owns its OWN
   shell (sidebar + top bar) because the chrome IS what this variant
   redesigns: the terracotta shell gradient from design/v2/screens.jsx
   is dropped entirely. Sidebar and top bar read c.surface/c.border/
   c.ink like any other surface — there is no separate "onShell"
   color path here, on purpose. All colour energy lives in the DATA
   (rings, donuts, chart bars, glyphs, row tints) which is why several
   of those components below are sized up versus the original Home.

   Classic-JSX-runtime IIFE, no imports/exports, inline styles only.
   Exposes window.HomeVariants.B. Renders in ONE language at a time
   via useLang()/t() — never both.
   ============================================================ */
(function () {
  const { useState } = React;
  const G = window.G2;
  const {
    useTheme, useLang, ThemeToggle, Button, Chip, Glyph,
    HoursRing, LeaveDonut, DayTimeline, WeekStripChart, DayLogRow,
    Card, SectionHeader, PaydayMoment, Avatar, Icon, EmptyState,
  } = window.UI2;

  const CONTENT_MAX = 1180;

  const NAV_B = [
    { key: "home", icon: "home" },
    { key: "attendance", icon: "clock" },
    { key: "leave", icon: "calendar" },
    { key: "payslips", icon: "wallet" },
    { key: "documents", icon: "document" },
    { key: "profile", icon: "user" },
  ];

  const NOW_MIN = 796; // 13:16 — one clock drives both greeting and the Today module
  function greetingKeyForMinutes(min) {
    if (min < 12 * 60) return "home.goodMorning";
    if (min < 17 * 60) return "home.goodAfternoon";
    return "home.goodEvening";
  }

  // ---------------------------------------------------------------
  // LangSwitcherB — the kit's LangSwitcher is styled for a coloured
  // shell background (white pill on terracotta). Variant B's chrome
  // is near-white/neutral, so the active state reads as an ink-on-
  // accentSoft pill instead of white-on-shell.
  // ---------------------------------------------------------------
  function LangSwitcherB({ size }) {
    const { t, lang, setLang } = useLang();
    const { c } = useTheme();
    const opts = [{ v: "en", l: "EN" }, { v: "hi", l: "हिंदी" }];
    return (
      <div
        role="group"
        aria-label={t("common.language")}
        style={{ display: "inline-flex", border: `1px solid ${c.border}`, borderRadius: G.r.pill, overflow: "hidden", flex: "0 0 auto" }}
      >
        {opts.map((o) => {
          const active = lang === o.v;
          return (
            <button
              key={o.v}
              type="button"
              aria-pressed={active}
              onClick={() => setLang(o.v)}
              style={{
                fontFamily: o.v === "hi" ? G.deva : G.sans, fontSize: size === "sm" ? 11.5 : 12.5, fontWeight: 600,
                padding: size === "sm" ? "4px 9px" : "5px 12px",
                background: active ? c.accentSoft : "transparent",
                color: active ? c.accent : c.inkMuted,
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
  // SidebarB — full-width nav rows on a quiet c.surface panel behind
  // a single hairline (c.border), not a colour block. The ACTIVE
  // item is the only coloured thing: an accentSoft pill + accent
  // icon/text + heavier weight. Everything else is c.inkMuted.
  // ---------------------------------------------------------------
  function SidebarB({ route, onNavigate, onSignOut }) {
    const { c } = useTheme();
    const { t, lang } = useLang();
    return (
      <div style={{ width: 248, flex: "0 0 248px", background: c.surface, borderRight: `1px solid ${c.border}`, display: "flex", flexDirection: "column" }}>
        <nav style={{ flex: 1, padding: `${G.sp[6]}px ${G.sp[3]}px ${G.sp[3]}px`, display: "flex", flexDirection: "column", gap: 3 }}>
          {NAV_B.map((n) => {
            const active = n.key === route;
            return (
              <button
                key={n.key}
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => onNavigate && onNavigate(n.key)}
                style={{
                  display: "flex", alignItems: "center", gap: G.sp[3],
                  padding: `${G.sp[2] + 2}px ${G.sp[4]}px`,
                  borderRadius: G.r.pill,
                  background: active ? c.accentSoft : "transparent",
                  border: "none", width: "100%", textAlign: "left", cursor: "pointer", font: "inherit",
                  transition: `background 120ms ${G.mo.ease.outQuart}`,
                }}
              >
                <Icon name={n.icon} size={17} color={active ? c.accent : c.inkMuted} strokeWidth={active ? 2.1 : 1.9} />
                <span style={{ fontFamily: lang === "hi" ? G.deva : G.sans, fontSize: 13.5, fontWeight: active ? 700 : 500, color: active ? c.accent : c.inkMuted }}>
                  {t("nav." + n.key)}
                </span>
              </button>
            );
          })}
        </nav>
        <div style={{ padding: G.sp[4], borderTop: `1px solid ${c.border}`, display: "flex", alignItems: "center", gap: G.sp[3] }}>
          <Avatar initials="AR" size={32} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: G.sans, fontSize: 12.5, fontWeight: 700, color: c.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Ananya Rao</div>
            <div style={{ fontFamily: G.sans, fontSize: 10.5, color: c.inkMuted }}>PGT · EMP-014</div>
          </div>
          <button
            onClick={onSignOut} aria-label={t("common.signOut")} title={t("common.signOut")}
            style={{ background: "transparent", border: "none", cursor: "pointer", color: c.inkMuted, display: "flex", padding: 4, borderRadius: G.r.sm }}
          >
            <Icon name="logout" size={16} color={c.inkMuted} />
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------
  // TopBarB — near-white, hairline bottom border, no colour band.
  // Brand presence is the wordmark only; everything else is quiet
  // ink/muted chrome around it.
  // ---------------------------------------------------------------
  function TopBarB({ onViewAdmin, role }) {
    const { c } = useTheme();
    const { t } = useLang();
    const canViewAdmin = role && role !== "employee" && !!onViewAdmin;
    return (
      <div style={{ height: 68, flex: "0 0 68px", background: c.surface, borderBottom: `1px solid ${c.border}`, display: "flex", alignItems: "center", padding: `0 ${G.sp[6]}px`, gap: G.sp[4] }}>
        <span style={{ ...G.t("h2", "latin"), color: c.accent }}>Naveya</span>
        <span style={{ width: 1, height: 22, background: c.border, flex: "0 0 auto" }} />
        <span style={{ fontFamily: G.sans, fontSize: 13.5, fontWeight: 600, color: c.ink }}>Sunrise Public School</span>
        <div style={{ flex: 1 }} />
        <LangSwitcherB />
        <ThemeToggle />
        <Button variant="icon" ariaLabel={t("common.notifications")}><Icon name="bell" size={16} color={c.ink} /></Button>
        {canViewAdmin && <Button variant="ghost" size="sm" onClick={onViewAdmin}>{t("common.viewAdminConsole")}</Button>}
      </div>
    );
  }

  // ---------------------------------------------------------------
  // Content — same content as the current Home (design/v2/screens.jsx):
  // action-needed banner, Today card, weekly pattern, recent days,
  // leave balances, latest payslip, upcoming holidays. Because the
  // chrome is silent here, several data objects (HoursRing, LeaveDonut,
  // glyphs) are sized up a touch versus the original.
  // ---------------------------------------------------------------
  function Metric({ label, value, muted }) {
    const { c } = useTheme();
    return (
      <div style={{ textAlign: "right" }}>
        <div style={{ fontFamily: G.sans, fontSize: 11, color: c.inkMuted }}>{label}</div>
        <div style={{ fontFamily: G.mono, fontSize: 13.5, fontWeight: 600, color: muted ? c.inkMuted : c.ink, marginTop: 2, fontFeatureSettings: "'tnum' 1, 'lnum' 1" }}>{value}</div>
      </div>
    );
  }

  function ActionBannerB({ onRespond }) {
    const { c } = useTheme();
    const { t } = useLang();
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: G.sp[4], flexWrap: "wrap", minWidth: 0,
        background: c.lateTint, borderRadius: G.r.xl, padding: `${G.sp[4]}px ${G.sp[5]}px`, marginBottom: G.sp[6],
      }}>
        <Glyph kind="missingSwipe" size={42} />
        <div style={{ flex: "1 1 320px", minWidth: 0 }}>
          <div style={{ fontFamily: G.sans, fontSize: 11.5, fontWeight: 700, color: c.lateText, textTransform: "uppercase", letterSpacing: ".03em" }}>{t("action.actionNeeded")}</div>
          <div style={{ fontFamily: G.sans, fontSize: 13.5, color: c.ink, fontWeight: 600, marginTop: 3 }}>{t("action.respondRequest")}</div>
          <div style={{ fontFamily: G.sans, fontSize: 12, color: c.inkMuted, marginTop: 2 }}>
            <span title="A character-and-antecedent check certificate issued by the local police station">{t("action.policeVerification")}</span> · {t("action.requestedByHR")}
          </div>
        </div>
        <Button variant="primary" size="sm" onClick={onRespond} style={{ flex: "0 0 auto" }}>{t("action.respond")}</Button>
      </div>
    );
  }

  function TodayModuleB() {
    const { c } = useTheme();
    const { t } = useLang();
    const S = 540, E = 1110; // 09:00 -> 18:30 in minutes-from-midnight
    const now = NOW_MIN;
    const worked = [[542, 705], [765, now]];
    const brk = [[705, 765]];
    const effHours = ((705 - 542) + (now - 765)) / 60;

    return (
      <Card padding={0} style={{ overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: G.sp[3], padding: `${G.sp[5]}px ${G.sp[5]}px ${G.sp[3]}px`, flexWrap: "wrap" }}>
          <span style={{ ...G.t("h3", "latin"), color: c.ink }}>{t("today.today")}</span>
          <Chip tone="present" icon="check">{t("today.present")}</Chip>
          <div style={{ marginLeft: "auto", display: "flex", gap: G.sp[6], flexWrap: "wrap" }}>
            <Metric label={t("today.in")} value="09:02" />
            <Metric label={t("today.break")} value="1h 00m" />
            <Metric label={t("today.out")} value="—" muted />
          </div>
        </div>
        <div style={{ padding: `${G.sp[2]}px ${G.sp[5]}px ${G.sp[6]}px`, display: "flex", gap: G.sp[6], alignItems: "center", flexWrap: "wrap" }}>
          <HoursRing hours={effHours} target={8} size={104} label={t("today.target")} />
          <div style={{ flex: "1 1 260px", minWidth: 220 }}>
            <DayTimeline startMin={S} endMin={E} worked={worked} breaks={brk} now={now} />
            <div style={{ marginTop: G.sp[3], fontFamily: G.sans, fontSize: 12, color: c.inkMuted }}>
              {t("today.recordedAt")} &nbsp;·&nbsp; <Button variant="link" size="sm">{t("today.viewFullTimecard")}</Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  const WEEK_DAYS_B = [
    { day: 18, wd: "Mon", state: "present", hours: 7.7 },
    { day: 19, wd: "Tue", state: "off", hours: 0 },
    { day: 20, wd: "Wed", state: "late", hours: 6.9 },
    { day: 21, wd: "Thu", state: "absent", hours: 0 },
    { day: 22, wd: "Fri", state: "present", hours: 7.3, today: true },
    { day: 23, wd: "Sat", state: "future", hours: 0 },
    { day: 24, wd: "Sun", state: "future", hours: 0 },
  ];

  function WeekPatternB({ onNavigate }) {
    const { t } = useLang();
    return (
      <div>
        <SectionHeader action={t("week.viewFullAttendance")} onAction={() => onNavigate && onNavigate("attendance")}>
          {t("week.weeklyPattern")}
        </SectionHeader>
        <Card padding={G.sp[6]}>
          <WeekStripChart days={WEEK_DAYS_B} maxHours={8} />
        </Card>
      </div>
    );
  }

  function RecentDaysB() {
    const { t } = useLang();
    return (
      <div>
        <SectionHeader>{t("week.recentDays")}</SectionHeader>
        <div style={{ display: "flex", flexDirection: "column", gap: G.sp[2] }}>
          <DayLogRow tone="late" glyph="late" title={t("recent.row1Title")} subtitle={t("recent.row1Sub")} meta="6h 54m" />
          <DayLogRow tone="penalty" glyph="missingSwipe" title={t("recent.row2Title")} subtitle={t("recent.row2Sub")} pillLabel={t("glyph.penalty")} />
          <DayLogRow tone="off" glyph="weeklyOffWorked" title={t("recent.row3Title")} subtitle={t("recent.row3Sub")} pillLabel={t("pill.wOff")} />
        </div>
      </div>
    );
  }

  function LeaveBalancesB({ onNavigate }) {
    const { t } = useLang();
    return (
      <div>
        <SectionHeader action={t("leave.applyLeave")} onAction={() => onNavigate && onNavigate("leave")} info={t("leave.vacationHint")}>
          {t("leave.leaveBalance")}
        </SectionHeader>
        <Card>
          <div style={{ display: "flex", flexWrap: "wrap", gap: G.sp[6], justifyContent: "space-between" }}>
            <LeaveDonut typeKey="EL" value={null} label={t("leave.vacation")} sublabel={t("leave.na")} size={124} />
            <LeaveDonut typeKey="Casual" value={4} max={8} label={t("leave.casual")} sublabel={t("leave.daysAvailable")} size={124} />
            <LeaveDonut typeKey="Sick" value={6} max={10} label={t("leave.sick")} sublabel={t("leave.daysAvailable")} size={124} />
            <LeaveDonut typeKey="Comp" value={2} max={5} label={t("leave.comp")} sublabel={t("leave.daysAvailable")} size={124} />
          </div>
        </Card>
      </div>
    );
  }

  function PayslipSectionB({ onNavigate }) {
    const { t } = useLang();
    return (
      <div>
        <SectionHeader action={t("common.viewAll")} onAction={() => onNavigate && onNavigate("payslips")}>
          {t("payslip.payslips")}
        </SectionHeader>
        <PaydayMoment
          period="July 2026" netPay={68240} creditedOn={`${t("payslip.credited")} 31 Jul`}
          statusLabel={t("payslip.netPay")} paydayLabel={t("payslip.payday")} paydayMsg={t("payslip.paydayMsg")}
          downloadLabel={t("common.download")} onDownload={() => onNavigate && onNavigate("payslips")}
        />
      </div>
    );
  }

  function UpcomingRowB({ glyph, title, sub, date, last }) {
    const { c } = useTheme();
    return (
      <div style={{ display: "flex", alignItems: "center", gap: G.sp[3], padding: `${G.sp[3]}px 0`, borderBottom: last ? "none" : `1px solid ${c.border}` }}>
        <Glyph kind={glyph} size={32} tint />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: G.sans, fontSize: 13.5, color: c.ink, fontWeight: 600 }}>{title}</div>
          <div style={{ fontFamily: G.sans, fontSize: 12, color: c.inkMuted, marginTop: 1 }}>{sub}</div>
        </div>
        <div style={{ fontFamily: G.mono, fontSize: 12.5, fontWeight: 600, color: c.ink, fontFeatureSettings: "'tnum' 1, 'lnum' 1" }}>{date}</div>
      </div>
    );
  }

  function UpcomingB() {
    const { t } = useLang();
    return (
      <div>
        <SectionHeader>{t("upcoming.upcoming")}</SectionHeader>
        <Card>
          <UpcomingRowB glyph="holiday" title={t("upcoming.independenceDay")} sub={t("upcoming.nationalHoliday")} date="15 Aug" />
          <UpcomingRowB glyph="weeklyOff" title={t("upcoming.summerVacation")} sub={t("upcoming.termBreak")} date="18–31 May" last />
        </Card>
      </div>
    );
  }

  function HomeContentB({ onNavigate }) {
    const { c } = useTheme();
    const { t, lang } = useLang();
    const hasPendingAction = true;
    const greeting = t(greetingKeyForMinutes(NOW_MIN));
    return (
      <div style={{ maxWidth: CONTENT_MAX, margin: "0 auto" }}>
        {hasPendingAction && <ActionBannerB onRespond={() => onNavigate && onNavigate("documents")} />}

        <div style={{ ...G.t("h1", lang === "hi" ? "deva" : "latin"), color: c.ink }}>{greeting}, Ananya</div>
        <div style={{ fontFamily: lang === "hi" ? G.deva : G.sans, fontSize: 13.5, color: c.inkMuted, marginTop: 4, marginBottom: G.sp[6] }}>
          {t("home.roleLine")}
        </div>

        <div style={{ marginBottom: G.sp[6] }}><TodayModuleB /></div>

        <div style={{ display: "flex", gap: G.sp[8], alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 520px", minWidth: 380 }}>
            <div style={{ marginBottom: G.sp[6] }}><WeekPatternB onNavigate={onNavigate} /></div>
            <div style={{ marginBottom: G.sp[6] }}><RecentDaysB /></div>
            <LeaveBalancesB onNavigate={onNavigate} />
          </div>
          <div style={{ flex: "1 1 380px", minWidth: 320 }}>
            <div style={{ marginBottom: G.sp[6] }}><PayslipSectionB onNavigate={onNavigate} /></div>
            <UpcomingB />
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------
  // RoutePlaceholderB — every non-home route gets a warm, illustrated
  // empty state (same pattern as design/v2/screens.jsx's Home route
  // switch) so the sidebar is genuinely clickable during verification.
  // ---------------------------------------------------------------
  function RoutePlaceholderB({ routeKey }) {
    const { t } = useLang();
    const copy = {
      leave: { illustration: "leave", title: t("empty.noLeaveTitle"), description: t("empty.noLeaveDesc") },
      documents: { illustration: "documents", title: t("empty.noDocsTitle"), description: t("empty.noDocsDesc") },
    };
    const cfg = copy[routeKey] || { illustration: "rest", title: t("nav." + routeKey), description: t("empty.comingSoonDesc") };
    return (
      <div style={{ maxWidth: CONTENT_MAX, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 420 }}>
        <EmptyState illustration={cfg.illustration} title={cfg.title} description={cfg.description} />
      </div>
    );
  }

  // ---------------------------------------------------------------
  // HomeVariantB — the full screen: light sidebar + light top bar +
  // soft-tinted canvas (c.bg) that the white Cards lift off of.
  // ---------------------------------------------------------------
  function HomeVariantB(props) {
    const { c } = useTheme();
    const [localRoute, setLocalRoute] = useState("home");
    const route = props.route || localRoute;
    const onNavigate = props.onNavigate || setLocalRoute;
    const onSignOut = props.onSignOut || function () {};
    return (
      <div style={{ display: "flex", width: "100%", height: "100%", background: c.bg }}>
        <SidebarB route={route} onNavigate={onNavigate} onSignOut={onSignOut} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <TopBarB onViewAdmin={props.onViewAdmin} role={props.role} />
          <div style={{ flex: 1, overflow: "auto", padding: `${G.sp[8]}px`, boxSizing: "border-box" }}>
            {route === "home" ? <HomeContentB onNavigate={onNavigate} /> : <RoutePlaceholderB routeKey={route} />}
          </div>
        </div>
      </div>
    );
  }

  window.HomeVariants = window.HomeVariants || {};
  window.HomeVariants.B = HomeVariantB;
})();
