/* ============================================================
   home-c.jsx — Naveya Employee Home, VARIANT C
   "Compact icon rail, data as hero"

   Composes ONLY from window.G2 (design/v2/tokens.jsx) and window.UI2
   (design/v2/kit.jsx) — those two files are NOT edited by this
   dispatch. Classic-JSX-runtime IIFE, no imports/exports, inline
   styles only. Exposes window.HomeVariants.C.

   Brief: v2's shell made BOTH the chrome and the data colourful, so
   nothing led the eye ("colour is all over"). Variant C answers with
   the most aggressive chrome-quieting of the three: a ~64px icon-only
   rail (label on hover/focus, not a permanent 236px terracotta slab),
   no top bar at all (controls float, unboxed, top-right), and every
   saved pixel of chrome handed back to the data — a noticeably larger
   hours ring, a fuller-width day timeline, a full-width weekly chart
   with its own summary stats, and larger leave donuts, composed as a
   real two-column CSS Grid so the wide canvas reads as a dashboard,
   not a stretched single column.
   ============================================================ */
(function () {
  const { useState } = React;
  const G = window.G2;
  const {
    useTheme, useLang, ThemeToggle, Button, Chip, Glyph, HoursRing,
    LeaveDonut, DayTimeline, WeekStripChart, DayLogRow, Card,
    SectionHeader, PaydayMoment, Avatar, Icon, EmptyState, withAlpha,
  } = window.UI2;

  const RAIL_W = 64;
  const CONTENT_MAX = 1360;

  // A couple of copy strings this variant needs that aren't in the
  // shared kit table (e.g. the rail's landmark label, the weekly-chart
  // mini-stats). Small, local, EN+HI — same discipline as the kit's
  // STRINGS table, just scoped to this file.
  const CS = {
    en: { railLandmark: "Primary navigation", totalHours: "Total this week", onTimeDays: "on-time days" },
    hi: { railLandmark: "मुख्य नेविगेशन", totalHours: "इस सप्ताह कुल", onTimeDays: "समय पर दिन" },
  };
  function cl(lang, key) {
    return (CS[lang] && CS[lang][key]) || CS.en[key] || key;
  }

  const EMP_NAV = [
    { key: "home", icon: "home" },
    { key: "attendance", icon: "clock" },
    { key: "leave", icon: "calendar" },
    { key: "payslips", icon: "wallet" },
    { key: "documents", icon: "document" },
    { key: "profile", icon: "user" },
  ];

  const NOW_MIN = 796; // 13:16 — one clock drives greeting + the Today hero
  function greetingKeyForMinutes(min) {
    if (min < 12 * 60) return "home.goodMorning";
    if (min < 17 * 60) return "home.goodAfternoon";
    return "home.goodEvening";
  }

  // ---------------------------------------------------------------
  // Rail — icon-only, ~64px, quiet neutral surface. Every button keeps
  // its real aria-label regardless of the hover/focus tooltip (an
  // icon-only rail must never lose its accessible name).
  // ---------------------------------------------------------------
  function RailTooltip({ label, lang }) {
    const { c, el } = useTheme();
    return (
      <div
        role="tooltip"
        style={{
          position: "absolute", left: "calc(100% + 10px)", top: "50%", transform: "translateY(-50%)",
          background: c.ink, color: c.bg, fontFamily: lang === "hi" ? G.deva : G.sans,
          fontSize: 12, fontWeight: 600, padding: "6px 11px", borderRadius: G.r.sm,
          whiteSpace: "nowrap", boxShadow: el[3] || el[2], zIndex: 60, pointerEvents: "none",
        }}
      >
        {label}
      </div>
    );
  }

  function RailItem({ item, active, onClick, lang, t }) {
    const { c } = useTheme();
    const [hover, setHover] = useState(false);
    const [focus, setFocus] = useState(false);
    const show = hover || focus;
    const label = t("nav." + item.key);
    return (
      <div style={{ position: "relative", width: "100%" }}>
        {active && (
          <span
            aria-hidden="true"
            style={{ position: "absolute", left: -8, top: 6, bottom: 6, width: 3, borderRadius: 2, background: c.accent }}
          />
        )}
        <button
          type="button"
          aria-label={label}
          aria-current={active ? "page" : undefined}
          onClick={onClick}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={{
            width: "100%", height: 42, display: "flex", alignItems: "center", justifyContent: "center",
            background: active ? c.accentSoft : hover ? withAlpha(c.ink, 0.05) : "transparent",
            border: "none", borderRadius: G.r.md, cursor: "pointer", padding: 0,
            transition: `background ${G.mo.hover}`,
          }}
        >
          <Icon name={item.icon} size={19} color={active ? c.accent : c.inkMuted} strokeWidth={active ? 2.1 : 1.9} />
        </button>
        {show && <RailTooltip label={label} lang={lang} />}
      </div>
    );
  }

  function RailAvatar({ onSignOut, lang, t }) {
    const { c } = useTheme();
    const [hover, setHover] = useState(false);
    const [focus, setFocus] = useState(false);
    const show = hover || focus;
    const label = t("common.signOut") + " — Ananya Rao";
    return (
      <div style={{ position: "relative", display: "flex", justifyContent: "center", width: "100%", paddingTop: G.sp[3], marginTop: G.sp[2], borderTop: `1px solid ${c.border}` }}>
        <button
          type="button"
          aria-label={label}
          onClick={onSignOut}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", borderRadius: G.r.pill, lineHeight: 0 }}
        >
          <Avatar initials="AR" size={32} />
        </button>
        {show && <RailTooltip label={"Ananya Rao · " + t("common.signOut")} lang={lang} />}
      </div>
    );
  }

  function CompactRail({ route, onNavigate, onSignOut }) {
    const { c } = useTheme();
    const { lang, t } = useLang();
    return (
      <div
        style={{
          width: RAIL_W, flex: `0 0 ${RAIL_W}px`, height: "100%", boxSizing: "border-box",
          background: c.surface, borderRight: `1px solid ${c.border}`,
          display: "flex", flexDirection: "column", alignItems: "center",
          padding: `${G.sp[4]}px 0 ${G.sp[3]}px`,
        }}
      >
        <div
          aria-hidden="true"
          title="Naveya"
          style={{
            width: 32, height: 32, borderRadius: G.r.pill, background: c.accent, color: c.onAccent,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: G.sans, fontWeight: 800, fontSize: 14, marginBottom: G.sp[6], flex: "0 0 auto",
          }}
        >
          N
        </div>
        <nav aria-label={cl(lang, "railLandmark")} style={{ display: "flex", flexDirection: "column", gap: 5, width: "100%", padding: `0 ${G.sp[3]}px`, flex: 1, minHeight: 0 }}>
          {EMP_NAV.map((item) => (
            <RailItem key={item.key} item={item} active={item.key === route} onClick={() => onNavigate && onNavigate(item.key)} lang={lang} t={t} />
          ))}
        </nav>
        <div style={{ width: "100%", padding: `0 ${G.sp[3]}px` }}>
          <RailAvatar onSignOut={onSignOut} lang={lang} t={t} />
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------
  // Floating top-right controls — no top bar; a plain unboxed row
  // that sits on the same near-white canvas as the content (no
  // background slab, no border — it reads as controls, not chrome).
  // ---------------------------------------------------------------
  function CalmLangSwitcher() {
    const { c } = useTheme();
    const { lang, setLang, t } = useLang();
    const opts = [{ v: "en", l: "EN" }, { v: "hi", l: "हिंदी" }];
    return (
      <div role="group" aria-label={t("common.language")} style={{ display: "inline-flex", border: `1px solid ${c.border}`, borderRadius: G.r.pill, overflow: "hidden", background: c.surface, flex: "0 0 auto" }}>
        {opts.map((o) => {
          const active = lang === o.v;
          return (
            <button
              key={o.v}
              type="button"
              aria-pressed={active}
              onClick={() => setLang(o.v)}
              style={{
                fontFamily: o.v === "hi" ? G.deva : G.sans, fontSize: 12, fontWeight: 600, padding: "5px 11px",
                background: active ? c.accentSoft : "transparent", color: active ? c.accent : c.inkMuted,
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

  function FloatingControls() {
    const { c } = useTheme();
    const { t } = useLang();
    return (
      <div style={{ display: "flex", alignItems: "center", gap: G.sp[2], justifyContent: "flex-end" }}>
        <CalmLangSwitcher />
        <ThemeToggle size={32} />
        <Button variant="icon" ariaLabel={t("common.notifications")}>
          <Icon name="bell" size={16} color={c.ink} />
        </Button>
      </div>
    );
  }

  // ---------------------------------------------------------------
  // Shell — rail + floating controls + content. Same content
  // requirements as the current Home; this file only owns layout.
  // ---------------------------------------------------------------
  function CompactShell({ route, onNavigate, onSignOut, children }) {
    const { c } = useTheme();
    return (
      <div style={{ display: "flex", width: "100%", height: "100%", background: c.bg }}>
        <CompactRail route={route} onNavigate={onNavigate} onSignOut={onSignOut} />
        <div style={{ flex: 1, minWidth: 0, overflow: "auto", position: "relative" }}>
          <div style={{ position: "sticky", top: 0, zIndex: 20, background: c.bg, padding: `${G.sp[4]}px ${G.sp[8]}px 0` }}>
            <div style={{ maxWidth: CONTENT_MAX, margin: "0 auto" }}>
              <FloatingControls />
            </div>
          </div>
          <div style={{ padding: `${G.sp[2]}px ${G.sp[8]}px ${G.sp[10]}px`, boxSizing: "border-box" }}>
            {children}
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------
  // ActionBanner — same content as the current Home.
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
  // TodayModule — the hero. Noticeably larger hours ring, a
  // fuller-width day timeline (both get the width a 64px rail frees up).
  // ---------------------------------------------------------------
  function Metric({ label, value, muted }) {
    const { c } = useTheme();
    return (
      <div style={{ textAlign: "right" }}>
        <div style={{ fontFamily: G.sans, fontSize: 11.5, color: c.inkMuted }}>{label}</div>
        <div style={{ fontFamily: G.mono, fontSize: 15, fontWeight: 600, color: muted ? c.inkMuted : c.ink, marginTop: 2, fontFeatureSettings: "'tnum' 1, 'lnum' 1" }}>{value}</div>
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
        <div style={{ display: "flex", alignItems: "center", gap: G.sp[3], padding: `${G.sp[5]}px ${G.sp[6]}px ${G.sp[3]}px`, flexWrap: "wrap" }}>
          <span style={{ ...G.t("h2", "latin"), color: c.ink }}>{t("today.today")}</span>
          <Chip tone="present" icon="check">{t("today.present")}</Chip>
          <div style={{ marginLeft: "auto", display: "flex", gap: G.sp[6], flexWrap: "wrap" }}>
            <Metric label={t("today.in")} value="09:02" />
            <Metric label={t("today.break")} value="1h 00m" />
            <Metric label={t("today.out")} value="—" muted />
          </div>
        </div>
        <div style={{ padding: `${G.sp[3]}px ${G.sp[6]}px ${G.sp[6]}px`, display: "flex", gap: G.sp[8], alignItems: "center", flexWrap: "wrap" }}>
          <HoursRing hours={effHours} target={8} size={176} label={t("today.target")} />
          <div style={{ flex: "1 1 460px", minWidth: 380 }}>
            <DayTimeline startMin={S} endMin={E} worked={worked} breaks={brk} now={now} />
            <div style={{ marginTop: G.sp[4], fontFamily: G.sans, fontSize: 12.5, color: c.inkMuted }}>
              {t("today.recordedAt")} &nbsp;·&nbsp; <Button variant="link" size="sm">{t("today.viewFullTimecard")}</Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // ---------------------------------------------------------------
  // WeekPattern — full-width so the chart gets a whole dashboard row
  // (not squeezed into a sidebar column), plus a small stats strip so
  // the section carries more than just seven bars.
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
    const { c } = useTheme();
    const { t, lang } = useLang();
    const totalHours = WEEK_DAYS.reduce((s, d) => s + (d.hours || 0), 0);
    const onTimeDays = WEEK_DAYS.filter((d) => d.state === "present").length;
    const h = Math.floor(totalHours);
    const m = Math.round((totalHours - h) * 60);
    return (
      <div>
        <SectionHeader action={t("week.viewFullAttendance")} onAction={() => onNavigate && onNavigate("attendance")}>
          {t("week.weeklyPattern")}
        </SectionHeader>
        <Card>
          <div style={{ display: "flex", gap: G.sp[8], marginBottom: G.sp[4], flexWrap: "wrap" }}>
            <div>
              <div style={{ fontFamily: G.sans, fontSize: 11.5, color: c.inkMuted }}>{cl(lang, "totalHours")}</div>
              <div style={{ fontFamily: G.mono, fontSize: 20, fontWeight: 700, color: c.ink, marginTop: 2, fontFeatureSettings: "'tnum' 1, 'lnum' 1" }}>{h}h {m ? `${m}m` : ""}</div>
            </div>
            <div>
              <div style={{ fontFamily: G.sans, fontSize: 11.5, color: c.inkMuted }}>{t("today.present")}</div>
              <div style={{ fontFamily: G.mono, fontSize: 20, fontWeight: 700, color: c.present, marginTop: 2, fontFeatureSettings: "'tnum' 1, 'lnum' 1" }}>{onTimeDays} <span style={{ fontFamily: G.sans, fontSize: 12.5, fontWeight: 500, color: c.inkMuted }}>{cl(lang, "onTimeDays")}</span></div>
            </div>
          </div>
          <WeekStripChart days={WEEK_DAYS} maxHours={8} />
        </Card>
      </div>
    );
  }

  // ---------------------------------------------------------------
  // RecentDays — same content, row-level state tinting + pills.
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
  // LeaveBalances — prominent donuts, sized up from the kit default.
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
            <LeaveDonut typeKey="EL" value={null} label={t("leave.vacation")} sublabel={t("leave.na")} size={132} />
            <LeaveDonut typeKey="Casual" value={4} max={8} label={t("leave.casual")} sublabel={t("leave.daysAvailable")} size={132} />
            <LeaveDonut typeKey="Sick" value={6} max={10} label={t("leave.sick")} sublabel={t("leave.daysAvailable")} size={132} />
            <LeaveDonut typeKey="Comp" value={2} max={5} label={t("leave.comp")} sublabel={t("leave.daysAvailable")} size={132} />
          </div>
        </Card>
      </div>
    );
  }

  // ---------------------------------------------------------------
  // PayslipSection
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
  // Upcoming
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
  // DashboardHome — a real dashboard grid, not one stretched column.
  // Today/Weekly/Leave get their own full-width hero rows (this is
  // where the freed-up rail width goes: a bigger ring, a fuller
  // timeline, a chart with its own stats, donuts that never wrap).
  // Only the final Recent-days / Payslip+Upcoming pairing is a true
  // two-column split — deliberately NOT CSS-Grid-row-synced with a
  // sibling column, because Grid stretches a row to its tallest
  // cell: pairing "recent" against the (taller) donut card left a
  // dead gap under the shorter column mid-page. A plain two-column
  // flex row lets each column's content flow to its own height.
  // ---------------------------------------------------------------
  function DashboardHome({ onNavigate }) {
    const { c } = useTheme();
    const { t, lang } = useLang();
    const hasPendingAction = true;
    const greeting = t(greetingKeyForMinutes(NOW_MIN));
    return (
      <div style={{ maxWidth: CONTENT_MAX, margin: "0 auto" }}>
        {hasPendingAction && <ActionBanner onRespond={() => onNavigate && onNavigate("documents")} />}

        <div style={{ ...G.t("display", lang === "hi" ? "deva" : "latin"), color: c.ink }}>{greeting}, Ananya</div>
        <div style={{ fontFamily: lang === "hi" ? G.deva : G.sans, fontSize: 14, color: c.inkMuted, marginTop: 4, marginBottom: G.sp[6] }}>
          {t("home.roleLine")}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: G.sp[6] }}>
          <TodayModule />
          <WeekPattern onNavigate={onNavigate} />
          <LeaveBalances onNavigate={onNavigate} />

          <div style={{ display: "flex", gap: G.sp[8], alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ flex: "1.4 1 480px", minWidth: 360 }}>
              <RecentDays />
            </div>
            <div style={{ flex: "1 1 380px", minWidth: 320, display: "flex", flexDirection: "column", gap: G.sp[6] }}>
              <PayslipSection onNavigate={onNavigate} />
              <Upcoming />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------
  // RoutePlaceholder — every other rail destination gets a warm,
  // illustrated empty state so the rail is demonstrably navigable.
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
  // HomeVariantC — the full screen (shell + content) for this variant.
  // ---------------------------------------------------------------
  function HomeVariantC() {
    const [route, setRoute] = useState("home");
    return (
      <CompactShell route={route} onNavigate={setRoute} onSignOut={() => {}}>
        {route === "home" ? <DashboardHome onNavigate={setRoute} /> : <RoutePlaceholder routeKey={route} />}
      </CompactShell>
    );
  }

  window.HomeVariants = window.HomeVariants || {};
  window.HomeVariants.C = HomeVariantC;
})();
