/* @jsxRuntime classic */
/* ============================================================
   Naveya — HR Operator · Helpdesk · window.Pages3.HRHelp

   HR-31 · HELPDESK QUEUE     — "which staff questions need answering,
                                  and which are breaching SLA?"
   HR-32 · TICKET DETAIL      — "what is this issue, and how do we
                                  close it?" (rendered as the queue's
                                  own detail pane, exactly as HRDocs/
                                  HR-09 already does for document
                                  requests — a row selects, the right
                                  column is the record)
   HR-33 · CATEGORIES & SLA   — "what can staff raise, who owns it,
                                  and how fast must we answer?" (setup)

   SPEC. docs/screen-inventory.md HR-31/32/33 — every action in their
   tables is implemented, refused-with-a-reason, or deliberately
   absent (see the per-menu comments). Read against
   docs/development-specification.md:
     M15.1 §Business rules  — configurable categories; auto-assignment
        by category; SLA/TAT with escalation on breach; grievance
        access-restricted, confidential, PII never logged; internal
        comments hidden from the raiser; every transition audited.
     M15.1 §Workflow        — raise → auto-assign → in_progress
        (comments) → resolved → closed (or reopened); SLA runs from
        raise, PAUSES per policy, escalates on breach.
     M15.1 §Permissions     — helpdesk.raise (self), helpdesk.manage
        (HR/admin scope), grievance gated to a RESTRICTED role,
        distinct from general helpdesk.manage.
     §6.11 HelpdeskTicket/TicketComment — category, priority, assignee,
        sla_due_at, status enum; comment is_internal.

   A SCHOOL HELPDESK IS NOT A CORPORATE ONE. A ticket here is a salary
   discrepancy, a rejected leave request, a document a teacher cannot
   produce — never a bug report. So: (1) list surfaces never carry a
   ticket's body — category + subject-as-topic + state only; (2) HR's
   replies are written the way documents.jsx and hr.jsx write to
   employees — plain, warm, specific about what happens next, never
   corporate-support-desk voice; (3) categories are configuration
   about ROUTING and TIME, never a place a diagnosis or a grievance's
   substance lives — HR-33 stores no ticket content, ever.

   TWO DECISIONS WORTH READING BEFORE YOU TOUCH THIS FILE:

   1. THE RESTRICTED-ROLE GAP (flagged, not invented around). M15.1
      names a role for grievance access DISTINCT from general
      `hr.helpdesk.manage` — kit.jsx's permission model has no such
      permission; every "hr" login carries the same one grant. This
      file treats Meera Iyer (the one HR persona this whole build
      renders) as the designated restricted-role holder, because
      M15.1 §Actors names "HR/Admin (triage, resolve)" and a
      single-HR-operator school needs a real person answering
      grievances — but the UI still marks every grievance ticket
      "Restricted — confidential handling" (glyph + word, DESIGN 8),
      because a real build MUST gate this behind its own permission,
      not fold it into helpdesk.manage. Promotion/gap note repeated
      in the file-end SELF-CHECK.

   2. NO CAMPUS SCOPE (a deliberate, spec-silent choice). HR-31/32/33
      never named a campus dimension, but the designer asked for one
      on 2026-10-13 and every ticket already carried its raiser's
      campus. The switch is page-level and scopes the ticket list
      before the three segments count themselves. Categories are
      NOT scoped: an SLA is school-wide. Categories are staff-questions
      routing config (IT/HR/payroll/facilities/grievance), which reads
      as school-wide, not per-campus — so a CATEGORY is never scoped.
      Each ticket still names its raiser's campus in the
      detail pane (context is never hidden), it just isn't a scope
      control. Flagged in the dispatch report as a silent-spec choice.

   CLOCK. Tuesday 11 August 2026, 3:00pm (TODAY_ISO / NOW_HOUR) — the
   same date every v3 HR file anchors to. SLA state (comfortable / at
   risk / breached / paused / met-on-time / met-late) is COMPUTED from
   each ticket's raised timestamp and its category's configured SLA,
   never hand-set — see hoursBetween/slaStateFor. Nothing is raised,
   replied to, resolved or escalated after this instant.

   ROSTER REUSE. Ananya Rao (NAV-0142, PGT Physics — the same person
   hr-record.jsx already links to this screen), Rohit Malhotra
   (NAV-0161, guest faculty Sanskrit — his rejected address-proof
   document from hr.jsx's DOC_QUEUE q9 is the reason he raises a
   ticket here), Meenakshi Pillai (NAV-0088, Head of Science),
   Divya Prakash (NAV-0199), Kavya Nair (NAV-0207), Farah Sheikh
   (NAV-0233, on probation), Suresh Kamath (NAV-0176), Sunita Kulkarni
   (NAV-0031, Payroll — payroll's maker elsewhere in this build),
   Ramesh Iyengar (NAV-0034, Facilities in-charge), Rajan Pillai (HR,
   named in hr.jsx), Radhika Menon (Principal, named in
   hr-leaveatt.jsx). No staff ID is reused for a different person.

   Composed only from window.G3 / window.UI3. kit.jsx, tokens.jsx,
   screens.jsx and every sibling pages/*.jsx are untouched by this
   file. Local primitives are defined here because the kit lacks them
   and the kit is out of scope for this dispatch — promotion
   candidates are listed in the file-end SELF-CHECK comment.
   ============================================================ */
