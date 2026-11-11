/* @jsxRuntime classic */
/* ============================================================
   Naveya — Add an employee · window.Pages3.HRAdd   (HR-02a)

   Two buttons said "Add an employee" and neither did anything: the
   staff register could be read, filtered and exported, but nobody
   could be put on it. This is that flow (designer, 2026-09-25).

   WHAT IT IS AND IS NOT

   It is the SHORTEST FORM THAT MAKES A REAL RECORD — the fields
   HR-03 will show the moment this is saved, and nothing else. It is
   deliberately not an onboarding wizard: joining documents are ASKED
   for (M4 — HR initiates, the employee responds), they are not
   uploaded here on her behalf, and everything that can be filled in
   later is marked as such instead of blocking the joining.

   FIVE GROUPS, IN THE ORDER A JOINING ACTUALLY HAPPENS
     1 · The person        → who walked in, and how to reach her
     2 · The job           → what she is on the roll to do
     3 · The contract      → the terms, which the record then holds
     4 · Pay               → the group and the contracted figure
     5 · Numbers & papers  → what she brought, what we must ask for

   RULES THIS SCREEN OBEYS
   · Money is a Decimal figure in rupees, typed once, never a float
     and never a slider.
   · Statutory numbers are OPTIONAL here. "Not everyone has all of
     these" is a rule of the record (a support-staff joiner with no
     PAN is a legitimate record), so a missing number is a gap the
     document requests will close, not a blocked form.
   · Nothing about salary, PAN or bank ever reaches the register
     columns — this form writes the record, and the record decides who
     may read each field.
   · The consequences are written BEFORE the button, not discovered
     after it: what is created, who is emailed, what is asked for.
   · One language at a time, every demo value authored in both.
   ============================================================ */
