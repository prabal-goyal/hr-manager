/* @jsxRuntime classic */
/* ============================================================
   Naveya — exits · window.NaveyaExits

   THE FIFTH CHANNEL between HR and payroll, and the one that was
   missing. pay-handoff.jsx carries a joiner's first salary, an agreed
   rise and a reinstatement; pay-requests.jsx carries claims, overtime
   and loans. Neither carries an EXIT — and an exit is the one HR act
   that payroll cannot find out about any other way.

   WHAT WAS BROKEN. HR-03 records a last working day and a reason, and
   wrote both into one component's own state. PY-16's settlement desk
   read a seed of its own. So a school could put somebody's exit on
   record in HR and payroll's Full & Final list would never hear of it
   — the leaver would be paid a full month, and nobody would know why
   until the bank file was already out.

   WHAT THIS IS. A last working day, a reason and who recorded it.
   Nothing else: the money is payroll's to compute, the service is read
   from the date of joining, and the blockers are payroll's own checks.
   An exit arrives on the settlement desk as NOT STARTED, which is
   true — HR has told payroll it is coming, and nobody has prepared it.

   WHAT IT WILL NOT DO. It does not carry a net, a gratuity or an
   encashment figure, because HR does not compute those and a figure
   from the wrong desk is worse than no figure. It does not let the
   same person be exited twice: the second recording REPLACES the
   first rather than queueing a second settlement, and it says so.
   ============================================================ */
(function () {
  const subs = [];
  /* starts empty on purpose. The settlement desk's own seed is the
     school's history; this is only what HR has recorded SINCE, so at
     rest the two desks agree exactly as they did before. */
  const ROWS = [];

  function notify() {
    subs.slice().forEach(function (f) { f(); });
  }

  const API = {
    rows: function () { return ROWS.slice(); },

    byStaff: function (code) {
      return ROWS.filter(function (r) { return r.staff === code; })[0] || null;
    },

    /* HR records an exit. `lwdIso` and `reasonKey` are HR's; the rest
       identifies the person well enough for payroll to open a
       settlement against them. A second recording for the same person
       replaces the first — one person has one exit. */
    record: function (x) {
      const i = ROWS.findIndex(function (r) { return r.staff === x.staff; });
      /* the settlement desk renders a leaver through the string table,
         as it does every other name on it. HR holds a plain name, so it
         is minted into the table under a key of this row's own — both
         scripts get what HR holds, because HR holds one spelling. */
      const nameKey = "nx.name." + x.staff;
      if (x.name && window.UI3 && window.UI3.addStrings) {
        const one = {};
        one[nameKey] = x.name;
        window.UI3.addStrings({ en: one, hi: one });
      }
      const row = {
        id: null,                      /* payroll numbers it when it starts */
        staff: x.staff,
        personKey: nameKey,
        name: x.name || null,
        desig: x.desig || null,
        groupKey: x.groupKey || null,
        campusKey: x.campusKey || null,
        lwdIso: x.lwdIso,
        reasonKey: x.reasonKey || null,
        joinedIso: x.joinedIso || null,
        noticeContract: x.noticeContract == null ? null : x.noticeContract,
        recordedByKey: x.recordedByKey || "ph.who.meera",
        recordedIso: x.recordedIso || "2026-10-11",
        state: "notStarted",
        fromHR: true,
        replaced: i >= 0,
      };
      if (i >= 0) ROWS[i] = row; else ROWS.push(row);
      notify();
      return row;
    },

    /* payroll withdrawing an exit HR has since cancelled */
    drop: function (code) {
      const i = ROWS.findIndex(function (r) { return r.staff === code; });
      if (i < 0) return false;
      ROWS.splice(i, 1);
      notify();
      return true;
    },

    subscribe: function (f) {
      subs.push(f);
      return function () {
        const i = subs.indexOf(f);
        if (i >= 0) subs.splice(i, 1);
      };
    },
  };

  /* the hook every screen on either side of the channel uses, so a
     recording on the HR screen reaches the settlement desk without
     either of them knowing about the other */
  API.useExits = function () {
    const [, bump] = React.useState(0);
    React.useEffect(function () {
      return API.subscribe(function () { bump(function (n) { return n + 1; }); });
    }, []);
    return API;
  };

  window.NaveyaExits = API;
})();
