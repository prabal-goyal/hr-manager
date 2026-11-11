/* @jsxRuntime classic */
/* ============================================================
   Naveya — the year's holidays, once · window.NaveyaHolidays

   WHY THIS FILE EXISTS. A holiday is read by nearly every screen in
   the product: the paid-days grid colours it, the roster skips it,
   the leave blackout respects it, the attendance job does not mark
   anybody absent on it, and the employee's own calendar shows it.
   Until now each of those carried its own "15 August".

   The Group Admin sets the year here; everybody else READS it. That
   is the whole contract — there is no second place a holiday can be
   declared, so there is no way for two screens to disagree about
   whether the school was open.

   THREE KINDS, because an Indian school genuinely has three:
     closed     — a paid day nobody works, school shut
     restricted — the office is open; a person may take a fixed
                   number from a published list (RH)
     campus     — one campus only (a local festival, a civic day)
   ============================================================ */
(function () {
  const UI = window.UI3;
  const { addStrings } = UI;

  const HOLIDAYS = [
    { id: "H-01", iso: "2026-04-14", nameKey: "hol.ambedkar", kind: "closed", campuses: null },
    { id: "H-02", iso: "2026-08-15", nameKey: "hol.independence", kind: "closed", campuses: null },
    { id: "H-03", iso: "2026-08-28", nameKey: "hol.onam", kind: "restricted", campuses: null },
    { id: "H-04", iso: "2026-10-02", nameKey: "hol.gandhi", kind: "closed", campuses: null },
    { id: "H-05", iso: "2026-10-20", nameKey: "hol.ayudha", kind: "campus", campuses: ["indiranagar", "whitefield", "yelahanka"] },
    { id: "H-06", iso: "2026-11-08", nameKey: "hol.diwali", kind: "closed", campuses: null },
    { id: "H-07", iso: "2026-11-09", nameKey: "hol.diwali2", kind: "closed", campuses: null },
    { id: "H-08", iso: "2026-12-25", nameKey: "hol.christmas", kind: "closed", campuses: null },
    { id: "H-09", iso: "2027-01-14", nameKey: "hol.sankranti", kind: "closed", campuses: null },
    { id: "H-10", iso: "2027-01-26", nameKey: "hol.republic", kind: "closed", campuses: null },
    { id: "H-11", iso: "2027-03-02", nameKey: "hol.holi", kind: "restricted", campuses: null },
    { id: "H-12", iso: "2027-03-19", nameKey: "hol.ugadi", kind: "campus", campuses: ["hyderabad"] },
  ];

  /* how many restricted holidays one person may take in a year. A
     number the school sets, not a constant the code assumes. */
  const RESTRICTED_ALLOWANCE = 2;

  addStrings({
    en: {
      "hol.ambedkar": "Dr Ambedkar Jayanti",
      "hol.independence": "Independence Day",
      "hol.onam": "Onam",
      "hol.gandhi": "Gandhi Jayanti",
      "hol.ayudha": "Ayudha Puja",
      "hol.diwali": "Deepavali",
      "hol.diwali2": "Deepavali — second day",
      "hol.christmas": "Christmas Day",
      "hol.sankranti": "Makara Sankranti",
      "hol.republic": "Republic Day",
      "hol.holi": "Holi",
      "hol.ugadi": "Ugadi",
      "hol.kind.closed": "School closed",
      "hol.kind.restricted": "Restricted holiday",
      "hol.kind.campus": "One campus only",
      "hol.kind.closed.note": "A paid day. Nobody works and nobody applies for it.",
      "hol.kind.restricted.note": "The school is open. A person may take {n} of these in the year, and applies for them like leave.",
      "hol.kind.campus.note": "Only the campuses named are closed. Everywhere else works normally.",
    },
  });

  window.NaveyaHolidays = {
    all: HOLIDAYS,
    restrictedAllowance: RESTRICTED_ALLOWANCE,
    /* the year a holiday falls in, for the academic session Apr-Mar */
    forCampus: function (key) {
      return HOLIDAYS.filter(function (h) {
        return h.kind !== "campus" || (h.campuses && h.campuses.indexOf(key) !== -1);
      });
    },
  };
})();
