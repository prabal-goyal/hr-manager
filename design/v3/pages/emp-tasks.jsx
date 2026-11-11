/* @jsxRuntime classic */
/* ============================================================
   Naveya — Requests (Employee self-service tasks) · window.Pages3.EmpTasks

   SIX TASKS, ONE SURFACE. This is the doing half of the screens Ananya
   Rao already reads: attendance.jsx (EMP-02) links its row menu here for
   EMP-03/EMP-04; leave.jsx (EMP-05) links its "Apply for leave" quick
   action here for EMP-06; documents.jsx (EMP-10) links its action band
   here for EMP-11. This file does not repeat those destinations — it
   is where the actions they promise actually happen.

     · Mark attendance          EMP-03 · M9 §Business rules, §6.8
     · Regularise a day         EMP-04 · §6.8 Regularization, M9 §Acceptance
     · Apply for leave          EMP-06 · M8 §Workflow, §Business rules
     · Respond to HR            EMP-11 · M4 §Workflow, §API, §Acceptance
     · Reimbursements           EMP-12/13 · M10 §Reimbursements, §6.9

   SAME EMPLOYEE, SAME FACTS. Ananya Rao, PGT Physics, NAV-0142, Sunrise
   Public School Indiranagar. Today is 11 August 2026 (the same anchor as
   every other v3 page). Her monthly gross is ₹94,800.00 (screens.jsx
   PAY.gross / attendance.jsx MONTHLY_GROSS_REF / leave.jsx MONTHLY_GROSS)
   so a day of loss of pay prices identically everywhere: 94,800 / 30 =
   ₹3,160.00 exactly. Her pending leave request LR-0219 (leave.jsx,
   Aug 24–25, casual, needs a cover arrangement) is reused here rather
   than invented a second time — picking those same dates on the Apply
   for leave tab surfaces it as an overlap, exactly as the spec's "Pick
   dates" failure mode requires. Her missing punch on 6 Aug (attendance.jsx)
   is reused as the Regularise-a-day anchor.

   DOMAIN RULES THIS FILE MUST NOT CONTRADICT
   · A teacher (teaching staff) does not accrue earned leave (M8
     `applies_to_vacation_staff`). EL is absent from the leave-type
     picker, exactly as in leave.jsx — never disabled, never drawn.
   · An employee has no `documents.write` (M4). The "Respond to HR" tab
     answers a named `DocumentUpdateRequest`; there is no add/upload-a-
     new-document affordance anywhere on this file.
   · A punch is a fact, never edited in place — corrections are a
     Regularization request, never a second write over history.
   · Nothing here approves anything. Every one of these five tasks ends
     at "sent for approval" and stops; the approving screens are DH-02/
     DH-07/HR-09, none of which are this file's business.

   Composed only from window.G3 / window.UI3. kit.jsx, tokens.jsx,
   screens.jsx and every sibling pages/*.jsx file are untouched.
   ============================================================ */
