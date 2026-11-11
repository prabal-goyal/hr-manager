/* @jsxRuntime classic */
/* ============================================================
   Naveya — HR Operator · leave & attendance administration
   window.Pages3.HRLeaveAtt  (one component, five tabbed screens)

   HR-26 Leave policy & types   — "what leave exists and who may take it"
   HR-27 Leave balances register— "what everyone has, and does it add up"
   HR-28 Leave requests console — "which requests are stuck, campus-wide"
   HR-29 Shifts & rosters       — "who is rostered to what shift"
   HR-30 Attendance exceptions  — "which records are wrong, and why"

   SPEC. docs/screen-inventory.md HR-26/27/28/29/30 (every row of their
   action tables is implemented, refused-with-a-reason, or deliberately
   absent — see the SELF-CHECK block at the foot of this file), read
   against docs/development-specification.md:
     M7 §Business rules + §6.6 Term  — the academic frame: vacation
        terms feed teacher leave logic; exam/admission Terms are the
        blackout windows HR-26 binds leave types to.
     M8 §Business rules + §6.7       — LeavePolicy / LeaveType
        (accrual_rule, carry_forward_cap, encashable,
        applies_to_vacation_staff, allows_half_day) / LeaveBalance
        (per-AY opening · accrued · used · balance) / LeaveRequest;
        "unpaid or exhausted → LOP into payroll".
     M8 §Permissions                 — `leave.approve` belongs to the
        HOD/Principal. HR administers; HR does not decide. Force-approve
        is therefore ABSENT from this file, not disabled.
     M9 §Business rules + §6.8       — Shift (start/end, type, grace) /
        AttendanceRecord / Regularization; the nightly job raises the
        exceptions HR-30 works; "paid-days = present + paid-leave +
        holidays + weekly-offs − LOP" is what HR-30 ultimately moves.
     M9 §Permissions                 — `attendance.manage` is HR's.
     §4.2 audit / §4.3 effective-dating / §8 maker-checker.

   COMPLIANCE. docs/ui-compliance-requirements.md:
     · the standing offered / disabled-with-the-reason / absent rule —
       applied consistently, never mixed (see SELF-CHECK).
     · A28/A29/A31/A32 — every cancel, adjust, correct and bulk-correct
       takes a REQUIRED reason, is attributed, appends rather than
       overwrites, and states its payroll consequence BEFORE it commits.
     · §2.5 note + R9 + F14 — a leave TYPE is health-adjacent (SL is
       literally "Medical leave" in this product's own dictionary). So:
       the campus day-view on HR-28, and the roster grid on HR-29, say
       only "On leave" — never the type, never the reason. Type appears
       on the request console itself, which HR-28 §Must contain names,
       and on the balances register, which is a per-type ledger by
       definition; free-text REASON never appears in any list column at
       all, only inside a single opened record.
     · O3 — salary is PII. There is no gross/CTC column anywhere here.
       The one money figure this screen shows is the DERIVED cost of an
       unpaid day (gross ÷ 30), and only inside a single decision
       surface, with its derivation printed next to it.

   MONEY. One unpaid day = monthly gross ÷ 30, the convention already
   used by pages/attendance.jsx, pages/leave.jsx, pages/payslips.jsx and
   pages/payroll.jsx (DAY_DIVISOR). Ananya Rao's ₹94,800 therefore
   prices at ₹3,160.00 a day here too. Nothing is re-typed: every rupee
   on this screen is inr(gross / DAY_DIVISOR * days), and every ledger
   balance is opening + accrued − taken, computed.

   CLOCK. Tuesday 11 August 2026 (TODAY_ISO), matching screens.jsx /
   attendance.jsx / leave.jsx / depthead.jsx / principal.jsx /
   payroll.jsx / accountant.jsx, so the role switcher never jumps.
   Downstream state reused verbatim rather than re-invented:
     · run PR-2026-07 (July) is approved and disbursed → July is LOCKED.
     · run PR-2026-08 (August) is with its checker, and PY-08's paid-day
       snapshot was taken on 8 August and bound to it → an August
       correction made now is recorded but does NOT move pay until the
       snapshot is retaken. HR-30 says exactly that.
     · Term-1 examinations, 14–19 September 2026 (lv.win.exam1 /
       lv.win.exam1d) — the same blackout leave.jsx, depthead.jsx and
       principal.jsx use. Not a second one.
     · Ananya Rao NAV-0142 (CL 12+0−4=8) and her LR-0219, Karan, Meera
       Joshi, Ramesh Iyer, Priya, Divya, Sanjay from depthead.jsx;
       the campus staff list, categories and vacation flags from hr.jsx;
       Anjali Deshpande (HOD Science), Radhika Menon (Principal),
       Meera Iyer (HR Operator) as themselves.

   Composed only from window.G3 / window.UI3. kit.jsx, tokens.jsx,
   screens.jsx, v3.html and every sibling pages/*.jsx are untouched.
   Local primitives defined here because the kit lacks them and the kit
   is out of scope for this dispatch — promotion candidates are listed
   in the LOCAL PRIMITIVES section header.
   ============================================================ */
