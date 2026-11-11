/* @jsxRuntime classic */
/* Naveya v3 — the global shell: top bar, section sub-tabs, search
   (command palette), notifications and the account menu.

   Mounted by kit.jsx's Rail (every screen renders a Rail), so no page
   has to opt in. Loaded after kit.jsx; reads everything from window.UI3. */
(function () {
  const { useState, useEffect, useRef, useMemo } = React;
  const {
    useTheme, useLang, addStrings, Icon, ActionMenu,
    profileFor, permissionsFor, avatarTone,
  } = window.UI3;

  addStrings({
    en: {
      "shell.search.trigger": "Search people, pages and actions",
      "shell.search.kbd": "Ctrl K",
      "shell.search.kbdMac": "⌘ K",
      "shell.search.label": "Search",
      "shell.search.close": "Close search",
      "shell.search.empty": "Nothing matches “{q}”",
      "shell.search.emptyHint": "Try a name, a staff ID or the name of a page.",
      "shell.search.help": "↑ ↓ to move · Enter to open · Esc to close",
      "shell.search.grp.actions": "Actions",
      "shell.search.grp.pages": "Pages",
      "shell.search.grp.people": "People",
      "shell.search.opens": "Opens {page}",
      "shell.search.inRegister": "{code} · {desig} · opens the staff register",
      "shell.cmd.applyLeave": "Apply for leave",
      "shell.cmd.clockIn": "Web clock-in",
      "shell.cmd.payslip": "Download a payslip",
      "shell.cmd.hrAsks": "Answer what HR has asked for",
      "shell.cmd.addEmployee": "Add an employee",
      "shell.cmd.docRequest": "Raise a document request",
      "shell.cmd.openRun": "Open this month’s payroll run",
      "shell.notif.label": "Notifications",
      "shell.notif.labelN": "Notifications, {n} unread",
      "shell.notif.needs": "Needs you",
      "shell.notif.updates": "Updates",
      "shell.notif.markAll": "Mark all as read",
      "shell.notif.new": "New",
      "shell.notif.emptyHead": "You’re all caught up",
      "shell.notif.emptyBody": "Nothing needs you right now. Requests and updates will show up here.",
      "shell.acct.label": "Account: {name}, {title}",
      "shell.acct.profile": "My profile",
      "shell.acct.signout": "Sign out",
      "shell.subtabs.aria": "{section} pages",
      /* notifications — every fact here is one another screen already shows */
      "shell.n.emp.pan": "Meera Iyer (HR) asked for your PAN card — due 20 August",
      "shell.n.emp.cover": "Karan Mehta asked you to cover his classes on 20–21 August",
      "shell.n.emp.leave": "Your leave for 24–25 August is with the head of department",
      "shell.n.emp.payslip": "Your July payslip is ready — credited 31 July",
      "shell.n.hr.docs": "5 document requests are overdue — the oldest by 9 days",
      "shell.n.hr.sla": "2 helpdesk tickets have breached their SLA",
      "shell.n.hr.contracts": "4 contracts end soon — the first in 12 days",
      "shell.n.py.blocking": "Indiranagar’s August run has 15 rows still blocking — 8 are yours to answer",
      "shell.n.py.exits": "4 settlements are past their statutory deadline",
      "shell.n.py.whitefield": "Whitefield’s August run is with the accountant",
    },
  });

  /* ---------------------------------------------------------------
     data
     --------------------------------------------------------------- */

  /* a shortcut is offered only when the role can reach its screen
     (`need` names the rail screen that proves it, default `to`) */
  const ACTIONS = [
    { key: "applyLeave", to: "leave", icon: "leave", label: "shell.cmd.applyLeave" },
    { key: "clockIn", to: "attendance", icon: "clock", label: "shell.cmd.clockIn" },
    { key: "payslip", to: "payslips", icon: "download", label: "shell.cmd.payslip" },
    { key: "hrAsks", to: "documents", icon: "document", label: "shell.cmd.hrAsks" },
    { key: "addEmployee", to: "hrAdd", need: "hrStaff", icon: "plus", label: "shell.cmd.addEmployee" },
    { key: "docRequest", to: "hrDocs", icon: "mail", label: "shell.cmd.docRequest" },
    { key: "openRun", to: "pyRun", icon: "payroll", label: "shell.cmd.openRun" },
  ];

  /* who may search people, and where a found person opens */
  const PEOPLE_ACCESS = [
    { perm: "staff.read", to: "hrStaff" },
    { perm: "payroll.salary.manage", to: "pyPeople" },
    { perm: "campus.staff.read", to: "staff" },
    { perm: "dir.staff.read", to: "staff" },
  ];
  const PEOPLE_LIMIT = 6;

  const NOTES = {
    employee: [
      { id: "emp.pan", kind: "needs", icon: "document", text: "shell.n.emp.pan", to: "documents" },
      { id: "emp.cover", kind: "needs", icon: "leave", text: "shell.n.emp.cover", to: "leave" },
      { id: "emp.leave", kind: "update", icon: "clock", text: "shell.n.emp.leave", to: "leave" },
      { id: "emp.payslip", kind: "update", icon: "payslip", text: "shell.n.emp.payslip", to: "payslips" },
    ],
    hr: [
      { id: "hr.docs", kind: "needs", icon: "document", text: "shell.n.hr.docs", to: "hrDocs" },
      { id: "hr.sla", kind: "needs", icon: "alert", text: "shell.n.hr.sla", to: "hrHelp" },
      { id: "hr.contracts", kind: "update", icon: "clock", text: "shell.n.hr.contracts", to: "hrLifecycle" },
    ],
    payrollOfficer: [
      { id: "py.blocking", kind: "needs", icon: "alert", text: "shell.n.py.blocking", to: "pyRun" },
      { id: "py.exits", kind: "needs", icon: "briefcase", text: "shell.n.py.exits", to: "pyExits" },
      { id: "py.whitefield", kind: "update", icon: "lock", text: "shell.n.py.whitefield", to: "pyRun" },
    ],
  };

  function initialsOf(name) {
    return String(name || "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  }

  function isTypingTarget(el) {
    if (!el) return false;
    const tag = el.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
  }

  const IS_MAC = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || "");

  /* ---------------------------------------------------------------
     search — a command palette over pages, actions and people
     --------------------------------------------------------------- */
  function buildEntries({ role, sections, t }) {
    const reachable = new Set();
    sections.forEach((s) => s.items.forEach((it) => reachable.add(it.key)));

    const actions = ACTIONS
      .filter((a) => reachable.has(a.need || a.to))
      .map((a) => {
        const page = sections.find((s) => s.items.some((it) => it.key === (a.need || a.to)));
        return {
          id: "a." + a.key, group: "actions", icon: a.icon, label: t(a.label),
          hint: page ? t("shell.search.opens", { page: t(page.label) }) : "", to: a.to,
        };
      });

    const pages = [];
    sections.forEach((s) => s.items.forEach((it) => {
      pages.push({
        id: "p." + it.key, group: "pages", icon: it.icon, label: t(it.tabLabel),
        hint: s.items.length > 1 ? t(s.label) : "", to: it.key,
      });
    }));

    const perms = permissionsFor(role);
    const access = PEOPLE_ACCESS.find((p) => perms.indexOf(p.perm) !== -1 && reachable.has(p.to));
    /* the same register the principal and director lists read (hr.jsx) */
    const roster = (window.NaveyaStaff && window.NaveyaStaff.LIST) || [];
    const people = access ? roster.map((p) => ({
      id: "u." + p.id, group: "people", icon: "profile", label: p.name,
      hint: t("shell.search.inRegister", { code: p.code, desig: p.desig }),
      match: (p.name + " " + p.code + " " + p.desig).toLowerCase(), to: access.to,
    })) : [];

    return { actions, pages, people };
  }

  function CommandPalette({ role, sections, onNavigate, onClose }) {
    const { c, shadow } = useTheme();
    const { t, ty } = useLang();
    const [q, setQ] = useState("");
    const [activeIdx, setActiveIdx] = useState(0);
    const inputRef = useRef(null);
    const all = useMemo(() => buildEntries({ role, sections, t }), [role, sections, t]);

    const needle = q.trim().toLowerCase();
    const hit = (e) => !needle || (e.match || (e.label + " " + e.hint).toLowerCase()).indexOf(needle) !== -1;
    const groups = [
      { key: "actions", label: t("shell.search.grp.actions"), rows: all.actions.filter(hit) },
      { key: "pages", label: t("shell.search.grp.pages"), rows: all.pages.filter(hit) },
      /* people only once something is typed: a list of sixteen names
         is not a menu, it is a register */
      { key: "people", label: t("shell.search.grp.people"), rows: needle ? all.people.filter(hit).slice(0, PEOPLE_LIMIT) : [] },
    ].filter((g) => g.rows.length);
    const flat = groups.reduce((acc, g) => acc.concat(g.rows), []);
    const safeIdx = Math.min(activeIdx, Math.max(flat.length - 1, 0));

    useEffect(() => { if (inputRef.current) inputRef.current.focus(); }, []);
    useEffect(() => { setActiveIdx(0); }, [q]);
    useEffect(() => {
      const el = document.getElementById("nv3-cmd-opt-" + safeIdx);
      if (el) el.scrollIntoView({ block: "nearest" });
    }, [safeIdx]);

    function choose(entry) {
      onClose();
      if (onNavigate) onNavigate(entry.to);
    }

    function onKeyDown(e) {
      if (e.key === "Escape") { e.preventDefault(); onClose(); return; }
      if (!flat.length) return;
      if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((safeIdx + 1) % flat.length); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((safeIdx - 1 + flat.length) % flat.length); }
      else if (e.key === "Enter") { e.preventDefault(); choose(flat[safeIdx]); }
    }

    let running = -1;
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: G3.z.palette }}>
        <div aria-hidden="true" onMouseDown={onClose} style={{ position: "absolute", inset: 0, background: c.rail, opacity: 0.55 }} />
        <div
          role="dialog" aria-modal="true" aria-label={t("shell.search.label")}
          style={{
            position: "absolute", top: "12vh", left: "50%", transform: "translateX(-50%)",
            width: "min(640px, calc(100vw - " + 2 * G3.layout.phonePadX + "px))",
            background: c.surface, color: c.ink, border: "1px solid " + c.border,
            borderRadius: G3.r.lg, boxShadow: shadow(4), overflow: "hidden",
            display: "flex", flexDirection: "column", maxHeight: "72vh",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 14px", borderBottom: "1px solid " + c.border }}>
            <span aria-hidden="true" style={{ display: "flex", color: c.inkMuted }}><Icon name="search" size={18} /></span>
            <input
              ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKeyDown}
              role="combobox" aria-expanded="true" aria-controls="nv3-cmd-list" aria-autocomplete="list"
              aria-activedescendant={flat.length ? "nv3-cmd-opt-" + safeIdx : undefined}
              aria-label={t("shell.search.label")} placeholder={t("shell.search.trigger")}
              style={ty("body", {
                flex: 1, minWidth: 0, height: G3.layout.fieldH, border: "none", outline: "none",
                background: "transparent", color: c.ink,
              })}
            />
            <button
              type="button" onClick={onClose} aria-label={t("shell.search.close")}
              style={{ width: 32, height: 32, border: "none", borderRadius: G3.r.pill, background: "transparent", color: c.inkMuted, display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <Icon name="close" size={16} />
            </button>
          </div>

          <div id="nv3-cmd-list" role="listbox" aria-label={t("shell.search.label")} style={{ overflowY: "auto", padding: 6 }}>
            {flat.length === 0 ? (
              <div style={{ padding: "28px 16px", textAlign: "center" }}>
                <div style={ty("body", { color: c.ink, fontWeight: 600 })}>{t("shell.search.empty", { q: q.trim() })}</div>
                <div style={ty("small", { color: c.inkMuted, marginTop: 6 })}>{t("shell.search.emptyHint")}</div>
              </div>
            ) : groups.map((g) => (
              <div key={g.key} role="group" aria-label={g.label}>
                <div style={ty("caption", { color: c.inkMuted, fontWeight: 600, padding: "10px 10px 4px" })}>{g.label}</div>
                {g.rows.map((e) => {
                  running += 1;
                  const idx = running;
                  const on = idx === safeIdx;
                  return (
                    <div
                      key={e.id} id={"nv3-cmd-opt-" + idx} role="option" aria-selected={on}
                      onMouseEnter={() => setActiveIdx(idx)} onClick={() => choose(e)}
                      style={{
                        display: "flex", alignItems: "center", gap: 12, padding: "9px 10px",
                        borderRadius: G3.r.md, cursor: "pointer", background: on ? c.sunken : "transparent",
                      }}
                    >
                      <span aria-hidden="true" style={{ display: "flex", color: on ? c.action : c.inkMuted }}><Icon name={e.icon} size={18} /></span>
                      <span style={{ minWidth: 0, flex: 1 }}>
                        <span style={ty("small", { display: "block", color: c.ink, fontWeight: 600 })}>{e.label}</span>
                        {e.hint ? <span style={ty("caption", { display: "block", color: c.inkMuted, marginTop: 1 })}>{e.hint}</span> : null}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="nv3-topbar-wide" style={ty("caption", { color: c.inkMuted, padding: "8px 14px", borderTop: "1px solid " + c.border })}>
            {t("shell.search.help")}
          </div>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------
     notifications
     --------------------------------------------------------------- */
  function Notifications({ role, sections, onNavigate }) {
    const { c, shadow } = useTheme();
    const { t, ty } = useLang();
    const [open, setOpen] = useState(false);
    const [read, setRead] = useState({});
    const buttonRef = useRef(null);
    const panelRef = useRef(null);
    const headingRef = useRef(null);

    const reachable = new Set();
    sections.forEach((s) => s.items.forEach((it) => reachable.add(it.key)));
    const notes = (NOTES[role] || []).filter((n) => reachable.has(n.to));
    const unread = notes.filter((n) => !read[n.id]).length;

    function close(returnFocus) {
      setOpen(false);
      if (returnFocus && buttonRef.current) buttonRef.current.focus();
    }

    useEffect(() => {
      if (!open) return undefined;
      if (headingRef.current) headingRef.current.focus();
      function onDown(e) {
        if (panelRef.current && panelRef.current.contains(e.target)) return;
        if (buttonRef.current && buttonRef.current.contains(e.target)) return;
        close(false);
      }
      function onKey(e) { if (e.key === "Escape") { e.preventDefault(); close(true); } }
      document.addEventListener("mousedown", onDown);
      document.addEventListener("keydown", onKey);
      return () => {
        document.removeEventListener("mousedown", onDown);
        document.removeEventListener("keydown", onKey);
      };
    }, [open]);

    function openNote(n) {
      setRead(Object.assign({}, read, { [n.id]: true }));
      close(false);
      if (onNavigate) onNavigate(n.to);
    }

    function markAll() {
      const next = {};
      notes.forEach((n) => { next[n.id] = true; });
      setRead(next);
    }

    function group(kind, label) {
      const rows = notes.filter((n) => n.kind === kind);
      if (!rows.length) return null;
      return (
        <div role="group" aria-label={label}>
          <div style={ty("caption", { color: c.inkMuted, fontWeight: 600, padding: "10px 12px 4px" })}>{label}</div>
          {rows.map((n) => {
            const isNew = !read[n.id];
            return (
              <button
                key={n.id} type="button" onClick={() => openNote(n)}
                style={{
                  width: "100%", display: "flex", alignItems: "flex-start", gap: 12, textAlign: "left",
                  border: "none", background: "transparent", borderRadius: G3.r.md, padding: "10px 12px", color: c.ink,
                }}
              >
                <span aria-hidden="true" style={{ display: "flex", marginTop: 2, color: kind === "needs" ? c.action : c.inkMuted }}><Icon name={n.icon} size={18} /></span>
                <span style={ty("small", { flex: 1, minWidth: 0, fontWeight: isNew ? 600 : 500, color: isNew ? c.ink : c.inkMuted })}>{t(n.text)}</span>
                {isNew ? (
                  <span style={ty("caption", { flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 5, color: c.action, fontWeight: 700, marginTop: 1 })}>
                    <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: G3.r.pill, background: c.action }} />
                    {t("shell.notif.new")}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      );
    }

    return (
      <React.Fragment>
        <button
          ref={buttonRef} type="button"
          aria-haspopup="dialog" aria-expanded={open} aria-controls="nv3-notif-panel"
          aria-label={unread ? t("shell.notif.labelN", { n: unread }) : t("shell.notif.label")}
          onClick={() => (open ? close(true) : setOpen(true))}
          style={{
            position: "relative", width: 40, height: 40, borderRadius: G3.r.pill, flexShrink: 0,
            border: "1px solid " + (open ? c.borderStrong : c.border), background: open ? c.sunken : c.surface,
            color: c.ink, display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <Icon name="bell" size={19} />
          {unread ? (
            <span
              aria-hidden="true"
              style={G3.fig("xs", {
                position: "absolute", top: -3, right: -3, minWidth: 18, height: 18, padding: "0 5px",
                borderRadius: G3.r.pill, background: c.accent, color: c.onAccent, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid " + c.page,
              })}
            >
              {unread}
            </span>
          ) : null}
        </button>
        {open ? (
          <div
            ref={panelRef} id="nv3-notif-panel" role="dialog" aria-labelledby="nv3-notif-title"
            style={{
              position: "fixed", top: G3.layout.topBarH - 4, right: G3.layout.phonePadX, zIndex: G3.z.panel,
              width: "min(400px, calc(100vw - " + 2 * G3.layout.phonePadX + "px))", maxHeight: "70vh", overflowY: "auto",
              background: c.surface, color: c.ink, border: "1px solid " + c.border, borderRadius: G3.r.lg,
              boxShadow: shadow(3), padding: 6,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "8px 12px 4px" }}>
              <h2 id="nv3-notif-title" ref={headingRef} tabIndex={-1} style={ty("h3", { margin: 0, color: c.ink, outline: "none" })}>{t("shell.notif.label")}</h2>
              {unread ? (
                <button type="button" onClick={markAll} style={ty("small", { border: "none", background: "transparent", color: c.action, fontWeight: 600, padding: "4px 2px", textDecoration: "underline" })}>
                  {t("shell.notif.markAll")}
                </button>
              ) : null}
            </div>
            {notes.length ? (
              <React.Fragment>
                {group("needs", t("shell.notif.needs"))}
                {group("update", t("shell.notif.updates"))}
              </React.Fragment>
            ) : (
              <div style={{ padding: "22px 14px 26px", textAlign: "center" }}>
                <div style={ty("body", { color: c.ink, fontWeight: 600 })}>{t("shell.notif.emptyHead")}</div>
                <div style={ty("small", { color: c.inkMuted, marginTop: 6 })}>{t("shell.notif.emptyBody")}</div>
              </div>
            )}
          </div>
        ) : null}
      </React.Fragment>
    );
  }

  /* ---------------------------------------------------------------
     account
     --------------------------------------------------------------- */
  function AccountMenu({ role, sections, onNavigate, initials, user }) {
    const { c, mode, toggle } = useTheme();
    const { t, ty } = useLang();
    const profile = profileFor(role);
    const name = user || profile.name;
    const title = t(profile.titleKey);
    /* the bank tints by name; a palette without one falls back to the
       accent pair, which holds contrast on the light page */
    const tone = avatarTone(name, c, { bg: c.accentSoft, fg: c.action });
    const hasProfile = sections.some((s) => s.items.some((it) => it.key === "profile"));

    const items = [];
    if (hasProfile) items.push({ key: "profile", icon: "profile", label: t("shell.acct.profile"), onSelect: () => onNavigate && onNavigate("profile") });
    items.push({ key: "theme", icon: mode === "dark" ? "sun" : "moon", label: mode === "dark" ? t("theme.toLight") : t("theme.toDark"), onSelect: toggle });
    items.push({ key: "signout", icon: "signout", label: t("shell.acct.signout"), onSelect: () => onNavigate && onNavigate("login") });

    const face = (
      <React.Fragment>
        <span
          aria-hidden="true"
          style={{
            width: 32, height: 32, borderRadius: G3.r.pill, background: tone.bg, color: tone.fg, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: G3.font.ui, fontSize: 12, fontWeight: 700,
          }}
        >
          {initials || initialsOf(name)}
        </span>
        <span className="nv3-topbar-wide" style={{ textAlign: "left", lineHeight: 1.2 }}>
          <span style={ty("small", { display: "block", color: c.ink, fontWeight: 600 })}>{name}</span>
          <span style={ty("caption", { display: "block", color: c.inkMuted })}>{title}</span>
        </span>
      </React.Fragment>
    );

    return <ActionMenu ariaLabel={t("shell.acct.label", { name: name, title: title })} items={items} face={face} size={44} />;
  }

  /* ---------------------------------------------------------------
     sub-tabs — the screens inside the current section
     --------------------------------------------------------------- */
  function SubTabs({ section, active, onNavigate, padX }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    return (
      <nav
        className="nv3-subtabs" aria-label={t("shell.subtabs.aria", { section: t(section.label) })}
        style={{ borderTop: "1px solid " + c.border }}
      >
        <div style={{ maxWidth: G3.layout.contentMax, margin: "0 auto", padding: padX, display: "flex", gap: 4, overflowX: "auto", scrollbarWidth: "none" }}>
          {section.items.map((it) => {
            const on = it.key === active;
            return (
              <button
                key={it.key} type="button" aria-current={on ? "page" : undefined}
                onClick={() => { if (!on && onNavigate) onNavigate(it.key); }}
                style={ty("small", {
                  flexShrink: 0, height: G3.layout.subTabsH, padding: "0 12px", border: "none", background: "transparent",
                  color: on ? c.ink : c.inkMuted, fontWeight: on ? 700 : 600,
                  boxShadow: on ? "inset 0 -2px 0 " + c.accent : "none", whiteSpace: "nowrap",
                })}
              >
                {t(it.tabLabel)}
              </button>
            );
          })}
        </div>
      </nav>
    );
  }

  /* ---------------------------------------------------------------
     the bar
     --------------------------------------------------------------- */
  function TopBar({ role, active, sections, current, onNavigate, initials, user }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [searching, setSearching] = useState(false);
    const searchButton = useRef(null);
    const L = G3.layout;
    const padX = "0 clamp(" + L.phonePadX + "px, 3vw, " + L.contentPadX + "px)";

    useEffect(() => {
      function onKey(e) {
        const combo = (e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K");
        const slash = e.key === "/" && !isTypingTarget(e.target);
        if (!combo && !slash) return;
        e.preventDefault();
        setSearching(true);
      }
      document.addEventListener("keydown", onKey);
      return () => document.removeEventListener("keydown", onKey);
    }, []);

    function closeSearch() {
      setSearching(false);
      if (searchButton.current) searchButton.current.focus();
    }

    return (
      <React.Fragment>
        <header
          className="nv3-topbar"
          style={{
            position: "fixed", top: 0, left: L.rail, right: 0, zIndex: G3.z.topBar,
            background: c.page, borderBottom: "1px solid " + c.border,
          }}
        >
          <div style={{ maxWidth: L.contentMax, margin: "0 auto", padding: padX, height: L.topBarH, display: "flex", alignItems: "center", gap: 12 }}>
            <button
              ref={searchButton} type="button" onClick={() => setSearching(true)}
              className="nv3-topbar-search"
              aria-haspopup="dialog" aria-label={t("shell.search.trigger")}
              style={{
                flex: "0 1 " + L.searchW + "px", minWidth: 40, height: 40, display: "flex", alignItems: "center", gap: 10,
                padding: "0 12px", borderRadius: G3.r.pill, border: "1px solid " + c.border,
                background: c.surface, color: c.inkMuted, textAlign: "left",
              }}
            >
              <span aria-hidden="true" style={{ display: "flex", flexShrink: 0 }}><Icon name="search" size={17} /></span>
              <span className="nv3-topbar-wide" style={ty("small", { flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: c.inkMuted })}>
                {t("shell.search.trigger")}
              </span>
              <kbd
                className="nv3-topbar-wide" aria-hidden="true"
                style={G3.fig("xs", { flexShrink: 0, color: c.inkMuted, border: "1px solid " + c.border, borderRadius: G3.r.xs, padding: "1px 6px", background: c.page })}
              >
                {IS_MAC ? t("shell.search.kbdMac") : t("shell.search.kbd")}
              </kbd>
            </button>
            <div style={{ flex: 1 }} />
            <Notifications role={role} sections={sections} onNavigate={onNavigate} />
            <AccountMenu role={role} sections={sections} onNavigate={onNavigate} initials={initials} user={user} />
          </div>
          {current && current.items.length > 1 ? (
            <SubTabs section={current} active={active} onNavigate={onNavigate} padX={padX} />
          ) : null}
        </header>
        {searching ? <CommandPalette role={role} sections={sections} onNavigate={onNavigate} onClose={closeSearch} /> : null}
      </React.Fragment>
    );
  }

  window.Shell3 = { TopBar };
})();
