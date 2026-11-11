/* @jsxRuntime classic */
/* ============================================================
   Naveya — HR Compliance section · window.Pages3.HRCompliance

   HR-10 · Verify document response   (docs/screen-inventory.md, task)
   HR-11 · Expiry watchlist            (destination)
   HR-12 · Verification & child-safety board (destination)

   Modules: M4 §Business rules #3-#4, M4 §API (/verify, /reject);
   M14 §Business rules (expiry scans, lead times), M14 §Acceptance
   ("a licence expiring in 30 days notifies employee + HOD + HR");
   §8 Child-safety ("Police/background-verification records
   access-restricted; expiry alerts prevent lapses"); §6.4
   StaffDocument.doc_type=police_verif; blueprint §11.

   ONE QUESTION PER SCREEN
   · HR-10 "is this response acceptable, and if not, why?"
   · HR-11 "what lapses soon, and who is already past it?"
   · HR-12 "is every person who works near children cleared, right now?"

   GOVERNANCE, ENFORCED HERE (not just described)
   · Verification is append-only. There is no delete affordance
     anywhere on this file, on any object, in any state. A superseded
     document stays visible in its own trail (M4 rule 4; ui-compliance
     R8/A21 "delete a document -> nobody").
   · Employees cannot self-write documents (M4 rule 2). Nothing here
     ever lets HR "upload on someone's behalf" as a stand-in for the
     employee's own response — "Record an external verification"
     (HR-12) is a DIFFERENT, spec-named action: an HR-commissioned
     agency result, landing `pending` and still routed through HR-10
     for the actual verify/reject decision. It is never a substitute
     upload for a document the employee was asked to supply.
   · Police/background-verification content is separately restricted
     (ui-compliance O8): every screen here shows status + authority +
     dates and NEVER an officer's remark or an adverse finding. The
     visible copy O8 requires ("Restricted — child-safety record.
     Opening this is recorded.") appears wherever a police_verif
     record is opened or the board is viewed.
   · ui-compliance §9-Q5 is unresolved ("who exactly may open a
     police/BGV record?"). This file proceeds under the working
     assumption that `hr.compliance.view` + `documents.verify` /
     `documents.manage` is the restricted sub-role, and flags the gap
     rather than inventing a permission the spec doesn't name.
   · Every verification decision records who and why, and shows
     attribution (Trail, DefRow "verified by / rejected by").
   · Expiry is a TIMELINE, not a status: expired / expiring-this-month
     / expiring-this-term are three different words with a date and a
     day count, never a colour alone (StatusMark = glyph + word).
   · HR-12's headline is the uncleared count for the CURRENT scope,
     stated as "for this view" so a narrow filter can never be
     mistaken for the whole board's answer — and when it is genuinely
     zero, that is drawn as a designed, stated success, not a blank
     card (docs/screen-inventory.md HR-12 states, "all clear").

   People and facts are reused, not invented in parallel, from
   design/v3/pages/hr.jsx (HR-01/02/09) and design/v3/pages/
   documents.jsx (Ananya Rao NAV-0142's own document set, including
   her police verification valid to 31 Jul 2027). The demo clock is
   11 Aug 2026, matching every other v3 role page.

   Composed only from window.G3 / window.UI3. kit.jsx, tokens.jsx,
   screens.jsx, v3.html and every sibling pages/*.jsx are untouched by
   this file — local primitives below are promotion candidates, not
   edits to the kit.
   ============================================================ */
