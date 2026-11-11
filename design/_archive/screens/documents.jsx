/* ============================================================
   documents.jsx — Naveya "Documents" (DigiLocker-style vault +
   HR-governed update flow), employee self-service content.
   Composes ONLY from window.UI (design/kit.jsx) + window.G.
   Classic-JSX-runtime IIFE, no imports/exports.
   Exposes: window.Screens.Documents
   ============================================================ */
(function () {
  const G = window.G;
  const {
    useTheme, Button, Badge, StatusPill, Card, SectionHeader,
    BilingualLabel, Icon, Seal, MaskedValue, EmptyState,
  } = window.UI;

  const TABULAR = { fontFeatureSettings: "'tnum' 1, 'lnum' 1" };

  // Shared content width (matches design/screens.jsx's CONTENT_MAX).
  const CONTENT_MAX = 1200;

  // ---------------------------------------------------------------
  // Mock data (design canvas only — a real page would fetch this
  // via TanStack Query with loading/error/empty states per surface).
  // ---------------------------------------------------------------
  const ACTION_REQUESTS = [
    {
      id: "req-police",
      title: "Renew police verification",
      deva: "पुलिस सत्यापन नवीनीकृत करें",
      category: "Verification",
      requestedBy: "HR — Priya Menon",
      due: "12 days",
      note: "Current certificate expires in 24 days. Upload the renewed certificate once received from the station.",
    },
    {
      id: "req-medical",
      title: "Submit updated medical fitness certificate",
      deva: "चिकित्सा फिटनेस प्रमाणपत्र अपलोड करें",
      category: "Medical Fitness",
      requestedBy: "HR — Priya Menon",
      due: "5 days",
      note: "Previous submission was rejected — the scan was illegible. Please re-upload a clear copy.",
    },
  ];

  const CATEGORIES = [
    {
      key: "identity",
      title: "Identity",
      docs: [
        {
          id: "pan",
          name: "PAN Card",
          sub: "Permanent Account Number",
          masked: "•••••• 7421F",
          full: "ABCDE 7421F",
          status: "Verified",
          verifiedNote: "Verified 12 Jan 2024",
        },
        {
          id: "aadhaar",
          name: "Aadhaar Card",
          sub: "Unique Identification Authority of India",
          masked: "XXXX XXXX 8823",
          full: "4821 5590 8823",
          status: "Verified",
          verifiedNote: "Verified 12 Jan 2024",
        },
      ],
    },
    {
      key: "qualifications",
      title: "Qualifications",
      docs: [
        { id: "bed", name: "B.Ed. Degree", sub: "Regional Institute of Education", status: "Verified", verifiedNote: "Verified 4 Jun 2019" },
        { id: "ctet", name: "CTET Certificate", sub: "Central Board of Secondary Education", status: "Verified", expiryLabel: "Valid till Dec 2027", tone: "info" },
        { id: "tet", name: "State TET Certificate", sub: "Submitted 3 days ago", status: "Pending" },
      ],
    },
    {
      key: "verification",
      title: "Verification",
      docs: [
        { id: "police", name: "Police Verification Certificate", sub: "Station: Malviya Nagar, Jaipur", status: "Verified", expiryLabel: "Expires in 24 days", tone: "danger", verifiedNote: "Verified 2 Aug 2023" },
        { id: "bgv", name: "Background Verification (BGV) Report", sub: "Conducted via third-party agency", status: "Verified", verifiedNote: "Verified 2 Aug 2023" },
      ],
    },
    {
      key: "contracts",
      title: "Contracts",
      docs: [
        { id: "offer", name: "Appointment Letter", sub: "Issued at joining", status: "Verified", verifiedNote: "On record since 1 Apr 2019" },
        { id: "service", name: "Service Contract, FY 2025–26", sub: "Sunrise Vidya Group", status: "Verified", expiryLabel: "Renews in 62 days", tone: "warning" },
      ],
    },
    {
      key: "medical",
      title: "Medical Fitness",
      docs: [
        { id: "medical", name: "Medical Fitness Certificate", sub: "Rejected — illegible scan", status: "Rejected", note: "HR requested a resubmission — see Action needed above." },
      ],
    },
  ];

  // MaskedValue is promoted to the shared kit (window.UI) — this screen
  // and profile.jsx each had an identical private copy; see design/kit.jsx.

  // ---------------------------------------------------------------
  // RequestCard — one open HR document request. The ONLY affordance
  // on an open request is "Upload response" — there is no free-form
  // edit anywhere in this screen.
  // ---------------------------------------------------------------
  function RequestCard({ req }) {
    const { c } = useTheme();
    return (
      <Card style={{ marginBottom: G.sp[4] }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: G.sp[3], marginBottom: G.sp[3], flexWrap: "wrap" }}>
          <div style={{ width: 28, height: 28, borderRadius: G.r.xs, background: c.warning, display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}>
            <Icon name="alert" size={15} color={c.onWarning} />
          </div>
          <div style={{ flex: "1 1 220px", minWidth: 200 }}>
            <div style={{ fontFamily: G.sans, fontSize: 13.5, fontWeight: 600, color: c.ink }}>{req.title}</div>
            <div style={{ fontFamily: G.deva, fontSize: 12.5, color: c.inkMuted, marginTop: 1 }}>{req.deva}</div>
          </div>
          <Badge tone="warning">Due in {req.due}</Badge>
        </div>
        <div style={{ fontFamily: G.sans, fontSize: 12, color: c.inkMuted, marginBottom: 2 }}>
          {req.category} &nbsp;·&nbsp; requested by {req.requestedBy}
        </div>
        <div style={{ fontFamily: G.sans, fontSize: 12.5, color: c.ink, marginBottom: G.sp[4] }}>
          {req.note}
        </div>
        <Button variant="primary" size="sm">Upload response</Button>
      </Card>
    );
  }

  // ---------------------------------------------------------------
  // DocRow — one ruled vault row. Verified rows get a brass Seal +
  // Download; nothing else is ever actionable (no edit/replace).
  // ---------------------------------------------------------------
  function DocRow({ doc, last }) {
    const { c } = useTheme();
    return (
      <div
        style={{
          display: "flex", alignItems: "center", gap: G.sp[4],
          padding: `${G.sp[3]}px ${G.sp[4]}px`,
          borderBottom: last ? "none" : `1px solid ${c.border}`,
          flexWrap: "wrap",
        }}
      >
        <div style={{ width: 32, height: 32, borderRadius: G.r.xs, background: c.bg, border: `1px solid ${c.border}`, display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}>
          <Icon name="document" size={15} color={c.inkMuted} />
        </div>

        <div style={{ flex: "1 1 220px", minWidth: 190 }}>
          <div style={{ fontFamily: G.sans, fontSize: 13.5, fontWeight: 500, color: c.ink }}>{doc.name}</div>
          {doc.sub && <div style={{ fontFamily: G.sans, fontSize: 11.5, color: c.inkMuted, marginTop: 1 }}>{doc.sub}</div>}
          {doc.masked && <MaskedValue masked={doc.masked} full={doc.full} style={{ marginTop: 3 }} />}
        </div>

        {doc.expiryLabel && (
          <Badge tone={doc.tone || "info"} icon="clock">{doc.expiryLabel}</Badge>
        )}

        <StatusPill status={doc.status} />

        <div style={{ display: "flex", alignItems: "center", gap: G.sp[2], minWidth: 148, justifyContent: "flex-end" }}>
          {doc.status === "Verified" && (
            <div style={{ display: "flex", alignItems: "center", gap: G.sp[2] }}>
              <Seal label="On record" />
              <Button variant="link" size="sm">Download</Button>
            </div>
          )}
          {doc.status === "Rejected" && doc.note && (
            <span style={{ fontFamily: G.sans, fontSize: 11.5, color: c.danger, maxWidth: 200, textAlign: "right" }}>{doc.note}</span>
          )}
        </div>

        {doc.status === "Verified" && doc.verifiedNote && (
          <div style={{ width: "100%", fontFamily: G.sans, fontSize: 11, color: c.inkMuted, paddingLeft: 44 }}>{doc.verifiedNote}</div>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------
  // CategorySection — a ruled group inside the vault (dense = ruled,
  // never identical rounded-card grids).
  // ---------------------------------------------------------------
  function CategorySection({ cat }) {
    return (
      <div style={{ marginBottom: G.sp[8] }}>
        <SectionHeader>{cat.title}</SectionHeader>
        <Card padding={0}>
          {cat.docs.map((d, i) => (
            <DocRow key={d.id} doc={d} last={i === cat.docs.length - 1} />
          ))}
        </Card>
      </div>
    );
  }

  // ---------------------------------------------------------------
  // Documents — top-level content (renders inside EmployeeShell's
  // main column; shell owns top bar + left nav).
  // ---------------------------------------------------------------
  function Documents() {
    const { c } = useTheme();
    return (
      <div style={{ maxWidth: CONTENT_MAX, margin: "0 auto" }}>
        <BilingualLabel en="Documents" deva="दस्तावेज़" role="h1" />
        <div style={{ fontFamily: G.sans, fontSize: 13.5, color: c.inkMuted, marginTop: 4, marginBottom: G.sp[8] }}>
          Your document vault, verified by HR. You can only respond to an open request below — HR verifies every update before it becomes part of the record.
        </div>

        <div style={{ marginBottom: G.sp[8] }}>
          <SectionHeader>Action needed{ACTION_REQUESTS.length ? ` (${ACTION_REQUESTS.length})` : ""}</SectionHeader>
          {ACTION_REQUESTS.length === 0 ? (
            <Card>
              <EmptyState icon="check" title="No open requests" description="You are all caught up — HR has nothing pending from you." />
            </Card>
          ) : (
            ACTION_REQUESTS.map((req) => <RequestCard key={req.id} req={req} />)
          )}
        </div>

        {CATEGORIES.map((cat) => (
          <CategorySection key={cat.key} cat={cat} />
        ))}
      </div>
    );
  }

  window.Screens = window.Screens || {};
  window.Screens.Documents = Documents;
})();
