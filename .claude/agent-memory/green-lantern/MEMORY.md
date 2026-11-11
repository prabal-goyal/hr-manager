# green-lantern — Project Memory

Committed to git (knowledge-portability principle). Curated by lucius; distilled, not append-only.

## Charter
Next.js web frontend. Pages, components, dashboard UX for HR/admin/principal surfaces.

## Owns
`frontend/` (Next.js, React/TS, Tailwind, shadcn, TanStack Query, NextAuth); M15 dashboards + the web side of every module. NOT design audits (two-face).

## Standing decisions (binding)
- TypeScript strict; `any` banned (`guard-no-any`) — `unknown` + narrowing at boundaries. GraphQL types are generated (codegen), never hand-written (`check-contract-sync`).
- User-facing strings are Hindi + English via i18n files, no hardcoded copy (`guard-i18n-strings`); no magic constants where a token/config exists (`guard-hardcoded-values`).
- Money is rendered from Decimal-safe values off the API — never do float arithmetic client-side.
- Auth via NextAuth behind a thin session facade — no hand-rolled auth (`guard-hand-rolled-auth`). **Design token system is `design/v3` (`window.G3`); "Staffroom Terracotta", rebased 2026-09-03** — cream/cocoa/clay, 20px cards. **Type since 2026-09-16 (NA-61): Bricolage Grotesque 600 (display) + Hanken Grotesk (UI) + Hind (all Devanagari, max 700) + Red Hat Mono (figures)**; the Young Serif stack is superseded. See [v3 Staffroom Terracotta](project_v3_staffroom_terracotta.md) (palette) and [v3 canonical](project_v3_canonical_peacock.md) (still-binding composition rules); "Peacock", "Greenboard & Chalk" and the old naveya token system are history.
- Document governance (M4): the HR web surface initiates DocumentUpdateRequests and verifies; employees never self-write.
- Append durable learnings here before finishing any dispatch.

## Project & feedback notes — v3 build (current)
- [v3 canonical composition](project_v3_canonical_peacock.md) — design/v3 supersedes G/G2; cards win, radius-0 dead; login = left/right split.
- [v3 Staffroom Terracotta](project_v3_staffroom_terracotta.md) — current palette; two-shade clay, railAccent, warm dark (its Young Serif type notes are superseded by NA-61 Warm Grotesk).
- [v3 Home = exploration D port](project_v3_home_terracotta_port.md) — light cream hero + 3 flex cols + letter-coded calendar; kit gained Meter/TitleMark/SchoolScene/RequestArt. Supersedes all pre-v3 Home-variant explorations (A–F, bento, cards-pivot, calm-chrome, Signal, Staff Daily, Corridor Study).
- [v3 Attendance screen](project_v3_attendance_screen.md) / [Keka rebuild](project_v3_attendance_keka_rebuild.md) — first `Pages3/*.jsx` pattern; shape→register→detail recipe; rebuilt against real `design/reference/keka/*.jpg`.
- [v3 Leave + Payslips](project_v3_leave_payslips.md) — request-form "consequence panel"; maker-checker as employee-visible state.
- [v3 Documents + Profile governance](project_v3_documents_profile_governance.md) — absent-vs-disabled, mask-in-DOM, one-reveal-at-a-time, DPDP surface; MaskedField/DefRow/Trail promotion candidates.
- [v3 Payroll console](project_v3_payroll_console.md) / [salary](project_v3_py_salary.md) / [operations](project_v3_payroll_ops.md) — PY-01/07/08, PY-02..06, PY-09..18; maker-seat state machine, config-read 50% limit, ten screens/six tabs, code-asserted CHECKS.
- [v3 Group Admin screens](project_v3_groupadmin_screens.md) / [systems](project_v3_groupadmin_systems.md) — GA-01/04/08 then GA-02/03/05/06/07/09/10/11/12; grant-pending-visible-to-grantor-never; six-tab grouping by shared question/recipe; self-caught system-role-must-be-read-only bug; zero-orphan check exposes unbuilt flows, not just wording.
- [v3 Campus Principal](project_v3_principal_screens.md) / [re-anchor](project_v3_principal_reanchor.md) — PR-01/02/03; name-the-escalation-cause; outage-leads-not-absence; TODAY_ISO hides inside event handlers too.
- [v3 Department Head](project_v3_depthead_screens.md) — DH-01/02/03; cross-page fact reuse; ConfirmDialog/RowCheck/PillGroup candidates; per-row transactional bulk-approve.
- [v3 Accountant AC-01/02/03](project_v3_accountant_screens.md) — one maker-checker gate; three-number statutory recon; money derived from payroll.jsx's own aggregates.
- [v3 HR record](project_v3_hr_record.md) / [compliance](project_v3_hr_compliance_screens.md) / [lifecycle](project_v3_hr_lifecycle_screens.md) / [hiring](project_v3_hr_hiring_screens.md) / [leave&att](project_v3_hr_leaveatt.md) / [helpdesk](project_v3_hr_helpdesk_screens.md) / [reports&setup](project_v3_hr_reports_setup.md) — HR-03..37 across seven files; subject-shell-with-tabs; permission-absent-not-disabled; computed SLA state machine; aggregates-leak threshold demo.
- [v3 Employee Requests](project_v3_emptasks_screens.md) / [kit promotions](project_emptasks_kit_promotions.md) — EMP-03/04/06/11/12/13; FileField/ConfirmRow/TextArea additions.
- [kit ActionMenu/Switch/Tabs + icons](project_v3_kit_actionmenu_icons.md) — portal-based popover menu, real Switch/Tabs, thin-stroke icon normalization (screens.jsx icons excluded).

