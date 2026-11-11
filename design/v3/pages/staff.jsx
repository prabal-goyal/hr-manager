/* @jsxRuntime classic */
/* ============================================================
   Naveya — Staff · window.Pages3.Staff
   PR-05 (a principal's campus) · DR-05 (a director's group)

   THE QUESTION: "who works here, what do they do, and are they
   still on the roll?"

   ONE SCREEN, TWO SCOPES. A principal runs one campus and sees that
   campus. A director runs the group and sees both, with the campus
   named on every row and a filter over it. Nothing else differs: the
   same columns, the same words, the same register.

   A LIST, NOT A FILE (designer). Name, what they do, where they do
   it, how they are employed and whether they are still on the roll —
   and nothing else. No salary, no bank, no PAN or UAN or Aadhaar, no
   phone, no email, no date of birth, no documents, no leave balance,
   and no row that opens. The staff FILE, with the identifiers and the
   edit rights, is HR's screen (HR-02) and stays HR's screen; §8-F14
   and the DPDP rule behind it are not softened by seniority.

   WHERE THE ROWS COME FROM. window.NaveyaStaff — the same register
   HR-02 draws, exported from pages/hr.jsx rather than copied here, so
   a name, a designation or a resignation cannot read one way on HR's
   screen and another way on the principal's.
   ============================================================ */
