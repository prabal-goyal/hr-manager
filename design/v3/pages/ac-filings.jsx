/* @jsxRuntime classic */
/* ============================================================
   Naveya — the filing half of the Accountant's desk
   window.Pages3.ACFilings (AC-04) · window.Pages3.ACFile (AC-05)

   AC-04 answers WHERE DOES EACH STATUTORY FILING STAND, and AC-05
   answers IS THIS RETURN CORRECT ENOUGH TO SUBMIT TO THE GOVERNMENT.
   They are one object seen at two distances: the register lists every
   return by kind x period x entity, and opening a row walks the same
   return through the only sequence a filing has —

     validate -> generate -> validate again at the portal -> file it

   THREE RULES THE SCREENS ENFORCE RATHER THAN MENTION:

   1. A RETURN FROM AN UNAPPROVED RUN IS A FALSE RETURN. Generate is
      shown DISABLED with the reason when the period's payroll has not
      been approved, never hidden and never quietly allowed.
   2. AN UNACKNOWLEDGED FILING IS NOT A FILING. Marking a return filed
      requires the acknowledgement number; without it the control
      stays closed.
   3. NOTHING IS DELETED. A rejection by the portal reopens the clock;
      a correction is a NEW return that supersedes, and the original
      is kept (screen-inventory AC-04 / spec section 4.2, append-only).

   The validation list is this screen's own fact: per employee, per
   field, with the fix a route to the staff record rather than an
   editable cell. Fixing a PAN here would put a second copy of it in
   the product.

   SPEC — docs/development-specification.md M11; screen-inventory
   AC-04 (filings register) and AC-05 (filing generation & validation).
   ============================================================ */