## Feedback — verification technique (apply every dispatch)
- [reference screenshots, not prose](feedback_reference_screenshots_not_prose.md) / [audit a reference's figures](feedback_reference_figures_need_auditing.md) — open real `design/reference/*` images and audit mock figures; don't build from a summary.
- [DOM dump includes JSX source](feedback_dom_dump_includes_jsx_source.md) — assert PII-absence on the rendered tree, never `page.content()`.
- [overflowX clip hides table overflow](feedback_overflowx_clip_hides_table_overflow.md) — `documentElement.scrollWidth` is a useless hscroll test; measure each table vs its parent.
- [TabPanel lazy single-instance](feedback_tabpanel_lazy_single_instance.md) / [nested tabs panel count](feedback_nested_tabs_panel_count.md) — mount exactly one `<TabPanel>` per active tab per tablist; a page-wide count of 1 can hide a nested tablist bug.
- [nested tab branch never clicked](feedback_nested_tab_branch_never_clicked.md) — an outer-tab-only matrix says ALL PASS while a nested sub-screen crashes; walk every leaf.
- [row-menu promises a subflow](feedback_row_menu_promises_subflow.md) — click through to the exact flow a `⋯` item names, don't just screenshot the menu.
- [ActionMenu offscreen trigger](reference_actionmenu_offscreen_trigger.md) — scrollIntoView before clicking; query menuitems from `document.body` (portal).
- [affordance grep, not prose](feedback_affordance_grep_not_prose.md) — prove a forbidden action absent via CONTROL labels; the rule-stating copy contains the banned verb.
- [selected-row fallback + placeholder audit](feedback_selected_row_fallback_and_placeholder_audit.md) — derive a fallback for `useState(null)` selection; grep every `{placeholder}` key's call sites for a matching vars object.
- [dynamic i18n key range](feedback_dynamic_i18n_key_range.md) — `t(prefix + var)` needs the WHOLE enum declared, or a raw key ships to screen.
- [interpolated string as a label](feedback_interpolated_string_as_label.md) — detect via a Latin-word scan of the Hindi render.
- [verify via cloned harness](reference_verify_via_cloned_harness.md) — clone+sed+verify+delete rather than editing the shared routing file when a page's script tag isn't wired.
- [v3 role pages not pre-wired](feedback_v3_role_pages_not_wired.md) — grep v3.html yourself; don't trust "already wired".
- [shared http.server port](feedback_shared_http_server_port_parallel_agents.md) — fixed-port 8934: first bind wins, never pkill at cleanup (may kill a sibling's server).
- [batched edit script partial loss](feedback_batched_edit_script_partial_loss.md) — a python edit batch that asserts mid-way writes nothing; re-grep every marker after any failure.

## Feedback — governance & content rules
- [absent vs disabled](feedback_absent_vs_disabled_capability.md) — capability missing → ABSENT; held-but-forbidden-here → disabled with the rule stated in the first person.
- [gate threshold from config](feedback_gate_threshold_from_config.md) — a displayed threshold is a versioned, attributed policy object; below-gate rows shown, never auto-cleared.
- [elapsed-vs-future summary leak](feedback_elapsed_vs_future_summary_leak.md) — calendar-known future off/holiday days excluded from register totals even while previewed in a shape view.
- [spec-silent choices](feedback_spec_silent_choices_hr_leaveatt.md) — where the inventory flags its own open question, render a required choice or a named refusal, never a default.
- [cross-screen mock constants](feedback_cross_screen_mock_constants.md) — grep siblings before deriving money; a copied "from X's mock" comment can be wrong.
- [prefilled field i18n](feedback_prefilled_field_i18n.md) — a demo-prefilled input holds null-while-untouched, or its sample text freezes in the boot language.
- [i18n demo content leaks](feedback_i18n_demo_content_leaks.md) — mock row content (times, log text) needs `t()` too; verify via body-text diff per language.
- [Devanagari slice truncation](feedback_devanagari_slice_truncation.md) — never derive a short-form label by slicing a full translated string; author dedicated short-form keys.
- [a rule on every row is a footnote](feedback_rule_on_every_row_is_a_footnote.md) — a rowNote() default of null keeps repeated prose from burying the rows that differ.
- [num() and table widths](feedback_number_formatters_and_table_widths.md) — `num(2026)` renders "2,026"; a long sentence in a table cell starves the first column.
- [legend that counts](feedback_legend_that_counts.md) — fold a letter-code legend INTO the summary row so neither is a cuttable duplicate.
- [dead space relocates](feedback_dead_space_relocates.md) — fixing one card's emptiness in a stretch row just moves the hole to the next-shortest sibling.

## Feedback — implementation gotchas
- [disabled-submit click dead-end](feedback_disabled_submit_click_deadend.md) — never hard-`disabled` a submit for "disable-until-valid"; it swallows the click that reveals validation errors.
- [kit Button disabled isn't native](reference_kit_button_disabled_not_native.md) — kit.jsx Button's `disabled` only dims/sets aria; an attached onClick still fires — omit or guard it.
- [ColorCard dark ink inversion](feedback_colorcard_dark_ink_inversion.md) — never set `c.onBrass`/`c.onAccent` inside a ColorCard; inherit. Only a dark screenshot catches it.
- [CardHeader action-slot wrap collision](feedback_cardheader_action_slot_wrap_collision.md) — never pass a StatusMark as Card's `action` prop against variable-length demo content; put state marks in the body, verified only by real screenshot.
- [overused-font hook](feedback_overused_font_hook.md) — pick off-list faces upfront (Bricolage/Hanken/Hind/Red Hat Mono is the live v3 set; Geist is flagged); keep a Devanagari face (Hind) at the end of every chain so ₹ always renders.
- [Motif bleed = hidden hscroll](feedback_motif_bleed_hscroll.md) — `<Motif/>` needs `overflowX: clip` on main.
- [grid row-sync gap pitfall](feedback_grid_row_sync_gap.md) — grid-template-areas stretches to the tallest cell; unrelated-height columns need flex.
- [React 18 batched setState ref race](feedback_react18_batched_setstate_ref_race.md) — never re-read a ref inside a setState updater in drag handlers; snapshot to a local const first.
- [theme toggle single-instance](feedback_theme_toggle_single_instance.md) — don't double up ThemeToggle across a shared ThemeProvider tree.
- [jsx prop-string entities](feedback_jsx_prop_string_entities.md) — `&amp;` only decodes in JSX text children, not a prop string literal.
- [authored nbsp Edit mismatch](reference_authored_nbsp_edit_mismatch.md) — invisible U+00A0 from your own Write breaks later Edits; diagnose with `od -c`.
- [tilde trips the workdir guard](reference_tilde_trips_workdir_guard.md) — a bare `~` anywhere in a Bash command, even in heredoc prose, is blocked.
- [font-load verification](reference_font_load_verification.md) — `document.fonts.check()` false-negatives; width-diff against the fallback instead.
- [puppeteer verification](reference_puppeteer_verification.md) — cached Chrome at `~/.cache/puppeteer` screenshot-verifies design/*.html with no build step.
- [design canvas spread syntax safe](reference_design_canvas_spread_syntax_safe.md) — object spread/rest already proven safe in design/*.jsx; grep before assuming untested.

## Design-system structure notes
- [naveya component kit](project_naveya_component_kit.md) / [leave screen pattern](project_naveya_leave_screen_pattern.md) — pre-v3 kit and Register-record pattern, still linked from current notes. Other pre-v3 explorations (Home variants A–F, Peacock tokens, STAFFROOM v2, v2 shell, theme tweaker, experiments) were removed 2026-11-11; see git history at 7a39e3b.
- [design-canvas conventions](project_design_canvas_conventions.md) — design/*.jsx is Babel-standalone/classic-JSX, no imports, inline styles + `window.G` only.
- [design dispatch scope](feedback_design_dispatch_scope.md) — code edits inside design/ are in-scope even though "design audits" aren't.
- [tokens declare real fonts](feedback_tokens_declare_real_fonts.md) — a token file's font fields must be the truth, not aspirational.
- [naveya masked PII pattern](project_naveya_masked_pii_pattern.md) — mask+reveal shape 2x-confirmed; promote to `UI.MaskedField` on next kit touch.
- [naveya screens/ directory sharding](project_naveya_screens_directory.md) — per-screen files at `design/screens/<name>.jsx`, each exposing `window.Screens.<Name>`.
- [naveya screens wiring pass](project_naveya_screens_wiring_pass.md) — load-order-binding script tags; w=1400 artboard; puppeteer nav-click selector gotcha.
- [content width balance](project_naveya_content_width_balance.md) — CONTENT_MAX=1200 duplicated per file (no shared-module system).
- [role canvas iframe board](project_role_canvas_iframe_board.md) — canvas.html+jsx coverage map; 3-state model, 50 spec-derived frames.
- [prototype deep-linking](project_prototype_deeplinking.md) — v2/prototype.jsx `?route=/?screen=/?theme=/?lang=` contract.
- [impeccable AI tells](feedback_impeccable_ai_tells.md) — design hook blocks Fraunces/Inter-class fonts + side-tab accent borders; Literata + Public Sans proven.
- [live reference capture mid-task](feedback_live_reference_capture_midtask.md) — mid-dispatch competitor findings refine, not replace, the brief; re-plan component APIs before more call sites.

## v3 public screens
- [public & token screens](project_public_token_screens.md) — PUB-01/03/04 in design/v3/pages/public.jsx; PUB-03 renders no identity at all because a bearer token can be forwarded.