(function () {
  const G3 = window.G3;
  const UI = window.UI3;
  const { useState, useMemo, useEffect, useRef } = React;
  const {
    useTheme, ThemeToggle, useLang, addStrings,
    Rail, Motif, Card, Register, Button, LinkButton, Chip, StatusMark,
    Icon, EmptyState, Field, Input, Select, Switch, Tabs, TabPanel,
    SideScreen, Avatar, num, Band,
    CampusSwitch, campusLabel, inCampus, CAMPUS_ALL,
  } = UI;

  /* ============================================================
     STRINGS — hhd.* is this dispatch's whole namespace. EN and HI
     carry exactly the same key set; every demo value — names,
     subjects, replies, reasons, dates — is authored in both
     languages (mock content that stays English is the i18n leak this
     system keeps re-finding).
     ============================================================ */
  addStrings({
    en: {
      /* --- shared chrome --- */
      "hhd.mo.1": "Jan", "hhd.mo.2": "Feb", "hhd.mo.3": "Mar", "hhd.mo.4": "Apr",
      "hhd.mo.5": "May", "hhd.mo.6": "Jun", "hhd.mo.7": "Jul", "hhd.mo.8": "Aug",
      "hhd.mo.9": "Sep", "hhd.mo.10": "Oct", "hhd.mo.11": "Nov", "hhd.mo.12": "Dec",
      "hhd.act.cancel": "Cancel",
      "hhd.act.close": "Close",
      "hhd.dismiss": "Dismiss",
      "hhd.reason.label": "Reason",
      "hhd.reason.hint": "Recorded against your name, with the time, on the ticket's trail.",
      "hhd.reason.missing": "A reason is required before this can be confirmed.",
      "hhd.reason.short": "Say a little more — a one-word reason will not help whoever reads this later.",

      /* --- page head + tabs --- */
      "hhd.pageTitle": "Helpdesk",
      "hhd2.where.you": "Waiting on you",
      "hhd2.where.them": "Waiting on them",
      "hhd2.where.answered": "Answered",
      "hhd2.waiting": "{n} days so far",
      "hhd2.waiting0": "asked today",
      "hhd2.waiting1": "1 day so far",
      "hhd2.urgent": "Urgent",
      "hhd2.col.who": "Who asked",
      "hhd2.col.about": "What about",
      "hhd2.col.last": "Last word",
      "hhd2.col.state": "Where it is",
      "hhd2.last.none": "Nobody has replied",
      "hhd2.q.foot": "Oldest first. A row opens the conversation.",
      "hhd2.reg.title": "Questions from staff",
      "hhd2.reg.sub": "{shown} of {total} questions on the desk",
      "hhd2.f.where": "Whose move",
      "hhd2.f2.youNote": "{name}, {n} days",
      "hhd2.f2.youNone": "nobody is waiting on you",
      "hhd2.f2.themNote": "{name} the oldest",
      "hhd2.f2.themNone": "nothing is with a member of staff",
      "hhd2.f2.doneNote": "last {name}",
      "hhd2.f2.doneNone": "none answered yet",
      "hhd2.f2.late": "Past the promise",
      "hhd2.f2.lateNote": "{name} the furthest past it",
      "hhd2.f2.lateNone": "every one is inside its time",
      "hhd2.f.search": "Find",
      "hhd2.f.searchPh": "A name, or a word from what they asked",
      "hhd2.f.about": "What about",
      "hhd2.f.aboutAll": "Everything",
      "hhd2.f.with": "With",
      "hhd2.f.nobody": "Nobody yet",
      "hhd2.empty.you.head": "Nothing is waiting on you",
      "hhd2.empty.you.body": "Everything staff have asked has an answer or is back with them.",
      "hhd2.empty.them.head": "Nothing is with them",
      "hhd2.empty.them.body": "You have not asked anybody for something back.",
      "hhd2.empty.answered.head": "Nothing answered yet",
      "hhd2.empty.answered.body": "Answered questions collect here so you can point at what was said.",
      "hhd2.thread.head": "The conversation",
      "hhd2.thread.you": "you",
      "hhd2.thread.internal": "Only HR sees this",
      "hhd2.restricted": "Confidential. Keep names out of anything you write here that is not already on the record, and do not forward it.",
      "hhd2.reply.label": "Write back to {name}",
      "hhd2.reply.labelInternal": "A note for HR only",
      "hhd2.reply.ph": "Say what you have found and what happens next\u2026",
      "hhd2.reply.phInternal": "Something the office needs to know and {name} should not read\u2026",
      "hhd2.reply.internalToggle": "Keep it internal \u2014 {name} never sees it",
      "hhd2.reply.needToggle": "I need something back from {name}",
      "hhd2.reply.note": "They get it as a notification and on their own Requests screen.",
      "hhd2.reply.noteInternal": "It stays on the thread for HR and never reaches the person who asked.",
      "hhd2.reply.noteNeed": "It moves to Waiting on them until they answer, so it stops sitting on your list.",
      "hhd2.reply.err": "Write something first.",
      "hhd2.reply.send": "Send the reply",
      "hhd2.reply.done": "Sent to {name}.",
      "hhd2.reply.doneInternal": "Noted for HR. {name} cannot see it.",
      "hhd2.act.answered": "Mark it answered",
      "hhd2.act.reopen": "Open it again",
      "hhd2.act.pass": "Pass it to someone",
      "hhd2.act.close": "Close",
      "hhd2.answered.title": "Mark it answered",
      "hhd2.answered.body": "{name} is told it is answered and can reopen it if it was not. It moves off your list either way.",
      "hhd2.answered.done": "Answered. {name} has been told.",
      "hhd2.reopen.title": "Open it again",
      "hhd2.reopen.body": "It comes back onto your list and {name} is told you are looking at it again.",
      "hhd2.reopen.done": "Open again, and {name} has been told.",
      "hhd2.pass.title": "Pass it to someone",
      "hhd2.pass.body": "They become the person it is waiting on. The whole thread goes with it, internal notes included.",
      "hhd2.pass.who": "Who takes it",
      "hhd2.pass.done": "Passed to {who}. {name} has not been told \u2014 the answer still comes from the school.",
      "hhd2.cats.title": "What staff can raise",
      "hhd2.cats.sub": "The list a teacher picks from, and where each choice goes.",
      "hhd2.cats.open.cta": "What staff can raise",
      "hhd2.cats.goesTo": "Goes to {who}",
      "hhd2.cats.goesNowhere": "Goes to nobody yet",
      "hhd2.cats.within": "answered within {n}",
      "hhd2.cats.open": "{n} open",
      "hhd2.cats.none": "nothing open",
      "hhd2.cats.noOwnerWarn": "Anything raised under this lands unassigned and waits for somebody to pick it up.",
      "hhd2.cats.add": "Add something they can raise",
      "hhd2.cats.added": "Staff can now raise \u201c{name}\u201d.",
      "hhd2.cats.foot": "A category decides who a question reaches and how fast the school has promised to answer. It holds nothing a person wrote.",
      "hhd2.asked.t1": "My August payslip is about two thousand short of July and I cannot see which part changed. Same hours, no leave. Could somebody look before the next run?",
      "hhd2.asked.t2": "The address proof you asked for is in my father's name and I cannot get it changed before the deadline. What else can I send?",
      "hhd2.asked.t3": "I applied for three days at the end of the month and it is still showing as pending. Is something wrong with the dates I picked?",
      "hhd2.asked.t4": "My laptop will not connect to the staff Wi-Fi since Monday. It says the password is wrong; the same one works on my phone.",
      "hhd2.asked.t5": "The ceiling fan in Room 8B has stopped. The children in that corner cannot sit through the afternoon period.",
      "hhd2.asked.t6": "I would like to raise something about how a colleague has spoken to me in front of students. I would rather it stayed with you for now.",
      "hhd2.asked.t7": "The transport allowance is still missing from my payslip. It was put right last month and it has gone again this month.",
      "hhd.tab.queue": "Queue",
      "hhd.tab.setup": "Categories & SLA",
      "hhd.tabsAria": "Helpdesk sections",

      /* --- time phrasing (computed, never hand-set) --- */
      "hhd.time.hours": "{n} hours",
      "hhd.time.oneHour": "1 hour",
      "hhd.time.days": "{n} days",
      "hhd.time.oneDay": "1 day",
      "hhd.time.aboutDays": "about {n} days",

      /* --- SLA state words (never colour alone — always this word
             plus a glyph, StatusMark's own rule) --- */
      "hhd.sla.comfortable": "On track — due in {t}",
      "hhd.sla.atRisk": "Due soon — {t} left",
      "hhd.sla.breached": "Breaching SLA — {t} over",
      "hhd.sla.paused": "Paused — waiting on {name}",
      "hhd.sla.metOnTime": "Resolved in {t}, inside the {sla} promise",
      "hhd.sla.metLate": "Resolved in {t}, past the {sla} promise",
      "hhd.sla.unset": "No response-time promise is set for this category",
      "hhd.sla.unassigned": "Unassigned",

      /* --- HR-31 · queue --- */
      "hhd.q.title": "What needs an answer",
      "hhd.q.note": "Oldest and most-breaching first. A ticket's own content never shows here — open it for the thread.",
      "hhd.q.banner": "{count} tickets are breaching their SLA",
      "hhd.q.filter.status": "Status",
      "hhd.q.filter.statusDefault": "Open + in progress",
      "hhd.q.filter.statusAll": "Every status",
      "hhd.q.filter.category": "Category",
      "hhd.q.filter.categoryAll": "All categories",
      "hhd.q.filter.assignee": "Assignee",
      "hhd.q.filter.assigneeAll": "Anyone",
      "hhd.q.filter.assigneeUnassigned": "Unassigned only",
      "hhd.q.filter.age": "Age",
      "hhd.q.filter.ageAll": "Any age",
      "hhd.q.filter.age2": "2+ days old",
      "hhd.q.filter.age5": "5+ days old",
      "hhd.q.filter.breachedOnly": "SLA-breached only",

      "hhd.q.col.select": "Select",
      "hhd.q.col.ticket": "Ticket",
      "hhd.q.col.priority": "Priority",
      "hhd.q.col.assignee": "Assignee",
      "hhd.q.col.sla": "SLA",
      "hhd.q.col.age": "Age",
      "hhd.q.col.actions": "Actions",

      "hhd.q.selectRow": "Select the ticket {subject}",
      "hhd.q.selectAll": "Select every visible ticket",
      "hhd.q.selectedCount1": "1 ticket selected",
      "hhd.q.selectedCountN": "{count} tickets selected",
      "hhd.q.bulkAssign": "Bulk assign",
      "hhd.q.bulkAssignNeedTwo": "Select at least 2 tickets to bulk-assign.",
      "hhd.q.bulkClear": "Clear selection",
      "hhd.q.bulkExcluded": "{count} restricted ticket(s) in your selection are excluded — assign those individually.",
      "hhd.q.rowRestrictedCheck": "Restricted — assign individually",

      "hhd.q.priority.low": "Low",
      "hhd.q.priority.normal": "Normal",
      "hhd.q.priority.high": "High",

      "hhd.q.menu.aria": "Actions for {subject}",
      "hhd.q.menu.assign": "Assign",
      "hhd.q.menu.reassign": "Reassign",
      "hhd.q.menu.escalate": "Escalate",
      "hhd.q.menu.setPriority": "Set priority: {p}",
      "hhd.q.menu.alreadyPriority": "Already at this priority",
      "hhd.q.menu.closedWhy": "This ticket is closed",
      "hhd.q.open": "Open the ticket {subject}",

      "hhd.q.empty.head": "Nothing matches these filters",
      "hhd.q.empty.body": "Try widening the status filter, or turn off “SLA-breached only” — most days, most tickets are not breaching.",
      "hhd.q.allClear.head": "Nothing is waiting on you",
      "hhd.q.allClear.body": "Every open ticket has an answer in motion. A good day looks exactly like this.",
      "hhd.q.footNote": "Grievance tickets route to the restricted handler only and are never bulk-actioned — see each one individually.",

      "hhd.q.gone.head": "Pick a ticket",
      "hhd.q.gone.body": "Choose a row on the left — its full thread, and the actions open to it, appear here.",

      /* --- HR-32 · ticket detail --- */
      "hhd.d.restrictedBanner": "Restricted — confidential handling",
      "hhd.d.restrictedNote": "Only the designated grievance handler can see this ticket. Its subject and thread are confidential and never logged with identifying detail.",
      "hhd.d.raisedBy": "Raised by",
      "hhd.d.raisedOn": "Raised on {date}",
      "hhd.d.category": "Category",
      "hhd.d.priority": "Priority",
      "hhd.d.assignee": "Assignee",
      "hhd.d.slaTarget": "SLA promise",
      "hhd.d.slaTargetLine": "{h}, {basis} — v{v}, set by {who} on {date}",
      "hhd.d.basis.business": "business hours",
      "hhd.d.basis.calendar": "calendar hours",

      "hhd.d.thread": "Thread",
      "hhd.d.public": "Public reply",
      "hhd.d.internal": "Internal note — hidden from {name}",
      "hhd.d.noThread": "No replies yet.",

      "hhd.d.composer.toggleLabel": "Internal note (never shown to {name})",
      "hhd.d.composer.placeholderPublic": "Write what {name} will actually read…",
      "hhd.d.composer.placeholderInternal": "A note for whoever picks this up next — {name} will never see this…",
      "hhd.d.composer.pauseLabel": "This needs something back from {name} — pause the SLA clock until they reply",
      "hhd.d.composer.sendPublic": "Send the reply",
      "hhd.d.composer.saveInternal": "Save the internal note",
      "hhd.d.composer.closedNote": "This ticket is closed. Reopen it to add to the thread.",
      "hhd.d.composer.textRequired": "Write something before sending — an empty reply helps nobody.",
      "hhd.d.composer.sentFlash": "Reply sent to {name}.",
      "hhd.d.composer.sentPausedFlash": "Reply sent to {name}; the SLA clock is paused until they answer.",
      "hhd.d.composer.savedFlash": "Internal note saved — {name} will not see this.",

      "hhd.d.assign.title": "{verb} this ticket",
      "hhd.d.assign.label": "Assignee",
      "hhd.d.assign.confirm": "Confirm assignment",
      "hhd.d.assign.flash": "Assigned to {who}.",
      "hhd.d.assign.reasonHint": "Optional — a line for the trail (e.g. “owns the category” or “covering while Sunita is out”).",

      "hhd.d.escalate.title": "Escalate this ticket",
      "hhd.d.escalate.body": "Escalation notifies the person you choose and is recorded on the trail. It does not change who owns the ticket.",
      "hhd.d.escalate.label": "Escalate to",
      "hhd.d.escalate.confirm": "Confirm escalation",
      "hhd.d.escalate.flash": "Escalated to {who}.",
      "hhd.d.escalate.reasonHint": "Optional — say why, so {who} isn't starting cold.",
      "hhd.d.escalate.already": "Already escalated to {who} on {date}",

      "hhd.d.resolve.button": "Resolve",
      "hhd.d.resolve.title": "Resolve this ticket",
      "hhd.d.resolve.summaryLabel": "Resolution summary — required",
      "hhd.d.resolve.summaryHint": "What was done, in words {name} will read. This becomes part of the record.",
      "hhd.d.resolve.summaryPh": "e.g. Confirmed the HRA slab was applied correctly from July; nothing further owed.",
      "hhd.d.resolve.summaryMissing": "A resolution summary is required before this can be resolved.",
      "hhd.d.resolve.confirm": "Confirm — mark resolved",
      "hhd.d.resolve.flash": "Marked resolved. {name} has been notified and may reopen it.",
      "hhd.d.resolve.needsAssignee": "Assign the ticket before it can be resolved.",

      "hhd.d.close.button": "Close",
      "hhd.d.close.title": "Close this ticket",
      "hhd.d.close.body": "Closing accepts the resolution as final. {name} can still reopen it within the reopen window.",
      "hhd.d.close.confirm": "Confirm — close",
      "hhd.d.close.flash": "Closed.",
      "hhd.d.close.needsResolved": "Resolve the ticket first.",

      "hhd.d.reopen.button": "Reopen",
      "hhd.d.reopen.title": "Reopen this ticket",
      "hhd.d.reopen.reasonLabel": "Reason — required",
      "hhd.d.reopen.reasonPh": "What is still unresolved?",
      "hhd.d.reopen.confirm": "Confirm — reopen",
      "hhd.d.reopen.flash": "Reopened. The SLA clock has restarted from now.",
      "hhd.d.reopen.window": "Reopen window: within 7 calendar days of closing [proposed] — {n} day(s) used.",
      "hhd.d.reopen.windowClosed": "The reopen window has passed [proposed]. Raise a new, linked ticket instead.",

      "hhd.d.category.button": "Change category",
      "hhd.d.category.title": "Change this ticket's category",
      "hhd.d.category.label": "New category",
      "hhd.d.category.applyBtn": "Apply the category change",
      "hhd.d.category.into": "Moving this to {cat} restricts it immediately \u2014 colleagues who can see it now will lose sight of it. Switching back does not undo it.",
      "hhd.d.category.outOf": "This ticket is restricted. Moving it out of {cat} makes it visible to the wider queue.",
      "hhd.d.category.flash": "Category changed to {cat}. The SLA promise and assignee were re-derived from the new category.",
      "hhd.d.category.sameWhy": "Already in this category",

      "hhd.d.link.title": "Related records — [proposed]",
      "hhd.d.link.body": "Not yet a live link in this build — shown here so the connection is visible, not clickable.",
      "hhd.d.link.none": "Nothing linked yet.",

      "hhd.d.trail.title": "History",
      "hhd.d.trail.raised": "Raised by {who}",
      "hhd.d.trail.assigned": "Assigned to {who}",
      "hhd.d.trail.escalated": "Escalated to {who}",
      "hhd.d.trail.priority": "Priority set to {p}",
      "hhd.d.trail.publicReply": "Public reply sent by {who}",
      "hhd.d.trail.internalNote": "Internal note added by {who}",
      "hhd.d.trail.paused": "SLA paused by {who} — awaiting {name}",
      "hhd.d.trail.resolved": "Resolved by {who}",
      "hhd.d.trail.closed": "Closed by {who}",
      "hhd.d.trail.reopened": "Reopened by {who}",
      "hhd.d.trail.categoryChanged": "Category changed to {cat} by {who}",

      /* --- HR-33 · categories & SLA --- */
      "hhd.s.title": "Categories & SLA",
      "hhd.s.note": "What staff can raise, who owns each queue, and how fast we answer. Configuration \u2014 no ticket content lives here.",
      "hhd.s.add": "Add a category",
      "hhd.s.col.name": "Category",
      "hhd.s.col.owner": "Owner / queue",
      "hhd.s.col.sla": "SLA promise",
      "hhd.s.col.escalation": "Escalation",
      "hhd.s.col.state": "State",
      "hhd.s.col.actions": "Actions",

      "hhd.s.seeded": "Seeded default · v{v}, {date}",
      "hhd.s.customised": "Customised · v{v}, by {who}, {date}",
      "hhd.s.restrictedNote": "Restricted · v{v}, by {who}, {date}",
      "hhd.s.noOwner": "No owner assigned",
      "hhd.s.noOwnerWhy": "Tickets raised in this category cannot be routed until an owner is set.",
      "hhd.s.slaUnset": "SLA not set",
      "hhd.s.slaUnsetWhy": "No response-time promise exists for this category — the queue's whole point is silently switched off for it.",
      "hhd.s.inUse": "In use — {n} open ticket(s)",
      "hhd.s.noOpen": "No open tickets right now",
      "hhd.s.deactivated": "Deactivated — hidden from staff",
      "hhd.s.restrictedTag": "Restricted",
      "hhd.s.escalation": "{who} at {pct}% elapsed",
      "hhd.s.escalationNone": "No escalation target set",

      "hhd.s.menu.editSla": "Edit SLA",
      "hhd.s.menu.deactivate": "Deactivate",
      "hhd.s.menu.deactivateBlocked": "{n} open ticket(s) — deactivate once they're closed",

      "hhd.s.add.title": "Add a category",
      "hhd.s.add.nameLabel": "Name",
      "hhd.s.add.namePh": "e.g. Transport",
      "hhd.s.add.nameMissing": "A name is required.",
      "hhd.s.add.ownerLabel": "Owner / queue — required",
      "hhd.s.add.ownerPh": "Choose an owner",
      "hhd.s.add.ownerMissing": "Choose an owner before this can be added — an ownerless category strands its tickets.",
      "hhd.s.add.slaLabel": "SLA hours",
      "hhd.s.add.slaPh": "e.g. 24 — left blank on purpose, there is no default",
      "hhd.s.add.slaHint": "Deliberately blank. There is no default — a category ships with whatever promise you set, or none at all.",
      "hhd.s.add.slaUnsetWarn": "Left blank: this category will have no response-time promise until you set one. Staff can still raise into it.",
      "hhd.s.add.basisLabel": "Counted in",
      "hhd.s.add.basisBusiness": "Business hours (default)",
      "hhd.s.add.basisCalendar": "Calendar hours",
      "hhd.s.add.escalateLabel": "Escalate to (optional)",
      "hhd.s.add.escalateNone": "No escalation target",
      "hhd.s.add.thresholdLabel": "Escalate at (% of SLA elapsed)",
      "hhd.s.add.thresholdPh": "e.g. 80",
      "hhd.s.add.restrictedLabel": "Restricted — grievance-style confidential handling",
      "hhd.s.add.restrictedHint": "Off by default. Restricting an existing category later is a Group Admin action; this applies at creation only.",
      "hhd.s.add.submit": "Add the category",
      "hhd.s.add.flash": "{name} added. Effective immediately for new tickets.",

      "hhd.s.editSla.title": "Edit the SLA for {name}",
      "hhd.s.editSla.effLabel": "Effective from",
      "hhd.s.editSla.note": "Applies to tickets raised on or after this date. The {n} already open keep their due time unless you change each one.",
      "hhd.s.editSla.confirm": "Confirm — update the SLA",
      "hhd.s.editSla.flash": "SLA updated for {name} — now v{v}.",

      "hhd.s.deactivate.title": "Deactivate {name}",
      "hhd.s.deactivate.body": "Staff can no longer raise a new ticket here. Existing history is untouched, and you can turn it back on.",
      "hhd.s.deactivate.confirm": "Confirm — deactivate",
      "hhd.s.deactivate.flash": "{name} deactivated.",

      "hhd.s.restrictedAbsentNote": "Restricting or un-restricting an existing category is a Group Admin action, held at group scope — it is not offered here.",

      /* --- category names --- */
      "hhd.cat.it": "IT",
      "hhd.cat.hr": "HR query",
      "hhd.cat.payroll": "Payroll",
      "hhd.cat.facilities": "Facilities",
      "hhd.cat.grievance": "Grievance / confidential",
      "hhd.cat.transport": "Transport",

      /* --- people --- */
      "hhd.who.meera": "Meera Iyer",
      "hhd.who.meera.role": "HR Operator",
      "hhd.who.sunita": "Sunita Kulkarni",
      "hhd.who.sunita.role": "Payroll",
      "hhd.who.ramesh": "Ramesh Iyengar",
      "hhd.who.ramesh.role": "Facilities in-charge",
      "hhd.who.rajan": "Rajan Pillai",
      "hhd.who.rajan.role": "HR",
      "hhd.who.radhika": "Radhika Menon",
      "hhd.who.radhika.role": "Principal",
      "hhd.who.itdesk": "IT Support Desk",
      "hhd.who.itdesk.role": "Shared queue",
      "hhd.who.ga": "Rohan Kapoor",
      "hhd.who.ga.role": "Group Admin",
      "hhd.who.seed": "Seeded at setup",
      "hhd.who.none": "— none yet —",

      "hhd.who.ananya": "Ananya Rao",
      "hhd.who.ananya.desig": "PGT, Physics",
      "hhd.who.rohit": "Rohit Malhotra",
      "hhd.who.rohit.desig": "Guest faculty, Sanskrit",
      "hhd.who.meenakshi": "Meenakshi Pillai",
      "hhd.who.meenakshi.desig": "Head of Science",
      "hhd.who.divya": "Divya Prakash",
      "hhd.who.divya.desig": "Front office executive",
      "hhd.who.kavya": "Kavya Nair",
      "hhd.who.kavya.desig": "PRT, Class III",
      "hhd.who.farah": "Farah Sheikh",
      "hhd.who.farah.desig": "NTT, Pre-primary",
      "hhd.who.suresh": "Suresh Kamath",
      "hhd.who.suresh.desig": "Accounts executive",

      /* --- ticket subjects + thread content (demo, both languages) --- */
      "hhd.tk.t1.subject": "Payslip variance — August",
      "hhd.tk.t1.c1": "Looking into this against the August run now — I'll have an answer for you by Friday.",
      "hhd.tk.t1.c2": "HRA slab changed for her category this cycle. Need the engine's sign-off before quoting a number, so we don't correct it twice.",

      "hhd.tk.t2.subject": "What proof can I send instead of the address proof?",
      "hhd.tk.t2.c1": "A notarised affidavit or a recent utility bill with your current address both work. Send whichever is easier and I'll update it today.",

      "hhd.tk.t3.subject": "Question about my leave request",
      "hhd.tk.t3.c1": "The dates fall inside the Term-1 exam blackout, so it needs Anjali's override rather than an approval. I've flagged it to her.",

      "hhd.tk.t4.subject": "Laptop won't connect to the staff Wi-Fi",
      "hhd.tk.t4.c1": "Settings > Wi-Fi > Forget, then reconnect with the staff password on the noticeboard. That cleared it on two other laptops this week.",

      "hhd.tk.t5.subject": "Classroom fan not working — Room 8B",
      "hhd.tk.t5.c1": null,

      "hhd.tk.t6.subject": "A workplace conduct concern",
      "hhd.tk.t6.c1": "Spoken with her directly. A second colleague is involved, unnamed until I've heard both sides. Escalating to Radhika only if I cannot resolve it.",

      "hhd.tk.t7.subject": "Payslip — the transport allowance is still missing",
      "hhd.tk.t7.reopenReason": "The transport allowance is still missing from my August draft — the July fix didn't carry forward.",
      "hhd.tk.t7.c1": "You're right, it didn't carry forward automatically — re-adding it now and it will show correctly in the next draft.",
    },

  });

  /* ============================================================
     CLOCK + DATE HELPERS — same shape as hr-leaveatt.jsx's, extended
     with an hour component because SLA state needs sub-day precision.
     Nothing below hand-types an elapsed/remaining figure; every one is
     computed from a raised timestamp, a category's configured SLA,
     and this instant.
     ============================================================ */
  const TODAY_ISO = "2026-08-11";
  const NOW_HOUR = 15; /* 3pm — the demo instant every ticket is evaluated against */
  function parseISO(s) { const p = s.split("-"); return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2])); }
  function withHour(iso, hour) { const d = parseISO(iso); d.setHours(hour || 0, 0, 0, 0); return d; }
  const NOW_DT = withHour(TODAY_ISO, NOW_HOUR);
  function hoursBetween(fromISO, fromHour, toDt) { return Math.round((toDt - withHour(fromISO, fromHour)) / 3600000); }
  function fmt(t, iso) { const d = parseISO(iso); return d.getDate() + " " + t("hhd.mo." + (d.getMonth() + 1)) + " " + d.getFullYear(); }

  /* a category's display name — seeded/built-in categories carry an
     i18n key (nameKey); a category added at runtime via "Add a
     category" carries a free-text `name` typed by the operator
     instead (there is no i18n key for a string that did not exist
     until she typed it). Every render site reads through this helper
     rather than calling t(cat.nameKey) directly, so a user-added
     category never shows a raw i18n key or a blank label. */
  function catName(t, cat) { return cat && cat.nameKey ? t(cat.nameKey) : (cat ? cat.name : ""); }

  /* "4 days" / "20 hours" / "about 2 days" — precise under a day,
     rounded (and said as "about") once we are talking in days. */
  function hoursToWords(t, h, approx) {
    const ah = Math.max(0, Math.round(h));
    if (ah < 24) return ah <= 1 ? t("hhd.time.oneHour") : t("hhd.time.hours", { n: ah });
    const d = Math.round(ah / 24);
    if (approx) return t("hhd.time.aboutDays", { n: d });
    return d <= 1 ? t("hhd.time.oneDay") : t("hhd.time.days", { n: d });
  }
  function slaHoursToWords(t, h) {
    if (h == null) return t("hhd.sla.unset");
    if (h < 24) return t("hhd.time.hours", { n: h });
    const d = Math.round(h / 24);
    return d === 1 ? t("hhd.time.oneDay") : t("hhd.time.days", { n: d });
  }

  /* ============================================================
     CONFIGURATION — HR-33's categories. Effective-dated and
     attributed: every row carries a version and who set it, never a
     bare SLA number floating free of that (dispatch non-negotiable).
     Business-vs-calendar-hours is stored as data; this mock's own
     elapsed-time arithmetic uses calendar hours throughout (a real
     build's business-hours engine is a backend concern) — see the
     SELF-CHECK note at the file's end.
     ============================================================ */
  const CATEGORIES_SEED = [
    { id: "it", nameKey: "hhd.cat.it", ownerKey: "hhd.who.itdesk", slaHours: 8, basis: "calendar",
      escalateToKey: "hhd.who.meera", escalateThresholdPct: 80, restricted: false,
      seeded: true, version: 1, setByKey: "hhd.who.seed", setOnISO: "2026-01-05", active: true },
    { id: "hr", nameKey: "hhd.cat.hr", ownerKey: "hhd.who.meera", slaHours: 24, basis: "business",
      escalateToKey: "hhd.who.rajan", escalateThresholdPct: 80, restricted: false,
      seeded: true, version: 1, setByKey: "hhd.who.seed", setOnISO: "2026-01-05", active: true },
    { id: "payroll", nameKey: "hhd.cat.payroll", ownerKey: "hhd.who.sunita", slaHours: 24, basis: "business",
      escalateToKey: "hhd.who.rajan", escalateThresholdPct: 80, restricted: false,
      seeded: false, version: 2, setByKey: "hhd.who.meera", setOnISO: "2026-05-14", active: true },
    { id: "facilities", nameKey: "hhd.cat.facilities", ownerKey: "hhd.who.ramesh", slaHours: 48, basis: "calendar",
      escalateToKey: null, escalateThresholdPct: null, restricted: false,
      seeded: true, version: 1, setByKey: "hhd.who.seed", setOnISO: "2026-01-05", active: true },
    { id: "grievance", nameKey: "hhd.cat.grievance", ownerKey: "hhd.who.meera", slaHours: 48, basis: "business",
      escalateToKey: "hhd.who.radhika", escalateThresholdPct: 80, restricted: true,
      seeded: false, version: 1, setByKey: "hhd.who.ga", setOnISO: "2026-06-02", active: true },
    { id: "transport", nameKey: "hhd.cat.transport", ownerKey: null, slaHours: null, basis: "business",
      escalateToKey: null, escalateThresholdPct: null, restricted: false,
      seeded: false, version: 1, setByKey: "hhd.who.rajan", setOnISO: "2026-08-09", active: true },
  ];

  /* people who can own a category or be assigned/escalated to. A pool,
     not a full staff directory — helpdesk routing only. */
  const PEOPLE = [
    { key: "hhd.who.meera", roleKey: "hhd.who.meera.role" },
    { key: "hhd.who.sunita", roleKey: "hhd.who.sunita.role" },
    { key: "hhd.who.ramesh", roleKey: "hhd.who.ramesh.role" },
    { key: "hhd.who.rajan", roleKey: "hhd.who.rajan.role" },
    { key: "hhd.who.radhika", roleKey: "hhd.who.radhika.role" },
    { key: "hhd.who.itdesk", roleKey: "hhd.who.itdesk.role" },
  ];

  /* ============================================================
     TICKETS — HR-31/32's dataset. `raisedISO/raisedHour` plus each
     ticket's own status/pause/resolve/close/reopen timestamps are the
     only "facts"; every SLA word on screen is derived from them by
     slaStateFor(), never hand-set.
     ============================================================ */
  const TICKETS_SEED = [
    {
      id: "t1", categoryId: "payroll", subjectKey: "hhd.tk.t1.subject",
      raiserKey: "hhd.who.ananya", raiserDesigKey: "hhd.who.ananya.desig", raiserCampus: "indiranagar",
      priority: "high", status: "in_progress", assigneeKey: "hhd.who.sunita",
      raisedISO: "2026-08-06", raisedHour: 10,
      escalatedToKey: "hhd.who.rajan", escalatedOnISO: "2026-08-09", escalatedOnHour: 11,
      comments: [
        { id: "t1c1", authorKey: "hhd.who.sunita", isInternal: false, atISO: "2026-08-07", atHour: 9, bodyKey: "hhd.tk.t1.c1" },
        { id: "t1c2", authorKey: "hhd.who.sunita", isInternal: true, atISO: "2026-08-08", atHour: 16, bodyKey: "hhd.tk.t1.c2" },
      ],
    },
    {
      id: "t2", categoryId: "hr", subjectKey: "hhd.tk.t2.subject",
      raiserKey: "hhd.who.rohit", raiserDesigKey: "hhd.who.rohit.desig", raiserCampus: "indiranagar",
      priority: "normal", status: "in_progress", assigneeKey: "hhd.who.meera",
      raisedISO: "2026-08-07", raisedHour: 11,
      awaitingRaiser: true, pausedOnISO: "2026-08-07", pausedOnHour: 15,
      linkedDocType: "hhd.tk.t2.linkedDoc",
      comments: [
        { id: "t2c1", authorKey: "hhd.who.meera", isInternal: false, atISO: "2026-08-07", atHour: 15, bodyKey: "hhd.tk.t2.c1" },
      ],
    },
    {
      id: "t3", categoryId: "hr", subjectKey: "hhd.tk.t3.subject",
      raiserKey: "hhd.who.meenakshi", raiserDesigKey: "hhd.who.meenakshi.desig", raiserCampus: "indiranagar",
      priority: "normal", status: "in_progress", assigneeKey: "hhd.who.meera",
      raisedISO: "2026-08-10", raisedHour: 19,
      comments: [
        { id: "t3c1", authorKey: "hhd.who.meera", isInternal: false, atISO: "2026-08-11", atHour: 9, bodyKey: "hhd.tk.t3.c1" },
      ],
    },
    {
      id: "t4", categoryId: "it", subjectKey: "hhd.tk.t4.subject",
      raiserKey: "hhd.who.divya", raiserDesigKey: "hhd.who.divya.desig", raiserCampus: "whitefield",
      priority: "low", status: "closed", assigneeKey: "hhd.who.itdesk",
      raisedISO: "2026-08-04", raisedHour: 10,
      resolvedOnISO: "2026-08-04", resolvedOnHour: 15,
      closedOnISO: "2026-08-05", closedOnHour: 9,
      comments: [
        { id: "t4c1", authorKey: "hhd.who.itdesk", isInternal: false, atISO: "2026-08-04", atHour: 15, bodyKey: "hhd.tk.t4.c1" },
      ],
    },
    {
      id: "t5", categoryId: "facilities", subjectKey: "hhd.tk.t5.subject",
      raiserKey: "hhd.who.kavya", raiserDesigKey: "hhd.who.kavya.desig", raiserCampus: "indiranagar",
      priority: "normal", status: "open", assigneeKey: null,
      raisedISO: "2026-08-11", raisedHour: 9,
      comments: [],
    },
    {
      id: "t6", categoryId: "grievance", subjectKey: "hhd.tk.t6.subject",
      raiserKey: "hhd.who.farah", raiserDesigKey: "hhd.who.farah.desig", raiserCampus: "whitefield",
      priority: "high", status: "in_progress", assigneeKey: "hhd.who.meera",
      raisedISO: "2026-08-09", raisedHour: 10,
      comments: [
        { id: "t6c1", authorKey: "hhd.who.meera", isInternal: true, atISO: "2026-08-10", atHour: 9, bodyKey: "hhd.tk.t6.c1" },
      ],
    },
    {
      id: "t7", categoryId: "payroll", subjectKey: "hhd.tk.t7.subject",
      raiserKey: "hhd.who.suresh", raiserDesigKey: "hhd.who.suresh.desig", raiserCampus: "indiranagar",
      priority: "high", status: "reopened", assigneeKey: "hhd.who.sunita",
      raisedISO: "2026-07-30", raisedHour: 10,
      resolvedOnISO: "2026-08-02", resolvedOnHour: 12,
      reopenedOnISO: "2026-08-09", reopenedOnHour: 10, reopenReasonKey: "hhd.tk.t7.reopenReason",
      comments: [
        { id: "t7c1", authorKey: "hhd.who.sunita", isInternal: false, atISO: "2026-08-02", atHour: 12, bodyKey: "hhd.tk.t7.c1" },
      ],
    },
  ];

  /* ============================================================
     SLA STATE — computed. Never colour alone: every state below
     pairs a StatusMark role with a WORD carrying the elapsed/remaining
     time in it (DESIGN 8).
     ============================================================ */
  function slaStateFor(t, cat) {
    if (cat.slaHours == null) return { role: "missing", glyph: "alert", text: null, unset: true };

    const closedLike = t.status === "resolved" || t.status === "closed";
    let evalDt = NOW_DT;
    let elapsedFrom = t.raisedISO, elapsedFromHour = t.raisedHour;
    if (t.status === "reopened" && t.reopenedOnISO) { elapsedFrom = t.reopenedOnISO; elapsedFromHour = t.reopenedOnHour; }
    if (closedLike && t.resolvedOnISO) evalDt = withHour(t.resolvedOnISO, t.resolvedOnHour);
    else if (t.awaitingRaiser && t.pausedOnISO) evalDt = withHour(t.pausedOnISO, t.pausedOnHour);

    const elapsed = hoursBetween(elapsedFrom, elapsedFromHour, evalDt);
    const pct = elapsed / cat.slaHours;

    if (closedLike) {
      return elapsed <= cat.slaHours
        ? { role: "present", glyph: "check", key: "metOnTime", elapsed, breached: false }
        : { role: "absent", glyph: "alert", key: "metLate", elapsed, breached: true };
    }
    if (t.awaitingRaiser) return { role: "off", glyph: "clock", key: "paused", elapsed, breached: false, paused: true };
    if (elapsed > cat.slaHours) return { role: "absent", glyph: "alert", key: "breached", elapsed: elapsed - cat.slaHours, breached: true };
    if (pct >= 0.75) return { role: "late", glyph: "clock", key: "atRisk", elapsed: cat.slaHours - elapsed, breached: false };
    return { role: "present", glyph: "check", key: "comfortable", elapsed: cat.slaHours - elapsed, breached: false };
  }

  /* ticket "age" for the register column and the age filter — always
     from when it was raised (or reopened), regardless of SLA pausing */
  function ageHoursFor(t) {
    const from = t.status === "reopened" && t.reopenedOnISO ? t.reopenedOnISO : t.raisedISO;
    const fromHour = t.status === "reopened" && t.reopenedOnISO ? t.reopenedOnHour : t.raisedHour;
    return hoursBetween(from, fromHour, NOW_DT);
  }


  /* ============================================================
     WHERE IT IS — the only classification this screen needs.

     Not a status enum and not an SLA state: the question HR opens
     the helpdesk with is "whose move is it?". Three answers, all
     derived from data the tickets already carried.
     ============================================================ */
  function whereItIs(tk) {
    if (tk.status === "resolved" || tk.status === "closed") return "answered";
    if (tk.awaitingRaiser) return "them";
    return "you";
  }

  /* how long it has been sitting with whoever it is sitting with.
     Said in days, because "four days" is a fact a person can feel and
     "80% of a 24-hour business-hours SLA" is not. */
  function waitingDays(tk) {
    return Math.max(0, Math.round(ageHoursFor(tk) / 24));
  }
  /* two days is a school's working patience; four is a complaint */
  const NUDGE_DAYS = 2;
  const LATE_DAYS = 4;
  function urgencyOf(tk) {
    const d = waitingDays(tk);
    if (whereItIs(tk) !== "you") return { role: "off", glyph: "clock", d: d, calm: true };
    if (d >= LATE_DAYS) return { role: "absent", glyph: "alert", d: d };
    if (d >= NUDGE_DAYS) return { role: "late", glyph: "clock", d: d };
    return { role: "off", glyph: "clock", d: d, calm: true };
  }

  /* "asked today" / "1 day so far" / "5 days so far" */
  function waitedWords(t, tk) {
    const d = waitingDays(tk);
    return d === 0 ? t("hhd2.waiting0") : d === 1 ? t("hhd2.waiting1") : t("hhd2.waiting", { n: num(d) });
  }

  /* the last thing said, and by whom — the column that replaces
     assignee, age and SLA all at once */
  function lastWord(tk) {
    const cs = tk.comments || [];
    if (!cs.length) return null;
    return cs[cs.length - 1];
  }

  /* ============================================================
     LOCAL PRIMITIVES — the kit lacks these; defined here because the
     kit is out of scope for this dispatch. Promotion candidates are
     listed in the file-end SELF-CHECK.
     ============================================================ */
  function Note({ children }) {
    const { c } = useTheme(); const { ty } = useLang();
    return <p style={ty("caption", { color: c.inkFaint, margin: "10px 2px 0", maxWidth: 820 })}>{children}</p>;
  }

  function Callout({ tone, icon, title, body, children, compact }) {
    const { c } = useTheme(); const { ty } = useLang();
    const key = tone || "off";
    const tint = c[key + "Tint"] || c.sunken;
    const text = c[key + "Text"] || c.inkMuted;
    return (
      <div style={{ background: tint, border: "1px solid " + c.border, borderRadius: G3.r.lg, padding: compact ? "12px 14px" : "15px 17px", display: "flex", gap: 13, alignItems: "flex-start" }}>
        <span aria-hidden="true" style={{ color: text, display: "flex", paddingTop: 2, flexShrink: 0 }}><Icon name={icon || "alert"} size={17} /></span>
        <div style={{ minWidth: 0, flex: 1 }}>
          {title ? <div style={ty("h3", { color: text, margin: 0 })}>{title}</div> : null}
          {body ? <p style={ty("small", { color: c.ink, margin: title ? "5px 0 0" : 0 })}>{body}</p> : null}
          {children}
        </div>
      </div>
    );
  }

  function Flash({ text, onDismiss }) {
    const { c } = useTheme(); const { ty, t } = useLang();
    if (!text) return null;
    return (
      <div role="status" style={{ display: "flex", alignItems: "flex-start", gap: 11, background: c.presentTint, border: "1px solid " + c.border, borderRadius: G3.r.lg, padding: "12px 14px", marginBottom: G3.layout.gap }}>
        <span aria-hidden="true" style={{ color: c.presentText, display: "flex", paddingTop: 1 }}><Icon name="check" size={16} /></span>
        <p style={ty("small", { margin: 0, color: c.ink, flex: 1 })}>{text}</p>
        <LinkButton onClick={onDismiss}>{t("hhd.dismiss")}</LinkButton>
      </div>
    );
  }

  function TextArea({ id, value, onChange, placeholder, invalid, rows, tone }) {
    const { c } = useTheme(); const { ty } = useLang();
    return (
      <textarea
        id={id} rows={rows || 3} value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={invalid ? "true" : undefined}
        style={ty("small", {
          width: "100%", resize: "vertical", padding: "11px 13px",
          borderRadius: G3.r.md, background: tone === "brass" ? c.brassSoft : c.surface, color: c.ink,
          border: "1px solid " + (invalid ? c.danger : tone === "brass" ? c.brassBorder : c.borderStrong),
          fontFamily: "inherit",
        })}
      />
    );
  }

  function FieldError({ children }) {
    const { c } = useTheme(); const { ty } = useLang();
    if (!children) return null;
    return (
      <p role="alert" style={ty("caption", { color: c.dangerText, margin: "6px 2px 0", display: "flex", gap: 6, alignItems: "center" })}>
        <span aria-hidden="true" style={{ display: "flex" }}><Icon name="alert" size={13} /></span>{children}
      </p>
    );
  }

  /* the reason control: never hard-disables the submit that needs it —
     a disabled submit swallows the click that would reveal the error
     (a lesson this codebase learned the hard way). */
  function ReasonField({ id, label, hint, value, onChange, error, rows, placeholder }) {
    return (
      <div style={{ marginTop: 12 }}>
        <Field id={id} label={label} hint={error ? undefined : hint}>
          <TextArea id={id} value={value} onChange={onChange} invalid={!!error} rows={rows} placeholder={placeholder} />
        </Field>
        <FieldError>{error}</FieldError>
      </div>
    );
  }

  function RowCheck({ id, checked, onChange, ariaLabel, disabled }) {
    const { c } = useTheme();
    return (
      <input
        type="checkbox" id={id} checked={checked} aria-label={ariaLabel} disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        style={{ accentColor: c.accent, width: 15, height: 15, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1 }}
      />
    );
  }

  function DefRow({ label, children }) {
    const { c } = useTheme(); const { ty } = useLang();
    return (
      <div style={{ display: "flex", gap: 14, alignItems: "baseline", padding: "7px 0", borderBottom: "1px solid " + c.rule }}>
        <span style={ty("caption", { color: c.inkFaint, width: 118, flexShrink: 0 })}>{label}</span>
        <span style={ty("small", { color: c.ink, flex: 1, minWidth: 0 })}>{children}</span>
      </div>
    );
  }

  /* an attributed history — who did what, when, and why. Append-only:
     nothing that renders through this ever gets a delete affordance. */
  function Trail({ items }) {
    const { c } = useTheme(); const { ty } = useLang();
    return (
      <ol style={{ listStyle: "none", margin: "10px 0 0", padding: 0 }}>
        {items.map((it, i) => (
          <li key={it.key || i} style={{ display: "flex", gap: 12, paddingBottom: i < items.length - 1 ? 14 : 0 }}>
            <span style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
              <span aria-hidden="true" style={{ width: 22, height: 22, borderRadius: G3.r.pill, background: c.sunken, color: c.inkMuted, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={it.icon || "check"} size={12} />
              </span>
              {i < items.length - 1 ? <span aria-hidden="true" style={{ flex: 1, width: 1, background: c.rule, marginTop: 4 }} /> : null}
            </span>
            <span style={{ minWidth: 0, paddingTop: 1 }}>
              <span style={ty("small", { display: "block", color: c.ink, fontWeight: 600 })}>{it.head}</span>
              {it.body ? <span style={ty("caption", { display: "block", color: c.inkMuted, marginTop: 2 })}>{it.body}</span> : null}
              {it.meta ? <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 2 })}>{it.meta}</span> : null}
            </span>
          </li>
        ))}
      </ol>
    );
  }

  /* a centred, portal-rendered confirm dialog — for acts that must not
     be one click in a card. */
  function ConfirmDialog({ title, body, children, confirmLabel, cancelLabel, onConfirm, onCancel }) {
    const { c, shadow } = useTheme(); const { ty, lang } = useLang();
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
        <div aria-hidden="true" onClick={onCancel} style={{ position: "absolute", inset: 0, background: G3.dark.page, opacity: 0.55 }} />
        <div
          ref={boxRef} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}
          className="nv3"
          style={{
            position: "relative", width: "min(560px, 100%)", maxHeight: "88vh", overflowY: "auto",
            background: c.surface, color: c.ink, border: "1px solid " + c.border, borderRadius: G3.r.card,
            boxShadow: shadow(4), padding: G3.layout.cardPad,
            fontFamily: G3.font.ui,
          }}
        >
          <h2 style={ty("h2", { margin: 0, color: c.ink })}>{title}</h2>
          {body ? <p style={ty("small", { color: c.inkMuted, margin: "8px 0 0" })}>{body}</p> : null}
          {children}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 18, flexWrap: "wrap" }}>
            <Button kind="ghost" onClick={onCancel}>{cancelLabel}</Button>
            <Button kind="primary" onClick={onConfirm}>{confirmLabel}</Button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  /* an inline working panel inside a card — the two-step shape this
     product uses instead of committing anything on one click */
  function Panel({ title, sub, onClose, children }) {
    const { c } = useTheme(); const { ty, t } = useLang();
    return (
      <div style={{ marginTop: 14, border: "1px solid " + c.borderStrong, borderRadius: G3.r.lg, padding: 16, background: c.raised }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "flex-start" }}>
          <div style={{ minWidth: 0 }}>
            <h3 style={ty("h3", { margin: 0, color: c.ink })}>{title}</h3>
            {sub ? <p style={ty("caption", { margin: "5px 0 0", color: c.inkMuted, maxWidth: 640 })}>{sub}</p> : null}
          </div>
          {onClose ? <LinkButton onClick={onClose}>{t("hhd.act.close")}</LinkButton> : null}
        </div>
        {children}
      </div>
    );
  }

  function Actions({ children }) {
    return <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16, alignItems: "center" }}>{children}</div>;
  }

  function PriorityChip({ p }) {
    const { c } = useTheme(); const { t } = useLang();
    const map = {
      low: { bg: c.offTint, fg: c.offText, label: t("hhd.q.priority.low") },
      normal: { bg: c.ltELTint, fg: c.ltELText, label: t("hhd.q.priority.normal") },
      high: { bg: c.lateTint, fg: c.lateText, label: t("hhd.q.priority.high") },
    };
    const m = map[p] || map.normal;
    return <Chip bg={m.bg} fg={m.fg}>{m.label}</Chip>;
  }

  function RestrictedBadge({ compact }) {
    const { c } = useTheme(); const { t, ty } = useLang();
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <span aria-hidden="true" style={{ display: "flex", color: c.ink }}><Icon name="lock" size={compact ? 12 : 14} /></span>
        <span style={ty(compact ? "caption" : "small", { color: c.ink, fontWeight: 700 })}>{t("hhd.s.restrictedTag")}</span>
      </span>
    );
  }

  /* the top strip — matches Home's/Documents'/every other v3 page's
     exactly, switch included (designer, 2026-10-13: the helpdesk is
     scoped like every other module). */
  function TopStrip({ campus, onCampus }) {
    const { t } = useLang(); const { c } = useTheme();
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ fontSize: 0 }}>
          <span style={{ fontFamily: G3.font.ui, fontSize: 12.5, fontWeight: 700, color: c.ink }}>{t("nav.hrHelp")}</span>
          <span style={{ margin: "0 8px", color: c.inkFaint, fontFamily: G3.font.ui, fontSize: 12.5 }}>·</span>
          <span style={{ fontFamily: G3.font.ui, fontSize: 12.5, color: c.inkMuted }}>{t("home.school")}, {campusLabel(t, campus)}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {onCampus ? <CampusSwitch value={campus} onChange={onCampus} /> : null}
          <ThemeToggle />
        </div>
      </div>
    );
  }

  /* ============================================================
     TICKET DETAIL — HR-32, rendered as the queue's own detail pane
     (the pattern hr.jsx's HRDocs already established for HR-09).
     ============================================================ */
  /* ============================================================
     HR-32 · THE CONVERSATION, opened over the queue.

     A ticket here is a person waiting for an answer, so the screen
     is a thread and a reply box — not a record with a thread in the
     corner of it. Everything that is not the conversation (priority,
     who owns it, what it is about) is four lines at the top, said
     once, in words.
     ============================================================ */
  function Bubble({ who, role, when, body, internal, mine }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    return (
      <div style={{ padding: "14px 0", borderTop: "1px solid " + c.rule }}>
        <div style={{ display: "flex", gap: 11, alignItems: "center", flexWrap: "wrap" }}>
          <Avatar name={who} size={28} />
          <span style={{ minWidth: 0 }}>
            <span style={ty("small", { display: "block", color: c.ink, fontWeight: 600 })}>
              {who}
              {mine ? <span style={ty("caption", { color: c.inkFaint, fontWeight: 400 })}>{" \u00b7 " + t("hhd2.thread.you")}</span> : null}
            </span>
            <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 1 })}>{role}</span>
          </span>
          <span style={{ marginInlineStart: "auto", display: "flex", gap: 10, alignItems: "center" }}>
            {internal ? <StatusMark role="off" glyph="lock" word={t("hhd2.thread.internal")} /> : null}
            <span style={ty("caption", { color: c.inkFaint })}>{when}</span>
          </span>
        </div>
        <p style={ty("body", { color: c.ink, margin: "9px 0 0", paddingInlineStart: 39, maxWidth: 600 })}>{body}</p>
      </div>
    );
  }

  function TicketScreen({ tk, cat, categories, onClose, onFlash, mutators }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [reply, setReply] = useState("");
    const [internal, setInternal] = useState(false);
    const [needThem, setNeedThem] = useState(false);
    const [err, setErr] = useState("");
    const [act, setAct] = useState(null);      /* null | "answered" | "pass" */
    const [passTo, setPassTo] = useState(cat && cat.ownerKey ? cat.ownerKey : PEOPLE[0].key);

    const where = whereItIs(tk);
    const restricted = cat && cat.restricted;

    function send() {
      if (reply.trim().length < 4) { setErr(t("hhd2.reply.err")); return; }
      mutators.addComment(tk.id, { isInternal: internal, bodyText: reply.trim(), pause: needThem && !internal });
      onFlash(t(internal ? "hhd2.reply.doneInternal" : "hhd2.reply.done", { name: t(tk.raiserKey) }));
      setReply(""); setInternal(false); setNeedThem(false); setErr("");
    }

    const thread = [{
      id: "asked", who: t(tk.raiserKey), role: t(tk.raiserDesigKey), mine: false, internal: false,
      when: fmt(t, tk.raisedISO), body: t("hhd2.asked." + tk.id),
    }].concat((tk.comments || []).map((cm) => ({
      id: cm.id, who: t(cm.authorKey), role: t(cm.authorKey + ".role"), mine: cm.authorKey === "hhd.who.meera",
      internal: cm.isInternal, when: fmt(t, cm.atISO), body: cm.bodyText || t(cm.bodyKey),
    })));

    return (
      <SideScreen
        title={t(tk.subjectKey)}
        sub={t(tk.raiserKey) + " \u00b7 " + t(tk.raiserDesigKey) + " \u00b7 " + campusLabel(t, tk.raiserCampus)}
        width={680}
        onClose={onClose}
        footer={
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", width: "100%" }}>
            <Button kind="primary" size="sm" iconLeft="mail" onClick={send}>{t("hhd2.reply.send")}</Button>
            {where === "answered" ? (
              <Button kind="secondary" size="sm" iconLeft="arrow" onClick={() => setAct("reopen")}>{t("hhd2.act.reopen")}</Button>
            ) : (
              <Button kind="secondary" size="sm" iconLeft="check" onClick={() => setAct("answered")}>{t("hhd2.act.answered")}</Button>
            )}
            <Button kind="secondary" size="sm" iconLeft="staff" onClick={() => setAct("pass")}>{t("hhd2.act.pass")}</Button>
            <span style={{ marginInlineStart: "auto" }}>
              <DangerClose onClick={onClose}>{t("hhd2.act.close")}</DangerClose>
            </span>
          </div>
        }
      >
        {/* WHERE IT IS, in one line, before anything else */}
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 6 }}>
          <StatusMark
            role={where === "answered" ? "present" : urgencyOf(tk).role}
            glyph={where === "answered" ? "check" : urgencyOf(tk).glyph}
            word={t("hhd2.where." + where)}
          />
          {where !== "answered" ? <span style={ty("caption", { color: c.inkMuted })}>{waitedWords(t, tk)}</span> : null}
          {restricted ? <RestrictedBadge compact /> : null}
        </div>

        <div style={{ display: "flex", gap: 14, alignItems: "baseline", padding: "12px 0 0" }}>
          <span style={ty("caption", { color: c.inkFaint, width: 130, flexShrink: 0 })}>{t("hhd2.f.about")}</span>
          <span style={ty("small", { color: c.ink, flex: 1, minWidth: 0 })}>{catName(t, cat)}</span>
        </div>
        <div style={{ display: "flex", gap: 14, alignItems: "baseline", padding: "10px 0 0" }}>
          <span style={ty("caption", { color: c.inkFaint, width: 130, flexShrink: 0 })}>{t("hhd2.f.with")}</span>
          <span style={ty("small", { color: c.ink, flex: 1, minWidth: 0 })}>
            {tk.assigneeKey ? t(tk.assigneeKey) : t("hhd2.f.nobody")}
          </span>
        </div>

        {restricted ? (
          <div style={{ marginTop: 14 }}>
            <Callout tone="off" icon="lock" body={t("hhd2.restricted")} compact />
          </div>
        ) : null}

        {/* THE THREAD */}
        <div style={{ marginTop: 22 }}>
          <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 2 })}>{t("hhd2.thread.head")}</div>
          {thread.map((m) => (
            <Bubble key={m.id} who={m.who} role={m.role} when={m.when} body={m.body} internal={m.internal} mine={m.mine} />
          ))}
        </div>

        {/* THE REPLY */}
        <div style={{ marginTop: 22, paddingTop: 16, borderTop: "1px solid " + c.borderStrong }}>
          <Field
            id={"hhd2-reply-" + tk.id}
            label={t(internal ? "hhd2.reply.labelInternal" : "hhd2.reply.label", { name: t(tk.raiserKey) })}
            error={err || null}
          >
            <TextArea
              id={"hhd2-reply-" + tk.id} value={reply} rows={4} invalid={!!err}
              onChange={(v) => { setReply(v); setErr(""); }}
              placeholder={t(internal ? "hhd2.reply.phInternal" : "hhd2.reply.ph", { name: t(tk.raiserKey) })}
              tone={internal ? "internal" : null}
            />
          </Field>
          <div style={{ display: "flex", gap: 22, flexWrap: "wrap", marginTop: 10 }}>
            <Switch
              id={"hhd2-int-" + tk.id} checked={internal}
              onChange={(v) => { setInternal(v); if (v) setNeedThem(false); }}
              label={t("hhd2.reply.internalToggle", { name: t(tk.raiserKey) })}
            />
            {internal ? null : (
              <Switch
                id={"hhd2-need-" + tk.id} checked={needThem} onChange={setNeedThem}
                label={t("hhd2.reply.needToggle", { name: t(tk.raiserKey) })}
              />
            )}
          </div>
          <p style={ty("caption", { color: c.inkFaint, margin: "10px 0 0" })}>
            {t(internal ? "hhd2.reply.noteInternal" : needThem ? "hhd2.reply.noteNeed" : "hhd2.reply.note")}
          </p>
        </div>

        {/* the two consequential acts, each a dialog with a reason */}
        {act === "answered" ? (
          <ConfirmDialog
            title={t("hhd2.answered.title")}
            body={t("hhd2.answered.body", { name: t(tk.raiserKey) })}
            confirmLabel={t("hhd2.act.answered")} cancelLabel={t("hhd.act.cancel")}
            onCancel={() => setAct(null)}
            onConfirm={() => { mutators.resolve(tk.id, reply.trim() || null); setAct(null); onFlash(t("hhd2.answered.done", { name: t(tk.raiserKey) })); }}
          />
        ) : null}

        {act === "reopen" ? (
          <ConfirmDialog
            title={t("hhd2.reopen.title")}
            body={t("hhd2.reopen.body", { name: t(tk.raiserKey) })}
            confirmLabel={t("hhd2.act.reopen")} cancelLabel={t("hhd.act.cancel")}
            onCancel={() => setAct(null)}
            onConfirm={() => { mutators.reopen(tk.id, null); setAct(null); onFlash(t("hhd2.reopen.done", { name: t(tk.raiserKey) })); }}
          />
        ) : null}

        {act === "pass" ? (
          <ConfirmDialog
            title={t("hhd2.pass.title")}
            body={t("hhd2.pass.body")}
            confirmLabel={t("hhd2.act.pass")} cancelLabel={t("hhd.act.cancel")}
            onCancel={() => setAct(null)}
            onConfirm={() => { mutators.assign(tk.id, passTo); setAct(null); onFlash(t("hhd2.pass.done", { who: t(passTo), name: t(tk.raiserKey) })); }}
          >
            <div style={{ width: 280 }}>
              <Field id={"hhd2-pass-" + tk.id} label={t("hhd2.pass.who")}>
                <Select id={"hhd2-pass-" + tk.id} value={passTo} onChange={setPassTo}
                  options={PEOPLE.map((w) => ({ value: w.key, label: t(w.key) + " \u2014 " + t(w.roleKey) }))} />
              </Field>
            </div>
          </ConfirmDialog>
        ) : null}
      </SideScreen>
    );
  }

  /* ============================================================
     HR-33 · CATEGORIES, off the header rather than beside the work.

     What staff can raise, who it reaches, and how quickly the school
     has promised to answer. It is configuration: it belongs one click
     away, not as half the module's top-level navigation.
     ============================================================ */
  function CategoriesScreen({ categories, tickets, onClose, onFlash, mutators }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [adding, setAdding] = useState(false);
    const live = categories.filter((k) => k.active);

    function openCount(id) {
      return tickets.filter((tk) => tk.categoryId === id && whereItIs(tk) !== "answered").length;
    }

    return (
      <SideScreen
        title={t("hhd2.cats.title")}
        sub={t("hhd2.cats.sub")}
        width={620}
        onClose={onClose}
        footer={
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", width: "100%" }}>
            <Button kind="primary" size="sm" iconLeft="plus" onClick={() => setAdding(true)}>{t("hhd2.cats.add")}</Button>
            <span style={{ marginInlineStart: "auto" }}>
              <DangerClose onClick={onClose}>{t("hhd2.act.close")}</DangerClose>
            </span>
          </div>
        }
      >
        {live.map((k, i) => (
          <div key={k.id} style={{ padding: "13px 0", borderTop: "1px solid " + (i ? c.rule : c.border) }}>
            <div style={{ display: "flex", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}>
              <span style={ty("small", { color: c.ink, fontWeight: 700 })}>{catName(t, k)}</span>
              {k.restricted ? <RestrictedBadge compact /> : null}
              <span style={{ marginInlineStart: "auto" }}>
                {openCount(k.id)
                  ? <span style={ty("caption", { color: c.inkMuted })}>{t("hhd2.cats.open", { n: num(openCount(k.id)) })}</span>
                  : <span style={ty("caption", { color: c.inkFaint })}>{t("hhd2.cats.none")}</span>}
              </span>
            </div>
            <p style={ty("caption", { color: c.inkMuted, margin: "5px 0 0" })}>
              {k.ownerKey ? t("hhd2.cats.goesTo", { who: t(k.ownerKey) }) : t("hhd2.cats.goesNowhere")}
              {k.slaHours != null ? " \u00b7 " + t("hhd2.cats.within", { n: slaHoursToWords(t, k.slaHours) }) : ""}
            </p>
            {!k.ownerKey ? <Note>{t("hhd2.cats.noOwnerWarn")}</Note> : null}
          </div>
        ))}

        <p style={ty("caption", { color: c.inkFaint, margin: "20px 0 0", paddingTop: 14, borderTop: "1px solid " + c.rule })}>
          {t("hhd2.cats.foot")}
        </p>

        {adding ? (
          <AddCategoryPanel
            onClose={() => setAdding(false)}
            onSubmit={(payload) => { mutators.addCategory(payload); setAdding(false); onFlash(t("hhd2.cats.added", { name: payload.name })); }}
          />
        ) : null}
      </SideScreen>
    );
  }

  /* ============================================================
     HR-31 · THE QUEUE — four columns and a three-way sort.
     ============================================================ */
  function QueueTab({ tickets, categories, onFlash, mutators, onOpenCats }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [where, setWhere] = useState("you");
    const [cat, setCat] = useState("all");
    const [q, setQ] = useState("");
    const [openId, setOpenId] = useState(null);

    const catOf = (tk) => categories.filter((k) => k.id === tk.categoryId)[0];
    /* FOUR FIGURES, THE WAY EVERY OTHER MODULE READS (designer).
       Three of them cut the desk into whose move it is -- every
       question is in exactly one -- and the fourth counts the ones
       already past the time this school promised, which is a subset
       of the first and therefore takes no band of the bar. */
    const ofYou = tickets.filter((tk) => whereItIs(tk) === "you");
    const ofThem = tickets.filter((tk) => whereItIs(tk) === "them");
    const ofDone = tickets.filter((tk) => whereItIs(tk) === "answered");
    const counts = { you: ofYou.length, them: ofThem.length, answered: ofDone.length };
    const late = ofYou.filter((tk) => {
      const k = catOf(tk);
      return k ? !!slaStateFor(tk, k).breached : false;
    });
    const oldestYou = ofYou.slice().sort((a, b) => waitingDays(b) - waitingDays(a))[0] || null;
    const oldestThem = ofThem.slice().sort((a, b) => waitingDays(b) - waitingDays(a))[0] || null;
    const lastDone = ofDone.slice().sort((a, b) => ((a.resolvedOnISO || "") < (b.resolvedOnISO || "") ? 1 : -1))[0] || null;
    const facts = [
      { k: "you", label: t("hhd2.where.you"), value: num(counts.you), n: counts.you,
        note: oldestYou
          ? t("hhd2.f2.youNote", { name: t(oldestYou.raiserKey), n: num(waitingDays(oldestYou)) })
          : t("hhd2.f2.youNone"),
        tone: c.chartAmber, warn: counts.you > 0 },
      { k: "them", label: t("hhd2.where.them"), value: num(counts.them), n: counts.them,
        note: oldestThem ? t("hhd2.f2.themNote", { name: t(oldestThem.raiserKey) }) : t("hhd2.f2.themNone"),
        tone: c.chartBlue },
      { k: "done", label: t("hhd2.where.answered"), value: num(counts.answered), n: counts.answered,
        note: lastDone ? t("hhd2.f2.doneNote", { name: t(lastDone.raiserKey) }) : t("hhd2.f2.doneNone"),
        tone: c.chartGreen },
      { k: "late", label: t("hhd2.f2.late"), value: num(late.length), bar: false,
        note: late.length ? t("hhd2.f2.lateNote", { name: t(late[0].raiserKey) }) : t("hhd2.f2.lateNone"),
        tone: c.chartRed, warn: late.length > 0 },
    ];

    const needle = q.trim().toLowerCase();
    const rows0 = tickets.filter((tk) => {
      if (whereItIs(tk) !== where) return false;
      if (cat !== "all" && tk.categoryId !== cat) return false;
      if (needle && (t(tk.subjectKey) + " " + t(tk.raiserKey)).toLowerCase().indexOf(needle) === -1) return false;
      return true;
    }).sort((a, b) => waitingDays(b) - waitingDays(a));

    const columns = [
      { key: "who", label: t("hhd2.col.who") },
      { key: "about", label: t("hhd2.col.about") },
      { key: "cmp", label: t("kit.campus.label"), width: 140 },
      { key: "last", label: t("hhd2.col.last"), width: 220 },
      { key: "state", label: t("hhd2.col.state"), width: 200 },
    ];

    const rows = rows0.map((tk) => {
      const k = catOf(tk);
      const u = urgencyOf(tk);
      const lw = lastWord(tk);
      return {
        id: tk.id,
        live: true,
        cells: {
          who: (
            <span style={{ display: "flex", gap: 11, alignItems: "center", minWidth: 0 }}>
              <Avatar name={t(tk.raiserKey)} size={30} />
              <span style={{ minWidth: 0 }}>
                <span style={ty("small", { display: "block", color: c.ink, fontWeight: 600, whiteSpace: "nowrap" })}>{t(tk.raiserKey)}</span>
                <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 1 })}>{t(tk.raiserDesigKey)}</span>
              </span>
            </span>
          ),
          cmp: campusLabel(t, tk.raiserCampus),
          about: (
            <span style={{ minWidth: 0 }}>
              <span style={ty("small", { display: "block", color: c.ink })}>{t(tk.subjectKey)}</span>
              <span style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4, flexWrap: "wrap" }}>
                <span style={ty("caption", { color: c.inkFaint })}>{catName(t, k)}</span>
                {k && k.restricted ? <RestrictedBadge compact /> : null}
              </span>
            </span>
          ),
          last: lw
            ? (
              <span>
                <span style={ty("small", { display: "block", color: c.ink })}>
                  {lw.authorKey === "hhd.who.meera" ? t("hhd2.thread.you") : t(lw.authorKey)}
                </span>
                <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 1 })}>{fmt(t, lw.atISO)}</span>
              </span>
            )
            : <span style={ty("small", { color: c.inkFaint })}>{t("hhd2.last.none")}</span>,
          state: (
            <span>
              <StatusMark
                role={where === "answered" ? "present" : u.role}
                glyph={where === "answered" ? "check" : u.glyph}
                word={t("hhd2.where." + where)}
              />
              {where !== "answered" ? (
                <span style={ty("caption", { display: "block", color: u.calm ? c.inkFaint : c[u.role + "Text"], marginTop: 4 })}>
                  {waitedWords(t, tk)}
                </span>
              ) : null}
            </span>
          ),
        },
      };
    });

    const open = openId ? tickets.filter((tk) => tk.id === openId)[0] : null;

    return (
      <div>
        <Band metrics={facts} />

        {/* THREE QUESTIONS, ONE ROW. "Whose move is it" was a pill
            switch carrying the counts; the counts are figures now, so
            it is a question like the other two. */}
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 16 }}>
          <div style={{ flex: "1 1 240px", minWidth: 0 }}>
            <Field id="hhd2-q" label={t("hhd2.f.search")}>
              <Input id="hhd2-q" value={q} onChange={setQ} placeholder={t("hhd2.f.searchPh")} />
            </Field>
          </div>
          <div style={{ flex: "1 1 220px", minWidth: 0 }}>
            <Field id="hhd2-cat" label={t("hhd2.f.about")}>
              <Select id="hhd2-cat" value={cat} onChange={setCat}
                options={[{ value: "all", label: t("hhd2.f.aboutAll") }].concat(
                  categories.filter((k) => k.active).map((k) => ({ value: k.id, label: catName(t, k) }))
                )} />
            </Field>
          </div>
          <div style={{ flex: "1 1 220px", minWidth: 0 }}>
            <Field id="hhd2-where" label={t("hhd2.f.where")}>
              <Select id="hhd2-where" value={where} onChange={(v) => { setWhere(v); setOpenId(null); }}
                options={["you", "them", "answered"].map((k) => ({ value: k, label: t("hhd2.where." + k) }))} />
            </Field>
          </div>
        </div>

        {rows.length === 0 ? (
          <Card>
            <EmptyState
              icon={where === "you" ? "check" : "list"}
              head={t("hhd2.empty." + where + ".head")}
              body={t("hhd2.empty." + where + ".body")}
            />
          </Card>
        ) : (
          <Register
            title={t("hhd2.reg.title")}
            sub={t("hhd2.reg.sub", { shown: num(rows.length), total: num(tickets.length) })}
            action={<Button kind="secondary" size="sm" iconLeft="list" onClick={onOpenCats}>{t("hhd2.cats.open.cta")}</Button>}
            columns={columns} rows={rows}
            onSelect={(id) => setOpenId(id)}
            footer={<span style={ty("caption", { color: c.inkFaint })}>{t("hhd2.q.foot")}</span>}
          />
        )}

        {open ? (
          <TicketScreen
            tk={open} cat={catOf(open)} categories={categories}
            onClose={() => setOpenId(null)}
            onFlash={onFlash} mutators={mutators}
          />
        ) : null}
      </div>
    );
  }

  /* CLOSE, in the danger colour but not the danger weight — the same
     control the leave module uses, for the same reason. */
  function DangerClose({ onClick, children }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <button
        type="button" onClick={onClick}
        style={ty("ui", {
          display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
          height: 34, padding: "0 17px", borderRadius: G3.r.md, cursor: "pointer", fontWeight: 600,
          background: "transparent", color: c.dangerText, border: "1px solid " + c.dangerText,
        })}
      >
        {children}
      </button>
    );
  }

  function AddCategoryPanel({ onClose, onSubmit }) {
    const { t } = useLang();
    const [name, setName] = useState("");
    const [owner, setOwner] = useState("");
    const [sla, setSla] = useState("");
    const [basis, setBasis] = useState("business");
    const [escalate, setEscalate] = useState("");
    const [threshold, setThreshold] = useState("");
    const [restricted, setRestricted] = useState(false);
    const [errName, setErrName] = useState("");
    const [errOwner, setErrOwner] = useState("");

    function submit() {
      let bad = false;
      if (!name.trim()) { setErrName(t("hhd.s.add.nameMissing")); bad = true; } else setErrName("");
      if (!owner) { setErrOwner(t("hhd.s.add.ownerMissing")); bad = true; } else setErrOwner("");
      if (bad) return;
      onSubmit({
        name: name.trim(), ownerKey: owner, slaHours: sla.trim() ? Number(sla.trim()) : null, basis,
        escalateToKey: escalate || null, escalateThresholdPct: threshold.trim() ? Number(threshold.trim()) : null,
        restricted,
      });
    }

    return (
      <Panel title={t("hhd.s.add.title")} onClose={onClose}>
        <Field id="hhd-add-name" label={t("hhd.s.add.nameLabel")} error={errName}>
          <Input id="hhd-add-name" value={name} onChange={(v) => { setName(v); setErrName(""); }} placeholder={t("hhd.s.add.namePh")} invalid={!!errName} />
        </Field>
        <Field id="hhd-add-owner" label={t("hhd.s.add.ownerLabel")} error={errOwner}>
          <Select id="hhd-add-owner" value={owner} onChange={(v) => { setOwner(v); setErrOwner(""); }}
            options={[{ value: "", label: t("hhd.s.add.ownerPh") }].concat(PEOPLE.map((p) => ({ value: p.key, label: t(p.key) })))} />
        </Field>
        <Field id="hhd-add-sla" label={t("hhd.s.add.slaLabel")} hint={t("hhd.s.add.slaHint")}>
          <Input id="hhd-add-sla" value={sla} onChange={setSla} placeholder={t("hhd.s.add.slaPh")} inputMode="numeric" />
        </Field>
        {!sla.trim() ? <div style={{ marginBottom: 14 }}><Callout tone="late" icon="clock" body={t("hhd.s.add.slaUnsetWarn")} compact /></div> : null}
        <Field id="hhd-add-basis" label={t("hhd.s.add.basisLabel")}>
          <Select id="hhd-add-basis" value={basis} onChange={setBasis} options={[
            { value: "business", label: t("hhd.s.add.basisBusiness") },
            { value: "calendar", label: t("hhd.s.add.basisCalendar") },
          ]} />
        </Field>
        <Field id="hhd-add-escalate" label={t("hhd.s.add.escalateLabel")}>
          <Select id="hhd-add-escalate" value={escalate} onChange={setEscalate}
            options={[{ value: "", label: t("hhd.s.add.escalateNone") }].concat(PEOPLE.map((p) => ({ value: p.key, label: t(p.key) })))} />
        </Field>
        {escalate ? (
          <Field id="hhd-add-threshold" label={t("hhd.s.add.thresholdLabel")}>
            <Input id="hhd-add-threshold" value={threshold} onChange={setThreshold} placeholder={t("hhd.s.add.thresholdPh")} inputMode="numeric" />
          </Field>
        ) : null}
        <label htmlFor="hhd-add-restricted" style={{ display: "flex", gap: 9, alignItems: "flex-start", marginBottom: 8, cursor: "pointer" }}>
          <span style={{ marginTop: 2 }}><RowCheck id="hhd-add-restricted" checked={restricted} onChange={setRestricted} ariaLabel={t("hhd.s.add.restrictedLabel")} /></span>
          <span>
            <span style={{ display: "block" }}>{t("hhd.s.add.restrictedLabel")}</span>
            <Note>{t("hhd.s.add.restrictedHint")}</Note>
          </span>
        </label>
        <Actions>
          <Button kind="primary" onClick={submit}>{t("hhd.s.add.submit")}</Button>
          <Button kind="ghost" onClick={onClose}>{t("hhd.act.cancel")}</Button>
        </Actions>
      </Panel>
    );
  }

  function EditSlaPanel({ cat, openCount, onClose, onSubmit }) {
    const { t } = useLang();
    const [sla, setSla] = useState(cat.slaHours == null ? "" : String(cat.slaHours));
    const [basis, setBasis] = useState(cat.basis);
    const [eff, setEff] = useState(TODAY_ISO);

    function submit() {
      onSubmit(cat.id, { slaHours: sla.trim() ? Number(sla.trim()) : null, basis, effISO: eff });
    }

    return (
      <Panel title={t("hhd.s.editSla.title", { name: catName(t, cat) })} onClose={onClose}>
        <Field id="hhd-esla-eff" label={t("hhd.s.editSla.effLabel")}>
          <Input id="hhd-esla-eff" type="date" value={eff} onChange={setEff} />
        </Field>
        <Field id="hhd-esla-hours" label={t("hhd.s.add.slaLabel")}>
          <Input id="hhd-esla-hours" value={sla} onChange={setSla} placeholder={t("hhd.s.add.slaPh")} inputMode="numeric" />
        </Field>
        {!sla.trim() ? <div style={{ marginBottom: 14 }}><Callout tone="late" icon="clock" body={t("hhd.s.add.slaUnsetWarn")} compact /></div> : null}
        <Field id="hhd-esla-basis" label={t("hhd.s.add.basisLabel")}>
          <Select id="hhd-esla-basis" value={basis} onChange={setBasis} options={[
            { value: "business", label: t("hhd.s.add.basisBusiness") },
            { value: "calendar", label: t("hhd.s.add.basisCalendar") },
          ]} />
        </Field>
        <Note>{t("hhd.s.editSla.note", { n: openCount })}</Note>
        <Actions>
          <Button kind="primary" onClick={submit}>{t("hhd.s.editSla.confirm")}</Button>
          <Button kind="ghost" onClick={onClose}>{t("hhd.act.cancel")}</Button>
        </Actions>
      </Panel>
    );
  }

  function HRHelp({ role, onNavigate }) {
    const { c } = useTheme();
    const { lang } = useLang();
    const L = G3.layout;

    const [campus, setCampus] = useState(CAMPUS_ALL);
    const [cats, setCats] = useState(false);
    const [categories, setCategories] = useState(CATEGORIES_SEED);
    const [tickets, setTickets] = useState(TICKETS_SEED);
    const [flash, setFlash] = useState("");

    function updateTicket(id, patch) {
      setTickets((all) => all.map((tk) => (tk.id === id ? Object.assign({}, tk, patch) : tk)));
    }

    const mutators = {
      setPriority: (id, p) => updateTicket(id, { priority: p }),
      assign: (id, whoKey) => updateTicket(id, { assigneeKey: whoKey, status: "in_progress" }),
      escalate: (id, whoKey) => updateTicket(id, { escalatedToKey: whoKey, escalatedOnISO: TODAY_ISO, escalatedOnHour: NOW_HOUR }),
      setCategory: (id, categoryId) => {
        const target = categories.find((k) => k.id === categoryId);
        updateTicket(id, { categoryId: categoryId, assigneeKey: target.ownerKey || null });
      },
      addComment: (id, { isInternal, bodyText, pause }) => {
        setTickets((all) => all.map((tk) => {
          if (tk.id !== id) return tk;
          const comments = (tk.comments || []).concat([{
            id: id + "c" + ((tk.comments || []).length + 1), authorKey: "hhd.who.meera",
            isInternal, atISO: TODAY_ISO, atHour: NOW_HOUR, bodyText,
          }]);
          const patch = { comments };
          if (pause) { patch.awaitingRaiser = true; patch.pausedOnISO = TODAY_ISO; patch.pausedOnHour = NOW_HOUR; }
          return Object.assign({}, tk, patch);
        }));
      },
      resolve: (id, summaryText) => updateTicket(id, { status: "resolved", resolvedOnISO: TODAY_ISO, resolvedOnHour: NOW_HOUR, resolutionText: summaryText, awaitingRaiser: false }),
      close: (id) => updateTicket(id, { status: "closed", closedOnISO: TODAY_ISO, closedOnHour: NOW_HOUR }),
      reopen: (id, reasonText) => updateTicket(id, { status: "reopened", reopenedOnISO: TODAY_ISO, reopenedOnHour: NOW_HOUR, reopenReasonText: reasonText, resolvedOnISO: null, closedOnISO: null, awaitingRaiser: false }),
      addCategory: (payload) => {
        setCategories((all) => all.concat([{
          id: "cat-" + (all.length + 1) + "-" + Date.now(), nameKey: null, name: payload.name,
          ownerKey: payload.ownerKey, slaHours: payload.slaHours, basis: payload.basis,
          escalateToKey: payload.escalateToKey, escalateThresholdPct: payload.escalateThresholdPct,
          restricted: payload.restricted, seeded: false, version: 1, setByKey: "hhd.who.meera", setOnISO: TODAY_ISO, active: true,
        }]));
      },
      editSla: (id, patch) => setCategories((all) => all.map((k) => (k.id === id ? Object.assign({}, k, { slaHours: patch.slaHours, basis: patch.basis, version: k.version + 1, setByKey: "hhd.who.meera", setOnISO: patch.effISO }) : k))),
      deactivate: (id) => setCategories((all) => all.map((k) => (k.id === id ? Object.assign({}, k, { active: false }) : k))),
    };

    const { t } = useLang();

    /* scoped ONCE, here: the three segments below count themselves off
       this list, so "with you", "with them" and "answered" all answer
       the same campus instead of each filtering on its own */
    const scoped = tickets.filter(function (tk) { return inCampus(campus, tk.raiserCampus); });

    return (
      <div className="nv3" style={{ display: "flex", minHeight: "100vh", background: c.page, color: c.ink, fontFamily: G3.font.ui }}>
        <Rail role={role || "hr"} active="hrHelp" onNavigate={onNavigate} initials="MI" />

        <main style={{ flex: 1, minWidth: 0, position: "relative", overflowX: "clip" }}>
          <Motif />
          <div style={{ position: "relative", zIndex: 1, maxWidth: L.contentMax, margin: "0 auto", padding: "22px " + L.contentPadX + "px 56px" }}>
            <TopStrip campus={campus} onCampus={setCampus} />

            <div style={{ marginBottom: 20 }}>
              <h1 style={G3.t("display", "latin", { margin: 0, color: c.ink })}>{t("hhd.pageTitle")}</h1>
            </div>

            <Flash text={flash} onDismiss={() => setFlash("")} />

            <QueueTab
              key={campus}
              tickets={scoped} categories={categories}
              onFlash={setFlash} mutators={mutators}
              onOpenCats={() => setCats(true)}
            />

            {cats ? (
              <CategoriesScreen
                categories={categories} tickets={scoped}
                onClose={() => setCats(false)} onFlash={setFlash} mutators={mutators}
              />
            ) : null}
          </div>
        </main>
      </div>
    );
  }

  window.Pages3 = window.Pages3 || {};
  window.Pages3.HRHelp = HRHelp;
  /* EMP-14 reads the raiser's side of the same desk. A ticket has two
     ends and only one of them had a screen; this is the seed both read,
     so a subject, an SLA and an assignee cannot differ between them. */
  window.Pages3.HRHelpData = {
    TICKETS: TICKETS_SEED, CATEGORIES: CATEGORIES_SEED,
    forRaiser: function (key) {
      return TICKETS_SEED.filter(function (x) { return x.raiserKey === key; });
    },
    categoryOf: function (id) {
      return CATEGORIES_SEED.filter(function (x) { return x.id === id; })[0] || null;
    },
  };
})();

