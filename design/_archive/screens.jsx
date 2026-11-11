/* ============================================================
   screens.jsx — Naveya rebuilt screens, employee-first.
   Composes ONLY from window.UI (design/kit.jsx). Classic-JSX
   runtime IIFE, no imports/exports. Exposes window.Screens.
   ============================================================ */
(function () {
  const { useState } = React;
  const G = window.G;
  const {
    useTheme, ThemeToggle, Button, Field, Input, Select, Search,
    Badge, StatusPill, Card, SectionHeader, BilingualLabel, Figure,
    Icon, Avatar, Mark, withAlpha,
  } = window.UI;

  // Consistent, wider content column shared by every employee screen —
  // centered (margin auto) so wide desktop viewports get balanced
  // left/right margins instead of content hugging the sidebar edge
  // with a void on the right (impeccable-critique global finding).
  const CONTENT_MAX = 1200;

  // ---------------------------------------------------------------
  // Shared nav model (employee shell)
  // ---------------------------------------------------------------
  const EMP_NAV = [
    { key: "home", label: "Home", icon: "home" },
    { key: "attendance", label: "My Attendance", icon: "clock" },
    { key: "leave", label: "Leave", icon: "calendar" },
    { key: "payslips", label: "Payslips", icon: "wallet" },
    { key: "documents", label: "Documents", icon: "document" },
    { key: "profile", label: "Profile", icon: "user" },
  ];

  // ---------------------------------------------------------------
  // Clock — ONE source of "now" drives both the Today module's live
  // marker and the Home greeting, so they can never disagree (the
  // critique's "Good morning at 13:16" incoherence). 09:00-18:30 scale.
  // ---------------------------------------------------------------
  const NOW_MIN = 796; // 13:16
  function greetingForMinutes(min) {
    if (min < 12 * 60) return "Good morning";
    if (min < 17 * 60) return "Good afternoon";
    return "Good evening";
  }

  // ---------------------------------------------------------------
  // Login — centered, calm, no glass/eyebrow/side-stripe.
  // Real validation (required + email format), a disabled-until-valid
  // Continue, a loading/pending state, and an inline auth-error banner
  // — the design-canvas mock simulates a backend call: any password
  // other than the sentinel below reproduces the "incorrect credential"
  // failure path so the state is reviewable without a real API.
  // ---------------------------------------------------------------
  const MOCK_VALID_PASSWORD = "password123"; // design-canvas only — real auth wires to the backend.
  function isValidEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

  function Login({ onContinue, onSSO }) {
    const { c } = useTheme();
    const [email, setEmail] = useState("ananya.rao@sunrise.edu");
    const [password, setPassword] = useState("");
    const [touched, setTouched] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [authError, setAuthError] = useState(false);

    const emailValid = isValidEmail(email);
    const emailError = touched && !email ? "Work email is required" : touched && !emailValid ? "Enter a valid email address" : undefined;
    const passwordError = touched && !password ? "Password is required" : undefined;

    function handleContinue(e) {
      if (e && e.preventDefault) e.preventDefault();
      setTouched(true);
      setAuthError(false);
      if (!emailValid || !password) return;
      setSubmitting(true);
      window.setTimeout(function () {
        setSubmitting(false);
        if (password === MOCK_VALID_PASSWORD) {
          onContinue && onContinue();
        } else {
          setAuthError(true);
        }
      }, 650);
    }

    return (
      <div style={{ width: "100%", height: "100%", background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: G.sp[6], boxSizing: "border-box", overflow: "auto" }}>
        <div style={{ width: "100%", maxWidth: 380 }}>
          <div style={{ textAlign: "center", marginBottom: G.sp[8] }}>
            <span style={{ ...G.t("display", "latin"), fontSize: 28, color: c.ink }}>Naveya</span>
          </div>

          <Card>
            <div style={{ ...G.t("h2", "latin"), color: c.ink, marginBottom: 2 }}>Welcome back</div>
            <div style={{ fontFamily: G.sans, fontSize: 13, color: c.inkMuted, marginBottom: G.sp[5] }}>
              Sign in to Sunrise Vidya Group
            </div>

            {authError && (
              <div style={{
                display: "flex", alignItems: "flex-start", gap: G.sp[2],
                background: withAlpha(c.danger, 0.1), border: `1px solid ${c.danger}`, borderRadius: G.r.sm,
                padding: G.sp[3], marginBottom: G.sp[4],
              }}>
                <Icon name="alert" size={14} color={c.danger} strokeWidth={2.2} style={{ marginTop: 1, flex: "0 0 auto" }} />
                <span style={{ fontFamily: G.sans, fontSize: 12.5, color: c.ink }}>
                  Email or password is incorrect. Please try again, or use "Forgot?" to reset it.
                </span>
              </div>
            )}

            {/* Continue stays keyboard-submittable via Enter even while it's
                visually disabled-until-valid: a disabled submit button can
                silently swallow a form's native implicit submission in some
                browsers, so Enter is wired explicitly here too. */}
            <form onSubmit={handleContinue}>
              <div style={{ display: "flex", flexDirection: "column", gap: G.sp[4] }}>
                <Field label="Work email" error={emailError}>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@school.edu" error={emailError} />
                </Field>
                <Field label="Password" labelAction="Forgot?" onLabelAction={() => {}} error={passwordError}>
                  <Input
                    type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password" error={passwordError}
                    onKeyDown={(e) => { if (e.key === "Enter") handleContinue(e); }}
                  />
                </Field>
              </div>

              <div style={{ marginTop: G.sp[6] }}>
                {/* Looks disabled-until-valid, but stays a real, clickable
                    <button> (not the native `disabled` attribute) — a
                    hard-disabled submit swallows the click entirely, so a
                    first-time invalid attempt would have no way to reveal
                    its validation errors. Clicking while invalid still
                    runs handleContinue, which surfaces the errors. */}
                <Button
                  type="submit" variant="primary" loading={submitting}
                  style={{
                    width: "100%", textAlign: "center", justifyContent: "center",
                    opacity: !submitting && (!emailValid || !password) ? 0.55 : 1,
                  }}
                >
                  {submitting ? "Signing in…" : "Continue"}
                </Button>
              </div>
            </form>

            <div style={{ display: "flex", alignItems: "center", gap: G.sp[3], margin: `${G.sp[5]}px 0` }}>
              <div style={{ flex: 1, height: 1, background: c.border }} />
              <span style={{ fontFamily: G.sans, fontSize: 11, color: c.inkMuted }}>or</span>
              <div style={{ flex: 1, height: 1, background: c.border }} />
            </div>

            <Button variant="ghost" onClick={onSSO} style={{ width: "100%", textAlign: "center", justifyContent: "center" }}>Sign in with school SSO</Button>
          </Card>

          <div style={{ textAlign: "center", marginTop: G.sp[6], fontFamily: G.sans, fontSize: 12, color: c.inkMuted }}>
            Sunrise Vidya Group · 3 campuses · 214 staff
          </div>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: G.sp[3], marginTop: G.sp[2] }}>
            <Button variant="link" size="sm" onClick={() => {}}>Support</Button>
            <span style={{ fontFamily: G.sans, fontSize: 11.5, color: c.inkMuted }}>·</span>
            <Button variant="link" size="sm" onClick={() => {}}>Privacy</Button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------
  // Employee Home — Today / Leave balance / Payslip ledger row /
  // Action needed (document governance) / Upcoming / Quick actions
  // ---------------------------------------------------------------
  function Metric({ label, value, title }) {
    const { c } = useTheme();
    return (
      <div style={{ textAlign: "right" }} title={title}>
        <div style={{ fontFamily: G.sans, fontSize: 11.5, color: c.inkMuted }}>{label}</div>
        <div style={{ fontFamily: G.mono, fontSize: 14, fontWeight: 600, color: value === "—" ? c.inkMuted : c.ink, marginTop: 2 }}>{value}</div>
      </div>
    );
  }

  function TodayModule() {
    const { c } = useTheme();
    const S = 540, E = 1110; // 09:00 -> 18:30 in minutes-from-midnight
    const pc = (m) => ((m - S) / (E - S)) * 100;
    const now = NOW_MIN; // same clock that drives the Home greeting — never disagree
    const worked = [[542, 705], [765, now]];
    const brk = [[705, 765]];

    return (
      <Card padding={0}>
        <div style={{ display: "flex", alignItems: "center", gap: G.sp[4], padding: `${G.sp[4]}px ${G.sp[5]}px`, borderBottom: `1px solid ${c.border}`, flexWrap: "wrap" }}>
          <BilingualLabel en="Today" deva="आज" role="h3" />
          <Badge tone="success" icon="check">Present</Badge>
          <div style={{ marginLeft: "auto", display: "flex", gap: G.sp[6], flexWrap: "wrap" }}>
            <Metric label="In" value="09:02" />
            <Metric label="Effective" value="3h 14m" title="Hours actually worked so far, break time excluded" />
            <Metric label="Break" value="1h 00m" />
            <Metric label="Out" value="—" />
          </div>
        </div>
        <div style={{ padding: `${G.sp[5]}px ${G.sp[5]}px ${G.sp[4]}px` }}>
          <div style={{ position: "relative", height: 24 }}>
            <div style={{ position: "absolute", top: 7, left: 0, right: 0, height: 10, background: c.bg, borderRadius: G.r.xs, border: `1px solid ${c.border}` }} />
            {worked.map(([a, b], i) => (
              <div key={i} style={{ position: "absolute", top: 7, height: 10, left: `${pc(a)}%`, width: `${pc(b) - pc(a)}%`, background: c.accent, borderRadius: G.r.xs }} />
            ))}
            {brk.map(([a, b], i) => (
              <div key={i} title="Lunch break" style={{ position: "absolute", top: 7, height: 10, left: `${pc(a)}%`, width: `${pc(b) - pc(a)}%`, background: withAlpha(c.inkMuted, 0.3) }} />
            ))}
            <div style={{ position: "absolute", top: 1, left: `${pc(now)}%`, width: 2, height: 22, background: c.brass, borderRadius: 1 }} />
          </div>
          <div style={{ position: "relative", height: 14, marginTop: 5 }}>
            {[9, 11, 13, 15, 17].map((h) => (
              <span key={h} style={{ position: "absolute", left: `${pc(h * 60)}%`, transform: "translateX(-50%)", fontFamily: G.mono, fontSize: 9.5, color: c.inkMuted }}>{h}:00</span>
            ))}
          </div>
          <div style={{ marginTop: G.sp[3], fontFamily: G.sans, fontSize: 12, color: c.inkMuted }}>
            <span title="Fingerprint/face attendance scanner">Recorded at Gate-2 · biometric</span> &nbsp;·&nbsp; <Button variant="link" size="sm">View full timecard</Button>
          </div>
        </div>
      </Card>
    );
  }

  function Row({ label, sub, value, last }) {
    const { c } = useTheme();
    const isMuted = value === "—" || value === "N/A";
    return (
      <div style={{ display: "flex", alignItems: "center", padding: `${G.sp[3]}px 0`, borderBottom: last ? "none" : `1px solid ${c.border}` }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: G.sans, fontSize: 13.5, color: c.ink, fontWeight: 500 }}>{label}</div>
          {sub && <div style={{ fontFamily: G.sans, fontSize: 12, color: c.inkMuted, marginTop: 1 }}>{sub}</div>}
        </div>
        {value !== undefined && (
          <div style={{ fontFamily: G.mono, fontSize: 14, fontWeight: 600, color: isMuted ? c.inkMuted : c.ink, minWidth: 84, textAlign: "right", fontFeatureSettings: "'tnum' 1, 'lnum' 1" }}>
            {value}
          </div>
        )}
      </div>
    );
  }

  function LeaveBalance({ onNavigate }) {
    return (
      <div>
        <SectionHeader action="Apply leave" onAction={() => onNavigate && onNavigate("leave")}>
          <BilingualLabel en="Leave balance" deva="अवकाश शेष" role="h3" />
        </SectionHeader>
        <Row label="Vacation" sub="Vacation, granted in lieu of Earned Leave (EL) for vacation staff — N/A here, not missing data" value="N/A" />
        <Row label="Casual leave" sub="days available" value="4" />
        <Row label="Sick leave" sub="days available" value="6" />
        <Row label="Comp-off" sub="days available · earned for extra duty worked" value="2" last />
      </div>
    );
  }

  function PayslipRow({ onNavigate }) {
    const { c } = useTheme();
    return (
      <div>
        <SectionHeader action="View all" onAction={() => onNavigate && onNavigate("payslips")}>
          <BilingualLabel en="Payslips" deva="वेतन पर्ची" role="h3" />
        </SectionHeader>
        <Card padding={0}>
          <div style={{ display: "flex", alignItems: "center", gap: G.sp[4], padding: `${G.sp[4]}px ${G.sp[5]}px`, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 140px", minWidth: 0 }}>
              <div style={{ fontFamily: G.sans, fontSize: 13.5, fontWeight: 500, color: c.ink }}>July 2026</div>
              <div style={{ fontFamily: G.sans, fontSize: 12, color: c.inkMuted, marginTop: 1 }}>Credited 31 Jul</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: G.sans, fontSize: 11, color: c.inkMuted }}>Net Pay</div>
              <Figure value={68240} size={16} weight={600} />
            </div>
            <StatusPill status="Paid" />
            <Button variant="link" size="sm" onClick={() => onNavigate && onNavigate("payslips")}>Download</Button>
          </div>
        </Card>
      </div>
    );
  }

  // ---------------------------------------------------------------
  // ActionBanner — the single most urgent thing on Home. Full width,
  // above Today, so it can never be clipped/buried in a squeezed
  // right column (impeccable-critique P0). Fill+ink text, no
  // border-left side-stripe (DESIGN.md ban) — a real bordered block.
  // ---------------------------------------------------------------
  function ActionBanner({ onRespond }) {
    const { c } = useTheme();
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: G.sp[4], flexWrap: "wrap", minWidth: 0,
        background: withAlpha(c.warning, 0.1), border: `1px solid ${c.warning}`, borderRadius: G.r.lg,
        padding: `${G.sp[4]}px ${G.sp[5]}px`, marginBottom: G.sp[6],
      }}>
        <div style={{ width: 30, height: 30, borderRadius: G.r.xs, background: c.warning, display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}>
          <Icon name="alert" size={16} color={c.onWarning} />
        </div>
        <div style={{ flex: "1 1 320px", minWidth: 0 }}>
          <BilingualLabel en="Action needed" deva="आवश्यक कार्रवाई" role="h3" />
          <div style={{ fontFamily: G.sans, fontSize: 13.5, color: c.ink, fontWeight: 500, marginTop: 4 }}>
            Respond to HR document request
          </div>
          <div style={{ fontFamily: G.sans, fontSize: 12, color: c.inkMuted, marginTop: 2 }}>
            <span title="A character-and-antecedent check certificate issued by the local police station">Police verification</span> · requested by HR · due in 12 days
          </div>
        </div>
        <Button variant="primary" size="sm" onClick={onRespond} style={{ flex: "0 0 auto" }}>Respond</Button>
      </div>
    );
  }

  function Upcoming() {
    return (
      <div>
        <SectionHeader><BilingualLabel en="Upcoming" deva="आगामी" role="h3" /></SectionHeader>
        <Row label="Independence Day" sub="National holiday" value="15 Aug" />
        <Row label="Summer vacation" sub="Term break" value="18–31 May" last />
      </div>
    );
  }

  // ---------------------------------------------------------------
  // WeekStrip — a compact ruled register for the last few workdays,
  // reusing the kit's P/A/L/H Mark vocabulary. Keeps the Register
  // motif on Home (it was otherwise a card-and-list dashboard, per
  // the impeccable critique) and gives the right column real ledger
  // weight instead of ending short and blank.
  // ---------------------------------------------------------------
  const WEEK_STRIP_DAYS = [
    { day: 20, wd: "Mon", mark: "P", label: "On time", eff: "7h 43m" },
    { day: 21, wd: "Tue", mark: "A", label: "Absent", eff: "—" },
    { day: 22, wd: "Wed", mark: null, label: "In progress", eff: "3h 14m", today: true },
    { day: 23, wd: "Thu", mark: null, label: "Scheduled", eff: "—", future: true },
    { day: 24, wd: "Fri", mark: null, label: "Scheduled", eff: "—", future: true },
  ];

  function WeekStripRow({ d, last }) {
    const { c } = useTheme();
    return (
      <div style={{ display: "flex", alignItems: "center", gap: G.sp[3], padding: `${G.sp[2]}px 0`, borderBottom: last ? "none" : `1px solid ${c.border}` }}>
        <div style={{ width: 40, flex: "0 0 auto" }}>
          <div style={{ fontFamily: G.mono, fontSize: 13, fontWeight: 600, color: d.future ? c.inkMuted : c.ink }}>{d.day}</div>
          <div style={{ fontFamily: G.sans, fontSize: 10.5, color: c.inkMuted }}>{d.wd}</div>
        </div>
        <div style={{ flex: "0 0 auto" }}>
          {d.mark ? (
            <Mark kind={d.mark} size={20} />
          ) : d.today ? (
            <Badge tone="info">Today</Badge>
          ) : (
            <div style={{ width: 20, height: 20, borderRadius: G.r.xs, border: `1px dashed ${c.border}`, boxSizing: "border-box" }} />
          )}
        </div>
        <div style={{ flex: 1, fontFamily: G.sans, fontSize: 12.5, color: d.future ? c.inkMuted : c.ink, minWidth: 0 }}>{d.label}</div>
        <div style={{ fontFamily: G.mono, fontSize: 12.5, fontWeight: 600, color: d.eff === "—" ? c.inkMuted : c.ink, fontFeatureSettings: "'tnum' 1, 'lnum' 1" }}>{d.eff}</div>
      </div>
    );
  }

  function WeekStrip({ onNavigate }) {
    return (
      <div>
        <SectionHeader action="View full attendance" onAction={() => onNavigate && onNavigate("attendance")}>
          <BilingualLabel en="This week" deva="इस सप्ताह" role="h3" />
        </SectionHeader>
        <Card padding={0}>
          <div style={{ padding: `0 ${G.sp[5]}px` }}>
            {WEEK_STRIP_DAYS.map((d, i) => (
              <WeekStripRow key={d.day} d={d} last={i === WEEK_STRIP_DAYS.length - 1} />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  function EmployeeHome({ onNavigate }) {
    const { c } = useTheme();
    const hasPendingAction = true; // mock: an open HR document request
    const greeting = greetingForMinutes(NOW_MIN);
    return (
      <div style={{ maxWidth: CONTENT_MAX, margin: "0 auto" }}>
        {hasPendingAction && <ActionBanner onRespond={() => onNavigate && onNavigate("documents")} />}

        <div style={{ ...G.t("h1", "latin"), color: c.ink }}>{greeting}, Ananya</div>
        <div style={{ fontFamily: G.sans, fontSize: 13.5, color: c.inkMuted, marginTop: 4, marginBottom: G.sp[6] }}>
          PGT · EMP-014 · Sunrise Public School
        </div>

        <div style={{ marginBottom: G.sp[6] }}><TodayModule /></div>

        <div style={{ display: "flex", gap: G.sp[8], alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 480px", minWidth: 380 }}>
            <LeaveBalance onNavigate={onNavigate} />
            <div style={{ height: G.sp[8] }} />
            <PayslipRow onNavigate={onNavigate} />
          </div>
          <div style={{ flex: "1 1 420px", minWidth: 340 }}>
            <Upcoming />
            <div style={{ marginTop: G.sp[6] }}><WeekStrip onNavigate={onNavigate} /></div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------
  // Placeholder — labeled stub for any employee route still unbuilt
  // ---------------------------------------------------------------
  function Placeholder({ label, icon }) {
    const { c } = useTheme();
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 360, gap: G.sp[4] }}>
        <div style={{ width: 56, height: 56, borderRadius: G.r.lg, background: c.surface, border: `1px solid ${c.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name={icon || "document"} size={22} color={c.inkMuted} />
        </div>
        <div style={{ ...G.t("h3", "latin"), color: c.inkMuted }}>{label} — coming soon</div>
      </div>
    );
  }

  // ---------------------------------------------------------------
  // EmployeeShell — top bar (wordmark + campus + ThemeToggle + avatar
  // + role-gated admin link) and left nav (Home real, rest built-out).
  // Nav items are real <button>s (keyboard-reachable, focus-visible
  // via the kit's global ring) — never a bare <div onClick>.
  // ---------------------------------------------------------------
  function EmployeeShell({ route, onNavigate, onSignOut, onViewAdmin, role, children }) {
    const { c } = useTheme();
    // "View admin console" is HR/admin-only chrome that leaked into the
    // plain-employee top bar (impeccable critique). Default role is
    // "employee" — the link only renders for a non-employee role.
    const canViewAdmin = role && role !== "employee" && !!onViewAdmin;
    return (
      <div style={{ display: "flex", width: "100%", height: "100%", background: c.bg }}>
        <div style={{ width: 224, flex: "0 0 224px", background: c.surface, borderRight: `1px solid ${c.border}`, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: `${G.sp[5]}px ${G.sp[5]}px ${G.sp[4]}px` }}>
            <span style={{ ...G.t("h2", "latin"), color: c.ink }}>Naveya</span>
          </div>
          <nav style={{ flex: 1, padding: `${G.sp[2]}px ${G.sp[3]}px`, display: "flex", flexDirection: "column", gap: 2 }}>
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
                    borderRadius: G.r.sm, background: active ? c.accentSoft : "transparent",
                    border: "none", width: "100%", textAlign: "left", cursor: "pointer", font: "inherit",
                  }}
                >
                  <Icon name={n.icon} size={16} color={active ? c.accent : c.inkMuted} />
                  <span style={{ fontFamily: G.sans, fontSize: 13, fontWeight: active ? 600 : 500, color: active ? c.ink : c.inkMuted }}>{n.label}</span>
                </button>
              );
            })}
          </nav>
          <div style={{ padding: G.sp[4], borderTop: `1px solid ${c.border}`, display: "flex", alignItems: "center", gap: G.sp[3] }}>
            <Avatar initials="AR" size={30} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: G.sans, fontSize: 12, fontWeight: 600, color: c.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Ananya Rao</div>
              <div style={{ fontFamily: G.sans, fontSize: 10.5, color: c.inkMuted }}>PGT · EMP-014</div>
            </div>
            <button onClick={onSignOut} aria-label="Sign out" style={{ background: "transparent", border: "none", cursor: "pointer", color: c.inkMuted, display: "flex", padding: 0 }}>
              <Icon name="logout" size={15} color={c.inkMuted} />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <div style={{ height: 60, flex: "0 0 60px", background: c.surface, borderBottom: `1px solid ${c.border}`, display: "flex", alignItems: "center", padding: `0 ${G.sp[5]}px`, gap: G.sp[4] }}>
            <span style={{ fontFamily: G.sans, fontSize: 13, fontWeight: 600, color: c.ink }}>Sunrise Public School</span>
            <div style={{ flex: 1 }} />
            <ThemeToggle />
            <Button variant="icon" ariaLabel="Notifications"><Icon name="bell" size={15} color={c.inkMuted} /></Button>
            {canViewAdmin && (
              <Button variant="ghost" size="sm" onClick={onViewAdmin}>View admin console</Button>
            )}
          </div>
          <div style={{ flex: 1, overflow: "auto", padding: G.sp[6], boxSizing: "border-box", minWidth: 0 }}>
            {children}
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------
  // Employee — route switch (Home real, rest are placeholders)
  // ---------------------------------------------------------------
  function EmployeeRouteContent({ route, onNavigate }) {
    const active = EMP_NAV.find((n) => n.key === route) || EMP_NAV[0];
    const S = window.Screens;

    if (route === "home") return <EmployeeHome onNavigate={onNavigate} />;
    if (route === "attendance" && S.Attendance) {
      return <S.Attendance onViewPayslips={() => onNavigate("payslips")} />;
    }
    if (route === "leave" && S.Leave) return <S.Leave />;
    if (route === "payslips" && S.Payslips) {
      return <S.Payslips onViewAttendance={() => onNavigate("attendance")} />;
    }
    if (route === "documents" && S.Documents) return <S.Documents />;
    if (route === "profile" && S.Profile) return <S.Profile />;

    return <Placeholder label={active.label} icon={active.icon} />;
  }

  function Employee({ route, onNavigate, onSignOut, onViewAdmin, role }) {
    const r = route || "home";
    return (
      <EmployeeShell route={r} onNavigate={onNavigate} onSignOut={onSignOut} onViewAdmin={onViewAdmin} role={role || "employee"}>
        <EmployeeRouteContent route={r} onNavigate={onNavigate} />
      </EmployeeShell>
    );
  }

  // ---------------------------------------------------------------
  // AdminStub — the HR console is secondary; this is a route stub
  // ---------------------------------------------------------------
  function AdminStub({ onBack }) {
    const { c } = useTheme();
    return (
      <div style={{ width: "100%", height: "100%", background: c.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Card style={{ maxWidth: 360, textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: G.sp[3] }}>
            <Icon name="document" size={26} color={c.inkMuted} />
          </div>
          <div style={{ ...G.t("h2", "latin"), color: c.ink }}>Admin console</div>
          <div style={{ fontFamily: G.sans, fontSize: 13, color: c.inkMuted, marginTop: G.sp[2], marginBottom: G.sp[5] }}>
            The HR/admin console is being rebuilt on Naveya. This is a placeholder route stub — the employee surface is primary.
          </div>
          <Button variant="ghost" onClick={onBack}>Back to employee home</Button>
        </Card>
      </div>
    );
  }

  window.Screens = { Login, Employee, AdminStub };
})();
