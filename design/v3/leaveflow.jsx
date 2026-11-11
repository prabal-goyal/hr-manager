/* @jsxRuntime classic */
/* ============================================================
   Naveya — the leave approval chain · window.LeaveFlow

   SPEC: M8 (Leave) §6.7 LeaveRequest, on the M7 calendar frame.
   This file is the ONE place the chain is defined, so five screens
   cannot drift apart about who decides what:

     employee applies   -> head of department
     more than  3 days  -> ... then the principal
     more than 15 days  -> ... then the director

   A department head applying for herself starts one rung higher
   (the principal is her own approver), so her chain is
   principal -> [director, if longer than 15 days]. The principal
   and the director sit at the top: they do not apply here at all,
   which is why neither role carries the self-service Leave rail
   item (kit.jsx ROLE_PERMISSIONS).

   The DIRECTOR sees every leave request in the trust, at any
   length — visibility is not the same as a decision. He only holds
   a decision on the >15-day ones.

   HR sees all of it and decides NONE of it: HR-28 is a tracker.
   The approve/decline controls are ABSENT on that screen, not
   disabled — the right does not exist for the role at all
   (docs/ui-compliance-requirements.md, offered / disabled-with-
   reason / absent).

   WHY A STORE. DH-02, PR-03, DR-02 and HR-28 are four windows onto
   the same queue. A decision taken in one has to be visible in the
   others immediately, or the prototype teaches a flow that does not
   exist. One module-level list + a subscription is enough for a
   design canvas; the real thing is a LeaveRequest table with an
   append-only decision trail (the trail here is append-only too —
   a stage is written once and never rewritten).
   ============================================================ */
