/* @jsxRuntime classic */
/* ============================================================
   Naveya — Profile (Employee Self-Service) · window.Pages3.Profile

   MASKED BY DEFAULT, REVEALED DELIBERATELY, AND HONEST ABOUT WHO OWNS
   WHAT (dev-spec §4.1 "field-level PII permissions", §8 "Field-level
   access" / "Consent & retention (DPDP 2023)", M3, M13, M15.1;
   docs/ui-compliance-requirements.md O1 / O2 / O3 / O6 / O16 / §3).

   Three rules shape every part of this screen.

   1 · PII is masked in the DOM, not in CSS. PAN, UAN, ESIC number and
       the salary account render as a masked string; the full value is
       simply not present until Show is pressed. Only ONE field can be
       open at a time — opening another closes the first — so a profile
       left on a staffroom desktop is never a screenful of identifiers.
       AADHAAR HAS NO REVEAL AT ALL: ui-compliance-requirements §3 says
       a full Aadhaar is never displayed anywhere, to anyone, so the
       last four digits are the fullest form that exists here.
       Nothing is copied to a clipboard and no identifier appears in a
       heading, a label or a URL (O11).

   2 · What she may change and what only HR may change are different in
       look AND in behaviour. Employment facts and contact details are
       HR-owned: they carry an "HR keeps this" mark and their only
       affordance is "Ask HR to correct something", which sends a
       message to the office (M15.1 helpdesk) — it never writes to her
       record, and it can never create or replace a document (O4 is
       explicit that a "request a correction" which writes a document is
       the same violation wearing a polite label). Sign-in and security
       is the one card where a control acts immediately, and it says so.
       Salary/CTC is deliberately absent — it belongs to Payslips.

   3 · DPDP is a surface, not a footnote. "What the school holds about
       you, and why" names every group, its lawful basis and the date it
       is kept until; the single consent-based group carries a withdrawal
       whose consequence is stated in plain words, and which explicitly
       says pay is NOT affected (O1 forbids implying that statutory
       processing depends on consent).

   Composed only from window.G3 / window.UI3. kit.jsx, tokens.jsx,
   screens.jsx, attendance.jsx and v3.html are untouched by this file.
   ============================================================ */
