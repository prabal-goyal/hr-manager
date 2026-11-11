/* @jsxRuntime classic */
/* ============================================================
   Naveya — Public & token surfaces · window.Pages3.Public

   PUB-01 Careers listing, PUB-03 Pre-boarding document upload,
   PUB-04 Offer acceptance (docs/screen-inventory.md §2). The one fact
   that shapes every decision below: THESE ARE THE ONLY SCREENS IN THE
   PRODUCT WITH NO AUTHENTICATED USER. PUB-01 is anonymous; PUB-03/04
   are held by a bearer token belonging to someone who is not yet an
   employee (`§6.2 User.employee_id` nullable — a joiner has no `User`
   row at all). A token can be forwarded to the wrong person, so this
   file is written so there is nothing on PUB-03/04 worth stealing
   beyond what the holder already knows or typed themselves.

   Three screens, one file, NO Rail — a rail is role-scoped nav and
   none of these visitors have a role. Instead: a plain public header
   (school branding, must-contain per PUB-01) and, at the very bottom
   of the canvas, a small floating control that flips between the
   three entry points. That control is `role="group"`, not a tablist —
   these are three unrelated real-world URLs (a careers page, a mailed
   upload link, a mailed offer link), never tabs of one session, so
   giving them an ARIA tablist would misrepresent the product. Per-
   screen STATE PREVIEWS (loading/empty/error, or the six PUB-03 token
   states) use the `Segmented` idiom `groupadmin.jsx`/`principal.jsx`
   already established for exactly this job — also `role="group"`.
   Net effect: this file renders zero `role="tablist"` elements, so
   AC8's "one tabpanel per tablist" holds vacuously and on purpose.

   Judgement calls (flagged here, not silently made):
   · PUB-03 shows NO name, staff ID, campus or role — even though
     "must NOT contain" only says "any view of the staff record", the
     brief's own framing ("worth nothing to a stranger who opens it")
     reads as the stronger bar, and campus/role are inheritable
     context the page does not need to state its business.
   · PUB-04 DOES show the candidate's name and the role/campus/CTC it
     is offering — screen-inventory's "must contain" requires exactly
     these fields, and an offer letter that hides who it is for is not
     more secure, just worse UX; PUB-04 carries no equivalent "data-
     free" rule to PUB-03's.
   · "Request more time" is built and visibly tagged `[proposed]` in
     copy (AC6) — `§6.4 DocumentUpdateRequest.due_date` exists, no
     extension workflow is specified.
   · PUB-04 accept is two steps on one screen (state, then a same-page
     confirm panel restating role/campus/CTC/join date) — never one
     click, per AC7. The confirm button is never hard-disabled; an
     empty signature is refused with the reason on click (the
     `disabled-submit-click-deadend` lesson — hiding the button behind
     a disabled state swallows the click that would show the error).
   · Local primitives below (`Segmented`, `RefusedAction`, `DefRow`,
     `FilterField`) are verbatim re-implementations of patterns already
     proven in `groupadmin.jsx`/`hr-hiring.jsx`/`accountant.jsx`/
     `documents.jsx` — three-plus independent uses now; strong kit.jsx
     promotion candidates, named again at file end. kit.jsx is out of
     scope for this dispatch.

   Ownership: this file only. `kit.jsx`, `tokens.jsx`, `screens.jsx`,
   `v3.html` and every sibling `pages/*.jsx` are untouched — the
   harness wiring (a `public` route + `<script>` tag) happens after
   this file lands.

   Export contract: `window.Pages3.Public({ view })`, `view` one of
   `"careers" | "preboarding" | "offer"`, default `"careers"`. No
   `role`/`onNavigate` props — there is no rail to navigate from.

   Demo clock: Tuesday 11 August 2026, the same anchor as every other
   v3 page. Campuses (Indiranagar, Whitefield), staff categories
   (teaching/non_teaching/support/guest) and departments are read
   verbatim from `hr.jsx`/`hr-hiring.jsx`, not re-invented.
   ============================================================ */
