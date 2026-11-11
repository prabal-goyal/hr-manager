/* @jsxRuntime classic */
/* ============================================================
   Naveya — Group Admin systems · window.Pages3.GASystems

   GA-02 Org structure · GA-03 Legal entities & registrations ·
   GA-05 Roles & permissions · GA-06 Academic year & terms ·
   GA-07 Statutory configuration · GA-09 Group reports ·
   GA-10 Integrations & webhooks · GA-11 Devices & ingestion health ·
   GA-12 Data protection & DPDP console.
   docs/screen-inventory.md "9 · Group Admin". Cited inline per
   dev-spec: M1 §6.1 Organization/Campus/Department/LegalEntity,
   M2 §Seed roles + §4.1 RBAC, M7 §6.6 AcademicYear/Term, §4.4
   StatutoryConfig, M15 §Business rules (group reports), M16
   biometric ingestion + webhooks, §8 Consent & retention (DPDP 2023).

   groupadmin.jsx already owns GA-01 (overview), GA-04 (users &
   assignments) and GA-08 (audit log) — this file does not rebuild
   any of the three; it links toward them by route key only
   (gaHome / gaUsers / gaAudit).

   SIX TABS for nine screens, each grouping driven by the screen's
   own question (not by a shared component):
     Organisation   — GA-02 + GA-03. Spec cross-references them as a
                      pair explicitly ("must not contain the org tree
                      (GA-02)" / "must not contain legal-entity
                      registrations (GA-03)") — one is the shape, the
                      other is who employs on paper.
     Roles & policy — GA-05 + GA-07. Different domains (who-can-act vs
                      what-the-law-says) but ONE shared interaction
                      recipe: an immutable/versioned artefact, a diff
                      before publish, an affected-count, and a second
                      Group Admin who is never the author. Putting
                      them together makes that recipe legible once
                      instead of twice.
     Calendar       — GA-06 alone. A genuinely different question
                      ("what is our session shape?") feeding leave
                      policy (HR-26), not payroll config.
     Reports        — GA-09 alone. Deliberately thin — the shared
                      report-runner pattern (PR-06/HR-37) at group
                      scope, "not repeated" per spec.
     Connections    — GA-10 + GA-11. Spec's own words: GA-10 "must not
                      contain device inventory (GA-11) — a different
                      question: are the devices feeding us data?" —
                      an explicit sibling pair, same as Organisation.
     Data protection— GA-12 alone. The single largest compliance gap
                      found in the inventory (§10.1 G2) — it does not
                      get folded into anything else.

   Domain guardrails encoded here (not just described):
     · Every figure is INSIDE one tenant (Sunrise Education Trust).
       Nothing here reads or implies another tenant's data — the
       comparison is cross-campus, never cross-tenant (M1 §3).
     · Role DEFINITIONS (GA-05) are more dangerous than role
       ASSIGNMENTS (GA-04): editing what a role can do changes it for
       every current holder. Every edit shows the affected-holder
       count and a before/after diff, requires a reason, and — for a
       privileged permission — needs a second Group Admin who is not
       the editor (ui-compliance-requirements.md A5, same rule as
       groupadmin.jsx's GA-04 grant flow).
     · `documents.write` is shown, not hidden, as permanently
       unavailable to any Employee-shaped role (M4 §Business rules #2)
       — a deliberate exception to "absent, never a disabled ghost"
       (DESIGN 9), because this is the one place the product must
       prove the platform enforces it, the same reasoning that keeps
       payroll's disabled Approve button visible for the maker
       (ui-compliance-requirements.md §7-C7).
     · GA-07's versions are immutable: no edit-in-place exists on an
       active or superseded version anywhere in this file — only
       Publish new version, Compare, and View pinning.
     · GA-11's device world is the SAME world hr-leaveatt.jsx and
       principal.jsx already render: incident INC-0114 (Main gate
       reader, Indiranagar, down 06:00-13:20 on 7 Aug, still open in
       HR's exception queue) and the live outage principal.jsx's
       banner names (East gate scanner, Primary block, silent since
       07:40 today). Nothing here contradicts either.
     · GA-12 states every retention line as an ABSOLUTE DATE from a
       named policy, never a typed duration, and never offers an
       erasure control on a record inside a statutory-retention
       window (O2). No delete/edit affordance exists anywhere on an
       audit or consent record (append-only, O6).
     · Staff IDs are reused from the established roster (hr.jsx,
       payroll.jsx, accountant.jsx) exactly — NAV-0031 Sunita
       Kulkarni, NAV-0034 Ramesh Iyengar, NAV-0009 Rajiv Menon
       (Accountant/checker elsewhere) — and NEVER NAV-0142/"Ananya
       Rao" for an unrelated example: that code+name is Sunrise's
       PGT Physics teacher in hr.jsx, a different person from the
       Group Admin session user of the same name in groupadmin.jsx
       (a pre-existing collision in the world this file inherited,
       not introduced here — flagged in the dispatch report).

   Composed only from window.G3 / window.UI3. No kit/tokens/screens/
   sibling-page edits, and no dependency on another page's exported
   strings or local components — every helper below is redefined
   locally, matching the established per-file duplication convention.
   ============================================================ */
