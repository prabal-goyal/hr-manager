/* ============================================================
   pages/substitution.jsx — Substitution Board (admin/HR)
   Faithful port of design/mockups/SubstitutionBoard.dc.html — the
   user's explicitly-approved reference — rebuilt from window.UI2's
   register-grammar primitives (ActionBar/Masthead/Register/
   StatusFooter/Figure/Mark) instead of the mockup's raw markup.

   CONTENT ONLY: no rail/shell. A separate wiring agent mounts this
   inside the approved Home-variant-A rail (design/v2/variants/
   home-a.jsx) — per the coordinator note "I liked the substitution
   board, but that doesn't mean we switch the sidebar etc." This file
   owns its own ActionBar → Masthead → body (Absent panel + Register)
   → StatusFooter column and assumes it is mounted into a full-bleed
   content region that already has a defined height.

   Data + totals are DERIVED (computeTotals over GRID), not hand-typed
   magic numbers — the mockup's own masthead figure (a static "6,300")
   does not actually reconcile with its GRID array (real sum is 6,450);
   this port recomputes so the masthead figure, the Register's
   per-column totals, the "14 of 18 periods assigned" meta line and
   the "4 periods open" / "Δ 4 OPEN" marks all agree with one another
   (grammar rule 3, "everything sums", read literally: the numbers on
   screen must actually add up, not just look like they do).

   Classic-JSX-runtime IIFE, no imports/exports, inline styles only,
   colour/type/space read from window.G2, components from window.UI2.
   Fonts are read via UI2.Fonts (NOT window.G2.sans/deva — see
   .claude/agent-memory/green-lantern/register_grammar_kit.md).
   ============================================================ */
