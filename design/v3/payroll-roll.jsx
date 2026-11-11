/* @jsxRuntime classic */
/* ============================================================
   Naveya — the payroll roll, person by person · window.NaveyaRoll

   WHY THIS FILE EXISTS. The payroll run knew what a CAMPUS owed and
   what a PAY GROUP cost, and it did not know what any one person was
   paid. So the officer's first question -- "show me everybody and what
   they take home" -- had no screen, and the register answered with
   five sample payslips per group.

   THE RULING (designer, 2026-10-15): "the payroll run should first
   display full employee data with their net payable of all pay groups
   ... if it is 200 staff then show their individual info."

   SO: THE ROLL IS THE SOURCE, AND THE TOTALS ARE ITS SUM. This module
   builds every person on every campus's roll and prices them. Nothing
   downstream re-states a total: the run's gross IS the sum of its
   rows, because `spread()` distributes a published figure across the
   people on the roll WITHOUT LOSS -- the remainder is handed out a
   rupee at a time rather than dropped on the last person.

   ------------------------------------------------------------
   AMENDED 2026-10-15 (the same day, after the first review).

   THE SECOND RULING: "multiple things like loans, advances and
   reimbursements also happen in the payroll run -- design the
   functionality and add them to the payroll run and how it will
   manage. Past months' payroll run history should also be visible
   inside the payroll run itself."

   TWO THINGS FOLLOW, AND BOTH ARE ABOUT NOT INVENTING MONEY.

   1 · LOANS AND CLAIMS ARE NOT GENERATED ANY MORE. They are read from
   py-ops.jsx's own registers -- PYAdjData.LOANS (fourteen running
   loans and advances) and PYAdjData.CLAIMS (thirty-one approved,
   unpaid reimbursements). The fourteen instalments already sum to
   2,10,500, which IS the run's published LOAN deduction line, so the
   register and the run were always the same money told twice. Now
   they are told once: the borrowers are seeded onto the roll with the
   net each of them is published as taking home, and every other
   person on their pay group shares what is left.

   A consequence worth stating: the roll no longer has an opinion
   about who holds a loan. PY-13 and the run name the same fourteen
   people, because there is only one list.

   2 · A CLOSED MONTH HAS A ROLL OF ITS OWN. April is not August with
   a different heading: it carries its own head count (401 against
   412) and its own published net, so the month's roll is August's
   people MINUS the ones who had not joined, re-priced so the rows sum
   to what April actually paid. Nobody is invented and no figure is
   re-typed; the month's own published total is the anchor.

   ------------------------------------------------------------
   WHERE THE FIGURES COME FROM. py-ops.jsx's GROUPS holds each pay
   group's earnings, deductions and employer cost for August, and its
   head count. py-run.jsx's campus split (164 / 104 teaching, and so
   on) decides each campus's share, line by line, with Indiranagar
   taking the remainder. Both are read, neither is re-typed.

   THE NAMED PEOPLE COME FIRST. Eleven members of staff already have
   exact figures elsewhere in the product -- Ananya Rao earns 94,800.00
   gross and 78,432.00 net on PY-05 and in the register. They are
   seeded onto the roll with those figures, and the generated staff
   share WHAT IS LEFT. A roll that re-priced Ananya would be the one
   bug a payroll product may never have.

   NAMES ARE DATA, NOT COPY. Every label in this product is an i18n
   key, and a person's name is not a label -- it is a row from the
   staff table. The generated roll carries plain strings for the same
   reason `person.jsx` carries a staff number: translating "Ananya Rao"
   is not a thing anybody wants. Designations ARE copy and stay keyed.
   A borrower's name comes off py-ops's own key so the two screens
   cannot drift apart; it is resolved once, when the roll is built.

   STAFF NUMBERS DECIDE CAMPUS. kit.jsx's `campusOfCode` reads the
   campus off the number (n % 5 < 3 is Indiranagar), and the whole
   product filters by it. Generated numbers obey that rule, so a
   generated person lands on the same campus everywhere.
   ============================================================ */