(function () {
  const G3 = window.G3;
  const UI = window.UI3;
  const { useState } = React;
  const {
    useTheme, ThemeToggle, useLang, addStrings,
    Rail, Motif, Card, Button, LinkButton, Chip, StatusMark, Icon,
    Field, Input, Select, Switch, EmptyState, inr, num,
  } = UI;

  const TODAY = "2026-08-11";

  /* the taxonomy this form writes into — the same lists HR-02 filters
     by and HR-03 displays, so a person added here is indistinguishable
     from one who was always there */
  const CAMPUSES = ["indiranagar", "whitefield"];
  const DEPARTMENTS = ["science", "math", "english", "socialSci", "languages", "primary", "prePrimary", "admin", "transport", "hostel"];
  const CATEGORIES = ["teaching", "nonTeaching", "support", "guest"];
  const EMPLOYMENT = ["permanent", "probation", "fixedTerm", "perLecture"];
  const PAY_GROUPS = ["teachingMonthly", "nonTeachingMonthly", "supportMonthly", "perLecture"];

  /* what her category must hold (HR-08's taxonomy, trimmed to what a
     joiner is asked for on day one) */
  const ASK_BY_CATEGORY = {
    teaching: ["degree", "bed", "tet", "pan", "aadhaar", "police", "medical", "address"],
    nonTeaching: ["degree", "pan", "aadhaar", "police", "medical", "address"],
    support: ["aadhaar", "police", "medical", "address"],
    guest: ["degree", "pan", "aadhaar", "police", "address"],
  };
  const DOC_TYPES = ["degree", "bed", "tet", "pan", "aadhaar", "police", "medical", "address"];

  function addIsoDays(iso, n) {
    const d = new Date(iso + "T00:00:00");
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  }

  function fmtIso(t, s) {
    if (!s) return null;
    const p = s.split("-");
    return String(Number(p[2])) + " " + t("add3.mon." + p[1]) + " " + p[0];
  }

  /* ============================================================
     A group of fields, titled. Five of these ARE the screen, so the
     shape is one component and the sections cannot drift apart.
     ============================================================ */
  function Group({ n, title, sub, children, note }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <Card>
        <div style={{ display: "flex", gap: 12, alignItems: "baseline", marginBottom: 4 }}>
          <span style={G3.fig("sm", { color: c.inkFaint, fontWeight: 700 })}>{n}</span>
          <div style={{ minWidth: 0 }}>
            <h2 style={ty("h2", { margin: 0, color: c.ink })}>{title}</h2>
            {sub ? <p style={ty("caption", { margin: "4px 0 0", color: c.inkMuted })}>{sub}</p> : null}
          </div>
        </div>
        <div style={{ marginTop: 16 }}>{children}</div>
        {note ? <p style={ty("caption", { margin: "2px 0 0", color: c.inkFaint })}>{note}</p> : null}
      </Card>
    );
  }

  /* two fields on a row at desk width, one on a phone */
  /* HR's pay-group names against payroll's structures. One map, here,
     rather than a guess at each call site. */
  const STRUCT_OF = {
    teachingMonthly: "teach3",
    nonTeachingMonthly: "admin2",
    supportMonthly: "admin2",
    perLecture: null,
  };

  function PayBreakdown({ group, basic, gross }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const S = (window.Pages3 && window.Pages3.PYSalData) || null;
    const key = group ? STRUCT_OF[group] : undefined;
    const struct = S && key ? S.structByKey(key) : null;

    function how(cp) {
      if (cp.calc === "grade") return t("add3.bd.grade");
      if (cp.calc === "pct") return t("add3.bd.pct", { n: num(cp.pct), of: t("pys3.c." + cp.of) });
      if (cp.calc === "flat") return t("add3.bd.flat");
      return t("add3.bd.bal");
    }

    const ready = !!struct && basic > 0 && gross > 0 && basic <= gross;
    const lines = ready ? S.priceComponents(struct, basic, gross) : null;

    return (
      <div style={{
        border: "1px solid " + c.rule, borderRadius: G3.r.md,
        background: c.sunken, padding: "16px 18px", marginTop: 4,
      }}>
        <div style={ty("small", { color: c.ink, fontWeight: 700 })}>{t("add3.bd.title")}</div>
        <p style={ty("caption", { color: c.inkMuted, margin: "4px 0 0" })}>
          {group && key === null ? t("add3.bd.noRule") : ready ? t("add3.bd.sub") : t("add3.bd.pick")}
        </p>
        {lines ? (
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 14 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid " + c.ruleStrong }}>
                {[t("add3.bd.part"), t("add3.bd.how"), t("add3.bd.amt")].map(function (h, i) {
                  return (
                    <th key={h} scope="col" style={ty("colLabel", {
                      color: c.inkFaint, textAlign: i === 2 ? "right" : "left",
                      padding: "0 8px 8px", textTransform: "uppercase", whiteSpace: "nowrap",
                    })}>{h}</th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {lines.map(function (ln, i) {
                return (
                  <tr key={ln.code} style={{ borderBottom: i < lines.length - 1 ? "1px solid " + c.rule : "none" }}>
                    <td style={ty("small", { padding: "9px 8px", color: c.ink, fontWeight: 600 })}>{t("pys3.c." + ln.code)}</td>
                    <td style={ty("caption", { padding: "9px 8px", color: c.inkMuted })}>{how(ln.cp)}</td>
                    <td style={G3.fig("sm", { padding: "9px 8px", textAlign: "right", color: c.ink, fontWeight: 600 })}>{inr(ln.v)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: "1.5px solid " + c.ruleStrong }}>
                <td colSpan={2} style={ty("small", { padding: "11px 8px", color: c.ink, fontWeight: 700 })}>{t("add3.bd.total")}</td>
                <td style={G3.fig("md", { padding: "11px 8px", textAlign: "right", color: c.ink, fontWeight: 700 })}>{inr(gross)}</td>
              </tr>
            </tfoot>
          </table>
        ) : null}
      </div>
    );
  }

  function Row({ children }) {
    return <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>{children}</div>;
  }
  function Half({ children }) {
    return <div style={{ flex: "1 1 260px", minWidth: 0 }}>{children}</div>;
  }

  /* ============================================================
     THE FORM
     ============================================================ */
  function HRAdd({ role, onNavigate }) {
    const { c } = useTheme();
    const { t, ty, lang } = useLang();
    const L = G3.layout;

    const [f, setF] = useState({
      name: "", gender: "", dob: "", phone: "", email: "", address: "",
      kinName: "", kinPhone: "",
      campus: "indiranagar", dept: "", category: "", desig: "", reportsTo: "",
      employment: "", doj: "", contractEnd: "", notice: "60", vacation: true,
      payGroup: "",
      basic: "",
      gross: "",
      pan: "", aadhaar: "", uan: "", esic: "", bank: "", ifsc: "",
      invite: true, inviteHow: "both", inviteWhen: "now",
    });
    const [ask, setAsk] = useState({});
    const [askTouched, setAskTouched] = useState(false);
    const [err, setErr] = useState({});
    const [created, setCreated] = useState(null);

    function set(k, v) {
      setF(function (cur) { return Object.assign({}, cur, { [k]: v }); });
      setErr({});
    }

    /* the documents to ask for follow the staff category until HR
       touches the list — a default that keeps up with the form is
       worth more than one that is right once */
    const asked = askTouched
      ? DOC_TYPES.filter((k) => ask[k])
      : (ASK_BY_CATEGORY[f.category] || []);
    function toggleAsk(k) {
      const base = {};
      (askTouched ? DOC_TYPES.filter((x) => ask[x]) : (ASK_BY_CATEGORY[f.category] || [])).forEach((x) => { base[x] = true; });
      base[k] = !base[k];
      setAsk(base);
      setAskTouched(true);
    }

    const isFixed = f.employment === "fixedTerm" || f.employment === "perLecture";

    function submit() {
      const e = {};
      if (!f.name.trim()) e.name = "add3.err.name";
      if (!f.gender) e.gender = "add3.err.pick";
      if (!f.phone.trim()) e.phone = "add3.err.phone";
      /* HER SIGN-IN IS A CONTRACT FACT, NOT A NICETY. A record with no
         address is a person who cannot be let in, and the account that
         is supposed to turn Active never can. */
      if (!f.email.trim()) e.email = "add3.err.email";
      else if (f.email.indexOf("@") < 1 || f.email.indexOf(".", f.email.indexOf("@")) < 0) e.email = "add3.err.emailForm";
      if (!f.dept) e.dept = "add3.err.pick";
      if (!f.category) e.category = "add3.err.pick";
      if (!f.desig.trim()) e.desig = "add3.err.desig";
      if (!f.employment) e.employment = "add3.err.pick";
      if (!f.doj) e.doj = "add3.err.doj";
      if (isFixed && !f.contractEnd) e.contractEnd = "add3.err.contractEnd";
      if (!f.payGroup) e.payGroup = "add3.err.pick";
      /* the salary is HR's now, so it is required like any other
         contract fact -- a person with no salary cannot be run */
      if (!String(f.gross).trim()) e.gross = "add3.err.gross";
      else if (!(Number(f.gross) > 0)) e.gross = "add3.err.grossNum";
      if (!String(f.basic).trim()) e.basic = "add3.err.basic";
      else if (!(Number(f.basic) > 0)) e.basic = "add3.err.basicNum";
      else if (Number(f.basic) > Number(f.gross)) e.basic = "add3.err.basicOver";
      setErr(e);
      if (Object.keys(e).length) {
        const first = document.getElementById("add3-" + Object.keys(e)[0]);
        if (first && first.scrollIntoView) first.scrollIntoView({ block: "center" });
        return;
      }
      setCreated({ code: "NAV-0261", name: f.name.trim(), asked: asked.length, doj: f.doj,
                   email: f.email.trim(), invite: f.invite, when: f.inviteWhen, how: f.inviteHow });
    }

    /* ---- the done state: the record exists, so the screen stops
            being a form and becomes three ways onward -------------- */
    if (created) {
      return (
        <Shell role={role} onNavigate={onNavigate}>
          <Card>
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
              <span
                aria-hidden="true"
                style={{
                  width: 40, height: 40, borderRadius: G3.r.pill, background: c.presentTint, color: c.presentText,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}
              >
                <Icon name="check" size={20} />
              </span>
              <div style={{ flex: 1, minWidth: 260 }}>
                <h1 style={ty("h1", { margin: 0, color: c.ink })}>{t("add3.done.head", { name: created.name })}</h1>
                <p style={ty("small", { color: c.inkMuted, margin: "6px 0 0" })}>
                  {t("add3.done.body", { code: created.code, date: fmtIso(t, created.doj) })}
                </p>
                <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginTop: 16, alignItems: "center" }}>
                  <Button kind="primary" size="sm" iconLeft="profile" onClick={() => onNavigate && onNavigate("hrRecord")}>{t("add3.done.open")}</Button>
                  <Button kind="secondary" size="sm" iconLeft="document" onClick={() => onNavigate && onNavigate("hrDocs")}>{t("add3.done.docs", { n: num(created.asked) })}</Button>
                  <LinkButton onClick={() => { setCreated(null); setF(Object.assign({}, f, { name: "", dob: "", phone: "", email: "", address: "", kinName: "", kinPhone: "", desig: "", pan: "", aadhaar: "", uan: "", esic: "", bank: "", ifsc: "" })); }}>
                    {t("add3.done.another")}
                  </LinkButton>
                </div>
              </div>
            </div>
            {/* THE RECORD IS DONE; THE ACCOUNT IS NOT. The office has
                finished its half, and the screen says plainly whose
                move it is now and what it will look like when she
                makes it. */}
            <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid " + c.rule,
                          display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
              <span aria-hidden="true" style={{
                width: 34, height: 34, borderRadius: G3.r.pill, background: c.lateTint, color: c.lateText,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Icon name="clock" size={17} />
              </span>
              <div style={{ flex: 1, minWidth: 280 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <StatusMark role="late" word={t("add3.done.invited")} glyph="clock" />
                  <span style={ty("small", { color: c.ink, fontWeight: 600, wordBreak: "break-word" })}>{created.email}</span>
                </div>
                <p style={ty("caption", { margin: "7px 0 0", color: c.inkMuted })}>
                  {created.invite
                    ? t(created.when === "now" ? "add3.done.sentNow" : "add3.done.sentDoj",
                        { email: created.email, date: fmtIso(t, created.doj),
                          /* the inner string carries {email} of its own, so it
                             needs the var too -- t() only fills the call it is given */
                          how: t(created.how === "both" ? "add3.done.howBoth" : "add3.done.howMail", { email: created.email }) })
                    : t("add3.done.noInvite")}
                </p>
                <p style={ty("caption", { margin: "5px 0 0", color: c.inkMuted })}>{t("add3.done.turnsActive")}</p>
                <div style={{ marginTop: 12 }}>
                  <Button kind="secondary" size="sm" iconLeft="lock" onClick={() => onNavigate && onNavigate("hrLogins")}>{t("add3.done.logins")}</Button>
                </div>
              </div>
            </div>
            <p style={ty("caption", { margin: "18px 0 0", paddingTop: 14, borderTop: "1px solid " + c.rule, color: c.inkFaint })}>{t("add3.done.note")}</p>
          </Card>
        </Shell>
      );
    }

    const summary = [
      { k: "who", label: t("add3.sum.who"), value: f.name.trim() || t("add3.sum.blank") },
      { k: "job", label: t("add3.sum.job"), value: f.desig.trim() && f.dept ? f.desig.trim() + " · " + t("add3.dept." + f.dept) : t("add3.sum.blank") },
      { k: "terms", label: t("add3.sum.terms"), value: f.employment ? t("add3.emp." + f.employment) + (f.doj ? " · " + fmtIso(t, f.doj) : "") : t("add3.sum.blank") },
      { k: "pay", label: t("add3.sum.pay"), value: f.payGroup ? t("add3.pay." + f.payGroup) : t("add3.sum.blank") },
      { k: "fig", label: t("add3.sum.fig"),
        value: Number(f.gross) > 0 ? inr(Number(f.gross)) : t("add3.sum.blank") },
      { k: "ask", label: t("add3.sum.ask"), value: asked.length ? t("add3.sum.askN", { n: num(asked.length) }) : t("add3.sum.askNone") },
      { k: "login", label: t("add3.sum.login"), value: f.email.trim() || t("add3.sum.blank") },
    ];

    return (
      <Shell role={role} onNavigate={onNavigate}>
        <div style={{ marginBottom: L.gap }}>
          <h1 style={ty("display", { margin: 0, color: c.ink })}>{t("add3.title")}</h1>
        </div>

        <div style={{ display: "flex", gap: L.gap, alignItems: "flex-start" }}>
          <div style={{ flex: "1.6 1 0", minWidth: 0, display: "flex", flexDirection: "column", gap: L.gap }}>

            <Group n="1" title={t("add3.g1.title")} sub={t("add3.g1.sub")}>
              <Row>
                <Half>
                  <Field id="add3-name" label={t("add3.f.name")} error={err.name ? t(err.name) : null}>
                    <Input id="add3-name" value={f.name} onChange={(v) => set("name", v)} placeholder={t("add3.f.namePh")} invalid={!!err.name} />
                  </Field>
                </Half>
                <Half>
                  <Field id="add3-gender" label={t("add3.f.gender")} error={err.gender ? t(err.gender) : null}>
                    <Select
                      id="add3-gender" value={f.gender} onChange={(v) => set("gender", v)}
                      options={[{ value: "", label: t("add3.f.pick") }, { value: "f", label: t("add3.gender.f") }, { value: "m", label: t("add3.gender.m") }, { value: "x", label: t("add3.gender.x") }]}
                    />
                  </Field>
                </Half>
              </Row>
              <Row>
                <Half>
                  <Field id="add3-dob" label={t("add3.f.dob")} hint={t("add3.f.dobHint")}>
                    <Input id="add3-dob" type="date" value={f.dob} onChange={(v) => set("dob", v)} />
                  </Field>
                </Half>
                <Half>
                  <Field id="add3-phone" label={t("add3.f.phone")} hint={t("add3.f.phoneHint")} error={err.phone ? t(err.phone) : null}>
                    <Input id="add3-phone" value={f.phone} onChange={(v) => set("phone", v)} placeholder="+91 " inputMode="tel" invalid={!!err.phone} />
                  </Field>
                </Half>
              </Row>
              <Row>
                <Half>
                  <Field id="add3-email" label={t("add3.f.email")} hint={t("add3.f.emailHint")} error={err.email ? t(err.email) : null}>
                    <Input id="add3-email" type="email" value={f.email} onChange={(v) => set("email", v)}
                           placeholder={t("add3.f.emailPh")} inputMode="email" invalid={!!err.email} />
                  </Field>
                </Half>
                <Half>
                  <Field id="add3-address" label={t("add3.f.address")} hint={t("add3.f.addressHint")}>
                    <Input id="add3-address" value={f.address} onChange={(v) => set("address", v)} />
                  </Field>
                </Half>
              </Row>
              <Row>
                <Half>
                  <Field id="add3-kinName" label={t("add3.f.kinName")} hint={t("add3.f.kinHint")}>
                    <Input id="add3-kinName" value={f.kinName} onChange={(v) => set("kinName", v)} placeholder={t("add3.f.kinPh")} />
                  </Field>
                </Half>
                <Half>
                  <Field id="add3-kinPhone" label={t("add3.f.kinPhone")}>
                    <Input id="add3-kinPhone" value={f.kinPhone} onChange={(v) => set("kinPhone", v)} inputMode="tel" />
                  </Field>
                </Half>
              </Row>
            </Group>

            <Group n="2" title={t("add3.g2.title")} sub={t("add3.g2.sub")}>
              <Row>
                <Half>
                  <Field id="add3-campus" label={t("add3.f.campus")}>
                    <Select
                      id="add3-campus" value={f.campus} onChange={(v) => set("campus", v)}
                      options={CAMPUSES.map((k) => ({ value: k, label: t("add3.campus." + k) }))}
                    />
                  </Field>
                </Half>
                <Half>
                  <Field id="add3-dept" label={t("add3.f.dept")} error={err.dept ? t(err.dept) : null}>
                    <Select
                      id="add3-dept" value={f.dept} onChange={(v) => set("dept", v)}
                      options={[{ value: "", label: t("add3.f.pick") }].concat(DEPARTMENTS.map((k) => ({ value: k, label: t("add3.dept." + k) })))}
                    />
                  </Field>
                </Half>
              </Row>
              <Row>
                <Half>
                  <Field id="add3-category" label={t("add3.f.category")} hint={t("add3.f.categoryHint")} error={err.category ? t(err.category) : null}>
                    <Select
                      id="add3-category" value={f.category} onChange={(v) => { set("category", v); setAskTouched(false); }}
                      options={[{ value: "", label: t("add3.f.pick") }].concat(CATEGORIES.map((k) => ({ value: k, label: t("add3.cat." + k) })))}
                    />
                  </Field>
                </Half>
                <Half>
                  <Field id="add3-desig" label={t("add3.f.desig")} hint={t("add3.f.desigHint")} error={err.desig ? t(err.desig) : null}>
                    <Input id="add3-desig" value={f.desig} onChange={(v) => set("desig", v)} placeholder={t("add3.f.desigPh")} invalid={!!err.desig} />
                  </Field>
                </Half>
              </Row>
              <Field id="add3-reportsTo" label={t("add3.f.reportsTo")} hint={t("add3.f.reportsToHint")}>
                <Input id="add3-reportsTo" value={f.reportsTo} onChange={(v) => set("reportsTo", v)} placeholder={t("add3.f.reportsToPh")} />
              </Field>
            </Group>

            <Group n="3" title={t("add3.g3.title")} sub={t("add3.g3.sub")}>
              <Row>
                <Half>
                  <Field id="add3-employment" label={t("add3.f.employment")} error={err.employment ? t(err.employment) : null}>
                    <Select
                      id="add3-employment" value={f.employment} onChange={(v) => set("employment", v)}
                      options={[{ value: "", label: t("add3.f.pick") }].concat(EMPLOYMENT.map((k) => ({ value: k, label: t("add3.emp." + k) })))}
                    />
                  </Field>
                </Half>
                <Half>
                  <Field id="add3-doj" label={t("add3.f.doj")} hint={t("add3.f.dojHint")} error={err.doj ? t(err.doj) : null}>
                    <Input id="add3-doj" type="date" value={f.doj} onChange={(v) => set("doj", v)} />
                  </Field>
                </Half>
              </Row>
              <Row>
                {isFixed ? (
                  <Half>
                    <Field id="add3-contractEnd" label={t("add3.f.contractEnd")} hint={t("add3.f.contractEndHint")} error={err.contractEnd ? t(err.contractEnd) : null}>
                      <Input id="add3-contractEnd" type="date" value={f.contractEnd} onChange={(v) => set("contractEnd", v)} />
                    </Field>
                  </Half>
                ) : null}
                <Half>
                  <Field id="add3-notice" label={t("add3.f.notice")} hint={t("add3.f.noticeHint")}>
                    <Input id="add3-notice" value={f.notice} onChange={(v) => set("notice", v)} inputMode="numeric" />
                  </Field>
                </Half>
              </Row>
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start", flexWrap: "wrap", marginTop: 2 }}>
                <Switch id="add3-vacation" checked={f.vacation} onChange={(v) => set("vacation", v)} label={t("add3.f.vacation")} />
                <p style={ty("caption", { margin: 0, color: c.inkFaint, flex: 1, minWidth: 240 })}>{t("add3.f.vacationHint")}</p>
              </div>
            </Group>

            <Group n="4" title={t("add3.g4.title")} sub={t("add3.g4.sub")} note={t("add3.g4.note")}>
              <Row>
                <Half>
                  <Field id="add3-payGroup" label={t("add3.f.payGroup")} error={err.payGroup ? t(err.payGroup) : null}>
                    <Select
                      id="add3-payGroup" value={f.payGroup} onChange={(v) => set("payGroup", v)}
                      options={[{ value: "", label: t("add3.f.pick") }].concat(PAY_GROUPS.map((k) => ({ value: k, label: t("add3.pay." + k) })))}
                    />
                  </Field>
                </Half>
                <Half>
                  {/* THE FIGURE IS HR'S AGAIN (designer, 2026-10-15),
                      reversing the 2026-10-07 split. HR sets the
                      salary when it creates the person; payroll reads
                      it and asks for a correction if it looks wrong. */}
                  <Field id="add3-gross" label={t("add3.f.gross")} hint={t("add3.f.grossHint")}
                    error={err.gross ? t(err.gross) : null}>
                    <Input id="add3-gross" value={f.gross} onChange={(v) => set("gross", v)} inputMode="numeric" />
                  </Field>
                </Half>
              </Row>
              <Row>
                <Half>
                  <Field id="add3-basic" label={t("add3.f.basic")} hint={t("add3.f.basicHint")}
                    error={err.basic ? t(err.basic) : null}>
                    <Input id="add3-basic" value={f.basic} onChange={(v) => set("basic", v)} inputMode="numeric" />
                  </Field>
                </Half>
                <Half />
              </Row>
              <PayBreakdown group={f.payGroup} basic={Number(f.basic)} gross={Number(f.gross)} />
              <Row>
                <Half>
                  <Field id="add3-bank" label={t("add3.f.bank")} hint={t("add3.f.bankHint")}>
                    <Input id="add3-bank" value={f.bank} onChange={(v) => set("bank", v)} inputMode="numeric" />
                  </Field>
                </Half>
                <Half>
                  <Field id="add3-ifsc" label={t("add3.f.ifsc")}>
                    <Input id="add3-ifsc" value={f.ifsc} onChange={(v) => set("ifsc", v)} />
                  </Field>
                </Half>
              </Row>
            </Group>

            <Group n="5" title={t("add3.g5.title")} sub={t("add3.g5.sub")} note={t("add3.g5.note")}>
              <Row>
                <Half>
                  <Field id="add3-pan" label={t("add3.f.pan")}>
                    <Input id="add3-pan" value={f.pan} onChange={(v) => set("pan", v)} />
                  </Field>
                </Half>
                <Half>
                  <Field id="add3-aadhaar" label={t("add3.f.aadhaar")} hint={t("add3.f.aadhaarHint")}>
                    <Input id="add3-aadhaar" value={f.aadhaar} onChange={(v) => set("aadhaar", v)} inputMode="numeric" />
                  </Field>
                </Half>
              </Row>
              <Row>
                <Half>
                  <Field id="add3-uan" label={t("add3.f.uan")} hint={t("add3.f.uanHint")}>
                    <Input id="add3-uan" value={f.uan} onChange={(v) => set("uan", v)} inputMode="numeric" />
                  </Field>
                </Half>
                <Half>
                  <Field id="add3-esic" label={t("add3.f.esic")}>
                    <Input id="add3-esic" value={f.esic} onChange={(v) => set("esic", v)} inputMode="numeric" />
                  </Field>
                </Half>
              </Row>

              {/* what we will ASK her for — never what we upload for
                  her (M4: HR initiates, the employee responds) */}
              <div style={{ marginTop: 6, paddingTop: 14, borderTop: "1px solid " + c.rule }}>
                <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 4 })}>{t("add3.ask.head")}</div>
                <p style={ty("caption", { color: c.inkMuted, margin: "0 0 12px" })}>
                  {f.category ? t("add3.ask.body", { cat: t("add3.cat." + f.category), date: fmtIso(t, addIsoDays(f.doj || TODAY, 14)) }) : t("add3.ask.pickFirst")}
                </p>
                <div style={{ display: "flex", gap: "10px 22px", flexWrap: "wrap" }}>
                  {DOC_TYPES.map((k) => {
                    const on = asked.indexOf(k) !== -1;
                    return (
                      <label key={k} htmlFor={"add3-ask-" + k} style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                        <input id={"add3-ask-" + k} type="checkbox" checked={on} onChange={() => toggleAsk(k)} />
                        <span style={ty("small", { color: on ? c.ink : c.inkMuted, fontWeight: on ? 600 : 500 })}>{t("add3.doc." + k)}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </Group>

            {/* ============================================================
                6 · HER LOGIN. The account is made by this form and is
                finished by HER: it is created Invited, and the FIRST
                SIGN-IN is what turns it Active. Nothing in the office
                can flip that word on her behalf, which is the whole
                reason the word is worth printing.
                ============================================================ */}
            <Group n="6" title={t("add3.g6.title")} sub={t("add3.g6.sub")}>
              <div style={{ background: c.sunken, borderRadius: G3.r.lg, padding: "14px 16px", marginBottom: 18 }}>
                <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 6 })}>{t("add3.g6.signsIn")}</div>
                <div style={ty("h3", { color: f.email.trim() ? c.ink : c.inkFaint, wordBreak: "break-word" })}>
                  {f.email.trim() || t("add3.g6.noEmail")}
                </div>
                <p style={ty("caption", { margin: "6px 0 0", color: c.inkMuted })}>{t("add3.g6.signsInNote")}</p>
              </div>

              <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap", marginBottom: f.invite ? 18 : 4 }}>
                <Switch id="add3-invite" checked={f.invite} onChange={(v) => set("invite", v)} label={t("add3.f.invite")} />
                <p style={ty("caption", { margin: 0, color: c.inkFaint, flex: 1, minWidth: 220 })}>
                  {f.invite ? t("add3.f.inviteHint") : t("add3.f.inviteOff")}
                </p>
              </div>

              {f.invite ? (
                <React.Fragment>
                  <Row>
                    <Half>
                      <Field id="add3-inviteWhen" label={t("add3.f.when")}>
                        <Select
                          id="add3-inviteWhen" value={f.inviteWhen} onChange={(v) => set("inviteWhen", v)}
                          options={[
                            { value: "now", label: t("add3.when.now") },
                            { value: "doj", label: t("add3.when.doj") },
                          ]}
                        />
                      </Field>
                    </Half>
                    <Half>
                      <Field id="add3-inviteHow" label={t("add3.f.how")}>
                        <Select
                          id="add3-inviteHow" value={f.inviteHow} onChange={(v) => set("inviteHow", v)}
                          options={[
                            { value: "both", label: t("add3.how.both") },
                            { value: "mail", label: t("add3.how.mail") },
                          ]}
                        />
                      </Field>
                    </Half>
                  </Row>
                  <p style={ty("caption", { margin: "-6px 0 16px", color: c.inkFaint })}>
                    {t(f.inviteHow === "both" ? "add3.how.bothNote" : "add3.how.mailNote")}
                  </p>
                </React.Fragment>
              ) : null}

              {/* the one sentence this group exists to say */}
              <div style={{ display: "flex", gap: 11, alignItems: "flex-start", borderTop: "1px solid " + c.rule, paddingTop: 14 }}>
                <span aria-hidden="true" style={{ display: "flex", color: c.lateText, paddingTop: 1 }}><Icon name="clock" size={15} /></span>
                <p style={ty("caption", { margin: 0, color: c.inkMuted })}>{t("add3.g6.activeRule")}</p>
              </div>
            </Group>
          </div>

          {/* the right column stays with you: what is about to be
              created, what will happen, and the one button */}
          <div style={{ flex: "1 1 0", minWidth: 0, position: "sticky", top: 18, display: "flex", flexDirection: "column", gap: L.gap }}>
            <Card icon="staff" iconTone="accent" title={t("add3.sum.title")} sub={t("add3.sum.sub")}>
              {summary.map((s, i) => (
                <div key={s.k} style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "baseline", padding: "9px 0", borderBottom: i < summary.length - 1 ? "1px dashed " + c.border : "none" }}>
                  <span style={ty("caption", { color: c.inkMuted, fontWeight: 600 })}>{s.label}</span>
                  {s.mono
                    ? <span style={G3.fig("sm", { color: c.ink, fontWeight: 600, textAlign: "end" })}>{s.value}</span>
                    : <span style={ty("small", { color: c.ink, fontWeight: 600, textAlign: "end" })}>{s.value}</span>}
                </div>
              ))}

              <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid " + c.rule }}>
                <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 8 })}>{t("add3.next.head")}</div>
                {["add3.next.1", "add3.next.2", "add3.next.3", "add3.next.4", f.invite ? "add3.next.5" : "add3.next.5off"].map((k, i) => (
                  <div key={k} style={{ display: "flex", gap: 9, alignItems: "flex-start", marginTop: i ? 7 : 0 }}>
                    <span aria-hidden="true" style={{ width: 5, height: 5, borderRadius: G3.r.pill, background: c.inkFaint, marginTop: 7, flexShrink: 0 }} />
                    <span style={ty("caption", { color: c.inkMuted })}>{t(k, { n: num(asked.length), email: f.email.trim() || t("add3.next.emailBlank") })}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
                <Button kind="primary" size="sm" iconLeft="staff" onClick={submit}>{t("add3.cta")}</Button>
                <Button kind="ghost" size="sm" onClick={() => onNavigate && onNavigate("hrStaff")}>{t("add3.cancel")}</Button>
              </div>
              {Object.keys(err).length ? (
                <p style={ty("caption", { margin: "12px 0 0", color: c.dangerText })}>{t("add3.err.summary", { n: num(Object.keys(err).length) })}</p>
              ) : null}
            </Card>

            <Card>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span aria-hidden="true" style={{ display: "flex", color: c.inkFaint, paddingTop: 1 }}><Icon name="lock" size={15} /></span>
                <p style={ty("caption", { margin: 0, color: c.inkMuted })}>{t("add3.privacy")}</p>
              </div>
            </Card>
          </div>
        </div>
      </Shell>
    );
  }

  /* the page chrome, shared by the form and its done state */
  function Shell({ role, onNavigate, children }) {
    const { c } = useTheme();
    const { t, ty, lang } = useLang();
    const L = G3.layout;
    return (
      <div className="nv3" style={{ display: "flex", minHeight: "100vh", background: c.page, color: c.ink, fontFamily: G3.font.ui }}>
        <Rail role={role || "hr"} active="hrStaff" onNavigate={onNavigate} initials="MI" />
        <main style={{ flex: 1, minWidth: 0, position: "relative", overflowX: "clip" }}>
          <Motif />
          <div style={{ position: "relative", zIndex: 1, maxWidth: L.contentMax, margin: "0 auto", padding: "22px " + L.contentPadX + "px 56px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, marginBottom: 12 }}>
              <div style={ty("small", { color: c.inkMuted })}>
                <span style={{ color: c.ink, fontWeight: 700 }}>{t("nav.hrStaff")}</span>
                <span style={{ margin: "0 8px", color: c.inkFaint }}>·</span>
                <span>{t("add3.crumb")}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <ThemeToggle />
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <LinkButton onClick={() => onNavigate && onNavigate("hrStaff")}>{t("add3.back")}</LinkButton>
            </div>
            {children}
          </div>
        </main>
      </div>
    );
  }

  addStrings({
    en: {
      "add3.crumb": "Add an employee",
      "add3.back": "Back to the staff register",
      "add3.title": "Add an employee",

      "add3.g1.title": "The person",
      "add3.g1.sub": "Who has joined, and how the office makes contact.",
      "add3.g2.title": "The job",
      "add3.g2.sub": "Where this person sits on the roll. It is what the register and every board read.",
      "add3.g3.title": "The contract",
      "add3.g3.sub": "The terms in force from the first day. They are revised later by a new dated version, never edited.",
      "add3.g4.title": "Pay",
      "add3.g4.sub": "The pay group, the salary, and how the salary is split.",
      "add3.g4.note": "Payroll works the month out from this. It is never shown on the staff register.",
      "add3.g6.title": "Login and first sign-in",
      "add3.g6.sub": "The account this form creates, and what it takes to finish it.",
      "add3.g6.signsIn": "Signs in with",
      "add3.g6.noEmail": "The work email, from group 1",
      "add3.g6.signsInNote": "Change it above and this changes with it. One address, one account.",
      "add3.g6.activeRule": "The account is created Invited, not signed in. The FIRST sign-in is what turns it Active — nobody in the office can do that on somebody else's behalf, which is the point of the word.",
      "add3.f.invite": "Send the invite",
      "add3.f.inviteHint": "A link to set a password, and a one-time code to go with it.",
      "add3.f.inviteOff": "No invite goes out. The account waits on the staff-logins screen until somebody sends one.",
      "add3.f.when": "When",
      "add3.when.now": "As soon as the record is added",
      "add3.when.doj": "On the joining day",
      "add3.f.how": "Sent via",
      "add3.how.both": "Work email, and a code by text",
      "add3.how.mail": "Work email only",
      "add3.how.bothNote": "The link goes to the address, the code to the number — two channels, so a wrong digit in one of them does not lock anybody out on day one.",
      "add3.how.mailNote": "Everything goes to the address. Use this when the number has not been confirmed yet.",

      "add3.g5.title": "Numbers and papers",
      "add3.g5.sub": "What came in today, and what the office must still ask for.",
      "add3.g5.note": "Every number here is masked the moment it is saved, for every role including yours. Leave what has not come in empty.",

      "add3.f.pick": "Choose",
      "add3.f.name": "Full name",
      "add3.f.namePh": "As it appears on the documents",
      "add3.f.gender": "Gender",
      "add3.gender.f": "Female",
      "add3.gender.m": "Male",
      "add3.gender.x": "Prefers not to say",
      "add3.f.dob": "Date of birth",
      "add3.f.dobHint": "Used for gratuity and retirement; never shown to colleagues.",
      "add3.f.phone": "Personal phone",
      "add3.f.phoneHint": "Where the office makes contact, and the second place a code can go.",
      "add3.f.emailPh": "first.last@sunrisepublic.edu.in",
      "add3.f.email": "Work email",
      "add3.f.emailHint": "This is the sign-in. The invite and every one-time code go here.",
      "add3.f.address": "Home address",
      "add3.f.addressHint": "Optional today — the address proof request will bring it.",
      "add3.f.kinName": "In an emergency",
      "add3.f.kinHint": "Name and relationship.",
      "add3.f.kinPh": "Name, relationship",
      "add3.f.kinPhone": "Their phone",

      "add3.f.campus": "Campus",
      "add3.campus.indiranagar": "Indiranagar",
      "add3.campus.whitefield": "Whitefield",
      "add3.f.dept": "Department",
      "add3.dept.science": "Science",
      "add3.dept.math": "Mathematics",
      "add3.dept.english": "English",
      "add3.dept.socialSci": "Social Science",
      "add3.dept.languages": "Languages",
      "add3.dept.primary": "Primary",
      "add3.dept.prePrimary": "Pre-primary",
      "add3.dept.admin": "Administration",
      "add3.dept.transport": "Transport",
      "add3.dept.hostel": "Hostel",
      "add3.f.category": "Staff category",
      "add3.f.categoryHint": "It decides which documents the record must hold and which leave policy applies.",
      "add3.cat.teaching": "Teaching",
      "add3.cat.nonTeaching": "Non-teaching",
      "add3.cat.support": "Support",
      "add3.cat.guest": "Guest faculty",
      "add3.f.desig": "Designation",
      "add3.f.desigHint": "The words that go on the letter and the record.",
      "add3.f.desigPh": "PGT, Physics",
      "add3.f.reportsTo": "Reports to",
      "add3.f.reportsToHint": "Optional. Leave goes to this person for approval.",
      "add3.f.reportsToPh": "Head of department",

      "add3.f.employment": "Employment type",
      "add3.emp.permanent": "Permanent",
      "add3.emp.probation": "On probation",
      "add3.emp.fixedTerm": "Fixed-term",
      "add3.emp.perLecture": "Per lecture",
      "add3.f.doj": "Date of joining",
      "add3.f.dojHint": "Service, gratuity and the first payroll all count from this day.",
      "add3.f.contractEnd": "Contract ends",
      "add3.f.contractEndHint": "A fixed-term contract needs an end date; it appears on the expiry watchlist.",
      "add3.f.notice": "Notice period, in days",
      "add3.f.noticeHint": "Used when either side ends the contract.",
      "add3.f.vacation": "Teaching staff",
      "add3.f.vacationHint": "Declared vacations are paid days, and earned leave does not build up across them.",

      "add3.f.payGroup": "Pay group",
      "add3.pay.teachingMonthly": "Teaching staff, monthly",
      "add3.pay.nonTeachingMonthly": "Non-teaching, monthly",
      "add3.pay.supportMonthly": "Support staff, monthly",
      "add3.pay.perLecture": "Per lecture",
      "add3.f.gross": "Contracted monthly gross",
      "add3.f.grossHint": "Rupees, as on the contract. Paise are kept exactly.",
      "add3.f.bank": "Salary account",
      "add3.f.bankHint": "Optional today. The bank proof request will bring the passbook.",
      "add3.f.ifsc": "IFSC",

      "add3.f.pan": "PAN",
      "add3.f.aadhaar": "Aadhaar",
      "add3.f.aadhaarHint": "Only the last four digits are ever shown back.",
      "add3.f.uan": "Provident fund (UAN)",
      "add3.f.uanHint": "If there is one from an earlier employer.",
      "add3.f.esic": "Insurance number (ESIC)",

      "add3.ask.head": "Ask for",
      "add3.ask.body": "The papers a {cat} record must hold. They are answered on a phone and you check what comes back; the requests are due {date}.",
      "add3.ask.pickFirst": "Choose a staff category and the required papers are ticked for you.",
      "add3.doc.degree": "Degree certificate",
      "add3.doc.bed": "B.Ed. certificate",
      "add3.doc.tet": "Teacher eligibility",
      "add3.doc.pan": "PAN card",
      "add3.doc.aadhaar": "Aadhaar",
      "add3.doc.police": "Police verification",
      "add3.doc.medical": "Medical fitness",
      "add3.doc.address": "Address proof",

      "add3.sum.title": "What will be created",
      "add3.sum.sub": "It updates as you type.",
      "add3.sum.who": "Person",
      "add3.sum.job": "Job",
      "add3.sum.terms": "Terms",
      "add3.f.gross": "Monthly salary",
      "add3.f.grossHint": "What they are paid each month, before anything comes off",
      "add3.f.basic": "Basic pay",
      "add3.f.basicHint": "The grade on the contract. The rest is worked out from it.",
      "add3.err.gross": "Put the monthly salary in",
      "add3.err.grossNum": "A figure, please",
      "add3.err.basic": "Put the basic pay in",
      "add3.err.basicNum": "A figure, please",
      "add3.err.basicOver": "Basic pay cannot be more than the salary",
      "add3.bd.title": "What the salary is made of",
      "add3.bd.sub": "Worked out from the pay group you picked.",
      "add3.bd.pick": "Pick a pay group and put the two figures in, and the parts appear here.",
      "add3.bd.part": "Part",
      "add3.bd.how": "Worked out as",
      "add3.bd.amt": "A month",
      "add3.bd.total": "Monthly salary",
      "add3.bd.grade": "The grade on the contract",
      "add3.bd.pct": "{n}% of {of}",
      "add3.bd.flat": "A fixed amount",
      "add3.bd.bal": "Whatever is left of the salary",
      "add3.bd.noRule": "This pay group has no rule yet, so there is nothing to split.",
      "add3.sum.fig": "Monthly salary",
      "add3.sum.pay": "Monthly gross",
      "add3.sum.ask": "Documents asked for",
      "add3.sum.login": "Signs in with",
      "add3.sum.blank": "—",
      "add3.sum.askN": "{n} requests",
      "add3.sum.askNone": "None yet",

      "add3.next.head": "What happens when you add this record",
      "add3.next.1": "A staff record and a first contract version are created, dated from the joining day.",
      "add3.next.2": "A “joined” entry is written on the service book with your name against it.",
      "add3.next.3": "{n} document requests go out, and appear in Doc control until you check them.",
      "add3.next.4": "Payroll picks the record up in the next run for the days worked.",
      "add3.next.5": "The invite goes to {email}. The account reads Invited until the first sign-in, which turns it Active.",
      "add3.next.5off": "No invite goes out, so the account reads No login until somebody sends one from Staff logins.",
      "add3.next.emailBlank": "the work email",

      "add3.cta": "Add to the register",
      "add3.cancel": "Not now",
      "add3.privacy": "Phone, date of birth, address and statutory numbers are masked outside this record, and every reveal is written against whoever asked.",

      "add3.err.name": "A record needs a name.",
      "add3.err.pick": "Choose one.",
      "add3.err.phone": "The office needs a number to make contact on.",
      "add3.err.email": "The work email is the sign-in, so it cannot be blank.",
      "add3.err.emailForm": "That does not look like an email address.",
      "add3.err.desig": "Type the designation as it will appear on the letter.",
      "add3.err.doj": "A joining date is needed — service, gratuity and payroll all count from it.",
      "add3.err.contractEnd": "A fixed-term contract needs an end date.",
      "add3.err.gross": "Type the contracted monthly gross in rupees.",
      "add3.err.summary": "{n} fields still need you. They are marked above.",

      "add3.done.head": "{name} is on the register",
      "add3.done.body": "Staff ID {code} · joining {date}. The record is open for the office from now.",
      "add3.done.open": "Open the record",
      "add3.done.docs": "See the {n} requests",
      "add3.done.another": "Add another person",
      "add3.done.invited": "Invited, not signed in",
      "add3.done.sentNow": "The invite has gone out {how}.",
      "add3.done.sentDoj": "The invite goes out {how} on {date}, the joining day.",
      "add3.done.howBoth": "to {email} and by text",
      "add3.done.howMail": "to {email}",
      "add3.done.noInvite": "No invite has gone out. The account waits on Staff logins until somebody sends one.",
      "add3.done.turnsActive": "It turns Active at the first sign-in — and not before.",
      "add3.done.logins": "Open staff logins",
      "add3.done.note": "The contract is revised by a new dated version, and a correction is added with your name against it. Nothing is overwritten.",

      "add3.mon.01": "Jan", "add3.mon.02": "Feb", "add3.mon.03": "Mar", "add3.mon.04": "Apr",
      "add3.mon.05": "May", "add3.mon.06": "Jun", "add3.mon.07": "Jul", "add3.mon.08": "Aug",
      "add3.mon.09": "Sep", "add3.mon.10": "Oct", "add3.mon.11": "Nov", "add3.mon.12": "Dec",
    },
  });

  window.Pages3 = window.Pages3 || {};
  window.Pages3.HRAdd = HRAdd;
})();
