/* @jsxRuntime classic */
/* ============================================================
   Naveya — Documents (Employee Self-Service) · window.Pages3.Documents

   THE GOVERNANCE *IS* THE DESIGN (dev-spec §4.5 + M4, docs/ui-compliance-
   requirements.md O4 / §3 / A14-A21).

   An employee has NO direct create/update path to StaffDocument; the
   `documents.write` permission is not granted to the Employee role. So
   this screen carries, deliberately and permanently:
     · no "Upload a document", no "Add document", no drag-and-drop zone
     · no Edit / Replace / Delete on any document, in any state
     · no employee-initiated document change — "Ask HR about this" raises
       a helpdesk message (M15.1), it never writes a document
   Those controls are ABSENT, not disabled-with-a-reason: the standing
   rule in ui-compliance-requirements §0 is that a right the role never
   holds is not drawn at all (a disabled stub enumerates the permission
   model). Disabled-with-a-reason is used only where the right exists and
   a STATE precondition is unmet — here, "Open the file" on a document
   type that is not on record yet.

   The one thing she can do is RESPOND to an HR-initiated
   DocumentUpdateRequest while it is `open` (M4 state machine:
   Open -> Submitted -> Verified | Rejected; Rejected -> Open only when HR
   re-requests). So the screen is three honest surfaces:
     1. the open requests            — the single honey card, the only CTA
     2. what she has already sent    — with HR, or sent back with a reason
     3. her document file            — every type the school holds *and*
                                       the ones it does not, each state as
                                       mark + word (DESIGN 8), with the
                                       append-only trail in a detail panel

   The live document NEVER changes while a response is pending (M4 rule 3)
   — the register says so on the row itself.

   Composed only from window.G3 / window.UI3. kit.jsx, tokens.jsx,
   screens.jsx, attendance.jsx and v3.html are untouched by this file.
   ============================================================ */
