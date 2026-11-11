/* @jsxRuntime classic */
/* ============================================================
   Naveya — Payslips · window.Pages3.Payslips

   SPEC: M10 (Payroll) with its entity catalog §6.9 — PayrollRun
   (status draft / variance_review / approved / disbursed, pinning a
   `statutory_config_id`), Payslip (paid_days, gross, deductions, net,
   is_locked) and PayslipLine (component_code, amount, type =
   earning | deduction | employer_contrib). Statutory presentation is
   M11 + §4.4 (versioned, pinned, never hardcoded). Paid-days come
   from M9 ("paid-days = present + paid-leave + holidays + weekly-offs
   − LOP"). The employee's read-only surface is M13.

   Guardrails from docs/ui-compliance-requirements.md:
   · O9 — the pinned StatutoryConfig version and its effective-from
     are printed on the payslip, and the April–June slips carry the
     version that was in force THEN, not the current one.
   · O10 — the download says the file is password-protected and what
     the password is derived from (shown only to the subject, which is
     who this screen is for), and states that the download is recorded.
     This closes §8-F16 against the Home payslip card.
   · O3 / §3 — the bank account is masked (`HDFC ••4321`). Keka shows
     it in full on its Finances page; we deliberately do not.
   · O5 / DESIGN 10 — the un-released month shows the maker-checker
     state in words (prepared → signed by the maker → approved by a
     DIFFERENT person → released), because a teacher asking "where is
     my payslip?" deserves the real answer.
   · C4 — on an artefact the exact figure LEADS; there is no ring or
     donut deferring a number anywhere on this screen.

   WHAT THIS SCREEN DELIBERATELY REFUSES
   · No rate, percentage, ceiling or slab is printed anywhere. Every
     statutory line shows its AMOUNT and names the config version it
     was read from. A number invented in a mock is a number that gets
     implemented (§8-F5).
   · No full bank account, no PAN, no UAN, no ESIC number.
   · No "download all". Each download is a per-subject, recorded act.
   · No action that finalises money. This is a read surface; the run
     is approved on the Payroll Operator's and the checker's screens.
   · No re-typed net. Gross, total deductions, net and the year-to-
     date figure are all summed from the lines in code.

   Composed only from window.G3 / window.UI3.
   ============================================================ */
