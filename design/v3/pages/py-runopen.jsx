/* @jsxRuntime classic */
/* ============================================================
   Naveya — one payroll run, open · window.Pages3.PYRunOpen

   WHY THIS IS ITS OWN SCREEN. It used to be a second render of the
   list's module: same route, same page, different content. The
   designer read that for what it was -- "when a user clicks on open
   on any campus of payroll run I want you to open a NEW SCREEN and
   not a section inside the same screen" -- and they were right. A run
   is a place you go into and work in for an hour. It has a back link,
   a URL of its own, and the thing a place you work in must have:

   IT SAVES. Nothing the officer does reaches the run until Save is
   pressed. The screen holds a DRAFT, says how many decisions are
   waiting in it, offers to throw them away, and asks before letting
   anybody walk out with unsaved work. v3/payrun-store.jsx owns the
   saved run; this file owns the draft.

   TWO MODES, TWO SCREENS. A run is started as automated or manual
   (see the store) and this file draws whichever it is:

     automated   the roll on screen. Ask HR, pay a bill, skip an
                 instalment, pay an advance, send.
     manual      the school's own spreadsheet. Download every row,
                 fill it in wherever the school fills it in, upload it
                 back, read what changed, send.

   They are not one screen with a switch. The automated run is a table
   you work; the manual run is three steps you walk. Sharing a layout
   between them would make both worse.

   THE FIGURES CARRY THEIR COLOUR. Every strip here is a Band: a
   swatch to the left of each figure and one seamless bar beneath, its
   bands in the same colours and the same proportions. A figure that
   is the sum of the others takes no band, because drawing it would
   count the same rupees twice.

   THE PAY GROUPS ARE A CONTROL, NOT A CAPTION. Three chips under the
   headline said what each group cost and did nothing. They are now
   the way into a group: pick one and the run is that group -- its own
   figures, its own people, its own loans and bills.

   SPEC — docs/development-specification.md M10; screen-inventory
   PY-07. Maker-checker: the officer sends, the accountant approves.
   There is no Approve control here and there never will be.
   ============================================================ */