(function () {
  const G3 = window.G3;
  const UI = window.UI3;
  const { useState, useMemo, useEffect, useRef } = React;
  const {
    useTheme, ThemeToggle, useLang, addStrings,
    Rail, Motif, Card, CardHeader, ColorCard, Register, TitleMark,
    Button, LinkButton, Field, Input, Select, Switch, Tabs, TabPanel, ActionMenu,
    Chip, StatusMark, Meter, Icon, inr, num, EmptyState, SideScreen, Figure, Avatar, Band,
    CampusSwitch, campusLabel, inCampusKey, CAMPUS_ALL,
  } = UI;

  /* ============================================================
     STRINGS — hla.* is this file's whole namespace. EN and HI carry
     exactly the same key set; demo content (names, reasons, notes,
     device labels) is authored in BOTH languages, because the i18n
     leak this system keeps re-finding is untranslated mock content,
     not missing chrome. Short weekday and month forms are AUTHORED,
     never sliced off a long form — two Devanagari weekdays collide
     to the same glyph if you slice.
     Keys reused from other files (loaded earlier in v3.html's fixed
     order): home.school, hr3.campus.indiranagar, lv.type.*, lv.win.*,
     lv.mon.*, lv.r.wedding.
     ============================================================ */
  addStrings({
    en: {
      /* ---------- chrome ---------- */
      "hla.title": "Leave administration",
      "hla.meta": "{school}, {campus} · academic year 2026-27 · Tuesday, 11 August 2026",
      "hla.who": "Meera Iyer · HR Operator",
      "hla.scope": "Indiranagar Campus only. Whitefield staff sit outside your scope and do not appear on any list here.",
      "hla.tabs.aria": "Leave and attendance sections",
      "hla.tab.policy": "Leave policy",
      "hla.tab.balances": "Balances",
      "hla.tab.requests": "Requests",
      "hla.tab.shifts": "Shifts and rosters",
      "hla.tab.exceptions": "Exceptions",
      "hla.q.policy": "What leave exists here, and who may take it?",
      "hla.q.balances": "What does everyone have, and does it add up?",
      "hla.q.requests": "Which requests are stuck, campus-wide?",
      "hla.q.shifts": "Who is rostered to what shift?",
      "hla.q.exceptions": "Which attendance records are wrong, and why?",

      "hla.wd.0": "Sun", "hla.wd.1": "Mon", "hla.wd.2": "Tue", "hla.wd.3": "Wed",
      "hla.wd.4": "Thu", "hla.wd.5": "Fri", "hla.wd.6": "Sat",
      "hla.mo.1": "Jan", "hla.mo.2": "Feb", "hla.mo.3": "Mar", "hla.mo.4": "Apr",
      "hla.mo.5": "May", "hla.mo.6": "Jun", "hla.mo.7": "Jul", "hla.mo.8": "Aug",
      "hla.mo.9": "Sep", "hla.mo.10": "Oct", "hla.mo.11": "Nov", "hla.mo.12": "Dec",
      "hla.range": "{from} – {to}",
      "hla.halfDay": "Half day",

      "hla.act.cancel": "Cancel",
      "hla.act.close": "Close",
      "hla.act.export": "Export",
      "hla.act.clearFilters": "Clear filters",
      "hla.reason.label": "Reason — required",
      "hla.reason.hint": "This is written to the audit trail against your name and is visible to whoever reads the record afterwards.",
      "hla.reason.missing": "A reason is required. Nothing is recorded without one.",
      "hla.reason.short": "Say a little more — one word is not a reason anyone can act on later.",
      "hla.by": "{name} · {date}",
      "hla.recordedBy": "Recorded by {name} on {date}",
      "hla.appendOnly": "Adjustments are appended. Nothing on this ledger is overwritten or removed.",
      "hla.effFrom": "Effective from",

      "hla.lop.rule": "A day with no balance left is loss of pay — one thirtieth of monthly gross.",
      "hla.lop.derived": "Derived from monthly gross ÷ 30. Salary itself is not shown on this screen.",
      "hla.lop.word": "Loss of pay",
      "hla.lop.exact": "Payroll works the exact figure out when the run is prepared. This is what it will cost at today's gross.",

      /* ---------- period / lock state, shared by HR-29 and HR-30 ---------- */
      "hla.lock.julyWord": "July is closed",
      "hla.lock.july": "July sits inside {run}, approved and disbursed. A correction to July is an arrears decision, taken on the run.",
      "hla.lock.julyShort": "July 2026 is inside {run}, approved and disbursed.",
      "hla.lock.route": "Open the payroll run",
      "hla.lock.augWord": "August is with the checker",
      "hla.lock.aug": "{run} is signed and with a different approver. A correction reaches the attendance record now, and pay when payroll retakes the snapshot.",

      /* ============================================================
         HR-26 · LEAVE POLICY AND TYPES
         ============================================================ */
      "hla26.pol.pick": "Policy",
      "hla26.pol.active": "2026-27 · in force",
      "hla26.pol.draft": "2027-28 · draft",
      "hla26.pol.state.active": "Active",
      "hla26.pol.card.title": "Leave policy 2026-27",
      "hla26.pol.card.sub": "Version {v} · in force from {from} · activated by {by} on {on}",
      "hla26.pol.inUse": "In use",
      "hla26.pol.inUseD": "{n} staff hold balances against this policy. A type in use is superseded from a date, never edited in place.",
      "hla26.pol.types": "{n} leave types",
      "hla26.pol.ay": "Academic year",
      "hla26.pol.scope": "Scope",
      "hla26.pol.scopeV": "Indiranagar Campus",

      "hla26.draft.title": "2027-28 is not configured yet",
      "hla26.draft.body": "Next year's balances cannot be initialised until a policy exists for it. The year opens on 1 April 2027.",
      "hla26.draft.copy": "Copy the 2026-27 policy",
      "hla26.draft.copyNote": "Copying brings every type across as a draft. Nothing is in force until you activate it.",
      "hla26.draft.made": "A draft for 2027-28 has been created from 2026-27. It is not in force.",

      /* the honey card — the one genuine call to action on this tab */
      "hla26.amend.title": "One change is drafted and not yet in force",
      "hla26.amend.line": "Medical leave — annual accrual cap raised from {oldN} to {newN} days",
      "hla26.amend.meta": "Drafted by {by} on {on} · proposed effective date {eff}",
      "hla26.amend.why": "Why",
      "hla26.amend.whyText": "The staff council asked for parity with the aided-school norm after the June dengue weeks. The principal agreed on 5 August.",
      "hla26.amend.cta": "Review and activate",
      "hla26.amend.discard": "Discard the draft",
      "hla26.amend.gone": "The drafted change has been discarded. Medical leave stays at {oldN} days.",
      "hla26.amend.done": "Medical leave will accrue up to {newN} days from {eff}. Version {v}, recorded against {by}.",

      "hla26.sup.title": "Activate this change",
      "hla26.sup.body": "This supersedes the medical-leave type from {eff}. The version in force until then stays exactly as it is.",
      "hla26.sup.effLabel": "Effective from",
      "hla26.sup.balLabel": "What happens to the balances that already exist — required",
      "hla26.sup.bal.recalc": "Recalculate from the start of the year",
      "hla26.sup.bal.recalcD": "Medical-leave accrual for 2026-27 is worked out again on the new cap. Balances go up for {n} staff; nothing taken is un-taken.",
      "hla26.sup.bal.grand": "Grandfather — apply from the effective date only",
      "hla26.sup.bal.grandD": "Accrual before {eff} stays on the old cap; only months after it use the new one.",
      "hla26.sup.balMissing": "Choose what happens to existing balances. There is no safe default here.",
      "hla26.sup.confirm": "Activate from {eff}",
      "hla26.sup.second": "A leave-policy change reaches pay through loss of pay and encashment, so it goes for a second pair of eyes.",

      "hla26.types.title": "Leave types in this policy",
      "hla26.types.sub": "Code, how it accrues, what carries forward, and — the education question — whether it applies to teaching staff.",
      "hla26.col.type": "Type",
      "hla26.col.accrual": "How it accrues",
      "hla26.col.cap": "Carries forward",
      "hla26.col.encash": "Encashable",
      "hla26.col.vac": "Teaching staff",
      "hla26.col.half": "Half day",
      "hla26.col.max": "Max in a row",
      "hla26.cap.none": "Does not carry",
      "hla26.cap.n": "Up to {n} days",
      "hla26.yes": "Yes",
      "hla26.no": "No",
      "hla26.max.none": "No limit set",
      "hla26.max.n": "{n} days",

      "hla26.vac.yes": "Applies",
      "hla26.vac.no": "Does not apply",
      "hla26.vac.noteEL": "A teacher's paid break is the school vacation itself, so no earned leave accrues to her. This is the switch most often set wrong.",
      "hla26.vac.legend": "Teaching staff have their leave year shaped by the vacations. Non-teaching staff work through them and accrue earned leave instead.",

      "hla26.type.el": "Earned leave",
      "hla26.type.cl": "Casual leave",
      "hla26.type.sl": "Medical leave",
      "hla26.type.comp": "Comp-off",
      "hla26.type.duty": "On duty / exam duty",
      "hla26.type.mat": "Maternity leave",
      "hla26.type.pat": "Paternity leave",
      "hla26.type.study": "Study leave",
      "hla26.type.sab": "Sabbatical",
      "hla26.type.brv": "Bereavement leave",
      "hla26.type.mrg": "Marriage leave",
      "hla26.type.lop": "Loss of pay",

      "hla26.acc.el": "1.5 days for each completed month, pro-rated on joining",
      "hla26.acc.cl": "12 days credited on 1 April, pro-rated on joining",
      "hla26.acc.sl": "1 day for each completed month, up to {n} a year",
      "hla26.acc.comp": "Earned by working a holiday or a weekly off; lapses after 60 days",
      "hla26.acc.duty": "Not accrued — granted for the occasion, on approval",
      "hla26.acc.mat": "{n} days, set by statute",
      "hla26.acc.pat": "{n} days per confinement, twice in service",
      "hla26.acc.study": "Up to {n} days a year against an approved course",
      "hla26.acc.sab": "Up to {n} days once in seven years of service",
      "hla26.acc.brv": "{n} days per bereavement, not accrued",
      "hla26.acc.mrg": "{n} days once in service",
      "hla26.acc.lop": "Not accrued — what a day becomes when nothing is left",

      "hla26.stat.word": "Set by statute",
      "hla26.stat.note": "Read from statutory configuration {v}, in force from {from} ({src}). Not a campus value, and not editable here.",
      "hla26.stat.src": "Maternity Benefit Act, 1961, as amended",

      "hla26.edit.title": "Edit {type}",
      "hla26.edit.sub": "A type people hold balances against is not overwritten. You are writing a new dated version.",
      "hla26.edit.rate": "Days a year",
      "hla26.edit.rateHint": "Leave blank if it is granted per occasion.",
      "hla26.edit.cap": "Carries forward, up to",
      "hla26.edit.capHint": "Zero means it does not carry.",
      "hla26.edit.max": "Most in a row",
      "hla26.edit.maxHint": "Blank for no limit.",
      "hla26.edit.half": "Half days allowed",
      "hla26.edit.vac": "Applies to teaching staff",
      "hla26.edit.eff": "In force from",
      "hla26.edit.effHint": "Before this date the old version applies, exactly as it did.",
      "hla26.edit.consequence": "From {eff} this is the version {n} staff are read against. The one it replaces stays readable, and both carry your name.",
      "hla26.edit.confirm": "Save as a new version",
      "hla27.led.openReq": "Open it",
      "hla26.menu.aria": "Actions for {type}",
      "hla26.menu.edit": "Edit this type",
      "hla26.menu.editStat": "Edit this type",
      "hla26.menu.editStatWhy": "Statutory entitlement — changed centrally, not per campus",
      "hla26.menu.blackout": "Set which windows block it",
      "hla26.add": "Add a leave type",
      "hla26.add.title": "Add a leave type",
      "hla26.add.code": "Code",
      "hla26.add.name": "Name",
      "hla26.add.rate": "Days",
      "hla26.add.freq": "Frequency",
      "hla26.add.freq.year": "Credited once a year",
      "hla26.add.freq.month": "For each completed month",
      "hla26.add.freq.event": "Per occasion, not accrued",
      "hla26.add.cap": "Carry-forward cap, in days",
      "hla26.add.encash": "Encashable",
      "hla26.add.half": "Half day allowed",
      "hla26.add.vac": "Applies to teaching staff — no default, choose one",
      "hla26.add.vacMissing": "Choose whether this type applies to teaching staff. This is the education-differentiating switch and it has no safe default.",
      "hla26.add.codeDup": "That code is already used in this policy. A code appears once.",
      "hla26.add.codeMissing": "A code is required.",
      "hla26.add.submit": "Add to the draft",
      "hla26.add.onlyDraft": "Types are added to a draft. Adding one to a policy that is in force would change what people may take today without anyone approving it.",
      "hla26.add.done": "{code} has been added to the 2027-28 draft. Nothing is in force until the draft is activated.",

      "hla26.bo.title": "Windows where leave cannot be taken",
      "hla26.bo.sub": "From the campus academic calendar. These are Terms, not a second calendar kept here.",
      "hla26.bo.col.window": "Window",
      "hla26.bo.col.dates": "Dates",
      "hla26.bo.col.blocks": "Blocks",
      "hla26.bo.blocksAllBut": "Every type except {list}",
      "hla26.bo.note": "On-duty and maternity are never blocked: one is the school's own work, the other is a statutory entitlement.",
      "hla26.bo.upcoming": "Starts in {n} days",
      "hla26.bo.source": "Terms come from the academic year (M7). Change the dates there, not here.",
      "hla26.bo.applied": "{name} now blocks {n} of {total} types. Recorded against {by}.",

      "hla26.prev.title": "Before you change anything, see it on two people",
      "hla26.prev.sub": "The same policy, read for one teacher and one administrator. If the vacation-staff switch is wrong, it shows up here first.",
      "hla26.prev.open": "Preview the effect",
      "hla26.prev.hide": "Hide the preview",
      "hla26.prev.teacher": "Teaching staff",
      "hla26.prev.admin": "Non-teaching staff",
      "hla26.prev.col.type": "Type",
      "hla26.prev.col.year": "In a full year",
      "hla26.prev.na": "Does not apply",
      "hla26.prev.note": "A preview reads the policy. It does not write a balance.",
      "hla26.prev.eventOnly": "On approval",

      /* ============================================================
         HR-27 · LEAVE BALANCES REGISTER
         ============================================================ */
      "hla27.pick.type": "Leave type",
      "hla27.pick.dept": "Department",
      "hla27.dept.all": "Every department",
      "hla27.search": "Find a member of staff",
      "hla27.search.empty.head": "Nobody matches “{q}”",
      "hla27.search.empty.body": "Try a staff code, or clear the search to see the whole register.",

      "hla27.reg.title": "{type} · {n} staff",
      "hla27.reg.sub": "{shown} shown of {total} on campus. Balances are per academic year, per type.",
      "hla27.col.staff": "Staff",
      "hla27.col.kind": "Staff kind",
      "hla27.col.opening": "Opening",
      "hla27.col.accrued": "Accrued",
      "hla27.col.taken": "Taken",
      "hla27.col.balance": "Balance",
      "hla27.col.held": "Held",
      "hla27.totals": "All {n} staff shown",
      "hla27.kind.vac": "Teaching",
      "hla27.kind.nonvac": "Non-teaching",
      "hla27.held.note": "Held = days inside a request that is still pending. They are not spent yet, and they are not counted in the balance.",
      "hla27.identity": "Opening + accrued − taken = balance. Every row on this register satisfies it, and so does the total.",

      "hla27.el.absent.head": "{n} teaching staff are not on this list",
      "hla27.el.absent.body": "Earned leave does not accrue to teaching staff, so they hold no ledger at all. A zero would read as spent, and there is nothing to spend.",
      "hla27.el.absent.link": "See the rule in the policy",

      "hla27.short.word": "Short",
      "hla27.short.line": "{name} has {bal} left and a pending request for {req}. {n} of those days have no balance behind them.",
      "hla27.short.cost": "{n} unpaid days, if it is approved as it stands",

      "hla27.menu.aria": "Actions for {name}",
      "hla27.menu.ledger": "Open this person's ledger",
      "hla27.menu.adjust": "Adjust this balance",

      "hla27.init": "Initialise balances for the year",
      "hla27.init.done": "Already initialised for 2026-27 on 1 April 2026 by Meera Iyer, for {n} staff.",
      "hla27.exportTitle": "Export the register",
      "hla27.export.note": "Name, staff code, type and the four ledger columns. No salary, no bank details, no identifiers. Recorded against your name.",
      "hla27.export.done": "Register exported. Recorded against {by} at {time}.",

      "hla27.led.title": "{name}",
      "hla27.led.meta": "{desig} · {dept} · {code}",
      "hla27.led.kindVac": "Teaching staff — no earned leave accrues",
      "hla27.led.kindNon": "Non-teaching staff — earned leave accrues",
      "hla27.led.balances": "Balances for 2026-27",
      "hla27.led.none": "Does not apply to this member of staff",
      "hla27.led.lop": "If a balance runs out, each further day is loss of pay — {money} a day at today's gross.",
      "hla27.led.requests": "Requests this year",
      "hla27.led.noRequests": "No leave applied for this year.",
      "hla27.led.adjustments": "Adjustments",
      "hla27.led.noAdjustments": "No adjustment has ever been made to this ledger.",
      "hla27.led.adjIn": "Adjustments are already counted in the four columns above.",

      "hla27.adj.title": "Adjust {type} for {name}",
      "hla27.adj.dir": "Direction",
      "hla27.adj.credit": "Credit — add days",
      "hla27.adj.debit": "Debit — take days away",
      "hla27.adj.amount": "Days",
      "hla27.adj.amountBad": "Enter a number of days greater than zero.",
      "hla27.adj.eff": "Effective from",
      "hla27.adj.now": "Balance now",
      "hla27.adj.after": "Balance after",
      "hla27.adj.negWarn": "This takes the balance below zero. A negative balance becomes loss of pay at the next run, so say plainly why it is right.",
      "hla27.adj.money": "Every day you add can be encashed or spent instead of losing pay. A money-adjacent act, recorded as one.",
      "hla27.adj.submit": "Record the adjustment",
      "hla27.adj.done": "{dir} {n} days of {type} for {name}. Appended to the ledger against {by}, effective {eff}.",
      "hla27.adj.append": "Recorded as a new line. The previous balance is still on the ledger — nothing was overwritten.",

      "hla27.bulk.n": "{n} selected",
      "hla27.bulk.clear": "Clear the selection",
      "hla27.bulk.grant": "Credit them all",
      "hla27.bulk.title": "Credit {n} staff",
      "hla27.bulk.who": "Who this applies to",
      "hla27.bulk.perRow": "Each person is a separate line on their own ledger. If one fails, the others still stand.",
      "hla27.bulk.done": "{n} days of {type} credited to {c} staff, against {by}.",
      "hla27.bulk.selectAria": "Select {name}",

      "hla27.empty.head": "No balances for this type yet",
      "hla27.empty.body": "Nobody on this campus holds a ledger for this leave type in 2026-27.",

      /* ============================================================
         HR-28 · LEAVE REQUESTS CONSOLE
         ============================================================ */
      "hla28.notMine": "Approving is not yours",
      "hla28b.notMineD": "Leave is decided by the head of department, then the principal from three days, then the director past fifteen. HR is on none of those rungs.",
      "hla28b.sitting.title": "Where the requests are sitting",
      "hla28b.sitting.sub": "Tap a row to filter the register",
      "hla28b.sitting.deptHead": "With a head of department",
      "hla28b.sitting.principal": "With the principal",
      "hla28b.sitting.director": "With the director",
      "hla28b.sitting.settled": "Settled",
      "hla28b.f.stage": "Sitting with",
      "hla28b.f.stageAll": "Anyone",
      "hla28b.stuck.body": "The oldest has waited {d} days against a service level of {sla}. You cannot move it, but the principal sees the same list.",
      "hla28b.applied": "Applied {date} · {desig} · {dept}",
      "hla28b.unpaid": "{n} days will be unpaid",
      "hla28b.month": "Lands in the {mon} run",
      "hla28b.pickBody": "Open a row to read the reason, the chain and the final word — all of it read-only.",
      "hla28b.hrPart": "HR's part is the record and what it costs the month. The decision belongs to the chain above.",

      "hla28.notMineD": "Leave is decided by whoever holds the approval. You administer the queue: apply for somebody, move an approval that is stuck, and cancel.",

      "hla28.stuck.title": "{n} approvals have passed the service level",
      "hla28.stuck.body": "The oldest has waited {d} days against a service level of {sla}, set in the 2026-27 policy. A teacher planning her month is waiting.",
      "hla28.stuck.cta": "Move the oldest one on",
      "hla28.stuck.filter": "Show only these",
      "hla28.stuck.none": "Nothing has passed the service level.",

      "hla28.f.status": "Status",
      "hla28.f.status.all": "Every status",
      "hla28.f.dept": "Department",
      "hla28.f.dept.all": "Every department",
      "hla28.f.type": "Type",
      "hla28.f.type.all": "Every type",
      "hla28.f.range": "Dates",
      "hla28.f.range.all": "The whole year",
      "hla28.f.range.month": "This month",
      "hla28.f.range.future": "From today onwards",
      "hla28.f.stuck": "Stuck only",

      "hla28c.back.ledger": "Back to {name}’s leave balance",
      "hla28c.view.queue": "The queue",
      "hla28c.view.away": "Who is away",
      "hla28c.band.title": "What is in the queue",
      "hla28c.band.sub": "Where each request is sitting is a filter below.",
      "hla28c.s.settled": "Settled",
      "hla28c.m.open": "Waiting on somebody",
      "hla28c.m.openNote": "Nobody has decided yet",
      "hla28c.m.stuckNote": "Waiting more than {n} working days",
      "hla28c.m.oldest": "Oldest",
      "hla28c.m.oldestNote": "Working days on the oldest one",
      "hla28c.m.days": "Days asked for",
      "hla28c.m.daysNote": "In the requests still open",
      "hla28c.f.headNote": "with a head of department",
      "hla28c.f.principalNote": "climbed past three days",
      "hla28c.f.directorNote": "climbed past fifteen",
      "hla28c.f.stuck": "Past the service level",
      "hla28c.f.stuckNote": "waiting longer than {n} working days",
      "hla28c.notMine": "Leave is decided by the head of department, then the principal, then the director. HR is on none of those rungs.",
      "hla28c.filters.show": "Filter the queue",
      "hla28c.filters.hide": "Hide the filters",
      "hla28c.filters.on": "{n} filters on",
      "hla28c.filters.clear": "Clear them",
      "hla28c.menu.aria": "Actions for {id}",
      "hla28c.hrTrail": "What HR has done to this",
      "hla28c.trail.nudged": "Reminder sent by {by}, today",
      "hla28c.trail.moved": "Approval moved to {who} by {by}, today",
      "hla28c.trail.note": "Note by {by}:",
      "hla28c.noDecide": "HR does not decide leave. This screen is the record of who did, and of what the office did to keep it moving.",

      "hla28c.act.open": "Open the request",
      "hla28c.act.nudge": "Remind the approver",
      "hla28c.act.nudgedAlready": "Already reminded today.",
      "hla28c.act.decidedAlready": "This one has been decided.",
      "hla28c.act.move": "Move the approval",
      "hla28c.act.note": "Add a note",
      "hla28c.act.cancel": "Cancel on her behalf",
      "hla28c.act.cancelDecided": "It has been decided — a decided request is withdrawn by the person who decided it.",
      "hla28c.act.cancelStarted": "The leave has already started.",
      "hla28c.act.behalf": "Apply on behalf",

      "hla28c.p.person": "Employee",
      "hla28c.p.sittingWith": "Sitting with",
      "hla28c.p.waiting": "Waiting",
      "hla28c.p.waitingD": "{n} working days, against a service level of {sla}",
      "hla28c.p.dates": "Dates",

      "hla28c.nudge.title": "Remind the approver",
      "hla28c.nudge.sub": "{id} has been waiting {n} working days.",
      "hla28c.nudge.line": "A line with it, if it helps",
      "hla28c.nudge.lineHint": "Optional. It is shown with the request on their screen.",
      "hla28c.nudge.linePh": "Her cover is arranged — this only needs your yes.",
      "hla28c.nudge.note": "One reminder a day, to this person only. It is recorded on the request so nobody is reminded twice by two people.",
      "hla28c.nudge.confirm": "Send the reminder",
      "hla28c.nudge.done": "Reminder sent to {who} about {id}.",

      "hla28c.move.title": "Move the approval",
      "hla28c.move.sub": "{id} — send the decision to somebody else who holds it.",
      "hla28c.move.to": "Move it to",
      "hla28c.move.toPh": "Choose an approver",
      "hla28c.move.errTo": "Choose who decides it instead.",
      "hla28c.move.why": "Why it is moving",
      "hla28c.move.whyHint": "It goes on the request's chain, where the employee can read it.",
      "hla28c.move.whyPh": "Anjali Deshpande is on leave until the 20th; the principal is covering her department.",
      "hla28c.move.errWhy": "Say why in a line — a decision that changes hands with no reason is unreadable later.",
      "hla28c.move.note": "Only people who hold leave approval at this campus are listed. HR is not among them, and moving an approval never decides it.",
      "hla28c.move.confirm": "Move it",
      "hla28c.move.done": "{id} now sits with {who}.",

      "hla28c.note.title": "Add a note",
      "hla28c.note.sub": "{id} — HR's own annotation on the record.",
      "hla28c.note.label": "The note",
      "hla28c.note.hint": "For the thing that was settled on the phone and would otherwise be lost.",
      "hla28c.note.ph": "She rang to say the dates may shift by a day; her head knows.",
      "hla28c.note.err": "A note needs a line of substance.",
      "hla28c.note.note": "Attributed to you, dated, and visible to whoever opens the request — including the employee.",
      "hla28c.note.confirm": "Save the note",
      "hla28c.note.done": "Note saved on {id}.",

      "hla28c.cancel.title": "Cancel on her behalf",
      "hla28c.cancel.sub": "{id} — {who} asked the office to withdraw it.",
      "hla28c.cancel.why": "What she said",
      "hla28c.cancel.whyHint": "In her words as far as you have them. It is the only record that this was her decision, not yours.",
      "hla28c.cancel.whyPh": "Rang the office this morning — the wedding is postponed.",
      "hla28c.cancel.err": "Say what she told you. Cancelling somebody else's leave with no account of it is the one thing this screen must not allow.",
      "hla28c.cancel.note": "The request closes as cancelled and the days go back on her balance. Nothing is deleted.",
      "hla28c.cancel.confirm": "Cancel the request",
      "hla28c.cancel.done": "{id} is cancelled. {who} has been told, and her balance is restored.",

      "hla28c.behalf.title": "Apply on somebody's behalf",
      "hla28c.behalf.sub": "For staff who do not use the app — the driver, the mess, whoever walked into the office and told you.",
      "hla28c.behalf.who": "Who it is for",
      "hla28c.behalf.whoHint": "Their balance and their approver are used, not yours.",
      "hla28c.behalf.whoPh": "Choose the employee",
      "hla28c.behalf.errWho": "Choose whose leave this is.",
      "hla28c.behalf.type": "Type",
      "hla28c.behalf.typePh": "Choose",
      "hla28c.behalf.errType": "Choose the leave type.",
      "hla28c.behalf.from": "From",
      "hla28c.behalf.to": "To",
      "hla28c.behalf.errDates": "Both dates, please.",
      "hla28c.behalf.errOrder": "The last day cannot be before the first.",
      "hla28c.behalf.days": "{n} days, counted inclusive of both dates.",
      "hla28c.behalf.why": "What they told you",
      "hla28c.behalf.whyHint": "In their words. It is on the request their head reads.",
      "hla28c.behalf.whyPh": "Brother's wedding in Mysuru; told the office in person this morning.",
      "hla28c.behalf.errWhy": "A line, in their words.",
      "hla28c.behalf.note": "It goes to their own approver exactly as if they had applied themselves, and the record says it was entered by you.",
      "hla28c.behalf.confirm": "Send it to their approver",
      "hla28c.behalf.done": "Applied on behalf of {who}. It is with their approver now.",
      "hla28.reg.title": "Requests",
      "hla28.reg.sub": "{shown} of {total}. Oldest waiting first.",
      "hla28.col.id": "Request",
      "hla28.col.who": "Who",
      "hla28.col.type": "Type",
      "hla28.col.dates": "Dates",
      "hla28.col.days": "Days",
      "hla28.col.status": "Status",
      "hla28.age.days": "{n} d",
      "hla28.age.today": "Today",
      "hla28.st.pending": "Pending",
      "hla28.st.approved": "Approved",
      "hla28.st.rejected": "Rejected",
      "hla28.st.cancelled": "Cancelled",
      "hla28.flag.stuck": "Past service level",
      "hla28.flag.blackout": "Blocked window",
      "hla28.flag.locked": "Closed month",
      "hla28.flag.retro": "Days already gone",
      "hla28.flag.vacant": "No approver in post",
      "hla28.flag.short": "Balance is short",

      "hla28.empty.head": "Nothing matches these filters",
      "hla28.empty.body": "Clear a filter to bring the queue back.",
      "hla28.clean.body": "Every request on this campus has been decided.",

      "hla28.menu.aria": "Actions for request {id}",
      "hla28.menu.open": "Open this request",
      "hla28.menu.reassign": "Move the approval to somebody else",
      "hla28.menu.reassignNo": "Only a request that is still pending can be moved",
      "hla28.menu.cancel": "Cancel this request",
      "hla28.menu.cancelNo": "The leave has already started — it is cancelled by correcting attendance, not here",
      "hla28.menu.cancelLocked": "These days are inside {run}, approved and disbursed",

      "hla28.det.title": "Request {id}",
      "hla28.det.who": "{name} · {desig} · {dept}",
      "hla28.det.appliedBy": "Applied {date} by {by}, on her behalf",
      "hla28.det.with": "Waiting on {name} for {n} days",
      "hla28.det.decided": "{status} by {name} on {date}",
      "hla28.det.reason": "What they said",
      "hla28.det.reasonNote": "The reason is only ever read inside an open request. It is not a column, and it never reaches a roster or a board.",
      "hla28.det.balance": "Balance behind it",
      "hla28.det.balLine": "{bal} of {type} left, {req} days asked for.",
      "hla28.det.covered": "Fully covered by the balance. No loss of pay.",
      "hla28.det.shortLine": "{n} days have no balance behind them.",
      "hla28.det.lop": "{n} unpaid days at {rate} a day",
      "hla28.det.chain": "Who has to decide",
      "hla28.det.cover": "Cover arranged: {name}, {dates}",
      "hla28.det.coverNone": "No cover arranged yet. The head of department decides whether that matters.",

      "hla28.re.title": "Move this approval",
      "hla28.re.body": "The request keeps its history. It simply waits on somebody else from now on, and both the old and the new approver are told.",
      "hla28.re.to": "Move it to",
      "hla28.re.toMissing": "Choose who should decide it.",
      "hla28.re.only": "Only people who hold the leave approval for this campus appear here.",
      "hla28.re.submit": "Move the approval",
      "hla28.re.done": "{id} now waits on {name}. Recorded against {by}.",

      "hla28.can.title": "Cancel {id}",
      "hla28.can.body": "{n} days go back to the {type} balance and the attendance written for those dates clears. {name} and {approver} are told.",
      "hla28.can.submit": "Cancel the request",
      "hla28.can.done": "{id} is cancelled. {n} days returned to {name}'s {type} balance, against {by}.",

      "hla28.beh.cta": "Apply on somebody's behalf",
      "hla28.beh.title": "Apply on somebody's behalf",
      "hla28.beh.why": "Only for staff who cannot apply themselves. The request is created in their name and marked as raised by you.",
      "hla28.beh.who": "Who it is for",
      "hla28.beh.whoMissing": "Choose who this is for.",
      "hla28.beh.whoNone": "Everybody on this campus can apply for themselves at the moment.",
      "hla28.beh.reasonOwn": "Why you are applying for them — required",
      "hla28.beh.type": "Leave type",
      "hla28.beh.from": "From",
      "hla28.beh.to": "To",
      "hla28.beh.theirReason": "What they told you",
      "hla28.beh.chain": "It still goes to {name} to decide. Applying on somebody's behalf is not approving for them.",
      "hla28.beh.submit": "Create the request",
      "hla28.beh.done": "{id} created for {name} and sent to {approver}. Recorded as raised by {by}.",
      "hla28.beh.noLogin": "No sign-in yet — joined {date}",
      "hla28.beh.away": "Already away",

      "hla28.cal.title": "Who is away, day by day",
      "hla28.cal.sub": "The next fortnight on this campus. Absence only — a leave type is a health matter and it does not belong on a shared view.",
      "hla28.cal.none": "Nobody",
      "hla28.cal.n": "{n} away",
      "hla28.cal.holiday": "Holiday",
      "hla28.cal.off": "Weekly off",
      "hla28.cal.holName": "Independence Day",
      "hla28.cal.pick": "{date}",
      "hla28.cal.emptyDay": "Everybody is expected in on {date}.",
      "hla28.cal.why": "Only on-leave appears here, whatever the type. The type is on the request itself, where somebody has to act on it.",

      /* ============================================================
         HR-29 · SHIFTS AND ROSTERS
         ============================================================ */
      "hla29.unassigned.title": "{n} staff are on no shift",
      "hla29.unassigned.cta": "Put them on a shift",
      "hla29.unassigned.none": "Everybody on campus is on a shift.",

      "hla29c.f.shifts": "Shifts",
      "hla29c.f.assigned": "Staff on a shift",
      "hla29c.f.assignedNote": "of {n} on the campus",
      "hla29c.f.unassigned": "On no shift",
      "hla29c.f.unassignedNone": "Everybody is on one",
      "hla29c.who": "Who is on it ({n} of {total} named here)",
      "hla29c.whoAria": "Everybody on this shift",
      "hla29c.who.col.name": "Name",
      "hla29c.who.col.dept": "Department",
      "hla29c.whoRest": "{n} more are on it across the other campus and are not named here.",
      "hla29c.cta.assign": "Assign staff to this shift",
      "hla29c.cta.timings": "Change the timings",
      "hla29.as.pick": "Add somebody",
      "hla29.as.pickHint": "One at a time. Only people who are not already on this shift are listed.",
      "hla29.as.pickNone": "Choose a person…",
      "hla29.as.chosen": "Moving to this shift ({n})",
      "hla29.as.remove": "Take off",
      "hla29.as.noneYet": "Nobody chosen yet.",
      "hla29c.new.sub": "A shift is a start, an end and a grace period. Everything else follows from those three.",
      "hla29.col.actions": "Actions",
      "hla29.row.offGrace": "{off} · {n} min grace",
      "hla29.list.title": "Shifts",
      "hla29.f.kind": "Kind of shift",
      "hla29.f.kind.all": "Every kind",
      "hla29.f.when": "When",
      "hla29.f.when.month": "This month",
      "hla29.f.when.quarter": "The last three months",
      "hla29.f.when.all": "Everything on record",
      "hla29.tr.title": "What has changed",
      "hla29.tr.sub": "{shown} of {total}, newest first. A shift is effective-dated, so this is the record of what moved and when.",
      "hla29.tr.col.when": "When",
      "hla29.tr.col.shift": "Shift",
      "hla29.tr.col.what": "What changed",
      "hla29.tr.col.who": "Who did it",
      "hla29.tr.none": "Nothing changed in this window.",
      "hla29.tr.e.created": "Created, with nobody on it",
      "hla29.tr.e.assigned": "{n} staff put on it, from {date}",
      "hla29.tr.e.moved": "{n} staff moved off it",
      "hla29.tr.e.timings": "Timings changed to {a} - {b}",
      "hla29.tr.e.grace": "Grace changed to {n} minutes",
      "hla29.tr.e.off": "Weekly off changed",
      "hla29c.f.changed": "Changed this month",
      "hla29c.f.changedNote": "last on {date}",
      "hla29c.f.changedNone": "Nothing has changed",
      "hla29c.cta.deact": "Take the shift out of use",

      "hla29.list.sub": "{n} shifts · {a} staff assigned · {u} unassigned",
      "hla29.col.shift": "Shift",
      "hla29.col.hours": "Hours",
      "hla29.col.kind": "Kind",
      "hla29.col.grace": "Grace",
      "hla29.col.off": "Weekly off",
      "hla29.col.staff": "Staff",
      "hla29.kind.fixed": "Fixed",
      "hla29.kind.flexi": "Flexi",
      "hla29.kind.rotating": "Rotating",
      "hla29.grace.n": "{n} min",
      "hla29.off.rot": "By rotation",
      "hla29.sh.morning": "Morning — teaching",
      "hla29.sh.general": "General — administration",
      "hla29.sh.transport": "Transport split",
      "hla29.sh.security": "Security night",
      "hla29.sh.flexi": "Hostel and mess",
      "hla29.sh.morningD": "The school day. Most of the teaching staff sit here.",
      "hla29.sh.generalD": "Office hours for administration and accounts.",
      "hla29.sh.transportD": "Two runs a day, on a six-day rotation.",
      "hla29.sh.securityD": "Overnight, on a four-day rotation.",
      "hla29.sh.flexiD": "A window rather than a start time — hours are counted, not the arrival.",
      "hla29.split": "{a} and {b}",
      "hla29.window": "Within {a} to {b}",

      "hla29.menu.deact": "Deactivate this shift",

      "hla29.new": "Create a shift",
      "hla29.new.title": "Create a shift",
      "hla29.new.name": "Name",
      "hla29.new.nameMissing": "A shift needs a name people will recognise on a roster.",
      "hla29.new.start": "Starts",
      "hla29.new.end": "Ends",
      "hla29.new.kind": "Kind",
      "hla29.new.grace": "Grace, in minutes",
      "hla29.new.graceNote": "Ten minutes is this campus's working default. It is a configured value, not a rule — set it to what the gate actually allows.",
      "hla29.new.off": "Weekly off",
      "hla29.new.off.sun": "Sunday",
      "hla29.new.off.satsun": "Saturday and Sunday",
      "hla29.new.off.rot": "By rotation",
      "hla29.new.overlap": "{name} already runs {a} to {b}. Two shifts with the same hours make a roster ambiguous — keep it only if the difference is real.",
      "hla29.new.submit": "Create the shift",
      "hla29.new.done": "{name} created. Nobody is on it yet, so it can still be changed freely.",

      "hla29.as.title": "Assign staff to {shift}",
      "hla29.as.who": "Who",
      "hla29.as.whoMissing": "Choose at least one person.",
      "hla29.as.byDept": "Whole department",
      "hla29.as.byPerson": "Named people",
      "hla29.as.eff": "Effective from",
      "hla29.as.effDefault": "Tomorrow, {date} — reconciliation uses the new shift from that date onwards.",
      "hla29.as.retro": "This is a date in the past",
      "hla29.as.retroBody": "Reconciliation runs again over days that already have a status. Somebody on time may become late, and the reverse. Say why that is right.",
      "hla29.as.retroLocked": "You cannot reach back before 1 August. {lock}",
      "hla29.as.submit": "Assign",
      "hla29.as.done": "{n} staff move to {shift} from {date}, against {by}.",

      "hla29.ed.title": "Change the timings of {shift}",
      "hla29.ed.body": "Timings are effective-dated. The old timings stay on every day that has already been reconciled against them.",
      "hla29.ed.eff": "New timings effective from",
      "hla29.ed.blocked": "Blocked — that date is in a closed month",
      "hla29.ed.blockedBody": "{lock} Changing a shift's hours back into it would move paid days after they were paid. Pick a date on or after 1 August.",
      "hla29.ed.second": "This changes how a paid month is measured, so it is recorded for a second pair of eyes before it takes effect.",
      "hla29.ed.submit": "Supersede the timings",
      "hla29.ed.done": "{shift} runs {a} to {b} from {date}. Recorded against {by}, for a second pair of eyes.",

      "hla29.ro.onleave": "On leave",

      "hla29.deact.title": "Deactivate {shift}",
      "hla29.deact.body": "It disappears from the assignment list. Nothing that already happened on it changes.",
      "hla29.deact.done": "{shift} is no longer offered for assignment.",

      /* ============================================================
         HR-30 · ATTENDANCE EXCEPTIONS
         ============================================================ */
      "hla30.feeds": "Paid days are made of these. An exception left here changes what somebody is paid on the run.",
      "hla30.feeds.route": "Open paid days",

      "hla30.outage.title": "A reader was down for seven hours",
      "hla30.outage.body": "{device} logged nothing between {from} and {to} on {date}. {n} people have no punch through no fault of their own.",
      "hla30.outage.ref": "Ingestion incident {id}",
      "hla30.outage.cta": "Review the {n} records together",
      "hla30.outage.device": "Main gate reader, Indiranagar",
      "hla30.outage.title2": "Resolve the outage of {date}",
      "hla30.outage.what": "What to write",
      "hla30.outage.opt.present": "Mark them present",
      "hla30.outage.opt.rostered": "Mark them as rostered — the shift they were on",
      "hla30.outage.list": "Who this would cover",
      "hla30.outage.excludeAria": "Leave {name} out of this correction",
      "hla30.outage.warnHead": "{n} of these people were genuinely not in",
      "hla30.outage.warnBody": "They are pre-excluded. Marking them present would pay for a day not worked, and take a second correction to undo.",
      "hla30.outage.ex.leave": "Already on approved leave that day",
      "hla30.outage.ex.absent": "Recorded absent at the front office that morning",
      "hla30.outage.count": "{n} of {total} will be corrected. {x} left out.",
      "hla30.outage.submit": "Correct {n} records",
      "hla30.outage.done": "{n} records corrected against {by}, each one audited and each one referencing {id}. {x} left as they were.",
      "hla30.outage.eachRow": "Each person gets their own audited line. This is not one entry covering everybody.",

      "hla30.f.type": "Exception",
      "hla30.f.type.all": "Every kind",
      "hla30.f.dept": "Department",
      "hla30.f.dept.all": "Every department",
      "hla30.f.range": "When",
      "hla30.f.range.aug": "This month",
      "hla30.f.range.week": "The last three months",
      "hla30.f.range.all": "Everything on record",

      "hla30.reg.title": "Days to fix",
      "hla30.f2.open": "Still open",
      "hla30.f2.openNote": "oldest {name}, {date} ({n} days)",
      "hla30.f2.held": "On hold",
      "hla30.f2.heldNote": "the first comes back {date}",
      "hla30.f2.heldNone": "Nothing is on hold",
      "hla30.f2.openNone": "Every day is accounted for",
      "hla30.f2.fixed": "Put right",
      "hla30.f2.fixedNote": "corrected by {by}",
      "hla30.f2.fixedNone": "None corrected yet",
      "hla30.f2.none": "Nothing to fix",
      "hla30.f2.noneNote": "already on leave or absent",
      "hla30.f2.noneNone": "None pre-explained",
      "hla30.f2.locked": "Locked",
      "hla30.f2.lockedNote": "inside run {run}",
      "hla30.f2.lockedNone": "Nothing is locked",
      "hla30.f2.foot": "Left as they are, {n} paid days go unpaid in run {run}.",
      "hla30.f2.footClear": "Nothing open here changes what anybody is paid.",
      "hla30.f.state": "Where it stands",
      "hla30.f.state.all": "Any state",
      "hla30.st.settled": "Nothing to fix",
      "hla30.st.held": "On hold",
      "hla30.st.heldUntil": "back on {date}",

      "hla30.hold.cta": "Put it on hold",
      "hla30.hold.word": "On hold",
      "hla30.hold.title": "Put {name}\u2019s {date} on hold",
      "hla30.hold.until": "Look at it again on",
      "hla30.hold.untilHint": "It comes back to the queue on this date.",
      "hla30.hold.why": "What it is waiting for",
      "hla30.hold.whyHint": "The engineer, a letter, the person \u2014 whatever has to happen first.",
      "hla30.hold.submit": "Put it on hold",
      "hla30.hold.by": "{name} put it on hold until {date}. {why}",
      "hla30.hold.undo": "Take it off hold",
      "hla30.hold.done": "{name}\u2019s day is on hold until {date}, by {by}.",
      "hla30.hold.undone": "{name}\u2019s day is back in the queue.",

      "hla30.lock.cta": "Lock it as it stands",
      "hla30.lock.word": "Locked by hand",
      "hla30.lock.title": "Lock {name}\u2019s {date} as it stands",
      "hla30.lock.now": "What the run will take",
      "hla30.lock.costs": "{name} is paid for {a} of {b} days in August if this stands.",
      "hla30.lock.costsNone": "Nothing about this day changes anybody\u2019s pay.",
      "hla30.lock.why": "Why it is right as it stands",
      "hla30.lock.whyHint": "Your name stays on this for as long as the record exists.",
      "hla30.lock.submit": "Lock it",
      "hla30.lock.by": "{name} locked it on {date}. {why}",
      "hla30.lock.undo": "Unlock it",
      "hla30.lock.done": "{name}\u2019s {date} is locked as {becomes}, by {by}.",
      "hla30.lock.undone": "{name}\u2019s day is unlocked and back in the queue.",
      "hla30.settled.why": "Another record already explains this day, so there is nothing to put right.",
      "hla30.outage.allCta": "Put the whole outage right",
      "hla30.reg.sub": "{shown} of {total}. Oldest first — the ones nearest the run matter most.",
      "hla30.col.date": "Date",
      "hla30.col.who": "Who",
      "hla30.col.kind": "What happened",
      "hla30.col.becomes": "Becomes if left",
      "hla30.col.cost": "Costs",
      "hla30.col.state": "State",
      "hla30.k.missing": "No punch at all",
      "hla30.k.single": "One punch only",
      "hla30.k.short": "Hours short of the shift",
      "hla30.k.shortD": "In at {a}, out at {b} — {got} hours of a {need}-hour day.",
      "hla30.k.noleave": "Away, no leave applied",
      "hla30.k.noleaveD": "No punch at all, and no leave request in the portal. {name}’s head told the office on the day; nothing was ever entered.",
      "hla30.k.noleave.told": "The head of department confirmed it in writing.",
      "hla30.k.singleInD": "Out at {time}, and the morning punch never arrived.",
      "hla30.k.singleOutD": "In at {time}, and no closing punch was ever recorded.",
      "hla30.k.geo": "Punched outside the gate",
      "hla30.k.device": "Reader was down",
      "hla30.k.conflict": "Leave and a punch on the same day",
      "hla30.k.noshift": "On no shift",
      "hla30.k.missingD": "The reader has nothing for {name} on this day.",
      "hla30.k.singleD": "{time} only. The other half of the day was never recorded.",
      "hla30.k.geoD": "A mobile punch {km} km from the Indiranagar gate at {time}.",
      "hla30.k.deviceD": "Part of the {date} reader outage.",
      "hla30.k.conflictD": "Approved leave on the record, and a reader punch at {time}.",
      "hla30.k.noshiftD": "{n} staff are on no shift, so nothing reconciles for them at all.",
      "hla30.b.absent": "Absent",
      "hla30.b.half": "Half day",
      "hla30.b.review": "Held for review",
      "hla30.b.nothing": "Nothing at all",
      "hla30.st.open": "Open",
      "hla30.st.corrected": "Corrected · awaiting a second look",
      "hla30.st.locked": "Closed month",
      "hla30.st.grouped": "Grouped",

      "hla30.empty.head": "August reconciles cleanly",
      "hla30.empty.body": "Nothing is waiting on you for this month. The nightly job last ran at 01:10 today.",
      "hla30.filter.empty.head": "Nothing matches these filters",
      "hla30.filter.empty.body": "Clear a filter to bring the list back.",

      "hla30.menu.correct": "Correct this record",
      "hla30.menu.open": "Open the day",

      "hla30.cor.title": "Correct {name}, {date}",
      "hla30.cor.now": "On the record now",
      "hla30.cor.new": "Change it to",
      "hla30.cor.status": "Status",
      "hla30.cor.in": "First in",
      "hla30.cor.out": "Last out",
      "hla30.cor.s.present": "Present",
      "hla30.cor.s.half": "Half day",
      "hla30.cor.s.absent": "Absent",
      "hla30.cor.s.leave": "On leave",
      "hla30.cor.s.off": "Weekly off",
      "hla30.cor.s.holiday": "Holiday",
      "hla30.cor.effect": "What this changes",
      "hla30.cor.effectPaid": "Paid days for {name} go from {a} to {b} for August.",
      "hla30.cor.effectMoney": "Worth {money} to her at today's gross.",
      "hla30.cor.effectNone": "Paid days do not move. This only makes the record true.",
      "hla30.cor.snapshot": "August's snapshot was taken on 8 August and bound to {run}. Your correction reaches pay when payroll retakes it.",
      "hla30.cor.submit": "Record the correction",
      "hla30.cor.done": "{date} for {name} is now {status}. Recorded against {by}, before and after both kept, waiting on a second look.",
      "hla30.cor.beforeAfter": "Before and after are both kept. A correction never erases what the reader said.",


      "hla30.rerun": "Run the reconciliation again",
      "hla30.rerun.title": "Run the reconciliation again",
      "hla30.rerun.body": "The nightly job runs again over the dates you choose. Safe to run twice, and it will not touch a day you corrected by hand.",
      "hla30.rerun.from": "From",
      "hla30.rerun.to": "To",
      "hla30.rerun.locked": "The range cannot reach into July. {lock}",
      "hla30.rerun.submit": "Run it",
      "hla30.rerun.queued": "Queued for {from} to {to}. It is already running for another range, so this one follows it.",
      "hla30.rerun.done": "Reconciliation queued for {from} to {to}, against {by}.",

      "hla30.exp": "Export",
      "hla30.exp.done": "Exceptions exported. Recorded against {by}.",

      /* ---------- people, departments, designations ---------- */
      "hla.p.ananya": "Ananya Rao",
      "hla.p.karan": "Karan Mehta",
      "hla.p.meeraj": "Meera Joshi",
      "hla.p.rameshi": "Ramesh Iyer",
      "hla.p.priya": "Priya Nair",
      "hla.p.divya": "Divya Kapoor",
      "hla.p.sanjay": "Sanjay Verma",
      "hla.p.vikram": "Vikram Sen",
      "hla.p.kavya": "Kavya Nair",
      "hla.p.neha": "Neha Bhatt",
      "hla.p.meenak": "Meenakshi Pillai",
      "hla.p.rohit": "Rohit Malhotra",
      "hla.p.suresh": "Suresh Kamath",
      "hla.p.manju": "Manjunath Gowda",
      "hla.p.prakash": "Prakash Bhandari",
      "hla.p.shanti": "Shanti Devi",
      "hla.p.iqbal": "Iqbal Khan",
      "hla.p.basav": "Basavaraj Naik",
      "hla.p.imtiaz": "Imtiaz Sheikh",
      "hla.p.dilip": "Dilip Rathod",
      "hla.p.anjali": "Anjali Deshpande",
      "hla.p.radhika": "Radhika Menon",
      "hla.p.lata": "Lata Prabhu",
      "hla.p.meerai": "Meera Iyer",
      "hla.p.vacant": "Transport in-charge — post vacant",

      "hla.role.hod": "Head of department",
      "hla.role.principal": "Principal",
      "hla.role.director": "Director",
      "hla.role.primary": "Head of department",
      "hla.role.hr": "HR Operator",

      "hla.d.science": "Science",
      "hla.d.maths": "Mathematics",
      "hla.d.primary": "Primary",
      "hla.d.languages": "Languages",
      "hla.d.admin": "Administration",
      "hla.d.transport": "Transport",
      "hla.d.sports": "Sports",
      "hla.d.mess": "Mess",
      "hla.d.security": "Security",

      "hla.g.pgtPhy": "PGT, Physics",
      "hla.g.pgtChem": "PGT, Chemistry",
      "hla.g.tgtBio": "TGT, Biology",
      "hla.g.tgtChem": "TGT, Chemistry",
      "hla.g.tgtMaths": "TGT, Mathematics",
      "hla.g.prt3": "PRT, Class III",
      "hla.g.prt5": "PRT, Class V",
      "hla.g.headSci": "Head of Science",
      "hla.g.guestSan": "Guest faculty, Sanskrit",
      "hla.g.accounts": "Accounts executive",
      "hla.g.driver4": "Bus driver, Route 4",
      "hla.g.driver2": "Bus driver, Route 2",
      "hla.g.driver7": "Bus driver, Route 7",
      "hla.g.driver9": "Bus driver, Route 9",
      "hla.g.coach": "Sports coach",
      "hla.g.mess": "Mess supervisor",
      "hla.g.security": "Security supervisor",

      /* ---------- request reasons (read only inside an open record) ---------- */
      "hla.r.karanRetro": "I was down with a fever on the 6th and 7th and could not open the app.",
      "hla.r.priyaTravel": "Taking my mother to Manipal for a follow-up.",
      "hla.r.sanjayHome": "Sister's wedding at home in Hubli.",
      "hla.r.meeraJuly": "Two days at home in Nashik for a family function.",
      "hla.r.meeraSept": "My father's operation is on the 16th.",
      "hla.r.manjuHome": "Village house repairs after the rain.",
      "hla.r.sureshSep": "Booked travel with the family before the school reopens.",
      "hla.r.kavyaOne": "Passport appointment in the morning.",
      "hla.r.vikramSL": "Food poisoning, on the doctor's advice.",
      "hla.r.divyaJuly": "Booked travel with family.",
      "hla.r.prakashDuty": "Inter-school athletics meet at Kanteerava — accompanying eleven students.",
      "hla.r.shantiOne": "Grandson's naming ceremony.",
      "hla.r.rameshiAug": "Two days at home in Thrissur.",
      "hla.r.basavAug": "Son's admission interview in Belgaum.",
      "hla.r.meenakAug": "Personal work.",
      "hla.r.divyaAug": "Family commitment at home.",
      "hla.r.karanHalf": "Half day for a bank appointment.",
      "hla.r.behalfDraft": "Her sign-in is not active yet, so she asked the front office to send it up.",

      /* ---------- adjustment history (append-only) ---------- */
      "hla.adj.a1": "Worked the admissions open day on 4 July. Comp-off credited on the principal's note.",
      "hla.adj.a2": "Duplicate casual-leave credit from the March data migration, reversed.",
      "hla.adj.a3": "Two Sundays on the exam ferry in May. Earned leave credited against the transport in-charge's note.",
      "hla.adj.a4": "Opening balance corrected — the 2025-26 closing was carried across one day short.",
      "hla.adj.dir.credit": "Credited",
      "hla.adj.dir.debit": "Debited",
      "hla.adj.col.when": "When",
      "hla.adj.col.what": "What",
      "hla.adj.col.why": "Why",
      "hla.adj.col.who": "Who",
    },
  });

  /* ============================================================
     CLOCK + DATE HELPERS. ISO strings are parsed as LOCAL dates —
     new Date("2026-08-11") is UTC midnight and slides a day in some
     zones. Nothing below hand-types a weekday or a month name.
     ============================================================ */
  const TODAY_ISO = "2026-08-11";
  function parseISO(s) { const p = s.split("-"); return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2])); }
  function toISO(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function addDays(iso, n) { const d = parseISO(iso); d.setDate(d.getDate() + n); return toISO(d); }
  function diffDays(a, b) { return Math.round((parseISO(b) - parseISO(a)) / 86400000); }
  const TOMORROW_ISO = addDays(TODAY_ISO, 1);

  /* "11 Aug 2026" — short month, authored, never sliced */
  function fmt(t, iso) { const d = parseISO(iso); return d.getDate() + " " + t("hla.mo." + (d.getMonth() + 1)) + " " + d.getFullYear(); }
  /* "Tue 11 Aug" */
  function fmtWd(t, iso) { const d = parseISO(iso); return t("hla.wd." + d.getDay()) + " " + d.getDate() + " " + t("hla.mo." + (d.getMonth() + 1)); }
  function fmtRange(t, from, to) { return from === to ? fmt(t, from) : t("hla.range", { from: fmt(t, from), to: fmt(t, to) }); }
  /* the same range, without repeating a year (or a month) a reader can
     already see on the other end of the dash — a table column has no
     room for saying 2026 twice */
  function fmtRangeTight(t, from, to) {
    if (from === to) return fmt(t, from);
    const a = parseISO(from), b = parseISO(to);
    if (a.getFullYear() !== b.getFullYear()) return t("hla.range", { from: fmt(t, from), to: fmt(t, to) });
    const left = a.getMonth() === b.getMonth()
      ? String(a.getDate())
      : a.getDate() + " " + t("hla.mo." + (a.getMonth() + 1));
    return t("hla.range", { from: left, to: fmt(t, to) });
  }
  function isSunday(iso) { return parseISO(iso).getDay() === 0; }

  /* ============================================================
     CONFIGURATION OBJECTS. Nothing below is typed into a sentence:
     every displayed threshold, cap, divisor and entitlement is read
     out of one of these, and each carries the version and the date
     it came into force. `STAT_CFG` is the effective-dated statutory
     configuration (CLAUDE.md guard-statutory-hardcode) — a campus
     leave policy may NOT edit it, and HR-26 says so at the point of
     the control rather than in a footnote.
     ============================================================ */
  const STAT_CFG = {
    version: "v2026.3",
    fromISO: "2026-07-01",
    srcKey: "hla26.stat.src",
    maternityDays: 182,          /* Maternity Benefit Act — read, never typed into copy */
  };

  const POLICY = {
    ay: "2026-27",
    version: "v3",
    fromISO: "2026-04-01",
    activatedByKey: "hla.p.meerai",
    activatedOnISO: "2026-03-28",
    state: "active",
    scopeKey: "hla26.pol.scopeV",
    slaWorkingDays: 3,           /* the leave-approval service level */
    lopDivisor: 30,              /* one unpaid day = monthly gross / 30 */
    clAnnual: 12,
    elPerMonth: 1.5,
    slAnnual: 10,
    elCarryCap: 30,
    slCarryCap: 10,
    compLapseDays: 60,
    patDays: 15,
    studyDays: 30,
    sabDays: 180,
    brvDays: 3,
    mrgDays: 5,
    graceDefaultMin: 10,         /* [proposed] — the field exists in M9 §6.8, no default is specified */
  };

  /* the one drafted, not-yet-in-force change (HR-26 "edit an active
     type" = supersede, never edit in place) */
  const AMENDMENT = {
    version: "v4",
    typeCode: "SL",
    oldValue: POLICY.slAnnual,
    newValue: 12,
    draftedByKey: "hla.p.meerai",
    draftedOnISO: "2026-08-07",
    effISO: "2026-09-01",
    affected: 214,
  };

  const CAMPUS_HEADCOUNT = 214;      /* HR-02's campus figure */
  const RUN_JULY = "PR-2026-07";     /* approved + disbursed -> July is locked */
  const RUN_AUG = "PR-2026-08";      /* signed by its maker, with the checker */
  const SNAPSHOT_ISO = "2026-08-08"; /* PY-08's paid-day snapshot date */
  const AUG_FIRST_ISO = "2026-08-01";

  /* ============================================================
     LEAVE TYPES — §6.7 LeaveType. `vac` is applies_to_vacation_staff:
     the education-differentiating switch, and the only field on this
     table that differs between a teacher and an administrator.
     `statutory` marks a value that is read from STAT_CFG and is not a
     campus policy value at all.
     ============================================================ */
  const TYPES = [
    { code: "EL", key: "hla26.type.el", role: "ltEL", vac: false, half: false, encash: true, cap: POLICY.elCarryCap, maxRun: 15,
      accKey: "hla26.acc.el", accVars: {}, yearly: POLICY.elPerMonth * 12 },
    { code: "CL", key: "hla26.type.cl", role: "ltCasual", vac: true, half: true, encash: false, cap: 0, maxRun: 3,
      accKey: "hla26.acc.cl", accVars: {}, yearly: POLICY.clAnnual },
    { code: "SL", key: "hla26.type.sl", role: "ltSick", vac: true, half: true, encash: false, cap: POLICY.slCarryCap, maxRun: null,
      accKey: "hla26.acc.sl", accVars: { n: POLICY.slAnnual }, yearly: POLICY.slAnnual },
    { code: "COMP", key: "hla26.type.comp", role: "ltComp", vac: true, half: true, encash: false, cap: 0, maxRun: 5,
      accKey: "hla26.acc.comp", accVars: {}, yearly: null },
    { code: "DUTY", key: "hla26.type.duty", role: "ltEL", vac: true, half: true, encash: false, cap: 0, maxRun: null,
      accKey: "hla26.acc.duty", accVars: {}, yearly: null, neverBlocked: true },
    { code: "MAT", key: "hla26.type.mat", role: "ltCasual", vac: true, half: false, encash: false, cap: 0, maxRun: STAT_CFG.maternityDays,
      accKey: "hla26.acc.mat", accVars: { n: STAT_CFG.maternityDays }, yearly: STAT_CFG.maternityDays, statutory: true, neverBlocked: true },
    { code: "PAT", key: "hla26.type.pat", role: "ltEL", vac: true, half: false, encash: false, cap: 0, maxRun: POLICY.patDays,
      accKey: "hla26.acc.pat", accVars: { n: POLICY.patDays }, yearly: POLICY.patDays },
    { code: "STUDY", key: "hla26.type.study", role: "ltEL", vac: true, half: false, encash: false, cap: 0, maxRun: POLICY.studyDays,
      accKey: "hla26.acc.study", accVars: { n: POLICY.studyDays }, yearly: POLICY.studyDays },
    { code: "SAB", key: "hla26.type.sab", role: "ltEL", vac: true, half: false, encash: false, cap: 0, maxRun: POLICY.sabDays,
      accKey: "hla26.acc.sab", accVars: { n: POLICY.sabDays }, yearly: null },
    { code: "BRV", key: "hla26.type.brv", role: "ltCasual", vac: true, half: false, encash: false, cap: 0, maxRun: POLICY.brvDays,
      accKey: "hla26.acc.brv", accVars: { n: POLICY.brvDays }, yearly: null },
    { code: "MRG", key: "hla26.type.mrg", role: "ltCasual", vac: true, half: false, encash: false, cap: 0, maxRun: POLICY.mrgDays,
      accKey: "hla26.acc.mrg", accVars: { n: POLICY.mrgDays }, yearly: null },
    { code: "LOP", key: "hla26.type.lop", role: "off", vac: true, half: true, encash: false, cap: 0, maxRun: null,
      accKey: "hla26.acc.lop", accVars: {}, yearly: null },
  ];
  function typeOf(code) { return TYPES.filter((x) => x.code === code)[0]; }

  /* the four types a balance ledger is actually kept for (§6.7
     LeaveBalance). The rest are per-occasion grants with no running
     balance, which is why HR-27's type picker is shorter than HR-26's
     type table — and why that is not an inconsistency. */
  const LEDGER_TYPES = ["CL", "SL", "COMP", "EL"];

  /* ============================================================
     M7 Terms -> blackout windows. Keys REUSED from leave.jsx, so the
     applicant's screen, the head of department's screen, the
     principal's screen and this one all name the same window. Not a
     second calendar.
     ============================================================ */
  const WINDOWS = [
    { key: "lv.win.exam1", dateKey: "lv.win.exam1d", from: "2026-09-14", to: "2026-09-19", blocks: null },
    { key: "lv.win.admis", dateKey: "lv.win.admisd", from: "2027-01-05", to: "2027-01-10", blocks: null },
    { key: "lv.win.result", dateKey: "lv.win.resultd", from: "2027-03-26", to: "2027-03-31", blocks: null },
  ];
  /* default: every type except the ones that are never blocked */
  const NEVER_BLOCKED = TYPES.filter((x) => x.neverBlocked).map((x) => x.code);
  WINDOWS.forEach((w) => { w.blocks = TYPES.filter((x) => !x.neverBlocked).map((x) => x.code); });

  const HOLIDAYS = { "2026-08-15": "hla28.cal.holName" };

  /* ============================================================
     PEOPLE. Codes, names, designations, departments and the vacation
     flag come from pages/hr.jsx's campus register; the Science
     department's grosses and balances come from pages/depthead.jsx.
     Five support staff (NAV-0061/0079/0093/0104/0112) are new here
     because no sibling file models Indiranagar's transport, mess and
     security rota — HR-29 exists precisely for them.
     `gross` is never rendered. It exists only so that one unpaid day
     can be priced at gross / POLICY.lopDivisor.
     ============================================================ */
  const STAFF = [
    { id: "ananya", campusKey: "lf.c.main", code: "NAV-0142", nameKey: "hla.p.ananya", desigKey: "hla.g.pgtPhy", deptKey: "hla.d.science", vac: true, gross: 94800, shift: "SH-01" },
    { id: "karan", campusKey: "lf.c.main", code: "NAV-0156", nameKey: "hla.p.karan", desigKey: "hla.g.pgtPhy", deptKey: "hla.d.science", vac: true, gross: 71200, shift: "SH-01" },
    { id: "meeraj", campusKey: "lf.c.main", code: "NAV-0163", nameKey: "hla.p.meeraj", desigKey: "hla.g.pgtPhy", deptKey: "hla.d.science", vac: true, gross: 71200, shift: "SH-01" },
    { id: "rameshi", campusKey: "lf.c.main", code: "NAV-0149", nameKey: "hla.p.rameshi", desigKey: "hla.g.pgtChem", deptKey: "hla.d.science", vac: true, gross: 68400, shift: "SH-01" },
    { id: "priya", campusKey: "lf.c.main", code: "NAV-0171", nameKey: "hla.p.priya", desigKey: "hla.g.tgtBio", deptKey: "hla.d.science", vac: true, gross: 52400, shift: "SH-01" },
    { id: "divya", campusKey: "lf.c.main", code: "NAV-0178", nameKey: "hla.p.divya", desigKey: "hla.g.tgtBio", deptKey: "hla.d.science", vac: true, gross: 52400, shift: "SH-01" },
    { id: "sanjay", campusKey: "lf.c.main", code: "NAV-0184", nameKey: "hla.p.sanjay", desigKey: "hla.g.tgtChem", deptKey: "hla.d.science", vac: true, gross: 58400, shift: "SH-01" },
    { id: "meenak", campusKey: "lf.c.main", code: "NAV-0088", nameKey: "hla.p.meenak", desigKey: "hla.g.headSci", deptKey: "hla.d.science", vac: true, gross: 108400, shift: "SH-01" },
    { id: "vikram", campusKey: "lf.c.main", code: "NAV-0118", nameKey: "hla.p.vikram", desigKey: "hla.g.tgtMaths", deptKey: "hla.d.maths", vac: true, gross: 66300, shift: "SH-01" },
    { id: "kavya", campusKey: "lf.c.main", code: "NAV-0207", nameKey: "hla.p.kavya", desigKey: "hla.g.prt3", deptKey: "hla.d.primary", vac: true, gross: 41800, shift: "SH-01" },
    { id: "neha", campusKey: "lf.c.north", code: "NAV-0250", nameKey: "hla.p.neha", desigKey: "hla.g.prt5", deptKey: "hla.d.primary", vac: true, gross: 38900, shift: null, noLogin: true, joinedISO: "2026-08-01" },
    { id: "rohit", campusKey: "lf.c.north", code: "NAV-0161", nameKey: "hla.p.rohit", desigKey: "hla.g.guestSan", deptKey: "hla.d.languages", vac: false, gross: 32000, shift: null },
    { id: "suresh", campusKey: "lf.c.main", code: "NAV-0176", nameKey: "hla.p.suresh", desigKey: "hla.g.accounts", deptKey: "hla.d.admin", vac: false, gross: 44600, shift: "SH-02" },
    { id: "prakash", campusKey: "lf.c.main", code: "NAV-0067", nameKey: "hla.p.prakash", desigKey: "hla.g.coach", deptKey: "hla.d.sports", vac: false, gross: 39200, shift: "SH-02" },
    { id: "manju", campusKey: "lf.c.main", code: "NAV-0054", nameKey: "hla.p.manju", desigKey: "hla.g.driver4", deptKey: "hla.d.transport", vac: false, gross: 28400, shift: "SH-03" },
    { id: "basav", campusKey: "lf.c.main", code: "NAV-0061", nameKey: "hla.p.basav", desigKey: "hla.g.driver2", deptKey: "hla.d.transport", vac: false, gross: 28400, shift: "SH-03" },
    { id: "imtiaz", campusKey: "lf.c.north", code: "NAV-0079", nameKey: "hla.p.imtiaz", desigKey: "hla.g.driver7", deptKey: "hla.d.transport", vac: false, gross: 28400, shift: "SH-03" },
    { id: "dilip", campusKey: "lf.c.north", code: "NAV-0093", nameKey: "hla.p.dilip", desigKey: "hla.g.driver9", deptKey: "hla.d.transport", vac: false, gross: 28400, shift: "SH-03" },
    { id: "shanti", campusKey: "lf.c.north", code: "NAV-0104", nameKey: "hla.p.shanti", desigKey: "hla.g.mess", deptKey: "hla.d.mess", vac: false, gross: 24600, shift: "SH-05" },
    { id: "iqbal", campusKey: "lf.c.north", code: "NAV-0112", nameKey: "hla.p.iqbal", desigKey: "hla.g.security", deptKey: "hla.d.security", vac: false, gross: 26800, shift: "SH-04" },
  ];
  function staffById(id) { return STAFF.filter((s) => s.id === id)[0]; }
  /* one unpaid day, priced the way the whole product prices it */
  function dayRate(person) { return person.gross / POLICY.lopDivisor; }
  function lopMoney(person, days) { return dayRate(person) * days; }

  const DEPT_KEYS = ["hla.d.science", "hla.d.maths", "hla.d.primary", "hla.d.languages",
    "hla.d.admin", "hla.d.transport", "hla.d.sports", "hla.d.mess", "hla.d.security"];

  /* approvers — who holds `leave.approve` for which department (M8
     §Permissions). Transport's post is vacant, which is exactly the
     precondition HR-28's reassign action exists for. */
  /* THREE RUNGS, NOT FOUR (designer, 2026-09-28). There is no "head of
     primary" role in this product: leave climbs head of department →
     principal → director, and a primary-school section is a department
     with a head like any other. Lata Krishnan is therefore the head of
     the Primary department, not a fourth kind of approver. */
  const APPROVERS = {
    "hla.d.science": { nameKey: "hla.p.anjali", roleKey: "hla.role.hod" },
    "hla.d.primary": { nameKey: "hla.p.lata", roleKey: "hla.role.hod" },
    "hla.d.maths": { nameKey: "hla.p.radhika", roleKey: "hla.role.principal" },
    "hla.d.languages": { nameKey: "hla.p.radhika", roleKey: "hla.role.principal" },
    "hla.d.admin": { nameKey: "hla.p.radhika", roleKey: "hla.role.principal" },
    "hla.d.sports": { nameKey: "hla.p.radhika", roleKey: "hla.role.principal" },
    "hla.d.mess": { nameKey: "hla.p.radhika", roleKey: "hla.role.principal" },
    "hla.d.security": { nameKey: "hla.p.radhika", roleKey: "hla.role.principal" },
    "hla.d.transport": { nameKey: "hla.p.vacant", roleKey: null, vacant: true },
  };
  function approverFor(deptKey) { return APPROVERS[deptKey]; }
  /* the people a stuck approval may be moved to — only holders of
     `leave.approve` at campus scope */
  const APPROVER_POOL = [
    { id: "anjali", nameKey: "hla.p.anjali", roleKey: "hla.role.hod" },
    { id: "lata", nameKey: "hla.p.lata", roleKey: "hla.role.hod" },
    { id: "radhika", nameKey: "hla.p.radhika", roleKey: "hla.role.principal" },
    { id: "vikramd", nameKey: "hla.p.vikram", roleKey: "hla.role.director" },
  ];
  const ME = { nameKey: "hla.p.meerai", roleKey: "hla.role.hr" };

  /* ============================================================
     BALANCES — §6.7 LeaveBalance, per employee per type per AY.
     Stored as [opening, accrued, taken]; the BALANCE IS DERIVED, so
     the ledger a reader can add up is the ledger the code adds up.
     Teaching staff simply have no EL key: absent, not zero.
     Ananya (CL 12/0/4, SL 4/4/2, COMP 0/3/1), Karan, Meera Joshi,
     Ramesh Iyer, Priya, Divya and Sanjay carry the exact figures
     pages/leave.jsx and pages/depthead.jsx already show.
     ============================================================ */
  const BAL = {
    ananya:  { CL: [12, 0, 4], SL: [4, 4, 2], COMP: [0, 3, 1] },
    karan:   { CL: [12, 0, 5], SL: [3, 2, 0], COMP: [0, 0, 0] },
    meeraj:  { CL: [12, 0, 6], SL: [2, 4, 1], COMP: [0, 1, 0] },
    rameshi: { CL: [12, 0, 2], SL: [4, 4, 2], COMP: [0, 2, 0] },
    priya:   { CL: [12, 0, 11], SL: [1, 4, 3], COMP: [0, 0, 0] },
    divya:   { CL: [12, 0, 4], SL: [3, 4, 0], COMP: [0, 1, 1] },
    sanjay:  { CL: [12, 0, 6], SL: [0, 4, 4], COMP: [0, 0, 0] },
    meenak:  { CL: [12, 0, 2], SL: [6, 4, 0], COMP: [0, 1, 0] },
    vikram:  { CL: [12, 0, 3], SL: [2, 4, 2], COMP: [0, 2, 0] },
    kavya:   { CL: [12, 0, 1], SL: [0, 4, 1], COMP: [0, 0, 0] },
    neha:    { CL: [4, 0, 0], SL: [0, 0, 0], COMP: [0, 0, 0] },
    rohit:   { CL: [12, 0, 0], SL: [1, 4, 0], COMP: [0, 0, 0], EL: [0, 6, 1] },
    suresh:  { CL: [12, 0, 3], SL: [2, 4, 1], COMP: [0, 1, 0], EL: [6, 6, 2] },
    prakash: { CL: [12, 0, 2], SL: [3, 4, 1], COMP: [0, 4, 2], EL: [8, 6, 2] },
    manju:   { CL: [12, 0, 7], SL: [0, 4, 4], COMP: [0, 2, 2], EL: [3, 6, 9] },
    basav:   { CL: [12, 0, 6], SL: [0, 4, 3], COMP: [0, 1, 0], EL: [5, 6, 4] },
    imtiaz:  { CL: [12, 0, 4], SL: [2, 4, 1], COMP: [0, 0, 0], EL: [0, 6, 3] },
    dilip:   { CL: [12, 0, 9], SL: [1, 4, 4], COMP: [0, 1, 1], EL: [7, 6, 11] },
    shanti:  { CL: [12, 0, 8], SL: [1, 4, 2], COMP: [0, 2, 1], EL: [2, 6, 6] },
    iqbal:   { CL: [12, 0, 5], SL: [2, 4, 0], COMP: [0, 3, 1], EL: [4, 6, 9] },
  };
  /* the ONLY place a balance number comes from */
  function ledgerOf(state, staffId, code) {
    const row = state[staffId] && state[staffId][code];
    if (!row) return null;
    return { opening: row[0], accrued: row[1], taken: row[2], balance: row[0] + row[1] - row[2] };
  }

  /* adjustment trail — append-only, attributed. Already counted in the
     figures above, and said so on the ledger. */
  const ADJUSTMENTS = [
    { id: "ADJ-0042", staffId: "ananya", code: "COMP", delta: 1, onISO: "2026-07-06", effISO: "2026-07-06", byKey: "hla.p.meerai", whyKey: "hla.adj.a1" },
    { id: "ADJ-0039", staffId: "priya", code: "CL", delta: -1, onISO: "2026-06-30", effISO: "2026-06-30", byKey: "hla.p.meerai", whyKey: "hla.adj.a2" },
    { id: "ADJ-0031", staffId: "manju", code: "EL", delta: 2, onISO: "2026-05-18", effISO: "2026-05-18", byKey: "hla.p.meerai", whyKey: "hla.adj.a3" },
    { id: "ADJ-0024", staffId: "dilip", code: "EL", delta: 1, onISO: "2026-04-11", effISO: "2026-04-01", byKey: "hla.p.meerai", whyKey: "hla.adj.a4" },
  ];

  /* ============================================================
     LEAVE REQUESTS — §6.7 LeaveRequest. LR-0219, LR-0207 and LR-0171
     are Ananya's own, verbatim from pages/leave.jsx; DH-LR-* are the
     Science department's queue, verbatim from pages/depthead.jsx.
     This console holds requests decided on or after CONSOLE_FROM_ISO;
     anything taken earlier in the year is reconciled explicitly on the
     ledger rather than quietly ignored.
     ============================================================ */
  const CONSOLE_FROM_ISO = "2026-07-01";
  const REQUESTS = [
    { id: "DH-LR-0265", staffId: "meeraj", code: "CL", from: "2026-07-28", to: "2026-07-29", days: 2, status: "pending", appliedISO: "2026-07-24", reasonKey: "hla.r.meeraJuly", lockedMonth: true },
    { id: "HR-LR-0244", staffId: "manju", code: "EL", from: "2026-08-20", to: "2026-08-22", days: 3, status: "pending", appliedISO: "2026-08-03", reasonKey: "hla.r.manjuHome" },
    { id: "HR-LR-0251", staffId: "suresh", code: "EL", from: "2026-09-01", to: "2026-09-02", days: 2, status: "pending", appliedISO: "2026-08-06", reasonKey: "hla.r.sureshSep" },
    { id: "HR-LR-0255", staffId: "prakash", code: "DUTY", from: "2026-08-26", to: "2026-08-26", days: 1, status: "pending", appliedISO: "2026-08-07", reasonKey: "hla.r.prakashDuty" },
    { id: "DH-LR-0276", staffId: "sanjay", code: "CL", from: "2026-08-18", to: "2026-08-22", days: 5, status: "pending", appliedISO: "2026-08-08", reasonKey: "hla.r.sanjayHome", coverWith: { staffId: "rameshi", from: "2026-08-20", to: "2026-08-21" } },
    { id: "LR-0219", staffId: "ananya", code: "CL", from: "2026-08-24", to: "2026-08-25", days: 2, status: "pending", appliedISO: "2026-08-09", reasonKey: "lv.r.wedding", needsCover: true },
    { id: "DH-LR-0288", staffId: "priya", code: "CL", from: "2026-09-01", to: "2026-09-03", days: 3, status: "pending", appliedISO: "2026-08-10", reasonKey: "hla.r.priyaTravel" },
    { id: "DH-LR-0269", staffId: "meeraj", code: "CL", from: "2026-09-15", to: "2026-09-17", days: 3, status: "pending", appliedISO: "2026-08-10", reasonKey: "hla.r.meeraSept", blackoutKey: "lv.win.exam1" },
    { id: "HR-LR-0238", staffId: "kavya", code: "CL", from: "2026-08-12", to: "2026-08-12", days: 1, status: "pending", appliedISO: "2026-08-10", reasonKey: "hla.r.kavyaOne" },
    { id: "DH-LR-0301", staffId: "karan", code: "SL", from: "2026-08-06", to: "2026-08-07", days: 2, status: "pending", appliedISO: "2026-08-11", reasonKey: "hla.r.karanRetro", retro: true },

    { id: "LR-0171", staffId: "ananya", code: "COMP", from: "2026-07-03", to: "2026-07-03", days: 1, status: "approved", appliedISO: "2026-06-29", decidedISO: "2026-07-01", byKey: "hla.p.anjali", reasonKey: "lv.r.personal" },
    { id: "LR-0207", staffId: "ananya", code: "CL", from: "2026-08-05", to: "2026-08-05", days: 1, status: "approved", appliedISO: "2026-08-01", decidedISO: "2026-08-03", byKey: "hla.p.anjali", reasonKey: "lv.r.family" },
    { id: "HR-LR-0221", staffId: "priya", code: "CL", from: "2026-08-07", to: "2026-08-07", days: 1, status: "approved", appliedISO: "2026-08-04", decidedISO: "2026-08-05", byKey: "hla.p.anjali", reasonKey: "lv.r.family" },
    { id: "HR-LR-0226", staffId: "vikram", code: "SL", from: "2026-08-03", to: "2026-08-04", days: 2, status: "approved", appliedISO: "2026-08-03", decidedISO: "2026-08-04", byKey: "hla.p.radhika", reasonKey: "hla.r.vikramSL" },
    { id: "HR-LR-0233", staffId: "rameshi", code: "CL", from: "2026-08-13", to: "2026-08-14", days: 2, status: "approved", appliedISO: "2026-08-05", decidedISO: "2026-08-06", byKey: "hla.p.anjali", reasonKey: "hla.r.rameshiAug" },
    { id: "HR-LR-0262", staffId: "shanti", code: "CL", from: "2026-08-14", to: "2026-08-14", days: 1, status: "approved", appliedISO: "2026-08-05", decidedISO: "2026-08-06", byKey: "hla.p.radhika", reasonKey: "hla.r.shantiOne" },
    { id: "HR-LR-0240", staffId: "divya", code: "CL", from: "2026-08-11", to: "2026-08-11", days: 1, status: "approved", appliedISO: "2026-08-06", decidedISO: "2026-08-07", byKey: "hla.p.anjali", reasonKey: "hla.r.divyaAug" },
    { id: "HR-LR-0247", staffId: "basav", code: "CL", from: "2026-08-18", to: "2026-08-19", days: 2, status: "approved", appliedISO: "2026-08-07", decidedISO: "2026-08-08", byKey: "hla.p.radhika", reasonKey: "hla.r.basavAug" },
    { id: "HR-LR-0258", staffId: "meenak", code: "CL", from: "2026-08-21", to: "2026-08-21", days: 1, status: "approved", appliedISO: "2026-08-08", decidedISO: "2026-08-09", byKey: "hla.p.radhika", reasonKey: "hla.r.meenakAug" },

    { id: "DH-LR-0198", staffId: "divya", code: "CL", from: "2026-07-20", to: "2026-07-21", days: 2, status: "rejected", appliedISO: "2026-07-10", decidedISO: "2026-07-12", byKey: "hla.p.anjali", reasonKey: "hla.r.divyaJuly" },
    { id: "DH-LR-0180", staffId: "karan", code: "CL", from: "2026-08-03", to: "2026-08-03", days: 0.5, half: true, status: "cancelled", appliedISO: "2026-07-28", decidedISO: "2026-08-01", byKey: "hla.p.meerai", reasonKey: "hla.r.karanHalf" },
  ];

  function ageOf(r) { return diffDays(r.appliedISO, TODAY_ISO); }
  function isStuck(r) { return r.status === "pending" && ageOf(r) >= POLICY.slaWorkingDays; }
  function hasStarted(r) { return diffDays(r.from, TODAY_ISO) >= 0; }
  function inJuly(iso) { return iso < AUG_FIRST_ISO; }
  function heldDays(reqs, staffId, code) {
    return reqs.reduce((s, r) => (r.staffId === staffId && r.code === code && r.status === "pending" ? s + r.days : s), 0);
  }
  function approvedInConsole(reqs, staffId, code) {
    return reqs.reduce((s, r) => (r.staffId === staffId && r.code === code && r.status === "approved" ? s + r.days : s), 0);
  }
  /* who is away on a given date — ABSENCE ONLY. The leave type is
     deliberately not returned by this function, so a shared surface
     cannot render it even by accident. */
  function awayOn(reqs, iso) {
    return reqs
      .filter((r) => r.status === "approved" && iso >= r.from && iso <= r.to)
      .map((r) => staffById(r.staffId));
  }

  /* ============================================================
     SHIFTS — §6.8 Shift. Campus counts sum to CAMPUS_HEADCOUNT, so
     "unassigned" is derived, never typed: it is the number the
     nightly job has nothing to compare against.
     ============================================================ */
  const SHIFTS = [
    { id: "SH-01", nameKey: "hla29.sh.morning", noteKey: "hla29.sh.morningD", start: "07:45", end: "14:15", kind: "fixed", grace: 10, off: "sun", assigned: 138 },
    { id: "SH-02", nameKey: "hla29.sh.general", noteKey: "hla29.sh.generalD", start: "08:30", end: "16:30", kind: "fixed", grace: 10, off: "sun", assigned: 39 },
    { id: "SH-03", nameKey: "hla29.sh.transport", noteKey: "hla29.sh.transportD", start: "05:30", end: "09:30", start2: "13:30", end2: "17:30", kind: "rotating", grace: 5, off: "rot", cycle: 6, assigned: 14 },
    { id: "SH-04", nameKey: "hla29.sh.security", noteKey: "hla29.sh.securityD", start: "20:00", end: "06:00", kind: "rotating", grace: 5, off: "rot", cycle: 4, assigned: 9 },
    { id: "SH-05", nameKey: "hla29.sh.flexi", noteKey: "hla29.sh.flexiD", start: "06:00", end: "22:00", kind: "flexi", grace: 15, off: "sun", assigned: 12 },
    { id: "SH-06", nameKey: "hla29.sh.exam", noteKey: "hla29.sh.examD", start: "15:00", end: "18:00", kind: "fixed", grace: 10, off: "sun", assigned: 0 },
  ];
  function shiftById(id) { return SHIFTS.filter((s) => s.id === id)[0]; }
  const UNASSIGNED = STAFF.filter((s) => !s.shift);

  /* WHAT HAS CHANGED, newest first. A shift is effective-dated, so
     "who is on what" has a history — and HR was asked for it on the
     one screen that had none (designer). Older than the current month
     on purpose: the window filter has something to find. */
  const SHIFT_TRAIL = [
    { id: "SC-0121", iso: "2026-08-10", shiftId: "SH-06", what: "created" },
    { id: "SC-0120", iso: "2026-08-08", shiftId: "SH-02", what: "assigned", n: 4, from: "2026-08-11" },
    { id: "SC-0119", iso: "2026-08-04", shiftId: "SH-01", what: "grace", n: 10 },
    { id: "SC-0118", iso: "2026-07-29", shiftId: "SH-05", what: "timings", a: "06:00", b: "22:00" },
    { id: "SC-0117", iso: "2026-07-18", shiftId: "SH-03", what: "assigned", n: 2, from: "2026-07-21" },
    { id: "SC-0116", iso: "2026-06-30", shiftId: "SH-04", what: "off" },
    { id: "SC-0115", iso: "2026-06-12", shiftId: "SH-01", what: "moved", n: 6 },
  ];

  /* ============================================================
     ATTENDANCE EXCEPTIONS — what M9's nightly job could not settle.
     `lopIfLeft` is in DAYS; the rupee figure is derived per person.
     ============================================================ */
  const OUTAGE = {
    id: "INC-0114",
    dateISO: "2026-08-07",
    from: "06:00",
    to: "13:20",
    deviceKey: "hla30.outage.device",
    affected: [
      { staffId: "ananya" }, { staffId: "meeraj" }, { staffId: "rameshi" },
      { staffId: "divya" }, { staffId: "vikram" }, { staffId: "kavya" },
      { staffId: "meenak" }, { staffId: "suresh" }, { staffId: "prakash" },
      { staffId: "priya", exKey: "hla30.outage.ex.leave" },
      { staffId: "sanjay", exKey: "hla30.outage.ex.absent" },
    ],
  };

  const EXCEPTIONS = [
    { id: "EX-0109", kind: "missing", staffId: "rameshi", dateISO: "2026-07-28", becomes: "absent", lopIfLeft: 1, state: "locked" },
    { id: "EX-0103", kind: "missing", staffId: "sanjay", dateISO: "2026-08-04", becomes: "absent", lopIfLeft: 1, state: "open" },
    { id: "EX-0107", kind: "single", which: "out", staffId: "manju", dateISO: "2026-08-05", punch: "17:42", becomes: "half", lopIfLeft: 0.5, state: "open" },
    { id: "EX-0101", kind: "missing", staffId: "karan", dateISO: "2026-08-06", becomes: "absent", lopIfLeft: 1, state: "open" },
    { id: "EX-0102", kind: "device", grouped: "outage", dateISO: "2026-08-07", becomes: "absent", state: "open" },
    { id: "EX-0104", kind: "single", which: "in", staffId: "priya", dateISO: "2026-08-10", punch: "08:31", becomes: "half", lopIfLeft: 0.5, state: "open" },
    { id: "EX-0110", kind: "short", staffId: "vikram", dateISO: "2026-08-06", punch: "09:40", outPunch: "13:05", shift: "08:30\u201316:30", need: 8, got: 3.5, becomes: "half", lopIfLeft: 0.5, state: "open" },
    { id: "EX-0111", kind: "noleave", staffId: "divya", dateISO: "2026-08-05", toldBy: "hla30.k.noleave.told", becomes: "absent", lopIfLeft: 1, state: "open" },
    { id: "EX-0105", kind: "geo", staffId: "kavya", dateISO: "2026-08-11", punch: "08:22", km: "1.8", becomes: "review", lopIfLeft: 0, state: "open" },
    { id: "EX-0106", kind: "conflict", staffId: "divya", dateISO: "2026-08-11", punch: "08:12", becomes: "review", lopIfLeft: 0, state: "open" },
    { id: "EX-0108", kind: "noshift", grouped: "noshift", dateISO: "2026-08-01", becomes: "nothing", lopIfLeft: 0, state: "open" },
  ];

  const AUG_DAYS = 31;
  /* num() rounds; a half day is a half day. Used wherever a figure
     can legitimately be .5 — short hours, part-paid days. */
  function halfNum(n) {
    return n === Math.round(n) ? num(n) : num(Math.floor(n)) + "\u00bd";
  }

  const AUG_SUNDAYS = 5;   /* 2, 9, 16, 23, 30 August 2026 */
  const AUG_HOLIDAYS = 1;  /* Saturday 15 August */
  /* M9: paid days = present + paid leave + holidays + weekly offs − LOP */
  function paidDaysWith(lopDays) { return AUG_DAYS - lopDays; }

  /* a second, supplementary string block — addStrings merges, and
     keeping these next to the components that use them beats hunting
     through 500 keys above. EN/HI parity applies here too. */
  addStrings({
    en: {
      "hla27.led.recon": "Taken {taken} = {m} on the requests below, plus {k} decided before {date}.",
      "hla27.led.reconAll": "Taken {taken} = the requests below, in full.",
      "hla26.prev.who": "{name} · {desig}",
      "hla28.beh.for": "{name} · {why}",
      "hla30.outage.rate": "{money} a day",
      "hla.flash.aria": "What just happened",
      "hla.dismiss": "Dismiss",
      "hla27.col.select": "Select",
      "hla29.sh.exam": "Examination duty — evening",
      "hla29.sh.examD": "Set up for the September examination sittings. Nobody is on it yet.",
      "hla29.new.blockedShort": "1 August 2026 is the earliest date you can reach back to.",
      "hla28.det.appliedLabel": "Applied",
      "hla28.det.stateLabel": "Where it stands",
      "hla26.pol.typesLabel": "Leave types",
      "hla26.bo.blocksN": "{n} of {total} types",
      "hla.scopeShort": "Indiranagar Campus only",
      "hla28.col.waitingOn": "Waiting on",
      "hla28.daysN": "{n} days",
      "hla28.days1": "1 day",
      "hla30.col.shift": "Shift",
      "hla30.col.paidNow": "Paid days, August",
      "hla30.noShift": "None — nothing to reconcile against",
      "hla27.adj.heading": "Adjust a balance",
    },
  });

  /* ============================================================
     LOCAL PRIMITIVES — kit.jsx is out of scope for this dispatch, so
     everything the kit lacks is defined here. PROMOTION CANDIDATES,
     in order of how often they have now been rebuilt across pages:
       TextArea      — 4th independent build (leave.jsx, principal.jsx,
                       depthead.jsx, here). Promote next kit touch.
       ReasonField   — the reason-is-required control this product
                       needs on every consequential act; 3rd build.
       ConfirmDialog — 3rd build (depthead.jsx, groupadmin.jsx, here).
       Callout       — tinted, iconed, worded panel; 3rd build.
       Trail         — attributed history rows; 4th build.
       RowCheck / BulkBar — 2nd build (hr.jsx).
       ChoiceList    — first build; a native radio group with a
                       description under each option, which every
                       "choose how this behaves" panel in the product
                       has so far faked with buttons.
       Flash         — an inline "what just happened" strip; 3rd build.
     ============================================================ */

  function TopStrip({ navKey }) {
    const { t } = useLang();
    const { c } = useTheme();
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ fontSize: 0 }}>
          <span style={{ fontFamily: G3.font.ui, fontSize: 12.5, fontWeight: 700, color: c.ink }}>{t(navKey)}</span>
          <span style={{ margin: "0 8px", color: c.inkFaint, fontFamily: G3.font.ui, fontSize: 12.5 }}>·</span>
          <span style={{ fontFamily: G3.font.ui, fontSize: 12.5, color: c.inkMuted }}>{t("hla.who")}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ThemeToggle />
        </div>
      </div>
    );
  }

  function PageHeader({ title, sub, meta, right }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <header style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, flexWrap: "wrap", marginBottom: 18 }}>
        <div style={{ minWidth: 0 }}>
          <h1 style={ty("h1", { margin: 0, color: c.ink })}>{title}</h1>
          {sub ? <p style={ty("body", { margin: "6px 0 0", color: c.inkMuted, maxWidth: 760 })}>{sub}</p> : null}
          {meta ? <p style={ty("caption", { margin: "8px 0 0", color: c.inkFaint })}>{meta}</p> : null}
        </div>
        {right ? <div style={{ flexShrink: 0, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>{right}</div> : null}
      </header>
    );
  }

  function Note({ children, style }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return <p style={ty("caption", Object.assign({ color: c.inkFaint, margin: "10px 2px 0", maxWidth: 820 }, style || {}))}>{children}</p>;
  }

  /* a tinted, iconed, WORDED panel. `tone` names a data role, so the
     tint/text pair is the system's, not a bespoke colour, and the word
     always accompanies the colour. */
  function Callout({ tone, icon, title, body, children, action, compact }) {
    const { c } = useTheme();
    const { ty } = useLang();
    const text = c[(tone || "off") + "Text"] || c.inkMuted;
    return (
      <div style={{ border: "1px solid " + c.border, borderRadius: G3.r.lg, padding: compact ? "13px 15px" : "16px 18px", display: "flex", gap: 13, alignItems: "flex-start" }}>
        <span aria-hidden="true" style={{ color: text, display: "flex", paddingTop: 2, flexShrink: 0 }}><Icon name={icon || "alert"} size={17} /></span>
        <div style={{ minWidth: 0, flex: 1 }}>
          {title ? <div style={ty("h3", { color: c.ink, margin: 0 })}>{title}</div> : null}
          {body ? <p style={ty("small", { color: c.inkMuted, margin: title ? "5px 0 0" : 0 })}>{body}</p> : null}
          {children}
        </div>
        {action ? <div style={{ flexShrink: 0 }}>{action}</div> : null}
      </div>
    );
  }

  function Flash({ text, onDismiss }) {
    const { c } = useTheme();
    const { ty, t } = useLang();
    if (!text) return null;
    return (
      <div
        role="status" aria-label={t("hla.flash.aria")}
        style={{ display: "flex", alignItems: "flex-start", gap: 11, border: "1px solid " + c.border, borderRadius: G3.r.lg, padding: "12px 14px", marginBottom: G3.layout.gap }}
      >
        <span aria-hidden="true" style={{ color: c.presentText, display: "flex", paddingTop: 1 }}><Icon name="check" size={16} /></span>
        <p style={ty("small", { margin: 0, color: c.ink, flex: 1 })}>{text}</p>
        <LinkButton onClick={onDismiss}>{t("hla.dismiss")}</LinkButton>
      </div>
    );
  }

  function TextArea({ id, value, onChange, placeholder, invalid, rows }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <textarea
        id={id} rows={rows || 3} value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={invalid ? "true" : undefined}
        style={ty("small", {
          width: "100%", resize: "vertical", padding: "11px 13px",
          borderRadius: G3.r.md, background: c.surface, color: c.ink,
          border: "1px solid " + (invalid ? c.danger : c.borderStrong),
          fontFamily: "inherit",
        })}
      />
    );
  }

  /* the reason control. Never hard-disables the submit that needs it —
     a disabled submit swallows the click that would have revealed the
     error (a lesson this codebase learned the hard way). */
  function ReasonField({ id, label, hint, value, onChange, error, rows, placeholder }) {
    const { t } = useLang();
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div style={{ marginTop: 12 }}>
        <Field id={id} label={label || t("hla.reason.label")} hint={hint == null ? t("hla.reason.hint") : hint}>
          <TextArea id={id} value={value} onChange={onChange} invalid={!!error} rows={rows} placeholder={placeholder} />
        </Field>
        {error ? (
          <p role="alert" style={ty("caption", { color: c.dangerText, margin: "6px 2px 0", display: "flex", gap: 6, alignItems: "center" })}>
            <span aria-hidden="true" style={{ display: "flex" }}><Icon name="alert" size={13} /></span>{error}
          </p>
        ) : null}
      </div>
    );
  }

  function FieldError({ children }) {
    const { c } = useTheme();
    const { ty } = useLang();
    if (!children) return null;
    return (
      <p role="alert" style={ty("caption", { color: c.dangerText, margin: "6px 2px 0", display: "flex", gap: 6, alignItems: "center" })}>
        <span aria-hidden="true" style={{ display: "flex" }}><Icon name="alert" size={13} /></span>{children}
      </p>
    );
  }

  /* a native radio group — real inputs, so keyboard and screen-reader
     behaviour is the platform's, with a description under each option
     for the choices in this product that carry a consequence. */
  /* CLOSE, in the danger colour but not in the danger WEIGHT. It is a
     secondary control — outlined, never filled — because a filled red
     button is what the product uses for a thing that cannot be undone,
     and closing a panel undoes nothing. */
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

  function ChoiceList({ name, value, onChange, options, label, error }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <fieldset style={{ border: 0, margin: "12px 0 0", padding: 0, minWidth: 0 }}>
        {label ? <legend style={ty("caption", { color: c.inkMuted, fontWeight: 700, padding: 0, marginBottom: 8 })}>{label}</legend> : null}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {options.map((o) => (
            <label
              key={o.value} htmlFor={name + "-" + o.value}
              style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "11px 13px", borderRadius: G3.r.md, cursor: "pointer",
                background: value === o.value ? c.accentSoft : c.alt,
                border: "1px solid " + (value === o.value ? c.accent : c.border) }}
            >
              <input
                type="radio" id={name + "-" + o.value} name={name} value={o.value}
                checked={value === o.value} onChange={() => onChange(o.value)}
                style={{ accentColor: c.accent, marginTop: 2, flexShrink: 0 }}
              />
              <span style={{ minWidth: 0 }}>
                <span style={ty("small", { display: "block", color: c.ink, fontWeight: 700 })}>{o.label}</span>
                {o.note ? <span style={ty("caption", { display: "block", color: c.inkMuted, marginTop: 3 })}>{o.note}</span> : null}
              </span>
            </label>
          ))}
        </div>
        <FieldError>{error}</FieldError>
      </fieldset>
    );
  }

  function RowCheck({ id, checked, onChange, ariaLabel }) {
    const { c } = useTheme();
    return (
      <input
        type="checkbox" id={id} checked={checked} aria-label={ariaLabel}
        onChange={(e) => onChange(e.target.checked)}
        style={{ accentColor: c.accent, width: 15, height: 15, cursor: "pointer" }}
      />
    );
  }

  /* label / value pair, used everywhere a record is read rather than
     edited */
  /* A SHELL DECLARED INSIDE A RENDER IS A NEW COMPONENT EVERY TIME
     (designer-reported, 2026-10-22). Two detail panes built theirs
     with `const Shell = bare ? function () {...} : function () {...}`,
     so React threw the whole subtree away and rebuilt it on every
     keystroke -- which is why a reason box inside one of them could
     never hold more than a single character. One stable component,
     told whether to draw a card or nothing. */
  function PaneShell({ bare, icon, iconTone, title, sub, children }) {
    if (bare) return <div>{children}</div>;
    return <Card icon={icon} iconTone={iconTone} title={title} sub={sub}>{children}</Card>;
  }

  function DefRow({ label, children, mono }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div style={{ display: "flex", gap: 14, alignItems: "baseline", padding: "7px 0", borderBottom: "1px solid " + c.rule }}>
        <span style={ty("caption", { color: c.inkFaint, width: 132, flexShrink: 0 })}>{label}</span>
        <span style={mono ? G3.fig("sm", { color: c.ink, flex: 1 }) : ty("small", { color: c.ink, flex: 1 })}>{children}</span>
      </div>
    );
  }

  /* an attributed history — who did what, when, and why */
  function Trail({ items }) {
    const { c } = useTheme();
    const { ty } = useLang();
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

  /* a centred, portal-rendered confirm dialog — for the two acts on
     this screen that must not be one click in a card: activating a
     policy change, and correcting attendance. */
  function ConfirmDialog({ title, body, children, confirmLabel, cancelLabel, onConfirm, onCancel, tone }) {
    const { c, shadow } = useTheme();
    const { ty, lang } = useLang();
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
            <Button kind={tone === "brass" ? "brass" : "primary"} onClick={onConfirm}>{confirmLabel}</Button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  /* an inline working panel inside a card — the two-step shape this
     product uses instead of committing anything on one click */
  /* Every consequential act on this module opens one of these. The
     record it is about stays on screen behind it, which is the whole
     reason it is a side screen and not a dialog: you are reading a
     row and acting on that row. */
  function Panel({ title, sub, onClose, children, width, pop }) {
    const { c } = useTheme();
    const { ty } = useLang();

    /* `pop` is for a modal opened FROM a side screen. Two drawers from
       the same edge bury each other; a centred dialog sits over both
       and the reader can still see where they were. */
    if (pop) {
      return ReactDOM.createPortal(
        <div style={{ position: "fixed", inset: 0, zIndex: 2400, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "48px 20px", overflowY: "auto" }}>
          <div aria-hidden="true" onMouseDown={onClose} style={{ position: "fixed", inset: 0, background: c.rail, opacity: 0.55 }} />
          <div
            role="dialog" aria-modal="true" aria-label={title}
            style={{ position: "relative", width: width || 560, maxWidth: "100%", background: c.surface, border: "1px solid " + c.border, borderRadius: G3.r.card, padding: 24 }}
          >
            <h2 style={ty("h2", { margin: "0 0 4px", color: c.ink })}>{title}</h2>
            {sub ? <p style={ty("small", { color: c.inkMuted, margin: "0 0 16px" })}>{sub}</p> : null}
            {children}
          </div>
        </div>,
        document.body
      );
    }

    return (
      <SideScreen title={title} sub={sub} width={width || 620} onClose={onClose}>
        {children}
      </SideScreen>
    );
  }

  function Actions({ children }) {
    return <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16, alignItems: "center" }}>{children}</div>;
  }

  /* a money figure with its derivation printed beside it, so a rupee
     number on an HR screen never floats free of where it came from */
  function Money({ value, note, tone }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <span style={{ display: "inline-flex", flexDirection: "column", gap: 2 }}>
        <span style={G3.fig("md", { color: tone || c.ink, fontWeight: 600 })}>{inr(value)}</span>
        {note ? <span style={ty("caption", { color: c.inkFaint })}>{note}</span> : null}
      </span>
    );
  }

  /* ============================================================
     HR-26 · LEAVE POLICY AND TYPES
     "what leave exists here, and who may take it"

     The setup screen that makes every other tab computable. Two
     things make it consequential rather than a settings form:
       1. nothing lands in one click — an active type is SUPERSEDED
          from an effective date, with a reason, and the supersession
          dialog forces an explicit answer to what happens to balances
          that already exist;
       2. `applies_to_vacation_staff` has NO default anywhere on this
          screen. It is the switch the whole product turns on, and a
          default would be a guess made on somebody's behalf.
     ============================================================ */
  function PolicyTab({ flash, setFlash }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [which, setWhich] = useState("active");
    const [types, setTypes] = useState(TYPES);
    const [windows, setWindows] = useState(WINDOWS);
    const [amend, setAmend] = useState(AMENDMENT);
    const [supOpen, setSupOpen] = useState(false);
    const [supEff, setSupEff] = useState(AMENDMENT.effISO);
    const [supBal, setSupBal] = useState("");
    const [supErr, setSupErr] = useState("");
    const [addOpen, setAddOpen] = useState(false);
    const [preview, setPreview] = useState(false);
    const [draftMade, setDraftMade] = useState(false);
    const [boFor, setBoFor] = useState(null);      /* type code whose windows are being set */
    const [confirmDiscard, setConfirmDiscard] = useState(false);
    const [pendingSup, setPendingSup] = useState(null);   /* a row-level supersession */
    const [supReason, setSupReason] = useState("");
    const [supReasonErr, setSupReasonErr] = useState("");
    const { mode } = useTheme();
    const onFill = mode === "dark" ? c.brass : c.onBrass;

    const onDraft = which === "draft";
    const slaSample = types.filter((x) => x.code === "SL")[0];

    function blocksOf(code) { return windows.filter((w) => w.blocks.indexOf(code) !== -1); }
    function toggleBlock(code, winKey) {
      setWindows((prev) => prev.map((w) => {
        if (w.key !== winKey) return w;
        const has = w.blocks.indexOf(code) !== -1;
        return Object.assign({}, w, { blocks: has ? w.blocks.filter((x) => x !== code) : w.blocks.concat([code]) });
      }));
    }

    function doActivate() {
      if (!supBal) { setSupErr(t("hla26.sup.balMissing")); return; }
      setTypes((prev) => prev.map((x) => (x.code === amend.typeCode
        ? Object.assign({}, x, { accVars: { n: amend.newValue }, yearly: amend.newValue, cap: amend.newValue })
        : x)));
      setFlash(t("hla26.amend.done", { newN: num(amend.newValue), eff: fmt(t, supEff), v: amend.version, by: t(amend.draftedByKey) }));
      setAmend(null);
      setSupOpen(false);
      setSupErr("");
    }

    /* ---- the leave-type register ---- */
    const typeCols = [
      { key: "type", label: t("hla26.col.type") },
      { key: "accrual", label: t("hla26.col.accrual") },
      { key: "cap", label: t("hla26.col.cap") },
      { key: "encash", label: t("hla26.col.encash") },
      { key: "vac", label: t("hla26.col.vac") },
      { key: "half", label: t("hla26.col.half") },
      { key: "max", label: t("hla26.col.max") },
      { key: "menu", label: "", align: "right", width: 44 },
    ];
    const typeRows = types.map((x) => ({
      id: x.code,
      cells: {
        type: (
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <Chip bg={c[x.role + "Tint"] || c.sunken} fg={c[x.role + "Text"] || c.inkMuted} mono>{x.code}</Chip>
            <span style={{ fontWeight: 600 }}>{t(x.key)}</span>
          </div>
        ),
        accrual: (
          <span>
            {t(x.accKey, x.accVars)}
            {x.statutory ? (
              <span style={{ display: "block", marginTop: 4 }}>
                <Chip bg={c.brassSoft} fg={c.brass}>
                  <span aria-hidden="true" style={{ display: "flex" }}><Icon name="lock" size={11} /></span>
                  <span>{t("hla26.stat.word")}</span>
                </Chip>
              </span>
            ) : null}
          </span>
        ),
        cap: x.cap ? t("hla26.cap.n", { n: num(x.cap) }) : t("hla26.cap.none"),
        encash: x.encash ? t("hla26.yes") : t("hla26.no"),
        vac: x.vac
          ? <StatusMark role="present" glyph="check" word={t("hla26.vac.yes")} />
          : <StatusMark role="penalty" glyph="alert" word={t("hla26.vac.no")} />,
        half: x.half ? t("hla26.yes") : t("hla26.no"),
        max: x.maxRun == null ? t("hla26.max.none") : t("hla26.max.n", { n: num(x.maxRun) }),
        menu: (
          <ActionMenu
            ariaLabel={t("hla26.menu.aria", { type: t(x.key) })}
            items={[
              x.statutory
                ? { key: "sup", icon: "lock", label: t("hla26.menu.editStat"), disabled: true, reason: t("hla26.menu.editStatWhy") }
                : { key: "sup", icon: "filing", label: t("hla26.menu.edit"), onSelect: () => { setAddOpen(false); setBoFor(null); setSupOpen(false); setPendingSup(x.code); } },
              { key: "bo", icon: "leave", label: t("hla26.menu.blackout"), onSelect: () => { setSupOpen(false); setAddOpen(false); setBoFor(x.code); } },
            ]}
          />
        ),
      },
    }));

    /* a supersession opened from a row that is not the drafted one:
       the same two-step, with its own reason. */
    const pendingType = pendingSup ? types.filter((x) => x.code === pendingSup)[0] : null;

    function doRowSupersede() {
      if (supReason.trim().length < 8) { setSupReasonErr(supReason.trim() ? t("hla.reason.short") : t("hla.reason.missing")); return; }
      setFlash(t("hla26.bo.applied", { name: t(pendingType.key), n: num(blocksOf(pendingType.code).length), total: num(windows.length), by: t(ME.nameKey) }));
      setPendingSup(null); setSupReason(""); setSupReasonErr("");
    }

    return (
      <div>
        <Flash text={flash} onDismiss={() => setFlash("")} />

        {/* the two things you come here to DO sit at the end of the
            row as real calls to action — adding a type is the primary
            one, previewing is the safe rehearsal beside it (designer,
            2026-09-28: "I don't find these as CTAs") */}
        <div style={{ display: "flex", gap: 16, alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", marginBottom: G3.layout.gap }}>
          <div style={{ minWidth: 240, flex: "0 1 300px" }}>
            <Field id="hla26-policy" label={t("hla26.pol.pick")}>
              <Select
                id="hla26-policy" value={which} onChange={setWhich}
                options={[
                  { value: "active", label: t("hla26.pol.active") },
                  { value: "draft", label: t("hla26.pol.draft") },
                ]}
              />
            </Field>
          </div>
          <div style={{ paddingBottom: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button kind="secondary" iconLeft="staff" onClick={() => setPreview((v) => !v)}>
              {preview ? t("hla26.prev.hide") : t("hla26.prev.open")}
            </Button>
            <Button kind="primary" iconLeft="plus" onClick={() => { setAddOpen(true); setSupOpen(false); setBoFor(null); }}>{t("hla26.add")}</Button>
          </div>
        </div>

        {/* ---- the policy itself ---- */}
        {onDraft ? (
          <Card icon="filing" iconTone="off" title={t("hla26.draft.title")} sub={t("hla26.pol.draft")} style={{ marginBottom: G3.layout.gap }}>
            <p style={ty("small", { color: c.ink, margin: 0 })}>{t("hla26.draft.body")}</p>
            {draftMade ? (
              <div style={{ marginTop: 14 }}>
                <Callout tone="present" icon="check" body={t("hla26.draft.made")} compact />
              </div>
            ) : (
              <Actions>
                <Button kind="secondary" iconLeft="document" onClick={() => { setDraftMade(true); setFlash(t("hla26.draft.made")); }}>{t("hla26.draft.copy")}</Button>
                <span style={ty("caption", { color: c.inkFaint, maxWidth: 460 })}>{t("hla26.draft.copyNote")}</span>
              </Actions>
            )}
          </Card>
        ) : (
          <Card
            icon="leave" iconTone="accent"
            title={t("hla26.pol.card.title")}
            sub={t("hla26.pol.card.sub", { v: POLICY.version, from: fmt(t, POLICY.fromISO), by: t(POLICY.activatedByKey), on: fmt(t, POLICY.activatedOnISO) })}
            action={<StatusMark role="present" glyph="check" word={t("hla26.pol.state.active")} />}
            style={{ marginBottom: G3.layout.gap }}
          >
            <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 300px", minWidth: 260 }}>
                <DefRow label={t("hla26.pol.ay")}>{POLICY.ay}</DefRow>
                <DefRow label={t("hla26.pol.scope")}>{t(POLICY.scopeKey)}</DefRow>
                <DefRow label={t("hla26.pol.typesLabel")}>{t("hla26.pol.types", { n: num(types.length) })}</DefRow>
              </div>
              <div style={{ flex: "1 1 320px", minWidth: 280 }}>
                <Callout tone="late" icon="lock" title={t("hla26.pol.inUse")} body={t("hla26.pol.inUseD", { n: num(CAMPUS_HEADCOUNT) })} compact />
              </div>
            </div>
          </Card>
        )}

        {/* ---- the one honey card on this tab: the drafted change ---- */}
        {!onDraft && amend ? (
          <div style={{ marginBottom: G3.layout.gap }}>
            <Card icon="filing" iconTone="brass" title={t("hla26.amend.title")}>
              <p style={ty("h3", { margin: "2px 0 0", color: c.ink })}>
                {t("hla26.amend.line", { oldN: num(amend.oldValue), newN: num(amend.newValue) })}
              </p>
              <p style={ty("caption", { margin: "8px 0 0", color: c.inkFaint })}>
                {t("hla26.amend.meta", { by: t(amend.draftedByKey), on: fmt(t, amend.draftedOnISO), eff: fmt(t, amend.effISO) })}
              </p>
              <p style={ty("small", { margin: "12px 0 0", color: c.inkMuted, maxWidth: 720 })}>
                <span style={{ fontWeight: 700, color: c.ink }}>{t("hla26.amend.why")}: </span>{t("hla26.amend.whyText")}
              </p>
              <Actions>
                <Button kind="primary" iconLeft="arrow" onClick={() => { setSupOpen(true); setPendingSup(null); }}>{t("hla26.amend.cta")}</Button>
                <LinkButton onClick={() => setConfirmDiscard(true)}>{t("hla26.amend.discard")}</LinkButton>
              </Actions>
            </Card>
          </div>
        ) : null}

        {supOpen && amend ? (
          <ConfirmDialog
            title={t("hla26.sup.title")}
            body={t("hla26.sup.body", { eff: fmt(t, supEff) })}
            confirmLabel={t("hla26.sup.confirm", { eff: fmt(t, supEff) })}
            cancelLabel={t("hla.act.cancel")}
            onCancel={() => { setSupOpen(false); setSupErr(""); }}
            onConfirm={doActivate}
          >
            <div style={{ marginTop: 16 }}>
              <Field id="hla26-sup-eff" label={t("hla26.sup.effLabel")}>
                <Input id="hla26-sup-eff" type="date" value={supEff} onChange={setSupEff} />
              </Field>
              <ChoiceList
                name="hla26-sup-bal" value={supBal} onChange={(v) => { setSupBal(v); setSupErr(""); }}
                label={t("hla26.sup.balLabel")} error={supErr}
                options={[
                  { value: "recalc", label: t("hla26.sup.bal.recalc"), note: t("hla26.sup.bal.recalcD", { n: num(amend.affected) }) },
                  { value: "grand", label: t("hla26.sup.bal.grand"), note: t("hla26.sup.bal.grandD", { eff: fmt(t, supEff) }) },
                ]}
              />
              <div style={{ marginTop: 14 }}>
                <Callout tone="late" icon="lock" body={t("hla26.sup.second")} compact />
              </div>
            </div>
          </ConfirmDialog>
        ) : null}

        {confirmDiscard && amend ? (
          <ConfirmDialog
            title={t("hla26.amend.discard")}
            body={t("hla26.amend.gone", { oldN: num(amend.oldValue) })}
            confirmLabel={t("hla26.amend.discard")}
            cancelLabel={t("hla.act.cancel")}
            onCancel={() => setConfirmDiscard(false)}
            onConfirm={() => { setAmend(null); setConfirmDiscard(false); setFlash(t("hla26.amend.gone", { oldN: num(AMENDMENT.oldValue) })); }}
          />
        ) : null}

        {/* ---- preview on two people ---- */}
        {preview ? (
          <Card icon="staff" iconTone="info" title={t("hla26.prev.title")} sub={t("hla26.prev.sub")} style={{ marginBottom: G3.layout.gap }}>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              {[{ p: staffById("ananya"), head: t("hla26.prev.teacher") }, { p: staffById("suresh"), head: t("hla26.prev.admin") }].map((col) => (
                <div key={col.p.id} style={{ flex: "1 1 340px", minWidth: 300, border: "1px solid " + c.border, borderRadius: G3.r.lg, padding: 14, background: c.alt }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <TitleMark icon={col.p.vac ? "leave" : "briefcase"} iconTone={col.p.vac ? "leave" : "present"} size={28} />
                    <div>
                      <div style={ty("small", { color: c.ink, fontWeight: 700 })}>{col.head}</div>
                      <div style={ty("caption", { color: c.inkMuted })}>{t("hla26.prev.who", { name: t(col.p.nameKey), desig: t(col.p.desigKey) })}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, paddingBottom: 5, borderBottom: "1px solid " + c.ruleStrong }}>
                    <span style={ty("colLabel", { color: c.inkFaint, textTransform: "uppercase" })}>{t("hla26.prev.col.type")}</span>
                    <span style={ty("colLabel", { color: c.inkFaint, textTransform: "uppercase" })}>{t("hla26.prev.col.year")}</span>
                  </div>
                  {types.filter((x) => x.code !== "LOP").map((x) => {
                    const applies = col.p.vac ? x.vac : true;
                    return (
                      <div key={x.code} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "5px 0", borderBottom: "1px solid " + c.rule }}>
                        <span style={ty("caption", { color: applies ? c.ink : c.inkFaint })}>{t(x.key)}</span>
                        <span style={applies
                          ? G3.fig("xs", { color: c.ink, fontWeight: 600 })
                          : ty("caption", { color: c.penaltyText, fontWeight: 700 })}>
                          {!applies ? t("hla26.prev.na") : x.yearly == null ? t("hla26.prev.eventOnly") : t("hla26.max.n", { n: num(x.yearly) })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            <Note>{t("hla26.prev.note")}</Note>
          </Card>
        ) : null}

        {/* ---- the types ---- */}
        <Register
          title={t("hla26.types.title")}
          sub={t("hla26.types.sub")}
          columns={typeCols}
          rows={typeRows}
          footer={
            <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
              <Callout tone="leave" icon="leave" title={t("hla26.vac.no") + " · " + t("hla26.type.el")} body={t("hla26.vac.noteEL")} compact />
              <span style={ty("caption", { color: c.inkFaint })}>{t("hla26.vac.legend")}</span>
              <span style={ty("caption", { color: c.inkFaint })}>
                {t("hla26.stat.note", { v: STAT_CFG.version, from: fmt(t, STAT_CFG.fromISO), src: t(STAT_CFG.srcKey) })}
              </span>
            </div>
          }
        />

        {pendingType ? (
          <EditTypePanel
            type={pendingType}
            reason={supReason} setReason={setSupReason} err={supReasonErr} setErr={setSupReasonErr}
            onClose={() => { setPendingSup(null); setSupReason(""); setSupReasonErr(""); }}
            onDone={doRowSupersede}
          />
        ) : null}

        {boFor ? (
          <React.Fragment>
            <Panel title={t("hla26.menu.blackout") + " · " + t(typeOf(boFor).key)} sub={t("hla26.bo.sub")} onClose={() => setBoFor(null)}>
              {typeOf(boFor).neverBlocked ? (
                <div style={{ marginTop: 12 }}><Callout tone="present" icon="check" body={t("hla26.bo.note")} compact /></div>
              ) : (
                <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                  {windows.map((w) => (
                    <label key={w.key} htmlFor={"bo-" + boFor + "-" + w.key}
                      style={{ display: "flex", gap: 11, alignItems: "center", padding: "10px 12px", borderRadius: G3.r.md, background: c.alt, border: "1px solid " + c.border, cursor: "pointer" }}>
                      <RowCheck id={"bo-" + boFor + "-" + w.key} checked={w.blocks.indexOf(boFor) !== -1} onChange={() => toggleBlock(boFor, w.key)} ariaLabel={t(w.key)} />
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={ty("small", { display: "block", color: c.ink, fontWeight: 600 })}>{t(w.key)}</span>
                        <span style={ty("caption", { display: "block", color: c.inkMuted })}>{t(w.dateKey)}</span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
              <Note>{t("hla26.bo.source")}</Note>
            </Panel>
          </React.Fragment>
        ) : null}

        {addOpen ? (
          <div style={{ marginTop: G3.layout.gap }}>
            <AddTypePanel
              onDraft={onDraft}
              existing={types}
              onClose={() => setAddOpen(false)}
              onAdd={(x) => { setTypes((prev) => prev.concat([x])); setAddOpen(false); setFlash(t("hla26.add.done", { code: x.code })); }}
            />
          </div>
        ) : null}

        {/* ---- blackout windows ---- */}
        <div style={{ marginTop: G3.layout.gap }}>
          <BlackoutCard windows={windows} types={types} />
        </div>
      </div>
    );
  }

  /* EDIT A LEAVE TYPE. The rule this screen has always enforced is
     that a type people hold balances against is not overwritten — it
     is REPLACED BY A DATED VERSION, and everything spent under the old
     one stays spent. That rule did not change; the word did. The
     fields are the ones the register shows, so what you edit is what
     you were looking at. */
  function EditTypePanel({ type, reason, setReason, err, setErr, onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [rate, setRate] = useState(type.yearly == null ? "" : String(type.yearly));
    const [cap, setCap] = useState(String(type.cap || 0));
    const [maxRun, setMaxRun] = useState(type.maxRun == null ? "" : String(type.maxRun));
    const [half, setHalf] = useState(!!type.half);
    const [vac, setVac] = useState(!!type.vac);
    const [eff, setEff] = useState(addDays(TODAY_ISO, 21));

    return (
      <Panel
        title={t("hla26.edit.title", { type: t(type.key) })}
        sub={t("hla26.edit.sub")}
        onClose={onClose}
        width={640}
      >
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 160px" }}>
            <Field id="hla26-ed-rate" label={t("hla26.edit.rate")} hint={t("hla26.edit.rateHint")}>
              <Input id="hla26-ed-rate" value={rate} onChange={setRate} inputMode="numeric" />
            </Field>
          </div>
          <div style={{ flex: "1 1 160px" }}>
            <Field id="hla26-ed-cap" label={t("hla26.edit.cap")} hint={t("hla26.edit.capHint")}>
              <Input id="hla26-ed-cap" value={cap} onChange={setCap} inputMode="numeric" />
            </Field>
          </div>
          <div style={{ flex: "1 1 160px" }}>
            <Field id="hla26-ed-max" label={t("hla26.edit.max")} hint={t("hla26.edit.maxHint")}>
              <Input id="hla26-ed-max" value={maxRun} onChange={setMaxRun} inputMode="numeric" />
            </Field>
          </div>
        </div>

        <div style={{ display: "flex", gap: 18, flexWrap: "wrap", margin: "2px 0 18px" }}>
          <Switch id="hla26-ed-half" checked={half} onChange={setHalf} label={t("hla26.edit.half")} />
          <Switch id="hla26-ed-vac" checked={vac} onChange={setVac} label={t("hla26.edit.vac")} />
        </div>

        <Field id="hla26-ed-eff" label={t("hla26.edit.eff")} hint={t("hla26.edit.effHint")}>
          <Input id="hla26-ed-eff" type="date" value={eff} onChange={setEff} />
        </Field>

        <ReasonField id="hla26-sup-reason" value={reason} onChange={(v) => { setReason(v); setErr(""); }} error={err} />

        <div style={{ border: "1px solid " + c.border, borderRadius: G3.r.lg, padding: "13px 15px", marginTop: 4 }}>
          <p style={ty("caption", { margin: 0, color: c.inkMuted })}>{t("hla26.edit.consequence", { eff: fmt(t, eff), n: num(CAMPUS_HEADCOUNT) })}</p>
        </div>

        <Actions>
          <Button kind="primary" iconLeft="filing" onClick={onDone}>{t("hla26.edit.confirm")}</Button>
          <LinkButton onClick={onClose}>{t("hla.act.cancel")}</LinkButton>
        </Actions>
      </Panel>
    );
  }

  function AddTypePanel({ onDraft, existing, onClose, onAdd }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [code, setCode] = useState("");
    const [name, setName] = useState("");
    const [rate, setRate] = useState("1");
    const [freq, setFreq] = useState("year");
    const [cap, setCap] = useState("0");
    const [encash, setEncash] = useState(false);
    const [half, setHalf] = useState(true);
    const [vac, setVac] = useState("");
    const [eff, setEff] = useState(TOMORROW_ISO);
    const [reason, setReason] = useState("");
    const [err, setErr] = useState({});

    function submit() {
      const e = {};
      const cu = code.trim().toUpperCase();
      if (!cu) e.code = t("hla26.add.codeMissing");
      else if (existing.some((x) => x.code === cu)) e.code = t("hla26.add.codeDup");
      if (!vac) e.vac = t("hla26.add.vacMissing");
      if (!onDraft && reason.trim().length < 8) e.reason = reason.trim() ? t("hla.reason.short") : t("hla.reason.missing");
      setErr(e);
      if (Object.keys(e).length) return;
      onAdd({
        code: cu, key: null, label: name.trim() || cu, role: "ltEL",
        vac: vac === "yes", half: half, encash: encash,
        cap: Number(cap) || 0, maxRun: null,
        accKey: freq === "year" ? "hla26.acc.cl" : freq === "month" ? "hla26.acc.sl" : "hla26.acc.duty",
        accVars: { n: Number(rate) || 0 }, yearly: freq === "event" ? null : Number(rate) || 0,
      });
    }

    return (
      <Card>
        <Panel title={t("hla26.add.title")} sub={onDraft ? null : t("hla26.add.onlyDraft")} onClose={onClose}>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 14 }}>
            <div style={{ width: 150 }}>
              <Field id="hla26-code" label={t("hla26.add.code")}>
                <Input id="hla26-code" value={code} onChange={setCode} invalid={!!err.code} />
              </Field>
              <FieldError>{err.code}</FieldError>
            </div>
            <div style={{ flex: "1 1 260px", minWidth: 220 }}>
              <Field id="hla26-name" label={t("hla26.add.name")}>
                <Input id="hla26-name" value={name} onChange={setName} />
              </Field>
            </div>
            <div style={{ width: 120 }}>
              <Field id="hla26-rate" label={t("hla26.add.rate")}>
                <Input id="hla26-rate" value={rate} onChange={setRate} inputMode="decimal" />
              </Field>
            </div>
            <div style={{ width: 230 }}>
              <Field id="hla26-freq" label={t("hla26.add.freq")}>
                <Select id="hla26-freq" value={freq} onChange={setFreq} options={[
                  { value: "year", label: t("hla26.add.freq.year") },
                  { value: "month", label: t("hla26.add.freq.month") },
                  { value: "event", label: t("hla26.add.freq.event") },
                ]} />
              </Field>
            </div>
            <div style={{ width: 200 }}>
              <Field id="hla26-cap" label={t("hla26.add.cap")}>
                <Input id="hla26-cap" value={cap} onChange={setCap} inputMode="numeric" />
              </Field>
            </div>
          </div>
          <div style={{ display: "flex", gap: 26, flexWrap: "wrap", marginBottom: 6 }}>
            <Switch id="hla26-encash" checked={encash} onChange={setEncash} label={t("hla26.add.encash")} />
            <Switch id="hla26-half" checked={half} onChange={setHalf} label={t("hla26.add.half")} />
          </div>
          <ChoiceList
            name="hla26-vac" value={vac} onChange={(v) => { setVac(v); setErr((e) => Object.assign({}, e, { vac: null })); }}
            label={t("hla26.add.vac")} error={err.vac}
            options={[
              { value: "yes", label: t("hla26.vac.yes"), note: t("hla26.prev.teacher") + " · " + t("hla26.prev.admin") },
              { value: "no", label: t("hla26.vac.no"), note: t("hla26.prev.admin") },
            ]}
          />
          {!onDraft ? (
            <div style={{ marginTop: 14 }}>
              <Field id="hla26-add-eff" label={t("hla.effFrom")}>
                <Input id="hla26-add-eff" type="date" value={eff} onChange={setEff} />
              </Field>
              <ReasonField id="hla26-add-reason" value={reason} onChange={(v) => { setReason(v); setErr((e) => Object.assign({}, e, { reason: null })); }} error={err.reason} />
            </div>
          ) : null}
          <Actions>
            <Button kind="primary" onClick={submit}>{t("hla26.add.submit")}</Button>
            <Button kind="ghost" onClick={onClose}>{t("hla.act.cancel")}</Button>
          </Actions>
        </Panel>
      </Card>
    );
  }

  function BlackoutCard({ windows, types }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const never = types.filter((x) => x.neverBlocked);
    const neverList = never.map((x) => t(x.key)).join(", ");
    const cols = [
      { key: "window", label: t("hla26.bo.col.window") },
      { key: "dates", label: t("hla26.bo.col.dates") },
      { key: "blocks", label: t("hla26.bo.col.blocks") },
      { key: "when", label: "", align: "right" },
    ];
    const rows = windows.map((w) => {
      const inDays = diffDays(TODAY_ISO, w.from);
      return {
        id: w.key,
        cells: {
          window: <span style={{ fontWeight: 600 }}>{t(w.key)}</span>,
          dates: t(w.dateKey),
          blocks: t("hla26.bo.blocksN", { n: num(w.blocks.length), total: num(types.length) }),
          when: inDays > 0 ? <Chip bg={c.lateTint} fg={c.lateText}><span aria-hidden="true" style={{ display: "flex" }}><Icon name="clock" size={11} /></span><span>{t("hla26.bo.upcoming", { n: num(inDays) })}</span></Chip> : null,
        },
      };
    });
    return (
      <Register
        title={t("hla26.bo.title")} sub={t("hla26.bo.sub")}
        columns={cols} rows={rows}
        footer={
          <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
            <span style={ty("small", { color: c.ink })}>{t("hla26.bo.blocksAllBut", { list: neverList })}</span>
            <span style={ty("caption", { color: c.inkFaint })}>{t("hla26.bo.note")}</span>
            <span style={ty("caption", { color: c.inkFaint })}>{t("hla26.bo.source")}</span>
          </div>
        }
      />
    );
  }

  /* ============================================================
     HR-27 · LEAVE BALANCES REGISTER
     "what everyone has, and does it add up"

     Two things this screen refuses to fudge:
       1. the arithmetic. opening + accrued − taken = balance is
          computed, on every row and on the totals line, so the
          register can be added up by hand and it will agree.
       2. the vacation-staff rule. Choose EL and eleven teachers do
          not appear at all, with the count and the reason stated. A
          zero would read as "spent"; there is nothing to spend.
     An adjustment is money-adjacent — it takes a required reason, it
     is attributed, it is APPENDED (the previous balance stays on the
     ledger), and the panel prices the consequence before it commits.
     ============================================================ */
  function BalancesTab({ flash, setFlash, onGoTab, campus, openAt }) {
    const { c } = useTheme();
    const { t, ty, lang } = useLang();
    const [code, setCode] = useState("CL");
    const [dept, setDept] = useState("");
    const [query, setQuery] = useState("");
    const [bal, setBal] = useState(BAL);
    const [adjs, setAdjs] = useState(ADJUSTMENTS);
    const [openId, setOpenId] = useState(openAt || null);
    const [adjFor, setAdjFor] = useState(null);   /* { staffId, code } */
    const [picked, setPicked] = useState([]);
    const [bulkOpen, setBulkOpen] = useState(false);
    const [exported, setExported] = useState(false);

    const type = typeOf(code);
    /* who holds a ledger for this type at all — the vacation-staff
       rule expressed as presence, not as a zero */
    /* the campus toggle scopes the roll before anything else does */
    const roll = STAFF.filter((s) => inCampusKey(campus, s.campusKey || "lf.c.main"));
    const holders = roll.filter((s) => bal[s.id] && bal[s.id][code]);
    const excluded = roll.filter((s) => !(bal[s.id] && bal[s.id][code]));

    const filtered = useMemo(() => {
      const q = query.trim().toLowerCase();
      return holders.filter((s) => {
        if (dept && s.deptKey !== dept) return false;
        if (!q) return true;
        return t(s.nameKey).toLowerCase().indexOf(q) !== -1 || s.code.toLowerCase().indexOf(q) !== -1;
      });
      // eslint-disable-next-line
    }, [bal, code, dept, query, lang]);

    function led(staffId) { return ledgerOf(bal, staffId, code); }
    function heldFor(staffId) { return heldDays(REQUESTS, staffId, code); }

    function applyAdjustment(staffId, tcode, delta, reason, effISO) {
      setBal((prev) => {
        const row = prev[staffId][tcode];
        const next = delta > 0 ? [row[0], row[1] + delta, row[2]] : [row[0], row[1], row[2] + Math.abs(delta)];
        const person = Object.assign({}, prev[staffId]);
        person[tcode] = next;
        return Object.assign({}, prev, { [staffId]: person });
      });
      setAdjs((prev) => [{
        id: "ADJ-" + String(1000 + prev.length * 7).slice(1), staffId: staffId, code: tcode,
        delta: delta, onISO: TODAY_ISO, effISO: effISO, byKey: ME.nameKey, whyText: reason,
      }].concat(prev));
    }

    const totals = filtered.reduce((a, s) => {
      const L = led(s.id);
      return { opening: a.opening + L.opening, accrued: a.accrued + L.accrued, taken: a.taken + L.taken, balance: a.balance + L.balance, held: a.held + heldFor(s.id) };
    }, { opening: 0, accrued: 0, taken: 0, balance: 0, held: 0 });

    /* rows whose pending requests exceed what they hold — the LOP
       consequence, priced, before anybody approves anything */
    const shortRows = filtered.map((s) => {
      const L = led(s.id);
      const held = heldFor(s.id);
      return { person: s, balance: L.balance, held: held, short: Math.max(0, held - L.balance) };
    }).filter((x) => x.short > 0);

    const cols = [
      { key: "sel", label: t("hla27.col.select"), width: 34 },
      { key: "staff", label: t("hla27.col.staff") },
      { key: "kind", label: t("hla27.col.kind") },
      { key: "opening", label: t("hla27.col.opening"), align: "right", mono: true },
      { key: "accrued", label: t("hla27.col.accrued"), align: "right", mono: true },
      { key: "taken", label: t("hla27.col.taken"), align: "right", mono: true },
      { key: "balance", label: t("hla27.col.balance"), align: "right", mono: true, weight: 700 },
      { key: "held", label: t("hla27.col.held"), align: "right", mono: true },
      { key: "menu", label: "", align: "right", width: 44 },
    ];
    const rows = filtered.map((s) => {
      const L = led(s.id);
      const held = heldFor(s.id);
      const short = Math.max(0, held - L.balance);
      return {
        id: s.id,
        highlight: s.id === openId,
        cells: {
          sel: <RowCheck id={"hla27-sel-" + s.id} checked={picked.indexOf(s.id) !== -1}
            ariaLabel={t("hla27.bulk.selectAria", { name: t(s.nameKey) })}
            onChange={(v) => setPicked((p) => (v ? p.concat([s.id]) : p.filter((x) => x !== s.id)))} />,
          staff: (
            <div>
              <div style={{ fontFamily: G3.font.ui, fontSize: 13.5, color: c.ink, fontWeight: 700 }}>{t(s.nameKey)}</div>
              <div style={G3.fig("xs", { color: c.inkFaint })}>{s.code}</div>
            </div>
          ),
          kind: s.vac
            ? <Chip bg={c.leaveTint} fg={c.leaveText}>{t("hla27.kind.vac")}</Chip>
            : <Chip bg={c.ltELTint} fg={c.ltELText}>{t("hla27.kind.nonvac")}</Chip>,
          opening: num(L.opening),
          accrued: num(L.accrued),
          taken: num(L.taken),
          balance: (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 7, justifyContent: "flex-end" }}>
              <span>{num(L.balance)}</span>
              {short > 0 ? <StatusMark role="absent" glyph="alert" word={t("hla27.short.word")} /> : null}
            </span>
          ),
          held: held ? num(held) : "—",
          menu: (
            <ActionMenu
              ariaLabel={t("hla27.menu.aria", { name: t(s.nameKey) })}
              items={[
                { key: "led", icon: "filing", label: t("hla27.menu.ledger"), onSelect: () => { setOpenId(s.id); setAdjFor(null); } },
                { key: "adj", icon: "payroll", label: t("hla27.menu.adjust"), onSelect: () => { setOpenId(s.id); setAdjFor({ staffId: s.id, code: code }); } },
              ]}
            />
          ),
        },
      };
    });

    const openPerson = openId ? staffById(openId) : null;

    return (
      <div>
        <Flash text={flash} onDismiss={() => setFlash("")} />

        <div style={{ display: "flex", gap: 14, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 14 }}>
          <div style={{ width: 230 }}>
            <Field id="hla27-type" label={t("hla27.pick.type")}>
              <Select id="hla27-type" value={code} onChange={(v) => { setCode(v); setPicked([]); setAdjFor(null); }}
                options={LEDGER_TYPES.map((cd) => ({ value: cd, label: t(typeOf(cd).key) }))} />
            </Field>
          </div>
          <div style={{ width: 230 }}>
            <Field id="hla27-dept" label={t("hla27.pick.dept")}>
              <Select id="hla27-dept" value={dept} onChange={setDept}
                options={[{ value: "", label: t("hla27.dept.all") }].concat(DEPT_KEYS.map((d) => ({ value: d, label: t(d) })))} />
            </Field>
          </div>
          <div style={{ width: 260 }}>
            <Field id="hla27-q" label={t("hla27.search")}>
              <Input id="hla27-q" value={query} onChange={setQuery} trailing={<Icon name="list" size={15} />} />
            </Field>
          </div>
          <div style={{ paddingBottom: 20, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <Button kind="secondary" iconLeft="download" onClick={() => { setExported(true); setFlash(t("hla27.export.done", { by: t(ME.nameKey), time: "11:42" })); }}>{t("hla27.exportTitle")}</Button>
            <Button kind="secondary" iconLeft="check" disabled>{t("hla27.init")}</Button>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: G3.layout.gap }}>
          <span style={ty("caption", { color: c.inkFaint, display: "inline-flex", gap: 6, alignItems: "center" })}>
            <span aria-hidden="true" style={{ display: "flex" }}><Icon name="lock" size={12} /></span>
            {t("hla27.init.done", { n: num(CAMPUS_HEADCOUNT) })}
          </span>
          <span style={ty("caption", { color: c.inkFaint })}>{t("hla27.export.note")}</span>
        </div>

        {code === "EL" ? (
          <div style={{ marginBottom: G3.layout.gap }}>
            <Callout tone="leave" icon="leave"
              title={t("hla27.el.absent.head", { n: num(excluded.length) })}
              body={t("hla27.el.absent.body")}
              action={<Button kind="secondary" size="sm" iconLeft="arrow" onClick={() => onGoTab("policy")}>{t("hla27.el.absent.link")}</Button>} />
          </div>
        ) : null}

        {/* The loss-of-pay box is gone (designer, 2026-09-28). It was a
            second, louder telling of what the register's own "Short"
            mark already says on the row it belongs to — and it put a
            rupee figure at the top of a screen about days. The money
            stays where a decision is made: inside the one person's
            ledger, and on the request itself. */}

        {picked.length ? (
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", background: c.accentSoft, border: "1px solid " + c.border, borderRadius: G3.r.lg, padding: "11px 15px", marginBottom: 14 }}>
            <span style={ty("small", { color: c.ink, fontWeight: 700 })}>{t("hla27.bulk.n", { n: num(picked.length) })}</span>
            {picked.length >= 2
              ? <Button kind="primary" size="sm" iconLeft="payroll" onClick={() => setBulkOpen(true)}>{t("hla27.bulk.grant")}</Button>
              : <Button kind="primary" size="sm" iconLeft="payroll" disabled>{t("hla27.bulk.grant")}</Button>}
            {picked.length < 2 ? <span style={ty("caption", { color: c.inkMuted })}>{t("hla27.menu.adjust")}</span> : null}
            <LinkButton onClick={() => setPicked([])}>{t("hla27.bulk.clear")}</LinkButton>
          </div>
        ) : null}

        {bulkOpen ? (
          <React.Fragment>
            <BulkCreditPanel
              ids={picked} code={code}
              onClose={() => setBulkOpen(false)}
              onDone={(n, reason, eff) => {
                picked.forEach((id) => applyAdjustment(id, code, n, reason, eff));
                setFlash(t("hla27.bulk.done", { n: num(n), type: t(type.key), c: num(picked.length), by: t(ME.nameKey) }));
                setBulkOpen(false); setPicked([]);
              }}
            />
          </React.Fragment>
        ) : null}

        <div>
          <div>
            {filtered.length === 0 ? (
              <Card>
                <EmptyState
                  head={query ? t("hla27.search.empty.head", { q: query }) : t("hla27.empty.head")}
                  body={query ? t("hla27.search.empty.body") : t("hla27.empty.body")}
                  action={query ? <Button kind="secondary" onClick={() => setQuery("")}>{t("hla.act.clearFilters")}</Button> : null}
                />
              </Card>
            ) : (
              <Register
                title={t("hla27.reg.title", { type: t(type.key), n: num(filtered.length) })}
                sub={t("hla27.reg.sub", { shown: num(filtered.length), total: num(CAMPUS_HEADCOUNT) })}
                columns={cols} rows={rows}
                onSelect={(id) => { setOpenId(id); setAdjFor(null); }}
                totals={{ label: "", cells: {
                  sel: null, staff: t("hla27.totals", { n: num(filtered.length) }), kind: null,
                  opening: num(totals.opening), accrued: num(totals.accrued), taken: num(totals.taken),
                  balance: num(totals.balance), held: totals.held ? num(totals.held) : "—", menu: null,
                } }}
                footer={
                  <div style={{ display: "flex", flexDirection: "column", gap: 5, width: "100%" }}>
                    <span style={ty("caption", { color: c.inkFaint })}>{t("hla27.identity")}</span>
                    <span style={ty("caption", { color: c.inkFaint })}>{t("hla27.held.note")}</span>
                  </div>
                }
              />
            )}
          </div>
        </div>

        {/* ONE ledger, over the register rather than beside it */}
        {openId && openPerson ? (
          <SideScreen
            title={t(openPerson.nameKey)}
            sub={t(openPerson.desigKey) + " · " + t(openPerson.deptKey) + " · " + openPerson.code}
            width={660}
            onClose={() => { setOpenId(null); setAdjFor(null); }}
          >
            <LedgerPanel
              person={openPerson} bal={bal} adjs={adjs} bare
              onOpenRequest={(r) => { setOpenId(null); onGoTab && onGoTab("requests", r.id, { tab: "balances", id: openPerson.id, labelKey: "hla28c.back.ledger", name: t(openPerson.nameKey) }); }}
              adjFor={adjFor} onAdjust={(cd) => setAdjFor({ staffId: openPerson.id, code: cd })}
              onCloseAdjust={() => setAdjFor(null)}
              onCommit={(cd, delta, reason, eff) => {
                applyAdjustment(openPerson.id, cd, delta, reason, eff);
                setFlash(t("hla27.adj.done", {
                  dir: delta > 0 ? t("hla.adj.dir.credit") : t("hla.adj.dir.debit"),
                  n: num(Math.abs(delta)), type: t(typeOf(cd).key), name: t(openPerson.nameKey),
                  by: t(ME.nameKey), eff: fmt(t, eff),
                }));
                setAdjFor(null);
              }}
            />
          </SideScreen>
        ) : null}
      </div>
    );
  }

  function BulkCreditPanel({ ids, code, onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [n, setN] = useState("1");
    const [reason, setReason] = useState("");
    const [eff, setEff] = useState(TODAY_ISO);
    const [err, setErr] = useState({});
    function submit() {
      const e = {};
      const days = Number(n);
      if (!(days > 0)) e.n = t("hla27.adj.amountBad");
      if (reason.trim().length < 8) e.reason = reason.trim() ? t("hla.reason.short") : t("hla.reason.missing");
      setErr(e);
      if (Object.keys(e).length) return;
      onDone(days, reason.trim(), eff);
    }
    return (
      <Panel title={t("hla27.bulk.title", { n: num(ids.length) })} sub={t("hla27.bulk.perRow")} onClose={onClose}>
        <div style={{ marginTop: 12 }}>
          <span style={ty("caption", { color: c.inkFaint })}>{t("hla27.bulk.who")}</span>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 7 }}>
            {ids.map((id) => <Chip key={id}>{t(staffById(id).nameKey)}</Chip>)}
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 14 }}>
          <div style={{ width: 140 }}>
            <Field id="hla27-bulk-n" label={t("hla27.adj.amount")}>
              <Input id="hla27-bulk-n" value={n} onChange={setN} inputMode="decimal" invalid={!!err.n} />
            </Field>
            <FieldError>{err.n}</FieldError>
          </div>
          <div style={{ width: 200 }}>
            <Field id="hla27-bulk-eff" label={t("hla27.adj.eff")}>
              <Input id="hla27-bulk-eff" type="date" value={eff} onChange={setEff} />
            </Field>
          </div>
          <div style={{ paddingTop: 26 }}>
            <Chip bg={c.ltCompTint} fg={c.ltCompText}>{t(typeOf(code).key)}</Chip>
          </div>
        </div>
        <ReasonField id="hla27-bulk-reason" value={reason} onChange={(v) => { setReason(v); setErr((e) => Object.assign({}, e, { reason: null })); }} error={err.reason} />
        <div style={{ marginTop: 12 }}><Callout tone="late" icon="payroll" body={t("hla27.adj.money")} compact /></div>
        <Actions>
          <Button kind="primary" onClick={submit}>{t("hla27.adj.submit")}</Button>
          <Button kind="ghost" onClick={onClose}>{t("hla.act.cancel")}</Button>
        </Actions>
      </Panel>
    );
  }

  function LedgerPanel({ person, bal, adjs, adjFor, onAdjust, onCloseAdjust, onCommit, bare, onOpenRequest }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    if (!person) {
      return <Card><EmptyState head={t("hla27.menu.ledger")} body={t("hla27.identity")} /></Card>;
    }
    const mine = adjs.filter((a) => a.staffId === person.id);
    const myReqs = REQUESTS.filter((r) => r.staffId === person.id).slice().sort((a, b) => (a.from < b.from ? 1 : -1));


    /* THE LEDGER, 2026-09-28 (designer: "too much information… keep
       only necessary information, systematic, understandable at a
       glance"). It carried eight blocks; it now carries four, each
       under its own heading with a rule above it so the eye knows
       where one ends:
         1 what she holds   (the four-column table)
         2 adjust           (the buttons that change it)
         3 what changed it  (the adjustment trail, if any)
         4 what spent it    (this year's requests)
       Gone: the repeated identity note, the loss-of-pay callout with
       its derivation (money belongs on the decision, not on a reading
       screen), and the per-type reconciliation footnotes, which
       explained the demo data rather than the person. */
    function Section({ label, children, first }) {
      return (
        <div style={{ marginTop: first ? 0 : 22, paddingTop: first ? 0 : 16, borderTop: first ? "none" : "1px solid " + c.rule }}>
          <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 })}>{label}</div>
          {children}
        </div>
      );
    }

    return (
      <PaneShell
        bare={bare}
        icon="staff" iconTone={person.vac ? "leave" : "info"}
        title={t("hla27.led.title", { name: t(person.nameKey) })}
        sub={t("hla27.led.meta", { desig: t(person.desigKey), dept: t(person.deptKey), code: person.code })}
      >
        <div style={{ marginBottom: 16 }}>
          <StatusMark
            role={person.vac ? "leave" : "ltEL"}
            glyph={person.vac ? "leave" : "briefcase"}
            word={person.vac ? t("hla27.led.kindVac") : t("hla27.led.kindNon")}
          />
        </div>

        <Section label={t("hla27.led.balances")} first>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th scope="col" style={ty("colLabel", { color: c.inkFaint, textAlign: "left", padding: "0 6px 7px", textTransform: "uppercase" })}>{t("hla26.col.type")}</th>
              {["opening", "accrued", "taken", "balance"].map((k) => (
                <th key={k} scope="col" style={ty("colLabel", { color: c.inkFaint, textAlign: "right", padding: "0 6px 7px", textTransform: "uppercase" })}>{t("hla27.col." + k)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {LEDGER_TYPES.map((cd) => {
              const L = ledgerOf(bal, person.id, cd);
              return (
                <tr key={cd} style={{ borderTop: "1px solid " + c.rule }}>
                  <td style={ty("small", { padding: "8px 6px", color: L ? c.ink : c.inkFaint })}>
                    {t(typeOf(cd).key)}
                    {!L ? <span style={ty("caption", { display: "block", color: c.penaltyText, fontWeight: 700 })}>{t("hla27.led.none")}</span> : null}
                  </td>
                  {L ? ["opening", "accrued", "taken", "balance"].map((k) => (
                    <td key={k} style={G3.fig("sm", { padding: "8px 6px", textAlign: "right", color: c.ink, fontWeight: k === "balance" ? 700 : 500 })}>{num(L[k])}</td>
                  )) : <td colSpan={4} style={ty("caption", { padding: "8px 6px", textAlign: "right", color: c.inkFaint })}>—</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
        <p style={ty("caption", { margin: "10px 2px 0", color: c.inkFaint })}>{t("hla27.identity")}</p>
        </Section>

        <Section label={t("hla27.adj.heading")}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {LEDGER_TYPES.filter((cd) => ledgerOf(bal, person.id, cd)).map((cd) => (
            <Button key={cd} kind="secondary" size="sm" onClick={() => onAdjust(cd)}>{t(typeOf(cd).key)}</Button>
          ))}
        </div>

        {adjFor && adjFor.staffId === person.id ? (
          <AdjustPanel person={person} code={adjFor.code} bal={bal} onClose={onCloseAdjust} onCommit={onCommit} />
        ) : null}
        </Section>

        {mine.length ? (
          <Section label={t("hla27.led.adjustments")}>
          <div>
            <Trail items={mine.map((a) => ({
              key: a.id,
              icon: a.delta > 0 ? "arrowUp" : "arrow",
              head: (a.delta > 0 ? t("hla.adj.dir.credit") : t("hla.adj.dir.debit")) + " " + num(Math.abs(a.delta)) + " · " + t(typeOf(a.code).key),
              body: a.whyKey ? t(a.whyKey) : a.whyText,
              meta: t("hla.by", { name: t(a.byKey), date: fmt(t, a.onISO) }) + " · " + t("hla.effFrom") + " " + fmt(t, a.effISO) + " · " + a.id,
            }))} />
            <p style={ty("caption", { margin: "10px 0 0", color: c.inkFaint })}>{t("hla.appendOnly")}</p>
          </div>
          </Section>
        ) : null}

        <Section label={t("hla27.led.requests")}>
        {myReqs.length === 0 ? <p style={ty("small", { margin: 0, color: c.inkMuted })}>{t("hla27.led.noRequests")}</p> : (
          <div>
            {myReqs.map((r) => (
              <div key={r.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", padding: "7px 0", borderBottom: "1px solid " + c.rule }}>
                <span style={{ minWidth: 0 }}>
                  <span style={ty("small", { display: "block", color: c.ink })}>{fmtRange(t, r.from, r.to)}</span>
                  <span style={G3.fig("xs", { color: c.inkFaint })}>{r.id} · {typeOf(r.code).code}</span>
                </span>
                <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={G3.fig("xs", { color: c.inkMuted })}>{num(r.days)}</span>
                  <StatusMark
                    role={r.status === "approved" ? "present" : r.status === "pending" ? "late" : r.status === "rejected" ? "absent" : "off"}
                    glyph={r.status === "approved" ? "check" : r.status === "pending" ? "clock" : r.status === "rejected" ? "alert" : "arrow"}
                    word={t("hla28.st." + r.status)} />
                  {/* the row now GOES somewhere: the request itself, on
                      the tab that owns it */}
                  <Button kind="secondary" size="sm" iconLeft="arrow" onClick={() => onOpenRequest && onOpenRequest(r)}>{t("hla27.led.openReq")}</Button>
                </span>
              </div>
            ))}
          </div>
        )}
        </Section>
      </PaneShell>
    );
  }

  function AdjustPanel({ person, code, bal, onClose, onCommit }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [dir, setDir] = useState("credit");
    const [n, setN] = useState("1");
    const [reason, setReason] = useState("");
    const [eff, setEff] = useState(TODAY_ISO);
    const [err, setErr] = useState({});
    const L = ledgerOf(bal, person.id, code);
    const days = Number(n);
    const delta = dir === "credit" ? days : -days;
    const after = L.balance + (days > 0 ? delta : 0);
    const goesNegative = days > 0 && after < 0;

    function submit() {
      const e = {};
      if (!(days > 0)) e.n = t("hla27.adj.amountBad");
      if (reason.trim().length < 8) e.reason = reason.trim() ? t("hla.reason.short") : t("hla.reason.missing");
      setErr(e);
      if (Object.keys(e).length) return;
      onCommit(code, delta, reason.trim(), eff);
    }

    return (
      <Panel pop title={t("hla27.adj.title", { type: t(typeOf(code).key), name: t(person.nameKey) })} onClose={onClose}>
        <ChoiceList
          name={"hla27-dir-" + person.id + "-" + code} value={dir} onChange={setDir} label={t("hla27.adj.dir")}
          options={[
            { value: "credit", label: t("hla27.adj.credit") },
            { value: "debit", label: t("hla27.adj.debit") },
          ]}
        />
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 14 }}>
          <div style={{ width: 120 }}>
            <Field id={"hla27-adj-n-" + code} label={t("hla27.adj.amount")}>
              <Input id={"hla27-adj-n-" + code} value={n} onChange={setN} inputMode="decimal" invalid={!!err.n} />
            </Field>
            <FieldError>{err.n}</FieldError>
          </div>
          <div style={{ width: 190 }}>
            <Field id={"hla27-adj-eff-" + code} label={t("hla27.adj.eff")}>
              <Input id={"hla27-adj-eff-" + code} type="date" value={eff} onChange={setEff} />
            </Field>
          </div>
        </div>
        <div style={{ display: "flex", gap: 22, flexWrap: "wrap", padding: "10px 0" }}>
          <span><span style={ty("caption", { display: "block", color: c.inkFaint })}>{t("hla27.adj.now")}</span><span style={G3.fig("md", { color: c.ink })}>{num(L.balance)}</span></span>
          <span aria-hidden="true" style={{ alignSelf: "center", color: c.inkFaint, display: "flex" }}><Icon name="arrow" size={16} /></span>
          <span><span style={ty("caption", { display: "block", color: c.inkFaint })}>{t("hla27.adj.after")}</span>
            <span style={G3.fig("md", { color: goesNegative ? c.dangerText : c.ink, fontWeight: 700 })}>{num(after)}</span></span>
        </div>
        {goesNegative ? <Callout tone="absent" icon="alert" body={t("hla27.adj.negWarn")} compact /> : null}
        <ReasonField id={"hla27-adj-why-" + code} value={reason} onChange={(v) => { setReason(v); setErr((e) => Object.assign({}, e, { reason: null })); }} error={err.reason} />
        <div style={{ marginTop: 10 }}><Callout tone="late" icon="payroll" body={t("hla27.adj.money")} compact /></div>
        <Actions>
          <Button kind="primary" onClick={submit}>{t("hla27.adj.submit")}</Button>
          <Button kind="ghost" onClick={onClose}>{t("hla.act.cancel")}</Button>
        </Actions>
        <Note>{t("hla27.adj.append")}</Note>
      </Panel>
    );
  }

  /* ============================================================
     HR-28 · LEAVE REQUESTS CONSOLE
     "which requests are stuck, campus-wide"

     HR administers; HR does not decide (M8 §Permissions). There is no
     approve control on this screen — not disabled, ABSENT — because
     the HR Operator role does not hold `leave.approve` at all. What HR
     can do is exactly three things, and each takes a reason: apply on
     somebody's behalf, move a stuck approval, cancel.
     The console shows the leave TYPE, because HR-28 §Must contain says
     so and because HR has to act on it. The free-text REASON is only
     ever read inside one open request. The campus day-view underneath
     is a SHARED surface, so it says "on leave" and nothing else.
     ============================================================ */
  /* ============================================================
     HR-28 · LEAVE REQUESTS — A TRACKER, NOT A QUEUE

     HR does not decide leave. Not for a department, not for a
     campus, not when a request has been sitting for a week. The
     chain is head of department -> principal -> director, and HR
     appears nowhere in it.

     So this screen has no approve, no decline, no "move the
     approval elsewhere" and no "apply on somebody's behalf". Those
     controls are ABSENT rather than disabled: a right the role
     never holds is not drawn (docs/ui-compliance-requirements.md).

     What HR does hold is the record. Where every request is sitting,
     which ones have passed the service level, what was finally
     decided and by whom, and the export that carries all of it into
     payroll's month. That is this screen.
     ============================================================ */
  const LF = window.LeaveFlow;

  function hrStuck(r) { return LF.statusOf(r) === "pending" && LF.ageOf(r) >= POLICY.slaWorkingDays; }

  function RequestsTab({ flash, setFlash, campus, target, back, onBack }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const reqs = LF.useRequests().filter((r) => inCampusKey(campus, r.person.campusKey));
    const [f, setF] = useState({ status: "", dept: "", stage: "", type: "", range: "all", stuck: false });
    const [openId, setOpenId] = useState(target || null);
    const [act, setAct] = useState(null);
    const [notes, setNotes] = useState({});
    const [nudged, setNudged] = useState({});
    const [moved, setMoved] = useState({});
    /* the filters are open by design (designer, 2026-09-28): on a
       29-row campus queue, "which of these is mine to chase" is the
       first question, not a second one hidden behind a link */
    const [showFilters, setShowFilters] = useState(true);
    /* the two views of one campus fortnight */
    const [view, setView] = useState("queue");
    const [calDay, setCalDay] = useState(TODAY_ISO);

    const stuckList = reqs.filter(hrStuck).sort((a, b) => LF.ageOf(b) - LF.ageOf(a));

    const filtered = reqs.filter((r) => {
      if (f.status && LF.statusOf(r) !== f.status) return false;
      if (f.dept && r.person.deptKey !== f.dept) return false;
      if (f.stage && LF.waitingRole(r) !== f.stage) return false;
      if (f.type && r.type !== f.type) return false;
      if (f.stuck && !hrStuck(r)) return false;
      if (f.range === "month" && (r.from < "2026-08-01" || r.from > "2026-08-31")) return false;
      if (f.range === "future" && r.from < TODAY_ISO) return false;
      return true;
    }).sort((a, b) => {
      const pa = LF.statusOf(a) === "pending", pb = LF.statusOf(b) === "pending";
      if (pa !== pb) return pa ? -1 : 1;
      return LF.ageOf(b) - LF.ageOf(a);
    });

    const open = openId ? reqs.filter((r) => r.id === openId)[0] : null;

    /* the only question this tab answers before you open anything:
       where is the queue sitting, and how much of it is late */
    function stageN(stage) { return reqs.filter((r) => LF.isWaitingOn(r, stage)).length; }
    const settledN = reqs.filter((r) => !LF.waitingRole(r)).length;
    const openN = stageN("deptHead") + stageN("principal") + stageN("director");
    const openReqs = reqs.filter((r) => !!LF.waitingRole(r));
    const oldestWait = openReqs.reduce((m, r) => Math.max(m, LF.ageOf(r) || 0), 0);
    const openDays = openReqs.reduce((n, r) => n + (r.days || 0), 0);

    const filterCount = (f.status ? 1 : 0) + (f.dept ? 1 : 0) + (f.stage ? 1 : 0) + (f.type ? 1 : 0) + (f.range !== "all" ? 1 : 0) + (f.stuck ? 1 : 0);

    function rowMenu(r) {
      const decided = LF.statusOf(r) !== "pending";
      const started = LF.hasStarted ? LF.hasStarted(r) : r.from <= TODAY_ISO;
      const items = [
        { key: "open", icon: "document", label: t("hla28c.act.open"), onSelect: () => setOpenId(r.id) },
      ];
      if (!decided) {
        items.push({
          key: "nudge", icon: "mail", label: t("hla28c.act.nudge"),
          disabled: !!nudged[r.id], reason: nudged[r.id] ? t("hla28c.act.nudgedAlready") : undefined,
          onSelect: () => setAct({ kind: "nudge", req: r }),
        });
        items.push({ key: "move", icon: "arrow", label: t("hla28c.act.move"), onSelect: () => setAct({ kind: "move", req: r }) });
      } else {
        items.push({ key: "nudge", icon: "mail", label: t("hla28c.act.nudge"), disabled: true, reason: t("hla28c.act.decidedAlready") });
      }
      items.push({ key: "note", icon: "document", label: t("hla28c.act.note"), onSelect: () => setAct({ kind: "note", req: r }) });
      items.push({
        key: "cancel", icon: "arrow", label: t("hla28c.act.cancel"), tone: "danger",
        disabled: decided || started,
        reason: decided ? t("hla28c.act.cancelDecided") : started ? t("hla28c.act.cancelStarted") : undefined,
        onSelect: !decided && !started ? () => setAct({ kind: "cancel", req: r }) : undefined,
      });
      return items;
    }

    return (
      <div>
        <Flash text={flash} onDismiss={() => setFlash("")} />

        {/* two views, named. The calendar used to be a mile below the
            queue, which is the same as not existing. */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: G3.layout.gap }}>
          <div style={{ display: "flex", gap: 6, background: c.sunken, borderRadius: G3.r.pill, padding: 3, width: "fit-content" }}>
          {[{ k: "queue", label: t("hla28c.view.queue") }, { k: "away", label: t("hla28c.view.away") }].map((v) => (
            <button
              key={v.k} type="button" aria-pressed={view === v.k ? "true" : "false"}
              onClick={() => setView(v.k)}
              style={ty("small", {
                border: "none", borderRadius: G3.r.pill, padding: "8px 18px", cursor: "pointer",
                background: view === v.k ? c.surface : "transparent",
                color: view === v.k ? c.ink : c.inkMuted, fontWeight: view === v.k ? 700 : 600,
              })}
            >
              {v.label}
            </button>
          ))}
          </div>
          {/* the two things HR does to the whole queue sit beside the
              view they act on, not in a header bar over the figures */}
          {view === "queue" ? (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Button kind="secondary" size="sm" iconLeft="download" onClick={() => setFlash(t("hla27.export.done", { by: t(ME.nameKey), time: "11:44" }))}>{t("hla.act.export")}</Button>
              <Button kind="primary" size="sm" iconLeft="leave" onClick={() => setAct({ kind: "behalf" })}>{t("hla28c.act.behalf")}</Button>
            </div>
          ) : null}
        </div>

        {view === "away" ? (
          <AwayCalendar reqs={reqs} day={calDay} onDay={setCalDay} />
        ) : (
        <React.Fragment>

        {/* WHERE IT IS SITTING. The mix across the top says how much of
            the queue is at each rung; the strip under it says what that
            costs. Tapping a band filters the register, as the four
            figures used to. */}
        <Band
          head={t("hla28c.band.title")}
          metrics={[
            { k: "open", label: t("hla28c.m.open"), value: num(openN), n: openN, total: true,
              note: t("hla28c.m.openNote"), tone: c.chartAmber },
            { k: "stuck", label: t("hla28c.f.stuck"), value: num(stuckList.length), n: stuckList.length,
              note: t("hla28c.m.stuckNote", { n: num(POLICY.slaWorkingDays) }),
              tone: c.absentChart || c.absent, warn: stuckList.length > 0 },
            /* a duration, not a count of anybody */
            { k: "oldest", label: t("hla28c.m.oldest"), value: num(oldestWait), bar: false,
              note: t("hla28c.m.oldestNote"), tone: c.chartPurple },
            { k: "days", label: t("hla28c.m.days"), value: num(openDays), bar: false,
              note: t("hla28c.m.daysNote"), tone: c.chartTeal },
          ]}
        />

        {/* FILTERS, folded away — six selects above a table read as
            work to be done before the work. The control that unfolds
            them belongs at the end of the row, beside the table it
            narrows, and not adrift at the left on a line of its own
            (designer). */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", justifyContent: "flex-end", margin: G3.layout.gap + "px 2px 12px" }}>
          {filterCount ? (
            <React.Fragment>
              <StatusMark role="info" word={t("hla28c.filters.on", { n: num(filterCount) })} glyph="list" />
              <LinkButton onClick={() => setF({ status: "", dept: "", stage: "", type: "", range: "all", stuck: false })}>{t("hla28c.filters.clear")}</LinkButton>
            </React.Fragment>
          ) : null}
          <Button
            kind="secondary" size="sm" iconLeft="list"
            onClick={() => setShowFilters((v) => !v)}
          >{showFilters ? t("hla28c.filters.hide") : t("hla28c.filters.show")}</Button>
        </div>

        {showFilters ? (
          <div style={{ display: "flex", gap: 14, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 16 }}>
            <div style={{ flex: "1 1 190px", minWidth: 0 }}>
              <Field id="hla28-status" label={t("hla28.f.status")}>
                <Select id="hla28-status" value={f.status} onChange={(v) => setF(Object.assign({}, f, { status: v }))}
                  options={[{ value: "", label: t("hla28.f.status.all") }].concat(["pending", "approved", "rejected", "cancelled"].map((k) => ({ value: k, label: t("lf.st." + k) })))} />
              </Field>
            </div>
            <div style={{ flex: "1 1 190px", minWidth: 0 }}>
              <Field id="hla28-stage" label={t("hla28b.f.stage")}>
                <Select id="hla28-stage" value={f.stage} onChange={(v) => setF(Object.assign({}, f, { stage: v }))}
                  options={[{ value: "", label: t("hla28b.f.stageAll") }, { value: "deptHead", label: t("lf.st.withHead") }, { value: "principal", label: t("lf.st.withPrincipal") }, { value: "director", label: t("lf.st.withDirector") }]} />
              </Field>
            </div>
            <div style={{ flex: "1 1 190px", minWidth: 0 }}>
              <Field id="hla28-dept" label={t("hla28.f.dept")}>
                <Select id="hla28-dept" value={f.dept} onChange={(v) => setF(Object.assign({}, f, { dept: v }))}
                  options={[{ value: "", label: t("hla28.f.dept.all") }].concat(Object.keys(LF.DEPTS).map((d) => ({ value: d, label: t(LF.DEPTS[d]) })))} />
              </Field>
            </div>
            <div style={{ flex: "1 1 170px", minWidth: 0 }}>
              <Field id="hla28-type" label={t("hla28.f.type")}>
                <Select id="hla28-type" value={f.type} onChange={(v) => setF(Object.assign({}, f, { type: v }))}
                  options={[{ value: "", label: t("hla28.f.type.all") }].concat(["CL", "SL", "COMP", "EL"].map((k) => ({ value: k, label: t(LF.typeOf(k).key) })))} />
              </Field>
            </div>
            <div style={{ flex: "1 1 170px", minWidth: 0 }}>
              <Field id="hla28-range" label={t("hla28.f.range")}>
                <Select id="hla28-range" value={f.range} onChange={(v) => setF(Object.assign({}, f, { range: v }))}
                  options={[
                    { value: "all", label: t("hla28.f.range.all") },
                    { value: "month", label: t("hla28.f.range.month") },
                    { value: "future", label: t("hla28.f.range.future") },
                  ]} />
              </Field>
            </div>
            <div style={{ paddingBottom: 20, flex: "0 0 auto" }}>
              <Switch id="hla28-stuck" checked={f.stuck} onChange={(v) => setF(Object.assign({}, f, { stuck: v }))} label={t("hla28.f.stuck")} />
            </div>
          </div>
        ) : null}

        {/* THE QUEUE, at the width it deserves */}
        <LF.QueueTable
          title={t("hla28.reg.title")}
          sub={t("hla28.reg.sub", { shown: num(filtered.length), total: num(reqs.length) })}
          rows={filtered} selected={openId} onSelect={setOpenId}
          you="hr" stage
          actions={(r) => <ActionMenu ariaLabel={t("hla28c.menu.aria", { id: r.id })} items={rowMenu(r)} size={30} />}
          emptyHead={t("hla28.empty.head")} emptyBody={t("hla28.empty.body")}
        />

        </React.Fragment>
        )}

        {/* THE REQUEST, opened over the queue rather than beside it */}
        {open ? (
          <SideScreen
            /* the person is the heading, here as in the panel itself:
               the reference is the one thing on this screen nobody
               decides anything by */
            title={t(open.person.nameKey)}
            sub={open.id + " · " + t(LF.DEPTS[open.person.deptKey])}
            width={620}
            onClose={() => setOpenId(null)}
            back={back && open.id === target ? { label: t(back.labelKey, { name: back.name }), onBack: onBack } : null}
            footer={
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end", width: "100%" }}>
                {LF.statusOf(open) === "pending" ? (
                  <React.Fragment>
                    {/* asking is the ordinary act and carries the
                        primary; moving an approval past somebody is
                        the heavier one, in the green outline */}
                    <Button kind="primary" size="sm" iconLeft="mail" disabled={!!nudged[open.id]} onClick={nudged[open.id] ? undefined : () => setAct({ kind: "nudge", req: open })}>{t("hla28c.act.nudge")}</Button>
                    <Button kind="successOutline" size="sm" iconLeft="arrow" onClick={() => setAct({ kind: "move", req: open })}>{t("hla28c.act.move")}</Button>
                  </React.Fragment>
                ) : null}
                <Button kind="secondary" size="sm" iconLeft="document" onClick={() => setAct({ kind: "note", req: open })}>{t("hla28c.act.note")}</Button>
                <Button kind="ghost" size="sm" onClick={() => setOpenId(null)}>{t("hla.act.close")}</Button>
              </div>
            }
          >
            <RequestBody
              req={open}
              note={notes[open.id]}
              nudged={nudged[open.id]}
              movedTo={moved[open.id]}
            />
          </SideScreen>
        ) : null}

        {act && act.kind === "nudge" ? (
          <NudgePanel
            req={act.req}
            onClose={() => setAct(null)}
            onDone={() => {
              setNudged(Object.assign({}, nudged, { [act.req.id]: true }));
              setFlash(t("hla28c.nudge.done", { who: t(approverNameKeyFor(act.req)), id: act.req.id }));
              setAct(null);
            }}
          />
        ) : null}
        {act && act.kind === "move" ? (
          <MoveApprovalPanel
            req={act.req}
            onClose={() => setAct(null)}
            onDone={(toKey) => {
              setMoved(Object.assign({}, moved, { [act.req.id]: toKey }));
              setFlash(t("hla28c.move.done", { id: act.req.id, who: t(toKey) }));
              setAct(null);
            }}
          />
        ) : null}
        {act && act.kind === "note" ? (
          <NotePanel
            req={act.req}
            existing={notes[act.req.id]}
            onClose={() => setAct(null)}
            onDone={(text) => {
              setNotes(Object.assign({}, notes, { [act.req.id]: text }));
              setFlash(t("hla28c.note.done", { id: act.req.id }));
              setAct(null);
            }}
          />
        ) : null}
        {act && act.kind === "cancel" ? (
          <CancelOnBehalfPanel
            req={act.req}
            onClose={() => setAct(null)}
            onDone={() => {
              setFlash(t("hla28c.cancel.done", { id: act.req.id, who: t(act.req.person.nameKey) }));
              setAct(null);
            }}
          />
        ) : null}
        {act && act.kind === "behalf" ? (
          <ApplyOnBehalfPanel
            onClose={() => setAct(null)}
            onDone={(who) => {
              setFlash(t("hla28c.behalf.done", { who: who }));
              setAct(null);
            }}
          />
        ) : null}
      </div>
    );
  }

  /* the record of one request, read top to bottom: what was asked,
     where it is, what HR has already done to it */
  function RequestBody({ req, note, nudged, movedTo }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const cover = req.coverWith ? LF.personById(req.coverWith.who) : null;
    const facts = [
      { k: t("lf.fact.cover"), v: cover ? LF.coverLine(t, req) : t("lf.fact.coverNone"), tone: LF.coverState(req) === "declined" ? "absentText" : null },
      req.shortDays ? { k: t("lf.fact.unpaid"), v: LF.unpaidText(t, req.shortDays), tone: "penaltyText" } : null,
      { k: t("lf.fact.month"), v: t("hla28b.month", { mon: t("hla.mo." + Number(req.from.split("-")[1])) }) },
    ];
    return (
      <div>
        <LF.RequestPanel req={req} you="hr" facts={facts} bare />

        {(nudged || movedTo || note) ? (
          <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid " + c.rule }}>
            <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 8 })}>{t("hla28c.hrTrail")}</div>
            {nudged ? <p style={ty("small", { margin: "0 0 6px", color: c.inkMuted })}>{t("hla28c.trail.nudged", { by: t(ME.nameKey) })}</p> : null}
            {movedTo ? <p style={ty("small", { margin: "0 0 6px", color: c.inkMuted })}>{t("hla28c.trail.moved", { who: t(movedTo), by: t(ME.nameKey) })}</p> : null}
            {note ? (
              <p style={ty("small", { margin: 0, color: c.ink })}>
                <span style={ty("caption", { color: c.inkFaint })}>{t("hla28c.trail.note", { by: t(ME.nameKey) })} </span>
                {note}
              </p>
            ) : null}
          </div>
        ) : null}

        <p style={ty("caption", { margin: "18px 0 0", paddingTop: 14, borderTop: "1px solid " + c.rule, color: c.inkFaint })}>{t("hla28c.noDecide")}</p>
      </div>
    );
  }

  /* ---- HR's four actions on somebody else's decision ---------- */

  /* who the nudge goes to: the department's approver while it is with
     the head, the principal after it climbs, the director past that */
  function approverNameKeyFor(req) {
    const stage = LF.waitingRole(req);
    if (stage === "principal") return "hla.p.radhika";
    if (stage === "director") return "hla.p.vikram";
    const a = approverFor(req.person.deptKey);
    return (a && a.nameKey) || "hla.p.radhika";
  }

  function NudgePanel({ req, onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [line, setLine] = useState("");
    return (
      <Panel pop title={t("hla28c.nudge.title")} sub={t("hla28c.nudge.sub", { id: req.id, n: num(LF.ageOf(req)) })} onClose={onClose} width={540}>
        <DefRow label={t("hla28c.p.person")}>{t(req.person.nameKey)}</DefRow>
        <DefRow label={t("hla28c.p.sittingWith")}>{t("lf.st." + (LF.waitingRole(req) === "deptHead" ? "withHead" : LF.waitingRole(req) === "principal" ? "withPrincipal" : "withDirector"))}</DefRow>
        <DefRow label={t("hla28c.p.waiting")}>{t("hla28c.p.waitingD", { n: num(LF.ageOf(req)), sla: num(POLICY.slaWorkingDays) })}</DefRow>
        <div style={{ marginTop: 16 }}>
          <ReasonField
            id="hla28c-nudge-line" label={t("hla28c.nudge.line")} hint={t("hla28c.nudge.lineHint")}
            value={line} onChange={setLine} rows={2} placeholder={t("hla28c.nudge.linePh")}
          />
        </div>
        <p style={ty("caption", { color: c.inkFaint, margin: "4px 0 0" })}>{t("hla28c.nudge.note")}</p>
        <Actions>
          <Button kind="primary" iconLeft="mail" onClick={onDone}>{t("hla28c.nudge.confirm")}</Button>
          <LinkButton onClick={onClose}>{t("hla.act.close")}</LinkButton>
        </Actions>
      </Panel>
    );
  }

  function MoveApprovalPanel({ req, onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [to, setTo] = useState("");
    const [why, setWhy] = useState("");
    const [err, setErr] = useState({});

    function submit() {
      const e = {};
      if (!to) e.to = "hla28c.move.errTo";
      if (why.trim().length < 8) e.why = "hla28c.move.errWhy";
      setErr(e);
      if (Object.keys(e).length) return;
      onDone(to);
    }

    return (
      <Panel pop title={t("hla28c.move.title")} sub={t("hla28c.move.sub", { id: req.id })} onClose={onClose} width={560}>
        <DefRow label={t("hla28c.p.person")}>{t(req.person.nameKey)}</DefRow>
        <DefRow label={t("hla28c.p.sittingWith")}>{t("lf.st." + (LF.waitingRole(req) === "deptHead" ? "withHead" : LF.waitingRole(req) === "principal" ? "withPrincipal" : "withDirector"))}</DefRow>

        <div style={{ marginTop: 16 }}>
          <Field id="hla28c-move-to" label={t("hla28c.move.to")} error={err.to ? t(err.to) : null}>
            <Select
              id="hla28c-move-to" value={to} onChange={(v) => { setTo(v); setErr({}); }}
              options={[{ value: "", label: t("hla28c.move.toPh") }].concat(APPROVER_POOL.map((a) => ({ value: a.nameKey, label: t(a.nameKey) + " · " + t(a.roleKey) })))}
            />
          </Field>
          <ReasonField
            id="hla28c-move-why" label={t("hla28c.move.why")} hint={t("hla28c.move.whyHint")}
            value={why} onChange={(v) => { setWhy(v); setErr({}); }} error={err.why ? t(err.why) : null} rows={3}
            placeholder={t("hla28c.move.whyPh")}
          />
        </div>
        <p style={ty("caption", { color: c.inkFaint, margin: "4px 0 0" })}>{t("hla28c.move.note")}</p>
        <Actions>
          <Button kind="primary" iconLeft="arrow" onClick={submit}>{t("hla28c.move.confirm")}</Button>
          <LinkButton onClick={onClose}>{t("hla.act.close")}</LinkButton>
        </Actions>
      </Panel>
    );
  }

  function NotePanel({ req, existing, onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [text, setText] = useState(existing || "");
    const [err, setErr] = useState(false);
    return (
      <Panel pop title={t("hla28c.note.title")} sub={t("hla28c.note.sub", { id: req.id })} onClose={onClose} width={540}>
        <ReasonField
          id="hla28c-note" label={t("hla28c.note.label")} hint={t("hla28c.note.hint")}
          value={text} onChange={(v) => { setText(v); setErr(false); }} error={err ? t("hla28c.note.err") : null} rows={4}
          placeholder={t("hla28c.note.ph")}
        />
        <p style={ty("caption", { color: c.inkFaint, margin: "4px 0 0" })}>{t("hla28c.note.note")}</p>
        <Actions>
          <Button kind="primary" iconLeft="document" onClick={() => { if (text.trim().length < 8) { setErr(true); return; } onDone(text.trim()); }}>{t("hla28c.note.confirm")}</Button>
          <LinkButton onClick={onClose}>{t("hla.act.close")}</LinkButton>
        </Actions>
      </Panel>
    );
  }

  function CancelOnBehalfPanel({ req, onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [why, setWhy] = useState("");
    const [err, setErr] = useState(false);
    return (
      <Panel pop title={t("hla28c.cancel.title")} sub={t("hla28c.cancel.sub", { id: req.id, who: t(req.person.nameKey) })} onClose={onClose} width={560}>
        <DefRow label={t("hla28c.p.dates")}>{fmtRange(t, req.from, req.to)}</DefRow>
        <DefRow label={t("hla28c.p.sittingWith")}>{t("lf.st." + (LF.waitingRole(req) === "deptHead" ? "withHead" : LF.waitingRole(req) === "principal" ? "withPrincipal" : "withDirector"))}</DefRow>

        <div style={{ marginTop: 16 }}>
          <ReasonField
            id="hla28c-cancel-why" label={t("hla28c.cancel.why")} hint={t("hla28c.cancel.whyHint")}
            value={why} onChange={(v) => { setWhy(v); setErr(false); }} error={err ? t("hla28c.cancel.err") : null} rows={3}
            placeholder={t("hla28c.cancel.whyPh")}
          />
        </div>
        <p style={ty("caption", { color: c.inkFaint, margin: "4px 0 14px" })}>{t("hla28c.cancel.note")}</p>
        <Actions>
          <Button kind="primary" onClick={() => { if (why.trim().length < 8) { setErr(true); return; } onDone(); }}>{t("hla28c.cancel.confirm")}</Button>
          <LinkButton onClick={onClose}>{t("hla.act.close")}</LinkButton>
        </Actions>
      </Panel>
    );
  }

  /* the one request HR creates rather than watches: somebody with no
     phone, whose leave still has to exist on the record */
  function ApplyOnBehalfPanel({ onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [who, setWho] = useState("");
    const [code, setCode] = useState("");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [why, setWhy] = useState("");
    const [err, setErr] = useState({});

    const person = who ? staffById(who) : null;
    const days = from && to ? Math.max(1, diffDays(from, to) + 1) : 0;

    function submit() {
      const e = {};
      if (!who) e.who = "hla28c.behalf.errWho";
      if (!code) e.code = "hla28c.behalf.errType";
      if (!from || !to) e.dates = "hla28c.behalf.errDates";
      else if (to < from) e.dates = "hla28c.behalf.errOrder";
      if (why.trim().length < 8) e.why = "hla28c.behalf.errWhy";
      setErr(e);
      if (Object.keys(e).length) return;
      onDone(t(person.nameKey));
    }

    return (
      <Panel title={t("hla28c.behalf.title")} sub={t("hla28c.behalf.sub")} onClose={onClose} width={580}>
        <Field id="hla28c-b-who" label={t("hla28c.behalf.who")} hint={t("hla28c.behalf.whoHint")} error={err.who ? t(err.who) : null}>
          <Select
            id="hla28c-b-who" value={who} onChange={(v) => { setWho(v); setErr({}); }}
            options={[{ value: "", label: t("hla28c.behalf.whoPh") }].concat(STAFF.map((s) => ({ value: s.id, label: t(s.nameKey) + " · " + t(s.deptKey) })))}
          />
        </Field>

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 180px", minWidth: 0 }}>
            <Field id="hla28c-b-type" label={t("hla28c.behalf.type")} error={err.code ? t(err.code) : null}>
              <Select
                id="hla28c-b-type" value={code} onChange={(v) => { setCode(v); setErr({}); }}
                options={[{ value: "", label: t("hla28c.behalf.typePh") }].concat(LEDGER_TYPES.map((k) => ({ value: k, label: t(typeOf(k).key) })))}
              />
            </Field>
          </div>
          <div style={{ flex: "1 1 150px", minWidth: 0 }}>
            <Field id="hla28c-b-from" label={t("hla28c.behalf.from")} error={err.dates ? t(err.dates) : null}>
              <Input id="hla28c-b-from" type="date" value={from} onChange={(v) => { setFrom(v); setErr({}); }} />
            </Field>
          </div>
          <div style={{ flex: "1 1 150px", minWidth: 0 }}>
            <Field id="hla28c-b-to" label={t("hla28c.behalf.to")}>
              <Input id="hla28c-b-to" type="date" value={to} onChange={(v) => { setTo(v); setErr({}); }} />
            </Field>
          </div>
        </div>

        {days ? (
          <p style={ty("small", { color: c.inkMuted, margin: "-4px 0 14px" })}>{t("hla28c.behalf.days", { n: num(days) })}</p>
        ) : null}

        <ReasonField
          id="hla28c-b-why" label={t("hla28c.behalf.why")} hint={t("hla28c.behalf.whyHint")}
          value={why} onChange={(v) => { setWhy(v); setErr({}); }} error={err.why ? t(err.why) : null} rows={3}
          placeholder={t("hla28c.behalf.whyPh")}
        />

        <p style={ty("caption", { color: c.inkFaint, margin: "4px 0 0" })}>{t("hla28c.behalf.note")}</p>
        <Actions>
          <Button kind="primary" iconLeft="leave" onClick={submit}>{t("hla28c.behalf.confirm")}</Button>
          <LinkButton onClick={onClose}>{t("hla.act.close")}</LinkButton>
        </Actions>
      </Panel>
    );
  }

  function AwayCalendar({ reqs, day, onDay }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const days = [];
    for (let i = 0; i < 14; i++) days.push(addDays(TODAY_ISO, i));
    const awayStore = (iso) => reqs.filter((r) => LF.statusOf(r) === "approved" && iso >= r.from && iso <= r.to).map((r) => r.person);
    const sel = awayStore(day);
    return (
      <Card icon="attendance" iconTone="leave" title={t("hla28.cal.title")} sub={t("hla28.cal.sub")}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 8 }}>
          {days.map((iso) => {
            const people = awayStore(iso);
            const hol = HOLIDAYS[iso];
            const off = isSunday(iso);
            const on = iso === day;
            return (
              <button
                key={iso} type="button" onClick={() => onDay(iso)} aria-pressed={on ? "true" : "false"}
                style={{
                  textAlign: "left", padding: "9px 10px", borderRadius: G3.r.md, cursor: "pointer",
                  background: on ? c.accentSoft : hol ? c.holidayTint : off ? c.offTint : c.alt,
                  border: "1px solid " + (on ? c.accent : c.border),
                }}
              >
                <span style={ty("caption", { display: "block", color: c.inkMuted })}>{fmtWd(t, iso)}</span>
                <span style={G3.fig("md", { display: "block", color: c.ink, fontWeight: 700, marginTop: 2 })}>{people.length ? num(people.length) : "—"}</span>
                <span style={ty("caption", { display: "block", color: c.inkFaint })}>
                  {hol ? t("hla28.cal.holiday") : off ? t("hla28.cal.off") : people.length ? t("hla28.cal.n", { n: num(people.length) }) : t("hla28.cal.none")}
                </span>
              </button>
            );
          })}
        </div>
        <div style={{ marginTop: 16, borderTop: "1px solid " + c.rule, paddingTop: 14 }}>
          <h3 style={ty("h3", { margin: 0, color: c.ink })}>{t("hla28.cal.pick", { date: fmtWd(t, day) })}</h3>
          {HOLIDAYS[day] ? <div style={{ marginTop: 8 }}><Chip bg={c.holidayTint} fg={c.holidayText}><span aria-hidden="true" style={{ display: "flex" }}><Icon name="festival" size={12} /></span><span>{t(HOLIDAYS[day])}</span></Chip></div> : null}
          {sel.length === 0 ? (
            <Note>{t("hla28.cal.emptyDay", { date: fmtWd(t, day) })}</Note>
          ) : (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
              {sel.map((p) => (
                <Chip key={p.id} bg={c.leaveTint} fg={c.leaveText}>
                  <span aria-hidden="true" style={{ display: "flex" }}><Icon name="leave" size={12} /></span>
                  <span>{t(p.nameKey)} · {t("hla29.ro.onleave")}</span>
                </Chip>
              ))}
            </div>
          )}
          <Note>{t("hla28.cal.why")}</Note>
        </div>
      </Card>
    );
  }

  /* ============================================================
     HR-29 · SHIFTS AND ROSTERS
     "who is rostered to what shift"

     A setup screen whose failure mode is silent: staff on no shift
     reconcile against nothing and quietly become HR-30's problem, so
     that number leads the tab and is derived, never typed.
     Two effective-dating rules are enforced rather than described:
     an assignment defaults to TOMORROW and never reaches back by
     accident, and a timing change cannot reach into July at all,
     because July is inside an approved, disbursed run.
     THE ROTATION PATTERN IS GONE (designer): a duty grid of E / L / O
     letters and a panel for rebuilding it was a scheduling tool
     wearing a shift screen's clothes. What is left is what HR reads
     and changes — a timing, a grace, a weekly off, the people on it,
     and the dated record of every one of those that moved.
     ============================================================ */
  function ShiftsTab({ flash, setFlash }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [shifts, setShifts] = useState(SHIFTS);
    const [openId, setOpenId] = useState(null);      /* the shift being read */
    const [panel, setPanel] = useState(null);        /* { kind, shiftId } */
    const [confirmOff, setConfirmOff] = useState(null);
    const [kindF, setKindF] = useState("all");
    const [when, setWhen] = useState("month");
    const [trail, setTrail] = useState(SHIFT_TRAIL);

    const assignedTotal = shifts.reduce((a, s) => a + s.assigned, 0);
    const unassigned = CAMPUS_HEADCOUNT - assignedTotal;

    function inWhen(iso) {
      if (when === "all") return true;
      if (when === "quarter") return diffDays(iso, TODAY_ISO) <= 92;
      return iso >= AUG_FIRST_ISO;
    }
    const trailShown = trail.filter((x) => inWhen(x.iso));

    function hoursOf(s) {
      if (s.start2) return t("hla29.split", { a: s.start + "\u2013" + s.end, b: s.start2 + "\u2013" + s.end2 });
      if (s.kind === "flexi") return t("hla29.window", { a: s.start, b: s.end });
      return s.start + "\u2013" + s.end;
    }

    /* no overflow menu: a shift opens, and what you can do to it is in
       the screen that opens */
    const cols = [
      { key: "shift", label: t("hla29.col.shift") },
      { key: "hours", label: t("hla29.col.hours"), width: 210 },
      { key: "kind", label: t("hla29.col.kind"), width: 130 },
      { key: "staff", label: t("hla29.col.staff"), align: "right", mono: true, width: 90 },
    ];

    const listed = shifts.filter((s) => kindF === "all" || s.kind === kindF);
    const rows = listed.map((s) => ({
      id: s.id,
      highlight: s.id === openId,
      cells: {
        /* THE NAME, AND NOTHING UNDER IT (designer): the code and the
           description belong to the shift's own screen */
        shift: <span style={{ fontWeight: 700, color: c.ink }}>{t(s.nameKey)}</span>,
        hours: (
          <span>
            <span style={G3.fig("sm", { display: "block", color: c.ink })}>{hoursOf(s)}</span>
            <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 2 })}>
              {t("hla29.row.offGrace", { off: s.off === "rot" ? t("hla29.off.rot") : t("hla29.new.off.sun"), n: num(s.grace) })}
            </span>
          </span>
        ),
        kind: <StatusMark role={s.kind === "rotating" ? "ltComp" : s.kind === "flexi" ? "ltEL" : "present"} word={t("hla29.kind." + s.kind)} glyph={s.kind === "fixed" ? "check" : "clock"} />,
        staff: num(s.assigned),
      },
    }));

    const trailCols = [
      { key: "when", label: t("hla29.tr.col.when"), width: 150 },
      { key: "shift", label: t("hla29.tr.col.shift"), width: 220 },
      { key: "what", label: t("hla29.tr.col.what") },
      { key: "who", label: t("hla29.tr.col.who"), width: 170 },
    ];
    const trailRows = trailShown.map((x) => {
      const sh = shiftById(x.shiftId);
      return {
        id: x.id,
        cells: {
          when: (
            <div>
              <div style={{ whiteSpace: "nowrap" }}>{fmtWd(t, x.iso)}</div>
              <div style={G3.fig("xs", { color: c.inkFaint })}>{x.id}</div>
            </div>
          ),
          shift: <span style={{ color: c.ink }}>{sh ? t(sh.nameKey) : x.shiftId}</span>,
          what: x.what === "created" ? t("hla29.tr.e.created")
            : x.what === "assigned" ? t("hla29.tr.e.assigned", { n: num(x.n), date: fmt(t, x.from) })
              : x.what === "moved" ? t("hla29.tr.e.moved", { n: num(x.n) })
                : x.what === "timings" ? t("hla29.tr.e.timings", { a: x.a, b: x.b })
                  : x.what === "grace" ? t("hla29.tr.e.grace", { n: num(x.n) })
                    : t("hla29.tr.e.off"),
          who: <span style={ty("small", { color: c.inkMuted })}>{t(ME.nameKey)}</span>,
        },
      };
    });

    const openShift = openId ? shifts.filter((s) => s.id === openId)[0] : null;
    const panelShift = panel && panel.shiftId ? shifts.filter((s) => s.id === panel.shiftId)[0] : null;
    const offShift = confirmOff ? shifts.filter((s) => s.id === confirmOff)[0] : null;
    const changedThisMonth = trail.filter((x) => x.iso >= AUG_FIRST_ISO).length;

    /* two of these four count PEOPLE and two count other things, so
       only the two that share a population take a band of the bar --
       and each line names the thing the figure cannot: which kinds of
       shift there are, who is on none of them, when the last change
       was made. */
    const kindTally = ["fixed", "flexi", "rotating"]
      .map((k) => ({ k: k, n: shifts.filter((s) => s.kind === k).length }))
      .filter((x) => x.n > 0)
      .map((x) => num(x.n) + " " + t("hla29.kind." + x.k).toLowerCase())
      .join(" · ");
    const lastChange = trail.length ? trail.slice().sort((a, b) => (a.iso < b.iso ? 1 : -1))[0] : null;
    const facts = [
      { k: "shifts", label: t("hla29c.f.shifts"), value: num(shifts.length), n: shifts.length, bar: false,
        note: kindTally, tone: c.chartBlue },
      { k: "assigned", label: t("hla29c.f.assigned"), value: num(assignedTotal), n: assignedTotal,
        note: t("hla29c.f.assignedNote", { n: num(CAMPUS_HEADCOUNT) }), tone: c.chartGreen },
      { k: "unassigned", label: t("hla29c.f.unassigned"), value: num(unassigned), n: unassigned,
        note: unassigned > 0 ? UNASSIGNED.map((p) => t(p.nameKey)).join(", ") : t("hla29c.f.unassignedNone"),
        tone: c.chartRed, warn: unassigned > 0 },
      { k: "changed", label: t("hla29c.f.changed"), value: num(changedThisMonth), n: changedThisMonth, bar: false,
        note: lastChange ? t("hla29c.f.changedNote", { date: fmtWd(t, lastChange.iso) }) : t("hla29c.f.changedNone"),
        tone: c.chartAmber },
    ];

    return (
      <div>
        <Flash text={flash} onDismiss={() => setFlash("")} />

        {/* AN ACT THAT BELONGS TO ONE LIST GOES IN ITS HEADER
            (designer). This band carried the Create-a-shift button in
            a header above its figures and the shiftless notice in a
            block below them, so four numbers sat in the middle of a
            card twice their height. The button belongs to the list of
            shifts and sits in its header; the notice sits on the line
            above that list, where the fault is. */}
        <Band metrics={facts} />

        {/* two questions, one row, full width: which kind of shift the
            list shows, and how far back the history below reaches */}
        <div style={{ display: "flex", gap: 14, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 16 }}>
          <div style={{ flex: "1 1 230px", minWidth: 0, maxWidth: 320 }}>
            <Field id="hla29-f-kind" label={t("hla29.f.kind")}>
              <Select id="hla29-f-kind" value={kindF} onChange={setKindF}
                options={[{ value: "all", label: t("hla29.f.kind.all") }].concat(["fixed", "flexi", "rotating"].map((k) => ({ value: k, label: t("hla29.kind." + k) })))} />
            </Field>
          </div>
          <div style={{ flex: "1 1 230px", minWidth: 0, maxWidth: 320 }}>
            <Field id="hla29-f-when" label={t("hla29.f.when")}>
              <Select id="hla29-f-when" value={when} onChange={setWhen}
                options={[
                  { value: "month", label: t("hla29.f.when.month") },
                  { value: "quarter", label: t("hla29.f.when.quarter") },
                  { value: "all", label: t("hla29.f.when.all") },
                ]} />
            </Field>
          </div>
        </div>

        {/* the one thing on this screen that is wrong, on the line
            above the table it is wrong in */}
        {unassigned > 0 ? (
          <div style={{
            display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap",
            border: "1px solid " + c.rule, borderRadius: G3.r.md, background: c.alt,
            padding: "12px 16px", marginBottom: 16,
          }}>
            <StatusMark role="missing" word={t("hla29.unassigned.title", { n: num(unassigned) })} />
            <span style={{ marginInlineStart: "auto" }}>
              <LinkButton onClick={() => setPanel({ kind: "assign", shiftId: "SH-01" })}>{t("hla29.unassigned.cta")}</LinkButton>
            </span>
          </div>
        ) : null}

        <Register
          title={t("hla29.list.title")}
          action={<Button kind="primary" size="sm" onClick={() => setPanel({ kind: "new" })}>{t("hla29.new")}</Button>}
          columns={cols} rows={rows}
          onSelect={(id) => setOpenId(id)}
          footer={<span style={ty("caption", { color: c.inkFaint })}>{t("hla29.new.graceNote")}</span>}
        />

        {/* THE PAST, ON THE SCREEN THAT CHANGES IT (designer): a shift
            is effective-dated, so what moved and when is a fact the
            screen owes its reader. */}
        <div style={{ marginTop: G3.layout.gap }}>
          {trailRows.length === 0 ? (
            <Card><EmptyState head={t("hla29.tr.title")} body={t("hla29.tr.none")} /></Card>
          ) : (
            <Register
              title={t("hla29.tr.title")}
              sub={t("hla29.tr.sub", { shown: num(trailRows.length), total: num(trail.length) })}
              columns={trailCols} rows={trailRows}
            />
          )}
        </div>

        {/* ONE SHIFT, opened over the list: its timing, its people, and
            everything you can do to it */}
        {openShift ? (
          <SideScreen
            title={t(openShift.nameKey)}
            sub={openShift.id + " \u00b7 " + hoursOf(openShift)}
            width={720}
            onClose={() => setOpenId(null)}
            footer={
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", width: "100%" }}>
                <Button kind="primary" size="sm" iconLeft="staff" onClick={() => setPanel({ kind: "assign", shiftId: openShift.id })}>{t("hla29c.cta.assign")}</Button>
                <Button kind="secondary" size="sm" iconLeft="clock" onClick={() => setPanel({ kind: "edit", shiftId: openShift.id })}>{t("hla29c.cta.timings")}</Button>
                <span style={{ marginInlineStart: "auto", display: "flex", gap: 10, alignItems: "center" }}>
                  {openShift.assigned === 0 ? (
                    <Button kind="dangerOutline" size="sm" iconLeft="signout" onClick={() => setConfirmOff(openShift.id)}>{t("hla29c.cta.deact")}</Button>
                  ) : null}
                  <DangerClose onClick={() => setOpenId(null)}>{t("hla.act.close")}</DangerClose>
                </span>
              </div>
            }
          >
            <ShiftBody shift={openShift} trail={trail.filter((x) => x.shiftId === openShift.id)} />
          </SideScreen>
        ) : null}

        {panel && panel.kind === "new" ? (
          <NewShiftPanel shifts={shifts} onClose={() => setPanel(null)}
            onAdd={(sh) => {
              setShifts((prev) => prev.concat([sh]));
              setTrail((prev) => [{ id: "SC-0122", iso: TODAY_ISO, shiftId: sh.id, what: "created" }].concat(prev));
              setPanel(null);
              setFlash(t("hla29.new.done", { name: sh.name }));
            }} />
        ) : null}

        {panel && panel.kind === "assign" && panelShift ? (
          <AssignPanel shift={panelShift} onClose={() => setPanel(null)}
            onDone={(n, dateISO) => {
              setShifts((prev) => prev.map((s) => (s.id === panelShift.id ? Object.assign({}, s, { assigned: s.assigned + n }) : s)));
              setTrail((prev) => [{ id: "SC-0123", iso: TODAY_ISO, shiftId: panelShift.id, what: "assigned", n: n, from: dateISO }].concat(prev));
              setPanel(null);
              setFlash(t("hla29.as.done", { n: num(n), shift: t(panelShift.nameKey), date: fmt(t, dateISO), by: t(ME.nameKey) }));
            }} />
        ) : null}

        {panel && panel.kind === "edit" && panelShift ? (
          <EditTimingsPanel shift={panelShift} onClose={() => setPanel(null)}
            onDone={(a, b, dateISO) => {
              setShifts((prev) => prev.map((s) => (s.id === panelShift.id ? Object.assign({}, s, { start: a, end: b }) : s)));
              setTrail((prev) => [{ id: "SC-0124", iso: TODAY_ISO, shiftId: panelShift.id, what: "timings", a: a, b: b }].concat(prev));
              setPanel(null);
              setFlash(t("hla29.ed.done", { shift: t(panelShift.nameKey), a: a, b: b, date: fmt(t, dateISO), by: t(ME.nameKey) }));
            }} />
        ) : null}

        {confirmOff && offShift ? (
          <ConfirmDialog
            title={t("hla29.deact.title", { shift: t(offShift.nameKey) })}
            body={t("hla29.deact.body")}
            confirmLabel={t("hla29.menu.deact")} cancelLabel={t("hla.act.cancel")}
            onCancel={() => setConfirmOff(null)}
            onConfirm={() => { setShifts((prev) => prev.filter((s) => s.id !== offShift.id)); setConfirmOff(null); setOpenId(null); setFlash(t("hla29.deact.done", { shift: t(offShift.nameKey) })); }}
          />
        ) : null}
      </div>
    );
  }

  /* everything about ONE shift, in the order somebody asks it: what it
     is, who is on it, how the rotation falls, what is missing */
  function ShiftBody({ shift, trail }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const people = STAFF.filter((s) => s.shift === shift.id);

    return (
      <div>
        <DefRow label={t("hla29.col.hours")} mono>
          {shift.start2 ? t("hla29.split", { a: shift.start + "\u2013" + shift.end, b: shift.start2 + "\u2013" + shift.end2 })
            : shift.kind === "flexi" ? t("hla29.window", { a: shift.start, b: shift.end })
              : shift.start + "\u2013" + shift.end}
        </DefRow>
        <DefRow label={t("hla29.col.kind")}>{t("hla29.kind." + shift.kind)}</DefRow>
        <DefRow label={t("hla29.col.grace")} mono>{t("hla29.grace.n", { n: num(shift.grace) })}</DefRow>
        <DefRow label={t("hla29.col.off")}>{shift.off === "rot" ? t("hla29.off.rot") : t("hla29.new.off.sun")}</DefRow>
        <DefRow label={t("hla29.col.staff")} mono>{num(shift.assigned)}</DefRow>

        <p style={ty("caption", { margin: "14px 0 0", color: c.inkMuted })}>{t(shift.noteKey)}</p>

        {/* who is actually on it — names, not a count, for the shifts
            small enough to name */}
        {people.length ? (
          <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid " + c.rule }}>
            <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 4 })}>{t("hla29c.who", { n: num(people.length), total: num(shift.assigned) })}</div>
            {people.length < shift.assigned ? (
              <p style={ty("caption", { color: c.inkMuted, margin: "0 0 10px" })}>{t("hla29c.whoRest", { n: num(shift.assigned - people.length) })}</p>
            ) : <div style={{ height: 8 }} />}
            <div role="table" aria-label={t("hla29c.whoAria")}>
              <div role="row" style={{ display: "flex", gap: 12, alignItems: "center", padding: "0 0 7px" }}>
                <span role="columnheader" style={ty("caption", { color: c.inkFaint, fontWeight: 700, flex: "1 1 auto", minWidth: 0, paddingInlineStart: 42 })}>{t("hla29c.who.col.name")}</span>
                <span role="columnheader" style={ty("caption", { color: c.inkFaint, fontWeight: 700, width: 190, flexShrink: 0 })}>{t("hla29c.who.col.dept")}</span>
              </div>
              {people.map((s, i) => (
                <div
                  key={s.id} role="row"
                  style={{ display: "flex", gap: 12, alignItems: "center", padding: "9px 0", borderTop: "1px solid " + (i ? c.rule : c.border) }}
                >
                  <span role="cell" style={{ display: "flex", gap: 12, alignItems: "center", flex: "1 1 auto", minWidth: 0 }}>
                    <Avatar name={t(s.nameKey)} size={30} />
                    <span style={{ minWidth: 0 }}>
                      <span style={ty("small", { display: "block", color: c.ink, fontWeight: 600 })}>{t(s.nameKey)}</span>
                      <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 1 })}>{t(s.desigKey)}</span>
                    </span>
                  </span>
                  <span role="cell" style={ty("small", { color: c.inkMuted, width: 190, flexShrink: 0 })}>{t(s.deptKey)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* and what has happened to this shift, in dates */}
        {trail && trail.length ? (
          <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid " + c.rule }}>
            <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 8 })}>{t("hla29.tr.title")}</div>
            {trail.map((x, i) => (
              <div key={x.id} style={{ display: "flex", gap: 14, alignItems: "baseline", flexWrap: "wrap", padding: "9px 0", borderTop: i ? "1px solid " + c.rule : "none" }}>
                <span style={G3.fig("xs", { color: c.inkFaint, width: 120, flexShrink: 0 })}>{fmt(t, x.iso)}</span>
                <span style={ty("small", { color: c.ink, flex: 1, minWidth: 180 })}>
                  {x.what === "created" ? t("hla29.tr.e.created")
                    : x.what === "assigned" ? t("hla29.tr.e.assigned", { n: num(x.n), date: fmt(t, x.from) })
                      : x.what === "moved" ? t("hla29.tr.e.moved", { n: num(x.n) })
                        : x.what === "timings" ? t("hla29.tr.e.timings", { a: x.a, b: x.b })
                          : x.what === "grace" ? t("hla29.tr.e.grace", { n: num(x.n) })
                            : t("hla29.tr.e.off")}
                </span>
                <span style={ty("caption", { color: c.inkMuted })}>{t(ME.nameKey)}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  function NewShiftPanel({ shifts, onClose, onAdd }) {
    const { t } = useLang();
    const [name, setName] = useState("");
    const [start, setStart] = useState("08:30");
    const [end, setEnd] = useState("16:30");
    const [kind, setKind] = useState("fixed");
    const [grace, setGrace] = useState(String(POLICY.graceDefaultMin));
    const [off, setOff] = useState("sun");
    const [err, setErr] = useState({});
    const clash = shifts.filter((s) => s.start === start && s.end === end)[0];

    function submit() {
      const e = {};
      if (!name.trim()) e.name = t("hla29.new.nameMissing");
      setErr(e);
      if (Object.keys(e).length) return;
      onAdd({ id: "SH-0" + (shifts.length + 1), nameKey: null, name: name.trim(), noteKey: null,
        start: start, end: end, kind: kind, grace: Number(grace) || 0, off: off, assigned: 0 });
    }
    return (
      <Panel title={t("hla29.new.title")} onClose={onClose}>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 12 }}>
          <div style={{ flex: "1 1 240px", minWidth: 200 }}>
            <Field id="hla29-n-name" label={t("hla29.new.name")}><Input id="hla29-n-name" value={name} onChange={setName} invalid={!!err.name} /></Field>
            <FieldError>{err.name}</FieldError>
          </div>
          <div style={{ width: 140 }}><Field id="hla29-n-start" label={t("hla29.new.start")}><Input id="hla29-n-start" type="time" value={start} onChange={setStart} /></Field></div>
          <div style={{ width: 140 }}><Field id="hla29-n-end" label={t("hla29.new.end")}><Input id="hla29-n-end" type="time" value={end} onChange={setEnd} /></Field></div>
          <div style={{ width: 180 }}>
            <Field id="hla29-n-kind" label={t("hla29.new.kind")}>
              <Select id="hla29-n-kind" value={kind} onChange={setKind} options={["fixed", "flexi", "rotating"].map((k) => ({ value: k, label: t("hla29.kind." + k) }))} />
            </Field>
          </div>
          <div style={{ width: 150 }}><Field id="hla29-n-grace" label={t("hla29.new.grace")}><Input id="hla29-n-grace" value={grace} onChange={setGrace} inputMode="numeric" /></Field></div>
          <div style={{ width: 200 }}>
            <Field id="hla29-n-off" label={t("hla29.new.off")}>
              <Select id="hla29-n-off" value={off} onChange={setOff} options={[
                { value: "sun", label: t("hla29.new.off.sun") },
                { value: "satsun", label: t("hla29.new.off.satsun") },
                { value: "rot", label: t("hla29.new.off.rot") },
              ]} />
            </Field>
          </div>
        </div>
        {clash ? <Callout tone="late" icon="alert" body={t("hla29.new.overlap", { name: clash.nameKey ? t(clash.nameKey) : clash.name, a: clash.start, b: clash.end })} compact /> : null}
        <Note>{t("hla29.new.graceNote")}</Note>
        <Actions>
          <Button kind="primary" onClick={submit}>{t("hla29.new.submit")}</Button>
          <Button kind="ghost" onClick={onClose}>{t("hla.act.cancel")}</Button>
        </Actions>
      </Panel>
    );
  }

  function AssignPanel({ shift, onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [mode, setMode] = useState("person");
    const [ids, setIds] = useState([]);
    const [dept, setDept] = useState(DEPT_KEYS[0]);
    const [eff, setEff] = useState(TOMORROW_ISO);
    const [reason, setReason] = useState("");
    const [err, setErr] = useState({});
    const retro = eff < TODAY_ISO;
    const blocked = eff < AUG_FIRST_ISO;
    const candidates = STAFF.filter((s) => s.shift !== shift.id);
    const count = mode === "person" ? ids.length : STAFF.filter((s) => s.deptKey === dept && s.shift !== shift.id).length;

    function submit() {
      if (blocked) return;
      const e = {};
      if (count === 0) e.who = t("hla29.as.whoMissing");
      if (retro && reason.trim().length < 8) e.reason = reason.trim() ? t("hla.reason.short") : t("hla.reason.missing");
      setErr(e);
      if (Object.keys(e).length) return;
      onDone(count, eff);
    }

    return (
      <Panel pop title={t("hla29.as.title", { shift: shift.nameKey ? t(shift.nameKey) : shift.name })} onClose={onClose}>
        <ChoiceList name="hla29-as-mode" value={mode} onChange={setMode} label={t("hla29.as.who")}
          options={[
            { value: "person", label: t("hla29.as.byPerson") },
            { value: "dept", label: t("hla29.as.byDept") },
          ]} />
        {mode === "person" ? (
          <div style={{ marginTop: 12 }}>
            <div style={{ width: 320 }}>
              <Field id="hla29-as-pick" label={t("hla29.as.pick")} hint={t("hla29.as.pickHint")}>
                <Select
                  id="hla29-as-pick" value=""
                  onChange={(v) => { if (v) setIds((p) => (p.indexOf(v) === -1 ? p.concat([v]) : p)); setErr((e) => Object.assign({}, e, { who: null })); }}
                  options={[{ value: "", label: t("hla29.as.pickNone") }].concat(
                    candidates.filter((s) => ids.indexOf(s.id) === -1)
                      .map((s) => ({ value: s.id, label: t(s.nameKey) + " — " + t(s.deptKey) }))
                  )}
                />
              </Field>
            </div>
            {ids.length ? (
              <div style={{ marginTop: 12 }}>
                <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 6 })}>{t("hla29.as.chosen", { n: num(ids.length) })}</div>
                {ids.map((id, i) => {
                  const s = STAFF.filter((x) => x.id === id)[0];
                  return (
                    <div key={id} style={{ display: "flex", gap: 11, alignItems: "center", padding: "8px 0", borderTop: "1px solid " + (i ? c.rule : c.border) }}>
                      <Avatar name={t(s.nameKey)} size={28} />
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={ty("small", { display: "block", color: c.ink, fontWeight: 600 })}>{t(s.nameKey)}</span>
                        <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 1 })}>{t(s.deptKey)}</span>
                      </span>
                      <LinkButton color={c.dangerText} onClick={() => setIds((p) => p.filter((x) => x !== id))}>{t("hla29.as.remove")}</LinkButton>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={ty("caption", { color: c.inkMuted, margin: "10px 0 0" })}>{t("hla29.as.noneYet")}</p>
            )}
          </div>
        ) : (
          <div style={{ marginTop: 12, width: 260 }}>
            <Field id="hla29-as-dept" label={t("hla28.f.dept")}>
              <Select id="hla29-as-dept" value={dept} onChange={setDept} options={DEPT_KEYS.map((d) => ({ value: d, label: t(d) }))} />
            </Field>
          </div>
        )}
        <FieldError>{err.who}</FieldError>
        <div style={{ marginTop: 12, width: 210 }}>
          <Field id="hla29-as-eff" label={t("hla29.as.eff")} hint={t("hla29.as.effDefault", { date: fmt(t, TOMORROW_ISO) })}>
            <Input id="hla29-as-eff" type="date" value={eff} onChange={setEff} />
          </Field>
        </div>
        {blocked ? (
          <Callout tone="off" icon="lock" title={t("hla29.ed.blocked")} body={t("hla29.as.retroLocked", { lock: t("hla.lock.julyShort", { run: RUN_JULY }) })} />
        ) : retro ? (
          <Callout tone="late" icon="alert" title={t("hla29.as.retro")} body={t("hla29.as.retroBody")} />
        ) : null}
        {retro && !blocked ? (
          <ReasonField id="hla29-as-why" value={reason} onChange={(v) => { setReason(v); setErr((e) => Object.assign({}, e, { reason: null })); }} error={err.reason} />
        ) : null}
        <Actions>
          <Button kind="primary" onClick={submit} disabled={blocked}>{t("hla29.as.submit")}</Button>
          <Button kind="ghost" onClick={onClose}>{t("hla.act.cancel")}</Button>
          {blocked ? <span style={ty("caption", { color: c.dangerText })}>{t("hla29.new.blockedShort")}</span> : null}
        </Actions>
      </Panel>
    );
  }

  function EditTimingsPanel({ shift, onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [a, setA] = useState(shift.start);
    const [b, setB] = useState(shift.end);
    const [eff, setEff] = useState(TOMORROW_ISO);
    const [reason, setReason] = useState("");
    const [err, setErr] = useState("");
    const blocked = eff < AUG_FIRST_ISO;

    function submit() {
      if (blocked) return;
      if (reason.trim().length < 8) { setErr(reason.trim() ? t("hla.reason.short") : t("hla.reason.missing")); return; }
      onDone(a, b, eff);
    }
    return (
      <Panel pop title={t("hla29.ed.title", { shift: shift.nameKey ? t(shift.nameKey) : shift.name })} sub={t("hla29.ed.body")} onClose={onClose}>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 12 }}>
          <div style={{ width: 140 }}><Field id="hla29-e-a" label={t("hla29.new.start")}><Input id="hla29-e-a" type="time" value={a} onChange={setA} /></Field></div>
          <div style={{ width: 140 }}><Field id="hla29-e-b" label={t("hla29.new.end")}><Input id="hla29-e-b" type="time" value={b} onChange={setB} /></Field></div>
          <div style={{ width: 210 }}><Field id="hla29-e-eff" label={t("hla29.ed.eff")}><Input id="hla29-e-eff" type="date" value={eff} onChange={setEff} /></Field></div>
        </div>
        {blocked ? (
          <Callout tone="off" icon="lock" title={t("hla29.ed.blocked")} body={t("hla29.ed.blockedBody", { lock: t("hla.lock.julyShort", { run: RUN_JULY }) })} />
        ) : (
          <Callout tone="late" icon="lock" body={t("hla29.ed.second")} compact />
        )}
        {!blocked ? <ReasonField id="hla29-e-why" value={reason} onChange={(v) => { setReason(v); setErr(""); }} error={err} /> : null}
        <Actions>
          <Button kind="primary" onClick={submit} disabled={blocked}>{t("hla29.ed.submit")}</Button>
          <Button kind="ghost" onClick={onClose}>{t("hla.act.cancel")}</Button>
          {blocked ? <span style={ty("caption", { color: c.dangerText })}>{t("hla29.new.blockedShort")}</span> : null}
        </Actions>
      </Panel>
    );
  }

  /* ============================================================
     HR-30 · ATTENDANCE EXCEPTIONS
     "which attendance records are wrong, and why"

     The screen where an administrative oversight turns into somebody
     being short-paid, so it leads with the money: the days that will
     become loss of pay if nothing happens, priced at each person's own
     gross ÷ 30, summed in code.
     Three governance facts are enforced here, not described:
       · July is inside run PR-2026-07, approved and disbursed — the
         correction control is VISIBLE and DISABLED, naming the run and
         offering the arrears route (HR-30 Actions, verbatim).
       · August's paid-day snapshot was taken on 8 August and bound to
         PR-2026-08, which is with its checker — so a correction is
         recorded immediately but does not move pay by itself, and the
         panel says so before it commits.
       · HR editing attendance moves pay with no manager in the loop
         (§11 Q9). It is permitted — `attendance.manage` is HR's — and
         every correction lands as "corrected, awaiting a second look",
         attributed, with before and after both kept. NOBODY ELSE IS IN
         THIS LOOP (designer): sending a day to a head of department
         was a correspondence this product is not in, so it is gone.
     ============================================================ */
  function ExceptionsTab({ flash, setFlash, onNavigate }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [fixes, setFixes] = useState({});
    const [f, setF] = useState({ kind: "", dept: "", when: "month", state: "open" });
    const [openId, setOpenId] = useState(null);
    const [outageOpen, setOutageOpen] = useState(false);
    const [rerun, setRerun] = useState(false);

    const correctable = OUTAGE.affected.filter((a) => !a.exKey);
    const preExcluded = OUTAGE.affected.filter((a) => a.exKey);

    /* ONE ROW PER PERSON, PER DAY (designer).

       The nightly job raises a device outage once and a shiftless
       roster once, and the register used to show those two as a single
       row reading "grouped, 11" — a pile the reader had to open to
       find out whose day was wrong. But a day is put right for a
       PERSON, so the person is the row: the incident survives as the
       reason inside the row, and the eleven people it happened to are
       eleven lines with eleven names. */
    const all = useMemo(() => {
      const out = [];
      EXCEPTIONS.forEach((e) => {
        const base = Object.assign({}, e, { grouped: null, pendingReq: null });
        if (e.grouped === "outage") {
          OUTAGE.affected.forEach((a) => {
            out.push(Object.assign({}, base, {
              id: e.id + "-" + a.staffId, staffId: a.staffId, source: "outage",
              exKey: a.exKey || null,
              becomes: a.exKey ? "nothing" : base.becomes,
              lopIfLeft: a.exKey ? 0 : 1,
              state: a.exKey ? "settled" : base.state,
            }));
          });
        } else if (e.grouped === "noshift") {
          UNASSIGNED.forEach((p) => {
            out.push(Object.assign({}, base, { id: e.id + "-" + p.id, staffId: p.id, source: "noshift" }));
          });
        } else {
          out.push(base);
        }
      });
      return out
        .map((e) => (fixes[e.id] ? Object.assign({}, e, fixes[e.id]) : e))
        .sort((a, b) => (a.dateISO < b.dateISO ? -1 : a.dateISO > b.dateISO ? 1 : 0));
      // eslint-disable-next-line
    }, [fixes]);

    /* A COUNT OF DAYS, NOT A SUM OF FRACTIONS (designer). The figure
       that led this band was the loss-of-pay total -- "13½" -- which
       is a rupee judgement wearing a count's clothes, and it matched
       nothing in the table beneath it. Each figure is now a number of
       ROWS, in the same window the register is read in, so the five
       of them add up to what the reader can see and the bar is the
       shape of the queue. The half-day arithmetic survives in the
       line under the figures, in words, where it reads as a warning
       rather than as a quantity. */
    function inExWhen(iso) {
      if (f.when === "all") return true;
      if (f.when === "quarter") return diffDays(iso, TODAY_ISO) <= 92;
      return iso >= AUG_FIRST_ISO;
    }
    const win = all.filter((e) => inExWhen(e.dateISO));
    const openRows = win.filter((e) => e.state === "open");
    const heldRows = win.filter((e) => e.state === "held");
    const fixedRows = win.filter((e) => e.state === "corrected");
    const lockedRows = win.filter((e) => e.state === "locked");
    const noneRows = win.filter((e) => e.state === "settled");
    /* computed, never typed: the rupee value of an unreconciled day is
       payroll's to state, so this stays in days */
    const atRisk = openRows.reduce((a, e) => a + (e.lopIfLeft || 0), 0);
    const oldest = openRows.length ? diffDays(openRows[0].dateISO, TODAY_ISO) : 0;
    const oldestOne = openRows.length ? openRows[0] : null;
    const heldSoonest = heldRows.slice().sort((a, b) => ((a.holdUntil || "") < (b.holdUntil || "") ? -1 : 1))[0] || null;

    const facts = [
      { k: "open", label: t("hla30.f2.open"), value: num(openRows.length), n: openRows.length,
        note: oldestOne
          ? t("hla30.f2.openNote", {
            name: t(staffById(oldestOne.staffId).nameKey), date: fmtWd(t, oldestOne.dateISO), n: num(oldest),
          })
          : t("hla30.f2.openNone"),
        tone: c.chartRed, warn: openRows.length > 0 },
      { k: "held", label: t("hla30.f2.held"), value: num(heldRows.length), n: heldRows.length,
        note: heldRows.length
          ? t("hla30.f2.heldNote", { date: fmtWd(t, heldSoonest.holdUntil || TODAY_ISO) })
          : t("hla30.f2.heldNone"),
        tone: c.chartAmber },
      { k: "fixed", label: t("hla30.f2.fixed"), value: num(fixedRows.length), n: fixedRows.length,
        note: fixedRows.length ? t("hla30.f2.fixedNote", { by: t(ME.nameKey) }) : t("hla30.f2.fixedNone"),
        tone: c.chartGreen },
      { k: "none", label: t("hla30.f2.none"), value: num(noneRows.length), n: noneRows.length,
        note: noneRows.length ? t("hla30.f2.noneNote") : t("hla30.f2.noneNone"), tone: c.chartSand },
      { k: "locked", label: t("hla30.f2.locked"), value: num(lockedRows.length), n: lockedRows.length,
        note: lockedRows.length ? t("hla30.f2.lockedNote", { run: RUN_JULY }) : t("hla30.f2.lockedNone"),
        tone: c.chartBlue },
    ];

    const filtered = win.filter((e) => {
      if (f.kind && e.kind !== f.kind) return false;
      if (f.dept && staffById(e.staffId).deptKey !== f.dept) return false;
      if (f.state !== "all" && e.state !== f.state) return false;
      return true;
    });

    /* no overflow menu: the actions live in the row's own screen */
    const cols = [
      { key: "date", label: t("hla30.col.date"), width: 124 },
      { key: "who", label: t("hla30.col.who"), width: 180 },
      { key: "kind", label: t("hla30.col.kind"), width: 210 },
      { key: "becomes", label: t("hla30.col.becomes") },
      { key: "state", label: t("hla30.col.state"), width: 190 },
    ];
    const rows = filtered.map((e) => {
      const p = staffById(e.staffId);
      return {
        id: e.id,
        highlight: e.id === openId,
        tone: e.state === "corrected" || e.state === "settled" ? "dim" : undefined,
        cells: {
          date: (
            <div>
              <div style={{ whiteSpace: "nowrap" }}>{fmtWd(t, e.dateISO)}</div>
              <div style={G3.fig("xs", { color: c.inkFaint })}>{e.id}</div>
            </div>
          ),
          who: (
            <div>
              <div style={{ fontFamily: G3.font.ui, fontSize: 13.5, color: c.ink, fontWeight: 700 }}>{t(p.nameKey)}</div>
              <div style={ty("caption", { color: c.inkFaint })}>{t(p.deptKey)}</div>
            </div>
          ),
          /* THE HEADING, AND NOTHING UNDER IT (designer). The line
             under it restated the row's other three columns. */
          kind: <span style={{ fontWeight: 600 }}>{t("hla30.k." + e.kind)}</span>,
          becomes: <StatusMark
            role={e.becomes === "absent" ? "absent" : e.becomes === "half" ? "late" : e.becomes === "review" ? "missing" : "off"}
            glyph={e.becomes === "absent" ? "alert" : e.becomes === "half" ? "half" : "clock"}
            word={t("hla30.b." + e.becomes)} />,
          state: (
            <span>
              <StatusMark
                role={e.state === "open" ? "late" : e.state === "corrected" ? "present" : e.state === "held" ? "ltComp" : "off"}
                glyph={e.state === "open" ? "clock" : e.state === "corrected" ? "check" : e.state === "locked" ? "lock" : e.state === "held" ? "clock" : "check"}
                word={t("hla30.st." + e.state)} />
              {e.state === "held" && e.holdUntil ? (
                <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 3 })}>
                  {t("hla30.st.heldUntil", { date: fmtWd(t, e.holdUntil) })}
                </span>
              ) : null}
            </span>
          ),
        },
      };
    });

    const open = all.filter((e) => e.id === openId)[0] || null;

    /* THREE THINGS HR CAN DO WITH A DAY (designer). Correcting it
       is one of them: a day can also be WAITING on something (the
       engineer, a letter, the person themselves), and it can be
       RIGHT AS IT STANDS, in which case somebody has to say so and
       put their name on it. Both are states the filter already
       offered and nothing could reach. */
    function commitHold(id, untilISO, reason) {
      const e = all.filter((x) => x.id === id)[0];
      setFixes((prev) => Object.assign({}, prev, {
        [id]: { state: "held", holdUntil: untilISO, holdReason: reason, heldByKey: ME.nameKey, heldOn: TODAY_ISO },
      }));
      setFlash(t("hla30.hold.done", { name: t(staffById(e.staffId).nameKey), date: fmt(t, untilISO), by: t(ME.nameKey) }));
    }
    function releaseHold(id) {
      const e = all.filter((x) => x.id === id)[0];
      setFixes((prev) => Object.assign({}, prev, {
        [id]: { state: "open", holdUntil: null, holdReason: null, heldByKey: null, heldOn: null },
      }));
      setFlash(t("hla30.hold.undone", { name: t(staffById(e.staffId).nameKey) }));
    }
    function commitLock(id, reason) {
      const e = all.filter((x) => x.id === id)[0];
      setFixes((prev) => Object.assign({}, prev, {
        [id]: { state: "locked", byHand: true, lockReason: reason, lockedByKey: ME.nameKey, lockedOn: TODAY_ISO },
      }));
      setFlash(t("hla30.lock.done", {
        name: t(staffById(e.staffId).nameKey), date: fmt(t, e.dateISO),
        becomes: t("hla30.b." + e.becomes), by: t(ME.nameKey),
      }));
    }
    function unlockByHand(id) {
      const e = all.filter((x) => x.id === id)[0];
      setFixes((prev) => Object.assign({}, prev, {
        [id]: { state: "open", byHand: false, lockReason: null, lockedByKey: null, lockedOn: null },
      }));
      setFlash(t("hla30.lock.undone", { name: t(staffById(e.staffId).nameKey) }));
    }

    function commitCorrection(id, status, reason) {
      const e = all.filter((x) => x.id === id)[0];
      setFixes((prev) => Object.assign({}, prev, {
        [id]: { state: "corrected", newStatus: status, correctionReason: reason, correctedByKey: ME.nameKey, correctedOn: TODAY_ISO },
      }));
      setFlash(t("hla30.cor.done", { date: fmt(t, e.dateISO), name: t(staffById(e.staffId).nameKey), status: t("hla30.cor.s." + status), by: t(ME.nameKey) }));
    }

    return (
      <div>
        <Flash text={flash} onDismiss={() => setFlash("")} />

        <Band
          metrics={facts}
          foot={atRisk > 0 ? t("hla30.f2.foot", { n: halfNum(atRisk), run: RUN_AUG }) : t("hla30.f2.footClear")}
        />

        {outageOpen ? (
          <Card style={{ marginBottom: G3.layout.gap }}>
            <OutagePanel
              correctable={correctable} preExcluded={preExcluded}
              onClose={() => setOutageOpen(false)}
              onDone={(n, x) => {
                setFixes((prev) => {
                  const next = Object.assign({}, prev);
                  correctable.forEach((a) => {
                    next["EX-0102-" + a.staffId] = { state: "corrected", newStatus: "present", correctedByKey: ME.nameKey, correctedOn: TODAY_ISO };
                  });
                  return next;
                });
                setOutageOpen(false);
                setOpenId(null);
                setFlash(t("hla30.outage.done", { n: num(n), x: num(x), by: t(ME.nameKey), id: OUTAGE.id }));
              }}
            />
          </Card>
        ) : null}

        {/* FOUR QUESTIONS, ONE ROW, FULL WIDTH: what kind of day, whose
            department, how far back, and where it stands. The switch
            that used to hide the settled ones was the fourth question
            asked in a different grammar. */}
        <div style={{ display: "flex", gap: 14, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 16 }}>
          <div style={{ flex: "1 1 200px", minWidth: 0 }}>
            <Field id="hla30-kind" label={t("hla30.f.type")}>
              <Select id="hla30-kind" value={f.kind} onChange={(v) => setF(Object.assign({}, f, { kind: v }))}
                options={[{ value: "", label: t("hla30.f.type.all") }].concat(["missing", "single", "short", "noleave", "geo", "device", "conflict", "noshift"].map((k) => ({ value: k, label: t("hla30.k." + k) })))} />
            </Field>
          </div>
          <div style={{ flex: "1 1 180px", minWidth: 0 }}>
            <Field id="hla30-dept" label={t("hla30.f.dept")}>
              <Select id="hla30-dept" value={f.dept} onChange={(v) => setF(Object.assign({}, f, { dept: v }))}
                options={[{ value: "", label: t("hla30.f.dept.all") }].concat(DEPT_KEYS.map((d) => ({ value: d, label: t(d) })))} />
            </Field>
          </div>
          <div style={{ flex: "1 1 180px", minWidth: 0 }}>
            <Field id="hla30-range" label={t("hla30.f.range")}>
              <Select id="hla30-range" value={f.when} onChange={(v) => setF(Object.assign({}, f, { when: v }))}
                options={[
                  { value: "month", label: t("hla30.f.range.aug") },
                  { value: "quarter", label: t("hla30.f.range.week") },
                  { value: "all", label: t("hla30.f.range.all") },
                ]} />
            </Field>
          </div>
          <div style={{ flex: "1 1 180px", minWidth: 0 }}>
            <Field id="hla30-state" label={t("hla30.f.state")}>
              <Select id="hla30-state" value={f.state} onChange={(v) => setF(Object.assign({}, f, { state: v }))}
                options={[{ value: "all", label: t("hla30.f.state.all") }].concat(["open", "held", "corrected", "settled", "locked"].map((k) => ({ value: k, label: t("hla30.st." + k) })))} />
            </Field>
          </div>
        </div>

        {rerun ? (
          <RerunPanel onClose={() => setRerun(false)}
            onDone={(a, b) => { setRerun(false); setFlash(t("hla30.rerun.done", { from: fmt(t, a), to: fmt(t, b), by: t(ME.nameKey) })); }} />
        ) : null}

        {filtered.length === 0 ? (
          <Card>
            <EmptyState
              head={t("hla30.filter.empty.head")} body={t("hla30.filter.empty.body")}
              action={<Button kind="secondary" onClick={() => setF({ kind: "", dept: "", when: "all", state: "all" })}>{t("hla.act.clearFilters")}</Button>} />
          </Card>
        ) : (
          <Register
            title={t("hla30.reg.title")}
            sub={t("hla30.reg.sub", { shown: num(filtered.length), total: num(all.length) })}
            action={
              <span style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Button kind="secondary" size="sm" iconLeft="scan" onClick={() => setRerun(true)}>{t("hla30.rerun")}</Button>
                <Button kind="secondary" size="sm" iconLeft="download" onClick={() => setFlash(t("hla30.exp.done", { by: t(ME.nameKey) }))}>{t("hla30.exp")}</Button>
              </span>
            }
            columns={cols} rows={rows}
            onSelect={(id) => setOpenId(id)}
          />
        )}

        {/* ONE DAY, ONE PERSON, opened over the register */}
        {open ? (
          <SideScreen
            title={t("hla30.k." + open.kind)}
            sub={t(staffById(open.staffId).nameKey) + " \u00b7 " + fmtWd(t, open.dateISO)}
            width={640}
            onClose={() => setOpenId(null)}
          >
            <ExceptionDetail
              e={open} bare
              onCorrect={commitCorrection}
              onHold={commitHold} onRelease={releaseHold}
              onLock={commitLock} onUnlock={unlockByHand}
              onOpenOutage={() => { setOutageOpen(true); setOpenId(null); }}
            />
          </SideScreen>
        ) : null}
      </div>
    );
  }

  function OutagePanel({ correctable, preExcluded, onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [what, setWhat] = useState("rostered");
    const [dropped, setDropped] = useState([]);
    const [reason, setReason] = useState("");
    const [err, setErr] = useState("");
    const included = correctable.filter((a) => dropped.indexOf(a.staffId) === -1);
    const leftOut = preExcluded.length + dropped.length;

    function submit() {
      if (reason.trim().length < 8) { setErr(reason.trim() ? t("hla.reason.short") : t("hla.reason.missing")); return; }
      onDone(included.length, leftOut);
    }
    return (
      <Panel title={t("hla30.outage.title2", { date: fmt(t, OUTAGE.dateISO) })} sub={t("hla30.outage.eachRow")} onClose={onClose}>
        <ChoiceList name="hla30-outage-what" value={what} onChange={setWhat} label={t("hla30.outage.what")}
          options={[
            { value: "rostered", label: t("hla30.outage.opt.rostered") },
            { value: "present", label: t("hla30.outage.opt.present") },
          ]} />

        <div style={{ marginTop: 16 }}>
          <Callout tone="absent" icon="alert" title={t("hla30.outage.warnHead", { n: num(preExcluded.length) })} body={t("hla30.outage.warnBody")} />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
            {preExcluded.map((a) => {
              const p = staffById(a.staffId);
              return (
                <Chip key={a.staffId} bg={c.absentTint} fg={c.absentText}>
                  <span aria-hidden="true" style={{ display: "flex" }}><Icon name="alert" size={12} /></span>
                  <span>{t(p.nameKey)} · {t(a.exKey)}</span>
                </Chip>
              );
            })}
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <h4 style={ty("h3", { margin: "0 0 8px", color: c.ink })}>{t("hla30.outage.list")}</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {correctable.map((a) => {
              const p = staffById(a.staffId);
              const out = dropped.indexOf(a.staffId) !== -1;
              return (
                <label key={a.staffId} htmlFor={"out-" + a.staffId}
                  style={{ display: "flex", gap: 11, alignItems: "center", padding: "9px 12px", borderRadius: G3.r.md, cursor: "pointer",
                    background: out ? c.sunken : c.alt, border: "1px solid " + c.border, opacity: out ? 0.7 : 1 }}>
                  <RowCheck id={"out-" + a.staffId} checked={!out} ariaLabel={t("hla30.outage.excludeAria", { name: t(p.nameKey) })}
                    onChange={(v) => setDropped((d) => (v ? d.filter((x) => x !== a.staffId) : d.concat([a.staffId])))} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={ty("small", { display: "block", color: c.ink, fontWeight: 600 })}>{t(p.nameKey)}</span>
                    <span style={ty("caption", { display: "block", color: c.inkFaint })}>{t(p.deptKey)} · {p.code}</span>
                  </span>
                  {/* no rupee figure here either: the outage is a list
                      of people and days, and pricing it was salary
                      arrived at sideways */}
                  <span style={ty("caption", { color: c.inkMuted })}>{t(p.shift ? shiftById(p.shift).nameKey : "hla30.noShift")}</span>
                </label>
              );
            })}
          </div>
          <Note>{t("hla30.outage.count", { n: num(included.length), total: num(OUTAGE.affected.length), x: num(leftOut) })}</Note>
        </div>

        <ReasonField id="hla30-outage-why" value={reason} onChange={(v) => { setReason(v); setErr(""); }} error={err} />
        <Actions>
          <Button kind="primary" onClick={submit}>{t("hla30.outage.submit", { n: num(included.length) })}</Button>
          <Button kind="ghost" onClick={onClose}>{t("hla.act.cancel")}</Button>
        </Actions>
      </Panel>
    );
  }

  function ExceptionDetail({ e, onCorrect, onHold, onRelease, onLock, onUnlock, onOpenOutage, bare }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    /* `bare` for the side screen, where a card would be a box in a box */

    const [correcting, setCorrecting] = useState(false);
    const [status, setStatus] = useState("present");
    const [tin, setTin] = useState("08:15");
    const [tout, setTout] = useState("15:40");
    const [reason, setReason] = useState("");
    const [err, setErr] = useState("");
    const [confirm, setConfirm] = useState(false);
    /* the two acts that are not a correction, each with its own
       reason: a hold says what it is waiting for, a lock says why
       the day is right as it stands */
    const [holding, setHolding] = useState(false);
    const [holdUntil, setHoldUntil] = useState(addDays(TODAY_ISO, 7));
    const [holdWhy, setHoldWhy] = useState("");
    const [holdErr, setHoldErr] = useState("");
    const [locking, setLocking] = useState(false);
    const [lockWhy, setLockWhy] = useState("");
    const [lockErr, setLockErr] = useState("");

    if (!e) return <Card><EmptyState head={t("hla30.menu.open")} body={t("hla30.feeds")} /></Card>;

    const p = staffById(e.staffId);
    const locked = e.state === "locked";
    const settled = e.state === "settled";
    const done = e.state === "corrected";
    const held = e.state === "held";
    /* a run locked it, or a person did -- the same word, two very
       different doors: one of them opens */
    const byHand = locked && e.byHand;
    const lopNow = e.lopIfLeft || 0;
    const lopAfter = status === "absent" ? 1 : status === "half" ? 0.5 : 0;
    const paidNow = paidDaysWith(lopNow);
    const paidAfter = paidDaysWith(lopAfter);
    const moved = paidAfter - paidNow;

    function submit() {
      if (reason.trim().length < 8) { setErr(reason.trim() ? t("hla.reason.short") : t("hla.reason.missing")); return; }
      setConfirm(true);
    }
    function submitHold() {
      if (holdWhy.trim().length < 8) { setHoldErr(holdWhy.trim() ? t("hla.reason.short") : t("hla.reason.missing")); return; }
      setHolding(false);
      onHold(e.id, holdUntil, holdWhy.trim());
    }
    function submitLock() {
      if (lockWhy.trim().length < 8) { setLockErr(lockWhy.trim() ? t("hla.reason.short") : t("hla.reason.missing")); return; }
      setLocking(false);
      onLock(e.id, lockWhy.trim());
    }

    return (
      <PaneShell
        bare={bare}
        icon="attendance" iconTone={locked ? "off" : done ? "present" : "accent"}
        title={t(p.nameKey)}
        sub={fmtWd(t, e.dateISO) + " · " + e.id + " · " + t(p.deptKey)}
      >
        <DefRow label={t("hla30.col.kind")}>{t("hla30.k." + e.kind)}</DefRow>
        <DefRow label={t("hla30.col.becomes")}>{t("hla30.b." + e.becomes)}</DefRow>
        <DefRow label={t("hla30.col.state")}>{t("hla30.st." + e.state)}</DefRow>
        <DefRow label={t("hla30.col.shift")}>{p.shift ? t(shiftById(p.shift).nameKey) : t("hla30.noShift")}</DefRow>
        <DefRow label={t("hla30.col.paidNow")} mono>{num(paidDaysWith(lopNow))} / {num(AUG_DAYS)}</DefRow>
        {e.source === "outage" ? (
          <div style={{ marginTop: 12 }}>
            <Callout
              tone="off" icon="scan"
              body={t("hla30.outage.body", { device: t(OUTAGE.deviceKey), from: OUTAGE.from, to: OUTAGE.to, date: fmt(t, OUTAGE.dateISO), n: num(OUTAGE.affected.length) })}
              action={!settled && !locked && !done
                ? <Button kind="secondary" size="sm" iconLeft="scan" onClick={onOpenOutage}>{t("hla30.outage.allCta")}</Button>
                : null}
            />
          </div>
        ) : null}
        <div style={{ marginTop: 12 }}>
          <Callout tone="off" icon="clock" body={t("hla30.cor.snapshot", { run: RUN_AUG })} compact />
        </div>

        {byHand ? (
          /* locked BY A PERSON, inside an open month: it says who and
             why, and the door they closed is one they can reopen */
          <div style={{ marginTop: 14 }}>
            <Callout tone="off" icon="lock" title={t("hla30.lock.word")}
              body={t("hla30.lock.by", {
                name: t(e.lockedByKey || ME.nameKey), date: fmt(t, e.lockedOn || TODAY_ISO), why: e.lockReason || "",
              })} />
            <Actions>
              <Button kind="secondary" iconLeft="arrow" onClick={() => onUnlock(e.id)}>{t("hla30.lock.undo")}</Button>
            </Actions>
          </div>
        ) : locked ? (
          <div style={{ marginTop: 14 }}>
            <Callout tone="off" icon="lock" title={t("hla.lock.julyWord")} body={t("hla.lock.july", { run: RUN_JULY })}
              action={<Button kind="secondary" size="sm" disabled>{t("hla.lock.route")}</Button>} />
            <Actions>
              <Button kind="primary" disabled>{t("hla30.menu.correct")}</Button>
              <span style={ty("caption", { color: c.dangerText })}>{t("hla.lock.julyShort", { run: RUN_JULY })}</span>
            </Actions>
          </div>
        ) : settled ? (
          <div style={{ marginTop: 14 }}>
            <Callout tone="present" icon="check" title={t("hla30.st.settled")} body={t("hla30.settled.why")} />
          </div>
        ) : done ? (
          <div style={{ marginTop: 14 }}>
            <Callout tone="present" icon="check" title={t("hla30.st.corrected")}
              body={t("hla.recordedBy", { name: t(e.correctedByKey), date: fmt(t, e.correctedOn || TODAY_ISO) })} />
            <Note>{t("hla30.cor.beforeAfter")}</Note>
          </div>
        ) : held ? (
          <div style={{ marginTop: 14 }}>
            <Callout tone="late" icon="clock" title={t("hla30.hold.word")}
              body={t("hla30.hold.by", {
                name: t(e.heldByKey || ME.nameKey), date: fmt(t, e.holdUntil || TODAY_ISO), why: e.holdReason || "",
              })} />
            <Actions>
              <Button kind="primary" iconLeft="attendance" onClick={() => setCorrecting(true)}>{t("hla30.menu.correct")}</Button>
              <Button kind="secondary" iconLeft="arrow" onClick={() => onRelease(e.id)}>{t("hla30.hold.undo")}</Button>
            </Actions>
          </div>
        ) : (
          /* THREE ACTS, NOT ONE (designer). Correct it, wait for
             something with a date on the wait, or say it is right as
             it stands and close it with your name on that. */
          <div style={{ marginTop: 14 }}>
            <Actions>
              <Button kind="primary" iconLeft="attendance" onClick={() => setCorrecting(true)}>{t("hla30.menu.correct")}</Button>
              <Button kind="secondary" iconLeft="clock" onClick={() => setHolding(true)}>{t("hla30.hold.cta")}</Button>
              <Button kind="secondary" iconLeft="lock" onClick={() => setLocking(true)}>{t("hla30.lock.cta")}</Button>
            </Actions>
          </div>
        )}

        {holding ? (
          <Panel pop title={t("hla30.hold.title", { name: t(p.nameKey), date: fmt(t, e.dateISO) })} onClose={() => setHolding(false)}>
            <div style={{ width: 210, marginTop: 12 }}>
              <Field id="hla30-hold-until" label={t("hla30.hold.until")} hint={t("hla30.hold.untilHint")}>
                <Input id="hla30-hold-until" type="date" value={holdUntil} onChange={setHoldUntil} />
              </Field>
            </div>
            <ReasonField
              id="hla30-hold-why" label={t("hla30.hold.why")} hint={t("hla30.hold.whyHint")}
              value={holdWhy} onChange={(v) => { setHoldWhy(v); setHoldErr(""); }} error={holdErr}
            />
            <Actions>
              <Button kind="primary" onClick={submitHold}>{t("hla30.hold.submit")}</Button>
              <Button kind="ghost" onClick={() => setHolding(false)}>{t("hla.act.cancel")}</Button>
            </Actions>
          </Panel>
        ) : null}

        {locking ? (
          <Panel pop title={t("hla30.lock.title", { name: t(p.nameKey), date: fmt(t, e.dateISO) })} onClose={() => setLocking(false)}>
            <div style={{ marginTop: 12 }}>
              <span style={ty("caption", { color: c.inkFaint })}>{t("hla30.lock.now")}</span>
              <div style={{ marginTop: 5 }}>
                <StatusMark
                  role={e.becomes === "absent" ? "absent" : e.becomes === "half" ? "late" : "off"}
                  glyph={e.becomes === "absent" ? "alert" : "clock"} word={t("hla30.b." + e.becomes)} />
              </div>
              <p style={ty("small", { color: c.ink, margin: "10px 0 0" })}>
                {lopNow
                  ? t("hla30.lock.costs", { name: t(p.nameKey), a: num(paidDaysWith(lopNow)), b: num(AUG_DAYS) })
                  : t("hla30.lock.costsNone")}
              </p>
            </div>
            <ReasonField
              id="hla30-lock-why" label={t("hla30.lock.why")} hint={t("hla30.lock.whyHint")}
              value={lockWhy} onChange={(v) => { setLockWhy(v); setLockErr(""); }} error={lockErr}
            />
            <Actions>
              <Button kind="primary" onClick={submitLock}>{t("hla30.lock.submit")}</Button>
              <Button kind="ghost" onClick={() => setLocking(false)}>{t("hla.act.cancel")}</Button>
            </Actions>
          </Panel>
        ) : null}

        {correcting && !locked && !settled && !done ? (
          <Panel pop title={t("hla30.cor.title", { name: t(p.nameKey), date: fmt(t, e.dateISO) })} onClose={() => setCorrecting(false)}>
            <div style={{ marginTop: 12 }}>
              <span style={ty("caption", { color: c.inkFaint })}>{t("hla30.cor.now")}</span>
              <div style={{ marginTop: 5 }}>
                <StatusMark role={e.becomes === "absent" ? "absent" : "late"} glyph="alert" word={t("hla30.b." + e.becomes)} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 14 }}>
              <div style={{ width: 190 }}>
                <Field id="hla30-cor-st" label={t("hla30.cor.status")}>
                  <Select id="hla30-cor-st" value={status} onChange={setStatus}
                    options={["present", "half", "absent", "leave", "off", "holiday"].map((k) => ({ value: k, label: t("hla30.cor.s." + k) }))} />
                </Field>
              </div>
              <div style={{ width: 130 }}><Field id="hla30-cor-in" label={t("hla30.cor.in")}><Input id="hla30-cor-in" type="time" value={tin} onChange={setTin} /></Field></div>
              <div style={{ width: 130 }}><Field id="hla30-cor-out" label={t("hla30.cor.out")}><Input id="hla30-cor-out" type="time" value={tout} onChange={setTout} /></Field></div>
            </div>
            <div style={{ marginTop: 4 }}>
              <span style={ty("caption", { color: c.inkFaint })}>{t("hla30.cor.effect")}</span>
              {moved === 0 ? (
                <p style={ty("small", { color: c.ink, margin: "5px 0 0" })}>{t("hla30.cor.effectNone")}</p>
              ) : (
                <p style={ty("small", { color: c.ink, margin: "5px 0 0" })}>{t("hla30.cor.effectPaid", { name: t(p.nameKey), a: num(paidNow), b: num(paidAfter) })}</p>
              )}
            </div>
            <ReasonField id="hla30-cor-why" value={reason} onChange={(v) => { setReason(v); setErr(""); }} error={err} />
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              <Callout tone="off" icon="clock" body={t("hla30.cor.snapshot", { run: RUN_AUG })} compact />
            </div>
            <Actions>
              <Button kind="primary" onClick={submit}>{t("hla30.cor.submit")}</Button>
              <Button kind="ghost" onClick={() => setCorrecting(false)}>{t("hla.act.cancel")}</Button>
            </Actions>
            <Note>{t("hla30.cor.beforeAfter")}</Note>
          </Panel>
        ) : null}

        {confirm ? (
          <ConfirmDialog
            title={t("hla30.cor.title", { name: t(p.nameKey), date: fmt(t, e.dateISO) })}
            body={moved === 0 ? t("hla30.cor.effectNone") : t("hla30.cor.effectPaid", { name: t(p.nameKey), a: num(paidNow), b: num(paidAfter) })}
            confirmLabel={t("hla30.cor.submit")} cancelLabel={t("hla.act.cancel")}
            onCancel={() => setConfirm(false)}
            onConfirm={() => { setConfirm(false); setCorrecting(false); onCorrect(e.id, status, reason.trim()); }}
          >
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
              <DefRow label={t("hla30.cor.new")}>{t("hla30.cor.s." + status)}</DefRow>
              <DefRow label={t("hla.reason.label")}>{reason}</DefRow>
              <Callout tone="off" icon="clock" body={t("hla30.cor.snapshot", { run: RUN_AUG })} compact />
            </div>
          </ConfirmDialog>
        ) : null}

      </PaneShell>
    );
  }

  function RerunPanel({ onClose, onDone }) {
    const { t } = useLang();
    const [a, setA] = useState(AUG_FIRST_ISO);
    const [b, setB] = useState(TODAY_ISO);
    const blocked = a < AUG_FIRST_ISO;
    return (
      <Panel title={t("hla30.rerun.title")} sub={t("hla30.rerun.body")} onClose={onClose} tone={blocked ? "warn" : null}>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 12 }}>
          <div style={{ width: 200 }}><Field id="hla30-rr-a" label={t("hla30.rerun.from")}><Input id="hla30-rr-a" type="date" value={a} onChange={setA} /></Field></div>
          <div style={{ width: 200 }}><Field id="hla30-rr-b" label={t("hla30.rerun.to")}><Input id="hla30-rr-b" type="date" value={b} onChange={setB} /></Field></div>
        </div>
        {blocked
          ? <Callout tone="off" icon="lock" body={t("hla30.rerun.locked", { lock: t("hla.lock.julyShort", { run: RUN_JULY }) })} />
          : <Callout tone="late" icon="clock" body={t("hla30.rerun.queued", { from: fmt(t, a), to: fmt(t, b) })} compact />}
        <Actions>
          <Button kind="primary" onClick={() => { if (!blocked) onDone(a, b); }} disabled={blocked}>{t("hla30.rerun.submit")}</Button>
          <Button kind="ghost" onClick={onClose}>{t("hla.act.cancel")}</Button>
        </Actions>
      </Panel>
    );
  }

  /* ============================================================
     THE SCREEN — one component, five tabs, the kit's own ARIA-complete
     Tabs/TabPanel pair (roving tabindex, Left/Right/Home/End, one
     panel bound to its tab by id). Panels render one at a time, so a
     tab switch is a content switch and never a route change.
     ============================================================ */
  /* Three tabs, in the order the work happens: the queue somebody is
     waiting on, the balances it spends, the policy both obey.
     Shifts & rosters (HR-29) and Exceptions (HR-30) moved to the Staff
     attendance module on 2026-09-28 — they are about punches, not
     leave, and they were the two tabs nobody found here. */
  const TAB_DEFS = [
    { key: "requests", labelKey: "hla.tab.requests", qKey: "hla.q.requests", code: "HR-28" },
    { key: "balances", labelKey: "hla.tab.balances", qKey: "hla.q.balances", code: "HR-27" },
    { key: "policy", labelKey: "hla.tab.policy", qKey: "hla.q.policy", code: "HR-26" },
  ];

  /* ---- CAMPUS, 2026-09-28 -------------------------------------
     HR sits above more than one school, and every list in this module
     is campus-scoped: the queue, the balances register, the policy
     itself. The toggle is therefore at page level and re-mounts the
     tab (via `key`), so nothing can carry a selection from Indiranagar
     into Whitefield. Campus keys are leaveflow's own — this module
     does not invent a second spelling of a campus. */
  /* the spec code is for the people who wrote the spec; a tab says
     what is behind it and nothing else */
  function TabLabel({ def }) {
    const { t } = useLang();
    return <span>{t(def.labelKey)}</span>;
  }

  function HRLeaveAtt({ role, onNavigate }) {
    const { c } = useTheme();
    const { t, ty, lang } = useLang();
    const L = G3.layout;
    /* requests first: it is the only tab where somebody is waiting */
    const [tab, setTab] = useState("requests");
    const [flash, setFlash] = useState("");
    /* HR holds more than one campus, and every list on this module is
       scoped by it — the toggle is therefore page-level, next to the
       title, not a filter buried inside one tab. */
    const [campus, setCampus] = useState("indiranagar");
    /* a tab can be opened AT something — the ledger's "open it" sends
       the reader to the request itself rather than to the queue */
    const [target, setTarget] = useState(null);
    const def = TAB_DEFS.filter((d) => d.key === tab)[0];

    /* a jump carries its origin, so the screen it opens can offer a
       named way back instead of a Close that lands nowhere */
    const [from, setFrom] = useState(null);
    /* which ledger the balances tab should re-open on arrival */
    const [balanceAt, setBalanceAt] = useState(null);
    /* a tab picked by hand opens on its own list, not on whatever the
       last jump left behind */
    function go(k, at, origin) { setTab(k); setFlash(""); setTarget(at || null); setFrom(origin || null); setBalanceAt(null); }
    function goBack() {
      if (!from) return;
      const f = from;
      setFrom(null); setTarget(null); setTab(f.tab); setFlash("");
      if (f.tab === "balances") setBalanceAt(f.id || null);
    }

    return (
      <div className="nv3" style={{ display: "flex", minHeight: "100vh", background: c.page, color: c.ink, fontFamily: G3.font.ui }}>
        <Rail role={role || "hr"} active="hrLeaveAtt" onNavigate={onNavigate} initials="MI" />
        <main style={{ flex: 1, minWidth: 0, position: "relative", overflowX: "clip" }}>
          <Motif />
          <div style={{ position: "relative", zIndex: 1, maxWidth: L.contentMax, margin: "0 auto", padding: "22px " + L.contentPadX + "px 64px" }}>
            <TopStrip navKey="nav.hrLeaveAtt" />
            <PageHeader
              title={t("hla.title")}
              meta={t("hla.meta", { school: t("home.school"), campus: campusLabel(t, campus) })}
              right={<CampusSwitch value={campus} onChange={(k) => { setCampus(k); setFlash(""); }} />}
            />

            <div style={{ marginBottom: 20 }}>
              <Tabs
                idBase="hla" ariaLabel={t("hla.tabs.aria")} active={tab} onChange={go} size="lg"
                items={TAB_DEFS.map((d) => ({ key: d.key, label: <TabLabel def={d} /> }))}
              />
              <p style={ty("small", { color: c.inkMuted, margin: "14px 2px 0" })}>{t(def.qKey)}</p>
            </div>

            <TabPanel idBase="hla" tabKey={tab}>
              {tab === "requests" ? <RequestsTab key={campus + (target || "")} campus={campus} target={target} back={from} onBack={goBack} flash={flash} setFlash={setFlash} /> : null}
              {tab === "balances" ? <BalancesTab key={campus + (balanceAt || "")} campus={campus} openAt={balanceAt} flash={flash} setFlash={setFlash} onGoTab={go} /> : null}
              {tab === "policy" ? <PolicyTab key={campus} campus={campus} flash={flash} setFlash={setFlash} /> : null}
            </TabPanel>
          </div>
        </main>
      </div>
    );
  }

  /* ============================================================
     export
     ============================================================ */
  window.Pages3 = window.Pages3 || {};
  window.Pages3.HRLeaveAtt = HRLeaveAtt;
  /* Shifts & rosters and Exceptions moved to the Staff attendance
     module on 2026-09-28. They are MOUNTED there rather than copied:
     both read this file's shift, roster, exception and staff data, and
     a second copy of that data is exactly the drift this repo keeps
     finding. */
  window.Pages3.AttShiftsTab = ShiftsTab;
  window.Pages3.AttExceptionsTab = ExceptionsTab;
})();

/* ============================================================
   SELF-CHECK (informational, read at review time):

   OFFERED / DISABLED-WITH-THE-REASON / ABSENT — applied, not mixed:
   · ABSENT  — approve, reject and force-approve on HR-28. The HR
     Operator role does not hold `leave.approve` (M8 §Permissions), so
     no control, no ghost, no tooltip. The rule is taught once, in
     prose, on the "Approving is not yours" card.
   · ABSENT  — any salary, CTC, bank, PAN, Aadhaar or UAN column. The
     only rupee figures on this screen are DERIVED loss-of-pay costs,
     inside a single decision surface, each printed with "derived from
     monthly gross / 30; salary itself is not shown".
   · DISABLED + REASON — "Initialise balances" (already done, on a
     date, by a named person); "Correct this record" in July (names
     run PR-2026-07 and offers the arrears route); "Correct this
     record" while the head of department is deciding; "Deactivate
     this shift" with the assigned count; "Build the rotating roster"
     on a non-rotating shift; "Move the approval" on a decided
     request; "Cancel" once leave has started or the month is closed;
     "Supersede" on the statutory maternity entitlement; "Assign" and
     "Supersede the timings" with an effective date inside July.
   · OFFERED — everything HR actually holds: apply on behalf, move an
     approval, cancel, adjust, bulk-credit, create/assign/edit shifts,
     rebuild a roster, correct, bulk-resolve an outage, push to the
     manager, re-run reconciliation, export.

   NOTHING COMMITS ON ONE CLICK. Every consequential act is a panel or
   a dialog with a REQUIRED reason (>= 8 characters, or the field goes
   red and says so) plus a stated consequence. No submit button is ever
   hard-`disabled` to mean "not valid yet" — it stays clickable and
   reveals the errors, which is the only way a user learns what is
   missing. `disabled` is reserved for a real, named refusal.

   ARITHMETIC RECONCILES IN THE DOM:
   · opening + accrued - taken = balance, computed by ledgerOf(), on
     every HR-27 row and on the totals line.
   · loss of pay = gross / 30 x days, computed by lopMoney(); Ananya
     Rao's day is Rs 3,160.00, the same figure attendance.jsx,
     leave.jsx and payslips.jsx use.
   · HR-30's headline risk is the sum over unresolved rows, not a
     typed number; the outage's cost is the sum over the people who
     would actually be corrected.
   · paid days = 31 - loss-of-pay days (M9's rule, August 2026).

   HEALTH-ADJACENT DATA: the leave TYPE appears on the request console
   (HR-28 must contain it) and on the per-type balance ledger (which is
   a per-type ledger by definition). It appears NOWHERE on a shared
   surface: the campus day-view and the roster grid say "On leave" and
   nothing else, and awayOn() does not even return the type, so a
   future edit cannot leak it by accident. The free-text REASON is read
   only inside one opened request.

   NO RAW COLOUR: grep -E "#[0-9A-Fa-f]{3,6}|rgba?\(" over this file
   returns nothing. Every colour is c.* from useTheme() or G3.*.
   ============================================================ */
