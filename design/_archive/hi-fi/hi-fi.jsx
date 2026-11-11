/* ============================================================
   Tenure — Hi-Fi Foundations board
   Brand · Palette · Type · Components · Signature ("The Register")
   ============================================================ */
(function () {
  const G = window.G;
  const { DesignCanvas, DCArtboard, DCRow } = window;

  /* ---------- reusable primitives ---------- */
  const Btn = ({ kind = "primary", children }) => {
    const base = { fontFamily: G.sans, fontSize: 13, fontWeight: 600, padding: "9px 16px",
      borderRadius: G.r.md, cursor: "pointer", border: "1px solid transparent", letterSpacing: ".01em" };
    const kinds = {
      primary: { background: G.pine, color: "#fff" },
      accent:  { background: G.marigold, color: "#3a2a06" },
      ghost:   { background: "#fff", color: G.pine, border: `1px solid ${G.lineStrong}` },
      quiet:   { background: "transparent", color: G.body, border: `1px solid transparent` },
      danger:  { background: "#fff", color: G.danger, border: `1px solid ${G.dangerSoft}` },
    };
    return <button data-noPan style={{ ...base, ...kinds[kind] }}>{children}</button>;
  };

  const Pill = ({ tone = "success", children }) => {
    const map = { success: [G.okSoft, G.success], warn: [G.warnSoft, G.marigoldDeep],
      danger: [G.dangerSoft, G.danger], info: [G.infoSoft, G.info], pine: [G.pineSoft, G.pine], mute: ["#EFF1EC", G.muted] };
    const [bg, fg] = map[tone];
    return <span style={{ background: bg, color: fg, fontFamily: G.mono, fontSize: 10.5, fontWeight: 600,
      padding: "3px 8px", borderRadius: G.r.pill, letterSpacing: ".04em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{children}</span>;
  };

  // Clean status = colored dot + text (no heavy pill), for ledger/table status columns.
  const Status = ({ tone = "success", children }) => {
    const c = { success: G.success, warn: G.marigoldDeep, danger: G.danger, info: G.info, pine: G.pine, mute: G.muted }[tone];
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: c, fontFamily: G.sans, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
        <span style={{ width: 7, height: 7, borderRadius: 2, background: c, flex: "0 0 auto" }} />{children}
      </span>
    );
  };

  /* ---------- icon set (inline SVG, Lucide/Feather-style, stroke-based) ---------- */
  const Icon = ({ name, size = 16, color = "currentColor", strokeWidth = 1.8 }) => {
    const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color,
      strokeWidth, strokeLinecap: "round", strokeLinejoin: "round" };
    const glyphs = {
      check: <polyline points="20 6 9 17 4 12" />,
      checkCircle: (<>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </>),
      clock: (<>
        <circle cx="12" cy="12" r="9" />
        <polyline points="12 7 12 12 15.5 14" />
      </>),
      alertTriangle: (<>
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </>),
      sun: (<>
        <circle cx="12" cy="12" r="4.2" />
        <line x1="12" y1="2" x2="12" y2="4.2" />
        <line x1="12" y1="19.8" x2="12" y2="22" />
        <line x1="2" y1="12" x2="4.2" y2="12" />
        <line x1="19.8" y1="12" x2="22" y2="12" />
        <line x1="4.6" y1="4.6" x2="6.1" y2="6.1" />
        <line x1="17.9" y1="17.9" x2="19.4" y2="19.4" />
        <line x1="4.6" y1="19.4" x2="6.1" y2="17.9" />
        <line x1="17.9" y1="6.1" x2="19.4" y2="4.6" />
      </>),
      calendar: (<>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </>),
      edit: <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />,
      arrowLeft: (<>
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
      </>),
      logIn: (<>
        <line x1="17" y1="7" x2="7" y2="17" />
        <polyline points="17 17 7 17 7 7" />
      </>),
      logOut: (<>
        <line x1="7" y1="17" x2="17" y2="7" />
        <polyline points="7 7 17 7 17 17" />
      </>),
      search: (<>
        <circle cx="11" cy="11" r="7.5" />
        <line x1="21" y1="21" x2="16.2" y2="16.2" />
      </>),
      chevronDown: <polyline points="6 9 12 15 18 9" />,
      moreHorizontal: (<>
        <circle cx="5" cy="12" r="1.3" />
        <circle cx="12" cy="12" r="1.3" />
        <circle cx="19" cy="12" r="1.3" />
      </>),
      lock: (<>
        <rect x="3.5" y="11" width="17" height="10" rx="2" />
        <path d="M7 11V7.5a5 5 0 0 1 10 0V11" />
      </>),
      bell: (<>
        <path d="M18 8.5a6 6 0 0 0-12 0c0 6.5-2.5 8.5-2.5 8.5h17s-2.5-2-2.5-8.5" />
        <path d="M13.7 20.5a2 2 0 0 1-3.4 0" />
      </>),
      user: (<>
        <path d="M4.5 20.5v-1.2a4.8 4.8 0 0 1 4.8-4.8h5.4a4.8 4.8 0 0 1 4.8 4.8v1.2" />
        <circle cx="12" cy="7.8" r="4" />
      </>),
      x: (<>
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </>),
      grid: (<>
        <rect x="3" y="3" width="7.5" height="7.5" rx="1.2" />
        <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.2" />
        <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.2" />
        <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.2" />
      </>),
      users: (<>
        <path d="M15.5 21v-1.8a3.8 3.8 0 0 0-3.8-3.8H5.8A3.8 3.8 0 0 0 2 19.2V21" />
        <circle cx="8.7" cy="8" r="3.6" />
        <path d="M21.5 21v-1.8a3.8 3.8 0 0 0-2.8-3.66" />
        <path d="M15.2 4.2a3.8 3.8 0 0 1 0 7.36" />
      </>),
      calendarDays: (<>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <line x1="8" y1="15" x2="8.01" y2="15" />
        <line x1="12" y1="15" x2="12.01" y2="15" />
        <line x1="16" y1="15" x2="16.01" y2="15" />
      </>),
      wallet: (<>
        <path d="M20 8V6.5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1.5" />
        <path d="M20 12h-4a2 2 0 0 0 0 4h4a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1z" />
      </>),
      userPlus: (<>
        <path d="M13.5 21v-1.8a3.8 3.8 0 0 0-3.8-3.8H4.8A3.8 3.8 0 0 0 1 19.2V21" />
        <circle cx="7.2" cy="7.8" r="3.6" />
        <line x1="19" y1="8" x2="19" y2="14" />
        <line x1="16" y1="11" x2="22" y2="11" />
      </>),
      fileText: (<>
        <path d="M13.5 2.5H7a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <polyline points="13.5 2.5 13.5 8 19 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </>),
      barChart: (<>
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </>),
      settings: (<>
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </>),
    };
    return <svg {...common}>{glyphs[name]}</svg>;
  };

  const Field = ({ label, value, ph }) => (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontFamily: G.sans, fontSize: 11, fontWeight: 600, color: G.muted, marginBottom: 5, letterSpacing: ".02em" }}>{label}</div>
      <div data-noPan style={{ fontFamily: G.sans, fontSize: 13, color: value ? G.ink : G.faint, background: "#fff",
        border: `1px solid ${G.lineStrong}`, borderRadius: G.r.md, padding: "9px 11px" }}>{value || ph}</div>
    </div>
  );

  /* ---------- logo mark ---------- */
  const Mark = ({ size = 44 }) => (
    <div style={{ width: size, height: size, borderRadius: size * 0.28, background: `linear-gradient(150deg, ${G.boardSoft}, ${G.boardDeep})`,
      display: "grid", placeItems: "center", position: "relative", boxShadow: G.sh.card, flex: "0 0 auto" }}>
      <span style={{ fontFamily: G.serif, fontWeight: 600, color: G.chalk, fontSize: size * 0.52, lineHeight: 1 }}>T</span>
      <div style={{ position: "absolute", bottom: size * 0.22, width: size * 0.44, height: size * 0.09,
        background: G.marigold, borderRadius: 2 }} />
    </div>
  );
  const Wordmark = ({ on = "light", size = 30 }) => (
    <div style={{ display: "inline-flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontFamily: G.serif, fontWeight: 600, fontSize: size, letterSpacing: "-.01em",
        color: on === "dark" ? G.chalk : G.ink, lineHeight: 1 }}>Naveya</span>
      <div style={{ height: 3, width: "100%", background: G.marigold, borderRadius: 2 }} />
    </div>
  );

  /* ---------- artboards ---------- */

  const AB_Brand = () => (
    <DCArtboard title="Brand" subtitle="wordmark · mark · lockup" w={520} bg={G.surface}>
      <div style={{ display: "flex", gap: 28, alignItems: "center", marginBottom: 22 }}>
        <Mark size={56} />
        <Wordmark size={34} />
      </div>
      <div style={{ fontFamily: G.serif, fontStyle: "italic", color: G.muted, fontSize: 15, marginBottom: 20 }}>
        HR &amp; payroll, built for schools.
      </div>
      <div style={{ background: `linear-gradient(150deg, ${G.boardSoft}, ${G.boardDeep})`, borderRadius: G.r.lg,
        padding: 22, display: "flex", alignItems: "center", gap: 18 }}>
        <Mark size={40} />
        <Wordmark on="dark" size={26} />
        <span style={{ marginLeft: "auto", fontFamily: G.mono, fontSize: 10.5, color: G.chalkFaint, letterSpacing: ".08em" }}>
          ON&nbsp;GREENBOARD
        </span>
      </div>
      <div style={{ marginTop: 14, fontFamily: G.mono, fontSize: 11, color: G.faint, lineHeight: 1.6 }}>
        The marigold rule = a signature line. You sign on → you're on the record → tenure.
      </div>
    </DCArtboard>
  );

  const Swatch = ({ c, name, hex }) => (
    <div style={{ width: 96 }}>
      <div style={{ height: 56, background: c, borderRadius: G.r.md, border: "1px solid rgba(0,0,0,.08)" }} />
      <div style={{ fontFamily: G.sans, fontSize: 11, fontWeight: 600, color: G.ink, marginTop: 6 }}>{name}</div>
      <div style={{ fontFamily: G.mono, fontSize: 10.5, color: G.faint }}>{hex}</div>
    </div>
  );
  const AB_Color = () => (
    <DCArtboard title="Color" subtitle="greenboard · chalk · marigold" w={640} bg={G.surface}>
      {[
        ["Brand — greenboard", [["board", G.board], ["pine", G.pine], ["boardSoft", G.boardSoft], ["pineSoft", G.pineSoft]]],
        ["Accent — marigold", [["marigold", G.marigold], ["marigoldDeep", G.marigoldDeep], ["marigoldSoft", G.marigoldSoft]]],
        ["Chalk-paper neutrals", [["canvas", G.canvas], ["surfaceAlt", G.surfaceAlt], ["line", G.line], ["ink", G.ink], ["muted", G.muted]]],
        ["Signals", [["success", G.success], ["warn", G.warn], ["danger", G.danger], ["info", G.info]]],
      ].map(([grp, items]) => (
        <div key={grp} style={{ marginBottom: 18 }}>
          <div style={{ fontFamily: G.mono, fontSize: 10.5, color: G.muted, letterSpacing: ".05em", textTransform: "uppercase", marginBottom: 10 }}>{grp}</div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            {items.map(([n, h]) => <Swatch key={n} c={h} name={n} hex={h} />)}
          </div>
        </div>
      ))}
    </DCArtboard>
  );

  const AB_Type = () => (
    <DCArtboard title="Typography" subtitle="IBM Plex — Serif · Sans · Mono" w={520} bg={G.surface}>
      <div style={{ borderBottom: `1px solid ${G.line}`, paddingBottom: 14, marginBottom: 14 }}>
        <div style={{ fontFamily: G.mono, fontSize: 10.5, color: G.faint, marginBottom: 6 }}>PLEX SERIF · display</div>
        <div style={{ fontFamily: G.serif, fontSize: 34, fontWeight: 600, color: G.ink, lineHeight: 1.1 }}>Payroll, done right.</div>
        <div style={{ fontFamily: G.serif, fontStyle: "italic", fontSize: 17, color: G.muted, marginTop: 4 }}>Section titles &amp; brand voice</div>
      </div>
      <div style={{ borderBottom: `1px solid ${G.line}`, paddingBottom: 14, marginBottom: 14 }}>
        <div style={{ fontFamily: G.mono, fontSize: 10.5, color: G.faint, marginBottom: 6 }}>PLEX SANS · interface</div>
        <div style={{ fontFamily: G.sans, fontSize: 15, color: G.body, lineHeight: 1.55 }}>
          The quick clarity of an interface built to be read. <b>Semibold for emphasis</b>, regular for body.
        </div>
      </div>
      <div>
        <div style={{ fontFamily: G.mono, fontSize: 10.5, color: G.faint, marginBottom: 6 }}>PLEX MONO · figures &amp; codes (tabular)</div>
        <div style={{ fontFamily: G.mono, fontSize: 15, color: G.ink, letterSpacing: ".01em" }}>
          ₹ 48,250.00&nbsp;&nbsp;·&nbsp;&nbsp;PF ECR&nbsp;&nbsp;·&nbsp;&nbsp;24Q&nbsp;&nbsp;·&nbsp;&nbsp;EMP-00417
        </div>
      </div>
      <div style={{ marginTop: 16, display: "flex", gap: 16, flexWrap: "wrap", alignItems: "baseline" }}>
        {[["40", G.fs.display], ["26", G.fs.h1], ["20", G.fs.h2], ["16", G.fs.h3], ["14", G.fs.base], ["12", G.fs.sm]].map(([l, s]) =>
          <span key={l} style={{ fontFamily: G.serif, fontWeight: 600, fontSize: s, color: G.ink }}>Aa<span style={{ fontFamily: G.mono, fontSize: 9, color: G.faint, verticalAlign: "super" }}>{l}</span></span>)}
      </div>
    </DCArtboard>
  );

  const KLabel = ({ children }) => (
    <div style={{ fontFamily: G.mono, fontSize: 10, color: G.muted, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 9 }}>{children}</div>
  );
  const AB_Components = () => {
    const Toggle = ({ on }) => (
      <div style={{ width: 34, height: 20, borderRadius: 999, background: on ? G.pine : G.lineStrong, position: "relative", transition: "all .2s" }}>
        <div style={{ position: "absolute", top: 2, left: on ? 16 : 2, width: 16, height: 16, borderRadius: 999, background: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,.2)" }} />
      </div>
    );
    const Segmented = ({ options, active }) => (
      <div style={{ display: "inline-flex", background: G.canvas, border: `1px solid ${G.line}`, borderRadius: G.r.md, padding: 2 }}>
        {options.map((o) => (
          <span key={o} style={{ fontFamily: G.sans, fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 7,
            color: o === active ? "#fff" : G.muted, background: o === active ? G.pine : "transparent" }}>{o}</span>
        ))}
      </div>
    );
    const Check = ({ on, children }) => (
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: G.sans, fontSize: 12.5, color: G.body }}>
        <span style={{ width: 16, height: 16, borderRadius: 4, background: on ? G.pine : "#fff", border: `1px solid ${on ? G.pine : G.lineStrong}`,
          display: "grid", placeItems: "center", color: "#fff", fontSize: 10 }}>{on && <Icon name="check" size={11} color="#fff" strokeWidth={3} />}</span>{children}
      </div>
    );
    const Radio = ({ on, children }) => (
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: G.sans, fontSize: 12.5, color: G.body }}>
        <span style={{ width: 15, height: 15, borderRadius: 999, border: `1px solid ${on ? G.pine : G.lineStrong}`, display: "grid", placeItems: "center" }}>
          {on && <span style={{ width: 8, height: 8, borderRadius: 999, background: G.pine }} />}</span>{children}
      </div>
    );
    const Select = ({ label, value }) => (
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontFamily: G.sans, fontSize: 11, fontWeight: 600, color: G.muted, marginBottom: 5 }}>{label}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff", border: `1px solid ${G.lineStrong}`,
          borderRadius: G.r.md, padding: "9px 11px", fontFamily: G.sans, fontSize: 13, color: G.ink }}>{value}<Icon name="chevronDown" size={14} color={G.faint} /></div>
      </div>
    );
    const Search = () => (
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", border: `1px solid ${G.lineStrong}`,
        borderRadius: G.r.md, padding: "9px 11px", color: G.faint }}>
        <Icon name="search" size={14} color={G.faint} /><span style={{ fontFamily: G.sans, fontSize: 13 }}>Search staff, PAN, code…</span>
      </div>
    );
    const Meter = ({ pct, label, sub }) => (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: G.sans, fontSize: 11.5, color: G.muted, marginBottom: 5 }}>
          <span>{label}</span><span style={{ fontFamily: G.mono, color: G.ink, fontWeight: 600 }}>{sub}</span></div>
        <div style={{ height: 7, background: G.canvas, borderRadius: 999, border: `1px solid ${G.line}`, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct}%`, background: `linear-gradient(90deg, ${G.pine}, ${G.success})` }} />
        </div>
      </div>
    );
    return (
      <DCArtboard title="Components" subtitle="the working kit" w={640} bg={G.surface}>
        <KLabel>Buttons</KLabel>
        <div style={{ display: "flex", gap: 9, flexWrap: "wrap", marginBottom: 18, alignItems: "center" }}>
          <Btn kind="primary">Run payroll</Btn><Btn kind="accent">Verify</Btn><Btn kind="ghost">Add staff</Btn>
          <Btn kind="quiet">Cancel</Btn><Btn kind="danger">Reject</Btn>
        </div>

        <div style={{ display: "flex", gap: 24, marginBottom: 18 }}>
          <div style={{ flex: 1 }}>
            <KLabel>Inputs</KLabel>
            <Field label="Employee name" value="Ananya Menon" />
            <Select label="Pay group" value="Self-financed · CTC" />
            <Search />
          </div>
          <div style={{ flex: 1 }}>
            <KLabel>Controls</KLabel>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <Toggle on /><span style={{ fontFamily: G.sans, fontSize: 12.5, color: G.body }}>24-hour format</span>
            </div>
            <div style={{ marginBottom: 12 }}><Segmented options={["Day", "Week", "Month"]} active="Week" /></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              <Check on>Vacation staff (EL in lieu)</Check>
              <Radio on>Old tax regime</Radio>
              <Radio>New tax regime</Radio>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 24 }}>
          <div style={{ flex: 1 }}>
            <KLabel>Pills &amp; tags</KLabel>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 10 }}>
              <Pill tone="success">Paid</Pill><Pill tone="pine">Verified</Pill><Pill tone="warn">Pending</Pill>
              <Pill tone="danger">Rejected</Pill><Pill tone="info">On leave</Pill><Pill tone="mute">Draft</Pill>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: G.sans, fontSize: 12, color: G.body }}>
                Approvals <span style={{ fontFamily: G.mono, fontSize: 10.5, fontWeight: 700, color: "#fff", background: G.danger, borderRadius: 999, padding: "1px 7px" }}>6</span>
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: G.mono, fontSize: 10.5, color: G.muted, background: G.pineSoft, borderRadius: G.r.pill, padding: "3px 9px" }}>
                <span style={{ width: 6, height: 6, borderRadius: 6, background: G.pine }} />PGT · Physics
              </span>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <KLabel>Feedback</KLabel>
            <div style={{ background: G.marigoldSoft, borderLeft: `3px solid ${G.marigold}`, borderRadius: "0 6px 6px 0", padding: "9px 12px", marginBottom: 12,
              fontFamily: G.sans, fontSize: 12, color: "#7a5209" }}>6 documents awaiting your verification.</div>
            <Meter pct={101} label="Effective vs required" sub="8h 35m / 8h 30m" />
          </div>
        </div>
      </DCArtboard>
    );
  };

  /* ===================== Signature — The Muster ===================== */
  /* The real Indian muster roll: staff × days grid with P/A/L/H marks, red
     margin rule, ruled rows — resolving rightward into Present → Net pay → Status.
     One artifact showing Tenure's thesis: the attendance register computes payroll. */
  const initials = (n) => n.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  const DAYS = 24;
  const WKND = new Set([6, 7, 13, 14, 20, 21]);
  const HOLI = new Set([17]); // festival holiday
  const DAYLIST = Array.from({ length: DAYS }, (_, i) => i + 1);

  const MARK_COLOR = { P: G.success, A: G.danger, L: G.marigoldDeep, "½": G.info, H: G.faint, "·": "#c7ccc2" };
  const CELL_W = 23;
  const NAME_W = 214, PRES_W = 58, PAY_W = 116, STAT_W = 92;

  const MARGIN = "rgba(176,67,47,.45)"; // the red register margin rule

  const dayMark = (ex, d) => (HOLI.has(d) ? "H" : WKND.has(d) ? "·" : (ex[d] || "P"));
  const presentOf = (ex) => {
    const work = DAYLIST.filter((d) => !WKND.has(d) && !HOLI.has(d));
    let p = 0;
    work.forEach((d) => { const m = ex[d] || "P"; if (m === "P") p += 1; else if (m === "½") p += 0.5; });
    return { p, total: work.length };
  };

  const DayHeader = () => (
    <div style={{ display: "flex" }}>
      {DAYLIST.map((d) => (
        <div key={d} style={{ width: CELL_W, textAlign: "center", fontFamily: G.mono, fontSize: 9,
          color: HOLI.has(d) ? G.marigoldDeep : WKND.has(d) ? G.chalkFaint : G.chalkMuted,
          borderLeft: d === 1 ? `2px solid ${MARGIN}` : "none" }}>
          {String(d).padStart(2, "0")}
        </div>
      ))}
    </div>
  );

  const MusterRow = ({ r, last }) => {
    const { p, total } = presentOf(r.ex);
    return (
      <div style={{ display: "flex", alignItems: "stretch", borderBottom: last ? "none" : `1px solid ${G.line}`, background: G.surface }}>
        {/* name block */}
        <div style={{ width: NAME_W, flex: `0 0 ${NAME_W}px`, display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", position: "relative" }}>
          <div style={{ position: "absolute", left: 0, top: 6, bottom: 6, width: 3, background: r.spine, borderRadius: "0 2px 2px 0" }} />
          <div style={{ width: 26, height: 26, borderRadius: 7, flex: "0 0 auto", background: r.spine + "1f",
            color: r.spine, border: `1px solid ${r.spine}33`, display: "grid", placeItems: "center", fontFamily: G.sans, fontWeight: 700, fontSize: 10.5 }}>
            {initials(r.name)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: G.sans, fontSize: 12.5, fontWeight: 600, color: G.ink, whiteSpace: "nowrap" }}>{r.name}</div>
            <div style={{ fontFamily: G.mono, fontSize: 9.5, color: G.faint }}>{r.code} · {r.tag}</div>
          </div>
        </div>
        {/* day grid */}
        <div style={{ display: "flex", alignItems: "center" }}>
          {DAYLIST.map((d) => {
            const m = dayMark(r.ex, d);
            const shaded = WKND.has(d) || HOLI.has(d);
            return (
              <div key={d} style={{ width: CELL_W, height: 40, display: "grid", placeItems: "center",
                borderLeft: d === 1 ? `2px solid ${MARGIN}` : `1px solid ${G.surfaceAlt}`,
                background: HOLI.has(d) ? G.marigoldSoft : WKND.has(d) ? "#eceee8" : "transparent" }}>
                <span style={{ fontFamily: G.mono, fontSize: m === "·" ? 13 : 11, fontWeight: 600, color: MARK_COLOR[m], lineHeight: 1 }}>{m}</span>
              </div>
            );
          })}
        </div>
        {/* present */}
        <div style={{ width: PRES_W, flex: `0 0 ${PRES_W}px`, display: "grid", placeItems: "center", borderLeft: `1px solid ${G.line}` }}>
          <div style={{ fontFamily: G.mono, fontSize: 14, fontWeight: 700, color: G.ink }}>{p % 1 ? p.toFixed(1) : p}
            <span style={{ fontSize: 9.5, color: G.faint, fontWeight: 400 }}>/{total}</span></div>
        </div>
        {/* net pay */}
        <div style={{ width: PAY_W, flex: `0 0 ${PAY_W}px`, display: "flex", alignItems: "center", justifyContent: "flex-end",
          paddingRight: 12, fontFamily: G.mono, fontSize: 14, fontWeight: 600, color: G.ink, borderLeft: `1px solid ${G.line}` }}>
          <span style={{ fontSize: 10, color: G.muted, marginRight: 2 }}>₹</span>{r.pay}
        </div>
        {/* status */}
        <div style={{ width: STAT_W, flex: `0 0 ${STAT_W}px`, display: "grid", placeItems: "center", borderLeft: `1px solid ${G.line}` }}>
          <Status tone={r.tone}>{r.status}</Status>
        </div>
      </div>
    );
  };

  const MUSTER = [
    { spine: G.pine,     code: "EMP-00417", name: "Ananya Menon", tag: "PGT · vacation", ex: { 3: "L", 4: "L", 11: "½" }, pay: "68,240", status: "Paid", tone: "success" },
    { spine: G.marigold, code: "EMP-00631", name: "Rahul Iyer",   tag: "Guest · Maths",  ex: { 2: "A", 9: "A", 16: "A", 23: "A" }, pay: "33,000", status: "Honorarium", tone: "warn" },
    { spine: G.info,     code: "EMP-00288", name: "Sana Qureshi",  tag: "Admin · 12-mo",  ex: { 18: "L" }, pay: "41,900", status: "Paid", tone: "success" },
    { spine: G.danger,   code: "EMP-00905", name: "Devlin Roy",    tag: "Transport",      ex: { 22: "½" }, pay: "22,500", status: "Verify", tone: "danger" },
  ];

  const LegendItem = ({ m, label }) => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
      <span style={{ fontFamily: G.mono, fontSize: 11, fontWeight: 700, color: MARK_COLOR[m] }}>{m}</span>
      <span style={{ fontFamily: G.sans, fontSize: 10.5, color: G.muted }}>{label}</span>
    </span>
  );

  const AB_Muster = () => (
    <DCArtboard title="Signature — The Muster" subtitle="attendance register → payroll · one artifact" w={1224} bg={G.canvas} pad={20}>
      {/* schematic ledger strip (tax-report, not KPI cards) */}
      <div style={{ display: "flex", alignItems: "stretch", border: `1px solid ${G.lineStrong}`, borderRadius: G.r.md,
        background: G.surface, marginBottom: 16, overflow: "hidden" }}>
        {[
          ["MUSTER ROLL", "July 2026 · Sunrise Group", G.ink],
          ["NET PAYROLL", "₹ 42,61,540", G.ink],
          ["STATUTORY", "₹ 7,18,900 · filed", G.success],
          ["STAFF", "214 · 3 pay groups", G.ink],
          ["DOCS TO VERIFY", "06 pending →", G.marigoldDeep],
        ].map(([k, v, c], i) => (
          <div key={k} style={{ flex: 1, padding: "10px 14px", borderLeft: i ? `1px solid ${G.line}` : "none" }}>
            <div style={{ fontFamily: G.mono, fontSize: 9.5, letterSpacing: ".08em", color: G.faint, textTransform: "uppercase" }}>{k}</div>
            <div style={{ fontFamily: i === 0 ? G.serif : G.mono, fontSize: i === 0 ? 14 : 14.5, fontWeight: i === 0 ? 600 : 600, color: c, marginTop: 3 }}>{v}</div>
          </div>
        ))}
      </div>

      {/* the muster grid */}
      <div style={{ border: `1px solid ${G.lineStrong}`, borderRadius: G.r.lg, overflow: "hidden", boxShadow: G.sh.card, background: G.surface }}>
        {/* greenboard header: labels + day numbers */}
        <div style={{ display: "flex", alignItems: "center", background: `linear-gradient(90deg, ${G.board}, ${G.boardSoft})`, padding: "8px 0" }}>
          <div style={{ width: NAME_W, flex: `0 0 ${NAME_W}px`, padding: "0 12px", fontFamily: G.mono, fontSize: 10, letterSpacing: ".1em", color: G.chalkMuted, textTransform: "uppercase" }}>Staff</div>
          <DayHeader />
          <div style={{ width: PRES_W, flex: `0 0 ${PRES_W}px`, textAlign: "center", fontFamily: G.mono, fontSize: 9.5, letterSpacing: ".06em", color: G.chalkMuted, textTransform: "uppercase" }}>Pres</div>
          <div style={{ width: PAY_W, flex: `0 0 ${PAY_W}px`, textAlign: "right", paddingRight: 12, fontFamily: G.mono, fontSize: 10, letterSpacing: ".08em", color: G.chalkMuted, textTransform: "uppercase" }}>Net pay</div>
          <div style={{ width: STAT_W, flex: `0 0 ${STAT_W}px`, textAlign: "center", fontFamily: G.mono, fontSize: 10, letterSpacing: ".06em", color: G.chalkMuted, textTransform: "uppercase" }}>Status</div>
        </div>
        {MUSTER.map((r, i) => <MusterRow key={r.code} r={r} last={i === MUSTER.length - 1} />)}
        {/* totals footer */}
        <div style={{ display: "flex", alignItems: "center", background: G.pineSoft, borderTop: `1px solid ${G.lineStrong}` }}>
          <div style={{ width: NAME_W, flex: `0 0 ${NAME_W}px`, padding: "11px 12px", fontFamily: G.sans, fontSize: 12, fontWeight: 700, color: G.pine, letterSpacing: ".03em" }}>TOTAL · 214 STAFF</div>
          <div style={{ flex: "1 1 auto" }} />
          <div style={{ width: PAY_W, flex: `0 0 ${PAY_W}px`, textAlign: "right", paddingRight: 12, fontFamily: G.mono, fontSize: 14, fontWeight: 700, color: G.ink }}>
            <span style={{ fontSize: 10, color: G.muted, marginRight: 2 }}>₹</span>42,61,540
          </div>
          <div style={{ width: STAT_W, flex: `0 0 ${STAT_W}px` }} />
        </div>
      </div>

      {/* legend */}
      <div style={{ display: "flex", gap: 18, marginTop: 12, alignItems: "center", flexWrap: "wrap" }}>
        <LegendItem m="P" label="present" /><LegendItem m="A" label="absent" />
        <LegendItem m="L" label="leave" /><LegendItem m="½" label="half day" />
        <LegendItem m="H" label="holiday" />
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 12, height: 12, background: "#eceee8", border: `1px solid ${G.line}` }} />
          <span style={{ fontFamily: G.sans, fontSize: 10.5, color: G.muted }}>weekend</span>
        </span>
        <span style={{ marginLeft: "auto", fontFamily: G.mono, fontSize: 10, color: G.faint }}>
          <span style={{ color: MARGIN, fontWeight: 700 }}>│</span> red margin = the register rule
        </span>
      </div>
    </DCArtboard>
  );

  /* ===================== Day Timecard (biometric daily hours) ===================== */
  /* A single day resolved from biometric punches → a timeline bar with in/out/break
     segments, then Effective / Gross / Break / OT, then the pay impact.
     Beats Keka by tying hours → pay and showing device provenance. */
  const TC_START = 540, TC_END = 1110; // 09:00 → 18:30 (minutes)
  const tcPc = (m) => ((m - TC_START) / (TC_END - TC_START)) * 100;
  const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  const WORKED = [[542, 790], [848, 1108]]; // two worked blocks
  const BREAKS = [[790, 848]];              // lunch
  const PUNCHES = [[542, "in"], [790, "out"], [848, "in"], [1108, "out"]];

  const TCStat = ({ label, value, tone, strong }) => (
    <div style={{ flex: 1, padding: "10px 14px", borderLeft: `1px solid ${G.line}` }}>
      <div style={{ fontFamily: G.mono, fontSize: 9.5, letterSpacing: ".07em", color: G.faint, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontFamily: G.mono, fontSize: 18, fontWeight: 700, color: tone || G.ink, marginTop: 4, letterSpacing: "-.01em" }}>{value}</div>
      {strong && <div style={{ fontFamily: G.sans, fontSize: 10, color: tone, marginTop: 1 }}>{strong}</div>}
    </div>
  );
  const PunchChip = ({ m, dir }) => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: G.mono, fontSize: 12, color: G.ink,
      background: G.surfaceAlt, border: `1px solid ${G.line}`, borderRadius: G.r.pill, padding: "4px 10px" }}>
      <span style={{ width: 6, height: 6, borderRadius: 6, background: dir === "in" ? G.success : G.danger }} />
      {dir.toUpperCase()} {hhmm(m)}
    </span>
  );

  const AB_Timecard = () => (
    <DCArtboard title="Day Timecard" subtitle="biometric daily hours · a different view" w={780} bg={G.surface}>
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: G.serif, fontSize: 18, fontWeight: 600, color: G.ink }}>Wed, 15 July 2026</div>
          <div style={{ fontFamily: G.mono, fontSize: 11, color: G.muted, marginTop: 2 }}>General shift · 09:00–18:30</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          <Pill tone="success">On time</Pill>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: G.mono, fontSize: 10.5, color: G.muted,
            background: G.pineSoft, borderRadius: G.r.pill, padding: "4px 10px" }}>
            <span style={{ width: 6, height: 6, borderRadius: 2, background: G.pine }} />Gate-2 · eSSL biometric
          </span>
        </div>
      </div>

      {/* timeline */}
      <div style={{ position: "relative", height: 58, marginBottom: 6 }}>
        {/* shift track */}
        <div style={{ position: "absolute", top: 16, left: 0, right: 0, height: 26, background: "#eef0ea", borderRadius: 6, border: `1px solid ${G.line}` }} />
        {/* worked blocks */}
        {WORKED.map(([a, b], i) => (
          <div key={i} style={{ position: "absolute", top: 16, height: 26, left: `${tcPc(a)}%`, width: `${tcPc(b) - tcPc(a)}%`,
            background: `linear-gradient(180deg, ${G.pine}, ${G.pineHover})`, borderRadius: 5 }} />
        ))}
        {/* break */}
        {BREAKS.map(([a, b], i) => (
          <div key={i} style={{ position: "absolute", top: 16, height: 26, left: `${tcPc(a)}%`, width: `${tcPc(b) - tcPc(a)}%`,
            background: "repeating-linear-gradient(45deg, #fbe9cc, #fbe9cc 5px, #fdf3e1 5px, #fdf3e1 10px)", borderRadius: 3, border: `1px solid ${G.marigoldSoft}` }} />
        ))}
        {/* punches */}
        {PUNCHES.map(([m, dir], i) => (
          <div key={i} style={{ position: "absolute", top: 10, left: `${tcPc(m)}%`, transform: "translateX(-50%)", textAlign: "center" }}>
            <div style={{ width: 2, height: 38, background: dir === "in" ? G.success : G.danger, margin: "0 auto" }} />
            <div style={{ fontFamily: G.mono, fontSize: 9, color: G.muted, marginTop: 2 }}>{hhmm(m)}</div>
          </div>
        ))}
      </div>
      {/* hour axis */}
      <div style={{ position: "relative", height: 14, marginBottom: 14 }}>
        {[9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map((h) => (
          <span key={h} style={{ position: "absolute", left: `${tcPc(h * 60)}%`, transform: "translateX(-50%)",
            fontFamily: G.mono, fontSize: 9, color: G.faint }}>{h}</span>
        ))}
      </div>

      {/* stat cluster */}
      <div style={{ display: "flex", border: `1px solid ${G.line}`, borderRadius: G.r.md, overflow: "hidden", marginBottom: 14 }}>
        <div style={{ flex: 1, padding: "10px 14px" }}>
          <div style={{ fontFamily: G.mono, fontSize: 9.5, letterSpacing: ".07em", color: G.faint, textTransform: "uppercase" }}>Effective</div>
          <div style={{ fontFamily: G.mono, fontSize: 18, fontWeight: 700, color: G.ink, marginTop: 4 }}>8h 35m</div>
          <div style={{ fontFamily: G.sans, fontSize: 10, color: G.success, marginTop: 1 }}>+5m over required</div>
        </div>
        <TCStat label="Gross" value="9h 33m" />
        <TCStat label="Break" value="58m" />
        <TCStat label="Overtime" value="0h 00m" />
        <TCStat label="Pay impact" value="1.0 day" tone={G.pine} strong="full-day present" />
      </div>

      {/* punches + note */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {PUNCHES.map(([m, dir], i) => <PunchChip key={i} m={m} dir={dir} />)}
        <span style={{ marginLeft: "auto", fontFamily: G.mono, fontSize: 10.5, color: G.muted }}>→ feeds payroll · paid-day = 1.0</span>
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 12, fontFamily: G.sans, fontSize: 10.5, color: G.muted }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 12, height: 10, background: G.pine, borderRadius: 2 }} />worked</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 12, height: 10, borderRadius: 2, background: "repeating-linear-gradient(45deg,#fbe9cc,#fbe9cc 3px,#fdf3e1 3px,#fdf3e1 6px)", border: `1px solid ${G.marigoldSoft}` }} />break</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 12, height: 10, background: "#eef0ea", border: `1px solid ${G.line}`, borderRadius: 2 }} />shift window</span>
        <span style={{ fontFamily: G.serif, fontStyle: "italic", color: G.faint }}>Phase 2: period-wise teaching hours on the same bar.</span>
      </div>
    </DCArtboard>
  );

  /* ===================== My Attendance (employee self-view · Keka-style log) ===================== */
  const MiniTimeline = ({ worked = [], breaks = [], punches = [], open }) => (
    <div style={{ position: "relative", width: 200, height: 16 }}>
      <div style={{ position: "absolute", top: 3, left: 0, right: 0, height: 10, background: "#eef0ea", borderRadius: 3, border: `1px solid ${G.line}` }} />
      {worked.map(([a, b], i) => (
        <div key={i} style={{ position: "absolute", top: 3, height: 10, left: `${tcPc(a)}%`, width: `${tcPc(b) - tcPc(a)}%`, background: G.pine, borderRadius: 2 }} />
      ))}
      {breaks.map(([a, b], i) => (
        <div key={i} style={{ position: "absolute", top: 3, height: 10, left: `${tcPc(a)}%`, width: `${tcPc(b) - tcPc(a)}%`,
          background: "repeating-linear-gradient(45deg,#fbe9cc,#fbe9cc 3px,#fdf3e1 3px,#fdf3e1 6px)" }} />
      ))}
      {open && <div style={{ position: "absolute", top: 3, height: 10, left: `${tcPc(open[0])}%`, width: `${tcPc(open[1]) - tcPc(open[0])}%`,
        border: `1px dashed ${G.danger}`, borderRadius: 2, background: G.dangerSoft }} />}
      {punches.map(([m, dir], i) => (
        <div key={i} style={{ position: "absolute", top: 0, left: `${tcPc(m)}%`, width: 1.5, height: 16, background: dir === "in" ? G.success : G.danger, transform: "translateX(-50%)" }} />
      ))}
    </div>
  );

  const MC = { date: 150, day: 250, eff: 80, brk: 56, gross: 80, arr: 168 };
  const MyHCell = ({ children, w, center, right }) => (
    <div style={{ flex: `0 0 ${w}px`, textAlign: center ? "center" : right ? "right" : "left",
      fontFamily: G.mono, fontSize: 9.5, letterSpacing: ".07em", textTransform: "uppercase", color: G.muted }}>{children}</div>
  );
  const num = (v) => <span style={{ fontFamily: G.mono, fontSize: 12.5, color: v === "—" ? G.faint : G.ink, fontWeight: v === "—" ? 400 : 500 }}>{v}</span>;

  // Arrival indicator — a small glyph + colored text (clean, single-line), not a heavy pill.
  const Arrival = ({ kind, text }) => {
    const M = {
      ontime:  { icon: "checkCircle",   c: G.success },
      late:    { icon: "clock",         c: G.marigoldDeep },
      missing: { icon: "alertTriangle", c: G.danger },
      offday:  { icon: "sun",           c: G.info },
    }[kind];
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 7, color: M.c,
        fontFamily: G.sans, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>
        <Icon name={M.icon} size={14} color={M.c} />{text}
      </span>
    );
  };

  const MYDAYS = [
    { date: "Wed, 15 Jul", worked: [[542, 790], [848, 1108]], breaks: [[790, 848]], punches: [[542, "in"], [790, "out"], [848, "in"], [1108, "out"]], eff: "8h 35m", brk: "58m", gross: "9h 33m", kind: "ontime", arr: "On time" },
    { date: "Tue, 14 Jul", worked: [[587, 792], [850, 1112]], breaks: [[792, 850]], punches: [[587, "in"], [792, "out"], [850, "in"], [1112, "out"]], eff: "8h 07m", brk: "58m", gross: "9h 05m", kind: "late", arr: "Late 47m" },
    { date: "Mon, 13 Jul", open: [570, 1110], punches: [[570, "in"]], eff: "—", brk: "—", gross: "—", kind: "missing", arr: "Missing swipe", action: "Regularize", active: true },
    { date: "Sun, 12 Jul", off: "Weekly off" },
    { date: "Sat, 11 Jul", woff: true, worked: [[600, 900]], breaks: [], punches: [[600, "in"], [900, "out"]], eff: "5h 00m", brk: "0m", gross: "5h 00m", kind: "offday", arr: "Worked on off" },
    { date: "Fri, 10 Jul", leave: "Casual leave · CL" },
    { date: "Thu, 09 Jul", worked: [[545, 788], [845, 1095]], breaks: [[788, 845]], punches: [[545, "in"], [788, "out"], [845, "in"], [1095, "out"]], eff: "8h 18m", brk: "57m", gross: "9h 10m", kind: "ontime", arr: "On time" },
  ];

  const MyRow = ({ d, last }) => {
    const bb = last ? "none" : `1px solid ${G.line}`;
    const DateCell = (
      <div style={{ flex: `0 0 ${MC.date}px`, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontFamily: G.sans, fontSize: 12.5, fontWeight: 600, color: G.ink }}>{d.date}</span>
        {d.woff && <Pill tone="mute">W-OFF</Pill>}
      </div>
    );
    if (d.off) return (
      <div style={{ display: "flex", alignItems: "center", padding: "11px 16px", borderBottom: bb, background: G.surfaceAlt }}>
        {DateCell}<div style={{ flex: "1 1 auto", fontFamily: G.sans, fontSize: 12, color: G.muted }}>Weekly off</div>
        <Pill tone="mute">W-OFF</Pill></div>
    );
    if (d.leave) return (
      <div style={{ display: "flex", alignItems: "center", padding: "11px 16px", borderBottom: bb, background: G.infoSoft + "55" }}>
        {DateCell}<div style={{ flex: "1 1 auto" }} /><Pill tone="info">{d.leave}</Pill><div style={{ flex: `0 0 ${MC.arr + 20}px` }} /></div>
    );
    return (
      <div style={{ display: "flex", alignItems: "center", padding: "11px 16px", borderBottom: bb,
        background: d.active ? G.pineSoft + "80" : G.surface }}>
        {DateCell}
        <div style={{ flex: `0 0 ${MC.day}px` }}><MiniTimeline worked={d.worked} breaks={d.breaks} punches={d.punches} open={d.open} /></div>
        <div style={{ flex: `0 0 ${MC.eff}px` }}>{num(d.eff)}</div>
        <div style={{ flex: `0 0 ${MC.brk}px` }}>{num(d.brk)}</div>
        <div style={{ flex: `0 0 ${MC.gross}px` }}>{num(d.gross)}</div>
        <div style={{ flex: `0 0 ${MC.arr}px`, display: "flex", alignItems: "center" }}>
          <Arrival kind={d.kind} text={d.arr} />
        </div>
        <div style={{ flex: "0 0 20px", textAlign: "right" }}><Icon name="moreHorizontal" size={15} color={d.active ? G.pine : G.faint} /></div>
      </div>
    );
  };

  // Reusable full-size view: shared by the design-canvas artboard AND the employee shell (no duplication).
  const MyAttendanceView = () => (
    <div style={{ width: "100%" }}>
      {/* week summary + controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ fontFamily: G.serif, fontSize: 17, fontWeight: 600, color: G.ink }}>July 2026</div>
        <div style={{ display: "flex", gap: 18, fontFamily: G.mono, fontSize: 11, color: G.muted }}>
          <span>avg <b style={{ color: G.ink }}>8h 20m</b>/day</span>
          <span>on-time <b style={{ color: G.success }}>67%</b></span>
          <span><b style={{ color: G.danger }}>1</b> missing swipe</span>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "inline-flex", background: G.canvas, border: `1px solid ${G.line}`, borderRadius: G.r.md, padding: 2 }}>
            {["Jul", "Jun", "May"].map((m) => (
              <span key={m} style={{ fontFamily: G.sans, fontSize: 11.5, fontWeight: 600, padding: "4px 11px", borderRadius: 6,
                color: m === "Jul" ? "#fff" : G.muted, background: m === "Jul" ? G.pine : "transparent" }}>{m}</span>
            ))}
          </div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontFamily: G.sans, fontSize: 11.5, color: G.muted }}>
            <span style={{ width: 30, height: 18, borderRadius: 999, background: G.lineStrong, position: "relative" }}>
              <span style={{ position: "absolute", top: 2, left: 2, width: 14, height: 14, borderRadius: 999, background: "#fff" }} /></span>24h
          </span>
        </div>
      </div>
      {/* table on the left; action popover floats in the right gutter so no row glyph is occluded */}
      <div style={{ position: "relative" }}>
        <div style={{ width: 838, border: `1px solid ${G.line}`, borderRadius: G.r.lg, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", padding: "9px 16px", background: G.surfaceAlt, borderBottom: `1px solid ${G.lineStrong}` }}>
            <MyHCell w={MC.date}>Date</MyHCell><MyHCell w={MC.day}>Day · 09–18</MyHCell>
            <MyHCell w={MC.eff}>Effective</MyHCell><MyHCell w={MC.brk}>Break</MyHCell><MyHCell w={MC.gross}>Gross</MyHCell>
            <MyHCell w={MC.arr}>Arrival</MyHCell><div style={{ flex: "0 0 20px" }} />
          </div>
          {MYDAYS.map((d, i) => <MyRow key={d.date} d={d} last={i === MYDAYS.length - 1} />)}
        </div>
        {/* action popover in the gutter, tied to the missing-swipe day (Mon 13 Jul) */}
        <div style={{ position: "absolute", left: 872, top: 92, width: 300 }}>
          <div style={{ position: "absolute", left: -8, top: 46, width: 0, height: 0, borderTop: "8px solid transparent", borderBottom: "8px solid transparent", borderRight: `8px solid ${G.lineStrong}` }} />
          <div style={{ position: "absolute", left: -6.5, top: 46, width: 0, height: 0, borderTop: "8px solid transparent", borderBottom: "8px solid transparent", borderRight: "8px solid #fff" }} />
          <div style={{ background: "#fff", border: `1px solid ${G.lineStrong}`, borderRadius: G.r.lg, boxShadow: G.sh.raised, padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: G.mono, fontSize: 9, letterSpacing: ".08em", color: G.faint, textTransform: "uppercase", marginBottom: 8 }}>
              <Icon name="moreHorizontal" size={12} color={G.faint} />actions · Mon 13 Jul
            </div>
            <div style={{ fontFamily: G.sans, fontSize: 12.5, fontWeight: 700, color: G.ink }}>General shift <span style={{ color: G.faint, fontWeight: 400 }}>· 13 Jul</span></div>
            <div style={{ fontFamily: G.mono, fontSize: 11, color: G.muted, marginTop: 2 }}>09:00 – 18:30</div>
            <div style={{ height: 1, background: G.line, margin: "11px 0" }} />
            {["Regularize", "Apply partial day"].map((t) => (
              <div key={t} data-noPan style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: G.sans, fontSize: 12.5, fontWeight: 600, color: G.pine, padding: "5px 0", cursor: "pointer" }}>
                <Icon name="edit" size={13} color={G.pine} />{t}
              </div>
            ))}
            <div style={{ height: 1, background: G.line, margin: "11px 0" }} />
            <div style={{ fontFamily: G.mono, fontSize: 9.5, letterSpacing: ".07em", color: G.faint, textTransform: "uppercase", marginBottom: 7 }}>Day logs</div>
            <div style={{ display: "flex", gap: 16, fontFamily: G.mono, fontSize: 12 }}>
              <span style={{ color: G.ink, display: "inline-flex", alignItems: "center", gap: 5 }}>
                <span style={{ color: G.success, display: "inline-flex", alignItems: "center", gap: 4 }}><Icon name="logIn" size={12} color={G.success} />IN</span> 09:47
              </span>
              <span style={{ color: G.ink, display: "inline-flex", alignItems: "center", gap: 5 }}>
                <span style={{ color: G.danger, display: "inline-flex", alignItems: "center", gap: 4 }}><Icon name="logOut" size={12} color={G.danger} />OUT</span> <span style={{ color: G.danger, fontWeight: 600 }}>MISSING</span>
              </span>
            </div>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 10, fontFamily: G.sans, fontSize: 10.5, color: G.muted, alignItems: "center" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 12, height: 8, background: G.pine, borderRadius: 2 }} />worked</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 12, height: 8, borderRadius: 2, background: "repeating-linear-gradient(45deg,#fbe9cc,#fbe9cc 3px,#fdf3e1 3px,#fdf3e1 6px)" }} />break</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 8, border: `1px dashed ${G.danger}`, borderRadius: 2 }} />missing punch</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><Icon name="clock" size={12} color={G.marigoldDeep} />late · <Icon name="sun" size={12} color={G.info} />worked-off</span>
        <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 5, fontFamily: G.mono, color: G.faint }}>tick: green IN · red OUT · <Icon name="moreHorizontal" size={11} color={G.faint} />opens actions</span>
      </div>
    </div>
  );

  const AB_MyAttendance = () => (
    <DCArtboard title="My Attendance" subtitle="employee self-view · a day expands to the Timecard" w={1224} bg={G.surface}>
      <MyAttendanceView />
    </DCArtboard>
  );

  /* ===================== Auth — phone-first Login → OTP ===================== */
  const StatusBar = ({ light }) => {
    const c = light ? G.chalk : G.ink;
    return (
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 34, display: "flex", alignItems: "center",
        justifyContent: "space-between", padding: "0 20px", zIndex: 5, color: c, fontFamily: G.sans, fontSize: 12, fontWeight: 700 }}>
        <span>9:41</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
          <span style={{ fontSize: 9, fontWeight: 700 }}>5G</span>
          <span style={{ width: 18, height: 10, border: `1.4px solid ${c}`, borderRadius: 3, display: "inline-block", position: "relative", opacity: .9 }}>
            <span style={{ position: "absolute", inset: 1.5, right: 5, background: c, borderRadius: 1 }} />
          </span>
        </span>
      </div>
    );
  };
  const Phone = ({ children }) => (
    <div style={{ width: 316, borderRadius: 40, background: "linear-gradient(160deg,#3a3a3a,#0f0f0f)", padding: 9, boxShadow: G.sh.board }}>
      <div style={{ borderRadius: 32, overflow: "hidden", background: G.surface, position: "relative", height: 648 }}>{children}</div>
    </div>
  );

  const LoginScreen = () => (
    <>
      <StatusBar light />
      {/* greenboard hero */}
      <div style={{ background: `linear-gradient(158deg,${G.boardSoft},${G.boardDeep})`, padding: "62px 28px 34px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: .5, backgroundImage: "radial-gradient(rgba(255,255,255,.06) 1px, transparent 1px)", backgroundSize: "16px 16px" }} />
        <div style={{ position: "relative" }}>
          <div style={{ width: 46, height: 46, borderRadius: 13, background: "rgba(255,255,255,.10)", border: "1px solid rgba(255,255,255,.18)", display: "grid", placeItems: "center", position: "relative", marginBottom: 20 }}>
            <span style={{ fontFamily: G.serif, fontWeight: 600, color: G.chalk, fontSize: 24 }}>T</span>
            <div style={{ position: "absolute", bottom: 10, width: 20, height: 4, background: G.marigold, borderRadius: 2 }} />
          </div>
          <div style={{ fontFamily: G.serif, fontSize: 30, fontWeight: 600, color: G.chalk, letterSpacing: "-.01em" }}>Naveya</div>
          <div style={{ height: 3, width: 46, background: G.marigold, borderRadius: 2, margin: "7px 0 12px" }} />
          <div style={{ fontFamily: G.sans, fontSize: 13, color: G.chalkMuted }}>HR &amp; payroll, built for schools.</div>
        </div>
      </div>
      {/* form */}
      <div style={{ padding: "26px 28px" }}>
        <div style={{ fontFamily: G.serif, fontSize: 20, fontWeight: 600, color: G.ink, marginBottom: 16 }}>Sign in</div>
        <div style={{ fontFamily: G.sans, fontSize: 11.5, fontWeight: 600, color: G.muted, marginBottom: 6 }}>Mobile number</div>
        <div style={{ display: "flex", alignItems: "center", border: `1px solid ${G.lineStrong}`, borderRadius: G.r.md, overflow: "hidden", marginBottom: 16 }}>
          <span style={{ fontFamily: G.sans, fontSize: 14, color: G.body, padding: "11px 12px", background: G.surfaceAlt, borderRight: `1px solid ${G.line}` }}>+91</span>
          <span style={{ fontFamily: G.mono, fontSize: 15, color: G.ink, padding: "11px 12px", letterSpacing: ".04em" }}>98765 43210</span>
        </div>
        <div style={{ background: G.pine, color: "#fff", fontFamily: G.sans, fontSize: 14, fontWeight: 600, textAlign: "center", padding: "12px", borderRadius: G.r.md }}>Send OTP</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "18px 0", color: G.faint }}>
          <div style={{ flex: 1, height: 1, background: G.line }} /><span style={{ fontFamily: G.sans, fontSize: 11 }}>or</span><div style={{ flex: 1, height: 1, background: G.line }} />
        </div>
        <div style={{ border: `1px solid ${G.lineStrong}`, color: G.pine, fontFamily: G.sans, fontSize: 13.5, fontWeight: 600, textAlign: "center", padding: "11px", borderRadius: G.r.md }}>Sign in with school SSO</div>
      </div>
      <div style={{ position: "absolute", bottom: 18, left: 0, right: 0, textAlign: "center", fontFamily: G.mono, fontSize: 10, color: G.faint }}>Sunrise Group · powered by Naveya</div>
    </>
  );

  const OtpScreen = () => (
    <>
      <StatusBar />
      <div style={{ padding: "50px 28px 0" }}>
        <div style={{ color: G.muted, marginBottom: 22, cursor: "pointer" }}><Icon name="arrowLeft" size={18} /></div>
        <div style={{ fontFamily: G.serif, fontSize: 23, fontWeight: 600, color: G.ink }}>Verify your number</div>
        <div style={{ fontFamily: G.sans, fontSize: 13, color: G.muted, marginTop: 8, lineHeight: 1.5 }}>
          Enter the 6-digit code sent to<br /><span style={{ fontFamily: G.mono, color: G.ink }}>+91 98765 43210</span>&nbsp;·&nbsp;<span style={{ color: G.marigoldDeep, fontWeight: 600 }}>Edit</span>
        </div>
        <div style={{ display: "flex", gap: 9, margin: "26px 0 20px" }}>
          {["4", "2", "8", "", "", ""].map((v, i) => (
            <div key={i} style={{ width: 40, height: 50, borderRadius: 10, border: `1.5px solid ${i === 3 ? G.pine : G.lineStrong}`,
              background: "#fff", display: "grid", placeItems: "center", fontFamily: G.mono, fontSize: 22, fontWeight: 600, color: G.ink,
              boxShadow: i === 3 ? `0 0 0 3px ${G.pineSoft}` : "none" }}>
              {v || (i === 3 ? <span style={{ width: 2, height: 22, background: G.pine }} /> : "")}
            </div>
          ))}
        </div>
        <div style={{ fontFamily: G.sans, fontSize: 12.5, color: G.faint, marginBottom: 24 }}>Resend code in <span style={{ fontFamily: G.mono, color: G.muted }}>0:24</span></div>
        <div style={{ background: G.pine, color: "#fff", fontFamily: G.sans, fontSize: 14, fontWeight: 600, textAlign: "center", padding: "12px", borderRadius: G.r.md }}>Verify &amp; continue</div>
      </div>
      <div style={{ position: "absolute", bottom: 18, left: 0, right: 0, textAlign: "center", fontFamily: G.sans, fontSize: 11, color: G.faint }}>Trouble signing in? Contact your HR admin</div>
    </>
  );

  const AB_Auth = () => (
    <DCArtboard title="Sign in — mobile ESS" subtitle="phone-first · OTP" w={780} bg={G.canvas} pad={26}>
      <div style={{ display: "flex", gap: 44, justifyContent: "center" }}>
        {[["1 · Sign in", <LoginScreen key="l" />], ["2 · Verify OTP", <OtpScreen key="o" />]].map(([cap, scr], i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <Phone>{scr}</Phone>
            <div style={{ fontFamily: G.mono, fontSize: 11, color: G.muted, marginTop: 12, letterSpacing: ".05em" }}>{cap}</div>
          </div>
        ))}
      </div>
    </DCArtboard>
  );

  /* ===================== Sign-in — designed options ===================== */
  const CardMark = ({ light }) => (
    <div style={{ width: 38, height: 38, borderRadius: 11, flex: "0 0 auto", position: "relative", display: "grid", placeItems: "center",
      background: light ? "rgba(255,255,255,.10)" : `linear-gradient(150deg,${G.boardSoft},${G.boardDeep})`, border: light ? "1px solid rgba(255,255,255,.18)" : "none" }}>
      <span style={{ fontFamily: G.serif, fontWeight: 600, color: G.chalk, fontSize: 20 }}>T</span>
      <div style={{ position: "absolute", bottom: 8, width: 16, height: 3.5, background: G.marigold, borderRadius: 2 }} />
    </div>
  );
  const FormBtn = ({ bg, color, children }) => (
    <div style={{ background: bg, color, fontFamily: G.sans, fontSize: 14, fontWeight: 600, textAlign: "center", padding: "12px", borderRadius: G.r.md }}>{children}</div>
  );

  // Option C — Premium dark / glass
  const DarkField = ({ label, value, right }) => (
    <div style={{ marginBottom: 13 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span style={{ fontFamily: G.sans, fontSize: 11.5, fontWeight: 600, color: G.chalkMuted }}>{label}</span>
        {right && <span style={{ fontFamily: G.sans, fontSize: 11.5, fontWeight: 600, color: G.marigold }}>{right}</span>}
      </div>
      <div style={{ fontFamily: G.mono, fontSize: 13, color: G.chalk, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.16)", borderRadius: G.r.md, padding: "11px 13px" }}>{value}</div>
    </div>
  );
  // A × C — chalkboard warmth + premium glass, with a meaningful left panel
  // Reusable full-size view: root fills 100% of its parent (artboard wraps it in a fixed-size box).
  const LightField = ({ label, value, right }) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span style={{ fontFamily: G.sans, fontSize: 11.5, fontWeight: 600, color: G.muted }}>{label}</span>
        {right && <span style={{ fontFamily: G.sans, fontSize: 11.5, fontWeight: 600, color: G.marigoldDeep, cursor: "pointer" }}>{right}</span>}
      </div>
      <div style={{ fontFamily: G.mono, fontSize: 13.5, color: G.ink, background: "#fff", border: `1px solid ${G.lineStrong}`, borderRadius: G.r.md, padding: "12px 13px" }}>{value}</div>
    </div>
  );
  const LoginView = ({ onContinue = () => {}, onSSO = () => {} }) => (
    <div style={{ width: "100%", height: "100%", display: "flex", overflow: "hidden" }}>
      {/* LEFT — brand panel */}
      <div style={{ flex: 1.05, position: "relative", overflow: "hidden", padding: "60px 60px", color: G.chalk, display: "flex", flexDirection: "column", justifyContent: "space-between",
        background: `radial-gradient(130% 120% at 22% -10%, ${G.boardSoft}, ${G.boardDeep} 60%)` }}>
        <div style={{ position: "absolute", inset: 0, opacity: .4, backgroundImage: "radial-gradient(rgba(255,255,255,.05) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div style={{ position: "absolute", top: "-8%", left: "30%", width: 640, height: 460, background: "radial-gradient(closest-side, rgba(228,161,27,.13), transparent)" }} />
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(255,255,255,.10)", border: "1px solid rgba(255,255,255,.18)", display: "grid", placeItems: "center", position: "relative" }}>
            <span style={{ fontFamily: G.serif, fontWeight: 600, color: G.chalk, fontSize: 21 }}>T</span>
            <div style={{ position: "absolute", bottom: 8, width: 16, height: 3.5, background: G.marigold, borderRadius: 2 }} />
          </div>
          <span style={{ fontFamily: G.serif, fontSize: 22, fontWeight: 600, color: G.chalk }}>Naveya</span>
        </div>
        <div style={{ position: "relative", maxWidth: 452 }}>
          <div style={{ fontFamily: G.serif, fontSize: 38, fontWeight: 600, color: G.chalk, lineHeight: 1.18, letterSpacing: "-.01em" }}>HR, payroll &amp; compliance, built for schools.</div>
          <div style={{ fontFamily: G.sans, fontSize: 14.5, color: G.chalkMuted, lineHeight: 1.7, marginTop: 22, maxWidth: 420 }}>Staff records, academic-calendar leave, compliant Indian payroll, and attendance that computes pay — across every campus.</div>
        </div>
        <div style={{ position: "relative", fontFamily: G.sans, fontSize: 12.5, color: G.chalkFaint }}>Trusted across Sunrise Group · 3 campuses · 214 staff</div>
      </div>
      {/* RIGHT — form panel */}
      <div style={{ flex: 1, background: G.surface, display: "flex", alignItems: "center", justifyContent: "center", padding: 56 }}>
        <div style={{ width: "100%", maxWidth: 344 }}>
          <div style={{ fontFamily: G.sans, fontSize: 23, fontWeight: 600, color: G.ink, letterSpacing: "-.01em" }}>Welcome back</div>
          <div style={{ fontFamily: G.sans, fontSize: 13.5, color: G.muted, marginTop: 5, marginBottom: 26 }}>Sign in to Sunrise Group</div>
          <LightField label="Work email" value="k.bhardwaj@sunrise.edu" />
          <LightField label="Password" value="••••••••••" right="Forgot?" />
          <div data-noPan onClick={onContinue} style={{ marginTop: 8, cursor: "pointer" }}><FormBtn bg={G.pine} color="#fff">Continue</FormBtn></div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0", color: G.faint }}>
            <div style={{ flex: 1, height: 1, background: G.line }} /><span style={{ fontFamily: G.sans, fontSize: 11.5 }}>or</span><div style={{ flex: 1, height: 1, background: G.line }} />
          </div>
          <div data-noPan onClick={onSSO} style={{ border: `1px solid ${G.lineStrong}`, color: G.ink, fontFamily: G.sans, fontSize: 13.5, fontWeight: 600, textAlign: "center", padding: "11px", borderRadius: G.r.md, cursor: "pointer" }}>Sign in with school SSO</div>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 32, fontFamily: G.sans, fontSize: 11.5, color: G.faint }}><span data-noPan style={{ cursor: "pointer" }}>Support</span><span>·</span><span data-noPan style={{ cursor: "pointer" }}>Privacy Policy</span></div>
        </div>
      </div>
    </div>
  );

  const LoginMix = () => (
    <DCArtboard title="Sign-in — A × C" subtitle="chalkboard warmth · premium glass · meaningful left" w={1000} bg={G.canvas} pad={0}>
      <div style={{ height: 580, borderRadius: G.r.lg, overflow: "hidden", boxShadow: G.sh.card }}>
        <LoginView />
      </div>
    </DCArtboard>
  );

  /* ===================== Web · Dashboard (app shell + home) ===================== */
  const NAV = [
    { key: "dashboard",    label: "Dashboard",    icon: "grid" },
    { key: "people",       label: "People",       icon: "users" },
    { key: "attendance",   label: "Attendance",   icon: "clock" },
    { key: "leave",        label: "Leave",        icon: "calendarDays" },
    { key: "payroll",      label: "Payroll",      icon: "wallet" },
    { key: "recruitment",  label: "Recruitment",  icon: "userPlus" },
    { key: "documents",    label: "Documents",    icon: "fileText" },
    { key: "reports",      label: "Reports",      icon: "barChart" },
    { key: "settings",     label: "Settings",     icon: "settings" },
  ];

  const DashSidebar = ({ route, onNavigate, onSignOut }) => (
    <div style={{ width: 232, flex: "0 0 232px", background: `linear-gradient(160deg, ${G.boardSoft}, ${G.boardDeep})`,
      display: "flex", flexDirection: "column", position: "relative" }}>
      <div style={{ position: "absolute", inset: 0, opacity: .5, backgroundImage: "radial-gradient(rgba(255,255,255,.05) 1px, transparent 1px)", backgroundSize: "16px 16px" }} />
      {/* brand + campus switcher */}
      <div style={{ position: "relative", padding: "20px 18px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(255,255,255,.10)", border: "1px solid rgba(255,255,255,.18)",
            display: "grid", placeItems: "center", position: "relative", flex: "0 0 auto" }}>
            <span style={{ fontFamily: G.serif, fontWeight: 600, color: G.chalk, fontSize: 17 }}>T</span>
            <div style={{ position: "absolute", bottom: 6, width: 13, height: 3, background: G.marigold, borderRadius: 2 }} />
          </div>
          <span style={{ fontFamily: G.serif, fontSize: 17, fontWeight: 600, color: G.chalk }}>Naveya</span>
        </div>
        <div data-noPan style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,.07)",
          border: "1px solid rgba(255,255,255,.12)", borderRadius: G.r.md, padding: "8px 10px", cursor: "pointer" }}>
          <span style={{ fontFamily: G.sans, fontSize: 12.5, fontWeight: 600, color: G.chalk }}>Sunrise Group</span>
          <Icon name="chevronDown" size={13} color={G.chalkMuted} />
        </div>
      </div>
      {/* nav */}
      <div style={{ position: "relative", flex: 1, padding: "6px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV.map((n) => {
          const active = n.key === route;
          return (
            <div key={n.key} data-noPan onClick={() => onNavigate && onNavigate(n.key)} style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 12px", borderRadius: 8,
              position: "relative", background: active ? "rgba(255,255,255,.06)" : "transparent", cursor: "pointer" }}>
              {active && <div style={{ position: "absolute", left: 0, top: 6, bottom: 6, width: 3, background: G.marigold, borderRadius: "0 2px 2px 0" }} />}
              <Icon name={n.icon} size={16} color={active ? G.chalk : G.chalkMuted} />
              <span style={{ fontFamily: G.sans, fontSize: 12.5, fontWeight: active ? 600 : 500, color: active ? G.chalk : G.chalkMuted }}>{n.label}</span>
            </div>
          );
        })}
      </div>
      {/* user row */}
      <div style={{ position: "relative", padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,.10)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: 999, background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.2)",
          display: "grid", placeItems: "center", fontFamily: G.sans, fontWeight: 700, fontSize: 11, color: G.chalk, flex: "0 0 auto" }}>KB</div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontFamily: G.sans, fontSize: 12, fontWeight: 600, color: G.chalk, whiteSpace: "nowrap" }}>K. Bhardwaj</div>
          <div style={{ fontFamily: G.sans, fontSize: 10.5, color: G.chalkMuted }}>Group Admin</div>
        </div>
        <div data-noPan onClick={onSignOut} style={{ fontFamily: G.sans, fontSize: 10, fontWeight: 600, color: G.chalkMuted, cursor: "pointer",
          border: "1px solid rgba(255,255,255,.16)", borderRadius: G.r.md, padding: "4px 8px", flex: "0 0 auto", whiteSpace: "nowrap" }}>Sign out</div>
      </div>
    </div>
  );

  const DashTopBar = ({ route }) => {
    const label = (NAV.find((n) => n.key === route) || NAV[0]).label;
    return (
    <div style={{ height: 62, flex: "0 0 62px", background: G.surface, borderBottom: `1px solid ${G.line}`,
      display: "flex", alignItems: "center", padding: "0 20px", gap: 16 }}>
      <div>
        <div style={{ fontFamily: G.serif, fontSize: 17, fontWeight: 600, color: G.ink, lineHeight: 1.1 }}>{label}</div>
        <div style={{ fontFamily: G.mono, fontSize: 10, color: G.faint, marginTop: 1 }}>Sat, 18 Jul 2026</div>
      </div>
      <div data-noPan style={{ flex: "0 0 320px", marginLeft: 16, display: "flex", alignItems: "center", gap: 8,
        background: G.surfaceAlt, border: `1px solid ${G.line}`, borderRadius: G.r.md, padding: "8px 11px" }}>
        <Icon name="search" size={14} color={G.faint} />
        <span style={{ fontFamily: G.sans, fontSize: 12.5, color: G.faint }}>Search staff, PAN, code…</span>
      </div>
      <div style={{ flex: "1 1 auto" }} />
      <span style={{ fontFamily: G.mono, fontSize: 11, fontWeight: 600, color: G.muted, background: G.canvas, border: `1px solid ${G.line}`,
        borderRadius: G.r.pill, padding: "5px 12px" }}>July 2026</span>
      <div data-noPan style={{ position: "relative", width: 34, height: 34, borderRadius: 999, display: "grid", placeItems: "center",
        border: `1px solid ${G.line}`, cursor: "pointer" }}>
        <Icon name="bell" size={16} color={G.muted} />
        <span style={{ position: "absolute", top: -3, right: -3, background: G.marigold, color: "#3a2a06", fontFamily: G.mono, fontSize: 9,
          fontWeight: 700, borderRadius: 999, padding: "1px 5px", border: `1.5px solid ${G.surface}` }}>3</span>
      </div>
      <div style={{ width: 34, height: 34, borderRadius: 999, background: G.pineSoft, border: `1px solid ${G.line}`,
        display: "grid", placeItems: "center", fontFamily: G.sans, fontWeight: 700, fontSize: 11.5, color: G.pine }}>KB</div>
    </div>
    );
  };

  const Spark = ({ points, color }) => {
    const w = 66, h = 24;
    const max = Math.max(...points), min = Math.min(...points);
    const norm = points.map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - 2 - ((p - min) / (max - min || 1)) * (h - 4);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
    return (
      <svg width={w} height={h}>
        <polyline points={norm} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  };

  const KPI = ({ label, value, valueTone, delta, deltaTone, spark, sparkColor, hero }) => (
    <div style={{ flex: 1, background: G.surface, borderRadius: G.r.lg, padding: "16px 18px", boxShadow: G.sh.card,
      border: `1px solid ${G.line}`, borderTop: hero ? `3px solid ${G.marigold}` : `1px solid ${G.line}` }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: G.mono, fontSize: 9.5, letterSpacing: ".07em", color: G.faint, textTransform: "uppercase", whiteSpace: "nowrap" }}>{label}</div>
          <div style={{ fontFamily: G.mono, fontSize: 21, fontWeight: 700, color: valueTone || G.ink, marginTop: 6, whiteSpace: "nowrap" }}>{value}</div>
          {delta && <div style={{ fontFamily: G.sans, fontSize: 10.5, fontWeight: 600, color: deltaTone, marginTop: 3 }}>{delta}</div>}
        </div>
        {spark && <Spark points={spark} color={sparkColor || G.pine} />}
      </div>
    </div>
  );

  const KPIS = [
    { label: "Payroll · Jul", value: "₹42,61,540", delta: "+3.1% vs Jun", deltaTone: G.success, spark: [30, 34, 32, 38, 40, 39, 44], sparkColor: G.pine, hero: true },
    { label: "Headcount", value: "214", delta: "+2 this month", deltaTone: G.success, spark: [206, 208, 209, 210, 212, 213, 214], sparkColor: G.pine },
    { label: "Pending approvals", value: "8", delta: "3 new today", deltaTone: G.muted, spark: [4, 6, 5, 7, 6, 9, 8], sparkColor: G.info },
    { label: "Docs to verify", value: "06", valueTone: G.marigoldDeep, delta: "verification due", deltaTone: G.marigoldDeep, spark: [2, 3, 4, 3, 5, 6, 6], sparkColor: G.marigoldDeep },
    { label: "On-time attendance", value: "92%", delta: "+1.4pp", deltaTone: G.success, spark: [88, 89, 90, 91, 90, 92, 92], sparkColor: G.success },
  ];

  const APPROVALS = [
    { icon: "calendarDays", name: "Ananya Menon", what: "Leave request · Casual leave · 2 days", tone: "warn", status: "Pending" },
    { icon: "clock", name: "Devlin Roy", what: "Regularization · Mon 13 Jul · missing swipe", tone: "info", status: "Awaiting HR" },
    { icon: "fileText", name: "Sana Qureshi", what: "Document request · PAN update", tone: "warn", status: "Pending" },
    { icon: "userPlus", name: "Rahul Iyer", what: "Onboarding · offer accepted", tone: "success", status: "Ready" },
  ];

  const ApprovalRow = ({ a, last }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: last ? "none" : `1px solid ${G.line}` }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: G.canvas, border: `1px solid ${G.line}`, display: "grid", placeItems: "center", flex: "0 0 auto" }}>
        <Icon name={a.icon} size={15} color={G.muted} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: G.sans, fontSize: 12.5, fontWeight: 600, color: G.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.name}</div>
        <div style={{ fontFamily: G.sans, fontSize: 11, color: G.muted, marginTop: 1 }}>{a.what}</div>
      </div>
      <Status tone={a.tone}>{a.status}</Status>
      <div data-noPan style={{ fontFamily: G.sans, fontSize: 11.5, fontWeight: 600, color: G.pine, border: `1px solid ${G.lineStrong}`,
        borderRadius: G.r.md, padding: "6px 12px", cursor: "pointer", flex: "0 0 auto" }}>Review</div>
    </div>
  );

  const ApprovalsPanel = () => (
    <div style={{ flex: 1.4, background: G.surface, border: `1px solid ${G.line}`, borderRadius: G.r.lg, overflow: "hidden", boxShadow: G.sh.card }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px", borderBottom: `1px solid ${G.lineStrong}`, background: G.surfaceAlt }}>
        <span style={{ fontFamily: G.serif, fontSize: 15, fontWeight: 600, color: G.ink }}>Approvals queue</span>
        <span style={{ fontFamily: G.mono, fontSize: 10.5, fontWeight: 700, color: "#fff", background: G.danger, borderRadius: 999, padding: "2px 8px" }}>{APPROVALS.length}</span>
      </div>
      {APPROVALS.map((a, i) => <ApprovalRow key={a.name} a={a} last={i === APPROVALS.length - 1} />)}
    </div>
  );

  const PAYROLL_STEPS = ["Computed", "Variance", "Approved", "Disbursed"];
  const PAYROLL_STEP_ACTIVE = 1; // "Variance" is the current step — nothing here auto-commits

  const StepRow = () => (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {PAYROLL_STEPS.map((s, i) => (
        <React.Fragment key={s}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: 999, background: i <= PAYROLL_STEP_ACTIVE ? G.pine : G.lineStrong, flex: "0 0 auto" }} />
            <span style={{ fontFamily: G.sans, fontSize: 11, fontWeight: i === PAYROLL_STEP_ACTIVE ? 700 : 500, color: i <= PAYROLL_STEP_ACTIVE ? G.ink : G.faint, whiteSpace: "nowrap" }}>{s}</span>
          </div>
          {i < PAYROLL_STEPS.length - 1 && <div style={{ flex: 1, height: 1, background: i < PAYROLL_STEP_ACTIVE ? G.pine : G.line }} />}
        </React.Fragment>
      ))}
    </div>
  );

  const FILINGS = [
    { label: "PF ECR", sub: "TRRN filed · 15 Jul" },
    { label: "ESI", sub: "Challan filed · 14 Jul" },
    { label: "PT", sub: "State return filed · 12 Jul" },
    { label: "TDS · 24Q", sub: "Filed · Q1 FY26-27" },
  ];

  const FilingRow = ({ f, last }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: last ? "none" : `1px solid ${G.line}` }}>
      <Icon name="checkCircle" size={15} color={G.success} />
      <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontFamily: G.sans, fontSize: 12, fontWeight: 600, color: G.ink }}>{f.label}</span>
        <span style={{ fontFamily: G.sans, fontSize: 10.5, color: G.muted }}>{f.sub}</span>
      </div>
      <span style={{ fontFamily: G.mono, fontSize: 9.5, fontWeight: 700, color: G.success, textTransform: "uppercase", letterSpacing: ".04em" }}>Filed</span>
    </div>
  );

  const ThisMonthPanel = () => (
    <div style={{ flex: 1, background: G.surface, border: `1px solid ${G.line}`, borderRadius: G.r.lg, padding: 16, boxShadow: G.sh.card,
      display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <div style={{ fontFamily: G.serif, fontSize: 15, fontWeight: 600, color: G.ink, marginBottom: 12 }}>This month</div>
        <div style={{ fontFamily: G.mono, fontSize: 9.5, letterSpacing: ".07em", color: G.faint, textTransform: "uppercase", marginBottom: 9 }}>Payroll run · July 2026</div>
        <StepRow />
      </div>
      <div>
        <div style={{ fontFamily: G.mono, fontSize: 9.5, letterSpacing: ".07em", color: G.faint, textTransform: "uppercase", marginBottom: 2 }}>Statutory filings</div>
        {FILINGS.map((f, i) => <FilingRow key={f.label} f={f} last={i === FILINGS.length - 1} />)}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
        <Btn kind="primary">Run payroll</Btn>
        <Btn kind="ghost">Add staff</Btn>
      </div>
    </div>
  );

  const SectionPlaceholder = ({ label, icon }) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      height: "100%", minHeight: 360, gap: 14, color: G.faint }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: G.surface, border: `1px solid ${G.line}`,
        display: "grid", placeItems: "center", boxShadow: G.sh.card }}>
        <Icon name={icon} size={24} color={G.muted} />
      </div>
      <div style={{ fontFamily: G.serif, fontSize: 17, fontWeight: 600, color: G.muted }}>{label} — coming soon</div>
    </div>
  );

  // Reusable full-size view: shell (sidebar + top bar + content) fills 100% of its parent.
  const DashboardView = ({ route = "dashboard", onNavigate, onSignOut }) => (
    <div style={{ display: "flex", width: "100%", height: "100%" }}>
      <DashSidebar route={route} onNavigate={onNavigate} onSignOut={onSignOut} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <DashTopBar route={route} />
        <div style={{ flex: 1, background: G.canvas, padding: 24, overflow: "auto" }}>
          {route === "dashboard" ? (
            <>
              <div style={{ display: "flex", gap: 14, marginBottom: 20 }}>
                {KPIS.map((k) => <KPI key={k.label} {...k} />)}
              </div>
              <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                <ApprovalsPanel />
                <ThisMonthPanel />
              </div>
            </>
          ) : (
            <SectionPlaceholder
              label={(NAV.find((n) => n.key === route) || {}).label || route}
              icon={(NAV.find((n) => n.key === route) || {}).icon || "grid"}
            />
          )}
        </div>
      </div>
    </div>
  );

  const AB_Dashboard = () => (
    <DCArtboard title="Web · Dashboard" subtitle="HR console — app shell + home" w={1280} bg={G.canvas} pad={0}>
      <div style={{ height: 820, borderRadius: G.r.lg, overflow: "hidden", boxShadow: G.sh.card }}>
        <DashboardView />
      </div>
    </DCArtboard>
  );

  /* ===================== Web · Employee Self-Service (ESS) — the primary surface ===================== */
  const EMP_NAV = [
    { key: "home",       label: "Home",         icon: "grid" },
    { key: "attendance", label: "My Attendance", icon: "clock" },
    { key: "leave",      label: "Leave",         icon: "calendarDays" },
    { key: "payslips",   label: "Payslips",      icon: "wallet" },
    { key: "documents",  label: "Documents",     icon: "fileText" },
    { key: "profile",    label: "Profile",       icon: "user" },
  ];

  const EmpSidebar = ({ route, onNavigate, onSignOut }) => (
    <div style={{ width: 232, flex: "0 0 232px", background: `linear-gradient(160deg, ${G.boardSoft}, ${G.boardDeep})`,
      display: "flex", flexDirection: "column", position: "relative" }}>
      <div style={{ position: "absolute", inset: 0, opacity: .5, backgroundImage: "radial-gradient(rgba(255,255,255,.05) 1px, transparent 1px)", backgroundSize: "16px 16px" }} />
      {/* brand */}
      <div style={{ position: "relative", padding: "20px 18px 18px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(255,255,255,.10)", border: "1px solid rgba(255,255,255,.18)",
          display: "grid", placeItems: "center", position: "relative", flex: "0 0 auto" }}>
          <span style={{ fontFamily: G.serif, fontWeight: 600, color: G.chalk, fontSize: 17 }}>T</span>
          <div style={{ position: "absolute", bottom: 6, width: 13, height: 3, background: G.marigold, borderRadius: 2 }} />
        </div>
        <span style={{ fontFamily: G.serif, fontSize: 17, fontWeight: 600, color: G.chalk }}>Naveya</span>
      </div>
      {/* nav */}
      <div style={{ position: "relative", flex: 1, padding: "6px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
        {EMP_NAV.map((n) => {
          const active = n.key === route;
          return (
            <div key={n.key} data-noPan onClick={() => onNavigate && onNavigate(n.key)} style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 12px", borderRadius: 8,
              position: "relative", background: active ? "rgba(255,255,255,.06)" : "transparent", cursor: "pointer" }}>
              {active && <div style={{ position: "absolute", left: 0, top: 6, bottom: 6, width: 3, background: G.marigold, borderRadius: "0 2px 2px 0" }} />}
              <Icon name={n.icon} size={16} color={active ? G.chalk : G.chalkMuted} />
              <span style={{ fontFamily: G.sans, fontSize: 12.5, fontWeight: active ? 600 : 500, color: active ? G.chalk : G.chalkMuted }}>{n.label}</span>
            </div>
          );
        })}
      </div>
      {/* user row */}
      <div style={{ position: "relative", padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,.10)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: 999, background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.2)",
          display: "grid", placeItems: "center", fontFamily: G.sans, fontWeight: 700, fontSize: 11, color: G.chalk, flex: "0 0 auto" }}>AM</div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontFamily: G.sans, fontSize: 12, fontWeight: 600, color: G.chalk, whiteSpace: "nowrap" }}>Ananya Menon</div>
          <div style={{ fontFamily: G.sans, fontSize: 10.5, color: G.chalkMuted }}>PGT · Physics</div>
        </div>
        <div data-noPan onClick={onSignOut} style={{ fontFamily: G.sans, fontSize: 10, fontWeight: 600, color: G.chalkMuted, cursor: "pointer",
          border: "1px solid rgba(255,255,255,.16)", borderRadius: G.r.md, padding: "4px 8px", flex: "0 0 auto", whiteSpace: "nowrap" }}>Sign out</div>
      </div>
    </div>
  );

  const EmpTopBar = ({ route }) => {
    const label = (EMP_NAV.find((n) => n.key === route) || EMP_NAV[0]).label;
    return (
      <div style={{ height: 62, flex: "0 0 62px", background: G.surface, borderBottom: `1px solid ${G.line}`,
        display: "flex", alignItems: "center", padding: "0 20px", gap: 16 }}>
        <div>
          <div style={{ fontFamily: G.serif, fontSize: 17, fontWeight: 600, color: G.ink, lineHeight: 1.1 }}>{label}</div>
          <div style={{ fontFamily: G.mono, fontSize: 10, color: G.faint, marginTop: 1 }}>Sat, 18 Jul 2026</div>
        </div>
        <div style={{ flex: "1 1 auto" }} />
        <div data-noPan style={{ position: "relative", width: 34, height: 34, borderRadius: 999, display: "grid", placeItems: "center",
          border: `1px solid ${G.line}`, cursor: "pointer" }}>
          <Icon name="bell" size={16} color={G.muted} />
          <span style={{ position: "absolute", top: -3, right: -3, background: G.marigold, color: "#3a2a06", fontFamily: G.mono, fontSize: 9,
            fontWeight: 700, borderRadius: 999, padding: "1px 5px", border: `1.5px solid ${G.surface}` }}>1</span>
        </div>
        <div style={{ width: 34, height: 34, borderRadius: 999, background: G.pineSoft, border: `1px solid ${G.line}`,
          display: "grid", placeItems: "center", fontFamily: G.sans, fontWeight: 700, fontSize: 11.5, color: G.pine }}>AM</div>
      </div>
    );
  };

  const QuickAction = ({ icon, label, accent }) => (
    <div data-noPan style={{ flex: 1, display: "flex", alignItems: "center", gap: 12, background: G.surface,
      border: `1px solid ${accent ? G.marigold : G.line}`, borderRadius: G.r.lg, padding: "14px 16px", boxShadow: G.sh.card, cursor: "pointer" }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: accent ? G.marigoldSoft : G.canvas,
        border: `1px solid ${accent ? G.marigold + "55" : G.line}`, display: "grid", placeItems: "center", flex: "0 0 auto" }}>
        <Icon name={icon} size={17} color={accent ? G.marigoldDeep : G.pine} />
      </div>
      <span style={{ fontFamily: G.sans, fontSize: 13, fontWeight: 600, color: G.ink }}>{label}</span>
    </div>
  );

  const LeaveTile = ({ label, value, sub }) => (
    <div style={{ flex: 1, background: G.surface, border: `1px solid ${G.line}`, borderRadius: G.r.lg, padding: "12px 14px" }}>
      <div style={{ fontFamily: G.mono, fontSize: 9.5, letterSpacing: ".07em", color: G.faint, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontFamily: G.mono, fontSize: 19, fontWeight: 700, color: G.ink, marginTop: 5 }}>{value}</div>
      {sub && <div style={{ fontFamily: G.sans, fontSize: 10, color: G.muted, marginTop: 1 }}>{sub}</div>}
    </div>
  );

  const EMP_LEAVE_BALANCES = [
    { label: "Vacation (in lieu of EL)", value: "—", sub: "vacation staff" },
    { label: "CL", value: "4" },
    { label: "SL", value: "6" },
    { label: "Comp-off", value: "2" },
  ];

  const EmployeeHome = () => {
    const S = 540, E = 1110, pc = (m) => ((m - S) / (E - S)) * 100;
    const now = 796;
    const worked = [[542, 705], [765, now]];
    const brk = [[705, 765]];
    const Btn = ({ kind = "primary", children }) => {
      const base = { fontFamily: G.sans, fontSize: 13, fontWeight: 600, borderRadius: 8, padding: "8px 14px", cursor: "pointer", border: "1px solid transparent", whiteSpace: "nowrap", display: "inline-block" };
      const k = kind === "primary" ? { background: G.pine, color: "#fff" }
        : kind === "ghost" ? { background: "#fff", color: G.ink, border: `1px solid ${G.lineStrong}` }
          : { background: "transparent", color: G.pine, padding: "0" };
      return <span data-noPan style={{ ...base, ...k }}>{children}</span>;
    };
    const Metric = ({ label, value }) => (
      <div style={{ textAlign: "right" }}>
        <div style={{ fontFamily: G.sans, fontSize: 11.5, color: G.muted }}>{label}</div>
        <div style={{ fontFamily: G.mono, fontSize: 14, fontWeight: 600, color: value === "—" ? G.faint : G.ink, marginTop: 2 }}>{value}</div>
      </div>
    );
    const Row = ({ label, sub, value, unit, action, last }) => (
      <div style={{ display: "flex", alignItems: "center", padding: "12px 0", borderBottom: last ? "none" : `1px solid ${G.line}` }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: G.sans, fontSize: 13.5, color: G.ink, fontWeight: 500 }}>{label}</div>
          {sub && <div style={{ fontFamily: G.sans, fontSize: 12, color: G.faint, marginTop: 1 }}>{sub}</div>}
        </div>
        {value !== undefined && <div style={{ fontFamily: G.mono, fontSize: 14, fontWeight: 600, color: value === "—" ? G.faint : G.ink, minWidth: 92, textAlign: "right" }}>
          {unit && value !== "—" && <span style={{ fontSize: 10.5, color: G.muted, marginRight: 1 }}>{unit}</span>}{value}</div>}
        {action && <span data-noPan style={{ marginLeft: 20, fontFamily: G.sans, fontSize: 12.5, fontWeight: 600, color: G.pine, cursor: "pointer" }}>{action}</span>}
      </div>
    );
    const SH = ({ children, action }) => (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontFamily: G.sans, fontSize: 14.5, fontWeight: 600, color: G.ink }}>{children}</span>
        {action && <Btn kind="link">{action}</Btn>}
      </div>
    );
    return (
      <div style={{ maxWidth: 960 }}>
        <div style={{ fontFamily: G.sans, fontSize: 22, fontWeight: 600, color: G.ink, letterSpacing: "-.015em" }}>Good morning, Ananya</div>
        <div style={{ fontFamily: G.sans, fontSize: 13.5, color: G.muted, marginTop: 4, marginBottom: 24 }}>General shift · 09:00–18:30 · Sunrise Public School</div>

        {/* Today */}
        <div style={{ border: `1px solid ${G.line}`, borderRadius: 12, background: "#fff", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "15px 20px", borderBottom: `1px solid ${G.line}` }}>
            <span style={{ fontFamily: G.sans, fontSize: 14.5, fontWeight: 600, color: G.ink }}>Today</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: G.okSoft, color: G.success, fontFamily: G.sans, fontSize: 12, fontWeight: 600, padding: "3px 9px", borderRadius: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: 6, background: G.success }} />Present</span>
            <div style={{ marginLeft: "auto", display: "flex", gap: 30 }}>
              <Metric label="In" value="09:02" /><Metric label="Effective" value="3h 14m" /><Metric label="Break" value="1h 00m" /><Metric label="Out" value="—" />
            </div>
          </div>
          <div style={{ padding: "22px 20px 16px" }}>
            <div style={{ position: "relative", height: 24 }}>
              <div style={{ position: "absolute", top: 7, left: 0, right: 0, height: 10, background: G.canvas, borderRadius: 5, border: `1px solid ${G.line}` }} />
              {worked.map(([a, b], i) => <div key={i} style={{ position: "absolute", top: 7, height: 10, left: `${pc(a)}%`, width: `${pc(b) - pc(a)}%`, background: G.pine, borderRadius: 5 }} />)}
              {brk.map(([a, b], i) => <div key={i} style={{ position: "absolute", top: 7, height: 10, left: `${pc(a)}%`, width: `${pc(b) - pc(a)}%`, background: "#e6e8e1" }} />)}
              <div style={{ position: "absolute", top: 1, left: `${pc(now)}%`, width: 2, height: 22, background: G.marigold, borderRadius: 2 }} />
            </div>
            <div style={{ position: "relative", height: 14, marginTop: 5 }}>
              {[9, 11, 13, 15, 17].map((h) => <span key={h} style={{ position: "absolute", left: `${pc(h * 60)}%`, transform: "translateX(-50%)", fontFamily: G.mono, fontSize: 9.5, color: G.faint }}>{h}:00</span>)}
            </div>
            <div style={{ marginTop: 10, fontFamily: G.sans, fontSize: 12, color: G.faint }}>Recorded at Gate-2 · biometric &nbsp;·&nbsp; <span data-noPan style={{ color: G.pine, fontWeight: 600, cursor: "pointer" }}>View full timecard</span></div>
          </div>
        </div>

        {/* two columns */}
        <div style={{ display: "flex", gap: 36, alignItems: "flex-start" }}>
          <div style={{ flex: 1.5 }}>
            <SH action="Apply leave">Leave balance</SH>
            <Row label="Vacation" sub="in lieu of EL · vacation staff" value="—" />
            <Row label="Casual leave" sub="days available" value="4" />
            <Row label="Sick leave" sub="days available" value="6" />
            <Row label="Comp-off" sub="days available" value="2" last />
            <div style={{ height: 30 }} />
            <SH action="View all">Payslips</SH>
            <Row label="July 2026" sub="Net pay · credited 31 Jul" value="68,240" unit="₹" action="Download" />
            <Row label="FY 2025–26" sub="Gross earnings to date" value="5,84,300" unit="₹" last />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ border: `1px solid ${G.lineStrong}`, borderRadius: 12, padding: 18, background: "#fff", marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
                <Icon name="alertTriangle" size={15} color={G.marigoldDeep} />
                <span style={{ fontFamily: G.sans, fontSize: 13.5, fontWeight: 600, color: G.ink }}>Action needed</span>
              </div>
              <div style={{ fontFamily: G.sans, fontSize: 13.5, color: G.ink, fontWeight: 500 }}>Renew your police verification</div>
              <div style={{ fontFamily: G.sans, fontSize: 12, color: G.muted, marginTop: 3, marginBottom: 14 }}>Requested by HR · due in 12 days</div>
              <Btn kind="primary">Respond</Btn>
            </div>
            <div style={{ marginBottom: 8, fontFamily: G.sans, fontSize: 14.5, fontWeight: 600, color: G.ink }}>Upcoming</div>
            <Row label="Independence Day" sub="National holiday" value="15 Aug" />
            <Row label="Summer vacation" sub="term break" value="18–31 May" last />
            <div style={{ height: 24 }} />
            {[["calendarDays", "Apply for leave"], ["wallet", "View latest payslip"], ["user", "Update my profile"]].map(([ic, t], i, arr) => (
              <div key={t} data-noPan style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 0", borderBottom: i < arr.length - 1 ? `1px solid ${G.line}` : "none", cursor: "pointer" }}>
                <Icon name={ic} size={15} color={G.muted} />
                <span style={{ flex: 1, fontFamily: G.sans, fontSize: 13, color: G.ink, fontWeight: 500 }}>{t}</span>
                <span style={{ display: "inline-flex", transform: "rotate(-90deg)" }}><Icon name="chevronDown" size={13} color={G.faint} /></span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const EmployeeProfile = ({ onViewAdmin }) => (
    <div style={{ maxWidth: 460 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        <div style={{ width: 52, height: 52, borderRadius: 999, background: G.pineSoft, border: `1px solid ${G.line}`,
          display: "grid", placeItems: "center", fontFamily: G.sans, fontWeight: 700, fontSize: 16, color: G.pine }}>AM</div>
        <div>
          <div style={{ fontFamily: G.serif, fontSize: 18, fontWeight: 600, color: G.ink }}>Ananya Menon</div>
          <div style={{ fontFamily: G.sans, fontSize: 12, color: G.muted }}>PGT · Physics · EMP-00417</div>
        </div>
      </div>
      <div style={{ background: G.surface, border: `1px solid ${G.line}`, borderRadius: G.r.lg, padding: 16, boxShadow: G.sh.card, marginBottom: 20 }}>
        {[["Employee code", "EMP-00417"], ["Designation", "PGT · Physics"], ["Employment type", "Vacation staff"], ["Campus", "Sunrise Public School"]].map(([k, v], i, arr) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: i === arr.length - 1 ? "none" : `1px solid ${G.line}` }}>
            <span style={{ fontFamily: G.sans, fontSize: 12, color: G.muted }}>{k}</span>
            <span style={{ fontFamily: G.mono, fontSize: 12, color: G.ink, fontWeight: 600 }}>{v}</span>
          </div>
        ))}
      </div>
      <div data-noPan onClick={onViewAdmin} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: G.sans, fontSize: 12, fontWeight: 600,
        color: G.pine, cursor: "pointer", border: `1px solid ${G.lineStrong}`, borderRadius: G.r.md, padding: "7px 12px" }}>
        <Icon name="settings" size={13} color={G.pine} />View admin console
      </div>
    </div>
  );

  // Reusable full-size view: employee shell (sidebar + top bar + content) fills 100% of its parent.
  const EmployeeView = ({ route = "home", onNavigate, onSignOut, onViewAdmin }) => (
    <div style={{ display: "flex", width: "100%", height: "100%" }}>
      <EmpSidebar route={route} onNavigate={onNavigate} onSignOut={onSignOut} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <EmpTopBar route={route} />
        <div style={{ flex: 1, background: G.canvas, padding: 24, overflow: "auto" }}>
          {route === "home" ? (
            <EmployeeHome />
          ) : route === "attendance" ? (
            <MyAttendanceView />
          ) : route === "profile" ? (
            <EmployeeProfile onViewAdmin={onViewAdmin} />
          ) : (
            <SectionPlaceholder
              label={(EMP_NAV.find((n) => n.key === route) || {}).label || route}
              icon={(EMP_NAV.find((n) => n.key === route) || {}).icon || "grid"}
            />
          )}
        </div>
      </div>
    </div>
  );

  const AB_Employee = () => (
    <DCArtboard title="Web · Employee — Home" subtitle="ESS — sidebar + top bar + home" w={1280} bg={G.canvas} pad={0}>
      <div style={{ height: 820, borderRadius: G.r.lg, overflow: "hidden", boxShadow: G.sh.card }}>
        <EmployeeView />
      </div>
    </DCArtboard>
  );

  function HiFiBoard() {
    return (
      <DesignCanvas pages={[
        { name: "Design System", node: (
          <>
            <DCRow><AB_Brand /><AB_Color /></DCRow>
            <DCRow><AB_Type /><AB_Components /></DCRow>
            <DCRow><AB_Muster /></DCRow>
            <DCRow><AB_MyAttendance /></DCRow>
            <DCRow><AB_Timecard /></DCRow>
          </>
        ) },
        { name: "Web", node: (
          <>
            <DCRow><LoginMix /></DCRow>
            <DCRow><AB_Employee /></DCRow>
            <DCRow><AB_Dashboard /></DCRow>
          </>
        ) },
        { name: "App", node: (
          <>
            <DCRow><AB_Auth /></DCRow>
          </>
        ) },
      ]} />
    );
  }
  window.HiFiBoard = HiFiBoard;
  // Reusable full-size screens for the standalone prototype (design/prototype.jsx) — no duplication.
  window.Screens = { Login: LoginView, Dashboard: DashboardView, Employee: EmployeeView };
})();
