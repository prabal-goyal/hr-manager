/* ============================================================
   screens.jsx v2 — Naveya "STAFFROOM" screens, employee-first.
   Composes ONLY from window.UI2 (design/v2/kit.jsx). Classic-JSX
   runtime IIFE, no imports/exports. Exposes window.Screens2.
   Renders in ONE language at a time via useLang()/t() — never both.
   ============================================================ */
(function () {
  const { useState } = React;
  const G = window.G2;
  const {
    useTheme, useLang, ThemeToggle, LangSwitcher, Button, Field, Input,
    Chip, StatusPill, Glyph, HoursRing, LeaveDonut, DayTimeline, WeekStripChart,
    DayLogRow, Card, Tile, SectionHeader, Figure, Ledger, PaydayMoment,
    Avatar, Icon, EmptyState, withAlpha,
  } = window.UI2;

  const CONTENT_MAX = 1200;

  // ---------------------------------------------------------------
  // Shared nav model (employee shell)
  // ---------------------------------------------------------------
  const EMP_NAV = [
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
  // Login — centered, warm, no glass/eyebrow/side-stripe.
  // ---------------------------------------------------------------
  const MOCK_VALID_PASSWORD = "password123"; // design-canvas only — real auth wires to the backend.
  function isValidEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

  function Login({ onContinue, onSSO }) {
    const { c } = useTheme();
    const { t, lang } = useLang();
    const [email, setEmail] = useState("ananya.rao@sunrise.edu");
    const [password, setPassword] = useState("");
    const [touched, setTouched] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [authError, setAuthError] = useState(false);

    const emailValid = isValidEmail(email);
    const emailError = touched && !email ? t("login.emailRequired") : touched && !emailValid ? t("login.emailInvalid") : undefined;
    const passwordError = touched && !password ? t("login.passwordRequired") : undefined;

    function handleContinue(e) {
      if (e && e.preventDefault) e.preventDefault();
      setTouched(true);
      setAuthError(false);
      if (!emailValid || !password) return;
      setSubmitting(true);
      window.setTimeout(function () {
        setSubmitting(false);
        if (password === MOCK_VALID_PASSWORD) onContinue && onContinue();
        else setAuthError(true);
      }, 650);
    }

    return (
      <div style={{ width: "100%", height: "100%", background: `radial-gradient(1100px 620px at 15% -10%, ${withAlpha(c.accent, 0.09)}, transparent), ${c.bg}`, display: "flex", alignItems: "center", justifyContent: "center", padding: G.sp[6], boxSizing: "border-box", overflow: "auto" }}>
        <div style={{ position: "absolute", top: G.sp[5], right: G.sp[6], display: "flex", gap: G.sp[2], alignItems: "center" }}>
          <LangSwitcher size="sm" />
        </div>
        <div style={{ width: "100%", maxWidth: 396 }}>
          <div style={{ textAlign: "center", marginBottom: G.sp[8] }}>
            <span style={{ ...G.t("display", "latin"), fontSize: 30, color: c.accent }}>Naveya</span>
          </div>

          <Card style={{ borderRadius: G.r["2xl"] }}>
            <div style={{ ...G.t("h2", lang === "hi" ? "deva" : "latin"), color: c.ink, marginBottom: 2 }}>{t("login.welcomeBack")}</div>
            <div style={{ fontFamily: lang === "hi" ? G.deva : G.sans, fontSize: 13.5, color: c.inkMuted, marginBottom: G.sp[5] }}>
              {t("login.signInPrompt")}
            </div>

            {authError && (
              <div style={{
                display: "flex", alignItems: "flex-start", gap: G.sp[2],
                background: c.absentTint, borderRadius: G.r.md, padding: G.sp[3], marginBottom: G.sp[4],
              }}>
                <Icon name="alert" size={14} color={c.absentText} strokeWidth={2.2} style={{ marginTop: 1, flex: "0 0 auto" }} />
                <span style={{ fontFamily: lang === "hi" ? G.deva : G.sans, fontSize: 12.5, color: c.absentText }}>{t("login.authError")}</span>
              </div>
            )}

            <form onSubmit={handleContinue}>
              <div style={{ display: "flex", flexDirection: "column", gap: G.sp[4] }}>
                <Field label={t("login.workEmail")} error={emailError}>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("login.emailPlaceholder")} error={emailError} />
                </Field>
                <Field label={t("login.password")} labelAction={t("login.forgot")} onLabelAction={() => {}} error={passwordError}>
                  <Input
                    type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("login.passwordPlaceholder")} error={passwordError}
                    onKeyDown={(e) => { if (e.key === "Enter") handleContinue(e); }}
                  />
                </Field>
              </div>

              <div style={{ marginTop: G.sp[6] }}>
                {/* Stays a real clickable <button> even while it looks
                    disabled-until-valid — a hard `disabled` submit would
                    swallow the click that reveals validation errors. */}
                <Button
                  type="submit" variant="primary" loading={submitting}
                  style={{ width: "100%", textAlign: "center", justifyContent: "center", opacity: !submitting && (!emailValid || !password) ? 0.55 : 1 }}
                >
                  {submitting ? t("login.signingIn") : t("login.continue")}
                </Button>
              </div>
            </form>

            <div style={{ display: "flex", alignItems: "center", gap: G.sp[3], margin: `${G.sp[5]}px 0` }}>
              <div style={{ flex: 1, height: 1, background: c.border }} />
              <span style={{ fontFamily: G.sans, fontSize: 11, color: c.inkMuted }}>{t("login.or")}</span>
              <div style={{ flex: 1, height: 1, background: c.border }} />
            </div>

            <Button variant="ghost" onClick={onSSO} style={{ width: "100%", textAlign: "center", justifyContent: "center" }}>{t("login.sso")}</Button>
          </Card>

          <div style={{ textAlign: "center", marginTop: G.sp[6], fontFamily: lang === "hi" ? G.deva : G.sans, fontSize: 12, color: c.inkMuted }}>
            {t("login.campusSummary")}
          </div>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: G.sp[3], marginTop: G.sp[2] }}>
            <Button variant="link" size="sm" onClick={() => {}}>{t("common.support")}</Button>
            <span style={{ fontFamily: G.sans, fontSize: 11.5, color: c.inkMuted }}>·</span>
            <Button variant="link" size="sm" onClick={() => {}}>{t("common.privacy")}</Button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------
  // ActionBanner — the single most urgent thing on Home.
  // ---------------------------------------------------------------
  function ActionBanner({ onRespond }) {
    const { c } = useTheme();
    const { t } = useLang();
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: G.sp[4], flexWrap: "wrap", minWidth: 0,
        background: c.lateTint, borderRadius: G.r.xl, padding: `${G.sp[4]}px ${G.sp[5]}px`, marginBottom: G.sp[6],
      }}>
        <Glyph kind="missingSwipe" size={38} />
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

  // ---------------------------------------------------------------
  // TodayModule — HoursRing (prominent) + DayTimeline + metrics.
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

  function TodayModule() {
    const { c } = useTheme();
    const { t } = useLang();
    const S = 540, E = 1110; // 09:00 -> 18:30 in minutes-from-midnight
    const now = NOW_MIN;
    const worked = [[542, 705], [765, now]];
    const brk = [[705, 765]];
    const effHours = ((705 - 542) + (now - 765)) / 60;

    return (
      <Card padding={0} style={{ overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: G.sp[3], padding: `${G.sp[4]}px ${G.sp[5]}px ${G.sp[3]}px`, flexWrap: "wrap" }}>
          <span style={{ ...G.t("h3", "latin"), color: c.ink }}>{t("today.today")}</span>
          <Chip tone="present" icon="check">{t("today.present")}</Chip>
          <div style={{ marginLeft: "auto", display: "flex", gap: G.sp[6], flexWrap: "wrap" }}>
            <Metric label={t("today.in")} value="09:02" />
            <Metric label={t("today.break")} value="1h 00m" />
            <Metric label={t("today.out")} value="—" muted />
          </div>
        </div>
        <div style={{ padding: `${G.sp[2]}px ${G.sp[5]}px ${G.sp[5]}px`, display: "flex", gap: G.sp[6], alignItems: "center", flexWrap: "wrap" }}>
          <HoursRing hours={effHours} target={8} size={92} label={t("today.target")} />
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

  // ---------------------------------------------------------------
  // WeekPattern — "Weekly pattern" bar chart, coloured by day state.
  // ---------------------------------------------------------------
  const WEEK_DAYS = [
    { day: 18, wd: "Mon", state: "present", hours: 7.7 },
    { day: 19, wd: "Tue", state: "off", hours: 0 },
    { day: 20, wd: "Wed", state: "late", hours: 6.9 },
    { day: 21, wd: "Thu", state: "absent", hours: 0 },
    { day: 22, wd: "Fri", state: "present", hours: 7.3, today: true },
    { day: 23, wd: "Sat", state: "future", hours: 0 },
    { day: 24, wd: "Sun", state: "future", hours: 0 },
  ];

  function WeekPattern({ onNavigate }) {
    const { t } = useLang();
    return (
      <div>
        <SectionHeader action={t("week.viewFullAttendance")} onAction={() => onNavigate && onNavigate("attendance")}>
          {t("week.weeklyPattern")}
        </SectionHeader>
        <Card>
          <WeekStripChart days={WEEK_DAYS} maxHours={8} />
        </Card>
      </div>
    );
  }

  // ---------------------------------------------------------------
  // RecentDays — row-level state tinting + small uppercase pills.
  // ---------------------------------------------------------------
  function RecentDays() {
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

  // ---------------------------------------------------------------
  // LeaveBalances — colour donuts, one per leave TYPE.
  // ---------------------------------------------------------------
  function LeaveBalances({ onNavigate }) {
    const { t } = useLang();
    return (
      <div>
        <SectionHeader action={t("leave.applyLeave")} onAction={() => onNavigate && onNavigate("leave")} info={t("leave.vacationHint")}>
          {t("leave.leaveBalance")}
        </SectionHeader>
        <Card>
          <div style={{ display: "flex", flexWrap: "wrap", gap: G.sp[5], justifyContent: "space-between" }}>
            <LeaveDonut typeKey="EL" value={null} label={t("leave.vacation")} sublabel={t("leave.na")} />
            <LeaveDonut typeKey="Casual" value={4} max={8} label={t("leave.casual")} sublabel={t("leave.daysAvailable")} />
            <LeaveDonut typeKey="Sick" value={6} max={10} label={t("leave.sick")} sublabel={t("leave.daysAvailable")} />
            <LeaveDonut typeKey="Comp" value={2} max={5} label={t("leave.comp")} sublabel={t("leave.daysAvailable")} />
          </div>
        </Card>
      </div>
    );
  }

  // ---------------------------------------------------------------
  // PayslipSection — payday moment card.
  // ---------------------------------------------------------------
  function PayslipSection({ onNavigate }) {
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

  // ---------------------------------------------------------------
  // Upcoming — holidays / vacation, with character glyphs.
  // ---------------------------------------------------------------
  function UpcomingRow({ glyph, title, sub, date, last }) {
    const { c } = useTheme();
    return (
      <div style={{ display: "flex", alignItems: "center", gap: G.sp[3], padding: `${G.sp[3]}px 0`, borderBottom: last ? "none" : `1px solid ${c.border}` }}>
        <Glyph kind={glyph} size={30} tint />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: G.sans, fontSize: 13.5, color: c.ink, fontWeight: 600 }}>{title}</div>
          <div style={{ fontFamily: G.sans, fontSize: 12, color: c.inkMuted, marginTop: 1 }}>{sub}</div>
        </div>
        <div style={{ fontFamily: G.mono, fontSize: 12.5, fontWeight: 600, color: c.ink, fontFeatureSettings: "'tnum' 1, 'lnum' 1" }}>{date}</div>
      </div>
    );
  }

  function Upcoming() {
    const { t } = useLang();
    return (
      <div>
        <SectionHeader>{t("upcoming.upcoming")}</SectionHeader>
        <Card>
          <UpcomingRow glyph="holiday" title={t("upcoming.independenceDay")} sub={t("upcoming.nationalHoliday")} date="15 Aug" />
          <UpcomingRow glyph="weeklyOff" title={t("upcoming.summerVacation")} sub={t("upcoming.termBreak")} date="18–31 May" last />
        </Card>
      </div>
    );
  }

  // ---------------------------------------------------------------
  // EmployeeHome
  // ---------------------------------------------------------------
  function EmployeeHome({ onNavigate }) {
    const { c } = useTheme();
    const { t, lang } = useLang();
    const hasPendingAction = true;
    const greeting = t(greetingKeyForMinutes(NOW_MIN));
    return (
      <div style={{ maxWidth: CONTENT_MAX, margin: "0 auto" }}>
        {hasPendingAction && <ActionBanner onRespond={() => onNavigate && onNavigate("documents")} />}

        <div style={{ ...G.t("h1", lang === "hi" ? "deva" : "latin"), color: c.ink }}>{greeting}, Ananya</div>
        <div style={{ fontFamily: lang === "hi" ? G.deva : G.sans, fontSize: 13.5, color: c.inkMuted, marginTop: 4, marginBottom: G.sp[6] }}>
          {t("home.roleLine")}
        </div>

        <div style={{ marginBottom: G.sp[6] }}><TodayModule /></div>

        <div style={{ display: "flex", gap: G.sp[8], alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 520px", minWidth: 380 }}>
            <div style={{ marginBottom: G.sp[6] }}><WeekPattern onNavigate={onNavigate} /></div>
            <div style={{ marginBottom: G.sp[6] }}><RecentDays /></div>
            <LeaveBalances onNavigate={onNavigate} />
          </div>
          <div style={{ flex: "1 1 380px", minWidth: 320 }}>
            <div style={{ marginBottom: G.sp[6] }}><PayslipSection onNavigate={onNavigate} /></div>
            <Upcoming />
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------
  // RoutePlaceholder — every unbuilt route gets a warm, illustrated,
  // encouraging empty state (never a bare "coming soon" icon).
  // ---------------------------------------------------------------
  function RoutePlaceholder({ routeKey }) {
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
  // EmployeeShell — an L-shaped terracotta frame: vertical sidebar +
  // horizontal top bar, both the shell gradient, around a cream canvas.
  // ---------------------------------------------------------------
  function EmployeeShell({ route, onNavigate, onSignOut, onViewAdmin, role, children }) {
    const { c, mode } = useTheme();
    const { t, lang } = useLang();
    const canViewAdmin = role && role !== "employee" && !!onViewAdmin;
    const shellBg = `linear-gradient(180deg, ${c.shell2}, ${c.shell})`;
    return (
      <div style={{ display: "flex", width: "100%", height: "100%", background: c.bg }}>
        <div style={{ width: 236, flex: "0 0 236px", background: shellBg, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: `${G.sp[5]}px ${G.sp[5]}px ${G.sp[4]}px` }}>
            <span style={{ ...G.t("h2", "latin"), color: c.onShell }}>Naveya</span>
          </div>
          <nav style={{ flex: 1, padding: `${G.sp[2]}px ${G.sp[3]}px`, display: "flex", flexDirection: "column", gap: 3 }}>
            {EMP_NAV.map((n) => {
              const active = n.key === route;
              return (
                <button
                  key={n.key}
                  type="button"
                  aria-current={active ? "page" : undefined}
                  onClick={() => onNavigate && onNavigate(n.key)}
                  style={{
                    display: "flex", alignItems: "center", gap: G.sp[3], padding: `${G.sp[2]}px ${G.sp[3]}px`,
                    borderRadius: G.r.md, background: active ? c.shellActive : "transparent",
                    border: "none", width: "100%", textAlign: "left", cursor: "pointer", font: "inherit",
                  }}
                >
                  <Icon name={n.icon} size={17} color={active ? c.onShell : c.onShellMuted} />
                  <span style={{ fontFamily: lang === "hi" ? G.deva : G.sans, fontSize: 13.5, fontWeight: active ? 700 : 500, color: active ? c.onShell : c.onShellMuted }}>{t("nav." + n.key)}</span>
                </button>
              );
            })}
          </nav>
          <div style={{ padding: G.sp[4], borderTop: `1px solid ${withAlpha("#FFFFFF", 0.14)}`, display: "flex", alignItems: "center", gap: G.sp[3] }}>
            <Avatar initials="AR" size={30} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: G.sans, fontSize: 12, fontWeight: 700, color: c.onShell, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Ananya Rao</div>
              <div style={{ fontFamily: G.sans, fontSize: 10.5, color: c.onShellMuted }}>PGT · EMP-014</div>
            </div>
            <button onClick={onSignOut} aria-label={t("common.signOut")} style={{ background: "transparent", border: "none", cursor: "pointer", color: c.onShellMuted, display: "flex", padding: 0 }}>
              <Icon name="logout" size={16} color={c.onShellMuted} />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <div style={{ height: 64, flex: "0 0 64px", background: shellBg, display: "flex", alignItems: "center", padding: `0 ${G.sp[5]}px`, gap: G.sp[4] }}>
            <span style={{ fontFamily: G.sans, fontSize: 13.5, fontWeight: 700, color: c.onShell }}>Sunrise Public School</span>
            <div style={{ flex: 1 }} />
            <LangSwitcher />
            <ThemeToggle onDark />
            <Button variant="icon" ariaLabel={t("common.notifications")}><Icon name="bell" size={16} color={c.onShell} /></Button>
            {canViewAdmin && <Button variant="ghost" size="sm" onClick={onViewAdmin} style={{ borderColor: withAlpha("#FFFFFF", 0.3), color: c.onShell }}>{t("common.viewAdminConsole")}</Button>}
          </div>
          <div style={{ flex: 1, overflow: "auto", padding: G.sp[6], boxSizing: "border-box", minWidth: 0 }}>
            {children}
          </div>
        </div>
      </div>
    );
  }

  function EmployeeRouteContent({ route, onNavigate }) {
    if (route === "home") return <EmployeeHome onNavigate={onNavigate} />;
    return <RoutePlaceholder routeKey={route} />;
  }

  function Employee({ route, onNavigate, onSignOut, onViewAdmin, role }) {
    const r = route || "home";
    return (
      <EmployeeShell route={r} onNavigate={onNavigate} onSignOut={onSignOut} onViewAdmin={onViewAdmin} role={role || "employee"}>
        <EmployeeRouteContent route={r} onNavigate={onNavigate} />
      </EmployeeShell>
    );
  }

  window.Screens2 = { Login, Employee };
})();
