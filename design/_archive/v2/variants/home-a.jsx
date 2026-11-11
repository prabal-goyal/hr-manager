/* ============================================================
   home-a.jsx — Naveya Employee Home, VARIANT A "Keka-faithful rail"
   Composes ONLY from window.G2 (tokens) + window.UI2 (kit). Classic-
   JSX-runtime IIFE, no imports/exports, inline styles only.

   Brief: the v2 ("STAFFROOM / Terracotta Clay") Home put colour in
   BOTH the chrome (a big gradient terracotta sidebar + top bar) AND
   the data — so nothing led the eye. Keka's actual live pattern is
   CALM CHROME + COLOURFUL DATA: a narrow dark rail that recedes, a
   thin brand-colour top bar, a near-white canvas — and every bit of
   colour energy spent on the data (rings, donuts, bars, pills,
   glyphs). This file keeps that discipline:
     - Rail (84px): flat, deep, NEUTRAL-DARK tinted toward the brand
       hue (mixed from G2.surf.canvas + the theme's c.shell — never
       the shell's own saturated gradient). Icon-over-label, one
       soft-fill active state. No wordmark text, just a monogram.
     - Top bar (56px): flat c.shell (not the retired 2-stop
       gradient), holding the school name, a centred search field,
       language switcher, theme toggle, notifications. Thin + calm.
     - Canvas + cards: c.bg / c.raised — near-white in light, warm
       near-black in dark. All the colour lives in HoursRing,
       WeekStripChart, LeaveDonut, DayLogRow tinting, Glyph, Chip.
   ============================================================ */
