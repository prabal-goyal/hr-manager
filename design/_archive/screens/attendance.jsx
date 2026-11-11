/* ============================================================
   attendance.jsx — Naveya employee "My Attendance" screen (ESS).
   The signature surface: a day-by-day ledger (Keka-style) that
   reads like the register/muster resolving into pay — a slim
   per-day timeline, an expressive arrival mark (shape+color+label,
   never hue-alone), and an adjacent Day Timecard that shows the
   Pay impact line. Composes ONLY from window.UI (design/kit.jsx)
   + window.G. Classic-JSX-runtime IIFE, no imports/exports.
   ============================================================ */
(function () {
  const { useState, useMemo } = React;
  const G = window.G;
  const {
    useTheme, Button, Select, Badge, Card, SectionHeader,
    BilingualLabel, Icon, Seal, withAlpha, EmptyState,
  } = window.UI;

  // Shared content width (matches design/screens.jsx's CONTENT_MAX) —
  // centered so wide desktop viewports get balanced margins instead of
  // content hugging the shell's left edge (impeccable-critique global finding).
  const CONTENT_MAX = 1200;

  // ---------------------------------------------------------------
  // Small ES5-safe object merge (avoids relying on object-spread
  // syntax support in the in-browser Babel preset — untested here).
  // ---------------------------------------------------------------
  function extend(base, extra) {
    const out = {};
    for (const k in base) { if (Object.prototype.hasOwnProperty.call(base, k)) out[k] = base[k]; }
    for (const k2 in extra) { if (Object.prototype.hasOwnProperty.call(extra, k2)) out[k2] = extra[k2]; }
    return out;
  }
  function firstDefined() {
    for (let i = 0; i < arguments.length; i++) {
      if (arguments[i] !== null && arguments[i] !== undefined) return arguments[i];
    }
    return null;
  }
  function pad2(n) { return n < 10 ? "0" + n : "" + n; }
  function fmtClock(min) {
    if (min === null || min === undefined) return "—";
    const h = Math.floor(min / 60), m = min % 60;
    return pad2(h) + ":" + pad2(m);
  }
  function fmtHM(min) {
    if (min === null || min === undefined) return "—";
    const h = Math.floor(min / 60), m = Math.round(min % 60);
    return h + "h " + pad2(m) + "m";
  }

  // ---------------------------------------------------------------
  // Sample data model — Ananya Rao, PGT, EMP-014, Sunrise Public
  // School. Academic year Apr–Mar; July sits inside term.
  // Only July 2026 carries sample data — June/August demonstrate
  // the required empty states (vacation vs. "not loaded").
  // ---------------------------------------------------------------
  const MONTH_META = {
    "2026-06": { label: "June 2026", period: "Vacation", year: 2026, month: 5, days: 30 },
    "2026-07": { label: "July 2026", period: "Term", year: 2026, month: 6, days: 31 },
    "2026-08": { label: "August 2026", period: "Term", year: 2026, month: 7, days: 31 },
  };
  const MONTH_ORDER = ["2026-06", "2026-07", "2026-08"];
  const DATA_MONTH = "2026-07";
  const TODAY_DAY = 22; // "today" sits inside the loaded month, mid-July
  const STANDARD_IN = 542; // 09:02, minutes-from-midnight
  const DAY_START = 480, DAY_END = 1140; // 08:00 -> 19:00 timeline scale
  const WEEKDAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // day-of-month -> status override; everything else defaults from
  // day-of-week (Sun = weekly off, Sat = half day, else on-time).
  const OVERRIDES = {
    7: { status: "late" },
    9: { status: "missingSwipe" },
    10: { status: "holiday", label: "Founder's Day" },
    15: { status: "onLeave", label: "Casual leave" },
    16: { status: "onLeave", label: "Casual leave" },
    19: { status: "workedOnWeeklyOff", label: "Exam invigilation duty" },
    21: { status: "absent" },
  };

  function buildDay(day, dow) {
    const ov = OVERRIDES[day];
    let status;
    if (day === TODAY_DAY) status = "today";
    else if (day > TODAY_DAY) status = "future";
    else if (ov) status = ov.status;
    else if (dow === 0) status = "weeklyOff";
    else if (dow === 6) status = "half";
    else status = "onTime";

    const base = {
      day: day, dow: dow, status: status,
      weekdayLabel: WEEKDAY_ABBR[dow],
      label: ov ? ov.label : null,
    };

    const byStatus = {
      onTime: { inMin: 542, outMin: 1065, breaks: [[705, 765]], effectiveMin: 463, grossMin: 523, breakMin: 60, otMin: null, device: "Gate-2 · biometric" },
      late: { inMin: 587, outMin: 1065, breaks: [[705, 765]], effectiveMin: 418, grossMin: 478, breakMin: 60, otMin: null, device: "Gate-2 · biometric" },
      missingSwipe: { inMin: 542, outMin: null, assumedEndMin: 765, breaks: [[705, 765]], effectiveMin: null, grossMin: null, breakMin: null, otMin: null, device: "Gate-2 · biometric (out-punch missing)" },
      absent: { inMin: null, outMin: null, breaks: [], effectiveMin: null, grossMin: null, breakMin: null, otMin: null, device: null },
      weeklyOff: { inMin: null, outMin: null, breaks: [], effectiveMin: null, grossMin: null, breakMin: null, otMin: null, device: null },
      workedOnWeeklyOff: { inMin: 600, outMin: 900, breaks: [], effectiveMin: 300, grossMin: 300, breakMin: 0, otMin: 300, device: "Gate-1 · biometric" },
      onLeave: { inMin: null, outMin: null, breaks: [], effectiveMin: null, grossMin: null, breakMin: null, otMin: null, device: null },
      holiday: { inMin: null, outMin: null, breaks: [], effectiveMin: null, grossMin: null, breakMin: null, otMin: null, device: null },
      half: { inMin: 542, outMin: 780, breaks: [], effectiveMin: 238, grossMin: 238, breakMin: 0, otMin: null, device: "Gate-2 · biometric" },
      today: { inMin: 545, outMin: null, nowMin: 796, breaks: [[705, 765]], effectiveMin: 191, grossMin: 251, breakMin: 60, otMin: null, device: "Gate-2 · biometric" },
      future: { inMin: null, outMin: null, breaks: [], effectiveMin: null, grossMin: null, breakMin: null, otMin: null, device: null },
    };

    return extend(base, byStatus[status] || {});
  }

  function buildMonthDays(monthKey) {
    if (monthKey !== DATA_MONTH) return [];
    const meta = MONTH_META[monthKey];
    const days = [];
    for (let d = 1; d <= meta.days; d++) {
      const dow = new Date(meta.year, meta.month, d).getDay();
      days.push(buildDay(d, dow));
    }
    return days;
  }

  function computeSummary(days) {
    if (!days.length) return { present: null, absent: null, leave: null, half: null, avgEffective: null };
    let present = 0, absent = 0, leave = 0, half = 0, effSum = 0, effCount = 0;
    days.forEach(function (d) {
      if (d.status === "future") return;
      if (d.status === "onTime" || d.status === "today" || d.status === "workedOnWeeklyOff") present += 1;
      if (d.status === "half") { half += 1; present += 0.5; }
      if (d.status === "absent") absent += 1;
      if (d.status === "onLeave") leave += 1;
      if (d.effectiveMin !== null && d.effectiveMin !== undefined) { effSum += d.effectiveMin; effCount += 1; }
    });
    return {
      present: present.toFixed(1),
      absent: absent.toFixed(1),
      leave: leave.toFixed(1),
      half: half.toFixed(1),
      avgEffective: effCount ? fmtHM(Math.round(effSum / effCount)) : "—",
    };
  }

  const ACTION_LABEL = {
    onTime: "Day logs", half: "Day logs", workedOnWeeklyOff: "Day logs", today: "Day logs",
    late: "Regularize", absent: "Regularize",
    missingSwipe: "Apply partial day",
    weeklyOff: "Day logs", holiday: "Day logs", onLeave: "Day logs",
    future: null,
  };

  const PAY_IMPACT = {
    onTime: { tone: "success", icon: "check", badge: "Paid", text: "Full day counted for payroll." },
    today: { tone: "info", icon: null, badge: "In progress", text: "Day still open — counted once punched out." },
    late: { tone: "success", icon: "check", badge: "Paid", text: "Late arrival noted — no pay impact unless left unregularized by cycle close." },
    half: { tone: "warning", icon: null, badge: "Half paid", text: "Counted as 0.5 day for payroll." },
    missingSwipe: { tone: "warning", icon: "alert", badge: "Pending", text: "Regularize before the payroll cutoff or this day converts to LOP." },
    absent: { tone: "danger", icon: "alert", badge: "LOP", text: "Loss of Pay — no leave applied and no attendance recorded." },
    weeklyOff: { tone: "info", icon: null, badge: "Paid", text: "Weekly off — paid, not counted as a working day." },
    holiday: { tone: "info", icon: null, badge: "Paid", text: "Institution holiday — paid." },
    onLeave: { tone: "success", icon: "check", badge: "Paid", text: "Casual leave — paid, deducted from your leave balance." },
    workedOnWeeklyOff: { tone: "success", icon: "check", badge: "Paid + OT", text: "Worked on a weekly-off day — full day plus overtime credit." },
    future: null,
  };

  const ROW_COLS = "6px 52px minmax(140px,1fr) 66px 66px 58px 152px 100px";

  // ---------------------------------------------------------------
  // Arrival mark — shape + color + label (never hue-alone). Built
  // privately here: the shared kit's Mark only covers P/A/L/H;
  // this screen needs on-time/late/missing-swipe/weekly-off/
  // worked-on-weekly-off/on-leave/holiday/half/in-progress/future.
  // Candidate to fold into window.UI once the vocabulary settles.
  // ---------------------------------------------------------------
  const MARK_CONFIG = {
    onTime: { icon: "check", tone: "success", label: "On time" },
    late: { icon: "clock", tone: "warning", label: "Late" },
    missingSwipe: { icon: "alert", tone: "danger", label: "Missing swipe" },
    absent: { icon: "cross", tone: "danger", label: "Absent" },
    weeklyOff: { icon: "dash", tone: "neutral", label: "Weekly off" },
    workedOnWeeklyOff: { icon: "plus", tone: "accent", label: "Worked · weekly off" },
    onLeave: { icon: "bar", tone: "warning", label: "On leave" },
    holiday: { icon: "diamond", tone: "info", label: "Holiday" },
    half: { icon: "halfcircle", tone: "info", label: "Half day" },
    today: { icon: "clockLive", tone: "accent", label: "In progress" },
    future: { icon: null, tone: "muted", label: "—" },
  };

  function toneColors(c, tone) {
    if (tone === "success") return { bg: c.success, fg: c.onSuccess };
    if (tone === "warning") return { bg: c.warning, fg: c.onWarning };
    if (tone === "danger") return { bg: c.danger, fg: c.onDanger };
    if (tone === "info") return { bg: c.info, fg: c.onInfo };
    if (tone === "accent") return { bg: c.accent, fg: c.onAccent };
    if (tone === "neutral") return { bg: c.border, fg: c.inkMuted };
    return { bg: "transparent", fg: c.inkMuted };
  }

  function MarkGlyph({ icon, size, color }) {
    if (icon === "check" || icon === "clock" || icon === "alert" || icon === "plus") {
      return <Icon name={icon} size={size} color={color} strokeWidth={2.2} />;
    }
    const common = { width: size, height: size, viewBox: "0 0 16 16", fill: "none", stroke: color, strokeWidth: 2, strokeLinecap: "square", strokeLinejoin: "miter" };
    if (icon === "cross") {
      return (
        <svg {...common}>
          <line x1="3" y1="3" x2="13" y2="13" />
          <line x1="13" y1="3" x2="3" y2="13" />
        </svg>
      );
    }
    if (icon === "dash") {
      return <svg {...common}><line x1="3" y1="8" x2="13" y2="8" strokeDasharray="2.5 2.5" /></svg>;
    }
    if (icon === "bar") {
      return <svg {...common}><line x1="2.5" y1="8" x2="13.5" y2="8" strokeWidth="2.6" /></svg>;
    }
    if (icon === "diamond") {
      return <svg {...common}><path d="M8 2 L14 8 L8 14 L2 8 Z" /></svg>;
    }
    if (icon === "halfcircle") {
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="6" strokeWidth="1.6" fill="none" />
          <path d="M8 2 A6 6 0 0 1 8 14 Z" fill={color} stroke="none" />
        </svg>
      );
    }
    if (icon === "clockLive") {
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="6.5" strokeWidth="1.6" />
          <polyline points="8 4.5 8 8 10.8 9.6" />
        </svg>
      );
    }
    return null;
  }

  function ArrivalMark({ status, size, hideLabel }) {
    const { c } = useTheme();
    const cfg = MARK_CONFIG[status] || MARK_CONFIG.future;
    const s = size || 22;
    const colors = toneColors(c, cfg.tone);
    const isFuture = status === "future";
    return (
      <div style={{ display: "flex", alignItems: "center", gap: G.sp[2] }}>
        {isFuture ? (
          <div style={{ width: s, height: s, borderRadius: G.r.xs, border: "1px dashed " + c.border, flex: "0 0 auto", boxSizing: "border-box" }} />
        ) : (
          <div style={{ width: s, height: s, borderRadius: G.r.xs, background: colors.bg, display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}>
            <MarkGlyph icon={cfg.icon} size={s * 0.6} color={colors.fg} />
          </div>
        )}
        {!hideLabel && (
          <span style={{ fontFamily: G.sans, fontSize: 12.5, fontWeight: 500, color: isFuture ? c.inkMuted : c.ink }}>
            {cfg.label}
          </span>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------
  // Timelines — mini (row) and big (Day Timecard). Worked segments
  // in teal, break tinted amber, punch ticks in brass (the "on the
  // record" biometric-verified signal per DESIGN.md).
  // ---------------------------------------------------------------
  function pct(min, S, E) { return ((min - S) / (E - S)) * 100; }

  function workedSegments(dayData, S, E) {
    const outEff = firstDefined(dayData.outMin, dayData.nowMin, dayData.assumedEndMin, dayData.inMin);
    const breaks = dayData.breaks || [];
    const segs = [];
    let cursor = dayData.inMin;
    breaks.forEach(function (br) {
      const bs = br[0], be = br[1];
      if (bs > cursor) segs.push([cursor, Math.min(bs, outEff)]);
      cursor = Math.max(cursor, be);
    });
    if (cursor < outEff) segs.push([cursor, outEff]);
    return { segs: segs, outEff: outEff };
  }

  function MiniTimeline({ dayData }) {
    const { c } = useTheme();
    const S = DAY_START, E = DAY_END;
    if (dayData.inMin === null || dayData.inMin === undefined) {
      const flatColor = {
        weeklyOff: c.border,
        holiday: withAlpha(c.info, 0.35),
        onLeave: withAlpha(c.warning, 0.35),
        absent: withAlpha(c.danger, 0.25),
      }[dayData.status];
      const isFuture = dayData.status === "future";
      return (
        <div style={{ height: 16, display: "flex", alignItems: "center" }}>
          <div style={{
            flex: 1, height: 4, borderRadius: 2,
            background: isFuture ? "transparent" : (flatColor || c.border),
            border: isFuture ? "1px dashed " + c.border : "none", boxSizing: "border-box",
          }} />
        </div>
      );
    }
    const built = workedSegments(dayData, S, E);
    const breaks = dayData.breaks || [];
    return (
      <div style={{ position: "relative", height: 16, minWidth: 110 }}>
        <div style={{ position: "absolute", top: 6, left: 0, right: 0, height: 4, background: c.bg, border: "1px solid " + c.border, borderRadius: 2, boxSizing: "border-box" }} />
        {built.segs.map(function (seg, i) {
          const left = pct(seg[0], S, E), w = Math.max(pct(seg[1], S, E) - pct(seg[0], S, E), 1);
          return <div key={"s" + i} style={{ position: "absolute", top: 6, height: 4, left: left + "%", width: w + "%", background: c.accent, borderRadius: 2 }} />;
        })}
        {breaks.map(function (br, i) {
          return <div key={"b" + i} title="Lunch break" style={{ position: "absolute", top: 6, height: 4, left: pct(br[0], S, E) + "%", width: (pct(br[1], S, E) - pct(br[0], S, E)) + "%", background: withAlpha(c.inkMuted, 0.35) }} />;
        })}
        {dayData.inMin !== null && dayData.inMin !== undefined && (
          <div style={{ position: "absolute", top: 2, left: pct(dayData.inMin, S, E) + "%", width: 2, height: 12, background: c.brass }} />
        )}
        {dayData.outMin !== null && dayData.outMin !== undefined && (
          <div style={{ position: "absolute", top: 2, left: pct(dayData.outMin, S, E) + "%", width: 2, height: 12, background: c.brass }} />
        )}
        {dayData.outMin === null && dayData.nowMin !== null && dayData.nowMin !== undefined && (
          <div style={{ position: "absolute", top: 0, left: pct(dayData.nowMin, S, E) + "%", width: 2, height: 16, background: c.accent }} />
        )}
        {dayData.status === "missingSwipe" && (
          <div style={{ position: "absolute", top: 4, left: "calc(" + pct(dayData.assumedEndMin, S, E) + "% - 4px)", width: 8, height: 8, borderRadius: "50%", background: c.danger }} />
        )}
      </div>
    );
  }

  function Tick({ min, S, E, color }) {
    return <div style={{ position: "absolute", top: 1, left: pct(min, S, E) + "%", width: 2, height: 22, background: color, borderRadius: 1 }} />;
  }

  function BigTimeline({ dayData }) {
    const { c } = useTheme();
    const S = DAY_START, E = DAY_END;
    const built = workedSegments(dayData, S, E);
    const breaks = dayData.breaks || [];
    return (
      <div>
        <div style={{ position: "relative", height: 24 }}>
          <div style={{ position: "absolute", top: 7, left: 0, right: 0, height: 10, background: c.bg, border: "1px solid " + c.border, borderRadius: G.r.xs, boxSizing: "border-box" }} />
          {built.segs.map(function (seg, i) {
            const left = pct(seg[0], S, E), w = Math.max(pct(seg[1], S, E) - pct(seg[0], S, E), 1);
            return <div key={"s" + i} style={{ position: "absolute", top: 7, height: 10, left: left + "%", width: w + "%", background: c.accent, borderRadius: G.r.xs }} />;
          })}
          {breaks.map(function (br, i) {
            return <div key={"b" + i} title="Lunch break" style={{ position: "absolute", top: 7, height: 10, left: pct(br[0], S, E) + "%", width: (pct(br[1], S, E) - pct(br[0], S, E)) + "%", background: withAlpha(c.inkMuted, 0.32) }} />;
          })}
          {dayData.inMin !== null && dayData.inMin !== undefined && <Tick min={dayData.inMin} S={S} E={E} color={c.brass} />}
          {dayData.outMin !== null && dayData.outMin !== undefined && <Tick min={dayData.outMin} S={S} E={E} color={c.brass} />}
          {dayData.outMin === null && dayData.nowMin !== null && dayData.nowMin !== undefined && <Tick min={dayData.nowMin} S={S} E={E} color={c.accent} />}
          {dayData.outMin === null && (dayData.nowMin === null || dayData.nowMin === undefined) && dayData.assumedEndMin !== null && dayData.assumedEndMin !== undefined && <Tick min={dayData.assumedEndMin} S={S} E={E} color={c.danger} />}
        </div>
        <div style={{ position: "relative", height: 14, marginTop: 5 }}>
          {[8, 10, 12, 14, 16, 18].map(function (h) {
            return <span key={h} style={{ position: "absolute", left: pct(h * 60, S, E) + "%", transform: "translateX(-50%)", fontFamily: G.mono, fontSize: 9.5, color: c.inkMuted }}>{h}:00</span>;
          })}
        </div>
        <div style={{ display: "flex", gap: G.sp[4], marginTop: G.sp[2], flexWrap: "wrap", fontFamily: G.sans, fontSize: 11.5, color: c.inkMuted }}>
          <span>In {fmtClock(dayData.inMin)}</span>
          <span>Out {dayData.outMin !== null && dayData.outMin !== undefined ? fmtClock(dayData.outMin) : "—"}</span>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------
  // Month header — picker + summary figures (compact strip, not
  // KPI hero tiles) + the ledger-that-computes-pay tie-in line.
  // ---------------------------------------------------------------
  function SummaryFigure({ label, value }) {
    const { c } = useTheme();
    return (
      <div style={{ textAlign: "right" }}>
        <div style={{ fontFamily: G.sans, fontSize: 11, color: c.inkMuted }}>{label}</div>
        <div style={{ fontFamily: G.mono, fontSize: 15, fontWeight: 600, color: (value === null || value === "—") ? c.inkMuted : c.ink, marginTop: 2, fontFeatureSettings: "'tnum' 1, 'lnum' 1" }}>
          {value === null ? "—" : value}
        </div>
      </div>
    );
  }

  function MonthHeader({ monthKey, onChange, summary }) {
    const { c } = useTheme();
    const meta = MONTH_META[monthKey];
    const idx = MONTH_ORDER.indexOf(monthKey);
    const goPrev = function () { if (idx > 0) onChange(MONTH_ORDER[idx - 1]); };
    const goNext = function () { if (idx < MONTH_ORDER.length - 1) onChange(MONTH_ORDER[idx + 1]); };

    return (
      <div style={{ marginBottom: G.sp[5] }}>
        <div style={{ display: "flex", alignItems: "center", gap: G.sp[3], flexWrap: "wrap", marginBottom: G.sp[4] }}>
          <BilingualLabel en="My Attendance" deva="मेरी उपस्थिति" role="h1" />
          <Badge tone={meta.period === "Vacation" ? "info" : "neutral"}>{meta.period}</Badge>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: G.sp[4], flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: G.sp[2] }}>
            <Button variant="icon" ariaLabel="Previous month" onClick={goPrev} disabled={idx <= 0}>
              <Icon name="chevron" size={13} color={c.ink} style={{ transform: "rotate(90deg)" }} />
            </Button>
            <div style={{ minWidth: 168 }}>
              <Select
                value={monthKey}
                onChange={function (e) { onChange(e.target.value); }}
                options={MONTH_ORDER.map(function (k) { return { value: k, label: MONTH_META[k].label }; })}
              />
            </div>
            <Button variant="icon" ariaLabel="Next month" onClick={goNext} disabled={idx >= MONTH_ORDER.length - 1}>
              <Icon name="chevron" size={13} color={c.ink} style={{ transform: "rotate(-90deg)" }} />
            </Button>
          </div>
          <div style={{ display: "flex", gap: G.sp[6], flexWrap: "wrap", marginLeft: "auto" }}>
            <SummaryFigure label="Present" value={summary.present} />
            <SummaryFigure label="Absent" value={summary.absent} />
            <SummaryFigure label="Leave" value={summary.leave} />
            <SummaryFigure label="Half" value={summary.half} />
            <SummaryFigure label="Avg. effective / day" value={summary.avgEffective} />
          </div>
        </div>
        {summary.present !== null && (
          <div style={{ fontFamily: G.sans, fontSize: 11.5, color: c.inkMuted, marginTop: G.sp[2] }}>
            {summary.present} present days feed the {meta.label} payroll cycle.
          </div>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------
  // Day list — the daily ledger. Structural teal record-rule column
  // (dimmed for not-yet-occurred days), weekend/holiday tint,
  // on-leave tint reads distinctly, and a contextual row action.
  // ---------------------------------------------------------------
  function DayListHead() {
    const { c } = useTheme();
    const head = { fontFamily: G.mono, fontSize: 10.5, letterSpacing: ".06em", textTransform: "uppercase", color: c.inkMuted, fontWeight: 500, padding: G.sp[2] + "px " + G.sp[2] + "px" };
    return (
      <div style={{ display: "grid", gridTemplateColumns: ROW_COLS, alignItems: "center", borderBottom: "1px solid " + c.border }}>
        <div />
        <div style={head}>Date</div>
        <div style={head}>Timeline</div>
        <div style={{ ...head, textAlign: "right" }}>Effective</div>
        <div style={{ ...head, textAlign: "right" }}>Gross</div>
        <div style={{ ...head, textAlign: "right" }}>Break</div>
        <div style={head}>Status</div>
        <div style={{ ...head, textAlign: "right" }}>Action</div>
      </div>
    );
  }

  function AttendanceRow({ d, selected, onSelect }) {
    const { c, mode } = useTheme();
    const isFuture = d.status === "future";
    const isOff = d.status === "weeklyOff" || d.status === "holiday";
    const isLeave = d.status === "onLeave";
    const tint = isOff ? withAlpha(c.ink, 0.045) : isLeave ? withAlpha(c.warning, 0.07) : "transparent";
    const action = ACTION_LABEL[d.status];

    return (
      <div
        onClick={function () { if (!isFuture) onSelect(d.day); }}
        role={isFuture ? undefined : "button"}
        tabIndex={isFuture ? -1 : 0}
        aria-current={selected ? "true" : undefined}
        aria-label={"Day " + d.day + ", " + d.weekdayLabel}
        onKeyDown={function (e) { if (!isFuture && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onSelect(d.day); } }}
        style={{
          display: "grid", gridTemplateColumns: ROW_COLS, alignItems: "stretch",
          background: selected ? withAlpha(c.accent, mode === "dark" ? 0.16 : 0.09) : tint,
          cursor: isFuture ? "default" : "pointer",
          borderBottom: "1px solid " + c.border,
        }}
      >
        <div style={{ background: isFuture ? c.border : c.accent }} />
        <div style={{ padding: G.sp[2] + "px " + G.sp[2] + "px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <span style={{ fontFamily: G.mono, fontSize: 14, fontWeight: 600, color: isFuture ? c.inkMuted : c.ink }}>{pad2(d.day)}</span>
          <span style={{ fontFamily: G.sans, fontSize: 10.5, color: c.inkMuted }}>{d.weekdayLabel}</span>
        </div>
        <div style={{ padding: "0 " + G.sp[3] + "px", display: "flex", alignItems: "center" }}>
          <MiniTimeline dayData={d} />
        </div>
        <div style={{ textAlign: "right", fontFamily: G.mono, fontSize: 12.5, color: d.effectiveMin !== null && d.effectiveMin !== undefined ? c.ink : c.inkMuted, padding: "0 " + G.sp[2] + "px", display: "flex", alignItems: "center", justifyContent: "flex-end", fontFeatureSettings: "'tnum' 1, 'lnum' 1" }}>
          {fmtHM(d.effectiveMin)}
        </div>
        <div style={{ textAlign: "right", fontFamily: G.mono, fontSize: 12.5, color: d.grossMin !== null && d.grossMin !== undefined ? c.ink : c.inkMuted, padding: "0 " + G.sp[2] + "px", display: "flex", alignItems: "center", justifyContent: "flex-end", fontFeatureSettings: "'tnum' 1, 'lnum' 1" }}>
          {fmtHM(d.grossMin)}
        </div>
        <div style={{ textAlign: "right", fontFamily: G.mono, fontSize: 12.5, color: c.inkMuted, padding: "0 " + G.sp[2] + "px", display: "flex", alignItems: "center", justifyContent: "flex-end", fontFeatureSettings: "'tnum' 1, 'lnum' 1" }}>
          {fmtHM(d.breakMin)}
        </div>
        <div style={{ padding: G.sp[2] + "px " + G.sp[2] + "px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <ArrivalMark status={d.status} size={20} />
          {d.label && <div style={{ fontFamily: G.sans, fontSize: 10.5, color: c.inkMuted, marginTop: 2, marginLeft: 28 }}>{d.label}</div>}
        </div>
        <div style={{ textAlign: "right", padding: "0 " + G.sp[3] + "px", display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
          {action ? (
            <Button variant="link" size="sm" onClick={function (e) { e.stopPropagation(); onSelect(d.day); }}>{action}</Button>
          ) : (
            <span style={{ fontFamily: G.sans, fontSize: 12, color: c.inkMuted }}>—</span>
          )}
        </div>
      </div>
    );
  }

  function DayList({ days, selectedDay, onSelect }) {
    return (
      <Card padding={0}>
        <DayListHead />
        {days.map(function (d) {
          return <AttendanceRow key={d.day} d={d} selected={d.day === selectedDay} onSelect={onSelect} />;
        })}
      </Card>
    );
  }

  // ---------------------------------------------------------------
  // Day Timecard — adjacent detail for the selected day: bigger
  // timeline + device source chip, Effective/Gross/Break/OT, and
  // the Pay impact line ("this is a ledger that computes pay").
  // ---------------------------------------------------------------
  function MetaFigure({ label, value }) {
    const { c } = useTheme();
    return (
      <div>
        <div style={{ fontFamily: G.sans, fontSize: 11, color: c.inkMuted }}>{label}</div>
        <div style={{ fontFamily: G.mono, fontSize: 14, fontWeight: 600, color: value === "—" ? c.inkMuted : c.ink, marginTop: 2, fontFeatureSettings: "'tnum' 1, 'lnum' 1" }}>{value}</div>
      </div>
    );
  }

  function DayTimecard({ d, monthLabel, onViewPayslip }) {
    const { c } = useTheme();
    if (!d) {
      return (
        <Card>
          <div style={{ fontFamily: G.sans, fontSize: 13, color: c.inkMuted, textAlign: "center", padding: G.sp[4] }}>
            Select a day to see its timecard.
          </div>
        </Card>
      );
    }
    const dateLabel = d.weekdayLabel + ", " + pad2(d.day) + " " + monthLabel;
    const payImpact = PAY_IMPACT[d.status];
    const hasPunches = d.inMin !== null && d.inMin !== undefined;
    const action = ACTION_LABEL[d.status];

    return (
      <Card style={{ position: "sticky", top: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: G.sp[4], gap: G.sp[3] }}>
          <div>
            <div style={{ fontFamily: G.sans, fontSize: 13, color: c.inkMuted }}>{dateLabel}</div>
            <div style={{ marginTop: 6 }}><ArrivalMark status={d.status} size={26} /></div>
            {d.label && <div style={{ fontFamily: G.sans, fontSize: 12, color: c.inkMuted, marginTop: 4 }}>{d.label}</div>}
          </div>
          {d.status === "onLeave" && <Seal label="Approved" />}
        </div>

        {hasPunches ? (
          <div style={{ marginBottom: G.sp[4] }}>
            <BigTimeline dayData={d} />
            {d.device && (
              <div style={{ fontFamily: G.sans, fontSize: 11.5, color: c.inkMuted, marginTop: G.sp[2] }}>
                Recorded at {d.device}
              </div>
            )}
            {d.status === "late" && (
              <div style={{ fontFamily: G.sans, fontSize: 11.5, color: c.warning, marginTop: 2 }}>
                Arrived {d.inMin - STANDARD_IN}m after shift start
              </div>
            )}
            {d.status === "missingSwipe" && (
              <div style={{ fontFamily: G.sans, fontSize: 11.5, color: c.danger, marginTop: 2 }}>
                Out-punch not recorded — effective hours cannot be computed until regularized
              </div>
            )}
          </div>
        ) : (
          <div style={{ fontFamily: G.sans, fontSize: 13, color: c.inkMuted, marginBottom: G.sp[4] }}>
            {d.status === "future" ? "This day hasn't occurred yet." : "No punches recorded for this day."}
          </div>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", gap: G.sp[6], marginBottom: G.sp[4] }}>
          <MetaFigure label="Effective" value={fmtHM(d.effectiveMin)} />
          <MetaFigure label="Gross" value={fmtHM(d.grossMin)} />
          <MetaFigure label="Break" value={fmtHM(d.breakMin)} />
          <MetaFigure label="OT" value={fmtHM(d.otMin)} />
        </div>

        {payImpact && (
          <div style={{ display: "flex", alignItems: "center", gap: G.sp[3], padding: G.sp[3] + "px", background: c.bg, borderRadius: G.r.sm, marginBottom: G.sp[4], border: "1px solid " + c.border }}>
            <Badge tone={payImpact.tone} icon={payImpact.icon}>{payImpact.badge}</Badge>
            <span style={{ fontFamily: G.sans, fontSize: 12, color: c.inkMuted }}>{payImpact.text}</span>
          </div>
        )}

        <div style={{ display: "flex", gap: G.sp[3], flexWrap: "wrap" }}>
          {action === "Regularize" && <Button variant="primary" size="sm">Regularize this day</Button>}
          {action === "Apply partial day" && <Button variant="primary" size="sm">Apply partial day</Button>}
          {d.status !== "future" && <Button variant="ghost" size="sm">View full day logs</Button>}
          {d.status !== "future" && <Button variant="link" size="sm" onClick={onViewPayslip}>View payslip</Button>}
        </div>
      </Card>
    );
  }

  // ---------------------------------------------------------------
  // Empty state — vacation-staff logic (no attendance to log during
  // scheduled academic vacation) vs. a month with no sample data.
  // ---------------------------------------------------------------
  function MonthEmptyState({ meta }) {
    const vacation = meta && meta.period === "Vacation";
    return (
      <Card>
        <EmptyState
          icon="calendar"
          title={vacation ? "No attendance to log — scheduled vacation" : "No attendance records for this month yet"}
          description={
            vacation
              ? "Vacation-staff attendance isn't tracked during scheduled academic vacation. Casual and Sick leave continue to accrue as usual."
              : "This preview doesn't include sample data for the selected month yet — try July 2026."
          }
        />
      </Card>
    );
  }

  // ---------------------------------------------------------------
  // Content root
  // ---------------------------------------------------------------
  function Attendance({ onViewPayslips }) {
    const [monthKey, setMonthKey] = useState(DATA_MONTH);
    const [selectedDay, setSelectedDay] = useState(TODAY_DAY);

    const days = useMemo(function () { return buildMonthDays(monthKey); }, [monthKey]);
    const summary = useMemo(function () { return computeSummary(days); }, [days]);
    const meta = MONTH_META[monthKey];
    const selected = days.length ? (days.filter(function (d) { return d.day === selectedDay; })[0] || null) : null;

    function handleMonthChange(key) {
      setMonthKey(key);
      if (key === DATA_MONTH) setSelectedDay(TODAY_DAY);
    }

    return (
      <div style={{ maxWidth: CONTENT_MAX, margin: "0 auto" }}>
        <MonthHeader monthKey={monthKey} onChange={handleMonthChange} summary={summary} />
        {days.length === 0 ? (
          <MonthEmptyState meta={meta} />
        ) : (
          <div style={{ display: "flex", gap: G.sp[6], alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 620px", minWidth: 520 }}>
              <SectionHeader><BilingualLabel en="Daily record" deva="दैनिक अभिलेख" role="h3" /></SectionHeader>
              <DayList days={days} selectedDay={selectedDay} onSelect={setSelectedDay} />
            </div>
            <div style={{ flex: "0 0 320px", minWidth: 280 }}>
              <SectionHeader><BilingualLabel en="Day timecard" deva="दैनिक टाइमकार्ड" role="h3" /></SectionHeader>
              <DayTimecard d={selected} monthLabel={meta.label} onViewPayslip={onViewPayslips} />
            </div>
          </div>
        )}
      </div>
    );
  }

  window.Screens = window.Screens || {};
  window.Screens.Attendance = Attendance;
})();
