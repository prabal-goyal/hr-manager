/* @jsxRuntime classic */
/* ============================================================
   Naveya — one person, one set of facts · window.NaveyaPerson

   WHY THIS FILE EXISTS. Ananya Rao is on two screens at once: HR-03,
   where the office reads her record, and EMP-09 (Profile), where she
   reads it herself. Until 2026-09-25 each screen carried its own copy
   of her facts and they had already drifted — HR held
   `ananya.rao@example.edu`, her own profile showed `…@example.com`,
   and her salary account was masked two different ways. That is the
   worst class of bug a record product can have: the employee and the
   office looking at the same field and seeing different things, with
   no way for either to know which is real.

   THE RULE (designer, 2026-09-25): "the same info should be seen by
   the employee which is on HR — nothing should be ghost info." So the
   FACTS live here, once. The two screens differ in what they may DO
   with them (HR edits; she reads and asks), never in what they say.

   SHAPE. Values that are language-independent (numbers, dates, masked
   strings) are literals. Anything a reader reads as words is a STRING
   KEY in the `per.*` namespace, translated in both languages here, so
   a correction lands in one place and reaches both screens.

   MASKING. The masked form is the DEFAULT and the full form is the
   exception, exactly as on the screens: `full: null` means the value
   has no revealable form for anybody (Aadhaar), not that it is
   missing. This file never holds a value the product would not show.
   ============================================================ */
