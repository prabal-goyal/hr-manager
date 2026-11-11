/* @jsxRuntime classic */
/* ============================================================
   Naveya — Pay rules · window.Pages3.PYRules

   REBUILT 2026-10-15. The module before this one answered a question
   nobody had asked: it showed four pay GROUPS, a component formula and
   a Labour Code verdict, and never once showed a person. An officer
   who opened it to find out why somebody is paid what they are paid
   left knowing only the shape of a rule.

   THE FIRST RULING (designer): "right now the user doesn't understand
   what is happening in pay rules. The pay rules should have full
   information in table format of the staff -- if it is 200 staff then
   show their individual info, with their salaries, loans or advances,
   reimbursements etc, everything should be displayed, but with simple
   language and figures."

   THE SECOND, the same day: "this is not what I wanted. I wanted the
   pay group tab to be the MAIN SCREEN, and when the user clicks on
   open pay group the information with the staff and their pay related
   info should be displayed IN THE SAME PAGE and not a side modal.
   Also remove the staff tab, as it is not necessary here differently."

   SO THERE ARE NO TABS AND NO MODAL.

   The module opens on the pay groups, because a group is what pay
   rules ARE -- the rule that prices everyone on it. Opening one
   replaces the page with that group: what it costs, how it pays, and
   then every person on it with their salary, their loan, their bills
   and their back pay. The staff list is not a second place to look;
   it is the bottom half of the group.

   Why not a side panel. A panel is for something you glance at and
   dismiss. A group holds two hundred people and a table that scrolls
   and pages; forcing that through 820 pixels beside a table you can
   no longer read is two screens fighting over one. The page is the
   affordance for a thing you go INTO.

   ONE SET OF FIGURES. The people and their money come from
   v3/payroll-roll.jsx, which is the run's own roll -- so a loan shown
   here is the loan deducted there, and both are the one in PY-13's
   register. The group rules come from py-salary.jsx's structures.

   WHO MAY CHANGE WHAT. Since 2026-10-15 a person's SALARY belongs to
   HR (see v3/pay-handoff.jsx). This screen shows it and never edits
   it. What payroll owns is the GROUP -- the rule that prices everyone
   on it.

   SPEC — docs/screen-inventory.md PY-02, PY-03, PY-04.
   ============================================================ */
