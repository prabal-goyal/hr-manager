/* @jsxRuntime classic */
/* ============================================================
   Naveya — Payroll Operator · window.Pages3.PYSalary

   FIVE SCREENS, ONE FILE, ONE DATASET — the section that DEFINES
   what people are paid. Every payroll screen downstream (PY-07 run
   console, PY-08 paid days, AC-01/02/03) consumes the result.
   · PY-02 Pay groups                — "what pay logics do we operate?"
   · PY-03 Salary structure editor   — "what is this salary made of?"
   · PY-04 Honorarium rules          — "how do we pay guest faculty?"
   · PY-05 Employee salary/revisions — "what does this person earn,
                                        from when?"
   · PY-06 Proposed revisions queue  — "which appraisal recommendations
                                        are waiting to become money?"

   SPEC — docs/screen-inventory.md PY-02 / PY-03 / PY-04 / PY-05 /
   PY-06, each action table built in full, honouring offered /
   disabled-with-reason / absent, against
   docs/development-specification.md:
     M10 §Purpose        — multiple pay logics in ONE entity run
     M10 §Business rules — excluded allowances <= 50% of wages
                           (Labour Code); effective-dated salary;
                           per-lecture honorarium with a monthly cap
     M10 §Acceptance     — "excluded allowances > 50% is rejected at
                           structure save"; a CTC teacher and a
                           per-lecture guest paid correctly in one pass
     M10 §Arrears        — a back-dated revision splits by affected
                           month, each recomputing on THAT month's
                           originally pinned StatutoryConfig; posting
                           needs a distinct checker; append-only
     M10 §Permissions    — payroll.run (maker) / payroll.approve
                           (checker); a maker never approves their own
     M11 / §4.4          — StatutoryConfig is immutable + versioned
     M17 §Business rules — an appraisal increment/promotion is
                           ADVISORY: it reaches payroll as a PROPOSED
                           revision, is never auto-applied, and still
                           passes payroll maker-checker
     M3  §6.3            — EmploymentContract carries pay_group_id and
                           the grade basic a structure's formula reads
     §4.2 / §4.3         — append-only audit; supersede, never edit
     §6.9                — PayGroup.kind, SalaryStructure, PayComponent
                           (calc_type flat/percent/formula, taxable,
                           pf_applicable, esi_applicable), EmployeeSalary
                           (effective_from; revisions add rows),
                           HonorariumRule (unit, rate, monthly_cap),
                           ArrearAdjustment.source
   docs/ui-compliance-requirements.md: O5 (a distinct PERSON, not a
   session), O6 (append-only, attribution where the decision is read),
   O9 (no rate/ceiling/slab as a literal; every statutory figure
   carries the version it was read from), O18 (effective-dating IS the
   interaction model — Revise, never Edit), A47 (a revision that
   back-dates into a paid period becomes an arrears posting, which is
   maker-checker), A48 (config is published, never edited).

   WHAT THIS FILE DELIBERATELY REFUSES
   · No DELETE. Anywhere. A structure is retired, a rate is
     superseded, a revision is superseded — the old row stays and says
     what replaced it.
   · No EDIT on anything effective-dated. The verb is Revise, and it
     always asks "from when".
   · No statutory rate, percentage, ceiling or slab authored as copy.
     Statutory figures are AMOUNTS the engine returned, printed beside
     the config version they were read from. The one percentage that
     IS on these screens — the Labour Code excluded-allowance limit —
     is read from the pinned config object with its version, its
     effective date and its publisher, exactly the way pages/
     payroll.jsx renders its variance gate. It is never typed inside a
     translated sentence.
   · No approval control. This is the MAKER's seat: Sunita Kulkarni
     prepares, Rajiv Menon approves. Approve is ABSENT here for two
     independently sufficient reasons, both printed.
   · No silent edit of a locked period. April to July are paid; August
     is with the checker. Anything that would change pay in one of
     those months is refused, by name, with the route that does work.
   · No PAN, no Aadhaar, no UAN. No full bank account — payroll does
     not get a better view of an account than the teacher does.
   · No re-typed money. Every total is summed from its parts at render
     time, in both languages and both themes.

   CROSS-SCREEN ARITHMETIC (a figure that disagrees across screens
   destroys trust in all of them):
   · Ananya Rao NAV-0142 earns a monthly gross of 94,800.00, and her
     components are pages/payslips.jsx's July payslip to the rupee:
     BASIC 39,500 · DA 7,900 · HRA 19,750 · SPL 21,120 · ACAD 6,530.
     This screen does not author those five numbers — it authors the
     RULES that produce them, and the rules are checked against her
     payslip in code.
   · An unpaid day prices at gross / 30 = 3,160.00, the divisor
     pages/attendance.jsx, pages/leave.jsx and pages/payroll.jsx use.
   · Pay groups, headcounts and component codes are pages/payroll.jsx's
     run: Teaching 268 + Administration and support 121 + Visiting
     faculty 23 = 412. LWF is 20.00 per head per month there, and it
     is 20.00 here.
   · Maker Sunita Kulkarni NAV-0031 (payroll.run) and checker Rajiv
     Menon NAV-0009 (payroll.approve), as on pages/payroll.jsx and
     pages/payslips.jsx. Config v2026.2 from 1 April, v2026.3 from
     1 July (pinned to PR-2026-08), v2026.4 from 1 September.
   · Joseph Mathew's promotion is the revision pages/payroll.jsx's
     variance register explains as "salary revision".

   Composed only from window.G3 / window.UI3. Nothing outside this
   file is edited; primitives the kit lacks are defined locally and
   listed as promotion candidates at the foot of the file.
   ============================================================ */
