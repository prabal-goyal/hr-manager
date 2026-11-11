/* @jsxRuntime classic */
/* ============================================================
   Naveya — the two reading screens of the Accountant's desk
   window.Pages3.ACContrib (AC-08) · window.Pages3.ACDecl (AC-07)

   AC-08 answers WHAT STATUTORY AMOUNT DID EACH PERSON GENERATE, and
   it is deliberately the one screen on this desk with NO MUTATING
   ACTION. A contribution is a computed output: it is produced by a
   payroll run against a pinned configuration, it rolls up into a
   filing, and the only honest way to change one is to change what
   produced it — a recompute upstream, or an arrears posting. An edit
   control here would let somebody make the register disagree with the
   payslips it was built from, which is the one thing a statutory
   register must never do. Said out loud on the screen so nobody adds
   one later (screen-inventory AC-08).

   AC-07 answers DO THE PROOFS SUPPORT WHAT STAFF DECLARED. Two rules
   shape it: a declaration is the employee's, so this screen VERIFIES
   or REJECTS and never rewrites one; and a verified amount can only
   go DOWN from what was declared, because accepting more than
   somebody claimed is not verification. Everything accepted here
   moves the tax that comes out of the next run, so the screen says
   what that movement is before it is made.

   SPEC — docs/development-specification.md M11; screen-inventory
   AC-07 (investment declaration review) and AC-08 (contributions).
   ============================================================ */
