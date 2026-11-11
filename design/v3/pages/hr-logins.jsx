/* @jsxRuntime classic */
/* ============================================================
   Naveya — Staff logins · window.Pages3.HRLogins   (HR-38)

   WHO HOLDS THE KEYS. Designer ruling, 2026-09-25: "HR has to manage
   the login credentials for the employees as well… employees can't
   change it, only HR can manage the staff login credentials." So the
   employee's own profile lost its Change-password button (it now says
   who to ask) and this module exists: every staff account, on every
   campus, in one register.

   WHY A SCHOOL WORKS THIS WAY. A bus driver who cannot read English
   and a PGT with two devices are on the same roll. Self-service
   password reset assumes an email nobody checks and a recovery route
   nobody has; in practice the office resets it at the front desk and
   reads the new one out. The product should draw the thing that
   actually happens rather than the thing that is conventional.

   FOUR RULES THIS SCREEN OBEYS
   1 · A PASSWORD IS NEVER STORED IN A FORM YOU CAN READ. A new one is
       generated or typed, shown ONCE at the moment it is set, and
       thereafter the screen shows only WHEN it was set and by whom.
       Nothing here can ever display an existing password, because
       nothing in the product knows one.
   2 · The account state is a word, not a colour: Active · Invited,
       not signed in · Locked · No login. A locked account keeps its
       row (the person still works here) and says who locked it.
   3 · Every action writes a line with the actor's name — setting a
       password, locking, unlocking, signing somebody out. HR is sole
       responsible, so the audit IS the control (the same ruling that
       removed second approval from the employee record).
   4 · An exited person keeps a record and loses a login. Their row
       reads "No login — exited" and offers nothing to re-enable; a
       returning employee is matched to their existing record first.
   ============================================================ */
