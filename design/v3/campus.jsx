/* @jsxRuntime classic */
/* ============================================================
   Naveya — today's attendance, by campus · window.CampusData

   ONE SOURCE FOR THE ROLL. PR-01 and PR-02 read one campus; DR-01 and
   DR-03 read both. Before this file each screen carried its own copy
   and they had already drifted — the campus board said one teacher was
   on leave while the department register named another.

   THE SHAPE. A campus has departments; a department has a head-count
   and, for today, a list of EXCEPTIONS — the people who are absent,
   late, on leave, or whose reader has not reported. The counts are
   DERIVED from that list (see `departmentsOf`), never typed twice, so
   a name and a number cannot disagree.

   UNKNOWN IS NOT ABSENT. A device outage puts records in `awaiting`:
   they are excluded from the absence totals and drawn in their own
   grey everywhere. A wrong-looking absence figure destroys trust in
   the whole board faster than a slow one (PR-02's own non-happy path).

   NAMES ARE KEYS. Every person here is a string key, in both
   languages, because a screen is one language at a time. Where a
   person already exists in leaveflow.jsx's roster (Science's three,
   who are the same three DH-03 draws) that file's key is reused
   rather than a second spelling invented.
   ============================================================ */
(function () {
  const UI = window.UI3;
  const { addStrings } = UI;

  const TODAY_ISO = "2026-08-11";

  /* ---- the two campuses ---------------------------------------- */
  const CAMPUSES = [
    {
      key: "lf.c.main",
      shortKey: "cmp.main.short",
      departments: [
        { key: "science", label: "pr.dept.science", category: "teaching", total: 18, awaiting: 0 },
        { key: "math", label: "pr.dept.math", category: "teaching", total: 16, awaiting: 0 },
        { key: "english", label: "pr.dept.english", category: "teaching", total: 14, awaiting: 0 },
        { key: "socialSci", label: "pr.dept.socialSci", category: "teaching", total: 11, awaiting: 0 },
        { key: "languages", label: "pr.dept.languages", category: "teaching", total: 10, awaiting: 0 },
        { key: "primary", label: "pr.dept.primary", category: "teaching", total: 24, awaiting: 17, outage: true },
        { key: "admin", label: "pr.dept.admin", category: "support", total: 25, awaiting: 0 },
      ],
      exceptions: [
        /* Science — the same three the department head sees on DH-03 */
        { key: "lf.n.sanjay", deptKey: "science", desig: "dh.desig.tgtChem", status: "absent" },
        { key: "lf.n.karan", deptKey: "science", desig: "dh.desig.pgtPhysics", status: "late", inTime: "08:41" },
        { key: "lf.n.divya", deptKey: "science", desig: "dh.desig.tgtBio", status: "leave", until: "2026-08-11" },
        { key: "pr.n.nikhil", deptKey: "math", desig: "pr.g.tgtMaths", status: "late", inTime: "08:52" },
        { key: "pr.n.ritu", deptKey: "english", desig: "pr.g.pgtEnglish", status: "leave", until: "2026-08-12" },
        { key: "pr.n.imran", deptKey: "english", desig: "pr.g.tgtEnglish", status: "absent" },
        { key: "pr.n.devesh", deptKey: "socialSci", desig: "pr.g.tgtSocial", status: "leave", until: "2026-08-11" },
        { key: "pr.n.ayesha", deptKey: "languages", desig: "pr.g.tgtHindi", status: "leave", until: "2026-08-12" },
        { key: "pr.n.farida", deptKey: "languages", desig: "pr.g.tgtSanskrit", status: "absent" },
        { key: "pr.n.lata", deptKey: "primary", desig: "pr.g.prt", status: "leave", until: "2026-08-11" },
        { key: "pr.n.rameshY", deptKey: "admin", desig: "pr.g.office", status: "leave", until: "2026-08-11" },
        { key: "pr.n.gopal", deptKey: "admin", desig: "pr.g.support", status: "absent" },
      ],
      /* absence rate, the NINE school days before today — the share of
         the readable roll absent without explanation. Today's figure is
         never typed here: `absenceRateOf` counts it from the people
         above, so the chart and the day's own numbers cannot disagree. */
      trend: [4.2, 5.1, 3.4, 6.0, 5.3, 6.8, 4.5, 5.0, 5.6],
    },
    {
      /* the second campus: a primary-heavy school, half the size, and
         its readers are healthy today — so the director's two rows do
         not look like one number printed twice */
      key: "lf.c.north",
      shortKey: "cmp.north.short",
      departments: [
        { key: "primary", label: "pr.dept.primary", category: "teaching", total: 28, awaiting: 0 },
        { key: "english", label: "pr.dept.english", category: "teaching", total: 12, awaiting: 0 },
        { key: "math", label: "pr.dept.math", category: "teaching", total: 11, awaiting: 0 },
        { key: "science", label: "pr.dept.science", category: "teaching", total: 9, awaiting: 0 },
        { key: "admin", label: "pr.dept.admin", category: "support", total: 14, awaiting: 0 },
      ],
      exceptions: [
        { key: "lf.n.shanti", deptKey: "primary", desig: "pr.g.prt", status: "leave", until: "2026-08-11" },
        { key: "cmp.n.joseph", deptKey: "primary", desig: "pr.g.prt", status: "absent" },
        { key: "cmp.n.nandita", deptKey: "english", desig: "pr.g.tgtEnglish", status: "late", inTime: "08:47" },
        { key: "cmp.n.rafiq", deptKey: "math", desig: "pr.g.tgtMaths", status: "leave", until: "2026-08-13" },
        { key: "cmp.n.tara", deptKey: "admin", desig: "pr.g.office", status: "absent" },
        { key: "cmp.n.harish", deptKey: "admin", desig: "pr.g.support", status: "leave", until: "2026-08-12" },
      ],
      trend: [3.1, 2.8, 4.0, 3.6, 2.4, 3.9, 4.4, 3.0, 3.3],
    },
  ];

  function campus(key) { return CAMPUSES.filter((x) => x.key === key)[0] || CAMPUSES[0]; }

  /* the exceptions in one department of one campus */
  function exceptionsOf(campusKey, deptKey) {
    return campus(campusKey).exceptions.filter((x) => x.deptKey === deptKey);
  }

  /* a department, with its counts DERIVED from the people above:
     present is what is left of the roll once the named exceptions and
     the unread records are taken off it */
  function departmentsOf(campusKey) {
    const c = campus(campusKey);
    return c.departments.map((d) => {
      const list = c.exceptions.filter((x) => x.deptKey === d.key);
      const n = (s) => list.filter((x) => x.status === s).length;
      const absent = n("absent"), late = n("late"), leave = n("leave");
      return Object.assign({}, d, {
        campusKey: c.key,
        absent: absent, late: late, leave: leave,
        present: d.total - absent - late - leave - d.awaiting,
      });
    });
  }

  /* ---- scopes: one campus, or both ------------------------------

     A scope is a campus key or "both". Merging two campuses is NOT
     summing two totals — the department lists merge BY DEPARTMENT,
     because Science exists on both and the trust has one Science, not
     two. The exceptions concatenate, so a merged department's counts
     still derive from the people in it. */
  const SCOPE_ALL = "both";
  function isAll(scope) { return !scope || scope === SCOPE_ALL; }

  function departmentsOfScope(scope) {
    if (!isAll(scope)) return departmentsOf(scope);
    const byKey = {};
    const order = [];
    CAMPUSES.forEach((cm) => {
      departmentsOf(cm.key).forEach((d) => {
        if (!byKey[d.key]) {
          byKey[d.key] = Object.assign({}, d, { campusKey: SCOPE_ALL });
          order.push(d.key);
          return;
        }
        const a = byKey[d.key];
        ["total", "present", "late", "absent", "leave", "awaiting"].forEach((f) => { a[f] += d[f]; });
        a.outage = a.outage || d.outage;
      });
    });
    return order.map((k) => byKey[k]);
  }

  function exceptionsOfScope(scope, deptKey) {
    if (!isAll(scope)) return exceptionsOf(scope, deptKey);
    return CAMPUSES.reduce((acc, cm) => acc.concat(
      exceptionsOf(cm.key, deptKey).map((x) => Object.assign({ campusKey: cm.key }, x))
    ), []);
  }

  function totalsOfScope(scope) {
    return isAll(scope) ? trustTotals() : totalsOf(scope);
  }

  function totalsOf(campusKey) {
    return departmentsOf(campusKey).reduce((a, d) => ({
      total: a.total + d.total, present: a.present + d.present, late: a.late + d.late,
      absent: a.absent + d.absent, leave: a.leave + d.leave, awaiting: a.awaiting + d.awaiting,
    }), { total: 0, present: 0, late: 0, absent: 0, leave: 0, awaiting: 0 });
  }

  /* the whole trust, for the director */
  function trustTotals() {
    return CAMPUSES.map((x) => totalsOf(x.key)).reduce((a, x) => ({
      total: a.total + x.total, present: a.present + x.present, late: a.late + x.late,
      absent: a.absent + x.absent, leave: a.leave + x.leave, awaiting: a.awaiting + x.awaiting,
    }), { total: 0, present: 0, late: 0, absent: 0, leave: 0, awaiting: 0 });
  }

  /* absence rate = unexplained absences over the roll that actually
     reported. Approved leave is not absence (it was planned) and an
     unread record is not absence (it is unknown) — counting either
     would make a device outage look like a staffing crisis. */
  function absenceRateOf(campusKey) {
    const T = totalsOf(campusKey);
    const readable = T.total - T.awaiting;
    return readable > 0 ? (T.absent / readable) * 100 : 0;
  }

  /* the ten-day series a chart draws: nine days of history and today,
     computed */
  function absenceSeriesOf(campusKey) {
    return campus(campusKey).trend.concat([Math.round(absenceRateOf(campusKey) * 10) / 10]);
  }

  function teachingOf(campusKey) {
    return departmentsOf(campusKey).filter((d) => d.category === "teaching").reduce((s, d) => s + d.total, 0);
  }

  /* ---- words ---------------------------------------------------- */
  addStrings({
    en: {
      "cmp.main.short": "Indiranagar",
      "cmp.north.short": "Whitefield",
      "cmp.n.joseph": "Joseph Mathew", "cmp.n.nandita": "Nandita Bose", "cmp.n.rafiq": "Rafiq Ahmed",
      "cmp.n.tara": "Tara Suresh", "cmp.n.harish": "Harish Gowda",
    },
  });

  window.CampusData = {
    TODAY_ISO, CAMPUSES, campus, departmentsOf, exceptionsOf, totalsOf, trustTotals, teachingOf,
    absenceRateOf, absenceSeriesOf,
    SCOPE_ALL, departmentsOfScope, exceptionsOfScope, totalsOfScope,
  };
})();