(function () {
  const G3 = window.G3;
  const UI = window.UI3;
  const { useState, useMemo } = React;
  const {
    useTheme, ThemeToggle, useLang, addStrings,
    Rail, Motif, Card, Register, Button, LinkButton, StatusMark,
    ActionMenu, Input, Field, Modal, Icon, Avatar, EmptyState, BackBar,
    CampusSwitch, inCampus, CAMPUS_ALL,
    inr, num,
  } = UI;

  const R = window.NaveyaRoll;
  const S = (window.Pages3 && window.Pages3.PYSalData) || null;
  const PAGE = 25;

  addStrings({
    en: {
      "pyl.crumb": "Payroll",
      "pyl.entity": "Naveya Vidya Trust — Bengaluru",
      "pyl.title": "Pay rules",

      /* ---- the groups ---- */
      "pyl.g.sub": "A group decides how everyone on it is paid.",
      "pyl.g.new": "New pay group",
      "pyl.col.gname": "Pay group",
      "pyl.col.how": "How it pays",
      "pyl.col.heads": "Staff",
      "pyl.col.month": "This month",
      "pyl.col.state": "State",
      "pyl.how.ctc": "Monthly salary, split into parts",
      "pyl.how.hon": "Paid per lecture or day",
      "pyl.how.contract": "Fixed term",
      "pyl.st.ready": "Ready",
      "pyl.st.noRule": "No rule set",
      "pyl.st.empty": "Nobody on it",
      "pyl.g.total": "{n} groups",
      "pyl.act.open": "Open",
      "pyl.tab.groups": "Pay groups",

      /* ---- one group ---- */
      "pyl.d.back": "Pay rules",
      "pyl.d.parts": "What makes up the salary",
      "pyl.d.col.part": "Part",
      "pyl.d.col.how": "Worked out as",
      "pyl.d.col.pf": "Counts for PF",
      "pyl.d.col.sample": "At {money} basic",
      "pyl.d.sampleSub": "What one person on this group is paid.",
      "pyl.d.rate": "Rate card",
      "pyl.d.col.unit": "Paid for",
      "pyl.d.col.rate": "Rate",
      "pyl.d.col.cap": "Most in a month",
      "pyl.d.cost": "What it costs this month",
      "pyl.d.rateNote": "Rate times units, capped each month. Units are entered and approved by two different people.",
      "pyl.d.noRule.head": "No rule set",
      "pyl.d.noRule.body": "Nobody can be paid on this group until it has one.",
      "pyl.d.noRule.go": "Set the rule",
      "pyl.d.edit": "Change the rule",
      "pyl.d.editNote": "A change moves everyone on the group, from a date you pick.",

      /* ---- changing it (PY-03) ---- */
      "pyl.ch.title": "Change the rule",
      "pyl.ch.sub": "{g} — everyone on it is priced by this rule, so a change moves all {n} of them.",
      "pyl.ch.s1": "What changes",
      "pyl.ch.s2": "From when",
      "pyl.ch.s3": "What it does",
      "pyl.ch.s4": "Send it",
      "pyl.ch.next": "Next",
      "pyl.ch.back": "Back",
      "pyl.ch.cancel": "Cancel",
      "pyl.ch.send": "Send for approval",
      "pyl.ch.close": "Close",

      "pyl.ch.col.part": "Part",
      "pyl.ch.col.rule": "The rule",
      "pyl.ch.col.now": "Now",
      "pyl.ch.col.new": "After",
      "pyl.ch.sampleNote": "Priced at {money} basic on a {gross} salary — one real person on this group, so the change reads as money and not as algebra.",
      "pyl.ch.fixed": "HR sets the grade on each contract; a pay rule cannot touch it.",
      "pyl.ch.balance": "Whatever is left of the salary, so this one moves when the others do.",
      "pyl.ch.pctOf": "% of {of}",
      "pyl.ch.rupees": "rupees a month",
      "pyl.ch.noChange": "Nothing has changed yet. Edit a part, or close this.",
      "pyl.ch.overrun": "The parts now come to {v} more than the salary. Bring one of them down before this can go on.",
      "pyl.ch.total": "Monthly salary",
      "pyl.ch.same": "unchanged",

      "pyl.ch.when.head": "When does the new rule start?",
      "pyl.ch.when.sep": "From the September run",
      "pyl.ch.when.sepBody": "The first payslip priced on the new rule is September’s. Nobody is owed anything for the past.",
      "pyl.ch.when.aug": "From 1 August",
      "pyl.ch.when.augBody": "August is open on two campuses. A rule cannot move under a run somebody is still working.",
      "pyl.ch.when.jul": "From 1 July, with back pay",
      "pyl.ch.when.julBody": "July is paid, so {n} people would be owed the difference for one month. It is worked out into the September run as back pay.",
      "pyl.ch.when.blocked": "Not available",

      "pyl.ch.imp.salary": "Monthly salary",
      "pyl.ch.imp.salaryNote": "The balance part absorbs the change, so nobody’s salary moves.",
      "pyl.ch.imp.wage": "Counts for PF",
      "pyl.ch.imp.wageNote": "What both sides contribute on, at the rate in {v}.",
      "pyl.ch.imp.excl": "Excluded allowances",
      "pyl.ch.imp.exclNote": "The Code allows {n}% of the salary at most.",
      "pyl.ch.imp.arrow": "{a} → {b}",
      "pyl.ch.imp.who": "{n} people on this group move on {d}.",
      "pyl.ch.imp.arrear": "The same {n} are owed back pay for one month, worked into the September run.",
      "pyl.ch.ok.head": "Inside the Code",
      "pyl.ch.ok.body": "Excluded allowances come to {pct}% of the salary, under the {limit}% the Code allows.",
      "pyl.ch.bad.head": "This one is refused",
      "pyl.ch.bad.body": "Excluded allowances come to {pct}% of the salary. The Code allows {limit}%, so this is {v} too much — in {who}.",
      "pyl.ch.bad.fix": "Go back and bring one of them down.",

      "pyl.ch.why": "Why it is changing",
      "pyl.ch.whyHint": "The checker reads this, and it stays on the record for as long as the rule does.",
      "pyl.ch.whyPlace": "e.g. DA revised to 25% by the board resolution of 2 August",
      "pyl.ch.whyErr": "Say why. A rule change with no reason cannot be reviewed.",
      "pyl.ch.maker": "Proposed by",
      "pyl.ch.checker": "Approved by",
      "pyl.ch.guard": "Nothing changes until {who} approves it, and you cannot approve your own change.",
      "pyl.ch.summary": "What you are sending",
      "pyl.ch.sum.one": "{a} becomes {b}",
      "pyl.ch.done.head": "Sent to {who}",
      "pyl.ch.done.body": "The rule is unchanged until they approve it. You will see it on this page either way.",

      "pyl.pend.head": "A change to this rule is with {who}",
      "pyl.pend.from": "From {d}, proposed {ago}",
      "pyl.pend.today": "today",
      "pyl.pend.withdraw": "Withdraw it",
      "pyl.pend.cta": "With the checker",
      "pyl.yes": "Yes",
      "pyl.no": "No",
      "pyl.d.how.grade": "The grade on the contract",
      "pyl.d.how.pct": "{n}% of {of}",
      "pyl.d.how.flat": "A fixed amount",
      "pyl.d.how.balance": "Whatever is left of the salary",
      "pyl.d.totalRow": "Monthly salary",

      /* ---- the staff on it ---- */
      "pyl.s.title": "Who is paid what",
      "pyl.s.sub": "What each person is paid, and what comes off it.",
      "pyl.s.search": "Search a name or number",
      "pyl.s.allOwing": "Everyone",
      "pyl.s.loans": "Has a loan",
      "pyl.s.claims": "Has a bill waiting",
      "pyl.s.noPay": "No salary yet",
      "pyl.col.staff": "Staff",
      "pyl.col.salary": "Monthly salary",
      "pyl.col.loan": "Loan or advance",
      "pyl.col.claim": "Bills waiting",
      "pyl.col.arrear": "Back pay",
      "pyl.loan.line": "{emi} a month",
      "pyl.loan.last": "last instalment",
      "pyl.k.loan": "Loan",
      "pyl.k.advance": "Advance",
      "pyl.noPay": "HR has not set it",
      "pyl.showing": "Showing {a} of {b}",
      "pyl.more": "Show {n} more",
      "pyl.none.head": "Nobody here",
      "pyl.none.body": "Try another filter, or clear the search.",
      "pyl.total": "{n} people",
      "pyl.a.record": "Open pay record",
      "pyl.a.run": "See them in the run",

      /* ---- the four figures ---- */
      "pyl.d.line": "{n} people, {pay} on a salary",
      "pyl.d.lineLoan": "{n} paying back {money}",
      "pyl.d.lineClaim": "{n} waiting on {money}",
    },
  });

  /* ============================================================
     SHELL
     ============================================================ */
  function Shell({ role, onNavigate, campus, onCampus, back, children }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const L = G3.layout;
    return (
      <div className="nv3" style={{ display: "flex", minHeight: "100vh", background: c.page, color: c.ink, fontFamily: G3.font.ui }}>
        <Rail role={role || "payrollOfficer"} active="pyRules" onNavigate={onNavigate} initials="SK" />
        <main style={{ flex: 1, minWidth: 0, position: "relative", overflowX: "clip" }}>
          <Motif />
          <div style={{ position: "relative", zIndex: 1, maxWidth: L.contentMax, margin: "0 auto",
                        padding: "22px " + L.contentPadX + "px 56px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, marginBottom: 16 }}>
              <div style={ty("small", { color: c.inkMuted })}>
                <span style={{ color: c.ink, fontWeight: 700 }}>{t("pyl.crumb")}</span>
                <span style={{ margin: "0 8px", color: c.inkFaint }} aria-hidden="true">&middot;</span>
                <span>{t("pyl.entity")}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {onCampus ? <CampusSwitch value={campus} onChange={onCampus} size="sm" /> : null}
                <ThemeToggle />
              </div>
            </div>
            {back ? <div style={{ marginBottom: 16 }}><BackBar label={t("pyl.d.back")} onBack={back} /></div> : null}
            {children}
          </div>
        </main>
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

  /* A register that answers an empty result in ONE card. `Register`
     always draws its column strip, which with no rows is a table that
     is not a table -- so when nothing matches, the same card keeps the
     heading, the search and the chips, and the empty state stands
     where the rows would be. The way out of an empty result is the
     control that caused it, so the controls do not go anywhere. */
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

  /* ============================================================
     1 · THE PAY GROUPS — the screen the module opens on, laid out
     like the run, because the run is what a group produces
     ============================================================ */
  function howKey(g) {
    return g.kind === "ctc" ? "pyl.how.ctc" : g.kind === "hon" ? "pyl.how.hon" : "pyl.how.contract";
  }

  function GroupList({ campus, onOpen }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    if (!S) return <Card><EmptyState head={t("pyl.tab.groups")} body={t("pyl.none.body")} /></Card>;

    const roll = R.roll("all").filter(function (r) { return inCampus(campus, r.campus); });
    const count = {}, cost = {};
    roll.forEach(function (r) {
      count[r.group] = (count[r.group] || 0) + 1;
      cost[r.group] = (cost[r.group] || 0) + r.gross;
    });

    const rows = S.PAY_GROUPS.map(function (g) {
      const n = count[g.key] || 0;
      const ready = g.kind === "hon" ? !!g.rules : !!g.structure;
      return {
        id: g.key,
        tone: n ? null : "dim",
        cells: {
          gname: <span style={ty("small", { color: c.ink, fontWeight: 700 })}>{t(g.nameKey)}</span>,
          how: <span style={ty("small", { color: c.inkMuted })}>{t(howKey(g))}</span>,
          heads: n ? num(n) : "—",
          month: n ? inr(cost[g.key]) : "—",
          state: !ready
            ? <StatusMark role="absent" glyph="alert" word={t("pyl.st.noRule")} />
            : n ? <StatusMark role="present" glyph="check" word={t("pyl.st.ready")} />
              : <StatusMark role="off" glyph="arrow" word={t("pyl.st.empty")} />,
          act: <Button size="sm" iconRight="arrow" onClick={function () { onOpen(g.key); }}>{t("pyl.act.open")}</Button>,
        },
      };
    });

    const heads = roll.length;
    const total = roll.reduce(function (s, r) { return s + r.gross; }, 0);

    return (
      <Register
        title={t("pyl.tab.groups")}
        sub={t("pyl.g.sub")}
        action={<Button size="sm" iconLeft="plus">{t("pyl.g.new")}</Button>}
        columns={[
          { key: "gname", label: t("pyl.col.gname") },
          { key: "how", label: t("pyl.col.how"), width: 250 },
          { key: "heads", label: t("pyl.col.heads"), align: "right", mono: true, width: 100 },
          { key: "month", label: t("pyl.col.month"), align: "right", mono: true, width: 170 },
          { key: "state", label: t("pyl.col.state"), width: 150 },
          { key: "act", label: "", align: "right", width: 110 },
        ]}
        rows={rows}
        totals={{ label: t("pyl.g.total", { n: num(S.PAY_GROUPS.length) }), cells: { heads: num(heads), month: inr(total) } }}
      />
    );
  }

  /* ============================================================
     2 · ONE GROUP — the rule, and then everybody it prices
     ============================================================ */

  /* A component says how it is worked out in words. "pct 20 of BASIC"
     is algebra; "20% of basic pay" is a sentence an officer can check
     against a contract. */
  function howLine(t, cp) {
    if (cp.calc === "grade") return t("pyl.d.how.grade");
    if (cp.calc === "pct") return t("pyl.d.how.pct", { n: num(cp.pct), of: t("pys3.c." + cp.of) });
    if (cp.calc === "flat") return t("pyl.d.how.flat");
    return t("pyl.d.how.balance");
  }


  /* ============================================================
     CHANGING THE RULE (PY-03)

     The one act this module owns, and until now a secondary button
     wired to nothing (designer: "add the full flow and screens for
     the change-the-rule CTA, and make the CTA primary").

     WHY IT IS FOUR STEPS AND NOT A FORM. A pay rule prices 268
     people. Typing a new percentage into a table and pressing Save
     would be the whole of it on screen, and none of it in the
     officer's head -- so the flow makes them read, in order, the
     three things a form hides:

       what changes   the parts, priced at one real person's basic,
                      so the edit reads as money and not as algebra
       from when      the one answer that decides whether anybody is
                      owed back pay -- and the one date that is
                      refused, because a run somebody is working
                      cannot have the rule move under it
       what it does   the salary does NOT move (the balance part
                      absorbs it); what moves is the WAGE BASE, and
                      with it everything PF is worked out on. A
                      change that pushes the excluded allowances past
                      the Code's share is refused here, by name and
                      by amount.

     AND IT ENDS WITH A CHECKER. Payroll's own maker-checker rule:
     the officer proposes, the accountant approves, and nothing moves
     in between. The reason is required and stays on the record.

     NO DISABLED SUBMIT. A greyed-out button swallows the click that
     would have said why -- a lesson this codebase has learned twice.
     Every step's forward button is live and answers with the reason
     it cannot go on.
     ============================================================ */
  const PENDING = {};
  const pendingListeners = [];
  function emitPending() { pendingListeners.forEach(function (fn) { fn(); }); }
  function usePending() {
    const [, bump] = useState(0);
    React.useEffect(function () {
      const fn = function () { bump(function (n) { return n + 1; }); };
      pendingListeners.push(fn);
      return function () {
        const i = pendingListeners.indexOf(fn);
        if (i >= 0) pendingListeners.splice(i, 1);
      };
    }, []);
    return PENDING;
  }

  function Area({ id, value, onChange, rows, placeholder, invalid }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <textarea
        id={id} rows={rows || 3} value={value} placeholder={placeholder}
        onChange={function (e) { onChange(e.target.value); }}
        aria-invalid={invalid ? "true" : undefined}
        style={ty("small", {
          width: "100%", resize: "vertical", padding: "11px 13px",
          borderRadius: G3.r.md, background: c.surface, color: c.ink,
          border: "1px solid " + (invalid ? c.danger : c.borderStrong),
          fontFamily: "inherit",
        })}
      />
    );
  }

  /* where the reader is, and how far there is to go. Four words, not
     four numbered circles: the words ARE the steps. */
  function Steps({ at, labels }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {labels.map(function (w, i) {
          const here = i === at, done = i < at;
          return (
            <span key={w} style={ty("caption", {
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "5px 11px", borderRadius: G3.r.pill,
              background: here ? c.accentSoft : done ? c.sunken : "transparent",
              border: "1px solid " + (here ? c.accent : done ? c.rule : "transparent"),
              color: here ? c.accent : done ? c.inkMuted : c.inkFaint,
              fontWeight: here ? 700 : 500,
            })}>
              {done ? <span aria-hidden="true" style={{ display: "flex" }}><Icon name="check" size={11} /></span> : null}
              {w}
            </span>
          );
        })}
      </div>
    );
  }

  function Pair({ label, now, next, note, warn }) {
    const { c } = useTheme();
    const { ty } = useLang();
    const { t } = useLang();
    return (
      <div style={{ flex: "1 1 210px", minWidth: 0 }}>
        <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" })}>{label}</div>
        <div style={G3.fig("md", { color: warn ? c.dangerText : c.ink, fontWeight: 700, marginTop: 6 })}>
          {now === next ? now + " " : t("pyl.ch.imp.arrow", { a: now, b: next })}
          {now === next ? <span style={ty("caption", { color: c.inkMuted, fontWeight: 400 })}>{t("pyl.ch.same")}</span> : null}
        </div>
        {note ? <div style={ty("caption", { color: c.inkMuted, marginTop: 6 })}>{note}</div> : null}
      </div>
    );
  }

  function Person({ label, who }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    return (
      <div style={{ minWidth: 0 }}>
        <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" })}>{label}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 7 }}>
          <Avatar name={t(who.nameKey)} size={26} />
          <div style={{ minWidth: 0 }}>
            <div style={ty("caption", { color: c.ink, fontWeight: 700 })}>{t(who.nameKey)}</div>
            <div style={ty("caption", { color: c.inkFaint })}>{t(who.roleKey)}</div>
          </div>
        </div>
      </div>
    );
  }

  const BASIC_SAMPLE = 39500, GROSS_SAMPLE = 94800;

  function ChangeRule({ g, struct, heads, onClose }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [step, setStep] = useState(0);
    const [err, setErr] = useState(null);
    const [when, setWhen] = useState("2026-09-01");
    const [why, setWhy] = useState("");
    const [sent, setSent] = useState(null);
    const [draft, setDraft] = useState(function () {
      const d = {};
      struct.comps.forEach(function (cp) {
        if (cp.calc === "pct") d[cp.code] = String(cp.pct);
        if (cp.calc === "flat") d[cp.code] = String(cp.value);
      });
      return d;
    });

    function fmtAt(at) { return at.d + " " + t("pyr.mon." + at.m) + " " + at.y; }

    const after = Object.assign({}, struct, {
      comps: struct.comps.map(function (cp) {
        if (cp.calc === "pct") return Object.assign({}, cp, { pct: Number(draft[cp.code]) || 0 });
        if (cp.calc === "flat") return Object.assign({}, cp, { value: Number(draft[cp.code]) || 0 });
        return cp;
      }),
    });
    const now = S.priceComponents(struct, BASIC_SAMPLE, GROSS_SAMPLE);
    const next = S.priceComponents(after, BASIC_SAMPLE, GROSS_SAMPLE);
    const vNow = S.wageVerdict(now);
    const vNext = S.wageVerdict(next);
    const bal = next.filter(function (l) { return l.cp.calc === "balance"; })[0];
    const overrun = bal && bal.v < 0 ? -bal.v : 0;
    const moved = struct.comps.filter(function (cp) {
      if (cp.calc === "pct") return Number(draft[cp.code]) !== cp.pct;
      if (cp.calc === "flat") return Number(draft[cp.code]) !== cp.value;
      return false;
    });
    const LIMIT = S.WAGE_RULE.excludedMaxPctOfTotal;
    const refused = vNext.state === "over";

    const WHENS = [
      { k: "2026-09-01", at: { d: 1, m: 9, y: 2026 },
        head: t("pyl.ch.when.sep"), body: t("pyl.ch.when.sepBody") },
      { k: "2026-08-01", at: { d: 1, m: 8, y: 2026 }, blocked: true,
        head: t("pyl.ch.when.aug"), body: t("pyl.ch.when.augBody") },
      { k: "2026-07-01", at: { d: 1, m: 7, y: 2026 }, arrears: true,
        head: t("pyl.ch.when.jul"), body: t("pyl.ch.when.julBody", { n: num(heads) }) },
    ];
    const chosen = WHENS.filter(function (w) { return w.k === when; })[0] || WHENS[0];

    const LABELS = [t("pyl.ch.s1"), t("pyl.ch.s2"), t("pyl.ch.s3"), t("pyl.ch.s4")];

    function forward() {
      setErr(null);
      if (step === 0) {
        if (overrun) { setErr(t("pyl.ch.overrun", { v: inr(overrun) })); return; }
        if (!moved.length) { setErr(t("pyl.ch.noChange")); return; }
      }
      if (step === 2 && refused) { setErr(t("pyl.ch.bad.fix")); return; }
      if (step === 3) {
        if (!why.trim()) { setErr(t("pyl.ch.whyErr")); return; }
        PENDING[g.key] = {
          moved: moved.map(function (cp) {
            return {
              code: cp.code,
              a: cp.calc === "pct" ? cp.pct + "%" : inr(cp.value),
              b: cp.calc === "pct" ? (Number(draft[cp.code]) || 0) + "%" : inr(Number(draft[cp.code]) || 0),
            };
          }),
          fromKey: chosen.k, from: fmtAt(chosen.at), arrears: !!chosen.arrears,
          why: why.trim(), by: S.MAKER, to: S.CHECKER,
        };
        emitPending();
        setSent(S.CHECKER);
        return;
      }
      setStep(step + 1);
    }

    /* ---- step 1 · the parts ---- */
    function partRow(ln, i) {
      const cp = ln.cp;
      const was = now[i];
      const delta = Math.round(ln.v - was.v);
      const editable = cp.calc === "pct" || cp.calc === "flat";
      return (
        <tr key={cp.code} style={{ borderBottom: i < next.length - 1 ? "1px solid " + c.rule : "none" }}>
          <td style={ty("small", { padding: "10px 10px", color: c.ink, fontWeight: 600 })}>{t("pys3.c." + cp.code)}</td>
          <td style={{ padding: "10px 10px" }}>
            {editable ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, maxWidth: 190 }}>
                <div style={{ width: 92 }}>
                  <Input
                    id={"pyl-ch-" + cp.code} size="sm" inputMode="numeric"
                    ariaLabel={t("pys3.c." + cp.code)}
                    value={draft[cp.code]}
                    onChange={function (v) {
                      setErr(null);
                      setDraft(Object.assign({}, draft, { [cp.code]: v.replace(/[^0-9.]/g, "") }));
                    }}
                  />
                </div>
                <span style={ty("caption", { color: c.inkMuted })}>
                  {cp.calc === "pct" ? t("pyl.ch.pctOf", { of: t("pys3.c." + cp.of) }) : t("pyl.ch.rupees")}
                </span>
              </div>
            ) : (
              <span style={ty("caption", { color: c.inkFaint })}>
                {cp.calc === "grade" ? t("pyl.ch.fixed") : t("pyl.ch.balance")}
              </span>
            )}
          </td>
          <td style={G3.fig("sm", { padding: "10px 10px", textAlign: "right", color: c.inkMuted })}>{inr(was.v)}</td>
          <td style={{ padding: "10px 10px", textAlign: "right" }}>
            <span style={G3.fig("sm", { color: ln.v < 0 ? c.dangerText : c.ink, fontWeight: 700, display: "block" })}>{inr(ln.v)}</span>
            {delta ? (
              <span style={ty("caption", { color: c.inkMuted, display: "block", marginTop: 1 })}>
                {(delta > 0 ? "+" : "−") + inr(Math.abs(delta))}
              </span>
            ) : null}
          </td>
        </tr>
      );
    }

    const th = function (label, right) {
      return (
        <th scope="col" style={ty("colLabel", {
          color: c.inkFaint, textAlign: right ? "right" : "left",
          padding: "0 10px 9px", textTransform: "uppercase", whiteSpace: "nowrap",
        })}>{label}</th>
      );
    };

    let body = null;
    if (sent) {
      body = (
        <div style={{ textAlign: "center", padding: "14px 10px 8px" }}>
          <span aria-hidden="true" style={{
            width: 46, height: 46, borderRadius: G3.r.pill, margin: "0 auto",
            background: c.presentTint, color: c.presentText,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon name="check" size={22} />
          </span>
          <h3 style={ty("h3", { margin: "14px 0 0", color: c.ink })}>{t("pyl.ch.done.head", { who: t(sent.nameKey) })}</h3>
          <p style={ty("small", { margin: "7px auto 0", color: c.inkMuted, maxWidth: 420 })}>{t("pyl.ch.done.body")}</p>
        </div>
      );
    } else if (step === 0) {
      body = (
        <div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid " + c.ruleStrong }}>
                {th(t("pyl.ch.col.part"))}{th(t("pyl.ch.col.rule"))}
                {th(t("pyl.ch.col.now"), true)}{th(t("pyl.ch.col.new"), true)}
              </tr>
            </thead>
            <tbody>{next.map(partRow)}</tbody>
            <tfoot>
              <tr style={{ borderTop: "2px solid " + c.ruleStrong }}>
                <td colSpan={2} style={ty("small", { padding: "12px 10px", color: c.ink, fontWeight: 700 })}>{t("pyl.ch.total")}</td>
                <td style={G3.fig("sm", { padding: "12px 10px", textAlign: "right", color: c.inkMuted })}>{inr(GROSS_SAMPLE)}</td>
                <td style={G3.fig("md", { padding: "12px 10px", textAlign: "right", color: c.ink, fontWeight: 700 })}>{inr(GROSS_SAMPLE)}</td>
              </tr>
            </tfoot>
          </table>
          <p style={ty("caption", { color: c.inkFaint, margin: "15px 0 0" })}>
            {t("pyl.ch.sampleNote", { money: inr(BASIC_SAMPLE), gross: inr(GROSS_SAMPLE) })}
          </p>
        </div>
      );
    } else if (step === 1) {
      body = (
        <div role="radiogroup" aria-label={t("pyl.ch.when.head")} style={{ display: "grid", gap: 12 }}>
          {WHENS.map(function (w) {
            const on = when === w.k;
            return (
              <button
                key={w.k} type="button" role="radio" aria-checked={on ? "true" : "false"}
                aria-disabled={w.blocked ? "true" : undefined}
                onClick={function () { if (!w.blocked) { setErr(null); setWhen(w.k); } }}
                style={{
                  display: "flex", gap: 13, alignItems: "flex-start", textAlign: "left",
                  cursor: w.blocked ? "not-allowed" : "pointer",
                  border: "1px solid " + (on ? c.accent : c.border),
                  background: on ? c.accentSoft : w.blocked ? c.alt : c.surface,
                  borderRadius: G3.r.md, padding: "14px 16px", opacity: w.blocked ? 0.75 : 1,
                }}
              >
                <span aria-hidden="true" style={{
                  flex: "0 0 auto", width: 28, height: 28, borderRadius: G3.r.pill,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: on ? c.surface : c.sunken, color: w.blocked ? c.dangerText : on ? c.accent : c.inkMuted,
                }}>
                  <Icon name={w.blocked ? "lock" : w.arrears ? "clock" : "check"} size={14} />
                </span>
                <span style={{ minWidth: 0 }}>
                  <span style={ty("small", { display: "block", color: on ? c.accent : c.ink, fontWeight: 700 })}>{w.head}</span>
                  <span style={ty("caption", { display: "block", color: c.inkMuted, marginTop: 4 })}>{w.body}</span>
                  {w.blocked ? (
                    <span style={ty("caption", { display: "block", color: c.dangerText, fontWeight: 700, marginTop: 6 })}>
                      {t("pyl.ch.when.blocked")}
                    </span>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
      );
    } else if (step === 2) {
      body = (
        <div>
          <div style={{ display: "flex", gap: 22, flexWrap: "wrap" }}>
            <Pair label={t("pyl.ch.imp.salary")} now={inr(GROSS_SAMPLE)} next={inr(GROSS_SAMPLE)}
              note={t("pyl.ch.imp.salaryNote")} />
            <Pair label={t("pyl.ch.imp.wage")} now={inr(vNow.wages)} next={inr(vNext.wages)}
              note={t("pyl.ch.imp.wageNote", { v: S.CFG_PINNED.v })} />
            <Pair label={t("pyl.ch.imp.excl")} warn={refused}
              now={Math.round(vNow.share) + "%"} next={Math.round(vNext.share) + "%"}
              note={t("pyl.ch.imp.exclNote", { n: num(LIMIT) })} />
          </div>

          <div style={{
            marginTop: 20, borderRadius: G3.r.md, padding: "14px 16px",
            background: refused ? c.dangerTint : c.presentTint,
            border: "1px solid " + (refused ? c.danger : c.border),
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <span aria-hidden="true" style={{ display: "flex", color: refused ? c.dangerText : c.presentText }}>
                <Icon name={refused ? "alert" : "check"} size={16} />
              </span>
              <span style={ty("small", { color: refused ? c.dangerText : c.presentText, fontWeight: 700 })}>
                {t(refused ? "pyl.ch.bad.head" : "pyl.ch.ok.head")}
              </span>
            </div>
            <p style={ty("caption", { color: c.ink, margin: "8px 0 0" })}>
              {refused
                ? t("pyl.ch.bad.body", {
                  pct: Math.round(vNext.share), limit: num(LIMIT), v: inr(vNext.over),
                  who: vNext.offenders.map(function (l) { return t("pys3.c." + l.code); }).join(", "),
                })
                : t("pyl.ch.ok.body", { pct: Math.round(vNext.share), limit: num(LIMIT) })}
            </p>
          </div>

          <p style={ty("small", { color: c.inkMuted, margin: "18px 0 0" })}>
            {t("pyl.ch.imp.who", { n: num(heads), d: fmtAt(chosen.at) })}
          </p>
          {chosen.arrears ? (
            <p style={ty("small", { color: c.lateText, fontWeight: 600, margin: "6px 0 0" })}>
              {t("pyl.ch.imp.arrear", { n: num(heads) })}
            </p>
          ) : null}
        </div>
      );
    } else {
      body = (
        <div>
          <div style={{ borderRadius: G3.r.md, background: c.alt, padding: "14px 16px", marginBottom: 20 }}>
            <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" })}>
              {t("pyl.ch.summary")}
            </div>
            {moved.map(function (cp) {
              const a = cp.calc === "pct" ? cp.pct + "%" : inr(cp.value);
              const b = cp.calc === "pct" ? (Number(draft[cp.code]) || 0) + "%" : inr(Number(draft[cp.code]) || 0);
              return (
                <div key={cp.code} style={ty("small", { color: c.ink, marginTop: 7 })}>
                  <strong>{t("pys3.c." + cp.code)}</strong> — {t("pyl.ch.sum.one", { a: a, b: b })}
                </div>
              );
            })}
            <div style={ty("caption", { color: c.inkMuted, marginTop: 9 })}>{chosen.head}</div>
          </div>

          <Field id="pyl-why" label={t("pyl.ch.why")} hint={t("pyl.ch.whyHint")}
            error={err && !why.trim() ? err : null}>
            <Area id="pyl-why" value={why} rows={3} placeholder={t("pyl.ch.whyPlace")}
              invalid={!!(err && !why.trim())}
              onChange={function (v) { setWhy(v); if (v.trim()) setErr(null); }} />
          </Field>

          <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
            <Person label={t("pyl.ch.maker")} who={S.MAKER} />
            <Person label={t("pyl.ch.checker")} who={S.CHECKER} />
          </div>
          <p style={ty("caption", { color: c.inkFaint, margin: "16px 0 0" })}>
            {t("pyl.ch.guard", { who: t(S.CHECKER.nameKey) })}
          </p>
        </div>
      );
    }

    return (
      <Modal
        title={t("pyl.ch.title")}
        sub={t("pyl.ch.sub", { g: t(g.nameKey), n: num(heads) })}
        width={760}
        onClose={onClose}
        footer={sent ? (
          <Button kind="primary" onClick={onClose}>{t("pyl.ch.close")}</Button>
        ) : (
          <React.Fragment>
            <Button kind="primary" iconRight={step === 3 ? null : "arrow"} onClick={forward}>
              {t(step === 3 ? "pyl.ch.send" : "pyl.ch.next")}
            </Button>
            {step ? <LinkButton onClick={function () { setErr(null); setStep(step - 1); }}>{t("pyl.ch.back")}</LinkButton>
              : <LinkButton onClick={onClose}>{t("pyl.ch.cancel")}</LinkButton>}
          </React.Fragment>
        )}
      >
        {sent ? null : <Steps at={step} labels={LABELS} />}
        {body}
        {/* THE REFUSAL SITS WHERE THE HAND IS, not at the top of a
            sheet the reader has already scrolled past. */}
        {err && !(step === 3 && !why.trim()) ? (
          <p role="alert" style={ty("small", { color: c.dangerText, fontWeight: 600, margin: "16px 0 0" })}>{err}</p>
        ) : null}
      </Modal>
    );
  }

  /* what the group page says while a change is out for approval */
  function PendingNote({ p, onWithdraw }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    return (
      <div style={{
        display: "flex", alignItems: "flex-start", gap: 13, flexWrap: "wrap",
        background: c.lateTint || c.alt, border: "1px solid " + c.border,
        borderRadius: G3.r.md, padding: "13px 16px", marginBottom: 18,
      }}>
        <span aria-hidden="true" style={{ display: "flex", color: c.lateText, marginTop: 1 }}>
          <Icon name="clock" size={16} />
        </span>
        <div style={{ flex: "1 1 320px", minWidth: 0 }}>
          <div style={ty("small", { color: c.ink, fontWeight: 700 })}>
            {t("pyl.pend.head", { who: t(p.to.nameKey) })}
          </div>
          <div style={ty("caption", { color: c.inkMuted, marginTop: 4 })}>
            {p.moved.map(function (m) {
              return t("pys3.c." + m.code) + " " + t("pyl.ch.sum.one", { a: m.a, b: m.b });
            }).join(" · ")}
          </div>
          <div style={ty("caption", { color: c.inkFaint, marginTop: 4 })}>
            {t("pyl.pend.from", { d: p.from, ago: t("pyl.pend.today") })}
          </div>
        </div>
        <span style={{ flexShrink: 0, alignSelf: "center" }}>
          <LinkButton onClick={onWithdraw}>{t("pyl.pend.withdraw")}</LinkButton>
        </span>
      </div>
    );
  }

  function RuleCard({ g, struct }) {
    const { c } = useTheme();
    const { t, ty } = useLang();

    /* an example priced at a real grade basic, so the rule is read as
       money rather than as algebra. Ananya Rao's basic, which the run
       and the payslip both already use. */
    const BASIC = 39500, GROSS = 94800;
    const sample = struct ? S.priceComponents(struct, BASIC, GROSS) : null;

    if (sample) {
      return (
        <Card title={t("pyl.d.parts")} sub={t("pyl.d.sampleSub")}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid " + c.ruleStrong }}>
                {[t("pyl.d.col.part"), t("pyl.d.col.how"), t("pyl.d.col.pf"), t("pyl.d.col.sample", { money: inr(BASIC) })].map(function (h, i) {
                  return (
                    <th key={h} scope="col" style={ty("colLabel", {
                      color: c.inkFaint, textAlign: i > 1 ? "right" : "left",
                      padding: "0 10px 9px", textTransform: "uppercase", whiteSpace: "nowrap",
                    })}>{h}</th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {sample.map(function (ln, i) {
                return (
                  <tr key={ln.code} style={{ borderBottom: i < sample.length - 1 ? "1px solid " + c.rule : "none" }}>
                    <td style={ty("small", { padding: "11px 10px", color: c.ink, fontWeight: 600 })}>{t("pys3.c." + ln.code)}</td>
                    <td style={ty("small", { padding: "11px 10px", color: c.inkMuted })}>{howLine(t, ln.cp)}</td>
                    <td style={{ padding: "11px 10px", textAlign: "right" }}>
                      <span style={ty("caption", { color: ln.cp.pf ? c.presentText : c.inkFaint, fontWeight: 600 })}>
                        {ln.cp.pf ? t("pyl.yes") : t("pyl.no")}
                      </span>
                    </td>
                    <td style={G3.fig("sm", { padding: "11px 10px", textAlign: "right", color: c.ink, fontWeight: 600 })}>{inr(ln.v)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: "2px solid " + c.ruleStrong }}>
                <td colSpan={3} style={ty("small", { padding: "13px 10px", color: c.ink, fontWeight: 700 })}>{t("pyl.d.totalRow")}</td>
                <td style={G3.fig("md", { padding: "13px 10px", textAlign: "right", color: c.ink, fontWeight: 700 })}>{inr(GROSS)}</td>
              </tr>
            </tfoot>
          </table>
          <p style={ty("caption", { color: c.inkFaint, margin: "16px 0 0" })}>{t("pyl.d.editNote")}</p>
        </Card>
      );
    }

    /* rate x units is the whole logic of an honorarium group, so the
       rate card stands where a structure's parts would */
    if (g.kind === "hon" && S.HON_RULES) {
      return (
        <Card title={t("pyl.d.rate")}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid " + c.ruleStrong }}>
                {[t("pyl.d.col.unit"), t("pyl.d.col.rate"), t("pyl.d.col.cap"), t("pyl.col.heads")].map(function (h, i) {
                  return (
                    <th key={h} scope="col" style={ty("colLabel", {
                      color: c.inkFaint, textAlign: i ? "right" : "left",
                      padding: "0 10px 9px", textTransform: "uppercase", whiteSpace: "nowrap",
                    })}>{h}</th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {S.HON_RULES.map(function (r, i) {
                return (
                  <tr key={r.key} style={{ borderBottom: i < S.HON_RULES.length - 1 ? "1px solid " + c.rule : "none" }}>
                    <td style={ty("small", { padding: "11px 10px", color: c.ink, fontWeight: 600 })}>{t("pys4.unit." + r.unit)}</td>
                    <td style={G3.fig("sm", { padding: "11px 10px", textAlign: "right", color: c.ink, fontWeight: 600 })}>{inr(r.rate)}</td>
                    <td style={G3.fig("sm", { padding: "11px 10px", textAlign: "right", color: c.inkMuted })}>{inr(r.cap)}</td>
                    <td style={G3.fig("sm", { padding: "11px 10px", textAlign: "right", color: c.inkMuted })}>{num(r.people)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p style={ty("caption", { color: c.inkFaint, margin: "16px 0 0" })}>{t("pyl.d.rateNote")}</p>
        </Card>
      );
    }

    return (
      <Card>
        <EmptyState
          head={t("pyl.d.noRule.head")} body={t("pyl.d.noRule.body")}
          action={<Button kind="primary">{t("pyl.d.noRule.go")}</Button>}
        />
      </Card>
    );
  }

  function GroupPage({ gkey, campus, onNavigate }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const L = G3.layout;
    const [q, setQ] = useState("");
    const [only, setOnly] = useState("all");
    const [shown, setShown] = useState(PAGE);
    const [changing, setChanging] = useState(false);
    const pend = usePending()[gkey];

    const g = S.groupByKey(gkey);
    const struct = g && g.structure ? S.structByKey(g.structure) : null;
    const ready = g.kind === "hon" ? !!g.rules : !!struct;

    const roll = useMemo(function () {
      return R.roll("all").filter(function (r) { return inCampus(campus, r.campus) && r.group === gkey; });
    }, [campus, gkey]);

    const cost = roll.reduce(function (s, r) { return s + r.gross; }, 0);
    const onPay = roll.filter(function (r) { return r.monthly > 0; }).length;
    const wages = roll.reduce(function (s, r) { return s + r.monthly; }, 0);
    const lent = roll.reduce(function (s, r) { return s + (r.loan ? r.loan.balance : 0); }, 0);
    const owed = roll.reduce(function (s, r) { return s + (r.claimTotal || 0); }, 0);
    const withLoan = roll.filter(function (r) { return r.loan; }).length;
    const withClaim = roll.filter(function (r) { return r.claimTotal; }).length;
    const noPay = roll.length - onPay;

    const filtered = roll.filter(function (r) {
      if (only === "loans" && !r.loan) return false;
      if (only === "claims" && !r.claimTotal) return false;
      if (only === "nopay" && r.monthly > 0) return false;
      if (q && (r.name + " " + r.id).toLowerCase().indexOf(q.toLowerCase()) === -1) return false;
      return true;
    });
    const page = filtered.slice(0, shown);
    function reset(fn) { return function (v) { fn(v); setShown(PAGE); }; }

    const filters = [
      { k: "all", label: t("pyl.s.allOwing"), n: roll.length },
      { k: "loans", label: t("pyl.s.loans"), n: withLoan },
      { k: "claims", label: t("pyl.s.claims"), n: withClaim },
      { k: "nopay", label: t("pyl.s.noPay"), n: noPay, tone: noPay ? "alert" : null },
    ];

    function openRecord(id) {
      /* the run owns the pay record, because it is the only screen
         that knows all four hundred people. The flat router carries
         no props, so the id goes across on window.Pages3 and is
         consumed once. */
      window.Pages3 = window.Pages3 || {};
      window.Pages3.pyRunPerson = id;
      onNavigate && onNavigate("pyRun");
    }

    const rows = page.map(function (r) {
      const l = r.loan;
      return {
        id: r.id,
        cells: {
          staff: (
            <span style={{ display: "block", minWidth: 0 }}>
              <span style={ty("small", { display: "block", color: c.ink, fontWeight: 700 })}>{r.name}</span>
              <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 1 })}>
                {r.id} · {t(r.desigKey)}
              </span>
            </span>
          ),
          salary: r.monthly ? inr(r.monthly) : (
            <span style={ty("caption", { color: c.absentText, fontWeight: 600 })}>{t("pyl.noPay")}</span>
          ),
          loan: l ? (
            <span style={{ display: "block" }}>
              <span style={G3.fig("sm", { display: "block", color: c.ink, fontWeight: 600 })}>{inr(l.balance)}</span>
              <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 1, whiteSpace: "nowrap" })}>
                {t("pyl.k." + l.kind)} · {l.left === 1 ? t("pyl.loan.last") : t("pyl.loan.line", { emi: inr(l.emi) })}
              </span>
            </span>
          ) : "—",
          claim: r.claimTotal ? inr(r.claimTotal) : "—",
          arrear: r.arrear ? inr(r.arrear) : "—",
          act: (
            <ActionMenu
              size={30} ariaLabel={r.name}
              items={[
                { key: "rec", icon: "document", label: t("pyl.a.record"), onSelect: function () { openRecord(r.id); } },
                { key: "run", icon: "payroll", label: t("pyl.a.run"), onSelect: function () { onNavigate && onNavigate("pyRun"); } },
              ]}
            />
          ),
        },
      };
    });

    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 20, flexWrap: "wrap", marginBottom: 18 }}>
          <div style={{ minWidth: 0 }}>
            <h1 style={ty("h1", { margin: "0 0 5px", color: c.ink })}>{t(g.nameKey)}</h1>
            <p style={ty("small", { margin: 0, color: c.inkMuted })}>{t(howKey(g))}</p>
          </div>
          {/* THE ONE ACT THIS MODULE OWNS, so it is the one primary
              on the page (designer). While a change is with the
              checker there is nothing to press: the rule cannot be
              changed twice at once. */}
          {!ready ? null : pend ? (
            <Button iconLeft="clock" disabled>{t("pyl.pend.cta")}</Button>
          ) : (
            <Button kind="primary" iconLeft="document" onClick={function () { setChanging(true); }}>
              {t("pyl.d.edit")}
            </Button>
          )}
        </div>

        {pend ? (
          <PendingNote p={pend} onWithdraw={function () { delete PENDING[gkey]; emitPending(); }} />
        ) : null}

        {changing && struct ? (
          <ChangeRule g={g} struct={struct} heads={roll.length}
            onClose={function () { setChanging(false); }} />
        ) : null}

        {/* one figure, and a sentence for the rest: this page's job
            is the RULE and the people under it, not a dashboard */}
        <Card>
          <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" })}>
            {t("pyl.d.cost")}
          </div>
          <div style={G3.fig("xl", { color: c.ink, fontWeight: 700, marginTop: 5, lineHeight: 1.1 })}>{inr(cost)}</div>
          <div style={ty("small", { color: c.inkMuted, marginTop: 7 })}>
            {t("pyl.d.line", { n: num(roll.length), pay: num(onPay) })}
            {withLoan ? " · " + t("pyl.d.lineLoan", { n: num(withLoan), money: inr(lent) }) : ""}
            {withClaim ? " · " + t("pyl.d.lineClaim", { n: num(withClaim), money: inr(owed) }) : ""}
          </div>
        </Card>

        <div style={{ height: L.gap }} />
        <RuleCard g={g} struct={struct} />
        <div style={{ height: L.gap }} />

        <PeopleTable
          title={t("pyl.s.title")}
          sub={t("pyl.s.sub")}
          empty={<EmptyState head={t("pyl.none.head")} body={t("pyl.none.body")} />}
          action={
            <div style={{ width: 220 }}>
              <Input id="pyl-q" value={q} onChange={reset(setQ)} placeholder={t("pyl.s.search")} size="sm" />
            </div>
          }
          chips={filters.map(function (x) {
            const on = only === x.k;
            return (
              <button
                key={x.k} type="button" aria-pressed={on ? "true" : "false"}
                onClick={function () { setOnly(x.k); setShown(PAGE); }}
                style={ty("caption", {
                  border: "1px solid " + (on ? c.accent : c.border),
                  background: on ? c.accentSoft : c.surface,
                  color: on ? c.accent : c.inkMuted,
                  borderRadius: G3.r.pill, padding: "7px 14px", cursor: "pointer",
                  fontWeight: 600, display: "inline-flex", gap: 7, alignItems: "center", minHeight: 34,
                })}
              >
                {x.label}
                <span style={G3.fig("xs", { fontWeight: 700, color: x.tone === "alert" ? c.absentText : "inherit" })}>{num(x.n)}</span>
              </button>
            );
          })}
          columns={[
            { key: "staff", label: t("pyl.col.staff") },
            { key: "salary", label: t("pyl.col.salary"), align: "right", mono: true, width: 160 },
            { key: "loan", label: t("pyl.col.loan"), align: "right", width: 190 },
            { key: "claim", label: t("pyl.col.claim"), align: "right", mono: true, width: 140 },
            { key: "arrear", label: t("pyl.col.arrear"), align: "right", mono: true, width: 140 },
            { key: "act", label: "", align: "right", width: 52 },
          ]}
          rows={rows}
          totals={filtered.length === roll.length ? {
            label: t("pyl.total", { n: num(roll.length) }),
            cells: {
              salary: inr(wages),
              claim: owed ? inr(owed) : "—",
              arrear: inr(roll.reduce(function (s, r) { return s + (r.arrear || 0); }, 0)),
            },
          } : null}
          footer={
            page.length < filtered.length ? (
              <React.Fragment>
                <span style={ty("caption", { color: c.inkFaint })}>
                  {t("pyl.showing", { a: num(page.length), b: num(filtered.length) })}
                </span>
                <Button size="sm" onClick={function () { setShown(shown + PAGE); }}>
                  {t("pyl.more", { n: num(Math.min(PAGE, filtered.length - page.length)) })}
                </Button>
              </React.Fragment>
            ) : null
          }
        />
      </div>
    );
  }

  /* ============================================================
     THE MODULE
     ============================================================ */
  function PYRules({ role, onNavigate }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [campus, setCampus] = useState(CAMPUS_ALL);
    const [open, setOpen] = useState(null);

    if (!R || !S) {
      return (
        <Shell role={role} onNavigate={onNavigate}>
          <Card><EmptyState head={t("pyl.title")} body={t("pyl.none.body")} /></Card>
        </Shell>
      );
    }

    if (open) {
      return (
        <Shell role={role} onNavigate={onNavigate} campus={campus} onCampus={setCampus}
          back={function () { setOpen(null); }}>
          <GroupPage gkey={open} campus={campus} onNavigate={onNavigate} />
        </Shell>
      );
    }

    return (
      <Shell role={role} onNavigate={onNavigate} campus={campus} onCampus={setCampus}>
        <h1 style={ty("display", { margin: "0 0 18px", color: c.ink })}>{t("pyl.title")}</h1>
        <GroupList campus={campus} onOpen={setOpen} />
      </Shell>
    );
  }

  window.Pages3 = window.Pages3 || {};
  window.Pages3.PYRules = PYRules;
})();
