/* @jsxRuntime classic */
/* ============================================================
   Naveya — HR Operator · Staff attendance · window.Pages3.HRAttendance
   (HR-39, new 2026-09-28)

   WHY THIS MODULE EXISTS. Attendance had no home. The punches lived
   nowhere, regularisation requests arrived from EMP-04 and vanished
   into a queue nobody could see, and the two screens that WERE about
   punches — shifts & rosters and the nightly exceptions — were filed
   under "Leave admin", where nobody looked for them. Designer ruling:
   build the attendance module, move those two in, and give HR the
   thing it never had — the day itself.

   FOUR TABS, IN THE ORDER A DAY GOES WRONG
     1 · The day        — who is in, who is late, whose punch is missing
     2 · Regularisations— what employees have asked HR to correct
     3 · Exceptions     — what the nightly job could not reconcile (HR-30)
     4 · Shifts & rosters — what every punch is compared against (HR-29)

   Tabs 3 and 4 are MOUNTED from hr-leaveatt.jsx rather than copied:
   they read that file's shift, roster, exception and staff data, and a
   second copy of that data is precisely the drift this repo keeps
   finding. They are the same screens, in the module they belong to.

   WHAT IS HR'S HERE (M9 §Permissions — `attendance.manage` is HR's):
   correcting a record, adding a punch somebody's reader missed,
   accepting or sending back a regularisation, and marking a day as
   on-duty. What is NOT: approving leave (that is the head's), and
   inventing a punch for a day already inside an approved payroll run
   — July is locked, and the screen says so rather than failing later.

   NOTHING COMMITS IN ONE CLICK. Every correction opens a modal, takes
   a required reason, states its payroll consequence before it commits,
   and lands attributed — the same shape the rest of the product uses.
   ============================================================ */