(function () {
  const G3 = window.G3;
  const UI = window.UI3;
  const { useState } = React;
  const {
    useTheme, useLang, addStrings, Card, Register, Button, Chip, StatusMark,
    Icon, ActionMenu, EmptyState, Field, Input, Select, StackBar, Meter, Modal, Band,
    inr, num,
    CampusSwitch, campusLabel, campusOptions, inCampus, campusOfCode, CAMPUS_ALL,
  } = UI;

  const D = function () { return (window.Pages3 && window.Pages3.ACData) || null; };
  const P = function () { return (window.Pages3 && window.Pages3.ACParts) || null; };

  addStrings({
    en: {
      "acf.crumb": "Filings",
      "acf.title": "Where every return stands",
      "acf.band": "What has to be filed",
      "acf.mix.overdue": "Overdue",
      "acf.mix.due": "Due",
      "acf.mix.ready": "Generated, not filed",
      "acf.mix.filed": "Filed",
      "acf.m.open": "Open returns",
      "acf.m.openNote": "Across both entities.",
      "acf.m.money": "Riding on them",
      "acf.m.moneyNote": "What the open returns carry.",
      "acf.m.next": "Next due",
      "acf.m.nextNote": "{what}, {when}.",
      "acf.m.nextNone": "Nothing due",
      "acf.m.cfg": "Pinned configuration",
      "acf.m.cfgNote": "Every figure below was computed on this version.",

      "acf.col.filing": "Return",
      "acf.col.covers": "Covers",
      "acf.cov.both": "Both campuses",
      "acf.cov.hyd": "Hyderabad",
      "acf.reg": "Every return",
      "acf.col.entity": "Entity",
      "acf.col.period": "Period",
      "acf.col.amount": "Amount",
      "acf.col.due": "Due",
      "acf.col.step": "Step",
      "acf.col.state": "State",
      "acf.col.ack": "Acknowledgement",
      "acf.noAck": "—",
      "acf.f.kind": "Kind",
      "acf.f.kindAll": "Every kind",
      "acf.f.entity": "Entity",
      "acf.f.entityAll": "Both entities",
      "acf.f.state": "Status",
      "acf.f.stateOpen": "Due and overdue",
      "acf.f.stateAll": "Everything",
      "acf.f.stateFiled": "Filed",
      "acf.empty": "Nothing matches those filters",
      "acf.emptyBody": "Widen the status filter to read the returns that are already acknowledged.",
      "acf.foot": "{n} returns shown. A filed return keeps its artefact and its acknowledgement for as long as the records are retained.",

      "acf.a.open": "Open the return",
      "acf.a.generate": "Generate it",
      "acf.a.markFiled": "Mark it filed",
      "acf.a.rejected": "Record a portal rejection",
      "acf.a.revise": "File a revised return",
      "acf.a.download": "Download the artefact",
      "acf.blocked.run": "The {p} payroll is not approved yet",

      /* ---- AC-05, the workspace ---- */
      "ac5.crumb": "Filing workspace",
      "ac5.gen.modalSub": "What is about to be produced, and from what. Generating supersedes any earlier artefact, which is kept against the return.",
      "ac5.gen.confirm": "Generate it",
      "ac5.cancel": "Cancel",
      "ac5.gen.what": "Return",
      "ac5.gen.people": "People in it",
      "ac5.reasonLabel": "Reason",
      "ac5.reasonPick": "Choose a reason",
      "ac5.dl.sub": "An audited download. Who took it and when is recorded against the return.",
      "ac5.dl.go": "Download it",
      "ac5.dl.audit": "Downloads of a statutory artefact are logged. The file itself is unchanged by being taken.",
      "ac5.done.generated": "The artefact is ready",
      "ac5.done.filed": "Recorded as filed",
      "ac5.done.rejected": "The rejection is recorded",
      "ac5.done.revised": "The revision is started",
      "ac5.done.excluded": "They are out of this return",
      "ac5.done.downloaded": "Downloaded",
      "ac5.done.sub": "Everything on this return is append-only, so this is on its record from now on.",
      "ac5.done.ok": "Close",
      "ac5.doneBody.generated": "Validate again at the portal if the return needs it, then record the acknowledgement here once the portal gives you one.",
      "ac5.doneBody.filed": "The compliance calendar clears and the return keeps its artefact and its acknowledgement for as long as the records are retained.",
      "ac5.doneBody.rejected": "The return is actionable again and the due-date clock resumes from where it was. The original artefact is kept.",
      "ac5.doneBody.revised": "A new return supersedes this one. Both stay on the record — nothing was edited and nothing was removed.",
      "ac5.doneBody.excluded": "The exclusion is recorded against this return and carried into next period’s exception list.",
      "ac5.doneBody.downloaded": "The download is logged with your name and the time.",
      "ac5.back": "Back to the filings",
      "ac5.title": "{kind} · {period}",
      "ac5.stop.validate": "Validate",
      "ac5.stop.filed": "Filed",
      "ac5.stopAt.validate": "The staff records behind this return. A blocking error is one the portal will reject.",
      "ac5.stopAt.generate": "Validation passed. The artefact is produced from what passed.",
      "ac5.stopAt.file": "Upload it to the portal, then record the acknowledgement it gives you.",
      "ac5.stopAt.filed": "Acknowledged, and kept with its artefact for as long as the records are retained.",
      "ac5.f.due": "Due",
      "ac5.file.ackOnly": "A return the portal has not acknowledged is not filed.",
      "ac5.fvu.needed": "Not run yet",
      "ac5.stop.generate": "Generate",
      "ac5.stop.file": "File",
      "ac5.src.heads": "People in the return",
      "ac5.src.amount": "Amount",
      "ac5.src.period": "Period",
      "ac5.src.cfg": "Computed on",

      "ac5.val": "What validation found",
      "ac5.val.clean": "Every record passed",
      "ac5.val.blocking": "{n} blocking",
      "ac5.val.warning": "{n} to look at",
      "ac5.val.excluded": "{n} excluded",
      "ac5.val.fix": "Find them on the register",
      "ac5.val.exclude": "Exclude with a reason",

      "ac5.excl.head": "Leave {name} out of this return",
      "ac5.excl.hint": "An exclusion is recorded against the return and carried into next period's exception list. It does not delete anything.",
      "ac5.excl.r1": "No PAN, and the person has left",
      "ac5.excl.r2": "Paid through another entity this period",
      "ac5.excl.r3": "Identifier under correction with the department",
      "ac5.excl.go": "Exclude them",
      "ac5.excl.cancel": "Keep them in",
      "ac5.excl.done": "{name} is out of this return. The reason is on the record.",

      "ac5.gen": "The artefact",
      "ac5.gen.go": "Generate the return",
      "ac5.gen.again": "Generate it again",
      "ac5.gen.blocked": "{n} blocking errors to clear first",
      "ac5.gen.notApproved": "The {p} payroll is not approved, so this would be a false return",
      "ac5.gen.fmt": "Format version",
      "ac5.gen.file": "File",
      "ac5.gen.made": "Generated {when} by {who}",
      "ac5.gen.supersede": "Regenerating supersedes this artefact. The old one is kept against the return.",
      "ac5.gen.download": "Download it",

      "ac5.fvu": "The government validator",
      "ac5.fvu.run": "Run the validator",
      "ac5.fvu.pass": "The validator accepted it",
      "ac5.fvu.passBody": "No errors returned. The file can be submitted at the portal.",
      "ac5.fvu.fail": "The validator rejected it",
      "ac5.fvu.na": "This return is not validated by a government utility. It is submitted directly at the portal.",

      "ac5.file": "Saying it was filed",
      "ac5.fileSub": "A return the portal has not acknowledged is not filed. The acknowledgement number is what makes it one.",
      "ac5.file.go": "Mark it filed",
      "ac5.file.date": "Filed on",
      "ac5.file.ack": "Acknowledgement number",
      "ac5.file.ackPh": "As it appears on the portal receipt",
      "ac5.file.ackMissing": "Without the acknowledgement this is not a filing",
      "ac5.file.receipt": "Receipt",
      "ac5.file.receiptNote": "The portal's receipt is kept with the return.",
      "ac5.file.confirm": "Record the filing",
      "ac5.file.cancel": "Not yet",
      "ac5.file.done": "Filed on {when}, acknowledgement {ack}.",
      "ac5.file.clears": "The compliance calendar clears when this is recorded.",

      "ac5.rej.head": "The portal rejected this return",
      "ac5.rej.hint": "The return goes back to actionable and the due-date clock resumes from where it was. The original artefact is kept.",
      "ac5.rej.r1": "Totals did not match the challan",
      "ac5.rej.r2": "An identifier failed at the portal",
      "ac5.rej.r3": "Format version no longer accepted",
      "ac5.rej.go": "Record the rejection",
      "ac5.rej.cancel": "Cancel",

      "ac5.rev.head": "File a revised return",
      "ac5.rev.hint": "A revision is a new return that supersedes this one. Nothing is edited and nothing is removed — both stay on the record.",
      "ac5.rev.r1": "Arrears were posted after it was filed",
      "ac5.rev.r2": "A correction to somebody's identifier",
      "ac5.rev.r3": "A head was mis-stated",
      "ac5.rev.go": "Start the revision",
      "ac5.rev.cancel": "Cancel",

      "ac5.trail": "Everything that happened to this return",
      "ac5.tr.generated": "Artefact generated",
      "ac5.tr.validated": "Validated",
      "ac5.tr.filed": "Filed with the portal",
      "ac5.tr.rejected": "Rejected by the portal",
      "ac5.tr.excluded": "Somebody excluded",
      "ac5.trailFoot": "Append-only. A later return supersedes an earlier one; neither is removed.",
      "ac5.gone": "That return is not open",
      "ac5.goneBody": "Open one from the filings register.",
    },
  });

  /* ============================================================
     WHAT VALIDATION FOUND. This is AC-05's own fact and belongs
     nowhere else: a return's rules are the return's, and a missing
     UAN is only an error in the context of an ECR.

     Every row names the PERSON and the FIELD, because "17 errors" is
     not something anybody can act on. The fix is a route to the staff
     record, never an editable cell here.
     ============================================================ */
  const FINDINGS = {
    "f-ecr-07": [
      { id: "v1", nameKey: "acv.n.rohit", staff: "NAV-0161", fieldKey: "acv.f.uan", sev: "block", whyKey: "acv.w.uanMissing" },
      { id: "v2", nameKey: "acv.n.zoya", staff: "NAV-0263", fieldKey: "acv.f.uan", sev: "block", whyKey: "acv.w.uanFormat" },
      { id: "v3", nameKey: "acv.n.neha", staff: "NAV-0250", fieldKey: "acv.f.wage", sev: "warn", whyKey: "acv.w.wagePart" },
    ],
    "f-ecr-07-f": [
      { id: "v4", nameKey: "acv.n.farah", staff: "NAV-0233", fieldKey: "acv.f.uan", sev: "block", whyKey: "acv.w.uanMissing" },
    ],
    "f-24q-q2": [
      { id: "v5", nameKey: "acv.n.manju", staff: "NAV-0054", fieldKey: "acv.f.pan", sev: "block", whyKey: "acv.w.panMissing" },
      { id: "v6", nameKey: "acv.n.prakash", staff: "NAV-0067", fieldKey: "acv.f.pan", sev: "block", whyKey: "acv.w.panFormat" },
      { id: "v7", nameKey: "acv.n.divya", staff: "NAV-0199", fieldKey: "acv.f.decl", sev: "warn", whyKey: "acv.w.declUnverified" },
      { id: "v8", nameKey: "acv.n.sunita", staff: "NAV-0011", fieldKey: "acv.f.pan", sev: "warn", whyKey: "acv.w.panExited" },
    ],
    "f-pt-ka-07": [],
    "f-pt-tg-07": [],
    "f-pt-ka-07-f": [],
    "f-pt-tg-06": [],
  };

  addStrings({
    en: {
      "acv.n.rohit": "Rohit Malhotra", "acv.n.zoya": "Zoya Ahmed", "acv.n.neha": "Neha Bhatt",
      "acv.n.farah": "Farah Sheikh", "acv.n.manju": "Manjunath Gowda", "acv.n.prakash": "Prakash Bhandari",
      "acv.n.divya": "Divya Prakash", "acv.n.sunita": "Sunita Menon",
      "acv.f.uan": "Universal account number",
      "acv.f.pan": "Permanent account number",
      "acv.f.wage": "Wage base",
      "acv.f.decl": "Investment declaration",
      "acv.w.uanMissing": "No UAN on the record, and an ECR line cannot be filed without one.",
      "acv.w.uanFormat": "The UAN is not twelve digits, so the portal will reject the line.",
      "acv.w.wagePart": "Joined mid-month, so the wage base is a part month. Correct, but worth a look.",
      "acv.w.panMissing": "No PAN, so the tax deducted cannot be credited to anybody.",
      "acv.w.panFormat": "The PAN does not match the department's format.",
      "acv.w.declUnverified": "Declared heads are still unverified, so the deduction may change.",
      "acv.w.panExited": "Left in June. The quarter still carries two months of their tax.",
    },
  });

  /* a finding is a person's record, so it carries that person's
     campus and narrows with the scope */
  function findingsFor(id, campus) {
    return (FINDINGS[id] || []).filter(function (x) { return inCampus(campus, campusOfCode(x.staff)); });
  }

  /* A DIALOG RESTATES WHAT IT IS ABOUT TO ACT ON. The reader opened it
     from a menu on a row, and a confirm with no facts in it is a
     confirm nobody can check. */
  function DlgFacts({ rows }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div style={{ border: "1px solid " + c.rule, borderRadius: G3.r.sm, padding: "4px 14px" }}>
        {rows.map(function (r, i) {
          return (
            <div key={r.k} style={{
              display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 14,
              padding: "9px 0", borderTop: i ? "1px solid " + c.rule : "none",
            }}>
              <span style={ty("caption", { color: c.inkMuted, minWidth: 0 })}>{r.label}</span>
              <span style={G3.fig("sm", { color: c.ink, fontWeight: 700, whiteSpace: "nowrap" })}>{r.v}</span>
            </div>
          );
        })}
      </div>
    );
  }

  /* ============================================================
     The same three instruments PY-07 uses, because it is the same
     problem: a process object, its standing facts, and what is in the
     way of the next act.
     ============================================================ */
  function FilingSteps({ at }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const i = FILING_STEPS.indexOf(at);
    return (
      <section aria-label={t("ac5.stop." + at)} style={{
        border: "1px solid " + c.rule, borderRadius: G3.r.md, background: c.surface,
        padding: "18px 20px 16px", marginBottom: G3.layout.gap,
      }}>
        <ol style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
                     listStyle: "none", margin: 0, padding: 0 }}>
          {FILING_STEPS.map(function (k, n) {
            const done = n < i, here = n === i;
            return (
              <li key={k} aria-current={here ? "step" : undefined}
                style={{ minWidth: 0, position: "relative", textAlign: "center", paddingInline: 4 }}>
                {n ? (
                  <span aria-hidden="true" style={{
                    position: "absolute", top: 12, insetInlineEnd: "50%", width: "100%", height: 2,
                    background: done || here ? c.accent : c.gutter,
                  }} />
                ) : null}
                <span aria-hidden="true" style={{
                  position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center",
                  width: 26, height: 26, borderRadius: G3.r.pill, boxSizing: "border-box",
                  background: done || here ? c.accent : c.surface,
                  border: "1.5px solid " + (done || here ? c.accent : c.borderStrong),
                  color: done || here ? c.onAction : c.inkFaint,
                }}>
                  {done ? <Icon name="check" size={14} />
                    : <span style={G3.fig("xs", { fontWeight: 700, lineHeight: 1 })}>{n + 1}</span>}
                </span>
                <span style={ty("small", {
                  display: "block", marginTop: 8,
                  color: here ? c.ink : done ? c.inkMuted : c.inkFaint,
                  fontWeight: here ? 700 : 500,
                })}>{t("ac5.stop." + k)}</span>
              </li>
            );
          })}
        </ol>
        <p style={ty("caption", { color: c.inkMuted, margin: "18px 0 0" })}>{t("ac5.stopAt." + at)}</p>
      </section>
    );
  }

  function FilingFacts({ items }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <section style={{ border: "1px solid " + c.rule, borderRadius: G3.r.md, background: c.surface,
                        padding: "15px 0", marginBottom: G3.layout.gap }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", rowGap: 14 }}>
          {items.map(function (x, i) {
            return (
              <div key={x.k} style={{ minWidth: 0, paddingInline: 20,
                                      borderInlineStart: i ? "1px solid " + c.rule : "none" }}>
                <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase",
                                            letterSpacing: "0.06em" })}>{x.label}</div>
                <div style={Object.assign(x.fig ? G3.fig("md", {}) : ty("small", {}),
                  { color: c.ink, fontWeight: 600, marginTop: 5 })}>{x.v}</div>
                {x.note ? <div style={ty("caption", { color: c.inkMuted, marginTop: 3 })}>{x.note}</div> : null}
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  /* only the records still in the way, blocking ones first. A blocking
     error is one the portal will reject; a warning is one a human
     should read. Both are fixed on the STAFF RECORD, never here --
     an identifier typed into a return would be a second copy of it. */
  function FilingChecks({ rows, onFix, onExclude }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    if (!rows.length) {
      return (
        <section style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap",
                          border: "1px solid " + c.rule, borderRadius: G3.r.md, background: c.surface,
                          padding: "14px 20px" }}>
          <StatusMark role="present" glyph="check" word={t("ac5.val.clean")} />
        </section>
      );
    }
    const blocks = rows.filter(function (r) { return r.sev === "block"; }).length;
    return (
      <section aria-label={t("ac5.val")} style={{
        border: "1px solid " + (blocks ? c.dangerText : c.rule), borderRadius: G3.r.md,
        background: c.surface, overflow: "hidden",
      }}>
        <header style={{ display: "flex", gap: 14, alignItems: "baseline", justifyContent: "space-between",
                         flexWrap: "wrap", padding: "15px 20px 13px" }}>
          <h2 style={ty("h3", { margin: 0, color: c.ink })}>{t("ac5.val")}</h2>
          <span style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {blocks ? (
              <span style={ty("caption", { color: c.dangerText, fontWeight: 700 })}>
                {t("ac5.val.blocking", { n: num(blocks) })}
              </span>
            ) : null}
            {rows.length - blocks ? (
              <span style={ty("caption", { color: c.lateText, fontWeight: 700 })}>
                {t("ac5.val.warning", { n: num(rows.length - blocks) })}
              </span>
            ) : null}
          </span>
        </header>
        {rows.map(function (x) {
          const block = x.sev === "block";
          return (
            <div key={x.id} style={{ display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap",
                                     borderTop: "1px solid " + c.rule, padding: "13px 20px 14px" }}>
              <span aria-hidden="true" style={{ display: "flex", marginTop: 1,
                                                color: block ? c.dangerText : c.lateText }}>
                <Icon name={block ? "alert" : "clock"} size={17} />
              </span>
              <div style={{ minWidth: 0, flex: "1 1 300px" }}>
                <div style={ty("small", { color: c.ink, fontWeight: 600 })}>
                  {t(x.nameKey)} <span style={G3.fig("xs", { color: c.inkFaint })}>{x.staff}</span>
                </div>
                <p style={ty("caption", { color: c.inkMuted, margin: "3px 0 0" })}>{t(x.whyKey)}</p>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <Button kind="secondary" size="sm" iconRight="arrow"
                  onClick={function () { onFix(x); }}>{t("ac5.val.fix")}</Button>
                <Button kind="quiet" size="sm" onClick={function () { onExclude(x); }}>
                  {t("ac5.val.exclude")}
                </Button>
              </div>
            </div>
          );
        })}
      </section>
    );
  }

  /* ---------- the state a return is actually in ---------- */
  /* Four steps, the same four for every return. The file validation
     utility is NOT a fifth: it is a condition on filing, so it gates
     the act inside step 3 rather than standing beside it. */
  const FILING_STEPS = ["validate", "generate", "file", "filed"];
  function stageOf(f, st, blocking) {
    if (f.filedOn || st.filed) return "filed";
    if (st.generated) return "file";
    if (!blocking && f.periodReady) return "generate";
    return "validate";
  }
  function needsFvu(f) { return f.kindKey === "ac.f.24q"; }
  /* the step a return is at, from its own facts alone -- the register
     has no workspace session to read, and must not invent one */
  function listStepOf(f) {
    if (f.filedOn) return "filed";
    return (blockingOf(f, [], CAMPUS_ALL) || !f.periodReady) ? "validate" : "generate";
  }
  const STEP_TONE = { validate: "off", generate: "leave", file: "late", filed: "present" };
  const STEP_GLYPH = { validate: "scan", generate: "document", file: "clock", filed: "check" };
  function blockingOf(f, excluded, campus) {
    return findingsFor(f.id, campus).filter(function (x) {
      return x.sev === "block" && excluded.indexOf(x.id) < 0;
    }).length;
  }

  /* ============================================================
     AC-04 — THE REGISTER
     ============================================================ */
  /* Professional tax is registered per state, and the trust's Telangana
     registration belongs to its Hyderabad place of business -- neither of
     the two campuses this desk's switch offers. Everything else is filed
     under the one establishment code, which covers both. */
  const COVER_WORD = { hyderabad: "acf.cov.hyd" };
  function coversOf(f) { return f.stateFilter === "tg" ? "hyderabad" : CAMPUS_ALL; }
  function coversWord(t, f) {
    const cp = coversOf(f);
    if (cp === CAMPUS_ALL) return t("acf.cov.both");
    return COVER_WORD[cp] ? t(COVER_WORD[cp]) : campusLabel(t, cp);
  }

  function ACFilings({ role, onNavigate }) {
    /* the campus narrows this table the way the kind and the entity do,
       and from the same row of controls */
    const [campus, setCampus] = useState(CAMPUS_ALL);
    const { c } = useTheme();
    const { t, ty } = useLang();
    const d = D(), parts = P();
    const [kind, setKind] = useState("all");
    const [ent, setEnt] = useState("all");
    const [status, setStatus] = useState("open");

    if (!d || !parts) return null;
    const Shell = parts.Shell;

    const all = d.sortedFilings();
    const rows = all.filter(function (f) {
      if (kind !== "all" && f.k !== kind) return false;
      if (ent !== "all" && f.e !== ent) return false;
      if (!inCampus(campus, coversOf(f))) return false;
      const sk = d.dueState(f).key;
      if (status === "open") return sk !== "filed";
      if (status === "filed") return sk === "filed" || !!f.filedOn;
      return true;
    });

    const openOnes = all.filter(function (f) { return d.dueState(f).key !== "filed"; });
    const counts = { overdue: 0, due: 0, ready: 0, filed: 0 };
    all.forEach(function (f) {
      const k = d.dueState(f).key;
      if (k === "overdue") counts.overdue += 1;
      else if (k === "filed") counts.filed += 1;
      else if (k === "short") counts.ready += 1;
      else counts.due += 1;
    });
    const riding = openOnes.reduce(function (n, f) {
      const v = f.amountFn ? f.amountFn() : 0;
      return n + (v || 0);
    }, 0);
    const next = openOnes.slice().sort(function (a, b) {
      return d.daysUntil(a.due) - d.daysUntil(b.due);
    })[0];

    const segments = [
      { key: "overdue", value: counts.overdue, label: t("acf.mix.overdue"), color: c.chartRed },
      { key: "due", value: counts.due, label: t("acf.mix.due"), color: c.chartAmber },
      { key: "ready", value: counts.ready, label: t("acf.mix.ready"), color: c.chartBlue },
      { key: "filed", value: counts.filed, label: t("acf.mix.filed"), color: c.chartGreen },
    ];

    const metrics = [
      { k: "open", label: t("acf.m.open"), value: num(openOnes.length), note: t("acf.m.openNote"), tone: c.chartSand },
      { k: "money", label: t("acf.m.money"), value: inr(riding), note: t("acf.m.moneyNote"), tone: c.chartAmber },
      {
        k: "next", label: t("acf.m.next"),
        value: next ? d.fmtDate(t, next.due) : t("acf.m.nextNone"),
        note: next ? t("acf.m.nextNote", { what: t(next.kindKey), when: d.dueWords(t, next, d.dueState(next)) }) : "",
        tone: c.chartRed,
      },
      /* a version number is a number; it is not a quantity of returns */
      { k: "cfg", label: t("acf.m.cfg"), value: d.CFG_JUL.v, bar: false, note: t("acf.m.cfgNote"), tone: c.chartPurple },
    ];

    /* the workspace is handed the return AND, when the reader picked a
       specific act from the menu, which modal to open on arrival —
       consumed once there, so a later visit opens plain */
    function openOne(id, act) {
      window.Pages3.acFilingId = id;
      window.Pages3.acFilingAct = act || null;
      if (onNavigate) onNavigate("acFile");
    }

    const columns = [
      { key: "filing", label: t("acf.col.filing") },
      { key: "entity", label: t("acf.col.entity") },
      { key: "covers", label: t("acf.col.covers"), width: 150 },
      { key: "period", label: t("acf.col.period") },
      { key: "amount", label: t("acf.col.amount"), align: "right", mono: true },
      { key: "due", label: t("acf.col.due"), mono: true },
      { key: "step", label: t("acf.col.step"), width: 150 },
      { key: "state", label: t("acf.col.state") },
      { key: "ack", label: t("acf.col.ack"), mono: true },
      { key: "act", label: "", align: "right", width: 52 },
    ];

    const rowData = rows.map(function (f) {
      const st = d.dueState(f);
      const amount = f.amountFn ? f.amountFn() : null;
      const ent2 = d.ENTITIES.filter(function (e) { return e.key === f.e; })[0];
      const periodWord = f.pLabelKey ? t(f.pLabelKey) : t("ac.mon." + Number(f.p.split("-")[1]));
      /* the menu is the only way into the workspace, and every entry
         says which act it opens rather than all of them saying "open".
         A stray click on a row is not a decision to start a return. */
      const items = [{ key: "open", label: t("acf.a.open"), icon: "arrow", onSelect: function () { openOne(f.id); } }];
      if (!f.filedOn) {
        items.push({
          key: "gen", label: t("acf.a.generate"), icon: "payroll", tone: "go",
          disabled: !f.periodReady,
          reason: f.periodReady ? null : t("acf.blocked.run", { p: periodWord }),
          onSelect: function () { openOne(f.id, "generate"); },
        });
        items.push({ key: "file", label: t("acf.a.markFiled"), icon: "check", onSelect: function () { openOne(f.id, "file"); } });
      } else {
        items.push({ key: "dl", label: t("acf.a.download"), icon: "download", onSelect: function () { openOne(f.id, "download"); } });
        items.push({ key: "rej", label: t("acf.a.rejected"), icon: "alert", tone: "danger", onSelect: function () { openOne(f.id, "reject"); } });
        items.push({ key: "rev", label: t("acf.a.revise"), icon: "arrow", onSelect: function () { openOne(f.id, "revise"); } });
      }
      return {
        id: f.id,
        cells: {
          filing: (
            <span style={{ display: "block" }}>
              <span style={ty("small", { color: c.ink, fontWeight: 700, display: "block" })}>
                {t(f.kindKey)}{f.stKey ? " · " + t(f.stKey) : ""}
              </span>
            </span>
          ),
          entity: <span style={ty("caption", { color: c.inkMuted })}>{ent2 ? t(ent2.nameKey) : ""}</span>,
          covers: <span style={ty("caption", { color: c.inkMuted })}>{coversWord(t, f)}</span>,
          period: <span style={ty("caption", { color: c.inkMuted })}>
            {f.pLabelKey ? t(f.pLabelKey) : t("ac.mon." + Number(f.p.split("-")[1]))}
          </span>,
          amount: amount == null ? <span style={{ color: c.inkFaint }}>{t("acf.noAck")}</span> : inr(amount),
          due: d.fmtDate(t, f.due),
          step: (function () {
            const k = listStepOf(f);
            return <StatusMark role={STEP_TONE[k]} glyph={STEP_GLYPH[k]} word={t("ac5.stop." + k)} />;
          }()),
          state: <StatusMark role={d.DUE_ROLE[st.key]} glyph={d.DUE_GLYPH[st.key]} word={d.dueWords(t, f, st)} />,
          ack: f.filedOn ? ("ACK-" + f.id.toUpperCase().replace(/-/g, "").slice(0, 9)) : <span style={{ color: c.inkFaint }}>{t("acf.noAck")}</span>,
          act: <ActionMenu ariaLabel={t("acf.a.open")} items={items} />,
        },
      };
    });

    return (
      <Shell role={role} active="acFilings" onNavigate={onNavigate} crumb={t("acf.crumb")}
        title={t("acf.title")}>

        <Band head={t("acf.band")} metrics={metrics} />

        {rows.length ? (
          <Register
            title={t("acf.reg")}
            onSelect={function (rid) { openOne(rid); }}
            columns={columns} rows={rowData}
            chips={
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end" }}>
                <Field id="acf-kind" label={t("acf.f.kind")}>
                  <Select id="acf-kind" value={kind} onChange={setKind}
                    options={[{ value: "all", label: t("acf.f.kindAll") }].concat(
                      d.HEADS.map(function (k) { return { value: k, label: t(d.HEAD_LABEL[k]) }; }))} />
                </Field>
                <Field id="acf-ent" label={t("acf.f.entity")}>
                  <Select id="acf-ent" value={ent} onChange={setEnt}
                    options={[{ value: "all", label: t("acf.f.entityAll") }].concat(
                      d.ENTITIES.map(function (e) { return { value: e.key, label: t(e.nameKey) }; }))} />
                </Field>
                <Field id="acf-campus" label={t("kit.campus.label")}>
                  <Select id="acf-campus" value={campus} onChange={setCampus}
                    ariaLabel={t("kit.campus.label")}
                    options={campusOptions(t, { allFirst: true, allKey: "acf.cov.both" })} />
                </Field>
                <Field id="acf-st" label={t("acf.f.state")}>
                  <Select id="acf-st" value={status} onChange={setStatus}
                    options={[
                      { value: "open", label: t("acf.f.stateOpen") },
                      { value: "filed", label: t("acf.f.stateFiled") },
                      { value: "all", label: t("acf.f.stateAll") },
                    ]} />
                </Field>
              </div>
            }
            footer={<span style={ty("caption", { color: c.inkFaint })}>{t("acf.foot", { n: num(rows.length) })}</span>}
          />
        ) : (
          <Card><EmptyState head={t("acf.empty")} body={t("acf.emptyBody")} /></Card>
        )}
      </Shell>
    );
  }

  /* ============================================================
     AC-05 — THE WORKSPACE
     ============================================================ */
  function ACFile({ role, onNavigate }) {
    /* the accountant holds both campuses; everything below answers this */
    const [campus, setCampus] = useState(CAMPUS_ALL);
    const { c } = useTheme();
    const { t, ty, lang } = useLang();
    const d = D(), parts = P();
    const [st, setSt] = useState({ generated: false, fvu: null, filed: null, excluded: [] });
    /* the act the register's menu asked for, consumed once on arrival
       so a later visit opens the workspace plain */
    const [panel, setPanel] = useState(function () {
      const handed = window.Pages3 && window.Pages3.acFilingAct;
      if (handed) { window.Pages3.acFilingAct = null; return { kind: handed }; }
      return null;
    });
    const [ack, setAck] = useState("");
    const [reason, setReason] = useState("");
    const [done, setDone] = useState(null);

    if (!d || !parts) return null;
    const Shell = parts.Shell, Trail = parts.Trail;
    const id = (window.Pages3 && window.Pages3.acFilingId) || null;
    const f = d.FILINGS.filter(function (x) { return x.id === id; })[0] || null;

    if (!f) {
      return (
        <Shell campus={campus} onCampus={setCampus} role={role} active="acFilings" onNavigate={onNavigate} crumb={t("ac5.crumb")}
          title={t("ac5.gone")} sub={t("ac5.goneBody")}>
          <Card><EmptyState head={t("ac5.gone")} body={t("ac5.goneBody")}
            action={<Button kind="primary" size="sm" onClick={function () { onNavigate && onNavigate("acFilings"); }}>{t("ac5.back")}</Button>} /></Card>
        </Shell>
      );
    }

    const found = findingsFor(f.id, campus);
    const blocking = blockingOf(f, st.excluded, campus);
    const warnings = found.filter(function (x) { return x.sev === "warn" && st.excluded.indexOf(x.id) < 0; }).length;
    const alreadyFiled = !!f.filedOn || !!st.filed;
    const stage = stageOf(f, st, blocking);
    /* only what is NOT resolved: an excluded finding is a decision, and
       a decision is in the trail, not in the list of things to do */
    const checks = found.filter(function (x) { return st.excluded.indexOf(x.id) < 0; })
      .sort(function (a, b) { return (b.sev === "block" ? 1 : 0) - (a.sev === "block" ? 1 : 0); });
    const amount = f.amountFn ? f.amountFn() : null;
    const periodLabel = f.pLabelKey ? t(f.pLabelKey) : t("ac.mon." + Number(f.p.split("-")[1]));
    const ent = d.ENTITIES.filter(function (e) { return e.key === f.e; })[0];

    function exclude(x) {
      setSt(Object.assign({}, st, { excluded: st.excluded.concat([x.id]) }));
      setPanel(null);
    }

    /* the artefact, once it exists: what it is, who made it, and the
       two things you can do to it */
    function Artefact() {
      return (
        <section style={{ border: "1px solid " + c.rule, borderRadius: G3.r.md, background: c.surface,
                          padding: "16px 20px 18px" }}>
          <h2 style={ty("h3", { margin: "0 0 12px", color: c.ink })}>{t("ac5.gen")}</h2>
          <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap",
                        border: "1px solid " + c.rule, borderRadius: G3.r.sm, padding: "13px 15px" }}>
            <span aria-hidden="true" style={{ display: "flex", color: c.inkMuted }}><Icon name="document" size={20} /></span>
            <div style={{ flex: "1 1 240px", minWidth: 0 }}>
              <div style={G3.fig("sm", { color: c.ink, fontWeight: 700 })}>
                {f.k.toUpperCase() + "-" + f.p + (needsFvu(f) ? ".fvu" : ".txt")}
              </div>
              <div style={ty("caption", { color: c.inkMuted, marginTop: 2 })}>
                {t("ac5.gen.made", { when: d.fmtDate(t, d.TODAY), who: t(d.ME.key) })} · {d.CFG_JUL.v}
              </div>
            </div>
            <Button kind="secondary" size="sm" iconLeft="download"
              onClick={function () { setPanel({ kind: "dl" }); }}>{t("ac5.gen.download")}</Button>
            <Button kind="quiet" size="sm" onClick={function () { setPanel({ kind: "generate" }); }}>
              {t("ac5.gen.again")}
            </Button>
          </div>
        </section>
      );
    }

    return (
      <Shell campus={campus} onCampus={setCampus} role={role} active="acFilings" onNavigate={onNavigate} crumb={t("ac5.crumb")}
        title={t("ac5.title", { kind: t(f.kindKey) + (f.stKey ? " · " + t(f.stKey) : ""), period: periodLabel })}
        aside={
          <Button kind="secondary" size="sm" iconLeft="arrow" onClick={function () { onNavigate && onNavigate("acFilings"); }}>
            {t("ac5.back")}
          </Button>
        }
      >
        <FilingSteps at={stage} />

        <FilingFacts items={[
          { k: "amt", label: t("ac5.src.amount"), v: amount == null ? "—" : inr(amount), fig: true },
          { k: "ppl", label: t("ac5.src.heads"), v: num(d.RUN_HEADS - st.excluded.length), fig: true,
            note: st.excluded.length ? t("ac5.val.excluded", { n: num(st.excluded.length) }) : null },
          { k: "per", label: t("ac5.src.period"), v: periodLabel, note: ent ? t(ent.nameKey) : null },
          { k: "due", label: t("ac5.f.due"), v: d.fmtDate(t, f.due),
            note: d.dueWords(t, f, d.dueState(f)) },
          { k: "cfg", label: t("ac5.src.cfg"), v: d.CFG_JUL.v, note: d.cfgFrom(d.CFG_JUL) },
        ]} />

        {/* ---------- 1 · VALIDATE ---------- */}
        {stage === "validate" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: G3.layout.gap }}>
            <FilingChecks
              rows={checks}
              onFix={function (x) {
                window.Pages3.hrRecordId = x.staff;
                onNavigate && onNavigate("hrStaff");
              }}
              onExclude={function (x) { setReason(""); setPanel({ kind: "excl", row: x }); }}
            />
            <section style={{ border: "1px solid " + c.rule, borderRadius: G3.r.md, background: c.surface,
                              padding: "16px 20px 18px", display: "flex", gap: 14, alignItems: "center",
                              justifyContent: "space-between", flexWrap: "wrap" }}>
              <div style={{ minWidth: 0 }}>
                <h2 style={ty("h3", { margin: 0, color: c.ink })}>{t("ac5.gen")}</h2>
                <p style={ty("caption", { color: c.dangerText, margin: "6px 0 0" })}>
                  {!f.periodReady ? t("ac5.gen.notApproved", { p: periodLabel })
                    : t("ac5.gen.blocked", { n: num(blocking) })}
                </p>
              </div>
              <Button kind="primary" iconLeft="payroll" disabled>{t("ac5.gen.go")}</Button>
            </section>
          </div>
        ) : null}

        {/* ---------- 2 · GENERATE ---------- */}
        {stage === "generate" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: G3.layout.gap }}>
            {checks.length ? (
              <FilingChecks
                rows={checks}
                onFix={function (x) {
                  window.Pages3.hrRecordId = x.staff;
                  onNavigate && onNavigate("hrStaff");
                }}
                onExclude={function (x) { setReason(""); setPanel({ kind: "excl", row: x }); }}
              />
            ) : null}
            <section style={{ border: "1px solid " + c.rule, borderRadius: G3.r.md, background: c.surface,
                              padding: "16px 20px 18px", display: "flex", gap: 14, alignItems: "center",
                              justifyContent: "space-between", flexWrap: "wrap" }}>
              <div style={{ minWidth: 0 }}>
                <h2 style={ty("h3", { margin: 0, color: c.ink })}>{t("ac5.gen")}</h2>
                <div style={{ marginTop: 7 }}>
                  <StatusMark role="present" glyph="check"
                    word={st.excluded.length
                      ? t("ac5.val.excluded", { n: num(st.excluded.length) })
                      : t("ac5.val.clean")} />
                </div>
              </div>
              <Button kind="primary" iconLeft="payroll"
                onClick={function () { setPanel({ kind: "generate" }); }}>{t("ac5.gen.go")}</Button>
            </section>
          </div>
        ) : null}

        {/* ---------- 3 · FILE ---------- */}
        {stage === "file" || stage === "portal" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: G3.layout.gap }}>
            <Artefact />
            {needsFvu(f) ? (
              <section style={{ border: "1px solid " + c.rule, borderRadius: G3.r.md, background: c.surface,
                                padding: "16px 20px 18px", display: "flex", gap: 14, alignItems: "center",
                                justifyContent: "space-between", flexWrap: "wrap" }}>
                <div style={{ minWidth: 0 }}>
                  <h2 style={ty("h3", { margin: 0, color: c.ink })}>{t("ac5.fvu")}</h2>
                  <div style={{ marginTop: 7 }}>
                    {st.fvu === "pass"
                      ? <StatusMark role="present" glyph="check" word={t("ac5.fvu.pass")} />
                      : <StatusMark role="late" glyph="clock" word={t("ac5.fvu.needed")} />}
                  </div>
                </div>
                {st.fvu === "pass" ? null : (
                  <Button kind="primary" size="sm" iconLeft="scan"
                    onClick={function () { setSt(Object.assign({}, st, { fvu: "pass" })); }}>
                    {t("ac5.fvu.run")}
                  </Button>
                )}
              </section>
            ) : null}
            <section style={{ border: "1px solid " + c.rule, borderRadius: G3.r.md, background: c.surface,
                              padding: "16px 20px 18px", display: "flex", gap: 14, alignItems: "center",
                              justifyContent: "space-between", flexWrap: "wrap" }}>
              <div style={{ minWidth: 0 }}>
                <h2 style={ty("h3", { margin: 0, color: c.ink })}>{t("ac5.file")}</h2>
                <p style={ty("caption", { color: c.inkMuted, margin: "6px 0 0" })}>{t("ac5.file.ackOnly")}</p>
              </div>
              <Button kind="primary" iconLeft="check" disabled={needsFvu(f) && st.fvu !== "pass"}
                onClick={needsFvu(f) && st.fvu !== "pass" ? undefined
                  : function () { setPanel({ kind: "file" }); setAck(""); }}>
                {t("ac5.file.go")}
              </Button>
            </section>
          </div>
        ) : null}

        {/* ---------- 4 · FILED ---------- */}
        {stage === "filed" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: G3.layout.gap }}>
            <section style={{ border: "1px solid " + c.rule, borderRadius: G3.r.md, background: c.surface,
                              padding: "16px 20px 18px" }}>
              <StatusMark role="present" glyph="check"
                word={t("ac5.file.done", {
                  when: d.fmtDate(t, f.filedOn || d.TODAY),
                  ack: (st.filed && st.filed.ack) || ("ACK-" + f.id.toUpperCase().replace(/-/g, "").slice(0, 9)),
                })} />
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
                <Button kind="secondary" size="sm" iconLeft="download"
                  onClick={function () { setPanel({ kind: "dl" }); }}>{t("acf.a.download")}</Button>
                <Button kind="secondary" size="sm" iconLeft="arrow"
                  onClick={function () { setPanel({ kind: "rev" }); setReason(""); }}>{t("acf.a.revise")}</Button>
                <Button kind="danger" size="sm" iconLeft="alert"
                  onClick={function () { setPanel({ kind: "rej" }); setReason(""); }}>{t("acf.a.rejected")}</Button>
              </div>
            </section>
          </div>
        ) : null}


        {/* ---- every act, in a dialog over what it acts on ---- */}
        {panel && panel.kind === "generate" ? (
          <Modal
            icon="payroll" title={t("ac5.gen.go")} sub={t("ac5.gen.modalSub")}
            onClose={function () { setPanel(null); }}
            footer={
              <React.Fragment>
                <Button kind="primary" size="sm" iconLeft="payroll" onClick={function () {
                  setSt(Object.assign({}, st, { generated: true, fvu: null }));
                  setPanel(null); setDone("generated");
                }}>{t("ac5.gen.confirm")}</Button>
                <Button kind="secondary" size="sm" onClick={function () { setPanel(null); }}>{t("ac5.cancel")}</Button>
              </React.Fragment>
            }
          >
            <DlgFacts rows={[
              { k: "r", label: t("ac5.gen.what"), v: t(f.kindKey) + (f.stKey ? " \u00b7 " + t(f.stKey) : "") },
              { k: "p", label: t("ac5.src.period"), v: periodLabel },
              { k: "a", label: t("ac5.src.amount"), v: amount == null ? "\u2014" : inr(amount) },
              { k: "n", label: t("ac5.gen.people"), v: num(d.RUN_HEADS - st.excluded.length) },
              { k: "f", label: t("ac5.gen.fmt"), v: needsFvu(f) ? "FVU 8.4" : "v1.2" },
              { k: "c", label: t("ac5.src.cfg"), v: d.CFG_JUL.v },
            ]} />
            {st.generated ? (
              <p style={ty("caption", { color: c.lateText, margin: "14px 0 0" })}>{t("ac5.gen.supersede")}</p>
            ) : null}
          </Modal>
        ) : null}

        {panel && panel.kind === "file" ? (
          <Modal
            icon="check" title={t("ac5.file.go")} sub={t("ac5.fileSub")}
            onClose={function () { setPanel(null); }}
            footer={
              <React.Fragment>
                <Button kind="primary" size="sm" iconLeft="check" disabled={!ack.trim()}
                  onClick={!ack.trim() ? undefined : function () {
                    setSt(Object.assign({}, st, { filed: { ack: ack.trim(), on: d.TODAY } }));
                    setPanel(null); setDone("filed");
                  }}>{t("ac5.file.confirm")}</Button>
                <Button kind="secondary" size="sm" onClick={function () { setPanel(null); }}>{t("ac5.file.cancel")}</Button>
                <span style={ty("caption", { color: c.inkFaint, flex: "1 1 220px" })}>{t("ac5.file.clears")}</span>
              </React.Fragment>
            }
          >
            <DlgFacts rows={[
              { k: "r", label: t("ac5.gen.what"), v: t(f.kindKey) + (f.stKey ? " \u00b7 " + t(f.stKey) : "") },
              { k: "d", label: t("ac5.file.date"), v: d.fmtDate(t, d.TODAY) },
            ]} />
            <div style={{ marginTop: 14 }}>
              <Field id="ac5-ack" label={t("ac5.file.ack")} hint={t("ac5.file.receiptNote")}
                error={ack.trim() ? null : t("ac5.file.ackMissing")}>
                <Input id="ac5-ack" value={ack} onChange={setAck} placeholder={t("ac5.file.ackPh")} />
              </Field>
            </div>
          </Modal>
        ) : null}

        {panel && (panel.kind === "excl" || panel.kind === "rej" || panel.kind === "reject" || panel.kind === "rev" || panel.kind === "revise") ? (
          (function () {
            const kindKey = panel.kind === "reject" ? "rej" : panel.kind === "revise" ? "rev" : panel.kind;
            const isRej = kindKey === "rej";
            return (
              <Modal
                icon={kindKey === "excl" ? "arrow" : isRej ? "alert" : "document"}
                iconTone={isRej ? "danger" : "accent"} danger={isRej}
                title={kindKey === "excl" ? t("ac5.excl.head", { name: t(panel.row.nameKey) })
                  : isRej ? t("ac5.rej.head") : t("ac5.rev.head")}
                sub={kindKey === "excl" ? t("ac5.excl.hint") : isRej ? t("ac5.rej.hint") : t("ac5.rev.hint")}
                onClose={function () { setPanel(null); }}
                footer={
                  <React.Fragment>
                    <Button kind={isRej ? "danger" : "primary"} size="sm" disabled={!reason}
                      onClick={!reason ? undefined : function () {
                        if (kindKey === "excl") exclude(panel.row);
                        else {
                          setSt(Object.assign({}, st, { generated: false, fvu: null, filed: null }));
                          setPanel(null); setDone(isRej ? "rejected" : "revised");
                        }
                      }}>{t("ac5." + kindKey + ".go")}</Button>
                    <Button kind="secondary" size="sm" onClick={function () { setPanel(null); }}>
                      {t("ac5." + kindKey + ".cancel")}
                    </Button>
                  </React.Fragment>
                }
              >
                <Field id="ac5-reason" label={t("ac5.reasonLabel")}>
                  <Select id="ac5-reason" value={reason} onChange={setReason}
                    options={[{ value: "", label: t("ac5.reasonPick") }].concat(
                      ["r1", "r2", "r3"].map(function (r) {
                        return { value: r, label: t("ac5." + kindKey + "." + r) };
                      }))} />
                </Field>
              </Modal>
            );
          })()
        ) : null}

        {panel && panel.kind === "download" ? (
          <Modal icon="download" title={t("acf.a.download")} sub={t("ac5.dl.sub")}
            onClose={function () { setPanel(null); }}
            footer={
              <React.Fragment>
                <Button kind="primary" size="sm" iconLeft="download" onClick={function () { setPanel(null); setDone("downloaded"); }}>
                  {t("ac5.dl.go")}
                </Button>
                <Button kind="secondary" size="sm" onClick={function () { setPanel(null); }}>{t("ac5.cancel")}</Button>
              </React.Fragment>
            }
          >
            <DlgFacts rows={[
              { k: "f", label: t("ac5.gen.file"), v: f.k.toUpperCase() + "-" + f.p + (needsFvu(f) ? ".fvu" : ".txt") },
              { k: "c", label: t("ac5.src.cfg"), v: d.CFG_JUL.v },
              { k: "a", label: t("acf.col.ack"), v: "ACK-" + f.id.toUpperCase().replace(/-/g, "").slice(0, 9) },
            ]} />
            <p style={ty("caption", { color: c.inkFaint, margin: "14px 0 0" })}>{t("ac5.dl.audit")}</p>
          </Modal>
        ) : null}

        {done ? (
          <Modal icon="check" iconTone="present" title={t("ac5.done." + done)} sub={t("ac5.done.sub")}
            onClose={function () { setDone(null); }}
            footer={<Button kind="primary" size="sm" onClick={function () { setDone(null); }}>{t("ac5.done.ok")}</Button>}
          >
            <p style={ty("small", { color: c.inkMuted, margin: 0 })}>{t("ac5.doneBody." + done)}</p>
          </Modal>
        ) : null}

        <Card title={t("ac5.trail")}>
          <Trail
            rows={[
              { glyph: "scan", title: t("ac5.tr.validated"), when: d.fmtDate(t, d.TODAY), detail: t(f.consKey) },
            ].concat(st.generated ? [{ glyph: "document", title: t("ac5.tr.generated"), when: d.fmtDate(t, d.TODAY), detail: d.CFG_JUL.v }] : [])
              .concat(st.excluded.length ? [{ glyph: "arrow", title: t("ac5.tr.excluded"), when: d.fmtDate(t, d.TODAY), detail: num(st.excluded.length) }] : [])
              .concat(alreadyFiled ? [{ glyph: "check", title: t("ac5.tr.filed"), when: d.fmtDate(t, f.filedOn || d.TODAY) }] : [])}
            note={t("ac5.trailFoot")}
          />
        </Card>
      </Shell>
    );
  }

  window.Pages3 = window.Pages3 || {};
  window.Pages3.ACFilings = ACFilings;
  window.Pages3.ACFile = ACFile;
})();
