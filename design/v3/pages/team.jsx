/* @jsxRuntime classic */
/* ============================================================
   Naveya — My team · window.Pages3.MyTeam
   EMP-20 (a teacher's department) · DH-05 (a head's department)

   THE QUESTION: "who is in today, and how has the month gone?"

   ONE SCREEN, TWO READERS. A teacher opens it before she asks somebody
   to cover her classes — she needs to know who is at school. A head of
   department opens it because nothing else in this product simply
   lists who is on her team; her other screens are queues of what they
   have asked for, and a queue is not a roster.

   A SUMMARY, AND NOTHING BEHIND IT (designer). Every card is a whole
   answer — face, name, what they do, whether they are in, and the
   month at a glance. No card opens. There is no panel, no row menu, no
   route to a record. The register with the day-by-day detail is the
   head's own screen (DH-03); the staff file with PII is HR's (HR-02).

   WHERE THE FIGURES COME FROM. The people are window.LeaveFlow.PEOPLE,
   the same roster the leave ladder, the cover requests and the
   celebrations card are built from. The day is window.NaveyaDeptDay,
   which is DH-03's own register — so the count on this screen and the
   rows on hers cannot disagree. Nothing here is computed twice.

   THE LINE THIS SCREEN HOLDS. It shows PRESENCE — in, late, on leave,
   not in — and never the KIND of leave. Medical leave is health data
   (§8-F14) and a colleague has no business reading it; "On leave" is
   the whole of what anybody is told. No phone number, no email, no
   date of birth, no staff number either: a colleague directory is not
   consent to circulate contact details.
   ============================================================ */
