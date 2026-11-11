/* @jsxRuntime classic */
/* ============================================================
   Naveya — the Payroll Officer's four standing modules
   window.Pages3.PYReports (PYAdjust, PYExits and PYRules moved out)

   WHY THIS FILE EXISTS. Until 2026-10-07 eight of this role's
   eighteen screens lived behind one rail item called "Operations",
   two of them two tablists deep. "Operations" is not a word a payroll
   officer uses; it was the container for everything that was not the
   run, and a container named after what it is not cannot tell you
   whether what you want is inside it. Worse, reaching the arrears
   workbench meant Operations -> "Claims & arrears" -> Arrears: three
   choices to arrive at one workbench, and the second choice was a
   word invented to hold the third.

   THE SPLIT (designer, 2026-10-07): "make every module simple as per
   what can be useful for a payroll officer ... i want only what is
   neccesary". So the bag is gone and each question gets a rail item
   of its own, named after the thing it holds:

     Adjustments          PY-13 + PY-14 + PY-15. The three amounts
                          that attach to a run without being part of
                          anybody's salary structure: money we recover
                          (loans), money we owe (claims), money we
                          owe for months already paid (arrears). One
                          tablist, three peers, no nesting.
     Exits & settlements  PY-16 + PY-17. Register and detail of one
                          subject, so it was already master/detail and
                          needed no tabs at all.
     Pay rules            PY-02 + PY-03 + PY-04. What the engine is
                          allowed to do, set rarely and changed
                          carefully. These three were marooned in a
                          module called "Salary" whose fourth and
                          fifth tabs were about PEOPLE, not rules.
     Registers & reports  PY-18. What somebody asks payroll for.

   NOTHING HERE IS A SECOND COPY. Every screen is the one already
   written in pages/py-ops.jsx and pages/py-salary.jsx, published
   shell-less as `PYParts` / `PYSalParts` and mounted here. Those
   files keep their datasets and their cross-screen arithmetic checks,
   so a figure cannot drift by being shown in a new place. This file
   supplies only what a module owes its reader: a frame, a title, the
   question it answers, and the run it is standing in.

   SPEC — docs/screen-inventory.md PY-13..PY-18, PY-02..PY-04.
   ============================================================ */
