/* ============================================================
   tweaker.jsx — Naveya STAFFROOM live design-system tweaker.
   Unlike design/playground.jsx (which reimplements a standalone
   sample surface), this tweaker drives the REAL window.G2 tokens
   and window.UI2/Screens2 components through ThemeProvider's
   `overrides` prop — so what you see previewed (Login, Employee
   Home, and every placeholder route) is byte-identical to the
   shipped v2 canvas, just repainted live.

   Two layers of override, both merged onto the real G2 base:
     1. PRESET — one of the four shell/colour directions from
        design/shell-options.html (A Plum Indigo / B Terracotta
        Clay / C Peacock Ink / D Aubergine Lac). Picking a preset
        swaps shell, canvas, ink, accent, and the four attendance-
        state colours for BOTH light and dark, with a hand-authored
        (not mechanically inverted) dark variant per direction.
        Secondary/tertiary roles (weekly-off, holiday, missing-
        swipe, penalty, leave-TYPE donut colours) are deliberately
        brand-independent and stay constant across all four presets.
     2. EDITS — per-token fine-tuning on top of the selected preset
        (a role's solid colour; its tint/text companions are
        auto-derived — approximated, verify AA before shipping).

   "Reset" returns to the selected PRESET, never hardcoded to
   Terracotta. Switching preset clears edits (a fresh fine-tuning
   canvas per direction).

   Self-contained IIFE, classic-JSX-runtime, no imports/exports.
   Depends on window.G2, window.UI2, window.Screens2 (load after them).
   ============================================================ */