(function () {
  const G3 = window.G3;
  const { useState, useMemo, useRef, useEffect } = React;
  const {
    useTheme, ThemeToggle, useLang, addStrings,
    Rail, Card, CardHeader, Register, TitleMark, Button, LinkButton,
    Field, Input, Select, Switch, Tabs, TabPanel, ActionMenu, FileField,
    Chip, StatusMark, Figure, inr, num, Icon, SideScreen,
    EmptyState, ErrorState, Skeleton,
    CampusSwitch, campusLabel, campusOptions, inCampus, CAMPUS_ALL,
  } = window.UI3;

  /* ============================================================
     0 · STRINGS — EN + HI, exact key parity
     ============================================================ */
  addStrings({
    en: {
      "hrc3.pageTitle": "Compliance",
      "hrc3.identity": "HR Operator · Meera Iyer · {campus}",

      "hrc3.tabs.aria": "Compliance sections",
      "dc3.title": "Doc control",
      "dc3.tabs.aria": "Doc control sections",
      "dc3.tab.requests": "Requests",
      "hrc3.tab.verify": "Verify responses",
      "hrc3.tab.watch": "Expiry watchlist",
      "hrc3.v.back.watch": "Back to the expiry watchlist",
      "hrc3.v.back.board": "Back to the child-safety board",
      "hrc3.tab.board": "Child-safety board",

      "hrc3.mon.01": "Jan", "hrc3.mon.02": "Feb", "hrc3.mon.03": "Mar",
      "hrc3.mon.04": "Apr", "hrc3.mon.05": "May", "hrc3.mon.06": "Jun",
      "hrc3.mon.07": "Jul", "hrc3.mon.08": "Aug", "hrc3.mon.09": "Sep",
      "hrc3.mon.10": "Oct", "hrc3.mon.11": "Nov", "hrc3.mon.12": "Dec",

      "hrc3.restricted.banner": "Restricted — child-safety record. Opening this is recorded.",
      "hrc3.restricted.chip": "Restricted",
      "hrc3.sheet.close": "Close",
      "hrc3.sheet.snoozed": "Snoozed until",
      "hrc3.sheet.restricted": "Access",

      /* ---- doc types (shared across all three tabs) ---- */
      "hrc3.type.police": "Police verification",
      "hrc3.type.pan": "PAN card",
      "hrc3.type.bankProof": "Bank proof",
      "hrc3.type.degree": "Degree certificate",
      "hrc3.type.bed": "B.Ed certificate",
      "hrc3.type.medical": "Medical fitness certificate",
      "hrc3.type.training": "Safety training certificate",
      "hrc3.type.license": "Driver licence",
      "hrc3.type.contract": "Employment contract",
      "hrc3.type.address": "Address proof",
      "hrc3.type.aadhaar": "Aadhaar",

      "hrc3.v.day": "day",
      "hrc3.days.overdue": "{n} days overdue",
      "hrc3.days.overdue1": "1 day overdue",
      "hrc3.days.left": "{n} days left",
      "hrc3.days.left1": "1 day left",
      "hrc3.days.ago": "{n} days ago",
      "hrc3.days.ago1": "1 day ago",

      /* ================= HR-10 · Verify document response ================= */
      "hrc3.v.title": "Verify document response",
      "hrc3.v.queue.title": "Awaiting your decision",
      "hrc3.v.queue.sub": "{n} responses submitted, oldest first",
      "hrc3.v.col.employee": "Employee",
      "hrc3.v.col.type": "Document",
      "hrc3.v.col.age": "Age",
      "hrc3.v.col.due": "Due",
      "hrc3.v.col.actions": "Actions",
      "hrc3.v.days": "days",
      "hrc3.v.selectRow": "Open {type} for {name}",
      "hrc3.v.menu.aria": "Actions for {name}",

      "hrc3.v.det.empty.head": "Choose a response to review",
      "hrc3.v.det.empty.body": "Select a row on the left. Open the document, compare it against the record, and decide.",

      "hrc3.v.det.requestedBy": "Requested by {who} · due {date}",
      "hrc3.v.det.employeeNote": "The employee's note",
      "hrc3.v.det.noNote": "No note was attached.",
      "hrc3.v.det.age": "Submitted {n} days ago",

      "hrc3.v.det.onRecord": "Currently on record",
      "hrc3.v.det.onRecord.none": "Nothing on record yet — this is the employee's first submission of this type.",
      "hrc3.v.det.onRecord.verifiedBy": "Verified by {who} · {date}",
      "hrc3.v.det.onRecord.validTo": "Valid to {date}",
      "hrc3.v.det.onRecord.noExpiry": "This document type does not carry an expiry date.",
      "hrc3.v.det.submitted": "Submitted response",
      "hrc3.v.det.file": "response.pdf",
      "hrc3.v.det.fileUnreadable": "The file didn't open cleanly on our end — HR sees the same as the employee's own copy.",
      "hrc3.v.det.open": "Open the response",
      "hrc3.v.det.opened": "Opened — you can now decide.",
      "hrc3.v.det.notOpened": "Open the response before you verify it.",
      "hrc3.v.det.viewLogged": "Opening a police/background-verification file is recorded, separately from the ordinary document log.",

      "hrc3.v.det.expiryTitle": "Issue and expiry, from the new document",
      "hrc3.v.det.issuedLabel": "Issued on",
      "hrc3.v.det.expiresLabel": "Expires on",
      "hrc3.v.det.expiresHint": "Required for this document type before it can be verified.",
      "hrc3.v.det.expiresMissing": "Verify is disabled — capture the expiry date first.",
      "hrc3.v.det.agencyLabel": "Verifying authority",
      "hrc3.v.det.agencyHint": "No dedicated field exists in the schema yet for this — recorded here as a proposal.",

      "hrc3.v.who.meera": "Meera Iyer, HR",
      "hrc3.v.who.rajan": "Rajan Pillai, HR",
      "hrc3.v.menu.decide": "Open it and decide",
      "hrc3.v.decide.later": "Decide later",
      "hrc3.v.decide.waiting": "Waiting on your decision",
      "hrc3.v.menu.open": "Open the response",
      "hrc3.v.menu.verify": "Verify & promote",
      "hrc3.v.menu.verifyDisabledUnopened": "Open the response first",
      "hrc3.v.menu.verifyDisabledExpiry": "Capture the expiry date first",
      "hrc3.v.menu.reject": "Reject",
      "hrc3.v.menu.reReq": "Re-request immediately",

      "hrc3.v.confirm.title": "This becomes the record",
      "hrc3.v.confirm.body": "{name}'s {type} becomes the document on file, verified by you. The one it replaces is kept in history. A mistake here is corrected by a fresh request.",
      "hrc3.v.confirm.confirm": "Verify & promote",
      "hrc3.v.confirm.cancel": "Cancel",
      "hrc3.v.confirm.done": "Verified. {name}'s {type} is now on record.",

      "hrc3.v.reject.title": "Send this back",
      "hrc3.v.reject.reasonLabel": "Reason",
      "hrc3.v.reject.reasonPh": "Choose a reason",
      "hrc3.v.reject.illegible": "Illegible",
      "hrc3.v.reject.wrongDoc": "Wrong document",
      "hrc3.v.reject.expired": "Expired",
      "hrc3.v.reject.nameMismatch": "Name mismatch",
      "hrc3.v.reject.other": "Other",
      "hrc3.v.reject.noteLabel": "A line for the employee — this is shown to them exactly as written",
      "hrc3.v.reject.notePh": "What should they fix before sending it again?",
      "hrc3.v.reject.required": "A reason is required before this can be sent back.",
      "hrc3.v.reject.confirm": "Confirm — send back",
      "hrc3.v.reject.cancel": "Cancel",
      "hrc3.v.reject.done": "Sent back. {name} sees this reason on their own Documents screen.",


      "hrc3.v.reg.empty.head": "Nothing is waiting on you",
      "hrc3.v.reg.empty.body": "Every response HR has received is checked. New submissions land here the moment an employee replies.",

      /* ================= HR-11 · Expiry watchlist ================= */
      "hrc3.w.title": "Expiry watchlist",
      "hrc3.w.note": "Everything with a date that matters \u2014 documents, licences, medical fitness and contracts. Police-verification validity shows by date only.",
      "hrc3.w.leadLabel": "Alert lead time (tenant default)",
      "hrc3.w.leadNote": "New alerts use this lead time; items already on this list keep the date they were flagged at.",
      "hrc3.w.leadDays30": "30 days (M14 default)",
      "hrc3.w.leadDays14": "14 days",
      "hrc3.w.leadDays60": "60 days",
      "hrc3.w.leadDays90": "90 days",

      "hrc3.w.filter.kind": "Kind",
      "hrc3.w.filter.kindAll": "Documents and contracts",
      "hrc3.w.filter.kindDoc": "Documents only",
      "hrc3.w.filter.kindContract": "Contracts only",

      "hrc3.w.col.item": "Item",
      "hrc3.w.col.person": "Person",
      "hrc3.w.col.date": "Date",
      "hrc3.w.col.state": "Timeline",
      "hrc3.w.col.actions": "Actions",

      "hrc3.w.tier.expired": "Expired",
      "hrc3.w.tier.month": "Expiring this month",
      "hrc3.w.tier.term": "Expiring this term",
      "hrc3.w.tier.later": "On record — not yet urgent",


      "hrc3.w.action.addCert": "Add the certificate",
      "hrc3.w.action.raiseDoc": "Raise a document request",
      "hrc3.w.action.raiseDocDone": "Request raised — {name} will be asked for a new {type}.",
      "hrc3.w.action.renewal": "Start a contract renewal",
      "hrc3.w.action.renewalRoute": "Opens the renewal workflow (HR-25) in Staff lifecycle.",
      "hrc3.w.action.snooze7": "Snooze 7 days",
      "hrc3.w.action.snooze14": "Snooze 14 days",
      "hrc3.w.action.snooze30": "Snooze 30 days",
      "hrc3.w.action.snoozeDisabled": "Expired items cannot be snoozed",
      "hrc3.w.action.inProgress": "Already in progress",
      "hrc3.w.action.inProgressReason": "A document request is open for this item — see Verify responses / Documents.",
      "hrc3.w.snoozedUntil": "Snoozed until {date}",

      "hrc3.w.export": "Export",
      "hrc3.w.export.done": "Exported {n} rows for {scope}. This export is recorded in the audit log.",

      "hrc3.w.reg.empty.head": "Nothing matches this filter",
      "hrc3.w.reg.empty.body": "Try widening the campus or kind filter.",
      "hrc3.w.footNote": "Expired items always lead the list, oldest first, whatever the sort — a lapse is never buried under what is merely upcoming.",

      /* ================= HR-12 · Verification & child-safety board ================= */
      "hrc3.b.title": "Verification & child-safety board",

      "hrc3.b.headline.clear": "All {n} staff in this view are cleared today.",
      "hrc3.b.headline.gaps": "{n} of {total} staff in this view are not cleared today.",
      "hrc3.b.headline.contact": "{n} of them work directly with students.",
      "hrc3.b.headline.scope": "For the current filter — not the whole board. Widen the filter to see more.",

      "hrc3.b.filter.category": "Staff category",
      "hrc3.b.filter.categoryAll": "All categories",
      "hrc3.b.filter.category.teaching": "Teaching",
      "hrc3.b.filter.category.non_teaching": "Non-teaching",
      "hrc3.b.filter.category.support": "Support",
      "hrc3.b.filter.category.guest": "Guest faculty",
      "hrc3.b.filter.contactOnly": "Direct student contact only",

      "hrc3.b.col.person": "Person",
      "hrc3.b.col.category": "Category",
      "hrc3.b.col.contact": "Student contact",
      "hrc3.b.col.state": "Verification",
      "hrc3.b.col.date": "Valid to / since",
      "hrc3.b.col.actions": "Actions",

      "hrc3.b.contact.yes": "Direct contact",
      "hrc3.b.contact.no": "No direct contact",

      "hrc3.b.state.verified": "Verified",
      "hrc3.b.state.expiring_month": "Expiring this month",
      "hrc3.b.state.expiring_term": "Expiring this term",
      "hrc3.b.state.expired": "Expired",
      "hrc3.b.state.missing": "Missing",
      "hrc3.b.state.pending": "Verification pending",
      "hrc3.b.state.new_joiner": "New joiner — request open",

      "hrc3.b.date.validTo": "Valid to {date}",
      "hrc3.b.date.expiredOn": "Expired {date}",
      "hrc3.b.date.dueOn": "Due {date}",
      "hrc3.b.date.none": "—",

      "hrc3.b.cat.teaching": "Teaching",
      "hrc3.b.cat.non_teaching": "Non-teaching",
      "hrc3.b.cat.support": "Support",
      "hrc3.b.cat.guest": "Guest faculty",

      "hrc3.b.menu.record": "Add the certificate",
      "hrc3.b.menu.flag": "Flag for restricted duty",
      "hrc3.b.menu.flagDisabled": "Only offered when verification is missing or expired",


      "hrc3.b.record.title": "Add the police-verification certificate",
      "hrc3.b.record.fileLabel": "Certificate",
      "hrc3.b.record.fileHint": "The signed certificate, as a PDF or a scan.",
      "hrc3.b.record.expiresHint": "Required — the watchlist counts from this date.",
      "hrc3.b.record.issuedLabel": "Issued on",
      "hrc3.b.record.expiresLabel": "Expires on",
      "hrc3.b.record.agencyLabel": "Verifying authority",
      "hrc3.b.record.agencyHint": "Who carried the check out — the police station or the agency.",
      "hrc3.b.record.confirm": "Add to the record",
      "hrc3.b.record.cancel": "Cancel",
      "hrc3.b.record.done": "Certificate added for {name}, valid to {date}.",

      "hrc3.b.flag.title": "Flag for restricted duty",
      "hrc3.b.flag.body": "The spec mandates tracking this gap but names no consequence, so this is a proposal. It records a decision and notifies the head.",
      "hrc3.b.flag.reasonLabel": "Reason — shown to the Department Head",
      "hrc3.b.flag.reasonPh": "Why is this being flagged?",
      "hrc3.b.flag.required": "A reason is required.",
      "hrc3.b.flag.confirm": "Confirm — flag and notify",
      "hrc3.b.flag.cancel": "Cancel",
      "hrc3.b.flag.done": "Flagged. {name}'s Department Head is notified with your reason.",

      "hrc3.b.export": "Export the compliance register",
      "hrc3.b.export.done": "Exported {n} rows for {scope}. Recorded in the audit log.",

      "hrc3.b.reg.empty.head": "No one matches this filter",
      "hrc3.b.reg.empty.body": "Try widening the campus or category filter.",
      "hrc3.b.footNote": "Staff who work directly with students first, least-cleared within that. Officer remarks and adverse findings are never shown here.",

      "hrc3.scopeAll": "both campuses",
    },
  });

  /* ============================================================
     1 · TIME — a single anchored "today" (demo clock: 11 Aug 2026,
     matching every other v3 role page), and dates as [D,MM,YYYY]
     string arrays like every sibling page. Day counts are always
     COMPUTED from the stored date, never typed as a second, separate
     literal that could drift out of sync with it.
     ============================================================ */
  const TODAY = ["11", "08", "2026"];

  function toDate(d) {
    return new Date(parseInt(d[2], 10), parseInt(d[1], 10) - 1, parseInt(d[0], 10));
  }
  /* positive = in the future (days left); negative = in the past (days ago) */
  function daysFrom(d) {
    return Math.round((toDate(d) - toDate(TODAY)) / 86400000);
  }
  function dmy(t, d) {
    if (!d) return null;
    return d[0] + " " + t("hrc3.mon." + d[1]) + " " + d[2];
  }
  function daysWord(t, n) {
    if (n < 0) return Math.abs(n) === 1 ? t("hrc3.days.ago1") : t("hrc3.days.ago", { n: num(Math.abs(n)) });
    return n === 1 ? t("hrc3.days.left1") : t("hrc3.days.left", { n: num(n) });
  }
  function overdueWord(t, n) {
    return n === 1 ? t("hrc3.days.overdue1") : t("hrc3.days.overdue", { n: num(n) });
  }

  /* Lead-time thresholds are a named, attributed default — not a bare
     literal buried in a comparison. 30 days is M14 §Acceptance's own
     example ("a licence expiring in 30 days notifies..."); the term
     boundary is this pass's stated simplification of M7's academic
     calendar (a real build reads AcademicYear/Term boundaries). */
  const EXPIRY_LEAD = { monthDays: 30, termDays: 150, source: "M14 §Acceptance default lead time" };
  function tierFor(days) {
    if (days < 0) return "expired";
    if (days <= EXPIRY_LEAD.monthDays) return "month";
    if (days <= EXPIRY_LEAD.termDays) return "term";
    return "later";
  }

  /* ============================================================
     2 · DATA — reused people. Names, staff IDs, departments and
     campuses are drawn verbatim from hr.jsx's HR-01/02/09 roster and
     documents.jsx's Ananya Rao (NAV-0142), so this section is
     recognisably the same school, not a parallel cast.
     ============================================================ */
  const STAFF = [
    { id: "e1", code: "NAV-0142", name: "Ananya Rao", dept: "Science", cat: "teaching", campus: "indiranagar", contact: true },
    { id: "e2", code: "NAV-0118", name: "Vikram Sen", dept: "Mathematics", cat: "teaching", campus: "indiranagar", contact: true },
    { id: "e3", code: "NAV-0207", name: "Kavya Nair", dept: "Primary", cat: "teaching", campus: "indiranagar", contact: true },
    { id: "e4", code: "NAV-0233", name: "Farah Sheikh", dept: "Pre-primary", cat: "teaching", campus: "whitefield", contact: true },
    { id: "e5", code: "NAV-0161", name: "Rohit Malhotra", dept: "Languages", cat: "guest", campus: "indiranagar", contact: true },
    { id: "e6", code: "NAV-0088", name: "Meenakshi Pillai", dept: "Science", cat: "teaching", campus: "indiranagar", contact: true },
    { id: "e7", code: "NAV-0176", name: "Suresh Kamath", dept: "Administration", cat: "non_teaching", campus: "indiranagar", contact: false },
    { id: "e8", code: "NAV-0199", name: "Divya Prakash", dept: "Administration", cat: "non_teaching", campus: "whitefield", contact: false },
    { id: "e9", code: "NAV-0054", name: "Manjunath Gowda", dept: "Transport", cat: "support", campus: "indiranagar", contact: true },
    { id: "e10", code: "NAV-0221", name: "Lakshmi Venkat", dept: "Hostel", cat: "support", campus: "whitefield", contact: true },
    { id: "e11", code: "NAV-0245", name: "Arvind Krishnan", dept: "Science", cat: "teaching", campus: "whitefield", contact: true },
    { id: "e12", code: "NAV-0250", name: "Neha Bhatt", dept: "Primary", cat: "teaching", campus: "indiranagar", contact: true },
    { id: "e13", code: "NAV-0034", name: "Ramesh Iyengar", dept: "Administration", cat: "non_teaching", campus: "indiranagar", contact: true },
    { id: "e15", code: "NAV-0263", name: "Zoya Ahmed", dept: "Arts", cat: "guest", campus: "whitefield", contact: true },
    { id: "e16", code: "NAV-0067", name: "Prakash Bhandari", dept: "Sports", cat: "support", campus: "indiranagar", contact: true },
  ];
  function staff(id) { return STAFF.find((s) => s.id === id); }

  /* HR-12 · one police_verif fact per active staff member.
     Ananya Rao's (verified, valid 31 Jul 2027) is the exact fact
     documents.jsx renders on her own Documents screen — the same
     record, two audiences. */
  const BGV = {
    e1: { state: "verified", valid: ["31", "07", "2027"] },
    e2: { state: "verified", valid: ["15", "03", "2027"] },
    e3: { state: "verified", valid: ["17", "02", "2029"] },
    e4: { state: "expiring_term", valid: ["20", "12", "2026"] },
    e5: { state: "expired", valid: ["20", "07", "2026"] },
    e6: { state: "verified", valid: ["6", "06", "2028"] },
    e7: { state: "missing", valid: null },
    e8: { state: "verified", valid: ["1", "05", "2028"] },
    e9: { state: "verified", valid: ["5", "05", "2028"] },
    e10: { state: "expiring_month", valid: ["25", "08", "2026"] },
    e11: { state: "missing", valid: null },
    e12: { state: "new_joiner", valid: null, requestDue: ["30", "08", "2026"] },
    e13: { state: "expired", valid: ["15", "08", "2023"] },
    e15: { state: "missing", valid: null },
    e16: { state: "verified", valid: ["8", "07", "2027"] },
  };

  /* HR-11 · everything with a date. `kind: "doc"` items reuse the
     restricted-copy discipline when type === "police"; `kind:
     "contract"` items are EmploymentContract.contract_end_date. */
  const WATCH_SEED = [
    { id: "w1", staffId: "e5", kind: "doc", type: "police", date: ["20", "07", "2026"], notifiedDays: 5, inProgress: false, restricted: true },
    { id: "w2", staffId: "e13", kind: "doc", type: "police", date: ["15", "08", "2023"], notifiedDays: null, inProgress: false, restricted: true },
    { id: "w3", staffId: "e9", kind: "doc", type: "license", date: ["4", "08", "2026"], notifiedDays: 7, inProgress: true },
    { id: "w4", staffId: "e10", kind: "doc", type: "medical", date: ["1", "08", "2026"], notifiedDays: 10, inProgress: true },
    { id: "w5", staffId: "e10", kind: "doc", type: "police", date: ["25", "08", "2026"], notifiedDays: 1, inProgress: false, restricted: true },
    { id: "w6", staffId: "e2", kind: "doc", type: "training", date: ["30", "08", "2026"], notifiedDays: 3, inProgress: false },
    { id: "w7", staffId: "e4", kind: "doc", type: "police", date: ["20", "12", "2026"], notifiedDays: null, inProgress: false, restricted: true },
    { id: "w8", staffId: "e11", kind: "contract", date: ["15", "11", "2026"], notifiedDays: null, inProgress: false },
    { id: "w9", staffId: "e8", kind: "contract", date: ["1", "05", "2027"], notifiedDays: null, inProgress: false, snoozedUntil: ["1", "02", "2027"] },
  ];

  /* HR-10 · responses submitted, awaiting HR's decision. `requiresExpiry`
     doc types must have issued/expires captured before Verify unlocks. */
  const EXPIRY_REQUIRED = { police: true, medical: true, training: true, license: true };
  const QUEUE_SEED = [
    {
      id: "q1", staffId: "e11", type: "police", requesterKey: "who.rajan",
      raisedDue: ["19", "08", "2026"], submittedOn: ["5", "08", "2026"],
      noteText: "Renewed certificate attached — valid for three years from the issue date printed on it.",
      restricted: true,
      onRecord: { verified: true, verifiedByKey: "who.meera", verifiedOn: ["22", "06", "2022"], valid: ["18", "06", "2026"] },
      readable: true,
    },
    {
      id: "q2", staffId: "e1", type: "pan", requesterKey: "who.meera",
      raisedDue: ["20", "08", "2026"], submittedOn: ["8", "08", "2026"],
      noteText: null,
      onRecord: { verified: true, verifiedByKey: "who.meera", verifiedOn: ["14", "04", "2024"], valid: null },
      readable: true,
    },
    {
      id: "q3", staffId: "e7", type: "bankProof", requesterKey: "who.rajan",
      raisedDue: ["25", "08", "2026"], submittedOn: ["10", "08", "2026"],
      noteText: "Sending the new HDFC cheque leaf as proof — please check the account name matches the salary register.",
      onRecord: { verified: true, verifiedByKey: "who.rajan", verifiedOn: ["3", "06", "2021"], valid: null },
      readable: true,
    },
    {
      id: "q4", staffId: "e4", type: "degree", requesterKey: "who.rajan",
      raisedDue: ["14", "08", "2026"], submittedOn: ["9", "08", "2026"],
      noteText: null,
      onRecord: { verified: false },
      readable: false,
    },
  ];

  /* ============================================================
     3 · LOCAL PRIMITIVES — promotion candidates, kept here because
     this dispatch owns only its own page file (kit.jsx is out of
     scope for this pass).
     ============================================================ */
  function initials(name) {
    const parts = name.split(" ").filter(Boolean);
    return ((parts[0] || "")[0] || "") + ((parts[1] || "")[0] || "");
  }
  function Avatar({ name, size }) {
    const { c } = useTheme();
    const s = size || 32;
    return (
      <span aria-hidden="true" style={{
        width: s, height: s, borderRadius: G3.r.pill, background: c.sunken, color: c.inkMuted,
        display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        fontFamily: G3.font.ui, fontSize: s * 0.36, fontWeight: 700,
      }}>{initials(name)}</span>
    );
  }
  function FilterField({ label, children, minWidth }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: minWidth || 150, flex: "1 1 150px" }}>
        <span style={ty("caption", { color: c.inkMuted })}>{label}</span>
        {children}
      </div>
    );
  }
  function TopStrip({ campus, onCampus }) {
    const { t } = useLang();
    const { c } = useTheme();

    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ fontSize: 0 }}>
          <span style={{ fontFamily: G3.font.ui, fontSize: 12.5, fontWeight: 700, color: c.ink }}>{t("nav.hrDocs")}</span>
          <span style={{ margin: "0 8px", color: c.inkFaint, fontFamily: G3.font.ui, fontSize: 12.5 }}>·</span>
          <span style={{ fontFamily: G3.font.ui, fontSize: 12.5, color: c.inkMuted }}>{t("home.school")}, {campusLabel(t, campus)}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <CampusSwitch value={campus} onChange={onCampus} />
          <ThemeToggle />
        </div>
      </div>
    );
  }

  /* the O8 visible-copy banner: appears wherever a police_verif record
     is shown in bulk (the board) or opened individually (HR-10). */
  function RestrictedBanner({ style }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    return (
      <div style={Object.assign({
        display: "flex", alignItems: "center", gap: 10, background: c.brassSoft,
        borderRadius: G3.r.md, padding: "10px 14px",
      }, style || {})}>
        <span aria-hidden="true" style={{ display: "flex", color: c.brass, flexShrink: 0 }}><Icon name="lock" size={16} /></span>
        <span style={ty("caption", { color: c.brass, fontWeight: 700 })}>{t("hrc3.restricted.banner")}</span>
      </div>
    );
  }

  function DefRow({ label, children, last }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", padding: "9px 0", borderBottom: last ? "none" : "1px dashed " + c.border }}>
        <div style={ty("small", { color: c.inkMuted, flex: "0 0 42%", minWidth: 0 })}>{label}</div>
        <div style={{ flex: 1, minWidth: 0, textAlign: "right" }}>{children}</div>
      </div>
    );
  }

  /* a small centred, portal-rendered confirm dialog (matches depthead.jsx's
     ConfirmDialog verbatim — the same pattern, kept local per-file). */
  function ConfirmDialog({ title, body, children, confirmLabel, cancelLabel, onConfirm, onCancel, confirmDisabled }) {
    const { c, shadow } = useTheme();
    const { ty } = useLang();
    const boxRef = useRef(null);
    useEffect(() => {
      function onKey(e) { if (e.key === "Escape") onCancel(); }
      document.addEventListener("keydown", onKey);
      if (boxRef.current) boxRef.current.focus();
      return () => document.removeEventListener("keydown", onKey);
      // eslint-disable-next-line
    }, []);
    return ReactDOM.createPortal(
      <div style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div aria-hidden="true" onMouseDown={onCancel} style={{ position: "absolute", inset: 0, background: c.rail, opacity: 0.55 }} />
        <div ref={boxRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title}
          style={{ position: "relative", width: 520, maxWidth: "100%", background: c.surface, border: "1px solid " + c.border, borderRadius: G3.r.lg, boxShadow: shadow(4), padding: 24, maxHeight: "86vh", overflowY: "auto" }}>
          <h2 style={ty("h2", { margin: "0 0 10px", color: c.ink })}>{title}</h2>
          {body ? <p style={ty("small", { color: c.inkMuted, margin: "0 0 16px" })}>{body}</p> : null}
          {children}
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 18 }}>
            {cancelLabel ? <Button kind="ghost" onClick={onCancel}>{cancelLabel}</Button> : null}
            {confirmLabel ? (
              <Button kind="primary" disabled={confirmDisabled} onClick={confirmDisabled ? (e) => e.preventDefault() : onConfirm}>{confirmLabel}</Button>
            ) : null}
          </div>
        </div>
      </div>,
      document.body
    );
  }

  /* POLICE VERIFICATION IS DONE OUTSIDE THIS SYSTEM (designer).
     Nobody applies for it in here and nobody is asked for it in here:
     the school sends the papers to the station, the certificate comes
     back on paper, and the only thing this product does is hold the
     scan and the two dates every other screen reads off it. So there
     is no request to raise — there is a certificate to add, and this
     is the one dialog that adds it, on the watchlist and on the board
     alike. */
  function CertDialog({ name, onCancel, onDone }) {
    const { t } = useLang();
    const [file, setFile] = useState(null);
    const [issued, setIssued] = useState("");
    const [expires, setExpires] = useState("");
    const [agency, setAgency] = useState("");
    const ready = !!file && !!expires.trim();
    return (
      <ConfirmDialog
        title={t("hrc3.b.record.title")}
        confirmLabel={t("hrc3.b.record.confirm")}
        cancelLabel={t("hrc3.b.record.cancel")}
        confirmDisabled={!ready}
        onConfirm={() => onDone({ file: file, issued: issued, expires: expires, agency: agency })}
        onCancel={onCancel}
      >
        <Field id="hrc3-rec-file" label={t("hrc3.b.record.fileLabel")}>
          <FileField id="hrc3-rec-file" fileName={file} onPick={setFile} accept=".pdf,image/*" hint={t("hrc3.b.record.fileHint")} />
        </Field>
        <Field id="hrc3-rec-issued" label={t("hrc3.b.record.issuedLabel")}>
          <Input id="hrc3-rec-issued" value={issued} onChange={setIssued} placeholder="DD MMM YYYY" />
        </Field>
        <Field id="hrc3-rec-expires" label={t("hrc3.b.record.expiresLabel")} hint={!expires.trim() ? t("hrc3.b.record.expiresHint") : undefined}>
          <Input id="hrc3-rec-expires" value={expires} onChange={setExpires} placeholder="DD MMM YYYY" />
        </Field>
        <Field id="hrc3-rec-agency" label={t("hrc3.b.record.agencyLabel")} hint={t("hrc3.b.record.agencyHint")}>
          <Input id="hrc3-rec-agency" value={agency} onChange={setAgency} placeholder="" />
        </Field>
      </ConfirmDialog>
    );
  }

  function docTypeLabel(t, type) { return t("hrc3.type." + type); }

  /* ============================================================
     4 · HR-10 · VERIFY DOCUMENT RESPONSE
     ============================================================ */
  function VerifyResponses({ onGoToBoard, jumpItemId, campus }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [queue] = useState(QUEUE_SEED);
    const [selected, setSelected] = useState(jumpItemId || QUEUE_SEED[0].id);
    const [opened, setOpened] = useState({});
    const [issuedInput, setIssuedInput] = useState({});
    const [expiresInput, setExpiresInput] = useState({});
    const [agencyInput, setAgencyInput] = useState({});
    const [showReject, setShowReject] = useState(false);
    const [confirmItem, setConfirmItem] = useState(null);
    /* which document is being decided, or null for "none — just the
       queue". The queue is a list of choices; a decision is a screen. */
    const [deciding, setDeciding] = useState(null);
    const [toast, setToast] = useState(null);
    const [decided, setDecided] = useState([]);

    useEffect(() => {
      /* arriving from the watchlist or the board with one item in mind
         opens that decision straight away */
      if (jumpItemId) { setSelected(jumpItemId); setDeciding(jumpItemId); }
      // eslint-disable-next-line
    }, [jumpItemId]);

    const item = deciding ? (queue.find((q) => q.id === deciding) || null) : null;
    const isOpened = item ? !!opened[item.id] : false;
    const needsExpiry = item ? !!EXPIRY_REQUIRED[item.type] : false;
    const hasExpiry = item ? !!(expiresInput[item.id] && expiresInput[item.id].trim()) : false;
    const canVerify = isOpened && item && item.readable !== false && (!needsExpiry || hasExpiry);

    function openItem(id) { setOpened((cur) => Object.assign({}, cur, { [id]: true })); }

    function doVerify(it) {
      setDecided((cur) => [{ id: it.id, staffId: it.staffId, type: it.type, kind: "verified", byKey: "who.meera", on: TODAY }, ...cur]);
      setToast(t("hrc3.v.confirm.done", { name: staff(it.staffId).name, type: docTypeLabel(t, it.type) }));
      setConfirmItem(null);
      setDeciding(null);
    }
    function doReject(it, reasonText) {
      setDecided((cur) => [{ id: it.id, staffId: it.staffId, type: it.type, kind: "rejected", byKey: "who.meera", on: TODAY, reason: reasonText }, ...cur]);
      setToast(t("hrc3.v.reject.done", { name: staff(it.staffId).name }));
      setShowReject(false);
      setDeciding(null);
    }

    const columns = [
      { key: "employee", label: t("hrc3.v.col.employee") },
      { key: "type", label: t("hrc3.v.col.type") },
      { key: "age", label: t("hrc3.v.col.age"), mono: true },
      { key: "due", label: t("hrc3.v.col.due"), mono: true },
      { key: "act", label: t("hrc3.v.col.actions"), align: "right", width: 56 },
    ];

    const rows = queue
      .filter((q) => decided.every((d) => d.id !== q.id))
      .filter((q) => inCampus(campus, staff(q.staffId).campus))
      .map((q) => {
      const s = staff(q.staffId);
      const age = Math.abs(daysFrom(q.submittedOn));
      const opened2 = !!opened[q.id];
      const needsExp = !!EXPIRY_REQUIRED[q.type];
      const hasExp = !!(expiresInput[q.id] && expiresInput[q.id].trim());
      const canV = opened2 && q.readable !== false && (!needsExp || hasExp);
      /* every item opens the SAME place — the decision screen for this
         one document. A menu that offered "verify" from the register
         would be asking somebody to accept a document they have not
         opened, which is the one thing this module exists to prevent. */
      const menuItems = [
        { key: "decide", icon: "scan", label: t("hrc3.v.menu.decide"), onSelect: () => { setSelected(q.id); setDeciding(q.id); } },
        { key: "reject", icon: "arrow", label: t("hrc3.v.menu.reject"), tone: "danger", onSelect: () => { setSelected(q.id); setDeciding(q.id); setShowReject(true); } },
      ];
      return {
        id: q.id,
        highlight: q.id === selected,
        cells: {
          employee: (
            <span style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              <Avatar name={s.name} size={28} />
              <span style={{ minWidth: 0 }}>
                <span style={ty("small", { display: "block", color: c.ink, fontWeight: 700 })}>{s.name}</span>
                <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 1 })}>{s.dept}</span>
              </span>
            </span>
          ),
          type: (
            <button type="button" onClick={() => { setSelected(q.id); setDeciding(q.id); }}
              aria-label={t("hrc3.v.selectRow", { type: docTypeLabel(t, q.type), name: s.name })}
              style={ty("small", { background: "none", border: "none", padding: 0, textAlign: "left", color: c.ink, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 })}>
              {q.restricted ? <Icon name="lock" size={13} style={{ flexShrink: 0, color: c.brass }} /> : null}
              {docTypeLabel(t, q.type)}
            </button>
          ),
          age: age + " " + t(age === 1 ? "hrc3.v.day" : "hrc3.v.days"),
          due: dmy(t, q.raisedDue),
          act: <span style={{ display: "flex", justifyContent: "flex-end" }}><ActionMenu ariaLabel={t("hrc3.v.menu.aria", { name: s.name })} items={menuItems} /></span>,
        },
      };
    });

    return (
      <div>
        <h1 style={ty("h1", { margin: "0 0 20px", color: c.ink })}>{t("hrc3.v.title")}</h1>

        {toast ? (
          <div style={{ background: c.presentTint, color: c.presentText, borderRadius: G3.r.md, padding: "10px 14px", marginBottom: 16 }}>
            <span style={ty("small", { fontWeight: 600 })}>{toast}</span>
          </div>
        ) : null}

        <div>
          <div>
            {rows.length === 0 ? (
              <Card><EmptyState head={t("hrc3.v.reg.empty.head")} body={t("hrc3.v.reg.empty.body")} compact /></Card>
            ) : (
              <Register
                title={t("hrc3.v.queue.title")} sub={t("hrc3.v.queue.sub", { n: rows.length })}
                columns={columns} rows={rows}
                /* the whole row opens the decision, not just the
                   document's name — a table you cannot click is a
                   table that looks broken */
                onSelect={(id) => { setSelected(id); setDeciding(id); }}
              />
            )}

          </div>

        </div>

        {/* THE DECISION, over the queue rather than beside it. One
            document, everything about it, and the two things you can
            do to it — the file, what she wrote, what is already on
            record, and the expiry that must be typed before "verify"
            is even possible. */}
        {item ? (
          <SideScreen
            title={docTypeLabel(t, item.type)}
            sub={staff(item.staffId).name + " · " + staff(item.staffId).dept}
            width={640}
            onClose={() => { setDeciding(null); setShowReject(false); }}
            footer={
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {item.readable === false ? (
                  <Button kind="primary" size="sm" iconLeft="arrow" onClick={() => setShowReject(true)}>{t("hrc3.v.menu.reject")}</Button>
                ) : (
                  <React.Fragment>
                    <Button
                      kind="primary" size="sm" iconLeft="check" disabled={!canVerify}
                      onClick={canVerify ? () => setConfirmItem(item) : (e) => e.preventDefault()}
                      title={!canVerify ? (!isOpened ? t("hrc3.v.menu.verifyDisabledUnopened") : t("hrc3.v.menu.verifyDisabledExpiry")) : undefined}
                    >{t("hrc3.v.menu.verify")}</Button>
                    <Button kind="secondary" size="sm" onClick={() => setShowReject((v) => !v)}>{t("hrc3.v.menu.reject")}</Button>
                  </React.Fragment>
                )}
                <Button kind="ghost" size="sm" onClick={() => { setDeciding(null); setShowReject(false); }}>{t("hrc3.v.decide.later")}</Button>
              </div>
            }
          >
            {item.restricted ? <RestrictedBanner style={{ marginBottom: 14 }} /> : null}

            <div style={{ marginBottom: 16 }}>
              <StatusMark role="late" word={t("hrc3.v.decide.waiting")} glyph="clock" />
              <div style={ty("caption", { color: c.inkFaint, marginTop: 8 })}>{t("hrc3.v.det.requestedBy", { who: t("hrc3.v.who." + item.requesterKey.split(".")[1]), date: dmy(t, item.raisedDue) })}</div>
              <div style={ty("caption", { color: c.inkFaint, marginTop: 2 })}>{t("hrc3.v.det.age", { n: Math.abs(daysFrom(item.submittedOn)) })}</div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={ty("caption", { color: c.inkMuted, marginBottom: 4 })}>{t("hrc3.v.det.employeeNote")}</div>
              {item.noteText ? (
                <div style={{ background: c.sunken, borderRadius: G3.r.md, padding: "10px 12px" }}>
                  <p style={ty("small", { margin: 0, color: c.ink })}>{item.noteText}</p>
                </div>
              ) : <p style={ty("small", { margin: 0, color: c.inkFaint })}>{t("hrc3.v.det.noNote")}</p>}
            </div>

            {/* what is live against what arrived */}
            <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 240px", minWidth: 0, border: "1px solid " + c.border, borderRadius: G3.r.md, padding: 13 }}>
                <div style={ty("caption", { color: c.inkMuted, fontWeight: 700, marginBottom: 8 })}>{t("hrc3.v.det.onRecord")}</div>
                {item.onRecord.verified ? (
                  <React.Fragment>
                    <p style={ty("small", { margin: "0 0 6px", color: c.ink })}>{t("hrc3.v.det.onRecord.verifiedBy", { who: t("hrc3.v.who." + item.onRecord.verifiedByKey.split(".")[1]), date: dmy(t, item.onRecord.verifiedOn) })}</p>
                    <p style={ty("caption", { margin: 0, color: item.onRecord.valid && daysFrom(item.onRecord.valid) < 0 ? c.absentText : c.inkFaint })}>
                      {item.onRecord.valid ? t("hrc3.v.det.onRecord.validTo", { date: dmy(t, item.onRecord.valid) }) : t("hrc3.v.det.onRecord.noExpiry")}
                    </p>
                  </React.Fragment>
                ) : <p style={ty("small", { margin: 0, color: c.inkFaint })}>{t("hrc3.v.det.onRecord.none")}</p>}
              </div>
              <div style={{ flex: "1 1 240px", minWidth: 0, border: "1px solid " + c.accent, borderRadius: G3.r.md, padding: 13 }}>
                <div style={ty("caption", { color: c.action, fontWeight: 700, marginBottom: 8 })}>{t("hrc3.v.det.submitted")}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span aria-hidden="true" style={{ display: "flex", color: c.inkMuted }}><Icon name="document" size={16} /></span>
                  <span style={ty("small", { color: c.ink })}>{t("hrc3.v.det.file")}</span>
                </div>
                {item.readable === false ? (
                  <p style={ty("caption", { margin: 0, color: c.absentText })}>{t("hrc3.v.det.fileUnreadable")}</p>
                ) : (
                  <React.Fragment>
                    <Button kind="secondary" size="sm" iconLeft="scan" onClick={() => openItem(item.id)}>{t("hrc3.v.det.open")}</Button>
                    <p style={ty("caption", { margin: "8px 0 0", color: isOpened ? c.presentText : c.inkMuted })}>{isOpened ? t("hrc3.v.det.opened") : t("hrc3.v.det.notOpened")}</p>
                    {item.restricted ? <p style={ty("caption", { margin: "4px 0 0", color: c.inkFaint })}>{t("hrc3.v.det.viewLogged")}</p> : null}
                  </React.Fragment>
                )}
              </div>
            </div>

            {needsExpiry && item.readable !== false ? (
              <div style={{ background: c.sunken, borderRadius: G3.r.md, padding: 14, marginBottom: 14 }}>
                <div style={ty("caption", { color: c.ink, fontWeight: 700, marginBottom: 10 })}>{t("hrc3.v.det.expiryTitle")}</div>
                <Field id={"iss-" + item.id} label={t("hrc3.v.det.issuedLabel")}>
                  <Input id={"iss-" + item.id} value={issuedInput[item.id] || ""} onChange={(v) => setIssuedInput((cur) => Object.assign({}, cur, { [item.id]: v }))} placeholder="DD MMM YYYY" />
                </Field>
                <Field id={"exp-" + item.id} label={t("hrc3.v.det.expiresLabel")} hint={!hasExpiry ? t("hrc3.v.det.expiresHint") : undefined}>
                  <Input id={"exp-" + item.id} value={expiresInput[item.id] || ""} onChange={(v) => setExpiresInput((cur) => Object.assign({}, cur, { [item.id]: v }))} placeholder="DD MMM YYYY" />
                </Field>
                {item.restricted ? (
                  <Field id={"agy-" + item.id} label={t("hrc3.v.det.agencyLabel")} hint={t("hrc3.v.det.agencyHint")}>
                    <Input id={"agy-" + item.id} value={agencyInput[item.id] || ""} onChange={(v) => setAgencyInput((cur) => Object.assign({}, cur, { [item.id]: v }))} placeholder="" />
                  </Field>
                ) : null}
              </div>
            ) : null}

            {showReject ? <RejectForm onCancel={() => setShowReject(false)} onConfirm={(reasonText) => doReject(item, reasonText)} /> : null}
          </SideScreen>
        ) : null}

        {confirmItem ? (
          <ConfirmDialog
            title={t("hrc3.v.confirm.title")}
            body={t("hrc3.v.confirm.body", { name: staff(confirmItem.staffId).name, type: docTypeLabel(t, confirmItem.type) })}
            confirmLabel={t("hrc3.v.confirm.confirm")}
            cancelLabel={t("hrc3.v.confirm.cancel")}
            onConfirm={() => doVerify(confirmItem)}
            onCancel={() => setConfirmItem(null)}
          />
        ) : null}
      </div>
    );
  }

  function RejectForm({ onCancel, onConfirm }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [reason, setReason] = useState("");
    const [note, setNote] = useState("");
    const REASON_LABELS = {
      illegible: t("hrc3.v.reject.illegible"), wrongDoc: t("hrc3.v.reject.wrongDoc"),
      expired: t("hrc3.v.reject.expired"), nameMismatch: t("hrc3.v.reject.nameMismatch"), other: t("hrc3.v.reject.other"),
    };
    return (
      <div style={{ background: c.sunken, borderRadius: G3.r.lg, padding: 14, marginTop: 14 }}>
        <h4 style={ty("small", { margin: "0 0 10px", color: c.ink, fontWeight: 700 })}>{t("hrc3.v.reject.title")}</h4>
        <Field id="hrc3-reject-reason" label={t("hrc3.v.reject.reasonLabel")}>
          <Select id="hrc3-reject-reason" value={reason} onChange={setReason} options={[{ value: "", label: t("hrc3.v.reject.reasonPh") }].concat(Object.keys(REASON_LABELS).map((k) => ({ value: k, label: REASON_LABELS[k] })))} />
        </Field>
        <Field id="hrc3-reject-note" label={t("hrc3.v.reject.noteLabel")} hint={!reason ? t("hrc3.v.reject.required") : undefined}>
          <Input id="hrc3-reject-note" value={note} onChange={setNote} placeholder={t("hrc3.v.reject.notePh")} />
        </Field>
        <div style={{ display: "flex", gap: 10 }}>
          <Button
            kind="primary" size="sm" disabled={!reason}
            onClick={reason ? () => onConfirm(note || REASON_LABELS[reason]) : (e) => e.preventDefault()}
          >{t("hrc3.v.reject.confirm")}</Button>
          <Button kind="secondary" size="sm" onClick={onCancel}>{t("hrc3.v.reject.cancel")}</Button>
        </div>
      </div>
    );
  }

  /* ============================================================
     5 · HR-11 · EXPIRY WATCHLIST
     ============================================================ */
  /* ONE ROW, OPENED. The watchlist and the board are lists whose
     actions live in a ⋯ menu, which made their rows look clickable
     and do nothing (designer, 2026-09-28: "I am unable to click on
     rows of the table"). A row now opens what it is — the facts, and
     the same actions the menu carries, as buttons. */
  function ItemSheet({ title, sub, facts, note, actions, onClose }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    return (
      <SideScreen
        title={title} sub={sub} width={560} onClose={onClose}
        footer={
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {actions}
            <Button kind="ghost" size="sm" onClick={onClose}>{t("hrc3.sheet.close")}</Button>
          </div>
        }
      >
        {facts.filter(Boolean).map((f, i) => (
          <div
            key={f.k}
            style={{ display: "flex", gap: 14, alignItems: "baseline", padding: "9px 0", borderTop: i ? "1px solid " + c.rule : "none" }}
          >
            <span style={ty("caption", { color: c.inkFaint, width: 150, flexShrink: 0 })}>{f.k}</span>
            <span style={ty("small", { color: c.ink, flex: 1, minWidth: 0 })}>{f.v}</span>
          </div>
        ))}
        {note ? <p style={ty("caption", { margin: "16px 0 0", paddingTop: 12, borderTop: "1px solid " + c.rule, color: c.inkFaint })}>{note}</p> : null}
      </SideScreen>
    );
  }

  function ExpiryWatchlist({ onGoToVerify, campus }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [kind, setKind] = useState("all");
    const [leadDays, setLeadDays] = useState("30");
    const [acks, setAcks] = useState({});
    const [toast, setToast] = useState(null);
    const [openId, setOpenId] = useState(null);
    const [certFor, setCertFor] = useState(null);

    const rows = useMemo(() => {
      return WATCH_SEED
        .filter((w) => inCampus(campus, staff(w.staffId).campus))
        .filter((w) => kind === "all" || kind === w.kind)
        .map((w) => Object.assign({ days: daysFrom(w.date), tier: tierFor(daysFrom(w.date)) }, w))
        .sort((a, b) => a.days - b.days);
    }, [campus, kind]);

    function ack(id, days) {
      const until = new Date(toDate(TODAY).getTime() + days * 86400000);
      setAcks((cur) => Object.assign({}, cur, { [id]: [String(until.getDate()), String(until.getMonth() + 1).padStart(2, "0"), String(until.getFullYear())] }));
    }
    function raise(w) {
      setToast(t("hrc3.w.action.raiseDocDone", { name: staff(w.staffId).name, type: docTypeLabel(t, w.type) }));
    }
    function exportCsv() {
      const scope = campus === "both" ? t("hrc3.scopeAll") : campusLabel(t, campus);
      setToast(t("hrc3.w.export.done", { n: rows.length, scope: scope }));
    }

    const openItem = openId ? rows.filter((w) => w.id === openId)[0] : null;

    const columns = [
      { key: "item", label: t("hrc3.w.col.item") },
      { key: "person", label: t("hrc3.w.col.person") },
      { key: "date", label: t("hrc3.w.col.date"), mono: true },
      { key: "state", label: t("hrc3.w.col.state") },
      { key: "act", label: t("hrc3.w.col.actions"), align: "right", width: 56 },
    ];

    const dataRows = rows.map((w) => {
      const s = staff(w.staffId);
      const snoozed = acks[w.id] || w.snoozedUntil;
      const stMark = (
        <StatusMark
          role={w.tier === "expired" ? "absent" : w.tier === "month" ? "late" : w.tier === "term" ? "ltEL" : "off"}
          glyph={w.tier === "expired" ? "alert" : w.tier === "later" ? "check" : "clock"}
          word={t("hrc3.w.tier." + w.tier)}
        />
      );
      const menuItems = [];
      if (w.kind === "doc" && w.type === "police") {
        /* nobody is asked for a police verification: it is done at a
           station and the certificate is added here */
        menuItems.push({ key: "cert", icon: "document", label: t("hrc3.w.action.addCert"), onSelect: () => setCertFor(w) });
      } else if (w.kind === "doc") {
        menuItems.push(w.inProgress
          ? { key: "inProgress", icon: "clock", label: t("hrc3.w.action.inProgress"), disabled: true, reason: t("hrc3.w.action.inProgressReason") }
          : { key: "raise", icon: "document", label: t("hrc3.w.action.raiseDoc"), onSelect: () => raise(w) });
      } else {
        menuItems.push({ key: "renewal", icon: "briefcase", label: t("hrc3.w.action.renewal"), onSelect: () => onGoToVerify && onGoToVerify(null) });
      }
      menuItems.push({ key: "snooze7", icon: "clock", label: t("hrc3.w.action.snooze7"), disabled: w.tier === "expired", reason: w.tier === "expired" ? t("hrc3.w.action.snoozeDisabled") : undefined, onSelect: () => ack(w.id, 7) });
      menuItems.push({ key: "snooze14", icon: "clock", label: t("hrc3.w.action.snooze14"), disabled: w.tier === "expired", reason: w.tier === "expired" ? t("hrc3.w.action.snoozeDisabled") : undefined, onSelect: () => ack(w.id, 14) });
      menuItems.push({ key: "snooze30", icon: "clock", label: t("hrc3.w.action.snooze30"), disabled: w.tier === "expired", reason: w.tier === "expired" ? t("hrc3.w.action.snoozeDisabled") : undefined, onSelect: () => ack(w.id, 30) });

      return {
        id: w.id,
        cells: {
          item: (
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {w.restricted ? <Icon name="lock" size={13} style={{ flexShrink: 0, color: c.brass }} /> : null}
              <span style={ty("small", { color: c.ink, fontWeight: 700 })}>{w.kind === "contract" ? t("hrc3.type.contract") : docTypeLabel(t, w.type)}</span>
            </span>
          ),
          person: (
            <span style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              <Avatar name={s.name} size={26} />
              <span style={{ minWidth: 0 }}>
                <span style={ty("small", { display: "block", color: c.ink })}>{s.name}</span>
                <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 1 })}>{s.dept}</span>
              </span>
            </span>
          ),
          date: dmy(t, w.date),
          state: (
            <span style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
              {stMark}
              <span style={ty("caption", { color: c.inkFaint })}>{w.days < 0 ? overdueWord(t, Math.abs(w.days)) : daysWord(t, w.days)}</span>
              {snoozed ? <span style={ty("caption", { color: c.offText })}>{t("hrc3.w.snoozedUntil", { date: dmy(t, snoozed) })}</span> : null}
            </span>
          ),
          act: <span style={{ display: "flex", justifyContent: "flex-end" }}><ActionMenu ariaLabel={docTypeLabel(t, w.kind === "contract" ? "contract" : w.type) + " · " + s.name} items={menuItems} /></span>,
        },
      };
    });

    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, marginBottom: 10, flexWrap: "wrap" }}>
          <div style={{ minWidth: 0 }}>
            <h1 style={ty("h1", { margin: 0, color: c.ink })}>{t("hrc3.w.title")}</h1>
            <p style={ty("small", { color: c.inkFaint, margin: "8px 0 0", maxWidth: 760 })}>{t("hrc3.w.note")}</p>
          </div>
          <Button kind="secondary" size="sm" iconLeft="download" onClick={exportCsv}>{t("hrc3.w.export")}</Button>
        </div>

        {toast ? (
          <div style={{ background: c.presentTint, color: c.presentText, borderRadius: G3.r.md, padding: "10px 14px", marginBottom: 16 }}>
            <span style={ty("small", { fontWeight: 600 })}>{toast}</span>
          </div>
        ) : null}

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 16, alignItems: "flex-end" }}>
          <FilterField label={t("hrc3.w.filter.kind")}>
            <Select id="hrc3-w-kind" value={kind} onChange={setKind} options={[
              { value: "all", label: t("hrc3.w.filter.kindAll") },
              { value: "doc", label: t("hrc3.w.filter.kindDoc") },
              { value: "contract", label: t("hrc3.w.filter.kindContract") },
            ]} />
          </FilterField>
          <FilterField label={t("hrc3.w.leadLabel")} minWidth={220}>
            <Select id="hrc3-w-lead" value={leadDays} onChange={setLeadDays} options={[
              { value: "14", label: t("hrc3.w.leadDays14") },
              { value: "30", label: t("hrc3.w.leadDays30") },
              { value: "60", label: t("hrc3.w.leadDays60") },
              { value: "90", label: t("hrc3.w.leadDays90") },
            ]} />
          </FilterField>
        </div>
        <p style={ty("caption", { color: c.inkFaint, margin: "-8px 0 16px" })}>{t("hrc3.w.leadNote")}</p>

        {dataRows.length === 0 ? (
          <Card><EmptyState head={t("hrc3.w.reg.empty.head")} body={t("hrc3.w.reg.empty.body")} compact /></Card>
        ) : (
          <Register
            columns={columns} rows={dataRows}
            onSelect={(id) => setOpenId(id)}
            footer={<span style={ty("caption", { color: c.inkFaint, maxWidth: 720 })}>{t("hrc3.w.footNote")}</span>}
          />
        )}

        {openItem ? (
          <ItemSheet
            title={openItem.kind === "contract" ? t("hrc3.type.contract") : docTypeLabel(t, openItem.type)}
            sub={staff(openItem.staffId).name + " · " + staff(openItem.staffId).dept}
            onClose={() => setOpenId(null)}
            facts={[
              { k: t("hrc3.w.col.date"), v: dmy(t, openItem.date) },
              { k: t("hrc3.w.col.state"), v: openItem.days < 0 ? overdueWord(t, Math.abs(openItem.days)) : daysWord(t, openItem.days) },
              { k: t("hrc3.w.col.person"), v: staff(openItem.staffId).name + " · " + campusLabel(t, staff(openItem.staffId).campus) },
              acks[openItem.id] ? { k: t("hrc3.sheet.snoozed"), v: dmy(t, acks[openItem.id]) } : null,
              openItem.restricted ? { k: t("hrc3.sheet.restricted"), v: t("hrc3.restricted.banner") } : null,
            ]}
            note={t("hrc3.w.footNote")}
            actions={
              openItem.kind === "doc" && openItem.type === "police"
                ? <Button kind="primary" size="sm" iconLeft="document" onClick={() => { setOpenId(null); setCertFor(openItem); }}>{t("hrc3.w.action.addCert")}</Button>
                : openItem.kind === "doc" && !openItem.inProgress
                  ? <Button kind="primary" size="sm" iconLeft="document" onClick={() => { raise(openItem); setOpenId(null); }}>{t("hrc3.w.action.raiseDoc")}</Button>
                  : <Button kind="secondary" size="sm" iconLeft="briefcase" onClick={() => { setOpenId(null); onGoToVerify && onGoToVerify(null); }}>{t("hrc3.w.action.renewal")}</Button>
            }
          />
        ) : null}

        {certFor ? (
          <CertDialog
            name={staff(certFor.staffId).name}
            onCancel={() => setCertFor(null)}
            onDone={(v) => {
              setToast(t("hrc3.b.record.done", { name: staff(certFor.staffId).name, date: v.expires }));
              setCertFor(null);
            }}
          />
        ) : null}
      </div>
    );
  }

  /* ============================================================
     6 · HR-12 · VERIFICATION & CHILD-SAFETY BOARD
     ============================================================ */
  function ChildSafetyBoard({ campus }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [category, setCategory] = useState("all");
    const [contactOnly, setContactOnly] = useState(false);
    const [recordFor, setRecordFor] = useState(null);
    const [flagFor, setFlagFor] = useState(null);
    const [flagReason, setFlagReason] = useState("");
    const [toast, setToast] = useState(null);
    const [openId, setOpenId] = useState(null);

    const rows = useMemo(() => {
      const scoped = STAFF
        .filter((s) => inCampus(campus, s.campus))
        .filter((s) => category === "all" || s.cat === category)
        .filter((s) => !contactOnly || s.contact);
      /* priority: uncleared-with-contact, uncleared-without-contact,
         cleared-but-urgent (expiring), fully clear-and-distant last */
      const rank = { expired: 0, missing: 1, pending: 2, new_joiner: 3, expiring_month: 4, expiring_term: 5, verified: 6 };
      return scoped
        .map((s) => Object.assign({ staff: s }, BGV[s.id]))
        .sort((a, b) => {
          const ra = rank[a.state] - (a.staff.contact ? 0.5 : 0);
          const rb = rank[b.state] - (b.staff.contact ? 0.5 : 0);
          return ra - rb;
        });
    }, [campus, category, contactOnly]);

    const openRow = openId ? rows.filter((r) => r.staff.id === openId)[0] : null;
    const uncleared = rows.filter((r) => r.state === "expired" || r.state === "missing" || r.state === "pending" || r.state === "new_joiner");
    const unclearedContact = uncleared.filter((r) => r.staff.contact);
    const scopeLabel = campus === "both" ? t("hrc3.scopeAll") : campusLabel(t, campus);

    function record(row, v) {
      setToast(t("hrc3.b.record.done", { name: row.staff.name, date: v.expires }));
      setRecordFor(null);
    }
    function flag(row) {
      setToast(t("hrc3.b.flag.done", { name: row.staff.name }));
      setFlagFor(null); setFlagReason("");
    }
    function exportReg() {
      setToast(t("hrc3.b.export.done", { n: rows.length, scope: scopeLabel }));
    }

    const columns = [
      { key: "person", label: t("hrc3.b.col.person") },
      { key: "category", label: t("hrc3.b.col.category") },
      { key: "contact", label: t("hrc3.b.col.contact") },
      { key: "state", label: t("hrc3.b.col.state") },
      { key: "date", label: t("hrc3.b.col.date"), mono: true },
      { key: "act", label: t("hrc3.b.col.actions"), align: "right", width: 56 },
    ];

    const STATE_ROLE = {
      verified: "present", expiring_month: "late", expiring_term: "ltEL",
      expired: "absent", missing: "missing", pending: "ltEL", new_joiner: "ltEL",
    };
    const STATE_GLYPH_MAP = {
      verified: "check", expiring_month: "clock", expiring_term: "clock",
      expired: "alert", missing: "alert", pending: "scan", new_joiner: "clock",
    };

    const dataRows = rows.map((r) => {
      const s = r.staff;
      const dateNode = r.state === "expired" ? t("hrc3.b.date.expiredOn", { date: dmy(t, r.valid) })
        : r.state === "new_joiner" ? t("hrc3.b.date.dueOn", { date: dmy(t, r.requestDue) })
        : r.valid ? t("hrc3.b.date.validTo", { date: dmy(t, r.valid) })
        : t("hrc3.b.date.none");

      /* ONE ACTION, ON EVERY ROW. Adding the certificate is the only
         thing this board does to a person: renewing it, clearing an
         expiry and recording a first check are all the same act with
         the same piece of paper behind them. */
      const menuItems = [
        { key: "record", icon: "document", label: t("hrc3.b.menu.record"), onSelect: () => setRecordFor(r) },
      ];
      menuItems.push(
        r.state === "expired" || r.state === "missing"
          ? { key: "flag", icon: "alert", label: t("hrc3.b.menu.flag"), onSelect: () => setFlagFor(r) }
          : { key: "flag", icon: "alert", label: t("hrc3.b.menu.flag"), disabled: true, reason: t("hrc3.b.menu.flagDisabled") }
      );

      return {
        id: s.id,
        cells: {
          person: (
            <span style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              <Avatar name={s.name} size={28} />
              <span style={{ minWidth: 0 }}>
                <span style={ty("small", { display: "block", color: c.ink, fontWeight: 700 })}>{s.name}</span>
                <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 1 })}>{s.dept} · {s.code}</span>
              </span>
            </span>
          ),
          category: <Chip bg={c.sunken} fg={c.inkMuted}>{t("hrc3.b.cat." + s.cat)}</Chip>,
          contact: <span style={ty("small", { color: s.contact ? c.ink : c.inkFaint, fontWeight: s.contact ? 700 : 500 })}>{s.contact ? t("hrc3.b.contact.yes") : t("hrc3.b.contact.no")}</span>,
          state: <StatusMark role={STATE_ROLE[r.state]} glyph={STATE_GLYPH_MAP[r.state]} word={t("hrc3.b.state." + r.state)} />,
          date: dateNode,
          act: <span style={{ display: "flex", justifyContent: "flex-end" }}><ActionMenu ariaLabel={s.name} items={menuItems} /></span>,
        },
      };
    });

    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, marginBottom: 14, flexWrap: "wrap" }}>
          <div style={{ minWidth: 0 }}>
            <h1 style={ty("h1", { margin: 0, color: c.ink })}>{t("hrc3.b.title")}</h1>
          </div>
          <Button kind="secondary" size="sm" iconLeft="download" onClick={exportReg}>{t("hrc3.b.export")}</Button>
        </div>

        {toast ? (
          <div style={{ background: c.presentTint, color: c.presentText, borderRadius: G3.r.md, padding: "10px 14px", marginBottom: 16 }}>
            <span style={ty("small", { fontWeight: 600 })}>{toast}</span>
          </div>
        ) : null}

        {/* HEADLINE — the one figure that leads, stated for THIS scope */}
        {uncleared.length === 0 ? (
          <Card fill={c.brassSoft} border={c.brassBorder} style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span aria-hidden="true" style={{ display: "flex", color: c.brass }}><Icon name="check" size={26} /></span>
              <div>
                <div style={ty("h2", { margin: 0, color: c.brass })}>{t("hrc3.b.headline.clear", { n: num(rows.length) })}</div>
                <div style={ty("caption", { color: c.brass, marginTop: 4 })}>{t("hrc3.b.headline.scope")}</div>
              </div>
            </div>
          </Card>
        ) : (
          <Card fill={c.accentSoft} border={c.border} style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span aria-hidden="true" style={{ display: "flex", color: c.action }}><Icon name="alert" size={26} /></span>
              <div>
                <div style={ty("h2", { margin: 0, color: c.action })}>{t("hrc3.b.headline.gaps", { n: num(uncleared.length), total: num(rows.length) })}</div>
                {unclearedContact.length > 0 ? <div style={ty("small", { color: c.action, marginTop: 4, fontWeight: 700 })}>{t("hrc3.b.headline.contact", { n: num(unclearedContact.length) })}</div> : null}
                <div style={ty("caption", { color: c.inkMuted, marginTop: 4 })}>{t("hrc3.b.headline.scope")}</div>
              </div>
            </div>
          </Card>
        )}

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 16, alignItems: "flex-end" }}>
          <FilterField label={t("hrc3.b.filter.category")}>
            <Select id="hrc3-b-category" value={category} onChange={setCategory} options={[
              { value: "all", label: t("hrc3.b.filter.categoryAll") },
              { value: "teaching", label: t("hrc3.b.filter.category.teaching") },
              { value: "non_teaching", label: t("hrc3.b.filter.category.non_teaching") },
              { value: "support", label: t("hrc3.b.filter.category.support") },
              { value: "guest", label: t("hrc3.b.filter.category.guest") },
            ]} />
          </FilterField>
          <div style={{ display: "flex", alignItems: "center", paddingBottom: 8 }}>
            <Switch checked={contactOnly} onChange={setContactOnly} id="hrc3-b-contactOnly" label={t("hrc3.b.filter.contactOnly")} />
          </div>
        </div>

        {dataRows.length === 0 ? (
          <Card><EmptyState head={t("hrc3.b.reg.empty.head")} body={t("hrc3.b.reg.empty.body")} compact /></Card>
        ) : (
          <Register
            columns={columns} rows={dataRows}
            onSelect={(id) => setOpenId(id)}
            footer={<span style={ty("caption", { color: c.inkFaint, maxWidth: 780 })}>{t("hrc3.b.footNote")}</span>}
          />
        )}

        {openRow ? (
          <ItemSheet
            title={openRow.staff.name}
            sub={openRow.staff.dept + " · " + openRow.staff.code}
            onClose={() => setOpenId(null)}
            facts={[
              { k: t("hrc3.b.col.state"), v: t("hrc3.b.state." + openRow.state) },
              { k: t("hrc3.b.col.category"), v: t("hrc3.b.cat." + openRow.staff.cat) },
              { k: t("hrc3.b.col.contact"), v: openRow.staff.contact ? t("hrc3.b.contact.yes") : t("hrc3.b.contact.no") },
              { k: t("hrc3.b.col.date"), v: openRow.valid ? dmy(t, openRow.valid) : openRow.requestDue ? dmy(t, openRow.requestDue) : t("hrc3.b.date.none") },
            ]}
            note={t("hrc3.restricted.banner")}
            actions={
              <Button kind="primary" size="sm" iconLeft="document" onClick={() => { setOpenId(null); setRecordFor(openRow); }}>{t("hrc3.b.menu.record")}</Button>
            }
          />
        ) : null}

        {recordFor ? (
          <CertDialog
            name={recordFor.staff.name}
            onCancel={() => setRecordFor(null)}
            onDone={(v) => record(recordFor, v)}
          />
        ) : null}

        {flagFor ? (
          <ConfirmDialog
            title={t("hrc3.b.flag.title")}
            body={t("hrc3.b.flag.body")}
            confirmLabel={t("hrc3.b.flag.confirm")}
            cancelLabel={t("hrc3.b.flag.cancel")}
            confirmDisabled={!flagReason.trim()}
            onConfirm={() => flag(flagFor)}
            onCancel={() => { setFlagFor(null); setFlagReason(""); }}
          >
            <Field id="hrc3-flag-reason" label={t("hrc3.b.flag.reasonLabel")} hint={!flagReason.trim() ? t("hrc3.b.flag.required") : undefined}>
              <Input id="hrc3-flag-reason" value={flagReason} onChange={setFlagReason} placeholder={t("hrc3.b.flag.reasonPh")} />
            </Field>
          </ConfirmDialog>
        ) : null}
      </div>
    );
  }

  /* ============================================================
     7 · TOP-LEVEL — Rail + Tabs holding the three screens
     ============================================================ */
  /* ============================================================
     DOC CONTROL — the whole document surface, 2026-09-25.

     It used to be two rail items. "Doc control" held the request
     queue (HR-09) and "Compliance" held verification, expiries and
     the child-safety board (HR-10/11/12) — but a document, the
     request that fetched it, the check that accepted it and the date
     it lapses are ONE object seen at four moments. Somebody looking
     for an expired certificate had to know which of two modules the
     designers had filed it under, and the two even drew the same
     "waiting to be checked" list twice, differently.

     One module, four tabs, in the order the work happens:
       Requests → To check → Expiries → Child safety
     ============================================================ */
  function DocControl({ role, onNavigate }) {
    const { c } = useTheme();
    const { t, ty, lang } = useLang();
    const L = G3.layout;
    const [campus, setCampus] = useState("indiranagar");
    const [tab, setTab] = useState("requests");
    const [jumpItemId, setJumpItemId] = useState(null);
    /* where a jump into the decision screen came from, so it can offer
       a named return rather than a Close that lands on the queue */
    const [from, setFrom] = useState(null);
    const TABS_ID = "hrc3-tabs";

    function goToVerify(itemId, origin) { setJumpItemId(itemId || null); setFrom(origin || null); setTab("verify"); }
    function goToBoard() { setTab("board"); }
    function goBack() { if (!from) return; const f = from; setFrom(null); setJumpItemId(null); setTab(f); }

    const Requests = window.Pages3 && window.Pages3.DocRequests;

    const TAB_ITEMS = [
      { key: "requests", label: t("dc3.tab.requests") },
      { key: "verify", label: t("hrc3.tab.verify") + " (" + num(QUEUE_SEED.length) + ")" },
      { key: "watch", label: t("hrc3.tab.watch") + " (" + num(WATCH_SEED.length) + ")" },
      { key: "board", label: t("hrc3.tab.board") },
    ];

    return (
      <div className="nv3" style={{ display: "flex", minHeight: "100vh", background: c.page, color: c.ink, fontFamily: G3.font.ui }}>
        <Rail role={role || "hr"} active="hrDocs" onNavigate={onNavigate} initials="MI" />
        <main style={{ flex: 1, minWidth: 0, position: "relative", overflowX: "clip" }}>
          <div style={{ position: "relative", zIndex: 1, maxWidth: L.contentMax, margin: "0 auto", padding: "22px " + L.contentPadX + "px 56px" }}>
            <TopStrip campus={campus} onCampus={setCampus} />

            <div style={{ marginBottom: 18 }}>
              <h1 style={ty("display", { margin: 0, color: c.ink })}>{t("dc3.title")}</h1>
            </div>

            <Tabs items={TAB_ITEMS} active={tab} onChange={(k) => { setFrom(null); setJumpItemId(null); setTab(k); }} ariaLabel={t("dc3.tabs.aria")} idBase={TABS_ID} />

            {/* lazy: exactly one <TabPanel> in the DOM at a time (kit.jsx's
                Tabs only sets aria-controls on the active tab, so a panel
                that isn't current has no reason to exist in the
                accessibility tree at all) */}
            {tab === "requests" ? (
              <TabPanel idBase={TABS_ID} tabKey="requests" style={{ marginTop: 20 }}>
                {Requests
                  ? <Requests campus={campus} onNavigate={onNavigate} onGoVerify={() => goToVerify(null)} toVerifyCount={QUEUE_SEED.length} />
                  : null}
              </TabPanel>
            ) : null}
            {tab === "verify" ? (
              <TabPanel idBase={TABS_ID} tabKey="verify" style={{ marginTop: 20 }}>
                {from ? (
                  <div style={{ marginBottom: 14 }}>
                    <LinkButton onClick={goBack}>{t("hrc3.v.back." + from)}</LinkButton>
                  </div>
                ) : null}
                <VerifyResponses campus={campus} onGoToBoard={goToBoard} jumpItemId={jumpItemId} />
              </TabPanel>
            ) : null}
            {tab === "watch" ? (
              <TabPanel idBase={TABS_ID} tabKey="watch" style={{ marginTop: 20 }}>
                <ExpiryWatchlist campus={campus} onGoToVerify={(id) => goToVerify(id, "watch")} />
              </TabPanel>
            ) : null}
            {tab === "board" ? (
              <TabPanel idBase={TABS_ID} tabKey="board" style={{ marginTop: 20 }}>
                <ChildSafetyBoard campus={campus} />
              </TabPanel>
            ) : null}
          </div>
        </main>
      </div>
    );
  }

  window.Pages3 = window.Pages3 || {};
  /* one module, under the rail key Doc control. The old
     `hrCompliance` route still resolves here so a saved link does not
     die (v3.html), but there is no second rail item any more. */
  window.Pages3.DocControl = DocControl;
  window.Pages3.HRCompliance = DocControl;
  window.Pages3.HRDocs = DocControl;
})();
