/* ============================================================
   payslips.jsx — "Payslips / My Payroll Register" (single-employee
   scope), ported from design/mockups/PayrollRegister.dc.html's
   register grammar. CONTENT ONLY — no rail/shell; renders into the
   full-bleed content region to the right of the approved Home
   variant A rail (mounted by a separate wiring pass).

   Composes ONLY from window.UI2 (design/v2/kit.jsx). Classic-JSX
   runtime IIFE, no imports/exports. Exposes window.Pages2.Payslips.
   One language rendered at a time via the shared LangProvider's
   lang state; page-local copy not already in kit.jsx's STRINGS
   table is translated through a small local dictionary (STR2/L())
   that still reads the SAME shared `lang`, so the single global
   switcher drives this page too.
   ============================================================ */
(function () {
  const { Fragment } = React;
  const G = window.G2;
  const {
    useTheme, useLang, Button, Chip, Mark, Figure, Seal,
    SectionHeader, Icon, ActionBar, Masthead, StatusFooter, Register,
    inr, Fonts,
  } = window.UI2;

  // ---------------------------------------------------------------
  // Page-local i18n dictionary — page-specific copy not already in
  // kit.jsx's shared STRINGS table. Bound to the SAME lang the global
  // switcher drives (via useLang()'s `lang`), so there is still only
  // ever one language on screen. Statutory abbreviations (PF/ESI/PT/
  // TDS) are left as-is in both languages — real Indian payslips,
  // Hindi included, print these as the scheme codes, never translated.
  // ---------------------------------------------------------------
  const STR2 = {
    en: {
      "crumb.payroll": "Payroll", "crumb.payslips": "Payslips",
      "badge.locked": "LOCKED",
      "status.filed": "Filed · awaiting disbursal",
      "action.downloadPayslip": "Download payslip (PDF)",

      "masthead.kicker": "SALARY REGISTER · 01–31 AUGUST 2026",
      "masthead.titleDeva": "वेतन रजिस्टर",
      "masthead.figureKicker": "NET PAYABLE",
      "masthead.grossLabel": "gross",
      "masthead.deductionsLabel": "deductions",
      "masthead.metaLocked": "locked",

      "employee.name": "Ananya Rao",
      "employee.code": "NAV-0234",
      "employee.designation": "PGT — Mathematics",
      "employee.campus": "Aravali Campus",

      "section.breakdown": "Earnings & deductions",
      "section.history": "Payslip history",

      "col.component": "Component", "col.basis": "Basis / rule",
      "col.type": "Type", "col.statutory": "Statutory", "col.amount": "Amount ₹",

      "chip.earning": "EARNING", "chip.deduction": "DEDUCTION",

      "row.basic.name": "Basic Pay", "row.basic.basis": "31/31 days paid",
      "row.hra.name": "House Rent Allowance", "row.hra.basis": "40% of Basic Pay",
      "row.teaching.name": "Teaching & Academic Allowance", "row.teaching.basis": "Fixed monthly",
      "row.transport.name": "Transport Allowance", "row.transport.basis": "Fixed monthly",
      "row.medical.name": "Medical Allowance", "row.medical.basis": "Fixed monthly",
      "row.pf.name": "Employee Provident Fund", "row.pf.basis": "12% of Basic · capped ₹1,800",
      "row.esi.name": "Employee State Insurance", "row.esi.basis": "Not applicable · gross exceeds ₹21,000 ESI ceiling",
      "row.pt.name": "Professional Tax (Haryana)", "row.pt.basis": "Slab · gross > ₹15,000/month",
      "row.tds.name": "Tax Deducted at Source", "row.tds.basis": "New regime · FY 2026–27",

      "subtotal.gross": "Gross Earnings", "subtotal.deductions": "Total Deductions",
      "totals.net": "NET PAY · AUGUST 2026 · 31 DAYS",

      "verify.stageDraft": "Drafted", "verify.stageSubmitted": "Submitted",
      "verify.stageApproved": "Approved & disbursed",
      "verify.note": "Maker–checker: prepared by R. Subramanian, approved by A. Nambiar (Finance Head)",

      "period.col.period": "Period", "period.col.status": "Status",
      "period.col.net": "Net Pay ₹", "period.col.action": "Payslip",
      "period.totals": "PAID YTD · 5 OF 6 PERIODS",
      "status.paid": "Paid",

      "footer.rule": "Every figure is Decimal-exact — nothing rounded for display",
      "footer.note": "Payslips are issued by HR; you cannot edit these records",
      "footer.tag": "Δ LEDGER BALANCED",
    },
    hi: {
      "crumb.payroll": "पेरोल", "crumb.payslips": "वेतन पर्चियाँ",
      "badge.locked": "लॉक्ड",
      "status.filed": "दाखिल · भुगतान लंबित",
      "action.downloadPayslip": "वेतन पर्ची डाउनलोड करें (PDF)",

      "masthead.kicker": "वेतन रजिस्टर · 01–31 अगस्त 2026",
      "masthead.titleDeva": "वेतन रजिस्टर",
      "masthead.figureKicker": "शुद्ध देय राशि",
      "masthead.grossLabel": "सकल",
      "masthead.deductionsLabel": "कटौती",
      "masthead.metaLocked": "लॉक किया गया",

      "employee.name": "आनन्या राव",
      "employee.code": "NAV-0234",
      "employee.designation": "पीजीटी — गणित",
      "employee.campus": "अरावली परिसर",

      "section.breakdown": "आय एवं कटौतियाँ",
      "section.history": "वेतन पर्ची इतिहास",

      "col.component": "घटक", "col.basis": "आधार / नियम",
      "col.type": "प्रकार", "col.statutory": "सांविधिक", "col.amount": "राशि ₹",

      "chip.earning": "आय", "chip.deduction": "कटौती",

      "row.basic.name": "मूल वेतन", "row.basic.basis": "31/31 दिन का भुगतान",
      "row.hra.name": "मकान किराया भत्ता", "row.hra.basis": "मूल वेतन का 40%",
      "row.teaching.name": "शिक्षण एवं शैक्षणिक भत्ता", "row.teaching.basis": "निश्चित मासिक",
      "row.transport.name": "परिवहन भत्ता", "row.transport.basis": "निश्चित मासिक",
      "row.medical.name": "चिकित्सा भत्ता", "row.medical.basis": "निश्चित मासिक",
      "row.pf.name": "कर्मचारी भविष्य निधि", "row.pf.basis": "मूल वेतन का 12% · अधिकतम ₹1,800",
      "row.esi.name": "कर्मचारी राज्य बीमा", "row.esi.basis": "लागू नहीं · सकल वेतन ₹21,000 ESI सीमा से अधिक",
      "row.pt.name": "व्यवसाय कर (हरियाणा)", "row.pt.basis": "स्लैब · सकल > ₹15,000/माह",
      "row.tds.name": "स्रोत पर कर कटौती (TDS)", "row.tds.basis": "नई व्यवस्था · वित्त वर्ष 2026–27",

      "subtotal.gross": "सकल आय", "subtotal.deductions": "कुल कटौती",
      "totals.net": "शुद्ध वेतन · अगस्त 2026 · 31 दिन",

      "verify.stageDraft": "प्रारूप तैयार", "verify.stageSubmitted": "प्रस्तुत",
      "verify.stageApproved": "स्वीकृत एवं भुगतान",
      "verify.note": "मेकर–चेकर: आर. सुब्रमण्यम द्वारा तैयार, ए. नांबियार (वित्त प्रमुख) द्वारा स्वीकृत",

      "period.col.period": "अवधि", "period.col.status": "स्थिति",
      "period.col.net": "शुद्ध वेतन ₹", "period.col.action": "वेतन पर्ची",
      "period.totals": "अब तक भुगतान · 6 में से 5 अवधि",
      "status.paid": "भुगतान हुआ",

      "footer.rule": "प्रत्येक आँकड़ा Decimal-यथार्थ है — प्रदर्शन हेतु कुछ भी पूर्णांकित नहीं",
      "footer.note": "वेतन पर्चियाँ HR द्वारा जारी की जाती हैं; आप इन अभिलेखों को संपादित नहीं कर सकते",
      "footer.tag": "Δ लेजर संतुलित",
    },
  };

  function useL() {
    const { lang } = useLang();
    return function L(key) {
      const table = STR2[lang] || STR2.en;
      return table[key] !== undefined ? table[key] : (STR2.en[key] !== undefined ? STR2.en[key] : key);
    };
  }

  const MONTHS = {
    en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    hi: ["जनवरी", "फरवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"],
  };
  function monthLabel(periodCode, lang) {
    const parts = periodCode.split("-");
    const y = parts[0], idx = parseInt(parts[1], 10) - 1;
    return (MONTHS[lang] || MONTHS.en)[idx] + " " + y;
  }

  // ---------------------------------------------------------------
  // Mock data — August 2026 payslip for one PGT (Mathematics) at
  // Sunrise Public School, Aravali campus.
  // ---------------------------------------------------------------
  const EARNINGS = [
    { key: "basic", amount: 42000.00 },
    { key: "hra", amount: 16800.00 },
    { key: "teaching", amount: 9600.00 },
    { key: "transport", amount: 2400.00 },
    { key: "medical", amount: 1250.00 },
  ];
  const DEDUCTIONS = [
    { key: "pf", amount: 1800.00, statutory: "PF" },
    { key: "esi", amount: 0.00, statutory: "ESI", na: true },
    { key: "pt", amount: 200.00, statutory: "PT" },
    { key: "tds", amount: 3400.00, statutory: "TDS" },
  ];
  const GROSS = EARNINGS.reduce(function (s, r) { return s + r.amount; }, 0);
  const TOTAL_DED = DEDUCTIONS.reduce(function (s, r) { return s + r.amount; }, 0);
  const NET = GROSS - TOTAL_DED;

  const PERIODS = [
    { code: "2026-03", net: 65200.00, status: "paid" },
    { code: "2026-04", net: 66650.00, status: "paid" },
    { code: "2026-05", net: 66650.00, status: "paid" },
    { code: "2026-06", net: 66650.00, status: "paid" },
    { code: "2026-07", net: 66650.00, status: "paid" },
    { code: "2026-08", net: 66650.00, status: "filed" },
  ];
  const PAID_YTD = PERIODS.filter(function (p) { return p.status === "paid"; })
    .reduce(function (s, p) { return s + p.net; }, 0);

  // ---------------------------------------------------------------
  // WorkflowTrail — local: draft → submitted → approved-&-disbursed,
  // maker-checker in one line of Marks, never a one-click "commit".
  // ---------------------------------------------------------------
  function WorkflowTrail({ stages }) {
    const { c } = useTheme();
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {stages.map(function (s, i) {
          return (
            <Fragment key={s.key}>
              {i > 0 && <span aria-hidden="true" style={{ width: 22, height: 1, background: c.ruleStrong, flex: "0 0 auto" }} />}
              <Mark tone={s.done ? "present" : "inkMuted"} glyph={s.done ? "⦾" : "◌"}>{s.label}</Mark>
            </Fragment>
          );
        })}
      </div>
    );
  }

  function noop() {}

  function Payslips() {
    const { c } = useTheme();
    const { lang, t } = useLang();
    const L = useL();

    const employeeMeta = [
      L("employee.name"), L("employee.code"), L("employee.designation"), L("employee.campus"),
      L("masthead.metaLocked") + " 28 " + monthLabel("2026-08", lang).split(" ")[0] + " 2026, 18:00 IST",
    ].join(" · ");

    // ---- Register 1 columns: payslip breakdown ----
    const breakdownCols = [
      { key: "component", label: L("col.component"), flex: 1.9 },
      { key: "basis", label: L("col.basis"), width: 220, mono: true },
      { key: "type", label: L("col.type"), width: 104, align: "center" },
      { key: "statutory", label: L("col.statutory"), width: 100 },
      { key: "amount", label: L("col.amount"), width: 150, align: "right", mono: true, emphasize: true },
    ];

    function earningRow(row) {
      return {
        key: "e-" + row.key,
        cells: {
          component: <div style={{ fontWeight: 600, color: c.ink }}>{L("row." + row.key + ".name")}</div>,
          basis: <span style={{ fontSize: 11.5, color: c.inkMuted }}>{L("row." + row.key + ".basis")}</span>,
          type: <Chip tone="neutral" size="sm" uppercase>{L("chip.earning")}</Chip>,
          statutory: null,
          amount: <Figure value={row.amount} />,
        },
      };
    }

    function deductionRow(row) {
      return {
        key: "d-" + row.key,
        cells: {
          component: <div style={{ fontWeight: 600, color: c.ink }}>{L("row." + row.key + ".name")}</div>,
          basis: <span style={{ fontSize: 11.5, color: c.inkMuted }}>{L("row." + row.key + ".basis")}</span>,
          type: <Chip tone="danger" size="sm" uppercase>{L("chip.deduction")}</Chip>,
          statutory: row.statutory ? <Mark tone="seal" glyph="⦾">{row.statutory}</Mark> : null,
          amount: row.na
            ? <span style={{ fontFamily: Fonts.mono, fontSize: 12.5, color: c.inkFaint }}>—</span>
            : <Figure value={row.amount} negative />,
        },
      };
    }

    function subtotalRow(key, labelKey, value, negative) {
      return {
        key: key,
        cells: {
          component: <div style={{ fontWeight: 700, color: c.ink }}>{L(labelKey)}</div>,
          basis: null,
          type: null,
          statutory: null,
          amount: <Figure value={value} negative={negative} weight={700} />,
        },
      };
    }

    const breakdownRows = []
      .concat(EARNINGS.map(earningRow))
      .concat([subtotalRow("sub-gross", "subtotal.gross", GROSS, false)])
      .concat(DEDUCTIONS.map(deductionRow))
      .concat([subtotalRow("sub-ded", "subtotal.deductions", TOTAL_DED, true)]);

    const breakdownTotals = {
      label: L("totals.net"), labelSpan: 4,
      cells: { amount: <Figure value={NET} size={19} weight={700} /> },
    };

    // ---- Register 2 columns: payslip history ----
    const periodCols = [
      { key: "period", label: L("period.col.period"), flex: 1.4 },
      { key: "status", label: L("period.col.status"), width: 180 },
      { key: "net", label: L("period.col.net"), width: 140, align: "right", mono: true },
      { key: "action", label: L("period.col.action"), width: 140, align: "right" },
    ];
    const periodRows = PERIODS.map(function (p) {
      const isPaid = p.status === "paid";
      return {
        key: p.code,
        cells: {
          period: <span style={{ fontWeight: 600, color: c.ink }}>{monthLabel(p.code, lang)}</span>,
          status: isPaid
            ? <Mark status="Paid" tone="present">{L("status.paid")}</Mark>
            : <Mark status="Filed" tone="seal">{L("status.filed")}</Mark>,
          net: <Figure value={p.net} />,
          action: (
            <Button variant="ghost" size="sm" onClick={noop}>
              <Icon name="document" size={13} color={c.accent} />{t("common.download")}
            </Button>
          ),
        },
      };
    });
    const periodTotals = {
      label: L("period.totals"), labelSpan: 2,
      cells: { net: <Figure value={PAID_YTD} weight={700} /> },
    };

    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, background: c.bg }}>
        <ActionBar breadcrumbs={[L("crumb.payroll"), L("crumb.payslips")]} badge={L("badge.locked")}>
          <Mark status="Filed" tone="seal">{L("status.filed")}</Mark>
          <Button variant="primary" size="sm" onClick={noop}>{L("action.downloadPayslip")}</Button>
        </ActionBar>

        <Masthead
          kicker={L("masthead.kicker")}
          title="Sunrise Public School"
          titleDeva={L("masthead.titleDeva")}
          meta={employeeMeta}
          figureKicker={L("masthead.figureKicker")}
          figureValue={NET}
          figureSub={
            <span>
              <span>{L("masthead.grossLabel")} ₹{inr(GROSS)}</span>
              <span style={{ margin: "0 6px", opacity: 0.5 }}>·</span>
              <span style={{ color: c.danger }}>− ₹{inr(TOTAL_DED)} {L("masthead.deductionsLabel")}</span>
            </span>
          }
        />

        <div style={{ flex: "1 1 auto", minHeight: 0, overflowY: "auto" }}>
          <div style={{ padding: `${G.sp[5]}px ${G.sp[6]}px 0` }}>
            <SectionHeader>{L("section.breakdown")}</SectionHeader>
          </div>
          <div style={{ padding: `0 ${G.sp[6]}px` }}>
            <Register columns={breakdownCols} rows={breakdownRows} totals={breakdownTotals} />
          </div>

          <div style={{
            display: "flex", alignItems: "center", gap: G.sp[6],
            margin: `${G.sp[6]}px ${G.sp[6]}px`, padding: `${G.sp[4]}px ${G.sp[5]}px`,
            border: `1px solid ${c.rule}`, boxSizing: "border-box",
          }}>
            <Seal label="Verified" sublabel="मुद्रा" date="28·08·2026" size={72} />
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              <WorkflowTrail stages={[
                { key: "draft", label: L("verify.stageDraft"), done: true },
                { key: "submitted", label: L("verify.stageSubmitted"), done: true },
                { key: "approved", label: L("verify.stageApproved"), done: true },
              ]} />
              <div style={{ fontSize: 11.5, color: c.inkMuted }}>{L("verify.note")}</div>
            </div>
          </div>

          <div style={{ padding: `0 ${G.sp[6]}px 0` }}>
            <SectionHeader>{L("section.history")}</SectionHeader>
          </div>
          <div style={{ padding: `0 ${G.sp[6]}px ${G.sp[8]}px` }}>
            <Register columns={periodCols} rows={periodRows} totals={periodTotals} rowHeight={40} />
          </div>
        </div>

        <StatusFooter rule={L("footer.rule")} note={L("footer.note")} tag={L("footer.tag")} />
      </div>
    );
  }

  window.Pages2 = window.Pages2 || {};
  window.Pages2.Payslips = Payslips;
})();