(function () {
  const G3 = window.G3;
  const UI = window.UI3;
  const { useState, useMemo } = React;
  const {
    useTheme, ThemeToggle, useLang, addStrings,
    Rail, Motif, Card, Register, Button, LinkButton, Chip, StatusMark, Icon,
    ActionMenu, Field, Input, Select, Switch, EmptyState, Figure, Band, num,
    CampusSwitch, campusLabel, inCampus, CAMPUS_ALL,
  } = UI;

  const TODAY = "2026-08-11";

  /* the roll, with its accounts. `state` is the ACCOUNT's, never the
     person's — Lakshmi Venkat is on notice and still signs in. */
  const ACCOUNTS = [
    { id: "a1", code: "NAV-0142", name: "Ananya Rao", email: "ananya.rao@sunrisepublic.edu.in", desig: "PGT, Physics", dept: "Science", campus: "indiranagar", phone: "+91 90000 04210", state: "active", last: "2026-08-11 07:42", setOn: "2026-06-02", setByKey: "lg3.who.meera", devices: 2 },
    { id: "a2", code: "NAV-0118", name: "Vikram Sen", email: "vikram.sen@sunrisepublic.edu.in", desig: "TGT, Mathematics", dept: "Mathematics", campus: "indiranagar", phone: "+91 90000 04118", state: "active", last: "2026-08-11 07:51", setOn: "2025-11-14", setByKey: "lg3.who.rajan", devices: 1 },
    { id: "a3", code: "NAV-0207", name: "Kavya Nair", email: "kavya.nair@sunrisepublic.edu.in", desig: "PRT, Class III", dept: "Primary", campus: "indiranagar", phone: "+91 90000 04207", state: "invited", last: null, setOn: "2026-08-06", setByKey: "lg3.who.meera", devices: 0 },
    { id: "a4", code: "NAV-0233", name: "Farah Sheikh", email: "farah.sheikh@sunrisepublic.edu.in", desig: "NTT, Pre-primary", dept: "Pre-primary", campus: "whitefield", phone: "+91 90000 04233", state: "invited", last: null, setOn: "2026-08-04", setByKey: "lg3.who.meera", devices: 0 },
    { id: "a5", code: "NAV-0054", name: "Manjunath Gowda", email: "manjunath.gowda@sunrisepublic.edu.in", desig: "Bus driver, Route 4", dept: "Transport", campus: "indiranagar", phone: "+91 90000 04054", state: "locked", last: "2026-07-29 06:12", setOn: "2025-04-02", setByKey: "lg3.who.rajan", devices: 1, lockedWhyKey: "lg3.lock.tries", lockedOn: "2026-08-10" },
    { id: "a6", code: "NAV-0176", name: "Suresh Kamath", email: "suresh.kamath@sunrisepublic.edu.in", desig: "Accounts executive", dept: "Administration", campus: "indiranagar", phone: "+91 90000 04176", state: "active", last: "2026-08-10 17:20", setOn: "2026-01-19", setByKey: "lg3.who.meera", devices: 2 },
    { id: "a7", code: "NAV-0221", name: "Lakshmi Venkat", email: "lakshmi.venkat@sunrisepublic.edu.in", desig: "Hostel warden", dept: "Hostel", campus: "whitefield", phone: "+91 90000 04221", state: "active", last: "2026-08-09 21:05", setOn: "2024-08-22", setByKey: "lg3.who.rajan", devices: 1, noteKey: "lg3.note.notice" },
    { id: "a8", code: "NAV-0245", name: "Arvind Krishnan", email: "arvind.krishnan@sunrisepublic.edu.in", desig: "PGT, Chemistry", dept: "Science", campus: "whitefield", phone: "+91 90000 04245", state: "none", last: null, setOn: null, setByKey: null, devices: 0, noteKey: "lg3.note.neverInvited" },
    { id: "a9", code: "NAV-0011", name: "Sunita Menon", email: "sunita.menon@sunrisepublic.edu.in", desig: "TGT, English", dept: "Languages", campus: "indiranagar", phone: "+91 90000 04011", state: "none", last: "2025-06-30 16:40", setOn: null, setByKey: null, devices: 0, exited: true, noteKey: "lg3.note.exited" },
  ];

  const STATE_LOOK = {
    active: { role: "present", word: "lg3.state.active" },
    invited: { role: "late", word: "lg3.state.invited", glyph: "clock" },
    locked: { role: "absent", word: "lg3.state.locked", glyph: "lock" },
    none: { role: "missing", word: "lg3.state.none" },
  };

  function dmy(t, iso) {
    if (!iso) return null;
    const p = iso.slice(0, 10).split("-");
    return String(Number(p[2])) + " " + t("lg3.mon." + p[1]) + " " + p[0];
  }
  function whenText(t, stamp) {
    if (!stamp) return null;
    const parts = stamp.split(" ");
    return dmy(t, parts[0]) + (parts[1] ? " · " + parts[1] : "");
  }

  /* a password the office reads out loud once: four short blocks, no
     ambiguous glyphs (no O/0, l/1), long enough to be worth typing */
  function makePassword() {
    const A = "ABCDEFGHJKMNPQRSTUVWXYZ";
    const N = "23456789";
    let out = "";
    for (let b = 0; b < 3; b++) {
      for (let i = 0; i < 4; i++) {
        out += b % 2 === 0 ? A[Math.floor(Math.random() * A.length)] : N[Math.floor(Math.random() * N.length)];
      }
      if (b < 2) out += "-";
    }
    return out;
  }

  /* ============================================================
     SET A PASSWORD — the only screen in Naveya that ever shows one,
     and it shows it exactly once.
     ============================================================ */
  function PasswordDialog({ person, onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [mode, setMode] = useState("generate");
    const [typed, setTyped] = useState("");
    const [generated] = useState(makePassword);
    const [mustChange, setMustChange] = useState(true);
    const [sendSms, setSendSms] = useState(true);
    const [shown, setShown] = useState(null);
    const [err, setErr] = useState(null);

    const value = mode === "generate" ? generated : typed;

    function confirm() {
      if (mode === "type" && typed.trim().length < 8) { setErr("lg3.pw.tooShort"); return; }
      setShown(value);
    }

    return ReactDOM.createPortal(
      <div style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "48px 20px", overflowY: "auto" }}>
        <div aria-hidden="true" onMouseDown={onClose} style={{ position: "fixed", inset: 0, background: c.rail, opacity: 0.55 }} />
        <div
          role="dialog" aria-modal="true" aria-label={t("lg3.pw.title")}
          style={{ position: "relative", width: 560, maxWidth: "100%", background: c.surface, border: "1px solid " + c.border, borderRadius: G3.r.card, padding: 24 }}
        >
          <h2 style={ty("h2", { margin: "0 0 4px", color: c.ink })}>{t("lg3.pw.title")}</h2>
          <p style={ty("small", { color: c.inkMuted, margin: "0 0 18px" })}>{t("lg3.pw.sub", { name: person.name, code: person.code })}</p>

          {shown ? (
            /* the one moment a password exists on a screen */
            <React.Fragment>
              <div style={{ background: c.sunken, borderRadius: G3.r.lg, padding: "16px 18px", marginBottom: 14 }}>
                <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 8 })}>{t("lg3.pw.new")}</div>
                <div style={G3.fig("lg", { color: c.ink, fontWeight: 700, letterSpacing: "0.06em" })}>{shown}</div>
                <p style={ty("caption", { margin: "10px 0 0", color: c.inkMuted })}>
                  {sendSms ? t("lg3.pw.sent", { email: person.email, phone: person.phone }) : t("lg3.pw.notSent")}
                </p>
              </div>
              <p style={ty("small", { color: c.inkMuted, margin: "0 0 4px" })}>{t("lg3.pw.onceBody")}</p>
              <p style={ty("caption", { color: c.inkFaint, margin: "0 0 18px" })}>{t("lg3.pw.audit")}</p>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Button kind="primary" size="sm" onClick={() => onDone(mustChange)}>{t("lg3.pw.done")}</Button>
              </div>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <Field id="lg3-pw-mode" label={t("lg3.pw.how")}>
                <Select
                  id="lg3-pw-mode" value={mode} onChange={(v) => { setMode(v); setErr(null); }}
                  options={[
                    { value: "generate", label: t("lg3.pw.generate") },
                    { value: "type", label: t("lg3.pw.type") },
                  ]}
                />
              </Field>

              {mode === "generate" ? (
                <div style={{ background: c.sunken, borderRadius: G3.r.lg, padding: "13px 15px", marginBottom: 20 }}>
                  <div style={G3.fig("md", { color: c.ink, fontWeight: 700, letterSpacing: "0.06em" })}>{generated}</div>
                  <p style={ty("caption", { margin: "6px 0 0", color: c.inkFaint })}>{t("lg3.pw.generateNote")}</p>
                </div>
              ) : (
                <Field id="lg3-pw-typed" label={t("lg3.pw.typeLabel")} hint={t("lg3.pw.typeHint")} error={err ? t(err) : null}>
                  <Input id="lg3-pw-typed" value={typed} onChange={(v) => { setTyped(v); setErr(null); }} invalid={!!err} />
                </Field>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 18 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
                  <Switch id="lg3-pw-must" checked={mustChange} onChange={setMustChange} label={t("lg3.pw.mustChange")} />
                  <p style={ty("caption", { margin: 0, color: c.inkFaint, flex: 1, minWidth: 220 })}>{t("lg3.pw.mustChangeNote")}</p>
                </div>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
                  <Switch id="lg3-pw-sms" checked={sendSms} onChange={setSendSms} label={t("lg3.pw.sms")} />
                  <p style={ty("caption", { margin: 0, color: c.inkFaint, flex: 1, minWidth: 220 })}>{t("lg3.pw.smsNote", { email: person.email, phone: person.phone })}</p>
                </div>
              </div>

              <p style={ty("caption", { color: c.inkFaint, margin: "0 0 14px" })}>{t("lg3.pw.onceWarn")}</p>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <Button kind="ghost" size="sm" onClick={onClose}>{t("lg3.cancel")}</Button>
                <Button kind="primary" size="sm" iconLeft="lock" onClick={confirm}>{t("lg3.pw.set")}</Button>
              </div>
            </React.Fragment>
          )}
        </div>
      </div>,
      document.body
    );
  }

  /* a short confirm for the reversible things (lock, unlock, invite,
     sign out) — each names what the person will experience */
  function ActDialog({ titleKey, bodyKey, confirmKey, tone, person, onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    return ReactDOM.createPortal(
      <div style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "48px 20px", overflowY: "auto" }}>
        <div aria-hidden="true" onMouseDown={onClose} style={{ position: "fixed", inset: 0, background: c.rail, opacity: 0.55 }} />
        <div
          role="dialog" aria-modal="true" aria-label={t(titleKey)}
          style={{ position: "relative", width: 520, maxWidth: "100%", background: c.surface, border: "1px solid " + c.border, borderRadius: G3.r.card, padding: 24 }}
        >
          <h2 style={ty("h2", { margin: "0 0 10px", color: c.ink })}>{t(titleKey)}</h2>
          <p style={ty("small", { color: c.inkMuted, margin: "0 0 20px" })}>{t(bodyKey, { name: person.name, phone: person.phone, email: person.email })}</p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Button kind="ghost" size="sm" onClick={onClose}>{t("lg3.cancel")}</Button>
            <Button kind={tone === "danger" ? "secondary" : "primary"} size="sm" onClick={onDone}>{t(confirmKey)}</Button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  /* ============================================================
     THE REGISTER
     ============================================================ */
  function HRLogins({ role, onNavigate }) {
    const { c } = useTheme();
    const { t, ty, lang } = useLang();
    const L = G3.layout;
    const [q, setQ] = useState("");
    const [campus, setCampus] = useState(CAMPUS_ALL);
    const [state, setState] = useState("all");
    const [rowsState, setRowsState] = useState({});
    const [dlg, setDlg] = useState(null);
    const [done, setDone] = useState(null);

    function stateOf(a) { return (rowsState[a.id] && rowsState[a.id].state) || a.state; }
    function setRow(id, patch) {
      setRowsState(function (cur) { return Object.assign({}, cur, { [id]: Object.assign({}, cur[id], patch) }); });
    }

    const list = useMemo(() => {
      const needle = q.trim().toLowerCase();
      return ACCOUNTS.filter((a) => {
        if (!inCampus(campus, a.campus)) return false;
        if (state !== "all" && stateOf(a) !== state) return false;
        if (needle && a.name.toLowerCase().indexOf(needle) === -1 && a.code.toLowerCase().indexOf(needle) === -1
            && a.email.toLowerCase().indexOf(needle) === -1 && a.phone.indexOf(needle) === -1) return false;
        return true;
      });
      // eslint-disable-next-line
    }, [q, campus, state, rowsState]);

    const counts = {
      total: ACCOUNTS.length,
      active: ACCOUNTS.filter((a) => stateOf(a) === "active").length,
      invited: ACCOUNTS.filter((a) => stateOf(a) === "invited").length,
      locked: ACCOUNTS.filter((a) => stateOf(a) === "locked").length,
      none: ACCOUNTS.filter((a) => stateOf(a) === "none").length,
    };

    const columns = [
      { key: "who", label: t("lg3.col.who") },
      { key: "code", label: t("lg3.col.code"), mono: true, width: 124 },
      { key: "campus", label: t("lg3.col.campus"), width: 150 },
      /* wide enough for the longest address on the roll
         (manjunath.gowda@sunrisepublic.edu.in) to sit on one line --
         an address broken across "edu." and "in" reads as two things */
      { key: "signIn", label: t("lg3.col.signIn"), width: 292 },
      { key: "state", label: t("lg3.col.state"), width: 230 },
      { key: "last", label: t("lg3.col.last"), width: 190 },
      { key: "act", label: t("lg3.col.actions"), align: "right", width: 56 },
    ];

    const rows = list.map((a) => {
      const st = stateOf(a);
      const look = STATE_LOOK[st];
      const row = rowsState[a.id] || {};
      const items = [];

      if (st === "none" && !a.exited) {
        items.push({ key: "invite", icon: "mail", label: t("lg3.menu.invite"), onSelect: () => setDlg({ kind: "invite", a: a }) });
      }
      if (st === "invited") {
        items.push({ key: "resend", icon: "mail", label: t("lg3.menu.resend"), onSelect: () => setDlg({ kind: "resend", a: a }) });
      }
      if (st === "active" || st === "locked" || st === "invited") {
        items.push({ key: "pw", icon: "lock", label: t("lg3.menu.setPw"), onSelect: () => setDlg({ kind: "pw", a: a }) });
      }
      if (st === "active") {
        items.push({ key: "signout", icon: "signout", label: t("lg3.menu.signOut"), disabled: !a.devices, reason: !a.devices ? t("lg3.menu.signOutNo") : undefined, onSelect: () => setDlg({ kind: "signout", a: a }) });
        items.push({ key: "lock", icon: "lock", label: t("lg3.menu.lock"), tone: "danger", onSelect: () => setDlg({ kind: "lock", a: a }) });
      }
      if (st === "locked") {
        items.push({ key: "unlock", icon: "check", label: t("lg3.menu.unlock"), onSelect: () => setDlg({ kind: "unlock", a: a }) });
      }
      if (a.exited) {
        items.push({ key: "exited", icon: "lock", label: t("lg3.menu.exited"), disabled: true, reason: t("lg3.menu.exitedWhy") });
      }
      items.push({ key: "record", icon: "profile", label: t("lg3.menu.record"), onSelect: () => onNavigate && onNavigate("hrRecord") });

      const setOn = row.setOn || a.setOn;
      const setBy = row.setByKey || a.setByKey;
      /* AN INVITE IS NOT A PASSWORD. Inviting somebody wrote the same
         two fields the password dialog does, so the row then claimed a
         password had been set when nobody had set one. */
      const setWhat = row.invited ? "lg3.invitedOn" : "lg3.pwSet";

      return {
        id: a.id,
        tone: st === "none" ? "dim" : undefined,
        cells: {
          who: (
            <span>
              <span style={ty("small", { display: "block", color: c.ink, fontWeight: 700 })}>{a.name}</span>
              <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 1 })}>{a.desig}</span>
            </span>
          ),
          code: a.code,
          campus: campusLabel(t, a.campus),
          signIn: (
            <span>
              {/* THE ADDRESS IS THE SIGN-IN; the number is only where a
                  code can also land. Drawn the other way round, the
                  column said a phone was the account. */}
              <span style={ty("small", { display: "block", color: c.ink, fontWeight: 600, wordBreak: "break-word" })}>{a.email}</span>
              <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 2 })}>
                {a.phone ? t("lg3.signIn.note", { phone: a.phone }) : t("lg3.signIn.noPhone")}
              </span>
            </span>
          ),
          state: (
            <span>
              <StatusMark role={look.role} word={t(look.word)} glyph={look.glyph} />
              {row.mustChange ? (
                <span style={ty("caption", { display: "block", color: c.lateText, marginTop: 3 })}>{t("lg3.state.mustChange")}</span>
              ) : null}
              {st === "locked" ? (
                <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 3 })}>
                  {t(row.lockedWhyKey || a.lockedWhyKey || "lg3.lock.byHr")}
                </span>
              ) : null}
              {a.noteKey && st !== "locked" && st === a.state ? (
                <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 3 })}>{t(a.noteKey)}</span>
              ) : null}
            </span>
          ),
          last: (
            <span>
              <span style={ty("small", { display: "block", color: a.last ? c.ink : c.inkFaint })}>
                {a.last ? whenText(t, a.last) : t("lg3.last.never")}
              </span>
              {setOn ? (
                <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 2 })}>
                  {t(setWhat, { date: dmy(t, setOn), who: t(setBy) })}
                </span>
              ) : null}
            </span>
          ),
          act: <span style={{ display: "flex", justifyContent: "flex-end" }}><ActionMenu ariaLabel={t("lg3.menu.aria", { name: a.name })} items={items} /></span>,
        },
      };
    });

    /* the mix first: how many of the nine can actually sign in, and
       what is standing between the rest and a sign-in */
    const segments = [
      { key: "active", value: counts.active, label: t("lg3.s.active"), color: c.chartGreen },
      { key: "invited", value: counts.invited, label: t("lg3.s.invited"), color: c.chartAmber },
      { key: "locked", value: counts.locked, label: t("lg3.s.locked"), color: c.chartRed },
      { key: "none", value: counts.none, label: t("lg3.s.none"), color: c.chartSand || c.gutter },
    ];
    const facts = [
      /* a population, not a state, and the sum of the four below it */
      { k: "total", label: t("lg3.f.total"), value: num(counts.total), n: counts.total, total: true,
        note: t("lg3.f.totalNote"), tone: c.chartBlue },
      /* the four states in the order the bar draws them, so a colour
         means the same thing read either way */
      { k: "active", label: t("lg3.f.active"), value: num(counts.active), n: counts.active,
        note: t("lg3.f.activeNote"), tone: c.chartGreen },
      { k: "invited", label: t("lg3.f.invited"), value: num(counts.invited), n: counts.invited, note: t("lg3.f.invitedNote"), tone: c.chartAmber, warn: counts.invited > 0 },
      { k: "locked", label: t("lg3.f.locked"), value: num(counts.locked), n: counts.locked, note: t("lg3.f.lockedNote"), tone: c.chartRed, warn: counts.locked > 0 },
      { k: "none", label: t("lg3.f.none"), value: num(counts.none), n: counts.none, note: t("lg3.f.noneNote"), tone: c.chartPurple },
    ];

    return (
      <div className="nv3" style={{ display: "flex", minHeight: "100vh", background: c.page, color: c.ink, fontFamily: G3.font.ui }}>
        <Rail role={role || "hr"} active="hrLogins" onNavigate={onNavigate} initials="MI" />
        <main style={{ flex: 1, minWidth: 0, position: "relative", overflowX: "clip" }}>
          <Motif />
          <div style={{ position: "relative", zIndex: 1, maxWidth: L.contentMax, margin: "0 auto", padding: "22px " + L.contentPadX + "px 56px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, marginBottom: 16 }}>
              <div style={ty("small", { color: c.inkMuted })}>
                <span style={{ color: c.ink, fontWeight: 700 }}>{t("nav.hrLogins")}</span>
                <span style={{ margin: "0 8px", color: c.inkFaint }}>·</span>
                <span>{t("lg3.trust")}</span>
                <span style={{ margin: "0 8px", color: c.inkFaint }}>·</span>
                <span>{campusLabel(t, campus)}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <CampusSwitch value={campus} onChange={setCampus} />
                <ThemeToggle />
              </div>
            </div>

            <div style={{ marginBottom: L.gap }}>
              <h1 style={ty("display", { margin: 0, color: c.ink })}>{t("lg3.title")}</h1>
            </div>

            <Band head={t("lg3.band")}
              metrics={facts} foot={t("lg3.rule")} />

            {done ? (
              <div style={{ marginTop: 14 }}>
                <Card fill={c.presentTint} border={c.border} pad={14}>
                  <span style={ty("small", { color: c.ink, fontWeight: 600 })}>{done}</span>
                </Card>
              </div>
            ) : null}

            {/* the Field carries its own 20px below it, so the row adds
                none: sixteen more put the table an inch off the search */}
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", margin: L.gap + "px 0 0", alignItems: "flex-end" }}>
              <div style={{ flex: "1 1 280px", minWidth: 0 }}>
                <Field id="lg3-q" label={t("lg3.filter.search")}>
                  <Input id="lg3-q" value={q} onChange={setQ} placeholder={t("lg3.filter.searchPh")} />
                </Field>
              </div>
              <div style={{ flex: "0 1 240px" }}>
                <Field id="lg3-state" label={t("lg3.filter.state")}>
                  <Select
                    id="lg3-state" value={state} onChange={setState}
                    options={[{ value: "all", label: t("lg3.filter.stateAll") }].concat(["active", "invited", "locked", "none"].map((k) => ({ value: k, label: t(STATE_LOOK[k].word) })))}
                  />
                </Field>
              </div>
            </div>

            {rows.length === 0 ? (
              <Card><EmptyState head={t("lg3.empty.head")} body={t("lg3.empty.body")} /></Card>
            ) : (
              <Register
                columns={columns} rows={rows}
                footer={<span style={ty("caption", { color: c.inkFaint })}>{t("lg3.foot", { shown: num(rows.length), total: num(ACCOUNTS.length) })}</span>}
              />
            )}
          </div>
        </main>

        {dlg && dlg.kind === "pw" ? (
          <PasswordDialog
            person={dlg.a}
            onClose={() => setDlg(null)}
            onDone={(mustChange) => {
              setRow(dlg.a.id, { state: "active", setOn: TODAY, setByKey: "lg3.who.you", mustChange: mustChange });
              setDone(t("lg3.done.pw", { name: dlg.a.name, email: dlg.a.email }));
              setDlg(null);
            }}
          />
        ) : null}
        {dlg && dlg.kind === "lock" ? (
          <ActDialog
            titleKey="lg3.lockDlg.title" bodyKey="lg3.lockDlg.body" confirmKey="lg3.lockDlg.confirm" tone="danger" person={dlg.a}
            onClose={() => setDlg(null)}
            onDone={() => { setRow(dlg.a.id, { state: "locked", lockedWhyKey: "lg3.lock.byHr" }); setDone(t("lg3.done.lock", { name: dlg.a.name })); setDlg(null); }}
          />
        ) : null}
        {dlg && dlg.kind === "unlock" ? (
          <ActDialog
            titleKey="lg3.unlockDlg.title" bodyKey="lg3.unlockDlg.body" confirmKey="lg3.unlockDlg.confirm" person={dlg.a}
            onClose={() => setDlg(null)}
            onDone={() => { setRow(dlg.a.id, { state: "active" }); setDone(t("lg3.done.unlock", { name: dlg.a.name })); setDlg(null); }}
          />
        ) : null}
        {dlg && dlg.kind === "invite" ? (
          <ActDialog
            titleKey="lg3.inviteDlg.title" bodyKey="lg3.inviteDlg.body" confirmKey="lg3.inviteDlg.confirm" person={dlg.a}
            onClose={() => setDlg(null)}
            onDone={() => { setRow(dlg.a.id, { state: "invited", setOn: TODAY, setByKey: "lg3.who.you", invited: true }); setDone(t("lg3.done.invite", { name: dlg.a.name, email: dlg.a.email })); setDlg(null); }}
          />
        ) : null}
        {dlg && dlg.kind === "resend" ? (
          <ActDialog
            titleKey="lg3.resendDlg.title" bodyKey="lg3.resendDlg.body" confirmKey="lg3.resendDlg.confirm" person={dlg.a}
            onClose={() => setDlg(null)}
            onDone={() => { setDone(t("lg3.done.resend", { name: dlg.a.name, email: dlg.a.email })); setDlg(null); }}
          />
        ) : null}
        {dlg && dlg.kind === "signout" ? (
          <ActDialog
            titleKey="lg3.signOutDlg.title" bodyKey="lg3.signOutDlg.body" confirmKey="lg3.signOutDlg.confirm" person={dlg.a}
            onClose={() => setDlg(null)}
            onDone={() => { setDone(t("lg3.done.signOut", { name: dlg.a.name })); setDlg(null); }}
          />
        ) : null}
      </div>
    );
  }

  addStrings({
    en: {
      "lg3.trust": "Sunrise Group of Schools",
      "lg3.title": "Staff logins",
      "lg3.rule": "Everyone signs in with their work address. A password is shown once, when it is set, and never again — setting, locking and unlocking are written against your name.",

      "lg3.f.total": "Accounts",
      "lg3.f.active": "Signed in",
      "lg3.f.activeNote": "have used their account",
      "lg3.band": "Staff accounts",
      "lg3.s.active": "Signing in",
      "lg3.s.invited": "Invited, waiting",
      "lg3.s.locked": "Locked out",
      "lg3.s.none": "No account",
      "lg3.f.totalNote": "across both campuses",
      "lg3.f.invited": "Invited, not signed in",
      "lg3.f.invitedNote": "waiting for a first sign-in",
      "lg3.f.locked": "Locked",
      "lg3.f.lockedNote": "cannot sign in until you unlock",
      "lg3.f.none": "No login",
      "lg3.f.noneNote": "on the roll, never invited or exited",

      "lg3.filter.search": "Search by name, staff ID, address or number",
      "lg3.filter.searchPh": "Ananya, NAV-0142, ananya.rao@…",
      "lg3.filter.state": "Account state",
      "lg3.filter.stateAll": "Any state",

      "lg3.col.who": "Employee",
      "lg3.col.code": "Employee ID",
      "lg3.col.campus": "Campus",
      "lg3.col.signIn": "Signs in with",
      "lg3.col.state": "Account",
      "lg3.col.last": "Last signed in",
      "lg3.col.actions": "Actions",
      "lg3.signIn.note": "codes also go to {phone}",
      "lg3.signIn.noPhone": "no number on file — codes go to the address only",
      "lg3.last.never": "Never",
      "lg3.pwSet": "Password set {date} by {who}",
      "lg3.invitedOn": "Invited {date} by {who}",
      "lg3.foot": "{shown} of {total} accounts. An exited person keeps a record and loses a login.",

      "lg3.state.active": "Active",
      "lg3.state.invited": "Invited, not signed in",
      "lg3.state.locked": "Locked",
      "lg3.state.none": "No login",
      "lg3.state.mustChange": "Must set her own at the next sign-in",
      "lg3.lock.tries": "Locked after five wrong attempts",
      "lg3.lock.byHr": "Locked by the office",
      "lg3.note.notice": "On notice — access ends with her last working day",
      "lg3.note.neverInvited": "On the roll, never invited",
      "lg3.note.exited": "Exited 30 Jun 2025",

      "lg3.menu.aria": "Account actions for {name}",
      "lg3.menu.setPw": "Set a new password",
      "lg3.menu.invite": "Invite to sign in",
      "lg3.menu.resend": "Send the invite again",
      "lg3.menu.signOut": "Sign out every device",
      "lg3.menu.signOutNo": "No device is signed in.",
      "lg3.menu.lock": "Lock this account",
      "lg3.menu.unlock": "Unlock this account",
      "lg3.menu.exited": "Re-enable the login",
      "lg3.menu.exitedWhy": "This person has left. A returning employee is matched to their existing record first.",
      "lg3.menu.record": "Open her record",

      "lg3.cancel": "Not now",
      "lg3.pw.title": "Set a new password",
      "lg3.pw.sub": "{name} · {code}",
      "lg3.pw.how": "How",
      "lg3.pw.generate": "Generate one",
      "lg3.pw.generateNote": "Twelve characters in three blocks, with no letter that can be mistaken for a number. It is easy to read out at the desk.",
      "lg3.pw.type": "Type one myself",
      "lg3.pw.typeLabel": "New password",
      "lg3.pw.typeHint": "At least eight characters.",
      "lg3.pw.tooShort": "Eight characters at the very least.",
      "lg3.pw.mustChange": "She must set her own at the next sign-in",
      "lg3.pw.mustChangeNote": "Recommended. Until she does, this password is known to whoever set it.",
      "lg3.pw.sms": "Send it to her",
      "lg3.pw.smsNote": "To {email}, and a text to {phone}. Turn this off if you are handing it over at the desk.",
      "lg3.pw.onceWarn": "It is shown once, on the next screen. Nothing in Naveya can show it again.",
      "lg3.pw.set": "Set the password",
      "lg3.pw.new": "The new password",
      "lg3.pw.sent": "Sent to {email} and to {phone}.",
      "lg3.pw.notSent": "Not sent anywhere — hand it over in person.",
      "lg3.pw.onceBody": "Read it out or write it down now. Close this and it is gone; setting another is the only way back.",
      "lg3.pw.audit": "Recorded against your name, with the time, on her account history.",
      "lg3.pw.done": "I have it — close",

      "lg3.lockDlg.title": "Lock this account",
      "lg3.lockDlg.body": "{name} cannot sign in on any device until the office unlocks it. Their record, leave and payslips are untouched.",
      "lg3.lockDlg.confirm": "Lock it",
      "lg3.unlockDlg.title": "Unlock this account",
      "lg3.unlockDlg.body": "{name} will be able to sign in again with the password they already have. If they have forgotten it, set a new one instead.",
      "lg3.unlockDlg.confirm": "Unlock it",
      "lg3.inviteDlg.title": "Invite to sign in",
      "lg3.inviteDlg.body": "The invite goes to {email}, with a one-time code by text to {phone}. {name} sets their own password on first use, and the account turns Active the moment they sign in.",
      "lg3.inviteDlg.confirm": "Send the invite",
      "lg3.resendDlg.title": "Send the invite again",
      "lg3.resendDlg.body": "A fresh invite goes to {email} and {phone}. The earlier one stops working.",
      "lg3.resendDlg.confirm": "Send it again",
      "lg3.signOutDlg.title": "Sign out every device",
      "lg3.signOutDlg.body": "{name} is signed out everywhere and will have to sign in again. Use this when a phone is lost.",
      "lg3.signOutDlg.confirm": "Sign out everywhere",

      "lg3.done.pw": "New password set for {name} and sent to {email}.",
      "lg3.done.lock": "{name}'s account is locked.",
      "lg3.done.unlock": "{name}'s account is unlocked.",
      "lg3.done.invite": "Invite sent to {name} at {email}.",
      "lg3.done.resend": "A fresh invite went to {name} at {email}.",
      "lg3.done.signOut": "{name} has been signed out everywhere.",

      "lg3.empty.head": "No account matches that",
      "lg3.empty.body": "Try a different campus or state, or clear the search.",
      "lg3.who.meera": "Meera Iyer, HR",
      "lg3.who.rajan": "Rajan Pillai, HR",
      "lg3.who.you": "you",

      "lg3.mon.01": "Jan", "lg3.mon.02": "Feb", "lg3.mon.03": "Mar", "lg3.mon.04": "Apr",
      "lg3.mon.05": "May", "lg3.mon.06": "Jun", "lg3.mon.07": "Jul", "lg3.mon.08": "Aug",
      "lg3.mon.09": "Sep", "lg3.mon.10": "Oct", "lg3.mon.11": "Nov", "lg3.mon.12": "Dec",
    },
  });

  window.Pages3 = window.Pages3 || {};
  window.Pages3.HRLogins = HRLogins;
})();
