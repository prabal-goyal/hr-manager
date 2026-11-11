/* @jsxRuntime classic */
/* ============================================================
   Naveya — Reports · window.Pages3.ACReports (AC-09)

   THE QUESTION: I did a month of work on this desk — how do I put it
   on paper for the trustees, the auditor or the department?

   THIS SCREEN IS A BUILDER, NOT A SHELF. Nothing here is produced in
   advance and waiting to be taken. The accountant says WHAT they
   need and FOR WHAT STRETCH OF TIME, and the artefact is made from
   the modules that own those figures at the moment they ask. A shelf
   of ready reports is a shelf of figures that were true once.

   Four rules shape it, each on the screen rather than in a model:

   1. A REPORT STATES WHAT IT CAME FROM. The months it covers, the
      entity, the runs it derives from and the configuration those
      runs pinned. A figure without those is one somebody has to
      defend from memory a year later.
   2. A RANGE THAT CROSSES A CONFIGURATION CHANGE NAMES BOTH
      VERSIONS. April to August is not one rulebook; a report that
      pretends it is will not reconcile against the filings.
   3. A MONTH WHOSE RUN IS NOT APPROVED MAKES THE WHOLE REPORT
      PROVISIONAL, and the screen says which month did it.
   4. PERSONAL DATA LEAVES ONLY WITH A REASON. The toggle is off by
      default, the reason is required, and the export is recorded
      against whoever took it.

   SPEC — docs/development-specification.md M15 (reporting), M11;
   screen-inventory AC-09.
   ============================================================ */