(function () {
  const G3 = window.G3;
  const UI = window.UI3;
  const { useState, useMemo } = React;
  const {
    useTheme, ThemeToggle, useLang, addStrings,
    Rail, Motif, Card, Register, Button, LinkButton, Field, Input, Select,
    Chip, Figure, inr, num, Icon, ActionMenu, EmptyState, ErrorState,
    Skeleton, TitleMark, Tabs, TabPanel, Switch, StatusMark, Avatar,
  } = UI;

  /* ============================================================
     STRINGS — shared chrome + tab labels
     ============================================================ */
  addStrings({
    en: {
      "gs.top.trust": "Sunrise Education Trust",
      "gs.top.scope": "Group · all campuses",
      "gs.title": "Systems",
      "gs.tabs.aria": "Group Admin systems sections",
      "gs.tab.org": "Organisation",
      "gs.tab.policy": "Roles & policy",
      "gs.tab.calendar": "Calendar",
      "gs.you.initials": "DK",
      "gs.act.whatHappens": "What this does",
      "gs.hol.title": "Holidays this year",
      "gs.hol.cardSub": "The days the school is shut, and the days a person may choose. Set here; every other screen reads it.",
      "gs.hol.sub": "A holiday is read by the paid-days register, the roster, the leave blackout and everybody’s own calendar.",
      "gs.hol.add": "Add a holiday",
      "gs.hol.addTitle": "Add a holiday",
      "gs.hol.editTitle": "Edit this holiday",
      "gs.hol.edit": "Edit it",
      "gs.hol.remove": "Remove it",
      "gs.hol.save": "Save it",
      "gs.hol.cancel": "Not now",
      "gs.hol.col.date": "Date",
      "gs.hol.col.name": "What it is",
      "gs.hol.col.kind": "What it means",
      "gs.hol.col.act": "Actions",
      "gs.hol.menuAria": "Actions on {name}",
      "gs.hol.f.name": "What it is called",
      "gs.hol.f.namePh": "Deepavali",
      "gs.hol.f.date": "The day",
      "gs.hol.f.kind": "What kind",
      "gs.hol.f.which": "Which campuses are closed",
      "gs.hol.f.why": "Why",
      "gs.hol.f.whyHint": "It goes on the audit log. Somebody will ask in March why the school was shut in October.",
      "gs.hol.f.whyPh": "Declared by the trust board on 12 August; matches the state list.",
      "gs.hol.errName": "Name it.",
      "gs.hol.errCampus": "Choose at least one campus.",
      "gs.hol.errAllCampus": "That is every campus — make it a school-closed holiday instead.",
      "gs.hol.errWhy": "Say why.",
      "gs.hol.weekendWarn": "That is a Sunday, which is already a weekly off. Declaring it a holiday changes nothing for anybody.",
      "gs.hol.c.everywhere": "It appears at once on the paid-days register, the roster, the leave calendar and every employee’s own screen.",
      "gs.hol.c.closed": "Nobody is marked absent, nobody applies for it, and it is a paid day.",
      "gs.hol.c.restricted": "The school stays open. Each person may take {n} restricted holidays in the year and applies for one like leave.",
      "gs.hol.c.campus": "Only the campuses you named are closed. Everywhere else the day runs normally.",
      "gs.hol.c.past": "A holiday in a month payroll has already frozen does not move that month. It is corrected as arrears.",
      "gs.hol.added": "{name} added, {date}.",
      "gs.hol.saved": "{name} saved.",
      "gs.hol.removed": "{name} removed. Everywhere that read it has been updated.",
      "gs.hol.foot": "Thirteen days is the usual shape of a Karnataka school year. A restricted holiday is a day a person may ask for.",
      "gs.hol.campus.indiranagar": "Indiranagar",
      "gs.hol.campus.whitefield": "Whitefield",
      "gs.hol.campus.yelahanka": "Yelahanka",
      "gs.hol.campus.hyderabad": "Hyderabad",
      "gs.cal.mon.01": "January", "gs.cal.mon.02": "February", "gs.cal.mon.03": "March", "gs.cal.mon.04": "April",
      "gs.cal.mon.05": "May", "gs.cal.mon.06": "June", "gs.cal.mon.07": "July", "gs.cal.mon.08": "August",
      "gs.cal.mon.09": "September", "gs.cal.mon.10": "October", "gs.cal.mon.11": "November", "gs.cal.mon.12": "December",
      "gs.cal.wd.0": "Sunday", "gs.cal.wd.1": "Monday", "gs.cal.wd.2": "Tuesday", "gs.cal.wd.3": "Wednesday",
      "gs.cal.wd.4": "Thursday", "gs.cal.wd.5": "Friday", "gs.cal.wd.6": "Saturday",
      "gs.tab.reports": "Reports",
      "gs.tab.connections": "Connections",
      "gs.tab.dp": "Data protection",

      /* ---- shared small vocabulary ---- */
      "gs.reason.label": "Reason (required)",
      "gs.reason.placeholder": "Why is this changing?",
      "gs.cta.cancel": "Cancel",
      "gs.cta.confirm": "Confirm",
      "gs.cta.save": "Save",
      "gs.secondEyes.note": "A different Group Admin must confirm this before it takes effect — you cannot confirm your own change.",
    },
  });

  /* ============================================================
     SHARED LAYOUT HELPERS — redefined per file (see header note)
     ============================================================ */
  /* a centred pop-up. Every consequential change in this module
     happens in one, and each states what it does before it does it.
     (Promotion candidate: groupadmin.jsx now carries an identical
     pair — second independent use.) */
  function Pop({ title, sub, onClose, children, width }) {
    const { c, shadow } = useTheme();
    const { ty } = useLang();
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

  function Consequence({ lines }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    return (
      <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid " + c.rule }}>
        <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 7 })}>{t("gs.act.whatHappens")}</div>
        {lines.filter(Boolean).map((l, i) => (
          <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start", padding: "3px 0" }}>
            <span aria-hidden="true" style={{ width: 4, height: 4, borderRadius: 4, background: c.inkFaint, marginTop: 8, flexShrink: 0 }} />
            <span style={ty("small", { color: c.ink })}>{l}</span>
          </div>
        ))}
      </div>
    );
  }

  function TopStrip({ label }) {
    const { t } = useLang();
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, marginBottom: 16 }}>
        <div style={ty("small", { color: c.inkMuted })}>
          <span style={{ color: c.ink, fontWeight: 700 }}>{label}</span>
          <span style={{ margin: "0 8px", color: c.inkFaint }}>·</span>
          <span>{t("gs.top.trust")}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ThemeToggle />
        </div>
      </div>
    );
  }

  function PageHeader({ title, sub, meta }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div style={{ marginBottom: 18 }}>
        <h1 style={ty("display", { margin: 0, color: c.ink })}>{title}</h1>
        {sub ? <div style={ty("small", { color: c.inkMuted, marginTop: 6, maxWidth: 720 })}>{sub}</div> : null}
        {meta ? <div style={ty("caption", { color: c.inkFaint, marginTop: 4 })}>{meta}</div> : null}
      </div>
    );
  }

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
        <div style={ty("small", { color: c.inkMuted, flex: "0 0 42%", minWidth: 0 })}>{label}</div>
        <div style={{ flex: 1, minWidth: 0, textAlign: "right" }}>{children}</div>
      </div>
    );
  }

  function Value({ children, mono, muted }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return <span style={mono ? G3.fig("sm", { color: muted ? c.inkFaint : c.ink, fontWeight: 600 }) : ty("small", { color: muted ? c.inkFaint : c.ink, fontWeight: 600 })}>{children}</span>;
  }

  function Callout({ tone, icon, title, body, children, action, compact }) {
    const { c } = useTheme();
    const { ty } = useLang();
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
        {action ? <div style={{ flexShrink: 0 }}>{action}</div> : null}
      </div>
    );
  }

  function InlineConfirm({ children, onConfirm, onCancel, confirmLabel, cancelLabel, confirmDisabled }) {
    const { c } = useTheme();
    return (
      <div style={{ background: c.sunken, border: "1px solid " + c.borderStrong, borderRadius: G3.r.lg, padding: 14, marginTop: 10 }}>
        {children}
        <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end" }}>
          <Button kind="quiet" size="sm" onClick={onCancel}>{cancelLabel}</Button>
          <Button kind="primary" size="sm" onClick={onConfirm} disabled={confirmDisabled}>{confirmLabel}</Button>
        </div>
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
          background: checked ? c.accent : "transparent",
          color: c.onAccent, display: "flex", alignItems: "center", justifyContent: "center",
          opacity: disabled ? 0.4 : 1, cursor: disabled ? "default" : "pointer",
        }}
      >
        {checked ? <Icon name="check" size={12} /> : null}
      </button>
    );
  }

  function Flash({ text }) {
    const { c } = useTheme();
    const { ty } = useLang();
    if (!text) return null;
    return (
      <div role="status" style={{ display: "flex", alignItems: "flex-start", gap: 11, background: c.presentTint, border: "1px solid " + c.border, borderRadius: G3.r.lg, padding: "12px 14px", marginBottom: 16 }}>
        <span aria-hidden="true" style={{ color: c.presentText, display: "flex", paddingTop: 1 }}><Icon name="check" size={16} /></span>
        <p style={ty("small", { margin: 0, color: c.ink, flex: 1 })}>{text}</p>
      </div>
    );
  }

  /* ============================================================
     REFERENCE DATA — Sunrise Education Trust, the SAME world
     groupadmin.jsx / hr.jsx / payroll.jsx / accountant.jsx render.
     Headcounts match groupadmin.jsx's GA-01 comparison exactly.
     ============================================================ */
  const CAMPUSES = [
    { key: "indiranagar", nameKey: "gs.campus.indiranagar", stateKey: "gs.state.ka", state: "ka", headcount: 212, depts: 7, entity: "trust", tz: "Asia/Kolkata" },
    { key: "whitefield", nameKey: "gs.campus.whitefield", stateKey: "gs.state.ka", state: "ka", headcount: 158, depts: 5, entity: "trust", tz: "Asia/Kolkata" },
    { key: "yelahanka", nameKey: "gs.campus.yelahanka", stateKey: "gs.state.ka", state: "ka", headcount: 46, depts: 1, entity: "found", tz: "Asia/Kolkata" },
    { key: "hyderabad", nameKey: "gs.campus.hyderabad", stateKey: "gs.state.tg", state: "tg", headcount: 121, depts: 3, entity: "trust", tz: "Asia/Kolkata" },
  ];

  const ENTITIES = [
    {
      key: "trust", nameKey: "gs.entity.trust", regTypeKey: "gs.regtype.trust",
      pan: "AABTS1234C", tan: "BLRS12345D", pfEstab: "KN/BNG/0044711/000",
      esiCode: "51000123450008", ref12a: "12A/DIT(E)/2011-12/BLR/00219",
      campuses: ["indiranagar", "whitefield", "hyderabad"],
      registeredISO: "2011-06-14", filings: 4,
    },
    {
      key: "found", nameKey: "gs.entity.found", regTypeKey: "gs.regtype.sec8",
      pan: "AAATS5678F", tan: "BLRS98765E", pfEstab: "KN/BNG/0098765/000",
      esiCode: "51000987650008", ref12a: null,
      campuses: ["yelahanka"],
      registeredISO: "2026-07-01", filings: 1,
    },
  ];

  function entityOf(key) { return ENTITIES.filter((e) => e.key === key)[0] || null; }
  function campusOf(key) { return CAMPUSES.filter((c2) => c2.key === key)[0] || null; }
  const STATE_LABEL_KEY = { ka: "gs.state.ka", tg: "gs.state.tg" };
  const ALL_STATES = ["ka", "tg", "mh", "tn", "dl"];

  addStrings({
    en: {
      "gs.campus.indiranagar": "Indiranagar", "gs.campus.whitefield": "Whitefield",
      "gs.campus.yelahanka": "Yelahanka", "gs.campus.hyderabad": "Hyderabad",
      "gs.state.ka": "Karnataka", "gs.state.tg": "Telangana", "gs.state.mh": "Maharashtra",
      "gs.state.tn": "Tamil Nadu", "gs.state.dl": "Delhi",
      "gs.entity.trust": "Sunrise Education Trust", "gs.entity.found": "Sunrise Foundation (Pre-school)",
      "gs.regtype.trust": "Trust", "gs.regtype.sec8": "Section 8 company",

      /* ================= GA-02 · Org structure ================= */
      "gs2.card.title": "Organisation structure",
      "gs2.card.sub": "Organisation → campus → department. People live in the staff register; who can reach what lives in Roles & policy.",
      "gs2.add.campus": "Add a campus",
      "gs2.col.name": "Campus",
      "gs2.col.size": "People",
      "gs2.col.act": "Actions",
      "gs2.nDepts": "{n} departments",
      "gs2.menuAria": "Actions on {name}",
      "gs2.openCampus": "Open this campus",
      "gs2.pop.sub": "{n} departments · opened from the organisation structure",
      "gs2.pop.headcount": "People here",
      "gs2.pop.depts": "Departments",
      "gs2.pop.deptsNote": "A department is where a head of department approves leave and reads attendance. Moving one moves those duties with it.",
      "gs2.pop.close": "Close",
      "gs2.col.state": "State",
      "gs2.col.entity": "Legal entity",
      "gs2.col.head": "Headcount",
      "gs2.col.depts": "Departments",
      "gs2.rowMenu.aria": "Actions for {name}",
      "gs2.menu.addDept": "Add a department here",
      "gs2.menu.editState": "Edit this campus's state",
      "gs2.menu.moveDept": "Move a department",
      "gs2.menu.archive": "Archive campus",
      "gs2.archive.disabled": "{n} active staff — archive is blocked while staff are assigned to this campus",
      "gs2.noEntity": "No legal entity — blocks payroll",
      "gs2.depts.n": "{n} departments",

      "gs2.form.title": "Add a campus",
      "gs2.form.name.label": "Name",
      "gs2.form.name.placeholder": "e.g. Electronic City",
      "gs2.form.state.label": "State",
      "gs2.form.state.placeholder": "Choose a state — no default (drives PT, LWF and minimum wage)",
      "gs2.form.address.label": "Address",
      "gs2.form.tz.label": "Timezone",
      "gs2.form.entity.label": "Legal entity",
      "gs2.form.entity.none": "None yet — set this later from Legal entities (GA-03)",
      "gs2.form.entity.warn": "Without a legal entity this campus can still be created, but payroll cannot run here until one is linked from Legal entities.",
      "gs2.form.error.incomplete": "Give the campus a name and a state before adding it.",
      "gs2.form.cta": "Add campus",
      "gs2.form.done": "{name} added — recorded in the audit log.",

      "gs2.editState.title": "Edit {name}'s registered state",
      "gs2.editState.current": "Currently {state}",
      "gs2.editState.new.label": "New state",
      "gs2.editState.warn": "This changes {name}'s PT slabs, LWF and minimum wage from the effective date. Check any period still open under {old}.",
      "gs2.editState.secondEyes": "A state change silently re-rates statutory deductions for every current staff member here — a second Group Admin must confirm.",
      "gs2.editState.done": "Submitted — pending a second Group Admin's approval. {name} stays on {old} until then.",

      "gs2.moveDept.title": "Move a department between campuses",
      "gs2.moveDept.dept.label": "Department",
      "gs2.moveDept.target.label": "Target campus",
      "gs2.moveDept.effective.label": "Effective from",
      "gs2.moveDept.warn": "Staff move with the department, each with a ServiceRecord(transferred) entry. Approval chains re-point to the new campus.",
      "gs2.moveDept.locked": "{n} staff here are inside a payroll month that has already run — moving them mid-cycle needs Payroll's sign-off first.",
      "gs2.moveDept.done": "{dept} will move to {campus} from {date} — recorded in the audit log.",


      "gs2.dept.science": "Science", "gs2.dept.mathematics": "Mathematics", "gs2.dept.primary": "Primary",
      "gs2.dept.languages": "Languages", "gs2.dept.administration": "Administration", "gs2.dept.transport": "Transport",
      "gs2.dept.sports": "Sports", "gs2.dept.preprimary": "Pre-primary", "gs2.dept.hostel": "Hostel", "gs2.dept.arts": "Arts",

      /* ================= GA-03 · Legal entities ================= */
      "gs3.card.title": "Legal entities & registrations",
      "gs3.card.sub": "Who the employer of record is, and the registrations the group files under. The rates themselves are set in Roles & policy.",
      "gs3.add": "Add a legal entity",
      "gs3.col.name": "Employer of record",
      "gs3.col.under": "Campuses it employs",
      "gs3.col.state": "Registrations",
      "gs3.state.complete": "All five on file",
      "gs3.state.missing12a": "12A not yet obtained",
      "gs3.openEntity": "Open this entity",
      "gs3.menuAria": "Actions on {name}",
      "gs3.pop.sub": "{kind} · registered {d}",
      "gs3.pop.under": "Campuses it employs",
      "gs3.pop.underNote": "Everyone at these campuses is employed by this entity, and their PF, ESI and TDS file under the numbers above.",
      "gs3.pop.edit": "Correct a number",
      "gs3.detail.missing": "Not yet obtained",
      "gs3.rowMenu.aria": "Actions for {name}",
      "gs3.menu.editId": "Edit an identifier",
      "gs3.menu.assignCampuses": "Assign campuses",
      "gs3.menu.viewFilings": "View dependent filings",
      "gs3.status.complete": "Complete",
      "gs3.status.missing12a": "Missing 12A — flagged against filings needing it",
      "gs3.registered": "Registered {date}",
      "gs3.detail.pan": "PAN", "gs3.detail.tan": "TAN", "gs3.detail.pf": "PF establishment ID",
      "gs3.detail.esi": "ESI code", "gs3.detail.12a": "12A registration",
      "gs3.detail.12a.missing": "Not yet obtained",
      "gs3.detail.campuses": "Campuses under this entity",

      "gs3.editId.title": "Edit an identifier — {name}",
      "gs3.editId.field.label": "Which identifier",
      "gs3.editId.value.label": "New value",
      "gs3.editId.warn": "{n} filings already read this identifier. What was filed does not change; periods still open may need a revised return.",
      "gs3.editId.secondEyes": "These identifiers are the school's statutory identity — a second Group Admin must confirm before the change takes effect.",
      "gs3.editId.done": "Submitted — pending a second Group Admin's approval.",

      "gs3.filings.title": "Filings that read {name}'s identifiers",
      "gs3.filings.pf": "PF ECR — reads the PF establishment ID",
      "gs3.filings.esi": "ESI challan — reads the ESI code",
      "gs3.filings.tds": "Form 24Q / TDS challan — reads the PAN and TAN",
      "gs3.filings.12a": "Income-tax exemption filing — reads the 12A reference",
      "gs3.filings.blocked": "blocked without 12A",

      "gs3.assign.title": "Assign campuses — {name}",
      "gs3.assign.note": "A campus already assigned to another entity moves here, with a warning about any in-flight payroll run under the old entity.",
    },
  });

  const DEPARTMENTS_BY_CAMPUS = {
    indiranagar: ["science", "mathematics", "primary", "languages", "administration", "transport", "sports"],
    whitefield: ["preprimary", "administration", "hostel", "science", "arts"],
    yelahanka: ["preprimary"],
    hyderabad: ["administration", "mathematics", "transport"],
  };
  function deptLabelKey(d) { return "gs2.dept." + d; }

  /* ============================================================
     TAB 1 · GA-02 Org structure + GA-03 Legal entities
     ============================================================ */
  function AddCampusForm({ onCancel, onDone }) {
    const { t } = useLang();
    const { c } = useTheme();
    const { ty } = useLang();
    const [name, setName] = useState("");
    const [state, setState] = useState("");
    const [address, setAddress] = useState("");
    const [entity, setEntity] = useState("");
    const [error, setError] = useState(null);
    const stateOptions = [{ value: "", label: t("gs2.form.state.placeholder") }].concat(
      ALL_STATES.map((s) => ({ value: s, label: t(STATE_LABEL_KEY[s] || "gs.state." + s) }))
    );
    const entityOptions = [{ value: "", label: t("gs2.form.entity.none") }].concat(
      ENTITIES.map((e) => ({ value: e.key, label: t(e.nameKey) }))
    );
    function submit() {
      if (!name.trim() || !state) { setError(t("gs2.form.error.incomplete")); return; }
      onDone(name.trim());
    }
    return (
      <InlineConfirm onConfirm={submit} onCancel={onCancel} confirmLabel={t("gs2.form.cta")} cancelLabel={t("gs.cta.cancel")}>
        <div style={ty("h3", { color: c.ink, margin: "0 0 12px" })}>{t("gs2.form.title")}</div>
        <Field id="gs2-name" label={t("gs2.form.name.label")}>
          <Input id="gs2-name" value={name} onChange={setName} placeholder={t("gs2.form.name.placeholder")} />
        </Field>
        <Field id="gs2-state" label={t("gs2.form.state.label")} error={error && !state ? error : null}>
          <Select id="gs2-state" value={state} onChange={setState} options={stateOptions} />
        </Field>
        <Field id="gs2-addr" label={t("gs2.form.address.label")}>
          <Input id="gs2-addr" value={address} onChange={setAddress} />
        </Field>
        <Field id="gs2-tz" label={t("gs2.form.tz.label")}>
          <Input id="gs2-tz" value="Asia/Kolkata" readOnly />
        </Field>
        <Field id="gs2-entity" label={t("gs2.form.entity.label")} hint={!entity ? t("gs2.form.entity.warn") : null}>
          <Select id="gs2-entity" value={entity} onChange={setEntity} options={entityOptions} />
        </Field>
      </InlineConfirm>
    );
  }

  function EditCampusStateForm({ campus, onCancel, onDone }) {
    const { t } = useLang();
    const { c } = useTheme();
    const { ty } = useLang();
    const [state, setState] = useState("");
    const [reason, setReason] = useState("");
    const stateOptions = [{ value: "", label: t("gs2.form.state.placeholder") }].concat(
      ALL_STATES.filter((s) => s !== campus.state).map((s) => ({ value: s, label: t(STATE_LABEL_KEY[s] || "gs.state." + s) }))
    );
    const oldLabel = t(STATE_LABEL_KEY[campus.state]);
    return (
      <InlineConfirm
        onConfirm={() => onDone(oldLabel)} onCancel={onCancel}
        confirmLabel={t("gs.cta.confirm")} cancelLabel={t("gs.cta.cancel")}
        confirmDisabled={!state || !reason.trim()}
      >
        <div style={ty("h3", { color: c.ink, margin: "0 0 6px" })}>{t("gs2.editState.title", { name: t(campus.nameKey) })}</div>
        <div style={ty("caption", { color: c.inkMuted, marginBottom: 10 })}>{t("gs2.editState.current", { state: oldLabel })}</div>
        <Field id="gs2-newstate" label={t("gs2.editState.new.label")}>
          <Select id="gs2-newstate" value={state} onChange={setState} options={stateOptions} />
        </Field>
        <Field id="gs2-statereason" label={t("gs.reason.label")}>
          <Input id="gs2-statereason" value={reason} onChange={setReason} placeholder={t("gs.reason.placeholder")} />
        </Field>
        {state ? (
          <Callout compact tone="late" icon="alert" body={t("gs2.editState.warn", { name: t(campus.nameKey), old: oldLabel })} />
        ) : null}
        <div style={{ marginTop: 10 }}>
          <Callout compact tone="ltEL" icon="lock" body={t("gs2.editState.secondEyes")} />
        </div>
      </InlineConfirm>
    );
  }

  function MoveDeptForm({ campus, onCancel, onDone }) {
    const { t } = useLang();
    const { c } = useTheme();
    const { ty } = useLang();
    const depts = DEPARTMENTS_BY_CAMPUS[campus.key] || [];
    const [dept, setDept] = useState(depts[0] || "");
    const [target, setTarget] = useState("");
    const [effective, setEffective] = useState("2026-09-01");
    const deptOptions = depts.map((d) => ({ value: d, label: t(deptLabelKey(d)) }));
    const targetOptions = [{ value: "", label: t("gs2.moveDept.target.label") }].concat(
      CAMPUSES.filter((cm) => cm.key !== campus.key).map((cm) => ({ value: cm.key, label: t(cm.nameKey) }))
    );
    /* Transport at Indiranagar is the one department this world already
       has a payroll-locked reason to show — every other department here
       moves freely. */
    const locked = dept === "transport" && campus.key === "indiranagar";
    return (
      <InlineConfirm onConfirm={() => onDone(dept, target)} onCancel={onCancel} confirmLabel={t("gs.cta.confirm")} cancelLabel={t("gs.cta.cancel")} confirmDisabled={!dept || !target || locked}>
        <div style={ty("h3", { color: c.ink, margin: "0 0 10px" })}>{t("gs2.moveDept.title")}</div>
        <Field id="gs2-md-dept" label={t("gs2.moveDept.dept.label")}><Select id="gs2-md-dept" value={dept} onChange={setDept} options={deptOptions} /></Field>
        <Field id="gs2-md-target" label={t("gs2.moveDept.target.label")}><Select id="gs2-md-target" value={target} onChange={setTarget} options={targetOptions} /></Field>
        <Field id="gs2-md-effective" label={t("gs2.moveDept.effective.label")}><Input id="gs2-md-effective" value={effective} onChange={setEffective} /></Field>
        {locked ? (
          <Callout compact tone="late" icon="alert" body={t("gs2.moveDept.locked", { n: 3 })} />
        ) : (
          <Callout compact tone="ltEL" icon="staff" body={t("gs2.moveDept.warn")} />
        )}
      </InlineConfirm>
    );
  }

  /* ONE CAMPUS, opened. Its departments, its head, its entity — and
     the two things a group admin does to it. */
  function CampusPop({ campus, onClose, onAction }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [form, setForm] = useState(null);
    const depts = DEPARTMENTS_BY_CAMPUS[campus.key] || [];

    const facts = [
      { k: t("gs2.col.state"), v: t(campus.stateKey) },
      { k: t("gs2.col.entity"), v: t(entityOf(campus.entity).nameKey) },
      { k: t("gs2.pop.headcount"), v: num(campus.headcount) },
    ];

    return (
      <Pop title={t(campus.nameKey)} sub={t("gs2.pop.sub", { n: num(depts.length) })} onClose={onClose} width={600}>
        {facts.map((f, n) => (
          <div key={f.k} style={{ display: "flex", gap: 14, alignItems: "baseline", padding: "10px 0", borderTop: "1px solid " + (n ? c.rule : c.border) }}>
            <span style={ty("caption", { color: c.inkFaint, width: 160, flexShrink: 0 })}>{f.k}</span>
            <span style={ty("small", { color: c.ink, flex: 1, minWidth: 0 })}>{f.v}</span>
          </div>
        ))}

        <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid " + c.rule }}>
          <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 9 })}>{t("gs2.pop.depts")}</div>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            {depts.map((d) => <Chip key={d}>{t(deptLabelKey(d))}</Chip>)}
          </div>
          <p style={ty("caption", { color: c.inkMuted, margin: "12px 0 0" })}>{t("gs2.pop.deptsNote")}</p>
        </div>

        {form === "state" ? (
          <div style={{ marginTop: 16 }}>
            <EditCampusStateForm campus={campus} onCancel={() => setForm(null)}
              onDone={(old) => { setForm(null); onClose(); onAction(t("gs2.editState.done", { name: t(campus.nameKey), old })); }} />
          </div>
        ) : null}
        {form === "move" ? (
          <div style={{ marginTop: 16 }}>
            <MoveDeptForm campus={campus} onCancel={() => setForm(null)}
              onDone={(dept, target) => { setForm(null); onClose(); onAction(t("gs2.moveDept.done", { dept: t(deptLabelKey(dept)), campus: t(campusOf(target).nameKey), date: "2026-09-01" })); }} />
          </div>
        ) : null}

        {!form ? (
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20, paddingTop: 16, borderTop: "1px solid " + c.rule, flexWrap: "wrap" }}>
            <Button kind="ghost" onClick={onClose}>{t("gs2.pop.close")}</Button>
            <Button kind="primary" iconLeft="arrow" onClick={() => setForm("move")}>{t("gs2.menu.moveDept")}</Button>
            <Button kind="primary" iconLeft="globe" onClick={() => setForm("state")}>{t("gs2.menu.editState")}</Button>
          </div>
        ) : null}
      </Pop>
    );
  }

  function OrgTreeCard({ onAction }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [adding, setAdding] = useState(false);
    const [openKey, setOpenKey] = useState(null);
    const open = openKey ? CAMPUSES.filter((cm) => cm.key === openKey)[0] : null;

    const columns = [
      { key: "campus", label: t("gs2.col.name") },
      { key: "entity", label: t("gs2.col.entity") },
      { key: "size", label: t("gs2.col.size"), align: "right", mono: true, width: 150 },
      { key: "act", label: t("gs2.col.act"), align: "right", width: 84, act: true },
    ];
    const rows = CAMPUSES.map((cm) => ({
      id: cm.key, live: true,
      cells: {
        campus: (
          <span>
            <span style={ty("small", { display: "block", color: c.ink, fontWeight: 600 })}>{t(cm.nameKey)}</span>
            <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 2 })}>{t(cm.stateKey)}</span>
          </span>
        ),
        entity: <span style={ty("small", { color: c.inkMuted })}>{t(entityOf(cm.entity).nameKey)}</span>,
        size: (
          <span>
            <span style={{ display: "block", fontWeight: 600 }}>{num(cm.headcount)}</span>
            <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 2 })}>
              {t("gs2.nDepts", { n: num((DEPARTMENTS_BY_CAMPUS[cm.key] || []).length) })}
            </span>
          </span>
        ),
        act: (
          <span style={{ display: "flex", justifyContent: "flex-end" }}>
            <ActionMenu
              ariaLabel={t("gs2.menuAria", { name: t(cm.nameKey) })} size={30}
              items={[
                { key: "open", icon: "globe", label: t("gs2.openCampus"), onSelect: () => setOpenKey(cm.key) },
                { key: "archive", icon: "alert", label: t("gs2.menu.archive"), disabled: true, reason: t("gs2.archive.disabled", { n: cm.headcount }) },
              ]}
            />
          </span>
        ),
      },
    }));

    return (
      <Card
        icon="globe" iconTone="accent" title={t("gs2.card.title")} sub={t("gs2.card.sub")}
        action={<Button kind="primary" size="sm" iconLeft="briefcase" onClick={() => setAdding((v) => !v)}>{t("gs2.add.campus")}</Button>}
      >
        {adding ? <AddCampusForm onCancel={() => setAdding(false)} onDone={(name) => { setAdding(false); onAction(t("gs2.form.done", { name })); }} /> : null}
        <Register columns={columns} rows={rows} />
        {open ? <CampusPop campus={open} onClose={() => setOpenKey(null)} onAction={onAction} /> : null}
      </Card>
    );
  }

  function EditEntityIdForm({ entity, onCancel, onDone }) {
    const { t } = useLang();
    const { c } = useTheme();
    const { ty } = useLang();
    const fieldOptions = [
      { value: "pan", label: t("gs3.detail.pan") }, { value: "tan", label: t("gs3.detail.tan") },
      { value: "pf", label: t("gs3.detail.pf") }, { value: "esi", label: t("gs3.detail.esi") },
      { value: "12a", label: t("gs3.detail.12a") },
    ];
    const [field, setField] = useState("pan");
    const [value, setValue] = useState("");
    const [reason, setReason] = useState("");
    return (
      <InlineConfirm onConfirm={onDone} onCancel={onCancel} confirmLabel={t("gs.cta.confirm")} cancelLabel={t("gs.cta.cancel")} confirmDisabled={!value.trim() || !reason.trim()}>
        <div style={ty("h3", { color: c.ink, margin: "0 0 10px" })}>{t("gs3.editId.title", { name: t(entity.nameKey) })}</div>
        <Field id="gs3-field" label={t("gs3.editId.field.label")}>
          <Select id="gs3-field" value={field} onChange={setField} options={fieldOptions} />
        </Field>
        <Field id="gs3-value" label={t("gs3.editId.value.label")}>
          <Input id="gs3-value" value={value} onChange={setValue} />
        </Field>
        <Field id="gs3-reason" label={t("gs.reason.label")}>
          <Input id="gs3-reason" value={reason} onChange={setReason} placeholder={t("gs.reason.placeholder")} />
        </Field>
        <Callout compact tone="late" icon="alert" body={t("gs3.editId.warn", { n: entity.filings })} />
        <div style={{ marginTop: 10 }}>
          <Callout compact tone="ltEL" icon="lock" body={t("gs3.editId.secondEyes")} />
        </div>
      </InlineConfirm>
    );
  }

  /* ONE ENTITY, opened: the five numbers it files under, the campuses
     it employs, and the one edit a group admin makes to it. */
  function EntityPop({ entity, onClose, onAction }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [editing, setEditing] = useState(false);
    const under = CAMPUSES.filter((cm) => cm.entity === entity.key);
    const ids = [
      { k: t("gs3.detail.pan"), v: entity.pan },
      { k: t("gs3.detail.tan"), v: entity.tan },
      { k: t("gs3.detail.pf"), v: entity.pfEstab },
      { k: t("gs3.detail.esi"), v: entity.esiCode },
      { k: t("gs3.detail.reg12a"), v: entity.ref12a || null },
    ];
    return (
      <Pop title={t(entity.nameKey)} sub={t("gs3.pop.sub", { kind: t(entity.regTypeKey), d: entity.registeredISO })} onClose={onClose} width={600}>
        {ids.map((f, n) => (
          <div key={f.k} style={{ display: "flex", gap: 14, alignItems: "baseline", padding: "10px 0", borderTop: "1px solid " + (n ? c.rule : c.border) }}>
            <span style={ty("caption", { color: c.inkFaint, width: 190, flexShrink: 0 })}>{f.k}</span>
            {f.v
              ? <span style={{ fontFamily: G3.font.mono, fontSize: 12.5, color: c.ink, flex: 1, minWidth: 0 }}>{f.v}</span>
              : <span style={ty("small", { color: c.dangerText, flex: 1, minWidth: 0, fontWeight: 600 })}>{t("gs3.detail.missing")}</span>}
          </div>
        ))}
        <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid " + c.rule }}>
          <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 9 })}>{t("gs3.pop.under")}</div>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            {under.map((cm) => <Chip key={cm.key}>{t(cm.nameKey)}</Chip>)}
          </div>
          <p style={ty("caption", { color: c.inkMuted, margin: "12px 0 0" })}>{t("gs3.pop.underNote")}</p>
        </div>
        {editing ? (
          <div style={{ marginTop: 16 }}>
            <EditEntityIdForm entity={entity} onCancel={() => setEditing(false)}
              onDone={(field, value) => { setEditing(false); onClose(); onAction(t("gs3.edit.done", { field: field, name: t(entity.nameKey), value: value })); }} />
          </div>
        ) : (
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20, paddingTop: 16, borderTop: "1px solid " + c.rule }}>
            <Button kind="ghost" onClick={onClose}>{t("gs2.pop.close")}</Button>
            <Button kind="primary" iconLeft="document" onClick={() => setEditing(true)}>{t("gs3.pop.edit")}</Button>
          </div>
        )}
      </Pop>
    );
  }

  function LegalEntitiesCard({ onAction }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [openKey, setOpenKey] = useState(null);
    const open = openKey ? ENTITIES.filter((e) => e.key === openKey)[0] : null;

    const columns = [
      { key: "name", label: t("gs3.col.name") },
      { key: "under", label: t("gs3.col.under") },
      { key: "state", label: t("gs3.col.state"), width: 260 },
      { key: "act", label: t("gs2.col.act"), align: "right", width: 84, act: true },
    ];
    const rows = ENTITIES.map((e) => {
      const under = CAMPUSES.filter((cm) => cm.entity === e.key);
      const complete = !!e.ref12a;
      return {
        id: e.key, live: true,
        cells: {
          name: (
            <span>
              <span style={ty("small", { display: "block", color: c.ink, fontWeight: 600 })}>{t(e.nameKey)}</span>
              <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 2 })}>{t(e.regTypeKey)}</span>
            </span>
          ),
          under: <span style={ty("small", { color: c.inkMuted })}>{under.map((cm) => t(cm.nameKey)).join(", ")}</span>,
          state: complete
            ? <StatusMark role="present" glyph="check" word={t("gs3.state.complete")} />
            : <StatusMark role="late" glyph="alert" word={t("gs3.state.missing12a")} />,
          act: (
            <span style={{ display: "flex", justifyContent: "flex-end" }}>
              <ActionMenu
                ariaLabel={t("gs3.menuAria", { name: t(e.nameKey) })} size={30}
                items={[{ key: "open", icon: "filing", label: t("gs3.openEntity"), onSelect: () => setOpenKey(e.key) }]}
              />
            </span>
          ),
        },
      };
    });

    return (
      <Card
        icon="filing" iconTone="accent" title={t("gs3.card.title")} sub={t("gs3.card.sub")}
        action={<Button kind="primary" size="sm" iconLeft="briefcase">{t("gs3.add")}</Button>}
      >
        <Register columns={columns} rows={rows} />
        {open ? <EntityPop entity={open} onClose={() => setOpenKey(null)} onAction={onAction} /> : null}
      </Card>
    );
  }

  function TabOrganisation() {
    const [flash, setFlash] = useState(null);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: G3.layout.gap }}>
        <Flash text={flash} />
        <OrgTreeCard onAction={(msg) => msg && setFlash(msg)} />
        <LegalEntitiesCard onAction={(msg) => msg && setFlash(msg)} />
      </div>
    );
  }

  /* ============================================================
     TAB 2 · GA-05 Roles & permissions + GA-07 Statutory configuration
     ============================================================ */
  addStrings({
    en: {
      /* ---- GA-05 ---- */
      "gs5.card.title": "Roles & permissions",
      "gs5.card.sub": "What each role means. Who holds one is on the Users screen.",
      "gs5.add": "Create a custom role",
      "gs5.col.role": "Role",
      "gs5.col.holders": "Holders",
      "gs5.col.reach": "What it reaches",
      "gs5.holders.none": "Nobody yet",
      "gs5.holders.one": "1 person",
      "gs5.reach.groupAdmin": "The whole group, every setting, and who else can get in",
      "gs5.reach.principal": "One campus — its attendance, its leave escalations, its people",
      "gs5.reach.hr": "One campus — the staff register, documents and verification",
      "gs5.reach.payrollOfficer": "The payroll run, group-wide",
      "gs5.reach.accountant": "Approving runs, and the trust’s liability",
      "gs5.reach.deptHead": "One department — approving leave and reading attendance",
      "gs5.reach.employee": "Their own record, and nothing else",
      "gs5.reach.financeAnalyst": "Approving runs, and the trust’s liability",
      "gs5.col.perms": "Permissions",
      "gs5.col.status": "Status",
      "gs5.system": "Seed role — protected",
      "gs5.custom": "Custom role",
      "gs5.rowMenu.aria": "Actions for {role}",
      "gs5.menu.edit": "Edit permission set",
      "gs5.menu.editSystem": "View permission set (clone to customise)",
      "gs5.menu.holders": "View who holds this role",
      "gs5.menu.delete": "Delete custom role",
      "gs5.holders.n": "{n} people",
      "gs5.holders.all": "All {n} staff",
      "gs5.perms.n": "{n} permissions",

      "gs5.edit.title": "Edit permission set — {role}",
      "gs5.menu.clone": "Clone to customise",
      "gs5.clonedFrom": "Cloned from {role}",
      "gs5.delete.done": "{role} deleted — no assignments existed to reassign.",
      "gs5.create.done": "{name} created as a custom role — assignable from Users & role assignments (GA-04).",
      "gs5.edit.docsWrite.label": "Create or edit their own StaffDocument",
      "gs5.edit.docsWrite.reason": "Never available to an Employee-shaped role \u2014 document governance is HR-initiated only (M4). Shown, not hidden.",
      "gs5.edit.reason.label": "Reason for this change",
      "gs5.edit.impact": "{n} people hold {role} today. This change applies to every one of them on their next token refresh.",
      "gs5.edit.diff.title": "What changes",
      "gs5.edit.diff.added": "Gained: {what}",
      "gs5.edit.diff.removed": "Removed: {what}",
      "gs5.edit.cta": "Save changes",
      "gs5.edit.done.pending": "Submitted — pending a second Group Admin's approval. {role} keeps its current permission set until then.",

      "gs5.create.title": "Create a custom role",
      "gs5.create.name.label": "Name",
      "gs5.create.clone.label": "Clone from",
      "gs5.create.clone.default": "Employee (default — the narrowest starting point)",
      "gs5.create.cta": "Create role",

      "gs5.delete.disabled": "{n} people hold this role — delete is blocked while it is assigned",

      "gs5.perm.org.manage": "Create and edit campuses, departments and legal entities",
      "gs5.perm.iam.manage": "Invite users, assign roles and grant PII/salary access",
      "gs5.perm.statutory.manage": "Create and activate statutory configuration versions",
      "gs5.perm.campus.attendance.read": "View campus attendance",
      "gs5.perm.campus.leave.escalation": "Approve escalated leave requests",
      "gs5.perm.people.read": "View staff records, without PII",
      "gs5.perm.people.manage": "Create and edit staff records",
      "gs5.perm.documents.manage": "Upload and request staff documents",
      "gs5.perm.documents.verify": "Verify employee-submitted documents",
      "gs5.perm.payroll.run": "Prepare and submit payroll runs (maker)",
      "gs5.perm.makerchecker.approve": "Approve payroll runs and statutory filings (checker)",
      "gs5.perm.statutory.liability.read": "View statutory liability and filings",
      "gs5.perm.dept.leave.approve": "Approve leave for direct reports",
      "gs5.perm.dept.attendance.read": "View department attendance",
      "gs5.mod.org": "Organization", "gs5.mod.iam": "Identity & access", "gs5.mod.people": "People",
      "gs5.mod.documents": "Documents", "gs5.mod.leave": "Leave", "gs5.mod.attendance": "Attendance",
      "gs5.mod.payroll": "Payroll", "gs5.mod.statutory": "Statutory",

      "gs5.role.groupAdmin": "Group Admin", "gs5.role.principal": "Campus Principal", "gs5.role.hr": "HR Operator",
      "gs5.role.payrollOfficer": "Payroll Operator", "gs5.role.accountant": "Accountant",
      "gs5.role.deptHead": "Department Head", "gs5.role.employee": "Employee",
      "gs5.role.financeAnalyst": "Finance Analyst",

      /* ---- GA-07 ---- */
      "gs7.card.title": "Statutory configuration",
      "gs7.card.sub": "Dated, and never edited once used. Every run pins the version in force that month, so an old month recomputes on its own rules.",
      "gs7.add": "Create a new version",
      "gs7.col.version": "Version",
      "gs7.col.from": "Effective from",
      "gs7.col.status": "Status",
      "gs7.status.active": "Active",
      "gs7.status.superseded": "Superseded",
      "gs7.status.draft": "Draft — scheduled",
      "gs7.menu.view": "View rule set",
      "gs7.menu.compare": "Compare with previous",
      "gs7.menu.pinning": "View pinning",
      "gs7.menu.edit": "Edit draft rules",
      "gs7.menu.activate": "Activate this version",
      "gs7.immutable.note": "A version is never edited in place. Publish new version, then activate it.",
      "gs7.pinning.title": "Runs pinned to {v}",
      "gs7.pinning.row": "{run} · {period} · approved by {who}",
      "gs7.pinning.empty": "No run has pinned this version yet.",

      "gs7.rule.pf": "Provident Fund (EPF/EPS)", "gs7.rule.esi": "Employees' State Insurance",
      "gs7.rule.pt": "Professional Tax, by state", "gs7.rule.tds": "TDS — both regimes",
      "gs7.rule.gratuity": "Gratuity", "gs7.rule.bonus": "Bonus", "gs7.rule.lwf": "Labour Welfare Fund, by state",
      "gs7.rule.minwage": "Minimum wage",

      "gs7.pf.rate": "Employee + employer contribution", "gs7.pf.epsCap": "EPS wage ceiling", "gs7.pf.admin": "Administrative + EDLI charges",
      "gs7.esi.rate": "Employee + employer contribution", "gs7.esi.ceiling": "Wage ceiling", "gs7.esi.periods": "Contribution periods",
      "gs7.pt.ka": "Karnataka", "gs7.pt.tg": "Telangana",
      "gs7.tds.old": "Old regime", "gs7.tds.new": "New regime (default)",
      "gs7.gratuity.formula": "Formula", "gs7.gratuity.formulaVal": "15/26 × last drawn (basic + DA) × completed years",
      "gs7.gratuity.exempt": "Tax-exempt ceiling",
      "gs7.bonus.band": "Statutory band", "gs7.bonus.eligCap": "Eligibility wage ceiling", "gs7.bonus.calcCap": "Calculation ceiling",
      "gs7.lwf.ka": "Karnataka (half-yearly)", "gs7.lwf.tg": "Telangana",
      "gs7.lwf.notDue": "Not due this contribution period",
      "gs7.minwage.ka": "Karnataka, unskilled (support staff)", "gs7.minwage.tg": "Telangana, unskilled (support staff)",

      "gs7.diff.title": "{a} → {b}, field by field",
      "gs7.diff.field": "Field", "gs7.diff.before": "In {a}", "gs7.diff.after": "In {b}",
      "gs7.diff.unchanged": "No change from {a}",

      "gs7.edit.title": "Edit draft rules — {v}",
      "gs7.edit.warn": "Values outside plausible bounds are warned, not silently accepted.",
      "gs7.edit.cta": "Save draft",
      "gs7.edit.done": "Draft {v} updated — still unpublished, still editable.",

      "gs7.activate.title": "Activate {v}?",
      "gs7.activate.body": "Effective from {from}. Future runs pin this; every run already computed keeps its own version. A further version supersedes it.",
      "gs7.activate.affected": "{n} staff across {c} campuses will be paid under this version from {from}.",
      "gs7.activate.secondEyes": "The highest-consequence setup action in the product \u2014 a second Group Admin must confirm.",
      "gs7.activate.cta": "Activate",
      "gs7.activate.done": "Submitted — pending a second Group Admin's approval. {v} stays draft until then.",
    },
  });

  const PERM_MODULE = {
    "org.manage": "org", "iam.manage": "iam", "statutory.manage": "statutory",
    "campus.attendance.read": "attendance", "campus.leave.escalation": "leave", "people.read": "people",
    "people.manage": "people", "documents.manage": "documents", "documents.verify": "documents",
    "payroll.run": "payroll", "makerchecker.approve": "payroll", "statutory.liability.read": "statutory",
    "dept.leave.approve": "leave", "dept.attendance.read": "attendance",
  };
  const PERM_KEYS = Object.keys(PERM_MODULE);
  const MODULE_ORDER = ["org", "iam", "people", "documents", "leave", "attendance", "payroll", "statutory"];

  const ROLE_CATALOG = [
    { key: "groupAdmin", labelKey: "gs5.role.groupAdmin", system: true, holders: 2, perms: ["org.manage", "iam.manage", "statutory.manage"] },
    { key: "principal", labelKey: "gs5.role.principal", system: true, holders: 4, perms: ["campus.attendance.read", "campus.leave.escalation", "people.read"] },
    { key: "hr", labelKey: "gs5.role.hr", system: true, holders: 3, perms: ["people.manage", "documents.manage", "documents.verify", "people.read"] },
    { key: "payrollOfficer", labelKey: "gs5.role.payrollOfficer", system: true, holders: 2, perms: ["payroll.run"] },
    { key: "accountant", labelKey: "gs5.role.accountant", system: true, holders: 1, perms: ["makerchecker.approve", "statutory.liability.read"] },
    { key: "deptHead", labelKey: "gs5.role.deptHead", system: true, holders: 8, perms: ["dept.leave.approve", "dept.attendance.read"] },
    { key: "employee", labelKey: "gs5.role.employee", system: true, holders: 537, allStaff: true, perms: [] },
    { key: "financeAnalyst", labelKey: "gs5.role.financeAnalyst", system: false, holders: 0, clonedFromKey: "gs5.role.accountant", perms: ["statutory.liability.read"] },
  ];

  function roleByKey(k) { return ROLE_CATALOG.filter((r) => r.key === k)[0] || null; }
  function moduleOf(perm) { return PERM_MODULE[perm]; }

  /* PF/ESI/PT/TDS/gratuity/bonus/LWF/minimum-wage — GA-07 IS the
     screen these numbers live in; every other screen in this build
     reads a version+date only (payroll.jsx CFG_*, accountant.jsx
     CFG_*) and never repeats a rate — see this file's header note
     and ui-compliance-requirements.md §8-F5. */
  const CFG_VERSIONS = [
    {
      v: "v2026.2", fromISO: "2026-04-01", status: "superseded",
      pf: { rate: "12% + 12%", epsCap: 15000, admin: "0.65% + 0.50% (EDLI)" },
      esi: { rate: "0.75% + 3.25%", ceiling: 21000, periods: "1 Apr–30 Sep · 1 Oct–31 Mar" },
      pt: { ka: "Nil to ₹25,000/mo · ₹200/mo above", tg: "Nil to ₹15,000/mo · ₹150–200/mo above" },
      gratuity: { exempt: 2000000 },
      bonus: { band: "8.33%–20% of eligible wage", eligCap: 21000, calcCap: 7000 },
      lwf: { ka: "₹20 (employee) + ₹40 (employer)", tg: null },
      minwage: { ka: 18000, tg: 17500 },
    },
    {
      v: "v2026.3", fromISO: "2026-07-01", status: "active",
      pf: { rate: "12% + 12%", epsCap: 15000, admin: "0.65% + 0.50% (EDLI)" },
      esi: { rate: "0.75% + 3.25%", ceiling: 21000, periods: "1 Apr–30 Sep · 1 Oct–31 Mar" },
      pt: { ka: "Nil to ₹25,000/mo · ₹200/mo above", tg: "Nil to ₹15,000/mo · ₹150–200/mo above" },
      gratuity: { exempt: 2000000 },
      bonus: { band: "8.33%–20% of eligible wage", eligCap: 21000, calcCap: 7000 },
      lwf: { ka: "₹20 (employee) + ₹40 (employer)", tg: null },
      minwage: { ka: 18000, tg: 17940 },
    },
    {
      v: "v2026.4", fromISO: "2026-09-01", status: "draft",
      pf: { rate: "12% + 12%", epsCap: 15000, admin: "0.65% + 0.50% (EDLI)" },
      esi: { rate: "0.75% + 3.25%", ceiling: 21000, periods: "1 Apr–30 Sep · 1 Oct–31 Mar" },
      pt: { ka: "Nil to ₹25,000/mo · ₹200/mo above", tg: "Nil to ₹15,000/mo · ₹150–200/mo above" },
      gratuity: { exempt: 2000000 },
      bonus: { band: "8.33%–20% of eligible wage", eligCap: 21000, calcCap: 7000 },
      lwf: { ka: "₹20 (employee) + ₹40 (employer)", tg: null },
      minwage: { ka: 18940, tg: 17940 },
    },
  ];
  function cfgByV(v) { return CFG_VERSIONS.filter((c2) => c2.v === v)[0] || null; }
  const CFG_PINS = {
    "v2026.2": [{ run: "PR-2026-04", period: "April 2026" }, { run: "PR-2026-05", period: "May 2026" }, { run: "PR-2026-06", period: "June 2026" }],
    "v2026.3": [{ run: "PR-2026-07", period: "July 2026" }, { run: "PR-2026-08", period: "August 2026" }],
    "v2026.4": [],
  };

  /* ---- GA-05 components ---- */
  /* the one governance-teaching row that must be visible, not hidden:
     `documents.write` (an employee self-writing their own StaffDocument)
     is shown, disabled, on any Employee-shaped role's permission view —
     never silently absent, never a live checkbox (M4 §Business rules #2,
     ui-compliance-requirements.md §7-C7 — the same exception class that
     keeps payroll's disabled Approve visible for the maker). */
  function DocsWriteRow() {
    const { t } = useLang();
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div style={{ marginBottom: 12, display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", background: c.sunken, borderRadius: G3.r.md }}>
        <RowCheck checked={false} disabled onChange={() => {}} ariaLabel={t("gs5.edit.docsWrite.label")} />
        <div>
          <div style={ty("small", { color: c.inkFaint, fontWeight: 600 })}>{t("gs5.edit.docsWrite.label")}</div>
          <div style={ty("caption", { color: c.inkFaint, marginTop: 2 })}>{t("gs5.edit.docsWrite.reason")}</div>
        </div>
      </div>
    );
  }

  /* Seed/system roles are read-only here — spec: "role not is_system
     (system roles are shown read-only with a clone action, not
     silently editable)". Only a CUSTOM role (financeAnalyst below)
     goes through EditPermissionForm. */
  function ViewSystemRoleForm({ role, onClose, onClone }) {
    const { t } = useLang();
    const { c } = useTheme();
    const { ty } = useLang();
    const employeeShaped = role.key === "employee";
    return (
      <div style={{ background: c.sunken, border: "1px solid " + c.border, borderRadius: G3.r.lg, padding: 14, marginTop: 10 }}>
        <div style={ty("h3", { color: c.ink, margin: "0 0 10px" })}>{t(role.labelKey)}</div>
        {employeeShaped ? <DocsWriteRow /> : null}
        {MODULE_ORDER.filter((m) => PERM_KEYS.some((p) => moduleOf(p) === m && role.perms.indexOf(p) !== -1)).map((m) => (
          <div key={m} style={{ marginBottom: 10 }}>
            <div style={ty("colLabel", { color: c.inkFaint, textTransform: "uppercase", marginBottom: 6 })}>{t("gs5.mod." + m)}</div>
            {PERM_KEYS.filter((p) => moduleOf(p) === m && role.perms.indexOf(p) !== -1).map((p) => (
              <div key={p} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "5px 0" }}>
                <RowCheck checked disabled onChange={() => {}} ariaLabel={t("gs5.perm." + p)} />
                <span style={ty("small", { color: c.ink })}>{t("gs5.perm." + p)}</span>
              </div>
            ))}
          </div>
        ))}
        {!role.perms.length && !employeeShaped ? <Value muted>{t("gs5.perms.n", { n: 0 })}</Value> : null}
        <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end" }}>
          <Button kind="quiet" size="sm" onClick={onClose}>{t("gs.cta.cancel")}</Button>
          <Button kind="secondary" size="sm" iconLeft="document" onClick={onClone}>{t("gs5.menu.clone")}</Button>
        </div>
      </div>
    );
  }

  function EditPermissionForm({ role, onCancel, onDone }) {
    const { t } = useLang();
    const { c } = useTheme();
    const { ty } = useLang();
    const employeeShaped = role.key === "employee" || role.clonedFromKey === "gs5.role.employee";
    const [checked, setChecked] = useState(() => {
      const m = {};
      role.perms.forEach((p) => { m[p] = true; });
      return m;
    });
    const [reason, setReason] = useState("");
    const grouped = {};
    MODULE_ORDER.forEach((m) => { grouped[m] = PERM_KEYS.filter((p) => moduleOf(p) === m); });
    const originalSet = role.perms.slice().sort().join("|");
    const nextSet = PERM_KEYS.filter((p) => checked[p]).slice().sort().join("|");
    const dirty = originalSet !== nextSet;
    const added = PERM_KEYS.filter((p) => checked[p] && role.perms.indexOf(p) === -1);
    const removed = role.perms.filter((p) => !checked[p]);
    return (
      <InlineConfirm
        onConfirm={onDone} onCancel={onCancel}
        confirmLabel={t("gs5.edit.cta")} cancelLabel={t("gs.cta.cancel")}
        confirmDisabled={!dirty || !reason.trim()}
      >
        <div style={ty("h3", { color: c.ink, margin: "0 0 10px" })}>{t("gs5.edit.title", { role: t(role.labelKey) })}</div>
        {employeeShaped ? <DocsWriteRow /> : null}
        {MODULE_ORDER.filter((m) => grouped[m].length).map((m) => (
          <div key={m} style={{ marginBottom: 12 }}>
            <div style={ty("colLabel", { color: c.inkFaint, textTransform: "uppercase", marginBottom: 6 })}>{t("gs5.mod." + m)}</div>
            {grouped[m].map((p) => (
              <label key={p} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "6px 0" }}>
                <RowCheck checked={!!checked[p]} onChange={(v) => setChecked((prev) => Object.assign({}, prev, { [p]: v }))} ariaLabel={t("gs5.perm." + p)} />
                <span style={ty("small", { color: c.ink })}>{t("gs5.perm." + p)}</span>
              </label>
            ))}
          </div>
        ))}
        <Field id="gs5-reason" label={t("gs5.edit.reason.label")}>
          <Input id="gs5-reason" value={reason} onChange={setReason} placeholder={t("gs.reason.placeholder")} />
        </Field>
        {dirty ? (
          <div style={{ marginBottom: 10 }}>
            <div style={ty("colLabel", { color: c.inkFaint, textTransform: "uppercase", marginBottom: 4 })}>{t("gs5.edit.diff.title")}</div>
            {added.map((p) => <div key={"a" + p} style={ty("small", { color: c.presentText })}>{t("gs5.edit.diff.added", { what: t("gs5.perm." + p) })}</div>)}
            {removed.map((p) => <div key={"r" + p} style={ty("small", { color: c.dangerText })}>{t("gs5.edit.diff.removed", { what: t("gs5.perm." + p) })}</div>)}
          </div>
        ) : null}
        <Callout compact tone="late" icon="staff" body={t("gs5.edit.impact", { n: role.holders, role: t(role.labelKey) })} />
        <div style={{ marginTop: 10 }}>
          <Callout compact tone="ltEL" icon="lock" body={t("gs.secondEyes.note")} />
        </div>
      </InlineConfirm>
    );
  }

  function RoleRow({ role, onAction, onClone }) {
    const { t } = useLang();
    const { c } = useTheme();
    const [mode, setMode] = useState(null); /* null | "view" | "edit" */
    const items = [
      role.system
        ? { key: "view", icon: "document", label: t("gs5.menu.editSystem"), onSelect: () => setMode("view") }
        : { key: "edit", icon: "document", label: t("gs5.menu.edit"), onSelect: () => setMode("edit") },
      { key: "holders", icon: "staff", label: t("gs5.menu.holders"), onSelect: () => onAction(null) },
      role.system
        ? null
        : { key: "delete", icon: "alert", label: t("gs5.menu.delete"), disabled: role.holders > 0, reason: role.holders > 0 ? t("gs5.delete.disabled", { n: role.holders }) : null, onSelect: () => onAction(t("gs5.delete.done", { role: t(role.labelKey) })) },
    ].filter(Boolean);
    return (
      <div style={{ borderBottom: "1px dashed " + c.border, padding: "13px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ flex: "0 0 26%", minWidth: 0 }}>
            <Value>{t(role.labelKey)}</Value>
            {role.clonedFromKey ? <div style={{ marginTop: 2 }}><Value muted>{t("gs5.clonedFrom", { role: t(role.clonedFromKey) })}</Value></div> : null}
          </div>
          <div style={{ flex: "0 0 18%" }}>
            <Value muted>
              {role.allStaff ? t("gs5.holders.all", { n: role.holders })
                : role.holders === 0 ? t("gs5.holders.none")
                  : role.holders === 1 ? t("gs5.holders.one")
                    : t("gs5.holders.n", { n: role.holders })}
            </Value>
          </div>
          {/* WHAT IT MEANS, not how many rules express it. A reader
              deciding whether to give somebody this role needs the
              first words, and the rest one click away. */}
          <div style={{ flex: "0 0 26%", minWidth: 0 }}>
            <Value muted>{t("gs5.reach." + role.key)}</Value>
          </div>
          <div style={{ flex: "0 0 20%" }}>{role.system ? <StatusChip tone="ltEL" icon="lock" label={t("gs5.system")} /> : <StatusChip tone="brass" icon="document" label={t("gs5.custom")} />}</div>
          <div style={{ flex: 1, textAlign: "right" }}>
            <ActionMenu ariaLabel={t("gs5.rowMenu.aria", { role: t(role.labelKey) })} items={items} />
          </div>
        </div>
        {mode === "view" ? (
          <ViewSystemRoleForm role={role} onClose={() => setMode(null)} onClone={() => { setMode(null); onClone(role); }} />
        ) : null}
        {mode === "edit" ? (
          <EditPermissionForm role={role} onCancel={() => setMode(null)} onDone={() => { setMode(null); onAction(t("gs5.edit.done.pending", { role: t(role.labelKey) })); }} />
        ) : null}
      </div>
    );
  }

  function CreateRoleForm({ cloneFrom, onCancel, onDone }) {
    const { t } = useLang();
    const { c } = useTheme();
    const { ty } = useLang();
    const [name, setName] = useState("");
    const [clone, setClone] = useState(cloneFrom || "employee");
    const cloneOptions = ROLE_CATALOG.filter((r) => r.system).map((r) => ({ value: r.key, label: t(r.labelKey) }));
    return (
      <InlineConfirm onConfirm={() => onDone(name)} onCancel={onCancel} confirmLabel={t("gs5.create.cta")} cancelLabel={t("gs.cta.cancel")} confirmDisabled={!name.trim()}>
        <div style={ty("h3", { color: c.ink, margin: "0 0 10px" })}>{t("gs5.create.title")}</div>
        <Field id="gs5-cname" label={t("gs5.create.name.label")}><Input id="gs5-cname" value={name} onChange={setName} /></Field>
        <Field id="gs5-cclone" label={t("gs5.create.clone.label")} hint={clone === "employee" ? t("gs5.create.clone.default") : null}>
          <Select id="gs5-cclone" value={clone} onChange={setClone} options={cloneOptions} />
        </Field>
      </InlineConfirm>
    );
  }

  function RolesCard({ onAction }) {
    const { t } = useLang();
    const { c } = useTheme();
    const { ty } = useLang();
    const [creating, setCreating] = useState(null); /* null | "employee" | a role key when cloned from View */
    return (
      <Card icon="lock" iconTone="accent" title={t("gs5.card.title")} sub={t("gs5.card.sub")} action={<Button kind="secondary" size="sm" iconLeft="staff" onClick={() => setCreating("employee")}>{t("gs5.add")}</Button>}>
        {creating ? (
          <div style={{ marginBottom: 14 }}>
            <CreateRoleForm cloneFrom={creating} onCancel={() => setCreating(null)} onDone={(name) => { setCreating(null); onAction(t("gs5.create.done", { name })); }} />
          </div>
        ) : null}
        <div style={{ display: "flex", gap: 14, padding: "0 0 8px", borderBottom: "2px solid " + c.ruleStrong }}>
          <div style={ty("colLabel", { flex: "0 0 26%", color: c.inkFaint, textTransform: "uppercase" })}>{t("gs5.col.role")}</div>
          <div style={ty("colLabel", { flex: "0 0 18%", color: c.inkFaint, textTransform: "uppercase" })}>{t("gs5.col.holders")}</div>
          <div style={ty("colLabel", { flex: "0 0 26%", color: c.inkFaint, textTransform: "uppercase" })}>{t("gs5.col.reach")}</div>
          <div style={ty("colLabel", { flex: "0 0 20%", color: c.inkFaint, textTransform: "uppercase" })}>{t("gs5.col.status")}</div>
          <div style={{ flex: 1 }} />
        </div>
        {ROLE_CATALOG.map((r) => <RoleRow key={r.key} role={r} onAction={onAction} onClone={(role) => setCreating(role.key)} />)}
      </Card>
    );
  }

  /* ---- GA-07 components ---- */
  function RuleGroup({ label, children }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div style={{ marginBottom: 14 }}>
        <div style={ty("colLabel", { color: c.inkFaint, textTransform: "uppercase", marginBottom: 4 })}>{label}</div>
        {children}
      </div>
    );
  }

  function RuleSet({ cfg }) {
    const { t } = useLang();
    return (
      <div>
        <RuleGroup label={t("gs7.rule.pf")}>
          <DefRow label={t("gs7.pf.rate")}><Value mono>{cfg.pf.rate}</Value></DefRow>
          <DefRow label={t("gs7.pf.epsCap")}><Value mono>{inr(cfg.pf.epsCap, { paise: false })}/mo</Value></DefRow>
          <DefRow label={t("gs7.pf.admin")} last><Value mono>{cfg.pf.admin}</Value></DefRow>
        </RuleGroup>
        <RuleGroup label={t("gs7.rule.esi")}>
          <DefRow label={t("gs7.esi.rate")}><Value mono>{cfg.esi.rate}</Value></DefRow>
          <DefRow label={t("gs7.esi.ceiling")}><Value mono>{inr(cfg.esi.ceiling, { paise: false })}/mo</Value></DefRow>
          <DefRow label={t("gs7.esi.periods")} last><Value mono>{cfg.esi.periods}</Value></DefRow>
        </RuleGroup>
        <RuleGroup label={t("gs7.rule.pt")}>
          <DefRow label={t("gs7.pt.ka")}><Value mono>{cfg.pt.ka}</Value></DefRow>
          <DefRow label={t("gs7.pt.tg")} last><Value mono>{cfg.pt.tg}</Value></DefRow>
        </RuleGroup>
        <RuleGroup label={t("gs7.rule.tds")}>
          <DefRow label={t("gs7.tds.new")}><Value muted>Finance Act 2026 slabs, as filed on 24Q</Value></DefRow>
          <DefRow label={t("gs7.tds.old")} last><Value muted>Finance Act 2026 slabs, as filed on 24Q</Value></DefRow>
        </RuleGroup>
        <RuleGroup label={t("gs7.rule.gratuity")}>
          <DefRow label={t("gs7.gratuity.formula")}><Value muted>{t("gs7.gratuity.formulaVal")}</Value></DefRow>
          <DefRow label={t("gs7.gratuity.exempt")} last><Value mono>{inr(cfg.gratuity.exempt, { paise: false })}</Value></DefRow>
        </RuleGroup>
        <RuleGroup label={t("gs7.rule.bonus")}>
          <DefRow label={t("gs7.bonus.band")}><Value mono>{cfg.bonus.band}</Value></DefRow>
          <DefRow label={t("gs7.bonus.eligCap")}><Value mono>{inr(cfg.bonus.eligCap, { paise: false })}/mo</Value></DefRow>
          <DefRow label={t("gs7.bonus.calcCap")} last><Value mono>{inr(cfg.bonus.calcCap, { paise: false })}/mo</Value></DefRow>
        </RuleGroup>
        <RuleGroup label={t("gs7.rule.lwf")}>
          <DefRow label={t("gs7.lwf.ka")}><Value mono>{cfg.lwf.ka}</Value></DefRow>
          <DefRow label={t("gs7.lwf.tg")} last>{cfg.lwf.tg ? <Value mono>{cfg.lwf.tg}</Value> : <Value muted>{t("gs7.lwf.notDue")}</Value>}</DefRow>
        </RuleGroup>
        <RuleGroup label={t("gs7.rule.minwage")}>
          <DefRow label={t("gs7.minwage.ka")}><Value mono>{inr(cfg.minwage.ka, { paise: false })}/mo</Value></DefRow>
          <DefRow label={t("gs7.minwage.tg")} last><Value mono>{inr(cfg.minwage.tg, { paise: false })}/mo</Value></DefRow>
        </RuleGroup>
      </div>
    );
  }

  function DiffRow({ label, before, after, unchangedNote }) {
    const { c } = useTheme();
    const { ty } = useLang();
    const changed = before !== after;
    return (
      <div style={{ display: "flex", gap: 14, padding: "9px 0", borderBottom: "1px dashed " + c.border, alignItems: "center" }}>
        <div style={ty("small", { flex: "0 0 34%", color: c.ink })}>{label}</div>
        <div style={{ flex: "0 0 26%" }}><Value mono muted>{before}</Value></div>
        <div style={{ flex: "0 0 6%", textAlign: "center", color: c.inkFaint }}><Icon name="arrow" size={13} /></div>
        <div style={{ flex: 1 }}>
          {changed ? <Value mono>{after}</Value> : <Value muted>{unchangedNote}</Value>}
        </div>
      </div>
    );
  }

  function VersionDiff({ a, b }) {
    const { t } = useLang();
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div style={{ background: c.sunken, border: "1px solid " + c.border, borderRadius: G3.r.lg, padding: 14, marginTop: 10 }}>
        <div style={ty("h3", { color: c.ink, margin: "0 0 10px" })}>{t("gs7.diff.title", { a: a.v, b: b.v })}</div>
        <div style={{ display: "flex", gap: 14, padding: "0 0 8px", borderBottom: "1px solid " + c.borderStrong }}>
          <div style={ty("colLabel", { flex: "0 0 34%", color: c.inkFaint, textTransform: "uppercase" })}>{t("gs7.diff.field")}</div>
          <div style={ty("colLabel", { flex: "0 0 26%", color: c.inkFaint, textTransform: "uppercase" })}>{t("gs7.diff.before", { a: a.v })}</div>
          <div style={{ flex: "0 0 6%" }} />
          <div style={ty("colLabel", { flex: 1, color: c.inkFaint, textTransform: "uppercase" })}>{t("gs7.diff.after", { b: b.v })}</div>
        </div>
        <DiffRow label={t("gs7.minwage.ka")} before={inr(a.minwage.ka, { paise: false }) + "/mo"} after={inr(b.minwage.ka, { paise: false }) + "/mo"} unchangedNote={t("gs7.diff.unchanged", { a: a.v })} />
        <DiffRow label={t("gs7.minwage.tg")} before={inr(a.minwage.tg, { paise: false }) + "/mo"} after={inr(b.minwage.tg, { paise: false }) + "/mo"} unchangedNote={t("gs7.diff.unchanged", { a: a.v })} />
        <DiffRow label={t("gs7.esi.ceiling")} before={inr(a.esi.ceiling, { paise: false }) + "/mo"} after={inr(b.esi.ceiling, { paise: false }) + "/mo"} unchangedNote={t("gs7.diff.unchanged", { a: a.v })} />
        <DiffRow label={t("gs7.pf.epsCap")} before={inr(a.pf.epsCap, { paise: false }) + "/mo"} after={inr(b.pf.epsCap, { paise: false }) + "/mo"} unchangedNote={t("gs7.diff.unchanged", { a: a.v })} />
      </div>
    );
  }

  function ActivateVersionForm({ v, onCancel, onDone }) {
    const { t } = useLang();
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <InlineConfirm onConfirm={onDone} onCancel={onCancel} confirmLabel={t("gs7.activate.cta")} cancelLabel={t("gs.cta.cancel")}>
        <div style={ty("h3", { color: c.ink, margin: "0 0 8px" })}>{t("gs7.activate.title", { v: v.v })}</div>
        <p style={ty("small", { color: c.ink, margin: "0 0 10px" })}>{t("gs7.activate.body", { from: v.fromISO })}</p>
        <Callout compact tone="late" icon="staff" body={t("gs7.activate.affected", { n: 537, c: 4, from: v.fromISO })} />
        <div style={{ marginTop: 10 }}>
          <Callout compact tone="ltEL" icon="lock" body={t("gs7.activate.secondEyes")} />
        </div>
      </InlineConfirm>
    );
  }

  function EditDraftRulesForm({ v, onCancel, onDone }) {
    const { t } = useLang();
    const { c } = useTheme();
    const { ty } = useLang();
    const [minwageKa, setMinwageKa] = useState(String(v.minwage.ka));
    const implausible = Number(minwageKa) < 5000 || Number(minwageKa) > 60000 || !minwageKa.trim();
    return (
      <InlineConfirm onConfirm={onDone} onCancel={onCancel} confirmLabel={t("gs7.edit.cta")} cancelLabel={t("gs.cta.cancel")} confirmDisabled={implausible}>
        <div style={ty("h3", { color: c.ink, margin: "0 0 10px" })}>{t("gs7.edit.title", { v: v.v })}</div>
        <Field id="gs7-minwage-ka" label={t("gs7.minwage.ka")} error={implausible ? t("gs7.edit.warn") : null}>
          <Input id="gs7-minwage-ka" inputMode="numeric" value={minwageKa} onChange={setMinwageKa} />
        </Field>
        <Callout compact tone="off" icon="lock" body={t("gs7.immutable.note")} />
      </InlineConfirm>
    );
  }

  function VersionCard({ v, prev, onAction }) {
    const { t } = useLang();
    const { c } = useTheme();
    const { ty } = useLang();
    const [mode, setMode] = useState(null); /* null | "view" | "compare" | "pinning" | "activate" | "editDraft" */
    const items = [
      { key: "view", icon: "document", label: t("gs7.menu.view"), onSelect: () => setMode(mode === "view" ? null : "view") },
      prev ? { key: "compare", icon: "arrow", label: t("gs7.menu.compare"), onSelect: () => setMode(mode === "compare" ? null : "compare") } : null,
      { key: "pinning", icon: "filing", label: t("gs7.menu.pinning"), onSelect: () => setMode(mode === "pinning" ? null : "pinning") },
      v.status === "draft" ? { key: "editDraft", icon: "document", label: t("gs7.menu.edit"), onSelect: () => setMode("editDraft") } : null,
      v.status === "draft" ? { key: "activate", icon: "check", label: t("gs7.menu.activate"), onSelect: () => setMode("activate") } : null,
    ].filter(Boolean);
    const statusTone = v.status === "active" ? "present" : v.status === "draft" ? "late" : "off";
    const statusLabel = v.status === "active" ? t("gs7.status.active") : v.status === "draft" ? t("gs7.status.draft") : t("gs7.status.superseded");
    const pins = CFG_PINS[v.v] || [];
    return (
      <div style={{ borderBottom: "1px dashed " + c.border, padding: "14px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ flex: "0 0 22%" }}><Value mono>{v.v}</Value></div>
          <div style={{ flex: "0 0 26%" }}><Value muted>{v.fromISO}</Value></div>
          <div style={{ flex: "0 0 22%" }}><StatusChip tone={statusTone} icon={v.status === "active" ? "check" : v.status === "draft" ? "clock" : "arrow"} label={statusLabel} /></div>
          <div style={{ flex: 1, textAlign: "right" }}>
            <ActionMenu ariaLabel={v.v} items={items} />
          </div>
        </div>
        {mode === "view" ? <div style={{ marginTop: 10 }}><RuleSet cfg={v} /><Callout compact tone="off" icon="lock" body={t("gs7.immutable.note")} /></div> : null}
        {mode === "compare" && prev ? <VersionDiff a={prev} b={v} /> : null}
        {mode === "pinning" ? (
          <div style={{ background: c.sunken, border: "1px solid " + c.border, borderRadius: G3.r.lg, padding: 14, marginTop: 10 }}>
            <div style={ty("h3", { color: c.ink, margin: "0 0 8px" })}>{t("gs7.pinning.title", { v: v.v })}</div>
            {pins.length ? pins.map((p) => (
              <div key={p.run} style={ty("small", { color: c.ink, padding: "5px 0" })}>{t("gs7.pinning.row", { run: p.run, period: p.period, who: "Rajiv Menon" })}</div>
            )) : <Value muted>{t("gs7.pinning.empty")}</Value>}
          </div>
        ) : null}
        {mode === "editDraft" ? (
          <EditDraftRulesForm v={v} onCancel={() => setMode(null)} onDone={() => { setMode(null); onAction(t("gs7.edit.done", { v: v.v })); }} />
        ) : null}
        {mode === "activate" ? (
          <ActivateVersionForm v={v} onCancel={() => setMode(null)} onDone={() => { setMode(null); onAction(t("gs7.activate.done", { v: v.v })); }} />
        ) : null}
      </div>
    );
  }

  function StatutoryConfigCard({ onAction }) {
    const { t } = useLang();
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <Card icon="filing" iconTone="brass" title={t("gs7.card.title")} sub={t("gs7.card.sub")} action={<Button kind="secondary" size="sm" iconLeft="filing">{t("gs7.add")}</Button>}>
        <div style={{ display: "flex", gap: 14, padding: "0 0 8px", borderBottom: "2px solid " + c.ruleStrong }}>
          <div style={ty("colLabel", { flex: "0 0 22%", color: c.inkFaint, textTransform: "uppercase" })}>{t("gs7.col.version")}</div>
          <div style={ty("colLabel", { flex: "0 0 26%", color: c.inkFaint, textTransform: "uppercase" })}>{t("gs7.col.from")}</div>
          <div style={ty("colLabel", { flex: "0 0 22%", color: c.inkFaint, textTransform: "uppercase" })}>{t("gs7.col.status")}</div>
          <div style={{ flex: 1 }} />
        </div>
        {CFG_VERSIONS.map((v, i) => <VersionCard key={v.v} v={v} prev={i > 0 ? CFG_VERSIONS[i - 1] : null} onAction={onAction} />)}
      </Card>
    );
  }

  function TabPolicy() {
    const [flash, setFlash] = useState(null);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: G3.layout.gap }}>
        <Flash text={flash} />
        <RolesCard onAction={(msg) => msg && setFlash(msg)} />
        <StatutoryConfigCard onAction={(msg) => msg && setFlash(msg)} />
      </div>
    );
  }

  /* ============================================================
     TAB 3 · GA-06 Academic year & terms

     Terms below are the EXACT windows leave.jsx already renders as
     blackouts/vacations (WINDOWS) and hr-leaveatt.jsx's own note that
     "terms come from the academic year (M7). Change the dates there,
     not here." — this screen IS "there".
     ============================================================ */
  addStrings({
    en: {
      "gs6.card.title": "Academic year & terms",
      "gs6.card.sub": "What the session is shaped like \u2014 teaching, vacation and exam terms. Holidays are set above, leave in Leave policy.",
      "gs6.add.ay": "Create an academic year",
      "gs6.rollover": "Roll over to next year",
      "gs6.ay.current": "AY {label} · current",
      "gs6.ay.past": "AY {label} · past, read-only",
      "gs6.ay.range": "{from} – {to}",
      "gs6.ay.setCurrent": "Set as current",
      "gs6.ay.setCurrent.past": "This academic year has ended — it can no longer be made current",
      "gs6.col.term": "Term",
      "gs6.col.type": "Type",
      "gs6.col.dates": "Dates",
      "gs6.col.consequence": "Consequence",
      "gs6.type.teaching": "Teaching",
      "gs6.type.exam": "Exam",
      "gs6.type.vacation": "Teaching",
      "gs6.cons.teaching": "No special effect on leave",
      "gs6.cons.exam": "Leave applications are blocked in this window (M8)",
      "gs6.cons.vacation": "School is closed — vacation-staff leave does not apply here",
      "gs6.menu.editDates": "Edit this term's dates",
      "gs6.menu.setBlackout": "Set which leave types this blocks",
      "gs6.term.t1": "Term 1", "gs6.term.t2": "Term 2",
      "gs6.term.exam1": "Term-1 examinations", "gs6.term.autumn": "Autumn break",
      "gs6.term.winter": "Winter vacation", "gs6.term.admis": "Admissions week", "gs6.term.result": "Result week",

      "gs6.editDates.title": "Edit dates — {term}",
      "gs6.editDates.from.label": "From", "gs6.editDates.to.label": "To",
      "gs6.editDates.warn": "{n} approved leave requests fall inside {dates}. Changing these re-validates every one against the new window.",
      "gs6.editDates.reason.label": "Reason",
      "gs6.editDates.done": "Submitted for {term} — recorded in the audit log once confirmed.",

      "gs6.addTerm.title": "Add a term",
      "gs6.addTerm.name.label": "Name",
      "gs6.addTerm.type.label": "Type — no default",
      "gs6.addTerm.type.hint.teaching": "No special effect on leave.",
      "gs6.addTerm.type.hint.exam": "Leave applications will be blocked inside this window (M8 §Business rules).",
      "gs6.addTerm.type.hint.vacation": "This marks the school closed — the vacation-staff leave distinction applies here, not ordinary leave.",
      "gs6.addTerm.from.label": "From", "gs6.addTerm.to.label": "To",
      "gs6.addTerm.overlap": "This overlaps {term} — terms in one academic year cannot overlap.",
      "gs6.addTerm.cta": "Add term",
      "gs6.addTerm.done": "{name} added to AY 2026–27 — recorded in the audit log.",

      "gs6.rollover.title": "Roll over to next year",
      "gs6.rollover.body": "Copies every term from AY 2026\u201327 forward a year into a draft AY 2027\u201328. Set as current stays a separate step.",
      "gs6.rollover.cta": "Create draft AY 2027–28",
      "gs6.rollover.done": "Draft AY 2027–28 created with 5 terms copied from 2026–27 — recorded in the audit log.",

      "gs6.next.empty.head": "AY 2027–28 does not exist yet",
      "gs6.next.empty.body": "The year opens on 1 April 2027. Nothing downstream \u2014 leave policy, balances, appraisal cycles \u2014 can be prepared before it exists.",
    },
  });

  const AY_CURRENT = { label: "2026–27", fromISO: "2026-04-01", toISO: "2027-03-31" };
  const TERMS = [
    { key: "t1", nameKey: "gs6.term.t1", type: "teaching", from: "2026-04-01", to: "2026-09-30" },
    { key: "exam1", nameKey: "gs6.term.exam1", type: "exam", from: "2026-09-14", to: "2026-09-19", approvedInWindow: 2 },
    { key: "autumn", nameKey: "gs6.term.autumn", type: "vacation", from: "2026-10-12", to: "2026-10-21" },
    { key: "t2", nameKey: "gs6.term.t2", type: "teaching", from: "2026-10-22", to: "2027-03-31" },
    { key: "winter", nameKey: "gs6.term.winter", type: "vacation", from: "2026-12-24", to: "2027-01-03" },
    { key: "admis", nameKey: "gs6.term.admis", type: "exam", from: "2027-01-05", to: "2027-01-10" },
    { key: "result", nameKey: "gs6.term.result", type: "exam", from: "2027-03-26", to: "2027-03-31" },
  ];

  function EditTermDatesForm({ term, onCancel, onDone }) {
    const { t } = useLang();
    const { c } = useTheme();
    const { ty } = useLang();
    const [from, setFrom] = useState(term.from);
    const [to, setTo] = useState(term.to);
    const [reason, setReason] = useState("");
    return (
      <InlineConfirm onConfirm={onDone} onCancel={onCancel} confirmLabel={t("gs.cta.confirm")} cancelLabel={t("gs.cta.cancel")} confirmDisabled={!reason.trim()}>
        <div style={ty("h3", { color: c.ink, margin: "0 0 10px" })}>{t("gs6.editDates.title", { term: t(term.nameKey) })}</div>
        <div style={{ display: "flex", gap: 12 }}>
          <Field id="gs6-from" label={t("gs6.editDates.from.label")}><Input id="gs6-from" value={from} onChange={setFrom} /></Field>
          <Field id="gs6-to" label={t("gs6.editDates.to.label")}><Input id="gs6-to" value={to} onChange={setTo} /></Field>
        </div>
        <Field id="gs6-reason" label={t("gs6.editDates.reason.label")}>
          <Input id="gs6-reason" value={reason} onChange={setReason} placeholder={t("gs.reason.placeholder")} />
        </Field>
        {term.approvedInWindow ? (
          <Callout compact tone="late" icon="alert" body={t("gs6.editDates.warn", { n: term.approvedInWindow, dates: term.from + " – " + term.to })} />
        ) : null}
      </InlineConfirm>
    );
  }

  function TermRow({ term, onAction, last }) {
    const { t } = useLang();
    const { c } = useTheme();
    const [editing, setEditing] = useState(false);
    const tone = term.type === "exam" ? "danger" : term.type === "vacation" ? "off" : "present";
    const items = [
      { key: "edit", icon: "document", label: t("gs6.menu.editDates"), onSelect: () => setEditing(true) },
      term.type === "exam" ? { key: "bo", icon: "leave", label: t("gs6.menu.setBlackout"), onSelect: () => onAction(null) } : null,
    ].filter(Boolean);
    return (
      <div style={{ borderBottom: last ? "none" : "1px dashed " + c.border, padding: "12px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ flex: "0 0 22%", minWidth: 0 }}><Value>{t(term.nameKey)}</Value></div>
          <div style={{ flex: "0 0 16%" }}><StatusChip tone={tone} icon={term.type === "exam" ? "alert" : term.type === "vacation" ? "leave" : "check"} label={t("gs6.type." + term.type)} /></div>
          <div style={{ flex: "0 0 24%" }}><Value muted mono>{term.from} – {term.to}</Value></div>
          <div style={{ flex: 1, minWidth: 0 }}><Value muted>{t("gs6.cons." + term.type)}</Value></div>
          <div style={{ flexShrink: 0 }}><ActionMenu ariaLabel={t(term.nameKey)} items={items} /></div>
        </div>
        {editing ? <EditTermDatesForm term={term} onCancel={() => setEditing(false)} onDone={() => { setEditing(false); onAction(t("gs6.editDates.done", { term: t(term.nameKey) })); }} /> : null}
      </div>
    );
  }

  function AddTermForm({ onCancel, onDone }) {
    const { t } = useLang();
    const { c } = useTheme();
    const { ty } = useLang();
    const [name, setName] = useState("");
    const [type, setType] = useState("");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const typeOptions = [
      { value: "", label: t("gs6.addTerm.type.label") },
      { value: "teaching", label: t("gs6.type.teaching") },
      { value: "exam", label: t("gs6.type.exam") },
      { value: "vacation", label: t("gs6.type.vacation") },
    ];
    const overlapping = from && to ? TERMS.filter((term) => from <= term.to && to >= term.from)[0] : null;
    return (
      <InlineConfirm onConfirm={() => onDone(name || "—")} onCancel={onCancel} confirmLabel={t("gs6.addTerm.cta")} cancelLabel={t("gs.cta.cancel")} confirmDisabled={!name.trim() || !type || !from || !to || !!overlapping}>
        <div style={ty("h3", { color: c.ink, margin: "0 0 10px" })}>{t("gs6.addTerm.title")}</div>
        <Field id="gs6-tname" label={t("gs6.addTerm.name.label")}><Input id="gs6-tname" value={name} onChange={setName} /></Field>
        <Field id="gs6-ttype" label={t("gs6.addTerm.type.label")}><Select id="gs6-ttype" value={type} onChange={setType} options={typeOptions} /></Field>
        {type ? <Callout compact tone={type === "exam" ? "danger" : type === "vacation" ? "off" : "present"} icon={type === "exam" ? "alert" : "leave"} body={t("gs6.addTerm.type.hint." + type)} /> : null}
        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          <Field id="gs6-tfrom" label={t("gs6.addTerm.from.label")}><Input id="gs6-tfrom" value={from} onChange={setFrom} placeholder="2026-11-01" /></Field>
          <Field id="gs6-tto" label={t("gs6.addTerm.to.label")}><Input id="gs6-tto" value={to} onChange={setTo} placeholder="2026-11-05" /></Field>
        </div>
        {overlapping ? <Callout compact tone="danger" icon="alert" body={t("gs6.addTerm.overlap", { term: t(overlapping.nameKey) })} /> : null}
      </InlineConfirm>
    );
  }

  function RolloverForm({ onCancel, onDone }) {
    const { t } = useLang();
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <InlineConfirm onConfirm={onDone} onCancel={onCancel} confirmLabel={t("gs6.rollover.cta")} cancelLabel={t("gs.cta.cancel")}>
        <div style={ty("h3", { color: c.ink, margin: "0 0 8px" })}>{t("gs6.rollover.title")}</div>
        <p style={ty("small", { color: c.ink, margin: 0 })}>{t("gs6.rollover.body")}</p>
      </InlineConfirm>
    );
  }

  function AcademicYearCard({ onAction }) {
    const { t } = useLang();
    const { c } = useTheme();
    const { ty } = useLang();
    const [adding, setAdding] = useState(false);
    const [rollingOver, setRollingOver] = useState(false);
    return (
      <Card
        icon="festival" iconTone="brass" title={t("gs6.card.title")} sub={t("gs6.card.sub")}
        action={<div style={{ display: "flex", gap: 8 }}>
          <Button kind="ghost" size="sm" iconLeft="arrow" onClick={() => setRollingOver((v) => !v)}>{t("gs6.rollover")}</Button>
          <Button kind="secondary" size="sm" iconLeft="festival" onClick={() => setAdding((v) => !v)}>{t("gs6.add.ay")}</Button>
        </div>}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <div>
            <div style={ty("h3", { color: c.ink, margin: 0 })}>{t("gs6.ay.current", { label: AY_CURRENT.label })}</div>
            <div style={ty("caption", { color: c.inkFaint, marginTop: 3 })}>{t("gs6.ay.range", { from: AY_CURRENT.fromISO, to: AY_CURRENT.toISO })}</div>
          </div>
        </div>
        {rollingOver ? (
          <div style={{ marginBottom: 14 }}>
            <RolloverForm onCancel={() => setRollingOver(false)} onDone={() => { setRollingOver(false); onAction(t("gs6.rollover.done")); }} />
          </div>
        ) : null}
        <div style={{ display: "flex", gap: 14, padding: "12px 0 8px", borderBottom: "2px solid " + c.ruleStrong }}>
          <div style={ty("colLabel", { flex: "0 0 22%", color: c.inkFaint, textTransform: "uppercase" })}>{t("gs6.col.term")}</div>
          <div style={ty("colLabel", { flex: "0 0 16%", color: c.inkFaint, textTransform: "uppercase" })}>{t("gs6.col.type")}</div>
          <div style={ty("colLabel", { flex: "0 0 24%", color: c.inkFaint, textTransform: "uppercase" })}>{t("gs6.col.dates")}</div>
          <div style={ty("colLabel", { flex: 1, color: c.inkFaint, textTransform: "uppercase" })}>{t("gs6.col.consequence")}</div>
          <div style={{ flexShrink: 0, width: 28 }} />
        </div>
        {TERMS.map((term, i) => <TermRow key={term.key} term={term} onAction={onAction} last={i === TERMS.length - 1 && !adding} />)}
        {adding ? <AddTermForm onCancel={() => setAdding(false)} onDone={(name) => { setAdding(false); onAction(t("gs6.addTerm.done", { name })); }} /> : null}
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px dashed " + c.border, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14 }}>
          <div style={ty("small", { color: c.inkFaint })}>{t("gs6.ay.past", { label: "2025–26" })}</div>
          <ActionMenu
            ariaLabel={t("gs6.ay.past", { label: "2025–26" })}
            items={[{ key: "setCurrent", icon: "check", label: t("gs6.ay.setCurrent"), disabled: true, reason: t("gs6.ay.setCurrent.past"), onSelect: () => {} }]}
          />
        </div>
        <div style={{ marginTop: 14 }}>
          <EmptyState compact head={t("gs6.next.empty.head")} body={t("gs6.next.empty.body")} />
        </div>
      </Card>
    );
  }

  /* ============================================================
     THE YEAR'S HOLIDAYS.

     Set here, read everywhere. A holiday is the one piece of
     configuration that touches nearly every screen in the product:
     the paid-days grid colours it, the roster skips it, the leave
     blackout respects it, the nightly attendance job does not mark
     anybody absent on it, and every employee sees it on their own
     calendar. There is no second place to declare one.
     ============================================================ */
  const HOL_CAMPUSES = ["indiranagar", "whitefield", "yelahanka", "hyderabad"];
  const HOL_KIND = {
    closed: { role: "present", glyph: "check" },
    restricted: { role: "leave", glyph: "half" },
    campus: { role: "off", glyph: "globe" },
  };

  function holDate(t, iso) {
    const p = iso.split("-");
    return String(Number(p[2])) + " " + t("gs.cal.mon." + p[1]) + " " + p[0];
  }
  function holWeekday(t, iso) {
    const p = iso.split("-").map(Number);
    return t("gs.cal.wd." + new Date(p[0], p[1] - 1, p[2]).getDay());
  }

  function HolidayDialog({ holiday, onClose, onDone, onRemove }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const editing = !!holiday;
    const [name, setName] = useState(editing ? (holiday.nameText || t(holiday.nameKey)) : "");
    const [iso, setIso] = useState(editing ? holiday.iso : "2026-10-31");
    const [kind, setKind] = useState(editing ? holiday.kind : "closed");
    const [campuses, setCampuses] = useState(editing && holiday.campuses ? holiday.campuses : HOL_CAMPUSES.slice());
    const [why, setWhy] = useState("");
    const [err, setErr] = useState({});

    const weekend = (function () {
      const p = iso.split("-").map(Number);
      return new Date(p[0], p[1] - 1, p[2]).getDay() === 0;
    })();

    function submit() {
      const e = {};
      if (name.trim().length < 3) e.name = t("gs.hol.errName");
      if (kind === "campus" && campuses.length === 0) e.campuses = t("gs.hol.errCampus");
      if (kind === "campus" && campuses.length === HOL_CAMPUSES.length) e.campuses = t("gs.hol.errAllCampus");
      if (why.trim().length < 6) e.why = t("gs.hol.errWhy");
      setErr(e);
      if (Object.keys(e).length) return;
      onDone({
        id: editing ? holiday.id : "H-" + Date.now(),
        iso: iso, nameText: name.trim(), nameKey: editing ? holiday.nameKey : null,
        kind: kind, campuses: kind === "campus" ? campuses : null,
      });
    }

    return (
      <Pop title={t(editing ? "gs.hol.editTitle" : "gs.hol.addTitle")} sub={t("gs.hol.sub")} onClose={onClose} width={600}>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 260px", minWidth: 220 }}>
            <Field id="gs-hol-name" label={t("gs.hol.f.name")} error={err.name || null}>
              <Input id="gs-hol-name" value={name} onChange={(v) => { setName(v); setErr((x) => Object.assign({}, x, { name: null })); }} placeholder={t("gs.hol.f.namePh")} invalid={!!err.name} />
            </Field>
          </div>
          <div style={{ width: 200 }}>
            <Field id="gs-hol-date" label={t("gs.hol.f.date")} hint={holWeekday(t, iso)}>
              <Input id="gs-hol-date" type="date" value={iso} onChange={setIso} />
            </Field>
          </div>
        </div>
        {weekend ? <Callout tone="late" icon="alert" body={t("gs.hol.weekendWarn")} compact /> : null}

        <div style={{ marginTop: 6 }}>
          <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 8 })}>{t("gs.hol.f.kind")}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {["closed", "restricted", "campus"].map((k) => (
              <label
                key={k} htmlFor={"gs-hol-k-" + k}
                style={{
                  display: "flex", gap: 11, alignItems: "flex-start", padding: "11px 13px", cursor: "pointer",
                  borderRadius: G3.r.md, border: "1px solid " + (kind === k ? c.action : c.border),
                  background: kind === k ? c.accentSoft : "transparent",
                }}
              >
                <input
                  type="radio" id={"gs-hol-k-" + k} name="gs-hol-kind" checked={kind === k}
                  onChange={() => { setKind(k); setErr({}); }}
                  style={{ marginTop: 3, accentColor: c.action, width: 16, height: 16, flexShrink: 0 }}
                />
                <span style={{ minWidth: 0 }}>
                  <span style={ty("small", { display: "block", color: c.ink, fontWeight: 600 })}>{t("hol.kind." + k)}</span>
                  <span style={ty("caption", { display: "block", color: c.inkMuted, marginTop: 2 })}>
                    {t("hol.kind." + k + ".note", { n: num(window.NaveyaHolidays.restrictedAllowance) })}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </div>

        {kind === "campus" ? (
          <div style={{ marginTop: 14 }}>
            <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 8 })}>{t("gs.hol.f.which")}</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {HOL_CAMPUSES.map((k) => {
                const on = campuses.indexOf(k) !== -1;
                return (
                  <label key={k} htmlFor={"gs-hol-c-" + k}
                    style={{ display: "inline-flex", gap: 8, alignItems: "center", padding: "7px 13px", borderRadius: G3.r.pill, cursor: "pointer",
                      background: on ? c.accentSoft : "transparent", border: "1px solid " + (on ? c.accent : c.borderStrong) }}>
                    <input type="checkbox" id={"gs-hol-c-" + k} checked={on}
                      onChange={(e) => { setCampuses((prev) => (e.target.checked ? prev.concat([k]) : prev.filter((x) => x !== k))); setErr((x) => Object.assign({}, x, { campuses: null })); }}
                      style={{ accentColor: c.action, width: 15, height: 15 }} />
                    <span style={ty("caption", { color: c.ink })}>{t("gs.hol.campus." + k)}</span>
                  </label>
                );
              })}
            </div>
            {err.campuses ? <div role="alert" style={ty("caption", { color: c.dangerText, marginTop: 8 })}>{err.campuses}</div> : null}
          </div>
        ) : null}

        <div style={{ marginTop: 16 }}>
          <Field id="gs-hol-why" label={t("gs.hol.f.why")} hint={t("gs.hol.f.whyHint")} error={err.why || null}>
            <Input id="gs-hol-why" value={why} onChange={(v) => { setWhy(v); setErr((x) => Object.assign({}, x, { why: null })); }} placeholder={t("gs.hol.f.whyPh")} invalid={!!err.why} />
          </Field>
        </div>

        <Consequence lines={[
          t("gs.hol.c.everywhere"),
          kind === "closed" ? t("gs.hol.c.closed") : kind === "restricted" ? t("gs.hol.c.restricted", { n: num(window.NaveyaHolidays.restrictedAllowance) }) : t("gs.hol.c.campus"),
          t("gs.hol.c.past"),
        ]} />
        <div style={{ display: "flex", gap: 10, justifyContent: "space-between", marginTop: 20, paddingTop: 16, borderTop: "1px solid " + c.rule, flexWrap: "wrap" }}>
          <span>
            {editing ? <Button kind="ghost" iconLeft="signout" onClick={() => onRemove(holiday)}>{t("gs.hol.remove")}</Button> : null}
          </span>
          <span style={{ display: "flex", gap: 10 }}>
            <Button kind="ghost" onClick={onClose}>{t("gs.hol.cancel")}</Button>
            <Button kind="primary" onClick={submit}>{t(editing ? "gs.hol.save" : "gs.hol.add")}</Button>
          </span>
        </div>
      </Pop>
    );
  }

  function HolidayCard({ onFlash }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [list, setList] = useState(window.NaveyaHolidays.all);
    const [dlg, setDlg] = useState(null);      /* null | {} | holiday */

    const sorted = list.slice().sort((a, b) => (a.iso < b.iso ? -1 : 1));
    const closed = list.filter((h) => h.kind === "closed").length;
    const restricted = list.filter((h) => h.kind === "restricted").length;
    const campusOnly = list.filter((h) => h.kind === "campus").length;

    const columns = [
      { key: "date", label: t("gs.hol.col.date"), width: 190 },
      { key: "name", label: t("gs.hol.col.name") },
      { key: "kind", label: t("gs.hol.col.kind"), width: 250 },
      { key: "act", label: t("gs.hol.col.act"), align: "right", width: 84, act: true },
    ];
    const rows = sorted.map((h) => {
      const look = HOL_KIND[h.kind];
      return {
        id: h.id, live: true,
        cells: {
          date: (
            <span>
              <span style={{ fontFamily: G3.font.mono, fontSize: 12.5, color: c.ink, display: "block" }}>{holDate(t, h.iso)}</span>
              <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 2 })}>{holWeekday(t, h.iso)}</span>
            </span>
          ),
          name: <span style={ty("small", { color: c.ink, fontWeight: 600 })}>{h.nameText || t(h.nameKey)}</span>,
          kind: (
            <span>
              <StatusMark role={look.role} glyph={look.glyph} word={t("hol.kind." + h.kind)} />
              {h.kind === "campus" && h.campuses ? (
                <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 4 })}>
                  {h.campuses.map((k) => t("gs.hol.campus." + k)).join(", ")}
                </span>
              ) : null}
            </span>
          ),
          act: (
            <span style={{ display: "flex", justifyContent: "flex-end" }}>
              <ActionMenu
                ariaLabel={t("gs.hol.menuAria", { name: h.nameText || t(h.nameKey) })} size={30}
                items={[{ key: "edit", icon: "document", label: t("gs.hol.edit"), onSelect: () => setDlg(h) }]}
              />
            </span>
          ),
        },
      };
    });

    return (
      <Card
        icon="festival" iconTone="brass"
        title={t("gs.hol.title")} sub={t("gs.hol.cardSub")}
        action={<Button kind="primary" size="sm" iconLeft="plus" onClick={() => setDlg({})}>{t("gs.hol.add")}</Button>}
      >
        <div style={{ display: "flex", gap: 28, flexWrap: "wrap", marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid " + c.rule }}>
          {[
            { k: "closed", n: closed },
            { k: "restricted", n: restricted },
            { k: "campus", n: campusOnly },
          ].map((f) => (
            <span key={f.k}>
              <span style={ty("caption", { display: "block", color: c.inkFaint, fontWeight: 700 })}>{t("hol.kind." + f.k)}</span>
              <span style={G3.fig("lg", { color: c.ink, fontWeight: 700 })}>{num(f.n)}</span>
            </span>
          ))}
        </div>

        <Register columns={columns} rows={rows} />

        <p style={ty("caption", { color: c.inkFaint, margin: "16px 0 0", paddingTop: 12, borderTop: "1px solid " + c.rule })}>{t("gs.hol.foot")}</p>

        {dlg ? (
          <HolidayDialog
            holiday={dlg.id ? dlg : null}
            onClose={() => setDlg(null)}
            onRemove={(h) => {
              setList((prev) => prev.filter((x) => x.id !== h.id));
              setDlg(null);
              onFlash(t("gs.hol.removed", { name: h.nameText || t(h.nameKey) }));
            }}
            onDone={(h) => {
              setList((prev) => (prev.some((x) => x.id === h.id) ? prev.map((x) => (x.id === h.id ? h : x)) : prev.concat([h])));
              setDlg(null);
              onFlash(t(dlg.id ? "gs.hol.saved" : "gs.hol.added", { name: h.nameText, date: holDate(t, h.iso) }));
            }}
          />
        ) : null}
      </Card>
    );
  }

  function TabCalendar() {
    const [flash, setFlash] = useState(null);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: G3.layout.gap }}>
        <Flash text={flash} />
        <HolidayCard onFlash={(msg) => setFlash(msg)} />
        <AcademicYearCard onAction={(msg) => msg && setFlash(msg)} />
      </div>
    );
  }

  /* ============================================================
     TAB 4 · GA-09 Group reports — deliberately thin. "The shared
     report-runner component (run · download · schedule [proposed] ·
     save a view [proposed]) at group scope. Not repeated." — the
     campus-scoped version is PR-06/HR-37; this is the same runner,
     widened to the group, not a new design.
     ============================================================ */
  addStrings({
    en: {
      "gs9.card.title": "Group reports",
      "gs9.card.sub": "Cross-campus headcount, cost, attrition and statutory liability. Campus-operational registers stay on PR-06/HR-37.",
      "gs9.col.report": "Report",
      "gs9.col.scope": "Scope",
      "gs9.col.lastRun": "Last run",
      "gs9.report.headcount": "Headcount & cost by campus",
      "gs9.report.liability": "Statutory liability by legal entity",
      "gs9.report.attendance": "Attendance & leave utilisation",
      "gs9.report.compliance": "Compliance status — documents & verifications",
      "gs9.report.attrition": "Attrition, group-wide",
      "gs9.scope.group": "Group · all campuses",
      "gs9.scope.entity": "Per legal entity",
      "gs9.run": "Run",
      "gs9.download": "Download",
      "gs9.schedule": "Schedule",
      "gs9.schedule.reason": "Scheduled delivery is proposed, not yet built (§10.1)",
      "gs9.saveView": "Save this view",
      "gs9.saveView.reason": "Saved views are proposed, not yet built (§10.1)",
      "gs9.lastRun.never": "Never run",
      "gs9.consolidation.title": "Entity consolidation",
      "gs9.consolidation.ok": "Every campus is assigned to a legal entity — nothing is excluded from a consolidated figure.",
      "gs9.export.done": "Report generated · {rows} rows · {scope} · exported at {time} — recorded in the audit log.",
    },
  });

  const GROUP_REPORTS = [
    { key: "headcount", labelKey: "gs9.report.headcount", scope: "group", lastRunISO: "2026-08-01", rows: 4 },
    { key: "liability", labelKey: "gs9.report.liability", scope: "entity", lastRunISO: "2026-08-11", rows: 2 },
    { key: "attendance", labelKey: "gs9.report.attendance", scope: "group", lastRunISO: "2026-08-10", rows: 4 },
    { key: "compliance", labelKey: "gs9.report.compliance", scope: "group", lastRunISO: null, rows: 0 },
    { key: "attrition", labelKey: "gs9.report.attrition", scope: "group", lastRunISO: "2026-07-31", rows: 4 },
  ];

  function ReportRow({ report, onAction, last }) {
    const { t } = useLang();
    const { c } = useTheme();
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderBottom: last ? "none" : "1px dashed " + c.border }}>
        <div style={{ flex: "0 0 34%", minWidth: 0 }}><Value>{t(report.labelKey)}</Value></div>
        <div style={{ flex: "0 0 22%" }}><Value muted>{t(report.scope === "group" ? "gs9.scope.group" : "gs9.scope.entity")}</Value></div>
        <div style={{ flex: "0 0 18%" }}>{report.lastRunISO ? <Value mono muted>{report.lastRunISO}</Value> : <Value muted>{t("gs9.lastRun.never")}</Value>}</div>
        <div style={{ flex: 1, display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <Button kind="secondary" size="sm" iconLeft="filing" onClick={() => onAction(t("gs9.export.done", { rows: report.rows || num(120 + report.rows * 40), scope: t(report.scope === "group" ? "gs9.scope.group" : "gs9.scope.entity"), time: "17:12" }))}>{t("gs9.run")}</Button>
          <Button kind="ghost" size="sm" iconLeft="download" disabled={!report.lastRunISO}>{t("gs9.download")}</Button>
        </div>
      </div>
    );
  }

  function GroupReportsCard({ onAction }) {
    const { t } = useLang();
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <Card icon="filing" iconTone="accent" title={t("gs9.card.title")} sub={t("gs9.card.sub")}>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <ActionMenu ariaLabel={t("gs9.schedule")} glyph="clock" items={[{ key: "s", icon: "clock", label: t("gs9.schedule"), disabled: true, reason: t("gs9.schedule.reason"), onSelect: () => {} }]} />
          <ActionMenu ariaLabel={t("gs9.saveView")} glyph="list" items={[{ key: "v", icon: "list", label: t("gs9.saveView"), disabled: true, reason: t("gs9.saveView.reason"), onSelect: () => {} }]} />
        </div>
        <div style={{ display: "flex", gap: 14, padding: "0 0 8px", borderBottom: "2px solid " + c.ruleStrong }}>
          <div style={ty("colLabel", { flex: "0 0 34%", color: c.inkFaint, textTransform: "uppercase" })}>{t("gs9.col.report")}</div>
          <div style={ty("colLabel", { flex: "0 0 22%", color: c.inkFaint, textTransform: "uppercase" })}>{t("gs9.col.scope")}</div>
          <div style={ty("colLabel", { flex: "0 0 18%", color: c.inkFaint, textTransform: "uppercase" })}>{t("gs9.col.lastRun")}</div>
          <div style={{ flex: 1 }} />
        </div>
        {GROUP_REPORTS.map((r, i) => <ReportRow key={r.key} report={r} onAction={onAction} last={i === GROUP_REPORTS.length - 1} />)}
        <div style={{ marginTop: 14 }}>
          <Callout compact tone="present" icon="check" title={t("gs9.consolidation.title")} body={t("gs9.consolidation.ok")} />
        </div>
      </Card>
    );
  }

  function TabReports() {
    const [flash, setFlash] = useState(null);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: G3.layout.gap }}>
        <Flash text={flash} />
        <GroupReportsCard onAction={(msg) => msg && setFlash(msg)} />
      </div>
    );
  }

  /* ============================================================
     TAB 5 · GA-10 Integrations & webhooks + GA-11 Devices &
     ingestion health

     GA-11's world is inherited, not invented: incident INC-0114
     (hr-leaveatt.jsx OUTAGE — Main gate reader, Indiranagar, down
     06:00-13:20 on 7 Aug, still open in HR's exception queue) and
     the LIVE outage principal.jsx's banner already names (East gate
     scanner, Primary block, silent since 07:40 today). Neither is
     re-invented here — both are read the same way from this one
     device register.
     ============================================================ */
  addStrings({
    en: {
      /* ---- GA-10 ---- */
      "gs10.card.title": "Integrations & webhooks",
      "gs10.card.sub": "How Naveya reaches the outside world: what messages staff, what other systems are told, and what the readers use to get in.",
      "gs10.providers.title": "Message providers",
      "gs10.provider.email": "Email",
      "gs10.provider.sms": "SMS",
      "gs10.provider.push": "Push (in-app)",
      "gs10.provider.configured": "Configured",
      "gs10.provider.notConfigured": "Not configured",
      "gs10.provider.builtin": "Built in — no provider to configure",
      "gs10.configure": "Configure a provider",
      "gs10.sendTest": "Send a test",
      "gs10.sendTest.disabled": "No provider configured for this channel yet",
      "gs10.sendTest.done": "Test delivered to your own number/address — recorded in the audit log.",
      "gs10.configure.title": "Configure a provider — SMS",
      "gs10.configure.provider.label": "Provider",
      "gs10.configure.creds.label": "Credentials",
      "gs10.configure.creds.hint": "Write-only — never displayed again after saving.",
      "gs10.configure.sender.label": "Sender ID",
      "gs10.configure.testRecipient.label": "Test recipient",
      "gs10.configure.done": "SMS provider configured — recorded in the audit log. HR's template screen (HR-34) can send on this channel now.",

      "gs10.webhooks.title": "Webhook endpoints",
      "gs10.add.webhook": "Add a webhook endpoint",
      "gs10.col.url": "Endpoint",
      "gs10.col.events": "Events",
      "gs10.col.health": "Delivery health",
      "gs10.health.ok": "Delivering",
      "gs10.health.failing": "Failing — retrying with backoff",
      "gs10.menu.rotate": "Rotate secret",
      "gs10.menu.replay": "Replay the failed delivery",
      "gs10.menu.disable": "Disable endpoint",
      "gs10.rotate.done": "New secret generated — shown once below. Recorded in the audit log.",
      "gs10.rotate.secretOnce": "whsec_8f2…kept hidden after this screen closes",
      "gs10.replay.done": "Redelivered with the same idempotency key — recorded on the delivery log.",
      "gs10.disable.confirm": "Disable {url}? Deliveries stop immediately — they are not queued indefinitely.",
      "gs10.event.employeeCreated": "Somebody joins the register", "gs10.event.payrollApproved": "A payroll run is approved", "gs10.event.offerAccepted": "An offer is accepted",

      "gs10.form.url.label": "URL (HTTPS only)",
      "gs10.form.events.label": "Events",
      "gs10.form.error.https": "Must be an HTTPS URL — plain HTTP is blocked.",
      "gs10.form.cta": "Add endpoint",
      "gs10.form.done": "Endpoint added — secret shown once: {secret}. Signed deliveries begin now.",

      "gs10.tokens.title": "Service tokens for ingestion",
      "gs10.tokens.sub": "What the biometric middleware uses to hand attendance to Naveya. A token can write attendance and nothing else.",
      "gs10.tokens.issue": "Issue a service token",
      "gs10.tokens.col.label": "Label",
      "gs10.tokens.col.scope": "Scope",
      "gs10.tokens.col.expiry": "Expires",
      "gs10.tokens.expiry.default": "1 year (default)",
      "gs10.tokens.issue.done": "Token issued — shown once: {token}. Used by device middleware; it cannot be viewed again.",
      "gs10.tokens.revoke": "Revoke",
      "gs10.tokens.revoke.confirm": "Revoke this token? Any device still using it stops ingesting immediately — an ingest token writes attendance, which writes pay.",
      "gs10.tokens.scope.attendance": "Attendance ingest",

      /* ---- GA-11 ---- */
      "gs11.card.title": "Devices & ingestion health",
      "gs11.campus.indiranagar": "Indiranagar",
      "gs11.campus.whitefield": "Whitefield",
      "gs11.campus.yelahanka": "Yelahanka",
      "gs11.campus.hyderabad": "Hyderabad",
      "gs11.col.state": "How it is doing",
      "gs11.col.what": "What happened",
      "gs11.col.records": "Records",
      "gs11.menuAria": "Actions on {device}",
      "gs11.logMenuAria": "Actions on this entry",
      "gs11.menu.open": "Open this reader",
      "gs11.menu.clock": "Correct its clock",
      "gs11.menu.map2": "Map it to a campus",
      "gs11.menu.stop": "Stop accepting its punches",
      "gs11.menu.match": "Match it to a person",
      "gs11.menu.incident": "Open the incident",
      "gs11.menu.explain": "What happened here",
      "gs11.menu.outage.healthy": "This reader is sending normally — there is no outage to raise",
      "gs11.f.serial": "Serial",
      "gs11.f.mode": "How it sends",
      "gs11.f.state": "How it is doing",
      "gs11.pop.sub": "{campus} · {family}",
      "gs11.modeNote.push": "The reader sends each punch as it happens. Nothing has to ask it.",
      "gs11.modeNote.pull": "Naveya asks the reader for what it has, on a schedule. It can also be asked now.",
      "gs11.means.healthy": "Punches are arriving. Nothing to do.",
      "gs11.means.silent": "It has sent nothing since this morning. {n} people show no punch today, and unless an outage is raised the day reads as absence.",
      "gs11.means.drift": "Its clock is {min} minutes behind. Anybody who punched within {min} minutes of a shift boundary may have read as late.",
      "gs11.means.unmapped": "It is registered but belongs to no campus, so its punches are held and counted for nobody.",
      "gs11.status.drift": "Clock {n} minutes behind",
      "gs11.pull.title": "Ask this reader for its punches now",
      "gs11.pull.sub": "{device}",
      "gs11.pull.since": "Everything since {time} will be fetched.",
      "gs11.pull.willFail": "This reader has answered nothing since {time}. The request will almost certainly time out.",
      "gs11.pull.c1": "Punches already recorded are not recorded twice.",
      "gs11.pull.c2": "Attendance for any day this touches is worked out again.",
      "gs11.pull.c3": "If it does not answer, nothing changes and you will be told.",
      "gs11.pull.cta": "Fetch now",
      "gs11.outage.title": "Raise an attendance outage",
      "gs11.outage.sub": "{campus}, since {time} today",
      "gs11.outage.body": "{n} people have no punch today because the reader stopped sending, not because they were away.",
      "gs11.outage.c1": "Those {n} days stop counting as absence until the outage is closed.",
      "gs11.outage.c2": "HR and the principal see the same outage on their attendance screens and fix the days from there.",
      "gs11.outage.c3": "Paid days do not move while an outage is open.",
      "gs11.outage.cta": "Raise it",
      "gs11.clock.title": "Correct this reader’s clock",
      "gs11.clock.sub": "{device} · running {n} minutes behind",
      "gs11.clock.body": "A reader {n} minutes behind decides who was late. Somebody who arrived on time can be recorded as late, and the other way about.",
      "gs11.clock.c1": "From now on its punches carry the right time.",
      "gs11.clock.c2": "Punches already recorded are NOT re-read. A day already decided stays decided.",
      "gs11.clock.c3": "Any day that needs putting right is fixed in Attendance, one day at a time, by HR.",
      "gs11.clock.cta": "Correct it",
      "gs11.clock.done": "{device} is back in step. Days already recorded were not changed.",
      "gs11.map2.title": "Map this reader to a campus",
      "gs11.map2.sub": "{device} · {serial}",
      "gs11.map2.body": "Registered but unmapped. Everything it has sent so far is held and counted for nobody.",
      "gs11.map2.label": "Which campus is it at?",
      "gs11.map2.pick": "Choose a campus",
      "gs11.map2.c1": "Everything it has held is read in and attendance is worked out again for those days.",
      "gs11.map2.c2": "From now on its punches belong to that campus’s register.",
      "gs11.map2.cta": "Map it",
      "gs11.map2.done": "{device} is mapped to {campus}. Its held punches have been read in.",
      "gs11.stop.title": "Stop accepting punches from this reader",
      "gs11.stop.sub": "{device} · {campus}",
      "gs11.stop.onlyOne": "The only reader at {campus}. Stopping it leaves that campus with no automatic attendance at all.",
      "gs11.stop.reason": "Why are you stopping it?",
      "gs11.stop.reasonPh": "Being replaced, tampered with, moved…",
      "gs11.stop.c1": "Nothing it sends is recorded from the moment you confirm.",
      "gs11.stop.c2": "Punches already recorded stay exactly as they are.",
      "gs11.stop.c3": "Your name and your reason go on the audit log, and it can be switched back on.",
      "gs11.stop.cta": "Stop accepting",
      "gs11.stop.done": "{device} is no longer accepted. Nothing already recorded was touched.",
      "gs11.register.sub": "A reader can send nothing until it is registered and mapped.",
      "gs11.register.family.pick": "Choose a make",
      "gs11.register.serial.hint": "Printed on the back of the unit.",
      "gs11.register.c1": "It can send as soon as its service token is in place.",
      "gs11.register.c2": "Nothing it sent before today is read in — registration starts from now.",
      "gs11.what.unknown": "A code nobody owns — {code}",
      "gs11.why.unknown": "The reader sent a staff code that matches no record, so the punches are held rather than guessed at.",
      "gs11.what.gap": "Nothing recorded on {date}",
      "gs11.why.gap": "The reader was down. The punches were never made, so there is nothing to read in — the days have to be fixed.",
      "gs11.what.duplicate": "The same punch, sent more than once",
      "gs11.why.duplicate": "Already handled. The first was kept, the rest ignored, and nobody was counted twice.",
      "gs11.what.outOfRange": "A punch with a time that cannot be right",
      "gs11.why.outOfRange": "Stamped outside any shift this campus runs — usually a clock that was reset while the reader was off.",
      "gs11.log.foot": "Nothing is dropped quietly. Everything the readers sent that could not be used stays here until somebody decides what it was.",
      "gs11.match.title": "Match {code} to a person",
      "gs11.match.sub": "{n} punches held since {date}",
      "gs11.match.suggest": "{name} ({id}) joined on 1 August and has never been matched to a reader code — the likely one.",
      "gs11.match.label": "Whose punches are these?",
      "gs11.match.pick": "Choose a person",
      "gs11.match.c1": "All {n} held punches are read in against that person.",
      "gs11.match.c2": "Attendance is worked out again for every day they cover, and paid days may move.",
      "gs11.match.c3": "The code stays matched, so the reader’s next punch needs no decision.",
      "gs11.match.cta": "Match and read in",
      "gs11.match.done": "Matched to {name}. {n} punches read in, and those days recomputed.",
      "gs11.discard.title": "Discard these records",
      "gs11.discard.sub": "{n} records",
      "gs11.discard.c1": "They are never read in, and no attendance changes.",
      "gs11.discard.c2": "They stay on this log marked discarded, with your reason and your name. Nothing is deleted.",
      "gs11.discard.c3": "If they turn out to belong to somebody, they can be matched later from the log.",
      "gs11.discard.cta": "Discard them",
      "gs11.discard.done": "{n} records discarded, with your reason on the log.",
      "gs11.incident.title": "Outage {id}",
      "gs11.incident.sub": "{date} · {n} people with no punch",
      "gs11.incident.body": "These punches were never made. There is nothing to read in — each day has to be put right on the record, by HR, with a reason.",
      "gs11.incident.who": "Whose days are affected",
      "gs11.incident.more": "and {n} more",
      "gs11.explain.sub": "{n} records · {campus}",
      "gs11.explain.duplicate.title": "The same punch, more than once",
      "gs11.explain.duplicate.body": "A reader that loses its connection re-sends what it already sent. Naveya keeps only the first.",
      "gs11.explain.duplicate.c1": "Nothing is needed from you. Nobody was counted twice.",
      "gs11.explain.duplicate.c2": "If this keeps growing, the reader’s network is the thing to look at, not its records.",
      "gs11.explain.outOfRange.title": "A time that cannot be right",
      "gs11.explain.outOfRange.body": "Stamped outside every shift this campus runs. Almost always a reader whose clock was reset while it was off.",
      "gs11.explain.outOfRange.c1": "Held out of attendance until somebody decides what it was.",
      "gs11.explain.outOfRange.c2": "Correcting the reader’s clock stops more of these; it does not fix the ones already held.",
      "gs11.card.sub": "A reader that has stopped sending looks like a day nobody came in. That is how people end up marked absent for a day they worked.",
      "gs11.register": "Register a device",
      "gs11.col.device": "Device",
      "gs11.col.campus": "Campus",
      "gs11.col.lastSeen": "Last seen",
      "gs11.col.today": "Today's records",
      "gs11.status.healthy": "Healthy",
      "gs11.status.silent": "Silent — no data since {time}",
      "gs11.status.drift": "Clock drift detected",
      "gs11.status.unmapped": "Newly registered — not yet mapped",
      "gs11.family.zkteco": "ZKTeco", "gs11.family.essl": "eSSL", "gs11.family.matrix": "Matrix", "gs11.family.realtime": "Realtime",
      "gs11.mode.push": "Push", "gs11.mode.pull": "Pull",
      "gs11.menu.pull": "Ask it for its punches now",
      "gs11.pull.pushOnly": "this reader sends on its own — there is nothing to ask it for",
      "gs11.menu.outage": "Raise an attendance outage",
      "gs11.menu.outage.already": "Already raised at {time} today",
      "gs11.menu.deactivate": "Deactivate device",
      "gs11.pull.unreachable": "Device unreachable — last seen {time}",
      "gs11.pull.done": "Records ingested idempotently for {range} — duplicates ignored.",
      "gs11.outage.done": "Outage raised for {campus}, since {time} \u2014 flagged across DH-03, PR-02 and HR-30 so absences are not misread.",
      "gs11.deactivate.confirm": "Deactivate {device}? It stops accepting pushes immediately.",

      "gs11.gap.title": "East gate scanner, Primary block — Indiranagar",
      "gs11.gap.body": "Silent since 07:40 today. {n} people have no punch, held out of every absence count until an outage is raised or the reader returns.",

      "gs11.log.title": "Ingestion log",
      "gs11.log.sub": "Everything the readers sent that could not be used, and what each one is waiting on.",
      "gs11.col.reason": "Reason",
      "gs11.reason.unknown": "Unknown employee code — {code} does not map to any staff record",
      "gs11.reason.gap": "No punch recorded — device outage {id}, {date}",
      "gs11.reason.duplicate": "Duplicate punch — ignored automatically (idempotent)",
      "gs11.reason.outOfRange": "Timestamp out of range for the device's clock",
      "gs11.menu.map": "Map to an employee",
      "gs11.menu.discard": "Discard with a reason",
      "gs11.menu.viewInHr": "Open in HR's attendance exceptions (HR-30)",
      "gs11.map.title": "Map device code {code} to an employee",
      "gs11.map.suggest": "{name} ({id}) joined 1 Aug 2026 and has not been mapped to any device code yet — the likely match.",
      "gs11.map.cta": "Map and ingest",
      "gs11.map.done": "Mapped to {name} — the record is ingested and attendance recomputes for that day.",
      "gs11.discard.reason.label": "Reason for discarding",
      "gs11.discard.done": "Discarded, with the reason recorded — never silently dropped.",
      "gs11.incident.linked": "Part of incident {id} — {n} records, still open in HR's attendance exceptions (HR-30) as of today.",

      "gs11.register.title": "Register a device",
      "gs11.register.family.label": "Family — no default",
      "gs11.register.serial.label": "Serial number",
      "gs11.register.campus.label": "Campus + gate label",
      "gs11.register.mode.label": "Mode",
      "gs11.register.cta": "Register",
      "gs11.register.done": "{device} registered at {campus} — it may now ingest via its service token.",
      "gs11.register.duplicate": "This serial is already registered on another device.",
    },
  });

  const PROVIDERS = { email: true, sms: false };
  const WEBHOOKS = [
    { id: "wh1", url: "https://accounts.sunriseeducation.org/hooks/naveya", events: ["payrollApproved"], health: "ok" },
    { id: "wh2", url: "https://portal.sunrisefoundation.org/webhooks/staff", events: ["employeeCreated", "offerAccepted"], health: "failing" },
  ];
  const SERVICE_TOKENS = [
    { id: "tok1", label: "Indiranagar biometric middleware", scope: "attendance", expiryISO: "2027-08-11" },
    { id: "tok2", label: "Whitefield + Hyderabad biometric middleware", scope: "attendance", expiryISO: "2027-03-01" },
  ];

  const DEVICES = [
    { id: "dev1", nameEn: "Main gate reader", campusKey: "indiranagar", family: "essl", mode: "push", serial: "SN-41207", lastSeen: "11 Aug 08:12", todayCount: 206, status: "healthy", onlyOne: false },
    { id: "dev2", nameEn: "East gate scanner, Primary block", campusKey: "indiranagar", family: "zkteco", mode: "push", serial: "SN-88213", lastSeen: "11 Aug 07:40", todayCount: 4, status: "silent", silentSince: "07:40", affected: 17, outageRaised: true, onlyOne: false },
    { id: "dev3", nameEn: "Main gate reader", campusKey: "whitefield", family: "essl", mode: "push", serial: "SN-41311", lastSeen: "11 Aug 08:20", todayCount: 149, status: "healthy", onlyOne: true },
    { id: "dev4", nameEn: "Main gate reader", campusKey: "hyderabad", family: "matrix", mode: "pull", serial: "SN-50944", lastSeen: "11 Aug 08:05", todayCount: 118, status: "drift", driftMin: 4, onlyOne: true },
    { id: "dev5", nameEn: "Pre-primary gate", campusKey: "yelahanka", family: "realtime", mode: "push", serial: "SN-63001", lastSeen: "9 Aug 16:40", todayCount: 0, status: "unmapped", onlyOne: true },
  ];

  const INGESTION_LOG = [
    { id: "ing1", kind: "unknown", code: "EMP-9931", campusKey: "indiranagar", n: 6, sinceISO: "2026-08-01" },
    { id: "ing2", kind: "gap", incidentId: "INC-0114", dateISO: "7 August", n: 11, campusKey: "indiranagar" },
    { id: "ing3", kind: "duplicate", campusKey: "whitefield", n: 23 },
    { id: "ing4", kind: "outOfRange", campusKey: "hyderabad", n: 2 },
  ];

  /* who the held punches belong to — an incident is a list of people,
     not a number, and the person reading it has to be able to say whose
     day is wrong */
  const INCIDENT_PEOPLE = [
    { code: "NAV-0142", name: "Ananya Rao" }, { code: "NAV-0088", name: "Meenakshi Pillai" },
    { code: "NAV-0410", name: "Kavya Nair" }, { code: "NAV-0512", name: "Manjunath Gowda" },
    { code: "NAV-0104", name: "Meera Nair" },
  ];

  function deviceLabel(d) { return d.nameEn + ", " + { indiranagar: "Indiranagar", whitefield: "Whitefield", yelahanka: "Yelahanka", hyderabad: "Hyderabad" }[d.campusKey]; }

  /* ---- GA-10 components ---- */
  function ConfigureProviderForm({ onCancel, onDone }) {
    const { t } = useLang();
    const { c } = useTheme();
    const { ty } = useLang();
    const [provider, setProvider] = useState("msg91");
    const [creds, setCreds] = useState("");
    const [sender, setSender] = useState("");
    return (
      <InlineConfirm onConfirm={onDone} onCancel={onCancel} confirmLabel={t("gs.cta.save")} cancelLabel={t("gs.cta.cancel")} confirmDisabled={!creds.trim() || !sender.trim()}>
        <div style={ty("h3", { color: c.ink, margin: "0 0 10px" })}>{t("gs10.configure.title")}</div>
        <Field id="gs10-provider" label={t("gs10.configure.provider.label")}>
          <Select id="gs10-provider" value={provider} onChange={setProvider} options={[{ value: "msg91", label: "MSG91" }, { value: "gupshup", label: "Gupshup" }]} />
        </Field>
        <Field id="gs10-creds" label={t("gs10.configure.creds.label")} hint={t("gs10.configure.creds.hint")}>
          <Input id="gs10-creds" type="password" value={creds} onChange={setCreds} />
        </Field>
        <Field id="gs10-sender" label={t("gs10.configure.sender.label")}>
          <Input id="gs10-sender" value={sender} onChange={setSender} placeholder="SUNRIS" />
        </Field>
        <Field id="gs10-testrec" label={t("gs10.configure.testRecipient.label")}>
          <Input id="gs10-testrec" value="you@sunriseeducation.org" readOnly />
        </Field>
      </InlineConfirm>
    );
  }

  function ProvidersCard({ onAction }) {
    const { t } = useLang();
    const { c } = useTheme();
    const { ty } = useLang();
    const [configuring, setConfiguring] = useState(false);
    const rows = [
      { key: "email", labelKey: "gs10.provider.email", on: PROVIDERS.email, builtin: false },
      { key: "sms", labelKey: "gs10.provider.sms", on: PROVIDERS.sms, builtin: false },
      { key: "push", labelKey: "gs10.provider.push", on: true, builtin: true },
    ];
    return (
      <div>
        <div style={ty("h3", { color: c.ink, margin: "0 0 10px" })}>{t("gs10.providers.title")}</div>
        {rows.map((r, i) => (
          <div key={r.key} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 0", borderBottom: i < rows.length - 1 ? "1px dashed " + c.border : "none" }}>
            <div style={{ flex: "0 0 22%" }}><Value>{t(r.labelKey)}</Value></div>
            <div style={{ flex: "0 0 24%" }}>
              {r.builtin ? <StatusChip tone="ltEL" icon="check" label={t("gs10.provider.builtin")} />
                : r.on ? <StatusChip tone="present" icon="check" label={t("gs10.provider.configured")} />
                : <StatusChip tone="late" icon="alert" label={t("gs10.provider.notConfigured")} />}
            </div>
            <div style={{ flex: 1, display: "flex", gap: 8, justifyContent: "flex-end" }}>
              {!r.builtin && !r.on ? <Button kind="primary" size="sm" onClick={() => setConfiguring(r.key)}>{t("gs10.configure")}</Button> : null}
              <ActionMenu
                ariaLabel={t("gs10.sendTest")}
                items={[{ key: "test", icon: "mail", label: t("gs10.sendTest"), disabled: !r.on, reason: !r.on ? t("gs10.sendTest.disabled") : null, onSelect: () => onAction(t("gs10.sendTest.done")) }]}
              />
            </div>
          </div>
        ))}
        {configuring === "sms" ? <ConfigureProviderForm onCancel={() => setConfiguring(false)} onDone={() => { setConfiguring(false); onAction(t("gs10.configure.done")); }} /> : null}
      </div>
    );
  }

  function AddWebhookForm({ onCancel, onDone }) {
    const { t } = useLang();
    const { c } = useTheme();
    const { ty } = useLang();
    const [url, setUrl] = useState("");
    const [events, setEvents] = useState({ employeeCreated: false, payrollApproved: false, offerAccepted: false });
    const invalid = url.trim().length > 0 && url.indexOf("https://") !== 0;
    const anyEvent = Object.keys(events).some((k) => events[k]);
    return (
      <InlineConfirm onConfirm={() => onDone("whsec_new" + Math.floor(Math.random() * 900 + 100))} onCancel={onCancel} confirmLabel={t("gs10.form.cta")} cancelLabel={t("gs.cta.cancel")} confirmDisabled={!url.trim() || invalid || !anyEvent}>
        <div style={ty("h3", { color: c.ink, margin: "0 0 10px" })}>{t("gs10.add.webhook")}</div>
        <Field id="gs10-url" label={t("gs10.form.url.label")} error={invalid ? t("gs10.form.error.https") : null}>
          <Input id="gs10-url" value={url} onChange={setUrl} placeholder="https://" />
        </Field>
        <Field id="gs10-events" label={t("gs10.form.events.label")}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {["employeeCreated", "payrollApproved", "offerAccepted"].map((k) => (
              <label key={k} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <RowCheck checked={events[k]} onChange={(v) => setEvents((prev) => Object.assign({}, prev, { [k]: v }))} ariaLabel={t("gs10.event." + k)} />
                <span style={{ fontFamily: G3.font.mono, fontSize: 12.5, color: c.ink }}>{t("gs10.event." + k)}</span>
              </label>
            ))}
          </div>
        </Field>
      </InlineConfirm>
    );
  }

  function WebhooksCard({ onAction }) {
    const { t } = useLang();
    const { c } = useTheme();
    const { ty } = useLang();
    const [adding, setAdding] = useState(false);
    return (
      <div style={{ marginTop: 22, paddingTop: 18, borderTop: "1px dashed " + c.border }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={ty("h3", { color: c.ink, margin: 0 })}>{t("gs10.webhooks.title")}</div>
          <Button kind="primary" size="sm" iconLeft="globe" onClick={() => setAdding((v) => !v)}>{t("gs10.add.webhook")}</Button>
        </div>
        {adding ? <AddWebhookForm onCancel={() => setAdding(false)} onDone={(secret) => { setAdding(false); onAction(t("gs10.form.done", { secret })); }} /> : null}
        <div style={{ display: "flex", gap: 14, padding: "0 0 8px", borderBottom: "2px solid " + c.ruleStrong, marginTop: adding ? 14 : 0 }}>
          <div style={ty("colLabel", { flex: "0 0 38%", color: c.inkFaint, textTransform: "uppercase" })}>{t("gs10.col.url")}</div>
          <div style={ty("colLabel", { flex: "0 0 26%", color: c.inkFaint, textTransform: "uppercase" })}>{t("gs10.col.events")}</div>
          <div style={ty("colLabel", { flex: "0 0 18%", color: c.inkFaint, textTransform: "uppercase" })}>{t("gs10.col.health")}</div>
          <div style={{ flex: 1 }} />
        </div>
        {WEBHOOKS.map((w, i) => {
          const items = [
            { key: "rotate", icon: "lock", label: t("gs10.menu.rotate"), onSelect: () => onAction(t("gs10.rotate.done") + " " + t("gs10.rotate.secretOnce")) },
            w.health === "failing" ? { key: "replay", icon: "arrow", label: t("gs10.menu.replay"), onSelect: () => onAction(t("gs10.replay.done")) } : null,
            { key: "disable", icon: "alert", label: t("gs10.menu.disable"), onSelect: () => onAction(t("gs10.disable.confirm", { url: w.url })) },
          ].filter(Boolean);
          return (
            <div key={w.id} style={{ padding: "11px 0", borderBottom: i < WEBHOOKS.length - 1 ? "1px dashed " + c.border : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ flex: "0 0 38%", minWidth: 0 }}><Value mono>{w.url}</Value></div>
                <div style={{ flex: "0 0 26%" }}>{w.events.map((e) => <Chip key={e} style={{ marginRight: 4, marginBottom: 4 }}>{t("gs10.event." + e)}</Chip>)}</div>
                <div style={{ flex: "0 0 18%" }}>
                  {w.health === "ok" ? <StatusChip tone="present" icon="check" label={t("gs10.health.ok")} /> : <StatusChip tone="danger" icon="alert" label={t("gs10.health.failing")} />}
                </div>
                <div style={{ flex: 1, textAlign: "right" }}><ActionMenu ariaLabel={w.url} items={items} /></div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  function IssueTokenForm({ onCancel, onDone }) {
    const { t } = useLang();
    const { c } = useTheme();
    const [label, setLabel] = useState("");
    return (
      <InlineConfirm onConfirm={() => onDone(label)} onCancel={onCancel} confirmLabel={t("gs10.tokens.issue")} cancelLabel={t("gs.cta.cancel")} confirmDisabled={!label.trim()}>
        <Field id="gs10-tok-label" label={t("gs10.tokens.col.label")}>
          <Input id="gs10-tok-label" value={label} onChange={setLabel} />
        </Field>
        <Field id="gs10-tok-expiry" label={t("gs10.tokens.col.expiry")} hint={t("gs10.tokens.expiry.default")}>
          <Input id="gs10-tok-expiry" value="2027-08-11" readOnly />
        </Field>
      </InlineConfirm>
    );
  }

  function ServiceTokensCard({ onAction }) {
    const { t } = useLang();
    const { c } = useTheme();
    const { ty } = useLang();
    const [issuing, setIssuing] = useState(false);
    return (
      <div style={{ marginTop: 22, paddingTop: 18, borderTop: "1px dashed " + c.border }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, gap: 14 }}>
          <div>
            <div style={ty("h3", { color: c.ink, margin: 0 })}>{t("gs10.tokens.title")}</div>
            <div style={ty("caption", { color: c.inkMuted, marginTop: 3, maxWidth: 560 })}>{t("gs10.tokens.sub")}</div>
          </div>
          <Button kind="primary" size="sm" iconLeft="lock" onClick={() => setIssuing((v) => !v)}>{t("gs10.tokens.issue")}</Button>
        </div>
        {issuing ? (
          <IssueTokenForm
            onCancel={() => setIssuing(false)}
            onDone={() => { setIssuing(false); onAction(t("gs10.tokens.issue.done", { token: "nvya_ing_" + Math.floor(Math.random() * 90000 + 10000) })); }}
          />
        ) : null}
        <div style={{ display: "flex", gap: 14, padding: "10px 0 8px", borderBottom: "2px solid " + c.ruleStrong }}>
          <div style={ty("colLabel", { flex: "0 0 44%", color: c.inkFaint, textTransform: "uppercase" })}>{t("gs10.tokens.col.label")}</div>
          <div style={ty("colLabel", { flex: "0 0 22%", color: c.inkFaint, textTransform: "uppercase" })}>{t("gs10.tokens.col.scope")}</div>
          <div style={ty("colLabel", { flex: "0 0 18%", color: c.inkFaint, textTransform: "uppercase" })}>{t("gs10.tokens.col.expiry")}</div>
          <div style={{ flex: 1 }} />
        </div>
        {SERVICE_TOKENS.map((tok, i) => (
          <div key={tok.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "9px 0", borderBottom: i < SERVICE_TOKENS.length - 1 ? "1px dashed " + c.border : "none" }}>
            <div style={{ flex: "0 0 44%", minWidth: 0 }}><Value>{tok.label}</Value></div>
            <div style={{ flex: "0 0 22%" }}><Chip>{t("gs10.tokens.scope." + tok.scope)}</Chip></div>
            <div style={{ flex: "0 0 18%" }}><Value muted mono>{tok.expiryISO}</Value></div>
            <div style={{ flex: 1, textAlign: "right" }}>
              <LinkButton onClick={() => onAction(t("gs10.tokens.revoke.confirm"))}>{t("gs10.tokens.revoke")}</LinkButton>
            </div>
          </div>
        ))}
      </div>
    );
  }

  function IntegrationsCard({ onAction }) {
    const { t } = useLang();
    return (
      <Card icon="globe" iconTone="accent" title={t("gs10.card.title")} sub={t("gs10.card.sub")}>
        <ProvidersCard onAction={onAction} />
        <WebhooksCard onAction={onAction} />
        <ServiceTokensCard onAction={onAction} />
      </Card>
    );
  }

  /* ---- GA-11 components ---- */
  /* the shared footer of a confirmation: one primary for the act, one
     way out, and nothing else competing with either */
  function PopFoot({ confirmLabel, onConfirm, onCancel, danger, disabled }) {
    const { t } = useLang();
    return (
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20, paddingTop: 16, borderTop: "1px solid " + useTheme().c.rule }}>
        <Button kind="ghost" onClick={onCancel}>{t("gs.cta.cancel")}</Button>
        <Button kind={danger ? "danger" : "primary"} onClick={onConfirm} disabled={disabled}>{confirmLabel}</Button>
      </div>
    );
  }

  function DevFact({ label, children, last }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div style={{ display: "flex", gap: 14, alignItems: "baseline", padding: "10px 0", borderBottom: last ? "none" : "1px dashed " + c.border }}>
        <span style={ty("caption", { color: c.inkFaint, width: 150, flexShrink: 0 })}>{label}</span>
        <span style={{ flex: 1, minWidth: 0 }}>{children}</span>
      </div>
    );
  }

  function deviceStatus(t, d) {
    if (d.status === "healthy") return { tone: "present", icon: "check", label: t("gs11.status.healthy") };
    if (d.status === "silent") return { tone: "danger", icon: "alert", label: t("gs11.status.silent", { time: d.silentSince }) };
    if (d.status === "drift") return { tone: "late", icon: "clock", label: t("gs11.status.drift", { n: d.driftMin }) };
    return { tone: "off", icon: "alert", label: t("gs11.status.unmapped") };
  }

  /* ONE READER, opened. What it is, what it has sent, and what its
     state means in a sentence — "drift" is not self-explanatory. */
  function DevicePop({ device, onClose, onOpenAction }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const st = deviceStatus(t, device);
    const meaningKey = "gs11.means." + device.status;
    return (
      <Pop title={device.nameEn} sub={t("gs11.pop.sub", { campus: t("gs11.campus." + device.campusKey), family: t("gs11.family." + device.family) })} onClose={onClose} width={620}>
        <DevFact label={t("gs11.f.serial")}><span style={{ fontFamily: G3.font.mono, fontSize: 12.5, color: c.ink }}>{device.serial}</span></DevFact>
        <DevFact label={t("gs11.f.mode")}>
          <Value>{t("gs11.mode." + device.mode)}</Value>
          <div style={{ marginTop: 3 }}><Value muted>{t("gs11.modeNote." + device.mode)}</Value></div>
        </DevFact>
        <DevFact label={t("gs11.col.lastSeen")}><Value mono>{device.lastSeen}</Value></DevFact>
        <DevFact label={t("gs11.col.today")}><Figure value={num(device.todayCount)} size="sm" weight={600} color={c.ink} /></DevFact>
        <DevFact label={t("gs11.f.state")} last>
          <StatusChip tone={st.tone} icon={st.icon} label={st.label} />
          <p style={ty("caption", { color: c.inkMuted, margin: "8px 0 0" })}>{t(meaningKey, { n: device.affected, min: device.driftMin })}</p>
        </DevFact>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20, paddingTop: 16, borderTop: "1px solid " + c.rule, flexWrap: "wrap" }}>
          <Button kind="ghost" onClick={onClose}>{t("gs2.pop.close")}</Button>
          {device.status === "silent" && !device.outageRaised ? <Button kind="primary" iconLeft="alert" onClick={() => onOpenAction("outage")}>{t("gs11.menu.outage")}</Button> : null}
          {device.status === "drift" ? <Button kind="primary" iconLeft="clock" onClick={() => onOpenAction("clock")}>{t("gs11.menu.clock")}</Button> : null}
          {device.status === "unmapped" ? <Button kind="primary" iconLeft="globe" onClick={() => onOpenAction("map")}>{t("gs11.menu.map2")}</Button> : null}
          {device.mode === "pull" ? <Button kind="primary" iconLeft="arrow" onClick={() => onOpenAction("pull")}>{t("gs11.menu.pull")}</Button> : null}
        </div>
      </Pop>
    );
  }

  /* ASK THE READER FOR WHAT IT HAS. The outcome depends on whether it
     answers, so both outcomes are on the screen before the press. */
  function PullPop({ device, onClose, onDone }) {
    const { t } = useLang();
    const reachable = device.status !== "silent";
    return (
      <Pop title={t("gs11.pull.title")} sub={t("gs11.pull.sub", { device: device.nameEn })} onClose={onClose}>
        <Callout compact tone={reachable ? "ltEL" : "danger"} icon={reachable ? "clock" : "alert"}
          body={reachable ? t("gs11.pull.since", { time: device.lastSeen }) : t("gs11.pull.willFail", { time: device.lastSeen })} />
        <Consequence lines={[
          t("gs11.pull.c1"),
          t("gs11.pull.c2"),
          reachable ? null : t("gs11.pull.c3"),
        ]} />
        <PopFoot
          confirmLabel={t("gs11.pull.cta")} onCancel={onClose}
          onConfirm={() => onDone(reachable ? t("gs11.pull.done", { range: "11 Aug 2026" }) : t("gs11.pull.unreachable", { time: device.lastSeen }))}
        />
      </Pop>
    );
  }

  /* SAY THE DAY IS BROKEN, so nobody is marked absent for a reader
     that stopped talking. */
  function OutagePop({ device, onClose, onDone }) {
    const { t } = useLang();
    const campus = t("gs11.campus." + device.campusKey);
    return (
      <Pop title={t("gs11.outage.title")} sub={t("gs11.outage.sub", { campus: campus, time: device.silentSince })} onClose={onClose}>
        <Callout compact tone="danger" icon="alert" body={t("gs11.outage.body", { n: device.affected })} />
        <Consequence lines={[
          t("gs11.outage.c1", { n: device.affected }),
          t("gs11.outage.c2"),
          t("gs11.outage.c3"),
        ]} />
        <PopFoot confirmLabel={t("gs11.outage.cta")} onCancel={onClose}
          onConfirm={() => onDone(t("gs11.outage.done", { campus: campus, time: device.silentSince }))} />
      </Pop>
    );
  }

  /* A CLOCK FOUR MINUTES OUT decides who was late. Correcting it does
     not un-decide the days it already decided, and the screen says so. */
  function ClockPop({ device, onClose, onDone }) {
    const { t } = useLang();
    return (
      <Pop title={t("gs11.clock.title")} sub={t("gs11.clock.sub", { device: device.nameEn, n: device.driftMin })} onClose={onClose}>
        <Callout compact tone="late" icon="clock" body={t("gs11.clock.body", { n: device.driftMin })} />
        <Consequence lines={[t("gs11.clock.c1"), t("gs11.clock.c2"), t("gs11.clock.c3")]} />
        <PopFoot confirmLabel={t("gs11.clock.cta")} onCancel={onClose}
          onConfirm={() => onDone(t("gs11.clock.done", { device: device.nameEn }))} />
      </Pop>
    );
  }

  /* AN UNMAPPED READER counts for nobody. */
  function MapCampusPop({ device, onClose, onDone }) {
    const { t } = useLang();
    const [campus, setCampus] = useState("");
    const options = [{ value: "", label: t("gs11.map2.pick") }].concat(
      ["indiranagar", "whitefield", "yelahanka", "hyderabad"].map((k) => ({ value: k, label: t("gs11.campus." + k) }))
    );
    return (
      <Pop title={t("gs11.map2.title")} sub={t("gs11.map2.sub", { device: device.nameEn, serial: device.serial })} onClose={onClose}>
        <Callout compact tone="off" icon="alert" body={t("gs11.map2.body")} />
        <div style={{ marginTop: 14 }}>
          <Field id="gs11-map-campus" label={t("gs11.map2.label")}>
            <Select id="gs11-map-campus" value={campus} onChange={setCampus} options={options} />
          </Field>
        </div>
        <Consequence lines={[t("gs11.map2.c1"), t("gs11.map2.c2")]} />
        <PopFoot confirmLabel={t("gs11.map2.cta")} onCancel={onClose} disabled={!campus}
          onConfirm={() => onDone(t("gs11.map2.done", { device: device.nameEn, campus: t("gs11.campus." + campus) }))} />
      </Pop>
    );
  }

  /* STOP ACCEPTING PUNCHES — the one action here that breaks something
     on purpose, so it needs a reason and it warns when the reader it
     silences is the only one a campus has. */
  function StopPop({ device, onClose, onDone }) {
    const { t } = useLang();
    const [reason, setReason] = useState("");
    return (
      <Pop title={t("gs11.stop.title")} sub={t("gs11.stop.sub", { device: device.nameEn, campus: t("gs11.campus." + device.campusKey) })} onClose={onClose}>
        {device.onlyOne ? <Callout compact tone="danger" icon="alert" body={t("gs11.stop.onlyOne", { campus: t("gs11.campus." + device.campusKey) })} /> : null}
        <div style={{ marginTop: device.onlyOne ? 14 : 0 }}>
          <Field id="gs11-stop-reason" label={t("gs11.stop.reason")}>
            <Input id="gs11-stop-reason" value={reason} onChange={setReason} placeholder={t("gs11.stop.reasonPh")} />
          </Field>
        </div>
        <Consequence lines={[t("gs11.stop.c1"), t("gs11.stop.c2"), t("gs11.stop.c3")]} />
        <PopFoot danger confirmLabel={t("gs11.stop.cta")} onCancel={onClose} disabled={!reason.trim()}
          onConfirm={() => onDone(t("gs11.stop.done", { device: device.nameEn }))} />
      </Pop>
    );
  }

  function RegisterDevicePop({ onClose, onDone }) {
    const { t } = useLang();
    const [family, setFamily] = useState("");
    const [serial, setSerial] = useState("");
    const [campus, setCampus] = useState("");
    const [mode, setMode] = useState("push");
    const familyOptions = [{ value: "", label: t("gs11.register.family.pick") }].concat(
      ["zkteco", "essl", "matrix", "realtime"].map((k) => ({ value: k, label: t("gs11.family." + k) }))
    );
    const campusOptions = [{ value: "", label: t("gs11.map2.pick") }].concat(
      ["indiranagar", "whitefield", "yelahanka", "hyderabad"].map((k) => ({ value: k, label: t("gs11.campus." + k) }))
    );
    const duplicate = serial.trim().toUpperCase() === "SN-88213";
    return (
      <Pop title={t("gs11.register.title")} sub={t("gs11.register.sub")} onClose={onClose}>
        <Field id="gs11-family" label={t("gs11.register.family.label")}>
          <Select id="gs11-family" value={family} onChange={setFamily} options={familyOptions} />
        </Field>
        <Field id="gs11-serial" label={t("gs11.register.serial.label")} hint={t("gs11.register.serial.hint")} error={duplicate ? t("gs11.register.duplicate") : null}>
          <Input id="gs11-serial" value={serial} onChange={setSerial} placeholder="SN-…" />
        </Field>
        <Field id="gs11-campus" label={t("gs11.register.campus.label")}>
          <Select id="gs11-campus" value={campus} onChange={setCampus} options={campusOptions} />
        </Field>
        <Field id="gs11-mode" label={t("gs11.register.mode.label")} hint={t("gs11.modeNote." + mode)}>
          <Select id="gs11-mode" value={mode} onChange={setMode} options={[{ value: "push", label: t("gs11.mode.push") }, { value: "pull", label: t("gs11.mode.pull") }]} />
        </Field>
        <Consequence lines={[t("gs11.register.c1"), t("gs11.register.c2")]} />
        <PopFoot confirmLabel={t("gs11.register.cta")} onCancel={onClose}
          disabled={!family || !serial.trim() || !campus || duplicate}
          onConfirm={() => onDone(t("gs11.register.done", { device: t("gs11.family." + family), campus: t("gs11.campus." + campus) }))} />
      </Pop>
    );
  }

  function DevicesCard({ onAction }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [adding, setAdding] = useState(false);
    const [open, setOpen] = useState(null);   /* { device, mode } */
    const silent = DEVICES.filter((d) => d.status === "silent");

    function act(device, mode) { setOpen({ device: device, mode: mode }); }
    function done(msg) { setOpen(null); onAction(msg); }

    const columns = [
      { key: "device", label: t("gs11.col.device") },
      { key: "campus", label: t("gs11.col.campus"), width: 140 },
      { key: "lastSeen", label: t("gs11.col.lastSeen"), mono: true, width: 130 },
      { key: "today", label: t("gs11.col.today"), align: "right", mono: true, width: 110 },
      { key: "state", label: t("gs11.col.state"), width: 230 },
      { key: "act", label: t("gs2.col.act"), align: "right", width: 78, act: true },
    ];
    const rows = DEVICES.map((d) => {
      const st = deviceStatus(t, d);
      const items = [
        { key: "open", icon: "scan", label: t("gs11.menu.open"), onSelect: () => act(d, "open") },
        {
          key: "pull", icon: "arrow", label: t("gs11.menu.pull"),
          disabled: d.mode !== "pull",
          reason: d.mode !== "pull" ? t("gs11.pull.pushOnly") : undefined,
          onSelect: d.mode === "pull" ? () => act(d, "pull") : undefined,
        },
        {
          key: "outage", icon: "alert", label: t("gs11.menu.outage"),
          disabled: d.status !== "silent" || !!d.outageRaised,
          reason: d.outageRaised
            ? t("gs11.menu.outage.already", { time: d.silentSince })
            : d.status !== "silent" ? t("gs11.menu.outage.healthy") : undefined,
          onSelect: d.status === "silent" && !d.outageRaised ? () => act(d, "outage") : undefined,
        },
      ];
      if (d.status === "drift") items.push({ key: "clock", icon: "clock", label: t("gs11.menu.clock"), onSelect: () => act(d, "clock") });
      if (d.status === "unmapped") items.push({ key: "map", icon: "globe", label: t("gs11.menu.map2"), onSelect: () => act(d, "map") });
      items.push({ key: "stop", icon: "lock", label: t("gs11.menu.stop"), tone: "danger", onSelect: () => act(d, "stop") });

      return {
        id: d.id, live: true,
        cells: {
          device: (
            <span>
              <span style={ty("small", { display: "block", color: c.ink, fontWeight: 600 })}>{d.nameEn}</span>
              <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 2 })}>{t("gs11.family." + d.family)} · {t("gs11.mode." + d.mode)}</span>
            </span>
          ),
          campus: <span style={ty("small", { color: c.inkMuted })}>{t("gs11.campus." + d.campusKey)}</span>,
          lastSeen: d.lastSeen,
          today: num(d.todayCount),
          state: <StatusChip tone={st.tone} icon={st.icon} label={st.label} />,
          act: (
            <span style={{ display: "flex", justifyContent: "flex-end" }}>
              <ActionMenu ariaLabel={t("gs11.menuAria", { device: d.nameEn })} size={30} items={items} />
            </span>
          ),
        },
      };
    });

    const m = open ? open.mode : null;
    return (
      <Card
        icon="scan" iconTone="brass" title={t("gs11.card.title")} sub={t("gs11.card.sub")}
        action={<Button kind="primary" size="sm" iconLeft="scan" onClick={() => setAdding(true)}>{t("gs11.register")}</Button>}
      >
        {silent.length ? (
          <div style={{ marginBottom: 14 }}>
            <Callout tone="danger" icon="alert" title={t("gs11.gap.title")} body={t("gs11.gap.body", { n: silent[0].affected })} />
          </div>
        ) : null}
        <Register columns={columns} rows={rows} />
        {adding ? <RegisterDevicePop onClose={() => setAdding(false)} onDone={(msg) => { setAdding(false); onAction(msg); }} /> : null}
        {m === "open" ? <DevicePop device={open.device} onClose={() => setOpen(null)} onOpenAction={(next) => setOpen({ device: open.device, mode: next })} /> : null}
        {m === "pull" ? <PullPop device={open.device} onClose={() => setOpen(null)} onDone={done} /> : null}
        {m === "outage" ? <OutagePop device={open.device} onClose={() => setOpen(null)} onDone={done} /> : null}
        {m === "clock" ? <ClockPop device={open.device} onClose={() => setOpen(null)} onDone={done} /> : null}
        {m === "map" ? <MapCampusPop device={open.device} onClose={() => setOpen(null)} onDone={done} /> : null}
        {m === "stop" ? <StopPop device={open.device} onClose={() => setOpen(null)} onDone={done} /> : null}
      </Card>
    );
  }

  /* ---- what the readers sent that could not be used ---------------- */

  function MatchPop({ entry, onClose, onDone }) {
    const { t } = useLang();
    const [who, setWho] = useState("");
    const options = [{ value: "", label: t("gs11.match.pick") }].concat(
      INCIDENT_PEOPLE.map((p2) => ({ value: p2.code, label: p2.name + " · " + p2.code }))
    ).concat([{ value: "NAV-0250", label: "Neha Bhatt · NAV-0250" }]);
    return (
      <Pop title={t("gs11.match.title", { code: entry.code })} sub={t("gs11.match.sub", { n: num(entry.n), date: "1 Aug 2026" })} onClose={onClose}>
        <Callout compact tone="ltEL" icon="staff" body={t("gs11.match.suggest", { name: "Neha Bhatt", id: "NAV-0250" })} />
        <div style={{ marginTop: 14 }}>
          <Field id="gs11-match-who" label={t("gs11.match.label")}>
            <Select id="gs11-match-who" value={who} onChange={setWho} options={options} />
          </Field>
        </div>
        <Consequence lines={[t("gs11.match.c1", { n: num(entry.n) }), t("gs11.match.c2"), t("gs11.match.c3")]} />
        <PopFoot confirmLabel={t("gs11.match.cta")} onCancel={onClose} disabled={!who}
          onConfirm={() => onDone(t("gs11.match.done", { name: "Neha Bhatt", n: num(entry.n) }))} />
      </Pop>
    );
  }

  function DiscardPop({ entry, onClose, onDone }) {
    const { t } = useLang();
    const [reason, setReason] = useState("");
    return (
      <Pop title={t("gs11.discard.title")} sub={t("gs11.discard.sub", { n: num(entry.n) })} onClose={onClose}>
        <Field id="gs11-discard-reason" label={t("gs11.discard.reason.label")}>
          <Input id="gs11-discard-reason" value={reason} onChange={setReason} placeholder={t("gs.reason.placeholder")} />
        </Field>
        <Consequence lines={[t("gs11.discard.c1"), t("gs11.discard.c2"), t("gs11.discard.c3")]} />
        <PopFoot danger confirmLabel={t("gs11.discard.cta")} onCancel={onClose} disabled={!reason.trim()}
          onConfirm={() => onDone(t("gs11.discard.done", { n: num(entry.n) }))} />
      </Pop>
    );
  }

  /* AN INCIDENT IS A LIST OF PEOPLE. A number cannot be acted on. */
  function IncidentPop({ entry, onClose }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    return (
      <Pop title={t("gs11.incident.title", { id: entry.incidentId })} sub={t("gs11.incident.sub", { date: entry.dateISO, n: num(entry.n) })} onClose={onClose} width={620}>
        <Callout compact tone="danger" icon="alert" body={t("gs11.incident.body")} />
        <div style={{ marginTop: 16 }}>
          <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 9 })}>{t("gs11.incident.who")}</div>
          {INCIDENT_PEOPLE.map((p2, i2) => (
            <div key={p2.code} style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 0", borderBottom: i2 < INCIDENT_PEOPLE.length - 1 ? "1px dashed " + c.border : "none" }}>
              <Avatar name={p2.name} size={28} />
              <span style={ty("small", { color: c.ink, flex: 1, minWidth: 0 })}>{p2.name}</span>
              <span style={{ fontFamily: G3.font.mono, fontSize: 11.5, color: c.inkFaint }}>{p2.code}</span>
            </div>
          ))}
          <p style={ty("caption", { color: c.inkMuted, margin: "12px 0 0" })}>{t("gs11.incident.more", { n: num(entry.n - INCIDENT_PEOPLE.length) })}</p>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20, paddingTop: 16, borderTop: "1px solid " + c.rule }}>
          <Button kind="primary" onClick={onClose}>{t("gs2.pop.close")}</Button>
        </div>
      </Pop>
    );
  }

  function ExplainPop({ entry, onClose }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    return (
      <Pop title={t("gs11.explain." + entry.kind + ".title")} sub={t("gs11.explain.sub", { n: num(entry.n), campus: t("gs11.campus." + entry.campusKey) })} onClose={onClose}>
        <p style={ty("small", { color: c.ink, margin: 0 })}>{t("gs11.explain." + entry.kind + ".body")}</p>
        <Consequence lines={[t("gs11.explain." + entry.kind + ".c1"), t("gs11.explain." + entry.kind + ".c2")]} />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20, paddingTop: 16, borderTop: "1px solid " + c.rule }}>
          <Button kind="primary" onClick={onClose}>{t("gs2.pop.close")}</Button>
        </div>
      </Pop>
    );
  }

  function IngestionLogCard({ onAction }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [open, setOpen] = useState(null); /* { entry, mode } */
    function done(msg) { setOpen(null); onAction(msg); }

    const columns = [
      { key: "what", label: t("gs11.col.what") },
      { key: "campus", label: t("gs11.col.campus"), width: 140 },
      { key: "n", label: t("gs11.col.records"), align: "right", mono: true, width: 110 },
      { key: "act", label: t("gs2.col.act"), align: "right", width: 78, act: true },
    ];
    const rows = INGESTION_LOG.map((e) => {
      let head, why, tone;
      if (e.kind === "unknown") { head = t("gs11.what.unknown", { code: e.code }); why = t("gs11.why.unknown"); tone = c.lateText; }
      else if (e.kind === "gap") { head = t("gs11.what.gap", { date: e.dateISO }); why = t("gs11.why.gap"); tone = c.dangerText; }
      else if (e.kind === "duplicate") { head = t("gs11.what.duplicate"); why = t("gs11.why.duplicate"); tone = c.inkFaint; }
      else { head = t("gs11.what.outOfRange"); why = t("gs11.why.outOfRange"); tone = c.lateText; }

      const items = [];
      if (e.kind === "unknown") {
        items.push({ key: "match", icon: "staff", label: t("gs11.menu.match"), onSelect: () => setOpen({ entry: e, mode: "match" }) });
        items.push({ key: "discard", icon: "alert", label: t("gs11.menu.discard"), tone: "danger", onSelect: () => setOpen({ entry: e, mode: "discard" }) });
      } else if (e.kind === "gap") {
        items.push({ key: "incident", icon: "list", label: t("gs11.menu.incident"), onSelect: () => setOpen({ entry: e, mode: "incident" }) });
      } else {
        items.push({ key: "explain", icon: "filing", label: t("gs11.menu.explain"), onSelect: () => setOpen({ entry: e, mode: "explain" }) });
        if (e.kind === "outOfRange") {
          items.push({ key: "discard", icon: "alert", label: t("gs11.menu.discard"), tone: "danger", onSelect: () => setOpen({ entry: e, mode: "discard" }) });
        }
      }

      return {
        id: e.id, live: true,
        cells: {
          what: (
            <span style={{ display: "flex", gap: 11, alignItems: "flex-start", minWidth: 0 }}>
              <span aria-hidden="true" style={{ color: tone, display: "flex", flexShrink: 0, marginTop: 2 }}><Icon name="alert" size={15} /></span>
              <span style={{ minWidth: 0 }}>
                <span style={ty("small", { display: "block", color: c.ink, fontWeight: 600 })}>{head}</span>
                <span style={ty("caption", { display: "block", color: c.inkMuted, marginTop: 3 })}>{why}</span>
              </span>
            </span>
          ),
          campus: <span style={ty("small", { color: c.inkMuted })}>{t("gs11.campus." + e.campusKey)}</span>,
          n: num(e.n),
          act: (
            <span style={{ display: "flex", justifyContent: "flex-end" }}>
              <ActionMenu ariaLabel={t("gs11.logMenuAria")} size={30} items={items} />
            </span>
          ),
        },
      };
    });

    const m = open ? open.mode : null;
    return (
      <Card icon="filing" iconTone="off" title={t("gs11.log.title")} sub={t("gs11.log.sub")}>
        <Register columns={columns} rows={rows} footer={<span style={ty("caption", { color: c.inkFaint })}>{t("gs11.log.foot")}</span>} />
        {m === "match" ? <MatchPop entry={open.entry} onClose={() => setOpen(null)} onDone={done} /> : null}
        {m === "discard" ? <DiscardPop entry={open.entry} onClose={() => setOpen(null)} onDone={done} /> : null}
        {m === "incident" ? <IncidentPop entry={open.entry} onClose={() => setOpen(null)} /> : null}
        {m === "explain" ? <ExplainPop entry={open.entry} onClose={() => setOpen(null)} /> : null}
      </Card>
    );
  }

  function TabConnections() {
    const [flash, setFlash] = useState(null);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: G3.layout.gap }}>
        <Flash text={flash} />
        <DevicesCard onAction={(msg) => msg && setFlash(msg)} />
        <IngestionLogCard onAction={(msg) => msg && setFlash(msg)} />
        <IntegrationsCard onAction={(msg) => msg && setFlash(msg)} />
      </div>
    );
  }

  /* ============================================================
     TAB 6 · GA-12 Data protection & DPDP console

     The administrative counterpart to profile.jsx's "What the
     school holds about you" (the employee's own view, EMP-18). Every
     retention line here is an ABSOLUTE DATE from a named policy
     version — never a typed duration — and no record inside a
     statutory-retention window carries a delete affordance anywhere
     in this file (O2). No consent or audit record has an edit/delete
     control (O6). Sunita Menon (TGT English, exited) is referenced by
     NAME ONLY, deliberately never by staff ID — hr.jsx's NAV-0009 and
     payroll.jsx/accountant.jsx's NAV-0009 (Rajiv Menon, Accountant)
     already collide in the inherited world; this file does not
     compound that collision (flagged in the dispatch report instead).
     ============================================================ */
  addStrings({
    en: {

      "gs12.col.class": "Data class",
      "gs12.col.basis": "Basis",
      "gs12.col.retainedUntil": "Retained until",
      "gs12.basis.consent": "Consent",
      "gs12.basis.statutory": "Statutory",
      "gs12.basis.contract": "Employment contract",
      "gs12.class.payroll": "Payroll & statutory records (PF/ESI/TDS/Form 16)",
      "gs12.class.payroll.until": "8 years after exit — Income-tax Act. Policy v1.0, set by Ananya Rao, 1 Jan 2026.",
      "gs12.class.biometric": "Attendance geo + selfie captures",
      "gs12.class.biometric.until": "90 days after capture, then anonymised. Policy v1.0. Next sweep: 1 Sep 2026, ~14,200 images.",
      "gs12.class.candidate": "Candidate applications (not hired)",
      "gs12.class.candidate.until": "6 months after the requisition closes. Policy v1.0. Earliest due: 15 Jan 2027 (requisition closed 15 Jul 2026).",
      "gs12.class.service": "Exited-staff service records",
      "gs12.class.service.until": "8 years after exit — statutory minimum. Example: Sunita Menon, TGT English, exited 31 Mar 2026 → retained until 31 Mar 2034.",
      "gs12.class.helpdesk": "Helpdesk & grievance tickets",
      "gs12.class.helpdesk.until": "3 years after closure. Policy v1.0.",

      "gs12.col.subject": "Subject",
      "gs12.col.type": "Type",
      "gs12.col.received": "Received",
      "gs12.col.due": "Due",
      "gs12.col.state": "State",
      "gs12.menu.fulfilAccess": "Fulfil — generate data pack",
      "gs12.menu.applyCorrection": "Apply the correction",
      "gs12.menu.reviewErasure": "Review for erasure",
      "gs12.fulfil.done": "Data pack generated for {who} — fulfilment recorded, and the export itself is audited.",
      "gs12.correction.route": "Routes to {screen} to make the correction — recorded against this request when saved.",
      "gs12.erasure.title": "Review erasure request — {who}",
      "gs12.erasure.body": "{who} asked to withdraw consent for {what}. Payroll, PF/ESI/TDS and service records rest on statutory obligation, not consent.",
      "gs12.erasure.reason.label": "Attributed decision + reason",
      "gs12.erasure.cta": "Record decision",
      "gs12.erasure.done": "Decision recorded against the request — visible to {who} end-to-end.",
      "gs12.log.title": "Log a data-subject request",
      "gs12.log.subject.label": "Subject",
      "gs12.log.type.label": "Type — no default",
      "gs12.log.received.label": "Received",
      "gs12.log.due.auto": "Statutory due date (auto-computed)",
      "gs12.log.cta": "Track request",
      "gs12.log.done": "Logged — clock started, due {date}.",

      "gs12.consent.title": "Who has been told what we hold",
      "gs12.consent.sub": "Everybody on the register has to be told what the school holds, and say they were told. Notice {v}, since {date}.",
      "gs12.cs.accepted": "Told and accepted",
      "gs12.cs.pending": "Not yet accepted",
      "gs12.cs.unreachable": "Cannot be reached",
      "gs12.cs.withdrawn": "Withdrew",
      "gs12.cs.ofTotal": "of {n} people on the register. The ones who accepted need nothing from you — the list below is everybody else.",
      "gs12.cs.listNote": "Five people, three different problems. Not-yet is a matter of time; cannot-be-reached is not.",
      "gs12.cs.col.who": "Who",
      "gs12.cs.col.campus": "Campus",
      "gs12.cs.col.state": "Where it stands",
      "gs12.cs.col.since": "Since",
      "gs12.cs.since.days": "{n} days",
      "gs12.cs.since.on": "{date}",
      "gs12.cs.st.pending": "Sent, not yet accepted",
      "gs12.cs.st.unreachable": "No phone number on record",
      "gs12.cs.st.withdrawn": "Withdrew their consent",
      "gs12.cs.askedN": "Asked {n} times already",
      "gs12.cs.exited": "Left the school",
      "gs12.cs.menuAria": "Actions on {name}",
      "gs12.cs.menu.ask": "Send the notice again",
      "gs12.cs.menu.noPhone": "There is no phone number on {name}’s record, so there is nowhere to send it. HR adds one from the staff record.",
      "gs12.cs.menu.what": "What their withdrawal changes",
      "gs12.cs.empty.head": "Everybody has been told",
      "gs12.cs.empty.body": "Every person on the register has seen the current notice and accepted it.",
      "gs12.ask.title": "Send the notice again",
      "gs12.ask.sub": "{name} · asked {n} times so far",
      "gs12.ask.body": "It goes to the phone number on their record, in Hindi and English, with a link that signs them straight in.",
      "gs12.ask.thrice": "{name} has been asked three times. A fourth message is unlikely to work \u2014 somebody should ask in person.",
      "gs12.ask.c1": "A message goes out now. Nothing else changes.",
      "gs12.ask.c2": "Not accepting stops nothing: they are still paid, still marked present, still take leave.",
      "gs12.ask.c3": "This counts as the fourth time asked, and that count is on the record.",
      "gs12.ask.cta": "Send it",
      "gs12.ask.done": "The notice has gone to {name} again.",
      "gs12.wd.title": "What {name}’s withdrawal changes",
      "gs12.wd.sub": "Withdrawn on {date}",
      "gs12.wd.stops": "What stopped",
      "gs12.wd.stops.a": "No message goes to them that is not about their own pay, leave or employment.",
      "gs12.wd.stops.b": "Their details are not sent to anything optional — no alumni list, no school newsletter, no vendor.",
      "gs12.wd.keeps": "What is kept, and why",
      "gs12.wd.keeps.a": "The payroll record, because the law requires the school to be able to show what it paid and what it deducted.",
      "gs12.wd.keeps.b": "PF, ESI and tax filings, for as long as those authorities require them.",
      "gs12.wd.keeps.c": "The audit log, which is written once and cannot be edited by anybody, including you.",
      "gs12.wd.note": "Withdrawing consent is not erasure and cannot delete a record the law requires. Erasure goes to compliance, not this desk.",
      "gs12.nn.title": "Publish a new notice",
      "gs12.nn.sub": "The current one is {v}",
      "gs12.nn.body": "Changing the notice means all {n} people are asked again — including the 531 who have already accepted the current one.",
      "gs12.nn.c1": "Everybody’s acceptance is recorded against the OLD notice and kept. Nothing is erased.",
      "gs12.nn.c2": "All {n} are asked to read and accept the new one.",
      "gs12.nn.c3": "Nothing stops while they decide — nobody’s pay, leave or attendance is affected.",
      "gs12.nn.cta": "Publish it",
      "gs12.nn.cta2": "New notice",
      "gs12.nn.done": "The new notice is live. Everybody has been asked to read it.",
      "gs12.n.kavya": "Kavya Nair",
      "gs12.n.farah": "Farah Sheikh",
      "gs12.n.iqbal": "Iqbal Ahmed",
      "gs12.n.manju": "Manjunath Gowda",
      "gs12.n.sunita": "Sunita Menon",
      "gs12.n.meera": "Meera Nair",
      "gs12.n.sunitaK": "Sunita Kulkarni",
      "gs12.n.suresh": "Suresh Kamath",
      "gs12.n.arvind": "Arvind Krishnan",
      "gs12.n.ananya": "Ananya Rao",
      "gs12.n.devansh": "Devansh Kulkarni",
      "gs12.pa.k.reveals": "Opened this month",
      "gs12.pa.k.people": "By this many people",
      "gs12.pa.k.noReason": "With no reason given",
      "gs12.pa.col.who": "Who opened it",
      "gs12.pa.col.subject": "Whose record",
      "gs12.pa.col.field": "What they opened",
      "gs12.pa.col.when": "When",
      "gs12.pa.col.why": "Why",
      "gs12.pa.menuAria": "Actions on this reveal",
      "gs12.pa.menu.open": "Open this reveal",
      "gs12.pa.f.bank": "Bank account",
      "gs12.pa.f.pan": "PAN",
      "gs12.pa.f.aadhaar": "Aadhaar",
      "gs12.pa.f.salary": "Salary",
      "gs12.pa.f.who": "Who opened it",
      "gs12.pa.f.times": "How often",
      "gs12.pa.f.reason": "Reason given",
      "gs12.pa.f.grant": "What allowed it",
      "gs12.pa.r.bankFix": "Correcting a rejected salary transfer",
      "gs12.pa.r.verify": "Verifying the document against the record",
      "gs12.pa.r.audit": "Quarterly access review",
      "gs12.pa.g.hr": "Identifiers, granted for the Indiranagar register",
      "gs12.pa.g.payroll": "Identifiers, granted group-wide for payroll",
      "gs12.pa.g.temp": "Salary, granted for one review",
      "gs12.pa.by.you": "you",
      "gs12.pa.grantedBy": "Given by {who} on {date}",
      "gs12.pa.inForce": "Still in force",
      "gs12.pa.removed": "Taken away on {date}",
      "gs12.pa.removedNote": "The reveal happened while the permission was in force. Taking it away does not undo what was seen.",
      "gs12.pa.once": "Once",
      "gs12.pa.repeat": "{n} times",
      "gs12.pa.repeatNote": "The same record, opened repeatedly in one sitting. Usually somebody checking their work; worth asking if it keeps happening.",
      "gs12.pa.noReason": "No reason given",
      "gs12.pa.noReasonNote": "A reason is asked for and can be skipped. A reveal without one is the one you cannot explain later.",
      "gs12.pa.pop.title": "{field}, opened",
      "gs12.pa.pop.sub": "{subject}’s record · {when}",
      "gs12.pa.foot": "Reading your own record is not a reveal. This list is written once and cannot be edited or cleared by anybody.",
      "gs12.consent.notice": "Attendance notice, version 1.2",
      "gs12.consent.accepted": "{n} of {total} staff have accepted — {p} pending at first sign-in",
      "gs12.consent.withdrawn.label": "Withdrawn",
      "gs12.consent.withdrawn": "{n} withdrawn",
      "gs12.consent.candidates.title": "Candidate application consent (PUB-02)",
      "gs12.consent.candidates.body": "Every application carries its own consent artefact, visible on the candidate's record (HR-17), not duplicated here.",

      "gs12.access.title": "Who opened somebody’s identifiers",
      "gs12.access.sub": "Identifiers and pay are masked everywhere. Opening one is a deliberate act, and this is where the deliberate acts are kept.",
      "gs12.access.row": "{viewer} ({role}) revealed {subject}'s {field} · {time}",
      "gs12.access.empty.head": "No PII was revealed in this window",
      "gs12.access.empty.body": "Every reveal, by anyone with the field-level permission, would appear here — attributed, timestamped, never re-showing the value.",
    },
  });

  /* WHO HAS BEEN TOLD, and the handful of people for whom the answer
     is not a simple yes. The 531 who accepted need no screen. */
  const CONSENT_NOTICE = { version: "v3", fromISO: "2026-04-01", total: 537, accepted: 531, pending: 4, unreachable: 1, withdrawn: 1 };

  const CONSENT_CASES = [
    { id: "cc1", nameKey: "gs12.n.kavya", campusKey: "indiranagar", state: "pending", sinceKey: "gs12.cs.since.days", sinceVars: { n: 12 }, asked: 1 },
    { id: "cc2", nameKey: "gs12.n.farah", campusKey: "yelahanka", state: "pending", sinceKey: "gs12.cs.since.days", sinceVars: { n: 31 }, asked: 3 },
    { id: "cc3", nameKey: "gs12.n.iqbal", campusKey: "hyderabad", state: "pending", sinceKey: "gs12.cs.since.days", sinceVars: { n: 8 }, asked: 1 },
    { id: "cc4", nameKey: "gs12.n.manju", campusKey: "indiranagar", state: "unreachable", sinceKey: "gs12.cs.since.days", sinceVars: { n: 44 }, asked: 0 },
    { id: "cc5", nameKey: "gs12.n.sunita", campusKey: "indiranagar", state: "withdrawn", sinceKey: "gs12.cs.since.on", sinceVars: { date: "2 Aug 2026" }, asked: 0, exited: true },
  ];

  const CONSENT_LOOK = {
    pending: { role: "late", glyph: "clock", key: "gs12.cs.st.pending" },
    unreachable: { role: "absent", glyph: "alert", key: "gs12.cs.st.unreachable" },
    withdrawn: { role: "off", glyph: "signout", key: "gs12.cs.st.withdrawn" },
  };

  function AskAgainPop({ person, onClose, onDone }) {
    const { t } = useLang();
    const third = person.asked >= 3;
    return (
      <Pop title={t("gs12.ask.title")} sub={t("gs12.ask.sub", { name: t(person.nameKey), n: person.asked })} onClose={onClose}>
        <Callout compact tone={third ? "late" : "ltEL"} icon={third ? "alert" : "mail"}
          body={third ? t("gs12.ask.thrice", { name: t(person.nameKey) }) : t("gs12.ask.body")} />
        <Consequence lines={[t("gs12.ask.c1"), t("gs12.ask.c2"), third ? t("gs12.ask.c3") : null]} />
        <PopFoot confirmLabel={t("gs12.ask.cta")} onCancel={onClose}
          onConfirm={() => onDone(t("gs12.ask.done", { name: t(person.nameKey) }))} />
      </Pop>
    );
  }

  /* WITHDRAWAL is the question everybody gets wrong: it does not erase
     a payroll record, because the law requires that record to exist. */
  function WithdrawalPop({ person, onClose }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    return (
      <Pop title={t("gs12.wd.title", { name: t(person.nameKey) })} sub={t("gs12.wd.sub", { date: "2 Aug 2026" })} onClose={onClose} width={620}>
        <div style={{ paddingBottom: 14, borderBottom: "1px solid " + c.rule }}>
          <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 9 })}>{t("gs12.wd.stops")}</div>
          {["a", "b"].map((k) => (
            <div key={k} style={{ display: "flex", gap: 9, alignItems: "flex-start", padding: "4px 0" }}>
              <span aria-hidden="true" style={{ color: c.presentText, display: "flex", marginTop: 2 }}><Icon name="check" size={14} /></span>
              <span style={ty("small", { color: c.ink })}>{t("gs12.wd.stops." + k)}</span>
            </div>
          ))}
        </div>
        <div style={{ paddingTop: 14 }}>
          <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 9 })}>{t("gs12.wd.keeps")}</div>
          {["a", "b", "c"].map((k) => (
            <div key={k} style={{ display: "flex", gap: 9, alignItems: "flex-start", padding: "4px 0" }}>
              <span aria-hidden="true" style={{ color: c.inkFaint, display: "flex", marginTop: 2 }}><Icon name="lock" size={14} /></span>
              <span style={ty("small", { color: c.ink })}>{t("gs12.wd.keeps." + k)}</span>
            </div>
          ))}
          <p style={ty("caption", { color: c.inkMuted, margin: "12px 0 0" })}>{t("gs12.wd.note")}</p>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20, paddingTop: 16, borderTop: "1px solid " + c.rule }}>
          <Button kind="primary" onClick={onClose}>{t("gs2.pop.close")}</Button>
        </div>
      </Pop>
    );
  }

  /* CHANGING THE NOTICE asks everybody again. That is the whole cost of
     the action and it is the first thing the dialog says. */
  function NewNoticePop({ onClose, onDone }) {
    const { t } = useLang();
    return (
      <Pop title={t("gs12.nn.title")} sub={t("gs12.nn.sub", { v: CONSENT_NOTICE.version })} onClose={onClose}>
        <Callout compact tone="late" icon="alert" body={t("gs12.nn.body", { n: num(CONSENT_NOTICE.total) })} />
        <Consequence lines={[t("gs12.nn.c1", { n: num(CONSENT_NOTICE.total) }), t("gs12.nn.c2"), t("gs12.nn.c3")]} />
        <PopFoot confirmLabel={t("gs12.nn.cta")} onCancel={onClose} onConfirm={() => onDone(t("gs12.nn.done"))} />
      </Pop>
    );
  }

  function ConsentCard({ onAction }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [open, setOpen] = useState(null); /* { person, mode } | { mode } */
    const N = CONSENT_NOTICE;

    const counts = [
      { k: t("gs12.cs.accepted"), v: num(N.accepted), tone: c.presentText },
      { k: t("gs12.cs.pending"), v: num(N.pending), tone: c.lateText },
      { k: t("gs12.cs.unreachable"), v: num(N.unreachable), tone: c.dangerText },
      { k: t("gs12.cs.withdrawn"), v: num(N.withdrawn), tone: c.inkMuted },
    ];

    const columns = [
      { key: "who", label: t("gs12.cs.col.who") },
      { key: "campus", label: t("gs12.cs.col.campus"), width: 140 },
      { key: "state", label: t("gs12.cs.col.state"), width: 210 },
      { key: "since", label: t("gs12.cs.col.since"), width: 150 },
      { key: "act", label: t("gs2.col.act"), align: "right", width: 78, act: true },
    ];
    const rows = CONSENT_CASES.map((p2) => {
      const look = CONSENT_LOOK[p2.state];
      const items = [];
      if (p2.state === "pending") {
        items.push({ key: "ask", icon: "mail", label: t("gs12.cs.menu.ask"), onSelect: () => setOpen({ person: p2, mode: "ask" }) });
      } else if (p2.state === "unreachable") {
        items.push({
          key: "ask", icon: "mail", label: t("gs12.cs.menu.ask"),
          disabled: true, reason: t("gs12.cs.menu.noPhone", { name: t(p2.nameKey) }),
        });
      } else {
        items.push({ key: "wd", icon: "lock", label: t("gs12.cs.menu.what"), onSelect: () => setOpen({ person: p2, mode: "wd" }) });
      }
      return {
        id: p2.id, live: true,
        cells: {
          who: (
            <span style={{ display: "flex", gap: 11, alignItems: "center", minWidth: 0 }}>
              <Avatar name={t(p2.nameKey)} size={28} />
              <span style={{ minWidth: 0 }}>
                <span style={ty("small", { display: "block", color: c.ink, fontWeight: 600 })}>{t(p2.nameKey)}</span>
                {p2.exited ? <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 1 })}>{t("gs12.cs.exited")}</span> : null}
              </span>
            </span>
          ),
          campus: <span style={ty("small", { color: c.inkMuted })}>{t("gs11.campus." + p2.campusKey)}</span>,
          state: (
            <span>
              <StatusMark role={look.role} glyph={look.glyph} word={t(look.key)} />
              {p2.asked >= 3 ? <span style={ty("caption", { display: "block", color: c.lateText, marginTop: 3 })}>{t("gs12.cs.askedN", { n: p2.asked })}</span> : null}
            </span>
          ),
          since: <span style={ty("caption", { color: c.inkMuted })}>{t(p2.sinceKey, p2.sinceVars)}</span>,
          act: <span style={{ display: "flex", justifyContent: "flex-end" }}><ActionMenu ariaLabel={t("gs12.cs.menuAria", { name: t(p2.nameKey) })} size={30} items={items} /></span>,
        },
      };
    });

    return (
      <Card
        icon="check" iconTone="present" title={t("gs12.consent.title")} sub={t("gs12.consent.sub", { v: N.version, date: "1 Apr 2026" })}
        action={<Button kind="primary" size="sm" iconLeft="document" onClick={() => setOpen({ mode: "new" })}>{t("gs12.nn.cta2")}</Button>}
      >
        <div style={{ display: "flex", gap: 28, flexWrap: "wrap", paddingBottom: 16, marginBottom: 4, borderBottom: "1px solid " + c.rule }}>
          {counts.map((x) => (
            <div key={x.k}>
              <div style={ty("caption", { color: c.inkFaint, marginBottom: 4 })}>{x.k}</div>
              <Figure value={x.v} size="md" weight={700} color={x.tone} />
            </div>
          ))}
          <div style={{ marginLeft: "auto", maxWidth: 360 }}>
            <p style={ty("caption", { color: c.inkMuted, margin: 0 })}>{t("gs12.cs.ofTotal", { n: num(N.total) })}</p>
          </div>
        </div>

        {rows.length === 0 ? (
          <EmptyState compact head={t("gs12.cs.empty.head")} body={t("gs12.cs.empty.body")} />
        ) : (
          <React.Fragment>
            <p style={ty("caption", { color: c.inkMuted, margin: "14px 0 10px" })}>{t("gs12.cs.listNote")}</p>
            <Register columns={columns} rows={rows} />
          </React.Fragment>
        )}

        {open && open.mode === "ask" ? <AskAgainPop person={open.person} onClose={() => setOpen(null)} onDone={(m) => { setOpen(null); onAction(m); }} /> : null}
        {open && open.mode === "wd" ? <WithdrawalPop person={open.person} onClose={() => setOpen(null)} /> : null}
        {open && open.mode === "new" ? <NewNoticePop onClose={() => setOpen(null)} onDone={(m) => { setOpen(null); onAction(m); }} /> : null}
      </Card>
    );
  }

  /* ---- WHO OPENED WHOSE IDENTIFIERS --------------------------------
     Masking is only worth something if opening it is seen. Every case
     here is one that deserves a second look: a reveal with no reason,
     the same record opened four times in an hour, and a reveal by
     somebody whose permission has since been taken away. */
  const PII_ACCESS_LOG = [
    {
      id: "pa1", viewerKey: "gs12.n.meera", roleKey: "gs5.role.hr", subjectKey: "gs12.n.suresh",
      fieldKey: "gs12.pa.f.bank", when: "8 Aug, 14:22", reasonKey: "gs12.pa.r.bankFix",
      grantKey: "gs12.pa.g.hr", grantedKey: "gs12.pa.by.you", grantedOn: "2 Jun 2026", inForce: true, count: 1,
    },
    {
      id: "pa2", viewerKey: "gs12.n.sunitaK", roleKey: "gs5.role.payrollOfficer", subjectKey: "gs12.n.arvind",
      fieldKey: "gs12.pa.f.pan", when: "6 Aug, 11:05", reasonKey: null,
      grantKey: "gs12.pa.g.payroll", grantedKey: "gs12.pa.by.you", grantedOn: "14 Apr 2026", inForce: true, count: 1,
    },
    {
      id: "pa3", viewerKey: "gs12.n.meera", roleKey: "gs5.role.hr", subjectKey: "gs12.n.kavya",
      fieldKey: "gs12.pa.f.aadhaar", when: "4 Aug, 11:02–11:40", reasonKey: "gs12.pa.r.verify",
      grantKey: "gs12.pa.g.hr", grantedKey: "gs12.pa.by.you", grantedOn: "2 Jun 2026", inForce: true, count: 4,
    },
    {
      id: "pa4", viewerKey: "gs12.n.devansh", roleKey: "gs5.role.groupAdmin", subjectKey: "gs12.n.ananya",
      fieldKey: "gs12.pa.f.salary", when: "29 Jul, 16:48", reasonKey: "gs12.pa.r.audit",
      grantKey: "gs12.pa.g.temp", grantedKey: "gs12.pa.by.you", grantedOn: "28 Jul 2026", inForce: false, removedOn: "12 Aug 2026", count: 1,
    },
  ];

  function RevealPop({ row, onClose }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    return (
      <Pop title={t("gs12.pa.pop.title", { field: t(row.fieldKey) })} sub={t("gs12.pa.pop.sub", { subject: t(row.subjectKey), when: row.when })} onClose={onClose} width={620}>
        <DevFact label={t("gs12.pa.f.who")}>
          <span style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <Avatar name={t(row.viewerKey)} size={28} />
            <span>
              <span style={ty("small", { display: "block", color: c.ink, fontWeight: 600 })}>{t(row.viewerKey)}</span>
              <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 1 })}>{t(row.roleKey)}</span>
            </span>
          </span>
        </DevFact>
        <DevFact label={t("gs12.pa.f.times")}>
          {row.count > 1
            ? <React.Fragment>
                <Value>{t("gs12.pa.repeat", { n: row.count })}</Value>
                <div style={{ marginTop: 3 }}><Value muted>{t("gs12.pa.repeatNote")}</Value></div>
              </React.Fragment>
            : <Value>{t("gs12.pa.once")}</Value>}
        </DevFact>
        <DevFact label={t("gs12.pa.f.reason")}>
          {row.reasonKey
            ? <Value>{t(row.reasonKey)}</Value>
            : <React.Fragment>
                <StatusMark role="late" glyph="alert" word={t("gs12.pa.noReason")} />
                <div style={{ marginTop: 5 }}><Value muted>{t("gs12.pa.noReasonNote")}</Value></div>
              </React.Fragment>}
        </DevFact>
        <DevFact label={t("gs12.pa.f.grant")} last>
          <Value>{t(row.grantKey)}</Value>
          <div style={{ marginTop: 3 }}><Value muted>{t("gs12.pa.grantedBy", { who: t(row.grantedKey), date: row.grantedOn })}</Value></div>
          {row.inForce ? (
            <div style={{ marginTop: 7 }}><StatusMark role="present" glyph="check" word={t("gs12.pa.inForce")} /></div>
          ) : (
            <div style={{ marginTop: 7 }}>
              <StatusMark role="off" glyph="lock" word={t("gs12.pa.removed", { date: row.removedOn })} />
              <div style={{ marginTop: 5 }}><Value muted>{t("gs12.pa.removedNote")}</Value></div>
            </div>
          )}
        </DevFact>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20, paddingTop: 16, borderTop: "1px solid " + c.rule }}>
          <Button kind="primary" onClick={onClose}>{t("gs2.pop.close")}</Button>
        </div>
      </Pop>
    );
  }

  function PiiAccessCard() {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [openId, setOpenId] = useState(null);
    const open = openId ? PII_ACCESS_LOG.filter((r) => r.id === openId)[0] : null;
    const totalReveals = PII_ACCESS_LOG.reduce((s, r) => s + r.count, 0);
    const viewers = [];
    PII_ACCESS_LOG.forEach((r) => { if (viewers.indexOf(r.viewerKey) === -1) viewers.push(r.viewerKey); });
    const noReason = PII_ACCESS_LOG.filter((r) => !r.reasonKey).length;

    const columns = [
      { key: "who", label: t("gs12.pa.col.who") },
      { key: "subject", label: t("gs12.pa.col.subject"), width: 170 },
      { key: "field", label: t("gs12.pa.col.field"), width: 160 },
      { key: "when", label: t("gs12.pa.col.when"), mono: true, width: 150 },
      { key: "why", label: t("gs12.pa.col.why") },
      { key: "act", label: t("gs2.col.act"), align: "right", width: 78, act: true },
    ];
    const rows = PII_ACCESS_LOG.map((r) => ({
      id: r.id, live: true,
      cells: {
        who: (
          <span style={{ display: "flex", gap: 10, alignItems: "center", minWidth: 0 }}>
            <Avatar name={t(r.viewerKey)} size={28} />
            <span style={{ minWidth: 0 }}>
              <span style={ty("small", { display: "block", color: c.ink, fontWeight: 600 })}>{t(r.viewerKey)}</span>
              <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 1 })}>{t(r.roleKey)}</span>
            </span>
          </span>
        ),
        subject: <span style={ty("small", { color: c.inkMuted })}>{t(r.subjectKey)}</span>,
        field: <Chip>{t(r.fieldKey)}</Chip>,
        when: (
          <span>
            <span style={{ display: "block" }}>{r.when}</span>
            {r.count > 1 ? <span style={ty("caption", { display: "block", color: c.lateText, marginTop: 2 })}>{t("gs12.pa.repeat", { n: r.count })}</span> : null}
          </span>
        ),
        why: r.reasonKey
          ? <span style={ty("small", { color: c.inkMuted })}>{t(r.reasonKey)}</span>
          : <StatusMark role="late" glyph="alert" word={t("gs12.pa.noReason")} />,
        act: (
          <span style={{ display: "flex", justifyContent: "flex-end" }}>
            <ActionMenu ariaLabel={t("gs12.pa.menuAria")} size={30}
              items={[{ key: "open", icon: "scan", label: t("gs12.pa.menu.open"), onSelect: () => setOpenId(r.id) }]} />
          </span>
        ),
      },
    }));

    return (
      <Card icon="scan" iconTone="off" title={t("gs12.access.title")} sub={t("gs12.access.sub")}>
        <div style={{ display: "flex", gap: 28, flexWrap: "wrap", paddingBottom: 16, marginBottom: 14, borderBottom: "1px solid " + c.rule }}>
          <div>
            <div style={ty("caption", { color: c.inkFaint, marginBottom: 4 })}>{t("gs12.pa.k.reveals")}</div>
            <Figure value={num(totalReveals)} size="md" weight={700} color={c.ink} />
          </div>
          <div>
            <div style={ty("caption", { color: c.inkFaint, marginBottom: 4 })}>{t("gs12.pa.k.people")}</div>
            <Figure value={num(viewers.length)} size="md" weight={700} color={c.ink} />
          </div>
          <div>
            <div style={ty("caption", { color: c.inkFaint, marginBottom: 4 })}>{t("gs12.pa.k.noReason")}</div>
            <Figure value={num(noReason)} size="md" weight={700} color={noReason ? c.lateText : c.ink} />
          </div>
        </div>
        {rows.length ? (
          <Register columns={columns} rows={rows} footer={<span style={ty("caption", { color: c.inkFaint })}>{t("gs12.pa.foot")}</span>} />
        ) : (
          <EmptyState compact head={t("gs12.access.empty.head")} body={t("gs12.access.empty.body")} />
        )}
        {open ? <RevealPop row={open} onClose={() => setOpenId(null)} /> : null}
      </Card>
    );
  }

  function TabDataProtection() {
    const [flash, setFlash] = useState(null);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: G3.layout.gap }}>
        <Flash text={flash} />
        <ConsentCard onAction={(msg) => msg && setFlash(msg)} />
        <PiiAccessCard />
      </div>
    );
  }

  /* ============================================================
     SHELL — GASystems, the exported page
     ============================================================ */
  function GASystems({ role, onNavigate }) {
    const { c } = useTheme();
    const { t, lang } = useLang();
    const L = G3.layout;
    const [tab, setTab] = useState("org");
    const TABS = [
      { key: "org", label: t("gs.tab.org") },
      { key: "calendar", label: t("gs.tab.calendar") },
      { key: "policy", label: t("gs.tab.policy") },
      { key: "connections", label: t("gs.tab.connections") },
      { key: "dp", label: t("gs.tab.dp") },
    ];
    return (
      <div className="nv3" style={{ display: "flex", minHeight: "100vh", background: c.page, color: c.ink, fontFamily: G3.font.ui }}>
        <Rail role={role || "groupAdmin"} active="gaSystems" onNavigate={onNavigate} initials={t("gs.you.initials")} />
        <main style={{ flex: 1, minWidth: 0, position: "relative", overflowX: "clip" }}>
          <Motif />
          <div style={{ position: "relative", zIndex: 1, maxWidth: L.contentMax, margin: "0 auto", padding: "22px " + L.contentPadX + "px 56px" }}>
            <TopStrip label={t("gs.title")} />
            <PageHeader title={t("gs.title")} meta={t("gs.top.scope")} />

            <Tabs items={TABS} active={tab} onChange={setTab} ariaLabel={t("gs.tabs.aria")} idBase="ga-systems" />

            <div style={{ marginTop: 20 }}>
              {tab === "org" ? (
                <TabPanel idBase="ga-systems" tabKey="org"><TabOrganisation /></TabPanel>
              ) : tab === "policy" ? (
                <TabPanel idBase="ga-systems" tabKey="policy"><TabPolicy /></TabPanel>
              ) : tab === "calendar" ? (
                <TabPanel idBase="ga-systems" tabKey="calendar"><TabCalendar /></TabPanel>
              ) : tab === "reports" ? (
                <TabPanel idBase="ga-systems" tabKey="reports"><TabReports /></TabPanel>
              ) : tab === "connections" ? (
                <TabPanel idBase="ga-systems" tabKey="connections"><TabConnections /></TabPanel>
              ) : (
                <TabPanel idBase="ga-systems" tabKey="dp"><TabDataProtection /></TabPanel>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  window.Pages3 = window.Pages3 || {};
  window.Pages3.GASystems = GASystems;
})();
