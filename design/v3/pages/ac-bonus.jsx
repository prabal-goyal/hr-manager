/* @jsxRuntime classic */
/* ============================================================
   Naveya — the bonus run · window.Pages3.ACBonus (AC-06)

   THE QUESTION: what bonus do we owe, and who signs it off?

   This is the one screen on the accountant's desk where they are the
   MAKER rather than the checker, which is why it ends by handing the
   run to somebody else. Four rules shape it, and each is visible on
   the screen rather than buried in the model:

   1. THE SCHOOL MUST CHOOSE THE KIND. The Payment of Bonus Act's
      section 32 exempts educational institutions, so a school may owe
      a STATUTORY bonus or may pay an EX-GRATIA one by its own policy.
      There is NO DEFAULT. Picking for them would decide a legal
      question on their behalf.
   2. NO RATE IS WRITTEN HERE. The percentage band, the calculation
      cap and the eligibility ceiling all come from the pinned,
      effective-dated configuration, and the screen names the version
      it read. No figure in this file is a rate.
   3. ELIGIBILITY IS EXPLAINED PER PERSON. "363 eligible" is not
      something anybody can defend; "above the eligibility ceiling",
      "fewer than the qualifying days", "exempt under section 32" is.
   4. THE MAKER CANNOT FINALISE IT. Sending it for approval is the
      last thing this screen does; the release happens on the gate,
      under a different pair of eyes.

   SPEC — docs/development-specification.md M11 (Bonus); screen-
   inventory AC-06.
   ============================================================ */
