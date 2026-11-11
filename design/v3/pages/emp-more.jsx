/* @jsxRuntime classic */
/* ============================================================
   Naveya — the employee's More · window.Pages3.EmpMore
   EMP-08 (tax & Form 16) · EMP-09 (investment declaration)
   · EMP-14/15 (helpdesk)

   EMP-19 (loans and advances) is DEFINED in this file and MOUNTED by
   Requests: asking the school for a loan is the same act as asking for
   leave or for a claim, and it belongs with the other things waiting on
   somebody else's decision. It is exported as window.NaveyaLoans.Tab
   rather than copied, because a second form could forget a rule the
   first one honours.

   THE QUESTION: the things about my pay and my dealings with the
   office that are not this month's payslip.

   WHY THIS SCREEN EXISTS. The rail already had an item for it and
   nothing behind it, which meant three chains in this product began
   in the middle:

     the DECLARATION the accountant verifies on AC-07 was raised by an
     employee who had no screen to raise it on,
     the LOAN HR checks and payroll sanctions was asked for by an
     employee who had no screen to ask on, and
     the TICKET HR works was opened by somebody who could not read
     their own answer.

   So nothing here keeps a second copy of anything. The declaration
   rows are the accountant's. The loan instalment is payroll's ledger
   row — the same one the payslip deducts. The tickets are the desk's
   own. An employee and an officer looking at one thing must not be
   able to see two different numbers.

   WHAT THIS SCREEN WILL NOT DO.
   · It does not show a Form 16 before the return it certifies has
     been filed — a certificate for an unfiled return is not a
     certificate, and the quarter's state is read from the
     accountant's filings rather than asserted here.
   · It does not let anybody re-open a head the office has accepted:
     an accepted amount is the school's record of what a proof
     supported, so an accepted head carries no control at all.
   · It never shows an internal note on a ticket. HR writes those to
     each other; the raiser reads the replies addressed to them.

   SPEC — docs/development-specification.md M11, M15.1, M10
   §Reimbursements; screen-inventory EMP-08, EMP-09, EMP-14, EMP-15,
   EMP-19.
   ============================================================ */