(function () {
  const { useState, useEffect } = React;
  const G = window.G2;
  const {
    useTheme, useLang, ThemeToggle, LangSwitcher, Button,
    Chip, Glyph, HoursRing, LeaveDonut, DayTimeline, WeekStripChart,
    DayLogRow, Card, SectionHeader, PaydayMoment, Avatar, Icon,
    EmptyState, withAlpha,
  } = window.UI2;

  const CONTENT_MAX = 1200;
  const RAIL_W = 84;
  const TOPBAR_H = 56;

  // ---------------------------------------------------------------
  // Local i18n overlay — ONLY the couple of chrome strings this
  // variant needs that aren't already in the kit's STRINGS table
  // (the search field). Everything else reuses useLang()/t() as-is.
  // ---------------------------------------------------------------
  const LOCAL_STRINGS = {
    en: { "chrome.search": "Search", "chrome.searchPlaceholder": "Search…" },
    hi: { "chrome.search": "खोजें", "chrome.searchPlaceholder": "खोजें…" },
  };
  function useT2() {
    const { t, lang } = useLang();
    const t2 = (key) => {
      const table = LOCAL_STRINGS[lang] || LOCAL_STRINGS.en;
      return table[key] !== undefined ? table[key] : t(key);
    };
    return { t2, t, lang };
  }

  // ---------------------------------------------------------------
  // Colour mix helper — derives the rail's "deep neutral tinted
  // toward the brand hue" fill from TWO existing tokens only
  // (G2.surf.canvas + the theme's c.shell), never a new hex literal.
  // ---------------------------------------------------------------
  function hexToRgbLocal(hex) {
    const h = hex.replace("#", "");
    const full = h.length === 3 ? h.split("").map((ch) => ch + ch).join("") : h;
    const n = parseInt(full, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  function mixHex(hexA, hexB, amt) {
    const a = hexToRgbLocal(hexA), b = hexToRgbLocal(hexB);
    const r = Math.round(a.r + (b.r - a.r) * amt);
    const g = Math.round(a.g + (b.g - a.g) * amt);
    const bl = Math.round(a.b + (b.b - a.b) * amt);
    return `rgb(${r}, ${g}, ${bl})`;
  }

  const RAIL_NAV = [
    { key: "home", icon: "home" },
    { key: "attendance", icon: "clock" },
    { key: "leave", icon: "calendar" },
    { key: "payslips", icon: "wallet" },
    { key: "documents", icon: "document" },
    { key: "profile", icon: "user" },
  ];

  const NOW_MIN = 796; // 13:16 — one clock drives greeting + Today
  function greetingKeyForMinutes(min) {
    if (min < 12 * 60) return "home.goodMorning";
    if (min < 17 * 60) return "home.goodAfternoon";
    return "home.goodEvening";
  }

  // ---------------------------------------------------------------
  // Rail — narrow (84px), icon above label, one soft active fill.
  // Deliberately flat/dark regardless of app theme: it should recede.
  // ---------------------------------------------------------------
  function Rail({ route, onNavigate, onSignOut }) {
    const { c, mode } = useTheme();
    const { t, lang } = useLang();
    const railBg = mixHex(G.surf.canvas, c.shell, mode === "dark" ? 0.3 : 0.24);
    return (
      <div style={{ width: RAIL_W, flex: `0 0 ${RAIL_W}px`, background: railBg, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ padding: `${G.sp[4]}px 0 ${G.sp[3]}px` }}>
          <div
            aria-hidden="true"
            style={{
              width: 36, height: 36, borderRadius: G.r.md, background: withAlpha("#FFFFFF", 0.1),
              border: `1px solid ${withAlpha("#FFFFFF", 0.14)}`, display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: G.sans, fontWeight: 800, fontSize: 15, color: c.onShell,
            }}
          >
            N
          </div>
        </div>

        <nav aria-label={t("nav.home")} style={{ flex: 1, width: "100%", display: "flex", flexDirection: "column", gap: 2, padding: `${G.sp[1]}px ${G.sp[1.5]}px` }}>
          {RAIL_NAV.map((n) => {
            const active = n.key === route;
            return (
              <button
                key={n.key}
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => onNavigate && onNavigate(n.key)}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
                  width: "100%", padding: `${G.sp[2]}px 2px`, borderRadius: G.r.md,
                  background: active ? c.shellActive : "transparent", border: "none", cursor: "pointer", font: "inherit",
                  transition: `background ${G.mo.hover}`,
                }}
              >
                <Icon name={n.icon} size={18} color={active ? c.accent : c.onShellMuted} strokeWidth={active ? 2.1 : 1.9} />
                <span
                  style={{
                    fontFamily: lang === "hi" ? G.deva : G.sans, fontSize: lang === "hi" ? 9 : 9.5,
                    lineHeight: 1.15, fontWeight: active ? 700 : 500, color: active ? c.onShell : c.onShellMuted,
                    textAlign: "center", whiteSpace: "normal", maxWidth: RAIL_W - 14,
                  }}
                >
                  {t("nav." + n.key)}
                </span>
              </button>
            );
          })}
        </nav>

        <div style={{ width: "100%", padding: `${G.sp[3]}px 0 ${G.sp[4]}px`, borderTop: `1px solid ${withAlpha("#FFFFFF", 0.1)}`, display: "flex", flexDirection: "column", alignItems: "center", gap: G.sp[2] }}>
          <Avatar initials="AR" size={32} />
          <button
            onClick={onSignOut}
            aria-label={t("common.signOut")}
            title={t("common.signOut")}
            style={{ background: "transparent", border: "none", cursor: "pointer", color: c.onShellMuted, display: "flex", padding: 4 }}
          >
            <Icon name="logout" size={15} color={c.onShellMuted} />
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------
  // TopBar — thin (56px), flat brand colour, search centred.
  // ---------------------------------------------------------------
  function SearchField() {
    const { c } = useTheme();
    const { t2, lang } = useT2();
    const [focused, setFocused] = useState(false);
    useEffect(() => {
      let tag = document.getElementById("tn2-home-a-style");
      if (!tag) {
        tag = document.createElement("style");
        tag.id = "tn2-home-a-style";
        document.head.appendChild(tag);
      }
      tag.textContent = `#tn2-home-a-search::placeholder { color: ${withAlpha("#FFFFFF", 0.62)}; }`;
    }, []);
    return (
      <div
        style={{
          display: "flex", alignItems: "center", gap: 8, width: "100%", maxWidth: 380,
          background: withAlpha("#FFFFFF", focused ? 0.18 : 0.12),
          border: `1px solid ${withAlpha("#FFFFFF", focused ? 0.34 : 0.2)}`,
          borderRadius: G.r.pill, padding: "6px 12px", boxSizing: "border-box",
          transition: `background ${G.mo.hover}, border ${G.mo.hover}`,
        }}
      >
        <Icon name="search" size={14} color={c.onShellMuted} strokeWidth={2} />
        <input
          id="tn2-home-a-search"
          type="text"
          aria-label={t2("chrome.search")}
          placeholder={t2("chrome.searchPlaceholder")}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none",
            fontFamily: lang === "hi" ? G.deva : G.sans, fontSize: 13, color: c.onShell,
          }}
        />
      </div>
    );
  }

  function TopBar({ schoolName }) {
    const { c } = useTheme();
    const { t } = useLang();
    return (
      <div
        style={{
          height: TOPBAR_H, flex: `0 0 ${TOPBAR_H}px`, background: c.shell,
          display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center",
          padding: `0 ${G.sp[5]}px`, gap: G.sp[4], boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", minWidth: 0 }}>
          <span style={{ fontFamily: G.sans, fontSize: 13.5, fontWeight: 700, color: c.onShell, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {schoolName}
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
          <SearchField />
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: G.sp[3] }}>
          <LangSwitcher size="sm" />
          <ThemeToggle onDark size={30} />
          <Button variant="icon" ariaLabel={t("common.notifications")}>
            <Icon name="bell" size={16} color={c.onShell} />
          </Button>
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
      <div
        style={{
          display: "flex", alignItems: "center", gap: G.sp[4], flexWrap: "wrap", minWidth: 0,
          background: c.lateTint, borderRadius: G.r.xl, padding: `${G.sp[4]}px ${G.sp[5]}px`, marginBottom: G.sp[6],
        }}
      >
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
  // TodayModule — HoursRing + DayTimeline + In/Break/Out metrics.
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
  // EmployeeHomeA — the full Home content, same as v2 but composed
  // for the calmer chrome around it.
  // ---------------------------------------------------------------
  function EmployeeHomeA({ onNavigate }) {
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
  // encouraging empty state (rail navigation is fully clickable even
  // though only Home has content in this canvas).
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

  function RouteContent({ route, onNavigate }) {
    if (route === "home") return <EmployeeHomeA onNavigate={onNavigate} />;
    return <RoutePlaceholder routeKey={route} />;
  }

  // ---------------------------------------------------------------
  // ShellA — the whole redesigned chrome: narrow dark rail + thin
  // brand top bar around a near-white/near-black scrollable canvas.
  // ---------------------------------------------------------------
  function ShellA({ route, onNavigate, onSignOut, children }) {
    const { c } = useTheme();
    return (
      <div style={{ display: "flex", width: "100%", height: "100%", background: c.bg }}>
        <Rail route={route} onNavigate={onNavigate} onSignOut={onSignOut} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <TopBar schoolName="Sunrise Public School" />
          <div style={{ flex: 1, overflow: "auto", padding: G.sp[6], boxSizing: "border-box", minWidth: 0 }}>
            {children}
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------
  // HomeA — the exported, self-contained screen.
  // ---------------------------------------------------------------
  function HomeA() {
    const [route, setRoute] = useState("home");
    return (
      <ShellA route={route} onNavigate={setRoute} onSignOut={() => setRoute("home")}>
        <RouteContent route={route} onNavigate={setRoute} />
      </ShellA>
    );
  }

  window.HomeVariants = window.HomeVariants || {};
  window.HomeVariants.A = HomeA;
})();