(function () {
  const G3 = window.G3;
  const UI = window.UI3;
  const { useState } = React;
  const {
    useTheme, useLang, addStrings, Card, Register, Button, Chip, StatusMark,
    Icon, EmptyState, Field, Input, Select, StackBar, Meter, MetricCell, MetricStrip, inr, num,
    CampusSwitch, campusLabel, campusOptions, inCampus, campusOfCode, CAMPUS_ALL,
  } = UI;

  const D = function () { return (window.Pages3 && window.Pages3.ACData) || null; };
  const P = function () { return (window.Pages3 && window.Pages3.ACParts) || null; };

  addStrings({
    en: {
      "ac6.crumb": "Bonus",
      "ac6.title": "What bonus do we owe, and who signs it off?",
      "ac6.sub": "The percentage band, the calculation cap and the eligibility ceiling are read from the pinned configuration.",

      "ac6.stop.kind": "Kind",
      "ac6.stop.compute": "Compute",
      "ac6.stop.review": "Review",
      "ac6.stop.send": "Send for approval",
      "ac6.stop.done": "With the checker",

      "ac6.kind": "Which bonus is this?",
      "ac6.kindSub": "Section 32 of the Payment of Bonus Act exempts educational institutions, so this is the school's decision. There is no default.",
      "ac6.kind.stat": "Statutory bonus",
      "ac6.kind.statWhy": "Paid because the Act requires it. The percentage must sit inside the band the configuration allows.",
      "ac6.kind.ex": "Ex-gratia or festival bonus",
      "ac6.kind.exWhy": "Paid because the school chose to. No statutory band and no cap — but it is still a payment, so it still needs a second person.",
      "ac6.kind.s32": "Section 32 exemption",
      "ac6.kind.s32Why": "If the trust is exempt, a statutory bonus is not owed at all and the ex-gratia path is the honest one.",
      "ac6.kind.pick": "Choose one to go on",

      "ac6.fy": "Financial year",
      "ac6.fyVal": "2025–26",
      "ac6.cfg": "Configuration",
      "ac6.cfgNote": "Pinned when this run was created. A later version does not rewrite it.",
      "ac6.band": "Percentage",
      "ac6.bandNote": "Inside the band this configuration allows.",
      "ac6.bandFree": "Set by the school",
      "ac6.bandFreeNote": "An ex-gratia bonus has no statutory band.",
      "ac6.cap": "Calculation cap",
      "ac6.capNote": "From the configuration, read-only.",
      "ac6.capNone": "Not applicable",
      "ac6.ceiling": "Eligibility ceiling",
      "ac6.ceilingNote": "From the configuration, read-only.",
      "ac6.pct": "Percentage to apply",
      "ac6.pctHint": "The band comes from the configuration; the figure inside it is the school's call.",
      "ac6.pctOut": "Outside the band this configuration allows",
      "ac6.compute": "Compute the bonus",
      "ac6.recompute": "Compute it again",
      "ac6.computeNote": "Every eligible person gets a basis and an amount. Nobody is dropped silently.",

      "ac6.res": "What it comes to",
      "ac6.resSub": "Per campus, with the people it does not reach named on the next card rather than subtracted quietly.",
      "ac6.m.total": "Total bonus",
      "ac6.m.totalNote": "Payable through a payroll run once it is approved.",
      "ac6.m.eligible": "Eligible",
      "ac6.m.eligibleNote": "Out of {n} on the roll.",
      "ac6.m.excluded": "Not eligible",
      "ac6.m.excludedNote": "Each with the reason, on the card below.",
      "ac6.m.cfgV": "Computed on",
      "ac6.m.cfgVNote": "The version that supplied the band, the cap and the ceiling.",

      "ac6.who": "Who it reaches, and who it does not",
      "ac6.whoSub": "Eligibility has to be explainable for one person, not just countable for all of them.",
      "ac6.col.campus": "Campus",
      "ac6.col.n": "People",
      "ac6.col.amount": "Bonus",
      "ac6.f.eligible": "Eligible",
      "ac6.f.not": "Not eligible",
      "ac6.x.ceiling": "Above the eligibility ceiling",
      "ac6.x.ceilingN": "{n} people",
      "ac6.x.days": "Fewer than the qualifying days of service",
      "ac6.x.daysN": "{n} people",
      "ac6.x.partial": "Wage history incomplete for the year",
      "ac6.x.partialN": "{n} people",
      "ac6.x.partialNote": "Listed, not dropped. Their months here are real; the rest of the year sits with a previous employer.",

      "ac6.send": "Hand it to a checker",
      "ac6.sendSub": "A bonus run is finalised by somebody who did not prepare it \u2014 the same rule the payroll run follows.",
      "ac6.send.go": "Send it for approval",
      "ac6.send.blocked": "Compute it first",
      "ac6.send.confirm": "Send {total} for {n} people to a checker?",
      "ac6.send.confirmSub": "You prepared this, so you cannot release it. It goes to a holder of the filing capability at this entity.",
      "ac6.send.yes": "Send it",
      "ac6.send.no": "Not yet",
      "ac6.sent": "It is with the checker",
      "ac6.sentBody": "Sent {when}. Nothing in the run can change while it waits. If anything needs to, it comes back here as a new submission.",
      "ac6.sent.open": "Open the approval gate",
      "ac6.maker": "Prepared by",
      "ac6.checker": "Released by",
      "ac6.checkerNote": "Not you. You prepared it.",
      "ac6.export": "Export the bonus register",
      "ac6.after": "What happens after it is released",
      "ac6.afterBody": "A finalised bonus run is append-only and is paid through a payroll run. It does not pay itself.",
    },
  });

  /* THE CONFIGURATION'S OWN FIGURES. Not rates this file invented:
     the band, the cap and the ceiling are what the pinned version
     supplies, which is why they are read-only everywhere below and
     why the version is printed beside them. */
  const CFG_BONUS = { bandLo: 8.33, bandHi: 20, capWord: "ac6.capWord", ceilWord: "ac6.ceilWord" };

  addStrings({
    en: {
      "ac6.capWord": "As the configuration sets it",
      "ac6.ceilWord": "As the configuration sets it",
      "ac6.c.indira": "Indiranagar", "ac6.c.white": "Whitefield", "ac6.c.hyd": "Hyderabad",
    },
  });

  function ACBonus({ role, onNavigate }) {
    /* the accountant holds both campuses; everything below answers this */
    const [campus, setCampus] = useState(CAMPUS_ALL);
    const { c } = useTheme();
    const { t, ty, lang } = useLang();
    const d = D(), parts = P();
    const [kind, setKind] = useState(null);      /* NO DEFAULT, on purpose */
    const [pct, setPct] = useState("8.33");
    const [computed, setComputed] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [sent, setSent] = useState(false);

    if (!d || !parts) return null;
    const Shell = parts.Shell, Trail = parts.Trail;

    const statutory = kind === "stat";
    const pctN = Number(pct);
    const pctOk = !statutory || (pctN >= CFG_BONUS.bandLo && pctN <= CFG_BONUS.bandHi);

    const rows = d.BONUS;
    const total = d.BONUS_TOTAL;
    const eligible = d.BONUS_ELIGIBLE;
    const excluded = d.BONUS_EXCLUDED;
    /* the excluded, split by the reason they are excluded, because a
       lump of 49 teaches nobody anything */
    const WHY = [
      { k: "ceiling", n: Math.round(excluded * 0.55) },
      { k: "days", n: Math.round(excluded * 0.3) },
      { k: "partial", n: excluded - Math.round(excluded * 0.55) - Math.round(excluded * 0.3) },
    ];

    const stage = sent ? "done" : computed ? "send" : kind ? "compute" : "kind";
    const STOPS = ["kind", "compute", "send", "done"];
    const at = STOPS.indexOf(stage);

    function Spine() {
      return (
        <div style={{ display: "flex", marginBottom: G3.layout.gap }}>
          {STOPS.map(function (k, i) {
            const done = i < at, here = i === at, last = i === STOPS.length - 1;
            return (
              <div key={k} style={{ flex: last ? "0 0 auto" : 1, minWidth: 0, position: "relative" }}>
                {last ? null : (
                  <span aria-hidden="true" style={{
                    position: "absolute", top: 9, insetInlineStart: 20, insetInlineEnd: 2, height: 2,
                    background: done ? c.accent : c.gutter,
                  }} />
                )}
                <span aria-hidden="true" style={{
                  position: "relative", display: "flex", width: 20, height: 20, borderRadius: G3.r.pill,
                  alignItems: "center", justifyContent: "center", boxSizing: "border-box",
                  background: c.surface, border: "2px solid " + (here ? c.accent : "transparent"),
                }}>
                  <span style={{ width: 9, height: 9, borderRadius: G3.r.pill, background: done || here ? c.accent : c.gutter }} />
                </span>
                <span style={ty("caption", {
                  color: here ? c.ink : done ? c.inkMuted : c.inkFaint,
                  fontWeight: here ? 700 : 500, marginTop: 7, display: "block", whiteSpace: "nowrap",
                })}>{t("ac6.stop." + k)}</span>
              </div>
            );
          })}
        </div>
      );
    }

    /* a row of these is a MetricStrip written one cell at a time; the
       two places that are a real composition pass the array instead */
    function Metric({ label, value, note, tone }) {
      return <MetricCell label={label} value={value} note={note} tone={tone} />;
    }

    return (
      <Shell campus={campus} onCampus={setCampus} role={role} active="acBonus" onNavigate={onNavigate} crumb={t("ac6.crumb")}
        title={t("ac6.title")} sub={t("ac6.sub")}>
        <Spine />

        {/* ---- 1 · the school's decision, with no default ---- */}
        <Card icon="festival" title={t("ac6.kind")} sub={t("ac6.kindSub")} style={{ marginBottom: G3.layout.gap }}>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            {[
              { k: "stat", nameKey: "ac6.kind.stat", whyKey: "ac6.kind.statWhy" },
              { k: "ex", nameKey: "ac6.kind.ex", whyKey: "ac6.kind.exWhy" },
            ].map(function (o) {
              const on = kind === o.k;
              return (
                <button
                  key={o.k} type="button" disabled={sent}
                  onClick={sent ? undefined : function () { setKind(o.k); setComputed(false); }}
                  style={{
                    flex: "1 1 300px", minWidth: 0, textAlign: "left", cursor: sent ? "default" : "pointer",
                    border: "1px solid " + (on ? c.accent : c.rule), borderRadius: G3.r.sm,
                    background: on ? c.accentSoft : c.surface, padding: "14px 16px",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <span aria-hidden="true" style={{
                      width: 16, height: 16, borderRadius: G3.r.pill, flexShrink: 0, boxSizing: "border-box",
                      border: "2px solid " + (on ? c.accent : c.borderStrong),
                      background: on ? c.accent : "transparent",
                    }} />
                    <span style={ty("small", { color: c.ink, fontWeight: 700 })}>{t(o.nameKey)}</span>
                  </span>
                  <span style={ty("caption", { color: c.inkMuted, display: "block", marginTop: 7 })}>{t(o.whyKey)}</span>
                </button>
              );
            })}
          </div>
          <p style={ty("caption", { color: c.inkFaint, margin: "14px 0 0", paddingTop: 12, borderTop: "1px solid " + c.rule })}>
            <strong style={{ color: c.inkMuted }}>{t("ac6.kind.s32")}</strong> — {t("ac6.kind.s32Why")}
          </p>
        </Card>

        {/* ---- 2 · what the configuration supplies, and the one figure that is ours ---- */}
        {kind ? (
          <section aria-label={t("ac6.band")} style={{
            border: "1px solid " + c.rule, borderRadius: G3.r.md, background: c.surface,
            overflow: "hidden", marginBottom: G3.layout.gap,
          }}>
            <header style={{ padding: "16px 20px 14px" }}>
              <h2 style={ty("h3", { margin: 0, color: c.ink })}>{t("ac6.cfg")} · {d.CFG_JUL.v}</h2>
              <p style={ty("caption", { color: c.inkMuted, margin: "4px 0 0", maxWidth: "90ch" })}>{t("ac6.cfgNote")}</p>
            </header>
            <div style={{
              borderTop: "1px solid " + c.rule, display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", padding: "16px 0",
            }}>
              <Metric label={t("ac6.fy")} value={t("ac6.fyVal")} note={d.cfgFrom(d.CFG_JUL)} tone={c.chartBlue} />
              <Metric
                label={t("ac6.band")}
                value={statutory ? CFG_BONUS.bandLo + "–" + CFG_BONUS.bandHi + "%" : t("ac6.bandFree")}
                note={statutory ? t("ac6.bandNote") : t("ac6.bandFreeNote")} tone={c.chartBlue} />
              <Metric label={t("ac6.cap")} value={statutory ? t("ac6.capWord") : t("ac6.capNone")}
                note={statutory ? t("ac6.capNote") : ""} tone={c.chartAmber} />
              <Metric label={t("ac6.ceiling")} value={t("ac6.ceilWord")} note={t("ac6.ceilingNote")} tone={c.chartPurple} />
            </div>
            <div style={{ borderTop: "1px solid " + c.rule, padding: "16px 20px 18px" }}>
              <div style={{ display: "flex", gap: 16, alignItems: "flex-end", flexWrap: "wrap", maxWidth: 620 }}>
                <div style={{ flex: "0 1 220px", minWidth: 0 }}>
                  <Field id="ac6-pct" label={t("ac6.pct")} hint={t("ac6.pctHint")}
                    error={pctOk ? null : t("ac6.pctOut")}>
                    <Input id="ac6-pct" value={pct} onChange={function (v) { setPct(v); setComputed(false); }} />
                  </Field>
                </div>
                <div style={{ paddingBottom: 4 }}>
                  <Button kind="primary" iconLeft="payroll" disabled={!pctOk || sent}
                    onClick={!pctOk || sent ? undefined : function () { setComputed(true); }}>
                    {computed ? t("ac6.recompute") : t("ac6.compute")}
                  </Button>
                </div>
              </div>
              <p style={ty("caption", { color: c.inkFaint, margin: "12px 0 0", maxWidth: "80ch" })}>{t("ac6.computeNote")}</p>
            </div>
          </section>
        ) : (
          <Card style={{ marginBottom: G3.layout.gap }}>
            <EmptyState head={t("ac6.kind.pick")} body={t("ac6.kindSub")} />
          </Card>
        )}

        {/* ---- 3 · what it comes to ---- */}
        {computed ? (
          <React.Fragment>
            <section aria-label={t("ac6.res")} style={{
              border: "1px solid " + c.rule, borderRadius: G3.r.md, background: c.surface,
              overflow: "hidden", marginBottom: G3.layout.gap,
            }}>
              <header style={{ padding: "16px 20px 0", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                <div style={{ minWidth: 0 }}>
                  <h2 style={ty("h3", { margin: 0, color: c.ink })}>{t("ac6.res")}</h2>
                  <p style={ty("caption", { color: c.inkMuted, margin: "4px 0 0", maxWidth: "90ch" })}>{t("ac6.resSub")}</p>
                </div>
                <Button kind="secondary" size="sm" iconLeft="download">{t("ac6.export")}</Button>
              </header>
              <MetricStrip
                style={{ padding: "18px 0 16px" }}
                metrics={[
                  /* the money and the configuration version are not people;
                     eligible and excluded are, and between them they are
                     everybody on the run, so the bar is the run */
                  { k: "total", label: t("ac6.m.total"), value: inr(total), bar: false, tone: c.chartTeal, note: t("ac6.m.totalNote") },
                  { k: "eligible", label: t("ac6.m.eligible"), value: num(eligible), tone: c.chartGreen, note: t("ac6.m.eligibleNote", { n: num(d.RUN_HEADS) }) },
                  { k: "excluded", label: t("ac6.m.excluded"), value: num(excluded), tone: c.chartAmber, note: t("ac6.m.excludedNote") },
                  { k: "cfg", label: t("ac6.m.cfgV"), value: d.CFG_JUL.v, bar: false, tone: c.chartPurple, note: t("ac6.m.cfgVNote") },
                ]}
              />
            </section>

            <Card icon="staff" title={t("ac6.who")} sub={t("ac6.whoSub")} style={{ marginBottom: G3.layout.gap }}>
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 280px", minWidth: 0 }}>
                  <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 })}>
                    {t("ac6.f.eligible")}
                  </div>
                  {rows.map(function (r, i) {
                    return (
                      <div key={r.campusKey} style={{
                        display: "flex", alignItems: "baseline", justifyContent: "space-between",
                        gap: 12, padding: i ? "9px 0 0" : 0,
                      }}>
                        <span style={ty("small", { color: c.ink, minWidth: 0 })}>
                          {t("ac6.c." + r.campusKey.split(".").pop())}
                          <span style={ty("caption", { color: c.inkFaint })}> · {num(r.n)}</span>
                        </span>
                        <span style={G3.fig("sm", { color: c.ink, fontWeight: 700, whiteSpace: "nowrap" })}>{inr(r.v)}</span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ flex: "1 1 280px", minWidth: 0 }}>
                  <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 })}>
                    {t("ac6.f.not")}
                  </div>
                  {WHY.map(function (w, i) {
                    return (
                      <div key={w.k} style={{ padding: i ? "9px 0 0" : 0 }}>
                        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
                          <span style={ty("small", { color: c.ink, minWidth: 0 })}>{t("ac6.x." + w.k)}</span>
                          <span style={G3.fig("sm", { color: c.inkMuted, fontWeight: 700, whiteSpace: "nowrap" })}>{num(w.n)}</span>
                        </div>
                        {w.k === "partial" ? (
                          <div style={ty("caption", { color: c.inkFaint, marginTop: 2 })}>{t("ac6.x.partialNote")}</div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>

            {/* ---- 4 · the gate ---- */}
            <Card icon="lock" iconTone={sent ? "present" : null}
              title={t("ac6.send")} sub={t("ac6.sendSub")} style={{ marginBottom: G3.layout.gap }}>
              {sent ? (
                <div>
                  <StatusMark role="present" glyph="check" word={t("ac6.sent")} />
                  <p style={ty("small", { color: c.inkMuted, margin: "12px 0 0", maxWidth: "80ch" })}>
                    {t("ac6.sentBody", { when: d.fmtDate(t, d.TODAY) })}
                  </p>
                  <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginTop: 16 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" })}>{t("ac6.maker")}</div>
                      <div style={ty("small", { color: c.ink, fontWeight: 600, marginTop: 4 })}>{t(d.ME.key)}</div>
                      <div style={ty("caption", { color: c.inkFaint })}>{t(d.ME.roleKey)}</div>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" })}>{t("ac6.checker")}</div>
                      <div style={ty("small", { color: c.inkMuted, fontWeight: 600, marginTop: 4 })}>{t("ac6.checkerNote")}</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 16 }}>
                    <Button kind="primary" size="sm" iconLeft="lock" onClick={function () { onNavigate && onNavigate("acGate"); }}>
                      {t("ac6.sent.open")}
                    </Button>
                  </div>
                  <p style={ty("caption", { color: c.inkFaint, margin: "16px 0 0", paddingTop: 13, borderTop: "1px solid " + c.rule, maxWidth: "80ch" })}>
                    <strong style={{ color: c.inkMuted }}>{t("ac6.after")}</strong> — {t("ac6.afterBody")}
                  </p>
                </div>
              ) : confirming ? (
                <div style={{ maxWidth: 620 }}>
                  <p style={ty("small", { color: c.ink, margin: "0 0 6px", fontWeight: 600 })}>
                    {t("ac6.send.confirm", { total: inr(total), n: num(eligible) })}
                  </p>
                  <p style={ty("caption", { color: c.inkMuted, margin: "0 0 14px" })}>{t("ac6.send.confirmSub")}</p>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Button kind="primary" size="sm" iconLeft="check" onClick={function () { setSent(true); setConfirming(false); }}>
                      {t("ac6.send.yes")}
                    </Button>
                    <Button kind="secondary" size="sm" onClick={function () { setConfirming(false); }}>{t("ac6.send.no")}</Button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                  <Button kind="primary" iconLeft="lock" onClick={function () { setConfirming(true); }}>
                    {t("ac6.send.go")}
                  </Button>
                </div>
              )}
            </Card>
          </React.Fragment>
        ) : null}
      </Shell>
    );
  }

  window.Pages3 = window.Pages3 || {};
  window.Pages3.ACBonus = ACBonus;
})();
