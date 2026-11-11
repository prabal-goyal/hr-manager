/* ============================================================
   kit.jsx — Naveya shared component kit (window.UI)
   Direction: "Peacock & Slate" (design/tokens.jsx, window.G).
   Self-contained IIFE, classic-JSX-runtime, no imports/exports,
   inline styles only, colors/spacing/type read from window.G.
   Screens (design/screens.jsx) compose ONLY from window.UI.
   ============================================================ */
(function () {
  const { createContext, useContext, useState, useEffect, useCallback, Fragment } = React;
  const G = window.G;

  // ---------------------------------------------------------------
  // Color helpers
  // ---------------------------------------------------------------
  function hexToRgb(hex) {
    const h = hex.replace("#", "");
    const full = h.length === 3 ? h.split("").map((ch) => ch + ch).join("") : h;
    const n = parseInt(full, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  function withAlpha(hex, alpha) {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  const TABULAR = { fontFeatureSettings: "'tnum' 1, 'lnum' 1" };

  // ---------------------------------------------------------------
  // Global stylesheet — theme-driven :focus-visible ring (accent,
  // read live from G via the ThemeProvider effect below — never a
  // hardcoded hex in a screen) + the spin/pulse keyframes shared by
  // Button's loading Spinner and Skeleton. One <style> tag, kept in
  // sync with the active theme; every native interactive element
  // (button, [role=button], a, input, select, textarea) inherits it.
  // ---------------------------------------------------------------
  function ensureGlobalStyleTag() {
    if (typeof document === "undefined") return null;
    let tag = document.getElementById("tn-kit-global-style");
    if (!tag) {
      tag = document.createElement("style");
      tag.id = "tn-kit-global-style";
      document.head.appendChild(tag);
    }
    return tag;
  }

  // ---------------------------------------------------------------
  // Theme: context + provider + reduced-motion
  // ---------------------------------------------------------------
  const ThemeCtx = createContext(null);
  function useTheme() {
    const ctx = useContext(ThemeCtx);
    if (!ctx) {
      // Defensive default so a stray consumer outside a Provider doesn't crash the canvas.
      return { mode: "light", c: G.light, toggle: () => {}, mo: G.mo, el: G.el.light, reduced: false };
    }
    return ctx;
  }

  function useReducedMotionPreference() {
    const [reduced, setReduced] = useState(false);
    useEffect(() => {
      if (!window.matchMedia) return undefined;
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      setReduced(mq.matches);
      const handler = (e) => setReduced(e.matches);
      if (mq.addEventListener) mq.addEventListener("change", handler);
      else if (mq.addListener) mq.addListener(handler);
      return () => {
        if (mq.removeEventListener) mq.removeEventListener("change", handler);
        else if (mq.removeListener) mq.removeListener(handler);
      };
    }, []);
    return reduced;
  }

  function ThemeProvider({ initialMode, children }) {
    const [mode, setMode] = useState(initialMode === "dark" ? "dark" : "light");
    const reduced = useReducedMotionPreference();
    const c = G.theme(mode);
    const mo = reduced ? G.mo.reduced : G.mo;
    const el = G.el[mode];
    const toggle = useCallback(() => setMode((m) => (m === "dark" ? "light" : "dark")), []);
    const value = { mode, c, toggle, setMode, reduced, mo, el };

    // Keep the global focus-visible ring + shared keyframes in sync with the
    // active theme's accent (c.focus). Runs on mount and every mode change —
    // this is the ONE place the ring color is authored; screens never repeat it.
    useEffect(() => {
      const tag = ensureGlobalStyleTag();
      if (!tag) return;
      tag.textContent =
        "button:focus-visible, [role=\"button\"]:focus-visible, a:focus-visible, " +
        "input:focus-visible, select:focus-visible, textarea:focus-visible { " +
        "outline: 2px solid " + c.focus + "; outline-offset: 2px; }" +
        "@keyframes tn-spin { to { transform: rotate(360deg); } }" +
        "@keyframes tn-pulse { 0%, 100% { opacity: .35; } 50% { opacity: 1; } }";
    }, [c.focus]);

    return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
  }

  // ---------------------------------------------------------------
  // Icon — small square-terminal SVG set (ruled-paper feel, not
  // rounded-friendly defaults). strokeLinecap/Linejoin are square/miter.
  // ---------------------------------------------------------------
  function Icon({ name, size, color, strokeWidth, style }) {
    const { c } = useTheme();
    const s = size || 16;
    const stroke = color || c.ink;
    const sw = strokeWidth || 1.8;
    const common = {
      width: s, height: s, viewBox: "0 0 24 24", fill: "none", stroke,
      strokeWidth: sw, strokeLinecap: "square", strokeLinejoin: "miter", style,
    };
    const glyphs = {
      home: (
        <Fragment>
          <polyline points="4 11 12 4 20 11" />
          <rect x="6" y="11" width="12" height="9" />
          <rect x="10" y="15" width="4" height="5" />
        </Fragment>
      ),
      calendar: (
        <Fragment>
          <rect x="4" y="5" width="16" height="15" />
          <line x1="8" y1="3" x2="8" y2="7" />
          <line x1="16" y1="3" x2="16" y2="7" />
          <line x1="4" y1="10" x2="20" y2="10" />
        </Fragment>
      ),
      wallet: (
        <Fragment>
          <rect x="3" y="6" width="18" height="13" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <rect x="14" y="12.5" width="5" height="3.5" />
        </Fragment>
      ),
      document: (
        <Fragment>
          <path d="M6 3h9l5 5v13H6z" />
          <path d="M15 3v5h5" />
          <line x1="9" y1="12" x2="17" y2="12" />
          <line x1="9" y1="16" x2="17" y2="16" />
        </Fragment>
      ),
      user: (
        <Fragment>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20v-1a7 7 0 0 1 14 0v1" />
        </Fragment>
      ),
      bell: (
        <Fragment>
          <path d="M6 17V11a6 6 0 0 1 12 0v6" />
          <line x1="4" y1="17" x2="20" y2="17" />
          <path d="M10 20h4" />
        </Fragment>
      ),
      check: <polyline points="4 12 9.5 17.5 20 6" />,
      chevron: <polyline points="6 9 12 15 18 9" />,
      search: (
        <Fragment>
          <circle cx="10" cy="10" r="6" />
          <line x1="21" y1="21" x2="14.5" y2="14.5" />
        </Fragment>
      ),
      plus: (
        <Fragment>
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </Fragment>
      ),
      logout: (
        <Fragment>
          <path d="M9 4H5v16h4" />
          <line x1="21" y1="12" x2="10" y2="12" />
          <polyline points="15 7 21 12 15 17" />
        </Fragment>
      ),
      alert: (
        <Fragment>
          <path d="M12 3 20.5 20h-17z" />
          <line x1="12" y1="9" x2="12" y2="13.5" />
          <line x1="12" y1="16.5" x2="12" y2="16.51" />
        </Fragment>
      ),
      clock: (
        <Fragment>
          <circle cx="12" cy="12" r="8.5" />
          <polyline points="12 7 12 12 15.5 14" />
        </Fragment>
      ),
      sun: (
        <Fragment>
          <circle cx="12" cy="12" r="4" />
          <line x1="12" y1="2" x2="12" y2="4.5" />
          <line x1="12" y1="19.5" x2="12" y2="22" />
          <line x1="2" y1="12" x2="4.5" y2="12" />
          <line x1="19.5" y1="12" x2="22" y2="12" />
          <line x1="4.9" y1="4.9" x2="6.6" y2="6.6" />
          <line x1="17.4" y1="17.4" x2="19.1" y2="19.1" />
          <line x1="4.9" y1="19.1" x2="6.6" y2="17.4" />
          <line x1="17.4" y1="6.6" x2="19.1" y2="4.9" />
        </Fragment>
      ),
      moon: <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4 6.5 6.5 0 0 0 20 14.5z" fill={stroke} stroke="none" />,
    };
    return <svg {...common}>{glyphs[name] || null}</svg>;
  }

  // ---------------------------------------------------------------
  // ThemeToggle
  // ---------------------------------------------------------------
  function ThemeToggle({ size }) {
    const { mode, toggle, c } = useTheme();
    const s = size || 32;
    return (
      <button
        onClick={toggle}
        aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        title={mode === "dark" ? "Light mode" : "Dark mode"}
        style={{
          width: s, height: s, borderRadius: G.r.sm, border: `1px solid ${c.border}`, background: c.surface,
          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flex: "0 0 auto",
          transition: `background 120ms ${G.mo.ease.outQuart}`,
        }}
      >
        <Icon name={mode === "dark" ? "sun" : "moon"} size={15} color={c.ink} />
      </button>
    );
  }

  // ---------------------------------------------------------------
  // Spinner — square-terminal loading ring for Button(loading) and
  // any inline pending affordance. Rotates under normal motion;
  // falls back to an opacity pulse under prefers-reduced-motion
  // (never a transform-based spin, per DESIGN.md's reduced map).
  // ---------------------------------------------------------------
  function Spinner({ size, color, style }) {
    const { reduced } = useTheme();
    const s = size || 14;
    return (
      <svg
        width={s} height={s} viewBox="0 0 24 24" aria-hidden="true"
        style={{
          flex: "0 0 auto",
          animation: reduced ? "tn-pulse 900ms ease-in-out infinite" : "tn-spin 700ms linear infinite",
          ...style,
        }}
      >
        <circle cx="12" cy="12" r="9" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="square" strokeDasharray="38 18" />
      </svg>
    );
  }

  // ---------------------------------------------------------------
  // Button — primary (ink) / accent (teal) / ghost / link / icon.
  // `loading` disables the button and shows a Spinner ahead of the
  // label (maker-checker / async actions never look inert while
  // pending) — every button gets a theme-accent :focus-visible ring
  // from the ThemeProvider's injected global stylesheet above.
  // ---------------------------------------------------------------
  function Button({ variant, size, disabled, loading, onClick, children, style, type, ariaLabel }) {
    const { c, mo } = useTheme();
    const [hover, setHover] = useState(false);
    const [press, setPress] = useState(false);
    const v = variant || "primary";
    const sz = size || "md";
    const isLink = v === "link";
    const isIcon = v === "icon";
    const isDisabled = !!disabled || !!loading;
    const variants = {
      primary: { bg: c.action, fg: c.onAction, border: "transparent" },
      accent: { bg: c.accent, fg: c.onAccent, border: "transparent" },
      ghost: { bg: hover ? withAlpha(c.ink, 0.06) : "transparent", fg: c.ink, border: c.border },
      link: { bg: "transparent", fg: c.accent, border: "transparent" },
      icon: { bg: hover ? withAlpha(c.ink, 0.06) : "transparent", fg: c.ink, border: "transparent" },
    };
    const vv = variants[v] || variants.primary;
    const padY = sz === "sm" ? G.sp[1.5] : G.sp[2];
    const padX = sz === "sm" ? G.sp[3] : G.sp[4];
    const dims = isIcon ? { width: sz === "sm" ? 28 : 32, height: sz === "sm" ? 28 : 32 } : {};
    return (
      <button
        type={type || "button"}
        disabled={isDisabled}
        aria-label={ariaLabel}
        aria-busy={loading || undefined}
        onClick={onClick}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => { setHover(false); setPress(false); }}
        onMouseDown={() => setPress(true)}
        onMouseUp={() => setPress(false)}
        style={{
          fontFamily: G.sans, fontSize: sz === "sm" ? 12.5 : 13.5, fontWeight: 600,
          padding: isLink ? 0 : isIcon ? 0 : `${padY}px ${padX}px`,
          borderRadius: isLink ? 0 : G.r.sm,
          background: vv.bg, color: vv.fg, border: isLink ? "none" : `1px solid ${vv.border}`,
          display: isIcon ? "inline-flex" : isLink ? "inline-block" : "inline-flex",
          alignItems: isLink ? undefined : "center",
          justifyContent: isIcon ? "center" : undefined,
          gap: !isIcon && !isLink ? 6 : undefined,
          cursor: isDisabled ? "not-allowed" : "pointer",
          opacity: isDisabled ? 0.45 : 1,
          textDecoration: isLink && hover && !isDisabled ? "underline" : "none",
          transform: press && !isDisabled && !isLink ? "scale(.98)" : "scale(1)",
          transition: `transform ${mo.hover}, background ${mo.hover}`,
          ...dims,
          ...style,
        }}
      >
        {loading && <Spinner size={sz === "sm" ? 12 : 13} color={vv.fg} />}
        {children}
      </button>
    );
  }

  // ---------------------------------------------------------------
  // Field / Input / Select / Search — shared accent-alpha focus ring
  // ---------------------------------------------------------------
  function Field({ label, labelAction, onLabelAction, hint, error, required, children }) {
    const { c } = useTheme();
    return (
      <label style={{ display: "flex", flexDirection: "column", gap: 6, fontFamily: G.sans }}>
        {(label || labelAction) && (
          <span style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontSize: 12.5, color: c.inkMuted, fontWeight: 500 }}>
              {label}{required && <span style={{ color: c.danger }}> *</span>}
            </span>
            {labelAction && (
              <button
                type="button"
                onClick={onLabelAction}
                style={{
                  fontFamily: G.sans, fontSize: 12, fontWeight: 600, color: c.accent,
                  background: "transparent", border: "none", padding: 0, cursor: "pointer",
                }}
              >
                {labelAction}
              </button>
            )}
          </span>
        )}
        {children}
        {error
          ? <span style={{ fontSize: 11.5, color: c.danger, display: "flex", alignItems: "center", gap: 4 }}>
              <Icon name="alert" size={12} color={c.danger} strokeWidth={2.2} />{error}
            </span>
          : hint ? <span style={{ fontSize: 11.5, color: c.inkMuted }}>{hint}</span> : null}
      </label>
    );
  }

  function fieldBoxStyle(c, focused, hasError) {
    return {
      font: "inherit", fontFamily: G.sans, fontSize: 14, width: "100%", boxSizing: "border-box",
      borderRadius: G.r.sm, background: c.surface, color: c.ink,
      border: `1px solid ${hasError ? c.danger : focused ? c.accent : c.border}`,
      outline: focused ? `2px solid ${c.focus}` : "2px solid transparent", outlineOffset: 2,
      transition: `border 120ms ${G.mo.ease.outQuart}`,
    };
  }

  function Input({ value, onChange, type, placeholder, error, onFocus, onBlur, ...rest }) {
    const { c } = useTheme();
    const [focused, setFocused] = useState(false);
    return (
      <input
        type={type || "text"} value={value} onChange={onChange} placeholder={placeholder}
        onFocus={(e) => { setFocused(true); if (onFocus) onFocus(e); }}
        onBlur={(e) => { setFocused(false); if (onBlur) onBlur(e); }}
        style={{ ...fieldBoxStyle(c, focused, !!error), padding: `${G.sp[2]}px ${G.sp[3]}px` }}
        {...rest}
      />
    );
  }

  function Select({ value, onChange, options, placeholder, ...rest }) {
    const { c } = useTheme();
    const [focused, setFocused] = useState(false);
    const opts = options || [];
    return (
      <div style={{ position: "relative", width: "100%" }}>
        <select
          value={value} onChange={onChange}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            ...fieldBoxStyle(c, focused, false),
            padding: `${G.sp[2]}px 28px ${G.sp[2]}px ${G.sp[3]}px`,
            appearance: "none", WebkitAppearance: "none", cursor: "pointer",
          }}
          {...rest}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {opts.map((o) => {
            const val = typeof o === "string" ? o : o.value;
            const label = typeof o === "string" ? o : o.label;
            return <option key={val} value={val}>{label}</option>;
          })}
        </select>
        <span style={{ position: "absolute", right: G.sp[3], top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
          <Icon name="chevron" size={13} color={c.inkMuted} />
        </span>
      </div>
    );
  }

  function Search({ value, onChange, placeholder, ...rest }) {
    const { c } = useTheme();
    const [focused, setFocused] = useState(false);
    return (
      <div style={{ position: "relative", width: "100%" }}>
        <span style={{ position: "absolute", left: G.sp[3], top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
          <Icon name="search" size={14} color={c.inkMuted} />
        </span>
        <input
          type="search" value={value} onChange={onChange} placeholder={placeholder}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{ ...fieldBoxStyle(c, focused, false), padding: `${G.sp[2]}px ${G.sp[3]}px ${G.sp[2]}px 32px` }}
          {...rest}
        />
      </div>
    );
  }

  // ---------------------------------------------------------------
  // Mark — P/A/L/½, shape AND color (never hue-alone)
  // ---------------------------------------------------------------
  function Mark({ kind, size }) {
    const { c } = useTheme();
    const s = size || 22;
    const cfg = {
      P: { bg: c.success, fg: c.onSuccess, title: "Present" },
      A: { bg: c.danger, fg: c.onDanger, title: "Absent" },
      L: { bg: c.warning, fg: c.onWarning, title: "Leave" },
      H: { bg: c.info, fg: c.onInfo, title: "Half-day" },
    }[kind] || { bg: c.border, fg: c.ink, title: kind };
    return (
      <div title={cfg.title} style={{
        width: s, height: s, borderRadius: G.r.xs, background: cfg.bg,
        display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto",
      }}>
        <svg width={s * 0.6} height={s * 0.6} viewBox="0 0 16 16" fill="none">
          {kind === "P" && <path d="M2 8.5 L6.5 13 L14 3" stroke={cfg.fg} strokeWidth="2.4" strokeLinecap="square" strokeLinejoin="miter" />}
          {kind === "A" && (
            <Fragment>
              <line x1="3" y1="3" x2="13" y2="13" stroke={cfg.fg} strokeWidth="2.4" strokeLinecap="square" />
              <line x1="13" y1="3" x2="3" y2="13" stroke={cfg.fg} strokeWidth="2.4" strokeLinecap="square" />
            </Fragment>
          )}
          {kind === "L" && <line x1="2.5" y1="8" x2="13.5" y2="8" stroke={cfg.fg} strokeWidth="2.6" strokeLinecap="square" />}
          {kind === "H" && (
            <Fragment>
              <circle cx="8" cy="8" r="6" stroke={cfg.fg} strokeWidth="1.6" fill="none" />
              <path d="M8 2 A6 6 0 0 1 8 14 Z" fill={cfg.fg} />
            </Fragment>
          )}
        </svg>
      </div>
    );
  }

  // ---------------------------------------------------------------
  // Badge / StatusPill — fill+text (+icon) state encoding, never hue-alone
  // ---------------------------------------------------------------
  function Badge({ tone, icon, children }) {
    const { c } = useTheme();
    const map = {
      success: [c.success, c.onSuccess], warning: [c.warning, c.onWarning],
      danger: [c.danger, c.onDanger], info: [c.info, c.onInfo],
      brass: [c.brass, c.bg], neutral: [c.border, c.ink],
    };
    const [bg, fg] = map[tone] || map.neutral;
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 6, background: bg, color: fg,
        fontFamily: G.sans, fontSize: 11.5, fontWeight: 600, padding: "3px 10px", borderRadius: G.r.pill,
        whiteSpace: "nowrap",
      }}>
        {icon && <Icon name={icon} size={11} color={fg} strokeWidth={2.4} />}
        {children}
      </span>
    );
  }

  function StatusPill({ status }) {
    const map = {
      Paid: ["success", "check"], Approved: ["success", "check"], Present: ["success", "check"],
      Verified: ["brass", "check"], Processing: ["info", undefined], Pending: ["warning", "alert"],
      Rejected: ["danger", "alert"], Absent: ["danger", "alert"], Draft: ["neutral", undefined],
    };
    const [tone, icon] = map[status] || ["neutral", undefined];
    return <Badge tone={tone} icon={icon}>{status}</Badge>;
  }

  // ---------------------------------------------------------------
  // Card — elevation per theme; dark uses the surf ladder + surfBorder
  // ---------------------------------------------------------------
  function Card({ level, padding, style, children }) {
    const { mode, c } = useTheme();
    const lvl = level || 1;
    const isDark = mode === "dark";
    const bg = isDark ? (G.surf[lvl] || G.surf[1]) : c.raised;
    const border = isDark ? `1px solid ${G.surfBorder}` : `1px solid ${c.border}`;
    const shadow = (G.el[mode] && G.el[mode][lvl]) || G.el[mode][1];
    return (
      <div style={{
        background: bg, border, borderRadius: G.r.lg, boxShadow: shadow,
        padding: padding === undefined ? G.sp[5] : padding,
        ...style,
      }}>
        {children}
      </div>
    );
  }

  // ---------------------------------------------------------------
  // SectionHeader
  // ---------------------------------------------------------------
  function SectionHeader({ children, action, onAction }) {
    const { c } = useTheme();
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: G.sp[2] }}>
        <span style={{ ...G.t("h3", "latin"), color: c.ink }}>{children}</span>
        {action && <Button variant="link" size="sm" onClick={onAction}>{action}</Button>}
      </div>
    );
  }

  // ---------------------------------------------------------------
  // BilingualLabel — English + Devanagari companion, equal weight, danda
  // ---------------------------------------------------------------
  function BilingualLabel({ en, deva, role, color, gap }) {
    const { c } = useTheme();
    const r = role || "body";
    const col = color || c.ink;
    return (
      <span style={{ display: "inline-flex", alignItems: "baseline", gap: gap === undefined ? G.sp[2] : gap, flexWrap: "wrap" }}>
        <span style={{ ...G.t(r, "latin"), color: col }}>{en}</span>
        <span style={{ ...G.t(r, "latin"), color: c.inkMuted }}>।</span>
        <span style={{ ...G.t(r, "deva"), color: col }}>{deva}</span>
      </span>
    );
  }

  // ---------------------------------------------------------------
  // Figure — tabular-mono ₹, decimal-aligned, never truncated
  // ---------------------------------------------------------------
  function Figure({ value, currency, size, weight, color, negative }) {
    const { c } = useTheme();
    const isNeg = negative !== undefined ? negative : value < 0;
    const col = color || (isNeg ? c.danger : c.ink);
    const formatted = Math.abs(value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return (
      <span style={{ fontFamily: G.mono, fontSize: size || 13, fontWeight: weight || 500, color: col, ...TABULAR }}>
        {isNeg ? "−" : ""}{currency === undefined ? "₹" : currency} {formatted}
      </span>
    );
  }

  // ---------------------------------------------------------------
  // Avatar
  // ---------------------------------------------------------------
  function Avatar({ initials, size }) {
    const { c } = useTheme();
    const s = size || 34;
    return (
      <div style={{
        width: s, height: s, borderRadius: G.r.pill, background: c.accentSoft, border: `1px solid ${c.border}`,
        display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto",
        fontFamily: G.sans, fontWeight: 700, fontSize: s * 0.34, color: c.accent,
      }}>
        {initials}
      </div>
    );
  }

  // ---------------------------------------------------------------
  // Seal — brass verification stamp ("mudra"), never a generic green check
  // ---------------------------------------------------------------
  function Seal({ label }) {
    const { c } = useTheme();
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 6, border: `1.5px solid ${c.brass}`, color: c.brass,
        borderRadius: G.r.sm, padding: "3px 9px", fontFamily: G.mono, fontSize: 11, fontWeight: 600,
        letterSpacing: ".03em", textTransform: "uppercase",
      }}>
        <Icon name="check" size={12} color={c.brass} strokeWidth={2.4} />
        {label || "Verified"}
      </span>
    );
  }

  // ---------------------------------------------------------------
  // Register — the hero object: ruled staff x period muster.
  // Structural "laal kinaara" record rule = a real grid column,
  // NEVER a border-left card side-stripe.
  // ---------------------------------------------------------------
  function Register({ rows, days, weekendIndex, density, title, action, onAction }) {
    const { c } = useTheme();
    const rowsData = rows || [];
    const dayLabels = days || [];
    const wIdx = weekendIndex === undefined ? -1 : weekendIndex;
    const dens = density || "compact";
    const rowH = dens === "compact" ? 36 : 44;
    const padV = dens === "compact" ? G.sp[2] : G.sp[3];
    const padH = dens === "compact" ? G.sp[3] : G.sp[4];
    const cols = `6px 176px repeat(${Math.max(dayLabels.length, 1)}, minmax(46px, 1fr)) 84px 128px 104px`;
    const weekendTint = withAlpha(c.ink, 0.045);

    const cellBase = {
      display: "flex", alignItems: "center", padding: `${padV}px ${padH}px`,
      borderBottom: `1px solid ${c.border}`, minHeight: rowH, boxSizing: "border-box",
    };
    const headCell = {
      ...cellBase, fontFamily: G.mono, fontSize: 11, letterSpacing: ".06em",
      color: c.inkMuted, fontWeight: 500, textTransform: "uppercase",
    };
    const ruleCell = { ...cellBase, background: c.accent, borderBottom: "none" };

    const presentTotal = rowsData.reduce((s, r) => s + (r.present || 0), 0);
    const netTotal = rowsData.reduce((s, r) => s + (r.netPay || 0), 0);

    return (
      <div>
        {title && <SectionHeader action={action} onAction={onAction}>{title}</SectionHeader>}
        <div style={{ display: "grid", gridTemplateColumns: cols, border: `1px solid ${c.border}`, borderRadius: G.r.md, overflow: "hidden", background: c.surface }}>
          <div style={ruleCell} />
          <div style={headCell}>Staff</div>
          {dayLabels.map((d, i) => (
            <div key={d + i} style={{ ...headCell, justifyContent: "center", background: i === wIdx ? weekendTint : "transparent" }}>{d}</div>
          ))}
          <div style={{ ...headCell, justifyContent: "flex-end" }}>Present</div>
          <div style={{ ...headCell, justifyContent: "flex-end" }}>Net Pay</div>
          <div style={{ ...headCell, justifyContent: "center" }}>Status</div>

          {rowsData.map((row) => (
            <Fragment key={row.id}>
              <div style={ruleCell} />
              <div style={{ ...cellBase, flexDirection: "column", alignItems: "flex-start", gap: 2 }}>
                <span style={{ fontFamily: G.sans, fontSize: 13, fontWeight: 500, color: c.ink }}>{row.name}</span>
                <span style={{ fontFamily: G.mono, fontSize: 11, color: c.inkMuted }}>{row.id}</span>
              </div>
              {(row.marks || []).map((m, i) => (
                <div key={i} style={{ ...cellBase, justifyContent: "center", background: i === wIdx ? weekendTint : "transparent" }}>
                  <Mark kind={m} size={dens === "compact" ? 20 : 24} />
                </div>
              ))}
              <div style={{ ...cellBase, justifyContent: "flex-end", fontFamily: G.mono, fontSize: 13, color: c.ink, ...TABULAR }}>
                {(row.present || 0).toFixed(1)}
              </div>
              <div style={{ ...cellBase, justifyContent: "flex-end" }}><Figure value={row.netPay} /></div>
              <div style={{ ...cellBase, justifyContent: "center" }}><StatusPill status={row.status} /></div>
            </Fragment>
          ))}

          <div style={ruleCell} />
          <div style={{ ...cellBase, borderTop: `2px solid ${c.border}`, fontFamily: G.mono, fontSize: 11, letterSpacing: ".05em", color: c.inkMuted, textTransform: "uppercase" }}>
            Totals
          </div>
          {dayLabels.map((d, i) => (
            <div key={"f" + d + i} style={{ ...cellBase, borderTop: `2px solid ${c.border}`, background: i === wIdx ? weekendTint : "transparent" }} />
          ))}
          <div style={{ ...cellBase, borderTop: `2px solid ${c.border}`, justifyContent: "flex-end", fontFamily: G.mono, fontSize: 13, fontWeight: 600, color: c.ink, ...TABULAR }}>
            {presentTotal.toFixed(1)}
          </div>
          <div style={{ ...cellBase, borderTop: `2px solid ${c.border}`, justifyContent: "flex-end" }}><Figure value={netTotal} weight={600} /></div>
          <div style={{ ...cellBase, borderTop: `2px solid ${c.border}` }} />
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------
  // Ledger — earnings/deductions, ruled subtotals, emphasized Net Pay
  // ---------------------------------------------------------------
  function Ledger({ earnings, deductions, net, title }) {
    const { c } = useTheme();
    const sum = (arr) => (arr || []).reduce((s, pair) => s + pair[1], 0);
    const earnTotal = sum(earnings), dedTotal = sum(deductions);
    const netVal = net === undefined ? earnTotal - dedTotal : net;

    function Col({ label, rows }) {
      const rowsArr = rows || [];
      const total = sum(rowsArr);
      return (
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontFamily: G.mono, fontSize: 11, letterSpacing: ".05em", color: c.inkMuted, textTransform: "uppercase", marginBottom: G.sp[2] }}>{label}</div>
          {rowsArr.map(([l, v]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: `${G.sp["1.5"]}px 0`, borderBottom: `1px solid ${c.border}` }}>
              <span style={{ fontFamily: G.sans, fontSize: 13.5, color: c.ink }}>{l}</span>
              <Figure value={v} />
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", padding: `${G.sp[2]}px 0`, borderTop: `2px solid ${c.border}`, marginTop: G.sp[1] }}>
            <span style={{ fontFamily: G.sans, fontSize: 13.5, fontWeight: 600, color: c.ink }}>Total</span>
            <Figure value={total} weight={600} />
          </div>
        </div>
      );
    }

    return (
      <div>
        {title && <SectionHeader>{title}</SectionHeader>}
        <div style={{ display: "flex", gap: G.sp[8], flexWrap: "wrap", background: c.surface, border: `1px solid ${c.border}`, borderRadius: G.r.lg, padding: G.sp[6] }}>
          <Col label="Earnings" rows={earnings} />
          <Col label="Deductions" rows={deductions} />
        </div>
        <div style={{ marginTop: G.sp[3], display: "flex", justifyContent: "space-between", alignItems: "baseline", background: c.accentSoft, borderRadius: G.r.md, padding: `${G.sp[3]}px ${G.sp[4]}px` }}>
          <span style={{ fontFamily: G.sans, fontSize: 15, fontWeight: 600, color: c.ink }}>Net Pay</span>
          <Figure value={netVal} size={20} weight={600} color={c.accent} />
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------
  // Textarea — matches Input's focus/border treatment (promoted from
  // design/screens/leave.jsx, which had it as a private primitive;
  // kit.jsx has no other multi-line control).
  // ---------------------------------------------------------------
  function Textarea({ value, onChange, placeholder, rows, ...rest }) {
    const { c } = useTheme();
    const [focused, setFocused] = useState(false);
    return (
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows || 3}
        onFocus={(e) => { setFocused(true); if (rest.onFocus) rest.onFocus(e); }}
        onBlur={(e) => { setFocused(false); if (rest.onBlur) rest.onBlur(e); }}
        style={{
          font: "inherit", fontFamily: G.sans, fontSize: 14, width: "100%", boxSizing: "border-box",
          borderRadius: G.r.sm, background: c.surface, color: c.ink, resize: "vertical",
          border: `1px solid ${focused ? c.accent : c.border}`,
          outline: focused ? `2px solid ${c.focus}` : "2px solid transparent", outlineOffset: 2,
          padding: `${G.sp[2]}px ${G.sp[3]}px`,
          transition: `border 120ms ${G.mo.ease.outQuart}`,
        }}
        {...rest}
      />
    );
  }

  // ---------------------------------------------------------------
  // DaySegmented — generic segmented control (promoted from
  // design/screens/leave.jsx's Full/Half/Period toggle). Takes the
  // same `options` shape as Select ({value,label} | string[]).
  // ---------------------------------------------------------------
  function DaySegmented({ value, onChange, options, disabled }) {
    const { c } = useTheme();
    const opts = options || [];
    return (
      <div style={{ display: "inline-flex", border: `1px solid ${c.border}`, borderRadius: G.r.sm, overflow: "hidden", opacity: disabled ? 0.5 : 1 }}>
        {opts.map((o, i) => {
          const val = typeof o === "string" ? o : o.value;
          const label = typeof o === "string" ? o : o.label;
          const active = value === val;
          return (
            <button
              key={val}
              type="button"
              disabled={disabled}
              onClick={() => onChange && onChange(val)}
              style={{
                fontFamily: G.sans, fontSize: 12.5, fontWeight: 600,
                padding: `${G.sp[2]}px ${G.sp[3]}px`,
                background: active ? c.accent : "transparent",
                color: active ? c.onAccent : c.ink,
                border: "none",
                borderRight: i < opts.length - 1 ? `1px solid ${c.border}` : "none",
                cursor: disabled ? "not-allowed" : "pointer",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
    );
  }

  // ---------------------------------------------------------------
  // MaskedValue — PII field-gated: masked by default, explicit reveal
  // affordance, never splashed. Promoted from design/screens/
  // documents.jsx + profile.jsx, which each had an identical private
  // copy. `size`/`style` cover the two screens' minor layout deltas.
  // ---------------------------------------------------------------
  function MaskedValue({ masked, full, size, style }) {
    const { c } = useTheme();
    const [revealed, setRevealed] = useState(false);
    return (
      <div style={{ display: "flex", alignItems: "center", gap: G.sp[2], ...style }}>
        <span style={{ fontFamily: G.mono, fontSize: size || 12.5, color: c.ink, ...TABULAR }}>
          {revealed ? full : masked}
        </span>
        <Button variant="link" size="sm" onClick={() => setRevealed((r) => !r)}>
          {revealed ? "Hide" : "Reveal"}
        </Button>
      </div>
    );
  }

  // ---------------------------------------------------------------
  // EmptyState — reusable empty/no-data surface (icon + title +
  // description + optional action). Every list/data view needs one;
  // wired for real at Documents' "no open requests" state.
  // ---------------------------------------------------------------
  function EmptyState({ icon, title, description, action, onAction }) {
    const { c } = useTheme();
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: G.sp[3], padding: `${G.sp[6]}px ${G.sp[4]}px` }}>
        <div style={{ width: 48, height: 48, borderRadius: G.r.lg, background: c.bg, border: `1px solid ${c.border}`, display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}>
          <Icon name={icon || "document"} size={20} color={c.inkMuted} />
        </div>
        <div style={{ ...G.t("h3", "latin"), color: c.ink }}>{title}</div>
        {description && <div style={{ fontFamily: G.sans, fontSize: 13, color: c.inkMuted, maxWidth: 420 }}>{description}</div>}
        {action && <Button variant="ghost" size="sm" onClick={onAction} style={{ marginTop: G.sp[1] }}>{action}</Button>}
      </div>
    );
  }

  // ---------------------------------------------------------------
  // Skeleton — loading placeholder bar (opacity-pulse only, never a
  // transform — safe under prefers-reduced-motion by construction).
  // Compose several per row to sketch a list item's shape.
  // ---------------------------------------------------------------
  function Skeleton({ width, height, radius, style }) {
    const { c } = useTheme();
    return (
      <div
        aria-hidden="true"
        style={{
          width: width === undefined ? "100%" : width,
          height: height || 14,
          borderRadius: radius === undefined ? G.r.xs : radius,
          background: withAlpha(c.ink, 0.08),
          animation: "tn-pulse 1200ms ease-in-out infinite",
          ...style,
        }}
      />
    );
  }

  window.UI = {
    ThemeProvider, useTheme, ThemeToggle,
    Button, Field, Input, Select, Search, Textarea, DaySegmented,
    Mark, Badge, StatusPill,
    Card, SectionHeader, BilingualLabel, Figure,
    Register, Ledger, Avatar, Seal, Icon, Spinner,
    MaskedValue, EmptyState, Skeleton,
    withAlpha,
  };
})();
