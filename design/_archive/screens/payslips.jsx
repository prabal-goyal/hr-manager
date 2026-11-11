/* ============================================================
   payslips.jsx — Naveya employee Payslips screen (ESS).
   The Ledger is the hero: list of periods -> full payslip detail
   with Earnings/Deductions, Net Pay, employer contributions, YTD,
   paid-days/LOP, and masked bank/payment metadata.
   Composes ONLY from window.UI (design/kit.jsx) + window.G.
   Classic-JSX-runtime IIFE, no imports/exports.
   ============================================================ */
(function () {
  const { useState } = React;
  const G = window.G;
  const {
    useTheme, Button, StatusPill, Badge, Card, SectionHeader,
    BilingualLabel, Figure, Icon, Ledger, Skeleton,
  } = window.UI;

  // Shared content width (matches design/screens.jsx's CONTENT_MAX).
  const CONTENT_MAX = 1200;

  // ---------------------------------------------------------------
  // Sample data — Ananya Rao, PGT, EMP-014, Sunrise Public School.
  // FY 2026-27 (Apr-Mar). "Today" sits in Jul 2026.
  // ---------------------------------------------------------------
  const PERIODS = [
    {
      id: "2026-04", label: "Apr 2026", labelDeva: "अप्रैल 2026",
      payPeriod: "1–30 Apr 2026", paymentDate: "30 Apr 2026", status: "Paid",
      netPay: 63940.00, workingDays: 22, paidDays: 22, lop: 0,
    },
    {
      id: "2026-05", label: "May 2026", labelDeva: "मई 2026",
      payPeriod: "1–31 May 2026", paymentDate: "31 May 2026", status: "Paid",
      netPay: 64192.00, workingDays: 22, paidDays: 22, lop: 0,
    },
    {
      id: "2026-06", label: "Jun 2026", labelDeva: "जून 2026",
      payPeriod: "1–30 Jun 2026", paymentDate: "30 Jun 2026", status: "Paid",
      netPay: 61850.36, workingDays: 22, paidDays: 21, lop: 1,
    },
    {
      id: "2026-07", label: "Jul 2026", labelDeva: "जुलाई 2026",
      payPeriod: "1–31 Jul 2026", paymentDate: "31 Jul 2026", status: "Paid",
      netPay: 64192.00, workingDays: 22, paidDays: 22, lop: 0,
    },
  ];

  const EARNINGS = [
    ["Basic", 42000.00],
    ["DA", 8400.00],
    ["HRA", 15120.00],
    ["Special / Academic Allowance", 6500.00],
    ["Conveyance", 1600.00],
  ];
  const DEDUCTIONS = [
    ["Provident Fund (PF)", 6048.00],
    ["Professional Tax", 200.00],
    ["Income Tax (TDS)", 3180.00],
    ["ESIC", 0.00],
  ];
  const EMPLOYER_CONTRIB = [
    ["Provident Fund (Employer)", 1849.68],
    ["EPS (Pension, Employer)", 1249.50],
    ["EDLI (Employer)", 75.00],
  ];
  const YTD = {
    gross: 291134.00,
    tds: 12720.00,
    pf: 23916.36,
  };
  const BANK = { name: "HDFC Bank", masked: "XXXX XXXX 6721", full: "50100 123456721", ifsc: "HDFC0000187" };

  // ---------------------------------------------------------------
  // Small local primitives (kept private to this file — candidates
  // for the shared kit later, not added there per dispatch scope).
  // ---------------------------------------------------------------
  function StatRow({ label, labelDeva, value, sub, last }) {
    const { c } = useTheme();
    return (
      <div style={{ display: "flex", alignItems: "baseline", padding: `${G.sp[2]}px 0`, borderBottom: last ? "none" : `1px solid ${c.border}`, gap: G.sp[3] }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {labelDeva
            ? <BilingualLabel en={label} deva={labelDeva} role="body" />
            : <span style={{ fontFamily: G.sans, fontSize: 13.5, color: c.ink, fontWeight: 500 }}>{label}</span>}
          {sub && <div style={{ fontFamily: G.sans, fontSize: 11.5, color: c.inkMuted, marginTop: 2 }}>{sub}</div>}
        </div>
        <div style={{ fontFamily: G.mono, fontSize: 13.5, fontWeight: 600, color: c.ink, fontFeatureSettings: "'tnum' 1, 'lnum' 1", whiteSpace: "nowrap" }}>
          {value}
        </div>
      </div>
    );
  }

  function MetaItem({ label, children }) {
    const { c } = useTheme();
    return (
      <div style={{ minWidth: 140 }}>
        <div style={{ fontFamily: G.sans, fontSize: 11, color: c.inkMuted, marginBottom: 2 }}>{label}</div>
        <div style={{ fontFamily: G.mono, fontSize: 13, fontWeight: 600, color: c.ink, fontFeatureSettings: "'tnum' 1, 'lnum' 1" }}>{children}</div>
      </div>
    );
  }

  // Bank account — PII, masked by default with an explicit reveal affordance.
  function MaskedBankAccount() {
    const { c } = useTheme();
    const [revealed, setRevealed] = useState(false);
    return (
      <div style={{ minWidth: 200 }}>
        <div style={{ fontFamily: G.sans, fontSize: 11, color: c.inkMuted, marginBottom: 2 }}>Bank account</div>
        <div style={{ display: "flex", alignItems: "center", gap: G.sp[2] }}>
          <span style={{ fontFamily: G.mono, fontSize: 13, fontWeight: 600, color: c.ink, fontFeatureSettings: "'tnum' 1, 'lnum' 1" }}>
            {BANK.name} · {revealed ? BANK.full : BANK.masked}
          </span>
          <Button variant="link" size="sm" onClick={() => setRevealed((r) => !r)}>
            {revealed ? "Hide" : "Reveal"}
          </Button>
        </div>
        {revealed && (
          <div style={{ fontFamily: G.mono, fontSize: 11, color: c.inkMuted, marginTop: 2 }}>IFSC {BANK.ifsc}</div>
        )}
      </div>
    );
  }

  function PasswordNote() {
    const { c } = useTheme();
    return (
      <div style={{ display: "flex", alignItems: "flex-start", gap: G.sp[2], marginTop: G.sp[3] }}>
        <Icon name="document" size={13} color={c.inkMuted} style={{ marginTop: 2, flex: "0 0 auto" }} />
        <span style={{ fontFamily: G.sans, fontSize: 12, color: c.inkMuted, lineHeight: 1.5 }}>
          Payslip PDFs are password-protected with your date of birth (DDMMYYYY).
          <span style={{ color: c.inkMuted }}> · </span>
          <span style={{ fontFamily: G.deva }}>पासवर्ड-सुरक्षित पीडीएफ़ — जन्मतिथि (DDMMYYYY) से खोलें।</span>
        </span>
      </div>
    );
  }

  // ---------------------------------------------------------------
  // List surface — ruled rows in one panel (never per-row cards).
  // ---------------------------------------------------------------
  function PayslipRow({ period, onOpen, last }) {
    const { c } = useTheme();
    return (
      <div
        onClick={() => onOpen(period.id)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onOpen(period.id); }}
        style={{
          display: "flex", alignItems: "center", gap: G.sp[4], padding: `${G.sp[4]}px ${G.sp[5]}px`,
          borderBottom: last ? "none" : `1px solid ${c.border}`, cursor: "pointer", flexWrap: "wrap",
        }}
      >
        <div style={{ flex: "1 1 160px", minWidth: 140 }}>
          <BilingualLabel en={period.label} deva={period.labelDeva} role="body" />
          <div style={{ fontFamily: G.sans, fontSize: 11.5, color: c.inkMuted, marginTop: 2 }}>
            Credited {period.paymentDate}{period.lop > 0 ? ` · ${period.lop} LOP day${period.lop > 1 ? "s" : ""}` : ""}
          </div>
        </div>
        <div style={{ textAlign: "right", minWidth: 120 }}>
          <div style={{ fontFamily: G.sans, fontSize: 11, color: c.inkMuted }}>Net Pay</div>
          <Figure value={period.netPay} size={15} weight={600} />
        </div>
        <StatusPill status={period.status} />
        <Button variant="link" size="sm" onClick={(e) => { e.stopPropagation(); }}>Download</Button>
      </div>
    );
  }

  function Form16Row() {
    const { c } = useTheme();
    return (
      <Card padding={0} style={{ marginTop: G.sp[6] }}>
        <div
          role="button"
          tabIndex={0}
          onClick={() => {}}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); } }}
          style={{ display: "flex", alignItems: "center", gap: G.sp[3], padding: `${G.sp[4]}px ${G.sp[5]}px`, cursor: "pointer" }}
        >
          <Icon name="document" size={17} color={c.inkMuted} />
          <div style={{ flex: 1, minWidth: 160 }}>
            <span style={{ fontFamily: G.sans, fontSize: 13.5, fontWeight: 600, color: c.ink }}>Form 16 &amp; tax documents</span>
            <div style={{ fontFamily: G.sans, fontSize: 11.5, color: c.inkMuted, marginTop: 2 }}>FY 2025-26 · issued 15 Jun 2026</div>
          </div>
          <Badge tone="brass">Verified</Badge>
          <Icon name="chevron" size={13} color={c.inkMuted} style={{ transform: "rotate(-90deg)" }} />
        </div>
      </Card>
    );
  }

  // ---------------------------------------------------------------
  // SkeletonPayslipRow — loading placeholder shaped like a real
  // PayslipRow (icon-free, but same column rhythm), so the list
  // never jumps from "loading" to "loaded" in an unrelated shape.
  // ---------------------------------------------------------------
  function SkeletonPayslipRow({ last }) {
    const { c } = useTheme();
    return (
      <div style={{ display: "flex", alignItems: "center", gap: G.sp[4], padding: `${G.sp[4]}px ${G.sp[5]}px`, borderBottom: last ? "none" : `1px solid ${c.border}`, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 160px", minWidth: 140 }}>
          <Skeleton width={110} height={14} />
          <div style={{ height: 6 }} />
          <Skeleton width={150} height={11} />
        </div>
        <div style={{ minWidth: 120 }}>
          <Skeleton width={90} height={16} />
        </div>
        <Skeleton width={64} height={20} radius={999} />
      </div>
    );
  }

  function PayslipList({ onOpen }) {
    const { c } = useTheme();
    // Real loading state: the list starts "loading" on every mount and
    // resolves to the sample data shortly after — a real fetch would
    // replace this timer. Demonstrates the Skeleton pattern for real,
    // not just as dead code behind an always-false condition.
    const [loading, setLoading] = useState(true);
    React.useEffect(() => {
      const t = window.setTimeout(() => setLoading(false), 550);
      return () => window.clearTimeout(t);
    }, []);

    return (
      <div>
        <div style={{ marginBottom: G.sp[6] }}>
          <BilingualLabel en="Payslips" deva="वेतन पर्ची" role="h1" />
          <div style={{ fontFamily: G.sans, fontSize: 13.5, color: c.inkMuted, marginTop: 4 }}>
            PGT · EMP-014 · Sunrise Public School
          </div>
        </div>
        <SectionHeader>
          <BilingualLabel en="All periods" deva="सभी अवधि" role="h3" />
        </SectionHeader>
        {loading ? (
          <Card padding={0}>
            {[0, 1, 2, 3].map((i) => <SkeletonPayslipRow key={i} last={i === 3} />)}
          </Card>
        ) : (
          <Card padding={0}>
            {PERIODS.slice().reverse().map((p, i, arr) => (
              <PayslipRow key={p.id} period={p} onOpen={onOpen} last={i === arr.length - 1} />
            ))}
          </Card>
        )}
        <PasswordNote />
        <Form16Row />
      </div>
    );
  }

  // ---------------------------------------------------------------
  // Detail surface — pay period + payment meta, Ledger, employer
  // contributions, YTD, paid-days/LOP context.
  // ---------------------------------------------------------------
  function EmployerContributions() {
    const { c } = useTheme();
    const total = EMPLOYER_CONTRIB.reduce((s, [, v]) => s + v, 0);
    return (
      <div>
        <SectionHeader>
          <BilingualLabel en="Employer contributions" deva="नियोक्ता अंशदान" role="h3" />
        </SectionHeader>
        <Card>
          <div style={{ fontFamily: G.sans, fontSize: 12, color: c.inkMuted, marginBottom: G.sp[3] }}>
            Paid by the school on your behalf — not part of your Net Pay above.
          </div>
          {EMPLOYER_CONTRIB.map(([label, value], i) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: `${G.sp["1.5"]}px 0`, borderBottom: `1px solid ${c.border}` }}>
              <span style={{ fontFamily: G.sans, fontSize: 13.5, color: c.ink }}>{label}</span>
              <Figure value={value} />
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", padding: `${G.sp[2]}px 0`, borderTop: `2px solid ${c.border}`, marginTop: G.sp[1] }}>
            <span style={{ fontFamily: G.sans, fontSize: 13.5, fontWeight: 600, color: c.ink }}>Total</span>
            <Figure value={total} weight={600} />
          </div>
        </Card>
      </div>
    );
  }

  function YtdAndAttendance({ period, onViewAttendance }) {
    const { c } = useTheme();
    return (
      <div style={{ display: "flex", gap: G.sp[8], flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 260px", minWidth: 240 }}>
          <SectionHeader>
            <BilingualLabel en="Year to date" deva="वित्त वर्ष तक" role="h3" />
          </SectionHeader>
          <Card padding={0}>
            <div style={{ padding: `0 ${G.sp[5]}px` }}>
              <StatRow label="Gross earnings (YTD)" value={<Figure value={YTD.gross} weight={600} />} />
              <StatRow label="Income Tax / TDS (YTD)" value={<Figure value={YTD.tds} weight={600} />} />
              <StatRow label="Provident Fund, employee (YTD)" value={<Figure value={YTD.pf} weight={600} />} last />
            </div>
          </Card>
        </div>
        <div style={{ flex: "1 1 260px", minWidth: 240 }}>
          <SectionHeader action="View attendance" onAction={onViewAttendance}>
            <BilingualLabel en="Paid days" deva="भुगतान किए गए दिन" role="h3" />
          </SectionHeader>
          <Card padding={0}>
            <div style={{ padding: `0 ${G.sp[5]}px` }}>
              <StatRow label="Working days" value={period.workingDays.toFixed(1)} />
              <StatRow label="Paid days" value={period.paidDays.toFixed(1)} />
              <StatRow
                label="Loss of Pay (LOP)"
                value={period.lop.toFixed(1)}
                sub={period.lop > 0 ? "Unpaid leave beyond balance" : "No LOP this period"}
                last
              />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  function PayslipDetail({ period, onBack, onViewAttendance }) {
    const { c } = useTheme();
    return (
      <div>
        <Button variant="link" size="sm" onClick={onBack} style={{ marginBottom: G.sp[4] }}>← All payslips</Button>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: G.sp[3], marginBottom: G.sp[2] }}>
          <div>
            <BilingualLabel en={period.label} deva={period.labelDeva} role="h1" />
            <div style={{ fontFamily: G.sans, fontSize: 13, color: c.inkMuted, marginTop: 4 }}>
              Ananya Rao · PGT · EMP-014 · Sunrise Public School
            </div>
          </div>
          <StatusPill status={period.status} />
        </div>

        <Card style={{ marginTop: G.sp[4], marginBottom: G.sp[6] }}>
          <div style={{ display: "flex", gap: G.sp[8], flexWrap: "wrap" }}>
            <MetaItem label="Pay period">{period.payPeriod}</MetaItem>
            <MetaItem label="Payment date">{period.paymentDate}</MetaItem>
            <MaskedBankAccount />
          </div>
          <PasswordNote />
          <div style={{ marginTop: G.sp[4] }}>
            <Button variant="ghost" size="sm">Download payslip (PDF)</Button>
          </div>
        </Card>

        <div style={{ marginBottom: G.sp[6] }}>
          <SectionHeader>
            <BilingualLabel en="Earnings & deductions" deva="आय और कटौती" role="h3" />
          </SectionHeader>
          <Ledger earnings={EARNINGS} deductions={DEDUCTIONS} />
        </div>

        <div style={{ marginBottom: G.sp[6] }}>
          <EmployerContributions />
        </div>

        <YtdAndAttendance period={period} onViewAttendance={onViewAttendance} />
      </div>
    );
  }

  // ---------------------------------------------------------------
  // Content root
  // ---------------------------------------------------------------
  function Payslips({ onViewAttendance }) {
    const [selected, setSelected] = useState(null);
    const period = PERIODS.find((p) => p.id === selected) || null;

    return (
      <div style={{ maxWidth: CONTENT_MAX, margin: "0 auto" }}>
        {period
          ? <PayslipDetail period={period} onBack={() => setSelected(null)} onViewAttendance={onViewAttendance} />
          : <PayslipList onOpen={setSelected} />}
      </div>
    );
  }

  window.Screens = window.Screens || {};
  window.Screens.Payslips = Payslips;
})();