(function () {
  const { useState, useMemo } = React;
  const G = window.G2;
  const {
    useTheme, useLang, ActionBar, Masthead, StatusFooter, Register,
    Button, Select, Figure, inr, Fonts, withAlpha,
  } = window.UI2;

  const TABULAR = { fontFeatureSettings: "'tnum' 1, 'lnum' 1" };

  // ---------------------------------------------------------------
  // Local i18n overlay — substitution-board-only strings layered on
  // top of the kit's useLang()/t(). Same pattern as variants/home-a.jsx.
  // ---------------------------------------------------------------
  const LOCAL_STRINGS = {
    en: {
      "sub.badge": "PHASE 2",
      "sub.crumb1": "Substitutions",
      "sub.crumb2": "Today's arrangement",
      "sub.campusLabel": "Campus",
      "sub.periodsOpen": "periods open",
      "sub.publish": "Publish arrangement",
      "sub.kicker": "Arrangement sheet · drawn from the live timetable",
      "sub.titleDate": "Tuesday, 11 August",
      "sub.titleDeva": "व्यवस्था पत्रक",
      "sub.staffAbsent": "staff absent",
      "sub.periodsNeedingCover": "periods needing cover",
      "sub.publishedAt": "published to staff app at",
      "sub.figureKicker": "Honorarium to August payroll",
      "sub.of": "of",
      "sub.periodsAssignedMid": "periods assigned · posts under",
      "sub.absentToday": "Absent today",
      "sub.periodsSuffix": "periods",
      "sub.reasonSick": "Sick leave",
      "sub.reasonCasual": "Casual leave",
      "sub.reasonOnDuty": "On duty · Inter-school",
      "sub.reasonHalfDay": "Half day · post-lunch",
      "sub.leaveSyncNote": "Leave approvals sync from the leave ledger each morning at 06:00. Half-days release only the affected half of the timetable.",
      "sub.colPeriod": "Period",
      "sub.unassigned": "Unassigned",
      "sub.totalsLabel": "Total honorarium",
      "sub.footerRule": "No teacher may take more than 2 substitutions a day or exceed 6 teaching periods",
      "sub.footerNote": "Every assignment writes an audited honorarium line into the open payroll run",
      "sub.openTag": "OPEN",
      "sub.coverLabel": "Cover",
      "sub.freeEligible": "Free and eligible now",
      "sub.freeAt": "Free",
      "sub.subsThisMonth": "sub(s) this month",
      "sub.guestMeta": "Guest faculty · paid per period",
      "sub.tagBest": "best match",
      "sub.tagSameDept": "same dept",
      "sub.tagCrossSubject": "cross-subject",
      "sub.tagGuest": "guest",
      "sub.assign": "Assign",
      "sub.closePopover": "Close",
      "sub.roleTeacher": "Teacher",
      "sub.roleTransportCoord": "Transport Coordinator",
      "sub.emptyGridTitle": "No open periods",
      "sub.emptyGridDesc": "Every period today already has a substitute assigned or needs no cover.",
      "sub.emptyAbsentTitle": "No staff absent today",
      "sub.emptyAbsentDesc": "Every teacher is in class as scheduled.",
    },
    hi: {
      "sub.badge": "चरण 2",
      "sub.crumb1": "स्थानापन्न व्यवस्था",
      "sub.crumb2": "आज की व्यवस्था",
      "sub.campusLabel": "परिसर",
      "sub.periodsOpen": "अवधि खुली हैं",
      "sub.publish": "व्यवस्था प्रकाशित करें",
      "sub.kicker": "व्यवस्था पत्रक · लाइव समय-सारणी से तैयार",
      "sub.titleDate": "मंगलवार, 11 अगस्त",
      "sub.titleDeva": "व्यवस्था पत्रक",
      "sub.staffAbsent": "स्टाफ अनुपस्थित",
      "sub.periodsNeedingCover": "अवधियों को कवर चाहिए",
      "sub.publishedAt": "स्टाफ ऐप पर प्रकाशित किया गया",
      "sub.figureKicker": "अगस्त वेतन में मानदेय",
      "sub.of": "में से",
      "sub.periodsAssignedMid": "अवधि नियत · इसके अंतर्गत दर्ज",
      "sub.absentToday": "आज अनुपस्थित",
      "sub.periodsSuffix": "अवधि",
      "sub.reasonSick": "बीमारी अवकाश",
      "sub.reasonCasual": "आकस्मिक अवकाश",
      "sub.reasonOnDuty": "ड्यूटी पर · अंतर-विद्यालय",
      "sub.reasonHalfDay": "आधा दिन · दोपहर बाद",
      "sub.leaveSyncNote": "अवकाश स्वीकृतियाँ प्रतिदिन सुबह 06:00 बजे अवकाश लेजर से समन्वित होती हैं। आधे दिन के अवकाश में समय-सारणी का केवल प्रभावित आधा भाग ही मुक्त होता है।",
      "sub.colPeriod": "अवधि",
      "sub.unassigned": "अनियत",
      "sub.totalsLabel": "कुल मानदेय",
      "sub.footerRule": "कोई भी शिक्षक एक दिन में 2 से अधिक प्रतिस्थापन या 6 शिक्षण अवधियों से अधिक नहीं ले सकता",
      "sub.footerNote": "प्रत्येक नियुक्ति चालू पेरोल रन में एक ऑडिट मानदेय पंक्ति दर्ज करती है",
      "sub.openTag": "खुला",
      "sub.coverLabel": "कवर",
      "sub.freeEligible": "अभी मुक्त और योग्य",
      "sub.freeAt": "मुक्त",
      "sub.subsThisMonth": "इस माह प्रतिस्थापन",
      "sub.guestMeta": "अतिथि संकाय · प्रति अवधि भुगतान",
      "sub.tagBest": "सर्वोत्तम मेल",
      "sub.tagSameDept": "समान विभाग",
      "sub.tagCrossSubject": "अंतर-विषय",
      "sub.tagGuest": "अतिथि",
      "sub.assign": "नियुक्त करें",
      "sub.closePopover": "बंद करें",
      "sub.roleTeacher": "अध्यापक",
      "sub.roleTransportCoord": "परिवहन समन्वयक",
      "sub.emptyGridTitle": "कोई खुली अवधि नहीं",
      "sub.emptyGridDesc": "आज की हर अवधि में पहले से प्रतिस्थापन नियत है या कवर की आवश्यकता नहीं है।",
      "sub.emptyAbsentTitle": "आज कोई स्टाफ अनुपस्थित नहीं",
      "sub.emptyAbsentDesc": "हर अध्यापक निर्धारित अनुसार कक्षा में है।",
    },
  };
  function useT2() {
    const { t, lang } = useLang();
    const t2 = (key) => {
      const table = LOCAL_STRINGS[lang] || LOCAL_STRINGS.en;
      return table[key] !== undefined ? table[key] : t(key);
    };
    return { t2, t, lang };
  }

  // Subject/department names — small closed vocabulary, translated
  // separately from the STRINGS table since they're used both as
  // absent-teacher role lines AND grid column headers.
  const SUBJECT_LABEL = {
    en: { hindi: "Hindi", english: "English", chemistry: "Chemistry", physics: "Physics", lab: "Lab", maths: "Maths", robotics: "Robotics", transport: "Transport" },
    hi: { hindi: "हिंदी", english: "अंग्रेज़ी", chemistry: "रसायन विज्ञान", physics: "भौतिकी", lab: "लैब", maths: "गणित", robotics: "रोबोटिक्स", transport: "परिवहन" },
  };
  function subjectLabel(key, lang) {
    if (!key) return "";
    const table = SUBJECT_LABEL[lang] || SUBJECT_LABEL.en;
    return table[key] !== undefined ? table[key] : SUBJECT_LABEL.en[key] || key;
  }
  // Abbreviated form for the dense grid column header.
  const SUBJECT_ABBR = {
    en: { hindi: "Hindi", english: "English", chemistry: "Chem", transport: "Transport" },
    hi: { hindi: "हिंदी", english: "अंग्रेज़ी", chemistry: "रसायन", transport: "परिवहन" },
  };
  function subjectAbbr(key, lang) {
    const table = SUBJECT_ABBR[lang] || SUBJECT_ABBR.en;
    return table[key] !== undefined ? table[key] : SUBJECT_ABBR.en[key] || key;
  }
  function initialSurname(name) {
    const parts = String(name || "").trim().split(/\s+/);
    if (parts.length < 2) return name;
    return `${parts[0][0]}. ${parts[parts.length - 1]}`;
  }

  // ---------------------------------------------------------------
  // Data — realistic Indian-school staff/timetable data, module-level
  // (same shape/content as the shipped mockup's ABSENT/GRID/CANDIDATES
  // consts, kept faithful; column order 0..3 matches ABSENT order 0..3).
  // ---------------------------------------------------------------
  const ABSENT = [
    { name: "Fatima Qureshi", id: "NAV-0311", roleKey: "teacher", subjectKey: "hindi", reasonKey: "sick", periodsCount: 6 },
    { name: "Harpreet Kaur", id: "NAV-0367", roleKey: "teacher", subjectKey: "english", reasonKey: "casual", periodsCount: 5 },
    { name: "Nikhil Bharadwaj", id: "NAV-0288", roleKey: "teacher", subjectKey: "chemistry", reasonKey: "onDuty", periodsCount: 4 },
    { name: "Sunita Bhalla", id: "NAV-0620", roleKey: "transportCoord", subjectKey: "transport", reasonKey: "halfDay", periodsCount: 3 },
  ];

  const REASON_TONE = {
    sick: (c) => ({ bg: c.absentTint, fg: c.absentText }),
    casual: (c) => ({ bg: c.sealSoft, fg: c.seal }),
    onDuty: (c) => ({ bg: c.accentSoft, fg: c.accent }),
    halfDay: (c) => ({ bg: c.sealSoft, fg: c.seal }),
  };
  const REASON_KEY_TO_STRING = { sick: "sub.reasonSick", casual: "sub.reasonCasual", onDuty: "sub.reasonOnDuty", halfDay: "sub.reasonHalfDay" };

  // per-period row: cells[i] aligns to ABSENT[i]'s abandoned periods.
  // cell = null (no class that period) | { label, sub: null (unassigned) | "Name", fee }
  const GRID = [
    { n: 1, time: "07:50", cells: [{ label: "VII-A Hindi", sub: "K. Iyer", fee: 450 }, { label: "X-C English", sub: "L. Nair", fee: 450 }, null, null] },
    { n: 2, time: "08:40", cells: [{ label: "IX-B Hindi", sub: "A. Deshpande", fee: 450 }, null, { label: "XI-A Chemistry", sub: "J. Mathew", fee: 600 }, null] },
    { n: 3, time: "09:30", cells: [null, { label: "VIII-B English", sub: "M. Raghunathan", fee: 450 }, { label: "IX-A Chemistry", sub: "J. Mathew", fee: 600 }, null] },
    { n: 4, time: "10:40", cells: [{ label: "VI-C Hindi", sub: "L. Nair", fee: 450 }, { label: "XII-A English", sub: null, fee: 450 }, null, null] },
    { n: 5, time: "11:30", cells: [{ label: "XI-B Hindi", sub: "D. Singh", fee: 450 }, null, { label: "IX-B Physics", sub: null, fee: 600 }, null] },
    { n: 6, time: "12:20", cells: [null, { label: "VII-B English", sub: "A. Bose", fee: 450 }, { label: "X-A Chemistry", sub: "M. Raghunathan", fee: 600 }, { label: "Transport desk", sub: "R. Menon", fee: 300 }] },
    { n: 7, time: "13:40", cells: [{ label: "X-B Hindi", sub: "K. Iyer", fee: 450 }, { label: "IX-C English", sub: null, fee: 450 }, null, { label: "Dispersal duty", sub: "R. Menon", fee: 300 }] },
    { n: 8, time: "14:30", cells: [{ label: "VIII-A Hindi", sub: "A. Deshpande", fee: 450 }, null, null, { label: "Bus bay check", sub: null, fee: 300 }] },
  ];

  // The one cell the popover demonstrates against — Period 5, column 2
  // (Nikhil Bharadwaj's abandoned IX-B Physics period), matching the
  // shipped mockup's fixed-position popover anchor.
  const POPOVER_ANCHOR = { n: 5, colIndex: 2 };

  const CANDIDATES = [
    { name: "Meera Raghunathan", subjectKey: "physics", tagKey: "best", freeCount: 1 },
    { name: "Joseph Mathew", subjectKey: "lab", tagKey: "sameDept", freeCount: 2 },
    { name: "Kavya Iyer", subjectKey: "maths", tagKey: "crossSubject", freeCount: 0 },
    { name: "Devraj Singh", subjectKey: "robotics", tagKey: "guest", freeCount: null },
  ];
  const TAG_KEY_TO_STRING = { best: "sub.tagBest", sameDept: "sub.tagSameDept", crossSubject: "sub.tagCrossSubject", guest: "sub.tagGuest" };

  const CAMPUSES = [
    { value: "aravali", label: "Aravali Campus" },
    { value: "rohini", label: "Rohini Campus" },
    { value: "sector62", label: "Sector 62 Campus" },
  ];

  // ---------------------------------------------------------------
  // computeTotals — derives every number the screen shows (assigned
  // count, periods needing cover, open count, per-column + grand
  // honorarium) from GRID itself, so the masthead figure, the
  // Register's totals footer and the status marks always agree.
  // ---------------------------------------------------------------
  function computeTotals(grid, colCount) {
    let totalFee = 0, assignedCount = 0, nonEmptyCount = 0;
    const colTotals = new Array(colCount).fill(0);
    grid.forEach((row) => {
      row.cells.forEach((cell, ci) => {
        if (!cell) return;
        nonEmptyCount += 1;
        if (cell.sub) {
          assignedCount += 1;
          totalFee += cell.fee;
          colTotals[ci] += cell.fee;
        }
      });
    });
    return { totalFee, assignedCount, nonEmptyCount, openCount: nonEmptyCount - assignedCount, colTotals };
  }

  function feeText(fee) {
    return `₹${inr(fee, 0)}`;
  }

  // ---------------------------------------------------------------
  // PeriodCell — Register's "period" column cell: P-number + start
  // time, stacked, mono.
  // ---------------------------------------------------------------
  function PeriodCell({ n, time }) {
    const { c } = useTheme();
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <span style={{ fontFamily: Fonts.mono, fontSize: 12.5, fontWeight: 600, color: c.ink, ...TABULAR }}>{`P${n}`}</span>
        <span style={{ fontFamily: Fonts.mono, fontSize: 10, color: c.inkMuted, ...TABULAR }}>{time}</span>
      </div>
    );
  }

  // ---------------------------------------------------------------
  // SubCell — one grid cell: empty / assigned (→ substitute, fee) /
  // unassigned (accent ring — grammar rule 6, "one open field").
  // ---------------------------------------------------------------
  function SubCell({ cell, selected, isAnchor, popoverOpen, onOpenPopover, onSelectColumn, t2 }) {
    const { c } = useTheme();
    if (!cell) {
      return <div style={{ width: "100%", height: "100%" }} />;
    }
    const unassigned = !cell.sub;
    const ring = unassigned ? `inset 0 0 0 1.5px ${c.accent}` : "none";
    const tint = selected ? `inset 0 0 0 999px ${withAlpha(c.accent, 0.05)}` : "none";
    const boxShadow = [ring, tint].filter((s) => s !== "none").join(", ") || "none";
    const clickable = unassigned;
    return (
      <div
        role={clickable ? "button" : undefined}
        tabIndex={clickable ? 0 : undefined}
        onClick={clickable ? () => { onSelectColumn(); if (isAnchor) onOpenPopover(!popoverOpen); } : undefined}
        onKeyDown={clickable ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelectColumn(); if (isAnchor) onOpenPopover(!popoverOpen); } } : undefined}
        style={{
          position: "relative", width: "100%", height: "100%", boxSizing: "border-box",
          padding: "7px 9px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 2,
          background: unassigned ? "transparent" : c.covered, boxShadow, cursor: clickable ? "pointer" : "default",
          minWidth: 0,
        }}
      >
        <div style={{ fontFamily: Fonts.sans, fontSize: 11.5, fontWeight: 600, color: c.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {cell.label}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
          <span style={{ fontFamily: Fonts.sans, fontSize: 11, color: unassigned ? c.accent : c.inkMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {unassigned ? t2("sub.unassigned") : `→ ${cell.sub}`}
          </span>
          <span style={{ fontFamily: Fonts.mono, fontSize: 10, fontWeight: 600, color: unassigned ? c.inkFaint : c.seal, flex: "0 0 auto", ...TABULAR }}>
            {feeText(cell.fee)}
          </span>
        </div>
        {isAnchor && popoverOpen && <AssignPopover t2={t2} onClose={() => onOpenPopover(false)} />}
      </div>
    );
  }

  // ---------------------------------------------------------------
  // AssignPopover — "Free and eligible now" ranked candidates, a
  // genuine floating layer (elevation shadow, per kit's Card
  // convention for popovers/menus/modals).
  // ---------------------------------------------------------------
  function AssignPopover({ t2, onClose }) {
    const { c, mode } = useTheme();
    const anchorRow = GRID.find((r) => r.n === POPOVER_ANCHOR.n);
    const anchorCell = anchorRow && anchorRow.cells[POPOVER_ANCHOR.colIndex];
    return (
      <div
        style={{
          position: "absolute", top: "100%", right: 0, marginTop: 6, width: 314, zIndex: 30,
          background: c.surface, boxShadow: (G.el[mode] && G.el[mode][3]) || G.el.light[3],
          boxSizing: "border-box",
        }}
      >
        <div style={{ padding: "10px 14px 9px", borderBottom: `1px solid ${c.rule}`, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
          <div>
            <div style={{ fontFamily: Fonts.mono, fontSize: 9.5, letterSpacing: ".11em", textTransform: "uppercase", color: c.inkMuted }}>
              {t2("sub.coverLabel")} · {t2("sub.colPeriod")} {POPOVER_ANCHOR.n} · {anchorCell ? anchorCell.label : ""}
            </div>
            <div style={{ fontFamily: Fonts.sans, fontSize: 13.5, fontWeight: 600, color: c.ink, marginTop: 3 }}>{t2("sub.freeEligible")}</div>
          </div>
          <button
            type="button" onClick={onClose} aria-label={t2("sub.closePopover")}
            style={{ border: "none", background: "transparent", color: c.inkMuted, cursor: "pointer", fontSize: 14, lineHeight: 1, padding: 2 }}
          >
            ×
          </button>
        </div>
        {CANDIDATES.map((k, i) => {
          const best = i === 0;
          return (
            <div key={k.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", borderBottom: i < CANDIDATES.length - 1 ? `1px solid ${c.rule}` : "none", background: best ? c.sel : "transparent", boxSizing: "border-box" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontFamily: Fonts.sans, fontSize: 12.5, fontWeight: 600, color: c.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{k.name}</span>
                  <span style={{ padding: "2px 5px", fontFamily: Fonts.mono, fontSize: 9.5, fontWeight: 600, flex: "0 0 auto", background: best ? c.accentSoft : withAlpha(c.ink, 0.06), color: best ? c.accent : c.inkMuted }}>
                    {t2(TAG_KEY_TO_STRING[k.tagKey])}
                  </span>
                </div>
                <div style={{ fontFamily: Fonts.mono, fontSize: 10.5, color: c.inkMuted, marginTop: 2 }}>
                  {k.freeCount === null ? t2("sub.guestMeta") : `${t2("sub.freeAt")} P${POPOVER_ANCHOR.n} · ${k.freeCount} ${t2("sub.subsThisMonth")}`}
                </div>
              </div>
              <Button variant={best ? "primary" : "ghost"} size="sm" style={{ flex: "0 0 auto" }}>{t2("sub.assign")}</Button>
            </div>
          );
        })}
      </div>
    );
  }

  // ---------------------------------------------------------------
  // AbsentCard / AbsentPanel — hairline rows (grammar rule 2), the
  // selected teacher gets a sel background + inset accent margin.
  // ---------------------------------------------------------------
  function AbsentCard({ a, index, selected, onSelect, t2, lang }) {
    const { c } = useTheme();
    const tone = (REASON_TONE[a.reasonKey] || REASON_TONE.sick)(c);
    const roleLine = a.roleKey === "teacher" ? `${t2("sub.roleTeacher")} — ${subjectLabel(a.subjectKey, lang)}` : t2("sub.roleTransportCoord");
    return (
      <div
        role="button" tabIndex={0}
        onClick={() => onSelect(index)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(index); } }}
        style={{
          padding: "12px 14px", borderBottom: `1px solid ${c.rule}`, boxSizing: "border-box", cursor: "pointer",
          background: selected ? c.sel : "transparent", boxShadow: selected ? `inset 2px 0 0 ${c.accent}` : "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
          <span style={{ fontFamily: Fonts.sans, fontSize: 13.5, fontWeight: 600, color: c.ink }}>{a.name}</span>
          <span style={{ fontFamily: Fonts.mono, fontSize: 10, color: c.inkMuted, ...TABULAR }}>{a.id}</span>
        </div>
        <div style={{ fontFamily: Fonts.sans, fontSize: 11.5, color: c.inkMuted, marginTop: 1 }}>{roleLine}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 8 }}>
          <span style={{ padding: "3px 6px", fontFamily: Fonts.sans, fontSize: 10.5, fontWeight: 600, background: tone.bg, color: tone.fg }}>
            {t2(REASON_KEY_TO_STRING[a.reasonKey])}
          </span>
          <span style={{ fontFamily: Fonts.mono, fontSize: 11, color: c.inkMuted, ...TABULAR }}>{a.periodsCount} {t2("sub.periodsSuffix")}</span>
        </div>
      </div>
    );
  }

  function AbsentPanel({ selectedTeacher, onSelect, t2, lang }) {
    const { c } = useTheme();
    return (
      <div style={{ width: 236, flex: "0 0 236px", borderRight: `1px solid ${c.rule}`, boxSizing: "border-box", display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div style={{ padding: "13px 14px 10px", fontFamily: Fonts.mono, fontSize: 9.5, letterSpacing: ".11em", textTransform: "uppercase", color: c.inkMuted, borderBottom: `1px solid ${c.rule}`, flex: "0 0 auto" }}>
          {t2("sub.absentToday")}
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
          {ABSENT.length === 0 ? (
            <UI2EmptyState t2={t2} title={t2("sub.emptyAbsentTitle")} desc={t2("sub.emptyAbsentDesc")} />
          ) : (
            ABSENT.map((a, i) => <AbsentCard key={a.id} a={a} index={i} selected={selectedTeacher === i} onSelect={onSelect} t2={t2} lang={lang} />)
          )}
        </div>
        <div style={{ padding: "12px 14px", fontFamily: Fonts.sans, fontSize: 11, lineHeight: 1.5, color: c.inkMuted, borderTop: `1px solid ${c.rule}`, flex: "0 0 auto" }}>
          {t2("sub.leaveSyncNote")}
        </div>
      </div>
    );
  }

  function UI2EmptyState({ title, desc }) {
    const { EmptyState } = window.UI2;
    return <EmptyState illustration="documents" title={title} description={desc} />;
  }

  // ---------------------------------------------------------------
  // Substitution — the exported, self-contained screen.
  // ---------------------------------------------------------------
  function Substitution() {
    const { c } = useTheme();
    const { t2, lang } = useT2();
    const [selectedTeacher, setSelectedTeacher] = useState(POPOVER_ANCHOR.colIndex);
    const [popoverOpen, setPopoverOpen] = useState(true);
    const [campus, setCampus] = useState("aravali");

    const totals = useMemo(() => computeTotals(GRID, ABSENT.length), []);

    const columns = useMemo(() => {
      const cols = [{ key: "period", label: t2("sub.colPeriod"), width: 88, mono: true }];
      ABSENT.forEach((a, i) => {
        cols.push({
          key: `c${i}`, flex: 1,
          label: (
            <span style={{ color: selectedTeacher === i ? c.accent : undefined }}>
              {initialSurname(a.name)} · {subjectAbbr(a.subjectKey, lang)}
            </span>
          ),
        });
      });
      return cols;
    }, [selectedTeacher, lang, c.accent]);

    const rows = useMemo(() => {
      return GRID.map((row) => {
        const cells = { period: <PeriodCell n={row.n} time={row.time} /> };
        row.cells.forEach((cell, ci) => {
          const isAnchor = row.n === POPOVER_ANCHOR.n && ci === POPOVER_ANCHOR.colIndex;
          cells[`c${ci}`] = (
            <SubCell
              cell={cell} selected={selectedTeacher === ci} isAnchor={isAnchor}
              popoverOpen={isAnchor && popoverOpen} onOpenPopover={setPopoverOpen}
              onSelectColumn={() => setSelectedTeacher(ci)} t2={t2}
            />
          );
        });
        return { key: `p${row.n}`, cells };
      });
    }, [selectedTeacher, popoverOpen, lang]);

    const totalsRow = useMemo(() => {
      const cells = {};
      ABSENT.forEach((a, i) => {
        cells[`c${i}`] = <Figure value={totals.colTotals[i]} weight={600} />;
      });
      return { label: t2("sub.totalsLabel"), labelSpan: 1, cells };
    }, [totals, lang]);

    const metaLine = (
      <span>
        {ABSENT.length} {t2("sub.staffAbsent")} · {totals.nonEmptyCount} {t2("sub.periodsNeedingCover")} · {t2("sub.publishedAt")} 07:30
      </span>
    );
    const figureSubLine = (
      <span>
        {totals.assignedCount} {t2("sub.of")} {totals.nonEmptyCount} {t2("sub.periodsAssignedMid")} <span style={{ fontFamily: Fonts.mono }}>SUB-HON</span>
      </span>
    );

    return (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: c.bg, boxSizing: "border-box", overflow: "hidden" }}>
        <ActionBar breadcrumbs={[t2("sub.crumb1"), t2("sub.crumb2")]} badge={t2("sub.badge")}>
          <div style={{ width: 168, flex: "0 0 auto" }}>
            <Select
              value={campus} onChange={(e) => setCampus(e.target.value)} options={CAMPUSES}
              aria-label={t2("sub.campusLabel")}
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "6px 10px", fontFamily: Fonts.sans, fontSize: 12, fontWeight: 600, background: c.accentSoft, color: c.accent }}>
            <span style={{ width: 5, height: 5, background: "currentColor", flex: "0 0 auto" }} />
            {totals.openCount} {t2("sub.periodsOpen")}
          </div>
          <Button variant="primary">{t2("sub.publish")}</Button>
        </ActionBar>

        <Masthead
          kicker={t2("sub.kicker")}
          title={t2("sub.titleDate")}
          titleDeva={t2("sub.titleDeva")}
          meta={metaLine}
          figureKicker={t2("sub.figureKicker")}
          figureValue={totals.totalFee}
          figureSub={figureSubLine}
        />

        <div style={{ flex: 1, minHeight: 0, display: "flex", background: c.surface, boxSizing: "border-box" }}>
          <AbsentPanel selectedTeacher={selectedTeacher} onSelect={setSelectedTeacher} t2={t2} lang={lang} />
          <div style={{ flex: 1, minWidth: 0, overflow: "auto" }}>
            <Register
              columns={columns}
              rows={rows}
              totals={totalsRow}
              rowHeight={66}
              emptyState={<UI2EmptyState title={t2("sub.emptyGridTitle")} desc={t2("sub.emptyGridDesc")} />}
            />
          </div>
        </div>

        <StatusFooter
          rule={t2("sub.footerRule")}
          note={t2("sub.footerNote")}
          tag={`Δ ${totals.openCount} ${t2("sub.openTag")}`}
        />
      </div>
    );
  }

  window.Pages2 = window.Pages2 || {};
  window.Pages2.Substitution = Substitution;
})();