/* ============================================================
   SELF-CHECK (kept in-file, not a separate doc, per house style)

   HR-31 states covered: empty (hhd.q.empty / allClear) · loading —
   N/A, this mock has no network boundary · error — N/A, same reason
   · breaching SLA, lead (banner + absent-role rows) · unassigned (t5)
   · awaiting the raiser (t2, paused) · reopened (t7) · grievance,
   restricted, visually distinct (t6, RestrictedBadge + Callout) ·
   escalated (t1).

   HR-32 states covered: open/assigned/in progress/resolved/closed/
   reopened (status enum) · awaiting the raiser, SLA paused (t2) ·
   SLA breached (t1, t6, t7) · grievance restricted-handling banner
   (t6).

   HR-33 states covered: seeded defaults (it/hr/facilities) · in use,
   deletion(deactivation) blocked (any category with open tickets) ·
   no owner assigned (transport) · restricted category (grievance,
   read-only badge for HR) · SLA unset (transport).

   Offered / disabled-with-reason / absent, applied without mixing:
   - "Mark a category restricted" (HR-33 Actions) is GA-group-scope
     only — ABSENT from this file's HR-rendered register (no row-menu
     item at all), not a disabled stub. hhd.s.restrictedAbsentNote
     states the rule in place of a control.
   - Resolve is disabled-with-reason until an assignee exists
     (hhd.d.resolve.needsAssignee) — the right exists, a state
     precondition doesn't, so the button stays visible.
   - Close is offered only once resolved (not shown otherwise, per
     spec precondition — that IS the "closed" state's own absence).
   - Reopen is disabled-with-reason once the (proposed) 7-day window
     has passed (t4 is inside it and still offered).
   - Bulk assign is disabled-with-reason under 2 eligible tickets;
     restricted rows are excluded from selection entirely (checkbox
     disabled with the reason "assign individually"), never bulk-acted.
   - No delete affordance anywhere in this file — categories only
     Deactivate (a reversible state flag), tickets/comments are
     append-only (Trail never has a remove control).

   TWO FLAGGED GAPS (see file header for the full reasoning):
   1. Grievance access has no permission distinct from
      `hr.helpdesk.manage` in kit.jsx's ROLE_PERMISSIONS — this file
      treats the one "hr" role as the restricted-role holder and
      marks every grievance ticket accordingly, but a real build needs
      its own permission (e.g. `hr.helpdesk.grievance`) so an HR login
      WITHOUT it genuinely cannot see these tickets (today, every HR
      login can, by construction of the demo).
   2. Campus scope — added 2026-10-13. HR-31/32/33 never mention one, unlike every
      sibling HR screen; treated as school-wide by choice, not spec
      instruction. Each ticket still carries its raiser's campus as
      data (raiserCampus), which is what the switcher now reads.

   PROMOTION CANDIDATES (kit.jsx is out of scope for this dispatch;
   these are local here and duplicate patterns already local in
   hr-leaveatt.jsx — third-plus sighting, worth promoting together):
   Callout, Flash, ReasonField/TextArea/FieldError, ConfirmDialog,
   Panel, Actions, DefRow, Trail, RowCheck — all byte-for-byte the
   same shape as hr-leaveatt.jsx's. New in this file: RestrictedBadge
   (a paired glyph+word confidentiality mark — likely useful anywhere
   else M15.1 grievance handling surfaces) and PriorityChip (a
   three-value role-tinted chip, reusable for any low/normal/high
   field, e.g. onboarding tasks, document requests).

   BUSINESS-HOURS SIMPLIFICATION: category.basis ("business" vs
   "calendar") is stored and displayed as real configuration, but this
   mock's own elapsed/remaining arithmetic (hoursBetween/slaStateFor)
   always uses calendar hours — a true business-hours ticking clock
   (skipping nights/Sundays) is a backend computation this design
   surface does not attempt to simulate. Flagged, not hidden.
   ============================================================ */