(function () {
  const G3 = window.G3;
  const UI = window.UI3;
  const { useState } = React;
  const {
    useTheme, ThemeToggle, useLang, addStrings,
    Rail, Motif, Card, Register, Select, Input, Avatar, StatusMark, EmptyState, num,
  } = UI;

  const SRC = window.NaveyaStaff;

  /* a principal is one campus. The director is both, and only the
     director gets the campus filter. */
  const MY_CAMPUS = "indiranagar";

  addStrings({
    en: {
      "st2.crumb": "Staff",
      "st2.title": "Staff",
      "st2.subCampus": "{n} people on this campus",
      "st2.subGroup": "{n} people across both campuses",
      "st2.shown": "{n} of {all}",

      "st2.searchPh": "Search by name or staff ID",
      "st2.searchAria": "Search the staff list",
      "st2.f.campusAll": "Both campuses",
      "st2.f.roll": "On the roll",
      "st2.f.notice": "On notice",
      "st2.f.exited": "Exited",
      "st2.f.everyone": "Everyone",
      "st2.f.statusAria": "Filter by status",
      "st2.f.catAria": "Filter by staff category",
      "st2.f.campusAria": "Filter by campus",

      "st2.noHit": "Nobody matches that",
      "st2.noHitBody": "Clear the search, or widen the filters above.",
      "st2.col.role": "Role",
      "st2.aria": "The staff list",
      "st2.foot": "Names, roles and where somebody works. Salary, documents, contact details and statutory identifiers are on the person's own record, which HR holds.",
    },
  });

  /* the roll's four states, in the register's own words */
  const ST_ROLE = { active: "present", notice: "late", noLogin: "missing", exited: "off" };

  const CATS = ["all", "teaching", "non_teaching", "support", "guest"];
  const STATES = ["roll", "notice", "exited", "everyone"];

  function matchesState(x, key) {
    if (key === "roll") return x.status !== "exited";
    if (key === "notice") return x.status === "notice";
    if (key === "exited") return x.status === "exited";
    return true;
  }

  function PersonCell({ x }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 11, minWidth: 0 }}>
        <Avatar name={x.name} size={34} />
        <span style={{ minWidth: 0 }}>
          <span style={ty("small", { color: c.ink, fontWeight: 700, display: "block" })}>{x.name}</span>
          {/* the staff ID is how HR, payroll and the register all refer
              to one person; it is an identifier, not a personal detail */}
          <span style={G3.fig("micro", { color: c.inkFaint, display: "block", marginTop: 1 })}>{x.code}</span>
        </span>
      </span>
    );
  }

  function Staff({ role, onNavigate }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const L = G3.layout;
    const r = role || "principal";
    const group = r === "director";

    const [search, setSearch] = useState("");
    const [cat, setCat] = useState("all");
    const [state, setState] = useState("roll");
    const [campus, setCampus] = useState("all");

    const all = (SRC && SRC.LIST ? SRC.LIST : [])
      .filter(function (x) { return group || x.campus === MY_CAMPUS; })
      .slice()
      .sort(function (a, b) { return a.name.localeCompare(b.name); });

    const q = search.trim().toLowerCase();
    const shown = all.filter(function (x) {
      if (cat !== "all" && x.cat !== cat) return false;
      if (group && campus !== "all" && x.campus !== campus) return false;
      if (!matchesState(x, state)) return false;
      if (!q) return true;
      return x.name.toLowerCase().indexOf(q) !== -1 || x.code.toLowerCase().indexOf(q) !== -1;
    });

    const columns = [
      { key: "who", label: t("hr3.st.col.name") },
      { key: "role", label: t("st2.col.role") },
      { key: "dept", label: t("hr3.st.col.dept") },
    ]
      .concat(group ? [{ key: "campus", label: t("hr3.st.col.campus") }] : [])
      .concat([
        { key: "emp", label: t("hr3.st.col.employment") },
        { key: "status", label: t("hr3.st.col.status") },
      ]);

    const rows = shown.map(function (x) {
      return {
        id: x.id,
        tone: x.status === "exited" ? "dim" : undefined,
        cells: {
          who: <PersonCell x={x} />,
          role: x.desig,
          dept: x.dept,
          campus: t("hr3.campus." + x.campus),
          emp: t("hr3.emp." + x.emp),
          status: <StatusMark role={ST_ROLE[x.status] || "off"} word={t("hr3.st.status." + x.status)} />,
        },
      };
    });

    /* the controls sit in the register's own chip row, so the table
       and the things that narrow it are one object */
    const chips = (
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ width: 232 }}>
          <Input
            id="st2-search" value={search} onChange={setSearch}
            placeholder={t("st2.searchPh")} ariaLabel={t("st2.searchAria")}
          />
        </span>
        <span style={{ width: 168 }}>
          <Select
            id="st2-cat" value={cat} onChange={setCat} ariaLabel={t("st2.f.catAria")}
            options={CATS.map(function (k) {
              return { value: k, label: k === "all" ? t("hr3.st.filter.categoryAll") : t("hr3.cat." + k) };
            })}
          />
        </span>
        {group ? (
          <span style={{ width: 168 }}>
            <Select
              id="st2-campus" value={campus} onChange={setCampus} ariaLabel={t("st2.f.campusAria")}
              options={[{ value: "all", label: t("st2.f.campusAll") }].concat(
                ["indiranagar", "whitefield"].map(function (k) {
                  return { value: k, label: t("hr3.campus." + k) };
                })
              )}
            />
          </span>
        ) : null}
        <span style={{ width: 168 }}>
          <Select
            id="st2-state" value={state} onChange={setState} ariaLabel={t("st2.f.statusAria")}
            options={STATES.map(function (k) { return { value: k, label: t("st2.f." + k) }; })}
          />
        </span>
      </div>
    );

    return (
      <div className="nv3" style={{ display: "flex", minHeight: "100vh", background: c.page, color: c.ink, fontFamily: G3.font.ui }}>
        <Rail role={r} active="staff" onNavigate={onNavigate} />
        <main style={{ flex: 1, minWidth: 0, position: "relative", overflowX: "clip" }}>
          <Motif />
          <div style={{ position: "relative", zIndex: 1, maxWidth: L.contentMax, margin: "0 auto", padding: "22px " + L.contentPadX + "px 56px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, marginBottom: 16 }}>
              <div style={ty("small", { color: c.inkMuted })}>
                <span style={{ color: c.ink, fontWeight: 700 }}>{t("st2.crumb")}</span>
                <span style={{ margin: "0 8px", color: c.inkFaint }}>·</span>
                <span>{t(group ? "lf.trust" : "home.school")}</span>
              </div>
              <ThemeToggle />
            </div>

            <div style={{ marginBottom: 20 }}>
              <h1 style={ty("display", { margin: 0, color: c.ink })}>{t("st2.title")}</h1>
              <p style={ty("body", { margin: "7px 0 0", color: c.inkMuted })}>
                {t(group ? "st2.subGroup" : "st2.subCampus", { n: num(all.length) })}
              </p>
            </div>

            {!shown.length ? (
              <Card>
                {chips}
                <div style={{ marginTop: 10 }}>
                  <EmptyState compact head={t("st2.noHit")} body={t("st2.noHitBody")} />
                </div>
              </Card>
            ) : (
              <Register
                title={t("st2.f." + state)}
                sub={t("st2.shown", { n: num(shown.length), all: num(all.length) })}
                chips={chips}
                columns={columns}
                rows={rows}
                footer={<span style={ty("caption", { color: c.inkFaint })}>{t("st2.foot")}</span>}
              />
            )}
          </div>
        </main>
      </div>
    );
  }

  window.Pages3 = window.Pages3 || {};
  window.Pages3.Staff = Staff;
})();
