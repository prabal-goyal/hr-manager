/* @jsxRuntime classic */
/* ============================================================
   Naveya — Group Admin wave 1 · window.Pages3.{GAHome,GAUsers,GAAudit}

   GA-01 Group overview · GA-04 Users & role assignments · GA-08 Audit log
   docs/screen-inventory.md "9 · Group Admin". Modules cited inline per
   dev-spec: M1 §Organization & Tenancy, M2 §Identity Roles & Access,
   §4.1 RBAC (permission x scope), §4.2 Audit, §8 Field-level access,
   §6.2 User/Role/RoleAssignment, §6.11 AuditLog, M15 §Business rules
   (group dashboards), M15 §API/§Acceptance (audit log).

   ONE QUESTION EACH:
     GA-01 "how is the whole group doing, and which campus needs
           attention?"
     GA-04 "who can get in, and what can they reach?"
     GA-08 "who changed what, and when — and can I prove it?"

   Domain guardrails encoded here (not just described):
     · Scope = all campuses INSIDE one tenant (M1 §Permissions —
       org.manage at group scope). Nothing here reads or implies another
       TENANT's data; the comparison is cross-campus, never cross-tenant.
     · GA-04's "Assign a role" flow is the product's highest-leverage
       action (ui-compliance-requirements.md A3/A4): role + scope carry
       NO defaults, a reason is required, and privileged roles
       (Group Admin, Payroll Operator, Accountant — anything that can
       reach payroll.approve or people.pii.read) land `pending`, not
       `active`, until a SECOND Group Admin — a distinct individual,
       never the grantor — confirms. The current session (Ananya Rao)
       can never approve her own grant; the seeded pending item from a
       second admin (Devansh Kulkarni) demonstrates the side that IS
       actionable by her.
     · GA-08 is append-only evidence (O6): no edit/delete affordance
       exists anywhere on this screen — grep CONTROL labels, not prose,
       to prove it (see the file-end self-check comment). Sensitive
       fields in a diff render as "changed", never re-expose the value
       (O3 + M15 "audit must record that a value changed without
       re-exposing it").

   Composed only from window.G3 / window.UI3. No kit/tokens/screens/
   sibling-page edits. Two components are defined locally because the
   kit doesn't carry them yet (both are candidates for promotion, see
   the note near their definitions): Segmented (pill switch, generalised
   from LangSwitcher's pattern) and StatusChip (Chip + explicit icon,
   sidestepping StatusMark's attendance-flavoured glyph inference for a
   governance vocabulary — invited/active/inactive/pending/revoked/
   no-role/maker+checker/high-sensitivity have no attendance analogue).
   ============================================================ */
