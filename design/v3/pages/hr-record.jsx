/* @jsxRuntime classic */
/* ============================================================
   Naveya — HR employee record · window.Pages3.HRRecord
   HR-03 (shell) + HR-04 / HR-05 / HR-06 / HR-07 (facets)

   This is what HR opens when a person walks up with a problem:
   who she is, what she is contracted to, what has happened to her,
   and what the school holds about her. Four questions, one subject,
   so it is a SUBJECT SHELL with tabs — not four rail items and not
   one mega-form (docs/screen-inventory.md §10 C1; alfred's
   decomposition). The shell shows state and alerts and never a form;
   every form lives on the facet that owns it.

   Spec anchors:
     · M3 §Purpose / §6.3 Employee, StaffCategory, EmploymentContract,
       ServiceRecord · M3 §Business rules (the contract is the centre
       of gravity; every lifecycle change writes a ServiceRecord)
     · M4 in full — HR initiates, the employee only responds, HR
       verifies; §6.4 StaffDocument / DocumentUpdateRequest
     · M12 §Business rules — gratuity from continuous service
     · §4.1 field-level PII permissions · §4.2 audit · §4.3
       effective-dating · §8 PII classification, field-level access,
       child-safety
     · docs/ui-compliance-requirements.md O3, O4, O6, O8, O11, O18,
       A9, A10, A11, A12, A14–A21, §3 "never build"

   THE FOUR RULES THAT SHAPE EVERY PART OF IT

   1 · This is the deepest PII surface in the product, so masking is
       the DEFAULT STATE OF THE FIELD, not a role-dependent one — for
       HR too (O3). The full value is CONDITIONALLY RENDERED: while
       masked it is absent from the DOM, not hidden in CSS, not in a
       title, not in a data-* attribute. One field opens at a time,
       opening another closes the first, and every opening writes a
       line HR can see happening. Aadhaar has NO reveal for anybody:
       the last four digits are the fullest form that exists.
       Nothing here reaches a URL, a heading or a clipboard.

   2 · Supersede, never delete. Contracts are revised by a new dated
       version; service-book entries are added and a mistake is put
       right by a later entry that names the earlier one; a document
       is replaced and the copy it replaced stays in the history.
       There is no delete control anywhere on this screen, in any
       state, for anybody.

   3 · The employee cannot write a document (M4). Every route from
       this screen to a document is HR's: put a copy on record, ask
       her for one, check what came back, or send it back with a
       reason she reads word for word. Its employee half is
       pages/documents.jsx and its queue is hr.jsx HR-09; the words
       are deliberately the same on all three.

   4 · Salary is not on this record. The pay GROUP is a contract
       term and is shown; the AMOUNT is payroll's, behind its own
       permission, and it is never an incidental column beside a
       person's name. So no money is rendered on this screen at all,
       and the absence is stated rather than left as a gap.

   Composed only from window.G3 / window.UI3. kit.jsx, tokens.jsx,
   screens.jsx, v3.html and every sibling pages/*.jsx are untouched
   by this file.
   ============================================================ */