(function () {
  const r2 = function (n) { return Math.round(n * 100) / 100; };

  /* ------------------------------------------------------------
     1 · DETERMINISM. The same roll every reload, in every browser,
     for every reader -- a design canvas whose figures move when you
     refresh it cannot be reviewed.
     ------------------------------------------------------------ */
  function seedOf(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(key) {
    let a = seedOf(String(key));
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ------------------------------------------------------------
     2 · NAMES. Enough of a bank that 412 people are 412 people and
     not the same twelve with different numbers.
     ------------------------------------------------------------ */
  const FIRST = [
    "Aarti", "Abhishek", "Aditi", "Ajay", "Akash", "Alka", "Amit", "Anand", "Anita", "Anjali",
    "Ankur", "Anupama", "Arun", "Asha", "Ashwin", "Bhavana", "Chetan", "Deepa", "Deepak", "Devika",
    "Dinesh", "Divya", "Farhan", "Gayatri", "Girish", "Gopal", "Harish", "Hema", "Imran", "Indira",
    "Jaya", "Jyoti", "Kailash", "Kalpana", "Kamala", "Karthik", "Kavya", "Kiran", "Lakshmi", "Latha",
    "Madhavi", "Mahesh", "Manish", "Meena", "Mohan", "Mukesh", "Nagaraj", "Nalini", "Nandita", "Naveen",
    "Neelam", "Nikhil", "Nirmala", "Pallavi", "Pankaj", "Parvati", "Pooja", "Pradeep", "Prashant", "Preeti",
    "Rajesh", "Rakesh", "Ramya", "Ranjini", "Rashmi", "Ravindra", "Rekha", "Rohini", "Sandeep", "Sangeeta",
    "Sanjana", "Saraswati", "Shailaja", "Shankar", "Sheetal", "Shobha", "Shreya", "Sridhar", "Sudha", "Sunil",
    "Swapna", "Tarun", "Uma", "Usha", "Varsha", "Vasanth", "Venkatesh", "Vidya", "Vijay", "Vinod",
    "Yamini", "Yashwant", "Zoya", "Nithya", "Srinivas", "Bhaskar", "Chandrika", "Mallika",
  ];
  const LAST = [
    "Acharya", "Agarwal", "Bhat", "Bhatia", "Chandra", "Chauhan", "Desai", "Deshmukh", "Dixit", "Gowda",
    "Gupta", "Hegde", "Iyengar", "Iyer", "Jain", "Joshi", "Kamath", "Kaul", "Khan", "Kulkarni",
    "Kumar", "Malhotra", "Mehta", "Menon", "Mishra", "Nadkarni", "Nair", "Nayak", "Pandit", "Patel",
    "Pillai", "Prabhu", "Raman", "Rao", "Reddy", "Saxena", "Shah", "Sharma", "Shenoy", "Shetty",
    "Singh", "Sinha", "Srinivasan", "Subramanian", "Thakur", "Varma", "Verma", "Venkataraman",
  ];

  /* designations ARE copy, so they stay keyed */
  const DESIG = {
    teach: ["roll.g.pgt", "roll.g.tgt", "roll.g.prt", "roll.g.hod", "roll.g.coord", "roll.g.librarian", "roll.g.sports"],
    admin: ["roll.g.accounts", "roll.g.clerk", "roll.g.front", "roll.g.facilities", "roll.g.lab", "roll.g.transport", "roll.g.nurse"],
    visit: ["roll.g.guest", "roll.g.visiting", "roll.g.music", "roll.g.counsel"],
  };

  /* ------------------------------------------------------------
     3 · THE CAMPUSES A RUN CAN BE MADE FOR. The trust's roster,
     which groupadmin.jsx owns. Yelahanka joined this year and no pay
     group covers it, so it has a roll and no money. Owned HERE so the
     run, the rules and the roll cannot hold three opinions of it.
     ------------------------------------------------------------ */
  const CAMPUSES = [
    { id: "indiranagar", code: "IND", groups: { teach: 164, admin: 74, visit: 15 } },
    { id: "whitefield", code: "WHF", groups: { teach: 104, admin: 47, visit: 8 } },
    { id: "yelahanka", code: "YEL", groups: null, roll: 46 },
  ];
  const CAMPUS_OF = {};
  CAMPUSES.forEach(function (x) { CAMPUS_OF[x.id] = x; });

  const MONTH_DAYS = 31;

  /* ------------------------------------------------------------
     3b · THE YEAR. A school's payroll year runs April to March, so
     that is the strip the run opens on -- not six months because six
     months is what the seed data happens to hold. A month is PAID
     (it has a published run), LIVE (the one on the desk) or AHEAD
     (nothing has happened yet, and a figure of 0.00 would be a lie
     about it).
     ------------------------------------------------------------ */
  const LIVE_MONTH = 8;
  const MONTHS = [
    { m: 4, y: 2026, days: 30 }, { m: 5, y: 2026, days: 31 }, { m: 6, y: 2026, days: 30 },
    { m: 7, y: 2026, days: 31 }, { m: 8, y: 2026, days: 31 }, { m: 9, y: 2026, days: 30 },
    { m: 10, y: 2026, days: 31 }, { m: 11, y: 2026, days: 30 }, { m: 12, y: 2026, days: 31 },
    { m: 13, y: 2027, days: 31 }, { m: 14, y: 2027, days: 28 }, { m: 15, y: 2027, days: 31 },
  ];
  function monthState(m) { return m < LIVE_MONTH ? "paid" : m === LIVE_MONTH ? "live" : "ahead"; }
  function monthOf(m) {
    for (let i = 0; i < MONTHS.length; i++) if (MONTHS[i].m === m) return MONTHS[i];
    return null;
  }

  /* ------------------------------------------------------------
     4 · THE PEOPLE WHO ALREADY HAVE FIGURES. Seeded first, priced
     exactly as the rest of the product prices them. `monthly` is the
     full-month salary; `gross` is what this August actually earned.
     ------------------------------------------------------------ */
  const KNOWN = [
    { id: "NAV-0142", name: "Ananya Rao", group: "teach", desig: "roll.g.pgt",
      monthly: 94800, gross: 94800, ded: 16368, days: 31 },
    { id: "NAV-0209", name: "Mahesh Pillai", group: "teach", desig: "roll.g.tgt",
      monthly: 68400, gross: 68400, ded: 11720, days: 29, lop: 2 },
    { id: "NAV-0301", name: "Joseph Mathew", group: "teach", desig: "roll.g.pgt",
      monthly: 76200, gross: 64800, ded: 2930, days: 31, arrear: 4800 },
    { id: "NAV-0122", name: "Prakash Nair", group: "teach", desig: "roll.g.tgt",
      monthly: 71000, gross: 71000, ded: 14260, days: 31 },
    { id: "NAV-0416", name: "Ravi Deshmukh", group: "teach", desig: "roll.g.tgt",
      monthly: 88000, gross: 45000, ded: 6060, days: 15, joined: true },
    { id: "NAV-0007", name: "Kavita Sharma", group: "admin", desig: "roll.g.accounts",
      monthly: 56400, gross: 56400, ded: 9240, days: 31 },
    { id: "NAV-0388", name: "Farida Khan", group: "admin", desig: "roll.g.front",
      monthly: 42600, gross: 42600, ded: 5980, days: 31 },
    { id: "NAV-0355", name: "Nusrat Ali", group: "admin", desig: "roll.g.clerk",
      monthly: 39600, gross: 39600, ded: 5420, days: 31 },
    { id: "NAV-0177", name: "Latha Gowda", group: "admin", desig: "roll.g.facilities",
      monthly: 74400, gross: 50400, ded: 11720, days: 21, leaving: true },
    { id: "NAV-0263", name: "Suresh Iyer", group: "visit", desig: "roll.g.visiting",
      monthly: 0, gross: 28800, ded: 2880, days: 0, units: 36 },
    { id: "NAV-0270", name: "Imran Shaikh", group: "visit", desig: "roll.g.guest",
      monthly: 0, gross: 21600, ded: 2160, days: 0, units: 27 },
    /* held back this month: on the roll, earning, and not paid. Their
       nets are the ones py-ops publishes as HELD_TOTAL, so the campus
       still owes what PY-01 and AC-02 say it owes. The names are
       py-ops's, because PY-01 names the same two people. */
    { id: "NAV-0356", name: "Aparna Bose", group: "teach", desig: "roll.g.tgt",
      monthly: 73790, gross: 73790, ded: 12550, days: 31, heldKey: "roll.held.notice" },
    { id: "NAV-0211", name: "Vikram Sethi", group: "admin", desig: "roll.g.accounts",
      monthly: 57660, gross: 57660, ded: 9800, days: 31, heldKey: "roll.held.bank" },
  ];

  /* ------------------------------------------------------------
     4b · THE BORROWERS. py-ops owns the loan register; the roll owns
     which pay group each borrower sits on, because the register does
     not say and the LOAN line does: teaching owes 1,48,000 of
     instalments this month and administration 62,500, and the split
     below is the only one that hits both exactly.

     A borrower's take-home is PUBLISHED in the register (`net`), so
     their gross is worked back from it rather than chosen: pay minus
     the statutory share of their group minus the instalment is what
     they take home, so gross = (net + instalment) / (1 - that share).
     ------------------------------------------------------------ */
  const LOAN_GROUP = {
    "NAV-0122": "teach", "NAV-0182": "teach", "NAV-0258": "teach", "NAV-0308": "teach",
    "NAV-0291": "teach", "NAV-0195": "teach", "NAV-0239": "teach", "NAV-0252": "teach",
    "NAV-0281": "teach", "NAV-0349": "teach",
    "NAV-0217": "admin", "NAV-0374": "admin", "NAV-0361": "admin", "NAV-0322": "admin",
  };
  /* each group's statutory deductions as a share of its own published
     earnings -- read off py-ops's lines at build time, never typed */
  function statShareOf(D, gkey) {
    for (let i = 0; i < D.GROUPS.length; i++) {
      const g = D.GROUPS[i];
      if (g.key !== gkey) continue;
      let gross = 0, ded = 0;
      g.earn.forEach(function (l) { gross += l.v; });
      g.ded.forEach(function (l) { if (l.code !== "LOAN") ded += l.v; });
      return gross ? ded / gross : 0.15;
    }
    return 0.15;
  }

  /* ------------------------------------------------------------
     5 · SPREADING A TOTAL WITHOUT LOSING A RUPEE.
     ------------------------------------------------------------ */
  function spread(total, weights) {
    const T = Math.round(total);
    const n = weights.length;
    if (!n) return [];
    let sw = 0;
    for (let i = 0; i < n; i++) sw += weights[i];
    if (sw <= 0) sw = n;
    const out = [];
    let acc = 0;
    for (let i = 0; i < n; i++) {
      const v = Math.floor((T * (weights[i] || 0)) / sw);
      out.push(v); acc += v;
    }
    let rem = T - acc;
    /* a rupee at a time, from the top of the list, so nobody carries
       a visible rounding scar -- and never onto a zero weight, which
       is somebody who is deliberately not being paid */
    let guard = 0;
    for (let i = 0; rem > 0 && guard < T + n * 4; i = (i + 1) % n, guard++) {
      if (weights[i] > 0) { out[i] += 1; rem -= 1; }
    }
    for (let i = 0; rem < 0 && guard < T + n * 8; i = (i + 1) % n, guard++) {
      if (out[i] > 0) { out[i] -= 1; rem += 1; }
    }
    return out;
  }

  /* ------------------------------------------------------------
     6 · WHAT MAY BE WRONG WITH A ROW, AND WHOSE JOB IT IS.

     This is the spine of the redesigned run. HR owns everything that
     happened to a PERSON -- days, leave, bank details, the salary
     itself. Payroll owns everything standing against the MONEY --
     an instalment, a claim, an arrear. The officer asks for the
     first and fixes the second, and never has to work out which.

     The payroll-owned three are now DERIVED, not dealt: a claim is
     overdue because it was approved before this run opened, an
     instalment is too big because the register's own figures say so,
     a loan is ending because one instalment is left. Nothing here is
     a problem somebody chose to give the officer.
     ------------------------------------------------------------ */
  const ISSUES = {
    noDays: { owner: "hr", blocks: true },
    lopUnexplained: { owner: "hr", blocks: true },
    leaveOpen: { owner: "hr", blocks: true },
    noBank: { owner: "hr", blocks: true },
    noSalary: { owner: "hr", blocks: true },
    claimWaiting: { owner: "payroll", blocks: true },
    loanOverNet: { owner: "payroll", blocks: true },
    loanEnding: { owner: "payroll", blocks: false },
  };

  /* ------------------------------------------------------------
     7 · BUILD
     ------------------------------------------------------------ */
  let CACHE = null;
  const PAST = {};

  function groupsData() {
    const D = (window.Pages3 && window.Pages3.PYRunData) || null;
    return D && D.GROUPS ? D : null;
  }
  function adjData() {
    return (window.Pages3 && window.Pages3.PYAdjData) || null;
  }
  function reqStore() { return window.NaveyaPayRequests || null; }
  function nameOf(key, fallback) {
    const UI = window.UI3;
    const s = UI && UI.translate ? UI.translate("en", key) : null;
    return s && s !== key ? s : (fallback || key);
  }

  function campusShare(D, g, cid) {
    /* identical to py-run's own split, so a campus's share of a line
       is one figure and not two */
    const cm = CAMPUS_OF[cid];
    const n = (cm && cm.groups && cm.groups[g.key]) || 0;
    const share = function (v) {
      return cid === "indiranagar"
        ? v - Math.round((v * (g.heads - n)) / g.heads)
        : Math.round((v * n) / g.heads);
    };
    return {
      heads: n,
      gross: share(D.groupGross(g)),
      ded: share(D.groupDed(g)),
      emp: share(D.groupEmp(g)),
      arrear: share(lineOf(g.earn, "ARREAR")),
    };
  }
  function lineOf(lines, code) {
    for (let i = 0; i < (lines || []).length; i++) if (lines[i].code === code) return lines[i].v;
    return 0;
  }

  /* a staff number on the campus we want: kit.jsx reads the campus off
     the number, so the number is not decoration */
  function numberFor(cid, n) {
    const want = cid === "indiranagar" ? [0, 1, 2] : [3, 4];
    let k = n;
    while (want.indexOf(k % 5) === -1) k += 1;
    return k;
  }

  /* ---- the borrowers, as roll rows ---- */
  function borrowers(D, A) {
    if (!A || !A.LOANS) return [];
    const out = [];
    A.LOANS.forEach(function (l) {
      if (l.state !== "active") return;
      const gkey = LOAN_GROUP[l.staff];
      if (!gkey) return;
      if (l.staff === "NAV-0122") return;          /* already on KNOWN */
      const emi = A.loanEmi(l);
      const stat = statShareOf(D, gkey);
      const gross = Math.round((l.net + emi) / (1 - stat));
      out.push({
        id: l.staff, name: nameOf(l.personKey), group: gkey,
        desig: null, monthly: gross, gross: gross, ded: gross - l.net, days: 31,
      });
    });
    return out;
  }

  function build() {
    const D = groupsData();
    if (!D) return { byCampus: {}, all: [] };
    const A = adjData();
    const byCampus = {};
    const all = [];
    const usedIds = {};
    const seedRows = KNOWN.concat(borrowers(D, A));
    seedRows.forEach(function (p) { usedIds[p.id] = true; });

    CAMPUSES.forEach(function (cm) {
      const rows = [];
      if (!cm.groups) { byCampus[cm.id] = rows; return; }

      D.GROUPS.forEach(function (g) {
        const sh = campusShare(D, g, cm.id);
        if (!sh.heads) return;

        /* the named staff of this group who sit on this campus */
        const seeded = seedRows.filter(function (p) {
          return p.group === g.key && campusOf(p.id) === cm.id;
        });
        let seedGross = 0, seedDed = 0;
        seeded.forEach(function (p) { seedGross += p.gross; seedDed += p.ded; });

        const rest = sh.heads - seeded.length;
        const rand = rng(cm.id + "/" + g.key);

        /* who is short a few days, and why. Three or four people per
           group per campus, which is what a real August looks like. */
        const shortCount = Math.max(1, Math.round(rest * 0.025));
        const shortAt = {};
        for (let i = 0; i < shortCount; i++) shortAt[Math.floor(rand() * rest)] = 2 + Math.floor(rand() * 6);

        /* the one person HR created and has not priced. Chosen before
           the money is spread, so their share goes to the rest rather
           than appearing beside "no salary set" */
        const unpriced = g.key === "teach" && rest > 4 ? rest - 1 : -1;

        const weights = [];
        const days = [];
        for (let i = 0; i < rest; i++) {
          if (i === unpriced) { days.push({ d: 0, lop: 0, unpriced: true }); weights.push(0); continue; }
          const lop = shortAt[i] || 0;
          const d = g.key === "visit" ? 0 : MONTH_DAYS - lop;
          days.push({ d: d, lop: lop });
          /* a plausible spread of salaries inside one group, then cut
             by the days actually worked */
          let w = 0.60 + rand() * 0.95;
          if (rand() < 0.10) w += rand() * 0.85;     /* the senior tail */
          if (lop) w = w * (MONTH_DAYS - lop) / MONTH_DAYS;
          weights.push(w);
        }

        const gross = spread(sh.gross - seedGross, weights);
        const ded = spread(sh.ded - seedDed, gross);
        const emp = spread(sh.emp, gross.concat(seeded.map(function (p) { return p.gross; })));

        /* back pay: the group's own published ARREAR line, handed to a
           handful of people rather than invented */
        const arrearTotal = sh.arrear - seeded.reduce(function (s, p) { return s + (p.arrear || 0); }, 0);
        const arrearAt = arrearTotal > 0 ? pick(rand, rest, Math.min(rest, Math.max(1, Math.round(arrearTotal / 9000)))) : [];
        const arrearAmts = spread(arrearTotal, arrearAt.map(function () { return 1 + rand(); }));

        /* the named staff first -- they are the ones a reader can
           check against another screen */
        seeded.forEach(function (p, i) {
          rows.push(finish({
            id: p.id, name: p.name, group: g.key, groupNameKey: g.nameKey,
            desigKey: p.desig || DESIG[g.key][Math.floor(rand() * DESIG[g.key].length)],
            campus: cm.id,
            days: p.days, lop: p.lop || 0, units: p.units || 0,
            heldKey: p.heldKey || null,
            monthly: p.monthly, gross: p.gross, ded: p.ded,
            emp: Math.round(emp[rest + i] || 0),
            arrear: p.arrear || 0,
            seeded: true, joined: p.joined, leaving: p.leaving,
          }));
        });

        let nextNum = 500 + seedOf(cm.id + g.key) % 400;
        for (let i = 0; i < rest; i++) {
          nextNum = numberFor(cm.id, nextNum + 1);
          let id = "NAV-" + String(nextNum).padStart(4, "0");
          while (usedIds[id]) { nextNum = numberFor(cm.id, nextNum + 1); id = "NAV-" + String(nextNum).padStart(4, "0"); }
          usedIds[id] = true;
          const ai = arrearAt.indexOf(i);
          const dd = days[i];
          if (dd.unpriced) {
            rows.push(finish({
              id: id,
              name: FIRST[Math.floor(rand() * FIRST.length)] + " " + LAST[Math.floor(rand() * LAST.length)],
              group: g.key, groupNameKey: g.nameKey,
              desigKey: DESIG[g.key][Math.floor(rand() * DESIG[g.key].length)],
              campus: cm.id, days: 0, lop: 0, units: 0,
              monthly: 0, gross: 0, ded: 0, emp: 0, arrear: 0,
              unpriced: true,
            }));
            continue;
          }
          rows.push(finish({
            id: id,
            name: FIRST[Math.floor(rand() * FIRST.length)] + " " + LAST[Math.floor(rand() * LAST.length)],
            group: g.key, groupNameKey: g.nameKey,
            desigKey: DESIG[g.key][Math.floor(rand() * DESIG[g.key].length)],
            campus: cm.id,
            days: dd.d, lop: dd.lop,
            units: g.key === "visit" ? 18 + Math.floor(rand() * 22) : 0,
            monthly: dd.lop ? Math.round((gross[i] * MONTH_DAYS) / Math.max(1, dd.d)) : gross[i],
            gross: gross[i], ded: ded[i], emp: Math.round(emp[i] || 0),
            arrear: ai === -1 ? 0 : arrearAmts[ai],
          }));
        }
      });

      attachMoney(rows, A);
      byCampus[cm.id] = deriveIssues(rows, cm.id);
      rows.forEach(function (r) { all.push(r); });
    });

    return { byCampus: byCampus, all: all };
  }

  function pick(rand, n, k) {
    const out = [];
    const seen = {};
    let guard = 0;
    while (out.length < k && guard++ < k * 40) {
      const i = Math.floor(rand() * n);
      if (!seen[i]) { seen[i] = true; out.push(i); }
    }
    return out.sort(function (a, b) { return a - b; });
  }

  /* what the row means, worked out once rather than in every cell */
  function finish(r) {
    r.net = r.gross - r.ded;
    r.monthly = r.monthly || r.gross;
    r.issue = null;
    r.loan = null;
    r.claims = [];
    r.claimTotal = 0;
    r.claimDue = 0;
    r.overtime = [];
    r.otTotal = 0;
    r.rises = [];
    return r;
  }

  /* ------------------------------------------------------------
     7b · THE MONEY THAT IS NOT SALARY.

     A loan and a reimbursement are not lines on a payslip -- they are
     agreements with a life of their own, and the run is one month of
     that life. Both come off the registers py-ops already publishes,
     so the run shows the same fourteen loans and the same thirty-one
     claims that PY-13 and PY-14 manage.

     A claim is OVERDUE when it was approved before this run's month
     opened: it has already missed one payday, and missing a second
     is the school keeping somebody's money. That is the rule that
     decides which claims stop a run, and it is read off the approval
     date rather than chosen.
     ------------------------------------------------------------ */
  function attachMoney(rows, A) {
    if (!A) return;
    const byId = {};
    rows.forEach(function (r) { byId[r.id] = r; });

    (A.LOANS || []).forEach(function (l) {
      if (l.state !== "active") return;
      const r = byId[l.staff];
      if (!r) return;
      const emi = A.loanEmi(l);
      const left = l.tenure - l.paid;
      r.loan = {
        id: l.id, kind: l.kind, purposeKey: l.purposeKey,
        principal: l.principal, repayable: A.loanRepayable(l), rate: l.rate,
        since: l.since, tenure: l.tenure, paid: l.paid, left: left,
        emi: emi, repaidSoFar: r2(emi * l.paid), balance: A.loanOutstanding(l),
        skipped: l.skipped || 0,
      };
    });

    /* OVERTIME. The hours are HR's and the rate is the statutory
       multiple payroll priced them at; neither is recomputed here.
       A row with no price yet is still shown -- it is work somebody
       did, and leaving it out is how it gets forgotten. */
    const Q = reqStore();
    (Q ? Q.byKind("ot") : []).forEach(function (o) {
      const r = byId[o.staff];
      if (!r) return;
      const hours = Q.otHours(o);
      const hourly = Q.otHourly(o);
      const value = o.payroll && o.payroll.value != null
        ? o.payroll.value
        : (hourly == null ? null : r2(hourly * Q.OT_MULTIPLE * hours));
      r.overtime.push({
        id: o.id, hours: hours, hourly: hourly, multiple: Q.OT_MULTIPLE,
        value: value, periodKey: o.periodKey, state: o.state,
        priced: !!(o.payroll && o.payroll.value != null),
        batch: (o.payroll && o.payroll.batch) || null,
        /* the officer may place a line that is verified, priced, and
           not already on a run. Anything else is somebody else's */
        ready: o.state === "withPayroll",
      });
      if (value != null && o.state !== "declined") r.otTotal = r2(r.otTotal + value);
    });

    /* RISES. Information, not money: the salary on every row already
       carries whatever is in force. */
    (Q ? Q.byKind("rise") : []).forEach(function (p) {
      const r = byId[p.staff];
      if (!r) return;
      r.rises.push({
        id: p.id, pct: p.pct, from: p.currentGross,
        to: (p.payroll && p.payroll.gross != null) ? p.payroll.gross : p.targetGross,
        settled: !!(p.payroll && p.payroll.gross != null),
        effectiveFrom: p.payroll ? p.payroll.effectiveFrom : null,
        state: p.state,
      });
    });

    (A.CLAIMS || []).forEach(function (cl) {
      const r = byId[cl.staff];
      if (!r) return;
      const mon = parseInt(String(cl.approvedIso).slice(5, 7), 10);
      const cat = (A.CLAIM_CATS && A.CLAIM_CATS[cl.cat]) || null;
      r.claims.push({
        id: cl.id, cat: cl.cat, catKey: cat ? cat.labelKey : null,
        taxKey: cat ? cat.taxKey : null, taxable: cat ? !!cat.taxable : false,
        v: cl.v, approvedIso: cl.approvedIso, approvedMonth: mon,
        overdue: mon < LIVE_MONTH,
      });
      r.claimTotal = r2(r.claimTotal + cl.v);
      if (mon < LIVE_MONTH) r.claimDue = r2(r.claimDue + cl.v);
    });
  }

  /* ------------------------------------------------------------
     THE MONTH'S WORKLOAD.

     Seven of it is HR's and dealt out on purpose -- a handful of
     exceptions against four hundred people, which is the honest shape
     of a payroll month. The rest is payroll's own, and is read off
     the registers: nobody chose to give the officer an overdue claim.
     ------------------------------------------------------------ */
  const MIX = [
    { kind: "noSalary", n: 1 },
    { kind: "lopUnexplained", n: 3, needs: "lop" },
    { kind: "leaveOpen", n: 2 },
    { kind: "noBank", n: 1 },
  ];

  function deriveIssues(rows, cid) {
    /* 1 · payroll's own, off the registers */
    rows.forEach(function (r) {
      if (r.heldKey || r.unpriced) return;
      if (r.claimDue > 0) { r.issue = mark("claimWaiting"); return; }
      if (r.loan && r.loan.emi > r.net / 2) { r.issue = mark("loanOverNet"); return; }
      if (r.loan && r.loan.left === 1) { r.issue = mark("loanEnding"); return; }
    });

    /* 2 · HR's, dealt around them */
    const rand = rng("issues/" + cid);
    MIX.forEach(function (m) {
      const pool = [];
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        if (r.issue) continue;
        if (m.needs === "lop" && !r.lop) continue;
        if (m.kind === "noSalary" && !r.unpriced) continue;
        if (m.kind !== "noSalary" && r.unpriced) continue;
        if (r.heldKey) continue;
        pool.push(i);
      }
      for (let k = 0; k < m.n && pool.length; k++) {
        const at = pool.splice(Math.floor(rand() * pool.length), 1)[0];
        rows[at].issue = mark(m.kind);
      }
    });
    return rows;
  }
  function mark(kind) {
    const meta = ISSUES[kind];
    return { kind: kind, owner: meta.owner, blocks: meta.blocks };
  }

  function campusOf(code) {
    const n = parseInt(String(code).replace(/\D/g, ""), 10);
    if (!n && n !== 0) return "indiranagar";
    return (n % 5) < 3 ? "indiranagar" : "whitefield";
  }

  function ensure() {
    if (!CACHE) CACHE = build();
    return CACHE;
  }

  /* ------------------------------------------------------------
     7c · A CLOSED MONTH.

     April has its own head count and its own published net. So the
     month's roll is this month's roll with the people who had not
     joined taken off, re-priced so the rows sum to what that month
     actually paid -- the month's own published figure is the anchor,
     and every row moves by the same proportion, which is the only
     honest thing to do with a total and no lines.

     Who comes off, in order: the person HR has not priced (they are
     not on a payroll at all), then whoever joined part-way through
     this month, then the most recently numbered staff. Nobody is
     invented, and the two held back are not held in a month that was
     paid -- a closed month holds nothing.
     ------------------------------------------------------------ */
  function dropOrder(r, i) {
    if (r.unpriced) return 0;
    if (r.joined) return 1;
    if (r.seeded) return 3;
    return 2;
  }

  function buildPast(m) {
    const D = groupsData();
    const p = periodRow(D, m);
    if (!p) return { byCampus: {}, all: [] };
    const liveAll = ensure();
    const augHeads = liveAll.all.length;

    /* who is on each campus's roll that month */
    const keep = {};
    let kept = [];
    CAMPUSES.forEach(function (cm) {
      const rows = (liveAll.byCampus[cm.id] || []);
      if (!rows.length) { keep[cm.id] = []; return; }
      const want = cm.id === "indiranagar"
        ? p.heads - Math.round((p.heads * (augHeads - rows.length)) / augHeads)
        : Math.round((p.heads * rows.length) / augHeads);
      const order = rows.map(function (r, i) { return { r: r, i: i, k: dropOrder(r, i) }; })
        .sort(function (a, b) { return a.k - b.k || b.i - a.i; });
      const drop = {};
      for (let i = 0; i < rows.length - want && i < order.length; i++) drop[order[i].i] = true;
      const mine = rows.filter(function (r, i) { return !drop[i]; });
      keep[cm.id] = mine;
      kept = kept.concat(mine);
    });

    /* the month's net, split across campuses on what they earn */
    const allNet = kept.reduce(function (s, r) { return s + r.net; }, 0) || 1;
    const byCampus = {};
    const all = [];
    let others = 0;
    CAMPUSES.forEach(function (cm) {
      if (cm.id === "indiranagar") return;
      others += (keep[cm.id] || []).reduce(function (s, r) { return s + r.net; }, 0);
    });
    const indNet = p.net - Math.round((p.net * others) / allNet);

    CAMPUSES.forEach(function (cm) {
      const mine = keep[cm.id] || [];
      if (!mine.length) { byCampus[cm.id] = []; return; }
      const want = cm.id === "indiranagar"
        ? indNet
        : Math.round((p.net * mine.reduce(function (s, r) { return s + r.net; }, 0)) / allNet);
      const nets = spread(want, mine.map(function (r) { return r.net; }));
      const rows = mine.map(function (r, i) {
        const net = nets[i];
        const gross = r.net > 0 ? Math.round((net * r.gross) / r.net) : 0;
        const out = {
          id: r.id, name: r.name, group: r.group, groupNameKey: r.groupNameKey,
          desigKey: r.desigKey, campus: r.campus,
          days: r.days, lop: r.lop, units: r.units,
          monthly: r.monthly, gross: gross, ded: gross - net, net: net,
          emp: Math.round((r.emp * net) / (r.net || 1)),
          arrear: 0, heldKey: null, issue: null,
          claims: [], claimTotal: 0, claimDue: 0,
          overtime: [], otTotal: 0, rises: [],
          loan: loanAt(r, m), seeded: r.seeded, closed: true,
        };
        return out;
      });
      byCampus[cm.id] = rows;
      rows.forEach(function (x) { all.push(x); });
    });

    return { byCampus: byCampus, all: all, run: p.run, net: p.net, heads: p.heads };
  }

  /* a loan as it stood that month: fewer instalments paid, a bigger
     balance, and not there at all if it had not been taken yet */
  function loanAt(r, m) {
    if (!r.loan) return null;
    const back = LIVE_MONTH - m;
    const startM = parseInt(String(r.loan.since).slice(5, 7), 10);
    const startY = parseInt(String(r.loan.since).slice(0, 4), 10);
    if (startY === 2026 && startM > m) return null;
    if (startY > 2026) return null;
    const paid = Math.max(0, r.loan.paid - back);
    const left = r.loan.tenure - paid;
    return Object.assign({}, r.loan, {
      paid: paid, left: left,
      repaidSoFar: r2(r.loan.emi * paid), balance: r2(r.loan.emi * left),
    });
  }

  function periodRow(D, m) {
    const ps = (D && D.PERIODS) || [];
    for (let i = 0; i < ps.length; i++) if (ps[i].m === m) return ps[i];
    return null;
  }

  function monthCache(m) {
    if (m == null || m === LIVE_MONTH) return ensure();
    if (monthState(m) === "ahead") return { byCampus: {}, all: [] };
    if (!PAST[m]) PAST[m] = buildPast(m);
    return PAST[m];
  }

  /* ------------------------------------------------------------
     8 · WHAT THE SCREENS ASK FOR
     ------------------------------------------------------------ */
  function rollOf(cid, m) {
    const c = monthCache(m);
    if (cid === "all" || cid == null) return (c.all || []).slice();
    return (c.byCampus[cid] || []).slice();
  }

  function totalsOf(cid, m) {
    const rows = rollOf(cid, m);
    let gross = 0, ded = 0, net = 0, emp = 0, lop = 0;
    rows.forEach(function (r) { gross += r.gross; ded += r.ded; net += r.net; emp += r.emp; lop += r.lop; });
    return { heads: rows.length, gross: r2(gross), ded: r2(ded), net: r2(net), emp: r2(emp), lopDays: lop };
  }

  /* net payable by pay group, which is what the run's header answers */
  function byGroup(cid, m) {
    const rows = rollOf(cid, m);
    const map = {};
    const order = [];
    rows.forEach(function (r) {
      if (!map[r.group]) { map[r.group] = { key: r.group, nameKey: r.groupNameKey, heads: 0, gross: 0, net: 0 }; order.push(r.group); }
      const mm = map[r.group];
      mm.heads += 1; mm.gross += r.gross; mm.net += r.net;
    });
    return order.map(function (k) { return map[k]; });
  }

  function issuesOf(cid, m) {
    return rollOf(cid, m).filter(function (r) { return r.issue; });
  }

  /* held back: on the roll, earning, and not paid this month */
  function heldOf(cid, m) {
    return rollOf(cid, m).filter(function (r) { return r.heldKey; });
  }
  function heldTotal(cid, m) {
    return heldOf(cid, m).reduce(function (s, r) { return s + r.net; }, 0);
  }
  /* what actually leaves the bank */
  function payableOf(cid, m) {
    return totalsOf(cid, m).net - heldTotal(cid, m);
  }
  function payeesOf(cid, m) {
    return rollOf(cid, m).filter(function (r) { return r.net > 0 && !r.heldKey; }).length;
  }

  /* ---- the two registers, as the run sees them ---- */
  function loansOf(cid, m) {
    const out = [];
    rollOf(cid, m).forEach(function (r) { if (r.loan) out.push({ row: r, l: r.loan }); });
    return out.sort(function (a, b) { return b.l.balance - a.l.balance; });
  }
  function claimsOf(cid, m) {
    const at = m == null ? LIVE_MONTH : m;
    const out = [];
    rollOf(cid, LIVE_MONTH).forEach(function (r) {
      r.claims.forEach(function (cl) {
        /* a closed month can only have held the claims that had been
           approved by then -- and it paid none of them, which is why
           the oldest are overdue now */
        if (cl.approvedMonth > at) return;
        if (at !== LIVE_MONTH && !rowOnMonth(r, at)) return;
        out.push({ row: r, c: cl });
      });
    });
    return out.sort(function (a, b) {
      if (a.c.overdue !== b.c.overdue) return a.c.overdue ? -1 : 1;
      return b.c.v - a.c.v;
    });
  }
  function rowOnMonth(r, m) {
    const rows = monthCache(m).byCampus[r.campus] || [];
    for (let i = 0; i < rows.length; i++) if (rows[i].id === r.id) return true;
    return false;
  }

  function loanTotals(cid, m) {
    const ls = loansOf(cid, m);
    let emi = 0, bal = 0, lent = 0;
    ls.forEach(function (x) { emi += x.l.emi; bal += x.l.balance; lent += x.l.principal; });
    return { n: ls.length, emi: r2(emi), balance: r2(bal), principal: r2(lent) };
  }
  function claimTotals(cid, m) {
    const cs = claimsOf(cid, m);
    let all = 0, due = 0, n = 0;
    cs.forEach(function (x) { all += x.c.v; if (x.c.overdue) { due += x.c.v; n += 1; } });
    return { n: cs.length, total: r2(all), overdue: n, overdueTotal: r2(due) };
  }

  function rowById(cid, id, m) {
    const rows = rollOf(cid, m);
    for (let i = 0; i < rows.length; i++) if (rows[i].id === id) return rows[i];
    return null;
  }

  function runIdOf(m) {
    const D = groupsData();
    const p = periodRow(D, m);
    return p ? p.run : null;
  }

  /* the designations are copy, so they live where copy lives */
  if (window.UI3 && window.UI3.addStrings) {
    window.UI3.addStrings({
      en: {
        "roll.g.pgt": "PGT", "roll.g.tgt": "TGT", "roll.g.prt": "PRT",
        "roll.g.hod": "Head of department", "roll.g.coord": "Coordinator",
        "roll.g.librarian": "Librarian", "roll.g.sports": "Sports",
        "roll.g.accounts": "Accounts", "roll.g.clerk": "Clerk",
        "roll.g.front": "Front office", "roll.g.facilities": "Facilities",
        "roll.g.lab": "Lab assistant", "roll.g.transport": "Transport",
        "roll.g.nurse": "School nurse",
        "roll.g.guest": "Guest faculty", "roll.g.visiting": "Visiting faculty",
        "roll.g.music": "Music", "roll.g.counsel": "Counsellor",
        "roll.held.notice": "On notice", "roll.held.bank": "Bank account wrong",
      },
    });
  }

  window.NaveyaRoll = {
    CAMPUSES: CAMPUSES, CAMPUS_OF: CAMPUS_OF, MONTH_DAYS: MONTH_DAYS,
    MONTHS: MONTHS, LIVE_MONTH: LIVE_MONTH, monthState: monthState, monthOf: monthOf,
    ISSUES: ISSUES, KNOWN: KNOWN,
    roll: rollOf, totals: totalsOf, byGroup: byGroup, issues: issuesOf,
    held: heldOf, heldTotal: heldTotal, payable: payableOf, payees: payeesOf,
    loans: loansOf, claims: claimsOf, loanTotals: loanTotals, claimTotals: claimTotals,
    rowById: rowById, runIdOf: runIdOf,
    campusOf: campusOf, spread: spread, rng: rng, r2: r2,
    reset: function () { CACHE = null; Object.keys(PAST).forEach(function (k) { delete PAST[k]; }); },
  };
})();