(function () {
  const G3 = window.G3;
  const UI = window.UI3;
  const { useState, useMemo } = React;
  const {
    useTheme, ThemeToggle, useLang, addStrings,
    Rail, Motif, Card, Register, Button, LinkButton, Field, Input, Select,
    Chip, Figure, inr, num, Icon, ActionMenu, EmptyState, ErrorState,
    Skeleton, Meter, TitleMark, SideScreen, BackBar, Avatar, StatusMark, Switch, Tabs, TabPanel,
  } = UI;

  /* ============================================================
     STRINGS
     ============================================================ */
  addStrings({
    en: {
      /* shared top strip / trust identity */
      "ga.top.trust": "Sunrise Education Trust",
      "ga.top.scope": "Group · all campuses",

      /* ---- GA-01 · Group overview ---- */
      "ga1.title": "Group overview",
      "ga1.sub": "Every campus in Sunrise Education Trust, one tenant, one comparison.",
      "ga1.period.aria": "Choose the reporting period",
      "ga1.period.month": "August 2026",
      "ga1.period.fy": "FY 2026–27",
      "ga1.period.ay": "AY 2026–27",
      "ga1.scenario.aria": "Preview a different overview state",
      "ga1.scenario.group": "Group",
      "ga1.scenario.firstRun": "New trust",
      "ga1.scenario.loading": "Loading",
      "ga1.scenario.error": "Error",
      "ga1.export": "Export group summary",
      "ga1.export.busy": "Preparing PDF…",
      "ga1.export.done": "Exported at {time} by {who} — recorded in the audit log",

      "ga1.kpi.headcount": "Headcount",
      "ga1.kpi.headcount.note": "across {n} campuses",
      "ga1.kpi.attendance": "Attendance rate",
      "ga1.kpi.attendance.note": "weighted by headcount",
      "ga1.kpi.payroll": "Payroll cost this period",
      "ga1.kpi.payroll.note": "{n} of {total} campuses run",
      "ga1.kpi.liability": "Statutory liability",
      "ga1.kpi.liability.note": "PF · ESI · PT · TDS · LWF",

      "ga1.shape.title": "Campus comparison — shape",
      "ga1.shape.sub": "Headcount and attendance, before the numbers",
      "ga1.shape.headcount": "By headcount",
      "ga1.shape.attendance": "By attendance rate",
      "ga1.shape.staff": "{n} staff",
      "ga1.shape.caveat": "Campus sizes differ ({min}\u2013{max} staff) and these are per-campus rates, not weighted. The smallest is a small sample.",

      "ga1.reg.title": "Every campus, side by side",
      "ga1.reg.sub": "Group totals sum from this table — nothing above is a separate source",
      "ga1.col.campus": "Campus",
      "ga1.col.act": "Actions",
      "ga1.viewStaff": "View staff",
      "ga1.reg.foot": "People, attendance and leave. Money belongs to payroll and the accountant, and is not shown to this desk.",
      "gast.title": "Staff at {campus}",
      "gast.sub": "{n} on the register · {state}",
      "gast.col.who": "Who",
      "gast.col.state": "Where they are",
      "gast.col.act": "Actions",
      "gast.menuAria": "Actions on {name}",
      "gast.openRecord": "Open the full record",
      "gast.foot": "The register as HR keeps it. Nothing here is changed from this screen.",
      "gast.f.find": "Find",
      "gast.f.findPh": "A name, a staff ID, or a post",
      "gast.f.kind": "Staff type",
      "gast.f.kindAll": "Everyone",
      "gast.empty.head": "Nobody matches",
      "gast.empty.body": "Clear the search or the staff-type filter.",
      "gast.kind.teaching": "Teaching",
      "gast.kind.nonTeaching": "Non-teaching",
      "gast.st.active": "Working",
      "gast.st.probation": "On probation",
      "gast.st.notice": "Serving notice",
      "gast.f.dept": "Department",
      "gast.c.permanent": "Permanent",
      "gast.c.probation": "Permanent, on probation",
      "gast.c.fixed": "Fixed-term",
      "gast.p.pgtPhy": "Post Graduate Teacher, Physics",
      "gast.p.hod": "Head of Science",
      "gast.p.hr": "HR Operator",
      "gast.p.prt": "Primary Teacher, Class III",
      "gast.p.driver": "Bus driver",
      "gast.p.tgtBio": "Trained Graduate Teacher, Biology",
      "gast.p.tgtChem": "Trained Graduate Teacher, Chemistry",
      "gast.p.facilities": "Facilities in-charge",
      "gast.p.accounts": "Accounts executive",
      "gast.p.ntt": "Pre-primary Teacher",
      "gast.d.science": "Science",
      "gast.d.primary": "Primary",
      "gast.d.office": "School office",
      "gast.d.transport": "Transport",
      "gast.r.anjali": "Anjali Deshpande, Head of Science",
      "gast.r.radhika": "Radhika Menon, Principal",
      "gast.r.rajan": "Rajan Pillai, Head of HR",
      "gast.r.ramesh": "Ramesh Iyengar, Facilities in-charge",
      "gast.ananya": "Ananya Rao",
      "gast.meenakshi": "Meenakshi Pillai",
      "gast.meera": "Meera Nair",
      "gast.kavya": "Kavya Nair",
      "gast.manju": "Manjunath Gowda",
      "gast.divya": "Divya Kapoor",
      "gast.ramesh": "Ramesh Iyengar",
      "gast.suresh": "Suresh Kamath",
      "gast.farah": "Farah Sheikh",
      "gast.iqbal": "Iqbal Ahmed",
      "gast.priya": "Priya Nair",
      "gast.meta": "Read-only · the register as HR keeps it",
      "gast.back.overview": "Back to the group overview",
      "gast.back.register": "Back to the {campus} register",
      "gast.col.code": "Staff ID",
      "gast.col.kind": "Staff type",
      "gast.col.dept": "Department",
      "gast.col.contract": "Employment",
      "gast.col.doj": "Joined",
      "gast.col.until": "Runs until",
      "gast.f.deptAll": "Every department",
      "gast.footN": "{shown} of {total} shown.",
      "gast.untilDay": "Last working day {date}",
      "gast.f.ongoing": "Ongoing",
      "ga1.col.state": "State",
      "ga1.col.headcount": "Headcount",
      "ga1.col.attendance": "Attendance",
      "ga1.col.leaveUtil": "Leave used",
      "ga1.col.payroll": "Payroll cost",
      "ga1.col.liability": "Statutory liability",
      "ga1.notRun": "Not run yet",
      "ga1.totals": "Group total",
      "ga1.drill": "Drill into this campus",
      "ga1.drillMenu.aria": "Actions for {campus}",
      "ga1.partial.note": "{campus}'s August payroll has not been run — its cost and liability are excluded from the group total above until it is.",

      "ga1.exc.title": "Needs group attention",
      "ga1.exc.sub": "Exceptions that only a Group Admin can clear",
      "ga1.exc.open": "Open",
      "ga1.exc.payroll.text": "{campus} campus — August payroll has not been run",
      "ga1.exc.filing.text": "{campus} campus — PT return overdue by {days} days",
      "ga1.exc.docs.text": "{n} staff documents pending HR verification, group-wide",
      "ga1.exc.empty.head": "No exceptions right now",
      "ga1.exc.empty.body": "Every campus is current on payroll, filings and document verification.",
      "ga1.kpi.accounts": "Accounts that can sign in",
      "ga1.kpi.accounts.note": "{n} waiting on your approval",
      "ga1.exc.col.what": "What needs attention",
      "ga1.exc.col.where": "Where",
      "ga1.exc.where.group": "All campuses",
      "ga1.exc.col.since": "Since",
      "ga1.exc.foot": "Every line here is yours to clear. Pay, filings and document verification belong to other desks and are not shown.",
      "ga1.exc.go.users": "Open Users",
      "ga1.exc.go.systems": "Open Systems",
      "ga1.exc.since.days": "{n} days",
      "ga1.exc.since.time": "Today, {time}",
      "ga1.exc.since.date": "{date}",
      "ga1.exc.since.open": "Open since the year was set",
      "ga1.exc.since.inDays": "In {n} days",
      "ga1.exc.principal.text": "No active Principal account",
      "ga1.exc.principal.why": "Escalated leave at this campus has nobody to reach, so requests sit until somebody notices.",
      "ga1.exc.reader.text": "A reader has sent nothing since this morning",
      "ga1.exc.reader.why": "{n} people show no punch today. Left alone, the day is read as absence and their paid days move.",
      "ga1.exc.maker.text": "One person holds both sides of the payroll control",
      "ga1.exc.maker.why": "They can approve a run they made themselves — which is the one thing maker-checker exists to stop.",
      "ga1.exc.calendar.text": "The year has no holidays after December",
      "ga1.exc.calendar.why": "Leave cannot be checked against a calendar that stops. January onwards, a closed day counts as a working day.",
      "ga1.exc.token.text": "Two attendance tokens expire soon",
      "ga1.exc.token.why": "When they do, the biometric middleware stops being let in and punches stop arriving — silently.",

      "ga1.firstRun.head": "This trust has one campus so far",
      "ga1.firstRun.body": "{campus} is the only campus. Add a second under Systems \u2192 Organisation and the comparison opens up.",
      "ga1.error.head": "Could not load the group overview",
      "ga1.error.body": "The comparison service did not respond. Try again, or open a single campus from Org structure in the meantime.",
      "ga1.error.retry": "Try again",

      /* ---- GA-04 · Users & role assignments ---- */
      "ga4.title": "Users & role assignments",
      "ga4.you.initials": "DK",
      "ga4.tabsAria": "The two halves of user administration",
      "ga4.tab.people": "People",
      "ga4.tab.approvals": "Approvals",
      "ga4.reg.sub": "{n} accounts across the group.",
      "ga4.reg.foot": "Everything here is done from a row’s actions, and every change asks why before it commits.",
      "ga4.col.signIn": "Last signed in",
      "ga4.col.act": "Actions",
      "ga4.mfa.onShort": "Second factor on",
      "ga4.mfa.offShort": "No second factor",
      "ga4.act.open": "Open the account",
      "ga4.act.roles": "Change what they can reach",
      "ga4.act.cred": "Manage their sign-in",
      "ga4.act.pii": "What they may see",
      "ga4.act.deact": "Switch off their sign-in",
      "ga4.act.why": "Why",
      "ga4.act.whyHint": "It goes on the audit log, and the person it is about can ask to see it.",
      "ga4.act.errWhy": "Say why. Access that changes without a reason is access nobody can defend.",
      "ga4.act.errShort": "A sentence, please — enough for somebody reading it in a year.",
      "ga4.act.whatHappens": "What this does",
      "ga4.act.c.audit": "Written against your name on the audit log, with the reason.",
      "ga4.act.notNow": "Not now",
      "ga4.act.dismiss": "Dismiss",
      "ga4.det.signIn": "How they get in",
      "ga4.det.lastIn": "Last signed in",
      "ga4.det.email": "Sign-in address",
      "ga4.det.credNote": "A password is never shown here, to anybody, at any time. It can only be replaced.",
      "ga4.det.reach": "What they can reach",
      "ga4.roles.title": "What they can reach",
      "ga4.roles.sub": "A role is a role AT a place. {name} gets everything the roles below carry, and nothing else.",
      "ga4.roles.has": "What they hold now",
      "ga4.roles.hasNone": "Nothing. They can sign in and see their own record.",
      "ga4.roles.at": "at {where}",
      "ga4.roles.granted": "given by {who}, {d}",
      "ga4.roles.takeAway": "Take it away",
      "ga4.roles.add": "Give them another role",
      "ga4.roles.cancelAdd": "Never mind",
      "ga4.roles.which": "Which role",
      "ga4.roles.scope": "Over what",
      "ga4.roles.where": "Which one",
      "ga4.roles.pick": "Choose…",
      "ga4.roles.waiting": "Waiting on a second Group Admin",
      "ga4.roles.save": "Record it",
      "ga4.roles.done": "{name}’s access has changed.",
      "ga4.roles.whyPh": "Covering payroll while R. Venkataraman is on leave until 14 October.",
      "ga4.roles.errRole": "Choose a role.",
      "ga4.roles.errLevel": "Choose what it covers.",
      "ga4.roles.errWhere": "Choose which one.",
      "ga4.roles.errNothing": "Nothing has changed yet.",
      "ga4.roles.c.add": "They get {role} at {where}, from now.",
      "ga4.roles.c.drop": "{n} role(s) end immediately. Anything they were mid-way through stops.",
      "ga4.roles.c.second": "This one does not start until a second Group Admin — not you — signs it off. It sits under Approvals until they do.",
      "ga4.level.group": "The whole group",
      "ga4.level.campus": "One campus",
      "ga4.level.department": "One department",
      "ga4.where.group": "the whole group",
      "ga4.where.indiranagar": "Indiranagar",
      "ga4.where.whitefield": "Whitefield",
      "ga4.where.science": "Science",
      "ga4.where.primary": "Primary",
      "ga4.where.admin": "Administration",
      "ga4.cred.title": "Manage their sign-in",
      "ga4.cred.sub": "{name} · {email}",
      "ga4.cred.word": "A new password",
      "ga4.cred.generate": "Let the system make one",
      "ga4.cred.type": "Type one myself",
      "ga4.cred.generateNote": "A readable one they can be told over the phone, and must change on first use.",
      "ga4.cred.typeLabel": "The password",
      "ga4.cred.typePh": "At least eight characters",
      "ga4.cred.errTyped": "Eight characters or more.",
      "ga4.cred.mustChange": "Make {name} choose their own at next sign-in",
      "ga4.cred.resetMfa": "Clear their second factor — they set it up again from scratch",
      "ga4.cred.signOut": "Sign them out everywhere, on every device",
      "ga4.cred.whyPh": "She has a new phone and cannot reach the old authenticator.",
      "ga4.cred.set": "Set it",
      "ga4.cred.c.word": "The old password stops working the moment you press this.",
      "ga4.cred.c.must": "They are asked to choose their own the first time they sign in.",
      "ga4.cred.c.notMust": "They keep this password until somebody changes it again.",
      "ga4.cred.c.mfa": "Their second factor is cleared and must be set up again before they can get in.",
      "ga4.cred.c.out": "Every open session ends, on every device, immediately.",
      "ga4.cred.doneTitle": "Their new password",
      "ga4.cred.doneSub": "For {name}. This is the only time it is shown.",
      "ga4.cred.theWord": "The password",
      "ga4.cred.onceOnly": "Write it down or say it now. It cannot be shown again.",
      "ga4.cred.onceBody": "Naveya does not store a readable copy — not for you, not for support, not for anybody. If {name} loses it, you set another one.",
      "ga4.cred.noted": "I have it",
      "ga4.cred.done": "{name}’s sign-in has been reset.",
      "ga4.pii.title": "What they may see",
      "ga4.pii.sub": "Beyond what their roles already carry. These two are granted one person at a time, never by role.",
      "ga4.pii.identifiers": "Full identifiers — PAN, UAN, bank account",
      "ga4.pii.identifiersNote": "Aadhaar is never shown in full to anybody, with or without this.",
      "ga4.pii.salary": "Salary figures on the staff record",
      "ga4.pii.salaryNote": "Payroll can always see what it runs. This is about reading somebody else’s pay outside a run.",
      "ga4.pii.whyPh": "Taking over statutory filings for the quarter; needs the UANs to reconcile the ECR.",
      "ga4.pii.save": "Record it",
      "ga4.pii.errNothing": "Nothing has changed yet.",
      "ga4.pii.done": "What {name} may see has changed.",
      "ga4.pii.c.log": "Every time they open one of these, that opening is logged with their name against it.",
      "ga4.pii.c.review": "Grants are reviewed every quarter and lapse if nobody renews them.",
      "ga4.deact.title": "Switch off {name}’s sign-in",
      "ga4.deact.sub": "They stay on the staff register. This is about the account, not the job.",
      "ga4.deact.checker": "Who is signing this off with you",
      "ga4.deact.checkerHint": "Switching off an account needs two people. Yours is one of them.",
      "ga4.deact.errChecker": "Name the second person.",
      "ga4.deact.whyPh": "Left the school on 30 September; her handover is complete.",
      "ga4.deact.confirm": "Switch it off",
      "ga4.deact.c.out": "Every session ends at once and they cannot sign in again.",
      "ga4.deact.c.roles": "Every role they hold stops with it.",
      "ga4.deact.c.record": "Their staff record, documents and payroll history are untouched.",
      "ga4.deact.done": "{name}’s sign-in is off.",
      "ga4.ap.view.waiting": "Waiting on you",
      "ga4.ap.view.done": "Decided",
      "ga4.ap.view.expired": "Expired",
      "ga4.ap.title.waiting": "Asked of you",
      "ga4.ap.sub.waiting": "Things somebody else cannot do without a Group Admin. Oldest first.",
      "ga4.ap.title.done": "Already decided",
      "ga4.ap.sub.done": "What was approved or refused, with the reason on each one.",
      "ga4.ap.title.expired": "Nobody answered these",
      "ga4.ap.sub.expired": "A request left a week goes stale and can no longer be approved.",
      "ga4.ap.foot": "A request expires after a week on purpose. Approving a week-old request to reset a lost phone is how an account gets taken.",
      "ga4.ap.col.what": "What is asked",
      "ga4.ap.col.who": "For whom",
      "ga4.ap.col.when": "Asked",
      "ga4.ap.col.state": "Where it is",
      "ga4.ap.col.act": "Actions",
      "ga4.ap.by": "by {who}",
      "ga4.ap.forWho": "for {name}",
      "ga4.ap.askedBy": "Asked by {who} on {d} · {id}",
      "ga4.ap.st.waiting": "Waiting on you",
      "ga4.ap.st.approved": "Approved",
      "ga4.ap.st.declined": "Refused",
      "ga4.ap.st.expired": "Expired",
      "ga4.ap.approve": "Approve it",
      "ga4.ap.decline": "Refuse it",
      "ga4.ap.approveTitle": "Approve this",
      "ga4.ap.declineTitle": "Refuse this",
      "ga4.ap.whyHint": "The person who asked reads it, and so does the audit log.",
      "ga4.ap.whyPhA": "Spoke to her on the office line and confirmed it was her before approving.",
      "ga4.ap.whyPhD": "Could not reach her to confirm the request came from her. Ask again from the office.",
      "ga4.ap.expiredWhy": "It expired. Ask for it again.",
      "ga4.ap.doneWhy": "It has already been decided.",
      "ga4.ap.menuAria": "Actions on request {id}",
      "ga4.ap.doneApproved": "Approved — {what} for {name}.",
      "ga4.ap.doneDeclined": "Refused — {what} for {name}. They have been told why.",
      "ga4.ap.k.password": "A new password",
      "ga4.ap.k.mfa": "Clear a second factor",
      "ga4.ap.k.role": "A role",
      "ga4.ap.k.pii": "Access to identifiers",
      "ga4.ap.w.password": "She has never signed in and the invite link has run out. HR asks for a password she can be given over the phone.",
      "ga4.ap.w.password2": "Asked by email from an address that is not hers.",
      "ga4.ap.w.mfa": "New phone; the old authenticator is gone and he cannot get past the second step.",
      "ga4.ap.w.mfa2": "Lost phone, raised by the person themselves from an unrecognised device.",
      "ga4.ap.w.role": "Payroll Operator across the group, to cover R. Venkataraman’s leave until 14 October.",
      "ga4.ap.w.pii": "Taking over the quarter’s statutory filings; needs UANs to reconcile the ECR.",
      "ga4.ap.d.role": "Granted by Devansh Kulkarni. A second Group Admin who is not the granter has to sign it.",
      "ga4.ap.n.pii": "Confirmed with the accountant that the filing is hers this quarter.",
      "ga4.ap.n.declined": "Called her desk; she had not asked for anything.",
      "ga4.ap.c.password": "A password is generated and shown to you once, to pass on. Their old one stops working.",
      "ga4.ap.c.mfa": "Their second factor is cleared. They set it up again the next time they sign in.",
      "ga4.ap.c.role": "The role starts now and appears on their account.",
      "ga4.ap.c.pii": "They can open full identifiers, and every opening is logged against their name.",
      "ga4.ap.c.declined": "Nothing changes. {who} is told, with your reason.",
      "ga4.ap.empty.waiting.head": "Nothing is waiting on you",
      "ga4.ap.empty.waiting.body": "Password resets, second factors, roles and PII grants land here when somebody cannot do them alone.",
      "ga4.ap.empty.done.head": "Nothing decided yet",
      "ga4.ap.empty.done.body": "What you approve or refuse collects here, with the reason you gave.",
      "ga4.ap.empty.expired.head": "Nothing has gone stale",
      "ga4.ap.empty.expired.body": "Requests expire after a week. None have.",
      "ganame.devansh": "Devansh Kulkarni",
      "ganame.priya": "Priya Menon",
      "ganame.devika": "Devika Rao",
      "ga4.sub": "Who can get in, what they can reach, and who holds the keys to it.",
      "ga4.invite": "Invite a user",
      "ga4.search.placeholder": "Search by name or email",
      "ga4.search.aria": "Search users",
      "ga4.search.empty.head": "No user matches “{q}”",
      "ga4.search.empty.body": "Check the spelling, or clear the search to see everyone.",
      "ga4.search.clear": "Clear search",

      "ga4.col.user": "User",
      "ga4.col.status": "Status",
      "ga4.col.mfa": "MFA",
      "ga4.col.lastSignIn": "Last sign-in",
      "ga4.col.roles": "Roles",
      "ga4.rowMenu.aria": "Actions for {name}",

      "ga4.status.active": "Active",
      "ga4.status.invited": "Invited",
      "ga4.status.inactive": "Inactive",
      "ga4.status.noRole": "No role assigned",
      "ga4.mfa.on": "Enabled",
      "ga4.mfa.off": "Not set",
      "ga4.lastSignIn.never": "Never signed in",
      "ga4.roles.none": "Signs in, sees nothing",
      "ga4.roles.more": "+{n} more",

      "ga4.detail.empty.head": "Select a user",
      "ga4.detail.empty.body": "Open a row to see role assignments, MFA state and effective permissions.",
      "ga4.detail.staffId": "Staff ID",
      "ga4.detail.email": "Email",
      "ga4.detail.section.roles": "Role assignments",
      "ga4.detail.section.pii": "PII & salary field access",
      "ga4.detail.section.security": "Security",
      "ga4.detail.assign": "Assign a role",
      "ga4.detail.resetMfa": "Reset MFA",
      "ga4.detail.resetMfa.confirm": "Force a re-enrolment at next sign-in?",
      "ga4.detail.resetMfa.done": "MFA reset requested — recorded in the audit log",
      "ga4.detail.deactivate": "Deactivate user",
      "ga4.detail.previewPerms": "Preview effective permissions",
      "ga4.detail.hidePerms": "Hide effective permissions",
      "ga4.detail.noRoles.head": "No role held",
      "ga4.detail.noRoles.body": "This person can sign in but reaches nothing until a role is assigned. This must stay visible, not hidden.",

      "ga4.role.grantedBy": "Granted by {who} · {date}",
      "ga4.role.reason": "Reason: {reason}",
      "ga4.role.pending": "Pending a second Group Admin's approval",
      "ga4.role.pendingSelf": "Awaiting approval by another Group Admin — you cannot approve your own grant",
      "ga4.role.revoke": "Revoke",
      "ga4.role.revoke.reason.label": "Reason for revoking",
      "ga4.role.revoke.confirm": "Revoke role",
      "ga4.role.revoke.cancel": "Cancel",
      "ga4.role.makerChecker.warn": "This user also holds Payroll Operator (maker). Granting checker lets them approve their own runs.",
      "ga4.warn.makerChecker": "Maker + checker",

      "ga4.assign.step.form": "Assign a role",
      "ga4.assign.step.review": "Review before granting",
      "ga4.assign.role.label": "Role",
      "ga4.assign.role.placeholder": "Choose a role — no default",
      "ga4.assign.role.desc.title": "What this role can do",
      "ga4.assign.scopeLevel.label": "Scope",
      "ga4.assign.scopeLevel.placeholder": "Choose group, campus or department",
      "ga4.assign.scopeValue.label": "Which one",
      "ga4.assign.scopeValue.placeholder": "Choose a scope",
      "ga4.assign.scope.note": "You can grant any scope inside Sunrise Education Trust. The picker itself is the privilege-escalation guard (M2).",
      "ga4.assign.effective.label": "Effective from",
      "ga4.assign.reason.label": "Reason (required)",
      "ga4.assign.reason.placeholder": "Why is this person getting this access?",
      "ga4.assign.error.incomplete": "Choose a role, a scope, and give a reason before continuing.",
      "ga4.assign.cta.review": "Review grant",
      "ga4.assign.cta.back": "Back",
      "ga4.assign.cta.confirm": "Confirm grant",
      "ga4.assign.cta.cancel": "Cancel",
      "ga4.assign.review.grants": "Grants {role} to {user} at {scope}, effective {date}.",
      "ga4.assign.review.gains": "Permissions gained",
      "ga4.assign.review.immediate.word": "Takes effect immediately",
      "ga4.assign.review.immediate.text": "Applies on the user's next token refresh.",
      "ga4.assign.review.pending.word": "Needs a second approval",
      "ga4.assign.review.pending.text": "A different Group Admin must confirm this before it takes effect — you cannot confirm your own grant.",
      "ga4.assign.done.active": "Granted — active from the user's next sign-in.",
      "ga4.assign.done.pending": "Submitted — pending approval by a second Group Admin.",

      "ga4.pii.field.piiRead": "Reveal PAN / Aadhaar / bank details",
      "ga4.pii.field.salary": "Reveal salary & CTC",
      "ga4.pii.off": "Off",
      "ga4.pii.on": "On",
      "ga4.pii.grant.reason.label": "Reason for this grant",
      "ga4.pii.revoke.reason.label": "Reason for revoking",
      "ga4.pii.confirm.grant": "Grant access",
      "ga4.pii.confirm.revoke": "Revoke access",
      "ga4.pii.note": "Every reveal by this user is logged against their name, whether this is on or off (§8 Field-level access).",

      "ga4.deactivate.title": "Deactivate {name}?",
      "ga4.deactivate.body": "Sessions are revoked immediately. This is reversible — reactivating restores access.",
      "ga4.deactivate.pending.title": "Reassign pending items first",
      "ga4.deactivate.pending.body": "{name} owns approvals that must move to someone else before deactivating them.",
      "ga4.deactivate.pending.item": "{entity} — awaiting their approval",
      "ga4.deactivate.reassign.label": "Reassign to",
      "ga4.deactivate.reassign.placeholder": "Choose an eligible checker",
      "ga4.deactivate.reason.label": "Reason",
      "ga4.deactivate.typed.label": "Type the staff ID {id} to confirm",
      "ga4.deactivate.typed.error": "That doesn't match {id} — check and try again.",
      "ga4.deactivate.retain.note": "What is retained: the employee record, service history and past payroll (O2).",
      "ga4.deactivate.cta": "Deactivate",
      "ga4.deactivate.cancel": "Cancel",
      "ga4.deactivate.done": "Deactivated — sessions revoked, recorded in the audit log.",

      "ga4.pending.title": "Awaiting your approval",
      "ga4.pending.sub": "Granted by someone else — a Group Admin who is not you must have signed off",
      "ga4.pending.item": "{role} @ {scope} for {user}",
      "ga4.pending.meta": "Requested by {who} · {date} · reason: “{reason}”",
      "ga4.pending.approve": "Approve",
      "ga4.pending.decline": "Decline",
      "ga4.pending.decline.reason.label": "Reason for declining",
      "ga4.pending.decline.confirm": "Decline grant",
      "ga4.pending.approved": "Approved by you — now active.",
      "ga4.pending.declined": "Declined — the grant did not take effect.",

      "ga4.invite.title": "Invite a user",
      "ga4.invite.linkEmployee.label": "Link to an employee record",
      "ga4.invite.linkEmployee.yes": "Yes — link to an existing employee",
      "ga4.invite.linkEmployee.no": "No — admin-only account",
      "ga4.invite.employee.label": "Employee",
      "ga4.invite.employee.placeholder": "Search the staff register",
      "ga4.invite.email.label": "Email",
      "ga4.invite.phone.label": "Phone",
      "ga4.invite.role.label": "Initial role",
      "ga4.invite.role.placeholder": "Choose a role — no default",
      "ga4.invite.scope.label": "Scope",
      "ga4.invite.error.duplicate": "A user with this email already exists — {name}. Invite them from their existing row instead.",
      "ga4.invite.error.incomplete": "Add an email and choose an initial role before sending the invite.",
      "ga4.invite.cta": "Send invite",
      "ga4.invite.cancel": "Cancel",
      "ga4.invite.done": "Invite sent to {email} — recorded in the audit log.",

      "ga4.perm.groups.org": "Organization",
      "ga4.perm.groups.iam": "Identity & access",
      "ga4.perm.groups.people": "People",
      "ga4.perm.groups.documents": "Documents",
      "ga4.perm.groups.leave": "Leave",
      "ga4.perm.groups.attendance": "Attendance",
      "ga4.perm.groups.payroll": "Payroll",
      "ga4.perm.groups.statutory": "Statutory",

      /* ---- GA-08 · Audit log ---- */
      "ga8.title": "Audit log",
      "ga8.sub": "Everything anybody changed, written once and never edited. Reading it is the only thing you can do here.",
      "ga8.notEditable": "This log cannot be edited.",
      "ga8.filters.actor.label": "Actor",
      "ga8.filters.actor.all": "Any actor",
      "ga8.filters.entity.label": "Entity type",
      "ga8.filters.entity.all": "Any entity",
      "ga8.filters.action.label": "Action",
      "ga8.filters.action.all": "Any action",
      "ga8.filters.range.label": "Date range",
      "ga8.filters.range.7d": "Last 7 days",
      "ga8.filters.range.30d": "Last 30 days",
      "ga8.filters.range.all": "All time",
      "ga8.filters.sensitivity.label": "Sensitivity",
      "ga8.filters.sensitivity.all": "Any",
      "ga8.filters.sensitivity.high": "High sensitivity",
      "ga8.filters.sensitivity.standard": "Standard",
      "ga8.filters.clear": "Clear filters",
      "ga8.following": "Following {entity} — showing its full history",
      "ga8.following.clear": "Stop following",

      "ga8.col.time": "Time",
      "ga8.col.actor": "Actor",
      "ga8.col.action": "Action",
      "ga8.col.entity": "Entity",
      "ga8.col.scope": "Scope",
      "ga8.col.sensitivity": "Sensitivity",
      "ga8.rowMenu.aria": "Actions for this entry",
      "ga8.menu.open": "Open entry",
      "ga8.menu.follow": "Follow this record's history",

      "ga8.sensitivity.high": "High sensitivity",
      "ga8.sensitivity.standard": "Standard",

      "ga8.detail.empty.head": "Nothing open yet",
      "ga8.detail.empty.body": "Click any line on the left. What changed appears here, and the list keeps your place.",
      "ga8.reg.sub": "Choose a line to read what changed",
      "ga8.detail.reason.none": "None was required for this kind of change",
      "ga8.detail.immutable": "An audit line is written once. Nothing on this panel can be edited, here or anywhere else.",
      "ga8.detail.title": "Entry",
      "ga8.detail.actor": "Actor",
      "ga8.detail.action": "Action",
      "ga8.detail.entity": "Entity",
      "ga8.detail.scope": "Scope",
      "ga8.detail.time": "Time",
      "ga8.detail.reason": "Reason given",
      "ga8.detail.diff": "Before → after",
      "ga8.detail.changed": "Changed",
      "ga8.detail.changed.note": "This field is PII-masked in every screen. The audit log records that it changed, never the value (§8).",
      "ga8.detail.follow": "Follow this record's full history",

      "ga8.export.title": "Export the audit log",
      "ga8.export.format.label": "Format",
      "ga8.export.range.label": "Date range (required)",
      "ga8.export.range.placeholder": "No unbounded export — choose a range",
      "ga8.export.error.range": "Choose a date range before exporting — an unbounded export is not offered.",
      "ga8.export.cta": "Generate export",
      "ga8.export.cancel": "Cancel",
      "ga8.export.queued": "Export queued — you'll be notified when it's ready. This export itself is recorded below.",
      "ga8.export.auditRow": "You exported the audit log",

      "ga8.empty.head": "No entries match these filters",
      "ga8.empty.body": "Try a wider date range, or clear the filters to see everything.",
      "ga8.footer.showing": "Showing {shown} of {filtered} filtered entries · {total} total",
      "ga8.footer.loadMore": "Load more",
      "ga8.footer.retention": "Entries older than 24 months are retained per the statutory minimum — contact compliance for archived records.",

      /* role catalogue (shared by GA-04's picker + chips) */
      "garole.groupAdmin": "Group Admin",
      "garole.principal": "Campus Principal",
      "garole.hr": "HR Operator",
      "garole.payrollOfficer": "Payroll Operator",
      "garole.accountant": "Accountant",
      "garole.deptHead": "Department Head",
      "garole.employee": "Employee",
      "garole.groupAdmin.desc": "Full control across every campus — organization structure, identity & access, statutory configuration and the audit trail.",
      "garole.principal.desc": "Runs one campus — attendance, leave escalations and requisition approvals within their budget authority.",
      "garole.hr.desc": "Staff records, document verification and onboarding for their campus.",
      "garole.payrollOfficer.desc": "Prepares and submits payroll runs (maker). Cannot also hold the checker capability without a warning.",
      "garole.accountant.desc": "Approves payroll runs and statutory filings (checker), and reads statutory liability.",
      "garole.deptHead.desc": "Approves leave and reads attendance for their own department only.",

      /* scope labels */
      "gascope.group": "Sunrise Education Trust (all campuses)",
      "gascope.level.group": "Group",
      "gascope.level.campus": "Campus",
      "gascope.level.department": "Department",

      /* campuses */
      "gacampus.indiranagar": "Indiranagar",
      "gacampus.whitefield": "Whitefield",
      "gacampus.yelahanka": "Yelahanka",
      "gacampus.hyderabad": "Hyderabad",
      "gacampus.indiranagar.state": "Karnataka",
      "gacampus.whitefield.state": "Karnataka",
      "gacampus.yelahanka.state": "Karnataka",
      "gacampus.hyderabad.state": "Telangana",

      /* departments */
      "gadept.science": "Science, Indiranagar",
      "gadept.commerce": "Commerce, Whitefield",
      "gadept.mathematics": "Mathematics, Yelahanka",
      "gadept.administration": "Administration, Hyderabad",

      /* people */
      "ganame.meera": "Meera Nair",
      "ganame.venkat": "R. Venkataraman",
      "ganame.sharma": "K. Sharma",
      "ganame.arjun": "Arjun Verma",
      "ganame.fatima": "Fatima Sheikh",
      "ganame.devika": "Devika Rao",
      "ganame.suresh": "Suresh Iyer",
      "ganame.priya": "Priya Menon",
      "ganame.devansh": "Devansh Kulkarni",
      "ganame.you": "Ananya Rao",

      /* reasons (mock, but real i18n content — never raw-literal) */
      "gareason.payrollCover": "Payroll cover during R. Venkataraman's leave",
      "gareason.piiAudit": "Payroll audit support, Q2 FY26–27",
      "gareason.hrOnboard": "New HR hire, Indiranagar campus onboarding batch",
      "gareason.bankCorrect": "Employee reported an incorrect account number at KYC refresh",
      "gareason.newHod": "Promoted to Head of Department, Mathematics",
      "gareason.exitAccess": "Resigned — last working day 31 Aug 2026",

      /* permission catalogue labels */
      "gaperm.org.manage": "Create and edit campuses, departments and legal entities",
      "gaperm.iam.manage": "Invite users, assign roles and grant PII/salary access",
      "gaperm.statutory.manage": "Create and activate statutory configuration versions",
      "gaperm.campus.attendance.read": "View campus attendance",
      "gaperm.campus.leave.escalation": "Approve escalated leave requests",
      "gaperm.people.read": "View staff records, without PII",
      "gaperm.people.manage": "Create and edit staff records",
      "gaperm.documents.manage": "Upload and request staff documents",
      "gaperm.documents.verify": "Verify employee-submitted documents",
      "gaperm.payroll.run": "Prepare and submit payroll runs (maker)",
      "gaperm.makerchecker.approve": "Approve payroll runs and statutory filings (checker)",
      "gaperm.statutory.liability.read": "View statutory liability and filings",
      "gaperm.dept.leave.approve": "Approve leave for direct reports",
      "gaperm.dept.attendance.read": "View department attendance",
      "gaperm.people.pii.read": "Reveal PAN, Aadhaar, bank and salary details (separately granted, audited)",

      /* audit action/entity vocabulary */
      "gaaction.roleAssigned": "Role assigned",
      "gaaction.roleRevoked": "Role revoked",
      "gaaction.piiGranted": "PII access granted",
      "gaaction.payrollApproved": "Payroll run approved",
      "gaaction.filingSubmitted": "Statutory filing submitted",
      "gaaction.docVerified": "Document verified",
      "gaaction.employeeRevised": "Employee record revised",
      "gaaction.leaveApproved": "Leave approved",
      "gaaction.userDeactivated": "User deactivated",
      "gaaction.ayCurrent": "Academic year set current",
      "gaaction.mfaReset": "MFA reset requested",
      "gaaction.exported": "Audit log exported",
      "gaentity.user": "User",
      "gaentity.roleAssignment": "Role assignment",
      "gaentity.payrollRun": "Payroll run",
      "gaentity.statutoryFiling": "Statutory filing",
      "gaentity.staffDocument": "Staff document",
      "gaentity.employee": "Employee",
      "gaentity.leaveRequest": "Leave request",
      "gaentity.academicYear": "Academic year",
      "gaentity.auditLog": "Audit log export",
    },
  });

  /* ============================================================
     SHARED LAYOUT HELPERS
     ============================================================ */
  function TopStrip({ label }) {
    const { t } = useLang();
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, marginBottom: 16 }}>
        <div style={ty("small", { color: c.inkMuted })}>
          <span style={{ color: c.ink, fontWeight: 700 }}>{label}</span>
          <span style={{ margin: "0 8px", color: c.inkFaint }}>·</span>
          <span>{t("ga.top.trust")}</span>
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
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ minWidth: 260 }}>
          <h1 style={ty("display", { margin: 0, color: c.ink })}>{title}</h1>
          {sub ? <div style={ty("small", { color: c.inkMuted, marginTop: 6, maxWidth: 620 })}>{sub}</div> : null}
          {meta ? <div style={ty("caption", { color: c.inkFaint, marginTop: 4 })}>{meta}</div> : null}
        </div>
        {right ? <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>{right}</div> : null}
      </div>
    );
  }

  /* PROMOTION CANDIDATE · Segmented — a small pill-group switch,
     generalised from LangSwitcher's exact visual pattern (pill
     container, accent-filled active pill). LangSwitcher is hardcoded
     to two language options; this is the same idiom for an arbitrary
     option list (period pickers, demo-state pickers). */
  function Segmented({ options, value, onChange, ariaLabel }) {
    const { c, shadow } = useTheme();
    const { ty } = useLang();
    return (
      <div
        role="group" aria-label={ariaLabel}
        style={{
          display: "inline-flex", padding: 3, borderRadius: G3.r.pill,
          border: "1px solid " + c.border, background: c.surface, boxShadow: shadow(1),
        }}
      >
        {options.map((o) => {
          const on = o.key === value;
          return (
            <button
              key={o.key} type="button" aria-pressed={on} onClick={() => onChange(o.key)}
              style={ty("small", {
                border: "none", borderRadius: G3.r.pill, padding: "6px 14px",
                background: on ? c.accent : "transparent",
                color: on ? c.onAccent : c.inkMuted,
                fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
              })}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    );
  }

  /* PROMOTION CANDIDATE · StatusChip — Chip + an EXPLICIT icon, for a
     governance vocabulary (invited/pending/revoked/no-role/maker+checker/
     high-sensitivity) that has no attendance-state analogue, so
     StatusMark's auto-inferred glyph (keyed to attendance/leave roles)
     is the wrong tool. Same "word AND glyph, never colour alone" rule. */
  function StatusChip({ tone, icon, label }) {
    const { c } = useTheme();
    return (
      <Chip bg={c[tone + "Tint"]} fg={c[tone + "Text"]}>
        <span aria-hidden="true" style={{ display: "flex" }}><Icon name={icon} size={12} /></span>
        <span>{label}</span>
      </Chip>
    );
  }

  function DefRow({ label, children, last }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", padding: "9px 0", borderBottom: last ? "none" : "1px dashed " + c.border }}>
        <div style={ty("small", { color: c.inkMuted, flex: "0 0 40%", minWidth: 0 })}>{label}</div>
        <div style={{ flex: 1, minWidth: 0, textAlign: "right" }}>{children}</div>
      </div>
    );
  }

  function Value({ children, mono }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return <span style={mono ? G3.fig("sm", { color: c.ink, fontWeight: 600 }) : ty("small", { color: c.ink, fontWeight: 600 })}>{children}</span>;
  }

  /* one honest consequence, before an irreversible or privileged action
     commits — same recipe as leave.jsx's CheckRow */
  function CheckRow({ tone, word, text, icon, last }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <li style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 0", listStyle: "none", borderBottom: last ? "none" : "1px dashed " + c.border }}>
        <span aria-hidden="true" style={{ width: 26, height: 26, borderRadius: G3.r.xs, flexShrink: 0, background: c[tone + "Tint"], color: c[tone + "Text"], display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name={icon} size={14} />
        </span>
        <span style={{ minWidth: 0, flex: 1 }}>
          <span style={ty("small", { display: "block", color: c[tone + "Text"], fontWeight: 700 })}>{word}</span>
          <span style={ty("small", { display: "block", color: c.inkMuted, marginTop: 2 })}>{text}</span>
        </span>
      </li>
    );
  }

  function InlineConfirm({ children, onConfirm, onCancel, confirmLabel, cancelLabel }) {
    const { c, shadow } = useTheme();
    return (
      <div style={{ background: c.sunken, border: "1px solid " + c.borderStrong, borderRadius: G3.r.lg, padding: 14, marginTop: 8 }}>
        {children}
        <div style={{ display: "flex", gap: 8, marginTop: 10, justifyContent: "flex-end" }}>
          <Button kind="quiet" size="sm" onClick={onCancel}>{cancelLabel}</Button>
          <Button kind="primary" size="sm" onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    );
  }

  /* ============================================================
     REFERENCE DATA — Sunrise Education Trust: 4 campuses in 2 states
     (M1 §Acceptance: "≥2 campuses in different states"), 1 legal entity.
     ============================================================ */
  const CAMPUSES = [
    { key: "indiranagar", nameKey: "gacampus.indiranagar", stateKey: "gacampus.indiranagar.state", headcount: 212, attendance: 96.2, leaveUtil: 41, payroll: 8940000, liability: 1486000 },
    { key: "whitefield", nameKey: "gacampus.whitefield", stateKey: "gacampus.whitefield.state", headcount: 158, attendance: 94.8, leaveUtil: 38, payroll: 6610000, liability: 1102500 },
    { key: "yelahanka", nameKey: "gacampus.yelahanka", stateKey: "gacampus.yelahanka.state", headcount: 46, attendance: 91.0, leaveUtil: 52, payroll: null, liability: null },
    { key: "hyderabad", nameKey: "gacampus.hyderabad", stateKey: "gacampus.hyderabad.state", headcount: 121, attendance: 95.5, leaveUtil: 44, payroll: 5120000, liability: 902000 },
  ];

  const ROLE_CATALOG = {
    groupAdmin: { labelKey: "garole.groupAdmin", descKey: "garole.groupAdmin.desc", levels: ["group"], secondApproval: true, perms: ["org.manage", "iam.manage", "statutory.manage"] },
    principal: { labelKey: "garole.principal", descKey: "garole.principal.desc", levels: ["campus"], secondApproval: false, perms: ["campus.attendance.read", "campus.leave.escalation", "people.read"] },
    hr: { labelKey: "garole.hr", descKey: "garole.hr.desc", levels: ["campus"], secondApproval: false, perms: ["people.manage", "documents.manage", "documents.verify"] },
    payrollOfficer: { labelKey: "garole.payrollOfficer", descKey: "garole.payrollOfficer.desc", levels: ["group", "campus"], secondApproval: true, perms: ["payroll.run"] },
    accountant: { labelKey: "garole.accountant", descKey: "garole.accountant.desc", levels: ["group", "campus"], secondApproval: true, perms: ["makerchecker.approve", "statutory.liability.read"] },
    deptHead: { labelKey: "garole.deptHead", descKey: "garole.deptHead.desc", levels: ["department"], secondApproval: false, perms: ["dept.leave.approve", "dept.attendance.read"] },
  };
  const ROLE_KEYS = Object.keys(ROLE_CATALOG);

  const PERM_MODULE = {
    "org.manage": "org", "iam.manage": "iam", "statutory.manage": "statutory",
    "campus.attendance.read": "attendance", "campus.leave.escalation": "leave", "people.read": "people",
    "people.manage": "people", "documents.manage": "documents", "documents.verify": "documents",
    "payroll.run": "payroll", "makerchecker.approve": "payroll", "statutory.liability.read": "statutory",
    "dept.leave.approve": "leave", "dept.attendance.read": "attendance", "people.pii.read": "people",
  };

  const DEPARTMENTS = [
    { key: "science", labelKey: "gadept.science" },
    { key: "commerce", labelKey: "gadept.commerce" },
    { key: "mathematics", labelKey: "gadept.mathematics" },
    { key: "administration", labelKey: "gadept.administration" },
  ];

  function scopeLabel(t, level, value) {
    if (level === "group") return t("gascope.group");
    if (level === "campus") {
      const cm = CAMPUSES.find((c2) => c2.key === value);
      return cm ? t(cm.nameKey) : "—";
    }
    if (level === "department") {
      const d = DEPARTMENTS.find((d2) => d2.key === value);
      return d ? t(d.labelKey) : "—";
    }
    return "—";
  }

  /* ============================================================
     GA-04 mock users — chosen to cover every state the spec lists:
     invited / active / inactive / no-role-assigned / multi-scope /
     maker+checker-same-person, plus one pending-approval assignment
     seeded from a SECOND admin (so this session can legitimately act
     on it) and one PII-granted user.
     ============================================================ */
  const INITIAL_USERS = [
    {
      id: "u1", staffId: "NAV-0104", nameKey: "ganame.meera", email: "meera.nair@sunrise.edu",
      status: "active", mfa: true, lastSignIn: "03 Sep 2026, 08:14",
      roles: [{ id: "r1", roleKey: "hr", level: "campus", value: "indiranagar", status: "active", grantedByKey: "ganame.you", grantedAt: "12 Apr 2024", reasonKey: "gareason.hrOnboard" }],
      pii: false, salary: false,
    },
    {
      id: "u2", staffId: "NAV-0087", nameKey: "ganame.venkat", email: "r.venkat@sunrise.edu",
      status: "active", mfa: true, lastSignIn: "03 Sep 2026, 07:52",
      roles: [{ id: "r2", roleKey: "payrollOfficer", level: "group", value: null, status: "active", grantedByKey: "ganame.you", grantedAt: "02 Jan 2025", reasonKey: null, checker: false }],
      pii: false, salary: true,
      pendingApprovalEntity: "gaentity.payrollRun",
    },
    {
      id: "u3", staffId: "NAV-0055", nameKey: "ganame.sharma", email: "k.sharma@sunrise.edu",
      status: "active", mfa: true, lastSignIn: "02 Sep 2026, 19:10",
      roles: [{ id: "r3", roleKey: "accountant", level: "group", value: null, status: "active", grantedByKey: "ganame.you", grantedAt: "02 Jan 2025", reasonKey: null, checker: true }],
      pii: false, salary: true,
    },
    {
      id: "u4", staffId: "NAV-0311", nameKey: "ganame.arjun", email: "arjun.verma@sunrise.edu",
      status: "active", mfa: true, lastSignIn: "01 Sep 2026, 09:30",
      roles: [{ id: "r4", roleKey: "payrollOfficer", level: "group", value: null, status: "active", grantedByKey: "ganame.you", grantedAt: "18 Jun 2026", reasonKey: null, checker: true }],
      pii: false, salary: false,
    },
    {
      id: "u5", staffId: "NAV-0402", nameKey: "ganame.fatima", email: "fatima.sheikh@sunrise.edu",
      status: "invited", mfa: false, lastSignIn: null,
      roles: [
        { id: "r5", roleKey: "deptHead", level: "department", value: "science", status: "active", grantedByKey: "ganame.you", grantedAt: "20 Aug 2026", reasonKey: "gareason.newHod" },
        { id: "r6", roleKey: "payrollOfficer", level: "group", value: null, status: "pending", grantedByKey: "ganame.devansh", grantedAt: "01 Sep 2026", reasonKey: "gareason.payrollCover" },
      ],
      pii: false, salary: false,
    },
    {
      id: "u6", staffId: "NAV-0019", nameKey: "ganame.devika", email: "devika.rao@sunrise.edu",
      status: "inactive", mfa: false, lastSignIn: "12 Jun 2026, 11:02",
      roles: [{ id: "r7", roleKey: "principal", level: "campus", value: "whitefield", status: "revoked", grantedByKey: "ganame.you", grantedAt: "01 Apr 2022", reasonKey: "gareason.exitAccess" }],
      pii: false, salary: false,
    },
    {
      id: "u7", staffId: "NAV-0233", nameKey: "ganame.suresh", email: "suresh.iyer@sunrise.edu",
      status: "active", mfa: true, lastSignIn: "03 Sep 2026, 08:40",
      roles: [], pii: false, salary: false,
    },
    {
      id: "u8", staffId: "NAV-0142b", nameKey: "ganame.priya", email: "priya.menon@sunrise.edu",
      status: "active", mfa: true, lastSignIn: "03 Sep 2026, 08:02",
      roles: [
        { id: "r8", roleKey: "hr", level: "campus", value: "indiranagar", status: "active", grantedByKey: "ganame.you", grantedAt: "10 Feb 2023", reasonKey: null },
        { id: "r9", roleKey: "deptHead", level: "department", value: "commerce", status: "active", grantedByKey: "ganame.you", grantedAt: "01 Jun 2026", reasonKey: "gareason.newHod" },
      ],
      pii: true, salary: true,
      piiGrantedAt: "15 Jul 2026", piiReasonKey: "gareason.piiAudit",
    },
  ];

  /* ============================================================
     GA-08 mock audit entries — timestamps relative to "today"
     03 Sep 2026. Sensitive fields never carry a value, only "changed".
     ============================================================ */
  const AUDIT_ENTRIES = [
    { id: "a1", ts: "03 Sep 2026, 09:12", actorKey: "ganame.you", actionKey: "gaaction.piiGranted", entityKey: "gaentity.user", entityId: "NAV-0142b", scopeKey: "gascope.group", sensitivity: "high", reasonKey: "gareason.piiAudit", diff: [{ fieldKey: "gaperm.people.pii.read", sensitive: false, before: "Off", after: "On" }, { fieldKey: "ga4.pii.field.salary", sensitive: false, before: "Off", after: "On" }] },
    { id: "a2", ts: "02 Sep 2026, 18:44", actorKey: "ganame.sharma", actionKey: "gaaction.payrollApproved", entityKey: "gaentity.payrollRun", entityId: "PR-2026-08", scopeKey: "gascope.group", sensitivity: "high", reasonKey: null, diff: [{ fieldKey: "ga1.col.payroll", sensitive: false, before: "Draft", after: "Approved" }] },
    { id: "a3", ts: "02 Sep 2026, 11:20", actorKey: "ganame.you", actionKey: "gaaction.roleAssigned", entityKey: "gaentity.roleAssignment", entityId: "NAV-0311", scopeKey: "gascope.group", sensitivity: "high", reasonKey: "gareason.payrollCover", diff: [{ fieldKey: "ga4.detail.section.roles", sensitive: false, before: "—", after: "Payroll Operator, group-wide (checker)" }] },
    { id: "a4", ts: "01 Sep 2026, 16:05", actorKey: "ganame.devansh", actionKey: "gaaction.roleAssigned", entityKey: "gaentity.roleAssignment", entityId: "NAV-0402", scopeKey: "gascope.group", sensitivity: "high", reasonKey: "gareason.payrollCover", diff: [{ fieldKey: "ga4.detail.section.roles", sensitive: false, before: "—", after: "Payroll Operator, group-wide (awaiting a second admin)" }] },
    { id: "a5", ts: "31 Aug 2026, 10:30", actorKey: "ganame.meera", actionKey: "gaaction.docVerified", entityKey: "gaentity.staffDocument", entityId: "NAV-0233 · Aadhaar", scopeKey: "gacampus.indiranagar", sensitivity: "high", reasonKey: null, diff: [{ fieldKey: "ga8.col.action", sensitive: false, before: "Submitted", after: "Verified" }] },
    { id: "a6", ts: "30 Aug 2026, 14:52", actorKey: "ganame.meera", actionKey: "gaaction.employeeRevised", entityKey: "gaentity.employee", entityId: "NAV-0311", scopeKey: "gacampus.indiranagar", sensitivity: "high", reasonKey: "gareason.bankCorrect", diff: [{ fieldKey: "ga4.pii.field.piiRead", sensitive: true }, { fieldKey: "ga1.col.state", sensitive: false, before: "Karnataka", after: "Karnataka" }] },
    { id: "a7", ts: "29 Aug 2026, 09:18", actorKey: "ganame.venkat", actionKey: "gaaction.filingSubmitted", entityKey: "gaentity.statutoryFiling", entityId: "PT-KA-2026-07", scopeKey: "gacampus.indiranagar", sensitivity: "high", reasonKey: null, diff: [{ fieldKey: "ga8.col.action", sensitive: false, before: "Draft", after: "Filed" }] },
    { id: "a8", ts: "27 Aug 2026, 15:40", actorKey: "ganame.priya", actionKey: "gaaction.leaveApproved", entityKey: "gaentity.leaveRequest", entityId: "LR-3021", scopeKey: "gadept.commerce", sensitivity: "standard", reasonKey: null, diff: [{ fieldKey: "ga8.col.action", sensitive: false, before: "Pending", after: "Approved" }] },
    { id: "a9", ts: "20 Aug 2026, 12:00", actorKey: "ganame.you", actionKey: "gaaction.roleAssigned", entityKey: "gaentity.roleAssignment", entityId: "NAV-0402", scopeKey: "gadept.science", sensitivity: "high", reasonKey: "gareason.newHod", diff: [{ fieldKey: "ga4.detail.section.roles", sensitive: false, before: "—", after: "Department Head, Science at Indiranagar" }] },
    { id: "a10", ts: "18 Aug 2026, 08:55", actorKey: "ganame.you", actionKey: "gaaction.userDeactivated", entityKey: "gaentity.user", entityId: "NAV-0019", scopeKey: "gascope.group", sensitivity: "high", reasonKey: "gareason.exitAccess", diff: [{ fieldKey: "ga4.col.status", sensitive: false, before: "Active", after: "Inactive" }] },
    { id: "a11", ts: "10 Aug 2026, 17:22", actorKey: "ganame.you", actionKey: "gaaction.ayCurrent", entityKey: "gaentity.academicYear", entityId: "AY-2026-27", scopeKey: "gascope.group", sensitivity: "standard", reasonKey: null, diff: [{ fieldKey: "ga8.col.action", sensitive: false, before: "AY-2025-26", after: "AY-2026-27" }] },
    { id: "a12", ts: "05 Aug 2026, 10:05", actorKey: "ganame.meera", actionKey: "gaaction.mfaReset", entityKey: "gaentity.user", entityId: "NAV-0233", scopeKey: "gacampus.indiranagar", sensitivity: "standard", reasonKey: null, diff: [{ fieldKey: "ga4.col.mfa", sensitive: false, before: "Enabled", after: "Not set" }] },
  ];

  /* ============================================================
     GA-01 · GROUP OVERVIEW
     ============================================================ */
  function ShapeRow({ label, frac, value, bar }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div style={{ marginBottom: 13 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6, gap: 10 }}>
          <span style={ty("small", { color: c.ink, fontWeight: 600, minWidth: 0 })}>{label}</span>
          <span style={{ flexShrink: 0 }}><Figure value={value} size="sm" weight={700} color={c.inkMuted} /></span>
        </div>
        <Meter frac={frac} bar={bar} track={c.gutter} height={9} label={label + " " + value} />
      </div>
    );
  }

  function ComparisonShapeCard({ campuses }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const maxHead = Math.max.apply(null, campuses.map((cm) => cm.headcount));
    const heads = campuses.map((cm) => cm.headcount);
    const min = Math.min.apply(null, heads);
    const max = Math.max.apply(null, heads);
    const misleading = max >= min * 3;
    return (
      <Card icon="globe" iconTone="accent" title={t("ga1.shape.title")} sub={t("ga1.shape.sub")}>
        <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 260px", minWidth: 240 }}>
            <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 10 })}>{t("ga1.shape.headcount")}</div>
            {campuses.map((cm) => (
              <ShapeRow key={cm.key} label={t(cm.nameKey)} frac={cm.headcount / maxHead} value={t("ga1.shape.staff", { n: num(cm.headcount) })} bar={c.chartBlue} />
            ))}
          </div>
          <div style={{ flex: "1 1 260px", minWidth: 240 }}>
            <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 10 })}>{t("ga1.shape.attendance")}</div>
            {campuses.map((cm) => (
              <ShapeRow key={cm.key} label={t(cm.nameKey)} frac={cm.attendance / 100} value={cm.attendance.toFixed(1) + "%"} bar={c.present} />
            ))}
          </div>
        </div>
        {misleading ? (
          <div style={{ marginTop: 6, paddingTop: 12, borderTop: "1px dashed " + c.border, display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span aria-hidden="true" style={{ color: c.lateText, display: "flex", flexShrink: 0, marginTop: 1 }}><Icon name="alert" size={15} /></span>
            <span style={ty("caption", { color: c.inkMuted })}>{t("ga1.shape.caveat", { min: num(min), max: num(max) })}</span>
          </div>
        ) : null}
      </Card>
    );
  }

  /* ============================================================
     WHO IS AT A CAMPUS, and one person's record inside it.
     ============================================================ */
  const CAMPUS_STAFF = {
    indiranagar: [
      { id: "NAV-0142", nameKey: "gast.ananya", postKey: "gast.p.pgtPhy", deptKey: "gast.d.science", kind: "teaching", state: "active", doj: "12 Apr 2024", contractKey: "gast.c.permanent", reportsKey: "gast.r.anjali", years: 2, contractEnd: null, docsOnFile: 12, docsTotal: 12, loginKey: "gast.l.employee", mfa: true },
      { id: "NAV-0088", nameKey: "gast.meenakshi", postKey: "gast.p.hod", deptKey: "gast.d.science", kind: "teaching", state: "active", doj: "02 Jun 2019", contractKey: "gast.c.permanent", reportsKey: "gast.r.radhika", years: 7, contractEnd: null, docsOnFile: 12, docsTotal: 12, loginKey: "gast.l.deptHead", mfa: true },
      { id: "NAV-0104", nameKey: "gast.meera", postKey: "gast.p.hr", deptKey: "gast.d.office", kind: "nonTeaching", state: "active", doj: "18 Jan 2022", contractKey: "gast.c.permanent", reportsKey: "gast.r.rajan", years: 4, contractEnd: null, docsOnFile: 11, docsTotal: 12, loginKey: "gast.l.hr", mfa: true },
      { id: "NAV-0410", nameKey: "gast.kavya", postKey: "gast.p.prt", deptKey: "gast.d.primary", kind: "teaching", state: "probation", doj: "01 Jun 2026", contractKey: "gast.c.probation", reportsKey: "gast.r.radhika", years: 0, contractEnd: null, docsOnFile: 8, docsTotal: 12, loginKey: null, mfa: false },
      { id: "NAV-0512", nameKey: "gast.manju", postKey: "gast.p.driver", deptKey: "gast.d.transport", kind: "nonTeaching", state: "active", doj: "11 Jul 2021", contractKey: "gast.c.permanent", reportsKey: "gast.r.ramesh", years: 5, contractEnd: null, docsOnFile: 12, docsTotal: 12, loginKey: "gast.l.employee", mfa: false },
    ],
    whitefield: [
      { id: "NAV-0233", nameKey: "gast.divya", postKey: "gast.p.tgtBio", deptKey: "gast.d.science", kind: "teaching", state: "active", doj: "14 Apr 2023", contractKey: "gast.c.permanent", reportsKey: "gast.r.anjali", years: 3, contractEnd: null, docsOnFile: 12, docsTotal: 12, loginKey: "gast.l.employee", mfa: true },
      { id: "NAV-0301", nameKey: "gast.ramesh", postKey: "gast.p.facilities", deptKey: "gast.d.office", kind: "nonTeaching", state: "active", doj: "09 Sep 2020", contractKey: "gast.c.permanent", reportsKey: "gast.r.rajan", years: 6, contractEnd: null, docsOnFile: 12, docsTotal: 12, loginKey: "gast.l.employee", mfa: true },
      { id: "NAV-0263", nameKey: "gast.suresh", postKey: "gast.p.accounts", deptKey: "gast.d.office", kind: "nonTeaching", state: "notice", doj: "03 Mar 2021", contractKey: "gast.c.permanent", reportsKey: "gast.r.rajan", years: 5, contractEnd: null, lwd: "31 Oct 2026", docsOnFile: 12, docsTotal: 12, loginKey: "gast.l.employee", mfa: true },
    ],
    yelahanka: [
      { id: "NAV-0601", nameKey: "gast.farah", postKey: "gast.p.ntt", deptKey: "gast.d.primary", kind: "teaching", state: "active", doj: "01 Apr 2026", contractKey: "gast.c.fixed", reportsKey: "gast.r.radhika", years: 0, contractEnd: "31 Mar 2027", docsOnFile: 9, docsTotal: 12, loginKey: null, mfa: false },
    ],
    hyderabad: [
      { id: "NAV-0702", nameKey: "gast.iqbal", postKey: "gast.p.driver", deptKey: "gast.d.transport", kind: "nonTeaching", state: "active", doj: "21 Aug 2022", contractKey: "gast.c.permanent", reportsKey: "gast.r.ramesh", years: 4, contractEnd: null, docsOnFile: 12, docsTotal: 12, loginKey: "gast.l.employee", mfa: false },
      { id: "NAV-0711", nameKey: "gast.priya", postKey: "gast.p.tgtChem", deptKey: "gast.d.science", kind: "teaching", state: "active", doj: "05 Jun 2024", contractKey: "gast.c.permanent", reportsKey: "gast.r.anjali", years: 2, contractEnd: null, docsOnFile: 12, docsTotal: 12, loginKey: "gast.l.employee", mfa: true },
    ],
  };

  const STAFF_STATE = {
    active: { role: "present", glyph: "check", key: "gast.st.active" },
    probation: { role: "late", glyph: "clock", key: "gast.st.probation" },
    notice: { role: "off", glyph: "signout", key: "gast.st.notice" },
  };

  /* ONE PERSON, on HR-03 itself — the same record screen HR reads,
     running read-only (designer: "the same UI as the detail screen HR
     looks at for employees, just view-only"). Not a copy: a copy is
     two screens describing one object, and the second one rots.

     The facets, the tabs, the alerts band, the masking, the document
     register — all of it is HR's. What differs is what must: the rail
     that is lit, where "back" returns to, and that every control is
     switched off with the reason said once at the top. */
  function StaffRecordScreen({ person, campus, role, onNavigate, onBack }) {
    const { t } = useLang();
    const HRRecord = window.Pages3 && window.Pages3.HRRecord;
    if (!HRRecord) return null;
    return (
      <HRRecord
        role={role || "groupAdmin"}
        onNavigate={onNavigate}
        readOnly
        railActive="gaHome"
        railInitials={t("ga4.you.initials")}
        crumb={{ label: t("nav.gaHome"), where: t(campus.nameKey) }}
        back={{ label: t("gast.back.register", { campus: t(campus.nameKey) }), onBack: onBack }}
      />
    );
  }

  /* THE CAMPUS REGISTER, the same table HR keeps — minus every column
     that is a control. One action per row, and it opens a record. */
  function CampusStaffScreen({ campus, role, onNavigate, onBack, onOpenPerson }) {
    const { c } = useTheme();
    const { t, ty, lang } = useLang();
    const L = G3.layout;
    const list = CAMPUS_STAFF[campus.key] || [];
    const [q, setQ] = useState("");
    const [kind, setKind] = useState("all");
    const [dept, setDept] = useState("all");

    const depts = [];
    list.forEach((s) => { if (depts.indexOf(s.deptKey) === -1) depts.push(s.deptKey); });

    const needle = q.trim().toLowerCase();
    const rows0 = list.filter((s) => {
      if (kind !== "all" && s.kind !== kind) return false;
      if (dept !== "all" && s.deptKey !== dept) return false;
      if (needle && (t(s.nameKey) + " " + s.id + " " + t(s.postKey)).toLowerCase().indexOf(needle) === -1) return false;
      return true;
    });

    const columns = [
      { key: "code", label: t("gast.col.code"), mono: true, width: 104 },
      { key: "who", label: t("gast.col.who") },
      { key: "kind", label: t("gast.col.kind"), width: 124 },
      { key: "dept", label: t("gast.col.dept") },
      { key: "contract", label: t("gast.col.contract") },
      { key: "state", label: t("gast.col.state"), width: 150 },
      { key: "doj", label: t("gast.col.doj"), mono: true, width: 108 },
      { key: "until", label: t("gast.col.until"), mono: true, width: 108 },
      { key: "act", label: t("gast.col.act"), align: "right", width: 78, act: true },
    ];
    const rows = rows0.map((s) => {
      const look = STAFF_STATE[s.state];
      return {
        id: s.id, live: true,
        cells: {
          code: s.id,
          who: (
            <span style={{ display: "flex", gap: 11, alignItems: "center", minWidth: 0 }}>
              <Avatar name={t(s.nameKey)} size={30} />
              <span style={{ minWidth: 0 }}>
                <span style={ty("small", { display: "block", color: c.ink, fontWeight: 600 })}>{t(s.nameKey)}</span>
                <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 1 })}>{t(s.postKey)}</span>
              </span>
            </span>
          ),
          kind: <Chip>{t(s.kind === "teaching" ? "gast.kind.teaching" : "gast.kind.nonTeaching")}</Chip>,
          dept: t(s.deptKey),
          contract: t(s.contractKey),
          state: (
            <span>
              <StatusMark role={look.role} glyph={look.glyph} word={t(look.key)} />
              {s.state === "notice" ? (
                <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 3 })}>{t("gast.untilDay", { date: s.lwd })}</span>
              ) : null}
            </span>
          ),
          doj: s.doj,
          until: s.contractEnd || t("gast.f.ongoing"),
          act: (
            <span style={{ display: "flex", justifyContent: "flex-end" }}>
              <ActionMenu
                ariaLabel={t("gast.menuAria", { name: t(s.nameKey) })} size={30}
                items={[{ key: "open", icon: "profile", label: t("gast.openRecord"), onSelect: () => onOpenPerson(s) }]}
              />
            </span>
          ),
        },
      };
    });

    return (
      <div className="nv3" style={{ display: "flex", minHeight: "100vh", background: c.page, color: c.ink, fontFamily: G3.font.ui }}>
        <Rail role={role || "groupAdmin"} active="gaHome" onNavigate={onNavigate} initials={t("ga4.you.initials")} />
        <main style={{ flex: 1, minWidth: 0, position: "relative", overflowX: "clip" }}>
          <Motif />
          <div style={{ position: "relative", zIndex: 1, maxWidth: L.contentMax, margin: "0 auto", padding: "22px " + L.contentPadX + "px 56px" }}>
            <TopStrip label={t("nav.gaHome")} />
            <BackBar label={t("gast.back.overview")} onBack={onBack} />
            <PageHeader
              title={t("gast.title", { campus: t(campus.nameKey) })}
              sub={t("gast.sub", { n: num(list.length), state: t(campus.stateKey) })}
              meta={t("gast.meta")}
            />

            <Card style={{ marginBottom: L.gap }}>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end" }}>
                <div style={{ width: 260 }}>
                  <Field id="gast-q" label={t("gast.f.find")}>
                    <Input id="gast-q" value={q} onChange={setQ} placeholder={t("gast.f.findPh")} />
                  </Field>
                </div>
                <div style={{ width: 190 }}>
                  <Field id="gast-kind" label={t("gast.f.kind")}>
                    <Select id="gast-kind" value={kind} onChange={setKind}
                      options={[
                        { value: "all", label: t("gast.f.kindAll") },
                        { value: "teaching", label: t("gast.kind.teaching") },
                        { value: "nonTeaching", label: t("gast.kind.nonTeaching") },
                      ]} />
                  </Field>
                </div>
                <div style={{ width: 200 }}>
                  <Field id="gast-dept" label={t("gast.f.dept")}>
                    <Select id="gast-dept" value={dept} onChange={setDept}
                      options={[{ value: "all", label: t("gast.f.deptAll") }].concat(depts.map((d) => ({ value: d, label: t(d) })))} />
                  </Field>
                </div>
              </div>
            </Card>

            {rows.length === 0 ? (
              <Card><EmptyState head={t("gast.empty.head")} body={t("gast.empty.body")} /></Card>
            ) : (
              <Register
                columns={columns} rows={rows}
                footer={<span style={ty("caption", { color: c.inkFaint })}>{t("gast.footN", { shown: num(rows.length), total: num(list.length) })} {t("gast.foot")}</span>}
              />
            )}
          </div>
        </main>
      </div>
    );
  }

  function ComparisonRegister({ campuses, onViewStaff }) {
    const { t } = useLang();
    const totalHead = campuses.reduce((s, cm) => s + cm.headcount, 0);
    const wAttendance = campuses.reduce((s, cm) => s + cm.headcount * cm.attendance, 0) / totalHead;
    const wLeave = campuses.reduce((s, cm) => s + cm.headcount * cm.leaveUtil, 0) / totalHead;

    const columns = [
      { key: "campus", label: t("ga1.col.campus") },
      { key: "state", label: t("ga1.col.state") },
      { key: "headcount", label: t("ga1.col.headcount"), align: "right", mono: true },
      { key: "attendance", label: t("ga1.col.attendance"), align: "right", mono: true },
      { key: "leaveUtil", label: t("ga1.col.leaveUtil"), align: "right", mono: true },
      { key: "action", label: t("ga1.col.act"), align: "right", width: 130, act: true },
    ];
    const rows = campuses.map((cm) => ({
      id: cm.key,
      live: true,
      cells: {
        campus: t(cm.nameKey),
        state: t(cm.stateKey),
        headcount: num(cm.headcount),
        attendance: cm.attendance.toFixed(1) + "%",
        leaveUtil: cm.leaveUtil + "%",
        /* ONE way into a campus, and it is a register of people. The
           menu held a second item that jumped to the principal's home
           — where leave carries Approve and Decline. */
        action: (
          <span style={{ display: "flex", justifyContent: "flex-end" }}>
            <ActionMenu
              ariaLabel={t("ga1.drillMenu.aria", { campus: t(cm.nameKey) })} size={30}
              items={[{ key: "staff", icon: "staff", label: t("ga1.viewStaff"), onSelect: () => onViewStaff && onViewStaff(cm) }]}
            />
          </span>
        ),
      },
    }));
    const totals = {
      label: t("ga1.totals"),
      cells: {
        headcount: num(totalHead),
        attendance: wAttendance.toFixed(1) + "%",
        leaveUtil: wLeave.toFixed(0) + "%",
      },
    };
    return (
      <Register
        title={t("ga1.reg.title")} sub={t("ga1.reg.sub")}
        columns={columns} rows={rows} totals={totals}
        footer={<span style={{ fontSize: 12, opacity: 0.75 }}>{t("ga1.reg.foot")}</span>}
      />
    );
  }

  /* WHAT ONLY THIS DESK CAN CLEAR. Every line is something a group
     admin owns — an account, a reader, a token, a calendar — and every
     route out of here lands on one of their own three screens. A queue
     that sends the reader into somebody else's module is a queue of
     somebody else's work. */
  const GROUP_EXCEPTIONS = [
    {
      id: "x1", tone: "danger", icon: "staff",
      textKey: "ga1.exc.principal.text", whyKey: "ga1.exc.principal.why",
      whereKey: "gacampus.yelahanka", sinceKey: "ga1.exc.since.days", sinceVars: { n: 9 },
      route: "gaUsers", ctaKey: "ga1.exc.go.users",
    },
    {
      id: "x2", tone: "danger", icon: "scan",
      textKey: "ga1.exc.reader.text", whyKey: "ga1.exc.reader.why", whyVars: { n: 17 },
      whereKey: "gacampus.whitefield", sinceKey: "ga1.exc.since.time", sinceVars: { time: "07:40" },
      route: "gaSystems", ctaKey: "ga1.exc.go.systems",
    },
    {
      id: "x3", tone: "late", icon: "lock",
      textKey: "ga1.exc.maker.text", whyKey: "ga1.exc.maker.why",
      whereKey: "ga1.exc.where.group", sinceKey: "ga1.exc.since.date", sinceVars: { date: "20 Aug" },
      route: "gaUsers", ctaKey: "ga1.exc.go.users",
    },
    {
      id: "x4", tone: "late", icon: "festival",
      textKey: "ga1.exc.calendar.text", whyKey: "ga1.exc.calendar.why",
      whereKey: "ga1.exc.where.group", sinceKey: "ga1.exc.since.open", sinceVars: {},
      route: "gaSystems", ctaKey: "ga1.exc.go.systems",
    },
    {
      id: "x5", tone: "late", icon: "mail",
      textKey: "ga1.exc.token.text", whyKey: "ga1.exc.token.why",
      whereKey: "ga1.exc.where.group", sinceKey: "ga1.exc.since.inDays", sinceVars: { n: 52 },
      route: "gaSystems", ctaKey: "ga1.exc.go.systems",
    },
  ];

  function ExceptionsCard({ onNavigate }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const items = GROUP_EXCEPTIONS;

    const columns = [
      { key: "what", label: t("ga1.exc.col.what") },
      { key: "where", label: t("ga1.exc.col.where"), width: 150 },
      { key: "since", label: t("ga1.exc.col.since"), width: 170 },
      { key: "act", label: t("ga1.col.act"), align: "right", width: 210, act: true },
    ];
    const rows = items.map((it) => ({
      id: it.id, live: true,
      cells: {
        what: (
          <span style={{ display: "flex", gap: 11, alignItems: "flex-start", minWidth: 0 }}>
            <span aria-hidden="true" style={{ color: it.tone === "danger" ? c.dangerText : c.lateText, display: "flex", flexShrink: 0, marginTop: 2 }}>
              <Icon name={it.icon} size={15} />
            </span>
            <span style={{ minWidth: 0 }}>
              <span style={ty("small", { display: "block", color: c.ink, fontWeight: 600 })}>{t(it.textKey)}</span>
              {/* WHAT IT COSTS to leave it, in the row — not in a banner
                  above the table nobody reads twice */}
              <span style={ty("caption", { display: "block", color: c.inkMuted, marginTop: 3 })}>{t(it.whyKey, it.whyVars || {})}</span>
            </span>
          </span>
        ),
        where: <span style={ty("small", { color: c.inkMuted })}>{t(it.whereKey)}</span>,
        since: <span style={ty("caption", { color: c.inkMuted })}>{t(it.sinceKey, it.sinceVars)}</span>,
        act: (
          <span style={{ display: "flex", justifyContent: "flex-end" }}>
            {/* the route NAMES where it goes */}
            <Button kind="secondary" size="sm" iconLeft="arrow" onClick={() => onNavigate && onNavigate(it.route)}>{t(it.ctaKey)}</Button>
          </span>
        ),
      },
    }));

    return items.length === 0 ? (
      <Card icon="alert" iconTone="brass" title={t("ga1.exc.title")} sub={t("ga1.exc.sub")}>
        <EmptyState head={t("ga1.exc.empty.head")} body={t("ga1.exc.empty.body")} compact />
      </Card>
    ) : (
      <Register
        title={t("ga1.exc.title")} sub={t("ga1.exc.sub")}
        columns={columns} rows={rows}
        footer={<span style={ty("caption", { color: c.inkFaint })}>{t("ga1.exc.foot")}</span>}
      />
    );
  }

  function KpiCard({ label, value, note }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <Card style={{ flex: 1, minWidth: 0 }}>
        <div style={ty("small", { color: c.inkMuted, marginBottom: 8 })}>{label}</div>
        <Figure value={value} size="lg" weight={700} color={c.ink} />
        {note ? <div style={ty("caption", { color: c.inkFaint, marginTop: 6 })}>{note}</div> : null}
      </Card>
    );
  }

  function GAHome({ role, onNavigate }) {
    const { c } = useTheme();
    const { t, ty, lang } = useLang();
    const L = G3.layout;
    const [period, setPeriod] = useState("month");
    const [scenario, setScenario] = useState("group");
    const [exportState, setExportState] = useState("idle");

    const campuses = scenario === "firstRun" ? [CAMPUSES[0]] : CAMPUSES;
    const totalHead = useMemo(() => campuses.reduce((s, cm) => s + cm.headcount, 0), [campuses]);
    const wAttendance = useMemo(() => campuses.reduce((s, cm) => s + cm.headcount * cm.attendance, 0) / totalHead, [campuses, totalHead]);
    /* a stack, not a panel: overview → one campus's register → one
       person's record, each screen naming what "back" returns to */
    const [staffAt, setStaffAt] = useState(null);
    const [person, setPerson] = useState(null);

    function doExport() {
      setExportState("busy");
      window.setTimeout(() => setExportState("done"), 500);
    }

    const periodOptions = [
      { key: "month", label: t("ga1.period.month") },
      { key: "fy", label: t("ga1.period.fy") },
      { key: "ay", label: t("ga1.period.ay") },
    ];
    const scenarioOptions = [
      { key: "group", label: t("ga1.scenario.group") },
      { key: "firstRun", label: t("ga1.scenario.firstRun") },
      { key: "loading", label: t("ga1.scenario.loading") },
      { key: "error", label: t("ga1.scenario.error") },
    ];

    /* the deepest screen wins — and each one knows its way back */
    if (staffAt && person) {
      return (
        <StaffRecordScreen
          person={person} campus={staffAt} role={role} onNavigate={onNavigate}
          onBack={() => setPerson(null)}
        />
      );
    }
    if (staffAt) {
      return (
        <CampusStaffScreen
          campus={staffAt} role={role} onNavigate={onNavigate}
          onBack={() => setStaffAt(null)} onOpenPerson={(s) => setPerson(s)}
        />
      );
    }

    return (
      <div className="nv3" style={{ display: "flex", minHeight: "100vh", background: c.page, color: c.ink, fontFamily: G3.font.ui }}>
        <Rail role={role || "groupAdmin"} active="gaHome" onNavigate={onNavigate} initials={t("ga4.you.initials")} />
        <main style={{ flex: 1, minWidth: 0, position: "relative", overflowX: "clip" }}>
          <Motif />
          <div style={{ position: "relative", zIndex: 1, maxWidth: L.contentMax, margin: "0 auto", padding: "22px " + L.contentPadX + "px 56px" }}>
            <TopStrip label={t("nav.gaHome")} />
            <PageHeader
              title={t("ga1.title")}
              sub={t("ga1.sub")}
              meta={t("ga.top.scope")}
              right={
                <React.Fragment>
                  <Segmented ariaLabel={t("ga1.scenario.aria")} options={scenarioOptions} value={scenario} onChange={setScenario} />
                  <Segmented ariaLabel={t("ga1.period.aria")} options={periodOptions} value={period} onChange={setPeriod} />
                  {exportState === "done" ? (
                    <Chip bg={c.presentTint} fg={c.presentText}>
                      <span aria-hidden="true" style={{ display: "flex" }}><Icon name="check" size={12} /></span>
                      <span>{t("ga1.export.done", { time: "17:04", who: t("user.name") })}</span>
                    </Chip>
                  ) : (
                    <Button kind="ghost" iconLeft="download" onClick={doExport} disabled={exportState === "busy"}>
                      {exportState === "busy" ? t("ga1.export.busy") : t("ga1.export")}
                    </Button>
                  )}
                </React.Fragment>
              }
            />

            {scenario === "loading" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: L.gap }}>
                <div style={{ display: "flex", gap: L.gap }}>
                  {[0, 1, 2, 3].map((i) => <Card key={i} style={{ flex: 1 }}><Skeleton h={14} w="60%" /><Skeleton h={26} w="80%" style={{ marginTop: 10 }} /></Card>)}
                </div>
                <Card><Skeleton h={160} /></Card>
                <Card><Skeleton h={220} /></Card>
              </div>
            ) : scenario === "error" ? (
              <Card>
                <ErrorState head={t("ga1.error.head")} body={t("ga1.error.body")} action={<Button kind="secondary" onClick={() => setScenario("group")}>{t("ga1.error.retry")}</Button>} />
              </Card>
            ) : scenario === "firstRun" ? (
              <React.Fragment>
                <div style={{ display: "flex", gap: L.gap, marginBottom: L.gap }}>
                  <KpiCard label={t("ga1.kpi.headcount")} value={num(campuses[0].headcount)} note={t("ga1.kpi.headcount.note", { n: 1 })} />
                  <KpiCard label={t("ga1.kpi.attendance")} value={campuses[0].attendance.toFixed(1) + "%"} note={t("ga1.kpi.attendance.note")} />
                  <KpiCard label={t("ga1.kpi.accounts")} value={num(46)} note={t("ga1.kpi.accounts.note", { n: num(3) })} />
                </div>
                <Card icon="globe" iconTone="accent" title={t("ga1.firstRun.head")}>
                  <p style={ty("small", { color: c.inkMuted, margin: 0, maxWidth: 620 })}>{t("ga1.firstRun.body", { campus: t(campuses[0].nameKey) })}</p>
                </Card>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <div style={{ display: "flex", gap: L.gap, marginBottom: L.gap, alignItems: "stretch" }}>
                  <KpiCard label={t("ga1.kpi.headcount")} value={num(totalHead)} note={t("ga1.kpi.headcount.note", { n: campuses.length })} />
                  <KpiCard label={t("ga1.kpi.attendance")} value={wAttendance.toFixed(1) + "%"} note={t("ga1.kpi.attendance.note")} />
                  {/* the third figure is the one this desk answers for */}
                  <KpiCard label={t("ga1.kpi.accounts")} value={num(238)} note={t("ga1.kpi.accounts.note", { n: num(3) })} />
                </div>
                <div style={{ marginBottom: L.gap }}>
                  <ComparisonShapeCard campuses={campuses} />
                </div>
                <div style={{ marginBottom: L.gap }}>
                  <ComparisonRegister campuses={campuses} onViewStaff={(cm) => { setPerson(null); setStaffAt(cm); }} />
                </div>
                <ExceptionsCard onNavigate={onNavigate} />
              </React.Fragment>
            )}
          </div>
        </main>

      </div>
    );
  }

  /* ============================================================
     GA-04 · USERS & ROLE ASSIGNMENTS
     ============================================================ */
  function EffectivePermissions({ user }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const active = user.roles.filter((r) => r.status === "active");
    const permSet = {};
    active.forEach((r) => { ROLE_CATALOG[r.roleKey].perms.forEach((p) => { permSet[p] = true; }); });
    if (user.pii) permSet["people.pii.read"] = true;
    const groups = {};
    Object.keys(permSet).forEach((p) => {
      const g = PERM_MODULE[p] || "org";
      groups[g] = groups[g] || [];
      groups[g].push(p);
    });
    const groupKeys = Object.keys(groups);
    if (groupKeys.length === 0) return <EmptyState compact head={t("ga4.detail.noRoles.head")} body={t("ga4.detail.noRoles.body")} />;
    return (
      <div>
        {groupKeys.map((g) => (
          <div key={g} style={{ marginBottom: 12 }}>
            <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 6 })}>{t("ga4.perm.groups." + g)}</div>
            {groups[g].map((p) => (
              <div key={p} style={{ display: "flex", gap: 8, padding: "4px 0" }}>
                <span aria-hidden="true" style={{ color: c.action, display: "flex", flexShrink: 0, marginTop: 2 }}><Icon name="check" size={12} /></span>
                <span style={ty("small", { color: c.ink })}>{t("gaperm." + p)}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  function InviteUserPanel({ existingEmails, onCancel, onSent }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [roleKey, setRoleKey] = useState("");
    const [level, setLevel] = useState("");
    const [error, setError] = useState(null);

    function submit() {
      const dup = existingEmails.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
      if (dup) { setError(t("ga4.invite.error.duplicate", { name: t(dup.nameKey) })); return; }
      if (!email.trim() || !roleKey) { setError(t("ga4.invite.error.incomplete")); return; }
      setError(null);
      onSent(email.trim());
    }

    return (
      <Card icon="mail" iconTone="accent" title={t("ga4.invite.title")}>
        <Field id="ga4-inv-email" label={t("ga4.invite.email.label")} error={error}>
          <Input id="ga4-inv-email" type="email" value={email} onChange={setEmail} autoComplete="email" />
        </Field>
        <Field id="ga4-inv-phone" label={t("ga4.invite.phone.label")}>
          <Input id="ga4-inv-phone" type="tel" value={phone} onChange={setPhone} autoComplete="tel" />
        </Field>
        <Field id="ga4-inv-role" label={t("ga4.invite.role.label")}>
          <Select id="ga4-inv-role" value={roleKey} onChange={(v) => { setRoleKey(v); setLevel(""); }}
            options={[{ value: "", label: t("ga4.invite.role.placeholder") }].concat(ROLE_KEYS.map((k) => ({ value: k, label: t(ROLE_CATALOG[k].labelKey) })))} />
        </Field>
        {roleKey ? (
          <Field id="ga4-inv-scope" label={t("ga4.invite.scope.label")}>
            <Select id="ga4-inv-scope" value={level} onChange={setLevel}
              options={[{ value: "", label: t("ga4.assign.scopeLevel.placeholder") }].concat(ROLE_CATALOG[roleKey].levels.map((l) => ({ value: l, label: t("gascope.level." + l) })))} />
          </Field>
        ) : null}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Button kind="quiet" onClick={onCancel}>{t("ga4.invite.cancel")}</Button>
          <Button kind="primary" iconLeft="mail" onClick={submit}>{t("ga4.invite.cta")}</Button>
        </div>
      </Card>
    );
  }

  /* ============================================================
     THE DIALOGS. Every change a group admin makes to somebody else's
     access happens in one of these, and each states what it does
     before it does it. None of them live on the page.
     ============================================================ */

  /* a centred pop-up that sits ABOVE an open side screen, because a
     second side screen sliding over the first buries the thing the
     reader was looking at (the rule the leave module set) */
  function Pop({ title, sub, onClose, children, width }) {
    const { c, shadow } = useTheme();
    const { t, ty } = useLang();
    return ReactDOM.createPortal(
      <div style={{ position: "fixed", inset: 0, zIndex: 2400, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div aria-hidden="true" onMouseDown={onClose} style={{ position: "absolute", inset: 0, background: c.rail, opacity: 0.55 }} />
        <div
          role="dialog" aria-modal="true"
          style={{
            position: "relative", width: width || 560, maxWidth: "100%", maxHeight: "86vh", overflowY: "auto",
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
    const { t, ty } = useLang();
    const { c } = useTheme();
    return (
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20, paddingTop: 16, borderTop: "1px solid " + c.rule, flexWrap: "wrap" }}>
        <Button kind="ghost" onClick={onCancel}>{t("ga4.act.notNow")}</Button>
        <Button kind={danger ? "brass" : "primary"} onClick={disabled ? undefined : onConfirm} disabled={disabled}>{confirmLabel}</Button>
      </div>
    );
  }

  function Consequence({ lines }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    return (
      <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid " + c.rule }}>
        <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 7 })}>{t("ga4.act.whatHappens")}</div>
        {lines.filter(Boolean).map((l, i) => (
          <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start", padding: "3px 0" }}>
            <span aria-hidden="true" style={{ width: 4, height: 4, borderRadius: 4, background: c.inkFaint, marginTop: 8, flexShrink: 0 }} />
            <span style={ty("small", { color: c.ink })}>{l}</span>
          </div>
        ))}
      </div>
    );
  }

  /* WHAT THEY CAN REACH. A role is never a bare name: it is a role
     AT a scope, granted for a reason, by somebody. */
  function RolesDialog({ user, onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const active = user.roles.filter((r) => r.status === "active");
    const [adding, setAdding] = useState(false);
    const [roleKey, setRoleKey] = useState("");
    const [level, setLevel] = useState("");
    const [value, setValue] = useState("");
    const [why, setWhy] = useState("");
    const [drop, setDrop] = useState([]);
    const [err, setErr] = useState({});

    const cat = roleKey ? ROLE_CATALOG[roleKey] : null;
    const levels = cat ? cat.levels : [];
    const needsSecond = cat && cat.secondApproval;

    function submit() {
      const e = {};
      if (adding) {
        if (!roleKey) e.role = t("ga4.roles.errRole");
        if (!level) e.level = t("ga4.roles.errLevel");
        if (level && level !== "group" && !value) e.value = t("ga4.roles.errWhere");
      }
      if ((adding || drop.length) && why.trim().length < 8) e.why = why.trim() ? t("ga4.act.errShort") : t("ga4.act.errWhy");
      if (!adding && !drop.length) e.why = t("ga4.roles.errNothing");
      setErr(e);
      if (Object.keys(e).length) return;
      onDone({ add: adding ? { roleKey: roleKey, level: level, value: value || null, needsSecond: needsSecond } : null, drop: drop, why: why.trim() });
    }

    return (
      <Pop title={t("ga4.roles.title")} sub={t("ga4.roles.sub", { name: t(user.nameKey) })} onClose={onClose} width={620}>
        <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 8 })}>{t("ga4.roles.has")}</div>
        {active.length === 0 ? (
          <p style={ty("small", { color: c.inkMuted, margin: 0 })}>{t("ga4.roles.hasNone")}</p>
        ) : active.map((r, i) => (
          <div key={r.id} style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 0", borderTop: "1px solid " + (i ? c.rule : c.border), flexWrap: "wrap" }}>
            <span style={{ flex: 1, minWidth: 200 }}>
              <span style={ty("small", { display: "block", color: c.ink, fontWeight: 600 })}>{t(ROLE_CATALOG[r.roleKey].labelKey)}</span>
              <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 2 })}>
                {t("ga4.roles.at", { where: r.value ? t("ga4.where." + r.value) : t("ga4.where.group") })} · {t("ga4.roles.granted", { who: t(r.grantedByKey), d: r.grantedAt })}
              </span>
            </span>
            <label htmlFor={"ga4-drop-" + r.id} style={{ display: "inline-flex", gap: 8, alignItems: "center", cursor: "pointer" }}>
              <input
                type="checkbox" id={"ga4-drop-" + r.id} checked={drop.indexOf(r.id) !== -1}
                onChange={(e) => { setDrop((prev) => (e.target.checked ? prev.concat([r.id]) : prev.filter((x) => x !== r.id))); setErr({}); }}
                style={{ accentColor: c.action, width: 16, height: 16 }}
              />
              <span style={ty("caption", { color: c.dangerText, fontWeight: 600 })}>{t("ga4.roles.takeAway")}</span>
            </label>
          </div>
        ))}

        <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid " + c.rule }}>
          {!adding ? (
            <Button kind="secondary" size="sm" iconLeft="plus" onClick={() => setAdding(true)}>{t("ga4.roles.add")}</Button>
          ) : (
            <div>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                <div style={{ width: 230 }}>
                  <Field id="ga4-role" label={t("ga4.roles.which")} error={err.role || null}>
                    <Select id="ga4-role" value={roleKey}
                      onChange={(v) => { setRoleKey(v); setLevel(ROLE_CATALOG[v] && ROLE_CATALOG[v].levels.length === 1 ? ROLE_CATALOG[v].levels[0] : ""); setValue(""); setErr({}); }}
                      options={[{ value: "", label: t("ga4.roles.pick") }].concat(ROLE_KEYS.map((k) => ({ value: k, label: t(ROLE_CATALOG[k].labelKey) })))} />
                  </Field>
                </div>
                {roleKey ? (
                  <div style={{ width: 200 }}>
                    <Field id="ga4-level" label={t("ga4.roles.scope")} error={err.level || null}>
                      <Select id="ga4-level" value={level} onChange={(v) => { setLevel(v); setValue(""); setErr({}); }}
                        options={[{ value: "", label: t("ga4.roles.pick") }].concat(levels.map((l) => ({ value: l, label: t("ga4.level." + l) })))} />
                    </Field>
                  </div>
                ) : null}
                {level && level !== "group" ? (
                  <div style={{ width: 210 }}>
                    <Field id="ga4-where" label={t("ga4.roles.where")} error={err.value || null}>
                      <Select id="ga4-where" value={value} onChange={(v) => { setValue(v); setErr({}); }}
                        options={[{ value: "", label: t("ga4.roles.pick") }].concat(
                          (level === "campus" ? ["indiranagar", "whitefield"] : ["science", "primary", "admin"]).map((w) => ({ value: w, label: t("ga4.where." + w) }))
                        )} />
                    </Field>
                  </div>
                ) : null}
              </div>
              {cat ? <p style={ty("caption", { color: c.inkMuted, margin: "0 0 12px" })}>{t(cat.descKey)}</p> : null}
              <LinkButton onClick={() => { setAdding(false); setRoleKey(""); setLevel(""); setValue(""); setErr({}); }}>{t("ga4.roles.cancelAdd")}</LinkButton>
            </div>
          )}
        </div>

        <div style={{ marginTop: 16 }}>
          <Field id="ga4-roles-why" label={t("ga4.act.why")} hint={t("ga4.act.whyHint")} error={err.why || null}>
            <Input id="ga4-roles-why" value={why} onChange={(v) => { setWhy(v); setErr((e) => Object.assign({}, e, { why: null })); }} placeholder={t("ga4.roles.whyPh")} invalid={!!err.why} />
          </Field>
        </div>

        <Consequence lines={[
          adding && roleKey ? t("ga4.roles.c.add", { role: t(ROLE_CATALOG[roleKey].labelKey), where: value ? t("ga4.where." + value) : t("ga4.where.group") }) : null,
          drop.length ? t("ga4.roles.c.drop", { n: num(drop.length) }) : null,
          needsSecond && adding ? t("ga4.roles.c.second") : null,
          t("ga4.act.c.audit"),
        ]} />
        <PopFoot confirmLabel={t("ga4.roles.save")} onCancel={onClose} onConfirm={submit} />
      </Pop>
    );
  }

  /* THE KEYS. Everything about how one person gets in. */
  function CredentialsDialog({ user, onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [mode, setMode] = useState("generate");
    const [typed, setTyped] = useState("");
    const [mustChange, setMustChange] = useState(true);
    const [resetMfa, setResetMfa] = useState(false);
    const [signOut, setSignOut] = useState(true);
    const [why, setWhy] = useState("");
    const [err, setErr] = useState({});
    const [shown, setShown] = useState(null);

    const generated = "nav-" + t(user.nameKey).split(" ")[0].toLowerCase() + "-7412";

    function submit() {
      const e = {};
      if (mode === "type" && typed.trim().length < 8) e.typed = t("ga4.cred.errTyped");
      if (why.trim().length < 8) e.why = why.trim() ? t("ga4.act.errShort") : t("ga4.act.errWhy");
      setErr(e);
      if (Object.keys(e).length) return;
      setShown(mode === "type" ? typed.trim() : generated);
    }

    if (shown) {
      return (
        <Pop title={t("ga4.cred.doneTitle")} sub={t("ga4.cred.doneSub", { name: t(user.nameKey) })} onClose={() => { onDone({ resetMfa: resetMfa, signOut: signOut }); onClose(); }}>
          <div style={{ padding: "14px 16px", border: "1px dashed " + c.borderStrong, borderRadius: G3.r.md }}>
            <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 6 })}>{t("ga4.cred.theWord")}</div>
            <div style={G3.fig("lg", { color: c.ink, fontWeight: 700, letterSpacing: "0.02em" })}>{shown}</div>
          </div>
          <p style={ty("small", { color: c.ink, margin: "14px 0 0", fontWeight: 600 })}>{t("ga4.cred.onceOnly")}</p>
          <p style={ty("caption", { color: c.inkMuted, margin: "7px 0 0" })}>{t("ga4.cred.onceBody", { name: t(user.nameKey) })}</p>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20, paddingTop: 16, borderTop: "1px solid " + c.rule }}>
            <Button kind="primary" onClick={() => { onDone({ resetMfa: resetMfa, signOut: signOut }); onClose(); }}>{t("ga4.cred.noted")}</Button>
          </div>
        </Pop>
      );
    }

    return (
      <Pop title={t("ga4.cred.title")} sub={t("ga4.cred.sub", { name: t(user.nameKey), email: user.email })} onClose={onClose} width={600}>
        <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 8 })}>{t("ga4.cred.word")}</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          {[{ k: "generate", l: t("ga4.cred.generate") }, { k: "type", l: t("ga4.cred.type") }].map((o) => (
            <button
              key={o.k} type="button" role="radio" aria-checked={mode === o.k ? "true" : "false"}
              onClick={() => { setMode(o.k); setErr({}); }}
              style={ty("small", {
                background: mode === o.k ? c.accentSoft : "transparent",
                border: "1px solid " + (mode === o.k ? c.accent : c.borderStrong),
                color: mode === o.k ? c.action : c.ink, fontWeight: mode === o.k ? 700 : 600,
                borderRadius: G3.r.pill, padding: "7px 15px", cursor: "pointer",
              })}
            >{o.l}</button>
          ))}
        </div>
        {mode === "generate" ? (
          <p style={ty("caption", { color: c.inkMuted, margin: "0 0 14px" })}>{t("ga4.cred.generateNote")}</p>
        ) : (
          <div style={{ width: 300 }}>
            <Field id="ga4-cred-typed" label={t("ga4.cred.typeLabel")} error={err.typed || null}>
              <Input id="ga4-cred-typed" value={typed} onChange={(v) => { setTyped(v); setErr((e) => Object.assign({}, e, { typed: null })); }} placeholder={t("ga4.cred.typePh")} invalid={!!err.typed} />
            </Field>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 14, borderTop: "1px solid " + c.rule }}>
          <Switch id="ga4-cred-must" checked={mustChange} onChange={setMustChange} label={t("ga4.cred.mustChange", { name: t(user.nameKey) })} />
          <Switch id="ga4-cred-mfa" checked={resetMfa} onChange={setResetMfa} label={t("ga4.cred.resetMfa")} />
          <Switch id="ga4-cred-out" checked={signOut} onChange={setSignOut} label={t("ga4.cred.signOut")} />
        </div>

        <div style={{ marginTop: 16 }}>
          <Field id="ga4-cred-why" label={t("ga4.act.why")} hint={t("ga4.act.whyHint")} error={err.why || null}>
            <Input id="ga4-cred-why" value={why} onChange={(v) => { setWhy(v); setErr((e) => Object.assign({}, e, { why: null })); }} placeholder={t("ga4.cred.whyPh")} invalid={!!err.why} />
          </Field>
        </div>

        <Consequence lines={[
          t("ga4.cred.c.word"),
          mustChange ? t("ga4.cred.c.must") : t("ga4.cred.c.notMust"),
          resetMfa ? t("ga4.cred.c.mfa") : null,
          signOut ? t("ga4.cred.c.out") : null,
          t("ga4.act.c.audit"),
        ]} />
        <PopFoot confirmLabel={t("ga4.cred.set")} onCancel={onClose} onConfirm={submit} />
      </Pop>
    );
  }

  /* SWITCHING SOMEBODY OFF. Needs a second pair of eyes, named. */
  function DeactivateDialog({ user, checkerOptions, onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [checker, setChecker] = useState("");
    const [why, setWhy] = useState("");
    const [err, setErr] = useState({});

    function submit() {
      const e = {};
      if (!checker) e.checker = t("ga4.deact.errChecker");
      if (why.trim().length < 8) e.why = why.trim() ? t("ga4.act.errShort") : t("ga4.act.errWhy");
      setErr(e);
      if (Object.keys(e).length) return;
      onDone(checker, why.trim());
    }

    return (
      <Pop title={t("ga4.deact.title", { name: t(user.nameKey) })} sub={t("ga4.deact.sub")} onClose={onClose}>
        <div style={{ width: 300 }}>
          <Field id="ga4-deact-checker" label={t("ga4.deact.checker")} hint={t("ga4.deact.checkerHint")} error={err.checker || null}>
            <Select id="ga4-deact-checker" value={checker} onChange={(v) => { setChecker(v); setErr((e) => Object.assign({}, e, { checker: null })); }}
              options={[{ value: "", label: t("ga4.roles.pick") }].concat(checkerOptions)} />
          </Field>
        </div>
        <Field id="ga4-deact-why" label={t("ga4.act.why")} hint={t("ga4.act.whyHint")} error={err.why || null}>
          <Input id="ga4-deact-why" value={why} onChange={(v) => { setWhy(v); setErr((e) => Object.assign({}, e, { why: null })); }} placeholder={t("ga4.deact.whyPh")} invalid={!!err.why} />
        </Field>
        <Consequence lines={[t("ga4.deact.c.out"), t("ga4.deact.c.roles"), t("ga4.deact.c.record"), t("ga4.act.c.audit")]} />
        <PopFoot danger confirmLabel={t("ga4.deact.confirm")} onCancel={onClose} onConfirm={submit} />
      </Pop>
    );
  }

  /* WHAT THEY MAY SEE. PII and salary are grants, not settings. */
  function PiiDialog({ user, onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [pii, setPii] = useState(!!user.pii);
    const [salary, setSalary] = useState(!!user.salary);
    const [why, setWhy] = useState("");
    const [err, setErr] = useState("");
    const changed = pii !== !!user.pii || salary !== !!user.salary;

    function submit() {
      if (!changed) { setErr(t("ga4.pii.errNothing")); return; }
      if (why.trim().length < 8) { setErr(why.trim() ? t("ga4.act.errShort") : t("ga4.act.errWhy")); return; }
      onDone({ pii: pii, salary: salary, why: why.trim() });
    }

    return (
      <Pop title={t("ga4.pii.title")} sub={t("ga4.pii.sub", { name: t(user.nameKey) })} onClose={onClose}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <Switch id="ga4-pii" checked={pii} onChange={(v) => { setPii(v); setErr(""); }} label={t("ga4.pii.identifiers")} />
            <p style={ty("caption", { color: c.inkMuted, margin: "6px 0 0", paddingInlineStart: 2 })}>{t("ga4.pii.identifiersNote")}</p>
          </div>
          <div>
            <Switch id="ga4-salary" checked={salary} onChange={(v) => { setSalary(v); setErr(""); }} label={t("ga4.pii.salary")} />
            <p style={ty("caption", { color: c.inkMuted, margin: "6px 0 0", paddingInlineStart: 2 })}>{t("ga4.pii.salaryNote")}</p>
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <Field id="ga4-pii-why" label={t("ga4.act.why")} hint={t("ga4.act.whyHint")} error={err || null}>
            <Input id="ga4-pii-why" value={why} onChange={(v) => { setWhy(v); setErr(""); }} placeholder={t("ga4.pii.whyPh")} invalid={!!err} />
          </Field>
        </div>
        <Consequence lines={[t("ga4.pii.c.log"), t("ga4.pii.c.review"), t("ga4.act.c.audit")]} />
        <PopFoot confirmLabel={t("ga4.pii.save")} onCancel={onClose} onConfirm={submit} />
      </Pop>
    );
  }

  /* ============================================================
     ONE USER, OPENED OVER THE LIST.
     ============================================================ */
  function UserScreen({ user, onClose, onOpenDialog }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const active = user.roles.filter((r) => r.status === "active");
    const pending = user.roles.filter((r) => r.status === "pending");

    return (
      <SideScreen
        title={t(user.nameKey)}
        sub={user.email + " \u00b7 " + user.staffId}
        width={660}
        avatar={t(user.nameKey)}
        onClose={onClose}
        footer={
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", width: "100%" }}>
            <Button kind="primary" size="sm" iconLeft="staff" onClick={() => onOpenDialog("roles")}>{t("ga4.act.roles")}</Button>
            <Button kind="secondary" size="sm" iconLeft="lock" onClick={() => onOpenDialog("cred")}>{t("ga4.act.cred")}</Button>
            <Button kind="secondary" size="sm" iconLeft="profile" onClick={() => onOpenDialog("pii")}>{t("ga4.act.pii")}</Button>
            {user.status !== "inactive" ? (
              <span style={{ marginInlineStart: "auto" }}>
                <Button kind="ghost" size="sm" iconLeft="signout" onClick={() => onOpenDialog("deact")}>{t("ga4.act.deact")}</Button>
              </span>
            ) : null}
          </div>
        }
      >
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", paddingBottom: 16, borderBottom: "1px solid " + c.rule }}>
          <span style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <StatusMark
              role={user.status === "active" ? "present" : user.status === "invited" ? "late" : "off"}
              glyph={user.status === "active" ? "check" : user.status === "invited" ? "mail" : "lock"}
              word={t("ga4.status." + user.status)}
            />
            <StatusMark role={user.mfa ? "present" : "absent"} glyph={user.mfa ? "lock" : "alert"} word={user.mfa ? t("ga4.mfa.on") : t("ga4.mfa.off")} />
          </span>
        </div>

        <div style={{ marginTop: 18 }}>
          <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 4 })}>{t("ga4.det.signIn")}</div>
          <div style={{ display: "flex", gap: 14, alignItems: "baseline", padding: "10px 0", borderTop: "1px solid " + c.border }}>
            <span style={ty("caption", { color: c.inkFaint, width: 150, flexShrink: 0 })}>{t("ga4.det.lastIn")}</span>
            <span style={ty("small", { color: c.ink })}>{user.lastSignIn || t("ga4.lastSignIn.never")}</span>
          </div>
          <div style={{ display: "flex", gap: 14, alignItems: "baseline", padding: "10px 0", borderTop: "1px solid " + c.rule }}>
            <span style={ty("caption", { color: c.inkFaint, width: 150, flexShrink: 0 })}>{t("ga4.det.email")}</span>
            <span style={G3.fig("sm", { color: c.ink })}>{user.email}</span>
          </div>
          <p style={ty("caption", { color: c.inkFaint, margin: "10px 0 0" })}>{t("ga4.det.credNote")}</p>
        </div>

        <div style={{ marginTop: 22 }}>
          <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 4 })}>{t("ga4.det.reach")}</div>
          {active.length === 0 && pending.length === 0 ? (
            <p style={ty("small", { color: c.dangerText, margin: "8px 0 0", fontWeight: 600 })}>{t("ga4.roles.none")}</p>
          ) : active.concat(pending).map((r, i) => (
            <div key={r.id} style={{ display: "flex", gap: 14, alignItems: "baseline", padding: "11px 0", borderTop: "1px solid " + (i ? c.rule : c.border), flexWrap: "wrap" }}>
              <span style={{ flex: 1, minWidth: 220 }}>
                <span style={ty("small", { display: "block", color: c.ink, fontWeight: 600 })}>{t(ROLE_CATALOG[r.roleKey].labelKey)}</span>
                <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 2 })}>
                  {t("ga4.roles.at", { where: r.value ? t("ga4.where." + r.value) : t("ga4.where.group") })} · {t("ga4.roles.granted", { who: t(r.grantedByKey), d: r.grantedAt })}
                </span>
              </span>
              {r.status === "pending" ? <StatusMark role="late" glyph="clock" word={t("ga4.roles.waiting")} /> : null}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 22 }}>
          <EffectivePermissions user={user} />
        </div>
      </SideScreen>
    );
  }

  /* ============================================================
     APPROVALS — the things other people ask a group admin to sign.

     It used to be one hard-coded role grant on a card at the top of
     the page. What actually reaches this desk is credentials: a
     password somebody cannot reset themselves, a second factor on a
     lost phone, access to identifiers, and yes, a role. Three states,
     and EXPIRED is a real one — a request nobody answered in a week
     stops being approvable, because approving a week-old request for
     a phone that was lost a week ago is how an account gets taken.
     ============================================================ */
  const APPROVAL_SEED = [
    { id: "AR-0042", kind: "password", forKey: "ganame.fatima", byKey: "ganame.meera", onISO: "29 Sep 2026", state: "waiting",
      whyKey: "ga4.ap.w.password" },
    { id: "AR-0041", kind: "mfa", forKey: "ganame.arjun", byKey: "ganame.venkat", onISO: "28 Sep 2026", state: "waiting",
      whyKey: "ga4.ap.w.mfa" },
    { id: "AR-0040", kind: "role", forKey: "ganame.fatima", byKey: "ganame.devansh", onISO: "27 Sep 2026", state: "waiting",
      whyKey: "ga4.ap.w.role", detailKey: "ga4.ap.d.role" },
    { id: "AR-0038", kind: "pii", forKey: "ganame.sharma", byKey: "ganame.meera", onISO: "24 Sep 2026", state: "done",
      whyKey: "ga4.ap.w.pii", outcome: "approved", decidedISO: "24 Sep 2026", noteKey: "ga4.ap.n.pii" },
    { id: "AR-0036", kind: "password", forKey: "ganame.devika", byKey: "ganame.meera", onISO: "18 Sep 2026", state: "done",
      whyKey: "ga4.ap.w.password2", outcome: "declined", decidedISO: "19 Sep 2026", noteKey: "ga4.ap.n.declined" },
    { id: "AR-0031", kind: "mfa", forKey: "ganame.priya", byKey: "ganame.priya", onISO: "05 Sep 2026", state: "expired",
      whyKey: "ga4.ap.w.mfa2" },
  ];

  const APPROVAL_LOOK = {
    password: { icon: "lock", key: "ga4.ap.k.password" },
    mfa: { icon: "lock", key: "ga4.ap.k.mfa" },
    role: { icon: "staff", key: "ga4.ap.k.role" },
    pii: { icon: "profile", key: "ga4.ap.k.pii" },
  };

  function ApprovalDialog({ item, decision, onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [why, setWhy] = useState("");
    const [err, setErr] = useState("");
    const approving = decision === "approve";

    function submit() {
      if (why.trim().length < 8) { setErr(why.trim() ? t("ga4.act.errShort") : t("ga4.act.errWhy")); return; }
      onDone(approving ? "approved" : "declined", why.trim());
    }

    return (
      <Pop
        title={t(approving ? "ga4.ap.approveTitle" : "ga4.ap.declineTitle")}
        sub={t(APPROVAL_LOOK[item.kind].key) + " \u00b7 " + t("ga4.ap.forWho", { name: t(item.forKey) })}
        onClose={onClose}
      >
        <p style={ty("body", { color: c.ink, margin: 0 })}>{t(item.whyKey)}</p>
        <p style={ty("caption", { color: c.inkFaint, margin: "8px 0 0" })}>{t("ga4.ap.askedBy", { who: t(item.byKey), d: item.onISO, id: item.id })}</p>
        <div style={{ marginTop: 16 }}>
          <Field id="ga4-ap-why" label={t("ga4.act.why")} hint={t("ga4.ap.whyHint")} error={err || null}>
            <Input id="ga4-ap-why" value={why} onChange={(v) => { setWhy(v); setErr(""); }} placeholder={t(approving ? "ga4.ap.whyPhA" : "ga4.ap.whyPhD")} invalid={!!err} />
          </Field>
        </div>
        <Consequence lines={[
          approving ? t("ga4.ap.c." + item.kind) : t("ga4.ap.c.declined", { who: t(item.byKey) }),
          t("ga4.act.c.audit"),
        ]} />
        <PopFoot danger={!approving} confirmLabel={t(approving ? "ga4.ap.approve" : "ga4.ap.decline")} onCancel={onClose} onConfirm={submit} />
      </Pop>
    );
  }

  function ApprovalsTab({ items, onDecide, setFlash }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [view, setView] = useState("waiting");
    const [act, setAct] = useState(null);

    const counts = {
      waiting: items.filter((x) => x.state === "waiting").length,
      done: items.filter((x) => x.state === "done").length,
      expired: items.filter((x) => x.state === "expired").length,
    };
    const rows0 = items.filter((x) => x.state === view);

    const columns = [
      { key: "what", label: t("ga4.ap.col.what") },
      { key: "who", label: t("ga4.ap.col.who"), width: 220 },
      { key: "when", label: t("ga4.ap.col.when"), width: 190 },
      { key: "state", label: t("ga4.ap.col.state"), width: 200 },
      { key: "act", label: t("ga4.ap.col.act"), align: "right", width: 84, act: true },
    ];
    const rows = rows0.map((x) => ({
      id: x.id, live: true,
      cells: {
        what: (
          <span style={{ minWidth: 0 }}>
            <span style={ty("small", { display: "block", color: c.ink, fontWeight: 600 })}>{t(APPROVAL_LOOK[x.kind].key)}</span>
            <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 2, maxWidth: 460 })}>{t(x.whyKey)}</span>
          </span>
        ),
        who: (
          <span style={{ display: "flex", gap: 10, alignItems: "center", minWidth: 0 }}>
            <Avatar name={t(x.forKey)} size={28} />
            <span style={ty("small", { color: c.ink })}>{t(x.forKey)}</span>
          </span>
        ),
        when: (
          <span>
            <span style={ty("small", { display: "block", color: c.ink })}>{x.onISO}</span>
            <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 2 })}>{t("ga4.ap.by", { who: t(x.byKey) })}</span>
          </span>
        ),
        state: x.state === "waiting"
          ? <StatusMark role="late" glyph="clock" word={t("ga4.ap.st.waiting")} />
          : x.state === "expired"
            ? <StatusMark role="off" glyph="lock" word={t("ga4.ap.st.expired")} />
            : <StatusMark role={x.outcome === "approved" ? "present" : "absent"} glyph={x.outcome === "approved" ? "check" : "arrow"} word={t(x.outcome === "approved" ? "ga4.ap.st.approved" : "ga4.ap.st.declined")} />,
        act: (
          <span style={{ display: "flex", justifyContent: "flex-end" }}>
            <ActionMenu
              ariaLabel={t("ga4.ap.menuAria", { id: x.id })} size={30}
              items={[
                {
                  key: "approve", icon: "check", label: t("ga4.ap.approve"), tone: "go",
                  disabled: x.state !== "waiting",
                  reason: x.state === "expired" ? t("ga4.ap.expiredWhy") : x.state === "done" ? t("ga4.ap.doneWhy") : undefined,
                  onSelect: x.state === "waiting" ? () => setAct({ item: x, decision: "approve" }) : undefined,
                },
                {
                  key: "decline", icon: "arrow", label: t("ga4.ap.decline"), tone: "danger",
                  disabled: x.state !== "waiting",
                  reason: x.state === "expired" ? t("ga4.ap.expiredWhy") : x.state === "done" ? t("ga4.ap.doneWhy") : undefined,
                  onSelect: x.state === "waiting" ? () => setAct({ item: x, decision: "decline" }) : undefined,
                },
              ]}
            />
          </span>
        ),
      },
    }));

    return (
      <div>
        <div style={{ display: "flex", gap: 6, background: c.sunken, borderRadius: G3.r.pill, padding: 3, width: "fit-content", marginBottom: G3.layout.gap, flexWrap: "wrap" }}>
          {["waiting", "done", "expired"].map((k) => (
            <button
              key={k} type="button" aria-pressed={view === k ? "true" : "false"} onClick={() => setView(k)}
              style={ty("small", {
                border: "none", borderRadius: G3.r.pill, padding: "8px 18px", cursor: "pointer",
                background: view === k ? c.surface : "transparent",
                color: view === k ? c.ink : c.inkMuted, fontWeight: view === k ? 700 : 600,
              })}
            >
              {t("ga4.ap.view." + k)} <span style={G3.fig("xs", { opacity: 0.7 })}>{num(counts[k])}</span>
            </button>
          ))}
        </div>

        {rows.length === 0 ? (
          <Card><EmptyState icon="check" head={t("ga4.ap.empty." + view + ".head")} body={t("ga4.ap.empty." + view + ".body")} /></Card>
        ) : (
          <Register
            title={t("ga4.ap.title." + view)} sub={t("ga4.ap.sub." + view)}
            columns={columns} rows={rows}
            footer={<span style={ty("caption", { color: c.inkFaint })}>{t("ga4.ap.foot")}</span>}
          />
        )}

        {act ? (
          <ApprovalDialog
            item={act.item} decision={act.decision}
            onClose={() => setAct(null)}
            onDone={(outcome, why) => {
              onDecide(act.item.id, outcome, why);
              setFlash(t(outcome === "approved" ? "ga4.ap.doneApproved" : "ga4.ap.doneDeclined", { what: t(APPROVAL_LOOK[act.item.kind].key), name: t(act.item.forKey) }));
              setAct(null);
            }}
          />
        ) : null}
      </div>
    );
  }

  /* ============================================================
     GA-04 · THE PAGE
     ============================================================ */
  function GAUsers({ role, onNavigate }) {
    const { c } = useTheme();
    const { t, ty, lang } = useLang();
    const L = G3.layout;
    const TABS_ID = "ga4-tabs";
    const [tab, setTab] = useState("people");
    const [users, setUsers] = useState(INITIAL_USERS);
    const [approvals, setApprovals] = useState(APPROVAL_SEED);
    const [openId, setOpenId] = useState(null);
    const [dialog, setDialog] = useState(null);
    const [query, setQuery] = useState("");
    const [inviting, setInviting] = useState(false);
    const [flash, setFlash] = useState("");

    const filtered = useMemo(() => {
      const q = query.trim().toLowerCase();
      if (!q) return users;
      return users.filter((u) => t(u.nameKey).toLowerCase().indexOf(q) !== -1 || u.email.toLowerCase().indexOf(q) !== -1);
      // eslint-disable-next-line
    }, [users, query, lang]);

    const checkerOptions = users
      .filter((u) => u.roles.some((r) => r.status === "active" && ROLE_CATALOG[r.roleKey].perms.indexOf("makerchecker.approve") !== -1))
      .map((u) => ({ value: u.id, label: t(u.nameKey) }));

    const open = openId ? users.filter((u) => u.id === openId)[0] : null;
    const waiting = approvals.filter((x) => x.state === "waiting").length;

    function updateUser(id, fn) { setUsers((prev) => prev.map((u) => (u.id === id ? fn(u) : u))); }

    function applyRoles(id, payload) {
      updateUser(id, (u) => {
        let roles = u.roles.map((r) => (payload.drop.indexOf(r.id) !== -1 ? Object.assign({}, r, { status: "revoked" }) : r));
        if (payload.add) {
          roles = roles.concat([{
            id: "r" + Date.now(), roleKey: payload.add.roleKey, level: payload.add.level, value: payload.add.value,
            status: payload.add.needsSecond ? "pending" : "active",
            grantedByKey: "ganame.you", grantedAt: "30 Sep 2026", reasonText: payload.why,
          }]);
        }
        return Object.assign({}, u, { roles: roles });
      });
      setDialog(null);
      setFlash(t("ga4.roles.done", { name: t(users.filter((u) => u.id === id)[0].nameKey) }));
    }

    function applyCred(id, opts) {
      updateUser(id, (u) => Object.assign({}, u, { mfa: opts.resetMfa ? false : u.mfa, lastSignIn: opts.signOut ? u.lastSignIn : u.lastSignIn }));
      setDialog(null);
      setFlash(t("ga4.cred.done", { name: t(users.filter((u) => u.id === id)[0].nameKey) }));
    }

    function applyPii(id, payload) {
      updateUser(id, (u) => Object.assign({}, u, { pii: payload.pii, salary: payload.salary }));
      setDialog(null);
      setFlash(t("ga4.pii.done", { name: t(users.filter((u) => u.id === id)[0].nameKey) }));
    }

    function applyDeactivate(id) {
      updateUser(id, (u) => Object.assign({}, u, { status: "inactive" }));
      setDialog(null); setOpenId(null);
      setFlash(t("ga4.deact.done", { name: t(users.filter((u) => u.id === id)[0].nameKey) }));
    }

    function decideApproval(id, outcome, why) {
      setApprovals((prev) => prev.map((x) => (x.id === id ? Object.assign({}, x, { state: "done", outcome: outcome, decidedISO: "30 Sep 2026", noteText: why }) : x)));
    }

    const columns = [
      { key: "user", label: t("ga4.col.user") },
      { key: "status", label: t("ga4.col.status"), width: 160 },
      { key: "signIn", label: t("ga4.col.signIn"), width: 230 },
      { key: "roles", label: t("ga4.col.roles") },
      { key: "action", label: t("ga4.col.act"), align: "right", width: 84, act: true },
    ];
    const rows = filtered.map((u) => {
      const activeRoles = u.roles.filter((r) => r.status !== "revoked");
      return {
        id: u.id, live: true,
        cells: {
          user: (
            <span style={{ display: "flex", gap: 11, alignItems: "center", minWidth: 0 }}>
              <Avatar name={t(u.nameKey)} size={30} />
              <span style={{ minWidth: 0 }}>
                <span style={ty("small", { display: "block", color: c.ink, fontWeight: 600, whiteSpace: "nowrap" })}>{t(u.nameKey)}</span>
                <span style={G3.fig("micro", { display: "block", color: c.inkFaint, marginTop: 2 })}>{u.email}</span>
              </span>
            </span>
          ),
          status: (
            <StatusMark
              role={u.status === "active" ? "present" : u.status === "invited" ? "late" : "off"}
              glyph={u.status === "active" ? "check" : u.status === "invited" ? "mail" : "lock"}
              word={t("ga4.status." + u.status)}
            />
          ),
          signIn: (
            <span>
              <span style={ty("small", { display: "block", color: c.ink })}>{u.lastSignIn || t("ga4.lastSignIn.never")}</span>
              <span style={ty("caption", { display: "block", color: u.mfa ? c.inkFaint : c.dangerText, marginTop: 2, fontWeight: u.mfa ? 400 : 600 })}>
                {u.mfa ? t("ga4.mfa.onShort") : t("ga4.mfa.offShort")}
              </span>
            </span>
          ),
          roles: activeRoles.length === 0
            ? (u.status === "inactive"
              ? <span style={ty("small", { color: c.inkFaint })}>—</span>
              : <span style={ty("small", { color: c.dangerText, fontWeight: 600 })}>{t("ga4.roles.none")}</span>)
            : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {activeRoles.slice(0, 2).map((r) => (
                  <Chip key={r.id} bg={r.status === "pending" ? c.lateTint : c.sunken} fg={r.status === "pending" ? c.lateText : c.inkMuted}>
                    {t(ROLE_CATALOG[r.roleKey].labelKey)}
                  </Chip>
                ))}
                {activeRoles.length > 2 ? <Chip>{t("ga4.roles.more", { n: activeRoles.length - 2 })}</Chip> : null}
              </div>
            ),
          action: (
            <span style={{ display: "flex", justifyContent: "flex-end" }}>
              <ActionMenu
                ariaLabel={t("ga4.rowMenu.aria", { name: t(u.nameKey) })} size={30}
                items={[
                  { key: "open", icon: "profile", label: t("ga4.act.open"), onSelect: () => setOpenId(u.id) },
                  { key: "roles", icon: "staff", label: t("ga4.act.roles"), onSelect: () => { setOpenId(u.id); setDialog("roles"); } },
                  { key: "cred", icon: "lock", label: t("ga4.act.cred"), onSelect: () => { setOpenId(u.id); setDialog("cred"); } },
                  u.status !== "inactive"
                    ? { key: "deact", icon: "signout", label: t("ga4.act.deact"), tone: "danger", onSelect: () => { setOpenId(u.id); setDialog("deact"); } }
                    : { key: "deact", icon: "signout", label: t("ga4.act.deact"), disabled: true, reason: t("ga4.status.inactive") },
                ]}
              />
            </span>
          ),
        },
      };
    });

    const TAB_ITEMS = [
      { key: "people", label: t("ga4.tab.people") },
      { key: "approvals", label: t("ga4.tab.approvals") + (waiting ? " (" + num(waiting) + ")" : "") },
    ];

    return (
      <div className="nv3" style={{ display: "flex", minHeight: "100vh", background: c.page, color: c.ink, fontFamily: G3.font.ui }}>
        <Rail role={role || "groupAdmin"} active="gaUsers" onNavigate={onNavigate} initials={t("ga4.you.initials")} />
        <main style={{ flex: 1, minWidth: 0, position: "relative", overflowX: "clip" }}>
          <Motif />
          <div style={{ position: "relative", zIndex: 1, maxWidth: L.contentMax, margin: "0 auto", padding: "22px " + L.contentPadX + "px 56px" }}>
            <TopStrip label={t("nav.gaUsers")} />
            <PageHeader
              title={t("ga4.title")} sub={t("ga4.sub")} meta={t("ga.top.scope")}
              right={<Button kind="primary" iconLeft="mail" onClick={() => setInviting(true)}>{t("ga4.invite")}</Button>}
            />

            {flash ? (
              <div role="status" style={{ display: "flex", gap: 12, alignItems: "baseline", marginBottom: L.gap }}>
                <span style={ty("small", { color: c.ink, flex: 1, minWidth: 0, fontWeight: 600 })}>{flash}</span>
                <LinkButton onClick={() => setFlash("")}>{t("ga4.act.dismiss")}</LinkButton>
              </div>
            ) : null}

            <Tabs items={TAB_ITEMS} active={tab} onChange={(k) => { setTab(k); setFlash(""); setOpenId(null); setDialog(null); }} ariaLabel={t("ga4.tabsAria")} idBase={TABS_ID} size="lg" />

            {tab === "people" ? (
              <TabPanel idBase={TABS_ID} tabKey="people" style={{ paddingTop: 20 }}>
                <div style={{ marginBottom: 14, maxWidth: 340 }}>
                  <Input id="ga4-search" value={query} onChange={setQuery} placeholder={t("ga4.search.placeholder")} trailing={<Icon name="list" size={15} />} />
                </div>
                {filtered.length === 0 ? (
                  <Card><EmptyState head={t("ga4.search.empty.head", { q: query })} body={t("ga4.search.empty.body")} action={<Button kind="secondary" onClick={() => setQuery("")}>{t("ga4.search.clear")}</Button>} /></Card>
                ) : (
                  <Register
                    title={t("ga4.title")} sub={t("ga4.reg.sub", { n: num(filtered.length) })}
                    columns={columns} rows={rows}
                    footer={<span style={ty("caption", { color: c.inkFaint })}>{t("ga4.reg.foot")}</span>}
                  />
                )}
              </TabPanel>
            ) : null}

            {tab === "approvals" ? (
              <TabPanel idBase={TABS_ID} tabKey="approvals" style={{ paddingTop: 20 }}>
                <ApprovalsTab items={approvals} onDecide={decideApproval} setFlash={setFlash} />
              </TabPanel>
            ) : null}
          </div>
        </main>

        {/* the user stays open UNDER the pop-up, which is the point of
            a pop-up over a side screen rather than a second panel */}
        {open ? (
          <UserScreen user={open} onClose={() => { setOpenId(null); setDialog(null); }} onOpenDialog={(d) => setDialog(d)} />
        ) : null}

        {open && dialog === "roles" ? <RolesDialog user={open} onClose={() => setDialog(null)} onDone={(p) => applyRoles(open.id, p)} /> : null}
        {open && dialog === "cred" ? <CredentialsDialog user={open} onClose={() => setDialog(null)} onDone={(o) => applyCred(open.id, o)} /> : null}
        {open && dialog === "pii" ? <PiiDialog user={open} onClose={() => setDialog(null)} onDone={(p) => applyPii(open.id, p)} /> : null}
        {open && dialog === "deact" ? (
          <DeactivateDialog
            user={open} checkerOptions={checkerOptions.filter((o) => o.value !== open.id)}
            onClose={() => setDialog(null)} onDone={() => applyDeactivate(open.id)}
          />
        ) : null}

        {inviting ? (
          <Pop title={t("ga4.invite")} onClose={() => setInviting(false)} width={620}>
            <InviteUserPanel
              existingEmails={users}
              onCancel={() => setInviting(false)}
              onSent={(email) => { setInviting(false); setFlash(t("ga4.invite.done", { email: email })); }}
            />
          </Pop>
        ) : null}
      </div>
    );
  }

  /* ============================================================
     GA-08 · AUDIT LOG
     ============================================================ */
  function FiltersBar({ filters, setFilters, actors, entities, actions }) {
    const { t } = useLang();
    const { c } = useTheme();
    function set(k, v) { setFilters(Object.assign({}, filters, { [k]: v })); }
    return (
      <Card style={{ marginBottom: G3.layout.gap }}>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end" }}>
          <Field id="ga8-actor" label={t("ga8.filters.actor.label")}>
            <Select id="ga8-actor" value={filters.actor} onChange={(v) => set("actor", v)}
              options={[{ value: "", label: t("ga8.filters.actor.all") }].concat(actors.map((a) => ({ value: a, label: t(a) })))} />
          </Field>
          <Field id="ga8-entity" label={t("ga8.filters.entity.label")}>
            <Select id="ga8-entity" value={filters.entity} onChange={(v) => set("entity", v)}
              options={[{ value: "", label: t("ga8.filters.entity.all") }].concat(entities.map((e) => ({ value: e, label: t(e) })))} />
          </Field>
          <Field id="ga8-action" label={t("ga8.filters.action.label")}>
            <Select id="ga8-action" value={filters.action} onChange={(v) => set("action", v)}
              options={[{ value: "", label: t("ga8.filters.action.all") }].concat(actions.map((a) => ({ value: a, label: t(a) })))} />
          </Field>
          <Field id="ga8-range" label={t("ga8.filters.range.label")}>
            <Select id="ga8-range" value={filters.range} onChange={(v) => set("range", v)}
              options={[{ value: "7d", label: t("ga8.filters.range.7d") }, { value: "30d", label: t("ga8.filters.range.30d") }, { value: "all", label: t("ga8.filters.range.all") }]} />
          </Field>
          <Field id="ga8-sens" label={t("ga8.filters.sensitivity.label")}>
            <Select id="ga8-sens" value={filters.sensitivity} onChange={(v) => set("sensitivity", v)}
              options={[{ value: "", label: t("ga8.filters.sensitivity.all") }, { value: "high", label: t("ga8.filters.sensitivity.high") }, { value: "standard", label: t("ga8.filters.sensitivity.standard") }]} />
          </Field>
          <div style={{ paddingBottom: 2 }}>
            <LinkButton onClick={() => setFilters({ actor: "", entity: "", action: "", range: "7d", sensitivity: "" })}>{t("ga8.filters.clear")}</LinkButton>
          </div>
        </div>
      </Card>
    );
  }

  function EntryDetail({ entry, onFollow }) {
    const { c } = useTheme();
    const { t, ty } = useLang();

    /* the empty state names the gesture, because a panel that says
       only "nothing selected" has told the reader nothing */
    if (!entry) {
      return (
        <div style={{ position: "sticky", top: 16 }}>
          <Card><EmptyState head={t("ga8.detail.empty.head")} body={t("ga8.detail.empty.body")} compact /></Card>
        </div>
      );
    }

    function Fact({ label, children, last }) {
      return (
        <div style={{ display: "flex", gap: 12, alignItems: "baseline", padding: "8px 0", borderBottom: last ? "none" : "1px dashed " + c.border }}>
          <span style={ty("caption", { color: c.inkFaint, width: 86, flexShrink: 0 })}>{label}</span>
          <span style={{ flex: 1, minWidth: 0 }}>{children}</span>
        </div>
      );
    }

    return (
      <div style={{ position: "sticky", top: 16 }}>
        <Card>
          {/* 1 · WHAT HAPPENED — the heading, not a field called "Action" */}
          <div style={{ paddingBottom: 14, borderBottom: "1px solid " + c.rule }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <span style={{ flex: 1, minWidth: 0 }}>
                <h3 style={ty("h2", { margin: 0, color: c.ink })}>{t(entry.actionKey)}</h3>
                <div style={{ fontFamily: G3.font.mono, fontSize: 12, color: c.inkMuted, marginTop: 5, wordBreak: "break-word" }}>
                  {t(entry.entityKey)} · {entry.entityId}
                </div>
              </span>
              {entry.sensitivity === "high" ? <StatusChip tone="penalty" icon="lock" label={t("ga8.sensitivity.high")} /> : null}
            </div>
          </div>

          {/* 2 · WHAT CHANGED — the reason anybody opens an audit line */}
          <div style={{ padding: "14px 0", borderBottom: "1px solid " + c.rule }}>
            <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 9 })}>{t("ga8.detail.diff")}</div>
            {entry.diff.map((d, i2) => (
              <div key={i2} style={{ padding: "8px 0", borderBottom: i2 < entry.diff.length - 1 ? "1px dashed " + c.border : "none" }}>
                <div style={ty("small", { color: c.ink, fontWeight: 600, marginBottom: 4 })}>{t(d.fieldKey)}</div>
                {d.sensitive ? (
                  <React.Fragment>
                    <StatusChip tone="penalty" icon="lock" label={t("ga8.detail.changed")} />
                    <div style={ty("caption", { color: c.inkFaint, marginTop: 4 })}>{t("ga8.detail.changed.note")}</div>
                  </React.Fragment>
                ) : (
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                    <span style={ty("small", { color: c.inkMuted, textDecoration: "line-through", textDecorationColor: c.inkFaint })}>{d.before}</span>
                    <span aria-hidden="true" style={{ color: c.inkFaint, display: "flex" }}><Icon name="arrow" size={13} /></span>
                    <span style={ty("small", { color: c.ink, fontWeight: 700 })}>{d.after}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 3 · WHO, WHEN, WHERE — supporting facts, not the headline */}
          <div style={{ padding: "12px 0 2px" }}>
            <Fact label={t("ga8.detail.actor")}>
              <span style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
                <Avatar name={t(entry.actorKey)} size={26} />
                <span style={ty("small", { color: c.ink, fontWeight: 600 })}>{t(entry.actorKey)}</span>
              </span>
            </Fact>
            <Fact label={t("ga8.detail.time")}>
              <span style={{ fontFamily: G3.font.mono, fontSize: 12.5, color: c.ink }}>{entry.ts}</span>
            </Fact>
            <Fact label={t("ga8.detail.scope")}>
              <span style={ty("small", { color: c.inkMuted })}>{t(entry.scopeKey)}</span>
            </Fact>
            {/* an ABSENT reason is a fact, not a missing row */}
            <Fact label={t("ga8.detail.reason")} last>
              {entry.reasonKey
                ? <span style={ty("small", { color: c.ink })}>{t(entry.reasonKey)}</span>
                : <span style={ty("small", { color: c.inkFaint, fontStyle: "italic" })}>{t("ga8.detail.reason.none")}</span>}
            </Fact>
          </div>

          <div style={{ marginTop: 12, paddingTop: 14, borderTop: "1px solid " + c.rule }}>
            <Button kind="secondary" size="sm" iconLeft="filing" onClick={() => onFollow(entry)}>{t("ga8.detail.follow")}</Button>
            <p style={ty("caption", { color: c.inkFaint, margin: "12px 0 0" })}>{t("ga8.detail.immutable")}</p>
          </div>
        </Card>
      </div>
    );
  }

  function ExportPanel({ onCancel, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [format, setFormat] = useState("csv");
    const [range, setRange] = useState("");
    const [error, setError] = useState(null);

    function submit() {
      if (!range) { setError(t("ga8.export.error.range")); return; }
      setError(null);
      onDone(format, range);
    }

    return (
      <Card icon="download" iconTone="accent" title={t("ga8.export.title")} style={{ marginBottom: G3.layout.gap }}>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-start" }}>
          <Field id="ga8-exp-format" label={t("ga8.export.format.label")}>
            <Select id="ga8-exp-format" value={format} onChange={setFormat} options={[{ value: "csv", label: "CSV" }, { value: "json", label: "JSON" }]} />
          </Field>
          <Field id="ga8-exp-range" label={t("ga8.export.range.label")} error={error}>
            <Select id="ga8-exp-range" value={range} onChange={setRange}
              options={[{ value: "", label: t("ga8.export.range.placeholder") }, { value: "7d", label: t("ga8.filters.range.7d") }, { value: "30d", label: t("ga8.filters.range.30d") }]} />
          </Field>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 6 }}>
          <Button kind="quiet" onClick={onCancel}>{t("ga8.export.cancel")}</Button>
          <Button kind="primary" iconLeft="download" onClick={submit}>{t("ga8.export.cta")}</Button>
        </div>
      </Card>
    );
  }

  function GAAudit({ role, onNavigate }) {
    const { c } = useTheme();
    const { t, ty, lang } = useLang();
    const L = G3.layout;
    const [entries, setEntries] = useState(AUDIT_ENTRIES);
    const [filters, setFilters] = useState({ actor: "", entity: "", action: "", range: "7d", sensitivity: "" });
    const [selectedId, setSelectedId] = useState(null);
    const [following, setFollowing] = useState(null);
    const [exporting, setExporting] = useState(false);
    const [exportQueued, setExportQueued] = useState(false);
    const [visible, setVisible] = useState(8);

    const actors = useMemo(() => Array.from(new Set(entries.map((e) => e.actorKey))), [entries]);
    const entityTypes = useMemo(() => Array.from(new Set(entries.map((e) => e.entityKey))), [entries]);
    const actionTypes = useMemo(() => Array.from(new Set(entries.map((e) => e.actionKey))), [entries]);

    /* "today" is 03 Sep 2026 for this artifact; range filters compare
       against each entry's day offset baked into the mock timestamps */
    const DAY_OFFSET = {
      "03 Sep 2026, 09:12": 0, "02 Sep 2026, 18:44": 1, "02 Sep 2026, 11:20": 1, "01 Sep 2026, 16:05": 2,
      "31 Aug 2026, 10:30": 3, "30 Aug 2026, 14:52": 4, "29 Aug 2026, 09:18": 5, "27 Aug 2026, 15:40": 7,
      "20 Aug 2026, 12:00": 14, "18 Aug 2026, 08:55": 16, "10 Aug 2026, 17:22": 24, "05 Aug 2026, 10:05": 29,
    };

    const filtered = useMemo(() => {
      return entries.filter((e) => {
        if (following && e.entityKey + "|" + e.entityId !== following) return false;
        if (!following) {
          if (filters.actor && e.actorKey !== filters.actor) return false;
          if (filters.entity && e.entityKey !== filters.entity) return false;
          if (filters.action && e.action !== filters.action && e.actionKey !== filters.action) return false;
          if (filters.sensitivity && e.sensitivity !== filters.sensitivity) return false;
          const offset = DAY_OFFSET[e.ts] != null ? DAY_OFFSET[e.ts] : 0;
          if (filters.range === "7d" && offset > 7) return false;
          if (filters.range === "30d" && offset > 30) return false;
        }
        return true;
      });
      // eslint-disable-next-line
    }, [entries, filters, following]);

    const shown = filtered.slice(0, visible);
    const selected = entries.find((e) => e.id === selectedId) || null;

    function doExport(format, range) {
      setExporting(false);
      setExportQueued(true);
      const rangeLabel = range === "7d" ? t("ga8.filters.range.7d") : t("ga8.filters.range.30d");
      setEntries((prev) => [{
        id: "exp-" + Date.now(), ts: "03 Sep 2026, 17:10", actorKey: "ganame.you",
        actionKey: "gaaction.exported", entityKey: "gaentity.auditLog", entityId: format.toUpperCase() + " · " + rangeLabel,
        scopeKey: "gascope.group", sensitivity: "standard", reasonKey: null, diff: [{ fieldKey: "ga8.export.format.label", sensitive: false, before: "—", after: format.toUpperCase() }],
      }].concat(prev));
    }

    return (
      <div className="nv3" style={{ display: "flex", minHeight: "100vh", background: c.page, color: c.ink, fontFamily: G3.font.ui }}>
        <Rail role={role || "groupAdmin"} active="gaAudit" onNavigate={onNavigate} initials={t("ga4.you.initials")} />
        <main style={{ flex: 1, minWidth: 0, position: "relative", overflowX: "clip" }}>
          <Motif />
          <div style={{ position: "relative", zIndex: 1, maxWidth: L.contentMax, margin: "0 auto", padding: "22px " + L.contentPadX + "px 56px" }}>
            <TopStrip label={t("nav.gaAudit")} />
            <PageHeader
              title={t("ga8.title")} sub={t("ga8.sub")} meta={t("ga.top.scope")}
              right={<Button kind="ghost" iconLeft="download" onClick={() => setExporting((v) => !v)}>{t("ga8.export.title")}</Button>}
            />

            {exporting ? <ExportPanel onCancel={() => setExporting(false)} onDone={doExport} /> : null}
            {exportQueued ? (
              <div style={{ marginBottom: L.gap }}>
                <Chip bg={c.lateTint} fg={c.lateText}><span aria-hidden="true" style={{ display: "flex" }}><Icon name="clock" size={12} /></span><span>{t("ga8.export.queued")}</span></Chip>
              </div>
            ) : null}

            {following ? (
              <div style={{ marginBottom: 14 }}>
                <Chip bg={c.accentSoft} fg={c.action}>
                  <span aria-hidden="true" style={{ display: "flex" }}><Icon name="filing" size={12} /></span>
                  <span>{t("ga8.following", { entity: following.split("|")[1] })}</span>
                  <button type="button" onClick={() => setFollowing(null)} aria-label={t("ga8.following.clear")} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: 0, marginLeft: 4, display: "flex" }}>
                    <Icon name="alert" size={11} style={{ display: "none" }} />
                    ×
                  </button>
                </Chip>
              </div>
            ) : (
              <FiltersBar filters={filters} setFilters={setFilters} actors={actors} entities={entityTypes} actions={actionTypes} />
            )}

            <div style={{ display: "flex", gap: L.gap, alignItems: "flex-start" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                {filtered.length === 0 ? (
                  <Card>
                    <EmptyState head={t("ga8.empty.head")} body={t("ga8.empty.body")} action={<Button kind="secondary" onClick={() => setFilters({ actor: "", entity: "", action: "", range: "all", sensitivity: "" })}>{t("ga8.filters.clear")}</Button>} />
                  </Card>
                ) : (
                  <Register
                    title={t("ga8.title")} sub={t("ga8.reg.sub")}
                    onSelect={(id) => setSelectedId(id)}
                    columns={[
                      { key: "time", label: t("ga8.col.time"), mono: true, width: 150 },
                      { key: "actor", label: t("ga8.col.actor"), width: 150 },
                      { key: "action", label: t("ga8.col.action") },
                      { key: "entity", label: t("ga8.col.entity") },
                      { key: "sensitivity", label: t("ga8.col.sensitivity"), width: 150 },
                    ]}
                    rows={shown.map((e) => ({
                      id: e.id,
                      highlight: e.id === selectedId,
                      cells: {
                        time: e.ts,
                        actor: (
                          <span style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
                            <Avatar name={t(e.actorKey)} size={26} />
                            <span style={ty("small", { color: c.ink })}>{t(e.actorKey)}</span>
                          </span>
                        ),
                        action: <span style={ty("small", { color: c.ink, fontWeight: 600 })}>{t(e.actionKey)}</span>,
                        entity: (
                          <span>
                            <span style={ty("small", { display: "block", color: c.ink })}>{t(e.entityKey)}</span>
                            <span style={{ display: "block", fontFamily: G3.font.mono, fontSize: 11, color: c.inkFaint, marginTop: 2 }}>{e.entityId}</span>
                          </span>
                        ),
                        sensitivity: e.sensitivity === "high"
                          ? <StatusChip tone="penalty" icon="lock" label={t("ga8.sensitivity.high")} />
                          : <StatusChip tone="missing" icon="list" label={t("ga8.sensitivity.standard")} />,
                      },
                    }))}
                    footer={
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", flexWrap: "wrap", gap: 10 }}>
                        <span style={ty("caption", { color: c.inkFaint })}>{t("ga8.footer.showing", { shown: num(shown.length), filtered: num(filtered.length), total: num(entries.length) })}</span>
                        {visible < filtered.length ? <LinkButton onClick={() => setVisible((v) => v + 8)}>{t("ga8.footer.loadMore")}</LinkButton> : null}
                      </div>
                    }
                  />
                )}
                <p style={ty("caption", { color: c.inkFaint, margin: "10px 4px" })}>{t("ga8.notEditable")} {t("ga8.footer.retention")}</p>
              </div>
              <div style={{ width: 400, flexShrink: 0 }}>
                <EntryDetail entry={selected} onFollow={(e) => setFollowing(e.entityKey + "|" + t(e.entityKey) + " · " + e.entityId)} />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  /* ============================================================
     export
     ============================================================ */
  window.Pages3 = window.Pages3 || {};
  window.Pages3.GAHome = GAHome;
  window.Pages3.GAUsers = GAUsers;
  window.Pages3.GAAudit = GAAudit;
})();

/* ============================================================
   SELF-CHECK (informational, read at review time):
   · grep -niE "\\bedit\\b|\\bdelete\\b" against ga8.* CONTROL labels
     (button/menu-item text, not prose) returns nothing — GA-08 offers
     only "Open entry" / "Follow this record's history" / "Export" /
     "Filter" / "Clear filters". The literal string "cannot be edited"
     is prose (ga8.notEditable), not a control.
   · no #hex or rgba( literal appears anywhere in this file — every
     colour is c.* (from useTheme()) or G3.*.
   ============================================================ */