(function () {
  const G3 = window.G3;
  const UI = window.UI3;
  const { useState, useEffect, useRef } = React;
  const {
    useTheme, ThemeToggle, useLang, addStrings,
    Rail, Motif, Card, Register, Button, LinkButton, BackBar, Chip, StatusMark,
    Icon, ActionMenu, EmptyState, Field, Input, Select, Tabs, TabPanel, num, inr, Tip, FileField, Figure, MetricCell, MetricStrip, Avatar,
  } = UI;

  /* The demo clock. Every date on this screen is an ISO literal and
     every span, countdown and "days left" is DERIVED from it — so the
     screen cannot drift out of agreement with itself the way a
     hand-typed "62 days" does. */
  /* her facts, shared with her own profile (v3/person.jsx) */
  const P = window.NaveyaPerson;

  const TODAY = "2026-08-11";
  /* a countdown in days is useful near the edge and noise far from it
     ("in 2,351 days" for a 2033 certificate tells nobody anything), so
     the horizon is a named constant, not a magic number in a cell */
  const EXPIRY_HORIZON_DAYS = 180;
  const DOJ = P.contract.doj;
  const GRATUITY_YEARS = P.service.gratuityYears;

  /* ============================================================
     STRINGS — rec3.* is this dispatch's whole namespace. EN and HI
     carry exactly the same key set. Every demo value is authored in
     both languages — names, designations, reasons, details, document
     names — because untranslated mock content is the i18n leak this
     system keeps re-finding, not missing UI chrome.
     ============================================================ */
  addStrings({
    en: {
      "rec3.mon.01": "Jan", "rec3.mon.02": "Feb", "rec3.mon.03": "Mar",
      "rec3.mon.04": "Apr", "rec3.mon.05": "May", "rec3.mon.06": "Jun",
      "rec3.mon.07": "Jul", "rec3.mon.08": "Aug", "rec3.mon.09": "Sep",
      "rec3.mon.10": "Oct", "rec3.mon.11": "Nov", "rec3.mon.12": "Dec",

      "rec3.who.meera": "Meera Iyer, HR",
      "rec3.who.rajan": "Rajan Pillai, HR",
      "rec3.who.kavita": "Kavita Sharma, payroll",
      "rec3.who.anjali": "Anjali Deshpande, Head of Science",
      "rec3.who.you": "you",
      "rec3.rail.initials": "MI",

      /* ---- shell (HR-03) ---- */
      "rec3.crumb.back": "Back to the staff register",
      "rec3.ro.head": "You are reading this record, not keeping it",
      "rec3.ro.body": "The group office reads the record; HR alone changes it. Every control below is switched off rather than hidden.",
      "rec3.ro.why": "HR keeps this record. From the group office it can be read, not changed.",
      "rec3.ro.pay": "Not shown here",
      "rec3.ro.payNote": "What somebody is paid is the payroll desk’s, and the group office answers for neither the run nor the figure.",
      "rec3.ro.showAria": "{field} cannot be opened from the group office",
      "rec3.crumb.here": "Employee record",
      "rec3.id.name": "Ananya Rao",
      "rec3.id.initials": "AR",
      "rec3.id.desig": "Post Graduate Teacher, Physics",
      "rec3.id.where": "Science department, Indiranagar",
      "rec3.id.code": "Staff ID",
      "rec3.id.noPhoto": "No photograph on record",
      "rec3.id.menuAria": "Actions on this record",
      "rec3.st.active": "Working",
      "rec3.st.permanent": "Permanent",
      "rec3.st.vacation": "Teaching staff",
      "rec3.st.login": "Can sign in",

      "rec3.f.employment": "Employment",
      "rec3.f.vacation": "Staff type",
      "rec3.f.vacationV": "Teaching",
      "rec3.f.doj": "Joined",
      "rec3.f.confirmed": "Confirmed",
      "rec3.f.contractEnd": "Contract ends",
      "rec3.f.contractEndNone": "No end date",
      "rec3.f.payGroup": "Pay group",
      "rec3.f.payGroupV": "Teaching, monthly",
      "rec3.f.reportsTo": "Reports to",

      "rec3.x.head": "The rest of her file",
      "rec3.x.leave": "Leave and attendance",
      "rec3.x.compliance": "Document expiry watch",
      "rec3.x.help": "Her helpdesk tickets",
      "rec3.x.pay": "Pay is not on this record. Salary, payslips and Form 16 are payroll's, behind their own permission.",

      "rec3.al.head1": "One document needs attention",
      "rec3.al.headN": "{count} documents need attention",
      "rec3.al.w.expired": "Expired",
      "rec3.al.w.expiring": "Expiring",
      "rec3.al.w.withHer": "Waiting",
      "rec3.al.w.waiting": "Waiting on you",
      "rec3.al.w.missing": "Not on record",
      "rec3.al.n.medical": "Medical fitness",
      "rec3.al.n.training": "Child-protection training",
      "rec3.al.n.open1": "One document request",
      "rec3.al.n.openN": "{count} document requests",
      "rec3.al.n.address": "Address proof",
      "rec3.al.f.ago": "{n} days ago",
      "rec3.al.f.in": "in {n} days",
      "rec3.al.f.due": "earliest due {date}",
      "rec3.al.f.required": "required for her category",
      "rec3.al.a.check": "Check it",
      "rec3.al.a.ask": "Ask for it",
      "rec3.al.a.open": "Open",
      "rec3.al.clear.head": "Nothing is waiting on this record",
      "rec3.al.clear.body": "No document is expired or expiring, and nothing is open.",

      "rec3.tabsAria": "Parts of this employee record",
      "rec3.tab.personal": "Personal",
      "rec3.tab.contract": "Contract",
      "rec3.tab.service": "Service book",
      "rec3.tab.docs": "Documents",
      "rec3.tab.appraisal": "Appraisal",
      "rec3.ap.q": "What post did she come in on, and where has she got to?",
      "rec3.ap.title": "Appraisals",
      "rec3.ap.nowPost": "Post today",
      "rec3.ap.since": "since {d}",
      "rec3.ap.latest": "Most recent",
      "rec3.ap.samePost": "Stayed {post}",
      "rec3.ap.appointed": "Appointed — {post}",
      "rec3.ap.by": "{who} · {id}",
      "rec3.ap.note": "Append-only. An appraisal is superseded by the next, never rewritten.",
      "rec3.ap.post.tgt": "Trained Graduate Teacher, Physics",
      "rec3.ap.post.pgt": "Post Graduate Teacher, Physics",
      "rec3.ap.said.2526": "Board results held at last year's average with nobody below the pass mark. Remedial hours slipped in the exam weeks.",
      "rec3.ap.said.2425": "Ready for the senior classes. Two terms of XI and XII cover and the results carried. Moving her up, with the lab in her charge.",
      "rec3.ap.pay": "Pay",
      "rec3.ap.payHidden": "Not shown",
      "rec3.ap.payShow": "Show it",
      "rec3.ap.payHide": "Hide it",
      "rec3.ap.payLogged": "Opening this is on the record.",
      "rec3.ap.rise": "{n}% more",
      "rec3.ap.add": "Record an appraisal",
      "rec3.ap.addBody": "The appraisal has already happened. Write down what it decided — this is the one place a post and a salary move together.",
      "rec3.ap.addDone": "Recorded. She is {post} from {d}, and her pay on the Personal tab has moved with it.",
      "rec3.ap.f.on": "Decided on",
      "rec3.ap.futureWarn": "That date has not happened yet. An appraisal is recorded after the conversation, not before it.",
      "rec3.ap.f.moved": "Did the post change?",
      "rec3.ap.f.movedNo": "No — still {post}",
      "rec3.ap.f.movedYes": "Yes, she moves up",
      "rec3.ap.f.post": "The post she moves to",
      "rec3.ap.f.postHint": "Replaces {post} on her record and on every screen that names it.",
      "rec3.ap.f.postPh": "Head of Physics",
      "rec3.ap.f.gross": "Monthly gross from now",
      "rec3.ap.f.grossHint": "She is on {now} today. Leave it as it is if the appraisal did not change her pay.",
      "rec3.ap.f.riseLine": "{a} → {b}. A rise of {n}%.",
      "rec3.ap.f.cutLine": "{a} → {b}. A cut of {n}%. Say why in the line below.",
      "rec3.ap.f.said": "What was said",
      "rec3.ap.f.saidHint": "The sentence the two of them agreed on. She reads it, and so does whoever appraises her next.",
      "rec3.ap.f.saidPh": "Ready for the senior classes; moving her up, with the lab in her charge.",
      "rec3.ap.f.submit": "Record it",
      "rec3.ap.err.post": "Name the post she moves to.",
      "rec3.ap.err.gross": "A monthly gross, please.",
      "rec3.ap.err.said": "Write what was said. An appraisal with no words is a number nobody can explain later.",
      "rec3.ap.err.saidShort": "A sentence, please — enough for somebody reading it in five years.",
      "rec3.ap.c.post": "Her post becomes {post} everywhere it is named — the register, her profile, the roster, her signature block.",
      "rec3.ap.c.postSame": "Her post does not change.",
      "rec3.ap.c.pay": "The new gross goes on her record and is picked up by the next payroll run. Payroll prices it; nothing is paid from this screen.",
      "rec3.ap.c.append": "It is appended. Nothing above it changes.",
      "rec3.tab.finance": "Finance",

      /* ---- paid days (HR-03e) ---- */
      "rec3.pd.title": "Paid days",
      "rec3.pd.monthAria": "Which month",
      "rec3.pd.of": "of {n} days in service",
      "rec3.pd.frozen": "Frozen for {run} on {d}",
      "rec3.pd.frozenNote": "Nothing on this month moves now. A correction after the freeze is carried as arrears on the next run.",
      "rec3.pd.paidOn": "Paid on {d}",
      "rec3.pd.paidNote": "Closed. It is here so the months read against each other.",
      "rec3.pd.open": "Open — the run has not been frozen",
      "rec3.pd.openNote": "The figure still moves as the month is corrected.",
      "rec3.pd.gridAria": "Every day of {mon}, one letter each",
      "rec3.pd.make": "What makes it up",
      "rec3.pd.src.P": "Present, as the readers recorded it",
      "rec3.pd.src.L": "Paid leave, approved by her department head",
      "rec3.pd.src.H": "Declared holidays in the school calendar",
      "rec3.pd.src.W": "Weekly offs",
      "rec3.pd.src.X": "Loss of pay",
      "rec3.pd.src.Xnone": "Loss of pay — none this month",
      "rec3.pd.arith": "{P} + {L} + {H} + {W} = {paid} paid. The {X} unpaid are the only days left out.",
      "rec3.pd.noMoney": "Days, not money. What a day is worth sits on her salary structure, behind payroll's permission.",
      "rec3.pd.fixWhere": "A day that looks wrong is put right on the staff attendance screen, under Days to fix. Payroll reads these and cannot change them.",
      "rec3.pd.fixGo": "Put a day right",
      "rec3.pd.whereFrozen": "The figure is frozen on payroll's paid-days screen. Ask payroll if a month here does not match a payslip.",
      "rec3.pd.code.P": "P", "rec3.pd.code.L": "L", "rec3.pd.code.H": "H",
      "rec3.pd.code.W": "W", "rec3.pd.code.X": "X", "rec3.pd.code.N": "—",
      "rec3.pd.name.P": "present", "rec3.pd.name.L": "paid leave", "rec3.pd.name.H": "holiday",
      "rec3.pd.name.W": "weekly off", "rec3.pd.name.X": "loss of pay", "rec3.pd.name.N": "not in service",
      "rec3.pd.wd.0": "S", "rec3.pd.wd.1": "M", "rec3.pd.wd.2": "T", "rec3.pd.wd.3": "W",
      "rec3.pd.wd.4": "T", "rec3.pd.wd.5": "F", "rec3.pd.wd.6": "S",

      "rec3.menu.invite": "Resend her sign-in invite",
      "rec3.menu.deactivate": "Switch off her sign-in",
      "rec3.menu.exit": "Start the exit process",
      "rec3.menu.export": "Print or export this record",

      /* ---- HR-04 personal + statutory ---- */
      "rec3.p.q": "Are her identity and statutory details correct?",
      "rec3.p.person.title": "Personal details",
      "rec3.p.person.sub": "What the office holds about her as a person.",
      "rec3.p.g.reach": "How to reach her",
      "rec3.p.name": "Name",
      "rec3.p.gender": "Gender",
      "rec3.p.genderV": "Female",
      "rec3.p.code": "Staff ID",
      "rec3.p.campus": "Campus",
      "rec3.p.campusV": "Indiranagar",
      "rec3.p.dept": "Department",
      "rec3.p.deptV": "Science",
      "rec3.p.status": "Status",
      "rec3.p.statusV": "Working",
      "rec3.p.dob": "Date of birth",
      "rec3.p.phone": "Personal phone",
      "rec3.p.email": "School email",
      "rec3.p.emailV": "ananya.rao@example.edu",
      "rec3.p.address": "Home address",
      "rec3.p.addressV": "Flat 4B, Anjali Residency, 5th Main, Indiranagar, Bengaluru 560038",
      "rec3.p.addressMasked": "XXXX, Indiranagar, Bengaluru 560038",
      "rec3.p.kin": "In an emergency",
      "rec3.p.kinName": "Vikram Rao, husband",
      "rec3.p.changed": "Last changed by {who}, {date}",

      "rec3.p.edit": "Edit",
      "rec3.p.editBank": "Edit her salary account",
      "rec3.ap.f.pct": "Rise agreed (%)",
      "rec3.ap.f.pctHint": "The percentage the appraisal settled on. Payroll turns it into figures.",
      "rec3.ap.f.pctNote": "Arithmetic, not a decision. The payroll officer sets the actual components, and may land elsewhere.",
      "rec3.ap.err.pct": "Enter the percentage the appraisal agreed.",
      "rec3.ap.c.toPayroll": "The rise goes to the payroll officer, who sets the figures",
      "rec3.ap.addSent": "Recorded, and the {pct}% rise is with the payroll officer.",
      "rec3.ap.rs.waiting": "With payroll",
      "rec3.ap.rs.waitingWhy": "The figure appears here once payroll sets it.",
      "rec3.ap.rs.set": "Figures set",
      "rec3.ap.rs.setBy": "Set by {who}, and released by the accountant.",
      "rec3.ap.rs.declined": "Declined by payroll",
      "rec3.ap.rs.by": "{who}",

      "rec3.bd.head": "What the salary is made of",
      "rec3.bd.sub": "Priced by {structure}. The same figures the payroll officer reads \u2014 there is no second version of this.",
      "rec3.bd.ro": "Read-only",
      "rec3.bd.earn": "Earnings",
      "rec3.bd.ded": "Deductions",
      "rec3.bd.emp": "The school pays on top",
      "rec3.bd.grossLabel": "Gross",
      "rec3.bd.dedTotal": "Total deductions",
      "rec3.bd.net": "Net pay",
      "rec3.bd.empTotal": "Employer contributions",
      "rec3.bd.cost": "Total cost",
      "rec3.bd.wages": "Wages, which PF is charged on: {wages}. Excluded allowances are {pct} of gross; the Labour Code allows half.",
      "rec3.bd.cannotEdit": "These figures are the payroll officer's. A second editable copy is how two desks end up disagreeing.",
      "rec3.bd.request": "Change the salary",

      "rec3.cr.title": "Change the salary",
      "rec3.cr.body": "The pay group decides how it is split. Put the figures in and the parts are worked out below.",
      "rec3.cr.gross": "Monthly salary",
      "rec3.cr.basic": "Basic pay",
      "rec3.cr.basicHint": "The grade on the contract. The rest follows from it.",
      "rec3.cr.note": "Why it changed",
      "rec3.cr.noteHint": "A sentence is enough.",
      "rec3.cr.notePh": "Promotion agreed at the April appraisal.",
      "rec3.cr.c1": "Payroll sees the new figure on their register",
      "rec3.cr.c2": "The old figure stays on the record, dated",
      "rec3.cr.go": "Save the salary",
      "rec3.cr.done": "Salary saved. Payroll can see it.",
      "rec3.cr.err": "A figure, please",
      "rec3.cr.errOver": "Basic pay cannot be more than the salary",
      "rec3.cr.parts": "What it is made of",
      "rec3.cr.grade": "The grade on the contract",
      "rec3.cr.pct": "{n}% of {of}",
      "rec3.cr.flat": "A fixed amount",
      "rec3.cr.bal": "Whatever is left of the salary",
      "rec3.cr.total": "Monthly salary",
      "rec3.cr.openHead": "Payroll has asked about this",
      "rec3.cr.openBy": "Asked by {who}, not yet answered",
      "rec3.pp.title": "No salary set yet",
      "rec3.pp.sub": "Payroll cannot run this person until there is one.",
      "rec3.pp.state": "Waiting on you",
      "rec3.pp.body": "You created this person on {on} and chose the pay group. The salary is yours to set.",
      "rec3.pp.why": "Set it here. Payroll reads it, and asks you if it looks wrong.",
      "rec3.pp.officer": "Sunita Kulkarni, Payroll Officer",
      "rec3.pp.groupLabel": "Pay group you chose",
      "rec3.pp.group": "Teaching staff, monthly",
      "rec3.pp.remind": "Set the salary",
      "rec3.pp.remindNone": "Payroll has not asked about this yet.",
      "rec3.pp.remind1": "Payroll asked once, on {on}.",
      "rec3.pp.remindN": "Payroll has asked {n} times, last on {on}.",
      "rec3.fn.q": "What is she paid, how did it get there, and what does this month pay for?",
      "rec3.fn.now.title": "What she is on",
      "rec3.fn.now.sub": "What her record holds. The month itself is payroll's.",
      "rec3.fn.annual": "A year at this figure",
      "rec3.fn.annualNote": "Twelve times the contracted gross",
      "rec3.fn.tl.title": "Salary timeline",
      "rec3.fn.tl.sub": "Every step came from an appraisal or a contract revision, and each one names it.",
      "rec3.fn.tl.show": "Show the figures",
      "rec3.fn.tl.hide": "Hide the figures",
      "rec3.fn.tl.hidden": "Four revisions since she was appointed. The figures are masked until you open them, and opening them is on the record.",
      "rec3.fn.tl.current": "Current",
      "rec3.fn.tl.effective": "Effective {d}",
      "rec3.fn.tl.revision": "Salary revision",
      "rec3.fn.tl.appointed": "Appointed",
      "rec3.fn.tl.monthly": "Monthly gross",
      "rec3.fn.tl.year": "A year at it",
      "rec3.fn.tl.step": "The step",
      "rec3.fn.tl.from": "Up {amt} on {was}, a rise of {pct}",
      "rec3.fn.tl.why": "Recorded against {id}",
      "rec3.fn.tl.whyNone": "The figure she was appointed on",
      "rec3.fn.tl.foot": "Pay is never edited here without one of these behind it.",
      "rec3.fn.pd.head": "What this month pays for",

      "rec3.p.pay.group": "Pay group",
      "rec3.p.pay.groupV": "Teaching staff, monthly",
      "rec3.p.pay.cycle": "Cycle",
      "rec3.p.pay.cycleV": "1st to the last day, credited on the 2nd",
      "rec3.p.pay.gross": "Contracted monthly gross",
      "rec3.p.pay.grossNote": "From the contract in force since {date}",
      "rec3.p.pay.account": "Credited to",
      "rec3.p.pay.last": "Last credited",
      "rec3.p.pay.lastV": "July 2026, on 2 Aug 2026",
      "rec3.p.pay.note": "Payslips, arrears and Form 16 are the payroll run's, not this record's.",
      "rec3.edit.now": "Now",
      "rec3.edit.ph": "Leave blank to keep it",
      "rec3.edit.why": "Why it is changing",
      "rec3.edit.whyHint": "One line. It is saved with the change and stays on the record.",
      "rec3.edit.whyPh": "She brought the corrected copy",
      "rec3.edit.save": "Save the change",
      "rec3.edit.saved": "Saved, with your name and your reason",
      "rec3.edit.note": "The earlier value stays on the record. Nothing is deleted.",
      "rec3.edit.person.title": "Edit her personal details",
      "rec3.edit.person.body": "Type only what is changing. Anything left blank stays as it is, and the value you replace stays on the record underneath.",
      "rec3.edit.person.kinHint": "Number and relationship, as she gave them",
      "rec3.edit.ids.title": "Edit the numbers filed in her name",
      "rec3.edit.ids.body": "Type only what is changing. The current value is shown masked — replacing one does not reveal it.",
      "rec3.edit.ids.aadhaarHint": "Only the last four digits are ever shown back, here or anywhere else.",
      "rec3.edit.ids.note": "Saved against your name. A wrong PAN or UAN reaches the next filing, so check the document before you save.",
      "rec3.edit.bank.title": "Edit her salary account",
      "rec3.edit.bank.body": "This is where her salary is credited. Type the account as the passbook or cancelled cheque shows it.",
      "rec3.edit.bank.ifscHint": "Eleven characters, as printed",
      "rec3.edit.bank.note": "Saved against your name and used from the next payroll run. Keep the proof on her file.",
      "rec3.p.ids.title": "Numbers filed in her name",
      "rec3.p.ids.sub": "Masked by default, for every role including yours.",
      "rec3.p.ids.pan": "PAN",
      "rec3.p.ids.aadhaar": "Aadhaar",
      "rec3.p.ids.uan": "Provident fund (UAN)",
      "rec3.p.ids.esic": "Insurance number (ESIC)",
      "rec3.p.ids.bank": "Salary account",
      "rec3.p.ids.ifsc": "IFSC",
      "rec3.p.ids.bankName": "HDFC Bank, Indiranagar",
      "rec3.p.show": "Show",
      "rec3.p.hide": "Hide",
      "rec3.p.showAria": "Show {field}. This is recorded against your name.",
      "rec3.p.hideAria": "Hide {field}",
      "rec3.p.neverFull": "Last four digits only",
      "rec3.p.aadhaarWhy": "An Aadhaar number is never shown in full \u2014 not to you, not to her, nowhere in Naveya.",
      "rec3.p.missingOk": "Not everyone has all of these. What changes is what can be filed for her, and that is said where it lands.",


      /* ---- HR-05 contract ---- */
      "rec3.c.q": "What are the terms of her employment?",
      "rec3.c.cur.title": "The contract in force",
      "rec3.c.cur.sub": "In force since {date}. Terms are revised by a new dated version, never edited.",
      "rec3.c.cat": "Staff category",
      "rec3.c.catV": "Post Graduate Teacher",
      "rec3.c.kind": "Kind",
      "rec3.c.kindV": "Teaching",
      "rec3.c.minQual": "Minimum qualification",
      "rec3.c.minQualV": "Post-graduate degree, B.Ed., and a teacher-eligibility certificate",
      "rec3.c.type": "Employment type",
      "rec3.c.typeV": "Permanent",
      "rec3.c.vacation": "Staff type",
      "rec3.c.doj": "Date of joining",
      "rec3.c.confirmed": "Confirmed on",
      "rec3.c.end": "Contract ends",
      "rec3.c.endNone": "No end date. This contract does not expire on its own.",
      "rec3.c.notice": "Notice period",
      "rec3.c.noticeV": "60 days",
      "rec3.c.payGroup": "Pay group",
      "rec3.c.payGroupNote": "The group, not the amount. What she is paid is payroll's.",
      "rec3.c.act.title": "Changing this contract",
      "rec3.c.act.sub": "Nothing here edits. Every change is a new dated version, and the one it replaces stays readable.",
      "rec3.c.revise": "Revise, effective from a date",
      "rec3.c.confirmProb": "Confirm probation",
      "rec3.c.confirmProbNo": "She was confirmed on {date}. This applies only while someone is still on probation.",
      "rec3.c.renew": "Renew or extend",
      "rec3.c.renewNo": "Her contract has no end date, so there is nothing to renew.",
      "rec3.c.transfer": "Move her department or campus",

      "rec3.c.vac.aria": "What the vacation-staff flag does",
      "rec3.c.role.title": "What she does",
      "rec3.c.role.sub": "The job behind the designation.",
      "rec3.c.role.desig": "Designation",
      "rec3.c.role.subjects": "Teaches",
      "rec3.c.role.subjectsV": "Physics, classes 11 and 12",
      "rec3.c.role.where": "Department and campus",
      "rec3.c.role.whereV": "Science, Indiranagar",
      "rec3.c.role.reports": "Reports to",
      "rec3.c.role.also": "Also carries",
      "rec3.c.role.alsoV": "Class teacher, 12-B",
      "rec3.c.role.alsoNote": "Since April 2025. Ends with the academic year.",
      "rec3.c.role.signin": "Her account",
      "rec3.c.role.signinV": "Can sign in",
      "rec3.c.role.signinNote": "Employee access: her own leave, attendance, payslips and document requests. Nothing about anybody else.",
      "rec3.c.onb.title": "How she came in",
      "rec3.c.onb.sub": "Her joining, as it was recorded at the time.",
      "rec3.c.onb.offer": "Offer accepted",
      "rec3.c.onb.join": "Joined and joining documents collected",
      "rec3.c.onb.induct": "Induction week completed",
      "rec3.c.onb.account": "Account invited and first signed in",
      "rec3.c.onb.confirm": "Probation confirmed",
      "rec3.c.onb.by": "Onboarded by {who}. Each step is dated on the service book.",
      "rec3.c.vac.title": "What the vacation flag does",
      "rec3.c.vac.on": "She is teaching staff, and that answer is doing two jobs at once.",
      "rec3.c.vac.leaveHead": "Her leave",
      "rec3.c.vac.leave": "Earned leave does not build up the way it does for staff who work through the vacations. Casual and sick leave are untouched.",
      "rec3.c.vac.payHead": "Her pay",
      "rec3.c.vac.pay": "Declared vacations are paid days. She is not marked absent for them and nothing is withheld.",
      "rec3.c.vac.flipHead": "If it is ever turned off",
      "rec3.c.vac.flip": "Her leave and her pay both change from the date the new version takes over. Leave already built up is settled on its own.",

      "rec3.c.hist.title": "Every version of this contract",
      "rec3.c.hist.sub": "A superseded version stays readable. It is what the months it covered were run on.",
      "rec3.c.hist.col.from": "In force from",
      "rec3.c.hist.col.what": "What it set",
      "rec3.c.hist.col.by": "Recorded by",
      "rec3.c.hist.col.state": "State",
      "rec3.c.hist.v1": "Probation, teaching staff, no end date",
      "rec3.c.hist.v2": "Permanent on confirmation, teaching staff, no end date",
      "rec3.c.st.inforce": "In force",
      "rec3.c.st.superseded": "Superseded",
      "rec3.c.hist.foot": "Versions are added. Nothing here is changed or taken away.",
      "rec3.c.sent": "Sent for a second approval. Nothing on the contract has moved yet.",

      /* ---- HR-06 service book ---- */
      "rec3.s.q": "What is her career here?",
      "rec3.s.tl.title": "Service book",
      "rec3.s.tl.sub": "The career timeline that a settlement is worked out from.",
      "rec3.s.act.title": "Adding to the service book",
      "rec3.s.add": "Add an entry",
      "rec3.s.download": "Download the service book",
      "rec3.s.downloadNote": "A PDF for inspection. The download is recorded against your name.",
      "rec3.s.ev.joined": "Joined",
      "rec3.s.ev.confirmed": "Confirmed",
      "rec3.s.ev.promoted": "Promoted",
      "rec3.s.ev.transferred": "Transferred",
      "rec3.s.ev.revised": "Pay revised",
      "rec3.s.ev.exited": "Exited",
      "rec3.s.effective": "Takes effect",
      "rec3.s.recorded": "Written {date} by {who}",
      "rec3.s.e1": "Appointed Trained Graduate Teacher, Physics, at Indiranagar.",
      "rec3.s.e2": "Probation completed. Permanent from this date.",
      "rec3.s.e3": "Promoted to Post Graduate Teacher, Physics.",
      "rec3.s.e3b": "Promoted to Post Graduate Teacher, Physics. This corrects the entry of {date}: it took effect on 1 April, not 1 May.",
      "rec3.s.e4": "Pay revised with the promotion. The amount is payroll's and is not written here.",
      "rec3.s.corrected": "Put right by the entry written {date}",
      "rec3.s.rule": "Entries are added, never changed. A mistake is put right by a new entry that names the one it corrects.",
      "rec3.s.added": "Entry added. It is on the record from now on.",

      "rec3.s.grat.title": "Continuous service",
      "rec3.s.grat.sub": "The one number a settlement is computed from.",
      "rec3.s.grat.total": "Service so far",
      "rec3.s.grat.span": "{y} years, {m} months, {d} days",
      "rec3.s.grat.from": "Counted from {date}, the day she joined.",
      "rec3.s.grat.breaks": "Breaks in service",
      "rec3.s.grat.noBreaks": "None. One unbroken stretch.",
      "rec3.s.grat.eligible": "Gratuity",
      "rec3.s.grat.notYet": "Not yet. Five continuous years is the bar, and hers completes on {date}.",
      "rec3.s.grat.breaksNote": "Nothing has interrupted it since 2024.",
      "rec3.s.grat.eligibleNote": "Five continuous years is the bar, and hers completes on this date.",
      "rec3.s.grat.note": "A break, or a second record opened on a rejoin, would cut this short unnoticed. That is why a returner is matched to their existing record.",

      /* ---- HR-07 documents ---- */
      "rec3.d.q": "What do we hold for her, and is it valid?",
      "rec3.type.degree": "M.Sc. Physics degree",
      "rec3.type.bed": "B.Ed. certificate",
      "rec3.type.tet": "Teacher eligibility certificate",
      "rec3.type.pan": "PAN card",
      "rec3.type.aadhaar": "Aadhaar",
      "rec3.type.police": "Police verification",
      "rec3.type.training": "Child-protection and first-aid training",
      "rec3.type.medical": "Medical fitness certificate",
      "rec3.type.address": "Address proof",
      "rec3.type.bankProof": "Bank account proof",

      "rec3.d4.title": "Her file, at a glance",
      "rec3.d4.sub": "What the school holds, and what is still open.",
      "rec3.d4.held": "On record",
      "rec3.d4.heldNote": "documents held for her",
      "rec3.d4.attention": "Need attention",
      "rec3.d4.attentionNote": "expired, or expiring within six months",
      "rec3.d4.missing": "Not on record",
      "rec3.d4.missingNote": "required by her staff category",
      "rec3.d4.asked": "Asked from her",
      "rec3.d4.askedNote": "{n} waiting, {m} to check",
      "rec3.d4.askedOn": "Asked {date} by {who}",
      "rec3.d4.since": "On record since {date}",
      "rec3.d4.requiredBy": "Required by her staff category",
      "rec3.d4.nothingHeld": "Nothing held",
      "rec3.d.edit.action": "Edit the details",
      "rec3.d.hist.action": "Where it came from",
      "rec3.d.hist.close": "Close",
      "rec3.d.edit.title": "Edit this document",
      "rec3.d.edit.body": "The number, the date issued and the date it runs to. The file itself is replaced, not edited.",
      "rec3.d.edit.number": "Document number",
      "rec3.d.edit.none": "Not recorded",
      "rec3.d.edit.dateHint": "As printed on the document",
      "rec3.d.edit.validHint": "Leave blank if it does not expire",
      "rec3.d.edit.note": "Saved against your name. The status above follows the dates you put here.",
      "rec3.d.edit.done": "Saved. The status follows the new dates.",
      "rec3.d.req.title": "Open requests",
      "rec3.d.req.sub": "You ask, she answers, you check it before it becomes the record.",
      "rec3.d.req.col.doc": "Document",
      "rec3.d.req.col.state": "State",
      "rec3.d.req.col.due": "Answer by",
      "rec3.d.req.col.actions": "Actions",
      "rec3.d.req.st.open": "Waiting",
      "rec3.d.req.st.submitted": "Come back, to check",
      "rec3.d.req.st.verified": "On record",
      "rec3.d.req.st.rejected": "Sent back",
      "rec3.d.req.st.cancelled": "Cancelled",
      "rec3.d.req.daysLeft": "in {n} days",
      "rec3.d.req.overdue": "{n} days over",
      "rec3.d.req.respondedOn": "She answered {date}",
      "rec3.d.req.empty.head": "Nothing is open",
      "rec3.d.req.empty.body": "When you ask her for a document it waits here until she answers, and then until you check it.",
      "rec3.d.req.foot": "A request is the only way a document can come from her. Nothing she sends changes the record until you check it.",
      "rec3.d.req.raise": "Ask her for a document",
      "rec3.d.menu.aria": "Actions on this request",
      "rec3.d.menu.open": "Open what she sent",
      "rec3.d.menu.verify": "Check it and put it on record",
      "rec3.d.menu.verifyNo": "Open what she sent first. Nothing goes on record that you have not looked at.",
      "rec3.d.menu.reject": "Send it back with a reason",
      "rec3.d.menu.rejectNo": "There is nothing to send back yet — she has not answered.",
      "rec3.d.menu.remind": "Remind her",
      "rec3.d.menu.remindNo": "You reminded her today. The next reminder can go tomorrow.",
      "rec3.d.menu.extend": "Give her more time",
      "rec3.d.menu.cancel": "Cancel the request",
      "rec3.d.menu.cancelNo": "It has already come back. Send it back with a reason instead.",
      "rec3.d.opened": "You opened it",

      "rec3.d.reg.title": "On record",
      "rec3.d.reg.sub": "What the school holds for her today, and who put it there.",
      "rec3.d.reg.col.doc": "Document",
      "rec3.d.reg.col.state": "State",
      "rec3.d.reg.col.valid": "Valid until",
      "rec3.d.reg.col.actions": "Actions",
      "rec3.d.reg.upload": "Put a copy on record",
      "rec3.d.reg.foot": "{n} on record. {m} required type not on record.",
      "rec3.d.st.verified": "Checked",
      "rec3.d.st.pending": "Not checked yet",
      "rec3.d.st.expiring": "Expires soon",
      "rec3.d.st.expired": "Expired",
      "rec3.d.st.missing": "Not on record",
      "rec3.d.st.restricted": "Restricted",
      "rec3.d.noExpiry": "Does not expire",
      "rec3.d.daysTo": "in {n} days",
      "rec3.d.daysAgo": "{n} days ago",

      "rec3.d.det.hist": "Its history",
      "rec3.d.det.issued": "Issued",
      "rec3.d.det.valid": "Valid until",
      "rec3.d.det.source": "How it arrived",
      "rec3.d.det.src.hr": "Put on record by the office",
      "rec3.d.det.src.response": "Sent by her, in answer to a request",
      "rec3.d.det.src.ats": "Carried over from her application",
      "rec3.d.det.setExpiry": "Correct the expiry date",
      "rec3.d.det.replace": "Replace it with a newer copy",
      "rec3.d.det.replaceNote": "A replacement supersedes. The copy it replaces stays in this history.",
      "rec3.d.det.ask": "Ask her for a fresh copy",
      "rec3.d.det.restricted": "Restricted — a child-safety record.",
      "rec3.d.det.restrictedWhy": "Only the child-safety restricted role may open this file. You can still see that it is valid, and until when.",
      "rec3.d.det.restrictedNoRemarks": "What it found is not shown here, in any list, in any export, or in any message.",
      "rec3.d.trail.uploaded": "Put on record by {who}",
      "rec3.d.trail.verified": "Checked by {who}",
      "rec3.d.trail.requested": "{who} asked her for a fresh copy",
      "rec3.d.trail.responded": "She sent a copy",
      "rec3.d.trail.lapsed": "Lapsed",
      "rec3.d.trail.promoted": "Her copy put on record, checked by {who}",


      /* ---- dialogs ---- */
      "rec3.dlg.cancel": "Not now",
      "rec3.dlg.reason": "Reason",
      "rec3.dlg.reasonPh": "Choose a reason",
      "rec3.dlg.reasonMissing": "A reason is needed before this can be recorded.",
      "rec3.dlg.note": "Anything to add",
      "rec3.dlg.notePh": "Optional",
      "rec3.dlg.consequence": "What this will do",
      "rec3.dlg.audit": "It is written against your name, with the reason, and she can read that it happened.",

      "rec3.dlg.correctPerson.title": "Correct her personal details",
      "rec3.dlg.correctPerson.body": "A correction is added, it does not overwrite. Whoever reads the record later can see both what it said and what it says now.",
      "rec3.dlg.correctPerson.doc": "A change of name usually needs a document behind it. Ask her for one from the Documents tab — she cannot send one any other way.",
      "rec3.dlg.correctPerson.confirm": "Record the correction",
      "rec3.dlg.reason.typo": "It was typed wrong",
      "rec3.dlg.reason.changed": "Her details have changed",
      "rec3.dlg.reason.doc": "A document she sent says otherwise",
      "rec3.dlg.reason.other": "Something else, written below",

      "rec3.dlg.correctIds.title": "Correct a statutory number",
      "rec3.dlg.correctIds.body": "PAN, UAN and ESIC are the numbers her provident-fund and tax returns are filed under.",
      "rec3.dlg.correctIds.warn": "July's PF return has gone out under the number on record. Changing it usually means that filing has to be revised.",
      "rec3.dlg.correctIds.second": "A second person in the office approves a statutory number before it is used, because it decides what is filed in her name.",
      "rec3.dlg.correctIds.confirm": "Send for a second approval",

      "rec3.dlg.correctBank.title": "Correct her salary account",
      "rec3.dlg.correctBank.body": "Whatever account is on record when the bank file is made is where her salary goes.",
      "rec3.dlg.correctBank.warn": "A changed salary account just before a run is watched hardest. A second person approves it, it shows on the run's exception list, and she is told.",
      "rec3.dlg.correctBank.proof": "Ask her for proof of the new account from the Documents tab before you send this.",
      "rec3.dlg.correctBank.confirm": "Send for a second approval",
      "rec3.dlg.sent": "Sent for a second approval. Nothing has changed on the record yet.",
      "rec3.dlg.recorded": "Recorded, with your name and the reason.",

      "rec3.dlg.revise.title": "A new version of the contract",
      "rec3.dlg.revise.body": "This does not change the version in force. It adds one from the date you set, and writes a line in her service book.",
      "rec3.dlg.revise.from": "In force from",
      "rec3.dlg.revise.fromMissing": "Give the date the new version takes over from.",
      "rec3.dlg.revise.overlap": "That date is inside the version already in force from {date}. Pick a later one.",
      "rec3.dlg.revise.type": "Employment type",
      "rec3.dlg.revise.vac": "Teaching staff",
      "rec3.dlg.revise.vacHint": "Answer this deliberately. There is no default, because this one answer moves both her leave and her pay.",
      "rec3.dlg.revise.vacMissing": "Say yes or no to teaching staff. It has no default because it moves money.",
      "rec3.dlg.revise.yes": "Yes",
      "rec3.dlg.revise.no": "No",
      "rec3.dlg.revise.c1": "The version in force is superseded from that date, and stays readable.",
      "rec3.dlg.revise.c2": "A line is written in her service book.",
      "rec3.dlg.revise.c3": "Her leave eligibility is worked out again from that date.",
      "rec3.dlg.revise.c4": "Payroll treats her by the new version from that date.",
      "rec3.dlg.revise.second": "Because the vacation flag moves money, a second person approves the new version before it takes over.",
      "rec3.dlg.revise.confirm": "Send for a second approval",
      "rec3.dlg.emp.permanent": "Permanent",
      "rec3.dlg.emp.probation": "Probation",
      "rec3.dlg.emp.contract": "Fixed term",
      "rec3.dlg.emp.visiting": "Visiting",

      "rec3.dlg.transfer.title": "Move her department or campus",
      "rec3.dlg.transfer.body": "A move writes a transfer in her service book and re-points who approves her leave from that date.",
      "rec3.dlg.transfer.dept": "Department",
      "rec3.dlg.transfer.campus": "Campus",
      "rec3.dlg.transfer.campusNote": "Only Indiranagar is offered. Your access is to this campus, so no other campus is on this list.",
      "rec3.dlg.transfer.from": "Takes effect from",
      "rec3.dlg.transfer.fromMissing": "Give the date the move takes effect.",
      "rec3.dlg.transfer.confirm": "Record the move",
      "rec3.dlg.dept.science": "Science",
      "rec3.dlg.dept.math": "Mathematics",
      "rec3.dlg.dept.languages": "Languages",
      "rec3.dlg.campus.indiranagar": "Indiranagar",

      "rec3.dlg.event.title": "Add an entry to the service book",
      "rec3.dlg.event.body": "The entry is added and stays. If it turns out to be wrong, a later entry puts it right and both remain readable.",
      "rec3.dlg.event.type": "What happened",
      "rec3.dlg.event.typePh": "Choose",
      "rec3.dlg.event.typeMissing": "Choose what happened. There is no default.",
      "rec3.dlg.event.date": "Takes effect from",
      "rec3.dlg.event.dateMissing": "Give the date it takes effect.",
      "rec3.dlg.event.beforeDoj": "That is before she joined, on {date}. An entry cannot start before her service does.",
      "rec3.dlg.event.details": "Details",
      "rec3.dlg.event.detailsPh": "What changed, in a sentence",
      "rec3.dlg.event.detailsMissing": "Write what changed. This is what someone reads years from now.",
      "rec3.dlg.event.grat": "An entry that moves her joining or exit changes what a settlement would pay, so a second person checks it.",
      "rec3.dlg.event.confirm": "Add the entry",

      "rec3.dlg.upload.title": "Put a copy on record",
      "rec3.dlg.upload.body": "For a copy the office already holds. If it has to come from her, ask her instead \u2014 that is the only route from her to the record.",
      "rec3.dlg.upload.type": "Which document",
      "rec3.dlg.upload.typePh": "Choose",
      "rec3.dlg.upload.typeMissing": "Choose which document this is.",
      "rec3.dlg.upload.issued": "Issued on",
      "rec3.dlg.upload.expires": "Valid until",
      "rec3.dlg.upload.expiresHint": "Leave this empty if the type does not expire.",
      "rec3.dlg.upload.file": "File",
      "rec3.dlg.upload.fileHint": "PDF or a photograph, up to 10 MB.",
      "rec3.dlg.upload.fileName": "Choose a file",
      "rec3.dlg.upload.fileMissing": "Choose the file to put on record.",
      "rec3.dlg.upload.pending": "It goes on as not checked yet, even though you added it. Checking is a separate step, by a separate person.",
      "rec3.dlg.upload.replace": "There is already a copy of that type on record. This one supersedes it, and the copy it replaces stays in the history.",
      "rec3.dlg.upload.confirm": "Add it, unchecked",
      "rec3.dlg.upload.done": "Added, and waiting to be checked.",

      "rec3.dlg.verify.title": "Put her copy on record",
      "rec3.dlg.verify.body": "This makes what she sent the copy of record. The copy it replaces stays in the history, and she is told.",
      "rec3.dlg.verify.who": "It goes on record as checked by you, on {date}.",
      "rec3.dlg.verify.confirm": "Put it on record",
      "rec3.dlg.verify.done": "On record, checked by you.",

      "rec3.dlg.reject.title": "Send it back",
      "rec3.dlg.reject.body": "She reads your reason word for word, and the request opens again so she can answer it.",
      "rec3.dlg.reject.pickPh": "Choose a reason",
      "rec3.dlg.reject.missing": "Choose a reason. She is shown it exactly as written.",
      "rec3.dlg.reject.r1": "The copy is not readable",
      "rec3.dlg.reject.r2": "It is out of date",
      "rec3.dlg.reject.r3": "The name does not match her record",
      "rec3.dlg.reject.r4": "It is not the document that was asked for",
      "rec3.dlg.reject.confirm": "Send it back",
      "rec3.dlg.reject.done": "Sent back. She has the reason and can answer again.",

      "rec3.dlg.raise.title": "Ask her for a document",
      "rec3.dlg.raise.body": "She can only send a document in answer to a request like this one. Tell her what you need and by when.",
      "rec3.dlg.raise.type": "Which document",
      "rec3.dlg.raise.why": "Why you need it",
      "rec3.dlg.raise.whyPh": "She reads this",
      "rec3.dlg.raise.whyMissing": "Say why. She is shown it exactly as written.",
      "rec3.dlg.raise.due": "Answer by",
      "rec3.dlg.raise.dueMissing": "Give a date to answer by.",
      "rec3.dlg.raise.needsLogin": "She has a sign-in, so she can answer. Someone with no sign-in yet has to be invited first.",
      "rec3.dlg.raise.confirm": "Ask her",
      "rec3.dlg.raise.done": "Asked. It is now waiting on her.",

      "rec3.dlg.cancelReq.title": "Cancel this request",
      "rec3.dlg.cancelReq.body": "Her action list clears. You can ask again at any time.",
      "rec3.dlg.cancelReq.confirm": "Cancel the request",
      "rec3.dlg.cancelReq.done": "Cancelled. It has left her action list.",
      "rec3.dlg.extend.title": "Give her more time",
      "rec3.dlg.extend.body": "She is told the new date.",
      "rec3.dlg.extend.date": "New date to answer by",
      "rec3.dlg.extend.missing": "Give the new date.",
      "rec3.dlg.extend.confirm": "Change the date",
      "rec3.dlg.extend.done": "Date changed, and she has been told.",
      "rec3.dlg.remind.title": "Remind her",
      "rec3.dlg.remind.body": "A reminder goes to her app and her school email. One a day at most, so a chased person is not harassed.",
      "rec3.dlg.remind.confirm": "Send the reminder",
      "rec3.dlg.remind.done": "Reminder sent.",
      "rec3.dlg.expiry.title": "Correct the expiry date",
      "rec3.dlg.expiry.body": "The expiry watch is worked out again from the new date and the alerts are rescheduled.",
      "rec3.dlg.expiry.date": "Valid until",
      "rec3.dlg.expiry.missing": "Give the date it is valid until.",
      "rec3.dlg.expiry.past": "That date has passed, so the document is marked expired the moment this is saved.",
      "rec3.dlg.expiry.confirm": "Save the date",
      "rec3.dlg.expiry.done": "Saved. The expiry watch has been reset.",

      "rec3.dlg.invite.title": "Resend her sign-in invite",
      "rec3.dlg.invite.body": "She already has a sign-in. Sending again gives her a fresh link and ends the old one.",
      "rec3.dlg.invite.channel": "Send it to",
      "rec3.dlg.invite.email": "Her school email",
      "rec3.dlg.invite.sms": "Her phone, by SMS",
      "rec3.dlg.invite.confirm": "Send the invite",
      "rec3.dlg.invite.done": "Invite sent.",
      "rec3.dlg.deact.title": "Switch off her sign-in",
      "rec3.dlg.deact.body": "She is signed out everywhere and cannot sign in again until it is switched back on. Her record and documents are untouched.",
      "rec3.dlg.deact.confirm": "Switch it off",
      "rec3.dlg.deact.done": "Her sign-in is off. It can be switched back on from this menu.",
      "rec3.dlg.deact.reason.leave": "She is away for a long spell",
      "rec3.dlg.deact.reason.security": "A security concern",
      "rec3.dlg.deact.reason.other": "Something else, written below",

      "rec3.dlg.exit.title": "Start the exit process",
      "rec3.dlg.exit.body": "She moves to notice today. Nothing is settled and nothing is switched off yet.",
      "rec3.dlg.exit.lwd": "Last working day",
      "rec3.dlg.exit.lwdMissing": "Give her last working day. Her pay and her leave are worked out from it.",
      "rec3.dlg.exit.past": "That day has already passed. Check it before you go on — pay, leave and the settlement all count from it.",
      "rec3.dlg.exit.reason": "Reason",
      "rec3.dlg.exit.r1": "She resigned",
      "rec3.dlg.exit.r2": "Her contract ended",
      "rec3.dlg.exit.r3": "She retired",
      "rec3.dlg.exit.notice": "Notice period",
      "rec3.dlg.exit.noticeHint": "No default. It changes what she is paid.",
      "rec3.dlg.exit.noticeServe": "She serves the 60 days",
      "rec3.dlg.exit.noticeWaive": "Waived",
      "rec3.dlg.exit.noticeMissing": "Say whether the notice is served or waived.",
      "rec3.dlg.exit.c1": "An exit line is written in her service book when the last working day passes.",
      "rec3.dlg.exit.c2": "Her settlement becomes computable: leave encashment, notice, recoveries and the tax true-up.",
      "rec3.dlg.exit.c3": "Her sign-in is switched off when the settlement is completed, not today.",
      "rec3.dlg.exit.c4": "This can be undone right up until the settlement is approved.",
      "rec3.dlg.exit.confirm": "Put her on notice",
      "rec3.dlg.exit.done": "She is on notice. It can still be undone until the settlement is approved.",

      "rec3.dlg.export.title": "Print or export this record",
      "rec3.dlg.export.body": "The export carries your name, what you asked for and the reason you gave.",
      "rec3.dlg.export.format": "Format",
      "rec3.dlg.export.pdf": "PDF",
      "rec3.dlg.export.csv": "CSV",
      "rec3.dlg.export.pii": "Include her personal and statutory numbers",
      "rec3.dlg.export.piiOff": "Left out",
      "rec3.dlg.export.piiOn": "Included",
      "rec3.dlg.export.piiHint": "Left out by default. Put them in and a reason is required, and the export is recorded against your name.",
      "rec3.dlg.export.piiNever": "Her Aadhaar leaves as the last four digits or not at all. There is no export that carries the whole number.",
      "rec3.dlg.export.confirm": "Make the export",
      "rec3.dlg.export.done": "Export made, and recorded against your name.",
    },

  });

  /* ============================================================
     DEMO CONTENT

     Every identifier below is deliberately synthetic — a zero-filled
     PAN, an all-zero Aadhaar, an account number of zeros — so none of
     it could belong to a person. They are the SAME synthetic values
     pages/profile.jsx shows Ananya about herself: her view and HR's
     view of the same numbers must read as one system, not two.
     ============================================================ */

  /* HR-04. `full: null` means the value has no revealable form at all
     for anybody — the control is then ABSENT, not disabled, because
     the right to see it does not exist for any role. */
  const IDENTIFIERS = [
    { id: "pan", labelKey: "rec3.p.ids.pan", masked: P.ids.pan.masked, full: P.ids.pan.full,
      changedBy: P.ids.pan.changedBy, changedOn: P.ids.pan.changedOn },
    { id: "aadhaar", labelKey: "rec3.p.ids.aadhaar", masked: P.ids.aadhaar.masked, full: P.ids.aadhaar.full,
      neverKey: "rec3.p.neverFull", whyKey: "rec3.p.aadhaarWhy",
      changedBy: P.ids.aadhaar.changedBy, changedOn: P.ids.aadhaar.changedOn },
    { id: "uan", labelKey: "rec3.p.ids.uan", masked: P.ids.uan.masked, full: P.ids.uan.full,
      changedBy: P.ids.uan.changedBy, changedOn: P.ids.uan.changedOn },
    { id: "esic", labelKey: "rec3.p.ids.esic", masked: P.ids.esic.masked, full: P.ids.esic.full,
      changedBy: P.ids.esic.changedBy, changedOn: P.ids.esic.changedOn },
    { id: "bank", labelKey: "rec3.p.ids.bank", masked: P.ids.bank.masked, full: P.ids.bank.full,
      extra: [{ labelKey: "rec3.p.ids.ifsc", value: P.ids.bank.ifsc }, { labelKey: "rec3.p.ids.bankName", value: null }],
      changedBy: P.ids.bank.changedBy, changedOn: P.ids.bank.changedOn },
  ];

  /* Contact facts are PII too (§8, O3), so they carry the same mask +
     deliberate reveal as the statutory numbers. A phone HR has to dial
     is a real cost, and it is the right trade: the default state of a
     PII field is masked, and the permission governs the reveal. */
  const CONTACT = [
    { id: "dob", labelKey: "rec3.p.dob", masked: P.contact.dobMasked, fullDate: P.contact.dob,
      changedBy: "rec3.who.meera", changedOn: "2024-04-12" },
    { id: "phone", labelKey: "rec3.p.phone", masked: P.contact.phone.masked, full: P.contact.phone.full,
      changedBy: "rec3.who.meera", changedOn: "2026-06-02" },
    { id: "address", labelKey: "rec3.p.address", maskedKey: P.contact.address.maskedKey, fullKey: P.contact.address.fullKey,
      changedBy: "rec3.who.meera", changedOn: "2025-01-16" },
    { id: "kin", labelKey: "rec3.p.kin", masked: P.contact.kin.masked, full: P.contact.kin.full, subKey: P.contact.kin.nameKey,
      changedBy: "rec3.who.meera", changedOn: "2024-04-12" },
  ];

  /* HR-05 — effective-dated contract versions (§4.3, §6.3). */
  const CONTRACTS = [
    { id: "v2", from: "2025-04-12", whatKey: "rec3.c.hist.v2", by: "rec3.who.rajan", on: "2025-04-10", state: "inforce" },
    { id: "v1", from: "2024-04-12", whatKey: "rec3.c.hist.v1", by: "rec3.who.meera", on: "2024-04-12", state: "superseded" },
  ];

  /* HR-06 — the immutable timeline. `correctsOn` / `correctedByOn` are
     the supersession chain: BOTH entries stay, and each names the
     other, so a correction never erases what it corrects. */
  const SERVICE = [
    { id: "s1", type: "joined", eff: "2024-04-12", rec: "2024-04-12", by: "rec3.who.meera", detailKey: "rec3.s.e1" },
    { id: "s2", type: "confirmed", eff: "2025-04-12", rec: "2025-04-10", by: "rec3.who.rajan", detailKey: "rec3.s.e2" },
    { id: "s3", type: "promoted", eff: "2026-04-01", rec: "2026-08-06", by: "rec3.who.meera", detailKey: "rec3.s.e3b", correctsOn: "2026-05-12" },
    { id: "s4", type: "revised", eff: "2026-04-01", rec: "2026-04-03", by: "rec3.who.kavita", detailKey: "rec3.s.e4" },
    { id: "s0", type: "promoted", eff: "2026-05-01", rec: "2026-05-12", by: "rec3.who.meera", detailKey: "rec3.s.e3", correctedByOn: "2026-08-06" },
  ];

  /* HR-07 — StaffDocument rows (§6.4). `restricted` is the child-safety
     category: HR holds documents.manage but not the restricted role,
     so opening the FILE is absent while validity stays visible — a
     lapse is the safeguarding failure (O8). */
  const DOCS = [
    { id: "degree", number: "MU/PHY/2011/4471", type: "degree", state: "verified", issued: "2011-06-12", valid: null, since: "2024-04-12", src: "hr",
      trail: [{ k: "rec3.d.trail.uploaded", who: "rec3.who.meera", d: "2024-04-12" }, { k: "rec3.d.trail.verified", who: "rec3.who.meera", d: "2024-04-14" }] },
    { id: "bed", number: "KSOU/BED/2012/2290", type: "bed", state: "verified", issued: "2012-05-30", valid: null, since: "2024-04-12", src: "hr",
      trail: [{ k: "rec3.d.trail.uploaded", who: "rec3.who.meera", d: "2024-04-12" }, { k: "rec3.d.trail.verified", who: "rec3.who.meera", d: "2024-04-14" }] },
    { id: "tet", number: "CTET/2019/0118/44210", type: "tet", state: "verified", issued: "2019-01-18", valid: "2033-01-17", since: "2024-04-12", src: "ats",
      trail: [{ k: "rec3.d.trail.uploaded", who: "rec3.who.meera", d: "2024-04-12" }, { k: "rec3.d.trail.verified", who: "rec3.who.meera", d: "2024-04-16" }] },
    { id: "pan", type: "pan", state: "verified", issued: null, valid: null, since: "2024-04-12", src: "hr",
      trail: [{ k: "rec3.d.trail.uploaded", who: "rec3.who.meera", d: "2024-04-12" }, { k: "rec3.d.trail.verified", who: "rec3.who.meera", d: "2024-04-14" }, { k: "rec3.d.trail.requested", who: "rec3.who.meera", d: "2026-08-08" }] },
    { id: "aadhaar", type: "aadhaar", state: "verified", issued: null, valid: null, since: "2024-04-12", src: "hr",
      trail: [{ k: "rec3.d.trail.uploaded", who: "rec3.who.meera", d: "2024-04-12" }, { k: "rec3.d.trail.verified", who: "rec3.who.meera", d: "2024-04-14" }] },
    { id: "police", number: "BLR/PVC/2024/8841", type: "police", state: "verified", restricted: true, issued: "2024-08-02", valid: "2027-07-31", since: "2024-08-05", src: "hr",
      trail: [{ k: "rec3.d.trail.uploaded", who: "rec3.who.rajan", d: "2024-08-05" }, { k: "rec3.d.trail.verified", who: "rec3.who.rajan", d: "2024-08-07" }] },
    { id: "training", number: "CPFA/2024/10/2277", type: "training", state: "expiring", issued: "2024-10-15", valid: "2026-10-14", since: "2024-10-18", src: "hr",
      trail: [{ k: "rec3.d.trail.uploaded", who: "rec3.who.rajan", d: "2024-10-18" }, { k: "rec3.d.trail.verified", who: "rec3.who.rajan", d: "2024-10-21" }] },
    { id: "medical", number: "SPH/MFC/2024/6104", type: "medical", state: "expired", issued: "2024-06-01", valid: "2026-05-31", since: "2024-06-04", src: "hr",
      trail: [{ k: "rec3.d.trail.uploaded", who: "rec3.who.meera", d: "2024-06-04" }, { k: "rec3.d.trail.verified", who: "rec3.who.meera", d: "2024-06-06" }, { k: "rec3.d.trail.lapsed", d: "2026-05-31" }, { k: "rec3.d.trail.requested", who: "rec3.who.meera", d: "2026-08-06" }, { k: "rec3.d.trail.responded", d: "2026-08-10" }] },
  ];

  /* what her staff category is required to hold (HR-08 taxonomy,
     `min_qualification` + the child-safety set). The one type with no
     StaffDocument behind it is the "missing required type" state. */
  const REQUIRED = ["degree", "bed", "tet", "pan", "aadhaar", "police", "training", "medical", "address"];

  /* DocumentUpdateRequest rows (§6.4). Status words are M4's. */
  const REQUESTS = [
    { id: "q1", type: "pan", status: "open", asked: "2026-08-08", due: "2026-08-20", by: "rec3.who.meera" },
    { id: "q2", type: "bankProof", status: "open", asked: "2026-08-11", due: "2026-08-25", by: "rec3.who.meera" },
    { id: "q3", type: "medical", status: "submitted", asked: "2026-08-06", due: "2026-08-16", by: "rec3.who.meera", responded: "2026-08-10" },
  ];

  const DOC_STATE = {
    verified: { role: "present", word: "rec3.d.st.verified" },
    pending: { role: "missing", word: "rec3.d.st.pending", glyph: "clock" },
    expiring: { role: "late", word: "rec3.d.st.expiring" },
    expired: { role: "absent", word: "rec3.d.st.expired" },
    missing: { role: "missing", word: "rec3.d.st.missing" },
  };

  const REQ_STATE = {
    open: { role: "ltEL", word: "rec3.d.req.st.open", glyph: "clock" },
    submitted: { role: "late", word: "rec3.d.req.st.submitted", glyph: "arrow" },
    verified: { role: "present", word: "rec3.d.req.st.verified" },
    rejected: { role: "penalty", word: "rec3.d.req.st.rejected", glyph: "arrow" },
    cancelled: { role: "off", word: "rec3.d.req.st.cancelled", glyph: "arrow" },
  };

  /* ============================================================
     DATE HELPERS — every span, countdown and "days over" on this
     screen is derived from TODAY and an ISO literal, never typed.
     ============================================================ */
  function fmt(t, s) {
    if (!s) return null;
    const p = s.split("-");
    return String(Number(p[2])) + " " + t("rec3.mon." + p[1]) + " " + p[0];
  }


  function days(fromISO, toISO) {
    const a = fromISO.split("-").map(Number);
    const b = toISO.split("-").map(Number);
    return Math.round((Date.UTC(b[0], b[1] - 1, b[2]) - Date.UTC(a[0], a[1] - 1, a[2])) / 86400000);
  }

  function span(fromISO, toISO) {
    const a = fromISO.split("-").map(Number);
    const b = toISO.split("-").map(Number);
    let y = b[0] - a[0], m = b[1] - a[1], d = b[2] - a[2];
    if (d < 0) { m -= 1; d += new Date(Date.UTC(b[0], b[1] - 1, 0)).getUTCDate(); }
    if (m < 0) { y -= 1; m += 12; }
    return { y: y, m: m, d: d };
  }

  function addYears(isoStr, n) {
    const p = isoStr.split("-");
    return (Number(p[0]) + n) + "-" + p[1] + "-" + p[2];
  }

  /* ============================================================
     LOCAL PRIMITIVES — none of these edits kit.jsx. The ones marked
     PROMOTION CANDIDATE have now appeared in enough independent
     screens to earn a place in UI3 on its next touch.
     ============================================================ */

  /* PROMOTION CANDIDATE (3rd independent definition: documents.jsx,
     profile.jsx, here) — a label/value definition row. */
  function DefRow({ label, children, last, wide }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", padding: "9px 0", borderBottom: last ? "none" : "1px dashed " + c.border }}>
        <div style={ty("small", { color: c.inkMuted, flex: "0 0 " + (wide ? "34%" : "42%"), minWidth: 0 })}>{label}</div>
        <div style={{ flex: 1, minWidth: 0, textAlign: "right" }}>{children}</div>
      </div>
    );
  }

  function Value({ children, mono, tone }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return <span style={mono ? G3.fig("sm", { color: tone || c.ink, fontWeight: 600 }) : ty("small", { color: tone || c.ink, fontWeight: 600 })}>{children}</span>;
  }

  function GroupHead({ label }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div style={{ marginBottom: 2, paddingTop: 4 }}>
        <span style={ty("caption", { color: c.inkFaint, fontWeight: 700 })}>{label}</span>
      </div>
    );
  }

  /* provenance, read where the value is read (O6) */
  function Changed({ who, on }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    return (
      <div style={ty("caption", { color: c.inkFaint, marginTop: 2 })}>
        {t("rec3.p.changed", { who: t(who), date: fmt(t, on) })}
      </div>
    );
  }

  /* PROMOTION CANDIDATE · MaskedField — mask + deliberate reveal.
     Two properties are load-bearing and must survive promotion:
       · the full value is CONDITIONALLY RENDERED. While masked it is
         absent from the DOM — not CSS-hidden, not in a title, not in
         a data-* attribute. A DOM dump, an accessibility tree, a
         screenshot and a Ctrl-F all see only the mask.
       · `full == null` means no revealable form exists for anyone
         (Aadhaar). The control is then ABSENT and replaced by the
         reason, never a disabled button — a disabled button implies
         somebody, somewhere, may press it. */
  /* READ-ONLY MODE. HR owns this record; the group office may read it.
     Rather than a second screen that would drift from this one, the
     same screen runs with every control inert — kept visible and
     disabled, per the rule this file already states about gated
     actions ("a missing button teaches nothing"). */
  const RecordMode = React.createContext(false);
  function useRO() { return React.useContext(RecordMode); }

  /* every menu item in one go, so no ActionMenu is left live by
     somebody adding an item later */
  function roItems(items, ro, reason) {
    if (!ro) return items;
    return items.map(function (it) {
      return Object.assign({}, it, { disabled: true, reason: reason, onSelect: undefined });
    });
  }

  /* said ONCE, where the reader lands, instead of on every control */
  function ReadOnlyBand() {
    const { c } = useTheme();
    const { t, ty } = useLang();
    return (
      <Card>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <span aria-hidden="true" style={{ color: c.inkMuted, display: "flex", paddingTop: 2, flexShrink: 0 }}><Icon name="lock" size={16} /></span>
          <div style={{ minWidth: 0 }}>
            <div style={ty("small", { color: c.ink, fontWeight: 700 })}>{t("rec3.ro.head")}</div>
            <p style={ty("small", { color: c.inkMuted, margin: "4px 0 0", maxWidth: 680 })}>{t("rec3.ro.body")}</p>
          </div>
        </div>
      </Card>
    );
  }

  function MaskedField({ field, open, onToggle, last }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    /* opening a masked field is an ACT, not a way of looking at the
       screen — it is written down against the name that did it. So it
       is the one control that has to be off here too. */
    const ro = useRO();
    const label = t(field.labelKey);
    const masked = field.maskedKey ? t(field.maskedKey) : field.masked;
    const full = field.fullKey ? t(field.fullKey) : field.fullDate ? fmt(t, field.fullDate) : field.full;
    const revealable = full != null;
    const shown = revealable && open;

    return (
      <DefRow label={label} last={last} wide>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
          <span style={G3.fig("sm", { color: shown ? c.ink : c.inkMuted, fontWeight: 600, letterSpacing: "0.02em" })}>
            {shown ? full : masked}
          </span>
          {revealable ? (
            <button
              type="button"
              disabled={ro}
              title={ro ? t("rec3.ro.why") : undefined}
              onClick={ro ? undefined : () => onToggle(field.id, label)}
              aria-pressed={shown}
              aria-label={ro ? t("rec3.ro.showAria", { field: label }) : t(shown ? "rec3.p.hideAria" : "rec3.p.showAria", { field: label })}
              style={ty("caption", {
                display: "inline-flex", alignItems: "center", gap: 5,
                background: shown ? c.accentSoft : "transparent",
                border: "1px solid " + (shown ? c.accentSoft : c.borderStrong),
                borderRadius: G3.r.pill, padding: "6px 11px",
                color: shown ? c.action : c.inkMuted, fontWeight: 700,
                cursor: ro ? "not-allowed" : "pointer", opacity: ro ? 0.45 : 1,
              })}
            >
              <span aria-hidden="true" style={{ display: "flex" }}><Icon name="lock" size={12} /></span>
              <span>{t(shown ? "rec3.p.hide" : "rec3.p.show")}</span>
            </button>
          ) : (
            <Chip bg={c.sunken} fg={c.inkMuted}>
              <span aria-hidden="true" style={{ display: "flex" }}><Icon name="lock" size={12} /></span>
              <span>{t(field.neverKey)}</span>
            </Chip>
          )}
        </div>
        {field.subKey ? <div style={ty("small", { color: c.ink, fontWeight: 600, marginTop: 2 })}>{t(field.subKey)}</div> : null}
        {shown && field.extra ? (
          <div style={{ marginTop: 6 }}>
            {field.extra.map((x) => (
              <div key={x.labelKey} style={ty("caption", { color: c.inkMuted })}>
                {x.value ? t(x.labelKey) + " " : ""}
                <span style={x.value ? G3.fig("micro", { color: c.ink, fontWeight: 600 }) : undefined}>{x.value || t(x.labelKey)}</span>
              </div>
            ))}
          </div>
        ) : null}
        {field.whyKey ? (
          <div style={ty("caption", { color: c.inkFaint, marginTop: 5, textAlign: "left", maxWidth: 400, marginLeft: "auto" })}>{t(field.whyKey)}</div>
        ) : null}
        <Changed who={field.changedBy} on={field.changedOn} />
      </DefRow>
    );
  }

  /* PROMOTION CANDIDATE (documents.jsx + here) — an attributed,
     append-only trail. */
  function Trail({ items }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    return (
      <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {items.map((it, i) => (
          <li key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", paddingBottom: i < items.length - 1 ? 13 : 0 }}>
            <span aria-hidden="true" style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, alignSelf: "stretch" }}>
              <span style={{ width: 8, height: 8, borderRadius: G3.r.pill, background: c.accent, marginTop: 5, flexShrink: 0 }} />
              {i < items.length - 1 ? <span style={{ width: 1, flex: 1, background: c.border, marginTop: 4 }} /> : null}
            </span>
            <span style={{ minWidth: 0 }}>
              <span style={ty("small", { display: "block", color: c.ink })}>{t(it.k, it.who ? { who: t(it.who) } : undefined)}</span>
              {it.d ? <span style={G3.fig("xs", { display: "block", color: c.inkFaint, marginTop: 2 })}>{fmt(t, it.d)}</span> : null}
            </span>
          </li>
        ))}
      </ol>
    );
  }

  /* a small labelled fact, for the at-a-glance state row */
  function FactCell({ label, value, note, tone }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div style={{ minWidth: 0 }}>
        <div style={ty("caption", { color: c.inkFaint, fontWeight: 700 })}>{label}</div>
        <div style={ty("small", { color: tone || c.ink, fontWeight: 700, marginTop: 3 })}>{value}</div>
        {note ? <div style={ty("caption", { color: c.inkMuted, marginTop: 2 })}>{note}</div> : null}
      </div>
    );
  }

  /* a quiet, permanent confirmation line — what happened, in words,
     with a mark so it is never colour alone */
  function DoneLine({ role, word }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div style={{ display: "flex", gap: 9, alignItems: "flex-start", marginTop: 14, padding: "10px 12px", background: c.sunken, borderRadius: G3.r.md }}>
        <span aria-hidden="true" style={{ display: "flex", color: c[role] || c.present, paddingTop: 1 }}><Icon name="check" size={15} /></span>
        <span role="status" style={ty("small", { color: c.ink })}>{word}</span>
      </div>
    );
  }

  /* a rule stated in words, next to the thing it governs */
  function RulePanel({ title, lines, icon }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div style={{ background: c.sunken, borderRadius: G3.r.lg, padding: "14px 16px" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8, color: c.inkMuted }}>
          <span aria-hidden="true" style={{ display: "flex" }}><Icon name={icon || "lock"} size={14} /></span>
          <span style={ty("caption", { fontWeight: 700 })}>{title}</span>
        </div>
        {lines.map((l, i) => (
          <p key={i} style={ty("caption", { margin: i ? "7px 0 0" : 0, color: c.inkMuted })}>{l}</p>
        ))}
      </div>
    );
  }

  /* PROMOTION CANDIDATE (depthead.jsx + here) — a modal with a real
     backdrop, Escape, initial focus and a token-only colour surface. */
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
        <div
          ref={boxRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title}
          style={{ position: "relative", width: width || 520, maxWidth: "100%", background: c.surface, border: "1px solid " + c.border, borderRadius: G3.r.card, boxShadow: shadow(4), padding: 24 }}
        >
          <h2 style={ty("h2", { margin: "0 0 12px", color: c.ink })}>{title}</h2>
          {children}
        </div>
      </div>,
      document.body
    );
  }

  /* a dialog's consequence block — what pressing the button will do,
     spelled out before it is pressed */
  function Consequence({ lines }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    return (
      <div style={{ background: c.sunken, borderRadius: G3.r.md, padding: "12px 14px", margin: "4px 0 16px" }}>
        <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 6 })}>{t("rec3.dlg.consequence")}</div>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {lines.map((l, i) => <li key={i} style={ty("small", { color: c.ink, marginBottom: i < lines.length - 1 ? 4 : 0 })}>{l}</li>)}
        </ul>
      </div>
    );
  }

  /* a warning that is a sentence, not a colour */
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

  /* PROMOTION CANDIDATE (depthead.jsx PillGroup + here) — a radio
     group with NO pre-selected value, for the answers that must be
     given deliberately (the vacation flag, notice waiver). */
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

  /* the footer every dialog ends in: cancel of equal weight, then the
     one committing verb, which always names what it does */
  function DialogFoot({ confirmLabel, onConfirm, onCancel }) {
    const { t } = useLang();
    return (
      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 18 }}>
        <Button kind="ghost" onClick={onCancel}>{t("rec3.dlg.cancel")}</Button>
        <Button kind="primary" onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    );
  }

  /* ============================================================
     HR-03 · THE SHELL

     "Who is this person and what state is she in?" — identity, the
     at-a-glance state row, the alerts, and the way into the four
     facets. No form lives here. The header menu carries the actions
     the inventory puts on the record itself, and each of them opens
     a dialog that states its consequence before it commits: nothing
     on this screen is a one-press change.

     There is no delete control here, or on any facet, in any state.
     ============================================================ */
  function IdentityHeader({ onNavigate }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const ro = useRO();
    const [dlg, setDlg] = useState(null);
    const [done, setDone] = useState(null);

    const menu = [
      { key: "invite", icon: "mail", label: t("rec3.menu.invite"), onSelect: () => { setDone(null); setDlg("invite"); } },
      { key: "deact", icon: "lock", label: t("rec3.menu.deactivate"), onSelect: () => { setDone(null); setDlg("deact"); } },
      /* the one item here that ends somebody's employment */
      { key: "exit", icon: "signout", label: t("rec3.menu.exit"), tone: "danger", onSelect: () => { setDone(null); setDlg("exit"); } },
      { key: "export", icon: "download", label: t("rec3.menu.export"), onSelect: () => { setDone(null); setDlg("export"); } },
    ];

    const chips = [
      { k: "active", role: "present", word: t("rec3.st.active") },
      { k: "permanent", role: "ltEL", word: t("rec3.st.permanent"), glyph: "briefcase" },
      { k: "vacation", role: "holiday", word: t("rec3.st.vacation"), glyph: "festival" },
      { k: "login", role: "off", word: t("rec3.st.login"), glyph: "check" },
    ];

    const facts = [
      { k: "employment", label: t("rec3.f.employment"), value: t("rec3.c.typeV") },
      { k: "vacation", label: t("rec3.f.vacation"), value: t("rec3.f.vacationV") },
      { k: "doj", label: t("rec3.f.doj"), value: fmt(t, DOJ) },
      { k: "confirmed", label: t("rec3.f.confirmed"), value: fmt(t, "2025-04-12") },
      { k: "end", label: t("rec3.f.contractEnd"), value: t("rec3.f.contractEndNone") },
      { k: "reports", label: t("rec3.f.reportsTo"), value: t("rec3.who.anjali") },
    ];

    return (
      <Card>
        <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
          {/* a monogram, not a stock avatar. The absence of a photo is
              stated, because a silent grey circle reads as a loading
              failure rather than a fact about the record. */}
          <div style={{ flexShrink: 0, textAlign: "center", width: 84 }}>
            <div
              aria-hidden="true"
              style={{
                width: 64, height: 64, borderRadius: G3.r.lg, background: c.accentSoft, color: c.action,
                display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto",
              }}
            >
              <span style={ty("h1", { color: c.action })}>{t("rec3.id.initials")}</span>
            </div>
            <div style={ty("caption", { color: c.inkFaint, marginTop: 7 })}>{t("rec3.id.noPhoto")}</div>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={ty("h1", { margin: 0, color: c.ink })}>{t("rec3.id.name")}</h1>
            <div style={ty("small", { color: c.inkMuted, marginTop: 4 })}>
              {t("rec3.id.desig")}
              <span style={{ margin: "0 8px", color: c.inkFaint }}>·</span>
              {t("rec3.id.where")}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12, alignItems: "center" }}>
              <Chip bg={c.sunken} fg={c.inkMuted} mono>{t("rec3.id.code")} NAV-0142</Chip>
              {chips.map((s) => <StatusMark key={s.k} role={s.role} word={s.word} glyph={s.glyph} />)}
            </div>
          </div>

          <div style={{ flexShrink: 0 }}>
            <ActionMenu ariaLabel={t("rec3.id.menuAria")} items={roItems(menu, ro, t("rec3.ro.why"))} />
          </div>
        </div>

        {/* the at-a-glance state row — the seven facts that decide how
            every other module treats her (M3 §Business rules: the
            contract is where leave, attendance and payroll read from) */}
        <div
          style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "16px 22px",
            marginTop: 18, paddingTop: 16, borderTop: "1px solid " + c.rule,
          }}
        >
          {facts.map((f) => <FactCell key={f.k} label={f.label} value={f.value} />)}
        </div>

        {done ? <DoneLine word={t(done)} /> : null}

        {dlg === "invite" ? <InviteDialog onClose={() => setDlg(null)} onDone={(k) => { setDlg(null); setDone(k); }} /> : null}
        {dlg === "deact" ? <DeactivateDialog onClose={() => setDlg(null)} onDone={(k) => { setDlg(null); setDone(k); }} /> : null}
        {dlg === "exit" ? <ExitDialog onClose={() => setDlg(null)} onDone={(k) => { setDlg(null); setDone(k); }} /> : null}
        {dlg === "export" ? <ExportDialog onClose={() => setDlg(null)} onDone={(k) => { setDlg(null); setDone(k); }} /> : null}
      </Card>
    );
  }

  function InviteDialog({ onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [channel, setChannel] = useState("email");
    return (
      <Dialog title={t("rec3.dlg.invite.title")} onCancel={onClose}>
        <p style={ty("small", { color: c.inkMuted, margin: "0 0 16px" })}>{t("rec3.dlg.invite.body")}</p>
        <Field id="rec3-invite-ch" label={t("rec3.dlg.invite.channel")}>
          <ChoiceGroup
            ariaLabel={t("rec3.dlg.invite.channel")} value={channel} onChange={setChannel}
            items={[{ key: "email", label: t("rec3.dlg.invite.email") }, { key: "sms", label: t("rec3.dlg.invite.sms") }]}
          />
        </Field>
        <p style={ty("caption", { color: c.inkFaint, margin: "0 0 4px" })}>{t("rec3.dlg.audit")}</p>
        <DialogFoot confirmLabel={t("rec3.dlg.invite.confirm")} onCancel={onClose} onConfirm={() => onDone("rec3.dlg.invite.done")} />
      </Dialog>
    );
  }

  function DeactivateDialog({ onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [reason, setReason] = useState("");
    const [note, setNote] = useState("");
    const [err, setErr] = useState(null);
    function submit() {
      if (!reason) { setErr("rec3.dlg.reasonMissing"); return; }
      onDone("rec3.dlg.deact.done");
    }
    return (
      <Dialog title={t("rec3.dlg.deact.title")} onCancel={onClose}>
        <p style={ty("small", { color: c.inkMuted, margin: "0 0 16px" })}>{t("rec3.dlg.deact.body")}</p>
        <Field id="rec3-deact-reason" label={t("rec3.dlg.reason")} error={err ? t(err) : null}>
          <Select
            id="rec3-deact-reason" value={reason} onChange={(v) => { setReason(v); setErr(null); }}
            options={[
              { value: "", label: t("rec3.dlg.reasonPh") },
              { value: "leave", label: t("rec3.dlg.deact.reason.leave") },
              { value: "security", label: t("rec3.dlg.deact.reason.security") },
              { value: "other", label: t("rec3.dlg.deact.reason.other") },
            ]}
          />
        </Field>
        <Field id="rec3-deact-note" label={t("rec3.dlg.note")}>
          <Input id="rec3-deact-note" value={note} onChange={setNote} placeholder={t("rec3.dlg.notePh")} />
        </Field>
        <p style={ty("caption", { color: c.inkFaint, margin: "0 0 4px" })}>{t("rec3.dlg.audit")}</p>
        <DialogFoot confirmLabel={t("rec3.dlg.deact.confirm")} onCancel={onClose} onConfirm={submit} />
      </Dialog>
    );
  }

  function ExitDialog({ onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [lwd, setLwd] = useState("");
    const [reason, setReason] = useState("");
    const [notice, setNotice] = useState(null);
    const [err, setErr] = useState({});
    const past = lwd && days(TODAY, lwd) < 0;

    function submit() {
      const e = {};
      if (!lwd) e.lwd = "rec3.dlg.exit.lwdMissing";
      if (!reason) e.reason = "rec3.dlg.reasonMissing";
      if (notice == null) e.notice = "rec3.dlg.exit.noticeMissing";
      setErr(e);
      if (Object.keys(e).length) return;
      onDone("rec3.dlg.exit.done");
    }

    return (
      <Dialog title={t("rec3.dlg.exit.title")} onCancel={onClose} width={560}>
        <p style={ty("small", { color: c.inkMuted, margin: "0 0 16px" })}>{t("rec3.dlg.exit.body")}</p>
        <Field id="rec3-exit-lwd" label={t("rec3.dlg.exit.lwd")} error={err.lwd ? t(err.lwd) : null}>
          <Input id="rec3-exit-lwd" type="date" value={lwd} onChange={(v) => { setLwd(v); setErr({}); }} />
        </Field>
        {past ? <Warn>{t("rec3.dlg.exit.past")}</Warn> : null}
        <Field id="rec3-exit-reason" label={t("rec3.dlg.exit.reason")} error={err.reason ? t(err.reason) : null}>
          <Select
            id="rec3-exit-reason" value={reason} onChange={(v) => { setReason(v); setErr({}); }}
            options={[
              { value: "", label: t("rec3.dlg.reasonPh") },
              { value: "resigned", label: t("rec3.dlg.exit.r1") },
              { value: "ended", label: t("rec3.dlg.exit.r2") },
              { value: "retired", label: t("rec3.dlg.exit.r3") },
            ]}
          />
        </Field>
        <Field id="rec3-exit-notice" label={t("rec3.dlg.exit.notice")} hint={t("rec3.dlg.exit.noticeHint")} error={err.notice ? t(err.notice) : null}>
          <ChoiceGroup
            ariaLabel={t("rec3.dlg.exit.notice")} value={notice} onChange={(v) => { setNotice(v); setErr({}); }} invalid={!!err.notice}
            items={[{ key: "serve", label: t("rec3.dlg.exit.noticeServe") }, { key: "waive", label: t("rec3.dlg.exit.noticeWaive") }]}
          />
        </Field>
        <Consequence lines={[t("rec3.dlg.exit.c1"), t("rec3.dlg.exit.c2"), t("rec3.dlg.exit.c3"), t("rec3.dlg.exit.c4")]} />
        <DialogFoot confirmLabel={t("rec3.dlg.exit.confirm")} onCancel={onClose} onConfirm={submit} />
      </Dialog>
    );
  }

  function ExportDialog({ onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [format, setFormat] = useState("pdf");
    const [pii, setPii] = useState(false);
    const [reason, setReason] = useState("");
    const [err, setErr] = useState(null);
    function submit() {
      if (pii && !reason.trim()) { setErr("rec3.dlg.reasonMissing"); return; }
      onDone("rec3.dlg.export.done");
    }
    return (
      <Dialog title={t("rec3.dlg.export.title")} onCancel={onClose}>
        <p style={ty("small", { color: c.inkMuted, margin: "0 0 16px" })}>{t("rec3.dlg.export.body")}</p>
        <Field id="rec3-exp-fmt" label={t("rec3.dlg.export.format")}>
          <ChoiceGroup
            ariaLabel={t("rec3.dlg.export.format")} value={format} onChange={setFormat}
            items={[{ key: "pdf", label: t("rec3.dlg.export.pdf") }, { key: "csv", label: t("rec3.dlg.export.csv") }]}
          />
        </Field>
        <div style={{ marginBottom: 16 }}>
          <UI.Switch id="rec3-exp-pii" checked={pii} onChange={(v) => { setPii(v); setErr(null); }} label={t("rec3.dlg.export.pii")} />
          <div style={{ marginTop: 8 }}>
            <StatusMark role={pii ? "late" : "off"} word={t(pii ? "rec3.dlg.export.piiOn" : "rec3.dlg.export.piiOff")} glyph={pii ? "alert" : "lock"} />
          </div>
          <div style={ty("caption", { color: c.inkMuted, marginTop: 8 })}>{t("rec3.dlg.export.piiHint")}</div>
          <div style={ty("caption", { color: c.inkFaint, marginTop: 4 })}>{t("rec3.dlg.export.piiNever")}</div>
        </div>
        {pii ? (
          <Field id="rec3-exp-reason" label={t("rec3.dlg.reason")} error={err ? t(err) : null}>
            <Input id="rec3-exp-reason" value={reason} onChange={(v) => { setReason(v); setErr(null); }} placeholder={t("rec3.dlg.notePh")} />
          </Field>
        ) : null}
        <DialogFoot confirmLabel={t("rec3.dlg.export.confirm")} onCancel={onClose} onConfirm={submit} />
      </Dialog>
    );
  }

  /* The ONE honey surface on this screen, and the only call to action
     the record itself owns. A record is a reference surface: if
     nothing is wrong, this card carries a written all-clear rather
     than an empty box holding space. */
  function AlertsBand({ reqs, medicalOnRecord, onGoDocs, onRaise }) {
    const { c } = useTheme();
    const { t, ty } = useLang();

    const medical = DOCS.filter((d) => d.id === "medical")[0];
    const training = DOCS.filter((d) => d.id === "training")[0];
    const medicalReq = reqs.filter((r) => r.id === "q3")[0];
    const open = reqs.filter((r) => r.status === "open");
    const earliest = open.length ? open.map((r) => r.due).sort()[0] : null;

    /* three things in three places: the state, the document, the date
       — and the one action that answers it */
    const items = [];
    if (!medicalOnRecord) {
      const answered = medicalReq && medicalReq.status === "submitted";
      items.push({
        k: "expired", role: answered ? "late" : "absent", glyph: answered ? "clock" : "alert",
        word: t(answered ? "rec3.al.w.waiting" : "rec3.al.w.expired"),
        name: t("rec3.al.n.medical"),
        when: answered ? fmt(t, medicalReq.responded) : t("rec3.al.f.ago", { n: num(days(medical.valid, TODAY)) }),
        cta: t(answered ? "rec3.al.a.check" : "rec3.al.a.ask"),
        go: answered ? onGoDocs : onRaise,
      });
    }
    items.push({
      k: "expiring", role: "late", glyph: "clock",
      word: t("rec3.al.w.expiring"), name: t("rec3.al.n.training"),
      when: t("rec3.al.f.in", { n: num(days(TODAY, training.valid)) }),
      cta: t("rec3.al.a.ask"), go: onRaise,
    });
    if (open.length) {
      items.push({
        k: "open", role: "leave", glyph: "clock",
        word: t("rec3.al.w.withHer"),
        name: open.length === 1 ? t("rec3.al.n.open1") : t("rec3.al.n.openN", { count: num(open.length) }),
        when: t("rec3.al.f.due", { date: fmt(t, earliest) }),
        cta: t("rec3.al.a.open"), go: onGoDocs,
      });
    }
    items.push({
      k: "missing", role: "missing", glyph: "alert",
      word: t("rec3.al.w.missing"), name: t("rec3.al.n.address"),
      when: t("rec3.al.f.required"), cta: t("rec3.al.a.ask"), go: onRaise,
    });

    if (!items.length) {
      return (
        <Card icon="check" iconTone="present" title={t("rec3.al.clear.head")}>
          <p style={ty("small", { margin: 0, color: c.inkMuted })}>{t("rec3.al.clear.body")}</p>
        </Card>
      );
    }

    /* worst first. A fill said ALARM about all four at once; the order
       and the mark say which one is actually on fire. */
    const RANK = { absent: 0, missing: 1, late: 2, leave: 3, off: 4 };
    const sorted = items.slice().sort(function (x, y) {
      return (RANK[x.role] == null ? 9 : RANK[x.role]) - (RANK[y.role] == null ? 9 : RANK[y.role]);
    });

    return (
      <Card
        icon="alert" iconTone="brass"
        title={items.length === 1 ? t("rec3.al.head1") : t("rec3.al.headN", { count: num(items.length) })}
      >
        <div role="list">
          {sorted.map(function (a, n) {
            return (
              <div
                key={a.k} role="listitem"
                style={{
                  display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
                  padding: "12px 0 12px 2px",
                  borderTop: n ? "1px solid " + c.rule : "none",
                }}
              >
                <span style={{ flex: "0 0 auto", minWidth: 150 }}>
                  <StatusMark role={a.role} glyph={a.glyph} word={a.word} />
                </span>
                <span style={ty("small", { color: c.ink, fontWeight: 700, flex: "1 1 200px", minWidth: 0 })}>{a.name}</span>
                <span style={ty("caption", { color: c.inkMuted, flex: "0 1 auto", whiteSpace: "nowrap" })}>{a.when}</span>
                <span style={{ flex: "0 0 auto", marginInlineStart: "auto" }}>
                  <Button kind="secondary" size="sm" onClick={a.go}>{a.cta}</Button>
                </span>
              </div>
            );
          })}
        </div>
      </Card>
    );
  }

  /* ============================================================
     HR-04 · PERSONAL & STATUTORY IDS

     "Are her identity and statutory details correct?"

     Masking is the default state of the field, for every role
     including this one (§8 field-level access; O3). One field is open
     at a time, the opening is written down where HR can watch it
     happen, and leaving the tab closes whatever was open — the facet
     unmounts, so the re-mask is structural rather than a promise.

     Salary is absent, and the absence is stated (PY-05 owns it).
     A person with no PAN or Aadhaar is a legitimate record, and the
     consequence of that is named rather than left to be discovered.
     ============================================================ */
  /* An action the contract does not currently allow keeps its button
     and gains the reason beside it, greyed rather than hidden: a
     missing button teaches nothing. */
  function GatedAction({ label, icon, reason, onClick }) {
    const { c } = useTheme();
    const { ty, t } = useLang();
    /* this control was built for exactly this: kept, greyed, and told
       why. Read-only is one more reason among the contract's own. */
    const ro = useRO();
    const why = reason || (ro ? t("rec3.ro.why") : null);
    const off = !!why;
    return (
      <div style={{ display: "flex", gap: 14, alignItems: "center", padding: "7px 0", flexWrap: "wrap" }}>
        <span style={{ flexShrink: 0 }}>
          <Button kind="secondary" size="sm" iconLeft={icon} disabled={off} onClick={off ? undefined : onClick}>{label}</Button>
        </span>
        {off ? <span style={ty("caption", { color: c.inkMuted, flex: 1, minWidth: 220 })}>{why}</span> : null}
      </div>
    );
  }

  /* Typing the new value, not describing it. Two things make this
     safe to put on the deepest PII surface in the product:

       · the box starts EMPTY and the CURRENT value is shown MASKED
         beside its label. Pre-filling would print a full PAN and a
         full account number into the DOM with nobody having asked for
         them — rule 1 of this screen, broken by a convenience.
       · only the boxes she types into change. Everything left blank is
         left alone, so a phone correction cannot quietly blank an
         address.

     There is no second approver. HR owns this record outright
     (designer, 2026-09-25) — the change is saved, stamped with her
     name and the reason she gave, and the earlier value stays on the
     record. That IS the audit; it is not a queue. */
  function EditDialog({ titleKey, bodyKey, fields, noteKey, link, onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [vals, setVals] = useState({});
    const [why, setWhy] = useState("");
    const touched = fields.filter((f) => String(vals[f.id] || "").trim()).length;

    return (
      <Dialog title={t(titleKey)} onCancel={onClose} width={560}>
        <p style={ty("small", { color: c.inkMuted, margin: "0 0 18px" })}>{t(bodyKey)}</p>
        {fields.map((f) => (
          <Field
            key={f.id} id={"rec3-edit-" + f.id} label={t(f.labelKey)}
            hint={f.hintKey ? t(f.hintKey) : undefined}
          >
            {/* the current value, masked, so she can see what she is
                replacing without the record revealing it */}
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, margin: "-2px 0 7px" }}>
              <span style={ty("caption", { color: c.inkFaint })}>{t("rec3.edit.now")}</span>
              <span style={G3.fig("micro", { color: c.inkMuted, fontWeight: 600, letterSpacing: "0.02em" })}>
                {f.nowKey ? t(f.nowKey) : f.now}
              </span>
            </div>
            <Input
              id={"rec3-edit-" + f.id} value={vals[f.id] || ""}
              placeholder={t("rec3.edit.ph")}
              onChange={(v) => setVals(Object.assign({}, vals, { [f.id]: v }))}
            />
          </Field>
        ))}
        <Field id="rec3-edit-why" label={t("rec3.edit.why")} hint={t("rec3.edit.whyHint")}>
          <Input id="rec3-edit-why" value={why} onChange={setWhy} placeholder={t("rec3.edit.whyPh")} />
        </Field>
        {link ? (
          <p style={{ margin: "0 0 14px" }}>
            <LinkButton onClick={link.onClick}>{link.label}</LinkButton>
          </p>
        ) : null}
        <p style={ty("caption", { color: c.inkFaint, margin: "0 0 4px" })}>{t(noteKey || "rec3.edit.note")}</p>
        <DialogFoot
          confirmLabel={t("rec3.edit.save")}
          onConfirm={touched && why.trim() ? onDone : null}
          onCancel={onClose}
        />
      </Dialog>
    );
  }

  /* every figure she has been on, newest first, each naming what put
     it there. The top line is what the card above states, by
     construction rather than by coincidence. */
  const PAY_HISTORY = [
    { fromISO: "2026-04-01", gross: 94800, apprId: "AP-0003" },
    { fromISO: "2025-04-01", gross: 88000, apprId: "AP-0002" },
    { fromISO: "2024-10-01", gross: 76000, apprId: "AP-0001" },
    { fromISO: "2024-04-12", gross: 71500, apprId: null },
  ];

  function PersonalFacet({ onReveal, onGoDocs, subjectId }) {
    const ro = useRO();
    const { c } = useTheme();
    const { t, ty } = useLang();
    const L = G3.layout;
    const [openId, setOpenId] = useState(null);
    const [dlg, setDlg] = useState(null);
    const [done, setDone] = useState(null);

    function toggle(id, label) {
      setOpenId(function (cur) { return cur === id ? null : id; });
      if (openId !== id) onReveal(label);
    }

    /* the six facts that are not PII read faster as a grid of short
       pairs than as six full-width rows with an inch of rule between
       each label and its value */
    const who = [
      { k: "name", label: t("rec3.p.name"), v: t(P.nameKey) },
      { k: "code", label: t("rec3.p.code"), v: P.code, mono: true },
      { k: "gender", label: t("rec3.p.gender"), v: t(P.genderKey) },
      { k: "status", label: t("rec3.p.status"), v: t(P.statusKey) },
      { k: "campus", label: t("rec3.p.campus"), v: t(P.campusKey) },
      { k: "dept", label: t("rec3.p.dept"), v: t(P.deptKey) },
    ];

    return (
      <div>
        <div style={{ display: "flex", gap: L.gap, alignItems: "flex-start", flexWrap: "wrap" }}>
          <Card
            icon="profile" iconTone="accent"
            title={t("rec3.p.person.title")} sub={t("rec3.p.person.sub")}
            style={{ flex: "1.05 1 420px", minWidth: 0, alignSelf: "stretch" }}
            action={<Button disabled={ro} kind="primary" size="sm" iconLeft="document" onClick={() => { setDone(null); setDlg("person"); }}>{t("rec3.p.edit")}</Button>}
          >
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "14px 26px" }}>
              {who.map((f) => (
                <div key={f.k}>
                  <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 3 })}>{f.label}</div>
                  {f.mono
                    ? <span style={G3.fig("sm", { color: c.ink, fontWeight: 600 })}>{f.v}</span>
                    : <span style={ty("small", { color: c.ink, fontWeight: 600 })}>{f.v}</span>}
                </div>
              ))}
            </div>

            <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid " + c.rule }}>
              <GroupHead label={t("rec3.p.g.reach")} />
              {CONTACT.map((f, i) => (
                <MaskedField key={f.id} field={f} open={openId === f.id} onToggle={toggle} last={i === CONTACT.length - 1} />
              ))}
              <DefRow label={t("rec3.p.email")} wide last><Value>{P.contact.email}</Value></DefRow>
            </div>
            {done === "person" ? <DoneLine word={t("rec3.edit.saved")} /> : null}
          </Card>

          <Card
            icon="lock" iconTone="accent"
            title={t("rec3.p.ids.title")} sub={t("rec3.p.ids.sub")}
            style={{ flex: "1 1 400px", minWidth: 0, alignSelf: "stretch" }}
            action={<Button disabled={ro} kind="primary" size="sm" iconLeft="filing" onClick={() => { setDone(null); setDlg("ids"); }}>{t("rec3.p.edit")}</Button>}
          >
            {IDENTIFIERS.map((f, i) => (
              <MaskedField key={f.id} field={f} open={openId === f.id} onToggle={toggle} last={i === IDENTIFIERS.length - 1} />
            ))}
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid " + c.rule }}>
              <Button disabled={ro} kind="primary" size="sm" iconLeft="payslip" onClick={() => { setDone(null); setDlg("bank"); }}>{t("rec3.p.editBank")}</Button>
              <p style={ty("caption", { margin: "10px 0 0", color: c.inkFaint, maxWidth: 440 })}>{t("rec3.p.missingOk")}</p>
            </div>
            {done === "ids" || done === "bank" ? <DoneLine word={t("rec3.edit.saved")} /> : null}
          </Card>
        </div>

        {dlg === "person" ? (
          <EditDialog
            titleKey="rec3.edit.person.title" bodyKey="rec3.edit.person.body"
            fields={[
              { id: "phone", labelKey: "rec3.p.phone", now: "+91 XXXXX X4210" },
              { id: "address", labelKey: "rec3.p.address", nowKey: "rec3.p.addressMasked" },
              { id: "kin", labelKey: "rec3.p.kin", now: "+91 XXXXX X4211", hintKey: "rec3.edit.person.kinHint" },
              { id: "email", labelKey: "rec3.p.email", nowKey: "rec3.p.emailV" },
            ]}
            onClose={() => setDlg(null)} onDone={() => { setDlg(null); setDone("person"); }}
          />
        ) : null}
        {dlg === "ids" ? (
          <EditDialog
            titleKey="rec3.edit.ids.title" bodyKey="rec3.edit.ids.body" noteKey="rec3.edit.ids.note"
            fields={[
              { id: "pan", labelKey: "rec3.p.ids.pan", now: "XXXXXX000A" },
              { id: "aadhaar", labelKey: "rec3.p.ids.aadhaar", now: "XXXX XXXX 0000", hintKey: "rec3.edit.ids.aadhaarHint" },
              { id: "uan", labelKey: "rec3.p.ids.uan", now: "XXXX XXXX 0042" },
              { id: "esic", labelKey: "rec3.p.ids.esic", now: "XXXXXX0042" },
            ]}
            onClose={() => setDlg(null)} onDone={() => { setDlg(null); setDone("ids"); }}
          />
        ) : null}
        {dlg === "bank" ? (
          <EditDialog
            titleKey="rec3.edit.bank.title" bodyKey="rec3.edit.bank.body" noteKey="rec3.edit.bank.note"
            fields={[
              { id: "acct", labelKey: "rec3.p.ids.bank", now: "HDFC 0000 6841" },
              { id: "ifsc", labelKey: "rec3.p.ids.ifsc", now: "HDFC0000042", hintKey: "rec3.edit.bank.ifscHint" },
            ]}
            link={{ label: t("rec3.d.det.ask"), onClick: onGoDocs }}
            onClose={() => setDlg(null)} onDone={() => { setDlg(null); setDone("bank"); }}
          />
        ) : null}
      </div>
    );
  }

  function ContractFacet() {
    const ro = useRO();
    const { c } = useTheme();
    const { t, ty } = useLang();
    const L = G3.layout;
    const [dlg, setDlg] = useState(null);
    const [done, setDone] = useState(null);
    const current = CONTRACTS[0];

    const columns = [
      { key: "from", label: t("rec3.c.hist.col.from"), mono: true, width: 150 },
      { key: "what", label: t("rec3.c.hist.col.what") },
      { key: "by", label: t("rec3.c.hist.col.by"), width: 260 },
      { key: "state", label: t("rec3.c.hist.col.state"), width: 170 },
    ];

    const rows = CONTRACTS.map((v) => ({
      id: v.id,
      tone: v.state === "superseded" ? "dim" : undefined,
      highlight: v.state === "inforce",
      cells: {
        from: fmt(t, v.from),
        what: t(v.whatKey),
        by: (
          <span>
            <span style={{ fontWeight: 600 }}>{t(v.by)}</span>
            <span style={ty("caption", { display: "block", color: c.inkFaint })}>{fmt(t, v.on)}</span>
          </span>
        ),
        state: <StatusMark role={v.state === "inforce" ? "present" : "off"} word={t("rec3.c.st." + v.state)} glyph={v.state === "inforce" ? "check" : "arrow"} />,
      },
    }));

    return (
      <div>
        {/* two tall columns: the terms and their history on the left,
            what the terms DO and what may be done to them on the right.
            Pairing one tall card with one short card only moves the
            empty space to the other column. */}
        <div style={{ display: "flex", gap: L.gap, alignItems: "flex-start" }}>
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: L.gap }}>
          <Card
            icon="briefcase" iconTone="accent"
            title={t("rec3.c.cur.title")} sub={t("rec3.c.cur.sub", { date: fmt(t, current.from) })}
          >
            <DefRow label={t("rec3.c.cat")}><Value>{t(P.contract.categoryKey)}</Value></DefRow>
            <DefRow label={t("rec3.c.kind")}><Value>{t(P.contract.kindKey)}</Value></DefRow>
            <DefRow label={t("rec3.c.minQual")}><Value>{t(P.contract.minQualKey)}</Value></DefRow>
            <DefRow label={t("rec3.c.type")}><Value>{t(P.contract.typeKey)}</Value></DefRow>
            <DefRow label={t("rec3.c.vacation")}>
              {/* the flag does two jobs at once, and the explanation
                  belongs on the flag rather than in a column of its
                  own beside it */}
              <Tip
                label={t("rec3.c.vac.aria")}
                width={300}
                body={
                  <React.Fragment>
                    <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 7 })}>{t("rec3.c.vac.title")}</div>
                    {[
                      { k: "leave", head: "rec3.c.vac.leaveHead", body: "rec3.c.vac.leave" },
                      { k: "pay", head: "rec3.c.vac.payHead", body: "rec3.c.vac.pay" },
                      { k: "flip", head: "rec3.c.vac.flipHead", body: "rec3.c.vac.flip" },
                    ].map((s, i) => (
                      <div key={s.k} style={{ marginTop: i ? 9 : 0 }}>
                        <div style={ty("caption", { color: c.ink, fontWeight: 700 })}>{t(s.head)}</div>
                        <p style={ty("caption", { margin: "2px 0 0", color: c.inkMuted })}>{t(s.body)}</p>
                      </div>
                    ))}
                  </React.Fragment>
                }
              >
                <StatusMark role="holiday" word={t("rec3.f.vacationV")} glyph="festival" />
                {/* the affordance, drawn rather than iconed: there is no
                    info glyph in the kit and one row does not justify one */}
                <span
                  aria-hidden="true"
                  style={Object.assign(ty("caption", {}), {
                    marginInlineStart: 7, width: 15, height: 15, borderRadius: G3.r.pill,
                    border: "1px solid " + c.border, color: c.inkFaint, display: "inline-flex",
                    alignItems: "center", justifyContent: "center", fontWeight: 700, lineHeight: 1,
                  })}
                >?</span>
              </Tip>
            </DefRow>
            <DefRow label={t("rec3.c.doj")}><Value mono>{fmt(t, DOJ)}</Value></DefRow>
            <DefRow label={t("rec3.c.confirmed")}><Value mono>{fmt(t, "2025-04-12")}</Value></DefRow>
            <DefRow label={t("rec3.c.end")}><Value tone={c.inkMuted}>{t("rec3.c.endNone")}</Value></DefRow>
            <DefRow label={t("rec3.c.notice")}><Value mono>{t("rec3.c.noticeV")}</Value></DefRow>
            <DefRow label={t("rec3.c.payGroup")} last>
              <Value>{t(P.pay.groupKey)}</Value>
              <div style={ty("caption", { color: c.inkFaint, marginTop: 2 })}>{t("rec3.c.payGroupNote")}</div>
            </DefRow>

          </Card>

          <Register
            title={t("rec3.c.hist.title")} sub={t("rec3.c.hist.sub")}
            columns={columns} rows={rows}
            footer={<span style={ty("caption", { color: c.inkMuted })}>{t("rec3.c.hist.foot")}</span>}
          />

          {/* what may be done to the contract sits under the contract
            itself, not in the column that describes her job */}
          <Card icon="filing" iconTone="accent" title={t("rec3.c.act.title")} sub={t("rec3.c.act.sub")}>
            <GatedAction label={t("rec3.c.revise")} icon="filing" onClick={() => { setDone(null); setDlg("revise"); }} />
            <GatedAction label={t("rec3.c.transfer")} icon="arrow" onClick={() => { setDone(null); setDlg("transfer"); }} />
            <GatedAction label={t("rec3.c.confirmProb")} icon="check" reason={t("rec3.c.confirmProbNo", { date: fmt(t, "2025-04-12") })} />
            <GatedAction label={t("rec3.c.renew")} icon="clock" reason={t("rec3.c.renewNo")} />
            {done ? <DoneLine role="late" word={t(done)} /> : null}
          </Card>
          </div>

          <div style={{ flex: "0 0 420px", minWidth: 0, display: "flex", flexDirection: "column", gap: L.gap }}>
            {/* WHAT SHE DOES. The header names her designation and her
                department; this is the rest of it — the subjects she
                actually teaches, who she answers to, what she carries
                besides her own classes, and what the account attached
                to her can see. */}
            <Card icon="staff" iconTone="accent" title={t("rec3.c.role.title")} sub={t("rec3.c.role.sub")}>
              <DefRow label={t("rec3.c.role.desig")}><Value>{t(P.desigKey)}</Value></DefRow>
              <DefRow label={t("rec3.c.role.subjects")}><Value>{t(P.role.subjectsKey)}</Value></DefRow>
              <DefRow label={t("rec3.c.role.where")}><Value>{t(P.role.whereKey)}</Value></DefRow>
              <DefRow label={t("rec3.c.role.reports")}><Value>{t(P.role.reportsToKey)}</Value></DefRow>
              <DefRow label={t("rec3.c.role.also")}>
                <Value>{t(P.role.alsoKey)}</Value>
                <div style={ty("caption", { color: c.inkFaint, marginTop: 2 })}>{t(P.role.alsoNoteKey)}</div>
              </DefRow>
              <DefRow label={t("rec3.c.role.signin")} last>
                <StatusMark role="present" word={t("rec3.c.role.signinV")} glyph="check" />
                <div style={ty("caption", { color: c.inkFaint, marginTop: 4 })}>{t("rec3.c.role.signinNote")}</div>
              </DefRow>
            </Card>

            {/* HOW SHE CAME IN. Five dated steps, each either done or
                not — onboarding is a fact about her record, and until
                now this tab made people go and look for it. */}
            <Card icon="check" iconTone="present" title={t("rec3.c.onb.title")} sub={t("rec3.c.onb.sub")}>
              <Trail
                items={P.onboarding.map((x) => ({ k: x.key, d: x.d }))}
              />
              <p style={ty("caption", { margin: "14px 0 0", paddingTop: 12, borderTop: "1px solid " + c.rule, color: c.inkFaint })}>
                {t("rec3.c.onb.by", { who: t(P.onboardedByKey) })}
              </p>
            </Card>

          </div>
        </div>

        {dlg === "revise" ? <ReviseDialog current={current} onClose={() => setDlg(null)} onDone={() => { setDlg(null); setDone("rec3.c.sent"); }} /> : null}
        {dlg === "transfer" ? <TransferDialog onClose={() => setDlg(null)} onDone={() => { setDlg(null); setDone("rec3.dlg.recorded"); }} /> : null}
      </div>
    );
  }

  function ReviseDialog({ current, onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [from, setFrom] = useState("");
    const [type, setType] = useState("permanent");
    const [vac, setVac] = useState(null);   /* NO DEFAULT — it moves money */
    const [err, setErr] = useState({});
    const overlaps = from && days(current.from, from) <= 0;

    function submit() {
      const e = {};
      if (!from) e.from = "rec3.dlg.revise.fromMissing";
      else if (overlaps) e.from = "overlap";
      if (vac == null) e.vac = "rec3.dlg.revise.vacMissing";
      setErr(e);
      if (Object.keys(e).length) return;
      onDone();
    }

    return (
      <Dialog title={t("rec3.dlg.revise.title")} onCancel={onClose} width={560}>
        <p style={ty("small", { color: c.inkMuted, margin: "0 0 16px" })}>{t("rec3.dlg.revise.body")}</p>
        <Field
          id="rec3-rev-from" label={t("rec3.dlg.revise.from")}
          error={err.from ? (err.from === "overlap" ? t("rec3.dlg.revise.overlap", { date: fmt(t, current.from) }) : t(err.from)) : null}
        >
          <Input id="rec3-rev-from" type="date" value={from} onChange={(v) => { setFrom(v); setErr({}); }} invalid={!!err.from} />
        </Field>
        <Field id="rec3-rev-type" label={t("rec3.dlg.revise.type")}>
          <Select
            id="rec3-rev-type" value={type} onChange={setType}
            options={[
              { value: "permanent", label: t("rec3.dlg.emp.permanent") },
              { value: "probation", label: t("rec3.dlg.emp.probation") },
              { value: "contract", label: t("rec3.dlg.emp.contract") },
              { value: "visiting", label: t("rec3.dlg.emp.visiting") },
            ]}
          />
        </Field>
        <Field id="rec3-rev-vac" label={t("rec3.dlg.revise.vac")} hint={t("rec3.dlg.revise.vacHint")} error={err.vac ? t(err.vac) : null}>
          <ChoiceGroup
            ariaLabel={t("rec3.dlg.revise.vac")} value={vac} onChange={(v) => { setVac(v); setErr({}); }} invalid={!!err.vac}
            items={[{ key: "yes", label: t("rec3.dlg.revise.yes") }, { key: "no", label: t("rec3.dlg.revise.no") }]}
          />
        </Field>
        {vac === "no" ? <Warn>{t("rec3.c.vac.flip")}</Warn> : null}
        <Consequence lines={[t("rec3.dlg.revise.c1"), t("rec3.dlg.revise.c2"), t("rec3.dlg.revise.c3"), t("rec3.dlg.revise.c4")]} />
        <p style={ty("caption", { color: c.inkMuted, margin: "0 0 4px" })}>{t("rec3.dlg.revise.second")}</p>
        <DialogFoot confirmLabel={t("rec3.dlg.revise.confirm")} onCancel={onClose} onConfirm={submit} />
      </Dialog>
    );
  }

  function TransferDialog({ onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [dept, setDept] = useState("science");
    const [from, setFrom] = useState("");
    const [err, setErr] = useState(null);
    function submit() {
      if (!from) { setErr("rec3.dlg.transfer.fromMissing"); return; }
      onDone();
    }
    return (
      <Dialog title={t("rec3.dlg.transfer.title")} onCancel={onClose}>
        <p style={ty("small", { color: c.inkMuted, margin: "0 0 16px" })}>{t("rec3.dlg.transfer.body")}</p>
        <Field id="rec3-tr-dept" label={t("rec3.dlg.transfer.dept")}>
          <Select
            id="rec3-tr-dept" value={dept} onChange={setDept}
            options={[
              { value: "science", label: t("rec3.dlg.dept.science") },
              { value: "math", label: t("rec3.dlg.dept.math") },
              { value: "languages", label: t("rec3.dlg.dept.languages") },
            ]}
          />
        </Field>
        <Field id="rec3-tr-campus" label={t("rec3.dlg.transfer.campus")} hint={t("rec3.dlg.transfer.campusNote")}>
          <Select id="rec3-tr-campus" value="indiranagar" options={[{ value: "indiranagar", label: t("rec3.dlg.campus.indiranagar") }]} />
        </Field>
        <Field id="rec3-tr-from" label={t("rec3.dlg.transfer.from")} error={err ? t(err) : null}>
          <Input id="rec3-tr-from" type="date" value={from} onChange={(v) => { setFrom(v); setErr(null); }} invalid={!!err} />
        </Field>
        <p style={ty("caption", { color: c.inkFaint, margin: 0 })}>{t("rec3.dlg.audit")}</p>
        <DialogFoot confirmLabel={t("rec3.dlg.transfer.confirm")} onCancel={onClose} onConfirm={submit} />
      </Dialog>
    );
  }

  const EVENT_LOOK = {
    joined: { role: "ltEL", glyph: "arrow" },
    confirmed: { role: "present", glyph: "check" },
    promoted: { role: "holiday", glyph: "arrowUp" },
    transferred: { role: "ltCasual", glyph: "arrow" },
    revised: { role: "off", glyph: "payslip" },
    exited: { role: "absent", glyph: "signout" },
  };

  /* ============================================================
     HR-06 · SERVICE BOOK

     "What is her career here?"

     `ServiceRecord` is an immutable career timeline (§6.3) and the
     basis of gratuity (M12). So the entries are ordered by WHEN THEY
     WERE WRITTEN, not by when they take effect — a service book is a
     ledger, and reading it in write order is what makes a correction
     legible: the 6 August entry sits above the 12 May entry it puts
     right, both fully readable, each naming the other.

     There is no control here that changes or removes an entry, for
     anyone, in any state (§6.3 "immutable", §4.2). A mistake is put
     right by adding.
     ============================================================ */
  function ServiceFacet() {
    const ro = useRO();
    const { c } = useTheme();
    const { t, ty } = useLang();
    const L = G3.layout;
    const [dlg, setDlg] = useState(null);
    const [done, setDone] = useState(null);

    const entries = SERVICE.slice().sort((a, b) => (a.rec < b.rec ? 1 : a.rec > b.rec ? -1 : 0));
    const service = span(DOJ, TODAY);
    const gratuityOn = addYears(DOJ, GRATUITY_YEARS);

    const facts = [
      { k: "span", label: t("rec3.s.grat.total"), value: t("rec3.s.grat.span", { y: num(service.y), m: num(service.m), d: num(service.d) }), mono: true, note: t("rec3.s.grat.from", { date: fmt(t, DOJ) }) },
      { k: "breaks", label: t("rec3.s.grat.breaks"), value: t("rec3.s.grat.noBreaks"), note: t("rec3.s.grat.breaksNote") },
      { k: "grat", label: t("rec3.s.grat.eligible"), value: fmt(t, gratuityOn), mono: true, note: t("rec3.s.grat.eligibleNote") },
    ];

    return (
      <div>
        {/* the one number a settlement is computed from, what could
            break it, and the date it starts to matter — three figures
            across the top, with the two things you can do to the book
            in the same header */}
        <Card
          icon="clock" iconTone="accent"
          title={t("rec3.s.grat.title")} sub={t("rec3.s.grat.sub")}
          action={
            <span style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Button disabled={ro} kind="secondary" size="sm" iconLeft="filing" onClick={() => { setDone(null); setDlg("event"); }}>{t("rec3.s.add")}</Button>
              <Button disabled={ro} kind="secondary" size="sm" iconLeft="download" onClick={() => { setDlg(null); setDone("rec3.s.downloadNote"); }}>{t("rec3.s.download")}</Button>
            </span>
          }
        >
          <div style={{ display: "flex", flexWrap: "wrap", marginTop: 4 }}>
            {facts.map((f, i) => (
              <div
                key={f.k}
                style={{
                  flex: "1 1 240px", minWidth: 0, padding: i ? "0 22px" : "0 22px 0 0",
                  borderInlineStart: i ? "1px solid " + c.rule : "none",
                }}
              >
                <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 5 })}>{f.label}</div>
                {f.mono
                  ? <div style={G3.fig("md", { color: c.ink, fontWeight: 600 })}>{f.value}</div>
                  : <div style={ty("body", { color: c.ink, fontWeight: 600 })}>{f.value}</div>}
                <div style={ty("caption", { color: c.inkMuted, marginTop: 5 })}>{f.note}</div>
              </div>
            ))}
          </div>
          <p style={ty("caption", { margin: "16px 0 0", paddingTop: 12, borderTop: "1px solid " + c.rule, color: c.inkFaint })}>{t("rec3.s.grat.note")}</p>
          {done ? <DoneLine word={t(done)} /> : null}
        </Card>

        <Card
          icon="list" iconTone="accent"
          title={t("rec3.s.tl.title")} sub={t("rec3.s.tl.sub")}
          style={{ marginTop: L.gap }}
        >
          <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {entries.map((e, i) => {
              const look = EVENT_LOOK[e.type];
              const superseded = !!e.correctedByOn;
              return (
                <li
                  key={e.id}
                  style={{
                    display: "flex", gap: 14, alignItems: "flex-start",
                    padding: "13px 0", borderBottom: i < entries.length - 1 ? "1px dashed " + c.border : "none",
                    opacity: superseded ? 0.78 : 1,
                  }}
                >
                  <span style={{ flexShrink: 0, width: 132 }}>
                    <StatusMark role={look.role} word={t("rec3.s.ev." + e.type)} glyph={look.glyph} />
                  </span>
                  <span style={{ flexShrink: 0, width: 150, display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                    <span style={ty("caption", { color: c.inkFaint, fontWeight: 700 })}>{t("rec3.s.effective")}</span>
                    <span style={G3.fig("sm", { color: c.ink, fontWeight: 700 })}>{fmt(t, e.eff)}</span>
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={ty("small", { display: "block", color: c.ink })}>
                      {t(e.detailKey, e.correctsOn ? { date: fmt(t, e.correctsOn) } : undefined)}
                    </span>
                    {superseded ? (
                      <span style={{ display: "inline-flex", marginTop: 7 }}>
                        <Chip bg={c.sunken} fg={c.inkMuted}>
                          <span aria-hidden="true" style={{ display: "flex" }}><Icon name="arrowUp" size={12} /></span>
                          <span>{t("rec3.s.corrected", { date: fmt(t, e.correctedByOn) })}</span>
                        </Chip>
                      </span>
                    ) : null}
                  </span>
                  <span style={{ flexShrink: 0, width: 210, textAlign: "end" }}>
                    <span style={ty("caption", { color: c.inkFaint })}>
                      {t("rec3.s.recorded", { date: fmt(t, e.rec), who: t(e.by) })}
                    </span>
                  </span>
                </li>
              );
            })}
          </ol>
          <p style={ty("caption", { margin: "16px 0 0", paddingTop: 12, borderTop: "1px solid " + c.rule, color: c.inkFaint })}>{t("rec3.s.rule")}</p>
        </Card>

        {dlg === "event" ? <EventDialog onClose={() => setDlg(null)} onDone={() => { setDlg(null); setDone("rec3.s.added"); }} /> : null}
      </div>
    );
  }

  function EventDialog({ onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [type, setType] = useState("");
    const [eff, setEff] = useState("");
    const [details, setDetails] = useState("");
    const [err, setErr] = useState({});
    const beforeDoj = eff && days(DOJ, eff) < 0;

    function submit() {
      const e = {};
      if (!type) e.type = "rec3.dlg.event.typeMissing";
      if (!eff) e.eff = "rec3.dlg.event.dateMissing";
      else if (beforeDoj) e.eff = "beforeDoj";
      if (!details.trim()) e.details = "rec3.dlg.event.detailsMissing";
      setErr(e);
      if (Object.keys(e).length) return;
      onDone();
    }

    return (
      <Dialog title={t("rec3.dlg.event.title")} onCancel={onClose} width={560}>
        <p style={ty("small", { color: c.inkMuted, margin: "0 0 16px" })}>{t("rec3.dlg.event.body")}</p>
        <Field id="rec3-ev-type" label={t("rec3.dlg.event.type")} error={err.type ? t(err.type) : null}>
          <Select
            id="rec3-ev-type" value={type} onChange={(v) => { setType(v); setErr({}); }}
            options={[{ value: "", label: t("rec3.dlg.event.typePh") }].concat(
              ["joined", "confirmed", "promoted", "transferred", "revised", "exited"].map((k) => ({ value: k, label: t("rec3.s.ev." + k) }))
            )}
          />
        </Field>
        <Field
          id="rec3-ev-date" label={t("rec3.dlg.event.date")}
          error={err.eff ? (err.eff === "beforeDoj" ? t("rec3.dlg.event.beforeDoj", { date: fmt(t, DOJ) }) : t(err.eff)) : null}
        >
          <Input id="rec3-ev-date" type="date" value={eff} onChange={(v) => { setEff(v); setErr({}); }} invalid={!!err.eff} />
        </Field>
        <Field id="rec3-ev-det" label={t("rec3.dlg.event.details")} error={err.details ? t(err.details) : null}>
          <Input id="rec3-ev-det" value={details} onChange={(v) => { setDetails(v); setErr({}); }} placeholder={t("rec3.dlg.event.detailsPh")} invalid={!!err.details} />
        </Field>
        <p style={ty("caption", { color: c.inkMuted, margin: "0 0 8px" })}>{t("rec3.dlg.event.grat")}</p>
        <p style={ty("caption", { color: c.inkFaint, margin: 0 })}>{t("rec3.dlg.audit")}</p>
        <DialogFoot confirmLabel={t("rec3.dlg.event.confirm")} onCancel={onClose} onConfirm={submit} />
      </Dialog>
    );
  }

  /* ============================================================
     HR-07 · DOCUMENTS

     "What do we hold for her, and is it valid?"

     This is HR's half of the M4 loop whose employee half is
     pages/documents.jsx and whose queue is hr.jsx HR-09. The words
     are deliberately the same in all three, because they are one
     workflow seen from three seats.

     Four things this screen refuses to do:
       · it has no delete, in any state, for anybody (§3, A21);
       · it will not let a response be put on record before it has
         been opened — "check it and put it on record" stays disabled,
         with the reason readable, until "open what she sent" has been
         pressed for that row;
       · an HR upload lands as NOT CHECKED, even though HR added it —
         self-verifying on upload is exactly what M4 exists to stop;
       · the child-safety document is a category this role does not
         hold. Opening the FILE is absent, not disabled, because the
         right does not exist here — while its validity and expiry
         stay visible, since a lapse is the safeguarding failure (O8).
     ============================================================ */
  function DocumentsFacet({ reqs, setReqs, opened, setOpened, medicalOnRecord, setMedicalOnRecord, openRaise, onRaiseConsumed }) {
    const ro = useRO();
    const { c } = useTheme();
    const { t, ty } = useLang();
    const L = G3.layout;
    /* the alerts band can send you here WITH the ask dialog open. It is a
       one-shot: consumed on mount, so coming back to this tab later opens
       the tab, not the dialog again. */
    const [dlg, setDlg] = useState(openRaise ? { kind: "raise" } : null);
    useEffect(() => { if (openRaise && onRaiseConsumed) onRaiseConsumed(); }, []); // eslint-disable-line
    const [done, setDone] = useState(null);
    const [sel, setSel] = useState(null);
    const [reminded, setReminded] = useState({});

    /* the medical certificate is the one row this screen can move:
       verifying her response promotes it to the copy of record, and
       the register, the checklist and the alerts all read the same
       flag — so nothing on the page can disagree with anything else */
    const docs = DOCS.map((d) => {
      if (d.id !== "medical" || !medicalOnRecord) return d;
      return Object.assign({}, d, {
        state: "verified", issued: "2026-08-05", valid: "2028-08-04", since: TODAY, src: "response",
        trail: d.trail.concat([{ k: "rec3.d.trail.promoted", who: "rec3.who.you", d: TODAY }]),
      });
    });

    const missingTypes = REQUIRED.filter((r) => !docs.some((d) => d.type === r));
    const selected = sel ? docs.filter((d) => d.id === sel)[0] : null;

    function setReq(id, patch) {
      setReqs(reqs.map((r) => (r.id === id ? Object.assign({}, r, patch) : r)));
    }

    /* ---- requests register ---- */
    const reqColumns = [
      { key: "doc", label: t("rec3.d.req.col.doc") },
      { key: "state", label: t("rec3.d.req.col.state"), width: 380 },
      { key: "due", label: t("rec3.d.req.col.due"), width: 300 },
      { key: "actions", label: t("rec3.d.req.col.actions"), width: 64, align: "right" },
    ];

    const reqRows = reqs.map((r) => {
      const st = REQ_STATE[r.status];
      const left = days(TODAY, r.due);
      const isOpen = r.status === "open" || r.status === "rejected";
      const wasOpened = !!opened[r.id];

      let items = null;
      if (isOpen) {
        items = [
          { key: "remind", icon: "mail", label: t("rec3.d.menu.remind"), disabled: !!reminded[r.id], reason: reminded[r.id] ? t("rec3.d.menu.remindNo") : undefined,
            onSelect: () => { setDone(null); setDlg({ kind: "remind", id: r.id }); } },
          { key: "extend", icon: "clock", label: t("rec3.d.menu.extend"), onSelect: () => { setDone(null); setDlg({ kind: "extend", id: r.id }); } },
          { key: "reject", icon: "arrow", label: t("rec3.d.menu.reject"), disabled: true, reason: t("rec3.d.menu.rejectNo") },
          { key: "cancel", icon: "arrow", label: t("rec3.d.menu.cancel"), tone: "danger", onSelect: () => { setDone(null); setDlg({ kind: "cancelReq", id: r.id }); } },
        ];
      } else if (r.status === "submitted") {
        items = [
          { key: "open", icon: "document", label: t("rec3.d.menu.open"), onSelect: () => { setDone(null); setOpened(Object.assign({}, opened, { [r.id]: true })); } },
          { key: "verify", icon: "check", label: t("rec3.d.menu.verify"), disabled: !wasOpened, reason: wasOpened ? undefined : t("rec3.d.menu.verifyNo"),
            onSelect: () => { setDone(null); setDlg({ kind: "verify", id: r.id }); } },
          { key: "reject", icon: "arrow", label: t("rec3.d.menu.reject"), onSelect: () => { setDone(null); setDlg({ kind: "reject", id: r.id }); } },
          { key: "cancel", icon: "arrow", label: t("rec3.d.menu.cancel"), disabled: true, reason: t("rec3.d.menu.cancelNo") },
        ];
      }

      return {
        id: r.id,
        tone: r.status === "cancelled" || r.status === "verified" ? "dim" : undefined,
        cells: {
          doc: (
            <span>
              <span style={ty("small", { display: "block", color: c.ink, fontWeight: 600 })}>{t("rec3.type." + r.type)}</span>
              <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 2 })}>
                {t("rec3.d4.askedOn", { date: fmt(t, r.asked), who: t(r.by) })}
              </span>
            </span>
          ),
          state: (
            <span style={{ display: "inline-flex", gap: 6, flexWrap: "wrap" }}>
              <StatusMark role={st.role} word={t(st.word)} glyph={st.glyph} />
              {r.status === "submitted" && wasOpened ? <Chip bg={c.sunken} fg={c.inkMuted}>{t("rec3.d.opened")}</Chip> : null}
            </span>
          ),
          due: (
            <span>
              <span style={G3.fig("sm", { color: c.ink })}>{fmt(t, r.due)}</span>
              {r.status === "open" ? (
                <span style={ty("caption", { display: "block", color: left < 0 ? c.absentText : c.inkFaint })}>
                  {left < 0 ? t("rec3.d.req.overdue", { n: num(-left) }) : t("rec3.d.req.daysLeft", { n: num(left) })}
                </span>
              ) : null}
              {r.responded ? <span style={ty("caption", { display: "block", color: c.inkMuted, marginTop: 2 })}>{t("rec3.d.req.respondedOn", { date: fmt(t, r.responded) })}</span> : null}
            </span>
          ),
          actions: items ? <ActionMenu ariaLabel={t("rec3.d.menu.aria")} items={roItems(items, ro, t("rec3.ro.why"))} size={30} /> : null,
        },
      };
    });

    /* ---- documents register ---- */
    const docColumns = [
      { key: "doc", label: t("rec3.d.reg.col.doc") },
      { key: "state", label: t("rec3.d.reg.col.state"), width: 380 },
      { key: "valid", label: t("rec3.d.reg.col.valid"), width: 320 },
      { key: "actions", label: t("rec3.d.reg.col.actions"), width: 64, align: "right" },
    ];

    const docRows = docs.map((d) => {
      const st = DOC_STATE[d.state];
      const to = d.valid ? days(TODAY, d.valid) : null;
      const items = [
        { key: "edit", icon: "document", label: t("rec3.d.edit.action"), onSelect: () => { setDone(null); setSel(d.id); setDlg({ kind: "editDoc", id: d.id }); } },
        { key: "hist", icon: "list", label: t("rec3.d.hist.action"), onSelect: () => { setDone(null); setSel(d.id); setDlg({ kind: "history", id: d.id }); } },
        { key: "expiry", icon: "clock", label: t("rec3.d.det.setExpiry"), onSelect: () => { setDone(null); setSel(d.id); setDlg({ kind: "expiry", id: d.id }); } },
        { key: "ask", icon: "mail", label: t("rec3.d.det.ask"), onSelect: () => { setDone(null); setDlg({ kind: "raise", type: d.type }); } },
      ];
      /* replacing means handling the file itself, so it is not built
         for a category this role may not open */
      if (!d.restricted) {
        items.splice(1, 0, { key: "replace", icon: "download", label: t("rec3.d.det.replace"), onSelect: () => { setDone(null); setDlg({ kind: "upload", type: d.type }); } });
      }

      return {
        id: d.id,
        highlight: sel === d.id,
        cells: {
          doc: (
            <span>
              <span style={ty("small", { display: "block", color: c.ink, fontWeight: 600 })}>{t("rec3.type." + d.type)}</span>
              <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 2 })}>
                {t("rec3.d4.since", { date: fmt(t, d.since) })}
              </span>
            </span>
          ),
          state: (
            <span style={{ display: "inline-flex", gap: 6, flexWrap: "wrap" }}>
              <StatusMark role={st.role} word={t(st.word)} glyph={st.glyph} />
              {d.restricted ? (
                <Chip bg={c.sunken} fg={c.inkMuted}>
                  <span aria-hidden="true" style={{ display: "flex" }}><Icon name="lock" size={12} /></span>
                  <span>{t("rec3.d.st.restricted")}</span>
                </Chip>
              ) : null}
            </span>
          ),
          valid: d.valid ? (
            <span>
              <span style={G3.fig("sm", { color: c.ink })}>{fmt(t, d.valid)}</span>
              {to <= EXPIRY_HORIZON_DAYS ? (
                <span style={ty("caption", { display: "block", color: to < 0 ? c.absentText : c.inkFaint })}>
                  {to < 0 ? t("rec3.d.daysAgo", { n: num(-to) }) : t("rec3.d.daysTo", { n: num(to) })}
                </span>
              ) : null}
            </span>
          ) : <span style={ty("caption", { color: c.inkFaint })}>{t("rec3.d.noExpiry")}</span>,
          actions: <ActionMenu ariaLabel={t("rec3.d.menu.aria")} items={roItems(items, ro, t("rec3.ro.why"))} size={30} />,
        },
      };
    });

    /* a type her category requires and the file does not hold is a row
       that says so, at the foot of the register. It reads as part of
       the file — which is the point: the gap IS the file's state. */
    const missingRows = missingTypes.map((type) => ({
      id: "missing:" + type,
      cells: {
        doc: (
          <span>
            <span style={ty("small", { display: "block", color: c.ink, fontWeight: 600 })}>{t("rec3.type." + type)}</span>
            <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 2 })}>{t("rec3.d4.requiredBy")}</span>
          </span>
        ),
        state: <StatusMark role="missing" word={t("rec3.d.st.missing")} />,
        valid: <span style={ty("caption", { color: c.inkFaint })}>{t("rec3.d4.nothingHeld")}</span>,
        actions: (
          <ActionMenu
            ariaLabel={t("rec3.d.menu.aria")}
            size={30}
            items={roItems([
              { key: "ask", icon: "mail", label: t("rec3.d.det.ask"), onSelect: () => { setDone(null); setDlg({ kind: "raise", type: type }); } },
              { key: "upload", icon: "download", label: t("rec3.d.det.replace"), onSelect: () => { setDone(null); setDlg({ kind: "upload", type: type }); } },
            ], ro, t("rec3.ro.why"))}
          />
        ),
      },
    }));

    /* the four numbers that say whether her file is in order. Each is
       COUNTED from the same two arrays the tables below draw, so the
       band cannot say one thing and a row another. */
    const attention = docs.filter((d) => d.state === "expired" || d.state === "expiring").length;
    const waiting = reqs.filter((r) => r.status === "open" || r.status === "rejected").length;
    const toCheck = reqs.filter((r) => r.status === "submitted").length;
    const facts = [
      { k: "held", label: t("rec3.d4.held"), value: num(docs.length), note: t("rec3.d4.heldNote"), tone: c.chartGreen },
      { k: "attention", label: t("rec3.d4.attention"), value: num(attention), note: t("rec3.d4.attentionNote"),
        tone: attention ? c.chartRed : c.chartGreen, warn: attention > 0 },
      { k: "missing", label: t("rec3.d4.missing"), value: num(missingTypes.length), note: t("rec3.d4.missingNote"),
        tone: missingTypes.length ? c.chartPurple : c.chartGreen },
      { k: "asked", label: t("rec3.d4.asked"), value: num(waiting + toCheck), note: t("rec3.d4.askedNote", { n: num(waiting), m: num(toCheck) }),
        tone: toCheck ? c.chartAmber : c.chartBlue },
    ];

    return (
      <div>
        <Card
          icon="document" iconTone="accent"
          title={t("rec3.d4.title")} sub={t("rec3.d4.sub")}
          action={
            <span style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Button disabled={ro} kind="secondary" size="sm" iconLeft="download" onClick={() => { setDone(null); setDlg({ kind: "upload" }); }}>{t("rec3.d.reg.upload")}</Button>
              <Button disabled={ro} kind="primary" size="sm" iconLeft="mail" onClick={() => { setDone(null); setDlg({ kind: "raise" }); }}>{t("rec3.d.req.raise")}</Button>
            </span>
          }
        >
          <MetricStrip pad={0} style={{ marginTop: 6 }} metrics={facts} />
          {done ? <DoneLine word={t(done)} /> : null}
        </Card>

        {/* WHAT IS OPEN WITH HER first: it is the only part of this tab
            where somebody else is waiting on somebody. */}
        <div style={{ marginTop: L.gap }}>
          {reqs.length === 0 ? (
            <Card icon="mail" iconTone="accent" title={t("rec3.d.req.title")} sub={t("rec3.d.req.sub")}>
              <EmptyState head={t("rec3.d.req.empty.head")} body={t("rec3.d.req.empty.body")} />
            </Card>
          ) : (
            <Register
              title={t("rec3.d.req.title")} sub={t("rec3.d.req.sub")}
              columns={reqColumns} rows={reqRows}
              footer={<span style={ty("caption", { color: c.inkMuted, maxWidth: 620 })}>{t("rec3.d.req.foot")}</span>}
            />
          )}
        </div>

        {/* THE FILE ITSELF, required types included as rows. A type she
            must hold and does not is a row that says so — not a second
            list in a second column saying the same thing again. */}
        <div style={{ marginTop: L.gap }}>
          <Register
            title={t("rec3.d.reg.title")} sub={t("rec3.d.reg.sub")}
            columns={docColumns} rows={docRows.concat(missingRows)}
            footer={<span style={ty("caption", { color: c.inkMuted })}>{t("rec3.d.reg.foot", { n: num(docs.length), m: num(missingTypes.length) })}</span>}
          />
        </div>

        {dlg && dlg.kind === "history" && selected ? (
          <HistoryDialog doc={selected} onClose={() => { setDlg(null); setSel(null); }} />
        ) : null}

        {dlg && dlg.kind === "editDoc" && selected ? (
          <EditDialog
            titleKey="rec3.d.edit.title" bodyKey="rec3.d.edit.body" noteKey="rec3.d.edit.note"
            fields={[
              { id: "number", labelKey: "rec3.d.edit.number", now: selected.number || t("rec3.d.edit.none") },
              { id: "issued", labelKey: "rec3.d.det.issued", now: selected.issued ? fmt(t, selected.issued) : t("rec3.d.edit.none"), hintKey: "rec3.d.edit.dateHint" },
              { id: "valid", labelKey: "rec3.d.det.valid", now: selected.valid ? fmt(t, selected.valid) : t("rec3.d.noExpiry"), hintKey: "rec3.d.edit.validHint" },
            ]}
            onClose={() => setDlg(null)} onDone={() => { setDlg(null); setDone("rec3.d.edit.done"); }}
          />
        ) : null}

        {dlg && dlg.kind === "raise" ? (
          <RaiseDialog type={dlg.type} onClose={() => setDlg(null)} onDone={() => { setDlg(null); setDone("rec3.dlg.raise.done"); }} />
        ) : null}
        {dlg && dlg.kind === "upload" ? (
          <UploadDialog type={dlg.type} docs={docs} onClose={() => setDlg(null)} onDone={() => { setDlg(null); setDone("rec3.dlg.upload.done"); }} />
        ) : null}
        {dlg && dlg.kind === "verify" ? (
          <VerifyDialog
            onClose={() => setDlg(null)}
            onDone={() => { setReq(dlg.id, { status: "verified" }); setMedicalOnRecord(true); setSel("medical"); setDlg(null); setDone("rec3.dlg.verify.done"); }}
          />
        ) : null}
        {dlg && dlg.kind === "reject" ? (
          <RejectDialog onClose={() => setDlg(null)} onDone={() => { setReq(dlg.id, { status: "rejected" }); setDlg(null); setDone("rec3.dlg.reject.done"); }} />
        ) : null}
        {dlg && dlg.kind === "cancelReq" ? (
          <ConfirmDialog
            titleKey="rec3.dlg.cancelReq.title" bodyKey="rec3.dlg.cancelReq.body" confirmKey="rec3.dlg.cancelReq.confirm"
            onClose={() => setDlg(null)} onDone={() => { setReq(dlg.id, { status: "cancelled" }); setDlg(null); setDone("rec3.dlg.cancelReq.done"); }}
          />
        ) : null}
        {dlg && dlg.kind === "remind" ? (
          <ConfirmDialog
            titleKey="rec3.dlg.remind.title" bodyKey="rec3.dlg.remind.body" confirmKey="rec3.dlg.remind.confirm"
            onClose={() => setDlg(null)} onDone={() => { setReminded(Object.assign({}, reminded, { [dlg.id]: true })); setDlg(null); setDone("rec3.dlg.remind.done"); }}
          />
        ) : null}
        {dlg && dlg.kind === "extend" ? (
          <DateDialog
            titleKey="rec3.dlg.extend.title" bodyKey="rec3.dlg.extend.body" labelKey="rec3.dlg.extend.date"
            missingKey="rec3.dlg.extend.missing" confirmKey="rec3.dlg.extend.confirm"
            onClose={() => setDlg(null)} onDone={(v) => { setReq(dlg.id, { due: v }); setDlg(null); setDone("rec3.dlg.extend.done"); }}
          />
        ) : null}
        {dlg && dlg.kind === "expiry" ? (
          <DateDialog
            titleKey="rec3.dlg.expiry.title" bodyKey="rec3.dlg.expiry.body" labelKey="rec3.dlg.expiry.date"
            missingKey="rec3.dlg.expiry.missing" confirmKey="rec3.dlg.expiry.confirm" pastKey="rec3.dlg.expiry.past"
            onClose={() => setDlg(null)} onDone={() => { setDlg(null); setDone("rec3.dlg.expiry.done"); }}
          />
        ) : null}
      </div>
    );
  }

  /* What a row cannot say in four columns: where this copy came from
     and everything that has happened to it. It is reading, not doing,
     so it is a dialog with one way out and no actions inside. */
  function HistoryDialog({ doc, onClose }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const st = DOC_STATE[doc.state];
    const to = doc.valid ? days(TODAY, doc.valid) : null;

    return (
      <Dialog title={t("rec3.type." + doc.type)} onCancel={onClose} width={560}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", margin: "-4px 0 18px" }}>
          <StatusMark role={st.role} word={t(st.word)} glyph={st.glyph} />
          {doc.restricted ? (
            <Chip bg={c.sunken} fg={c.inkMuted}>
              <span aria-hidden="true" style={{ display: "flex" }}><Icon name="lock" size={12} /></span>
              <span>{t("rec3.d.st.restricted")}</span>
            </Chip>
          ) : null}
        </div>

        <DefRow label={t("rec3.d.edit.number")} wide><Value mono tone={doc.number ? undefined : c.inkMuted}>{doc.number || t("rec3.d.edit.none")}</Value></DefRow>
        <DefRow label={t("rec3.d.det.issued")} wide><Value mono tone={doc.issued ? undefined : c.inkMuted}>{doc.issued ? fmt(t, doc.issued) : t("rec3.d.edit.none")}</Value></DefRow>
        <DefRow label={t("rec3.d.det.valid")} wide>
          <Value mono tone={doc.valid ? undefined : c.inkMuted}>{doc.valid ? fmt(t, doc.valid) : t("rec3.d.noExpiry")}</Value>
          {doc.valid && to <= EXPIRY_HORIZON_DAYS ? (
            <div style={ty("caption", { color: to < 0 ? c.absentText : c.inkFaint, marginTop: 2 })}>
              {to < 0 ? t("rec3.d.daysAgo", { n: num(-to) }) : t("rec3.d.daysTo", { n: num(to) })}
            </div>
          ) : null}
        </DefRow>
        <DefRow label={t("rec3.d.det.source")} wide last><Value>{t("rec3.d.det.src." + doc.src)}</Value></DefRow>

        {doc.restricted ? (
          <div style={{ marginTop: 16 }}>
            <RulePanel title={t("rec3.d.det.restricted")} lines={[t("rec3.d.det.restrictedWhy"), t("rec3.d.det.restrictedNoRemarks")]} />
          </div>
        ) : null}

        <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid " + c.rule }}>
          <GroupHead label={t("rec3.d.det.hist")} />
          <div style={{ marginTop: 10 }}><Trail items={doc.trail} /></div>
        </div>

        {doc.restricted ? null : <p style={ty("caption", { margin: "16px 0 6px", color: c.inkFaint })}>{t("rec3.d.det.replaceNote")}</p>}
        <DialogFoot confirmLabel={t("rec3.d.hist.close")} onConfirm={onClose} onCancel={onClose} />
      </Dialog>
    );
  }

  const DOC_TYPES = ["degree", "bed", "tet", "pan", "aadhaar", "police", "training", "medical", "address", "bankProof"];

  function RaiseDialog({ type, onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [dt, setDt] = useState(type || "");
    const [why, setWhy] = useState("");
    const [due, setDue] = useState("");
    const [err, setErr] = useState({});
    function submit() {
      const e = {};
      if (!dt) e.dt = "rec3.dlg.upload.typeMissing";
      if (!why.trim()) e.why = "rec3.dlg.raise.whyMissing";
      if (!due) e.due = "rec3.dlg.raise.dueMissing";
      setErr(e);
      if (Object.keys(e).length) return;
      onDone();
    }
    return (
      <Dialog title={t("rec3.dlg.raise.title")} onCancel={onClose} width={560}>
        <p style={ty("small", { color: c.inkMuted, margin: "0 0 16px" })}>{t("rec3.dlg.raise.body")}</p>
        <Field id="rec3-raise-type" label={t("rec3.dlg.raise.type")} error={err.dt ? t(err.dt) : null}>
          <Select
            id="rec3-raise-type" value={dt} onChange={(v) => { setDt(v); setErr({}); }}
            options={[{ value: "", label: t("rec3.dlg.upload.typePh") }].concat(DOC_TYPES.map((k) => ({ value: k, label: t("rec3.type." + k) })))}
          />
        </Field>
        <Field id="rec3-raise-why" label={t("rec3.dlg.raise.why")} error={err.why ? t(err.why) : null}>
          <Input id="rec3-raise-why" value={why} onChange={(v) => { setWhy(v); setErr({}); }} placeholder={t("rec3.dlg.raise.whyPh")} invalid={!!err.why} />
        </Field>
        <Field id="rec3-raise-due" label={t("rec3.dlg.raise.due")} error={err.due ? t(err.due) : null}>
          <Input id="rec3-raise-due" type="date" value={due} onChange={(v) => { setDue(v); setErr({}); }} invalid={!!err.due} />
        </Field>
        <p style={ty("caption", { color: c.inkMuted, margin: "0 0 4px" })}>{t("rec3.dlg.raise.needsLogin")}</p>
        <DialogFoot confirmLabel={t("rec3.dlg.raise.confirm")} onCancel={onClose} onConfirm={submit} />
      </Dialog>
    );
  }

  function UploadDialog({ type, docs, onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [dt, setDt] = useState(type || "");
    const [issued, setIssued] = useState("");
    const [expires, setExpires] = useState("");
    const [file, setFile] = useState("");
    const [err, setErr] = useState({});
    const replaces = dt && docs.some((d) => d.type === dt);
    function submit() {
      const e = {};
      if (!dt) e.dt = "rec3.dlg.upload.typeMissing";
      if (!file) e.file = "rec3.dlg.upload.fileMissing";
      setErr(e);
      if (Object.keys(e).length) return;
      onDone();
    }
    return (
      <Dialog title={t("rec3.dlg.upload.title")} onCancel={onClose} width={560}>
        <p style={ty("small", { color: c.inkMuted, margin: "0 0 16px" })}>{t("rec3.dlg.upload.body")}</p>
        <Field id="rec3-up-type" label={t("rec3.dlg.upload.type")} error={err.dt ? t(err.dt) : null}>
          <Select
            id="rec3-up-type" value={dt} onChange={(v) => { setDt(v); setErr({}); }}
            options={[{ value: "", label: t("rec3.dlg.upload.typePh") }].concat(DOC_TYPES.map((k) => ({ value: k, label: t("rec3.type." + k) })))}
          />
        </Field>
        {replaces ? <Warn>{t("rec3.dlg.upload.replace")}</Warn> : null}
        <Field id="rec3-up-file" label={t("rec3.dlg.upload.file")} error={err.file ? t(err.file) : null}>
          <FileField
            id="rec3-up-file" fileName={file} invalid={!!err.file}
            accept=".pdf,.jpg,.jpeg,.png"
            onPick={(n) => { setFile(n || ""); setErr({}); }}
            hint={t("rec3.dlg.upload.fileHint")}
          />
        </Field>
        <Field id="rec3-up-issued" label={t("rec3.dlg.upload.issued")}>
          <Input id="rec3-up-issued" type="date" value={issued} onChange={setIssued} />
        </Field>
        <Field id="rec3-up-exp" label={t("rec3.dlg.upload.expires")} hint={t("rec3.dlg.upload.expiresHint")}>
          <Input id="rec3-up-exp" type="date" value={expires} onChange={setExpires} />
        </Field>
        <p style={ty("caption", { color: c.inkMuted, margin: "0 0 4px" })}>{t("rec3.dlg.upload.pending")}</p>
        <DialogFoot confirmLabel={t("rec3.dlg.upload.confirm")} onCancel={onClose} onConfirm={submit} />
      </Dialog>
    );
  }

  function VerifyDialog({ onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    return (
      <Dialog title={t("rec3.dlg.verify.title")} onCancel={onClose}>
        <p style={ty("small", { color: c.inkMuted, margin: "0 0 12px" })}>{t("rec3.dlg.verify.body")}</p>
        <p style={ty("small", { color: c.ink, margin: "0 0 8px" })}>{t("rec3.dlg.verify.who", { date: fmt(t, TODAY) })}</p>
        <p style={ty("caption", { color: c.inkFaint, margin: 0 })}>{t("rec3.dlg.audit")}</p>
        <DialogFoot confirmLabel={t("rec3.dlg.verify.confirm")} onCancel={onClose} onConfirm={onDone} />
      </Dialog>
    );
  }

  function RejectDialog({ onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [reason, setReason] = useState("");
    const [note, setNote] = useState("");
    const [err, setErr] = useState(null);
    function submit() {
      if (!reason) { setErr("rec3.dlg.reject.missing"); return; }
      onDone();
    }
    return (
      <Dialog title={t("rec3.dlg.reject.title")} onCancel={onClose}>
        <p style={ty("small", { color: c.inkMuted, margin: "0 0 16px" })}>{t("rec3.dlg.reject.body")}</p>
        <Field id="rec3-rj-reason" label={t("rec3.dlg.reason")} error={err ? t(err) : null}>
          <Select
            id="rec3-rj-reason" value={reason} onChange={(v) => { setReason(v); setErr(null); }}
            options={[
              { value: "", label: t("rec3.dlg.reject.pickPh") },
              { value: "r1", label: t("rec3.dlg.reject.r1") },
              { value: "r2", label: t("rec3.dlg.reject.r2") },
              { value: "r3", label: t("rec3.dlg.reject.r3") },
              { value: "r4", label: t("rec3.dlg.reject.r4") },
            ]}
          />
        </Field>
        <Field id="rec3-rj-note" label={t("rec3.dlg.note")}>
          <Input id="rec3-rj-note" value={note} onChange={setNote} placeholder={t("rec3.dlg.notePh")} />
        </Field>
        <DialogFoot confirmLabel={t("rec3.dlg.reject.confirm")} onCancel={onClose} onConfirm={submit} />
      </Dialog>
    );
  }

  function ConfirmDialog({ titleKey, bodyKey, confirmKey, onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    return (
      <Dialog title={t(titleKey)} onCancel={onClose}>
        <p style={ty("small", { color: c.inkMuted, margin: "0 0 12px" })}>{t(bodyKey)}</p>
        <p style={ty("caption", { color: c.inkFaint, margin: 0 })}>{t("rec3.dlg.audit")}</p>
        <DialogFoot confirmLabel={t(confirmKey)} onCancel={onClose} onConfirm={onDone} />
      </Dialog>
    );
  }

  function DateDialog({ titleKey, bodyKey, labelKey, missingKey, confirmKey, pastKey, onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [val, setVal] = useState("");
    const [err, setErr] = useState(null);
    const past = val && days(TODAY, val) < 0;
    function submit() {
      if (!val) { setErr(missingKey); return; }
      onDone(val);
    }
    return (
      <Dialog title={t(titleKey)} onCancel={onClose}>
        <p style={ty("small", { color: c.inkMuted, margin: "0 0 16px" })}>{t(bodyKey)}</p>
        <Field id="rec3-dd-date" label={t(labelKey)} error={err ? t(err) : null}>
          <Input id="rec3-dd-date" type="date" value={val} onChange={(v) => { setVal(v); setErr(null); }} invalid={!!err} />
        </Field>
        {past && pastKey ? <Warn>{t(pastKey)}</Warn> : null}
        <p style={ty("caption", { color: c.inkFaint, margin: 0 })}>{t("rec3.dlg.audit")}</p>
        <DialogFoot confirmLabel={t(confirmKey)} onCancel={onClose} onConfirm={submit} />
      </Dialog>
    );
  }

  /* ============================================================
     HR-03f · APPRAISAL — the record of what was decided, not the
     machinery of deciding it.

     The conversation happens offline between the head of department
     and HR. What lands here is the outcome: the post she came in on,
     every appraisal since, what it moved her to, and the sentence
     that was said. One column in date order, newest first, append
     only — an appraisal is superseded by the next one and never
     rewritten.

     Recording one is the moment a job title and a salary change, so
     that is the one place this screen writes to both.
     ============================================================ */
  const APPRAISALS_SEED = [
    {
      /* the appraisal that agreed a rise but has no figure yet: its
         percentage is sitting in payroll's PY-06 queue. `grossAfter`
         is null ON PURPOSE -- HR agreed 8%, and what 8% becomes is
         not HR's to write. */
      id: "AP-0004", onISO: "2026-10-05", byKey: "rec3.who.anjali",
      fromKey: "rec3.ap.post.pgt", toKey: "rec3.ap.post.pgt", movedPost: false,
      grossBefore: 94800, grossAfter: null, pct: 8,
      saidKey: "rec3.ap.said.2526",
    },
    {
      id: "AP-0003", onISO: "2026-03-28", byKey: "rec3.who.anjali",
      fromKey: "rec3.ap.post.pgt", toKey: "rec3.ap.post.pgt", movedPost: false,
      grossBefore: 88000, grossAfter: 94800,
      saidKey: "rec3.ap.said.2526",
    },
    {
      id: "AP-0002", onISO: "2025-03-26", byKey: "rec3.who.anjali",
      fromKey: "rec3.ap.post.tgt", toKey: "rec3.ap.post.pgt", movedPost: true,
      grossBefore: 71500, grossAfter: 88000,
      saidKey: "rec3.ap.said.2425",
    },
  ];
  /* the post she was appointed on — the foot of the column, and the
     thing every "moved from" above it is measured against */
  const APPOINTED = { onISO: "2024-04-12", postKey: "rec3.ap.post.tgt", gross: 71500 };

  function pctRise(a, b) { return Math.round(((b - a) / a) * 1000) / 10; }

  function AppraisalFacet() {
    const ro = useRO();
    const { c } = useTheme();
    const { t, ty, lang } = useLang();
    const [list, setList] = useState(APPRAISALS_SEED);
    const [dlg, setDlg] = useState(false);
    const [done, setDone] = useState(null);
    /* money is PII on this record: one figure opens at a time, and
       opening writes a line, exactly as the identifiers do */
    const [openPay, setOpenPay] = useState(null);

    const latest = list[0];

    return (
      <div>
        {done ? (
          <div style={{ marginBottom: 16 }}>
            <DoneLine word={done} />
          </div>
        ) : null}

        <Card
          icon="briefcase" iconTone="accent"
          title={t("rec3.ap.title")}
          action={<Button disabled={ro} kind="primary" size="sm" iconLeft="plus" onClick={() => { setDone(null); setDlg(true); }}>{t("rec3.ap.add")}</Button>}
        >
          <div style={{ display: "flex", gap: 14, alignItems: "baseline", flexWrap: "wrap", paddingBottom: 16, borderBottom: "1px solid " + c.rule }}>
            <span style={ty("caption", { color: c.inkFaint, fontWeight: 700, width: 130, flexShrink: 0 })}>{t("rec3.ap.nowPost")}</span>
            <span style={ty("small", { color: c.ink, fontWeight: 700 })}>{latest ? (latest.toText || t(latest.toKey)) : t(APPOINTED.postKey)}</span>
            <span style={ty("caption", { color: c.inkMuted })}>
              {latest ? t("rec3.ap.since", { d: fmt(t, latest.onISO) }) : t("rec3.ap.since", { d: fmt(t, APPOINTED.onISO) })}
            </span>
          </div>

          {/* THE COLUMN — newest first, appointment at the foot */}
          <div role="list">
            {list.map((a, i) => (
              <div key={a.id} role="listitem" style={{ padding: "16px 0", borderBottom: "1px solid " + c.rule }}>
                <div style={{ display: "flex", gap: 14, alignItems: "baseline", flexWrap: "wrap" }}>
                  <span style={ty("small", { color: c.ink, fontWeight: 700, width: 130, flexShrink: 0 })}>{fmt(t, a.onISO)}</span>
                  <span style={{ flex: 1, minWidth: 260 }}>
                    {a.movedPost ? (
                      <span style={{ display: "flex", gap: 9, alignItems: "center", flexWrap: "wrap" }}>
                        <span style={ty("small", { color: c.inkMuted })}>{t(a.fromKey)}</span>
                        <span aria-hidden="true" style={{ display: "flex", color: c.inkFaint }}><Icon name="arrow" size={14} /></span>
                        <span style={ty("small", { color: c.ink, fontWeight: 700 })}>{a.toText || t(a.toKey)}</span>
                      </span>
                    ) : (
                      <span style={ty("small", { color: c.ink })}>{t("rec3.ap.samePost", { post: a.toText || t(a.toKey) })}</span>
                    )}
                  </span>
                  {i === 0 ? <StatusMark role="present" glyph="check" word={t("rec3.ap.latest")} /> : null}
                </div>

                {/* WHAT WAS SAID is somebody speaking, not the record:
                    set in behind a rule, in the muted ink, so it reads
                    as a quotation and not as a finding */}
                <p style={ty("small", {
                  color: c.inkMuted, margin: "10px 0 0", maxWidth: "70ch",
                  marginInlineStart: 144, paddingInlineStart: 14,
                  borderInlineStart: "2px solid " + c.rule,
                })}>
                  {a.saidText || t(a.saidKey)}
                </p>

                {/* WHO RECORDED IT, WHAT STATE IT IS IN, AND THE ONE
                    THING YOU CAN DO — one line, three places */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
                  marginInlineStart: 144, marginTop: 11,
                }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <Avatar name={t(a.byKey)} size={22} />
                    <span style={ty("caption", { color: c.inkFaint })}>
                      {t("rec3.ap.by", { who: t(a.byKey), id: a.id })}
                    </span>
                  </span>
                  <span style={{ marginInlineStart: "auto", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    {a.grossAfter == null
                      ? <RiseState appr={a} />
                      : (
                        <PayReveal
                          id={a.id}
                          open={openPay === a.id}
                          onToggle={() => setOpenPay(openPay === a.id ? null : a.id)}
                          before={a.grossBefore} after={a.grossAfter}
                        />
                      )}
                  </span>
                </div>
              </div>
            ))}

            {/* where she came in */}
            <div role="listitem" style={{ padding: "16px 0 0" }}>
              <div style={{ display: "flex", gap: 14, alignItems: "baseline", flexWrap: "wrap" }}>
                <span style={ty("small", { color: c.inkMuted, fontWeight: 700, width: 130, flexShrink: 0 })}>{fmt(t, APPOINTED.onISO)}</span>
                <span style={ty("small", { color: c.ink, flex: 1, minWidth: 260 })}>
                  {t("rec3.ap.appointed", { post: t(APPOINTED.postKey) })}
                </span>
              </div>
            </div>
          </div>

          <p style={ty("caption", { color: c.inkFaint, margin: "18px 0 0", paddingTop: 14, borderTop: "1px solid " + c.rule })}>{t("rec3.ap.note")}</p>
        </Card>

        {dlg ? (
          <AddAppraisalDialog
            currentPostKey={latest ? latest.toKey : APPOINTED.postKey}
            currentGross={latest ? latest.grossAfter : APPOINTED.gross}
            onClose={() => setDlg(false)}
            onDone={(rec) => {
              /* the rise leaves HR here and becomes payroll's PY-06
                 queue. Nothing about a rupee is written on this record
                 until the officer has set the figures. */
              const H = window.NaveyaPayHandoff;
              if (H && rec.pct > 0) {
                H.proposeRevision({
                  staffId: P.code, nameKey: "pys.n.ananya", desigKey: "pys.d.ananya",
                  group: "teach", apprId: rec.id, pct: rec.pct,
                  currentGross: rec.grossBefore, byKey: "ph.who.anjali",
                });
              }
              setList((prev) => [rec].concat(prev));
              setDlg(false);
              setDone(t("rec3.ap.addSent", { pct: String(rec.pct) }));
            }}
          />
        ) : null}
      </div>
    );
  }

  /* ============================================================
     HER PAY, IN FULL, AND READ-ONLY.

     The designer asked that HR see "full breakdown of her salary just
     like the payroll officer ... and the HR cant edit the section
     only can send the change request if any". So this is the same
     arithmetic PY-05 shows -- the components that make the gross,
     the statutory deductions that make the net, and what the school
     pays on top -- priced by the SAME functions payroll prices with,
     so the two desks cannot see different figures.

     READ-ONLY IS NOT DISABLED. A disabled Edit button says "you may
     do this, later"; it is false here and always will be. The edit
     control is gone, and in its place is the thing HR CAN do: say,
     in writing, against this person, that something looks wrong.
     ============================================================ */
  function PayBreakdownRO({ staffId, onRequest }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const D = window.Pages3 && window.Pages3.PYSalData;
    const person = D ? D.staffById(staffId) : null;
    if (!D || !person || person.gross == null) return null;
    const lines = D.linesFor(person);
    if (!lines) return null;
    const struct = D.structureFor(person);
    const sim = struct && struct.group === "teach" ? D.SIM.teach3 : D.SIM.admin2;
    const row = sim.rows[0];
    const verdict = D.wageVerdict(lines);

    const ded = [];
    if (row.pf) ded.push({ code: "PF", v: row.pf });
    if (row.esi) ded.push({ code: "ESI", v: row.esi });
    if (row.pt) ded.push({ code: "PT", v: row.pt });
    if (row.tds) ded.push({ code: "TDS", v: row.tds });
    const emp = [];
    if (row.pfEr) emp.push({ code: "PFER", v: row.pfEr });
    if (row.esiEr) emp.push({ code: "ESIER", v: row.esiEr });
    if (row.lwf) emp.push({ code: "LWF", v: row.lwf });

    const gross = lines.reduce(function (s, l) { return s + l.v; }, 0);
    const dedTotal = ded.reduce(function (s, l) { return s + l.v; }, 0);
    const empTotal = emp.reduce(function (s, l) { return s + l.v; }, 0);

    function Col({ head, rows, totalLabel, total, strongLabel, strongTotal }) {
      return (
        <div style={{ minWidth: 0 }}>
          <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 })}>{head}</div>
          {rows.map(function (l) {
            return (
              <div key={l.code} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "6px 0" }}>
                <span style={ty("small", { color: c.ink })}>{l.code}</span>
                <span style={G3.fig("xs", { color: c.ink, fontWeight: 600 })}>{inr(l.v)}</span>
              </div>
            );
          })}
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "7px 0 0", borderTop: "1px solid " + c.rule }}>
            <span style={ty("small", { color: c.inkMuted })}>{totalLabel}</span>
            <span style={G3.fig("xs", { color: c.ink, fontWeight: 600 })}>{inr(total)}</span>
          </div>
          {strongLabel ? (
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "7px 0 0", borderTop: "1px solid " + c.rule }}>
              <span style={ty("small", { color: c.ink, fontWeight: 700 })}>{strongLabel}</span>
              <span style={G3.fig("sm", { color: c.ink, fontWeight: 700 })}>{inr(strongTotal)}</span>
            </div>
          ) : null}
        </div>
      );
    }

    return (
      <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid " + c.rule }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
          <div>
            <div style={ty("small", { color: c.ink, fontWeight: 700 })}>{t("rec3.bd.head")}</div>
            <p style={ty("caption", { color: c.inkMuted, margin: "3px 0 0", maxWidth: "70ch" })}>
              {t("rec3.bd.sub", { structure: struct ? t(struct.nameKey) : "" })}
            </p>
          </div>
          <StatusMark role="off" glyph="lock" word={t("rec3.bd.ro")} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 24 }}>
          <Col head={t("rec3.bd.earn")} rows={lines.map(function (l) { return { code: l.code, v: l.v }; })}
            totalLabel={t("rec3.bd.grossLabel")} total={gross} />
          <Col head={t("rec3.bd.ded")} rows={ded}
            totalLabel={t("rec3.bd.dedTotal")} total={dedTotal}
            strongLabel={t("rec3.bd.net")} strongTotal={gross - dedTotal} />
          <Col head={t("rec3.bd.emp")} rows={emp}
            totalLabel={t("rec3.bd.empTotal")} total={empTotal}
            strongLabel={t("rec3.bd.cost")} strongTotal={gross + empTotal} />
        </div>

        <p style={ty("caption", { color: c.inkFaint, margin: "14px 0 0", maxWidth: "80ch" })}>
          {t("rec3.bd.wages", { wages: inr(verdict.wages), pct: verdict.share.toFixed(2) + "%" })}
        </p>

        <div style={{ marginTop: 14, paddingTop: 13, borderTop: "1px solid " + c.rule, display: "flex", gap: 14, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
          <p style={ty("caption", { color: c.inkMuted, margin: 0, maxWidth: "56ch" })}>{t("rec3.bd.cannotEdit")}</p>
          <Button size="sm" kind="secondary" iconLeft="mail" onClick={onRequest}>{t("rec3.bd.request")}</Button>
        </div>
      </div>
    );
  }

  /* HR SETS THE SALARY (designer, 2026-10-15). The pay group's own
     rule does the splitting, so the only two figures anybody types
     are the salary and the grade basic -- and the parts appear under
     them before a thing is saved. */
  function ChangeRequestPanel({ staffId, onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const D = window.Pages3 && window.Pages3.PYSalData;
    const person = D ? D.staffById(staffId) : null;
    const [gross, setGross] = useState(person && person.gross ? String(person.gross) : "");
    const [basic, setBasic] = useState(person && person.basic ? String(person.basic) : "");
    const [note, setNote] = useState("");

    const g = Number(gross), bq = Number(basic);
    const numsOk = g > 0 && bq > 0;
    const overs = numsOk && bq > g;
    const ready = numsOk && !overs && note.trim().length >= 6;

    const struct = D && person ? D.structureFor(person) : null;
    const lines = struct && numsOk && !overs ? D.priceComponents(struct, bq, g) : null;

    function how(cp) {
      if (cp.calc === "grade") return t("rec3.cr.grade");
      if (cp.calc === "pct") return t("rec3.cr.pct", { n: num(cp.pct), of: t("pys3.c." + cp.of) });
      if (cp.calc === "flat") return t("rec3.cr.flat");
      return t("rec3.cr.bal");
    }

    return (
      <Dialog title={t("rec3.cr.title")} onCancel={onClose} width={640}>
        <p style={ty("small", { color: c.inkMuted, margin: "0 0 16px", maxWidth: "60ch" })}>{t("rec3.cr.body")}</p>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 220px", minWidth: 200 }}>
            <Field id="rec3-cr-gross" label={t("rec3.cr.gross")}
              error={gross && !(g > 0) ? t("rec3.cr.err") : null}>
              <Input id="rec3-cr-gross" value={gross} onChange={setGross} inputMode="numeric" />
            </Field>
          </div>
          <div style={{ flex: "1 1 220px", minWidth: 200 }}>
            <Field id="rec3-cr-basic" label={t("rec3.cr.basic")} hint={t("rec3.cr.basicHint")}
              error={overs ? t("rec3.cr.errOver") : basic && !(bq > 0) ? t("rec3.cr.err") : null}>
              <Input id="rec3-cr-basic" value={basic} onChange={setBasic} inputMode="numeric" />
            </Field>
          </div>
        </div>

        {lines ? (
          <div style={{ border: "1px solid " + c.rule, borderRadius: G3.r.md, background: c.sunken, padding: "14px 16px", marginBottom: 16 }}>
            <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 })}>{t("rec3.cr.parts")}</div>
            {lines.map(function (ln) {
              return (
                <div key={ln.code} style={{ display: "flex", justifyContent: "space-between", gap: 14, padding: "5px 0" }}>
                  <span style={ty("small", { color: c.ink, minWidth: 0 })}>
                    {t("pys3.c." + ln.code)}
                    <span style={{ color: c.inkFaint }}> · {how(ln.cp)}</span>
                  </span>
                  <span style={G3.fig("xs", { color: c.ink, fontWeight: 600, whiteSpace: "nowrap" })}>{inr(ln.v)}</span>
                </div>
              );
            })}
            <div style={{ display: "flex", justifyContent: "space-between", gap: 14, padding: "9px 0 0", marginTop: 6, borderTop: "1px solid " + c.rule }}>
              <span style={ty("small", { color: c.ink, fontWeight: 700 })}>{t("rec3.cr.total")}</span>
              <span style={G3.fig("sm", { color: c.ink, fontWeight: 700 })}>{inr(g)}</span>
            </div>
          </div>
        ) : null}

        <Field id="rec3-cr-note" label={t("rec3.cr.note")} hint={t("rec3.cr.noteHint")}>
          <Input id="rec3-cr-note" value={note} onChange={setNote} placeholder={t("rec3.cr.notePh")} />
        </Field>
        <Consequence lines={[t("rec3.cr.c1"), t("rec3.cr.c2")]} />
        <DialogFoot
          confirmLabel={t("rec3.cr.go")}
          onCancel={onClose}
          onConfirm={function () {
            if (!ready) return;
            const H = window.NaveyaPayHandoff;
            if (H && H.setSalary) {
              H.setSalary(staffId, { gross: g, basic: bq, note: note.trim(), byKey: "ph.who.meera" });
            }
            onDone(t("rec3.cr.done"));
          }}
        />
      </Dialog>
    );
  }

  /* WHERE THE RISE GOT TO. An appraisal that agreed a percentage has
     no figure on this record until payroll has set one, so this says
     whose turn it is rather than showing a blank. Once the officer
     has set the figures, the same line shows them -- which is the
     designer's "HR should see the increase in the pay with appraisal
     status once the payroll officer has updated the figure". */
  function RiseState({ appr }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const H = window.NaveyaPayHandoff;
    const handoff = H && H.useHandoff ? H.useHandoff() : null;
    const prop = handoff
      ? handoff.proposals().filter(function (x) { return x.apprId === appr.id; })[0]
      : null;
    const pct = appr.pct != null ? appr.pct : (prop ? prop.pct : 0);

    if (prop && prop.state === "settled") {
      return (
        <div>
          <div style={{ display: "flex", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}>
            <StatusMark role="present" glyph="check" word={t("rec3.ap.rs.set")} />
            <span style={ty("caption", { color: c.inkMuted })}>{inr(prop.currentGross)}</span>
            <span aria-hidden="true" style={{ color: c.inkFaint }}>&rarr;</span>
            <span style={G3.fig("sm", { color: c.ink, fontWeight: 700 })}>{inr(prop.settled.gross)}</span>
          </div>
          <p style={ty("caption", { color: c.inkMuted, margin: "6px 0 0" })}>
            {t("rec3.ap.rs.setBy", { who: t(prop.settled.byKey) })}
          </p>
        </div>
      );
    }
    if (prop && prop.state === "declined") {
      return (
        <div>
          <StatusMark role="off" glyph="signout" word={t("rec3.ap.rs.declined")} />
          <p style={ty("caption", { color: c.inkMuted, margin: "6px 0 0", maxWidth: "62ch" })}>
            {t(prop.declined.reasonKey)} &middot; {t("rec3.ap.rs.by", { who: t(prop.declined.byKey) })}
          </p>
        </div>
      );
    }
    return (
      <div>
        <div style={{ display: "flex", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}>
          <StatusMark role="late" glyph="clock" word={t("rec3.ap.rs.waiting")} />
          <span style={ty("small", { color: c.ink, fontWeight: 700 })}>{"+" + pct + "%"}</span>
        </div>
        <p style={ty("caption", { color: c.inkMuted, margin: "6px 0 0", maxWidth: "62ch" })}>{t("rec3.ap.rs.waitingWhy")}</p>
      </div>
    );
  }

  /* what an appraisal did to her pay. Masked by default like every
     other figure on this record; opening it is an event, not a hover. */
  function PayReveal({ id, open, onToggle, before, after }) {
    const ro = useRO();
    const { c } = useTheme();
    const { t, ty } = useLang();
    const rise = pctRise(before, after);
    return (
      <div style={{ display: "flex", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}>
        <span style={ty("caption", { color: c.inkFaint, fontWeight: 700 })}>{t("rec3.ap.pay")}</span>
        {open ? (
          <span style={{ display: "flex", gap: 9, alignItems: "baseline", flexWrap: "wrap" }}>
            <span style={G3.fig("sm", { color: c.inkMuted })}>{inr(before)}</span>
            <span aria-hidden="true" style={{ display: "flex", color: c.inkFaint, alignSelf: "center" }}><Icon name="arrow" size={13} /></span>
            <span style={G3.fig("sm", { color: c.ink, fontWeight: 700 })}>{inr(after)}</span>
            <span style={ty("caption", { color: rise > 0 ? c.presentText : c.inkMuted })}>{t("rec3.ap.rise", { n: String(rise) })}</span>
          </span>
        ) : (
          <span style={ty("small", { color: c.inkMuted })}>{t("rec3.ap.payHidden")}</span>
        )}
        <button
          type="button" disabled={ro} onClick={ro ? undefined : onToggle}
          aria-expanded={open ? "true" : "false"}
          title={ro ? t("rec3.ro.why") : undefined}
          style={ty("caption", { background: "none", border: "none", padding: 0, color: ro ? c.inkFaint : c.action, fontWeight: 600, cursor: ro ? "not-allowed" : "pointer", textDecoration: "underline", textUnderlineOffset: 3 })}
        >
          {t(open ? "rec3.ap.payHide" : "rec3.ap.payShow")}
        </button>
        {open ? <span style={ty("caption", { color: c.inkFaint })}>{t("rec3.ap.payLogged")}</span> : null}
      </div>
    );
  }

  /* RECORDING ONE. The appraisal happened in a room; this writes down
     what it decided. It is the one place a post and a salary move
     together, and it says so before it commits. */
  function AddAppraisalDialog({ currentPostKey, currentGross, onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [onISO, setOnISO] = useState(TODAY);
    const [moved, setMoved] = useState("no");
    const [post, setPost] = useState("");
    const [pct, setPct] = useState("");
    const [said, setSaid] = useState("");
    const [err, setErr] = useState({});

    const pctN = Number(String(pct).replace(/[^0-9.]/g, "")) || 0;
    const future = onISO > TODAY;

    function submit() {
      const e = {};
      if (moved === "yes" && post.trim().length < 3) e.post = t("rec3.ap.err.post");
      if (!(pctN > 0)) e.pct = t("rec3.ap.err.pct");
      if (said.trim().length < 8) e.said = said.trim() ? t("rec3.ap.err.saidShort") : t("rec3.ap.err.said");
      setErr(e);
      if (Object.keys(e).length) return;
      const toName = moved === "yes" ? post.trim() : t(currentPostKey);
      onDone({
        id: "AP-000" + (4 + Math.floor(Math.random() * 5)),
        onISO: onISO, byKey: "rec3.who.anjali",
        fromKey: currentPostKey, toKey: currentPostKey, toName: toName,
        toText: moved === "yes" ? post.trim() : null,
        movedPost: moved === "yes",
        grossBefore: currentGross, grossAfter: null, pct: pctN,
        saidText: said.trim(),
      });
    }

    return (
      <Dialog title={t("rec3.ap.add")} onCancel={onClose} width={620}>
        <p style={ty("small", { color: c.inkMuted, margin: "0 0 16px" })}>{t("rec3.ap.addBody")}</p>

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <div style={{ width: 210 }}>
            <Field id="rec3-ap-on" label={t("rec3.ap.f.on")}>
              <Input id="rec3-ap-on" type="date" value={onISO} onChange={setOnISO} />
            </Field>
          </div>
        </div>
        {future ? <Warn>{t("rec3.ap.futureWarn")}</Warn> : null}

        <div style={{ marginTop: 14 }}>
          <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 7 })}>{t("rec3.ap.f.moved")}</div>
          <ChoiceGroup
            ariaLabel={t("rec3.ap.f.moved")}
            value={moved} onChange={(v) => { setMoved(v); setErr((x) => Object.assign({}, x, { post: null })); }}
            items={[
              { key: "no", label: t("rec3.ap.f.movedNo", { post: t(currentPostKey) }) },
              { key: "yes", label: t("rec3.ap.f.movedYes") },
            ]}
          />
        </div>

        {moved === "yes" ? (
          <div style={{ marginTop: 12 }}>
            <Field id="rec3-ap-post" label={t("rec3.ap.f.post")} hint={t("rec3.ap.f.postHint", { post: t(currentPostKey) })} error={err.post || null}>
              <Input id="rec3-ap-post" value={post} onChange={(v) => { setPost(v); setErr((x) => Object.assign({}, x, { post: null })); }} placeholder={t("rec3.ap.f.postPh")} invalid={!!err.post} />
            </Field>
          </div>
        ) : null}

        {/* THE FIGURE IS NOT HR'S (designer, 2026-10-07). This was a
            rupee input that wrote a new salary straight onto the
            record. An appraisal agrees a PERCENTAGE -- a judgement
            about a person, which is this room's work -- and payroll
            turns it into components. What that percentage comes to is
            shown, because HR should know the size of what it is
            asking for, but it is labelled as arithmetic and not as a
            decision. */}
        <div style={{ marginTop: 14, width: 260 }}>
          <Field id="rec3-ap-pct" label={t("rec3.ap.f.pct")} hint={t("rec3.ap.f.pctHint")} error={err.pct || null}>
            <Input id="rec3-ap-pct" value={pct} inputMode="decimal" onChange={(v) => { setPct(v); setErr((x) => Object.assign({}, x, { pct: null })); }} invalid={!!err.pct} />
          </Field>
        </div>
        {pctN > 0 ? (
          <div style={{ marginTop: 10, padding: "12px 14px", background: c.sunken, borderRadius: G3.r.md, maxWidth: 520 }}>
            <div style={{ display: "flex", gap: 14, alignItems: "baseline", flexWrap: "wrap" }}>
              <span style={ty("caption", { color: c.inkMuted })}>{inr(currentGross)}</span>
              <span style={ty("small", { color: c.ink, fontWeight: 700 })}>{"+" + pctN + "%"}</span>
              <span aria-hidden="true" style={{ color: c.inkFaint }}>&rarr;</span>
              <span style={ty("small", { color: c.ink, fontWeight: 700 })}>{inr(Math.round(currentGross * (1 + pctN / 100)))}</span>
            </div>
            <p style={ty("caption", { color: c.inkMuted, margin: "6px 0 0" })}>{t("rec3.ap.f.pctNote")}</p>
          </div>
        ) : null}

        <div style={{ marginTop: 16 }}>
          <Field id="rec3-ap-said" label={t("rec3.ap.f.said")} hint={t("rec3.ap.f.saidHint")} error={err.said || null}>
            <Input id="rec3-ap-said" value={said} onChange={(v) => { setSaid(v); setErr((x) => Object.assign({}, x, { said: null })); }} placeholder={t("rec3.ap.f.saidPh")} invalid={!!err.said} />
          </Field>
        </div>

        <Consequence lines={[
          moved === "yes" && post.trim() ? t("rec3.ap.c.post", { post: post.trim() }) : t("rec3.ap.c.postSame"),
          t("rec3.ap.c.toPayroll"),
          t("rec3.ap.c.append"),
        ]} />
        <p style={ty("caption", { color: c.inkFaint, margin: 0 })}>{t("rec3.dlg.audit")}</p>
        <DialogFoot confirmLabel={t("rec3.ap.f.submit")} onCancel={onClose} onConfirm={submit} />
      </Dialog>
    );
  }

  /* ============================================================
     HR-03e · PAID DAYS — the counter question, answered for one
     person. Payroll's PY-08 answers it for 412 and prices nothing;
     this answers it for HER and prices nothing either. Rule 4 of this
     file holds: no money is rendered, and the absence is stated.

     Every day, count and total below is DERIVED from real Date
     objects, so the arithmetic on screen is the arithmetic in the
     code — a hand-typed "31" is a figure that can go stale.
     ============================================================ */
  const PD_ROLE = { P: "present", L: "leave", H: "holiday", W: "off", X: "absent", N: "missing" };

  /* her months. leave and lop are day numbers; the rest is computed. */
  const PD_MONTHS = [
    { y: 2026, m: 7, monKey: "rec3.mon.08", leave: [10], lop: [], hol: { 15: true },
      state: "frozen", run: "PR-2026-08", at: "2026-08-08" },
    { y: 2026, m: 6, monKey: "rec3.mon.07", leave: [], lop: [], hol: {},
      state: "paid", at: "2026-07-31" },
    { y: 2026, m: 5, monKey: "rec3.mon.06", leave: [22, 23], lop: [29], hol: {},
      state: "paid", at: "2026-06-30" },
  ];

  function pdBuild(mo) {
    const total = new Date(mo.y, mo.m + 1, 0).getDate();
    const codes = [];
    const counts = { P: 0, L: 0, H: 0, W: 0, X: 0, N: 0 };
    for (let d = 1; d <= total; d++) {
      const dt = new Date(mo.y, mo.m, d);
      let code = "P";
      if (mo.hol[d]) code = "H";
      else if (dt.getDay() === 0) code = "W";
      else if (mo.leave.indexOf(d) !== -1) code = "L";
      else if (mo.lop.indexOf(d) !== -1) code = "X";
      codes.push({ d: d, code: code, wd: dt.getDay() });
      counts[code] += 1;
    }
    const inService = total - counts.N;
    return { codes: codes, counts: counts, inService: inService, paid: inService - counts.X };
  }

  function PDGrid({ built, monKey }) {
    const { c } = useTheme();
    const { t } = useLang();
    const cells = [];
    for (let i = 0; i < built.codes[0].wd; i++) cells.push(<span key={"b" + i} aria-hidden="true" />);
    built.codes.forEach((d) => {
      const role = PD_ROLE[d.code];
      cells.push(
        <span
          key={d.d}
          title={num(d.d) + " \u00b7 " + t("rec3.pd.name." + d.code)}
          style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            width: 40, height: 42, borderRadius: G3.r.sm,
            background: c[role + "Tint"], color: c[role + "Text"],
          }}
        >
          <span style={G3.fig("micro", { opacity: 0.8 })}>{num(d.d)}</span>
          <span style={G3.fig("xs", { fontWeight: 700, marginTop: 1 })}>{t("rec3.pd.code." + d.code)}</span>
        </span>
      );
    });
    const heads = [0, 1, 2, 3, 4, 5, 6].map((w) => (
      <span key={"h" + w} aria-hidden="true" style={G3.fig("micro", { color: c.inkFaint, textAlign: "center", fontWeight: 700, paddingBottom: 2 })}>
        {t("rec3.pd.wd." + w)}
      </span>
    ));
    return (
      <div role="img" aria-label={t("rec3.pd.gridAria", { mon: t(monKey) })} style={{ display: "grid", gridTemplateColumns: "repeat(7, 40px)", gap: 5 }}>
        {heads.concat(cells)}
      </div>
    );
  }

  function PaidDaysFacet({ onNavigate }) {
    const ro = useRO();
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [idx, setIdx] = useState(0);
    const mo = PD_MONTHS[idx];
    const b = pdBuild(mo);
    const cn = b.counts;

    /* P L H W always; X only names itself differently at nil, because
       "0 loss of pay" is the one count worth reading when it is nil */
    const rows = [
      { code: "P", n: cn.P, key: "rec3.pd.src.P" },
      { code: "L", n: cn.L, key: "rec3.pd.src.L" },
      { code: "H", n: cn.H, key: "rec3.pd.src.H" },
      { code: "W", n: cn.W, key: "rec3.pd.src.W" },
      { code: "X", n: cn.X, key: cn.X ? "rec3.pd.src.X" : "rec3.pd.src.Xnone" },
    ];

    return (
      <div>
        {/* which month — three, named, no date picker to fill in */}
        <div role="group" aria-label={t("rec3.pd.monthAria")} style={{ display: "flex", gap: 6, background: c.sunken, borderRadius: G3.r.pill, padding: 3, width: "fit-content", marginBottom: G3.layout.gap }}>
          {PD_MONTHS.map((m, i) => (
            <button
              key={m.monKey} type="button" aria-pressed={i === idx ? "true" : "false"}
              onClick={() => setIdx(i)}
              style={ty("small", {
                border: "none", borderRadius: G3.r.pill, padding: "7px 16px", cursor: "pointer",
                background: i === idx ? c.surface : "transparent",
                color: i === idx ? c.ink : c.inkMuted, fontWeight: i === idx ? 700 : 600,
              })}
            >
              {t(m.monKey)} {String(m.y)}
            </button>
          ))}
        </div>

        <Card
          icon="attendance" iconTone="accent" title={t("rec3.pd.title")} sub={t(mo.monKey) + " " + String(mo.y)}
          action={
            mo.state === "frozen" || mo.state === "open"
              ? <Button disabled={ro} kind="secondary" size="sm" iconLeft="attendance" onClick={() => onNavigate && onNavigate("hrAttendance")}>{t("rec3.pd.fixGo")}</Button>
              : null
          }
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
            <Figure value={num(b.paid)} size={34} weight={700} color={c.ink} align="left" />
            <span style={ty("small", { color: c.inkMuted })}>{t("rec3.pd.of", { n: num(b.inService) })}</span>
          </div>

          <div style={{ marginTop: 10 }}>
            {mo.state === "frozen"
              ? <StatusMark role="off" glyph="lock" word={t("rec3.pd.frozen", { run: mo.run, d: fmt(t, mo.at) })} />
              : mo.state === "paid"
                ? <StatusMark role="present" glyph="check" word={t("rec3.pd.paidOn", { d: fmt(t, mo.at) })} />
                : <StatusMark role="late" glyph="clock" word={t("rec3.pd.open")} />}
            <p style={ty("caption", { color: c.inkMuted, margin: "7px 0 0", maxWidth: 620 })}>
              {t(mo.state === "frozen" ? "rec3.pd.frozenNote" : mo.state === "paid" ? "rec3.pd.paidNote" : "rec3.pd.openNote")}
            </p>
          </div>

          <div style={{ display: "flex", gap: 30, alignItems: "flex-start", flexWrap: "wrap", marginTop: 22 }}>
            <PDGrid built={b} monKey={mo.monKey} />

            <div style={{ flex: 1, minWidth: 300 }}>
              <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 })}>
                {t("rec3.pd.make")}
              </div>
              {rows.map((r, i) => (
                <div key={r.code} style={{ display: "flex", gap: 11, alignItems: "center", padding: "8px 0", borderBottom: i === rows.length - 1 ? "none" : "1px solid " + c.rule }}>
                  <span
                    aria-hidden="true"
                    style={G3.fig("xs", {
                      width: 26, height: 22, borderRadius: G3.r.xs, flexShrink: 0, fontWeight: 700,
                      background: c[PD_ROLE[r.code] + "Tint"], color: c[PD_ROLE[r.code] + "Text"],
                      display: "flex", alignItems: "center", justifyContent: "center",
                    })}
                  >
                    {t("rec3.pd.code." + r.code)}
                  </span>
                  <span style={ty("small", { color: c.inkMuted, flex: 1, minWidth: 0 })}>{t(r.key)}</span>
                  <Figure value={num(r.n)} size="sm" weight={700} color={r.n === 0 ? c.inkFaint : c.ink} />
                </div>
              ))}
              <p style={ty("small", { color: c.ink, margin: "14px 0 0", fontWeight: 600 })}>
                {t("rec3.pd.arith", { P: num(cn.P), L: num(cn.L), H: num(cn.H), W: num(cn.W), X: num(cn.X), paid: num(b.paid) })}
              </p>
            </div>
          </div>

          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid " + c.border }}>
            <p style={ty("caption", { color: c.inkMuted, margin: 0, maxWidth: 720 })}>{t("rec3.pd.noMoney")}</p>
            <p style={ty("caption", { color: c.inkMuted, margin: "7px 0 0", maxWidth: 720 })}>{t("rec3.pd.fixWhere")}</p>
          </div>
        </Card>
      </div>
    );
  }

  /* ============================================================
     FINANCE — what she is on, what it is made of, how it moved, and
     what this month pays for.

     Four questions about one subject that were filed in three places:
     two cards at the bottom of PERSONAL (under her emergency contact)
     and a tab of its own at the far end of the bar. Pay is not a
     personal detail; it is a contract, which is why this sits next to
     CONTRACT.
     ============================================================ */
  function FinanceFacet({ subjectId, onNavigate }) {
    const ro = useRO();
    const { c } = useTheme();
    const { t, ty } = useLang();
    const L = G3.layout;
    /* is payroll still holding this person's figure? Read here rather
       than passed down, so the card re-draws the moment the payroll
       officer assigns on their own screen. */
    const H = window.NaveyaPayHandoff;
    const handoff = H && H.useHandoff ? H.useHandoff() : null;
    const payHand = handoff ? handoff.forId(subjectId || P.code) : null;
    const openChanges = handoff ? handoff.changesFor(subjectId || P.code).filter(function (x) { return !x.answered; }) : [];
    const [dlg, setDlg] = useState(null);
    const [done, setDone] = useState(null);
    /* pay is PII: the timeline opens on a deliberate act, not on load */
    const [tlOpen, setTlOpen] = useState(false);

    if (payHand && !payHand.assigned) {
      return (
        <div>
          <PendingPayCard
            hand={payHand}
            onRemind={function () {
              const Hh = window.NaveyaPayHandoff;
              if (Hh) Hh.remind(payHand.id, "ph.who.meera");
            }}
          />
          <div style={{ marginTop: L.gap }}>
            <PaidDaysFacet onNavigate={onNavigate} />
          </div>
        </div>
      );
    }

    /* THE FIVE FACTS, plus the year. A monthly figure is what payroll
       runs on and an annual one is what everybody negotiates in, so
       the record carries both rather than making a reader multiply. */
    const facts = [
      { k: "gross", label: t("rec3.p.pay.gross"), value: ro ? t("rec3.ro.pay") : inr(P.pay.grossMonthly), mono: !ro,
        note: ro ? t("rec3.ro.payNote") : t("rec3.p.pay.grossNote", { date: fmt(t, P.pay.contractFrom) }) },
      { k: "annual", label: t("rec3.fn.annual"), value: ro ? t("rec3.ro.pay") : inr(P.pay.grossMonthly * 12), mono: !ro,
        note: t("rec3.fn.annualNote") },
      { k: "group", label: t("rec3.p.pay.group"), value: t(P.pay.groupKey) },
      { k: "cycle", label: t("rec3.p.pay.cycle"), value: t(P.pay.cycleKey) },
      { k: "acct", label: t("rec3.p.pay.account"), value: P.pay.accountMasked, mono: true },
      { k: "last", label: t("rec3.p.pay.last"), value: t(P.pay.lastCreditedKey) },
    ];

    return (
      <div>
        <Card
          icon="payslip" iconTone="brass"
          title={t("rec3.fn.now.title")} sub={t("rec3.fn.now.sub")}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "16px 0", marginTop: 4 }}>
            {facts.map(function (f, i) {
              return (
                <div key={f.k} style={{
                  minWidth: 0, padding: i ? "0 20px" : "0 20px 0 0",
                  borderInlineStart: i ? "1px solid " + c.rule : "none",
                }}>
                  <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 5 })}>{f.label}</div>
                  {f.mono
                    ? <span style={G3.fig("sm", { color: c.ink, fontWeight: 700 })}>{f.value}</span>
                    : <span style={ty("small", { color: c.ink, fontWeight: 600 })}>{f.value}</span>}
                  {f.note ? <div style={ty("caption", { color: c.inkFaint, marginTop: 4 })}>{f.note}</div> : null}
                </div>
              );
            })}
          </div>

          <PayBreakdownRO staffId={subjectId || P.code} onRequest={function () { setDone(null); setDlg("change"); }} />

          <p style={ty("caption", { margin: "16px 0 0", paddingTop: 12, borderTop: "1px solid " + c.rule, color: c.inkFaint })}>{t("rec3.p.pay.note")}</p>

          {openChanges.length ? (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid " + c.rule }}>
              <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 })}>{t("rec3.cr.openHead")}</div>
              {openChanges.map(function (x) {
                return (
                  <div key={x.id} style={{ padding: "7px 0", borderTop: "1px solid " + c.rule }}>
                    <div style={ty("small", { color: c.ink, fontWeight: 600 })}>{t(x.topicKey)}</div>
                    <div style={ty("caption", { color: c.inkMuted, marginTop: 2 })}>{x.note}</div>
                    <div style={ty("caption", { color: c.inkFaint, marginTop: 2 })}>{t("rec3.cr.openBy", { who: t(x.byKey) })}</div>
                  </div>
                );
              })}
            </div>
          ) : null}
          {done === "change" ? <DoneLine word={t("rec3.cr.done")} /> : null}
        </Card>

        {/* HOW IT MOVED, down a rail. A pay history drawn as three
            columns says when and how much, and nothing about the size
            of a step — which is the one thing anybody opens it for. */}
        <Card
          icon="payroll" iconTone="brass"
          title={t("rec3.fn.tl.title")} sub={t("rec3.fn.tl.sub")}
          style={{ marginTop: L.gap }}
          action={
            <Button disabled={ro} kind="primary" size="sm" iconLeft={tlOpen ? "lock" : "scan"} onClick={function () { setTlOpen(!tlOpen); }}>
              {t(tlOpen ? "rec3.fn.tl.hide" : "rec3.fn.tl.show")}
            </Button>
          }
        >
          {!tlOpen ? (
            <p style={ty("small", { color: c.inkMuted, margin: 0, maxWidth: 620 })}>{t("rec3.fn.tl.hidden")}</p>
          ) : (
            <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {PAY_HISTORY.map(function (h, i) {
                const prev = PAY_HISTORY[i + 1] || null;
                const rise = prev ? h.gross - prev.gross : 0;
                const pct = prev ? Math.round((rise / prev.gross) * 1000) / 10 : 0;
                const first = i === 0;
                const last = i === PAY_HISTORY.length - 1;
                return (
                  <li key={h.fromISO} style={{ display: "flex", gap: 16, alignItems: "stretch" }}>
                    {/* the rail: a dot per decision, a line between them */}
                    <span aria-hidden="true" style={{ width: 14, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <span style={{
                        width: 13, height: 13, borderRadius: "50%", marginTop: 5, flexShrink: 0,
                        border: "2.5px solid " + (first ? c.chartGreen : c.border),
                        background: c.surface,
                      }} />
                      {last ? null : <span style={{ flex: 1, width: 2, background: c.rule, marginTop: 3 }} />}
                    </span>
                    <span style={{ flex: 1, minWidth: 0, paddingBottom: last ? 0 : 22 }}>
                      <span style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                        <span style={ty("small", { color: c.ink, fontWeight: 700 })}>
                          {t(prev ? "rec3.fn.tl.revision" : "rec3.fn.tl.appointed")}
                        </span>
                        <span style={ty("caption", { color: c.inkMuted })}>{t("rec3.fn.tl.effective", { d: fmt(t, h.fromISO) })}</span>
                        {first ? <StatusMark role="present" glyph="check" word={t("rec3.fn.tl.current")} /> : null}
                      </span>
                      <span style={{
                        display: "flex", gap: 28, flexWrap: "wrap", marginTop: 9,
                        border: "1px solid " + c.rule, borderRadius: G3.r.md, padding: "11px 16px",
                      }}>
                        <span style={{ minWidth: 0 }}>
                          <span style={ty("caption", { color: c.inkFaint, fontWeight: 700, display: "block", marginBottom: 2 })}>{t("rec3.fn.tl.monthly")}</span>
                          <span style={G3.fig("sm", { color: c.ink, fontWeight: 700 })}>{inr(h.gross)}</span>
                        </span>
                        <span style={{ minWidth: 0 }}>
                          <span style={ty("caption", { color: c.inkFaint, fontWeight: 700, display: "block", marginBottom: 2 })}>{t("rec3.fn.tl.year")}</span>
                          <span style={G3.fig("sm", { color: c.inkMuted, fontWeight: 600 })}>{inr(h.gross * 12)}</span>
                        </span>
                        {prev ? (
                          <span style={{ minWidth: 0, flex: "1 1 220px" }}>
                            <span style={ty("caption", { color: c.inkFaint, fontWeight: 700, display: "block", marginBottom: 2 })}>{t("rec3.fn.tl.step")}</span>
                            <span style={ty("small", { color: c.chartGreen, fontWeight: 600 })}>
                              {t("rec3.fn.tl.from", { amt: inr(rise), was: inr(prev.gross), pct: String(pct) + "%" })}
                            </span>
                          </span>
                        ) : null}
                      </span>
                      <span style={ty("caption", { color: c.inkMuted, display: "block", marginTop: 7 })}>
                        {h.apprId ? t("rec3.fn.tl.why", { id: h.apprId }) : t("rec3.fn.tl.whyNone")}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
          <p style={ty("caption", { margin: "16px 0 0", paddingTop: 12, borderTop: "1px solid " + c.rule, color: c.inkFaint })}>{t("rec3.fn.tl.foot")}</p>
        </Card>

        {/* AND WHAT THIS MONTH ACTUALLY PAYS FOR. A contracted figure
            is not what lands: the days are. */}
        <div style={{ marginTop: L.gap }}>
          <h3 style={ty("h3", { margin: "0 0 12px", color: c.ink })}>{t("rec3.fn.pd.head")}</h3>
          <PaidDaysFacet onNavigate={onNavigate} />
        </div>

        {dlg === "change" ? (
          <ChangeRequestPanel
            staffId={subjectId || P.code}
            onClose={function () { setDlg(null); }}
            onDone={function () { setDlg(null); setDone("change"); }}
          />
        ) : null}
      </div>
    );
  }

  /* ============================================================
     PAGE — the shell that holds the five facets.

     The record is a DETAIL reached from the staff register, not a
     destination of its own, so the rail highlights the REGISTER's
     slot (alfred's rule: a large share of screens are tasks and
     details, and those must never become nav items).

     Only the active facet is mounted. That is what makes "leaving a
     tab re-masks whatever was open" structural rather than a promise,
     and it is why no tab panel exists for an inactive tab — the kit's
     Tabs points aria-controls only at the panel actually in the
     document, so there is never a dangling reference.
     ============================================================ */
  /* ============================================================
     PAY, WHILE PAYROLL STILL HAS IT.

     HR no longer types a salary (see pages/hr-add.jsx): it creates
     the person, picks the pay group and hands them over. Between
     that moment and the payroll officer pricing them there is a real
     gap, and a record that simply showed an empty "Contracted monthly
     gross" during it would read as a data-entry failure rather than
     as somebody else's turn.

     So the card states the turn. It names who is holding it, when
     they were sent, and -- because HR will be asked by the employee
     long before payroll finishes -- gives HR the one control it
     legitimately has: a reminder, which is RECORDED rather than sent,
     so neither desk can later claim it was never asked.
     ============================================================ */
  function PendingPayCard({ hand, onRemind }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const L = G3.layout;
    const n = hand.reminders.length;
    const last = n ? hand.reminders[n - 1] : null;
    /* rec3.mon.* is keyed on the ZERO-PADDED month, so this goes
       through the file's own ISO formatter rather than inventing a
       second date path that would render a raw key for Jan-Sep. */
    const fmtd = function (d) {
      if (!d) return "";
      const two = function (n) { return (n < 10 ? "0" : "") + n; };
      return fmt(t, d.y + "-" + two(d.m) + "-" + two(d.d));
    };
    return (
      <Card
        icon="clock" iconTone="brass"
        title={t("rec3.pp.title")} sub={t("rec3.pp.sub")}
        style={{ marginTop: L.gap }}
      >
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div style={{ flex: "1 1 320px", minWidth: 260 }}>
            <StatusMark role="late" glyph="clock" word={t("rec3.pp.state")} />
            <p style={ty("small", { color: c.ink, margin: "10px 0 0", maxWidth: "58ch" })}>
              {t("rec3.pp.body", { who: t("rec3.pp.officer"), on: fmtd(hand.createdOn) })}
            </p>
            <p style={ty("caption", { color: c.inkMuted, margin: "7px 0 0", maxWidth: "58ch" })}>
              {t("rec3.pp.why")}
            </p>
          </div>
          <div style={{ flex: "0 1 300px", minWidth: 240 }}>
            <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" })}>{t("rec3.pp.groupLabel")}</div>
            <div style={ty("small", { color: c.ink, fontWeight: 600, marginTop: 3 })}>{t("rec3.pp.group")}</div>
            <div style={{ marginTop: 14 }}>
              <Button size="sm" iconLeft="mail" onClick={onRemind}>{t("rec3.pp.remind")}</Button>
              <p style={ty("caption", { color: c.inkMuted, margin: "7px 0 0" })}>
                {n === 0 ? t("rec3.pp.remindNone")
                  : n === 1 ? t("rec3.pp.remind1", { on: fmtd(last.on) })
                    : t("rec3.pp.remindN", { n: num(n), on: fmtd(last.on) })}
              </p>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  function HRRecord({ role, onNavigate, readOnly, back, railActive, railInitials, crumb }) {
    const { c } = useTheme();
    const { t, ty, lang } = useLang();
    const L = G3.layout;

    /* PY-08 sends a reader here to see ONE person's paid days, and
       the canvas router carries a screen key and nothing else. So the
       facet to open is handed over on window and consumed once, here,
       on mount — never read again, so a later visit opens on Personal
       like any other. ?tab=paid does the same thing from a URL. */
    const [tab, setTab] = useState(function () {
      const handed = window.Pages3 && window.Pages3.recordTab;
      if (handed) { window.Pages3.recordTab = null; return handed; }
      try {
        const q = new URLSearchParams(window.location.search).get("tab");
        if (q) return q;
      } catch (e) { /* a canvas opened from a file:// URL has no search */ }
      return "personal";
    });
    /* which person's handoff this record is showing. A record opened
       straight from the rail is Ananya's, and she was priced long
       ago, so this is null and the pay card is the ordinary one. */
    const [handedId] = useState(function () {
      const h = window.Pages3 && window.Pages3.hrRecordId;
      if (h) { window.Pages3.hrRecordId = null; return h; }
      /* ?rec=NAV-0431 opens the record of the joiner payroll has not
         priced yet, the same way ?tab= opens a facet. The canvas has
         one full record, so this is how the pending pay state is
         inspected without inventing a second person's whole file. */
      try {
        const q = new URLSearchParams(window.location.search).get("rec");
        if (q) return q;
      } catch (e) { /* file:// has no search */ }
      return null;
    });
    const [reqs, setReqs] = useState(REQUESTS);
    const [opened, setOpened] = useState({});
    const [medicalOnRecord, setMedicalOnRecord] = useState(false);
    const [revealLog, setRevealLog] = useState([]);
    const [raiseOnOpen, setRaiseOnOpen] = useState(false);

    /* append-only, and with no clearing control, on purpose */
    function pushReveal(label) {
      setRevealLog(function (cur) { return [{ id: "rv" + cur.length, label: label }].concat(cur); });
    }

    const tabs = [
      { key: "personal", label: t("rec3.tab.personal") },
      { key: "contract", label: t("rec3.tab.contract") },
      /* pay is a contract, not a personal detail, so it sits beside one */
      { key: "finance", label: t("rec3.tab.finance") },
      { key: "service", label: t("rec3.tab.service") },
      { key: "appraisal", label: t("rec3.tab.appraisal") },
      { key: "docs", label: t("rec3.tab.docs") },
    ];

    const questions = { personal: "rec3.p.q", contract: "rec3.c.q", finance: "rec3.fn.q", service: "rec3.s.q", appraisal: "rec3.ap.q", docs: "rec3.d.q" };

    function goDocs(raise) {
      setRaiseOnOpen(!!raise);
      setTab("docs");
    }

    return (
      <RecordMode.Provider value={!!readOnly}>
      <div
        className="nv3"
        style={{ display: "flex", minHeight: "100vh", background: c.page, color: c.ink, fontFamily: G3.font.ui }}
      >
        <Rail role={role || "hr"} active={railActive || "hrStaff"} onNavigate={onNavigate} initials={railInitials || t("rec3.rail.initials")} />

        {/* the motif is drawn past the right edge on purpose; without
            overflowX clip the document picks up a sideways scrollbar
            that a full-page screenshot would never show */}
        <main style={{ flex: 1, minWidth: 0, position: "relative", overflowX: "clip" }}>
          <Motif />
          <div style={{ position: "relative", zIndex: 1, maxWidth: L.contentMax, margin: "0 auto", padding: "22px " + L.contentPadX + "px 56px" }}>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, marginBottom: 14 }}>
              <div style={ty("small", { color: c.inkMuted })}>
                <span style={{ color: c.ink, fontWeight: 700 }}>{crumb ? crumb.label : t("nav.hrStaff")}</span>
                <span style={{ margin: "0 8px", color: c.inkFaint }}>·</span>
                <span>{t("rec3.crumb.here")}</span>
                <span style={{ margin: "0 8px", color: c.inkFaint }}>·</span>
                <span>{crumb ? crumb.where : t("home.school")}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <ThemeToggle />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              {back
                ? <BackBar label={back.label} onBack={back.onBack} />
                : <LinkButton onClick={() => onNavigate && onNavigate("hrStaff")}>{t("rec3.crumb.back")}</LinkButton>}
            </div>

            <IdentityHeader onNavigate={onNavigate} />

            {readOnly ? <div style={{ marginTop: L.gap }}><ReadOnlyBand /></div> : null}

            <div style={{ marginTop: L.gap }}>
              <AlertsBand
                reqs={reqs} medicalOnRecord={medicalOnRecord}
                onGoDocs={() => goDocs(false)} onRaise={() => goDocs(true)}
              />
            </div>

            <div style={{ marginTop: 26 }}>
              <Tabs items={tabs} active={tab} onChange={setTab} ariaLabel={t("rec3.tabsAria")} idBase="rec3" />

              <TabPanel idBase="rec3" tabKey={tab}>
                {tab === "personal" ? (
                  <PersonalFacet onReveal={pushReveal} onGoDocs={() => goDocs(true)} subjectId={handedId} />
                ) : null}
                {tab === "contract" ? <ContractFacet /> : null}
                {tab === "finance" ? <FinanceFacet subjectId={handedId} onNavigate={onNavigate} /> : null}
                {tab === "service" ? <ServiceFacet /> : null}
                {tab === "appraisal" ? <AppraisalFacet /> : null}
                {tab === "docs" ? (
                  <DocumentsFacet
                    reqs={reqs} setReqs={setReqs}
                    opened={opened} setOpened={setOpened}
                    medicalOnRecord={medicalOnRecord} setMedicalOnRecord={setMedicalOnRecord}
                    openRaise={raiseOnOpen} onRaiseConsumed={() => setRaiseOnOpen(false)}
                  />
                ) : null}
              </TabPanel>
            </div>
          </div>
        </main>
      </div>
      </RecordMode.Provider>
    );
  }

  window.Pages3 = window.Pages3 || {};
  window.Pages3.HRRecord = HRRecord;
})();