(function () {
  const G3 = window.G3;
  const UI = window.UI3;
  const { useState, useMemo, useRef, useEffect } = React;
  const {
    useTheme, ThemeToggle, useLang, addStrings,
    Rail, Motif, Card, Register, Button, LinkButton, Field, Input, Select, Switch,
    Chip, StatusMark, Seal, Meter, Figure, Icon, Tabs, TabPanel,
    EmptyState, inr, num, SideScreen, FileField, profileFor,
  } = UI;

  /* the shared leave queue: applying here is the same act the head of
     department sees on DH-02, not a second private list */
  const LF = window.LeaveFlow;
  const ME_ID = { employee: "ananya", deptHead: "anjali" };

  const TODAY_ISO = "2026-08-11";
  const HOD_NAME = "Anjali Deshpande"; /* leave.jsx's lv.person.hod — same Head of Science */
  const MONTHLY_GROSS = 94800.0; /* screens.jsx PAY.gross / attendance.jsx / leave.jsx — must not drift */
  const LOP_DAY_RATE = MONTHLY_GROSS / 30; /* exactly 3,160.00 */

  /* ============================================================
     STRINGS — et.* is this screen's namespace, split by tab prefix
     (et.at / et.rg / et.lv / et.doc / et.rb). Every demo value —
     names, reasons, dates — is translated, not just the labels.
     ============================================================ */
  addStrings({
    en: {
      "et.pageTitle": "Requests",

      "et.mon.01": "Jan", "et.mon.02": "Feb", "et.mon.03": "Mar",
      "et.mon.04": "Apr", "et.mon.05": "May", "et.mon.06": "Jun",
      "et.mon.07": "Jul", "et.mon.08": "Aug", "et.mon.09": "Sep",
      "et.mon.10": "Oct", "et.mon.11": "Nov", "et.mon.12": "Dec",

      "et.tab.attend": "Mark attendance",
      "et.tab.regularise": "Regularise a day",
      "et.tab.leave": "Apply for leave",
      "et.tab.documents": "Respond to HR",
      "et.tab.reimb": "Reimbursements",
      "et.tab.loans": "Loans and advances",
      "et.loans.missing": "Loans and advances could not be loaded.",

      "et.common.cancel": "Cancel",
      "et.common.confirm": "Yes, withdraw it",
      "et.common.back": "Back",
      "et.common.reason": "Reason",
      "et.common.reasonPh": "One line is enough.",
      "et.common.note": "Note to HR (optional)",
      "et.common.attach": "Attachment (optional)",
      "et.common.close": "Close",
      "et.common.dismiss": "Dismiss",

      /* ---- the record of what she has asked for ---- */
      "et.rg.regTitle": "Days you have asked to be corrected",
      "et.rg.newCta": "Ask for a correction",
      "et.rg.newTitle": "Ask for a day to be corrected",
      "et.rg.col.day": "Day",
      "et.rg.col.asked": "You asked for",
      "et.rg.col.why": "What happened",
      "et.rg.col.status": "Where it stands",
      "et.rg.rst.pending": "Awaiting approval",
      "et.rg.rst.approved": "Corrected",
      "et.rg.rst.rejected": "Declined",
      "et.rg.rst.withdrawn": "Withdrawn",
      "et.rg.withWho": "With {who}",
      "et.rg.decidedBy": "{who} · {date}",
      "et.rg.withdrawnOn": "Withdrawn {date}",
      "et.rg.sentOn": "sent {date}",
      "et.rg.detailTitle": "{id}",
      "et.rg.timesLabel": "Times you gave",
      "et.rg.noFile": "Nothing attached",
      "et.rg.whyDeclined": "Why it was declined",
      "et.rg.hodName": "Anjali Deshpande, Head of Science",
      "et.rg.sentFlash": "{id} sent to {who} for {day}.",
      "et.rg.withdrawnFlash": "{id} withdrawn. Nothing on your attendance record changed.",
      "et.rg.why.onDuty": "Science olympiad invigilation at the Whitefield campus; I left after the morning session.",
      "et.rg.why.missed": "The gate reader did not register me on the way in — I was in the staff room by 07:51.",
      "et.rg.why.device": "Gate 2 was down all morning and nobody could punch in there.",
      "et.rg.why.rejected": "Gate 1 shows you entering at 07:55 that day, so the record already has your arrival. Nothing to correct.",

      /* ---- her own leave, read from the shared queue ---- */
      "et.lv.regTitle": "Your leave",
      "et.lv.regSub": "Every request you have made this session, and who has it now.",
      "et.lv.newCta": "Apply for leave",
      "et.lv.col.dates": "Days away",
      "et.lv.col.type": "Kind",
      "et.lv.col.days": "How long",
      "et.lv.col.status": "Where it stands",
      "et.lv.appliedOn": "applied {date}",
      "et.lv.coverIs": "Cover · {line}",
      "et.lv.detailTitle": "{id}",
      "et.lv.f.applied": "Applied on",
      "et.lv.f.cover": "Your classes",
      "et.lv.regFoot": "Up to 2 days your head of department decides; 3 days or more goes on to the principal, and beyond 15 days the director signs.",
      "et.lv.openModule": "Open your leave and balances",
      "et.lv.withdrawFoot": "You can take it back yourself until somebody has decided.",
      "et.lv.withdrawCta": "Withdraw this request",
      "et.lv.withdrawnFlash": "{id} withdrawn.",
      "et.lv.settledFoot": "This one has been decided — the record stands.",
      "et.lv.sentFlash": "{id} sent. It is with your {who} now.",

      /* ---- reimbursements ---- */
      "et.rb.entSub": "Annual heads of spend, and what each has left to 31 March 2027.",
      "et.rb.leftOf": "left of {annual}",
      "et.rb.claimed": "{used} claimed",
      "et.rb.entFoot": "Approved and paid claims are counted; a claim still awaiting approval is not held against your balance yet.",
      "et.rb.detailTitle": "{id}",
      "et.rb.f.incurred": "Spent on",
      "et.rb.f.paid": "Paid",
      "et.rb.f.due": "Due",
      "et.rb.f.decided": "Decided on",
      "et.rb.f.left": "Left in this category",
      "et.rb.f.noDate": "No date yet",
      "et.rb.whyRejected": "Why it was declined",
      "et.rb.actionsTitle": "What you can do",
      "et.rb.menu.editWhy": "It is still a draft, so nothing has been sent.",
      "et.rb.menu.resubmitWhy": "Send it again with the receipt that was missing.",
      "et.rb.menu.withdrawOk": "Takes it back before anybody decides.",
      "et.rb.menu.withdrawNo": "Only a draft or a claim still awaiting approval can be taken back.",
      "et.rb.withdrawnFlash": "{id} withdrawn. It is a draft again.",
      "et.rb.errCat": "Choose what this claim is for.",
      "et.file.choose": "Choose a file",
      "et.file.change": "Replace file",
      "et.file.hint": "PDF or a clear photo, up to 5 MB.",




      /* ---- EMP-04 · Regularise a day ---- */
      "et.rg.title": "Ask for a day to be corrected",
      "et.rg.sub": "A punch is a fact — this is how you tell the school the fact on record is wrong.",
      "et.rg.dayLabel": "Which day",
      "et.rg.dayFlagged": "Flagged from your attendance: a missing punch",
      "et.rg.currentStatus": "On record right now",
      "et.rg.st.missing": "Missing punch",
      "et.rg.st.present": "Present",
      "et.rg.st.absent": "Absent",
      "et.rg.st.late": "Late",
      "et.rg.reqLabel": "What it should say instead",
      "et.rg.opt.present": "Present",
      "et.rg.opt.half_day": "Half day",
      "et.rg.opt.leave": "On leave",
      "et.rg.opt.weekly_off": "Weekly off",
      "et.rg.opt.holiday": "Holiday",
      "et.rg.inLabel": "In",
      "et.rg.outLabel": "Out",
      "et.rg.catLabel": "What happened",
      "et.rg.cat.missed_punch": "Missed a punch",
      "et.rg.cat.device_failure": "The device didn't read me",
      "et.rg.cat.on_duty": "I was on official duty",
      "et.rg.cat.field_work": "Field or off-site work",
      "et.rg.cat.medical": "Medical reason",
      "et.rg.cat.other": "Something else",
      "et.rg.reasonHint": "Anjali Deshpande, your head of department, reads this before deciding.",
      "et.rg.errReason": "Tell your head of department what happened — one line is enough.",
      "et.rg.route": "Goes to Anjali Deshpande, Head of Science, for approval.",
      "et.rg.submit": "Send for approval",
      "et.rg.foot": "You can withdraw this yourself any time before it is decided.",
      "et.rg.lockedErr": "This day was paid in an already-approved payroll run — it cannot be corrected here. Raise a helpdesk ticket instead.",
      "et.rg.presetLocked": "Try a locked day (10 Jul)",
      "et.rg.presetFlagged": "Use the flagged day (6 Aug)",

      "et.rg.sentHead": "Sent to Anjali Deshpande",
      "et.rg.sentBody": "You'll get a message when she decides.",
      "et.rg.pendingTitle": "Awaiting approval",
      "et.rg.withdrawCta": "Withdraw this request",
      "et.rg.withdrawPrompt": "Withdraw the request for {day}? You can always ask again.",
      "et.rg.withdrawnNote": "Withdrawn. Nothing on your attendance record changed.",

      "et.rg.histTitle": "Your regularisations",
      "et.rg.histSub": "This session",
      "et.rg.hist.doneLabel": "Regularised",
      "et.rg.hist.doneSub": "{by} · {date}",
      "et.rg.hrName": "Meera Nair, HR",

      /* ---- EMP-06 · Apply for leave ---- */
      "et.lv.title": "Ask for leave",
      "et.lv.sub": "Nothing is deducted until it is approved — every consequence below is shown before you send it.",
      "et.lv.type": "Kind of leave",
      "et.lv.typeLeft": "{name} · {n} left",
      "et.lv.elNote": "Earned leave isn't offered here — it doesn't accrue for teaching staff. Your paid break is the school vacation itself.",
      "et.lv.from": "First day",
      "et.lv.to": "Last day",
      "et.lv.reason": "Why you need it",
      "et.lv.reasonPh": "A line is enough.",
      "et.lv.errReason": "Tell Anjali Deshpande why — one line is enough.",
      "et.lv.errOrder": "The last day cannot come before the first day.",
      "et.lv.errNone": "These dates are all Sundays or school holidays, so there is nothing to apply for.",
      "et.lv.submit": "Send for approval",
      "et.lv.foot": "You can withdraw it yourself any time before it is approved.",
      "et.lv.sent": "Sent to Anjali Deshpande for approval. Reference {id}.",

      "et.lv.chk.title": "What this means",
      "et.lv.chk.days": "{n} school days — {range}. Sundays and school holidays are not counted.",
      "et.lv.chk.balOk": "All {n} come out of your {name}, and you'll still have {left} after.",
      "et.lv.chk.balShort": "Only {have} can come from your {name}. The other {short} has nothing left to draw on.",
      "et.lv.chk.wordLop": "Unpaid",
      "et.lv.chk.lopOne": "One thirtieth of your monthly gross for the day with no balance left \u2014 {amt}. The exact figure is worked out in the {mon} run.",
      "et.lv.chk.lopMany": "{n} thirtieths of your monthly gross for the days with no balance left \u2014 {amt}. The exact figure is worked out in the {mon} run.",
      "et.lv.chk.blackClear": "Clear of every closed window. The nearest is {name}, {dates}.",
      "et.lv.chk.blackHit": "{name} runs {dates}. Leave cannot be approved inside it \u2014 speak to Anjali Deshpande, who can escalate to the Principal.",
      "et.lv.chk.vac": "These days fall inside {name} ({dates}), when school is closed. Vacation needs no leave application at all.",
      "et.lv.chk.term": "School is open on these days, so they come out of your balance.",
      "et.lv.chk.cover": "Someone must cover your periods across these days before Anjali Deshpande can approve it.",
      "et.lv.chk.route": "Goes to Anjali Deshpande, Head of Science. Anything longer than three days also goes to the Principal.",
      "et.lv.chk.overlapTitle": "You already have a request for these dates",
      "et.lv.chk.overlap": "{id} is already pending for {range}, sent 9 Aug. Applying again for the same dates is not possible.",
      "et.lv.chk.overlapCta": "See the request",
      "et.lv.chk.wordOk": "All good",
      "et.lv.chk.wordCheck": "Careful",
      "et.lv.chk.wordStop": "Blocked",
      "et.lv.chk.wordNote": "Note",

      "et.lv.presetsTitle": "Try a few examples",
      "et.lv.presetLop": "Try a request that runs short (LOP)",
      "et.lv.presetBlack": "Try a request inside the exam blackout",
      "et.lv.presetOverlap": "Try the same dates as your pending request",
      "et.lv.presetClear": "Back to a clear example",
      "et.lv.otherTitle": "Your other request",
      "et.lv.otherSub": "Casual leave · 24 – 25 Aug 2026",
      "et.lv.otherBody": "Pending Anjali Deshpande's decision — it needs a cover arrangement for those two days before she can approve it.",
      "et.lv.otherCta": "See it in Leave",
      "et.lv.otherStCover": "Waiting on your cover",

      /* ---- EMP-11 · Respond to HR ---- */
      "et.doc.title": "Respond to HR",
      "et.doc.sub": "What is on your record does not change until HR verifies what you send.",
      "et.doc.who.meera": "Meera Iyer, HR",
      "et.doc.who.rajan": "Rajan Pillai, HR",
      "et.doc.type.pan": "PAN card",
      "et.doc.type.bankProof": "Bank account proof",
      "et.doc.type.medical": "Medical fitness certificate",
      "et.doc.type.address": "Address proof",
      "et.doc.type.experience": "Previous-employer experience letter",
      "et.doc.type.bed": "B.Ed. certificate",
      "et.doc.why.pan": "The tax office needs a current copy for this year's Form 16.",
      "et.doc.why.bankProof": "Your salary account changed in July. The office needs proof before it pays into it, and a second person approves the change.",
      "et.doc.st.open": "Awaiting your response",
      "et.doc.st.submitted": "Sent — awaiting HR",
      "et.doc.st.rejected": "Sent back",
      "et.doc.st.overdue": "Overdue",
      "et.doc.st.cancelled": "Request cancelled",
      "et.doc.askedBy": "Asked by {who} on {date}",
      "et.doc.dueBy": "Respond by {date}",
      "et.doc.respondCta": "Respond",
      "et.doc.uploadLabel": "Your response",
      "et.doc.liveUnchanged": "Your document on record does not change until HR verifies this response.",
      "et.doc.submit": "Send to HR",
      "et.doc.sentReceipt": "Sent to {who} on 11 Aug 2026. HR will verify before your record changes.",
      "et.doc.sentAt": "Sent {date}",
      "et.doc.backNote": "HR wrote:",
      "et.doc.backReason.address": "The photo cut off the bottom of the page, so the address line couldn't be read.",
      "et.doc.backAgain": "HR will ask again when ready. You can't send another copy until then.",
      "et.doc.withHRNote": "Your copy is with HR. The certificate on record hasn't changed yet.",
      "et.doc.overdueNote": "This is now overdue. HR and your head of department have both been told.",
      "et.doc.cancelledNote": "Cancelled by {who} on {date} — nothing further needed from you.",
      "et.doc.errFile": "Attach your response before sending.",
      "et.doc.privacy": "What you send goes to your school's HR office and nowhere else.",
      "et.doc.askHr": "Ask HR a question about this",

      /* ---- EMP-12 / EMP-13 · Reimbursements ---- */
      "et.rb.title": "Your reimbursement claims",
      "et.rb.newClaim": "New claim",
      "et.rb.col.claim": "Claim",
      "et.rb.col.category": "Category",
      "et.rb.col.amount": "Amount",
      "et.rb.col.status": "Status",
      "et.rb.col.action": "More",
      "et.rb.f.all": "All", "et.rb.f.draft": "Draft", "et.rb.f.submitted": "Awaiting approval",
      "et.rb.f.approved": "Approved", "et.rb.f.rejected": "Rejected", "et.rb.f.paid": "Paid",
      "et.rb.f.aria": "Filter your claims",
      "et.rb.st.draft": "Draft",
      "et.rb.st.submitted": "Awaiting approval",
      "et.rb.st.approved": "Approved",
      "et.rb.st.rejected": "Rejected",
      "et.rb.st.paid": "Paid",
      "et.rb.paidIn": "Paid in the {mon} payroll run",
      "et.rb.scheduledIn": "Approved — scheduled for the {mon} payout",
      "et.rb.rejectedWhy": "HR wrote: {reason}",
      "et.rb.rejWhy.fuel": "Missing odometer reading on the receipt.",
      "et.rb.entTitle": "What's left this year",
      "et.rb.entOf": "{left} of {annual} left",
      "et.rb.cat.lta": "LTA", "et.rb.cat.medical": "Medical", "et.rb.cat.telephone": "Telephone",
      "et.rb.cat.books_academic": "Books & academic", "et.rb.cat.fuel": "Fuel",
      "et.rb.treat.exempt": "Exempt", "et.rb.treat.taxable": "Taxable", "et.rb.treat.fbp": "Flexible benefit",
      "et.rb.menu.aria": "Actions for claim {id}",
      "et.rb.menu.open": "Open",
      "et.rb.menu.withdraw": "Withdraw this claim",
      "et.rb.menu.withdrawWhy": "Approved on {date} — it will be paid in the next batch. Ask HR if this needs to change.",
      "et.rb.menu.edit": "Edit this draft",
      "et.rb.menu.resubmit": "Resubmit as a new claim",
      "et.rb.withdrawPrompt": "Withdraw claim {id}? This cannot be undone.",
      "et.rb.withdrawnNote": "Withdrawn. Nothing further will be paid on this claim.",
      "et.rb.empty.head": "No claims match this filter",
      "et.rb.empty.body": "Try a different status, or start a new claim.",

      "et.rb.newTitle": "New reimbursement claim",
      "et.rb.newSub": "One category per claim. Add a line for every receipt.",
      "et.rb.catLabel": "Category",
      "et.rb.catPh": "Choose what this claim is for",
      "et.rb.treatShown": "Tax treatment: {treat} — this follows the category, it isn't something you choose.",
      "et.rb.entShown": "{left} left of {annual} this year, before this claim.",
      "et.rb.lineDesc": "Description",
      "et.rb.lineDescPh": "What the receipt is for",
      "et.rb.lineAmount": "Amount",
      "et.rb.lineDate": "Date incurred",
      "et.rb.lineReceipt": "Receipt",
      "et.rb.addLine": "Add another line",
      "et.rb.removeLine": "Remove",
      "et.rb.errDate": "This date is in the future — a claim is for money already spent.",
      "et.rb.errReceipt": "Attach a receipt for every line before sending.",
      "et.rb.total": "Total",
      "et.rb.overLimit": "{over} over the {left} you have left in {cat} this year. It will still be sent, flagged for Anjali Deshpande, not blocked.",
      "et.rb.route": "Goes to Anjali Deshpande for approval. Once approved, paying it out needs a second, distinct check before the money moves.",
      "et.rb.submit": "Send for approval",
      "et.rb.saveDraft": "Save as a draft",
      "et.rb.cancel": "Cancel",
      "et.rb.dupHint": "If the same receipt was used on another claim it is flagged and the earlier claim named \u2014 never silently accepted twice.",
      "et.rb.sent": "Sent for approval. Reference {id}.",
      "et.rb.draftSaved": "Saved as a draft. You can come back and finish it any time.",
      "et.rb.resubmitBanner": "This is a new claim — {oldId} stays on record exactly as it was rejected.",
      "et.rb.noLines": "Add at least one line before sending.",
    },

  });

  /* ============================================================
     DATE HELPERS — ISO parsed as LOCAL dates, never UTC-sliding.
     ============================================================ */
  function parseISO(s) {
    const p = s.split("-");
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  }
  function fmtDate(t, iso) {
    const d = parseISO(iso);
    return d.getDate() + " " + t("et.mon." + String(d.getMonth() + 1).padStart(2, "0")) + " " + d.getFullYear();
  }
  function fmtDateWd(t, iso) {
    const d = parseISO(iso);
    return t("att.d" + d.getDay()) + ", " + fmtDate(t, iso);
  }
  function monthNameOf(t, iso) { return t("et.mon." + String(parseISO(iso).getMonth() + 1).padStart(2, "0")); }

  /* ============================================================
     SHARED LOCAL PRIMITIVES — none of these exist in kit.jsx yet;
     each is flagged as a promotion candidate at the bottom of this
     file rather than edited into the kit (out of scope for this
     dispatch).
     ============================================================ */

  /* TextArea — leave.jsx already flagged this once; two independent
     uses (there, and here) is the bar leave.jsx itself named for
     promoting it into kit.jsx. */
  function TextArea({ id, value, onChange, placeholder, invalid, rows }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <textarea
        id={id} name={id} value={value} rows={rows || 3} placeholder={placeholder}
        aria-invalid={invalid ? "true" : undefined}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        style={ty("body", {
          width: "100%", resize: "vertical",
          border: "1px solid " + (invalid ? c.danger : c.borderStrong),
          borderRadius: G3.r.md, background: c.surface, color: c.ink,
          padding: "12px 15px", outlineOffset: 1,
        })}
      />
    );
  }

  /* FileField now lives in kit.jsx — promoted out of this file on
     2026-09-25, because five tabs here and two dialogs on the HR
     record all needed it. Its words are kit.file.*; the hints below
     stay this file's own. */

  /* ConfirmRow — "nothing irreversible in one click": a withdraw/
     cancel action expands this inline instead of firing immediately. */
  function ConfirmRow({ prompt, confirmLabel, onConfirm, onCancel }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", background: c.sunken, borderRadius: G3.r.md, padding: "11px 13px" }}>
        <span style={ty("small", { color: c.ink, flex: 1, minWidth: 200 })}>{prompt}</span>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <Button kind="primary" size="sm" onClick={onConfirm}>{confirmLabel}</Button>
          <Button kind="ghost" size="sm" onClick={onCancel}>{t("et.common.cancel")}</Button>
        </div>
      </div>
    );
  }

  /* ============================================================
     TAB 1 · EMP-04 REGULARISE A DAY
     §6.8 Regularization (attendance_id, requested_status, reason,
     approval_chain, status), M9 §Acceptance.
     ============================================================ */
  const REG_ANCHOR = { iso: "2026-08-06", inT: "07:49", cat: null };
  const LOCK_BOUNDARY = "2026-08-01"; /* July's run is already approved+paid, per attendance.jsx */
  const REQ_STATUSES = ["present", "half_day", "leave", "weekly_off", "holiday"];
  const REG_CATEGORIES = ["missed_punch", "device_failure", "on_duty", "field_work", "medical", "other"];

  /* the one already-resolved example, reused verbatim from
     attendance.jsx's July 3 row (regularised by Meera Nair, HR) — a
     historical fact this file must not rewrite, even though a fresh
     submission below correctly routes to the Dept Head per M9. */
  const REG_DONE_EXAMPLE = { iso: "2026-07-03", by: "et.rg.hrName", doneIso: "2026-07-05" };

  /* Her own regularisations. The same facts the rest of the canvas
     carries: 3 July was corrected by HR (attendance.jsx's July row),
     29 July is still with her head, and the missing punch on 6 August
     has not been asked about at all — which is why the form opens on
     that day rather than on today. */
  const REG_SEED = [
    { id: "RG-0044", iso: "2026-07-29", req: "half_day", cat: "on_duty", state: "pending", sentIso: "2026-07-30", inT: "07:48", outT: "11:30", reasonKey: "et.rg.why.onDuty" },
    { id: "RG-0038", iso: "2026-07-03", req: "present", cat: "missed_punch", state: "approved", sentIso: "2026-07-04", doneIso: "2026-07-05", byKey: "et.rg.hrName", inT: "07:51", outT: "15:35", reasonKey: "et.rg.why.missed" },
    { id: "RG-0029", iso: "2026-06-18", req: "present", cat: "device_failure", state: "rejected", sentIso: "2026-06-19", doneIso: "2026-06-21", byKey: "et.rg.hodName", noteKey: "et.rg.why.rejected", inT: "07:55", outT: "15:30", reasonKey: "et.rg.why.device" },
  ];
  const REG_STATE_ROLE = { pending: "late", approved: "present", rejected: "penalty", withdrawn: "off" };
  let regSeq = 44;
  function nextRegId() { regSeq += 1; return "RG-00" + regSeq; }

  /* labelled lines, the same shape the leave panel uses: a label the
     eye can skip and a fact it cannot */
  function FactList({ rows }) {
    const { c } = useTheme();
    const { ty } = useLang();
    const live = rows.filter(Boolean);
    return (
      <dl style={{ margin: 0, border: "1px solid " + c.border, borderRadius: G3.r.lg, overflow: "hidden" }}>
        {live.map((row, i) => (
          <div key={row[0]} style={{ display: "grid", gridTemplateColumns: "150px minmax(0,1fr)", gap: 12, padding: "11px 14px", borderTop: i ? "1px solid " + c.rule : "none", background: i % 2 ? c.raised : c.surface }}>
            <dt style={ty("caption", { color: c.inkFaint, fontWeight: 700 })}>{row[0]}</dt>
            <dd style={ty("small", { color: c.ink, margin: 0, fontWeight: 600 })}>{row[1]}</dd>
          </div>
        ))}
      </dl>
    );
  }

  /* a line of good news that must not be mistaken for a row of the
     register underneath it */
  function Flash({ text, onClose }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    if (!text) return null;
    return (
      <div role="status" style={{ display: "flex", gap: 10, alignItems: "flex-start", background: c.presentTint, borderRadius: G3.r.lg, padding: "12px 15px", marginBottom: G3.layout.gap }}>
        <span aria-hidden="true" style={{ display: "flex", color: c.presentText, marginTop: 1, flexShrink: 0 }}><Icon name="check" size={15} /></span>
        <span style={ty("small", { color: c.presentText, fontWeight: 600, flex: 1 })}>{text}</span>
        <LinkButton color={c.presentText} onClick={onClose}>{t("et.common.dismiss")}</LinkButton>
      </div>
    );
  }

  /* ASKING is a task with an end, so it happens in the side panel.
     The page behind it stays what it is: the record of what she has
     already asked for. */
  function RegulariseForm({ onClose, onSend }) {
    const { c, mode } = useTheme();
    const { t, ty } = useLang();
    const [date, setDate] = useState(REG_ANCHOR.iso);
    const [reqStatus, setReqStatus] = useState("present");
    const [inT, setInT] = useState("07:45");
    const [outT, setOutT] = useState("15:30");
    const [cat, setCat] = useState("missed_punch");
    const [reasonRaw, setReasonRaw] = useState(null);
    const [fileName, setFileName] = useState(null);
    const [errors, setErrors] = useState({});

    const reason = reasonRaw === null ? "" : reasonRaw;
    const locked = date < LOCK_BOUNDARY;
    const needsTimes = reqStatus === "present" || reqStatus === "half_day";
    const isFlaggedDay = date === REG_ANCHOR.iso;

    function submit() {
      const next = {};
      if (locked) next.locked = t("et.rg.lockedErr");
      if (!reason.trim()) next.reason = t("et.rg.errReason");
      setErrors(next);
      if (Object.keys(next).length) return;
      onSend({
        id: nextRegId(), iso: date, req: reqStatus, cat: cat, state: "pending", sentIso: TODAY_ISO,
        inT: needsTimes ? inT : null, outT: needsTimes ? outT : null,
        reasonKey: reason.trim(), fileName: fileName,
      });
    }

    const footer = (
      <React.Fragment>
        <div style={ty("caption", { flex: 1, minWidth: 180, color: locked ? c.absentText : c.inkMuted, fontWeight: locked ? 700 : 500 })}>
          {locked ? t("et.rg.lockedErr") : t("et.rg.route")}
        </div>
        <Button kind="ghost" onClick={onClose}>{t("et.common.cancel")}</Button>
        <Button kind="primary" iconRight="arrow" disabled={locked} onClick={submit}>{t("et.rg.submit")}</Button>
      </React.Fragment>
    );

    return (
      <SideScreen title={t("et.rg.newTitle")} sub={t("et.rg.sub")} onClose={onClose} footer={footer}>
        <div style={{ colorScheme: mode }}>
          <div style={{ display: "flex", gap: 16, marginBottom: 6 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Field id="et-rg-date" label={t("et.rg.dayLabel")} hint={isFlaggedDay ? t("et.rg.dayFlagged") : undefined} error={errors.locked}>
                <Input id="et-rg-date" type="date" value={date} onChange={setDate} invalid={!!errors.locked} />
              </Field>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Field id="et-rg-cur" label={t("et.rg.currentStatus")}>
                <div style={{ height: G3.layout.controlH, display: "flex", alignItems: "center" }}>
                  <StatusMark role="missing" word={t(isFlaggedDay ? "et.rg.st.missing" : "et.rg.st.present")} />
                </div>
              </Field>
            </div>
          </div>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
            <LinkButton onClick={() => setDate(REG_ANCHOR.iso)}>{t("et.rg.presetFlagged")}</LinkButton>
            <span aria-hidden="true" style={{ color: c.inkFaint }}>·</span>
            <LinkButton onClick={() => setDate("2026-07-10")}>{t("et.rg.presetLocked")}</LinkButton>
          </div>

          <Field id="et-rg-req" label={t("et.rg.reqLabel")}>
            <Select id="et-rg-req" value={reqStatus} onChange={setReqStatus} options={REQ_STATUSES.map((s) => ({ value: s, label: t("et.rg.opt." + s) }))} />
          </Field>

          {needsTimes ? (
            <div style={{ display: "flex", gap: 16 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Field id="et-rg-in" label={t("et.rg.inLabel")}><Input id="et-rg-in" type="time" value={inT} onChange={setInT} /></Field>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Field id="et-rg-out" label={t("et.rg.outLabel")}><Input id="et-rg-out" type="time" value={outT} onChange={setOutT} /></Field>
              </div>
            </div>
          ) : null}

          <Field id="et-rg-cat" label={t("et.rg.catLabel")}>
            <Select id="et-rg-cat" value={cat} onChange={setCat} options={REG_CATEGORIES.map((k) => ({ value: k, label: t("et.rg.cat." + k) }))} />
          </Field>

          <Field id="et-rg-reason" label={t("et.common.reason")} hint={t("et.rg.reasonHint")} error={errors.reason}>
            <TextArea id="et-rg-reason" value={reason} onChange={setReasonRaw} placeholder={t("et.common.reasonPh")} invalid={!!errors.reason} />
          </Field>

          <div style={{ marginBottom: 10 }}>
            <div style={ty("small", { color: c.ink, fontWeight: 600, marginBottom: 7 })}>{t("et.common.attach")}</div>
            <FileField id="et-rg-file" fileName={fileName} onPick={setFileName} hint={t("et.file.hint")} />
          </div>
        </div>
      </SideScreen>
    );
  }

  /* the request as it stands, opened from its row */
  function RegDetail({ req, onClose, onWithdraw }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [confirming, setConfirming] = useState(false);
    const st = req.state;

    const footer = st === "pending" ? (
      <React.Fragment>
        <div style={ty("caption", { flex: 1, minWidth: 180, color: c.inkMuted })}>{t("et.rg.foot")}</div>
        <Button kind="secondary" iconLeft="signout" onClick={() => setConfirming(true)}>{t("et.rg.withdrawCta")}</Button>
      </React.Fragment>
    ) : (
      <Button kind="ghost" onClick={onClose}>{t("et.common.close")}</Button>
    );

    return (
      <SideScreen title={t("et.rg.detailTitle", { id: req.id })} sub={fmtDateWd(t, req.iso)} onClose={onClose} footer={footer}>
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <StatusMark role={REG_STATE_ROLE[st]} word={t("et.rg.rst." + st)} />
            <span style={ty("caption", { color: c.inkMuted })}>
              {st === "pending"
                ? t("et.rg.withWho", { who: HOD_NAME })
                : st === "withdrawn"
                  ? t("et.rg.withdrawnOn", { date: fmtDate(t, req.doneIso || TODAY_ISO) })
                  : t("et.rg.decidedBy", { who: t(req.byKey), date: fmtDate(t, req.doneIso) })}
            </span>
          </div>

          {req.reasonKey ? (
            <div style={{ borderInlineStart: "2px solid " + c.accent, paddingInlineStart: 13 }}>
              <p style={ty("body", { color: c.ink, margin: 0, lineHeight: 1.5 })}>{t(req.reasonKey)}</p>
              <div style={ty("caption", { color: c.inkFaint, marginTop: 7 })}>{t("et.rg.sentOn", { date: fmtDate(t, req.sentIso) })}</div>
            </div>
          ) : null}

          <FactList rows={[
            [t("et.rg.dayLabel"), fmtDateWd(t, req.iso)],
            [t("et.rg.reqLabel"), t("et.rg.opt." + req.req)],
            req.inT ? [t("et.rg.timesLabel"), req.inT + " – " + req.outT] : null,
            [t("et.rg.catLabel"), t("et.rg.cat." + req.cat)],
            [t("et.common.attach"), req.fileName || t("et.rg.noFile")],
          ]} />

          {req.noteKey ? (
            <div style={{ background: c.absentTint, borderRadius: G3.r.lg, padding: "12px 15px" }}>
              <div style={ty("caption", { color: c.absentText, fontWeight: 700, marginBottom: 4 })}>{t("et.rg.whyDeclined")}</div>
              <p style={ty("small", { color: c.absentText, margin: 0 })}>{t(req.noteKey)}</p>
            </div>
          ) : null}

          {confirming ? (
            <ConfirmRow
              prompt={t("et.rg.withdrawPrompt", { day: fmtDate(t, req.iso) })}
              confirmLabel={t("et.common.confirm")}
              onConfirm={() => { setConfirming(false); onWithdraw(req.id); }}
              onCancel={() => setConfirming(false)}
            />
          ) : null}
        </div>
      </SideScreen>
    );
  }

  function RegulariseTab() {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [rows, setRows] = useState(REG_SEED);
    const [composing, setComposing] = useState(false);
    const [openId, setOpenId] = useState(null);
    const [flash, setFlash] = useState(null);
    const open = openId ? rows.filter((r) => r.id === openId)[0] : null;

    const columns = [
      { key: "day", label: t("et.rg.col.day") },
      { key: "asked", label: t("et.rg.col.asked") },
      { key: "why", label: t("et.rg.col.why") },
      { key: "status", label: t("et.rg.col.status"), width: 220 },
    ];

    return (
      <div>
        <Flash text={flash} onClose={() => setFlash(null)} />
        <Register
          title={t("et.rg.regTitle")}
          action={<Button kind="primary" size="sm" iconLeft="scan" onClick={() => setComposing(true)}>{t("et.rg.newCta")}</Button>}
          columns={columns}
          onSelect={(id) => setOpenId(id)}
          rows={rows.map((r) => ({
            id: r.id,
            highlight: r.id === openId,
            cells: {
              day: (
                <span>
                  <span style={ty("small", { display: "block", color: c.ink, fontWeight: 700 })}>{fmtDateWd(t, r.iso)}</span>
                  <span style={ty("caption", { display: "block", color: c.inkFaint })}>{r.id} · {t("et.rg.sentOn", { date: fmtDate(t, r.sentIso) })}</span>
                </span>
              ),
              asked: (
                <span>
                  <span style={ty("small", { display: "block", color: c.ink })}>{t("et.rg.opt." + r.req)}</span>
                  {r.inT ? <span style={G3.fig("xs", { display: "block", color: c.inkFaint })}>{r.inT} – {r.outT}</span> : null}
                </span>
              ),
              why: t("et.rg.cat." + r.cat),
              status: (
                <span>
                  <StatusMark role={REG_STATE_ROLE[r.state]} word={t("et.rg.rst." + r.state)} />
                  <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 4 })}>
                    {r.state === "pending"
                      ? t("et.rg.withWho", { who: HOD_NAME })
                      : r.state === "withdrawn"
                        ? t("et.rg.withdrawnNote")
                        : t("et.rg.decidedBy", { who: t(r.byKey), date: fmtDate(t, r.doneIso) })}
                  </span>
                </span>
              ),
            },
          }))}
        />

        {composing ? (
          <RegulariseForm
            onClose={() => setComposing(false)}
            onSend={(draft) => {
              setRows([draft].concat(rows));
              setComposing(false);
              setFlash(t("et.rg.sentFlash", { id: draft.id, day: fmtDate(t, draft.iso), who: HOD_NAME }));
            }}
          />
        ) : null}

        {open ? (
          <RegDetail
            req={open}
            onClose={() => setOpenId(null)}
            onWithdraw={(id) => {
              setRows(rows.map((r) => (r.id === id ? Object.assign({}, r, { state: "withdrawn", doneIso: TODAY_ISO }) : r)));
              setOpenId(null);
              setFlash(t("et.rg.withdrawnFlash", { id: id }));
            }}
          />
        ) : null}
      </div>
    );
  }

  /* ============================================================
     TAB 2 · EMP-06 APPLY FOR LEAVE
     M8 §Workflow (validate -> route -> approve -> escalate),
     §Business rules (balance, blackout term, vacation-staff rule,
     cover), M8 §Acceptance.

     THE RECORD FIRST, THE ASKING SECOND. The register below is her
     own leave read from the shared queue (leaveflow.jsx) — the same
     list the head of department decides in, so a request sent from
     here really does land in DH-02, and a decision taken there shows
     up here without a reload.

     Applying opens leave.jsx's guided panel (details -> cover your
     classes -> review) rather than a second form of this file's own.
     Naming a cover is part of applying, never a task left for
     afterwards, and a thinner local form is exactly the one that
     would forget that rule.
     ============================================================ */
  function ApplyLeaveTab({ role, onGoLeave }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    LF.useRequests();
    const meId = ME_ID[role] || ME_ID.employee;
    const me = LF.personById(meId);
    const mine = LF.forPerson(meId);
    const [openId, setOpenId] = useState(null);
    const [applying, setApplying] = useState(false);
    const [flash, setFlash] = useState(null);
    const open = openId ? LF.byId(openId) : null;
    const openStatus = open ? LF.statusOf(open) : null;

    const columns = [
      { key: "dates", label: t("et.lv.col.dates"), width: 240 },
      { key: "type", label: t("et.lv.col.type"), width: 150 },
      { key: "days", label: t("et.lv.col.days"), width: 96 },
      { key: "status", label: t("et.lv.col.status") },
    ];

    const detailFooter = open ? (
      openStatus === "pending" ? (
        <React.Fragment>
          <div style={ty("caption", { flex: 1, minWidth: 180, color: c.inkMuted })}>{t("et.lv.withdrawFoot")}</div>
          <Button
            kind="secondary" iconLeft="signout"
            onClick={() => {
              LF.withdraw(open.id, me.nameKey);
              setOpenId(null);
              setFlash(t("et.lv.withdrawnFlash", { id: open.id }));
            }}
          >
            {t("et.lv.withdrawCta")}
          </Button>
        </React.Fragment>
      ) : (
        <React.Fragment>
          <div style={ty("caption", { flex: 1, minWidth: 180, color: c.inkMuted })}>{t("et.lv.settledFoot")}</div>
          <Button kind="ghost" onClick={() => setOpenId(null)}>{t("et.common.close")}</Button>
        </React.Fragment>
      )
    ) : null;

    return (
      <div>
        <Flash text={flash} onClose={() => setFlash(null)} />
        <Register
          title={t("et.lv.regTitle")}
          sub={t("et.lv.regSub")}
          action={<Button kind="primary" size="sm" iconLeft="leave" onClick={() => setApplying(true)}>{t("et.lv.newCta")}</Button>}
          columns={columns}
          onSelect={(id) => setOpenId(id)}
          rows={mine.map((r) => ({
            id: r.id,
            highlight: r.id === openId,
            tone: LF.statusOf(r) === "cancelled" ? "dim" : undefined,
            cells: {
              dates: (
                <span>
                  <span style={G3.fig("sm", { display: "block", color: c.ink, fontWeight: 600 })}>{LF.fmtRange(t, r.from, r.to)}</span>
                  <span style={ty("caption", { display: "block", color: c.inkFaint })}>{r.id} · {t("et.lv.appliedOn", { date: LF.fmtDate(t, r.appliedISO) })}</span>
                </span>
              ),
              type: <LF.TypeChip code={r.type} word />,
              days: LF.daysWord(t, r.days, r.half),
              status: (
                <span>
                  <LF.StageChip req={r} />
                  {r.coverWith ? <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 4 })}>{t("et.lv.coverIs", { line: LF.coverLine(t, r) })}</span> : null}
                </span>
              ),
            },
          }))}
          footer={(
            <span style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
              <span style={ty("caption", { color: c.inkMuted })}>{t("et.lv.regFoot")}</span>
              <LinkButton onClick={onGoLeave}>{t("et.lv.openModule")}</LinkButton>
            </span>
          )}
        />

        {open ? (
          <SideScreen
            title={t("et.lv.detailTitle", { id: open.id })}
            sub={LF.subLine(t, open.person, false)}
            onClose={() => setOpenId(null)}
            footer={detailFooter}
          >
            <div style={{ display: "grid", gap: 16 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <LF.StageChip req={open} />
                <LF.TypeChip code={open.type} word />
              </div>
              <div style={G3.fig("md", { color: c.ink, fontWeight: 600 })}>
                {LF.fmtRange(t, open.from, open.to)}
                <span style={{ color: c.inkFaint, fontWeight: 400 }}>{"  ·  " + LF.daysWord(t, open.days, open.half)}</span>
              </div>
              <LF.FlagChips req={open} />
              <LF.ReasonBlock req={open} />
              <FactList rows={[
                [t("et.lv.f.applied"), LF.fmtDateFull(t, open.appliedISO)],
                open.coverWith ? [t("et.lv.f.cover"), LF.coverLine(t, open)] : null,
              ]} />
              <div style={{ paddingTop: 14, borderTop: "1px solid " + c.rule }}>
                <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 9 })}>{t("lf.tr.title")}</div>
                <LF.ChainTrail req={open} />
              </div>
            </div>
          </SideScreen>
        ) : null}

        {applying && window.NaveyaLeave && window.NaveyaLeave.Apply ? (
          <window.NaveyaLeave.Apply
            role={role}
            onClose={() => setApplying(false)}
            onSent={(draft) => {
              const made = LF.submit(meId, draft);
              setApplying(false);
              if (made) setFlash(t("et.lv.sentFlash", { id: made.id, who: t(LF.waitingRole(made) === "principal" ? "lf.role.principal" : "lf.role.deptHead") }));
            }}
          />
        ) : null}
      </div>
    );
  }

  /* ============================================================
     TAB 4 · EMP-11 RESPOND TO A DOCUMENT REQUEST
     M4 §Workflow (Open -> Submitted -> Verified | Rejected), §API
     (respond — upload only, only while status=open), §Acceptance.
     The two open requests are the SAME r1/r2 documents.jsx already
     shows on EMP-10's action band; the rest are read-only examples of
     every other EMP-11 state the spec lists, so none of them are
     invented purely for decoration.
     ============================================================ */
  const DOC_REQUESTS = [
    { id: "r1", docKey: "et.doc.type.pan", whoKey: "et.doc.who.meera", whyKey: "et.doc.why.pan", askedIso: "2026-08-08", dueIso: "2026-08-20", state: "open" },
    { id: "r2", docKey: "et.doc.type.bankProof", whoKey: "et.doc.who.rajan", whyKey: "et.doc.why.bankProof", askedIso: "2026-08-11", dueIso: "2026-08-25", state: "open" },
    { id: "r3", docKey: "et.doc.type.medical", whoKey: "et.doc.who.meera", state: "submitted", sentIso: "2026-08-10" },
    { id: "r4", docKey: "et.doc.type.address", whoKey: "et.doc.who.meera", state: "rejected", sentIso: "2026-08-02", backIso: "2026-08-05", reasonKey: "et.doc.backReason.address" },
    { id: "r5", docKey: "et.doc.type.experience", whoKey: "et.doc.who.rajan", state: "overdue", dueIso: "2026-08-01" },
    { id: "r6", docKey: "et.doc.type.bed", whoKey: "et.doc.who.meera", state: "cancelled", cancelledIso: "2026-08-06" },
  ];
  const STATE_ROLE = { open: "late", submitted: "ltEL", rejected: "penalty", overdue: "absent", cancelled: "off" };

  function DocRequestCard({ req, open, onToggle, onSent }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [fileName, setFileName] = useState(null);
    const [note, setNote] = useState("");
    const [errors, setErrors] = useState({});
    const [sent, setSent] = useState(false);

    function submit() {
      if (!fileName) { setErrors({ file: t("et.doc.errFile") }); return; }
      setErrors({});
      setSent(true);
      onSent && onSent(req.id);
    }

    const st = req.state;
    return (
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
          <div style={{ minWidth: 0 }}>
            <div style={ty("h3", { color: c.ink, margin: "0 0 4px" })}>{t(req.docKey)}</div>
            {req.whyKey ? <p style={ty("small", { color: c.inkMuted, margin: "0 0 6px", maxWidth: 520 })}>{t(req.whyKey)}</p> : null}
            {req.whoKey && req.askedIso ? <div style={ty("caption", { color: c.inkFaint })}>{t("et.doc.askedBy", { who: t(req.whoKey), date: fmtDate(t, req.askedIso) })}</div> : null}
          </div>
          <StatusMark role={STATE_ROLE[st]} word={t("et.doc.st." + st)} />
        </div>

        {st === "open" ? (
          <React.Fragment>
            <div style={{ marginTop: 10, marginBottom: 4 }}>
              <span style={ty("small", { color: c.brass, fontWeight: 700 })}>{t("et.doc.dueBy", { date: fmtDate(t, req.dueIso) })}</span>
            </div>
            {!open ? (
              <div style={{ marginTop: 10 }}>
                <Button kind="primary" size="sm" onClick={onToggle}>{t("et.doc.respondCta")}</Button>
              </div>
            ) : sent ? (
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginTop: 14, background: c.presentTint, borderRadius: G3.r.md, padding: "12px 14px" }}>
                <span aria-hidden="true" style={{ display: "flex", color: c.presentText, marginTop: 1 }}><Icon name="check" size={15} /></span>
                <p style={ty("small", { margin: 0, color: c.presentText, fontWeight: 600 })}>{t("et.doc.sentReceipt", { who: t(req.whoKey) })}</p>
              </div>
            ) : (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px dashed " + c.border }}>
                <div style={{ display: "flex", gap: 9, alignItems: "flex-start", marginBottom: 14, background: c.sunken, borderRadius: G3.r.md, padding: "10px 12px" }}>
                  <span aria-hidden="true" style={{ display: "flex", color: c.inkMuted, marginTop: 1 }}><Icon name="lock" size={14} /></span>
                  <span style={ty("caption", { color: c.inkMuted })}>{t("et.doc.liveUnchanged")}</span>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={ty("small", { color: c.ink, fontWeight: 600, marginBottom: 7 })}>{t("et.doc.uploadLabel")}</div>
                  <FileField id={"et-doc-file-" + req.id} fileName={fileName} onPick={(n) => { setFileName(n); setErrors({}); }} hint={errors.file || t("et.file.hint")} invalid={!!errors.file} />
                </div>
                <Field id={"et-doc-note-" + req.id} label={t("et.common.note")}>
                  <TextArea id={"et-doc-note-" + req.id} value={note} onChange={setNote} placeholder={t("et.common.reasonPh")} rows={2} />
                </Field>
                <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                  <Button kind="primary" onClick={submit}>{t("et.doc.submit")}</Button>
                  <Button kind="ghost" onClick={onToggle}>{t("et.common.cancel")}</Button>
                </div>
              </div>
            )}
          </React.Fragment>
        ) : (
          <div style={{ marginTop: 10 }}>
            {st === "submitted" ? <p style={ty("small", { color: c.inkMuted, margin: 0 })}>{t("et.doc.sentAt", { date: fmtDate(t, req.sentIso) })} · {t("et.doc.withHRNote")}</p> : null}
            {st === "rejected" ? (
              <React.Fragment>
                <div style={{ background: c.sunken, borderRadius: G3.r.md, padding: "10px 12px", marginBottom: 8 }}>
                  <div style={ty("caption", { color: c.inkMuted, marginBottom: 3 })}>{t("et.doc.backNote")} <span style={G3.fig("micro")}>{fmtDate(t, req.backIso)}</span></div>
                  <div style={ty("small", { color: c.ink })}>{t(req.reasonKey)}</div>
                </div>
                <p style={ty("small", { color: c.inkMuted, margin: 0 })}>{t("et.doc.backAgain")}</p>
              </React.Fragment>
            ) : null}
            {st === "overdue" ? <p style={ty("small", { color: c.absentText, margin: 0, fontWeight: 600 })}>{t("et.doc.overdueNote")}</p> : null}
            {st === "cancelled" ? <p style={ty("small", { color: c.inkMuted, margin: 0 })}>{t("et.doc.cancelledNote", { who: t(req.whoKey), date: fmtDate(t, req.cancelledIso) })}</p> : null}
          </div>
        )}
      </Card>
    );
  }

  function RespondDocsTab() {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [openId, setOpenId] = useState(null);

    return (
      <div>
        <p style={ty("small", { color: c.inkMuted, margin: "0 0 18px", maxWidth: 680 })}>{t("et.doc.sub")}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {DOC_REQUESTS.map((r) => (
            <DocRequestCard key={r.id} req={r} open={openId === r.id} onToggle={() => setOpenId(openId === r.id ? null : r.id)} />
          ))}
        </div>
        <div style={{ display: "flex", gap: 9, alignItems: "flex-start", marginTop: 18 }}>
          <span aria-hidden="true" style={{ display: "flex", color: c.inkFaint, marginTop: 1 }}><Icon name="lock" size={14} /></span>
          <span style={ty("caption", { color: c.inkMuted })}>{t("et.doc.privacy")}</span>
        </div>
      </div>
    );
  }

  /* ============================================================
     TAB 5 · EMP-12/13 REIMBURSEMENTS
     M10 §Reimbursements, §6.9 ReimbursementClaim/ReimbursementClaimLine.
     ============================================================ */
  const RB_ENTITLEMENTS = {
    lta: { annual: 36000, treat: "exempt" },
    medical: { annual: 15000, treat: "exempt" },
    telephone: { annual: 12000, treat: "fbp" },
    books_academic: { annual: 8000, treat: "fbp" },
    fuel: { annual: 24000, treat: "taxable" },
  };
  const RB_CLAIMS = [
    { id: "RC-0041", category: "telephone", amount: 1000.0, status: "paid", incurredIso: "2026-07-05", monIso: "2026-08-01" },
    { id: "RC-0052", category: "books_academic", amount: 3200.0, status: "approved", incurredIso: "2026-07-20", monIso: "2026-09-01", decidedIso: "2026-08-05" },
    { id: "RC-0058", category: "medical", amount: 6000.0, status: "approved", incurredIso: "2026-07-28", monIso: "2026-09-01", decidedIso: "2026-08-06" },
    { id: "RC-0063", category: "fuel", amount: 1500.0, status: "rejected", incurredIso: "2026-06-15", reasonKey: "et.rb.rejWhy.fuel" },
    { id: "RC-0067", category: "lta", amount: 0, status: "draft", incurredIso: null },
  ];
  function usedOf(cat) {
    return RB_CLAIMS.reduce((s, c2) => (c2.category === cat && (c2.status === "approved" || c2.status === "paid") ? s + c2.amount : s), 0);
  }

  /* WHAT IS LEFT is the number she came for, so it is the biggest
     thing on the tab: one figure per head of spend, the annual
     entitlement under it as context, and a bar for the shape of it.
     Chips could not do this — a chip makes every figure the size of
     its own label. */
  function LeftThisYear() {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const cats = Object.keys(RB_ENTITLEMENTS);
    return (
      <Card icon="payslip" iconTone="brass" title={t("et.rb.entTitle")} sub={t("et.rb.entSub")}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(186px, 1fr))", gap: "22px 26px" }}>
          {cats.map((cat) => {
            const ent = RB_ENTITLEMENTS[cat];
            const used = usedOf(cat);
            const left = Math.max(0, ent.annual - used);
            const frac = ent.annual ? left / ent.annual : 0;
            return (
              <div key={cat} style={{ minWidth: 0 }}>
                <div style={ty("small", { color: c.ink, fontWeight: 700, marginBottom: 6 })}>{t("et.rb.cat." + cat)}</div>
                <Figure value={inr(left)} size="xl" weight={700} color={c.ink} />
                <div style={ty("caption", { color: c.inkMuted, margin: "4px 0 9px" })}>
                  {t("et.rb.leftOf", { annual: inr(ent.annual) })}
                  {used > 0 ? <span style={{ color: c.inkFaint }}>{" · " + t("et.rb.claimed", { used: inr(used) })}</span> : null}
                </div>
                <Meter frac={frac} bar={c.chartTeal} track={c.gutter} height={7} />
                <div style={ty("caption", { color: c.inkFaint, marginTop: 8 })}>{t("et.rb.treat." + ent.treat)}</div>
              </div>
            );
          })}
        </div>
        <p style={ty("caption", { color: c.inkMuted, margin: "18px 0 0", paddingTop: 14, borderTop: "1px solid " + c.border })}>{t("et.rb.entFoot")}</p>
      </Card>
    );
  }

  const RB_FILTERS = ["all", "draft", "submitted", "approved", "rejected", "paid"];

  /* approved is a YES. It used to borrow the rose that leave types
     use, which read as a refusal at a glance — the one thing the
     column must never say by accident. */
  const RB_STATE_ROLE = { paid: "present", approved: "present", rejected: "penalty", submitted: "late", draft: "off" };

  function RbFilterPills({ value, onChange }) {
    const { c } = useTheme();
    const { t } = useLang();
    return (
      <div role="group" aria-label={t("et.rb.f.aria")} style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {RB_FILTERS.map((f) => {
          const on = f === value;
          return (
            <button
              key={f} type="button" aria-pressed={on ? "true" : "false"} onClick={() => onChange(f)}
              style={{
                border: "1px solid " + (on ? c.accent : c.border), borderRadius: G3.r.pill, padding: "6px 14px",
                background: on ? c.accent : c.surface, color: on ? c.onAccent : c.ink,
                fontFamily: G3.font.ui, fontSize: 12.5, fontWeight: 600,
              }}
            >
              {t("et.rb.f." + f)}
            </button>
          );
        })}
      </div>
    );
  }

  /* every action a claim has, in one panel: what it is, what state it
     is in, and the two or three things she can still do about it —
     instead of a menu that hides them behind a glyph. */
  function ClaimDetail({ claim, withdrawn, onClose, onEdit, onResubmit, onWithdraw }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [confirming, setConfirming] = useState(false);
    const st = withdrawn ? "draft" : claim.status;
    const canWithdraw = !withdrawn && (claim.status === "draft" || claim.status === "submitted");

    const actions = [];
    if (claim.status === "draft") actions.push({ key: "edit", icon: "document", label: t("et.rb.menu.edit"), body: t("et.rb.menu.editWhy"), run: () => onEdit(claim) });
    if (claim.status === "rejected") actions.push({ key: "resubmit", icon: "arrow", label: t("et.rb.menu.resubmit"), body: t("et.rb.menu.resubmitWhy"), run: () => onResubmit(claim) });
    actions.push({
      key: "withdraw", icon: "signout", label: t("et.rb.menu.withdraw"),
      body: canWithdraw
        ? t("et.rb.menu.withdrawOk")
        : claim.status === "approved" || claim.status === "paid"
          ? t("et.rb.menu.withdrawWhy", { date: fmtDate(t, claim.decidedIso || claim.monIso) })
          : t("et.rb.menu.withdrawNo"),
      disabled: !canWithdraw,
      run: canWithdraw ? () => setConfirming(true) : null,
    });

    return (
      <SideScreen
        title={t("et.rb.detailTitle", { id: claim.id })}
        sub={t("et.rb.cat." + claim.category)}
        onClose={onClose}
        footer={<Button kind="ghost" onClick={onClose}>{t("et.common.close")}</Button>}
      >
        <div style={{ display: "grid", gap: 18 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <Figure value={inr(claim.amount)} size="xl" weight={700} color={c.ink} />
            <StatusMark role={RB_STATE_ROLE[st]} word={t("et.rb.st." + st)} />
          </div>

          <FactList rows={[
            [t("et.rb.f.incurred"), claim.incurredIso ? fmtDate(t, claim.incurredIso) : t("et.rb.f.noDate")],
            claim.status === "paid" ? [t("et.rb.f.paid"), t("et.rb.paidIn", { mon: monthNameOf(t, claim.monIso) })] : null,
            claim.status === "approved" ? [t("et.rb.f.due"), t("et.rb.scheduledIn", { mon: monthNameOf(t, claim.monIso) })] : null,
            claim.decidedIso ? [t("et.rb.f.decided"), fmtDate(t, claim.decidedIso)] : null,
            [t("et.rb.f.left"), inr(Math.max(0, RB_ENTITLEMENTS[claim.category].annual - usedOf(claim.category)))],
          ]} />

          {claim.reasonKey ? (
            <div style={{ background: c.absentTint, borderRadius: G3.r.lg, padding: "12px 15px" }}>
              <div style={ty("caption", { color: c.absentText, fontWeight: 700, marginBottom: 4 })}>{t("et.rb.whyRejected")}</div>
              <p style={ty("small", { color: c.absentText, margin: 0 })}>{t(claim.reasonKey)}</p>
            </div>
          ) : null}

          {withdrawn ? (
            <p style={ty("small", { color: c.inkMuted, margin: 0 })}>{t("et.rb.withdrawnNote")}</p>
          ) : null}

          <div>
            <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 9 })}>{t("et.rb.actionsTitle")}</div>
            <div style={{ display: "grid", gap: 10 }}>
              {actions.map((a) => (
                <button
                  key={a.key} type="button" disabled={!a.run}
                  onClick={a.run || undefined}
                  style={{
                    display: "flex", gap: 12, alignItems: "flex-start", textAlign: "left", width: "100%",
                    border: "1px solid " + c.border, borderRadius: G3.r.lg, padding: "13px 15px",
                    background: a.run ? c.surface : c.sunken, cursor: a.run ? "pointer" : "default",
                    opacity: a.run ? 1 : 0.85,
                  }}
                >
                  <span aria-hidden="true" style={{ display: "flex", color: a.run ? c.accent : c.inkFaint, marginTop: 2, flexShrink: 0 }}><Icon name={a.icon} size={15} /></span>
                  <span style={{ minWidth: 0 }}>
                    <span style={ty("small", { display: "block", color: a.run ? c.ink : c.inkMuted, fontWeight: 700 })}>{a.label}</span>
                    <span style={ty("caption", { display: "block", color: c.inkMuted, marginTop: 2 })}>{a.body}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {confirming ? (
            <ConfirmRow
              prompt={t("et.rb.withdrawPrompt", { id: claim.id })}
              confirmLabel={t("et.common.confirm")}
              onConfirm={() => { setConfirming(false); onWithdraw(claim.id); }}
              onCancel={() => setConfirming(false)}
            />
          ) : null}
        </div>
      </SideScreen>
    );
  }

  function ClaimsList({ withdrawn, onNew, onOpen, openId }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [filter, setFilter] = useState("all");
    const rows = RB_CLAIMS.filter((cl) => filter === "all" || (withdrawn[cl.id] ? "draft" : cl.status) === filter);

    const columns = [
      { key: "claim", label: t("et.rb.col.claim") },
      { key: "category", label: t("et.rb.col.category") },
      { key: "amount", label: t("et.rb.col.amount"), align: "right", mono: true, width: 120 },
      { key: "status", label: t("et.rb.col.status"), width: 240 },
    ];

    if (!rows.length) {
      return (
        <Card title={t("et.rb.title")} action={<Button kind="primary" size="sm" iconLeft="mail" onClick={onNew}>{t("et.rb.newClaim")}</Button>}>
          <EmptyState head={t("et.rb.empty.head")} body={t("et.rb.empty.body")} />
        </Card>
      );
    }

    return (
      <Register
        title={t("et.rb.title")}
        action={<Button kind="primary" size="sm" iconLeft="mail" onClick={onNew}>{t("et.rb.newClaim")}</Button>}
        chips={<RbFilterPills value={filter} onChange={setFilter} />}
        columns={columns}
        onSelect={onOpen}
        rows={rows.map((cl) => {
          const st = withdrawn[cl.id] ? "draft" : cl.status;
          return {
            id: cl.id,
            highlight: cl.id === openId,
            cells: {
              claim: (
                <span>
                  <span style={ty("small", { display: "block", color: c.ink, fontWeight: 700 })}>{cl.id}</span>
                  <span style={ty("caption", { display: "block", color: c.inkFaint })}>{cl.incurredIso ? fmtDate(t, cl.incurredIso) : "—"}</span>
                </span>
              ),
              category: t("et.rb.cat." + cl.category),
              amount: inr(cl.amount),
              status: (
                <span>
                  <StatusMark role={RB_STATE_ROLE[st]} word={t("et.rb.st." + st)} />
                  {st === "paid" ? <div style={ty("caption", { color: c.inkFaint, marginTop: 4 })}>{t("et.rb.paidIn", { mon: monthNameOf(t, cl.monIso) })}</div> : null}
                  {st === "approved" ? <div style={ty("caption", { color: c.inkFaint, marginTop: 4 })}>{t("et.rb.scheduledIn", { mon: monthNameOf(t, cl.monIso) })}</div> : null}
                  {st === "rejected" ? <div style={ty("caption", { color: c.absentText, marginTop: 4, maxWidth: 260 })}>{t("et.rb.rejectedWhy", { reason: t(cl.reasonKey) })}</div> : null}
                  {withdrawn[cl.id] ? <div style={ty("caption", { color: c.inkMuted, marginTop: 4 })}>{t("et.rb.withdrawnNote")}</div> : null}
                </span>
              ),
            },
          };
        })}
      />
    );
  }

  function NewClaimForm({ prefill, onClose, onSent }) {
    const { c, mode } = useTheme();
    const { t, ty } = useLang();
    const [category, setCategory] = useState(prefill && prefill.category ? prefill.category : "");
    const [lines, setLines] = useState(prefill && prefill.lines && prefill.lines.length ? prefill.lines : [{ desc: "", amount: "", date: TODAY_ISO, fileName: null }]);
    const [errors, setErrors] = useState({});

    const ent = category ? RB_ENTITLEMENTS[category] : null;
    const left = ent ? Math.max(0, ent.annual - usedOf(category)) : 0;
    const total = lines.reduce((s, l) => s + (parseFloat(l.amount) || 0), 0);
    const over = ent && total > left ? total - left : 0;

    function setLine(i, patch) { setLines(lines.map((l, idx) => (idx === i ? Object.assign({}, l, patch) : l))); }
    function addLine() { setLines(lines.concat([{ desc: "", amount: "", date: TODAY_ISO, fileName: null }])); }
    function removeLine(i) { setLines(lines.filter((_, idx) => idx !== i)); }

    function validate() {
      const next = {};
      if (!category) next.category = t("et.rb.errCat");
      if (!lines.length) next.lines = t("et.rb.noLines");
      if (lines.some((l) => l.date && l.date > TODAY_ISO)) next.date = t("et.rb.errDate");
      if (lines.some((l) => !l.fileName)) next.receipt = t("et.rb.errReceipt");
      return next;
    }
    function submit(kind) {
      if (kind === "draft") { onSent("draft", null); return; }
      const next = validate();
      setErrors(next);
      if (!Object.keys(next).length) onSent("sent", "RC-0071");
    }

    const footer = (
      <React.Fragment>
        <div style={ty("caption", { flex: 1, minWidth: 160, color: c.inkMuted })}>{t("et.rb.route")}</div>
        <Button kind="ghost" onClick={() => submit("draft")}>{t("et.rb.saveDraft")}</Button>
        <Button kind="primary" iconRight="arrow" onClick={() => submit("sent")}>{t("et.rb.submit")}</Button>
      </React.Fragment>
    );

    return (
      <SideScreen title={t("et.rb.newTitle")} sub={t("et.rb.newSub")} onClose={onClose} footer={footer} width={720}>
        <div style={{ colorScheme: mode }}>
          {prefill && prefill.banner ? (
            <p style={ty("caption", { color: c.inkMuted, margin: "0 0 16px", padding: "9px 12px", background: c.sunken, borderRadius: G3.r.md })}>
              {t("et.rb.resubmitBanner", { oldId: prefill.banner })}
            </p>
          ) : null}

          <Field id="et-rb-cat" label={t("et.rb.catLabel")} error={errors.category}>
            <Select
              id="et-rb-cat" value={category} onChange={(v) => { setCategory(v); setErrors({}); }}
              options={[{ value: "", label: t("et.rb.catPh") }].concat(Object.keys(RB_ENTITLEMENTS).map((k) => ({ value: k, label: t("et.rb.cat." + k) })))}
            />
          </Field>

          {ent ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 22 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                <Figure value={inr(left)} size="lg" weight={700} color={c.ink} />
                <span style={ty("caption", { color: c.inkMuted })}>{t("et.rb.leftOf", { annual: inr(ent.annual) })}</span>
              </div>
              <Meter frac={ent.annual ? left / ent.annual : 0} bar={c.chartTeal} track={c.gutter} height={7} />
              <span style={ty("caption", { color: c.inkFaint })}>{t("et.rb.treatShown", { treat: t("et.rb.treat." + ent.treat) })}</span>
            </div>
          ) : null}

          {lines.map((l, i) => (
            <div key={i} style={{ border: "1px solid " + c.border, borderRadius: G3.r.lg, padding: 16, marginBottom: 14 }}>
              <Field id={"et-rb-desc-" + i} label={t("et.rb.lineDesc")}>
                <Input id={"et-rb-desc-" + i} value={l.desc} onChange={(v) => setLine(i, { desc: v })} placeholder={t("et.rb.lineDescPh")} />
              </Field>
              <div style={{ display: "flex", gap: 14 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Field id={"et-rb-amt-" + i} label={t("et.rb.lineAmount")}>
                    <Input id={"et-rb-amt-" + i} type="text" inputMode="decimal" value={l.amount} onChange={(v) => setLine(i, { amount: v.replace(/[^0-9.]/g, "") })} placeholder="0.00" />
                  </Field>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Field id={"et-rb-date-" + i} label={t("et.rb.lineDate")} error={errors.date && l.date > TODAY_ISO ? errors.date : undefined}>
                    <Input id={"et-rb-date-" + i} type="date" value={l.date} onChange={(v) => setLine(i, { date: v })} invalid={!!(errors.date && l.date > TODAY_ISO)} />
                  </Field>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 14 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={ty("small", { color: c.ink, fontWeight: 600, marginBottom: 7 })}>{t("et.rb.lineReceipt")}</div>
                  <FileField id={"et-rb-file-" + i} fileName={l.fileName} onPick={(n) => setLine(i, { fileName: n })} hint={errors.receipt && !l.fileName ? errors.receipt : t("et.file.hint")} invalid={!!(errors.receipt && !l.fileName)} />
                </div>
                {lines.length > 1 ? <LinkButton onClick={() => removeLine(i)}>{t("et.rb.removeLine")}</LinkButton> : null}
              </div>
            </div>
          ))}

          <div style={{ marginBottom: 8 }}><LinkButton onClick={addLine}>{t("et.rb.addLine")}</LinkButton></div>
          <p style={ty("caption", { color: c.inkFaint, margin: "0 0 18px" })}>{t("et.rb.dupHint")}</p>

          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "12px 0", borderTop: "1px solid " + c.rule }}>
            <span style={ty("small", { color: c.ink, fontWeight: 700 })}>{t("et.rb.total")}</span>
            <Figure value={inr(total)} size="lg" weight={700} color={c.ink} />
          </div>

          {ent && over > 0 ? (
            <p style={ty("small", { margin: "12px 0 0", padding: "11px 14px", borderRadius: G3.r.md, background: c.lateTint, color: c.lateText, fontWeight: 600 })}>
              {t("et.rb.overLimit", { over: inr(over), left: inr(left), cat: t("et.rb.cat." + category) })}
            </p>
          ) : null}
        </div>
      </SideScreen>
    );
  }

  function ReimbursementsTab() {
    const { t } = useLang();
    const [composing, setComposing] = useState(null);
    const [openId, setOpenId] = useState(null);
    const [withdrawn, setWithdrawn] = useState({});
    const [flash, setFlash] = useState(null);
    const claim = openId ? RB_CLAIMS.filter((cl) => cl.id === openId)[0] : null;

    return (
      <div>
        <Flash text={flash} onClose={() => setFlash(null)} />
        <LeftThisYear />
        <div style={{ marginTop: G3.layout.gap }}>
          <ClaimsList
            withdrawn={withdrawn} openId={openId}
            onNew={() => setComposing({})}
            onOpen={(id) => setOpenId(id)}
          />
        </div>

        {claim ? (
          <ClaimDetail
            claim={claim} withdrawn={!!withdrawn[claim.id]}
            onClose={() => setOpenId(null)}
            onEdit={(cl) => { setOpenId(null); setComposing({ category: cl.category, lines: [] }); }}
            onResubmit={(cl) => {
              setOpenId(null);
              setComposing({ category: cl.category, banner: cl.id, lines: [{ desc: t("et.rb.cat." + cl.category), amount: String(cl.amount), date: TODAY_ISO, fileName: null }] });
            }}
            onWithdraw={(id) => {
              setWithdrawn(Object.assign({}, withdrawn, { [id]: true }));
              setOpenId(null);
              setFlash(t("et.rb.withdrawnFlash", { id: id }));
            }}
          />
        ) : null}

        {composing ? (
          <NewClaimForm
            prefill={composing}
            onClose={() => setComposing(null)}
            onSent={(kind, id) => {
              setComposing(null);
              setFlash(kind === "sent" ? t("et.rb.sent", { id: id }) : t("et.rb.draftSaved"));
            }}
          />
        ) : null}
      </div>
    );
  }

  /* ============================================================
     PAGE
     ============================================================ */
  const TABS_ID = "et-tabs";
  /* "Mark attendance" is NOT here. Clocking in writes to the
     attendance record, so it belongs beside that record on My
     attendance (attendance.jsx: web clock-in, on duty, partial day),
     not in the module for things somebody else has to decide. */
  const TAB_ITEMS_KEYS = [
    { key: "regularise", label: "et.tab.regularise" },
    { key: "leave", label: "et.tab.leave" },
    { key: "documents", label: "et.tab.documents" },
    { key: "reimb", label: "et.tab.reimb" },
    /* EMP-19. The screen is defined in pages/emp-more.jsx, beside the
       loan ledger and the pay-request queue it reads; asking for one is
       a request like any other, so it is answered for here. */
    { key: "loans", label: "et.tab.loans" },
  ];

  function EmpTasks({ role, onNavigate }) {
    const { c } = useTheme();
    const { t, ty, lang } = useLang();
    const L = G3.layout;
    /* another screen can send her here pointed at a tab — Documents'
       Upload does exactly that, because responding to HR happens here */
    const [tab, setTab] = useState(window.NaveyaTasksTab || "regularise");
    useEffect(() => { window.NaveyaTasksTab = null; }, []);

    const tabItems = TAB_ITEMS_KEYS.map((x) => ({ key: x.key, label: t(x.label) }));

    return (
      <div className="nv3" style={{ display: "flex", minHeight: "100vh", background: c.page, color: c.ink, fontFamily: G3.font.ui }}>
        <Rail role={role || "employee"} active="empTasks" onNavigate={onNavigate} />

        <main style={{ flex: 1, minWidth: 0, position: "relative", overflowX: "clip" }}>
          <Motif />
          <div style={{ position: "relative", zIndex: 1, maxWidth: L.contentMax, margin: "0 auto", padding: "22px " + L.contentPadX + "px 56px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, marginBottom: 16 }}>
              <div style={ty("small", { color: c.inkMuted })}>
                <span style={{ color: c.ink, fontWeight: 700 }}>{t("nav.empTasks")}</span>
                <span style={{ margin: "0 8px", color: c.inkFaint }}>·</span>
                <span>{t("home.school")}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <ThemeToggle />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <h1 style={ty("display", { margin: 0, color: c.ink })}>{t("et.pageTitle")}</h1>
            </div>

            <Tabs items={tabItems} active={tab} onChange={setTab} ariaLabel={t("et.pageTitle")} idBase={TABS_ID} />

            {tab === "regularise" ? (
              <TabPanel idBase={TABS_ID} tabKey="regularise" style={{ marginTop: 20 }}>
                <RegulariseTab />
              </TabPanel>
            ) : null}
            {tab === "leave" ? (
              <TabPanel idBase={TABS_ID} tabKey="leave" style={{ marginTop: 20 }}>
                <ApplyLeaveTab role={role} onGoLeave={() => onNavigate && onNavigate("leave")} />
              </TabPanel>
            ) : null}
            {tab === "documents" ? (
              <TabPanel idBase={TABS_ID} tabKey="documents" style={{ marginTop: 20 }}>
                <RespondDocsTab />
              </TabPanel>
            ) : null}
            {tab === "reimb" ? (
              <TabPanel idBase={TABS_ID} tabKey="reimb" style={{ marginTop: 20 }}>
                <ReimbursementsTab />
              </TabPanel>
            ) : null}
            {tab === "loans" ? (
              window.NaveyaLoans && window.NaveyaLoans.Tab
                ? React.createElement(window.NaveyaLoans.Tab, {
                  me: profileFor(role || "employee"), idBase: TABS_ID,
                })
                : (
                  <TabPanel idBase={TABS_ID} tabKey="loans" style={{ marginTop: 20 }}>
                    <EmptyState head={t("et.tab.loans")} body={t("et.loans.missing")} />
                  </TabPanel>
                )
            ) : null}
          </div>
        </main>
      </div>
    );
  }

  window.Pages3 = window.Pages3 || {};
  window.Pages3.EmpTasks = EmpTasks;
})();
