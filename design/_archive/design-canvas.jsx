/* ============================================================
   DesignCanvas — a pan/zoom board (Figma-like), pure DOM.
   window.DesignCanvas  — the zoomable board + toolbar
   window.DCArtboard    — a titled frame tile
   window.NaveyaBoard   — the assembled Design System + Web pages

   Board CHROME (bg, toolbar, page tabs, artboard frames) is a fixed
   neutral dark slate, independent of the content theme toggle inside
   the artboards. Artboard CONTENT (Screens, kit components) lives
   inside a single ThemeProvider so the toolbar's ThemeToggle flips
   every artboard between light/dark together.
   ============================================================ */
(function () {
  const { useState, useRef, useCallback, Fragment } = React;
  const G = window.G;
  const UI = window.UI;
  const { ThemeProvider, useTheme, ThemeToggle, withAlpha, Button, Field, Input, Select, Search, Mark, StatusPill, Seal, Register } = UI;

  // Board chrome always reads the dark semantic map — this is the
  // canvas frame, not a themed screen.
  const BC = G.dark;
  const BOARD_SHADOW = "0 24px 48px -12px rgba(0,0,0,.55), 0 8px 16px -8px rgba(0,0,0,.35)";

  function DCArtboard({ title, subtitle, w, pad, bg, children }) {
    const width = w || 520;
    const padding = pad === undefined ? 24 : pad;
    return (
      <div style={{ width: width, flex: "0 0 auto" }}>
        <div style={{
          display: "flex", alignItems: "baseline", gap: 10, marginBottom: 10,
          fontFamily: G.mono, color: BC.inkMuted, fontSize: 11, letterSpacing: ".06em",
        }}>
          <span style={{ width: 6, height: 6, background: BC.accent, transform: "rotate(45deg)", flex: "0 0 auto" }} />
          <span style={{ color: BC.ink, fontWeight: 500, textTransform: "uppercase" }}>{title}</span>
          {subtitle && <span style={{ color: withAlpha(BC.ink, 0.55) }}>· {subtitle}</span>}
        </div>
        <div style={{
          background: bg || BC.bg, border: `1px solid ${withAlpha("#FFFFFF", 0.12)}`,
          borderRadius: G.r.lg, padding: padding, boxShadow: BOARD_SHADOW, overflow: "hidden",
        }}>
          {children}
        </div>
      </div>
    );
  }

  function DCRow({ children, gap }) {
    return <div style={{ display: "flex", gap: gap === undefined ? 48 : gap, alignItems: "flex-start" }}>{children}</div>;
  }

  function DesignCanvas({ pages }) {
    const [t, setT] = useState({ x: 120, y: 110, s: 1 });
    const [active, setActive] = useState(0);
    const drag = useRef(null);

    const onWheel = useCallback((e) => {
      e.preventDefault();
      setT((p) => {
        const ds = Math.exp(-e.deltaY * 0.0015);
        const ns = Math.min(2.2, Math.max(0.25, p.s * ds));
        const k = ns / p.s;
        return { s: ns, x: e.clientX - (e.clientX - p.x) * k, y: e.clientY - (e.clientY - p.y) * k };
      });
    }, []);

    const onPointerDown = (e) => {
      if (e.target.closest("[data-noPan]")) return;
      drag.current = { x: e.clientX, y: e.clientY, ox: t.x, oy: t.y };
      e.currentTarget.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e) => {
      if (!drag.current) return;
      setT((p) => ({ ...p, x: drag.current.ox + (e.clientX - drag.current.x), y: drag.current.oy + (e.clientY - drag.current.y) }));
    };
    const onPointerUp = () => { drag.current = null; };

    const btn = {
      fontFamily: G.mono, fontSize: 12, color: BC.ink, background: "rgba(255,255,255,.08)",
      border: "1px solid rgba(255,255,255,.14)", borderRadius: 8, padding: "6px 10px", cursor: "pointer",
    };

    return (
      <div style={{
        position: "fixed", inset: 0, overflow: "hidden",
        background: `radial-gradient(1200px 800px at 20% -10%, ${BC.surface}, ${BC.bg} 60%)`,
        cursor: drag.current ? "grabbing" : "grab", touchAction: "none", userSelect: "none",
      }}
        onWheel={onWheel} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}>

        <div style={{
          position: "absolute", inset: 0, opacity: .5,
          backgroundImage: `radial-gradient(rgba(255,255,255,.10) 1px, transparent 1px)`,
          backgroundSize: "26px 26px", backgroundPosition: `${t.x}px ${t.y}px`,
        }} />

        <div style={{ position: "absolute", left: 0, top: 0, transformOrigin: "0 0", transform: `translate(${t.x}px,${t.y}px) scale(${t.s})` }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 64, padding: 8 }}>
            {pages[active].node}
          </div>
        </div>

        {/* toolbar: zoom + reset + theme toggle */}
        <div data-noPan style={{
          position: "fixed", left: 20, bottom: 20, display: "flex", gap: 8, alignItems: "center",
          background: "rgba(14,20,22,.82)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,.12)",
          borderRadius: 10, padding: 8,
        }}>
          <button data-noPan style={btn} onClick={() => setT((p) => ({ ...p, s: Math.max(.25, p.s - .15) }))}>–</button>
          <span style={{ fontFamily: G.mono, fontSize: 12, color: BC.inkMuted, width: 44, textAlign: "center" }}>{Math.round(t.s * 100)}%</span>
          <button data-noPan style={btn} onClick={() => setT((p) => ({ ...p, s: Math.min(2.2, p.s + .15) }))}>+</button>
          <div style={{ width: 1, height: 18, background: "rgba(255,255,255,.14)" }} />
          <button data-noPan style={btn} onClick={() => setT({ x: 120, y: 110, s: 1 })}>Reset</button>
          <div style={{ width: 1, height: 18, background: "rgba(255,255,255,.14)" }} />
          <ThemeToggle />
        </div>

        {/* page tabs */}
        <div data-noPan style={{
          position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 4,
          background: "rgba(14,20,22,.86)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,.12)", borderRadius: 12, padding: 6, zIndex: 50,
        }}>
          <span style={{ fontFamily: G.display, color: BC.ink, fontSize: 14, padding: "0 8px 0 6px" }}>Naveya</span>
          <div style={{ width: 1, height: 18, background: "rgba(255,255,255,.14)" }} />
          {pages.map((p, i) => (
            <button key={p.name} data-noPan onClick={() => { setActive(i); setT({ x: 120, y: 110, s: 1 }); }}
              style={{
                fontFamily: G.sans, fontSize: 12.5, fontWeight: 600, cursor: "pointer", border: "none", borderRadius: 8, padding: "6px 13px",
                color: i === active ? BC.bg : BC.inkMuted, background: i === active ? BC.ink : "transparent",
              }}>{p.name}</button>
          ))}
        </div>

        <div style={{ position: "fixed", right: 20, top: 20, fontFamily: G.mono, color: withAlpha(BC.ink, 0.5), fontSize: 11, letterSpacing: ".05em" }}>
          {pages[active].name.toUpperCase()}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------
  // Design System page content
  // ---------------------------------------------------------------
  const PALETTE_ROLES = ["bg", "surface", "raised", "border", "ink", "inkMuted", "accent", "action", "brass", "success", "warning", "danger", "info"];

  function PaletteGroup({ label, theme }) {
    return (
      <div>
        <div style={{ fontFamily: G.mono, fontSize: 11, color: BC.inkMuted, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>{label}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {PALETTE_ROLES.map((k) => (
            <div key={k} style={{ width: 92 }}>
              <div style={{ height: 52, borderRadius: G.r.sm, background: theme[k], border: "1px solid rgba(0,0,0,.14)" }} />
              <div style={{ fontFamily: G.mono, fontSize: 9.5, color: BC.ink, marginTop: 4 }}>{k}</div>
              <div style={{ fontFamily: G.mono, fontSize: 9, color: BC.inkMuted }}>{theme[k]}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function PaletteSwatches() {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <PaletteGroup label="Light" theme={G.light} />
        <PaletteGroup label="Dark" theme={G.dark} />
      </div>
    );
  }

  function TypeSpecimenPanel() {
    return (
      <div>
        <div style={{ ...G.t("display", "latin"), color: BC.ink, marginBottom: 8 }}>Naveya payroll register</div>
        <div style={{ ...G.t("h1", "latin"), color: BC.ink, marginBottom: 8 }}>Attendance &amp; payroll, ruled</div>
        <div style={{ ...G.t("body", "latin"), color: BC.ink, marginBottom: 8, maxWidth: 440 }}>
          Every rupee is Decimal, shown as Decimal, and never truncated — the register resolves rightward from marks to net pay.
        </div>
        <div style={{ ...G.t("display", "deva"), color: BC.ink, marginBottom: 8 }}>नमस्ते, अनन्या</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
          <span style={{ ...G.t("h3", "latin"), color: BC.ink }}>Leave balance</span>
          <span style={{ ...G.t("h3", "latin"), color: BC.inkMuted }}>।</span>
          <span style={{ ...G.t("h3", "deva"), color: BC.ink }}>अवकाश शेष</span>
        </div>
        <div style={{ fontFamily: G.mono, fontSize: 22, fontWeight: 500, color: BC.accent, fontFeatureSettings: "'tnum' 1, 'lnum' 1" }}>₹ 48,750.00</div>
      </div>
    );
  }

  function ComponentsPanel() {
    const { c } = useTheme();
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <Button variant="primary">Save changes</Button>
          <Button variant="accent">Approve</Button>
          <Button variant="ghost">Cancel</Button>
          <Button variant="link">Learn more</Button>
          <Button variant="primary" disabled>Disabled</Button>
        </div>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          <div style={{ width: 220 }}><Field label="Employee name"><Input placeholder="Ananya Rao" /></Field></div>
          <div style={{ width: 220 }}><Field label="Department"><Select placeholder="All departments" options={["Teaching", "Administration", "Facilities"]} /></Field></div>
          <div style={{ width: 220 }}><Field label="Search"><Search placeholder="Search by name or ID" /></Field></div>
        </div>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center" }}>
          {["P", "A", "L", "H"].map((k) => (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Mark kind={k} size={26} />
              <span style={{ fontFamily: G.sans, fontSize: 13, color: c.ink }}>{{ P: "Present", A: "Absent", L: "Leave", H: "Half-day" }[k]}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <StatusPill status="Paid" /><StatusPill status="Processing" /><StatusPill status="Pending" />
          <Seal label="Verified" />
        </div>
      </div>
    );
  }

  const REGISTER_ROWS = [
    { id: "EMP-014", name: "Ananya Rao", marks: ["P", "P", "P", "L", "P", "H"], present: 4.5, netPay: 48750.00, status: "Paid" },
    { id: "EMP-021", name: "Vikram Sinha", marks: ["P", "P", "A", "P", "P", "H"], present: 4.5, netPay: 41200.00, status: "Paid" },
    { id: "EMP-032", name: "Farida Sheikh", marks: ["P", "L", "P", "P", "P", "H"], present: 4.5, netPay: 52300.50, status: "Processing" },
    { id: "EMP-045", name: "Thomas Mathew", marks: ["P", "P", "P", "P", "A", "H"], present: 4.5, netPay: 38900.00, status: "Paid" },
    { id: "EMP-058", name: "Priya Nair", marks: ["P", "P", "P", "P", "P", "H"], present: 5.5, netPay: 45600.00, status: "Pending" },
  ];

  function RegisterPanel() {
    return (
      <Register
        title="Payroll muster — July 2026"
        days={["MON", "TUE", "WED", "THU", "FRI", "SAT"]}
        weekendIndex={5}
        rows={REGISTER_ROWS}
        density="compact"
      />
    );
  }

  function DesignSystemPage() {
    const { c } = useTheme();
    return (
      <Fragment>
        <DCRow>
          <DCArtboard title="Palette" subtitle="light + dark, semantic tokens" w={640} bg={BC.raised}><PaletteSwatches /></DCArtboard>
          <DCArtboard title="Typography" subtitle="Hanken Grotesk · Mukta · Anek · JetBrains Mono" w={520} bg={BC.raised}><TypeSpecimenPanel /></DCArtboard>
        </DCRow>
        <DCRow>
          <DCArtboard title="Components" subtitle="buttons · inputs · marks · status · seal" w={760} bg={c.bg}><ComponentsPanel /></DCArtboard>
        </DCRow>
        <DCRow>
          <DCArtboard title="The Register" subtitle="payroll muster — structural record rule, not a card stripe" w={1160} bg={c.bg}><RegisterPanel /></DCArtboard>
        </DCRow>
      </Fragment>
    );
  }

  // ---------------------------------------------------------------
  // Web page content — Login + Employee Home artboards
  // ---------------------------------------------------------------
  function WebPage() {
    const { c } = useTheme();
    return (
      <DCRow>
        <DCArtboard title="Login" subtitle="sign in" w={480} pad={0} bg={c.bg}>
          <div style={{ height: 640 }}>
            <window.Screens.Login onContinue={() => {}} onSSO={() => {}} />
          </div>
        </DCArtboard>
        <DCArtboard title="Employee — Home" subtitle="ESS · the primary surface" w={1400} pad={0} bg={c.bg}>
          <div style={{ height: 820 }}>
            <window.Screens.Employee route="home" onNavigate={() => {}} onSignOut={() => {}} onViewAdmin={() => {}} />
          </div>
        </DCArtboard>
      </DCRow>
    );
  }

  // ---------------------------------------------------------------
  // Screens page content — the five newly built employee routes,
  // each framed in the same static employee shell (via
  // window.Screens.Employee route=…) so nav/top-bar chrome reads
  // identically to the Web page's Home artboard.
  // ---------------------------------------------------------------
  const EMPLOYEE_ROUTE_ARTBOARDS = [
    { route: "attendance", title: "Employee — My Attendance", subtitle: "daily ledger · arrival marks · day timecard" },
    { route: "leave", title: "Employee — Leave", subtitle: "balance ledger · apply · history" },
    { route: "payslips", title: "Employee — Payslips", subtitle: "list · full payslip detail" },
    { route: "documents", title: "Employee — Documents", subtitle: "HR-governed vault · action needed" },
    { route: "profile", title: "Employee — Profile", subtitle: "digital service book" },
  ];

  function ScreensPage() {
    const { c } = useTheme();
    return (
      <Fragment>
        <DCRow>
          {EMPLOYEE_ROUTE_ARTBOARDS.slice(0, 3).map((a) => (
            <DCArtboard key={a.route} title={a.title} subtitle={a.subtitle} w={1400} pad={0} bg={c.bg}>
              <div style={{ height: 860 }}>
                <window.Screens.Employee route={a.route} onNavigate={() => {}} onSignOut={() => {}} onViewAdmin={() => {}} />
              </div>
            </DCArtboard>
          ))}
        </DCRow>
        <DCRow>
          {EMPLOYEE_ROUTE_ARTBOARDS.slice(3).map((a) => (
            <DCArtboard key={a.route} title={a.title} subtitle={a.subtitle} w={1400} pad={0} bg={c.bg}>
              <div style={{ height: 860 }}>
                <window.Screens.Employee route={a.route} onNavigate={() => {}} onSignOut={() => {}} onViewAdmin={() => {}} />
              </div>
            </DCArtboard>
          ))}
        </DCRow>
      </Fragment>
    );
  }

  function BoardPages() {
    return (
      <DesignCanvas pages={[
        { name: "Design System", node: <DesignSystemPage /> },
        { name: "Web", node: <WebPage /> },
        { name: "Screens", node: <ScreensPage /> },
      ]} />
    );
  }

  function NaveyaBoard() {
    return (
      <ThemeProvider>
        <BoardPages />
      </ThemeProvider>
    );
  }

  window.DCArtboard = DCArtboard;
  window.DCRow = DCRow;
  window.DesignCanvas = DesignCanvas;
  window.NaveyaBoard = NaveyaBoard;
})();