(function () {
  const G3 = window.G3;
  const UI = window.UI3;
  const { useState } = React;
  const {
    useTheme, ThemeToggle, useLang, addStrings,
    Rail, Motif, Card, Chip, StatusMark, EmptyState, FigureBlocks, Button, num,
  } = UI;

  const LF = window.LeaveFlow;
  const DAY = window.NaveyaDeptDay;

  /* which person in the shared roster is signed in. Only the two roles
     whose rail carries this screen are mapped; anything else gets the
     honest empty state rather than somebody else's department. */
  const ME_ID = { employee: "ananya", deptHead: "anjali" };

  addStrings({
    en: {
      "tm.crumb": "My team",
      "tm.title": "My team",
      "tm.countEmp": "{n} people in {dept}",
      "tm.countHead": "{n} people in {dept} — {m} of them report to you",
      "tm.you": "You",

      /* ---- today. A LABEL IS ENOUGH: "On time" needs no sentence
         under it explaining that it means in before the grace closed,
         and five such sentences are what made this read as a form. ---- */
      "tm.today": "At school today",
      "tm.m.onTime": "On time",
      "tm.m.late": "Late in",
      "tm.m.leave": "On leave",
      "tm.m.out": "Not in",
      "tm.m.phone": "Marked remotely",
      "tm.m.of": "of {n}",
      "tm.n.none": "Nobody today",
      "tm.n.more": "{names} and {n} more",
      "tm.n.remote": "{n} marked remotely",
      "tm.n.atGate": "All marked at a gate",

      /* ---- the filter ---- */
      "tm.f.all": "Everyone",
      "tm.f.in": "In",
      "tm.f.late": "Late",
      "tm.f.leave": "On leave",
      "tm.f.out": "Not in",
      "tm.f.aria": "Show only part of the team",
      "tm.noHit": "Nobody is in that state today",
      "tm.noHitWhy": "Choose {all} to see the whole department again.",

      /* ---- a person's day ---- */
      "tm.st.in": "In · {t}",
      "tm.st.late": "Late · {t}",
      "tm.st.leave": "On leave",
      "tm.st.absent": "Not in",
      "tm.st.missing": "No punch",
      "tm.st.off": "Week off",
      "tm.st.unknown": "Nothing on record",
      "tm.phoneMark": "remote",
      "tm.k.since": "Joined",
      "tm.roster": "The people",
      "tm.rosterSub": "{n} of {all}, by the filter above",

      /* ---- a person's month ---- */
      "tm.monthLabel": "August",
      "tm.cnt.p": "{n} present",
      "tm.cnt.l": "{n} late",
      "tm.cnt.v": "{n} leave",
      "tm.monthNone": "Nothing marked this month",
      "tm.cal.title": "Team calendar",
      "tm.cal.sub": "August 2026",
      "tm.d0": "Su", "tm.d1": "Mo", "tm.d2": "Tu", "tm.d3": "We",
      "tm.d4": "Th", "tm.d5": "Fr", "tm.d6": "Sa",
      "tm.cal.aria": "The department's month, person by person",
      "tm.monthAria": "{name} in August so far: {p} present, {l} late, {v} on leave.",
      "tm.wk.more": "Show all {n}",
      "tm.wk.less": "Show the first three",
      "tm.l.present": "Present",
      "tm.l.late": "Late in",
      "tm.l.leave": "On leave",
      "tm.l.absent": "Not in",
      "tm.l.missing": "No punch",
      "tm.l.outage": "No punch",
      "tm.l.off": "Week off",
      "tm.l.holiday": "Holiday",
      "tm.cell": "{d} {m} · {state}",
      "tm.w.present": "present",
      "tm.w.late": "late in",
      "tm.w.leave": "on leave",
      "tm.w.off": "week off",
      "tm.w.holiday": "school holiday",
      "tm.w.absent": "not in",
      "tm.w.missing": "no punch",
      "tm.w.outage": "no punch",
      "tm.w.ahead": "still to come",
      "tm.w.unknown": "nothing on record",

      "tm.none": "You are not in a department yet",
      "tm.noneBody": "The office sets a department when your record is created. Until then there is nobody to show here.",
      "tm.aria": "The people in {dept}",
    },
  });

  /* present and late are both AT SCHOOL; the register distinguishes
     them and so does this screen, but a reader asking "who is here"
     wants one answer. */
  const IN_STATES = { present: 1, late: 1 };
  const OUT_STATES = { absent: 1, missing: 1, outage: 1 };
  /* a punch made away from a gate device: the app with a location
     check, or the web clock-in on My attendance */
  const REMOTE = { geo: 1, web: 1 };

  function stateOf(day) { return day ? day.status : "unknown"; }

  /* head of department first — the one fact about the shape of a team
     — then everybody by name, with the reader marked where she falls
     rather than lifted out of the alphabet. */
  function teamOf(t, meId) {
    if (!LF || !LF.PEOPLE) return { me: null, rows: [] };
    const me = LF.PEOPLE.filter(function (p) { return p.id === meId; })[0] || null;
    if (!me || !me.deptKey) return { me: me, rows: [] };
    const today = DAY ? DAY.TODAY_ISO : null;
    /* EVERY CARD BUT ONE IS A FIXTURE. The reader's own row can change
       while the page is open — she can clock in from Home — so it is
       read from the screen that owns the punch rather than from the
       register, which was written this morning. */
    const mine = window.NaveyaClock && window.NaveyaClock.myDayNow ? window.NaveyaClock.myDayNow() : null;
    return {
      me: me,
      rows: LF.PEOPLE
        .filter(function (p) { return p.deptKey === me.deptKey; })
        .map(function (p) {
          const day = p.id === me.id && mine ? mine : (DAY && today ? DAY.dayOf(p.id, today) : null);
          return { p: p, day: day, st: stateOf(day) };
        })
        .sort(function (a, b) {
          const ha = a.p.role === "deptHead" ? 0 : 1;
          const hb = b.p.role === "deptHead" ? 0 : 1;
          if (ha !== hb) return ha - hb;
          return t(a.p.nameKey).localeCompare(t(b.p.nameKey));
        }),
    };
  }

  /* `live` is today's row when the person being drawn is the reader,
     so her strip and her status mark cannot disagree the moment she
     clocks in from Home. */
  function monthOf(id, live) {
    if (!DAY) return null;
    const m = DAY.monthOf(id);
    const today = Number(DAY.TODAY_ISO.slice(-2));
    let p = 0, l = 0, v = 0;
    const cells = [];
    for (let d = 1; d <= 31; d++) {
      const st = d === today && live ? stateOf(live) : stateOf(m[DAY.isoAug(d)]);
      if (st === "present") p++;
      else if (st === "late") l++;
      else if (st === "leave") v++;
      cells.push({ d: d, st: st });
    }
    return { cells: cells, p: p, l: l, v: v };
  }

  /* the face. There are no photographs in this product, so the disc is
     initials on a tint drawn from the name — the same bank the cover
     requests and the registers use, so one person is one colour
     wherever they appear. */
  function Face({ name, size }) {
    const { c } = useTheme();
    const s = size || 44;
    const tone = UI.avatarTone(name, c, { bg: c.sunken, fg: c.inkMuted });
    const ini = name.split(" ").map(function (w) { return w[0]; }).slice(0, 2).join("");
    return (
      <span aria-hidden="true" style={{
        width: s, height: s, borderRadius: G3.r.pill, flexShrink: 0,
        background: tone.bg, color: tone.fg,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontFamily: G3.font.ui, fontSize: Math.round(s * 0.34), fontWeight: 700, letterSpacing: "0.01em",
      }}>{ini}</span>
    );
  }

  /* THE MONTH, AS A CALENDAR OF ROWS.

     A ROSTER IS GLANCED AT. The cards answer "who is this, and are
     they in"; the month is a second question and gets a section of its
     own under them, three people deep. Carrying the month ON the cards
     -- first as a row of bars, then as a seven-column grid -- made
     every card a dense little document on a screen that opens nothing.

     ONE PERSON, ONE ROW. Thirty-one discs across the page, the weekday
     letter over each column, the date inside the disc and the state as
     a tint behind it, today ringed and a day the month has not reached
     dimmed. The rows share a fixed name column, so every row's 14th
     sits under every other row's.

     NEVER COLOUR ALONE: the month in words sits under each name, the
     legend keys only the states actually drawn, every disc names its
     date and its state in its title, and each row carries one
     accessible name. */
  const CELL_TONE = {
    present: function (c) { return { bg: c.presentTint, fg: c.presentText }; },
    late: function (c) { return { bg: c.lateTint, fg: c.lateText }; },
    leave: function (c) { return { bg: c.leaveTint, fg: c.leaveText }; },
    off: function (c) { return { bg: c.offTint, fg: c.offText }; },
    holiday: function (c) { return { bg: c.holidayTint, fg: c.holidayText }; },
    absent: function (c) { return { bg: c.absentTint, fg: c.absentText }; },
    missing: function (c) { return { bg: c.missingTint, fg: c.missingText }; },
    outage: function (c) { return { bg: c.missingTint, fg: c.missingText }; },
  };

  const MONTH_DAYS = (function () {
    const out = [];
    for (let d = 1; d <= 31; d++) out.push(d);
    return out;
  })();

  /* the weekday over a given date, in two letters: "S" over Saturday
     and "S" over Sunday is a column head that cannot be read */
  function dowOf(d) {
    if (!DAY) return 0;
    const iso = DAY.isoAug(d);
    return new Date(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, d).getDay();
  }

  const NAME_COL = 180;
  /* THE DATES STOP AT TODAY. Twenty days of plain numbers nobody has
     lived through yet is what made the strip feel cramped: they took
     the room the days that happened needed. The month so far is the
     whole of what a register can say. */
  const DAY_MIN = 30;
  const DAY_MAX = 56;
  const CAL_GAP = 28;
  function calDays() { return DAY ? Number(DAY.TODAY_ISO.slice(-2)) : 31; }
  function calMin() { return NAME_COL + CAL_GAP + calDays() * DAY_MIN; }
  /* the dates take the width the dropped ones used to, up to a point:
     past about 56px a column is not spacious, it is adrift */
  const CAL_COLS = function (n) { return "repeat(" + n + ", minmax(" + DAY_MIN + "px, " + DAY_MAX + "px))"; };

  function DayCells({ cells, today, aria }) {
    const { c } = useTheme();
    const { t } = useLang();
    return (
      <div
        role="img" aria-label={aria}
        style={{ display: "grid", gridTemplateColumns: CAL_COLS(cells.length), flex: "0 1 auto", minWidth: 0 }}
      >
        {cells.map(function (cell) {
          const ahead = cell.st === "ahead" || cell.st === "unknown";
          const tone = !ahead && CELL_TONE[cell.st] ? CELL_TONE[cell.st](c) : null;
          const isToday = cell.d === today;
          /* a day the month has not reached is known but has not
             happened: it is dimmed, the way Home dims the same day */
          const future = cell.d > today;
          return (
            <span
              key={cell.d} aria-hidden="true"
              title={t("tm.cell", { d: cell.d, m: t("tm.monthLabel"), state: t("tm.w." + (ahead ? "ahead" : cell.st)) })}
              style={{
                width: 27, height: 27, borderRadius: G3.r.pill, justifySelf: "center",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: tone ? tone.bg : "transparent",
                color: tone ? tone.fg : (future ? c.inkFaint : c.inkMuted),
                opacity: future && tone ? 0.5 : 1,
                boxShadow: isToday ? "inset 0 0 0 1.5px " + c.accent : "none",
                fontFamily: G3.font.ui, fontSize: 11.5, lineHeight: 1,
                fontWeight: isToday ? 700 : 600,
                fontVariantNumeric: "tabular-nums",
              }}
            >{cell.d}</span>
          );
        })}
      </div>
    );
  }

  /* ONE PERSON, ONE ROW, THE WHOLE MONTH ACROSS IT. The face and the
     name hold the left column at a fixed width so every row's first of
     the month sits under every other row's; the month in words sits
     under the name, because a disc of colour is not a statement. */
  function CalRow({ row, first }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const p = row.p;
    const name = t(p.nameKey);
    const month = monthOf(p.id, null);
    if (!month) return null;
    const today = DAY ? Number(DAY.TODAY_ISO.slice(-2)) : 0;

    const said = [];
    if (month.p) said.push(t("tm.cnt.p", { n: num(month.p) }));
    if (month.l) said.push(t("tm.cnt.l", { n: num(month.l) }));
    if (month.v) said.push(t("tm.cnt.v", { n: num(month.v) }));

    return (
      <div style={{
        display: "flex", alignItems: "center", gap: CAL_GAP,
        padding: "11px 0",
        borderTop: first ? "none" : "1px solid " + c.rule,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, width: NAME_COL, flexShrink: 0, minWidth: 0 }}>
          <Face name={name} size={32} />
          <div style={{ minWidth: 0 }}>
            <div style={ty("small", { color: c.ink, fontWeight: 700 })}>{name}</div>
            {/* the month in words, under the name it belongs to — a row
                of discs is not a statement, and a nought is not
                printed: "0 late" is not news */}
            <div style={ty("caption", { color: c.inkFaint, marginTop: 1 })}>
              {said.length ? said.join(" · ") : t("tm.monthNone")}
            </div>
          </div>
        </div>
        {/* THE NAMES HOLD THE LEFT, THE DATES THE RIGHT (designer).
            The space between them is the column the eye travels, and
            the last date lands on the card's own edge. */}
        <span aria-hidden="true" style={{ flex: 1, minWidth: CAL_GAP }} />
        <DayCells
          cells={month.cells.slice(0, calDays())} today={today}
          aria={t("tm.monthAria", { name: name, p: num(month.p), l: num(month.l), v: num(month.v) })}
        />
      </div>
    );
  }

  /* THE COLUMN HEADS. Every column names its weekday, the way the
     reference calendars do — thirty-one letters is a ruler, not a
     repetition, because no two columns say the same thing twice in a
     row. Today's column carries a dot. */
  function CalHead() {
    const { c } = useTheme();
    const { t } = useLang();
    const today = DAY ? Number(DAY.TODAY_ISO.slice(-2)) : 0;
    return (
      <div style={{ display: "flex", alignItems: "flex-end", gap: CAL_GAP, paddingBottom: 6 }}>
        <span aria-hidden="true" style={{ width: NAME_COL, flexShrink: 0 }} />
        <span aria-hidden="true" style={{ flex: 1, minWidth: CAL_GAP }} />
        <div style={{ display: "grid", gridTemplateColumns: CAL_COLS(calDays()), flex: "0 1 auto", minWidth: 0 }}>
          {MONTH_DAYS.slice(0, calDays()).map(function (d) {
            const isToday = d === today;
            return (
              <span key={d} aria-hidden="true" style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                fontFamily: G3.font.ui, fontSize: 9.5, fontWeight: 700, letterSpacing: "0.03em",
                color: isToday ? c.action : c.inkFaint,
              }}>
                {t("tm.d" + dowOf(d))}
                <span style={{
                  width: 3, height: 3, borderRadius: 99,
                  background: isToday ? c.action : "transparent",
                }} />
              </span>
            );
          })}
        </div>
      </div>
    );
  }

  /* THE KEY, AND ONLY TO WHAT IS DRAWN. A legend that names a state
     nobody is in this month is a riddle with no answer in the room. */
  const LEGEND_ORDER = ["present", "late", "leave", "absent", "missing", "off", "holiday"];
  const LEGEND_DOT = {
    present: function (c) { return c.present; },
    late: function (c) { return c.late; },
    leave: function (c) { return c.leave; },
    absent: function (c) { return c.absent; },
    missing: function (c) { return c.missing; },
    outage: function (c) { return c.missing; },
    off: function (c) { return c.off; },
    holiday: function (c) { return c.holiday; },
  };

  function CalLegend({ states }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const shown = LEGEND_ORDER.filter(function (k) { return states[k]; });
    if (!shown.length) return null;
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: "7px 18px", marginLeft: "auto", justifyContent: "flex-end" }}>
        {shown.map(function (k) {
          return (
            <span key={k} style={ty("caption", { color: c.inkMuted, display: "inline-flex", alignItems: "center", gap: 7 })}>
              {/* the solid of the state, the same dot the figures at the
                  top of the screen use — one colour, one meaning */}
              <span aria-hidden="true" style={{
                width: 10, height: 10, borderRadius: 99, flexShrink: 0, background: LEGEND_DOT[k](c),
              }} />
              {t("tm.l." + k)}
            </span>
          );
        })}
      </div>
    );
  }

  /* THREE DEEP, AND THE REST A CLICK AWAY (designer). Ten people's
     months, open on a screen whose question is "who is in today", is a
     register nobody asked for; three rows is enough to see the shape of
     a month and to know what the rest look like. The expander says how
     many it is holding back, and the whole list is one click, not a
     page. */
  const SHOW_FIRST = 3;

  function TeamCalendar({ rows, meId }) {
    const { c } = useTheme();
    const { t } = useLang();
    const [open, setOpen] = useState(false);
    /* THE TEAM, NOT THE READER (designer). Her own month is her own
       screen — My attendance holds it day by day, with the actions on
       it. Here she is reading the people around her. */
    const team = rows.filter(function (x) { return x.p.id !== meId; });
    const list = open ? team : team.slice(0, SHOW_FIRST);
    const hidden = team.length - SHOW_FIRST;

    /* the key is cut to the states the drawn rows are actually in */
    const states = {};
    const upto = calDays();
    list.forEach(function (x) {
      const m = monthOf(x.p.id, null);
      if (m) m.cells.slice(0, upto).forEach(function (cell) { if (CELL_TONE[cell.st]) states[cell.st] = 1; });
    });
    if (!team.length) return null;

    return (
      <Card icon="attendance" iconTone="present" title={t("tm.cal.title")} sub={t("tm.cal.sub")} pad={20}>
        {/* a month does not fold: under about 1100px the strip scrolls
            inside its card rather than the page scrolling under it */}
        <div style={{ overflowX: "auto", marginTop: 10 }}>
          <div role="group" aria-label={t("tm.cal.aria")} style={{ minWidth: calMin() }}>
            <CalHead />
            {list.map(function (x, i) {
              return <CalRow key={x.p.id} row={x} first={i === 0} />;
            })}
          </div>
        </div>
        <div style={{
          borderTop: "1px solid " + c.rule, paddingTop: 13, marginTop: 14,
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18, flexWrap: "wrap",
        }}>
          {hidden > 0 ? (
            <Button kind="ghost" size="sm" onClick={function () { setOpen(!open); }}>
              {open ? t("tm.wk.less") : t("tm.wk.more", { n: num(team.length) })}
            </Button>
          ) : <span />}
          <CalLegend states={states} />
        </div>
      </Card>
    );
  }

  /* A LABELLED FACT. The reference the designer sent reads
     "Location : Gurugram" — a quiet label, a colon, the fact. It beats
     a bare line because a reader knows what they are looking at before
     they read it, and because two cards' facts then line up. */
  function Fact({ k, v }) {
    const { c } = useTheme();
    const { ty } = useLang();
    if (!v) return null;
    return (
      <div style={ty("caption", { color: c.ink })}>
        <span style={{ color: c.inkFaint }}>{k + " "}</span>{v}
      </div>
    );
  }

  /* the month somebody joined, never the day: a colleague directory is
     not a staff file, and "July 2014" is the whole of what anybody
     needs to know about how long she has been here */
  function joinedLabel(t, iso) {
    if (!iso) return "";
    return t("lv.mon." + Number(iso.slice(5, 7))) + " " + iso.slice(0, 4);
  }

  const ST_ROLE = {
    present: "present", late: "late", leave: "leave", off: "off",
    absent: "absent", missing: "missing", outage: "missing",
  };

  function DayMark({ row }) {
    const { t } = useLang();
    const st = row.st;
    const at = row.day && row.day.inTime ? row.day.inTime : "";
    const word = st === "present" ? t("tm.st.in", { t: at })
      : st === "late" ? t("tm.st.late", { t: at })
        : st === "leave" ? t("tm.st.leave")
          : st === "off" ? t("tm.st.off")
            : st === "missing" || st === "outage" ? t("tm.st.missing")
              : st === "absent" ? t("tm.st.absent")
                : t("tm.st.unknown");
    return <StatusMark role={ST_ROLE[st] || "off"} word={word} />;
  }

  /* A WHOLE ANSWER, NOT A DOOR. The card is not a button and carries no
     chevron: there is nothing behind it, and an affordance that leads
     nowhere is worse than none. */
  function PersonCard({ row, isMe }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const p = row.p;
    const name = t(p.nameKey);
    const remote = !!(row.day && REMOTE[row.day.verify] && IN_STATES[row.st]);
    return (
      <Card pad={18} style={{ display: "flex", flex: 1, minWidth: 0, minHeight: 136 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 15, width: "100%", minWidth: 0 }}>
          <Face name={name} size={64} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", minHeight: 26 }}>
              <span style={ty("h3", { color: c.ink, fontWeight: 700, lineHeight: 1.25 })}>{name}</span>
            </div>
            <div style={ty("caption", { color: c.inkMuted, marginTop: 3 })}>{t(p.desigKey)}</div>
            {/* ONE FACT, BECAUSE THE OTHER TWO WERE THE SAME ON EVERY
                CARD. Department and Campus repeated "Science" and
                "Indiranagar campus" ten times under a title that
                already reads "10 people in Science"; a label a reader
                can predict before reading it is not information. What
                is left is the one thing that differs person to person
                — and still nothing a colleague has no business
                reading: no phone, no email, no date of birth, no staff
                number. A directory is not consent to circulate contact
                details. */}
            <div style={{ marginTop: 11 }}>
              <Fact k={t("tm.k.since")} v={joinedLabel(t, p.joined)} />
            </div>
          </div>
          {/* THE DAY SITS BESIDE THE NAME, not under it: it is the one
              thing a reader came to this card for, and a card is read
              left to right before it is read downwards. */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5, flexShrink: 0 }}>
            <DayMark row={row} />
            {isMe ? <Chip bg={c.sunken} fg={c.inkMuted}>{t("tm.you")}</Chip> : null}
            {/* how a punch was made is a fact about a punch already
                counted, so it sits under it rather than becoming a
                state of its own */}
            {remote ? (
              <span style={ty("caption", { color: c.inkFaint })}>{t("tm.phoneMark")}</span>
            ) : null}
          </div>
        </div>
      </Card>
    );
  }

  /* A LINE THAT NAMES SOMEBODY. Under a figure, "Karan Mehta" is
     worth more than any sentence explaining what "late in" means: the
     figure says how many, the line says who. Two names, then a count
     of the rest — a column is not a list. */
  function whoOf(t, rows, pred) {
    const names = rows.filter(pred).map(function (x) { return t(x.p.nameKey); });
    if (!names.length) return t("tm.n.none");
    if (names.length <= 2) return names.join(", ");
    return t("tm.n.more", { names: names.slice(0, 2).join(", "), n: num(names.length - 2) });
  }

  /* THE DAY, IN THE LEAVE BALANCE'S SHAPE. Four states, four columns
     divided by a hairline: the name over the figure, the figure over
     its own meter, and one line under it that names the people in it.
     "Marked remotely" is not a fifth state -- it counts people the
     other columns have already counted -- so it is the line under
     "On time" rather than a column of its own. */
  function DayPanel({ tally, total, rows }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const unit = t("tm.m.of", { n: num(total) });
    const frac = function (v) { return total ? v / total : 0; };
    return (
      <Card
        pad={20} style={{ marginBottom: G3.layout.gap }}
        action={<span style={ty("caption", { color: c.inkMuted })}>{todayLabel(t)}</span>}
      >
        <FigureBlocks
          style={{ marginTop: 2 }}
          items={[
            { k: "ok", label: t("tm.m.onTime"), value: tally.present, unit: unit,
              frac: frac(tally.present), tone: c.present,
              note: tally.phone ? t("tm.n.remote", { n: num(tally.phone) }) : t("tm.n.atGate") },
            { k: "late", label: t("tm.m.late"), value: tally.late, unit: unit,
              frac: frac(tally.late), tone: c.late, warn: tally.late > 0,
              note: whoOf(t, rows, function (x) { return x.st === "late"; }) },
            { k: "leave", label: t("tm.m.leave"), value: tally.leave, unit: unit,
              frac: frac(tally.leave), tone: c.leave,
              note: whoOf(t, rows, function (x) { return x.st === "leave"; }) },
            { k: "out", label: t("tm.m.out"), value: tally.out, unit: unit,
              frac: frac(tally.out), tone: c.absent, warn: tally.out > 0,
              note: whoOf(t, rows, function (x) { return !!OUT_STATES[x.st]; }) },
          ]}
        />
      </Card>
    );
  }

  const FILTERS = ["all", "in", "late", "leave", "out"];

  function matches(key, row) {
    if (key === "all") return true;
    if (key === "in") return !!IN_STATES[row.st];
    if (key === "late") return row.st === "late";
    if (key === "leave") return row.st === "leave";
    return !!OUT_STATES[row.st];
  }

  function FilterPills({ value, onChange, rows }) {
    const { c } = useTheme();
    const { t } = useLang();
    return (
      <div role="group" aria-label={t("tm.f.aria")} style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: G3.layout.gap }}>
        {FILTERS.map(function (k) {
          const on = k === value;
          const n = rows.filter(function (x) { return matches(k, x); }).length;
          return (
            <button
              key={k} type="button" aria-pressed={on ? "true" : "false"} onClick={function () { onChange(k); }}
              style={{
                border: "1px solid " + (on ? c.accent : c.border), borderRadius: G3.r.pill,
                padding: "6px 14px", background: on ? c.accent : c.surface, color: on ? c.onAccent : c.ink,
                fontFamily: G3.font.ui, fontSize: 12.5, fontWeight: 600,
                display: "inline-flex", alignItems: "center", gap: 7, cursor: "pointer",
              }}
            >
              <span>{t("tm.f." + k)}</span>
              <span style={G3.fig("micro", { fontWeight: 700, color: on ? c.onAccent : c.inkFaint })}>{num(n)}</span>
            </button>
          );
        })}
      </div>
    );
  }

  function todayLabel(t) {
    if (!DAY) return "";
    const iso = DAY.TODAY_ISO;
    const d = new Date(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)));
    return d.getDate() + " " + t("lv.mon." + (d.getMonth() + 1)) + " " + d.getFullYear();
  }

  function MyTeam({ role, onNavigate }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const L = G3.layout;
    const r = role || "employee";
    const team = teamOf(t, ME_ID[r]);
    const [filter, setFilter] = useState("all");
    const dept = team.me && team.me.deptKey ? t(LF.DEPTS[team.me.deptKey]) : "";
    const isHead = r === "deptHead";
    const rows = team.rows;
    const shown = rows.filter(function (x) { return matches(filter, x); });

    const tally = { present: 0, late: 0, leave: 0, out: 0, phone: 0 };
    rows.forEach(function (x) {
      if (x.st === "present") tally.present++;
      else if (x.st === "late") tally.late++;
      else if (x.st === "leave") tally.leave++;
      else if (OUT_STATES[x.st]) tally.out++;
      if (x.day && REMOTE[x.day.verify] && IN_STATES[x.st]) tally.phone++;
    });

    return (
      <div className="nv3" style={{ display: "flex", minHeight: "100vh", background: c.page, color: c.ink, fontFamily: G3.font.ui }}>
        <Rail role={r} active="myTeam" onNavigate={onNavigate} />
        <main style={{ flex: 1, minWidth: 0, position: "relative", overflowX: "clip" }}>
          <Motif />
          <div style={{ position: "relative", zIndex: 1, maxWidth: L.contentMax, margin: "0 auto", padding: "22px " + L.contentPadX + "px 56px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, marginBottom: 16 }}>
              <div style={ty("small", { color: c.inkMuted })}>
                <span style={{ color: c.ink, fontWeight: 700 }}>{t("tm.crumb")}</span>
                <span style={{ margin: "0 8px", color: c.inkFaint }}>·</span>
                <span>{t("home.school")}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <ThemeToggle />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <h1 style={ty("display", { margin: 0, color: c.ink })}>{t("tm.title")}</h1>
              {rows.length ? (
                <p style={ty("body", { margin: "7px 0 0", color: c.inkMuted })}>
                  {isHead
                    ? t("tm.countHead", { n: num(rows.length), dept: dept, m: num(rows.length - 1) })
                    : t("tm.countEmp", { n: num(rows.length), dept: dept })}
                </p>
              ) : null}
            </div>

            {!rows.length ? (
              <Card><EmptyState head={t("tm.none")} body={t("tm.noneBody")} /></Card>
            ) : (
              <React.Fragment>
                {/* THE DAY, BEFORE THE PEOPLE */}
                <DayPanel tally={tally} total={rows.length} rows={rows} />

                <FilterPills value={filter} onChange={setFilter} rows={rows} />

                {/* THE CALENDAR, THEN THE PEOPLE. The month is the
                    reading this screen is for; the roster is who it is
                    about, and it is the longer of the two. */}
                {shown.length ? (
                  <TeamCalendar rows={shown} meId={team.me ? team.me.id : null} />
                ) : null}

                {!shown.length ? (
                  <Card><EmptyState compact head={t("tm.noHit")} body={t("tm.noHitWhy", { all: t("tm.f.all") })} /></Card>
                ) : (
                  <div style={{ marginTop: L.gap }}>
                    <h2 style={ty("h3", { margin: 0, color: c.ink })}>{t("tm.roster")}</h2>
                    {shown.length === rows.length ? null : (
                      <p style={ty("caption", { margin: "3px 0 0", color: c.inkMuted })}>
                        {t("tm.rosterSub", { n: num(shown.length), all: num(rows.length) })}
                      </p>
                    )}
                    <div style={{ height: 14 }} />
                    <div
                      role="list" aria-label={t("tm.aria", { dept: dept })}
                      style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: L.gap }}
                    >
                      {shown.map(function (x) {
                        return (
                          <div role="listitem" key={x.p.id} style={{ display: "flex", minWidth: 0 }}>
                            <PersonCard row={x} isMe={!!(team.me && x.p.id === team.me.id)} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              </React.Fragment>
            )}
          </div>
        </main>
      </div>
    );
  }

  window.Pages3 = window.Pages3 || {};
  window.Pages3.MyTeam = MyTeam;
})();