(function () {
  const UI = window.UI3;
  const { addStrings } = UI;

  const P = {
    /* ---- who she is ------------------------------------------- */
    code: "NAV-0142",
    nameKey: "per.name",
    desigKey: "per.desig",
    genderKey: "per.gender",
    statusKey: "per.status",
    campusKey: "per.campus",
    deptKey: "per.dept",

    /* ---- how to reach her (PII: masked by default) ------------- */
    contact: {
      dob: "1986-03-09",
      dobMasked: "XX XXX 1986",
      phone: { masked: "+91 XXXXX X4210", full: "+91 90000 04210" },
      address: { maskedKey: "per.addressMasked", fullKey: "per.address" },
      kin: { masked: "+91 XXXXX X4211", full: "+91 90000 04211", nameKey: "per.kinName" },
      email: "ananya.rao@example.edu",
    },

    /* ---- the numbers filed in her name ------------------------- */
    ids: {
      pan: { masked: "XXXXXX000A", full: "AAAPA0000A", changedBy: "per.who.rajan", changedOn: "2024-04-14" },
      aadhaar: { masked: "XXXX XXXX 0000", full: null, changedBy: "per.who.rajan", changedOn: "2024-04-14" },
      uan: { masked: "XXXX XXXX 0042", full: "1000 0000 0042", changedBy: "per.who.meera", changedOn: "2024-05-02" },
      esic: { masked: "XXXXXX0042", full: "1000000042", changedBy: "per.who.meera", changedOn: "2024-05-02" },
      bank: { masked: "HDFC 0000 6841", full: "0000 0000 6841", ifsc: "HDFC0000042", changedBy: "per.who.meera", changedOn: "2026-07-28" },
    },

    /* ---- the contract in force --------------------------------- */
    contract: {
      categoryKey: "per.c.category",
      kindKey: "per.c.kind",
      minQualKey: "per.c.minQual",
      typeKey: "per.c.type",
      vacationStaff: true,
      doj: "2024-04-12",
      confirmed: "2025-04-12",
      end: null,
      noticeDays: 60,
      inForceFrom: "2025-04-12",
    },

    /* ---- the job behind the designation ------------------------ */
    role: {
      subjectsKey: "per.r.subjects",
      whereKey: "per.r.where",
      reportsToKey: "per.r.reportsTo",
      alsoKey: "per.r.also",
      alsoNoteKey: "per.r.alsoNote",
      canSignIn: true,
    },

    /* ---- how she came in --------------------------------------- */
    onboarding: [
      { key: "per.onb.offer", d: "2024-03-02" },
      { key: "per.onb.join", d: "2024-04-12" },
      { key: "per.onb.induct", d: "2024-04-19" },
      { key: "per.onb.account", d: "2024-04-15" },
      { key: "per.onb.confirm", d: "2025-04-12" },
    ],
    onboardedByKey: "per.who.meera",

    /* ---- pay: what the RECORD holds. The month's run is payroll's
            and is never restated here. ------------------------------ */
    pay: {
      groupKey: "per.pay.group",
      cycleKey: "per.pay.cycle",
      grossMonthly: 94800,
      accountMasked: "HDFC 0000 6841",
      lastCreditedKey: "per.pay.last",
      contractFrom: "2025-04-12",
    },

    /* ---- continuous service ------------------------------------ */
    service: { doj: "2024-04-12", gratuityYears: 5, breaks: 0 },
  };

  addStrings({
    en: {
      "per.name": "Ananya Rao",
      "per.desig": "Post Graduate Teacher, Physics",
      "per.gender": "Female",
      "per.status": "Working",
      "per.campus": "Indiranagar",
      "per.dept": "Science",
      "per.address": "Flat 4B, Anjali Residency, 5th Main, Indiranagar, Bengaluru 560038",
      "per.addressMasked": "XXXX, Indiranagar, Bengaluru 560038",
      "per.kinName": "Vikram Rao, husband",
      "per.who.meera": "Meera Iyer, HR",
      "per.who.rajan": "Rajan Pillai, HR",
      "per.c.category": "Post Graduate Teacher",
      "per.c.kind": "Teaching",
      "per.c.minQual": "Post-graduate degree, B.Ed., and a teacher-eligibility certificate",
      "per.c.type": "Permanent",
      "per.r.subjects": "Physics, classes 11 and 12",
      "per.r.where": "Science, Indiranagar",
      "per.r.reportsTo": "Anjali Deshpande, Head of Science",
      "per.r.also": "Class teacher, 12-B",
      "per.r.alsoNote": "Since April 2025. Ends with the academic year.",
      "per.onb.offer": "Offer accepted",
      "per.onb.join": "Joined and joining documents collected",
      "per.onb.induct": "Induction week completed",
      "per.onb.account": "Account invited and first signed in",
      "per.onb.confirm": "Probation confirmed",
      "per.pay.group": "Teaching staff, monthly",
      "per.pay.cycle": "1st to the last day, credited on the 2nd",
      "per.pay.last": "July 2026, on 2 Aug 2026",
    },
  });

  /* ============================================================
     THE NON-TEACHING SIGN-INS.

     Only what genuinely differs is listed. Everything else — the
     masking rules, the onboarding shape, the pay cycle, the contract
     machinery — is the teacher's and is shared, because it is the
     same product for both.

     Note what is NOT here: no subjects, no class-teacher duty, and
     `vacationStaff: false`, which is the one fact that changes how
     leave actually works for them (an administrator accrues earned
     leave; a teacher whose holidays ARE the school vacation does
     not). That is a rule, not decoration, so it travels with the
     person rather than being written into a screen.
     ============================================================ */
  const ADMINS = {
    hr: {
      code: "NAV-0104", nameKey: "per.a.hr.name", desigKey: "per.a.hr.desig",
      deptKey: "per.a.dept.office", email: "meera.nair@sunrise.edu",
      categoryKey: "per.a.hr.cat", minQualKey: "per.a.hr.qual",
      reportsToKey: "per.a.hr.reports", doesKey: "per.a.hr.does",
      payGroupKey: "per.a.pay.admin",
    },
    groupAdmin: {
      code: "NAV-0002", nameKey: "per.a.ga.name", desigKey: "per.a.ga.desig",
      deptKey: "per.a.dept.trust", email: "devansh.kulkarni@sunrise.edu",
      categoryKey: "per.a.ga.cat", minQualKey: "per.a.ga.qual",
      reportsToKey: "per.a.ga.reports", doesKey: "per.a.ga.does",
      payGroupKey: "per.a.pay.admin", campusKey: "per.a.campus.trust",
    },
    payrollOfficer: {
      code: "NAV-0031", nameKey: "per.a.py.name", desigKey: "per.a.py.desig",
      deptKey: "per.a.dept.office", email: "sunita.kulkarni@sunrise.edu",
      categoryKey: "per.a.py.cat", minQualKey: "per.a.py.qual",
      reportsToKey: "per.a.py.reports", doesKey: "per.a.py.does",
      payGroupKey: "per.a.pay.admin",
    },
    accountant: {
      code: "NAV-0055", nameKey: "per.a.ac.name", desigKey: "per.a.ac.desig",
      deptKey: "per.a.dept.office", email: "k.sharma@sunrise.edu",
      categoryKey: "per.a.ac.cat", minQualKey: "per.a.ac.qual",
      reportsToKey: "per.a.ac.reports", doesKey: "per.a.ac.does",
      payGroupKey: "per.a.pay.admin",
    },
  };

  function forRole(role) {
    const a = ADMINS[role];
    if (!a) return P;                       /* the roles that teach */
    return Object.assign({}, P, {
      code: a.code,
      nameKey: a.nameKey,
      desigKey: a.desigKey,
      deptKey: a.deptKey,
      campusKey: a.campusKey || P.campusKey,
      nonTeaching: true,
      contact: Object.assign({}, P.contact, { email: a.email }),
      contract: Object.assign({}, P.contract, {
        categoryKey: a.categoryKey,
        kindKey: "per.a.kind",
        minQualKey: a.minQualKey,
        vacationStaff: false,
      }),
      role: Object.assign({}, P.role, {
        subjectsKey: a.doesKey,
        whereKey: a.deptKey,
        reportsToKey: a.reportsToKey,
        alsoKey: null,
        alsoNoteKey: null,
      }),
      pay: Object.assign({}, P.pay, { groupKey: a.payGroupKey }),
    });
  }

  addStrings({
    en: {
      "per.a.kind": "Non-teaching",
      "per.a.dept.office": "School office",
      "per.a.dept.trust": "Trust office",
      "per.a.campus.trust": "Both campuses",
      "per.a.pay.admin": "Non-teaching staff, monthly",
      "per.a.doesLabel": "What the job is",

      "per.a.hr.name": "Meera Nair",
      "per.a.hr.desig": "HR Operator",
      "per.a.hr.cat": "Non-teaching \u2014 Administration",
      "per.a.hr.qual": "Graduate degree; a diploma in human resources is preferred",
      "per.a.hr.reports": "Rajan Pillai, Head of HR",
      "per.a.hr.does": "The staff register, documents and the leave desk, Indiranagar",

      "per.a.ga.name": "Devansh Kulkarni",
      "per.a.ga.desig": "Group Admin",
      "per.a.ga.cat": "Non-teaching \u2014 Trust office",
      "per.a.ga.qual": "Graduate degree and five years in school administration",
      "per.a.ga.reports": "Arvind Bhatia, Director",
      "per.a.ga.does": "Who can sign in, what they reach, and the systems behind it",

      "per.a.py.name": "Sunita Kulkarni",
      "per.a.py.desig": "Payroll Officer",
      "per.a.py.cat": "Non-teaching \u2014 Administration",
      "per.a.py.qual": "Graduate degree in commerce; payroll certification preferred",
      "per.a.py.reports": "K. Sharma, Accountant",
      "per.a.py.does": "The monthly run, statutory filings and the paid-days register",

      "per.a.ac.name": "K. Sharma",
      "per.a.ac.desig": "Accountant",
      "per.a.ac.cat": "Non-teaching \u2014 Administration",
      "per.a.ac.qual": "Chartered Accountant or an equivalent qualification",
      "per.a.ac.reports": "Arvind Bhatia, Director",
      "per.a.ac.does": "The books, the payment gate and the trust\u2019s liability",
    },
  });

  window.NaveyaPerson = P;
  window.NaveyaPersonFor = forRole;
})();
