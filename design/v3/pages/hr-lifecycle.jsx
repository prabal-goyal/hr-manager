/* @jsxRuntime classic */
/* ============================================================
   Naveya — HR Lifecycle section · window.Pages3.HRLifecycle

   HR-22 · Onboarding checklists        (docs/screen-inventory.md, destination)
   HR-23 · Bulk / seasonal onboarding    (task)
   HR-24 · Probation & confirmation queue (destination)
   HR-25 · Renewal & non-renewal queue   (destination)

   Modules: M6 "Onboarding" in full (checklist tasks, seasonal bulk,
   academic-year fixed-term contracts with auto-expiry, session-end
   renewal/non-renewal); M3 §Business rules (is_vacation_staff and
   contract_end_date live on the contract; every lifecycle change
   writes a ServiceRecord); §6.3 EmploymentContract.confirmation_date;
   §4.3 effective-dating (supersede, never edit).

   ONE QUESTION PER SCREEN
   · HR-22 "what still has to happen before this new joiner is ready?"
   · HR-23 "can I bring in this whole batch at once?" — built for the
     day forty teachers start in April, not because bulk is a nice
     convenience. The demo clock (11 Aug 2026) sits mid-session, so the
     live batch below is a small Term-2 guest-faculty intake, not a
     re-enactment of an April cohort already months in the past.
   · HR-24 "who is due for confirmation, and what are we deciding?"
   · HR-25 "whose contract ends, and are we renewing them?"

   GOVERNANCE, ENFORCED HERE (not just described)
   · Append-only, everywhere. Confirm/extend/renew/non-renew all
     SUPERSEDE a contract row; there is no delete affordance on this
     file, on any joiner, task, probation record or contract, in any
     state (ui-compliance O6, O18; CLAUDE.md "Append-only audit").
   · A new joiner may not be marked ready while the police-verification
     or child-protection-training task is unresolved — "Mark the
     joiner ready" is refused and names the blocker (M6 + ui-compliance
     O8). Those two tasks show STATUS ONLY — a state word and a date —
     never a finding, a remark or an officer's note, and they are
     LINKED tasks: this screen cannot complete them itself (that
     decision lives in HR-10/HR-12, hr-compliance.jsx), so the row
     carries no Complete control at all, only a route there.
   · Every decision that ends or extends employment records who and
     why: extend-probation, non-renew and the temporary-bridge
     extension all require a typed reason before they will submit, and
     the confirming/deciding person's name and date are shown wherever
     the decision is later read (ui-compliance O5/O6).
   · HR-25's Decide: renew / Decide: do not renew is the PRINCIPAL's
     action, not HR's (screen-inventory HR-25, "Who @ scope: Principal
     (campus)"; ui-compliance's absent-vs-disabled rule: a capability
     the role never holds is ABSENT, not a disabled stub). This file
     renders only under the HR route (`?role=hr&screen=hrLifecycle` —
     `hr.lifecycle.manage` is not a permission the Principal role
     holds, so the Principal could not reach this screen through the
     rail at all). HR's own actions here are Recommend, Extend
     temporarily and Execute in bulk (once the Principal has decided) —
     the decide buttons themselves do not exist on this file.
   · HR-23's commit step reports PER-PERSON outcomes — created or
     skipped, each with its own reason — never a bare "4 succeeded."
     A duplicate or a missing pay-group failure is named against the
     specific row, and the failed rows are the ones the error-report
     download and the resumable re-upload work from (M6 §API bulk
     idempotency; ui-compliance A13).
   · Confirmation is flagged as a money/leave event where it matters:
     a vacation-staff (teacher) confirmation states plainly that her
     EL accrual does NOT change (design/v3/pages/leave.jsx: a teacher
     accrues no EL regardless of probation/permanent); a non-vacation
     confirmation states that EL accrual and the pay group MAY start
     from the effective date — said before the action commits, not
     after.
   · No PAN/Aadhaar/salary anywhere on this file, matching hr.jsx and
     hr-record.jsx — this section deals in people, dates and states.

   People and facts are reused, not invented in parallel, from
   design/v3/pages/hr.jsx (Neha Bhatt NAV-0250 still has no login;
   Kavya Nair NAV-0207 and Rohit Malhotra NAV-0161's contract already
   ended 31 Mar 2026 while he keeps working — the exact HR-25 "expired
   but still active" lead state). The demo clock is 11 Aug 2026,
   matching every other v3 role page.

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
    Rail, Card, Register, Button, LinkButton, BackBar, SideScreen,
    Field, Input, Select, Tabs, TabPanel, ActionMenu, Avatar: KitAvatar,
    Chip, StatusMark, Icon, EmptyState, Skeleton, Meter, Figure,
    StackBar, MetricCell, MetricStrip, inr, num,
    CampusSwitch, campusLabel, inCampus, CAMPUS_ALL,
  } = window.UI3;

  /* ============================================================
     0 · STRINGS — hrl3.* is this dispatch's whole namespace. Every
     enum word, dialog line, consequence and empty state carries exact
     EN/HI key parity. Proper nouns (people, designations, department
     names) and a captured recommendation's free text follow hr.jsx's
     own precedent (STAFF.name / DOC_QUEUE.noteText) and are NOT run
     through t() — only structured, controlled copy is.
     ============================================================ */
  addStrings({
    en: {
      "hrl3.pageTitle": "Lifecycle",
      "hrl3.title": "Joining and confirming",
      "hrl3.identity": "HR Operator · Meera Iyer · {campus}",

      "hrl3.tabs.aria": "Lifecycle sections",
      "hrl3.tab.prob": "Probation & contracts",
      "hrl3.cta.cancel": "Cancel",
      "hrl3.back": "Back to probation & contracts",
      "hrl3.menuAria": "Actions on {name}",
      "hrl3.menu.open": "Open the record",
      "hrl3.menu.confirm": "Confirm them",
      "hrl3.menu.extend": "Extend the probation",
      "hrl3.menu.notConfirm": "Do not confirm",
      "hrl3.menu.renew": "Renew the contract",
      "hrl3.menu.end": "Do not renew",
      "hrl3.menu.rec": "Record what the head said",
      "hrl3.menu.ask": "Ask the head for a view",
      "hrl3.menu.askAlready": "Already asked on {date}",
      "hrl3.kind.all": "Every kind",
      "hrl3.state.all": "Any state",
      "hrl3.ob.state.all": "Any stage",
      "hrl3.kind.probation": "Probation",
      "hrl3.kind.fixed": "Fixed term",
      "hrl3.kind.guest": "Guest",
      "hrl3.kindLong.probation": "On probation",
      "hrl3.kindLong.fixed": "On a fixed-term contract",
      "hrl3.kindLong.guest": "Guest faculty, by the period",
      "hrl3.st.overdue": "Past the date",
      "hrl3.st.soon": "Due within a month",
      "hrl3.st.ahead": "Due this term",
      "hrl3.st.later": "Further off",
      "hrl3.st.decided": "Decided",
      "hrl3.cl.late": "{n} days past",
      "hrl3.cl.today": "Today",
      "hrl3.cl.inN": "in {n} days",
      "hrl3.rec.confirm": "Confirm them",
      "hrl3.rec.extend": "Give them longer",
      "hrl3.rec.end": "Do not renew",
      "hrl3.rec.endProb": "Do not confirm",
      "hrl3.rec.renew": "Renew",
      "hrl3.rec.none.head": "Nobody has said anything yet",
      "hrl3.rec.none.body": "The head of department's view is given in a corridor or a meeting. Write it down here when you have it, or ask for it.",
      "hrl3.rec.asked.head": "Asked, nothing back yet",
      "hrl3.rec.asked.body": "You asked on {date}. Naveya has not chased anybody — it does not send.",
      "hrl3.dec.confirmed": "Confirmed",
      "hrl3.dec.notConfirmed": "Not confirmed",
      "hrl3.dec.renewed": "Renewed",
      "hrl3.dec.ended": "Not renewed",
      "hrl3.tr.by": "by {who}",
      "hrl3.tr.joined": "Joined",
      "hrl3.tr.probSet": "Probation set",
      "hrl3.tr.probExtended": "Probation extended",
      "hrl3.tr.recAsked": "A view was asked for",
      "hrl3.tr.recGiven": "The head gave their view",
      "hrl3.tr.confirmed": "Confirmed",
      "hrl3.tr.notConfirmed": "Not confirmed",
      "hrl3.tr.renewed": "Contract renewed",
      "hrl3.tr.ended": "Contract not renewed",
      "hrl3.band.title": "Who is on a clock",
      "hrl3.band.sub": "Probation and contracts both end on a date, and both need a decision before it arrives",
      "hrl3.m.onClock": "Still to decide",
      "hrl3.m.onClockNote": "of {total} on a clock at all",
      "hrl3.m.overdue": "Past the date",
      "hrl3.m.overdueNote": "the date came and went",
      "hrl3.m.overdueMark": "Decide these first",
      "hrl3.m.overdueNone": "Nothing has run over",
      "hrl3.m.soon": "Due within a month",
      "hrl3.m.soonNote": "inside {n} days",
      "hrl3.m.noRec": "No view from the head",
      "hrl3.m.noRecNote": "of {n} still to decide",
      "hrl3.m.split": "On probation",
      "hrl3.m.splitNote": "{n} on a contract",
      "hrl3.reg.title": "On a clock",
      "hrl3.reg.sub": "Everybody whose probation or contract ends",
      "hrl3.reg.foot": "A probation and a fixed term are the same job here: watch the date, get the head's view, decide before it arrives. Nothing here tells the person.",
      "hrl3.col.who": "Who",
      "hrl3.col.kind": "On what",
      "hrl3.col.ends": "Ends",
      "hrl3.col.left": "How long",
      "hrl3.col.act": "Actions",
      "hrl3.empty.head": "Nothing matches",
      "hrl3.empty.body": "Clear the filter above the list.",
      "hrl3.screenSub": "One clock, what the head of department said about it, and everything that has happened to this person's terms.",
      "hrl3.card.clock": "The clock",
      "hrl3.card.rec": "What the head of department says",
      "hrl3.card.recSub": "Given in a room, written down here",
      "hrl3.card.recFoot": "A recommendation is advice, not a decision. Every HR here decides; nobody signs off on anybody.",
      "hrl3.card.history": "What has happened",
      "hrl3.card.historySub": "Added to, never edited",
      "hrl3.f.kind": "What they are on",
      "hrl3.f.since": "Since",
      "hrl3.f.probEnds": "Probation ends",
      "hrl3.f.contractEnds": "Contract ends",
      "hrl3.f.wasExtended": "This has already been extended once",
      "hrl3.f.decided": "Decided",
      "hrl3.f.decidedBy": "by {who} on {date}",
      "hrl3.f.lastDay": "Last working day {date}",
      "hrl3.f.theySay": "They say",
      "hrl3.f.whoSaid": "Who said it",
      "hrl3.f.whenSaid": "When",
      "hrl3.f.inTheirWords": "In their words",
      "hrl3.act.confirm.title": "Confirm them",
      "hrl3.act.confirm.eff": "Confirmed from",
      "hrl3.act.confirm.effHint": "Usually the day the probation ends, not today.",
      "hrl3.act.confirm.cta": "Confirm them",
      "hrl3.act.confirm.c1": "They are permanent from that date. The probation ends and cannot be reopened.",
      "hrl3.act.confirm.c2": "Their notice period becomes the permanent one, which is longer — the staff record picks that up on its own.",
      "hrl3.act.confirm.c3": "Nothing is sent. Write the confirmation letter and hand it over.",
      "hrl3.act.extend.title": "Extend the probation",
      "hrl3.act.extend.second": "This probation has already been extended once",
      "hrl3.act.extend.to": "Extend to",
      "hrl3.act.extend.toHint": "Three months is usual. Longer than that and the question is whether this is working.",
      "hrl3.act.extend.why": "Why, in a line",
      "hrl3.act.extend.whyHint": "They have a right to know what is expected of them before the new date.",
      "hrl3.act.extend.cta": "Extend it",
      "hrl3.act.extend.c1": "The clock moves to the new date and the head's view is cleared, because it was about the old one.",
      "hrl3.act.extend.c2": "An extension has to be given in writing before the first date passes. Naveya does not send it.",
      "hrl3.act.extend.c3": "A second extension is hard to defend later. Both are on the record below.",
      "hrl3.act.renew.title": "Renew the contract",
      "hrl3.act.renew.to": "New end date",
      "hrl3.act.renew.toHint": "A school year usually, so the end lands in the holidays rather than mid-term.",
      "hrl3.act.renew.note": "Anything that changed",
      "hrl3.act.renew.noteHint": "More periods, a different subject, a pay revision agreed separately.",
      "hrl3.act.renew.cta": "Renew it",
      "hrl3.act.renew.c1": "The contract runs to the new date and leaves this list until it comes round again.",
      "hrl3.act.renew.c2": "Pay is not changed here. A revision is made on the staff record, where it is dated and kept.",
      "hrl3.act.renew.c3": "Nothing is sent. The new letter is written and handed over.",
      "hrl3.act.end.title": "Do not renew",
      "hrl3.act.notConfirm.title": "Do not confirm them",
      "hrl3.act.end.last": "Last working day",
      "hrl3.act.end.lastHint": "Usually the date it already ends on.",
      "hrl3.act.end.why": "Why, in a line",
      "hrl3.act.end.whyHint": "This is what anybody reading the file in two years will have.",
      "hrl3.act.end.cta": "Record it",
      "hrl3.act.notConfirm.cta": "Record it",
      "hrl3.act.end.c1": "The contract ends on that day and the post goes back to Hiring to be opened again if it is still needed.",
      "hrl3.act.notConfirm.c1": "Their employment ends that day. A probation not confirmed is still an exit, and the contract's notice still applies.",
      "hrl3.act.end.c2": "Full and final settlement goes to payroll from the staff record, not from here.",
      "hrl3.act.end.c3": "Nothing is sent. Somebody has to tell them, and it should not be a letter that arrives first.",
      "hrl3.act.rec.title": "Record what the head said",
      "hrl3.act.rec.what": "What do they recommend?",
      "hrl3.act.rec.who": "Who said it",
      "hrl3.act.rec.whoHint": "Their name and post, as you would write it in a file.",
      "hrl3.act.rec.when": "When",
      "hrl3.act.rec.note": "In their words",
      "hrl3.act.rec.noteHint": "The reason, not just the verdict — that is the part worth having later.",
      "hrl3.act.rec.cta": "Record it",
      "hrl3.act.rec.c1": "It goes on this person's record with the name of whoever said it.",
      "hrl3.act.rec.c2": "It does not decide anything. You still confirm, extend, renew or end it yourself.",
      "hrl3.act.rec.c3": "Recording a view does not tell the person anything.",
      "hrl3.act.ask.title": "Ask the head for a view",
      "hrl3.act.ask.who": "Who are you asking",
      "hrl3.act.ask.whoHint": "The head of department, the Principal, whoever actually works with them.",
      "hrl3.act.ask.cta": "Mark it asked",
      "hrl3.act.ask.c1": "This records that YOU asked. Naveya sends no message — ring them or catch them in the staffroom.",
      "hrl3.act.ask.c2": "The row shows as waiting until you write down what they said.",
      "hrl3.said.confirmed": "Confirmed. Write the letter and hand it over — Naveya has told nobody.",
      "hrl3.said.extended": "Extended. They have to be told in writing before the old date passes.",
      "hrl3.said.renewed": "Renewed. The new letter is yours to write.",
      "hrl3.said.ended": "Recorded. Somebody has to tell them, and it should not be the letter.",
      "hrl3.said.rec": "Written down, with the name of whoever said it.",
      "hrl3.said.asked": "Marked as asked. Nothing was sent.",
      "hrl3.ob.back": "Back to joiners",
      "hrl3.ob.band.title": "Who is still joining",
      "hrl3.ob.band.sub": "What is left before each new joiner can start, and how much of it is yours",
      "hrl3.ob.m.joiners": "Still joining",
      "hrl3.ob.m.joinersNote": "of {total} on the books",
      "hrl3.ob.m.mine": "Yours to do",
      "hrl3.ob.m.mineNote": "of {n} tasks still open",
      "hrl3.ob.m.overdue": "Past their date",
      "hrl3.ob.m.overdueNote": "tasks whose day has gone",
      "hrl3.ob.m.blocked": "Waiting on something else",
      "hrl3.ob.m.blockedNote": "cannot start until another task is done",
      "hrl3.ob.m.safe": "Safeguarding not cleared",
      "hrl3.ob.m.safeNote": "police verification and child-protection training",
      "hrl3.ob.reg.title": "Joiners",
      "hrl3.ob.reg.sub": "Soonest joining date first",
      "hrl3.ob.reg.foot": "Onboarding decisions join the service record. Nothing is deleted \u2014 completed, reopened with a reason, or handed on.",
      "hrl3.ob.col.who": "Joiner",
      "hrl3.ob.col.doj": "Joined",
      "hrl3.ob.col.since": "Been here",
      "hrl3.ob.col.progress": "Checklist",
      "hrl3.ob.menuAria": "Actions on {name}",
      "hrl3.ob.menu.open": "Open their checklist",
      "hrl3.ob.since1": "1 day",
      "hrl3.ob.sinceN": "{n} days",
      "hrl3.ob.doneOf": "{n} of {total} done",
      "hrl3.ob.noListShort": "No checklist yet",
      "hrl3.ob.empty.body": "Clear the stage filter beside the table.",
      "hrl3.ob.screenSub": "Joined {date}. Everything below is what has to happen before they can be let loose in a classroom.",
      "hrl3.ob.card.progress": "How far along",
      "hrl3.ob.card.safeguard": "Safeguarding",
      "hrl3.ob.card.safeguardSub": "The two nobody may skip, kept where they cannot be scrolled past",
      "hrl3.ob.card.rest": "Everything else",
      "hrl3.ob.card.restSub": "Split by who is holding it up, because that is the only question worth asking of a checklist",
      "hrl3.ob.card.who": "Who they are",
      "hrl3.ob.f.code": "Staff ID",
      "hrl3.ob.f.desig": "Post",
      "hrl3.ob.f.dept": "Department",
      "hrl3.ob.f.doj": "Joined",
      "hrl3.ob.openRecord": "Open the staff record",
      "hrl3.ob.yoursLeft": "{n} still yours",
      "hrl3.ob.yoursNone": "Nothing left on your side",
      "hrl3.ob.readyOn": "Marked ready on {date}",
      "hrl3.ob.readyWhen": "They can be marked ready once every task that must happen has happened.",
      "hrl3.ob.markReady": "Mark the joiner ready",
      "hrl3.ob.generate": "Make their checklist",
      "hrl3.ob.addAdhoc": "Add a task",
      "hrl3.ob.noList.head": "No checklist yet",
      "hrl3.ob.noList.body": "The standard list \u2014 documents, verification, training, laptop, induction, handbook, payroll \u2014 is dated from their joining day.",
      "hrl3.ob.noTasks.head": "Nothing on the list",
      "hrl3.ob.noTasks.body": "Add a task if something has to happen that the standard list does not cover.",
      "hrl3.ob.group.mine": "Yours to do",
      "hrl3.ob.group.mineSub": "Nobody else is going to do these.",
      "hrl3.ob.group.theirs": "Waiting on somebody else",
      "hrl3.ob.group.theirsSub": "Chase them, or hand the task to somebody who will.",
      "hrl3.ob.group.done": "Done",
      "hrl3.ob.task.safeguard": "Cannot be skipped",
      "hrl3.ob.task.dueOn": "Due {date}",
      "hrl3.ob.task.overdueBy": "{n} days past its date",
      "hrl3.ob.task.doneLine": "Done by {who} on {date}",
      "hrl3.ob.task.blockedBy": "Cannot start until “{task}” is done",
      "hrl3.ob.task.menuAria": "Actions on {task}",
      "hrl3.ob.task.menu.complete": "Mark it done",
      "hrl3.ob.task.menu.reopen": "Open it again",
      "hrl3.ob.task.menu.reassign": "Hand it to somebody else",
      "hrl3.ob.ready.title": "Mark the joiner ready",
      "hrl3.ob.ready.cta": "Mark them ready",
      "hrl3.ob.ready.c1": "Onboarding closes and they leave this list.",
      "hrl3.ob.ready.c2": "It goes on the service record with your name and today’s date, and stays there.",
      "hrl3.ob.ready.c3": "Nothing is sent. Their probation clock is already running from the day they joined.",
      "hrl3.ob.adhoc.title": "Add a task",
      "hrl3.ob.adhoc.what": "What has to happen",
      "hrl3.ob.adhoc.whatHint": "As you would say it to whoever has to do it.",
      "hrl3.ob.adhoc.owner": "Who does it",
      "hrl3.ob.adhoc.due": "By when",
      "hrl3.ob.adhoc.cta": "Add it",
      "hrl3.ob.adhoc.c1": "It joins this joiner’s list and counts towards how far along they are.",
      "hrl3.ob.adhoc.c2": "It is not one of the tasks that must happen, so it does not hold up marking them ready.",
      "hrl3.ob.said.task": "The checklist is updated.",
      "hrl3.ob.said.generated": "Checklist made from their joining date.",
      "hrl3.ob.said.adhoc": "Task added.",
      "hrl3.ob.said.ready": "Marked ready. It is on the service record now.",
      "hrl3.tab.ob": "Onboarding",
      "hrl3.tab.bulk": "Bulk onboarding",

      "hrl3.mon.01": "Jan", "hrl3.mon.02": "Feb", "hrl3.mon.03": "Mar",
      "hrl3.mon.04": "Apr", "hrl3.mon.05": "May", "hrl3.mon.06": "Jun",
      "hrl3.mon.07": "Jul", "hrl3.mon.08": "Aug", "hrl3.mon.09": "Sep",
      "hrl3.mon.10": "Oct", "hrl3.mon.11": "Nov", "hrl3.mon.12": "Dec",

      "hrl3.dlg.cancel": "Cancel",
      "hrl3.dlg.consequence": "What this does",
      "hrl3.dlg.reasonLabel": "Reason",
      "hrl3.dlg.reasonPh": "Choose a reason",
      "hrl3.dlg.noteLabel": "Note (optional)",
      "hrl3.dlg.notePh": "Add a line of context",
      "hrl3.dlg.reasonMissing": "A reason is required.",

      "hrl3.actor.meera": "Meera Iyer, HR",

      /* -------- HR-22 · onboarding checklists -------- */
      "hrl3.ob.title": "Onboarding checklists",
      "hrl3.ob.sub": "What is left before each new joiner can start — documents, assets, induction, and the child-safety clearance nobody may skip.",

      "hrl3.ob.thisWeek.title": "Joining this week",
      "hrl3.ob.thisWeek.empty": "Nobody is starting this week.",

      "hrl3.ob.reg.title": "Joiners",
      "hrl3.ob.col.name": "Joiner",
      "hrl3.ob.col.due": "Since / due",
      "hrl3.ob.col.state": "State",
      "hrl3.ob.col.go": "Open",

      "hrl3.ob.state.notStarted": "Not started",
      "hrl3.ob.state.inProgress": "In progress",
      "hrl3.ob.state.blocked": "Blocked",
      "hrl3.ob.state.overdue": "Overdue",
      "hrl3.ob.state.complete": "Ready",
      "hrl3.ob.state.didNotReport": "Did not report",

      "hrl3.ob.due.overdueN": "{n} days overdue",
      "hrl3.ob.due.overdue1": "1 day overdue",
      "hrl3.ob.due.inN": "joined {n} days ago",
      "hrl3.ob.due.in1": "joined 1 day ago",
      "hrl3.ob.due.today": "joined today",

      "hrl3.ob.det.emptyHead": "Pick a joiner",
      "hrl3.ob.det.emptyBody": "Choose someone on the left to see their checklist and what is still open.",
      "hrl3.ob.det.doj": "Joined {date}",
      "hrl3.ob.det.didNotReportNote": "This person has not reported since their joining date. That needs a decision on the staff register, not a checklist action.",
      "hrl3.ob.det.goToStaff": "Open the staff register",

      "hrl3.ob.markReady": "Mark the joiner ready",
      "hrl3.ob.markReady.blockedPrefix": "Complete first: ",
      "hrl3.ob.markReady.done": "Marked ready by {who} on {date}. Payroll inclusion is now valid.",
      "hrl3.ob.markReady.dlgTitle": "Mark {name} ready?",
      "hrl3.ob.markReady.dlgBody": "Every mandatory task is complete, including the child-safety clearance.",
      "hrl3.ob.markReady.c1": "Flags {name} active-ready in the staff register.",
      "hrl3.ob.markReady.c2": "Payroll inclusion becomes valid from the next run.",
      "hrl3.ob.markReady.c3": "This cannot be undone from this screen.",
      "hrl3.ob.markReady.confirm": "Mark ready",

      "hrl3.ob.applyTemplate.title": "No checklist yet",
      "hrl3.ob.applyTemplate.body": "Generates the standard checklist for this staff category, with due dates set from the joining date.",
      "hrl3.ob.applyTemplate.categoryLabel": "Staff category",
      "hrl3.ob.applyTemplate.go": "Generate checklist",

      "hrl3.ob.cat.teaching": "Teaching",
      "hrl3.ob.cat.non_teaching": "Non-teaching",
      "hrl3.ob.cat.support": "Support",
      "hrl3.ob.cat.guest": "Guest faculty",

      "hrl3.ob.task.title": "Checklist",
      "hrl3.ob.task.col.task": "Task",
      "hrl3.ob.task.col.owner": "Owner",
      "hrl3.ob.task.col.due": "Due / done",
      "hrl3.ob.task.col.state": "State",
      "hrl3.ob.task.col.actions": "Actions",

      "hrl3.ob.col.task": "What has to happen",
      "hrl3.ob.col.who": "Whose job",
      "hrl3.ob.col.due": "Due",
      "hrl3.ob.col.state": "Where it stands",
      "hrl3.ob.st.done": "Done {date}",
      "hrl3.ob.st.over": "{n} days over",
      "hrl3.ob.st.pending": "Not done yet",
      "hrl3.ob.st.blocked": "Waiting on another task",
      "hrl3.ob.act.done": "Mark done",
      "hrl3.ob.act.reopen": "Reopen",
      "hrl3.ob.sheetSub": "{desig} · {dept} · joins {date}",
      "hrl3.ob.owner.hr": "HR",
      "hrl3.ob.owner.it": "IT",
      "hrl3.ob.owner.dept": "Department",
      "hrl3.ob.owner.employee": "Employee",
      "hrl3.ob.owner.payroll": "Payroll",

      "hrl3.ob.task.docsRequested": "Document requests raised",
      "hrl3.ob.task.policeVerif": "Police verification cleared",
      "hrl3.ob.task.childSafety": "Child-protection training certificate on file",
      "hrl3.ob.task.itAssets": "Laptop & login credentials issued",
      "hrl3.ob.task.induction": "Induction schedule & mentor assigned",
      "hrl3.ob.task.handbook": "Employee handbook & policies acknowledged",
      "hrl3.ob.task.payrollSetup": "Salary & bank details set up in Payroll",

      "hrl3.ob.task.state.done": "Done",
      "hrl3.ob.task.state.pending": "Pending",
      "hrl3.ob.task.state.blocked": "Blocked",

      "hrl3.ob.task.safeguardBadge": "Restricted — child-safety record. Status only, shown here.",
      "hrl3.ob.task.linkedNote.docs": "Tracked in the document control queue — not actioned here.",
      "hrl3.ob.task.linkedNote.payroll": "Set up separately by Payroll — not actionable from HR.",
      "hrl3.ob.task.openDocs": "Open the document queue",
      "hrl3.ob.task.openBoard": "Open the child-safety board",
      "hrl3.ob.task.doneBy": "{who} · {date}",
      "hrl3.ob.task.blockedNote": "Blocked — {label} is not done yet",

      "hrl3.ob.menu.complete": "Complete",
      "hrl3.ob.menu.completeDisabledBlocked": "Blocked until its dependency is done",
      "hrl3.ob.menu.reopen": "Reopen (with a reason)",
      "hrl3.ob.menu.reassign": "Reassign",
      "hrl3.ob.menu.nudge": "Nudge the owner",
      "hrl3.ob.menu.nudgeDisabled": "Not overdue yet",

      "hrl3.ob.complete.dlgTitle": "Complete “{task}”",
      "hrl3.ob.complete.noteLabel": "Note (optional)",
      "hrl3.ob.complete.evidenceLabel": "Evidence reference (optional)",
      "hrl3.ob.complete.confirm": "Mark complete",

      "hrl3.ob.reopen.dlgTitle": "Reopen “{task}”",
      "hrl3.ob.reopen.body": "This task was already marked complete. Reopening needs a reason and stays on the record.",
      "hrl3.ob.reopen.confirm": "Reopen",

      "hrl3.ob.reassign.dlgTitle": "Reassign “{task}”",
      "hrl3.ob.reassign.label": "New owner",
      "hrl3.ob.reassign.confirm": "Reassign",
      "hrl3.ob.reassign.done": "Reassigned to {who}.",

      "hrl3.ob.nudge.done": "Reminder sent to {who}.",

      "hrl3.ob.adhoc.add": "Add an ad-hoc task",
      "hrl3.ob.adhoc.dlgTitle": "Add an ad-hoc task",
      "hrl3.ob.adhoc.titleLabel": "Task title",
      "hrl3.ob.adhoc.titlePh": "e.g. Collect library card",
      "hrl3.ob.adhoc.titleMissing": "A title is required.",
      "hrl3.ob.adhoc.ownerLabel": "Owner",
      "hrl3.ob.adhoc.dueLabel": "Due date",
      "hrl3.ob.adhoc.go": "Add task",
      "hrl3.ob.adhoc.note": "Ad-hoc tasks are extra — they do not block marking the joiner ready.",

      "hrl3.ob.empty.head": "No one matches this filter",
      "hrl3.ob.foot": "Onboarding decisions join the service record \u2014 completed, reopened with a reason, or reassigned, never deleted.",

      /* -------- HR-23 · bulk / seasonal onboarding -------- */
      "hrl3.bulk.title": "Bulk / seasonal onboarding",
      "hrl3.bulk.sub": "Built for the day forty teachers start at once. This run is six, for Term 2's guest-faculty intake.",

      "hrl3.bulk.step.upload": "Upload",
      "hrl3.bulk.step.mapping": "Map columns",
      "hrl3.bulk.step.ready": "Review",
      "hrl3.bulk.step.committed": "Done",

      "hrl3.bulk.upload.title": "Upload a file",
      "hrl3.bulk.upload.body": "Use the template so every column lines up. This creates NEW staff only \u2014 updating records from a file is a separate mode.",
      "hrl3.bulk.upload.template": "Download the template",
      "hrl3.bulk.upload.templateGot": "On its way down. It carries the columns this import expects, in order \u2014 a sheet with its own names is rejected row by row.",
      "hrl3.bulk.upload.choose": "Choose a file",
      "hrl3.bulk.upload.chosen": "{name} · {n} rows parsed",

      "hrl3.bulk.mapping.title": "Map columns",
      "hrl3.bulk.mapping.sub": "Matching columns are filled in automatically. One column needs a manual match before this can be validated.",
      "hrl3.bulk.mapping.col.file": "Column in file",
      "hrl3.bulk.mapping.col.field": "Maps to",
      "hrl3.bulk.mapping.pick": "Choose a field",
      "hrl3.bulk.mapping.validate": "Validate",

      "hrl3.bulk.field.name": "Full name",
      "hrl3.bulk.field.desig": "Designation",
      "hrl3.bulk.field.dept": "Department",
      "hrl3.bulk.field.category": "Staff category",
      "hrl3.bulk.field.employment": "Employment type",
      "hrl3.bulk.field.vacation": "Teaching staff",
      "hrl3.bulk.field.contractEnd": "Contract end date",
      "hrl3.bulk.field.doj": "Date of joining",
      "hrl3.bulk.field.campus": "Campus",

      "hrl3.bulk.validating.head": "Validating…",
      "hrl3.bulk.validating.body": "Checking required fields, staff category, pay group and duplicates against the staff register.",

      "hrl3.bulk.ready.title": "Review before committing",
      "hrl3.bulk.ready.sub": "{ready} of {total} rows will be created; {blocked} are blocked and will be skipped.",
      "hrl3.bulk.ready.col.name": "Name",
      "hrl3.bulk.ready.col.desig": "Designation",
      "hrl3.bulk.ready.col.dept": "Department",
      "hrl3.bulk.ready.col.verdict": "Verdict",

      "hrl3.bulk.verdict.valid": "Valid",
      "hrl3.bulk.verdict.warning": "Warning — will still be created",
      "hrl3.bulk.verdict.blocked": "Blocked — will be skipped",

      "hrl3.bulk.reason.duplicate": "Matches {who} already on record",
      "hrl3.bulk.reason.missingField": "No pay group matches this staff category",
      "hrl3.bulk.reason.vacationDefault": "Vacation-staff flag was blank in the file — defaulting to No",

      "hrl3.bulk.commit": "Commit the import",
      "hrl3.bulk.commit.dlgTitle": "Commit this import?",
      "hrl3.bulk.commit.body": "{ready} staff will be created; {blocked} rows are skipped. This cannot be undone in bulk.",
      "hrl3.bulk.commit.idempotency": "Submitting twice will not create the batch twice — this run carries its own idempotency key.",
      "hrl3.bulk.commit.typeLabel": "Type {n} to confirm how many will be created",
      "hrl3.bulk.commit.typeMismatch": "That does not match the count above.",
      "hrl3.bulk.commit.go": "Commit",

      "hrl3.bulk.committing.head": "Committing…",
      "hrl3.bulk.committing.body": "Do not close this tab. Rows already created will stand even if this is interrupted.",

      "hrl3.bulk.committed.title": "Import complete",
      "hrl3.bulk.committed.summary": "{created} created · {skipped} skipped",
      "hrl3.bulk.committed.col.name": "Name",
      "hrl3.bulk.committed.col.desig": "Designation",
      "hrl3.bulk.committed.col.dept": "Department",
      "hrl3.bulk.committed.col.outcome": "Outcome",
      "hrl3.bulk.outcome.created": "Created — on the staff register",
      "hrl3.bulk.outcome.skippedDuplicate": "Skipped — matches {who} already on record",
      "hrl3.bulk.outcome.skippedField": "Skipped — no pay group matches this staff category",
      "hrl3.bulk.committed.errorReport": "Download the error report",
      "hrl3.bulk.committed.resumeNote": "Skipped rows are not lost \u2014 fix them in the error report and re-upload just those. Nothing already created is duplicated.",
      "hrl3.bulk.startOver": "Start a new import",

      /* -------- HR-24 · probation & confirmation -------- */
      "hrl3.prob.title": "Probation & confirmation queue",
      "hrl3.prob.sub": "Who is due for confirmation, what their manager recommends, and the decision to confirm or extend.",

      "hrl3.prob.filter.dept": "Department",
      "hrl3.prob.filter.deptAll": "All departments",

      "hrl3.prob.col.employee": "Employee",
      "hrl3.prob.col.dept": "Department",
      "hrl3.prob.col.due": "Confirmation due",
      "hrl3.prob.col.state": "State",
      "hrl3.prob.col.rec": "Recommendation",
      "hrl3.prob.col.actions": "Actions",

      "hrl3.prob.state.overdue": "Overdue",
      "hrl3.prob.state.dueSoon": "Due soon",
      "hrl3.prob.state.extension": "Extension recommended",

      "hrl3.prob.due.overdueN": "{n} days overdue",
      "hrl3.prob.due.overdue1": "1 day overdue",
      "hrl3.prob.due.inN": "due in {n} days",
      "hrl3.prob.due.in1": "due in 1 day",

      "hrl3.prob.rec.none": "No recommendation yet",
      "hrl3.prob.rec.confirm": "Recommends confirmation",
      "hrl3.prob.rec.extend": "Recommends extension",
      "hrl3.prob.rec.by": "— {who}",

      "hrl3.prob.menu.confirm": "Confirm",
      "hrl3.prob.menu.extend": "Extend probation",
      "hrl3.prob.menu.requestRec": "Request a manager recommendation",
      "hrl3.prob.menu.requestRecDisabled": "Already requested",

      "hrl3.prob.reqRec.done": "Requested from {who}.",

      "hrl3.prob.confirm.dlgTitle": "Confirm {name}?",
      "hrl3.prob.confirm.effLabel": "Effective from",
      "hrl3.prob.confirm.noRecWarn": "No manager recommendation is on file. You can still confirm, but consider requesting one first.",
      "hrl3.prob.confirm.c1": "Moves {name} from probation to permanent.",
      "hrl3.prob.confirm.c2vacSame": "{name}'s vacation-staff status does not change — still no earned-leave accrual.",
      "hrl3.prob.confirm.c2nonvacStart": "{name} is not teaching staff — confirmation may start earned-leave accrual and change the pay group from the effective date.",
      "hrl3.prob.confirm.c3": "Recorded on {name}'s service record; notified to {name} and their manager.",
      "hrl3.prob.confirm.go": "Confirm",
      "hrl3.prob.confirm.done": "Confirmed by {who} on {date}, effective {eff}.",

      "hrl3.prob.extend.dlgTitle": "Extend {name}'s probation",
      "hrl3.prob.extend.dateLabel": "New confirmation due date",
      "hrl3.prob.extend.dateMissing": "A new date is required.",
      "hrl3.prob.extend.datePast": "The new date must be after today.",
      "hrl3.prob.extend.reasonPh": "e.g. more time needed to assess classroom management",
      "hrl3.prob.extend.go": "Extend",
      "hrl3.prob.extend.done": "Extended by {who} to {date}.",

      "hrl3.prob.bulk.selected1": "1 selected",
      "hrl3.prob.bulk.selectedN": "{count} selected",
      "hrl3.prob.bulk.confirm": "Bulk confirm",
      "hrl3.prob.bulk.checkDisabled.noRec": "No recommendation on file",
      "hrl3.prob.bulk.checkDisabled.extendRec": "Manager recommended an extension, not confirmation",
      "hrl3.prob.bulk.dlgTitle": "Bulk confirm {count} people?",
      "hrl3.prob.bulk.dlgRow": "{name} · effective {date}",
      "hrl3.prob.bulk.go": "Confirm all",
      "hrl3.prob.bulk.done": "{count} people confirmed by {who} on {date}.",

      "hrl3.prob.hist.title": "Recently decided",
      "hrl3.prob.hist.sub": "Read-only — a decision here is on the service record and cannot be edited or removed.",
      "hrl3.prob.hist.confirmed": "Confirmed · effective {date} · by {who}",

      "hrl3.prob.empty.head": "No one on probation in this department",
      "hrl3.prob.empty.body": "Try a different department, or clear the filter.",
      "hrl3.prob.foot": "Confirmation and extension are recorded against the service record — there is no delete here.",

      /* -------- HR-25 · renewal & non-renewal -------- */
      "hrl3.ren.title": "Renewal & non-renewal queue",
      "hrl3.ren.sub": "Whose contract ends, what their department head recommends, and the Principal's decision to renew or not.",

      "hrl3.ren.lead.title": "Already past their contract end date, still on the active register",
      "hrl3.ren.lead.sub": "A lapse like this is a compliance exposure — decide or bridge it, do not leave it open.",
      "hrl3.ren.lead.item": "{n} days past end date",
      "hrl3.ren.lead.empty": "Nothing has lapsed without a decision.",

      "hrl3.ren.col.employee": "Employee",
      "hrl3.ren.col.dept": "Department",
      "hrl3.ren.col.end": "Contract end",
      "hrl3.ren.col.state": "State",
      "hrl3.ren.col.rec": "Recommendation",
      "hrl3.ren.col.actions": "Actions",

      "hrl3.ren.state.expiredWorking": "Expired — still active",
      "hrl3.ren.state.endingSoon": "Ending this session",
      "hrl3.ren.state.awaitingDecision": "Awaiting the Principal's decision",
      "hrl3.ren.state.decidedRenew": "Decided — renew, not yet executed",
      "hrl3.ren.state.decidedNonRenew": "Decided — do not renew, not yet executed",

      "hrl3.ren.end.overdueN": "{n} days ago",
      "hrl3.ren.end.overdue1": "1 day ago",
      "hrl3.ren.end.inN": "in {n} days",
      "hrl3.ren.end.in1": "in 1 day",

      "hrl3.ren.rec.none": "No recommendation yet",
      "hrl3.ren.rec.renew": "Recommends renew",
      "hrl3.ren.rec.nonRenew": "Recommends non-renew",
      "hrl3.ren.rec.by": "— {who}",

      "hrl3.ren.menu.recommend": "Recommend a decision",
      "hrl3.ren.menu.recommendDisabled": "Already recommended",
      "hrl3.ren.menu.extend": "Extend temporarily",
      "hrl3.ren.menu.extendDisabled": "Already decided by the Principal",

      "hrl3.ren.note.principalOnly": "The renew decision belongs to the Principal. HR recommends and then executes it, so that action is not on this screen.",

      "hrl3.ren.recommend.dlgTitle": "Recommend a decision for {name}",
      "hrl3.ren.recommend.choiceLabel": "Recommendation",
      "hrl3.ren.recommend.renew": "Renew",
      "hrl3.ren.recommend.nonRenew": "Do not renew",
      "hrl3.ren.recommend.choiceMissing": "Choose renew or do-not-renew.",
      "hrl3.ren.recommend.reasonPh": "Why?",
      "hrl3.ren.recommend.go": "Send recommendation",
      "hrl3.ren.recommend.done": "Recommendation sent — visible to the Principal.",

      "hrl3.ren.extend.dlgTitle": "Extend {name} temporarily",
      "hrl3.ren.extend.dateLabel": "Bridge until",
      "hrl3.ren.extend.dateMissing": "A date is required.",
      "hrl3.ren.extend.datePast": "The new date must be after today.",
      "hrl3.ren.extend.reasonPh": "e.g. Principal's decision pending, the class cannot go uncovered",
      "hrl3.ren.extend.go": "Extend",
      "hrl3.ren.extend.done": "Bridged to {date} by {who}.",

      "hrl3.ren.bulk.selected1": "1 selected",
      "hrl3.ren.bulk.selectedN": "{count} selected",
      "hrl3.ren.bulk.execute": "Execute in bulk",
      "hrl3.ren.bulk.checkDisabled.noDecision": "Awaiting the Principal's decision",
      "hrl3.ren.bulk.dlgTitle": "Execute {count} decisions?",
      "hrl3.ren.bulk.dlgRowRenew": "{name} · renew to {date}",
      "hrl3.ren.bulk.dlgRowNonRenew": "{name} · do not renew · last working day {date}",
      "hrl3.ren.bulk.fandf": "Indicative F&F exposure across the non-renewals here: {amt} — Payroll computes the final figure at settlement.",
      "hrl3.ren.bulk.go": "Execute",
      "hrl3.ren.bulk.done": "{count} decisions executed by {who} on {date}.",

      "hrl3.ren.exec.renewDone": "Renewed to {date} · executed by {who} on {onDate}.",
      "hrl3.ren.exec.nonRenewDone": "Non-renewed · last working day {date} · executed by {who} on {onDate}. Full & Final settlement is now computable in Payroll.",

      "hrl3.ren.empty.head": "No contracts need attention",
      "hrl3.ren.empty.body": "Nothing is ending, lapsed or awaiting a decision in this view.",
      "hrl3.ren.foot": "A renewal or non-renewal decision supersedes the contract — nothing here is deleted.",
    },

  });

  /* ============================================================
     1 · TIME — demo clock 11 Aug 2026, matching every other v3 role
     page. Day counts are always computed from a stored date, never a
     second, independent literal.
     ============================================================ */
  const TODAY = ["11", "08", "2026"];
  const TODAY_ISO = "2026-08-11";
  function toDate(d) { return new Date(parseInt(d[2], 10), parseInt(d[1], 10) - 1, parseInt(d[0], 10)); }
  function daysFrom(d) { return Math.round((toDate(d) - toDate(TODAY)) / 86400000); } /* negative = past */
  function dmy(t, d) { if (!d) return null; return d[0] + " " + t("hrl3.mon." + d[1]) + " " + d[2]; }
  function isoToDmy(t, iso) { if (!iso) return null; const p = iso.split("-"); return dmy(t, [String(Number(p[2])), p[1], p[0]]); }
  function isoDaysFromToday(iso) { const p = iso.split("-").map(Number); return Math.round((Date.UTC(p[0], p[1] - 1, p[2]) - Date.UTC(2026, 7, 11)) / 86400000); }
  function addIsoDays(d, n) { const dt = toDate(d); dt.setDate(dt.getDate() + n); const y = dt.getFullYear(), m = String(dt.getMonth() + 1).padStart(2, "0"), day = String(dt.getDate()).padStart(2, "0"); return [String(dt.getDate()), m, String(y)]; }
  function initials(name) { const p = name.split(" ").filter(Boolean); return ((p[0] || "")[0] || "") + ((p[1] || "")[0] || ""); }

  /* ============================================================
     2 · LOCAL PRIMITIVES — none of these edit kit.jsx. Several are
     verbatim copies of patterns already independently defined in
     hr-compliance.jsx / hr-record.jsx / depthead.jsx — promotion
     candidates, noted at the end of the file.
     ============================================================ */

  function Avatar({ name, size }) {
    const { c } = useTheme();
    const s = size || 32;
    return (
      <span aria-hidden="true" style={{ width: s, height: s, borderRadius: G3.r.pill, background: c.sunken, color: c.inkMuted, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: G3.font.ui, fontSize: s * 0.36, fontWeight: 700 }}>
        {initials(name)}
      </span>
    );
  }

  function TopStrip({ campus, onCampus }) {
    const { t } = useLang();
    const { c } = useTheme();
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ fontSize: 0 }}>
          <span style={{ fontFamily: G3.font.ui, fontSize: 12.5, fontWeight: 700, color: c.ink }}>{t("hrl3.pageTitle")}</span>
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

  function arrToIsoL(d) { return d ? d[2] + "-" + d[1] + "-" + (String(d[0]).length === 1 ? "0" + d[0] : d[0]) : ""; }
  function isoToArrL(s) { const q = String(s).split("-"); return q.length === 3 ? [String(Number(q[2])), q[1], q[0]] : null; }

  /* PROMOTION CANDIDATE · Pop / PopFoot / Flash / Trail — the fifth
     independent copy across pages. */
  function Pop({ title, sub, onClose, children, width }) {
    const { c, shadow } = useTheme();
    const { ty } = useLang();
    return ReactDOM.createPortal(
      <div style={{ position: "fixed", inset: 0, zIndex: 2400, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div aria-hidden="true" onMouseDown={onClose} style={{ position: "absolute", inset: 0, background: c.rail, opacity: 0.55 }} />
        <div
          role="dialog" aria-modal="true"
          style={{
            position: "relative", width: width || 580, maxWidth: "100%", maxHeight: "86vh", overflowY: "auto",
            background: c.surface, border: "1px solid " + c.border, borderRadius: G3.r.lg,
            boxShadow: shadow(4), padding: "24px 26px 22px",
          }}
        >
          <h2 style={ty("h2", { margin: 0, color: c.ink })}>{title}</h2>
          {sub ? <p style={ty("small", { color: c.inkMuted, margin: "7px 0 0" })}>{sub}</p> : null}
          <div style={{ marginTop: 18 }}>{children}</div>
        </div>
      </div>,
      document.body
    );
  }

  function PopFoot({ confirmLabel, onConfirm, onCancel, danger, disabled }) {
    const { c } = useTheme();
    const { t } = useLang();
    return (
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20, paddingTop: 16, borderTop: "1px solid " + c.rule }}>
        <Button kind="ghost" onClick={onCancel}>{t("hrl3.cta.cancel")}</Button>
        <Button kind={danger ? "danger" : "primary"} onClick={onConfirm} disabled={disabled}>{confirmLabel}</Button>
      </div>
    );
  }

  function Flash({ text }) {
    const { c } = useTheme();
    const { ty } = useLang();
    if (!text) return null;
    return (
      <div role="status" style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "11px 14px", borderRadius: G3.r.md, border: "1px solid " + c.presentBorder, background: c.presentTint, marginBottom: G3.layout.gap }}>
        <span aria-hidden="true" style={{ color: c.presentText, display: "flex", paddingTop: 1 }}><Icon name="check" size={15} /></span>
        <span style={ty("small", { color: c.ink })}>{text}</span>
      </div>
    );
  }

  function Trail({ items }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    return (
      <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {items.map(function (it, i) {
          return (
            <li key={i} style={{ display: "flex", gap: 13, alignItems: "flex-start", paddingBottom: i < items.length - 1 ? 16 : 0 }}>
              <span aria-hidden="true" style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, alignSelf: "stretch" }}>
                <span style={{ width: 8, height: 8, borderRadius: G3.r.pill, background: c.accent, marginTop: 6, flexShrink: 0 }} />
                {i < items.length - 1 ? <span style={{ width: 1, flex: 1, background: c.border, marginTop: 4 }} /> : null}
              </span>
              <span style={{ minWidth: 0, flex: 1 }}>
                <span style={ty("small", { display: "block", color: c.ink, fontWeight: 600 })}>{t(it.k)}</span>
                <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 3 })}>
                  {dmy(t, it.d)}{it.byText ? " \u00b7 " + t("hrl3.tr.by", { who: it.byText }) : ""}
                </span>
                {it.noteText ? <span style={ty("small", { display: "block", color: c.ink, marginTop: 5 })}>{it.noteText}</span> : null}
              </span>
            </li>
          );
        })}
      </ol>
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

  function Value({ children, tone }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return <span style={ty("small", { color: tone || c.ink, fontWeight: 600 })}>{children}</span>;
  }

  function DoneLine({ children }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div style={{ display: "flex", gap: 9, alignItems: "flex-start", marginTop: 14, padding: "10px 12px", background: c.sunken, borderRadius: G3.r.md }}>
        <span aria-hidden="true" style={{ display: "flex", color: c.present, paddingTop: 1 }}><Icon name="check" size={15} /></span>
        <span role="status" style={ty("small", { color: c.ink })}>{children}</span>
      </div>
    );
  }

  function Warn({ children }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start", background: c.lateTint, borderRadius: G3.r.md, padding: "12px 14px", marginBottom: 16 }}>
        <span aria-hidden="true" style={{ display: "flex", color: c.lateText, paddingTop: 1 }}><Icon name="alert" size={15} /></span>
        <p style={ty("small", { margin: 0, color: c.lateText })}>{children}</p>
      </div>
    );
  }

  function Consequence({ lines }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    return (
      <div style={{ background: c.sunken, borderRadius: G3.r.md, padding: "12px 14px", margin: "4px 0 16px" }}>
        <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 6 })}>{t("hrl3.dlg.consequence")}</div>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {lines.map((l, i) => <li key={i} style={ty("small", { color: c.ink, marginBottom: i < lines.length - 1 ? 4 : 0 })}>{l}</li>)}
        </ul>
      </div>
    );
  }

  function RowCheck({ checked, onChange, disabled, ariaLabel }) {
    const { c } = useTheme();
    return (
      <button
        type="button" role="checkbox" aria-checked={checked ? "true" : "false"} aria-label={ariaLabel}
        disabled={disabled} onClick={() => !disabled && onChange(!checked)}
        style={{
          width: 19, height: 19, borderRadius: 5, flexShrink: 0,
          border: "1.5px solid " + (checked ? c.accent : c.borderStrong),
          background: checked ? c.accent : "transparent", color: c.onAccent,
          display: "flex", alignItems: "center", justifyContent: "center",
          opacity: disabled ? 0.4 : 1, cursor: disabled ? "default" : "pointer",
        }}
      >
        {checked ? <Icon name="check" size={12} /> : null}
      </button>
    );
  }

  /* radio group with NO pre-selected value — for a choice that must be
     made deliberately (renew vs non-renew). Local copy of the pattern
     already independently defined in depthead.jsx (PillGroup) and
     hr-record.jsx (ChoiceGroup). */
  function ChoiceGroup({ ariaLabel, items, value, onChange, invalid }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div role="radiogroup" aria-label={ariaLabel} aria-invalid={invalid ? "true" : undefined} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {items.map((it) => {
          const on = value === it.key;
          return (
            <button
              key={it.key} type="button" role="radio" aria-checked={on ? "true" : "false"}
              onClick={() => onChange(it.key)}
              style={ty("small", {
                background: on ? c.accentSoft : "transparent",
                border: "1px solid " + (on ? c.accent : invalid ? c.danger : c.borderStrong),
                color: on ? c.action : c.ink, fontWeight: on ? 700 : 600,
                borderRadius: G3.r.pill, padding: "7px 15px", cursor: "pointer",
              })}
            >
              {it.label}
            </button>
          );
        })}
      </div>
    );
  }

  /* a centred, portal-rendered dialog with a real backdrop, Escape and
     initial focus — matches depthead.jsx / hr-compliance.jsx / hr-
     record.jsx verbatim (kept local per-file per this dispatch's
     scope). */
  function Dialog({ title, onCancel, children, width }) {
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
      <div style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "48px 20px", overflowY: "auto" }}>
        <div aria-hidden="true" onMouseDown={onCancel} style={{ position: "fixed", inset: 0, background: c.rail, opacity: 0.55 }} />
        <div ref={boxRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title}
          style={{ position: "relative", width: width || 520, maxWidth: "100%", background: c.surface, border: "1px solid " + c.border, borderRadius: G3.r.card, boxShadow: shadow(4), padding: 24 }}>
          <h2 style={ty("h2", { margin: "0 0 12px", color: c.ink })}>{title}</h2>
          {children}
        </div>
      </div>,
      document.body
    );
  }

  function DialogFoot({ confirmLabel, onConfirm, onCancel, confirmDisabled }) {
    const { t } = useLang();
    return (
      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 18 }}>
        <Button kind="ghost" onClick={onCancel}>{t("hrl3.dlg.cancel")}</Button>
        <Button kind="primary" disabled={confirmDisabled} onClick={confirmDisabled ? (e) => e.preventDefault() : onConfirm}>{confirmLabel}</Button>
      </div>
    );
  }

  function GatedAction({ label, icon, reason, onClick }) {
    const { c } = useTheme();
    const { ty } = useLang();
    const off = !!reason;
    return (
      <div style={{ display: "flex", gap: 14, alignItems: "center", padding: "5px 0", flexWrap: "wrap" }}>
        <span style={{ flexShrink: 0 }}>
          <Button kind="secondary" size="sm" iconLeft={icon} disabled={off} onClick={off ? undefined : onClick}>{label}</Button>
        </span>
        {off ? <span style={ty("caption", { color: c.inkMuted, flex: 1, minWidth: 200 })}>{reason}</span> : null}
      </div>
    );
  }

  /* a scrollable, spinner-free "processing" placeholder, reused for
     HR-23's validating/committing transient states. */
  function Processing({ head, body }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <Card>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "18px 12px" }}>
          <Skeleton w={220} h={12} />
          <Skeleton w={320} h={12} />
          <div style={ty("h3", { color: c.ink, marginTop: 4 })}>{head}</div>
          <p style={ty("small", { color: c.inkMuted, margin: 0, maxWidth: 380, textAlign: "center" })}>{body}</p>
        </div>
      </Card>
    );
  }

  const DEPARTMENTS = ["Science", "Mathematics", "Primary", "Pre-primary", "Languages", "Administration", "Transport", "Hostel", "Arts", "Sports"];

  /* ============================================================
     3 · HR-22 · ONBOARDING CHECKLISTS
     ============================================================ */

  /* Every joiner's checklist follows the same seven-task template
     (M6 "checklist tasks: documents, assets, induction"). Two kinds:
     'checklist' tasks are owned and completed on THIS screen; 'linked'
     tasks are decided elsewhere (document verification lives in
     hr-compliance.jsx HR-10/HR-12; payroll setup lives in Payroll) and
     carry no Complete control here at all — status only, with a route
     where one exists. */
  function taskTemplate(doj) {
    return [
      { id: "docsRequested", labelKey: "hrl3.ob.task.docsRequested", kind: "linked", owner: "hr", mandatory: true, safeguarding: false, route: "hrDocs", routeKey: "hrl3.ob.task.openDocs", noteKey: "hrl3.ob.task.linkedNote.docs", state: "pending", due: addIsoDays(doj, 3) },
      { id: "policeVerif", labelKey: "hrl3.ob.task.policeVerif", kind: "linked", owner: "hr", mandatory: true, safeguarding: true, route: "hrCompliance", routeKey: "hrl3.ob.task.openBoard", noteKey: "hrl3.ob.task.linkedNote.docs", state: "pending", due: addIsoDays(doj, 12) },
      { id: "childSafety", labelKey: "hrl3.ob.task.childSafety", kind: "linked", owner: "hr", mandatory: true, safeguarding: true, route: "hrCompliance", routeKey: "hrl3.ob.task.openBoard", noteKey: "hrl3.ob.task.linkedNote.docs", state: "pending", due: addIsoDays(doj, 12) },
      { id: "itAssets", labelKey: "hrl3.ob.task.itAssets", kind: "checklist", owner: "it", mandatory: true, safeguarding: false, state: "pending", due: addIsoDays(doj, 2) },
      { id: "induction", labelKey: "hrl3.ob.task.induction", kind: "checklist", owner: "dept", mandatory: true, safeguarding: false, state: "pending", due: addIsoDays(doj, 5), dependsOn: null },
      { id: "handbook", labelKey: "hrl3.ob.task.handbook", kind: "checklist", owner: "employee", mandatory: true, safeguarding: false, state: "pending", due: addIsoDays(doj, 5) },
      { id: "payrollSetup", labelKey: "hrl3.ob.task.payrollSetup", kind: "linked", owner: "payroll", mandatory: true, safeguarding: false, route: null, noteKey: "hrl3.ob.task.linkedNote.payroll", state: "pending", due: addIsoDays(doj, 7) },
    ];
  }

  /* seed data — Neha Bhatt NAV-0250 is hr.jsx's own record (still "no
     login yet" there); the rest are new to this file. Every named
     HR-22 state is represented once: notStarted, inProgress, overdue,
     blocked, complete (after marking), didNotReport. */
  const JOINERS_SEED = [
    { id: "j1", campus: "indiranagar", name: "Neha Bhatt", code: "NAV-0250", desig: "PRT, Class V", dept: "Primary", cat: "teaching", doj: ["1", "08", "2026"] },
    { id: "j2", campus: "indiranagar", name: "Arjun Kulkarni", code: "NAV-0301", desig: "TGT, Computer Science", dept: "Science", cat: "teaching", doj: ["10", "08", "2026"] },
    { id: "j3", campus: "whitefield", name: "Priya Deshpande", code: "NAV-0298", desig: "Front office executive", dept: "Administration", cat: "non_teaching", doj: ["8", "08", "2026"] },
    { id: "j4", campus: "whitefield", name: "Waheeda Sheikh", code: "NAV-0276", desig: "NTT, Pre-primary", dept: "Pre-primary", cat: "teaching", doj: ["20", "07", "2026"] },
    { id: "j5", campus: "indiranagar", name: "Kiran Rao", code: "NAV-0304", desig: "Guest faculty, Sanskrit", dept: "Languages", cat: "guest", doj: ["4", "08", "2026"] },
    { id: "j6", campus: "whitefield", name: "Devika Shah", code: "NAV-0289", desig: "TGT, Social Science", dept: "Languages", cat: "teaching", doj: ["28", "07", "2026"] },
  ];

  function seedTasksFor(id) {
    if (id === "j1") { /* Neha — in progress: IT + induction done, police/child-safety/payroll/handbook pending, nothing overdue */
      const t = taskTemplate(["1", "08", "2026"]);
      t[1].due = ["13", "08", "2026"]; t[2].due = ["13", "08", "2026"];
      t[3].state = "done"; t[3].doneOn = ["3", "08", "2026"]; t[3].doneBy = "Rohit Kannan, IT";
      t[4].state = "done"; t[4].doneOn = ["4", "08", "2026"]; t[4].doneBy = "Radhika Menon, Head of Primary";
      return t;
    }
    if (id === "j2") return []; /* Arjun — not started, no checklist generated yet */
    if (id === "j3") { /* Priya — overdue: docsRequested was due 2 days ago, still pending */
      const t = taskTemplate(["8", "08", "2026"]);
      t[0].due = ["9", "08", "2026"];
      t[3].state = "done"; t[3].doneOn = ["9", "08", "2026"]; t[3].doneBy = "Rohit Kannan, IT";
      return t;
    }
    if (id === "j4") { /* Waheeda — blocked: itAssets overdue by ~20 days, handbook blocked on it */
      const t = taskTemplate(["20", "07", "2026"]);
      t[0].state = "done"; t[0].doneOn = ["23", "07", "2026"]; t[0].doneBy = "Meera Iyer, HR";
      t[1].state = "done"; t[1].doneOn = ["25", "07", "2026"]; t[1].doneBy = "Meera Iyer, HR";
      t[2].state = "done"; t[2].doneOn = ["25", "07", "2026"]; t[2].doneBy = "Meera Iyer, HR";
      t[3].due = ["22", "07", "2026"];
      t[4].state = "done"; t[4].doneOn = ["27", "07", "2026"]; t[4].doneBy = "Farah Sheikh's mentor, Pre-primary";
      t[5].state = "blocked"; t[5].dependsOn = "itAssets";
      return t;
    }
    if (id === "j5") return taskTemplate(["4", "08", "2026"]); /* Kiran — did not report; template exists but nothing actioned */
    if (id === "j6") { /* Devika — every mandatory task done, ready to mark */
      const t = taskTemplate(["28", "07", "2026"]);
      t[0].state = "done"; t[0].doneOn = ["2", "08", "2026"]; t[0].doneBy = "Meera Iyer, HR";
      t[1].state = "done"; t[1].doneOn = ["3", "08", "2026"]; t[1].doneBy = "Meera Iyer, HR";
      t[2].state = "done"; t[2].doneOn = ["3", "08", "2026"]; t[2].doneBy = "Meera Iyer, HR";
      t[3].state = "done"; t[3].doneOn = ["29", "07", "2026"]; t[3].doneBy = "Rohit Kannan, IT";
      t[4].state = "done"; t[4].doneOn = ["30", "07", "2026"]; t[4].doneBy = "Devraj Oberoi, Head of Languages";
      t[5].state = "done"; t[5].doneOn = ["30", "07", "2026"]; t[5].doneBy = "Devika Shah";
      t[6].state = "done"; t[6].doneOn = ["5", "08", "2026"]; t[6].doneBy = "Payroll Operator";
      return t;
    }
    return taskTemplate(["1", "08", "2026"]);
  }

  function computeJoinerState(joinerId, tasks) {
    if (joinerId === "j5") return "didNotReport"; /* [proposed] state, M6 §Business rules is silent on it */
    if (!tasks.length) return "notStarted";
    const mandatory = tasks.filter((x) => x.mandatory);
    if (mandatory.every((x) => x.state === "done")) return "complete";
    if (mandatory.some((x) => x.state === "blocked")) return "blocked";
    if (mandatory.some((x) => x.state === "pending" && x.due && daysFrom(x.due) < 0)) return "overdue";
    return "inProgress";
  }

  /* ============================================================
     ONBOARDING — what is left before each new joiner can start

     What it was: a 380px list of joiners wedged beside a detail
     panel, with a band of chips above it, a card of prose above that,
     and the joiner's checklist as seven identical rows. Three things
     were wrong, and they are the three this system keeps ruling on:

       · a list beside a panel squeezes both — names wrapped to three
         lines in a 160px column while the panel had room to spare;
       · the band carried no numbers, so nothing on the screen said
         how much was outstanding or how much of it was HR's;
       · every task looked the same, so the one question a person
         opens this screen with — "what do I have to do, and what am I
         waiting on somebody else for" — had to be answered by reading
         seven owner chips one at a time.

     Now: the band every module has, a full-width register, and the
     joiner on a screen of their own with the checklist split by WHO
     IS HOLDING IT UP. Safeguarding is pulled out of the list, because
     it is the one group nobody may skip and it should never be found
     by scrolling.
     ============================================================ */
  const OWNER_KEYS = { hr: "hrl3.ob.owner.hr", it: "hrl3.ob.owner.it", dept: "hrl3.ob.owner.dept", employee: "hrl3.ob.owner.employee", payroll: "hrl3.ob.owner.payroll" };
  const OWNER_OPTIONS = ["hr", "it", "dept", "employee"];

  const OB_LOOK = {
    notStarted: { role: "missing", fill: "chartSand", glyph: "alert" },
    inProgress: { role: "ltEL", fill: "chartBlue", glyph: "clock" },
    overdue: { role: "absent", fill: "chartRed", glyph: "alert" },
    blocked: { role: "penalty", fill: "chartPurple", glyph: "lock" },
    complete: { role: "present", fill: "chartGreen", glyph: "check" },
    didNotReport: { role: "off", fill: "chartAmber", glyph: "signout" },
  };
  const OB_ORDER = ["overdue", "blocked", "notStarted", "inProgress", "didNotReport", "complete"];

  function taskLabelOf(t, task) { return task.labelKey ? t(task.labelKey) : task.labelText; }
  function taskOverdue(task) { return task.state === "pending" && task.due && daysFrom(task.due) < 0; }
  function taskDone(task) { return task.state === "done"; }
  function mineToDo(task) { return task.owner === "hr"; }

  /* ONE TASK, with its state said once rather than twice */
  /* ONE JOINER, AS ONE TABLE (designer).

     This was a page: a progress card, a safeguarding card, a card of
     three grouped lists, and a card repeating the designation and the
     department the row above already said. Every one of those groups
     was the same object — a task, whose job it is, when it is due and
     whether it is done — sorted into piles by a value that is already
     a column. So it is a table, sorted so the undone and the overdue
     are at the top, in the side screen everything else opens in. */
  function JoinerSheet({ joiner, onClose, onUpdateTask, onGenerate, onAddAdhoc, onMarkReady, readyMeta, onNavigate }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [dlg, setDlg] = useState(null);
    const [adhoc, setAdhoc] = useState(false);
    const tasks = joiner.tasks || [];
    const mandatory = tasks.filter(function (x) { return x.mandatory; });
    const canBeReady = mandatory.length > 0 && mandatory.every(taskDone);
    const meta = readyMeta[joiner.id];

    const order = tasks.slice().sort(function (a, b) {
      const da = taskDone(a) ? 2 : taskOverdue(a) ? 0 : 1;
      const db = taskDone(b) ? 2 : taskOverdue(b) ? 0 : 1;
      if (da !== db) return da - db;
      return (a.due && b.due) ? toDate(a.due) - toDate(b.due) : 0;
    });

    const columns = [
      { key: "task", label: t("hrl3.ob.col.task") },
      { key: "who", label: t("hrl3.ob.col.who"), width: 130 },
      { key: "due", label: t("hrl3.ob.col.due"), mono: true, width: 120 },
      { key: "state", label: t("hrl3.ob.col.state"), width: 190 },
      { key: "act", label: "", align: "right", width: 150 },
    ];

    const rows = order.map(function (x) {
      const done = taskDone(x);
      const over = taskOverdue(x);
      return {
        id: x.id,
        tone: done ? "dim" : undefined,
        cells: {
          task: (
            <span style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", minWidth: 0 }}>
              <span style={ty("small", { color: done ? c.inkMuted : c.ink, fontWeight: 600 })}>{taskLabelOf(t, x)}</span>
              {x.safeguarding ? <StatusMark role="penalty" glyph="lock" word={t("hrl3.ob.task.safeguard")} /> : null}
            </span>
          ),
          who: <span style={ty("caption", { color: c.inkMuted })}>{t("hrl3.ob.owner." + x.owner)}</span>,
          due: dmy(t, x.due),
          state: done
            ? <StatusMark role="present" glyph="check" word={t("hrl3.ob.st.done", { date: dmy(t, x.doneOn) })} />
            : over
              ? <StatusMark role="absent" glyph="alert" word={t("hrl3.ob.st.over", { n: num(Math.abs(daysFrom(x.due))) })} />
              : x.state === "blocked"
                ? <StatusMark role="off" glyph="lock" word={t("hrl3.ob.st.blocked")} />
                : <StatusMark role="missing" glyph="clock" word={t("hrl3.ob.st.pending")} />,
          act: (
            <span style={{ display: "flex", justifyContent: "flex-end" }}>
              <Button kind="ghost" size="sm"
                onClick={function () { setDlg({ kind: done ? "reopen" : "complete", task: x }); }}
              >{t(done ? "hrl3.ob.act.reopen" : "hrl3.ob.act.done")}</Button>
            </span>
          ),
        },
      };
    });

    return (
      <SideScreen
        title={joiner.name}
        sub={t("hrl3.ob.sheetSub", { desig: joiner.desig, dept: joiner.dept, date: dmy(t, joiner.doj) })}
        width={820} onClose={onClose}
        footer={
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <Button kind="ghost" size="sm" iconLeft="staff" onClick={function () { onNavigate && onNavigate("hrRecord"); }}>{t("hrl3.ob.openRecord")}</Button>
            {tasks.length ? (
              <Button kind="secondary" size="sm" iconLeft="plus" onClick={function () { setAdhoc(true); }}>{t("hrl3.ob.addAdhoc")}</Button>
            ) : null}
            {tasks.length && !meta ? (
              <Button kind="primary" size="sm" iconLeft="check" disabled={!canBeReady}
                onClick={function () { setDlg({ kind: "ready" }); }}>{t("hrl3.ob.markReady")}</Button>
            ) : null}
          </div>
        }
      >
        {meta ? (
          <div style={{ marginBottom: 14 }}>
            <StatusMark role="present" glyph="check" word={t("hrl3.ob.readyOn", { date: dmy(t, meta.on) })} />
          </div>
        ) : null}

        {tasks.length === 0 ? (
          <EmptyState
            head={t("hrl3.ob.noList.head")} body={t("hrl3.ob.noList.body")}
            action={<Button kind="primary" iconLeft="plus" onClick={function () { onGenerate(joiner.id, joiner.doj); }}>{t("hrl3.ob.generate")}</Button>}
          />
        ) : (
          <Register columns={columns} rows={rows} />
        )}

        {dlg && dlg.kind === "complete" ? (
          <CompleteTaskDialog task={dlg.task} taskLabel={taskLabelOf(t, dlg.task)} onClose={function () { setDlg(null); }}
            onDone={function () { onUpdateTask(joiner.id, dlg.task.id, { state: "done", doneOn: TODAY, doneBy: "Meera Iyer, HR" }); setDlg(null); }} />
        ) : null}
        {dlg && dlg.kind === "reopen" ? (
          <ReopenTaskDialog task={dlg.task} taskLabel={taskLabelOf(t, dlg.task)} onClose={function () { setDlg(null); }}
            onDone={function () { onUpdateTask(joiner.id, dlg.task.id, { state: "pending", doneOn: null, doneBy: null }); setDlg(null); }} />
        ) : null}
        {dlg && dlg.kind === "ready" ? (
          <Pop title={t("hrl3.ob.ready.title")} sub={joiner.name} onClose={function () { setDlg(null); }}>
            <Consequence lines={[t("hrl3.ob.ready.c1"), t("hrl3.ob.ready.c2"), t("hrl3.ob.ready.c3")]} />
            <PopFoot confirmLabel={t("hrl3.ob.ready.cta")} onCancel={function () { setDlg(null); }}
              onConfirm={function () { onMarkReady(joiner.id); setDlg(null); }} />
          </Pop>
        ) : null}
        {adhoc ? <AdhocPop onClose={function () { setAdhoc(false); }} onDone={function (title, owner, due) { onAddAdhoc(joiner.id, title, owner, due); setAdhoc(false); }} /> : null}
      </SideScreen>
    );
  }

  function AdhocPop({ onClose, onDone }) {
    const { t } = useLang();
    const [title, setTitle] = useState("");
    const [owner, setOwner] = useState("hr");
    const [due, setDue] = useState(arrToIsoL(TODAY));
    return (
      <Pop title={t("hrl3.ob.adhoc.title")} onClose={onClose}>
        <Field id="hrl3-ad-title" label={t("hrl3.ob.adhoc.what")} hint={t("hrl3.ob.adhoc.whatHint")}>
          <Input id="hrl3-ad-title" value={title} onChange={setTitle} />
        </Field>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 200px" }}>
            <Field id="hrl3-ad-owner" label={t("hrl3.ob.adhoc.owner")}>
              <Select id="hrl3-ad-owner" value={owner} onChange={setOwner}
                options={OWNER_OPTIONS.map(function (k) { return { value: k, label: t(OWNER_KEYS[k]) }; })} />
            </Field>
          </div>
          <div style={{ flex: "1 1 180px" }}>
            <Field id="hrl3-ad-due" label={t("hrl3.ob.adhoc.due")}>
              <Input id="hrl3-ad-due" type="date" value={due} onChange={setDue} />
            </Field>
          </div>
        </div>
        <Consequence lines={[t("hrl3.ob.adhoc.c1"), t("hrl3.ob.adhoc.c2")]} />
        <PopFoot confirmLabel={t("hrl3.ob.adhoc.cta")} onCancel={onClose} disabled={!title.trim() || !due}
          onConfirm={function () { onDone(title.trim(), owner, isoToArrL(due) || TODAY); }} />
      </Pop>
    );
  }

  function JoinersTab({ joiners, onOpen, flash }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [pick, setPick] = useState("all");

    const list = joiners.filter(function (j) { return pick === "all" || j.state === pick; })
      .slice().sort(function (a, b) { return daysFrom(a.doj) - daysFrom(b.doj); });

    const band = OB_ORDER.map(function (s) {
      return { key: s, label: t("hrl3.ob.state." + s), value: joiners.filter(function (j) { return j.state === s; }).length, color: c[OB_LOOK[s].fill] || c.accent };
    });
    const open = joiners.filter(function (j) { return j.state !== "complete" && j.state !== "didNotReport"; });
    const allTasks = [];
    open.forEach(function (j) { (j.tasks || []).forEach(function (x) { allTasks.push({ j: j, x: x }); }); });
    const overdueTasks = allTasks.filter(function (p) { return taskOverdue(p.x); }).length;
    const blockedTasks = allTasks.filter(function (p) { return p.x.state === "blocked"; }).length;
    const mineTasks = allTasks.filter(function (p) { return !taskDone(p.x) && mineToDo(p.x); }).length;
    const safeOpen = allTasks.filter(function (p) { return p.x.safeguarding && !taskDone(p.x); }).length;
    const doneAll = allTasks.filter(function (p) { return taskDone(p.x); }).length;

    const columns = [
      { key: "who", label: t("hrl3.ob.col.who") },
      { key: "doj", label: t("hrl3.ob.col.doj"), mono: true, width: 130 },
      { key: "since", label: t("hrl3.ob.col.since"), width: 130 },
      { key: "progress", label: t("hrl3.ob.col.progress"), width: 190 },
      { key: "state", label: t("hrl3.ob.col.state"), width: 170 },
    ];
    const rows = list.map(function (j) {
      const look = OB_LOOK[j.state];
      const tasks = j.tasks || [];
      const dn = tasks.filter(taskDone).length;
      const over = tasks.filter(taskOverdue).length;
      return {
        id: j.id, live: true,
        cells: {
          who: (
            <span style={{ display: "flex", gap: 11, alignItems: "center", minWidth: 0 }}>
              <Avatar name={j.name} size={30} />
              <span style={{ minWidth: 0 }}>
                <span style={ty("small", { display: "block", color: c.ink, fontWeight: 600 })}>{j.name}</span>
                <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 1 })}>{j.desig} · {j.dept}</span>
              </span>
            </span>
          ),
          doj: dmy(t, j.doj),
          since: <span style={ty("caption", { color: c.inkMuted })}>{Math.abs(daysFrom(j.doj)) === 1 ? t("hrl3.ob.since1") : t("hrl3.ob.sinceN", { n: num(Math.abs(daysFrom(j.doj))) })}</span>,
          progress: tasks.length ? (
            <span>
              <span style={ty("caption", { display: "block", color: c.inkMuted, marginBottom: 5 })}>
                {t("hrl3.ob.doneOf", { n: num(dn), total: num(tasks.length) })}
              </span>
              <Meter frac={dn / tasks.length} bar={dn === tasks.length ? c.chartGreen : over ? c.chartRed : c.chartBlue} height={4} label={t("hrl3.ob.doneOf", { n: num(dn), total: num(tasks.length) })} />
            </span>
          ) : <span style={ty("caption", { color: c.inkFaint })}>{t("hrl3.ob.noListShort")}</span>,
          state: <StatusMark role={look.role} glyph={look.glyph} word={t("hrl3.ob.state." + j.state)} />,
        },
      };
    });

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: G3.layout.gap }}>
        <Flash text={flash} />
        <Card>
          <MetricStrip
            pad={0} style={{ marginTop: 18 }}
            metrics={[
              { k: "joiners", label: t("hrl3.ob.m.joiners"), value: num(open.length), tone: c.chartTeal,
                note: t("hrl3.ob.m.joinersNote", { total: num(joiners.length) }) },
              { k: "mine", label: t("hrl3.ob.m.mine"), value: num(mineTasks), tone: c.chartBlue,
                note: t("hrl3.ob.m.mineNote", { n: num(allTasks.length - doneAll) }) },
              { k: "overdue", label: t("hrl3.ob.m.overdue"), value: num(overdueTasks),
                tone: overdueTasks ? c.chartRed : c.chartGreen,
                note: t("hrl3.ob.m.overdueNote") },
              { k: "blocked", label: t("hrl3.ob.m.blocked"), value: num(blockedTasks),
                tone: blockedTasks ? c.chartPurple : c.chartGreen,
                note: t("hrl3.ob.m.blockedNote") },
              { k: "safe", label: t("hrl3.ob.m.safe"), value: num(safeOpen),
                tone: safeOpen ? c.chartAmber : c.chartGreen,
                note: t("hrl3.ob.m.safeNote") },
            ]}
          />
        </Card>

        {rows.length === 0 ? (
          <Card><EmptyState head={t("hrl3.ob.empty.head")} body={t("hrl3.ob.empty.body")} /></Card>
        ) : (
          <Register
            title={t("hrl3.ob.reg.title")} sub={t("hrl3.ob.reg.sub")}
            /* the stage filter the bar's legend used to carry. A legend is
               a key to a chart; once the chart is gone it is a row of
               buttons pretending to be one, so it is a select. */
            action={
              <span style={{ width: 210 }}>
                <Select id="hrl3-ob-state" ariaLabel={t("hrl3.ob.col.state")} value={pick} onChange={setPick}
                  options={[{ value: "all", label: t("hrl3.ob.state.all") }].concat(
                    band.map(function (sg) { return { value: sg.key, label: sg.label + " (" + num(sg.value) + ")" }; })
                  )} />
              </span>
            }
            columns={columns} rows={rows} onSelect={onOpen}
            footer={<span style={ty("caption", { color: c.inkFaint })}>{t("hrl3.ob.reg.foot")}</span>}
          />
        )}
      </div>
    );
  }

  function CompleteTaskDialog({ task, taskLabel, onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [note, setNote] = useState("");
    const [evidence, setEvidence] = useState("");
    return (
      <Dialog title={t("hrl3.ob.complete.dlgTitle", { task: taskLabel })} onCancel={onClose}>
        <Field id="hrl3-ct-note" label={t("hrl3.ob.complete.noteLabel")}>
          <Input id="hrl3-ct-note" value={note} onChange={setNote} />
        </Field>
        <Field id="hrl3-ct-evidence" label={t("hrl3.ob.complete.evidenceLabel")}>
          <Input id="hrl3-ct-evidence" value={evidence} onChange={setEvidence} />
        </Field>
        <DialogFoot confirmLabel={t("hrl3.ob.complete.confirm")} onCancel={onClose} onConfirm={onDone} />
      </Dialog>
    );
  }

  function ReopenTaskDialog({ task, taskLabel, onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [reason, setReason] = useState("");
    const [err, setErr] = useState(null);
    function submit() { if (!reason.trim()) { setErr("hrl3.dlg.reasonMissing"); return; } onDone(); }
    return (
      <Dialog title={t("hrl3.ob.reopen.dlgTitle", { task: taskLabel })} onCancel={onClose}>
        <p style={ty("small", { color: c.inkMuted, margin: "0 0 14px" })}>{t("hrl3.ob.reopen.body")}</p>
        <Field id="hrl3-rt-reason" label={t("hrl3.dlg.reasonLabel")} error={err ? t(err) : null}>
          <Input id="hrl3-rt-reason" value={reason} onChange={(v) => { setReason(v); setErr(null); }} />
        </Field>
        <DialogFoot confirmLabel={t("hrl3.ob.reopen.confirm")} onCancel={onClose} onConfirm={submit} />
      </Dialog>
    );
  }

  /* ============================================================
     4 · HR-23 · BULK / SEASONAL ONBOARDING
     ============================================================ */

  const BULK_ROWS_SEED = [
    { id: "b1", name: "Rohan Mehta", desig: "TGT, English", dept: "Languages", verdict: "valid" },
    { id: "b2", name: "Ayesha Siddiqui", desig: "PRT, Class II", dept: "Primary", verdict: "valid" },
    { id: "b3", name: "Karan Oberoi", desig: "TGT, Mathematics", dept: "Mathematics", verdict: "blocked", reasonKey: "hrl3.bulk.reason.duplicate", who: "Vikram Sen (NAV-0118)" },
    { id: "b4", name: "Fatima Ali", desig: "Guest faculty, Art", dept: "Arts", verdict: "blocked", reasonKey: "hrl3.bulk.reason.missingField" },
    { id: "b5", name: "Devansh Kapoor", desig: "Bus conductor", dept: "Transport", verdict: "warning", reasonKey: "hrl3.bulk.reason.vacationDefault" },
    { id: "b6", name: "Priyanka Joshi", desig: "Front office executive", dept: "Administration", verdict: "valid" },
  ];
  const MAPPED_FIELDS = ["name", "desig", "dept", "employment", "vacation", "contractEnd", "doj", "campus"];

  function BulkTab() {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const L = G3.layout;
    const [step, setStep] = useState("upload");
    const [template, setTemplate] = useState(false);
    const [fileName, setFileName] = useState(null);
    const [categoryMapped, setCategoryMapped] = useState("");
    const [typedCount, setTypedCount] = useState("");
    const [showCommitDlg, setShowCommitDlg] = useState(false);
    const [countdown, setCountdown] = useState(false);

    const readyRows = BULK_ROWS_SEED.filter((r) => r.verdict !== "blocked");
    const blockedRows = BULK_ROWS_SEED.filter((r) => r.verdict === "blocked");

    function chooseFile() { setFileName("term2-guest-faculty.xlsx"); setStep("mapping"); }
    function validate() {
      setStep("validating");
      setTimeout(() => setStep("ready"), 550);
    }
    function commit() {
      setShowCommitDlg(false);
      setStep("committing");
      setTimeout(() => setStep("committed"), 650);
    }

    const STEPS = ["upload", "mapping", "ready", "committed"];
    const stepIdx = { upload: 0, mapping: 0, validating: 1, ready: 1, committing: 2, committed: 3 }[step];

    return (
      <div>
        <Card icon="staff" iconTone="accent" title={t("hrl3.bulk.title")} sub={t("hrl3.bulk.sub")} style={{ marginBottom: L.gap }} />

        <div style={{ display: "flex", gap: 8, marginBottom: L.gap, flexWrap: "wrap" }}>
          {[{ k: "upload", l: t("hrl3.bulk.step.upload") }, { k: "mapping", l: t("hrl3.bulk.step.mapping") }, { k: "ready", l: t("hrl3.bulk.step.ready") }, { k: "committed", l: t("hrl3.bulk.step.committed") }].map((s, i) => (
            <Chip key={s.k} bg={i <= stepIdx ? c.accentSoft : c.sunken} fg={i <= stepIdx ? c.action : c.inkFaint}>{(i + 1) + ". " + s.l}</Chip>
          ))}
        </div>

        {template ? (
          <div role="status" style={{ marginBottom: 14 }}>
            <Card fill={c.presentTint} border={c.border} pad={14}>
              <span style={ty("small", { color: c.ink, fontWeight: 600 })}>{t("hrl3.bulk.upload.templateGot")}</span>
            </Card>
          </div>
        ) : null}
        {step === "upload" ? (
          <Card title={t("hrl3.bulk.upload.title")} sub={t("hrl3.bulk.upload.body")}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <LinkButton onClick={() => setTemplate(true)}>{t("hrl3.bulk.upload.template")}</LinkButton>
              <Button kind="primary" iconLeft="download" onClick={chooseFile}>{t("hrl3.bulk.upload.choose")}</Button>
            </div>
          </Card>
        ) : null}

        {step === "mapping" ? (
          <Card title={t("hrl3.bulk.mapping.title")} sub={t("hrl3.bulk.mapping.sub")}>
            <p style={ty("caption", { color: c.inkFaint, margin: "0 0 10px" })}>{t("hrl3.bulk.upload.chosen", { name: fileName, n: num(BULK_ROWS_SEED.length) })}</p>
            {MAPPED_FIELDS.map((f, i) => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 14, padding: "8px 0", borderBottom: i < MAPPED_FIELDS.length - 1 ? "1px dashed " + c.border : "none" }}>
                <span style={G3.fig("sm", { color: c.inkMuted, flex: "0 0 40%" })}>{f}</span>
                <span aria-hidden="true" style={{ color: c.inkFaint }}><Icon name="arrow" size={13} /></span>
                <span style={ty("small", { color: c.ink, fontWeight: 600 })}>{t("hrl3.bulk.field." + f)}</span>
              </div>
            ))}
            <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "8px 0" }}>
              <span style={G3.fig("sm", { color: c.inkMuted, flex: "0 0 40%" })}>category_code</span>
              <span aria-hidden="true" style={{ color: c.inkFaint }}><Icon name="arrow" size={13} /></span>
              <div style={{ minWidth: 220 }}>
                <Select id="hrl3-bulk-map-cat" value={categoryMapped} onChange={setCategoryMapped}
                  options={[{ value: "", label: t("hrl3.bulk.mapping.pick") }, { value: "category", label: t("hrl3.bulk.field.category") }]} />
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <Button kind="primary" disabled={!categoryMapped} onClick={categoryMapped ? validate : undefined}>{t("hrl3.bulk.mapping.validate")}</Button>
            </div>
          </Card>
        ) : null}

        {step === "validating" ? <Processing head={t("hrl3.bulk.validating.head")} body={t("hrl3.bulk.validating.body")} /> : null}

        {step === "ready" || step === "committing" ? (
          <div>
            <Register
              title={t("hrl3.bulk.ready.title")}
              sub={t("hrl3.bulk.ready.sub", { ready: num(readyRows.length), total: num(BULK_ROWS_SEED.length), blocked: num(blockedRows.length) })}
              columns={[
                { key: "name", label: t("hrl3.bulk.ready.col.name") },
                { key: "desig", label: t("hrl3.bulk.ready.col.desig") },
                { key: "dept", label: t("hrl3.bulk.ready.col.dept") },
                { key: "verdict", label: t("hrl3.bulk.ready.col.verdict") },
              ]}
              rows={BULK_ROWS_SEED.map((r) => ({
                id: r.id, tone: r.verdict === "blocked" ? "dim" : undefined,
                cells: {
                  name: r.name, desig: r.desig, dept: r.dept,
                  verdict: (
                    <span>
                      <StatusMark role={r.verdict === "valid" ? "present" : r.verdict === "warning" ? "late" : "absent"} word={t("hrl3.bulk.verdict." + r.verdict)} />
                      {r.reasonKey ? <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 3 })}>{t(r.reasonKey, r.who ? { who: r.who } : undefined)}</span> : null}
                    </span>
                  ),
                },
              }))}
              footer={<Button kind="primary" disabled={step === "committing"} onClick={() => setShowCommitDlg(true)}>{t("hrl3.bulk.commit")}</Button>}
            />
            {step === "committing" ? <div style={{ marginTop: L.gap }}><Processing head={t("hrl3.bulk.committing.head")} body={t("hrl3.bulk.committing.body")} /></div> : null}
          </div>
        ) : null}

        {step === "committed" ? (
          <div>
            <Card title={t("hrl3.bulk.committed.title")} sub={t("hrl3.bulk.committed.summary", { created: num(readyRows.length), skipped: num(blockedRows.length) })} style={{ marginBottom: L.gap }}>
              <p style={ty("small", { color: c.inkMuted, margin: 0 })}>{t("hrl3.bulk.committed.resumeNote")}</p>
            </Card>
            <Register
              title={t("hrl3.bulk.committed.title")}
              columns={[
                { key: "name", label: t("hrl3.bulk.committed.col.name") },
                { key: "desig", label: t("hrl3.bulk.committed.col.desig") },
                { key: "dept", label: t("hrl3.bulk.committed.col.dept") },
                { key: "outcome", label: t("hrl3.bulk.committed.col.outcome") },
              ]}
              rows={BULK_ROWS_SEED.map((r) => ({
                id: r.id, tone: r.verdict === "blocked" ? "dim" : undefined,
                cells: {
                  name: r.name, desig: r.desig, dept: r.dept,
                  outcome: (
                    <StatusMark
                      role={r.verdict === "blocked" ? "absent" : "present"}
                      word={r.verdict === "blocked" ? t(r.reasonKey === "hrl3.bulk.reason.duplicate" ? "hrl3.bulk.outcome.skippedDuplicate" : "hrl3.bulk.outcome.skippedField", r.who ? { who: r.who } : undefined) : t("hrl3.bulk.outcome.created")}
                    />
                  ),
                },
              }))}
              footer={
                <div style={{ display: "flex", gap: 12, justifyContent: "space-between", width: "100%", flexWrap: "wrap" }}>
                  <Button kind="secondary" iconLeft="download" disabled={blockedRows.length === 0}>{t("hrl3.bulk.committed.errorReport")}</Button>
                  <LinkButton onClick={() => { setStep("upload"); setFileName(null); setCategoryMapped(""); setTypedCount(""); }}>{t("hrl3.bulk.startOver")}</LinkButton>
                </div>
              }
            />
          </div>
        ) : null}

        {showCommitDlg ? (
          <Dialog title={t("hrl3.bulk.commit.dlgTitle")} onCancel={() => setShowCommitDlg(false)} width={560}>
            <p style={ty("small", { color: c.inkMuted, margin: "0 0 14px" })}>{t("hrl3.bulk.commit.body", { ready: num(readyRows.length), blocked: num(blockedRows.length) })}</p>
            <Warn>{t("hrl3.bulk.commit.idempotency")}</Warn>
            <Field id="hrl3-bulk-typed" label={t("hrl3.bulk.commit.typeLabel", { n: num(readyRows.length) })} error={typedCount && typedCount !== String(readyRows.length) ? t("hrl3.bulk.commit.typeMismatch") : null}>
              <Input id="hrl3-bulk-typed" value={typedCount} onChange={setTypedCount} inputMode="numeric" />
            </Field>
            <DialogFoot confirmLabel={t("hrl3.bulk.commit.go")} onCancel={() => setShowCommitDlg(false)} confirmDisabled={typedCount !== String(readyRows.length)} onConfirm={commit} />
          </Dialog>
        ) : null}
      </div>
    );
  }

  /* ============================================================
     5 · HR-24 · PROBATION & CONFIRMATION QUEUE
     ============================================================ */

  /* ============================================================
     PROBATION & CONTRACTS — one tab, because it is one question

     These were two tabs: "Probation" and "Renewals". They ask the
     same thing of the same desk — somebody is on a clock, the clock
     is about to run out, and HR has to decide before it does. A
     probation that ends and a fixed term that ends differ in what the
     decision is CALLED, not in the work: watch the date, get the head
     of department's view, decide, and write down what was decided.

     Two tabs meant checking two lists for the same deadline, and a
     person on a fixed-term contract who was ALSO on probation
     appeared in both with two separate clocks.

     Everything here happens off this screen, like hiring: the head of
     department gives their view in a corridor or a meeting, the
     Principal agrees over the phone. Naveya records the decision, and
     tells nobody — a confirmation letter is written and handed over
     by a person.
     ============================================================ */
  const CLOCK_LOOK = {
    overdue: { role: "absent", fill: "chartRed", glyph: "alert" },
    soon: { role: "late", fill: "chartAmber", glyph: "clock" },
    ahead: { role: "ltEL", fill: "chartBlue", glyph: "clock" },
    later: { role: "off", fill: "chartSand", glyph: "clock" },
    decided: { role: "present", fill: "chartGreen", glyph: "check" },
  };
  const SOON_DAYS = 30;
  const AHEAD_DAYS = 90;

  /* ONE seed, because it is one list. `kind` says which words the
     decision wears; `clock` is the same field for both. */
  const CLOCK_SEED = [
    {
      id: "k1", campus: "indiranagar", name: "Kavya Nair", code: "NAV-0207", desig: "PRT, Class III", dept: "Primary",
      kind: "probation", clock: ["5", "08", "2026"], since: ["1", "02", "2026"],
      recKey: "hrl3.rec.confirm", recByText: "Radhika Menon, Head of Primary",
      recOn: ["28", "07", "2026"], recNoteText: "Meeting classroom expectations from the first month. Confirm her.",
      trail: [
        { k: "hrl3.tr.joined", d: ["1", "02", "2026"] },
        { k: "hrl3.tr.probSet", d: ["1", "02", "2026"], noteText: "Six months, ending 5 August." },
        { k: "hrl3.tr.recGiven", d: ["28", "07", "2026"], byText: "Radhika Menon, Head of Primary" },
      ],
    },
    {
      id: "k2", campus: "whitefield", name: "Sanya Kapoor", code: "NAV-0312", desig: "TGT, Mathematics", dept: "Mathematics",
      kind: "probation", clock: ["20", "08", "2026"], since: ["20", "02", "2026"],
      recKey: null, recAsked: false,
      trail: [
        { k: "hrl3.tr.joined", d: ["20", "02", "2026"] },
        { k: "hrl3.tr.probSet", d: ["20", "02", "2026"], noteText: "Six months, ending 20 August." },
      ],
    },
    {
      id: "k3", campus: "indiranagar", name: "Om Prakash Nair", code: "NAV-0231", desig: "PRT, Class I", dept: "Primary",
      kind: "probation", clock: ["25", "08", "2026"], since: ["25", "11", "2025"], extended: true,
      recKey: "hrl3.rec.extend", recByText: "Radhika Menon, Head of Primary",
      recOn: ["5", "08", "2026"], recNoteText: "Still finding classroom management hard. Another three months with mentoring.",
      trail: [
        { k: "hrl3.tr.joined", d: ["25", "11", "2025"] },
        { k: "hrl3.tr.probSet", d: ["25", "11", "2025"], noteText: "Six months, ending 25 May." },
        { k: "hrl3.tr.probExtended", d: ["22", "05", "2026"], noteText: "Three months, to 25 August. Told in writing." },
        { k: "hrl3.tr.recGiven", d: ["5", "08", "2026"], byText: "Radhika Menon, Head of Primary" },
      ],
    },
    {
      id: "k4", campus: "whitefield", name: "Rohit Malhotra", code: "NAV-0161", desig: "Guest faculty, Sanskrit", dept: "Languages",
      kind: "guest", clock: ["31", "08", "2026"], since: ["10", "07", "2025"],
      recKey: null, recAsked: true, recAskedOn: ["6", "08", "2026"],
      trail: [
        { k: "hrl3.tr.joined", d: ["10", "07", "2025"] },
        { k: "hrl3.tr.recAsked", d: ["6", "08", "2026"], byText: "Devraj Oberoi, Head of Languages" },
      ],
    },
    {
      id: "k5", campus: "indiranagar", name: "Neelam Verma", code: "NAV-0288", desig: "TGT, Computer Science", dept: "Science",
      kind: "fixed", clock: ["15", "10", "2026"], since: ["16", "10", "2024"],
      recKey: "hrl3.rec.end", recByText: "Meenakshi Pillai, Head of Science",
      recOn: ["4", "08", "2026"], recNoteText: "The computer periods move to the new timetable in April; the post goes with them.",
      trail: [
        { k: "hrl3.tr.joined", d: ["16", "10", "2024"] },
        { k: "hrl3.tr.renewed", d: ["16", "10", "2025"], noteText: "One year, to 15 October 2026." },
        { k: "hrl3.tr.recGiven", d: ["4", "08", "2026"], byText: "Meenakshi Pillai, Head of Science" },
      ],
    },
    {
      id: "k6", campus: "indiranagar", name: "Aditi Bhatia", code: "NAV-0199", desig: "Front office executive", dept: "Administration",
      kind: "fixed", clock: ["20", "08", "2026"], since: ["21", "08", "2024"],
      recKey: null, recAsked: false,
      trail: [
        { k: "hrl3.tr.joined", d: ["21", "08", "2024"] },
        { k: "hrl3.tr.renewed", d: ["21", "08", "2025"], noteText: "One year, to 20 August 2026." },
      ],
    },
    {
      id: "k7", name: "Manoj Tiwari", code: "NAV-0244", desig: "Guest faculty, Music", dept: "Arts",
      kind: "guest", clock: ["31", "07", "2026"], since: ["1", "08", "2024"],
      recKey: "hrl3.rec.renew", recByText: "Anjali Bose, Head of Arts", recOn: ["20", "07", "2026"],
      decidedKey: "hrl3.dec.renewed", decidedOn: ["8", "08", "2026"], decidedByText: "Meera Iyer",
      newClock: ["31", "07", "2027"],
      trail: [
        { k: "hrl3.tr.joined", d: ["1", "08", "2024"] },
        { k: "hrl3.tr.recGiven", d: ["20", "07", "2026"], byText: "Anjali Bose, Head of Arts" },
        { k: "hrl3.tr.renewed", d: ["8", "08", "2026"], byText: "Meera Iyer", noteText: "One year, to 31 July 2027." },
      ],
    },
    {
      id: "k8", name: "Farida Khan", code: "NAV-0263", desig: "Guest faculty, French", dept: "Languages",
      kind: "guest", clock: ["31", "07", "2026"], since: ["1", "02", "2026"],
      recKey: "hrl3.rec.end", recByText: "Devraj Oberoi, Head of Languages", recOn: ["18", "07", "2026"],
      decidedKey: "hrl3.dec.ended", decidedOn: ["8", "08", "2026"], decidedByText: "Meera Iyer",
      lastDay: ["31", "07", "2026"],
      trail: [
        { k: "hrl3.tr.joined", d: ["1", "02", "2026"] },
        { k: "hrl3.tr.recGiven", d: ["18", "07", "2026"], byText: "Devraj Oberoi, Head of Languages" },
        { k: "hrl3.tr.ended", d: ["8", "08", "2026"], byText: "Meera Iyer", noteText: "Last day 31 July. Full and final goes to payroll." },
      ],
    },
  ];

  function clockState(r) {
    if (r.decidedKey) return "decided";
    const n = daysFrom(r.newClock || r.clock);
    if (n < 0) return "overdue";
    if (n <= SOON_DAYS) return "soon";
    if (n <= AHEAD_DAYS) return "ahead";
    return "later";
  }
  function clockDays(r) { return daysFrom(r.newClock || r.clock); }
  /* probation is confirmed or extended; a contract is renewed or
     ended. Same work, different words on the button. */
  function isProbation(r) { return r.kind === "probation"; }

  function DaysLeft({ n }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    if (n < 0) return <span style={ty("small", { color: c.dangerText, fontWeight: 700 })}>{t("hrl3.cl.late", { n: num(Math.abs(n)) })}</span>;
    if (n === 0) return <span style={ty("small", { color: c.dangerText, fontWeight: 700 })}>{t("hrl3.cl.today")}</span>;
    return <span style={ty("small", { color: n <= SOON_DAYS ? c.lateText : c.inkMuted })}>{t("hrl3.cl.inN", { n: num(n) })}</span>;
  }

  /* ---- the decisions, each a pop-up stating its consequence ---- */
  function ConfirmPop({ row, onClose, onDone }) {
    const { t } = useLang();
    const [eff, setEff] = useState(arrToIsoL(row.clock));
    return (
      <Pop title={t("hrl3.act.confirm.title")} sub={row.name + " · " + row.desig} onClose={onClose}>
        <Field id="hrl3-conf-eff" label={t("hrl3.act.confirm.eff")} hint={t("hrl3.act.confirm.effHint")}>
          <Input id="hrl3-conf-eff" type="date" value={eff} onChange={setEff} />
        </Field>
        <Consequence lines={[t("hrl3.act.confirm.c1"), t("hrl3.act.confirm.c2"), t("hrl3.act.confirm.c3")]} />
        <PopFoot confirmLabel={t("hrl3.act.confirm.cta")} onCancel={onClose} disabled={!eff}
          onConfirm={function () { onDone(eff); }} />
      </Pop>
    );
  }

  function ExtendProbPop({ row, onClose, onDone }) {
    const { t } = useLang();
    const [to, setTo] = useState("");
    const [why, setWhy] = useState("");
    const already = !!row.extended;
    return (
      <Pop title={t("hrl3.act.extend.title")} sub={row.name} onClose={onClose}>
        {already ? (
          <div style={{ marginBottom: 14 }}>
            <StatusMark role="late" glyph="alert" word={t("hrl3.act.extend.second")} />
          </div>
        ) : null}
        <Field id="hrl3-ext-to" label={t("hrl3.act.extend.to")} hint={t("hrl3.act.extend.toHint")}>
          <Input id="hrl3-ext-to" type="date" value={to} onChange={setTo} />
        </Field>
        <Field id="hrl3-ext-why" label={t("hrl3.act.extend.why")} hint={t("hrl3.act.extend.whyHint")}>
          <Input id="hrl3-ext-why" value={why} onChange={setWhy} />
        </Field>
        <Consequence lines={[t("hrl3.act.extend.c1"), t("hrl3.act.extend.c2"), already ? t("hrl3.act.extend.c3") : null]} />
        <PopFoot confirmLabel={t("hrl3.act.extend.cta")} onCancel={onClose} disabled={!to || !why.trim()}
          onConfirm={function () { onDone(to, why.trim()); }} />
      </Pop>
    );
  }

  function RenewPop({ row, onClose, onDone }) {
    const { t } = useLang();
    const [to, setTo] = useState("");
    const [note, setNote] = useState("");
    return (
      <Pop title={t("hrl3.act.renew.title")} sub={row.name + " · " + row.desig} onClose={onClose}>
        <Field id="hrl3-ren-to" label={t("hrl3.act.renew.to")} hint={t("hrl3.act.renew.toHint")}>
          <Input id="hrl3-ren-to" type="date" value={to} onChange={setTo} />
        </Field>
        <Field id="hrl3-ren-note" label={t("hrl3.act.renew.note")} hint={t("hrl3.act.renew.noteHint")}>
          <Input id="hrl3-ren-note" value={note} onChange={setNote} />
        </Field>
        <Consequence lines={[t("hrl3.act.renew.c1"), t("hrl3.act.renew.c2"), t("hrl3.act.renew.c3")]} />
        <PopFoot confirmLabel={t("hrl3.act.renew.cta")} onCancel={onClose} disabled={!to}
          onConfirm={function () { onDone(to, note.trim()); }} />
      </Pop>
    );
  }

  function EndPop({ row, onClose, onDone }) {
    const { t } = useLang();
    const [last, setLast] = useState(arrToIsoL(row.clock));
    const [why, setWhy] = useState("");
    const prob = isProbation(row);
    return (
      <Pop title={t(prob ? "hrl3.act.notConfirm.title" : "hrl3.act.end.title")} sub={row.name + " · " + row.desig} onClose={onClose}>
        <Field id="hrl3-end-last" label={t("hrl3.act.end.last")} hint={t("hrl3.act.end.lastHint")}>
          <Input id="hrl3-end-last" type="date" value={last} onChange={setLast} />
        </Field>
        <Field id="hrl3-end-why" label={t("hrl3.act.end.why")} hint={t("hrl3.act.end.whyHint")}>
          <Input id="hrl3-end-why" value={why} onChange={setWhy} />
        </Field>
        <Consequence lines={[
          t(prob ? "hrl3.act.notConfirm.c1" : "hrl3.act.end.c1"),
          t("hrl3.act.end.c2"),
          t("hrl3.act.end.c3"),
        ]} />
        <PopFoot danger confirmLabel={t(prob ? "hrl3.act.notConfirm.cta" : "hrl3.act.end.cta")} onCancel={onClose}
          disabled={!last || !why.trim()} onConfirm={function () { onDone(last, why.trim()); }} />
      </Pop>
    );
  }

  /* the head of department said it in a corridor; this writes it down */
  /* ONE PERSON'S CLOCK, IN A SHEET.

     WHAT HR DOES HERE IS TWO THINGS: read what the person is on and
     when it ends, and decide. Everything else that used to be on this
     screen — asking the head of department for a recommendation,
     recording what they said, a card for the answer and a trail of
     who asked whom — modelled a conversation that happens in a
     corridor and a staffroom (designer). Naveya was never in it, so
     it no longer pretends to be: the decision is HR's, and the
     paperwork behind it is theirs too. */
  function ClockSheet({ row, onClose, onAct, onNavigate }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [pop, setPop] = useState(null);
    const prob = isProbation(row);
    const n = clockDays(row);
    const live = !row.decidedKey;

    return (
      <SideScreen
        title={row.name}
        sub={row.desig + " \u00b7 " + t("hrl3.kindLong." + row.kind)}
        width={620} onClose={onClose}
        footer={
          live ? (
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <Button kind="primary" size="sm" iconLeft="check" onClick={function () { setPop(prob ? "confirm" : "renew"); }}>
                {t(prob ? "hrl3.menu.confirm" : "hrl3.menu.renew")}
              </Button>
              {prob ? (
                <Button kind="secondary" size="sm" onClick={function () { setPop("extend"); }}>{t("hrl3.menu.extend")}</Button>
              ) : null}
              <Button kind="dangerOutline" size="sm" onClick={function () { setPop("end"); }}>
                {t(prob ? "hrl3.menu.notConfirm" : "hrl3.menu.end")}
              </Button>
            </div>
          ) : (
            <Button kind="ghost" size="sm" iconLeft="staff" onClick={function () { onNavigate && onNavigate("hrRecord"); }}>{t("hrl3.ob.openRecord")}</Button>
          )
        }
      >
        <div>
          <DefRow label={t("hrl3.f.kind")}><Value>{t("hrl3.kindLong." + row.kind)}</Value></DefRow>
          <DefRow label={t("hrl3.f.since")}><Value>{dmy(t, row.since)}</Value></DefRow>
          <DefRow label={t(prob ? "hrl3.f.probEnds" : "hrl3.f.contractEnds")} last={!row.decidedKey}>
            <Value>{dmy(t, row.newClock || row.clock)}</Value>
            <div style={{ marginTop: 5 }}><DaysLeft n={n} /></div>
            {row.extended ? <div style={{ marginTop: 5 }}><Value tone="muted">{t("hrl3.f.wasExtended")}</Value></div> : null}
          </DefRow>
          {row.decidedKey ? (
            <DefRow label={t("hrl3.f.decided")} last>
              <Value>{t(row.decidedKey)}</Value>
              <div style={{ marginTop: 5 }}>
                <Value tone="muted">{t("hrl3.f.decidedBy", { who: row.decidedByText, date: dmy(t, row.decidedOn) })}</Value>
              </div>
              {row.lastDay ? <div style={{ marginTop: 5 }}><Value tone="muted">{t("hrl3.f.lastDay", { date: dmy(t, row.lastDay) })}</Value></div> : null}
            </DefRow>
          ) : null}
        </div>

        {pop === "confirm" ? <ConfirmPop row={row} onClose={function () { setPop(null); }} onDone={function (e) { setPop(null); onAct(row.id, "confirm", e); }} /> : null}
        {pop === "extend" ? <ExtendProbPop row={row} onClose={function () { setPop(null); }} onDone={function (d, w) { setPop(null); onAct(row.id, "extend", { to: d, why: w }); }} /> : null}
        {pop === "renew" ? <RenewPop row={row} onClose={function () { setPop(null); }} onDone={function (d, n2) { setPop(null); onAct(row.id, "renew", { to: d, note: n2 }); }} /> : null}
        {pop === "end" ? <EndPop row={row} onClose={function () { setPop(null); }} onDone={function (d, w) { setPop(null); onAct(row.id, "end", { last: d, why: w }); }} /> : null}
      </SideScreen>
    );
  }

  function ClocksTab({ rows, onOpen, flash }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [pick, setPick] = useState("all");
    const [kind, setKind] = useState("all");

    const withState = rows.map(function (r) { return { r: r, s: clockState(r) }; });
    const list = withState.filter(function (x) {
      if (pick !== "all" && x.s !== pick) return false;
      if (kind !== "all" && x.r.kind !== kind) return false;
      return true;
    });

    const ORDER = ["overdue", "soon", "ahead", "later", "decided"];
    const band = ORDER.map(function (s) {
      return { key: s, label: t("hrl3.st." + s), value: withState.filter(function (x) { return x.s === s; }).length, color: c[CLOCK_LOOK[s].fill] || c.accent };
    });
    const live = withState.filter(function (x) { return x.s !== "decided"; });
    const overdue = withState.filter(function (x) { return x.s === "overdue"; }).length;
    const soon = withState.filter(function (x) { return x.s === "soon"; }).length;
    const noRec = live.filter(function (x) { return !x.r.recKey; }).length;
    const probCount = live.filter(function (x) { return isProbation(x.r); }).length;
    const daysLeft = live.map(function (x) { return clockDays(x.r); });
    const avgLeft = daysLeft.length ? Math.round(daysLeft.reduce(function (s, n2) { return s + n2; }, 0) / daysLeft.length) : 0;
    const maxLeft = daysLeft.length ? Math.max.apply(null, daysLeft.map(Math.abs)) : 0;

    const columns = [
      { key: "who", label: t("hrl3.col.who") },
      { key: "kind", label: t("hrl3.col.kind"), width: 150 },
      { key: "ends", label: t("hrl3.col.ends"), mono: true, width: 130 },
      { key: "left", label: t("hrl3.col.left"), width: 150 },
    ];
    const tableRows = list.map(function (x) {
      const r = x.r;
      return {
        id: r.id, live: true,
        cells: {
          who: (
            <span style={{ display: "flex", gap: 11, alignItems: "center", minWidth: 0 }}>
              <Avatar name={r.name} size={30} />
              <span style={{ minWidth: 0 }}>
                <span style={ty("small", { display: "block", color: c.ink, fontWeight: 600 })}>{r.name}</span>
                <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 1 })}>{r.desig} · {r.dept}</span>
              </span>
            </span>
          ),
          kind: <Chip>{t("hrl3.kind." + r.kind)}</Chip>,
          ends: dmy(t, r.newClock || r.clock),
          left: x.s === "decided"
            ? <StatusMark role="present" glyph="check" word={t(r.decidedKey)} />
            : <DaysLeft n={clockDays(r)} />,
        },
      };
    });

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: G3.layout.gap }}>
        <Flash text={flash} />
        <Card>
          <MetricStrip
            pad={0} style={{ marginTop: 18 }}
            metrics={[
              /* everybody on a clock; the four beside it are cuts of them */
              { k: "onClock", label: t("hrl3.m.onClock"), value: num(live.length), total: true, tone: c.chartTeal,
                note: t("hrl3.m.onClockNote", { total: num(rows.length) }) },
              { k: "overdue", label: t("hrl3.m.overdue"), value: num(overdue),
                tone: overdue ? c.chartRed : c.chartGreen,
                note: t("hrl3.m.overdueNote"),
                mark: overdue ? <StatusMark role="absent" glyph="alert" word={t("hrl3.m.overdueMark")} /> : <StatusMark role="present" glyph="check" word={t("hrl3.m.overdueNone")} /> },
              { k: "soon", label: t("hrl3.m.soon"), value: num(soon), tone: c.chartAmber,
                note: t("hrl3.m.soonNote", { n: num(SOON_DAYS) }) },
              { k: "noRec", label: t("hrl3.m.noRec"), value: num(noRec),
                tone: noRec ? c.chartAmber : c.chartGreen,
                note: t("hrl3.m.noRecNote", { n: num(live.length) }) },
              { k: "split", label: t("hrl3.m.split"), value: num(probCount), tone: c.chartBlue,
                note: t("hrl3.m.splitNote", { n: num(live.length - probCount) }) },
            ]}
          />
        </Card>

        {tableRows.length === 0 ? (
          <Card><EmptyState head={t("hrl3.empty.head")} body={t("hrl3.empty.body")} /></Card>
        ) : (
          <Register
            title={t("hrl3.reg.title")} sub={t("hrl3.reg.sub")}
            action={
              <span style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <span style={{ width: 210 }}>
                  <Select id="hrl3-kind" ariaLabel={t("hrl3.col.kind")} value={kind} onChange={setKind}
                    options={[
                      { value: "all", label: t("hrl3.kind.all") },
                      { value: "probation", label: t("hrl3.kind.probation") },
                      { value: "fixed", label: t("hrl3.kind.fixed") },
                      { value: "guest", label: t("hrl3.kind.guest") },
                    ]} />
                </span>
                {/* what the bar's legend used to narrow */}
                <span style={{ width: 210 }}>
                  <Select id="hrl3-state" ariaLabel={t("hrl3.col.left")} value={pick} onChange={setPick}
                    options={[{ value: "all", label: t("hrl3.state.all") }].concat(
                      band.map(function (sg) { return { value: sg.key, label: sg.label + " (" + num(sg.value) + ")" }; })
                    )} />
                </span>
              </span>
            }
            columns={columns} rows={tableRows} onSelect={onOpen}
            footer={<span style={ty("caption", { color: c.inkFaint })}>{t("hrl3.reg.foot")}</span>}
          />
        )}
      </div>
    );
  }

  function HRLifecycle({ role, onNavigate }) {
    const { c } = useTheme();
    const { t, ty, lang } = useLang();
    const L = G3.layout;
    const [tab, setTab] = useState("ob");
    const [campus, setCampus] = useState(CAMPUS_ALL);
    const TABS_ID = "hrl3-tabs";
    const [clocks, setClocks] = useState(CLOCK_SEED);
    const [tasksById, setTasksById] = useState(function () {
      const m = {};
      JOINERS_SEED.forEach(function (j) { m[j.id] = seedTasksFor(j.id); });
      return m;
    });
    const [readyIds, setReadyIds] = useState({});
    const [readyMeta, setReadyMeta] = useState({});
    const [openJoiner, setOpenJoiner] = useState(null);

    const joiners = JOINERS_SEED.filter(function (j) {
      return inCampus(campus, j.campus);
    }).map(function (j) {
      const tasks = tasksById[j.id];
      const state = readyIds[j.id] ? "complete" : computeJoinerState(j.id, tasks);
      return Object.assign({}, j, { tasks: tasks, state: state });
    });
    function updateTask(joinerId, taskId, patch) {
      setTasksById(function (cur) {
        const next = Object.assign({}, cur);
        next[joinerId] = next[joinerId].map(function (x) { return x.id === taskId ? Object.assign({}, x, patch) : x; });
        return next;
      });
      setFlash(t("hrl3.ob.said.task"));
    }
    function generateTemplate(joinerId, doj) {
      setTasksById(function (cur) { return Object.assign({}, cur, { [joinerId]: taskTemplate(doj) }); });
      setFlash(t("hrl3.ob.said.generated"));
    }
    function addAdhoc(joinerId, title, owner, due) {
      setTasksById(function (cur) {
        const next = Object.assign({}, cur);
        next[joinerId] = next[joinerId].concat([{ id: "adhoc-" + Date.now(), labelText: title, kind: "checklist", owner: owner, mandatory: false, safeguarding: false, state: "pending", due: due }]);
        return next;
      });
      setFlash(t("hrl3.ob.said.adhoc"));
    }
    function markReady(joinerId) {
      setReadyIds(function (cur) { return Object.assign({}, cur, { [joinerId]: true }); });
      setReadyMeta(function (cur) { return Object.assign({}, cur, { [joinerId]: { by: "hrl3.actor.meera", on: TODAY } }); });
      setFlash(t("hrl3.ob.said.ready"));
    }
    const [openId, setOpenId] = useState(null);
    const [flash, setFlash] = useState(null);

    function act(id, kind, payload) {
      setClocks(function (cur) {
        return cur.map(function (r) {
          if (r.id !== id) return r;
          const tr = (r.trail || []).slice();
          if (kind === "confirm") {
            tr.push({ k: "hrl3.tr.confirmed", d: TODAY, byText: "Meera Iyer", noteText: null });
            return Object.assign({}, r, { decidedKey: "hrl3.dec.confirmed", decidedOn: TODAY, decidedByText: "Meera Iyer", trail: tr });
          }
          if (kind === "extend") {
            const to = isoToArrL(payload.to) || r.clock;
            tr.push({ k: "hrl3.tr.probExtended", d: TODAY, byText: "Meera Iyer", noteText: payload.why });
            return Object.assign({}, r, { clock: to, newClock: null, extended: true, recKey: null, recByText: null, recOn: null, recNoteText: null, trail: tr });
          }
          if (kind === "renew") {
            const to = isoToArrL(payload.to) || r.clock;
            tr.push({ k: "hrl3.tr.renewed", d: TODAY, byText: "Meera Iyer", noteText: payload.note || null });
            return Object.assign({}, r, { decidedKey: "hrl3.dec.renewed", decidedOn: TODAY, decidedByText: "Meera Iyer", newClock: to, trail: tr });
          }
          if (kind === "end") {
            const last = isoToArrL(payload.last) || r.clock;
            const key = isProbation(r) ? "hrl3.tr.notConfirmed" : "hrl3.tr.ended";
            tr.push({ k: key, d: TODAY, byText: "Meera Iyer", noteText: payload.why });
            return Object.assign({}, r, { decidedKey: isProbation(r) ? "hrl3.dec.notConfirmed" : "hrl3.dec.ended", decidedOn: TODAY, decidedByText: "Meera Iyer", lastDay: last, trail: tr });
          }
          if (kind === "rec") {
            const when = isoToArrL(payload.when) || TODAY;
            tr.push({ k: "hrl3.tr.recGiven", d: when, byText: payload.who, noteText: payload.note || null });
            return Object.assign({}, r, { recKey: payload.rec, recByText: payload.who, recOn: when, recNoteText: payload.note || null, trail: tr });
          }
          if (kind === "ask") {
            tr.push({ k: "hrl3.tr.recAsked", d: TODAY, byText: payload });
            return Object.assign({}, r, { recAsked: true, recAskedOn: TODAY, trail: tr });
          }
          return r;
        });
      });
      if (kind === "confirm") setFlash(t("hrl3.said.confirmed"));
      if (kind === "extend") setFlash(t("hrl3.said.extended"));
      if (kind === "renew") setFlash(t("hrl3.said.renewed"));
      if (kind === "end") setFlash(t("hrl3.said.ended"));
      if (kind === "rec") setFlash(t("hrl3.said.rec"));
      if (kind === "ask") setFlash(t("hrl3.said.asked"));
    }

    const openJ = openJoiner ? joiners.filter(function (j) { return j.id === openJoiner; })[0] : null;
    const openRow = openId ? clocks.filter(function (r) { return r.id === openId; })[0] : null;

    const TAB_ITEMS = [
      { key: "ob", label: t("hrl3.tab.ob") },
      { key: "bulk", label: t("hrl3.tab.bulk") },
      { key: "prob", label: t("hrl3.tab.prob") },
    ];

    return (
      <div className="nv3" style={{ display: "flex", minHeight: "100vh", background: c.page, color: c.ink, fontFamily: G3.font.ui }}>
        <Rail role={role || "hr"} active="hrLifecycle" onNavigate={onNavigate} initials="MI" />
        <main style={{ flex: 1, minWidth: 0, position: "relative", overflowX: "clip" }}>
          <div style={{ position: "relative", zIndex: 1, maxWidth: L.contentMax, margin: "0 auto", padding: "22px " + L.contentPadX + "px 56px" }}>
            <TopStrip campus={campus} onCampus={setCampus} />

            <div style={{ marginBottom: 18 }}>
              <h1 style={ty("display", { margin: 0, color: c.ink })}>{t("hrl3.title")}</h1>
            </div>

            <Tabs items={TAB_ITEMS} active={tab} onChange={setTab} ariaLabel={t("hrl3.tabs.aria")} idBase={TABS_ID} />

            {tab === "ob" ? <TabPanel idBase={TABS_ID} tabKey="ob" style={{ marginTop: 20 }}><JoinersTab joiners={joiners} flash={flash} onOpen={function (id) { setFlash(null); setOpenJoiner(id); }} /></TabPanel> : null}
            {tab === "bulk" ? <TabPanel idBase={TABS_ID} tabKey="bulk" style={{ marginTop: 20 }}><BulkTab /></TabPanel> : null}
            {tab === "prob" ? (
              <TabPanel idBase={TABS_ID} tabKey="prob" style={{ marginTop: 20 }}>
                <ClocksTab rows={clocks.filter(function (r) { return inCampus(campus, r.campus); })} flash={flash} onOpen={function (id) { setFlash(null); setOpenId(id); }} />
              </TabPanel>
            ) : null}
          </div>
        </main>

        {/* both internal screens open over the tab they were clicked
            in, as everything else in this product now does */}
        {openJ ? (
          <JoinerSheet
            joiner={openJ} readyMeta={readyMeta} onNavigate={onNavigate}
            onClose={function () { setOpenJoiner(null); }}
            onUpdateTask={updateTask} onGenerate={generateTemplate} onAddAdhoc={addAdhoc} onMarkReady={markReady}
          />
        ) : null}
        {openRow ? (
          <ClockSheet row={openRow} onNavigate={onNavigate} onAct={act} onClose={function () { setOpenId(null); }} />
        ) : null}
      </div>
    );
  }

  window.Pages3 = window.Pages3 || {};
  window.Pages3.HRLifecycle = HRLifecycle;
})();