(function () {
  const G3 = window.G3;
  const UI = window.UI3;
  const { useState } = React;
  const {
    useTheme, ThemeToggle, useLang, addStrings,
    Rail, Motif, Card, Register, Button, StatusMark, Band, Avatar,
    EmptyState, Field, Input, Select, FileField, Tabs, TabPanel, Modal, inr, num,
  } = UI;

  /* WHOSE SCREEN THIS IS. Every role's rail carries the same YOURS
     group, because an officer is also a member of staff — so this is
     whoever is signed in, not "the employee". The declaration, the
     loan ledger and the ticket desk all key on that person, and a role
     with no rows in a fixture gets the honest empty state rather than
     somebody else's figures.

     The ticket desk keys people by an i18n key rather than a staff
     number, so the two tables are joined on the ENGLISH name — the
     one spelling both of them agree on. */
  function meOf(role) { return UI.profileFor(role || "employee"); }
  function ticketsOf(H, me) {
    if (!H || !H.TICKETS) return [];
    return H.TICKETS.filter(function (x) {
      return UI.translate("en", x.raiserKey) === me.name;
    });
  }
  const DOT = "·";
  const DASH = "—";

  addStrings({
    en: {
      "em.crumb": "More",
      "em.title": "Tax, declarations and the helpdesk",
      "em.tab.tax": "Tax",
      "em.tab.decl": "Declaration",
      "em.tab.help": "Helpdesk",
      "em.tabsAria": "Tax, what you declared, and the office",
      "em.ok": "Close",

      /* ---------------------------------------------------- tax --- */
      "em.tax.band": "Tax this year",
      "em.tax.m.deducted": "Deducted so far",
      "em.tax.m.deductedNote": "Across the {n} payslips issued this financial year.",
      "em.tax.m.accepted": "Accepted from your declaration",
      "em.tax.m.acceptedNote": "Only what a proof supported.",
      "em.tax.m.saved": "What that saved you",
      "em.tax.m.savedNote": "Across the year, at the rate the run used.",
      "em.tax.m.regime": "Regime",
      "em.tax.m.regimeNote": "Chosen at the start of the year; it holds for the whole of it.",
      "em.tax.regime.old": "Old",
      "em.tax.regime.new": "New",
      "em.tax.docs": "Your tax documents",
      "em.tax.col.doc": "Document",
      "em.tax.col.covers": "Covers",
      "em.tax.col.state": "State",
      "em.tax.col.act": "",
      "em.tax.d.16": "Form 16 — Part A and Part B",
      "em.tax.d.16Q": "The year’s salary and the tax deducted from it, as the department will see it.",
      "em.tax.d.12ba": "Form 12BA",
      "em.tax.d.12baQ": "Perquisites, where you were given any.",
      "em.tax.d.stmt": "Tax deducted, month by month",
      "em.tax.d.stmtQ": "Every deduction with the payslip it came from.",
      "em.tax.fy": "2026–27",
      "em.tax.sofar": "April to August",
      "em.tax.st.ready": "Ready",
      "em.tax.st.afterQ": "After the quarter is filed",
      "em.tax.open": "Open it",
      "em.tax.wait": "Not issued yet",
      "em.tax.waitWhy": "{q} is still with the accounts office, due {due}. A certificate for an unfiled return is not a certificate.",
      "em.tax.waitWhyNone": "Form 16 is issued once the year’s last quarterly return has been filed.",

      /* -------------------------------------------- declaration --- */
      "em.decl.band": "What you declared, and what was accepted",
      "em.decl.m.declared": "You declared",
      "em.decl.m.declaredNote": "Across every head, for this financial year.",
      "em.decl.m.accepted": "Accepted",
      "em.decl.m.acceptedNote": "Checked against the proofs you uploaded.",
      "em.decl.m.waiting": "Still to be settled",
      "em.decl.m.waitingNote": "Heads the office has not accepted yet.",
      "em.decl.m.window": "You can upload until",
      "em.decl.m.windowNote": "After that an unproved head falls away, and the tax trues up over the months left.",
      "em.decl.heads": "Head by head",
      "em.decl.col.head": "Head",
      "em.decl.col.declared": "You declared",
      "em.decl.col.verified": "Accepted",
      "em.decl.col.state": "State",
      "em.decl.col.act": "",
      "em.decl.st.verified": "Accepted",
      "em.decl.st.pending": "With the accounts office",
      "em.decl.st.none": "No proof uploaded",
      "em.decl.st.rejected": "Not accepted",
      "em.decl.proofs": "{n} uploaded",
      "em.decl.noProof": "Nothing uploaded",
      "em.decl.upload": "Upload a proof",
      "em.decl.replace": "Upload another",
      "em.decl.locked": "Accepted",
      "em.decl.none": "You have not declared anything this year",
      "em.decl.noneBody": "On the new regime there is nothing to declare — it allows no deduction, so there is no head a proof could support.",
      "em.decl.gone": "No declaration was raised for you this year",

      "em.up.title": "Upload a proof for {head}",
      "em.up.declared": "You declared",
      "em.up.file": "The proof",
      "em.up.fileHint": "A PDF or a photograph. The office must be able to read the amount and your name on it.",
      "em.up.note": "Anything the office should know",
      "em.up.notePh": "Optional — for example, which page the amount is on",
      "em.up.needFile": "Choose a file before you send it.",
      "em.up.go": "Send it to the office",
      "em.up.cancel": "Not now",
      "em.up.doneHead": "It is with the accounts office",
      "em.up.doneBody": "They will read it against the {amt} you declared for {head}. If it supports less, the head is accepted lower and you are told why.",

      /* -------------------------------------------------- loans --- */
      "em.loan.band": "Where your loans stand",
      "em.loan.m.out": "Still to repay",
      "em.loan.m.outNote": "Across everything running.",
      "em.loan.m.emi": "Coming out this month",
      "em.loan.m.emiNote": "On the payslip as one deduction line.",
      "em.loan.m.running": "Running",
      "em.loan.m.runningNote": "Being recovered from your pay.",
      "em.loan.m.asked": "Waiting on a decision",
      "em.loan.m.askedNote": "With HR, or with payroll.",
      "em.loan.run": "What is being recovered",
      "em.loan.col.what": "What",
      "em.loan.col.principal": "Sanctioned",
      "em.loan.col.emi": "Each month",
      "em.loan.col.left": "Left",
      "em.loan.col.progress": "Instalments",
      "em.loan.of": "{a} of {b} recovered",
      "em.loan.asks": "What you have asked for",
      "em.loan.col.asked": "Asked for",
      "em.loan.col.state": "Where it is",
      "em.loan.col.when": "Raised",
      "em.loan.col.over": "Over",
      "em.loan.months": "{n} months",
      "em.loan.oneMonth": "Next month",
      "em.loan.ask": "Ask for a loan or an advance",
      "em.loan.none": "You have nothing running and nothing asked for",
      "em.loan.noneBody": "An advance is recovered over a month or two; a loan is spread over a tenure you ask for and the school sanctions.",
      "em.loan.st.withHR": "With HR",
      "em.loan.st.withPayroll": "With payroll",
      "em.loan.st.approved": "Sanctioned",
      "em.loan.st.paid": "Paid out",
      "em.loan.st.declined": "Not sanctioned",
      "em.loan.st.returned": "Sent back to you",

      "em.ask.title": "Ask for a loan or an advance",
      "em.ask.kind": "Which",
      "em.ask.kindLoan": "A loan — spread over years",
      "em.ask.kindAdv": "An advance — taken before the salary it comes out of",
      "em.ask.amount": "How much",
      "em.ask.amountHint": "The office may sanction less than you ask for.",
      "em.ask.tenure": "Over how many months",
      "em.ask.tenureHint": "Payroll may sanction a different number.",
      "em.ask.tenureAdv": "Taken back over",
      "em.ask.tenureAdvHint": "An advance comes out of the salaries that follow it.",
      "em.ask.oneMonth": "One month",
      "em.ask.why": "What it is for",
      "em.ask.whyPh": "Choose the nearest",
      "em.ask.errAmount": "Put in an amount.",
      "em.ask.errWhy": "A request with no purpose is sent back, so choose one now.",
      "em.ask.emiAbout": "About {amt} a month for {n} months, before the office decides.",
      "em.ask.oneGo": "{amt} comes out of your next salary in one go.",
      "em.ask.go": "Send it to HR",
      "em.ask.cancel": "Not now",
      "em.ask.doneHead": "It is with HR",
      "em.ask.doneBody": "HR checks it and sends it to payroll, who decide the amount, the months and the rate. An advance is paid before the salary it comes out of; the months after it carry the recovery. You will see it move here.",

      /* ----------------------------------------------- helpdesk --- */
      "em.help.band": "Your tickets",
      "em.help.m.open": "With the desk",
      "em.help.m.openNote": "Being worked on now.",
      "em.help.m.onYou": "Waiting on you",
      "em.help.m.onYouNote": "The desk has asked you something.",
      "em.help.m.closed": "Closed",
      "em.help.m.closedNote": "Answered and shut.",
      "em.help.m.all": "Raised in all",
      "em.help.m.allNote": "Every ticket you have opened.",
      "em.help.list": "Raised by you",
      "em.help.col.subject": "What you asked",
      "em.help.col.cat": "Category",
      "em.help.col.state": "Where it is",
      "em.help.col.when": "Raised",
      "em.help.col.act": "",
      "em.help.st.open": "With the desk",
      "em.help.st.onYou": "Waiting on you",
      "em.help.st.resolved": "Answered",
      "em.help.st.closed": "Closed",
      "em.help.read": "Read it",
      "em.help.none": "You have not raised anything",
      "em.help.noneBody": "Raise one when your pay, your record or your equipment needs the office to act. Each category has an owner and a time it answers in.",
      "em.help.raise": "Raise a ticket",
      "em.help.sla": "Answered within {n} hours",
      "em.help.escalated": "Escalated — the desk passed its own deadline",
      "em.help.threadSub": "Raised {when} · {cat}",
      "em.help.replies": "Replies",
      "em.help.noReplies": "Nobody has replied yet. The desk answers within the time its category promises.",
      "em.help.onYouHead": "The desk is waiting on you",

      "em.raise.title": "Raise a ticket",
      "em.raise.cat": "Category",
      "em.raise.catPh": "Choose one",
      "em.raise.subject": "In one line",
      "em.raise.subjectPh": "For example: income tax on my August payslip",
      "em.raise.body": "What happened",
      "em.raise.bodyPh": "Dates and figures help the desk answer in one reply instead of three",
      "em.raise.errCat": "Choose the category that owns this.",
      "em.raise.errSubject": "Give it a line, so the desk can see what it is.",
      "em.raise.promise": "{cat} answers within {n} hours, and escalates to somebody more senior if it does not.",
      "em.raise.go": "Raise it",
      "em.raise.cancel": "Not now",
      "em.raise.doneHead": "It is with the desk",
      "em.raise.doneBody": "{cat} has it and answers within {n} hours. The clock stops if the desk asks you something back.",
    },
  });

  const MON = {
    "01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr", "05": "May", "06": "Jun",
    "07": "Jul", "08": "Aug", "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dec",
  };
  function shortDate(iso) {
    if (!iso) return DASH;
    const p = String(iso).split("-");
    return (+p[2]) + " " + (MON[p[1]] || p[1]) + " " + p[0];
  }

  /* -----------------------------------------------------------------
     THE SHELL. One layout for all four tabs, so a tab added later
     cannot drift into a second page shape for the same person.
     ----------------------------------------------------------------- */
  function Shell({ role, me, onNavigate, tab, onTab, counts, children }) {
    const { c } = useTheme();
    const { t, ty, lang } = useLang();
    const L = G3.layout;
    function label(key, n) {
      return n ? t(key) + " " + DOT + " " + num(n) : t(key);
    }
    return (
      <div className="nv3" style={{
        display: "flex", minHeight: "100vh", background: c.page, color: c.ink,
        fontFamily: G3.font.ui,
      }}>
        <Rail role={role || "employee"} active="empMore" onNavigate={onNavigate} />
        <main style={{ flex: 1, minWidth: 0, position: "relative", overflowX: "clip" }}>
          <Motif />
          <div style={{
            position: "relative", zIndex: 1, maxWidth: L.contentMax,
            margin: "0 auto", padding: "22px " + L.contentPadX + "px 56px",
          }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              gap: 20, marginBottom: 16, flexWrap: "wrap",
            }}>
              {/* the same breadcrumb every other employee screen draws.
                  A face, a name and a staff number here said who was
                  signed in for the third time on one screen — the rail
                  says it, and nothing on this page is about anybody
                  else. */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <span style={ty("small", { color: c.inkMuted })}>
                  <span style={{ color: c.ink, fontWeight: 700 }}>{t("em.crumb")}</span>
                  <span style={{ margin: "0 8px", color: c.inkFaint }}>{DOT}</span>
                  <span>{t("home.school")}</span>
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <ThemeToggle />
              </div>
            </div>
            <div style={{ marginBottom: 18 }}>
              <h1 style={ty("display", { margin: 0, color: c.ink })}>{t("em.title")}</h1>
            </div>
            <div style={{ marginBottom: 18 }}>
              <Tabs
                idBase="em-tabs" ariaLabel={t("em.tabsAria")} active={tab} onChange={onTab}
                items={[
                  { key: "tax", label: t("em.tab.tax") },
                  { key: "decl", label: label("em.tab.decl", counts.decl) },
                  { key: "help", label: label("em.tab.help", counts.help) },
                ]}
              />
            </div>
            {children}
          </div>
        </main>
      </div>
    );
  }

  /* -----------------------------------------------------------------
     EMP-08 · TAX. Derived, every figure of it: the deduction from the
     payslips, the accepted total from the accountant's declaration
     rows, and whether Form 16 can exist at all from whether the
     quarterly return behind it has been filed.
     ----------------------------------------------------------------- */
  function TaxTab({ me }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const P3 = window.Pages3 || {};
    const SLIP = P3.PayslipData || null;
    const DECL = P3.ACDeclData || null;
    const ACD = P3.ACData || null;

    const mine = DECL && DECL.forStaff ? DECL.forStaff(me.id) : null;
    const accepted = mine && DECL ? DECL.acceptedOf(mine, null) : 0;
    const rate = DECL ? DECL.MARGINAL : 0;
    const deducted = SLIP ? SLIP.YTD_TDS : 0;
    const slips = SLIP ? SLIP.PAID.length : 0;

    /* FORM 16 FOLLOWS THE RETURN. The quarter's state is the
       accountant's, read from their filings rather than claimed here. */
    const q = ACD && ACD.FILINGS
      ? ACD.FILINGS.filter(function (f) { return f.kindKey === "ac.f.24q" && !f.filedOn; })[0] || null
      : null;

    const docs = [
      { k: "16", nameKey: "em.tax.d.16", coversKey: "em.tax.fy", ready: !q },
      { k: "12ba", nameKey: "em.tax.d.12ba", coversKey: "em.tax.fy", ready: !q },
      { k: "stmt", nameKey: "em.tax.d.stmt", coversKey: "em.tax.sofar", ready: true },
    ];

    return (
      <TabPanel idBase="em-tabs" tabKey="tax">
        <Band
          head={t("em.tax.band")}
          metrics={[
            { k: "d", label: t("em.tax.m.deducted"), value: inr(deducted),
              note: t("em.tax.m.deductedNote", { n: num(slips) }), tone: c.chartBlue },
            { k: "a", label: t("em.tax.m.accepted"), value: inr(accepted),
              note: t("em.tax.m.acceptedNote"), tone: c.chartGreen },
            { k: "s", label: t("em.tax.m.saved"), value: inr(Math.round(accepted * rate)),
              note: t("em.tax.m.savedNote"), tone: c.chartTeal },
            { k: "r", label: t("em.tax.m.regime"),
              value: t(mine && mine.regime === "new" ? "em.tax.regime.new" : "em.tax.regime.old"),
              note: t("em.tax.m.regimeNote"), tone: c.chartPurple },
          ]}
        />

        <Register
          title={t("em.tax.docs")}
          columns={[
            { key: "doc", label: t("em.tax.col.doc") },
            { key: "covers", label: t("em.tax.col.covers"), width: 150 },
            { key: "state", label: t("em.tax.col.state"), width: 215 },
            { key: "act", label: "", align: "right", width: 130 },
          ]}
          rows={docs.map(function (d) {
            return {
              id: d.k,
              cells: {
                doc: (
                  <span style={{ display: "block" }}>
                    <span style={ty("small", { color: c.ink, fontWeight: 700, display: "block" })}>{t(d.nameKey)}</span>
                  </span>
                ),
                covers: <span style={ty("caption", { color: c.inkMuted })}>{t(d.coversKey)}</span>,
                state: d.ready
                  ? <StatusMark role="present" glyph="check" word={t("em.tax.st.ready")} />
                  : <StatusMark role="late" glyph="clock" word={t("em.tax.st.afterQ")} />,
                act: d.ready
                  ? <Button kind="secondary" size="sm" iconLeft="download">{t("em.tax.open")}</Button>
                  : <span style={ty("caption", { color: c.inkFaint })}>{t("em.tax.wait")}</span>,
              },
            };
          })}
          footer={
            <span style={ty("caption", { color: c.inkFaint, display: "block", maxWidth: "88ch" })}>
              {q
                ? t("em.tax.waitWhy", { q: t(q.pLabelKey || "em.tax.fy"), due: shortDate(q.due) })
                : t("em.tax.waitWhyNone")}
            </span>
          }
        />
      </TabPanel>
    );
  }

  /* -----------------------------------------------------------------
     EMP-09 · THE DECLARATION. The same rows AC-07 verifies. A head
     the office has accepted carries no control at all — an accepted
     amount is the school's record of what a proof supported.
     ----------------------------------------------------------------- */
  function DeclTab({ me }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [up, setUp] = useState(null);
    const [file, setFile] = useState(null);
    const [note, setNote] = useState("");
    const [err, setErr] = useState(false);
    const [sent, setSent] = useState({});
    const [done, setDone] = useState(null);

    const DECL = (window.Pages3 || {}).ACDeclData || null;
    const mine = DECL && DECL.forStaff ? DECL.forStaff(me.id) : null;
    if (!DECL || !mine) {
      return (
        <TabPanel idBase="em-tabs" tabKey="decl">
          <Card><EmptyState head={t("em.decl.gone")} body={t("em.decl.noneBody")} /></Card>
        </TabPanel>
      );
    }

    function stateOf(h) { return sent[h.k] ? "pending" : h.state; }
    const declared = DECL.declaredOf(mine);
    const accepted = DECL.acceptedOf(mine, null);
    const counted = function (st) {
      return mine.heads.filter(function (h) { return stateOf(h) === st; }).length;
    };
    const waiting = mine.heads.length - counted("verified");

    return (
      <TabPanel idBase="em-tabs" tabKey="decl">
        <Band
          head={t("em.decl.band")}
          metrics={[
            { k: "d", label: t("em.decl.m.declared"), value: inr(declared),
              note: t("em.decl.m.declaredNote"), tone: c.chartTeal },
            { k: "a", label: t("em.decl.m.accepted"), value: inr(accepted),
              note: t("em.decl.m.acceptedNote"), tone: c.chartGreen,
},
            { k: "w", label: t("em.decl.m.waiting"), value: num(waiting), n: waiting,
              note: t("em.decl.m.waitingNote"), tone: c.chartAmber, warn: waiting > 0,
},
            { k: "u", label: t("em.decl.m.window"), value: shortDate("2026-12-31"),
              note: t("em.decl.m.windowNote"), tone: c.chartBlue },
          ]}
        />

        {!mine.heads.length ? (
          <Card><EmptyState head={t("em.decl.none")} body={t("em.decl.noneBody")} /></Card>
        ) : (
          <Register
            title={t("em.decl.heads")}
            columns={[
              { key: "head", label: t("em.decl.col.head") },
              { key: "declared", label: t("em.decl.col.declared"), align: "right", mono: true, width: 150 },
              { key: "verified", label: t("em.decl.col.verified"), align: "right", mono: true, width: 130 },
              { key: "state", label: t("em.decl.col.state"), width: 205 },
              { key: "act", label: "", align: "right", width: 165 },
            ]}
            rows={mine.heads.map(function (h) {
              const st = stateOf(h);
              const proofs = (h.proofs || 0) + (sent[h.k] ? 1 : 0);
              return {
                id: h.k,
                cells: {
                  head: (
                    <span style={{ display: "block" }}>
                      <span style={ty("small", { color: c.ink, fontWeight: 600, display: "block" })}>{t(h.key)}</span>
                      <span style={ty("caption", { color: c.inkFaint, display: "block", marginTop: 1 })}>
                        {proofs ? t("em.decl.proofs", { n: num(proofs) }) : t("em.decl.noProof")}
                        {h.state === "rejected" && h.whyKey ? " " + DOT + " " + t(h.whyKey) : ""}
                      </span>
                    </span>
                  ),
                  declared: inr(h.declared),
                  verified: st === "verified"
                    ? inr(h.verified)
                    : <span style={{ color: c.inkFaint }}>{DASH}</span>,
                  state: (
                    <StatusMark
                      role={st === "verified" ? "present" : st === "rejected" ? "danger" : st === "none" ? "absent" : "late"}
                      glyph={st === "verified" ? "check" : st === "pending" ? "clock" : "alert"}
                      word={t("em.decl.st." + st)}
                    />
                  ),
                  act: st === "verified"
                    ? <span style={ty("caption", { color: c.inkFaint })}>{t("em.decl.locked")}</span>
                    : (
                      <Button
                        kind={st === "none" || st === "rejected" ? "primary" : "secondary"} size="sm" iconLeft="document"
                        onClick={function () { setFile(null); setNote(""); setErr(false); setUp(h); }}
                      >
                        {proofs ? t("em.decl.replace") : t("em.decl.upload")}
                      </Button>
                    ),
                },
              };
            })}
          />
        )}

        {up ? (
          <Modal
            icon="document" title={t("em.up.title", { head: t(up.key) })}
            onClose={function () { setUp(null); }} width={560}
            footer={
              <React.Fragment>
                <Button
                  kind="primary" size="sm" iconLeft="check"
                  onClick={function () {
                    if (!file) { setErr(true); return; }
                    const next = Object.assign({}, sent);
                    next[up.k] = true;
                    setSent(next); setDone(up); setUp(null);
                  }}
                >{t("em.up.go")}</Button>
                <Button kind="secondary" size="sm" onClick={function () { setUp(null); }}>{t("em.up.cancel")}</Button>
              </React.Fragment>
            }
          >
            <div style={{
              display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 14,
              border: "1px solid " + c.rule, borderRadius: G3.r.sm, padding: "11px 14px",
            }}>
              <span style={ty("caption", { color: c.inkMuted })}>{t("em.up.declared")}</span>
              <span style={G3.fig("md", { color: c.ink, fontWeight: 700 })}>{inr(up.declared)}</span>
            </div>
            <div style={{ marginTop: 14 }}>
              <Field id="em-file" label={t("em.up.file")} error={err ? t("em.up.needFile") : null}>
                <FileField
                  id="em-file" fileName={file} invalid={err} accept=".pdf,image/*"
                  hint={t("em.up.fileHint")}
                  onPick={function (n) { setFile(n); if (n) setErr(false); }}
                />
              </Field>
              <Field id="em-note" label={t("em.up.note")}>
                <Input id="em-note" value={note} onChange={setNote} placeholder={t("em.up.notePh")} />
              </Field>
            </div>
          </Modal>
        ) : null}

        {done ? (
          <Modal
            icon="check" iconTone="present" title={t("em.up.doneHead")}
            onClose={function () { setDone(null); }}
            footer={<Button kind="primary" size="sm" onClick={function () { setDone(null); }}>{t("em.ok")}</Button>}
          >
            <p style={ty("small", { color: c.inkMuted, margin: 0 })}>
              {t("em.up.doneBody", { amt: inr(done.declared), head: t(done.key) })}
            </p>
          </Modal>
        ) : null}
      </TabPanel>
    );
  }

  /* -----------------------------------------------------------------
     EMP-19 · LOANS. Two different things, so two lists: what is being
     recovered (payroll's ledger — the same instalment the payslip
     deducts) and what has been asked for and not decided (the
     pay-request queue HR and payroll work).
     ----------------------------------------------------------------- */
  /* MOUNTED FROM REQUESTS (pages/emp-tasks.jsx), defined here beside
     the ledger and the pay-request queue it reads. `idBase` is the tab
     strip it belongs to, so the panel keeps its aria wiring wherever
     it is rendered. */
  function LoansTab({ me, idBase }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [ask, setAsk] = useState(false);
    const [done, setDone] = useState(false);
    const [kind, setKind] = useState("loan");
    const [amount, setAmount] = useState("");
    const [tenure, setTenure] = useState("12");
    const [why, setWhy] = useState("");
    const [err, setErr] = useState(null);

    const Q = window.NaveyaPayRequests || null;
    if (Q && Q.usePayRequests) Q.usePayRequests();
    const A = (window.Pages3 || {}).PYAdjData || null;

    const running = A && A.LOANS
      ? A.LOANS.filter(function (l) {
        return l.staff === me.id && (l.state === "active" || l.state === "atExit");
      })
      : [];
    const asks = Q ? Q.byKind("loan").filter(function (r) { return r.staff === me.id; }) : [];
    const openAsks = asks.filter(function (r) {
      return r.state === "withHR" || r.state === "withPayroll";
    });

    const emi = A ? running.reduce(function (n, l) { return n + A.loanEmi(l); }, 0) : 0;
    const left = A && A.loanOutstanding
      ? running.reduce(function (n, l) { return n + A.loanOutstanding(l); }, 0)
      : 0;

    /* AN ADVANCE IS SPREAD TOO, over a shorter stretch. A loan runs
       for years and an advance for a term, so the two offer the same
       question with different answers rather than one of them
       offering none. */
    const SPREAD = { loan: [6, 12, 18, 24, 36], advance: [1, 2, 3, 4, 6] };
    const months = Math.max(1, Number(tenure) || 1);
    const roughEmi = Number(amount) ? Math.round(Number(amount) / months) : 0;
    const purposes = ["pyo.loan.p.medical", "pyo.loan.p.festival", "pyo.loan.p.education", "pyo.loan.p.home"];

    function pickKind(v) {
      setKind(v);
      /* the months carry over from the other kind otherwise: 24 months
         of advance is not a thing this school does */
      setTenure(v === "advance" ? "1" : "12");
    }

    function send() {
      if (!Number(amount)) { setErr("amount"); return; }
      if (!why) { setErr("why"); return; }
      setErr(null); setAsk(false); setDone(true);
    }

    return (
      <TabPanel idBase={idBase || "em-tabs"} tabKey="loans">
        <Band
          head={t("em.loan.band")}
          action={
            <Button kind="primary" size="sm" iconLeft="payslip" onClick={function () { setErr(null); setAsk(true); }}>
              {t("em.loan.ask")}
            </Button>
          }
          metrics={[
            { k: "o", label: t("em.loan.m.out"), value: inr(left), note: t("em.loan.m.outNote"), tone: c.chartBlue },
            { k: "e", label: t("em.loan.m.emi"), value: inr(emi), note: t("em.loan.m.emiNote"), tone: c.chartSand },
            { k: "r", label: t("em.loan.m.running"), value: num(running.length), n: running.length,
              note: t("em.loan.m.runningNote"), tone: c.chartBlue },
            { k: "a", label: t("em.loan.m.asked"), value: num(openAsks.length), n: openAsks.length,
              note: t("em.loan.m.askedNote"), tone: c.chartAmber, warn: openAsks.length > 0 },
          ]}
        />

        {!running.length && !asks.length ? (
          <Card><EmptyState head={t("em.loan.none")} body={t("em.loan.noneBody")} /></Card>
        ) : null}

        {running.length ? (
          <Register
            title={t("em.loan.run")}
            columns={[
              { key: "what", label: t("em.loan.col.what") },
              { key: "principal", label: t("em.loan.col.principal"), align: "right", mono: true, width: 140 },
              { key: "emi", label: t("em.loan.col.emi"), align: "right", mono: true, width: 130 },
              { key: "left", label: t("em.loan.col.left"), align: "right", mono: true, width: 130 },
              { key: "prog", label: t("em.loan.col.progress"), width: 170 },
            ]}
            rows={running.map(function (l) {
              return {
                id: l.id,
                cells: {
                  what: (
                    <span style={{ display: "block" }}>
                      <span style={ty("small", { color: c.ink, fontWeight: 600, display: "block" })}>{t(l.purposeKey)}</span>
                      <span style={G3.fig("xs", { color: c.inkFaint, display: "block", marginTop: 1 })}>{l.id}</span>
                    </span>
                  ),
                  principal: inr(l.principal),
                  emi: inr(A.loanEmi(l)),
                  left: inr(A.loanOutstanding(l)),
                  prog: (
                    <span style={ty("caption", { color: c.inkMuted })}>
                      {t("em.loan.of", { a: num(l.paid), b: num(l.tenure) })}
                    </span>
                  ),
                },
              };
            })}
          />
        ) : null}

        {asks.length ? (
          <Register
            title={t("em.loan.asks")}
            columns={[
              { key: "what", label: t("em.loan.col.what") },
              { key: "asked", label: t("em.loan.col.asked"), align: "right", mono: true, width: 140 },
              { key: "over", label: t("em.loan.col.over"), width: 130 },
              { key: "state", label: t("em.loan.col.state"), width: 195 },
              { key: "when", label: t("em.loan.col.when"), width: 125 },
            ]}
            rows={asks.map(function (r) {
              return {
                id: r.id,
                cells: {
                  what: (
                    <span style={{ display: "block" }}>
                      <span style={ty("small", { color: c.ink, fontWeight: 600, display: "block" })}>
                        {r.purposeKey ? t(r.purposeKey) : t("em.ask.whyPh")}
                      </span>
                      <span style={G3.fig("xs", { color: c.inkFaint, display: "block", marginTop: 1 })}>{r.id}</span>
                    </span>
                  ),
                  asked: inr(r.amountAsked),
                  over: (
                    <span style={ty("caption", { color: c.inkMuted })}>
                      {r.loanKind === "advance" && r.tenureAsked <= 1
                        ? t("em.loan.oneMonth")
                        : t("em.loan.months", { n: num(r.tenureAsked) })}
                    </span>
                  ),
                  state: (
                    <StatusMark
                      role={r.state === "paid" || r.state === "approved" ? "present"
                        : r.state === "declined" ? "danger"
                          : r.state === "returned" ? "absent" : "late"}
                      glyph={r.state === "paid" || r.state === "approved" ? "check"
                        : r.state === "withHR" || r.state === "withPayroll" ? "clock" : "alert"}
                      word={t("em.loan.st." + r.state)}
                    />
                  ),
                  when: <span style={G3.fig("xs", { color: c.inkMuted })}>{shortDate(r.raisedIso)}</span>,
                },
              };
            })}
          />
        ) : null}

        {ask ? (
          <Modal
            icon="payslip" title={t("em.ask.title")}
            onClose={function () { setAsk(false); }} width={580}
            footer={
              <React.Fragment>
                <Button kind="primary" size="sm" iconLeft="check" onClick={send}>{t("em.ask.go")}</Button>
                <Button kind="secondary" size="sm" onClick={function () { setAsk(false); }}>{t("em.ask.cancel")}</Button>
              </React.Fragment>
            }
          >
            <Field id="em-kind" label={t("em.ask.kind")}>
              <Select
                id="em-kind" value={kind} onChange={pickKind}
                options={[
                  { value: "loan", label: t("em.ask.kindLoan") },
                  { value: "advance", label: t("em.ask.kindAdv") },
                ]}
              />
            </Field>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 210px", minWidth: 0 }}>
                <Field
                  id="em-amt" label={t("em.ask.amount")} hint={t("em.ask.amountHint")}
                  error={err === "amount" ? t("em.ask.errAmount") : null}
                >
                  <Input
                    id="em-amt" value={amount} inputMode="decimal" invalid={err === "amount"}
                    onChange={function (v) { setAmount(v); if (err === "amount") setErr(null); }}
                  />
                </Field>
              </div>
              <div style={{ flex: "0 1 210px", minWidth: 0 }}>
                <Field
                  id="em-ten"
                  label={t(kind === "advance" ? "em.ask.tenureAdv" : "em.ask.tenure")}
                  hint={t(kind === "advance" ? "em.ask.tenureAdvHint" : "em.ask.tenureHint")}
                >
                  <Select
                    id="em-ten" value={tenure} onChange={setTenure}
                    options={SPREAD[kind].map(function (n) {
                      return { value: String(n), label: n === 1 ? t("em.ask.oneMonth") : t("em.loan.months", { n: num(n) }) };
                    })}
                  />
                </Field>
              </div>
            </div>
            <Field id="em-why" label={t("em.ask.why")} error={err === "why" ? t("em.ask.errWhy") : null}>
              <Select
                id="em-why" value={why}
                onChange={function (v) { setWhy(v); if (err === "why") setErr(null); }}
                options={[{ value: "", label: t("em.ask.whyPh") }].concat(
                  purposes.map(function (k) { return { value: k, label: t(k) }; }))}
              />
            </Field>
            {/* what it means for the pay she actually receives, said
                once, in the unit she is choosing in */}
            {roughEmi ? (
              <p style={ty("caption", { color: c.inkMuted, margin: "2px 0 0" })}>
                {months === 1
                  ? t("em.ask.oneGo", { amt: inr(Number(amount) || 0) })
                  : t("em.ask.emiAbout", { amt: inr(roughEmi), n: num(months) })}
              </p>
            ) : null}
          </Modal>
        ) : null}

        {done ? (
          <Modal
            icon="check" iconTone="present" title={t("em.ask.doneHead")}
            onClose={function () { setDone(false); }}
            footer={<Button kind="primary" size="sm" onClick={function () { setDone(false); }}>{t("em.ok")}</Button>}
          >
            <p style={ty("small", { color: c.inkMuted, margin: 0 })}>{t("em.ask.doneBody")}</p>
          </Modal>
        ) : null}
      </TabPanel>
    );
  }

  /* -----------------------------------------------------------------
     EMP-14 / EMP-15 · THE HELPDESK, from the raiser's side. The same
     tickets HR works. An INTERNAL note is never shown: HR writes
     those to each other, and the raiser reads the replies addressed
     to them.
     ----------------------------------------------------------------- */
  function HelpTab({ me }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [open, setOpen] = useState(null);
    const [raise, setRaise] = useState(false);
    const [cat, setCat] = useState("");
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [err, setErr] = useState(null);
    const [done, setDone] = useState(null);

    const H = (window.Pages3 || {}).HRHelpData || null;
    if (!H) {
      return (
        <TabPanel idBase="em-tabs" tabKey="help">
          <Card><EmptyState head={t("em.help.none")} body={t("em.help.noneBody")} /></Card>
        </TabPanel>
      );
    }

    const mine = ticketsOf(H, me).slice();
    mine.sort(function (a, b) { return a.raisedISO < b.raisedISO ? 1 : -1; });

    function where(x) {
      if (x.closedOnISO) return "closed";
      if (x.awaitingRaiser) return "onYou";
      if (x.resolvedOnISO) return "resolved";
      return "open";
    }
    const count = function (w) { return mine.filter(function (x) { return where(x) === w; }).length; };
    const cats = H.CATEGORIES.filter(function (x) { return x.active && !x.restricted; });
    const chosen = cats.filter(function (x) { return x.id === cat; })[0] || null;

    const thread = open ? mine.filter(function (x) { return x.id === open; })[0] : null;
    const replies = thread ? thread.comments.filter(function (cm) { return !cm.isInternal; }) : [];
    const threadCat = thread ? H.categoryOf(thread.categoryId) : null;

    function send() {
      if (!cat) { setErr("cat"); return; }
      if (!subject.trim()) { setErr("subject"); return; }
      setErr(null); setRaise(false); setDone(chosen);
    }

    return (
      <TabPanel idBase="em-tabs" tabKey="help">
        <Band
          head={t("em.help.band")}
          action={
            <Button kind="primary" size="sm" iconLeft="document" onClick={function () { setErr(null); setRaise(true); }}>
              {t("em.help.raise")}
            </Button>
          }
          metrics={[
            { k: "o", label: t("em.help.m.open"), value: num(count("open")), n: count("open"),
              note: t("em.help.m.openNote"), tone: c.chartBlue },
            { k: "y", label: t("em.help.m.onYou"), value: num(count("onYou")), n: count("onYou"),
              note: t("em.help.m.onYouNote"), tone: c.chartAmber, warn: count("onYou") > 0 },
            { k: "c", label: t("em.help.m.closed"), value: num(count("closed")), n: count("closed"),
              note: t("em.help.m.closedNote"), tone: c.chartGreen },
            { k: "a", label: t("em.help.m.all"), value: num(mine.length), n: mine.length,
              note: t("em.help.m.allNote"), tone: c.chartSand },
          ]}
        />

        {!mine.length ? (
          <Card><EmptyState head={t("em.help.none")} body={t("em.help.noneBody")} /></Card>
        ) : (
          <Register
            title={t("em.help.list")}
            columns={[
              { key: "subject", label: t("em.help.col.subject") },
              { key: "cat", label: t("em.help.col.cat"), width: 175 },
              { key: "state", label: t("em.help.col.state"), width: 195 },
              { key: "when", label: t("em.help.col.when"), width: 125 },
              { key: "act", label: "", align: "right", width: 120 },
            ]}
            rows={mine.map(function (x) {
              const w = where(x);
              const k = H.categoryOf(x.categoryId);
              return {
                id: x.id,
                cells: {
                  subject: (
                    <span style={{ display: "block" }}>
                      <span style={ty("small", { color: c.ink, fontWeight: 600, display: "block" })}>{t(x.subjectKey)}</span>
                      {x.escalatedToKey ? (
                        <span style={ty("caption", { color: c.dangerText, display: "block", marginTop: 1 })}>
                          {t("em.help.escalated")}
                        </span>
                      ) : k ? (
                        <span style={ty("caption", { color: c.inkFaint, display: "block", marginTop: 1 })}>
                          {t("em.help.sla", { n: num(k.slaHours) })}
                        </span>
                      ) : null}
                    </span>
                  ),
                  cat: <span style={ty("caption", { color: c.inkMuted })}>{k ? t(k.nameKey) : DASH}</span>,
                  state: (
                    <StatusMark
                      role={w === "closed" || w === "resolved" ? "present" : w === "onYou" ? "late" : "leave"}
                      glyph={w === "closed" || w === "resolved" ? "check" : w === "onYou" ? "alert" : "clock"}
                      word={t("em.help.st." + w)}
                    />
                  ),
                  when: <span style={G3.fig("xs", { color: c.inkMuted })}>{shortDate(x.raisedISO)}</span>,
                  act: (
                    <Button kind="secondary" size="sm" onClick={function () { setOpen(x.id); }}>
                      {t("em.help.read")}
                    </Button>
                  ),
                },
              };
            })}
          />
        )}

        {thread ? (
          <Modal
            icon="document" title={t(thread.subjectKey)}
            sub={t("em.help.threadSub", {
              when: shortDate(thread.raisedISO),
              cat: threadCat ? t(threadCat.nameKey) : DASH,
            })}
            onClose={function () { setOpen(null); }} width={620}
            footer={<Button kind="primary" size="sm" onClick={function () { setOpen(null); }}>{t("em.ok")}</Button>}
          >
            {thread.awaitingRaiser ? (
              <div style={{
                border: "1px solid " + c.border, background: c.lateTint,
                borderRadius: G3.r.sm, padding: "11px 14px", marginBottom: 14,
              }}>
                <span style={ty("small", { color: c.ink, fontWeight: 700, display: "block" })}>{t("em.help.onYouHead")}</span>
              </div>
            ) : null}
            <div style={ty("caption", {
              color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
            })}>{t("em.help.replies")}</div>
            {!replies.length ? (
              <p style={ty("small", { color: c.inkMuted, margin: "8px 0 0" })}>{t("em.help.noReplies")}</p>
            ) : (
              <ol style={{ listStyle: "none", margin: "10px 0 0", padding: 0 }}>
                {replies.map(function (cm) {
                  return (
                    <li key={cm.id} style={{ borderTop: "1px solid " + c.rule, padding: "11px 0 0", marginTop: 11 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
                        <Avatar name={t(cm.authorKey)} size={22} />
                        <span style={ty("small", { color: c.ink, fontWeight: 600 })}>{t(cm.authorKey)}</span>
                        <span style={G3.fig("xs", { color: c.inkFaint })}>{shortDate(cm.atISO)}</span>
                      </div>
                      <p style={ty("small", { color: c.inkMuted, margin: "6px 0 0" })}>{t(cm.bodyKey)}</p>
                    </li>
                  );
                })}
              </ol>
            )}
          </Modal>
        ) : null}

        {raise ? (
          <Modal
            icon="document" title={t("em.raise.title")}
            onClose={function () { setRaise(false); }} width={600}
            footer={
              <React.Fragment>
                <Button kind="primary" size="sm" iconLeft="check" onClick={send}>{t("em.raise.go")}</Button>
                <Button kind="secondary" size="sm" onClick={function () { setRaise(false); }}>{t("em.raise.cancel")}</Button>
              </React.Fragment>
            }
          >
            <Field id="em-cat" label={t("em.raise.cat")} error={err === "cat" ? t("em.raise.errCat") : null}>
              <Select
                id="em-cat" value={cat}
                onChange={function (v) { setCat(v); if (err === "cat") setErr(null); }}
                options={[{ value: "", label: t("em.raise.catPh") }].concat(
                  cats.map(function (k) { return { value: k.id, label: t(k.nameKey) }; }))}
              />
            </Field>
            {chosen ? (
              <p style={ty("caption", { color: c.inkMuted, margin: "-6px 0 12px" })}>
                {t("em.raise.promise", { cat: t(chosen.nameKey), n: num(chosen.slaHours) })}
              </p>
            ) : null}
            <Field id="em-subj" label={t("em.raise.subject")} error={err === "subject" ? t("em.raise.errSubject") : null}>
              <Input
                id="em-subj" value={subject} invalid={err === "subject"}
                onChange={function (v) { setSubject(v); if (err === "subject") setErr(null); }}
                placeholder={t("em.raise.subjectPh")}
              />
            </Field>
            <Field id="em-body" label={t("em.raise.body")}>
              <Input id="em-body" value={body} onChange={setBody} placeholder={t("em.raise.bodyPh")} />
            </Field>
          </Modal>
        ) : null}

        {done ? (
          <Modal
            icon="check" iconTone="present" title={t("em.raise.doneHead")}
            onClose={function () { setDone(null); }}
            footer={<Button kind="primary" size="sm" onClick={function () { setDone(null); }}>{t("em.ok")}</Button>}
          >
            <p style={ty("small", { color: c.inkMuted, margin: 0 })}>
              {t("em.raise.doneBody", { cat: t(done.nameKey), n: num(done.slaHours) })}
            </p>
          </Modal>
        ) : null}
      </TabPanel>
    );
  }

  function EmpMore({ role, onNavigate }) {
    /* the flat router passes no props, so a screen that sends the
       reader to one of these tabs hands the tab across on Pages3 and
       it is consumed once — arriving later from the rail opens Tax. */
    const [tab, setTab] = useState(function () {
      const h = window.Pages3 && window.Pages3.empMoreTab;
      if (h) { window.Pages3.empMoreTab = null; return h; }
      return "tax";
    });

    /* the counts the tabs carry are the things that want the reader,
       computed from the same stores the tabs themselves read */
    const P3 = window.Pages3 || {};
    const DECL = P3.ACDeclData || null;
    const H = P3.HRHelpData || null;
    const me = meOf(role);
    const mineDecl = DECL && DECL.forStaff ? DECL.forStaff(me.id) : null;
    const counts = {
      decl: mineDecl ? mineDecl.heads.filter(function (h) { return h.state !== "verified"; }).length : 0,
      help: ticketsOf(H, me).filter(function (x) { return !x.closedOnISO; }).length,
    };

    return (
      <Shell role={role} me={me} onNavigate={onNavigate} tab={tab} onTab={setTab} counts={counts}>
        {tab === "tax" ? <TaxTab me={me} /> : null}
        {tab === "decl" ? <DeclTab me={me} /> : null}
        {tab === "help" ? <HelpTab me={me} /> : null}
      </Shell>
    );
  }

  window.NaveyaLoans = { Tab: LoansTab };

  window.Pages3 = window.Pages3 || {};
  window.Pages3.EmpMore = EmpMore;
})();