(function () {
  const G3 = window.G3;
  const UI = window.UI3;
  const { useState, useMemo, useRef, useEffect } = React;
  const {
    useTheme, ThemeToggle, useLang, addStrings,
    Rail, Motif, Card, Band, Register, Button, LinkButton, Chip, StatusMark, Icon,
    ActionMenu, Field, Input, Select, EmptyState, Modal, BackBar, Avatar,
    Tabs, TabPanel, Meter, FileField,
    inr, num, campusLabel,
  } = UI;

  const R = window.NaveyaRoll;
  const ST = window.NaveyaPayRuns;
  const D = (window.Pages3 && window.Pages3.PYRunData) || null;
  const S = (window.Pages3 && window.Pages3.PYSalData) || null;

  const LIVE = R ? R.LIVE_MONTH : 8;
  const PAGE = 25;

  function campusName(t, id) {
    return id === "yelahanka" ? t("pyo2.c.yelahanka") : campusLabel(t, id);
  }
  /* a month ahead of the live one has no roll of its own yet: its
     attendance has not happened. The run opens on today's people and
     today's salaries, and says so rather than showing an empty table */
  function rollMonth(m) { return m > LIVE ? LIVE : m; }

  addStrings({
    en: {
      "pyo2.crumb": "Payroll",
      "pyo2.entity": "Naveya Vidya Trust — Bengaluru",
      "pyo2.c.yelahanka": "Yelahanka",
      "pyo2.back": "Payroll runs",
      "pyo2.cancel": "Cancel",

      /* ---- the heading ---- */
      "pyo2.head": "{campus} · {mon} {y}",
      "pyo2.st.checking": "Checking",
      "pyo2.st.sent": "With accountant",
      "pyo2.st.paid": "Paid",
      "pyo2.sentOn": "Sent to the accountant on 10 August.",
      "pyo2.closed": "{run} · closed, and nothing on it can change.",
      "pyo2.register": "Open the register",
      "pyo2.ahead": "{mon} has not happened yet. These are today's people and today's salaries.",
      "pyo2.mode.auto": "On Naveya",
      "pyo2.mode.manual": "In a spreadsheet",

      /* ---- saving ---- */
      "pyo2.save": "Save",
      "pyo2.saved": "Saved",
      "pyo2.savedOn": "Saved {d}",
      "pyo2.notSaved": "Not saved yet",
      "pyo2.dirty": "{n} changes are not saved",
      "pyo2.dirty1": "One change is not saved",
      "pyo2.kept": "{n} changes on this run",
      "pyo2.kept1": "One change on this run",
      "pyo2.discard": "Throw them away",
      "pyo2.leave.title": "Leave without saving?",
      "pyo2.leave.body": "{n} changes on this run would be lost.",
      "pyo2.leave.go": "Leave anyway",
      "pyo2.leave.stay": "Stay and save",
      "pyo2.savedNow": "Saved.",
      "pyo2.discarded": "Thrown away.",

      /* ---- the figures ---- */
      "pyo2.f.pay": "To pay",
      "pyo2.f.payGroup": "To pay · {g}",
      "pyo2.sum": "{n} of {all} people · earned {gross}, less {ded} deductions",
      "pyo2.sum.held": "{n} of {all} people · earned {gross}, less {ded} deductions and {held} held back",

      /* ---- what the officer changed ---- */
      "pyo2.ch.added": "{money} added",
      "pyo2.ch.taken": "{money} taken off",
      "pyo2.ch.undo": "Put it all back",

      /* ---- pay groups ---- */
      "pyo2.g.all": "All groups",
      "pyo2.g.rules": "See how this group pays",

      /* ---- tabs ---- */
      "pyo2.tab.people": "People",
      "pyo2.tab.loans": "Loans and advances",
      "pyo2.tab.claims": "Reimbursements",
      "pyo2.tab.ot": "Overtime",
      "pyo2.tab.rises": "Rises",
      "pyo2.tabs.aria": "The payroll run",

      /* ---- people ---- */
      "pyo2.who": "Who gets paid",
      "pyo2.f.all": "Everyone",
      "pyo2.f.fix": "Needs a fix",
      "pyo2.f.asked": "Asked HR",
      "pyo2.f.ready": "Ready",
      "pyo2.search": "Search a name or number",
      "pyo2.col.staff": "Staff",
      "pyo2.col.group": "Pay group",
      "pyo2.col.days": "Days",
      "pyo2.col.month": "This month",
      "pyo2.col.ded": "Deductions",
      "pyo2.col.net": "Net pay",
      "pyo2.total": "{n} people",
      "pyo2.showing": "Showing {a} of {b}",
      "pyo2.more": "Show {n} more",
      "pyo2.none.head": "Nobody here",
      "pyo2.none.body": "Try another filter, or clear the search.",

      /* ---- exceptions ---- */
      "pyo2.i.noSalary": "No salary set",
      "pyo2.i.lopUnexplained": "{n} unpaid days, no leave",
      "pyo2.i.lopUnexplained.plain": "Unpaid days with no leave",
      "pyo2.i.leaveOpen": "Leave still waiting",
      "pyo2.i.noBank": "No bank account",
      "pyo2.i.claimWaiting": "Bill owed since last month",
      "pyo2.i.loanOverNet": "Instalment is more than half the pay",
      "pyo2.i.loanEnding": "Last instalment",
      "pyo2.own.hr": "HR",
      "pyo2.own.payroll": "Yours",
      "pyo2.asked": "Asked HR",
      "pyo2.fixed": "Fixed",

      /* ---- row actions ---- */
      "pyo2.a.ask": "Ask HR to fix",
      "pyo2.a.fix": "Fix it here",
      "pyo2.a.record": "Open pay record",
      "pyo2.a.remind": "Remind HR",
      "pyo2.a.undo": "Put it back",

      /* ---- ask HR ---- */
      "pyo2.ask.title": "Ask HR to fix",
      "pyo2.ask.what": "What is wrong",
      "pyo2.ask.note": "Anything to add",
      "pyo2.ask.notePh": "One line is enough",
      "pyo2.ask.go": "Send to HR",
      "pyo2.ask.done": "Asked HR about {name}.",
      "pyo2.ask.lands": "HR sees this against {name} in their pay queue.",

      /* ---- fix here ---- */
      "pyo2.fix.title": "Fix it here",
      "pyo2.fix.go": "Do it",
      "pyo2.fix.done": "Fixed {name}.",
      "pyo2.fix.amount": "Amount",

      /* ---- loans ---- */
      "pyo2.ln.title": "Loans and advances",
      "pyo2.ln.f.out": "Paid out this month",
      "pyo2.ln.f.from": "{emi} a month from {mon}",
      "pyo2.ln.sub": "{n} people, in the order of what is still owed.",
      "pyo2.ln.f2.back": "Recovered this run",
      "pyo2.ln.f2.backNote": "off {n} salaries",
      "pyo2.ln.f2.backNone": "nothing to recover",
      "pyo2.ln.f2.out": "Paid out this run",
      "pyo2.ln.f2.outNote": "{n} advances, recovered from {mon}",
      "pyo2.ln.f2.outNone": "no advance paid out",
      "pyo2.ln.f2.owed": "Still owed after it",
      "pyo2.ln.f2.owedNote": "across {n} people",
      "pyo2.ln.f2.adv": "Advances running",
      "pyo2.ln.f2.advNote": "{v} of what is owed",
      "pyo2.ln.f2.advNone": "none running",
      "pyo2.ln.f2.foot": "An advance leaves before the salary it belongs to; the months after it carry the recovery.",
      "pyo2.ln.col.what": "What for",
      "pyo2.ln.col.lent": "Lent",
      "pyo2.ln.col.repaid": "Paid back",
      "pyo2.ln.col.left": "Still owed",
      "pyo2.ln.col.month": "This month",
      "pyo2.ln.kind.loan": "Loan",
      "pyo2.ln.kind.advance": "Advance",
      "pyo2.ln.left": "{n} left",
      "pyo2.ln.last": "Last one",
      "pyo2.ln.total": "{n} people",
      "pyo2.ln.none.head": "No loans here",
      "pyo2.ln.none.body": "Nobody in this group is paying one back.",
      "pyo2.ln.a.skip": "Skip this month",
      "pyo2.ln.a.settle": "Settle it in full",
      "pyo2.ln.st.skipped": "Skipped",
      "pyo2.ln.st.settled": "Settled",
      "pyo2.ln.st.new": "New",
      "pyo2.ln.skip.title": "Skip this month",
      "pyo2.ln.skip.body": "Nothing comes off {name} this month. The loan runs one month longer.",
      "pyo2.ln.skip.go": "Skip it",
      "pyo2.ln.skip.done": "Skipped {name}'s instalment.",
      "pyo2.ln.set.title": "Settle it in full",
      "pyo2.ln.set.body": "The whole balance comes off {name} this month instead of one instalment.",
      "pyo2.ln.set.now": "Comes off this month",
      "pyo2.ln.set.was": "Instead of",
      "pyo2.ln.set.go": "Settle it",
      "pyo2.ln.set.done": "Settled {name}'s loan.",
      "pyo2.ln.new": "Pay an advance",
      "pyo2.ln.new.title": "Pay an advance",
      "pyo2.ln.new.who": "Who",
      "pyo2.ln.new.whoPh": "Search a name or number",
      "pyo2.ln.new.amount": "How much",
      "pyo2.ln.new.why": "What for",
      "pyo2.ln.new.months": "Taken back over",
      "pyo2.ln.new.m": "{n} months",
      "pyo2.ln.new.m1": "One month",
      "pyo2.ln.new.sum": "{emi} a month for {n} months, from the next run.",
      "pyo2.ln.new.sum1": "{emi} comes back in full from the next run.",
      "pyo2.ln.new.go": "Pay it",
      "pyo2.ln.new.done": "Paid {name} an advance.",
      "pyo2.ln.new.err": "Pick somebody and an amount.",
      "pyo2.ln.new.cap": "An advance cannot be more than one month's pay.",
      "pyo2.ln.new.dupe": "They already have an advance in this run.",
      "pyo2.ln.all": "Every loan and advance",

      /* ---- reimbursements ---- */
      "pyo2.rc.title": "Reimbursements",
      "pyo2.rc.sub": "Bills the school has approved and not yet paid.",
      "pyo2.rc.line": "{money} waiting across {n} bills",
      "pyo2.rc.lineIn": "{money} in this run",
      "pyo2.rc.lineNext": "{money} moved to the next run",
      "pyo2.rc.f.due": "Owed since last month",
      "pyo2.rc.f.in": "In this run",
      "pyo2.rc.f.next": "Moved to next run",
      "pyo2.rc.col.what": "What for",
      "pyo2.rc.col.when": "Approved",
      "pyo2.rc.col.amount": "Amount",
      "pyo2.rc.col.state": "State",
      "pyo2.rc.st.due": "Owed since last month",
      "pyo2.rc.st.ready": "Waiting",
      "pyo2.rc.st.in": "In this run",
      "pyo2.rc.st.held": "Next run",
      "pyo2.rc.st.not": "Not in this run",
      "pyo2.rc.a.pay": "Pay with this run",
      "pyo2.rc.a.hold": "Move to the next run",
      "pyo2.rc.payAll": "Pay all {n} that are owed",
      "pyo2.rc.paidAll": "Added {n} bills to this run.",
      "pyo2.rc.paid": "Added {name}'s bill to this run.",
      "pyo2.rc.held": "Moved {name}'s bill to the next run.",
      "pyo2.rc.none.head": "Nothing waiting",
      "pyo2.rc.none.body": "No approved bill is waiting here.",
      "pyo2.rc.closedNote": "None went with this run.",
      "pyo2.rc.total": "{n} bills",
      "pyo2.rc.total1": "One bill",
      "pyo2.rc.ch.all": "All",
      "pyo2.rc.all": "Every bill",

      /* ---- overtime ---- */
      "pyo2.ot.title": "Overtime",
      "pyo2.ot.line": "{money} waiting across {n} people · hours verified by HR, priced here",
      "pyo2.ot.line1": "{money} waiting on one person · hours verified by HR, priced here",
      "pyo2.ot.lineIn": "{money} in this run",
      "pyo2.ot.lineNext": "{money} moved to the next run",
      "pyo2.ot.col.for": "For",
      "pyo2.ot.col.hours": "Hours",
      "pyo2.ot.col.rate": "An hour",
      "pyo2.ot.col.pay": "Pay",
      "pyo2.ot.st.ready": "Waiting",
      "pyo2.ot.st.in": "In this run",
      "pyo2.ot.st.held": "Next run",
      "pyo2.ot.st.withHr": "With HR",
      "pyo2.ot.st.not": "Not in this run",
      "pyo2.ot.st.paid": "Paid",
      "pyo2.ot.st.booked": "On another run",
      "pyo2.ot.lineNone": "Nothing waiting on you",
      "pyo2.ot.lineElse": "{money} on another run",
      "pyo2.ot.rate": "{rate} × {mult}",
      "pyo2.ot.noRate": "No rate on file",
      "pyo2.ot.a.pay": "Pay with this run",
      "pyo2.ot.a.hold": "Move to the next run",
      "pyo2.ot.paid": "Added {name}'s overtime to this run.",
      "pyo2.ot.held": "Moved {name}'s overtime to the next run.",
      "pyo2.ot.none.head": "No overtime here",
      "pyo2.ot.none.body": "Nobody in this group has hours waiting.",
      "pyo2.ot.all": "Every overtime claim",
      "pyo2.ot.why": "Not less than twice the normal rate of wages. The hourly rate is basic and dearness pay over 26 days and an 8-hour day.",

      /* ---- rises ---- */
      "pyo2.ri.title": "Appraisal rises",
      "pyo2.ri.line": "{n} rises · the salaries in this run already carry them",
      "pyo2.ri.line1": "One rise · the salaries in this run already carry it",
      "pyo2.ri.lineNone": "No rise lands in this month.",
      "pyo2.ri.col.rise": "Rise",
      "pyo2.ri.col.from": "Was",
      "pyo2.ri.col.to": "Now",
      "pyo2.ri.col.when": "From",
      "pyo2.ri.st.settled": "Set",
      "pyo2.ri.st.waiting": "Not set yet",
      "pyo2.ri.st.declined": "Turned down",
      "pyo2.ri.none.head": "No rises here",
      "pyo2.ri.none.body": "Nobody in this group has a rise this session.",
      "pyo2.ri.all": "Open staff and salaries",
      "pyo2.ri.why": "A rise changes what somebody is on, from a date. It is not a payment in this run — every salary below already carries it.",

      /* ---- the pay record ---- */
      "pyo2.pr.back": "Back to the run",
      "pyo2.pr.take": "Takes home",
      "pyo2.pr.line": "Earned {gross}, less {ded} deductions · {days}",
      "pyo2.pr.daysN": "{n} of {all} days paid",
      "pyo2.pr.unitsN": "{n} units",
      "pyo2.pr.earn": "What is earned",
      "pyo2.pr.ded": "What comes off",
      "pyo2.pr.units": "Units",
      "pyo2.pr.gross": "Earned this month",
      "pyo2.pr.salary": "Monthly salary",
      "pyo2.pr.loan": "Loan or advance",
      "pyo2.pr.loan.none": "Nothing to pay back.",
      "pyo2.pr.loan.lent": "Lent",
      "pyo2.pr.loan.repaid": "Paid back",
      "pyo2.pr.loan.left": "Still owed",
      "pyo2.pr.loan.sched": "{paid} of {all} instalments paid.",
      "pyo2.pr.claims": "Reimbursements",
      "pyo2.pr.arrear": "Back pay",
      "pyo2.pr.arrear.sub": "Owed from an earlier month and paid with this one.",
      "pyo2.pr.wrong": "What needs doing",
      "pyo2.pr.asked.note": "Your note",
      "pyo2.pr.onRules": "See how this pay group pays",
      "pyo2.pr.onRecord": "Open the salary record",
      "pyo2.pr.est": "Worked out from the pay group's own parts.",
      "pyo2.pr.nothing": "No loan, no advance and no bill waiting.",

      /* ---- line labels ---- */
      "pyo2.l.LOAN": "Loan instalment",
      "pyo2.l.ARREAR": "Back pay",
      "pyo2.l.HON": "Honorarium",
      "pyo2.l.CLAIM": "Reimbursement",
      "pyo2.l.OT": "Overtime",
      "pyo2.l.ADVANCE": "Advance paid out",

      /* ---- send ---- */
      "pyo2.send": "Send to accountant",
      "pyo2.send.blocked": "{n} still need a fix",
      "pyo2.send.title": "Send to the accountant",
      "pyo2.send.body": "{n} people, {money} to pay. The accountant approves and releases it. You cannot change the run after this.",
      "pyo2.send.withHr": "{n} are still with HR. Anything they change lands in next month's run.",
      "pyo2.send.claims": "{n} approved bills, {money}, are not in this run.",
      "pyo2.send.go": "Send",
      "pyo2.send.done": "Sent to the accountant.",

      /* ---- held ---- */
      "pyo2.held.title": "Held back",
      "pyo2.held.sub": "Not in this month's payment.",

      /* ---- the manual run ---- */
      "pyo2.m.sub": "Naveya hands over every row. You fill it in, hand it back, and send.",
      "pyo2.m.s1": "Download the sheet",
      "pyo2.m.s1.body": "Every person on this run, one row each, with what Naveya already knows.",
      "pyo2.m.s1.go": "Download the sheet",
      "pyo2.m.s1.done": "Downloaded {d}. Download it again if you need a fresh copy.",
      "pyo2.m.s1.file": "{run}-staff.xlsx · {n} rows · {k} columns",
      "pyo2.m.cols": "Staff number · Name · Pay group · Days paid · Unpaid days · Monthly salary · Earned · Loan instalment · Bills · Deductions · Net pay",
      "pyo2.m.s2": "Upload the filled sheet",
      "pyo2.m.s2.body": "Change what you need to in the sheet. Do not add or remove rows, and do not change a staff number.",
      "pyo2.m.s2.hint": "A .xlsx or .csv saved from the sheet above.",
      "pyo2.m.s2.wait": "Download the sheet first.",
      "pyo2.m.s3": "Check what changed",
      "pyo2.m.s3.none": "Nothing changed. The run is exactly what Naveya worked out.",
      "pyo2.m.s3.n": "{n} rows are different from what Naveya worked out.",
      "pyo2.m.s3.again": "Upload a different sheet",
      "pyo2.m.col.was": "Naveya had",
      "pyo2.m.col.now": "Your sheet says",
      "pyo2.m.col.move": "Difference",
      "pyo2.m.col.why": "What changed",
      "pyo2.m.why.days": "Days paid",
      "pyo2.m.why.bill": "A bill added",
      "pyo2.m.why.loan": "Instalment skipped",
      "pyo2.m.total": "{n} rows",
      "pyo2.m.s4": "Send it to the accountant",
      "pyo2.m.s4.body": "The accountant approves and releases what the sheet says.",
      "pyo2.m.s4.wait": "Upload the filled sheet first.",
      "pyo2.m.rows": "What the sheet holds",
      "pyo2.m.readonly": "A manual run is read here and changed in the sheet.",
      "pyo2.m.uploaded": "Sheet uploaded.",
      "pyo2.m.downloaded": "Sheet downloaded.",
      "pyo2.m.cleared": "Upload cleared.",
    },
  });

  /* ============================================================
     0 · SHELL AND SMALL PIECES
     ============================================================ */
  function Shell({ role, onNavigate, back, children }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const L = G3.layout;
    return (
      <div className="nv3" style={{ display: "flex", minHeight: "100vh", background: c.page, color: c.ink, fontFamily: G3.font.ui }}>
        <Rail role={role || "payrollOfficer"} active="pyRun" onNavigate={onNavigate} initials="SK" />
        <main style={{ flex: 1, minWidth: 0, position: "relative", overflowX: "clip" }}>
          <Motif />
          <div style={{ position: "relative", zIndex: 1, maxWidth: L.contentMax, margin: "0 auto",
                        padding: "22px " + L.contentPadX + "px 56px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 14 }}>
              <p style={ty("caption", { margin: 0, color: c.inkFaint })}>
                <strong style={{ color: c.ink }}>{t("pyo2.crumb")}</strong> · {t("pyo2.entity")}
              </p>
              <ThemeToggle />
            </div>
            {back ? <div style={{ marginBottom: 16 }}><BackBar label={back.label} onBack={back.onBack} /></div> : null}
            {children}
          </div>
        </main>
      </div>
    );
  }

  function Flash({ said }) {
    const { c } = useTheme();
    const { ty } = useLang();
    if (!said) return null;
    return (
      <div role="status" aria-live="polite" style={{
        display: "flex", alignItems: "center", gap: 10, marginBottom: 16,
        background: c.presentTint, border: "1px solid " + c.border,
        borderRadius: G3.r.md, padding: "11px 15px",
      }}>
        <span aria-hidden="true" style={{ display: "flex", color: c.presentText }}><Icon name="check" size={15} /></span>
        <span style={ty("small", { color: c.presentText, fontWeight: 600 })}>{said}</span>
      </div>
    );
  }

  /* ONE FIGURE, AND THE SENTENCE THAT ACCOUNTS FOR IT.

     The only large number on a screen, with every other figure named
     under it in words. A row of equal figures makes the reader rank
     them; a headline and a sentence does the ranking for them. */
  function Headline({ label, value, line, children }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <Card>
        <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" })}>
          {label}
        </div>
        <div style={G3.fig("xl", { color: c.ink, fontWeight: 700, marginTop: 5, lineHeight: 1.1 })}>{value}</div>
        {line ? <div style={ty("small", { color: c.inkMuted, marginTop: 7 })}>{line}</div> : null}
        {children ? (
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid " + c.rule }}>{children}</div>
        ) : null}
      </Card>
    );
  }

  function stateMark(t, st) {
    if (st === "paid") return <StatusMark role="present" glyph="check" word={t("pyo2.st.paid")} />;
    if (st === "sent") return <StatusMark role="leave" glyph="lock" word={t("pyo2.st.sent")} />;
    return <StatusMark role="late" glyph="clock" word={t("pyo2.st.checking")} />;
  }

  function FilterChips({ items, at, onPick }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return items.map(function (x) {
      const on = at === x.k;
      return (
        <button
          key={x.k} type="button" aria-pressed={on ? "true" : "false"}
          onClick={function () { onPick(x.k); }}
          style={ty("caption", {
            border: "1px solid " + (on ? c.accent : c.border),
            background: on ? c.accentSoft : c.surface,
            color: on ? c.accent : c.inkMuted,
            borderRadius: G3.r.pill, padding: "7px 14px", cursor: "pointer",
            fontWeight: 600, display: "inline-flex", gap: 7, alignItems: "center", minHeight: 34,
          })}
        >
          {x.label}
          <span style={G3.fig("xs", { fontWeight: 700, color: x.tone === "alert" && x.n ? c.absentText : "inherit" })}>{num(x.n)}</span>
        </button>
      );
    });
  }

  function PeopleTable(props) {
    const { c } = useTheme();
    if (props.rows.length) return <Register {...props} />;
    return (
      <Card title={props.title} sub={props.sub} action={props.action}>
        {props.chips ? (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>{props.chips}</div>
        ) : null}
        <div style={{ borderTop: "1px solid " + c.rule, marginTop: 8, paddingTop: 8 }}>
          {props.empty}
        </div>
      </Card>
    );
  }

  function fmtD(d) {
    if (!d) return "";
    const M = ["", "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    return d.d + " " + M[d.m];
  }
  function fmtSince(t, iso) {
    if (!iso) return "—";
    const m = parseInt(String(iso).slice(5, 7), 10);
    const y = String(iso).slice(0, 4);
    const S2 = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return S2[m] + " " + y;
  }
  function fmtDay(iso) {
    if (!iso) return "—";
    const d = parseInt(String(iso).slice(8, 10), 10);
    const m = parseInt(String(iso).slice(5, 7), 10);
    const S2 = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return String(d) + " " + S2[m];
  }

  /* "1 bills" is the sort of thing a reader notices and a product
     never fixes, so it is fixed once, here */
  function bills(t, n) {
    return n === 1 ? t("pyo2.rc.total1") : t("pyo2.rc.total", { n: num(n) });
  }

  function issueWord(t, r) {
    if (!r.issue) return null;
    if (r.issue.kind === "lopUnexplained") return t("pyo2.i.lopUnexplained", { n: num(r.lop) });
    return t("pyo2.i." + r.issue.kind);
  }
  function askTopicKey(r) {
    return r.issue.kind === "lopUnexplained" ? "pyo2.i.lopUnexplained.plain" : "pyo2.i." + r.issue.kind;
  }

  function IssueLine({ r, mark }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    if (!r.issue) return null;
    if (mark && mark.state === "fixed") {
      return (
        <span style={ty("caption", { display: "inline-flex", alignItems: "center", gap: 5, color: c.presentText, marginTop: 3 })}>
          <span aria-hidden="true" style={{ display: "flex" }}><Icon name="check" size={12} /></span>
          {t("pyo2.fixed")}{mark.whatKey ? " · " + t(mark.whatKey) : ""}
        </span>
      );
    }
    if (mark && mark.state === "asked") {
      return (
        <span style={{ display: "block", marginTop: 3 }}>
          <span style={ty("caption", { display: "inline-flex", alignItems: "center", gap: 5, color: c.leaveText, fontWeight: 600 })}>
            <span aria-hidden="true" style={{ display: "flex" }}><Icon name="clock" size={12} /></span>
            {t("pyo2.asked")} · {t(mark.topicKey)}
          </span>
          {mark.note ? (
            <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 1 })}>
              &ldquo;{mark.note}&rdquo;
            </span>
          ) : null}
        </span>
      );
    }
    const hr = r.issue.owner === "hr";
    const tone = r.issue.blocks ? (hr ? c.absentText : c.lateText) : c.inkMuted;
    return (
      <span style={ty("caption", { display: "inline-flex", alignItems: "center", gap: 5, color: tone, marginTop: 3, fontWeight: 600 })}>
        <span aria-hidden="true" style={{ display: "flex" }}>
          <Icon name={r.issue.blocks ? "alert" : "clock"} size={12} />
        </span>
        {issueWord(t, r)}
        <span style={{ color: c.inkFaint, fontWeight: 500 }}>· {t(hr ? "pyo2.own.hr" : "pyo2.own.payroll")}</span>
      </span>
    );
  }

  /* ============================================================
     1 · THE PAY GROUPS

     They were chips that named a figure and did nothing; then cards
     that each carried their own money and their own meter, which put
     four more figures on a screen that already had four. They are a
     name and a count now -- a FILTER, in the same chips the people
     table uses -- and picking one re-points the one headline at that
     group. A group's money is shown where money lives: once.
     ============================================================ */
  /* ============================================================
     2 · THE PEOPLE
     ============================================================ */
  function PeopleTab({ roll, work, live, onPanel, onRecord, onSaid }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [filter, setFilter] = useState("all");
    const [q, setQ] = useState("");
    const [shown, setShown] = useState(PAGE);

    const openCount = roll.filter(function (r) { return ST.needsFix(r, work); }).length;
    const askedCount = roll.filter(function (r) {
      const mk = ST.settled(r, work); return mk && mk.state === "asked";
    }).length;

    const filtered = roll.filter(function (r) {
      const mk = ST.settled(r, work);
      if (filter === "fix" && !ST.needsFix(r, work)) return false;
      if (filter === "asked" && !(mk && mk.state === "asked")) return false;
      if (filter === "ready" && (ST.needsFix(r, work) || (mk && mk.state === "asked"))) return false;
      if (q && (r.name + " " + r.id).toLowerCase().indexOf(q.toLowerCase()) === -1) return false;
      return true;
    });
    const page = filtered.slice(0, shown);
    const tot = ST.runTotals(roll, work);

    const rows = page.map(function (r) {
      const mk = ST.settled(r, work);
      const p = ST.priced(r, work);
      const items = [];
      if (live && r.issue && !mk) {
        if (r.issue.owner === "hr") items.push({ key: "ask", icon: "arrow", label: t("pyo2.a.ask"), onSelect: function () { onPanel({ kind: "ask", r: r }); } });
        else items.push({ key: "fix", icon: "check", label: t("pyo2.a.fix"), onSelect: function () { onPanel({ kind: "fix", r: r }); } });
      }
      if (live && mk && mk.state === "asked") items.push({ key: "remind", icon: "clock", label: t("pyo2.a.remind"), onSelect: function () { onSaid(t("pyo2.ask.done", { name: r.name })); } });
      items.push({ key: "rec", icon: "document", label: t("pyo2.a.record"), onSelect: function () { onRecord(r.id); } });

      return {
        id: r.id,
        tone: mk && mk.state === "asked" ? "dim" : null,
        cells: {
          who: (
            <span style={{ display: "block", minWidth: 0 }}>
              <span style={ty("small", { display: "block", color: c.ink, fontWeight: 700 })}>{r.name}</span>
              <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 1 })}>
                {r.id} · {t(r.desigKey)}
              </span>
              {live ? <IssueLine r={r} mark={mk} /> : null}
            </span>
          ),
          group: t(r.groupNameKey),
          days: r.group === "visit" ? num(r.units) + "u" : num(r.days) + "/" + num(R.MONTH_DAYS),
          gross: inr(r.gross),
          ded: inr(r.ded),
          net: inr(p.net),
          act: <ActionMenu size={30} ariaLabel={r.name} items={items} />,
        },
      };
    });

    const chips = [
      { k: "all", label: t("pyo2.f.all"), n: roll.length },
      { k: "fix", label: t("pyo2.f.fix"), n: openCount, tone: "alert" },
      { k: "asked", label: t("pyo2.f.asked"), n: askedCount },
      { k: "ready", label: t("pyo2.f.ready"), n: roll.length - openCount - askedCount },
    ];

    return (
      <PeopleTable
        title={t("pyo2.who")}
        empty={<EmptyState head={t("pyo2.none.head")} body={t("pyo2.none.body")} />}
        action={
          <div style={{ width: 230 }}>
            <Input id="pyo2-q" value={q} onChange={function (v) { setQ(v); setShown(PAGE); }} placeholder={t("pyo2.search")} size="sm" />
          </div>
        }
        chips={!live ? null : <FilterChips items={chips} at={filter} onPick={function (k) { setFilter(k); setShown(PAGE); }} />}
        columns={[
          { key: "who", label: t("pyo2.col.staff") },
          { key: "group", label: t("pyo2.col.group"), width: 175 },
          { key: "days", label: t("pyo2.col.days"), align: "right", mono: true, width: 95 },
          { key: "gross", label: t("pyo2.col.month"), align: "right", mono: true, width: 145 },
          { key: "ded", label: t("pyo2.col.ded"), align: "right", mono: true, width: 140 },
          { key: "net", label: t("pyo2.col.net"), align: "right", mono: true, width: 155, weight: 700 },
          { key: "act", label: "", align: "right", width: 52 },
        ]}
        rows={rows}
        totals={filtered.length === roll.length ? {
          label: t("pyo2.total", { n: num(roll.length) }),
          cells: { gross: inr(tot.gross), ded: inr(tot.rawDed), net: inr(tot.net + tot.held) },
        } : null}
        footer={
          page.length < filtered.length ? (
            <React.Fragment>
              <span style={ty("caption", { color: c.inkFaint })}>
                {t("pyo2.showing", { a: num(page.length), b: num(filtered.length) })}
              </span>
              <Button size="sm" onClick={function () { setShown(shown + PAGE); }}>
                {t("pyo2.more", { n: num(Math.min(PAGE, filtered.length - page.length)) })}
              </Button>
            </React.Fragment>
          ) : null
        }
      />
    );
  }

  /* ============================================================
     3 · LOANS AND ADVANCES
     ============================================================ */
  function LoansTab({ roll, month, work, live, onPanel, onRecord, onUndo, onOpenModule }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const L = G3.layout;
    const [q, setQ] = useState("");

    const list = roll.filter(function (r) { return r.loan; })
      .sort(function (a, b) { return b.loan.balance - a.loan.balance; });

    const filtered = list.filter(function (r) {
      return !q || (r.name + " " + r.id).toLowerCase().indexOf(q.toLowerCase()) !== -1;
    });

    let monthOff = 0, owed = 0, lent = 0, advOwed = 0, advN = 0;
    list.forEach(function (r) {
      const w = work.loans[r.id];
      monthOff += w === "skip" ? 0 : w === "settle" ? r.loan.balance : r.loan.emi;
      owed += r.loan.balance; lent += r.loan.principal;
      if (r.loan.kind === "advance") { advOwed += r.loan.balance; advN += 1; }
    });
    const ids = {};
    roll.forEach(function (r) { ids[r.id] = r; });
    const fresh = work.advances.filter(function (a) {
      return ids[a.staffId] && (!q || (a.name + " " + a.staffId).toLowerCase().indexOf(q.toLowerCase()) !== -1);
    });
    const paidOut = fresh.reduce(function (s, a) { return s + a.amount; }, 0);
    /* an advance paid out in THIS run is recovered from the next one:
       the salary it was taken before */
    const nextMonth = month >= 12 ? 1 : month + 1;

    const freshRows = fresh.map(function (a) {
      const row = ids[a.staffId];
      return {
        id: "new-" + a.staffId,
        cells: {
          who: (
            <span style={{ display: "block", minWidth: 0 }}>
              <span style={ty("small", { display: "block", color: c.ink, fontWeight: 700 })}>{a.name}</span>
              <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 1 })}>{a.staffId}</span>
            </span>
          ),
          group: row ? t(row.groupNameKey) : "—",
          what: (
            <span style={{ display: "block" }}>
              <span style={ty("small", { display: "block", color: c.ink, fontWeight: 600 })}>{t("pyo2.ln.kind.advance")}</span>
              <span style={ty("caption", { display: "block", color: c.inkFaint })}>
                {t(a.whyKey)} · <span style={{ color: c.presentText, fontWeight: 600 }}>{t("pyo2.ln.st.new")}</span>
              </span>
            </span>
          ),
          lent: inr(a.amount),
          repaid: <span style={G3.fig("xs", { color: c.inkFaint, fontWeight: 600 })}>{num(0)}/{num(a.months)}</span>,
          left: inr(a.amount),
          month: (
            <span style={{ display: "block" }}>
              <span style={G3.fig("sm", { display: "block", color: c.ink, fontWeight: 700 })}>+{inr(a.amount)}</span>
              <span style={ty("caption", { display: "block", color: c.inkFaint })}>
                {t("pyo2.ln.f.from", { mon: t("pyr.mon." + nextMonth), emi: inr(a.emi) })}
              </span>
            </span>
          ),
          act: (
            <ActionMenu size={30} ariaLabel={a.name} items={[
              { key: "undo", icon: "arrow", label: t("pyo2.a.undo"), onSelect: function () { onUndo("advance", a.staffId); } },
              { key: "rec", icon: "document", label: t("pyo2.a.record"), onSelect: function () { onRecord(a.staffId); } },
            ]} />
          ),
        },
      };
    });

    const rows = freshRows.concat(filtered.map(function (r) {
      const l = r.loan;
      const w = work.loans[r.id];
      const items = [];
      if (live && !w) {
        items.push({ key: "skip", icon: "clock", label: t("pyo2.ln.a.skip"), onSelect: function () { onPanel({ kind: "skip", r: r }); } });
        items.push({ key: "settle", icon: "check", label: t("pyo2.ln.a.settle"), onSelect: function () { onPanel({ kind: "settle", r: r }); } });
      }
      if (live && w) items.push({ key: "undo", icon: "arrow", label: t("pyo2.a.undo"), onSelect: function () { onUndo("loan", r.id); } });
      items.push({ key: "rec", icon: "document", label: t("pyo2.a.record"), onSelect: function () { onRecord(r.id); } });
      return {
        id: l.id,
        tone: w ? "dim" : null,
        cells: {
          who: (
            <span style={{ display: "block", minWidth: 0 }}>
              <span style={ty("small", { display: "block", color: c.ink, fontWeight: 700 })}>{r.name}</span>
              <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 1 })}>{r.id} · {l.id}</span>
            </span>
          ),
          group: t(r.groupNameKey),
          what: (
            <span style={{ display: "block" }}>
              <span style={ty("small", { display: "block", color: c.ink, fontWeight: 600 })}>{t("pyo2.ln.kind." + l.kind)}</span>
              <span style={ty("caption", { display: "block", color: c.inkFaint })}>{t(l.purposeKey)} · {fmtSince(t, l.since)}</span>
            </span>
          ),
          lent: inr(l.principal),
          repaid: (
            <span style={{ display: "block" }}>
              <span style={G3.fig("xs", { display: "block", color: c.inkMuted, fontWeight: 600 })}>
                {num(l.paid)}/{num(l.tenure)}
              </span>
              <span style={{ display: "block", marginTop: 4 }}>
                <Meter frac={l.tenure ? l.paid / l.tenure : 0} bar={c.chartTeal} track={c.sunken} height={5} />
              </span>
            </span>
          ),
          left: inr(l.balance),
          month: w === "skip"
            ? <StatusMark role="off" glyph="clock" word={t("pyo2.ln.st.skipped")} />
            : w === "settle"
              ? <span style={G3.fig("sm", { color: c.ink, fontWeight: 700 })}>{inr(l.balance)}</span>
              : (
                <span style={{ display: "block" }}>
                  <span style={G3.fig("sm", { display: "block", color: c.ink, fontWeight: 600 })}>{inr(l.emi)}</span>
                  <span style={ty("caption", { display: "block", color: l.left === 1 ? c.lateText : c.inkFaint, fontWeight: l.left === 1 ? 600 : 500 })}>
                    {l.left === 1 ? t("pyo2.ln.last") : t("pyo2.ln.left", { n: num(l.left) })}
                  </span>
                </span>
              ),
          act: <ActionMenu size={30} ariaLabel={r.name} items={items} />,
        },
      };
    }));

    /* MONEY BACK AND MONEY OUT ARE NOT ONE FIGURE (designer). The
       two share a bar because they are the same unit in the same
       run, and reading one against the other is the whole question
       an officer has on this step. What is still owed, and how many
       people owe it, belong to no run and take no band. */
    const facts = [
      { k: "back", label: t("pyo2.ln.f2.back"), value: inr(monthOff), n: Math.round(monthOff),
        note: list.length ? t("pyo2.ln.f2.backNote", { n: num(list.length) }) : t("pyo2.ln.f2.backNone"),
        tone: c.chartGreen },
      { k: "out", label: t("pyo2.ln.f2.out"), value: inr(paidOut), n: Math.round(paidOut),
        note: fresh.length
          ? t("pyo2.ln.f2.outNote", { n: num(fresh.length), mon: t("pyr.mon." + nextMonth) })
          : t("pyo2.ln.f2.outNone"),
        tone: c.chartAmber, warn: fresh.length > 0 },
      { k: "owed", label: t("pyo2.ln.f2.owed"), value: inr(owed + paidOut), bar: false,
        note: t("pyo2.ln.f2.owedNote", { n: num(list.length + fresh.length) }), tone: c.chartBlue },
      { k: "adv", label: t("pyo2.ln.f2.adv"), value: num(advN + fresh.length), bar: false,
        note: advN + fresh.length ? t("pyo2.ln.f2.advNote", { v: inr(advOwed) }) : t("pyo2.ln.f2.advNone"),
        tone: c.chartTeal },
    ];

    return (
      <div>
        <Band metrics={facts} foot={t("pyo2.ln.f2.foot")} />

        <PeopleTable
          title={t("pyo2.ln.title")}
          sub={t("pyo2.ln.sub", { n: num(list.length + fresh.length) })}
          empty={<EmptyState head={t("pyo2.ln.none.head")} body={t("pyo2.ln.none.body")} />}
          action={
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ width: 200 }}>
                <Input id="pyo2-lq" value={q} onChange={setQ} placeholder={t("pyo2.search")} size="sm" />
              </div>
              {live ? (
                <Button size="sm" iconLeft="plus" onClick={function () { onPanel({ kind: "advance" }); }}>
                  {t("pyo2.ln.new")}
                </Button>
              ) : null}
              <LinkButton onClick={function () { onOpenModule("pyAdjust"); }}>{t("pyo2.ln.all")}</LinkButton>
            </div>
          }
          columns={[
            { key: "who", label: t("pyo2.col.staff") },
            { key: "group", label: t("pyo2.col.group"), width: 150 },
            { key: "what", label: t("pyo2.ln.col.what"), width: 165 },
            { key: "lent", label: t("pyo2.ln.col.lent"), align: "right", mono: true, width: 125 },
            { key: "repaid", label: t("pyo2.ln.col.repaid"), align: "right", width: 115 },
            { key: "left", label: t("pyo2.ln.col.left"), align: "right", mono: true, width: 125 },
            { key: "month", label: t("pyo2.ln.col.month"), align: "right", width: 135 },
            { key: "act", label: "", align: "right", width: 52 },
          ]}
          rows={rows}
          totals={filtered.length === list.length ? {
            label: t("pyo2.ln.total", { n: num(list.length + fresh.length) }),
            cells: {
              lent: inr(lent + paidOut), left: inr(owed + paidOut),
              month: <span style={G3.fig("md", { fontWeight: 700 })}>{inr(monthOff)}</span>,
            },
          } : null}
        />
      </div>
    );
  }

  /* ============================================================
     4 · REIMBURSEMENTS

     A bill that has already missed one payday is LATE, and late is
     the one state on this screen that is a fault rather than a stage,
     so it is the one that is red. The officer has two answers to it,
     not one: pay it now, or put it in the next run on purpose. Having
     only the first made "move it on" look like something the product
     forbade, when it is a decision schools take every month.
     ============================================================ */
  function claimTone(c, st) {
    if (st === "in") return { role: "present", glyph: "check", colour: c.presentText };
    if (st === "held") return { role: "leave", glyph: "arrow", colour: c.leaveText };
    if (st === "due") return { role: "absent", glyph: "alert", colour: c.absentText };
    if (st === "not") return { role: "off", glyph: "clock", colour: c.inkFaint };
    return { role: "late", glyph: "clock", colour: c.lateText };
  }

  function ClaimsTab({ roll, month, work, live, onClaim, onPayAll, onRecord, onUndo, onOpenModule }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [only, setOnly] = useState("all");

    const list = [];
    roll.forEach(function (r) {
      (r.claims || []).forEach(function (cl) {
        if (cl.approvedMonth > month) return;
        list.push({ row: r, c: cl });
      });
    });
    list.sort(function (a, b) {
      if (a.c.overdue !== b.c.overdue) return a.c.overdue ? -1 : 1;
      return b.c.v - a.c.v;
    });

    function lateHere(cl) { return cl.approvedMonth < month; }
    function stOf(cl) { return live ? ST.claimState(work, cl) : "not"; }

    let inRun = 0, waiting = 0, waitN = 0, due = 0, dueN = 0, next = 0, nextN = 0;
    list.forEach(function (x) {
      const st = stOf(x.c);
      if (st === "in") inRun += x.c.v;
      else if (st === "held") { next += x.c.v; nextN += 1; }
      else {
        waiting += x.c.v; waitN += 1;
        if (lateHere(x.c)) { due += x.c.v; dueN += 1; }
      }
    });

    const filtered = list.filter(function (x) {
      const st = stOf(x.c);
      if (only === "due") return st === "due";
      if (only === "in") return st === "in";
      if (only === "next") return st === "held";
      return true;
    });

    const rows = filtered.map(function (x) {
      const r = x.row, cl = x.c;
      const st = stOf(cl);
      const tone = claimTone(c, st);
      const items = [];
      if (live && (st === "due" || st === "ready")) {
        items.push({ key: "pay", icon: "check", label: t("pyo2.rc.a.pay"), onSelect: function () { onClaim(cl, r, "in"); } });
        /* a late bill may be moved on too -- deliberately, and on the
           record, which is different from being forgotten */
        items.push({ key: "hold", icon: "arrow", label: t("pyo2.rc.a.hold"), onSelect: function () { onClaim(cl, r, "held"); } });
      }
      if (live && (st === "in" || st === "held")) items.push({ key: "undo", icon: "arrow", label: t("pyo2.a.undo"), onSelect: function () { onUndo("claim", cl.id); } });
      items.push({ key: "rec", icon: "document", label: t("pyo2.a.record"), onSelect: function () { onRecord(r.id); } });
      return {
        id: cl.id,
        tone: st === "held" || st === "not" ? "dim" : null,
        cells: {
          who: (
            <span style={{ display: "block", minWidth: 0 }}>
              <span style={ty("small", { display: "block", color: c.ink, fontWeight: 700 })}>{r.name}</span>
              <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 1 })}>{r.id} · {cl.id}</span>
            </span>
          ),
          group: t(r.groupNameKey),
          what: (
            <span style={{ display: "block" }}>
              <span style={ty("small", { display: "block", color: c.ink, fontWeight: 600 })}>{cl.catKey ? t(cl.catKey) : "—"}</span>
              <span style={ty("caption", { display: "block", color: c.inkFaint })}>{cl.taxKey ? t(cl.taxKey) : ""}</span>
            </span>
          ),
          when: (
            <span style={ty("small", { color: lateHere(cl) && st !== "in" ? c.absentText : c.inkMuted, fontWeight: lateHere(cl) ? 600 : 500 })}>
              {fmtDay(cl.approvedIso)}
            </span>
          ),
          amount: <span style={G3.fig("sm", { color: c.ink, fontWeight: 600 })}>{inr(cl.v)}</span>,
          state: <StatusMark role={tone.role} glyph={tone.glyph} word={t("pyo2.rc.st." + st)} />,
          act: <ActionMenu size={30} ariaLabel={r.name} items={items} />,
        },
      };
    });

    const chips = [
      { k: "all", label: t("pyo2.rc.ch.all"), n: list.length },
      { k: "due", label: t("pyo2.rc.f.due"), n: dueN, tone: "alert" },
      { k: "in", label: t("pyo2.rc.f.in"), n: list.filter(function (x) { return stOf(x.c) === "in"; }).length },
      { k: "next", label: t("pyo2.rc.f.next"), n: nextN },
    ];

    return (
      <div>
        <PeopleTable
          title={t("pyo2.rc.title")}
          sub={t("pyo2.rc.line", { money: inr(waiting), n: num(waitN) })
            + (inRun ? " · " + t("pyo2.rc.lineIn", { money: inr(inRun) }) : "")
            + (next ? " · " + t("pyo2.rc.lineNext", { money: inr(next) }) : "")
            + (!live && list.length ? " · " + t("pyo2.rc.closedNote") : "")}
          empty={<EmptyState head={t("pyo2.rc.none.head")} body={t("pyo2.rc.none.body")} />}
          action={
            <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
              {live && dueN ? (
                <Button size="sm" kind="primary" iconLeft="check" onClick={onPayAll}>
                  {t("pyo2.rc.payAll", { n: num(dueN) })}
                </Button>
              ) : null}
              <LinkButton onClick={function () { onOpenModule("pyAdjust"); }}>{t("pyo2.rc.all")}</LinkButton>
            </div>
          }
          chips={<FilterChips items={chips} at={only} onPick={setOnly} />}
          columns={[
            { key: "who", label: t("pyo2.col.staff") },
            { key: "group", label: t("pyo2.col.group"), width: 150 },
            { key: "what", label: t("pyo2.rc.col.what"), width: 185 },
            { key: "when", label: t("pyo2.rc.col.when"), width: 110 },
            { key: "amount", label: t("pyo2.rc.col.amount"), align: "right", width: 125 },
            { key: "state", label: t("pyo2.rc.col.state"), width: 175 },
            { key: "act", label: "", align: "right", width: 52 },
          ]}
          rows={rows}
          totals={filtered.length === list.length && list.length ? {
            label: bills(t, list.length),
            cells: { amount: <span style={G3.fig("md", { fontWeight: 700 })}>{inr(list.reduce(function (s, x) { return s + x.c.v; }, 0))}</span> },
          } : null}
        />
      </div>
    );
  }

  /* ============================================================
     4b · OVERTIME

     Hours are HR's: they verify them against the device roll and
     this screen does not edit them. The rate and the multiple are
     the statutory ones. What is left for the officer is the only
     question a run can answer -- which payday it goes on.
     ============================================================ */
  function OvertimeTab({ roll, work, live, onOt, onRecord, onUndo, onOpenModule }) {
    const { c } = useTheme();
    const { t, ty } = useLang();

    const list = [];
    roll.forEach(function (r) {
      (r.overtime || []).forEach(function (o) { if (o.state !== "declined") list.push({ row: r, o: o }); });
    });
    list.sort(function (a, b) { return (b.o.value || 0) - (a.o.value || 0); });

    function stOf(o) { return live ? ST.otState(work, o) : "not"; }

    let waiting = 0, waitN = 0, inRun = 0, next = 0, elsewhere = 0;
    list.forEach(function (x) {
      const st = stOf(x.o);
      const v = x.o.value || 0;
      if (st === "in") inRun += v;
      else if (st === "held") next += v;
      else if (st === "paid" || st === "booked") elsewhere += v;
      else { waiting += v; waitN += 1; }
    });

    const rows = list.map(function (x) {
      const r = x.row, o = x.o;
      const st = stOf(o);
      const tone = st === "in" || st === "paid" ? { role: "present", glyph: "check" }
        : st === "held" || st === "booked" ? { role: "leave", glyph: "arrow" }
          : st === "withHr" || st === "not" ? { role: "off", glyph: "clock" }
            : { role: "late", glyph: "clock" };
      const items = [];
      if (live && st === "ready" && o.value != null) {
        items.push({ key: "pay", icon: "check", label: t("pyo2.ot.a.pay"), onSelect: function () { onOt(o, r, "in"); } });
        items.push({ key: "hold", icon: "arrow", label: t("pyo2.ot.a.hold"), onSelect: function () { onOt(o, r, "held"); } });
      }
      if (live && (st === "in" || st === "held")) {
        items.push({ key: "undo", icon: "arrow", label: t("pyo2.a.undo"), onSelect: function () { onUndo("ot", o.id); } });
      }
      items.push({ key: "rec", icon: "document", label: t("pyo2.a.record"), onSelect: function () { onRecord(r.id); } });
      return {
        id: o.id,
        tone: st === "held" || st === "not" || st === "withHr" ? "dim" : null,
        cells: {
          who: (
            <span style={{ display: "block", minWidth: 0 }}>
              <span style={ty("small", { display: "block", color: c.ink, fontWeight: 700 })}>{r.name}</span>
              <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 1 })}>{r.id} · {o.id}</span>
            </span>
          ),
          group: t(r.groupNameKey),
          when: <span style={ty("small", { color: c.inkMuted })}>{t(o.periodKey)}</span>,
          hours: num(o.hours) + " h",
          rate: o.hourly == null
            ? <span style={ty("caption", { color: c.absentText, fontWeight: 600 })}>{t("pyo2.ot.noRate")}</span>
            : <span style={ty("caption", { color: c.inkMuted })}>{t("pyo2.ot.rate", { rate: inr(o.hourly), mult: String(o.multiple) })}</span>,
          pay: o.value == null ? "—" : <span style={G3.fig("sm", { color: c.ink, fontWeight: 600 })}>{inr(o.value)}</span>,
          state: (
            <span style={{ display: "block" }}>
              <StatusMark role={tone.role} glyph={tone.glyph} word={t("pyo2.ot.st." + st)} />
              {(st === "paid" || st === "booked") && o.batch ? (
                <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 3 })}>{o.batch}</span>
              ) : null}
            </span>
          ),
          act: <ActionMenu size={30} ariaLabel={r.name} items={items} />,
        },
      };
    });

    return (
      <PeopleTable
        title={t("pyo2.ot.title")}
        sub={(!waitN ? t("pyo2.ot.lineNone")
          : waitN === 1 ? t("pyo2.ot.line1", { money: inr(waiting) })
            : t("pyo2.ot.line", { money: inr(waiting), n: num(waitN) }))
          + (inRun ? " \u00b7 " + t("pyo2.ot.lineIn", { money: inr(inRun) }) : "")
          + (next ? " \u00b7 " + t("pyo2.ot.lineNext", { money: inr(next) }) : "")
          + (elsewhere ? " \u00b7 " + t("pyo2.ot.lineElse", { money: inr(elsewhere) }) : "")}
        empty={<EmptyState head={t("pyo2.ot.none.head")} body={t("pyo2.ot.none.body")} />}
        action={<LinkButton onClick={function () { onOpenModule("pyAdjust"); }}>{t("pyo2.ot.all")}</LinkButton>}
        columns={[
          { key: "who", label: t("pyo2.col.staff") },
          { key: "group", label: t("pyo2.col.group"), width: 150 },
          { key: "when", label: t("pyo2.ot.col.for"), width: 135 },
          { key: "hours", label: t("pyo2.ot.col.hours"), align: "right", mono: true, width: 95 },
          { key: "rate", label: t("pyo2.ot.col.rate"), align: "right", width: 150 },
          { key: "pay", label: t("pyo2.ot.col.pay"), align: "right", width: 125 },
          { key: "state", label: t("pyo2.rc.col.state"), width: 150 },
          { key: "act", label: "", align: "right", width: 52 },
        ]}
        rows={rows}
        totals={list.length ? {
          label: t("pyo2.total", { n: num(list.length) }),
          cells: {
            hours: num(list.reduce(function (s, x) { return s + x.o.hours; }, 0)) + " h",
            pay: <span style={G3.fig("md", { fontWeight: 700 })}>{inr(list.reduce(function (s, x) { return s + (x.o.value || 0); }, 0))}</span>,
          },
        } : null}
        footer={<span style={ty("caption", { color: c.inkFaint })}>{t("pyo2.ot.why")}</span>}
      />
    );
  }

  /* ============================================================
     4c · APPRAISAL RISES

     The one list on this screen that is NOT money in this run. A
     rise changes what somebody is on, from a date, and every salary
     in the table above already carries it -- so showing it here as a
     figure to add would pay it twice. It is here because the officer
     is asked "why did payroll go up", and this is the answer.
     ============================================================ */
  function RisesTab({ roll, onRecord, onOpenModule }) {
    const { c } = useTheme();
    const { t, ty } = useLang();

    const list = [];
    roll.forEach(function (r) {
      (r.rises || []).forEach(function (p) { list.push({ row: r, p: p }); });
    });
    list.sort(function (a, b) { return (b.p.to || 0) - (a.p.to || 0); });

    const rows = list.map(function (x) {
      const r = x.row, p = x.p;
      const st = p.state === "declined" ? "declined" : p.settled ? "settled" : "waiting";
      return {
        id: p.id,
        tone: st === "declined" ? "dim" : null,
        cells: {
          who: (
            <span style={{ display: "block", minWidth: 0 }}>
              <span style={ty("small", { display: "block", color: c.ink, fontWeight: 700 })}>{r.name}</span>
              <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 1 })}>{r.id} · {p.id}</span>
            </span>
          ),
          group: t(r.groupNameKey),
          pct: <span style={G3.fig("sm", { color: c.ink, fontWeight: 700 })}>+{p.pct}%</span>,
          from: inr(p.from),
          to: p.to == null ? "—" : <span style={G3.fig("sm", { color: c.ink, fontWeight: 600 })}>{inr(p.to)}</span>,
          when: p.effectiveFrom
            ? <span style={ty("small", { color: c.inkMuted })}>{fmtD(p.effectiveFrom)}</span>
            : "—",
          state: st === "settled"
            ? <StatusMark role="present" glyph="check" word={t("pyo2.ri.st.settled")} />
            : st === "declined"
              ? <StatusMark role="absent" glyph="alert" word={t("pyo2.ri.st.declined")} />
              : <StatusMark role="late" glyph="clock" word={t("pyo2.ri.st.waiting")} />,
          act: (
            <ActionMenu size={30} ariaLabel={r.name} items={[
              { key: "rec", icon: "document", label: t("pyo2.a.record"), onSelect: function () { onRecord(r.id); } },
            ]} />
          ),
        },
      };
    });

    return (
      <PeopleTable
        title={t("pyo2.ri.title")}
        sub={!list.length ? t("pyo2.ri.lineNone")
          : list.length === 1 ? t("pyo2.ri.line1")
            : t("pyo2.ri.line", { n: num(list.length) })}
        empty={<EmptyState head={t("pyo2.ri.none.head")} body={t("pyo2.ri.none.body")} />}
        action={<LinkButton onClick={function () { onOpenModule("pyPeople"); }}>{t("pyo2.ri.all")}</LinkButton>}
        columns={[
          { key: "who", label: t("pyo2.col.staff") },
          { key: "group", label: t("pyo2.col.group"), width: 160 },
          { key: "pct", label: t("pyo2.ri.col.rise"), align: "right", width: 100 },
          { key: "from", label: t("pyo2.ri.col.from"), align: "right", mono: true, width: 140 },
          { key: "to", label: t("pyo2.ri.col.to"), align: "right", width: 145 },
          { key: "when", label: t("pyo2.ri.col.when"), width: 140 },
          { key: "state", label: t("pyo2.rc.col.state"), width: 150 },
          { key: "act", label: "", align: "right", width: 52 },
        ]}
        rows={rows}
        footer={<span style={ty("caption", { color: c.inkFaint })}>{t("pyo2.ri.why")}</span>}
      />
    );
  }

  /* ============================================================
     5 · ONE PERSON'S MONTH
     ============================================================ */
  function Line({ label, how, value, strong, rule }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div style={{
        display: "flex", alignItems: "baseline", gap: 14, padding: "10px 0",
        borderTop: rule ? "1px solid " + c.rule : "none",
      }}>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={ty("small", { display: "block", color: c.ink, fontWeight: strong ? 700 : 500 })}>{label}</span>
          {how ? <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 1 })}>{how}</span> : null}
        </span>
        <span style={G3.fig(strong ? "md" : "sm", { color: c.ink, fontWeight: strong ? 700 : 600, whiteSpace: "nowrap" })}>{value}</span>
      </div>
    );
  }

  function earnLines(t, r) {
    const out = [];
    if (r.group === "visit") {
      out.push({ label: t("pyo2.l.HON"), how: r.units ? t("pyo2.pr.units") + " " + num(r.units) : null, v: r.gross - (r.arrear || 0) });
    } else if (S) {
      const g = S.groupByKey(r.group);
      const struct = g && g.structure ? S.structByKey(g.structure) : null;
      const base = r.gross - (r.arrear || 0);
      if (struct && base > 0) {
        const basic = Math.round((base * 5) / 12);
        const lines = S.priceComponents(struct, basic, base).map(function (ln) {
          return { label: t("pys3.c." + ln.code), v: Math.round(ln.v), balance: ln.cp.calc === "balance" };
        });
        let rest = base;
        lines.forEach(function (ln) { if (!ln.balance) rest -= ln.v; });
        const bal = lines.filter(function (ln) { return ln.balance; })[0] || lines[lines.length - 1];
        if (bal) bal.v = bal.balance ? rest : bal.v + (base - lines.reduce(function (a, x) { return a + x.v; }, 0));
        lines.forEach(function (ln) { out.push({ label: ln.label, v: ln.v }); });
      } else if (base > 0) {
        out.push({ label: t("pyo2.pr.gross"), v: base });
      }
    }
    if (r.arrear) out.push({ label: t("pyo2.l.ARREAR"), v: r.arrear });
    return out;
  }

  function dedLines(t, r, loanOff) {
    const out = [];
    const stat = r.ded - (r.loan ? r.loan.emi : 0);
    let codes = [];
    if (D) {
      for (let i = 0; i < D.GROUPS.length; i++) {
        if (D.GROUPS[i].key !== r.group) continue;
        codes = D.GROUPS[i].ded.filter(function (l) { return l.code !== "LOAN"; });
      }
    }
    const sum = codes.reduce(function (s, l) { return s + l.v; }, 0) || 1;
    let acc = 0;
    codes.forEach(function (l, i) {
      const v = i === codes.length - 1 ? stat - acc : Math.round((stat * l.v) / sum);
      acc += v;
      if (v > 0) out.push({ label: t("pys3.c." + l.code), v: v });
    });
    if (loanOff > 0) out.push({ label: t("pyo2.l.LOAN"), v: loanOff });
    return out;
  }

  function PayRecord({ r, month, work, live, onPanel, onClaim, onUndo, onNavigate }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const L = G3.layout;
    const p = ST.priced(r, work);
    const mk = ST.settled(r, work);
    const loanOff = r.loan ? (p.loanWork === "skip" ? 0 : p.loanWork === "settle" ? r.loan.balance : r.loan.emi) : 0;
    const earn = earnLines(t, r);
    const ded = dedLines(t, r, loanOff);
    const extraEarn = [];
    (r.claims || []).forEach(function (cl) {
      if (work.claims[cl.id] === "in") extraEarn.push({ label: t("pyo2.l.CLAIM") + " · " + t(cl.catKey), v: cl.v });
    });
    (r.overtime || []).forEach(function (o) {
      if (work.ot && work.ot[o.id] === "in") extraEarn.push({ label: t("pyo2.l.OT") + " · " + num(o.hours) + " h", v: o.value });
    });
    work.advances.forEach(function (a) {
      if (a.staffId === r.id) extraEarn.push({ label: t("pyo2.l.ADVANCE"), v: a.amount });
    });
    const known = S && S.staffById && S.staffById(r.id);

    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18, flexWrap: "wrap" }}>
          <Avatar name={r.name} size={46} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1 style={ty("h1", { margin: "0 0 5px", color: c.ink })}>{r.name}</h1>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <Chip bg={c.sunken} fg={c.inkMuted} mono>{r.id}</Chip>
              <Chip bg={c.sunken} fg={c.inkMuted}>{t(r.desigKey)}</Chip>
              <Chip bg={c.sunken} fg={c.inkMuted}>{t(r.groupNameKey)}</Chip>
            </div>
          </div>
        </div>

        {live && r.issue ? (
          <div style={{ marginBottom: L.gap }}>
            <Card title={t("pyo2.pr.wrong")}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <span style={{ flex: 1, minWidth: 220 }}><IssueLine r={r} mark={mk} /></span>
                {!mk ? (
                  r.issue.owner === "hr" ? (
                    <Button size="sm" iconLeft="arrow" onClick={function () { onPanel({ kind: "ask", r: r }); }}>{t("pyo2.a.ask")}</Button>
                  ) : (
                    <Button size="sm" kind="primary" iconLeft="check" onClick={function () { onPanel({ kind: "fix", r: r }); }}>{t("pyo2.a.fix")}</Button>
                  )
                ) : null}
              </div>
              {mk && mk.state === "asked" && mk.note ? (
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid " + c.rule }}>
                  <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" })}>
                    {t("pyo2.pr.asked.note")}
                  </div>
                  <p style={ty("small", { color: c.ink, margin: "5px 0 0" })}>{mk.note}</p>
                </div>
              ) : null}
            </Card>
          </div>
        ) : null}

        <Headline
          label={t("pyo2.pr.take")}
          value={inr(p.net)}
          line={t("pyo2.pr.line", {
            gross: inr(r.gross + p.claimIn + p.advance + p.otIn),
            ded: inr(r.ded - (r.loan ? r.loan.emi : 0) + loanOff),
            days: r.group === "visit"
              ? t("pyo2.pr.unitsN", { n: num(r.units) })
              : t("pyo2.pr.daysN", { n: num(r.days), all: num(R.MONTH_DAYS) }),
          })}
        />

        <div style={{ height: L.gap }} />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: L.gap, alignItems: "start" }}>
          <Card title={t("pyo2.pr.earn")} sub={t("pyo2.pr.est")}>
            {earn.map(function (ln, i) {
              return <Line key={ln.label + i} label={ln.label} how={ln.how} value={inr(ln.v)} rule={i > 0} />;
            })}
            {extraEarn.map(function (ln, i) {
              return <Line key={"x" + i} label={ln.label} value={inr(ln.v)} rule />;
            })}
            <div style={{ borderTop: "2px solid " + c.ruleStrong, marginTop: 4 }}>
              <Line label={t("pyo2.pr.gross")} value={inr(r.gross + p.claimIn + p.advance + p.otIn)} strong />
            </div>
          </Card>
          <Card title={t("pyo2.pr.ded")}>
            {ded.length
              ? ded.map(function (ln, i) { return <Line key={ln.label + i} label={ln.label} value={inr(ln.v)} rule={i > 0} />; })
              : <EmptyState compact head={t("pyo2.pr.ded")} body={t("pyo2.pr.loan.none")} />}
            <div style={{ borderTop: "2px solid " + c.ruleStrong, marginTop: 4 }}>
              <Line label={t("pyo2.col.ded")} value={inr(ded.reduce(function (s, x) { return s + x.v; }, 0))} strong />
            </div>
          </Card>
        </div>

        <div style={{ height: L.gap }} />

        {r.loan ? (
          <Card title={t("pyo2.pr.loan")}
            sub={t("pyo2.ln.kind." + r.loan.kind) + " · " + t(r.loan.purposeKey) + " · " + r.loan.id}
            action={live ? (
              p.loanWork ? (
                <LinkButton onClick={function () { onUndo("loan", r.id); }}>{t("pyo2.a.undo")}</LinkButton>
              ) : (
                <div style={{ display: "flex", gap: 10 }}>
                  <Button size="sm" onClick={function () { onPanel({ kind: "skip", r: r }); }}>{t("pyo2.ln.a.skip")}</Button>
                  <Button size="sm" onClick={function () { onPanel({ kind: "settle", r: r }); }}>{t("pyo2.ln.a.settle")}</Button>
                </div>
              )
            ) : null}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "18px 24px", marginBottom: 16 }}>
              <Fig label={t("pyo2.pr.loan.lent")} value={inr(r.loan.principal)} note={fmtSince(t, r.loan.since)} />
              <Fig label={t("pyo2.pr.loan.repaid")} value={inr(r.loan.repaidSoFar)} />
              <Fig label={t("pyo2.pr.loan.left")} value={inr(r.loan.balance)} />
              <Fig label={t("pyo2.ln.col.month")} value={loanOff ? inr(loanOff) : "—"}
                note={p.loanWork === "skip" ? t("pyo2.ln.st.skipped") : p.loanWork === "settle" ? t("pyo2.ln.st.settled") : null} />
            </div>
            <Meter frac={r.loan.tenure ? r.loan.paid / r.loan.tenure : 0} bar={c.chartTeal} track={c.sunken} height={7} />
            <p style={ty("caption", { color: c.inkFaint, margin: "8px 0 0" })}>
              {t("pyo2.pr.loan.sched", { paid: num(r.loan.paid), all: num(r.loan.tenure) })}
            </p>
          </Card>
        ) : null}

        {r.loan && r.claims && r.claims.length ? <div style={{ height: L.gap }} /> : null}

        {r.claims && r.claims.length ? (
          <Card title={t("pyo2.pr.claims")} sub={t("pyo2.rc.sub")}>
            {r.claims.map(function (cl, i) {
              const st = live ? ST.claimState(work, cl) : "not";
              const tone = claimTone(c, st);
              return (
                <div key={cl.id} style={{
                  display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
                  padding: "12px 0", borderTop: i ? "1px solid " + c.rule : "none",
                }}>
                  <span style={{ flex: 1, minWidth: 180 }}>
                    <span style={ty("small", { display: "block", color: c.ink, fontWeight: 600 })}>{cl.catKey ? t(cl.catKey) : cl.id}</span>
                    <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 1 })}>
                      {cl.id} · {fmtDay(cl.approvedIso)}
                    </span>
                  </span>
                  <StatusMark role={tone.role} glyph={tone.glyph} word={t("pyo2.rc.st." + st)} />
                  <span style={G3.fig("sm", { color: c.ink, fontWeight: 700, minWidth: 100, textAlign: "right" })}>{inr(cl.v)}</span>
                  {live ? (
                    st === "in" || st === "held"
                      ? <LinkButton onClick={function () { onUndo("claim", cl.id); }}>{t("pyo2.a.undo")}</LinkButton>
                      : (
                        <span style={{ display: "flex", gap: 10 }}>
                          <Button size="sm" onClick={function () { onClaim(cl, r, "in"); }}>{t("pyo2.rc.a.pay")}</Button>
                          <Button size="sm" onClick={function () { onClaim(cl, r, "held"); }}>{t("pyo2.rc.a.hold")}</Button>
                        </span>
                      )
                  ) : null}
                </div>
              );
            })}
          </Card>
        ) : null}

        {r.arrear ? (
          <div style={{ marginTop: L.gap }}>
            <Card title={t("pyo2.pr.arrear")} sub={t("pyo2.pr.arrear.sub")}>
              <Line label={t("pyo2.l.ARREAR")} value={inr(r.arrear)} strong />
            </Card>
          </div>
        ) : null}

        {!r.loan && !(r.claims && r.claims.length) ? (
          <Card><p style={ty("small", { color: c.inkMuted, margin: 0 })}>{t("pyo2.pr.nothing")}</p></Card>
        ) : null}

        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginTop: L.gap }}>
          <LinkButton onClick={function () { onNavigate.go("pyRules"); }}>{t("pyo2.pr.onRules")}</LinkButton>
          {known ? (
            <LinkButton onClick={function () {
              window.Pages3.pyRecordId = r.id;
              onNavigate.go("pyRecord");
            }}>{t("pyo2.pr.onRecord")}</LinkButton>
          ) : null}
        </div>
      </div>
    );
  }

  function Fig({ label, value, note }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div style={{ minWidth: 0 }}>
        <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" })}>{label}</div>
        <div style={G3.fig("lg", { color: c.ink, fontWeight: 700, marginTop: 4, lineHeight: 1.1 })}>{value}</div>
        {note ? <div style={ty("caption", { color: c.inkMuted, marginTop: 3 })}>{note}</div> : null}
      </div>
    );
  }

  /* ============================================================
     6 · THE PANELS
     ============================================================ */
  function AskPanel({ r, onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [note, setNote] = useState("");
    function send() {
      const H = window.NaveyaPayHandoff;
      if (H && H.requestChange) {
        H.requestChange(r.id, { topicKey: askTopicKey(r), note: note.trim(), byKey: "ph.who.sunita" });
      }
      onDone(note.trim());
    }
    return (
      <Modal
        title={t("pyo2.ask.title")} sub={r.name + " · " + r.id} onClose={onClose}
        footer={
          <React.Fragment>
            <Button kind="primary" iconLeft="arrow" onClick={send}>{t("pyo2.ask.go")}</Button>
            <LinkButton onClick={onClose}>{t("pyo2.cancel")}</LinkButton>
          </React.Fragment>
        }
      >
        <Field id="pyo2-what" label={t("pyo2.ask.what")}>
          <div style={{ border: "1px solid " + c.border, borderRadius: G3.r.md, background: c.sunken, padding: "12px 15px" }}>
            <span style={ty("small", { color: c.ink, fontWeight: 600 })}>{issueWord(t, r)}</span>
          </div>
        </Field>
        <Field id="pyo2-note" label={t("pyo2.ask.note")}>
          <Input id="pyo2-note" value={note} onChange={setNote} placeholder={t("pyo2.ask.notePh")} />
        </Field>
        <p style={ty("caption", { color: c.inkFaint, margin: 0 })}>{t("pyo2.ask.lands", { name: r.name })}</p>
      </Modal>
    );
  }

  function FixPanel({ r, onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const kind = r.issue.kind;
    const what = kind === "claimWaiting" ? "pyo2.rc.a.pay" : kind === "loanOverNet" ? "pyo2.ln.a.skip" : "pyo2.fix.title";
    const amount = kind === "claimWaiting" ? r.claimDue : kind === "loanOverNet" ? (r.loan ? r.loan.emi : 0) : 0;
    return (
      <Modal
        title={t("pyo2.fix.title")} sub={r.name + " · " + r.id} onClose={onClose}
        footer={
          <React.Fragment>
            <Button kind="primary" iconLeft="check" onClick={onDone}>{t("pyo2.fix.go")}</Button>
            <LinkButton onClick={onClose}>{t("pyo2.cancel")}</LinkButton>
          </React.Fragment>
        }
      >
        <p style={ty("body", { color: c.ink, margin: "0 0 16px", fontWeight: 600 })}>{t(what)}</p>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          border: "1px solid " + c.border, borderRadius: G3.r.md, background: c.sunken, padding: "13px 16px",
        }}>
          <span style={ty("small", { color: c.inkMuted })}>{t("pyo2.fix.amount")}</span>
          <span style={G3.fig("md", { color: c.ink, fontWeight: 700 })}>{inr(amount || 0)}</span>
        </div>
      </Modal>
    );
  }

  function SkipPanel({ r, onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    return (
      <Modal
        title={t("pyo2.ln.skip.title")} sub={r.name + " · " + r.id} onClose={onClose}
        footer={
          <React.Fragment>
            <Button kind="primary" iconLeft="check" onClick={onDone}>{t("pyo2.ln.skip.go")}</Button>
            <LinkButton onClick={onClose}>{t("pyo2.cancel")}</LinkButton>
          </React.Fragment>
        }
      >
        <p style={ty("small", { color: c.inkMuted, margin: "0 0 16px" })}>{t("pyo2.ln.skip.body", { name: r.name })}</p>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          border: "1px solid " + c.border, borderRadius: G3.r.md, background: c.sunken, padding: "13px 16px",
        }}>
          <span style={ty("small", { color: c.inkMuted })}>{t("pyo2.ln.col.month")}</span>
          <span style={G3.fig("md", { color: c.ink, fontWeight: 700 })}>{inr(r.loan ? r.loan.emi : 0)}</span>
        </div>
      </Modal>
    );
  }

  function SettlePanel({ r, onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const l = r.loan || { balance: 0, emi: 0 };
    return (
      <Modal
        title={t("pyo2.ln.set.title")} sub={r.name + " · " + r.id} onClose={onClose}
        footer={
          <React.Fragment>
            <Button kind="primary" iconLeft="check" onClick={onDone}>{t("pyo2.ln.set.go")}</Button>
            <LinkButton onClick={onClose}>{t("pyo2.cancel")}</LinkButton>
          </React.Fragment>
        }
      >
        <p style={ty("small", { color: c.inkMuted, margin: "0 0 16px" })}>{t("pyo2.ln.set.body", { name: r.name })}</p>
        <div style={{ border: "1px solid " + c.border, borderRadius: G3.r.md, background: c.sunken, padding: "4px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0" }}>
            <span style={ty("small", { color: c.inkMuted })}>{t("pyo2.ln.set.was")}</span>
            <span style={G3.fig("sm", { color: c.inkMuted, fontWeight: 600 })}>{inr(l.emi)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderTop: "1px solid " + c.rule }}>
            <span style={ty("small", { color: c.ink, fontWeight: 600 })}>{t("pyo2.ln.set.now")}</span>
            <span style={G3.fig("md", { color: c.ink, fontWeight: 700 })}>{inr(l.balance)}</span>
          </div>
        </div>
      </Modal>
    );
  }

  function AdvancePanel({ roll, taken, onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [q, setQ] = useState("");
    const [who, setWho] = useState(null);
    const [amount, setAmount] = useState("");
    const [why, setWhy] = useState("pyo.loan.p.festival");
    const [months, setMonths] = useState("4");
    const [err, setErr] = useState(null);

    const hits = q && !who
      ? roll.filter(function (r) {
        return (r.name + " " + r.id).toLowerCase().indexOf(q.toLowerCase()) !== -1 && r.net > 0;
      }).slice(0, 6)
      : [];

    const amt = parseInt(String(amount).replace(/[^0-9]/g, ""), 10) || 0;
    const n = parseInt(months, 10) || 1;
    const emi = amt ? Math.round(amt / n) : 0;
    const cap = who ? who.monthly || who.gross : 0;

    function go() {
      if (!who || !amt) { setErr(t("pyo2.ln.new.err")); return; }
      if (taken(who.id)) { setErr(t("pyo2.ln.new.dupe")); return; }
      if (amt > cap) { setErr(t("pyo2.ln.new.cap")); return; }
      onDone({ staffId: who.id, name: who.name, amount: amt, months: n, emi: emi, whyKey: why });
    }

    return (
      <Modal
        title={t("pyo2.ln.new.title")} onClose={onClose}
        footer={
          <React.Fragment>
            <Button kind="primary" iconLeft="check" onClick={go}>{t("pyo2.ln.new.go")}</Button>
            <LinkButton onClick={onClose}>{t("pyo2.cancel")}</LinkButton>
          </React.Fragment>
        }
      >
        <Field id="pyo2-adv-who" label={t("pyo2.ln.new.who")} error={err && !who ? err : null}>
          {who ? (
            <div style={{
              display: "flex", alignItems: "center", gap: 12,
              border: "1px solid " + c.border, borderRadius: G3.r.md, background: c.sunken, padding: "10px 14px",
            }}>
              <Avatar name={who.name} size={30} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={ty("small", { display: "block", color: c.ink, fontWeight: 700 })}>{who.name}</span>
                <span style={ty("caption", { display: "block", color: c.inkFaint })}>{who.id} · {t("pyo2.pr.salary")} {inr(cap)}</span>
              </span>
              <LinkButton onClick={function () { setWho(null); setQ(""); }}>{t("pyo2.cancel")}</LinkButton>
            </div>
          ) : (
            <div>
              <Input id="pyo2-adv-who" value={q} onChange={function (v) { setQ(v); setErr(null); }} placeholder={t("pyo2.ln.new.whoPh")} />
              {hits.length ? (
                <div style={{ border: "1px solid " + c.border, borderTop: "none", borderRadius: "0 0 " + G3.r.md + "px " + G3.r.md + "px", background: c.surface }}>
                  {hits.map(function (r, i) {
                    return (
                      <button
                        key={r.id} type="button" onClick={function () { setWho(r); setErr(null); }}
                        style={ty("small", {
                          display: "flex", width: "100%", gap: 10, alignItems: "center", textAlign: "left",
                          background: "none", border: "none", borderTop: i ? "1px solid " + c.rule : "none",
                          padding: "9px 14px", cursor: "pointer", color: c.ink,
                        })}
                      >
                        <span style={{ flex: 1, minWidth: 0, fontWeight: 600 }}>{r.name}</span>
                        <span style={ty("caption", { color: c.inkFaint })}>{r.id}</span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          )}
        </Field>
        <Field id="pyo2-adv-amt" label={t("pyo2.ln.new.amount")} error={err && who ? err : null}>
          <Input id="pyo2-adv-amt" value={amount} onChange={function (v) { setAmount(v); setErr(null); }} inputMode="numeric" placeholder="0" />
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field id="pyo2-adv-why" label={t("pyo2.ln.new.why")}>
            <Select
              id="pyo2-adv-why" value={why} onChange={setWhy}
              options={["pyo.loan.p.festival", "pyo.loan.p.medical", "pyo.loan.p.education", "pyo.loan.p.home", "pyo.loan.p.vehicle"]
                .map(function (k) { return { value: k, label: t(k) }; })}
            />
          </Field>
          <Field id="pyo2-adv-m" label={t("pyo2.ln.new.months")}>
            <Select
              id="pyo2-adv-m" value={months} onChange={setMonths}
              options={["1", "2", "3", "4", "6"].map(function (v) {
                return { value: v, label: v === "1" ? t("pyo2.ln.new.m1") : t("pyo2.ln.new.m", { n: v }) };
              })}
            />
          </Field>
        </div>
        {emi ? (
          <p style={ty("small", { color: c.inkMuted, margin: "4px 0 0" })}>
            {t(n === 1 ? "pyo2.ln.new.sum1" : "pyo2.ln.new.sum", { emi: inr(emi), n: num(n) })}
          </p>
        ) : null}
      </Modal>
    );
  }

  /* ============================================================
     7 · THE AUTOMATED RUN
     ============================================================ */
  function AutoRun({ campus, month, run, draft, setDraft, dirty, onSave, onDiscard, onSend, onRecord, onNavigate, said, onSaid }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const L = G3.layout;
    const [tab, setTab] = useState("people");
    const [group, setGroup] = useState("all");
    const [panel, setPanel] = useState(null);
    const [sending, setSending] = useState(false);

    const live = run.state === "checking";
    const work = live ? draft : ST.emptyWork();
    const rm = rollMonth(month);
    const all = useMemo(function () { return R.roll(campus, rm); }, [campus, rm]);
    const groups = useMemo(function () { return R.byGroup(campus, rm); }, [campus, rm]);
    const roll = group === "all" ? all : all.filter(function (r) { return r.group === group; });
    const groupName = (groups.filter(function (g) { return g.key === group; })[0] || {}).nameKey || "pyo2.g.all";

    /* what each group PAYS, so the cards add up to the headline and
       the screen carries one big figure rather than two that differ */
    const payByGroup = useMemo(function () {
      const map = {};
      groups.forEach(function (g) { map[g.key] = { key: g.key, nameKey: g.nameKey, heads: 0, net: 0 }; });
      all.forEach(function (r) {
        const m = map[r.group];
        if (!m) return;
        m.heads += 1;
        if (!r.heldKey) m.net += ST.priced(r, work).net;
      });
      return groups.map(function (g) { return map[g.key]; });
    }, [all, groups, work]);

    const tot = ST.runTotals(roll, work);
    const allTot = ST.runTotals(all, work);
    const heads = roll.length;
    const payees = roll.filter(function (r) { return r.net > 0 && !r.heldKey; }).length;
    const held = roll.filter(function (r) { return r.heldKey; });
    const openCount = all.filter(function (r) { return ST.needsFix(r, work); }).length;
    const askedCount = all.filter(function (r) { const mk = ST.settled(r, work); return mk && mk.state === "asked"; }).length;
    const changes = ST.countWork(work);

    const loansN = roll.filter(function (r) { return r.loan; }).length + work.advances.length;
    const claimsN = roll.reduce(function (s, r) {
      return s + (r.claims || []).filter(function (cl) { return cl.approvedMonth <= month; }).length;
    }, 0);
    const waitingClaims = all.reduce(function (acc, r) {
      (r.claims || []).forEach(function (cl) {
        if (cl.approvedMonth <= month && ST.claimState(work, cl) !== "in") acc.push(cl);
      });
      return acc;
    }, []);

    function patch(next) { setDraft(Object.assign({}, work, next)); }
    function setClaim(cl, row, how) {
      patch({ claims: Object.assign({}, work.claims, { [cl.id]: how }) });
      onSaid(t(how === "in" ? "pyo2.rc.paid" : "pyo2.rc.held", { name: row.name }));
    }
    function payAllDue() {
      const next = Object.assign({}, work.claims);
      let n = 0;
      all.forEach(function (r) {
        (r.claims || []).forEach(function (cl) {
          if (cl.approvedMonth < month && next[cl.id] !== "in") { next[cl.id] = "in"; n += 1; }
        });
      });
      patch({ claims: next });
      onSaid(t("pyo2.rc.paidAll", { n: num(n) }));
    }
    function setOt(o, row, how) {
      patch({ ot: Object.assign({}, work.ot, { [o.id]: how }) });
      onSaid(t(how === "in" ? "pyo2.ot.paid" : "pyo2.ot.held", { name: row.name }));
    }
    function undo(kind, id) {
      const next = {};
      if (kind === "loan") { next.loans = Object.assign({}, work.loans); delete next.loans[id]; }
      if (kind === "claim") { next.claims = Object.assign({}, work.claims); delete next.claims[id]; }
      if (kind === "ot") { next.ot = Object.assign({}, work.ot); delete next.ot[id]; }
      if (kind === "advance") next.advances = work.advances.filter(function (a) { return a.staffId !== id; });
      patch(next);
      onSaid(null);
    }

    const mo = R.monthOf(month);
    const otN = roll.reduce(function (n, r) {
      return n + (r.overtime || []).filter(function (o) { return o.state !== "declined"; }).length;
    }, 0);
    const riseN = roll.reduce(function (n, r) { return n + (r.rises || []).length; }, 0);

    const tabs = [
      { key: "people", label: t("pyo2.tab.people") + " · " + num(heads) },
      { key: "loans", label: t("pyo2.tab.loans") + " · " + num(loansN) },
      { key: "claims", label: t("pyo2.tab.claims") + " · " + num(claimsN) },
      { key: "ot", label: t("pyo2.tab.ot") + " · " + num(otN) },
      { key: "rises", label: t("pyo2.tab.rises") + " · " + num(riseN) },
    ];

    return (
      <div>
        {/* ---- heading ---- */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 20, flexWrap: "wrap", marginBottom: 18 }}>
          <div style={{ minWidth: 0 }}>
            <h1 style={ty("h1", { margin: "0 0 10px", color: c.ink })}>
              {t("pyo2.head", { campus: campusName(t, campus), mon: t("pyr.mon." + month), y: mo ? mo.y : "" })}
            </h1>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              {stateMark(t, run.state)}
              <Chip bg={c.sunken} fg={c.inkMuted}>{t("pyo2.mode.auto")}</Chip>
              <span style={ty("small", { color: c.inkMuted })}>
                {run.state === "paid" ? t("pyo2.closed", { run: R.runIdOf(month) || "" })
                  : run.state === "sent" ? t("pyo2.sentOn")
                    : run.savedAt ? t("pyo2.savedOn", { d: fmtD(run.savedAt) }) : t("pyo2.notSaved")}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            {live && openCount ? (
              <span style={ty("caption", { color: c.absentText, fontWeight: 600 })}>
                {t("pyo2.send.blocked", { n: num(openCount) })}
              </span>
            ) : null}
            {live ? (
              <React.Fragment>
                <Button iconLeft="check" disabled={!dirty} onClick={onSave}>{dirty ? t("pyo2.save") : t("pyo2.saved")}</Button>
                <Button kind="primary" iconLeft="arrow" disabled={openCount > 0 || dirty} onClick={function () { setSending(true); }}>
                  {t("pyo2.send")}
                </Button>
              </React.Fragment>
            ) : run.state === "paid" ? (
              <Button size="sm" iconRight="arrow" onClick={function () { onNavigate.go("pyReports"); }}>{t("pyo2.register")}</Button>
            ) : null}
          </div>
        </div>

        {month > LIVE ? (
          <div style={{
            display: "flex", alignItems: "center", gap: 10, marginBottom: 16,
            background: c.lateTint, border: "1px solid " + c.border, borderRadius: G3.r.md, padding: "11px 15px",
          }}>
            <span aria-hidden="true" style={{ display: "flex", color: c.lateText }}><Icon name="clock" size={15} /></span>
            <span style={ty("small", { color: c.lateText, fontWeight: 600 })}>{t("pyo2.ahead", { mon: t("pyr.mon." + month) })}</span>
          </div>
        ) : null}

        {/* ---- what the officer changed, and whether it is saved.
             ONE line: two bars about the same work, one of them
             counting it a second time, is the clutter this product
             keeps having to delete. ---- */}
        {changes ? (
          <div role="status" style={{
            display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 16,
            background: dirty ? c.lateTint : c.surface,
            border: "1px solid " + c.border, borderRadius: G3.r.md, padding: "11px 15px",
          }}>
            <span aria-hidden="true" style={{ display: "flex", color: dirty ? c.lateText : c.presentText }}>
              <Icon name={dirty ? "alert" : "check"} size={15} />
            </span>
            <span style={{ flex: 1, minWidth: 220 }}>
              <span style={ty("small", { display: "block", color: dirty ? c.lateText : c.ink, fontWeight: 700 })}>
                {dirty
                  ? (changes === 1 ? t("pyo2.dirty1") : t("pyo2.dirty", { n: num(changes) }))
                  : (changes === 1 ? t("pyo2.kept1") : t("pyo2.kept", { n: num(changes) }))}
              </span>
              {allTot.added || allTot.taken ? (
                <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 2 })}>
                  {allTot.added ? t("pyo2.ch.added", { money: inr(allTot.added) }) : null}
                  {allTot.added && allTot.taken ? " · " : null}
                  {allTot.taken ? t("pyo2.ch.taken", { money: inr(allTot.taken) }) : null}
                </span>
              ) : null}
            </span>
            {dirty ? <Button size="sm" iconLeft="check" onClick={onSave}>{t("pyo2.save")}</Button> : null}
            <LinkButton onClick={onDiscard}>{t(dirty ? "pyo2.discard" : "pyo2.ch.undo")}</LinkButton>
          </div>
        ) : null}

        <Flash said={said} />

        {/* ---- what the run pays, and which part of it ----

             The pay groups sit INSIDE this card because picking one
             changes the figure above them. A filter and the number it
             filters are one thing, not two cards. */}
        <Headline
          label={group === "all" ? t("pyo2.f.pay") : t("pyo2.f.payGroup", { g: t(groupName) })}
          value={inr(tot.net)}
          line={tot.held
            ? t("pyo2.sum.held", {
              n: num(payees), all: num(heads), gross: inr(tot.out),
              ded: inr(tot.ded), held: inr(tot.held),
            })
            : t("pyo2.sum", { n: num(payees), all: num(heads), gross: inr(tot.out), ded: inr(tot.ded) })}
        >
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <FilterChips
              at={group} onPick={setGroup}
              items={[{ k: "all", label: t("pyo2.g.all"), n: all.length }].concat(
                payByGroup.map(function (g) { return { k: g.key, label: t(g.nameKey), n: g.heads }; })
              )}
            />
            {group !== "all" ? (
              <LinkButton onClick={function () { onNavigate.go("pyRules"); }}>{t("pyo2.g.rules")}</LinkButton>
            ) : null}
          </div>
        </Headline>

        <div style={{ height: L.gap }} />

        <Tabs items={tabs} active={tab} onChange={setTab} ariaLabel={t("pyo2.tabs.aria")} idBase="pyopen" />

        <div style={{ marginTop: L.gap }}>
          {tab === "people" ? (
            <TabPanel idBase="pyopen" tabKey="people">
              <PeopleTab roll={roll} work={work} live={live} onPanel={setPanel} onRecord={onRecord} onSaid={onSaid} />
              {held.length ? (
                <div style={{ marginTop: L.gap }}>
                  <Card title={t("pyo2.held.title")} sub={t("pyo2.held.sub")}>
                    {held.map(function (h, i) {
                      return (
                        <div key={h.id} style={{
                          display: "flex", alignItems: "center", gap: 13, padding: "11px 0",
                          borderTop: i ? "1px solid " + c.rule : "none",
                        }}>
                          <Avatar name={h.name} size={32} />
                          <span style={{ flex: 1, minWidth: 0 }}>
                            <span style={ty("small", { display: "block", color: c.ink, fontWeight: 700 })}>{h.name}</span>
                            <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 1 })}>{h.id}</span>
                          </span>
                          <StatusMark role="penalty" glyph="lock" word={t(h.heldKey)} />
                          <span style={G3.fig("sm", { color: c.inkMuted, fontWeight: 600, minWidth: 110, textAlign: "right" })}>{inr(h.net)}</span>
                        </div>
                      );
                    })}
                  </Card>
                </div>
              ) : null}
            </TabPanel>
          ) : null}
          {tab === "loans" ? (
            <TabPanel idBase="pyopen" tabKey="loans">
              <LoansTab roll={roll} month={month} work={work} live={live} onPanel={setPanel} onRecord={onRecord}
                onUndo={undo} onOpenModule={onNavigate.go} />
            </TabPanel>
          ) : null}
          {tab === "claims" ? (
            <TabPanel idBase="pyopen" tabKey="claims">
              <ClaimsTab roll={roll} month={month} work={work} live={live}
                onClaim={setClaim} onPayAll={payAllDue} onRecord={onRecord} onUndo={undo}
                onOpenModule={onNavigate.go} />
            </TabPanel>
          ) : null}
          {tab === "ot" ? (
            <TabPanel idBase="pyopen" tabKey="ot">
              <OvertimeTab roll={roll} work={work} live={live}
                onOt={setOt} onRecord={onRecord} onUndo={undo} onOpenModule={onNavigate.go} />
            </TabPanel>
          ) : null}
          {tab === "rises" ? (
            <TabPanel idBase="pyopen" tabKey="rises">
              <RisesTab roll={roll} onRecord={onRecord} onOpenModule={onNavigate.go} />
            </TabPanel>
          ) : null}
        </div>

        {/* ---- panels ---- */}
        {panel && panel.kind === "ask" ? (
          <AskPanel r={panel.r} onClose={function () { setPanel(null); }}
            onDone={function (note) {
              patch({ marks: Object.assign({}, work.marks, { [panel.r.id]: { state: "asked", topicKey: askTopicKey(panel.r), note: note } }) });
              setPanel(null); onSaid(t("pyo2.ask.done", { name: panel.r.name }));
            }} />
        ) : null}
        {panel && panel.kind === "fix" ? (
          <FixPanel r={panel.r} onClose={function () { setPanel(null); }}
            onDone={function () {
              const row = panel.r;
              if (row.issue.kind === "claimWaiting") {
                const next = Object.assign({}, work.claims);
                (row.claims || []).forEach(function (cl) { if (cl.overdue) next[cl.id] = "in"; });
                patch({ claims: next });
              } else if (row.issue.kind === "loanOverNet") {
                patch({ loans: Object.assign({}, work.loans, { [row.id]: "skip" }) });
              } else {
                patch({ marks: Object.assign({}, work.marks, { [row.id]: { state: "fixed" } }) });
              }
              setPanel(null); onSaid(t("pyo2.fix.done", { name: row.name }));
            }} />
        ) : null}
        {panel && panel.kind === "skip" ? (
          <SkipPanel r={panel.r} onClose={function () { setPanel(null); }}
            onDone={function () {
              patch({ loans: Object.assign({}, work.loans, { [panel.r.id]: "skip" }) });
              setPanel(null); onSaid(t("pyo2.ln.skip.done", { name: panel.r.name }));
            }} />
        ) : null}
        {panel && panel.kind === "settle" ? (
          <SettlePanel r={panel.r} onClose={function () { setPanel(null); }}
            onDone={function () {
              patch({ loans: Object.assign({}, work.loans, { [panel.r.id]: "settle" }) });
              setPanel(null); onSaid(t("pyo2.ln.set.done", { name: panel.r.name }));
            }} />
        ) : null}
        {panel && panel.kind === "advance" ? (
          <AdvancePanel roll={all}
            taken={function (id) { return work.advances.some(function (a) { return a.staffId === id; }); }}
            onClose={function () { setPanel(null); }}
            onDone={function (a) {
              patch({ advances: work.advances.concat([a]) });
              setPanel(null); onSaid(t("pyo2.ln.new.done", { name: a.name }));
            }} />
        ) : null}
        {sending ? (
          <Modal
            title={t("pyo2.send.title")} onClose={function () { setSending(false); }}
            footer={
              <React.Fragment>
                <Button kind="primary" onClick={function () { setSending(false); onSend(); }}>{t("pyo2.send.go")}</Button>
                <LinkButton onClick={function () { setSending(false); }}>{t("pyo2.cancel")}</LinkButton>
              </React.Fragment>
            }
          >
            <p style={ty("small", { color: c.inkMuted, margin: 0 })}>
              {t("pyo2.send.body", { n: num(all.filter(function (r) { return r.net > 0 && !r.heldKey; }).length), money: inr(allTot.net) })}
            </p>
            {askedCount ? (
              <p style={ty("small", { color: c.lateText, margin: "12px 0 0", fontWeight: 600 })}>
                {t("pyo2.send.withHr", { n: num(askedCount) })}
              </p>
            ) : null}
            {waitingClaims.length ? (
              <p style={ty("small", { color: c.lateText, margin: "12px 0 0", fontWeight: 600 })}>
                {t("pyo2.send.claims", {
                  n: num(waitingClaims.length),
                  money: inr(waitingClaims.reduce(function (s, cl) { return s + cl.v; }, 0)),
                })}
              </p>
            ) : null}
          </Modal>
        ) : null}
      </div>
    );
  }

  /* ============================================================
     8 · THE MANUAL RUN

     Not the automated screen with the controls taken away. A school
     that runs its payroll in a spreadsheet has a different job: get
     the data out, work on it somewhere else, bring it back, see what
     moved, send it. Three steps, in order, each one locked until the
     one before it is done -- because uploading a sheet you never
     downloaded is the mistake this screen exists to prevent.
     ============================================================ */
  function Step({ n, head, body, children, done, waiting, waitWord }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    return (
      <Card>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          <span aria-hidden="true" style={Object.assign({
            flex: "0 0 auto", width: 30, height: 30, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
          }, done
            ? { background: c.presentTint, color: c.presentText }
            : waiting
              ? { background: c.alt, color: c.inkFaint, border: "1px solid " + c.border }
              : { background: c.accentSoft, color: c.accent, border: "1px solid " + c.accent })}>
            {done ? <Icon name="check" size={15} /> : <span style={G3.fig("xs", { fontWeight: 700 })}>{num(n)}</span>}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={ty("h3", { margin: 0, color: waiting ? c.inkFaint : c.ink })}>{head}</h3>
            {body ? <p style={ty("small", { color: c.inkMuted, margin: "5px 0 0", maxWidth: "72ch" })}>{body}</p> : null}
            {waiting ? (
              <p style={ty("caption", { color: c.inkFaint, margin: "12px 0 0", fontWeight: 600 })}>{waitWord}</p>
            ) : (
              <div style={{ marginTop: 14 }}>{children}</div>
            )}
          </div>
        </div>
      </Card>
    );
  }

  /* What a filled sheet came back saying. Derived from the roll so it
     is the same every time somebody opens it: the rows that had
     something wrong with them are the rows a human would have fixed,
     and the bills owed since last month are the ones they would have
     added. Nothing random, and nothing invented beyond that. */
  function sheetDiff(roll, month) {
    const out = [];
    roll.forEach(function (r) {
      if (r.heldKey) return;
      let now = r.net, whyKey = null;
      if (r.issue && r.issue.kind === "lopUnexplained") {
        now = r.net + Math.round((r.monthly * r.lop) / R.MONTH_DAYS);
        whyKey = "pyo2.m.why.days";
      } else if (r.claimDue > 0) {
        now = r.net + r.claimDue;
        whyKey = "pyo2.m.why.bill";
      } else if (r.loan && r.issue && r.issue.kind === "loanOverNet") {
        now = r.net + r.loan.emi;
        whyKey = "pyo2.m.why.loan";
      }
      if (whyKey) out.push({ r: r, was: r.net, now: now, whyKey: whyKey });
    });
    return out;
  }

  function ManualRun({ campus, month, run, onSend, onNavigate, said, onSaid }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const L = G3.layout;
    const rm = rollMonth(month);
    const all = useMemo(function () { return R.roll(campus, rm); }, [campus, rm]);
    const base = ST.runTotals(all, ST.emptyWork());
    const sheet = run.sheet || { step: "fresh" };
    const changed = sheet.changed || [];
    const live = run.state === "checking";

    const move = changed.reduce(function (s, x) { return s + (x.now - x.was); }, 0);
    const payNow = base.net + move;
    const mo = R.monthOf(month);
    const runId = R.runIdOf(month) || ("PR-2026-" + String(month).padStart(2, "0"));

    const rows = changed.map(function (x) {
      return {
        id: x.r.id,
        cells: {
          who: (
            <span style={{ display: "block", minWidth: 0 }}>
              <span style={ty("small", { display: "block", color: c.ink, fontWeight: 700 })}>{x.r.name}</span>
              <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 1 })}>{x.r.id}</span>
            </span>
          ),
          group: t(x.r.groupNameKey),
          why: <span style={ty("small", { color: c.inkMuted })}>{t(x.whyKey)}</span>,
          was: inr(x.was),
          now: <span style={G3.fig("sm", { color: c.ink, fontWeight: 700 })}>{inr(x.now)}</span>,
          move: (
            <span style={G3.fig("sm", { color: x.now >= x.was ? c.presentText : c.absentText, fontWeight: 600 })}>
              {x.now >= x.was ? "+" : "−"}{inr(Math.abs(x.now - x.was))}
            </span>
          ),
        },
      };
    });

    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 20, flexWrap: "wrap", marginBottom: 18 }}>
          <div style={{ minWidth: 0 }}>
            <h1 style={ty("h1", { margin: "0 0 10px", color: c.ink })}>
              {t("pyo2.head", { campus: campusName(t, campus), mon: t("pyr.mon." + month), y: mo ? mo.y : "" })}
            </h1>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              {stateMark(t, run.state)}
              <Chip bg={c.sunken} fg={c.inkMuted}>{t("pyo2.mode.manual")}</Chip>
              <span style={ty("small", { color: c.inkMuted })}>
                {run.state === "sent" ? t("pyo2.sentOn") : run.savedAt ? t("pyo2.savedOn", { d: fmtD(run.savedAt) }) : t("pyo2.notSaved")}
              </span>
            </div>
          </div>
        </div>

        {month > LIVE ? (
          <div style={{
            display: "flex", alignItems: "center", gap: 10, marginBottom: 16,
            background: c.lateTint, border: "1px solid " + c.border, borderRadius: G3.r.md, padding: "11px 15px",
          }}>
            <span aria-hidden="true" style={{ display: "flex", color: c.lateText }}><Icon name="clock" size={15} /></span>
            <span style={ty("small", { color: c.lateText, fontWeight: 600 })}>{t("pyo2.ahead", { mon: t("pyr.mon." + month) })}</span>
          </div>
        ) : null}

        <Flash said={said} />

        <Headline
          label={t("pyo2.f.pay")}
          value={inr(payNow)}
          line={base.held
            ? t("pyo2.sum.held", {
              n: num(all.filter(function (r) { return r.net > 0 && !r.heldKey; }).length), all: num(all.length),
              gross: inr(base.out + move), ded: inr(base.ded), held: inr(base.held),
            })
            : t("pyo2.sum", {
              n: num(all.filter(function (r) { return r.net > 0 && !r.heldKey; }).length), all: num(all.length),
              gross: inr(base.out + move), ded: inr(base.ded),
            })}
        />

        <p style={ty("small", { color: c.inkMuted, margin: "16px 0 18px", maxWidth: "72ch" })}>
          {t("pyo2.m.sub")}
        </p>

        <div style={{ display: "grid", gap: L.gap }}>
          <Step n={1} head={t("pyo2.m.s1")} body={t("pyo2.m.s1.body")} done={sheet.step !== "fresh"}>
            <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
              <Button iconLeft="download" disabled={!live}
                onClick={function () { ST.markDownloaded(campus, month); onSaid(t("pyo2.m.downloaded")); }}>
                {t("pyo2.m.s1.go")}
              </Button>
              <span style={ty("caption", { color: c.inkFaint })}>
                {t("pyo2.m.s1.file", { run: runId + "-" + (R.CAMPUS_OF[campus] || {}).code, n: num(all.length), k: num(11) })}
              </span>
            </div>
            <p style={ty("caption", { color: c.inkFaint, margin: "12px 0 0" })}>{t("pyo2.m.cols")}</p>
            {sheet.downloadedAt ? (
              <p style={ty("caption", { color: c.presentText, margin: "8px 0 0", fontWeight: 600 })}>
                {t("pyo2.m.s1.done", { d: fmtD(sheet.downloadedAt) })}
              </p>
            ) : null}
          </Step>

          <Step n={2} head={t("pyo2.m.s2")} body={t("pyo2.m.s2.body")}
            done={sheet.step === "in"} waiting={sheet.step === "fresh"} waitWord={t("pyo2.m.s2.wait")}>
            <FileField
              id="pyo2-sheet" fileName={sheet.file} accept=".xlsx,.csv"
              hint={t("pyo2.m.s2.hint")}
              onPick={function (name) {
                if (!name || !live) return;
                ST.uploadSheet(campus, month, name, sheetDiff(all, month));
                onSaid(t("pyo2.m.uploaded"));
              }}
            />
            {sheet.step === "in" && live ? (
              <div style={{ marginTop: 12 }}>
                <LinkButton onClick={function () { ST.clearSheet(campus, month); onSaid(t("pyo2.m.cleared")); }}>
                  {t("pyo2.m.s3.again")}
                </LinkButton>
              </div>
            ) : null}
          </Step>

          <Step n={3} head={t("pyo2.m.s3")} done={sheet.step === "in" && !changed.length}
            waiting={sheet.step !== "in"} waitWord={t("pyo2.m.s2.wait")}>
            {changed.length ? (
              <div>
                <p style={ty("small", { color: c.ink, margin: "0 0 14px", fontWeight: 600 })}>
                  {t("pyo2.m.s3.n", { n: num(changed.length) })}
                </p>
                <Register
                  columns={[
                    { key: "who", label: t("pyo2.col.staff") },
                    { key: "group", label: t("pyo2.col.group"), width: 170 },
                    { key: "why", label: t("pyo2.m.col.why"), width: 170 },
                    { key: "was", label: t("pyo2.m.col.was"), align: "right", mono: true, width: 140 },
                    { key: "now", label: t("pyo2.m.col.now"), align: "right", width: 150 },
                    { key: "move", label: t("pyo2.m.col.move"), align: "right", width: 140 },
                  ]}
                  rows={rows}
                  totals={{
                    label: t("pyo2.m.total", { n: num(changed.length) }),
                    cells: {
                      was: inr(changed.reduce(function (s, x) { return s + x.was; }, 0)),
                      now: <span style={G3.fig("md", { fontWeight: 700 })}>{inr(changed.reduce(function (s, x) { return s + x.now; }, 0))}</span>,
                      move: <span style={G3.fig("md", { fontWeight: 700, color: move >= 0 ? c.presentText : c.absentText })}>
                        {move >= 0 ? "+" : "−"}{inr(Math.abs(move))}
                      </span>,
                    },
                  }}
                />
              </div>
            ) : (
              <p style={ty("small", { color: c.inkMuted, margin: 0 })}>{t("pyo2.m.s3.none")}</p>
            )}
          </Step>

          <Step n={4} head={t("pyo2.m.s4")} body={t("pyo2.m.s4.body")}
            done={run.state !== "checking"} waiting={sheet.step !== "in"} waitWord={t("pyo2.m.s4.wait")}>
            {live ? (
              <Button kind="primary" iconLeft="arrow" onClick={onSend}>{t("pyo2.send")}</Button>
            ) : (
              <span style={ty("small", { color: c.presentText, fontWeight: 600 })}>{t("pyo2.sentOn")}</span>
            )}
          </Step>
        </div>

        <div style={{ height: L.gap }} />

        <Register
          title={t("pyo2.m.rows")}
          sub={t("pyo2.m.readonly")}
          columns={[
            { key: "who", label: t("pyo2.col.staff") },
            { key: "group", label: t("pyo2.col.group"), width: 180 },
            { key: "days", label: t("pyo2.col.days"), align: "right", mono: true, width: 100 },
            { key: "gross", label: t("pyo2.col.month"), align: "right", mono: true, width: 150 },
            { key: "ded", label: t("pyo2.col.ded"), align: "right", mono: true, width: 150 },
            { key: "net", label: t("pyo2.col.net"), align: "right", mono: true, width: 160, weight: 700 },
          ]}
          rows={all.slice(0, 12).map(function (r) {
            return {
              id: r.id,
              cells: {
                who: (
                  <span style={{ display: "block", minWidth: 0 }}>
                    <span style={ty("small", { display: "block", color: c.ink, fontWeight: 700 })}>{r.name}</span>
                    <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 1 })}>{r.id} · {t(r.desigKey)}</span>
                  </span>
                ),
                group: t(r.groupNameKey),
                days: r.group === "visit" ? num(r.units) + "u" : num(r.days) + "/" + num(R.MONTH_DAYS),
                gross: inr(r.gross), ded: inr(r.ded), net: inr(r.net),
              },
            };
          })}
          totals={{
            label: t("pyo2.total", { n: num(all.length) }),
            cells: { gross: inr(base.gross), ded: inr(base.rawDed), net: inr(base.net + base.held) },
          }}
          footer={
            <span style={ty("caption", { color: c.inkFaint })}>
              {t("pyo2.showing", { a: num(Math.min(12, all.length)), b: num(all.length) })}
            </span>
          }
        />
      </div>
    );
  }

  /* ============================================================
     9 · THE MODULE
     ============================================================ */
  function PYRunOpen({ role, onNavigate }) {
    const { t } = useLang();
    ST.use();
    /* the list hands the run across, because a flat router carries no
       props. Consumed once, so coming back from the rail does not
       reopen whatever was last looked at. */
    const [at] = useState(function () {
      const h = window.Pages3 && window.Pages3.pyRunAt;
      if (h) { window.Pages3.pyRunAt = null; return h; }
      return { campus: "indiranagar", month: LIVE };
    });
    const campus = at.campus, month = at.month;
    const run = ST.get(campus, month);

    const [draft, setDraft] = useState(function () { return ST.draftOf(campus, month); });
    const [person, setPerson] = useState(null);
    const [said, setSaid] = useState(null);
    const [leaving, setLeaving] = useState(false);
    const [panel, setPanel] = useState(null);

    if (!R || !D || !run) {
      return (
        <Shell role={role} onNavigate={onNavigate} back={{ label: t("pyo2.back"), onBack: function () { onNavigate("pyRun"); } }}>
          <Card><EmptyState head={t("pyo2.back")} body={t("pyo2.none.body")} /></Card>
        </Shell>
      );
    }

    const live = run.state === "checking";
    const dirty = live && !ST.same(draft, run.work);
    const changes = ST.countWork(draft);

    /* going back lands on the month this run belongs to, not on
       whatever month the list last had open */
    function toList() {
      window.Pages3 = window.Pages3 || {};
      window.Pages3.pyRunMonth = month;
      onNavigate("pyRun");
    }
    function goBack() {
      if (dirty) { setLeaving(true); return; }
      toList();
    }
    function save() { ST.save(campus, month, draft); setSaid(t("pyo2.savedNow")); }
    function discard() { setDraft(ST.draftOf(campus, month)); setSaid(t("pyo2.discarded")); }

    const nav = { go: function (k) { onNavigate && onNavigate(k); } };

    /* ---- one person's month ---- */
    if (person) {
      const r = R.rowById(campus, person, rollMonth(month));
      if (r) {
        const work = live ? draft : ST.emptyWork();
        function patch(next) { setDraft(Object.assign({}, work, next)); }
        return (
          <Shell role={role} onNavigate={onNavigate}
            back={{ label: t("pyo2.pr.back"), onBack: function () { setPerson(null); setSaid(null); } }}>
            {dirty ? (
              <div style={{ marginBottom: 16 }}>
                <Card>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                    <span style={{ flex: 1, minWidth: 200 }}>
                      {changes === 1 ? t("pyo2.dirty1") : t("pyo2.dirty", { n: num(changes) })}
                    </span>
                    <Button size="sm" iconLeft="check" onClick={save}>{t("pyo2.save")}</Button>
                  </div>
                </Card>
              </div>
            ) : null}
            <Flash said={said} />
            <PayRecord
              r={r} month={month} work={work} live={live}
              onPanel={setPanel}
              onClaim={function (cl, row, how) {
                patch({ claims: Object.assign({}, work.claims, { [cl.id]: how }) });
                setSaid(t(how === "in" ? "pyo2.rc.paid" : "pyo2.rc.held", { name: row.name }));
              }}
              onUndo={function (kind, id) {
                const next = {};
                if (kind === "loan") { next.loans = Object.assign({}, work.loans); delete next.loans[id]; }
                if (kind === "claim") { next.claims = Object.assign({}, work.claims); delete next.claims[id]; }
                if (kind === "ot") { next.ot = Object.assign({}, work.ot); delete next.ot[id]; }
                if (kind === "advance") next.advances = work.advances.filter(function (a) { return a.staffId !== id; });
                patch(next); setSaid(null);
              }}
              onNavigate={nav}
            />
            {panel && panel.kind === "ask" ? (
              <AskPanel r={panel.r} onClose={function () { setPanel(null); }}
                onDone={function (note) {
                  patch({ marks: Object.assign({}, work.marks, { [panel.r.id]: { state: "asked", topicKey: askTopicKey(panel.r), note: note } }) });
                  setPanel(null); setSaid(t("pyo2.ask.done", { name: panel.r.name }));
                }} />
            ) : null}
            {panel && panel.kind === "fix" ? (
              <FixPanel r={panel.r} onClose={function () { setPanel(null); }}
                onDone={function () {
                  const row = panel.r;
                  if (row.issue.kind === "claimWaiting") {
                    const next = Object.assign({}, work.claims);
                    (row.claims || []).forEach(function (cl) { if (cl.overdue) next[cl.id] = "in"; });
                    patch({ claims: next });
                  } else if (row.issue.kind === "loanOverNet") {
                    patch({ loans: Object.assign({}, work.loans, { [row.id]: "skip" }) });
                  } else {
                    patch({ marks: Object.assign({}, work.marks, { [row.id]: { state: "fixed" } }) });
                  }
                  setPanel(null); setSaid(t("pyo2.fix.done", { name: row.name }));
                }} />
            ) : null}
            {panel && panel.kind === "skip" ? (
              <SkipPanel r={panel.r} onClose={function () { setPanel(null); }}
                onDone={function () {
                  patch({ loans: Object.assign({}, work.loans, { [panel.r.id]: "skip" }) });
                  setPanel(null); setSaid(t("pyo2.ln.skip.done", { name: panel.r.name }));
                }} />
            ) : null}
            {panel && panel.kind === "settle" ? (
              <SettlePanel r={panel.r} onClose={function () { setPanel(null); }}
                onDone={function () {
                  patch({ loans: Object.assign({}, work.loans, { [panel.r.id]: "settle" }) });
                  setPanel(null); setSaid(t("pyo2.ln.set.done", { name: panel.r.name }));
                }} />
            ) : null}
          </Shell>
        );
      }
    }

    return (
      <Shell role={role} onNavigate={onNavigate} back={{ label: t("pyo2.back"), onBack: goBack }}>
        {run.mode === "manual" ? (
          <ManualRun
            campus={campus} month={month} run={run}
            onSend={function () { ST.send(campus, month); setSaid(t("pyo2.send.done")); }}
            onNavigate={nav} said={said} onSaid={setSaid}
          />
        ) : (
          <AutoRun
            campus={campus} month={month} run={run}
            draft={draft} setDraft={setDraft} dirty={dirty}
            onSave={save} onDiscard={discard}
            onSend={function () { ST.save(campus, month, draft); ST.send(campus, month); setSaid(t("pyo2.send.done")); }}
            onRecord={function (id) { setPerson(id); setSaid(null); }}
            onNavigate={nav} said={said} onSaid={setSaid}
          />
        )}
        {leaving ? (
          <Modal
            title={t("pyo2.leave.title")} onClose={function () { setLeaving(false); }} danger
            footer={
              <React.Fragment>
                <Button kind="primary" iconLeft="check" onClick={function () { setLeaving(false); save(); }}>{t("pyo2.leave.stay")}</Button>
                <LinkButton onClick={function () { setLeaving(false); toList(); }}>{t("pyo2.leave.go")}</LinkButton>
              </React.Fragment>
            }
          >
            <p style={{ margin: 0 }}>{t("pyo2.leave.body", { n: num(changes) })}</p>
          </Modal>
        ) : null}
      </Shell>
    );
  }

  window.Pages3 = window.Pages3 || {};
  window.Pages3.PYRunOpen = PYRunOpen;
})();