(function () {
  const G3 = window.G3;
  const UI = window.UI3;
  const { useState } = React;
  const {
    useTheme, ThemeToggle, useLang, addStrings,
    Rail, Motif, Card, ColorCard, Register, Button, LinkButton, Chip, StatusMark, Seal,
    Figure, Icon, EmptyState, Select, Input, Field, Tabs, TabPanel,
    ActionMenu, inr, num,
  } = UI;

  /* ============================================================
     STRINGS — pys.* (shared), pys2..pys6.* (one per screen).
     English and Hindi are authored key-for-key; the verification pass
     asserts exact parity rather than trusting it. Demo content is
     translated too: a mock row that stays English in a Hindi UI is a
     leak, not a placeholder.
     ============================================================ */
  addStrings({
    en: {
      /* ---------- shared ---------- */
      "pys.title": "Salary structure",
      "pys.entity": "Sunrise Education Trust",
      "pys.entityLabel": "Legal entity",
      "pys.entityScope": "Pay logic belongs to the legal entity — the employer of record — not to a campus. A campus is a filter inside it.",
      "pys.by": "{who} · {role} · {id}",

      "pys.maker": "Sunita Kulkarni",
      "pys.checker": "Rajiv Menon",
      "pys.hr": "Kavita Sharma",
      "pys.head": "Anjali Deshpande",
      "pys.principal": "Radhika Menon",
      "pys.roleMaker": "Payroll Officer",
      "pys.roleChecker": "Accountant",
      "pys.roleHR": "HR Officer",
      "pys.roleHead": "Head of Department, Science",
      "pys.rolePrincipal": "Campus Principal",

      "pys.tabs.aria": "Salary structure sections",
      "pys.tab.groups": "Pay groups",
      "pys.tab.structures": "Structures",
      "pys.tab.honorarium": "Honorarium",
      "pys.tab.people": "People",
      "pys.tab.proposals": "Proposals",

      "pys.mon.1": "January", "pys.mon.2": "February", "pys.mon.3": "March",
      "pys.mon.4": "April", "pys.mon.5": "May", "pys.mon.6": "June",
      "pys.mon.7": "July", "pys.mon.8": "August", "pys.mon.9": "September",
      "pys.mon.10": "October", "pys.mon.11": "November", "pys.mon.12": "December",
      "pys.period": "{mon} 2026",
      "pys.today": "11 August 2026",

      "pys.cfg.read": "Read from StatutoryConfig {v}, in force from {d}.",
      "pys.cfg.pinned": "StatutoryConfig {v} (in force from {d}) is pinned to run {run}.",
      "pys.cfg.next": "A newer version, {v}, is effective from {d}. It applies from the September run onward — it does not touch a run already computed.",
      "pys.cfg.who": "Published by {who} on {d}. A config is published as a new version, never edited.",
      "pys.cfg.noRates": "Rates, ceilings and slabs are not printed here. Each figure is what the engine returned, beside the version it read.",

      "pys.disabledWhy": "Why this is off",
      "pys.absentWhy": "Why this is not here",
      "pys.appendOnly": "This record is added to, never edited. A correction becomes a new entry beside the old one.",
      "pys.supersede": "Superseded by {what} on {d}",
      "pys.confirm": "Confirm",
      "pys.cancel": "Cancel",
      "pys.close": "Close",

      "pys.reason.label": "Reason",
      "pys.reason.pick": "Choose a reason",
      "pys.reason.note": "What should the record say?",
      "pys.reason.notePh": "In your own words, for whoever reads this in a year",
      "pys.reason.errPick": "Choose a reason. It goes on the record with your name and cannot be taken off.",
      "pys.reason.errNote": "Write the note too. A reason code on its own does not explain a money decision.",

      /* maker-checker, stated once and reused */
      "pys.mc.title": "Two people, not one",
      "pys.mc.sub": "A change to what someone is paid is prepared by one person and approved by another. This screen is the preparer’s seat.",
      "pys.mc.makerLabel": "Prepared by",
      "pys.mc.checkerLabel": "Approved by",
      "pys.mc.perm": "holds {perm}",
      "pys.mc.absent": "Approve is not on this screen. You prepared these changes, and this role does not hold payroll.approve.",
      "pys.mc.pending": "Waiting on {who}, {role}. Nothing below takes effect until they approve it.",
      "pys.mc.returned": "{who} sent this back on {d}. It is yours again, with their reason on the record.",

      "pys.st.draft": "Draft",
      "pys.st.valid": "Valid",
      "pys.st.inUse": "In use",
      "pys.st.unused": "Not in use",
      "pys.st.superseded": "Superseded",
      "pys.st.violation": "Over the limit",
      "pys.st.blocked": "Blocking",
      "pys.st.pending": "Awaiting checker",
      "pys.st.approved": "Approved",
      "pys.st.returned": "Sent back",
      "pys.st.declined": "Declined",
      "pys.st.modified": "Modified",
      "pys.st.assigned": "Assigned",
      "pys.st.unassigned": "No salary assigned",
      "pys.st.scheduled": "Scheduled",
      "pys.st.locked": "Locked",
      "pys.st.byRule": "Paid by rule",
      "pys.st.capped": "Cap applied",

      "pys.lock.paid": "{mon} 2026 is paid and closed — run {run} was disbursed. Pay in that month can only change through arrears.",
      "pys.lock.checker": "August is locked by {run}, with {who} for approval. A change effective in August would move figures they have been asked to sign.",
      "pys.lock.open": "September is open. Nothing has been computed for it yet.",

      /* ---------- PY-02 · pay groups ---------- */
      "pys2.q": "What pay logics do we operate?",
      "pys2.reg.title": "Pay groups",
      "pys2.reg.sub": "One legal entity, four pay logics. A person sits in exactly one, and it decides which logic the engine runs for them.",
      "pys2.col.group": "Pay group",
      "pys2.col.kind": "Kind",
      "pys2.col.structure": "Salary structure",
      "pys2.col.heads": "Staff",
      "pys2.col.state": "State",
      "pys2.col.act": "",
      "pys2.totals": "All four groups",

      "pys2.g.teach": "Teaching",
      "pys2.g.admin": "Administration and support",
      "pys2.g.visit": "Visiting faculty",
      "pys2.g.contract": "Contract faculty (2026–27)",
      "pys2.kind.ctc": "CTC · monthly",
      "pys2.kind.hon": "Honorarium · rate times units, capped",
      "pys2.kind.contract": "Contract",
      "pys2.kind.aria": "Pay logic",

      "pys2.noStructure": "No structure attached",
      "pys2.honRules": "{n} honorarium rules",

      "pys2.cover.title": "Everyone is covered",
      "pys2.cover.sub": "{n} people in this entity, and every one of them sits in a group with something to pay them by.",
      "pys2.cover.foot": "{run} computed {n} people across three groups. Contract faculty has nobody yet, which is why it can still be changed.",

      "pys2.stat.title": "What each group is treated as",
      "pys2.stat.sub": "Which statutory heads apply, read from the pinned version. The amounts belong to a run, not to a group.",
      "pys2.stat.applies": "Applies",
      "pys2.stat.some": "Some staff",
      "pys2.stat.no": "Does not apply",
      "pys2.stat.unset": "Not set until a structure is attached",
      "pys2.stat.PF": "Provident fund",
      "pys2.stat.ESI": "Employees’ State Insurance",
      "pys2.stat.PT": "Professional tax",
      "pys2.stat.LWF": "Labour welfare fund",
      "pys2.stat.TDS": "Income tax (TDS)",
      "pys2.stat.esiNote": "ESI applies below a wage ceiling held in {v}. Who falls under it is decided at compute, not typed here.",

      "pys2.block.title": "Contract faculty cannot be used yet",
      "pys2.block.body": "The group has a kind but nothing tells the engine what to pay. Attach a structure before anyone is put on it.",
      "pys2.act.attach": "Attach a salary structure",
      "pys2.act.attachSub": "Choose a structure and the date it starts applying to this group.",
      "pys2.act.attachStructure": "Structure",
      "pys2.act.attachPick": "Choose a structure",
      "pys2.act.attachFrom": "Effective from",
      "pys2.act.attachErr": "Choose a structure. Without one the engine has nothing to compute.",
      "pys2.act.attachDone": "{structure} would be attached to {group} from {d}. The group becomes usable for contracts and offers.",
      "pys2.act.attachHidden": "An honorarium group is paid by rate times units under a rule, not by a structure. The rules are on the Honorarium tab.",

      "pys2.act.create": "Create a pay group",
      "pys2.act.createSub": "A group needs a name and a kind. The kind has no default: it decides which engine runs.",
      "pys2.act.name": "Name",
      "pys2.act.namePh": "What this group is called on a contract",
      "pys2.act.kind": "Kind",
      "pys2.act.kindPick": "Choose a kind — no default",
      "pys2.act.kindHint": "CTC monthly and Contract run the structure engine. Honorarium runs rate times units against a monthly cap.",
      "pys2.act.errName": "Give the group a name. It appears on every contract that points at it.",
      "pys2.act.errKind": "Choose a kind. The engine cannot compute a group that has not said which logic it runs.",
      "pys2.act.createDone": "{name} would be created in {entity}, available to contracts (HR-05) and offers (HR-20).",

      "pys2.act.deact": "Deactivate",
      "pys2.act.deactWhy": "{group} has {n} active staff. Deactivating it would leave them with no pay logic. Move them first.",
      "pys2.act.deactOk": "Deactivate this group",
      "pys2.act.deactSub": "It has nobody on it, so nothing is left unpaid. It disappears from assignment and stays on the record.",
      "pys2.act.deactDone": "{group} would be hidden from assignment. Existing records that name it are untouched.",
      "pys2.act.openHon": "Open the honorarium rules",
      "pys2.act.openStructure": "Open the structure",
      "pys2.menuAria": "Actions for {group}",

      "pys2.absent.components": "A group points at a structure; what the structure is MADE of lives on the Structures tab.",

      /* ---------- PY-03 · salary structure editor ---------- */
      "pys3.q": "What is this salary made of?",
      "pys3.list.title": "Salary structures",
      "pys3.list.sub": "Every version ever published, including the ones no longer used. A structure is superseded, never edited and never deleted.",
      "pys3.col.name": "Structure",
      "pys3.col.group": "Pay group",
      "pys3.col.from": "Effective from",
      "pys3.col.assigned": "Assigned",
      "pys3.col.state": "State",

      "pys3.s.teach3": "Teaching — grade scale, v3",
      "pys3.s.teach2": "Teaching — grade scale, v2",
      "pys3.s.teach4": "Teaching — grade re-fix, v4 (draft)",
      "pys3.s.admin2": "Administration and support, v2",

      "pys3.open.title": "{name}",
      "pys3.open.sub": "{group} · effective from {d} · {n} assigned",
      "pys3.open.subDraft": "{group} · draft, would take effect {d} · nobody assigned yet",
      "pys3.comp.title": "Components",
      "pys3.comp.sub": "Code, how it is calculated, and the three flags that decide the statutory base. At the sample below, every line is priced.",
      "pys3.col.code": "Code",
      "pys3.col.name2": "Component",
      "pys3.col.calc": "How it is calculated",
      "pys3.col.flags": "Taxable · PF · ESI",
      "pys3.col.amount": "At the sample",
      "pys3.comp.total": "Gross earnings",

      "pys3.c.BASIC": "Basic pay",
      "pys3.c.DA": "Dearness allowance",
      "pys3.c.HRA": "House rent allowance",
      "pys3.c.SPL": "Special allowance",
      "pys3.c.ACAD": "Academic and books allowance",
      "pys3.c.CONV": "Conveyance allowance",
      "pys3.c.MED": "Medical allowance",

      "pys3.calc.flat": "Flat · {v}",
      "pys3.calc.pct": "{p} of {of}",
      "pys3.calc.grade": "Formula · the grade basic on the employment contract",
      "pys3.calc.balance": "Formula · gross less every other component",
      "pys3.flag.tax": "Taxable",
      "pys3.flag.pf": "PF",
      "pys3.flag.esi": "ESI",
      "pys3.flag.yes": "Yes",
      "pys3.flag.no": "No",

      "pys3.rule.title": "The excluded-allowance limit",
      "pys3.rule.sub": "Wages must be at least half of what a person is paid. Checked live, at the sample below — not at save time only.",
      "pys3.rule.wages": "Wages — the components inside the statutory base",
      "pys3.rule.excluded": "Excluded allowances",
      "pys3.rule.total": "Total monthly remuneration",
      "pys3.rule.limit": "The limit at this sample",
      "pys3.rule.share": "Excluded share",
      "pys3.rule.okAt": "Exactly at the limit. One rupee more in an excluded allowance and this structure cannot be saved.",
      "pys3.rule.ok": "Under the limit, with {amt} of room.",
      "pys3.rule.over": "Over the limit by {amt}. This structure cannot be saved.",
      "pys3.rule.overWho": "The excluded components are {list}.",
      "pys3.rule.src": "The limit is a share of total remuneration, read from {v} with the rest of the statutory data. It is not typed on this screen.",

      "pys3.sim.title": "Simulate",
      "pys3.sim.sub": "One person, one month, priced end to end \u2014 including what the school pays on top.",
      "pys3.sim.sample": "Sample person",
      "pys3.sim.days": "Paid days",
      "pys3.sim.daysFull": "31 of 31 — a full month",
      "pys3.sim.days1": "30 of 31 — one unpaid day",
      "pys3.sim.days2": "29 of 31 — two unpaid days",
      "pys3.sim.dayRate": "An unpaid day costs {amt} — monthly gross divided by 30, the same divisor the attendance and leave screens use.",
      "pys3.sim.earn": "Earnings",
      "pys3.sim.ded": "Deductions",
      "pys3.sim.net": "Paid to the bank",
      "pys3.sim.employer": "Paid by the school on top",
      "pys3.sim.cost": "Cost to the school this month",
      "pys3.sim.annual": "Cost to the school for a full year",
      "pys3.sim.gross": "Gross earnings",
      "pys3.sim.statNote": "PF, ESI, professional tax and income tax are computed on {v}. This screen prints amounts, never the rules.",
      "pys3.sim.esiNo": "ESI does not apply at this wage \u2014 the ceiling is held in {v}. Nothing is deducted and nothing is contributed.",
      "pys3.sim.tdsNil": "Nil at this wage on the declared regime.",
      "pys3.sim.person.ananya": "Ananya Rao — PGT Physics, grade basic {b}",
      "pys3.sim.person.manju": "Manjunath Gowda — bus driver, grade basic {b}",

      "pys3.c.PF": "Provident fund",
      "pys3.c.ESI": "Employees’ State Insurance",
      "pys3.c.PT": "Professional tax",
      "pys3.c.TDS": "Income tax (TDS)",
      "pys3.c.PFER": "Provident fund — the school’s share",
      "pys3.c.ESIER": "Employees’ State Insurance — the school’s share",
      "pys3.c.LWF": "Labour welfare fund — the school’s share",

      "pys3.act.add": "Add a component",
      "pys3.act.addSub": "Three flags, no defaults. Each one changes a statutory base, so none of them can be guessed for you.",
      "pys3.act.addCode": "Code",
      "pys3.act.addCodePick": "Choose a code",
      "pys3.act.addCalc": "How is it calculated?",
      "pys3.act.addCalcPick": "Choose a calculation — no default",
      "pys3.act.calc.flat": "Flat amount",
      "pys3.act.calc.pct": "Percent of another component",
      "pys3.act.calc.formula": "Formula",
      "pys3.act.addValue": "Amount",
      "pys3.act.addPct": "Percent",
      "pys3.act.addOf": "Percent of",
      "pys3.act.addFormula": "Formula",
      "pys3.act.addFormulaPh": "For example: gross less every other component",
      "pys3.act.flagUnset": "Not set",
      "pys3.act.errCode": "Choose a code. A component with no code cannot appear on a payslip line.",
      "pys3.act.errCalc": "Choose how it is calculated. There is no default — flat, percent and formula behave differently at every CTC.",
      "pys3.act.errValue": "Give it a value.",
      "pys3.act.errFlags": "Set all three flags. Taxable, PF and ESI each change a statutory base; leaving one unset would let the engine guess.",
      "pys3.act.errFormula": "This formula names {what}, and no component with that code exists in this structure. Add it first, or point at one that is here.",
      "pys3.act.addDone": "{code} would be added to this draft at {amt}. The sample and the limit above are recomputed on every change.",

      "pys3.act.save": "Save this version",
      "pys3.act.saveSub": "A save publishes a new version. It supersedes the one before it, which stays readable forever.",
      "pys3.act.saveFrom": "Effective from",
      "pys3.act.saveRefused": "Save refused. Excluded allowances are {amt} over the limit at this sample.",
      "pys3.act.saveRefusedWhy": "M10: a structure whose excluded allowances exceed the limit is rejected at save. Reduce one, or raise the grade basic.",
      "pys3.act.saveDone": "Version {v} would be published, effective {d}, superseding {old}. Everyone assigned to it is repriced from that date.",
      "pys3.act.saveOnDraft": "Only a draft can be saved. This version is in use — clone it to make a change.",

      "pys3.act.clone": "Clone to a new version",
      "pys3.act.cloneDone": "A draft copy of {name} would open, with the same components and no effective date yet.",
      "pys3.act.retire": "Retire this structure",
      "pys3.act.retireWhy": "{n} people are on {name} today. A retired structure takes no new assignments, so move them first.",
      "pys3.act.retireGo": "Open the {n} assignments",
      "pys3.act.retireOk": "Nobody is assigned to this draft, so retiring it leaves no one unpriced.",
      "pys3.act.retireDone": "{name} would take no new assignments from {d}. It stays readable, and every payslip it produced stays exactly as it was.",
      "pys3.menuAria": "Actions for {name}",

      "pys3.warn.pf": "This changes the PF wage for everyone on the structure, and for any filed month you reopen. It is a new version, never a correction.",
      "pys3.warn.drift": "These rules no longer produce the components on this person's issued payslip \u2014 a defect, not a display choice.",
      "pys3.warn.circular": "A formula that refers back to itself, directly or through another component, is refused at save with the loop named.",
      "pys3.absent.rates": "A structure says what a component IS; the pinned StatutoryConfig says what the state takes.",
      "pys3.absent.people": "Who is on this structure is not decided here. Assignment is one person at a time, effective-dated, on the People tab.",
    },

  });

  addStrings({
    en: {
      /* ---------- PY-04 · honorarium rules ---------- */
      "pys4.q": "How do we pay guest and per-lecture faculty?",
      "pys4.rules.title": "Honorarium rules",
      "pys4.rules.sub": "Visiting faculty · {n} staff. A rule is a rate against a unit, with a monthly cap that is part of the rule, not an afterthought.",
      "pys4.col.rule": "Rule",
      "pys4.col.unit": "Unit",
      "pys4.col.rate": "Rate",
      "pys4.col.cap": "Monthly cap",
      "pys4.col.people": "On this rule",
      "pys4.col.from": "Effective from",

      "pys4.r.lecture": "Per lecture — visiting faculty",
      "pys4.r.day": "Per day — substitute and workshop faculty",
      "pys4.r.period": "Per period — co-curricular instructors",
      "pys4.unit.lecture": "Lecture",
      "pys4.unit.day": "Day",
      "pys4.unit.period": "Period",
      "pys4.perUnit": "{amt} per {unit}",
      "pys4.capReach": "The cap is reached at {n} {unit} in a month.",
      "pys4.totals": "Three rules",

      "pys4.hist.title": "What this rate used to be",
      "pys4.hist.sub": "A rate is superseded, never overwritten. Every past run keeps the rate it was computed on.",
      "pys4.hist.row": "{amt} per {unit}, from {from} until {to}",
      "pys4.hist.by": "Superseded by {who} on {d} — {reason}",

      "pys4.gap.title": "Where the unit counts come from",
      "pys4.gap.body": "Nothing counts lectures automatically. One person enters the counts, a second approves them, and the register says who did both.",
      "pys4.gap.spec": "The specification defines rate, unit and cap but names no source for the counts. Manual, attributed entry is the source here.",

      "pys4.units.title": "August units",
      "pys4.units.sub": "{shown} of {total} rows · entered against the period, then approved. Sorted by amount.",
      "pys4.col.who": "Staff",
      "pys4.col.units": "Units",
      "pys4.col.raw": "Rate times units",
      "pys4.col.payable": "Payable",
      "pys4.units.subtotal": "Subtotal of the {n} rows shown",
      "pys4.units.notTotal": "This is the subtotal of the rows on screen, not the group’s total for the month. The group total belongs to run {run}.",
      "pys4.units.capNote": "{name} taught {n} {unit}. The cap holds {amt} back — the rule says so, and the rule is on the record.",
      "pys4.units.enteredBy": "Entered by {who} on {d}",
      "pys4.units.approvedBy": "Approved by {who} on {d}",
      "pys4.units.attrib": "Who did what",
      "pys4.units.twoPeople": "Units are the entire basis of an honorarium payment, so the person who enters them is never the person who approves them.",

      "pys4.lock.title": "August units are locked",
      "pys4.lock.body": "Run {run} computed on 10 August and is with {who} for approval. Units feed that computation, so they cannot move under it.",
      "pys4.act.enter": "Enter monthly units",
      "pys4.act.enterWhy": "August is computed and submitted. Recall it on the run console, or wait for {who} to return it. September opens on 1 September.",
      "pys4.act.enterGo": "Open the run console",

      "pys4.act.create": "Create a rule",
      "pys4.act.createSub": "A unit, a rate and a cap. The cap is required — the specification makes it part of the rule.",
      "pys4.act.ruleName": "What this rule is called",
      "pys4.act.ruleNamePh": "How it reads on a contract and a payslip",
      "pys4.act.unit": "Unit",
      "pys4.act.unitPick": "Choose a unit — no default",
      "pys4.act.rate": "Rate for one unit",
      "pys4.act.cap": "Monthly cap",
      "pys4.act.capHint": "The most this rule can pay one person in one month, however many units they teach.",
      "pys4.act.errName": "Name the rule.",
      "pys4.act.errUnit": "Choose a unit. Lecture, day and period are counted differently and cannot be swapped later without repricing.",
      "pys4.act.errRate": "Give a rate.",
      "pys4.act.errCap": "Give a monthly cap. A rule with no cap can pay without limit, and the specification does not allow one.",
      "pys4.act.createDone": "{name} would apply to Visiting faculty at {rate}, capped at {cap} a month. The cap is reached at {n} units.",

      "pys4.act.editRate": "Revise the rate",
      "pys4.act.editRateSub": "A rate is not edited. A new rate starts on a date, and everything before that date keeps the rate it was paid on.",
      "pys4.act.newRate": "New rate for one unit",
      "pys4.act.editFrom": "Effective from",
      "pys4.act.errRateSame": "The new rate is the same as the current one. Nothing would be superseded.",
      "pys4.act.editDone": "{name} would pay {amt} per {unit} from {d}. Runs before that date are untouched — {run} keeps the rate it was computed on.",
      "pys4.act.editRetro": "Back-dating a rate does not rewrite a paid month. It creates arrears, which post through a run and need a distinct checker.",
      "pys4.menuAria": "Actions for {name}",

      "pys4.reason.rate": "Annual rate revision",
      "pys4.reason.market": "Market correction",
      "pys4.reason.error": "Correcting an error in the rule",
      "pys4.reason.policy": "Policy decision by the trust",

      "pys4.absent.ctc": "A guest lecturer has a rate, a count and a cap \u2014 no basic, no HRA, no special allowance.",
      "pys4.absent.rates": "Professional tax and income tax are deducted from an honorarium by the engine, on the version pinned to the run.",

      /* ---------- PY-05 · employee salary and revisions ---------- */
      "pys5.q": "What does this person earn, from when?",
      "pys5.warn.title": "One person has no salary",
      "pys5.warn.body": "{name} joins on {d} and has a contract, a pay group and no salary assignment. Nothing would pay them in the September run.",
      "pys5.warn.aug": "The August run is not affected — they are not in it. The September run is, and it has not been started.",
      "pys5.warn.act": "Assign a salary",

      "pys5.reg.title": "Salary register",
      "pys5.reg.sub": "{shown} of {total} \u2014 what each person is paid today, and from when. The only list in the product where the pay is the point.",
      "pys5.col.staff": "Staff",
      "pys5.col.group": "Pay group",
      "pys5.col.structure": "Structure",
      "pys5.col.gross": "Monthly gross",
      "pys5.col.annual": "Annual gross",
      "pys5.col.from": "From",
      "pys5.col.state": "State",
      "pys5.reg.totals": "{n} rows shown",
      "pys5.reg.note": "The total below is the total of the rows on screen, not the entity’s payroll. That figure belongs to a run.",
      "pys5.reg.byRule": "Rate times units",
      "pys5.reg.none": "—",

      "pys5.det.sub": "{id} · {desig} · {group}",
      "pys5.det.comp": "What this salary is made of",
      "pys5.det.compSub": "The structure’s rules, priced at this person’s grade basic. The components add to the gross — they are not a list beside it.",
      "pys5.det.gross": "Monthly gross",
      "pys5.det.annualGross": "Annual gross",
      "pys5.det.employer": "The school’s contribution on top",
      "pys5.det.annualCost": "Annual cost to the school",
      "pys5.det.statNote": "Deductions and the school's contribution are computed on the version pinned to each run. This screen decides what is paid.",
      "pys5.det.statFor": "For {name}, the {mon} run returned: {lines}. Read from {v}.",
      "pys5.det.bank": "Bank account {acct}",
      "pys5.det.bankNote": "Masked exactly as on the teacher's own payslip. Payroll gets no better view of it than she does.",
      "pys5.det.ledger": "Effective-dated ledger",
      "pys5.det.ledgerSub": "Every revision this person has had. A new row supersedes the one above it; nothing is removed.",
      "pys5.det.row": "{amt} a month from {from}",
      "pys5.det.rowTo": "{amt} a month, {from} to {to}",
      "pys5.det.reason": "Reason: {r}",
      "pys5.det.made": "Prepared by {who} on {d}",
      "pys5.det.appr": "Approved by {who} on {d}",
      "pys5.det.await": "Waiting on {who}",
      "pys5.det.ret": "Sent back by {who} on {d}",
      "pys5.det.retWhy": "“{why}”",
      "pys5.det.current": "Current",
      "pys5.det.joiner": "{name} joined on {d}. Their first run is priced from that date — the run computes the proration, not this screen.",
      "pys5.det.joinerWord": "Joined",
      "pys5.det.willJoin": "{name} joins on {d}. Assign a salary before the September run is started, or nothing in that run will pay them.",
      "pys5.det.honorarium": "{name} is on Visiting faculty and has no structure. What he is paid is a rate against a unit, capped monthly.",
      "pys5.det.honGo": "Open the honorarium rule",
      "pys5.det.unassigned": "No salary has been assigned yet. Nothing about this person can be revised until there is a first row to supersede.",
      "pys5.det.rule": "The excluded-allowance limit at this person’s pay",

      "pys5.act.assign": "Assign a salary",
      "pys5.act.assignSub": "The first row. It makes this person payable, and every later change supersedes it rather than replacing it.",
      "pys5.act.revise": "Revise the salary",
      "pys5.act.reviseSub": "Not an edit. A new dated row, with a reason, that a second person approves before it means anything.",
      "pys5.act.structure": "Structure",
      "pys5.act.gross": "Monthly gross",
      "pys5.act.grossHint": "The annual figure and the components are worked out from this and the structure’s rules.",
      "pys5.act.from": "Effective from",
      "pys5.act.fromHintNew": "New joiners default to their joining date. Everyone else defaults to the first of next month.",
      "pys5.act.reasonPick": "Reason",
      "pys5.act.errGross": "Enter a monthly gross. It is the only figure this screen asks you for.",
      "pys5.act.errSame": "That is the same figure as today. A revision with no change would still need a second person’s time.",
      "pys5.act.errReason": "Choose a reason. It becomes the arrears source on every month this touches.",
      "pys5.act.errLocked": "That date sits in a locked month. Choose an open date, or accept the arrears path below.",
      "pys5.act.submit": "Send for approval",
      "pys5.act.submitDone": "Sent to {who}, {role}. It is pending until they approve it — and until then {name} is paid the old figure.",
      "pys5.act.assignDone": "{name} would be assigned {amt} a month from {d}, on {structure}. They become payable in the September run.",

      "pys5.cons.title": "What this would cost, and where it lands",
      "pys5.cons.sub": "A revision is never retroactive by accident. Here is every month it reaches, the run it lands in, and who has to approve it.",
      "pys5.cons.delta": "The change",
      "pys5.cons.deltaLine": "{oldAmt} to {newAmt} — {delta} a month",
      "pys5.cons.forward": "Nothing before {d} is touched. The first run to use the new figure is {run}.",
      "pys5.cons.arrTitle": "Back-dated — this creates arrears",
      "pys5.cons.arrSub": "{n} months are already paid or computed on the old figure. Each is recomputed on the version it was pinned to.",
      "pys5.cons.col.month": "Month",
      "pys5.cons.col.run": "Run",
      "pys5.cons.col.cfg": "Pinned version",
      "pys5.cons.col.days": "Paid days",
      "pys5.cons.col.amt": "Arrears",
      "pys5.cons.arrTotal": "Total arrears",
      "pys5.cons.lands": "These arrears post through {run}, the next run not yet started. They cannot go into {cur} \u2014 it is with the checker.",
      "pys5.cons.needChecker": "Arrears posting needs a distinct checker: {who}, {role}. Posting is append-only \u2014 a correction supersedes.",
      "pys5.cons.statutory": "PF, ESI and income tax are recomputed for each month on that month's own pinned version.",
      "pys5.cons.filing": "{n} of these months have already been filed. The correction appears in a revised return as a supersession, not a replacement.",
      "pys5.cons.blocked": "This date cannot be used",

      "pys5.bulk.title": "Revise {n} people together",
      "pys5.bulk.sub": "Every name, every old and new figure, and the total monthly cost — before anything is sent, not after.",
      "pys5.bulk.mode": "Change by",
      "pys5.bulk.pct": "A percentage",
      "pys5.bulk.flat": "A flat amount",
      "pys5.bulk.amount": "Amount",
      "pys5.bulk.pctAmount": "Percent",
      "pys5.bulk.col.old": "Today",
      "pys5.bulk.col.new": "After",
      "pys5.bulk.col.delta": "Change",
      "pys5.bulk.totalDelta": "Total monthly cost of this change",
      "pys5.bulk.totalAnnual": "Over a full year",
      "pys5.bulk.excluded": "{n} selected rows sit in a locked month and are left out: {list}. Named here rather than silently dropped.",
      "pys5.bulk.limit": "Each grade basic moves in proportion to the gross, so no structure crosses the excluded-allowance limit. Checked on every row.",
      "pys5.bulk.errNone": "Select at least two people. A bulk revision of one person is a revision.",
      "pys5.bulk.errAmount": "Enter how much to change by.",
      "pys5.bulk.send": "Send all {n} for approval",
      "pys5.bulk.done": "{n} revisions would go to {who} as one batch, each still approved on its own.",
      "pys5.bulk.select": "Select {name}",
      "pys5.bulk.clear": "Clear the selection",

      "pys5.act.export": "Export the salary register",
      "pys5.act.exportSub": "The most sensitive export in the product. It is counted, attributed and recorded, and it asks why before it starts.",
      "pys5.act.exportWhy": "What is this export for?",
      "pys5.act.exportDone": "{n} rows would be exported and the export recorded against your name. It carries no bank account, no PAN and no Aadhaar.",
      "pys5.act.exportCount": "This export would carry {n} people’s pay.",

      "pys5.reason.pay_revision": "Pay revision",
      "pys5.reason.promotion": "Promotion",
      "pys5.reason.correction": "Correction",
      "pys5.reason.da_vda": "DA or VDA revision",
      "pys5.reason.new": "First assignment",

      "pys5.menuAria": "Actions for {name}",
      "pys5.act.open": "Open the salary record",
      "pys5.act.openHon": "Open the honorarium rule",
      "pys5.act.noReviseWhy": "{name} has no salary assignment. Assign one first — a revision supersedes a row, and there is no row.",

      "pys5.absent.structure": "What a component IS lives on the Structures tab; who gets which, at what figure and from when, lives here.",
      "pys5.absent.payslip": "Payslips are not here either. This screen says what someone is paid; a payslip says what a particular month actually did.",
      "pys5.absent.delete": "There is no delete. A wrong salary row is superseded by a corrected one, and both stay readable.",

      /* ---------- PY-06 · proposed revisions ---------- */
      "pys6.q": "Which appraisal recommendations are waiting to become real money?",
      "pys6.head.title": "From the appraisal cycle",
      "pys6.head.sub": "{cycle}, closed on {d}. A recommendation becomes money only when someone accepts it and someone else approves that.",
      "pys6.cost.label": "If every pending proposal were accepted as it stands",
      "pys6.cost.month": "a month more",
      "pys6.cost.year": "{amt} over a full year",
      "pys6.cost.note": "{n} pending proposals · {excl} not counted because there is no current figure to compare against.",

      "pys6.reg.title": "Proposed revisions",
      "pys6.reg.sub": "Each one names who recommended it and who moderated it. The ratings behind them are not payroll’s business and are not here.",
      "pys6.col.staff": "Staff",
      "pys6.col.kind": "Recommendation",
      "pys6.col.current": "Today",
      "pys6.col.proposed": "Proposed",
      "pys6.col.change": "Change",
      "pys6.col.from": "Effective from",
      "pys6.col.state": "State",
      "pys6.reg.totals": "{n} pending",

      "pys6.kind.increment": "Increment",
      "pys6.kind.promotion": "Promotion",
      "pys6.rec": "Recommended by {who}",
      "pys6.mod": "Moderated by {who}",
      "pys6.cycle": "Annual review 2025–26",

      "pys6.act.accept": "Accept",
      "pys6.act.acceptSub": "The figure is editable \u2014 it is a proposal. Accepting creates a pending revision that still needs {who}.",
      "pys6.act.acceptAmt": "Amount to accept",
      "pys6.act.acceptFrom": "Effective from",
      "pys6.act.acceptFromHint": "Defaults to the cycle’s effective date.",
      "pys6.act.acceptDone": "{name} would go to {amt} from {d}, pending {who}. The appraisal it came from is linked on the record.",
      "pys6.act.acceptDiff": "You are accepting {amt}, which is not the {rec} that was recommended. That is a modification — say why.",
      "pys6.act.modify": "Modify",
      "pys6.act.modifySub": "A different figure from the one recommended. The deviation is recorded against the appraisal.",
      "pys6.act.modifyDone": "{name} would go to {amt} instead of the recommended {rec}, pending {who}, with your reason on both records.",
      "pys6.act.decline": "Decline",
      "pys6.act.declineSub": "The recommendation closes. {who} and {mod} are told, with your reason.",
      "pys6.act.declineDone": "{name}’s recommendation would close as declined. Nothing about their pay changes.",
      "pys6.act.context": "Open the appraisal context",
      "pys6.act.contextSub": "A read-only summary of the review — the recommendation, the recommender and the moderator. Not the ratings.",
      "pys6.act.contextBody": "{cycle} · recommendation {kind} · recommended by {rec} · moderated by {mod} · finalized {d}.",
      "pys6.act.contextNo": "The ratings themselves are not shown. Payroll needs the recommendation, not the score behind it.",

      "pys6.act.blocked": "Accept is off for {name}",
      "pys6.act.blockedWhy": "{name} is on Visiting faculty, paid a rate against a unit. A proposal cannot become a revision until there is a salary row.",
      "pys6.act.blockedGo": "Open the salary register",

      "pys6.bulk.title": "Accept {n} proposals",
      "pys6.bulk.sub": "Every name, every old and new figure, and what it costs over a year — before anything is sent.",
      "pys6.bulk.total": "Total monthly cost of accepting these",
      "pys6.bulk.annual": "Over a full year",
      "pys6.bulk.send": "Send all {n} for approval",
      "pys6.bulk.done": "{n} revisions would go to {who} as one batch, each approved on its own.",
      "pys6.bulk.errNone": "Select at least two proposals.",
      "pys6.bulk.select": "Select the proposal for {name}",

      "pys6.reason.market": "Below market for the role",
      "pys6.reason.budget": "Outside this session’s budget",
      "pys6.reason.band": "Outside the grade band",
      "pys6.reason.timing": "Too soon after the last revision",
      "pys6.reason.other": "Another reason, written below",

      "pys5.ret.nusrat": "This back-dates into July, which is paid and filed. Attach the month-split arrears schedule and send it again.",
      "pys6.why.divya": "The recommended figure crosses the top of her grade band. 31,500 keeps her inside it, and is still her largest increment.",
      "pys6.why.kamath": "He was revised in February, five months ago. The next cycle is the right place for it, and his recommender knows.",

      "pys6.done.declined": "Declined by {who} on {d} — {why}",
      "pys6.done.modified": "Modified by {who} on {d}, from {rec} to {amt} — {why}",
      "pys6.done.pending": "Pending {who} since {d}",

      "pys6.sel.head": "No proposal open",
      "pys6.sel.body": "Choose a name above to read the appraisal context it came from, or use a row’s menu to accept, modify or decline it.",
      "pys6.empty.head": "Nothing waiting",
      "pys6.empty.body": "No appraisal cycle has been finalized here yet. When one closes, its recommendations arrive as proposals \u2014 never as changes.",
      "pys6.stale.title": "One cycle was reopened",
      "pys6.stale.body": "{cycle} was reopened on {d} for a moderation correction, which touched a rating, not a recommendation.",

      "pys6.absent.auto": "There is no apply-all. M17 makes a recommendation advisory, and every acceptance still passes payroll maker-checker.",
      "pys6.absent.ratings": "Ratings, scores and review text are not on this screen. Payroll acts on the recommendation, and the recommendation alone.",
    },

  });

  /* ---- demo people. Names are content, so they are translated too;
     an entity is not half-Devanagari because its staff have Latin
     names. Staff ids are unique to one person across the build. ---- */
  addStrings({
    en: {
      "pys.n.ananya": "Ananya Rao", "pys.n.mahesh": "Mahesh Pillai",
      "pys.n.farida": "Farida Khan", "pys.n.nusrat": "Nusrat Ali",
      "pys.n.joseph": "Joseph Mathew", "pys.n.prakash": "Prakash Nair",
      "pys.n.ravi": "Ravi Deshmukh", "pys.n.kavita": "Kavita Sharma",
      "pys.n.suresh": "Suresh Iyer", "pys.n.imran": "Imran Qureshi",
      "pys.n.rohit": "Rohit Malhotra", "pys.n.bhavna": "Bhavna Rege",
      "pys.n.tarun": "Tarun Chaubey", "pys.n.ritika": "Ritika Chawla",
      "pys.n.arvind": "Arvind Krishnan",
      "pys.n.vikram": "Vikram Sen",
      "pys.n.kamath": "Suresh Kamath", "pys.n.divya": "Divya Prakash",
      "pys.n.manju": "Manjunath Gowda",

      "pys.d.ananya": "PGT, Physics", "pys.d.mahesh": "PGT, Biology",
      "pys.d.farida": "Front office lead", "pys.d.nusrat": "Library assistant",
      "pys.d.joseph": "TGT, Social Science", "pys.d.prakash": "TGT, English",
      "pys.d.ravi": "PGT, Computer Science", "pys.d.kavita": "HR officer",
      "pys.d.manju": "Bus driver, Route 4",
      "pys.d.suresh": "Guest faculty, Statistics", "pys.d.ritika": "PRT, Class II",
      "pys.d.arvind": "PGT, Chemistry",
      "pys.d.vikram": "TGT, Mathematics",
      "pys.d.kamath": "Accounts executive", "pys.d.divya": "Front office executive",
    },
  });

  addStrings({
    en: {
      "pys.head2": "Ramesh Bhatt",
      "pys.roleHead2": "Head of Department, Mathematics",
      "pys.d.bankAnanya": "HDFC ••4321",
    },
  });

  /* ============================================================
     THE PINNED, VERSIONED CONFIG (§4.4, O9)

     Nothing on these screens types a rate, a ceiling or a slab. The
     ONE percentage that appears — the Labour Code excluded-allowance
     limit — is a field on the config object, rendered with its
     version, its effective date and who published it, exactly the way
     pages/payroll.jsx renders its variance gate. Change the object and
     every verdict on PY-03 re-decides itself.
     ============================================================ */
  const CFG_APR = { v: "v2026.2", from: { d: 1, m: 4, y: 2026 } };
  const CFG_JUL = { v: "v2026.3", from: { d: 1, m: 7, y: 2026 } };
  const CFG_SEP = { v: "v2026.4", from: { d: 1, m: 9, y: 2026 } };
  const CFG_PINNED = CFG_JUL;
  const CFG_PUBLISHED = { by: "pys.principal", at: { d: 18, m: 6, y: 2026 } };

  /* the excluded-allowance limit, as a share of total remuneration —
     read from the pinned config, never authored inside a sentence */
  const WAGE_RULE = { excludedMaxPctOfTotal: 50, cfg: CFG_PINNED };

  /* ============================================================
     PEOPLE WITH POWER — a maker and a checker, both named, both with
     a staff id and a permission, exactly as pages/payroll.jsx and
     pages/payslips.jsx have them.
     ============================================================ */
  const MAKER = { nameKey: "pys.maker", roleKey: "pys.roleMaker", id: "NAV-0031", perm: "payroll.run" };
  const CHECKER = { nameKey: "pys.checker", roleKey: "pys.roleChecker", id: "NAV-0009", perm: "payroll.approve" };
  const HR = { nameKey: "pys.hr", roleKey: "pys.roleHR", id: "NAV-0007" };
  const HEAD_SCI = { nameKey: "pys.head", roleKey: "pys.roleHead", id: "NAV-0088" };
  const HEAD_MATH = { nameKey: "pys.head2", roleKey: "pys.roleHead2", id: "NAV-0018" };
  const PRINCIPAL = { nameKey: "pys.principal", roleKey: "pys.rolePrincipal", id: "NAV-0002" };

  const TODAY = { d: 11, m: 8, y: 2026 };
  const RUN_AUG = "PR-2026-08";
  const RUN_JUL = "PR-2026-07";
  const RUN_JUN = "PR-2026-06";
  const RUN_SEP = "PR-2026-09";
  const HEADCOUNT = 412;

  /* the reference gross every screen in this build prices a day from */
  const DAY_DIVISOR = 30;
  const r2 = (n) => Math.round(n * 100) / 100;
  const dayRate = (gross) => r2(gross / DAY_DIVISOR);

  /* ============================================================
     PAY GROUPS (PY-02) — §6.9 PayGroup(legal_entity_id, name, kind).
     The three that carry people are pages/payroll.jsx's run groups,
     headcount for headcount: 268 + 121 + 23 = 412.
     ============================================================ */
  const PAY_GROUPS = [
    { key: "teach", nameKey: "pys2.g.teach", kind: "ctc", heads: 268, structure: "teach3",
      stat: { PF: "applies", ESI: "no", PT: "applies", LWF: "applies", TDS: "applies" } },
    { key: "admin", nameKey: "pys2.g.admin", kind: "ctc", heads: 121, structure: "admin2",
      stat: { PF: "applies", ESI: "some", PT: "applies", LWF: "applies", TDS: "applies" } },
    { key: "visit", nameKey: "pys2.g.visit", kind: "hon", heads: 23, structure: null, rules: 3,
      stat: { PF: "no", ESI: "no", PT: "applies", LWF: "no", TDS: "applies" } },
    { key: "contract", nameKey: "pys2.g.contract", kind: "contract", heads: 0, structure: null,
      stat: { PF: "unset", ESI: "unset", PT: "unset", LWF: "unset", TDS: "unset" } },
  ];
  const GROUP_HEADS = PAY_GROUPS.reduce((s, g) => s + g.heads, 0);
  const groupByKey = (k) => PAY_GROUPS.filter((g) => g.key === k)[0];
  const STAT_HEADS = ["PF", "ESI", "PT", "LWF", "TDS"];

  /* ============================================================
     SALARY STRUCTURES (PY-03) — §6.9 SalaryStructure / PayComponent.

     A structure carries RULES, never a person's number. `grade` reads
     the basic off the employment contract (M3 §6.3 — a school runs a
     pay scale), `pct` is a share of another component, `flat` is a
     fixed amount and `balance` is the figure that closes to the gross.
     `pf` is what puts a component inside the statutory wage base; the
     excluded-allowance verdict is derived from that flag alone, never
     authored per structure.

     The teaching rules are checked in code against pages/payslips.jsx's
     July payslip: at Ananya Rao's grade basic they must produce
     BASIC 39,500 · DA 7,900 · HRA 19,750 · ACAD 6,530 · SPL 21,120.
     ============================================================ */
  const STRUCTURES = [
    {
      key: "teach3", nameKey: "pys3.s.teach3", group: "teach", version: 3,
      from: { d: 1, m: 4, y: 2026 }, state: "inUse", assigned: 268, supersedes: "teach2",
      comps: [
        { code: "BASIC", calc: "grade", taxable: true, pf: true, esi: true },
        { code: "DA", calc: "pct", pct: 20, of: "BASIC", taxable: true, pf: true, esi: true },
        { code: "HRA", calc: "pct", pct: 50, of: "BASIC", taxable: true, pf: false, esi: true },
        { code: "ACAD", calc: "flat", value: 6530, taxable: true, pf: false, esi: true },
        { code: "SPL", calc: "balance", taxable: true, pf: false, esi: true },
      ],
    },
    {
      key: "admin2", nameKey: "pys3.s.admin2", group: "admin", version: 2,
      from: { d: 1, m: 4, y: 2026 }, state: "inUse", assigned: 121,
      comps: [
        { code: "BASIC", calc: "grade", taxable: true, pf: true, esi: true },
        { code: "DA", calc: "pct", pct: 20, of: "BASIC", taxable: true, pf: true, esi: true },
        { code: "HRA", calc: "pct", pct: 40, of: "BASIC", taxable: true, pf: false, esi: true },
        { code: "CONV", calc: "flat", value: 1600, taxable: false, pf: false, esi: false },
        { code: "SPL", calc: "balance", taxable: true, pf: false, esi: true },
      ],
    },
    {
      /* the classic Labour Code failure: shrink the wage base, inflate
         the allowances. It is refused at save, and the refusal names
         the overage and the components that caused it. */
      key: "teach4", nameKey: "pys3.s.teach4", group: "teach", version: 4,
      from: { d: 1, m: 9, y: 2026 }, state: "draft", assigned: 0, supersedes: "teach3",
      comps: [
        { code: "BASIC", calc: "grade", taxable: true, pf: true, esi: true },
        { code: "DA", calc: "pct", pct: 10, of: "BASIC", taxable: true, pf: true, esi: true },
        { code: "HRA", calc: "pct", pct: 50, of: "BASIC", taxable: true, pf: false, esi: true },
        { code: "ACAD", calc: "flat", value: 6530, taxable: true, pf: false, esi: true },
        { code: "CONV", calc: "flat", value: 4000, taxable: false, pf: false, esi: false },
        { code: "SPL", calc: "balance", taxable: true, pf: false, esi: true },
      ],
    },
    {
      key: "teach2", nameKey: "pys3.s.teach2", group: "teach", version: 2,
      from: { d: 1, m: 4, y: 2025 }, state: "superseded", assigned: 0,
      supersededBy: "teach3", supersededOn: { d: 1, m: 4, y: 2026 },
      comps: [
        { code: "BASIC", calc: "grade", taxable: true, pf: true, esi: true },
        { code: "DA", calc: "pct", pct: 18, of: "BASIC", taxable: true, pf: true, esi: true },
        { code: "HRA", calc: "pct", pct: 50, of: "BASIC", taxable: true, pf: false, esi: true },
        { code: "ACAD", calc: "flat", value: 5800, taxable: true, pf: false, esi: true },
        { code: "SPL", calc: "balance", taxable: true, pf: false, esi: true },
      ],
    },
  ];
  const structByKey = (k) => STRUCTURES.filter((s) => s.key === k)[0];

  /* price one structure at one person's grade basic and gross. The
     order of `comps` is the order of evaluation; `balance` closes. */
  function priceComponents(struct, basic, gross) {
    const out = [];
    let running = 0;
    struct.comps.forEach((cp) => {
      let v = 0;
      if (cp.calc === "grade") v = basic;
      else if (cp.calc === "flat") v = cp.value;
      else if (cp.calc === "pct") {
        const base = out.filter((o) => o.code === cp.of)[0];
        v = r2((base ? base.v : 0) * cp.pct / 100);
      } else if (cp.calc === "balance") v = r2(gross - running);
      running = r2(running + v);
      out.push({ code: cp.code, v: v, cp: cp });
    });
    return out;
  }
  function wageBaseOf(lines) { return lines.filter((l) => l.cp.pf).reduce((s, l) => s + l.v, 0); }
  function excludedOf(lines) { return lines.filter((l) => !l.cp.pf).reduce((s, l) => s + l.v, 0); }
  function grossOf(lines) { return lines.reduce((s, l) => s + l.v, 0); }

  /* the live verdict. `limit` is derived from the config field, so a
     published change to the limit re-decides every structure. */
  function wageVerdict(lines) {
    const gross = grossOf(lines);
    const excluded = excludedOf(lines);
    const limit = r2(gross * WAGE_RULE.excludedMaxPctOfTotal / 100);
    const over = r2(excluded - limit);
    return {
      gross: gross, wages: wageBaseOf(lines), excluded: excluded, limit: limit,
      over: over, share: gross === 0 ? 0 : (excluded / gross) * 100,
      state: over > 0 ? "over" : over === 0 ? "at" : "under",
      offenders: lines.filter((l) => !l.cp.pf),
    };
  }

  /* ============================================================
     THE SIMULATOR (PY-03 "Simulate") — engine output, not arithmetic
     this screen invented. Each row is what the payroll engine returned
     for that many unpaid days on the PINNED config: amounts only, no
     rate anywhere. LWF is 20.00 a head a month, the same figure
     pages/payroll.jsx's run divides out.
     ============================================================ */
  const SIM = {
    teach3: {
      personKey: "pys3.sim.person.ananya", basic: 39500, gross: 94800,
      rows: [
        { lop: 0, pf: 5688.0, esi: null, pt: 200.0, tds: 10480.0, pfEr: 5688.0, esiEr: null, lwf: 20.0 },
        { lop: 1, pf: 5498.4, esi: null, pt: 200.0, tds: 10006.0, pfEr: 5498.4, esiEr: null, lwf: 20.0 },
        { lop: 2, pf: 5308.8, esi: null, pt: 200.0, tds: 9532.0, pfEr: 5308.8, esiEr: null, lwf: 20.0 },
      ],
    },
    admin2: {
      personKey: "pys3.sim.person.manju", basic: 10500, gross: 24600,
      rows: [
        { lop: 0, pf: 1680.0, esi: 184.5, pt: 200.0, tds: 0, pfEr: 1680.0, esiEr: 799.5, lwf: 20.0 },
        { lop: 1, pf: 1623.6, esi: 178.5, pt: 200.0, tds: 0, pfEr: 1623.6, esiEr: 773.0, lwf: 20.0 },
        { lop: 2, pf: 1567.2, esi: 172.2, pt: 200.0, tds: 0, pfEr: 1567.2, esiEr: 746.5, lwf: 20.0 },
      ],
    },
  };
  const SIM_MONTH_DAYS = 31;

  /* ============================================================
     HONORARIUM RULES (PY-04) — §6.9 HonorariumRule(unit, rate,
     monthly_cap). 14 + 6 + 3 = 23, the Visiting faculty headcount in
     pages/payroll.jsx's run.
     ============================================================ */
  const HON_RULES = [
    { key: "lecture", nameKey: "pys4.r.lecture", unit: "lecture", rate: 1200.0, cap: 36000.0,
      people: 14, from: { d: 1, m: 4, y: 2026 }, version: 2,
      prev: { rate: 1100.0, from: { d: 1, m: 4, y: 2025 }, to: { d: 31, m: 3, y: 2026 },
              by: MAKER, at: { d: 28, m: 3, y: 2026 }, reasonKey: "pys4.reason.rate" } },
    { key: "day", nameKey: "pys4.r.day", unit: "day", rate: 2100.0, cap: 42000.0,
      people: 6, from: { d: 1, m: 4, y: 2026 }, version: 1 },
    { key: "period", nameKey: "pys4.r.period", unit: "period", rate: 850.0, cap: 25500.0,
      people: 3, from: { d: 1, m: 7, y: 2025 }, version: 1 },
  ];
  const HON_PEOPLE = HON_RULES.reduce((s, r) => s + r.people, 0);
  const honByKey = (k) => HON_RULES.filter((r) => r.key === k)[0];
  /* the cap is a rule, so "how many units reach it" is derived */
  const capUnits = (rule) => Math.floor(rule.cap / rule.rate);

  /* August units — entered by one person, approved by another, then
     frozen into the run. Raw and payable are BOTH computed; the cap
     does its own work rather than being described. */
  const UNIT_ROWS = [
    { id: "NAV-0161", nameKey: "pys.n.rohit", rule: "day", units: 21 },
    { id: "NAV-0263", nameKey: "pys.n.suresh", rule: "lecture", units: 17 },
    { id: "NAV-0291", nameKey: "pys.n.tarun", rule: "period", units: 22 },
    { id: "NAV-0270", nameKey: "pys.n.imran", rule: "lecture", units: 15 },
    { id: "NAV-0284", nameKey: "pys.n.bhavna", rule: "lecture", units: 12 },
  ];
  function unitRaw(row) { return r2(honByKey(row.rule).rate * row.units); }
  function unitPayable(row) { return Math.min(unitRaw(row), honByKey(row.rule).cap); }
  function unitHeld(row) { return r2(unitRaw(row) - unitPayable(row)); }
  const UNITS_SUBTOTAL = UNIT_ROWS.reduce((s, r) => s + unitPayable(r), 0);
  const UNITS_ENTERED = { by: HR, at: { d: 9, m: 8, y: 2026 } };
  const UNITS_APPROVED = { by: MAKER, at: { d: 10, m: 8, y: 2026 } };

  /* ============================================================
     EMPLOYEE SALARY (PY-05) — §6.9 EmployeeSalary(employee_id,
     structure_id, ctc, effective_from); "revisions add rows".

     `basic` is the grade basic the contract carries and the structure
     reads. `augPaid` / `julPaid` are pages/payroll.jsx's paid days for
     the same people, so an arrears schedule computed here prices the
     same month the run does.
     ============================================================ */
  const STAFF = [
    { id: "NAV-0142", nameKey: "pys.n.ananya", desigKey: "pys.d.ananya", group: "teach",
      basic: 39500, gross: 94800, from: { d: 1, m: 4, y: 2026 }, augPaid: 31, julPaid: 31,
      bankKey: "pys.d.bankAnanya",
      ledger: [
        { gross: 84000, from: { d: 1, m: 4, y: 2025 }, to: { d: 31, m: 3, y: 2026 }, reason: "pay_revision",
          made: { by: MAKER, at: { d: 20, m: 3, y: 2025 } }, appr: { by: CHECKER, at: { d: 24, m: 3, y: 2025 } } },
        { gross: 94800, from: { d: 1, m: 4, y: 2026 }, reason: "pay_revision", current: true,
          made: { by: MAKER, at: { d: 22, m: 3, y: 2026 } }, appr: { by: CHECKER, at: { d: 28, m: 3, y: 2026 } } },
      ] },
    { id: "NAV-0416", nameKey: "pys.n.ravi", desigKey: "pys.d.ravi", group: "teach",
      basic: 37500, gross: 88000, from: { d: 17, m: 8, y: 2026 }, augPaid: 15, julPaid: null,
      joiner: { d: 17, m: 8, y: 2026 },
      ledger: [
        { gross: 88000, from: { d: 17, m: 8, y: 2026 }, reason: "new", current: true,
          made: { by: MAKER, at: { d: 5, m: 8, y: 2026 } }, appr: { by: CHECKER, at: { d: 6, m: 8, y: 2026 } } },
      ] },
    { id: "NAV-0301", nameKey: "pys.n.joseph", desigKey: "pys.d.joseph", group: "teach",
      basic: 33000, gross: 76200, from: { d: 1, m: 8, y: 2026 }, augPaid: 31, julPaid: 30,
      ledger: [
        { gross: 68000, from: { d: 1, m: 4, y: 2026 }, to: { d: 31, m: 7, y: 2026 }, reason: "pay_revision",
          made: { by: MAKER, at: { d: 22, m: 3, y: 2026 } }, appr: { by: CHECKER, at: { d: 28, m: 3, y: 2026 } } },
        { gross: 76200, from: { d: 1, m: 8, y: 2026 }, reason: "promotion", current: true,
          made: { by: MAKER, at: { d: 5, m: 8, y: 2026 } }, appr: { by: CHECKER, at: { d: 6, m: 8, y: 2026 } } },
      ] },
    { id: "NAV-0122", nameKey: "pys.n.prakash", desigKey: "pys.d.prakash", group: "teach",
      basic: 31000, gross: 71000, from: { d: 1, m: 4, y: 2026 }, augPaid: 31, julPaid: 31,
      ledger: [
        { gross: 71000, from: { d: 1, m: 4, y: 2026 }, reason: "pay_revision", current: true,
          made: { by: MAKER, at: { d: 22, m: 3, y: 2026 } }, appr: { by: CHECKER, at: { d: 28, m: 3, y: 2026 } } },
      ] },
    { id: "NAV-0209", nameKey: "pys.n.mahesh", desigKey: "pys.d.mahesh", group: "teach",
      basic: 30000, gross: 68400, from: { d: 1, m: 4, y: 2026 }, augPaid: 29, julPaid: 31,
      ledger: [
        { gross: 68400, from: { d: 1, m: 4, y: 2026 }, reason: "pay_revision", current: true,
          made: { by: MAKER, at: { d: 22, m: 3, y: 2026 } }, appr: { by: CHECKER, at: { d: 28, m: 3, y: 2026 } } },
      ] },
    { id: "NAV-0007", nameKey: "pys.n.kavita", desigKey: "pys.d.kavita", group: "admin",
      basic: 25000, gross: 58000, from: { d: 1, m: 4, y: 2026 }, augPaid: 31, julPaid: 31,
      ledger: [
        { gross: 58000, from: { d: 1, m: 4, y: 2026 }, reason: "pay_revision", current: true,
          made: { by: MAKER, at: { d: 22, m: 3, y: 2026 } }, appr: { by: CHECKER, at: { d: 28, m: 3, y: 2026 } } },
      ] },
    { id: "NAV-0388", nameKey: "pys.n.farida", desigKey: "pys.d.farida", group: "admin",
      basic: 18000, gross: 42600, from: { d: 1, m: 4, y: 2026 }, augPaid: 29, julPaid: 31,
      pending: { gross: 46000, from: { d: 1, m: 9, y: 2026 }, reason: "pay_revision",
                 made: { by: MAKER, at: { d: 10, m: 8, y: 2026 } } },
      ledger: [
        { gross: 42600, from: { d: 1, m: 4, y: 2026 }, reason: "pay_revision", current: true,
          made: { by: MAKER, at: { d: 22, m: 3, y: 2026 } }, appr: { by: CHECKER, at: { d: 28, m: 3, y: 2026 } } },
      ] },
    { id: "NAV-0355", nameKey: "pys.n.nusrat", desigKey: "pys.d.nusrat", group: "admin",
      basic: 17000, gross: 39600, from: { d: 1, m: 4, y: 2026 }, augPaid: 30, julPaid: 31,
      returned: { gross: 43000, from: { d: 1, m: 7, y: 2026 }, reason: "correction",
                  made: { by: MAKER, at: { d: 8, m: 8, y: 2026 } },
                  ret: { by: CHECKER, at: { d: 9, m: 8, y: 2026 }, whyKey: "pys5.ret.nusrat" } },
      ledger: [
        { gross: 39600, from: { d: 1, m: 4, y: 2026 }, reason: "pay_revision", current: true,
          made: { by: MAKER, at: { d: 22, m: 3, y: 2026 } }, appr: { by: CHECKER, at: { d: 28, m: 3, y: 2026 } } },
      ] },
    { id: "NAV-0054", nameKey: "pys.n.manju", desigKey: "pys.d.manju", group: "admin",
      basic: 10500, gross: 24600, from: { d: 1, m: 4, y: 2026 }, augPaid: 31, julPaid: 31,
      ledger: [
        { gross: 24600, from: { d: 1, m: 4, y: 2026 }, reason: "pay_revision", current: true,
          made: { by: MAKER, at: { d: 22, m: 3, y: 2026 } }, appr: { by: CHECKER, at: { d: 28, m: 3, y: 2026 } } },
      ] },
    { id: "NAV-0263", nameKey: "pys.n.suresh", desigKey: "pys.d.suresh", group: "visit",
      byRule: "lecture", basic: null, gross: null, ledger: [] },
    { id: "NAV-0431", nameKey: "pys.n.ritika", desigKey: "pys.d.ritika", group: "teach",
      unassigned: true, basic: null, gross: null, joiner: { d: 1, m: 9, y: 2026 }, ledger: [] },
  ];
  const staffById = (id) => STAFF.filter((p) => p.id === id)[0];
  const ASSIGNED = STAFF.filter((p) => p.gross != null);
  const SHOWN_TOTAL = ASSIGNED.reduce((s, p) => s + p.gross, 0);
  const UNASSIGNED = STAFF.filter((p) => p.unassigned);

  function structureFor(p) {
    const g = groupByKey(p.group);
    return g && g.structure ? structByKey(g.structure) : null;
  }
  function linesFor(p) {
    const st = structureFor(p);
    if (!st || p.gross == null) return null;
    return priceComponents(st, p.basic, p.gross);
  }

  /* ============================================================
     THE PERIOD LOCKS. April to July are paid and closed; August is
     computed and with the checker; September has not been started.
     Every date control on PY-05 reads this list, so a locked month
     cannot be edited by accident on any of them.
     ============================================================ */
  const PERIODS = [
    { m: 6, days: 30, run: RUN_JUN, cfg: CFG_APR, state: "paid", filed: true },
    { m: 7, days: 31, run: RUN_JUL, cfg: CFG_JUL, state: "paid", filed: true },
    { m: 8, days: 31, run: RUN_AUG, cfg: CFG_JUL, state: "withChecker", filed: false },
    { m: 9, days: 30, run: RUN_SEP, cfg: CFG_SEP, state: "open", filed: false },
    { m: 10, days: 31, run: null, cfg: CFG_SEP, state: "open", filed: false },
  ];
  const periodOf = (m) => PERIODS.filter((p) => p.m === m)[0];

  /* the dates a revision may be dated from, each carrying its own
     state — the control is one list, so nothing can be offered that
     the lock table does not know about */
  const EFFECTIVE_DATES = [
    { key: "2026-09-01", at: { d: 1, m: 9, y: 2026 } },
    { key: "2026-10-01", at: { d: 1, m: 10, y: 2026 } },
    { key: "2026-08-01", at: { d: 1, m: 8, y: 2026 } },
    { key: "2026-07-01", at: { d: 1, m: 7, y: 2026 } },
    { key: "2026-06-01", at: { d: 1, m: 6, y: 2026 } },
  ];
  const DEFAULT_EFFECTIVE = "2026-09-01";

  /* paid days for one person in one month, from the same figures
     pages/payroll.jsx reconciled */
  function paidDaysOf(p, m) {
    if (m === 8) return p.augPaid == null ? periodOf(8).days : p.augPaid;
    if (m === 7) return p.julPaid == null ? periodOf(7).days : p.julPaid;
    return periodOf(m).days;
  }

  /* every month a back-dated revision reaches, priced on that month's
     own paid days. The pinned version comes from the period, so two
     months in one schedule can — and here do — carry different ones. */
  function arrearsSchedule(p, effMonth, delta) {
    const months = PERIODS.filter((x) => x.m >= effMonth && x.m <= 8 && x.state !== "open");
    return months.map((x) => {
      const paid = paidDaysOf(p, x.m);
      return { m: x.m, run: x.run, cfg: x.cfg, paid: paid, days: x.days, filed: x.filed,
               amt: r2(delta * paid / x.days) };
    });
  }

  /* ============================================================
     PROPOSED REVISIONS (PY-06) — M17: advisory, never auto-applied,
     still maker-checker. The percentage on each row is computed from
     the two figures beside it, so a row can never say a change it did
     not make.
     ============================================================ */
  const CYCLE = { nameKey: "pys6.cycle", closed: { d: 31, m: 7, y: 2026 },
                  reopened: { d: 4, m: 8, y: 2026 }, effective: { d: 1, m: 9, y: 2026 } };

  const PROPOSALS = [
    { id: "NAV-0245", nameKey: "pys.n.arvind", desigKey: "pys.d.arvind", kind: "promotion",
      cur: 64000, prop: 72000, rec: HEAD_SCI, mod: PRINCIPAL, state: "pending" },
    { id: "NAV-0209", nameKey: "pys.n.mahesh", desigKey: "pys.d.mahesh", kind: "increment",
      cur: 68400, prop: 72500, rec: HEAD_SCI, mod: PRINCIPAL, state: "pending" },
    { id: "NAV-0118", nameKey: "pys.n.vikram", desigKey: "pys.d.vikram", kind: "increment",
      cur: 58000, prop: 61000, rec: HEAD_MATH, mod: PRINCIPAL, state: "pending" },
    { id: "NAV-0263", nameKey: "pys.n.suresh", desigKey: "pys.d.suresh", kind: "increment",
      cur: null, prop: null, rec: HEAD_MATH, mod: PRINCIPAL, state: "blocked" },
    { id: "NAV-0199", nameKey: "pys.n.divya", desigKey: "pys.d.divya", kind: "increment",
      cur: 30000, prop: 33000, accepted: 31500, rec: HEAD_MATH, mod: PRINCIPAL, state: "modified",
      act: { by: MAKER, at: { d: 8, m: 8, y: 2026 }, whyKey: "pys6.why.divya" } },
    { id: "NAV-0176", nameKey: "pys.n.kamath", desigKey: "pys.d.kamath", kind: "increment",
      cur: 44000, prop: 47000, rec: HEAD_MATH, mod: PRINCIPAL, state: "declined",
      act: { by: MAKER, at: { d: 8, m: 8, y: 2026 }, whyKey: "pys6.why.kamath" } },
  ];
  const PENDING = PROPOSALS.filter((p) => p.state === "pending");
  const BLOCKED = PROPOSALS.filter((p) => p.state === "blocked");
  const PENDING_MONTHLY = PENDING.reduce((s, p) => s + (p.prop - p.cur), 0);
  const propStands = (p) => (p.accepted != null ? p.accepted : p.prop);
  const propDelta = (p) => (p.cur == null || propStands(p) == null ? null : r2(propStands(p) - p.cur));
  const propPct = (p) => (propDelta(p) == null ? null : (propDelta(p) / p.cur) * 100);
  const proposalById = (id) => PROPOSALS.filter((p) => p.id === id)[0];

  /* ============================================================
     LOCAL PRIMITIVES — the kit does not carry these yet. Each is a
     promotion candidate; see the note at the foot of the file.
     ============================================================ */

  /* a translated date: "11 August 2026" / Devanagari. The year is a
     STRING, never num() — num(2026) groups to "2,026". */
  function dateStr(t, dt) {
    if (!dt) return "—";
    return String(dt.d) + " " + t("pys.mon." + dt.m) + " " + String(dt.y);
  }
  function person(t, who) {
    return t("pys.by", { who: t(who.nameKey), role: t(who.roleKey), id: who.id });
  }
  /* a percentage, always to two places, assembled from a number —
     never authored inside a translated sentence */
  function pctStr(n) { return n.toFixed(2) + "%"; }
  function signed(n) { return (n > 0 ? "+" : "") + inr(n); }

  /* SIGNED LEDGER — the arithmetic column. gross, less, equals, in one
     place, with the operator in its own gutter. */
  function EqRow({ sign, label, value, strong, rule, note, tone }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div>
        <div
          style={{
            display: "flex", alignItems: "baseline", gap: 12,
            padding: strong ? "12px 0 2px" : "7px 0",
            borderTop: rule ? "1px solid " + c.borderStrong : "none",
            marginTop: rule ? 6 : 0,
          }}
        >
          <span aria-hidden="true" style={G3.fig("sm", { width: 16, color: c.inkFaint, flexShrink: 0 })}>{sign}</span>
          <span style={ty("small", { color: strong ? c.ink : c.inkMuted, fontWeight: strong ? 700 : 500, flex: 1, minWidth: 0 })}>{label}</span>
          <Figure value={inr(value)} size={strong ? 22 : "md"} weight={strong ? 700 : 600} color={tone || c.ink} align="right" />
        </div>
        {note ? <div style={ty("caption", { color: c.inkFaint, margin: "0 0 4px 28px" })}>{note}</div> : null}
      </div>
    );
  }

  /* a control that is OFF, with the reason in words beside it. The
     button stays clickable and announces itself, so a click never
     dead-ends in silence. */
  function OffAction({ label, reason, iconLeft, kind, extra }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [poked, setPoked] = useState(false);
    return (
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
        <Button kind={kind || "secondary"} iconLeft={iconLeft} disabled onClick={() => setPoked(true)}>{label}</Button>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" })}>{t("pys.disabledWhy")}</div>
          <p role={poked ? "alert" : undefined} style={ty("small", { color: c.inkMuted, margin: "3px 0 0" })}>{reason}</p>
          {extra ? <div style={{ marginTop: 8 }}>{extra}</div> : null}
        </div>
      </div>
    );
  }

  /* an advisory block: a glyph, a word and a sentence. State is never
     colour alone, so the role always brings its own mark. */
  function Note({ role, glyph, word, children, action }) {
    const { c } = useTheme();
    const { ty } = useLang();
    const tint = c[(role || "off") + "Tint"] || c.sunken;
    const fg = c[(role || "off") + "Text"] || c.inkMuted;
    return (
      <div style={{ background: tint, borderRadius: G3.r.lg, padding: "12px 14px", marginTop: 12 }}>
        <div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
          <span aria-hidden="true" style={{ color: fg, display: "flex", flexShrink: 0, paddingTop: 1 }}>
            <Icon name={glyph || "alert"} size={15} />
          </span>
          <div style={{ minWidth: 0, flex: 1 }}>
            {word ? <span style={ty("small", { color: fg, fontWeight: 700, marginRight: 6 })}>{word}</span> : null}
            <span style={ty("small", { color: c.ink })}>{children}</span>
            {action ? <div style={{ marginTop: 8 }}>{action}</div> : null}
          </div>
        </div>
      </div>
    );
  }

  /* a labelled read-out — the alternative to a KPI tile grid */
  function Fact({ label, children, note, w }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div style={{ minWidth: w || 130 }}>
        <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" })}>{label}</div>
        <div style={{ marginTop: 4 }}>{children}</div>
        {note ? <div style={ty("caption", { color: c.inkMuted, marginTop: 3 })}>{note}</div> : null}
      </div>
    );
  }

  /* the three statutory flags on a component, as words and not ticks */
  function FlagRow({ cp }) {
    const { t } = useLang();
    const { c } = useTheme();
    const one = (labelKey, on) => (
      <Chip key={labelKey} bg={on ? c.presentTint : c.sunken} fg={on ? c.presentText : c.inkMuted}>
        <span aria-hidden="true" style={{ display: "flex" }}><Icon name={on ? "check" : "arrow"} size={11} /></span>
        <span>{t(labelKey) + " " + (on ? t("pys3.flag.yes") : t("pys3.flag.no"))}</span>
      </Chip>
    );
    return (
      <span style={{ display: "inline-flex", gap: 5, flexWrap: "wrap" }}>
        {one("pys3.flag.tax", cp.taxable)}
        {one("pys3.flag.pf", cp.pf)}
        {one("pys3.flag.esi", cp.esi)}
      </span>
    );
  }

  /* REASON PROMPT — a controlled reason code AND a note, then a
     confirm. The confirm is never hard-disabled: a disabled submit
     swallows the click that would have shown the validation. */
  function ReasonPrompt({ idBase, title, body, options, confirmLabel, onConfirm, onCancel, extra }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [code, setCode] = useState("");
    const [note, setNote] = useState("");
    const [err, setErr] = useState(null);
    function go() {
      if (!code) { setErr("pick"); return; }
      if (!note.trim()) { setErr("note"); return; }
      setErr(null);
      onConfirm({ codeKey: code, note: note.trim() });
    }
    return (
      <div style={{ background: c.raised, border: "1px solid " + c.borderStrong, borderRadius: G3.r.lg, padding: "16px 18px 18px", marginTop: 14 }}>
        <div style={ty("h3", { color: c.ink, margin: 0 })}>{title}</div>
        {body ? <p style={ty("small", { color: c.inkMuted, margin: "6px 0 14px" })}>{body}</p> : <div style={{ height: 12 }} />}
        {extra}
        <Field id={idBase + "-code"} label={t("pys.reason.label")} error={err === "pick" ? t("pys.reason.errPick") : null}>
          <Select
            id={idBase + "-code"} value={code} onChange={setCode}
            options={[{ value: "", label: t("pys.reason.pick") }].concat(options.map((o) => ({ value: o, label: t(o) })))}
          />
        </Field>
        <Field id={idBase + "-note"} label={t("pys.reason.note")} error={err === "note" ? t("pys.reason.errNote") : null}>
          <Input id={idBase + "-note"} value={note} onChange={setNote} placeholder={t("pys.reason.notePh")} />
        </Field>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <Button kind="primary" onClick={go}>{confirmLabel || t("pys.confirm")}</Button>
          <Button kind="quiet" onClick={onCancel}>{t("pys.cancel")}</Button>
        </div>
      </div>
    );
  }

  /* what a completed action would have done, stated back in words.
     Nothing on a design canvas actually commits; saying so honestly
     beats a control that appears to have worked. */
  function DidIt({ children, onClose }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    return (
      <div role="status" style={{ background: c.presentTint, borderRadius: G3.r.lg, padding: "13px 15px", marginTop: 14, display: "flex", gap: 10, alignItems: "flex-start" }}>
        <span aria-hidden="true" style={{ color: c.presentText, display: "flex", paddingTop: 1 }}><Icon name="check" size={16} /></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={ty("small", { color: c.ink, margin: 0 })}>{children}</p>
          <p style={ty("caption", { color: c.inkMuted, margin: "6px 0 0" })}>{t("pys.appendOnly")}</p>
        </div>
        <LinkButton onClick={onClose}>{t("pys.close")}</LinkButton>
      </div>
    );
  }

  /* THE TWO PEOPLE. Named, with role, staff id and permission, side by
     side — and the reason the approve control is not on this screen. */
  function SignOff({ pendingWith, returnedBy, returnedOn }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    return (
      <Card icon="staff" iconTone="brass" title={t("pys.mc.title")} sub={t("pys.mc.sub")}>
        <div style={{ display: "flex", gap: 26, flexWrap: "wrap" }}>
          <Fact label={t("pys.mc.makerLabel")} w={250}>
            <div style={ty("small", { color: c.ink, fontWeight: 700 })}>{t(MAKER.nameKey)}</div>
            <div style={ty("caption", { color: c.inkMuted })}>{t(MAKER.roleKey)}</div>
            <div style={G3.fig("xs", { color: c.inkFaint, marginTop: 2 })}>{MAKER.id}</div>
            <div style={ty("caption", { color: c.inkFaint })}>{t("pys.mc.perm", { perm: MAKER.perm })}</div>
          </Fact>
          <Fact label={t("pys.mc.checkerLabel")} w={250}>
            <div style={ty("small", { color: c.ink, fontWeight: 700 })}>{t(CHECKER.nameKey)}</div>
            <div style={ty("caption", { color: c.inkMuted })}>{t(CHECKER.roleKey)}</div>
            <div style={G3.fig("xs", { color: c.inkFaint, marginTop: 2 })}>{CHECKER.id}</div>
            <div style={ty("caption", { color: c.inkFaint })}>{t("pys.mc.perm", { perm: CHECKER.perm })}</div>
          </Fact>
        </div>
        {pendingWith ? (
          <Note role="late" glyph="clock" word={t("pys.st.pending")}>
            {t("pys.mc.pending", { who: t(CHECKER.nameKey), role: t(CHECKER.roleKey) })}
          </Note>
        ) : null}
        {returnedBy ? (
          <Note role="absent" glyph="signout" word={t("pys.st.returned")}>
            {t("pys.mc.returned", { who: t(CHECKER.nameKey), d: returnedOn })}
          </Note>
        ) : null}
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid " + c.rule }}>
          <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" })}>{t("pys.absentWhy")}</div>
          <p style={ty("small", { color: c.inkMuted, margin: "4px 0 0" })}>{t("pys.mc.absent")}</p>
        </div>
      </Card>
    );
  }

  /* the config provenance line, printed wherever a statutory figure is */
  function ConfigLine({ cfg, run, next }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const use = cfg || CFG_PINNED;
    return (
      <div style={{ marginTop: 12 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <Chip bg={c.sunken} fg={c.inkMuted} mono>{use.v}</Chip>
          <span style={ty("caption", { color: c.inkMuted })}>
            {run
              ? t("pys.cfg.pinned", { v: use.v, d: dateStr(t, use.from), run: run })
              : t("pys.cfg.read", { v: use.v, d: dateStr(t, use.from) })}
          </span>
        </div>
        {next ? (
          <p style={ty("caption", { color: c.inkFaint, margin: "6px 0 0" })}>
            {t("pys.cfg.next", { v: CFG_SEP.v, d: dateStr(t, CFG_SEP.from) })}
          </p>
        ) : null}
      </div>
    );
  }

  /* a row selector for the bulk bars. A real checkbox with a real
     label, because a div with a tick is not selectable by keyboard. */
  function RowCheck({ id, checked, onChange, label }) {
    const { c } = useTheme();
    return (
      <input
        type="checkbox" id={id} checked={checked} aria-label={label}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: 16, height: 16, accentColor: c.accent, cursor: "pointer" }}
      />
    );
  }

  /* the shell every tab shares */
  /* each tab states its own question — the page title names the
     section, the question names the screen */
  function TabIntro({ qKey }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    return <p style={ty("h3", { color: c.inkMuted, margin: "0 0 16px" })}>{t(qKey)}</p>;
  }

  function Shell({ role, onNavigate, children, tabs }) {
    const { c } = useTheme();
    const { t, ty, lang } = useLang();
    const L = G3.layout;
    return (
      <div
        className="nv3"
        style={{ display: "flex", minHeight: "100vh", background: c.page, color: c.ink, fontFamily: G3.font.ui }}
      >
        <Rail role={role || "payrollOfficer"} active="pySalary" onNavigate={onNavigate} initials="SK" />
        <main style={{ flex: 1, minWidth: 0, position: "relative", overflowX: "clip" }}>
          <Motif />
          <div style={{ position: "relative", zIndex: 1, maxWidth: L.contentMax, margin: "0 auto", padding: "22px " + L.contentPadX + "px 56px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, marginBottom: 16 }}>
              <div style={ty("small", { color: c.inkMuted })}>
                <span style={{ color: c.ink, fontWeight: 700 }}>{t("pys.title")}</span>
                <span style={{ margin: "0 8px", color: c.inkFaint }} aria-hidden="true">·</span>
                <span>{t("pys.entity")}</span>
                <span style={{ margin: "0 8px", color: c.inkFaint }} aria-hidden="true">·</span>
                <span>{t("pys.today")}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <ThemeToggle />
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, flexWrap: "wrap", marginBottom: 18 }}>
              <div style={{ minWidth: 320, maxWidth: 720 }}>
                <h1 style={ty("display", { margin: 0, color: c.ink })}>{t("pys.title")}</h1>
              </div>
              <div style={{ minWidth: 260, maxWidth: 420 }}>
                <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" })}>{t("pys.entityLabel")}</div>
                <div style={ty("small", { color: c.ink, fontWeight: 700, marginTop: 3 })}>{t("pys.entity")}</div>
                <p style={ty("caption", { color: c.inkMuted, margin: "3px 0 0" })}>{t("pys.entityScope")}</p>
              </div>
            </div>

            {tabs}
            {children}
          </div>
        </main>
      </div>
    );
  }

  /* ============================================================
     PY-02 · PAY GROUPS
     "What pay logics do we operate?"

     Spec: screen-inventory PY-02 (all three actions built), §6.9
     PayGroup, M10 §Purpose. Component definitions are deliberately
     absent — they belong to PY-03, one tab across.
     ============================================================ */
  function PayGroupsTab({ goTab }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const L = G3.layout;
    const [creating, setCreating] = useState(false);
    const [attaching, setAttaching] = useState(null);
    const [deact, setDeact] = useState(null);
    const [done, setDone] = useState(null);

    /* create form */
    const [cName, setCName] = useState("");
    const [cKind, setCKind] = useState("");
    const [cErr, setCErr] = useState(null);
    /* attach form */
    const [aStruct, setAStruct] = useState("");
    const [aFrom, setAFrom] = useState("2026-09-01");
    const [aErr, setAErr] = useState(false);

    function submitCreate() {
      if (!cName.trim()) { setCErr("name"); return; }
      if (!cKind) { setCErr("kind"); return; }
      setCErr(null);
      setDone(t("pys2.act.createDone", { name: cName.trim(), entity: t("pys.entity") }));
      setCreating(false); setCName(""); setCKind("");
    }
    function submitAttach() {
      if (!aStruct) { setAErr(true); return; }
      setAErr(false);
      const st = structByKey(aStruct);
      const dt = EFFECTIVE_DATES.filter((d) => d.key === aFrom)[0];
      setDone(t("pys2.act.attachDone", {
        structure: t(st.nameKey), group: t(groupByKey(attaching).nameKey), d: dateStr(t, dt.at),
      }));
      setAttaching(null); setAStruct("");
    }

    const cols = [
      { key: "group", label: t("pys2.col.group") },
      { key: "kind", label: t("pys2.col.kind"), width: 230 },
      { key: "structure", label: t("pys2.col.structure"), width: 250 },
      { key: "heads", label: t("pys2.col.heads"), align: "right", mono: true, width: 90 },
      { key: "state", label: t("pys2.col.state"), width: 190 },
      { key: "act", label: t("pys2.col.act"), align: "right", width: 56 },
    ];

    function stateFor(g) {
      if (g.heads === 0 && !g.structure && g.kind !== "hon") {
        return <StatusMark role="absent" glyph="alert" word={t("pys.st.blocked")} />;
      }
      if (g.heads === 0) return <StatusMark role="off" glyph="arrow" word={t("pys.st.unused")} />;
      return <StatusMark role="present" glyph="check" word={t("pys.st.inUse")} />;
    }

    const rows = PAY_GROUPS.map((g) => {
      const items = [];
      if (g.kind !== "hon") {
        items.push({
          key: "attach", icon: "payroll", label: t("pys2.act.attach"),
          onSelect: () => { setAttaching(g.key); setDone(null); },
        });
      } else {
        items.push({ key: "hon", icon: "list", label: t("pys2.act.openHon"), onSelect: () => goTab("honorarium") });
      }
      if (g.structure) {
        items.push({ key: "open", icon: "document", label: t("pys2.act.openStructure"), onSelect: () => goTab("structures") });
      }
      items.push({
        key: "deact", icon: "signout", label: t("pys2.act.deact"),
        disabled: g.heads > 0,
        reason: g.heads > 0 ? t("pys2.act.deactWhy", { group: t(g.nameKey), n: num(g.heads) }) : null,
        onSelect: () => { setDeact(g.key); setDone(null); },
      });
      return {
        id: g.key,
        cells: {
          group: <span style={ty("small", { color: c.ink, fontWeight: 700 })}>{t(g.nameKey)}</span>,
          kind: t("pys2.kind." + (g.kind === "hon" ? "hon" : g.kind === "contract" ? "contract" : "ctc")),
          structure: g.kind === "hon"
            ? <span style={ty("caption", { color: c.inkMuted })}>{t("pys2.honRules", { n: num(g.rules) })}</span>
            : g.structure
              ? t(structByKey(g.structure).nameKey)
              : <StatusMark role="absent" glyph="alert" word={t("pys2.noStructure")} />,
          heads: g.heads === 0 ? "0" : num(g.heads),
          state: stateFor(g),
          act: <ActionMenu ariaLabel={t("pys2.menuAria", { group: t(g.nameKey) })} items={items} />,
        },
      };
    });

    const blocking = groupByKey("contract");
    const attachable = STRUCTURES.filter((s) => s.state !== "superseded");

    return (
      <div>
        <ColorCard kind="brass" icon="staff" iconTone="brass" title={t("pys2.cover.title")}
          sub={t("pys2.cover.sub", { n: num(GROUP_HEADS) })}>
          <div style={{ display: "flex", gap: 26, flexWrap: "wrap", marginTop: 4 }}>
            {PAY_GROUPS.filter((g) => g.heads > 0).map((g) => (
              <div key={g.key} style={{ minWidth: 190 }}>
                <div style={ty("caption", { color: c.onBrassMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" })}>{t(g.nameKey)}</div>
                <Figure value={num(g.heads)} size="lg" weight={700} color={"inherit"} />
              </div>
            ))}
            <div style={{ minWidth: 190, borderLeft: "1px solid " + c.onBrassRule, paddingLeft: 22 }}>
              <div style={ty("caption", { color: c.onBrassMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" })}>{t("pys2.totals")}</div>
              <Figure value={num(GROUP_HEADS)} size="lg" weight={700} color={"inherit"} />
            </div>
          </div>
          <p style={ty("caption", { color: c.onBrassMuted, margin: "14px 0 0" })}>
            {t("pys2.cover.foot", { run: RUN_AUG, n: num(GROUP_HEADS) })}
          </p>
        </ColorCard>

        <div style={{ marginTop: L.gap }}>
          <Register
            title={t("pys2.reg.title")}
            sub={t("pys2.reg.sub")}
            action={<Button kind="primary" iconLeft="staff" onClick={() => { setCreating(true); setDone(null); }}>{t("pys2.act.create")}</Button>}
            columns={cols}
            rows={rows}
            totals={{ label: t("pys2.totals"), cells: { group: t("pys2.totals"), heads: num(GROUP_HEADS) } }}
            footer={<p style={ty("caption", { color: c.inkMuted, margin: 0 })}>{t("pys2.absent.components")}</p>}
          />
        </div>

        {done ? <DidIt onClose={() => setDone(null)}>{done}</DidIt> : null}

        {creating ? (
          <Card style={{ marginTop: L.gap }} icon="staff" iconTone="accent" title={t("pys2.act.create")} sub={t("pys2.act.createSub")}>
            <div style={{ maxWidth: 520 }}>
              <Field id="pys2-name" label={t("pys2.act.name")} error={cErr === "name" ? t("pys2.act.errName") : null}>
                <Input id="pys2-name" value={cName} onChange={setCName} placeholder={t("pys2.act.namePh")} />
              </Field>
              <Field id="pys2-kind" label={t("pys2.act.kind")} hint={t("pys2.act.kindHint")} error={cErr === "kind" ? t("pys2.act.errKind") : null}>
                <Select id="pys2-kind" value={cKind} onChange={setCKind} options={[
                  { value: "", label: t("pys2.act.kindPick") },
                  { value: "ctc", label: t("pys2.kind.ctc") },
                  { value: "contract", label: t("pys2.kind.contract") },
                  { value: "hon", label: t("pys2.kind.hon") },
                ]} />
              </Field>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Button kind="primary" onClick={submitCreate}>{t("pys.confirm")}</Button>
                <Button kind="quiet" onClick={() => { setCreating(false); setCErr(null); }}>{t("pys.cancel")}</Button>
              </div>
            </div>
          </Card>
        ) : null}

        <div style={{ display: "flex", gap: L.gap, marginTop: L.gap, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div style={{ flex: "1 1 700px", minWidth: 430 }}>
            <Card icon="filing" iconTone="info" title={t("pys2.stat.title")} sub={t("pys2.stat.sub")}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid " + c.ruleStrong }}>
                    <th scope="col" style={ty("colLabel", { color: c.inkFaint, textAlign: "left", padding: "0 8px 9px", textTransform: "uppercase" })}>{t("pys2.col.group")}</th>
                    {STAT_HEADS.map((h) => (
                      <th key={h} scope="col" style={ty("colLabel", { color: c.inkFaint, textAlign: "center", padding: "0 6px 9px", textTransform: "uppercase" })}>{t("pys2.stat." + h)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PAY_GROUPS.map((g, i) => (
                    <tr key={g.key} style={{ borderBottom: i < PAY_GROUPS.length - 1 ? "1px solid " + c.rule : "none" }}>
                      <td style={ty("small", { padding: "10px 8px", color: c.ink, fontWeight: 600 })}>{t(g.nameKey)}</td>
                      {STAT_HEADS.map((h) => {
                        const v = g.stat[h];
                        const role = v === "applies" ? "present" : v === "some" ? "late" : "off";
                        const glyph = v === "applies" ? "check" : v === "some" ? "half" : v === "unset" ? "clock" : "arrow";
                        const word = t("pys2.stat." + (v === "applies" ? "applies" : v === "some" ? "some" : v === "unset" ? "unset" : "no"));
                        return (
                          <td key={h} style={{ padding: "10px 6px", textAlign: "center" }}>
                            <span title={word} style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                              <span aria-hidden="true" style={{ color: c[role + "Text"] || c.inkMuted, display: "flex" }}><Icon name={glyph} size={14} /></span>
                              <span style={ty("caption", { color: c[role + "Text"] || c.inkMuted, fontWeight: 600 })}>{word}</span>
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={ty("caption", { color: c.inkMuted, margin: "12px 0 0" })}>{t("pys2.stat.esiNote", { v: CFG_PINNED.v })}</p>
              <ConfigLine cfg={CFG_PINNED} run={RUN_AUG} next />
            </Card>
          </div>
          <div style={{ flex: "1 1 380px", minWidth: 340 }}>
            <Card icon="alert" iconTone="accent" title={t("pys2.block.title")} sub={t("pys2.block.body")}>
              {attaching === "contract" ? (
                <div style={{ maxWidth: 520 }}>
                  <Field id="pys2-struct" label={t("pys2.act.attachStructure")} error={aErr ? t("pys2.act.attachErr") : null}>
                    <Select id="pys2-struct" value={aStruct} onChange={setAStruct} options={[{ value: "", label: t("pys2.act.attachPick") }].concat(
                      attachable.map((s) => ({ value: s.key, label: t(s.nameKey) }))
                    )} />
                  </Field>
                  <Field id="pys2-from" label={t("pys2.act.attachFrom")}>
                    <Select id="pys2-from" value={aFrom} onChange={setAFrom} options={EFFECTIVE_DATES.filter((d) => d.at.m >= 9).map((d) => ({ value: d.key, label: dateStr(t, d.at) }))} />
                  </Field>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Button kind="primary" onClick={submitAttach}>{t("pys.confirm")}</Button>
                    <Button kind="quiet" onClick={() => { setAttaching(null); setAErr(false); }}>{t("pys.cancel")}</Button>
                  </div>
                </div>
              ) : (
                <div>
                  <Button kind="primary" iconLeft="payroll" onClick={() => { setAttaching("contract"); setDone(null); }}>{t("pys2.act.attach")}</Button>
                  <p style={ty("caption", { color: c.inkMuted, margin: "10px 0 0" })}>{t("pys2.act.attachSub")}</p>
                  <Note role="off" glyph="arrow" word={t("pys.absentWhy")}>{t("pys2.act.attachHidden")}</Note>
                </div>
              )}
              {deact === "contract" ? (
                <ReasonPrompt
                  idBase="pys2-deact"
                  title={t("pys2.act.deactOk")}
                  body={t("pys2.act.deactSub")}
                  options={["pys4.reason.policy", "pys4.reason.error", "pys4.reason.rate"]}
                  onConfirm={() => { setDeact(null); setDone(t("pys2.act.deactDone", { group: t(blocking.nameKey) })); }}
                  onCancel={() => setDeact(null)}
                />
              ) : null}
            </Card>
          </div>

        </div>
      </div>
    );
  }

  /* ============================================================
     PY-03 · SALARY STRUCTURE EDITOR
     "What is this salary made of?"

     Spec: screen-inventory PY-03 (all five actions built), §6.9
     SalaryStructure/PayComponent, M10 §Business rules + §Acceptance
     (the excluded-allowance limit is enforced AT SAVE and shown live).
     ============================================================ */
  const ALL_CODES = ["BASIC", "DA", "HRA", "SPL", "ACAD", "CONV", "MED"];

  function simFor(struct) {
    if (SIM[struct.key]) return SIM[struct.key];
    return struct.group === "teach" ? SIM.teach3 : SIM.admin2;
  }

  function StructuresTab({ goTab }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const L = G3.layout;
    const [openKey, setOpenKey] = useState("teach3");
    const [adding, setAdding] = useState(false);
    const [retiring, setRetiring] = useState(null);
    const [saveTried, setSaveTried] = useState(false);
    const [done, setDone] = useState(null);
    const [lop, setLop] = useState("0");

    /* add-component form */
    const [nCode, setNCode] = useState("");
    const [nCalc, setNCalc] = useState("");
    const [nValue, setNValue] = useState("");
    const [nOf, setNOf] = useState("BASIC");
    const [nFormula, setNFormula] = useState("");
    const [nTax, setNTax] = useState("");
    const [nPf, setNPf] = useState("");
    const [nEsi, setNEsi] = useState("");
    const [nErr, setNErr] = useState(null);
    const [badToken, setBadToken] = useState("");

    /* a derived fallback, never a bare null: the list always has a row
       and the panel always has something to show */
    const open = structByKey(openKey) || STRUCTURES[0];
    const sim = simFor(open);
    const lines = priceComponents(open, sim.basic, sim.gross);
    const verdict = wageVerdict(lines);
    const isDraft = open.state === "draft";

    /* the teaching rules are checked against pages/payslips.jsx's July
       payslip rather than trusted: if a rule ever stops producing her
       real components, the screen says so instead of quietly lying. */
    const PAYSLIP_CHECK = { BASIC: 39500, DA: 7900, HRA: 19750, ACAD: 6530, SPL: 21120 };
    const checkOk = open.key !== "teach3" || lines.every((l) => PAYSLIP_CHECK[l.code] === l.v);

    function resetAdd() {
      setNCode(""); setNCalc(""); setNValue(""); setNFormula(""); setNTax(""); setNPf(""); setNEsi("");
      setNErr(null); setBadToken("");
    }
    function submitAdd() {
      if (!nCode) { setNErr("code"); return; }
      if (!nCalc) { setNErr("calc"); return; }
      if (nCalc !== "formula" && !String(nValue).trim()) { setNErr("value"); return; }
      if (nCalc === "formula") {
        const known = open.comps.map((x) => x.code).concat(["GROSS"]);
        const tokens = (nFormula.toUpperCase().match(/[A-Z]{3,6}/g) || []).filter((x) => known.indexOf(x) === -1);
        if (tokens.length) { setBadToken(tokens[0]); setNErr("formula"); return; }
      }
      if (!nTax || !nPf || !nEsi) { setNErr("flags"); return; }
      setNErr(null);
      const base = lines.filter((l) => l.code === nOf)[0];
      const amt = nCalc === "flat" ? Number(nValue) || 0
        : nCalc === "pct" ? r2((base ? base.v : 0) * (Number(nValue) || 0) / 100)
          : 0;
      setDone(t("pys3.act.addDone", { code: nCode, amt: inr(amt) }));
      setAdding(false); resetAdd();
    }

    const cols = [
      { key: "name", label: t("pys3.col.name") },
      { key: "group", label: t("pys3.col.group"), width: 220 },
      { key: "from", label: t("pys3.col.from"), width: 160 },
      { key: "assigned", label: t("pys3.col.assigned"), align: "right", mono: true, width: 100 },
      { key: "state", label: t("pys3.col.state"), width: 180 },
      { key: "act", label: "", align: "right", width: 56 },
    ];

    function stateMark(s) {
      if (s.state === "inUse") return <StatusMark role="present" glyph="check" word={t("pys.st.inUse")} />;
      if (s.state === "draft") {
        const v = wageVerdict(priceComponents(s, simFor(s).basic, simFor(s).gross));
        return v.state === "over"
          ? <StatusMark role="absent" glyph="alert" word={t("pys.st.violation")} />
          : <StatusMark role="late" glyph="clock" word={t("pys.st.draft")} />;
      }
      return <StatusMark role="off" glyph="arrow" word={t("pys.st.superseded")} />;
    }

    const rows = STRUCTURES.map((s) => {
      const items = [
        { key: "open", icon: "document", label: t("pys3.open.title", { name: t(s.nameKey) }), onSelect: () => { setOpenKey(s.key); setDone(null); } },
        { key: "clone", icon: "filing", label: t("pys3.act.clone"), onSelect: () => setDone(t("pys3.act.cloneDone", { name: t(s.nameKey) })) },
        {
          key: "retire", icon: "signout", label: t("pys3.act.retire"),
          disabled: s.assigned > 0,
          reason: s.assigned > 0 ? t("pys3.act.retireWhy", { n: num(s.assigned), name: t(s.nameKey) }) : null,
          onSelect: () => { setRetiring(s.key); setOpenKey(s.key); setDone(null); },
        },
      ];
      return {
        id: s.key,
        highlight: s.key === open.key,
        tone: s.state === "superseded" ? "dim" : undefined,
        cells: {
          name: <LinkButton onClick={() => { setOpenKey(s.key); setDone(null); }}>{t(s.nameKey)}</LinkButton>,
          group: t(groupByKey(s.group).nameKey),
          from: dateStr(t, s.from),
          assigned: s.assigned === 0 ? "0" : num(s.assigned),
          state: stateMark(s),
          act: <ActionMenu ariaLabel={t("pys3.menuAria", { name: t(s.nameKey) })} items={items} />,
        },
      };
    });

    /* the simulator, priced end to end from the SIM row */
    const simRow = SIM[open.group === "teach" ? "teach3" : "admin2"].rows.filter((r) => String(r.lop) === lop)[0];
    const simBase = SIM[open.group === "teach" ? "teach3" : "admin2"];
    const simGross = r2(simBase.gross - dayRate(simBase.gross) * simRow.lop);
    const simDed = [
      { key: "pys3.c.PF", v: simRow.pf },
      { key: "pys3.c.ESI", v: simRow.esi },
      { key: "pys3.c.PT", v: simRow.pt },
      { key: "pys3.c.TDS", v: simRow.tds },
    ].filter((d) => d.v != null);
    const simDedTotal = simDed.reduce((s, d) => s + d.v, 0);
    const simNet = r2(simGross - simDedTotal);
    const simEmp = [
      { key: "pys3.c.PFER", v: simRow.pfEr },
      { key: "pys3.c.ESIER", v: simRow.esiEr },
      { key: "pys3.c.LWF", v: simRow.lwf },
    ].filter((d) => d.v != null);
    const simEmpTotal = simEmp.reduce((s, d) => s + d.v, 0);
    const simCost = r2(simGross + simEmpTotal);

    return (
      <div>
        <Register
          title={t("pys3.list.title")}
          sub={t("pys3.list.sub")}
          columns={cols}
          rows={rows}
          footer={<p style={ty("caption", { color: c.inkMuted, margin: 0 })}>{t("pys3.absent.rates")}</p>}
        />

        {done ? <DidIt onClose={() => setDone(null)}>{done}</DidIt> : null}

        <div style={{ display: "flex", gap: L.gap, marginTop: L.gap, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div style={{ flex: "1 1 620px", minWidth: 420 }}>
            <Card icon="payroll" iconTone="accent"
              title={t(open.nameKey)}
              sub={isDraft
                ? t("pys3.open.subDraft", { group: t(groupByKey(open.group).nameKey), d: dateStr(t, open.from) })
                : t("pys3.open.sub", { group: t(groupByKey(open.group).nameKey), d: dateStr(t, open.from), n: num(open.assigned) })}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                {stateMark(open)}
                {open.supersededBy
                  ? <Chip bg={c.sunken} fg={c.inkMuted}>{t("pys.supersede", { what: t(structByKey(open.supersededBy).nameKey), d: dateStr(t, open.supersededOn) })}</Chip>
                  : null}
              </div>

              <div style={ty("h3", { color: c.ink, margin: "0 0 2px" })}>{t("pys3.comp.title")}</div>
              <div style={ty("small", { color: c.inkMuted, marginBottom: 10 })}>{t("pys3.comp.sub")}</div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid " + c.ruleStrong }}>
                    <th scope="col" style={ty("colLabel", { color: c.inkFaint, textAlign: "left", padding: "0 8px 9px", textTransform: "uppercase", width: 74 })}>{t("pys3.col.code")}</th>
                    <th scope="col" style={ty("colLabel", { color: c.inkFaint, textAlign: "left", padding: "0 8px 9px", textTransform: "uppercase" })}>{t("pys3.col.name2")}</th>
                    <th scope="col" style={ty("colLabel", { color: c.inkFaint, textAlign: "left", padding: "0 8px 9px", textTransform: "uppercase", width: 210 })}>{t("pys3.col.calc")}</th>
                    <th scope="col" style={ty("colLabel", { color: c.inkFaint, textAlign: "left", padding: "0 8px 9px", textTransform: "uppercase", width: 250 })}>{t("pys3.col.flags")}</th>
                    <th scope="col" style={ty("colLabel", { color: c.inkFaint, textAlign: "right", padding: "0 8px 9px", textTransform: "uppercase", width: 120 })}>{t("pys3.col.amount")}</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l, i) => (
                    <tr key={l.code} style={{ borderBottom: i < lines.length - 1 ? "1px solid " + c.rule : "none" }}>
                      <td style={G3.fig("sm", { padding: "9px 8px", color: c.ink, fontWeight: 600 })}>{l.code}</td>
                      <td style={ty("small", { padding: "9px 8px", color: c.ink })}>{t("pys3.c." + l.code)}</td>
                      <td style={ty("caption", { padding: "9px 8px", color: c.inkMuted })}>
                        {l.cp.calc === "grade" ? t("pys3.calc.grade")
                          : l.cp.calc === "balance" ? t("pys3.calc.balance")
                            : l.cp.calc === "flat" ? t("pys3.calc.flat", { v: inr(l.cp.value) })
                              : t("pys3.calc.pct", { p: pctStr(l.cp.pct), of: t("pys3.c." + l.cp.of) })}
                      </td>
                      <td style={{ padding: "9px 8px" }}><FlagRow cp={l.cp} /></td>
                      <td style={{ padding: "9px 8px", textAlign: "right" }}>
                        <Figure value={inr(l.v)} size="sm" weight={600} color={c.ink} align="right" />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: "2px solid " + c.ruleStrong }}>
                    <td colSpan={4} style={ty("small", { padding: "12px 8px", color: c.ink, fontWeight: 700 })}>{t("pys3.comp.total")}</td>
                    <td style={{ padding: "12px 8px", textAlign: "right" }}>
                      <Figure value={inr(grossOf(lines))} size="md" weight={700} color={c.ink} align="right" />
                    </td>
                  </tr>
                </tfoot>
              </table>

              {checkOk ? null : (
                <Note role="absent" glyph="alert" word={t("pys.st.violation")}>{t("pys3.warn.drift")}</Note>
              )}
              <Note role="off" glyph="alert" word={t("pys3.flag.pf")}>{t("pys3.warn.pf")}</Note>

              <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid " + c.rule, display: "flex", gap: 12, flexWrap: "wrap" }}>
                {isDraft ? (
                  <Button kind="secondary" iconLeft="list" onClick={() => { setAdding(true); setDone(null); }}>{t("pys3.act.add")}</Button>
                ) : (
                  <Button kind="secondary" iconLeft="filing" onClick={() => setDone(t("pys3.act.cloneDone", { name: t(open.nameKey) }))}>{t("pys3.act.clone")}</Button>
                )}
                {isDraft ? (
                  <div style={{ minWidth: 240 }}>
                    <Field id="pys3-savefrom" label={t("pys3.act.saveFrom")} hint={t("pys3.act.saveSub")}>
                      <Input id="pys3-savefrom" value={dateStr(t, open.from)} readOnly />
                    </Field>
                  </div>
                ) : null}
                {isDraft ? (
                  <Button kind="primary" iconLeft="check" onClick={() => {
                    setSaveTried(true);
                    if (verdict.state !== "over") {
                      setDone(t("pys3.act.saveDone", {
                        v: String(open.version), d: dateStr(t, open.from),
                        old: t(structByKey(open.supersedes).nameKey),
                      }));
                    }
                  }}>{t("pys3.act.save")}</Button>
                ) : (
                  <OffAction label={t("pys3.act.save")} kind="primary" iconLeft="check" reason={t("pys3.act.saveOnDraft")} />
                )}
              </div>

              {isDraft && saveTried && verdict.state === "over" ? (
                <div role="alert" style={{ marginTop: 14, background: c.dangerTint, borderRadius: G3.r.lg, padding: "14px 16px" }}>
                  <div style={{ display: "flex", gap: 9, alignItems: "center", marginBottom: 6 }}>
                    <span aria-hidden="true" style={{ color: c.dangerText, display: "flex" }}><Icon name="alert" size={16} /></span>
                    <span style={ty("small", { color: c.dangerText, fontWeight: 700 })}>{t("pys3.act.saveRefused", { amt: inr(verdict.over) })}</span>
                  </div>
                  <p style={ty("small", { color: c.ink, margin: "0 0 8px" })}>
                    {t("pys3.rule.overWho", { list: verdict.offenders.map((o) => t("pys3.c." + o.code) + " " + inr(o.v)).join(" · ") })}
                  </p>
                  <p style={ty("caption", { color: c.inkMuted, margin: 0 })}>{t("pys3.act.saveRefusedWhy")}</p>
                </div>
              ) : null}

              {adding ? (
                <div style={{ marginTop: 16, background: c.raised, border: "1px solid " + c.borderStrong, borderRadius: G3.r.lg, padding: "16px 18px 4px" }}>
                  <div style={ty("h3", { color: c.ink, margin: "0 0 4px" })}>{t("pys3.act.add")}</div>
                  <p style={ty("small", { color: c.inkMuted, margin: "0 0 6px" })}>{t("pys3.act.addSub")}</p>
                  <p style={ty("caption", { color: c.inkMuted, margin: "0 0 14px" })}>{t("pys3.warn.circular")}</p>
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                    <div style={{ flex: "1 1 220px", minWidth: 200 }}>
                      <Field id="pys3-code" label={t("pys3.act.addCode")} error={nErr === "code" ? t("pys3.act.errCode") : null}>
                        <Select id="pys3-code" value={nCode} onChange={setNCode} options={[{ value: "", label: t("pys3.act.addCodePick") }].concat(
                          ALL_CODES.filter((cd) => open.comps.every((x) => x.code !== cd)).map((cd) => ({ value: cd, label: cd + " · " + t("pys3.c." + cd) }))
                        )} />
                      </Field>
                    </div>
                    <div style={{ flex: "1 1 220px", minWidth: 200 }}>
                      <Field id="pys3-calc" label={t("pys3.act.addCalc")} error={nErr === "calc" ? t("pys3.act.errCalc") : null}>
                        <Select id="pys3-calc" value={nCalc} onChange={setNCalc} options={[
                          { value: "", label: t("pys3.act.addCalcPick") },
                          { value: "flat", label: t("pys3.act.calc.flat") },
                          { value: "pct", label: t("pys3.act.calc.pct") },
                          { value: "formula", label: t("pys3.act.calc.formula") },
                        ]} />
                      </Field>
                    </div>
                    {nCalc === "formula" ? (
                      <div style={{ flex: "1 1 320px", minWidth: 260 }}>
                        <Field id="pys3-formula" label={t("pys3.act.addFormula")} error={nErr === "formula" ? t("pys3.act.errFormula", { what: badToken }) : null}>
                          <Input id="pys3-formula" value={nFormula} onChange={setNFormula} placeholder={t("pys3.act.addFormulaPh")} />
                        </Field>
                      </div>
                    ) : (
                      <div style={{ flex: "1 1 180px", minWidth: 160 }}>
                        <Field id="pys3-value" label={nCalc === "pct" ? t("pys3.act.addPct") : t("pys3.act.addValue")} error={nErr === "value" ? t("pys3.act.errValue") : null}>
                          <Input id="pys3-value" value={nValue} onChange={setNValue} inputMode="decimal" />
                        </Field>
                      </div>
                    )}
                    {nCalc === "pct" ? (
                      <div style={{ flex: "1 1 200px", minWidth: 180 }}>
                        <Field id="pys3-of" label={t("pys3.act.addOf")}>
                          <Select id="pys3-of" value={nOf} onChange={setNOf} options={open.comps.filter((x) => x.calc !== "balance").map((x) => ({ value: x.code, label: t("pys3.c." + x.code) }))} />
                        </Field>
                      </div>
                    ) : null}
                  </div>
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                    {[
                      { id: "pys3-tax", labelKey: "pys3.flag.tax", v: nTax, set: setNTax },
                      { id: "pys3-pf", labelKey: "pys3.flag.pf", v: nPf, set: setNPf },
                      { id: "pys3-esi", labelKey: "pys3.flag.esi", v: nEsi, set: setNEsi },
                    ].map((f) => (
                      <div key={f.id} style={{ flex: "1 1 180px", minWidth: 160 }}>
                        <Field id={f.id} label={t(f.labelKey)} error={nErr === "flags" && !f.v ? t("pys3.act.errFlags") : null}>
                          <Select id={f.id} value={f.v} onChange={f.set} options={[
                            { value: "", label: t("pys3.act.flagUnset") },
                            { value: "yes", label: t("pys3.flag.yes") },
                            { value: "no", label: t("pys3.flag.no") },
                          ]} />
                        </Field>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", paddingBottom: 16 }}>
                    <Button kind="primary" onClick={submitAdd}>{t("pys.confirm")}</Button>
                    <Button kind="quiet" onClick={() => { setAdding(false); resetAdd(); }}>{t("pys.cancel")}</Button>
                  </div>
                </div>
              ) : null}

              {retiring === open.key ? (
                open.assigned > 0 ? (
                  <div style={{ marginTop: 14 }}>
                    <OffAction
                      label={t("pys3.act.retire")}
                      reason={t("pys3.act.retireWhy", { n: num(open.assigned), name: t(open.nameKey) })}
                      extra={<LinkButton onClick={() => goTab("people")}>{t("pys3.act.retireGo", { n: num(open.assigned) })}</LinkButton>}
                    />
                  </div>
                ) : (
                  <ReasonPrompt
                    idBase="pys3-retire"
                    title={t("pys3.act.retire")}
                    body={t("pys3.act.retireOk")}
                    options={["pys4.reason.policy", "pys4.reason.error", "pys4.reason.rate"]}
                    onConfirm={() => { setRetiring(null); setDone(t("pys3.act.retireDone", { name: t(open.nameKey), d: dateStr(t, open.from) })); }}
                    onCancel={() => setRetiring(null)}
                  />
                )
              ) : null}
            </Card>

            <div style={{ marginTop: L.gap }}>
            <ColorCard kind="brass" icon="filing" iconTone="brass" title={t("pys3.rule.title")} sub={t("pys3.rule.sub")}>
              <div style={{ marginTop: 2 }}>
                {[
                  { label: t("pys3.rule.wages"), v: verdict.wages },
                  { label: t("pys3.rule.excluded"), v: verdict.excluded },
                ].map((rw) => (
                  <div key={rw.label} style={{ display: "flex", alignItems: "baseline", gap: 12, padding: "7px 0" }}>
                    <span style={ty("small", { color: c.onBrassMuted, flex: 1, minWidth: 0 })}>{rw.label}</span>
                    <Figure value={inr(rw.v)} size="md" weight={600} color={"inherit"} align="right" />
                  </div>
                ))}
                <div style={{ display: "flex", alignItems: "baseline", gap: 12, padding: "11px 0 4px", borderTop: "1px solid " + c.onBrassRule, marginTop: 5 }}>
                  <span style={ty("small", { color: "inherit", fontWeight: 700, flex: 1, minWidth: 0 })}>{t("pys3.rule.total")}</span>
                  <Figure value={inr(verdict.gross)} size={22} weight={700} color={"inherit"} align="right" />
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 12, padding: "7px 0" }}>
                  <span style={ty("small", { color: c.onBrassMuted, flex: 1, minWidth: 0 })}>{t("pys3.rule.limit")}</span>
                  <Figure value={inr(verdict.limit)} size="md" weight={600} color={"inherit"} align="right" />
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 12, padding: "7px 0" }}>
                  <span style={ty("small", { color: c.onBrassMuted, flex: 1, minWidth: 0 })}>{t("pys3.rule.share")}</span>
                  <Figure value={pctStr(verdict.share)} size="md" weight={600} color={"inherit"} align="right" />
                </div>
              </div>
              <div style={{ marginTop: 12, background: c.onBrassWash, borderRadius: G3.r.md, padding: "11px 13px", display: "flex", gap: 9, alignItems: "flex-start" }}>
                <span aria-hidden="true" style={{ color: "inherit", display: "flex", paddingTop: 1 }}>
                  <Icon name={verdict.state === "over" ? "alert" : verdict.state === "at" ? "half" : "check"} size={15} />
                </span>
                <span style={ty("small", { color: "inherit", fontWeight: 600 })}>
                  {verdict.state === "over"
                    ? t("pys3.rule.over", { amt: inr(verdict.over) })
                    : verdict.state === "at"
                      ? t("pys3.rule.okAt")
                      : t("pys3.rule.ok", { amt: inr(-verdict.over) })}
                </span>
              </div>
              <p style={ty("caption", { color: c.onBrassMuted, margin: "12px 0 0" })}>
                {t("pys3.rule.src", { v: WAGE_RULE.cfg.v })}
              </p>
              <p style={ty("caption", { color: c.onBrassMuted, margin: "5px 0 0" })}>
                {t("pys.cfg.who", { who: t(CFG_PUBLISHED.by), d: dateStr(t, CFG_PUBLISHED.at) })}
              </p>
            </ColorCard>
            </div>
          </div>

          <div style={{ flex: "1 1 420px", minWidth: 370 }}>
            <Card icon="scan" iconTone="info" title={t("pys3.sim.title")} sub={t("pys3.sim.sub")}>
              <div style={{ marginBottom: 4 }}>
                <Field id="pys3-sim-person" label={t("pys3.sim.sample")}>
                  <div style={ty("small", { color: c.ink, fontWeight: 600, paddingTop: 2 })} id="pys3-sim-person">
                    {t(simBase.personKey, { b: inr(simBase.basic) })}
                  </div>
                </Field>
                <Field id="pys3-sim-days" label={t("pys3.sim.days")}>
                  <Select id="pys3-sim-days" value={lop} onChange={setLop} options={[
                    { value: "0", label: t("pys3.sim.daysFull") },
                    { value: "1", label: t("pys3.sim.days1") },
                    { value: "2", label: t("pys3.sim.days2") },
                  ]} />
                </Field>
              </div>
              <p style={ty("caption", { color: c.inkMuted, margin: "0 0 10px" })}>
                {t("pys3.sim.dayRate", { amt: inr(dayRate(simBase.gross)) })}
              </p>

              <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 4 })}>{t("pys3.sim.earn")}</div>
              <EqRow sign={" "} label={t("pys3.sim.gross")} value={simGross} />
              <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 8 })}>{t("pys3.sim.ded")}</div>
              {simDed.map((d) => (
                <EqRow key={d.key} sign={"−"} label={t(d.key)} value={d.v}
                  note={d.key === "pys3.c.TDS" && d.v === 0 ? t("pys3.sim.tdsNil") : null} />
              ))}
              <EqRow sign={"="} label={t("pys3.sim.net")} value={simNet} strong rule />
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid " + c.rule }}>
                <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 })}>{t("pys3.sim.employer")}</div>
                {simEmp.map((d) => <EqRow key={d.key} sign={"+"} label={t(d.key)} value={d.v} />)}
                <EqRow sign={"="} label={t("pys3.sim.cost")} value={simCost} strong rule />
                <EqRow sign={"×"} label={t("pys3.sim.annual")} value={r2(simCost * 12)} />
              </div>
              {simRow.esi == null ? (
                <Note role="off" glyph="arrow" word={t("pys3.flag.esi")}>{t("pys3.sim.esiNo", { v: CFG_PINNED.v })}</Note>
              ) : null}
              <p style={ty("caption", { color: c.inkMuted, margin: "12px 0 0" })}>{t("pys3.sim.statNote", { v: CFG_PINNED.v })}</p>
              <ConfigLine cfg={CFG_PINNED} run={RUN_AUG} />
              <p style={ty("caption", { color: c.inkFaint, margin: "12px 0 0" })}>{t("pys.cfg.noRates")}</p>
              <p style={ty("caption", { color: c.inkFaint, margin: "8px 0 0" })}>{t("pys3.absent.people")}</p>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  /* ============================================================
     PY-04 · HONORARIUM RULES
     "How do we pay guest and per-lecture faculty?"

     Spec: screen-inventory PY-04 (all three actions built, including
     the [proposed] unit-entry surface the inventory calls REQUIRED for
     MVP), §6.9 HonorariumRule, M10 §Business rules ("per-lecture
     honorarium with monthly cap"), M10 §Acceptance (a CTC teacher and
     a per-lecture guest paid correctly in one pass).
     ============================================================ */
  function HonorariumTab({ goTab, onNavigate }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const L = G3.layout;
    const [creating, setCreating] = useState(false);
    const [revising, setRevising] = useState(null);
    const [done, setDone] = useState(null);

    const [rName, setRName] = useState("");
    const [rUnit, setRUnit] = useState("");
    const [rRate, setRRate] = useState("");
    const [rCap, setRCap] = useState("");
    const [rErr, setRErr] = useState(null);

    const [nRate, setNRate] = useState("");
    const [nFrom, setNFrom] = useState("2026-09-01");
    const [nErr, setNErr] = useState(null);

    function submitCreate() {
      if (!rName.trim()) { setRErr("name"); return; }
      if (!rUnit) { setRErr("unit"); return; }
      if (!String(rRate).trim() || Number(rRate) <= 0) { setRErr("rate"); return; }
      if (!String(rCap).trim() || Number(rCap) <= 0) { setRErr("cap"); return; }
      setRErr(null);
      setDone(t("pys4.act.createDone", {
        name: rName.trim(), rate: t("pys4.perUnit", { amt: inr(Number(rRate)), unit: t("pys4.unit." + rUnit) }),
        cap: inr(Number(rCap)), n: num(Math.floor(Number(rCap) / Number(rRate))),
      }));
      setCreating(false); setRName(""); setRUnit(""); setRRate(""); setRCap("");
    }

    const cols = [
      { key: "rule", label: t("pys4.col.rule") },
      { key: "unit", label: t("pys4.col.unit"), width: 110 },
      { key: "rate", label: t("pys4.col.rate"), align: "right", mono: true, width: 120 },
      { key: "cap", label: t("pys4.col.cap"), align: "right", width: 260 },
      { key: "people", label: t("pys4.col.people"), align: "right", mono: true, width: 100 },
      { key: "from", label: t("pys4.col.from"), width: 130 },
      { key: "act", label: "", align: "right", width: 56 },
    ];

    const rows = HON_RULES.map((rl) => ({
      id: rl.key,
      highlight: revising === rl.key,
      cells: {
        rule: <span style={ty("small", { color: c.ink, fontWeight: 700 })}>{t(rl.nameKey)}</span>,
        unit: t("pys4.unit." + rl.unit),
        rate: inr(rl.rate),
        cap: (
          <span style={{ display: "block", textAlign: "right" }}>
            <Figure value={inr(rl.cap)} size="sm" weight={600} color={c.ink} align="right" />
            <span style={ty("caption", { color: c.inkMuted, display: "block" })}>
              {t("pys4.capReach", { n: num(capUnits(rl)), unit: t("pys4.unit." + rl.unit) })}
            </span>
          </span>
        ),
        people: num(rl.people),
        from: dateStr(t, rl.from),
        act: (
          <ActionMenu
            ariaLabel={t("pys4.menuAria", { name: t(rl.nameKey) })}
            items={[
              { key: "rate", icon: "payroll", label: t("pys4.act.editRate"), onSelect: () => { setRevising(rl.key); setNRate(""); setDone(null); } },
              { key: "people", icon: "staff", label: t("pys5.act.open"), onSelect: () => goTab("people") },
            ]}
          />
        ),
      },
    }));

    const rev = revising ? honByKey(revising) : null;
    const revFrom = EFFECTIVE_DATES.filter((d) => d.key === nFrom)[0];
    const revRetro = revFrom && periodOf(revFrom.at.m) && periodOf(revFrom.at.m).state !== "open";

    const unitSorted = UNIT_ROWS.slice().sort((a, b) => unitPayable(b) - unitPayable(a));
    const capped = unitSorted.filter((u) => unitHeld(u) > 0);

    const uCols = [
      { key: "who", label: t("pys4.col.who"), width: 260 },
      { key: "rule", label: t("pys4.col.rule") },
      { key: "units", label: t("pys4.col.units"), align: "right", mono: true, width: 90 },
      { key: "raw", label: t("pys4.col.raw"), align: "right", mono: true, width: 150 },
      { key: "payable", label: t("pys4.col.payable"), align: "right", mono: true, width: 150 },
      { key: "state", label: t("pys2.col.state"), width: 150 },
    ];
    const uRows = unitSorted.map((u) => ({
      id: u.id,
      cells: {
        who: (
          <span style={{ whiteSpace: "nowrap" }}>
            <span style={ty("small", { color: c.ink, fontWeight: 700, display: "block" })}>{t(u.nameKey)}</span>
            <span style={G3.fig("xs", { color: c.inkFaint })}>{u.id}</span>
          </span>
        ),
        rule: t(honByKey(u.rule).nameKey),
        units: num(u.units),
        raw: inr(unitRaw(u)),
        payable: inr(unitPayable(u)),
        state: unitHeld(u) > 0
          ? <StatusMark role="late" glyph="alert" word={t("pys.st.capped")} />
          : <StatusMark role="present" glyph="check" word={t("pys.st.approved")} />,
      },
    }));

    return (
      <div>
        <div>
          <div>
            <Register
              title={t("pys4.rules.title")}
              sub={t("pys4.rules.sub", { n: num(HON_PEOPLE) })}
              action={<Button kind="primary" iconLeft="list" onClick={() => { setCreating(true); setDone(null); }}>{t("pys4.act.create")}</Button>}
              columns={cols}
              rows={rows}
              totals={{ label: t("pys4.totals"), cells: { rule: t("pys4.totals"), people: num(HON_PEOPLE) } }}
              footer={<p style={ty("caption", { color: c.inkMuted, margin: 0 })}>{t("pys4.absent.ctc")}</p>}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: L.gap, marginTop: L.gap, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div style={{ flex: "1 1 380px", minWidth: 330 }}>
            <ColorCard kind="brass" icon="alert" iconTone="brass" title={t("pys4.gap.title")}>
              <p style={ty("small", { color: "inherit", margin: "0 0 10px" })}>{t("pys4.gap.body")}</p>
              <p style={ty("caption", { color: c.onBrassMuted, margin: 0 })}>{t("pys4.gap.spec")}</p>
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid " + c.onBrassRule }}>
                <p style={ty("caption", { color: c.onBrassMuted, margin: 0 })}>{t("pys4.absent.rates")}</p>
              </div>
            </ColorCard>
          </div>
        </div>

        {done ? <DidIt onClose={() => setDone(null)}>{done}</DidIt> : null}

        {creating ? (
          <Card style={{ marginTop: L.gap }} icon="list" iconTone="accent" title={t("pys4.act.create")} sub={t("pys4.act.createSub")}>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", maxWidth: 900 }}>
              <div style={{ flex: "1 1 300px", minWidth: 260 }}>
                <Field id="pys4-name" label={t("pys4.act.ruleName")} error={rErr === "name" ? t("pys4.act.errName") : null}>
                  <Input id="pys4-name" value={rName} onChange={setRName} placeholder={t("pys4.act.ruleNamePh")} />
                </Field>
              </div>
              <div style={{ flex: "1 1 200px", minWidth: 190 }}>
                <Field id="pys4-unit" label={t("pys4.act.unit")} error={rErr === "unit" ? t("pys4.act.errUnit") : null}>
                  <Select id="pys4-unit" value={rUnit} onChange={setRUnit} options={[{ value: "", label: t("pys4.act.unitPick") }].concat(
                    ["lecture", "day", "period"].map((u) => ({ value: u, label: t("pys4.unit." + u) }))
                  )} />
                </Field>
              </div>
              <div style={{ flex: "1 1 180px", minWidth: 170 }}>
                <Field id="pys4-rate" label={t("pys4.act.rate")} error={rErr === "rate" ? t("pys4.act.errRate") : null}>
                  <Input id="pys4-rate" value={rRate} onChange={setRRate} inputMode="decimal" />
                </Field>
              </div>
              <div style={{ flex: "1 1 180px", minWidth: 170 }}>
                <Field id="pys4-cap" label={t("pys4.act.cap")} hint={t("pys4.act.capHint")} error={rErr === "cap" ? t("pys4.act.errCap") : null}>
                  <Input id="pys4-cap" value={rCap} onChange={setRCap} inputMode="decimal" />
                </Field>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Button kind="primary" onClick={submitCreate}>{t("pys.confirm")}</Button>
              <Button kind="quiet" onClick={() => { setCreating(false); setRErr(null); }}>{t("pys.cancel")}</Button>
            </div>
          </Card>
        ) : null}

        {rev ? (
          <Card style={{ marginTop: L.gap }} icon="payroll" iconTone="accent" title={t("pys4.act.editRate")} sub={t("pys4.act.editRateSub")}>
            <ReasonPrompt
              idBase="pys4-rate"
              title={t(rev.nameKey)}
              body={t("pys4.perUnit", { amt: inr(rev.rate), unit: t("pys4.unit." + rev.unit) })}
              options={["pys4.reason.rate", "pys4.reason.market", "pys4.reason.error", "pys4.reason.policy"]}
              extra={
                <div>
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                    <div style={{ flex: "1 1 200px", minWidth: 180 }}>
                      <Field id="pys4-newrate" label={t("pys4.act.newRate")}
                        error={nErr === "rate" ? t("pys4.act.errRate") : nErr === "same" ? t("pys4.act.errRateSame") : null}>
                        <Input id="pys4-newrate" value={nRate} onChange={setNRate} inputMode="decimal" />
                      </Field>
                    </div>
                    <div style={{ flex: "1 1 220px", minWidth: 200 }}>
                      <Field id="pys4-newfrom" label={t("pys4.act.editFrom")}>
                        <Select id="pys4-newfrom" value={nFrom} onChange={setNFrom}
                          options={EFFECTIVE_DATES.map((d) => ({ value: d.key, label: dateStr(t, d.at) }))} />
                      </Field>
                    </div>
                  </div>
                  {revRetro ? <Note role="late" glyph="alert" word={t("pys.st.locked")}>{t("pys4.act.editRetro")}</Note> : null}
                </div>
              }
              onConfirm={() => {
                if (!String(nRate).trim() || Number(nRate) <= 0) { setNErr("rate"); return; }
                if (Number(nRate) === rev.rate) { setNErr("same"); return; }
                setNErr(null);
                setDone(t("pys4.act.editDone", {
                  name: t(rev.nameKey), amt: inr(Number(nRate)), unit: t("pys4.unit." + rev.unit),
                  d: dateStr(t, revFrom.at), run: RUN_AUG,
                }));
                setRevising(null);
              }}
              onCancel={() => { setRevising(null); setNErr(null); }}
            />
          </Card>
        ) : null}

        <div style={{ marginTop: L.gap }}>
          <div>
            <Register
              title={t("pys4.units.title")}
              sub={t("pys4.units.sub", { shown: num(UNIT_ROWS.length), total: num(HON_PEOPLE) })}
              chips={[
                <Chip key="lock" bg={c.sunken} fg={c.inkMuted}>
                  <span aria-hidden="true" style={{ display: "flex" }}><Icon name="lock" size={12} /></span>
                  <span>{t("pys.st.locked") + " · " + RUN_AUG}</span>
                </Chip>,
              ]}
              columns={uCols}
              rows={uRows}
              totals={{
                label: t("pys4.units.subtotal", { n: num(UNIT_ROWS.length) }),
                cells: {
                  who: t("pys4.units.subtotal", { n: num(UNIT_ROWS.length) }),
                  units: num(UNIT_ROWS.reduce((s, u) => s + u.units, 0)),
                  raw: inr(UNIT_ROWS.reduce((s, u) => s + unitRaw(u), 0)),
                  payable: inr(UNITS_SUBTOTAL),
                },
              }}
              footer={<p style={ty("caption", { color: c.inkMuted, margin: 0 })}>{t("pys4.units.notTotal", { run: RUN_AUG })}</p>}
            />
            {capped.map((u) => (
              <Note key={u.id} role="late" glyph="alert" word={t("pys.st.capped")}>
                {t("pys4.units.capNote", {
                  name: t(u.nameKey), n: num(u.units), unit: t("pys4.unit." + honByKey(u.rule).unit),
                  amt: inr(unitHeld(u)),
                })}
              </Note>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: L.gap, marginTop: L.gap, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div style={{ flex: "1 1 380px", minWidth: 330 }}>
            <Card icon="lock" iconTone="off" title={t("pys4.lock.title")} sub={t("pys4.lock.body", { run: RUN_AUG, who: t(CHECKER.nameKey) })}>
              <OffAction
                label={t("pys4.act.enter")}
                kind="primary"
                iconLeft="list"
                reason={t("pys4.act.enterWhy", { who: t(CHECKER.nameKey) })}
                extra={<LinkButton onClick={() => (onNavigate ? onNavigate("pyRun") : null)}>{t("pys4.act.enterGo")}</LinkButton>}
              />
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid " + c.rule }}>
                <Fact label={t("pys4.units.attrib")}>
                  <div style={ty("small", { color: c.ink })}>{t("pys4.units.enteredBy", { who: person(t, UNITS_ENTERED.by), d: dateStr(t, UNITS_ENTERED.at) })}</div>
                  <div style={ty("small", { color: c.ink, marginTop: 6 })}>{t("pys4.units.approvedBy", { who: person(t, UNITS_APPROVED.by), d: dateStr(t, UNITS_APPROVED.at) })}</div>
                </Fact>
                <p style={ty("caption", { color: c.inkMuted, margin: "10px 0 0" })}>{t("pys4.units.twoPeople")}</p>
              </div>
            </Card>

          </div>

          <div style={{ flex: "1 1 380px", minWidth: 330 }}>
            <Card icon="filing" iconTone="off" title={t("pys4.hist.title")} sub={t("pys4.hist.sub")}>
              {HON_RULES.filter((rl) => rl.prev).map((rl) => (
                <div key={rl.key} style={{ paddingBottom: 12 }}>
                  <div style={ty("small", { color: c.ink, fontWeight: 700 })}>{t(rl.nameKey)}</div>
                  <div style={ty("small", { color: c.inkMuted, marginTop: 3 })}>
                    {t("pys4.hist.row", {
                      amt: inr(rl.prev.rate), unit: t("pys4.unit." + rl.unit),
                      from: dateStr(t, rl.prev.from), to: dateStr(t, rl.prev.to),
                    })}
                  </div>
                  <div style={ty("caption", { color: c.inkFaint, marginTop: 4 })}>
                    {t("pys4.hist.by", { who: person(t, rl.prev.by), d: dateStr(t, rl.prev.at), reason: t(rl.prev.reasonKey) })}
                  </div>
                </div>
              ))}
              <p style={ty("caption", { color: c.inkMuted, margin: "4px 0 0" })}>{t("pys.appendOnly")}</p>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  /* ============================================================
     PY-05 · EMPLOYEE SALARY AND REVISIONS
     "What does this person earn, from when?"

     Spec: screen-inventory PY-05 (all six actions built), §6.9
     EmployeeSalary, §4.3 (supersede, never edit), M10 §Business rules
     (effective-dated salary), M10 arrears (month-split, each on its own
     pinned version, distinct checker), O18, A47.
     ============================================================ */
  function runFor(m) {
    const p = periodOf(m);
    if (p && p.run) return p.run;
    return "PR-2026-" + (m < 10 ? "0" + String(m) : String(m));
  }
  /* the engine's own output for the two people the simulator holds —
     printed as amounts beside the version, never derived from a rate */
  function engineFor(p) {
    if (p.id === "NAV-0142") return SIM.teach3.rows[0];
    if (p.id === "NAV-0054") return SIM.admin2.rows[0];
    return null;
  }

  function PeopleTab({ goTab }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const L = G3.layout;
    const [selectedId, setSelectedId] = useState("NAV-0142");
    const [checked, setChecked] = useState({});
    const [revising, setRevising] = useState(false);
    const [assigning, setAssigning] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [bulkOpen, setBulkOpen] = useState(false);
    const [done, setDone] = useState(null);

    const [newGross, setNewGross] = useState("");
    const [effKey, setEffKey] = useState(DEFAULT_EFFECTIVE);
    const [reason, setReason] = useState("");
    const [rErr, setRErr] = useState(null);
    const [structPick, setStructPick] = useState("");

    const [bMode, setBMode] = useState("pct");
    const [bAmt, setBAmt] = useState("");
    const [bFrom, setBFrom] = useState(DEFAULT_EFFECTIVE);
    const [bErr, setBErr] = useState(null);

    /* a derived fallback, not a bare null — the panel always has a
       subject even if the id ever stops matching a row */
    const sel = staffById(selectedId) || STAFF[0];

    /* WHICH STRUCTURE A NEW JOINER GOES ON is a real choice — a pay
       group can carry more than one in use — and the control that
       offered it was throwing the answer away. The pick defaults to
       whatever the person already carries, or to the first structure
       the group has in use when they carry none, and it is what the
       confirmation names. */
    const structOptions = STRUCTURES.filter(function (x) {
      return x.group === sel.group && x.state === "inUse";
    });
    const structDefault = structureFor(sel)
      ? structureFor(sel).key
      : (structOptions[0] ? structOptions[0].key : "");
    const structValue = structOptions.some(function (x) { return x.key === structPick; })
      ? structPick
      : structDefault;
    const structChosen = STRUCTURES.filter(function (x) { return x.key === structValue; })[0] || null;
    const selLines = linesFor(sel);
    const eff = EFFECTIVE_DATES.filter((d) => d.key === effKey)[0];
    const effPeriod = periodOf(eff.at.m);
    const delta = sel.gross != null && String(newGross).trim() !== "" ? r2(Number(newGross) - sel.gross) : null;
    const schedule = (delta != null && delta !== 0 && effPeriod.state === "paid")
      ? arrearsSchedule(sel, eff.at.m, delta) : null;
    const scheduleTotal = schedule ? schedule.reduce((s, x) => s + x.amt, 0) : 0;
    const scheduleFiled = schedule ? schedule.filter((x) => x.filed).length : 0;

    const checkedIds = Object.keys(checked).filter((k) => checked[k]);
    const bulkEligible = checkedIds.map(staffById).filter((p) => p && p.gross != null && !p.pending);
    const bulkExcluded = checkedIds.map(staffById).filter((p) => p && (p.gross == null || p.pending));
    function newGrossOf(p) {
      const a = Number(bAmt) || 0;
      return bMode === "pct" ? r2(p.gross * (1 + a / 100)) : r2(p.gross + a);
    }
    const bulkRows = bulkEligible.map((p) => ({ p: p, next: newGrossOf(p), d: r2(newGrossOf(p) - p.gross) }));
    const bulkTotal = bulkRows.reduce((s, x) => s + x.d, 0);
    /* the grade basic moves in the same proportion, so the wage base
       keeps its share — checked here rather than asserted in copy */
    const bulkAllPass = bulkRows.every((x) => {
      const st = structureFor(x.p);
      if (!st || x.p.gross === 0) return true;
      const ratio = x.next / x.p.gross;
      return wageVerdict(priceComponents(st, r2(x.p.basic * ratio), x.next)).state !== "over";
    });

    function submitRevise() {
      if (!String(newGross).trim()) { setRErr("gross"); return; }
      if (Number(newGross) === sel.gross) { setRErr("same"); return; }
      /* the lock is checked BEFORE the reason: a date that cannot be
         used is the blocking fact, and asking for a reason first would
         hide it behind a second click. */
      if (effPeriod.state === "withChecker") { setRErr("locked"); return; }
      if (!reason) { setRErr("reason"); return; }
      setRErr(null);
      setDone(t("pys5.act.submitDone", {
        who: t(CHECKER.nameKey), role: t(CHECKER.roleKey), name: t(sel.nameKey),
      }));
      setRevising(false); setNewGross(""); setReason("");
    }
    function submitAssign() {
      if (!String(newGross).trim()) { setRErr("gross"); return; }
      setRErr(null);
      const st = structChosen || structureFor(sel);
      setDone(t("pys5.act.assignDone", {
        name: t(sel.nameKey), amt: inr(Number(newGross)), d: dateStr(t, sel.joiner),
        structure: st ? t(st.nameKey) : "—",
      }));
      setAssigning(false); setNewGross(""); setStructPick("");
    }

    const cols = [
      { key: "pick", label: "", width: 34 },
      { key: "staff", label: t("pys5.col.staff") },
      { key: "group", label: t("pys5.col.group"), width: 160 },
      { key: "structure", label: t("pys5.col.structure"), width: 170 },
      { key: "gross", label: t("pys5.col.gross"), align: "right", mono: true, width: 120 },
      { key: "annual", label: t("pys5.col.annual"), align: "right", mono: true, width: 130 },
      { key: "from", label: t("pys5.col.from"), width: 120 },
      { key: "state", label: t("pys5.col.state"), width: 170 },
      { key: "act", label: "", align: "right", width: 56 },
    ];

    function stateOf(p) {
      if (p.unassigned) return <StatusMark role="absent" glyph="alert" word={t("pys.st.unassigned")} />;
      if (p.byRule) return <StatusMark role="off" glyph="arrow" word={t("pys.st.byRule")} />;
      if (p.pending) return <StatusMark role="late" glyph="clock" word={t("pys.st.pending")} />;
      if (p.returned) return <StatusMark role="absent" glyph="signout" word={t("pys.st.returned")} />;
      return <StatusMark role="present" glyph="check" word={t("pys.st.assigned")} />;
    }

    const rows = STAFF.map((p) => {
      const st = structureFor(p);
      const items = [
        { key: "open", icon: "profile", label: t("pys5.act.open"), onSelect: () => { setSelectedId(p.id); setRevising(false); setAssigning(false); setDone(null); } },
      ];
      if (p.byRule) {
        items.push({ key: "hon", icon: "list", label: t("pys5.act.openHon"), onSelect: () => goTab("honorarium") });
      } else if (p.unassigned) {
        items.push({
          key: "assign", icon: "payroll", label: t("pys5.act.assign"),
          onSelect: () => { setSelectedId(p.id); setAssigning(true); setRevising(false); setDone(null); },
        });
        items.push({
          key: "rev", icon: "filing", label: t("pys5.act.revise"), disabled: true,
          reason: t("pys5.act.noReviseWhy", { name: t(p.nameKey) }),
        });
      } else {
        items.push({
          key: "rev", icon: "filing", label: t("pys5.act.revise"),
          onSelect: () => { setSelectedId(p.id); setRevising(true); setAssigning(false); setNewGross(""); setDone(null); },
        });
      }
      return {
        id: p.id,
        highlight: p.id === sel.id,
        cells: {
          pick: p.gross == null ? <span aria-hidden="true" style={{ color: c.inkFaint }}>{t("pys5.reg.none")}</span> : (
            <RowCheck id={"pys5-ck-" + p.id} checked={!!checked[p.id]} label={t("pys5.bulk.select", { name: t(p.nameKey) })}
              onChange={(v) => setChecked(Object.assign({}, checked, { [p.id]: v }))} />
          ),
          staff: (
            <span>
              <LinkButton onClick={() => { setSelectedId(p.id); setRevising(false); setAssigning(false); setDone(null); }}>{t(p.nameKey)}</LinkButton>
              <span style={G3.fig("xs", { color: c.inkFaint, display: "block" })}>{p.id + " · " + t(p.desigKey)}</span>
            </span>
          ),
          group: t(groupByKey(p.group).nameKey),
          structure: p.byRule
            ? <span style={ty("caption", { color: c.inkMuted })}>{t("pys5.reg.byRule")}</span>
            : st ? t(st.nameKey) : t("pys5.reg.none"),
          gross: p.gross == null ? t("pys5.reg.none") : inr(p.gross),
          annual: p.gross == null ? t("pys5.reg.none") : inr(r2(p.gross * 12)),
          from: p.from ? dateStr(t, p.from) : t("pys5.reg.none"),
          state: stateOf(p),
          act: <ActionMenu ariaLabel={t("pys5.menuAria", { name: t(p.nameKey) })} items={items} />,
        },
      };
    });

    const unassigned = UNASSIGNED[0];

    return (
      <div>
        <ColorCard kind="brass" icon="alert" iconTone="brass" title={t("pys5.warn.title")}>
          <p style={ty("small", { color: "inherit", margin: "0 0 8px" })}>
            {t("pys5.warn.body", { name: t(unassigned.nameKey), d: dateStr(t, unassigned.joiner) })}
          </p>
          <p style={ty("caption", { color: c.onBrassMuted, margin: "0 0 14px" })}>{t("pys5.warn.aug")}</p>
          {/* onDark: this button sits on a ColorCard fill — solid brass in
              light, deep brass-soft in dark. Either way the ink on it must be
              the light one; c.ink would be dark-on-dark in light mode. */}
          <Button kind="ghost" onDark iconLeft="payroll" onClick={() => { setSelectedId(unassigned.id); setAssigning(true); setRevising(false); setDone(null); }}>
            {t("pys5.warn.act")}
          </Button>
        </ColorCard>

        <div style={{ marginTop: L.gap }}>
          <Register
            title={t("pys5.reg.title")}
            sub={t("pys5.reg.sub", { shown: num(STAFF.length), total: num(HEADCOUNT) })}
            action={<Button kind="secondary" iconLeft="download" onClick={() => { setExporting(true); setDone(null); }}>{t("pys5.act.export")}</Button>}
            columns={cols}
            rows={rows}
            totals={{
              label: t("pys5.reg.totals", { n: num(STAFF.length) }),
              cells: {
                pick: "",
                staff: t("pys5.reg.totals", { n: num(STAFF.length) }),
                gross: inr(SHOWN_TOTAL),
                annual: inr(r2(SHOWN_TOTAL * 12)),
              },
            }}
            footer={
              <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap", width: "100%", justifyContent: "space-between" }}>
                <p style={ty("caption", { color: c.inkMuted, margin: 0, flex: "1 1 320px" })}>{t("pys5.reg.note")}</p>
                {checkedIds.length ? (
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <Button kind="primary" size="sm" onClick={() => { setBulkOpen(true); setDone(null); }}>
                      {t("pys5.bulk.title", { n: num(checkedIds.length) })}
                    </Button>
                    <LinkButton onClick={() => { setChecked({}); setBulkOpen(false); }}>{t("pys5.bulk.clear")}</LinkButton>
                  </div>
                ) : null}
              </div>
            }
          />
        </div>

        {done ? <DidIt onClose={() => setDone(null)}>{done}</DidIt> : null}

        {exporting ? (
          <Card style={{ marginTop: L.gap }} icon="download" iconTone="accent" title={t("pys5.act.export")} sub={t("pys5.act.exportSub")}>
            <Note role="late" glyph="alert" word={t("pys5.act.exportWhy")}>
              {t("pys5.act.exportCount", { n: num(HEADCOUNT) })}
            </Note>
            <ReasonPrompt
              idBase="pys5-export"
              title={t("pys5.act.exportWhy")}
              options={["pys4.reason.policy", "pys6.reason.budget", "pys4.reason.error"]}
              onConfirm={() => { setExporting(false); setDone(t("pys5.act.exportDone", { n: num(HEADCOUNT) })); }}
              onCancel={() => setExporting(false)}
            />
          </Card>
        ) : null}

        {bulkOpen ? (
          <Card style={{ marginTop: L.gap }} icon="staff" iconTone="accent"
            title={t("pys5.bulk.title", { n: num(bulkEligible.length) })} sub={t("pys5.bulk.sub")}>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", maxWidth: 900 }}>
              <div style={{ flex: "1 1 220px", minWidth: 200 }}>
                <Field id="pys5-bmode" label={t("pys5.bulk.mode")}>
                  <Select id="pys5-bmode" value={bMode} onChange={setBMode} options={[
                    { value: "pct", label: t("pys5.bulk.pct") },
                    { value: "flat", label: t("pys5.bulk.flat") },
                  ]} />
                </Field>
              </div>
              <div style={{ flex: "1 1 180px", minWidth: 170 }}>
                <Field id="pys5-bamt" label={bMode === "pct" ? t("pys5.bulk.pctAmount") : t("pys5.bulk.amount")}
                  error={bErr === "amount" ? t("pys5.bulk.errAmount") : null}>
                  <Input id="pys5-bamt" value={bAmt} onChange={setBAmt} inputMode="decimal" />
                </Field>
              </div>
              <div style={{ flex: "1 1 220px", minWidth: 200 }}>
                <Field id="pys5-bfrom" label={t("pys5.act.from")}>
                  <Select id="pys5-bfrom" value={bFrom} onChange={setBFrom}
                    options={EFFECTIVE_DATES.filter((d) => periodOf(d.at.m).state === "open").map((d) => ({ value: d.key, label: dateStr(t, d.at) }))} />
                </Field>
              </div>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid " + c.ruleStrong }}>
                  <th scope="col" style={ty("colLabel", { color: c.inkFaint, textAlign: "left", padding: "0 8px 9px", textTransform: "uppercase" })}>{t("pys5.col.staff")}</th>
                  <th scope="col" style={ty("colLabel", { color: c.inkFaint, textAlign: "right", padding: "0 8px 9px", textTransform: "uppercase", width: 150 })}>{t("pys5.bulk.col.old")}</th>
                  <th scope="col" style={ty("colLabel", { color: c.inkFaint, textAlign: "right", padding: "0 8px 9px", textTransform: "uppercase", width: 150 })}>{t("pys5.bulk.col.new")}</th>
                  <th scope="col" style={ty("colLabel", { color: c.inkFaint, textAlign: "right", padding: "0 8px 9px", textTransform: "uppercase", width: 150 })}>{t("pys5.bulk.col.delta")}</th>
                </tr>
              </thead>
              <tbody>
                {bulkRows.map((x, i) => (
                  <tr key={x.p.id} style={{ borderBottom: i < bulkRows.length - 1 ? "1px solid " + c.rule : "none" }}>
                    <td style={ty("small", { padding: "9px 8px", color: c.ink })}>
                      <span style={{ fontWeight: 600 }}>{t(x.p.nameKey)}</span>
                      <span style={G3.fig("xs", { color: c.inkFaint, marginLeft: 8 })}>{x.p.id}</span>
                    </td>
                    <td style={G3.fig("sm", { padding: "9px 8px", textAlign: "right", color: c.inkMuted })}>{inr(x.p.gross)}</td>
                    <td style={G3.fig("sm", { padding: "9px 8px", textAlign: "right", color: c.ink, fontWeight: 600 })}>{inr(x.next)}</td>
                    <td style={G3.fig("sm", { padding: "9px 8px", textAlign: "right", color: c.ink })}>{signed(x.d)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: "2px solid " + c.ruleStrong }}>
                  <td colSpan={3} style={ty("small", { padding: "12px 8px", color: c.ink, fontWeight: 700 })}>{t("pys5.bulk.totalDelta")}</td>
                  <td style={{ padding: "12px 8px", textAlign: "right" }}>
                    <Figure value={signed(bulkTotal)} size="md" weight={700} color={c.ink} align="right" />
                  </td>
                </tr>
                <tr>
                  <td colSpan={3} style={ty("small", { padding: "2px 8px 10px", color: c.inkMuted })}>{t("pys5.bulk.totalAnnual")}</td>
                  <td style={{ padding: "2px 8px 10px", textAlign: "right" }}>
                    <Figure value={signed(r2(bulkTotal * 12))} size="sm" weight={600} color={c.inkMuted} align="right" />
                  </td>
                </tr>
              </tfoot>
            </table>

            {bulkExcluded.length ? (
              <Note role="late" glyph="alert" word={t("pys.st.locked")}>
                {t("pys5.bulk.excluded", {
                  n: num(bulkExcluded.length),
                  list: bulkExcluded.map((p) => t(p.nameKey)).join(" · "),
                })}
              </Note>
            ) : null}
            {bulkRows.length ? (
              <Note role={bulkAllPass ? "present" : "absent"} glyph={bulkAllPass ? "check" : "alert"}
                word={bulkAllPass ? t("pys.st.valid") : t("pys.st.violation")}>
                {t("pys5.bulk.limit")}
              </Note>
            ) : null}

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
              <Button kind="primary" onClick={() => {
                if (bulkEligible.length < 2) { setBErr("none"); return; }
                if (!String(bAmt).trim() || Number(bAmt) === 0) { setBErr("amount"); return; }
                setBErr(null);
                setDone(t("pys5.bulk.done", { n: num(bulkEligible.length), who: t(CHECKER.nameKey) }));
                setBulkOpen(false); setChecked({});
              }}>{t("pys5.bulk.send", { n: num(bulkEligible.length) })}</Button>
              <Button kind="quiet" onClick={() => setBulkOpen(false)}>{t("pys.cancel")}</Button>
            </div>
            {bErr === "none" ? <div role="alert" style={ty("caption", { color: c.dangerText, marginTop: 8 })}>{t("pys5.bulk.errNone")}</div> : null}
          </Card>
        ) : null}

        {/* ---- the subject panel ---- */}
        <div style={{ display: "flex", gap: L.gap, marginTop: L.gap, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div style={{ flex: "1 1 620px", minWidth: 440 }}>
            <Card icon="profile" iconTone="accent" title={t(sel.nameKey)}
              sub={t("pys5.det.sub", { id: sel.id, desig: t(sel.desigKey), group: t(groupByKey(sel.group).nameKey) })}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>{stateOf(sel)}</div>

              {sel.byRule ? (
                <div>
                  <Note role="off" glyph="arrow" word={t("pys.st.byRule")}
                    action={<LinkButton onClick={() => goTab("honorarium")}>{t("pys5.det.honGo")}</LinkButton>}>
                    {t("pys5.det.honorarium", { name: t(sel.nameKey) })}
                  </Note>
                  <p style={ty("caption", { color: c.inkMuted, margin: "12px 0 0" })}>{t("pys5.absent.payslip")}</p>
                </div>
              ) : sel.unassigned ? (
                <div>
                  <Note role="absent" glyph="alert" word={t("pys.st.unassigned")}>{t("pys5.det.unassigned")}</Note>
                  <p style={ty("small", { color: c.inkMuted, margin: "12px 0 0" })}>
                    {t("pys5.det.willJoin", { name: t(sel.nameKey), d: dateStr(t, sel.joiner) })}
                  </p>
                  <div style={{ marginTop: 14 }}>
                    <Button kind="primary" iconLeft="payroll" onClick={() => { setAssigning(true); setDone(null); }}>{t("pys5.act.assign")}</Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={ty("h3", { color: c.ink, margin: "0 0 2px" })}>{t("pys5.det.comp")}</div>
                  <div style={ty("small", { color: c.inkMuted, marginBottom: 10 })}>{t("pys5.det.compSub")}</div>
                  {selLines.map((l) => (
                    <EqRow key={l.code} sign={"+"} label={t("pys3.c." + l.code)} value={l.v}
                      note={l.cp.calc === "grade" ? t("pys3.calc.grade")
                        : l.cp.calc === "balance" ? t("pys3.calc.balance")
                          : l.cp.calc === "flat" ? t("pys3.calc.flat", { v: inr(l.cp.value) })
                            : t("pys3.calc.pct", { p: pctStr(l.cp.pct), of: t("pys3.c." + l.cp.of) })} />
                  ))}
                  <EqRow sign={"="} label={t("pys5.det.gross")} value={grossOf(selLines)} strong rule />
                  <EqRow sign={"×"} label={t("pys5.det.annualGross")} value={r2(grossOf(selLines) * 12)} />

                  {engineFor(sel) ? (
                    <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid " + c.rule }}>
                      <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 })}>{t("pys5.det.employer")}</div>
                      {[
                        { key: "pys3.c.PFER", v: engineFor(sel).pfEr },
                        { key: "pys3.c.ESIER", v: engineFor(sel).esiEr },
                        { key: "pys3.c.LWF", v: engineFor(sel).lwf },
                      ].filter((x) => x.v != null).map((x) => <EqRow key={x.key} sign={"+"} label={t(x.key)} value={x.v} />)}
                      <EqRow sign={"="} label={t("pys5.det.annualCost")} strong rule
                        value={r2((grossOf(selLines) + [engineFor(sel).pfEr, engineFor(sel).esiEr, engineFor(sel).lwf].filter((x) => x != null).reduce((s, x) => s + x, 0)) * 12)} />
                      <p style={ty("caption", { color: c.inkMuted, margin: "10px 0 0" })}>
                        {t("pys5.det.statFor", {
                          name: t(sel.nameKey), mon: t("pys.mon.7"), v: CFG_JUL.v,
                          lines: [
                            { key: "pys3.c.PF", v: engineFor(sel).pf },
                            { key: "pys3.c.ESI", v: engineFor(sel).esi },
                            { key: "pys3.c.PT", v: engineFor(sel).pt },
                            { key: "pys3.c.TDS", v: engineFor(sel).tds },
                          ].filter((x) => x.v != null).map((x) => t(x.key) + " " + inr(x.v)).join(" · "),
                        })}
                      </p>
                    </div>
                  ) : null}
                  <p style={ty("caption", { color: c.inkMuted, margin: "12px 0 0" })}>{t("pys5.det.statNote")}</p>
                  {sel.bankKey ? (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid " + c.rule }}>
                      <div style={ty("small", { color: c.ink })}>{t("pys5.det.bank", { acct: t(sel.bankKey) })}</div>
                      <p style={ty("caption", { color: c.inkMuted, margin: "4px 0 0" })}>{t("pys5.det.bankNote")}</p>
                    </div>
                  ) : null}
                  {sel.joiner ? (
                    <Note role="off" glyph="clock" word={t("pys5.det.joinerWord")}>
                      {t("pys5.det.joiner", { name: t(sel.nameKey), d: dateStr(t, sel.joiner) })}
                    </Note>
                  ) : null}

                  <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid " + c.rule, display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <Button kind="primary" iconLeft="filing" onClick={() => { setRevising(true); setAssigning(false); setNewGross(""); setDone(null); }}>
                      {t("pys5.act.revise")}
                    </Button>
                    <p style={ty("caption", { color: c.inkMuted, margin: 0, flex: "1 1 260px" })}>{t("pys5.act.reviseSub")}</p>
                  </div>

                  <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid " + c.rule }}>
                    <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 })}>{t("pys5.det.rule")}</div>
                    {(function () {
                      const v = wageVerdict(selLines);
                      return (
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                          <StatusMark role={v.state === "over" ? "absent" : v.state === "at" ? "late" : "present"}
                            glyph={v.state === "over" ? "alert" : v.state === "at" ? "half" : "check"}
                            word={v.state === "over" ? t("pys.st.violation") : t("pys.st.valid")} />
                          <span style={ty("caption", { color: c.inkMuted })}>
                            {t("pys3.rule.excluded") + " " + inr(v.excluded) + " · " + t("pys3.rule.limit") + " " + inr(v.limit) + " · " + pctStr(v.share)}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </Card>

            {(revising || assigning) ? (
              <Card style={{ marginTop: L.gap }} icon="filing" iconTone="accent"
                title={assigning ? t("pys5.act.assign") : t("pys5.act.revise")}
                sub={assigning ? t("pys5.act.assignSub") : t("pys5.act.reviseSub")}>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", maxWidth: 900 }}>
                  {assigning ? (
                    <div style={{ flex: "1 1 300px", minWidth: 260 }}>
                      <Field id="pys5-struct" label={t("pys5.act.structure")}>
                        <Select id="pys5-struct" value={structValue} onChange={setStructPick}
                          options={STRUCTURES.filter((s) => s.group === sel.group && s.state === "inUse").map((s) => ({ value: s.key, label: t(s.nameKey) }))} />
                      </Field>
                    </div>
                  ) : null}
                  <div style={{ flex: "1 1 200px", minWidth: 190 }}>
                    <Field id="pys5-gross" label={t("pys5.act.gross")} hint={t("pys5.act.grossHint")}
                      error={rErr === "gross" ? t("pys5.act.errGross") : rErr === "same" ? t("pys5.act.errSame") : null}>
                      <Input id="pys5-gross" value={newGross} onChange={setNewGross} inputMode="decimal" />
                    </Field>
                  </div>
                  <div style={{ flex: "1 1 220px", minWidth: 200 }}>
                    <Field id="pys5-eff" label={t("pys5.act.from")}
                      hint={assigning ? t("pys5.act.fromHintNew") : null}
                      error={rErr === "locked" ? t("pys5.act.errLocked") : null}>
                      {assigning ? (
                        <Input id="pys5-eff" value={dateStr(t, sel.joiner)} readOnly />
                      ) : (
                        <Select id="pys5-eff" value={effKey} onChange={setEffKey}
                          options={EFFECTIVE_DATES.map((d) => ({ value: d.key, label: dateStr(t, d.at) }))} />
                      )}
                    </Field>
                  </div>
                  {assigning ? null : (
                    <div style={{ flex: "1 1 220px", minWidth: 200 }}>
                      <Field id="pys5-reason" label={t("pys5.act.reasonPick")} error={rErr === "reason" ? t("pys5.act.errReason") : null}>
                        <Select id="pys5-reason" value={reason} onChange={setReason} options={[{ value: "", label: t("pys.reason.pick") }].concat(
                          ["pay_revision", "promotion", "correction", "da_vda"].map((k) => ({ value: k, label: t("pys5.reason." + k) }))
                        )} />
                      </Field>
                    </div>
                  )}
                </div>

                {(!assigning && delta != null && delta !== 0) ? (
                  <div style={{ background: c.raised, border: "1px solid " + c.borderStrong, borderRadius: G3.r.lg, padding: "16px 18px", marginBottom: 16 }}>
                    <div style={ty("h3", { color: c.ink, margin: "0 0 4px" })}>{t("pys5.cons.title")}</div>
                    <p style={ty("small", { color: c.inkMuted, margin: "0 0 12px" })}>{t("pys5.cons.sub")}</p>
                    <Fact label={t("pys5.cons.delta")} w={320}>
                      <div style={ty("small", { color: c.ink })}>
                        {t("pys5.cons.deltaLine", { oldAmt: inr(sel.gross), newAmt: inr(Number(newGross)), delta: signed(delta) })}
                      </div>
                    </Fact>

                    {effPeriod.state === "withChecker" ? (
                      <Note role="absent" glyph="lock" word={t("pys5.cons.blocked")}>
                        {t("pys.lock.checker", { run: RUN_AUG, who: t(CHECKER.nameKey) })}
                      </Note>
                    ) : effPeriod.state === "open" ? (
                      <Note role="present" glyph="check" word={t("pys.st.scheduled")}>
                        {t("pys5.cons.forward", { d: dateStr(t, eff.at), run: runFor(eff.at.m) })}
                      </Note>
                    ) : (
                      <div style={{ marginTop: 12 }}>
                        <div style={ty("small", { color: c.ink, fontWeight: 700 })}>{t("pys5.cons.arrTitle")}</div>
                        <p style={ty("caption", { color: c.inkMuted, margin: "3px 0 10px" })}>{t("pys5.cons.arrSub", { n: num(schedule.length) })}</p>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead>
                            <tr style={{ borderBottom: "2px solid " + c.ruleStrong }}>
                              <th scope="col" style={ty("colLabel", { color: c.inkFaint, textAlign: "left", padding: "0 8px 8px", textTransform: "uppercase" })}>{t("pys5.cons.col.month")}</th>
                              <th scope="col" style={ty("colLabel", { color: c.inkFaint, textAlign: "left", padding: "0 8px 8px", textTransform: "uppercase", width: 130 })}>{t("pys5.cons.col.run")}</th>
                              <th scope="col" style={ty("colLabel", { color: c.inkFaint, textAlign: "left", padding: "0 8px 8px", textTransform: "uppercase", width: 120 })}>{t("pys5.cons.col.cfg")}</th>
                              <th scope="col" style={ty("colLabel", { color: c.inkFaint, textAlign: "right", padding: "0 8px 8px", textTransform: "uppercase", width: 120 })}>{t("pys5.cons.col.days")}</th>
                              <th scope="col" style={ty("colLabel", { color: c.inkFaint, textAlign: "right", padding: "0 8px 8px", textTransform: "uppercase", width: 130 })}>{t("pys5.cons.col.amt")}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {schedule.map((x, i) => (
                              <tr key={x.m} style={{ borderBottom: i < schedule.length - 1 ? "1px solid " + c.rule : "none" }}>
                                <td style={ty("small", { padding: "8px", color: c.ink })}>{t("pys.period", { mon: t("pys.mon." + x.m) })}</td>
                                <td style={G3.fig("sm", { padding: "8px", color: c.inkMuted })}>{x.run}</td>
                                <td style={G3.fig("sm", { padding: "8px", color: c.inkMuted })}>{x.cfg.v}</td>
                                <td style={G3.fig("sm", { padding: "8px", textAlign: "right", color: c.inkMuted })}>{num(x.paid) + " / " + num(x.days)}</td>
                                <td style={G3.fig("sm", { padding: "8px", textAlign: "right", color: c.ink, fontWeight: 600 })}>{inr(x.amt)}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr style={{ borderTop: "2px solid " + c.ruleStrong }}>
                              <td colSpan={4} style={ty("small", { padding: "11px 8px", color: c.ink, fontWeight: 700 })}>{t("pys5.cons.arrTotal")}</td>
                              <td style={{ padding: "11px 8px", textAlign: "right" }}>
                                <Figure value={inr(scheduleTotal)} size="md" weight={700} color={c.ink} align="right" />
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                        <Note role="late" glyph="alert" word={t("pys.st.pending")}>
                          {t("pys5.cons.lands", { run: RUN_SEP, cur: RUN_AUG })}
                        </Note>
                        <p style={ty("small", { color: c.ink, margin: "10px 0 0" })}>
                          {t("pys5.cons.needChecker", { who: t(CHECKER.nameKey), role: t(CHECKER.roleKey) })}
                        </p>
                        <p style={ty("caption", { color: c.inkMuted, margin: "8px 0 0" })}>{t("pys5.cons.statutory")}</p>
                        {scheduleFiled ? (
                          <p style={ty("caption", { color: c.inkMuted, margin: "6px 0 0" })}>{t("pys5.cons.filing", { n: num(scheduleFiled) })}</p>
                        ) : null}
                      </div>
                    )}
                  </div>
                ) : null}

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Button kind="primary" onClick={assigning ? submitAssign : submitRevise}>
                    {assigning ? t("pys.confirm") : t("pys5.act.submit")}
                  </Button>
                  <Button kind="quiet" onClick={() => { setRevising(false); setAssigning(false); setRErr(null); }}>{t("pys.cancel")}</Button>
                </div>
              </Card>
            ) : null}
          </div>

          <div style={{ flex: "1 1 400px", minWidth: 360 }}>
            <Card icon="filing" iconTone="off" title={t("pys5.det.ledger")} sub={t("pys5.det.ledgerSub")}>
              {sel.ledger.length === 0 ? (
                <EmptyState compact head={t("pys5.det.unassigned")} body={t("pys5.det.willJoin", { name: t(sel.nameKey), d: dateStr(t, sel.joiner || TODAY) })} />
              ) : (
                <div>
                  {sel.ledger.slice().reverse().map((rw, i) => (
                    <div key={String(rw.from.y) + "-" + String(rw.from.m)} style={{ paddingBottom: 14, marginBottom: 14, borderBottom: i < sel.ledger.length - 1 ? "1px solid " + c.rule : "none" }}>
                      <div style={{ display: "flex", gap: 9, alignItems: "center", flexWrap: "wrap" }}>
                        <Figure value={inr(rw.gross)} size="md" weight={700} color={c.ink} />
                        {rw.current ? <StatusMark role="present" glyph="check" word={t("pys5.det.current")} /> : <Chip bg={c.sunken} fg={c.inkMuted}>{t("pys.st.superseded")}</Chip>}
                      </div>
                      <div style={ty("small", { color: c.inkMuted, marginTop: 3 })}>
                        {rw.to ? t("pys5.det.rowTo", { amt: inr(rw.gross), from: dateStr(t, rw.from), to: dateStr(t, rw.to) })
                          : t("pys5.det.row", { amt: inr(rw.gross), from: dateStr(t, rw.from) })}
                      </div>
                      <div style={ty("caption", { color: c.inkFaint, marginTop: 4 })}>{t("pys5.det.reason", { r: t("pys5.reason." + rw.reason) })}</div>
                      <div style={ty("caption", { color: c.inkFaint })}>{t("pys5.det.made", { who: person(t, rw.made.by), d: dateStr(t, rw.made.at) })}</div>
                      {rw.appr ? <div style={ty("caption", { color: c.inkFaint })}>{t("pys5.det.appr", { who: person(t, rw.appr.by), d: dateStr(t, rw.appr.at) })}</div> : null}
                    </div>
                  ))}
                  {sel.pending ? (
                    <div style={{ background: c.lateTint, borderRadius: G3.r.lg, padding: "12px 14px", marginBottom: 12 }}>
                      <div style={{ display: "flex", gap: 9, alignItems: "center", flexWrap: "wrap" }}>
                        <Figure value={inr(sel.pending.gross)} size="md" weight={700} color={c.ink} />
                        <StatusMark role="late" glyph="clock" word={t("pys.st.pending")} />
                      </div>
                      <div style={ty("small", { color: c.ink, marginTop: 3 })}>{t("pys5.det.row", { amt: inr(sel.pending.gross), from: dateStr(t, sel.pending.from) })}</div>
                      <div style={ty("caption", { color: c.inkMuted, marginTop: 4 })}>{t("pys5.det.made", { who: person(t, sel.pending.made.by), d: dateStr(t, sel.pending.made.at) })}</div>
                      <div style={ty("caption", { color: c.inkMuted })}>{t("pys5.det.await", { who: person(t, CHECKER) })}</div>
                    </div>
                  ) : null}
                  {sel.returned ? (
                    <div style={{ background: c.absentTint, borderRadius: G3.r.lg, padding: "12px 14px", marginBottom: 12 }}>
                      <div style={{ display: "flex", gap: 9, alignItems: "center", flexWrap: "wrap" }}>
                        <Figure value={inr(sel.returned.gross)} size="md" weight={700} color={c.ink} />
                        <StatusMark role="absent" glyph="signout" word={t("pys.st.returned")} />
                      </div>
                      <div style={ty("small", { color: c.ink, marginTop: 3 })}>{t("pys5.det.row", { amt: inr(sel.returned.gross), from: dateStr(t, sel.returned.from) })}</div>
                      <div style={ty("caption", { color: c.inkMuted, marginTop: 4 })}>{t("pys5.det.ret", { who: person(t, sel.returned.ret.by), d: dateStr(t, sel.returned.ret.at) })}</div>
                      <p style={ty("small", { color: c.ink, margin: "8px 0 0" })}>{t("pys5.det.retWhy", { why: t(sel.returned.ret.whyKey) })}</p>
                    </div>
                  ) : null}
                </div>
              )}
              <p style={ty("caption", { color: c.inkMuted, margin: "4px 0 0" })}>{t("pys5.absent.delete")}</p>
            </Card>

            <div style={{ marginTop: L.gap }}>
              <SignOff pendingWith={!!sel.pending} returnedBy={!!sel.returned} returnedOn={sel.returned ? dateStr(t, sel.returned.ret.at) : null} />
            </div>

            <Card style={{ marginTop: L.gap }} icon="lock" iconTone="off" title={t("pys.st.locked")}>
              {PERIODS.filter((p) => p.state !== "open").map((p, i, a) => (
                <div key={p.m} style={{ padding: "9px 0", borderBottom: i < a.length - 1 ? "1px solid " + c.rule : "none" }}>
                  <div style={{ display: "flex", gap: 9, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={ty("small", { color: c.ink, fontWeight: 700 })}>{t("pys.period", { mon: t("pys.mon." + p.m) })}</span>
                    <Chip bg={c.sunken} fg={c.inkMuted} mono>{p.run}</Chip>
                    <Chip bg={c.sunken} fg={c.inkMuted} mono>{p.cfg.v}</Chip>
                  </div>
                  <p style={ty("caption", { color: c.inkMuted, margin: "4px 0 0" })}>
                    {p.state === "paid"
                      ? t("pys.lock.paid", { mon: t("pys.mon." + p.m), run: p.run })
                      : t("pys.lock.checker", { run: p.run, who: t(CHECKER.nameKey) })}
                  </p>
                </div>
              ))}
              <p style={ty("caption", { color: c.inkMuted, margin: "10px 0 0" })}>{t("pys.lock.open")}</p>
              <p style={ty("caption", { color: c.inkFaint, margin: "10px 0 0" })}>{t("pys5.absent.structure")}</p>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  /* ============================================================
     PY-06 · PROPOSED REVISIONS QUEUE
     "Which appraisal recommendations are waiting to become real money?"

     Spec: screen-inventory PY-06 (all five actions built), M17
     §Business rules + §Acceptance — the recommendation is ADVISORY, is
     never auto-applied, and every acceptance still passes payroll
     maker-checker. The ratings behind it are deliberately absent.
     ============================================================ */
  function ProposalsTab({ goTab }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const L = G3.layout;
    const [mode, setMode] = useState(null);
    const [subject, setSubject] = useState(null);
    const [checked, setChecked] = useState({});
    const [bulkOpen, setBulkOpen] = useState(false);
    const [done, setDone] = useState(null);
    const [amt, setAmt] = useState("");
    const [aFrom, setAFrom] = useState("2026-09-01");
    const [aErr, setAErr] = useState(null);

    const subj = subject ? proposalById(subject) : null;
    const checkedIds = Object.keys(checked).filter((k) => checked[k]);
    const bulkRows = checkedIds.map(proposalById).filter((p) => p && p.state === "pending");
    const bulkTotal = bulkRows.reduce((s, p) => s + propDelta(p), 0);

    function openMode(p, m) {
      setSubject(p.id); setMode(m); setDone(null); setAErr(null);
      setAmt(p.prop == null ? "" : String(p.prop));
    }

    const cols = [
      { key: "pick", label: "", width: 34 },
      { key: "staff", label: t("pys6.col.staff") },
      { key: "kind", label: t("pys6.col.kind"), width: 160 },
      { key: "current", label: t("pys6.col.current"), align: "right", mono: true, width: 130 },
      { key: "proposed", label: t("pys6.col.proposed"), align: "right", mono: true, width: 130 },
      { key: "change", label: t("pys6.col.change"), align: "right", mono: true, width: 150 },
      { key: "from", label: t("pys6.col.from"), width: 150 },
      { key: "state", label: t("pys6.col.state"), width: 180 },
      { key: "act", label: "", align: "right", width: 56 },
    ];

    function stateOf(p) {
      if (p.state === "pending") return <StatusMark role="late" glyph="clock" word={t("pys.st.pending")} />;
      if (p.state === "blocked") return <StatusMark role="absent" glyph="alert" word={t("pys.st.blocked")} />;
      if (p.state === "declined") return <StatusMark role="off" glyph="signout" word={t("pys.st.declined")} />;
      return <StatusMark role="leave" glyph="half" word={t("pys.st.modified")} />;
    }

    const rows = PROPOSALS.map((p) => {
      const items = [];
      if (p.state === "pending") {
        items.push({ key: "acc", icon: "check", label: t("pys6.act.accept"), onSelect: () => openMode(p, "accept") });
        items.push({ key: "mod", icon: "filing", label: t("pys6.act.modify"), onSelect: () => openMode(p, "modify") });
        items.push({ key: "dec", icon: "signout", label: t("pys6.act.decline"), onSelect: () => openMode(p, "decline") });
      } else if (p.state === "blocked") {
        items.push({
          key: "acc", icon: "check", label: t("pys6.act.accept"), disabled: true,
          reason: t("pys6.act.blockedWhy", { name: t(p.nameKey) }),
        });
        items.push({ key: "go", icon: "staff", label: t("pys6.act.blockedGo"), onSelect: () => goTab("people") });
      }
      items.push({ key: "ctx", icon: "document", label: t("pys6.act.context"), onSelect: () => openMode(p, "context") });
      const d = propDelta(p);
      return {
        id: p.id,
        highlight: subject === p.id,
        tone: p.state === "declined" ? "dim" : undefined,
        cells: {
          pick: p.state === "pending"
            ? <RowCheck id={"pys6-ck-" + p.id} checked={!!checked[p.id]} label={t("pys6.bulk.select", { name: t(p.nameKey) })}
                onChange={(v) => setChecked(Object.assign({}, checked, { [p.id]: v }))} />
            : <span aria-hidden="true" style={{ color: c.inkFaint }}>{t("pys5.reg.none")}</span>,
          staff: (
            <span>
              <LinkButton onClick={() => openMode(p, "context")}>{t(p.nameKey)}</LinkButton>
              <span style={G3.fig("xs", { color: c.inkFaint, display: "block" })}>{p.id + " · " + t(p.desigKey)}</span>
              <span style={ty("caption", { color: c.inkMuted, display: "block" })}>
                {t("pys6.rec", { who: t(p.rec.nameKey) }) + " · " + t("pys6.mod", { who: t(p.mod.nameKey) })}
              </span>
            </span>
          ),
          kind: t("pys6.kind." + p.kind),
          current: p.cur == null ? t("pys5.reg.none") : inr(p.cur),
          proposed: propStands(p) == null ? t("pys5.reg.none") : inr(propStands(p)),
          change: d == null ? t("pys5.reg.none") : signed(d) + " · " + pctStr(propPct(p)),
          from: dateStr(t, CYCLE.effective),
          state: stateOf(p),
          act: <ActionMenu ariaLabel={t("pys5.menuAria", { name: t(p.nameKey) })} items={items} />,
        },
      };
    });

    return (
      <div>
        <div style={{ display: "flex", gap: L.gap, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div style={{ flex: "1 1 420px", minWidth: 340 }}>
            <ColorCard kind="accent" icon="payroll" iconTone="accent" title={t("pys6.head.title")}
              sub={t("pys6.head.sub", { cycle: t(CYCLE.nameKey), d: dateStr(t, CYCLE.closed) })}>
              <div style={ty("caption", { color: c.onAccentMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 4 })}>
                {t("pys6.cost.label")}
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 4, flexWrap: "wrap" }}>
                <Figure value={signed(PENDING_MONTHLY)} size={34} weight={700} color={"inherit"} />
                <span style={ty("small", { color: c.onAccentMuted })}>{t("pys6.cost.month")}</span>
              </div>
              <div style={ty("small", { color: c.onAccentMuted, marginTop: 4 })}>
                {t("pys6.cost.year", { amt: signed(r2(PENDING_MONTHLY * 12)) })}
              </div>
              <p style={ty("caption", { color: c.onAccentMuted, margin: "14px 0 0" })}>
                {t("pys6.cost.note", { n: num(PENDING.length), excl: num(BLOCKED.length) })}
              </p>
            </ColorCard>
          </div>
          <div style={{ flex: "1 1 420px", minWidth: 340 }}>
            <Card icon="filing" iconTone="off" title={t("pys6.stale.title")}>
              <p style={ty("small", { color: c.inkMuted, margin: 0 })}>
                {t("pys6.stale.body", { cycle: t(CYCLE.nameKey), d: dateStr(t, CYCLE.reopened) })}
              </p>
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid " + c.rule }}>
                <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" })}>{t("pys.absentWhy")}</div>
                <p style={ty("small", { color: c.inkMuted, margin: "4px 0 0" })}>{t("pys6.absent.auto")}</p>
                <p style={ty("caption", { color: c.inkMuted, margin: "8px 0 0" })}>{t("pys6.absent.ratings")}</p>
              </div>
            </Card>
          </div>
        </div>

        <div style={{ marginTop: L.gap }}>
          {PROPOSALS.length === 0 ? (
            <Card><EmptyState head={t("pys6.empty.head")} body={t("pys6.empty.body")} /></Card>
          ) : (
            <Register
              title={t("pys6.reg.title")}
              sub={t("pys6.reg.sub")}
              columns={cols}
              rows={rows}
              totals={{
                label: t("pys6.reg.totals", { n: num(PENDING.length) }),
                cells: {
                  pick: "",
                  staff: t("pys6.reg.totals", { n: num(PENDING.length) }),
                  change: signed(PENDING_MONTHLY),
                },
              }}
              footer={
                <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap", width: "100%", justifyContent: "space-between" }}>
                  <p style={ty("caption", { color: c.inkMuted, margin: 0, flex: "1 1 320px" })}>{t("pys6.absent.ratings")}</p>
                  {checkedIds.length ? (
                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <Button kind="primary" size="sm" onClick={() => { setBulkOpen(true); setDone(null); }}>
                        {t("pys6.bulk.title", { n: num(checkedIds.length) })}
                      </Button>
                      <LinkButton onClick={() => { setChecked({}); setBulkOpen(false); }}>{t("pys5.bulk.clear")}</LinkButton>
                    </div>
                  ) : null}
                </div>
              }
            />
          )}
        </div>

        {done ? <DidIt onClose={() => setDone(null)}>{done}</DidIt> : null}

        {/* what already happened to the two decided proposals, on the record */}
        <div style={{ display: "flex", gap: L.gap, marginTop: L.gap, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div style={{ flex: "1 1 420px", minWidth: 340 }}>
            <Card icon="list" iconTone="off" title={t("pys.appendOnly")}>
              {PROPOSALS.filter((p) => p.act).map((p, i, a) => (
                <div key={p.id} style={{ padding: "10px 0", borderBottom: i < a.length - 1 ? "1px solid " + c.rule : "none" }}>
                  <div style={{ display: "flex", gap: 9, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={ty("small", { color: c.ink, fontWeight: 700 })}>{t(p.nameKey)}</span>
                    {stateOf(p)}
                  </div>
                  <p style={ty("small", { color: c.inkMuted, margin: "5px 0 0" })}>
                    {p.state === "declined"
                      ? t("pys6.done.declined", { who: t(p.act.by.nameKey), d: dateStr(t, p.act.at), why: t(p.act.whyKey) })
                      : t("pys6.done.modified", { who: t(p.act.by.nameKey), d: dateStr(t, p.act.at), rec: inr(p.prop), amt: inr(p.accepted), why: t(p.act.whyKey) })}
                  </p>
                  {p.state === "modified" ? (
                    <p style={ty("caption", { color: c.inkFaint, margin: "5px 0 0" })}>{t("pys6.done.pending", { who: t(CHECKER.nameKey), d: dateStr(t, p.act.at) })}</p>
                  ) : null}
                </div>
              ))}
            </Card>
          </div>

          <div style={{ flex: "1 1 520px", minWidth: 380 }}>
            {subj && mode ? (
              <Card icon={mode === "decline" ? "signout" : mode === "context" ? "document" : "check"} iconTone="accent"
                title={mode === "accept" ? t("pys6.act.accept") : mode === "modify" ? t("pys6.act.modify") : mode === "decline" ? t("pys6.act.decline") : t("pys6.act.context")}
                sub={t(subj.nameKey) + " · " + subj.id}>
                {mode === "context" ? (
                  <div>
                    <p style={ty("small", { color: c.ink, margin: 0 })}>
                      {t("pys6.act.contextBody", {
                        cycle: t(CYCLE.nameKey), kind: t("pys6.kind." + subj.kind),
                        rec: person(t, subj.rec), mod: person(t, subj.mod), d: dateStr(t, CYCLE.closed),
                      })}
                    </p>
                    <p style={ty("caption", { color: c.inkMuted, margin: "10px 0 0" })}>{t("pys6.act.contextSub")}</p>
                    <Note role="off" glyph="arrow" word={t("pys.absentWhy")}>{t("pys6.act.contextNo")}</Note>
                    {subj.state === "blocked" ? (
                      <div style={{ marginTop: 14 }}>
                        <div style={ty("h3", { color: c.ink, margin: "0 0 8px" })}>{t("pys6.act.blocked", { name: t(subj.nameKey) })}</div>
                        <OffAction
                          label={t("pys6.act.accept")}
                          kind="primary"
                          iconLeft="check"
                          reason={t("pys6.act.blockedWhy", { name: t(subj.nameKey) })}
                          extra={<LinkButton onClick={() => goTab("people")}>{t("pys6.act.blockedGo")}</LinkButton>}
                        />
                      </div>
                    ) : null}
                    <div style={{ marginTop: 14 }}>
                      <Button kind="quiet" onClick={() => { setMode(null); setSubject(null); }}>{t("pys.close")}</Button>
                    </div>
                  </div>
                ) : mode === "decline" ? (
                  <div>
                    <p style={ty("small", { color: c.inkMuted, margin: "0 0 4px" })}>
                      {t("pys6.act.declineSub", { who: t(subj.rec.nameKey), mod: t(subj.mod.nameKey) })}
                    </p>
                    <ReasonPrompt
                      idBase="pys6-decline"
                      title={t("pys6.act.decline")}
                      options={["pys6.reason.budget", "pys6.reason.band", "pys6.reason.timing", "pys6.reason.market", "pys6.reason.other"]}
                      onConfirm={() => { setDone(t("pys6.act.declineDone", { name: t(subj.nameKey) })); setMode(null); setSubject(null); }}
                      onCancel={() => { setMode(null); setSubject(null); }}
                    />
                  </div>
                ) : (
                  <div>
                    <p style={ty("small", { color: c.inkMuted, margin: "0 0 12px" })}>
                      {mode === "modify" ? t("pys6.act.modifySub") : t("pys6.act.acceptSub", { who: person(t, CHECKER) })}
                    </p>
                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                      <div style={{ flex: "1 1 200px", minWidth: 190 }}>
                        <Field id="pys6-amt" label={t("pys6.act.acceptAmt")} error={aErr === "amt" ? t("pys5.act.errGross") : null}>
                          <Input id="pys6-amt" value={amt} onChange={setAmt} inputMode="decimal" />
                        </Field>
                      </div>
                      <div style={{ flex: "1 1 220px", minWidth: 200 }}>
                        <Field id="pys6-from" label={t("pys6.act.acceptFrom")} hint={t("pys6.act.acceptFromHint")}>
                          <Select id="pys6-from" value={aFrom} onChange={setAFrom}
                            options={EFFECTIVE_DATES.filter((d) => periodOf(d.at.m).state === "open").map((d) => ({ value: d.key, label: dateStr(t, d.at) }))} />
                        </Field>
                      </div>
                    </div>
                    {String(amt).trim() !== "" && Number(amt) !== subj.prop ? (
                      <Note role="late" glyph="alert" word={t("pys.st.modified")}>
                        {t("pys6.act.acceptDiff", { amt: inr(Number(amt)), rec: inr(subj.prop) })}
                      </Note>
                    ) : null}
                    <ReasonPrompt
                      idBase="pys6-accept"
                      title={mode === "modify" ? t("pys6.act.modify") : t("pys6.act.accept")}
                      options={["pys6.reason.market", "pys6.reason.band", "pys6.reason.budget", "pys6.reason.timing", "pys6.reason.other"]}
                      onConfirm={() => {
                        if (!String(amt).trim() || Number(amt) <= 0) { setAErr("amt"); return; }
                        setAErr(null);
                        const dt = EFFECTIVE_DATES.filter((d) => d.key === aFrom)[0];
                        setDone(Number(amt) === subj.prop
                          ? t("pys6.act.acceptDone", { name: t(subj.nameKey), amt: inr(Number(amt)), d: dateStr(t, dt.at), who: person(t, CHECKER) })
                          : t("pys6.act.modifyDone", { name: t(subj.nameKey), amt: inr(Number(amt)), rec: inr(subj.prop), who: person(t, CHECKER) }));
                        setMode(null); setSubject(null);
                      }}
                      onCancel={() => { setMode(null); setSubject(null); }}
                    />
                  </div>
                )}
              </Card>
            ) : (
              <Card icon="document" iconTone="off" title={t("pys6.sel.head")}>
                <EmptyState compact head={t("pys6.sel.head")} body={t("pys6.sel.body")} />
              </Card>
            )}
          </div>
        </div>

        {bulkOpen ? (
          <Card style={{ marginTop: L.gap }} icon="staff" iconTone="accent"
            title={t("pys6.bulk.title", { n: num(bulkRows.length) })} sub={t("pys6.bulk.sub")}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid " + c.ruleStrong }}>
                  <th scope="col" style={ty("colLabel", { color: c.inkFaint, textAlign: "left", padding: "0 8px 9px", textTransform: "uppercase" })}>{t("pys6.col.staff")}</th>
                  <th scope="col" style={ty("colLabel", { color: c.inkFaint, textAlign: "right", padding: "0 8px 9px", textTransform: "uppercase", width: 150 })}>{t("pys5.bulk.col.old")}</th>
                  <th scope="col" style={ty("colLabel", { color: c.inkFaint, textAlign: "right", padding: "0 8px 9px", textTransform: "uppercase", width: 150 })}>{t("pys5.bulk.col.new")}</th>
                  <th scope="col" style={ty("colLabel", { color: c.inkFaint, textAlign: "right", padding: "0 8px 9px", textTransform: "uppercase", width: 150 })}>{t("pys5.bulk.col.delta")}</th>
                </tr>
              </thead>
              <tbody>
                {bulkRows.map((p, i) => (
                  <tr key={p.id} style={{ borderBottom: i < bulkRows.length - 1 ? "1px solid " + c.rule : "none" }}>
                    <td style={ty("small", { padding: "9px 8px", color: c.ink })}>
                      <span style={{ fontWeight: 600 }}>{t(p.nameKey)}</span>
                      <span style={G3.fig("xs", { color: c.inkFaint, marginLeft: 8 })}>{p.id}</span>
                    </td>
                    <td style={G3.fig("sm", { padding: "9px 8px", textAlign: "right", color: c.inkMuted })}>{inr(p.cur)}</td>
                    <td style={G3.fig("sm", { padding: "9px 8px", textAlign: "right", color: c.ink, fontWeight: 600 })}>{inr(p.prop)}</td>
                    <td style={G3.fig("sm", { padding: "9px 8px", textAlign: "right", color: c.ink })}>{signed(propDelta(p))}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: "2px solid " + c.ruleStrong }}>
                  <td colSpan={3} style={ty("small", { padding: "12px 8px", color: c.ink, fontWeight: 700 })}>{t("pys6.bulk.total")}</td>
                  <td style={{ padding: "12px 8px", textAlign: "right" }}>
                    <Figure value={signed(bulkTotal)} size="md" weight={700} color={c.ink} align="right" />
                  </td>
                </tr>
                <tr>
                  <td colSpan={3} style={ty("small", { padding: "2px 8px 10px", color: c.inkMuted })}>{t("pys6.bulk.annual")}</td>
                  <td style={{ padding: "2px 8px 10px", textAlign: "right" }}>
                    <Figure value={signed(r2(bulkTotal * 12))} size="sm" weight={600} color={c.inkMuted} align="right" />
                  </td>
                </tr>
              </tfoot>
            </table>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
              <Button kind="primary" onClick={() => {
                if (bulkRows.length < 2) { setAErr("bulk"); return; }
                setAErr(null);
                setDone(t("pys6.bulk.done", { n: num(bulkRows.length), who: t(CHECKER.nameKey) }));
                setBulkOpen(false); setChecked({});
              }}>{t("pys6.bulk.send", { n: num(bulkRows.length) })}</Button>
              <Button kind="quiet" onClick={() => setBulkOpen(false)}>{t("pys.cancel")}</Button>
            </div>
            {aErr === "bulk" ? <div role="alert" style={ty("caption", { color: c.dangerText, marginTop: 8 })}>{t("pys6.bulk.errNone")}</div> : null}
          </Card>
        ) : null}
      </div>
    );
  }

  /* ============================================================
     THE PAGE — one tablist, one panel. Exactly ONE <TabPanel> is
     mounted at a time, matching the active tab: kit.jsx's Tabs sets
     aria-controls only on the selected tab, so a panel that is not the
     current one has no reason to exist in the accessibility tree.
     ============================================================ */
  const TABS_ID = "pys3-tabs";

  function PYSalary({ role, onNavigate }) {
    const { t } = useLang();
    const [tab, setTab] = useState("groups");
    const goTab = (k) => setTab(k);

    const items = [
      { key: "groups", label: t("pys.tab.groups") + " (" + num(PAY_GROUPS.length) + ")" },
      { key: "structures", label: t("pys.tab.structures") + " (" + num(STRUCTURES.length) + ")" },
      { key: "honorarium", label: t("pys.tab.honorarium") + " (" + num(HON_RULES.length) + ")" },
      { key: "people", label: t("pys.tab.people") },
      { key: "proposals", label: t("pys.tab.proposals") + " (" + num(PENDING.length) + ")" },
    ];

    return (
      <Shell
        role={role}
        onNavigate={onNavigate}
        tabs={<Tabs items={items} active={tab} onChange={setTab} ariaLabel={t("pys.tabs.aria")} idBase={TABS_ID} />}
      >
        {tab === "groups" ? (
          <TabPanel idBase={TABS_ID} tabKey="groups" style={{ marginTop: 20 }}>
            <TabIntro qKey="pys2.q" />
            <PayGroupsTab goTab={goTab} />
          </TabPanel>
        ) : null}
        {tab === "structures" ? (
          <TabPanel idBase={TABS_ID} tabKey="structures" style={{ marginTop: 20 }}>
            <TabIntro qKey="pys3.q" />
            <StructuresTab goTab={goTab} />
          </TabPanel>
        ) : null}
        {tab === "honorarium" ? (
          <TabPanel idBase={TABS_ID} tabKey="honorarium" style={{ marginTop: 20 }}>
            <TabIntro qKey="pys4.q" />
            <HonorariumTab goTab={goTab} onNavigate={onNavigate} />
          </TabPanel>
        ) : null}
        {tab === "people" ? (
          <TabPanel idBase={TABS_ID} tabKey="people" style={{ marginTop: 20 }}>
            <TabIntro qKey="pys5.q" />
            <PeopleTab goTab={goTab} />
          </TabPanel>
        ) : null}
        {tab === "proposals" ? (
          <TabPanel idBase={TABS_ID} tabKey="proposals" style={{ marginTop: 20 }}>
            <TabIntro qKey="pys6.q" />
            <ProposalsTab goTab={goTab} />
          </TabPanel>
        ) : null}
      </Shell>
    );
  }

  /* ============================================================
     PROMOTION CANDIDATES for design/v3/kit.jsx (not added here —
     kit.jsx is out of this file's scope):
     · EqRow / Ledger   — the signed arithmetic column. Third
                          independent copy now (payslips.jsx,
                          payroll.jsx, here). Overdue.
     · ReasonPrompt     — reason code + note + never-disabled confirm.
                          Third independent copy. Overdue.
     · OffAction        — a control that is off, with the reason in
                          words and a live announcement on click.
     · Note             — a tinted advisory with a glyph AND a word, so
                          state is never colour alone. Used 20+ times
                          in this file alone.
     · Fact             — a labelled read-out; the alternative to a KPI
                          tile grid.
     · SignOff          — the two-person maker/checker block, with the
                          reason the approve control is absent.
     · ConfigLine       — the pinned StatutoryConfig provenance line.
                          Every money screen in the product needs it.
     · RowCheck         — a real, labelled checkbox for bulk bars.
     · DidIt            — a status readback for a canvas action.
     · ArrearsTable     — month / run / pinned version / paid days /
                          amount. PY-17 and AC-06 want the same shape.
     ============================================================ */

  window.Pages3 = window.Pages3 || {};
  /* The three setup tabs and the proposals queue, published shell-less
     for the modules that now own them: PY-02/03/04 are "Pay rules",
     PY-06 sits beside the salary register. PeopleTab is NOT published
     — PY-05 was rebuilt as a register plus a record of its own, and a
     second copy of it is exactly what this export exists to prevent. */
  /* The data layer, published so PY-05's rebuilt register and record
     price a salary from the SAME structures, periods and ledgers this
     file already proved. A second fixture set would let Ananya earn
     94,800 on one screen and something else on another, which is the
     one bug a payroll product may never have. */
  window.Pages3.PYSalData = {
    STAFF: STAFF, staffById: staffById,
    PAY_GROUPS: PAY_GROUPS, groupByKey: groupByKey,
    STRUCTURES: STRUCTURES, structByKey: structByKey,
    HON_RULES: HON_RULES, honByKey: honByKey,
    structureFor: structureFor, linesFor: linesFor, priceComponents: priceComponents,
    wageVerdict: wageVerdict, WAGE_RULE: WAGE_RULE,
    PERIODS: PERIODS, periodOf: periodOf,
    EFFECTIVE_DATES: EFFECTIVE_DATES, DEFAULT_EFFECTIVE: DEFAULT_EFFECTIVE,
    arrearsSchedule: arrearsSchedule, SIM: SIM, SIM_MONTH_DAYS: SIM_MONTH_DAYS,
    MAKER: MAKER, CHECKER: CHECKER, r2: r2,
    CFG_PINNED: CFG_PINNED, CFG_APR: CFG_APR, CFG_JUL: CFG_JUL, CFG_SEP: CFG_SEP,
    RUN_AUG: RUN_AUG,
  };
  window.Pages3.PYSalParts = {
    PayGroups: PayGroupsTab, Structures: StructuresTab,
    Honorarium: HonorariumTab, Proposals: ProposalsTab,
  };
  window.Pages3.PYSalary = PYSalary;

})();