(function () {
  const G3 = window.G3;
  const UI = window.UI3;
  const { useState } = React;
  const {
    useTheme, ThemeToggle, useLang, addStrings,
    Rail, Motif, Card, Register, Button, LinkButton, Chip, Icon, inr, num,
  } = UI;

  /* ============================================================
     STRINGS — prof3.*. EN and HI carry exactly the same key set.
     Every demo value is authored in both languages, including names,
     reasons and dates: untranslated mock content is the i18n leak we
     keep finding on review.
     ============================================================ */
  addStrings({
    en: {
      "prof3.basic.title": "Your record",
      "prof3.basic.sub": "Held by the trust office",
      "prof3.basic.group.who": "Who you are here",
      "prof3.basic.group.contact": "Contact",
      "prof3.basic.name": "Name",
      "prof3.basic.scope": "Trust",
      "prof3.basic.campuses": "Campuses",
      "prof3.basic.note": "You are not on a school payroll, so there is no payslip, salary account or document file.",
      "prof3.pageTitle": "Profile",

      "prof3.who.meera": "Meera Iyer, HR",
      "prof3.who.rajan": "Rajan Pillai, HR",
      "prof3.who.system": "Naveya, automatically",

      "prof3.mon.01": "Jan", "prof3.mon.02": "Feb", "prof3.mon.03": "Mar",
      "prof3.mon.04": "Apr", "prof3.mon.05": "May", "prof3.mon.06": "Jun",
      "prof3.mon.07": "Jul", "prof3.mon.08": "Aug", "prof3.mon.09": "Sep",
      "prof3.mon.10": "Oct", "prof3.mon.11": "Nov", "prof3.mon.12": "Dec",

      /* --- ownership marks --- */
      "prof3.mark.hr": "HR keeps this",
      "prof3.mark.yours": "You change this",

      /* --- the record --- */
      "prof3.rec.vacation": "teaching staff",
      "prof3.rec.nonTeaching": "non-teaching",
      "prof3.terms.vacationNoteNo": "Non-teaching staff: earned leave accrues monthly and carries forward within the cap.",
      "prof3.terms.title": "Your contract",
      "prof3.terms.group.contract": "Your terms",
      "prof3.terms.group.role": "What you are on the roll to do",
      "prof3.terms.type": "Employment",
      "prof3.terms.category": "Staff category",
      "prof3.terms.confirmed": "Confirmed on",
      "prof3.terms.end": "Contract ends",
      "prof3.terms.endNone": "No end date. It does not expire on its own.",
      "prof3.terms.notice": "Notice period",
      "prof3.terms.noticeV": "{n} days",
      "prof3.terms.vacation": "Staff type",
      "prof3.terms.vacationYes": "Teaching",
      "prof3.terms.vacationNo": "Non-teaching",
      "prof3.terms.vacationNote": "Declared vacations are paid days. Earned leave does not build up across them.",
      "prof3.terms.teaches": "You teach",
      "prof3.terms.also": "You also carry",
      "prof3.pay.title": "Your pay",
      "prof3.pay.group": "Pay group",
      "prof3.pay.cycle": "Cycle",
      "prof3.pay.gross": "Contracted monthly gross",
      "prof3.pay.grossNote": "From the contract in force since {date}",
      "prof3.pay.account": "Credited to",
      "prof3.pay.last": "Last credited",
      "prof3.pay.note": "The figure on your contract, not the month's net.",
      "prof3.rec.title": "Your record",
      "prof3.rec.group.employment": "At school",
      "prof3.rec.group.contact": "Contact and next of kin",
      "prof3.rec.designation": "Designation",
      "prof3.rec.designationV": "Post Graduate Teacher, Physics",
      "prof3.rec.department": "Department",
      "prof3.rec.departmentV": "Science",
      "prof3.rec.category": "Staff category",
      "prof3.rec.categoryV": "Teaching",
      "prof3.rec.employment": "Employment",
      "prof3.rec.employmentV": "Permanent · teaching staff",
      "prof3.rec.campus": "Campus",
      "prof3.rec.campusV": "Indiranagar",
      "prof3.rec.staffId": "Staff ID",
      "prof3.rec.doj": "Joined",
      "prof3.rec.reportsTo": "Reports to",
      "prof3.rec.reportsToV": "Anjali Deshpande, Head of Science",
      "prof3.rec.dob": "Date of birth",
      "prof3.rec.phone": "Personal phone",
      "prof3.rec.email": "Personal email",
      "prof3.rec.address": "Address",
      "prof3.rec.addressV": "Flat 4B, Anjali Residency, 5th Main, Indiranagar, Bengaluru 560038",
      "prof3.rec.emergency": "In an emergency",
      "prof3.rec.emergencyV": "Vikram Rao, husband",
      "prof3.rec.ask": "Ask HR to correct something",

      /* --- sign-in and security --- */
      "prof3.sec.title": "Sign-in and security",
      "prof3.sec.password": "Password",
      "prof3.sec.passwordV": "Last changed",
      "prof3.sec.askChange": "Ask the office to change my password",
      "prof3.sec.change": "Change password",
      "prof3.sec.otp": "Number for one-time codes",
      "prof3.sec.devices": "Signed in",
      "prof3.sec.device1": "This computer · staffroom",
      "prof3.sec.device1When": "today",
      "prof3.sec.device2": "Your phone · Naveya app",
      "prof3.sec.device2When": "11 Aug",
      "prof3.sec.signOutAll": "Sign out everywhere",

      /* --- identifiers --- */
      "prof3.ids.title": "Numbers filed in your name",
      "prof3.ids.sub": "Hidden until you ask for them.",
      "prof3.ids.pan": "PAN",
      "prof3.ids.aadhaar": "Aadhaar",
      "prof3.ids.uan": "Provident fund (UAN)",
      "prof3.ids.esic": "Insurance number (ESIC)",
      "prof3.ids.bank": "Salary account",
      "prof3.ids.ifsc": "IFSC",
      "prof3.ids.bankName": "HDFC Bank, Indiranagar",
      "prof3.ids.show": "Show",
      "prof3.ids.hide": "Hide",
      "prof3.ids.showAria": "Show {field}",
      "prof3.ids.hideAria": "Hide {field}",
      "prof3.ids.ruleHead": "Why they are hidden",
      "prof3.ids.oneAtATime": "One at a time — showing another hides this one.",
      "prof3.ids.neverFull": "Last four digits only",
      "prof3.ids.aadhaarWhy": "An Aadhaar number is never shown in full, to anybody.",

      /* --- who looked --- */
      /* --- what we hold --- */
      "prof3.hold.title": "What the school holds, and why",
      "prof3.hold.col.what": "What",
      "prof3.hold.col.why": "Why it is held",
      "prof3.hold.col.until": "Kept until",
      "prof3.hold.col.basis": "On what footing",
      "prof3.basis.legal": "The law requires it",
      "prof3.basis.contract": "Your employment",
      "prof3.basis.consent": "You agreed",
      "prof3.hold.r1.what": "Your name, date of birth, address and phone",
      "prof3.hold.r1.why": "To run your employment and to reach you",
      "prof3.hold.r1.until": "31 Mar 2035",
      "prof3.hold.r2.what": "PAN, Aadhaar, UAN and ESIC number",
      "prof3.hold.r2.why": "To file provident fund, insurance and income tax in your name",
      "prof3.hold.r2.until": "31 Mar 2035",
      "prof3.hold.r3.what": "Your salary account",
      "prof3.hold.r3.why": "To pay your salary into it",
      "prof3.hold.r3.until": "31 Mar 2035",
      "prof3.hold.r4.what": "Attendance, with the place and a photo at each mark",
      "prof3.hold.r4.why": "To settle a disputed day, and so nobody can mark for you",
      "prof3.hold.r4.until": "28 Feb 2028",
      "prof3.hold.r5.what": "Salary, payslips and Form 16",
      "prof3.hold.r5.why": "To pay you, and to file your tax return",
      "prof3.hold.r5.until": "31 Mar 2035",
      "prof3.hold.r6.what": "Your documents and their verification",
      "prof3.hold.r6.why": "To show that you are qualified and cleared to teach",
      "prof3.hold.r6.until": "31 Mar 2035",
      "prof3.hold.r7.what": "Your emergency contact",
      "prof3.hold.r7.why": "To reach someone if you are hurt at school",
      "prof3.hold.r7.until": "While you work here",
      "prof3.hold.copy": "Ask for a copy of all of it",
      "prof3.hold.correct": "Ask for a correction",

      /* --- consent --- */
      "prof3.consent.title": "What you agreed to",
      "prof3.consent.notice": "Attendance notice, version 1.2",
      "prof3.consent.accepted": "You accepted it on {date}",
      "prof3.consent.covers": "Covers the place and a photo each time you mark attendance on your phone.",
      "prof3.consent.read": "Read the notice you accepted",
      "prof3.consent.withdraw": "Take this consent back",
    },

  });

  /* ============================================================
     DEMO CONTENT — every identifier below is deliberately synthetic:
     zero-filled PAN, all-zero Aadhaar and account digits. None of these
     could belong to a real person, and none is ever put in a URL, a
     heading or a clipboard payload.
     ============================================================ */

  /* her facts, shared with HR-03 (v3/person.jsx). The labels are this
     screen's own — it speaks to HER, not about her — but a value that
     differs between the two screens is a bug, so there is only one. */
  /* WHOSE PROFILE THIS IS. A teacher and a Group Admin both have one,
     and they are not the same person. `Profile()` resolves it from the
     signed-in role before its children render; every component below
     reads this binding, so there is exactly one answer per render and
     no component has to be handed the role to get it right. */
  let P = window.NaveyaPerson;

  const IDENTIFIERS = [
    { id: "pan", labelKey: "prof3.ids.pan", masked: P.ids.pan.masked, full: P.ids.pan.full },
    {
      id: "aadhaar", labelKey: "prof3.ids.aadhaar",
      masked: P.ids.aadhaar.masked, full: P.ids.aadhaar.full,   /* never revealable */
      neverKey: "prof3.ids.neverFull", whyKey: "prof3.ids.aadhaarWhy",
    },
    { id: "uan", labelKey: "prof3.ids.uan", masked: P.ids.uan.masked, full: P.ids.uan.full },
    { id: "esic", labelKey: "prof3.ids.esic", masked: P.ids.esic.masked, full: P.ids.esic.full },
    {
      id: "bank", labelKey: "prof3.ids.bank",
      masked: P.ids.bank.masked, full: P.ids.bank.full,
      extra: [{ labelKey: "prof3.ids.ifsc", value: P.ids.bank.ifsc }, { labelKey: "prof3.ids.bankName", value: null }],
    },
  ];



  const HOLDINGS = [
    { id: "r1", basis: "contract" },
    { id: "r2", basis: "legal" },
    { id: "r3", basis: "legal" },
    { id: "r4", basis: "consent" },
    { id: "r5", basis: "legal" },
    { id: "r6", basis: "legal" },
    { id: "r7", basis: "contract" },
  ];

  const BASIS = {
    legal: { key: "prof3.basis.legal", tint: "offTint", text: "offText", icon: "filing" },
    contract: { key: "prof3.basis.contract", tint: "ltELTint", text: "ltELText", icon: "briefcase" },
    consent: { key: "prof3.basis.consent", tint: "presentTint", text: "presentText", icon: "check" },
  };

  /* ============================================================
     HELPERS
     ============================================================ */
  /* the shared record keeps ISO dates; this screen prints them the
     way the rest of the app does */
  function iso(t, s) {
    if (!s) return null;
    const p = s.split("-");
    return dmy(t, [String(Number(p[2])), p[1], p[0]]);
  }

  function dmy(t, d) {
    if (!d) return null;
    return d[0] + " " + t("prof3.mon." + d[1]) + " " + d[2];
  }

  /* PROMOTION CANDIDATE (also defined in documents.jsx — two independent
     uses is the bar): a label/value definition row. */
  function DefRow({ label, children, last }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div style={{ display: "flex", gap: 16, alignItems: "baseline", padding: "10px 0", borderBottom: last ? "none" : "1px dashed " + c.border }}>
        <div style={ty("small", { color: c.inkMuted, flex: "0 0 40%", minWidth: 0, fontWeight: 500 })}>{label}</div>
        <div style={{ flex: 1, minWidth: 0, textAlign: "right" }}>{children}</div>
      </div>
    );
  }

  function Value({ children, mono }) {
    const { c } = useTheme();
    const { ty } = useLang();
    /* a mono figure at 13.5 sits visually larger than 13.5 sans next to
       it, so inline record figures use the 12.5 mono step — same optical
       size, still tabular */
    return <span style={mono ? G3.fig("xs", { color: c.ink, fontWeight: 600 }) : ty("small", { color: c.ink, fontWeight: 600 })}>{children}</span>;
  }

  /* an ownership mark — word plus glyph, never a colour on its own */
  function OwnerMark({ kind }) {
    const { c } = useTheme();
    const { t } = useLang();
    const hr = kind === "hr";
    return (
      <Chip bg={hr ? c.offTint : c.presentTint} fg={hr ? c.offText : c.presentText}>
        <span aria-hidden="true" style={{ display: "flex" }}><Icon name={hr ? "lock" : "check"} size={12} /></span>
        <span>{t(hr ? "prof3.mark.hr" : "prof3.mark.yours")}</span>
      </Chip>
    );
  }

  function GroupHead({ label, mark }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 4, paddingTop: 4 }}>
        <span style={ty("caption", { color: c.inkFaint, textTransform: "none", fontWeight: 700 })}>{label}</span>
        {mark}
      </div>
    );
  }

  /* ============================================================
     PROMOTION CANDIDATE · MaskedField — the mask + deliberate reveal
     primitive. This is the third independent appearance of the shape
     (Documents, Profile, and the earlier v2 profile study), so it is
     the strongest candidate for UI3.

     Two properties matter and are load-bearing:
       · the full value is CONDITIONALLY RENDERED. When masked it is
         absent from the DOM entirely — not hidden with CSS, not in a
         title attribute, not in a data-* attribute. A screenshot, a
         DOM dump, an accessibility tree and a Ctrl-F all see only the
         mask.
       · `full === null` means the value has no revealable form at all
         (Aadhaar). The control is then ABSENT, replaced by a word
         explaining why — never a disabled button, because the right to
         see it does not exist for anyone.
     ============================================================ */
  function MaskedField({ field, open, onToggle, last }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const label = t(field.labelKey);
    const revealable = field.full != null;
    const shown = revealable && open;

    return (
      <DefRow label={label} last={last}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
          <span style={G3.fig("sm", { color: shown ? c.ink : c.inkMuted, fontWeight: 600, letterSpacing: "0.02em" })}>
            {shown ? field.full : field.masked}
          </span>
          {revealable ? (
            <button
              type="button"
              onClick={() => onToggle(field.id)}
              aria-pressed={shown}
              aria-label={t(shown ? "prof3.ids.hideAria" : "prof3.ids.showAria", { field: label })}
              style={ty("caption", {
                display: "inline-flex", alignItems: "center", gap: 5,
                background: shown ? c.accentSoft : "transparent",
                border: "1px solid " + (shown ? c.accentSoft : c.borderStrong),
                borderRadius: G3.r.pill, padding: "6px 11px",
                color: shown ? c.action : c.inkMuted, fontWeight: 700, cursor: "pointer",
              })}
            >
              <span aria-hidden="true" style={{ display: "flex" }}><Icon name="lock" size={12} /></span>
              <span>{t(shown ? "prof3.ids.hide" : "prof3.ids.show")}</span>
            </button>
          ) : (
            <Chip bg={c.sunken} fg={c.inkMuted}>
              <span aria-hidden="true" style={{ display: "flex" }}><Icon name="lock" size={12} /></span>
              <span>{t(field.neverKey)}</span>
            </Chip>
          )}
        </div>
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
          <div style={ty("caption", { color: c.inkFaint, marginTop: 5, textAlign: "left", maxWidth: 380, marginLeft: "auto" })}>{t(field.whyKey)}</div>
        ) : null}
      </DefRow>
    );
  }

  /* ============================================================
     1 · THE RECORD — HR-owned, read-only, correction by request.
     ============================================================ */
  function RecordCard() {
    const { c } = useTheme();
    const { t, ty } = useLang();
    return (
      <Card
        icon="briefcase" iconTone="accent"
        title={t("prof3.rec.title")}
        action={<OwnerMark kind="hr" />}
        style={{ flex: 1, minWidth: 0 }}
      >
        <GroupHead label={t("prof3.rec.group.employment")} />
        <DefRow label={t("prof3.rec.designation")}><Value>{t(P.desigKey)}</Value></DefRow>
        <DefRow label={t("prof3.rec.department")}><Value>{t(P.deptKey)}</Value></DefRow>
        <DefRow label={t("prof3.rec.category")}><Value>{t(P.contract.kindKey)}</Value></DefRow>
        <DefRow label={t("prof3.rec.employment")}>
          <Value>{t(P.contract.typeKey)}{P.contract.vacationStaff ? " · " + t("prof3.rec.vacation") : " · " + t("prof3.rec.nonTeaching")}</Value>
        </DefRow>
        <DefRow label={t("prof3.rec.campus")}><Value>{t(P.campusKey)}</Value></DefRow>
        <DefRow label={t("prof3.rec.staffId")}><Value mono>{P.code}</Value></DefRow>
        <DefRow label={t("prof3.rec.doj")}><Value mono>{iso(t, P.contract.doj)}</Value></DefRow>
        <DefRow label={t("prof3.rec.reportsTo")} last><Value>{t(P.role.reportsToKey)}</Value></DefRow>

        <div style={{ marginTop: 14, paddingTop: 10, borderTop: "1px solid " + c.rule }}>
          <GroupHead label={t("prof3.rec.group.contact")} />
          <DefRow label={t("prof3.rec.dob")}><Value mono>{iso(t, P.contact.dob)}</Value></DefRow>
          <DefRow label={t("prof3.rec.phone")}><Value mono>{P.contact.phone.full}</Value></DefRow>
          <DefRow label={t("prof3.rec.email")}><Value>{P.contact.email}</Value></DefRow>
          <DefRow label={t("prof3.rec.address")}><Value>{t(P.contact.address.fullKey)}</Value></DefRow>
          <DefRow label={t("prof3.rec.emergency")} last>
            <Value>{t(P.contact.kin.nameKey)}</Value>
            <div style={G3.fig("xs", { color: c.inkMuted, marginTop: 3 })}>{P.contact.kin.full}</div>
          </DefRow>
        </div>

        {/* the ONLY affordance on an HR-owned record: a message to the
            office. It writes nothing here and it cannot touch a document. */}
        <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid " + c.rule, display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
          <Button kind="primary" size="sm" iconLeft="mail">{t("prof3.rec.ask")}</Button>
        </div>
      </Card>
    );
  }

  /* ============================================================
     2 · SIGN-IN AND SECURITY — the one card whose controls act.
     ============================================================ */
  function SecurityCard({ phone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const row = (label, value, sub) => (
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
        <span style={ty("small", { color: c.inkMuted, fontWeight: 500 })}>{label}</span>
        <span style={{ textAlign: "right" }}>
          {value}
          {sub ? <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 2 })}>{sub}</span> : null}
        </span>
      </div>
    );
    return (
      <Card
        icon="globe" iconTone="off"
        title={t("prof3.sec.title")}
        action={<OwnerMark kind="hr" />}
      >
        <div style={{ display: "grid", gap: 18 }}>
          <div style={{ display: "grid", gap: 10 }}>
            {row(t("prof3.sec.password"), (
              <span style={ty("caption", { color: c.inkMuted })}>
                {t("prof3.sec.passwordV") + " "}
                <span style={G3.fig("micro", { color: c.ink, fontWeight: 600 })}>{dmy(t, ["2", "06", "2026"])}</span>
              </span>
            ))}
            {/* the office holds staff sign-ins; this screen says so and
                offers the only thing she can actually do about it */}
            <Button kind="primary" size="sm" iconLeft="mail">{t("prof3.sec.askChange")}</Button>
          </div>

          <div style={{ display: "grid", gap: 4, paddingTop: 16, borderTop: "1px solid " + c.rule }}>
            {/* a phone number is a fact about the account, not a figure
                to be read across the room */}
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
              <span style={ty("small", { color: c.inkMuted, fontWeight: 500 })}>{t("prof3.sec.otp")}</span>
              <span style={G3.fig("micro", { color: c.ink, fontWeight: 600, letterSpacing: "0.02em" })}>{phone || "+91 90000 04210"}</span>
            </div>
          </div>

          <div style={{ display: "grid", gap: 10, paddingTop: 16, borderTop: "1px solid " + c.rule }}>
            <span style={ty("caption", { color: c.inkFaint, fontWeight: 700 })}>{t("prof3.sec.devices")}</span>
            {[
              { k: "1", nameKey: "prof3.sec.device1", whenKey: "prof3.sec.device1When" },
              { k: "2", nameKey: "prof3.sec.device2", whenKey: "prof3.sec.device2When" },
            ].map((d) => (
              <div key={d.k} style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
                <span style={ty("small", { color: c.ink })}>{t(d.nameKey)}</span>
                <span style={ty("caption", { color: c.inkMuted })}>{t(d.whenKey)}</span>
              </div>
            ))}
            {/* the same ranking the consent card now carries: one
                filled button per card, and this is not it — asking
                the office to change a password is what somebody opens
                this card to do. */}
            <Button kind="secondary" size="sm" iconLeft="signout">{t("prof3.sec.signOutAll")}</Button>
          </div>
        </div>
      </Card>
    );
  }

  /* ============================================================
     3 · IDENTIFIERS — masked in the DOM, one reveal at a time.
     ============================================================ */
  function IdentifiersCard() {
    const { c } = useTheme();
    const { t, ty } = useLang();
    /* a single id, not a set: opening one closes the other */
    const [openId, setOpenId] = useState(null);
    const toggle = (id) => setOpenId((cur) => (cur === id ? null : id));

    return (
      <Card
        icon="lock" iconTone="accent"
        title={t("prof3.ids.title")} sub={t("prof3.ids.sub")}
        action={<OwnerMark kind="hr" />}
        style={{ flex: 1, minWidth: 0 }}
      >
        <div style={{ display: "flex", gap: 26, alignItems: "flex-start" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {IDENTIFIERS.map((f, i) => (
              <MaskedField key={f.id} field={f} open={openId === f.id} onToggle={toggle} last={i === IDENTIFIERS.length - 1} />
            ))}
          </div>
          <div style={{ flex: "0 0 250px", background: c.sunken, borderRadius: G3.r.lg, padding: "14px 16px" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8, color: c.inkMuted }}>
              <span aria-hidden="true" style={{ display: "flex" }}><Icon name="lock" size={14} /></span>
              <span style={ty("caption", { fontWeight: 700 })}>{t("prof3.ids.ruleHead")}</span>
            </div>
            <p style={ty("caption", { margin: 0, color: c.inkMuted })}>{t("prof3.ids.oneAtATime")}</p>
          </div>
        </div>
      </Card>
    );
  }

  /* ============================================================
     4b · HER TERMS AND HER PAY — 2026-09-25.

     Both were on HR's copy of this record and absent from hers, which
     meant the two most-asked questions in any school office ("what
     does my contract say?" and "what am I paid?") could only be
     answered by asking. They are facts about HER, so they are on her
     screen; they are HR-owned, so they carry the same owner mark and
     the same single affordance as everything else here.

     What is NOT here: the month's payslip. That is payroll's, it has
     its own screen, and restating a figure payroll computes would be
     the second copy this whole file just stopped keeping.
     ============================================================ */
  function TermsCard() {
    const { c } = useTheme();
    const { t, ty } = useLang();
    return (
      <Card
        icon="briefcase" iconTone="accent"
        title={t("prof3.terms.title")}
        action={<OwnerMark kind="hr" />}
        style={{ flex: 1, minWidth: 0 }}
      >
        <GroupHead label={t("prof3.terms.group.contract")} />
        <DefRow label={t("prof3.terms.type")}><Value>{t(P.contract.typeKey)}</Value></DefRow>
        <DefRow label={t("prof3.terms.category")}><Value>{t(P.contract.categoryKey)}</Value></DefRow>
        <DefRow label={t("prof3.terms.confirmed")}><Value mono>{iso(t, P.contract.confirmed)}</Value></DefRow>
        <DefRow label={t("prof3.terms.end")}>
          <Value>{P.contract.end ? iso(t, P.contract.end) : t("prof3.terms.endNone")}</Value>
        </DefRow>
        <DefRow label={t("prof3.terms.notice")}><Value mono>{t("prof3.terms.noticeV", { n: num(P.contract.noticeDays) })}</Value></DefRow>
        <DefRow label={t("prof3.terms.vacation")} last>
          <Value>{P.contract.vacationStaff ? t("prof3.terms.vacationYes") : t("prof3.terms.vacationNo")}</Value>
          <div style={ty("caption", { color: c.inkFaint, marginTop: 2 })}>{t(P.contract.vacationStaff ? "prof3.terms.vacationNote" : "prof3.terms.vacationNoteNo")}</div>
        </DefRow>

        <div style={{ marginTop: 14, paddingTop: 10, borderTop: "1px solid " + c.rule }}>
          <GroupHead label={t("prof3.terms.group.role")} />
          <DefRow label={t("prof3.terms.teaches")}><Value>{t(P.role.subjectsKey)}</Value></DefRow>
          <DefRow label={t("prof3.terms.also")} last>
            <Value>{t(P.role.alsoKey)}</Value>
            <div style={ty("caption", { color: c.inkFaint, marginTop: 2 })}>{t(P.role.alsoNoteKey)}</div>
          </DefRow>
        </div>
      </Card>
    );
  }

  function PayCard() {
    const { c } = useTheme();
    const { t, ty } = useLang();
    return (
      <Card
        icon="payslip" iconTone="brass"
        title={t("prof3.pay.title")}
        action={<OwnerMark kind="hr" />}
        style={{ flex: 1, minWidth: 0 }}
      >
        <DefRow label={t("prof3.pay.group")}><Value>{t(P.pay.groupKey)}</Value></DefRow>
        <DefRow label={t("prof3.pay.cycle")}><Value>{t(P.pay.cycleKey)}</Value></DefRow>
        <DefRow label={t("prof3.pay.gross")}>
          <Value mono>{inr(P.pay.grossMonthly)}</Value>
          <div style={ty("caption", { color: c.inkFaint, marginTop: 2 })}>{t("prof3.pay.grossNote", { date: iso(t, P.pay.contractFrom) })}</div>
        </DefRow>
        <DefRow label={t("prof3.pay.account")}><Value mono>{P.pay.accountMasked}</Value></DefRow>
        <DefRow label={t("prof3.pay.last")} last><Value>{t(P.pay.lastCreditedKey)}</Value></DefRow>
        <p style={ty("caption", { margin: "14px 0 0", paddingTop: 12, borderTop: "1px solid " + c.rule, color: c.inkFaint })}>{t("prof3.pay.note")}</p>
      </Card>
    );
  }

  /* ============================================================
     5 · WHAT THE SCHOOL HOLDS — the DPDP surface (O1/O2).
     ============================================================ */
  function HoldingsRegister() {
    const { c } = useTheme();
    const { t, ty } = useLang();

    const columns = [
      /* widths keep the two prose columns near a 55-65 character
         measure at 1440-1920, instead of stretching to 90 */
      { key: "what", label: t("prof3.hold.col.what"), width: "26%" },
      { key: "why", label: t("prof3.hold.col.why"), width: "34%" },
      { key: "until", label: t("prof3.hold.col.until"), mono: true, width: 170 },
      { key: "basis", label: t("prof3.hold.col.basis"), width: 220 },
    ];

    const rows = HOLDINGS.map((h) => {
      const b = BASIS[h.basis];
      return {
        id: h.id,
        cells: {
          what: <span style={{ fontWeight: 600 }}>{t("prof3.hold." + h.id + ".what")}</span>,
          why: t("prof3.hold." + h.id + ".why"),
          until: t("prof3.hold." + h.id + ".until"),
          basis: (
            <Chip bg={c[b.tint]} fg={c[b.text]}>
              <span aria-hidden="true" style={{ display: "flex" }}><Icon name={b.icon} size={12} /></span>
              <span>{t(b.key)}</span>
            </Chip>
          ),
        },
      };
    });

    return (
      <div>
        <Register
          title={t("prof3.hold.title")}
          columns={columns}
          rows={rows}
          footer={
            <React.Fragment>
              <span style={{ display: "flex", gap: 18, flexShrink: 0 }}>
                <LinkButton>{t("prof3.hold.copy")}</LinkButton>
                <LinkButton>{t("prof3.hold.correct")}</LinkButton>
              </span>
            </React.Fragment>
          }
        />
      </div>
    );
  }

  /* ============================================================
     6 · CONSENT — the one group that rests on agreement, with the
     consequence of withdrawal stated before it can be taken.
     ============================================================ */
  function ConsentCard() {
    const { c } = useTheme();
    const { t, ty } = useLang();
    return (
      <Card
        icon="check" iconTone="present"
        title={t("prof3.consent.title")}
      >
        <div style={ty("h3", { color: c.ink })}>{t("prof3.consent.notice")}</div>
        <div style={ty("caption", { color: c.inkMuted, marginTop: 4 })}>
          {t("prof3.consent.accepted", { date: dmy(t, ["2", "05", "2026"]) })}
        </div>
        <p style={ty("small", { margin: "10px 0 0", color: c.inkMuted })}>{t("prof3.consent.covers")}</p>

        {/* ONE PRIMARY, ONE SECONDARY (designer, 2026-10-27). Two
            filled buttons side by side rank nothing, so the reader has
            to read both to find the one they came for. Reading the
            notice is what this card is for; taking the consent back is
            the other thing you can do here. Secondary is an outlined
            button in full contrast, NOT a buried one — O1 forbids
            dressing withdrawal as hard or as dangerous, and an outline
            does neither. */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
          <Button kind="primary" size="sm" iconLeft="document">{t("prof3.consent.read")}</Button>
          <Button kind="secondary" size="sm" iconLeft="arrow">{t("prof3.consent.withdraw")}</Button>
        </div>

      </Card>
    );
  }

  /* ============================================================
     PAGE
     ============================================================ */
  /* A person the school does not pay and does not hold a staff file
     on — today that is the trust director. Derived from the permission
     set, not from the role name, so the day another such role appears
     it is right without an edit. */
  function isEmployeeRecord(role) {
    return UI.permissionsFor(role).indexOf("self.payslip.read") !== -1;
  }

  const DIRECTOR_PHONE = "+91 90000 00102";

  function BasicRecordCard({ role }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const me = UI.profileFor(role);
    return (
      <Card
        icon="briefcase" iconTone="accent"
        title={t("prof3.basic.title")} sub={t("prof3.basic.sub")}
        action={<OwnerMark kind="hr" />}
        style={{ flex: 1, minWidth: 0 }}
      >
        <GroupHead label={t("prof3.basic.group.who")} />
        <DefRow label={t("prof3.basic.name")}><Value>{me.name}</Value></DefRow>
        <DefRow label={t("prof3.rec.designation")}><Value>{t(me.titleKey)}</Value></DefRow>
        <DefRow label={t("prof3.basic.scope")}><Value>{t("lf.trust")}</Value></DefRow>
        <DefRow label={t("prof3.basic.campuses")}><Value>{t("lf.c.main")} · {t("lf.c.north")}</Value></DefRow>
        <DefRow label={t("prof3.rec.staffId")} last><Value mono>{me.id}</Value></DefRow>

        <div style={{ marginTop: 14, paddingTop: 10, borderTop: "1px solid " + c.rule }}>
          <GroupHead label={t("prof3.basic.group.contact")} />
          <DefRow label={t("prof3.rec.phone")}><Value mono>{DIRECTOR_PHONE}</Value></DefRow>
          <DefRow label={t("prof3.rec.email")} last><Value>arvind.bhatia@example.com</Value></DefRow>
        </div>

        <p style={ty("caption", { color: c.inkMuted, margin: "18px 0 0", paddingTop: 16, borderTop: "1px solid " + c.rule })}>
          {t("prof3.basic.note")}
        </p>
        <div style={{ marginTop: 12 }}>
          <Button kind="primary" size="sm" iconLeft="mail">{t("prof3.rec.ask")}</Button>
        </div>
      </Card>
    );
  }

  function Profile({ role, onNavigate }) {
    P = window.NaveyaPersonFor ? window.NaveyaPersonFor(role) : window.NaveyaPerson;
    const { c } = useTheme();
    const { t, ty, lang } = useLang();
    const L = G3.layout;
    const full = isEmployeeRecord(role || "employee");

    return (
      <div
        className="nv3"
        style={{ display: "flex", minHeight: "100vh", background: c.page, color: c.ink, fontFamily: G3.font.ui }}
      >
        <Rail role={role || "employee"} active="profile" onNavigate={onNavigate} />

        {/* overflowX clip contains the page motif, drawn past the right
            edge on purpose; without it the document picks up a sideways
            scrollbar a full-page screenshot would never show. */}
        <main style={{ flex: 1, minWidth: 0, position: "relative", overflowX: "clip" }}>
          <Motif />
          <div style={{ position: "relative", zIndex: 1, maxWidth: L.contentMax, margin: "0 auto", padding: "22px " + L.contentPadX + "px 56px" }}>

            {/* top strip — matches Home's and My Attendance's exactly */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, marginBottom: 16 }}>
              <div style={ty("small", { color: c.inkMuted })}>
                <span style={{ color: c.ink, fontWeight: 700 }}>{t("nav.profile")}</span>
                <span style={{ margin: "0 8px", color: c.inkFaint }}>·</span>
                <span>{full ? t("home.school") : t("lf.trust")}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <ThemeToggle />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <h1 style={ty("display", { margin: 0, color: c.ink })}>{t("prof3.pageTitle")}</h1>
              <div style={ty("small", { color: c.inkMuted, marginTop: 6 })}>
                {full ? t(UI.identityKeyFor(role)) : UI.profileFor(role).name + " · " + t(UI.profileFor(role).titleKey)}
              </div>
            </div>

            {/* Two columns on one rhythm: the three long sections down the
                left (record → identifiers → what the school holds), the two
                short ones down the right. Equal gaps everywhere, so the
                left column reads as three evenly spaced sections. */}
            <div style={{ display: "flex", gap: L.gap, alignItems: "flex-start" }}>
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: L.gap }}>
                {full ? <RecordCard /> : <BasicRecordCard role={role} />}
                {/* the identifier vault and the document holdings are
                    PAYROLL and STAFF-FILE facts — a person the school
                    does not employ has neither, so the cards are absent
                    rather than empty */}
                {full ? <TermsCard /> : null}
                {full ? <PayCard /> : null}
                {full ? <IdentifiersCard /> : null}
                {full ? <HoldingsRegister /> : null}
              </div>
              <div style={{ flex: "0 0 " + L.colNarrow + "px", minWidth: 0, display: "flex", flexDirection: "column", gap: L.gap }}>
                <SecurityCard phone={full ? null : DIRECTOR_PHONE} />
                {full ? <ConsentCard /> : null}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  window.Pages3 = window.Pages3 || {};
  window.Pages3.Profile = Profile;
})();
