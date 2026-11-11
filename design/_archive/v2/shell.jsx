/* ============================================================
   shell.jsx — Naveya v2 approved chrome, extracted + re-coloured.
   Composes ONLY from window.G2 (tokens) + window.UI2 (kit). Classic-
   JSX-runtime IIFE, no imports/exports, inline styles only.

   This is the USER-APPROVED rail/topbar from
   design/v2/variants/home-a.jsx ("Keka-faithful rail": narrow 84px
   dark rail, icon-over-label, one soft active fill, thin flat top
   bar) — NOT the mockup's 214px text rail from
   design/mockups/SubstitutionBoard.dc.html. The user was explicit:
   "I liked the substitution board, but that doesn't mean we switch
   the sidebar etc." Re-coloured here with the CURRENT peacock rail
   tokens (c.shell / c.onShell / c.shellActive, already the "Peacock
   Ink" direction in design/v2/tokens.jsx — no new hex introduced).

   The content region is a FULL-BLEED slot: no CONTENT_MAX, no
   centred column, no dead side margins — every Pages2.* screen
   already renders its own full-width Register/Masthead/ActionBar/
   StatusFooter (design/v2/kit.jsx grammar primitives) and manages
   its own internal scroll (some pages are height:"100%" self-
   scrolling registers; others are minHeight:"100%" and rely on this
   slot to scroll). The slot below supports BOTH without a double
   scrollbar: flex:1 + minHeight:0 + overflow:"auto" gives a definite
   height a height:100% child fills exactly (its own internal region
   scrolls), while a minHeight:100% child that grows taller triggers
   this slot's own scrollbar.
   ============================================================ */