(function () {
  const G3 = window.G3;
  const UI = window.UI3;
  const { useState, useEffect, useMemo } = React;
  const {
    useTheme, ThemeToggle, useLang, addStrings,
    Card, CardHeader, Register, Button, LinkButton, Field, Input, Select,
    Chip, StatusMark, Icon, EmptyState, ErrorState, WelcomeBand, BoatMark,
    Figure, inr, num,
  } = UI;

  /* ============================================================
     STRINGS — pub.* is this file's whole namespace. EN/HI carry
     exactly the same key set (checked by hand at every addition);
     every demo value — postings, reasons, dates — is authored in
     both languages, not left English.
     ============================================================ */
  addStrings({
    en: {
      /* --- shared chrome --- */
      "pub.hdr.school": "Sunrise Public School",
      "pub.hdr.poweredBy": "Powered by Naveya",
      "pub.switch.aria": "Preview a public screen — canvas only, not part of the product",
      "pub.switch.careers": "Careers (PUB-01)",
      "pub.switch.preboarding": "Pre-boarding upload (PUB-03)",
      "pub.switch.offer": "Offer acceptance (PUB-04)",

      "pub.mon.01": "Jan", "pub.mon.02": "Feb", "pub.mon.03": "Mar",
      "pub.mon.04": "Apr", "pub.mon.05": "May", "pub.mon.06": "Jun",
      "pub.mon.07": "Jul", "pub.mon.08": "Aug", "pub.mon.09": "Sep",
      "pub.mon.10": "Oct", "pub.mon.11": "Nov", "pub.mon.12": "Dec",

      "pub.campus.indiranagar": "Indiranagar",
      "pub.campus.whitefield": "Whitefield",
      "pub.cat.teaching": "Teaching",
      "pub.cat.non_teaching": "Non-teaching",
      "pub.cat.support": "Support",
      "pub.cat.guest": "Guest faculty",

      /* ============ PUB-01 · Careers ============ */
      "pub.car.kicker": "Careers",
      "pub.car.title": "Join Sunrise Public School",
      "pub.car.meta": "No account and no fee to apply. Listings are updated as roles open or close.",
      "pub.car.figureLabel": "Open positions",
      "pub.car.figureNote": "across 2 campuses",

      "pub.car.scenario.aria": "Preview a different careers-page state",
      "pub.car.scenario.live": "Listings",
      "pub.car.scenario.loading": "Loading",
      "pub.car.scenario.empty": "No openings",
      "pub.car.scenario.error": "Error",

      "pub.car.filter.campus": "Campus",
      "pub.car.filter.campusAll": "All campuses",
      "pub.car.filter.cat": "Staff category",
      "pub.car.filter.catAll": "All categories",
      "pub.car.filter.dept": "Department",
      "pub.car.filter.deptAll": "All departments",
      "pub.car.filter.posted": "Posted within",
      "pub.car.filter.postedAny": "Any time",
      "pub.car.filter.posted7": "Last 7 days",
      "pub.car.filter.posted30": "Last 30 days",
      "pub.car.filter.posted90": "Last 90 days",

      "pub.car.col.role": "Role",
      "pub.car.col.campus": "Campus",
      "pub.car.col.cat": "Category",
      "pub.car.col.status": "Status",
      "pub.car.col.closes": "Closing date",

      "pub.car.st.open": "Open",
      "pub.car.st.closed": "Closed",
      "pub.car.postedOn": "Posted {date}",
      "pub.car.view": "View",
      "pub.car.noResults.head": "Nothing matches these filters",
      "pub.car.noResults.body": "Try a wider campus, category or department, or clear the filters below.",
      "pub.car.noResults.clear": "Clear filters",

      "pub.car.empty.head": "No openings right now",
      "pub.car.empty.body": "Sunrise Public School has no open positions at the moment — please check back later.",
      "pub.car.error.head": "Could not load open positions",
      "pub.car.error.body": "Something went wrong loading the careers page. Please try again in a moment.",
      "pub.car.error.retry": "Try again",

      "pub.car.det.back": "Back to all openings",
      "pub.car.det.deptLabel": "Department",
      "pub.car.det.catLabel": "Staff category",
      "pub.car.det.campusLabel": "Campus",
      "pub.car.det.closesLabel": "Closing date",
      "pub.car.det.closesOpen": "Applications close {date}",
      "pub.car.det.closesShut": "Applications closed on {date}",
      "pub.car.det.descTitle": "About this role",
      "pub.car.det.apply": "Apply for this role",
      "pub.car.det.applyClosedReason": "Applications closed on {date}.",
      "pub.car.det.applyMidCloseReason": "This posting stopped accepting applications while you were reading it — the school has closed the underlying requisition.",
      "pub.car.det.share": "Copy link to this posting",
      "pub.car.det.shareCopied": "Link copied — anyone with it can view this posting.",
      "pub.car.toast.apply": "This opens the job application form (PUB-02) — a separate step outside this page.",

      "pub.car.p1.title": "TGT Mathematics, Grades 6–8",
      "pub.car.p1.desc": "Teaches core mathematics across the middle-school grades, with regular assessment and parent communication as part of the role.",
      "pub.car.p2.title": "NTT, Pre-primary",
      "pub.car.p2.desc": "Leads a pre-primary classroom using a play-based, activity-led approach; prior nursery-teacher training is expected.",
      "pub.car.p3.title": "Librarian",
      "pub.car.p3.desc": "Runs the campus library — cataloguing, reading programmes for every grade, and support for project research.",
      "pub.car.p4.title": "Bus driver, Route 7",
      "pub.car.p4.desc": "Drives a fixed school-bus route with a defined morning and afternoon schedule; a valid heavy-vehicle licence is required.",
      "pub.car.p5.title": "PGT Chemistry, Grades 11–12",
      "pub.car.p5.desc": "Teaches senior-secondary chemistry, including practical laboratory sessions and board-exam preparation.",
      "pub.car.p6.title": "Guest music teacher, Grades 1–5",
      "pub.car.p6.desc": "Takes weekly music sessions for the primary grades on a guest-faculty basis, a few periods a week.",

      /* ============ PUB-03 · Pre-boarding upload ============ */
      "pub.pre.kicker": "Before you join",
      "pub.pre.title": "A few documents before you join",
      "pub.pre.intro": "The HR office needs these before your start date. HR checks everything before it goes on your file.",
      "pub.pre.privacy": "What you send goes only to the HR office, and is kept as long as the law requires.",

      "pub.pre.scenario.aria": "Preview a different link state",
      "pub.pre.scenario.valid": "Valid — nothing sent yet",
      "pub.pre.scenario.partial": "Valid — partly sent",
      "pub.pre.scenario.submitted": "Already submitted",
      "pub.pre.scenario.error": "An upload failed",
      "pub.pre.scenario.expired": "Expired",
      "pub.pre.scenario.revoked": "Revoked",

      "pub.pre.expired.head": "This link has expired",
      "pub.pre.expired.body": "Ask the school's HR office for a new link.",
      "pub.pre.revoked.head": "This link is no longer active",
      "pub.pre.revoked.body": "If you believe this is a mistake, contact the school's HR office directly.",

      "pub.pre.done.head": "Thank you — HR has what you sent",
      "pub.pre.done.body": "You submitted everything asked for on {date}. The school's HR office will get in touch if anything else is needed.",
      "pub.pre.done.sentOn": "Sent {date}",

      "pub.pre.due": "Respond by {date}",
      "pub.pre.overdue": "This was due on {date}",
      "pub.pre.st.pending": "Not sent yet",
      "pub.pre.st.attached": "Ready to send",
      "pub.pre.st.submitted": "Sent to HR",
      "pub.pre.st.error": "Couldn't send",
      "pub.pre.sentOn": "Sent {date}",
      "pub.pre.err.size": "This file is too large. The largest file accepted is 10 MB.",
      "pub.pre.err.type": "This file type isn't accepted — please send a PDF, JPG or PNG.",

      "pub.pre.choose": "Choose a file",
      "pub.pre.chosen": "Attached: {file}",
      "pub.pre.replace": "Replace",
      "pub.pre.issuedOn": "Issued on (optional)",
      "pub.pre.expiresOn": "Valid until (optional)",
      "pub.pre.datePh": "DD/MM/YYYY",

      "pub.pre.submitAll": "Send everything to HR",
      "pub.pre.submitAllReason": "Attach at least one document before sending.",
      "pub.pre.submitAllDone": "Sent — the school's HR office has been notified.",

      "pub.pre.requestMore": "Ask for more time [proposed]",
      "pub.pre.requestMore.note": "This is a proposed action — the specification names a due date but does not yet define an extension workflow (§6.4).",
      "pub.pre.requestMore.label": "Tell HR why you need more time",
      "pub.pre.requestMore.ph": "e.g. My previous employer is still preparing this certificate",
      "pub.pre.requestMore.send": "Send to HR",
      "pub.pre.requestMore.cancel": "Never mind",
      "pub.pre.requestMore.sent": "HR has been asked for more time on this one.",

      "pub.pre.footNote": "HR asks for a document when the school needs one — there is nothing here to add that was not requested.",

      "pub.doc.pan": "PAN card",
      "pub.doc.aadhaar": "Aadhaar",
      "pub.doc.degree": "Latest degree certificate",
      "pub.doc.police": "Police verification certificate",

      /* ============ PUB-04 · Offer acceptance ============ */
      "pub.off.kicker": "Your offer",
      "pub.off.title": "Your offer from Sunrise Public School",
      "pub.off.greeting": "Dear {name},",
      "pub.off.intro": "Here are the terms of the role we've offered you. Nothing here is final until you accept it below.",

      "pub.off.scenario.aria": "Preview a different offer state",
      "pub.off.scenario.sent": "Sent, awaiting you",
      "pub.off.scenario.accepted": "Accepted",
      "pub.off.scenario.declined": "Declined",
      "pub.off.scenario.expired": "Expired",
      "pub.off.scenario.superseded": "Superseded",

      "pub.off.det.role": "Role",
      "pub.off.det.campus": "Campus",
      "pub.off.det.ctc": "CTC (per year)",
      "pub.off.det.join": "Joining date",
      "pub.off.det.expiry": "Respond by",
      "pub.off.ctcNote": "This is the total annual CTC. The detailed salary structure is shared once you join — it is not part of this page.",

      "pub.off.accept": "Accept this offer",
      "pub.off.decline": "Decline",
      "pub.off.download": "Download the offer letter",
      "pub.off.downloadToast": "This would download the offer letter as a PDF.",
      "pub.off.letterMissing": "The offer letter isn't available yet. Contact the school's HR office.",
      "pub.off.ask": "Ask a question [proposed]",
      "pub.off.ask.label": "Your question for the recruiter",
      "pub.off.ask.ph": "Type your question here",
      "pub.off.ask.send": "Send",
      "pub.off.ask.cancel": "Never mind",
      "pub.off.ask.sent": "Your question has been sent to the recruiter.",

      "pub.off.expiredReason": "This offer expired on {date}. Contact the school's HR office if you'd still like to join.",
      "pub.off.supersededReason": "This offer was replaced by a revised one sent on {date}. Contact HR if you have questions.",
      "pub.off.declinedReason": "You declined this offer on {date}. A new offer would need to be issued.",
      "pub.off.acceptedReason": "You already accepted this offer — see the receipt below.",
      "pub.off.raceToast": "This offer expired just now, on {date}. Contact HR if you'd still like to join.",

      "pub.off.confirm.title": "Confirm your acceptance",
      "pub.off.confirm.body": "You agree to join as {role} at {campus} on {join}, at a CTC of {ctc} a year. This creates your employee record.",
      "pub.off.confirm.sign": "Type your full name to sign [proposed]",
      "pub.off.confirm.signPh": "Your full name",
      "pub.off.confirm.signErr": "Type your name to confirm.",
      "pub.off.confirm.cancel": "Not yet",
      "pub.off.confirm.submit": "Confirm acceptance",

      "pub.off.accepted.head": "You accepted this offer",
      "pub.off.accepted.body": "Accepted on {date}, signed {name}. The school's HR office has been notified and will be in touch about your onboarding.",
      "pub.off.accepted.ref": "Reference {ref}",

      "pub.off.decline.title": "Decline this offer?",
      "pub.off.decline.reasonLabel": "Reason",
      "pub.off.decline.reasonPh": "Choose a reason",
      "pub.off.decline.reason.otherOffer": "Accepted another offer",
      "pub.off.decline.reason.compensation": "Compensation",
      "pub.off.decline.reason.location": "Location",
      "pub.off.decline.reason.personal": "Personal",
      "pub.off.decline.reason.other": "Other",
      "pub.off.decline.noteLabel": "Anything you'd like to add (optional)",
      "pub.off.decline.notePh": "Optional — a line for the recruiter",
      "pub.off.decline.reasonErr": "Choose a reason before declining.",
      "pub.off.decline.cancel": "Never mind",
      "pub.off.decline.submit": "Confirm decline",

      "pub.off.declined.head": "You declined this offer",
      "pub.off.declined.body": "Declined on {date}. Reason: {reason}.",

      "pub.off.candidate": "Kavya Bhat",
      "pub.off.role": "PGT Mathematics, Grades 9–10",
    },

  });

  /* ============================================================
     DEMO DATA — synthetic throughout. TODAY anchors 11 Aug 2026,
     the same clock every v3 page uses.
     ============================================================ */
  const TODAY = ["11", "08", "2026"];

  const CAMPUSES = [
    { id: "indiranagar", labelKey: "pub.campus.indiranagar" },
    { id: "whitefield", labelKey: "pub.campus.whitefield" },
  ];
  const CATEGORIES = [
    { id: "teaching", labelKey: "pub.cat.teaching" },
    { id: "non_teaching", labelKey: "pub.cat.non_teaching" },
    { id: "support", labelKey: "pub.cat.support" },
    { id: "guest", labelKey: "pub.cat.guest" },
  ];

  /* PUB-01 postings — title/campus/category/closing date only (the
     Requisition behind each — headcount, budget_ctc, justification,
     approval chain — is deliberately not modelled here at all; there
     is nothing to accidentally leak because it was never fetched). */
  const POSTINGS = [
    { id: "p1", titleKey: "pub.car.p1.title", descKey: "pub.car.p1.desc", campus: "indiranagar", cat: "teaching", dept: "Mathematics", postedOn: ["20", "07", "2026"], closesOn: ["30", "08", "2026"] },
    { id: "p2", titleKey: "pub.car.p2.title", descKey: "pub.car.p2.desc", campus: "whitefield", cat: "teaching", dept: "Pre-primary", postedOn: ["25", "07", "2026"], closesOn: ["25", "08", "2026"] },
    { id: "p3", titleKey: "pub.car.p3.title", descKey: "pub.car.p3.desc", campus: "indiranagar", cat: "non_teaching", dept: "Administration", postedOn: ["1", "08", "2026"], closesOn: ["20", "08", "2026"] },
    { id: "p4", titleKey: "pub.car.p4.title", descKey: "pub.car.p4.desc", campus: "whitefield", cat: "support", dept: "Transport", postedOn: ["10", "07", "2026"], closesOn: ["5", "08", "2026"] },
    { id: "p5", titleKey: "pub.car.p5.title", descKey: "pub.car.p5.desc", campus: "whitefield", cat: "teaching", dept: "Science", postedOn: ["28", "07", "2026"], closesOn: ["15", "09", "2026"] },
    { id: "p6", titleKey: "pub.car.p6.title", descKey: "pub.car.p6.desc", campus: "indiranagar", cat: "guest", dept: "Arts", postedOn: ["5", "08", "2026"], closesOn: ["18", "08", "2026"] },
  ];

  /* PUB-03 — six token-state scenarios. `items` is null for the two
     dead-token states (expired/revoked): once the token itself is
     invalid nothing about the request is rendered either. */
  const PRE_DOC_TYPES = { pan: "pub.doc.pan", aadhaar: "pub.doc.aadhaar", degree: "pub.doc.degree", police: "pub.doc.police" };
  const PRE_ITEMS_BASE = [
    { id: "d1", type: "pan", due: ["20", "08", "2026"], hasExpiry: false },
    { id: "d2", type: "aadhaar", due: ["20", "08", "2026"], hasExpiry: false },
    { id: "d3", type: "degree", due: ["15", "08", "2026"], hasExpiry: false },
    { id: "d4", type: "police", due: ["5", "08", "2026"], hasExpiry: true },
  ];
  function preItems(overrides) {
    return PRE_ITEMS_BASE.map((it) => Object.assign({ state: "pending", file: null, error: null }, it, overrides[it.id] || {}));
  }
  const PRE_SCENARIOS = {
    valid: { tokenState: "valid", items: preItems({}) },
    partial: {
      tokenState: "valid",
      items: preItems({
        d1: { state: "submitted", sentOn: ["9", "08", "2026"] },
        d2: { state: "submitted", sentOn: ["9", "08", "2026"] },
        d3: { state: "attached", file: "degree-certificate.pdf" },
      }),
    },
    submitted: {
      tokenState: "valid",
      allSubmitted: true,
      submittedOn: ["10", "08", "2026"],
      items: preItems({
        d1: { state: "submitted", sentOn: ["9", "08", "2026"] },
        d2: { state: "submitted", sentOn: ["9", "08", "2026"] },
        d3: { state: "submitted", sentOn: ["10", "08", "2026"] },
        d4: { state: "submitted", sentOn: ["10", "08", "2026"] },
      }),
    },
    error: {
      tokenState: "valid",
      items: preItems({ d2: { state: "error", error: "pub.pre.err.size" } }),
    },
    expired: { tokenState: "expired", items: null },
    revoked: { tokenState: "revoked", items: null },
  };

  /* PUB-04 — five offer-state scenarios, one Offer entity each
     (`§6.5 Offer`: ctc, pay_group_id, join_date, status, letter_ref,
     accepted_at). No candidate name is invented per scenario beyond
     the one holder of this token. */
  const OFFER_BASE = {
    name: "pub.off.candidate", role: "pub.off.role", campus: "whitefield",
    ctc: 480000, join: ["1", "09", "2026"], letterAvailable: true,
  };
  const OFFERS = {
    sent: Object.assign({}, OFFER_BASE, { status: "sent", sentOn: ["7", "08", "2026"], expiryOn: ["18", "08", "2026"] }),
    accepted: Object.assign({}, OFFER_BASE, { status: "accepted", sentOn: ["4", "08", "2026"], expiryOn: ["11", "08", "2026"], acceptedOn: ["9", "08", "2026"], acceptedName: "Kavya Bhat", ref: "OFR-2026-0118" }),
    declined: Object.assign({}, OFFER_BASE, { status: "declined", sentOn: ["1", "08", "2026"], expiryOn: ["8", "08", "2026"], declinedOn: ["8", "08", "2026"], declineReasonKey: "pub.off.decline.reason.personal" }),
    expired: Object.assign({}, OFFER_BASE, { status: "expired", sentOn: ["20", "07", "2026"], expiryOn: ["27", "07", "2026"] }),
    superseded: Object.assign({}, OFFER_BASE, { status: "superseded", sentOn: ["1", "08", "2026"], expiryOn: ["8", "08", "2026"], supersededOn: ["9", "08", "2026"] }),
  };

  /* ============================================================
     HELPERS
     ============================================================ */
  function dmy(t, d) { if (!d) return null; return d[0] + " " + t("pub.mon." + d[1]) + " " + d[2]; }
  function toDate(d) { return new Date(Number(d[2]), Number(d[1]) - 1, Number(d[0])); }
  const TODAY_DATE = toDate(TODAY);
  function daysAgo(d) { return Math.round((TODAY_DATE - toDate(d)) / 86400000); }
  function isOpen(closesOn) { return toDate(closesOn) >= TODAY_DATE; }
  function isPastDue(d) { return toDate(d) < TODAY_DATE; }

  /* ---- local primitives — established elsewhere, redefined here
     because kit.jsx is out of scope for this dispatch. Every one is
     a verbatim re-implementation, named as a promotion candidate at
     file end (this is now its 3rd-4th independent use). ---- */

  /* groupadmin.jsx / principal.jsx's own scenario-preview control —
     `role="group"`, never a tablist: it swaps DATA, not screens. */
  function Segmented({ options, value, onChange, ariaLabel }) {
    const { c, shadow } = useTheme();
    const { ty } = useLang();
    return (
      <div
        role="group" aria-label={ariaLabel}
        style={{ display: "inline-flex", padding: 3, borderRadius: G3.r.pill, border: "1px solid " + c.border, background: c.surface, boxShadow: shadow(1), flexWrap: "wrap" }}
      >
        {options.map((o) => {
          const on = o.key === value;
          return (
            <button
              key={o.key} type="button" aria-pressed={on} onClick={() => onChange(o.key)}
              style={ty("small", { border: "none", borderRadius: G3.r.pill, padding: "6px 13px", background: on ? c.accent : "transparent", color: on ? c.onAccent : c.inkMuted, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" })}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    );
  }

  /* accountant.jsx / hr-hiring.jsx's idiom: a control that exists but
     is refused, with the reason in words beside it — never a bare
     disabled button with no explanation (ui-compliance-requirements
     §0, row 2: "visible, disabled, with the reason in words"). */
  function RefusedAction({ label, reason, icon, kind }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
        <Button kind={kind || "primary"} disabled iconLeft={icon}>{label}</Button>
        <p style={ty("caption", { color: c.inkMuted, margin: 0, flex: 1, minWidth: 220, maxWidth: 420, display: "flex", gap: 8, alignItems: "flex-start" })}>
          <span aria-hidden="true" style={{ color: c.brass, display: "flex", flexShrink: 0, marginTop: 1 }}><Icon name="alert" size={14} /></span>
          <span>{reason}</span>
        </p>
      </div>
    );
  }

  /* documents.jsx / hr-hiring.jsx's label/value row. */
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

  /* hr-hiring.jsx's filter-field wrapper (label above a Select). */
  function FilterField({ label, children }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 150, flex: "1 1 150px" }}>
        <span style={ty("caption", { color: c.inkMuted })}>{label}</span>
        {children}
      </div>
    );
  }

  /* kit.jsx has no Textarea; a minimal one styled to match Input. */
  function Textarea({ id, value, onChange, placeholder, rows }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <textarea
        id={id} name={id} value={value} placeholder={placeholder} rows={rows || 3}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        style={ty("body", { width: "100%", border: "1px solid " + c.borderStrong, borderRadius: G3.r.md, background: c.surface, color: c.ink, padding: "11px 14px", resize: "vertical", fontFamily: "inherit" })}
      />
    );
  }

  /* a plain inline confirmation banner (toast), matching hr-hiring.jsx's
     own local convention exactly — no portal, no auto-dismiss timer. */
  function Toast({ text }) {
    const { c } = useTheme();
    const { ty } = useLang();
    if (!text) return null;
    return (
      <div style={{ background: c.presentTint, color: c.presentText, borderRadius: G3.r.md, padding: "10px 14px", marginBottom: 16 }}>
        <span style={ty("small", { fontWeight: 600 })}>{text}</span>
      </div>
    );
  }

  const CONTENT_WIDE = 1000;
  const CONTENT_NARROW = 680;

  /* ============================================================
     SHELL — no Rail (no role, no user). A plain public header
     carries the SCHOOL's own branding (screen-inventory PUB-01
     "must contain: school branding") front and centre; Naveya, the
     platform, is a quiet byline underneath — the visitor is here for
     the school, not the vendor behind it.

     Non-happy path (PUB-01): a tenant on a custom domain vs. a
     Naveya subdomain must resolve this branding without a tenant
     query parameter (`§7 Tenancy`) — that is a routing/DNS concern
     for whoever mounts this component in production, not something
     this static file can exercise; noted here rather than silently
     assumed away.
     ============================================================ */
  function PublicHeader() {
    const { c } = useTheme();
    const { t, ty } = useLang();
    return (
      <header style={{ borderBottom: "1px solid " + c.border, background: c.surface }}>
        <div style={{ maxWidth: CONTENT_WIDE, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span aria-hidden="true" style={{ width: 38, height: 38, borderRadius: G3.r.md, background: c.accent, color: c.onAccent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <BoatMark size={22} />
            </span>
            <div>
              <div style={ty("h3", { color: c.ink, margin: 0 })}>{t("pub.hdr.school")}</div>
              <div style={ty("caption", { color: c.inkFaint, margin: 0 })}>{t("pub.hdr.poweredBy")}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <ThemeToggle />
          </div>
        </div>
      </header>
    );
  }

  /* Canvas-only preview control — deliberately `role="group"`, fixed
     off the page content, so it reads as harness chrome and not as
     three tabs of one visitor session (see file header). BATMAN may
     replace this entirely once real routing exists for the three
     public URLs. */
  function ScreenSwitch({ screen, onChange }) {
    const { c, shadow } = useTheme();
    const { t } = useLang();
    const options = [
      { key: "careers", label: t("pub.switch.careers") },
      { key: "preboarding", label: t("pub.switch.preboarding") },
      { key: "offer", label: t("pub.switch.offer") },
    ];
    return (
      <div
        role="group" aria-label={t("pub.switch.aria")}
        style={{ position: "fixed", left: 14, bottom: 14, zIndex: 9000, display: "inline-flex", gap: 4, background: c.surface, border: "1px solid " + c.border, borderRadius: G3.r.pill, padding: 4, boxShadow: shadow(3) }}
      >
        {options.map((o) => {
          const on = o.key === screen;
          return (
            <button
              key={o.key} type="button" aria-pressed={on} onClick={() => onChange(o.key)}
              style={{ border: 0, cursor: "pointer", borderRadius: G3.r.pill, padding: "6px 12px", background: on ? c.accent : "transparent", color: on ? c.onAccent : c.inkMuted, fontFamily: G3.font.ui, fontSize: 11.5, fontWeight: on ? 700 : 600 }}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    );
  }

  /* ============================================================
     PUB-01 · CAREERS LISTING
     ============================================================ */
  function CareersScreen() {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [scenario, setScenario] = useState("live");
    const [campus, setCampus] = useState("all");
    const [cat, setCat] = useState("all");
    const [dept, setDept] = useState("all");
    const [posted, setPosted] = useState("any");
    const [selectedId, setSelectedId] = useState(null);
    const [toast, setToast] = useState(null);

    const DEPARTMENTS = useMemo(() => {
      const set = [];
      POSTINGS.forEach((p) => { if (set.indexOf(p.dept) === -1) set.push(p.dept); });
      return set;
    }, []);

    const filtered = useMemo(() => {
      return POSTINGS.filter((p) => {
        if (campus !== "all" && p.campus !== campus) return false;
        if (cat !== "all" && p.cat !== cat) return false;
        if (dept !== "all" && p.dept !== dept) return false;
        if (posted !== "any") {
          const limit = posted === "7" ? 7 : posted === "30" ? 30 : 90;
          if (daysAgo(p.postedOn) > limit) return false;
        }
        return true;
      }).sort((a, b) => {
        const aOpen = isOpen(a.closesOn), bOpen = isOpen(b.closesOn);
        if (aOpen !== bOpen) return aOpen ? -1 : 1;
        return toDate(a.closesOn) - toDate(b.closesOn);
      });
    }, [campus, cat, dept, posted]);

    const selected = POSTINGS.find((p) => p.id === selectedId) || null;
    const openCount = POSTINGS.filter((p) => isOpen(p.closesOn)).length;

    const scenarioOptions = [
      { key: "live", label: t("pub.car.scenario.live") },
      { key: "loading", label: t("pub.car.scenario.loading") },
      { key: "empty", label: t("pub.car.scenario.empty") },
      { key: "error", label: t("pub.car.scenario.error") },
    ];

    function clearFilters() { setCampus("all"); setCat("all"); setDept("all"); setPosted("any"); }

    function PostingDetail({ posting }) {
      const open = isOpen(posting.closesOn);
      /* one posting (p4) is pinned closed for the demo — a stand-in
         for "the requisition behind it closed while you were
         reading". The distinction only changes the copy, never the
         HTTP status: both render this same readable page. */
      const midClose = posting.id === "p4";
      return (
        <Card
          icon="briefcase" iconTone="accent"
          title={t(posting.titleKey)}
          sub={t("pub.car.det.campusLabel") + " · " + t("pub.campus." + posting.campus) + " · " + t("pub.cat." + posting.cat)}
          action={<LinkButton onClick={() => setSelectedId(null)}>{t("pub.car.det.back")}</LinkButton>}
        >
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            <StatusMark role={open ? "present" : "off"} word={t(open ? "pub.car.st.open" : "pub.car.st.closed")} glyph={open ? "check" : "arrow"} />
            <Chip bg={c.sunken} fg={c.inkMuted}>{t("pub.car.det.deptLabel") + ": " + posting.dept}</Chip>
          </div>

          <p style={ty("body", { color: open ? c.ink : c.inkMuted, margin: "0 0 16px" })}>
            {t(open ? "pub.car.det.closesOpen" : "pub.car.det.closesShut", { date: dmy(t, posting.closesOn) })}
          </p>

          <h3 style={ty("h3", { color: c.ink, margin: "0 0 8px" })}>{t("pub.car.det.descTitle")}</h3>
          <p style={ty("body", { color: c.inkMuted, margin: "0 0 20px", maxWidth: 640 })}>{t(posting.descKey)}</p>

          {open ? (
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
              <Button kind="primary" iconLeft="arrow" onClick={() => setToast(t("pub.car.toast.apply"))}>{t("pub.car.det.apply")}</Button>
              <LinkButton onClick={() => setToast(t("pub.car.det.shareCopied"))}>{t("pub.car.det.share")}</LinkButton>
            </div>
          ) : (
            <RefusedAction
              label={t("pub.car.det.apply")}
              reason={t(midClose ? "pub.car.det.applyMidCloseReason" : "pub.car.det.applyClosedReason", { date: dmy(t, posting.closesOn) })}
              icon="arrow"
            />
          )}
        </Card>
      );
    }

    return (
      <div>
        <WelcomeBand
          kicker={t("pub.car.kicker")} title={t("pub.car.title")} meta={t("pub.car.meta")}
          figureLabel={t("pub.car.figureLabel")} figureValue={num(openCount)} figureNote={t("pub.car.figureNote")}
        />

        <div style={{ display: "flex", justifyContent: "flex-end", margin: "16px 0" }}>
          <Segmented ariaLabel={t("pub.car.scenario.aria")} options={scenarioOptions} value={scenario} onChange={(v) => { setScenario(v); setSelectedId(null); }} />
        </div>

        <Toast text={toast} />

        {scenario === "loading" ? (
          <Card><div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ height: 14, width: "60%", background: c.sunken, borderRadius: G3.r.xs }} />
            <div style={{ height: 44, background: c.sunken, borderRadius: G3.r.md }} />
            <div style={{ height: 44, background: c.sunken, borderRadius: G3.r.md }} />
            <div style={{ height: 44, background: c.sunken, borderRadius: G3.r.md }} />
          </div></Card>
        ) : scenario === "error" ? (
          <Card><ErrorState head={t("pub.car.error.head")} body={t("pub.car.error.body")} action={<Button kind="secondary" onClick={() => setScenario("live")}>{t("pub.car.error.retry")}</Button>} /></Card>
        ) : scenario === "empty" ? (
          <Card><EmptyState head={t("pub.car.empty.head")} body={t("pub.car.empty.body")} /></Card>
        ) : selected ? (
          <PostingDetail posting={selected} />
        ) : (
          <React.Fragment>
            <Card style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                <FilterField label={t("pub.car.filter.campus")}>
                  <Select id="pub-car-campus" value={campus} onChange={setCampus} options={[{ value: "all", label: t("pub.car.filter.campusAll") }].concat(CAMPUSES.map((cm) => ({ value: cm.id, label: t(cm.labelKey) })))} />
                </FilterField>
                <FilterField label={t("pub.car.filter.cat")}>
                  <Select id="pub-car-cat" value={cat} onChange={setCat} options={[{ value: "all", label: t("pub.car.filter.catAll") }].concat(CATEGORIES.map((k) => ({ value: k.id, label: t(k.labelKey) })))} />
                </FilterField>
                <FilterField label={t("pub.car.filter.dept")}>
                  <Select id="pub-car-dept" value={dept} onChange={setDept} options={[{ value: "all", label: t("pub.car.filter.deptAll") }].concat(DEPARTMENTS.map((d) => ({ value: d, label: d })))} />
                </FilterField>
                <FilterField label={t("pub.car.filter.posted")}>
                  <Select id="pub-car-posted" value={posted} onChange={setPosted} options={[
                    { value: "any", label: t("pub.car.filter.postedAny") },
                    { value: "7", label: t("pub.car.filter.posted7") },
                    { value: "30", label: t("pub.car.filter.posted30") },
                    { value: "90", label: t("pub.car.filter.posted90") },
                  ]} />
                </FilterField>
              </div>
            </Card>

            {filtered.length === 0 ? (
              <Card><EmptyState head={t("pub.car.noResults.head")} body={t("pub.car.noResults.body")} action={<Button kind="secondary" onClick={clearFilters}>{t("pub.car.noResults.clear")}</Button>} /></Card>
            ) : (
              <Register
                title={t("pub.car.title")}
                columns={[
                  { key: "role", label: t("pub.car.col.role") },
                  { key: "campus", label: t("pub.car.col.campus") },
                  { key: "cat", label: t("pub.car.col.cat") },
                  { key: "status", label: t("pub.car.col.status") },
                  { key: "closes", label: t("pub.car.col.closes"), align: "right" },
                ]}
                rows={filtered.map((p) => {
                  const open = isOpen(p.closesOn);
                  return {
                    id: p.id,
                    tone: open ? undefined : "dim",
                    cells: {
                      role: (
                        <button type="button" onClick={() => setSelectedId(p.id)} style={{ background: "none", border: "none", padding: 0, textAlign: "left", cursor: "pointer" }}>
                          <span style={ty("small", { color: c.action, fontWeight: 700, textDecoration: "underline", textUnderlineOffset: 3 })}>{t(p.titleKey)}</span>
                        </button>
                      ),
                      campus: t("pub.campus." + p.campus),
                      cat: t("pub.cat." + p.cat),
                      status: <StatusMark role={open ? "present" : "off"} word={t(open ? "pub.car.st.open" : "pub.car.st.closed")} glyph={open ? "check" : "arrow"} />,
                      closes: dmy(t, p.closesOn),
                    },
                  };
                })}
              />
            )}
          </React.Fragment>
        )}
      </div>
    );
  }

  /* ============================================================
     PUB-03 · PRE-BOARDING DOCUMENT UPLOAD
     ============================================================ */
  function PreboardingScreen() {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [scenario, setScenario] = useState("valid");
    const [items, setItems] = useState(PRE_SCENARIOS.valid.items);
    const [askMoreFor, setAskMoreFor] = useState(null);
    const [askMoreText, setAskMoreText] = useState("");
    const [askMoreSentFor, setAskMoreSentFor] = useState({});
    const [toast, setToast] = useState(null);
    const [submitted, setSubmitted] = useState(false);

    function pickScenario(key) {
      setScenario(key);
      const sc = PRE_SCENARIOS[key];
      setItems(sc.items ? sc.items.map((it) => Object.assign({}, it)) : null);
      setSubmitted(!!sc.allSubmitted);
      setAskMoreFor(null); setAskMoreText(""); setAskMoreSentFor({}); setToast(null);
    }

    const sc = PRE_SCENARIOS[scenario];
    const anyAttached = items && items.some((it) => it.state === "attached");
    const anySubmittedNow = submitted || (items && items.every((it) => it.state === "submitted"));

    function chooseFile(id, fakeName) {
      /* client-side-only mock validation, so the "oversize/wrong type"
         failure path is reachable interactively too, not only via the
         seeded `error` scenario. Real limits: PDF/JPG/PNG, 10 MB. */
      const lower = fakeName.toLowerCase();
      const okType = /\.(pdf|jpg|jpeg|png)$/.test(lower);
      setItems((prev) => prev.map((it) => {
        if (it.id !== id) return it;
        if (!okType) return Object.assign({}, it, { state: "error", error: "pub.pre.err.type", file: null });
        return Object.assign({}, it, { state: "attached", file: fakeName, error: null });
      }));
    }

    function submitAll() {
      const today = TODAY;
      setItems((prev) => prev.map((it) => (it.state === "attached" ? Object.assign({}, it, { state: "submitted", sentOn: today }) : it)));
      setToast(t("pub.pre.submitAllDone"));
    }

    const scenarioOptions = [
      { key: "valid", label: t("pub.pre.scenario.valid") },
      { key: "partial", label: t("pub.pre.scenario.partial") },
      { key: "submitted", label: t("pub.pre.scenario.submitted") },
      { key: "error", label: t("pub.pre.scenario.error") },
      { key: "expired", label: t("pub.pre.scenario.expired") },
      { key: "revoked", label: t("pub.pre.scenario.revoked") },
    ];

    if (sc.tokenState === "expired" || sc.tokenState === "revoked") {
      return (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", margin: "0 0 16px" }}>
            <Segmented ariaLabel={t("pub.pre.scenario.aria")} options={scenarioOptions} value={scenario} onChange={pickScenario} />
          </div>
          <Card>
            <ErrorState
              head={t(sc.tokenState === "expired" ? "pub.pre.expired.head" : "pub.pre.revoked.head")}
              body={t(sc.tokenState === "expired" ? "pub.pre.expired.body" : "pub.pre.revoked.body")}
            />
          </Card>
        </div>
      );
    }

    return (
      <div>
        <div style={{ display: "flex", justifyContent: "flex-end", margin: "0 0 16px" }}>
          <Segmented ariaLabel={t("pub.pre.scenario.aria")} options={scenarioOptions} value={scenario} onChange={pickScenario} />
        </div>

        <Card icon="document" iconTone="brass" title={t("pub.pre.title")} sub={t("pub.pre.intro")} style={{ marginBottom: 16 }}>
          <p style={ty("caption", { color: c.inkFaint, margin: 0 })}>{t("pub.pre.privacy")}</p>
        </Card>

        <Toast text={toast} />

        {anySubmittedNow ? (
          <Card>
            <EmptyState
              art={<Icon name="check" size={40} style={{ color: c.present }} />}
              head={t("pub.pre.done.head")}
              body={t("pub.pre.done.body", { date: dmy(t, sc.submittedOn || TODAY) })}
            />
          </Card>
        ) : (
          <Card
            title={t("pub.pre.title")}
            action={
              anyAttached
                ? <Button kind="primary" onClick={submitAll}>{t("pub.pre.submitAll")}</Button>
                : <RefusedActionInline reason={t("pub.pre.submitAllReason")} label={t("pub.pre.submitAll")} />
            }
          >
            {items.map((it, i) => {
              const overdue = it.state !== "submitted" && isPastDue(it.due);
              const STATE = {
                pending: { role: "missing", word: t("pub.pre.st.pending"), glyph: "clock" },
                attached: { role: "late", word: t("pub.pre.st.attached"), glyph: "check" },
                submitted: { role: "present", word: t("pub.pre.st.submitted"), glyph: "check" },
                error: { role: "absent", word: t("pub.pre.st.error"), glyph: "alert" },
              }[it.state];
              return (
                <div key={it.id} style={{ padding: "14px 0", borderBottom: i < items.length - 1 ? "1px dashed " + c.border : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={ty("small", { color: c.ink, fontWeight: 700 })}>{t(PRE_DOC_TYPES[it.type])}</div>
                      <div style={ty("caption", { color: overdue ? c.dangerText : c.inkMuted, marginTop: 3 })}>
                        {it.state === "submitted" ? t("pub.pre.sentOn", { date: dmy(t, it.sentOn) }) : overdue ? t("pub.pre.overdue", { date: dmy(t, it.due) }) : t("pub.pre.due", { date: dmy(t, it.due) })}
                      </div>
                    </div>
                    <StatusMark role={STATE.role} word={STATE.word} glyph={STATE.glyph} />
                  </div>

                  {it.state === "error" ? (
                    <p role="alert" style={ty("caption", { color: c.dangerText, margin: "8px 0 0" })}>{t(it.error)}</p>
                  ) : null}

                  {it.state !== "submitted" ? (
                    <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <label style={{ display: "inline-flex" }}>
                        <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }}>{t("pub.pre.choose")}</span>
                        <input
                          type="file" accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) chooseFile(it.id, f.name); }}
                          style={{ display: "none" }} id={"pub-pre-file-" + it.id}
                        />
                        <Button kind={it.file ? "secondary" : "primary"} size="sm" iconLeft="scan" onClick={() => document.getElementById("pub-pre-file-" + it.id).click()}>
                          {it.file ? t("pub.pre.replace") : t("pub.pre.choose")}
                        </Button>
                      </label>
                      {it.file ? <span style={ty("small", { color: c.inkMuted })}>{t("pub.pre.chosen", { file: it.file })}</span> : null}
                    </div>
                  ) : null}

                  {it.hasExpiry && it.state !== "submitted" ? (
                    <div style={{ display: "flex", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
                      <Field id={"pub-pre-issued-" + it.id} label={t("pub.pre.issuedOn")}><Input id={"pub-pre-issued-" + it.id} placeholder={t("pub.pre.datePh")} /></Field>
                      <Field id={"pub-pre-expires-" + it.id} label={t("pub.pre.expiresOn")}><Input id={"pub-pre-expires-" + it.id} placeholder={t("pub.pre.datePh")} /></Field>
                    </div>
                  ) : null}

                  {overdue ? (
                    askMoreFor === it.id ? (
                      <div style={{ marginTop: 10, maxWidth: 480 }}>
                        <Field id={"pub-pre-more-" + it.id} label={t("pub.pre.requestMore.label")}>
                          <Textarea id={"pub-pre-more-" + it.id} value={askMoreText} onChange={setAskMoreText} placeholder={t("pub.pre.requestMore.ph")} />
                        </Field>
                        <div style={{ display: "flex", gap: 10 }}>
                          <Button kind="primary" size="sm" onClick={() => { setAskMoreSentFor((p) => Object.assign({}, p, { [it.id]: true })); setAskMoreFor(null); setAskMoreText(""); }}>{t("pub.pre.requestMore.send")}</Button>
                          <Button kind="ghost" size="sm" onClick={() => { setAskMoreFor(null); setAskMoreText(""); }}>{t("pub.pre.requestMore.cancel")}</Button>
                        </div>
                      </div>
                    ) : askMoreSentFor[it.id] ? (
                      <p style={ty("caption", { color: c.presentText, margin: "8px 0 0" })}>{t("pub.pre.requestMore.sent")}</p>
                    ) : (
                      <div style={{ marginTop: 8 }}>
                        <LinkButton onClick={() => setAskMoreFor(it.id)}>{t("pub.pre.requestMore")}</LinkButton>
                        <p style={ty("caption", { color: c.inkFaint, margin: "4px 0 0", maxWidth: 480 })}>{t("pub.pre.requestMore.note")}</p>
                      </div>
                    )
                  ) : null}
                </div>
              );
            })}
            <p style={ty("caption", { color: c.inkFaint, margin: "14px 0 0" })}>{t("pub.pre.footNote")}</p>
          </Card>
        )}
      </div>
    );
  }

  /* a hairline variant of RefusedAction for a header `action` slot,
     where the full label+paragraph layout of RefusedAction would
     collide with CardHeader's own row (documents.jsx's CardHeader
     "action" slot is a single control, never a two-line block —
     `feedback_cardheader_action_slot_wrap_collision`). */
  function RefusedActionInline({ label, reason }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <span title={reason} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
        <Button kind="primary" disabled>{label}</Button>
      </span>
    );
  }

  /* ============================================================
     PUB-04 · OFFER ACCEPTANCE
     ============================================================ */
  function OfferScreen() {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [scenario, setScenario] = useState("sent");
    const [mode, setMode] = useState(null); // null | "accept" | "decline" | "ask"
    const [signature, setSignature] = useState("");
    const [signErr, setSignErr] = useState(null);
    const [declineReason, setDeclineReason] = useState("");
    const [declineNote, setDeclineNote] = useState("");
    const [declineErr, setDeclineErr] = useState(null);
    const [askText, setAskText] = useState("");
    const [toast, setToast] = useState(null);
    /* local-only status, so an interactive accept/decline in the
       "sent" scenario can flip state without mutating the seed data —
       reset whenever the scenario preview changes. */
    const [liveStatus, setLiveStatus] = useState(null);
    const [liveMeta, setLiveMeta] = useState({});

    useEffect(() => {
      setMode(null); setSignature(""); setSignErr(null);
      setDeclineReason(""); setDeclineNote(""); setDeclineErr(null);
      setAskText(""); setToast(null); setLiveStatus(null); setLiveMeta({});
    }, [scenario]);

    const base = OFFERS[scenario];
    const status = liveStatus || base.status;
    const offer = Object.assign({}, base, liveMeta);

    const scenarioOptions = [
      { key: "sent", label: t("pub.off.scenario.sent") },
      { key: "accepted", label: t("pub.off.scenario.accepted") },
      { key: "declined", label: t("pub.off.scenario.declined") },
      { key: "expired", label: t("pub.off.scenario.expired") },
      { key: "superseded", label: t("pub.off.scenario.superseded") },
    ];

    function openAccept() { setMode("accept"); }
    function confirmAccept() {
      if (!signature.trim()) { setSignErr(t("pub.off.confirm.signErr")); return; }
      /* idempotency (`§7 Concurrency`, PUB-04 non-happy paths): once
         status flips, the Accept/Decline controls are gone from the
         tree entirely — a second click from another tab has nothing
         left to press, and would read the same receipt on reload. */
      setLiveStatus("accepted");
      setLiveMeta({ acceptedOn: TODAY, acceptedName: signature.trim(), ref: "OFR-2026-0142" });
      setMode(null); setSignErr(null);
    }
    function openDecline() { setMode("decline"); }
    function confirmDecline() {
      if (!declineReason) { setDeclineErr(t("pub.off.decline.reasonErr")); return; }
      setLiveStatus("declined");
      setLiveMeta({ declinedOn: TODAY, declineReasonKey: "pub.off.decline.reason." + declineReason });
      setMode(null); setDeclineErr(null);
    }

    return (
      <div>
        <div style={{ display: "flex", justifyContent: "flex-end", margin: "0 0 16px" }}>
          <Segmented ariaLabel={t("pub.off.scenario.aria")} options={scenarioOptions} value={scenario} onChange={setScenario} />
        </div>

        <Toast text={toast} />

        <Card icon="mail" iconTone="accent" title={t("pub.off.title")} sub={t("pub.off.greeting", { name: t(offer.name) })}>
          <p style={ty("body", { color: c.inkMuted, margin: "0 0 18px" })}>{t("pub.off.intro")}</p>

          <DefRow label={t("pub.off.det.role")}>{t(offer.role)}</DefRow>
          <DefRow label={t("pub.off.det.campus")}>{t("pub.campus." + offer.campus)}</DefRow>
          <DefRow label={t("pub.off.det.ctc")}><Figure value={inr(offer.ctc)} size="md" weight={700} /></DefRow>
          <DefRow label={t("pub.off.det.join")}>{dmy(t, offer.join)}</DefRow>
          <DefRow label={t("pub.off.det.expiry")} last>{dmy(t, offer.expiryOn)}</DefRow>

          <p style={ty("caption", { color: c.inkFaint, margin: "12px 0 20px" })}>{t("pub.off.ctcNote")}</p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
            {offer.letterAvailable ? (
              <Button kind="ghost" size="sm" iconLeft="download" onClick={() => setToast(t("pub.off.downloadToast"))}>{t("pub.off.download")}</Button>
            ) : (
              <RefusedAction kind="ghost" icon="download" label={t("pub.off.download")} reason={t("pub.off.letterMissing")} />
            )}
            {status === "sent" ? (
              mode === "ask" ? (
                <div style={{ width: "100%", maxWidth: 480 }}>
                  <Field id="pub-off-ask" label={t("pub.off.ask.label")}><Textarea id="pub-off-ask" value={askText} onChange={setAskText} placeholder={t("pub.off.ask.ph")} /></Field>
                  <div style={{ display: "flex", gap: 10 }}>
                    <Button kind="primary" size="sm" onClick={() => { setToast(t("pub.off.ask.sent")); setMode(null); setAskText(""); }}>{t("pub.off.ask.send")}</Button>
                    <Button kind="ghost" size="sm" onClick={() => setMode(null)}>{t("pub.off.ask.cancel")}</Button>
                  </div>
                </div>
              ) : (
                <LinkButton onClick={() => setMode("ask")}>{t("pub.off.ask")}</LinkButton>
              )
            ) : null}
          </div>

          {status === "sent" ? (
            mode === "accept" ? (
              <Card fill={c.raised} elev={0} style={{ marginBottom: 0 }}>
                <h3 style={ty("h3", { color: c.ink, margin: "0 0 8px" })}>{t("pub.off.confirm.title")}</h3>
                <p style={ty("body", { color: c.inkMuted, margin: "0 0 16px" })}>
                  {t("pub.off.confirm.body", { role: t(offer.role), campus: t("pub.campus." + offer.campus), join: dmy(t, offer.join), ctc: inr(offer.ctc) })}
                </p>
                <Field id="pub-off-sign" label={t("pub.off.confirm.sign")} error={signErr}>
                  <Input id="pub-off-sign" value={signature} onChange={(v) => { setSignature(v); if (signErr) setSignErr(null); }} placeholder={t("pub.off.confirm.signPh")} />
                </Field>
                <div style={{ display: "flex", gap: 12 }}>
                  <Button kind="primary" onClick={confirmAccept}>{t("pub.off.confirm.submit")}</Button>
                  <Button kind="ghost" onClick={() => { setMode(null); setSignErr(null); }}>{t("pub.off.confirm.cancel")}</Button>
                </div>
              </Card>
            ) : mode === "decline" ? (
              <Card fill={c.raised} elev={0} style={{ marginBottom: 0 }}>
                <h3 style={ty("h3", { color: c.ink, margin: "0 0 12px" })}>{t("pub.off.decline.title")}</h3>
                <Field id="pub-off-declreason" label={t("pub.off.decline.reasonLabel")} error={declineErr}>
                  <Select
                    id="pub-off-declreason" value={declineReason}
                    onChange={(v) => { setDeclineReason(v); if (declineErr) setDeclineErr(null); }}
                    options={[
                      { value: "", label: t("pub.off.decline.reasonPh") },
                      { value: "otherOffer", label: t("pub.off.decline.reason.otherOffer") },
                      { value: "compensation", label: t("pub.off.decline.reason.compensation") },
                      { value: "location", label: t("pub.off.decline.reason.location") },
                      { value: "personal", label: t("pub.off.decline.reason.personal") },
                      { value: "other", label: t("pub.off.decline.reason.other") },
                    ]}
                  />
                </Field>
                <Field id="pub-off-declnote" label={t("pub.off.decline.noteLabel")}>
                  <Textarea id="pub-off-declnote" value={declineNote} onChange={setDeclineNote} placeholder={t("pub.off.decline.notePh")} />
                </Field>
                <div style={{ display: "flex", gap: 12 }}>
                  <Button kind="primary" onClick={confirmDecline}>{t("pub.off.decline.submit")}</Button>
                  <Button kind="ghost" onClick={() => { setMode(null); setDeclineErr(null); }}>{t("pub.off.decline.cancel")}</Button>
                </div>
              </Card>
            ) : (
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Button kind="primary" iconLeft="check" onClick={openAccept}>{t("pub.off.accept")}</Button>
                <Button kind="secondary" onClick={openDecline}>{t("pub.off.decline")}</Button>
              </div>
            )
          ) : status === "accepted" ? (
            <Card fill={c.presentTint} elev={0} style={{ marginBottom: 0 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span aria-hidden="true" style={{ color: c.presentText, display: "flex", marginTop: 2 }}><Icon name="check" size={18} /></span>
                <div>
                  <div style={ty("h3", { color: c.presentText, margin: 0 })}>{t("pub.off.accepted.head")}</div>
                  <p style={ty("body", { color: c.presentText, margin: "6px 0 4px" })}>
                    {t("pub.off.accepted.body", { date: dmy(t, offer.acceptedOn), name: offer.acceptedName || t(offer.name) })}
                  </p>
                  {offer.ref ? <div style={ty("caption", { color: c.presentText })}>{t("pub.off.accepted.ref", { ref: offer.ref })}</div> : null}
                </div>
              </div>
            </Card>
          ) : status === "declined" ? (
            <Card fill={c.offTint} elev={0} style={{ marginBottom: 0 }}>
              <div style={ty("h3", { color: c.offText, margin: "0 0 6px" })}>{t("pub.off.declined.head")}</div>
              <p style={ty("body", { color: c.offText, margin: 0 })}>
                {t("pub.off.declined.body", { date: dmy(t, offer.declinedOn), reason: t(offer.declineReasonKey) })}
              </p>
            </Card>
          ) : status === "expired" ? (
            <RefusedAction icon="check" label={t("pub.off.accept")} reason={t("pub.off.expiredReason", { date: dmy(t, offer.expiryOn) })} />
          ) : status === "superseded" ? (
            <RefusedAction icon="check" label={t("pub.off.accept")} reason={t("pub.off.supersededReason", { date: dmy(t, offer.supersededOn) })} />
          ) : null}
        </Card>
      </div>
    );
  }

  /* ============================================================
     ROOT — window.Pages3.Public({ view })
     ============================================================ */
  function Public({ view }) {
    const { c } = useTheme();
    const { lang } = useLang();
    const [screen, setScreen] = useState(view === "preboarding" || view === "offer" ? view : "careers");

    return (
      <div className="nv3" style={{ minHeight: "100vh", background: c.page, fontFamily: G3.font.ui }}>
        <PublicHeader />
        <main style={{ maxWidth: screen === "careers" ? CONTENT_WIDE : CONTENT_NARROW, margin: "0 auto", padding: "28px 24px 80px" }}>
          {screen === "careers" ? <CareersScreen /> : screen === "preboarding" ? <PreboardingScreen /> : <OfferScreen />}
        </main>
        <ScreenSwitch screen={screen} onChange={setScreen} />
      </div>
    );
  }

  window.Pages3 = window.Pages3 || {};
  window.Pages3.Public = Public;

  /* ============================================================
     PROMOTION CANDIDATES (kit.jsx out of scope for this dispatch)
     · Segmented   — 3rd independent copy (groupadmin.jsx, principal.jsx, here)
     · RefusedAction — 3rd independent copy (accountant.jsx, hr-hiring.jsx, here)
     · DefRow      — 3rd independent copy (documents.jsx, hr-hiring.jsx, here)
     · FilterField — 2nd independent copy (hr-hiring.jsx, here)
     · Textarea    — new; every file that needs free-text so far has
       rolled its own inline styling. Worth a real kit.jsx component.
     ============================================================ */
})();