(function () {
  const { useState, useEffect } = React;
  const G3 = window.G3;
  const UI = window.UI3;
  const { useTheme, useLang, addStrings, Chip, Icon, num } = UI;

  const TODAY_ISO = "2026-08-11";

  /* ============================================================
     1 · THE RULE
     ============================================================ */
  const LADDER = ["deptHead", "principal", "director"];
  /* `principalFrom` is inclusive — 3 days climbs, 2 days does not.
     `directorOver` is exclusive — 16 days and up needs the signature. */
  const RULES = { principalFrom: 3, directorOver: 15 };

  /* who has to say yes, for this person and this many days */
  function stageRolesFor(person, days, req) {
    if (!person || person.topOfChain) return [];
    const start = person.role === "deptHead" ? "principal" : "deptHead";
    const set = [start];
    const blackout = !!(req && req.blackoutKey);
    if ((days >= RULES.principalFrom || blackout) && set.indexOf("principal") === -1) set.push("principal");
    if (days > RULES.directorOver && set.indexOf("director") === -1) set.push("director");
    return LADDER.filter((r) => set.indexOf(r) !== -1);
  }

  /* the rule in one sentence, for the applicant in hand — a head's
     own leave starts at the principal, so the teacher's wording would
     be wrong on her screen */
  function ruleKeyForApplicant(person, days) {
    if (person && person.role === "deptHead") return days > RULES.directorOver ? "lf.rule.headOwnThree" : "lf.rule.headOwnOne";
    return ruleKeyFor(days);
  }

  /* the rule in one sentence, for the length in hand */
  function ruleKeyFor(days) {
    if (days > RULES.directorOver) return "lf.rule.three";
    if (days >= RULES.principalFrom) return "lf.rule.two";
    return "lf.rule.one";
  }

  /* ============================================================
     2 · WHO IS WHO
     Names are i18n keys, never literal English — a Hindi reader
     must not meet a stray Latin name in a register.
     ============================================================ */
  const DEPTS = {
    science: "lf.d.science", maths: "lf.d.maths", english: "lf.d.english",
    primary: "lf.d.primary", office: "lf.d.office",
  };

  /* Every person carries a birthday (DAY AND MONTH ONLY — a birth
     year is never held here, so nothing on any screen lets a
     colleague work out somebody's age) and a joining date, because
     the anniversary IS the fact being celebrated. */
  const PEOPLE = [
    /* Science */
    { id: "anjali", nameKey: "lf.n.anjali", deptKey: "science", desigKey: "lf.g.hodScience", role: "deptHead", vacation: true, campusKey: "lf.c.main", dob: "10-07", joined: "2014-07-01" },
    { id: "ananya", nameKey: "lf.n.ananya", deptKey: "science", desigKey: "lf.g.pgtPhysics", role: "employee", vacation: true, campusKey: "lf.c.main", dob: "09-04", joined: "2019-06-12" },
    { id: "karan", nameKey: "lf.n.karan", deptKey: "science", desigKey: "lf.g.tgtChem", role: "employee", vacation: true, campusKey: "lf.c.main", dob: "08-15", joined: "2021-08-20" },
    { id: "meeraj", nameKey: "lf.n.meeraj", deptKey: "science", desigKey: "lf.g.tgtBio", role: "employee", vacation: true, campusKey: "lf.c.main", dob: "12-02", joined: "2022-08-16" },
    { id: "priya", nameKey: "lf.n.priya", deptKey: "science", desigKey: "lf.g.pgtChem", role: "employee", vacation: true, campusKey: "lf.c.main", dob: "08-12", joined: "2020-04-06" },
    { id: "sanjay", nameKey: "lf.n.sanjay", deptKey: "science", desigKey: "lf.g.lab", role: "employee", vacation: false, campusKey: "lf.c.main", dob: "03-19", joined: "2024-08-29" },
    { id: "ramesh", nameKey: "lf.n.ramesh", deptKey: "science", desigKey: "lf.g.tgtScience", role: "employee", vacation: true, campusKey: "lf.c.main", dob: "06-27", joined: "2016-09-01" },
    { id: "divya", nameKey: "lf.n.divya", deptKey: "science", desigKey: "lf.g.tgtScience", role: "employee", vacation: true, campusKey: "lf.c.main", dob: "08-23", joined: "2023-01-09" },
    { id: "rahul", nameKey: "lf.n.rahul", deptKey: "science", desigKey: "lf.g.pgtPhysics", role: "employee", vacation: true, campusKey: "lf.c.main", dob: "11-30", joined: "2018-07-02" },
    { id: "suresh", nameKey: "lf.n.suresh", deptKey: "science", desigKey: "lf.g.tgtScience", role: "employee", vacation: true, campusKey: "lf.c.main", dob: "02-08", joined: "2015-06-15" },
    /* Maths */
    { id: "vikram", nameKey: "lf.n.vikram", deptKey: "maths", desigKey: "lf.g.hodMaths", role: "deptHead", vacation: true, campusKey: "lf.c.main", dob: "05-21", joined: "2012-04-02" },
    { id: "deepa", nameKey: "lf.n.deepa", deptKey: "maths", desigKey: "lf.g.tgtMaths", role: "employee", vacation: true, campusKey: "lf.c.main", dob: "09-17", joined: "2021-06-14" },
    /* English */
    { id: "farah", nameKey: "lf.n.farah", deptKey: "english", desigKey: "lf.g.hodEnglish", role: "deptHead", vacation: true, campusKey: "lf.c.main", dob: "01-25", joined: "2017-07-03" },
    { id: "devika", nameKey: "lf.n.devika", deptKey: "english", desigKey: "lf.g.tgtEnglish", role: "employee", vacation: true, campusKey: "lf.c.main", dob: "08-31", joined: "2022-06-13" },
    /* Primary — a second campus, so the director's view is not one school */
    { id: "shanti", nameKey: "lf.n.shanti", deptKey: "primary", desigKey: "lf.g.prt", role: "employee", vacation: true, campusKey: "lf.c.north", dob: "04-11", joined: "2013-06-10" },
    { id: "basav", nameKey: "lf.n.basav", deptKey: "primary", desigKey: "lf.g.hodPrimary", role: "deptHead", vacation: true, campusKey: "lf.c.north", dob: "07-19", joined: "2011-04-04" },
    /* Office — 12-month staff, so earned leave is theirs */
    { id: "sunil", nameKey: "lf.n.sunil", deptKey: "office", desigKey: "lf.g.hodAdmin", role: "deptHead", vacation: false, campusKey: "lf.c.main", dob: "10-02", joined: "2009-08-17" },
    { id: "manju", nameKey: "lf.n.manju", deptKey: "office", desigKey: "lf.g.clerk", role: "employee", vacation: false, campusKey: "lf.c.main", dob: "12-14", joined: "2019-09-02" },
    { id: "prakash", nameKey: "lf.n.prakash", deptKey: "office", desigKey: "lf.g.support", role: "employee", vacation: false, campusKey: "lf.c.main", dob: "06-05", joined: "2020-01-20" },
    /* the top of the chain — they decide, they do not apply */
    { id: "radhika", nameKey: "lf.n.radhika", deptKey: null, desigKey: "lf.g.principal", role: "principal", topOfChain: true, campusKey: "lf.c.main", dob: "03-02", joined: "2008-06-02" },
    { id: "arvind", nameKey: "lf.n.arvind", deptKey: null, desigKey: "lf.g.director", role: "director", topOfChain: true, campusKey: null, dob: "11-11", joined: "2005-04-01" },
  ];

  function personById(id) { return PEOPLE.filter((p) => p.id === id)[0] || null; }
  function headOfDept(deptKey) { return PEOPLE.filter((p) => p.role === "deptHead" && p.deptKey === deptKey)[0] || null; }
  const PRINCIPAL = personById("radhika");
  const DIRECTOR = personById("arvind");

  /* who holds a given rung, for a given applicant */
  function holderOf(stageRole, applicant) {
    if (stageRole === "principal") return PRINCIPAL;
    if (stageRole === "director") return DIRECTOR;
    return headOfDept(applicant.deptKey);
  }

  /* ============================================================
     3 · LEAVE TYPES
     ============================================================ */
  const TYPES = {
    CL: { code: "CL", key: "lv.type.cl", role: "ltCasual" },
    SL: { code: "SL", key: "lv.type.sl", role: "ltSick" },
    COMP: { code: "COMP", key: "lv.type.comp", role: "ltComp" },
    EL: { code: "EL", key: "lv.type.el", role: "ltEL" },
  };
  function typeOf(code) { return TYPES[code] || TYPES.CL; }

  /* asked -> accepted | declined. No cover at all is only possible on
     a leave that costs no teaching days; naming somebody is part of
     applying, never a task left for afterwards. */
  function coverState(req) { return req.coverWith ? (req.coverWith.state || "accepted") : null; }
  function coverLine(t, req) {
    if (!req.coverWith) return null;
    const who = personById(req.coverWith.who);
    const name = who ? t(who.nameKey) : "";
    const st = coverState(req);
    return name + " \u00b7 " + t("lf.cover." + st);
  }

  /* ============================================================
     4 · THE QUEUE
     Cross-screen ids are deliberate: LR-0219 is the request
     pages/leave.jsx shows Ananya making, DH-LR-* are the science
     queue pages/depthead.jsx already carried, LR-0296 / LR-0288 /
     LR-0281 are the ones pages/principal.jsx escalated. Same ids,
     one list, so a decision follows the request across screens.
     ============================================================ */
  const SEED = [
    /* --- waiting on the head of Science --- */
    { id: "LR-0219", who: "ananya", type: "CL", from: "2026-08-24", to: "2026-08-25", days: 2, appliedISO: "2026-08-09", reasonKey: "lv.r.wedding",
      coverWith: { who: "meeraj", from: "2026-08-24", to: "2026-08-25", state: "asked" } },
    { id: "DH-LR-0301", who: "karan", type: "SL", from: "2026-08-06", to: "2026-08-07", days: 2, appliedISO: "2026-08-11", reasonKey: "dh2.r.karanRetro", retro: true },
    { id: "DH-LR-0288", who: "priya", type: "CL", from: "2026-09-01", to: "2026-09-03", days: 3, appliedISO: "2026-08-10", reasonKey: "dh2.r.priyaTravel",
      coverWith: { who: "karan", from: "2026-09-01", to: "2026-09-03", state: "declined", noteKey: "lf.cover.karanNo" } },
    { id: "DH-LR-0276", who: "sanjay", type: "CL", from: "2026-08-18", to: "2026-08-22", days: 5, appliedISO: "2026-08-08", reasonKey: "dh2.r.sanjayHome", coverWith: { who: "ramesh", from: "2026-08-18", to: "2026-08-22" } },
    { id: "DH-LR-0265", who: "meeraj", type: "CL", from: "2026-07-28", to: "2026-07-29", days: 2, appliedISO: "2026-07-24", reasonKey: "dh2.r.meeraJuly", lockedMonth: true },
    { id: "DH-LR-0269", who: "meeraj", type: "CL", from: "2026-09-15", to: "2026-09-17", days: 3, appliedISO: "2026-08-10", reasonKey: "dh2.r.meeraSept", blackoutKey: "lv.win.exam1" },

    /* --- ten days and more: what the principal and the director are
           actually for. Each has cover named, because a fortnight of
           classes cannot be left to sort itself out. --- */
    { id: "LR-0331", who: "priya", type: "SL", from: "2026-09-07", to: "2026-09-18", days: 12, appliedISO: "2026-08-10", reasonKey: "lf.r.priyaLong", shortDays: 1,
      coverWith: { who: "ananya", from: "2026-09-07", to: "2026-09-18" },
      decided: [{ role: "deptHead", outcome: "approved", onISO: "2026-08-11" }] },
    { id: "LR-0327", who: "devika", type: "EL", from: "2026-10-05", to: "2026-10-16", days: 11, appliedISO: "2026-08-05", reasonKey: "lf.r.devikaLong",
      coverWith: { who: "farah", from: "2026-10-05", to: "2026-10-16" },
      decided: [{ role: "deptHead", outcome: "approved", onISO: "2026-08-06" }] },
    { id: "LR-0335", who: "karan", type: "SL", from: "2026-09-21", to: "2026-10-09", days: 19, appliedISO: "2026-08-09", reasonKey: "lf.r.karanLong", shortDays: 12,
      coverWith: { who: "rahul", from: "2026-09-21", to: "2026-10-09" },
      decided: [{ role: "deptHead", outcome: "approved", onISO: "2026-08-10" }, { role: "principal", outcome: "approved", onISO: "2026-08-11" }] },
    { id: "LR-0338", who: "deepa", type: "EL", from: "2026-11-02", to: "2026-11-24", days: 23, appliedISO: "2026-08-07", reasonKey: "lf.r.deepaLong", shortDays: 16,
      coverWith: { who: "vikram", from: "2026-11-02", to: "2026-11-24" },
      decided: [{ role: "deptHead", outcome: "approved", onISO: "2026-08-08" }] },

    /* --- cleared by a head, now with the principal --- */
    { id: "LR-0296", who: "meeraj", type: "CL", from: "2026-08-20", to: "2026-08-23", days: 4, appliedISO: "2026-08-08", reasonKey: "pr.reason.meera",
      decided: [{ role: "deptHead", outcome: "approved", onISO: "2026-08-09" }] },
    { id: "LR-0288", who: "rahul", type: "CL", from: "2026-09-17", to: "2026-09-18", days: 2, appliedISO: "2026-08-06", reasonKey: "pr.reason.rahul", blackoutKey: "lv.win.exam1",
      decided: [{ role: "deptHead", outcome: "approved", onISO: "2026-08-07" }] },
    { id: "LR-0281", who: "deepa", type: "SL", from: "2026-08-04", to: "2026-08-07", days: 4, appliedISO: "2026-08-10", reasonKey: "pr.reason.priya", retro: true, shortDays: 1,
      decided: [{ role: "deptHead", outcome: "approved", onISO: "2026-08-10" }] },
    /* a head's OWN leave — her chain starts at the principal */
    { id: "LR-0301", who: "anjali", type: "CL", from: "2026-08-18", to: "2026-08-19", days: 2, appliedISO: "2026-08-10", reasonKey: "pr.reason.anjali" },
    /* the head of English applying for herself */
    { id: "LR-0274", who: "farah", type: "SL", from: "2026-08-12", to: "2026-08-12", days: 1, appliedISO: "2026-08-07", reasonKey: "pr.reason.farah" },

    /* --- long leave: cleared by head and principal, now the director's --- */
    { id: "LR-0312", who: "shanti", type: "SL", from: "2026-09-07", to: "2026-09-28", days: 22, appliedISO: "2026-08-04", reasonKey: "lf.r.surgery", shortDays: 14,
      coverWith: { who: "basav", from: "2026-09-07", to: "2026-09-28" },
      decided: [{ role: "deptHead", outcome: "approved", onISO: "2026-08-05" }, { role: "principal", outcome: "approved", onISO: "2026-08-07" }] },
    { id: "LR-0322", who: "anjali", type: "SL", from: "2026-10-05", to: "2026-10-22", days: 16, appliedISO: "2026-08-08", reasonKey: "lf.r.anjaliSurgery", shortDays: 9,
      coverWith: { who: "ramesh", from: "2026-10-05", to: "2026-10-22" },
      decided: [{ role: "principal", outcome: "approved", onISO: "2026-08-09" }] },

    /* --- long leave still climbing: head said yes, principal has it --- */
    { id: "LR-0318", who: "manju", type: "EL", from: "2026-09-01", to: "2026-09-18", days: 18, appliedISO: "2026-08-03", reasonKey: "lf.r.manjuFamily",
      coverWith: { who: "prakash", from: "2026-09-01", to: "2026-09-18" },
      decided: [{ role: "deptHead", outcome: "approved", onISO: "2026-08-04" }] },

    /* --- approved and HAPPENING TODAY, so "who is away right now"
           has an answer on every screen that asks --- */
    { id: "LR-0209", who: "divya", type: "CL", from: "2026-08-11", to: "2026-08-11", days: 1, appliedISO: "2026-08-05", reasonKey: "lv.r.personal",
      decided: [{ role: "deptHead", outcome: "approved", onISO: "2026-08-06" }] },
    { id: "LR-0203", who: "shanti", type: "SL", from: "2026-08-11", to: "2026-08-11", days: 1, appliedISO: "2026-08-10", reasonKey: "lf.r.shantiDay",
      decided: [{ role: "deptHead", outcome: "approved", onISO: "2026-08-10" }] },
    { id: "LR-0196", who: "devika", type: "CL", from: "2026-08-10", to: "2026-08-12", days: 3, appliedISO: "2026-08-01", reasonKey: "lf.r.devikaFamily",
      coverWith: { who: "farah", from: "2026-08-10", to: "2026-08-12" },
      decided: [{ role: "deptHead", outcome: "approved", onISO: "2026-08-02" }, { role: "principal", outcome: "approved", onISO: "2026-08-03" }] },
    { id: "LR-0211", who: "rahul", type: "CL", from: "2026-08-11", to: "2026-08-11", days: 1, appliedISO: "2026-08-07", reasonKey: "lf.r.rahulHospital",
      decided: [{ role: "deptHead", outcome: "approved", onISO: "2026-08-08" }] },
    { id: "LR-0205", who: "prakash", type: "CL", from: "2026-08-11", to: "2026-08-13", days: 3, appliedISO: "2026-08-04", reasonKey: "lf.r.prakashCourt",
      decided: [{ role: "deptHead", outcome: "approved", onISO: "2026-08-05" }, { role: "principal", outcome: "approved", onISO: "2026-08-06" }] },

    /* --- settled --- */
    { id: "LR-0207", who: "ananya", type: "CL", from: "2026-08-05", to: "2026-08-05", days: 1, appliedISO: "2026-08-01", reasonKey: "lv.r.family",
      coverWith: { who: "karan", from: "2026-08-05", to: "2026-08-05" },
      decided: [{ role: "deptHead", outcome: "approved", onISO: "2026-08-03" }] },
    { id: "LR-0198", who: "ananya", type: "CL", from: "2026-07-22", to: "2026-07-24", days: 3, appliedISO: "2026-07-15", reasonKey: "lv.r.travel",
      decided: [{ role: "deptHead", outcome: "rejected", onISO: "2026-07-18", noteKey: "lv.d.note.preboard" }] },
    { id: "DH-LR-0210", who: "ramesh", type: "SL", from: "2026-08-20", to: "2026-08-21", days: 2, appliedISO: "2026-08-02", reasonKey: "dh2.r.rameshHome",
      coverWith: { who: "meeraj", from: "2026-08-20", to: "2026-08-21" },
      decided: [{ role: "deptHead", outcome: "approved", onISO: "2026-08-04" }] },
    { id: "DH-LR-0198", who: "divya", type: "CL", from: "2026-07-20", to: "2026-07-21", days: 2, appliedISO: "2026-07-10", reasonKey: "dh2.r.divyaJuly",
      decided: [{ role: "deptHead", outcome: "rejected", onISO: "2026-07-12", noteKey: "dh2.note.rejPrep" }] },
    { id: "LR-0255", who: "devika", type: "CL", from: "2026-08-03", to: "2026-08-03", days: 1, appliedISO: "2026-08-02", reasonKey: "pr.reason.devika",
      coverWith: { who: "farah", from: "2026-08-03", to: "2026-08-03" },
      decided: [{ role: "deptHead", outcome: "approved", onISO: "2026-08-03" }] },
    { id: "LR-0240", who: "anjali", type: "CL", from: "2026-07-03", to: "2026-07-03", days: 1, appliedISO: "2026-06-29", reasonKey: "lv.r.personal",
      decided: [{ role: "principal", outcome: "approved", onISO: "2026-07-01" }] },
    { id: "LR-0262", who: "anjali", type: "CL", from: "2026-06-11", to: "2026-06-16", days: 4, appliedISO: "2026-06-05", reasonKey: "lf.r.anjaliFamily",
      decided: [{ role: "principal", outcome: "rejected", onISO: "2026-06-07", noteKey: "lf.note.anjaliRej" }] },
    { id: "LR-0304", who: "basav", type: "EL", from: "2026-09-21", to: "2026-10-12", days: 20, appliedISO: "2026-08-01", reasonKey: "lf.r.basavHome",
      decided: [{ role: "principal", outcome: "approved", onISO: "2026-08-02" }, { role: "director", outcome: "rejected", onISO: "2026-08-05", noteKey: "lf.note.basavRej" }] },
    { id: "LR-0292", who: "prakash", type: "EL", from: "2026-07-06", to: "2026-07-27", days: 18, appliedISO: "2026-06-20", reasonKey: "lf.r.prakashHome",
      coverWith: { who: "manju", from: "2026-07-06", to: "2026-07-27" },
      decided: [{ role: "deptHead", outcome: "approved", onISO: "2026-06-21" }, { role: "principal", outcome: "approved", onISO: "2026-06-23" }, { role: "director", outcome: "approved", onISO: "2026-06-26" }] },
    { id: "DH-LR-0180", who: "karan", type: "CL", from: "2026-08-03", to: "2026-08-03", days: 0.5, half: "first", appliedISO: "2026-07-28", reasonKey: "dh2.r.karanHalf",
      cancelledISO: "2026-08-01", cancelledByKey: "lf.n.karan" },
  ];

  /* seed -> request, with the chain written out. A stage carries its
     own holder, so a decision reads as "Anjali Deshpande approved",
     never as an anonymous tick. */
  function buildRequest(s) {
    const person = personById(s.who);
    const roles = stageRolesFor(person, s.days, s);
    const decided = s.decided || [];
    const stages = roles.map((role) => {
      const d = decided.filter((x) => x.role === role)[0];
      const holder = holderOf(role, person);
      return {
        role: role,
        holderId: holder ? holder.id : null,
        holderNameKey: holder ? holder.nameKey : null,
        outcome: d ? d.outcome : null,
        onISO: d ? d.onISO : null,
        noteKey: d ? d.noteKey : null,
        note: null,
      };
    });
    return Object.assign({}, s, { person: person, stages: stages });
  }

  /* ---- derived reads. Nothing writes `status`: it IS the trail ---- */
  function statusOf(req) {
    if (req.cancelledISO) return "cancelled";
    if (req.stages.some((s) => s.outcome === "rejected")) return "rejected";
    if (req.stages.length && req.stages.every((s) => s.outcome === "approved")) return "approved";
    return "pending";
  }
  function currentStage(req) {
    if (statusOf(req) !== "pending") return null;
    return req.stages.filter((s) => !s.outcome)[0] || null;
  }
  function waitingRole(req) { const s = currentStage(req); return s ? s.role : null; }
  function isWaitingOn(req, role) { return waitingRole(req) === role; }
  function decidedStage(req, role) { return req.stages.filter((s) => s.role === role && s.outcome)[0] || null; }
  /* has this rung already had its say, whatever the answer */
  function hasSeen(req, role) { return !!decidedStage(req, role); }
  function progressOf(req) {
    const done = req.stages.filter((s) => s.outcome).length;
    return { done: done, total: req.stages.length, frac: req.stages.length ? done / req.stages.length : 0 };
  }
  /* the rung AFTER the one deciding now — "if you approve, it goes to…" */
  function nextRoleAfter(req, role) {
    const i = req.stages.map((s) => s.role).indexOf(role);
    return i >= 0 && req.stages[i + 1] ? req.stages[i + 1].role : null;
  }
  function ageOf(req) {
    const a = new Date(req.appliedISO.replace(/-/g, "/"));
    const b = new Date(TODAY_ISO.replace(/-/g, "/"));
    return Math.round((b - a) / 86400000);
  }

  /* ============================================================
     5 · THE STORE
     ============================================================ */
  let REQUESTS = SEED.map(buildRequest);
  const subs = [];
  function emit() { REQUESTS = REQUESTS.slice(); subs.forEach((fn) => fn()); }

  function useRequests() {
    const [, bump] = useState(0);
    useEffect(() => {
      const fn = () => bump((v) => v + 1);
      subs.push(fn);
      return () => { const i = subs.indexOf(fn); if (i !== -1) subs.splice(i, 1); };
    }, []);
    return REQUESTS;
  }

  /* one rung answers. Append-only: a stage already decided is never
     rewritten, and a rung cannot answer out of turn. */
  function decide(id, role, outcome, note) {
    const req = REQUESTS.filter((r) => r.id === id)[0];
    if (!req) return false;
    const stage = currentStage(req);
    if (!stage || stage.role !== role) return false;
    stage.outcome = outcome;
    stage.onISO = TODAY_ISO;
    stage.note = note || null;
    emit();
    return true;
  }
  /* the applicant takes it back. Only while it is still climbing —
     once a rung has answered, the record stands and HR cancels. */
  function withdraw(id, byKey) {
    const req = REQUESTS.filter((r) => r.id === id)[0];
    if (!req || statusOf(req) !== "pending") return false;
    req.cancelledISO = TODAY_ISO;
    req.cancelledByKey = byKey;
    emit();
    return true;
  }
  /* a new request enters the SAME queue the approvers read. Naming a
     cover is part of applying (never a task left for later), so a
     draft without one is only accepted when it costs no cover. */
  let applySeq = 400;
  function submit(personId, draft) {
    const person = personById(personId);
    if (!person) return null;
    applySeq += 1;
    const coverId = draft.cover && draft.cover.one ? draft.cover.one : null;
    const req = buildRequest({
      id: "LR-0" + applySeq,
      who: personId,
      type: draft.type,
      from: draft.from,
      to: draft.to,
      days: draft.days,
      half: draft.half || null,
      appliedISO: TODAY_ISO,
      reasonKey: draft.reason || "",
      /* freshly nominated: asked, not yet answered — the colleague has
         not seen it yet, so it must not read as agreed */
      coverWith: coverId && personById(coverId) ? { who: coverId, from: draft.from, to: draft.to, state: "asked" } : null,
    });
    REQUESTS = [req].concat(REQUESTS);
    emit();
    return req;
  }

  /* birthdays and work anniversaries falling in the next `days` days.
     The occurrence is computed forward from today, so a date already
     past this year rolls to the next one and nothing shows as
     "in -3 days". */
  function celebrations(days, deptKey, excludeId) {
    const from = parseISO(TODAY_ISO);
    const out = [];
    function nextOn(mmdd) {
      const y = from.getFullYear();
      let d = parseISO(y + "-" + mmdd);
      if (d < from) d = parseISO(y + 1 + "-" + mmdd);
      return d;
    }
    PEOPLE.forEach((p) => {
      if (deptKey && p.deptKey !== deptKey) return;
      if (excludeId && p.id === excludeId) return;
      if (p.dob) {
        const d = nextOn(p.dob);
        out.push({ key: p.id + "-b", person: p, kind: "birthday", date: d, inDays: Math.round((d - from) / 86400000) });
      }
      if (p.joined) {
        const d = nextOn(p.joined.slice(5));
        const years = d.getFullYear() - Number(p.joined.slice(0, 4));
        if (years > 0) out.push({ key: p.id + "-a", person: p, kind: "anniversary", years: years, date: d, inDays: Math.round((d - from) / 86400000) });
      }
    });
    return out.filter((x) => x.inDays <= days).sort((a, b) => a.inDays - b.inDays);
  }

  /* ONE card for both homes: the department head sees her team's, a
     teacher sees her colleagues'. `layout` is the only difference —
     a column card on DH-01, a quiet band across the foot of EMP-01. */
  function CelebrationsCard({ deptKey, excludeId, days, layout, title, sub }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const { Card } = UI;
    const list = celebrations(days || 30, deptKey, excludeId).slice(0, layout === "band" ? 4 : 3);

    function whenWord(x) {
      return x.inDays === 0 ? t("lf.cel.today") : x.inDays === 1 ? t("lf.cel.tomorrow") : t("lf.cel.inDays", { n: num(x.inDays) });
    }
    function what(x) {
      return x.kind === "birthday" ? t("lf.cel.birthday") : t("lf.cel.years", { n: num(x.years) });
    }
    function dateBlock(x) {
      return (
        <span
          aria-hidden="true"
          style={{
            flex: "0 0 auto", width: 44, height: 46, borderRadius: G3.r.md, background: c.sunken,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          }}
        >
          <span style={G3.fig("md", { fontWeight: 700, color: c.ink, lineHeight: 1.15 })}>{x.date.getDate()}</span>
          <span style={ty("caption", { fontSize: 10.5, lineHeight: 1.3, color: c.inkMuted })}>{t(MONTH_SHORT[x.date.getMonth() + 1])}</span>
        </span>
      );
    }

    const empty = <p style={ty("small", { color: c.inkMuted, margin: 0 })}>{t("lf.cel.none")}</p>;

    if (layout === "band") {
      return (
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
            <span style={ty("caption", { color: c.inkFaint, fontWeight: 700, flex: "0 0 auto" })}>{title || t("lf.cel.title")}</span>
            {list.length === 0 ? empty : (
              <div style={{ display: "flex", flex: "1 1 520px", flexWrap: "wrap" }}>
                {list.map((x, i) => (
                  <span
                    key={x.key}
                    style={{
                      display: "flex", alignItems: "center", gap: 11, flex: "1 1 210px", minWidth: 0,
                      padding: i ? "2px 16px" : "2px 16px 2px 0",
                      borderInlineStart: i ? "1px solid " + c.rule : "none",
                    }}
                  >
                    {dateBlock(x)}
                    <span style={{ minWidth: 0 }}>
                      <span style={ty("small", { display: "block", color: c.ink, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" })}>{t(x.person.nameKey)}</span>
                      <span style={ty("caption", { display: "block", color: c.inkMuted })}>{what(x)}</span>
                      <span style={ty("caption", { display: "block", color: c.inkFaint })}>{whenWord(x)}</span>
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </Card>
      );
    }

    return (
      <Card icon="staff" iconTone="accent" title={title || t("lf.cel.title")} sub={sub}>
        {list.length === 0 ? empty : (
          <div>
            {list.map((x, i) => (
              <div key={x.key} style={{ display: "flex", alignItems: "center", gap: 13, padding: "10px 0", borderTop: i ? "1px solid " + c.rule : "none" }}>
                {dateBlock(x)}
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={ty("small", { display: "block", color: c.ink, fontWeight: 700 })}>{t(x.person.nameKey)}</span>
                  <span style={ty("caption", { display: "block", color: c.inkMuted, marginTop: 2 })}>{what(x)}</span>
                </span>
                <span style={ty("caption", { color: c.inkFaint, whiteSpace: "nowrap" })}>{whenWord(x)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    );
  }

  /* ============================================================
     WHO IS NOT IN TODAY.

     A teacher asks it before she asks anybody to take a class, and a
     head asks it before she plans the day — and until now the only
     answer in the product was a figure on My team. It is read from the
     SAME approved requests every other leave screen reads, so it
     cannot disagree with them.

     IT NEVER SAYS WHICH LEAVE. Medical leave is health data (§8-F14)
     and a colleague has no business reading it; "away" and the day
     they are back is the whole of what anybody is told. No reason, no
     type, no note.
     ============================================================ */
  function awayOn(iso, deptKey, excludeId) {
    return REQUESTS
      .filter(function (r) {
        if (statusOf(r) !== "approved") return false;
        /* ISO dates compare as strings, which is the whole reason this
           canvas stores them that way */
        if (r.from > iso || r.to < iso) return false;
        const p = personById(r.who);
        if (!p) return false;
        if (deptKey && p.deptKey !== deptKey) return false;
        if (excludeId && p.id === excludeId) return false;
        return true;
      })
      .map(function (r) { return { req: r, person: personById(r.who) }; })
      .sort(function (a, b) { return a.person.id < b.person.id ? -1 : 1; });
  }

  function AwayTodayCard({ deptKey, excludeId, title }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const { Card, Avatar } = UI;
    useRequests();
    const list = awayOn(TODAY_ISO, deptKey, excludeId);

    return (
      <Card icon="leave" iconTone="leave" title={title || t("lf.away.title")}>
        {list.length === 0 ? (
          <p style={ty("small", { color: c.inkMuted, margin: 0 })}>{t("lf.away.none")}</p>
        ) : (
          <div>
            {list.map(function (x, i) {
              const lastDay = x.req.to === TODAY_ISO;
              return (
                <div key={x.req.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderTop: i ? "1px solid " + c.rule : "none" }}>
                  <Avatar name={t(x.person.nameKey)} size={34} tone="leave" />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={ty("small", { display: "block", color: c.ink, fontWeight: 700 })}>{t(x.person.nameKey)}</span>
                    <span style={ty("caption", { display: "block", color: c.inkMuted, marginTop: 2 })}>{subLine(t, x.person)}</span>
                  </span>
                  <span style={ty("caption", { color: c.inkFaint, whiteSpace: "nowrap" })}>
                    {lastDay ? t("lf.away.backTomorrow") : t("lf.away.until", { date: fmtDate(t, x.req.to) })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    );
  }

  function byId(id) { return REQUESTS.filter((r) => r.id === id)[0] || null; }
  function forPerson(id) { return REQUESTS.filter((r) => r.who === id); }
  function inDept(deptKey) { return REQUESTS.filter((r) => r.person && r.person.deptKey === deptKey); }

  /* ============================================================
     6 · WORDS
     ============================================================ */
  addStrings({
    en: {
      "lf.d.science": "Science", "lf.d.maths": "Mathematics", "lf.d.english": "English",
      "lf.d.primary": "Primary", "lf.d.office": "Office and support",
      "lf.c.main": "Indiranagar campus", "lf.c.north": "Whitefield campus",
      "lf.trust": "Sunrise Education Trust",

      "lf.n.anjali": "Anjali Deshpande", "lf.n.ananya": "Ananya Rao", "lf.n.karan": "Karan Mehta",
      "lf.n.meeraj": "Meera Joshi", "lf.n.priya": "Priya Nair", "lf.n.sanjay": "Sanjay Verma",
      "lf.n.ramesh": "Ramesh Iyer", "lf.n.divya": "Divya Kapoor", "lf.n.rahul": "Rahul Verma",
      "lf.n.suresh": "Suresh Kulkarni", "lf.n.vikram": "Vikram Rao", "lf.n.deepa": "Deepa Shah",
      "lf.n.farah": "Farah Khan", "lf.n.devika": "Devika Rao", "lf.n.shanti": "Shanti Pillai",
      "lf.n.basav": "Basavaraj Hegde", "lf.n.sunil": "Sunil Rao", "lf.n.manju": "Manju Pillai",
      "lf.n.prakash": "Prakash Rao", "lf.n.radhika": "Radhika Menon", "lf.n.arvind": "Arvind Bhatia",

      "lf.g.hodScience": "Head of Science", "lf.g.pgtPhysics": "PGT · Physics", "lf.g.tgtChem": "TGT · Chemistry",
      "lf.g.tgtBio": "TGT · Biology", "lf.g.pgtChem": "PGT · Chemistry", "lf.g.lab": "Laboratory assistant",
      "lf.g.tgtScience": "TGT · Science", "lf.g.hodMaths": "Head of Mathematics", "lf.g.tgtMaths": "TGT · Mathematics",
      "lf.g.hodEnglish": "Head of English", "lf.g.tgtEnglish": "TGT · English", "lf.g.prt": "PRT",
      "lf.g.hodPrimary": "Head of Primary", "lf.g.hodAdmin": "Head of Administration", "lf.g.clerk": "Accounts clerk",
      "lf.g.support": "Transport supervisor", "lf.g.principal": "Principal", "lf.g.director": "Director",

      "lf.role.deptHead": "Head of department", "lf.role.principal": "Principal", "lf.role.director": "Director",
      "lf.role.deptHeadShort": "Head", "lf.role.principalShort": "Principal", "lf.role.directorShort": "Director",

      "lf.rule.one": "Up to 2 days, the head of department decides and that is the end of it.",
      "lf.rule.two": "3 days or more: the head of department first, then the principal.",
      "lf.rule.three": "Longer than 15 days: the head of department, then the principal, then the director signs.",
      "lf.rule.headOwnOne": "A head of department is approved by the principal.",
      "lf.rule.headOwnThree": "Longer than 15 days, the director signs after the principal.",
      "lf.rule.title": "How long decides who signs",
      "lf.rule.r1": "1 – 2 days", "lf.rule.r1w": "Head of department",
      "lf.rule.r2": "3 – 15 days", "lf.rule.r2w": "Head, then principal",
      "lf.rule.r3": "16 days or more", "lf.rule.r3w": "Head, principal, then director",
      "lf.rule.foot": "The director sees every request at every length. He only decides the long ones.",

      "lf.m.1": "Jan", "lf.m.2": "Feb", "lf.m.3": "Mar", "lf.m.4": "Apr",
      "lf.m.5": "May", "lf.m.6": "Jun", "lf.m.7": "Jul", "lf.m.8": "Aug",
      "lf.m.9": "Sep", "lf.m.10": "Oct", "lf.m.11": "Nov", "lf.m.12": "Dec",
      "lf.cel.title": "Birthdays and anniversaries",
      "lf.cel.birthday": "Birthday",
      "lf.cel.years": "{n} years at the school",
      "lf.cel.today": "today",
      "lf.cel.tomorrow": "tomorrow",
      "lf.cel.inDays": "in {n} days",
      "lf.cel.none": "Nothing in the next month.",

      "lf.away.title": "On leave today",
      "lf.away.none": "Everybody is in today.",
      "lf.away.until": "away until {date}",
      "lf.away.backTomorrow": "back tomorrow",

      "lf.tr.title": "Where it stands",
      "lf.tr.applied": "{name} applied",
      "lf.tr.approved": "{name} approved",
      "lf.tr.rejected": "{name} declined",
      "lf.tr.waiting": "With {name}",
      "lf.tr.waitingYou": "With you",
      "lf.tr.later": "Then {name}",
      "lf.tr.neverReached": "Not reached — it was declined before this",
      "lf.tr.settledOk": "Approved in full",
      "lf.tr.settledNo": "Declined",
      "lf.tr.cancelled": "Withdrawn by {name}",
      "lf.tr.waitingDays": "waiting {n} days",
      "lf.tr.waitingDay": "waiting a day",
      "lf.tr.waitingToday": "since today",

      "lf.st.pending": "Waiting", "lf.st.approved": "Approved", "lf.st.rejected": "Declined", "lf.st.cancelled": "Withdrawn",
      "lf.st.withHead": "With the head", "lf.st.withPrincipal": "With the principal", "lf.st.withDirector": "With the director",
      "lf.st.stepOf": "Step {n} of {total}",

      "lf.flag.coverGone": "Cover declined", "lf.flag.retro": "Days already gone",
      "lf.flag.locked": "Closed month", "lf.flag.blackout": "Blocked window",
      "lf.flag.short": "Balance is short", "lf.flag.long": "Long leave",

      "lf.r.surgery": "Surgery and the recovery the hospital has asked for.",
      "lf.r.shantiDay": "Fever since last night; the doctor has asked for a day's rest.",
      "lf.r.devikaFamily": "My sister's wedding in Mysuru — three days, cover arranged with Farah.",
      "lf.r.prakashCourt": "A property hearing in Mysuru I have been summoned to.",
      "lf.r.rahulHospital": "My father's hospital appointment, moved twice already.",
      "lf.r.priyaLong": "Mother's operation in Kochi; I am the only one who can be there for the first fortnight.",
      "lf.r.devikaLong": "Brother's wedding, and the family is travelling together afterwards.",
      "lf.r.karanLong": "A slipped disc. The doctor has written three weeks of bed rest.",
      "lf.r.deepaLong": "Maternity leave beginning; the paperwork is with HR.",
      "lf.r.anjaliSurgery": "Planned surgery in October; the department timetable has been handed over.",
      "lf.r.manjuFamily": "Daughter's wedding and the family visit around it.",
      "lf.r.basavHome": "Extended visit home; asked for the whole of the autumn term break and after.",
      "lf.r.prakashHome": "Family matter at home, settled over three weeks.",
      "lf.r.anjaliFamily": "Family travel in the middle of the June admissions week.",
      "lf.note.anjaliRej": "Admissions week — the department cannot be without its head. Take it after 20 June.",
      "lf.note.basavRej": "Twenty days across the autumn term with no second PRT on that campus. Bring it back with cover named.",

      "lf.days.one": "1 day", "lf.days.n": "{n} days", "lf.days.half": "Half day",

      "lf.col.who": "Who", "lf.col.applied": "Applied", "lf.col.type": "Type", "lf.col.dates": "Dates",
      "lf.col.days": "Days", "lf.col.where": "Where it is", "lf.col.flags": "Watch out for",
      "lf.col.stage": "Sitting with", "lf.col.actions": "Actions",
      "lf.row.open": "Open request {id}",
      "lf.half.first": "first half", "lf.half.second": "second half",
      "lf.reason.title": "What they said",
      "lf.reason.label": "Why they asked",
      "lf.signed.label": "Already signed",
      "lf.asked.label": "What is asked",
      "lf.reason.on": "applied {date}",
      "lf.reason.by": "{name} · applied {date}",
      "lf.fact.cover": "Cover", "lf.fact.coverNone": "No classes to cover",
      "lf.cover.asked": "asked, not answered yet",
      "lf.cover.accepted": "accepted",
      "lf.cover.declined": "declined — another colleague must be named",
      "lf.cover.karanNo": "Karan Mehta is invigilating those three days.",
      "lf.fact.away": "Also away", "lf.fact.awayNone": "Nobody else",
      "lf.fact.why": "Why here",
      "lf.fact.unpaid1": "1 day has no balance behind it",
      "lf.fact.unpaidN": "{n} days have no balance behind them",
      "lf.fact.awayMore": " and {n} more",
      "lf.fact.balance": "Balance", "lf.fact.unpaid": "Unpaid",
      "lf.fact.takes": "Takes out", "lf.fact.month": "Payroll",
      "lf.reason.note": "A reason is read inside the request and nowhere else — not in a list, not on a roster.",
      "lf.empty.head": "Nothing here",
      "lf.empty.body": "Clear a filter to bring the rest of the register back.",
      "lf.pick.head": "Open a request",
      "lf.pick.body": "Choose a row and the whole request opens here — the reason, the chain, and whatever is yours to do about it.",

      "lf.act.title": "Your decision",
      "lf.act.approve": "Approve",
      "lf.act.decline": "Decline",
      "lf.act.noteApprove": "Anything to add? Optional.",
      "lf.act.noteDecline": "Say why. They will read this, word for word.",
      "lf.act.declineNeeds": "A reason is needed before you can decline.",
      "lf.act.confirmApprove": "Yes, approve",
      "lf.act.confirmDecline": "Decline it",
      "lf.act.cancel": "Not now",
      "lf.act.thenGoes": "Approving does not finish it: {name} signs after you.",
      "lf.act.final": "You are the last signature. Approving settles it.",
      "lf.act.watching": "This one is {name}'s to decide. You can see it; you do not sign it.",
      "lf.act.watchingHR": "HR does not decide leave. This screen is the record of who did.",
      "lf.act.settledOk": "Approved by {name} on {date}.",
      "lf.act.settledNo": "Declined by {name} on {date}.",
      "lf.act.settledCan": "Withdrawn on {date}.",
      "lf.act.doneOk": "Approved. {name} has been told.",
      "lf.act.doneOn": "Approved and sent to {next}. {name} has been told.",
      "lf.act.doneNo": "Declined. {name} has been told, with your reason.",
    },
  });

  /* ============================================================
     7 · SHARED PIECES — the same chain drawn the same way on five
     screens, so a head, a principal, a director, HR and the teacher
     are all reading one picture.
     ============================================================ */
  const MONTH_KEY = ["", "lv.mon.1", "lv.mon.2", "lv.mon.3", "lv.mon.4", "lv.mon.5", "lv.mon.6",
                     "lv.mon.7", "lv.mon.8", "lv.mon.9", "lv.mon.10", "lv.mon.11", "lv.mon.12"];
  /* the three-letter form, for the 44px date blocks on the dashboards */
  const MONTH_SHORT = ["", "lf.m.1", "lf.m.2", "lf.m.3", "lf.m.4", "lf.m.5", "lf.m.6",
                       "lf.m.7", "lf.m.8", "lf.m.9", "lf.m.10", "lf.m.11", "lf.m.12"];
  function parseISO(s) { const p = s.split("-"); return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2])); }
  function fmtDate(t, iso) { const d = parseISO(iso); return d.getDate() + " " + t(MONTH_KEY[d.getMonth() + 1]); }
  function fmtDateFull(t, iso) { const d = parseISO(iso); return d.getDate() + " " + t(MONTH_KEY[d.getMonth() + 1]) + " " + d.getFullYear(); }
  function fmtRange(t, from, to) {
    if (from === to) return fmtDate(t, from);
    const a = parseISO(from), b = parseISO(to);
    if (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()) {
      return a.getDate() + " – " + b.getDate() + " " + t(MONTH_KEY[b.getMonth() + 1]);
    }
    return fmtDate(t, from) + " – " + fmtDate(t, to);
  }
  function daysWord(t, n, half) { return half ? t("lf.days.half") : n === 1 ? t("lf.days.one") : t("lf.days.n", { n: num(n) }); }

  const STATUS_ROLE = { pending: "late", approved: "present", rejected: "absent", cancelled: "off" };

  /* where it sits, in three words — a chip every screen can carry */
  function StageChip({ req, you }) {
    const { c } = useTheme();
    const { t } = useLang();
    const st = statusOf(req);
    if (st !== "pending") {
      const role = STATUS_ROLE[st];
      return <Chip bg={c[role + "Tint"]} fg={c[role + "Text"]}>{t("lf.st." + st)}</Chip>;
    }
    const r = waitingRole(req);
    const mine = you && r === you;
    const word = r === "principal" ? t("lf.st.withPrincipal") : r === "director" ? t("lf.st.withDirector") : t("lf.st.withHead");
    return (
      <Chip bg={mine ? c.accentSoft : c.lateTint} fg={mine ? c.accent : c.lateText}>
        <span aria-hidden="true" style={{ display: "flex" }}><Icon name="clock" size={11} /></span>
        <span>{mine ? t("lf.tr.waitingYou") : word}</span>
      </Chip>
    );
  }

  /* the full trail, for a detail panel: applied, then every rung with
     its name, its answer and its date — and the rungs still to come */
  function ChainTrail({ req, you }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const st = statusOf(req);
    const cur = currentStage(req);
    /* the designation under each name — "Radhika Menon" tells a new
       teacher nothing, "Principal" tells her everything */
    const deskOf = (s) => {
      const holder = s.holderId ? personById(s.holderId) : null;
      return holder ? t(holder.desigKey) : t("lf.role." + s.role);
    };
    const withDate = (desk, date) => (date ? desk + " · " + date : desk);
    const rows = [{
      key: "applied", tone: "inkFaint", glyph: "check",
      label: t("lf.tr.applied", { name: t(req.person.nameKey) }),
      when: withDate(t(req.person.desigKey), fmtDateFull(t, req.appliedISO)),
    }];
    let blocked = false;
    req.stages.forEach((s) => {
      const who = s.holderNameKey ? t(s.holderNameKey) : t("lf.role." + s.role);
      if (s.outcome === "approved") {
        rows.push({ key: s.role, tone: "present", glyph: "check", label: t("lf.tr.approved", { name: who }), when: withDate(deskOf(s), fmtDateFull(t, s.onISO)), role: s.role });
      } else if (s.outcome === "rejected") {
        blocked = true;
        rows.push({
          key: s.role, tone: "absent", glyph: "alert", label: t("lf.tr.rejected", { name: who }), when: withDate(deskOf(s), fmtDateFull(t, s.onISO)),
          note: s.note || (s.noteKey ? t(s.noteKey) : null), role: s.role,
        });
      } else if (blocked || st === "cancelled") {
        rows.push({ key: s.role, tone: "inkFaint", glyph: "more", label: who, when: deskOf(s) + " · " + t("lf.tr.neverReached"), role: s.role });
      } else if (cur && cur.role === s.role) {
        const mine = you && s.role === you;
        rows.push({
          key: s.role, tone: mine ? "accent" : "late", glyph: "clock",
          label: mine ? t("lf.tr.waitingYou") : t("lf.tr.waiting", { name: who }),
          when: withDate(deskOf(s), ageOf(req) === 0 ? t("lf.tr.waitingToday") : ageOf(req) === 1 ? t("lf.tr.waitingDay") : t("lf.tr.waitingDays", { n: num(ageOf(req)) })),
          role: s.role, live: true,
        });
      } else {
        rows.push({ key: s.role, tone: "inkFaint", glyph: "more", label: t("lf.tr.later", { name: who }), when: deskOf(s), role: s.role });
      }
    });
    if (st === "cancelled") {
      rows.push({ key: "cancelled", tone: "off", glyph: "alert", label: t("lf.tr.cancelled", { name: t(req.cancelledByKey) }), when: fmtDateFull(t, req.cancelledISO) });
    }

    const toneColor = { present: c.present, absent: c.absent, late: c.late, accent: c.accent, off: c.off, inkFaint: c.inkFaint };
    return (
      <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {rows.map((r, i) => {
          const col = toneColor[r.tone] || c.inkFaint;
          const last = i === rows.length - 1;
          return (
            <li key={r.key} style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "0 0 18px" }}>
                <span style={{
                  width: 18, height: 18, borderRadius: 9, display: "grid", placeItems: "center",
                  background: r.live ? col : "transparent", border: "1.5px solid " + col, color: r.live ? c.onAccent || "#fff" : col,
                }}>
                  <Icon name={r.glyph} size={10} strokeWidth={2.4} />
                </span>
                {!last ? <span style={{ width: 1.5, flex: 1, minHeight: 16, background: c.rule }} /> : null}
              </div>
              <div style={{ paddingBottom: last ? 0 : 12, minWidth: 0, flex: 1 }}>
                <div style={ty("small", { color: r.tone === "inkFaint" ? c.inkMuted : c.ink, fontWeight: r.live || r.tone === "present" || r.tone === "absent" ? 700 : 500 })}>{r.label}</div>
                {r.when ? <div style={ty("caption", { color: c.inkFaint, marginTop: 1 })}>{r.when}</div> : null}
                {r.note ? <div style={ty("caption", { color: c.absentText, marginTop: 3 })}>{r.note}</div> : null}
              </div>
            </li>
          );
        })}
      </ol>
    );
  }

  /* the rule, as a small table — the one explanation every approver
     screen can show without re-wording it */
  function RuleTable({ compact }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const rows = [
      { k: "lf.rule.r1", v: "lf.rule.r1w" },
      { k: "lf.rule.r2", v: "lf.rule.r2w" },
      { k: "lf.rule.r3", v: "lf.rule.r3w" },
    ];
    return (
      <div>
        <div style={{ display: "grid", gap: compact ? 6 : 8 }}>
          {rows.map((r) => (
            <div key={r.k} style={{ display: "flex", gap: 12, alignItems: "baseline", justifyContent: "space-between" }}>
              <span style={G3.fig("xs", { color: c.inkMuted, whiteSpace: "nowrap" })}>{t(r.k)}</span>
              <span style={ty("small", { color: c.ink, fontWeight: 600, textAlign: "right" })}>{t(r.v)}</span>
            </div>
          ))}
        </div>
        <p style={ty("caption", { color: c.inkFaint, margin: "10px 0 0" })}>{t("lf.rule.foot")}</p>
      </div>
    );
  }

  /* the standing flags a request carries, wherever it is read */
  /* `omit` drops the flags a panel already states precisely as a
     fact of its own -- "Balance is short" over "Unpaid · 1 day has no
     balance behind it" is the same sentence twice, and the second one
     is the useful half */
  function FlagChips({ req, omit }) {
    const { c } = useTheme();
    const { t } = useLang();
    const st = statusOf(req);
    const skip = {};
    (omit || []).forEach(function (k) { skip[k] = 1; });
    const out = [];
    const chip = (key, word, role, glyph) => (
      <Chip key={key} bg={c[role + "Tint"]} fg={c[role + "Text"]}>
        <span aria-hidden="true" style={{ display: "flex" }}><Icon name={glyph} size={11} /></span><span>{word}</span>
      </Chip>
    );
    if (st === "pending" && coverState(req) === "declined") !skip.cover && out.push(chip("cover", t("lf.flag.coverGone"), "absent", "staff"));
    if (st === "pending" && req.retro) out.push(chip("retro", t("lf.flag.retro"), "late", "clock"));
    if (st === "pending" && req.lockedMonth) out.push(chip("locked", t("lf.flag.locked"), "off", "lock"));
    if (st === "pending" && req.blackoutKey) out.push(chip("black", t("lf.flag.blackout"), "absent", "lock"));
    if (st === "pending" && req.shortDays) !skip.short && out.push(chip("short", t("lf.flag.short"), "penalty", "payroll"));
    if (req.days > RULES.directorOver) !skip.long && out.push(chip("long", t("lf.flag.long"), "ltEL", "leave"));
    return out.length ? <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>{out}</div> : null;
  }

  function TypeChip({ code, word }) {
    const { c } = useTheme();
    const { t } = useLang();
    const ty2 = typeOf(code);
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
        <Chip bg={c[ty2.role + "Tint"]} fg={c[ty2.role + "Text"]} mono>{code}</Chip>
        {word ? <span>{t(ty2.key)}</span> : null}
      </span>
    );
  }

  /* who applied, in two lines — designation and department, never a
     bare name (a register of names alone is unreadable at a glance) */
  /* "TGT · Mathematics · Mathematics" is what happens when the
     designation already names the department; say it once */
  function subLine(t, person, showCampus) {
    const desig = t(person.desigKey);
    const dept = person.deptKey ? t(DEPTS[person.deptKey]) : "";
    const parts = [desig];
    if (dept && desig.indexOf(dept) === -1) parts.push(dept);
    if (showCampus && person.campusKey) parts.push(t(person.campusKey));
    return parts.join(" · ");
  }

  function PersonLine({ person, showCampus }) {
    const { c } = useTheme();
    const { t, ty, lang } = useLang();
    return (
      <span style={{ display: "block", minWidth: 0 }}>
        <span style={{ display: "block", fontFamily: G3.font.ui, fontSize: 13.5, fontWeight: 700, color: c.ink }}>{t(person.nameKey)}</span>
        <span style={ty("caption", { display: "block", color: c.inkFaint })}>{subLine(t, person, showCampus)}</span>
      </span>
    );
  }

  /* `who={false}` where the panel's own heading is already the
     applicant's name -- a byline that repeats the title says nothing */
  function ReasonBlock({ req, text, who }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    return (
      <div style={{ background: c.sunken, border: "1px solid " + c.rule, borderRadius: G3.r.md, padding: "14px 16px" }}>
        <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 7 })}>{t("lf.reason.label")}</div>
        <p style={ty("body", { color: c.ink, margin: 0, lineHeight: 1.6 })}>{text || t(req.reasonKey)}</p>
        <div style={ty("caption", { color: c.inkFaint, marginTop: 10 })}>
          {who === false
            ? t("lf.reason.on", { date: fmtDate(t, req.appliedISO) })
            : t("lf.reason.by", { name: t(req.person.nameKey), date: fmtDate(t, req.appliedISO) })}
        </div>
      </div>
    );
  }

  /* THE SIGNATURES ALREADY ON THE PAPER, and nothing else.

     The full chain -- who applied, whose desk it is on, who comes
     after -- was six lines under a heading, and every one of its
     facts is somewhere else in the same panel: the byline says who
     applied and when, the chip at the top says whose desk it is on,
     and the line under the buttons says who it goes to next. What
     none of them carries is the name already signed, so that is what
     is left here. */
  function Signatures({ req, dropLast }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const all = (req.stages || []).filter(function (s) {
      return s.outcome === "approved" || s.outcome === "rejected";
    });
    /* the verdict box under a settled request already names the hand
       that settled it, so this list stops one short of it */
    const done = dropLast ? all.slice(0, -1) : all;
    if (!done.length) return null;
    return (
      <div>
        <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 7 })}>{t("lf.signed.label")}</div>
        <div style={{ display: "grid", gap: 6 }}>
        {done.map(function (st) {
          const who = st.holderNameKey ? t(st.holderNameKey) : t("lf.role." + st.role);
          const no = st.outcome === "rejected";
          return (
            <div key={st.role} style={ty("caption", { color: no ? c.absentText : c.inkMuted, fontWeight: no ? 700 : 500 })}>
              {t(no ? "lf.tr.rejected" : "lf.tr.approved", { name: who })}
              {st.onISO ? <span style={{ color: c.inkFaint, fontWeight: 500 }}>{" · " + fmtDate(t, st.onISO)}</span> : null}
            </div>
          );
        })}
        </div>
      </div>
    );
  }

  /* the short facts, as a label/value list — one line each, and a
     line that has nothing to say is not drawn at all */
  /* "1 days" is the kind of thing a reader stops on */
  function unpaidText(t, n) {
    return n === 1 ? t("lf.fact.unpaid1") : t("lf.fact.unpaidN", { n: num(n) });
  }
  /* the clash list, capped — a panel is for the shape of the problem,
     the register is for the whole of it */
  function awayText(t, list) {
    if (!list || !list.length) return null;
    const first = list.slice(0, 2).map((x) => t(x.person.nameKey));
    return list.length > 2 ? first.join(", ") + t("lf.fact.awayMore", { n: num(list.length - 2) }) : first.join(", ");
  }

  function FactRows({ rows }) {
    const { c } = useTheme();
    const { ty } = useLang();
    const live = rows.filter(Boolean);
    if (!live.length) return null;
    return (
      <div>
        {live.map((r, i) => (
          <div
            key={r.k}
            style={{ display: "flex", gap: 18, alignItems: "baseline", flexWrap: "wrap", padding: "12px 0", borderTop: "1px solid " + (i ? c.rule : c.border) }}
          >
            <span style={ty("caption", { color: c.inkFaint, flex: "0 0 124px", fontWeight: 700 })}>{r.k}</span>
            <span style={ty("small", { color: r.tone ? c[r.tone] : c.ink, flex: "1 1 220px", minWidth: 0, fontWeight: r.tone ? 600 : 400, lineHeight: 1.5 })}>{r.v}</span>
          </div>
        ))}
      </div>
    );
  }

  /* ONE request panel for DH-02, PR-03, DR-02, HR-28 and a head's
     own leave.

     THE PERSON IS THE HEADING. "Request LR-0331" is the one thing on
     this panel nobody decides anything by; the name is what the reader
     came for, so it takes the title and the reference goes quietly to
     the corner.

     NO HEADINGS INSIDE. A panel this size holding "Where it stands"
     and "Your decision" over four lines each reads as a form with
     sections; the state chip, the signatures and the buttons say what
     they are. The order is the order a decision is made in: what is
     asked, why, what it costs, who has signed, decide. */
  function RequestPanel({ req, you, facts, decision, width, note, sub, bare }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const L = G3.layout;
    const { Card, EmptyState } = UI;
    const w = width || L.colNarrow;
    if (!req) {
      return (
        <Card style={{ width: w, flex: "0 0 " + w + "px" }}>
          <EmptyState compact head={t("lf.pick.head")} body={t("lf.pick.body")} />
        </Card>
      );
    }
    /* `bare` drops the card shell: inside a side screen the panel IS
       the surface, and a card within it would be a box in a box */
    const Shell = bare
      ? function (props) { return <div>{props.children}</div>; }
      : function (props) {
        return (
          <Card
            icon="document" iconTone="info"
            title={t(req.person.nameKey)}
            sub={sub || subLine(t, req.person, false)}
            action={<span style={ty("caption", { color: c.inkFaint, whiteSpace: "nowrap" })}>{req.id}</span>}
            style={{ width: w, flex: "0 0 " + w + "px" }}
          >
            {props.children}
          </Card>
        );
      };

    return (
      <Shell>
        {/* ROOM (designer). Five blocks 14px apart, each with its own
            internal rhythm, read as one dense slab; the request is the
            thing a reader holds in their head while they decide, so
            every block gets air and the dates lead. */}
        <div style={{ display: "grid", gap: 22 }}>
          {/* ONE ROW OF CHIPS, AND NOT ONE OF THEM REPEATS THE CARD.
              "With you" is what the Approve button under it means, so
              it is drawn only when the request is on somebody ELSE's
              desk, where it is news. "Long leave" is the rung this
              panel is already on -- the director reads nothing but
              long leave -- and the day count three lines down is the
              fact behind it. */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginTop: -2 }}>
            {you && isWaitingOn(req, you) ? null : <StageChip req={req} you={you} />}
            <TypeChip code={req.type} word />
            <FlagChips req={req} omit={["short", "cover", "long"]} />
          </div>

          <div>
            <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 6 })}>{t("lf.asked.label")}</div>
            <div style={G3.fig("lg", { color: c.ink, fontWeight: 700, lineHeight: 1.2 })}>{fmtRange(t, req.from, req.to)}</div>
            <div style={ty("small", { color: c.inkMuted, marginTop: 5 })}>{daysWord(t, req.days, req.half)}</div>
          </div>

          <ReasonBlock req={req} who={false} />

          <FactRows rows={facts || []} />

          <Signatures req={req} dropLast={!!decision && statusOf(req) !== "pending"} />

          {decision ? (
            <div style={{ paddingTop: 18, borderTop: "1px solid " + c.rule }}>
              {decision}
              {note ? <p style={ty("caption", { color: c.inkFaint, margin: "10px 0 0" })}>{note}</p> : null}
            </div>
          ) : null}
        </div>
      </Shell>
    );
  }

  /* the queue, as a register whose WHOLE row opens the request */
  function QueueTable({ title, sub, action, chips, rows, selected, onSelect, you, showCampus, hideWho, emptyHead, emptyBody, stage, actions }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const { Card, CardHeader, EmptyState, ActionMenu } = UI;
    const pad = G3.layout.cardPad;
    const cols = [
      hideWho ? { key: "applied", label: t("lf.col.applied"), width: 132 } : { key: "who", label: t("lf.col.who") },
      { key: "type", label: t("lf.col.type"), width: 74 },
      { key: "dates", label: t("lf.col.dates") },
      { key: "days", label: t("lf.col.days"), width: 72 },
      { key: "flags", label: t("lf.col.flags") },
    ];
    /* HR watches a queue it cannot decide, so it needs the one column
       the deciding roles do not: where the request is sitting */
    if (stage) cols.push({ key: "stage", label: t("lf.col.stage"), width: 150 });
    if (actions) cols.push({ key: "act", label: t("lf.col.actions"), width: 56 });
    return (
      <Card pad={0} style={{ flex: 1, minWidth: 0 }}>
        <div style={{ padding: pad + "px " + pad + "px 0" }}>
          <CardHeader title={title} sub={sub} action={action} />
          {chips ? <div style={{ marginBottom: 14 }}>{chips}</div> : null}
        </div>
        {rows.length === 0 ? (
          <div style={{ padding: "0 " + pad + "px " + pad + "px" }}>
            <EmptyState head={emptyHead || t("lf.empty.head")} body={emptyBody || t("lf.empty.body")} />
          </div>
        ) : (
          <div style={{ padding: "0 " + (pad - 10) + "px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid " + c.ruleStrong }}>
                  {cols.map((col) => (
                    <th key={col.key} scope="col" style={ty("colLabel", { color: c.inkFaint, textAlign: "left", padding: "0 10px 9px", textTransform: "uppercase", whiteSpace: "nowrap", width: col.width })}>{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const on = r.id === selected;
                  const st = statusOf(r);
                  return (
                    <tr
                      key={r.id}
                      tabIndex={0}
                      aria-label={t("lf.row.open", { id: r.id })}
                      aria-current={on ? "true" : undefined}
                      onClick={() => onSelect(r.id)}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(r.id); } }}
                      style={{
                        cursor: "pointer",
                        borderBottom: i < rows.length - 1 ? "1px solid " + c.rule : "none",
                        background: on ? c.sel : st === "cancelled" ? c.alt : "transparent",
                        outlineOffset: -2,
                      }}
                    >
                      {hideWho
                        ? <td style={ty("small", { padding: "11px 10px", verticalAlign: "middle", color: c.inkMuted, whiteSpace: "nowrap" })}>{fmtDate(t, r.appliedISO)}</td>
                        : <td style={{ padding: "11px 10px", verticalAlign: "middle" }}><PersonLine person={r.person} showCampus={showCampus} /></td>}
                      <td style={{ padding: "11px 10px", verticalAlign: "middle" }}><TypeChip code={r.type} /></td>
                      <td style={ty("small", { padding: "11px 10px", verticalAlign: "middle", color: c.ink, whiteSpace: "nowrap" })}>
                        {fmtRange(t, r.from, r.to)}
                        {r.half ? <span style={ty("caption", { display: "block", color: c.inkFaint })}>{t(r.half === "first" ? "lf.half.first" : "lf.half.second")}</span> : null}
                      </td>
                      <td style={G3.fig("sm", { padding: "11px 10px", verticalAlign: "middle", color: c.ink, fontWeight: 600, whiteSpace: "nowrap" })}>{daysWord(t, r.days, r.half)}</td>
                      <td style={{ padding: "11px 10px", verticalAlign: "middle" }}><FlagChips req={r} /></td>
                      {stage ? (
                        <td style={{ padding: "11px 10px", verticalAlign: "middle" }}><StageChip req={r} you={you} /></td>
                      ) : null}
                      {actions ? (
                        <td
                          style={{ padding: "11px 10px", verticalAlign: "middle", textAlign: "right" }}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        >
                          <span style={{ display: "flex", justifyContent: "flex-end" }}>{actions(r)}</span>
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ height: 10 }} />
          </div>
        )}
      </Card>
    );
  }

  /* one decision control, shared by DH-02, PR-03 and DR-02. It
     refuses to answer a rung that is not yours — the store refuses
     too, but a control that cannot be pressed teaches the rule
     better than an error afterwards. */
  /* `blocked` stops the approval outright (a rule this rung does not
     hold). `warn` does not: it is a rule this rung MAY set aside, and
     when it does, `approveNeedsNote` forces the justification onto the
     record — the principal's blackout override is exactly that case. */
  function DecisionBox({ req, you, blocked, warn, approveNeedsNote, approveNoteLabel, approveLabel, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const { Button, Field, Input } = UI;
    const [mode, setMode] = useState(null);
    const [note, setNote] = useState("");
    const st = statusOf(req);
    const cur = currentStage(req);

    if (st !== "pending") {
      const stage = req.stages.filter((s) => s.outcome)[req.stages.filter((s) => s.outcome).length - 1];
      const rejected = st === "rejected";
      const role = STATUS_ROLE[st];
      const line = st === "cancelled"
        ? t("lf.act.settledCan", { date: fmtDateFull(t, req.cancelledISO) })
        : t(rejected ? "lf.act.settledNo" : "lf.act.settledOk", {
            name: stage && stage.holderNameKey ? t(stage.holderNameKey) : "",
            date: stage ? fmtDateFull(t, stage.onISO) : "",
          });
      return (
        <p style={ty("small", { margin: 0, fontWeight: 600, color: c[role + "Text"], background: c[role + "Tint"], borderRadius: G3.r.md, padding: "10px 13px" })}>{line}</p>
      );
    }
    if (!cur || cur.role !== you) {
      const who = cur && cur.holderNameKey ? t(cur.holderNameKey) : "";
      return (
        <p style={ty("small", { margin: 0, color: c.inkMuted, background: c.sunken, borderRadius: G3.r.md, padding: "10px 13px" })}>
          {you === "hr" ? t("lf.act.watchingHR") : t("lf.act.watching", { name: who })}
        </p>
      );
    }

    const next = nextRoleAfter(req, you);
    const nextHolder = next ? holderOf(next, req.person) : null;

    if (mode) {
      const isNo = mode === "decline";
      const empty = (isNo || approveNeedsNote) && !note.trim();
      return (
        <div style={{ background: c.raised, border: "1px solid " + c.border, borderRadius: G3.r.lg, padding: 14 }}>
          <Field id={"lf-note-" + req.id} label={isNo ? t("lf.act.noteDecline") : approveNeedsNote ? approveNoteLabel : t("lf.act.noteApprove")} error={empty && note.length > 0 ? t("lf.act.declineNeeds") : undefined}>
            <Input id={"lf-note-" + req.id} value={note} onChange={setNote} placeholder="" />
          </Field>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button
              kind="primary"
              disabled={empty}
              onClick={() => {
                if (empty) return;
                decide(req.id, you, isNo ? "rejected" : "approved", note.trim());
                setMode(null); setNote("");
                if (onDone) {
                  onDone(isNo ? "rejected" : "approved", isNo
                    ? t("lf.act.doneNo", { name: t(req.person.nameKey) })
                    : next
                      ? t("lf.act.doneOn", { next: nextHolder ? t(nextHolder.nameKey) : t("lf.role." + next), name: t(req.person.nameKey) })
                      : t("lf.act.doneOk", { name: t(req.person.nameKey) }));
                }
              }}
            >
              {isNo ? t("lf.act.confirmDecline") : approveLabel || t("lf.act.confirmApprove")}
            </Button>
            <Button kind="ghost" onClick={() => { setMode(null); setNote(""); }}>{t("lf.act.cancel")}</Button>
          </div>
          {empty ? <p style={ty("caption", { color: c.inkFaint, margin: "8px 0 0" })}>{t("lf.act.declineNeeds")}</p> : null}
        </div>
      );
    }

    return (
      <div>
        {blocked ? (
          <p role="alert" style={ty("small", { color: c.absentText, background: c.absentTint, borderRadius: G3.r.md, padding: "9px 12px", fontWeight: 600, margin: "0 0 10px" })}>{blocked}</p>
        ) : null}
        {!blocked && warn ? (
          <p role="status" style={ty("small", { color: c.ink, background: c.brassSoft, border: "1px solid " + c.brassBorder, borderRadius: G3.r.md, padding: "9px 12px", margin: "0 0 10px" })}>{warn}</p>
        ) : null}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
          {/* the same height as every other primary on the canvas —
              DH-02, PR-03 and DR-02 all draw this one control */}
          <Button kind="primary" iconLeft="check" onClick={() => setMode("approve")} disabled={!!blocked}>{approveLabel || t("lf.act.approve")}</Button>
          <Button kind="secondary" onClick={() => setMode("decline")}>{t("lf.act.decline")}</Button>
        </div>
        <p style={ty("caption", { color: c.inkMuted, margin: 0 })}>
          {next ? t("lf.act.thenGoes", { name: nextHolder ? t(nextHolder.nameKey) : t("lf.role." + next) }) : t("lf.act.final")}
        </p>
      </div>
    );
  }

  /* ============================================================
     export
     ============================================================ */
  window.LeaveFlow = {
    TODAY_ISO, LADDER, RULES, DEPTS, PEOPLE, TYPES,
    stageRolesFor, ruleKeyFor, ruleKeyForApplicant, personById, headOfDept, holderOf, typeOf,
    PRINCIPAL, DIRECTOR,
    useRequests, decide, withdraw, submit, byId, forPerson,
    celebrations, CelebrationsCard, awayOn, AwayTodayCard, inDept, all: function () { return REQUESTS; },
    statusOf, currentStage, waitingRole, isWaitingOn, decidedStage, hasSeen, progressOf, nextRoleAfter, ageOf,
    fmtDate, fmtDateFull, fmtRange, daysWord, parseISO, STATUS_ROLE, coverState, coverLine,
    StageChip, ChainTrail, RuleTable, FlagChips, TypeChip, DecisionBox,
    PersonLine, ReasonBlock, FactRows, RequestPanel, QueueTable, subLine, unpaidText, awayText,
  };
})();