(function () {
  const G3 = window.G3;
  const UI = window.UI3;
  const { useState } = React;
  const {
    useTheme, useLang, addStrings, Card, Register, Button, Chip, StatusMark,
    Icon, ActionMenu, EmptyState, Field, Input, Select, Switch, Meter, MetricCell, Modal, inr, num,
    CampusSwitch, campusLabel, campusOptions, inCampus, campusOfCode, CAMPUS_ALL,
  } = UI;

  const D = function () { return (window.Pages3 && window.Pages3.ACData) || null; };
  const P = function () { return (window.Pages3 && window.Pages3.ACParts) || null; };

  addStrings({
    en: {
      "acr.crumb": "Reports",
      "acr.boxSub": "What you need, over what stretch of time, and for whom. The strip at the foot says what the artefact will contain.",
      "acr.out.ready": "Ready to produce.",
      "acr.hist.col.how": "Produced",
      "acr.how.you": "By you, on request",
      "acr.how.auto": "Automatically, {when}",
      "acr.when.onApproval": "when the run was approved",
      "acr.when.onDisburse": "when the bank file went out",
      "acr.when.monthStart": "on the first of the month",
      "acr.when.quarter": "when the quarter closed",
      "acr.dl.sub": "An audited download. Who took it and when is recorded against the artefact.",
      "acr.dl.body": "Covering {range}. {how}. {state}. The file itself is unchanged by being taken — only the fact that you took it is added.",
      "acr.title": "Build a report",
      "acr.sub": "Say what you need and over what period; it is built from the modules that own the figures. Below are the reports already made.",

      "acr.step1": "What do you need?",
      "acr.f.campusBoth": "Both campuses, segmented",
      "acr.hist.both": "Both campuses",
      "acr.out.campusBoth": "Both campuses, segmented.",
      "acr.out.campusOne": "One campus only.",
      "acr.step1Sub": "Grouped by the module the figures come from, because that is what decides whether one is final.",
      "acr.f.module": "Module",
      "acr.f.report": "Report",
      "acr.f.reportPick": "Choose a report",

      "acr.step2": "For what stretch of time?",
      "acr.step2Sub": "A month, a quarter, the year so far, or any two dates. The range is what the artefact is titled with.",
      "acr.f.span": "Covering",
      "acr.span.month": "One month",
      "acr.span.quarter": "A quarter",
      "acr.span.fy": "The financial year so far",
      "acr.span.range": "Between two dates",
      "acr.f.month": "Month",
      "acr.f.quarter": "Quarter",
      "acr.f.from": "From",
      "acr.f.to": "To",
      "acr.q1": "Quarter 1 · April to June",
      "acr.q2": "Quarter 2 · July to September",
      "acr.fyLabel": "2026–27, April onward",
      "acr.err.order": "The second date comes before the first",
      "acr.err.empty": "No month on this desk falls in that range",

      "acr.step3": "Who and in what form?",
      "acr.step3Sub": "The two entities file separately, so a report belongs to one of them unless it is deliberately a group view.",
      "acr.f.entity": "Entity",
      "acr.f.entityBoth": "Both entities, segmented",
      "acr.f.format": "Format",
      "acr.fmt.csv": "CSV — for working with",
      "acr.fmt.pdf": "PDF — for sending",
      "acr.f.pii": "Include personal identifiers",
      "acr.f.piiHint": "PAN, UAN, ESIC number and bank detail. Off unless somebody outside this desk needs them \u2014 an export of these is a disclosure.",
      "acr.f.piiReason": "Why they are needed",
      "acr.f.piiReasonHint": "Required. It is recorded with the export and is what an auditor reads first.",
      "acr.f.piiPick": "Choose a reason",
      "acr.pii1": "The department asked for it against a notice",
      "acr.pii2": "The statutory auditor's sample for this year",
      "acr.pii3": "A correction the portal requires per employee",
      "acr.f.piiNone": "This report carries no personal identifiers.",

      "acr.out": "What this will contain",
      "acr.outSub": "Read it before you produce it. Everything below comes from the modules that own the figures.",
      "acr.out.none": "Choose a report first",
      "acr.out.noneBody": "Pick the module and report above. This fills in with the months covered, the runs it derives from and the configuration they pinned.",
      "acr.out.covers": "Covers",
      "acr.out.months": "{n} months",
      "acr.out.month1": "1 month",
      "acr.out.entity": "Entity",
      "acr.out.lines": "Lines",
      "acr.out.linesNote": "{per} per month across {n}.",
      "acr.out.linesFlat": "A summary, not a line per person.",
      "acr.out.total": "Total it reports",
      "acr.out.from": "Derives from",
      "acr.out.cfg": "Computed on",
      "acr.out.cfgOne": "One version across the whole range.",
      "acr.out.cfgMany": "The range crosses a change of rules. The artefact names the version each month used \u2014 an average across a change will not reconcile.",
      "acr.out.state": "Safe to send",
      "acr.out.final": "Final",
      "acr.out.prov": "Provisional",
      "acr.out.finalNote": "Every run in this range is approved.",
      "acr.out.provNote": "{m} is not approved yet, so everything derived from it is a working figure. The artefact is marked provisional on every page.",
      "acr.out.go": "Produce it",
      "acr.out.goBlocked": "Choose a report and a range first",
      "acr.out.goNeedWhy": "Say why the identifiers are needed first"
      ,"acr.out.fixRange": "Change the dates above and this panel fills in with the months it covers.",

      "acr.ready": "It is ready",
      "acr.readySub": "Recorded against your name, with the range and the scope.",
      "acr.readyBody": "{name}, {range}, {rows} lines, {scope}. It carries the configuration each month used and the runs it came from.",
      "acr.download": "Download it",
      "acr.close": "Close",
      "acr.again": "Build another",
      "acr.scope.plain": "without personal identifiers",
      "acr.scope.pii": "with personal identifiers, for: {why}",

      "acr.hist": "The reports",
      "acr.histSub": "What the school produced on its own and what you built. Every export of a statutory or personal register is recorded.",
      "acr.hist.col.what": "Report",
      "acr.hist.col.range": "Covering",
      "acr.hist.col.who": "Taken by",
      "acr.hist.col.when": "When",
      "acr.hist.col.scope": "Scope",
      "acr.hist.col.state": "State",
      "acr.hist.none": "Nothing has been produced yet",
      "acr.hist.noneBody": "Build one above and it will be listed here with its range, its scope and your name.",
      "acr.hist.foot": "Append-only \u2014 an export cannot be removed, because it is the evidence that a disclosure happened.",
      "acr.hist.pii": "carries personal data",

      "acr.seg.statutory": "Statutory",
      "acr.seg.returns": "Returns",
      "acr.seg.approvals": "Approvals",
      "acr.seg.payroll": "Payroll",
      "acr.seg.people": "People",

      "acr.r.recon": "Liability reconciliation",
      "acr.r.reconQ": "What we owe against what we deposited, per head, with every variance named.",
      "acr.r.contrib": "Contributions register",
      "acr.r.contribQ": "Employee by employee, per head, with the base each amount was computed on.",
      "acr.r.challan": "Challan register",
      "acr.r.challanQ": "Every payment recorded against a liability, including the corrections that superseded one.",
      "acr.r.filings": "Filing status",
      "acr.r.filingsQ": "Where each return stands, with its due date, its artefact and its acknowledgement.",
      "acr.r.ecr": "Provident fund ECR",
      "acr.r.ecrQ": "The electronic challan as it was submitted, with the member lines behind it.",
      "acr.r.24q": "Form 24Q",
      "acr.r.24qQ": "Tax deducted and deposited, with the annexure the department validates.",
      "acr.r.16": "Form 16 issue register",
      "acr.r.16Q": "Which certificates were generated, for whom, and when they were issued.",
      "acr.r.pt": "Professional tax, state-wise",
      "acr.r.ptQ": "Each state files separately, so each state is its own set of lines.",
      "acr.r.released": "What was released",
      "acr.r.releasedQ": "Every finalisation this desk approved — what it was, its total, who prepared it and when it went out.",
      "acr.r.sentBack": "What was sent back",
      "acr.r.sentBackQ": "Rejections with the reason given, which is the half of maker-checker nobody keeps.",
      "acr.r.gate": "Maker-checker log",
      "acr.r.gateQ": "Who prepared and who released each item, with the time between the two.",
      "acr.r.register": "Payroll register",
      "acr.r.registerQ": "The run as it was approved — earnings, deductions and net, person by person.",
      "acr.r.variance": "Variance between months",
      "acr.r.varianceQ": "What moved and why, which is the evidence the gate asks to have seen.",
      "acr.r.bank": "Bank file summary",
      "acr.r.bankQ": "What left the bank, to how many accounts, against which run.",
      "acr.r.decl": "Declaration register",
      "acr.r.declQ": "Declared against verified, per head — the support for the 24Q annexure.",
      "acr.r.bonus": "Bonus register",
      "acr.r.bonusQ": "Who was eligible, who was not and why, with the configuration that decided it.",

      "acr.mon.4": "April", "acr.mon.5": "May", "acr.mon.6": "June",
      "acr.mon.7": "July", "acr.mon.8": "August",
    },
  });

  /* THE MONTHS THIS DESK HAS. Each names the run it belongs to, the
     configuration that run pinned, and whether it is approved — which
     is what makes a report over it final or provisional. The August
     run is the one still on the gate. */
  const MONTHS = [
    { m: 4, iso: "2026-04", run: "PR-2026-04", cfg: "apr", approved: true },
    { m: 5, iso: "2026-05", run: "PR-2026-05", cfg: "apr", approved: true },
    { m: 6, iso: "2026-06", run: "PR-2026-06", cfg: "apr", approved: true },
    { m: 7, iso: "2026-07", run: "PR-2026-07", cfg: "jul", approved: true },
    { m: 8, iso: "2026-08", run: "PR-2026-08", cfg: "jul", approved: false },
  ];
  const QUARTERS = { q1: [4, 5, 6], q2: [7, 8, 9] };

  /* what can be asked for. `per` is lines PER MONTH where a report is
     one line per person, null where it is a summary; `total` names the
     figure it reports, read from the module that owns it. */
  const REPORTS = [
    { id: "recon", seg: "statutory", nameKey: "acr.r.recon", qKey: "acr.r.reconQ", derives: "run", per: null, flat: 18, total: "outstanding" },
    { id: "contrib", seg: "statutory", nameKey: "acr.r.contrib", qKey: "acr.r.contribQ", derives: "run", per: 412, total: "payable", pii: true },
    { id: "challan", seg: "statutory", nameKey: "acr.r.challan", qKey: "acr.r.challanQ", derives: "ledger", per: null, flat: 11, total: "paid" },
    { id: "filings", seg: "statutory", nameKey: "acr.r.filings", qKey: "acr.r.filingsQ", derives: "ledger", per: null, flat: 15 },
    { id: "ecr", seg: "returns", nameKey: "acr.r.ecr", qKey: "acr.r.ecrQ", derives: "run", per: 398, total: "pf", pii: true },
    { id: "24q", seg: "returns", nameKey: "acr.r.24q", qKey: "acr.r.24qQ", derives: "run", per: 214, total: "tds", pii: true },
    { id: "16", seg: "returns", nameKey: "acr.r.16", qKey: "acr.r.16Q", derives: "ledger", per: null, flat: 214, pii: true },
    { id: "pt", seg: "returns", nameKey: "acr.r.pt", qKey: "acr.r.ptQ", derives: "run", per: 3, total: "pt" },
    { id: "released", seg: "approvals", nameKey: "acr.r.released", qKey: "acr.r.releasedQ", derives: "ledger", per: 3 },
    { id: "sentBack", seg: "approvals", nameKey: "acr.r.sentBack", qKey: "acr.r.sentBackQ", derives: "ledger", per: 1 },
    { id: "gate", seg: "approvals", nameKey: "acr.r.gate", qKey: "acr.r.gateQ", derives: "ledger", per: 4 },
    { id: "register", seg: "payroll", nameKey: "acr.r.register", qKey: "acr.r.registerQ", derives: "run", per: 412, total: "net", pii: true },
    { id: "variance", seg: "payroll", nameKey: "acr.r.variance", qKey: "acr.r.varianceQ", derives: "run", per: 6 },
    { id: "bank", seg: "payroll", nameKey: "acr.r.bank", qKey: "acr.r.bankQ", derives: "run", per: 410, total: "bank", pii: true },
    { id: "decl", seg: "people", nameKey: "acr.r.decl", qKey: "acr.r.declQ", derives: "ledger", per: null, flat: 4 },
    { id: "bonus", seg: "people", nameKey: "acr.r.bonus", qKey: "acr.r.bonusQ", derives: "ledger", per: null, flat: 389 },
  ];
  const SEGS = ["statutory", "returns", "approvals", "payroll", "people"];

  /* WHAT THE SCHOOL PRODUCES WITHOUT BEING ASKED. A payroll product
     makes some artefacts on a clock rather than on request: the
     register when a run is approved, the bank summary when it is
     disbursed, the ECR draft on the first of the month, the quarterly
     return when the quarter closes. They are listed beside the ones
     the accountant builds because a reader looking for last month's
     register does not care which of the two made it — only whether
     it is final, and what it covers. */
  const AUTO = [
    {
      id: "a1", auto: true, nameKey: "acr.r.register", rangeKey: "acr.mon.7", whenKey: "acr.when.onApproval",
      on: "2026-08-02", fmt: "pdf", rows: 412, pii: false, prov: false,
    },
    {
      id: "a2", auto: true, nameKey: "acr.r.bank", rangeKey: "acr.mon.7", whenKey: "acr.when.onDisburse",
      on: "2026-08-03", fmt: "csv", rows: 410, pii: false, prov: false,
    },
    {
      id: "a3", auto: true, nameKey: "acr.r.ecr", rangeKey: "acr.mon.7", whenKey: "acr.when.monthStart",
      on: "2026-08-01", fmt: "csv", rows: 398, pii: false, prov: false,
    },
    {
      id: "a4", auto: true, nameKey: "acr.r.recon", rangeKey: "acr.mon.7", whenKey: "acr.when.monthStart",
      on: "2026-08-01", fmt: "pdf", rows: 18, pii: false, prov: false,
    },
    {
      id: "a5", auto: true, nameKey: "acr.r.24q", rangeKey: "acr.q2", whenKey: "acr.when.quarter",
      on: "2026-08-01", fmt: "csv", rows: 214, pii: false, prov: true,
    },
  ];

  function ACReports({ role, onNavigate }) {
    /* the campus is a FIELD of the artefact, filled in the box below
       with the module, the range and the format -- not a scope on the
       page, because this page produces a file rather than showing one */
    const [campus, setCampus] = useState(CAMPUS_ALL);
    const { c } = useTheme();
    const { t, ty } = useLang();
    const d = D(), parts = P();

    const [seg, setSeg] = useState("statutory");
    const [rep, setRep] = useState("");
    const [span, setSpan] = useState("month");
    const [mon, setMon] = useState("2026-07");
    const [quarter, setQuarter] = useState("q2");
    const [from, setFrom] = useState("2026-04-01");
    const [to, setTo] = useState("2026-08-31");
    const [ent, setEnt] = useState("trust");
    const [fmt, setFmt] = useState("csv");
    const [pii, setPii] = useState(false);
    const [why, setWhy] = useState("");
    const [ready, setReady] = useState(null);
    const [made, setMade] = useState([]);
    const [got, setGot] = useState(null);

    if (!d || !parts) return null;
    const Shell = parts.Shell;

    const inSeg = REPORTS.filter(function (r) { return r.seg === seg; });
    const R = REPORTS.filter(function (r) { return r.id === rep; })[0] || null;

    /* ---------- the range, resolved to the months this desk has ---------- */
    const badOrder = span === "range" && from && to && from > to;
    let months = [];
    if (span === "month") months = MONTHS.filter(function (x) { return x.iso === mon; });
    else if (span === "quarter") months = MONTHS.filter(function (x) { return QUARTERS[quarter].indexOf(x.m) >= 0; });
    else if (span === "fy") months = MONTHS.slice();
    else if (!badOrder && from && to) {
      months = MONTHS.filter(function (x) { return x.iso + "-01" >= from.slice(0, 7) + "-01" && x.iso + "-01" <= to.slice(0, 7) + "-01"; });
    }
    const emptyRange = span === "range" && !badOrder && months.length === 0;

    const rangeWord = months.length === 0 ? "—"
      : months.length === 1 ? t("acr.mon." + months[0].m)
        : t("acr.mon." + months[0].m) + " – " + t("acr.mon." + months[months.length - 1].m);

    const cfgs = [];
    months.forEach(function (x) { if (cfgs.indexOf(x.cfg) < 0) cfgs.push(x.cfg); });
    const cfgWord = cfgs.map(function (k) { return d["CFG_" + k.toUpperCase()].v; }).join(" · ");
    const unapproved = months.filter(function (x) { return !x.approved; });
    const provisional = !!R && R.derives === "run" && unapproved.length > 0;

    const lines = !R ? 0 : (R.per == null ? R.flat : R.per * Math.max(1, months.length));
    const runs = months.map(function (x) { return x.run; });

    const totalFor = function () {
      if (!R || !R.total) return null;
      /* the figures this desk owns run to two periods; a longer range
         reports what it has and the artefact says which months */
      const have = months.filter(function (x) { return d.PERIODS.indexOf(x.iso) >= 0; });
      const sum = function (fn, k) {
        return have.reduce(function (n, x) { return n + fn(ent, x.iso, k); }, 0);
      };
      if (R.total === "outstanding") return sum(d.outstandingOf, null);
      if (R.total === "payable") return sum(d.payableOf, null);
      if (R.total === "paid") return sum(d.paidOf, null);
      if (R.total === "net") return d.RUN_NET;
      if (R.total === "bank") return d.RUN_PAYABLE;
      return sum(d.payableOf, R.total);
    };
    const total = totalFor();

    const canGo = !!R && months.length > 0 && !badOrder && (!R.pii || !pii || !!why);

    function produce() {
      setMade([{
        id: R.id + "-" + made.length, nameKey: R.nameKey, range: rangeWord,
        fmt: fmt, pii: R.pii && pii, whyKey: pii && why ? "acr.pii" + why : null,
        prov: provisional, rows: lines, campus: campus,
      }].concat(made));
      setReady(true);
    }

    /* a date range, a campus name and a configuration version are not
       parts of one another, so this strip has no bar to draw */
    function Fact({ label, value, note, tone, warn }) {
      return <MetricCell label={label} value={value} note={note} tone={tone} warn={warn} />;
    }

    return (
      <Shell role={role} active="acReports" onNavigate={onNavigate} crumb={t("acr.crumb")}
        title={t("acr.title")} sub={t("acr.sub")}>

        {/* ONE BOX. What, over what, for whom — these are not three
            questions, they are one, and a reader fills them in a
            single pass. The preview is the same box's footer, because
            what you are about to produce is not a different subject
            from what you asked for. */}
        <section aria-label={t("acr.step1")} style={{
          border: "1px solid " + c.rule, borderRadius: G3.r.md, background: c.surface,
          overflow: "hidden", marginBottom: G3.layout.gap,
        }}>
          <header style={{ padding: "16px 20px 14px" }}>
            <h2 style={ty("h3", { margin: 0, color: c.ink })}>{t("acr.step1")}</h2>
            <p style={ty("caption", { color: c.inkMuted, margin: "4px 0 0", maxWidth: "90ch" })}>{t("acr.boxSub")}</p>
          </header>

          <div style={{
            borderTop: "1px solid " + c.rule, padding: "16px 20px 6px",
            display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start",
          }}>
            <div style={{ flex: "0 1 200px", minWidth: 0 }}>
              <Field id="acr-seg" label={t("acr.f.module")}>
                <Select id="acr-seg" value={seg}
                  onChange={function (v) { setSeg(v); setRep(""); setPii(false); setWhy(""); }}
                  options={SEGS.map(function (k) { return { value: k, label: t("acr.seg." + k) }; })} />
              </Field>
            </div>
            <div style={{ flex: "1 1 280px", minWidth: 0 }}>
              <Field id="acr-rep" label={t("acr.f.report")}>
                <Select id="acr-rep" value={rep}
                  onChange={function (v) { setRep(v); setPii(false); setWhy(""); }}
                  options={[{ value: "", label: t("acr.f.reportPick") }].concat(
                    inSeg.map(function (r) { return { value: r.id, label: t(r.nameKey) }; }))} />
              </Field>
            </div>
            <div style={{ flex: "0 1 210px", minWidth: 0 }}>
              <Field id="acr-campus" label={t("kit.campus.label")}>
                <Select id="acr-campus" value={campus} onChange={setCampus}
                  ariaLabel={t("kit.campus.label")}
                  options={campusOptions(t, { allFirst: true, allKey: "acr.f.campusBoth" })} />
              </Field>
            </div>
            <div style={{ flex: "0 1 190px", minWidth: 0 }}>
              <Field id="acr-span" label={t("acr.f.span")}>
                <Select id="acr-span" value={span} onChange={setSpan}
                  options={[
                    { value: "month", label: t("acr.span.month") },
                    { value: "quarter", label: t("acr.span.quarter") },
                    { value: "fy", label: t("acr.span.fy") },
                    { value: "range", label: t("acr.span.range") },
                  ]} />
              </Field>
            </div>

            {span === "month" ? (
              <div style={{ flex: "0 1 170px", minWidth: 0 }}>
                <Field id="acr-mon" label={t("acr.f.month")}>
                  <Select id="acr-mon" value={mon} onChange={setMon}
                    options={MONTHS.map(function (x) { return { value: x.iso, label: t("acr.mon." + x.m) }; })} />
                </Field>
              </div>
            ) : null}
            {span === "quarter" ? (
              <div style={{ flex: "0 1 250px", minWidth: 0 }}>
                <Field id="acr-q" label={t("acr.f.quarter")}>
                  <Select id="acr-q" value={quarter} onChange={setQuarter}
                    options={[{ value: "q1", label: t("acr.q1") }, { value: "q2", label: t("acr.q2") }]} />
                </Field>
              </div>
            ) : null}
            {span === "fy" ? (
              <div style={{ flex: "0 1 220px", minWidth: 0, paddingTop: 26 }}>
                <StatusMark role="leave" glyph="clock" word={t("acr.fyLabel")} />
              </div>
            ) : null}
            {span === "range" ? (
              <React.Fragment>
                <div style={{ flex: "0 1 170px", minWidth: 0 }}>
                  <Field id="acr-from" label={t("acr.f.from")}>
                    <Input id="acr-from" type="date" value={from} onChange={setFrom} />
                  </Field>
                </div>
                <div style={{ flex: "0 1 170px", minWidth: 0 }}>
                  <Field id="acr-to" label={t("acr.f.to")}
                    error={badOrder ? t("acr.err.order") : emptyRange ? t("acr.err.empty") : null}>
                    <Input id="acr-to" type="date" value={to} onChange={setTo} />
                  </Field>
                </div>
              </React.Fragment>
            ) : null}

            <div style={{ flex: "0 1 230px", minWidth: 0 }}>
              <Field id="acr-ent" label={t("acr.f.entity")}>
                <Select id="acr-ent" value={ent} onChange={setEnt}
                  options={d.ENTITIES.map(function (e) { return { value: e.key, label: t(e.nameKey) }; })
                    .concat([{ value: "both", label: t("acr.f.entityBoth") }])} />
              </Field>
            </div>
            <div style={{ flex: "0 1 220px", minWidth: 0 }}>
              <Field id="acr-fmt" label={t("acr.f.format")}>
                <Select id="acr-fmt" value={fmt} onChange={setFmt}
                  options={[{ value: "csv", label: t("acr.fmt.csv") }, { value: "pdf", label: t("acr.fmt.pdf") }]} />
              </Field>
            </div>
          </div>

          {/* what the chosen report answers, and the identifier gate
              where it carries any — both belong to the choice above, so
              they stay in the same box */}
          <div style={{ padding: "4px 20px 14px" }}>
            {R ? (
              <p style={ty("caption", { color: c.inkMuted, margin: 0, maxWidth: "90ch" })}>{t(R.qKey)}</p>
            ) : null}
            {R && R.pii ? (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid " + c.rule }}>
                <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-start" }}>
                  <div style={{ flex: "1 1 340px", minWidth: 0 }}>
                    <Switch id="acr-pii" checked={pii} onChange={function (v) { setPii(v); if (!v) setWhy(""); }} label={t("acr.f.pii")} />
                    <p style={ty("caption", { color: c.inkMuted, margin: "8px 0 0", maxWidth: 520 })}>{t("acr.f.piiHint")}</p>
                  </div>
                  {pii ? (
                    <div style={{ flex: "0 1 300px", minWidth: 0 }}>
                      <Field id="acr-why" label={t("acr.f.piiReason")} hint={t("acr.f.piiReasonHint")}>
                        <Select id="acr-why" value={why} onChange={setWhy}
                          options={[{ value: "", label: t("acr.f.piiPick") }].concat(
                            ["1", "2", "3"].map(function (n) { return { value: n, label: t("acr.pii" + n) }; }))} />
                      </Field>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          {/* the preview is this box's footer, not a second subject */}
          {R && months.length ? (
            <div style={{
              borderTop: "1px solid " + c.rule, display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", padding: "16px 0",
            }}>
              <Fact label={t("acr.out.covers")} value={rangeWord} tone={c.chartBlue}
                note={months.length === 1 ? t("acr.out.month1") : t("acr.out.months", { n: num(months.length) })} />
              <Fact label={t("kit.campus.label")} value={campusLabel(t, campus)} tone={c.chartSand}
                note={campus === CAMPUS_ALL ? t("acr.out.campusBoth") : t("acr.out.campusOne")} />
              <Fact label={t("acr.out.lines")} value={num(lines)} tone={c.chartBlue}
                note={R.per == null ? t("acr.out.linesFlat") : t("acr.out.linesNote", { per: num(R.per), n: num(months.length) })} />
              {total != null ? (
                <Fact label={t("acr.out.total")} value={inr(total)} tone={c.chartTeal} note={t("acr.out.from") + ": " + runs.join(" · ")} />
              ) : null}
              <Fact label={t("acr.out.cfg")} value={cfgWord} tone={c.chartPurple} warn={cfgs.length > 1}
                note={cfgs.length > 1 ? t("acr.out.cfgMany") : t("acr.out.cfgOne")} />
              <Fact label={t("acr.out.state")}
                value={provisional ? t("acr.out.prov") : t("acr.out.final")}
                tone={provisional ? c.chartAmber : c.chartGreen} warn={provisional}
                note={provisional
                  ? t("acr.out.provNote", { m: t("acr.mon." + unapproved[0].m) })
                  : t("acr.out.finalNote")} />
            </div>
          ) : null}

          <div style={{
            borderTop: "1px solid " + c.rule, padding: "14px 20px 18px",
            display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap",
          }}>
            <Button kind="primary" iconLeft="download" disabled={!canGo}
              onClick={!canGo ? undefined : produce}>{t("acr.out.go")}</Button>
            <span style={ty("caption", { color: canGo ? c.inkMuted : c.lateText, flex: "1 1 260px" })}>
              {canGo ? t("acr.out.ready")
                : !R ? t("acr.out.goBlocked")
                  : badOrder ? t("acr.err.order")
                    : months.length === 0 ? t("acr.err.empty")
                      : t("acr.out.goNeedWhy")}
            </span>
          </div>
        </section>

        {/* ---- the reports themselves ---- */}
        <Register
          title={t("acr.hist")} sub={t("acr.histSub")}
          columns={[
            { key: "what", label: t("acr.hist.col.what") },
            { key: "range", label: t("acr.hist.col.range") },
            { key: "how", label: t("acr.hist.col.how") },
            { key: "when", label: t("acr.hist.col.when"), mono: true },
            { key: "scope", label: t("acr.hist.col.scope") },
            { key: "state", label: t("acr.hist.col.state") },
            { key: "act", label: "", align: "right", width: 52 },
          ]}
          rows={made.concat(AUTO).map(function (m) {
            return {
              id: m.id,
              cells: {
                what: (
                  <span style={{ display: "block" }}>
                    <span style={ty("small", { color: c.ink, fontWeight: 600, display: "block" })}>{t(m.nameKey)}</span>
                    <span style={G3.fig("xs", { color: c.inkFaint, display: "block", marginTop: 1 })}>
                      {m.fmt.toUpperCase()} · {num(m.rows)}
                    </span>
                  </span>
                ),
                range: <span style={ty("caption", { color: c.inkMuted })}>{m.auto ? t(m.rangeKey) : m.range}</span>,
                how: m.auto
                  ? <span style={ty("caption", { color: c.inkMuted })}>{t("acr.how.auto", { when: t(m.whenKey) })}</span>
                  : <span style={ty("caption", { color: c.ink, fontWeight: 600 })}>{t("acr.how.you")}</span>,
                when: m.auto ? d.fmtDate(t, m.on) : d.fmtDate(t, d.TODAY),
                scope: (
                  <span style={{ display: "block" }}>
                    <span style={ty("caption", { color: c.ink, display: "block" })}>
                      {m.campus && m.campus !== CAMPUS_ALL ? campusLabel(t, m.campus) : t("acr.hist.both")}
                    </span>
                    <span style={{ display: "block", marginTop: 3 }}>
                      {m.pii
                        ? <StatusMark role="late" glyph="lock" word={t("acr.hist.pii")} />
                        : <span style={ty("caption", { color: c.inkFaint })}>{t("acr.scope.plain")}</span>}
                    </span>
                  </span>
                ),
                state: <StatusMark role={m.prov ? "late" : "present"} glyph={m.prov ? "clock" : "check"}
                  word={m.prov ? t("acr.out.prov") : t("acr.out.final")} />,
                act: (
                  <ActionMenu ariaLabel={t("acr.download")} items={[
                    { key: "dl", label: t("acr.download"), icon: "download", tone: "go", onSelect: function () { setGot(m); } },
                  ]} />
                ),
              },
            };
          })}
          footer={<span style={ty("caption", { color: c.inkFaint, maxWidth: "85ch" })}>{t("acr.hist.foot")}</span>}
        />

        {got ? (
          <Modal
            icon="download" title={t(got.nameKey)} sub={t("acr.dl.sub")}
            onClose={function () { setGot(null); }}
            footer={
              <React.Fragment>
                <Button kind="primary" size="sm" iconLeft="download" onClick={function () { setGot(null); }}>
                  {t("acr.download")}
                </Button>
                <Button kind="secondary" size="sm" onClick={function () { setGot(null); }}>{t("acr.close")}</Button>
              </React.Fragment>
            }
          >
            <p style={ty("small", { color: c.inkMuted, margin: 0 })}>
              {t("acr.dl.body", {
                range: got.auto ? t(got.rangeKey) : got.range,
                how: got.auto ? t("acr.how.auto", { when: t(got.whenKey) }) : t("acr.how.you"),
                state: got.prov ? t("acr.out.prov") : t("acr.out.final"),
              })}
            </p>
          </Modal>
        ) : null}

        {ready ? (
          <Modal
            icon="check" iconTone="present" title={t("acr.ready")} sub={t("acr.readySub")}
            onClose={function () { setReady(null); }}
            footer={
              <React.Fragment>
                <Button kind="primary" size="sm" iconLeft="download" onClick={function () { setReady(null); }}>
                  {t("acr.download")}
                </Button>
                <Button kind="secondary" size="sm" onClick={function () { setReady(null); setRep(""); }}>
                  {t("acr.again")}
                </Button>
              </React.Fragment>
            }
          >
            <p style={ty("small", { color: c.inkMuted, margin: 0 })}>
              {t("acr.readyBody", {
                name: R ? t(R.nameKey) : "", range: rangeWord, rows: num(lines),
                scope: campusLabel(t, campus) + ", "
                  + (R && R.pii && pii ? t("acr.scope.pii", { why: t("acr.pii" + why) }) : t("acr.scope.plain")),
              })}
            </p>
          </Modal>
        ) : null}
      </Shell>
    );
  }

  window.Pages3 = window.Pages3 || {};
  window.Pages3.ACReports = ACReports;
})();
