/* ============================================================
   canvas.jsx — Naveya "role canvas": one pan/zoom board, numbered
   role lanes stacked vertically, each lane a single horizontal row
   of screen frames. Every frame is a real `design/*.html` screen
   rendered in its own <iframe> (own document, own theme/lang state,
   can't leak styles into the board) scaled down to a thumbnail.

   Self-contained IIFE — no imports/exports, inline styles only, no
   dependency on window.G/window.G2/window.UI (this is board tooling,
   not a themed product screen). Only file consumed: canvas.html.
   window.RoleCanvas — the mounted board.

   Editing note: this is the ONLY place the lane/frame map lives —
   keep it in sync with design/*.html as new screens are built by
   flipping a frame's `url` from null to its real path.
   ============================================================ */
(function () {
  const { useState, useRef, useCallback, useEffect } = React;

  // ---- local board tokens (self-contained by design) ----
  const C = {
    board: "#F2F3EF",
    dot: "rgba(20,38,34,.16)",
    border: "#DBDFD8",
    borderStrong: "#C2C9BF",
    ink: "#182420",
    inkMuted: "#5B6B64",
    inkFaint: "#8B968E",
    accent: "#146051",
    accentSoft: "#DCEEE7",
    gold: "#8A6412",
    goldSoft: "#F5E7CC",
    ghostBg: "#EAEBE5",
    chrome: "#0F2229",
    onChrome: "#EAF1EF",
    onChromeMuted: "rgba(234,241,239,.62)",
  };
  const F = {
    sans: "'Hanken Grotesk', system-ui, -apple-system, 'Segoe UI', sans-serif",
    mono: "'JetBrains Mono', ui-monospace, 'IBM Plex Mono', Menlo, monospace",
  };

  // Each frame previews a real desktop viewport, scaled to a fixed
  // thumbnail box via CSS transform (own document per iframe).
  const VIEWPORT_W = 1440, VIEWPORT_H = 900;
  const FRAME_W = 460, FRAME_H = 288;
  const SCALE = FRAME_W / VIEWPORT_W;

  // ---------------------------------------------------------------
  // Data — the role → screen map, derived from docs/development-
  // specification.md (M1–M17) and docs/functionality-blueprint.md,
  // NOT treated as a closed/verbatim inventory — every role lane
  // lists what that role genuinely needs for MVP, gaps included.
  //
  // `url: null` -> "not built yet", dashed ghost frame (no iframe).
  // `url` set, no `preV3` -> canonical v3 (Peacock) screen, real iframe.
  // `url` set, `preV3: true` -> a v2/experiment screen kept only as
  //   reference (not rebuilt on v3 yet) — flagged with a muted chip
  //   so it's never mistaken for the current system. Rejected v2
  //   "register grammar" screens are NOT framed here at all anymore;
  //   they stay on disk but the canvas only shows current + honest gaps.
  // ---------------------------------------------------------------
  const LANES = [
    {
      num: 1, name: "Employee", tag: "web (self-service) · M4 M8 M9 M10 M11 M13 M15.1 M17",
      frames: [
        { code: "E0", title: "Sign in", url: "v3.html?screen=login" },
        { code: "E1", title: "Home", url: "v3.html?screen=home" },
        { code: "E2", title: "My attendance", url: null },
        { code: "E3", title: "Leave", url: null },
        { code: "E4", title: "Payslips", url: null },
        { code: "E5", title: "Documents", url: null },
        { code: "E6", title: "Profile", url: null },
        { code: "E7", title: "Reimbursement claims", url: null },
        { code: "E8", title: "Investment declaration", url: null },
        { code: "E9", title: "Helpdesk tickets", url: null },
        { code: "E10", title: "Self-appraisal", url: null },
      ],
    },
    {
      num: 2, name: "Department Head", tag: "web (approvals) · M8 M9 M17",
      frames: [
        { code: "D1", title: "Team leave approvals", url: null },
        { code: "D2", title: "Department attendance", url: null },
        { code: "D3", title: "Cover requests", url: null },
        { code: "D4", title: "Team appraisal evaluations", url: null },
      ],
    },
    {
      num: 3, name: "Campus Principal", tag: "web (campus operations) · M6 M8 M9 M15",
      frames: [
        { code: "P1", title: "Substitution board", url: null },
        { code: "P2", title: "Campus attendance board", url: null },
        { code: "P3", title: "Leave approvals (escalation)", url: null },
        { code: "P4", title: "Staff register", url: null },
        { code: "P5", title: "Campus reports", url: null },
        { code: "P6", title: "Session-end renewal / non-renewal queue", url: null },
      ],
    },
    {
      num: 4, name: "HR Operator", tag: "web (people, documents & talent) · M3 M4 M5 M6 M14 M15.1 M17",
      frames: [
        { code: "H1", title: "Staff master", url: null },
        { code: "H2", title: "Document verification queue", url: null },
        { code: "H3", title: "Requisitions & job postings", url: null },
        { code: "H4", title: "Candidate pipeline & interviews", url: null },
        { code: "H5", title: "Offers & conversion", url: null },
        { code: "H6", title: "Onboarding checklists & bulk joiners", url: null },
        { code: "H7", title: "Helpdesk queue", url: null },
        { code: "H8", title: "Appraisal cycle setup & moderation", url: null },
        { code: "H9", title: "Notification templates", url: null },
      ],
    },
    {
      num: 5, name: "Payroll Operator", tag: "web (the run) · M10 M12",
      frames: [
        { code: "R1", title: "Payroll run console", url: "v2-x.html", preV3: true },
        { code: "R2", title: "Salary structures", url: null },
        { code: "R3", title: "Loans & advances", url: null },
        { code: "R4", title: "Reimbursement payout batches", url: null },
        { code: "R5", title: "Arrears / retrospective revisions", url: null },
        { code: "R6", title: "Full & final settlement", url: null },
      ],
    },
    {
      num: 6, name: "Accountant", tag: "web (check & file) · M10 M11",
      frames: [
        { code: "C1", title: "Payroll approval gate (checker)", url: null },
        { code: "C2", title: "Statutory calendar", url: null },
        { code: "C3", title: "Filings (ECR / ESI / PT / 24Q / Form 16)", url: null },
        { code: "C4", title: "Bank file & JV export", url: null },
        { code: "C5", title: "Bonus runs (statutory / ex-gratia)", url: null },
        { code: "C6", title: "Investment declaration review", url: null },
      ],
    },
    {
      num: 7, name: "Group Admin", tag: "web (multi-campus & platform) · M1 M2 M5 M7 M11 M15 M16",
      frames: [
        { code: "G1", title: "Overview board", url: "v2-x2.html", preV3: true },
        { code: "G2", title: "Org structure", url: null },
        { code: "G3", title: "Roles & access", url: null },
        { code: "G4", title: "Statutory config", url: null },
        { code: "G5", title: "Group reports", url: null },
        { code: "G6", title: "Academic calendar setup", url: null },
        { code: "G7", title: "Requisition budget approval", url: null },
        { code: "G8", title: "Integrations & webhooks", url: null },
      ],
    },
  ];

  const ALL_FRAMES = LANES.reduce((acc, l) => acc.concat(l.frames), []);
  const V3_COUNT = ALL_FRAMES.filter((f) => f.url && !f.preV3).length;
  const PREV3_COUNT = ALL_FRAMES.filter((f) => f.url && f.preV3).length;
  const TOTAL_COUNT = ALL_FRAMES.length;

  // ---------------------------------------------------------------
  // Small glyphs — inline SVG only (no emoji per project convention).
  // ---------------------------------------------------------------
  function DragDots() {
    const pts = [[0, 0], [4.5, 0], [0, 4.5], [4.5, 4.5], [0, 9], [4.5, 9]];
    return (
      <svg width="7" height="11" viewBox="0 0 7 11" aria-hidden="true" style={{ flex: "0 0 auto" }}>
        {pts.map((p, i) => <circle key={i} cx={p[0] + 1.1} cy={p[1] + 1.1} r="1.1" fill="currentColor" />)}
      </svg>
    );
  }

  function PreV3Chip() {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", marginLeft: 6, flex: "0 0 auto",
        background: C.goldSoft, color: C.gold, border: `1px solid ${C.gold}`,
        borderRadius: 4, padding: "1.5px 6px", fontFamily: F.mono, fontSize: 9.5,
        fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase",
      }}>
        pre-v3
      </span>
    );
  }

  function NotBuiltChip() {
    return (
      <span style={{
        fontFamily: F.mono, fontSize: 10.5, fontWeight: 600, letterSpacing: ".04em", textTransform: "uppercase",
        color: C.inkFaint, background: "#F5F6F1", border: `1px solid ${C.borderStrong}`,
        borderRadius: 4, padding: "3px 9px",
      }}>Not built</span>
    );
  }

  // ---------------------------------------------------------------
  // Lazy-load: only assign an iframe's src once its wrapper is near
  // the browser viewport (IntersectionObserver survives CSS-transform
  // pan/zoom — the browser recomputes intersection on transform).
  // ---------------------------------------------------------------
  function useNearViewport(ref) {
    const [near, setNear] = useState(false);
    useEffect(() => {
      if (near) return;
      const el = ref.current;
      if (!el) return;
      if (!("IntersectionObserver" in window)) { setNear(true); return; }
      const io = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          io.disconnect();
        }
      }, { root: null, rootMargin: "900px 500px", threshold: 0 });
      io.observe(el);
      return () => io.disconnect();
    }, [ref, near]);
    return near;
  }

  function ScreenFrame({ code, title, url, preV3 }) {
    const wrapRef = useRef(null);
    const near = useNearViewport(wrapRef);
    const built = !!url;

    const label = (
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 7, minWidth: 0 }}>
        <span style={{ color: C.inkFaint }}><DragDots /></span>
        <span style={{ fontFamily: F.mono, fontSize: 11.5, fontWeight: 700, color: C.ink, flex: "0 0 auto" }}>{code}</span>
        <span style={{
          fontFamily: F.mono, fontSize: 11.5, color: C.inkMuted, whiteSpace: "nowrap",
          overflow: "hidden", textOverflow: "ellipsis", minWidth: 0,
        }}>· {title}</span>
        {built && preV3 && <PreV3Chip />}
      </div>
    );

    return (
      <div style={{ width: FRAME_W, flex: "0 0 auto" }} ref={wrapRef}>
        {url ? (
          <a
            href={url} target="_blank" rel="noopener" data-nopan="true"
            style={{ textDecoration: "none", display: "block", cursor: "pointer" }}
            title={`Open ${code} · ${title} in a new tab`}
          >
            {label}
          </a>
        ) : label}

        <div style={{
          width: FRAME_W, height: FRAME_H, borderRadius: 9, overflow: "hidden", position: "relative",
          background: built ? "#FFFFFF" : C.ghostBg,
          border: built ? `1px solid ${C.border}` : `1.5px dashed ${C.borderStrong}`,
          boxShadow: built ? "0 1px 2px rgba(20,30,28,.06), 0 8px 18px -12px rgba(20,30,28,.24)" : "none",
        }}>
          {built ? (
            near ? (
              <iframe
                src={url}
                title={`${code} · ${title}`}
                loading="lazy"
                style={{
                  width: VIEWPORT_W, height: VIEWPORT_H, border: "none",
                  transform: `scale(${SCALE})`, transformOrigin: "top left",
                  pointerEvents: "none", background: "#fff",
                }}
              />
            ) : (
              <div style={{
                position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: F.mono, fontSize: 11, color: C.inkFaint,
              }}>loading…</div>
            )
          ) : (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <NotBuiltChip />
            </div>
          )}
        </div>
      </div>
    );
  }

  function Lane({ num, name, tag, frames }) {
    return (
      <div style={{ marginBottom: 64 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 18 }}>
          <span style={{ fontFamily: F.mono, fontSize: 22, fontWeight: 700, color: C.inkFaint }}>{num}</span>
          <span style={{ fontFamily: F.mono, fontSize: 22, color: C.inkFaint }}>·</span>
          <span style={{ fontFamily: F.sans, fontSize: 23, fontWeight: 800, color: C.ink, letterSpacing: "-.01em" }}>{name}</span>
          <span style={{ fontFamily: F.sans, fontSize: 14.5, fontWeight: 500, color: C.inkMuted }}>{tag}</span>
        </div>
        <div style={{ display: "flex", gap: 22, alignItems: "flex-start" }}>
          {frames.map((f, i) => <ScreenFrame key={code_key(f, i)} {...f} />)}
        </div>
      </div>
    );
  }

  function code_key(f, i) { return f.code + "-" + i; }

  function Legend() {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, background: C.accentSoft, border: `1.5px solid ${C.accent}`, flex: "0 0 auto" }} />
          <span style={{ fontFamily: F.sans, fontSize: 12.5, color: C.onChromeMuted, fontWeight: 500 }}>Built</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, background: C.goldSoft, border: `1.5px solid ${C.gold}`, flex: "0 0 auto" }} />
          <span style={{ fontFamily: F.sans, fontSize: 12.5, color: C.onChromeMuted, fontWeight: 500 }}>Pre-v3 (reference)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, border: "1.5px dashed rgba(255,255,255,.55)", flex: "0 0 auto" }} />
          <span style={{ fontFamily: F.sans, fontSize: 12.5, color: C.onChromeMuted, fontWeight: 500 }}>Not built</span>
        </div>
      </div>
    );
  }

  const RESET_T = { x: 90, y: 130, s: 0.6 };

  function Board() {
    const [t, setT] = useState(RESET_T);
    const drag = useRef(null);
    const [dragging, setDragging] = useState(false);

    const onWheel = useCallback((e) => {
      e.preventDefault();
      setT((p) => {
        const ds = Math.exp(-e.deltaY * 0.0015);
        const ns = Math.min(1.6, Math.max(0.16, p.s * ds));
        const k = ns / p.s;
        return { s: ns, x: e.clientX - (e.clientX - p.x) * k, y: e.clientY - (e.clientY - p.y) * k };
      });
    }, []);

    const onPointerDown = (e) => {
      if (e.target.closest("[data-nopan]")) return;
      drag.current = { x: e.clientX, y: e.clientY, ox: t.x, oy: t.y };
      setDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e) => {
      const d = drag.current;
      if (!d) return;
      // Snapshot d locally — setT's updater can run after this handler
      // returns (React 18 batches updater invocation), and a same-tick
      // pointerup would have already nulled drag.current by then.
      const nx = d.ox + (e.clientX - d.x);
      const ny = d.oy + (e.clientY - d.y);
      setT((p) => ({ ...p, x: nx, y: ny }));
    };
    const onPointerUp = () => { drag.current = null; setDragging(false); };

    const zoomBtn = {
      fontFamily: F.mono, fontSize: 13, color: C.onChrome, background: "rgba(255,255,255,.08)",
      border: "1px solid rgba(255,255,255,.16)", borderRadius: 7, padding: "6px 11px", cursor: "pointer",
    };

    return (
      <div
        style={{
          position: "fixed", inset: 0, overflow: "hidden", background: C.board,
          cursor: dragging ? "grabbing" : "grab", touchAction: "none", userSelect: "none",
        }}
        onWheel={onWheel} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
      >
        {/* faint dot grid, pans with the board */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `radial-gradient(${C.dot} 1.4px, transparent 1.4px)`,
          backgroundSize: "28px 28px", backgroundPosition: `${t.x}px ${t.y}px`,
        }} />

        <div style={{
          position: "absolute", left: 0, top: 0, transformOrigin: "0 0",
          transform: `translate(${t.x}px, ${t.y}px) scale(${t.s})`,
        }}>
          <div style={{ padding: "10px 60px 160px 60px" }}>
            {LANES.map((l) => <Lane key={l.num} {...l} />)}
          </div>
        </div>

        {/* fixed header */}
        <div data-nopan="true" style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "13px 22px", background: C.chrome, borderBottom: "1px solid rgba(255,255,255,.1)",
          boxShadow: "0 4px 14px rgba(0,0,0,.18)",
        }}>
          <span style={{ fontFamily: F.sans, fontWeight: 800, fontSize: 16.5, color: C.onChrome, letterSpacing: "-.01em" }}>
            Naveya <span style={{ color: C.onChromeMuted, fontWeight: 500 }}>· role canvas</span>
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <Legend />
            <div style={{ width: 1, height: 18, background: "rgba(255,255,255,.16)" }} />
            <span style={{ fontFamily: F.mono, fontSize: 12.5, color: C.onChromeMuted }}>
              <span style={{ color: C.onChrome, fontWeight: 700 }}>{V3_COUNT}</span> built ·{" "}
              <span style={{ color: "#E4C77A", fontWeight: 700 }}>{PREV3_COUNT}</span> pre-v3 /{" "}
              {TOTAL_COUNT} screens
            </span>
          </div>
        </div>

        {/* fixed zoom toolbar */}
        <div data-nopan="true" style={{
          position: "fixed", left: 20, bottom: 20, zIndex: 50, display: "flex", gap: 8, alignItems: "center",
          background: C.chrome, border: "1px solid rgba(255,255,255,.14)", borderRadius: 10, padding: 8,
          boxShadow: "0 8px 22px rgba(0,0,0,.22)",
        }}>
          <button data-nopan="true" style={zoomBtn} onClick={() => setT((p) => ({ ...p, s: Math.max(.16, p.s - .1) }))}>–</button>
          <span style={{ fontFamily: F.mono, fontSize: 12, color: C.onChromeMuted, width: 42, textAlign: "center" }}>{Math.round(t.s * 100)}%</span>
          <button data-nopan="true" style={zoomBtn} onClick={() => setT((p) => ({ ...p, s: Math.min(1.6, p.s + .1) }))}>+</button>
          <div style={{ width: 1, height: 18, background: "rgba(255,255,255,.16)" }} />
          <button data-nopan="true" style={zoomBtn} onClick={() => setT(RESET_T)}>Reset</button>
        </div>
      </div>
    );
  }

  function RoleCanvas() {
    return <Board />;
  }

  window.RoleCanvas = RoleCanvas;
})();