(function () {
  const G3 = window.G3;
  const UI = window.UI3;
  const { useState, useMemo } = React;
  const {
    useTheme, ThemeToggle, useLang, addStrings,
    Rail, Motif, Card, Register, Button, LinkButton, Chip, StatusMark,
    Icon, ActionMenu, EmptyState, RequestArt,
  } = UI;

  /* ============================================================
     STRINGS — doc3.* is this screen's namespace. Identity and school
     name are REUSED from home.* (screens.jsx): one source per fact.
     EN and HI carry exactly the same key set; every demo value —
     names, reasons, dates — is translated too, because mock content
     that stays English is the i18n leak we keep re-finding.
     ============================================================ */
  addStrings({
    en: {
      "doc3.pageTitle": "Documents",

      /* --- people --- */
      "doc3.who.meera": "Meera Iyer, HR",
      "doc3.who.rajan": "Rajan Pillai, HR",

      /* --- month short forms, authored per language (never sliced) --- */
      "doc3.mon.01": "Jan", "doc3.mon.02": "Feb", "doc3.mon.03": "Mar",
      "doc3.mon.04": "Apr", "doc3.mon.05": "May", "doc3.mon.06": "Jun",
      "doc3.mon.07": "Jul", "doc3.mon.08": "Aug", "doc3.mon.09": "Sep",
      "doc3.mon.10": "Oct", "doc3.mon.11": "Nov", "doc3.mon.12": "Dec",

      /* --- document types --- */
      "doc3.type.degree": "Degree certificate",
      "doc3.type.bed": "B.Ed. certificate",
      "doc3.type.tet": "Teacher eligibility certificate",
      "doc3.type.pan": "PAN card",
      "doc3.type.aadhaar": "Aadhaar",
      "doc3.type.police": "Police verification",
      "doc3.type.training": "Child-protection and first-aid training",
      "doc3.type.medical": "Medical fitness certificate",
      "doc3.type.address": "Address proof",
      "doc3.type.bankProof": "Bank account proof",

      /* --- states: mark + word, never colour alone --- */
      "doc3.st.verified": "Verified",
      "doc3.st.expiring": "Expires soon",
      "doc3.st.expired": "Expired",
      "doc3.st.missing": "Not on record",
      "doc3.st.withHR": "With HR",
      "doc3.st.sentBack": "Sent back",

      /* --- the honey card: open requests --- */
      "doc3.req.chip": "Awaiting your response",
      "doc3.req.title1": "HR has asked you for one thing",
      "doc3.req.titleN": "HR has asked you for {count} things",
      "doc3.req.lede": "Send what the office asked for. HR checks it before it goes on your record.",
      "doc3.req.dueBy": "Respond by {date}",
      "doc3.req.daysLeft": "days left",
      "doc3.req.askedBy": "Asked by {who} on {date}",
      "doc3.req.cta": "Upload your response",
      "doc3.req.view": "See the request",
      "doc3.req.privacy": "What you send goes to your school's HR office and nowhere else, and is kept for as long as the law requires.",
      "doc3.req.privacyLink": "What the school holds about you",
      "doc3.req.r1.why": "The tax office needs a current copy for this year's Form 16.",
      "doc3.req.r2.why": "Your salary account changed in July. The office needs proof before it pays into it, and a second person approves the change.",
      "doc3.req.r1.due": "Thu, 20 Aug 2026",
      "doc3.req.r2.due": "Tue, 25 Aug 2026",
      "doc3.req.r1.asked": "Sat, 8 Aug",
      "doc3.req.r2.asked": "Tue, 11 Aug",

      /* --- what she has already sent --- */
      "doc3.resp.title": "What you have sent",
      "doc3.resp.sub": "These are with the school office right now.",
      "doc3.resp.sentOn": "Sent {date}",
      "doc3.resp.withHRNote": "Your copy is with HR. The certificate on record has not changed yet.",
      "doc3.resp.backNote": "HR will ask again when they are ready. You cannot send another copy until they do.",
      "doc3.resp.reasonLabel": "HR wrote:",
      "doc3.resp.reason.address": "The photo cut off the bottom of the page, so the address line cannot be read.",
      "doc3.resp.empty.head": "Nothing is waiting with HR",
      "doc3.resp.empty.body": "When you answer a request, it will sit here until the office has checked it.",

      /* --- the register --- */
      "doc3.reg.title": "Your document file",
      "doc4.req.title": "HR has asked you for {n} documents",
      "doc4.req.title1": "HR has asked you for a document",
      "doc4.req.due": "by {date}",
      "doc4.req.upload": "Upload",
      "doc4.sent.title": "What you have sent",
      "doc4.sent.col.doc": "Document",
      "doc4.sent.col.sent": "Sent on",
      "doc4.sent.col.state": "Status",
      "doc4.sent.col.what": "What happened",
      "doc4.reg.aria": "Open {doc}",
      "doc3.col.document": "Document",
      "doc3.col.status": "Status",
      "doc3.col.issued": "Issued",
      "doc3.col.validUntil": "Valid until",
      "doc3.col.onRecord": "On record since",
      "doc3.col.actions": "Actions",
      "doc3.reg.footNote": "HR asks when the school needs a document — there is nothing for you to add here.",
      "doc3.reg.ask": "Ask HR about a document",
      "doc3.reg.selectAria": "Show the history of {doc}",

      /* --- row notes --- */
      "doc3.note.panAsked": "HR has asked you for a fresh copy",
      "doc3.note.medicalWithHR": "Your renewal is with HR — this copy has not changed",
      "doc3.note.addressBack": "HR could not read the copy you sent",
      "doc3.note.bankAsked": "HR has asked you for this",

      /* --- row menu --- */
      "doc3.menu.aria": "Actions for {doc}",
      "doc3.menu.open": "Open the file",
      "doc3.menu.download": "Download a copy",
      "doc3.menu.history": "See its history",
      "doc3.menu.respond": "Respond to HR's request",
      "doc3.menu.ask": "Ask HR about this",
      "doc3.menu.noFile": "Nothing is on record yet",

      /* --- detail panel --- */
      "doc3.det.trail": "Its history",
      "doc3.det.appendOnly": "Nothing here is ever removed — a newer copy takes over, and both stay on record.",
      "doc3.det.retention": "Kept until {date}",
      "doc3.det.inDays": "days from now",
      "doc3.det.agoDays": "days ago",
      "doc3.det.expiresIn": "Runs out in",
      "doc3.det.expiredAgo": "Ran out",
      "doc3.det.restricted": "A child-safety record. You can see that it is current and when it runs out; the officer's remarks are not shown to you.",
      "doc3.det.noFile": "Nothing is on record yet, so there is no file to open.",
      "doc3.det.empty.head": "Pick a document",
      "doc3.det.empty.body": "Choose a row on the left and its whole history appears here.",

      /* --- bases for the retention line --- */
      "doc3.basis.legal": "the law requires this record",
      "doc3.basis.service": "part of your service record",
      "doc3.basis.safety": "a child-safety rule",

      /* --- trail lines --- */
      "doc3.trail.uploaded": "Put on record by {who}",
      "doc3.trail.verified": "Verified by {who}",
      "doc3.trail.superseded": "A newer copy took over — the earlier one stays on record",
      "doc3.trail.requested": "{who} asked you for a fresh copy",
      "doc3.trail.responded": "You sent your response",
      "doc3.trail.sentBack": "{who} sent your response back",
      "doc3.trail.lapsed": "The validity printed on this certificate ran out",
      "doc3.trail.neverHeld": "The school has never held this one",
    },

  });

  /* ============================================================
     DEMO CONTENT — synthetic throughout. "Today" is Tue 11 Aug 2026 —
     the SAME anchor as every other v3 page. Day counts below are derived
     from it by hand and must be re-derived if the anchor ever moves.
     the same week Home and My Attendance sit in. Every weekday name
     was checked against the real calendar rather than invented.
     ============================================================ */

  /* state -> data role + word. StatusMark draws glyph + word from these,
     so a state is never carried by colour alone (DESIGN 8). */
  const STATE = {
    verified: { role: "present", word: "doc3.st.verified" },
    expiring: { role: "late", word: "doc3.st.expiring" },
    expired: { role: "absent", word: "doc3.st.expired" },
    missing: { role: "missing", word: "doc3.st.missing" },
    withHR: { role: "ltEL", word: "doc3.st.withHR", glyph: "clock" },
    sentBack: { role: "penalty", word: "doc3.st.sentBack", glyph: "arrow" },
  };

  const OPEN_REQUESTS = [
    {
      id: "r1", docKey: "doc3.type.pan", whyKey: "doc3.req.r1.why",
      whoKey: "doc3.who.meera", askedKey: "doc3.req.r1.asked",
      dueKey: "doc3.req.r1.due", daysLeft: 7,
    },
    {
      id: "r2", docKey: "doc3.type.bankProof", whyKey: "doc3.req.r2.why",
      whoKey: "doc3.who.rajan", askedKey: "doc3.req.r2.asked",
      dueKey: "doc3.req.r2.due", daysLeft: 12,
    },
  ];

  const RESPONSES = [
    {
      id: "s1", docKey: "doc3.type.medical", state: "withHR",
      sent: ["10", "08", "2026"], whoKey: "doc3.who.meera",
      noteKey: "doc3.resp.withHRNote",
    },
    {
      id: "s2", docKey: "doc3.type.address", state: "sentBack",
      sent: ["2", "08", "2026"], whoKey: "doc3.who.meera",
      noteKey: "doc3.resp.backNote", reasonKey: "doc3.resp.reason.address",
      backOn: ["5", "08", "2026"],
    },
  ];

  /* The file itself. `missing` rows are types the school does NOT hold —
     an honest state, whose remedy is always "HR will ask", never an
     upload control. */
  const DOCS = [
    {
      id: "degree", nameKey: "doc3.type.degree", state: "verified",
      issued: ["12", "06", "2011"], valid: null, record: ["12", "04", "2024"],
      ret: ["31", "03", "2035"], basis: "doc3.basis.service",
      trail: [
        { k: "doc3.trail.uploaded", who: "doc3.who.meera", d: ["12", "04", "2024"] },
        { k: "doc3.trail.verified", who: "doc3.who.meera", d: ["14", "04", "2024"] },
      ],
    },
    {
      id: "bed", nameKey: "doc3.type.bed", state: "verified",
      issued: ["30", "05", "2012"], valid: null, record: ["12", "04", "2024"],
      ret: ["31", "03", "2035"], basis: "doc3.basis.service",
      trail: [
        { k: "doc3.trail.uploaded", who: "doc3.who.meera", d: ["12", "04", "2024"] },
        { k: "doc3.trail.verified", who: "doc3.who.meera", d: ["14", "04", "2024"] },
      ],
    },
    {
      id: "tet", nameKey: "doc3.type.tet", state: "verified",
      issued: ["18", "01", "2019"], valid: ["17", "01", "2033"], record: ["12", "04", "2024"],
      ret: ["31", "03", "2035"], basis: "doc3.basis.service",
      trail: [
        { k: "doc3.trail.uploaded", who: "doc3.who.meera", d: ["12", "04", "2024"] },
        { k: "doc3.trail.verified", who: "doc3.who.meera", d: ["16", "04", "2024"] },
      ],
    },
    {
      id: "pan", nameKey: "doc3.type.pan", state: "verified",
      issued: null, valid: null, record: ["12", "04", "2024"],
      ret: ["31", "03", "2035"], basis: "doc3.basis.legal",
      noteKey: "doc3.note.panAsked", requestId: "r1",
      trail: [
        { k: "doc3.trail.uploaded", who: "doc3.who.meera", d: ["12", "04", "2024"] },
        { k: "doc3.trail.verified", who: "doc3.who.meera", d: ["14", "04", "2024"] },
        { k: "doc3.trail.requested", who: "doc3.who.meera", d: ["8", "08", "2026"] },
      ],
    },
    {
      id: "aadhaar", nameKey: "doc3.type.aadhaar", state: "verified",
      issued: null, valid: null, record: ["12", "04", "2024"],
      ret: ["31", "03", "2035"], basis: "doc3.basis.legal",
      trail: [
        { k: "doc3.trail.uploaded", who: "doc3.who.meera", d: ["12", "04", "2024"] },
        { k: "doc3.trail.verified", who: "doc3.who.meera", d: ["14", "04", "2024"] },
      ],
    },
    {
      id: "police", nameKey: "doc3.type.police", state: "verified", restricted: true,
      issued: ["2", "08", "2024"], valid: ["31", "07", "2027"], record: ["5", "08", "2024"],
      ret: ["31", "07", "2034"], basis: "doc3.basis.safety",
      trail: [
        { k: "doc3.trail.uploaded", who: "doc3.who.rajan", d: ["5", "08", "2024"] },
        { k: "doc3.trail.verified", who: "doc3.who.rajan", d: ["7", "08", "2024"] },
      ],
    },
    {
      id: "training", nameKey: "doc3.type.training", state: "expiring",
      issued: ["15", "10", "2024"], valid: ["14", "10", "2026"], record: ["18", "10", "2024"],
      ret: ["31", "03", "2032"], basis: "doc3.basis.safety", daysTo: 64,
      trail: [
        { k: "doc3.trail.uploaded", who: "doc3.who.rajan", d: ["18", "10", "2024"] },
        { k: "doc3.trail.verified", who: "doc3.who.rajan", d: ["21", "10", "2024"] },
      ],
    },
    {
      id: "medical", nameKey: "doc3.type.medical", state: "expired",
      issued: ["1", "06", "2024"], valid: ["31", "05", "2026"], record: ["4", "06", "2024"],
      ret: ["31", "03", "2032"], basis: "doc3.basis.safety", daysAgo: 72,
      noteKey: "doc3.note.medicalWithHR",
      trail: [
        { k: "doc3.trail.uploaded", who: "doc3.who.meera", d: ["4", "06", "2024"] },
        { k: "doc3.trail.verified", who: "doc3.who.meera", d: ["6", "06", "2024"] },
        { k: "doc3.trail.lapsed", d: ["31", "05", "2026"] },
        { k: "doc3.trail.requested", who: "doc3.who.meera", d: ["6", "08", "2026"] },
        { k: "doc3.trail.responded", d: ["10", "08", "2026"] },
      ],
    },
    {
      id: "address", nameKey: "doc3.type.address", state: "missing",
      issued: null, valid: null, record: null,
      ret: ["31", "03", "2035"], basis: "doc3.basis.legal",
      noteKey: "doc3.note.addressBack",
      trail: [
        { k: "doc3.trail.requested", who: "doc3.who.meera", d: ["28", "07", "2026"] },
        { k: "doc3.trail.responded", d: ["2", "08", "2026"] },
        { k: "doc3.trail.sentBack", who: "doc3.who.meera", d: ["5", "08", "2026"] },
      ],
    },
    {
      id: "bankProof", nameKey: "doc3.type.bankProof", state: "missing",
      issued: null, valid: null, record: null,
      ret: ["31", "03", "2035"], basis: "doc3.basis.legal",
      noteKey: "doc3.note.bankAsked", requestId: "r2",
      trail: [
        { k: "doc3.trail.neverHeld" },
        { k: "doc3.trail.requested", who: "doc3.who.rajan", d: ["11", "08", "2026"] },
      ],
    },
  ];

  /* ============================================================
     HELPERS
     ============================================================ */

  /* "12 Apr 2024" — the month name is an authored per-language short
     form, never a slice of the full month word. */
  function dmy(t, d) {
    if (!d) return null;
    return d[0] + " " + t("doc3.mon." + d[1]) + " " + d[2];
  }

  /* PROMOTION CANDIDATE (local for now — kit.jsx is out of scope for
     this dispatch): a label/value definition row. Profile uses the same
     shape; two independent uses is the bar for promoting to UI3. */
  function DefRow({ label, children, last }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", padding: "10px 0", borderBottom: last ? "none" : "1px dashed " + c.border }}>
        <div style={ty("small", { color: c.inkMuted, flex: "0 0 40%", minWidth: 0 })}>{label}</div>
        <div style={{ flex: 1, minWidth: 0, textAlign: "right" }}>{children}</div>
      </div>
    );
  }

  /* PROMOTION CANDIDATE: the append-only trail. A ruled vertical list of
     "what happened, who did it, when" with no control of any kind — the
     audit surface is read-only by construction (O6). */
  function Trail({ items }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    return (
      <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {items.map((it, i) => (
          <li key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", paddingBottom: i < items.length - 1 ? 14 : 0 }}>
            <span aria-hidden="true" style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, alignSelf: "stretch" }}>
              <span style={{ width: 8, height: 8, borderRadius: G3.r.pill, background: c.accent, marginTop: 5, flexShrink: 0 }} />
              {i < items.length - 1 ? <span style={{ width: 1, flex: 1, background: c.border, marginTop: 4 }} /> : null}
            </span>
            <span style={{ minWidth: 0 }}>
              <span style={ty("small", { display: "block", color: c.ink })}>
                {t(it.k, it.who ? { who: t(it.who) } : undefined)}
              </span>
              {it.d ? <span style={G3.fig("xs", { display: "block", color: c.inkFaint, marginTop: 2 })}>{dmy(t, it.d)}</span> : null}
            </span>
          </li>
        ))}
      </ol>
    );
  }

  /* ============================================================
     1 · OPEN REQUESTS — the ONE tinted card on this screen, and the
     only place a call to action exists. It is a reply to a named
     DocumentUpdateRequest, never a free upload.
     ============================================================ */
  /* Requests is where a document request is answered; this is the
     hand-over, tab and all. */
  function goRespond(onNavigate) {
    window.NaveyaTasksTab = "documents";
    if (onNavigate) onNavigate("empTasks");
  }

  function RequestsCard({ requests, onNavigate }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    if (!requests.length) return null; /* no empty card holding space — DESIGN 1 */
    return (
      <Card fill={c.brassSoft} border={c.brassBorder}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
          <span aria-hidden="true" style={{ width: 30, height: 30, borderRadius: 10, background: c.surface, color: c.brass, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name="mail" size={15} />
          </span>
          <h2 style={ty("h3", { margin: 0, color: c.ink })}>
            {requests.length === 1 ? t("doc4.req.title1") : t("doc4.req.title", { n: requests.length })}
          </h2>
          <span style={{ flex: 1 }} />
          <span style={ty("caption", { color: c.inkMuted, display: "inline-flex", gap: 6, alignItems: "center" })}>
            <Icon name="lock" size={12} />{t("doc3.req.privacy")}
          </span>
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          {requests.map((r) => (
            <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", background: c.surface, border: "1px solid " + c.brassBorder, borderRadius: G3.r.md, padding: "10px 14px" }}>
              <span style={ty("small", { color: c.ink, fontWeight: 700, minWidth: 160 })}>{t(r.docKey)}</span>
              <span style={ty("caption", { color: c.brass, fontWeight: 700, display: "inline-flex", gap: 6, alignItems: "center" })}>
                <Icon name="attendance" size={12} />{t("doc4.req.due", { date: t(r.dueKey) })}
              </span>
              <span style={{ flex: 1, minWidth: 40 }} />
              <LinkButton onClick={() => goRespond(onNavigate)}>{t("doc3.req.view")}</LinkButton>
              {/* an employee has no documents.write: Upload does not
                  write a file here, it takes her to the one place the
                  response to HR's request is made (Requests -> Respond
                  to HR), where the flow actually works. */}
              <Button kind="primary" size="sm" iconLeft="download" onClick={() => goRespond(onNavigate)}>{t("doc4.req.upload")}</Button>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  /* ============================================================
     2 · WHAT SHE HAS SENT — submitted responses sitting with HR, and
     responses HR sent back with a reason shown verbatim (A18). There
     is no "send again" here: a rejected request re-opens only when HR
     re-raises it (M4 state machine).
     ============================================================ */
  function ResponsesCard() {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const pad = G3.layout.cardPad;
    const td = { padding: "12px 10px", verticalAlign: "top", textAlign: "left" };
    return (
      <Card pad={0}>
        <div style={{ padding: pad + "px " + pad + "px 12px" }}>
          <h3 style={ty("h2", { margin: 0, color: c.ink })}>{t("doc4.sent.title")}</h3>
        </div>
        {RESPONSES.length === 0 ? (
          <div style={{ padding: "0 " + pad + "px " + pad + "px" }}>
            <EmptyState head={t("doc3.resp.empty.head")} body={t("doc3.resp.empty.body")} compact />
          </div>
        ) : (
          <div style={{ padding: "0 " + (pad - 10) + "px 12px", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 620 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid " + c.ruleStrong }}>
                  {["doc", "sent", "state", "what"].map((k) => (
                    <th key={k} scope="col" style={ty("colLabel", { color: c.inkFaint, textTransform: "uppercase", padding: "0 10px 10px", textAlign: "left", whiteSpace: "nowrap" })}>
                      {t("doc4.sent.col." + k)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RESPONSES.map((r, i) => {
                  const st = STATE[r.state];
                  return (
                    <tr key={r.id} style={{ borderBottom: i < RESPONSES.length - 1 ? "1px solid " + c.rule : "none" }}>
                      <td style={ty("small", Object.assign({}, td, { color: c.ink, fontWeight: 700, whiteSpace: "nowrap" }))}>{t(r.docKey)}</td>
                      <td style={G3.fig("xs", Object.assign({}, td, { color: c.inkMuted, whiteSpace: "nowrap" }))}>{dmy(t, r.sent)}</td>
                      <td style={td}><StatusMark role={st.role} glyph={st.glyph} word={t(st.word)} /></td>
                      <td style={ty("small", Object.assign({}, td, { color: c.inkMuted, maxWidth: 420 }))}>
                        {r.reasonKey ? (
                          <span style={{ display: "block", color: c.ink, marginBottom: 3 }}>
                            <span style={ty("caption", { color: c.inkFaint })}>{t("doc3.resp.reasonLabel") + " "}</span>
                            {t(r.reasonKey)}
                          </span>
                        ) : null}
                        {t(r.noteKey)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    );
  }

  /* ============================================================
     3 · THE FILE — every type, held or not, with its state as mark +
     word. The row menu carries ONLY what an employee may actually do:
     open / download her own file (A20), read the history, respond to
     an open request, or message HR. No Replace, no Delete, no Upload —
     not disabled, absent.
     ============================================================ */
  function FileRegister({ selected, onSelect }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [hover, setHover] = useState(null);
    const pad = G3.layout.cardPad;

    const counts = useMemo(() => {
      const out = {};
      DOCS.forEach((d) => { out[d.state] = (out[d.state] || 0) + 1; });
      return out;
    }, []);
    const chips = ["verified", "expiring", "expired", "missing"]
      .filter((k) => counts[k])
      .map((k) => <StatusMark key={k} role={STATE[k].role} glyph={STATE[k].glyph} word={t(STATE[k].word)} count={counts[k]} />);

    const td = { padding: "12px 10px", verticalAlign: "middle", textAlign: "left" };
    return (
      <Card pad={0} style={{ flex: 1, minWidth: 0 }}>
        <div style={{ padding: pad + "px " + pad + "px 14px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h3 style={ty("h2", { margin: 0, color: c.ink })}>{t("doc3.reg.title")}</h3>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>{chips}</div>
        </div>
        <div style={{ padding: "0 " + (pad - 10) + "px 4px", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 460 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid " + c.ruleStrong }}>
                {[["doc", t("doc3.col.document")], ["state", t("doc3.col.status")], ["record", t("doc3.col.onRecord")]].map((col) => (
                  <th key={col[0]} scope="col" style={ty("colLabel", { color: c.inkFaint, textTransform: "uppercase", padding: "0 10px 10px", textAlign: "left", whiteSpace: "nowrap", width: col[0] === "record" ? 150 : undefined })}>{col[1]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DOCS.map((d, i) => {
                const st = STATE[d.state];
                const on = d.id === selected;
                return (
                  <tr key={d.id} tabIndex={0} aria-current={on ? "true" : undefined} aria-label={t("doc4.reg.aria", { doc: t(d.nameKey) })}
                    onClick={() => onSelect(d.id)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(d.id); } }}
                    onMouseEnter={() => setHover(d.id)} onMouseLeave={() => setHover(null)}
                    style={{ cursor: "pointer", borderBottom: i < DOCS.length - 1 ? "1px solid " + c.rule : "none", background: on ? c.sunken : hover === d.id ? c.raised : "transparent", outline: on ? "1.5px solid " + c.borderStrong : "none", outlineOffset: -1.5 }}>
                    <td style={ty("small", Object.assign({}, td, { color: c.ink, fontWeight: 700 }))}>{t(d.nameKey)}</td>
                    <td style={td}><StatusMark role={st.role} glyph={st.glyph} word={t(st.word)} /></td>
                    <td style={G3.fig("xs", Object.assign({}, td, { color: c.inkMuted, whiteSpace: "nowrap" }))}>{dmy(t, d.record) || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, padding: "14px " + pad + "px 18px", borderTop: "1px solid " + c.rule }}>
          <span style={ty("caption", { color: c.inkMuted, maxWidth: 620 })}>{t("doc3.reg.footNote")}</span>
          <LinkButton>{t("doc3.reg.ask")}</LinkButton>
        </div>
      </Card>
    );
  }

  /* ============================================================
     4 · DETAIL — provenance. Who put it on record, who verified it,
     when it lapsed, when HR asked again. Append-only: there is no
     control here at all except opening the file she is entitled to.
     ============================================================ */
  function FileDetail({ doc }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    if (!doc) {
      return (
        <Card icon="document" iconTone="accent" title={t("doc3.det.trail")}>
          <EmptyState head={t("doc3.det.empty.head")} body={t("doc3.det.empty.body")} compact />
        </Card>
      );
    }

    const st = STATE[doc.state];
    const held = doc.state !== "missing";

    return (
      <Card icon="document" iconTone="accent" title={t(doc.nameKey)}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
          <StatusMark role={st.role} glyph={st.glyph} word={t(st.word)} />
          {doc.daysTo != null ? (
            <span style={ty("caption", { color: c.lateText })}>
              {t("doc3.det.expiresIn")} <span style={G3.fig("xs", { fontWeight: 700 })}>{doc.daysTo}</span> {t("doc3.det.inDays")}
            </span>
          ) : null}
          {doc.daysAgo != null ? (
            <span style={ty("caption", { color: c.absentText })}>
              {t("doc3.det.expiredAgo")} <span style={G3.fig("xs", { fontWeight: 700 })}>{doc.daysAgo}</span> {t("doc3.det.agoDays")}
            </span>
          ) : null}
        </div>

        <Trail items={doc.trail} />

        <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid " + c.rule }}>
          <div style={{ display: "flex", gap: 9, alignItems: "flex-start", marginBottom: 10 }}>
            <span aria-hidden="true" style={{ display: "flex", color: c.inkFaint, marginTop: 1 }}><Icon name="lock" size={14} /></span>
            <span style={ty("caption", { color: c.inkMuted })}>
              {t("doc3.det.retention", { date: dmy(t, doc.ret) })} — {t(doc.basis)}
            </span>
          </div>
          <p style={ty("caption", { margin: 0, color: c.inkFaint })}>{t("doc3.det.appendOnly")}</p>
          {doc.restricted ? (
            <p style={ty("caption", { margin: "10px 0 0", color: c.inkMuted })}>{t("doc3.det.restricted")}</p>
          ) : null}
        </div>

        <div style={{ marginTop: 16 }}>
          {held
            ? <Button kind="secondary" size="sm" iconLeft="document">{t("doc3.menu.open")}</Button>
            : <p style={ty("caption", { margin: 0, color: c.inkFaint })}>{t("doc3.det.noFile")}</p>}
        </div>
      </Card>
    );
  }

  /* ============================================================
     PAGE
     ============================================================ */
  function Documents({ role, onNavigate }) {
    const { c } = useTheme();
    const { t, ty, lang } = useLang();
    const L = G3.layout;
    const [selected, setSelected] = useState(DOCS[0].id);
    const doc = DOCS.find((d) => d.id === selected) || null;

    return (
      <div
        className="nv3"
        style={{ display: "flex", minHeight: "100vh", background: c.page, color: c.ink, fontFamily: G3.font.ui }}
      >
        <Rail role={role || "employee"} active="documents" onNavigate={onNavigate} />

        {/* overflowX clip contains the page motif, drawn past the right
            edge on purpose; without it the document picks up a sideways
            scrollbar a full-page screenshot would never show. */}
        <main style={{ flex: 1, minWidth: 0, position: "relative", overflowX: "clip" }}>
          <Motif />
          <div style={{ position: "relative", zIndex: 1, maxWidth: L.contentMax, margin: "0 auto", padding: "22px " + L.contentPadX + "px 56px" }}>

            {/* top strip — matches Home's and My Attendance's exactly */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, marginBottom: 16 }}>
              <div style={ty("small", { color: c.inkMuted })}>
                <span style={{ color: c.ink, fontWeight: 700 }}>{t("nav.documents")}</span>
                <span style={{ margin: "0 8px", color: c.inkFaint }}>·</span>
                <span>{t("home.school")}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <ThemeToggle />
              </div>
            </div>

            {/* page header — the governance rule stated once, plainly */}
            <div style={{ marginBottom: 20 }}>
              <h1 style={ty("display", { margin: 0, color: c.ink })}>{t("doc3.pageTitle")}</h1>
            </div>

            {/* what needs her — full width, because it is the only
                thing on this screen that asks for an action */}
            <RequestsCard requests={OPEN_REQUESTS} onNavigate={onNavigate} />

            {/* her file, with the history of the row she picked beside it */}
            <div style={{ display: "flex", gap: L.gap, alignItems: "flex-start", marginTop: L.gap }}>
              <FileRegister selected={selected} onSelect={setSelected} />
              <div style={{ flex: "0 0 " + L.colNarrow + "px", minWidth: 0 }}>
                <FileDetail doc={doc} />
              </div>
            </div>

            {/* what she has sent sits UNDER the file and its detail: it is
                a different ledger — her responses and their approval — not
                part of the school's file */}
            <div style={{ marginTop: L.gap }}>
              <ResponsesCard />
            </div>
          </div>
        </main>
      </div>
    );
  }

  window.Pages3 = window.Pages3 || {};
  window.Pages3.Documents = Documents;
})();