(function () {
  const G3 = window.G3;
  const UI = window.UI3;
  const { useState } = React;
  const {
    useTheme, ThemeToggle, useLang, addStrings,
    Rail, Motif, Card, Register, Button, LinkButton, StatusMark, Seal,
    Figure, Icon, EmptyState, inr, num, profileFor, BoatMark,
  } = UI;

  addStrings({
    en: {
      "ps.pageTitle": "Payslips",
      "ps.pageSub": "Every payslip issued to you, and this year’s Form 16.",
      "ps.session": "Academic session 2026–27 · April 2026 to March 2027",

      "ps.mon.4": "April", "ps.mon.5": "May", "ps.mon.6": "June", "ps.mon.7": "July",
      "ps.mon.8": "August", "ps.mon.9": "September", "ps.mon.10": "October",
      "ps.mon.11": "November", "ps.mon.12": "December", "ps.mon.1": "January",
      "ps.mon.2": "February", "ps.mon.3": "March",

      /* ---- the list ---- */
      "ps.list.title": "This session",
      "ps.list.sub": "Twelve months, April to March. Five have run so far.",
      "ps.list.aria": "Open the payslip for {month}",
      "ps.st.paid": "Paid",
      "ps.st.processing": "Being prepared",
      "ps.list.notYet": "Not run yet",
      "ps.list.ahead": "September onward will appear here as each month is run.",
      "ps.f16.head": "Form 16",
      "ps.f16.have": "For 2025–26 · issued 12 June 2026",
      "ps.f16.get": "Download Form 16",
      "ps.f16.next": "Form 16 for 2026–27 arrives after the session closes in March.",

      /* ---- the selected payslip ---- */
      "ps.d.title": "{month} 2026",
      "ps.d.net": "Paid to your bank",
      "ps.d.credited": "Credited {date} · {bank}",
      "ps.d.bank": "HDFC ••4321",
      "ps.d.bankNote": "Only the last four digits are ever shown, to you or to anyone else.",
      "ps.d.locked": "Locked",
      "ps.d.lockedNote": "A locked payslip is never edited. If anything changes, a corrected slip is issued alongside this one and says what it supersedes.",
      "ps.d.runSeal": "Run {run} · approved {date}",
      "ps.d.runSealBy": "Prepared by {maker}, approved by {checker} — two different people, as the rules require.",
      "ps.d.paidDays": "{paid} of {total} paid days",
      "ps.d.paidDaysNote": "No loss of pay this month. Paid days are present days plus paid leave, holidays and weekly offs, less loss of pay.",
      "ps.d.download": "Download this payslip",
      "ps.d.pwd": "The PDF is password-protected. It opens with your PAN in capital letters followed by your date of birth as DDMMYYYY.",
      "ps.d.recorded": "Every download is recorded against your name. You last opened this one on 2 August 2026.",

      "ps.earn.title": "What you earned",
      "ps.earn.total": "Gross earnings",
      "ps.ded.title": "What was taken off",
      "ps.ded.total": "Total deductions",
      "ps.col.item": "Line",
      "ps.col.amt": "Amount",

      "ps.c.basic": "Basic pay",
      "ps.c.da": "Dearness allowance",
      "ps.c.hra": "House rent allowance",
      "ps.c.special": "Special allowance",
      "ps.c.academic": "Academic and books allowance",
      "ps.c.pf": "Provident fund",
      "ps.c.loan": "Loan recovery",
      "ps.stat.loan": "One instalment of {v}, recovered from this pay",
      "ps.c.adv": "Advance recovery",
      "ps.stat.adv": "{v} of the advance you were paid early, taken back from this pay",
      "ps.c.pt": "Professional tax",
      "ps.c.tds": "Income tax (TDS)",
      "ps.c.pfEmp": "Provident fund — the school's share",
      "ps.stat": "Statutory · read from {v}",
      "ps.stat.tds": "Statutory · section 192, on the regime you declared · read from {v}",
      "ps.tdsDrop": "Income tax is {amt} lower than June. Your investment declaration was verified on 18 July and this run used it.",

      "ps.sum.title": "How this adds up",
      "ps.sum.gross": "Gross earnings",
      "ps.sum.ded": "Less deductions",
      "ps.sum.net": "Paid to your bank",
      "ps.sum.employer": "Paid by the school on top of your salary",
      "ps.sum.employerNote": "This is not deducted from you. It goes to your provident fund account and shows on your annual statement.",
      "ps.sum.employerTotal": "The school's contribution",
      "ps.sum.esi": "ESI does not apply to you \u2014 your wage is above the ceiling held in {v}. Nothing is deducted or contributed.",
      "ps.sum.config": "Computed on {v}, in force from {d} and pinned to {run}. A later change to the rules does not rewrite this payslip.",

      "ps.ytd.title": "Paid to you this session so far",
      "ps.ytd.range": "April to July 2026 · four approved runs",
      "ps.ytd.gross": "Earned before deductions",
      "ps.ytd.tds": "Income tax deducted",
      "ps.ytd.excl": "August is not counted here. Its run has not been approved yet.",

      /* ---- the un-released month: maker-checker, in words ---- */
      "ps.mc.head": "August pay is still being prepared",
      "ps.mc.body": "Payroll is never released by one person. {maker} signed {run} on 9 August; it needs a second approver before payslips go out.",
      "ps.mc.s1": "Prepared",
      "ps.mc.s1d": "Computed for 412 staff · 8 August",
      "ps.mc.s2": "Signed by the person who prepared it",
      "ps.mc.s2d": "Sunita Kulkarni, Payroll · 9 August",
      "ps.mc.s3": "Approved by a different person",
      "ps.mc.s3d": "Waiting — a checker cannot be the maker",
      "ps.mc.s4": "Payslips released to you",
      "ps.mc.s4d": "Usually the same day as approval",
      "ps.mc.now": "Where it stands now",
      "ps.mc.notify": "You will get a message when it is released. Nothing is expected from you.",
      "ps.mc.config": "When it is approved, this run will carry the StatutoryConfig version in force in August — not today's.",
    },

  });

  /* ============================================================
     DATA — the same teacher Home and My Attendance describe. Her
     July figures are Home's July figures (screens.jsx PAY): gross
     94,800.00, PF 5,688.00, PT 200.00, TDS 10,480.00, take-home
     78,432.00 — so the card on Home and the payslip behind it can
     never disagree.

     Every total is SUMMED below, never typed. The earnings lines add
     to the gross; the deduction lines add to the deductions; the net
     is the difference; the year-to-date is the sum of the approved
     months. A figure a reader can add up has to be a figure the code
     adds up (DESIGN 4).
     ============================================================ */

  /* PayslipLine rows, type = earning. Effective-dated EmployeeSalary,
     unchanged across the session so far, so one set serves every run. */
  /* WHOSE PAYSLIPS THESE ARE. The year-to-date constants below are the
     employee's, as the whole fixture is; the DOCUMENT, though, is drawn
     for whoever opened the screen, so the loan line takes the staff
     number rather than assuming one. */
  const ME_ID = UI.profileFor("employee").id;

  const EARNINGS = [
    { key: "ps.c.basic", v: 39500.0 },
    { key: "ps.c.da", v: 7900.0 },
    { key: "ps.c.hra", v: 19750.0 },
    { key: "ps.c.special", v: 21120.0 },
    { key: "ps.c.academic", v: 6530.0 },
  ];
  const GROSS = EARNINGS.reduce((s, l) => s + l.v, 0);

  /* PayslipLine rows, type = employer_contrib — shown apart from her
     own deductions, because it is not her money leaving. */
  const EMPLOYER = [{ key: "ps.c.pfEmp", v: 5688.0, statutory: true }];
  const EMPLOYER_TOTAL = EMPLOYER.reduce((s, l) => s + l.v, 0);

  /* PF and PT do not move across the session; TDS does, and the reason
     it moves is stated on the slip rather than left as a mystery. */
  const PF = 5688.0;
  const PT = 200.0;

  /* PayrollRun per month. `config` is the StatutoryConfig version the
     run PINNED — April to June carry the version that was in force
     then, not the current one (M11 acceptance: "a prior month
     re-opened still computes on its original version"). */
  const CFG_2 = { v: "v2026.2", from: "1 April 2026", fromHi: "1 अप्रैल 2026" };
  const CFG_3 = { v: "v2026.3", from: "1 July 2026", fromHi: "1 जुलाई 2026" };

  const MONTHS = [
    { m: 8, key: "ps.mon.8", status: "processing", run: "PR-2026-08" },
    { m: 7, key: "ps.mon.7", status: "paid", run: "PR-2026-07", tds: 10480.0, paidDays: 31, totalDays: 31,
      credited: "2026-07-31", approved: "2026-07-29", cfg: CFG_3, tdsDrop: true },
    { m: 6, key: "ps.mon.6", status: "paid", run: "PR-2026-06", tds: 11730.0, paidDays: 30, totalDays: 30,
      credited: "2026-06-30", approved: "2026-06-27", cfg: CFG_2 },
    { m: 5, key: "ps.mon.5", status: "paid", run: "PR-2026-05", tds: 11730.0, paidDays: 31, totalDays: 31,
      credited: "2026-05-30", approved: "2026-05-28", cfg: CFG_2 },
    { m: 4, key: "ps.mon.4", status: "paid", run: "PR-2026-04", tds: 11730.0, paidDays: 30, totalDays: 30,
      credited: "2026-04-30", approved: "2026-04-28", cfg: CFG_2 },
  ];

  /* EMP-19 ON THE PAYSLIP. A loan is recovered FROM pay, so the slip
     that paid it has to show the instalment — and it has to be the
     same instalment the loans screen names, which is why it is read
     from the ledger payroll keeps rather than restated here. Returns
     null when the person is carrying nothing, which is most people. */
  function loanLine(staffId) {
    const A = window.Pages3 && window.Pages3.PYAdjData;
    if (!A || !A.LOANS) return null;
    const who = staffId || ME_ID;
    const mine = A.LOANS.filter(function (l) {
      return l.staff === who && (l.state === "active" || l.state === "atExit");
    });
    if (!mine.length) return null;
    const emi = mine.reduce(function (n, l) { return n + A.loanEmi(l); }, 0);
    /* one line, named for what it is: a slip that recovers only an
       advance should not say "loan" at the one place somebody reads
       it twice. Carrying both, the loan's word covers them. */
    const onlyAdv = mine.every(function (l) { return l.kind === "advance"; });
    return {
      key: onlyAdv ? "ps.c.adv" : "ps.c.loan", v: emi,
      statKey: onlyAdv ? "ps.stat.adv" : "ps.stat.loan", ref: mine[0].id,
    };
  }

  function deductionsOf(mo, staffId) {
    const ln = loanLine(staffId);
    return [
      { key: "ps.c.pf", v: PF, statKey: "ps.stat" },
      { key: "ps.c.pt", v: PT, statKey: "ps.stat" },
      { key: "ps.c.tds", v: mo.tds, statKey: "ps.stat.tds" },
    ].concat(ln ? [ln] : []);
  }
  function totalDeductions(mo) { return deductionsOf(mo).reduce((s, l) => s + l.v, 0); }
  function netOf(mo) { return GROSS - totalDeductions(mo); }

  const PAID = MONTHS.filter((mo) => mo.status === "paid");
  const YTD_NET = PAID.reduce((s, mo) => s + netOf(mo), 0);
  const YTD_GROSS = PAID.length * GROSS;
  const YTD_TDS = PAID.reduce((s, mo) => s + mo.tds, 0);
  /* July's income tax minus June's — the same 1,250.00 Home quotes as
     "more than June", derived from the two runs rather than retyped */
  const TDS_DROP = MONTHS.filter((x) => x.m === 6)[0].tds - MONTHS.filter((x) => x.m === 7)[0].tds;

  const MAKER = "Sunita Kulkarni";
  const MAKER_HI = "सुनीता कुलकर्णी";
  const CHECKER = "Rajiv Menon";
  const CHECKER_HI = "राजीव मेनन";

  function parseISO(s) {
    const p = s.split("-");
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  }
  function dayLabel(t, iso) {
    const d = parseISO(iso);
    return t("att.d" + d.getDay()) + " " + d.getDate() + " " + t("ps.mon." + (d.getMonth() + 1)) + " " + d.getFullYear();
  }

  /* ============================================================
     2026-09-18 REVAMP (NA-64) — pick a month, preview its PDF.
     The screen holds only the month picker and the document; every
     line, total and statutory note lives ON the payslip, where it is
     read, instead of being spread across the screen.
     ============================================================ */
  addStrings({
    en: {
      "ps2.pick": "Choose a month",
      "ps2.fyAria": "Financial year",
      "ps2.fy.cur": "2026–27",
      "ps2.fy.prev": "2025–26",
      "ps2.paidOn": "Paid · {date}",
      "ps2.prep": "Being prepared",
      "ps2.form16": "Form 16 · 2025–26",
      "ps2.form16Sub": "Issued 12 June 2026",
      "ps2.zoomIn": "Zoom in",
      "ps2.zoomOut": "Zoom out",
      "ps2.download": "Download PDF",
      "ps2.print": "Print",
      "ps2.pwd": "Password-protected: your PAN in capitals, then your date of birth as DDMMYYYY. Downloads are recorded.",
      "ps2.dl": "{file} downloaded",
      "ps2.printing": "Sent {file} to the printer",
      "ps2.f16": "Form 16 for 2025–26 downloaded",
      "ps2.notReady": "{month} isn't ready yet",
      "ps2.notReadyBody": "Payroll is prepared, then approved by somebody else, then paid. You will get a message the moment it is released.",
      "ps2.s1": "Prepared by {name}",
      "ps2.s2": "Approved by a second person",
      "ps2.s3": "Paid to your bank",
      "ps2.page": "Page 1 of 1",
    },
  });

  /* the previous financial year (April 2025 – March 2026): the salary
     before the 1 April 2026 revision, so the lines differ from this
     year's and every total is still summed from them */
  const PREV_EARNINGS = [
    { label: "Basic pay", v: 37600.0 },
    { label: "Dearness allowance", v: 7520.0 },
    { label: "House rent allowance", v: 18800.0 },
    { label: "Special allowance", v: 20100.0 },
    { label: "Academic and books allowance", v: 6200.0 },
  ];
  const CUR_EARNINGS = [
    { label: "Basic pay", v: 39500.0 },
    { label: "Dearness allowance", v: 7900.0 },
    { label: "House rent allowance", v: 19750.0 },
    { label: "Special allowance", v: 21120.0 },
    { label: "Academic and books allowance", v: 6530.0 },
  ];
  const CFG_PREV = { v: "v2025.3", from: "1 October 2025" };
  const MON_DAYS = { 1: 31, 2: 28, 3: 31, 4: 30, 5: 31, 6: 30, 7: 31, 8: 31, 9: 30, 10: 31, 11: 30, 12: 31 };
  const MON_EN = { 1: "January", 2: "February", 3: "March", 4: "April", 5: "May", 6: "June", 7: "July", 8: "August", 9: "September", 10: "October", 11: "November", 12: "December" };
  const MON_SHORT = { 1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun", 7: "Jul", 8: "Aug", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec" };

  /* one list per financial year, newest first */
  const FY = {
    cur: MONTHS.map((mo) => Object.assign({ y: 2026, fy: "cur", earnings: CUR_EARNINGS, pf: PF, pt: PT, employerPf: 5688.0 }, mo)),
    prev: [3, 2, 1, 12, 11, 10, 9, 8, 7, 6, 5, 4].map((m) => {
      const y = m <= 3 ? 2026 : 2025;
      const last = MON_DAYS[m];
      return {
        m: m, y: y, fy: "prev", key: "ps.mon." + m, status: "paid",
        run: "PR-" + y + "-" + String(m).padStart(2, "0"),
        tds: m >= 1 && m <= 3 ? 12260.0 : 10900.0, paidDays: last, totalDays: last,
        credited: y + "-" + String(m).padStart(2, "0") + "-" + String(m === 3 ? 27 : last).padStart(2, "0"),
        approved: y + "-" + String(m).padStart(2, "0") + "-" + String(last - 3).padStart(2, "0"),
        cfg: CFG_PREV, earnings: PREV_EARNINGS, pf: 5414.4, pt: 200.0, employerPf: 5414.4,
      };
    }),
  };
  function linesOf(mo, staffId) {
    const earn = mo.earnings;
    const ln = mo.fy === "cur" ? loanLine(staffId) : null;
    const ded = [{ label: "Provident fund", v: mo.pf }, { label: "Professional tax", v: mo.pt }, { label: "Income tax (TDS)", v: mo.tds }]
      .concat(ln ? [{ label: "Loan recovery \u2014 " + ln.ref, v: ln.v }] : []);
    const gross = earn.reduce((s, l) => s + l.v, 0);
    const dedTotal = ded.reduce((s, l) => s + l.v, 0);
    return { earn: earn, ded: ded, gross: gross, dedTotal: dedTotal, net: gross - dedTotal };
  }

  /* rupees in words, Indian system (lakh / crore) — as printed on a payslip */
  const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  function two(n) { return n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? "-" + ONES[n % 10] : ""); }
  function three(n) { return (n >= 100 ? ONES[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " : "") : "") + (n % 100 ? two(n % 100) : ""); }
  function inWords(amount) {
    const rupees = Math.floor(amount);
    const paise = Math.round((amount - rupees) * 100);
    const parts = [];
    const crore = Math.floor(rupees / 10000000), lakh = Math.floor((rupees % 10000000) / 100000);
    const thousand = Math.floor((rupees % 100000) / 1000), rest = rupees % 1000;
    if (crore) parts.push(two(crore) + " Crore");
    if (lakh) parts.push(two(lakh) + " Lakh");
    if (thousand) parts.push(two(thousand) + " Thousand");
    if (rest) parts.push(three(rest));
    return "Rupees " + (parts.join(" ") || "Zero") + (paise ? " and " + two(paise) + " Paise" : "") + " Only";
  }
  function amt(v) { return inr(v).replace("₹", ""); }
  function isoShort(iso) {
    const p = iso.split("-");
    return (+p[2]) + " " + MON_SHORT[+p[1]] + " " + p[0];
  }
  function fileName(mo, prof) { return "Payslip_" + MON_SHORT[mo.m] + "-" + mo.y + "_" + prof.id + ".pdf"; }

  /* ============================================================
     The document — a PDF page. It is always a light page (a PDF
     viewer shows paper, whatever the app theme), so it reads the
     LIGHT token set explicitly rather than hardcoding any colour.
     Payslips are issued in English, the school's document language.
     ============================================================ */
  function PayslipDoc({ mo, prof, t }) {
    const P = G3.theme("light");
    const L = linesOf(mo, prof.id);
    const f = G3.font;
    const rows = Math.max(L.earn.length, L.ded.length);
    const cell = { padding: "7px 10px", borderBottom: "1px solid " + P.border, fontFamily: f.ui, fontSize: 12, color: P.ink };
    const num = (v) => ({ fontFamily: f.mono, fontSize: 12, textAlign: "right", fontVariantNumeric: "tabular-nums", color: P.ink });
    const label = { fontFamily: f.ui, fontSize: 10.5, color: P.inkMuted, fontWeight: 600 };
    const val = { fontFamily: f.ui, fontSize: 12, color: P.ink, fontWeight: 600 };
    const info = [
      ["Employee name", prof.name], ["Employee ID", prof.id],
      ["Designation", UI.translate("en", prof.titleKey)], ["Department", prof.work === "teaching" ? "Science" : "Administration"],
      ["Date of joining", "12 Jun 2019"], ["PAN", "•••••" + "234F"],
      ["UAN", "••••••••7781"], ["Bank account", "HDFC ••4321"],
      ["Paid days", mo.paidDays + " of " + mo.totalDays], ["Loss of pay", "0 days"],
    ];
    return (
      <div style={{ width: 794, minHeight: 1040, background: P.surface, color: P.ink, padding: "44px 48px", boxSizing: "border-box", fontFamily: f.ui }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, paddingBottom: 18, borderBottom: "2px solid " + P.ink }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <span style={{ width: 46, height: 46, borderRadius: 12, background: P.accent, color: P.onAccent, display: "flex", alignItems: "center", justifyContent: "center" }}><BoatMark size={28} /></span>
            <div>
              <div style={{ fontFamily: f.display, fontSize: 20, fontWeight: 600, color: P.ink }}>Sunrise Public School</div>
              <div style={{ fontSize: 11, color: P.inkMuted, marginTop: 2 }}>Sunrise Education Trust · 100 Feet Road, Indiranagar, Bengaluru 560038</div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: f.display, fontSize: 17, fontWeight: 600, color: P.ink }}>Payslip</div>
            <div style={{ fontSize: 12, color: P.inkMuted, marginTop: 2 }}>{MON_EN[mo.m] + " " + mo.y}</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 28px", padding: "18px 0", borderBottom: "1px solid " + P.border }}>
          {info.map((r) => (
            <div key={r[0]} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <span style={label}>{r[0]}</span><span style={val}>{r[1]}</span>
            </div>
          ))}
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 20, border: "1px solid " + P.border }}>
          <thead>
            <tr style={{ background: P.sunken }}>
              <th style={Object.assign({}, cell, label, { textAlign: "left" })}>Earnings</th>
              <th style={Object.assign({}, cell, label, { textAlign: "right", borderRight: "1px solid " + P.border })}>Amount (₹)</th>
              <th style={Object.assign({}, cell, label, { textAlign: "left" })}>Deductions</th>
              <th style={Object.assign({}, cell, label, { textAlign: "right" })}>Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i}>
                <td style={cell}>{L.earn[i] ? L.earn[i].label : ""}</td>
                <td style={Object.assign({}, cell, num(), { borderRight: "1px solid " + P.border })}>{L.earn[i] ? amt(L.earn[i].v) : ""}</td>
                <td style={cell}>{L.ded[i] ? L.ded[i].label : ""}</td>
                <td style={Object.assign({}, cell, num())}>{L.ded[i] ? amt(L.ded[i].v) : ""}</td>
              </tr>
            ))}
            <tr style={{ background: P.raised }}>
              <td style={Object.assign({}, cell, { fontWeight: 700 })}>Gross earnings</td>
              <td style={Object.assign({}, cell, num(), { fontWeight: 700, borderRight: "1px solid " + P.border })}>{amt(L.gross)}</td>
              <td style={Object.assign({}, cell, { fontWeight: 700 })}>Total deductions</td>
              <td style={Object.assign({}, cell, num(), { fontWeight: 700 })}>{amt(L.dedTotal)}</td>
            </tr>
          </tbody>
        </table>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, marginTop: 18, padding: "16px 18px", background: P.presentTint, borderRadius: 10 }}>
          <div>
            <div style={Object.assign({}, label, { color: P.presentText })}>Net pay · credited {isoShort(mo.credited)} · HDFC ••4321</div>
            <div style={{ fontSize: 11.5, color: P.presentText, marginTop: 4 }}>{inWords(L.net)}</div>
          </div>
          <div style={{ fontFamily: f.mono, fontSize: 24, fontWeight: 700, color: P.presentText, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{inr(L.net)}</div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 14, fontSize: 11.5, color: P.inkMuted }}>
          <span>Employer's provident fund contribution (not deducted from you)</span>
          <span style={{ fontFamily: f.mono, color: P.ink }}>{inr(mo.employerPf)}</span>
        </div>

        <div style={{ marginTop: 40, paddingTop: 14, borderTop: "1px solid " + P.border, fontSize: 10.5, color: P.inkFaint, lineHeight: 1.6 }}>
          Run {mo.run} · approved {isoShort(mo.approved)} · computed on statutory configuration {mo.cfg.v}, in force from {mo.cfg.from}.
          <br />This is a system-generated payslip and does not need a signature. A locked payslip is never edited; any correction is issued as a separate slip.
        </div>
      </div>
    );
  }

  function Toast({ toast, onClose }) {
    const { c, shadow } = useTheme();
    const { ty } = useLang();
    React.useEffect(() => {
      if (!toast) return;
      const id = setTimeout(onClose, 4200);
      return () => clearTimeout(id);
      // eslint-disable-next-line
    }, [toast && toast.id]);
    if (!toast) return null;
    return ReactDOM.createPortal(
      <div role="status" aria-live="polite" style={{ position: "fixed", left: "50%", bottom: 28, transform: "translateX(-50%)", zIndex: 2100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, background: c.rail, color: c.onRail, borderRadius: G3.r.lg, padding: "12px 16px", boxShadow: shadow(4) }}>
          <span aria-hidden="true" style={{ width: 24, height: 24, borderRadius: 99, background: c.present, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="check" size={13} /></span>
          <span style={ty("small", { fontWeight: 600, color: c.onRail })}>{toast.text}</span>
        </div>
      </div>,
      document.body
    );
  }

  function IconBtn({ label, onClick, children, disabled }) {
    const { c } = useTheme();
    return (
      <button type="button" aria-label={label} title={label} onClick={disabled ? undefined : onClick} aria-disabled={disabled ? "true" : undefined}
        style={{ width: 32, height: 32, borderRadius: 99, border: "1px solid " + c.border, background: c.surface, color: disabled ? c.inkFaint : c.ink, display: "flex", alignItems: "center", justifyContent: "center", cursor: disabled ? "default" : "pointer", fontFamily: G3.font.mono, fontSize: 16, fontWeight: 700 }}>
        {children}
      </button>
    );
  }

  function MonthPicker({ fy, setFy, selected, onSelect, onForm16 }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const list = FY[fy];
    return (
      <Card title={t("ps2.pick")} style={{ width: 300, flex: "0 0 300px" }}>
        <div role="group" aria-label={t("ps2.fyAria")} style={{ display: "flex", background: c.sunken, borderRadius: 99, padding: 3, marginBottom: 14 }}>
          {["cur", "prev"].map((k) => (
            <button key={k} type="button" aria-pressed={fy === k ? "true" : "false"} onClick={() => setFy(k)}
              style={G3.fig("xs", { flex: 1, border: "none", borderRadius: 99, padding: "7px 0", cursor: "pointer", fontWeight: 700, background: fy === k ? c.surface : "transparent", color: fy === k ? c.ink : c.inkMuted, boxShadow: fy === k ? "0 1px 2px rgba(0,0,0,.08)" : "none" })}>
              {t("ps2.fy." + k)}
            </button>
          ))}
        </div>
        <div role="listbox" aria-label={t("ps2.pick")} style={{ display: "grid", gap: 4 }}>
          {list.map((mo) => {
            const id = mo.fy + "-" + mo.y + "-" + mo.m;
            const on = id === selected;
            return (
              <button key={id} type="button" role="option" aria-selected={on ? "true" : "false"} onClick={() => onSelect(id)}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, width: "100%", textAlign: "left", border: "1.5px solid " + (on ? c.accent : "transparent"), background: on ? c.accentSoft : "transparent", borderRadius: G3.r.md, padding: "10px 12px", cursor: "pointer" }}>
                <span style={ty("small", { color: c.ink, fontWeight: 700 })}>{t(mo.key) + " " + mo.y}</span>
                {mo.status === "paid"
                  ? <span style={ty("caption", { color: c.inkMuted })}>{t("ps2.paidOn", { date: isoShort(mo.credited).replace(/ \d{4}$/, "") })}</span>
                  : <StatusMark role="late" glyph="clock" word={t("ps2.prep")} />}
              </button>
            );
          })}
        </div>
        <button type="button" onClick={onForm16}
          style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", marginTop: 14, paddingTop: 14, borderTop: "1px solid " + c.rule, border: "none", borderTopStyle: "solid", borderTopWidth: 1, borderTopColor: c.rule, background: "transparent", cursor: "pointer", textAlign: "left" }}>
          <span aria-hidden="true" style={{ width: 32, height: 32, borderRadius: 10, background: c.sunken, color: c.inkMuted, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="download" size={15} /></span>
          <span>
            <span style={ty("small", { display: "block", color: c.action, fontWeight: 700 })}>{t("ps2.form16")}</span>
            <span style={ty("caption", { display: "block", color: c.inkFaint })}>{t("ps2.form16Sub")}</span>
          </span>
        </button>
      </Card>
    );
  }

  function Viewer({ mo, prof, onDownload, onPrint }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [zoom, setZoom] = useState(100);
    const ready = mo.status === "paid";
    const file = fileName(mo, prof);
    return (
      <Card pad={0} style={{ flex: "1 1 340px", minWidth: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "14px 18px", borderBottom: "1px solid " + c.rule }}>
          <span aria-hidden="true" style={{ width: 32, height: 32, borderRadius: 10, background: c.accentSoft, color: c.action, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name="payslip" size={16} /></span>
          <span style={G3.fig("xs", { color: c.ink, fontWeight: 600, flex: 1, minWidth: 180 })}>{ready ? file : t(mo.key) + " " + mo.y}</span>
          {ready ? (
            <React.Fragment>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <IconBtn label={t("ps2.zoomOut")} onClick={() => setZoom((z) => Math.max(60, z - 10))} disabled={zoom <= 60}>−</IconBtn>
                <span style={G3.fig("xs", { width: 44, textAlign: "center", color: c.inkMuted })}>{zoom + "%"}</span>
                <IconBtn label={t("ps2.zoomIn")} onClick={() => setZoom((z) => Math.min(140, z + 10))} disabled={zoom >= 140}>+</IconBtn>
              </div>
              <Button size="sm" kind="ghost" onClick={() => onPrint(file)}>{t("ps2.print")}</Button>
              <Button size="sm" kind="primary" iconLeft="download" onClick={() => onDownload(file)}>{t("ps2.download")}</Button>
            </React.Fragment>
          ) : null}
        </div>
        {ready ? (
          <React.Fragment>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", background: c.raised, borderBottom: "1px solid " + c.rule }}>
              <span aria-hidden="true" style={{ color: c.inkFaint, display: "flex" }}><Icon name="lock" size={13} /></span>
              <span style={ty("caption", { color: c.inkMuted })}>{t("ps2.pwd")}</span>
            </div>
            <div style={{ background: c.gutter, padding: 28, overflow: "auto", maxHeight: 1180 }}>
              <div style={{ width: 794 * zoom / 100, height: 1040 * zoom / 100, margin: "0 auto", boxShadow: "0 2px 6px rgba(0,0,0,.12), 0 18px 40px -18px rgba(0,0,0,.35)" }}>
                <div style={{ transform: "scale(" + zoom / 100 + ")", transformOrigin: "top left", width: 794 }}>
                  <PayslipDoc mo={mo} prof={prof} t={t} />
                </div>
              </div>
              <div style={G3.fig("micro", { textAlign: "center", color: c.inkFaint, marginTop: 12 })}>{t("ps2.page")}</div>
            </div>
          </React.Fragment>
        ) : (
          <div style={{ padding: "56px 28px", display: "grid", justifyItems: "center", gap: 14, textAlign: "center", background: c.gutter }}>
            <span aria-hidden="true" style={{ width: 56, height: 56, borderRadius: 16, background: c.lateTint, color: c.lateText, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="clock" size={24} /></span>
            <h3 style={ty("h2", { margin: 0, color: c.ink })}>{t("ps2.notReady", { month: t(mo.key) + " " + mo.y })}</h3>
            <p style={ty("small", { margin: 0, color: c.inkMuted, maxWidth: 460 })}>{t("ps2.notReadyBody")}</p>
            <ol style={{ listStyle: "none", margin: "8px 0 0", padding: 0, display: "grid", gap: 8, textAlign: "left" }}>
              {[[t("ps2.s1", { name: MAKER }), true], [t("ps2.s2"), false], [t("ps2.s3"), false]].map((s, i) => (
                <li key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={G3.fig("xs", { width: 24, height: 24, borderRadius: 99, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, background: s[1] ? c.presentTint : c.surface, color: s[1] ? c.presentText : c.inkFaint, border: "1px solid " + c.border })}>{s[1] ? "✓" : i + 1}</span>
                  <span style={ty("small", { color: s[1] ? c.ink : c.inkMuted, fontWeight: s[1] ? 700 : 500 })}>{s[0]}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </Card>
    );
  }

  /* ============================================================
     PAGE
     ============================================================ */
  function Payslips({ role, onNavigate }) {
    const { c } = useTheme();
    const { t, ty, lang } = useLang();
    const L = G3.layout;
    const prof = profileFor(role);
    const [fy, setFy] = useState("cur");
    const firstPaid = (k) => { const x = FY[k].filter((mo) => mo.status === "paid")[0] || FY[k][0]; return x.fy + "-" + x.y + "-" + x.m; };
    const [selected, setSelected] = useState(firstPaid("cur"));
    const [toast, setToast] = useState(null);
    const all = FY.cur.concat(FY.prev);
    const mo = all.filter((x) => x.fy + "-" + x.y + "-" + x.m === selected)[0];
    function changeFy(k) { setFy(k); setSelected(firstPaid(k)); }
    function say(text) { setToast({ id: Date.now(), text: text }); }

    return (
      <div className="nv3" style={{ display: "flex", minHeight: "100vh", background: c.page, color: c.ink, fontFamily: G3.font.ui }}>
        <Rail role={role || "employee"} active="payslips" onNavigate={onNavigate} />
        <main style={{ flex: 1, minWidth: 0, position: "relative", overflowX: "clip" }}>
          <Motif />
          <div style={{ position: "relative", zIndex: 1, maxWidth: L.contentMax, margin: "0 auto", padding: "22px " + L.contentPadX + "px 56px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, marginBottom: 16 }}>
              <div style={ty("small", { color: c.inkMuted })}>
                <span style={{ color: c.ink, fontWeight: 700 }}>{t("nav.payslips")}</span>
                <span style={{ margin: "0 8px", color: c.inkFaint }}>·</span>
                <span>{t("home.school")}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <ThemeToggle />
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <h1 style={ty("display", { margin: 0, color: c.ink })}>{t("ps.pageTitle")}</h1>
              <div style={ty("small", { color: c.inkMuted, marginTop: 8 })}>{t("ps.pageSub")}</div>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: L.gap, alignItems: "flex-start" }}>
              <MonthPicker fy={fy} setFy={changeFy} selected={selected} onSelect={setSelected} onForm16={() => say(t("ps2.f16"))} />
              {mo ? <Viewer key={selected} mo={mo} prof={prof} onDownload={(f) => say(t("ps2.dl", { file: f }))} onPrint={(f) => say(t("ps2.printing", { file: f }))} /> : null}
            </div>
          </div>
        </main>
        <Toast toast={toast} onClose={() => setToast(null)} />
      </div>
    );
  }

  window.Pages3 = window.Pages3 || {};
  window.Pages3.Payslips = Payslips;
  /* THE YEAR'S TAX, FOR THE SCREEN THAT EXPLAINS IT. The tax screen
     tells the reader that a payslip wins any disagreement; the only way
     to keep that promise is for it to read these. */
  window.Pages3.PayslipData = {
    ME_ID: ME_ID, GROSS: GROSS, PF: PF, PT: PT,
    MONTHS: MONTHS, PAID: PAID,
    YTD_GROSS: YTD_GROSS, YTD_TDS: YTD_TDS, YTD_NET: YTD_NET,
    deductionsOf: deductionsOf, netOf: netOf, loanLine: loanLine,
  };
})();
