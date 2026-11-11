/* ============================================================
   profile.jsx — Naveya "Profile" (digital service book / faculty
   dossier), employee self-service content. Read-mostly: every
   section's only affordance is "Request change" (HR-governed) —
   there is no inline editing anywhere on this screen.
   Composes ONLY from window.UI (design/kit.jsx) + window.G.
   Classic-JSX-runtime IIFE, no imports/exports.
   Exposes: window.Screens.Profile
   ============================================================ */
(function () {
  const G = window.G;
  const { useTheme, Button, Badge, Card, BilingualLabel, Avatar, Seal, MaskedValue } = window.UI;

  const TABULAR = { fontFeatureSettings: "'tnum' 1, 'lnum' 1" };

  // Shared content width (matches design/screens.jsx's CONTENT_MAX).
  const CONTENT_MAX = 1200;

  // ---------------------------------------------------------------
  // Mock data (design canvas only — a real page would fetch this via
  // TanStack Query with loading/error/empty states per surface, and
  // would gate every PII field on the viewer's role × scope).
  // ---------------------------------------------------------------
  const QUALIFICATIONS = [
    { degree: "M.Sc. Physics", sub: "Delhi University · 2013", verifiedOn: "14 Jan 2020" },
    { degree: "B.Ed.", sub: "Jamia Millia Islamia · 2015", verifiedOn: "14 Jan 2020" },
    { degree: "CTET — Paper II (Science & Mathematics)", sub: "CBSE · Qualified 2016 · Certificate CTET1620441", verifiedOn: "14 Jan 2020" },
  ];

  const SERVICE_RECORD = [
    { date: "12 Jun 2019", title: "Joined as TGT — Physics", detail: "Dwarka Campus" },
    { date: "18 Dec 2019", title: "Confirmed in service", detail: "Probation period completed" },
    { date: "01 Apr 2022", title: "Promoted to PGT — Physics", detail: "" },
    { date: "01 Apr 2023", title: "Transferred", detail: "Dwarka Campus → Rohini Campus" },
  ];

  // MaskedValue is promoted to the shared kit (window.UI) — this screen
  // and documents.jsx each had an identical private copy; see design/kit.jsx.

  // ---------------------------------------------------------------
  // CardHeader — bilingual section title + the section's only edit
  // affordance: "Request change" (opens an HR DocumentUpdateRequest
  // flow elsewhere — never an inline field on this screen).
  // ---------------------------------------------------------------
  function CardHeader({ en, deva }) {
    const { c } = useTheme();
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: G.sp[3],
        padding: `${G.sp[4]}px ${G.sp[5]}px`, borderBottom: `1px solid ${c.border}`, flexWrap: "wrap",
      }}>
        <BilingualLabel en={en} deva={deva} role="h3" />
        <Button variant="link" size="sm" onClick={() => {}}>Request change</Button>
      </div>
    );
  }

  // ---------------------------------------------------------------
  // DataRow — ruled label/value row, comfortable density (~44px)
  // ---------------------------------------------------------------
  function DataRow({ label, value, valueNode, last }) {
    const { c } = useTheme();
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: G.sp[4], flexWrap: "wrap",
        padding: `${G.sp[3]}px ${G.sp[5]}px`, borderBottom: last ? "none" : `1px solid ${c.border}`,
      }}>
        <div style={{ flex: "0 0 200px", fontFamily: G.sans, fontSize: 12.5, color: c.inkMuted }}>{label}</div>
        <div style={{ flex: "1 1 220px", fontFamily: G.sans, fontSize: 13.5, color: c.ink, fontWeight: 500 }}>
          {valueNode || value}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------
  // Employment — designation, department, campus, DOJ, confirmation,
  // employment type, reporting-to
  // ---------------------------------------------------------------
  function EmploymentCard() {
    const { c } = useTheme();
    return (
      <Card padding={0}>
        <CardHeader en="Employment" deva="नियुक्ति विवरण" />
        <DataRow label="Designation" value="PGT — Post Graduate Teacher (Physics)" />
        <DataRow label="Department" value="Senior Secondary · Sciences" />
        <DataRow label="Campus" value="Sunrise Public School — Rohini Campus" />
        <DataRow label="Date of joining" value="12 Jun 2019" />
        <DataRow
          label="Confirmation status"
          valueNode={
            <div style={{ display: "flex", alignItems: "center", gap: G.sp[2] }}>
              <Seal label="Confirmed" />
              <span style={{ fontFamily: G.mono, fontSize: 11.5, color: c.inkMuted }}>since 18 Dec 2019</span>
            </div>
          }
        />
        <DataRow
          label="Employment type"
          valueNode={
            <div style={{ display: "flex", gap: G.sp[2], flexWrap: "wrap", alignItems: "center" }}>
              <Badge tone="neutral">Full-time</Badge>
              <Badge tone="info">Vacation staff</Badge>
            </div>
          }
        />
        <DataRow
          label="Reporting to"
          valueNode={
            <div style={{ display: "flex", alignItems: "center", gap: G.sp[2] }}>
              <Avatar initials="VS" size={22} />
              <span>Vikram Sinha — Vice Principal, Academics</span>
            </div>
          }
          last
        />
        <div style={{ padding: `${G.sp[2]}px ${G.sp[5]}px ${G.sp[3]}px`, borderTop: `1px solid ${c.border}`, fontFamily: G.sans, fontSize: 11.5, color: c.inkMuted }}>
          Vacation staff draw vacation leave in lieu of earned leave (EL), per the academic-calendar policy.
        </div>
      </Card>
    );
  }

  // ---------------------------------------------------------------
  // Qualifications — HR-verified credentials (brass Seal, not a
  // generic green check) + a ruled service-record timeline
  // ---------------------------------------------------------------
  function QualificationRow({ q, last }) {
    const { c } = useTheme();
    return (
      <div style={{
        display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: G.sp[4],
        padding: `${G.sp[3]}px 0`, borderBottom: last ? "none" : `1px solid ${c.border}`, flexWrap: "wrap",
      }}>
        <div style={{ flex: "1 1 220px", minWidth: 0 }}>
          <div style={{ fontFamily: G.sans, fontSize: 13.5, fontWeight: 600, color: c.ink }}>{q.degree}</div>
          <div style={{ fontFamily: G.sans, fontSize: 12, color: c.inkMuted, marginTop: 2 }}>{q.sub}</div>
        </div>
        <div style={{ flex: "0 0 auto", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
          <Seal label="Verified" />
          <span style={{ fontFamily: G.mono, fontSize: 10.5, color: c.inkMuted }}>{q.verifiedOn}</span>
        </div>
      </div>
    );
  }

  function ServiceTimeline({ entries }) {
    const { c } = useTheme();
    return (
      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", left: 5, top: 8, bottom: 8, width: 2, background: c.border }} />
        {entries.map((e, i) => (
          <div key={e.date + i} style={{ display: "flex", gap: G.sp[4], padding: `${G.sp[2]}px 0`, alignItems: "flex-start" }}>
            <div style={{ position: "relative", width: 12, flex: "0 0 12px", display: "flex", justifyContent: "center", paddingTop: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: 1.5, background: c.accent }} />
            </div>
            <div style={{ flex: "0 0 92px", fontFamily: G.mono, fontSize: 11, color: c.inkMuted, paddingTop: 2, ...TABULAR }}>{e.date}</div>
            <div style={{ flex: "1 1 200px", minWidth: 0 }}>
              <div style={{ fontFamily: G.sans, fontSize: 13, fontWeight: 500, color: c.ink }}>{e.title}</div>
              {e.detail && <div style={{ fontFamily: G.sans, fontSize: 11.5, color: c.inkMuted, marginTop: 1 }}>{e.detail}</div>}
            </div>
          </div>
        ))}
      </div>
    );
  }

  function QualificationsCard() {
    const { c } = useTheme();
    return (
      <Card padding={0}>
        <CardHeader en="Qualifications & Service Record" deva="योग्यता एवं सेवा अभिलेख" />
        <div style={{ padding: G.sp[5] }}>
          <div style={{ fontFamily: G.mono, fontSize: 11, letterSpacing: ".05em", color: c.inkMuted, textTransform: "uppercase", marginBottom: G.sp[2] }}>
            Qualifications
          </div>
          {QUALIFICATIONS.map((q, i) => (
            <QualificationRow key={q.degree} q={q} last={i === QUALIFICATIONS.length - 1} />
          ))}

          <div style={{ fontFamily: G.mono, fontSize: 11, letterSpacing: ".05em", color: c.inkMuted, textTransform: "uppercase", margin: `${G.sp[6]}px 0 ${G.sp[2]}px` }}>
            Service record
          </div>
          <ServiceTimeline entries={SERVICE_RECORD} />
        </div>
      </Card>
    );
  }

  // ---------------------------------------------------------------
  // Statutory & Bank — PII masked by default, explicit reveal per
  // field; ESIC correctly shown as not-applicable above the wage
  // ceiling rather than a blank/zeroed field.
  // ---------------------------------------------------------------
  function StatRow({ label, masked, full, plain, value, na, naNote, last }) {
    const { c } = useTheme();
    return (
      <div style={{ padding: `${G.sp[3]}px ${G.sp[5]}px`, borderBottom: last ? "none" : `1px solid ${c.border}` }}>
        <div style={{ fontFamily: G.sans, fontSize: 12, color: c.inkMuted, marginBottom: 4 }}>{label}</div>
        {na ? (
          <div style={{ fontFamily: G.sans, fontSize: 13, color: c.inkMuted }}>{naNote}</div>
        ) : plain ? (
          <span style={{ fontFamily: G.mono, fontSize: 13, color: c.ink, ...TABULAR }}>{value}</span>
        ) : (
          <MaskedValue masked={masked} full={full} size={13} />
        )}
      </div>
    );
  }

  function StatutoryCard() {
    const { c } = useTheme();
    return (
      <Card padding={0}>
        <CardHeader en="Statutory & Bank Details" deva="सांविधिक एवं बैंक विवरण" />
        <StatRow label="PAN — Permanent Account Number" masked="••••• 1234F" full="AGZPR1234F" />
        <StatRow label="Aadhaar — Unique ID" masked="•••• •••• 5678" full="2846 5510 5678" />
        <StatRow label="UAN — EPFO Universal Account Number" masked="••••••••5231" full="100234785231" />
        <StatRow label="ESIC" na naNote="Not applicable — wages above the ESIC coverage ceiling" />
        <StatRow label="Bank account — HDFC Bank" masked="••••••1122" full="50100123401122" />
        <StatRow label="IFSC code" plain value="HDFC0001234" last />
        <div style={{ padding: `${G.sp[3]}px ${G.sp[5]}px`, borderTop: `1px solid ${c.border}`, fontFamily: G.sans, fontSize: 11.5, color: c.inkMuted }}>
          Masked by default — revealing a field is recorded for audit. Contact HR to update statutory or bank details.
        </div>
      </Card>
    );
  }

  // ---------------------------------------------------------------
  // Emergency Contact
  // ---------------------------------------------------------------
  function EmergencyCard() {
    return (
      <Card padding={0}>
        <CardHeader en="Emergency Contact" deva="आपातकालीन संपर्क" />
        <DataRow label="Name" value="Rajeev Rao" />
        <DataRow label="Relationship" value="Spouse" />
        <DataRow label="Phone" value="+91 98765 43210" />
        <DataRow label="Address" value="B-42, Sector 12, Rohini, New Delhi 110085" last />
      </Card>
    );
  }

  // ---------------------------------------------------------------
  // Profile — identity header + two-column dossier
  // ---------------------------------------------------------------
  function Profile() {
    const { c } = useTheme();
    return (
      <div style={{ maxWidth: CONTENT_MAX, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: G.sp[5], flexWrap: "wrap", marginBottom: G.sp[3] }}>
          <Avatar initials="AR" size={64} />
          <div style={{ flex: "1 1 320px", minWidth: 240 }}>
            <div style={{ ...G.t("h1", "latin"), color: c.ink }}>Ananya Rao</div>
            <div style={{ fontFamily: G.sans, fontSize: 13.5, color: c.inkMuted, marginTop: 4 }}>
              PGT · EMP-014 · Sunrise Public School — Rohini Campus
            </div>
            <div style={{ marginTop: 8 }}>
              <BilingualLabel en="Digital service book" deva="डिजिटल सेवा पुस्तिका" role="caption" color={c.inkMuted} />
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => {}}>Request change</Button>
        </div>

        <div style={{ fontFamily: G.sans, fontSize: 12, color: c.inkMuted, marginBottom: G.sp[6], maxWidth: 680 }}>
          Your service book is maintained by HR. Use "Request change" on any section below to ask for an update —
          nothing on this page is directly editable.
        </div>

        <div style={{ display: "flex", gap: G.sp[10], alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ flex: "1.25 1 380px", minWidth: 340 }}>
            <div style={{ marginBottom: G.sp[6] }}><EmploymentCard /></div>
            <QualificationsCard />
          </div>
          <div style={{ flex: "1 1 300px", minWidth: 300 }}>
            <div style={{ marginBottom: G.sp[6] }}><StatutoryCard /></div>
            <EmergencyCard />
          </div>
        </div>
      </div>
    );
  }

  window.Screens = window.Screens || {};
  window.Screens.Profile = Profile;
})();