(function () {
  const G3 = window.G3;
  const UI = window.UI3;
  const { useState } = React;
  const {
    useTheme, ThemeToggle, useLang, addStrings,
    Rail, Motif, Chip, StatusMark, Tabs, TabPanel,
  } = UI;

  const Parts = (window.Pages3 && window.Pages3.PYParts) || {};
  const SalParts = (window.Pages3 && window.Pages3.PYSalParts) || {};

  addStrings({
    en: {
      "pysh.crumb": "Payroll",
      "pysh.entity": "Naveya Vidya Trust — Bengaluru",
      "pysh.maker": "Sunita Kulkarni",
      "pysh.roleMaker": "Payroll Officer",
      "pysh.run": "AUG-2026",
      "pysh.awaiting": "With the checker",

      "pysh.adj.title": "Adjustments",
      "pysh.adj.q": "What is being added to this run, or recovered from it, on top of salary?",
      "pysh.adj.tab.loans": "Loans & advances",
      "pysh.adj.tab.claims": "Claims",
      "pysh.adj.tab.arrears": "Arrears",
      "pysh.adj.tabs.aria": "Adjustments to the run",

      "pysh.exits.title": "Exits & settlements",
      "pysh.exits.q": "Who is leaving, and what do we owe them or they us?",

      "pysh.rules.title": "Pay rules",
      "pysh.rules.q": "What is the engine allowed to do?",
      "pysh.rules.tab.groups": "Pay groups",
      "pysh.rules.tab.structures": "Salary structures",
      "pysh.rules.tab.honorarium": "Honorarium rates",
      "pysh.rules.tabs.aria": "Pay rules",
      "pysh.rules.note": "Changed rarely. A change here moves what everybody on the group is paid, from a date you choose.",

      "pysh.reports.title": "Registers & reports",
      "pysh.reports.q": "What payroll register do I need to produce?",

      "pysh.missing": "This screen has not loaded.",
      "pysh.missingBody": "It is published by pages/py-ops.jsx or pages/py-salary.jsx. If you are seeing this, one of those files failed to parse — the browser console names the line.",
    },
  });

  /* ------------------------------------------------------------
     The frame. Identical in structure to the frame every other
     payroll module draws, because the reader should not be able to
     tell from the chrome which module they are in -- only from the
     title and the question under it.
     ------------------------------------------------------------ */
  function Shell({ role, onNavigate, active, titleKey, qKey, chips, tabs, children }) {
    const { c } = useTheme();
    const { t, ty, lang } = useLang();
    const L = G3.layout;
    return (
      <div
        className="nv3"
        style={{ display: "flex", minHeight: "100vh", background: c.page, color: c.ink, fontFamily: G3.font.ui }}
      >
        <Rail role={role || "payrollOfficer"} active={active} onNavigate={onNavigate} initials="SK" />
        <main style={{ flex: 1, minWidth: 0, position: "relative", overflowX: "clip" }}>
          <Motif />
          <div style={{ position: "relative", zIndex: 1, maxWidth: L.contentMax, margin: "0 auto", padding: "22px " + L.contentPadX + "px 56px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, marginBottom: 16 }}>
              <div style={ty("small", { color: c.inkMuted })}>
                <span style={{ color: c.ink, fontWeight: 700 }}>{t("pysh.crumb")}</span>
                <span style={{ margin: "0 8px", color: c.inkFaint }} aria-hidden="true">&middot;</span>
                <span>{t("pysh.entity")}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <ThemeToggle />
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, flexWrap: "wrap", marginBottom: 18 }}>
              <div style={{ minWidth: 320, maxWidth: 780 }}>
                <h1 style={ty("display", { margin: 0, color: c.ink })}>{t(titleKey)}</h1>
                <div style={ty("small", { color: c.inkMuted, marginTop: 6 })}>{t(qKey)}</div>
              </div>
              <div style={{ display: "flex", gap: 9, flexWrap: "wrap", alignItems: "center" }}>{chips}</div>
            </div>

            {tabs}
            {children}
          </div>
        </main>
      </div>
    );
  }

  /* the chips every run-bound module carries: which run, and where it
     has got to. Pay rules does NOT carry them -- a rule is not bound
     to a period, and saying "AUG-2026" above it would imply it was. */
  function RunChips() {
    const { c } = useTheme();
    const { t } = useLang();
    return (
      <React.Fragment>
        <Chip bg={c.sunken} fg={c.inkMuted} mono>{t("pysh.run")}</Chip>
        <StatusMark role="late" glyph="clock" word={t("pysh.awaiting")} />
      </React.Fragment>
    );
  }

  /* A part that failed to publish says so in place, naming the file,
     rather than rendering an empty module that looks finished. */
  function Missing() {
    const { c } = useTheme();
    const { t, ty } = useLang();
    return (
      <div style={{ border: "1px solid " + c.rule, borderRadius: G3.r.md, padding: 20, background: c.surface }}>
        <div style={ty("small", { color: c.ink, fontWeight: 700 })}>{t("pysh.missing")}</div>
        <p style={ty("caption", { color: c.inkMuted, margin: "6px 0 0", maxWidth: "62ch" })}>{t("pysh.missingBody")}</p>
      </div>
    );
  }

  function Part({ of }) { return of ? React.createElement(of) : <Missing />; }

  /* ============================================================
     ADJUSTMENTS -- PY-13 loans, PY-14 claims, PY-15 arrears.

     Three peers, one tablist. They belong together because each is an
     amount a maker attaches to a run and a DISTINCT checker releases,
     and because the officer reconciling the run's deduction and
     earnings lines has to read all three to explain the total. They
     are not nested, because none of them contains another.
     ============================================================ */
  function PYAdjust({ role, onNavigate }) {
    const { t } = useLang();
    const [tab, setTab] = useState("loans");
    const items = [
      { key: "loans", label: t("pysh.adj.tab.loans") },
      { key: "claims", label: t("pysh.adj.tab.claims") },
      { key: "arrears", label: t("pysh.adj.tab.arrears") },
    ];
    return (
      <Shell
        role={role} onNavigate={onNavigate} active="pyAdjust"
        titleKey="pysh.adj.title" qKey="pysh.adj.q" chips={<RunChips />}
        tabs={<Tabs items={items} active={tab} onChange={setTab} ariaLabel={t("pysh.adj.tabs.aria")} idBase="pyadj" />}
      >
        <div style={{ marginTop: G3.layout.gap }}>
          {tab === "loans" ? <TabPanel idBase="pyadj" tabKey="loans"><Part of={Parts.Loans} /></TabPanel> : null}
          {tab === "claims" ? <TabPanel idBase="pyadj" tabKey="claims"><Part of={Parts.Claims} /></TabPanel> : null}
          {tab === "arrears" ? <TabPanel idBase="pyadj" tabKey="arrears"><Part of={Parts.Arrears} /></TabPanel> : null}
        </div>
      </Shell>
    );
  }

  /* ============================================================
     EXITS & SETTLEMENTS -- PY-16 register, PY-17 settlement detail.

     No tablist: the register and the settlement are one subject at
     two depths, and the screen already opens the settlement over the
     register. A tab would have made the detail a sibling of its own
     list.
     ============================================================ */
  /* ============================================================
     PAY RULES -- PY-02 groups, PY-03 structures, PY-04 honorarium.

     The setup module. It carries no run chip on purpose: a pay rule
     is effective-dated, not period-bound, and a run identifier above
     it would suggest this month's run were the thing being edited.
     The standing note says what a change here costs instead.
     ============================================================ */
  function PYRules({ role, onNavigate }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [tab, setTab] = useState("groups");
    const items = [
      { key: "groups", label: t("pysh.rules.tab.groups") },
      { key: "structures", label: t("pysh.rules.tab.structures") },
      { key: "honorarium", label: t("pysh.rules.tab.honorarium") },
    ];
    /* the setup tabs ask to jump to each other and to the salary
       register; the first two are local, the third is another module */
    function goTab(k) {
      if (k === "people") { if (onNavigate) onNavigate("pyPeople"); return; }
      setTab(k === "honorarium" ? "honorarium" : k === "structures" ? "structures" : "groups");
    }
    return (
      <Shell
        role={role} onNavigate={onNavigate} active="pyRules"
        titleKey="pysh.rules.title" qKey="pysh.rules.q"
        tabs={<Tabs items={items} active={tab} onChange={setTab} ariaLabel={t("pysh.rules.tabs.aria")} idBase="pyrules" />}
      >
        <p style={ty("caption", { color: c.inkMuted, margin: "12px 0 0", maxWidth: "74ch" })}>{t("pysh.rules.note")}</p>
        <div style={{ marginTop: G3.layout.gap }}>
          {tab === "groups" ? (
            <TabPanel idBase="pyrules" tabKey="groups">
              {SalParts.PayGroups ? <SalParts.PayGroups goTab={goTab} /> : <Missing />}
            </TabPanel>
          ) : null}
          {tab === "structures" ? (
            <TabPanel idBase="pyrules" tabKey="structures">
              {SalParts.Structures ? <SalParts.Structures goTab={goTab} /> : <Missing />}
            </TabPanel>
          ) : null}
          {tab === "honorarium" ? (
            <TabPanel idBase="pyrules" tabKey="honorarium">
              {SalParts.Honorarium ? <SalParts.Honorarium goTab={goTab} onNavigate={onNavigate} /> : <Missing />}
            </TabPanel>
          ) : null}
        </div>
      </Shell>
    );
  }

  /* ============================================================
     REGISTERS & REPORTS -- PY-18. One screen, one rail item, no tabs.
     ============================================================ */
  function PYReports({ role, onNavigate }) {
    return (
      <Shell
        role={role} onNavigate={onNavigate} active="pyReports"
        titleKey="pysh.reports.title" qKey="pysh.reports.q" chips={<RunChips />}
      >
        <div style={{ marginTop: 4 }}><Part of={Parts.Reports} /></div>
      </Shell>
    );
  }

  window.Pages3 = window.Pages3 || {};
  /* PYAdjust now lives in pages/py-adjust.jsx, which gives each of
     the three a band and a record of its own. */
  /* PYExits now lives in pages/py-exits.jsx, which leads with the
     three statutory clocks an exit starts rather than one count of
     days since the last working day. */
  /* PYRules now lives in pages/py-rules.jsx, which merges PY-02
     and PY-03 into one surface. This file keeps the other three
     modules and no longer publishes a rules screen. */
  /* PYReports now lives in pages/py-reports.jsx, which turns the
     report list into a catalogue of fourteen registers across four
     subjects and lets every one of them be opened. */
})();
