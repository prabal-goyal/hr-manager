/* ============================================================
   design/screens/leave.jsx — Naveya employee Leave screen.
   Composes ONLY from window.UI (design/kit.jsx) + window.G.
   Self-contained IIFE, classic-JSX runtime, no imports/exports.
   Renders as CONTENT inside the EmployeeShell main column
   (shell/topbar/left-nav are owned elsewhere).
   Exposes: window.Screens.Leave
   ============================================================ */
(function () {
  const { useState, Fragment } = React;
  const G = window.G;
  const {
    useTheme, Button, Field, Input, Select, Badge, StatusPill,
    Card, SectionHeader, BilingualLabel, Icon, Avatar, withAlpha,
    Textarea, DaySegmented,
  } = window.UI;

  const TAB = { fontFeatureSettings: "'tnum' 1, 'lnum' 1" };

  // Shared content width (matches design/screens.jsx's CONTENT_MAX).
  const CONTENT_MAX = 1200;

  // ---------------------------------------------------------------
  // Date helpers (calendar-day math for the design mock; no vendor
  // holiday calendar wired here — this is presentation-layer only)
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
  function formatShortDate(iso) {
    const d = new Date(iso + "T00:00:00");
    if (isNaN(d.getTime())) return iso;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${String(d.getDate()).padStart(2, "0")} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  // ---------------------------------------------------------------
  // Reference data (academic year Apr 2026 -> Mar 2027)
  // ---------------------------------------------------------------
  const BLACKOUT = { start: "2027-03-10", end: "2027-03-18", label: "10–18 Mar" };

  const LEAVE_TYPES = [
    { value: "CL", label: "Casual Leave", deva: "आकस्मिक अवकाश", balance: 7 },
    { value: "SL", label: "Sick Leave", deva: "बीमारी अवकाश", balance: 8 },
    { value: "COMP", label: "Comp-off", deva: "प्रतिकर अवकाश", balance: 2 },
    { value: "LOP", label: "Loss of Pay", deva: "बिना वेतन अवकाश", balance: 0, isLOP: true },
  ];

  const PERIOD_SLOTS = [
    { value: "p12", label: "Periods 1–2", frac: 0.25 },
    { value: "p34", label: "Periods 3–4", frac: 0.25 },
    { value: "p56", label: "Periods 5–6", frac: 0.25 },
    { value: "p78", label: "Periods 7–8", frac: 0.25 },
  ];

  const DAY_MODES = [
    { value: "full", label: "Full day" },
    { value: "half", label: "Half day" },
    { value: "period", label: "Period-level" },
  ];

  const BALANCES = [
    { code: "ELVAC", en: "Earned Leave / Vacation", deva: "अर्जित अवकाश", note: "Vacation in lieu of EL — vacation staff", na: true },
    { code: "CL", en: "Casual Leave", deva: "आकस्मिक अवकाश", total: 12, used: 5, available: 7 },
    { code: "SL", en: "Sick Leave", deva: "बीमारी अवकाश", total: 10, used: 2, available: 8 },
    { code: "COMP", en: "Comp-off", deva: "प्रतिकर अवकाश", total: 3, used: 1, available: 2, note: "Earned against verified extra duty" },
    { code: "MAT", en: "Maternity", deva: "मातृत्व अवकाश", na: true, note: "Not applicable — no active claim on file" },
    { code: "LOP", en: "Loss of Pay", deva: "बिना वेतन अवकाश", usedOnly: 3, note: "Unpaid — deducted from monthly pay" },
  ];

  const HISTORY = [
    { id: "LV-2041", applied: "2026-07-15", type: "Casual Leave", range: "20–21 Jul 2026", days: 2, status: "Approved" },
    { id: "LV-2038", applied: "2026-07-02", type: "Sick Leave", range: "03 Jul 2026 · Half day", days: 0.5, status: "Pending" },
    { id: "LV-2029", applied: "2026-06-18", type: "Comp-off", range: "22 Jun 2026", days: 1, status: "Approved" },
    { id: "LV-2015", applied: "2026-06-05", type: "Casual Leave", range: "08 Jun 2026 · Periods 5–6", days: 0.25, status: "Rejected" },
    { id: "LV-1994", applied: "2026-05-10", type: "Loss of Pay", range: "12–13 May 2026", days: 2, status: "Approved" },
  ];

  // Textarea and DaySegmented are promoted to the shared kit
  // (window.UI) — this screen was their only private-copy source;
  // see design/kit.jsx.

  // ---------------------------------------------------------------
  // Private: PreviewRow — mono days figure, tone by paid/LOP meaning
  // ---------------------------------------------------------------
  function PreviewRow({ label, value, tone, last }) {
    const { c } = useTheme();
    const color = tone === "success" ? c.success : tone === "danger" ? c.danger : tone === "muted" ? c.inkMuted : c.ink;
    return (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: `${G.sp["1.5"]}px 0`, borderBottom: last ? "none" : `1px solid ${c.border}` }}>
        <span style={{ fontFamily: G.sans, fontSize: 13, color: c.ink }}>{label}</span>
        <span style={{ fontFamily: G.mono, fontSize: 14, fontWeight: 600, color, ...TAB }}>{value.toFixed(2)} d</span>
      </div>
    );
  }

  // ---------------------------------------------------------------
  // Leave balance — ruled ledger with structural record-rule column
  // (The Register motif carries into leave per DESIGN.md: "hero
  // surface across attendance, leave, payroll, and documents")
  // ---------------------------------------------------------------
  function BalanceLedger() {
    const { c } = useTheme();
    const cols = "6px minmax(200px,1.6fr) 90px 90px 100px";
    const cellBase = { display: "flex", alignItems: "center", padding: `${G.sp[2]}px ${G.sp[3]}px`, borderBottom: `1px solid ${c.border}`, minHeight: 44, boxSizing: "border-box" };
    const headCell = { ...cellBase, fontFamily: G.mono, fontSize: 11, letterSpacing: ".06em", color: c.inkMuted, fontWeight: 500, textTransform: "uppercase" };
    const ruleCell = { ...cellBase, background: c.accent, borderBottom: "none" };

    return (
      <div>
        <SectionHeader>Leave balance</SectionHeader>
        <div style={{ display: "flex", alignItems: "flex-start", gap: G.sp[2], marginBottom: G.sp[3] }}>
          <Icon name="alert" size={13} color={c.info} style={{ marginTop: 2, flex: "0 0 auto" }} />
          <span style={{ fontFamily: G.sans, fontSize: 12.5, color: c.inkMuted }}>
            Vacation staff: Earned Leave is not accrued — vacation periods are granted in lieu, per the academic calendar (Apr–Mar).
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: cols, border: `1px solid ${c.border}`, borderRadius: G.r.md, overflow: "hidden", background: c.surface }}>
          <div style={ruleCell} />
          <div style={headCell}>Leave type</div>
          <div style={{ ...headCell, justifyContent: "flex-end" }}>Entitled</div>
          <div style={{ ...headCell, justifyContent: "flex-end" }}>Used</div>
          <div style={{ ...headCell, justifyContent: "flex-end" }}>Available</div>

          {BALANCES.map((b) => {
            const dash = b.na || b.usedOnly !== undefined;
            return (
              <Fragment key={b.code}>
                <div style={ruleCell} />
                <div style={{ ...cellBase, flexDirection: "column", alignItems: "flex-start", gap: 2 }}>
                  <BilingualLabel en={b.en} deva={b.deva} role="body" gap={G.sp[1.5]} />
                  {b.note && <span style={{ fontFamily: G.sans, fontSize: 11.5, color: c.inkMuted }}>{b.note}</span>}
                </div>
                <div style={{ ...cellBase, justifyContent: "flex-end", fontFamily: G.mono, fontSize: 13, color: b.na ? c.inkMuted : c.ink, ...TAB }}>
                  {dash ? "—" : b.total.toFixed(1)}
                </div>
                <div style={{ ...cellBase, justifyContent: "flex-end", fontFamily: G.mono, fontSize: 13, color: b.na ? c.inkMuted : c.ink, ...TAB }}>
                  {b.usedOnly !== undefined ? b.usedOnly.toFixed(1) : b.na ? "—" : b.used.toFixed(1)}
                </div>
                <div style={{ ...cellBase, justifyContent: "flex-end", fontFamily: G.mono, fontSize: 13, fontWeight: 600, color: b.na ? c.inkMuted : b.usedOnly !== undefined ? c.inkMuted : c.success, ...TAB }}>
                  {dash ? "—" : b.available.toFixed(1)}
                </div>
              </Fragment>
            );
          })}
        </div>
        <div style={{ marginTop: G.sp[2], fontFamily: G.sans, fontSize: 11, color: c.inkMuted }}>
          As of 22 Jul 2026 · Academic year Apr 2026 – Mar 2027
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------
  // Apply leave — comfortable-density form + live LOP/paid preview,
  // approver, and blackout-window awareness
  // ---------------------------------------------------------------
  function ApplyLeavePanel() {
    const { c } = useTheme();
    const [leaveType, setLeaveType] = useState("CL");
    const [fromDate, setFromDate] = useState("2026-08-10");
    const [toDate, setToDate] = useState("2026-08-12");
    const [dayMode, setDayMode] = useState("full");
    const [periodSlot, setPeriodSlot] = useState(PERIOD_SLOTS[0].value);
    const [reason, setReason] = useState("");

    const singleDay = !!fromDate && !!toDate && fromDate === toDate;
    const effectiveMode = singleDay ? dayMode : "full";
    const slot = PERIOD_SLOTS.find((p) => p.value === periodSlot) || PERIOD_SLOTS[0];
    const totalDays = !fromDate || !toDate
      ? 0
      : singleDay
        ? (effectiveMode === "half" ? 0.5 : effectiveMode === "period" ? slot.frac : 1)
        : diffDaysInclusive(fromDate, toDate);

    const type = LEAVE_TYPES.find((t) => t.value === leaveType) || LEAVE_TYPES[0];
    const paidDays = type.isLOP ? 0 : Math.min(type.balance, totalDays);
    const lopDays = type.isLOP ? totalDays : Math.max(0, totalDays - type.balance);
    const blackout = rangesOverlap(fromDate, toDate, BLACKOUT.start, BLACKOUT.end);

    return (
      <div>
        <SectionHeader>Apply leave</SectionHeader>
        <Card>
          <div style={{ display: "flex", gap: G.sp[8], flexWrap: "wrap" }}>
            <div style={{ flex: "1.3 1 360px", minWidth: 300, display: "flex", flexDirection: "column", gap: G.sp[4] }}>
              <Field label="Leave type" required>
                <Select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  options={LEAVE_TYPES.map((t) => ({ value: t.value, label: t.isLOP ? t.label : `${t.label} · ${t.balance} available` }))}
                />
              </Field>

              <div style={{ display: "flex", gap: G.sp[3], flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 140px" }}>
                  <Field label="From">
                    <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                  </Field>
                </div>
                <div style={{ flex: "1 1 140px" }}>
                  <Field label="To">
                    <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                  </Field>
                </div>
              </div>

              <Field label="Day type" hint={!singleDay ? "Half-day and period-level apply to single-day requests only" : undefined}>
                <DaySegmented options={DAY_MODES} value={effectiveMode} onChange={setDayMode} disabled={!singleDay} />
              </Field>

              {singleDay && dayMode === "period" && (
                <Field label="Periods">
                  <Select value={periodSlot} onChange={(e) => setPeriodSlot(e.target.value)} options={PERIOD_SLOTS.map((p) => ({ value: p.value, label: p.label }))} />
                </Field>
              )}

              <Field label="Reason" required>
                <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Brief reason for leave" rows={3} />
              </Field>

              <div style={{ display: "flex", gap: G.sp[3], marginTop: G.sp[1] }}>
                <Button variant="primary">Submit for approval</Button>
                <Button variant="ghost">Save draft</Button>
              </div>
            </div>

            <div style={{ flex: "1 1 260px", minWidth: 260, borderLeft: `1px solid ${c.border}`, paddingLeft: G.sp[6], display: "flex", flexDirection: "column", gap: G.sp[5] }}>
              <div>
                <div style={{ fontFamily: G.mono, fontSize: 11, letterSpacing: ".05em", color: c.inkMuted, textTransform: "uppercase", marginBottom: G.sp[2] }}>Approver</div>
                <div style={{ display: "flex", alignItems: "center", gap: G.sp[3] }}>
                  <Avatar initials="MI" size={30} />
                  <div>
                    <div style={{ fontFamily: G.sans, fontSize: 13, fontWeight: 600, color: c.ink }}>Meera Iyer</div>
                    <div style={{ fontFamily: G.sans, fontSize: 11.5, color: c.inkMuted }}>Principal · Sunrise Public School</div>
                  </div>
                </div>
              </div>

              <div>
                <div style={{ fontFamily: G.mono, fontSize: 11, letterSpacing: ".05em", color: c.inkMuted, textTransform: "uppercase", marginBottom: G.sp[2] }}>Preview</div>
                <PreviewRow label="Requested" value={totalDays} />
                <PreviewRow label="Paid days" value={paidDays} tone="success" />
                <PreviewRow label="LOP days" value={lopDays} tone={lopDays > 0 ? "danger" : "muted"} last />
              </div>

              {blackout ? (
                <div style={{ display: "flex", gap: G.sp[2], alignItems: "flex-start", background: withAlpha(c.warning, 0.12), border: `1px solid ${c.warning}`, borderRadius: G.r.sm, padding: G.sp[3] }}>
                  <Icon name="alert" size={14} color={c.warning} strokeWidth={2.2} style={{ marginTop: 1, flex: "0 0 auto" }} />
                  <div style={{ fontFamily: G.sans, fontSize: 12, color: c.ink }}>
                    Exam blackout {BLACKOUT.label}: restricted. This request overlaps the window — approval needs HoD sign-off.
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", gap: G.sp[2], alignItems: "flex-start" }}>
                  <Icon name="calendar" size={13} color={c.inkMuted} style={{ marginTop: 2, flex: "0 0 auto" }} />
                  <span style={{ fontFamily: G.sans, fontSize: 11.5, color: c.inkMuted }}>
                    Exam blackout {BLACKOUT.label}: restricted for all teaching staff.
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // ---------------------------------------------------------------
  // Leave history — ruled ledger, record-rule column, no cards
  // ---------------------------------------------------------------
  function HistoryLedger() {
    const { c } = useTheme();
    const cols = "6px 96px minmax(110px,1fr) minmax(140px,1.3fr) 70px 110px";
    const cellBase = { display: "flex", alignItems: "center", padding: `${G.sp[2]}px ${G.sp[3]}px`, borderBottom: `1px solid ${c.border}`, minHeight: 40, boxSizing: "border-box" };
    const headCell = { ...cellBase, fontFamily: G.mono, fontSize: 11, letterSpacing: ".06em", color: c.inkMuted, fontWeight: 500, textTransform: "uppercase" };
    const ruleCell = { ...cellBase, background: c.accent, borderBottom: "none" };

    return (
      <div>
        <SectionHeader>Leave history</SectionHeader>
        <div style={{ display: "grid", gridTemplateColumns: cols, border: `1px solid ${c.border}`, borderRadius: G.r.md, overflow: "hidden", background: c.surface }}>
          <div style={ruleCell} />
          <div style={headCell}>Applied</div>
          <div style={headCell}>Type</div>
          <div style={headCell}>Dates</div>
          <div style={{ ...headCell, justifyContent: "flex-end" }}>Days</div>
          <div style={{ ...headCell, justifyContent: "center" }}>Status</div>

          {HISTORY.map((h) => (
            <Fragment key={h.id}>
              <div style={ruleCell} />
              <div style={{ ...cellBase, fontFamily: G.mono, fontSize: 12, color: c.inkMuted, ...TAB }}>{formatShortDate(h.applied)}</div>
              <div style={{ ...cellBase, fontFamily: G.sans, fontSize: 13, color: c.ink, fontWeight: 500 }}>{h.type}</div>
              <div style={{ ...cellBase, fontFamily: G.sans, fontSize: 12.5, color: c.inkMuted }}>{h.range}</div>
              <div style={{ ...cellBase, justifyContent: "flex-end", fontFamily: G.mono, fontSize: 13, color: c.ink, ...TAB }}>{h.days.toFixed(2)}</div>
              <div style={{ ...cellBase, justifyContent: "center" }}><StatusPill status={h.status} /></div>
            </Fragment>
          ))}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------
  // Leave — top-level content (mounts inside EmployeeShell's main column)
  // ---------------------------------------------------------------
  function Leave() {
    const { c } = useTheme();
    return (
      <div style={{ maxWidth: CONTENT_MAX, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: G.sp[3], marginBottom: G.sp[6] }}>
          <div>
            <BilingualLabel en="Leave" deva="अवकाश" role="h1" />
            <div style={{ fontFamily: G.sans, fontSize: 13.5, color: c.inkMuted, marginTop: 4 }}>PGT · EMP-014 · Sunrise Public School</div>
          </div>
          <Badge tone="info">Academic year Apr 2026 – Mar 2027</Badge>
        </div>

        <div style={{ marginBottom: G.sp[8] }}><BalanceLedger /></div>
        <div style={{ marginBottom: G.sp[8] }}><ApplyLeavePanel /></div>
        <div><HistoryLedger /></div>
      </div>
    );
  }

  window.Screens = window.Screens || {};
  window.Screens.Leave = Leave;
})();
