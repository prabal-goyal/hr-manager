/* ============================================================
   playground.jsx — Naveya configurable theme playground.
   Standalone code-as-design canvas: pick a color direction
   (Bahi & Brass / Peacock & Slate / Jamun & Ash), toggle
   light/dark + density, and live-edit every semantic color
   token via the control rail while the sample surface reacts
   instantly. No imports/exports — one big IIFE mounting to #root.
   Source of truth: docs/design-tokens-research.md.
   ============================================================ */
(function () {
  const { useState, useEffect, useCallback, Fragment } = React;

  // ---------------------------------------------------------------
  // 1. Palettes (embedded verbatim per the dispatch spec).
  // ---------------------------------------------------------------
  const STATES = {
    light: { success:'#317A45', warning:'#BB7E00', danger:'#D72E2D', info:'#2A7195',
             onSuccess:'#FFFFFF', onWarning:'#27221D', onDanger:'#FFFFFF', onInfo:'#FFFFFF' },
    dark:  { success:'#71C791', warning:'#E9B452', danger:'#EF675C', info:'#6DB5DA',
             onSuccess:'#08160B', onWarning:'#241A05', onDanger:'#2A0B09', onInfo:'#06171F' }
  };
  const THEMES = {
    'Bahi & Brass': {
      light:{ bg:'#FCFBF8', surface:'#FEFDFB', raised:'#FFFFFF', border:'#E2E0DC', ink:'#27221D', inkMuted:'#6D6862',
              accent:'#B63132', accentSoft:'#F5E4E0', onAccent:'#FFFFFF', action:'#27221D', onAction:'#FCFBF8', brass:'#AF8433' },
      dark:{  bg:'#101318', surface:'#171B21', raised:'#20242B', border:'#2F333B', ink:'#EEEDEA', inkMuted:'#A1A5AB',
              accent:'#D86258', accentSoft:'#331A18', onAccent:'#101318', action:'#EEEDEA', onAction:'#101318', brass:'#DEB464' } },
    'Peacock & Slate': {
      light:{ bg:'#F6F8F9', surface:'#FBFCFD', raised:'#FFFFFF', border:'#DAE1E4', ink:'#1B2427', inkMuted:'#57646A',
              accent:'#007B88', accentSoft:'#DCEFF1', onAccent:'#FFFFFF', action:'#1B2427', onAction:'#F6F8F9', brass:'#7E7350' },
      dark:{  bg:'#0E1416', surface:'#151C1F', raised:'#1D262A', border:'#2C363A', ink:'#EAEEEF', inkMuted:'#9BA7AB',
              accent:'#28BAC1', accentSoft:'#103033', onAccent:'#06191B', action:'#EAEEEF', onAction:'#0E1416', brass:'#C9B678' } },
    'Jamun & Ash': {
      light:{ bg:'#F8F6F8', surface:'#FDFBFD', raised:'#FFFFFF', border:'#E4DEE3', ink:'#241E23', inkMuted:'#6A626A',
              accent:'#853E80', accentSoft:'#F0E2EE', onAccent:'#FFFFFF', action:'#241E23', onAction:'#F8F6F8', brass:'#008687' },
      dark:{  bg:'#131015', surface:'#1A161C', raised:'#221D25', border:'#332B34', ink:'#EDE9EC', inkMuted:'#A39BA1',
              accent:'#CA82C0', accentSoft:'#2A1A28', onAccent:'#131015', action:'#EDE9EC', onAction:'#131015', brass:'#3FB6B0' } }
  };

  const EDITABLE_TOKENS = [
    { key:'bg', label:'Background' }, { key:'surface', label:'Surface' }, { key:'raised', label:'Raised' },
    { key:'border', label:'Border' }, { key:'ink', label:'Ink' }, { key:'inkMuted', label:'Ink muted' },
    { key:'accent', label:'Accent' }, { key:'accentSoft', label:'Accent soft' }, { key:'action', label:'Action' },
    { key:'brass', label:'Brass' }, { key:'success', label:'Success' }, { key:'warning', label:'Warning' },
    { key:'danger', label:'Danger' }, { key:'info', label:'Info' }
  ];

  // ---------------------------------------------------------------
  // 2. Typography / space / radius / elevation / motion (§3–§4 of
  //    docs/design-tokens-research.md, the "Bahi & Brass" starter
  //    window.G shape — direction-independent, shared by all three).
  // ---------------------------------------------------------------
  const SANS = "'Hanken Grotesk', system-ui, -apple-system, 'Segoe UI', sans-serif";
  const DEVA = "'Mukta', 'Hanken Grotesk', system-ui, sans-serif";
  const DISPLAY = "'Anek Latin', 'Hanken Grotesk', sans-serif";
  const DISPLAY_DEVA = "'Anek Devanagari', 'Mukta', sans-serif";
  const MONO = "'JetBrains Mono', ui-monospace, 'IBM Plex Mono', Menlo, monospace";

  const TYPE_SCALE = {
    display:[40,44,52,600,'-0.02em'], h1:[26,32,38,600,'-0.01em'], h2:[20,28,32,600,'-0.005em'],
    h3:[16,24,28,600,'0'], body:[14,20,24,400,'0'], caption:[12.5,18,20,400,'+0.004em'],
    cell:[13,18,22,400,'0'], figure:[13,18,18,500,'0']
  };
  const SPACE = { 0:0, px:1, '0.5':2, 1:4, '1.5':6, 2:8, 3:12, 4:16, 5:20, 6:24, 8:32, 10:40, 12:48, 16:64, 20:80, 24:96 };
  const RADIUS = { none:0, xs:4, sm:6, md:8, lg:12, xl:16, '2xl':20, pill:9999 };
  const ELEVATION = {
    light: {
      1:'0 1px 2px -1px rgba(22,28,45,.08), 0 1px 3px rgba(22,28,45,.06)',
      2:'0 4px 8px -2px rgba(22,28,45,.10), 0 2px 4px -2px rgba(22,28,45,.06)',
      3:'0 12px 24px -6px rgba(22,28,45,.14), 0 4px 8px -4px rgba(22,28,45,.08)',
      4:'0 24px 48px -12px rgba(22,28,45,.22), 0 8px 16px -8px rgba(22,28,45,.12)'
    },
    dark: {
      1:'inset 0 1px 0 rgba(255,255,255,.05)',
      2:'inset 0 1px 0 rgba(255,255,255,.06), 0 4px 12px rgba(0,0,0,.4)',
      3:'inset 0 1px 0 rgba(255,255,255,.07), 0 16px 40px rgba(0,0,0,.5)',
      4:'0 24px 56px rgba(0,0,0,.6)'
    }
  };
  const MOTION = {
    dur:{ instant:75, fast:120, base:180, slow:280, slower:420 },
    ease:{
      outQuart:'cubic-bezier(.25,1,.5,1)', outQuint:'cubic-bezier(.22,1,.36,1)',
      outExpo:'cubic-bezier(.16,1,.3,1)', inOutQuart:'cubic-bezier(.76,0,.24,1)',
      standard:'cubic-bezier(.2,0,0,1)', outBack:'cubic-bezier(.34,1.56,.64,1)'
    },
    hover:'120ms cubic-bezier(.25,1,.5,1)', press:'90ms cubic-bezier(.25,1,.5,1)',
    enter:'180ms cubic-bezier(.16,1,.3,1)', exit:'140ms cubic-bezier(.25,1,.5,1)',
    expand:'200ms cubic-bezier(.76,0,.24,1)', page:'280ms cubic-bezier(.76,0,.24,1)',
    modal:'280ms cubic-bezier(.16,1,.3,1)',
    reduced:{ hover:'80ms linear', press:'0ms', enter:'80ms linear', exit:'80ms linear', expand:'0ms', page:'100ms linear', modal:'100ms linear' }
  };

  // ---------------------------------------------------------------
  // 3. Color helpers (hex math for the alpha focus-ring, weekend
  //    tint, and the dark-mode elevation surface ladder).
  // ---------------------------------------------------------------
  function hexToRgb(hex) {
    const h = hex.replace('#', '');
    const full = h.length === 3 ? h.split('').map((ch) => ch + ch).join('') : h;
    const n = parseInt(full, 16);
    return { r:(n >> 16) & 255, g:(n >> 8) & 255, b:n & 255 };
  }
  function rgbToHex(r, g, b) {
    const clamp = (v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0');
    return '#' + clamp(r) + clamp(g) + clamp(b);
  }
  function mix(hexA, hexB, t) {
    const a = hexToRgb(hexA), b = hexToRgb(hexB);
    return rgbToHex(a.r + (b.r - a.r) * t, a.g + (b.g - a.g) * t, a.b + (b.b - a.b) * t);
  }
  function withAlpha(hex, alpha) {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  function lighten(hex, amt) { return mix(hex, '#FFFFFF', amt); }

  function typeStyle(G, role, opts) {
    opts = opts || {};
    const [px, lhL, lhD, w, ls] = G.type[role];
    const deva = !!opts.deva;
    const fam = role === 'display' ? (deva ? G.displayDeva : G.display) : (deva ? G.deva : G.sans);
    return { fontFamily: fam, fontSize: px, lineHeight: (deva ? lhD : lhL) + 'px', fontWeight: w, letterSpacing: deva ? '0' : ls };
  }
  const TABULAR = { fontFeatureSettings: "'tnum' 1, 'lnum' 1" };
  function money(n) { return '₹ ' + n.toLocaleString('en-IN', { minimumFractionDigits:2, maximumFractionDigits:2 }); }

  function serializeG(G, direction, mode) {
    const indent = (obj) => JSON.stringify(obj, null, 2).split('\n').join('\n  ');
    return [
      `// Naveya — exported theme`,
      `// direction: ${direction} · mode: ${mode}`,
      `window.G = {`,
      `  mode: ${JSON.stringify(mode)},`,
      `  c: ${indent(G.c)},`,
      `  sans: ${JSON.stringify(G.sans)},`,
      `  deva: ${JSON.stringify(G.deva)},`,
      `  display: ${JSON.stringify(G.display)},`,
      `  displayDeva: ${JSON.stringify(G.displayDeva)},`,
      `  mono: ${JSON.stringify(G.mono)},`,
      `  type: ${JSON.stringify(G.type)},`,
      `  sp: ${JSON.stringify(G.sp)},`,
      `  r: ${JSON.stringify(G.r)},`,
      `  mo: ${indent(G.mo)},`,
      `};`
    ].join('\n');
  }

  // ---------------------------------------------------------------
  // 4. Sample data — the register + payslip content.
  // ---------------------------------------------------------------
  const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const WEEKEND_IDX = 5;
  const STAFF = [
    { id:'EMP-014', name:'Ananya Rao',      marks:['P','P','P','L','P','H'], netPay:48750.00, status:'Paid' },
    { id:'EMP-021', name:'Vikram Sinha',    marks:['P','P','A','P','P','H'], netPay:41200.00, status:'Paid' },
    { id:'EMP-032', name:'Farida Sheikh',   marks:['P','L','P','P','P','H'], netPay:52300.50, status:'Processing' },
    { id:'EMP-045', name:'Thomas Mathew',   marks:['P','P','P','P','A','H'], netPay:38900.00, status:'Paid' },
    { id:'EMP-058', name:'Priya Nair',      marks:['P','P','P','P','P','H'], netPay:45600.00, status:'Pending' },
    { id:'EMP-067', name:'Rohan Deshmukh',  marks:['A','P','P','L','P','H'], netPay:36750.25, status:'Paid' }
  ];
  const EARNINGS = [['Basic', 28000], ['HRA', 11200], ['Special Allowance', 6500], ['Conveyance', 1600]];
  const DEDUCTIONS = [['Provident Fund', 3360], ['Professional Tax', 200], ['Income Tax (TDS)', 2100], ['ESIC', 190]];

  // ---------------------------------------------------------------
  // 5. Small shared UI atoms.
  // ---------------------------------------------------------------
  function SectionLabel({ G, children }) {
    return <h2 style={{ ...typeStyle(G, 'h3'), color:G.c.ink, margin:'0 0 12px' }}>{children}</h2>;
  }

  function Mark({ kind, G, size }) {
    size = size || 22;
    const c = G.c;
    const cfg = {
      P:{ bg:c.success, fg:c.onSuccess, title:'Present' },
      A:{ bg:c.danger, fg:c.onDanger, title:'Absent' },
      L:{ bg:c.warning, fg:c.onWarning, title:'Leave' },
      H:{ bg:c.info, fg:c.onInfo, title:'Half-day' }
    }[kind];
    return (
      <div title={cfg.title} style={{
        width:size, height:size, borderRadius:G.r.xs, background:cfg.bg,
        display:'flex', alignItems:'center', justifyContent:'center', flex:'0 0 auto'
      }}>
        <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 16 16" fill="none">
          {kind === 'P' && <path d="M2 8.5 L6.5 13 L14 3" stroke={cfg.fg} strokeWidth="2.4" strokeLinecap="square" strokeLinejoin="miter" />}
          {kind === 'A' && (
            <Fragment>
              <line x1="3" y1="3" x2="13" y2="13" stroke={cfg.fg} strokeWidth="2.4" strokeLinecap="square" />
              <line x1="13" y1="3" x2="3" y2="13" stroke={cfg.fg} strokeWidth="2.4" strokeLinecap="square" />
            </Fragment>
          )}
          {kind === 'L' && <line x1="2.5" y1="8" x2="13.5" y2="8" stroke={cfg.fg} strokeWidth="2.6" strokeLinecap="square" />}
          {kind === 'H' && (
            <Fragment>
              <circle cx="8" cy="8" r="6" stroke={cfg.fg} strokeWidth="1.6" fill="none" />
              <path d="M8 2 A6 6 0 0 1 8 14 Z" fill={cfg.fg} />
            </Fragment>
          )}
        </svg>
      </div>
    );
  }

  function ThemedButton({ G, variant, disabled, children }) {
    variant = variant || 'primary';
    const c = G.c;
    const [hover, setHover] = useState(false);
    const [press, setPress] = useState(false);
    const variants = {
      primary:{ bg:c.action, fg:c.onAction, border:'transparent' },
      accent:{ bg:c.accent, fg:c.onAccent, border:'transparent' },
      ghost:{ bg: hover ? withAlpha(c.ink, 0.06) : 'transparent', fg:c.ink, border:c.border }
    };
    const v = variants[variant];
    return (
      <button
        disabled={disabled}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => { setHover(false); setPress(false); }}
        onMouseDown={() => setPress(true)}
        onMouseUp={() => setPress(false)}
        style={{
          fontFamily:G.sans, fontSize:13.5, fontWeight:600,
          padding:`${G.sp[2]}px ${G.sp[4]}px`, borderRadius:G.r.sm,
          background:v.bg, color:v.fg, border:`1px solid ${v.border}`,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.45 : 1,
          transform: press && !disabled ? 'scale(.98)' : 'scale(1)',
          transition:`transform ${G.mo.dur.fast}ms ${G.mo.ease.outQuart}, background ${G.mo.dur.fast}ms ${G.mo.ease.outQuart}`
        }}
      >
        {children}
      </button>
    );
  }

  function IconButton({ G }) {
    const c = G.c;
    const [hover, setHover] = useState(false);
    return (
      <button
        aria-label="Add"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          width:32, height:32, borderRadius:G.r.sm, border:`1px solid ${c.border}`,
          background: hover ? withAlpha(c.ink, 0.06) : c.surface,
          display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
          transition:`background ${G.mo.dur.fast}ms ${G.mo.ease.outQuart}`
        }}
      >
        <svg width="14" height="14" viewBox="0 0 16 16">
          <line x1="8" y1="2" x2="8" y2="14" stroke={c.ink} strokeWidth="2" strokeLinecap="square" />
          <line x1="2" y1="8" x2="14" y2="8" stroke={c.ink} strokeWidth="2" strokeLinecap="square" />
        </svg>
      </button>
    );
  }

  function TextField({ G, label, placeholder }) {
    const [focused, setFocused] = useState(false);
    const c = G.c;
    return (
      <label style={{ display:'flex', flexDirection:'column', gap:6, fontFamily:G.sans }}>
        <span style={{ fontSize:12.5, color:c.inkMuted, fontWeight:500 }}>{label}</span>
        <input
          type="text" placeholder={placeholder}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            font:'inherit', fontSize:14, padding:`${G.sp[2]}px ${G.sp[3]}px`, borderRadius:G.r.sm,
            border:`1px solid ${focused ? c.accent : c.border}`, background:c.surface, color:c.ink, width:220,
            outline: focused ? `2px solid ${withAlpha(c.accent, 0.55)}` : '2px solid transparent', outlineOffset:2,
            transition:`border ${G.mo.dur.fast}ms ${G.mo.ease.outQuart}`
          }}
        />
      </label>
    );
  }

  function SelectField({ G, label, options }) {
    const [focused, setFocused] = useState(false);
    const c = G.c;
    return (
      <label style={{ display:'flex', flexDirection:'column', gap:6, fontFamily:G.sans }}>
        <span style={{ fontSize:12.5, color:c.inkMuted, fontWeight:500 }}>{label}</span>
        <select
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            font:'inherit', fontSize:14, padding:`${G.sp[2]}px ${G.sp[3]}px`, borderRadius:G.r.sm,
            border:`1px solid ${focused ? c.accent : c.border}`, background:c.surface, color:c.ink, width:220,
            outline: focused ? `2px solid ${withAlpha(c.accent, 0.55)}` : '2px solid transparent', outlineOffset:2,
            transition:`border ${G.mo.dur.fast}ms ${G.mo.ease.outQuart}`
          }}
        >
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </label>
    );
  }

  function SearchField({ G, placeholder }) {
    const [focused, setFocused] = useState(false);
    const c = G.c;
    return (
      <label style={{ display:'flex', flexDirection:'column', gap:6, fontFamily:G.sans }}>
        <span style={{ fontSize:12.5, color:c.inkMuted, fontWeight:500 }}>Search staff</span>
        <div style={{ position:'relative', width:220 }}>
          <svg width="14" height="14" viewBox="0 0 16 16" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)' }}>
            <circle cx="7" cy="7" r="5" stroke={c.inkMuted} strokeWidth="1.6" fill="none" />
            <line x1="11" y1="11" x2="15" y2="15" stroke={c.inkMuted} strokeWidth="1.6" strokeLinecap="square" />
          </svg>
          <input
            type="search" placeholder={placeholder}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
            style={{
              font:'inherit', fontSize:14, boxSizing:'border-box', width:'100%',
              padding:`${G.sp[2]}px ${G.sp[3]}px ${G.sp[2]}px 30px`, borderRadius:G.r.sm,
              border:`1px solid ${focused ? c.accent : c.border}`, background:c.surface, color:c.ink,
              outline: focused ? `2px solid ${withAlpha(c.accent, 0.55)}` : '2px solid transparent', outlineOffset:2,
              transition:`border ${G.mo.dur.fast}ms ${G.mo.ease.outQuart}`
            }}
          />
        </div>
      </label>
    );
  }

  // ---------------------------------------------------------------
  // 6. Sample surface sections.
  // ---------------------------------------------------------------
  function TypographySpecimen({ G }) {
    const c = G.c;
    return (
      <section style={{ marginBottom:G.sp[10] }}>
        <SectionLabel G={G}>Typography</SectionLabel>
        <div style={{ ...typeStyle(G, 'display'), color:c.ink, marginBottom:G.sp[2] }}>Naveya payroll register</div>
        <div style={{ ...typeStyle(G, 'h1'), color:c.ink, marginBottom:G.sp[2] }}>Attendance & payroll, ruled</div>
        <div style={{ ...typeStyle(G, 'h2'), color:c.ink, marginBottom:G.sp[2] }}>June disbursement cycle</div>
        <div style={{ ...typeStyle(G, 'body'), color:c.ink, marginBottom:G.sp[2], maxWidth:520 }}>
          Every rupee is Decimal, shown as Decimal, and never truncated — the register resolves rightward from marks to net pay.
        </div>
        <div style={{ ...typeStyle(G, 'caption'), color:c.inkMuted, marginBottom:G.sp[4] }}>Updated moments ago</div>

        <div style={{ ...typeStyle(G, 'display', { deva:true }), color:c.ink, marginBottom:G.sp[3] }}>नमस्ते, अनन्या</div>

        <div style={{ display:'flex', alignItems:'baseline', gap:G.sp[2], marginBottom:G.sp[4] }}>
          <span style={{ ...typeStyle(G, 'h3'), color:c.ink }}>Leave balance</span>
          <span style={{ ...typeStyle(G, 'h3'), color:c.inkMuted }}>।</span>
          <span style={{ ...typeStyle(G, 'h3', { deva:true }), color:c.ink }}>अवकाश शेष</span>
        </div>

        <div style={{ fontFamily:G.mono, fontSize:22, fontWeight:500, color:c.ink, ...TABULAR }}>₹ 48,750.00</div>
      </section>
    );
  }

  function ButtonsRow({ G }) {
    return (
      <section style={{ marginBottom:G.sp[10] }}>
        <SectionLabel G={G}>Buttons</SectionLabel>
        <div style={{ display:'flex', gap:G.sp[3], alignItems:'center', flexWrap:'wrap' }}>
          <ThemedButton G={G} variant="primary">Save changes</ThemedButton>
          <ThemedButton G={G} variant="accent">Approve</ThemedButton>
          <ThemedButton G={G} variant="ghost">Cancel</ThemedButton>
          <ThemedButton G={G} variant="primary" disabled>Disabled</ThemedButton>
          <IconButton G={G} />
        </div>
      </section>
    );
  }

  function InputsRow({ G }) {
    return (
      <section style={{ marginBottom:G.sp[10] }}>
        <SectionLabel G={G}>Inputs</SectionLabel>
        <div style={{ display:'flex', gap:G.sp[5], flexWrap:'wrap' }}>
          <TextField G={G} label="Employee name" placeholder="Ananya Rao" />
          <SelectField G={G} label="Department" options={['All departments', 'Teaching', 'Administration', 'Facilities']} />
          <SearchField G={G} placeholder="Search by name or ID" />
        </div>
      </section>
    );
  }

  function MarksBadges({ G }) {
    const c = G.c;
    const items = [['P', 'Present'], ['A', 'Absent'], ['L', 'Leave'], ['H', 'Half-day']];
    return (
      <section style={{ marginBottom:G.sp[10] }}>
        <SectionLabel G={G}>Attendance marks</SectionLabel>
        <div style={{ display:'flex', gap:G.sp[6], flexWrap:'wrap' }}>
          {items.map(([k, label]) => (
            <div key={k} style={{ display:'flex', alignItems:'center', gap:G.sp[2] }}>
              <Mark kind={k} G={G} size={26} />
              <span style={{ fontFamily:G.sans, fontSize:13, color:c.ink }}>{label}</span>
            </div>
          ))}
        </div>
      </section>
    );
  }

  function TheRegister({ G, density }) {
    const c = G.c;
    const rowH = density === 'compact' ? 36 : 44;
    const padV = density === 'compact' ? G.sp[2] : G.sp[3];
    const padH = density === 'compact' ? G.sp[3] : G.sp[4];
    const cols = '6px 176px repeat(6, minmax(46px, 1fr)) 84px 128px 104px';
    const weekendTint = withAlpha(c.ink, 0.045);

    const cellBase = {
      display:'flex', alignItems:'center', padding:`${padV}px ${padH}px`,
      borderBottom:`1px solid ${c.border}`, minHeight:rowH, boxSizing:'border-box'
    };
    const headCell = {
      ...cellBase, fontFamily:G.mono, fontSize:11, letterSpacing:'.06em',
      color:c.inkMuted, fontWeight:500, textTransform:'uppercase'
    };
    // structural "laal kinaara" record rule — a dedicated grid column of
    // accent-filled cells running the full height of the table, never a
    // border-left on a card.
    const ruleCell = { ...cellBase, background:c.accent, borderBottom:'none' };

    const presentCount = (row) => row.marks.filter((m) => m === 'P').length + row.marks.filter((m) => m === 'H').length * 0.5;
    const presentTotal = STAFF.reduce((s, r) => s + presentCount(r), 0);
    const netTotal = STAFF.reduce((s, r) => s + r.netPay, 0);

    const statusColors = (status) => {
      const map = { Paid:['success', 'onSuccess'], Processing:['info', 'onInfo'], Pending:['warning', 'onWarning'] };
      const [bgKey, fgKey] = map[status] || map.Pending;
      return { background:c[bgKey], color:c[fgKey] };
    };

    return (
      <section style={{ marginBottom:G.sp[10] }}>
        <SectionLabel G={G}>The Register — payroll muster</SectionLabel>
        <div style={{ display:'grid', gridTemplateColumns:cols, border:`1px solid ${c.border}`, borderRadius:G.r.md, overflow:'hidden', background:c.surface }}>
          {/* header row */}
          <div style={ruleCell} />
          <div style={headCell}>Staff</div>
          {DAYS.map((d, i) => (
            <div key={d} style={{ ...headCell, justifyContent:'center', background: i === WEEKEND_IDX ? weekendTint : 'transparent' }}>{d}</div>
          ))}
          <div style={{ ...headCell, justifyContent:'flex-end' }}>Present</div>
          <div style={{ ...headCell, justifyContent:'flex-end' }}>Net Pay</div>
          <div style={{ ...headCell, justifyContent:'center' }}>Status</div>

          {/* data rows */}
          {STAFF.map((row) => (
            <Fragment key={row.id}>
              <div style={ruleCell} />
              <div style={{ ...cellBase, flexDirection:'column', alignItems:'flex-start', gap:2 }}>
                <span style={{ fontFamily:G.sans, fontSize:13, fontWeight:500, color:c.ink }}>{row.name}</span>
                <span style={{ fontFamily:G.mono, fontSize:11, color:c.inkMuted }}>{row.id}</span>
              </div>
              {row.marks.map((m, i) => (
                <div key={i} style={{ ...cellBase, justifyContent:'center', background: i === WEEKEND_IDX ? weekendTint : 'transparent' }}>
                  <Mark kind={m} G={G} size={density === 'compact' ? 20 : 24} />
                </div>
              ))}
              <div style={{ ...cellBase, justifyContent:'flex-end', fontFamily:G.mono, fontSize:13, color:c.ink, ...TABULAR }}>
                {presentCount(row).toFixed(1)}
              </div>
              <div style={{ ...cellBase, justifyContent:'flex-end', fontFamily:G.mono, fontSize:13, color:c.ink, ...TABULAR }}>
                {money(row.netPay)}
              </div>
              <div style={{ ...cellBase, justifyContent:'center' }}>
                <span style={{ ...statusColors(row.status), fontFamily:G.sans, fontSize:11.5, fontWeight:600, padding:'3px 10px', borderRadius:G.r.pill }}>
                  {row.status}
                </span>
              </div>
            </Fragment>
          ))}

          {/* summing footer row — ruled line above totals */}
          <div style={ruleCell} />
          <div style={{ ...cellBase, borderTop:`2px solid ${c.border}`, fontFamily:G.mono, fontSize:11, letterSpacing:'.05em', color:c.inkMuted, textTransform:'uppercase' }}>
            Totals
          </div>
          {DAYS.map((d, i) => (
            <div key={'f' + d} style={{ ...cellBase, borderTop:`2px solid ${c.border}`, background: i === WEEKEND_IDX ? weekendTint : 'transparent' }} />
          ))}
          <div style={{ ...cellBase, borderTop:`2px solid ${c.border}`, justifyContent:'flex-end', fontFamily:G.mono, fontSize:13, fontWeight:600, color:c.ink, ...TABULAR }}>
            {presentTotal.toFixed(1)}
          </div>
          <div style={{ ...cellBase, borderTop:`2px solid ${c.border}`, justifyContent:'flex-end', fontFamily:G.mono, fontSize:13, fontWeight:600, color:c.ink, ...TABULAR }}>
            {money(netTotal)}
          </div>
          <div style={{ ...cellBase, borderTop:`2px solid ${c.border}` }} />
        </div>
      </section>
    );
  }

  function PayslipLedger({ G }) {
    const c = G.c;
    const sum = (arr) => arr.reduce((s, [, v]) => s + v, 0);
    const earnTotal = sum(EARNINGS), dedTotal = sum(DEDUCTIONS), net = earnTotal - dedTotal;

    function Col({ title, rows, total }) {
      return (
        <div style={{ flex:1, minWidth:240 }}>
          <div style={{ fontFamily:G.mono, fontSize:11, letterSpacing:'.05em', color:c.inkMuted, textTransform:'uppercase', marginBottom:G.sp[2] }}>{title}</div>
          {rows.map(([label, val]) => (
            <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:`${G.sp['1.5']}px 0`, borderBottom:`1px solid ${c.border}` }}>
              <span style={{ fontFamily:G.sans, fontSize:13.5, color:c.ink }}>{label}</span>
              <span style={{ fontFamily:G.mono, fontSize:13, color:c.ink, ...TABULAR }}>{val.toLocaleString('en-IN', { minimumFractionDigits:2, maximumFractionDigits:2 })}</span>
            </div>
          ))}
          <div style={{ display:'flex', justifyContent:'space-between', padding:`${G.sp[2]}px 0`, borderTop:`2px solid ${c.border}`, marginTop:G.sp[1] }}>
            <span style={{ fontFamily:G.sans, fontSize:13.5, fontWeight:600, color:c.ink }}>Total</span>
            <span style={{ fontFamily:G.mono, fontSize:13, fontWeight:600, color:c.ink, ...TABULAR }}>{total.toLocaleString('en-IN', { minimumFractionDigits:2, maximumFractionDigits:2 })}</span>
          </div>
        </div>
      );
    }

    return (
      <section style={{ marginBottom:G.sp[10] }}>
        <SectionLabel G={G}>Payslip ledger</SectionLabel>
        <div style={{ display:'flex', gap:G.sp[8], flexWrap:'wrap', background:c.surface, border:`1px solid ${c.border}`, borderRadius:G.r.lg, padding:G.sp[6] }}>
          <Col title="Earnings" rows={EARNINGS} total={earnTotal} />
          <Col title="Deductions" rows={DEDUCTIONS} total={dedTotal} />
        </div>
        <div style={{ marginTop:G.sp[3], display:'flex', justifyContent:'space-between', alignItems:'baseline', background:c.accentSoft, borderRadius:G.r.md, padding:`${G.sp[3]}px ${G.sp[4]}px` }}>
          <span style={{ fontFamily:G.sans, fontSize:15, fontWeight:600, color:c.ink }}>Net Pay</span>
          <span style={{ fontFamily:G.mono, fontSize:20, fontWeight:600, color:c.accent, ...TABULAR }}>{money(net)}</span>
        </div>
      </section>
    );
  }

  function ElevationDemo({ G }) {
    const c = G.c;
    const isDark = G.mode === 'dark';
    const ladder = isDark
      ? [c.surface, c.raised, lighten(c.raised, 0.045), lighten(c.raised, 0.09)]
      : [c.raised, c.raised, c.raised, c.raised];
    return (
      <section style={{ marginBottom:G.sp[10] }}>
        <SectionLabel G={G}>Elevation</SectionLabel>
        <div style={{ display:'flex', gap:G.sp[5], flexWrap:'wrap' }}>
          {[1, 2, 3, 4].map((lvl, i) => (
            <div key={lvl} style={{
              width:120, height:88, borderRadius:G.r.lg, background:ladder[i],
              boxShadow:G.el[lvl], border: isDark ? 'none' : `1px solid ${c.border}`,
              display:'flex', alignItems:'flex-end', padding:G.sp[3]
            }}>
              <span style={{ fontFamily:G.mono, fontSize:11, color:c.inkMuted }}>level {lvl}</span>
            </div>
          ))}
        </div>
      </section>
    );
  }

  function StateSwatches({ G }) {
    const c = G.c;
    const items = [['success', 'onSuccess', 'Success'], ['warning', 'onWarning', 'Warning'], ['danger', 'onDanger', 'Danger'], ['info', 'onInfo', 'Info']];
    return (
      <section style={{ marginBottom:G.sp[10] }}>
        <SectionLabel G={G}>State swatches</SectionLabel>
        <div style={{ display:'flex', gap:G.sp[3], flexWrap:'wrap' }}>
          {items.map(([bg, fg, label]) => (
            <span key={bg} style={{ background:c[bg], color:c[fg], fontFamily:G.sans, fontSize:13, fontWeight:600, padding:`${G.sp[2]}px ${G.sp[4]}px`, borderRadius:G.r.pill }}>
              {label}
            </span>
          ))}
        </div>
        <p style={{ fontFamily:G.sans, fontSize:12.5, color:c.inkMuted, marginTop:G.sp[2], maxWidth:480 }}>
          Warning renders as fill + ink text only — it fails AA as small caption text on its own, so it never appears as loose colored copy.
        </p>
      </section>
    );
  }

  // ---------------------------------------------------------------
  // 7. Control rail.
  // ---------------------------------------------------------------
  const RAIL_W = 300;

  function RailLabel({ G, children }) {
    return <div style={{ fontFamily:G.sans, fontSize:12, fontWeight:600, color:G.c.inkMuted, marginBottom:6 }}>{children}</div>;
  }

  function ToggleRow({ G, options, value, onChange }) {
    const c = G.c;
    return (
      <div style={{ display:'flex', border:`1px solid ${c.border}`, borderRadius:G.r.sm, overflow:'hidden' }}>
        {options.map(([val, label]) => (
          <button
            key={val} onClick={() => onChange(val)}
            style={{
              flex:1, fontFamily:G.sans, fontSize:12, fontWeight:600, padding:'7px 8px', cursor:'pointer', border:'none',
              background: value === val ? c.action : 'transparent', color: value === val ? c.onAction : c.ink
            }}
          >
            {label}
          </button>
        ))}
      </div>
    );
  }

  function HexField({ G, label, value, onChange }) {
    const [text, setText] = useState(value);
    useEffect(() => { setText(value); }, [value]);
    const c = G.c;
    const commit = (v) => { if (/^#[0-9a-fA-F]{6}$/.test(v)) onChange(v); };
    const safe = /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#000000';
    return (
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <input
          type="color" value={safe} onChange={(e) => onChange(e.target.value)}
          style={{ width:28, height:28, padding:0, border:`1px solid ${c.border}`, borderRadius:G.r.xs, cursor:'pointer', flex:'0 0 auto' }}
        />
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:G.sans, fontSize:11.5, color:c.inkMuted }}>{label}</div>
          <input
            type="text" value={text}
            onChange={(e) => { setText(e.target.value); commit(e.target.value); }}
            onBlur={() => setText(value)}
            style={{
              width:'100%', fontFamily:G.mono, fontSize:12, color:c.ink, background:c.bg,
              border:`1px solid ${c.border}`, borderRadius:G.r.xs, padding:'3px 6px', boxSizing:'border-box'
            }}
          />
        </div>
      </div>
    );
  }

  function ControlRail({ G, direction, setDirection, mode, setMode, density, setDensity, live, setToken, resetTheme, directions }) {
    const c = G.c;
    return (
      <aside style={{
        position:'fixed', left:0, top:0, width:RAIL_W, height:'100vh', overflowY:'auto',
        background:c.surface, borderRight:`1px solid ${c.border}`, padding:G.sp[4], boxSizing:'border-box',
        display:'flex', flexDirection:'column', gap:G.sp[5], fontFamily:G.sans, zIndex:10
      }}>
        <div>
          <div style={{ fontFamily:G.display, fontSize:18, fontWeight:600, color:c.ink }}>Naveya</div>
          <div style={{ fontFamily:G.mono, fontSize:11, color:c.inkMuted, letterSpacing:'.04em' }}>theme playground</div>
        </div>

        <div>
          <RailLabel G={G}>Direction</RailLabel>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {directions.map((d) => (
              <button
                key={d} onClick={() => setDirection(d)}
                style={{
                  textAlign:'left', fontFamily:G.sans, fontSize:13, fontWeight:600, padding:'8px 10px',
                  borderRadius:G.r.sm, cursor:'pointer',
                  border:`1px solid ${d === direction ? c.accent : c.border}`,
                  background: d === direction ? c.accentSoft : 'transparent', color:c.ink
                }}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display:'flex', gap:G.sp[4] }}>
          <div style={{ flex:1 }}>
            <RailLabel G={G}>Mode</RailLabel>
            <ToggleRow G={G} options={[['light', 'Light'], ['dark', 'Dark']]} value={mode} onChange={setMode} />
          </div>
          <div style={{ flex:1 }}>
            <RailLabel G={G}>Density</RailLabel>
            <ToggleRow G={G} options={[['compact', 'Compact'], ['comfortable', 'Comfortable']]} value={density} onChange={setDensity} />
          </div>
        </div>

        <div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
            <RailLabel G={G}>Tokens</RailLabel>
            <button
              onClick={resetTheme}
              style={{ fontFamily:G.mono, fontSize:11, color:c.accent, background:'transparent', border:'none', cursor:'pointer', textDecoration:'underline', padding:0 }}
            >
              Reset
            </button>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {EDITABLE_TOKENS.map(({ key, label }) => (
              <HexField key={key} G={G} label={label} value={live[key]} onChange={(v) => setToken(key, v)} />
            ))}
          </div>
        </div>

        <div>
          <RailLabel G={G}>Export window.G</RailLabel>
          <textarea
            readOnly value={serializeG(G, direction, mode)} onFocus={(e) => e.target.select()}
            style={{
              width:'100%', height:180, fontFamily:G.mono, fontSize:10.5, color:c.ink, background:c.bg,
              border:`1px solid ${c.border}`, borderRadius:G.r.sm, padding:8, boxSizing:'border-box', resize:'vertical'
            }}
          />
        </div>
      </aside>
    );
  }

  // ---------------------------------------------------------------
  // 8. App.
  // ---------------------------------------------------------------
  function App() {
    const DIRECTIONS = Object.keys(THEMES);
    const [direction, setDirection] = useState(DIRECTIONS[0]);
    const [mode, setMode] = useState('light');
    const [density, setDensity] = useState('compact');

    const computeBase = useCallback((dir, m) => ({ ...THEMES[dir][m], ...STATES[m] }), []);
    const [live, setLive] = useState(() => computeBase(DIRECTIONS[0], 'light'));

    useEffect(() => { setLive(computeBase(direction, mode)); }, [direction, mode, computeBase]);

    const setToken = (key, value) => setLive((p) => ({ ...p, [key]:value }));
    const resetTheme = () => setLive(computeBase(direction, mode));

    const G = {
      c:live, mode, density,
      sans:SANS, deva:DEVA, display:DISPLAY, displayDeva:DISPLAY_DEVA, mono:MONO,
      type:TYPE_SCALE, sp:SPACE, r:RADIUS,
      el: mode === 'dark' ? ELEVATION.dark : ELEVATION.light,
      mo:MOTION
    };

    return (
      <div style={{ minHeight:'100vh', background:G.c.bg, color:G.c.ink, fontFamily:G.sans, transition:`background ${G.mo.dur.base}ms ${G.mo.ease.outQuart}` }}>
        <ControlRail
          G={G} direction={direction} setDirection={setDirection} mode={mode} setMode={setMode}
          density={density} setDensity={setDensity} live={live} setToken={setToken} resetTheme={resetTheme}
          directions={DIRECTIONS}
        />
        <main style={{ marginLeft:RAIL_W, padding:G.sp[8], maxWidth:1040 }}>
          <div style={{ ...typeStyle(G, 'caption'), color:G.c.inkMuted, marginBottom:G.sp[6], textTransform:'uppercase', letterSpacing:'.06em' }}>
            {direction} · {mode} · {density}
          </div>
          <TypographySpecimen G={G} />
          <ButtonsRow G={G} />
          <InputsRow G={G} />
          <MarksBadges G={G} />
          <TheRegister G={G} density={density} />
          <PayslipLedger G={G} />
          <ElevationDemo G={G} />
          <StateSwatches G={G} />
        </main>
      </div>
    );
  }

  ReactDOM.createRoot(document.getElementById('root')).render(<App />);
})();