(function () {
  const { useState, useEffect } = React;
  const G = window.G2;
  const {
    useTheme, useLang, ThemeToggle, LangSwitcher, Button, Icon, Avatar, withAlpha,
  } = window.UI2;

  const RAIL_W = 84;
  const TOPBAR_H = 56;

  const RAIL_NAV = [
    { key: "home", icon: "home" },
    { key: "attendance", icon: "clock" },
    { key: "leave", icon: "calendar" },
    { key: "payslips", icon: "wallet" },
    { key: "documents", icon: "document" },
    { key: "profile", icon: "user" },
    { key: "substitution", icon: "swap" },
  ];

  // ---------------------------------------------------------------
  // Local i18n overlay — ONLY the chrome strings this shell needs
  // that aren't already in the kit's STRINGS table (the search
  // field placeholder). Everything else reuses useLang()/t() as-is.
  // ---------------------------------------------------------------
  const LOCAL_STRINGS = {
    en: { "chrome.search": "Search", "chrome.searchPlaceholder": "Search…" },
    hi: { "chrome.search": "खोजें", "chrome.searchPlaceholder": "खोजें…" },
  };
  function useT2() {
    const { t, lang } = useLang();
    const t2 = (key) => {
      const table = LOCAL_STRINGS[lang] || LOCAL_STRINGS.en;
      return table[key] !== undefined ? table[key] : t(key);
    };
    return { t2, t, lang };
  }

  // ---------------------------------------------------------------
  // Colour mix helper — derives the rail's "deep neutral tinted
  // toward the brand hue" fill from TWO existing tokens only
  // (G2.surf.canvas + the theme's c.shell), never a new hex literal.
  // ---------------------------------------------------------------
  function hexToRgbLocal(hex) {
    const h = hex.replace("#", "");
    const full = h.length === 3 ? h.split("").map((ch) => ch + ch).join("") : h;
    const n = parseInt(full, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  function mixHex(hexA, hexB, amt) {
    const a = hexToRgbLocal(hexA), b = hexToRgbLocal(hexB);
    const r = Math.round(a.r + (b.r - a.r) * amt);
    const g = Math.round(a.g + (b.g - a.g) * amt);
    const bl = Math.round(a.b + (b.b - a.b) * amt);
    return `rgb(${r}, ${g}, ${bl})`;
  }

  // ---------------------------------------------------------------
  // Rail — narrow (84px), icon above label, one soft active fill.
  // Deliberately flat/dark regardless of app theme: it should recede.
  // ---------------------------------------------------------------
  function Rail({ route, onNavigate, onSignOut }) {
    const { c, mode } = useTheme();
    const { t, lang } = useLang();
    const railBg = mixHex(G.surf.canvas, c.shell, mode === "dark" ? 0.3 : 0.24);
    return (
      <div style={{ width: RAIL_W, flex: `0 0 ${RAIL_W}px`, background: railBg, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ padding: `${G.sp[4]}px 0 ${G.sp[3]}px` }}>
          <div
            aria-hidden="true"
            style={{
              width: 36, height: 36, borderRadius: G.r.md, background: withAlpha("#FFFFFF", 0.1),
              border: `1px solid ${withAlpha("#FFFFFF", 0.14)}`, display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: G.sans, fontWeight: 800, fontSize: 15, color: c.onShell,
            }}
          >
            N
          </div>
        </div>

        <nav aria-label={t("nav.home")} style={{ flex: 1, width: "100%", display: "flex", flexDirection: "column", gap: 2, padding: `${G.sp[1]}px ${G.sp[1.5]}px`, overflowY: "auto" }}>
          {RAIL_NAV.map((n) => {
            const active = n.key === route;
            return (
              <button
                key={n.key}
                type="button"
                data-nvx={"nav-" + n.key}
                aria-current={active ? "page" : undefined}
                onClick={() => onNavigate && onNavigate(n.key)}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
                  width: "100%", padding: `${G.sp[2]}px 2px`, borderRadius: G.r.md,
                  background: active ? c.shellActive : "transparent", border: "none", cursor: "pointer", font: "inherit",
                  transition: `background ${G.mo.hover}`,
                }}
              >
                <Icon name={n.icon} size={18} color={active ? c.accent : c.onShellMuted} strokeWidth={active ? 2.1 : 1.9} />
                <span
                  style={{
                    fontFamily: lang === "hi" ? G.deva : G.sans, fontSize: lang === "hi" ? 9 : 9.5,
                    lineHeight: 1.15, fontWeight: active ? 700 : 500, color: active ? c.onShell : c.onShellMuted,
                    textAlign: "center", whiteSpace: "normal", maxWidth: RAIL_W - 14,
                  }}
                >
                  {t("nav." + n.key)}
                </span>
              </button>
            );
          })}
        </nav>

        <div style={{ width: "100%", padding: `${G.sp[3]}px 0 ${G.sp[4]}px`, borderTop: `1px solid ${withAlpha("#FFFFFF", 0.1)}`, display: "flex", flexDirection: "column", alignItems: "center", gap: G.sp[2] }}>
          <Avatar initials="AR" size={32} />
          <button
            onClick={onSignOut}
            aria-label={t("common.signOut")}
            title={t("common.signOut")}
            style={{ background: "transparent", border: "none", cursor: "pointer", color: c.onShellMuted, display: "flex", padding: 4 }}
          >
            <Icon name="logout" size={15} color={c.onShellMuted} />
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------
  // TopBar — thin (56px), flat brand colour, search centred, then
  // the EN/हिंदी switcher + theme toggle + notifications on the right.
  // ---------------------------------------------------------------
  function SearchField() {
    const { c } = useTheme();
    const { t2, lang } = useT2();
    const [focused, setFocused] = useState(false);
    useEffect(() => {
      let tag = document.getElementById("tn2-shell-style");
      if (!tag) {
        tag = document.createElement("style");
        tag.id = "tn2-shell-style";
        document.head.appendChild(tag);
      }
      tag.textContent = `#tn2-shell-search::placeholder { color: ${withAlpha("#FFFFFF", 0.62)}; }`;
    }, []);
    return (
      <div
        style={{
          display: "flex", alignItems: "center", gap: 8, width: "100%", maxWidth: 380,
          background: withAlpha("#FFFFFF", focused ? 0.18 : 0.12),
          border: `1px solid ${withAlpha("#FFFFFF", focused ? 0.34 : 0.2)}`,
          borderRadius: G.r.pill, padding: "6px 12px", boxSizing: "border-box",
          transition: `background ${G.mo.hover}, border ${G.mo.hover}`,
        }}
      >
        <Icon name="search" size={14} color={c.onShellMuted} strokeWidth={2} />
        <input
          id="tn2-shell-search"
          type="text"
          aria-label={t2("chrome.search")}
          placeholder={t2("chrome.searchPlaceholder")}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1, minWidth: 0, background: "transparent", border: "none", outline: "none",
            fontFamily: lang === "hi" ? G.deva : G.sans, fontSize: 13, color: c.onShell,
          }}
        />
      </div>
    );
  }

  function TopBar({ schoolName }) {
    const { c } = useTheme();
    const { t } = useLang();
    return (
      <div
        style={{
          height: TOPBAR_H, flex: `0 0 ${TOPBAR_H}px`, background: c.shell,
          display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center",
          padding: `0 ${G.sp[5]}px`, gap: G.sp[4], boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", minWidth: 0 }}>
          <span style={{ fontFamily: G.sans, fontSize: 13.5, fontWeight: 700, color: c.onShell, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {schoolName}
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
          <SearchField />
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: G.sp[3] }}>
          <LangSwitcher size="sm" />
          <ThemeToggle onDark size={30} />
          <Button variant="icon" ariaLabel={t("common.notifications")}>
            <Icon name="bell" size={16} color={c.onShell} />
          </Button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------
  // Shell2 — the whole approved chrome: narrow dark rail + thin
  // brand top bar around a FULL-BLEED, edge-to-edge content slot.
  // No CONTENT_MAX anywhere in this file — that discipline lives in
  // each Pages2.* screen, which is itself already full width.
  // ---------------------------------------------------------------
  function Shell2({ route, onNavigate, onSignOut, schoolName, children }) {
    const { c } = useTheme();
    return (
      <div style={{ display: "flex", width: "100%", height: "100%", background: c.bg }}>
        <Rail route={route} onNavigate={onNavigate} onSignOut={onSignOut} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          <TopBar schoolName={schoolName || "Sunrise Public School"} />
          <div style={{ flex: "1 1 auto", minHeight: 0, minWidth: 0, overflow: "auto", background: c.bg }}>
            {children}
          </div>
        </div>
      </div>
    );
  }

  window.Shell2 = Shell2;
})();