(function () {
  const { useState, useMemo, useCallback, useEffect } = React;
  const G = window.G2;
  const { ThemeProvider, useTheme, LangProvider, useLang, LangSwitcher, Icon, withAlpha } = window.UI2;
  const { Login, Employee } = window.Screens2;

  // ---------------------------------------------------------------
  // Color math (local to the tweaker — not part of the shipped kit)
  // ---------------------------------------------------------------
  function hexToRgb(hex) {
    const h = (hex || "#000000").replace("#", "");
    const full = h.length === 3 ? h.split("").map((ch) => ch + ch).join("") : h;
    const n = parseInt(full, 16) || 0;
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  function rgbToHex(r, g, b) {
    const clamp = (v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0");
    return "#" + clamp(r) + clamp(g) + clamp(b);
  }
  function mix(hexA, hexB, t) {
    const a = hexToRgb(hexA), b = hexToRgb(hexB);
    return rgbToHex(a.r + (b.r - a.r) * t, a.g + (b.g - a.g) * t, a.b + (b.b - a.b) * t);
  }

  // ---------------------------------------------------------------
  // The four shell/colour presets — verbatim from design/shell-
  // options.html for the light "core" values; dark cores are
  // hand-authored in the same spirit as G2's Terracotta dark (a
  // deep canvas tinted toward the direction's own hue, data roles
  // brightened for AA — never a mechanical light-mode inversion).
  // ---------------------------------------------------------------
  const PRESETS = [
    {
      key: "A", label: "A · Plum Indigo",
      light: { shell: "#3F2263", shell2: "#4C2C75", bg: "#FAF8FC", surface: "#FFFFFF", ink: "#241A33", inkMuted: "#6B6280", accent: "#6D4AC4", border: "#EBE6F2", present: "#17935F", late: "#D2870B", absent: "#D14059", leave: "#7A5AF8" },
      dark: { shell: "#2A1548", shell2: "#341C5C", bg: "#150E20", surface: "#1E1730", ink: "#EFE9F7", inkMuted: "#B3A6C8", accent: "#9B7EE8", border: "#362A4A", present: "#4FC08A", late: "#E0A23E", absent: "#E15C6E", leave: "#A98CFF" },
    },
    {
      key: "B", label: "B · Terracotta Clay",
      light: { shell: "#7E3A2A", shell2: "#94472F", bg: "#FDF8F5", surface: "#FFFFFF", ink: "#33201A", inkMuted: "#7A6459", accent: "#C2603F", border: "#F1E4DC", present: "#2F7D5C", late: "#C07A08", absent: "#C0392B", leave: "#8A5CC4" },
      dark: { shell: "#4A2015", shell2: "#5E2A1B", bg: "#1A1210", surface: "#241A16", ink: "#F5E9E1", inkMuted: "#B49A8C", accent: "#E2794F", border: "#3A2B23", present: "#49BF8B", late: "#E0A83E", absent: "#E2665A", leave: "#B18AE0" },
    },
    {
      key: "C", label: "C · Peacock Ink",
      light: { shell: "#0F3B45", shell2: "#155059", bg: "#F5FAFB", surface: "#FFFFFF", ink: "#12292E", inkMuted: "#5C7278", accent: "#0E9AAE", border: "#E1EDEF", present: "#1C8C5A", late: "#C4870C", absent: "#CE4257", leave: "#6C63C7" },
      dark: { shell: "#082B33", shell2: "#0E3A44", bg: "#0B1D21", surface: "#12282D", ink: "#E4F1F3", inkMuted: "#9CB8BD", accent: "#35C2D6", border: "#234047", present: "#3FBE86", late: "#E0AA3E", absent: "#E4677C", leave: "#8E85E6" },
    },
    {
      key: "D", label: "D · Aubergine Lac",
      light: { shell: "#5C1F35", shell2: "#722842", bg: "#FCF7F8", surface: "#FFFFFF", ink: "#2E1720", inkMuted: "#77606A", accent: "#A83250", border: "#F0E2E6", present: "#2E7D5B", late: "#C4870C", absent: "#C8384F", leave: "#7B4FA8" },
      dark: { shell: "#35111F", shell2: "#451729", bg: "#180D12", surface: "#22131B", ink: "#F3E6EC", inkMuted: "#B99AA8", accent: "#D8698A", border: "#3A2530", present: "#4CBE8A", late: "#E0AA3E", absent: "#E2637A", leave: "#B37FDD" },
    },
  ];
  const DEFAULT_PRESET_KEY = "B"; // Terracotta Clay stays the default/current selection

  // Full-palette derivation from a preset's hand-authored "core"
  // (shell/shell2/bg/surface/ink/inkMuted/accent/border + the 4
  // attendance-state solids) — everything else (soft tints, AA
  // text shades, accentSoft, action/onAction, chrome overlays) is
  // computed with the same mix() ratios reverse-engineered from
  // G2's hand-authored Terracotta tokens, so all four presets stay
  // internally consistent with each other and with the shipped app.
  function deriveFullOverride(core, mode) {
    const isDark = mode === "dark";
    const out = {
      shell: core.shell, shell2: core.shell2,
      onShell: "#FFFFFF",
      onShellMuted: isDark ? "rgba(251,239,233,.70)" : "rgba(255,255,255,.74)",
      shellActive: isDark ? "rgba(255,255,255,.14)" : "rgba(255,255,255,.18)",
      shellHover: isDark ? "rgba(255,255,255,.08)" : "rgba(255,255,255,.10)",
      bg: core.bg, surface: core.surface, raised: core.surface,
      sunken: isDark ? mix(core.bg, "#000000", 0.12) : mix(core.bg, core.ink, 0.045),
      border: core.border,
      borderStrong: isDark ? mix(core.border, "#FFFFFF", 0.07) : mix(core.border, core.ink, 0.09),
      ink: core.ink, inkMuted: core.inkMuted,
      inkFaint: isDark ? mix(core.inkMuted, "#000000", 0.26) : mix(core.inkMuted, core.bg, 0.30),
      accent: core.accent,
      accentSoft: isDark ? mix(core.accent, "#000000", 0.71) : mix(core.accent, "#FFFFFF", 0.84),
      onAccent: isDark ? mix(core.accent, "#000000", 0.87) : "#FFFFFF",
      focus: withAlpha(core.accent, 0.55),
    };
    out.action = isDark ? core.accent : core.shell;
    out.onAction = isDark ? out.onAccent : "#FFFFFF";
    ["present", "late", "absent", "leave"].forEach((role) => {
      const hex = core[role];
      out[role] = hex;
      out[role + "Tint"] = isDark ? mix(hex, "#000000", 0.78) : mix(hex, "#FFFFFF", 0.84);
      out[role + "Text"] = isDark ? mix(hex, "#FFFFFF", 0.35) : mix(hex, "#000000", 0.38);
    });
    return out;
  }

  // ---------------------------------------------------------------
  // Per-token fine-tuning (layered ON TOP of the selected preset) —
  // same shape/roles as before this dispatch's preset-switcher addition.
  // ---------------------------------------------------------------
  const BASE_ROLES = [
    { key: "shell", label: "Shell (sidebar/top bar start)" },
    { key: "shell2", label: "Shell gradient end" },
    { key: "bg", label: "Canvas" },
    { key: "surface", label: "Surface / card" },
    { key: "border", label: "Border" },
    { key: "ink", label: "Ink (text)" },
    { key: "inkMuted", label: "Ink muted" },
    { key: "accent", label: "Accent / brand" },
  ];
  const STATE_ROLES = [
    { key: "present", label: "Present" },
    { key: "late", label: "Late" },
    { key: "absent", label: "Absent" },
    { key: "leave", label: "Leave (attendance)" },
    { key: "off", label: "Weekly off" },
    { key: "holiday", label: "Holiday" },
    { key: "missing", label: "Missing swipe" },
    { key: "penalty", label: "Penalty" },
  ];
  const LEAVE_TYPE_ROLES = [
    { key: "ltEL", label: "Leave type · EL / Vacation" },
    { key: "ltCasual", label: "Leave type · Casual" },
    { key: "ltSick", label: "Leave type · Sick" },
    { key: "ltComp", label: "Leave type · Comp-off" },
  ];
  const DERIVED_KEYS = STATE_ROLES.concat(LEAVE_TYPE_ROLES).map((r) => r.key);

  function deriveForMode(edits, mode) {
    const out = {};
    Object.keys(edits).forEach((key) => {
      const hex = edits[key];
      if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return;
      out[key] = hex;
      if (DERIVED_KEYS.indexOf(key) !== -1) {
        const tintKey = key + "Tint", textKey = key + "Text";
        if (mode === "dark") {
          out[tintKey] = mix(hex, "#000000", 0.78);
          out[textKey] = mix(hex, "#FFFFFF", 0.35);
        } else {
          out[tintKey] = mix(hex, "#FFFFFF", 0.84);
          out[textKey] = mix(hex, "#000000", 0.38);
        }
      }
    });
    return out;
  }

  // ---------------------------------------------------------------
  // Rail atoms
  // ---------------------------------------------------------------
  function RailLabel({ c, children }) {
    return <div style={{ fontFamily: G.sans, fontSize: 11.5, fontWeight: 700, color: c.inkMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: ".03em" }}>{children}</div>;
  }

  function HexField({ c, label, value, onChange }) {
    const [text, setText] = useState(value);
    useEffect(() => { setText(value); }, [value]);
    const commit = (v) => { if (/^#[0-9a-fA-F]{6}$/.test(v)) onChange(v); };
    const safe = /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000";
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          type="color" value={safe} onChange={(e) => onChange(e.target.value)}
          style={{ width: 26, height: 26, padding: 0, border: `1px solid ${c.border}`, borderRadius: G.r.xs, cursor: "pointer", flex: "0 0 auto" }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: G.sans, fontSize: 11, color: c.inkMuted }}>{label}</div>
          <input
            type="text" value={text}
            onChange={(e) => { setText(e.target.value); commit(e.target.value); }}
            onBlur={() => setText(value)}
            style={{
              width: "100%", fontFamily: G.mono, fontSize: 11.5, color: c.ink, background: c.bg,
              border: `1px solid ${c.border}`, borderRadius: G.r.xs, padding: "3px 6px", boxSizing: "border-box",
            }}
          />
        </div>
      </div>
    );
  }

  function RoleGroup({ c, title, roles, values, onEdit }) {
    return (
      <div>
        <RailLabel c={c}>{title}</RailLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {roles.map((r) => (
            <HexField key={r.key} c={c} label={r.label} value={values[r.key]} onChange={(v) => onEdit(r.key, v)} />
          ))}
        </div>
      </div>
    );
  }

  function PresetSwitcher({ c, mode, selected, onSelect }) {
    return (
      <div>
        <RailLabel c={c}>Colour direction</RailLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {PRESETS.map((p) => {
            const active = p.key === selected;
            const swatch = p[mode] || p.light;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => onSelect(p.key)}
                aria-pressed={active}
                style={{
                  display: "flex", alignItems: "center", gap: 7, textAlign: "left",
                  fontFamily: G.sans, fontSize: 11.5, fontWeight: 700, padding: "8px 9px", borderRadius: G.r.md,
                  cursor: "pointer", border: `1.5px solid ${active ? c.accent : c.border}`,
                  background: active ? c.accentSoft : "transparent", color: c.ink,
                }}
              >
                <span style={{
                  width: 16, height: 16, borderRadius: G.r.pill, flex: "0 0 auto",
                  background: `linear-gradient(135deg, ${swatch.shell}, ${swatch.shell2})`,
                  boxShadow: `0 0 0 1px ${withAlpha("#000000", 0.12)}`,
                }} />
                {p.key}
              </button>
            );
          })}
        </div>
        <div style={{ fontFamily: G.sans, fontSize: 11, color: c.inkMuted, marginTop: 6 }}>
          {(PRESETS.find((p) => p.key === selected) || PRESETS[1]).label}
        </div>
      </div>
    );
  }

  function serializeTheme(c, mode, presetLabel) {
    const keys = BASE_ROLES.concat(STATE_ROLES).concat(LEAVE_TYPE_ROLES).map((r) => r.key);
    const lines = [];
    keys.forEach((k) => {
      lines.push(`  ${k}: ${JSON.stringify(c[k])},`);
      if (DERIVED_KEYS.indexOf(k) !== -1) {
        lines.push(`  ${k}Tint: ${JSON.stringify(c[k + "Tint"])}, ${k}Text: ${JSON.stringify(c[k + "Text"])},`);
      }
    });
    return `// Naveya STAFFROOM — exported ${mode} palette\n// preset: ${presetLabel} (+ any per-token edits applied on top)\n// Tint/Text pairs are AUTO-DERIVED approximations — verify AA\n// contrast before pasting into design/v2/tokens.jsx.\nconst ${mode} = {\n${lines.join("\n")}\n};`;
  }

  // ---------------------------------------------------------------
  // Preview frame — the real Login / Employee screens, unmodified.
  // ---------------------------------------------------------------
  const ROUTES = ["home", "attendance", "leave", "payslips", "documents", "profile"];

  function PreviewFrame({ screen, setScreen, route, setRoute }) {
    if (screen === "login") {
      return <Login onContinue={() => setScreen("employee")} onSSO={() => setScreen("employee")} />;
    }
    return (
      <Employee
        route={route}
        onNavigate={setRoute}
        onSignOut={() => setScreen("login")}
        role="employee"
      />
    );
  }

  // ---------------------------------------------------------------
  // TweakerBody — lives INSIDE ThemeProvider+LangProvider, so it
  // shares the exact same context the preview reads from.
  // ---------------------------------------------------------------
  const RAIL_W = 328;

  function TweakerBody({ edits, setEdits, presetFull, selectedPreset, onSelectPreset }) {
    const { mode, c, toggle } = useTheme();
    const { t } = useLang();
    const [screen, setScreen] = useState("employee");
    const [route, setRoute] = useState("home");

    const modeEdits = edits[mode] || {};
    const setToken = useCallback((key, value) => {
      setEdits((prev) => ({ ...prev, [mode]: { ...(prev[mode] || {}), [key]: value } }));
    }, [mode, setEdits]);
    const resetMode = useCallback(() => setEdits((prev) => ({ ...prev, [mode]: {} })), [mode, setEdits]);
    const resetAll = useCallback(() => setEdits({ light: {}, dark: {} }), [setEdits]);

    // Values shown in the rail's fields: edited value if present, else
    // the selected preset's derived value, else the raw G2 base (for
    // roles the preset doesn't touch — weekly-off/holiday/leave-type
    // donuts, which are deliberately brand-independent).
    const baseC = G.theme(mode);
    const presetC = presetFull[mode];
    function valueFor(key) { return modeEdits[key] || presetC[key] || baseC[key]; }

    const ALL_ROLE_KEYS = BASE_ROLES.concat(STATE_ROLES).concat(LEAVE_TYPE_ROLES).map((r) => r.key);
    const railValues = {};
    ALL_ROLE_KEYS.forEach((k) => { railValues[k] = valueFor(k); });

    const presetLabel = (PRESETS.find((p) => p.key === selectedPreset) || PRESETS[1]).label;

    return (
      <div style={{ display: "flex", width: "100%", height: "100%", background: c.bg }}>
        <aside style={{
          width: RAIL_W, flex: `0 0 ${RAIL_W}px`, height: "100%", overflowY: "auto",
          background: c.surface, borderRight: `1px solid ${c.border}`, padding: G.sp[4], boxSizing: "border-box",
          display: "flex", flexDirection: "column", gap: G.sp[5],
        }}>
          <div>
            <div style={{ ...G.t("h2", "latin"), color: c.accent }}>Naveya</div>
            <div style={{ fontFamily: G.mono, fontSize: 11, color: c.inkMuted, letterSpacing: ".04em" }}>STAFFROOM · design-system tweaker</div>
          </div>

          <PresetSwitcher c={c} mode={mode} selected={selectedPreset} onSelect={onSelectPreset} />

          <div style={{ display: "flex", gap: G.sp[3] }}>
            <div style={{ flex: 1 }}>
              <RailLabel c={c}>Mode</RailLabel>
              <div style={{ display: "flex", border: `1px solid ${c.border}`, borderRadius: G.r.sm, overflow: "hidden" }}>
                {["light", "dark"].map((m) => (
                  <button
                    key={m} type="button" onClick={() => { if (m !== mode) toggle(); }}
                    style={{
                      flex: 1, fontFamily: G.sans, fontSize: 12, fontWeight: 600, padding: "7px 8px", cursor: "pointer", border: "none",
                      background: mode === m ? c.action : "transparent", color: mode === m ? c.onAction : c.ink,
                    }}
                  >
                    {m === "light" ? "Light" : "Dark"}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <RailLabel c={c}>Language</RailLabel>
              <LangSwitcher />
            </div>
          </div>

          <div>
            <RailLabel c={c}>Preview screen</RailLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <button
                type="button" onClick={() => setScreen("login")}
                style={{
                  textAlign: "left", fontFamily: G.sans, fontSize: 12.5, fontWeight: 600, padding: "7px 10px", borderRadius: G.r.sm,
                  cursor: "pointer", border: `1px solid ${screen === "login" ? c.accent : c.border}`,
                  background: screen === "login" ? c.accentSoft : "transparent", color: c.ink,
                }}
              >
                Login
              </button>
              <button
                type="button" onClick={() => setScreen("employee")}
                style={{
                  textAlign: "left", fontFamily: G.sans, fontSize: 12.5, fontWeight: 600, padding: "7px 10px", borderRadius: G.r.sm,
                  cursor: "pointer", border: `1px solid ${screen === "employee" ? c.accent : c.border}`,
                  background: screen === "employee" ? c.accentSoft : "transparent", color: c.ink,
                }}
              >
                Employee shell
              </button>
              {screen === "employee" && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 2, paddingLeft: G.sp[2] }}>
                  {ROUTES.map((r) => (
                    <button
                      key={r} type="button" onClick={() => setRoute(r)}
                      style={{
                        fontFamily: G.sans, fontSize: 11.5, fontWeight: 600, padding: "4px 9px", borderRadius: G.r.pill,
                        cursor: "pointer", border: `1px solid ${route === r ? c.accent : c.border}`,
                        background: route === r ? c.accentSoft : "transparent", color: c.ink,
                      }}
                    >
                      {t("nav." + r)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <RailLabel c={c}>Fine-tune ({mode})</RailLabel>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={resetMode} style={{ fontFamily: G.mono, fontSize: 10.5, color: c.accent, background: "transparent", border: "none", cursor: "pointer", textDecoration: "underline", padding: 0 }}>Reset {mode}</button>
              <button onClick={resetAll} style={{ fontFamily: G.mono, fontSize: 10.5, color: c.inkMuted, background: "transparent", border: "none", cursor: "pointer", textDecoration: "underline", padding: 0 }}>Reset all</button>
            </div>
          </div>
          <div style={{ fontFamily: G.sans, fontSize: 10.5, color: c.inkMuted, marginTop: -G.sp[3] }}>
            Fields below start from “{presetLabel}” — edit any to fine-tune on top of it; Reset returns to the preset, not Terracotta.
          </div>

          <RoleGroup c={c} title="Shell & surfaces" roles={BASE_ROLES} values={railValues} onEdit={setToken} />
          <RoleGroup c={c} title="Attendance-state roles" roles={STATE_ROLES} values={railValues} onEdit={setToken} />
          <RoleGroup c={c} title="Leave-type roles" roles={LEAVE_TYPE_ROLES} values={railValues} onEdit={setToken} />

          <div>
            <RailLabel c={c}>Export ({mode})</RailLabel>
            <textarea
              readOnly value={serializeTheme(c, mode, presetLabel)} onFocus={(e) => e.target.select()}
              style={{
                width: "100%", height: 190, fontFamily: G.mono, fontSize: 10, color: c.ink, background: c.bg,
                border: `1px solid ${c.border}`, borderRadius: G.r.sm, padding: 8, boxSizing: "border-box", resize: "vertical",
              }}
            />
          </div>
        </aside>

        <div style={{ flex: 1, minWidth: 0, height: "100%", overflow: "auto" }}>
          <PreviewFrame screen={screen} setScreen={setScreen} route={route} setRoute={setRoute} />
        </div>
      </div>
    );
  }

  function Tweaker() {
    const [selectedPreset, setSelectedPreset] = useState(DEFAULT_PRESET_KEY);
    const [edits, setEdits] = useState({ light: {}, dark: {} });

    const presetCore = useMemo(
      () => PRESETS.find((p) => p.key === selectedPreset) || PRESETS[1],
      [selectedPreset]
    );
    const presetFull = useMemo(() => ({
      light: deriveFullOverride(presetCore.light, "light"),
      dark: deriveFullOverride(presetCore.dark, "dark"),
    }), [presetCore]);

    const overrides = useMemo(() => ({
      light: { ...presetFull.light, ...deriveForMode(edits.light, "light") },
      dark: { ...presetFull.dark, ...deriveForMode(edits.dark, "dark") },
    }), [presetFull, edits]);

    // Switching direction starts fine-tuning fresh from that preset.
    const handleSelectPreset = useCallback((key) => {
      setSelectedPreset(key);
      setEdits({ light: {}, dark: {} });
    }, []);

    return (
      <ThemeProvider initialMode="light" overrides={overrides}>
        <LangProvider initialLang="en">
          <TweakerBody
            edits={edits} setEdits={setEdits}
            presetFull={presetFull} selectedPreset={selectedPreset} onSelectPreset={handleSelectPreset}
          />
        </LangProvider>
      </ThemeProvider>
    );
  }

  window.Tweaker2 = Tweaker;
})();
