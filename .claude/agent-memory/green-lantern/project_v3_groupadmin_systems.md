---
name: v3-groupadmin-systems
description: design/v3/pages/ga-systems.jsx — GA-02/03/05/06/07/09/10/11/12, the Group Admin systems section completing the role; six-tab grouping rationale and the system-role-immutability bug this dispatch caught in itself.
metadata:
  type: project
---

Completes Group Admin (`groupadmin.jsx` already owns GA-01/04/08). One file, six tabs, each grouping driven
by the screens' own question rather than a generic split: **Organisation** (GA-02 org tree + GA-03 legal
entities — spec cross-references them as a pair explicitly), **Roles & policy** (GA-05 + GA-07 — different
domains, ONE shared recipe: immutable/versioned artefact, diff-before-publish, affected-count, a second Group
Admin who is never the author), **Calendar** (GA-06 alone — feeds HR-26, not payroll), **Reports** (GA-09
alone, deliberately thin per spec — "the shared report-runner... not repeated"), **Connections** (GA-10 +
GA-11 — spec's own words call these an explicit sibling pair), **Data protection** (GA-12 alone — the
single largest compliance gap found in the inventory, never folded into anything else).

**Self-caught governance bug, worth repeating as a general check:** GA-05's spec precondition is "role not
`is_system`" — seed/system roles must be **read-only + Clone**, never silently editable, because editing a
role definition changes it for every current holder with no assignment-level review. My first pass let
ANY role (including all seven seed roles) open the full editable-checkbox form. Caught by re-reading my own
action table before wiring the UI, not by a review pass — worth building a "does my UI honor every
precondition column in the row I just implemented, not just the happy-path action" self-check into future
GA/HR-setup dispatches. Fixed by adding one demo custom role (`financeAnalyst`, cloned from Accountant,
0 holders) so the editable flow has a legitimate target, and splitting `RoleRow` into
`ViewSystemRoleForm` (read-only + Clone) vs `EditPermissionForm` (only for non-`system` roles).

**`documents.write` shown-disabled pattern:** the spec explicitly wants this permission visible-and-forbidden
on any Employee-shaped role's permission view (M4 §Business rules #2) — a deliberate exception to "absent,
never a disabled ghost" (DESIGN 9), same class as payroll's disabled Approve button for the maker
(ui-compliance-requirements.md §7-C7). Built as a shared `DocsWriteRow()` used by both the read-only system
view and the editable form, gated on `role.key === "employee" || role.clonedFromKey === "gs5.role.employee"`.

**GA-07 is the one screen allowed to show real statutory numbers.** Every other v3 page (payroll.jsx,
accountant.jsx) deliberately carries `CFG_*` objects with ONLY `{v, fromISO}` — no rate, ever — because
"a number invented in a mock is a number that gets implemented" (ui-compliance-requirements.md §8-F5). GA-07
is the versioned-config ADMIN screen itself, so it is the one place PF/ESI/PT/TDS/gratuity/bonus/LWF/min-wage
values are supposed to render. Reused the exact version identifiers/dates already live elsewhere
(`v2026.2`/`v2026.3` active, `v2026.4` draft-scheduled 1 Sep) rather than inventing a parallel timeline.

**GA-11's device world is inherited, not invented.** `hr-leaveatt.jsx`'s `OUTAGE` (incident `INC-0114`, Main
gate reader Indiranagar, down 06:00–13:20 on 7 Aug, still open in HR's exception queue) and
`principal.jsx`'s live banner (East gate scanner, Primary block, silent since 07:40 *today*) are two
DIFFERENT devices at the same campus — GA-11 renders both from one device register rather than picking one
or inventing a third. Cross-check every sibling file that already references "device outage" before building
the device inventory screen that's supposed to be its source of truth.

**Zero-orphan i18n self-check is worth automating per-dispatch:** a Python one-liner
(`re.findall('"(key)":\\s*"'` then count re-occurrences of each literal key string) catches genuinely dead
strings fast, but throws false positives for every computed-key lookup (`t("gs5.perm." + p)`,
`t("gs11.family." + device.family)` etc.) — those must be verified by hand, not auto-cleaned. Real orphans
found this way in this dispatch: three whole action rows (GA-02 "Move a department", GA-06 "Roll over",
GA-07 "Edit a draft version's rules") had a canned flash-message shortcut instead of the actual described
form — the orphan strings were the tell that the flow was never really built, not just a wording leftover.

**Pre-existing NAV-0009 collision (not introduced here, do not compound):** `hr.jsx`'s STAFF roster has
NAV-0009 = Sunita Menon (exited TGT English); `payroll.jsx`/`accountant.jsx` separately use NAV-0009 for
Rajiv Menon (Accountant/checker). Also groupadmin.jsx's session user and hr.jsx's NAV-0142 both render as
"Ananya Rao" (a teacher and the Group Admin persona, same name, different people). Referenced Sunita Menon by
NAME ONLY in GA-12 to avoid amplifying the ID collision; flagged both for a future reconciliation pass.

See also [naveya masked PII pattern](project_naveya_masked_pii_pattern.md), [v3 canonical composition](project_v3_canonical_peacock.md).