(function () {
  const G3 = window.G3;
  const UI = window.UI3;
  const { useState } = React;
  const {
    useTheme, useLang, addStrings, Card, Register, Button, Chip, StatusMark,
    Icon, ActionMenu, EmptyState, Field, Input, Select, StackBar, Meter, Band,
    inr, num,
    CampusSwitch, campusLabel, campusOptions, inCampus, campusOfCode, CAMPUS_ALL,
  } = UI;

  const D = function () { return (window.Pages3 && window.Pages3.ACData) || null; };
  const P = function () { return (window.Pages3 && window.Pages3.ACParts) || null; };

  /* a band, the same one the registers and the payroll desk open with */

  addStrings({
    en: {
      /* ---------- AC-08 ---------- */
      "ac8.crumb": "Contributions",
      "ac8.title": "What each person generated this period",
      "ac8.sub": "The lines every filing is built from, and the lines the liability screen reconciles. Computed, so nothing here can be typed.",
      "ac8.band": "The period, by head",
      "ac8.bandSub": "Employee side and employer side kept apart, because only one of them comes out of somebody's pay.",
      "ac8.m.emp": "From staff pay",
      "ac8.m.empNote": "Deducted and held in trust until it is deposited.",
      "ac8.m.er": "The school's own cost",
      "ac8.m.erNote": "Paid on top, never deducted from anyone.",
      "ac8.m.total": "Deposited in total",
      "ac8.m.totalNote": "What the filings for this period add up to.",
      "ac8.m.cfg": "Computed on",
      "ac8.m.cfgNote": "Pinned when the run was created; a later change does not rewrite it.",
      "ac8.f.period": "Period",
      "ac8.f.entity": "Entity",
      "ac8.f.kind": "Head",
      "ac8.f.kindAll": "Every head",
      "ac8.reg": "Person by person",
      "ac8.regSub": "A page of the register. The period's own totals are in the band above \u2014 the figures the filings carry.",
      "ac8.col.who": "Who",
      "ac8.col.kind": "Head",
      "ac8.col.base": "Base",
      "ac8.col.emp": "From them",
      "ac8.col.er": "From the school",
      "ac8.col.state": "State",
      "ac8.col.act": "",
      "ac8.a.payslip": "Open the payslip it came from",
      "ac8.a.export": "Export the register",
      "ac8.foot": "{n} of {total} rows. A contribution is computed, so a wrong figure is corrected upstream, never typed over.",
      "ac8.empty": "Nothing for that head",
      "ac8.emptyBody": "Widen the head filter, or pick a period this entity ran payroll in.",
      "ac8.noPeriod": "This entity has nothing for that period",
      "ac8.noPeriodBody": "No payroll was computed, so no contribution exists. That is a different thing from a contribution of zero.",

      /* ---------- AC-07 ---------- */
      "ac7.crumb": "Declarations",
      "ac7.title": "Do the proofs support what was declared?",
      "ac7.sub": "Verify a head, or reject it with a reason. Nothing here rewrites what somebody declared — that is theirs.",
      "ac7.band": "This financial year",
      "ac7.bandSub": "Whatever is accepted here changes the tax in the next run, so the screen says what that change is first.",
      "ac7.mix.verified": "Verified",
      "ac7.mix.pending": "Proof waiting on you",
      "ac7.mix.none": "No proof uploaded",
      "ac7.mix.rejected": "Rejected",
      "ac7.m.staff": "Staff declaring",
      "ac7.m.staffNote": "Out of {n} on the roll.",
      "ac7.m.claimed": "Declared",
      "ac7.m.claimedNote": "What staff say they have invested.",
      "ac7.m.accepted": "Accepted so far",
      "ac7.m.acceptedNote": "Only what a proof supports.",
      "ac7.m.window": "Review window",
      "ac7.m.windowOpen": "Open",
      "ac7.m.windowClosed": "Closed",
      "ac7.m.windowNote": "Closes {date}. After that, unverified heads fall away and the tax trues up over the remaining months.",
      "ac7.m.windowNoteClosed": "Closed on {date}. Unverified heads were disallowed.",
      "ac7.a.close": "Close the review window",
      "ac7.a.export": "Export the register",
      "ac7.closed.head": "Close the review for this year",
      "ac7.closed.hint": "Every head still unverified is disallowed, and the tax trues up across the months that are left. This cannot be undone.",
      "ac7.closed.go": "Close it",
      "ac7.closed.cancel": "Keep it open",

      "ac7.reg": "Staff and what they claimed",
      "ac7.regSub": "Oldest proof first. Opening a row shows every head and the proof behind it.",
      "ac7.col.who": "Who",
      "ac7.col.regime": "Regime",
      "ac7.col.declared": "Declared",
      "ac7.col.verified": "Verified",
      "ac7.col.proofs": "Proofs",
      "ac7.col.tds": "Tax effect",
      "ac7.col.act": "",
      "ac7.regime.old": "Old regime",
      "ac7.regime.new": "New regime",
      "ac7.regime.newNote": "Declares nothing — the new regime allows no deduction, so there is nothing to verify.",
      "ac7.proofs": "{done} of {all}",
      "ac7.a.open": "Open the declaration",
      "ac7.foot": "{n} staff shown. {newN} are on the new regime and have nothing to verify. A head with no proof by the deadline is disallowed.",

      "ac7.d.back": "Back to the declarations",
      "ac7.d.title": "{name} · {fy}",
      "ac7.d.sub": "Head by head. Verify at the declared amount or below it — accepting more than somebody claimed is not verification.",
      "ac7.d.gone": "That declaration is not open",
      "ac7.d.goneBody": "Open one from the register.",
      "ac7.d.head": "Head",
      "ac7.d.heads": "Every head they declared"
      ,"ac7.d.headsSub": "A head is accepted at what its proof supports, or rejected with a reason the employee is told.",
      "ac7.d.declared": "Declared",
      "ac7.d.proof": "Proof",
      "ac7.d.state": "State",
      "ac7.d.verified": "Verified at",
      "ac7.d.noProof": "Nothing uploaded",
      "ac7.d.hasProof": "{n} file",
      "ac7.d.hasProofs": "{n} files",
      "ac7.d.view": "Open the proof",
      "ac7.d.verify": "Verify",
      "ac7.d.reject": "Reject",
      "ac7.d.verifyHead": "Verify {head}",
      "ac7.d.verifyHint": "The amount defaults to what was declared. It can be brought down to what the proof supports, never up.",
      "ac7.d.amount": "Verified amount",
      "ac7.d.over": "A verified amount cannot be more than what was declared",
      "ac7.d.go": "Accept it",
      "ac7.d.cancel": "Cancel",
      "ac7.d.rejectHead": "Reject {head}",
      "ac7.d.rejectHint": "The employee is told the reason and what it does to their tax. They can upload again while the window is open.",
      "ac7.d.r1": "The proof is for a different financial year",
      "ac7.d.r2": "The document does not name this employee",
      "ac7.d.r3": "The amount on the proof is lower than the amount declared",
      "ac7.d.r4": "The head does not qualify under this section",
      "ac7.d.rejectGo": "Reject the head",
      "ac7.d.effect": "What this does to their tax",
      "ac7.d.effectSub": "Recomputed on the pinned configuration, from the next run onward. Nothing already paid is rewritten.",
      "ac7.d.beforeTds": "If nothing is accepted",
      "ac7.d.afterTds": "With what is accepted",
      "ac7.d.saved": "Difference over the year",
      "ac7.d.monthly": "Per remaining month",
      "ac7.d.trail": "What happened to this declaration",
      "ac7.d.tr.declared": "Declared by the employee",
      "ac7.d.tr.proof": "Proof uploaded",
      "ac7.d.tr.verified": "Head verified",
      "ac7.d.tr.rejected": "Head rejected",
      "ac7.d.trailFoot": "Append-only. A rejection and a later acceptance both stay on the record.",
      "ac7.d.sum": "Declared {d} · accepted {a}",
    },
  });

  /* ============================================================
     AC-08's page of the register. Twelve people out of the roll,
     exactly as HR's staff register shows sixteen out of two hundred
     and fourteen: a canvas cannot hold four hundred rows, and
     pretending the page IS the period would make the totals a lie.
     The band carries the period; this carries the shape of it.
     ============================================================ */
  const PEOPLE = [
    { nameKey: "ac8.n.ananya", staff: "NAV-0142", groupKey: "ac8.g.teach", state: "ka" },
    { nameKey: "ac8.n.vikram", staff: "NAV-0118", groupKey: "ac8.g.teach", state: "ka" },
    { nameKey: "ac8.n.meena", staff: "NAV-0088", groupKey: "ac8.g.teach", state: "ka" },
    { nameKey: "ac8.n.suresh", staff: "NAV-0176", groupKey: "ac8.g.admin", state: "ka" },
    { nameKey: "ac8.n.divya", staff: "NAV-0199", groupKey: "ac8.g.admin", state: "ka" },
    { nameKey: "ac8.n.manju", staff: "NAV-0054", groupKey: "ac8.g.support", state: "ka" },
    { nameKey: "ac8.n.ramesh", staff: "NAV-0034", groupKey: "ac8.g.admin", state: "ka" },
    { nameKey: "ac8.n.prakash", staff: "NAV-0067", groupKey: "ac8.g.support", state: "ka" },
    { nameKey: "ac8.n.kavya", staff: "NAV-0207", groupKey: "ac8.g.teach", state: "tg" },
    { nameKey: "ac8.n.arvind", staff: "NAV-0245", groupKey: "ac8.g.teach", state: "tg" },
    { nameKey: "ac8.n.neha", staff: "NAV-0250", groupKey: "ac8.g.teach", state: "ka" },
    { nameKey: "ac8.n.rohit", staff: "NAV-0161", groupKey: "ac8.g.guest", state: "ka" },
  ];
  /* base x head. A guest teacher has no PF, a low wage carries ESI and
     a high one does not — the shape of the rules, never the rates. */
  const LINES = [
    { who: 0, k: "pf", base: 36000, emp: 4320, er: 4320 },
    { who: 0, k: "pt", base: 72000, emp: 200, er: 0 },
    { who: 0, k: "tds", base: 72000, emp: 8400, er: 0 },
    { who: 1, k: "pf", base: 33000, emp: 3960, er: 3960 },
    { who: 1, k: "pt", base: 66000, emp: 200, er: 0 },
    { who: 1, k: "tds", base: 66000, emp: 6900, er: 0 },
    { who: 2, k: "pf", base: 42000, emp: 5040, er: 5040 },
    { who: 2, k: "pt", base: 96000, emp: 200, er: 0 },
    { who: 2, k: "tds", base: 96000, emp: 15600, er: 0 },
    { who: 3, k: "pf", base: 24000, emp: 2880, er: 2880 },
    { who: 3, k: "pt", base: 42000, emp: 200, er: 0 },
    { who: 3, k: "tds", base: 42000, emp: 2100, er: 0 },
    { who: 4, k: "pf", base: 15000, emp: 1800, er: 1800 },
    { who: 4, k: "esi", base: 19600, emp: 147, er: 637 },
    { who: 4, k: "pt", base: 19600, emp: 150, er: 0 },
    { who: 5, k: "pf", base: 14000, emp: 1680, er: 1680 },
    { who: 5, k: "esi", base: 18400, emp: 138, er: 598 },
    { who: 5, k: "pt", base: 18400, emp: 150, er: 0 },
    { who: 5, k: "lwf", base: 18400, emp: 0, er: 20 },
    { who: 6, k: "pf", base: 28000, emp: 3360, er: 3360 },
    { who: 6, k: "pt", base: 54000, emp: 200, er: 0 },
    { who: 6, k: "tds", base: 54000, emp: 4200, er: 0 },
    { who: 7, k: "pf", base: 16000, emp: 1920, er: 1920 },
    { who: 7, k: "esi", base: 20800, emp: 156, er: 676 },
    { who: 7, k: "pt", base: 20800, emp: 150, er: 0 },
    { who: 8, k: "pf", base: 22000, emp: 2640, er: 2640 },
    { who: 8, k: "pt", base: 44000, emp: 150, er: 0 },
    { who: 9, k: "pf", base: 26000, emp: 3120, er: 3120 },
    { who: 9, k: "pt", base: 52000, emp: 150, er: 0 },
    { who: 9, k: "tds", base: 52000, emp: 3600, er: 0 },
    { who: 10, k: "pf", base: 19000, emp: 2280, er: 2280 },
    { who: 10, k: "pt", base: 38000, emp: 200, er: 0 },
    { who: 11, k: "pt", base: 21000, emp: 150, er: 0 },
    { who: 11, k: "tds", base: 21000, emp: 2100, er: 0 },
  ];

  addStrings({
    en: {
      "ac8.n.ananya": "Ananya Rao", "ac8.n.vikram": "Vikram Sen", "ac8.n.meena": "Meenakshi Pillai",
      "ac8.n.suresh": "Suresh Kamath", "ac8.n.divya": "Divya Prakash", "ac8.n.manju": "Manjunath Gowda",
      "ac8.n.ramesh": "Ramesh Iyengar", "ac8.n.prakash": "Prakash Bhandari", "ac8.n.kavya": "Kavya Nair",
      "ac8.n.arvind": "Arvind Krishnan", "ac8.n.neha": "Neha Bhatt", "ac8.n.rohit": "Rohit Malhotra",
      "ac8.g.teach": "Teaching", "ac8.g.admin": "Administration", "ac8.g.support": "Support", "ac8.g.guest": "Guest faculty",
      "ac8.st.ka": "Karnataka", "ac8.st.tg": "Telangana",
      "ac7.n.ananya": "Ananya Rao", "ac7.n.vikram": "Vikram Sen", "ac7.n.meena": "Meenakshi Pillai",
      "ac7.n.suresh": "Suresh Kamath", "ac7.n.ramesh": "Ramesh Iyengar", "ac7.n.divya": "Divya Prakash",
      "ac7.h.80c": "Section 80C — investments",
      "ac7.h.80d": "Section 80D — health insurance",
      "ac7.h.hra": "House rent paid",
      "ac7.h.loan": "Interest on a housing loan",
      "ac7.h.80ccd": "Section 80CCD(1B) — pension",
      "ac7.fy": "2026–27",
    },
  });

  /* ============================================================
     AC-08 · THE CONTRIBUTIONS REGISTER
     ============================================================ */
  function ACContrib({ role, onNavigate }) {
    /* the accountant holds both campuses; everything below answers this */
    const [campus, setCampus] = useState(CAMPUS_ALL);
    const { c } = useTheme();
    const { t, ty, lang } = useLang();
    const d = D(), parts = P();
    const [period, setPeriod] = useState("2026-07");
    const [ent, setEnt] = useState("trust");
    const [kind, setKind] = useState("all");

    if (!d || !parts) return null;
    const Shell = parts.Shell;

    const has = d.hasData(ent, period);
    const empTotal = d.HEADS.reduce(function (n, k) {
      return n + d.CONTRIB.filter(function (r) {
        return r.e === ent && r.p === period && r.k === k && r.line.indexOf(".er") < 0 && r.line.indexOf(".eps") < 0
          && r.line.indexOf(".edli") < 0 && r.line.indexOf(".adm") < 0;
      }).reduce(function (m, r) { return m + r.v; }, 0);
    }, 0);
    const allTotal = d.payableOf(ent, period, null);
    const erTotal = allTotal - empTotal;

    const segments = d.HEADS.map(function (k, i) {
      return {
        key: k, value: Math.round(d.payableOf(ent, period, k)),
        label: t(d.HEAD_LABEL[k]),
        color: [c.chartBlue, c.chartTeal, c.chartAmber, c.chartGreen, c.chartPurple][i % 5],
      };
    });

    const metrics = [
      { k: "emp", label: t("ac8.m.emp"), value: inr(empTotal), note: t("ac8.m.empNote"), tone: c.chartBlue },
      { k: "er", label: t("ac8.m.er"), value: inr(erTotal), note: t("ac8.m.erNote"), tone: c.chartTeal },
      /* the sum of the two beside it */
      { k: "tot", label: t("ac8.m.total"), value: inr(allTotal), total: true, note: t("ac8.m.totalNote"), tone: c.chartBlue },
      { k: "cfg", label: t("ac8.m.cfg"), value: d.CFG_JUL.v, note: t("ac8.m.cfgNote"), tone: c.chartPurple },
    ];

    /* a line points at PEOPLE by index, so the scope is read off the
       person it belongs to, not off the line */
    const rows = LINES.filter(function (l) {
      if (kind !== "all" && l.k !== kind) return false;
      const who = PEOPLE[l.who];
      return !who || inCampus(campus, campusOfCode(who.staff));
    });

    const columns = [
      { key: "who", label: t("ac8.col.who") },
      { key: "cmp", label: t("kit.campus.label"), width: 140 },
      { key: "kind", label: t("ac8.col.kind") },
      { key: "base", label: t("ac8.col.base"), align: "right", mono: true },
      { key: "emp", label: t("ac8.col.emp"), align: "right", mono: true },
      { key: "er", label: t("ac8.col.er"), align: "right", mono: true },
      { key: "state", label: t("ac8.col.state") },
      { key: "act", label: "", align: "right", width: 52 },
    ];

    const rowData = rows.map(function (l, i) {
      const who = PEOPLE[l.who];
      return {
        id: who.staff + "-" + l.k + "-" + i,
        cells: {
          who: (
            <span style={{ display: "block" }}>
              <span style={ty("small", { color: c.ink, fontWeight: 600, display: "block" })}>{t(who.nameKey)}</span>
              <span style={G3.fig("xs", { color: c.inkFaint, display: "block", marginTop: 1 })}>
                {who.staff} · {t(who.groupKey)}
              </span>
            </span>
          ),
          cmp: campusLabel(t, campusOfCode(who.staff)),
          kind: <span style={ty("caption", { color: c.inkMuted })}>{t(d.HEAD_LABEL[l.k])}</span>,
          base: inr(l.base),
          emp: l.emp ? inr(l.emp) : <span style={{ color: c.inkFaint }}>—</span>,
          er: l.er ? inr(l.er) : <span style={{ color: c.inkFaint }}>—</span>,
          state: l.k === "pt" || l.k === "lwf"
            ? <StatusMark role="leave" glyph="globe" word={t("ac8.st." + who.state)} />
            : <span style={{ color: c.inkFaint }}>—</span>,
          act: (
            <ActionMenu ariaLabel={t("ac8.a.payslip")} items={[
              {
                key: "p", label: t("ac8.a.payslip"), icon: "payslip",
                onSelect: function () { onNavigate && onNavigate("payslips"); },
              },
            ]} />
          ),
        },
      };
    });

    return (
      <Shell campus={campus} onCampus={setCampus} role={role} active="acContrib" onNavigate={onNavigate} crumb={t("ac8.crumb")}
        title={t("ac8.title")} sub={t("ac8.sub")}>

        <Band head={t("ac8.band")} sub={t("ac8.bandSub")} metrics={metrics} />

        {/* THE SCOPE OF THE FIGURES IS NOT PART OF THE FIGURES
            (designer). Period and entity were drawn in the band's own
            corner, so the two controls that decide WHICH figures
            these are sat inside them -- and the kind filter that
            narrows the register below was a third control in a third
            place. Three questions, one row, under the band. */}
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 16 }}>
          <div style={{ flex: "1 1 200px", minWidth: 0, maxWidth: 300 }}>
            <Field id="ac8-p" label={t("ac8.f.period")}>
              <Select id="ac8-p" value={period} onChange={setPeriod}
                options={d.PERIODS.map(function (p) {
                  return { value: p, label: t("ac.mon." + Number(p.split("-")[1])) };
                })} />
            </Field>
          </div>
          <div style={{ flex: "1 1 260px", minWidth: 0, maxWidth: 360 }}>
            <Field id="ac8-e" label={t("ac8.f.entity")}>
              <Select id="ac8-e" value={ent} onChange={setEnt}
                options={d.ENTITIES.map(function (e) { return { value: e.key, label: t(e.nameKey) }; })} />
            </Field>
          </div>
          <div style={{ flex: "1 1 220px", minWidth: 0, maxWidth: 320 }}>
            <Field id="ac8-k" label={t("ac8.f.kind")}>
              <Select id="ac8-k" value={kind} onChange={setKind}
                options={[{ value: "all", label: t("ac8.f.kindAll") }].concat(
                  d.HEADS.map(function (k) { return { value: k, label: t(d.HEAD_LABEL[k]) }; }))} />
            </Field>
          </div>
        </div>

        {!has ? (
          <Card><EmptyState head={t("ac8.noPeriod")} body={t("ac8.noPeriodBody")} /></Card>
        ) : rows.length === 0 ? (
          <Card><EmptyState head={t("ac8.empty")} body={t("ac8.emptyBody")} /></Card>
        ) : (
          <Register
            title={t("ac8.reg")} sub={t("ac8.regSub")}
            columns={columns} rows={rowData}
            action={<Button kind="secondary" size="sm" iconLeft="download">{t("ac8.a.export")}</Button>}
            footer={<span style={ty("caption", { color: c.inkFaint, maxWidth: "80ch" })}>
              {t("ac8.foot", { n: num(rows.length), total: num(d.RUN_HEADS) })}
            </span>}
          />
        )}
      </Shell>
    );
  }

  /* ============================================================
     AC-07 · THE DECLARATIONS
     ============================================================ */
  const DECL = [
    {
      id: "d1", nameKey: "ac7.n.ananya", staff: "NAV-0142", regime: "old", since: 9,
      heads: [
        { k: "80c", key: "ac7.h.80c", declared: 150000, proofs: 2, state: "verified", verified: 150000 },
        { k: "80d", key: "ac7.h.80d", declared: 25000, proofs: 1, state: "pending" },
        { k: "hra", key: "ac7.h.hra", declared: 240000, proofs: 2, state: "pending" },
      ],
    },
    {
      id: "d2", nameKey: "ac7.n.vikram", staff: "NAV-0118", regime: "old", since: 6,
      heads: [
        { k: "80c", key: "ac7.h.80c", declared: 150000, proofs: 1, state: "pending" },
        { k: "loan", key: "ac7.h.loan", declared: 200000, proofs: 0, state: "none" },
      ],
    },
    {
      id: "d3", nameKey: "ac7.n.meena", staff: "NAV-0088", regime: "old", since: 12,
      heads: [
        { k: "80c", key: "ac7.h.80c", declared: 150000, proofs: 3, state: "verified", verified: 142000 },
        { k: "80ccd", key: "ac7.h.80ccd", declared: 50000, proofs: 1, state: "verified", verified: 50000 },
        { k: "80d", key: "ac7.h.80d", declared: 50000, proofs: 1, state: "rejected", whyKey: "ac7.d.r1" },
      ],
    },
    {
      id: "d4", nameKey: "ac7.n.suresh", staff: "NAV-0176", regime: "old", since: 3,
      heads: [
        { k: "80c", key: "ac7.h.80c", declared: 90000, proofs: 1, state: "pending" },
      ],
    },
    { id: "d5", nameKey: "ac7.n.ramesh", staff: "NAV-0034", regime: "new", since: 0, heads: [] },
    { id: "d6", nameKey: "ac7.n.divya", staff: "NAV-0199", regime: "new", since: 0, heads: [] },
  ];
  /* what a head is worth in tax, as a rate band the config supplies.
     Never a slab table on this screen — the rate comes from the run. */
  const MARGINAL = 0.2;
  const MONTHS_LEFT = 7;

  function declaredOf(p) { return p.heads.reduce(function (n, h) { return n + h.declared; }, 0); }
  function acceptedOf(p, over) {
    return p.heads.reduce(function (n, h) {
      const st = (over && over[p.id] && over[p.id][h.k]) || null;
      if (st) return n + (st.state === "verified" ? st.amount : 0);
      return n + (h.state === "verified" ? h.verified : 0);
    }, 0);
  }
  function headState(p, h, over) {
    const st = (over && over[p.id] && over[p.id][h.k]) || null;
    return st ? st.state : h.state;
  }
  function headAmount(p, h, over) {
    const st = (over && over[p.id] && over[p.id][h.k]) || null;
    if (st) return st.state === "verified" ? st.amount : null;
    return h.state === "verified" ? h.verified : null;
  }

  function ACDecl({ role, onNavigate }) {
    /* the accountant holds both campuses; everything below answers this */
    const [campus, setCampus] = useState(CAMPUS_ALL);
    const { c } = useTheme();
    const { t, ty } = useLang();
    const d = D(), parts = P();
    const [over, setOver] = useState({});
    const [openId, setOpenId] = useState(null);
    const [panel, setPanel] = useState(null);
    const [amount, setAmount] = useState("");
    const [reason, setReason] = useState("");
    const [closed, setClosed] = useState(false);
    const [closing, setClosing] = useState(false);

    if (!d || !parts) return null;
    const Shell = parts.Shell, Trail = parts.Trail;

    const here = DECL.filter(function (p) { return inCampus(campus, campusOfCode(p.staff)); });
    const declaring = here.filter(function (p) { return p.regime === "old"; });
    const newRegime = here.length - declaring.length;
    const claimed = declaring.reduce(function (n, p) { return n + declaredOf(p); }, 0);
    const accepted = declaring.reduce(function (n, p) { return n + acceptedOf(p, over); }, 0);

    const counts = { verified: 0, pending: 0, none: 0, rejected: 0 };
    declaring.forEach(function (p) {
      p.heads.forEach(function (h) {
        const st = headState(p, h, over);
        counts[st === "verified" ? "verified" : st === "rejected" ? "rejected" : st === "none" ? "none" : "pending"] += 1;
      });
    });

    const segments = [
      { key: "v", value: counts.verified, label: t("ac7.mix.verified"), color: c.chartGreen },
      { key: "p", value: counts.pending, label: t("ac7.mix.pending"), color: c.chartAmber },
      { key: "n", value: counts.none, label: t("ac7.mix.none"), color: c.chartRed },
      { key: "r", value: counts.rejected, label: t("ac7.mix.rejected"), color: c.chartRed },
    ];

    const metrics = [
      { k: "staff", label: t("ac7.m.staff"), value: num(declaring.length), n: declaring.length, note: t("ac7.m.staffNote", { n: num(d.RUN_HEADS) }), tone: c.chartSand },
      /* what is accepted is a part of what was declared */
      { k: "claim", label: t("ac7.m.claimed"), value: inr(claimed), total: true, note: t("ac7.m.claimedNote"), tone: c.chartAmber },
      { k: "acc", label: t("ac7.m.accepted"), value: inr(accepted), note: t("ac7.m.acceptedNote"), tone: c.chartGreen },
      {
        k: "win", label: t("ac7.m.window"),
        value: closed ? t("ac7.m.windowClosed") : t("ac7.m.windowOpen"),
        note: closed ? t("ac7.m.windowNoteClosed", { date: d.fmtDate(t, d.TODAY) })
          : t("ac7.m.windowNote", { date: d.fmtDate(t, "2026-12-31") }),
        tone: closed ? c.chartGreen : c.chartBlue,
      },
    ];

    const person = openId ? DECL.filter(function (p) { return p.id === openId; })[0] : null;

    /* ---------- the one-person view ---------- */
    if (person) {
      const dec = declaredOf(person);
      const acc = acceptedOf(person, over);
      const beforeTds = Math.round(dec * MARGINAL);
      const afterTds = Math.round(acc * MARGINAL);

      return (
        <Shell campus={campus} onCampus={setCampus} role={role} active="acDecl" onNavigate={onNavigate} crumb={t("ac7.crumb")}
          title={t("ac7.d.title", { name: t(person.nameKey), fy: t("ac7.fy") })}
          sub={t("ac7.d.sub")}
          aside={
            <Button kind="secondary" size="sm" iconLeft="arrow" onClick={function () { setOpenId(null); setPanel(null); }}>
              {t("ac7.d.back")}
            </Button>
          }
        >
          <Band
            head={t("ac7.d.effect")} sub={t("ac7.d.effectSub")}
            metrics={[
              { k: "b", label: t("ac7.d.beforeTds"), value: inr(beforeTds), note: t("ac7.d.sum", { d: inr(dec), a: inr(acc) }), tone: c.chartSand },
              { k: "a", label: t("ac7.d.afterTds"), value: inr(afterTds), note: t("ac7.d.effectSub"), tone: c.chartGreen },
              { k: "s", label: t("ac7.d.saved"), value: inr(beforeTds - afterTds), note: "", tone: c.chartGreen },
              { k: "m", label: t("ac7.d.monthly"), value: inr(Math.round((beforeTds - afterTds) / MONTHS_LEFT)), note: "", tone: c.chartBlue },
            ]}
          />

          <Card title={t("ac7.d.heads")} sub={t("ac7.d.headsSub")} style={{ marginBottom: G3.layout.gap }}>
            {/* the two money columns are labelled once, here, instead of
                on every row — eight words of caps per row is noise */}
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", paddingBottom: 10, borderBottom: "1px solid " + c.rule }}>
              <div style={{ flex: "2 1 260px", minWidth: 0 }}>
                <span style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" })}>{t("ac7.d.head")}</span>
              </div>
              <div style={{ flex: "1 1 120px", minWidth: 0 }}>
                <span style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" })}>{t("ac7.d.declared")}</span>
              </div>
              <div style={{ flex: "1 1 120px", minWidth: 0 }}>
                <span style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" })}>{t("ac7.d.verified")}</span>
              </div>
              <div style={{ flex: "0 0 auto", width: 150 }} />
            </div>
            {person.heads.map(function (h, i) {
              const st = headState(person, h, over);
              const amt = headAmount(person, h, over);
              const live = !closed && (st === "pending" || st === "none");
              return (
                <div key={h.k} style={{
                  display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap",
                  padding: "14px 0", borderTop: i ? "1px solid " + c.rule : "none",
                }}>
                  <div style={{ flex: "2 1 260px", minWidth: 0 }}>
                    <div style={ty("small", { color: c.ink, fontWeight: 700 })}>{t(h.key)}</div>
                    <div style={ty("caption", { color: c.inkMuted, marginTop: 2 })}>
                      {h.proofs
                        ? (h.proofs === 1 ? t("ac7.d.hasProof", { n: num(h.proofs) }) : t("ac7.d.hasProofs", { n: num(h.proofs) }))
                        : t("ac7.d.noProof")}
                      {st === "rejected" && h.whyKey ? " · " + t(h.whyKey) : ""}
                    </div>
                  </div>
                  <div style={{ flex: "1 1 120px", minWidth: 0 }}>
                    <div style={G3.fig("sm", { color: c.ink, fontWeight: 700 })}>{inr(h.declared)}</div>
                  </div>
                  <div style={{ flex: "1 1 120px", minWidth: 0 }}>
                    <div style={G3.fig("sm", { color: amt == null ? c.inkFaint : c.presentText, fontWeight: 700 })}>
                      {amt == null ? "—" : inr(amt)}
                    </div>
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    <StatusMark
                      role={st === "verified" ? "present" : st === "rejected" ? "danger" : st === "none" ? "absent" : "late"}
                      glyph={st === "verified" ? "check" : st === "rejected" ? "alert" : st === "none" ? "alert" : "clock"}
                      word={t("ac7.mix." + (st === "verified" ? "verified" : st === "rejected" ? "rejected" : st === "none" ? "none" : "pending"))} />
                  </div>
                  <div style={{ flexShrink: 0, display: "flex", gap: 8 }}>
                    {h.proofs ? <Button kind="quiet" size="sm" iconLeft="scan">{t("ac7.d.view")}</Button> : null}
                    {live && h.proofs ? (
                      <React.Fragment>
                        <Button kind="primary" size="sm" iconLeft="check"
                          onClick={function () { setPanel({ kind: "verify", h: h }); setAmount(String(h.declared)); }}>
                          {t("ac7.d.verify")}
                        </Button>
                        <Button kind="danger" size="sm" iconLeft="alert"
                          onClick={function () { setPanel({ kind: "reject", h: h }); setReason(""); }}>
                          {t("ac7.d.reject")}
                        </Button>
                      </React.Fragment>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </Card>

          {panel ? (
            <Card
              icon={panel.kind === "verify" ? "check" : "alert"}
              iconTone={panel.kind === "verify" ? "present" : "danger"}
              title={panel.kind === "verify" ? t("ac7.d.verifyHead", { head: t(panel.h.key) }) : t("ac7.d.rejectHead", { head: t(panel.h.key) })}
              sub={panel.kind === "verify" ? t("ac7.d.verifyHint") : t("ac7.d.rejectHint")}
              style={{ marginBottom: G3.layout.gap }}
            >
              <div style={{ maxWidth: 520 }}>
                {panel.kind === "verify" ? (
                  <Field id="ac7-amt" label={t("ac7.d.amount")}
                    error={Number(amount) > panel.h.declared ? t("ac7.d.over") : null}>
                    <Input id="ac7-amt" value={amount} onChange={setAmount} />
                  </Field>
                ) : (
                  <Field id="ac7-why" label={t("ac7.d.reject")}>
                    <Select id="ac7-why" value={reason} onChange={setReason}
                      options={[{ value: "", label: "—" }].concat(
                        ["r1", "r2", "r3", "r4"].map(function (r) { return { value: r, label: t("ac7.d." + r) }; }))} />
                  </Field>
                )}
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 4 }}>
                  <Button
                    kind={panel.kind === "verify" ? "primary" : "danger"} size="sm"
                    disabled={panel.kind === "verify" ? !(Number(amount) > 0 && Number(amount) <= panel.h.declared) : !reason}
                    onClick={function () {
                      if (panel.kind === "verify" && !(Number(amount) > 0 && Number(amount) <= panel.h.declared)) return;
                      if (panel.kind === "reject" && !reason) return;
                      const next = Object.assign({}, over);
                      next[person.id] = Object.assign({}, next[person.id]);
                      next[person.id][panel.h.k] = panel.kind === "verify"
                        ? { state: "verified", amount: Number(amount) }
                        : { state: "rejected", whyKey: "ac7.d." + reason };
                      setOver(next);
                      setPanel(null);
                    }}
                  >{panel.kind === "verify" ? t("ac7.d.go") : t("ac7.d.rejectGo")}</Button>
                  <Button kind="secondary" size="sm" onClick={function () { setPanel(null); }}>{t("ac7.d.cancel")}</Button>
                </div>
              </div>
            </Card>
          ) : null}

          <Card title={t("ac7.d.trail")}>
            <Trail
              rows={[
                { glyph: "document", title: t("ac7.d.tr.declared"), when: d.fmtDate(t, "2026-05-28"), detail: inr(dec) },
                { glyph: "scan", title: t("ac7.d.tr.proof"), when: d.fmtDate(t, "2026-07-14") },
              ].concat(acc ? [{ glyph: "check", title: t("ac7.d.tr.verified"), when: d.fmtDate(t, d.TODAY), detail: inr(acc) }] : [])}
              note={t("ac7.d.trailFoot")}
            />
          </Card>
        </Shell>
      );
    }

    /* ---------- the register ---------- */
    const columns = [
      { key: "who", label: t("ac7.col.who") },
      { key: "cmp", label: t("kit.campus.label"), width: 140 },
      { key: "regime", label: t("ac7.col.regime") },
      { key: "declared", label: t("ac7.col.declared"), align: "right", mono: true },
      { key: "verified", label: t("ac7.col.verified"), align: "right", mono: true },
      { key: "proofs", label: t("ac7.col.proofs"), mono: true },
      { key: "state", label: t("ac7.col.tds") },
      { key: "act", label: "", align: "right", width: 52 },
    ];

    const rowData = here.map(function (p) {
      const dec = declaredOf(p);
      const acc = acceptedOf(p, over);
      const done = p.heads.filter(function (h) { return headState(p, h, over) !== "pending" && headState(p, h, over) !== "none"; }).length;
      return {
        id: p.id,
        tone: p.regime === "new" ? "dim" : undefined,
        cells: {
          who: (
            <span style={{ display: "block" }}>
              <span style={ty("small", { color: c.ink, fontWeight: 600, display: "block" })}>{t(p.nameKey)}</span>
              <span style={G3.fig("xs", { color: c.inkFaint, display: "block", marginTop: 1 })}>{p.staff}</span>
            </span>
          ),
          cmp: campusLabel(t, campusOfCode(p.staff)),
          regime: <span style={ty("caption", { color: c.inkMuted })}>{t("ac7.regime." + p.regime)}</span>,
          declared: dec ? inr(dec) : <span style={{ color: c.inkFaint }}>—</span>,
          verified: acc ? inr(acc) : <span style={{ color: c.inkFaint }}>—</span>,
          proofs: p.heads.length
            ? t("ac7.proofs", { done: num(done), all: num(p.heads.length) })
            : <span style={{ color: c.inkFaint }}>—</span>,
          state: p.regime === "new"
            ? <span style={ty("caption", { color: c.inkFaint })}>{t("ac7.regime.newNote")}</span>
            : <StatusMark
              role={done === p.heads.length ? "present" : "late"}
              glyph={done === p.heads.length ? "check" : "clock"}
              word={inr(Math.round(acc * MARGINAL))} />,
          act: p.regime === "new" ? null : (
            <ActionMenu ariaLabel={t("ac7.a.open")} items={[
              { key: "o", label: t("ac7.a.open"), icon: "arrow", tone: "go", onSelect: function () { setOpenId(p.id); } },
            ]} />
          ),
        },
      };
    });

    return (
      <Shell campus={campus} onCampus={setCampus} role={role} active="acDecl" onNavigate={onNavigate} crumb={t("ac7.crumb")}
        title={t("ac7.title")} sub={t("ac7.sub")}>

        <Band
          head={t("ac7.band")} sub={t("ac7.bandSub")} metrics={metrics}
          action={closed ? null : (
            <Button kind="secondary" size="sm" iconLeft="lock" onClick={function () { setClosing(true); }}>
              {t("ac7.a.close")}
            </Button>
          )}
        />

        {closing ? (
          <Card icon="lock" iconTone="late" title={t("ac7.closed.head")} sub={t("ac7.closed.hint")}
            style={{ marginBottom: G3.layout.gap }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Button kind="danger" size="sm" iconLeft="lock"
                onClick={function () { setClosed(true); setClosing(false); }}>{t("ac7.closed.go")}</Button>
              <Button kind="secondary" size="sm" onClick={function () { setClosing(false); }}>{t("ac7.closed.cancel")}</Button>
            </div>
          </Card>
        ) : null}

        <Register
          title={t("ac7.reg")} sub={t("ac7.regSub")}
          columns={columns} rows={rowData}
          onSelect={function (id) {
            const p = DECL.filter(function (x) { return x.id === id; })[0];
            if (p && p.regime === "old") setOpenId(id);
          }}
          action={<Button kind="secondary" size="sm" iconLeft="download">{t("ac7.a.export")}</Button>}
          footer={<span style={ty("caption", { color: c.inkFaint, maxWidth: "80ch" })}>
            {t("ac7.foot", { n: num(here.length), newN: num(newRegime) })}
          </span>}
        />
      </Shell>
    );
  }

  window.Pages3 = window.Pages3 || {};
  window.Pages3.ACContrib = ACContrib;
  window.Pages3.ACDecl = ACDecl;
  /* what the desk reads about declarations. This module owns them, so
     the home screen asks rather than keeping its own count. */
  window.Pages3.ACDeclData = {
    staff: DECL.filter(function (p) { return p.regime === "old"; }).length,
    newRegime: DECL.filter(function (p) { return p.regime === "new"; }).length,
    pending: DECL.reduce(function (n, p) {
      return n + p.heads.filter(function (h) { return h.state === "pending" || h.state === "none"; }).length;
    }, 0),
    declared: DECL.reduce(function (n, p) { return n + declaredOf(p); }, 0),
    /* one person's own declaration, for the employee screen that
       raised it. The accountant verifies these rows; the employee
       reads the same ones. */
    forStaff: function (code) {
      return DECL.filter(function (p) { return p.staff === code; })[0] || null;
    },
    MARGINAL: MARGINAL, MONTHS_LEFT: MONTHS_LEFT,
    declaredOf: declaredOf, acceptedOf: acceptedOf,
    accepted: DECL.reduce(function (n, p) { return n + acceptedOf(p, null); }, 0),
  };
})();