(function () {
  const G3 = window.G3;
  const UI = window.UI3;
  const { useState, useMemo } = React;
  const {
    useTheme, ThemeToggle, useLang, addStrings,
    Rail, Motif, Card, Register, Button, LinkButton, Chip, StatusMark, Icon,
    ActionMenu, Field, Input, Select, Switch, Tabs, TabPanel, EmptyState, SideScreen,
    inr, num,
    CampusSwitch, campusLabel, inCampusKey, CAMPUS_ALL, MetricStrip, Band,
  } = UI;

  const TODAY_ISO = "2026-08-11";
  const JULY_LOCK = "2026-08-01";   /* July sits inside an approved run */
  const SESSION_FROM = "2026-04-01"; /* the academic session's first day */
  const RUN_AUG = "PR-2026-08";


  /* ONE WINDOW, THREE WIDTHS. Every register on this screen is read
     over a stretch of days, and the one everybody asks for after "this
     month" is "and last month" — so the filter says so rather than
     offering a calendar nobody fills in. */
  function inWindow(iso, when) {
    if (when === "all") return true;
    const days = Math.round((new Date("2026-08-11T00:00:00") - new Date(iso + "T00:00:00")) / 86400000);
    if (when === "quarter") return days <= 92;
    return iso >= "2026-08-01";
  }

  function fmtISO(t, iso) {
    if (!iso) return null;
    const p = iso.split("-");
    return String(Number(p[2])) + " " + t("att3.mon." + p[1]) + " " + p[0];
  }

  /* day and month, for a line under a figure: the year is noise
     where every row on the screen is inside the same one */
  function dayMon(t, iso) {
    if (!iso) return "";
    const p = iso.split("-");
    return String(Number(p[2])) + " " + t("att3.mon." + p[1]);
  }

  /* A FIGURE'S LINE SAYS WHO, NOT WHAT (designer). "nothing from the
     reader yet" explains the label above it, which the reader has
     already read. Two names, or a name and a date, tell them
     something the figure cannot. */
  function namesOf(t, list) {
    const names = list.map(function (p) { return t(p.nameKey); });
    if (names.length <= 2) return names.join(", ");
    return t("att3.f.andMore", { names: names.slice(0, 2).join(", "), n: num(names.length - 2) });
  }
  function whoWhen(t, r) {
    return r ? t("att3.f.whoWhen", { name: t(r.nameKey), date: dayMon(t, r.iso) }) : "";
  }
  function earliest(list, key) {
    return list.slice().sort(function (a, b) { return (a[key] || "") < (b[key] || "") ? -1 : 1; })[0];
  }
  function latest(list, key) {
    return list.slice().sort(function (a, b) { return (a[key] || "") < (b[key] || "") ? 1 : -1; })[0];
  }

  /* ---- the day, as the readers recorded it --------------------- */
  const DAY = [
    { id: "ananya", nameKey: "att3.p.ananya", desigKey: "att3.g.pgtPhy", deptKey: "att3.d.science", campusKey: "lf.c.main", shiftKey: "att3.sh.morning", inT: "07:41", outT: null, state: "in" },
    { id: "karan", nameKey: "att3.p.karan", desigKey: "att3.g.pgtChem", deptKey: "att3.d.science", campusKey: "lf.c.main", shiftKey: "att3.sh.morning", inT: "08:52", outT: null, state: "late", lateBy: 52 },
    { id: "meeraj", nameKey: "att3.p.meeraj", desigKey: "att3.g.tgtBio", deptKey: "att3.d.science", campusKey: "lf.c.main", shiftKey: "att3.sh.morning", inT: null, outT: null, state: "missing" },
    { id: "divya", nameKey: "att3.p.divya", desigKey: "att3.g.tgtBio", deptKey: "att3.d.science", campusKey: "lf.c.main", shiftKey: "att3.sh.morning", inT: null, outT: null, state: "leave" },
    { id: "suresh", nameKey: "att3.p.suresh", desigKey: "att3.g.accounts", deptKey: "att3.d.admin", campusKey: "lf.c.main", shiftKey: "att3.sh.general", inT: "08:26", outT: null, state: "in" },
    { id: "manju", nameKey: "att3.p.manju", desigKey: "att3.g.driver4", deptKey: "att3.d.transport", campusKey: "lf.c.main", shiftKey: "att3.sh.transport", inT: "05:28", outT: "09:35", state: "done" },
    { id: "priya", nameKey: "att3.p.priya", desigKey: "att3.g.tgtChem", deptKey: "att3.d.science", campusKey: "lf.c.main", shiftKey: "att3.sh.morning", inT: "08:31", outT: null, state: "in", note: "att3.note.gate" },
    { id: "ramesh", nameKey: "att3.p.ramesh", desigKey: "att3.g.facilities", deptKey: "att3.d.admin", campusKey: "lf.c.main", shiftKey: "att3.sh.general", inT: "08:05", outT: null, state: "in" },
    { id: "neha", nameKey: "att3.p.neha", desigKey: "att3.g.prt5", deptKey: "att3.d.primary", campusKey: "lf.c.north", shiftKey: "att3.sh.morning", inT: "07:52", outT: null, state: "in" },
    { id: "rohit", nameKey: "att3.p.rohit", desigKey: "att3.g.guestSan", deptKey: "att3.d.languages", campusKey: "lf.c.north", shiftKey: "att3.sh.none", inT: "09:04", outT: null, state: "noshift" },
    { id: "shanti", nameKey: "att3.p.shanti", desigKey: "att3.g.prt3", deptKey: "att3.d.primary", campusKey: "lf.c.north", shiftKey: "att3.sh.morning", inT: null, outT: null, state: "leave" },
    { id: "iqbal", nameKey: "att3.p.iqbal", desigKey: "att3.g.driver2", deptKey: "att3.d.transport", campusKey: "lf.c.north", shiftKey: "att3.sh.transport", inT: "05:31", outT: "09:41", state: "done" },
    /* approved and away today. Devika and Prakash were already on
       leave in the leave module (LR-0196, LR-0205) and missing from
       this roll, which is how the dept head could see four people
       out on a morning attendance called two. */
    { id: "devika", nameKey: "att3.p.devika", desigKey: "att3.g.tgtEnglish", deptKey: "att3.d.languages", campusKey: "lf.c.main", shiftKey: "att3.sh.morning", inT: null, outT: null, state: "leave" },
    { id: "rahul", nameKey: "att3.p.rahul", desigKey: "att3.g.pgtPhy", deptKey: "att3.d.science", campusKey: "lf.c.main", shiftKey: "att3.sh.morning", inT: null, outT: null, state: "leave" },
    { id: "prakash", nameKey: "att3.p.prakash", desigKey: "att3.g.support", deptKey: "att3.d.transport", campusKey: "lf.c.main", shiftKey: "att3.sh.transport", inT: null, outT: null, state: "leave" },
  ];

  const DAY_LOOK = {
    in: { role: "present", word: "att3.st.in", glyph: "check" },
    done: { role: "present", word: "att3.st.done", glyph: "check" },
    late: { role: "late", word: "att3.st.late", glyph: "clock" },
    missing: { role: "absent", word: "att3.st.missing", glyph: "alert" },
    leave: { role: "leave", word: "att3.st.leave", glyph: "leave" },
    noshift: { role: "missing", word: "att3.st.noshift", glyph: "alert" },
    /* a past Sunday reads as a weekly off, and a state the roll can
       return must be a state the table can draw */
    off: { role: "off", word: "att3.st.off", glyph: "clock" },
  };

  /* ---- what employees have asked HR to put right (EMP-04) ------ */
  const REGS = [
    { id: "RG-0141", who: "karan", nameKey: "att3.p.karan", deptKey: "att3.d.science", campusKey: "lf.c.main", iso: "2026-08-06", askedISO: "2026-08-07", was: "missing", want: "present", inT: "07:48", outT: "15:20", whyKey: "att3.reg.why.gate", state: "open" },
    { id: "RG-0142", who: "priya", nameKey: "att3.p.priya", deptKey: "att3.d.science", campusKey: "lf.c.main", iso: "2026-08-08", askedISO: "2026-08-08", was: "half", want: "present", inT: "08:05", outT: "15:40", whyKey: "att3.reg.why.offsite", state: "open" },
    { id: "RG-0139", who: "manju", nameKey: "att3.p.manju", deptKey: "att3.d.transport", campusKey: "lf.c.main", iso: "2026-07-28", askedISO: "2026-08-02", was: "absent", want: "present", inT: "05:30", outT: "09:35", whyKey: "att3.reg.why.route", state: "locked" },
    { id: "RG-0143", who: "neha", nameKey: "att3.p.neha", deptKey: "att3.d.primary", campusKey: "lf.c.north", iso: "2026-08-10", askedISO: "2026-08-10", was: "missing", want: "present", inT: "07:50", outT: "15:10", whyKey: "att3.reg.why.gate", state: "open" },
    { id: "RG-0138", who: "suresh", nameKey: "att3.p.suresh", deptKey: "att3.d.admin", campusKey: "lf.c.main", iso: "2026-08-04", askedISO: "2026-08-05", was: "late", want: "onduty", inT: "10:12", outT: "17:05", whyKey: "att3.reg.why.bank", state: "accepted", decidedISO: "2026-08-06" },
    { id: "RG-0137", who: "rohit", nameKey: "att3.p.rohit", deptKey: "att3.d.languages", campusKey: "lf.c.north", iso: "2026-08-03", askedISO: "2026-08-04", was: "absent", want: "present", inT: "09:00", outT: "13:00", whyKey: "att3.reg.why.thin", state: "sentBack", decidedISO: "2026-08-05" },
  ];

  const REG_LOOK = {
    open: { role: "late", word: "att3.reg.st.open", glyph: "clock" },
    accepted: { role: "present", word: "att3.reg.st.accepted", glyph: "check" },
    sentBack: { role: "penalty", word: "att3.reg.st.sentBack", glyph: "arrow" },
    locked: { role: "off", word: "att3.reg.st.locked", glyph: "lock" },
  };

  /* ============================================================
     TAB 1 · THE DAY
     ============================================================ */
  /* A PAST DAY IS A DAY. The readers keep every day; this canvas
     carries one of them in full and derives the rest from it, the
     same way for the same person and date, so stepping back through
     the week shows a roll that behaves like a roll: most people in,
     a couple late, somebody who never punched. */
  function dayShift(id, iso) {
    let h = 0;
    const key = id + iso;
    for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) % 997;
    return h;
  }
  function isDayOff(iso) { return new Date(iso + "T00:00:00").getDay() === 0; }
  function leaveOrOff(st) { return st === "leave" || st === "off"; }

  function rollFor(iso, base) {
    if (iso === TODAY_ISO) return base;
    const d = new Date(iso + "T00:00:00");
    const weekend = d.getDay() === 0;
    return base.map(function (p0) {
      /* THE MINUTES BELONG TO THE PUNCH THEY WERE MEASURED FROM. The
         base record is today's; carried onto a derived morning its
         "52 minutes past grace" sits beside an 08:41 that was 41. */
      const p = Object.assign({}, p0, { lateBy: null });
      const h = dayShift(p.id, iso);
      if (weekend) return Object.assign({}, p, { state: "off", inT: null, outT: null });
      if (p.state === "leave" && h % 3 === 0) return Object.assign({}, p, { state: "in", inT: "07:5" + (h % 10), outT: "15:1" + (h % 10) });
      if (h % 17 === 0) return Object.assign({}, p, { state: "missing", inT: null, outT: null });
      if (h % 11 === 0) return Object.assign({}, p, { state: "late", inT: "08:4" + (h % 10), outT: "15:2" + (h % 10) });
      if (h % 7 === 0) return Object.assign({}, p, { state: "leave", inT: null, outT: null });
      return Object.assign({}, p, { state: "in", inT: "07:4" + (h % 10), outT: "15:0" + (h % 10) });
    });
  }

  /* ONE PERSON, DAY BY DAY. The same generated record the roll is
     read from, sliced the other way: down one person instead of
     across one morning. */
  function shiftISO(iso, delta) {
    const d = new Date(iso + "T00:00:00");
    d.setDate(d.getDate() + delta);
    return d.toISOString().slice(0, 10);
  }
  function historyFor(person, endISO, n) {
    const out = [];
    for (let i = n - 1; i >= 0; i--) {
      const iso = shiftISO(endISO, -i);
      const day = rollFor(iso, [person])[0];
      out.push({ iso: iso, state: day.state, inT: day.inT, outT: day.outT });
    }
    return out.reverse();
  }

  /* ONE PERSON ON ONE DAY, FROM THE BASE RECORD. rollFor derives a
     past day from what is on file, so it has to be handed what is on
     file — hand it a day already derived and the derivation
     compounds, and the same date reads two ways depending on which
     screen asked. */
  function baseById(id) {
    const hit = DAY.filter(function (p) { return p.id === id; });
    return hit.length ? hit[0] : null;
  }
  function recordOn(person, iso) {
    const base = baseById(person.id) || person;
    return rollFor(iso, [base])[0];
  }

  function toMin(hhmm) {
    const q = String(hhmm).split(":");
    return (+q[0]) * 60 + (+q[1]);
  }

  /* HOW LONG THEY WERE ON THE CLOCK. Two punches make a length; one
     punch makes a question, and a column that answered it anyway
     would be guessing at a day still being worked. A day fills this
     in when it closes, which is also when it starts mattering to a
     payroll run. */
  function hoursBetween(inT, outT) {
    if (!inT || !outT) return null;
    const a = toMin(inT), b = toMin(outT);
    return b > a ? b - a : null;
  }
  function fmtHours(t, min) {
    if (min == null) return null;
    return t("att3.hrs", { h: Math.floor(min / 60), m: String(min % 60).padStart(2, "0") });
  }

  /* the weekday is half of what makes a past date legible: "6 Aug" is
     a lookup, "Thursday, 6 Aug" is a day somebody remembers */
  function dayDateLabel(t, iso) {
    return t("att3.side.dayDate", {
      wd: t("att3.wd." + new Date(iso + "T00:00:00").getDay()),
      date: fmtISO(t, iso),
    });
  }

  function DayTab({ campus, flash, setFlash }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [dayISO, setDayISO] = useState(TODAY_ISO);
    const [dept, setDept] = useState("all");
    const [state, setState] = useState("all");
    const [openId, setOpenId] = useState(null);
    const [act, setAct] = useState(null);
    const [edits, setEdits] = useState({});

    const roll = rollFor(dayISO, DAY.filter((p) => inCampusKey(campus, p.campusKey)));
    const rows0 = roll.filter((p) => {
      if (dept !== "all" && p.deptKey !== dept) return false;
      if (state !== "all" && stateOf(p) !== state) return false;
      return true;
    });

    /* A CORRECTION BELONGS TO A DAY, NOT TO A PERSON (designer,
       2026-10-28). Now that the panel can be pointed at any past day,
       an edit filed under the person alone would redraw whatever day
       the roll happens to be showing — correct the 4th and the 11th
       would claim to have been corrected. */
    function editOf(p) { return edits[p.id + "|" + dayISO] || null; }
    function stateOf(p) { const e = editOf(p); return (e && e.state) || p.state; }
    function inOf(p) { const e = editOf(p); return (e && e.inT) || p.inT; }
    function outOf(p) { const e = editOf(p); return (e && e.outT) || p.outT; }

    /* FOUR FIGURES THAT ADD UP TO THE ROLL. A weekly off is counted
       with leave -- both mean "not expected today" -- because on a
       Sunday the old four summed to nothing and the bar vanished. */
    const counts = {
      inNow: roll.filter((p) => stateOf(p) === "in" || stateOf(p) === "done").length,
      late: roll.filter((p) => stateOf(p) === "late").length,
      missing: roll.filter((p) => stateOf(p) === "missing" || stateOf(p) === "noshift").length,
      leave: roll.filter((p) => leaveOrOff(stateOf(p))).length,
    };

    const depts = [];
    roll.forEach((p) => { if (depts.indexOf(p.deptKey) === -1) depts.push(p.deptKey); });

    const columns = [
      { key: "who", label: t("att3.col.who") },
      { key: "shift", label: t("att3.col.shift"), width: 190 },
      { key: "inT", label: t("att3.col.in"), width: 120, mono: true },
      { key: "outT", label: t("att3.col.out"), width: 120, mono: true },
      { key: "hours", label: t("att3.col.hours"), width: 110, mono: true },
      { key: "state", label: t("att3.col.state"), width: 190 },
      { key: "act", label: t("att3.col.actions"), align: "right", width: 56 },
    ];

    const rows = rows0.map((p) => {
      const st = stateOf(p);
      const look = DAY_LOOK[st];
      const e = editOf(p);
      return {
        id: p.id,
        highlight: p.id === openId,
        cells: {
          who: (
            <span>
              <span style={ty("small", { display: "block", color: c.ink, fontWeight: 700 })}>{t(p.nameKey)}</span>
              <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 1 })}>{t(p.desigKey)} · {t(p.deptKey)}</span>
            </span>
          ),
          shift: <span style={ty("small", { color: st === "noshift" ? c.missingText : c.inkMuted })}>{t(p.shiftKey)}</span>,
          inT: inOf(p) || "—",
          outT: outOf(p) || "—",
          hours: fmtHours(t, hoursBetween(inOf(p), outOf(p))) || "—",
          state: (
            <span>
              <StatusMark role={look.role} word={t(look.word)} glyph={look.glyph} />
              {st === "late" && p.lateBy ? <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 3 })}>{t("att3.lateBy", { n: num(p.lateBy) })}</span> : null}
              {e ? <span style={ty("caption", { display: "block", color: c.lateText, marginTop: 3 })}>{t("att3.corrected")}</span> : null}
              {p.note && !e ? <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 3 })}>{t(p.note)}</span> : null}
            </span>
          ),
          act: (
            <span onClick={(ev) => ev.stopPropagation()} style={{ display: "flex", justifyContent: "flex-end" }}>
              <ActionMenu
                ariaLabel={t("att3.menu.aria", { name: t(p.nameKey) })}
                size={30}
                items={[
                  { key: "open", icon: "document", label: t("att3.menu.open"), onSelect: () => setOpenId(p.id) },
                  { key: "correct", icon: "attendance", label: t("att3.menu.correct"), onSelect: () => setAct({ kind: "correct", person: p }) },
                  { key: "punch", icon: "clock", label: t("att3.menu.punch"), onSelect: () => setAct({ kind: "punch", person: p }) },
                  { key: "duty", icon: "briefcase", label: t("att3.menu.duty"), onSelect: () => setAct({ kind: "duty", person: p }) },
                ]}
              />
            </span>
          ),
        },
      };
    });

    /* the roll, cut four ways: every reader on the campus is in exactly
       one of these, so the bar under them IS the day. Each line names
       the people in that figure, or says plainly that there are none. */
    const lateOnes = roll.filter(function (p) { return stateOf(p) === "late"; });
    const missingOnes = roll.filter(function (p) { return stateOf(p) === "missing" || stateOf(p) === "noshift"; });
    const leaveOnes = roll.filter(function (p) { return leaveOrOff(stateOf(p)); });
    const lastIn = lateOnes.length ? lateOnes.slice().sort(function (a, b) { return (inOf(a) || "") < (inOf(b) || "") ? 1 : -1; })[0] : null;
    const facts = [
      { k: "in", label: t("att3.f.in"), value: num(counts.inNow), n: counts.inNow,
        note: t("att3.f.inNote", { n: num(roll.length) }), tone: c.chartGreen },
      { k: "late", label: t("att3.f.late"), value: num(counts.late), n: counts.late,
        note: lastIn ? t("att3.f.lateNote", { name: t(lastIn.nameKey), at: inOf(lastIn) || "—" }) : t("att3.f.lateNone"),
        tone: c.chartAmber, warn: counts.late > 0 },
      { k: "missing", label: t("att3.f.missing"), value: num(counts.missing), n: counts.missing,
        note: missingOnes.length ? namesOf(t, missingOnes) : t("att3.f.missingNone"),
        tone: c.chartRed, warn: counts.missing > 0 },
      { k: "leave", label: t("att3.f.leave"), value: num(counts.leave), n: counts.leave,
        note: leaveOnes.length ? namesOf(t, leaveOnes) : t("att3.f.leaveNone"), tone: c.chartPurple },
    ];

    const open = openId ? roll.filter((p) => p.id === openId)[0] : null;

    return (
      <div>
        {flash ? <FlashLine text={flash} onDismiss={() => setFlash("")} /> : null}

        {/* a day on which nothing was expected explains its own zeros */}
        <Band metrics={facts} foot={isDayOff(dayISO) ? t("att3.day.off", { date: fmtISO(t, dayISO) }) : null} />

        {/* THREE QUESTIONS, ONE ROW (designer). The date is a filter
            like the other two -- which day, whose department, what
            state -- and it had a row of its own above the figures
            with an export button floating at the end of it. */}
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end", margin: G3.layout.gap + "px 0 16px" }}>
          <div style={{ flex: "0 1 210px", minWidth: 180 }}>
            <Field id="att3-date" label={t("att3.day.pick")}>
              <Input id="att3-date" type="date" value={dayISO} onChange={setDayISO} />
            </Field>
          </div>
          <div style={{ flex: "1 1 200px", minWidth: 0 }}>
            <Field id="att3-dept" label={t("att3.f.dept")}>
              <Select id="att3-dept" value={dept} onChange={setDept}
                options={[{ value: "all", label: t("att3.f.deptAll") }].concat(depts.map((d) => ({ value: d, label: t(d) })))} />
            </Field>
          </div>
          <div style={{ flex: "1 1 200px", minWidth: 0 }}>
            <Field id="att3-state" label={t("att3.f.state")}>
              <Select id="att3-state" value={state} onChange={setState}
                options={[{ value: "all", label: t("att3.f.stateAll") }].concat(["in", "late", "missing", "leave", "noshift"].map((k) => ({ value: k, label: t(DAY_LOOK[k].word) })))} />
            </Field>
          </div>
          <div style={{ paddingBottom: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
            {dayISO !== TODAY_ISO ? (
              <Button kind="ghost" size="sm" onClick={() => setDayISO(TODAY_ISO)}>{t("att3.day.today")}</Button>
            ) : null}
          </div>
        </div>

        {rows.length === 0 ? (
          <Card><EmptyState head={t("att3.empty.head")} body={t("att3.empty.body")} /></Card>
        ) : (
          <Register
            title={t("att3.dayReg.title")} sub={t("att3.dayReg.sub", { shown: num(rows.length), total: num(roll.length) })}
            action={<Button kind="secondary" size="sm" iconLeft="download" onClick={() => setFlash(t("att3.export.done"))}>{t("att3.export")}</Button>}
            columns={columns} rows={rows}
            onSelect={(id) => setOpenId(id)}
            footer={<span style={ty("caption", { color: c.inkFaint })}>{t("att3.dayReg.foot")}</span>}
          />
        )}

        {open ? (
          <SideScreen
            title={t(open.nameKey)}
            sub={t(open.desigKey) + " · " + t(open.deptKey)}
            width={600}
            onClose={() => setOpenId(null)}
            footer={
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Button kind="primary" size="sm" iconLeft="attendance" onClick={() => setAct({ kind: "correct", person: open })}>{t("att3.menu.correct")}</Button>
                <Button kind="secondary" size="sm" iconLeft="clock" onClick={() => setAct({ kind: "punch", person: open })}>{t("att3.menu.punch")}</Button>
                <Button kind="ghost" size="sm" onClick={() => setOpenId(null)}>{t("att3.close")}</Button>
              </div>
            }
          >
            <DayBody person={open} dayISO={dayISO} inT={inOf(open)} outT={outOf(open)} state={stateOf(open)} edited={editOf(open)} />
          </SideScreen>
        ) : null}

        {act ? (
          <CorrectionPanel
            kind={act.kind}
            person={act.person}
            dayISO={dayISO}
            onClose={() => setAct(null)}
            onDone={(iso, patch, line) => {
              setEdits(Object.assign({}, edits, { [act.person.id + "|" + iso]: patch }));
              setFlash(line);
              setAct(null);
            }}
          />
        ) : null}
      </div>
    );
  }

  function DayBody({ person, dayISO, inT, outT, state, edited }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const look = DAY_LOOK[state];
    const steps = [
      inT ? { k: "in", word: t("att3.tl.in", { time: inT }), tone: state === "late" ? "late" : "present" } : { k: "in", word: t("att3.tl.noIn"), tone: "absent" },
      outT ? { k: "out", word: t("att3.tl.out", { time: outT }), tone: "present" } : { k: "out", word: t("att3.tl.noOut"), tone: "off" },
    ];
    return (
      <div>
        <div style={{ marginBottom: 16 }}>
          <StatusMark role={look.role} word={t(look.word)} glyph={look.glyph} />
        </div>

        {/* "Counts as: one paid day, unless it is corrected" said
            nothing a reader could act on: every present day counts as
            a paid day, and the "unless" is the button at the foot of
            this panel (designer, 2026-10-28). The date row went with
            it — the heading below now names the day in full, and a
            panel does not need to say 11 Aug twice. */}
        <Row label={t("att3.col.shift")}>{t(person.shiftKey)}</Row>
        <Row label={t("att3.side.source")} last>{t("att3.side.sourceV")}</Row>

        <div style={{ marginTop: 20, paddingTop: 14, borderTop: "1px solid " + c.rule }}>
          <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 10 })}>{dayDateLabel(t, dayISO)}</div>
          {steps.map((s, i) => (
            <div key={s.k} style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 0", borderTop: i ? "1px dashed " + c.border : "none" }}>
              <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: G3.r.pill, background: c[s.tone + "Text"] || c.inkFaint, flexShrink: 0 }} />
              <span style={ty("small", { color: c.ink })}>{s.word}</span>
            </div>
          ))}
          {person.note ? <p style={ty("caption", { margin: "10px 0 0", color: c.inkFaint })}>{t(person.note)}</p> : null}
        </div>

        {/* AND THE DAYS EITHER SIDE OF IT (designer). A day on its own
            answers nothing — a missing punch on the 4th is a question
            until you can see that the 3rd and the 5th were ordinary.
            So one person's record is readable backwards from whatever
            day the screen is on, which is the whole of the "see any
            staff on any date" flow: the roll picks the day, this picks
            the person, and the fortnight is the context. */}
        <div style={{ marginTop: 20, paddingTop: 14, borderTop: "1px solid " + c.rule }}>
          <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 8 })}>{t("att3.side.histOf", { name: t(person.nameKey) })}</div>
          {historyFor(person, dayISO, 14).map((d, i) => {
            const lk = DAY_LOOK[d.state] || DAY_LOOK.off;
            return (
              <div
                key={d.iso}
                style={{
                  display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap",
                  padding: "9px 0", borderTop: "1px solid " + (i ? c.rule : c.border),
                  background: d.iso === dayISO ? c.accentSoft : "transparent",
                }}
              >
                <span style={G3.fig("xs", { color: c.inkMuted, width: 112, flexShrink: 0 })}>{fmtISO(t, d.iso)}</span>
                <span style={{ flex: "1 1 150px", minWidth: 0 }}>
                  <StatusMark role={lk.role} word={t(lk.word)} glyph={lk.glyph} />
                </span>
                <span style={G3.fig("xs", { color: c.inkFaint })}>
                  {d.inT ? d.inT + (d.outT ? " \u2013 " + d.outT : "") : t("att3.side.histNone")}
                </span>
              </div>
            );
          })}
        </div>

        {edited ? (
          <p style={ty("caption", { margin: "18px 0 0", paddingTop: 14, borderTop: "1px solid " + c.rule, color: c.inkMuted })}>
            {t("att3.side.editedBy", { why: edited.why })}
          </p>
        ) : null}
      </div>
    );
  }

  /* ============================================================
     TAB 2 · REGULARISATIONS
     ============================================================ */
  function RegsTab({ campus, flash, setFlash }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [state, setState] = useState("open");
    const [when, setWhen] = useState("month");
    const [openId, setOpenId] = useState(null);
    const [decided, setDecided] = useState({});
    const [act, setAct] = useState(null);

    const scoped = REGS.filter((r) => inCampusKey(campus, r.campusKey)).filter((r) => inWindow(r.iso, when));
    function stateOf(r) { return decided[r.id] || r.state; }
    const rows0 = scoped.filter((r) => state === "all" || stateOf(r) === state);

    /* the window, cut by what has happened to each request -- four
       figures that add up to every row the table can show */
    const regOpen = scoped.filter((r) => stateOf(r) === "open");
    const regAcc = scoped.filter((r) => stateOf(r) === "accepted");
    const regBack = scoped.filter((r) => stateOf(r) === "sentBack");
    const regLock = scoped.filter((r) => stateOf(r) === "locked");

    const columns = [
      { key: "who", label: t("att3.reg.col.who") },
      { key: "day", label: t("att3.reg.col.day"), width: 150 },
      { key: "change", label: t("att3.reg.col.change"), width: 230 },
      { key: "state", label: t("att3.reg.col.state"), width: 200 },
      { key: "act", label: t("att3.col.actions"), align: "right", width: 56 },
    ];

    const rows = rows0.map((r) => {
      const st = stateOf(r);
      const look = REG_LOOK[st];
      const locked = st === "locked";
      return {
        id: r.id,
        highlight: r.id === openId,
        tone: st === "sentBack" ? "dim" : undefined,
        cells: {
          who: (
            <span>
              <span style={ty("small", { display: "block", color: c.ink, fontWeight: 700 })}>{t(r.nameKey)}</span>
              <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 1 })}>
                <span style={G3.fig("micro", { color: c.inkFaint })}>{r.id}</span> · {t(r.deptKey)}
              </span>
            </span>
          ),
          day: fmtISO(t, r.iso),
          change: (
            <span style={ty("small", { color: c.ink })}>
              {t("att3.reg.change", { was: t("att3.was." + r.was), want: t("att3.was." + r.want) })}
            </span>
          ),
          state: (
            <span>
              <StatusMark role={look.role} word={t(look.word)} glyph={look.glyph} />
              {locked ? <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 3 })}>{t("att3.reg.lockedWhy")}</span> : null}
            </span>
          ),
          act: (
            <span onClick={(ev) => ev.stopPropagation()} style={{ display: "flex", justifyContent: "flex-end" }}>
              <ActionMenu
                ariaLabel={t("att3.reg.menu.aria", { id: r.id })}
                size={30}
                items={[
                  { key: "open", icon: "document", label: t("att3.reg.menu.open"), onSelect: () => setOpenId(r.id) },
                  {
                    key: "accept", icon: "check", label: t("att3.reg.menu.accept"), tone: "go",
                    disabled: st !== "open", reason: st === "locked" ? t("att3.reg.lockedWhy") : st !== "open" ? t("att3.reg.decidedWhy") : undefined,
                    onSelect: st === "open" ? () => setAct({ kind: "accept", reg: r }) : undefined,
                  },
                  {
                    key: "back", icon: "arrow", label: t("att3.reg.menu.back"), tone: "danger",
                    disabled: st !== "open", reason: st !== "open" ? t("att3.reg.decidedWhy") : undefined,
                    onSelect: st === "open" ? () => setAct({ kind: "back", reg: r }) : undefined,
                  },
                ]}
              />
            </span>
          ),
        },
      };
    });

    /* A TONE IS A COLOUR, NOT A ROLE (designer). These three read
       `tone: "late"` and `tone: "off"`, which are StatusMark roles --
       so the swatch and every band of the bar under them were painted
       with a word CSS cannot resolve, and the bar rendered empty. */
    const facts = [
      { k: "open", label: t("att3.reg.f.open"), value: num(regOpen.length), n: regOpen.length,
        note: regOpen.length ? whoWhen(t, earliest(regOpen, "iso")) : t("att3.reg.f.openNone"),
        tone: c.chartAmber, warn: regOpen.length > 0 },
      { k: "accepted", label: t("att3.reg.f.accepted"), value: num(regAcc.length), n: regAcc.length,
        note: regAcc.length ? whoWhen(t, latest(regAcc, "decidedISO")) : t("att3.reg.f.acceptedNone"),
        tone: c.chartGreen },
      { k: "back", label: t("att3.reg.f.back"), value: num(regBack.length), n: regBack.length,
        note: regBack.length ? whoWhen(t, latest(regBack, "decidedISO")) : t("att3.reg.f.backNone"),
        tone: c.chartRed },
      { k: "locked", label: t("att3.reg.f.locked"), value: num(regLock.length), n: regLock.length,
        note: regLock.length ? whoWhen(t, earliest(regLock, "iso")) : t("att3.reg.f.lockedNone"),
        tone: c.chartSand },
    ];

    const open = openId ? scoped.filter((r) => r.id === openId)[0] : null;

    return (
      <div>
        {flash ? <FlashLine text={flash} onDismiss={() => setFlash("")} /> : null}

        <Band metrics={facts} />

        {/* TWO QUESTIONS DO NOT FILL A ROW (designer). A select that
            runs half the screen for four words of answer reads as a
            fault, so these are capped and the row stays left. */}
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end", margin: G3.layout.gap + "px 0 16px" }}>
          <div style={{ flex: "1 1 240px", minWidth: 0, maxWidth: 320 }}>
            <Field id="att3-reg-state" label={t("att3.reg.f.state")}>
              <Select id="att3-reg-state" value={state} onChange={setState}
                options={[{ value: "all", label: t("att3.reg.f.stateAll") }].concat(["open", "accepted", "sentBack", "locked"].map((k) => ({ value: k, label: t(REG_LOOK[k].word) })))} />
            </Field>
          </div>
          <div style={{ flex: "1 1 240px", minWidth: 0, maxWidth: 320 }}>
            <Field id="att3-reg-when" label={t("att3.when")}>
              <Select id="att3-reg-when" value={when} onChange={setWhen}
                options={[
                  { value: "month", label: t("att3.when.month") },
                  { value: "quarter", label: t("att3.when.quarter") },
                  { value: "all", label: t("att3.when.all") },
                ]} />
            </Field>
          </div>
        </div>

        {rows.length === 0 ? (
          <Card><EmptyState head={t("att3.reg.empty.head")} body={t("att3.reg.empty.body")} /></Card>
        ) : (
          <Register
            columns={columns} rows={rows}
            onSelect={(id) => setOpenId(id)}
            footer={<span style={ty("caption", { color: c.inkFaint })}>{t("att3.reg.foot")}</span>}
          />
        )}

        {open ? (
          <SideScreen
            title={open.id}
            sub={t(open.nameKey) + " · " + fmtISO(t, open.iso)}
            width={600}
            onClose={() => setOpenId(null)}
            footer={
              stateOf(open) === "open" ? (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Button kind="primary" size="sm" iconLeft="check" onClick={() => setAct({ kind: "accept", reg: open })}>{t("att3.reg.menu.accept")}</Button>
                  <Button kind="secondary" size="sm" iconLeft="arrow" onClick={() => setAct({ kind: "back", reg: open })}>{t("att3.reg.menu.back")}</Button>
                  <Button kind="ghost" size="sm" onClick={() => setOpenId(null)}>{t("att3.close")}</Button>
                </div>
              ) : <Button kind="ghost" size="sm" onClick={() => setOpenId(null)}>{t("att3.close")}</Button>
            }
          >
            <RegBody reg={open} state={stateOf(open)} />
          </SideScreen>
        ) : null}

        {act ? (
          <RegDecisionPanel
            kind={act.kind} reg={act.reg}
            onClose={() => setAct(null)}
            onDone={() => {
              setDecided(Object.assign({}, decided, { [act.reg.id]: act.kind === "accept" ? "accepted" : "sentBack" }));
              setFlash(t(act.kind === "accept" ? "att3.reg.accepted" : "att3.reg.sentBackDone", { name: t(act.reg.nameKey), date: fmtISO(t, act.reg.iso) }));
              setAct(null);
              setOpenId(null);
            }}
          />
        ) : null}
      </div>
    );
  }

  function RegBody({ reg, state }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const look = REG_LOOK[state];
    return (
      <div>
        <div style={{ marginBottom: 16 }}>
          <StatusMark role={look.role} word={t(look.word)} glyph={look.glyph} />
        </div>
        <Row label={t("att3.reg.col.day")}>{fmtISO(t, reg.iso)}</Row>
        <Row label={t("att3.reg.side.asked")}>{fmtISO(t, reg.askedISO)}</Row>
        <Row label={t("att3.reg.side.onRecord")}>{t("att3.was." + reg.was)}</Row>
        <Row label={t("att3.reg.side.wants")}>{t("att3.was." + reg.want)}</Row>
        <Row label={t("att3.reg.side.times")} last>{reg.inT} – {reg.outT}</Row>

        <div style={{ marginTop: 20, paddingTop: 14, borderTop: "1px solid " + c.rule }}>
          <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 8 })}>{t("att3.reg.side.why")}</div>
          <p style={ty("small", { margin: 0, color: c.ink })}>{t(reg.whyKey)}</p>
        </div>

        <p style={ty("caption", { margin: "18px 0 0", paddingTop: 14, borderTop: "1px solid " + c.rule, color: c.inkFaint })}>
          {state === "locked" ? t("att3.reg.lockedLong") : t("att3.reg.sideRule", { run: RUN_AUG })}
        </p>
      </div>
    );
  }

  /* ============================================================
     TAB 3 · OVERTIME

     Overtime is the one attendance fact that becomes MONEY by itself,
     so it is the one HR is asked to approve rather than correct. The
     hours come from the punches (out minus the shift's end, rounded
     down to the half hour); the claim adds what the hours were FOR,
     because a school pays overtime for a reason — an exam sitting, a
     late bus, a parents' evening — not for a number.

     What HR does here: accept the hours, cut them to what is fair
     with a reason, or decline. What HR does NOT do: type a rate. The
     rate lives in payroll's salary structure, and this screen never
     shows one — the same rule the rest of the module follows.
     ============================================================ */
  const OT = [
    { id: "OT-0231", who: "manju", nameKey: "att3.p.manju", deptKey: "att3.d.transport", campusKey: "lf.c.main", iso: "2026-08-07", hours: 2.5, shiftEnd: "17:30", outT: "20:05", reasonKey: "att3.ot.r.bus", state: "open" },
    { id: "OT-0232", who: "ramesh", nameKey: "att3.p.ramesh", deptKey: "att3.d.admin", campusKey: "lf.c.main", iso: "2026-08-08", hours: 3, shiftEnd: "16:30", outT: "19:35", reasonKey: "att3.ot.r.exam", state: "open" },
    { id: "OT-0233", who: "suresh", nameKey: "att3.p.suresh", deptKey: "att3.d.admin", campusKey: "lf.c.main", iso: "2026-08-09", hours: 1.5, shiftEnd: "16:30", outT: "18:05", reasonKey: "att3.ot.r.audit", state: "open" },
    { id: "OT-0229", who: "priya", nameKey: "att3.p.priya", deptKey: "att3.d.science", campusKey: "lf.c.main", iso: "2026-08-05", hours: 2, shiftEnd: "14:15", outT: "16:20", reasonKey: "att3.ot.r.parents", state: "approved", decidedISO: "2026-08-06" },
    { id: "OT-0228", who: "karan", nameKey: "att3.p.karan", deptKey: "att3.d.science", campusKey: "lf.c.main", iso: "2026-08-04", hours: 4, shiftEnd: "14:15", outT: "18:30", reasonKey: "att3.ot.r.thin", state: "declined", decidedISO: "2026-08-05" },
    { id: "OT-0234", who: "iqbal", nameKey: "att3.p.iqbal", deptKey: "att3.d.transport", campusKey: "lf.c.north", iso: "2026-08-10", hours: 2, shiftEnd: "17:30", outT: "19:35", reasonKey: "att3.ot.r.bus", state: "open" },
    /* settled months, so the window filter has a past to show: these
       two are inside runs that have already paid */
    { id: "OT-0221", who: "ramesh", nameKey: "att3.p.ramesh", deptKey: "att3.d.admin", campusKey: "lf.c.main", iso: "2026-07-22", hours: 2, shiftEnd: "16:30", outT: "18:35", reasonKey: "att3.ot.r.exam", state: "approved", decidedISO: "2026-07-23" },
    { id: "OT-0214", who: "manju", nameKey: "att3.p.manju", deptKey: "att3.d.transport", campusKey: "lf.c.main", iso: "2026-06-18", hours: 3, shiftEnd: "17:30", outT: "20:35", reasonKey: "att3.ot.r.bus", state: "trimmed", decidedISO: "2026-06-19" },
  ];

  /* "a short claim" has to be a number somewhere; it is here, once,
     and the filter's own label is built from it */
  const OT_SMALL_MAX = 2;

  const OT_LOOK = {
    open: { role: "late", word: "att3.ot.st.open", glyph: "clock" },
    approved: { role: "present", word: "att3.ot.st.approved", glyph: "check" },
    trimmed: { role: "ltEL", word: "att3.ot.st.trimmed", glyph: "check" },
    declined: { role: "penalty", word: "att3.ot.st.declined", glyph: "arrow" },
  };

  function OvertimeTab({ campus, flash, setFlash }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [state, setState] = useState("open");
    const [dept, setDept] = useState("all");
    const [size, setSize] = useState("all");
    const [when, setWhen] = useState("month");
    const [q, setQ] = useState("");
    const [openId, setOpenId] = useState(null);
    const [decided, setDecided] = useState({});
    const [act, setAct] = useState(null);

    const scoped = OT.filter((o) => inCampusKey(campus, o.campusKey)).filter((o) => inWindow(o.iso, when));
    function stateOf(o) { return (decided[o.id] && decided[o.id].state) || o.state; }
    function hoursOf(o) { return (decided[o.id] && decided[o.id].hours) || o.hours; }

    /* the departments that actually claim overtime on this campus —
       listing one nobody has claimed from is a filter that can only
       ever empty the table */
    const otDepts = [];
    scoped.forEach((o) => { if (otDepts.indexOf(o.deptKey) === -1) otDepts.push(o.deptKey); });

    const needle = q.trim().toLowerCase();
    const rows0 = scoped.filter((o) => {
      if (state !== "all" && stateOf(o) !== state) return false;
      if (dept !== "all" && o.deptKey !== dept) return false;
      if (size === "small" && hoursOf(o) > OT_SMALL_MAX) return false;
      if (size === "big" && hoursOf(o) <= OT_SMALL_MAX) return false;
      if (needle && (t(o.nameKey) + " " + o.id).toLowerCase().indexOf(needle) === -1) return false;
      return true;
    });
    const filtered = state !== "open" || dept !== "all" || size !== "all" || !!needle;
    function clearFilters() { setState("open"); setDept("all"); setSize("all"); setQ(""); }

    /* FOUR FIGURES, ONE UNIT. "Hours claimed" sat in the same row as
       two counts, so the bar had to choose between hours and claims
       and drew whichever group was larger -- a bar that answered a
       question nobody had asked. The figures are all CLAIMS now, and
       the hours they add to are the line underneath each one, which
       is where a second unit can be read without being compared. */
    const otOpen = scoped.filter((o) => stateOf(o) === "open");
    const otOk = scoped.filter((o) => stateOf(o) === "approved");
    const otCut = scoped.filter((o) => stateOf(o) === "trimmed");
    const otNo = scoped.filter((o) => stateOf(o) === "declined");
    const sumH = function (list) { return list.reduce((a, o) => a + hoursOf(o), 0); };
    const facts = [
      { k: "claims", label: t("att3.ot.f.claims"), value: num(otOpen.length), n: otOpen.length,
        note: otOpen.length ? t("att3.ot.f.claimsNote", { h: hoursWord(t, sumH(otOpen)) }) : t("att3.ot.f.claimsNone"),
        tone: c.chartAmber, warn: otOpen.length > 0 },
      { k: "ok", label: t("att3.ot.f.ok"), value: num(otOk.length), n: otOk.length,
        note: otOk.length ? t("att3.ot.f.okNote", { h: hoursWord(t, sumH(otOk)) }) : t("att3.ot.f.okNone"),
        tone: c.chartGreen },
      { k: "cut", label: t("att3.ot.f.cut"), value: num(otCut.length), n: otCut.length,
        note: otCut.length ? t("att3.ot.f.cutNote", { h: hoursWord(t, sumH(otCut)) }) : t("att3.ot.f.cutNone"),
        tone: c.chartBlue },
      { k: "no", label: t("att3.ot.f.no"), value: num(otNo.length), n: otNo.length,
        note: otNo.length ? t("att3.ot.f.noNote", { h: hoursWord(t, sumH(otNo)) }) : t("att3.ot.f.noNone"),
        tone: c.chartRed },
    ];

    const columns = [
      { key: "who", label: t("att3.ot.col.who") },
      { key: "day", label: t("att3.ot.col.day"), width: 150 },
      { key: "hours", label: t("att3.ot.col.hours"), width: 130, mono: true },
      { key: "why", label: t("att3.ot.col.why") },
      { key: "state", label: t("att3.ot.col.state"), width: 180 },
      { key: "act", label: t("att3.col.actions"), align: "right", width: 56 },
    ];

    const rows = rows0.map((o) => {
      const st = stateOf(o);
      const look = OT_LOOK[st];
      const cut = decided[o.id] && decided[o.id].hours && decided[o.id].hours !== o.hours;
      return {
        id: o.id,
        highlight: o.id === openId,
        tone: st === "declined" ? "dim" : undefined,
        cells: {
          who: (
            <span>
              <span style={ty("small", { display: "block", color: c.ink, fontWeight: 700 })}>{t(o.nameKey)}</span>
              <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 1 })}>
                <span style={G3.fig("micro", { color: c.inkFaint })}>{o.id}</span> · {t(o.deptKey)}
              </span>
            </span>
          ),
          day: fmtISO(t, o.iso),
          hours: (
            <span>
              <span style={G3.fig("sm", { display: "block", color: c.ink, fontWeight: 600 })}>{hoursWord(t, hoursOf(o))}</span>
              {cut ? <span style={ty("caption", { display: "block", color: c.lateText, marginTop: 2 })}>{t("att3.ot.cutFrom", { n: hoursWord(t, o.hours) })}</span> : null}
            </span>
          ),
          why: <span style={ty("small", { color: c.inkMuted })}>{t(o.reasonKey)}</span>,
          state: <StatusMark role={look.role} word={t(look.word)} glyph={look.glyph} />,
          act: (
            <span onClick={(ev) => ev.stopPropagation()} style={{ display: "flex", justifyContent: "flex-end" }}>
              <ActionMenu
                ariaLabel={t("att3.ot.menu.aria", { id: o.id })}
                size={30}
                items={[
                  { key: "open", icon: "document", label: t("att3.ot.menu.open"), onSelect: () => setOpenId(o.id) },
                  {
                    key: "approve", icon: "check", label: t("att3.ot.menu.approve"), tone: "go",
                    disabled: st !== "open", reason: st !== "open" ? t("att3.ot.decidedWhy") : undefined,
                    onSelect: st === "open" ? () => setAct({ kind: "approve", ot: o }) : undefined,
                  },
                  {
                    key: "trim", icon: "clock", label: t("att3.ot.menu.trim"),
                    disabled: st !== "open", reason: st !== "open" ? t("att3.ot.decidedWhy") : undefined,
                    onSelect: st === "open" ? () => setAct({ kind: "trim", ot: o }) : undefined,
                  },
                  {
                    key: "decline", icon: "arrow", label: t("att3.ot.menu.decline"), tone: "danger",
                    disabled: st !== "open", reason: st !== "open" ? t("att3.ot.decidedWhy") : undefined,
                    onSelect: st === "open" ? () => setAct({ kind: "decline", ot: o }) : undefined,
                  },
                ]}
              />
            </span>
          ),
        },
      };
    });

    const open = openId ? scoped.filter((o) => o.id === openId)[0] : null;

    return (
      <div>
        {flash ? <FlashLine text={flash} onDismiss={() => setFlash("")} /> : null}

        <Band metrics={facts} />

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end", margin: G3.layout.gap + "px 0 10px" }}>
          <div style={{ flex: "1 1 230px", minWidth: 0 }}>
            <Field id="att3-ot-q" label={t("att3.ot.f.who")}>
              <Input id="att3-ot-q" value={q} onChange={setQ} placeholder={t("att3.ot.f.whoPh")} />
            </Field>
          </div>
          <div style={{ flex: "1 1 200px", minWidth: 0 }}>
            <Field id="att3-ot-dept" label={t("att3.f.dept")}>
              <Select id="att3-ot-dept" value={dept} onChange={setDept}
                options={[{ value: "all", label: t("att3.f.deptAll") }].concat(otDepts.map((d) => ({ value: d, label: t(d) })))} />
            </Field>
          </div>
          <div style={{ flex: "1 1 200px", minWidth: 0 }}>
            <Field id="att3-ot-state" label={t("att3.reg.f.state")}>
              <Select id="att3-ot-state" value={state} onChange={setState}
                options={[{ value: "all", label: t("att3.reg.f.stateAll") }].concat(["open", "approved", "trimmed", "declined"].map((k) => ({ value: k, label: t(OT_LOOK[k].word) })))} />
            </Field>
          </div>
          <div style={{ flex: "1 1 200px", minWidth: 0 }}>
            <Field id="att3-ot-size" label={t("att3.ot.f.size")}>
              <Select id="att3-ot-size" value={size} onChange={setSize}
                options={[
                  { value: "all", label: t("att3.ot.f.sizeAll") },
                  { value: "small", label: t("att3.ot.f.sizeSmall", { n: hoursWord(t, OT_SMALL_MAX) }) },
                  { value: "big", label: t("att3.ot.f.sizeBig", { n: hoursWord(t, OT_SMALL_MAX) }) },
                ]} />
            </Field>
          </div>
          <div style={{ flex: "1 1 200px", minWidth: 0 }}>
            <Field id="att3-ot-when" label={t("att3.when")}>
              <Select id="att3-ot-when" value={when} onChange={setWhen}
                options={[
                  { value: "month", label: t("att3.when.month") },
                  { value: "quarter", label: t("att3.when.quarter") },
                  { value: "all", label: t("att3.when.all") },
                ]} />
            </Field>
          </div>
        </div>

        <div style={{ display: "flex", gap: 14, alignItems: "baseline", flexWrap: "wrap", marginBottom: 16 }}>
          <span style={ty("caption", { color: c.inkMuted })}>
            {t("att3.ot.f.count", { shown: num(rows0.length), total: num(scoped.length) })}
          </span>
          {filtered ? <LinkButton onClick={clearFilters}>{t("att3.ot.f.clear")}</LinkButton> : null}
        </div>

        {rows.length === 0 ? (
          <Card><EmptyState head={t("att3.ot.empty.head")} body={t("att3.ot.empty.body")} /></Card>
        ) : (
          <Register
            columns={columns} rows={rows}
            onSelect={(id) => setOpenId(id)}
            footer={<span style={ty("caption", { color: c.inkFaint })}>{t("att3.ot.foot")}</span>}
          />
        )}

        {open ? (
          <SideScreen
            title={open.id}
            sub={t(open.nameKey) + " · " + fmtISO(t, open.iso)}
            width={600}
            onClose={() => setOpenId(null)}
            footer={
              stateOf(open) === "open" ? (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Button kind="primary" size="sm" iconLeft="check" onClick={() => setAct({ kind: "approve", ot: open })}>{t("att3.ot.menu.approve")}</Button>
                  <Button kind="secondary" size="sm" iconLeft="clock" onClick={() => setAct({ kind: "trim", ot: open })}>{t("att3.ot.menu.trim")}</Button>
                  <Button kind="secondary" size="sm" iconLeft="arrow" onClick={() => setAct({ kind: "decline", ot: open })}>{t("att3.ot.menu.decline")}</Button>
                  <Button kind="ghost" size="sm" onClick={() => setOpenId(null)}>{t("att3.close")}</Button>
                </div>
              ) : <Button kind="ghost" size="sm" onClick={() => setOpenId(null)}>{t("att3.close")}</Button>
            }
          >
            <OTBody ot={open} state={stateOf(open)} hours={hoursOf(open)} />
          </SideScreen>
        ) : null}

        {act ? (
          <OTDecisionPanel
            kind={act.kind} ot={act.ot}
            onClose={() => setAct(null)}
            onDone={(hours) => {
              const st = act.kind === "approve" ? "approved" : act.kind === "trim" ? "trimmed" : "declined";
              setDecided(Object.assign({}, decided, { [act.ot.id]: { state: st, hours: hours } }));
              setFlash(t("att3.ot." + act.kind + ".done", { name: t(act.ot.nameKey), n: hoursWord(t, hours || act.ot.hours) }));
              setAct(null);
              setOpenId(null);
            }}
          />
        ) : null}
      </div>
    );
  }

  function OTBody({ ot, state, hours }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const look = OT_LOOK[state];
    return (
      <div>
        <div style={{ marginBottom: 16 }}>
          <StatusMark role={look.role} word={t(look.word)} glyph={look.glyph} />
        </div>
        <Row label={t("att3.ot.col.day")}>{fmtISO(t, ot.iso)}</Row>
        <Row label={t("att3.ot.side.shiftEnd")}>{ot.shiftEnd}</Row>
        <Row label={t("att3.ot.side.out")}>{ot.outT}</Row>
        <Row label={t("att3.ot.col.hours")} last>{hoursWord(t, hours)}</Row>

        <div style={{ marginTop: 20, paddingTop: 14, borderTop: "1px solid " + c.rule }}>
          <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 8 })}>{t("att3.ot.side.why")}</div>
          <p style={ty("small", { margin: 0, color: c.ink })}>{t(ot.reasonKey)}</p>
        </div>

        <p style={ty("caption", { margin: "18px 0 0", paddingTop: 14, borderTop: "1px solid " + c.rule, color: c.inkFaint })}>{t("att3.ot.sideRule")}</p>
      </div>
    );
  }

  function OTDecisionPanel({ kind, ot, onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [hours, setHours] = useState(String(ot.hours));
    const [why, setWhy] = useState("");
    const [err, setErr] = useState(false);
    const trim = kind === "trim";
    const n = Number(String(hours).replace(",", "."));

    function submit() {
      if (why.trim().length < 8) { setErr(true); return; }
      if (trim && (!(n > 0) || n >= ot.hours)) { setErr(true); return; }
      onDone(trim ? n : kind === "approve" ? ot.hours : 0);
    }

    return ReactDOM.createPortal(
      <div style={{ position: "fixed", inset: 0, zIndex: 2400, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "48px 20px", overflowY: "auto" }}>
        <div aria-hidden="true" onMouseDown={onClose} style={{ position: "fixed", inset: 0, background: c.rail, opacity: 0.55 }} />
        <div role="dialog" aria-modal="true" aria-label={t("att3.ot." + kind + ".title")}
          style={{ position: "relative", width: 560, maxWidth: "100%", background: c.surface, border: "1px solid " + c.border, borderRadius: G3.r.card, padding: 24 }}>
          <h2 style={ty("h2", { margin: "0 0 4px", color: c.ink })}>{t("att3.ot." + kind + ".title")}</h2>
          <p style={ty("small", { color: c.inkMuted, margin: "0 0 18px" })}>
            {t("att3.ot." + kind + ".body", { name: t(ot.nameKey), date: fmtISO(t, ot.iso), n: hoursWord(t, ot.hours) })}
          </p>

          {trim ? (
            <Field id="att3-ot-hours" label={t("att3.ot.trim.hours")} hint={t("att3.ot.trim.hoursHint", { n: hoursWord(t, ot.hours) })}>
              <Input id="att3-ot-hours" value={hours} onChange={(v) => { setHours(v); setErr(false); }} inputMode="decimal" />
            </Field>
          ) : null}

          <Field id="att3-ot-why" label={t("att3.ot.why")} hint={t("att3.ot.whyHint")} error={err ? t("att3.ot.whyErr") : null}>
            <Input id="att3-ot-why" value={why} onChange={(v) => { setWhy(v); setErr(false); }} placeholder={t("att3.ot." + kind + ".whyPh")} invalid={err} />
          </Field>

          <p style={ty("caption", { color: c.inkFaint, margin: "0 0 16px" })}>{t("att3.ot.consequence")}</p>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Button kind="ghost" size="sm" onClick={onClose}>{t("att3.cancel")}</Button>
            <Button kind={kind === "decline" ? "dangerOutline" : "primary"} size="sm" onClick={submit}>{t("att3.ot." + kind + ".confirm")}</Button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  function hoursWord(t, n) {
    if (!n) return t("att3.ot.hoursNone");
    return t("att3.ot.hoursN", { n: String(n).replace(".5", "½").replace(/\.0$/, "") });
  }

  /* ============================================================
     THE MODALS — one shape: what it changes, why, and what it costs
     ============================================================ */
  /* THE DAY IS THE FIRST QUESTION THIS PANEL ASKS (designer,
     2026-10-28). It used to correct whichever day the roll was
     showing, which made a record older than this morning unreachable
     without first steering the whole roll to that date and finding
     the person again — and a punch the reader missed is almost
     never noticed the same day. So: pick the day, read what it says
     now, then say what it should say.

     WHAT THE DAY SAYS NOW IS PART OF THE FORM. A correction is an
     overwrite of a particular record, and a form that will not show
     the reader the record is asking them to overwrite something they
     cannot see. It also answers the question the date picker creates
     — "did I pick the right day?" — before the reason is typed.

     AND A CLOSED MONTH STAYS CLOSED. July sits inside an approved,
     disbursed run; this screen says so and refuses, the same way the
     regularisation queue refuses, rather than writing a correction
     that payroll will not honour. */
  function CorrectionPanel({ kind, person, dayISO, onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [iso, setIso] = useState(dayISO);
    const [status, setStatus] = useState(kind === "duty" ? "onduty" : "present");
    const rec0 = recordOn(person, dayISO);
    const [inT, setInT] = useState(rec0.inT || "08:00");
    const [outT, setOutT] = useState(rec0.outT || "15:30");
    const [why, setWhy] = useState("");
    const [err, setErr] = useState(false);

    const rec = recordOn(person, iso);
    const look = DAY_LOOK[rec.state] || DAY_LOOK.off;
    const locked = iso < JULY_LOCK;
    const future = iso > TODAY_ISO;
    const blocked = locked || future;

    /* the times follow the day: what was on file for the day you have
       just picked is what you are about to amend, and a form holding
       another day's punches is a trap */
    function pickDay(next) {
      setIso(next);
      const r = recordOn(person, next);
      setInT(r.inT || "08:00");
      setOutT(r.outT || "15:30");
    }

    const titleKey = kind === "correct" ? "att3.menu.correct" : kind === "punch" ? "att3.menu.punch" : "att3.menu.duty";
    const bodyKey = kind === "correct" ? "att3.cor.body" : kind === "punch" ? "att3.punch.body" : "att3.duty.body";

    function submit() {
      if (blocked) return;
      if (why.trim().length < 8) { setErr(true); return; }
      const patch = { state: kind === "duty" ? "in" : status === "absent" ? "missing" : "in", inT: inT, outT: kind === "punch" ? outT : rec.outT, why: why.trim() };
      onDone(iso, patch, t("att3.cor.done", { name: t(person.nameKey), date: fmtISO(t, iso) }));
    }

    return ReactDOM.createPortal(
      <div style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "48px 20px", overflowY: "auto" }}>
        <div aria-hidden="true" onMouseDown={onClose} style={{ position: "fixed", inset: 0, background: c.rail, opacity: 0.55 }} />
        <div role="dialog" aria-modal="true" aria-label={t(titleKey)}
          style={{ position: "relative", width: 560, maxWidth: "100%", background: c.surface, border: "1px solid " + c.border, borderRadius: G3.r.card, padding: 24 }}>
          <h2 style={ty("h2", { margin: "0 0 4px", color: c.ink })}>{t(titleKey)}</h2>
          <p style={ty("small", { color: c.inkMuted, margin: "0 0 18px" })}>
            {t(bodyKey, { name: t(person.nameKey) })}
          </p>

          {/* WHICH DAY, AND WHAT IT SAYS NOW: one row, because they are
              one question and its answer. */}
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-start" }}>
            <div style={{ flex: "0 1 220px", minWidth: 190 }}>
              <Field id="att3-cor-day" label={t("att3.cor.day")}>
                <Input id="att3-cor-day" type="date" value={iso} onChange={pickDay} min={SESSION_FROM} max={TODAY_ISO} />
              </Field>
            </div>
            <div style={{ flex: "1 1 230px", minWidth: 200, marginBottom: 20 }}>
              <div style={ty("small", { display: "block", color: c.ink, fontWeight: 600, marginBottom: 7 })}>{t("att3.cor.asIs")}</div>
              <div style={{
                minHeight: G3.layout.fieldH, boxSizing: "border-box",
                border: "1px solid " + c.rule, borderRadius: G3.r.md, background: c.sunken,
                padding: "8px 13px", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap",
              }}>
                <StatusMark role={look.role} word={t(look.word)} glyph={look.glyph} />
                <span style={G3.fig("xs", { color: c.inkMuted })}>
                  {rec.inT ? rec.inT + (rec.outT ? " – " + rec.outT : "") : t("att3.side.histNone")}
                </span>
              </div>
            </div>
          </div>

          {kind === "correct" ? (
            <Field id="att3-cor-status" label={t("att3.cor.status")}>
              <Select id="att3-cor-status" value={status} onChange={setStatus}
                options={["present", "half", "absent", "onduty"].map((k) => ({ value: k, label: t("att3.was." + k) }))} />
            </Field>
          ) : null}

          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 150px" }}>
              <Field id="att3-cor-in" label={t("att3.col.in")}>
                <Input id="att3-cor-in" type="time" value={inT} onChange={setInT} />
              </Field>
            </div>
            {kind !== "duty" ? (
              <div style={{ flex: "1 1 150px" }}>
                <Field id="att3-cor-out" label={t("att3.col.out")}>
                  <Input id="att3-cor-out" type="time" value={outT} onChange={setOutT} />
                </Field>
              </div>
            ) : null}
          </div>

          <Field id="att3-cor-why" label={t("att3.cor.why")} hint={t("att3.cor.whyHint")} error={err ? t("att3.cor.whyErr") : null}>
            <Input id="att3-cor-why" value={why} onChange={(v) => { setWhy(v); setErr(false); }} placeholder={t("att3.cor.whyPh")} invalid={err} />
          </Field>

          {/* the consequence is a fact about the day that was picked,
              so it changes when the day does */}
          <p style={ty("caption", { color: blocked ? c.dangerText : c.inkFaint, margin: "0 0 16px" })}>
            {locked ? t("att3.cor.locked", { date: fmtISO(t, iso) })
              : future ? t("att3.cor.future", { date: fmtISO(t, iso) })
                : t("att3.cor.consequence", { run: RUN_AUG })}
          </p>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Button kind="ghost" size="sm" onClick={onClose}>{t("att3.cancel")}</Button>
            <Button kind="primary" size="sm" iconLeft="attendance" disabled={blocked} onClick={submit}>{t("att3.cor.confirm")}</Button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  function RegDecisionPanel({ kind, reg, onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [why, setWhy] = useState("");
    const [err, setErr] = useState(false);
    const accept = kind === "accept";
    return ReactDOM.createPortal(
      <div style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "48px 20px", overflowY: "auto" }}>
        <div aria-hidden="true" onMouseDown={onClose} style={{ position: "fixed", inset: 0, background: c.rail, opacity: 0.55 }} />
        <div role="dialog" aria-modal="true" aria-label={t(accept ? "att3.reg.menu.accept" : "att3.reg.menu.back")}
          style={{ position: "relative", width: 560, maxWidth: "100%", background: c.surface, border: "1px solid " + c.border, borderRadius: G3.r.card, padding: 24 }}>
          <h2 style={ty("h2", { margin: "0 0 4px", color: c.ink })}>{t(accept ? "att3.reg.accept.title" : "att3.reg.back.title")}</h2>
          <p style={ty("small", { color: c.inkMuted, margin: "0 0 18px" })}>
            {t(accept ? "att3.reg.accept.body" : "att3.reg.back.body", { name: t(reg.nameKey), date: fmtISO(t, reg.iso), was: t("att3.was." + reg.was), want: t("att3.was." + reg.want) })}
          </p>
          <Field id="att3-reg-why" label={t(accept ? "att3.reg.accept.why" : "att3.reg.back.why")} hint={t("att3.reg.whyHint")} error={err ? t("att3.cor.whyErr") : null}>
            <Input id="att3-reg-why" value={why} onChange={(v) => { setWhy(v); setErr(false); }} placeholder={t(accept ? "att3.reg.accept.whyPh" : "att3.reg.back.whyPh")} invalid={err} />
          </Field>
          <p style={ty("caption", { color: c.inkFaint, margin: "0 0 16px" })}>{t(accept ? "att3.reg.accept.note" : "att3.reg.back.note", { run: RUN_AUG })}</p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Button kind="ghost" size="sm" onClick={onClose}>{t("att3.cancel")}</Button>
            <Button kind={accept ? "primary" : "secondary"} size="sm" onClick={() => { if (why.trim().length < 8) { setErr(true); return; } onDone(); }}>
              {t(accept ? "att3.reg.accept.confirm" : "att3.reg.back.confirm")}
            </Button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  /* ---- small shared pieces ------------------------------------- */
  function Row({ label, children, last }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div style={{ display: "flex", gap: 14, alignItems: "baseline", padding: "9px 0", borderBottom: last ? "none" : "1px solid " + c.rule }}>
        <span style={ty("caption", { color: c.inkFaint, width: 150, flexShrink: 0 })}>{label}</span>
        <span style={ty("small", { color: c.ink, flex: 1, minWidth: 0 })}>{children}</span>
      </div>
    );
  }

  function FlashLine({ text, onDismiss }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    return (
      <div role="status" style={{ display: "flex", gap: 11, alignItems: "flex-start", border: "1px solid " + c.border, borderRadius: G3.r.lg, padding: "12px 14px", marginBottom: G3.layout.gap }}>
        <span aria-hidden="true" style={{ display: "flex", color: c.presentText, paddingTop: 1 }}><Icon name="check" size={16} /></span>
        <p style={ty("small", { margin: 0, color: c.ink, flex: 1 })}>{text}</p>
        <LinkButton onClick={onDismiss}>{t("att3.dismiss")}</LinkButton>
      </div>
    );
  }



  /* ============================================================
     THE SCREEN
     ============================================================ */
  const TABS = [
    { key: "day", labelKey: "att3.tab.day", qKey: "att3.q.day" },
    { key: "regs", labelKey: "att3.tab.regs", qKey: "att3.q.regs" },
    { key: "overtime", labelKey: "att3.tab.overtime", qKey: "att3.q.overtime" },
    { key: "exceptions", labelKey: "att3.tab.exceptions", qKey: "att3.q.exceptions" },
    { key: "shifts", labelKey: "att3.tab.shifts", qKey: "att3.q.shifts" },
  ];

  function HRAttendance({ role, onNavigate }) {
    const { c } = useTheme();
    const { t, ty, lang } = useLang();
    const L = G3.layout;
    const [tab, setTab] = useState("day");
    const [campus, setCampus] = useState("indiranagar");
    const [flash, setFlash] = useState("");
    const def = TABS.filter((d) => d.key === tab)[0];

    /* the two tabs that moved here from the leave module, mounted
       rather than copied */
    const Exceptions = window.Pages3 && window.Pages3.AttExceptionsTab;
    const Shifts = window.Pages3 && window.Pages3.AttShiftsTab;

    return (
      <div className="nv3" style={{ display: "flex", minHeight: "100vh", background: c.page, color: c.ink, fontFamily: G3.font.ui }}>
        <Rail role={role || "hr"} active="hrAttendance" onNavigate={onNavigate} initials="MI" />
        <main style={{ flex: 1, minWidth: 0, position: "relative", overflowX: "clip" }}>
          <Motif />
          <div style={{ position: "relative", zIndex: 1, maxWidth: L.contentMax, margin: "0 auto", padding: "22px " + L.contentPadX + "px 64px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, marginBottom: 16 }}>
              <div style={ty("small", { color: c.inkMuted })}>
                <span style={{ color: c.ink, fontWeight: 700 }}>{t("nav.hrAttendance")}</span>
                <span style={{ margin: "0 8px", color: c.inkFaint }}>·</span>
                <span>{t("home.school")}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <ThemeToggle />
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, flexWrap: "wrap", marginBottom: 18 }}>
              <div style={{ minWidth: 0 }}>
                <h1 style={ty("display", { margin: 0, color: c.ink })}>{t("att3.title")}</h1>
              </div>
              <CampusSwitch value={campus} onChange={(k) => { setCampus(k); setFlash(""); }} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <Tabs
                idBase="att3" ariaLabel={t("att3.tabs.aria")} active={tab} size="lg"
                onChange={(k) => { setTab(k); setFlash(""); }}
                items={TABS.map((d) => ({ key: d.key, label: t(d.labelKey) }))}
              />
              <p style={ty("small", { color: c.inkMuted, margin: "14px 2px 0" })}>{t(def.qKey)}</p>
            </div>

            <TabPanel idBase="att3" tabKey={tab}>
              {tab === "day" ? <DayTab key={campus} campus={campus} flash={flash} setFlash={setFlash} /> : null}
              {tab === "regs" ? <RegsTab key={campus} campus={campus} flash={flash} setFlash={setFlash} /> : null}
              {tab === "overtime" ? <OvertimeTab key={campus} campus={campus} flash={flash} setFlash={setFlash} /> : null}
              {tab === "exceptions" && Exceptions ? <Exceptions flash={flash} setFlash={setFlash} onNavigate={onNavigate} /> : null}
              {tab === "shifts" && Shifts ? <Shifts flash={flash} setFlash={setFlash} /> : null}
            </TabPanel>
          </div>
        </main>
      </div>
    );
  }

  addStrings({
    en: {
      "att3.title": "Staff attendance",
      "att3.tabs.aria": "Staff attendance sections",
      "att3.tab.day": "Today",
      "att3.tab.overtime": "Overtime",
      "att3.q.overtime": "Who worked beyond their shift, what for, and do you accept the hours?",
      "att3.ot.f.who": "Who",
      "att3.ot.f.whoPh": "Name or claim number",
      "att3.ot.f.size": "How long",
      "att3.ot.f.sizeAll": "Any length",
      "att3.ot.f.sizeSmall": "{n} or less",
      "att3.ot.f.sizeBig": "More than {n}",
      "att3.ot.f.count": "{shown} of {total} claims on this campus",
      "att3.ot.f.clear": "Clear the filters",
      "att3.ot.f.claims": "Waiting on you",
      "att3.ot.f.claimsNote": "{h} in all",
      "att3.ot.f.claimsNone": "No claim is waiting",
      "att3.ot.f.ok": "Approved",
      "att3.ot.f.okNote": "{h} go to payroll",
      "att3.ot.f.okNone": "None approved yet",
      "att3.ot.f.cut": "Trimmed",
      "att3.ot.f.cutNote": "{h} kept of what was claimed",
      "att3.ot.f.cutNone": "None trimmed",
      "att3.ot.f.no": "Declined",
      "att3.ot.f.noNote": "{h} not paid",
      "att3.ot.f.noNone": "None declined",
      "att3.ot.col.who": "Employee",
      "att3.ot.col.day": "The day",
      "att3.ot.col.hours": "Hours",
      "att3.ot.col.why": "What for",
      "att3.ot.col.state": "State",
      "att3.ot.st.open": "Waiting on you",
      "att3.ot.st.approved": "Accepted",
      "att3.ot.st.trimmed": "Accepted in part",
      "att3.ot.st.declined": "Declined",
      "att3.ot.cutFrom": "cut from {n}",
      "att3.ot.hoursN": "{n} hours",
      "att3.ot.hoursNone": "None",
      "att3.ot.decidedWhy": "It has already been decided.",
      "att3.ot.menu.aria": "Actions for {id}",
      "att3.ot.menu.open": "Open the claim",
      "att3.ot.menu.approve": "Accept the hours",
      "att3.ot.menu.trim": "Accept fewer hours",
      "att3.ot.menu.decline": "Decline it",
      "att3.ot.side.shiftEnd": "Shift ended",
      "att3.ot.side.out": "Punched out",
      "att3.ot.side.why": "What the hours were for",
      "att3.ot.sideRule": "Accepted hours go to the next run at the rate on that person's salary structure. This screen never shows the rate.",
      "att3.ot.empty.head": "Nothing waiting",
      "att3.ot.empty.body": "No overtime claim in this state on this campus.",
      "att3.ot.foot": "Hours are derived from the punches; a claim with no punch behind it cannot be raised at all.",
      "att3.ot.why": "Your line on it",
      "att3.ot.whyHint": "It goes on the claim, and the employee reads it.",
      "att3.ot.whyErr": "A line, please — and cut hours must be fewer than the hours claimed.",
      "att3.ot.consequence": "Recorded against your name. Accepted hours reach the next run; nothing on the attendance record itself changes.",
      "att3.ot.approve.title": "Accept the hours",
      "att3.ot.approve.body": "{name}, {date} — {n}, as claimed.",
      "att3.ot.approve.whyPh": "Route 4 broke down; he stayed with the bus until the replacement came.",
      "att3.ot.approve.confirm": "Accept",
      "att3.ot.approve.done": "{n} accepted for {name}.",
      "att3.ot.trim.title": "Accept fewer hours",
      "att3.ot.trim.body": "{name}, {date} — {n} claimed. Enter what the school is paying.",
      "att3.ot.trim.hours": "Hours you accept",
      "att3.ot.trim.hoursHint": "Fewer than {n}. The claim keeps its original figure underneath.",
      "att3.ot.trim.whyPh": "The exam sitting ended at 18:30; the last hour was not asked for.",
      "att3.ot.trim.confirm": "Accept that much",
      "att3.ot.trim.done": "{n} accepted for {name}.",
      "att3.ot.decline.title": "Decline the claim",
      "att3.ot.decline.body": "{name}, {date} — {n} claimed. Nothing is paid, and they see your reason.",
      "att3.ot.decline.whyPh": "No approval was asked for beforehand, and the work is inside the ordinary day.",
      "att3.ot.decline.confirm": "Decline it",
      "att3.ot.decline.done": "The claim from {name} has been declined.",
      "att3.ot.r.bus": "Route 4 broke down at Domlur; stayed with the bus until the replacement came.",
      "att3.ot.r.exam": "Set up the hall for the Term-1 examination sittings and locked up after.",
      "att3.ot.r.audit": "Stayed for the internal audit of the July fee reconciliation.",
      "att3.ot.r.parents": "Parents’ evening for classes 11 and 12.",
      "att3.ot.r.thin": "Was in the staff room.",
      "att3.tab.regs": "Regularisations",
      "att3.tab.exceptions": "Days to fix",
      "att3.tab.shifts": "Shifts and rosters",
      "att3.q.day": "Who is in, who is late, and whose punch never arrived?",
      "att3.q.regs": "What have people asked HR to correct?",
      "att3.q.exceptions": "Which days did not reconcile, and what does each become if nobody touches it?",
      "att3.q.shifts": "Who is rostered to what shift?",
      "att3.campus.aria": "Campus",
      "att3.close": "Close",
      "att3.cancel": "Not now",
      "att3.dismiss": "Dismiss",
      "att3.export": "Export the day",
      "att3.export.done": "Today's attendance has been exported, recorded against your name.",

      "att3.day.title": "{date}",
      "att3.day.pick": "The day",
      "att3.day.today": "Today",
      "att3.day.off": "{date} was a weekly off. Nobody was expected, so nothing is missing.",
      "att3.when": "When",
      "att3.when.month": "This month",
      "att3.when.quarter": "The last three months",
      "att3.when.all": "Everything on record",
      "att3.f.in": "In on time",
      "att3.f.inNote": "of {n} on the roll",
      "att3.f.late": "Late",
      "att3.f.lateNote": "{name} the latest, in at {at}",
      "att3.f.lateNone": "Nobody past the grace",
      "att3.f.missing": "No punch",
      "att3.f.missingNone": "Every punch accounted for",
      "att3.f.leave": "Not expected",
      "att3.f.leaveNone": "Everybody was expected",
      "att3.f.andMore": "{names} and {n} more",
      "att3.f.whoWhen": "{name}, {date}",
      "att3.f.dept": "Department",
      "att3.f.deptAll": "Every department",
      "att3.f.state": "Status",
      "att3.f.stateAll": "Any status",

      "att3.col.who": "Employee",
      "att3.col.shift": "Shift",
      "att3.col.in": "In",
      "att3.col.out": "Out",
      "att3.col.hours": "Hours",
      "att3.col.state": "Status",
      "att3.col.actions": "Actions",
      "att3.dayReg.title": "Who was in, and when",
      "att3.dayReg.sub": "{shown} of {total} on this campus. Open a row for the day as it was recorded.",
      "att3.dayReg.foot": "A correction never deletes a punch: the reader's record stays underneath, with yours on top of it.",

      "att3.st.in": "In school",
      "att3.st.done": "Day complete",
      "att3.st.late": "Late",
      "att3.st.missing": "No punch",
      "att3.st.leave": "On leave",
      "att3.st.noshift": "On no shift",
      "att3.lateBy": "{n} minutes past grace",
      "att3.hrs": "{h}h {m}m",
      "att3.corrected": "corrected by you today",
      "att3.note.gate": "Punched at the side gate, 1.8 km reader.",

      "att3.reg.foot": "Accepting one writes the corrected record, attributed to you, with the reader's original kept underneath.",
      "att3.reg.col.who": "Employee",
      "att3.reg.col.day": "The day",
      "att3.reg.col.change": "The change asked for",
      "att3.reg.col.state": "State",
      "att3.reg.change": "{was} → {want}",
      "att3.reg.st.open": "Waiting on you",
      "att3.reg.st.accepted": "Accepted",
      "att3.reg.st.sentBack": "Sent back",
      "att3.reg.st.locked": "Month is closed",
      "att3.reg.lockedWhy": "July is inside an approved run.",
      "att3.reg.lockedLong": "This day sits inside July's run, approved and disbursed. A correction now goes through arrears instead.",
      "att3.reg.decidedWhy": "It has already been decided.",
      "att3.reg.f.open": "Waiting on you",
      "att3.reg.f.openNone": "Nothing is waiting",
      "att3.reg.f.accepted": "Accepted",
      "att3.reg.f.acceptedNone": "None accepted yet",
      "att3.reg.f.back": "Sent back",
      "att3.reg.f.backNone": "None sent back",
      "att3.reg.f.locked": "Too late to change",
      "att3.reg.f.lockedNone": "Nothing in a closed month",
      "att3.reg.f.state": "State",
      "att3.reg.f.stateAll": "Any state",
      "att3.reg.sideRule": "Accepting this writes the attendance record and is picked up when {run} retakes its snapshot.",
      "att3.reg.empty.head": "Nothing is waiting",
      "att3.reg.empty.body": "No regularisation in this state on this campus.",
      "att3.reg.menu.aria": "Actions for {id}",
      "att3.reg.menu.open": "Open the request",
      "att3.reg.menu.accept": "Accept and correct",
      "att3.reg.menu.back": "Send it back",
      "att3.reg.side.asked": "Asked on",
      "att3.reg.side.onRecord": "On the record",
      "att3.reg.side.wants": "Asking for",
      "att3.reg.side.times": "Times given",
      "att3.reg.side.why": "What they wrote",
      "att3.reg.why.gate": "The side gate reader was not working that morning — the guard let us through the main gate and wrote our names down.",
      "att3.reg.why.offsite": "I was at the science fair at the Whitefield campus until the afternoon, then came back to teach period seven.",
      "att3.reg.why.route": "Route 4 broke down at Domlur; I was with the bus until the replacement came, then reached school.",
      "att3.reg.why.bank": "The school asked me to be at the bank for the account signature change. I came in after.",
      "att3.reg.why.thin": "I was here.",
      "att3.reg.accept.title": "Accept and correct the record",
      "att3.reg.accept.body": "{name}'s {date} becomes {want} instead of {was}, with the times they gave.",
      "att3.reg.accept.why": "Why you accept it",
      "att3.reg.accept.whyPh": "The guard's register confirms the entry at 07:48.",
      "att3.reg.accept.note": "The corrected record is written now and attributed to you; the original stays underneath. Pay follows when {run} retakes its snapshot.",
      "att3.reg.accept.confirm": "Accept and correct",
      "att3.reg.back.title": "Send it back",
      "att3.reg.back.body": "{name}'s {date} stays as {was}. They can answer and ask again.",
      "att3.reg.back.why": "What they need to add",
      "att3.reg.back.whyPh": "Say which gate you used and who let you in.",
      "att3.reg.back.note": "Nothing on the record changes. They see your line with the request and can send it again.",
      "att3.reg.back.confirm": "Send it back",
      "att3.reg.accepted": "{name}'s {date} has been corrected.",
      "att3.reg.sentBackDone": "{name}'s request for {date} has been sent back.",
      "att3.reg.whyHint": "One line. It is on the record and the employee reads it.",

      "att3.was.present": "Present",
      "att3.was.half": "Half day",
      "att3.was.absent": "Absent",
      "att3.was.onduty": "On duty",
      "att3.was.missing": "No punch",
      "att3.was.late": "Late",

      "att3.menu.aria": "Actions for {name}",
      "att3.menu.open": "Open the day",
      "att3.menu.correct": "Correct attendance",
      "att3.menu.punch": "Add a missing punch",
      "att3.menu.duty": "Mark as on duty",
      "att3.cor.body": "{name}. Pick the day, then say what it should read. The punch stays on the record; your correction is written on top of it.",
      "att3.punch.body": "{name}. Pick the day the reader missed, then add the times it never recorded.",
      "att3.duty.body": "{name}. Pick the day, then record it as on duty — a working day away from the gate: a fair, an exam centre, a bank errand for the school.",
      "att3.cor.day": "Which day",
      "att3.cor.asIs": "What it says now",
      "att3.cor.status": "What the day becomes",
      "att3.cor.why": "Why",
      "att3.cor.whyHint": "What you are going on. It is on the record with your name.",
      "att3.cor.whyPh": "Guard's register shows the entry at the main gate at 07:48.",
      "att3.cor.whyErr": "A line, please — a corrected attendance record with no reason cannot be answered for later.",
      "att3.cor.consequence": "Recorded now and attributed to you. Paid days move when {run} retakes its snapshot.",
      "att3.cor.locked": "{date} is inside an approved, disbursed run. It cannot be corrected here — the difference goes out as arrears from payroll.",
      "att3.cor.future": "{date} has not happened yet. There is no record to correct.",
      "att3.cor.confirm": "Save the correction",
      "att3.cor.done": "{name}'s {date} has been corrected.",

      "att3.st.off": "Weekly off",
      "att3.side.histNone": "Nothing recorded",
      "att3.side.histOf": "{name}, day by day",
      "att3.side.source": "Where it came from",
      "att3.side.sourceV": "Gate reader, Indiranagar",
      "att3.side.dayDate": "{wd}, {date}",
      "att3.wd.0": "Sunday", "att3.wd.1": "Monday", "att3.wd.2": "Tuesday", "att3.wd.3": "Wednesday",
      "att3.wd.4": "Thursday", "att3.wd.5": "Friday", "att3.wd.6": "Saturday",
      "att3.side.editedBy": "Corrected by you today — {why}",
      "att3.tl.in": "Punched in at {time}",
      "att3.tl.noIn": "No punch in",
      "att3.tl.out": "Punched out at {time}",
      "att3.tl.noOut": "Not punched out yet",

      "att3.empty.head": "Nobody matches that",
      "att3.empty.body": "Try another department or status.",

      "att3.p.ananya": "Ananya Rao", "att3.p.karan": "Karan Mehta", "att3.p.meeraj": "Meera Joshi",
      "att3.p.divya": "Divya Kamath", "att3.p.suresh": "Suresh Kamath", "att3.p.manju": "Manjunath Gowda",
      "att3.p.priya": "Priya Nair", "att3.p.ramesh": "Ramesh Iyengar", "att3.p.neha": "Neha Bhatt",
      "att3.p.rohit": "Rohit Malhotra", "att3.p.shanti": "Shanti Devi", "att3.p.iqbal": "Iqbal Khan",
      "att3.p.devika": "Devika Rao", "att3.p.rahul": "Rahul Verma", "att3.p.prakash": "Prakash Rao",
      "att3.g.pgtPhy": "PGT, Physics", "att3.g.pgtChem": "PGT, Chemistry", "att3.g.tgtBio": "TGT, Biology",
      "att3.g.tgtChem": "TGT, Chemistry", "att3.g.accounts": "Accounts executive", "att3.g.driver4": "Bus driver, Route 4",
      "att3.g.driver2": "Bus driver, Route 2", "att3.g.facilities": "Facilities in-charge", "att3.g.prt5": "PRT, Class 5",
      "att3.g.prt3": "PRT, Class 3", "att3.g.guestSan": "Guest faculty, Sanskrit",
      "att3.g.tgtEnglish": "TGT, English", "att3.g.support": "Transport supervisor",
      "att3.d.science": "Science", "att3.d.admin": "Administration", "att3.d.transport": "Transport",
      "att3.d.primary": "Primary", "att3.d.languages": "Languages",
      "att3.sh.morning": "Morning — teaching", "att3.sh.general": "General — administration",
      "att3.sh.transport": "Transport split", "att3.sh.none": "No shift set",

      "att3.mon.01": "Jan", "att3.mon.02": "Feb", "att3.mon.03": "Mar", "att3.mon.04": "Apr",
      "att3.mon.05": "May", "att3.mon.06": "Jun", "att3.mon.07": "Jul", "att3.mon.08": "Aug",
      "att3.mon.09": "Sep", "att3.mon.10": "Oct", "att3.mon.11": "Nov", "att3.mon.12": "Dec",
    },
  });

  window.Pages3 = window.Pages3 || {};
  window.Pages3.HRAttendance = HRAttendance;
  /* THE DAY, FOR WHOEVER ELSE COUNTS IT. HR's home says who is on
     leave and who is missing; this screen is where that is recorded.
     Counting it twice is how two screens come to disagree about the
     same morning. */
  window.Pages3.AttToday = {
    roll: function (campus) { return DAY.filter(function (p) { return inCampusKey(campus, p.campusKey); }); },
    /* "noshift" is NOT one of these: that person punched in, they just
       have no shift against their name, which is a roster gap and not an
       absence. Counting them as absent would put a name on HR's home
       screen that the attendance screen shows as present. */
    countOf: function (campus, state) {
      return DAY.filter(function (p) {
        return inCampusKey(campus, p.campusKey) && p.state === state;
      }).length;
    },
  };
})();
