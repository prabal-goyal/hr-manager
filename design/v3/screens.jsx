/* @jsxRuntime classic */
/* ============================================================
   Naveya — Screens v3 · window.Screens3 = { Home }

   Home   = exploration C's full-width welcome band on top of
            exploration A's card field. Every table lives inside a
            card. Every figure is Red Hat Mono, lakh-grouped.

   No hex here — colours come from window.G3 via the kit.
   No hardcoded copy — every string goes through t().
   ============================================================ */
(function () {
  const G3 = window.G3;
  const UI = window.UI3;
  const { useState } = React;
  const {
    useTheme, ThemeToggle, useLang, addStrings,
    Rail, Motif,
    Card, Button, LinkButton,
    Meter, StatusMark, Figure, Icon, inr, num,
  } = UI;

  /* the shared leave queue — Home reports what it holds, it never
     keeps a second copy of her requests */
  const LF = window.LeaveFlow;

  /* ============================================================
     STRINGS — complete en + hi. The UI is in ONE language at a
     time; demo row content (times, sources, notes) is translated
     too, never left as English inside a Hindi screen.
     ============================================================ */
  addStrings({
    en: {
      /* ---- home: chrome ---- */
      "home.crumb": "Home",
      "home.school": "Sunrise Public School",
      "home.greeting": "Good afternoon, Ananya",
      "home.gsub": "Tuesday, 11 August 2026",
      /* the compact identity line — also read by the My Attendance page */
      "home.identity": "PGT, Physics · NAV-0142 · Sunrise Public School, Indiranagar",

      /* ---- this month, as a calendar ---- */
      "cal.title": "August attendance",
      "cal.sub": "So far, 1–10 August · today is still in progress",
      "cal.month": "August",
      "cal.gridAria": "August 2026 attendance, day by day",
      /* authored single-letter column heads — never sliced from the full
         weekday name */
      "cal.dh0": "S", "cal.dh1": "M", "cal.dh2": "T", "cal.dh3": "W",
      "cal.dh4": "T", "cal.dh5": "F", "cal.dh6": "S",
      /* the letter IS the state — the tint only reinforces it, so the
         grid stays readable with all colour removed */
      "cal.codeP": "P", "cal.codeW": "W", "cal.codeL": "L", "cal.codeH": "H",
      "cal.wordP": "present", "cal.wordW": "week off",
      "cal.wordL": "leave", "cal.wordH": "holiday",
      "cal.wordToday": "today, in progress",
      "cal.wordUpcoming": "upcoming",
      "cal.dayAria": "{d} {month}, {state}",
      "cal.keyP": "{n} present",
      "cal.keyL": "{n} leave",
      "cal.keyW": "{n} week offs",
      "cal.keyH": "{n} holiday ahead",

      /* ---- payslip ---- */
      "pay.title": "July payslip",
      "pay.credited": "Credited 31 Jul · HDFC ••4321",
      "pay.settled": "Paid in full, on time",
      "pay.open": "Open my payslips",

      /* ---- leave ---- */
      "leave.title": "Your leave",
      "leave.next": "Your next leave",
      "leave.sub": "Available now, of this year’s quota",
      "leave.cl": "Casual leave",
      "leave.ml": "Medical leave",
      "leave.co": "Comp-off",
      "leave.leftOf": "left of",
      "leave.available": "available",
      "leave.ariaOpen": "{name}: {have} days available, with no annual quota",
      "leave.apply": "Apply for leave",
      "leave.aria": "{name}: {have} days left of {total}",

      /* ---- HR-initiated requests (M4: she never self-writes a document) ---- */
      "req.title": "What HR has asked you for",
      "req.sub": "{n} still waiting on you",
      "req.dueBy": "Due {date} · in {n} days",
      "req.sentOn": "Sent {date} — with HR now",
      "req.rowAria": "Respond to the request for your {doc}",
      "req.cta": "Respond to these",
      "req.d.aug10": "10 August",
      "req.d.aug20": "20 August",
      "req.d.aug25": "25 August",

      /* ---- holidays ---- */
      "hol.title": "Holidays ahead",
      "hol.more": "View the full calendar",
      "hol.inDays": "in {n} days",
      "hol.mAug": "Aug",
      "hol.mSep": "Sep",
      "hol.1": "Independence Day",  "hol.1d": "Sat, 15 August",
      "hol.2": "Raksha Bandhan",    "hol.2d": "Fri, 28 August",
      "hol.3": "Janmashtami",       "hol.3d": "Fri, 4 September",

      /* ---- shared attendance vocabulary (also used by My Attendance) ---- */
      "att.stPresent": "Present",
      "att.stLate": "Late",
      "att.stLeave": "On leave",
      "att.stOff": "Weekly off",
      "att.stProgress": "In progress",
      "att.sumPresent": "Present",
      "att.sumLate": "Late",
      "att.sumLeave": "Leave",
      "att.sumOff": "Off",
      "att.total": "Hours this month",
      "att.colIn": "In",
      "att.colOut": "Out",
      "att.d0": "Sun", "att.d1": "Mon", "att.d2": "Tue", "att.d3": "Wed",
      "att.d4": "Thu", "att.d5": "Fri", "att.d6": "Sat",
    },

  });

  /* ============================================================
     DATA — realistic Indian school records. Figures SUM.
     ============================================================ */

  /* July 2026 payslip. The listed lines RECONCILE, on purpose:
     94,800.00 − (5,688.00 + 200.00 + 10,480.00) = 78,432.00 take-home.
     PAY_NET is derived, never re-typed — a figure a reader can add up
     has to be a figure the code adds up. */
  const PAY = {
    gross: 94800.0,
    deductions: [
      { key: "pay.pf", v: -5688.0 },
      { key: "pay.pt", v: -200.0 },
      { key: "pay.tds", v: -10480.0 },
    ],
    delta: 1250.0,               /* July take-home − June take-home */
    /* Apr 77,182 + May 77,182 + Jun 77,182 + Jul 78,432 = 3,09,978.
       June is July minus the delta above, so the year-to-date figure
       is consistent with the one comparison the card makes. */
    ytd: 309978.0,
  };
  const PAY_NET = PAY.gross + PAY.deductions.reduce((sum, l) => sum + l.v, 0);

  /* The clock itself belongs to My Attendance (pages/attendance.jsx
     owns the store, the dialogs and the card Home renders), so Home no
     longer keeps a second opinion about whether she has clocked in.
     The calendar below still needs to know which day is today. */
  const TODAY = { date: 11 };

  /* August 2026. 1 Aug 2026 falls on a Saturday, so the month opens in
     the last column; Saturdays are working half-days at this school and
     Sundays are the week off. `marks` is what HAS happened (1–10);
     `ahead` is what the school calendar already knows about the rest of
     the month. The two are kept apart because a summary that counts a
     future week-off as "so far" is a lie. */
  const CAL = {
    days: 31,
    firstDow: 6,
    today: TODAY.date,
    marks: { 1: "P", 2: "W", 3: "P", 4: "P", 5: "L", 6: "P", 7: "P", 8: "P", 9: "W", 10: "P" },
    ahead: { 15: "H", 16: "W", 23: "W", 30: "W" },
  };
  const CAL_ELAPSED = Object.keys(CAL.marks).reduce((acc, d) => {
    const m = CAL.marks[d];
    acc[m] = (acc[m] || 0) + 1;
    return acc;
  }, {});
  const CAL_AHEAD_H = Object.keys(CAL.ahead).filter((d) => CAL.ahead[d] === "H").length;

  /* leave balances, as accrued today. Colour comes from the leave-TYPE
     token space (which leave), never from the attendance-state space. */
  /* NO EARNED LEAVE. M8's acceptance criterion is that teaching staff
     cannot accrue EL, and Ananya is a PGT — teaching staff. Comp-off
     takes its place: it is what a teacher actually banks (exam duty,
     extra classes), and it has no annual quota, hence total: null.
     These figures agree with pages/leave.jsx's ledger. */
  const LEAVE = [
    { key: "leave.cl", role: "ltCasual", have: 8, total: 12 },
    { key: "leave.ml", role: "ltSick", have: 6, total: 10 },
    { key: "leave.co", role: "ltComp", have: 2, total: null },
  ];

  /* days-away counted from 11 Aug: 15 Aug = 4, 28 Aug = 17,
     4 Sep = (31 − 11) + 4 = 24 */
  const HOLIDAYS = [
    { key: "hol.1", d: "15", m: "hol.mAug", inDays: 4 },
    { key: "hol.2", d: "28", m: "hol.mAug", inDays: 17 },
    { key: "hol.3", d: "04", m: "hol.mSep", inDays: 24 },
  ];

  /* day counts can be half days; never round a leave balance away */
  function days(n) {
    return n % 1 === 0 ? num(n) : num(Math.floor(n)) + "." + String(Math.round((n % 1) * 10));
  }

  /* LOGIN LIVES IN pages/login.jsx NOW (2026-10-27). The split —
     cocoa brand panel left, form right — was replaced by the centred
     card the designer asked for, and a form that carries a captcha
     and a one-time code could not keep sharing a file with Home. */

  /* ============================================================
     HOME — ported from the winning "Staffroom Terracotta" exploration
     (design/v2/explore/home-d.jsx), re-expressed in G3 tokens + the
     UI3 kit and fitted beside the Keka rail the product already has.

     One screen, one question: "what needs me today?" — answered by six
     cards in three independent columns (flex, never a grid: a shared
     grid row stretches every card to its tallest sibling and opens a
     hole under the short ones).

     The voice is the point of this direction. Copy is written the way a
     colleague would say it — "A request needs you", "It takes about two
     minutes", "School stays closed on these days" — in both languages.
     ============================================================ */

  /* ============================================================
     HOME — one screen, ranked.

     2026-09-23 designer pass: the old composition was six cards of
     equal weight under a decorated cream slab, and the eye had to
     search for the one fact she opens Home to read. It is now

       1 · a plain page head (greeting, date, who she is) — no slab,
           no illustration, so the first card starts above the fold;
       2 · three columns, each one an idea: her record (the month, then
           her colleagues' dates), what is coming (leave, holidays, last
           month's payslip), and what is live right now (her clock, HR's
           requests, her colleagues' cover requests);
       3 · columns paired so they end
           near the same height instead of trailing off raggedly:
             her month + last month's payslip · her leave + the
             holidays ahead · what is waiting on her (HR requests,
             then the colleagues asking her to cover).

     NO GRADIENTS anywhere (designer, this pass). The one that existed
     ran `present -> accent`, which asserted a relationship between two
     unrelated semantic tokens and broke the moment the palette moved.
     Every bar is now a single token colour.
     ============================================================ */

  /* ---- 1 · the page head: text, not a slab ----
     The clock is NOT here. A card hung beside a page title sits at the
     height of a heading with nothing under it, and reads as a box that
     has come loose; it belongs in the field with the other cards. */
  function PageHead() {
    const { c } = useTheme();
    const { t, ty } = useLang();
    return (
      <div style={{ marginBottom: G3.layout.gap }}>
        <h1 style={ty("display", { margin: 0, color: c.ink })}>{t("home.greeting")}</h1>
        <p style={ty("body", { margin: "7px 0 0", color: c.inkMuted })}>{t("home.gsub")}</p>
      </div>
    );
  }

  /* ---- the month, as a real calendar ----
     The LETTER is the state; the tint only reinforces it, so the grid
     survives greyscale. Every cell carries a full accessible name
     ("11 August, today, in progress"), and future days the calendar
     already knows about are dimmed and kept OUT of the "so far" counts. */
  const CAL_TONE = {
    P: (c) => ({ bg: c.presentTint, fg: c.presentText }),
    L: (c) => ({ bg: c.leaveTint, fg: c.leaveText }),
    H: (c) => ({ bg: c.holidayTint, fg: c.holidayText }),
    W: (c) => ({ bg: c.offTint, fg: c.offText }),
  };

  function MonthCard() {
    const { c } = useTheme();
    const { t, ty, lang } = useLang();

    /* lay the month out week by week so the rows can be real rows */
    const cells = [];
    for (let i = 0; i < CAL.firstDow; i++) cells.push(null);
    for (let d = 1; d <= CAL.days; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    const weeks = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

    const keys = [
      { code: "P", label: t("cal.keyP", { n: num(CAL_ELAPSED.P || 0) }) },
      { code: "L", label: t("cal.keyL", { n: num(CAL_ELAPSED.L || 0) }) },
      { code: "W", label: t("cal.keyW", { n: num(CAL_ELAPSED.W || 0) }) },
      { code: "H", label: t("cal.keyH", { n: num(CAL_AHEAD_H) }) },
    ];

    function cell(d, idx) {
      if (d === null) return <div key={"e" + idx} role="gridcell" />;
      const isToday = d === CAL.today;
      const mark = CAL.marks[d] || CAL.ahead[d] || null;
      const future = d > CAL.today;
      const tone = mark ? CAL_TONE[mark](c) : null;
      const state = isToday
        ? t("cal.wordToday")
        : mark ? t("cal.word" + mark)
        : future ? t("cal.wordUpcoming")
        : t("cal.wordUpcoming");
      return (
        <div
          key={"d" + d}
          role="gridcell"
          aria-label={t("cal.dayAria", { d: d, month: t("cal.month"), state: state })}
          style={{
            borderRadius: G3.r.md,
            padding: "7px 4px 6px",
            textAlign: "center",
            background: mark ? tone.bg : "transparent",
            opacity: future && mark ? 0.55 : 1,
            border: "2px solid " + (isToday ? c.accent : "transparent"),
            minHeight: 48,
          }}
        >
          <span style={G3.fig("sm", {
            display: "block", fontWeight: isToday ? 700 : 500, lineHeight: 1.3,
            color: future && !mark ? c.inkFaint : c.ink,
          })}>
            {d < 10 ? "0" + d : String(d)}
          </span>
          <span
            aria-hidden="true"
            style={ty("caption", {
              display: "block", fontSize: 10.5, fontWeight: 700, letterSpacing: ".06em",
              lineHeight: 1.4, color: isToday ? c.action : mark ? tone.fg : "transparent",
            })}
          >
            {isToday ? "\u2022" : mark ? t("cal.code" + mark) : "\u00a0"}
          </span>
        </div>
      );
    }

    return (
      <Card icon="attendance" iconTone="present" title={t("cal.title")} sub={t("cal.sub")}>
        <div role="grid" aria-label={t("cal.gridAria")} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
          <div role="row" style={{ display: "contents" }}>
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={"h" + i} role="columnheader" title={t("att.d" + i)} aria-label={t("att.d" + i)}
                style={ty("caption", { textAlign: "center", color: c.inkMuted, letterSpacing: ".05em", paddingBottom: 4 })}
              >
                {t("cal.dh" + i)}
              </div>
            ))}
          </div>
          {weeks.map((w, wi) => (
            <div key={"w" + wi} role="row" style={{ display: "contents" }}>
              {w.map((d, di) => cell(d, wi * 7 + di))}
            </div>
          ))}
        </div>

        {/* one row doing two jobs: it decodes the letters AND it is the
            month summary — so there is no separate legend to cut */}
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", borderTop: "1px solid " + c.border, paddingTop: 14, marginTop: 12 }}>
          {keys.map((k) => {
            const tone = CAL_TONE[k.code](c);
            return (
              <span key={k.code} style={ty("small", { display: "inline-flex", alignItems: "center", gap: 7, color: c.inkMuted, fontWeight: 600 })}>
                <span
                  aria-hidden="true"
                  style={ty("caption", {
                    width: 21, height: 21, borderRadius: G3.r.xs, background: tone.bg, color: tone.fg,
                    fontSize: 10.5, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  })}
                >
                  {t("cal.code" + k.code)}
                </span>
                {k.label}
              </span>
            );
          })}
        </div>
      </Card>
    );
  }

  /* ---- last month's payslip ----
     NO AMOUNTS ON THE DASHBOARD. A teacher opens Home in a staffroom
     with colleagues at her shoulder; what she needs here is whether it
     was paid, when, and into which account. Every figure lives one
     deliberate click away on Payslips. */
  function PayslipCard({ onNavigate }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    return (
      <Card icon="payslip" iconTone="accent" title={t("pay.title")} sub={t("pay.credited")}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "0 0 16px" }}>
          <StatusMark role="present" word={t("pay.settled")} />
        </div>
        <Button kind="secondary" full iconRight="arrow" onClick={() => onNavigate && onNavigate("payslips")}>
          {t("pay.open")}
        </Button>
      </Card>
    );
  }

  /* ---- her leave: what is booked, then what is left ----
     The next request comes from the shared queue, so a head of
     department approving it on DH-02 changes this line. */
  function LeaveCard({ onNavigate }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    if (LF) LF.useRequests();

    let next = null;
    if (LF) {
      const mine = LF.forPerson("ananya").filter((r) => {
        const st = LF.statusOf(r);
        return (st === "pending" || st === "approved") && r.to >= LF.TODAY_ISO;
      });
      mine.sort((a, b) => (a.from < b.from ? -1 : 1));
      next = mine[0] || null;
    }

    return (
      <Card icon="leave" iconTone="leave" title={t("leave.title")}>
        {next ? (
          <div style={{ paddingBottom: 16, marginBottom: 16, borderBottom: "1px solid " + c.rule }}>
            <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 6 })}>{t("leave.next")}</div>
            <div style={G3.fig("md", { color: c.ink, fontWeight: 600 })}>
              {LF.fmtRange(t, next.from, next.to)}
              <span style={{ color: c.inkFaint, fontWeight: 400 }}>{"  ·  " + LF.daysWord(t, next.days, next.half)}</span>
            </div>
            <div style={{ marginTop: 9 }}><LF.StageChip req={next} /></div>
          </div>
        ) : null}

        <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 12 })}>{t("leave.sub")}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
          {LEAVE.map((lv) => (
            <div key={lv.key}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, marginBottom: 6 }}>
                <span style={ty("small", { color: c.ink, fontWeight: 600 })}>{t(lv.key)}</span>
                <span style={ty("small", { color: c.inkMuted, display: "inline-flex", alignItems: "baseline", gap: 5, whiteSpace: "nowrap" })}>
                  <Figure value={days(lv.have)} size="md" weight={700} color={c.ink} />
                  {lv.total === null ? (
                    <span>{t("leave.available")}</span>
                  ) : (
                    <React.Fragment>
                      <span>{t("leave.leftOf")}</span>
                      <Figure value={days(lv.total)} size="sm" color={c.inkMuted} />
                    </React.Fragment>
                  )}
                </span>
              </div>
              <Meter
                frac={lv.total === null ? 1 : lv.have / lv.total}
                bar={c[lv.role]} track={c.gutter}
                label={lv.total === null
                  ? t("leave.ariaOpen", { name: t(lv.key), have: days(lv.have) })
                  : t("leave.aria", { name: t(lv.key), have: days(lv.have), total: days(lv.total) })}
              />
            </div>
          ))}
        </div>
        <div style={{ marginTop: 18 }}>
          <Button kind="secondary" full onClick={() => onNavigate && onNavigate("leave")}>{t("leave.apply")}</Button>
        </div>
      </Card>
    );
  }

  /* ---- what the office has asked her for ----
     M4 document governance: an employee never self-writes a document,
     so this is a list of HR-initiated requests and nothing else — no
     "add a document" path exists anywhere on this screen. The rows are
     the SAME requests the Requests module answers (r1/r2/r3 there), and
     a row hands over to that module rather than answering here. */
  const HR_REQUESTS = [
    { id: "r1", docKey: "et.doc.type.pan", whoKey: "et.doc.who.meera", state: "open", dueKey: "req.d.aug20", inDays: 9 },
    { id: "r2", docKey: "et.doc.type.bankProof", whoKey: "et.doc.who.rajan", state: "open", dueKey: "req.d.aug25", inDays: 14 },
    { id: "r3", docKey: "et.doc.type.medical", whoKey: "et.doc.who.meera", state: "submitted", sentKey: "req.d.aug10" },
  ];
  /* amber for what she still has to do, plain grey for what is now
     HR's move. A "sent" row drawn in a leave-type rose read as a
     refusal — the same mistake the reimbursement register made. */
  const REQ_ROLE = { open: "late", submitted: "off" };

  function HrRequestsCard({ onNavigate }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const open = HR_REQUESTS.filter((r) => r.state === "open").length;

    function go() {
      window.NaveyaTasksTab = "documents";
      if (onNavigate) onNavigate("empTasks");
    }

    return (
      <Card icon="document" iconTone="brass" title={t("req.title")} sub={t("req.sub", { n: num(open) })}>
        <div>
          {HR_REQUESTS.map((r, i) => (
            <button
              key={r.id} type="button" onClick={go}
              aria-label={t("req.rowAria", { doc: t(r.docKey) })}
              style={{
                /* the mark sits beside the document when there is room
                   for both and drops under it when there is not --
                   better a second line than "Bank account / proof" */
                display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left",
                flexWrap: "wrap", rowGap: 6,
                border: "none", background: "transparent", cursor: "pointer",
                padding: "12px 0", borderTop: i ? "1px solid " + c.rule : "none",
              }}
            >
              <span style={{ flex: "1 1 180px", minWidth: 0 }}>
                <span style={ty("small", { display: "block", color: c.ink, fontWeight: 700 })}>{t(r.docKey)}</span>
                <span style={ty("caption", { display: "block", color: c.inkMuted, marginTop: 2 })}>
                  {r.state === "open"
                    ? t("req.dueBy", { date: t(r.dueKey), n: num(r.inDays) })
                    : t("req.sentOn", { date: t(r.sentKey) })}
                </span>
                <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 2 })}>{t(r.whoKey)}</span>
              </span>
              <StatusMark role={REQ_ROLE[r.state]} word={t("et.doc.st." + r.state)} />
            </button>
          ))}
        </div>
        <div style={{ marginTop: 16 }}>
          <Button kind="primary" full iconRight="arrow" onClick={go}>{t("req.cta")}</Button>
        </div>
      </Card>
    );
  }

  /* ---- the holidays ahead ---- */
  function HolidayCard({ onNavigate, onOpen }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    return (
      <Card icon="festival" iconTone="brass" title={t("hol.title")}>
        <div>
          {HOLIDAYS.map((h, i) => (
            <div
              key={h.key}
              style={{
                display: "flex", alignItems: "center", gap: 14, padding: "11px 0",
                borderTop: i ? "1px solid " + c.rule : "none",
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  flex: "0 0 auto", width: 44, height: 46, borderRadius: G3.r.md, background: c.sunken,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                }}
              >
                <Figure value={h.d} size="md" weight={700} color={c.ink} style={{ lineHeight: 1.15 }} />
                <span style={ty("caption", { fontSize: 10.5, lineHeight: 1.3, color: c.inkMuted })}>{t(h.m)}</span>
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={ty("small", { color: c.ink, fontWeight: 700 })}>{t(h.key)}</div>
                <div style={ty("caption", { color: c.inkMuted })}>{t(h.key + "d")}</div>
              </div>
              <span style={ty("caption", { color: c.inkFaint, whiteSpace: "nowrap" })}>{t("hol.inDays", { n: num(h.inDays) })}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12 }}>
          <LinkButton onClick={() => (onOpen ? onOpen() : onNavigate && onNavigate("attendance"))}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
              {t("hol.more")}
              <span aria-hidden="true" style={{ display: "flex" }}><Icon name="arrow" size={14} /></span>
            </span>
          </LinkButton>
        </div>
      </Card>
    );
  }

  function Home({ role, onNavigate }) {
    const { c } = useTheme();
    const { t, ty, lang } = useLang();
    const L = G3.layout;
    return (
      <div
        className="nv3"
        style={{ display: "flex", minHeight: "100vh", background: c.page, color: c.ink, fontFamily: G3.font.ui }}
      >
        <Rail role={role || "employee"} active="home" onNavigate={onNavigate} />

        {/* overflowX clip (not hidden) contains the page motif, which is
            drawn deliberately past the right edge — without it the whole
            document gains a 70px horizontal scrollbar. */}
        <main style={{ flex: 1, minWidth: 0, position: "relative", overflowX: "clip" }}>
          <Motif />
          <div style={{ position: "relative", zIndex: 1, maxWidth: L.contentMax, margin: "0 auto", padding: "22px " + L.contentPadX + "px 56px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, marginBottom: 20 }}>
              <div style={ty("small", { color: c.inkMuted })}>
                <span style={{ color: c.ink, fontWeight: 700 }}>{t("home.crumb")}</span>
                <span style={{ margin: "0 8px", color: c.inkFaint }}>·</span>
                <span>{t("home.school")}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <ThemeToggle />
              </div>
            </div>

            <PageHead />

            {/* Three independent flex columns — NOT a CSS grid: a shared
                grid row stretches every card to its tallest sibling,
                which relocates the empty space instead of removing it.
                Two cards per column, paired so the three columns finish
                near each other: her month and her payslip; her leave and
                the holidays ahead; and on the right, the two things that
                are actually waiting on her. */}
            <div style={{ display: "flex", gap: L.gap, alignItems: "flex-start", marginTop: L.gap, flexWrap: "wrap" }}>
              <div style={{ flex: "1.15 1 360px", minWidth: 0, display: "flex", flexDirection: "column", gap: L.gap }}>
                <MonthCard />
                {/* her colleagues' birthdays and work anniversaries — a
                    box like every other, drawn from the one roster in
                    leaveflow.jsx and shared with the head of
                    department's home */}
                {LF && LF.CelebrationsCard
                  ? React.createElement(LF.CelebrationsCard, { deptKey: "science", excludeId: "ananya" })
                  : null}
                {/* WHO IS NOT IN, BEFORE SHE ASKS ANYBODY TO COVER. Read
                    from the same approved requests the Leave screen
                    reads, and it never says which leave — that is
                    health data and a colleague has no business with
                    it. */}
                {LF && LF.AwayTodayCard
                  ? React.createElement(LF.AwayTodayCard, { deptKey: "science", excludeId: "ananya" })
                  : null}
              </div>
              <div style={{ flex: "1 1 340px", minWidth: 0, display: "flex", flexDirection: "column", gap: L.gap }}>
                <LeaveCard onNavigate={onNavigate} />
                <HolidayCard onNavigate={onNavigate} />
                {/* last month's, and it waits for nobody — so it sits with
                    what is coming rather than with what wants her now */}
                <PayslipCard onNavigate={onNavigate} />
              </div>
              {/* the right-hand column is one idea: what is live for her
                  at this minute. Her own clock first, then the two desks
                  waiting on an answer. */}
              <div className="nv3-live-first" style={{ flex: "1 1 340px", minWidth: 0, display: "flex", flexDirection: "column", gap: L.gap }}>
                {window.NaveyaClock && window.NaveyaClock.HomeCard ? React.createElement(window.NaveyaClock.HomeCard, null) : null}
                <HrRequestsCard onNavigate={onNavigate} />
                {/* colleagues' cover requests — rendered by pages/leave.jsx,
                    which owns the shared cover store (window.NaveyaCover) */}
                {window.NaveyaCover && window.NaveyaCover.HomeCard ? React.createElement(window.NaveyaCover.HomeCard, { onNavigate: onNavigate }) : null}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  /* the holidays card is the school calendar, not the teacher's — the
     head of department's home mounts the same one */
  /* the year itself lives in v3/holidays.jsx, which the Group Admin
     sets on Systems -> Calendar. This file contributes the CARD the
     four dashboards render, and must not replace the store. */
  window.NaveyaHolidays = Object.assign(window.NaveyaHolidays || {}, { Card: HolidayCard, list: HOLIDAYS });

  /* Login is published by pages/login.jsx, onto this same object */
  window.Screens3 = Object.assign(window.Screens3 || {}, { Home: Home });
})();
