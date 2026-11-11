# Naveya — Screen & Action Inventory (spec-derived, authoritative)

> **Purpose.** The authoritative, spec-derived answer to *what screens Naveya needs, per role, what belongs
> on each, and **what every control on them actually does***. Derived from
> `docs/development-specification.md` (M1–M17 + §4–§9), scoped by `docs/functionality-blueprint.md`
> (MVP / P2 / Later), disciplined by `DESIGN.md` principles — especially 1 ("every element earns its
> place"), 2 ("one screen, one question"), 9 ("don't offer what governance forbids") and 10 ("nothing
> irreversible in one click").
>
> **This supersedes the ~50-frame `design/canvas.jsx` lane map.** The canvas is a build-status board, not a
> scope document. Where the two disagree, this file wins.
>
> **Author:** alfred · **Created:** 2026-08-11 · **Status:** working reference.
> **Amended 2026-08-11** for three user-approved spec corrections — see §12 *Amendments*.

---

## How to read this

**Role model (locked, `.claude/agent-memory/batman/MEMORY.md` 2026-08-11; spec `M2 §Seed roles`):**
Group Admin · Campus Principal · HR Operator · Payroll Operator · Accountant · Department Head · Employee.
**Amended 2026-09-22 (user ruling):** a **Director** joins them as the trust-level leave authority — see
§12 *Amendment D*. Eight roles, not seven.
Checker is a **maker-checker capability flag** (`M2 §Business rules`), not a role. "Manager" is the
reports-to relationship, surfaced on Department Head screens. One app, **role-filtered nav**
(`DESIGN.md §Shape`).

**Code prefixes**

| Prefix | Who |
|---|---|
| `SH-` | Shared — every authenticated user |
| `PUB-` | Public / token-authenticated — candidate, pre-boarding joiner |
| `EMP-` `DH-` `PR-` `HR-` `PY-` `AC-` `GA-` | Owned by that role |
| `DR-` | Director — trust-level leave oversight (Amendment D, screens not yet specified here) |

**Kind** — raw screen counts mislead without this lens:

| Kind | Meaning | In the rail? |
|---|---|---|
| **destination** | A place you go. | yes |
| **detail** | The record behind a row. | no |
| **task** | A focused, finite flow (apply, respond, compute, approve). | no |
| **setup** | Configuration, edited rarely. | under Settings |

**Each screen carries:** the one question · owning module(s) with citation · must contain · must NOT
contain · states · scope behaviour · MVP/P2/Later · rank within role (rank 1 = what that role opens
first) · **Actions** · **Non-happy paths**.

**Every screen is defined exactly once.** A screen a wider-scoped role also sees is not redefined in that
role's section — the coverage table (§10.1) carries cross-role availability. This is the direct fix for the
duplicated-destinations problem.

**Citation convention.** The spec has no numbered subsections inside modules, so citations are
`M<n> §<labelled block>` (e.g. `M9 §Business rules`) or `§<part>` for Parts I/II/IV (`§6.9`, `§4.4`, `§8`).
Anything not in the spec or blueprint is marked **`[proposed]`** with a stated reason.

### Action-table conventions (binding, so behaviour stops being an afterthought)

Every screen carries an **Actions** table with these columns:

`Action · where it lives` | `Who (scope)` | `Preconditions` | `Options & defaults` | `After · downstream` | `Failure` | `Reversible?` | `2nd eyes?`

- **Availability rule (consistent everywhere):** an action the role **could** perform but the record's state
  forbids is **shown disabled with the reason on hover/press** (so the user learns the rule). An action the
  role can **never** perform at any state is **hidden entirely** (`DESIGN.md` principle 9 — never imply a
  permission the system won't honour).
- **Where it lives** is one of: `page header` · `card header` · `row` · `row menu` · `detail panel` ·
  `bulk bar` · `inline field` · `banner`.
- **Downstream effects** must be named explicitly: audit write (`§4.2` — *every* mutating action writes an
  `AuditLog`; it is stated once here and assumed on every row unless a row says otherwise), notification
  (`M14`), approval task created, balance change, LOP into payroll, maker-checker gate opened, effective-
  dated supersession (`§4.3`).
- **Money actions** carry `Decimal` handling and idempotency keys (`§7 Concurrency` — "idempotency keys
  required on payroll/statutory/settlement actions so a retry never double-processes").
- **Optimistic concurrency:** mutable records use `ETag`/`If-Match` (`§7 Concurrency`); the standard failure
  "someone else changed this — reload" applies to every edit action and is not repeated per row.
- **Input survival:** every failed submit **preserves user input** unless the row says otherwise. This is a
  standing rule, not a per-action promise.

---

# 1 · Shared screens (all roles)

### SH-01 · Sign in — rank 1 · MVP · destination · **BUILT (v3)**
- **Q:** *"how do I get in?"*
- **Modules:** `M2 §API` (`POST /auth/login`), `§7 Auth` (JWT access+refresh), `§8 Auth hardening`.
- **Must contain:** Staff ID (not email — `DESIGN.md §Sign-in`); password with show/hide; one-time-code
  alternative → SH-02; language toggle EN/हिन्दी (`M13 §Business rules`); *"your school's HR office sets up
  your account"* (no self-registration — `§6.2 User` is HR-provisioned); lockout messaging (`§8`).
- **Must NOT contain:** self-registration; a tenant/subdomain free-text field (tenant is resolved from
  token/subdomain, **never** a client parameter — `§7 Tenancy`); role picker; forgot-Staff-ID self-service.
- **States:** idle · submitting · invalid credentials · locked · inactive account (post-exit,
  `M12 §Business rules`) · MFA challenge (`M2 §Business rules`) · offline.
- **Scope:** identical for all roles; the *destination after* sign-in is that role's rank-1 screen.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Sign in** · page header form | anyone (none) | Staff ID + password non-empty | Staff ID (text), password (masked; show/hide toggle, default hidden), "keep me signed in" **default off** | JWT access+refresh issued (`§7 Auth`); tenant + scoped roles resolved; route to the role's rank-1 screen; **login audited** (`§8 Auth hardening`) | wrong credentials (generic message — never "no such user", to avoid staff-ID enumeration); locked after N attempts with unlock-by-HR guidance; inactive account → "contact your HR office"; network error retains the Staff ID | n/a (sign out reverses) | no |
| **Use a one-time code instead** · form footer link | anyone | always | — | routes to SH-02 carrying the typed Staff ID | — | yes (back) | no |
| **Show / hide password** · inline field | anyone | password field non-empty | toggle, **default hidden** | reveals in place; auto-hides on submit | — | yes | no |
| **Switch language** · page header | anyone | always | `English` / `हिन्दी`; **default English** (`DESIGN.md` principle 11 — one language at a time, never both) | whole UI re-renders in one language; preference stored pre-auth (device) and merged to the profile at sign-in | font/asset load failure → falls back to English with a notice | yes | no |
| **MFA challenge submit** · page (second step) | anyone whose role requires MFA (`M2 §Business rules` — admin/payroll) | primary auth succeeded and MFA enrolled | 6-digit code; "trust this device" **default off** | session established; audited | invalid/expired code; attempts exhausted → back to step 1 with a lockout notice | n/a | this **is** the second factor, not maker-checker |
| **Contact HR / support** · page footer | anyone | always | — | opens the tenant's configured support contact `[proposed]` — the spec defines no support-contact field; reason: staff with no account cannot raise a helpdesk ticket (M15.1 requires auth) | not configured → generic guidance | yes | no |

**Non-happy paths:** account exists but has **no `RoleAssignment`** (`§6.2`) → sign-in succeeds but there is
no home; show a designed "your access hasn't been set up yet — HR has been notified" screen rather than an
empty rail. Tenant suspended (`§6.1 Tenant.status`) → explicit tenant-level message. Clock skew / expired
refresh mid-session → silent refresh, then a re-auth modal that **preserves the current route**.

---

### SH-02 · One-time-code sign-in — rank 6 · MVP · task
- **Q:** *"I forgot my password — let me in another way."*
- **Modules:** `M2 §Business rules`, `DESIGN.md §Sign-in` (SMS one-time-code alternative), `M14 §Purpose`
  (SMS channel), `§8 Auth hardening`.
- **Must contain:** Staff ID → masked destination (`•••••• 4821`); 6-digit entry; resend with cooldown;
  "contact your HR office" escape.
- **Must NOT contain:** the full phone number (`§8 PII classification`); a password-set step that bypasses
  HR beyond what M2 grants; any employee data before auth.
- **States:** requesting · sent · invalid · expired · cooldown · attempts exhausted · delivery failure.
- **Scope:** identical for all roles.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Send me a code** · page primary | anyone (none) | Staff ID entered; account active; a verified phone/email on `§6.2 User` | channel: **SMS default**, email fallback if no phone (`§6.11 Notification.channel`) | code issued with TTL; SMS/email dispatched via M14; masked destination shown; **rate-limited** (`§8`) | no contact on file → "your HR office must add a phone number" (does **not** reveal whether the Staff ID exists); provider failure → offer the other channel | n/a | no |
| **Verify code** · page primary (step 2) | anyone | a code was issued and is unexpired | 6 digits | session established exactly as SH-01; audited | wrong code (attempts counter shown); expired → offer resend; exhausted → lock + HR guidance | n/a | no |
| **Resend** · below the code field | anyone | cooldown elapsed | cooldown **default 30s**, escalating | new code invalidates the previous one — say so | still in cooldown → disabled with the remaining seconds | n/a | no |
| **Change destination / start over** · secondary | anyone | always | — | returns to step 1, clears the pending code | — | yes | no |

**Non-happy paths:** staff member has left (`is_active=false`) → same generic message as an unknown Staff ID
(no enumeration). Shared/duplicate phone across two staff → the spec does not forbid it; **flag** — resolve
by Staff ID, never by phone. Poor connectivity: the code entry must tolerate an app backgrounded for the
SMS and **restore the entered digits**.

---

### SH-03 · Notification centre — rank 5 · MVP · destination
- **Q:** *"what happened that I should know about?"*
- **Modules:** `M14 §Purpose`, `M14 §API` (`…/notifications`), `§4.6`.
- **Must contain:** list grouped by day; unread state; type marks (approval · document request · expiry ·
  payslip release · statutory due date · helpdesk SLA — `M14 §Business rules`, `M15.1 §Business rules`);
  deep link to the owning screen; per-channel delivery indicator (`§6.11`).
- **Must NOT contain:** the action itself (approving here duplicates the approval queue — `DESIGN.md`
  principle 1); template administration (HR-34); tenant-wide notification settings.
- **States:** empty (designed, warm — principle 7) · loading · error · overflow (cursor-paginated, `§7`) ·
  muted/digest.
- **Scope:** already recipient-filtered; no widening.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Open notification** · row | any authenticated (self) | notification exists | — | marks read; routes to the owning record (leave request, document request, payslip, filing, ticket) | target deleted/superseded → "this has moved on" with the current state instead of a dead end | read state can be undone | no |
| **Mark read / unread** · row menu | any (self) | — | — | toggles; badge count updates | — | yes | no |
| **Mark all read** · page header | any (self) | ≥1 unread | confirm **not** required (reversible per-row) | all currently-loaded + server-side unread cleared | partial failure → count reconciles on refresh | per-row only | no |
| **Filter** · card header | any (self) | — | type (all · approvals · documents · expiry · payroll · statutory · helpdesk · appraisal), read-state, date range; **default: all, last 30 days** | client+server filter; state kept in the URL | — | yes | no |
| **Load more** · list footer | any (self) | more pages exist (`§7` cursor) | page size **default 25** | appends | cursor invalidated → refresh notice | n/a | no |
| **Mute a category** · row menu · **`[proposed]`** | any (self) | category is not statutory/compliance | in-app only; SMS/email cannot be muted for statutory or payroll-release notices | preference stored | — | yes | no — but reason: the spec defines no per-user notification preference; muting compliance alerts would undermine `M14 §Business rules` (statutory due dates), hence the carve-out |

**Non-happy paths:** notification references a record the user has **since lost access to** (transferred
department, scope changed) → show "you no longer have access to this item", never a 403 dead-end. Push
delivered but in-app record missing (sync gap) → reconcile on open. Digest/overflow: >200 unread should
collapse into per-day summaries rather than an infinite list.

---

### SH-04 · My account & security — rank 7 · MVP · setup
- **Q:** *"how do I change my password, language and sign-in security?"*
- **Modules:** `M2 §Business rules` (MFA optional for admin/payroll roles), `M13 §API` (`…/me`),
  `M13 §Business rules` (i18n), `§8 Auth hardening`.
- **Must contain:** change password; MFA enrol/disable (forced-on for admin/payroll roles); language
  EN/हिन्दी; theme; active sessions / sign out everywhere; own login audit (`§8`).
- **Must NOT contain:** profile/personal-data edits (HR-owned — `M3 §Permissions`); document uploads
  (`M4 §Business rules` #2); role or scope changes (GA-04/GA-05).
- **States:** idle · saving · password-policy violation · MFA enrol pending · MFA required by policy
  (cannot disable) · session-revoked confirmation.
- **Scope:** always self. A Group Admin editing another user's security does it in GA-04.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Change password** · card | any (self) | knows current password | current, new, confirm; policy shown live (`§8`) | password updated; **all other sessions revoked**; audited; notification sent (`M14`) | wrong current password; policy failure (reasons listed, not just "invalid"); reuse of a recent password | no — but a new change reverses it | no |
| **Enable MFA** · card | any (self) | not already enrolled | method: TOTP app / SMS; **default TOTP**; recovery codes issued once | MFA active from next sign-in; recovery codes shown **once** with an explicit "save these now"; audited | enrolment code mismatch; SMS delivery failure | yes, unless policy-forced | no |
| **Disable MFA** · card | any (self) whose role does **not** force MFA | MFA enrolled **and** role is not admin/payroll (`M2 §Business rules`) — otherwise **shown disabled** with "your role requires MFA" | confirm + re-authenticate | MFA removed; audited; notification sent | policy-forced → refused with reason | yes | no |
| **Regenerate recovery codes** · card | any (self) | MFA enrolled | confirm | old codes invalidated immediately | — | no (old codes gone) — needs explicit confirm | no |
| **Sign out everywhere** · card | any (self) | ≥1 other session | confirm | all refresh tokens revoked; current session optionally kept (**default: keep this one**) | — | no | no |
| **Revoke one session** · row | any (self) | session is not the current one | — | that device is signed out | already expired → row disappears | no | no |
| **Switch language** · card | any (self) | — | `English` / `हिन्दी`; **default English** | whole UI switches; stored on the profile and synced to mobile | — | yes | no |
| **Switch theme** · card | any (self) | — | light / dark; **default light** (`DESIGN.md §Theme` — deliberately not `prefers-color-scheme`) | applied immediately | — | yes | no |
| **View my login history** · card | any (self) | — | last 30 days **default** | read-only list of sign-ins with device/IP-class | — | n/a | no |

**Non-happy paths:** password change while a payroll run is mid-approval → allowed, but the run's approval
token must not be invalidated silently; the maker-checker state lives on the record (`§6.9 PayrollRun`), not
the session. Employee has no phone on file and chooses SMS MFA → route to "ask HR to add your number"
(they cannot self-edit contact data — `M3 §Permissions`). **Conflict flag:** contact details are
HR-owned, which means a staff member cannot fix their own MFA phone; the spec offers no self-service
correction path. See §11.

---

# 2 · Public / token-authenticated screens (no role)

No seat, no rail. Real designed surfaces that are routinely forgotten.

### PUB-01 · Careers listing — MVP · destination
- **Q:** *"what jobs are open at this school?"*
- **Modules:** `M5 §API` (public `POST /careers/{posting}/apply` implies a public posting surface),
  `§6.5 JobPosting` (`channel=career_site`, `published_at`, `closes_at`), blueprint §11 "Career portal +
  job posting/syndication **[MVP]**".
- **Must contain:** open postings (title, campus, staff category, closing date); campus + category filters;
  school branding; link to PUB-02.
- **Must NOT contain:** headcount, `budget_ctc`, justification or approval chain (internal — `§6.5
  Requisition`); applicant counts; any employee data.
- **States:** empty ("no openings right now") · loading · error · closed posting (readable, not applicable) ·
  overflow/pagination.
- **Scope:** tenant-branded; a group lists all campuses' postings.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **View a posting** · row | public | posting `published_at` ≤ now | — | posting detail (description, category, campus, closing date) | closed/unpublished → readable page stating it has closed | yes | no |
| **Apply** · posting detail primary | public | posting open (`closes_at` > now) — otherwise **shown disabled** with "applications closed on …" | — | routes to PUB-02 with the posting bound | — | yes (abandon) | no |
| **Filter postings** · card header | public | — | campus (all **default**), staff category, department, posted-within | filtered list; shareable URL | — | yes | no |
| **Share posting** · row menu | public | posting open | copy link | — | — | yes | no |

**Non-happy paths:** the requisition behind a posting is closed while a candidate is reading it
(`§6.5 Requisition.status=closed`) → the posting must stop accepting applications and say so, not 500.
Tenant on a custom domain vs subdomain (`§7 Tenancy`) — branding must resolve without a tenant query
parameter.

---

### PUB-02 · Job application form — MVP · task
- **Q:** *"how do I apply for this?"*
- **Modules:** `M5 §API` (`POST /careers/{posting}/apply`), `§6.5 Candidate` (name, email, phone,
  resume_ref, qualifications JSON, source), `M5 §Business rules` (eligibility screening).
- **Must contain:** identity + contact; resume upload (REST file edge, `§7`); **structured qualification
  entry** (degree, B.Ed, TET/CTET/NET/SET) because eligibility screening reads it; DPDP consent capture
  (`§8 Consent & retention`); confirmation with a reference.
- **Must NOT contain:** an eligibility *verdict* (ineligible candidates are **marked, not silently dropped**
  — `M5 §Business rules`; a verdict here pre-empts the recruiter); account creation; salary-expectation as
  a required field (not in the entity).
- **States:** blank · validating · uploading · file too large/wrong type · duplicate candidate detected
  (`§6.5` de-duplicated pool) · posting closed mid-submission · submitted.
- **Scope:** none.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Upload résumé** · form | public | posting open | PDF/DOC/DOCX; size cap; **one file** | stored to object storage encrypted (`§8 Encryption`); `resume_ref` set on submit | wrong type / too large / virus-scan fail → named reason, other fields survive | yes (replace before submit) | no |
| **Add a qualification** · repeating field | public | — | type: `degree · B.Ed · TET · CTET · NET · SET · other` (drives `M5 §Business rules` screening); institution; year; percentage/grade; certificate upload optional | appended to `qualifications` JSON (`§6.5 Candidate`) | — | yes (remove before submit) | no |
| **Give consent** · form | public | — | explicit opt-in checkbox, **default unchecked**; retention period stated (`§8 DPDP`) | consent + lawful basis recorded with the application | unchecked → submit **disabled** with the reason | withdrawable later `[proposed]` — the spec names DPDP data-access/correction requests but defines no candidate-side withdrawal surface | no |
| **Submit application** · primary | public | required fields valid; consent given; posting open | — | `Candidate` created or **matched to an existing one by email/phone** (dedup, `§6.5`); `Application` created at stage `applied` (`§6.5 Application.stage`); `source` recorded; recruiter notified (`M14`); confirmation with a reference number | posting closed between load and submit → clear message + suggest similar openings, input preserved; duplicate application for the same posting → "you have already applied on <date>" rather than a second row | **not** withdrawable in MVP `[proposed gap]` — see §11 | no |
| **Save and finish later** · secondary · **`[proposed]`** | public | — | emailed resume-link token | draft retained | — | yes | no — reason: the entity model has no draft application; proposed only because résumé upload on a phone is fragile |

**Non-happy paths:** candidate applies to two postings → one `Candidate`, two `Application` rows; the UI must
not create a second candidate profile. Candidate has no email (common for support staff) → phone-only path
must exist or the field must be honestly optional; **flag** — `§6.5 Candidate` lists both email and phone
without saying which is mandatory (see §11).

---

### PUB-03 · Pre-boarding document upload — MVP · task
- **Q:** *"the school asked me for papers before I join — where do I send them?"*
- **Modules:** blueprint §8 "Digital pre-boarding with secure document-upload links **[MVP]**";
  `M4 §Business rules` #1; `M6 §Workflow` (document capture).
- **Must contain:** tokenised link (no login — the joiner is pre-`User`, `§6.2 User.employee_id` nullable);
  requested document list with due dates; per-item upload; submitted confirmation.
- **Must NOT contain:** any view of the staff record; a "verified" claim (verification is HR's —
  `M4 §Business rules` #4); the ability to add documents nobody asked for.
- **States:** valid · expired · already submitted · partially submitted · upload error · revoked.
- **Scope:** token-scoped to one joiner.
- **`[proposed]`** surface model (token): the joiner has no `User` by definition, so no authenticated route
  exists. Blueprint tags the capability MVP; the dev spec never describes the surface.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Upload a requested document** · row | joiner (token) | token valid; that item not yet submitted | file per requested `doc_type` (`§6.4`); optional issued-on / expires-on if the type carries expiry | lands as a **response**, not a live `StaffDocument` (`M4 §Business rules` #3); HR notified | expired token → "ask HR for a new link"; oversize/wrong type named | yes, until HR verifies (re-upload supersedes) | yes — **HR verification** before it becomes the record (`M4 §Business rules` #4) |
| **Submit all** · page primary | joiner (token) | ≥1 uploaded | — | requests move to `submitted`; HR queue updated (HR-09) | partial upload failure → per-item state, no all-or-nothing loss | no (HR now owns it) | yes |
| **Request more time** · secondary · **`[proposed]`** | joiner (token) | item overdue | free-text reason | notifies HR; HR may extend `due_date` | — | n/a | no — reason: `§6.4 DocumentUpdateRequest.due_date` exists but no extension flow is specified |

**Non-happy paths:** link forwarded to the wrong person → single-use-per-device is **not** specified; treat
the token as bearer and keep the surface data-free (this is why "no view of the staff record" is a hard
rule). Joiner uploads the wrong document type → HR rejects with reason and re-requests (`M4 §Workflow`
`Rejected --> Open`). Offer withdrawn after upload → token revoked; uploaded files retained under the
retention policy (`§8`).

---

### PUB-04 · Offer acceptance — MVP · task
- **Q:** *"do I accept this offer?"*
- **Modules:** `§6.5 Offer` (ctc, pay_group_id, join_date, `status draft/sent/accepted/declined/expired`,
  letter_ref, accepted_at), `M5 §API` (`…/offers/{id}/accept`), `M5 §Business rules` (digital acceptance).
- **Must contain:** the offer letter artefact; CTC, join date, campus, designation; accept / decline with
  reason; expiry date; acceptance receipt.
- **Must NOT contain:** the salary-structure component breakdown (internal — `§6.9`); counter-offer or
  negotiation (not in the entity); other candidates; interview scorecards.
- **States:** sent (actionable) · accepted (read-only receipt) · declined · expired · superseded by a
  revised offer.
- **Scope:** token-scoped to one Application. Token model **`[proposed]`** (no candidate account exists).

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Accept offer** · page primary | candidate (token) | `status=sent` and not past expiry — otherwise the control is **shown disabled** with the reason | typed full name as signature `[proposed]`; confirm join date (read-only in MVP) | `status=accepted`, `accepted_at` set; **auto-creates `Employee` + `EmploymentContract` and carries candidate documents into `StaffDocument` as `source=ats_import, verification_status=pending`** (`M5 §Business rules`, `§6.5 (conversion)`); onboarding tasks raised (M6); HR + Principal notified; audited | expired between load and click → refuse with "this offer expired on …, contact HR"; already accepted → show the receipt | **no** — this creates an employment record. Needs an explicit confirm step naming CTC + join date | no — but the *conversion review* (HR-21) is where HR confirms the created record |
| **Decline offer** · secondary | candidate (token) | `status=sent` | reason: `accepted another offer · compensation · location · personal · other` + free text; **no default** | `status=declined`; application closed; recruiter notified; requisition headcount released | — | no (a new offer must be issued) — confirm required | no |
| **Download offer letter** · page header | candidate (token) | `letter_ref` present | PDF | — | artefact missing → "contact HR" | n/a | no |
| **Ask a question** · secondary · **`[proposed]`** | candidate (token) | `status=sent` | free text to the recruiter | recruiter notified | — | n/a | no — reason: without it, the only paths are accept or decline, which is a poor real-world model |

**Non-happy paths:** offer revised after sending → the old token must show "this offer was superseded"
rather than accepting a stale CTC. Candidate accepts, then never joins → the created `Employee` exists;
`M6`/`M3` need a "joiner did not report" path (**flag**: not specified — see §11). Two devices open the same
token and both accept → idempotency key required (`§7 Concurrency`), second click returns the same receipt.

---

### PUB-05 · Student / parent 360° feedback form — ~~MVP~~ → **Later** · task · **`[proposed]`**
- **Retagged 2026-08-11 (user ruling, amendment A).** Student/parent 360° feedback is **out of MVP**.
- **Why:** the product has **seven seed roles** (`M2 §Seed roles`) — no student, no parent. Collecting this
  input would require minor-facing accounts and **verifiable parental consent under DPDP** (`§8 Consent &
  retention`, `§8 Child-safety`) — a large, legally loaded expansion for one appraisal input.
- **What stays MVP in M17:** classroom observation (DH-08), peer review, and **student-result/outcome
  linkage** (an aggregate academic signal, not a person's feedback).
- **Data model unchanged:** `§6.12 AppraisalRating.source` keeps `self/manager/peer/student/parent` so the
  provenance exists if such ratings ever arrive via SIS import; **MVP writes only `self`, `manager`, `peer`**.
- **Actions:** none in MVP. When built, it will need a token surface, an anonymity model, a consent
  record, and a window state (`AppraisalCycle.status`) — all currently unspecified.

---

# 3 · Employee

The least dense role by design (`DESIGN.md` principle 5). Mobile (Flutter) is the primary client for
EMP-01/02/03/05/06/07/11/13/15 (`M13 §Purpose` — phone-first); web is at parity.

### EMP-01 · Home — rank 1 · MVP · destination · **BUILT (v3)**
- **Q:** *"what needs me today?"*
- **Modules:** `M13 §Purpose`, `M9 §Business rules`, `M8`, `M4 §Workflow`, `M14`, `M17 §Workflow`, `M15.1`.
- **Must contain:** today's attendance state **with provenance** (`DESIGN.md` principle 6 — "biometric ·
  Gate 2 · eSSL K30"); an **action-needed band** (open `DocumentUpdateRequest`, open self-appraisal,
  expiring document); latest payslip net with run provenance; leave balance as shape-then-number
  (principle 3); approval counts **only if this employee is also an approver** (role-filtered rail).
- **Must NOT contain:** a table duplicating a nav destination (principle 1 — the attendance log is EMP-02);
  an Edit-document button (principle 9 / `M4 §Business rules` #2); permanent empty-state cards; salary
  structure; team data.
- **States:** first-run (new joiner) · loading · error · nothing-needs-you (designed calm) · payroll month
  not yet released · on leave today · holiday/weekly-off · contract expiring.
- **Scope:** always self.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Punch in / out** · hero card primary | Employee (self) | mobile or web punch enabled for the campus; within/near shift window (`§6.8 Shift`, grace) — outside it the control stays **enabled but warns**, since late punches are legitimate and reconcile as `late` | none on Home (the full flow with geo+selfie is EMP-03) | creates/updates today's `AttendanceRecord` (`§6.8`); Home state flips with provenance | geo/camera denied → routes to EMP-03 with the reason; already punched → shows the recorded time instead of a second write | no (correct via EMP-04 regularization) | no |
| **Respond to document request** · action band | Employee (self) | ≥1 `DocumentUpdateRequest` with `status=open` (`M4 §Workflow`) | — | routes to EMP-11 | request cancelled meanwhile → band disappears with a note | yes (abandon) | yes — HR verifies |
| **Apply for leave** · quick action | Employee (self) | always | — | routes to EMP-06 | — | yes | yes — approval chain |
| **Open latest payslip** · money card | Employee (self) | ≥1 released payslip | — | routes to EMP-07 | month not released → card shows "not released yet", **never a provisional net** (`DESIGN.md` principle 4 — a wrong-looking number destroys trust) | n/a | no |
| **Start self-appraisal** · action band | Employee (self) | an `AppraisalCycle` is `open` and a self review is pending (`M17 §Workflow`) | — | routes to EMP-17 | window closed meanwhile → band shows "the window closed on …" | n/a | no |
| **Dismiss an action-needed item** · band row menu | Employee (self) | item is informational (expiry notice), **never** for an open HR request — that control is **hidden** for governance-bearing items (principle 9) | — | hides for 7 days | — | yes | no |
| **Switch language** · shell header | Employee (self) | — | EN / हिन्दी; **default English** | whole UI switches | — | yes | no |

**Non-happy paths:** brand-new joiner with no attendance, no payslip, no balances → a designed first-run
Home that says what will appear, not four empty cards (principle 7). Biometric device offline → today's
state must read "not yet received from the device", **distinct from absent** (`M16 §Acceptance`). Employee
is mid-exit (`status=notice`) → show F&F progress instead of a payroll card `[proposed]`. Session expires
while reading → re-auth modal preserves the route.

---

### EMP-02 · My attendance — rank 2 · MVP · destination · **IN PROGRESS**
- **Q:** *"what's my record?"*
- **Modules:** `§6.8 AttendanceRecord`, `M9 §Business rules` (status set, worked_hours, paid-days),
  `M13 §Purpose`.
- **Must contain:** month calendar/timeline by status (`present · absent · half_day · leave · holiday ·
  weekly_off`); first_in/last_out and worked hours; **source provenance** per day (`§6.8 source`); totals
  that sum to the paid-days inputs (principle 4); exception days flagged with a route to EMP-04; month
  switcher.
- **Must NOT contain:** the punch action (EMP-03); the regularization form (EMP-04); team attendance
  (DH-03); the payroll paid-days *decision* (PY-08 — shown here only as a locked read-out once approved).
- **States:** loading · empty (pre-joining) · error · today in progress (no `last_out`) · missing punch ·
  regularization pending/rejected · month locked by an approved run (`§6.9 Payslip.is_locked`) · offline
  cached (`§9`).
- **Scope:** always self.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Change month** · page header | Employee (self) | month ≥ date of joining | month picker; **default current month**; months before DOJ **disabled** with "you joined on …" | reloads the month; URL carries the month | future month → shows the calendar with no records rather than an error | yes | no |
| **Open a day** · calendar cell / row | Employee (self) | day exists in range | — | detail panel: punches with times, source (`biometric · mobile · web`), device/gate where known, geo-verified mark, shift + grace applied, computed status and **why** | no record for the day → panel states "no punch received" and offers *Request regularization* | yes | no |
| **Request regularization** · day detail panel | Employee (self) | day is not locked by an approved payroll run; no pending request already on that day; within the correction window `[proposed]` (the spec sets no window) | — | routes to EMP-04 with the day bound | locked month → **shown disabled** with "this month was paid on <date> — raise a helpdesk ticket" | n/a | yes — manager approval (`M9 §Acceptance`) |
| **Filter by status** · card header | Employee (self) | — | all **default** · present · absent · half-day · leave · holiday · weekly-off · exceptions-only | filtered list; totals recompute for the filter but the **month totals stay visible** (principle 4 — figures in a set must sum) | — | yes | no |
| **Download my attendance** · page header | Employee (self) | ≥1 record in range | PDF / CSV; **default PDF**; range **default current month** | file generated; export audited (`§8` role-scoped exports) | large range → queued with a notice | n/a | no |
| **View provenance** · day detail | Employee (self) | record has a source | — | shows device family/gate for biometric (`M16 §Business rules`), "geo-verified" for mobile — **never raw coordinates or the selfie** back to the employee `[proposed]` privacy stance | — | n/a | no |

**Non-happy paths:** biometric ingestion lagging → days show "awaiting device sync", not absent
(`M16 §Acceptance`). Employee transferred mid-month between campuses → two shift contexts in one month
(**flag**: inter-branch transfer is P2 but the *display* problem exists in MVP if a campus changes). Leave
approved retroactively → the day flips from `absent` to `leave`; show the change with its provenance rather
than silently rewriting history. Month locked → everything read-only with the run reference.

---

### EMP-03 · Mark attendance — rank 3 · MVP · task
- **Q:** *"can I clock in from here, right now?"*
- **Modules:** `M9 §Business rules` (mobile geo+selfie, web), `§6.8 AttendanceRecord` (geo, selfie_ref,
  source), `M13 §Business rules` (offline tolerance), `§9 Mobile offline`.
- **Must contain:** in/out action; live location + geo-fence verdict; selfie capture (anti-proxy, blueprint
  §2 MVP); shift context and grace; confirmation with the **exact recorded time**; offline-queued indicator.
- **Must NOT contain:** history (EMP-02); manual time entry (that is a regularization — EMP-04); anyone
  else's location.
- **States:** ready · acquiring location · outside geo-fence · location denied · camera denied · already
  punched in · after shift end/grace · holiday or weekly-off (confirm intent) · offline queued · sync
  conflict · device clock skew.
- **Scope:** always self.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Punch in** · page primary | Employee (self) | no open punch today; location + camera permissions granted (or the campus policy allows web punch without them) | selfie **required by default** where the campus enables anti-proxy; note field optional | `AttendanceRecord.first_in` set with `source`, `geo`, `selfie_ref`; confirmation shows the exact stored time; nightly reconciliation later assigns status (`M9 §Workflow`) | outside geo-fence → **blocked by default** with the distance and a "request regularization instead" route `[proposed default]` — the spec defines geo-fencing but not whether an out-of-fence punch is blocked or flagged (see §11); permissions denied → explain what is needed and offer the web/desk alternative | **no** — a punch is a fact; corrections go through EMP-04 | no |
| **Punch out** · page primary | Employee (self) | an open `first_in` exists today | optional note | `last_out` + `worked_hours` computed | already punched out → shows the recorded time, no double write (idempotent) | no | no |
| **Retake selfie** · capture step | Employee (self) | camera available; before submit | front camera **default** | replaces the pending image (not yet stored) | camera busy/denied | yes, before submit | no |
| **Punch offline** · automatic | Employee (self) | no connectivity | queued locally with the device timestamp | queued item shown explicitly; syncs on reconnect (`§9 Mobile offline`) | sync conflict (server already has a punch) → keep the server record, tell the user, offer regularization | queued item can be cancelled before sync | no |
| **Switch to web punch** · secondary | Employee (self) | campus allows `source=web` (`§6.8`) | — | records with `source=web` and no geo/selfie | campus disallows → **hidden** | no | no |

**Non-happy paths:** punching on a holiday/weekly-off → allowed with a confirm, and it becomes comp-off
evidence (`M8 §Business rules` — "comp-off for holiday work"). Device clock ahead/behind → the **server**
timestamp is authoritative; show both if they differ. Two devices punch simultaneously → idempotency key,
one record. Employee on approved leave punches in → allow, flag the conflict for HR (`M9 §Business rules`
reconciliation), do not silently overwrite the leave.

---

### EMP-04 · Request regularization — rank 9 · MVP · task
- **Q:** *"this day is wrong — can it be fixed?"*
- **Modules:** `§6.8 Regularization` (attendance_id, requested_status, reason, approval_chain, status),
  `M9 §Acceptance`, `M13 §Purpose`.
- **Must contain:** the day and its computed status; the requested status; a **required** reason; optional
  evidence; the approval chain that will see it; submit.
- **Must NOT contain:** setting the final status directly; bulk correction across staff (HR-30); another
  employee's day.
- **States:** eligible · already requested · approved · rejected with reason · day locked by an approved run
  · outside the correction window.
- **Scope:** always self.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Submit regularization** · page primary | Employee (self) | day not locked; no pending request on that day | `requested_status`: `present · half_day · leave · weekly_off · holiday` (from `§6.8 AttendanceRecord.status`; `absent` is not a request anyone makes); requested in/out times where the status is `present`/`half_day`; reason **required** (free text + a category picker `[proposed]`: missed punch · device failure · on official duty · field work · medical · other); attachment optional | `Regularization` created `status=pending`; approval task to the Dept Head (`M9 §Acceptance`); notification (`M14`); audited | locked month → refused with the run reference; duplicate pending request → points at the existing one | **yes — withdraw while pending** (`[proposed]`: the spec lists no withdraw endpoint but `LeaveRequest` has `/cancel`, so parity is reasonable — see §11) | **yes — manager approval** |
| **Withdraw request** · detail panel · **`[proposed]`** | Employee (self) | `status=pending` | confirm | request cancelled; approver's queue updated | already actioned → "your manager already decided this" | n/a | no |
| **Attach evidence** · form | Employee (self) | before submit | image/PDF, size-capped | stored encrypted (`§8`) | oversize/type → named reason | yes before submit | no |
| **Cancel** · secondary | Employee (self) | always | confirm if content typed | returns to EMP-02, **draft preserved** | — | yes | no |

**Non-happy paths:** the manager is on leave → escalation path is **not specified for regularization**
(`M8 §Workflow` has escalation for leave only) — **flag**, see §11. Payroll runs while the request is
pending → the run uses the current record; the approved correction then needs an **arrears adjustment**
(`M10 §Arrears`) rather than a rewrite of a locked month. Employee requests a correction for a day before
joining → blocked.

---

### EMP-05 · My leave — rank 4 · MVP · destination
- **Q:** *"how much leave do I have, and what happened to it?"*
- **Modules:** `§6.7 LeaveBalance/LeaveRequest`, `M8 §Business rules` (academic-year keyed, vacation-staff
  gating), `M7` (holiday context).
- **Must contain:** balance per leave type for the **academic year** (opening/accrued/used/balance) as
  shape-then-number; request history with status and approver; the campus holiday calendar for context;
  the vacation-staff explanation where EL does not accrue (`M8 §Acceptance`).
- **Must NOT contain:** the application form (EMP-06); team leave (DH-02); leave policy configuration
  (HR-26); another academic year without an explicit switch.
- **States:** loading · empty (new joiner) · error · zero balance · vacation-staff (EL not applicable —
  glossed, not blank) · AY boundary/carry-forward pending · pending/approved/rejected/cancelled requests.
- **Scope:** always self.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Apply for leave** · page primary | Employee (self) | at least one `LeaveType` applies to this employee (`§6.7 applies_to_vacation_staff`) | — | routes to EMP-06 | no applicable type (rare) → explains why, points to HR | yes | yes — approval chain |
| **Switch academic year** · page header | Employee (self) | ≥1 AY with balances (`§6.6 AcademicYear`) | AY picker; **default the `is_current` AY** (`M7 §Business rules`) | reloads the ledger for that AY | pre-joining AY → empty with an explanation | yes | no |
| **Open a request** · row | Employee (self) | — | — | detail: dates, day_count, half-day flag, type, reason, **full approval chain with timestamps**, LOP consequence if any | — | yes | no |
| **Cancel a request** · row menu / detail | Employee (self) | `status` is pending **or** approved-but-not-yet-started (`M8 §API` `/cancel`) | confirm; reason optional | request cancelled; **balance restored**; any `AttendanceRecord` already marked `leave` reverts (`M8 §Workflow`); approver notified; audited | leave already commenced or the month is locked → **shown disabled** with the reason | this **is** the reversal; cancelling a cancelled request is not possible | no |
| **View leave-type rules** · balance card menu | Employee (self) | — | — | shows accrual rule, carry-forward cap, encashable flag, half-day allowed, whether it applies to vacation staff (`§6.7 LeaveType`) — this is the anti-confusion surface for the vacation-staff model | — | n/a | no |
| **Download leave statement** · page header | Employee (self) | ≥1 record | PDF; range **default current AY** | file; export audited | — | n/a | no |

**Non-happy paths:** employee is vacation staff and expects EL → the card must **explain** rather than show
a zero (`M8 §Acceptance`, `DESIGN.md` principle 7). AY rolled over but balances not yet initialised → say
"your new year's balances open on <date>", not zero. Comp-off earned but not credited → surface the pending
comp-off with its source day. Request approved while the employee is viewing → live state change with a
toast, not a stale row.

---

### EMP-06 · Apply for leave — rank 8 · MVP · task
- **Q:** *"can I take these days off?"*
- **Modules:** `M8 §Workflow` (validate → route → approve → escalate), `M8 §Business rules` (balance,
  blackout term, vacation-staff rule, half-day, comp-off), `M8 §Acceptance`.
- **Must contain:** applicable leave types only; date range with half-day toggle where `allows_half_day`;
  computed `day_count` excluding holidays/weekly-offs; a **live validation verdict**; resulting balance;
  an explicit **LOP warning** when the request will be unpaid; reason; approval-chain preview.
- **Must NOT contain:** an approve control; substitution/cover arrangement (**P2**, D2-deferred); balance
  editing.
- **States:** composing · validating · **blocked: blackout window** · blocked: insufficient balance (offer
  the LOP path) · blocked: type not applicable to vacation staff · overlapping request · submitting ·
  submitted · approved · rejected.
- **Scope:** always self.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Choose leave type** · form | Employee (self) | — | only types on the employee's `LeavePolicy` that pass `applies_to_vacation_staff` — spec-supported codes: `EL · CL · SL · COMP · DUTY · MAT · LOP` (`§6.7 LeaveType.code`), plus the education types the blueprint names as MVP (on-duty/exam-duty, study, sabbatical, paternity, bereavement, marriage — blueprint §3). **No default** — an unselected type prevents a wrong-type submission | balance and rules for that type load inline | a type with zero balance stays selectable but warns and shows the LOP path | yes | no |
| **Pick dates** · form | Employee (self) | type chosen | from/to date; **half-day** toggle only if `allows_half_day` with first-half/second-half; granularity is **full-day or half-day only — period-level leave is P2** (D2, `decisions-to-finalize.md`) | `day_count` computed excluding holidays + weekly-offs (campus calendar, `M7`); balance-after preview | past-dated beyond the policy window → warns; overlaps an existing request → blocks and links to it | yes | no |
| **See the validation verdict** · inline banner | Employee (self) | dates chosen | — | live check of balance · **blackout term** (`§6.6 Term.type=exam`) · vacation-staff rule (`M8 §Business rules`) | blackout → **blocked with the term name and dates**, plus "ask your principal for an override" route (PR-03) | n/a | n/a |
| **Submit** · page primary | Employee (self) | validation passes, or the employee explicitly accepts LOP | reason **required**; contact-during-leave field optional `[proposed]`; attachment (medical certificate) optional — **required** for SL beyond N days `[proposed]`, the spec sets no threshold | `LeaveRequest` created `status=pending` with `approval_chain` (`§6.7`); Dept Head notified (`M8 §Workflow`); on approval: **balance decremented, `AttendanceRecord` marked, LOP flagged if unpaid** (`M8 §Workflow`) — all of which happen at approval, **not** at submission; audited | blackout/overlap detected server-side after a stale client check → refuse with the reason, input preserved | **yes — cancel while pending or before it starts** (`M8 §API` `/cancel`) | **yes — Dept Head, escalating to Principal where policy requires** (`M8 §Workflow`) |
| **Apply as LOP instead** · inline offer | Employee (self) | balance insufficient | switches type to `LOP` | same flow; the **payroll consequence is stated in rupees-days terms before submit** (`M8 §Business rules` → paid-days) | — | yes | yes |
| **Save draft** · secondary · **`[proposed]`** | Employee (self) | — | — | draft retained locally | — | yes | no — reason: `§6.7 LeaveRequest` has no draft status |

**Non-happy paths:** leave spans an academic-year boundary → balances belong to different AYs
(`§6.7 LeaveBalance.academic_year_id`); **flag** — the spec does not say how a spanning request splits (see
§11). Applying for a vacation-period day as a teacher → the vacation term already covers it; explain rather
than deduct. Manager is the applicant → chain must skip to the Principal. Applying retrospectively for a
locked payroll month → allowed only as an arrears-bearing correction, or refused; **flag**, unspecified.

---

### EMP-07 · My payslips — rank 5 · MVP · destination
- **Q:** *"what was I paid, and why that much?"*
- **Modules:** `§6.9 Payslip/PayslipLine`, `M10 §Business rules` (locked payslips, password-protected PDF),
  `M13 §Purpose`.
- **Must contain:** month list with net (Indian lakh-crore grouped, tabular mono — principle 4); itemised
  lines by `earning · deduction · employer_contrib`; **paid-days and LOP days** as the proration basis;
  loan EMI line linked to EMP-19; reimbursement payout line where present; **run provenance**; password-
  protected PDF.
- **Must NOT contain:** Form 16 (EMP-08); investment declaration (EMP-09); the salary structure master
  (PY-03); anyone else's payslip.
- **States:** loading · empty · error · month not yet released (no provisional net) · locked/final ·
  arrears line present · F&F final payslip.
- **Scope:** always self.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Open a payslip** · row | Employee (self) | payslip released (run `approved`/`disbursed` — `§6.9 PayrollRun.status`) | — | full itemisation with employer contributions shown separately | run not yet approved → row reads "not released", **no figure** | yes | no |
| **Download PDF** · row / detail header | Employee (self) | payslip released | **password-protected** (`M10 §Business rules`); the password rule is stated on screen (e.g. PAN + DOB pattern) — **`[proposed]`**, the spec mandates protection but not the key | file served via the REST file edge (`§7`); download audited (`§8` access-logged) | artefact missing → "regenerating, try shortly"; forgotten password → explains the rule, never emails the password | n/a | no |
| **Explain a line** · line row | Employee (self) | line has a computable basis | — | shows the basis: component calc type (`flat/percent/formula` — `§6.9 PayComponent`), the paid-days proration, or the pinned `StatutoryConfig` version for PF/ESI/PT/TDS (`§4.4`) — **provenance for money** (principle 6) | — | n/a | no |
| **Compare with last month** · detail header | Employee (self) | ≥2 released payslips | — | line-by-line delta | only one payslip → **hidden** | n/a | no |
| **Query this payslip** · detail footer | Employee (self) | payslip released | pre-fills a helpdesk ticket with category `payroll` and the run reference (`M15.1`) | ticket raised (EMP-15 flow), SLA shown | helpdesk category not configured → generic HR category | n/a | no |
| **Download the year's payslips** · page header | Employee (self) | ≥1 in the FY | FY picker; **default current FY**; ZIP | queued and delivered in-app | large range queued | n/a | no |

**Non-happy paths:** payslip reissued after an arrears correction → **both** versions must remain visible
with the superseding relationship (`§4.3` effective-dating, `M10 §Arrears` append-only), never a silent
replacement. Exited employee → payslips remain accessible for the statutory retention window (`§8` —
"statutory-retention data survives exit") even though `User.is_active=false`; **flag**: the spec revokes
access on F&F completion (`M12 §Business rules`) while requiring retention — see §11. Mid-month joiner's
first payslip → paid-days explanation is mandatory, not optional.

---

### EMP-08 · My tax documents — rank 11 · MVP · destination
- **Q:** *"what do I need to file my taxes?"*
- **Modules:** `M11 §Business rules` (Form 16 Part A+B, Form 12BA), `§6.10 StatutoryFiling`,
  `M13 §Purpose`.
- **Must contain:** Form 16 by financial year (Part A + B); Form 12BA where perquisites exist; TDS deducted
  per month with challan reference; the regime in force (`§6.10 InvestmentDeclaration.regime`);
  password-protection notice.
- **Must NOT contain:** the declaration form (EMP-09); payslips (EMP-07); the employer's filing status
  (AC-04); another employee's certificate.
- **States:** loading · not yet issued for the FY (with expected date) · issued · superseded/revised Form 16
  · error · pre-first-FY employee.
- **Scope:** always self.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Download Form 16** · row | Employee (self) | the FY's Form 16 is `issued` (`§6.10 StatutoryFiling.status`) | Part A + Part B as one PDF **default**; parts separately as an option | password-protected download; access audited | not yet issued → **shown disabled** with the expected issue window (post-Q4 24Q) | n/a | no |
| **Download Form 12BA** · row | Employee (self) | perquisites exist for the FY (`M11 §Business rules`) | PDF | as above | no perquisites → row **hidden** (not disabled — it will never apply) | n/a | no |
| **View monthly TDS** · card | Employee (self) | ≥1 payslip in the FY | FY **default current** | month × TDS deducted, with the challan reference (`M11 §Business rules` — ITNS 281) | — | n/a | no |
| **Raise a tax query** · card footer | Employee (self) | — | pre-fills a helpdesk ticket, category `payroll` | ticket created | — | n/a | no |
| **View regime in force** · card | Employee (self) | a declaration exists for the FY | — | old/new with the election date; links to EMP-09 when the window is open | no declaration → default regime per `M11 §Business rules` (**new regime default**) stated explicitly | n/a | no |

**Non-happy paths:** revised Form 16 after a correction → show both with dates; the latest is primary
(append-only, `§4.2`). Employee joined mid-FY with previous employment → Form 16 covers this employer only;
say so, and **flag**: previous-employer income intake is not specified anywhere (see §11). Exited employee
needs Form 16 after access revocation → see the retention conflict noted in EMP-07.

---

### EMP-09 · Investment declaration — rank 12 · MVP · task
- **Q:** *"what am I declaring so my tax is right?"*
- **Modules:** `§6.10 InvestmentDeclaration` (financial_year, regime, declarations JSON, proofs),
  `M11 §Business rules` (TDS §192, old & new regime), `M13 §Purpose`, blueprint §4 MVP.
- **Must contain:** FY selector; **regime election** with the tax effect shown before committing;
  declaration heads with amounts; proof upload per head; declared-vs-proved state; window dates; the
  resulting monthly TDS estimate.
- **Must NOT contain:** approving one's own declaration; another employee's; the reviewer's internal notes
  (AC-07); statutory slab administration (GA-07).
- **States:** window open · window closed (read-only) · proofs pending · proof rejected with reason ·
  locked after Q4/24Q preparation · regime locked for the FY.
- **Scope:** always self.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Elect a regime** · form | Employee (self) | declaration window open for the FY | `old` / `new`; **default `new`** (`M11 §Business rules` — new regime default); side-by-side tax comparison shown before committing | `regime` saved; monthly TDS recomputes from the next run; audited | locked FY → **shown disabled** with "the election closed on …" | yes, **while the window is open**; permanent afterwards — confirm required | no |
| **Declare an amount** · head row | Employee (self) | regime `old` (most heads do not apply under `new`) — under `new`, inapplicable heads are **hidden**, not disabled | heads driven by the pinned `StatutoryConfig` rules (`§4.4` — **never hardcoded slab/limit constants**); amount `Decimal`; per-head cap shown | saved as a declaration; TDS estimate refreshes | amount over the statutory cap → warns and caps the *benefit*, not the input | yes while open | no |
| **Upload proof** · head row | Employee (self) | declaration exists for that head; proof window open | file per head; multiple allowed | proof stored encrypted; state → proofs-submitted; reviewer queue updated (AC-07) | oversize/type named; window closed → disabled with the date | replaceable until reviewed | **yes — reviewer verification** (AC-07) |
| **Submit declaration** · page primary | Employee (self) | window open | confirm | declaration finalised for the period; payroll picks it up from the next run; audited | — | yes while the window is open | no |
| **Withdraw a head** · head row menu | Employee (self) | not yet verified | confirm | removed; TDS re-estimates | already verified → disabled | yes | no |
| **See my TDS estimate** · summary card | Employee (self) | ≥1 payslip in the FY | — | projected annual tax vs deducted-to-date vs remaining months (uses the **pinned** config version, `§4.4`) | — | n/a | no |

**Non-happy paths:** window closes while the employee is mid-form → save what exists, tell them clearly,
route to helpdesk. Proof rejected in March with no time to re-submit → the TDS true-up lands in the final
run (`M11`) — the screen must say so. Employee elects `old` but never uploads proofs → the payroll engine
falls back per policy; **flag**: the fallback rule is unspecified (see §11).

---

### EMP-10 · My documents — rank 6 · MVP · destination
- **Q:** *"what does the school hold on me, and is any of it about to lapse?"*
- **Modules:** `M4 §Business rules` (HR-owned, no employee write path), `§6.4 StaffDocument`,
  `M14 §Business rules` (expiry alerts).
- **Must contain:** documents by type with `verification_status` as **mark + word, never colour alone**
  (principle 8); issue/expiry dates with an expiring-soon mark; `source` (`hr_upload · ats_import ·
  request_response`); view/download; **open `DocumentUpdateRequest` as an action band** → EMP-11.
- **Must NOT contain:** **any Edit, Replace, Delete or Upload control** (`M4 §Business rules` #2; principle
  9); verification actions; another employee's documents; internal rejection notes.
- **States:** loading · empty · error · expiring within lead time · **expired** · pending verification ·
  rejected with reason · request open · request submitted.
- **Scope:** always self.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **View / download a document** · row | Employee (self) | document exists and is not access-restricted (`§8 Child-safety` — police/background-verification records are access-restricted; **flag**: whether the *subject* may view their own is unspecified, see §11) | — | opens the file; access is **logged** (`§8 PII classification` — access-logged) | restricted type → row shows the metadata with the file **hidden** and a reason | n/a | no |
| **Respond to a request** · action band / row | Employee (self) | a `DocumentUpdateRequest` with `status=open` exists for that type | — | routes to EMP-11 | request cancelled → band clears | yes | **yes — HR verifies** |
| **See why a document was rejected** · row | Employee (self) | `verification_status=rejected` | — | shows HR's reason (the employee-visible one) and whether a new request is coming | — | n/a | no |
| **Ask about a document** · row menu | Employee (self) | — | pre-fills a helpdesk ticket, category `hr` | ticket created | — | n/a | no |
| ~~Upload / Replace / Delete~~ | **nobody** — **hidden for the Employee role at every state** | — | — | — | — | — | governance: `M4 §Acceptance` — "an Employee calling any document write endpoint outside an open request → **403**" |

**Non-happy paths:** a document expired and no HR request has been raised → the screen must show "expired —
HR has been notified" (`M14 §Acceptance` — the alert goes to employee + HOD + HR), not leave the employee
with no path. ATS-imported documents sit `pending` for weeks → show the pending state honestly with the
date they arrived. Employee believes a document is wrong but HR has not asked for it → the **only** path is
a helpdesk ticket; this is a deliberate governance consequence, and the screen should say so plainly.

---

### EMP-11 · Respond to a document request — rank 7 · MVP · task
- **Q:** *"what does HR need from me, and how do I send it?"*
- **Modules:** `M4 §Workflow` (Open → Submitted → Verified/Rejected), `M4 §API`
  (`POST …/me/document-requests/{id}/respond` — upload only, only when `status=open`), `M4 §Acceptance`.
- **Must contain:** requested `doc_type`; HR's reason and `due_date`; the requester; upload control; an
  explicit statement that **the live document does not change until HR verifies**; submit; receipt.
- **Must NOT contain:** editing the live `StaffDocument`; a self-verify control; uploading an unrequested
  type; cancelling HR's request (`…/cancel` is HR's).
- **States:** open · uploading · submitted (read-only, awaiting HR) · verified · rejected with reason ·
  cancelled by HR · overdue.
- **Scope:** always self.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Upload response** · page primary | Employee (self) | request `status=open` — at any other status the control is **shown disabled** with the current state | file (PDF/JPG/PNG, size-capped); optional `issued_on` / `expires_on` where the type carries expiry (`§6.4`); note to HR optional | stored as `response_file_ref`; request → `submitted`; **live `StaffDocument` unchanged** (`M4 §Business rules` #3); HR verification queue updated (HR-09); HR notified; audited | wrong type/oversize named; request cancelled meanwhile → refuse with the reason and keep the file locally | replaceable **while still `open`**; once `submitted`, only HR can reopen | **yes — HR verification promotes it (`M4 §Business rules` #4)** |
| **Replace before submitting** · form | Employee (self) | `status=open`, file staged | — | replaces the staged file | — | yes | n/a |
| **Submit** · page primary | Employee (self) | a file is staged | confirm | as above | — | no (HR now owns it) | yes |
| **Ask HR a question** · secondary | Employee (self) | request open | pre-filled helpdesk ticket referencing the request | ticket created | — | n/a | no |
| ~~Verify / approve own document~~ | **nobody** — **hidden** | — | — | — | — | — | governance: verification is `documents.verify`, HR/admin only (`M4 §Permissions`) |

**Non-happy paths:** request overdue → escalate to HR and the HOD (`M14`), and the screen says who was told.
HR rejects and re-requests → the flow returns to `open` with the previous response visible for reference
(`M4 §Workflow` `Rejected --> Open`). Employee has no smartphone camera/scanner → the surface should accept
a photo, and the campus office remains a fallback (out of product scope, worth saying).

---

### EMP-12 · My reimbursement claims — rank 10 · MVP · destination
- **Q:** *"where are my claims?"*
- **Modules:** `M10 §Reimbursements`, `§6.9 ReimbursementClaim` (category, amount `Decimal`,
  tax_treatment, status, approval_chain, payroll_run_id), `M13 §Purpose`.
- **Must contain:** claims with category, amount, status (`draft · submitted · approved · rejected ·
  paid`), approver, and — when paid — **which payout batch / payroll run paid it** (principle 6);
  per-category tax treatment (`taxable · exempt · fbp`); category entitlement remaining.
- **Must NOT contain:** an approve control (`M13 §Acceptance` — cannot approve own); another employee's
  claims; the payout-batch composition (PY-16).
- **States:** empty · loading · error · draft · submitted · approved (awaiting payout batch) · rejected ·
  paid · claim window closed for the FY.
- **Scope:** always self.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **New claim** · page primary | Employee (self) | claim window open for the FY `[proposed]` (the spec defines no window; FBP is annual by nature) | — | routes to EMP-13 | window closed → disabled with the reason | yes | yes — approval, then payout maker-checker |
| **Open a claim** · row | Employee (self) | — | — | detail with lines, receipts, approval chain, and the paying run where `status=paid` | — | yes | no |
| **Withdraw a claim** · row menu | Employee (self) | `status` is `draft` or `submitted` (not yet approved) | confirm | claim withdrawn; approver's queue updated; audited | already approved → **shown disabled** ("approved on …, it will be paid in the next batch") | this is the reversal | no |
| **Edit a draft** · row menu | Employee (self) | `status=draft` | — | routes to EMP-13 with the draft loaded | — | yes | no |
| **Resubmit a rejected claim** · row menu | Employee (self) | `status=rejected` | — | opens a **new** claim pre-filled from the rejected one (append-only spirit — the rejected record stands) | — | yes | yes |
| **Filter** · card header | Employee (self) | — | status (all **default**), category, FY | filtered | — | yes | no |

**Non-happy paths:** claim approved but the payout batch slips a month → the screen must show "approved,
scheduled for the <month> payout" rather than an indefinite "approved". Category limit exhausted mid-year →
the remaining-entitlement figure must be visible **before** the employee spends. Employee exits with an
approved unpaid claim → it should land in F&F (`M12 §Business rules` lists loan recovery but **not**
reimbursement payables — **flag**, see §11).

---

### EMP-13 · New reimbursement claim — rank 13 · MVP · task
- **Q:** *"how do I claim this expense back?"*
- **Modules:** `M10 §Reimbursements`, `§6.9 ReimbursementClaimLine` (description, amount `Decimal`,
  receipt_ref encrypted, incurred_on), `M13 §Acceptance`.
- **Must contain:** category; itemised lines with amount + incurred date + **receipt per line**; running
  total in Decimal-safe money formatting; the tax treatment that will apply; policy limit check; submit with
  the approval chain shown.
- **Must NOT contain:** self-approval; payout scheduling; post-submission editing (supersede instead).
- **States:** composing · uploading · receipt too large/unreadable · over category limit · duplicate receipt
  suspected · submitting · submitted · draft saved.
- **Scope:** always self.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Choose category** · form | Employee (self) | — | `lta · medical · telephone · books_academic · fuel` (`§6.9 ReimbursementClaim.category`) — **no default**; the category drives `tax_treatment` (`taxable · exempt · fbp`) which is shown, not chosen | limit + tax treatment load inline | category not enabled for this employee's pay group → hidden | yes | no |
| **Add a line** · repeating row | Employee (self) | category chosen | description; amount (**`Decimal`**, `guard-money-float`); `incurred_on` date (not future); receipt file **required per line** | total recomputes; running total in Indian grouping (principle 4) | future date blocked; missing receipt blocks submit with the line named | yes (remove) | no |
| **Upload a receipt** · line | Employee (self) | line exists | image/PDF; multiple per line allowed | stored encrypted (`§6.9 receipt_ref(enc)`) | oversize/unreadable named; **duplicate receipt hash** → warns and names the earlier claim `[proposed]` control, justified by fraud risk | yes before submit | no |
| **Save draft** · secondary | Employee (self) | — | — | `status=draft` (`§6.9` includes `draft`) | — | yes | no |
| **Submit claim** · page primary | Employee (self) | ≥1 line, all with receipts; total within or explicitly over the limit | confirm; the approval chain is shown before the click | `status=submitted`; approver task created (DH-09); notification; audited | over-limit behaviour: **blocked or flagged per policy** — the spec says "configurable expense policies by category/role" (blueprint §13) but not the enforcement mode; default to **flag-and-route-up** `[proposed]` | **yes — withdraw while `submitted`** | **yes — approval (DH-09), then the payout batch requires a distinct checker** (`M10 §Reimbursements`) |
| **Cancel** · secondary | Employee (self) | — | confirm if content typed | draft preserved | — | yes | no |

**Non-happy paths:** phone upload fails on weak connectivity → lines must survive; queue the receipt.
Claim spans two FYs → the `incurred_on` date decides the FY; state it. Employee claims for a colleague →
not supported; there is no delegate model in `§6.9` (**flag**, see §11).

---

### EMP-14 · My helpdesk tickets — rank 14 · MVP · destination
- **Q:** *"did anyone answer my question?"*
- **Modules:** `§6.11 HelpdeskTicket/TicketComment`, `M15.1 §Business rules` (SLA/TAT), `M13 §Acceptance`.
- **Must contain:** tickets with category, subject, status (`open · assigned · in_progress · resolved ·
  closed · reopened`), **SLA due time and breach state**, assignee where disclosable; thread of
  non-internal comments; reopen on resolved tickets.
- **Must NOT contain:** **internal comments** (`§6.11 TicketComment.is_internal` — hidden from the raiser);
  others' tickets; assignment/priority controls (HR-31); others' grievance tickets (`M15.1 §Permissions`).
- **States:** empty · loading · error · awaiting-you · SLA breached · resolved · closed · grievance
  (confidentiality notice).
- **Scope:** always self, including one's own grievance tickets.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Raise a ticket** · page primary | Employee (self) | — | — | routes to EMP-15 | — | yes | no |
| **Open a ticket** · row | Employee (self) | ticket is the user's own | — | thread with **non-internal** comments only, SLA clock, assignee | — | yes | no |
| **Add a comment** · detail composer | Employee (self) | ticket not `closed` | text + attachment | comment appended (`is_internal=false` always for the raiser); assignee notified; **SLA clock may pause/resume per policy** (`M15.1 §Workflow`) | closed ticket → composer replaced by *Reopen* | no (comments are a thread, not editable) | no |
| **Reopen** · detail header | Employee (self) | `status=resolved` (and within the reopen window `[proposed]` — unspecified) | reason **required** | `status=reopened`; SLA restarts per policy; assignee notified; audited | `closed` beyond the window → offers a new linked ticket instead | this is itself the reversal | no |
| **Close / accept resolution** · detail header | Employee (self) | `status=resolved` | confirm | `status=closed`; audited | — | reopen may still be possible within the window | no |
| **Rate the resolution** · detail footer · **`[proposed]`** | Employee (self) | `status=resolved/closed` | 1–5 + comment | stored for helpdesk reporting | — | no | no — reason: SLA/TAT tracking is specified but satisfaction is not |
| **Filter** · card header | Employee (self) | — | status (open **default**), category, date | filtered | — | yes | no |

**Non-happy paths:** ticket auto-assigned to a queue with nobody on duty → SLA breach escalation fires
(`M15.1 §Business rules`) and the employee sees "escalated", not silence. Grievance ticket → the screen
must state the confidentiality handling and **must not** show the assignee if policy restricts it. Employee
raises a payroll ticket about a locked month → link the ticket to the run for the agent's context.

---

### EMP-15 · Raise a ticket — rank 15 · MVP · task
- **Q:** *"who do I ask about this?"*
- **Modules:** `M15.1 §Workflow` (raise → auto-assign), `M15.1 §Business rules` (configurable categories,
  auto-assignment, grievance restricted), `M13 §Purpose`.
- **Must contain:** category picker driven by the **configured** list (never hardcoded); subject + body;
  attachment; priority where policy allows; the **SLA that will apply**; a confidentiality notice for
  `grievance`.
- **Must NOT contain:** assignee selection; SLA override; prompts that invite PII into the body
  (`§8`; grievance bodies must never be logged).
- **States:** composing · category-specific fields · submitting · submitted with ID + SLA · attachment
  failure · duplicate-of-open-ticket suggestion.
- **Scope:** always self.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Choose category** · form | Employee (self) | — | from the tenant's configured categories — spec-named seeds: `it · hr · payroll · facilities · grievance` (`§6.11 HelpdeskTicket.category`, "configurable"); **no default**, because the category drives routing and SLA | shows the SLA and (unless restricted) the owning queue; `grievance` shows a confidentiality notice | category list unconfigured → falls back to `hr` with a warning to the admin | yes | no |
| **Set priority** · form | Employee (self) | tenant allows user-set priority `[proposed]` | low · normal **default** · high | affects `sla_due_at` per policy | policy forbids → **hidden** | yes | no |
| **Attach a file** · form | Employee (self) | — | image/PDF, size-capped | stored encrypted | oversize/type named | yes before submit | no |
| **Submit** · page primary | Employee (self) | category + subject + body present | — | `HelpdeskTicket` created `status=open` → **auto-assigned by category** (`M15.1 §Business rules`); `sla_due_at` computed; assignee notified; ticket ID + SLA shown; audited | auto-assignment finds no owner → assigned to the HR fallback queue and flagged to admins | **no** — use comments or a new ticket; withdraw is not in the state machine | no |
| **Use a suggested existing ticket** · inline | Employee (self) | a similar open ticket exists `[proposed]` | — | routes to that ticket instead of creating a duplicate | — | yes | no |

**Non-happy paths:** the employee's issue *is* the helpdesk (cannot sign in) → out of reach by definition;
SH-01's "contact HR" escape covers it. Grievance against the person the category auto-assigns to →
`M15.1 §Business rules` restricts grievance access but does not describe a conflict-of-interest reroute
(**flag**, see §11).

---

### EMP-16 · My goals — rank 16 · MVP · destination
- **Q:** *"what am I being measured on this cycle?"*
- **Modules:** `§6.12 Goal` (kind `kra/kpi/objective`, description, weight, target, self_rating,
  manager_rating, status), `M17 §Workflow`.
- **Must contain:** current `AppraisalCycle` name, `type` (`term/annual/probation`), window dates; goals
  with weights (summing to 100) and targets; acknowledgement state; the manager who set them.
- **Must NOT contain:** manager ratings before the stage releases them; the composite score; peers' goals;
  the increment recommendation (advisory and payroll-gated — `M17 §Business rules`).
- **States:** no active cycle · cycle `draft` · goals not set · awaiting my acknowledgement · cycle `open` ·
  `locked` · `closed` · weights invalid (surfaced read-only).
- **Scope:** always self.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Acknowledge goals** · page primary | Employee (self) | goals published and not yet acknowledged | confirm; optional comment | `Goal.status` → acknowledged; manager notified; audited | cycle locked before acknowledgement → recorded as unacknowledged, manager notified | no (a comment can follow) | no |
| **Propose a change** · goal row · **`[proposed]`** | Employee (self) | cycle `open`, goals not yet locked | comment on the goal | manager notified; the goal is unchanged until the manager edits it — **the employee never edits a goal** (`M17 §Permissions` — `appraisal.self` is self-rating scope) | — | yes | yes — manager acts |
| **Start self-appraisal** · page primary | Employee (self) | cycle `open` and the self stage is active | — | routes to EMP-17 | stage not open → **shown disabled** with the window dates | n/a | no |
| **View the rating matrix** · card menu | Employee (self) | cycle has a `rating_matrix` (`§6.12`) | — | shows the scale and descriptors so the employee rates on the same basis as the manager | — | n/a | no |
| **View previous cycles** · page header | Employee (self) | ≥1 closed cycle | cycle picker; **default current** | read-only history including the finalized composite | — | yes | no |

**Non-happy paths:** no cycle configured yet → a designed empty state naming who sets cycles (HR/Principal),
not "no data". Employee joined mid-cycle → show whether they are in scope (**flag**: `§6.12 AppraisalCycle`
has no eligibility rule — see §11). Manager changed mid-cycle → the goals stand; show both managers.

---

### EMP-17 · Self-appraisal — rank 17 · MVP · task
- **Q:** *"how do I rate my own year?"*
- **Modules:** `M17 §API` (`…/appraisal-reviews/self`), `M17 §Business rules` (self → manager → 360 →
  moderation; **append-only once submitted**), `§6.12 AppraisalReview.stage=self`.
- **Must contain:** each goal with the cycle's matrix scale; `self_rating` + comments per goal; evidence
  notes; a weighted self-composite preview; the window close date; an explicit "**submitting is final — a
  revision supersedes, it does not edit**".
- **Must NOT contain:** the manager's ratings; other 360° inputs; the moderated composite; the
  increment/promotion recommendation; an edit control after submission.
- **States:** window not open · draft · incomplete · submitting · submitted (read-only) · window closed
  before submission · superseded by a revision.
- **Scope:** always self.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Rate a goal** · goal row | Employee (self) | cycle `open`, self stage active, review not submitted | score from the cycle's `rating_matrix` (**never a hardcoded 1–5** — `§6.12 AppraisalCycle.rating_matrix`); comment **required on the extremes** `[proposed]` | draft saved; weighted preview updates | matrix missing → blocks with an admin-facing error, not a silent default | yes while draft | no |
| **Add evidence** · goal row | Employee (self) | draft | free text; attachment `[proposed]` (the entity carries comments, not files) | stored with the rating | — | yes while draft | no |
| **Save draft** · secondary | Employee (self) | cycle open | autosave **default on** | draft persisted | — | yes | no |
| **Submit self-appraisal** · page primary | Employee (self) | every goal rated | confirm dialog naming the finality (`DESIGN.md` principle 10 in spirit) | `AppraisalReview(stage=self)` → `submitted`; **append-only** (`M17 §Business rules`); manager's queue updated (DH-07); notification; audited | incomplete → names the unrated goals; window closed mid-submit → refuse, preserve the draft, escalate to HR | **no** — a revision **supersedes**, it never edits | no (the manager stage is the next pair of eyes, not an approval of this) |
| **Request a revision** · after submit · **`[proposed]`** | Employee (self) | submitted, cycle still `open` | reason | HR/manager decides; a new superseding review may be created | — | n/a | yes |

**Non-happy paths:** window closes with the review in draft → the manager stage proceeds without a self
rating; the screen must say what happens (**flag**: unspecified, see §11). Employee on long leave during
the window → no deferral mechanism in `§6.12`. Goals were never set → self-appraisal has nothing to rate;
block with a route to the manager.

---

### EMP-18 · My profile — rank 18 · MVP · destination
- **Q:** *"what does my record say?"*
- **Modules:** `M3 §Purpose` ("Employee (read-only self)"), `§6.3 Employee/EmploymentContract/
  ServiceRecord`, `M13 §API` (`…/me` profile **read**).
- **Must contain:** identity, designation, campus, department, staff category; contract facts
  (`employment_type`, `is_vacation_staff` **with a plain-language gloss**, `doj`, `confirmation_date`,
  `contract_end_date`); reports-to; **service book timeline** (`joined · confirmed · promoted ·
  transferred · revised · exited`); **masked** statutory IDs and bank account (`§8`); "to correct anything
  here, contact HR".
- **Must NOT contain:** edit controls of any kind (`M3 §Permissions` — `people.manage` is HR's); documents
  (EMP-10); salary/CTC (`§8 Field-level access`); unmasked Aadhaar/PAN/bank.
- **States:** loading · error · probation · confirmed · contract expiring (days remaining) · on notice ·
  vacation-staff gloss · missing statutory ID.
- **Scope:** always self.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Request a correction** · page header | Employee (self) | — | field picker (name, contact, address, bank, statutory ID) + the corrected value + reason | raises a **helpdesk ticket** (category `hr`) — **not** a direct edit; HR then edits in HR-04 and may raise a `DocumentUpdateRequest` for proof (`M4`) | — | ticket can be withdrawn | yes — HR performs the edit |
| **View my service book** · card | Employee (self) | ≥1 `ServiceRecord` | — | immutable career timeline with effective dates (`§6.3` — feeds gratuity) | empty for a brand-new joiner → shows `joined` only | n/a | no |
| **Reveal a masked ID** · field · **`[proposed]`** | Employee (self) | the ID belongs to the viewer | click-to-reveal, **default masked**; reveal is **access-logged** (`§8`) | shows the value for a few seconds | — | n/a | no |
| **Download my record** · page header · **`[proposed]`** | Employee (self) | — | PDF | a DPDP data-access response for the subject (`§8` — "data-access/correction requests") | — | n/a | no — reason: `§8` mandates data-access requests but names no surface; this is the employee half of GA-14 |
| ~~Edit profile~~ | **nobody at the Employee role** — **hidden** | — | — | — | — | — | governance: `M3 §Permissions` |

**Non-happy paths:** blueprint §9 line 213 says *"Profile/document self-update **[MVP]**"*, which
**directly contradicts** `M4 §Business rules` #2 and `DESIGN.md` principle 9. Treated here as a stale
blueprint line — see §10 Conflict C4. Employee's reports-to is vacant → show "not assigned" and route
approvals to the Principal.

---

### EMP-19 · My loans & advances — rank 19 · MVP · destination · **`[proposed]`**
- **Q:** *"how much do I still owe, and when does it end?"*
- **Modules:** `M10 §Loans`, `§6.9 Loan` and `LoanInstallment`.
- **Must contain:** active loans/advances with outstanding balance; the EMI schedule with each
  installment's status (`scheduled · deducted · waived · skipped`) and the payslip it landed on
  (`payslip_line_id` — provenance); the perquisite flag where interest is a perquisite; projected closure.
- **Must NOT contain:** sanction/approval controls; others' loans; foreclosure execution (`M10 §API`
  `/foreclose` is payroll's); the maker-checker gate.
- **States:** none (designed empty) · active · closed · foreclosed · installment skipped/waived ·
  outstanding balance flowing to F&F on exit.
- **Scope:** always self.
- **Why proposed:** the spec grants no ESS loan surface, but `M10 §Loans` puts an **EMI deduction on the
  payslip**, and principle 6 requires provenance for consequential money.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **View EMI schedule** · row | Employee (self) | a loan exists | — | installment list: `seq`, `due_period`, principal/interest split (`Decimal`), balance, status, the payslip line | — | n/a | no |
| **Apply for a loan / advance** · page primary · **`[proposed]`** | Employee (self) | tenant enables staff-initiated loans | kind: `loan · advance` (`§6.9 Loan.kind`); amount (`Decimal`); tenure months; reason; supporting document | creates a `Loan` at `status=pending_approval` with an `approval_chain`; HR/payroll notified | over the sanction limit → flagged | withdraw while pending | **yes — `payroll.approve` maker-checker** (`M10 §Loans`) |
| **Request foreclosure** · row menu · **`[proposed]`** | Employee (self) | loan `active` | — | raises a request to payroll; **the employee never executes it** | — | yes while pending | yes |
| **Download loan statement** · row menu | Employee (self) | a loan exists | PDF | — | — | n/a | no |

**Open question (blocking for the two `[proposed]` actions):** `§6.9 Loan` starts at
`status=pending_approval` with an `approval_chain` but the spec **never says who originates a loan** — the
employee, HR, or payroll. See §11.

**Non-happy paths:** an EMI is skipped because the employee was on LOP → the installment shows `skipped`
with the reason, and the schedule extends; make the new closure month explicit. Employee exits with a
balance → it flows to F&F `loan_recovery` (`M12 §Business rules`) — show that link, not a dead loan.

---

# 4 · Department Head

Scope = one department (`M2 §Business rules`). A Dept Head is **also** an Employee and keeps every `EMP-`
screen; only additions are listed. `M13 §Purpose` puts **manager approvals on mobile**, so DH-02, DH-04 and
DH-09 need mobile parity.

### DH-01 · Department home — rank 1 · MVP · destination
- **Q:** *"what does my department need from me today?"*
- **Modules:** `M15 §Business rules` (dashboards), `M8 §Permissions` (`leave.approve`), `M9 §Permissions`
  (`attendance.read` manager), `M17 §Permissions` (`appraisal.review`).
- **Must contain:** today's department attendance shape; **my approval queues as counts with routes**
  (leave · regularization · reimbursement · appraisal); who is on leave today; expiries in my department.
- **Must NOT contain:** the approval *actions* inline (they live in the queues — no duplicated
  destinations); campus-wide data (PR-01); salary or bank data (`M2 §Acceptance` — a Dept Head "cannot see
  bank details unless granted the PII permission"); another department.
- **States:** first-run (no reports) · loading · error · nothing pending (calm) · holiday · blackout term ·
  appraisal cycle open.
- **Scope:** exactly one department. The Principal's equivalent is PR-01 (campus), the Group Admin's GA-01
  (group) — **three screens, not one with a scope switch**, because density and aggregation differ
  (principle 5).

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Open an approval queue** · queue card | Dept Head (dept) | queue has ≥1 item, or always with an empty state | — | routes to DH-02 / DH-04 / DH-09 / DH-07 | — | yes | n/a |
| **Open today's absentee** · roster row | Dept Head (dept) | — | — | that person's attendance day detail (no PII beyond attendance) | — | yes | no |
| **Switch department** · page header | Dept Head holding ≥2 department `RoleAssignment`s (`§6.2`) | more than one assignment | department picker; **default the primary assignment** | reloads scope; scope is echoed in the page header at all times | single assignment → **hidden** | yes | no |
| **Acknowledge an expiry alert** · alert row | Dept Head (dept) | alert open | — | marks seen; **does not** resolve the underlying document (HR's) | — | yes | no |

**Non-happy paths:** a Dept Head with no direct reports (new department) → first-run state naming who
assigns reporting lines (HR). A Dept Head who is also the applicant on a request → that item must not
appear in their own queue (self-approval is forbidden); it escalates to the Principal.

---

### DH-02 · Leave approvals — rank 2 · MVP · destination
- **Q:** *"whose leave needs my decision?"*
- **Modules:** `M8 §Workflow`, `M8 §API` (`/approve`, `/reject`), `M8 §Permissions` (`leave.approve`).
- **Must contain:** pending requests with employee, type, dates, `day_count`, half-day flag, reason,
  **balance after approval**, the LOP consequence if unpaid, a blackout-term flag, and **who else in the
  department is on leave those days** (coverage risk); approve/reject with reason; bulk approve.
- **Must NOT contain:** balance editing; leave policy configuration (HR-26); regularizations (DH-04);
  requests outside the department; substitution arrangement (**P2**).
- **States:** empty · loading · error · escalated-to-me · awaiting-my-turn-in-chain · already actioned
  (stale) · cancelled by the employee · blackout override requested · retrospective request.
- **Scope:** department → campus (PR-03 adds escalations and SLAs).

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Approve** · row / detail | Dept Head (dept) | request `pending`; it is **my** turn in `approval_chain`; the applicant is not me | optional note | if the chain ends here: balance decremented, `AttendanceRecord` marked `leave`, **LOP flagged if unpaid** (`M8 §Workflow`); if not: escalates to the Principal; employee notified; audited | stale (already actioned) → refresh with who decided; balance changed since load → recompute and re-confirm | **no** once the leave has started; before that, the employee can cancel (`M8 §API` `/cancel`) or HR can reverse `[proposed]` — the spec has no approver-side undo (see §11) | the chain itself **is** the second pair of eyes where policy escalates |
| **Reject** · row / detail | Dept Head (dept) | as above | reason **required** | request `rejected`; balance untouched; employee notified with the reason; audited | — | no — the employee must re-apply | no |
| **Approve selected** · bulk bar | Dept Head (dept) | ≥2 selected, all mine to decide | confirm dialog listing count, total days and **how many will create LOP** | as per-row, transactionally per request (partial success reported per row) | any row invalid → that row fails with a named reason, the rest proceed | no | no |
| **Ask for more information** · row menu · **`[proposed]`** | Dept Head (dept) | request `pending` | comment | notifies the employee; request stays `pending`; SLA/ageing continues | — | yes | no |
| **Override a blackout** · detail banner | Dept Head — **hidden**; overriding an exam/admission blackout is the Principal's (PR-03) | — | — | — | — | — | governance: blackout is a campus-policy exception (`M8 §Business rules`) |
| **Filter / sort** · card header | Dept Head (dept) | — | status (pending **default**), type, date range, employee; sort by start date **default** | — | — | yes | no |
| **View the employee's balance ledger** · detail | Dept Head (dept) | — | — | read-only balances for the applicant (no salary, no PII) | — | n/a | no |

**Non-happy paths:** approver on leave → **escalation on approver absence is unspecified** (`M8 §Workflow`
escalates by policy, not by absence) — flag, §11. Request spans a month boundary that has already been
paid → approving would alter a locked month; must refuse or route to arrears. Two approvers act
simultaneously → idempotent; the second sees the first's decision.

---

### DH-03 · Department attendance — rank 3 · MVP · destination
- **Q:** *"who is in today, and who has a pattern?"*
- **Modules:** `M9 §Business rules`, `M9 §Permissions`, blueprint §2 consolidated attendance (dept slice).
- **Must contain:** today's roster with status and in-time; a month grid per person; late/absence pattern
  marks; the exception count with a route to DH-04; shift assignment per person.
- **Must NOT contain:** the regularization decision (DH-04); payroll paid-days (PY-08); **raw geo
  coordinates or selfie images** (`§8` — location is sensitive; an "verified by geo/selfie" mark suffices);
  other departments.
- **States:** loading · empty · error · holiday/weekly-off · **device/ingestion outage** (visually distinct
  from absence — `M16 §Acceptance`) · month locked by payroll.
- **Scope:** department → campus (PR-02) → group (GA-01 rollup).

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Change date / month** · page header | Dept Head (dept) | — | day **default today**; month view toggle | reloads | future dates → empty grid, not an error | yes | no |
| **Open a person's month** · row | Dept Head (dept) | person is in my department | — | their month grid with statuses and sources (no PII) | — | yes | no |
| **Flag an exception for regularization** · day cell menu · **`[proposed]`** | Dept Head (dept) | day has a missing punch and no pending request | note | notifies the employee to raise EMP-04 — **the manager does not create the correction**, preserving the request→approve separation | — | yes | yes |
| **Export the register** · page header | Dept Head (dept) | ≥1 record in range | CSV/PDF; range **default current month** | export audited (`§8` role-scoped) | large range queued | n/a | no |
| **Filter** · card header | Dept Head (dept) | — | status, shift, exceptions-only; **default: today, all** | — | — | yes | no |
| ~~Edit an attendance record~~ | **hidden for Dept Head** — direct edits need `attendance.manage` (HR, `M9 §Permissions`) | — | — | — | — | — | governance |

**Non-happy paths:** device outage day → show "awaiting device data" for the whole department rather than a
wall of absences, and surface the integration alert (GA-11). Staff shared across departments → **flag**:
`§6.3 Employee.department_id` is single-valued, so a teacher teaching across departments has one owner (§11).

---

### DH-04 · Regularization approvals — rank 4 · MVP · destination
- **Q:** *"is this attendance correction genuine?"*
- **Modules:** `§6.8 Regularization`, `M9 §Acceptance`, `M9 §API` (`…/regularizations`).
- **Must contain:** the day, its computed status, the requested status, the reason, the employee's recent
  pattern (context to judge), evidence; approve/reject with reason; bulk approve (blueprint §2 MVP).
- **Must NOT contain:** leave requests (DH-02); direct `AttendanceRecord` editing (HR-30); locked-month
  corrections.
- **States:** empty · loading · error · month locked (must refuse with an explanation) · pattern-flagged
  repeat requester · already actioned · expired correction window.
- **Scope:** department → campus (HR-30).

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Approve** · row / detail | Dept Head (dept) | `status=pending`; the day's month is not locked; requester ≠ me | optional note | `AttendanceRecord.status` updated to `requested_status`; **paid-days recompute for the month** (`M9 §Business rules`); employee notified; audited | locked month → **shown disabled** with the run reference and an "raise arrears instead" route | no — a further correction is a new request | the approval **is** the second pair of eyes on the employee's claim |
| **Reject** · row / detail | Dept Head (dept) | as above | reason **required** | request rejected; record unchanged; employee notified | — | no | no |
| **Approve selected** · bulk bar | Dept Head (dept) | ≥2 selected | confirm listing the count and the affected months | per-row transactional | rows in locked months fail individually with the reason | no | no |
| **View the employee's pattern** · detail | Dept Head (dept) | — | last 60 days **default** | shows repeat-request frequency — the judgement context the spec implies by making this a manager decision | — | n/a | no |
| **Filter** · card header | Dept Head (dept) | — | status (pending **default**), date range, employee | — | — | yes | no |

**Non-happy paths:** approval arrives after payroll has locked the month → the correct outcome is an
**arrears adjustment** (`M10 §Arrears`), not a rewrite; the screen must offer that route rather than
failing. Employee left the department mid-request → the request follows the record; the new Dept Head sees
it.

---

### DH-05 · My team — rank 5 · MVP · destination
- **Q:** *"who reports to me, and what state are they in?"*
- **Modules:** `M3 §Permissions` (`people.read` for managers), `§6.3`, `M2 §Acceptance`.
- **Must contain:** direct reports with designation, staff category, `employment_type`,
  `is_vacation_staff`, contract end date, probation/confirmation state, work contact; leave balance
  summary; a route to the person's non-PII record.
- **Must NOT contain:** bank details, PAN/Aadhaar, salary/CTC (`M2 §Acceptance` — the spec's own example);
  document files (`M4`); edit controls; staff outside the department.
- **States:** empty · loading · error · joiner in pre-boarding · on notice · contract expiring ·
  PII-redacted (default) · PII-granted (show the difference explicitly).
- **Scope:** department. HR sees the same people **with** PII and edit rights in HR-02/HR-03 — a different
  screen, not a permission toggle on this one.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Open a person** · row | Dept Head (dept) | person reports to me | — | non-PII record view (contract facts, service book, leave/attendance summary) | — | yes | no |
| **Message / raise a ticket about a person** · row menu | Dept Head (dept) | — | pre-filled helpdesk ticket, category `hr` | ticket created | — | n/a | no |
| **Export the team list** · page header | Dept Head (dept) | — | CSV; **PII columns are absent, not blank** | export audited (`§8` role-scoped exports) | — | n/a | no |
| **Start an appraisal action** · row menu | Dept Head (dept) | a cycle is `open` | goals (DH-06) or review (DH-07) | routes | no open cycle → hidden | yes | no |
| ~~Edit employee data~~ / ~~View salary~~ / ~~View bank~~ | **hidden** unless `people.pii.read` is separately granted (`M3 §Permissions`) | — | — | — | — | — | governance: `M2 §Acceptance` |

**Non-happy paths:** reporting line not set → the person does not appear anywhere; HR must be alerted
(**flag**: `§6.3 Employee` carries `department_id` but the spec never names a `reports_to` field — the role
model calls "manager" the reports-to relationship, so **the field is required and currently missing from the
data model**; see §11, this is a data-model gap, not just a screen gap).

---

### DH-06 · Goal setting — rank 6 · MVP · task
- **Q:** *"what will each of my people be measured on?"*
- **Modules:** `§6.12 Goal`, `M17 §Workflow`, `M17 §Permissions` (`appraisal.review`).
- **Must contain:** per-report goals (kind, description, weight, target); **weight total validation to
  100**; copy from template/previous cycle; publish for acknowledgement; window countdown.
- **Must NOT contain:** ratings (DH-07); rating-matrix configuration (HR-35); moderation (PR-05); other
  departments.
- **States:** no open cycle · cycle open · draft · weights ≠ 100 (blocking) · published/awaiting
  acknowledgement · acknowledged · locked · mid-cycle joiner.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Add a goal** · person panel | Dept Head (dept) | cycle `open`; goals not locked | kind `kra · kpi · objective` (`§6.12 Goal.kind`); description; **weight** (%); target; **no default weight** so it is a deliberate choice | draft goal saved | weights >100 → blocks publish, names the overage | yes (delete while draft) | no |
| **Copy from a template / previous cycle** · person panel | Dept Head (dept) | ≥1 prior cycle or a template exists `[proposed]` (the spec has no goal template entity) | source picker | goals cloned as drafts | — | yes | no |
| **Publish goals** · person panel primary | Dept Head (dept) | weights total exactly 100; ≥1 goal | confirm | goals visible to the employee (EMP-16); acknowledgement requested; notification; audited | weights ≠ 100 → **shown disabled** with the delta | editable until the employee acknowledges `[proposed]`; afterwards a change should notify | the employee's acknowledgement is the counterparty step, not an approval |
| **Edit a published goal** · goal row | Dept Head (dept) | cycle open; not yet rated | reason **required** `[proposed]` | goal updated; employee notified of the change | already rated → disabled | yes | no |
| **Bulk-publish for the department** · bulk bar | Dept Head (dept) | every selected person's weights = 100 | confirm listing who is included and who is **excluded and why** | as per person | invalid people are listed, not silently skipped | no | no |

**Non-happy paths:** an employee joins after goals are published → **flag**: no mid-cycle eligibility rule
in `§6.12` (§11). Manager changes mid-cycle → goals persist; the new manager inherits the queue.

---

### DH-07 · Appraisal reviews — rank 7 · MVP · destination + task
- **Q:** *"how do I rate my people this cycle?"*
- **Modules:** `M17 §API` (`…/appraisal-reviews/manager`), `M17 §Business rules` (self → manager → 360 →
  moderation; append-only), `§6.12 AppraisalReview`.
- **Must contain:** reviews due with stage and deadline; per employee — their goals, **their self-ratings**,
  a manager rating per goal on the cycle's matrix, comments, the weighted composite preview, and a
  recommendation (`none · increment · promotion · pip`) marked **advisory**; submit.
- **Must NOT contain:** applying an increment (it is a *proposed* salary revision that still passes payroll
  maker-checker — `M17 §Business rules`); departmental moderation (PR-05); anonymous 360° respondent
  identities; another manager's reports.
- **States:** empty · self-appraisal not submitted · in progress · submitted (read-only) · moderated (show
  the delta and who moderated) · cycle locked · employee exited mid-cycle.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Rate a goal** · review panel | Dept Head (dept) | cycle `open`, manager stage active, not submitted | score from the cycle's `rating_matrix` (**never hardcoded**); comment | draft; weighted composite updates live | self stage incomplete → **flag**: the spec does not say whether the manager may proceed (§11); default here is *allowed, with the gap shown* | yes while draft | no |
| **Record a recommendation** · review panel | Dept Head (dept) | all goals rated | `none` **default** · `increment` · `promotion` · `pip`; justification **required** for anything but `none` | stored on `AppraisalReview.recommendation`; on finalisation it surfaces to payroll as a **proposed** salary revision (PY-06) — **never auto-applied** (`M17 §Business rules`) | — | yes while draft | **yes — moderation (PR-05), then payroll maker-checker (`M10 §Permissions`)** |
| **Submit review** · panel primary | Dept Head (dept) | every goal rated | confirm naming finality | `AppraisalReview` → `submitted`; **append-only** (`M17 §Acceptance`); moderation queue updated; employee notified per the cycle's disclosure policy; audited | incomplete → names the gaps | **no** — a revision supersedes | yes — moderation |
| **View 360° inputs** · review panel | Dept Head (dept) | 360 stage complete and the source is disclosable to the manager | — | peer/classroom-observation scores in aggregate; **respondent identities hidden where anonymity applies** | not yet collected → stated, not blank | n/a | no |
| **Request more time** · panel menu · **`[proposed]`** | Dept Head (dept) | window closing | reason | HR decides (HR-35) | — | n/a | yes |
| **Filter** · card header | Dept Head (dept) | — | stage, due date, person; **default: due to me** | — | — | yes | no |

**Non-happy paths:** employee exits mid-cycle → review should close as `not applicable`, not sit pending
forever (**flag**, §11). Manager must rate themselves (they are also an employee) → their own review must
route to the Principal, never appear in their own queue.

---

### DH-08 · Classroom observation — rank 8 · MVP · task
- **Q:** *"what did I see in that classroom?"*
- **Modules:** `M17 §Business rules` (360° sources incl. classroom-observation/peer review),
  `§6.12 AppraisalRating`, blueprint §10 "★ Classroom-observation & peer-review workflows **[MVP]**".
- **Must contain:** teacher, class/subject, date/period, the observation rubric from the cycle's matrix,
  scores, narrative comments, follow-up actions; submit (append-only).
- **Must NOT contain:** the teacher's composite score; other observers' entries; student-level data beyond
  the rubric; the promotion recommendation.
- **States:** scheduled · draft · submitted (append-only) · superseded by a revision · cycle locked ·
  observation outside a cycle window.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Schedule an observation** · page primary · **`[proposed]`** | Dept Head / Principal (dept/campus) | a cycle is `open` | teacher, date, class/subject, period | teacher notified `[proposed]` — announced vs unannounced observation is a real policy choice the spec does not make (§11) | — | yes (cancel) | no |
| **Record the observation** · form | Dept Head / Principal | cycle `open`; observer ≠ observed | rubric items from `AppraisalCycle.rating_matrix`; scores; narrative **required**; follow-up action optional | draft | rubric absent → blocked with an admin error | yes while draft | no |
| **Submit** · page primary | Dept Head / Principal | all rubric items scored | confirm naming finality | creates `AppraisalRating(source=peer)` rows — **append-only** (`M17 §Business rules`); feeds the composite; audited | cycle locked mid-submit → refuse, preserve the draft | **no** — a revision supersedes | no |
| **Share with the teacher** · after submit | Dept Head / Principal | submitted | share now / at moderation; **default: at moderation** | teacher sees it in EMP-16/17 per the cycle's disclosure policy | — | no | no |

**Non-happy paths:** observation recorded outside any open cycle → **flag**: `§6.12 AppraisalRating`
requires a `review_id`, so an observation cannot exist without a cycle; schools observe year-round (§11).

---

### DH-09 · Reimbursement approvals — rank 9 · MVP · destination
- **Q:** *"is this claim legitimate and within policy?"*
- **Modules:** `M10 §Reimbursements`, `§6.9 ReimbursementClaim.approval_chain`, `M10 §API`
  (`/approve`, `/reject`).
- **Must contain:** the claim with category, itemised lines, **receipts viewable inline**, incurred dates,
  policy limit vs claimed, the claimant's history in that category; approve/reject with reason.
- **Must NOT contain:** the payout batch (PY-16 — approval and payment are deliberately separate, and the
  batch carries maker-checker); one's own claim; tax-treatment reclassification (payroll's).
- **States:** empty · pending · over-limit · duplicate receipt suspected · approved (awaiting batch) ·
  rejected · already paid (read-only) · self-claim (refused).

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Approve** · row / detail | Dept Head (dept) | `status=submitted`; my turn in the chain; claimant ≠ me (`M13 §Acceptance`) | optional note; **partial approval by line** `[proposed]` (the entity has lines, so line-level rejection is natural but unspecified) | `status=approved`; the claim becomes eligible for a payout batch (PY-16); claimant notified; audited | self-claim → **hidden**; over-limit without an override right → routes up | reversible **only before** the claim enters a payout batch `[proposed]` | **yes — the payout batch requires a distinct checker** (`M10 §Reimbursements`) |
| **Reject** · row / detail | Dept Head (dept) | as above | reason **required** | `status=rejected`; claimant notified with the reason | — | no (the claimant resubmits a new claim) | no |
| **View a receipt** · line | Dept Head (dept) | receipt exists | inline viewer | access is logged (`§8`) | unreadable file → flag to the claimant | n/a | no |
| **Approve selected** · bulk bar | Dept Head (dept) | ≥2, all mine, none over-limit | confirm with the **total in ₹** (principle 4) | as per row | over-limit rows excluded and named | as above | yes |
| **Send back for more information** · row menu · **`[proposed]`** | Dept Head (dept) | `status=submitted` | comment | claim returns to the claimant as editable | — | yes | no |

**Non-happy paths:** claim approved, then the employee exits before the payout batch → see the F&F gap in
§11. Receipt is a photo of a photo → the reviewer needs a reject-with-reason path that is not punitive.

---

# 5 · Campus Principal

Scope = one campus (`M2 §Acceptance` — "a Principal scoped to Campus A cannot read Campus B data"). The
Principal is also an Employee, and holds Dept-Head-shaped powers campus-wide by escalation. Screens defined
elsewhere that the Principal also uses appear in the §9 coverage table, not here.

### PR-01 · Campus home — rank 1 · MVP · destination
- **Q:** *"how is my campus running today?"*
- **Modules:** `M15 §Business rules` (campus dashboards), `M9`, `M8`, `M3`, `M14`.
- **Must contain:** today's campus attendance shape by department; staff on leave; **my decision queues**
  (leave escalations · requisition approvals · renewal decisions · appraisal moderation) as counts with
  routes; headcount by staff category; expiries needing attention (documents, contracts, **police
  verification**).
- **Must NOT contain:** payroll amounts or salary cost (`§8 Field-level access`); other campuses; approval
  actions inline; statutory filing state (AC-01).
- **States:** first-run (new campus) · loading · error · holiday · vacation term (`§6.6 Term.type=vacation`)
  · exam blackout active · device outage · payroll month locked.
- **Scope:** one campus; GA-01 is the group equivalent.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Open a decision queue** · queue card | Principal (campus) | — | — | routes to PR-03 / PR-04 / HR-25 / PR-05 | — | yes | n/a |
| **Drill into a department** · attendance card row | Principal (campus) | — | — | DH-03 scoped to that department (read-only for the Principal) | — | yes | no |
| **Switch campus** · page header | Principal holding ≥2 campus assignments | >1 `RoleAssignment` | campus picker; **default primary**; the active scope is always echoed in the header | reloads everything scoped | single campus → **hidden** | yes | no |
| **Acknowledge a compliance alert** · alert row | Principal (campus) | alert open | — | marks seen; **does not** clear the underlying lapse | — | yes | no |
| **Open the child-safety board** · alert card | Principal (campus) | ≥1 staff without valid police verification | — | routes to HR-12 | — | yes | no |

**Non-happy paths:** campus created but no staff yet → first-run state that names the next step (HR onboards
or ATS converts). Blackout term active → the home must say so prominently, because it changes what leave
decisions mean.

---

### PR-02 · Campus attendance board — rank 2 · MVP · destination
- **Q:** *"where are the attendance problems on my campus?"*
- **Modules:** `M9 §Business rules`, blueprint §2 "★ Multi-campus consolidated attendance **[MVP]**"
  (campus slice), `M9 §Permissions`.
- **Must contain:** department × status matrix for today; late/absence hot-spots; unreconciled exceptions by
  department with routes; shift coverage for transport/hostel/security (`§6.8 Shift.type`); a month trend.
- **Must NOT contain:** individual regularization decisions (DH-04/HR-30); geo/selfie artefacts; paid-days
  finalisation (PY-08); other campuses (GA-01).
- **States:** loading · empty · error · **device/ingestion outage** (distinct from absence) · holiday ·
  partial day (before shift end).

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Drill into a department** · matrix cell | Principal (campus) | — | — | DH-03 for that department | — | yes | no |
| **Change date / range** · page header | Principal (campus) | — | day **default today**; week/month toggle | reloads | — | yes | no |
| **Export the campus register** · page header | Principal (campus) | ≥1 record | CSV/PDF; range **default current month** | export audited | large range queued | n/a | no |
| **Open the device-health view** · outage banner | Principal (campus) | an ingestion gap is detected (`M16`) | — | routes to GA-11 (read-only for the Principal) | — | yes | no |
| **Filter** · card header | Principal (campus) | — | department, shift, staff category, exceptions-only | — | — | yes | no |

**Non-happy paths:** half the campus shows absent because a device died at 08:00 → the board must lead with
the outage, not the absences (a wrong-looking number destroys trust — principle 4).

---

### PR-03 · Leave escalations & campus leave — rank 3 · MVP · destination
- **Q:** *"which leave decisions have escalated to me?"*
- **Modules:** `M8 §Workflow` (`Sys->>P: Escalate (if policy requires)`), `M8 §Permissions` (campus scope),
  `M8 §Business rules` (blackout).
- **Must contain:** escalated requests with the **chain history** (who approved before me, when); requests
  inside blackout windows needing an override; the campus leave calendar for those dates; approve/reject
  with reason; ageing/SLA on pending decisions.
- **Must NOT contain:** routine department-level approvals that have not escalated (DH-02 — otherwise the
  Principal is a bottleneck and the screens duplicate); leave policy setup (HR-26); balance edits.
- **States:** empty · loading · error · escalated · overdue escalation · blackout override requested ·
  already actioned downstream · the applicant is a Dept Head (chain skips a level).

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Approve escalated request** · row / detail | Principal (campus) | escalated to me; applicant ≠ me | optional note | final approval: balance decremented, attendance marked, LOP flagged; employee + Dept Head notified; audited | — | no once leave starts | the chain is complete here |
| **Reject** · row / detail | Principal (campus) | as above | reason **required** | rejected; notified | — | no | no |
| **Override a blackout window** · detail banner | Principal (campus) | request falls in an exam/admission `Term` (`§6.6 Term.type=exam`) | **justification required**; the override is recorded against the term | leave approved despite the blackout; **audited as an override** (`§4.2`), and visible in the campus leave report | without justification → **shown disabled** | no | **`[proposed]`** — the spec grants no override at all; see §11 (this may need a second approver) |
| **View campus leave calendar** · page tab | Principal (campus) | — | date range **default the request's dates** | who else is away, by department — the coverage judgement | — | n/a | no |
| **Reassign the approver** · row menu · **`[proposed]`** | Principal (campus) | the Dept Head is absent/vacant | pick another approver | chain updated; audited | — | yes | no — reason: covers the unspecified approver-absence gap (§11) |
| **Filter** · card header | Principal (campus) | — | department, type, date, overdue-only; **default escalated + pending** | — | — | yes | no |

**Non-happy paths:** escalation with no policy reason (misconfiguration) → show why it escalated. Blackout
override becomes routine → the report must expose override frequency, or the control quietly erases the
policy.

---

### PR-04 · Requisition approvals — rank 4 · MVP · destination
- **Q:** *"should we open this position at this cost?"*
- **Modules:** `M5 §Business rules` (budget-based approval chain before posting), `§6.5 Requisition`,
  `M5 §Permissions` (`ats.approve`).
- **Must contain:** campus, department, staff category, headcount, **`budget_ctc`**, justification,
  requester; current headcount in that department for context; the approval chain and my position; approve/
  reject with reason.
- **Must NOT contain:** posting/publishing (HR-14 — a separate act after approval); candidate data; salary
  structures; requisitions above my authority (they route to the Group Admin).
- **States:** empty · pending me · awaiting a higher approver (read-only) · approved · rejected · **above my
  authority** (must say so, not fail silently) · closed.
- **Scope:** campus. The Group Admin uses the **same screen** with a wider filter — scope only.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Approve** · row / detail | Principal (campus) | `status=pending_approval`; my turn; `budget_ctc` within my authority | optional note; **headcount may be reduced, not increased** `[proposed]` | if the chain ends: `status=approved`, HR may post (HR-14); else escalates to the Group Admin; requester notified; audited | above authority → **shown disabled** with "this routes to the Group Admin" | reversible only by closing the requisition | the chain **is** the second pair of eyes for budget |
| **Reject** · row / detail | Principal (campus) | as above | reason **required** | `status=rejected`; requester notified | — | no (a new requisition is needed) | no |
| **Send back for revision** · row menu · **`[proposed]`** | Principal (campus) | pending me | comment | returns to `draft` with the comment | — | yes | no |
| **Open the department context** · detail | Principal (campus) | — | — | current headcount, vacancies, and the staff-category mix (PTR/sanctioned-post is **P2**) | — | n/a | no |
| **Filter** · card header | Principal (campus) | — | status (pending **default**), department, category | — | — | yes | no |

**Non-happy paths:** budget authority thresholds are **not defined anywhere** — `§6.5 Requisition.
approval_chain` is a JSON blob with no configuration surface (**flag**, §11: this needs GA-level setup).

---

### PR-05 · Appraisal moderation — rank 5 · MVP · destination + task
- **Q:** *"are these ratings fair across my campus?"*
- **Modules:** `M17 §Workflow` (moderation → composite), `M17 §API` (`/moderate`, `/finalize`),
  `M17 §Permissions` (`appraisal.manage`, campus scope).
- **Must contain:** the distribution of composite scores by department (shape first — principle 3);
  outliers; per-review moderation showing the original manager score, the moderated score and a
  **mandatory reason**; a recommendation summary marked **advisory**; finalize.
- **Must NOT contain:** applying salary changes (PY-06); editing goals (DH-06); cycle configuration
  (HR-35); anonymous respondent identities; other campuses.
- **States:** not yet at moderation · reviews incomplete (blocking count) · in moderation · finalized
  (append-only) · cycle closed · employee exited mid-cycle · rating superseded.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Moderate a score** · review row | Principal (campus) | cycle at the moderation stage; review `submitted` | new composite or per-goal adjustment; **reason required**; the original is retained | creates a superseding `AppraisalReview(stage=moderation)` — **append-only, never an edit** (`M17 §Business rules`); manager + employee notified per policy; audited | reason missing → submit **disabled** | no — a further moderation supersedes | the moderation **is** the second look at the manager's rating |
| **Finalize a review** · review row | Principal (campus) | moderation complete | confirm | `status=finalized`; composite locked; any `increment`/`promotion` recommendation is queued to payroll as a **proposed** revision (PY-06) — advisory only | — | **no** | **yes downstream** — payroll maker-checker (`M10 §Permissions`) |
| **Finalize all** · bulk bar | Principal (campus) | all selected are moderated | confirm listing the count, and **how many carry increment/promotion recommendations** | as per row | incomplete rows named and excluded | no | yes |
| **View the distribution** · header card | Principal (campus) | ≥1 submitted review | by department **default**; by staff category | shape before number (principle 3) | — | n/a | no |
| **Send a review back to the manager** · row menu · **`[proposed]`** | Principal (campus) | `submitted`, not finalized | reason | manager re-rates as a superseding review | — | yes | no |
| **Export the calibration sheet** · page header | Principal (campus) | — | CSV; **scores are PII-adjacent** — export audited (`§8`) | — | — | n/a | no |

**Non-happy paths:** managers cluster everyone at the top → the distribution view is the countermeasure, and
the spec provides no forced ranking (correctly). A moderated score lowers an increment recommendation →
the *recommendation* must be re-derivable, and it is still advisory.

---

### PR-06 · Campus reports — rank 6 · MVP · destination
- **Q:** *"what do I have to show or file for this campus?"*
- **Modules:** `M15 §Purpose` (standard reports), `M15 §Acceptance`, `M9`, `M8`, `M3`.
- **Must contain:** a report library scoped to the campus — attendance register, leave register, headcount
  by staff category (teaching/non-teaching), joiners & leavers, document compliance (verified/pending/
  expired), contract expiry; a date/AY range; export.
- **Must NOT contain:** payroll or statutory registers (`§8 Field-level access`); custom report building
  (**P2**); PTR / sanctioned-post / affiliation exports (**P2 / Later**); cross-campus comparison (GA-09).
- **States:** empty (no data in range) · generating · queued (large) · error · ready · **columns trimmed by
  permission** (PII redacted, and said so).

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Run a report** · report row | Principal (campus) | — | report type; range **default current month/AY**; department filter (**default all**); format PDF **default** / CSV | generated within the caller's scope + field permissions; **generation and export are audited** (`§8`) | oversized → queued with a notification when ready | n/a | no |
| **Download** · result header | Principal (campus) | report generated | — | file; download audited | link expired → regenerate | n/a | no |
| **Schedule a report** · row menu · **`[proposed]`** | Principal (campus) | — | monthly **default**, recipients within scope | recurring delivery via M14 | — | yes | no — reason: `M15` names standard reports but no scheduling |
| **Save a view** · result header · **`[proposed]`** | Principal (campus) | — | name it | reusable filter set | — | yes | no |

**Non-happy paths:** a report that would expose salary to a Principal → the column is **absent**, and the
report header states which columns were withheld and why (never a silently different number).

---

### PR-07 · Holiday calendar — rank 7 · MVP · setup
- **Q:** *"which days is this campus closed?"*
- **Modules:** `§6.6 HolidayCalendar/Holiday`, `M7 §Business rules` (per-campus, state/festival variance),
  `M7 §Permissions` (`calendar.manage` campus/group).
- **Must contain:** the calendar per academic year; holidays with date, name, `type` (`national ·
  festival · restricted · floating`); bulk add; copy from another campus/year; a count against the
  National & Festival Holidays Act minimum (blueprint §3 MVP); publish state.
- **Must NOT contain:** academic year/term definition (GA-06 — different question, different owner); leave
  types (HR-26); weekly-off patterns (shift setup, HR-29).
- **States:** empty (new AY) · draft · **published** (affects attendance and leave day-counts — warn) ·
  past year (read-only) · conflicts with existing attendance records · restricted-holiday quotas (**P2**).
- **Scope:** one campus; a Group Admin uses the same screen with a campus switcher.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Add a holiday** · page primary | Principal (campus) | an AY exists (`M7`); the calendar is not past | date; name; `type` (**default `festival`**); recurring-annually flag `[proposed]` | added to the draft calendar | date already a holiday → blocks with the existing entry; date outside the AY → blocked | yes while draft | no |
| **Import / copy a calendar** · page header | Principal (campus) | another campus or a prior AY has a calendar | source picker; **overwrite vs merge — default merge** | entries cloned as draft | conflicting dates listed for resolution, never silently overwritten | yes while draft | no |
| **Publish the calendar** · page primary | Principal (campus) | ≥1 holiday; AY current or future | confirm dialog naming the effect: **"this changes leave day-counts and attendance statuses for N staff"** | calendar live; attendance reconciliation and leave `day_count` now honour it; staff notified (`M14`) `[proposed]`; audited | — | **no** — republishing with a change is a further edit, and past-dated changes are governed below | no — but see the past-date rule |
| **Edit / delete a published holiday** · row | Principal (campus) | the date has **no** attendance records or approved leave depending on it | reason **required** | recomputes affected days | if records exist → **refused** with the count of affected records and a route to HR (`attendance.manage`) — **flag**: the spec has no recompute path for a retro-dated holiday change (§11) | no | **`[proposed]` yes** — a retro change moves money via paid-days |
| **Add a weekly-off pattern** | **hidden here** — weekly-offs live on `§6.8 Shift`, edited in HR-29 | — | — | — | — | — | anti-duplication |

**Non-happy paths:** a festival date shifts by lunar calendar after publication → the edit path above
applies. Two campuses in different states share an AY but not holidays → correct by design (per-campus
calendars).

---

# 6 · HR Operator

The largest surface in the product: M3, M4, M5, M6, M8/M9 administration, M15.1 and M17 cycle operation.
Scope is normally campus (`M3 §Permissions` — `people.manage` at campus scope). **Build this role after the
Employee role** (BATMAN's locked build order, 2026-08-11).

### HR-01 · HR work queue (home) — rank 1 · MVP · destination
- **Q:** *"what is waiting on me?"*
- **Modules:** `M4 §Workflow`, `M5`, `M6`, `M9`, `M15.1 §Business rules` (SLA), `M14`.
- **Must contain:** work counts with routes — documents to verify · overdue document requests · onboarding
  tasks due · probation/confirmations due · contracts expiring · candidates awaiting action · helpdesk
  tickets breaching SLA · attendance exceptions unresolved; joiners and leavers this week.
- **Must NOT contain:** the actions themselves (they live in their queues); payroll figures; campus-wide
  dashboards (PR-01).
- **States:** first-run · loading · error · **all clear** (designed) · SLA breaches present (escalated tone)
  · scope switcher when multi-campus.
- **Scope:** campus → group (a group HR sees campus-segmented counts, never a single undifferentiated pile).

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Open a work queue** · queue card | HR (campus) | — | — | routes to HR-09 / HR-22 / HR-24 / HR-25 / HR-16 / HR-31 / HR-30 | — | yes | n/a |
| **Switch campus** · page header | HR with ≥2 campus assignments | >1 `RoleAssignment` | campus picker; **default primary**; scope echoed in the header always | reloads scope | single campus → hidden | yes | no |
| **Add an employee** · page header | HR (campus) | `people.manage` | — | routes to HR-23 (single-joiner path) | — | yes | no |
| **Raise a document request** · quick action | HR (campus) | ≥1 employee | — | routes to HR-09's raise flow | — | yes | yes — the employee responds, HR verifies |

**Non-happy paths:** a brand-new tenant with no staff → first-run must name the two entry paths (bulk import
HR-23, or ATS conversion HR-21), not show eight zeroes.

---

### HR-02 · Staff register — rank 2 · MVP · destination
- **Q:** *"who works here?"*
- **Modules:** `M3 §Purpose` (staff system of record), `§6.3 Employee/EmploymentContract/StaffCategory`,
  `M3 §API` (`…/employees`), `M3 §Permissions`.
- **Must contain:** searchable, filterable staff list — `emp_code`, name, photo, designation, staff
  category (`teaching · non_teaching · support · guest`), department, campus, `employment_type`,
  `is_vacation_staff`, status, DOJ, contract end date; the register **inside a card** with totals
  (`DESIGN.md §Signature components` — never a naked table).
- **Must NOT contain:** salary or bank columns by default (`§8 Field-level access` — a separate permission);
  documents (HR-07); the payroll view of an employee (PY-05); candidates (HR-15 — they are not staff).
- **States:** loading · empty (first-run) · error · overflow (cursor pagination, `§7`) · filtered-empty ·
  **PII columns withheld** (stated, not blank) · includes/excludes exited staff (explicit toggle).
- **Scope:** campus → group. A Principal sees the same register read-only for their campus; a Dept Head
  gets DH-05 instead (different density, no PII).

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Search** · card header | HR (campus) | — | name, `emp_code`, phone (if permitted), PAN/UAN **only with `people.pii.read`** | server-side search within scope; **searches never cross the tenant** (`§7 Tenancy`) | no match → suggests filters and offers the exited-staff toggle | yes | no |
| **Filter** · card header | HR (campus) | — | department · staff category · `employment_type` · `is_vacation_staff` · status · contract expiring · verification status; **default: active staff, current campus** | filtered; URL-shareable | — | yes | no |
| **Open an employee** · row | HR (campus) | — | — | routes to HR-03 | — | yes | no |
| **Add employee** · page header | HR (campus) | `people.manage` | single or bulk (HR-23) | creates `Employee` + `EmploymentContract` + `ServiceRecord(joined)` (`M3 §Workflow`) | — | employee can be deactivated, **not deleted** (audit/`§4.2`) | no |
| **Export the register** · page header | HR (campus) | — | CSV/PDF; column set follows field permissions; **default: no PII columns** | export **audited** and role-scoped (`§8`) | huge export queued | n/a | no — but PII-bearing exports should require a reason `[proposed]` |
| **Bulk assign a department / shift** · bulk bar · **`[proposed]`** | HR (campus) | ≥2 selected | target department or shift; confirm with the count | mass update; each writes an audit row and a `ServiceRecord` where it is a transfer | partial failures listed per row | no (a further move is a new change) | no |
| **Initiate exit** · row menu | HR (campus) | employee `active` | last working day; reason; notice waived? | employee → `notice`; `ServiceRecord(exited)` written on completion; F&F becomes computable (PY-19); access revoked at completion (`M12 §Business rules`) | date before today → warns; already exiting → routes to the settlement | reversible **before** F&F is approved `[proposed]` | **yes — F&F approval (`M12 §API` `/approve`)** |

**Non-happy paths:** duplicate person (rehire) → must match to the existing record for **service continuity**
(gratuity depends on `ServiceRecord`); creating a second `Employee` silently breaks gratuity. **Flag**: the
spec has no rehire/merge path (§11). Employee with no `User` yet (record created, invite not sent) → the
register must show that state, since they cannot appear anywhere else.

---

### HR-03 · Employee record — summary — rank 3 · MVP · detail
- **Q:** *"who is this person and what state are they in?"*
- **Modules:** `M3 §Purpose`, `§6.3`, `M3 §Workflow`.
- **Must contain:** identity header (photo, name, `emp_code`, designation, campus/department, status);
  the **at-a-glance state row** — `employment_type`, `is_vacation_staff`, DOJ, confirmation, contract end,
  pay group, reports-to; alerts (expired documents, contract expiring, probation due, pending document
  requests); tabs to HR-04 … HR-07 and cross-links to leave/attendance/payroll/appraisal.
- **Must NOT contain:** everything at once — this is a **shell**, not a mega-form. Each deep area is its own
  screen (see the conflict note in §10, C1).
- **States:** loading · error · pre-boarding (no attendance/payroll yet) · probation · confirmed · on notice
  · exited (read-only, retention window) · PII-redacted for the viewer.
- **Scope:** campus → group. A Dept Head never lands here (DH-05 is theirs).

**Actions** (tab-level actions live on their own screens)

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Switch tab** · record header | HR (campus) | — | Personal (HR-04) · Contract (HR-05) · Service book (HR-06) · Documents (HR-07); **default Personal** | routes within the shell, scope preserved | — | yes | no |
| **Invite / resend the user login** · header menu | HR (campus) | `Employee` exists; contact present | channel: email/SMS; **default email** | creates or re-invites `User`, links `employee_id` (`§6.2`); invite audited | no contact on file → blocked, naming the missing field | invite can be revoked | no |
| **Deactivate the login** · header menu | HR (campus) | `User` active | confirm; reason | `is_active=false`; sessions revoked | — | yes (reactivate) | no |
| **Initiate exit** · header menu | HR (campus) | employee active | as HR-02 | as HR-02 | — | before F&F approval | yes |
| **Raise a document request** · alerts band | HR (campus) | — | doc type; reason; due date | `DocumentUpdateRequest` created `status=open`; employee notified (`M4 §Workflow`) | — | HR can cancel while open | yes — HR verifies the response |
| **Print / export the record** · header menu | HR (campus) | — | PDF; PII included **only** with `people.pii.read` and a stated reason `[proposed]` | export audited | — | n/a | no |

**Non-happy paths:** viewing a record from another campus after a scope change → refused by RLS
(`§3 Isolation`), and the UI must show a scoped "not in your campus" state, not an error page.

---

### HR-04 · Employee — personal & statutory IDs — rank 4 · MVP · detail
- **Q:** *"are this person's identity and statutory details correct?"*
- **Modules:** `§6.3 Employee` (dob, gender, contact, **pan, aadhaar (masked), uan, esic_no, bank (enc)**,
  photo), `§8 PII classification` + `Field-level access`, `M3 §Permissions` (`people.pii.read`).
- **Must contain:** personal details; contact; **statutory IDs masked by default with click-to-reveal**;
  bank details (permission-gated); the field-permission notice; last-changed provenance per sensitive field.
- **Must NOT contain:** salary (PY-05); documents (HR-07); anything editable by the employee
  (`M3 §Permissions`).
- **States:** view (masked) · revealed (logged) · editing · saving · validation error · **PII permission
  absent** (fields shown as withheld, not blank) · exited (read-only).
- **Scope:** campus → group.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Reveal a masked ID** · field | HR with `people.pii.read` (campus) | permission held | click-to-reveal; **default masked** | value shown briefly; **access logged** (`§8` — "access-logged") | without permission → **hidden**, not disabled | n/a | no |
| **Edit personal details** · card | HR (campus) | `people.manage` | name, DOB, gender, contact, photo | saved; **audit before/after** (`§4.2`); name changes may require a document (raise a request) | validation: DOB implies age limits `[proposed]` | prior values survive in the audit log | no |
| **Edit statutory IDs** · card | HR with `people.pii.read` + `people.manage` | permission held | PAN (format-validated), Aadhaar (**stored masked**, `§6.3`), UAN, ESIC no. | saved; audited; **PF/ESI filings depend on these** — a change mid-year must warn about ECR/24Q impact (`M11`) | format invalid → named; duplicate PAN/UAN in the tenant → **blocked** `[proposed]` (the spec asserts no uniqueness) | audit retains the old value | **`[proposed]` yes** — statutory identifiers drive filings; a second pair of eyes is defensible (§11) |
| **Edit bank details** · card | HR with the bank-field permission | permission held | account, IFSC, name-as-per-bank | saved encrypted (`§6.3 bank(enc)`); **the next NEFT file uses it** (`M10`); audited; employee notified `[proposed]` | invalid IFSC → named | audit retains the old | **`[proposed]` yes** — a bank change immediately before a run is the classic payroll-fraud vector (§11) |
| **Never log** | — | — | — | PAN/Aadhaar/UAN/ESIC/bank/salary/DOB/phone must never appear in logs (`guard-pii-logging`, `§8`) | — | — | — |

**Non-happy paths:** employee has no Aadhaar/PAN (support staff) → the record must tolerate it, and the
statutory engine must degrade explicitly (PF/TDS consequences), not silently. Aadhaar is stored masked
(`§6.3`) — so full-value verification is impossible by design; say so on screen.

---

### HR-05 · Employee — contract & category — rank 5 · MVP · detail
- **Q:** *"what are the terms of this person's employment?"*
- **Modules:** `§6.3 EmploymentContract` ("center of gravity — vacation flag + auto-expiry"),
  `§6.3 StaffCategory`, `M3 §Business rules`, `M6 §Business rules`.
- **Must contain:** staff category and `kind`; `employment_type` (`permanent · probation · contract ·
  visiting`); **`is_vacation_staff`** with its downstream consequences spelled out (leave accrual + pay);
  `doj`, `confirmation_date`, `contract_end_date`, notice period, `pay_group_id`; contract history
  (effective-dated, `§4.3`).
- **Must NOT contain:** salary amounts (PY-05 — the pay **group** is here, the pay **amount** is payroll's);
  documents; leave balances (they derive from this, shown as a consequence line).
- **States:** active · probation · expiring · **expired** (auto-expiry, `M6 §Acceptance`) · renewed ·
  superseded (history) · exited.
- **Scope:** campus → group.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Create a new contract version** · card primary | HR (campus) | `people.manage` | effective date; category; `employment_type`; **`is_vacation_staff`** (**no default** — it must be a deliberate choice, it changes leave *and* pay); end date; notice; pay group | **supersedes, never edits** (`§4.3`); writes a `ServiceRecord`; **recomputes leave eligibility** (`M8 §Business rules`) and may change payroll treatment; audited | overlapping effective dates → blocked; a vacation-staff flip mid-year → **must warn about existing leave balances** | prior versions remain in history | **`[proposed]` yes** — the flag moves money (§11) |
| **Confirm probation** · card | HR (campus) | `employment_type=probation`; confirmation date reached or overridden | confirmation date **default today**; note | contract updated; `ServiceRecord(confirmed)`; notification; audited | early confirmation → allowed with a reason | supersede with a further version | no |
| **Renew / extend a fixed-term contract** · card | HR (campus) | `contract_end_date` set | new end date; changed terms | supersedes; `ServiceRecord`; the renewal queue (HR-25) clears | past-dated renewal → warns about the gap in coverage | supersede | **`[proposed]`** — mass renewal is a Principal decision (§11) |
| **Change department / campus (transfer)** · card | HR (campus/group) | target within the caller's scope | effective date; retain service continuity flag (**P2** — `blueprint §12`) | `ServiceRecord(transferred)`; reporting lines and approval chains re-point | cross-campus with campus-only scope → blocked | supersede | no |
| **View contract history** · card | HR (campus) | ≥1 version | — | effective-dated list with actor and timestamp | — | n/a | no |

**Non-happy paths:** contract auto-expires while the employee is still working → HR-25 must catch it, and
attendance/payroll behaviour for an expired contract is **unspecified** (**flag**, §11 — does payroll still
pay them?). Vacation-staff flag flipped after leave was accrued → the balance correction path is not
specified.

---

### HR-06 · Employee — service book — rank 8 · MVP · detail
- **Q:** *"what is this person's career history here?"*
- **Modules:** `§6.3 ServiceRecord` ("immutable career timeline; feeds gratuity"), `M3 §Business rules`,
  `M12 §Business rules` (gratuity from continuous service), blueprint §1 "★ Digital service book **[MVP]**".
- **Must contain:** the immutable timeline (`joined · confirmed · promoted · transferred · revised ·
  exited`) with effective dates, details and actor; **continuous-service total** (the gratuity basis);
  breaks in service.
- **Must NOT contain:** editable fields (it is immutable — entries are *added*, never changed); salary
  figures (a `revised` event is recorded, the amount lives in payroll); documents.
- **States:** loading · single-entry (new joiner) · gaps in service · exited · gratuity-eligible (≥5 years,
  `M12 §Business rules`).
- **Scope:** campus → group.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Add a service event** · card primary | HR (campus) | `people.manage` | `event_type` (`joined · confirmed · promoted · transferred · revised · exited`); effective date; details | appended (**never edited** — `§6.3` "immutable"); may affect gratuity eligibility; audited | back-dated before DOJ → blocked | **no** — a correcting entry is added, the original stands | **`[proposed]` yes** for entries that change gratuity eligibility (§11) |
| **Download the service book** · card header | HR (campus) | ≥1 entry | PDF | the inspection-ready artefact (blueprint §1); export audited | — | n/a | no |
| **View the gratuity basis** · card | HR / Payroll (campus) | ≥1 entry | — | continuous service computed from the timeline, with breaks named — the F&F input (`M12`) | — | n/a | no |
| ~~Edit / delete an entry~~ | **hidden for everyone** | — | — | — | — | — | governance: immutability (`§6.3`, `§4.2`) |

**Non-happy paths:** a rehired employee with a prior stint → continuous service must reflect the break;
see the rehire gap in §11.

---

### HR-07 · Employee — documents — rank 6 · MVP · detail
- **Q:** *"what documents do we hold for this person, and are they valid?"*
- **Modules:** `M4 §Business rules`, `§6.4 StaffDocument`, `M4 §API` (HR upload), `M4 §Permissions`
  (`documents.manage`, `documents.verify`).
- **Must contain:** documents by type with `verification_status`, `issued_on`, `expires_on`, `source`,
  uploader; **expiry marks**; version history (superseded documents retained — `M4 §Acceptance`); open
  requests against this employee; the required-document checklist for the staff category `[proposed]`.
- **Must NOT contain:** the employee's own upload path (that is EMP-11 via a request); payroll or personal
  edits.
- **States:** complete · missing required types · pending verification · rejected · expiring · **expired** ·
  request open/submitted · access-restricted type (police verification, `§8 Child-safety`).
- **Scope:** campus → group.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Upload a document** · card primary | HR with `documents.manage` (campus) | — | `doc_type` (`degree · bed · tet · police_verif · license · aadhaar · pan · …`, `§6.4`); file; `issued_on`; **`expires_on`** where the type carries expiry; `verification_status` **defaults to `pending`** even for HR uploads `[proposed]` — self-verifying on upload defeats M4's purpose | `StaffDocument` created with `source=hr_upload`; expiry watch begins (`M14`); audited | wrong type/oversize named; a type that already exists → offers *replace* (which supersedes, keeping history) | supersede, never delete | **verification is the second step** (`documents.verify`) |
| **Raise an update request** · card / row | HR (campus) | employee has a `User` (they must be able to respond) | `doc_type`; reason; `due_date` | `DocumentUpdateRequest` `status=open`; employee notified; appears in EMP-10/11 | no `User` yet → blocked with "invite the employee first" | HR can cancel while `open` (`M4 §API` `/cancel`) | yes — HR verifies the response |
| **Verify a response** · request row | HR with `documents.verify` (campus) | request `status=submitted` | approve → promote | response promoted to a **new/replacement `StaffDocument`** with `verification_status=verified`; **the old is retained in history** (`M4 §Acceptance`); audited; employee notified | already verified/cancelled → stale state shown | no — a further request supersedes | this **is** the second pair of eyes on the employee's upload |
| **Reject a response** · request row | HR with `documents.verify` | `status=submitted` | reason **required** | `rejected`; employee notified with the reason; HR may re-request (`M4 §Workflow` `Rejected --> Open`) | — | re-request | no |
| **Cancel a request** · request row | HR (campus) | `status=open` | reason optional | `cancelled`; employee's action band clears | already submitted → **shown disabled** | no | no |
| **Set / correct an expiry date** · row | HR (campus) | document exists | date | expiry watch recalculates; alerts re-scheduled (`M14 §Business rules`) | past date → immediately marks expired, with a warning | yes | no |
| **View version history** · row menu | HR (campus) | ≥2 versions | — | superseded documents with dates and actors | — | n/a | no |
| ~~Delete a document~~ | **hidden** | — | — | — | — | — | governance: supersede-never-delete (`§4.2`, `M4 §Acceptance`) |

**Non-happy paths:** ATS-imported documents arrive `pending` in bulk at conversion (`§6.5 (conversion)`) →
the verification queue must not drown; batch verification with per-item evidence is needed (HR-09).
Police-verification documents are access-restricted (`§8 Child-safety`) — the **restriction model (who may
open them) is unspecified** (§11).

---

### HR-08 · Staff categories & taxonomy — rank 18 · MVP · setup
- **Q:** *"what kinds of staff do we employ, and what does each require?"*
- **Modules:** `§6.3 StaffCategory` (name, `kind`, `min_qualification`), `M3 §API`
  (`…/staff-categories`), blueprint §1 "★ Staff-type taxonomy specific to education **[MVP]**".
- **Must contain:** categories with `kind` (`teaching · non_teaching · support · guest`),
  `min_qualification` (the ATS eligibility basis — `M5 §Business rules`), and the count of staff in each;
  the education taxonomy the blueprint enumerates (PRT/TGT/PGT, NTT, Class-IV, transport, hostel, guest
  per-lecture).
- **Must NOT contain:** pay groups (PY-02 — pay logic is payroll's); leave policy (HR-26); individual staff.
- **States:** empty (seeded defaults) · in use (deletion blocked) · unused · qualification norms unset.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Add a category** · page primary | HR / Group Admin (campus/group) | — | name; `kind` (**no default**); `min_qualification` (TET/CTET/NET/B.Ed set) | available to contracts (HR-05) and ATS screening (HR-17) | duplicate name in scope → blocked | editable while unused | no |
| **Edit a category** · row | HR / GA | — | as above | **existing contracts are not retro-changed**; the change applies going forward; audited | changing `min_qualification` re-flags open applications `[proposed]` — the spec screens "at shortlist" only | yes | no |
| **Deactivate a category** · row menu | HR / GA | no active contract uses it | confirm | hidden from new contracts; historical records keep it | in use → **shown disabled** with the count | yes | no |
| **View staff in a category** · row | HR (campus) | — | — | HR-02 filtered | — | yes | no |

**Non-happy paths:** two campuses in a group want different taxonomies → categories are tenant-level in
`§6.3` (no campus scoping); **flag** (§11).

---

### HR-09 · Document control queue — rank 7 · MVP · destination
- **Q:** *"what document work is outstanding across my staff?"*
- **Modules:** `M4 §Workflow` (state machine), `M4 §API`, `M4 §Acceptance`, `M14 §Business rules`.
- **Must contain:** one queue with explicit state lanes — **to verify** (`submitted`) · **awaiting
  employee** (`open`) · **overdue** · **rejected/re-request needed**; requester, employee, doc type, age,
  due date; bulk raise; the verification action inline or via HR-10.
- **Must NOT contain:** expiry watch (HR-11 — "about to lapse" is a different question from "a request is
  in flight"); the employee's own document holdings (HR-07).
- **States:** empty (designed) · loading · error · overdue present · high volume after an ATS conversion ·
  filtered.
- **Scope:** campus → group.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Verify** · row | HR with `documents.verify` | `status=submitted` | open the response first (**the control is disabled until the file has been opened** `[proposed]` — verification without looking is the failure mode this queue invites) | promotes to `StaffDocument` verified; old retained; audited | — | no | this is the check |
| **Reject** · row | HR with `documents.verify` | `status=submitted` | reason **required** | employee notified; may be re-requested | — | re-request | no |
| **Raise requests in bulk** · page primary | HR (campus) | ≥1 employee selected (from HR-02 or a filter) | doc type; reason; due date; **preview of who will receive it** | N `DocumentUpdateRequest`s created; employees notified | employees without a `User` are listed and excluded, never silently skipped | cancel individually | yes |
| **Send a reminder** · row menu | HR (campus) | `status=open`, past a threshold | channel per `M14` | reminder sent; audited | — | n/a | no |
| **Extend the due date** · row menu | HR (campus) | `status=open` | new date | updated; employee notified | past date → blocked | yes | no |
| **Cancel a request** · row menu | HR (campus) | `status=open` | reason | `cancelled` | already submitted → disabled | no | no |
| **Filter / sort** · card header | HR (campus) | — | lane (**default: to verify**), doc type, department, age, overdue-only | — | — | yes | no |

**Non-happy paths:** 400 ATS-imported documents land `pending` at once → the queue needs a per-batch view
and a realistic throughput path; otherwise M4's guarantee degrades into rubber-stamping.

---

### HR-10 · Verify document response — rank 7b · MVP · task
- **Q:** *"is this the document we asked for, and is it genuine?"*
- **Modules:** `M4 §Business rules` #3–#4, `M4 §API` (`/verify`, `/reject`), `M4 §Acceptance`.
- **Must contain:** side-by-side **current live document vs the submitted response**; the request's reason
  and due date; the employee's note; issue/expiry capture; verify / reject with reason.
- **Must NOT contain:** editing the employee's file content; other employees; a bulk verify (deliberate —
  verification is a per-document judgement).
- **States:** submitted (actionable) · verifying · verified · rejected · cancelled meanwhile · file
  unreadable · previous version absent (first-ever document).

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Verify & promote** · page primary | HR with `documents.verify` | response opened; `expires_on` captured where the type requires it | confirm | new `StaffDocument` `verified`; old superseded and retained; expiry watch set; employee notified; audited | missing required expiry → submit **disabled**, naming the field | **no** | this is the check |
| **Reject** · page secondary | HR with `documents.verify` | — | reason **required**, from a picker (`illegible · wrong document · expired · name mismatch · other`) + free text | `rejected`; employee sees the reason (EMP-10) | — | re-request | no |
| **Re-request immediately** · after reject | HR (campus) | just rejected | pre-filled new request | new `open` request (`M4 §Workflow`) | — | cancel | yes |
| **Open the file** · viewer | HR (campus) | file exists | zoom/rotate | access logged (`§8`) | corrupt file → reject path with the reason pre-filled | n/a | no |

---

### HR-11 · Expiry watchlist — rank 9 · MVP · destination
- **Q:** *"what is about to lapse?"*
- **Modules:** `M14 §Business rules` ("scheduled scans for **document/contract expiry** (lead times)"),
  `M14 §Acceptance` ("a licence expiring in 30 days notifies employee + HOD + HR"), `§6.4 expires_on`,
  `§6.3 contract_end_date`, blueprint §1 "★ Document-expiry alerts **[MVP]**".
- **Must contain:** one list of things with a date that matters — documents (`expires_on`), contracts
  (`contract_end_date`), **police/background verification validity**, driver licences and medical fitness
  (transport staff); days remaining; who has been notified; the action (raise a request / start renewal).
- **Must NOT contain:** statutory due dates (AC-01 — a different owner, a different calendar); requests
  already in flight (HR-09).
- **States:** empty · loading · error · **expired items present** (lead with them) · notified · action in
  progress · suppressed/acknowledged.
- **Scope:** campus → group. Employees and Dept Heads receive the *alerts* (`M14 §Acceptance`) but the
  **watchlist is HR's** — this is the anti-duplication rule for expiry.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Raise a document request** · row | HR (campus) | item is a document | pre-filled doc type + due date derived from the expiry | `DocumentUpdateRequest` open (HR-09) | employee has no `User` → blocked with the reason | cancel | yes |
| **Start a contract renewal** · row | HR (campus) | item is a contract | — | routes to HR-25 / HR-05 renewal | — | yes | yes (Principal decides) |
| **Set the lead time** · page header | HR / GA (campus/group) | `notification.manage` `[proposed]` | days before expiry per item type; **default 30** (`M14 §Acceptance` uses 30) | rescheduled alerts | — | yes | no |
| **Acknowledge / snooze** · row menu | HR (campus) | — | snooze 7/14/30 days **default 7** | hidden until then; **expired items cannot be snoozed** | — | yes | no |
| **Export** · page header | HR (campus) | — | CSV; **the child-safety compliance evidence artefact** | audited | — | n/a | no |

**Non-happy paths:** a document expires with no replacement and the staff member keeps working → this is a
**child-safety and compliance failure**, and the watchlist must escalate rather than merely list (see
HR-12).

---

### HR-12 · Verification & child-safety board — rank 10 · MVP · destination
- **Q:** *"is every person working with children cleared, right now?"*
- **Modules:** `§8 Child-safety` ("Police/background-verification records access-restricted; expiry alerts
  prevent lapses"), `§6.4 StaffDocument.doc_type=police_verif`, blueprint §11 "Background/police
  verification tracking (child-safety mandate) **[MVP]**".
- **Must contain:** every active staff member × verification state (`verified · pending · expired ·
  missing`) with the date; **staff with student contact prioritised**; the count that is *not* cleared as
  the headline; the route to raise a request; an audit-ready export.
- **Must NOT contain:** the verification **document contents** for unauthorised viewers (access-restricted
  — `§8`); other document types (HR-11 covers general expiry); disciplinary information (nowhere in scope).
- **States:** all clear · **gaps present** (lead) · pending verification · expired · new joiner within the
  grace window `[proposed]` · restricted view (metadata only).
- **Scope:** campus → group. Principals see their campus (this is their compliance exposure).

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Raise a verification request** · row | HR (campus) | staff member lacks a valid `police_verif` | pre-filled request, due date **default 14 days** `[proposed]` | request open; employee + HOD notified | no `User` → blocked | cancel | yes — HR verifies |
| **Record an external verification** · row | HR with `documents.manage` | agency result received | upload; issued/expiry dates; agency name `[proposed]` (no vendor field exists in `§6.4`) | `StaffDocument(police_verif)` created `pending` → verified via HR-10 | — | supersede | yes |
| **Export the compliance register** · page header | HR / Principal (campus) | — | PDF/CSV; **audit-ready** | export audited; this is the artefact an inspection asks for | — | n/a | no |
| **Flag a staff member for restricted duty** · row menu · **`[proposed]`** | HR / Principal | verification missing/expired | reason | records the decision; notifies the HOD | — | yes | yes — reason: the spec mandates the tracking but names **no consequence**; a school needs one (§11) |

**Non-happy paths:** verification expired for a serving teacher → the board must state the exposure plainly.
**Flag**: `§8` restricts access to these records but does not say **which role** may open them (§11).

---

### HR-13 · Requisitions — rank 11 · MVP · destination
- **Q:** *"what are we hiring for, and where has each request got to?"*
- **Modules:** `§6.5 Requisition`, `M5 §Business rules` (budget approval before posting), `M5 §API`
  (`…/requisitions`, `/approve`), `M5 §Permissions` (`ats.manage`).
- **Must contain:** requisitions with campus, department, staff category, headcount, `budget_ctc`,
  `status` (`draft · pending_approval · approved · rejected · closed`), the approver and where it sits in
  the chain, and **filled-vs-open headcount**.
- **Must NOT contain:** the approval decision (PR-04 — approving is the approver's screen); candidates
  (HR-16); postings (HR-14).
- **States:** empty · draft · pending approval (with the current approver named) · approved (postable) ·
  rejected · partially filled · closed · **budget above the requester's authority**.
- **Scope:** campus → group.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Create a requisition** · page primary | HR (campus) | `ats.manage` | campus, department, staff category, headcount (**default 1**), `budget_ctc` (`Decimal`), justification **required**, target join date | `status=draft` | — | yes while draft | **yes — budget approval (PR-04/GA)** |
| **Submit for approval** · row / detail | HR (campus) | draft complete | confirm; the resolved approval chain is **shown before submitting** | `status=pending_approval`; approver notified (`M5 §Business rules`) | chain unresolvable (no approver configured) → blocked with an admin-facing reason — see the authority-threshold gap in §11 | withdraw while pending `[proposed]` | yes |
| **Create a posting** · row | HR (campus) | `status=approved` | — | routes to HR-14 | not approved → **shown disabled** with "awaiting <approver>" | yes | no |
| **Close a requisition** · row menu | HR (campus) | approved or pending | reason; confirm if open headcount remains | `status=closed`; open postings closed; audited | — | no (raise a new one) | no |
| **Clone** · row menu | HR (campus) | — | — | new draft pre-filled (seasonal hiring repeats) | — | yes | yes |
| **Filter** · card header | HR (campus) | — | status (**default open**), department, category | — | — | yes | no |

---

### HR-14 · Job postings — rank 12 · MVP · destination
- **Q:** *"what is advertised, where, and until when?"*
- **Modules:** `§6.5 JobPosting` (requisition_id, `channel`, published_at, closes_at), `M5 §API`
  (`…/job-postings`), blueprint §11 "Career portal + job posting/syndication **[MVP]**".
- **Must contain:** postings with the parent requisition, `channel` (`career_site · board · referral`),
  publish/close dates, application count, live/closed state, and the public link.
- **Must NOT contain:** the candidate pipeline (HR-16); requisition approval (PR-04); `budget_ctc` in any
  public-facing preview.
- **States:** draft · scheduled · **live** · closing soon · closed · no applications yet · requisition
  closed underneath it.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Create a posting** · page primary | HR (campus) | parent requisition `approved` | channel (**default `career_site`**); title; description; `closes_at` (**default +30 days**); publish now or schedule | draft or scheduled | requisition not approved → blocked | yes while draft | no |
| **Publish** · row / detail | HR (campus) | draft complete | confirm; **the public preview is shown first** (it is externally visible — nothing internal must leak) | `published_at` set; PUB-01 lists it | — | **unpublish is possible but the link may be cached** — say so | no |
| **Close early** · row menu | HR (campus) | live | reason | stops accepting applications; PUB-01 shows it closed | in-flight applications are unaffected | reopen by extending `closes_at` | no |
| **Extend the closing date** · row menu | HR (campus) | live or just closed | new date | posting reopens/extends | past date → blocked | yes | no |
| **Copy the public link** · row menu | HR (campus) | published | — | — | — | n/a | no |
| **Preview as a candidate** · row menu | HR (campus) | — | — | renders PUB-01/02 exactly as the public sees it | — | n/a | no |

**Non-happy paths:** posting live after its requisition was closed → must auto-close, and the board should
show why.

---

### HR-15 · Candidate pool — rank 14 · MVP · destination
- **Q:** *"who do we already know?"*
- **Modules:** `§6.5 Candidate` ("de-duplicated talent pool"), `M5 §API` (`…/candidates`).
- **Must contain:** candidates with qualifications, source, applications to date, last activity; duplicate
  detection; the DPDP retention state of the record (`§8`).
- **Must NOT contain:** stage decisions (HR-16 — the pipeline is per posting); offers (HR-20); staff
  records (HR-02 — a candidate is not an employee until conversion).
- **States:** empty · loading · error · duplicate suspected · candidate applied to several postings ·
  retention window expiring `[proposed]` · converted to employee (linked, read-only).

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Add a candidate manually** · page primary | HR (campus) | `ats.manage` | name, contact, résumé, qualifications, `source` (**default `direct`**) | `Candidate` created; dedup check runs | exact email/phone match → offers to merge instead of creating | yes (delete before any application) | no |
| **Merge duplicates** · row menu | HR (campus) | ≥2 matched candidates | choose the surviving record; preview what merges | applications re-pointed; audited | — | **no** — merges are hard to unwind; confirm explicitly | no |
| **Attach to a posting** · row menu | HR (campus) | an open posting exists | posting picker | creates an `Application` at `applied` | already applied → blocked with a link | withdraw the application | no |
| **Search / filter** · card header | HR (campus) | — | qualification (TET/CTET/NET/B.Ed), category, source, applied-within | — | — | yes | no |
| **Delete / anonymise a candidate** · row menu | HR (campus) | no active application `[proposed]` | confirm; DPDP erasure basis recorded (`§8`) | record anonymised; audit retains the action, not the PII | active application → blocked | no | no |

---

### HR-16 · Application pipeline — rank 13 · MVP · destination
- **Q:** *"where is every candidate for this role?"*
- **Modules:** `§6.5 Application` (`stage`, `eligibility_flags`), `M5 §API` (`/advance`, `/reject`),
  `M5 §Workflow`.
- **Must contain:** stage columns (`applied · screening · shortlisted · interview · offer · hired ·
  rejected`) with counts; per-card: candidate, qualifications, **eligibility flags** (TET/CTET/NET/B.Ed —
  `M5 §Business rules`), age in stage; posting selector.
- **Must NOT contain:** the interview scorecard (HR-19); offer terms (HR-20); the requisition's budget;
  candidates from other postings.
- **States:** empty · loading · error · stage overflow · **ineligible candidates marked, not hidden**
  (`M5 §Business rules` — "ineligible candidates are marked, not silently dropped") · stalled candidates ·
  posting closed.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Advance a candidate** · card drag / menu | HR (campus) | current stage allows the next | target stage; note | `Application.stage` updated; candidate notified per stage policy `[proposed]`; audited | skipping stages → allowed with a confirm, since real hiring does; advancing an **ineligible** candidate requires an explicit override reason (`M5 §Business rules`) | move back (audited) | no |
| **Reject** · card menu | HR (campus) | not `hired` | reason from a picker + free text; **notify the candidate?** (default **yes**) | `stage=rejected`; candidate notified if chosen | — | reinstate (audited) | no |
| **Run eligibility screening** · board header | HR (campus) | ≥1 candidate at `screening` | evaluates `qualifications` against the category's `min_qualification` (`§6.3`) | sets `eligibility_flags`; **marks, never auto-rejects** | qualification data missing → flagged as "cannot assess", not "ineligible" | re-runnable | no |
| **Schedule an interview** · card menu | HR (campus) | stage ≥ `shortlisted` | routes to HR-18 | `Interview` created | — | yes | no |
| **Make an offer** · card menu | HR (campus) | interviews complete or overridden | routes to HR-20 | — | — | yes | **yes — offers carry CTC; approval is via the requisition budget** |
| **Bulk reject** · bulk bar | HR (campus) | ≥2 selected | reason; notify toggle | as per card | — | reinstate individually | no |
| **Filter** · board header | HR (campus) | — | eligibility, qualification, source, age-in-stage; **default: all active** | — | — | yes | no |

**Non-happy paths:** a candidate is ineligible but the school wants to hire anyway (a real, legal case for
support roles) → the override must be **recorded with a reason**, not blocked outright.

---

### HR-17 · Application detail & screening — rank 13b · MVP · detail
- **Q:** *"is this candidate right for this role?"*
- **Modules:** `§6.5 Application/Candidate`, `M5 §Business rules` (eligibility screening),
  `M5 §Acceptance`.
- **Must contain:** résumé viewer; structured qualifications vs the category's `min_qualification` with a
  **pass/fail per requirement**; eligibility flags with the reason; application history and notes;
  interview outcomes to date; the stage-advance control.
- **Must NOT contain:** the offer (HR-20); other candidates; the scorecard entry form (HR-19 — panel-owned).
- **States:** eligible · **ineligible (marked, with the specific unmet norm)** · cannot assess (missing
  data) · in interview · offered · rejected · converted.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Add / correct a qualification** · card | HR (campus) | `ats.manage` | type, institution, year, grade, certificate | re-runs screening; audited | — | yes | no |
| **Add a note** · card | HR (campus) | — | text; internal-only (**never candidate-visible**) | appended | — | no | no |
| **Advance / reject** · header | HR (campus) | as HR-16 | as HR-16 | as HR-16 | — | as HR-16 | no |
| **Request documents from the candidate** · header · **`[proposed]`** | HR (campus) | stage ≥ `shortlisted` | doc list; due date | tokenised upload (PUB-03 pattern) → carried into `StaffDocument` at conversion (`§6.5 (conversion)`) | — | cancel | yes — verified after conversion |
| **View the résumé** · viewer | HR (campus) | résumé exists | — | access logged | unreadable → ask the candidate | n/a | no |

---

### HR-18 · Interview schedule — rank 15 · MVP · destination
- **Q:** *"who is interviewing whom, and when?"*
- **Modules:** `§6.5 Interview` (application_id, round, scheduled_at, panel JSON, scorecard JSON, outcome),
  `M5 §API` (`…/interviews`), blueprint §11 "Interview scheduling + structured feedback **[MVP]**".
- **Must contain:** interviews by day with candidate, round, panel members, mode/location, and
  **scorecard-submitted state per panellist**; reschedule; the panel's availability context `[proposed]`.
- **Must NOT contain:** the scorecard content (HR-19 — and scores must not be visible to other panellists
  before submission, or they anchor); offers.
- **States:** scheduled · today · in progress · completed (all scorecards in) · **awaiting scorecards** ·
  no-show · rescheduled · cancelled.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Schedule an interview** · page primary | HR (campus) | application at `shortlisted`+ | round (**default next**); date/time; panel (users within scope); mode (in-person/online); location/link | `Interview` created; **panel + candidate notified** (`M14`); calendar invite `[proposed]` | panel member outside scope → blocked; slot conflicts → warned | reschedule/cancel | no |
| **Reschedule** · row menu | HR (campus) | not completed | new slot; reason | all parties re-notified | — | yes | no |
| **Cancel** · row menu | HR (campus) | not completed | reason | notified; application stays at its stage | — | re-schedule | no |
| **Chase scorecards** · row menu | HR (campus) | interview past, scorecards missing | — | reminder to the panellist | — | n/a | no |
| **Record the outcome** · row | HR (campus) | ≥1 scorecard in | outcome: `proceed · hold · reject` (`§6.5 Interview.outcome`) | drives the pipeline; audited | no scorecards → warns before allowing an outcome | editable until the stage advances | the panel's scorecards **are** the evidence |
| **Mark a no-show** · row menu | HR (campus) | scheduled time passed | who did not attend | recorded; the pipeline card is flagged | — | yes | no |

---

### HR-19 · Interview scorecard — rank 15b · MVP · task
- **Q:** *"what did I make of this candidate?"*
- **Modules:** `§6.5 Interview.scorecard (JSON)`, `M5 §Business rules` ("interview scorecards drive an
  outcome"), `M5 §API` (`/scorecard`).
- **Must contain:** the structured criteria for the round; scores; strengths/concerns; a recommendation;
  **submit-once** semantics; the candidate's résumé alongside.
- **Must NOT contain:** other panellists' scores **before I submit** (anchoring); salary/offer terms; the
  hiring decision.
- **States:** assigned · draft · submitted (read-only) · overdue · interview cancelled · round reopened.
- **Owned by:** the **panellist**, who may be a Dept Head, Principal, HR or a senior Employee (`M5 §Actors`
  — "Interview Panel"). Defined here because M5 is HR's module.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Score a criterion** · form | panellist (assigned) | I am on the panel; not submitted | scale from the round's template `[proposed]` (the spec leaves `scorecard` as free JSON — a template source is needed, §11); comment | draft saved | — | yes while draft | no |
| **Submit the scorecard** · page primary | panellist | all criteria scored; recommendation given | confirm naming finality | stored on `Interview.scorecard`; **other panellists' scores become visible after submission**; HR notified | incomplete → names the gaps | **no** — resubmission needs HR to reopen | the aggregate of panel scorecards is the check |
| **Decline to participate** · header · **`[proposed]`** | panellist | before the interview | reason | HR re-panels | — | n/a | no |
| **View the résumé** · side panel | panellist | — | — | access logged | — | n/a | no |

---

### HR-20 · Offers — rank 16 · MVP · destination
- **Q:** *"where do our offers stand?"*
- **Modules:** `§6.5 Offer`, `M5 §Business rules` (CTC + `pay_group_id` + join date; digital acceptance),
  `M5 §API` (`/send`, `/accept`).
- **Must contain:** offers with candidate, role, **CTC**, `pay_group_id`, join date, `status`, sent/expiry
  dates, and the letter artefact; a CTC calculator against the pay group's structure (blueprint §11 MVP).
- **Must NOT contain:** the salary structure editor (PY-03); the conversion review (HR-21); other
  candidates' offers in the same view as an individual's terms.
- **States:** draft · sent · **accepted** (conversion pending) · declined · expired · superseded/revised ·
  above the requisition's `budget_ctc` (must be visible).

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Create an offer** · page primary | HR (campus) | application at `offer` stage; requisition approved | CTC (`Decimal`); `pay_group_id` (**no default** — it decides the pay logic, `§6.9 PayGroup.kind`); join date; expiry (**default +7 days**); letter template | `status=draft`; **CTC over `budget_ctc` is flagged and requires an override reason** (`M5 §Business rules` budget approval) | pay group missing → blocked with a route to PY-02 | yes while draft | **yes — over-budget offers should route back to the approver** `[proposed]` (§11) |
| **Send the offer** · row / detail | HR (campus) | draft complete; letter generated | confirm; **preview the exact letter the candidate sees** | `status=sent`; candidate receives PUB-04; audited | letter generation failure → blocked | revise-and-resend supersedes | no |
| **Revise an offer** · row menu | HR (campus) | `sent`, not accepted | new terms; reason | **supersedes** — the old token shows "superseded" (`§4.3` spirit) | already accepted → **shown disabled** | supersede | as above |
| **Withdraw an offer** · row menu | HR (campus) | not accepted | reason **required** | `status` closed; candidate notified | accepted → disabled, use the exit path instead | no | **`[proposed]` yes** — withdrawing an accepted-adjacent offer has legal weight (§11) |
| **Mark accepted offline** · row menu · **`[proposed]`** | HR (campus) | `sent` | date; evidence | same conversion path as PUB-04 | — | no | yes — HR-21 review |
| **Download the letter** · row menu | HR (campus) | letter exists | PDF | audited | — | n/a | no |

---

### HR-21 · Offer → employee conversion — rank 17 · MVP · task
- **Q:** *"is this accepted hire correctly set up as an employee?"*
- **Modules:** `§6.5 (conversion)` (Offer accepted → **Employee + EmploymentContract + documents carried
  into `StaffDocument` as `ats_import`/`pending`**), `M5 §Acceptance`, `M6 §Workflow`.
- **Must contain:** the created `Employee` + `EmploymentContract` draft for review — `emp_code`, campus,
  department, staff category, `employment_type`, **`is_vacation_staff`**, DOJ, `contract_end_date`, pay
  group; **the carried documents listed with `pending` verification**; the onboarding checklist that will be
  raised; the user invite.
- **Must NOT contain:** salary structure assignment detail (PY-05); re-keying anything the ATS already
  captured (`M5 §Purpose` — "without re-keying"); the candidate pipeline.
- **States:** awaiting review · fields incomplete · converted · **`emp_code` collision** · duplicate person
  detected (rehire) · join date in the past · conversion failed midway (partial).

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Review & complete the record** · form | HR (campus) | offer `accepted` | `emp_code` (**auto-suggested**, editable); department; **`is_vacation_staff`** (no default); notice period; pay group carried from the offer | fields staged | duplicate `emp_code` → blocked; duplicate person → routes to the rehire path (see §11) | yes before confirm | no |
| **Confirm conversion** · page primary | HR (campus) | required fields complete | confirm dialog listing what will be created | `Employee` + `EmploymentContract` + `ServiceRecord(joined)` created; **candidate documents carried as `ats_import`, `verification_status=pending`** (`§6.5`); leave balances initialised (`M3 §Workflow`, `M8`); onboarding tasks raised (M6); user invite queued; `offer.accepted` webhook fires (`M16 §Business rules`); audited | partial failure → the whole conversion must be **idempotent and resumable** (`§7 Concurrency`), never half-created | **no** — reversal is an exit, not a delete | no — but every carried document still needs HR verification (HR-09) |
| **Skip the invite for now** · form option | HR (campus) | — | **default: send the invite** | employee exists without a login (visible state in HR-02) | — | invite later | no |
| **Set the pre-boarding document request** · form | HR (campus) | — | doc list; due date | tokenised PUB-03 link sent | — | cancel | yes |

**Non-happy paths:** candidate accepts but never joins → **flag** (§11), no "did not join" path exists;
today it would require an immediate exit, which pollutes `ServiceRecord`. Join date in a locked payroll
month → warn about arrears.

---

### HR-22 · Onboarding checklists — rank 19 · MVP · destination
- **Q:** *"what is left before this joiner is ready?"*
- **Modules:** `M6 §Purpose`, `M6 §Business rules` (checklist tasks: documents, assets, induction),
  `M6 §API` (`…/onboarding-tasks`), `M6 §Workflow`.
- **Must contain:** joiners with a task checklist and owner per task (HR, IT, department, employee),
  due dates, completion state, and blockers; the joining-week view.
- **Must NOT contain:** the document verification decision (HR-09/HR-10); payroll setup (PY-05 — though its
  absence should appear here as a blocking task); exits (HR-26 lifecycle).
- **States:** not started · in progress · blocked (dependency) · overdue · complete · joiner did not report
  `[proposed]`.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Complete a task** · task row | task owner (campus) | task assigned to me/my role | note; evidence optional | task closed; dependents unblocked; audited | dependency incomplete → **shown disabled** naming the blocker | yes (reopen with a reason) | no |
| **Assign / reassign a task** · task row menu | HR (campus) | — | user within scope | notified | out of scope → blocked | yes | no |
| **Apply a checklist template** · page header | HR (campus) | template exists `[proposed]` (`M6` names checklists but no template entity) | template picker per staff category | tasks generated with due dates relative to DOJ | — | remove tasks individually | no |
| **Add an ad-hoc task** · page header | HR (campus) | — | title, owner, due date | added | — | yes | no |
| **Mark the joiner ready** · joiner header | HR (campus) | all mandatory tasks complete | confirm | joiner flagged active-ready; **payroll inclusion becomes valid** | mandatory tasks open → disabled with the list | yes | no |
| **Nudge an owner** · task row menu | HR (campus) | overdue | — | reminder (`M14`) | — | n/a | no |

---

### HR-23 · Bulk / seasonal onboarding — rank 20 · MVP · task
- **Q:** *"can I bring in this whole batch at once?"*
- **Modules:** `M6 §Business rules` ("supports **seasonal bulk** onboarding and academic-year fixed-term
  contracts with auto-expiry"), `M6 §API` (`POST …/employees:bulk`), blueprint §8 "★ Bulk/seasonal
  onboarding **[MVP]**".
- **Must contain:** file upload with a template; **column mapping**; a per-row validation preview
  (required fields, category exists, pay group exists, duplicate detection); the commit step with a
  summary; the error report for failed rows.
- **Must NOT contain:** silent partial imports; document upload (documents follow via requests);
  salary amounts unless the operator holds the permission.
- **States:** upload · mapping · **validating** · errors present (blocking vs warning distinguished) ·
  ready to commit · committing · committed with a summary · partially committed (must be resumable).

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Download the template** · page header | HR (campus) | — | CSV/XLSX with the required columns incl. **`is_vacation_staff`** and `contract_end_date` | — | — | n/a | no |
| **Upload the file** · page primary | HR (campus) | `people.manage` | file; **default: create-only** (updates need an explicit mode) | parsed; mapping proposed | wrong format/encoding named; size cap | yes (discard) | no |
| **Map columns** · mapping step | HR (campus) | file parsed | auto-mapped where names match; unmapped required columns block | — | — | yes | no |
| **Validate** · mapping step | HR (campus) | mapping complete | — | per-row verdict; duplicates flagged against existing staff | — | yes | no |
| **Commit the import** · page primary | HR (campus) | ≥1 valid row | confirm dialog stating **how many will be created, how many skipped, and that this cannot be undone in bulk**; **idempotency key** (`§7`) so a retry never double-creates | creates `Employee` + `EmploymentContract` + `ServiceRecord(joined)` per row; leave balances initialised; invites optional (**default off for bulk**) | partial failure → committed rows stand, failures are downloadable and re-uploadable | **no bulk undo** — individual records can be deactivated | **`[proposed]` yes** for batches above a threshold (§11) |
| **Download the error report** · results | HR (campus) | failures exist | CSV with reasons | fix and re-upload | — | n/a | no |

**Non-happy paths:** the same file uploaded twice → the idempotency key and duplicate detection must make
the second run a no-op, not 300 duplicate teachers.

---

### HR-24 · Probation & confirmation queue — rank 21 · MVP · destination
- **Q:** *"who is due for confirmation?"*
- **Modules:** `§6.3 EmploymentContract.confirmation_date`, `M3 §Business rules` (lifecycle → ServiceRecord),
  blueprint §8 "Confirmation & probation tracking **[MVP]**".
- **Must contain:** staff on probation with DOJ, due confirmation date, days remaining/overdue, the
  manager's recommendation where a probation appraisal cycle exists (`§6.12 AppraisalCycle.type=probation`),
  and the confirm/extend action.
- **Must NOT contain:** the appraisal itself (DH-07); contract renewal for fixed-term staff (HR-25 — a
  different question); exits.
- **States:** empty · due soon · **overdue** (lead) · extension recommended · confirmed · exited during
  probation.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Confirm** · row | HR (campus) | probation contract; recommendation captured where policy requires | effective date **default the due date**; note | contract superseded to `permanent`; `ServiceRecord(confirmed)`; employee + manager notified; **leave accrual may change** | — | supersede | **`[proposed]` yes** — Principal sign-off is the norm (§11) |
| **Extend probation** · row | HR (campus) | as above | new date **required**; reason **required** | contract superseded; employee notified | new date before today → blocked | supersede | as above |
| **Request a manager recommendation** · row menu | HR (campus) | probation due within the window | — | task/notification to the Dept Head | — | n/a | no |
| **Bulk confirm** · bulk bar | HR (campus) | ≥2 selected, all with recommendations | confirm listing names and effective dates | as per row | rows without a recommendation excluded and named | no | as above |

---

### HR-25 · Renewal & non-renewal queue — rank 22 · MVP · destination
- **Q:** *"whose contract ends, and are we keeping them?"*
- **Modules:** `M6 §Business rules` ("session-end **renewal/non-renewal** workflow"), `M6 §Acceptance`
  ("a fixed-term contract auto-expires at `contract_end_date` and surfaces in the renewal queue"),
  blueprint §8 "★ Mass renewal / non-renewal workflow at session end **[MVP]**".
- **Must contain:** fixed-term/contract/visiting staff with end dates, department, the manager's
  recommendation, and the renew/non-renew decision; the academic-session framing (`M7`); the **mass**
  decision path; who has been informed.
- **Must NOT contain:** F&F computation (PY-19 — but non-renewal must *route* there); probation
  confirmations (HR-24); permanent staff.
- **States:** empty · ending this session · **already expired but still working** (lead — a compliance
  exposure) · renewed · non-renewed (exit initiated) · awaiting the Principal's decision.
- **Scope:** campus; the **decision** is typically the Principal's, executed by HR — both roles use this
  screen, which is why the decision and the execution are separate actions below.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Recommend renew / non-renew** · row | Dept Head / HR (dept/campus) | contract ending within the window | recommendation + reason | visible to the Principal | — | yes until decided | no |
| **Decide: renew** · row | Principal (campus) | recommendation present or overridden | new `contract_end_date` (**default +1 academic year**, `M7`); changed terms optional | contract **superseded** (`§4.3`); `ServiceRecord`; employee notified; renewal letter `[proposed]` | end date not aligned to the AY → warns | supersede | no — this **is** the decision |
| **Decide: do not renew** · row | Principal (campus) | as above | reason **required**; last working day **default the contract end date** | employee → `notice`; **F&F becomes computable** (PY-19); access revocation scheduled (`M12`); notifications | — | reversible before the last working day `[proposed]` | **yes — F&F approval** |
| **Execute in bulk** · bulk bar | HR (campus) | ≥2 decided rows | confirm listing **every name**, the decision, and the total F&F exposure `[proposed]` | as per row | undecided rows excluded and named | no | yes |
| **Extend temporarily** · row menu | HR (campus) | contract expiring/expired | short extension date; reason | supersedes | — | supersede | no |
| **Notify the employee** · row menu | HR (campus) | decision made | template | notification/letter sent; recorded | — | n/a | no |

**Non-happy paths:** a contract that already auto-expired while the person keeps teaching → **flag** (§11):
the spec does not say what payroll and attendance do for an expired contract. This queue must lead with
those cases.

---

### HR-26 · Leave policy & types — rank 23 · MVP · setup
- **Q:** *"how does leave work here?"*
- **Modules:** `§6.7 LeavePolicy/LeaveType` (accrual_rule JSON, carry_forward_cap, encashable,
  **applies_to_vacation_staff**, allows_half_day), `M8 §Business rules`, `M8 §API` (`…/leave-types`),
  `M8 §Permissions`.
- **Must contain:** policy per academic year and scope; leave types with code (`EL · CL · SL · COMP ·
  DUTY · MAT · LOP`), accrual rule, carry-forward cap, encashable flag, **`applies_to_vacation_staff`**,
  half-day allowed; the education types the blueprint requires as MVP (on-duty/exam duty, study,
  sabbatical, paternity, bereavement, marriage); blackout binding to exam/admission `Term`s.
- **Must NOT contain:** individual balances (HR-27); holiday calendars (PR-07); approval-chain routing for a
  single request.
- **States:** draft · **active for the AY** · superseded · not yet configured for the new AY (blocking for
  balance initialisation) · in use (edits restricted).

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Create a policy for an AY** · page primary | HR / GA (campus/group) | an `AcademicYear` exists | scope; AY; name; copy from the previous year (**default on**) | `LeavePolicy` draft | no AY → blocked with a route to GA-06 | yes while draft | no |
| **Add a leave type** · policy card | HR / GA | policy draft or active | code; accrual rule (rate, frequency, pro-ration); carry-forward cap; encashable; **`applies_to_vacation_staff`** (**no default** — this is the education-differentiating switch); `allows_half_day`; max consecutive days `[proposed]` | available to applicants after activation | code duplicated in the policy → blocked | yes while draft | no |
| **Activate the policy** · page primary | HR / GA | ≥1 leave type | confirm dialog stating **"balances will be initialised for N staff"** | balances created per employee per type for the AY (`§6.7 LeaveBalance`); vacation staff correctly **excluded from EL** (`M8 §Acceptance`) | already active → offers supersession instead | **no** — supersede with a new version | **`[proposed]` yes** — leave policy changes have pay consequences via LOP and encashment (§11) |
| **Edit an active type** · type row | HR / GA | policy active | reason **required**; effective date | **supersedes** (`§4.3`); existing balances are recalculated or grandfathered — **flag**: the spec does not say which (§11) | — | supersede | as above |
| **Set blackout windows** · policy card | HR / GA | terms exist (`§6.6 Term`) | pick exam/admission terms; which types are blocked (**default: all except `DUTY`/`MAT`**) | `M8 §Business rules` validation blocks applications in those windows | no terms defined → routes to GA-06 | yes | no |
| **Preview the effect** · page header · **`[proposed]`** | HR / GA | draft | simulate for a sample teacher and a sample admin | shows accrual for both staff kinds before activation — the cheapest defence against the vacation-staff rule being set wrong | — | n/a | no |

---

### HR-27 · Leave balances register — rank 24 · MVP · destination
- **Q:** *"who has what leave balance?"*
- **Modules:** `§6.7 LeaveBalance` (per-AY ledger: opening, accrued, used, balance), `M8 §API`
  (`…/leave-balances`).
- **Must contain:** staff × leave type balance grid for the AY, with opening/accrued/used/balance columns
  that **sum correctly** (principle 4); vacation-staff rows visibly different (EL absent, not zero);
  adjustments history.
- **Must NOT contain:** the request queue (HR-28); policy configuration (HR-26); payroll LOP figures
  (they derive downstream).
- **States:** loading · empty (policy not activated) · error · AY not initialised · adjustment pending ·
  year-end carry-forward pending (**P2** — `blueprint §3` leave-year-end process).

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Adjust a balance** · cell menu | HR (campus) | `leave.manage` `[proposed]` (the spec grants no explicit balance-adjust permission — §11) | delta (+/-); reason **required**; effective date | balance updated; **adjustment is appended, not overwritten**; employee notified `[proposed]`; audited | adjustment making the balance negative → warns and requires an explicit reason | a further adjustment (never an edit) | **`[proposed]` yes** — leave converts to money through encashment and LOP (§11) |
| **Bulk credit / grant** · bulk bar | HR (campus) | ≥2 selected | type; amount; reason | as per row, transactional per employee | — | reverse by a further adjustment | as above |
| **Initialise balances for the AY** · page header | HR (campus) | policy active; balances missing | confirm with the affected count | balances created per `§6.7` | already initialised → **shown disabled** | no | no |
| **Export the register** · page header | HR (campus) | — | CSV/PDF (the leave register is an inspection artefact, blueprint §5 Labour-Code registers are **P2**) | audited | — | n/a | no |
| **View an employee's ledger** · row | HR (campus) | — | — | per-type opening/accrued/used/balance with the request history | — | yes | no |

---

### HR-28 · Leave requests console — rank 25 · MVP · destination
- **Q:** *"what is the leave picture across my campus?"*
- **Modules:** `§6.7 LeaveRequest`, `M8 §API`, `M8 §Permissions`.
- **Must contain:** all requests with status, applicant, department, type, dates, approver, and age;
  the campus leave calendar; **who is away on a given day**; the stuck-approval view (ageing).
- **Must NOT contain:** HR approving on the manager's behalf as the default path (approval belongs to
  `leave.approve` holders — DH-02/PR-03); balance adjustments (HR-27); policy (HR-26).
- **States:** empty · loading · error · stuck approvals · blackout period · high-volume period (vacation
  boundary) · cancelled requests.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Apply on behalf of an employee** · page primary | HR (campus) | `leave.manage` `[proposed]`; the employee cannot self-apply (no login / on leave) | as EMP-06, plus a **reason for applying on their behalf** | request created **attributed to HR** in the audit trail (`§4.2`); normal approval chain still applies | — | cancel while pending | yes — normal chain |
| **Escalate / reassign an approval** · row menu | HR (campus) | pending beyond the SLA; approver absent | new approver within scope | chain re-pointed; audited | — | yes | no |
| **Cancel a request** · row menu | HR (campus) | pending or approved-not-started | reason **required** | balance restored; attendance reverted; employee + approver notified | leave started → **shown disabled** | no | no |
| **Force-approve** · row menu | HR — **hidden** unless the role holds `leave.approve` at campus scope | — | — | — | — | — | governance: HR administering ≠ HR deciding (`M8 §Permissions`) |
| **Export the leave register** · page header | HR (campus) | — | CSV/PDF; AY range **default** | audited | — | n/a | no |
| **Filter** · card header | HR (campus) | — | status, department, type, date range, stuck-only | — | — | yes | no |

---

### HR-29 · Shifts & rosters — rank 26 · MVP · setup
- **Q:** *"what working patterns do we run, and who is on which?"*
- **Modules:** `§6.8 Shift` (campus_id, name, start/end, `type` `fixed/flexi/rotating`, grace_minutes),
  `M9 §Business rules` (shift/grace rules), `M9 §Permissions` (`attendance.manage`), blueprint §2
  "Shift & roster management … for hostel/transport/security/mess staff **[MVP]**".
- **Must contain:** shifts with timings, type, grace minutes, weekly-off pattern, and the assigned staff
  count; assignment of staff to shifts; the roster view for rotating shifts.
- **Must NOT contain:** holidays (PR-07); attendance records (HR-30/DH-03); overtime rates (**P2**).
- **States:** no shifts (default shift assumed — must be explicit) · in use · unassigned staff (they will
  reconcile against nothing) · rotating roster incomplete · effective-dated change pending.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Create a shift** · page primary | HR with `attendance.manage` (campus) | — | name; start/end; `type` (**default `fixed`**); grace minutes (**default 10** `[proposed]` — the field exists, no default is specified); weekly-off days | available for assignment | overlapping identical shift → warned | yes while unassigned | no |
| **Assign staff to a shift** · shift detail | HR (campus) | shift exists | individual or bulk by department/category; **effective from** date (**default tomorrow**, never retroactive by default) | nightly reconciliation uses it from that date (`M9 §Workflow`) | retroactive assignment → warns that past statuses would change and requires a reason | reassign forward | no |
| **Edit a shift's timings** · shift row | HR (campus) | — | reason; **effective from** | **effective-dated** (`§4.3`); past records untouched | attempting a retro edit that would alter a locked payroll month → **blocked** | supersede | **`[proposed]` yes** if it alters a paid month (§11) |
| **Build a rotating roster** · shift detail | HR (campus) | `type=rotating` | pattern; cycle length; start date | roster generated | gaps in coverage listed | yes | no |
| **Deactivate a shift** · row menu | HR (campus) | no staff assigned | confirm | hidden from assignment | staff assigned → **shown disabled** with the count | yes | no |

---

### HR-30 · Attendance exceptions — rank 27 · MVP · destination
- **Q:** *"what did not reconcile, and how do we fix it before payroll?"*
- **Modules:** `M9 §Business rules` (nightly job → exceptions), `M9 §Acceptance`, `§6.8 Regularization`,
  `M9 §Permissions` (`attendance.manage`).
- **Must contain:** exceptions by type — missing punch · single punch · outside geo-fence · device gap ·
  leave/attendance conflict · unassigned shift; affected employee and date; the pending regularization
  requests; the **bulk resolution** path; the count that will otherwise become LOP.
- **Must NOT contain:** the manager's approval queue duplicated (DH-04 is the manager's decision; this is
  HR's administration); paid-days finalisation (PY-08, which consumes this).
- **States:** empty (clean month) · exceptions present · **device outage window** (grouped, not per-person)
  · month closing soon (urgency) · month locked (read-only) · pending manager decisions.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Correct an attendance record** · row | HR with `attendance.manage` (campus) | month not locked | status; in/out times; **reason required** | `AttendanceRecord` updated; paid-days recompute; audited with before/after (`§4.2`) | locked month → **shown disabled** with the run reference and an arrears route | a further correction (audited) | **`[proposed]` yes** — HR editing attendance directly moves pay without a manager in the loop (§11) |
| **Bulk-resolve a device outage** · bulk bar | HR (campus) | an ingestion gap is confirmed (`M16`) | apply `present`/`as-rostered` to the affected staff for the window; **reason required** | mass correction, each row audited; the ingestion incident is referenced | includes staff who were genuinely absent → the preview must list them for exclusion | further corrections | yes |
| **Push to the manager** · row menu | HR (campus) | exception needs a judgement | — | notifies the Dept Head to decide (DH-04) | — | n/a | yes |
| **Re-run reconciliation** · page header | HR (campus) | month not locked | date range | the nightly job re-runs for the range (`M9 §Workflow`); idempotent | job already running → queued | n/a | no |
| **Export exceptions** · page header | HR (campus) | — | CSV | audited | — | n/a | no |
| **Filter** · card header | HR (campus) | — | exception type, department, date range, unresolved-only (**default**) | — | — | yes | no |

---

### HR-31 · Helpdesk queue — rank 28 · MVP · destination
- **Q:** *"which staff questions need answering, and which are breaching SLA?"*
- **Modules:** `M15.1 §Business rules` (categories, auto-assignment, SLA/TAT, escalation, grievance
  restricted), `§6.11 HelpdeskTicket`, `M15.1 §API`.
- **Must contain:** tickets with category, raiser, subject, priority, assignee, **SLA due and breach
  state**, age, status; my-queue vs all-queues; **grievance tickets visible only to the restricted role**
  (`M15.1 §Permissions`).
- **Must NOT contain:** the raiser's private data beyond what the ticket carries; other tenants; internal
  comments in any list preview (they are detail-only and never leak to the raiser).
- **States:** empty · loading · error · **breaching SLA** (lead) · unassigned · awaiting the raiser ·
  reopened · grievance (restricted, visually distinct) · escalated.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Assign / reassign** · row | HR with `helpdesk.manage` (campus) | ticket not `closed` | assignee within scope; **default: the category's queue owner** (`M15.1 §Business rules` auto-assignment) | `assignee_user_id` set; notified; audited | assignee lacks access to a grievance ticket → **blocked** | yes | no |
| **Change priority** · row menu | HR (campus) | not `closed` | low/normal/high | `sla_due_at` recalculated per policy; the change is audited | — | yes | no |
| **Open a ticket** · row | HR (campus) | access permitted for the category | — | routes to HR-32 | grievance without the restricted role → **hidden entirely** (not "no access") | yes | no |
| **Bulk assign** · bulk bar | HR (campus) | ≥2 selected, same permission class | assignee | as per row | grievance rows excluded and named as "restricted" | yes | no |
| **Filter** · card header | HR (campus) | — | status (**default open+in_progress**), category, assignee, SLA-breached-only, age | — | — | yes | no |
| **Escalate** · row menu | HR (campus) | SLA breached or manual | escalate-to user | notified (`M14`); recorded | — | n/a | no |

---

### HR-32 · Ticket detail — rank 28b · MVP · detail
- **Q:** *"what is this issue, and how do we close it?"*
- **Modules:** `§6.11 HelpdeskTicket/TicketComment`, `M15.1 §Workflow`, `M15.1 §Acceptance`.
- **Must contain:** the thread with **public and internal comments visually separated**; SLA clock with
  pause/resume history; assignee and category; related records (payslip, leave request) where linked
  `[proposed]`; resolve/close/reopen.
- **Must NOT contain:** any control that would reveal an internal note to the raiser; PII pasted into a
  logged field (`§8` — grievance bodies must never be logged).
- **States:** open · assigned · in progress · awaiting the raiser (SLA paused) · resolved · closed ·
  reopened · **SLA breached** · grievance (restricted handling banner).

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Add a public reply** · composer | assignee / HR (campus) | ticket not closed | text + attachment; **`is_internal=false`** | raiser notified; **SLA may pause** while awaiting them (`M15.1 §Workflow`) | — | no (append-only thread) | no |
| **Add an internal note** · composer toggle | assignee / HR | as above | **`is_internal=true`** — the composer must make this unmistakable (colour **plus** a word, principle 8) | hidden from the raiser (`§6.11`) | — | no | no |
| **Resolve** · header primary | assignee / HR | ticket assigned | resolution summary **required** | `status=resolved`; raiser notified and may reopen; SLA stops; audited | — | reopen | no |
| **Close** · header | HR (campus) | `resolved` | confirm | `status=closed` | — | reopen within the window `[proposed]` | no |
| **Reopen** · header | HR or the raiser | `resolved`/`closed` within the window | reason | `status=reopened`; SLA restarts per policy | — | n/a | no |
| **Change category** · header menu | HR (campus) | not closed | category | may **re-assign** and **re-derive the SLA**; if changed **to** `grievance`, access immediately restricts and prior non-restricted viewers lose sight of it — the UI must say so | — | yes | no |
| **Link a related record** · side panel · **`[proposed]`** | HR (campus) | — | payslip / leave request / document request | context for the agent | — | yes | no |

---

### HR-33 · Helpdesk categories & SLA — rank 29 · MVP · setup
- **Q:** *"what can staff raise, who owns it, and how fast must we answer?"*
- **Modules:** `M15.1 §Business rules` ("**configurable** ticket categories", auto-assignment by category,
  SLA/TAT with escalation), `M15.1 §Permissions`.
- **Must contain:** categories with owner/queue, SLA target, escalation target and threshold, restricted
  flag (grievance), and whether the raiser may set priority; the category list is **data, never hardcoded**
  (`guard-hardcoded-values`).
- **Must NOT contain:** individual tickets (HR-31); notification channel templates (HR-34).
- **States:** seeded defaults · in use (deletion blocked) · no owner assigned (tickets would strand) ·
  restricted category · SLA unset.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Add a category** · page primary | HR / GA (campus/group) | `helpdesk.manage` | name; owner/queue **required**; SLA hours (**no default** — an unset SLA silently disables the product's promise); escalation target + threshold; restricted flag (**default off**) | available in EMP-15 | no owner → blocked | yes while unused | no |
| **Edit SLA** · row | HR / GA | — | hours; business-hours vs calendar-hours (**default business hours**) | applies to **new** tickets; open tickets keep their `sla_due_at` unless explicitly recalculated | — | yes | no |
| **Mark a category restricted** · row | GA (group) | — | confirm; the restricted role | existing tickets in the category become restricted immediately; **viewers lose access** — the confirm must say so | — | yes (but access history stands) | **`[proposed]` yes** — this changes who can see grievances (§11) |
| **Deactivate a category** · row menu | HR / GA | no open tickets | confirm | hidden from EMP-15 | open tickets exist → disabled with the count | yes | no |

---

### HR-34 · Notification templates — rank 30 · MVP · setup
- **Q:** *"what does the system send, to whom, on which channel?"*
- **Modules:** `M14 §API` ("admin templates"), `M14 §Purpose`, `§6.11 Notification` (recipient, channel,
  template, payload), `M13 §Business rules` (Hindi + English via i18n).
- **Must contain:** the event catalogue (approval requested/decided · document request raised/overdue ·
  expiry alert · payslip released · statutory due date · helpdesk SLA breach · appraisal window) × channel
  (`in_app · push · sms · email`) × recipient role; the template body **in both English and Hindi**;
  enable/disable per event-channel; lead times for scheduled scans.
- **Must NOT contain:** hardcoded copy (`guard-i18n-strings`); per-user preferences (SH-03/SH-04);
  provider credentials (GA-10).
- **States:** default templates · customised · **missing Hindi translation** (must be visible, since
  `M13 §Business rules` requires both) · channel disabled · provider not configured (send will fail).

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Edit a template** · row | HR / GA (group) | `notification.manage` `[proposed]` | body per language; merge fields from the event payload; **preview with sample data** | applies to subsequent sends | unknown merge field → blocked, naming it; **Hindi missing → warn, and state the fallback** | revert to the default | no |
| **Enable / disable a channel for an event** · row toggle | HR / GA | — | per event × channel; **statutory/compliance events cannot be fully disabled** `[proposed]` | takes effect immediately | disabling the last channel for a compliance event → blocked with the reason | yes | no |
| **Set the lead time for a scheduled scan** · row | HR / GA | event is scheduled (expiry, statutory due date) | days before; **default 30** (`M14 §Acceptance`) | alert schedule recomputed | — | yes | no |
| **Send a test** · row menu | HR / GA | template valid | recipient = me | test delivered; marked as a test; audited | provider not configured → named, with a route to GA-10 | n/a | no |

---

### HR-35 · Appraisal cycle setup — rank 31 · MVP · setup
- **Q:** *"how does this appraisal round run?"*
- **Modules:** `§6.12 AppraisalCycle` (scope, academic_year_id, name, `type`, **rating_matrix JSON**,
  window_start/end, `status draft/open/locked/closed`), `M17 §Business rules`, `M17 §API` (`/open`,
  `/lock`, `/close`), `M17 §Permissions` (`appraisal.manage`).
- **Must contain:** cycle name, `type` (`term · annual · probation`), academic year, scope, window dates;
  the **rating matrix** (scale, labels, descriptors) — the single source every rating screen reads; the
  stage sequence and which 360° sources are enabled; population in scope; progress by stage.
- **Must NOT contain:** individual ratings (DH-07); moderation (PR-05); goal content (DH-06).
- **States:** `draft` · `open` · `locked` · `closed` · window not started · population unresolved ·
  matrix incomplete (blocking) · overlapping cycle for the same population.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Create a cycle** · page primary | HR / Principal (campus/group) | an `AcademicYear` exists | name; `type` (**no default**); AY; scope; window start/end; population filter (category/department) | `status=draft` | overlapping cycle for the same people → warned, since it corrupts composites | yes while draft | no |
| **Define the rating matrix** · cycle card | HR / Principal | draft | scale points; labels; descriptors; weighting model; **no hardcoded 1–5** (`guard-hardcoded-values`) | every rating screen reads it | incomplete → `open` is **disabled** | yes while draft | no |
| **Enable 360° sources** · cycle card | HR / Principal | draft | `manager` (**always on**) · `peer/classroom observation` (**default on for teaching**) · `student-result linkage` · ~~student/parent~~ (**Later**, amendment A) | determines which inputs are collected | — | yes while draft | no |
| **Open the cycle** · page primary | HR / Principal | matrix complete; population resolved; window valid | confirm dialog naming **how many staff and managers this activates** | `status=open`; goals and self-appraisal become available; everyone notified | window start in the past → warns | **lock** rather than reopen | no |
| **Lock the cycle** · page header | HR / Principal | `open` | confirm | no new self/manager submissions; moderation proceeds (`M17 §Workflow`) | pending submissions → listed before locking | reopening is **`[proposed]`** and unspecified (§11) | no |
| **Close the cycle** · page header | HR / Principal | all reviews finalized or explicitly waived | confirm listing unfinalized reviews | `status=closed`; results released per policy; recommendations flow to PY-06 | unfinalized reviews → named, with a waive-with-reason option | **no** | no |
| **Extend the window** · page header | HR / Principal | `open` | new end date; reason | everyone notified | past date → blocked | yes | no |

---

### HR-36 · Appraisal progress & reports — rank 32 · MVP · destination
- **Q:** *"how far has this cycle got, and what does it say by department?"*
- **Modules:** `M17 §Business rules` ("**Performance reports + department-wise tracking**"),
  `M17 §API` (`…/appraisal-reports`), `M17 §Acceptance` ("department-wise performance reports reconcile to
  the underlying reviews").
- **Must contain:** completion by stage × department (self · manager · 360 · moderation · finalized);
  score distribution by department and staff category; recommendation counts (`increment · promotion ·
  pip`); the reconciliation statement that reports match the underlying reviews.
- **Must NOT contain:** individual ratings for people outside the viewer's scope; salary impact (PY-06);
  moderation actions (PR-05).
- **States:** cycle not open · in progress · stalled stage (lead with the blockers) · complete · closed ·
  **scope-trimmed** (a Dept Head sees only their department).

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Chase a stage** · progress row | HR / Principal (campus) | pending submissions exist | select the laggards; message | reminders sent (`M14`) | — | n/a | no |
| **Run a report** · report row | HR / Principal | ≥1 finalized review | dimension: department **default** · staff category · manager; range = cycle | generated within scope; export audited | no finalized reviews → empty state, not zeros | n/a | no |
| **Export** · result header | HR / Principal | report generated | CSV/PDF; **scores are sensitive** — export audited (`§8`) | file | — | n/a | no |
| **Drill into a department** · chart segment | HR / Principal | scope permits | — | the review list for that department | — | yes | no |

---

### HR-37 · HR reports — rank 33 · MVP · destination
- **Q:** *"what HR report do I need to produce?"*
- **Modules:** `M15 §Purpose` (standard reports), `M15 §Acceptance`, `M3`, `M4`, `M5`, `M6`, `M8`, `M9`.
- **Must contain:** headcount and demographics; joiners/leavers/attrition; document compliance; contract
  expiry; recruitment funnel (time-to-hire is **P2**); leave and attendance registers; probation/
  confirmation status.
- **Must NOT contain:** payroll or statutory registers (PY-20 / AC-09 — different owner and permission);
  custom report building (**P2**); appraisal scores (HR-36).
- **States:** as PR-06 (empty · generating · queued · ready · permission-trimmed).

**Actions** — identical in shape to PR-06 (run · download · schedule `[proposed]` · save a view
`[proposed]`), scoped to HR's campus/group and HR's report set. Not repeated here, deliberately: the report
runner is **one component**, and duplicating its action table would repeat the very mistake this document
exists to stop.

---

# 7 · Payroll Operator

The **maker** in maker-checker. Every financial finalization on these screens opens a gate that a *distinct*
checker must close (`M10 §Permissions`, `DESIGN.md` principle 10 — "the interface must actively refuse to
let one person release money"). Money is **`Decimal`**, Indian lakh-crore grouped, never truncated
(principle 4, `guard-money-float`). Statutory numbers are read from the **pinned** `StatutoryConfig`
(`§4.4`, `guard-statutory-hardcode`).

### PY-01 · Payroll home — rank 1 · MVP · destination
- **Q:** *"where is this month's payroll?"*
- **Modules:** `M10 §Workflow` (the monthly run sequence), `§6.9 PayrollRun.status`, `M12`.
- **Must contain:** the current period's run state as a **pipeline** (`draft → variance_review → approved →
  disbursed`) with what is blocking the next step; readiness pre-checks (paid-days unreconciled · salary
  unassigned · joiners pending · loans/claims awaiting inclusion); the **checker gate state** (awaiting whom);
  the statutory calendar's next due date as an inbound dependency; F&F settlements pending.
- **Must NOT contain:** the run's payslip register (PY-10); the filings workspace (AC-04/AC-05 — the
  Accountant's); employee-level detail.
- **States:** no run started · draft · computing (long-running Celery job — progress, not a spinner) ·
  variance review · **awaiting checker** · approved · disbursed · failed compute · **prior month not
  closed**.
- **Scope:** by `legal_entity_id` (`§6.9 PayrollRun`) — **not** campus; a group runs payroll per legal
  entity across campuses (`§6.1 LegalEntity` — "employer of record; statutory returns file here").

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Start the run** · pipeline primary | Payroll Operator with `payroll.run` (legal entity) | period not yet run; prior period `approved`/`disbursed` `[proposed]` (the spec does not require sequence, but out-of-order runs corrupt arrears) | legal entity; period (**default the current month**); pay groups included (**default all**) | `PayrollRun` created `status=draft`, **pinning the effective `StatutoryConfig` version** (`§4.4`, `§6.9`) | prior month open → warns; run already exists → routes to it | delete a `draft` run only | no |
| **Open the readiness checklist** · card | Payroll Operator | run exists | — | routes to PY-08 and the unresolved items | — | yes | no |
| **Resume / retry a failed compute** · pipeline | Payroll Operator | compute failed | — | re-runs with the **same idempotency key** (`§7`) so nothing double-posts | — | yes | no |
| **Switch legal entity / period** · page header | Payroll Operator | ≥1 entity in scope | entity picker; period picker (**default current**) | reloads | — | yes | no |

**Non-happy paths:** a `StatutoryConfig` version becomes effective mid-period → the run pins **one** version
(`§6.9`); the screen must show which and from when. Compute crashes halfway → resumable and idempotent, never
partially posted.

---

### PY-02 · Pay groups — rank 8 · MVP · setup
- **Q:** *"what pay logics do we operate?"*
- **Modules:** `§6.9 PayGroup` (legal_entity_id, name, `kind` `ctc_monthly/contract/honorarium`),
  `M10 §Purpose` ("run multiple pay logics … in one entity run"), blueprint §4 "★ Parallel pay groups".
- **Must contain:** pay groups per legal entity with `kind`, the salary structure(s) attached, headcount,
  and which statutory treatments apply.
- **Must NOT contain:** component definitions (PY-03); individual salaries (PY-05); honorarium rates
  (PY-04).
- **States:** none configured (blocks all payroll) · in use · unused · no structure attached (blocking).

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Create a pay group** · page primary | Payroll Operator (legal entity) | a `LegalEntity` exists | name; `kind` (**no default** — it decides whether the engine runs CTC or honorarium logic) | available to contracts (HR-05) and offers (HR-20) | no legal entity → routes to GA-03 | yes while unused | no |
| **Attach a salary structure** · row | Payroll Operator | group `kind=ctc_monthly/contract` | structure picker; effective from | the group becomes usable | `kind=honorarium` → the control is **hidden**; PY-04 applies instead | yes | no |
| **Deactivate** · row menu | Payroll Operator | no active employees | confirm | hidden from assignment | in use → disabled with the count | yes | no |

---

### PY-03 · Salary structure editor — rank 9 · MVP · setup
- **Q:** *"what is this salary made of?"*
- **Modules:** `§6.9 SalaryStructure/PayComponent` (code, `calc_type` `flat/percent/formula`, value,
  taxable, pf_applicable, esi_applicable), `M10 §Business rules` (**"validate excluded allowances ≤ 50% of
  wages (Labour Code)"**), `M10 §Acceptance` ("excluded allowances > 50% is rejected at structure save").
- **Must contain:** components with code (`BASIC · DA · HRA · SPL · …`), calc type, value/formula,
  taxable/PF/ESI applicability; a **live 50%-rule verdict** at a sample CTC; the effective-from date;
  a preview of the resulting gross/net for a sample.
- **Must NOT contain:** individual assignments (PY-05); statutory rates (they come from `StatutoryConfig`,
  `§4.4` — a structure never carries a PF rate); honorarium rules (PY-04).
- **States:** draft · **50%-rule violation (blocking)** · valid · in use (edits supersede) · superseded ·
  formula error.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Add a component** · structure card | Payroll Operator (legal entity) | structure draft or new version | code; `calc_type` (`flat · percent · formula`); value (`Decimal`); percent-of basis; **taxable**, **pf_applicable**, **esi_applicable** flags (**no defaults** — each has statutory consequences) | recomputes the sample and the 50% verdict | formula referencing an undefined component → named error | yes while draft | no |
| **Save the structure** · page primary | Payroll Operator | components valid | effective from (**default the 1st of next month**) | new `SalaryStructure` version; **supersedes** (`§4.3`); audited | **excluded allowances > 50% of wages → save is REFUSED** (`M10 §Acceptance`), with the exact overage and which components caused it | supersede | **`[proposed]` yes** — a structure change moves everyone's pay (§11) |
| **Simulate** · page header | Payroll Operator | components defined | sample CTC; sample paid-days | full breakdown incl. PF/ESI/PT/TDS **from the pinned config** and employer cost | — | n/a | no |
| **Clone a structure** · page header | Payroll Operator | ≥1 exists | — | new draft | — | yes | no |
| **Retire a structure** · page menu | Payroll Operator | no employee assigned on/after the date | effective date | no new assignments | assigned employees → **shown disabled** with the count and a route to PY-05 | yes | no |

**Non-happy paths:** a formula creates a circular reference → blocked at save with the cycle named. Changing
a component's `pf_applicable` mid-year changes the PF base → must warn about ECR consequences (`M11`).

---

### PY-04 · Honorarium rules — rank 10 · MVP · setup
- **Q:** *"how do we pay guest and per-lecture faculty?"*
- **Modules:** `§6.9 HonorariumRule` (pay_group_id, `unit` `lecture/period/day`, rate, monthly_cap),
  `M10 §Business rules` ("per-lecture honorarium with monthly cap"), `M10 §Acceptance` (a CTC teacher and a
  per-lecture guest paid correctly **in one pass**), blueprint §4 MVP.
- **Must contain:** rules per honorarium pay group — `unit`, rate (`Decimal`), **monthly cap**; who is on
  each rule; where the unit counts come from each month.
- **Must NOT contain:** CTC components (PY-03); the unit entry itself (see the gap below); statutory rates.
- **States:** none configured · active · cap set/unset · **no source for unit counts** (blocking, see below).

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Create a rule** · page primary | Payroll Operator (legal entity) | an honorarium pay group exists | `unit` (`lecture · period · day`, **no default**); rate (`Decimal`); monthly cap (`Decimal`, **required** — `M10 §Business rules` makes the cap part of the model) | applied to that pay group's staff at compute | cap missing → blocked | yes while unused | no |
| **Edit a rate** · row | Payroll Operator | — | effective from; reason | supersedes (`§4.3`); future runs use it; **past runs are untouched** | retro change → routes to arrears (PY-17) | supersede | **`[proposed]` yes** (§11) |
| **Enter monthly units** · page primary · **`[proposed]`** | Payroll Operator / HR | run period open | per employee: units taught; source: attendance-derived or manually entered with an approver | feeds compute; capped at `monthly_cap` | units above a plausibility threshold → warned | editable until the run computes | **`[proposed]` yes** — units are the entire basis of the payment (§11) |

**Gap (significant):** `§6.9 HonorariumRule` defines rate × unit × cap, and `M10 §Workflow` computes
"rate×units", but **nothing in the spec says where `units` come from**. Period-level attendance is
**P2-deferred** (D2), so the MVP has no automatic source. A manual, approved unit-entry surface is therefore
**required for MVP** — see §11.

---

### PY-05 · Employee salary & revisions — rank 4 · MVP · destination + detail
- **Q:** *"what does this person earn, from when?"*
- **Modules:** `§6.9 EmployeeSalary` (employee_id, structure_id, ctc, **effective_from**; "revisions add
  rows"), `M10 §Business rules` (effective-dated salary), `§4.3`.
- **Must contain:** staff × current CTC, structure, pay group, effective from; the revision history as an
  effective-dated ledger; unassigned staff (**they will not be paid** — lead with this); the component
  breakdown for the current assignment.
- **Must NOT contain:** the structure editor (PY-03); payslips (PY-10); appraisal recommendations (PY-06 —
  they are *proposals*, not assignments).
- **States:** assigned · **unassigned (blocking for the run)** · revision scheduled (future-dated) ·
  superseded · mid-period revision (proration) · arrears-generating back-dated revision.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Assign a salary** · row | Payroll Operator with the salary permission (legal entity) | employee has a contract with a pay group (`§6.3`) | structure (from the pay group); CTC (`Decimal`); **effective from** (**default DOJ for new joiners, else the 1st of next month**) | new `EmployeeSalary` row; the employee becomes payable; audited | pay group missing → routes to HR-05; effective date inside a **locked** month → blocked, routes to arrears | **supersede, never edit** (`§4.3`) | **`[proposed]` yes** for changes above a threshold (§11) |
| **Revise a salary** · row | Payroll Operator | an assignment exists | new CTC; effective from; reason (`pay_revision · promotion · correction · da_vda` — mirroring `§6.9 ArrearAdjustment.source`) | a new dated row supersedes; if **back-dated**, offers to generate `ArrearAdjustment`s (PY-17) | back-dating across a pinned-config boundary → the arrears path is mandatory, not optional | supersede | **yes** where arrears result — arrears posting requires a distinct checker (`M10 §Acceptance`) |
| **Apply a proposed revision** · row (from PY-06) | Payroll Operator | a finalized appraisal recommendation exists | pre-filled CTC/effective date; **editable** | same as *Revise*; **the recommendation is advisory and is never auto-applied** (`M17 §Business rules`) | — | supersede | **yes — payroll maker-checker** |
| **Bulk revise** · bulk bar | Payroll Operator | ≥2 selected | percentage or flat delta; effective from; reason | preview listing **every** name and the old→new figures and the **total monthly cost delta**, before commit | rows in a locked period excluded and named | supersede | **yes** |
| **View the component breakdown** · row | Payroll Operator | assigned | — | earnings/deductions/employer cost at the current CTC | — | n/a | no |
| **Export the salary register** · page header | Payroll Operator | — | CSV/PDF; **highly sensitive** — export audited with a reason `[proposed]` | file | — | n/a | no |

---

### PY-06 · Proposed revisions queue — rank 11 · MVP · destination
- **Q:** *"which appraisal recommendations are waiting to become real money?"*
- **Modules:** `M17 §Business rules` ("increment/promotion recommendation is **advisory** — it surfaces to
  M10 payroll as a **proposed** effective-dated salary revision; it is **never auto-applied** and still
  passes payroll maker-checker"), `M17 §Acceptance`, `§6.12 AppraisalReview.recommendation`.
- **Must contain:** finalized recommendations with employee, current CTC, proposed CTC/percentage,
  recommender, moderator, cycle, and proposed effective date; the **total cost impact**; accept/modify/
  decline.
- **Must NOT contain:** the appraisal ratings themselves (PR-05/DH-07 — the score is not payroll's
  business beyond the recommendation); auto-apply of any kind.
- **States:** empty (no cycle finalized) · pending · accepted (routed to PY-05) · modified · declined ·
  cycle reopened (proposals stale).
- **Gap:** this handoff is required by `M17 §Business rules` and **exists on no screen list anywhere** —
  see §10.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Accept a proposal** · row | Payroll Operator (legal entity) | review `finalized`; employee has a salary assignment | proposed CTC (**editable — it is a proposal**); effective date (**default the cycle's effective date**) | creates a **pending** `EmployeeSalary` revision that still requires the checker (`M10 §Permissions`); audited with the link to the appraisal | employee unassigned → routes to PY-05 | supersede | **yes — payroll maker-checker, explicitly (`M17 §Acceptance`)** |
| **Modify** · row | Payroll Operator | as above | new figure; **reason required** | as above, with the deviation from the recommendation recorded | — | supersede | yes |
| **Decline** · row | Payroll Operator | as above | reason **required** | recommendation closed; HR/Principal notified | — | no | no |
| **Accept selected** · bulk bar | Payroll Operator | ≥2 | preview with **every name, old→new, and the aggregate annual cost** | as per row | — | supersede | yes |
| **Open the appraisal context** · row menu | Payroll Operator | permission to view the review summary | — | read-only summary — **not** the full ratings | insufficient permission → hidden | n/a | no |

---

### PY-07 · Payroll run console — rank 2 · MVP · destination · **PRE-V3 PROTOTYPE EXISTS**
- **Q:** *"is this month's payroll correct enough to approve?"*
- **Modules:** `M10 §Workflow`, `§6.9 PayrollRun`, `M10 §API` (`/compute`, `/variance`, `/approve`,
  `/bank-file`), `M10 §Business rules`.
- **Must contain:** the run's identity (legal entity, period, **pinned `StatutoryConfig` version**);
  headline totals (gross, deductions, employer contributions, net) that **sum** (principle 4); counts by pay
  group; inclusions (loans, reimbursement batch, arrears, bonus); the blocking-issues list; the stage
  actions (compute → variance → approve).
- **Must NOT contain:** the checker's approval control **for the maker** (the maker must not be able to
  approve their own run — the control is **hidden** for the maker, `DESIGN.md` principle 10); statutory
  filings (AC-05); payslip distribution (PY-12).
- **States:** draft · computing (progress + ETA, `§9` — "~2,000 staff in minutes") · computed · variance
  review · **awaiting checker** (shows whom) · approved · disbursed · failed · **recompute required**
  (an input changed after compute).

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Compute** · pipeline primary | Payroll Operator with `payroll.run` | run `draft`; readiness checks pass or are explicitly overridden with a reason | included pay groups (**default all**); include arrears/reimbursement batch/bonus (**default: whatever is attached**) | Celery job: paid-days from M9 → per-pay-group logic (CTC structure **or** `HonorariumRule` rate×units, capped) → statutory from the **pinned** config → payslips + lines drafted (`M10 §Workflow`); **idempotency key** (`§7`) | missing salary assignments / unreconciled paid-days → **blocked with the exact list**, never a silent zero; compute failure → resumable | recompute while `draft`/`variance_review` | no (compute is not a release) |
| **Recompute** · pipeline | Payroll Operator | run not approved | confirm; shows **what changed since the last compute** | replaces the draft payslips; prior draft discarded (audited) | after approval → **hidden**; corrections then go through arrears | yes | no |
| **Open the variance review** · pipeline | Payroll Operator | computed | — | routes to PY-09 — **the spec makes variance review a required stage before approval** (`M10 §Business rules`) | not computed → disabled | yes | n/a |
| **Send for approval** · pipeline primary | Payroll Operator (maker) | variance reviewed; no unexplained variances above the threshold | confirm listing net total, headcount and the **checker who will receive it** | `status` moves to awaiting-checker; checker notified; **the maker can no longer edit** | unexplained variances → blocked with the list | recall while pending `[proposed]` | **yes — this opens the maker-checker gate** |
| **Approve the run** | **HIDDEN for the maker** — it appears only on AC-02 for a **distinct** user holding `payroll.approve` | — | — | — | — | — | `M10 §Permissions`; `§8 Maker–checker`; principle 10 |
| **Cancel / discard the run** · page menu | Payroll Operator | `draft` only | confirm; reason | run deleted, audited | computed/approved → **shown disabled** | no | no |
| **View the pinned config** · header chip | Payroll Operator | run exists | — | the `StatutoryConfig` version and effective date driving every statutory figure (`§4.4`) — provenance for money (principle 6) | — | n/a | no |

**Non-happy paths:** an employee's attendance is corrected after compute → the run must flag "inputs changed
— recompute" rather than silently drifting from the register. A joiner added after compute → same. Approval
attempted by the maker → refused server-side, not merely hidden client-side (`§8`).

---

### PY-08 · Paid-days reconciliation — rank 3 · MVP · destination
- **Q:** *"are the paid days right before we compute pay?"*
- **Modules:** `M9 §Business rules` (**"paid-days = present + paid-leave + holidays + weekly-offs − LOP"**),
  `M9 §Acceptance` ("paid-days compute correctly for a mid-month joiner"), `M10 §Business rules`
  (paid-days proration).
- **Must contain:** staff × period with present / paid-leave / holidays / weekly-offs / **LOP** / total
  paid-days, and the arithmetic **shown, not asserted**; mid-month joiners and leavers flagged; unresolved
  exceptions blocking the run; comparison with the prior month.
- **Must NOT contain:** attendance correction itself (HR-30 — this screen *routes* there); money (that is
  PY-09/PY-10); leave approval (DH-02).
- **States:** not reconciled · exceptions outstanding (**blocking**) · reconciled · locked (post-approval) ·
  recompute needed · device-outage window present.
- **Gap:** required by `M10 §Workflow`'s first step and listed on **no** prior screen inventory — see §10.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Run reconciliation** · page primary | Payroll Operator / HR (legal entity/campus) | period open | period (**default the run's period**) | recomputes paid-days from attendance + leave + calendar; idempotent | exceptions present → reported, not silently absorbed | re-runnable | no |
| **Open an exception** · row | Payroll Operator | exception exists | — | routes to HR-30 for the correction (HR owns `attendance.manage`) | — | yes | yes — HR/manager |
| **Accept with LOP** · row menu | Payroll Operator | exception is genuinely absence | confirm; reason | the day stands as LOP and flows into proration; audited | — | reversible until the run is approved | **`[proposed]` yes** — accepting LOP reduces pay (§11) |
| **Freeze paid-days for the run** · page primary | Payroll Operator | zero blocking exceptions | confirm | paid-days snapshot bound to the run; later attendance edits require arrears | exceptions open → **shown disabled** with the count | unfreeze while the run is `draft` | no |
| **Export** · page header | Payroll Operator | — | CSV — the reconciliation evidence | audited | — | n/a | no |

---

### PY-09 · Variance review — rank 5 · MVP · task
- **Q:** *"what changed since last month, and can every change be explained?"*
- **Modules:** `M10 §Business rules` (**"variance review before approval"**), `M10 §Workflow`
  (`Eng->>HR: Variance report (vs last month)`), `M10 §API` (`/variance`).
- **Must contain:** employee-level deltas vs the prior run (gross, net, deductions) with the **reason
  classified** (joiner · leaver · LOP · salary revision · arrears · loan started/ended · reimbursement ·
  statutory change); threshold-based flagging; totals reconciliation; an explain/acknowledge control per
  flagged row; the count of unexplained variances (which blocks approval).
- **Must NOT contain:** the approval control (AC-02); editing salaries (PY-05); payslip PDFs (PY-10).
- **States:** not computed · computing · **variances outstanding** · all explained · no prior month
  (first run — must degrade gracefully, not show every employee as a 100% variance) · threshold unset.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Set the variance threshold** · page header | Payroll Operator (legal entity) | — | % and/or absolute ₹; **default ±10% or ₹5,000** `[proposed]` (the spec mandates the review, not the threshold) | re-flags rows | — | yes | no |
| **Explain a variance** · row | Payroll Operator | row flagged | reason from a classified picker + note | row marked explained; **recorded on the run for the checker to read** | — | editable until approval | the checker reads these — that **is** the point of the stage |
| **Bulk-explain by cause** · bulk bar | Payroll Operator | rows share a system-detected cause (e.g. all joiners) | confirm with the count | as per row | mixed causes → blocked | yes | as above |
| **Drill into an employee** · row | Payroll Operator | — | — | side-by-side prior vs current payslip lines | — | yes | no |
| **Export the variance report** · page header | Payroll Operator | computed | CSV/PDF — **the artefact the checker reviews** | audited | — | n/a | no |
| **Mark the review complete** · page primary | Payroll Operator | zero unexplained flagged rows | confirm | the run may be sent for approval (PY-07) | unexplained rows remain → **shown disabled** with the count | yes while not approved | no |

**Non-happy paths:** the very first run has no comparator → compare against the **offer/assignment expected
value** instead of showing every row as a variance `[proposed]`, or state plainly that no comparison exists.

---

### PY-10 · Payslip register (run detail) — rank 6 · MVP · detail
- **Q:** *"what exactly did this run produce, person by person?"*
- **Modules:** `§6.9 Payslip/PayslipLine`, `M15 §Acceptance` ("a payroll register reconciles to the sum of
  payslips").
- **Must contain:** the register **inside a card with totals** (`DESIGN.md §Signature components`) — staff ×
  paid-days, gross, deductions, employer contributions, net; **column totals that reconcile to the run
  headline**; `is_locked` state; per-payslip drill-in; the pinned config reference.
- **Must NOT contain:** editing (payslips are locked post-approval — `§6.9 Payslip.is_locked`); the bank
  file (PY-11); statutory returns (AC-09).
- **States:** draft (pre-approval) · locked · overflow (thousands of rows — virtualised, paginated) ·
  filtered · reconciliation mismatch (**must scream**).

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Open a payslip** · row | Payroll Operator / Accountant (legal entity) | — | — | full line itemisation with provenance per line | — | yes | no |
| **Filter / group** · card header | Payroll Operator | — | pay group, department, campus, exceptions; **totals always remain visible for the whole run** (principle 4) | — | — | yes | no |
| **Export the register** · page header | Payroll Operator / Accountant | — | CSV/PDF; **this is the golden-file comparison artefact** (`§11 Testing` — golden-file payroll regression) | audited | — | n/a | no |
| **Verify reconciliation** · card footer | Payroll Operator | run computed | — | asserts register total = Σ payslips = run headline (`M15 §Acceptance`); a mismatch is a **blocking error**, displayed as one | mismatch → approval blocked | n/a | no |
| ~~Edit a payslip~~ | **hidden for everyone** | — | — | — | — | — | governance: corrections are recompute (pre-approval) or arrears (post-approval) |

---

### PY-11 · Disbursement & bank file — rank 7 · MVP · task
- **Q:** *"how does the money actually leave the bank?"*
- **Modules:** `M10 §Business rules` (NEFT bank file), `M10 §API` (`/bank-file`), `M10 §Workflow`
  (bank file after approval), `§6.9 PayrollRun.status=disbursed`.
- **Must contain:** the approved run's net total (Indian grouping, exact); bank-wise/batch-wise split
  (blueprint §4 MVP); the generated file with its format and checksum; excluded employees (missing/invalid
  bank details) **listed before generation**; the mark-as-disbursed step with the UTR/reference.
- **Must NOT contain:** generation before the checker has approved (**hard gate**); payslip publication
  (PY-12 — a school may pay before publishing, or vice versa); statutory challans (AC-05).
- **States:** blocked (run not approved) · ready · **employees excluded for missing bank details** ·
  generated · downloaded · disbursed (with reference) · regenerated (supersedes, audited).

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Generate the bank file** · page primary | Payroll Operator with `payroll.run` | run **`approved`** (checker done) — otherwise **shown disabled** with "awaiting <checker>" | bank format (**per the tenant's bank**); batch split by bank (**default on**); value date (**default the pay date**) | file generated; **idempotency key** (`§7`) so a retry never creates a second payment instruction; audited; download link | employees with missing/invalid bank details → listed and **excluded**, never silently zero-paid | regeneration **supersedes** and must be visibly numbered (v1, v2) to prevent a double upload | the approval **is** the gate; regeneration should notify the checker `[proposed]` |
| **Download the file** · page | Payroll Operator | generated | — | download **audited** (`§8`) — this file moves money | — | n/a | no |
| **Mark as disbursed** · page primary | Payroll Operator | file downloaded | disbursement date; bank reference/UTR **required** | `PayrollRun.status=disbursed`; payslip release becomes available (PY-12); webhook `payroll_run.approved` already fired at approval (`M16 §Business rules`) | reference missing → blocked | **no** — a reversal is a bank-side matter, recorded as a note | no |
| **Resolve an excluded employee** · exclusion row | Payroll Operator | employee lacks valid bank details | routes to HR-04 (bank fields) | after correction, a **supplementary file** for the excluded set `[proposed]` — the spec has no off-cycle run in MVP (off-cycle is **P2**) | — | n/a | yes — bank-detail changes should be checked (§11) |

**Non-happy paths:** the file is uploaded to the bank twice → the product cannot prevent it, so versioning
and an explicit "v2 supersedes v1 — do not upload both" warning is mandatory. Partial bank rejection →
there is **no return-file ingestion in MVP** (**flag**, §11).

---

### PY-12 · Payslip publication — rank 12 · MVP · task
- **Q:** *"have staff been given their payslips?"*
- **Modules:** `M10 §Business rules` (password-protected payslips), `M14 §Business rules` (payslip-release
  events), `§6.9 Payslip.is_locked`.
- **Must contain:** publication state per run; the release action; the notification channels used; the
  password scheme statement; the count delivered/failed; the per-employee delivery state.
- **Must NOT contain:** the payslip contents (PY-10); the bank file (PY-11).
- **States:** not released · releasing (batch job) · released · partially failed (delivery) · re-released
  after a correction.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Release payslips** · page primary | Payroll Operator | run `approved` (or `disbursed`, per the school's policy) | channels (in-app **default**, email, SMS notice); release date/time (**default now**) | payslips visible in EMP-07; PDFs password-protected (`M10 §Business rules`); notifications sent (`M14`); audited | run not approved → **shown disabled** | **no** — a released payslip cannot be unseen; a correction is a reissue | no (approval already gated it) |
| **Reissue after a correction** · page menu | Payroll Operator | a corrected/arrears payslip exists | reason **required** | the new version is published **alongside** the original (both retained, `§4.3`); staff notified of the change | — | no | **yes — the correction itself came through arrears maker-checker** |
| **Retry failed deliveries** · results | Payroll Operator | failures exist | — | re-sends only the failures | — | n/a | no |

---

### PY-13 · Loans & advances register — rank 13 · MVP · destination
- **Q:** *"who owes what, and what will be deducted this month?"*
- **Modules:** `M10 §Loans`, `§6.9 Loan/LoanInstallment`, `M10 §API` (`…/loans`, `/approve`, `/foreclose`).
- **Must contain:** loans/advances with employee, `kind`, principal, interest rate, `is_perquisite`, EMI,
  tenure, `status` (`pending_approval · active · closed · foreclosed`), outstanding balance, and **this
  month's scheduled deduction**; totals that reconcile; exiting employees with outstanding balances.
- **Must NOT contain:** the payslip (PY-10); F&F (PY-19 — but the link to it is required); employee-side
  application content beyond what is needed to decide.
- **States:** empty · pending approval (**awaiting checker**) · active · closing this month · foreclosed ·
  in default/skipped installments · outstanding at exit.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Create a loan / advance** · page primary | Payroll Operator / HR (legal entity) | employee active; policy limits known `[proposed]` | `kind` (`loan · advance`); principal (`Decimal`); interest rate (`Decimal`); **`is_perquisite`** flag; tenure months; EMI (**derived, editable**); start period (**default next run**) | `status=pending_approval`; **EMI schedule (`LoanInstallment` rows) generated**; audited | principal ≤ 0 or tenure = 0 → blocked; start period in a locked month → blocked | edit while `pending_approval` | **yes — `payroll.approve` maker-checker (`M10 §Loans`)** |
| **Approve a loan** | **hidden for the maker** — appears on AC-02 for a distinct `payroll.approve` holder | — | — | on approval: `status=active`; the EMI auto-deducts each run as a `PayslipLine` (`M10 §Loans`) | — | — | this **is** the gate |
| **Foreclose** · row menu | Payroll Operator | loan `active` | foreclosure date; settlement amount (**derived from the outstanding balance**); waiver amount if any | remaining installments cancelled; **waiver is audited** (`M10 §Loans` — "foreclosure/waiver is audited") | settlement < outstanding without a waiver reason → blocked | no | **yes — waivers move money** |
| **Skip / waive an installment** · installment row | Payroll Operator | installment `scheduled` | reason **required**; skip (defer) vs waive (forgive) — **materially different, must be separate controls** | schedule extends (skip) or the balance reduces (waive); audited | — | no | **yes for waive** |
| **View the schedule** · row | Payroll Operator | — | — | installments with principal/interest split and the payslip line where deducted | — | n/a | no |
| **Export** · page header | Payroll Operator | — | CSV — the loans/deductions register (a Labour-Code register, **P2** in full) | audited | — | n/a | no |

---

### PY-14 · Reimbursement payout batches — rank 14 · MVP · task
- **Q:** *"which approved claims are we paying this month, and who signs it off?"*
- **Modules:** `M10 §Reimbursements` (**"approved claims are paid out in a payout batch attached to a
  PayrollRun. The payout batch is a financial finalization → maker-checker (`payroll.approve`) required"**),
  `M10 §API` (`…/reimbursement-payout-batches`, `/approve`), `M10 §Acceptance`.
- **Must contain:** approved-but-unpaid claims eligible for the period; selection into a batch; the batch
  total (exact, grouped); per-claim tax treatment and the resulting taxable/exempt split; the attached
  `PayrollRun`; the **checker gate**.
- **Must NOT contain:** claim approval (DH-09 — approval and payment are separate by design); the payroll
  run's own approval (PY-07/AC-02).
- **States:** no eligible claims · draft batch · **awaiting checker** · approved · paid (attached to a
  disbursed run) · claim removed after batching.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Create a batch** · page primary | Payroll Operator (maker) | ≥1 claim `approved` and unpaid | period (**default the open run**); selection (**default all eligible**) | draft batch with a running total; claims marked as batched | claims already in another batch → excluded and named | edit while draft | **yes** |
| **Add / remove a claim** · row | Payroll Operator | batch draft | — | total recomputes | claim withdrawn/rejected meanwhile → removed with a notice | yes | — |
| **Send for approval** · page primary | Payroll Operator (maker) | ≥1 claim; total > 0 | confirm listing the **count, the total in ₹, and the named checker** | gate opened; checker notified; **the maker cannot approve** (`M10 §Acceptance` — "the maker cannot self-approve") | — | recall while pending `[proposed]` | **yes — the defining gate of this screen** |
| **Approve the batch** | **hidden for the maker** — on AC-02 for a distinct `payroll.approve` holder | — | — | claims → `paid` when the attached run disburses; `payroll_run_id` set on each claim (`§6.9`) | — | — | this is the check |
| **Export the batch** · page header | Payroll Operator / Accountant | — | CSV | audited | — | n/a | no |

---

### PY-15 · Arrears workbench — rank 15 · MVP · task
- **Q:** *"what does this back-dated revision owe, month by month?"*
- **Modules:** `M10 §Arrears` (**month-split; each affected month recomputes PF/ESI/TDS on that month's
  **originally pinned** `StatutoryConfig` version — never the current one, never hardcoded; append-only;
  maker-checker before posting**), `§6.9 ArrearAdjustment`, `M10 §API` (`/compute`, `/approve`),
  `M10 §Acceptance`.
- **Must contain:** the source (`pay_revision · da_vda · promotion · correction`); affected employees;
  **the month-by-month split** with, for each month, the old vs new figure, the delta, and **the
  `StatutoryConfig` version that month was originally pinned to** (shown, not implied); the recomputed
  PF/ESI/TDS deltas per month; the grand total; the posting run; the checker gate.
- **Must NOT contain:** editing a past payslip (append-only — `M10 §Arrears`); the current config being used
  for a past month (the single most important correctness rule on this screen); silent rounding.
- **States:** draft · computed · **awaiting checker** · approved · posted (attached to a run) · superseded
  by a correction · month outside available config history (**blocking**).

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Create an arrears computation** · page primary | Payroll Operator (maker) | a back-dated `EmployeeSalary` revision exists, or a manual basis is given | `source` (**no default**); affected period range; employee selection | draft | period predating the employee's DOJ or the available config history → **blocked with the reason** | yes while draft | **yes** |
| **Compute** · page primary | Payroll Operator | draft with a range and population | — | generates `ArrearAdjustment` rows **split by affected month**, each recomputing PF/ESI/TDS **on that month's originally pinned `StatutoryConfig`** (`M10 §Arrears`); every amount `Decimal` | a month whose original run cannot be resolved → that month is **listed and excluded**, never silently computed on the current config | recompute while draft | — |
| **Review the month split** · results table | Payroll Operator | computed | per month: old, new, delta, **config version**, PF/ESI/TDS deltas; totals that sum | — | — | n/a | n/a |
| **Send for approval** · page primary | Payroll Operator (maker) | computed; no excluded months unresolved | confirm listing the total and the checker | gate opened; checker notified | — | recall while pending `[proposed]` | **yes — "posting requires a distinct checker" (`M10 §Acceptance`)** |
| **Post to a run** · after approval | Payroll Operator | approved | target `PayrollRun` (**default the open run**) | arrears land as payslip lines in the target run; `status=posted`; audited | target run already approved → blocked | **no** — a correction **supersedes**, never edits (`M10 §Arrears` append-only) | already checked |
| **Supersede with a correction** · row menu | Payroll Operator | posted | reason | a new adjustment supersedes; the original stands | — | n/a | yes |
| **Export** · page header | Payroll Operator / Accountant | computed | CSV — the arrears statement | audited | — | n/a | no |

---

### PY-16 · Exits & settlements register — rank 16 · MVP · destination
- **Q:** *"who is leaving, and where has each settlement got to?"*
- **Modules:** `M12 §Purpose`, `§6.11 FinalSettlement`, `M12 §API`.
- **Must contain:** exiting staff with last working day, notice status, F&F state, net payable, and
  blockers (unreturned assets are **P2**; **outstanding loans** and pending claims are MVP); the days
  since exit (a compliance clock).
- **Must NOT contain:** the settlement computation detail (PY-17); HR's clearance checklist (**P2**);
  the employee's ongoing payroll.
- **States:** exit initiated · F&F not started · computed · **awaiting checker** · approved · paid ·
  **overdue** (statutory settlement timelines) · access still active after the last working day (a
  compliance flag).

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Start a settlement** · row | Payroll Operator (legal entity) | employee has a last working day | — | routes to PY-17; `FinalSettlement` draft created | LWD in the future → allowed (pre-computation), clearly marked provisional | discard while draft | **yes — F&F approval** |
| **Filter** · card header | Payroll Operator | — | state (**default open**), campus, LWD range | — | — | yes | no |
| **Export** · page header | Payroll Operator | — | CSV | audited | — | n/a | no |
| **Flag an access-revocation gap** · row | Payroll Operator / HR | LWD passed and `User.is_active=true` | — | routes to HR-03 to deactivate (`M12 §Business rules` — access revoked on completion) | — | n/a | no |

---

### PY-17 · Full & final settlement — rank 17 · MVP · task
- **Q:** *"what do we owe this leaver, or they us?"*
- **Modules:** `M12 §Business rules` (**pending salary, leave encashment §10(10AA), gratuity (≥5 yrs from
  `ServiceRecord` continuous service), notice recovery, loan recovery, TDS true-up; final payslip; access
  revoked**), `§6.11 FinalSettlement`, `M12 §API` (`/compute`, `/approve`), `M12 §Acceptance`.
- **Must contain:** each component as a **named, sourced line** — pending salary (paid-days basis), leave
  encashment (which balances, at what rate, §10(10AA) exemption), **gratuity** (the continuous-service
  computation and the formula from the **pinned config**, `§4.4`), notice recovery, **loan recovery**
  (from PY-13), reimbursement payables `[proposed]`, TDS true-up; the net payable (exact, grouped); the
  checker gate; the final payslip.
- **Must NOT contain:** hardcoded gratuity or exemption figures (`guard-statutory-hardcode` — the formula
  and caps come from `StatutoryConfig`); the exit checklist (**P2**); editing of past payslips.
- **States:** draft · computed · **awaiting checker** (only when the tenant requires one) · approved · paid ·
  recovery exceeds payable (**negative net** — a real and important state) · gratuity not eligible
  (<5 years, must be explained) · service record incomplete (**blocking**).
- **Maker-checker mode (amendment C, 2026-08-11):** F&F is the **one configurable exception** to the
  distinct-checker rule (`M12 §Business rules`). The screen must **show which mode is in force** —
  *"this settlement requires a second approver"* vs *"your school allows single-person completion; this will
  be recorded as completed by you alone"*. Single-person completion is never silent, and this exception
  never extends to run approval, bank files, filings, batches, arrears or bonus (`§8`).

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Compute the settlement** · page primary | Payroll Operator with `payroll.run` + `people.manage` (`M12 §Permissions`) | LWD set; final month's attendance reconciled | — | computes every component from source (`M12 §Business rules`); **gratuity from continuous service in `ServiceRecord`** and the config's formula; loan outstanding pulled from `§6.9 Loan` | broken/incomplete service history → **blocked**, naming the gap (gratuity would otherwise be wrong) | recompute while draft | — |
| **Override a line** · line row | Payroll Operator | draft | new amount; **reason required** | the override is recorded **alongside** the computed value, never replacing it invisibly | statutory lines (PF/gratuity formula) → override **blocked**; only discretionary lines (ex-gratia, notice waiver) are overridable | recompute | **yes — overrides are exactly what the checker exists for** |
| **Waive the notice recovery** · line | Payroll Operator | notice shortfall exists | reason **required** | recovery reduced; audited | — | recompute | **yes** |
| **Send for approval** · page primary | Payroll Operator (maker) | computed; no blocking gaps; **tenant requires an F&F checker** — otherwise this control is replaced by *Complete settlement* below | confirm listing the net payable and the checker | gate opened; checker notified | — | recall while pending `[proposed]` | **yes — `M12 §API` `/approve`** |
| **Approve** | **hidden for the maker** — on AC-02 for a distinct approver, **when the tenant requires an F&F checker** | — | — | on approval: final payslip generated; payment scheduled; **`User.is_active` flips to false** (`M12 §Acceptance`); document/statutory retention continues (`§8`) | — | — | this is the check |
| **Complete settlement (single-person)** · page primary | Payroll Operator with `payroll.run` + `people.manage` | computed; **tenant has the F&F checker requirement disabled** (amendment C, `M12 §Business rules`) | confirm dialog stating plainly: **"your school allows single-person completion — this settlement will be recorded as completed by you alone"** | same downstream as *Approve*; audited **as a single-person completion**, not as an approval | tenant requires a checker → this control is **hidden** and *Send for approval* appears instead | **no** | **no — by tenant configuration.** This exception exists only for F&F and never for run approval, bank files, filings, batches, arrears or bonus (`§8`) |
| **Generate the final payslip** · after approval | Payroll Operator | approved | password-protected PDF | available to the (now inactive) employee — see the access-vs-retention conflict in §11 | — | n/a | no |
| **Export the settlement statement** · page header | Payroll Operator / Accountant | computed | PDF — the artefact the leaver signs | audited | — | n/a | no |

---

### PY-18 · Payroll reports & registers — rank 18 · MVP · destination
- **Q:** *"what payroll register do I need to produce?"*
- **Modules:** `M15 §Purpose` (payroll reports, audit-ready), `M15 §Acceptance` (the register reconciles to
  the sum of payslips), `M10`.
- **Must contain:** the payroll register per run; the salary register; the deductions register; the loans
  register; the reimbursement register; the arrears statement; **month-on-month cost**; per pay group and
  per campus splits; and a **reconciliation line on every register**.
- **Must NOT contain:** statutory filings and challans (AC-04/AC-05 — the Accountant owns filing);
  custom report building (**P2**); accounting JV export (**P2**).
- **States:** as PR-06, plus **locked-period** reports (final) vs **provisional** (pre-approval, and
  labelled as such — a provisional payroll number shown as final is the fastest way to lose trust).

**Actions** — the same report-runner component as PR-06/HR-37 (run · download · schedule `[proposed]` ·
save a view `[proposed]`), with payroll's report set and `legal_entity` scoping. Deliberately not repeated.

---

# 8 · Accountant

The **checker** in maker-checker (by our design assumption — see §11: the spec makes checker a *capability
flag*, not a role), plus statutory filing ownership. This role's defining screen is a gate, not a form.

### AC-01 · Compliance calendar (home) — rank 1 · MVP · destination
- **Q:** *"what is due, and what is waiting for my sign-off?"*
- **Modules:** `M14 §Business rules` ("scheduled scans for … **statutory due dates**"), `M11 §Business
  rules` (filings), `§8 Maker–checker`, `M15`.
- **Must contain:** **items awaiting my approval** (payroll runs, arrears, bonus runs, reimbursement
  batches, F&F) as the first block; the statutory due-date calendar (PF/ECR, ESI, PT per state, TDS
  challan, quarterly 24Q, annual Form 16) with days remaining and filed/unfiled state; the current
  liability position; overdue items led.
- **Must NOT contain:** payroll computation (PY-07); HR content; the expiry watchlist for documents/
  contracts (HR-11 — a different calendar with a different owner; this is the anti-duplication rule).
- **States:** all clear · **items awaiting me** · due this week · **overdue** (lead) · filing in progress ·
  portal/vendor unavailable · new statutory config version pending adoption.
- **Scope:** by legal entity; a group Accountant sees entities segmented, since filings are per
  `LegalEntity` (`§6.1`).

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Open an approval** · awaiting-me row | Accountant with the checker capability (legal entity) | I am **not** the maker | — | routes to AC-02 | I am the maker → the row is **shown as blocked with "you created this — another approver is required"**, which teaches the rule (principle 10) | yes | this **is** the second pair of eyes |
| **Open a filing** · calendar row | Accountant | filing period closed | — | routes to AC-05 | period still open → disabled with the reason | yes | no |
| **Mark a due date acknowledged** · row menu | Accountant | — | — | reduces noise; **overdue items cannot be dismissed** | — | yes | no |
| **Switch legal entity / period** · page header | Accountant | ≥1 entity | entity; FY/period (**default current**) | reloads | — | yes | no |

---

### AC-02 · Maker-checker approval gate — rank 2 · MVP · destination + task
- **Q:** *"should I release this money or this filing?"*
- **Modules:** `§8 Maker–checker` ("Second-person approval on payroll runs and statutory filings"),
  `M10 §Permissions` (`payroll.approve` — runs, loans, reimbursement batches, arrears),
  `M11 §Permissions` (`statutory.file` — bonus runs), `M12 §API` (`/approve`), `M10 §Acceptance`
  ("the maker cannot self-approve"), `DESIGN.md` principle 10.
- **Must contain:** **one queue of every financial finalization awaiting a checker** — payroll runs ·
  loan sanctions · reimbursement payout batches · arrears postings · bonus runs · **and F&F settlements
  only when the tenant requires a checker for them** (amendment C — F&F is the one configurable exception,
  `M12 §Business rules`) — each with: what it is, the **exact total in ₹**, who the maker is, when they
  submitted, the evidence (variance report, month-split, schedule), and approve/reject with reason.
- **Must NOT contain:** any item where the current user is the maker (**hidden or explicitly blocked, never
  approvable**); the ability to edit the underlying record (the checker approves or rejects, never edits —
  editing would make them the maker).
- **States:** empty · items awaiting me · **items I cannot approve (I am the maker)** · approved ·
  rejected · superseded (the maker recalled it) · expired/stale (inputs changed since submission).
- **Why one screen:** the spec spreads maker-checker across five modules; a checker experiences it as **one
  question**. Splitting it into five queues would guarantee something is missed.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Approve** · detail primary | a user with the relevant approve capability (`payroll.approve` / `statutory.file`) at the entity's scope, **who is not the maker** | item pending; **the evidence has been opened** (`[proposed]`: approve stays disabled until the variance report / month-split / schedule has been viewed — the whole point of the gate is that someone looked) | confirm dialog restating **type, period, total ₹, headcount, and maker** | payroll run → `approved`, bank file unlocked (PY-11), `payroll_run.approved` webhook fires (`M16`); loan → `active` with its EMI schedule live; batch → payable; arrears → postable; bonus → finalized; F&F → paid + `User.is_active=false`; **all audited with actor, timestamp, before/after** (`§4.2`) | maker = me → **refused server-side**, with the rule explained; inputs changed since submission → **blocked as stale**, requiring the maker to recompute | **no** — this is the release point. Reversal is a new, compensating action (arrears, recovery), never an undo | this **is** the second pair of eyes |
| **Reject / send back** · detail secondary | as above | item pending | reason **required** | returns to the maker as editable; maker notified; audited | — | the maker may resubmit | no |
| **Open the evidence** · detail tabs | as above | — | variance report (PY-09) · month-split (PY-15) · EMI schedule (PY-13) · claim list (PY-14) · settlement lines (PY-17) · bonus basis (AC-06) | read-only, in context | — | n/a | n/a |
| **Delegate** · row menu · **`[proposed]`** | as above | I am absent/conflicted | another eligible checker | reassigned; audited | delegate is the maker → blocked | yes | no |
| **Filter** · card header | as above | — | type, entity, period, amount; **default: awaiting me** | — | — | yes | no |

**Non-happy paths:** the only eligible checker is the maker (a small school with one finance person) →
the system must **refuse**, and the tenant must assign a second capability holder; the screen should say
exactly that rather than quietly allowing it. **Flag**: the spec does not describe an emergency/break-glass
path, and it should not have one — but the operational consequence must be documented (§11).

---

### AC-03 · Statutory liability & reconciliation — rank 3 · MVP · destination
- **Q:** *"what do we owe the government, and does it match what we paid?"*
- **Modules:** `M11 §Business rules` ("reconciliation + liability provisioning"), blueprint §5
  "Reconciliation reports (PF/ESI/PT/TDS payable vs paid); statutory liability provisioning **[MVP]**",
  `§6.10 StatutoryContribution`.
- **Must contain:** per period and per legal entity — PF (employee/employer/EPS/EDLI/admin), ESI
  (employee/employer), PT per state, TDS, LWF — **payable vs paid vs filed**, with variances named; the
  provision balance; drill-down to the contributing payslips.
- **Must NOT contain:** the filing artefacts themselves (AC-04/AC-05); payroll computation (PY-07);
  hardcoded rates (everything derives from the **pinned** config per run, `§4.4`).
- **States:** balanced · **variance present** (lead) · unpaid liability · paid but unfiled · filed ·
  prior-period adjustment present (arrears) · config version changed mid-period.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Reconcile a period** · page primary | Accountant (legal entity) | period computed | period (**default the last closed month**) | payable vs paid computed from `StatutoryContribution` and recorded payments; variances listed | payments not recorded → the variance is the whole liability; say so plainly | re-runnable | no |
| **Record a payment / challan** · row | Accountant | liability exists | challan number; date; amount (`Decimal`); mode | payment recorded against the liability; feeds AC-04 | amount ≠ liability → allowed but **flagged as a variance**, never silently reconciled | correctable with an audited edit | **`[proposed]` yes** — recording a payment that did not happen hides a default (§11) |
| **Drill into contributions** · row | Accountant | — | — | the payslips composing the figure (provenance, principle 6) | — | yes | no |
| **Export the reconciliation** · page header | Accountant | — | CSV/PDF — audit-ready (`M15 §Purpose`) | audited | — | n/a | no |

---

### AC-04 · Filings register — rank 4 · MVP · destination
- **Q:** *"where does each statutory filing stand?"*
- **Modules:** `§6.10 StatutoryFiling` (legal_entity_id, `kind` `ecr/esi_return/pt_challan/form_24q/
  form_16`, period, artifact_ref, status), `M11 §Business rules`, `M11 §API` (`/generate`).
- **Must contain:** filings by kind × period × legal entity with status, artefact, due date, filed date,
  acknowledgement/receipt reference; overdue led; the state-wise PT rows (each state files separately —
  `§6.1 Campus.state` drives it).
- **Must NOT contain:** generation mechanics (AC-05); the liability computation (AC-03); employee-level tax
  documents (EMP-08).
- **States:** not due · due · **overdue** · generating · generated (unfiled) · filed (with acknowledgement)
  · rejected by the portal · superseded/revised return.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Generate a filing** · row | Accountant with `statutory.manage` (legal entity) | the period's payroll is `approved`/`disbursed` | kind; period; entity | routes to AC-05 | payroll not approved → **shown disabled** with the reason (filing a draft run would be a false return) | regenerate supersedes | for **bonus runs**, `statutory.file` maker-checker applies (`M11 §Permissions`) |
| **Mark as filed** · row | Accountant | artefact generated | filing date; acknowledgement/receipt number **required**; upload the receipt | `status=filed`; audited; the compliance calendar clears | acknowledgement missing → blocked (an unacknowledged filing is not a filing) | correctable with an audited edit | no |
| **Record a portal rejection** · row menu | Accountant | filed | reason; portal message | status returns to actionable; the due-date clock resumes | — | yes | no |
| **File a revised return** · row menu | Accountant | a filed return needs correction (e.g. post-arrears) | reason; period | a **new** filing that supersedes; the original is retained (`§4.2` append-only) | — | no | no |
| **Download the artefact** · row | Accountant | generated | — | audited download | — | n/a | no |
| **Filter** · card header | Accountant | — | kind, period, entity, state (for PT), status; **default: due + overdue** | — | — | yes | no |

---

### AC-05 · Filing generation & validation — rank 5 · MVP · task
- **Q:** *"is this return correct enough to submit to the government?"*
- **Modules:** `M11 §Business rules` (**generate ECR, Form 24Q (FVU), Form 16 Part A+B, Form 12BA;
  config versioned and pinned per run**), `M11 §Acceptance` ("Form 24Q validates via FVU"), `§6.10`.
- **Must contain:** the period's source data summary; **validation results before generation** (missing
  PAN/UAN/ESIC, invalid formats, employees excluded and why); the generated artefact with its format
  version; the FVU/portal validation outcome for 24Q; the totals that must match AC-03; the
  `StatutoryConfig` version used.
- **Must NOT contain:** editing employee data inline (fix at HR-04 — but the screen must route there);
  hardcoded rates or slab tables; a "generate anyway" path that hides validation failures.
- **States:** validating · **validation errors (blocking)** · warnings only · generating · generated ·
  FVU-passed · FVU-failed (with the error list) · superseded.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Validate** · page primary | Accountant (legal entity) | period approved | — | per-employee validation against the return's rules (PAN format, UAN presence, ESIC number, wage bases) | errors listed **with the employee and the field**, each linking to HR-04 | re-runnable | no |
| **Generate** · page primary | Accountant | zero blocking validation errors | format version (**default current**); include/exclude annexures per the return | artefact created and attached to `StatutoryFiling`; the **config version is stamped on it** (`§4.4`); audited | blocking errors → **shown disabled** with the count; generation failure → retained logs, no partial artefact | regenerate supersedes (versioned) | for bonus, the maker-checker gate applies |
| **Run FVU validation** · results | Accountant | 24Q generated | — | pass/fail with the government validator's messages (`M11 §Acceptance`) | fail → the error list, each mapped to a source record where possible | re-runnable | no |
| **Download for submission** · results | Accountant | generated (and FVU-passed for 24Q) | — | audited download | — | n/a | no |
| **Exclude an employee with a reason** · validation row · **`[proposed]`** | Accountant | employee cannot be filed this period | reason **required** | excluded from this return, recorded, and **carried into the next period's exception list** | — | yes | **`[proposed]` yes** — excluding someone from a statutory return has consequences (§11) |

---

### AC-06 · Bonus run — rank 6 · MVP · task
- **Q:** *"what bonus do we owe, and who signs it off?"*
- **Modules:** `M11 §Bonus` (**"the bonus percentage (8.33–20%), calculation cap, and eligibility-wage
  ceiling are read from the pinned, effective-dated `StatutoryConfig` — never hardcoded"; notes the
  Payment of Bonus Act **§32 educational-institution exemption**; supports ex-gratia/festival bonus;
  `Decimal`; append-only; finalized only through maker-checker (`statutory.file` maker + distinct
  checker)**), `M11 §API` (`…/bonus-runs`, `/compute`, `/approve`), `M11 §Acceptance`.
- **Must contain:** the bonus type (**statutory** vs **ex-gratia/festival** — the §32 exemption makes this a
  real choice for schools); the **config version** supplying %, calc cap and eligibility ceiling, displayed
  explicitly; eligible vs ineligible staff **with the reason per person**; per-employee basis and amount;
  the total; the checker gate.
- **Must NOT contain:** a hardcoded 8.33% or ₹7,000/₹21,000 anywhere (`guard-statutory-hardcode` —
  everything from `StatutoryConfig`); self-approval; editing after finalisation (append-only).
- **States:** draft · computed · **awaiting checker** · finalized · paid via a run · superseded ·
  §32 exemption applied (statutory bonus not applicable → ex-gratia path).

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Create a bonus run** · page primary | Accountant / Payroll with `statutory.file` (maker) (legal entity) | FY closed or in-period per policy | type: **statutory** / **ex-gratia** (**no default** — §32 means the school must decide); FY; population filter | draft; **the applicable `StatutoryConfig` version is pinned and shown** | no config version covering the FY → **blocked** (never fall back to a default rate) | yes while draft | **yes** |
| **Compute** · page primary | maker | draft | percentage within the config's allowed band (8.33–20%) — **the band itself comes from the config**; the calc cap and eligibility ceiling are **read-only, from the config** | per-employee eligibility and amount (`Decimal`); `StatutoryContribution(kind=bonus)` rows drafted (`§6.10`) | employees with an incomplete wage history → listed, not silently excluded | recompute while draft | — |
| **Review eligibility** · results | maker | computed | filter: eligible / ineligible-with-reason | the reason per person (wage ceiling, service days, §32) — **eligibility must be explainable per person** | — | n/a | n/a |
| **Send for approval** · page primary | maker | computed | confirm listing the total ₹, headcount and the checker | gate opened | — | recall `[proposed]` | **yes — "cannot be finalized by its maker" (`M11 §Acceptance`)** |
| **Approve** | **hidden for the maker** — on AC-02 for a distinct `statutory.file` holder | — | — | finalized; **append-only** (`M11 §Bonus`); payable through a payroll run | — | — | this is the check |
| **Attach to a payroll run for payment** · after approval | Payroll Operator | finalized | target run | bonus lands as payslip lines | target already approved → blocked | no | already checked |
| **Export the bonus register** · page header | Accountant | computed | CSV/PDF (Bonus Form C/D is **Later** per blueprint §5) | audited | — | n/a | no |

---

### AC-07 · Investment declaration review — rank 7 · MVP · destination
- **Q:** *"do the proofs support what staff declared?"*
- **Modules:** `§6.10 InvestmentDeclaration` (declarations JSON, proofs), `M11 §Business rules` (TDS §192),
  `M11 §API` (`…/investment-declarations`), blueprint §4 "Investment declaration & proof workflow **[MVP]**".
- **Must contain:** staff × FY with regime, declared totals, proofs submitted/pending/verified, the TDS
  impact of accepting vs rejecting; per-head verification with the proof viewer; the deadline; the count
  that will fall back to the default regime.
- **Must NOT contain:** editing the employee's declaration (verify or reject — never rewrite); slab
  administration (GA-07); the payroll run.
- **States:** window open (declarations changing) · window closed (review phase) · proofs pending ·
  verified · rejected · **deadline passed** (TDS recalculates without the head) · regime locked.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Verify a proof** · head row | Accountant / Payroll (legal entity) | proof uploaded | approve; verified amount (**default the declared amount**, editable down) | head accepted at the verified amount; **TDS recomputes from the next run** on the **pinned config** (`§4.4`); audited | verified > declared → blocked | correctable before the FY closes | no |
| **Reject a proof** · head row | Accountant / Payroll | proof uploaded | reason **required** | head disallowed; employee notified with the reason and the TDS consequence; audited | — | employee may re-upload while the window is open | no |
| **Bulk verify** · bulk bar | Accountant | ≥2 selected, same head type | confirm with the count and the **aggregate TDS impact** | as per row | — | as above | no |
| **Close the review window** · page header | Accountant | — | date; confirm | unverified heads are disallowed; **TDS trues up in the remaining months** (`M11`) | — | no | no |
| **Export the declaration register** · page header | Accountant | — | CSV — the 24Q Annexure II support | audited | — | n/a | no |

---

### AC-08 · Statutory contributions register — rank 8 · MVP · destination
- **Q:** *"what statutory amounts did each person generate this period?"*
- **Modules:** `§6.10 StatutoryContribution` (payslip_id, `kind` `pf/esi/pt/tds/lwf/bonus`, employee_amt,
  employer_amt, base_amount), `M11 §Business rules` (rolls up into filings).
- **Must contain:** employee × kind × employee/employer amount × base amount for the period, with totals
  that **reconcile to AC-03 and to the filings**; the config version; state-wise PT grouping; the drill to
  the payslip.
- **Must NOT contain:** the filing artefact (AC-04); rate configuration (GA-07); editing (contributions are
  derived, never typed).
- **States:** loading · overflow (paginated) · reconciled · **mismatch with the filing** (blocking for the
  filing) · prior-period adjustment rows (arrears).

**Actions** — read, filter (kind · state · pay group · campus), drill to payslip, export (audited).
No mutating action exists on this screen **by design**: contributions are computed outputs, and any
correction happens upstream (recompute or arrears). Stated explicitly so no one adds an edit control later.

---

### AC-09 · Accounting / JV export — **P2** · task
- **Q:** *"how does payroll land in the books?"*
- **Modules:** blueprint §4 "Accounting JV/GL journal generation; Tally/SAP/Oracle export with
  pay-head→ledger→cost-centre mapping **[P2]**"; `M16 §Business rules` (accounting export — Tally).
- **Deferred:** the mapping model (pay head → ledger → cost centre) does not exist in the MVP data model.
  Listed so it is not mistaken for an MVP omission.

---

# 9 · Group Admin

Owns the tenant's structure, identity, statutory configuration, platform integrations and the audit trail.
Scope = all campuses (`M1 §Permissions` — `org.manage` at group scope, Group Admin only).

### GA-01 · Group overview — rank 1 · MVP · destination · **PRE-V3 PROTOTYPE EXISTS**
- **Q:** *"how is the whole group doing?"*
- **Modules:** `M15 §Business rules` ("campus + group dashboards (headcount, cost, statutory liability)"),
  `M1`, `M11`.
- **Must contain:** campus comparison — headcount by staff category, attendance rate, leave utilisation,
  **payroll cost** and **statutory liability** per campus/legal entity; group totals that sum (principle 4);
  exceptions needing group attention (overdue filings, unapproved runs, compliance gaps); shape before
  number (principle 3).
- **Must NOT contain:** individual employee data (drill down to a campus instead); the approval actions
  (AC-02); campus-operational detail (PR-01).
- **States:** first-run (single campus) · loading · error · partial data (a campus has not run payroll) ·
  **comparison misleading** (campuses of very different size — normalise or say so).
- **Blueprint tension:** group dashboards are tagged **[P2]** in blueprint §15 while `M15 §Business rules`
  lists them in an MVP module. Resolved in §10, C2: **the Group Admin's home is MVP** (every role needs a
  landing screen); *analytical* dashboards beyond it stay P2.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Drill into a campus** · comparison row | Group Admin (group) | — | — | PR-01 scoped to that campus | — | yes | no |
| **Change the period** · page header | Group Admin | — | month **default current**; FY; AY | reloads | — | yes | no |
| **Open an exception** · exceptions card | Group Admin | — | — | routes to the owning screen (AC-04 filings, PY-01 runs, HR-12 verification) | — | yes | no |
| **Export the group summary** · page header | Group Admin | — | PDF — the board/trustee pack `[proposed]` | audited | — | n/a | no |

---

### GA-02 · Org structure — rank 2 · MVP · setup
- **Q:** *"what is our organisation made of?"*
- **Modules:** `M1 §Purpose`, `§6.1 Organization/Campus/Department`, `M1 §API`, `M1 §Acceptance`
  ("a Group Admin can create a group with ≥2 campuses in **different states**").
- **Must contain:** the `Organization → Campus → Department` tree; campus attributes — **`state`** (the
  statutory driver for PT/LWF/min-wage), address, timezone, legal entity; department `type` (`academic ·
  admin · transport · hostel · …`); headcount per node.
- **Must NOT contain:** legal-entity statutory registrations (GA-03 — a different question: *who files*);
  people (HR-02); roles (GA-04).
- **States:** first-run (empty tenant) · single campus · multi-campus multi-state · campus with no legal
  entity (**blocking for payroll**) · department in use (deletion blocked) · archived campus.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Add a campus** · tree primary | Group Admin (group) | an `Organization` exists | name; **`state` (required — it drives PT/LWF/min-wage)**; address; timezone (**default the org's**); legal entity | campus available for staff, calendars, shifts; RLS-scoped from creation (`§3`) | no legal entity → allowed but **flagged as blocking for payroll**, with a route to GA-03 | archive, never delete (audit) | no |
| **Add a department** · campus node | Group Admin (group) | campus exists | name; `type` (**no default**) | available for staff assignment | duplicate name in the campus → blocked | archive | no |
| **Edit a campus's state** · campus detail | Group Admin | — | reason **required** | **changes the statutory profile from the effective date** — PT slabs, LWF, min-wage; must warn that historical filings are unaffected | changing state with filed returns in that state → warns explicitly | effective-dated | **`[proposed]` yes** — a state change silently re-rates statutory deductions (§11) |
| **Move a department between campuses** · node menu | Group Admin | target campus exists | effective date | staff move with it; `ServiceRecord(transferred)` per employee; approval chains re-point | staff in a locked payroll month → warns | no | no |
| **Archive a campus** · node menu | Group Admin | no active staff | confirm; reason | hidden from operations; history retained | active staff → **shown disabled** with the count | yes | no |

---

### GA-03 · Legal entities & registrations — rank 3 · MVP · setup
- **Q:** *"who is the employer of record, and under which registrations do we file?"*
- **Modules:** `§6.1 LegalEntity` (org_id, name, `registration_type` `trust/society/sec8`, **pan, tan,
  pf_estab_id, esi_code, reg_12a**), `M1 §Business rules` ("a legal entity groups campuses for payroll/
  filing"), `M11`.
- **Must contain:** entities with registration type, PAN, TAN, PF establishment ID, ESI code, 12A
  registration; the campuses grouped under each; the filings that depend on each identifier; validation of
  formats.
- **Must NOT contain:** the org tree (GA-02); statutory rates (GA-07 — identifiers vs rules are different
  things); filings (AC-04).
- **States:** none (blocks payroll) · complete · **missing an identifier required by a filing** (must be
  flagged against the filing that needs it) · registration expiring `[proposed]`.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Add a legal entity** · page primary | Group Admin (group) | — | name; `registration_type` (`trust · society · sec8`, **no default**); PAN; TAN; PF estab ID; ESI code; 12A ref | pay groups and payroll runs can be created against it (`§6.9`) | invalid PAN/TAN format → named | archive | no |
| **Edit an identifier** · row | Group Admin | — | reason **required** | **filings depend on these** — the screen must warn which filings and periods are affected | changing after a period is filed → warns that filed returns are unaffected and a revised return may be needed | audited history | **`[proposed]` yes** — these identifiers are the school's statutory identity (§11) |
| **Assign campuses** · row | Group Admin | campuses exist | multi-select | payroll for those campuses runs under this entity | a campus already assigned elsewhere → moved, with a warning about in-flight runs | yes | no |
| **View dependent filings** · row | Group Admin | — | — | which returns use which identifier — the pre-check before editing | — | n/a | no |

---

### GA-04 · Users & role assignments — rank 4 · MVP · destination
- **Q:** *"who can get in, and what can they reach?"*
- **Modules:** `§6.2 User/RoleAssignment` (user_id, role_id, `scope_level` `group/campus/department`,
  scope_id), `M2 §Business rules` (permission × scope), `M2 §API`, `M2 §Acceptance`,
  `M2 §Permissions` (`iam.manage`).
- **Must contain:** users with linked employee, status, MFA state, last sign-in, and **their role
  assignments as role × scope pairs**; the effective-permission preview; invite/deactivate; the
  maker-checker capability flag per assignment.
- **Must NOT contain:** role *definitions* (GA-05 — "who has this role" and "what does this role mean" are
  two questions); employee master data (HR-03); the employee's own security settings (SH-04).
- **States:** invited (not accepted) · active · inactive · no role assigned (**can sign in, sees nothing**
  — must be visible) · multi-scope assignment · **maker and checker held by the same person** (a warning
  state the product should surface).

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Invite a user** · page primary | Group Admin / campus admin with `iam.manage` | an employee record exists (or an admin-only user is intended) | link to employee (**default: yes**); email/phone; initial role + scope | `User` created; invite sent; audited | duplicate email/phone → blocked | revoke the invite | no |
| **Assign a role** · user detail | `iam.manage` holder (group/campus) | user active | role; **`scope_level` + scope** (**no defaults** — the pair *is* the permission, `M2 §Business rules`); effective date `[proposed]` | permissions apply on the next token refresh; audited | assigning a scope outside the assigner's own scope → **blocked** (no privilege escalation) | remove the assignment | **`[proposed]` yes for privileged roles** (§11) |
| **Grant the checker capability** · assignment row | Group Admin (group) | role supports it (`M2 §Business rules` — maker-checker capability flag) | toggle; **default off** | the user appears as an eligible checker in AC-02 | granting checker to the only payroll maker → **warn explicitly** (it defeats the gate) | yes | **`[proposed]` yes** (§11) |
| **Grant PII / salary field access** · assignment row | Group Admin (group) | — | `people.pii.read` and salary visibility as **separate** toggles (`§8 Field-level access`), **default off** | field-level unmasking becomes possible for that user; every access is logged | — | yes | **`[proposed]` yes** |
| **Deactivate a user** · row menu | `iam.manage` holder | — | confirm; reason | `is_active=false`; sessions revoked; **pending maker-checker items they own must be reassigned** — the dialog must say so | pending approvals owned → listed before confirming | reactivate | no |
| **Reset MFA / force a password reset** · row menu | `iam.manage` holder | — | confirm | user must re-enrol/re-set at next sign-in; audited | — | n/a | no |
| **Preview effective permissions** · user detail | `iam.manage` holder | — | — | the resolved permission × scope union (`§4.1`) — the only honest way to answer "what can this person see?" | — | n/a | no |

---

### GA-05 · Roles & permissions — rank 5 · MVP · setup
- **Q:** *"what does each role mean?"*
- **Modules:** `§6.2 Role` (name, permission_set JSON, is_system), `M2 §Seed roles`, `§4.1 RBAC`,
  `§8 Field-level access`.
- **Must contain:** the seven seed roles (Group Admin · Campus Principal · HR Operator · Payroll Operator ·
  Accountant · Department Head · Employee) with their permission sets; system roles marked non-editable
  where appropriate; the permission catalogue grouped by module; **field-level PII permissions shown as
  distinct from record access**; the maker-checker capability.
- **Must NOT contain:** user assignments (GA-04); scope selection (scope lives on the assignment, not the
  role — `§6.2 RoleAssignment`).
- **States:** seed/system role (protected) · custom role · in use (edit warnings) · permission removed
  (impact preview) · **role with no permissions**.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Create a custom role** · page primary | Group Admin (group) | `iam.manage` | name; clone from a seed role (**default: clone Employee**); permission set | assignable in GA-04 | duplicate name → blocked | delete while unassigned | no |
| **Edit a permission set** · role detail | Group Admin | role not `is_system` (**system roles are shown read-only with a clone action**, not silently editable) | permission checkboxes grouped by module; **`documents.write` is unavailable to any Employee-shaped role** (`M4 §Business rules` #2) | applies to every holder on the next token refresh; audited; **impact preview lists how many users are affected** | removing a permission that would strand a workflow (e.g. no `payroll.approve` holder left) → **warn and require confirmation** | yes | **`[proposed]` yes** — permission changes are the highest-leverage edit in the product (§11) |
| **View who holds this role** · role detail | Group Admin | — | — | the assignment list (routes to GA-04) | — | n/a | no |
| **Delete a custom role** · row menu | Group Admin | no active assignments | confirm | removed | assigned → **shown disabled** with the count | no | no |

---

### GA-06 · Academic year & terms — rank 6 · MVP · setup
- **Q:** *"what is our session shape?"*
- **Modules:** `§6.6 AcademicYear/Term`, `M7 §Business rules` ("one `is_current` AY per scope; **vacation
  terms feed teacher leave logic**"), `M7 §Acceptance`, `M7 §Permissions`.
- **Must contain:** academic years with start/end and the **`is_current`** flag; terms with `type`
  (`teaching · exam · vacation`) and dates; the **vacation terms that drive vacation-staff leave** and the
  **exam terms that drive leave blackouts** (`M8 §Business rules`), each labelled with its consequence;
  scope (campus or org).
- **Must NOT contain:** holidays (PR-07 — per campus); leave types (HR-26); timetable (**P2**).
- **States:** no AY (**blocks leave policy and balances**) · draft · current · future · past (read-only) ·
  overlapping terms (blocking) · **two AYs marked current** (must be impossible) · term gaps.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Create an academic year** · page primary | Group Admin / Principal with `calendar.manage` | — | label (e.g. 2026-27); start/end (**default Apr–Mar**, the Indian session); scope (org or campus) | available for leave policy (HR-26), balances, appraisal cycles (HR-35) | overlapping AY in the same scope → blocked | editable while no balances exist | no |
| **Add a term** · AY detail | `calendar.manage` holder | AY exists | name; `type` (`teaching · exam · vacation`, **no default**); dates | **vacation terms change teacher leave behaviour; exam terms create leave blackouts** — the form must state this at the point of choice | overlapping terms → blocked; term outside the AY → blocked | yes before the term starts | no |
| **Set an AY as current** · AY row | `calendar.manage` holder | AY exists | confirm | previous `is_current` cleared (**exactly one per scope**, `M7 §Business rules`); leave balances and reports re-frame | balances not initialised for the new AY → warns with a route to HR-27 | yes | **`[proposed]` yes** — this shifts the whole leave frame (§11) |
| **Roll over to the next year** · page header · **`[proposed]`** | `calendar.manage` holder | a current AY exists | copy terms; shift dates | draft AY created | — | yes | no |
| **Edit a term's dates** · term row | `calendar.manage` holder | term not past | reason | leave day-counts and blackout validation change from the effective date | approved leave already exists in the affected window → **listed before allowing** | yes | no |

---

### GA-07 · Statutory configuration — rank 7 · MVP · setup
- **Q:** *"which statutory rules are in force, and since when?"*
- **Modules:** `§4.4` (**"`StatutoryConfig` is an immutable, versioned snapshot … Each `PayrollRun` pins the
  version it used … Statutory numbers live in data, never in code"**), `§6.10 StatutoryConfig` (version,
  effective_from, rules JSON: PF rate + ceiling, EPS cap, ESI rate + ceiling + periods, PT slabs per state,
  TDS slabs old/new, gratuity formula, bonus %/caps, LWF per state, min-wage), `M11 §Acceptance`
  ("changing the PF ceiling creates a **new config version**; a prior month re-opened still computes on its
  **original** version").
- **Must contain:** the version list with `effective_from` and status (draft/active/superseded); the full
  rule set per version, grouped (PF · EPS · ESI · PT by state · TDS both regimes · gratuity · bonus · LWF ·
  min-wage); a **diff between versions**; which payroll runs pinned which version; the effective-date
  timeline.
- **Must NOT contain:** any edit-in-place control (**versions are immutable** — a change creates a new
  version); rates duplicated anywhere else in the product; a delete for a version that a run has pinned.
- **States:** draft version · active · future-dated (scheduled) · superseded · **pinned by runs** (immutable,
  deletion blocked) · gap in coverage (a period with no effective version — **blocking for payroll**).

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Create a new version** · page primary | Group Admin with `statutory.manage` (group) | — | clone from the active version (**default on** — nobody should retype slabs); `effective_from` (**required**); edit the rule set | `status=draft` | `effective_from` inside an already-run period → **blocked** (it would contradict pinning) | delete while draft and unpinned | no |
| **Edit a draft version's rules** · version detail | `statutory.manage` holder | version `draft` | PF rate/ceiling; EPS cap; ESI rate/ceiling/periods; **PT slabs per state**; TDS slabs (old + new); gratuity formula; **bonus % band, calc cap, eligibility ceiling**; LWF per state; min-wage | draft updated | values outside plausible bounds → warned, not silently accepted | yes while draft | no |
| **Compare with the previous version** · version detail | `statutory.manage` holder | ≥2 versions | — | a field-by-field diff — **the artefact a reviewer actually needs** | — | n/a | n/a |
| **Activate a version** · version detail primary | Group Admin with `statutory.manage` | draft complete; `effective_from` in the future or the current open period | confirm dialog listing **what changes, from when, and how many staff/runs it will affect** | version becomes effective; **future runs pin it; past runs keep theirs** (`§4.4`); audited | activating a version that leaves a coverage gap → blocked | **no** — supersede with a further version | **`[proposed]` yes — this is the single highest-consequence setup action in the product** (§11) |
| **View pinning** · version detail | `statutory.manage` holder | — | — | which `PayrollRun`s pinned this version (`§6.9`) — the provenance chain for every past payslip | — | n/a | no |
| ~~Edit an active/superseded version~~ | **hidden for everyone** | — | — | — | — | — | governance: immutability (`§4.4`) — this is what makes re-opening a prior month safe |

---

### GA-08 · Audit log — rank 8 · MVP · destination
- **Q:** *"who changed what, and when?"*
- **Modules:** `§4.2` (**"Every mutating action writes an `AuditLog` … Mandatory and non-bypassable for
  payroll runs, statutory filings, approvals, document changes, and master-data edits"**),
  `§6.11 AuditLog`, `M15 §API` (`…/audit-logs` — read), `M15 §Acceptance` ("audit log is append-only").
- **Must contain:** actor, action, entity + id, **before/after**, timestamp, scope; filters by actor,
  entity, action, date; the high-sensitivity views (payroll approvals, statutory filings, document
  verifications, permission changes, PII access); export for an auditor.
- **Must NOT contain:** **any** edit or delete control (append-only, read-only API — `M15 §API`); PII
  values in plain text where the underlying field is masked (`§8` — the audit must record *that* a value
  changed without re-exposing it); other tenants (RLS, `§3`).
- **States:** loading · overflow (paginate, `§7` cursor) · filtered · empty for the filter · export queued ·
  retention boundary reached `[proposed]`.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Filter** · card header | Group Admin (group) / auditors | — | actor, entity type, entity id, action, date range (**default last 7 days**), scope, sensitivity class | filtered read | — | yes | no |
| **Open an entry** · row | Group Admin | — | — | the before/after diff, with masked fields shown as *changed* rather than revealed | — | yes | no |
| **Export** · page header | Group Admin | — | CSV/JSON; range **required** (no unbounded export) | **the export itself is audited** | oversized → queued | n/a | no |
| **Follow the entity's history** · entry menu | Group Admin | — | — | the full chain for that record — the provenance trail behind any disputed number | — | yes | no |
| ~~Edit / delete an entry~~ | **hidden for everyone** | — | — | — | — | — | governance: append-only (`§4.2`, `M15 §Acceptance`) |

---

### GA-09 · Group reports — rank 9 · MVP · destination
- **Q:** *"what does the group need to report?"*
- **Modules:** `M15 §Purpose`, `M15 §Business rules` (group dashboards), `M11` (consolidated statutory).
- **Must contain:** cross-campus headcount, cost, attrition, statutory liability and compliance status;
  per-legal-entity consolidation; the campus comparison; export.
- **Must NOT contain:** campus-operational registers (PR-06); trust/12A audit reports (**P2**);
  custom report builder (**P2**); PTR/affiliation exports (**P2/Later**).
- **States:** as PR-06, plus **entity-consolidation mismatch** (a campus unassigned to a legal entity).

**Actions** — the shared report-runner component (run · download · schedule `[proposed]` · save a view
`[proposed]`) at group scope. Not repeated.

---

### GA-10 · Integrations & webhooks — rank 10 · MVP · setup
- **Q:** *"are our external connections configured and healthy?"*
- **Modules:** `M16 §Purpose`, `M16 §Business rules` (biometric families; SMS/email providers; accounting
  export; **webhooks** `employee.created`, `payroll_run.approved`, `offer.accepted`), `§7 Webhooks`
  (signed HMAC, retried with backoff, per-tenant), `M16 §API`.
- **Must contain:** provider configuration for SMS/email (`M14` channels); webhook endpoints with events,
  secret (write-only), and **delivery health** (recent attempts, failures, retry state); the accounting
  export (**P2**) shown as unavailable rather than absent; API/service tokens for ingestion.
- **Must NOT contain:** vendor SDK-specific internals (`guard-vendor-isolation` — adapters are backend);
  device inventory (GA-11 — a different question: *are the devices feeding us data?*); secrets in
  plain text after saving.
- **States:** not configured · configured · **failing deliveries** (lead) · retrying · secret rotation
  pending · provider quota exceeded.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Configure a provider** · card | Group Admin (group) | — | provider; credentials (**write-only**, never re-displayed); sender ID; test recipient | channel becomes usable by M14 | invalid credentials → the test fails with the provider's message | yes | no |
| **Send a test message** · card | Group Admin | provider configured | channel; recipient = me | delivery result shown | — | n/a | no |
| **Add a webhook endpoint** · card | Group Admin | — | URL (**HTTPS only**); events (`employee.created · payroll_run.approved · offer.accepted`); secret **generated, shown once** | signed deliveries begin (`§7` — HMAC, retried with backoff) | non-HTTPS → blocked | disable/delete | no |
| **Rotate a secret** · endpoint row | Group Admin | endpoint exists | confirm; overlap window `[proposed]` | new secret shown once; old invalidated after the window | — | no | no |
| **Replay a failed delivery** · delivery row | Group Admin | delivery failed | confirm | re-delivered with the same idempotency semantics | endpoint still failing → surfaced | n/a | no |
| **Disable an endpoint** · row menu | Group Admin | — | confirm | deliveries stop and are **not** silently queued forever | — | yes | no |
| **Issue a service token for ingestion** · card | Group Admin | — | scope: attendance ingest (`M9 §API` — service auth); expiry (**default 1 year**) | token shown **once**; used by device middleware | — | revoke | **`[proposed]` yes** — an ingest token writes attendance, which writes pay (§11) |

---

### GA-11 · Devices & ingestion health — rank 11 · MVP · destination
- **Q:** *"are our biometric devices actually sending data?"*
- **Modules:** `M16 §Business rules` (biometric device families ZKTeco/eSSL/Matrix/Realtime via push/pull
  ingestion), `M16 §API` (`POST …/attendance/ingest`), `M16 §Acceptance` ("a biometric push creates
  attendance records"), `M9`.
- **Must contain:** devices by campus/gate with family, last-seen timestamp, today's record count, and
  **gap detection** (a device that has stopped); the ingestion log with rejected records and reasons
  (unknown employee code, duplicate, out-of-range timestamp); the link to the attendance impact.
- **Must NOT contain:** attendance correction (HR-30); vendor SDK configuration internals; employee PII in
  the ingestion log beyond the employee code.
- **States:** all healthy · **device silent** (lead — this becomes false absences) · partial ingestion ·
  rejected records present · clock drift detected `[proposed]` · device newly registered/unmapped.
- **Gap:** required by `M16 §Acceptance` and appears on no prior screen list — see §10.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Register a device** · page primary | Group Admin (group) | campus exists | family (`zkteco · essl · matrix · realtime`); serial; campus + gate label; mode push/pull | the device may ingest via its service token | duplicate serial → blocked | deactivate | no |
| **Trigger a pull / re-sync** · device row | Group Admin | device is pull-mode and reachable | date range (**default today**) | records ingested idempotently (duplicates ignored) | device unreachable → the error and last-seen shown | re-runnable | no |
| **Resolve a rejected record** · log row | Group Admin / HR | rejection has a fixable cause | map the device code to an employee; or discard with a reason | on mapping, the record is ingested and attendance recomputes | unmappable → discard is recorded, never silently dropped | n/a | no |
| **Raise an outage window** · page header | Group Admin / HR | a device gap is confirmed | date range; affected campus | flags the window across attendance surfaces (DH-03, PR-02, HR-30) so absences are not misread | — | yes | no |
| **Deactivate a device** · row menu | Group Admin | — | confirm | stops accepting its pushes | — | yes | no |

---

### GA-12 · Data protection & DPDP console — rank 12 · MVP · destination · **GAP**
- **Q:** *"are we meeting our data-protection obligations?"*
- **Modules:** `§8 Consent & retention (DPDP 2023)` (**"Lawful-basis records, retention windows,
  data-access/correction requests; statutory-retention data survives exit"**), `§8 PII classification`
  ("access-logged"), `§8 Child-safety`.
- **Must contain:** retention policy per data class with the countdown and what is due for deletion or
  anonymisation; **data-subject access/correction requests** with their state and statutory clock; the
  consent/lawful-basis register (candidates especially — PUB-02); the **PII access log** (who viewed whose
  sensitive fields — `§8` mandates access logging but nothing surfaces it); exited-staff records retained
  for statutory reasons.
- **Must NOT contain:** bulk deletion without a retention basis; the general audit log (GA-08 — this is the
  PII-specific view); an ability to purge statutory-retention data before its window.
- **States:** compliant · **retention due** (action needed) · request open / overdue · request fulfilled ·
  legal hold `[proposed]` · anomalous PII access detected `[proposed]`.
- **Gap:** `§8` mandates all of this, and **no screen anywhere covers it**. This is the most significant
  compliance omission found — see §10.

**Actions**

| Action · where | Who (scope) | Preconditions | Options & defaults | After · downstream | Failure | Reversible? | 2nd eyes? |
|---|---|---|---|---|---|---|---|
| **Log a data-subject request** · page primary | Group Admin / DPO-equivalent (group) | — | subject; type (access · correction · erasure); received date; statutory due date (**auto-computed**) | request tracked; clock started | — | yes | no |
| **Fulfil an access request** · request row | Group Admin | request open | generate the subject's data pack | pack generated (the employee-side equivalent is EMP-18's *Download my record*); fulfilment recorded; **the export is audited** | — | n/a | no |
| **Apply a correction** · request row | Group Admin | request open | routes to the owning screen (HR-04 etc.) | corrected with the request referenced in the audit trail | — | yes | no |
| **Execute a retention action** · retention row | Group Admin | retention window elapsed **and** no statutory-retention override | anonymise (**default**) vs delete; confirm listing the record count | records anonymised/deleted; the action is audited (the audit entry survives) | statutory-retention data (payroll, filings) → **blocked with the reason** (`§8`) | **no** | **`[proposed]` yes** — irreversible data destruction (§11) |
| **Review PII access** · access-log card | Group Admin | — | filter by viewer, subject, field class, date | who unmasked what — the control that makes `§8` real | — | n/a | no |
| **Record a consent basis** · consent card | Group Admin | — | data class; lawful basis; retention window | drives the retention countdowns | — | yes | no |

---

# 10 · Coverage, gaps and conflicts

## 10.1 Coverage table — every MVP screen × role

**Owner** = the role the screen is designed for (and where it is defined above). **Also reachable by** =
roles that see the same screen scope-narrowed or scope-widened — they do **not** get a separate screen.

| # | Code | Screen | Kind | Owner | Also reachable by | Modules |
|---|---|---|---|---|---|---|
| 1 | SH-01 | Sign in | destination | all | — | M2, §7, §8 |
| 2 | SH-02 | One-time-code sign-in | task | all | — | M2, M14 |
| 3 | SH-03 | Notification centre | destination | all | — | M14, §4.6 |
| 4 | SH-04 | My account & security | setup | all | — | M2, M13, §8 |
| 5 | PUB-01 | Careers listing | destination | public | — | M5 |
| 6 | PUB-02 | Job application form | task | public | — | M5, §8 |
| 7 | PUB-03 | Pre-boarding document upload | task | joiner (token) | — | M4, M6, bp §8 |
| 8 | PUB-04 | Offer acceptance | task | candidate (token) | — | M5 |
| 9 | EMP-01 | Home | destination | Employee | all roles (everyone is an employee) | M13, M9, M8, M4 |
| 10 | EMP-02 | My attendance | destination | Employee | all roles | M9, M13 |
| 11 | EMP-03 | Mark attendance | task | Employee | all roles | M9, M13, §9 |
| 12 | EMP-04 | Request regularization | task | Employee | all roles | M9, M13 |
| 13 | EMP-05 | My leave | destination | Employee | all roles | M8, M7 |
| 14 | EMP-06 | Apply for leave | task | Employee | all roles | M8 |
| 15 | EMP-07 | My payslips | destination | Employee | all roles | M10, M13 |
| 16 | EMP-08 | My tax documents | destination | Employee | all roles | M11, M13 |
| 17 | EMP-09 | Investment declaration | task | Employee | all roles | M11, M13 |
| 18 | EMP-10 | My documents | destination | Employee | all roles | M4 |
| 19 | EMP-11 | Respond to a document request | task | Employee | all roles | M4 |
| 20 | EMP-12 | My reimbursement claims | destination | Employee | all roles | M10, M13 |
| 21 | EMP-13 | New reimbursement claim | task | Employee | all roles | M10, M13 |
| 22 | EMP-14 | My helpdesk tickets | destination | Employee | all roles | M15.1, M13 |
| 23 | EMP-15 | Raise a ticket | task | Employee | all roles | M15.1, M13 |
| 24 | EMP-16 | My goals | destination | Employee | all roles | M17 |
| 25 | EMP-17 | Self-appraisal | task | Employee | all roles | M17 |
| 26 | EMP-18 | My profile | destination | Employee | all roles | M3, M13 |
| 27 | EMP-19 | My loans & advances `[proposed]` | destination | Employee | all roles | M10 |
| 28 | DH-01 | Department home | destination | Dept Head | — | M15, M8, M9, M17 |
| 29 | DH-02 | Leave approvals | destination | Dept Head | Principal (own dept) | M8 |
| 30 | DH-03 | Department attendance | destination | Dept Head | Principal, HR (read) | M9 |
| 31 | DH-04 | Regularization approvals | destination | Dept Head | Principal | M9 |
| 32 | DH-05 | My team | destination | Dept Head | Principal (own dept) | M3, M2 |
| 33 | DH-06 | Goal setting | task | Dept Head | Principal, HR | M17 |
| 34 | DH-07 | Appraisal reviews | destination+task | Dept Head | Principal (as manager) | M17 |
| 35 | DH-08 | Classroom observation | task | Dept Head | Principal, HR | M17, bp §10 |
| 36 | DH-09 | Reimbursement approvals | destination | Dept Head | Principal | M10 |
| 37 | PR-01 | Campus home | destination | Principal | — | M15, M9, M8, M3 |
| 38 | PR-02 | Campus attendance board | destination | Principal | HR, Group Admin | M9 |
| 39 | PR-03 | Leave escalations & campus leave | destination | Principal | Group Admin | M8 |
| 40 | PR-04 | Requisition approvals | destination | Principal | **Group Admin** (wider budget authority) | M5 |
| 41 | PR-05 | Appraisal moderation | destination+task | Principal | HR (`appraisal.manage`) | M17 |
| 42 | PR-06 | Campus reports | destination | Principal | HR | M15 |
| 43 | PR-07 | Holiday calendar | setup | Principal | Group Admin (all campuses) | M7 |
| 44 | HR-01 | HR work queue (home) | destination | HR Operator | — | M4, M5, M6, M15.1 |
| 45 | HR-02 | Staff register | destination | HR Operator | Principal (read, campus), Group Admin | M3 |
| 46 | HR-03 | Employee record — summary | detail | HR Operator | Principal (read) | M3 |
| 47 | HR-04 | Employee — personal & statutory IDs | detail | HR Operator | Payroll (read, PII-gated) | M3, §8 |
| 48 | HR-05 | Employee — contract & category | detail | HR Operator | Principal (read), Payroll (read) | M3, M6 |
| 49 | HR-06 | Employee — service book | detail | HR Operator | Payroll (gratuity basis) | M3, M12 |
| 50 | HR-07 | Employee — documents | detail | HR Operator | Principal (read, restricted types) | M4 |
| 51 | HR-08 | Staff categories & taxonomy | setup | HR Operator | Group Admin | M3, M5 |
| 52 | HR-09 | Document control queue | destination | HR Operator | — | M4, M14 |
| 53 | HR-10 | Verify document response | task | HR Operator | — | M4 |
| 54 | HR-11 | Expiry watchlist | destination | HR Operator | Principal (campus) | M14, M4, M3 |
| 55 | HR-12 | Verification & child-safety board | destination | HR Operator | **Principal** (campus exposure) | §8, M4, bp §11 |
| 56 | HR-13 | Requisitions | destination | HR Operator | Principal (read) | M5 |
| 57 | HR-14 | Job postings | destination | HR Operator | — | M5 |
| 58 | HR-15 | Candidate pool | destination | HR Operator | — | M5 |
| 59 | HR-16 | Application pipeline | destination | HR Operator | Principal (read) | M5 |
| 60 | HR-17 | Application detail & screening | detail | HR Operator | panellists (read) | M5 |
| 61 | HR-18 | Interview schedule | destination | HR Operator | panellists (own) | M5 |
| 62 | HR-19 | Interview scorecard | task | **panellist** (DH/PR/HR/Employee) | — | M5 |
| 63 | HR-20 | Offers | destination | HR Operator | Principal (read) | M5 |
| 64 | HR-21 | Offer → employee conversion | task | HR Operator | — | M5, M6, M4 |
| 65 | HR-22 | Onboarding checklists | destination | HR Operator | task owners (IT/dept) | M6 |
| 66 | HR-23 | Bulk / seasonal onboarding | task | HR Operator | — | M6 |
| 67 | HR-24 | Probation & confirmation queue | destination | HR Operator | Principal (decision) | M3, bp §8 |
| 68 | HR-25 | Renewal & non-renewal queue | destination | HR Operator | **Principal** (decides) | M6 |
| 69 | HR-26 | Leave policy & types | setup | HR Operator | Group Admin | M8 |
| 70 | HR-27 | Leave balances register | destination | HR Operator | Principal (read) | M8 |
| 71 | HR-28 | Leave requests console | destination | HR Operator | Principal | M8 |
| 72 | HR-29 | Shifts & rosters | setup | HR Operator | Principal (read) | M9 |
| 73 | HR-30 | Attendance exceptions | destination | HR Operator | Payroll (pre-run) | M9 |
| 74 | HR-31 | Helpdesk queue | destination | HR Operator | assignees in any role | M15.1 |
| 75 | HR-32 | Ticket detail | detail | HR Operator | assignees | M15.1 |
| 76 | HR-33 | Helpdesk categories & SLA | setup | HR Operator | Group Admin | M15.1 |
| 77 | HR-34 | Notification templates | setup | HR Operator | Group Admin | M14 |
| 78 | HR-35 | Appraisal cycle setup | setup | HR Operator | **Principal** | M17 |
| 79 | HR-36 | Appraisal progress & reports | destination | HR Operator | Principal, Dept Head (own dept) | M17 |
| 80 | HR-37 | HR reports | destination | HR Operator | Principal (campus set) | M15 |
| 81 | PY-01 | Payroll home | destination | Payroll Operator | — | M10, M12 |
| 82 | PY-02 | Pay groups | setup | Payroll Operator | Group Admin | M10 |
| 83 | PY-03 | Salary structure editor | setup | Payroll Operator | — | M10 |
| 84 | PY-04 | Honorarium rules | setup | Payroll Operator | — | M10 |
| 85 | PY-05 | Employee salary & revisions | destination+detail | Payroll Operator | — | M10, §4.3 |
| 86 | PY-06 | Proposed revisions queue (from PAMS) | destination | Payroll Operator | — | M17 → M10 |
| 87 | PY-07 | Payroll run console | destination | Payroll Operator | Accountant (read) | M10 |
| 88 | PY-08 | Paid-days reconciliation | destination | Payroll Operator | HR (fixes) | M9, M10 |
| 89 | PY-09 | Variance review | task | Payroll Operator | Accountant (reads as evidence) | M10 |
| 90 | PY-10 | Payslip register (run detail) | detail | Payroll Operator | Accountant | M10, M15 |
| 91 | PY-11 | Disbursement & bank file | task | Payroll Operator | Accountant (read) | M10 |
| 92 | PY-12 | Payslip publication | task | Payroll Operator | — | M10, M14 |
| 93 | PY-13 | Loans & advances register | destination | Payroll Operator | HR (originate), Accountant (checker) | M10 |
| 94 | PY-14 | Reimbursement payout batches | task | Payroll Operator | Accountant (checker) | M10 |
| 95 | PY-15 | Arrears workbench | task | Payroll Operator | Accountant (checker) | M10 |
| 96 | PY-16 | Exits & settlements register | destination | Payroll Operator | HR | M12 |
| 97 | PY-17 | Full & final settlement | task | Payroll Operator | Accountant (checker) | M12 |
| 98 | PY-18 | Payroll reports & registers | destination | Payroll Operator | Accountant | M15, M10 |
| 99 | AC-01 | Compliance calendar (home) | destination | Accountant | — | M11, M14, §8 |
| 100 | AC-02 | Maker-checker approval gate | destination+task | **checker-capability holder** | any role holding the flag | §8, M10, M11, M12 |
| 101 | AC-03 | Statutory liability & reconciliation | destination | Accountant | Group Admin (read) | M11, bp §5 |
| 102 | AC-04 | Filings register | destination | Accountant | Group Admin (read) | M11 |
| 103 | AC-05 | Filing generation & validation | task | Accountant | — | M11 |
| 104 | AC-06 | Bonus run | task | Accountant / Payroll (maker) | checker via AC-02 | M11 |
| 105 | AC-07 | Investment declaration review | destination | Accountant | Payroll Operator | M11 |
| 106 | AC-08 | Statutory contributions register | destination | Accountant | Payroll Operator | M11 |
| 107 | GA-01 | Group overview | destination | Group Admin | — | M15 |
| 108 | GA-02 | Org structure | setup | Group Admin | — | M1 |
| 109 | GA-03 | Legal entities & registrations | setup | Group Admin | Accountant (read) | M1, M11 |
| 110 | GA-04 | Users & role assignments | destination | Group Admin | Principal/HR with `iam.manage` at campus scope | M2 |
| 111 | GA-05 | Roles & permissions | setup | Group Admin | — | M2, §4.1, §8 |
| 112 | GA-06 | Academic year & terms | setup | Group Admin | Principal (campus-scoped AY) | M7 |
| 113 | GA-07 | Statutory configuration | setup | Group Admin | Accountant (read) | §4.4, M11 |
| 114 | GA-08 | Audit log | destination | Group Admin | Accountant/compliance (read) | §4.2, M15 |
| 115 | GA-09 | Group reports | destination | Group Admin | — | M15 |
| 116 | GA-10 | Integrations & webhooks | setup | Group Admin | — | M16, §7 |
| 117 | GA-11 | Devices & ingestion health | destination | Group Admin | HR, Principal (read) | M16, M9 |
| 118 | GA-12 | Data protection & DPDP console | destination | Group Admin | — | §8 |

### Totals

| Role | Screens **owned** | Screens **reachable** (owned + scope-narrowed) | Rank-1 screen |
|---|---|---|---|
| Shared (any role) | 4 | 4 | SH-01 Sign in |
| Public / token | 4 | 4 | PUB-01 |
| **Employee** | **19** | 23 (19 + 4 shared) | EMP-01 Home |
| **Department Head** | **9** | 33 (9 + 19 employee + 4 shared + HR-19) | DH-01 Department home |
| **Campus Principal** | **7** | ~48 | PR-01 Campus home |
| **HR Operator** | **37** | ~62 | HR-01 HR work queue |
| **Payroll Operator** | **18** | ~45 | PY-01 Payroll home |
| **Accountant** | **8** | ~38 | AC-01 Compliance calendar |
| **Group Admin** | **12** | ~70 (widest scope) | GA-01 Group overview |
| **TOTAL DISTINCT MVP SCREENS** | **118** | — | — |

Plus **1 P2** (AC-09 accounting/JV export) and **1 Later** (PUB-05 student/parent 360°, retagged by
amendment A). **The canvas's ~50 frames covered 42% of the MVP surface.**

**Count sanity check.** 118 is large but proportionate: 17 modules × full statutory parity × 7 roles. The
distribution is the useful signal — **HR Operator (37) and Payroll Operator (18) hold 47% of the MVP
surface**, which is exactly where the product's differentiation lives and exactly where nothing is built.

---

## 10.2 Gaps — required by the spec, listed nowhere before this document

Ordered by consequence. Each cites the requirement it satisfies.

| # | Missing screen | Why it must exist | Citation |
|---|---|---|---|
| G1 | **AC-02 Maker-checker approval gate** | Maker-checker is mandated across payroll runs, loans, reimbursement batches, arrears, bonus and F&F, but **no screen existed for the checker at all**. Without it, the flagship control is unimplementable, and `DESIGN.md` principle 10 is unenforceable. | `§8 Maker–checker`, `M10 §Permissions`, `M11 §Permissions`, `M12 §API` |
| G2 | **GA-12 Data protection & DPDP console** | Lawful-basis records, retention windows, data-subject access/correction requests and PII access logging are mandated; **nothing surfaced any of them.** The largest compliance omission found. | `§8 Consent & retention (DPDP 2023)`, `§8 PII classification` |
| G3 | **PY-08 Paid-days reconciliation** | The payroll workflow's **first computational step** (`Eng->>Att: Paid-days per employee`) and the acceptance criterion for mid-month joiners. Absent from every prior list. | `M9 §Business rules`, `M9 §Acceptance`, `M10 §Workflow` |
| G4 | **PY-06 Proposed revisions queue** | M17 requires the increment/promotion recommendation to reach payroll as a **proposed** revision that still passes maker-checker. The handoff had no surface, so the requirement was unimplementable. | `M17 §Business rules`, `M17 §Acceptance` |
| G5 | **PY-04 monthly honorarium unit entry** | `HonorariumRule` is rate × unit × cap and the engine computes "rate×units", but **no source of `units` exists in MVP** (period-level attendance is D2-deferred). A manual, approved entry surface is required or guest faculty cannot be paid. | `§6.9 HonorariumRule`, `M10 §Workflow`, `M10 §Acceptance` |
| G6 | **GA-11 Devices & ingestion health** | A silent biometric device manufactures false absences, which become LOP, which becomes wrong pay. The acceptance criterion exists; the surface did not. | `M16 §Acceptance`, `M9 §Business rules` |
| G7 | **HR-12 Verification & child-safety board** | Background/police verification tracking is an MVP child-safety mandate with restricted access and expiry consequences. No screen listed it. | `§8 Child-safety`, blueprint §11 |
| G8 | **HR-11 Expiry watchlist** | Document/contract expiry scanning with lead times is MVP and has a named acceptance criterion; it had no home, and was at risk of being scattered across four screens. | `M14 §Business rules`, `M14 §Acceptance`, blueprint §1 |
| G9 | **GA-07 Statutory configuration** | The versioned, immutable, pinned config is a cross-cutting foundation (`§4.4`) and the thing every statutory number reads. Nobody had a screen to see or create a version. | `§4.4`, `§6.10`, `M11 §Acceptance` |
| G10 | **GA-08 Audit log viewer** | The audit trail is mandatory and append-only with a read API and an explicit acceptance criterion — but unreadable without a surface. | `§4.2`, `M15 §API`, `M15 §Acceptance` |
| G11 | **AC-03 statutory reconciliation + AC-08 contributions register** | "Reconciliation reports (payable vs paid); statutory liability provisioning" is MVP. | `M11 §Business rules`, blueprint §5 |
| G12 | **AC-06 Bonus run** | Config-driven bonus with the §32 educational-institution exemption and its own maker-checker gate. | `M11 §Bonus`, `M11 §Acceptance` |
| G13 | **PY-15 Arrears workbench** | Month-split retro pay with per-month **originally pinned** config recomputation is one of the hardest correctness requirements in the product and needs a screen that *shows* the pinning. | `M10 §Arrears`, `M10 §Acceptance` |
| G14 | **PY-17 F&F settlement** | Gratuity, §10(10AA) encashment, loan recovery and TDS true-up — MVP by locked decision D3. | `M12`, `decisions-to-finalize.md` D3 |
| G15 | **HR-24 probation queue · HR-25 renewal/non-renewal queue** | Both are named MVP capabilities with an explicit acceptance criterion for contract auto-expiry surfacing in a renewal queue. | `M6 §Acceptance`, blueprint §8 |
| G16 | **HR-23 Bulk / seasonal onboarding** | Seasonal bulk onboarding with academic-year contracts is a named MVP differentiator with a dedicated bulk API. | `M6 §Business rules`, `M6 §API` |
| G17 | **PUB-01…04 public surfaces** | The career site, application form, pre-boarding upload and offer acceptance are all MVP capabilities with no authenticated route — candidates and joiners have no account by definition. | `M5 §API`, blueprint §8, §11 |
| G18 | **HR-33 helpdesk categories & SLA · HR-34 notification templates** | Categories, auto-assignment, SLA/TAT and templates are explicitly **configurable** — configurable means a configuration screen, or it becomes hardcoded. | `M15.1 §Business rules`, `M14 §API` |
| G19 | **HR-26 leave policy & types · HR-29 shifts** | The vacation-staff flag, accrual rules and blackout binding live here. This is where Naveya's core differentiator is actually configured, and it had no screen. | `M8 §Business rules`, `M9 §Business rules` |
| G20 | **HR-08 staff categories · PY-02 pay groups · PY-03 structures · PY-04 honorarium** | The four setup screens without which **no payroll can run at all**. | `M3`, `M10` |
| G21 | **GA-03 legal entities** | Payroll runs and every statutory filing are keyed to `LegalEntity`; without it there is no employer of record. | `§6.1`, `§6.9`, `M11` |
| G22 | **HR-06 service book** | An MVP differentiator (digital service book / faculty dossier) **and** the gratuity computation basis. | `§6.3 ServiceRecord`, blueprint §1, `M12` |
| G23 | **EMP-08 tax documents · EMP-09 investment declaration · AC-07 review** | Form 16/12BA distribution and the declaration→proof→verification loop are MVP and span two roles. | `M11 §Business rules`, blueprint §4 |
| G24 | **SH-03 notification centre** | M14 exists as a module with an API; nothing consumed it in-app. | `M14 §API` |
| G25 | **EMP-19 my loans `[proposed]`** | An EMI deduction appears on the payslip; the employee needs its provenance. | `M10 §Loans`, `DESIGN.md` principle 6 |

## 10.3 Conflicts — spec vs spec, or spec vs design principle

| # | Conflict | Resolution recommended (not applied silently) |
|---|---|---|
| **C1** | **The employee record answers many questions**, violating "one screen, one question" (`DESIGN.md` principle 2). `M3` treats the employee as one entity with contracts, service records, documents and salary hanging off it. | Treat HR-03 as a **subject shell** answering exactly one question — *"who is this person and what state are they in?"* — with HR-04…HR-07 as separate screens reached from it. The shell shows state and alerts, never forms. **Applied in this document.** |
| **C2** | **Dashboards:** `M15 §Business rules` lists "campus + group dashboards" inside an MVP module; blueprint §15 tags "Campus-wise & group dashboards **[P2]**". | Split the meaning: a role's **home** (PR-01, GA-01, DH-01, HR-01, PY-01, AC-01) is MVP — every role needs a landing screen and `DESIGN.md` principle 5 makes them role-specific. *Analytical* dashboards (trend/attrition/custom) stay **P2**. **Applied.** |
| **C3** | **Exit:** `M12` (F&F) is MVP by locked decision D3, but blueprint §8 tags "Exit/offboarding: clearance checklist … exit interview **[P2]**". F&F cannot compute without a last working day and an exit trigger. | **Exit initiation** (last working day, reason, notice) is MVP as an action on HR-02/HR-03; the **clearance checklist and exit interview screens stay P2**. **Applied.** |
| **C4** | **Blueprint §9 line 213: "Profile/document self-update [MVP]"** directly contradicts `M4 §Business rules` #2, `M4 §Acceptance` (403 on any employee document write) and `DESIGN.md` principle 9. | A stale line predating the 2026-07-15 document-governance lock. **NOT yet corrected — needs a ruling** (see §11 Q29). Recommended wording: profile **view** + document updates **only** via an HR-initiated request. This inventory follows the governance model regardless: EMP-10 and EMP-18 carry no write controls at all. |
| **C5** | **Blueprint tags vs locked decisions.** The blueprint still tags as `[MVP]`: period-level attendance (§2 line 60), period-level leave (§3 line 80), leave→substitution linkage (§3 line 85), substitution-duty notifications (§9 line 211) — all **P2 by locked D2**. And it still tags as `[P2]`: the F&F engine (§4 line 117), gratuity (§5 line 134), LWF (§5 line 136), minimum wages (§5 line 137) — all **MVP by locked D3**. Its own PART C already contradicts its module tags. | The `decisions-to-finalize.md` locks win. **NOT yet corrected — needs a ruling** (see §11 Q30). This inventory follows the locks: **no** substitution or period-level screens; PY-16/PY-17 (F&F) and the gratuity/LWF/min-wage surfaces in AC-03/AC-08 are **MVP**. |
| **C6** | **Who is the checker?** `M2 §Business rules` makes maker-checker a **capability flag on a role**, not a role. This document assigns AC-02 to the Accountant as the *typical* holder. | Keep the flag model. AC-02 is defined as **the screen of whoever holds the capability**, not "the Accountant's screen" — its coverage row says so. A small school may put the flag on the Principal. |
| **C7** | **PAMS vs payroll authority.** `M17` produces increment recommendations; `M10` owns pay. A naive design would let appraisal change salary. | The recommendation is **advisory** and surfaces as a *proposed* revision (PY-06) that still passes payroll maker-checker (`M17 §Business rules`). **Applied** — PY-06 has no auto-apply action. |
| **C8** | **Access revocation vs statutory retention.** `M12 §Acceptance` flips `User.is_active=false` on F&F completion, while `§8` requires statutory-retention data (payslips, Form 16) to survive exit — and the leaver still needs their Form 16. | Unresolved in the spec. Recommended: a **post-exit limited access mode** (tax documents + payslips only) rather than a binary flip. Raised as Q7 in §11. |
| **C9** | **HR administering vs deciding.** Several HR screens sit next to approval queues (leave, regularization, reimbursement). Letting HR "force-approve" would quietly dissolve the approval chains the spec defines. | HR-28's force-approve is **hidden** unless the user separately holds `leave.approve` at campus scope; HR-30's direct attendance edit is permitted (`attendance.manage`) but flagged for a second pair of eyes (Q9). **Applied.** |
| **C10** | **"Every element earns its place" vs statutory completeness.** The statutory screens (AC-03…AC-08) are dense by necessity; a school's accountant genuinely needs every figure. | Principle 5 governs: density is a function of role. The Accountant's screens may be dense; the Employee's may not. No conflict once read per-role — recorded here because it *looks* like one. |

---

# 11 · Open questions for the parking lot

These are spec ambiguities found while decomposing. Per my standing rules I flag rather than guess. They
belong in `docs/decisions-to-finalize.md` at dev start; I have **not** written them there, since that file
records *locked* decisions and a scope-change log.

**Blocking for MVP build (a screen cannot be finished without an answer)**

| # | Question | Where it bites | Spec silence |
|---|---|---|---|
| Q1 | **Where do honorarium `units` come from each month?** Period-level attendance is D2-deferred, so nothing counts lectures. | PY-04, PY-07 compute | `§6.9 HonorariumRule`, `M10 §Workflow` |
| Q2 | **Who originates a loan?** `Loan.status` starts at `pending_approval` with an `approval_chain`, but no actor is named — employee, HR or payroll. | EMP-19, PY-13 | `§6.9 Loan` |
| Q3 | **Is an out-of-geo-fence punch blocked or flagged?** Geo-fencing is MVP; the enforcement mode is unstated. | EMP-03 | `M9 §Business rules` |
| Q4 | **What are the requisition budget-authority thresholds, and where are they configured?** `approval_chain` is an unstructured JSON blob with no setup surface. | PR-04, HR-13, GA-05 | `§6.5 Requisition` |
| Q5 | **What happens to payroll and attendance when a fixed-term contract auto-expires but the person keeps working?** | HR-25, PY-07 | `M6 §Acceptance` |
| Q6 | **Is there a `reports_to` field?** The role model calls "manager" the reports-to relationship, but `§6.3 Employee` carries only `department_id`. Every manager-approval route depends on this. **This is a data-model gap, not just a screen gap.** | DH-02, DH-05, DH-07, M8 routing | `§6.3` |
| Q7 | **Post-exit access:** `M12` revokes access; `§8` requires retained statutory data and the leaver needs Form 16. | EMP-07, EMP-08, PY-17 | conflict C8 |
| Q8 | **Who may open police/background-verification documents?** `§8` says "access-restricted" without naming the permission or whether the subject may view their own. | HR-07, HR-12, EMP-10 | `§8 Child-safety` |
| Q9 | **Does HR's direct attendance edit need a second pair of eyes?** It changes paid-days, and therefore pay, without a manager. | HR-30 | `M9 §Permissions` |
| Q10 | **What is the escalation path when an approver is absent or the post is vacant?** `M8 §Workflow` escalates *by policy*, not by absence; regularization has no escalation at all. | DH-02, DH-04, PR-03 | `M8`, `M9` |

**Non-blocking but needed before the relevant screen ships**

| # | Question | Where |
|---|---|---|
| Q11 | Does a leave request spanning an academic-year boundary split across two `LeaveBalance` ledgers? | EMP-06, HR-27 |
| Q12 | Mid-cycle joiners and mid-cycle leavers in an `AppraisalCycle` — in scope, pro-rated or excluded? | HR-35, DH-07, EMP-16 |
| Q13 | May a classroom observation exist outside an open cycle? `AppraisalRating` requires a `review_id`, but schools observe year-round. | DH-08 |
| Q14 | May the manager stage proceed when the self-appraisal was never submitted? | DH-07, EMP-17 |
| Q15 | Is there a **rehire / duplicate-person merge** path? Creating a second `Employee` silently breaks gratuity continuity. | HR-02, HR-21, HR-06 |
| Q16 | Is there a **"joiner did not report"** path after offer acceptance auto-creates an `Employee`? | HR-21, HR-22 |
| Q17 | May a candidate **withdraw** an application, and what is the DPDP withdrawal path for their consent? | PUB-02, HR-15, GA-12 |
| Q18 | Reimbursement payables at exit — `M12` lists loan recovery but not approved-unpaid claims. | PY-17, EMP-12 |
| Q19 | Is bank-return-file ingestion in scope (partial payment rejection)? Off-cycle runs are P2. | PY-11 |
| Q20 | What is the payslip PDF password rule? Protection is mandated; the key is not specified. | EMP-07 |
| Q21 | Are `StaffCategory` and helpdesk categories tenant-level or campus-level? A group may want different taxonomies per campus. | HR-08, HR-33 |
| Q22 | May a Principal **override an exam blackout**, and does the override itself need a second approver? | PR-03, HR-26 |
| Q23 | When a leave type or policy changes mid-year, are existing balances recalculated or grandfathered? | HR-26, HR-27 |
| Q24 | What is the fallback when an employee elects the old regime and never submits proofs? | EMP-09, AC-07 |
| Q25 | Is previous-employer income intake in scope for Form 16 / TDS? | EMP-08, AC-05 |
| Q26 | Is a `RoleAssignment` effective-dated? Nothing says so, but transfers and acting-charge arrangements need it. | GA-04 |
| Q27 | Which second-eyes gates should exist beyond those the spec names? Candidates flagged in the action tables: bank-detail edits, statutory-ID edits, `is_vacation_staff` flips, salary-structure saves, `StatutoryConfig` activation, permission-set edits, leave-balance adjustments, DPDP erasure. | throughout |
| Q28 | Does an employee-delegate model exist (claiming or applying on behalf of another)? | EMP-13, HR-28 |

**Documentation corrections awaiting a ruling** (found this session, deliberately *not* applied — they
change scope tags, which is BATMAN's and the user's call, not mine)

| # | Correction proposed | Evidence |
|---|---|---|
| Q29 | Strike or reword blueprint §9's `Profile/document self-update **[MVP]**` — it contradicts the document-governance lock and would license a UI the API returns 403 for. | conflict C4; `M4 §Business rules` #2, `M4 §Acceptance` |
| Q30 | Reconcile eight blueprint feature tags with locked D2/D3 (four wrongly `[MVP]`, four wrongly `[P2]`). The blueprint's own PART C already states the opposite of its module tags, so the document currently contradicts itself. | conflict C5; `decisions-to-finalize.md` D2, D3 |
| Q31 | Add a `reports_to` relationship to `§6.3 Employee`. The locked role model defines "manager" as the reports-to relationship, and M8's approval routing depends on it, but the field does not exist. | Q6; `§6.3`, `M8 §Workflow` |

---

# 12 · Amendments (user-approved spec corrections, 2026-08-11)

Three corrections were approved during this session. All three are **internal contradictions** — one part of
the documentation already contradicted another or a locked decision. They are applied to this inventory
**and** to the two authoritative docs.

### Amendment A — Student/parent 360° feedback: MVP → **Later**
- **Ruling:** student and parent feedback leaves the MVP. Classroom observation, peer review and
  student-result/outcome linkage **remain MVP**.
- **Rationale:** the product has seven seed roles (`M2 §Seed roles`) — no student, no parent. Collecting this
  input requires minor-facing identities and **verifiable parental consent under DPDP** (`§8`), a large
  legal expansion for one appraisal input.
- **Applied:** `docs/development-specification.md` (M17 purpose, business rules, module table, and the
  2026-07-22 scope note); `docs/functionality-blueprint.md` (§10, PART C item 11).
- **Data model unchanged:** `§6.12 AppraisalRating.source` keeps `student`/`parent` so the provenance exists
  if such data ever arrives via SIS; **MVP writes only `self`, `manager`, `peer`.**
- **In this document:** PUB-05 retagged Later with no actions; HR-35's 360°-source toggle excludes it.

### Amendment B — "Single-click payroll run" corrected: compute is one action, **release never is**
- **Ruling:** the blueprint's `Single-click payroll run with exception/variance auto-detection **[MVP]**`
  contradicted the maker-checker non-negotiable and `DESIGN.md` principle 10 ("the interface must actively
  refuse to let one person release money"). Corrected: **computation** across all pay groups is a single
  action; **release — run approval, bank-file generation and disbursement — always requires a distinct
  checker and is never one click.**
- **Applied:** `docs/functionality-blueprint.md` §4; `docs/development-specification.md` M10 §Business rules
  (new *Compute vs release* block) and §8's maker–checker row.
- **In this document:** PY-07's *Approve the run* row is **hidden for the maker** and exists only on AC-02;
  PY-11's *Generate the bank file* is **gated on `status=approved`**; PY-01's pipeline shows an explicit
  *awaiting checker* stage. No screen offers a compute→disburse shortcut.

### Amendment D — A **Director** role, and the leave chain is **length-based** (2026-09-22)
- **Ruling (user, this session):** leave approval is a chain whose length is set by the length of the
  leave, and a new trust-level role sits at the top of it.
  - up to **2 days** — the Department Head decides and that is the end of it;
  - **3 days or more** — Department Head, **then the Principal**;
  - more than **15 days** — Department Head, Principal, **then the Director**.
  - A request inside an **exam/admission blackout** climbs to the Principal whatever its length, because
    the override is hers (this preserves PR-03's existing blackout-override flow, which the pure
    length rule would otherwise have stranded).
- **Applicant-relative, not absolute:** the chain starts at the applicant's own approver, so a **Department
  Head's own leave starts with the Principal** — a head never approves herself — and reaches the Director
  only past 15 days. The **Principal and the Director cannot apply for leave at all**: there is nobody
  above them, so neither role carries the self-service Leave item (absent, not disabled).
- **The Director sees everything, decides the long ones.** Every request in the trust is visible to him at
  every length; his decision exists only on the >15-day ones. Modules mirror the Principal's **minus
  attendance** — a director does not supervise a register.
- **HR is not in the chain at all.** HR-28 becomes a **tracker**: where each request sits, what was decided
  and by whom, the SLA watch and the export. Approve, decline, reassign-the-approver and apply-on-behalf
  are **removed from the screen**, not disabled.
- **Applied in the canvas (v3):** `design/v3/leaveflow.jsx` is the single definition of the chain and the
  one queue behind DH-02, PR-03, DR-01/DR-02 and HR-28; `design/v3/kit.jsx` carries the eighth role and
  its permissions.
- **Outstanding:** DR-01 and DR-02 have no entry in this inventory yet, and
  `docs/development-specification.md` M2 §Seed roles / M8 §Workflow still describe seven roles and an
  unparameterised "escalating to Principal where policy requires". Both need alfred's pass; the canvas is
  ahead of the spec here, which is recorded rather than hidden.

### Amendment E — **Cover is chosen when applying**, and Requests is a record, not a form-wall (2026-09-23)
- **Ruling (user):** a colleague to hold the classes is named **as part of applying**, never left for
  afterwards. The apply flow therefore blocks at its cover step — "somebody has to hold these classes
  before the request can go anywhere" — and a request cannot leave the applicant without one. A cover that
  is later **declined** is repaired by re-nominating, not by leaving the field empty.
- **Ruling (user):** the Requests module (EMP-03/04/06/11/12-13 on one surface) opens on **what she has
  already asked for**, and every "ask for something" is a **side panel** that ends. Registers of
  regularisations, leave and claims; a primary CTA per register; the form in the panel.
- **Mark attendance leaves Requests.** Clocking in writes to the attendance record, so it lives beside that
  record on **EMP-02 My attendance** (web clock-in, on duty, partial day), not in the module for things
  somebody else decides. EMP-03 as a *destination* is unchanged; what moved is where it is reached.
- **Documents' Upload hands over.** An employee has no `documents.write` (M4), so Upload on EMP-10 does not
  write a file: it routes to Requests → Respond to HR, the one place a `DocumentUpdateRequest` is answered.
- **Row actions are a panel, not a menu.** A claim's edit / resubmit / withdraw are full rows in its side
  panel, each with the reason it is or is not available, instead of hiding behind a "more" glyph.
- **Approved is not red.** The reimbursement register drew `approved` with the leave-type rose, which reads
  as a refusal at a glance; approved and paid are both affirmative and now share the affirmative green.
- **Applied in the canvas (v3):** `design/v3/kit.jsx` owns `SideScreen` (promoted out of leave.jsx — three
  files open a side panel now); `design/v3/leaveflow.jsx` gained `submit()` so applying from Requests
  enters the **same queue** the approvers read; `design/v3/pages/emp-tasks.jsx` is registers + panels;
  `design/v3/pages/leave.jsx` exports its guided apply flow (`window.NaveyaLeave.Apply`) so there is one
  definition of how leave is applied for, cover step included.

### Amendment F — EMP-01 Home is **ranked, not a card field** (2026-09-23)
- **Ruling (user):** no gradients anywhere; keep Home minimal and relevant to a teacher — attendance and
  the day's timings, leave, the month calendar, cover for colleagues, the holidays ahead, recent HR
  requests and last month's payslip — ordered so it can be scanned rather than searched.
- **The composition:** a plain text page head (greeting, date, who she is — the decorated cream slab and
  its illustration are gone, so the first card starts above the fold); then **Today**, full width, reading
  left to right: clocked in (with provenance) · effective so far · expected out with time remaining · a
  solid progress bar. Then **three columns of two cards each**, paired so the columns finish within ~60px
  of each other: her month + last month's payslip · her leave + the holidays ahead · what is waiting on
  her (HR requests, then the colleagues asking her to cover).
- **No gradients.** The one that existed drew the day's progress `present -> accent`, asserting a
  relationship between two unrelated semantic tokens; it broke visibly the moment the palette moved. Every
  bar on the canvas is now a single token colour.
- **Home does not punch her in.** The clock-in / on-duty / partial-day controls live on EMP-02 beside the
  record they write to (Amendment E); Home reports today's punch and links there. The EMP-01 row above
  that still lists "Punch in / out · hero card primary" is superseded by this.
- **Payslip stays amount-free.** Home is read over a shoulder in a staffroom: the card carries paid /
  when / which account and links to EMP-07 for every figure.
- **Cover asks and HR requests now read alike** — both are "waiting on you", so both are hairline rows
  with a status mark rather than one list and one stack of filled amber blocks.
- **One roster of names.** `pages/leave.jsx`'s cover list kept its own Latin names, so a Hindi Home showed
  "Karan Mehta" beside Devanagari copy; names now resolve through `leaveflow.jsx`'s roster and the screen
  is one language at a time again.

### Amendment G — DH-01 Department home, ranked the same way (2026-09-23)
- **Ruling (user):** give the head of department's home the treatment EMP-01 got.
- **The composition:** a plain head (who she is, which department, what day, with the scope chip still on
  the screen per O7); then **Today in Science**, full width — in class · late · absent · on leave, each
  naming the person, over one bar of the whole roll drawn as four solid segments; then a slim **other
  queues** strip; then three columns of two — what is waiting on her decision (the actual requests, with
  dates, how long each has waited and the one whose cover was declined) · who is away and who is holding
  their classes, plus the month so far · her own leave and the papers coming due.
- **A queue tile is not a queue.** The four hero tiles are gone: a "6" told her the size of the job but not
  whether to open it now. The names, dates and blocked-cover flag do.
- **One honest note, not three.** Regularisation / reimbursement / appraisal review each printed the same
  "built in a later wave" sentence; they now share one line under the strip.
- **One roster of names.** `pages/depthead.jsx`'s STAFF carried its own Latin names, so a Hindi DH-01/DH-03
  printed "Karan Mehta" beside Devanagari copy, and one person was "Divya Kapoor" here and "Divya Kamath"
  in the shared queue. Names now come from `leaveflow.jsx` for every DH screen; the avatar tint still
  hashes the Latin name, so a person keeps one colour in both languages.

### Amendment H — Expiring documents leave DH-01; "today" becomes the roll; birthdays arrive (2026-09-23)
- **Ruling (user):** *"I don't want the expiring-in-your-department section — a dept head doesn't have the
  privilege to see it, only HR can."* The card, its data and its words are removed from DH-01.
  - **This supersedes a row in this document.** DH-01's Actions table still carries **"Acknowledge an
    expiry alert · Dept Head (dept)"**, and M14 §Business rules (expiry alerts) is written without a role
    boundary. Both need alfred's pass: the alert belongs to HR (`documents.manage` / `documents.verify`),
    and a head of department holds no `documents.read` over her team. Recorded rather than quietly
    reconciled.
- **Ruling (user):** the "Today in Science" band was not understandable. It counted "in class 5" while
  separately naming one person as late — the reader had to work out that the late teacher was inside that
  5 — over a bar with no labels. It is replaced by **"Who is in today": the roll itself**, seven people,
  each with the time they arrived and what the record says, sorted so the two who need her come first, and
  one plain sentence above it ("5 of 7 in school · 1 arrived late · 1 not in · 1 on leave").
- **"August so far" moves into that card.** It was a month summary stranded at the foot of a column; it is
  the same subject as today's roll, so it is now a footer strip on the same card — figure, word, and the
  note that it is counted from the same day-by-day record DH-03 draws.
- **New: birthdays and work anniversaries.** One card, drawn from the shared roster in `leaveflow.jsx`,
  mounted twice — a column card on DH-01 (her department) and a quiet band at the foot of EMP-01 (her
  colleagues). **Day and month only: no birth year is held on the roster at all**, so nothing on any screen
  lets a colleague work out somebody's age. A joining date is carried in full, because the anniversary
  ("4 years at the school") *is* the fact being celebrated.

### Amendment I — DH-01's roll becomes a chart plus the people who need her (2026-09-23)
- **Ruling (user):** the seven-person roll was *"too cluttered, no room for reading properly"*; use small
  charts for the infographics.
- **The card answers in three blocks across one row:** the **shape** — a segmented donut of the roll
  (present · late · absent · missing a punch · on leave) with "5/7 in school" inside it and a legend under
  it naming every slice; then the roll as **two equal lists**, "Needs you today" and "Everyone else",
  drawn with exactly the same row (avatar, name, designation, arrival time, state in words).
  - A first pass made the second list a stripped-down line of names and times. The designer rejected it:
    they are the same kind of fact — a person, when they arrived, what the record says — so they get the
    same treatment, and only the heading separates them.
  - The donut is sized to the lists beside it (176px, 22px ring) so the block has no dead air under it.
- **Chart fills are their own tokens** (`presentChart` / `lateChart` / `absentChart` / `leaveChart` /
  `missingChart`, both palettes, light and dark). The state tokens are tuned for text and tints, and at
  chart scale they go muddy against each other; these are the same hues lifted for fill.
- **`SegmentDonut` is a kit component** (`design/v3/kit.jsx`), not a page one: PR-01, DR-01 and the HR
  dashboards all want a whole-divided-into-parts chart. The rule it carries: the figure sits inside the
  ring and the legend spells out every slice in words — **a donut with four slices and no legend is
  decoration**, and colour alone never states a fact (§ "never state by colour alone").

### Amendment J — PR-01 Campus home ranked; birthdays become a box; holidays reach every home (2026-09-24)
- **Ruling (user):** the birthdays section on EMP-01 should be **a box like the other bento boxes**, not a
  band across the foot of the page. It now sits under the August calendar, and the payslip card moves to
  the third column so the three columns still finish together.
- **Ruling (user):** the **holidays box belongs on DH-01 too**. `screens.jsx` exports the one card
  (`window.NaveyaHolidays.Card`, with an `onOpen` so each role lands on its own attendance screen); the
  head of department's home and the principal's home both mount it. One school calendar, three homes.
- **Ruling (user):** PR-01 carried **too much bulk to read at a glance**; give it DH-01's treatment.
  - The **dark welcome slab is gone** (as on EMP-01 and DH-01). The one figure it carried — 89 confirmed
    present — is now the middle of the campus donut, where the rest of the roll stands beside it.
  - "Today's shape, by department" listed all seven departments with up to five wrapping status chips
    each. It is replaced by **"The campus today"**: the campus as one segmented donut, then the
    **departments that need her** (a class with no substitute; the wing whose readers stopped reporting),
    then the ones **running themselves** as name + present-of-total. Headcount folds into that card's
    footer, since it is the denominator behind every figure above it.
  - The queue tile row becomes **"Escalated to you"** — the actual requests, three of them, with names,
    dates and flags — plus a compact "Other queues" card, exactly as DH-01 does.
  - The **exam-blackout banner and its preview toggle leave the page**: an upcoming window that changes
    who signs is a line at the foot of the card that carries those decisions, not a strip across the top.
    The live-blackout preview still lives on PR-03, where the override happens.
- **One language at a time, again:** `pages/principal.jsx` held Latin names for the six staff on leave and
  the overdue child-safety row, so a Hindi campus home printed them beside Devanagari copy. They are
  string keys now (`pr.n.*`), like every other word on the screen.

### Amendment K — Queues that lead nowhere leave the homes; PR-01 gets its own card (2026-09-24)
- **Ruling (user):** remove the **"Other queues"** box from DH-01 and PR-01. Regularisation, reimbursement,
  appraisal review, requisitions, renewals and appraisal moderation all opened a placeholder; a card whose
  every row lands on "not built yet" is a card about the roadmap, not about the person reading it.
- **Ruling (user): reimbursement is HR's.** The dept head's reimbursement queue is gone with that box.
  (The employee's own claims stay on EMP-12/13 — submitting a claim is hers; deciding it is not her head
  of department's.) **This supersedes** DH-01's "Open an approval queue → DH-07" action row in this
  document and the DH-07 entry's Dept-Head approver; both need alfred's pass.
- **Ruling (user): nothing on a dashboard assigns a substitute**, because no screen in the product does.
  "N classes have no substitute arranged yet" is gone from PR-01, and the **uncovered-classes column**
  goes from PR-02's department matrix. What stays is cover inside a LEAVE REQUEST — the applicant names a
  colleague when applying and a declined cover blocks approval (Amendment E) — because that is modelled
  behaviour, not a dashboard nag.
- **Ruling (user): PR-01's campus card must not be DH-01's.** A head of department reads a roll of seven; a
  principal cannot read 118, and the individual name is her heads' business. "The campus this week" now
  carries four figures (in school today · away today · no reading yet · five-day average), then **the last
  five school days as rows showing who was NOT in** — a vertical chart of "in school" was five identical
  full-height bars, since the range was 108–113 of 118 — and **the departments thinner than the campus
  today**, compared on CONFIRMED absence so one wing's dead readers cannot make every other department
  look fine. Headcount sits in the footer as the denominator.
- **Ruling (user):** "Escalated to you" is renamed **"Leave approvals"**.
- **Ruling (user): "Expiries needing attention" is removed** — the principal has no screen where she acts
  on an expiring document; that queue is HR's (HR-09/HR-12). It is replaced by **"What you have decided"**,
  the last few requests she signed, read from the shared queue, marking the ones that have gone on to the
  director rather than calling them settled. **This supersedes** PR-01's "Acknowledge an expiry alert"
  action row (the same conflict Amendment H raised for DH-01).
- **CTA height:** the leave decision controls (DH-02, PR-03, DR-02) were `size="lg"` — 50px against the
  40px every other primary on the canvas uses. A decision is not a different KIND of button; all three
  screens draw one control from `leaveflow.jsx`, and it now matches.

### Amendment L — PR-02 names the people; DR-01 is four things, attendance among them (2026-09-24)
- **Ruling (user): the campus attendance board must name employees.** PR-02 was five cards telling one
  story — a status bar chart, a "hot spots" ranking, a shift-coverage list, a department matrix and a
  ten-day trend — and after crossing the page four times a principal still could not say WHO was missing.
  It is now: **the day in one strip** (present · late · absent · on leave · no reading, with the ten-day
  absence trend beside it, same subject); **the departments as one selectable list**, each with its roll
  drawn as proportions and its out-share; and **the people** behind whichever department is selected —
  name, designation, arrival time, state in words.
  - The per-person list is the source: `EXCEPTIONS` names every absence, late arrival and leave on the
    campus today, and **each department's counts are derived from it**, so a name and a number cannot
    disagree. Science's three are the same three DH-03 draws.
  - The panel is **read-only** and says so: a correction is the department head's to approve, on her own
    screen (PR-02's own "must not contain").
  - Shift coverage and the hot-spots ranking are gone — the first duplicated the absence story at post
    level with nothing to act on, the second is what sorting the department list already does.
- **Ruling (user): the director sees four things — attendance, leave, holidays, birthdays — and nothing
  else.** DR-01 loses the funnel, the rule table, the campus-load split, the long-absence watch and the
  recently-settled list: five restatements of one queue.
  - **This reverses part of Amendment D**, which said the director's modules mirror the principal's
    *minus attendance*. DR-01 now opens with **"Attendance across the trust"**: four figures and one row
    per campus, read-only, with no drill-in — the day-by-day register stays with each principal (PR-02)
    and head of department (DH-03), and the card says so. Whether the director should also gain an
    attendance ITEM ON THE RAIL is not settled here; the rail is unchanged.
- **The shared queue now has people away TODAY** (`leaveflow.jsx`: four approved requests covering
  11 August). Every screen that asks "who is out right now" was coming back empty while the attendance
  figures said nine — a gap in the seed, not in the screens.

### Amendment M — The director is not an employee of the school (2026-09-24)
- **Ruling (user):** the director needs no Payslips and no Documents, and only basic information in
  Profile, "as he is not an employee". No salary runs through Naveya for him and the school keeps no staff
  file on him, so both rail items are **absent** — not disabled, not empty — and his self-service set is
  the profile alone.
- **Amends Amendment D again.** D said the director's modules mirror the principal's *minus attendance*;
  L gave him a read-only attendance summary on DR-01; this removes payslips and documents. His rail is now
  **Home · Leave · Profile**.
- **Profile branches on the permission, not the role name:** a person without `self.payslip.read` gets the
  basic record (who they are, the trust and its campuses, staff id, contact) plus sign-in and security.
  The identifier vault (PAN · Aadhaar · UAN · ESIC · salary account), the document holdings register and
  the consent ledger are **payroll and staff-file facts** — absent for somebody who has neither, rather
  than rendered empty. The card says so in a line rather than leaving the gap to be guessed at.
- The canvas's smoke lists were checking payslips and documents for the director; they now check the three
  screens he actually has.

### Amendment N — DR-03 Campuses; the board's colour coding is named; one roll for the trust (2026-09-24)
- **Ruling (user): the campus board's colour coding needs to be visible.** PR-02's proportion bars are now
  explained twice over — a **legend on the page** ("what the colours mean": present · late · absent ·
  on leave · awaiting sync) and a **tooltip per row**, on hover *and* on focus, giving that department's
  numbers in words. The bars themselves are longer (210px).
- **Ruling (user): the absence rate was wasted space and unreadable.** Ten unlabelled stubs in a wide empty
  row, with no axis, no scale and no statement of what they measured. It now reads as a sentence first —
  **5.9% today · 0.7 points above the ten-day average · 5.2% average over ten school days** — with the bars
  beside it carrying the shape, an axis line, end labels ("ten school days ago" → "today") and today's bar
  in the accent.
- **New: DR-03 Campuses (`drCampus`)** — the director's own campus view, because he has two schools and
  PR-02 is scoped to one. A campus picker carrying each campus's headline figure, then that campus's day
  strip, department list and the people behind the selected department. **Read-only, and it says so**:
  regularising a day is the department head's decision. `dir.campus.read` is added to the role.
- **One roll for the whole trust: `design/v3/campus.jsx`.** PR-01, PR-02, DR-01 and DR-03 were carrying
  their own copies of today's attendance and had already drifted (the campus board named one teacher on
  leave while the department register named another). The new file owns the campuses, their departments
  and today's exceptions; **every count is derived from the named people**, and the second campus
  (Whitefield, 74 staff) exists there rather than as a hardcoded pair of totals on DR-01.

### Amendment O — The colour key moves to the table it decodes; the trend becomes a line (2026-09-24)
- **Ruling (user):** the colour key belongs **inside "Departments today"**, beside the bars it explains,
  not two cards away under a figure about something else. It now sits under that card's header, and the
  per-row tooltip stays.
- **Ruling (user):** the absence-rate chart was "too stiff… no proper information and layout". Ten equal
  grey blocks said nothing about the shape of a fortnight. It is now **a line**: an area under it, the
  ten-day average as a dashed line to be above or below, today as the single marked point, and the
  numbers stated on both sides — today's rate with its distance from the average and what it counts
  ("4 unexplained absences of 101 records read today"), and the average with the range it moved through.
- **The rate is COMPUTED, not typed.** It used to read 5.9% beside a strip saying four people were absent:
  two numbers about one morning that did not agree. `absenceRateOf` counts it — **unexplained absences
  over the roll that actually reported** — so approved leave (planned) and unread records (unknown) are
  both outside it, and a dead gate reader can never look like a staffing crisis.
- **"Departments today" is wider** (bars 260px, card basis 620px) and the people panel narrower.
- **Ruling (user):** DR-01's attendance card carries the same colour key, and the section is renamed
  **"Attendance across the school"**. Its campus rows now draw the shared `RollBar`, so the director's
  home, the campus board and DR-03 use one bar, one key and one tooltip.

### Amendment P — HR gets a home; the employee record is the record, and HR edits it outright (2026-09-25)
- **HR-01 is a home screen, not a table.** It was the only role whose landing page opened straight into a
  ten-row queue with no sense of the size of the day. It now carries the shape every other home has: a
  plain head, one full-width **"What is waiting on you"** card (lines waiting · past their SLA · joined
  this week · left this week, plus a named "Where to start" row of the three most urgent queues), then the
  work queue beside **People moving this week**, **Holidays ahead** and **Birthdays and anniversaries** —
  the last two shared with the other homes rather than re-invented.
- **HR-03 loses "the rest of her file".** Four links to other modules under the identity header turned a
  record screen into a navigation bar. A record screen is the record.
- **Personal (HR-04): three cards removed, one added.** "How these are protected", "Opened while you have
  been here" and "Pay is not here" were the screen talking about itself — a paragraph on masking, an
  empty log, and a denial. In their place the tab carries **Her pay** (pay group, cycle, contracted
  monthly gross, the account it is credited to, last credited) as a band under the two lists, with the
  line that payslips, arrears and Form 16 remain the payroll run's. The six non-PII identity facts are a
  grid, not six full-width rows.
- **HR is sole responsible: there is no second approver on this record.** *This supersedes A9 for the
  HR-owned record.* `ReasonDialog`'s "send for a second approval" is gone; every block — personal
  details, statutory numbers, the salary account, her pay, and now each document — is edited in place
  through one `EditDialog`. The change is saved, stamped with the editor's name and the reason typed
  beside it, and **the earlier value stays on the record**. That is the audit; it is not a queue.
- **The edit dialog never pre-fills a PII value.** The box starts EMPTY and the current value is shown
  **masked** beside its label ("Now XXXXXX000A"); only boxes actually typed into change, so a phone
  correction cannot blank an address. Pre-filling would have printed a full PAN and a full account number
  into the DOM with nobody having asked for them — rule 1 of this screen, broken by a convenience.
- **Contract (HR-05): the vacation-flag explanation becomes a tooltip on the flag.** A 420px column of
  prose explained one row of the card beside it; it is now a `Tip` on that row, reaching the person
  looking at the thing it explains. The freed column carries what the tab was silently sending people
  elsewhere for: **What she does** (designation, subjects, department and campus, who she reports to,
  what else she carries, weekly load, what her account can see) and **How she came in** (offer, joining,
  induction, account, probation — five dated steps). "Changing this contract" moved under the contract it
  acts on.
- **Service book (HR-06): rearranged, nothing removed.** The computed span, the break check and the
  gratuity date are three figures in a band with the two actions (Add an entry · Download) in its header;
  the rule about entries being added and never edited is the timeline's own footer; the timeline then
  gets the full width, with the recorder's name moved to a right-hand column.
- **Documents (HR-07): the checklist becomes rows.** "What her category must hold" listed the same nine
  types the register listed, with the same status chips — the only fact it added was the one required
  type with nothing behind it. A required type the file does not hold is now **a row that says
  "Not on record"**, the four counts are a band across the top (on record · need attention · not on
  record · asked from her, each counted from the same arrays the tables draw), and the freed column goes
  back to the tables.
- **"Pick a document" was a permanently empty card holding a column open.** The detail is now a
  **SideScreen** over the row, carrying the same facts, the same history and the same actions — plus
  **Edit the details** (document number, issued date, valid-until), the in-place document edit the
  designer asked for. Every row's ⋯ menu carries the same edit.

### Amendment Q — One document module; the record becomes actionable; a person can be added (2026-09-25)

**Doc control absorbs Compliance (HR-09 + HR-10/11/12 → one module).** Two rail items owned the same
objects — a document, the request that fetched it, the check that accepted it, the date it lapses — so
"where are the expired certificates?" was a coin toss, and both modules drew the same *waiting to be
checked* list, differently. One module, four tabs, in the order the work happens: **Requests → Verify
responses → Expiry watchlist → Child-safety board.** HR-09's request queue is now a panel
(`Pages3.DocRequests`) mounted by the merged shell; its old "to verify" lane is gone and hands over to
tab 2 with a counted line. `hrCompliance` still resolves to the same module so saved links survive; there
is no second rail item.

**Add an employee (new — HR-02a, `hrAdd`).** Two buttons said "Add an employee" and neither did anything:
the register could be read, filtered and exported, but nobody could be put on it. The new screen is the
shortest form that makes a real record — person · job · contract · pay · numbers and papers — with a live
"what will be created" summary, the consequences written before the button, and a done state that offers
the record, the document requests and "add another". Statutory numbers are **optional** (a support-staff
joiner with no PAN is a legitimate record); what she has not brought becomes a document request instead of
a blocked form. HR never uploads on her behalf (M4).

**Exit is a real flow (HR-02).** "Initiate exit" was the only lifecycle action in the product that did
nothing when chosen. It now asks for the last working day, the reason and how notice is handled, states
what happens next (service-book entry, paid days to the last day, F&F opened, access ends), and the
register shows the consequence: the person moves to **On notice** with their last day against their name.
It carries the danger tone in the menu, as does **Cancel the request** in Doc control and on the record —
the two other destructive items; never colour alone, the words still carry the meaning.

**The employee record, second pass.**
- **No side panel on the documents table.** Clicking a row threw a side screen over the register; every
  row action now lives in the row's own ⋯ menu like every other register, and the one thing a menu cannot
  hold — the document's history and where the copy came from — opens as a dialog.
- **A real upload.** "Put a copy on record" asked for a file *name* in a text box. The kit grew a
  `FileField` (promoted out of `emp-tasks.jsx`, which had the only one) and the dialog now takes a file.
- **The alerts band is document-specific**: renamed "{n} documents need attention", and its two buttons
  removed — the Documents tab is one click below and carries the same two actions in its own header.
- **No period counts anywhere.** "Weekly teaching load — 26 periods" implied a timetable Naveya has never
  held; the row is gone, and the leave-cover copy now says "your classes" rather than "your six periods".
  A figure no system maintains is worse than no figure.

**One person, one set of facts (`design/v3/person.jsx`).** HR-03 and EMP-09 each held their own copy of
Ananya Rao and had drifted: HR had `…@example.edu`, her own profile showed `…@example.com`, and her salary
account was masked two different ways. Both screens now read the shared record. **Ruling (user): "the same
info should be seen by the employee which is on HR — nothing should be ghost info."** Her profile also
gained the two cards HR had and she did not — **Your contract** (terms + what she is on the roll to do) and
**Your pay** (group, cycle, contracted gross, account, last credited) — read-only, with the same
"ask the office" affordance; the month's payslip stays payroll's.

### Amendment R — The office holds the keys; a decision is a screen, not a column (2026-09-25)

**Staff logins (new — HR-38, `hrLogins`).** *Ruling (user): "HR has to manage the login credentials for the
employees as well… employees can't change it, only HR can manage the staff login credentials."* Every staff
account on both campuses in one register: who signs in with what, the account's state (Active · Invited,
not signed in · Locked · No login), last sign-in, and when the password was set and by whom. Actions: set a
new password (generated or typed), invite / resend, force a change at next sign-in, sign out every device,
lock and unlock. **A password is shown exactly once, at the moment it is set, and never again** — nothing
in the product can display an existing one. Every action is written against the actor's name; HR is sole
responsible, so the audit is the control. An exited person keeps a record and loses a login.

**EMP-09 loses "Change password"** and says who to ask instead; the card's owner mark moved from *You
change this* to *HR keeps this*, with the one thing that is still hers — signing her own devices out —
labelled as hers. The one-time-code number was drawn as a figure on its own line; it is a fact about an
account, not a metric, so it is a label and a value on one line at caption scale.

**The rail is two lists and now looks like it.** An operator's rail runs the school's work and then that
person's own leave, payslips and profile, with nothing between them — "Leave admin" and "Leave" sat four
pixels apart meaning entirely different things. A hairline and a heading (**Yours** / **आपका**) separate
the groups, and the rail scrolls rather than crushing when a role carries many items.

**Doc control · Requests — the two dead buttons now work.**
- **Raise requests in bulk** is built around the count: choose the paper, the campus, the department and
  the staff category, and the dialog says **how many people it will ask** before it can be sent, including
  how many are skipped because they already hold a current copy. (Asking 180 teachers for a certificate 60
  of them have already sent is how a school stops answering.) The count is derived from the staff register,
  so the preview and the result cannot disagree.
- **Extend the due date** takes a later date only — moving one earlier would make somebody late without
  warning — and the row then shows the new date with *moved from {old}* under it. **Send a reminder** and
  **Withdraw the request** are wired the same way, one reminder a day, and a withdrawn request leaves the
  table but stays on the file.
- Fixed while wiring: this file keeps dates as `[dd, mm, yyyy]` while a date input speaks ISO, so every
  later date was being called "not later". Converted at the edge.

**Verify responses — the queue is the page; the decision opens over it.** *Ruling (user): "only show the
table Awaiting your decision, and when the user clicks on the action then open the related details and
fields."* The permanent right-hand panel is gone; the register is full width, and choosing a row opens a
**SideScreen** carrying the file, what the employee wrote, what is already on record, the expiry that must
be typed before Verify is possible, and the two decisions. The row menu no longer offers "verify" — that
would invite accepting a document nobody had opened, which is what this screen exists to prevent. Also
fixed: `hrc3.v.who.*` was never authored, so every "requested by / verified by" on the screen printed a raw
key.

### Amendment S — An exit is not a single moment (2026-09-28)

**Changing a notice that is already running (HR-02).** *Case raised by the user: the notice gets extended
and there was nowhere to do it.* "Initiate exit" was the only exit control in the product, so once somebody
was on notice their last working day was frozen — and that date is what paid days, the full & final
settlement and the sign-in cut-off are all computed from. A stale one is not cosmetic.

A person **On notice** now carries two more actions:
- **Change the last working day** — later (notice extended: she stays on the roll, keeps her sign-in, is
  paid to the new date) or earlier (released sooner, which **warns** rather than refuses, because schools do
  release people early and pay in lieu is settled in the F&F). Both need a reason from a named list *and* a
  line of prose; the dialog states what moves with the date (paid days · the settlement, recomputed and
  open until approved · access end · leave taken between the two dates), and the row then reads
  *Last day 30 Nov 2026 · extended from 30 Sep 2026*.
- **Withdraw the exit** — she returns to the roll as though notice had not been served; the settlement that
  was opened is closed unpaid. **Both the exit and its withdrawal stay on the service book** — nothing is
  deleted, which is the same rule the record screen follows for corrections.

"Initiate exit" now explains its own disabled state properly: *an exit is already running — change the last
working day, or withdraw it*, and separately *this person has already left*.

**Exited people are data, not an absence.** They were reachable only through the "Include exited staff"
switch, and the row then said "Permanent / Exited" with no leaving date anywhere on the screen. **"Left the
school" is now a value of the Employment-type filter** (choosing it shows exactly the people who have gone),
an exited row's employment cell reads *Left 30 Jun 2025 · Resigned*, and its contract-end cell says **Closed
on exit** instead of "Ongoing".

### Amendment T — Every table row opens; the leave module is rebuilt around its queue (2026-09-28)

**Doc control: the rows are clickable.** *Reported by the user.* Three of the four tabs had registers whose
rows did nothing — the actions lived in a ⋯ menu, so the table looked broken. The request queue's row now
selects that request, and Verify responses, the Expiry watchlist and the Child-safety board open the row in
a side screen (a new shared `ItemSheet`: the facts, plus the same actions the menu carries, as buttons).

**HR-26…HR-30 — the leave and attendance module, rebuilt.** *Ruling (user): too much information; make it
scannable, minimal, properly spaced; no solid filled background boxes; every action in a modal; Requests is
the default screen; add the actions that are HR's; redesign shifts and rosters, which was hard to
understand.*

- **No solid fills anywhere.** `Callout`'s tone tint, `Flash`'s green wash and the two brass `ColorCard`
  slabs are now hairline-bordered surfaces — the tone is carried by a mark and a word, not by a container.
- **Every action is a modal.** The local `Panel` used to unroll INLINE beneath the card that opened it, so
  the table you were acting on scrolled away under a form. `Panel` is now a **SideScreen**: same call sites,
  the record stays visible behind it, Escape closes. That moved nine existing forms (add a type, bulk
  credit, adjust, assign, new shift, edit timings, rebuild roster, outage, re-run) into modals at once.
- **Requests (HR-28) opens the module** and is rebuilt: three competing cards become **one band of four
  counted figures** (with the head · with the principal · with the director · past the service level), each
  a filter; six selects fold behind "Filter the queue"; the queue takes the full width and gains a
  **Sitting with** column; and the request opens in a side screen instead of living in a permanent 356px
  column.
- **HR's own actions exist at last** (HR still does not decide leave — M8 §Permissions): **Remind the
  approver** (one a day, recorded so two people cannot nudge twice), **Move the approval** (to another
  holder of `leave.approve`, with a reason that lands on the chain), **Add a note** (HR's annotation,
  visible to the employee), **Cancel on her behalf** (before it starts; the reason is the only record that
  it was her decision) and **Apply on behalf** (for staff with no phone).
- **Shifts and rosters (HR-29) was three depths on one page**: a list of shifts, then the rotating roster of
  *one particular* shift permanently below it, then that roster's gaps. Now the page answers one question —
  what shifts exist and who is on them — and **everything about one shift** (timings, its named people, its
  rotation grid, its gaps, its four actions) lives behind that shift's row in a side screen. 1,714px → 1,150px.
- **Balances (HR-27) and Exceptions (HR-30)** lost their permanent detail columns the same way: the register
  takes the page, one ledger / one exception opens over it, and nothing is open until somebody opens it.

### Amendment U — Teaching / non-teaching; a Staff attendance module; the leave module scoped by campus (2026-09-28)

**The staff type is TEACHING and NON-TEACHING, everywhere.** *Ruling (user).* "Vacation staff" was the
product's own jargon for the rule (a teacher's paid break IS the school vacation, so no earned leave
accrues). Nobody in a school office says it. Sixty-five strings across twelve files now use the words the
register, the contract and the payslip already use; the **rule is unchanged** and still explained wherever
it bites (the EL row on HR-26, the ledger's own mark, the contract tooltip).

**Staff attendance — a new module (HR-39, `hrAttendance`).** *Ruling (user): build it, with punches,
regularisation, exceptions and corrections, and move Exceptions and Shifts & rosters out of the leave
module.* Four tabs in the order a day goes wrong: **The day** (who is in, who is late, whose punch never
arrived — with Correct this record · Add a missing punch · Mark as on duty, each a modal with a required
reason and its payroll consequence stated), **Regularisations** (the employee's own account of a day the
reader got wrong: accept-and-correct or send back, with July refused because it sits inside an approved
run), **Exceptions** (HR-30, moved) and **Shifts and rosters** (HR-29, moved). The two moved tabs are
**mounted** from `hr-leaveatt.jsx`, not copied — they read that file's shift, roster and exception data.

**The leave module is leave again.** Tabs reordered and cut to three — **Requests · Balances · Leave
policy** — at `size="lg"`, because at the default scale a tab row reads as a caption and disappears into
the page above it. Other changes from the same review:
- **A campus toggle at page level.** HR sits above more than one school; the queue, the balances register
  and the policy in force all follow it, and the tab re-mounts on change so nothing carries a selection
  from one campus into another. (Indiranagar 29 requests / 14 CL ledgers · Whitefield 3 / 6.)
- **The policy tab's calls to action look like calls to action**: *Add a leave type* is primary, *Preview
  the effect* secondary beside it, and the drafted amendment's *Review and activate* is primary.
- **The loss-of-pay box is gone from Balances** — it was a second, louder telling of what the register's
  own "Short" mark already says, and it put a rupee figure at the top of a screen about days.
- **The ledger is four labelled sections** (what she holds · adjust · what changed it · what spent it),
  each under a rule, with the repeated identity note, the money callout and the per-type reconciliation
  footnotes removed.
- **Filters are open by default on Requests.** On a 29-row queue, "which of these is mine to chase" is the
  first question, not one hidden behind a link.
- **Three rungs, not four.** There is no "Head of Primary" role: leave climbs head of department →
  principal → director, and a primary section is a department with a head like any other.

### Amendment V — Overtime is approved in hours; paid days reach the record; a screen inside a screen has a way back (2026-09-28)

**Overtime approval — a fifth tab on HR-39.** *Ruling (user).* Hours are DERIVED from the punches (out,
less the shift's end, rounded down to the half hour); the claim adds what they were for, because a school
pays overtime for a reason and not for a number. HR decides in three ways — accept the hours, accept
fewer, decline — each a decision with a required line the employee reads, and each stating its
consequence before it commits. **No rate and no rupee figure appears anywhere on the tab**: what an hour
is worth lives on the salary structure, behind payroll's permission.

**"Days to fix", not "Exceptions", and no money on it.** *Ruling (user): HR has no access to loss of pay,
so remove everything number-related.* Nobody walks into an office and says "exceptions"; they say the days
that are wrong. The tab was also pricing each unreconciled day at that person's own gross ÷ 30 — a salary
figure arrived at sideways, on a screen HR reads. The headline is now **days and people**, the cost column
is gone, and the correction states its effect in paid days. Payroll prices a day; this screen fixes it.

**A modal opened from a modal is a POP-UP.** *Ruling (user).* A side screen sliding over a side screen
buries the thing the reader was looking at. Every second-level decision in the leave module is now a
centred dialog above its parent (`Panel({ pop })`), and the four double-shelled panels that rendered a
`Panel` inside a `Panel` were unwrapped.

**A screen opened inside a screen has a named way back.** *Ruling (user).* Close is not back: after a
cross-tab jump it drops the reader wherever the tab happens to sit. `SideScreen` gained an optional
`back` — a named return above the title — and every jump now carries its origin:
- Balances → a person's ledger → **Open it** on a request in "this year" → the request opens in the
  Requests tab with **"Back to {name}'s leave balance"**, which returns to her ledger, open.
- Doc control's watchlist and child-safety board → Verify responses carries **"Back to the expiry
  watchlist" / "…child-safety board"** above the panel. Picking a tab by hand clears the origin.

**The away calendar is a view, not a footer.** It sat below a 2,800px queue, which is the same as not
existing. Requests now opens on a two-view switch — **The queue** / **Who is away** — naming the calendar
where the eye already is.

**A leave type can be edited.** The policy table's menu said "Supersede this type", which is the mechanism,
not the intent. It is **Edit this type** now, and it opens real fields (days a year, carry-forward cap,
most-in-a-row, half-day, applies-to-teaching, in force from) with a required reason and the consequence
stated — it still supersedes underneath, because effective-dating is not negotiable.

**Paid days reaches the employee record (HR-03e).** *Ruling (user).* "Why does her August say 31?" is
asked at the HR counter, and the only answer lived on PY-08, a screen HR cannot open. The record grows a
fifth facet: three months behind a switch, the month drawn day by day, the five buckets that make the
figure with where each came from, and the arithmetic in one line. **Days, not money** — and the absence is
stated, per rule 4 of that screen. One link out: a day that looks wrong is put right in attendance.

**PY-08 made minimal.** The screen answered its one question three times at once — a seven-number register
row, a legend that re-counted the same seven, and a sources list that counted them a third time — beside a
column of already-settled exceptions nobody acts on. Now: the register is the **identity** (in service,
less loss of pay, is paid days), the day-code breakdown belongs to the one person opened below, the month
is one strip, and the settled-exceptions column and the two disabled controls are gone.

### Amendment W — PY-08 rebuilt around the fixing; overtime gets filters; a shift lists its people (2026-09-28)

**PY-08 is two tabs, and the first one is the work.** *Ruling (user): redesign the whole module, link it to
the record's paid-days tab, and build the fixing of days where the attendance is wrong.* The screen used
to REPORT that five days were unpaid and leave the reader to find out why somewhere else — but the why is
the job. It is now **Days to fix** (default) and **The register**.

- **The queue names four causes**, which is what a school actually sees: *no punch in* (punched out, so
  she was here, but the morning punch never arrived), *no punch out*, *hours short of the shift* (both
  punches, hours apart from what the shift asks), and *away, no leave applied* (no punch, no request, and
  the head says it was leave). Filter pills per cause, each carrying its count.
- **Every row opens a fix**, in the order a decision is actually taken: the evidence the readers hold
  (shift and hours expected, each punch or "Nothing recorded", and what the day becomes untouched) →
  the choice, each option stating what it DOES rather than what it is called → a required reason → the
  effect on that person's figure, before it commits. *Away, no leave applied* cannot become "present" —
  there is nothing to be present on the strength of — so it offers leave against a named balance, or
  loss of pay, and nothing else.
- **The queue and the register are the same five days.** `PEOPLE[].lop` and `ISSUES[].d` are checked
  against each other at load (`PY8_QUEUE_MATCHES`) and the screen says so if they ever diverge. A fix
  moves the register, the totals, the person's day grid and the letter on the day — all from one
  `figuresFor()`, so they cannot disagree.
- **Half days get a letter of their own (½).** A grid that draws a half day as present or as absent is
  lying about it.
- **Both ways to the record.** PY-08's row menu and person detail open the employee record **on its Paid
  days tab**; the facet names payroll's screen as where the figure is frozen. The canvas router carries a
  screen key and nothing else, so the facet to open is handed over once on mount (`?tab=paid` does the
  same from a URL).
- **Money still appears nowhere.** A fix is recorded in days.

**Overtime gets real filters.** One State select was the whole apparatus on the tab where HR most needs to
narrow: overtime arrives in bursts from one department, and is judged by SIZE as much as by state — a
two-hour claim and a six-hour claim are different conversations. Four controls — who (name or claim
number), department (only those that actually claim), state, how long — with a live count and a clear.

**Days to fix loses its two standing banners.** The "August is with the checker" lock and the reader-outage
notice were explanations parked above the work. The lock is already said on every locked row; the outage
is a row in the register with its own detail. *A banner that never changes stops being read.* The register
inside the tab is called **Days to fix** now too, instead of contradicting its own tab.

**A shift lists its people as a table.** "Who is on it" was a wrapped run of names separated by
interpuncts — nine people ran together into one paragraph. It is a table: avatar, name, what they teach or
do, department; and it says how many more are on it elsewhere rather than silently truncating. `Avatar`
was promoted into `kit.jsx` (six files had carried their own copy).

**The shift footer has a rank, and a red way out.** Four identical secondary buttons became: **Assign
staff to this shift** (primary) · **Change the timings** (secondary) · rebuild the roster where it applies
· and **Close** in the danger colour but *not* the danger weight — outlined, never filled, because a
filled red button is what this product uses for a thing that cannot be undone and closing a panel undoes
nothing.

**Assigning is a dropdown.** A wall of nine checkbox pills is a list pretending to be a control. It picks
one person at a time from a select, lists who has been chosen with their avatar and department, and each
one is removable.

**"Add a leave type" wears a plus.** It had a TICK, which is the glyph for a thing already done.

### Amendment X — The helpdesk becomes a conversation; paid days can be traced (2026-09-29)

**The helpdesk is rebuilt around communicating, not ticketing.** *Ruling (user): "the main aspect of this
module is just to let HR communicate with requests raised from depthead or employees and sort them, so
keep things simple... i dont need too much information."* What was there was a corporate service desk — an
SLA clock on every row, a breach banner, escalation, business-vs-calendar-hours config, priority, assignee
and age as their own columns, bulk-select checkboxes, and the thread squeezed into the right third of the
page. A teacher asking why her August payslip is short is not a P2 incident.

- **The sort is "whose move is it":** *Waiting on you · Waiting on them · Answered*, derived from
  `status` + `awaitingRaiser`, which the data already carried. That is the question HR opens the screen
  with; SLA state never was.
- **Urgency is said in days, not in SLA.** Nought or one day is calm, two shows a clock, four shows an
  alert. A thing left five days is late because five days is a long time to leave a colleague without an
  answer — not because a number was breached. The promise still lives in the categories config; the queue
  stops shouting it.
- **Four columns:** who asked (avatar, name, role) · what about (subject, category, *Urgent* and
  *Restricted* marks) · last word (who spoke last, when) · where it is. Priority, assignee, age and SLA
  fold into the two lines they belong on. Select-checkboxes and the bulk bar are gone: a grievance is not
  bulk-actionable and neither is anything else here.
- **The conversation opens OVER the list** — the house rule the rest of v3 follows, and the fix for a
  thread in a third of the width. It now opens with **the message the person actually sent**; the old
  thread began with HR replying to nothing, which is a log, not a conversation. Internal notes carry
  "Only HR sees this". Two plain toggles replace the SLA-pause machinery: *keep it internal* and *I need
  something back from {name}* — the second is what moves it to Waiting on them.
- **Four ranked actions:** Send the reply (primary) · Mark it answered · Pass it to someone · Close, in
  the danger colour but not the danger weight.
- **HR-33 leaves the top level.** "What staff can raise" is a side screen off the header: the list a
  teacher picks from, who each choice reaches, how quickly the school promised, and how many are open.
  Routing config is not the work, so it does not get half the module's navigation. *Scope note: the SLA
  hours and the owner survive as configuration; the escalation threshold, the business-vs-calendar basis
  and the version/provenance columns are no longer rendered in HR's face — they remain data.*

**PY-08: "Trace the days" is a real screen.** It used to highlight a row and nothing else. Trace means
naming the days: which dates came from the readers, which from a leave request with its number and
approver, which from the school calendar, which from the roster — printed as runs (`3–8, 11–14`), not as a
wall of commas — and then **the days a person decided**, each with its cause, the reason in their own
words, and who took it. Anything still unaccounted for is listed with a pointer to the queue. It is the
answer to "prove it", which is the only question a paid-days figure ever gets asked.

**PY-08 gets a named way back.** The route in from Days to fix carries where it came from, and the screen
offers "Back to staff attendance" above its title.

**"Send to HR for correction" is gone from PY-08.** *Ruling (user): it already exists on the HR
dashboard.* A second route that only sends a message is a second inbox to forget; HR's own Days to fix is
where that work lives.

**"Open paid days" moves out of the table footer.** *Ruling (user): "at very bottom of the table which is
not visible and has no visual impact".* It is a secondary button on the headline card that already says
the sentence making the route make sense — paid days are made of these.

### Amendment Y — One place where days get fixed; the record grows an appraisal (2026-09-29)

**PY-08 gives the fixing back to HR.** *Ruling (user): "i dont see the sense of a new screen and module as
open paid days inside days to fix, bring everything outside from open paid days to days to fix tab and
make the action happen there as i dont need an internal screen which does the same work."* Correct — the
previous amendment put a fix queue on PY-08 while HR's Days to fix already had one. Two screens, one job.
A payroll officer does not correct a punch; HR does, on the screen where the punch lives.

- **Days to fix inherits the two causes it was missing**: *Hours short of the shift* (both punches
  present, hours apart from what the shift asks) and *Away, no leave applied* (no punch, no request, and
  the head says it was leave). The single-punch case now says **which** punch is missing — "in at 08:31
  and never out" and "out at 17:42 and never in" are two different conversations.
- **PY-08 keeps what is genuinely payroll's**: the register of the frozen figure, the derivation behind
  one person, the trace, and the decision about corrections that landed after the freeze. The
  unaccounted days stay **visible** there (payroll must not compute on them unknowingly) and
  **unfixable** there, with a line saying where they are put right and why.
- **"Open paid days" is gone from Days to fix.** That tab is the destination, not a waypoint.

**The record's paid-days route gets a place and a shape.** *Ruling (user).* It was a bare underlined link
at the bottom of the card, under two grey caption paragraphs — the same mistake, one screen along. It is
the card's own action, top-right, a secondary button: **Put a day right**.

**HR-03f · Appraisal — a new facet on the employee record.** *Ruling (user): "i dont see any functionality
or flow or module related to appraisals or appraisal cycle for the employees."* PAMS came into MVP with
the 2026-07 scope change and had no surface anywhere. It belongs on the record for the same reason the
service book does: it happened to *this person*, in cycles, and the office is asked about it at the
counter. Four cards:

1. **The live cycle** — the four steps (goals agreed · her own review · her head's review · signed off),
   each naming who and when, with the one it is sitting on marked and the rest greyed. The stage is
   **derived from what has actually been signed**, so the tracker cannot say a review is done when it is
   not. Overdue is counted in days. One action: **Remind her head**, a dialog stating its consequence,
   once a week, on the record.
2. **What she is measured on** — four weighted goals with what each is measured by and where it stands.
   Weights are set once a cycle; a goal that stopped making sense is closed with a note at review, never
   deleted.
3. **What has been said** — her own account and the classroom observation, quoted and attributed, plus
   the plain statement that nothing is rated until her head writes.
4. **Before this** — closed cycles, rating and outcome, append-only.

It inherits this file's rule 4: **no money**. A rating can lead to an increment; the amount is payroll's
and the absence is stated rather than left as a gap.

**Helpdesk: Urgent is gone, and the row stops being the button.** *Ruling (user): priority "cant be
defined by the request raiser".* A mark every raiser can award themselves carries no information — the
wait in days is the honest signal, and it is computed rather than claimed. Opening a conversation now
happens from an **Actions** menu on the row (open · mark answered · pass it on), not from clicking
anywhere in the row.

**Registers get a real hover.** They had none: a row you could act on looked identical to one you could
not until you pressed it. `tr.nv3-row-live:hover` tints the row and the actions cell steps one surface
further, so the menu reads as its own target. A row that does nothing stays flat, which is the honest
difference. *(The inline `background: "transparent"` had to go first — an inline style beats a stylesheet
rule, so the hover could never have fired.)*

### Amendment Z — The appraisal is a record, not a process; pay gets a history (2026-09-29)

**Appraisals happen offline; the product writes down what they decided.** *Ruling (user): design it between
HR and the head of department so only the update is shown — "there is no functionality for how they are
measured, what ratings have been given or what has been said doesn't need that much info and separate
boxes... just display what the initial post was, what they have been appraised and got promoted to and
what was said."* The previous build was a live-cycle tracker — a four-step stepper, weighted goals, a
classroom observation, a ratings history and a "remind her head" action across four cards. The
conversation happens in a room between the head of department and HR; the product's job is the outcome.

- **One card, one column, newest first.** Post today at the head; then each appraisal with the date, the
  post it moved her from and to (or *Stayed Post Graduate Teacher, Physics*), the sentence that was said,
  and who recorded it; the appointment at the foot. Append-only — superseded by the next, never rewritten.
- **"Remind her head" is gone.** A reminder about work that does not happen in this product is a reminder
  about nothing, and the head of department's dashboard has no appraisal surface to be reminded from.
- **The goals, ratings and observation cards are gone.** Nothing that described *how* the decision was
  reached survives; only what it was.

**Recording an appraisal is the one place a post and a salary move together.** *Ruling (user): "only when
adding an appraisal, update information related to job title, increase in salary, hike etc."* The dialog
takes the date, whether the post changed (and the new one), the monthly gross from now, and what was said
— then states, before it commits: her post changes everywhere it is named; the new gross goes on her
record and is picked up by the next run, priced by payroll and never paid from this screen; and the entry
is appended. Verified live: promoting her to Head of Physics at ₹1,12,000 shows "A rise of 18.1%", moves
*Post today*, and says her pay on the Personal tab has moved with it.

**Pay now has a history on the Personal tab.** *Ruling (user).* The card said what she is on today and
nothing about how she got there. Four dated lines, each naming the appraisal behind it, with the
appointment at the foot — because a pay figure with no provenance is the one number nobody can defend at
an audit.

*Reconciliation with rule 4 of `hr-record.jsx` ("salary is not on this record").* The designer has ruled
that it is, so it is — but it stays **PII, not furniture**: the pay history and each appraisal's figures
are **masked until deliberately opened**, exactly like PAN, UAN and the salary account beside them, and
opening them is stated as being on the record. The rule changes from *pay is absent* to *pay is a
revealed field*.

**The salary-account CTA gets its line back.** The caption sat beside the button, so the button had no
room and the sentence had no line length. The description now sits below it.

### Amendment AA — Reports & setup: four tabs, one appraisal, results that open over the list (2026-09-29)

*Ruling (user): one tab for appraisal based on what has just been designed; keep the other report tabs
minimal and not complex; design the internal functionality and modals.*

**Five tabs become four, and the build scaffolding leaves the labels.** Every tab was titled with its
inventory code — *Staff categories HR-08*, *Notification templates HR-34*. That is a note to whoever is
building the screen, printed on the screen; nobody in a school office knows what HR-34 is. Order is now by
what gets used: **HR reports · Appraisals · Staff categories · Notification templates**.

**The appraisal cycle machinery is gone.** *Appraisal cycles* and *Appraisal progress* were a review round
run inside the product — rating matrices, 360° sources, self/manager/peer weightings, windows, lock and
extend. Amendment Z settled that the appraisal happens in a room between the head of department and HR and
the product records the outcome. One **Appraisals** tab now, built on that record:

- Two views: **Appraised** (who, when, the post they stayed on or moved to) and **Overdue one** (nobody has
  sat down with these people in over a year — read from the last appraisal on record, so the list cannot be
  quietly cleared by a flag).
- A row opens **what was decided**: the post move, the sentence that was said, and the pay effect —
  **masked until deliberately opened**, exactly as on the employee record.
- Department filter and an export that says, in the confirmation, that pay is not in the file.

**Every solid-filled banner is gone.** Three of them — one per tab — each a standing explanation parked
above the work in a filled brass slab (banned in this system): *"1 category has no qualification norm
set"*, *"Annual Appraisal 2026–27 can't open yet"*, *"Gender and age aren't offered as breakdowns here"*.
The first two already appear on the rows they are about. The third moved into the **run dialog**, where
somebody is actually choosing a breakdown and can act on it.

**The report result stops unrolling down the page.** It was rendered under the library as stacked
breakdown tables — 1,200px of them — so picking a second report meant scrolling back past the first one's
answer. A result is a thing you read and close: it opens **over** the library with its range and scope, and
carries Download · Run it again · Close. Running one is a **dialog** taking scope and format, stating that
the range follows the academic session and is not a choice. The tab went from 2,135px to 1,100px.

**The copy stops citing the build.** *"(M5 §Business rules)"*, *"(§6.3 has no campus scope on
StaffCategory)"*, *"hr-leaveatt.jsx HR-26 encodes this"* — spec references rendered to the user, who
cannot act on any of them. Rewritten to say the same thing in the school's own words.

### Amendment AB — GA-04 Users rebuilt; "Yours" stops telling administrators they teach (2026-09-30)

**The right-hand panel goes.** *Ruling (user): the information section beside the user table is badly laid
out.* A 380px column reading "Select a user" sat permanently beside a squeezed table — the arrangement this
system already ruled against. The register is full width and **the account opens over it**.

**Every action is a pop-up.** *Ruling (user).* Assigning a role, resetting a password, switching somebody
off — none of it happens inline on the page now. Each is a dialog above the open account (a pop-up over a
side screen, per the leave-module rule), and each states what it does before it does it.

**Credentials become a real surface.** The module could reset a second factor and nothing else. A group
admin holds the keys, so **Manage their sign-in** now sets a password — generated or typed, **shown once**
with "Naveya does not store a readable copy, not for you, not for support" — and carries three switches:
make them choose their own at next sign-in, clear the second factor, sign them out on every device.

**"Awaiting your approval" becomes an Approvals tab.** *Ruling (user): rechange the logic to requests like
change password.* It was one hard-coded role grant on a card above the table. It is a queue of what other
people cannot do without a group admin — **a new password · clear a second factor · a role · access to
identifiers** — in three states:

- **Waiting on you** · **Decided** (with the reason given on each) · **Expired**.
- **Expired is a real state, not a tidy-up.** A request left a week can no longer be approved: *"approving
  a week-old request to reset a lost phone is how an account gets taken."*
- Deciding one is a dialog with a required reason that the asker reads.

**Four more dialogs**: roles (a role AT a scope, with the second-group-admin rule stated where it applies),
what they may see (identifiers and salary, granted per person and never by role), and switching an account
off (needs a named second person, and says the staff record is untouched).

---

**"Yours" stopped telling administrators they teach.** *Ruling (user): the group admin is a non-teaching
admin role — go through every module under YOURS and remove what should not be there. Same for HR.*

Every self-service screen read **one person**: Ananya Rao, Post Graduate Teacher of Physics. Right when the
employee reads her own profile and right when HR opens her record — but a Group Admin and an HR Operator
have a Profile, Documents and Requests of their own, and neither teaches anybody. They were being shown a
physics teacher's designation, subjects, class-teacher duty and the teaching-staff leave rule *as their own
facts*.

- **`person.jsx` keeps one shape and gains a second occupant.** `NaveyaPersonFor(role)` returns the teacher
  for the roles that teach and the signed-in administrator for the four that do not — same fields, same
  masking, same rules, different person. **HR-03 still reads the teacher**, because there HR is looking at
  somebody else's record and that is the point.
- What differs is only what genuinely differs: name, code, post, department, qualification, who they report
  to, what the job is — and `vacationStaff: false`, **which is a rule, not decoration**: an administrator
  accrues earned leave; a teacher whose holidays are the school vacation does not. It travels with the
  person rather than being written into a screen.
- **The identity line is built, not printed.** `identityKeyFor(role)` replaces the hard-coded "PGT, Physics
  · NAV-0142 · …" on Documents, Requests and Profile.
- **"Teaching staff: No" became "Staff type: Teaching / Non-teaching."** A yes/no question about somebody
  else's category reads as a hole in the record when the answer is no.
- **A register row names a document TYPE**, so "M.Sc. Physics degree" is "Degree certificate". The subject
  is on the certificate, not in the row label.

Verified across all six self-service roles: employee sees the PGT, deptHead the Head of Science, and HR,
Group Admin, Payroll Officer and Accountant each see themselves, non-teaching.

**A guard against a bug that shipped four times.** `design/v3/check-jsx-escapes.py` fails if a `\uXXXX`
sequence appears in JSX *text* rather than inside a string literal — where it renders as four literal
characters on the page. The 54-screen smoke cannot catch it: the page renders perfectly and simply says the
wrong thing.

### Amendment AC — The group admin stops seeing payroll, starts seeing staff; Systems made readable (2026-09-30)

**Four corrections first.** *Rulings (user).*

- **The avatar belongs beside the name.** In the open account and in role assignment it sat next to the
  *Active* chip, which reads as decoration on a status. `SideScreen` now takes an `avatar` and draws it
  beside the title — initials, never a photograph, per the standing rule.
- **One row, one hover colour.** The actions cell lifted on its own transition, so hovering a register row
  showed a second colour bleeding out of the right-hand end of it. A row is one object; it highlights as
  one (`nv3-row-live`, one background, one duration).
- **Every CTA on Profile is primary.** Six outline buttons across the personal record became primary, for
  all six dashboard roles — an outline CTA on a screen with no competing action is a weaker button for no
  reason.
- **Overview comes before Systems** in the group admin's rail. You look before you configure.

---

**The group admin cannot see the payroll run.** *Ruling (user): remove this from the group admin dashboard
and from the overview module as well.* The run is the Payroll Officer's, approved by the Accountant; a
group admin who can neither compute nor approve it should not be shown its cost as though it were a number
they own. Removed from GA-01: the payroll-cost KPI, the payroll column in the campus comparison, and the
"payroll has not been run" exception.

- **Statutory liability is deliberately kept.** It is not the run — it is what the trust owes, and a group
  admin answers for that to the trust. Flagged rather than left implicit: if the intent is that they see no
  money at all, the liability strip goes too.

**Overview gains the staff it is an overview of.** *Ruling (user): I need an option to view staff for the
campuses that are shown, with the full employee record.* A comparison of five campuses that cannot be
opened is a report, not a dashboard.

- **View staff** on any campus row opens a **side screen over the comparison** — that campus's register,
  searchable, filterable by staff type (teaching / non-teaching), showing post, department and state.
- A row opens the **full record as a pop-up over the side screen** (the leave-module rule: a modal from a
  side screen is a centred pop-up, never a second side screen).
- The record is **read-only, and identifiers and pay are masked**. A group admin reaches the register to
  know who is where — not to edit somebody else's employment, which is HR's, and not to read their PAN,
  which is granted per person and logged when revealed.

---

**Systems redesigned.** *Ruling (user): redesign this full module, right now it is complex to understand —
decide what tabs to keep and show minimal information.*

- **Six tabs became five, and one was a duplicate.** *Reports* repeated Reports & setup and is gone.
  **Calendar moved to second position**, because defining the year is the thing that is done first and
  read all year. Order: Organisation · Calendar · Roles & policy · Connections · Data protection.
- **Connections and Data protection were kept as they are.** Both are already one card per fact; there was
  nothing to slim without losing the fact. Stated plainly rather than implied by silence.

**Organisation, made readable.** *Ruling (user): show information in a more readable way with proper
layouting.* Two hand-built flex tables, each with a block of detail unrolled beneath every row — a wrap of
department chips under each campus, five registration numbers plus a campus list under each legal entity.
**1,603px to read eight facts.**

- Two four-column registers now: campus · employer of record · people (with department count) · actions;
  and employer · campuses it employs · registrations · actions. **1,200px.**
- Everything that was unrolled is in the row's own **pop-up** — the campus's departments with what a
  department *is* ("where a head of department approves leave and reads attendance — moving one moves those
  duties with it"), and the entity's five numbers with **12A shown as missing in words**, not as a blank.
- **The copy stopped citing the build.** `M1 §6.1`, `GA-04`, `§4.4 LegalEntity` were being quoted at a
  reader who cannot act on a section number. "Versioned, immutable, effective-dated (§4.4)" became "Dated,
  and never edited once used. Every payroll run pins the version in force that month and keeps it, so
  re-opening an old month still computes on the rules it was run under."

**Roles read in words.** *Ruling (user): show information which can be better understood.* The column said
**"3 permissions"** — a number that tells a reader deciding whether to grant a role precisely nothing.

- It now says **what the role reaches**: "The whole group, every setting, and who else can get in" · "One
  campus — its attendance, its leave escalations, its people" · "Their own record, and nothing else."
- **"1 people" and "0 people" are fixed** — singular, and "Nobody yet" where a role is defined but unheld.

---

**Calendar is now the module that defines the year.** *Ruling (user): these leaves should be created and
edited, and the same shown to the other necessary dashboard users like HR — this tab is important as it
defines the leaves of the year, so make it fully functional.*

- **`design/v3/holidays.jsx` is a shared store**, loaded before every screen set. Twelve holidays in
  **three kinds, because a school's year genuinely has three**:
  - **Closed** — paid, the school is shut.
  - **Restricted** — the office is open and a person may take **two from the list** (the allowance is a
    number in the store, not a sentence in a component).
  - **Campus** — a named-campuses-only holiday, which a multi-branch group in India actually has.
- Created, edited and removed from the Calendar tab, each through a pop-up that **states the consequence
  before committing** and **warns when the date falls on a weekend** — marking a Sunday closed changes
  nothing and quietly misstates the count.
- The same store feeds the leave module and HR's calendar, so **HR reads what the group admin defined**
  rather than a second hard-coded list that drifts.

**A collision the shared store was written to end, and immediately caused.** `screens.jsx` already owned
`window.NaveyaHolidays` (as `{ Card, list }`) and loads *after* `holidays.jsx` — so the new store was
silently overwritten and the card crashed on `list.slice()`. Fixed by merging (`Object.assign`) instead of
assigning. **Lesson: a global that two files both consider theirs is not a store, it is a race — and
load order decides who wins, which is exactly the drift a store is meant to remove.**

### Amendment AD — No leave decisions, no pay, a staff journey, and confirmations on every device action (2026-09-30)

**A jump into another role's screen hands the reader that role's powers.** *Ruling (user): the group admin
can see leave approve and decline, which is not something he can do — remove this.* Nothing on GA-01 drew
those buttons. The campus row's menu carried **"Drill into this campus" → the Principal's home**, where
escalated leave sits with Approve and Decline on it. Three cross-role jumps existed in the group admin's
module; all three are gone.

- The campus menu now has **one item**: *View staff*.
- "Needs group attention" no longer routes to the accountant's liability screen or HR's document queue.
- **The rule, stated once:** a screen may name another desk's work; it may not take the reader there.

**Pay leaves the group admin entirely.** *Ruling (user): I don't need that screen or anything related to pay
shown to the group admin.* Last round kept **statutory liability** and flagged the judgement; this settles
it. The liability KPI, the liability column and the group total are gone. The third KPI is now **accounts
that can sign in**, with *how many are waiting on your approval* — a number this desk produces and clears.

**"Needs group attention" became a table of this desk's own work**, four columns (what · where · since ·
route), each row carrying **what it costs to leave it**:

- No active Principal account at Yelahanka — *escalated leave has nobody to reach.*
- A reader silent since 07:40 — *17 people show no punch; left alone the day reads as absence.*
- One person holds both sides of the payroll control — *they can approve a run they made.*
- The year has no holidays after December — *January onwards a closed day counts as a working day.*
- Two attendance tokens expire in 52 days — *punches stop arriving, silently.*

---

**View staff is a journey now, not a panel.** *Ruling (user): open a new screen with the staff register the
same as HR's, with view actions only — click actions, open the register, open a new screen with all the
related info, all view-only.* The side screen and its pop-up are replaced by **two page-level screens**:

- **The campus register** — the same nine columns HR keeps (staff ID · who · staff type · department ·
  employment · state · joined · runs until · actions), minus every column that is a control: no select
  checkbox, no exit, no raise-a-request. Find, staff type and department filter it.
- **One person's record**, in four cards: who they are · their employment · **what is on file** · how they
  get in. Read-only throughout, and it says where it IS changed ("the staff record belongs to HR").
- **What exists is not what it says.** The file card shows 12 of 12 documents and the chips read *PAN · on
  file*, *Aadhaar · on file* — the group office may know the record is complete; it may not read it.
- **The access card is the one part that IS theirs**: roles held, second factor, and "no Naveya account"
  handled as a real state ("they are on the register and paid, but they cannot sign in").

**`BackBar` — a named return at page level.** *Ruling (user): add back buttons if a new internal screen is
opened in any module of the entire dashboard.* A screen that replaces the page is not a dialog: Escape does
not close it and the rail still says where you are. So it says where back goes, in words — *"Back to the
group overview"*, *"Back to the Indiranagar register"*. Swept the whole dashboard: these two are the only
page-level internal screens that exist (every other page has one rail per exported screen), and both have
one. `SideScreen`'s existing `back` covers the panel case.

---

**The audit log's rows are the control.** *Ruling (user): make the rows clickable to show info on the right,
and fix the layouting and UX hierarchy of the detail section.*

- The per-row menu is gone — it held *Open entry* (now the row) and *Follow*, which moved into the detail
  beside the record it follows. The scope column went with it; five columns now, and the panel stopped
  squeezing the table.
- **A panel beside a register is normally wrong here** — GA-04 lost one last round. It is right in an audit
  log for one reason, worth stating: **an audit entry is not a record you act on**, it is one line in a
  sequence you are reading, and opening it must not cost you your place in that sequence. The panel sticks.
- **Hierarchy rebuilt.** It led with a field labelled "Action". It now leads with **what happened** as the
  heading, the record beneath it, then **what changed** (before struck through, after in bold) because that
  is the only reason anybody opens an audit line, then who/when/where/why as supporting facts.
- **An absent reason is a fact, not a missing row**: "None was required for this kind of change."
- **Django class names left the screen.** RoleAssignment, PayrollRun, StaffDocument, StatutoryFiling and
  LeaveRequest were being printed at a school administrator. So were "Payroll Operator @ Group (checker)"
  and the section reference §4.2.

---

**Connections: every device action states what it will do, first.** *Ruling (user): design the internal
actions with confirmation boxes, and their internal modals and screens, for all the possible actions.*

What was there fired a flash message **immediately** — trigger a pull, raise an outage, *deactivate a
device*, one click each. The confirmation string was printed **after** the fact: "Deactivate X? It stops
accepting pushes immediately" arrived as a toast once it already had.

The hand-built table is a register, and six actions each open a pop-up:

- **Open this reader** — serial, how it sends, last seen, today's count, and what its state *means*
  ("drift" explains nothing on its own).
- **Ask it for its punches now** (pull-mode only; disabled with the reason on push) — and **both outcomes
  are on the screen before the press**: against a silent reader it says the request will time out and
  nothing will change, rather than claiming success.
- **Raise an attendance outage** — states the 17 days that stop counting as absence and that paid days do
  not move while it is open. Disabled with "already raised at 07:40 today" where it is.
- **Correct its clock** — *"a reader four minutes behind decides who was late"*, and the consequence
  nobody expects: **correcting it does not re-read the days it already decided.**
- **Map it to a campus** — an unmapped reader's punches are held and counted for nobody.
- **Stop accepting its punches** (danger, reason required) — warns when it is **the only reader a campus
  has**: a warning, not a block.

**The ingestion log gained the four things a reader can send that cannot be used**, each with its own
resolution: a code nobody owns (match to a person, or discard with a reason), a day with nothing recorded
(**the incident opens as a list of people** — a number cannot be acted on), the same punch sent twice
(explained, nothing to do), and a time that cannot be right. **Discarding is append-only**: the records stay
on the log marked discarded, with the reason and the name.

Outline CTAs in the tab are primary. The build references (M9, PR-02, HR-30), "idempotent", "LOP" and the
webhook events printed as payroll_run.approved are all in plain words now.

---

**Data protection: two sections out, two rebuilt around their edge cases.** *Ruling (user): remove retention
by data class and data subject requests; keep the rest and redesign with more customised information,
thinking of all the edge cases and possible outputs.* Retention is a table of dates this desk does not set;
DSARs are a queue HR and compliance run.

**Who has been told what we hold** (was "Consent & lawful-basis register"):

- Four counts — told and accepted **531** · not yet **4** · cannot be reached **1** · withdrew **1** — and
  then only the cases that are not the ordinary one, because *"the ones who accepted need nothing from you"*.
- **Five people, three different problems.** Not-yet is a matter of time. **No phone number on record is
  not** — the action is disabled with the reason, because there is nowhere to send it.
- Asked three times already is its own state: *"a fourth message is unlikely to be the thing that works —
  somebody should ask them in person."*
- **What a withdrawal changes** is its own pop-up, in two columns: what stopped (optional messages, optional
  sharing) and **what is kept and why** (the payroll record, because the law requires the school to show
  what it paid; the filings; the audit log, which nobody can edit, including you). It ends by separating
  withdrawal from erasure — a request to erase goes to compliance, not to this desk.
- **Publishing a new notice re-asks all 537 people**, including the 531 who accepted. That is the whole cost
  of the action and it is the first line of the dialog.

**Who opened somebody's identifiers** (was "PII access log"):

- Counts: opened this month · by how many people · **with no reason given**.
- A register — who · whose record · what field · when · why — built around the three cases that deserve
  a second look: **a reveal with no reason** ("not wrong, but the one you cannot explain to anybody later"),
  **the same record opened four times in one sitting**, and **a reveal by somebody whose permission has
  since been taken away** ("taking a permission away does not undo what was already seen — which is the
  reason this list exists").
- Each row opens the full trail: the grant, who gave it and when, and whether it is still in force.
- Footer: reading your own record is not a reveal and is not listed; the list is written once and cannot be
  edited or cleared by anybody, including you.

### Amendment AE — One record screen, two readers (2026-09-30)

*Ruling (user): in the detail screen of the staff register I want the same UI as the detail screen HR looks
at for employees — keep the exact same UI, just view-only.*

**The group admin's record screen is deleted.** It was four cards built a day earlier, describing the same
object HR-03 already describes in six facets. Two screens for one object is the drift this system keeps
ruling against: the second one rots, and the day HR gains a field the group office silently does not.

**HR-03 itself now runs in a read-only mode.** Same identity header, same alerts band, same tabs — Personal
· Contract · Service book · Appraisal · Paid days · Documents — same masking, same document register, same
copy. Three things differ, and only because they must: which rail item is lit, where **back** returns to
(the campus register, named), and that every control is off.

**Off, not hidden.** The file already states the rule, about gated actions: *"a missing button teaches
nothing."* So the mode follows it — every Edit, every menu, every reveal stays exactly where HR sees it,
disabled, and the reason is said **once** in a band under the identity header rather than eighteen times:

> **You are reading this record, not keeping it.** The group office sees the whole record so it can answer
> for the register — who is where, whether the file is complete, how they sign in. HR keeps it, and HR is
> the only desk that changes it. Every control below is switched off rather than hidden, so you can see
> what would be done and by whom.

- A gated action that **already carries a reason keeps it**. "Confirm probation — she was confirmed on 12
  Apr 2025" is a fact about the contract, and the group office should read the same fact HR does. The
  read-only line appears only on the actions that would otherwise be live.
- **Opening a masked field is an act, not a way of looking at the screen** — it is written down against the
  name that did it — so the reveal controls are off too, in the Personal facet and on the appraisal's pay
  line.
- **The one figure that could not simply carry over.** Amendment AD removed everything pay-related from the
  group office; this ruling asks for HR's screen exactly. Both hold: the pay card, its layout and its
  labels are HR's, and the contracted monthly gross arrives **masked** — "Not shown here · what somebody
  is paid is the payroll desk's, and the group office answers for neither the run nor the figure."

**A kit defect this uncovered: `Button`'s `disabled` was never real.** It set `aria-disabled`, faded the
button to 55% and left `onClick` wired with a pointer cursor. Every gated action in the product has been
pressable all along — it simply had nothing attached. `Button` now sets the actual `disabled` attribute,
drops the handler and shows `not-allowed`.

**Also corrected on this screen, same defect class as Amendment AB:** the fact row and the contract facet
both read **"Teaching staff: Yes"**. A yes/no question about somebody's category reads as a hole in the
record when the answer is no. Both now say **Staff type: Teaching**.

Verified: all six facets in both languages carry no live control except the tabs, the named return and the
Paid-days month selector (which reads, it does not act) — and HR's own HR-03 is untouched, with the only
two disabled buttons being the contract's own pre-existing gates.

### Amendment AF — Hiring is a record, not a workflow (2026-10-06)

*Ruling (user): redesign the flows and internal screens. HR creates an opening; any HR puts the candidates
they shortlisted offline against it, with the stage they are at — shortlisting, resume scanning, interview,
selected. All of this happens offline and the dashboard is just to store what is happening. Requisitions do
not matter here — HR needs no approval from another HR; **every HR is a decision maker**. Two tabs: job
openings with everything related, and the hiring status of candidates.*

**A whole tab was modelling a permission that does not exist.** The module ran Requisition → budget
approval by the Principal or Group Admin → Job posting → an inbox of applications arriving from a careers
site, scored for eligibility and advanced through a seven-stage pipeline. There is no careers site, nobody
applies through Naveya, and no HR waits on another HR. **A screen that asks for permission nobody needs
teaches people to wait.** Requisitions, approvals, the published advert and its public preview are gone.

**What hiring actually is at a school this size:** somebody decides a post is needed, word goes out through
heads of department, an agency and the staffroom, CVs arrive by WhatsApp and by hand, a head of department
sits with two or three people, the Principal agrees over the phone. Naveya is in none of those rooms. So
the module is a **record of what was done**, and two design consequences follow that are not decoration:

1. **A candidate can be entered at any stage, on any past date.** The interview may have happened on
   Tuesday and the typing on Friday. "Where they are now" and "when that happened" are both fields on the
   add form, and every later step can be backdated freely. *A form that forced stage one would make people
   lie to it.*
2. **Nothing is ever sent.** No candidate is emailed, texted or called by Naveya, and every dialog says so
   in its own words, because the one dangerous belief this screen could create is that pressing *Not taken*
   tells the person. The register footer says it too: *"Naveya tells nobody anything."*

---

**Tab 1 · Openings** — what we are hiring for, and what became of it.

- Register: the post · staff type · **filled / posts** · in the running · opened · where it stands. A filter
  for open-and-on-hold, filled-and-closed, or everything — "past openings" is a view, not a second table.
- **State is counted, not typed.** *Partly filled* and *filled* are derived from how many candidates on the
  opening have joined; only the two states a person decides — **on hold** and **closed** — are stored. A
  stored "filled" flag is a field somebody sets once and forgets.
- An opening opens on a screen of its own: what it is, **who is in the running**, and a dated account of
  everything that happened to it (opened, details changed, held, reopened, somebody joined, closed and why).
- Six actions, each a pop-up stating its consequence: change the details · add a candidate · put on hold
  (reason required) · take off hold · **copy it for a new one** (the same post comes round every year) ·
  close it.
- **The consequence that matters on closing** is the people still standing against it: *"Closing the post
  does NOT decide the 3 people standing against it — each one still has to be marked not taken, or they sit
  here unanswered."* Leaving them is how somebody waits six months for an answer.
- Putting an opening on hold says the opposite out loud: *"{n} people in the running stay exactly where they
  are. Nothing moves on its own. Nobody is told — if somebody is waiting on an answer, ring them."*
- **"How many posts" is a real quantity.** Two posts means the opening stays open until both are filled, and
  the register shows 1 / 2 rather than a yes/no.

**Tab 2 · Candidates** — where each person has got to.

- The ladder the designer named: **Shortlisted → Resume checked → Interviewed → Selected**, plus **Joined**,
  which is the honest end of it because that is what fills a post.
- **"Not taken" and "withdrew" are kept apart on purpose.** *A school that loses three people to better pay
  has a different problem from one that turns three away.* Collapsing them into "rejected" loses the only
  fact worth having.
- A stage band doubles as the filter; a register carries candidate · for · where they are · since · who is
  handling. **"Waiting on you" is derived** from days with nothing recorded — never a flag anybody sets.
- One person opens on a screen of its own: where they are, about them, and **the account of what happened**
  — each line carrying the stage, the date **it happened**, who recorded it, **who was in the room**, and
  the note. Append-only: *"each line is the date the thing happened, not the day it was typed in."*
- Actions: **record what happened** (the core: stage, date, who saw them, how it went) · move to another
  opening · change their details · they withdrew · not taken.
- **Moving backwards is allowed and labelled**, not blocked: a second interview, a resume looked at again.
  Both lines stay on the record.

**Three handoffs rather than three more surfaces** — one verb, one screen:

- **Selected is a decision, not an offer.** The card says so and sends the reader to Offers: *"the post is
  not filled until they accept an offer and join."*
- **Joined** shows the staff code and sends the reader to the staff register: *"they are an employee now;
  everything about them lives on the staff record from here."*
- **A candidate whose opening was closed** gets a band on their own screen: mark them not taken, or move
  them to an opening that is still going.

**Edge cases built into the seed rather than described:** a walk-in with no resume and no email (*"perfectly
normal for a walk-in"*) · a candidate interviewed 18 days ago with nothing recorded since · an opening open
32 days · a two-post opening with one filled · somebody who withdrew for a better post · an opening closed
because the route was merged away.

**One small lie removed while in here:** the campus switch was being drawn on the two detail screens, where
it does nothing — those screens are about one post at one campus. It is now the campus, stated.

### Amendment AG — The band above a table earns its place; Offers becomes one surface with evidence (2026-10-06)

**Four figures in a row with nothing to measure them against.** *Ruling (user): the section above the
openings table is not appealing — use proper graphs, numbers and UX. Fix the same box above the candidates
table.* The band read **Open now 3 · Posts still to fill 3 · People in the running 6 · Longest open 32**.
The last one is the problem in miniature: **"longest open: 32 days" cannot be acted on, because it never
says which one.**

Each band is now one card — a picture on the left, and the thing to do about it on the right:

- **Openings** — a donut of **posts filled against posts still to fill** (the headline is the number that
  matters, and the legend carries both counts in words), then **"Open longest"**: one bar per opening,
  ranked, each clickable straight into that opening, with *"worth asking what is holding it up"* under any
  over thirty days.
- **Candidates** — the ladder as a donut whose **legend IS the filter** (one object, not a chart beside a
  separate row of buttons saying the same thing), then **"Waiting longest"**: who has had nothing recorded
  against them, by name, ranked, each a link into their record.
- **The ranking bars are capped in width** on purpose: a bar that runs the full card reads as progress to
  100%, not as "this one is longer than that one".
- The openings filter moved onto the register header, where the thing it filters is.
- `Select` gained an `ariaLabel`, because a select outside a `Field` had no accessible name.

**A tick is the glyph for a thing already done**, so "Record what happened" stopped wearing one — it is the
act of writing something down, and now wears the document glyph.

---

**Offers: four tabs become one surface.** *Ruling (user): remove the interviews tab, remove the offers tab,
remove the conversion tab, rename the candidates tab to something related to offers, and show what offers
were sent to what candidates with their statuses and the full record behind each one.*

Three of the four tabs described work that happens elsewhere: **interviews** are arranged by phone and held
in a room (Hiring already records that they happened), and **conversion** into an employee is the staff
register's job. What was left is one question — **who has an offer, and where does it stand** — so there is
one surface and **no tab bar at all: a tablist with a single tab is not a tabbed interface.**

- The register: candidate · pay a month · sent · where it stands · **their reply** · actions. States are
  *Not sent yet · Sent, waiting · They have questions · Accepted · Declined · Lapsed · Withdrawn by us* —
  "lapsed" rather than "expired", because the offer is not cancelled, it has simply stopped waiting.
- One person opens on a screen of its own carrying **the whole journey across both modules** — added to the
  system, resume checked, interviewed, selected, offer sent (and to which address), reply attached,
  accepted, joined — because "when were they added, when was the interview, when did the offer go out" is
  one question, not three screens.

**The ruling that shapes the module: Naveya cannot read a mailbox.**

An offer goes out of somebody's own email client and the answer comes back to it. So a reply is not
something the system receives — it is something HR **attaches**:

- **"Record their reply" requires two files**, and refuses to confirm without both: **the forwarded message**
  (.eml / .msg / PDF) and **a screenshot of it** as it appeared. One without the other is weaker than it
  looks — *a message alone can be retyped; a screenshot alone cannot be searched.*
- The dialog says why, in the dialog: *"the only way this record can say somebody accepted is if the message
  they sent is sitting on it — so the status changes when you attach the proof, and not before."*
- **The address is checked.** The offer records where it was sent; a reply from a different address is
  flagged and **requires a line saying how you know it is them**, because *"the only thing tying this reply
  to this person is your word."* People do answer from a work address — it is usually nothing, and the
  screen says that too rather than treating it as fraud.
- **A late acceptance is allowed and dated honestly.** If the reply arrives after the offer lapsed, the
  dialog says so and asks who agreed to honour it, *"because the date on the letter and the date they
  answered no longer agree."*
- **What we hold is its own card**, listing both files, the address they came from, and: *"attached once and
  kept. Nobody can replace or remove either file, including you — that is the point of attaching them."*
- Where nothing is attached, the card says so plainly: *"until then this offer is waiting, whatever anybody
  has been told on the phone."*

**Five more actions, each stating its consequence:** send the offer (which records that **you** sent it —
*"Naveya sends nothing — write the email and attach the letter yourself"*) · revise and send again · give
them longer · put a lapsed one back with a new date · withdraw it (*"they have not been told. An offer
taken back is a phone call, not an email."*).

**Handoffs rather than a conversion tab:** an accepted offer says *"accepting does not create a staff
record — that happens when they join"*, and a joined candidate shows the staff code with a route into the
register.

### Amendment AH — The summary band becomes a chart band (2026-10-06)

*Ruling (user): the band above the openings, candidates and offers tables has a lot of wasted space, no
visual hierarchy and no proper colour use. Redesign it, occupy the full width, and show no lists and no
names anywhere in this section — only metrics, numbers and graphs.*

Ran the `/ui-ux-pro-max` design engine over it. Two findings decided the shape:

- **Part-to-whole: a donut is the wrong primitive here.** The engine grades donut/pie **C for
  accessibility** — slices are told apart by colour alone — and names a **100% stacked bar** as the
  accessible alternative. It also fixed the space problem by itself: a 124px circle in a 1,400px card
  leaves most of the card empty, and a bar fills whatever width it is given.
- **Several KPIs side by side: use a bullet-chart grid.** The engine's "Performance vs Target (Compact)"
  entry is exactly this case, grades **AAA**, and requires *"numerical values always visible, not
  hover-only"* — which is this system's own rule that a bare figure needs something to measure it against.

**Two kit primitives**, promoted on their third independent use in one batch:

- **`StackBar`** — one bar, one segment per part, hairline gaps, and a legend underneath carrying each
  part's **count and name**; a zero part keeps its legend row and loses its segment, because "nobody at this
  stage" is a fact worth seeing. Where it makes sense the legend **is** the filter, so a chart beside a
  separate row of buttons stops being two objects doing one job.
- **`MetricCell`** — the bullet cell: label, the figure at display size, a thin bar measuring it against
  its own whole, and the denominator **in words** underneath. Laid out as
  `repeat(auto-fit, minmax(180px, 1fr))` with hairline rules between, so the row fills the card at every
  width instead of leaving a gutter.

**The lists and the names are gone.** They were a list of opening titles and a list of people's names in a
section the designer wants to carry numbers. What they were FOR — "which one has been standing longest" —
survives as metrics that say the same thing without naming anybody: **the average, the longest, and how many
are past the line.**

| Band | The whole, as a bar | The five measured figures |
|---|---|---|
| **Openings** | by state: open · partly filled · on hold · filled · closed | posts to fill (of total) · openings going (of ever opened) · people in the running (vs already decided) · **average age in days** (against the oldest) · **open past 30 days** |
| **Candidates** | by stage, and the legend filters | in the running (of ever added) · **past the interview** · average wait (against the longest) · **waiting over a fortnight** · no longer in the running |
| **Offers** | by state, and the legend filters | out with somebody · **accepted of answered, as a percentage** · average days to answer · **lapsing within 3 days** · **waiting on proof** |

**Colour had to be fixed to make the bars readable at all.** `late`, `holiday` and `ltComp` are the *same
amber* in the palette, so a stage bar built from three of them had three segments nobody could tell apart.
Each ladder now walks through five genuinely different hues and **ends on green where the good outcome is**:

- candidates: grey (shortlisted) → blue (resume checked) → amber (interviewed) → teal (selected) →
  **green (joined)**; the two ways out of the running are red and pink rather than two greys.
- openings: blue (open) → teal (partly filled) → **green (filled)**, with amber for on hold and grey for
  closed.

**Filters left the band**, onto the register header where the thing they filter is — a search box is not a
metric, and it was the last of the empty space.

**Two numbers worth having that did not exist before:** the offers band's **acceptance rate**, computed out
of the offers that actually came back rather than all of them, and **"waiting on proof"** — offers sent
with nothing attached in reply, which is the one number that says whether the evidence rule is being kept.

### Amendment AI — A categorical chart ramp, because status colours are not chart colours (2026-10-06)

*Ruling (user): use better colour coding for the bars — I don't like the dark and muted colours.*

**The palette already said this and I ignored it.** `tokens.jsx` ships a `*Chart` set with the comment
*"chart fills: the same states, lifted for a donut or a stacked bar, **where a text-tuned colour goes
muddy**"*. The bands were built from the `*Text` tokens — the darkest, text-tuned end of each role, chosen
to read as words on a tint. In a 18px bar they are the near-black mud that comment warns about.

**A chip colour and a chart fill are different things.** A chip wants a text-tuned colour on its own tint so
the word stays readable; a bar wants a fill. Each state now carries **both** — `role` for the `StatusMark`
chip, `fill` for the `StackBar` segment and the metric bar.

**A categorical ramp, named by hue rather than by meaning**, because the meaning differs per chart and the
ramp does not. Eight slots, ordered so adjacent ones differ in **hue and in lightness**, which is what makes
four segments side by side readable:

| | light | dark | mulberry |
|---|---|---|---|
| `chartBlue` | `#2F74B0` | `#6FA8D8` | `#2F6FAE` |
| `chartTeal` | `#10897A` | `#3FC2AE` | `#10897A` |
| `chartAmber` | `#D08A12` | `#E8B254` | `#C98A1E` |
| `chartPurple` | `#8E44C0` | `#C08BE6` | `#9B3F93` |
| `chartGreen` | `#2E9E5B` | `#5FC98A` | `#2E9E5B` |
| `chartRed` | `#CE3A50` | `#F0808F` | `#C0485C` |
| `chartClay` | `#C14D29` | `#E8825C` | `#782F74` |
| `chartSand` | `#A3907F` | `#C2AE9B` | `#9D8C92` |

They are **fills, never text** — which is the whole reason they are allowed to be this saturated. The
mulberry variant overrides the ramp with its own house hues, so a chart there reads as mulberry rather than
as terracotta in a different frame.

Every metric bar in the three bands uses the ramp too, so a figure and its bar carry the same colour as the
segment they came from.

### Amendment AJ — Thinner bars, and probation and contracts become one clock (2026-10-06)

*Rulings (user): reduce the height of these lines, they look a lot thicker than usual. And redesign the
lifecycle module on the same lines as hiring and offers — keep every piece of information simple, and fold
the renewal / non-renewal tab into probation & confirmation, because probation and contract are managed
from the same tab.*

**The bars are thinner.** `StackBar` 18px → **10px**, and the bullet bar under each figure 5px → **4px**. A
summary band is read at a glance; a fat bar reads as a control.

---

**Two tabs were asking the same question of the same desk.** "Probation" watched a probation end date;
"Renewals" watched a contract end date. In both: somebody is on a clock, the clock is about to run out, and
HR has to decide before it does. **They differ in what the decision is CALLED, not in the work** — confirm
or extend, renew or end. Two tabs meant checking two lists for the same deadline, and anybody on a
fixed-term contract who was *also* on probation appeared in both with two separate clocks.

**One tab: "Probation & contracts."** One register, one seed, one `clock` field. `kind` says which words
the buttons wear:

| On | Decisions | Also |
|---|---|---|
| **Probation** | Confirm them · Extend the probation | Do not confirm |
| **Fixed term / Guest** | Renew the contract | Do not renew |

- **The band is the hiring band's shape**: a stacked bar of how near the date is — past the date · due
  within a month · due this term · further off · decided, the legend filtering the list — over five measured
  figures: still to decide · **past the date** · due within a month · **no view from the head** · the
  probation/contract split.
- The register: who · on what · ends · how long · **what the head says** · actions. One person opens on a
  screen of its own — the clock, the head's view, and the dated account of everything that happened to
  their terms (joined, probation set, extended, view given, decided).

**The same honesty the hiring module established.** The head of department's view is given in a corridor or
a meeting, so there are two actions for it: **ask the head for a view** (which records that *you* asked —
*"Naveya sends no message, ring them or catch them in the staffroom"*) and **record what the head said**,
which takes who said it, when, and **their reason rather than just their verdict**. And the card says what
a recommendation is: *"advice, not a decision. Every HR here decides; nobody signs off on anybody."*

**Consequences that are the point of each dialog:**

- **Confirm** — permanent from that date; the notice period becomes the longer permanent one and the staff
  record picks that up on its own; nothing is sent, write the letter.
- **Extend** — the clock moves and **the head's view is cleared, because it was about the old date**; an
  extension must be given in writing before the first date passes; and a **second** extension is flagged as
  hard to defend later, with both on the record.
- **Renew** — **pay is not changed here**; a revision is made on the staff record where it is dated and kept.
- **Do not renew / do not confirm** — the post goes back to Hiring; full and final goes to payroll from the
  staff record; and *"somebody has to tell them, and it should not be a letter that arrives first."*

**Bulk onboarding stayed its own tab.** It is a different verb — importing a spreadsheet at the start of an
academic year — and burying it inside Onboarding would hide it at the one time of year it matters.

### Amendment AK — The figure is ink; the bar carries the judgement (2026-10-06)

*Ruling (user): the numbers are as colourful as the bar above them — I want the numbers black, not
coloured.*

`MetricCell` was tinting the figure with the same `tone` as its bar, so a band of five cells read as five
warnings and the eye had nowhere to rest. Two reasons it was wrong beyond the look:

- **A figure that changes colour as the data moves is harder to compare** against the one beside it. Six and
  four should look like the same kind of thing even when one of them is late.
- **The colour was doing a job already done twice** — by the bar underneath and by the `StatusMark` in
  words ("Decide these first"), which is where this system puts a judgement anyway.

The number is now always `c.ink`. The bar keeps the ramp colour, and anything that needs saying is said in
words beneath it.

### Amendment AL — Onboarding: a checklist split by who is holding it up (2026-10-06)

*Ruling (user): I don't understand the UI, the flow, or the visual hierarchy of the onboarding tab —
redesign the whole screen to match the proper functionality.*

**Three faults, and all three are ones this system has ruled on before.**

1. **A 380px list wedged beside a detail panel.** Joiner names wrapped to three lines in a 160px column
   while the panel beside them had room to spare. The column headed "since / due" carried neither — it said
   "joined 22 days ago" — and "open" was a four-pixel arrow.
2. **A band with no numbers.** Two cards of prose and a row of name chips sat above the work, and nothing
   on the screen said how much was outstanding or how much of it was HR's.
3. **Seven identical task rows.** The question a person opens this screen with is *"what do I have to do,
   and what am I waiting on somebody else for"* — and answering it meant reading seven owner chips one at
   a time. Overdue was stated twice (red text *and* a "Pending" chip), and the child-safety items sat in
   the middle of the list like anything else.

**Now: the band, a full-width register, and the joiner on a screen of their own.**

- **The band** is the one every module now has: a stacked bar by state (overdue · blocked · not started ·
  in progress · did not report · ready, the legend filtering the list) over five measured figures — still
  joining · **yours to do** · past their date · waiting on something else · **safeguarding not cleared**.
- **The register** is full width: joiner · joined · been here · **checklist** (n of m, with a 4px bar) ·
  state · actions. A row opens the person.
- **The joiner screen** has three cards, in the order the questions are asked:
  1. **How far along** — one line and one bar, with *"{n} still yours"* beside it, rather than seven rows
     to count.
  2. **Safeguarding** — police verification and child-protection training, **pulled out of the list
     entirely**, because they are the two nobody may skip and they should never be found by scrolling. Each
     carries "cannot be skipped" in words.
  3. **Everything else, split by who is holding it up** — *Yours to do* ("nobody else is going to do
     these"), *Waiting on somebody else* ("chase them, or hand the task to somebody who will"), and *Done*,
     struck through. That split is the screen's whole point: the owner chips were data, the grouping is an
     answer.
- **A task says its state once.** A glyph, the name, and one line beneath that is either "due 13 Aug",
  "7 days past its date", "cannot start until “Laptop & login credentials issued” is done", or "done by
  Rohit Kannan, IT on 3 Aug" — never a red line *and* a chip saying the same thing.
- **Marking a joiner ready is a pop-up with its consequence** — it closes onboarding, goes on the service
  record with your name, and *"nothing is sent; their probation clock has been running since the day they
  joined."* It stays disabled until every task that must happen has.

**Caught twice now, worth the rule:** `addStrings` is last-wins, so inserting a new key near the top of a
language block does not replace an older one further down. The stale `hrl3.tab.prob` / `hrl3.tab.ren` and
then `hrl3.ob.reg.sub` all kept winning until the old lines were deleted outright.

### Amendment DV — a correction has a date of its own (2026-10-28)

*Rulings (designer):* the side panel's **Correct this record** CTA is renamed **Correct attendance**, and the flow is redesigned so HR **chooses which day is corrected** — a record correction can be about any day in the past · **Add a missing punch** chooses its day too · add a **number of hours column** to the staff attendance table · remove **"The fortnight up to this day"** · rename **"The day, as recorded"** to the day and the date · remove the **Counts as** field from the panel.

#### HR-39 / tab 1 — `pages/hr-attendance.jsx`

**The day is the first question the panel asks.** Until now a correction landed on whichever day the roll happened to be showing, so putting right a punch from last Thursday meant steering the whole roll to that date, finding the person again, and opening the panel from there. A punch the reader missed is almost never noticed the same day, which made the common case the long way round. The panel now opens with **Which day** — a date field bounded to the academic session at one end and today at the other — defaulted to the day the screen is on. The same field is in **Add a missing punch** and in **Mark as on duty**: one panel, one rule, and a date on two of three actions would have been the worse answer.

**What the day says now is part of the form.** Beside the date sits a read-only block — status, in and out, as the record stands — that changes with the date. A correction is an overwrite of a particular record, and a form that will not show the reader what they are overwriting is asking them to work blind; it also answers *did I pick the right day?* before the reason is typed. The in and out fields follow the day, because a form still holding another day's punches is a trap.

**A closed month refuses.** Pick a July day and the consequence line stops promising a snapshot and says the day is inside an approved, disbursed run, with the save disabled — the same answer the regularisation queue already gives a locked request. The module header has claimed this since it was built; now the screen does it. A future date is refused the same way.

**A correction belongs to a day, not to a person.** The canvas kept edits under the employee's id alone, which was invisible while every correction was about the day on screen. With a date picker in the panel it would have meant correcting the 4th and watching the 11th claim to have been corrected. Edits are keyed `id|iso`, and the register, the "corrected by you today" line and the side panel all read the key for the day they are drawing.

**Hours.** A new column between Out and Status: in to out, as `7h 20m`. Two punches make a length; one punch makes a question, so a day still being worked reads `—` rather than a guess at a figure that is not yet true — which is also the moment the number starts mattering to a payroll run. Step the roll back a day and the column is full.

**The panel, trimmed.** *Counts as – one paid day, unless it is corrected* said nothing a reader could act on: every present day counts as a paid day, and the "unless" is the button at the foot of the panel. *The day, as recorded* is now the day itself — **Tuesday, 11 Aug 2026** — and the **Date** row went with it, since a panel does not need to say 11 Aug twice. *The fortnight up to this day* is gone from the history, which is headed by what it is: *Ananya Rao, day by day*.

**Two repairs found on the way.** A derived past day carried today's `lateBy` onto it, so a 08:41 arrival was captioned "52 minutes past grace" — the minutes belong to the punch they were measured from, and are dropped when a day is derived. And the reason placeholder said *shows **her** at the main gate*, on a form that opens for every employee on the roll.

`Input` gained `min` / `max` (kit.jsx): a date field that cannot be wrong about which days exist is the picker's own guard, not a validator bolted on after.

#### Verified

70 role/screen pairs OK · escape and accent checks clean · no page errors, light and dark. In the browser: the column fills on 6 Aug and reads `—` on the morning in progress; the panel opened from the row menu and from the side panel's CTA; the record block changing with the date (11 Aug *In school 07:41* – 5 Aug *Late 08:43–15:23*); 28 July disabling the save with the arrears line; a correction filed on 6 Aug showing on the 6th and **not** on the 11th; no horizontal scroll at 1180.

### Amendment DU — the employee dashboard, polished (2026-10-27)

*Rulings (designer):* polish the whole employee dashboard and **remove unnecessary texts** · **rethink the headings** so each says what its section is · **re-name "When school cannot spare you"** · loans and advances belong under Requests · **polish the attendance record table, drop its actions column and put every action in the detail box beside it** · remove **"PGT · Physics · NAV-0142"** · **remove the whole "today at school" section** and put a NARROWER one in its place that shows only the clock-in time and a running countdown — no break, no effective-so-far, no expected out — with a **clock-out button when the clock-in came from the web** · the cover table gives **accept and reject on the row** instead of an actions column · the requests table loses its trailing column to **the detail box on the right** · remove *"Approved leave has already moved your paid days. Ask HR to cancel it."* · and, on Add an employee, **"Send it to" → "Sent via"** with **no pronouns in the fields**.

#### What was already true

Three of these had landed in earlier rounds and were verified again rather than rebuilt: **Loans and advances** is a tab of Requests already (EMP-19 is defined in `pages/emp-more.jsx` and mounted by `pages/emp-tasks.jsx`); the **attendance record carries no actions column** — the row menu came out when the day panel got *What you can do*; and the **cover table already answers from the row** with Decline / Accept. What those three needed was the polish around them, below.

#### EMP-02 · My Attendance — `pages/attendance.jsx`

- **The identity chips are gone.** `PGT · Physics` + `NAV-0142` + name + school sat under the title of My Attendance, Leave and Payslips. The breadcrumb above already names the screen and the school and the rail already carries who is signed in, so what is left under the title is the one fact the screen is read against: *Academic session 2026–27 · Term 1*. Payslips gets a real subtitle instead (*"Every payslip issued to you, and this year's Form 16."*).
- **The full-width today row is gone**: *Attendance stats* + *Timings* + *Actions* ran the whole width and asserted break, expected out and effective-so-far about a day the reader is standing in the middle of. In its place, **two cards that deliberately stop short of the right edge**: the clock, then how the month is going.
- **There is now ONE clock in the product.** The card Home renders (`ClockHomeCard`) is the card My Attendance renders — same store, same dialogs, same card — so the two can never disagree. Not clocked in: the rostered window and *Web clock-in*. Clocked in: *Clocked in 7:40 AM*, the live countdown, and **Clock out only when the punch was made here** — a gate punch is undone at the gate. Clocked out: the time and how long was on the clock.
- The counter gained the words **"left of your day"**. A bare `07:49:55` is a number with no claim attached to it.
- *Attendance stats* → **"How this month is going"**, and the row inside it reading **"Me"** beside a person icon came out: a card on a teacher's own page does not need to say whose it is.
- **The roster moved into the policy**, where reference material belongs — *Your roster*, three rows, under *Shift and grace*. *Apply on duty* and *Apply partial day* were already on the **New request** menu one tab away; *Attendance policy* is a quiet link in the clock card.
- **The record table is five columns**: date, the day, in, out, effective. Break and gross moved to the day panel beside it, which already carried both — the table now reads without a horizontal scroll at 1280.
- **The day panel is sticky** and no longer vanishes when nothing is picked: it shows *Pick a day* instead, so choosing a row never shoves the table sideways.
- **Attendance requests: the Withdraw button came off the row.** A reading and a desk in the same cell is the row-menu mistake again. The table is REQUEST / DATE / SENT / STATUS; the panel beside it — the same shape the Leave screen uses — carries the dates, what was asked for, when it went, who has it, and **Withdraw** when it is still pending. The first row stands selected so the panel is never an empty column.
- *"Logs & requests"* → **"Your record and your requests"**.

#### EMP-05 · Leave — `pages/leave.jsx`

- *"When school cannot spare you"*, which had become *"Dates to plan around"*, is now **"Dates that affect your leave"**, with a subtitle that says what the two kinds of row mean: *"Exam and admission weeks take no leave; vacations need none."*
- **The cover table has one decision column, not two.** A *Status* cell reading "Waiting on you" beside two buttons that ARE the waiting said the same thing twice. The buttons are the state while the question is open; the answer and its date (*Accepted · upcoming — you answered 7 August 2026*) are the state once it is closed.
- *"Once approved, only HR can cancel it."* came off the empty state, and the matching *"Ask HR if something on it is wrong."* off the settled-request footer in Requests.

#### EMP-01 · Home — `screens.jsx`

The greeting's second line was *"Tuesday, 11 August 2026 · Sunrise Public School, Indiranagar Campus"* — the breadcrumb directly above it already says the school. It is the date now. *"HR has asked you for"* → **"What HR has asked you for"**.

#### HR-02a · Add an employee — `pages/hr-add.jsx`

**"Send it to" → "Sent via"**, and **every pronoun is out of the screen**: 46 strings carried *her* or *she* into a form that has a Gender field three rows above and is filled in for men just as often. *Her login* → **Login and first sign-in**; *Send her the invite* → *Send the invite*; *As soon as I add her* → *As soon as the record is added*; *Her email, and a code by text* → *Work email, and a code by text*; *Add her to the register* → *Add to the register*. The activation rule keeps its force without them: *"nobody in the office can do that on somebody else's behalf, which is the point of the word."*

#### Four corrections, the same afternoon

*Rulings (designer):* remove *“You would mark at the gate device instead. Your pay is unaffected.”* · **one secondary CTA** in *What you agreed to* · the colour key above *Show all* goes to the **right end** of the team calendar · **and both cards at the top of My Attendance go full width, at the same height.**

- **EMP-07 · Profile.** The consequence line came off the consent card, and with it the sunken box that held nothing else. *Read the notice* stays primary and **Take this consent back is secondary** — two filled buttons side by side rank nothing, and an outlined button in full contrast is not a buried one, which is what O1 actually forbids. **Sign-in and security, one card above, had the same two-filled-buttons problem** and was ranked the same way without being asked — *Ask the office to change my password* keeps the fill, *Sign out everywhere* is the outline. Flagged in the report, since it was not in the ruling.
- **EMP-20 · My team.** The key (*Present · Late in · On leave · No punch · Week off*) was a line of its own above the expander; it now sits at the far right of the expander's row, under one rule. It reads as the footnote to the strip that it is, and the card is a row shorter.
- **EMP-02 · My Attendance.** *Your day* and *How this month is going* are **two halves of a full-width row at a single height** (`alignItems: stretch`, both cards `flex: 1`) — 686px each at 1560, 546 at 1280, equal in every state including clocked-in, where the two carry different content. The clock card's primary is capped at **400px** so the wide variant does not draw a 640px slab; on Home, where the card is narrower, that cap is the full inner width and nothing moved.

#### The day, redesigned — and who is away

*Rulings (designer):* the *Your day* section **looks broken, redesign it** · remove *“As accrued on 11 August 2026 · session 2026–27”*, **the heading above it and the icon on the left** · the celebrations heading becomes **“Birthdays and anniversaries”** · remove *“In your department, over the next month”* · **design a new section for who is on leave today** · and **remove the countdown**, *“07:47:46 · left of your day”*.

- **EMP-01 / EMP-02 · Your day.** It was one stacked figure with a counter under a rule: at half a wide card that left the right-hand side empty, which is what read as broken, and the counter asserted *seven hours left of your day* about a day nobody can spend watching it tick. It is now **facts beside the act**: *Clocked in 7:40 AM* and *Rostered 7:45 AM – 3:30 PM* as two stat blocks, the one button that is yours to press on the right, and *Attendance policy* pinned to the card's foot (`marginTop: auto`) so a card stretched to its neighbour's height ends on a rule rather than a hole. Clocking out swaps the roster block for *Clocked out* and *On the clock*; each state ADDS a block instead of changing the shape. The per-second tick went with the counter.
- **EMP-05 · Leave.** The balances card lost its icon, its heading and its *as accrued* line — the same ruling the `Band` already carries: four balances each with a name, a figure, a bar and its own rule said it already.
- **EMP-01 · Home.** The celebrations card drops the *Coming up in Science* override (the shared default already reads **Birthdays and anniversaries**) and the default sub is deleted, so Home and the dept head's home show none; the director, HR and the principal keep the subs they pass.
- **NEW · On leave today** (`leaveflow.jsx`, `LF.AwayTodayCard` + `LF.awayOn`). Who is not in, read from the SAME approved requests every other leave screen reads, with the day they are back. **It never says which leave** — medical leave is health data (§8-F14) and a colleague has no business reading it, the line My team already holds. Mounted on the employee Home under the birthdays.
- **Fixture bug the new card found.** `LR-0211` approves Rahul Verma's leave for 11 August while DH-03's register still marked him *present, in at 08:09* — two fixtures disagreeing about one man, so Home said two people were away and My team said one. The register now reads leave, and all four surfaces (Home, My team, DH-01, DH-03) agree: **On leave 2 · Divya Kapoor, Rahul Verma**.

#### “Lot of empty space below Rostered and Web clock-in”

Equal heights have a price: the clock card holds one fact and a button, the month card holds two measured stats, and the shorter one was given the taller one's height with its last element pinned to the foot — so every spare pixel pooled in one hole under the button. Three changes to the layout, and one line of content the card was missing anyway:

- **The body centres in the height it is given** (`flex: 1` + `justifyContent: center`), so the air is split above and below and reads as room rather than as something missing. The policy link is no longer pinned to the foot.
- **The headline block is set at 28px in the wide row** — and only the headline: a size step is a claim about rank, and the rostered window set in the same figure as the punch both outranked it and wrapped onto two lines.
- **The facts take the 300px they need**; under that the button drops to its own line instead of squeezing the roster. At 1280 the card now fills its height almost exactly.
- **The card says which day it is** — *Tue, 11 Aug 2026* under the title. A card called *Your day* that never named the day was a gap in the content, not just in the pixels.

Measured at 1560 / 1440 / 1280, light and dark: the two cards stay equal (260 · 260 · 285) and the air above the figures and below the link now matches within a few pixels.

#### Both cards, shorter

*Rulings (designer):* put **On-time arrival on the same line as Avg hours / day** so the card loses height · **do the same for Your day** · **remove the rostered time**, on My Attendance and on Home · and **the clock-out button goes full width**.

- **How this month is going** is one row of two readings instead of a stack. They are peers — stacking them made the card twice the height of what it says and put one above the other, a rank neither has.
- **Your day loses the rostered window.** What it had to say about a day in progress was the punch, and the roster is on the policy and under every row of the record. With it gone there is nothing beside the act to hold a column open for, so **the button is the width of the card** — clock-in and clock-out both, since a button floating at a third of the width beside nothing reads as a leftover.
- The body gap came in from 18 to 14 with it.

Measured at 1560 and 1280, both cards equal in every state: **205 not clocked in** (was 260), **249 clocked in**, **195 clocked out**. On Home, where the card is a column, the same change applies and the button was already full width.

#### Too wide, and one thing too few

*Rulings (designer, same afternoon):* the two sections at full width are **too stretched** — make them **compact, at a width the UI is accurate at** · shift **On-time arrival back to its own line** · and **keep the rostered time in Your day, before clocking in**.

Three corrections to the round above, and each of them is the same correction: a card is sized by what it holds, not by the row it sits in.

- **The pair no longer fills the row.** Stretched across 1560 the two cards came out at 728 apiece — a clock time at one end of a field and nothing at the other, and two measuring bars long enough to stop measuring anything. They now take **440 each**, the narrow column this canvas already uses for a column of facts, and stop at x=1028 with the right-hand third of the row deliberately empty. They still stretch to one another's height, because two cards that share a row share a height.
- **One reading per line again.** On-time arrival sits back under Avg hours / day. Side by side in a 440 column each bar measured about 150px and its reference wrapped under its own figure; a measured reading needs the width to *be* measured against something. Height is the wrong thing to buy with it.
- **The roster is back, for the day that has not started.** Before the first punch there is no reading to report and a card holding nothing but a button says nothing — the window she is expected in is the one fact true at that hour, and it is what the arrival she is about to make will be judged against. The moment she is in, the punch replaces it; the roster is still on the policy below and under every row of the record. The state swaps the reading rather than changing the shape, and the act stays the full width of the card underneath it.

The rostered window is **not** set at headline size: two times and a dash in the punch's figure both outrank the punch they stand in for and wrap onto two lines. `wide` is gone from `ClockHomeCard` with it — the headline is now a property of the block (`big`), not of the card's width, so Home and My Attendance render the identical card.

Measured at 1560 and 1280: both cards **440 wide, 260 tall, equal in all three states** (not clocked in, clocked in, clocked out), no horizontal scroll, Home's own column unchanged at 438.

#### Verified

70 role/screen pairs OK · escape and accent checks clean · no page errors. In the browser: the clock card driven through clock-in → countdown → clock-out; the policy dialog carrying the roster; the five-column record and its sticky panel; the requests table with the detail panel and a working Withdraw; the cover table under all four filters; the add-employee form read end to end for pronouns.

**Deferred, not done:** `pages/leave.jsx` carries roughly ninety dead `lv.apply.*` / `lv.chk.*` / `lv.cover.*` / `lv2.*` strings left behind when the apply flow was rewritten. They are declared and never read. Worth a hygiene pass of their own; not folded into a design round.

### Amendment DT — the forgotten password, and one address per account (2026-10-27)

*Rulings (designer):* add a **forgot-password flow** · the illustrations stick to the outer edges, bring them **closer to the centre** · **remove *Hear the characters*** · **shorten the captcha**, it is too big for its box · remove *“Your school's HR office sets up your account. There is no sign-up.”* · **add email to the staff-login flow in the HR module** · **add email to personal details** in Add an employee **and use it for the staff login** · **add the login details and their functionality to Add an employee — the details are sent, and the employee signing in is what registers the status as Active.**

#### SH-01 / SH-02 — `pages/login.jsx`

**The forgotten password forks and rejoins.** `route` (`in` | `forgot`) says which journey a shared step is in; `step` says where in it. Forgotten: an email box with no password and no captcha → the SAME channel and code steps, relabelled *Step 2 of 3* → **Set a new password** (new + confirm, Show/Hide, eight-character floor, mismatch guard) → signed in. The entry screen refuses to say whether the address exists: *“If that address is on the roll, the code goes out. We do not say either way — nobody should learn who works here by typing.”* — the same anti-enumeration rule SH-01 already carries for wrong credentials. *Back to sign in* returns and clears what was typed.

**The captcha is a control, not a panel.** 208×66 → 176×50, the exact height of the box beside it, so the two sit on one row as one control; glyphs 29px → 23px. *Try a different image* and the six-character rule share one line underneath. **“Hear the characters” is gone** at the designer's instruction — recorded here because it removes the challenge's only non-visual route, which a real build still owes WCAG.

**The room came in off the edges.** `left:0`/`right:0` → `clamp(12px,4.5vw,110px)`, widths trimmed to match; the hide threshold moved 1120 → 1200px. Measured at 1280/1440/1920: the furniture never reaches the card. The help line under the card is deleted.

#### HR-38 · Staff logins — `pages/hr-logins.jsx`

Every account carries `email`; the field that held a phone and was called `signIn` is now called `phone`, because that is what it was. **The address is the row's headline** and the number sits under it as *“codes also go to …”*. Search matches the address. The invite, re-invite and set-password dialogs all name the address (the password dialog sends to both: *“To …@sunrisepublic.edu.in, and a text to …”*). Three bugs fixed on the way: **inviting somebody wrote the password-set fields**, so the row claimed a password had been set when none had (it now reads *Invited {date} by {who}*); a **seeded note survived a state change** (*“On the roll, never invited”* persisted after an invite went out); and three dialog sentences carried *{name}* AND *her*, which misgendered half the roll — they take *they/their* now.

#### HR-02a · Add an employee — `pages/hr-add.jsx`

**Work email** replaces *Personal email* in group 1 and is **required** (blank and malformed both guarded) — a record with no address is a person who can never be let in. The phone's hint stops claiming to be the sign-in. New **group 6 · Her login**: the address echoed back from group 1, *Send her the invite* (moved out of the summary card, where it was orphaned), **When** (as soon as I add her / on her joining day) and **Send it to** (her email and a code by text / her email only), each with its consequence written out; and the rule the group exists for — *the account is created Invited, not signed in; her FIRST sign-in is what turns it Active, and nobody in the office can do that for her.* The summary gains **Signs in with**; the consequence list gains a fifth line that changes when the invite switch does. The done state now carries the account: the *Invited, not signed in* mark, the address, when and how the invite goes, *“It turns Active the moment she signs in — and not before”*, and **Open staff logins**.

Driven in the browser: the forgotten route end to end with all four guards; the captcha image and field measured on one row at the same height; the furniture measured clear of the card at three widths; the HR invite and password dialogs; search by address; the add-employee email guards, the live consequence, the invite switch off and on, and the saved done state. No page errors.

---

### Amendment DS — the sign-in, rebuilt as one card in a room (2026-10-27)

*Ruling (designer):* design the login screen for the dashboard · give it **its own tab beside the other users, bottom right** · email, password and a **captcha** · then **OTP by email or SMS** · take the UI style from the Mural reference, with **work-related illustrations** drawn the same way · the logo on top.

**SH-01 and SH-02 are now one screen in three steps**, `design/v3/pages/login.jsx` (published as both `Pages3.Login` and `Screens3.Login`). The old left/right split is deleted from `screens.jsx`, which now holds Home alone.

**The composition.** Mark, trust name, one centred card, then the help line and the two legal links — nothing else above the fold. Flat illustrations run along the bottom edge of the page and are cropped by it: a staffroom plant, a wheeled chair, a desk carrying a stack of exercise books and a mug; across the page, the noticeboard with two pinned sheets, the wall clock, the sofa, a tall plant and a globe on a stool. One outline weight, flat fills, no gradient. `aria-hidden`, `pointer-events:none`, and gone under 1120px.

**Step 1 · credentials.** Work email (the designer's call — it **supersedes SH-01's “Staff ID, not email”**), password with Show/Hide, and a captcha. The captcha is deterministic on first paint so the screen can be screenshotted, redraws on every miss and on *Try a different image*, and carries *Hear the characters* beside it; its character set excludes I, l, 1, O and 0. Guards, each in its own field: no email, a malformed email, no password, no characters, wrong characters.

**Step 2 · where the code goes.** Two radio cards — Email (`m••••@sunrisepublic.edu.in`) and Text message (`•••••• 4821`) — each with its destination MASKED and a line saying Naveya holds neither in full. Matches SH-02's “masked destination” rule and §8's PII classification.

**Step 3 · the six digits.** Six boxes, auto-advancing, paste-aware (a pasted code fills all six), backspace and arrow keys walk between them, focus lands on the first box on arrival. Resend carries SH-02's 30s cooldown and the remaining seconds ARE the button's label. Wrong code counts the tries down out loud (3 → “No tries left. Ask your HR office to unlock the account.”). On the canvas any six digits pass except `000000`, which is the reachable wrong-code state.

**The canvas tab.** The bottom-right switcher gained a **sign in** tab, ruled off from the people. Choosing a person while it is open keeps you on the sign-in and signs in as THEM — the email, and the home you land on, follow the switcher. `?screen=login` still works.

Driven in the browser: every guard fires and names its field; the captcha reshuffles on a miss; lower case is accepted; the SMS channel carries through to step 3; short code, wrong code and the cooldown label all behave; paste fills six boxes; sign-in lands on that role's first screen. Light and dark, 430 / 1280 / 1440 / 1920 wide: nothing overflows the card and there is no horizontal scroll. No page errors.

---

### Amendment DR — the greeting, and the rule change (2026-10-26)

*Rulings (designer):* remove “What is waiting on you, and where August has got to” · remove the payroll officer’s name from the title and **greet them instead** · remove the figures section above the August run · give the run a different description · remove the registers section · **inside pay rules, add the full flow and screens for the change-the-rule CTA, and make the CTA primary**.

#### PY-01

The title is a greeting that knows the hour (*Good morning / afternoon / evening, Sunita*) with no subtitle under it. The four-figure cost row is gone, so the board opens straight on the run; its description now reads *Each campus runs its own August. Work one until nothing on it is blocking, then send it to the accountant.* The Registers panel is gone and the row it left rebalances: Exits and Pay rules take three columns each.

#### PY-03 · Change the rule — the flow

The CTA was a secondary button with no `onClick`. It is the page’s only primary now, and opens a four-step sheet:

1. **What changes** — the structure as an editable table: a percentage box for each `pct` part, an amount for each `flat` one, priced live at one real person’s basic (₹39,500 on a ₹94,800 salary) with the delta under each new figure. Basic pay is not editable (*HR sets the grade on each contract; a pay rule cannot touch it*) and the balance part is not either (*whatever is left of the salary, so this one moves when the others do*). Guards: *nothing has changed yet*, and *the parts come to ₹X more than the salary*.
2. **From when** — three answers with their consequences written out: **the September run** (nobody is owed anything for the past), **1 August** (refused and inert — *August is open on two campuses; a rule cannot move under a run somebody is still working*), **1 July with back pay** (*268 people would be owed the difference for one month, worked into the September run*).
3. **What it does** — three before/after figures: monthly salary (unchanged, because the balance absorbs it), **counts for PF** (₹47,400.00 → ₹50,560.00), and the **excluded allowances** share against the limit in the pinned `StatutoryConfig`. A breach is refused here by amount and by name.
4. **Send it** — a summary of what moved and from when, a required reason, the named maker and checker, and *nothing changes until Rajiv Menon approves it, and you cannot approve your own change*. Then a sent confirmation.

Afterwards the group page carries the pending change — who holds it, what moved, from when, and *Withdraw it* — and the CTA becomes an inert *With the checker*, because a rule cannot be changed twice at once.

Verified in the browser: every step driven; the no-change, overrun, blocked-date, Code-breach and no-reason guards all fire and all name their reason; the back-pay path sends and the group page shows the pending note; *Withdraw it* returns the primary CTA. No page errors.

**One property worth recording:** raising HRA can never breach the Code here, because the balance part absorbs it and BOTH are excluded — the total excluded is unmoved. Only shrinking a part that counts for PF can breach it. The first test asserted the wrong thing and the model was right.

### Amendment DQ — the payroll officer’s board, rebuilt (2026-10-26)

*Rulings (designer):* “based on all the changes inside the modules of payroll officer, redesign the home screen and the information and UI of the sections inside it · **no full-box hover state should be present, instead only text next to an arrow icon to view more** · based on the payroll run module, redesign the sections of the August term as well · redesign the waiting-on-you section · overall redesign the full screen with internal sections, the UI is too complex to understand, improve UX.” Then, on the first attempt: **“I don’t like this UI, I need a dashboard type home screen with sections and data, not like this.”**

#### What it was

A six-column grid of eight panels, 1,760px tall. Four were tiles-as-buttons that lit up whole on hover; six carried a layout of their own (`Grouped`, `Roster`, `Pair`, `Chips`, `Catalogue`, `Stats`, `Bars`). The run panel invented a trust-wide run at stage *approval* and printed four untranslated step keys. The waiting list drew six independent bars comparing claims against rises.

#### The wrong turn

The first rebuild read “too complex” as “too much” and shipped three stacked registers with no figures at all. The complexity was never the data — it was six grammars in one row. **Fewer shapes, not fewer figures.**

#### What it is

A board that repeats three shapes: a **figure**, a **gauge** (one bar, one whole) and a **split** (one bar, many parts).

1. **What August costs** — Net to staff · Deductions · Employer cost · Held back, summed from the campuses in scope. Net and deductions share the bar (they make the gross); employer cost and held pay carry a hollow swatch because neither is a slice of it. Drawn at 22px rather than the band's 34px: four crore-sized figures collide below a desk width and money is not truncated to save a layout.
2. **The {month} run** — one panel per campus, read from `NaveyaPayRuns` + `NaveyaRoll`: what it owes, people and mode, and a **Ready to pay** gauge — *238 of 253*, amber, with *15 rows still blocking — 7 with HR, 8 yours to answer* under it (`ST.needsFix` over the live draft, split by `issue.owner`). A campus with the accountant shows a full blue gauge and the reason nothing moves; a campus with no pay group gets the reason instead of an empty meter. *Open the run →* lands on that campus's own run.
3. **Waiting on you** — the total, the longest-standing queue beside it, ONE split bar across the six kinds, and a row each carrying its segment's dot, its count, how long it has sat, and a link naming where it is dealt with. *blocks the run* where there is no date to show. **Past a deadline** sits beside it: the count, then a red meter per person against the sixty-day worst case.
4. **The rest of the desk** — five panels of ONE shape (icon, name, figure, line, two facts, *View more →*): Adjustments, Staff & salaries, Exits, Pay rules, Registers.

#### The third pass — five subjects are not one section

*Ruling (designer):* “improve the UI of the rest of the desk section and do not categorise all the sections into this one section · leave the rest-of-the-desk UI type and **keep the boxes** · design the sections individually distinct and not too cluttered.”

The umbrella heading and the row of five equal 232px tiles are gone. The whole board is now ONE six-column grid; the only heading in it spans the grid above the three campus panels, because those are three parts of one run. Everything else names itself in its own panel head, and each takes the width and the shape its subject wants:

| Panel | Width | Shape | Why |
|---|---|---|---|
| Adjustments | 3 | split + named rows | loans · advances · arrears are one population by kind; the foot gives what comes off this run |
| Staff & salaries | 3 | split + named rows | the roll by the rule each person is priced by, summed from the campuses in scope |
| Exits | 2 | split in travel order | not started → computed → with the checker → approved |
| Pay rules | 2 | three rows, no bar | three named things are not a population |
| Registers | 2 | gauge | *Safe to send 8 of 15*, amber while a run is unapproved, with the run it came from |

Verified: 0 `.nv3-tile` boxes and 0 clickable rows; all fourteen links driven — *Open the run* lands on *Indiranagar · August 2026*, *All months* on PY-07, the waiting rows and the five *View more* links on their modules. Campus scope recomputes every figure (Indiranagar alone: ₹1,56,82,660.00 net, 251 owed, ₹1,55,73,560.00 leaving the bank). Light, dark and 1040px read back with no page errors; the status mark wraps under a campus name rather than overlapping it.

### Amendment DP — the advance, end to end (2026-10-22)

*Rulings (designer):* remove the word “longest” · the employee’s loans and advances needs a **month field for an advance too** · the accountant’s period and entity fields sit **inside the figure section**, take them out · **design the advance across payroll and HR — it is taken before salary, so design how it is paid back, and through the payroll run where one is present**.

#### EMP-19 · Asking for an advance

The months field was hidden for an advance and the amount divided by one. Both kinds now use one `Select` with the range each actually uses — a loan 6/12/18/24/36, an advance 1/2/3/4/6 — the months reset when the kind changes, and the line under reads *₹20,000.00 comes out of your next salary in one go* or *About ₹10,000.00 a month for 2 months*. The kind options say what each IS: *a loan — spread over years*, *an advance — taken before the salary it comes out of*.

#### HR-41 · An advance on HR’s desk

The record leads with **Advance asked for**, the line reads *Taken back over the 4 months they asked for, about ₹10,000.00 a month* (or *in full from the salary after it*), and a fact says **Paid out — before the next salary**, where a loan says **First instalment — the run after it is sanctioned**.

#### PY-16 · The run’s loans step

A `Band` replaces the single sentence: *recovered this run* and *paid out this run* share the bar (same unit, same run, opposite directions); *still owed after it* and *advances running* stay out of it. The foot states the rule — an advance leaves before the salary it belongs to. An advance paid out here reads *₹10,000.00 a month from September* in the month column, and the panel that pays one now offers **one month** as the employee’s own form does, with the line *₹20,000.00 comes back in full from the next run.*

#### PY-13 · Loans and advances

The band counts **loans running** and **advances running** apart (with what the advances still owe), keeps *awaiting approval*, and puts the two money figures out of the bar. The dead `pick` state becomes two real filters — *which kind* and *where it stands* — and the overflow menu whose only item was “open the loan” is gone, because the row opens.

#### EMP-07 · The payslip

A slip recovering only an advance says **Advance recovery** — *₹18,000.00 of the advance you were paid early, taken back from this pay* — instead of *Loan recovery*.

#### AC-08 · Contributions

*Period* and *Entity* leave the band’s corner and join *Kind* (which had been in the register’s chips) in one row of questions under the figures.

#### Everywhere · “longest”

Thirteen strings across eleven files: *Longest wait* → *Oldest*, *longest {name}* → *{name}*, *longest wait first* → *oldest first*, *Open longest* → *Oldest opening*, *longest overdue* → *most overdue*.

Verified: 69 role/screen pairs OK; the employee’s ask driven through both kinds, PY-13’s filters (17 → 5 advances → 6 with the closed one), the run’s loans band and advance panel, and HR’s advance record read back in the browser with no page errors.

### Amendment DO — a third door on the queue, and two modules brought into the house style (2026-10-22)

*Rulings (designer):* the rise's “nobody raises a rise” sentence goes · the day's date control moves next to the department filter and the tab becomes **Today** · *The roll, punch by punch* needs a better heading · the re-run and export buttons move inside the days-to-fix table · the “without their manager in the loop” sentence goes · **days to fix offers only one CTA — there is no way to hold or lock an entry** · redesign the **helpdesk** like the other modules (figures, simple copy, side modals for detail and actions) · the same for **reports**, and the description under each report name goes.

#### HR-31 · Today, and the day's three questions

The tab is **Today**; the date control joins the department and status selects in one filter row under the figures (it had a full-width row of its own above them, with Export floating at its end); Export moved into the register's header; the register is **Who was in, and when**.

#### HR-30 · Days to fix — correct it, hold it, or lock it

The sheet's single act becomes three. **Put it on hold** takes a date it comes back and what it is waiting for; the row reads *On hold · back on Tue 18 Aug*, drops out of *still open*, and offers *Take it off hold*. **Lock it as it stands** states what the run will take and what it costs the person, takes a reason, and closes the day under *Locked by hand* with an *Unlock it* beside it — distinct from a day locked by a closed run, which still refuses. The band is five figures (still open · on hold · put right · nothing to fix · locked); *oldest* left it, since the oldest open day is already named in the first figure's line. *Run the reconciliation again* and *Export* moved into the table's header.

**A latent bug this surfaced:** `ExceptionDetail` and the leave ledger pane each declared their shell as a function INSIDE the render, so every keystroke remounted the subtree and the reason box could hold exactly one character. Both now use one stable `PaneShell`.

#### HR-31/32/33 · Helpdesk, in the house style

A `Band` of four: *waiting on you* (with the longest wait named), *waiting on them*, *answered*, and **past the promise** — the SLA-breached count, out of the bar because it is a subset of the first. The pill switch that carried those counts becomes a *Whose move* select beside *Find* and *What about*; the register gains a title, a count and the *What staff can raise* button; the overflow column goes (all three of its items opened the side screen the row now opens).

#### HR-08/34/35/36/37 · Reports, in the house style

All four tabs open on a band. **Reports**: *in the library* · *run before* · *never run*; the paragraph under each report name is deleted and lives in the report's own side screen, which a row now opens — with what it covers, its range, its last result, and *Run it* or *Download* in the foot. **Appraisals**: *reviewed* · *overdue a review* · *moved post*, the pill switch becomes a *Show* select, the done rows open their sheet (whose foot carries *Open the staff record*), and the overdue row's one-item menu becomes a button. **Staff categories**: *in use* · *nobody in them* · *vacation staff* · *no qualification set*. **Notification templates**: *in both languages* · *English only* · *sent on a schedule*. `ReportResult` was reading a `campus` it was never passed — a crash reachable the moment a row opened the headcount result; fixed.

Verified: 69 role/screen pairs OK; the hold and the lock driven end to end in the browser (figures, row state, sheet callout, undo), every new band read back with its bar, and the helpdesk and all four report tabs opened with no page errors.

### Amendment DN — figures that count, and lines that say who (2026-10-22)

*Rulings (designer):* the nightly-job sentence goes · regularisations and overtime draw no coloured bars, and that is a bug · “13½” is not a way to show data, and the bar leaves the other figures out · **every figure in every staff-attendance tab must be easy to understand and usable instead of random figures and descriptions** · Create a shift is a primary CTA, loses its tick, and leaves the band that it inflates · pay requests loses the *you are the first approver* section entirely · the copy under its figures is unreadable · the side modal's *Amount claimed* and staff-detail sections are redesigned · *What you can do / A claim with no bill cannot be verified* goes · better figures and content for every tab of pay requests.

#### HR-31 / HR-30 / HR-29 — the bug, and what caused it

Three bands passed `tone: "late"` / `tone: "off"` — StatusMark ROLES — where a chart colour belongs, so the swatch and every bar segment painted an unresolvable word. All three now carry `c.chart*`. **The day** counts somebody who has gone home with *In on time* and a weekly off with *Not expected*, so the four figures add up to the roll — on a Sunday, and on a weekday where a driver’s shift ended at 09:35 and he was in none of them — and each line names people (*Karan Mehta the latest, in at 08:52* · *Divya Kamath, Devika Rao and 2 more*). **Regularisations** is four states of one window — waiting on you · accepted · sent back · too late to change — each line a name and a date; its two selects are capped at 320px. **Overtime** is four states of one window too, with the hours in the lines (*7 hours in all* · *2 hours go to payroll* · *4 hours not paid*), so the bar has one unit. **Days to fix** counts ROWS in the chosen window — still open · put right · nothing to fix · locked · oldest (days, out of the bar) — and the loss-of-pay arithmetic moved to the foot: *Left as they are, 13½ paid days go unpaid in run PR-2026-08.* **Shifts** keeps its four, now with a kind tally, the headcount from `CAMPUS_HEADCOUNT`, the shiftless named, and the date of the last change; *Create a shift* is a primary button in the REGISTER's header, the shiftless notice is a line above that register, and the band holds figures alone (a band may still carry a whole-screen act, such as an export — this one carried a list’s). The nightly-job explanation is deleted in both places it appeared.

#### HR-40 / HR-41 — pay requests

The *You are the first approver* card and its four per-tab lectures are gone, and `Note` with them. Every figure's line is now a fact: the money or hours behind the queue (*₹22,250.00 in all* · *45.5 hours in all*), the day the last one went to payroll, who sent one back and how long ago, how many of the settled were paid, and the name behind the longest wait. The foot states only what is true and actionable (*1 of the claims waiting on you came with no bill attached*).

**The record.** A claim draws its own `ClaimLead`: the amount with its category beside it, the day it was claimed, the year's cap as a METER with the headroom in rupees (red past the cap), and the bill tile under it. The facts beneath are `FactRows` — a hairline list with a 124px label column, the same idiom as the leave request panel — headed *Who asked, and what for*, with one *Raised on* row carrying the date and who raised it. Loans, overtime and rises lost their closing paragraphs; their facts carry arithmetic instead (*an instalment is 14% of it* · *3 September to 27 September* · *₹7,584.00 twelve times*). **The three acts left the right-hand column** for the screen's foot, right aligned, with *Decline it* in danger outline and the one act you can perform filled — for a claim with no bill that is *Send it back*, with a dead *Verify and send* beside it.

Verified: 69 role/screen pairs OK; every band read back in the browser with its bar's segments and colours; a Sunday, the When windows, a day-to-fix row, a shift, and one record on each of the four pay tabs opened with no page errors.

### Amendment DM — the four attendance tabs, and the past (2026-10-22)

*Rulings (designer):* probation loses *What the head says* · leave filters full width and a better home for *Hide the filters* · the leave detail side modal is too cluttered · Hiring loses *Average age* and *Average wait*, and *Record it* becomes a primary **Save** · the requests module's figures do not make sense · **staff attendance must read any staff on any date** · the four attendance tabs get coloured bars and figures with no heading or sub-heading · **their past data is unreadable** · *Decline it* is red · days to fix must not group its entries, and the line under the *what happened* heading goes · **HR is the only person who handles attendance, so the head-of-department flow goes** · the filters in all four tabs are redesigned · the shift rows lose their sub-text and the rosters lose the rotation UI.

#### HR-31 · The day — any day, and one person's fortnight

The date is a control (`att3-date`) with a *Today* escape beside it; the roll, the four figures and the register are read for whatever it says, generated deterministically for a past day (weekend → off, then a hash for missing / late / leave / in). A Sunday's four zeros carry a line saying so. Opening a person gives the day's facts for THAT day plus **the fortnight up to it**, day by day, with the open day tinted — the whole of "see any staff on any date".

#### HR-31 · Regularisations, overtime — bands and windows

Both tabs lose their heading, sub-heading and footer rule in favour of `Band`; both gain a **When** window (*this month · the last three months · everything on record*) and a filter row whose fields fill the width. Overtime's fixture gained two settled months so the window has a past to show. *Decline it* is `dangerOutline`. The rate sentence ("Accepted hours go to the next run…") is gone.

#### HR-30 · Days to fix — one row per person, and no head of department

The outage and no-shift piles are **expanded per person** (`EX-0102-ananya`, …); the *what happened* cell keeps its heading and drops the sentence under it; the overflow menu goes (the row's own screen holds the actions); the band is four figures — *still open (days, across n people) · put right · locked · oldest*. Pre-explained people (on leave, already absent) read **Nothing to fix**. The filter row is four selects — exception, department, when, where it stands — replacing three selects and a switch. **Removed entirely:** *Send it to the head of department*, the `withManager` state, its callout, its panel and its strings; the bulk outage correction survives inside any outage row's screen.

#### HR-29 · Shifts and rosters — a name, a history, no rotation

`Band` with *shifts · staff on a shift · on no shift · changed this month*, the *Create a shift* action in its corner and the shiftless line in its children. The shift column is the name alone; the register loses its sub-line; the overflow menu goes (assign, timings and *Take the shift out of use* sit in the shift's own screen, the last in danger outline). A new **What has changed** register (`SHIFT_TRAIL`, seven dated entries across three months) answers the past, filtered by the same When window, and each shift's screen repeats its own slice of it. **Removed:** `RosterGrid`, `rosterGapsOf`, `RebuildRosterPanel`, the ROSTER fixture, the gaps figure and 20 `hla29.ro.*` strings.

#### HR-28 · Leave admin, and the request panel everywhere

The five filter selects fill the row; *Hide the filters* is a secondary button at the right-hand end of the line above the queue, with the active-filter mark and *Clear* beside it. `LF.RequestPanel` — the one panel DH-02, PR-03, DR-02, HR-28 and the employee's own leave all draw — is given room: 22px between blocks, the dates leading at `fig("lg")` under a *What is asked* label, the reason in a tinted block headed *Why they asked* (the 2px accent stripe is gone), the facts a hairline list with a 124px label column, and the signatures under *Already signed*.

#### HR-32 · Pay requests — the figures count the table

Every figure is scoped to the open tab and the chosen campus; a fourth count, **settled**, joins the bar, and *longest on your desk* stays out of it. The rail chip keeps the whole-desk number.

#### HR-24 / HR-25 · Smaller things

Probation loses the *What the head says* column and its three strings. Hiring loses the *Average age* and *Average wait* figures; *Record it* is **Save**, and primary.

Verified: 69 role/screen pairs OK; the four attendance tabs, a past day, a person's fortnight, a Sunday, a day-to-fix row, a shift, leave admin's filters and request panel and both pay-request tabs exercised in the browser with no page errors; escape and accent checks clean.

### Amendment DL — lifecycle simplified, offers folded in (2026-10-22)

*Rulings (designer):* the stage control full width · the edit button is misplaced · rename "Give them longer" · **the onboarding checklist as one table** · **probation with no HR–HOD communication, in a side modal, with only renew / don't renew / close / notice** · **Offers under Hiring as a tab, off the sidebar** · leave admin: no spec codes, the CTAs are misaligning the figures, green for *Move the approval*, primary for *Remind the approver*, better lines under the figures.

#### HR-22 · The joining checklist

A progress card, a safeguarding card and three grouped lists become **one table** in a side screen: *What has to happen · Whose job · Due · Where it stands · (mark done / reopen)*, sorted overdue first, then not done, then done. `TaskLine`, `TaskGroup` and the reassign dialog are gone with the piles.

#### HR-24 · Probation and contracts

**The head of department is not in this loop.** *Ask the head for a recommendation* and *record what they said* — the card, the dialogs, the empty states and the trail entries — are gone; that exchange happens off the system. What is left is a side screen with four facts (what they are on, since when, when it ends, how many days that is) and the decision: **Confirm them** / **Extend** / **Do not confirm**, or **Renew the contract** / **Close the contract**, the last outlined in danger.

#### HR-08 · Offers under Hiring

Offers is Hiring's third tab; the rail slot, its permission entry and the `hrOffers` route are gone. `hr-offers.jsx` now exports `window.NaveyaOffers.Panel` instead of a page, and *Record an offer* on a candidate switches tab rather than navigating.

#### HR-26/27/28 · Leave admin

The spec codes are off the tabs. **Export** and **Apply on behalf** moved out of the band (where they were drawing a header bar over the figures) and sit beside the queue/calendar toggle. **Remind the approver** is now the primary and **Move the approval** the green outline — a new `successOutline` button in the kit. The four lines under the figures are plain: *Nobody has decided yet* · *Waiting more than 3 working days* · *Working days on the oldest one* · *In the requests still open*.

#### Hiring and offers, smaller things

The candidate sheet's stage control fills the footer (fields stretch, buttons hold the right end), and **Edit** moved under the facts it edits. *Give them longer* → **Extend the date**.

Verified: 69 role/screen pairs OK (hrOffers is no longer a route); both lifecycle sheets, the offers tab and leave admin exercised in the browser with no page errors; escape and accent checks clean.

### Amendment DK — no heading over a figure, anywhere (2026-10-22)

*Rulings (designer):* a back button when a candidate opens from an opening · the sheet’s footer controls to the right, everywhere · an edit icon instead of "Change their details" · a better way to show "Move to another opening" · the resume in blue · better copy for "What we hold from them" · attachments that are not just text · the openings figures sit unevenly · **and then remove the heading, icon and description from that figures section on every screen that has one.**

#### The sweep

`Band` no longer draws a heading: `head` stays as the section’s accessible name, `action` keeps its corner, and `head`/`sub` are gone from the surface. That is **23 bands across HR, payroll, the accountant, the principal, the director and the dept head** in one change. The six figure sections built from a `Card` + strip rather than a `Band` — hiring × 2, offers, lifecycle × 2, My team, and the dept head’s three — had their `icon`, `title` and `sub` removed at the call site, and every strip’s 18px top margin (which existed to clear a heading) is re-seated so the air above the labels matches the air under the bar.

#### The side screens

`SideScreen`’s footer is right-aligned, product-wide. The candidate sheet’s stage select and date go with it.

#### Hiring

A candidate opened from an opening carries **Back to ‹opening›**. *Change their details* is now a compact **Edit** with a document icon, over the facts it edits. *Move to another opening* is gone as a button: the opening is now a row in the sheet (**For**), with **Move** as the link beside it. The resume in the opening’s candidate list is a link in the product’s accent, not grey text.

#### Offers

*What we hold from them* → **Their reply, on file**. Both attachments — and the offer letter when one is recorded — are **file chips**: the file’s mark, its name, and a download beside it.

Verified: 70 role/screen pairs OK; ten band-bearing screens checked for overflow and page errors after the sweep; back, edit, move, resume and the attachment chips exercised in the browser; escape and accent checks clean.

### Amendment DJ — the sheets, finished (2026-10-22)

*Rulings (designer):* the three dots are too big and open behind the sheet · put every action in the modal · a candidate row in an opening shows only the resume, and there is no way to move their stage · strip the history to status, date and person · the offer modal shows too much · rename "How they got here" · better words and weight for the decision CTAs · one dropdown and a submit instead of a row of them, with "Record an offer" only after the interview.

#### Hiring · the opening sheet

The overflow menu is gone; the footer carries **Add a candidate** (primary), **Change the details**, **Put it on hold** / **Start it again**, **Copy it** and **Close the opening** — the last outlined in danger, a new `kind="dangerOutline"` in the kit. The candidate rows now carry what was written down when they were added: name, where they came from, where they have got to, the date, and whether a resume is on file — and **Open** on the row leads to that candidate's sheet, where the stage is changed.

#### Hiring · the candidate sheet

**One question, one control:** *Where they stand now* (a select over the whole ladder, including **Not selected** and **Withdrew**) and *On* (a date), then **Record it**. Choosing an ending opens the reason dialog, because an ending without a reason cannot be read later. **Record an offer** is the only other button, and it appears only once the candidate has been interviewed; before that a quiet line says when it will. *Change their details* and *Move to another opening* sit in the body as ghost buttons. "Not taken" is now **Not selected**, everywhere.

#### Offers · the sheet

Three facts: **Pay offered**, **Joining on**, **Offer sent**. Then **What we hold from them** (sub-line gone, copy cut to one line) and **What has happened** (was "How they got here", its sub-line gone). The footer carries the record action plus **Revise and send again**, **Give them longer** and an outlined **Withdraw the offer**.

#### Both trails

Status, date, person. The notes, the "met" lines and the addresses are gone from the trail — they stay on the record itself.

Verified: 70 role/screen pairs OK; both sheets and the offer sheet exercised in the browser with no page errors; escape and accent checks clean.

### Amendment DI — doc control, logins, hiring and offers (2026-10-22)

A long sweep of the designer's rulings across four modules.

#### HR-10 · Doc control

- **Verify responses:** 20px between the heading and the queue; the whole **Recently decided** list is
  gone (with its seed), and the band on HR-09 loses *"A request HR raised and is still waiting on…"*.
- **Expiry watchlist:** the **Notified** column is gone, from the register and the sheet; the export's
  CSV note is gone.
- **Child-safety board:** the note under the title and the export note are gone.
- **POLICE VERIFICATION IS ADDED, NEVER ASKED FOR.** It happens at a station and comes back on paper, so
  "Raise a verification request" is gone from the board and from police rows on the watchlist, and with it
  the *pending* state (nothing can be waiting on an employee's response). What is left on every row of the
  board, and on every police row of the watchlist, is one action: **Add the certificate** — one dialog,
  shared by both, asking for the PDF, the dates and the issuing authority.

#### HR-07 · Staff logins

Band head *Who can sign in* → **Staff accounts**, its sub-line cut. **Employee ID** is a column of its own
rather than a line under the name. The search row no longer adds sixteen pixels to the Field's own twenty,
and the empty filter slot beside it is gone.

#### HR-08 · Hiring

- Both bands lose their headings; the openings band loses the verdict chip *"Worth asking what is holding
  them up"*; the "Open and on hold" select is `size="sm"`, the height of the button beside it.
- **The actions columns are gone from both tabs** — the row opens the record.
- **An opening opens in a side sheet**: who is in the running (with the **resume** as the only action per
  person), and what has happened to the opening. *What this opening is* is gone entirely, and so is the
  opening's own state chip — the column the reader just clicked carries it.
- **A candidate opens in a side sheet**: who is handling them, phone, e-mail, the resume, the history —
  and **the decision at the foot**: *Record an offer* · *Not taken* · *They withdrew*.
- **Adding a candidate asks five things**: the opening, the name, where they came from, where they have
  got to, when, and the resume. Phone, e-mail, handler, qualification, notice period and the note are
  things HR learns later and edits in.
- **The five candidate figures, in plain words:** *In the running* (still being considered) · *Past the
  interview* · *Average wait* · *Waiting too long* · **Hired** (they have joined the school) — which
  replaces *No longer in the running*, a figure nobody could read.

#### HR-09 · Offers

- The heading, its sub-line and its icon are gone. The five figures now read **Written, not sent** ·
  **Sent, waiting** · **They said yes** · **They said no** · **Over**, each with a line a reader does not
  have to decode.
- **An offer opens in a side sheet**, not a page; the actions column is gone.
- **The offer is recorded, not sent.** *Send the offer* → **Record the offer you sent**, and the dialog now
  asks for **the offer letter PDF** before anything else; it cannot be recorded without the file and the
  address. The reply, with its screenshot, was already recorded this way.
- **A door from hiring:** *Record an offer* on a candidate carries the name, the post, the campus and the
  e-mail across, opens Offers on a draft already in their name, and says so.

Verified: 70 role/screen pairs OK; every tab and sheet exercised in the browser with no page errors; the
certificate dialog opens from both the watchlist and the board; the hiring → offers hand-off lands on the
right draft; escape and accent checks clean.

**Flagged, not fixed:** the designer also asked to remove the text "[Pasted text #3 +3 lines]" — that
string is not in the product; it is their editor's paste marker.

### Amendment DH — PR-05 / DR-05 Staff, a new module (2026-10-19)

*Ruling (designer):* "make a new module called Staff inside the principal and director user. Do not show
full information of employees/staff — just show all staff table of all campuses with only some
information, with their job role, status etc."

**New screen: `design/v3/pages/staff.jsx` → `window.Pages3.Staff`**, on the rail for the principal
(`campus.staff.read`) and the director (`dir.staff.read`), route key `staff`, codes **PR-05 / DR-05**.

#### What it holds

| | |
|---|---|
| Name | with the staff ID under it — the identifier HR, payroll and the register all use |
| Role | the designation: *PGT, Physics* · *Bus driver, Route 4* |
| Department | |
| Campus | **director only** — a principal's list is her campus and says so |
| Employment | Permanent · Probation · Fixed-term · Per-lecture |
| Status | Active · On notice · No login yet · Exited |

Filters: a search over name and staff ID, a category select (teaching / non-teaching / support / guest), a
status select (*On the roll* by default, so an exited colleague is not in the way), and for the director a
campus select. The table is titled by what it is showing, so the heading and the filter cannot disagree.
**No row opens.**

#### What it deliberately does not hold

Salary, bank, PAN, UAN, Aadhaar, phone, e-mail, date of birth, documents, leave balances — and no route to
any of them. The foot says so in one line. Scope grows with the role; depth does not. The staff file is
HR-02 and stays HR-02.

#### Where the rows come from

`window.NaveyaStaff`, exported from `pages/hr.jsx` — **HR-02's own register**, not a copy. A name, a
designation or a resignation reads the same on all three screens.

**Flagged, not fixed:** HR's register (16 rows) and the shared leave roster (20 people) are still two
populations with overlapping names — HR's Head of Science is Meenakshi Pillai, the leave ladder's is Anjali
Deshpande. Surfacing HR's register on two more screens makes that visible in two more places; reconciling
the two fixtures is a data decision of its own.

Verified: 70 role/screen pairs OK (the two new ones added to the smoke); both roles at 1440 / 1180 / 1024 /
900, light and dark — no page scroll, no page errors, no raw keys; every filter returns the rows it
should (Whitefield 5, +teaching 2, exited 1, on notice 1, everyone 16, a staff-ID search 1) and the empty
state appears when nothing matches; the rail carries Staff for the principal and the director and for
nobody else; escape and accent checks clean.

### Amendment DG — three chips that repeated the card (2026-10-19)

*Ruling (designer):* "do not show the With you status in the same card, and also Long leave — do the same for director as well."

- **"With you"** is drawn only when the request sits on somebody else’s desk. Where it is the reader’s own decision, the Approve button under it already says so. A settled request still shows its *Approved* / *Not approved* chip, because that is a verdict and not a desk.
- **"Long leave"** leaves the panel on every screen that draws it (`FlagChips omit`), the director’s included — that queue is long leave by definition, and *19 days* three lines down is the fact the chip was pointing at. It stays in the queue table’s *Watch out for* column, where it tells one row from another.
- **The settled verdict is named once.** The signature list now stops one short of the hand the verdict box beneath it names, so "Anjali Deshpande approved · 8 August" and "Approved by Anjali Deshpande on 8 August 2026" no longer sit three lines apart.

Verified: 68 role/screen pairs OK; DH-02, PR-03, DR-02 and HR-28 checked with no page errors and no raw keys; escape and accent checks clean.

### Amendment DF — the request panel, shortened (2026-10-19)

*Ruling (designer):* "in principal user, remove unnecessary information and shorten down the content
inside the request div next to your decision table in the leave module — right now too much info regarding
leave is there with no proper UX, layout and hierarchy."

`LeaveFlow.RequestPanel` is one component serving **DH-02, PR-03, DR-02, HR-28 and a head's own leave**, so
all five shorten together.

**The heading** — was *Request LR-0331* over the designation; is **the person's name** over the
designation, with the reference quiet in the corner.

**One row of chips** — the state, the leave type and the flags were three separate blocks; they are one
wrapped row. The flags the panel states precisely as facts of its own are dropped from it: *Balance is
short* over *Unpaid · 1 day has no balance behind it* is the same sentence twice, and *Cover gone* over the
*Cover* row likewise.

**The chain → the signatures.** *Where it stands* was six lines: who applied (the byline already says it),
who approved, whose desk it is on (the chip already says it) and who comes after (the line under the
buttons already says it). It is now one line per signature already on the paper — *Anjali Deshpande
approved · 10 August*. The full `ChainTrail` is untouched and still drawn on EMP-18, where following the
chain IS the job.

**Both inside headings go** — *Where it stands* and *Your decision*.

**Shorter copy** — the reason's byline drops the name now that the title carries it (*applied 10 August*),
and *Also away* names people instead of listing their windows (*Meera Joshi, Rahul Verma and 1 more*);
whose window is which is what the campus calendar beside it is for.

The panel falls from ~660px to ~430px on PR-03 with nothing a decision needs removed.

Verified: 68 role/screen pairs OK; the four screens that draw this panel checked with no page errors and
no raw keys; escape and accent checks clean.

### Amendment DE — the department's leave, same clothes (2026-10-19)

*Ruling (designer):* "do the copy thing the same for leave · your department section as well, under the
figures."

DH-02's *Your department's leave* band becomes `FigureBlocks` like the three day-bands before it, and its
four explanatory notes become informational lines:

| figure | was | is |
|---|---|---|
| Waiting on you **6** of 17 | "Nobody else can move these along." | *Ananya Rao, Karan Mehta and 4 more* |
| Days asked for **17** days | "Across the requests waiting on you." | *Longest 5 days · Sanjay Verma* |
| Sent upward **4** of 17 | "Approved by you and now with the principal or the director." | *Priya Nair, Karan Mehta and 2 more* |
| Settled **7** of 17 | "Approved, refused or withdrawn — here to follow, not to decide." | *4 approved, 2 not approved, 1 withdrawn* |

Each figure is now out of the department's 17 requests and carries its own meter; *Days asked for* is
measured against all the days the department has asked for this session. The subtitle went too — it listed
the three columns underneath it, which the columns already say.

**The settled line names every outcome the figure counts.** "4 approved, 2 not approved" under a 7 is six,
and a reader who adds them up has caught the screen lying; the withdrawn one is named.

The foot survives, because it is the only line here that is not a figure at all: *up to two days, your
answer ends it; from three days, approving only sends it on.*

Verified: 68 role/screen pairs OK; DH-02 at 1440 / 1180 / 1024 / 900, light and dark — no page scroll, no
page errors, no raw keys; escape and accent checks clean.

### Amendment DD — a day in the leave balance's shape (2026-10-19)

*Ruling (designer):* "i dont like this UI of everything in one line for figures — use the same layout as
we are using in the leave module, with figures and sub text beneath the figure with coloured bars. Only
remember, the text and copy under the figures should not be explanatory, it should be just
informational."

#### `FigureBoard` → `FigureBlocks` (kit)

The leave balance's anatomy, for any day: a column per figure divided by a hairline, the name over it, the
count with what it is out of, **its own meter** in the state's colour, and one line underneath. One meter
a column rather than one stacked bar across them — these are four readings of one roll, not parts of each
other.

**The line is informational, never explanatory.** It names the people the figure counts (two, then "and n
more"), or where names say nothing, the other fact about the same figure.

| | figure | line |
|---|---|---|
| My team · At school today | On time 6 of 10 | *3 marked remotely* |
| | Late in 1 of 10 | *Karan Mehta* |
| | On leave 1 of 10 | *Divya Kapoor* |
| | Not in 2 of 10 | *Ananya Rao, Sanjay Verma* |
| DH-01 · Who is in today | Present / Late / On leave / Absent / Missing punch, each *of 9* | the names |
| DH-03 · The department today | In school 6 of 9 | *5 on time, 1 late* |
| | Exceptions 4 *to clear* | the teachers carrying them |

*Marked remotely* is no longer a column: it counts people the other columns already count, so it is the
line under *On time*. DH-03's *Exceptions* keeps a hollow dot and is measured as the share of the
department carrying one, because it counts events, not people.

#### One person, one surname

The register had Divya as **Kapoor** and the shared roster as **Kamath** — the same id, two names, and now
two screens showing both. The roster takes the register's spelling, which is also group admin's, HR leave
& attendance's and HR reports'.

Verified: 68 role/screen pairs OK; My team both roles and the two DH screens at 1440 / 1180 / 1024 / 900,
light and dark — blocks wrap without a dangling hairline, no page scroll, no page errors, no raw keys;
expander 3 → 9 → 3; escape and accent checks clean.

### Amendment DC — the figure board, and the dates on the right (2026-10-19)

*Ruling (designer):* "i dont like this UI of everything in one line for figures, use different UI · shift
all the dates to the extreme right and keep the names at the left for the team calendar section."

#### `FigureRow` → `FigureBoard` (kit)

One line of big figures was dense but structureless. The board is the third instrument between that and a
`MetricStrip`: **a ring on the left** of the states that cannot overlap, with the ratio that matters in
its middle (*7/10 in school*), and **the figures as ledger rows** beside it — dot, word, count, each on
its own rule — wrapping into as many columns as the card is wide. A figure that counts people the ring
has already counted (*Marked remotely*, *Exceptions*) takes a hollow dot and no arc. A nought is faded,
never dropped.

Used by **My team · At school today**, **DH-01 · Who is in today** and **DH-03 · The department today** —
and the two DH screens now tell the day in exactly the same shape.

#### Team calendar — names left, dates right

The discs are pinned to the card's **right edge**; the names hold the left, and the space between them is
the column the eye travels. The month in words moved back under the name it belongs to. Nothing else
changed: 1–today, 27px discs, two-letter weekday heads, today ringed and dotted, three rows deep with
*Show all 9*.

Verified: 68 role/screen pairs OK; My team both roles and the two DH screens at 1440 / 1180 / 1024 / 900,
light and dark — no page scroll, no page errors, no raw keys; expander 3 → 9 → 3; escape and accent
checks clean.

### Amendment DB — the team's calendar, and two emptier bands (2026-10-19)

*Rulings (designer):* "in team calendar, i need potential gap between the names and the calendar, cut down
some dates and give more space and also remove YOU from team calendar, dont show the user days and info,
only the team" · "in the depthead dashboard the who is in today section on the home screen is pretty empty
in terms of UI, redesign and rethink the UI and remove this text *August so far · Counted from the same
day-by-day record Dept attendance draws, so the two can never disagree.* — same for the department
attendance."

#### New kit part: `FigureRow`

The strip's sibling, for figures that are one sentence rather than four readings to be weighed: count and
word together, a dot in the register's colour, the partitioning figures drawn once as a bar beneath, a
ratio or a subset past a rule with `bar: false`, a nought faded rather than dropped. My team's *At school
today* now uses it, and so do both of the head of department's day-bands.

#### EMP-20 / DH-05 — Team calendar

- **The reader is off it.** Her own month is My attendance, where the actions are; this section is the
  people around her. With her gone the *You* chip goes too, and the expander reads *Show all 9*.
- **The dates stop at today** (1–11 August). Twenty columns of unlived dates were taking the room the days
  that happened needed. Discs 23 → 27px, numbers 10.5 → 11.5px, columns up to 56px wide.
- **The gutter between the names and the grid is 28px** (was 12), and the name column now carries the
  designation instead of the counts.
- **The month in words moved to the right-hand edge** — "5 present · 3 late" — where the unlived dates
  used to be. Nothing scrolls at 900px any more.

#### DH-01 — Who is in today

Was: one figure about this morning (*in school 6/9*) beside four about the month, a bar drawn across the
month figures, and a foot explaining which was which. Now: **the morning in one line of figures** —
Present · Late · On leave · Absent · Missing punch, five states that cannot overlap, over their own bar,
with *6/9 in school* past a rule and no band of its own — and **the month in one quiet line of words**
under a rule: *August so far · 68 days present · 5 late arrivals · 1 day absent · 4 missing punches*.
The provenance sentence is gone.

#### DH-03 — The department today

The same treatment: *6/9 in school* past a rule, then Late · On leave · Absent · Exceptions, no bar (these
are not a partition — the ratio counts the people the states already count, and exceptions counts events
and overlaps absent). The four per-figure sentences are gone, and the foot keeps only the half that
changes what she does: *A correction belongs on the person's row, not here.*

Verified: 68 role/screen pairs OK; My team both roles and the two DH screens at 1440 / 1180 / 1024 / 900,
light and dark — no page scroll, no page errors, no raw keys, no trace of the removed sentence; expander
3 → 9 → 3; escape and accent checks clean.

### Amendment DA — the identity card (2026-10-19)

*Ruling (designer):* a reference screenshot of a profile card — large round face, big name, role beneath,
then *Location : … / Department : … / Email : …* labelled rows, with a small IN badge in the corner —
"use this as reference to cards and shift the employee section below this week section."

#### The card

Face **64px**, name at `h3`, designation beneath, then the facts **labelled**: *Department : Science*,
*Campus : Indiranagar campus*, *Joined : July 2014*. The day's status mark keeps the top-right corner
(the reference's IN badge), with *remote* and the *You* chip under it.

**What is not on it:** the reference's e-mail row, and with it phone, date of birth and staff number. A
colleague directory is not consent to circulate contact details; the month somebody joined is the whole of
what anybody needs about how long they have been here, and the day they joined is not printed either.

**Every card is 152px at every width and in both themes.** Three things were making them ragged, and all
three are fixed: the *You* chip in the name line (moved to the corner, where the column is shorter than
the facts and cannot set the height), the name row's height depending on whether it carried a chip
(`minHeight: 26`), and *"At school since : September 2016"* folding on the longer months (the label is now
*Joined*). Grid `minmax(380px, 1fr)` — three to a row at 1440, two at 1180 and 1024, one at 900.

#### The order of the screen

Figures → filter → **Team calendar** → **The people**. The month is the reading the screen is for; the
roster is who it is about and is the longer of the two. The roster's heading carries a second line only
when the filter has cut it down ("7 of 10, by the filter above") — the page heading already counts the
department. Filter, calendar and cards always describe the same people.

Verified: 68 role/screen pairs OK; both roles at 1440 / 1180 / 1024 / 900, light and dark — every card
152px, no page scroll, no page errors, no raw keys; every filter agrees across the pills, the calendar and
the cards; expander 3 → 10 → 3; escape and accent checks clean.

### Amendment CZ — the team calendar (2026-10-19)

*Ruling (designer):* a reference screenshot of a "Team calendar" — one row a person, the whole month
across it as discs — with "design something similar to this. also the cards are all bigger and not proper
in terms of UI alignment, height, padding etc, fix this and redesign the cards as well."

#### The section, rebuilt as the reference reads

*This week* becomes **Team calendar** (sub: *August 2026*). One row a person: a 30px face, the name, and
the month in words beneath it ("5 present · 1 late · 1 leave"); then thirty-one discs across the page.
Each column is headed by its weekday in **two letters** (Sa Su Mo Tu We Th Fr — one "S" over Saturday and
another over Sunday is a head that cannot be read), today's column is in the accent with a dot under it,
and today's disc is ringed. A day the month has not reached is dimmed; a day with no state is a plain
number.

The left column is a fixed 180px, so every row's 14th sits under every other row's. Below about 1100px the
strip scrolls **inside its card** — the page itself never scrolls sideways.

**The key** sits under the rows and names only the states the drawn rows are in (this month: Present, Late
in, On leave, No punch, Week off — nobody is absent, so *Not in* is not keyed). Its dots are the solid
state colours the figures at the top of the screen already use.

Still three rows deep, with *Show all 10* / *Show the first three*.

#### The card, made proper

Two lines and nothing else: **name + You chip**, then the **designation**. The campus line is gone — it
folded on the longer names, and one card taller than the two beside it was the whole complaint. Face 56 →
**52**, padding 18 → **16**, min height **84**; the day's status mark stays to the right of the name with
the quiet *remote* under it. Every card in the grid is now **86px**, at every width.

Verified: 68 role/screen pairs OK; both roles at 1440 / 1180 / 1024 / 900, light and dark — no page
scroll, no page errors, no raw keys, every overflow contained in the calendar's own scroller; expander 3 →
10 → 3; escape and accent checks clean.

### Amendment CY — the card is a card; the week is a section (2026-10-19)

*Ruling (designer):* "remove the days section from the cards and make a new section and show max 3
employees and rest in click to expand and then show the days and tracking etc for each employee, also
readjust the card UI, make the avatar bigger, put In next to the name div on the right and not below."

#### The card

Face 44px → **56px**; the day's status mark moved from under the name to the **right of it**, vertically
centred, with the quiet *remote* note beneath it. The week is gone from the card entirely. The foot now
carries the **campus only** — the page heading says the department and the designation says it again, so a
third printing was not a third fact. With a name and a state on one line the card wants width: the grid
goes `minmax(330px, 1fr)`, three to a row at 1440 instead of four, and card height falls 277px → ~100px.

#### The new section: *This week*

Under the roster, a card titled **This week** — sub *"Sunday 9 to Saturday 15 August"* — holding one row
per person: face, name, designation, the seven day cells (weekday letter heading the column once on the
first row, the date inside each cell, the state as a tint, today ringed, unreached days dimmed), and the
month in words on the right, "August so far · 5 present · 1 late · 1 leave".

**Three rows are shown**; the rest sit behind *Show all 10*, which toggles back to *Show the first three*.
The section follows the filter above it, so the figures, the pills, the cards and the week are always
describing the same people.

Verified: 68 role/screen pairs OK; both roles at 1440 / 1180 / 1024 / 900, light and dark — no overflow, no
page errors, no raw keys; expander goes 3 → 10 → 3; escape and accent checks clean.

### Amendment CX — the card carries the week (2026-10-19)

*Ruling (designer):* "not the full calendar — i dont need the full calendar for cards."

Amendment CW put a seven-column August in every card. It is correct and it is too much: ten whole months on
a page that opens nothing turns a roster into ten documents. The card now carries **this week** — seven
cells, the weekday letter above, the date inside, the state as a tint, today ringed, days the week has not
reached dimmed — and under it the month in one line of words, "August so far · 5 present · 1 late · 1
leave", with a nought never printed. Each cell keeps its date-and-state title, and the row keeps one
accessible name that reads the week out.

The whole month, day by day, stays where it is studied rather than glanced at: the employee's own register
(EMP-03) and the head of department's (DH-03).

Card height 367px → 277px. Verified: 68 role/screen pairs OK; both roles at 1440 / 1180 / 1024 / 900, light
and dark, no overflow, no page errors, no raw keys; escape and accent checks clean.

### Amendment CW — My team, read again (2026-10-19)

*Ruling (designer):* "use different ui style to show the day tracking inside the employee card, right now
this looks weird the vertical bars etc. also remove the sub description below the figures in the at school
today section and remove this 'as the gate and the app have it'. use different UI style to show the figure
as right now everything looks empty."

#### 1. The month in a card is a calendar

The thirty-one-bar strip is gone. Each card carries a real seven-column month — the weekday letter above,
the date inside the cell, the state as a tint behind it, today ringed in the accent — which is the grammar
the teacher's own month on Home already uses. Weekday-aligned on purpose: a seven-wide grid of days is read
as weekdays whether or not it was drawn to be. A day the month has not reached is dimmed rather than
filled, each cell names its date and its state in its title, and the grid keeps one accessible name. The
summary beside the month name now prints only what happened — "5 present · 1 late · 1 leave", and nothing
for a nought.

#### 2. The day is a line of figures, not a band

*At school today* was a five-column `Band`. A band is right when four readings must be weighed against one
another; this is five mostly-single digits saying one thing about one morning, and five sparse columns with
a sentence under each read as an empty form. It is now a card: the heading, the date on the right, then
*6 On time · 1 Late in · 1 On leave · 2 Not in │ 3 Marked remotely* on one baseline — count, colour dot,
word — over the one stacked bar of the four states that cannot overlap. *Marked remotely* keeps its hollow
dot and sits past a rule, because it counts people the bar has already counted.

**Text cut:** the five per-figure notes ("In before the grace period closed", "In, after the ten-minute
grace", "Approved, and already off the register", "Expected, and nothing marked yet", "In the app or on
the web, with a location check — not at a gate device") and the provenance clause "· as the gate and the
app have it". A label that defines itself says nothing.

Verified: 68 role/screen pairs OK; both roles at 1440 / 1180 / 1024 / 900, light and dark, no overflow, no
page errors and no raw keys; ten calendars per department, all card heights equal at every width; escape
and accent checks clean.

### Amendment CV — My team shows the day (2026-10-19)

*Ruling (designer):* "redesign this my team module with better UI, show the team individual team
calendar and also show data figures of employees on time today, late arrivals, leave, remote clock ins
etc. also show status of employees if they're in or not."

#### What the screen now holds

1. **At school today** — a `Band`: *On time* · *Late in* · *On leave* · *Not in*, four states that cannot
   overlap, drawn as the full-width bar; and *Marked remotely*, which counts people the bar has already
   counted, so it carries `bar: false`.
2. **A filter** — Everyone · In · Late · On leave · Not in, counted off the same rows.
3. **The cards** — face, name, designation, the day's status mark (*In · 08:05* / *Late · 08:41* /
   *On leave* / *No punch yet* / *Not in* / *Week off*) with a quiet *remote* beside a punch made away
   from a gate, then the month as a strip of 31 cells, the count in words, and department · campus at
   the foot. Still nothing opens.

#### Where the data comes from

The people are `window.LeaveFlow.PEOPLE`; the day and the month are `window.NaveyaDeptDay`, exported
from `pages/depthead.jsx` — **DH-03's own register**. The screen computes nothing of its own, so a count
here and a row there cannot disagree. Two fixes fell out of wiring them together:

- **DH-03 was missing two of her nine reports.** Science holds ten people and Anjali is one of them; the
  register listed seven. Rahul Verma and Suresh Kulkarni are added, so DH-03 now shows nine rows.
- **Ananya's August was told two ways.** DH-03 had her present on every working day; her own EMP-02 has
  her late on the 5th, missing a punch on the 6th, on leave on the 10th and not yet clocked in today.
  The register takes her own record, which is the one she can check.

The reader's own card is the one row that can change while the page is open, so it is read from
`window.NaveyaClock.myDayNow()` — `pages/attendance.jsx` applies the roster and the grace period where
they are defined, and answers in DH-03's vocabulary. Clocking in from Home moves her status mark, her
month strip and the *On time* figure together.

**Still deliberately absent:** the kind of any leave (health data), phone, email, date of birth, staff
number, salary, contract state, and any route out of a card.

Also fixed while the data was open: **DH-03's day band drew a bar over four figures that are not a
partition** — late sits inside "in school", exceptions counts events rather than people and overlaps
absent, and two of the day's states have no cell at all. On a day when six of nine were at school it
drew one amber and one crimson stripe across the full width. The four figures stay; the picture goes.

**Flagged, not fixed:** DH-03 and the shared roster disagree about four designations (it has Karan as PGT
Physics, the roster as TGT Chemistry, and similarly for Meera, Priya and Ramesh). My team shows the
roster's, which is the one the leave ladder, the cover requests and the celebrations card use.

Verified: 68 role/screen pairs OK; both roles at 1440 / 1180 / 1024 / 900, light and dark, no overflow
and no page errors; every filter returns the people the figures count; DH-03's nine rows and My team's
ten cards tell the same day; clocking in from Home moves the card, the strip and the figure.

### Amendment CU — My team, and the clock while it runs (2026-10-19)

*Ruling (designer):* "when clock in show the text in green, remove this text '07:48:18 left of the school
day' and only show the time countdown. i want you to now design a new module for employee called my team,
where show all the members of the team with only summary, the cards of employee should only contain their
name, photo, designation, department etc and no inside detail screen. also design the same for depthead
as there is no tracking for depthead who is on their team."

#### EMP-20 / DH-05 · My team — `design/v3/pages/team.jsx` · `window.Pages3.MyTeam`

One component, one route (`myTeam`), two rail entries. A teacher belongs to her department, so hers sits
in the YOURS half under `self.team.view`; a head of department is responsible for hers, so hers sits with
her own work under `dept.team.read`. No role holds both permissions, so it can never appear twice.

- The roster is `window.LeaveFlow.PEOPLE` — the same people the leave ladder, the cover requests and the
  celebrations card are built from, so a colleague's designation cannot differ between two screens.
- `repeat(auto-fill, minmax(248px, 1fr))`: four cards a row at 1440, three at 1180, two at 900.
- The card: face (initials on `avatarTone`, which is neutral in this palette and tinted in Mulberry),
  name, designation, then at the foot — pushed there with `margin-top: auto` so a row lines up whatever
  carries a chip — department · campus and *At the school since {year}*. The head of department and the
  reader carry a chip; nobody else does.
- **Nothing opens.** No panel, no row menu, no route to a record, no chevron.
- Count line: *10 people in Science* for a teacher; *10 people in Science — 9 of them report to you* for
  the head, so the number and the card count agree.
- Empty state for a person with no department (`tm.none`), which is the only way any other role can
  reach the route.

**Deliberately absent from DH-05's fuller spec,** at the designer's scoping: the route to a person's
non-PII record, the row menu (helpdesk ticket, appraisal actions), the CSV export, leave-balance
summaries, contract end, probation state and work contact. Also absent on governance grounds and not to
be added here: phone, email, date of birth, staff number (DPDP — a colleague directory is not consent to
circulate contact details) and any leave or absence state (a shared out-list leaks absence and leave
type; `leave.jsx` §8-F14).

#### EMP-01 · the clock card

`running` (clocked in, not yet out) paints the word, the stamp and the countdown `c.presentText`;
clocked out returns to ink. `att2.home.left` ("left of the school day") deleted — the counter stands
alone under the clock-in time.

Verified: 68 role/screen pairs OK; My team for both roles at 1440 / 1180 / 1024 / 900, light and dark,
no overflow and no page errors; both rails carry one entry each, in the right half; the clocked-in card
measures `rgb(36, 85, 54)` on all four of its texts.

### Amendment CT — Home's field, rebuilt around the clock (2026-10-19)

*Ruling (designer):* "the home screen of employee looks broken, fix this, the not clocked in yet box
looks buggy and out of place, redesign the full screen layout and see what fits best. in coming up in
science use Aug instead of full August."

#### EMP-01 Home

- The clock card leaves the page head and becomes the first card of the **right-hand column**. The page
  head is text again.
- The three columns are now one idea each: **her record** (August attendance, Coming up in Science),
  **what is coming** (Your leave, Holidays ahead, July payslip), **what is live** (Your day, HR has asked
  you for, Covering for colleagues). The payslip moved left; column heights at 1440 are 856 / 1000 / 1047.
- `flex: 1 1 0` → `1.15 1 360px` / `1 1 340px` / `1 1 340px`, and the row wraps. Below a 1252px window the
  live column takes `order: -1` through the product's one media query (`.nv3-live-first`, in kit.jsx), so
  a wrapped field opens on the clock rather than burying it under four cards. Three columns hold to
  1280; 1180 and below give two rows.
- Inside `HrRequestsCard`, the row wraps too: the status mark sits beside the document's name while both
  fit and drops under it when they do not, instead of squeezing "Bank account proof" to a word a line.

#### The clock card (`ClockHomeCard`, pages/attendance.jsx)

It had no icon chip and no title while every other card on Home has both, and it changed shape with its
state. One anatomy now, in all three: **icon chip + "Your day" + a status mark** in the header, then a
word for what the figure is, the figure, a rule, the one fact that follows, and the button if there is
one.

| | header mark | word · figure | under the rule |
|---|---|---|---|
| not clocked in | *Not clocked in yet* | Rostered · `7:45 AM – 3:30 PM` | **Web clock-in** + the gate line |
| clocked in | *Early · 5m* / *On time* / *Late · Nm* | Clocked in · `7:40 AM` | the live countdown + **Clock out** |
| clocked out | — | Clocked out · `3:34 PM` | *{d} on the clock* |

#### Celebrations (leaveflow.jsx)

`MONTH_SHORT` (`lf.m.1–12`) for the 44px date block, matching the holidays card beside it. It is the same
card on all five dashboards, so Home, DH-01, PR-01, DR-01 and HR-01 all read *Aug*.

Verified: 66 screens OK; Home at 1680 / 1440 / 1280 / 1180 / 1024 / 900 with no horizontal scroll and no
compression — three columns down to 1180, two rows below, live column first; dark at parity; all three
clock states render and the countdown ticks.

### Amendment CS — The employee's eight screens, polished (2026-10-19)

*Ruling (designer):* "polish the full employee dashboard and remove unnecessary texts, rethink the
heading text to be more accurate to the section … remove the full today at school section from home
screen, design a new section but not full width instead to show the clock in info and only show the clock
in timing with current countdown … also give a button for clock out if there was a web clock in … remove
the actions column and shift all the actions inside the detail box … inside cover for colleague section
just give accept and reject on the table … remove the more column from your requests table."

#### EMP-01 Home

- The `TODAY` strip is gone, with `today.*`, `TODAY_ELAPSED`, `TODAY_EFFECTIVE`, `TODAY_FRAC` and the
  07:52 face-scan fixture. It contradicted EMP-02, which said she had not clocked in.
- `ClockHomeCard` is rendered from `pages/attendance.jsx` (`window.NaveyaClock.HomeCard`) beside the
  greeting, 316px wide: the state word, the stamp, a per-second countdown to the end of the rostered day,
  and **Web clock-in** or **Clock out** — the latter only because the punch was a web one; a gate punch is
  undone at the gate.
- `home.role` / `home.empId` ("PGT · Physics · NAV-0142") deleted from the page head.
- `hol.note`, `pay.noAmounts`, `pay.settledNote` and `lf.cel.note` deleted.

#### EMP-02 My Attendance

- `ClockStore` + `useClock` replace the page's local `live` state, so Home and this page hold one clock.
- The record's **Log** column and its `Kebab` are gone. `buildRowActions` now feeds `DayAction` rows in
  the day panel under *What you can do*, each closed one carrying its reason; the day with a missing
  punch tints its regularise row rather than hiding it in a menu.
- `Attendance visual` → **The day**; the three duration columns are right-aligned, and an em dash is faint.
- The attendance-request table's one-item menu → a **Withdraw** button on the row that has one.
- `MeasuredStat`'s bar: `c.accent` → `c.present`.
- One name for one act: *End shift* → **Clock out**, product-wide on this page.

#### EMP-05 Leave

- "When school cannot spare you" → **Dates to plan around** (it listed vacations too, which school can
  spare her for). "What you have" → **Your leave balance**. "Your requests" → **Your leave requests**.
  "Cover requests from colleagues" → **Classes you have been asked to cover**.
- The cover table answers from the row: **Accept** settles it; **Decline** opens the panel at the reason,
  because a refusal a colleague cannot plan around is worse than none. A clash states itself under the
  pair.
- The request list's **More** column, `buildRowActions` and `lv.hist.menuAria` are gone. Both items were
  dead weight: no request in this product sets `needsCover`, so "Nominate a colleague" was permanently
  disabled — and had it enabled, it called `h.cover`, which the page never defined.
- `lv.act.withdrawWhyApproved` ("Approved leave has already moved your paid days. Ask HR to cancel it.")
  deleted, with `withdrawWhyDone`, `lv.act.cover`, `lv.act.coverWhy`, `lv.act.trail`, `lv.bal.foot`,
  `lv.win.note`, `cv.menu`, `cv.notPending` and both sub-lines.

#### EMP-19 Loans and advances → Requests

`LoansTab` is still defined in `pages/emp-more.jsx`, beside the loan ledger and the pay-request queue it
reads, and exported as `window.NaveyaLoans.Tab` for `pages/emp-tasks.jsx` to mount as a fifth tab. Asking
the school for a loan is the same act as asking for leave or a claim. More is now **Tax, declarations and
the helpdesk**; the band inside the tab is **Where your loans stand**, and the card-sized empty state that
said nothing was being recovered came out — the nought above it already says so.

#### EMP-10 Documents · EMP-12 Requests

`doc3.reg.sub`, `doc4.sent.sub`, the detail panel's "Its history", `et.rb.sub` and `et.rg.histFoot`
deleted; `doc3.reg.footNote`, `doc3.det.appendOnly` and `et.doc.sub` cut to one line each.

Verified: 66 screens OK; all eight employee screens and every tab at 1440 and 1180, light and dark, no
page errors and no overflow; clock-in from Home ticks and agrees with My Attendance; Accept and Decline
settle a cover request from the row; no screen still prints the deleted sentences.

### Amendment CR — Every register opens on one frame (2026-10-16)

*Ruling (designer):* "go to registers module and inside the record go to payroll register and redesign the
internal screen based on the recently design payroll run, use information from that module and redesign
this section to show more info and less info at the same time. improve the UI of variance review internal
screen aswell. in fact redesign the internal screen UI of all the registers inside the rows of the table
while keeping simple functionality and UI to understand the context and do not make any screen
complicated to understand."

#### PY-18 · the frame every opened register uses

| | |
|---|---|
| **Lead card** | the register's one figure, the sentence that accounts for it, and three or four facts |
| **The rows** | heading = what a row IS; the register's own filters where it runs to hundreds of rows |
| **Foot** | the line that reconciles it · the pager · the run and configuration it derives from |

#### The three that were the run's screens

`PYParts.Register`, `PYParts.Variance` and `PYParts.PayPublish` (py-ops) are no longer mounted here.
`specRegister`, `specVariance` and `specBank` read `window.NaveyaRoll` for the campus and month the module
is scoped to, so the register and the run cannot hold two opinions of one payday. What went with them:
the variance threshold editor, bulk-explain, "complete the review", the register's verify/preview switch
and its two locked-state cards. Those are acts of a run and they stay on the run. `py-shelf` still mounts
the old screens; `py-ops` is untouched apart from exporting `PAY_POLICY`, `varDelta`, `varPct`,
`crossedBy` and `VAR_UNMOVED`, because a second copy of a threshold is a second answer to "did this cross
it".

- **Payroll register** — one row per person: name, staff number and designation in one cell, campus (only
  when both are in scope), pay group, paid days, gross, deductions, net. Search, pay-group chips, 25 a
  page. Held-back people are dimmed and carry the reason under their name. The totals row withdraws while
  a filter is on, because a total of something nobody asked for is worse than none.
- **Variance review** — `PR-2026-07 to PR-2026-08`, pinned to the pair of runs it compares and no longer
  dated by the period picker. One state column with three readings: *Explained*, *Needs a reason*,
  *Inside the gate*. The gate is stated with its policy version and named as the run's to move.
- **Bank file** — what leaves the bank, the register's net, and who is held back with the reason. The four
  hundred and eight ticks that said "in the file" are quiet text now; the four that are not are chips.

#### Also

Fifteen `rowsKey` headings; twelve leads over the existing specs; the generic totals label (which was
"Owed to the government", the statutory column's name) replaced per register; paid days now foots to its
own headline; `pyrp.reg.sub` ("15 shown. A row opens the register itself.") deleted; `Input` takes an
`ariaLabel` in the kit, because a placeholder is not a label.

#### The polish pass over the same fifteen

Four things the frame made visible, all of them older than it: `pyrp.h.first` and `pyrp.h.col.delta` were
called and never written, so headcount and cost printed **their own keys** at the reader;
`pya.q.st.withYou` was the same, and a request sitting with HR was being reported as sitting with payroll
(now *With HR* and *With this desk*); the statutory register listed ESI and ESIER as two contributions,
which is the one thing its two columns exist to prevent, and named none of them; and the overtime
register, dated by the period picker, put September claims under "August, across runs" (it is a position,
not a month's artefact, so it is a live register now).

Two more the frame exposed: the cost register drew a bar of each month's TOTAL, and five months of a
payroll are within two per cent of each other — five full bars, a picture of nothing. The bar draws the
STEP against the biggest step now, which is the column the row is actually about. And a change was drawn
in teal-or-purple on two registers and in plain ink on a third; the sign carries the direction on all of
them now.

Verified: all fifteen open with no page errors at 1440 and 1180, light and dark; tab order search → chips
→ pager; filter, search, no-hit, paging, April and one-campus scopes all read true; the row menu, its
export toast and Back all work; `PYPeopleChecksPass` true; 66 screens OK.

### Amendment CQ — The pay record opens on five rows (2026-10-16)

*Ruling (designer):* "keep the earning breakdown initially hidden and expand when the user wants to see it.
improve this modal UX wise and visually as there is no visual hierarchy right now."

#### At rest

| | |
|---|---|
| **Slab** (filled, no outline) | MONTHLY GROSS · the sentence that prices it · three facts |
| **The ladder** (outlined card, *Show every line*) | Gross · − Deductions · **= Net pay** · + What the school pays on top · **= Cost to the school** |
| **Two folds** | *Every revision* — "2 recorded · current since 1 Apr 2026" · *Filed in their name* — "UAN, ESIC, PAN, salary account" |

Ten rows of component detail left the resting state: five earnings, three or four deductions, two or three
employer lines. Each band's lines are under the row they add up to, and the row carries their count
(*5 components*, *3 come off*, *2 contributions*) so what is hidden is never a surprise.

#### The hierarchy, in three moves

1. **Zones** — the summary is a filled slab (`c.alt`, no border); the detail is outlined on `c.surface`.
   Four identical outlined boxes had no hierarchy whatever the type inside them did.
2. **Weight** — 34 for the gross, **22 for the net** on a `c.sunken` band, 17 for the four rows that feed
   them, 13.5 for the component lines. Two results are emphasised and they are the two a payroll officer is
   asked for.
3. **Silence** — the resting panel is five money rows and two closed sections, and ends in open space.

#### The disclosure

One shape, used five times: the whole row is the button, `aria-expanded` + `aria-controls` point at a
`role="region"`, and a new **`chevron`** glyph in the kit turns 180° (`arrow` laid on its side reads as a
download). A panel portals outside `.nv3`, so the stylesheet's `prefers-reduced-motion` rule does not reach
it — the component asks `matchMedia` itself.

#### Also

*Deductions* counts only what comes off (3), not the "not applicable" ESI line that is shown with it.
*Net pay* and *Cost to the school* each carry the derivation in a note — "the gross, less what comes off
it" / "the gross, and what the school adds to it" — because both descend from the gross and a reader
should not have to work out that the cost is not the net plus the school's share.

Verified: tab order Close → Show every line → the three bands → the two foot links → the two folds →
Export → Ask HR, Enter opens a band, Escape still closes the panel; eleven people at 1440 and 1180 light
and 1440 dark, every band and both folds open — no overflow, no page errors. Full sweep: 66 screens OK.

### Amendment CP — The pay record is one table in a panel (2026-10-16)

*Ruling (designer):* "redesign the pay record of staff screen in the staff register module, right now the
information is too differentiated between multiple sections, i dont need a detail screen as a whole i need
a side modal on the staff register screen with the table of info of the pay record."

#### What was wrong

PY-05's detail was a **screen** of seven cards: a five-cell metric strip (gross, net, deductions, cost,
days) · the breakdown as **three columns side by side** · the 50% rule with a stacked bar and a legend ·
the salary history · "this month" · the identity numbers · an actions card. Four of those cards carried
money, and the three columns are three tables with **no arithmetic between them**: nothing on the screen
said the middle column subtracts from the left one.

#### What it is now

A **SideScreen of 720** over the register, with the row it came from highlighted behind it (`aria-current`).

| Was | Is |
|---|---|
| 5 MetricCells | **One Lead**: MONTHLY GROSS, the sentence that prices it, and three provenance facts — this month · last revised · excluded from wages |
| 3 columns + 6 subtotal rows | **One ledger**: What · How it is worked out · Amount, in three bands, closing on the net and on the cost |
| The 50% rule as a card with a bar | One fact, checkable against the rows: every earning line says whether it **counts as wages** |
| Salary history | **Every revision** — and it now includes the proposal with the checker and the one sent back, which the screen never showed |
| "This month" card + "nothing attached" + identity card + actions card | A fact, a foot line, one block, and the panel's footer |

The earnings band carries **no total of its own**: it says *they come to the gross above*, so the figure in
the headline is not printed twice. The only repeated figures are the two the arithmetic has to close on.

#### Four things the redesign caught

1. **A null `augPaid` is a full month** — `py-salary.paidDaysOf()` reads it that way; the screen printed an
   em dash for nine people out of eleven.
2. **A derivation that quotes a figure is checkable.** "12% of ₹21,600.00" sat beside ₹1,680.00, because
   `SIM` prices a whole pay group at its sample person. Every `how` now states the rule, not the sum. The
   underlying seed is **flagged, not re-priced**: the administration group's PF, ESI and employer shares are
   the sample person's, and ESI applies to the group although no member is under the ₹21,000 wage ceiling.
3. **Visiting faculty are not missing a salary.** They were told "No salary assigned — this person will not
   be paid until a salary row exists"; they are paid by the hour, and the panel now says at what rate, with
   what monthly cap, and where the rate lives.
4. The employer rows had an **empty derivation cell**; they now say they are the school's side of the
   deduction above.
5. **The register said the same thing the record used to.** `stateOf()` called an honorarium "unassigned",
   so the band counted **two** people who would not be paid while the handover card above it named **one**.
   Visiting faculty are a state of their own now — *Paid by the hour*, sorted last, with *Open Pay rules*
   as their row action — and the band reads 10 on payroll, 1 with no salary, which is the card's figure.
6. The register's state **filter** was dead code: the band dropped its chips two rounds ago and nothing has
   been able to set it since. Removed, with the empty state reworded off it.

#### The route

`pyRecord` is no longer a screen of its own: it renders **PY-05 with one record open**, so the run's
*Open pay record* link hands the id over exactly as before and lands on the register with the panel over
it. Verified: the handover is consumed once, the panel opens, the row behind is highlighted. Reached from
the register row, the row's action menu, the proposals tab and the deep link; verified on all eleven people
at 1440 and 1180 light and 1440 dark — nothing crosses the panel edge, no page errors. Full sweep: 66
screens OK.

### Amendment CO — The approval gate reads like the run it is approving (2026-10-16)

*Ruling (designer):* "inside pay request module of HR the side modal has too much width, decrease the
width. what u did for the payroll officer yesterday all the changes to the payroll run, i want you to
redesign the approval module of accountant based on those context of payroll run and how it is happening,
show details of staff to accountant aswell and redesign this module to keep less description and content
and more open spaces for more visual stability."

#### HR's panel

840 → **700**. The record was four figure cells wide when it was built for a page; it is one figure, a
sentence and two facts now, and it does not need the width. Re-verified on all four tabs at 1440 and 1100,
light and dark.

#### AC-02 — what was wrong

**No people.** A checker releasing **₹1,55,73,560** of salary was shown four summed lines — gross,
deductions, holds, net — and *not one name*. The whole constitutional point of a second signature is that
somebody looked. The run console the maker worked on lists all 253; the gate listed none.

**The figure, four times.** The head card carried ₹1,55,73,560 with a note under it; the queue row carried
it; the register evidence tab added it up to the same number again; the confirmation restates it. The
head's own note said so: *"This is the figure the confirmation will restate. Read it, not the summary."*

**Seven paragraphs of instruction.** The page sub · the queue sub · *"Nothing here changes while it
waits…"* · *"Computed on v2026.3, in force from…"* · *"Approve stays closed until you have opened every tab
here. The whole point of a second person is that someone looked."* · *"A checker never edits. Changing a
figure here would make you the person who prepared it…"* · *"This trail is append-only…"* · *"Gross minus
deductions is the net…"* · *"This tenant requires a second approver on settlements…"*. Every one explains a
control that is already visible and already refused with its reason printed beside it.

#### What it is now — the run-open shape

| Was | Is |
|---|---|
| Head card: TitleMark + h1 + 3-cell fact grid + right-aligned figure + note + 2 chips + 2 paragraphs | A **heading row** (`Payroll run` / `PR-2026-08-IND · August 2026 · Sunrise Education Trust` / state + Locked) |
| Sign-off card: title + two tinted panels, ~80 words | Three **facts** under the headline: Prepared by · Released by · Rules |
| Register evidence tab (4 summed lines) | **The people** — 253 named rows whose total row *is* that ladder |

The headline is one figure and the sentence that accounts for it: **"250 of 253 people are paid. Gross
₹1,90,00,248.00, less ₹33,17,588.00 deducted and ₹1,09,100.00 held back."**

#### The people

Sourced from **`window.NaveyaRoll`** — the store the run console writes to — never a second seed. Both
agree exactly: 253 heads · gross ₹1,90,00,248 · deductions ₹33,17,588 · net ₹1,56,82,660 · employer
₹11,21,352 · payable ₹1,55,73,560. Searchable by name or staff number, cut by pay group, with a **Not
being paid** chip; 20 rows at a time with *Show 233 more*; the total row carries the filtered subtotals.

The reimbursement batch gets the same treatment from **`Pages3.PYAdjData.CLAIMS`** — 31 named claimants
with their claim ids, summing to the batch's own ₹2,68,450 and matching its category counts (5/9/6/7/4).

One predicate governs "not being paid": `heldKey || !(net > 0)`. Before it, the chip counted 2 (the holds)
while the headline said 250 of 253 — **Meena Reddy** has nothing due, which the roll's `payees` already
counted out. The row now reads *Nothing due*.

Verified on all ten queue items across the three buckets, every evidence tab walked, at 1440 and 1180,
light and dark: no horizontal scroll, no page errors. Full sweep: 66 screens OK.

### Amendment CN — The band over HR's four tabs says where the work is (2026-10-15)

*Ruling (designer):* "improve the copy of the section where every request stands for all tabs inside pay
request, remove the description below this main text and what is asked for?? use better info to show inside
these figures."

#### What was wrong

**The sub-description** taught the chain — *"One chain, four kinds. Raised, you verify, payroll decides, a
run pays. Returned went back to the employee; declined stopped, and the record says where."* — to somebody
who has worked this queue every day for a year, and the figures underneath named the same stops anyway.

**`ASKED FOR — ₹5,93,450.00`.** Four kinds of request added together, minus overtime, which carries no
rupee figure at HR's desk *on purpose* — so the metric shipped with a footnote admitting it was incomplete.
HR does not approve money; payroll does. A figure this large, this prominent, that nobody can act on and
that is knowingly partial, is the worst cell on the screen.

**`LONGEST WAIT — 58 days`**, and the 58 days belonged to LR-0044, which is **with payroll**. The most
alarming number in the band was about a request this operator is not allowed to touch.

#### What it says now

| Figure | Today | The line under it |
|---|---|---|
| Waiting on you | 9 | Nothing moves until you verify one. |
| With payroll | 6 | Verified by you. Only payroll can move them now. |
| Back with the employee | 2 | Sent back and not corrected yet. The oldest has been there 19 days. |
| Longest on your desk | 7 days | Ananya Rao, Reimbursements |

The first three are **one population cut three ways** — 9 + 6 + 2 = the 17 open requests — so the bar
underneath is those three segments and nothing else. Days are not a share of a count, so the fourth carries
no `n` and takes no segment, which is the convention the hollow marker already signalled.

"Back with the employee" earns a figure where the old "asked for" did not, because it is HR's to chase: HR
sent those back, and nobody has corrected them. "Longest on your desk" now ranges over **`mine` only**.

#### The rule moved to the foot

A claim with no bill cannot be verified at all — only sent back. That is the one fact on this screen that
changes which button gets pressed, and it is a rule with a count attached rather than a metric, so it sits
on the band's foot: **"A claim with no bill cannot be verified, only sent back. On your desk today: 1."**
With a clear desk the foot does not render at all.

Verified at 1440 and 1100, light and dark, and with the queue drained (0 on the desk, 0 back with
employees): every empty state reads, no page errors. Full sweep: 66 screens OK.

### Amendment CM — HR's four requests read like payroll's five (2026-10-15)

*Ruling (designer):* "now check the arrears module and fix its UI and also do the sidebar changes of UI to
apprisal cycles aswell. do the same for the full all tabs of the pay request modal of HR, do it for
reinburstments, loans and advances and overtime and apprisal."

#### The arrears record says where it stands

AR-2026-10 opened with three bare figures and went straight to the month-by-month split — the one part of
that screen that was already right — and never said the three things a reader opens an arrears computation
to learn: **where it stands** (the list said Draft; the record said nothing), **who has it** (a computation
awaiting a checker is waiting on a named person; a posted one went into a named run), and **what it covers**
(the range was in the list and not in the record).

It leads with the gross now, says the range and the people in a line, and carries the chain as three facts:
*Where it stands* · *Worked out by* · *Posts to* — each with a note that says what that state means
("Nobody has been asked to check it yet", "{who} has to agree before it posts", "A run is chosen when it is
submitted"). The split table and the excluded-months card are untouched.

#### A rise record carries one figure, and whose desk it is decides which

The payroll rise record showed `+8%` at `fig("xl")` and, below it, a new gross of ₹1,02,384.00 at the same
size. Two headlines on one panel make the reader rank them. Payroll's act on a rise is turning a percentage
into components, so **the gross those components must add to is the figure**, the percentage drops to a
fact, and the head card does not render for this kind. "WHOSE RISE — Ananya Rao", two inches under a panel
titled *Ananya Rao*, is gone; the percentage took its place.

#### HR's four tabs

The panel landed one amendment ago; the CONTENT inside it had not changed. It was still the full-page
record in a 760-pixel drawer: a hero with a segmented bar and a row of coloured legend chips, a second bar
for loan exposure with three more chips, three tinted figure cells for the cost of a rise, and six amber
meters for overtime. Every one of those is a quantity drawn in colour, which this module retired three
rounds ago, and every one repeats in a bar what the sentence beside it already says.

Each kind now leads with **one figure, a sentence and two facts**:

| Tab | The figure | The sentence | The facts |
|---|---|---|---|
| Reimbursements | Amount claimed | It is the employee's figure; send it back to change it | Yearly cap (+ unused / over) · Category |
| Loans & advances | Amount asked | Over the {n} months they asked for, about {emi} a month | Already running (+ the loan id) · Monthly gross |
| Overtime | Hours | Who has touched the figure — raw, verified in full, or cut | Evenings worked · Rostered that month |
| Appraisal rises | The percentage | {gross} now, {inc} more every month once it lands | A new gross of · Over a full year |

`LoanExposure` and `RiseCost` are gone outright: their content is two facts each, and two facts do not need
a card with a bar in it. The claim's bill stays a tile, because an empty tile is the fact.

**Overtime is the evenings**, the same table payroll reads on the other side of the handover — *3 September
2026 · 08:05–19:40 · 8 h rostered · 3.5 h over* — so HR verifies against exactly what payroll will price.
The column is headed **Rostered that day**, because its total (48 h across six evenings) is not the month's
192 h and must not be read as it. The six amber meters are gone.

Two pieces of stale copy went with them: the overtime note still sent the reader to "the pinned
configuration", which the registers stopped having in amendment CI, and the rise note still said "the
figures below it" after they moved beside it.

Verified on all nine record types (payroll's five, HR's four) at 1440 and 1100, light and dark: no element
inside any panel crosses its edge, and no page errors. Full sweep: 66 screens OK.

### Amendment CL — The panel's figures fit it, and overtime shows the evenings (2026-10-15)

*Ruling (designer):* "the UI is broken in the adjustment side modal — the figures are out of the div. Also
use a better way to represent the data of overtime instead of colours and figures."

#### What broke, and why

The figure rows in these records were written for a page 1,560 pixels wide and, one amendment earlier, moved
into a panel 760 wide. Four cells of `minmax(140px)` leave roughly eighty pixels of content each once
padding and swatch are taken off; `₹4,653.88` is wider than that, so it rendered **five pixels outside the
panel** (measured: `[612..765] of 760`).

A record now leads with **one figure** at a size the panel can hold, a sentence, and two or three plain
facts — the `Lead` component. The coloured meter under each number went with them: four tinted rules in a
drawer were the same wallpaper the run had, in a smaller room. `Figures` survives for the one record that
genuinely compares three amounts (a claim: claimed = taxable + exempt), now at `fig("md")`, wrapping, with
no meters.

Verified at 1440 and 1100, light and dark, on all five record types: no element inside any panel crosses its
edge.

#### Overtime is the evenings somebody worked

The card read: `11 h` · `₹211.54` · `× 2` · `₹4,653.88` — four equal cells with four swatches, answering
none of the questions an overtime claim actually raises. The register has carried `days` on every claim
since it was written: the date, the punch in, the punch out, the rostered hours and the hours over them.

So the record is that table — *6 Aug 2026 · 08:00–19:00 · 8 h rostered · 3 h over* — with its own total, and
the arithmetic is one line under the headline (*"11 hours at ₹211.54 an hour, times 2"*). Where HR verified
fewer hours than the days add to, the foot says so and whose figure governs: **"HR paid fewer hours than
these add to — their figure governs."**

### Amendment CK — Adjustments: a panel beside the list, and a waiver that waives (2026-10-15)

*Rulings (designer) on PY-13/14/15:* "inside loans and advances I want the full functionality as to what
happens when I waive an instalment, and I cannot foreclose the loan until it is fully paid — remove that
option"; "the code is bugged when I want to see the detail screen of claims, the screen is empty"; "for the
other modules like overtime, when I click on the row I am taken to a screen — eliminate a new screen and
open a side modal on the same screen for the details, and do the same for appraisal and also loans and
advances and claims"; "in loans and advances and claims I see the figures with no description inside the
bars section, where approved loans has 31 ... same inside what is being recovered".

#### The claims detail was a reference error

`PYAdjust` read `CLAIMS` when the filtered list is a **local inside `ClaimsTab`**, so opening a claim threw
`ReferenceError: CLAIMS is not defined` and React rendered nothing. One word — `A.CLAIMS` — and the record
is back: the amount, the taxable and exempt split, the category, who approved it and when, and the batch it
sits in with the control to take it out.

#### A record opens beside its list

All four — loans, claims, overtime and appraisal rises — open as a `SideScreen` over the list instead of
replacing the page. The list keeps its scroll, its filter and the row you were on. The one question a
record may ask (price these hours, settle this rise, decline it) became a **dialog over the panel**, because
a drawer over a drawer is two of them fighting.

#### Waiving an instalment does something now

The old panel explained the difference between deferring and waiving beautifully and then set a flash
message and left the loan untouched. Both verbs now live on the register in py-ops, and they differ in the
one way that matters — whether the money is still owed:

| | Comes off this month | Balance | Instalments still to recover |
|---|---|---|---|
| **Defer** | nothing | unchanged — they still owe it | unchanged; it moves to the end |
| **Waive** | nothing | down by one instalment, never recovered | one fewer; it is forgiven |

The panel shows those three figures for the option in hand before it is taken. `loanOutstanding` learned
the difference (`tenure − paid − waived`), so every screen that reads it is right without being told: the
register, the run's loans tab and PY-18's loan report. The loan remembers what happened, when and why, in
its own words under the facts — *"One instalment waived in 11 Aug 2026 — ₹16,500.00. That money is not owed
by anybody. 'Hardship after the flood'"* — and the schedule marks the forgiven row. The roll is reset on
each decision, so the run quotes the new instalment rather than yesterday's.

**Foreclosure is gone** — the control, the panel and its strings. The `foreclosed` state stays on the one
loan that was foreclosed before this ruling, because it happened.

#### Every figure carries its line

Three strips had one cell with a note and the rest bare. *Approved claims 31* now reads **"Approved by a
head of department, not yet paid"**; *people owing 17* reads **"Running, at exit, or waiting on approval"**;
*still to recover* reads **"Principal and interest, less everything recovered"**. The zero cases say why
they are zero.

### Amendment CJ — Every figure says what it is, and paid days leaves the rail (2026-10-15)

*Rulings (designer):* "the 0 is just there and doesn't signify anything and there is no supporting text, fix
this"; "inside run history I need a functionality to see the details of that run of the campus I want to";
"the paid days module is only there for HR, the payroll officer doesn't have anything to it, remove this
module"; "in staff and salaries 'who is set up to be paid' rename this section heading, and the figure 9 is
just floating with no text what it denotes".

#### One note or none

Two strips had a single cell with a line under it and the rest bare, so the bare ones read as unfinished —
and the bare one that hurt most was a zero, which means nothing at all until the reader is told what there
is none of.

| Strip | Was | Now |
|---|---|---|
| PY-18 registers | `0` with nothing under it | `0` · **Nothing until PR-2026-08 is approved** |
| PY-05 salary register | `9` with nothing under it | `9` · **Priced, and the run can pay them** |

Every cell in both strips now carries its line, zeros included, and the zero cases say why they are zero
(*Nothing dated ahead*, *Every basic is under half*, *Every register here is final*). PY-05's band heading
became **Who can be paid this month** — the old one described a setup step rather than the question the
figures answer.

#### Run history opens a run

It listed ten runs and offered no way into any of them. A row now hands its campus and month to the run
screen (`window.Pages3.pyRunAt`), which is the same screen the run list opens — one object, two ways in —
and the table says so under its title.

#### PY-08 leaves the product

Paid days was a payroll-officer rail item and nobody else's: the `payroll.paiddays.read` permission existed
for that one role. But paid days are HR's record — they come off attendance and leave, both of which HR
owns — and the officer reads them rather than keeping them. The rail item, the permission, the route and
the 360-line screen are gone. **The figure did not go with them:** PY-18 carries a Paid days register, and
the payroll home's paid-days panel (which shows the month's loss of pay, the thing a run blocks on) now
opens there.

### Amendment CI — The registers say what they hold, and a payday moves five things (2026-10-15)

*Rulings (designer):* "fix the UI and the UX of the register tab inside the registers module — all the
information on the internal screen of the register is incorrect ... in run history I only see figures and
not more info of run type, staff etc. Also fix the figures inside the 'what is available for August'
section, rename this section and remove the sub text below the heading. The data and figures next to the
coloured boxes is not relevant to the registers — use proper data and no text as figures. What is pinned
configuration?? Remove this, only display what is in use. Inside payroll run I don't see overtime payroll
info??? And also appraisals? They are missing."

#### The strip was about the run, on the screen about registers

| Before | Now |
|---|---|
| **15** registers · **Provisional** · **₹2,56,02,850** net · **v2026.3** pinned configuration | **0** safe to send · **9** provisional · **6** live · **15** registers |

Two of the four were words set at figure size, and a bar drawn across them was 99% configuration version.
The strip counts the population the screen is made of, and its three parts add to its total exactly. The
heading is now `August 2026` with no sub-line; the period is the figure's subject and the filter below it
says so again. "Pinned configuration" left the strip entirely — it is not a phrase anybody outside this
codebase says — and the version each month ran on kept its place in the run history, where it is the reason
two months cannot be averaged, under the heading **Rules used**.

#### Run history lists runs

It listed five months of trust-level totals — a month, a net, a delta and a version. A run has been per
CAMPUS since Amendment CG, with a mode and a state of its own. The table now has one row per run:

> **Indiranagar** · August 2026 · PR-2026-08 — On Naveya — 253 people — ₹1,55,73,560.00 — v2026.3 — *Provisional*

Ten rows across five months, read from the run store and the roll so the register and the run module cannot
hold two opinions of the same payday, with a foot that still reconciles to what each month paid.

#### Overtime and appraisal rises reach the run

Both have been in the product for rounds — `NaveyaPayRequests` holds seven overtime claims with the hours HR
verified and the rate payroll priced them at, and the rises adapted from pay-handoff's proposals — and the
run, which is where that money lands, read neither. The roll attaches them the way it attaches a loan and a
bill, and the run grew two tabs. **They are not the same kind of thing and the run does not pretend they
are:**

- **Overtime is money.** Hours from HR, priced at not less than twice the normal rate (basic and dearness
  over 26 days and an 8-hour day), and the officer's only question is which payday it goes on — so it
  behaves exactly like a bill: *Pay with this run* or *Move to the next run*. Five states, and only one of
  them is a decision: **With HR** (hours unverified), **Waiting** (the officer's), **In this run**, **Next
  run**, and **Paid / On another run** with the batch named. A line already on a run is never offered for
  payment twice.
- **A rise is not money in this run.** It changes what somebody is ON, from a date, and every salary in the
  table above already carries it — adding its value here would pay it twice. The tab shows who has one, what
  it moves them from and to, and when it takes effect, and says in a line why there is no button.

Verified end to end: Shalini Nair's August overtime (11 h at ₹211.54 × 2) moves the headline from
₹99,20,190.00 to ₹99,24,843.88, the draft bar reads *One change is not saved · ₹4,653.88 added*, and the
tab's line becomes *₹4,653.88 in this run · ₹6,115.36 on another run*.

### Amendment CH — The payroll module gets its quiet back (2026-10-15)

*Ruling (designer), an hour after Amendment CG shipped:* "I don't like this UI with figures and lots of
colours. The older version was fine, right now it is too confusing — lots of different figures and pay
groups is making it all a bit confusing. Redesign it with simplification."

**They were right, and the fault was in how the last ruling was applied.** Asked for colour coding and bars
on the figures, I put a four-figure `Band` with a seamless colour bar on *every* strip in the module: the
run, the loans tab, the bills tab, the pay record, the list of campuses and the pay-group page. Then the pay
groups arrived as four cards each carrying their own money and their own share meter. A run therefore opened
on **eight figures and five coloured bars before a single person's name**.

#### What the module looks like now

| Screen | Before | Now |
|---|---|---|
| campus list | 4-figure band + bar, then a 3-row table | one table, one sentence under its title |
| a run | 4-figure band + bar, then 4 group cards with meters | **one headline** + one arithmetic line, with the pay groups as quiet chips inside the same card |
| loans tab | 4-figure band + bar | one sentence over the table |
| bills tab | 4-figure band + bar | one sentence over the table |
| a pay record | 4-figure band + bar | one headline + one line |
| a manual run | 4-figure band + bar | one headline + one line |
| PY-02/03/04 group | 4-figure band + bar | one figure + one line |

Counted in the browser: **0 bars and exactly 1 large figure** on every screen in the module, against 5 and 8
before.

**Nothing was deleted, only demoted.** Every figure the bands carried is still on screen — in the arithmetic
line (*250 of 253 people · earned ₹1,90,00,248.00, less ₹33,17,588.00 deductions and ₹1,09,100.00 held
back*), or in the table foot that already totalled it. What went is the second and third telling.

**The pay groups became a filter, which is what they always were.** A name and a count, in the same chips
the people table uses, sitting inside the headline card — because picking one re-points the headline at that
group (*TO PAY · ADMINISTRATION (CTC) ₹36,08,364.00*). A group's money is shown once, where money lives.
The all-groups chip reads "All groups" rather than "Every group" so it stops echoing the people filter's
"Everyone" directly beneath it.

**Colour is back to meaning state.** The status chips, the red on a late bill and on a blocking exception,
the amber on an unsaved draft. The only quantity still drawn in colour is the repayment meter in a loan
row — one thin teal rule per loan, which answers "how far through is this?" at a glance and is the single
piece of chart colour left in the module.

Kept from CG, because none of it was the problem: the separate run screen, the draft-and-save, the two run
modes, the month strip, the pay-group scoping, move-to-the-next-run, and the pay-group columns.

### Amendment CG — A run is a place, and there are two ways to run one (2026-10-15)

*Rulings (designer), on the screens Amendment CF had just delivered:* "I don't see the start payroll option
for the other month"; "inside loans and advances and reimbursements I don't see the pay group the employee
belongs to"; "remove the extras column inside who gets paid"; "I need proper colour coding and bar design for
the figures displayed"; "the pay group with figure below main to pay is underwhelming — I need proper UI for
that, so that when I select a pay group I see their full information of staff and all finance related
stuff"; "when a user clicks on open on any campus of payroll run I want you to open a NEW SCREEN and not a
section inside the same screen, this screen will have all the actions and it will be a save screen for any
action done inside the payroll — do the same for past payrolls as well"; "for the case owed since last month
add an option inside the actions to shift this to next run along with pay in this run, also colour code the
text"; "change the functionality of the payroll run entirely: when starting a payroll run the user gets
prompted whether he wants the automated payroll on the system or a manual payroll run ... inside the manual
one the user can download all data in excel format and then reupload and then send the payroll to the
accountant".

#### PY-07 splits in two, and a run gets a state of its own

| Screen | What it is |
|---|---|
| `pyRun` (PY-07) | the year, and one row per campus for the month in hand |
| `pyRunOpen` (PY-07 detail) | **one run**, with everything that can be done to it |

`v3/payrun-store.jsx` is new and holds every run: its campus, its month, its **mode**, its state, and the
work saved into it. The run screen edits a **draft** of that work — nothing reaches the run until Save is
pressed, the screen says how many changes are waiting, offers to throw them away, and asks before anybody
leaves with unsaved work. Send is off while the draft is dirty, because sending work that is not saved is
sending something nobody can point at afterwards. Verified: pay seven overdue bills, save, walk to the list
and back — the blocking count stays at 9 and the list's *To pay* has moved with it.

#### Two ways to run a payroll

Start now asks, in two sentences each, and the answer is fixed for that run.

- **On Naveya** — the roll on screen. Ask HR, pay a bill, move one to the next run, skip an instalment,
  settle a loan, pay an advance, send.
- **In a spreadsheet** — four steps, each locked until the one before it is done: download every row
  (`PR-2026-09-IND-staff.xlsx · 253 rows · 11 columns`, the columns named), fill it in wherever the school
  fills it in, upload it back, read **what changed** row by row (eleven rows, each with what Naveya had,
  what the sheet says, the difference and why), and send. Uploading a sheet nobody downloaded is the mistake
  that screen exists to prevent.

It is not the automated screen with the controls removed. A school that settles its figures elsewhere has a
different job, and sharing a layout between the two would make both worse.

#### Any month can be started

The strip offered Start on August alone, which made the other eleven months decoration. A month that has not
been paid and has not been started can be started; a run opened ahead of its month says plainly that it is
standing on today's people and today's salaries until that month has happened. Leaving a run returns to the
month that run belongs to.

#### The figures grew their colour

Every strip on these screens is now a `Band`: a swatch beside each figure and one seamless bar beneath, its
bands in the same colours and proportions. Three of them had to be re-thought first, because each was
drawing a part beside its whole:

| Strip | The composition that is true |
|---|---|
| the run | to pay + deductions + held back = **what leaves on payday** |
| a loan | coming off this month + left after it = **still owed** (an advance paid out takes no band) |
| a pay record | takes home + what comes off = **earned this month** |

The run's total is what LEAVES rather than what was earned, so adding a bill — money the run pays that
nobody earned as salary — cannot break the identity; the deduction figure is derived from the total and
falls by itself when an instalment is skipped.

#### The pay groups became a control

Three chips naming what each group cost, and nothing to do with them. They are now cards with a share meter,
and picking one scopes the whole run to that group — the headline, the people, the loans, the bills. Each
card shows what its group PAYS, so the cards add to the headline exactly (1,16,82,231 + 36,08,364 + 2,82,965
= 1,55,73,560) and the screen carries one big figure instead of two that differ.

#### Smaller, and asked for

- The **Extras** column is gone from *Who gets paid*; what is going on beside a person's salary is on the
  two tabs and in their record.
- **Pay group** is a column on the loans table and on the bills table.
- A bill owed since last month can be **moved to the next run** as well as paid with this one, and the four
  states are colour-coded apart: late is red, waiting amber, in this run green, next run purple.
- PY-02/03/04's group figures carry the same colour and bar.
- "1 bills" became "One bill".

### Amendment CF — A payday moves more than salary (2026-10-15)

*Rulings (designer), the same day, on the screens Amendment CE had just rebuilt:* "right now all I see is who
gets paid and their salaries. Multiple things like loans, advances and reimbursements also happen in the
payroll run — design the functionalities and add them to the payroll run and how it will manage"; "for when
the user clicks on open her pay record, open the correct screen"; "in asked HR, state the reason for sending
it back to HR as well — right now it is not visible"; "I wanted the pay group tab to be the MAIN SCREEN, and
when the user clicks on open pay group the information with the staff and their pay related info should be
displayed in the same page and not a side modal — also remove the staff tab"; "the past months' payroll run
history should also be visible inside the payroll run itself, with staff and everything"; "redesign the UI of
months inside the payroll run".

#### The registers were already there, told twice

py-ops.jsx has carried a loan register (fourteen running loans and advances, with purposes, tenures, rates,
one skipped instalment and two at exit) and a claims register (thirty-one approved, unpaid reimbursements in
five tax categories) since PY-13/PY-14 were built. The fourteen instalments sum to **2,10,500**, which is
exactly the run's published LOAN deduction line — the register and the run were the same money, written
down twice, and the roll had been **generating a third version** of it across about thirty invented
borrowers.

So the roll stopped inventing. `NaveyaRoll` now seeds the thirteen borrowers who were not already named onto
the roll, working their gross back from the take-home the register publishes for each of them
(`gross = (net + instalment) / (1 - the group's statutory share)`), and the claims attach to the people who
hold them. Every claimant turned out to be either an already-named person or one of those borrowers: the
data had been authored as one cast all along. Verified after the change: 14 loans · 2,10,500 · teaching
1,48,000 and administration 62,500 (the one split that hits both published lines); 31 claims · 2,68,450;
412 heads and every campus total unchanged to the rupee; Ananya Rao still 94,800 / 78,432.

#### What the officer can now do, and what it costs

The run is three tabs — **People · Loans and advances · Reimbursements** — over one headline.

| Action | Where | What it moves |
|---|---|---|
| Pay a claim with this month | Reimbursements, the row, or the pay record | adds it to that person's net and to the run |
| Hold a claim for next month | the same | nothing; it leaves this run's waiting list |
| Pay all that are owed | the tab's one button | adds every overdue claim at once |
| Skip this month's instalment | Loans, or the pay record | the instalment stays with the person |
| Settle a loan in full | the same | the whole balance comes off instead of one instalment |
| Pay an advance | Loans | money out now, instalments from next month |

Every one of them is a change the officer made, so the headline names it: *"₹86,700.00 added this month · 7
changes you made · Put it all back"*. The base figure is the published one; nothing moves until somebody
moves it, and everything can be put back from the row that did it. A row's **Extras** column (which replaced
*Monthly salary*, since the run is about this month) shows what is going on beside the salary before anything
is opened: *+27,800 claims waiting*, *−6,000 instalment*, *+4,800 back pay*.

Loans and claims now appear in two modules, which is right and had to be said out loud: the run owns **this
month** of an agreement, and Adjustments (PY-13/14/15) owns its **life** — sanctioning, approving,
foreclosing, batching to the checker. Each tab carries one line to the other (*Every loan and advance*,
*Every claim*) so nobody has to work that division out for themselves.

#### The payroll-owned exceptions stopped being dealt out

Three of them are now **read off the registers** rather than handed to the officer by a seed:

- **Claim waiting since last month** — approved before this run's month opened, so it has already missed one
  payday. Nine such claims exist, because nine were approved in July.
- **Instalment is more than half the pay** — four people, because the register's own `net` and EMI say so.
  The remedy is the skip, which the register already models.
- **Last instalment** — one person, because tenure minus paid is one. It warns and does not block.

HR's seven stay dealt (no salary, unexplained LOP ×3, leave still waiting ×2, no bank). Indiranagar opens on
15 blocking and clears to 9 with one click on *Pay all 7 that are owed*.

#### The pay record is the run's, because only the run knows four hundred people

"Open pay record" used to route at PY-05, which holds eleven people in full — so it opened the wrong person,
or nobody. The record is now a screen inside the run: the earnings priced from the pay group's own structure
(Ananya's five parts come to 94,800.00 exactly), the deductions split across the group's published lines with
the instalment exact, the loan with its schedule and its two actions, every bill with its state and a button,
the back pay, and whatever is wrong with the row. It links on to PY-05 only for the eleven people PY-05
actually has. Pay rules hands a person across the same way (`window.Pages3.pyRunPerson`, consumed once).

#### Asking HR says what was asked

`marks` became an object rather than a word, so the row reads **"Asked HR · No bank account"** with the note
under it in quotes, and the record repeats both in full. The ask still writes to `NaveyaPayHandoff`, so it
lands on HR-03's Finance tab and HR-40 exactly as before.

#### Twelve months, and a closed one opens

The six month pills became the **payroll year**: April 2026 to March 2027, each cell carrying its name, its
dates and its state (Paid · This month · Not yet), scrolling with arrows and centred on the month on the desk
when the screen opens. It stands above both the list of runs and one run, so the officer can walk the year
without going back.

Opening a paid month now opens **the same screen, read-only** — which reverses the polish-pass decision
recorded in Amendment CE that a closed month shows no people. It can be honest now, because a closed month
has a roll of its own: this month's roll minus the people who had not joined (unpriced first, then part-month
joiners, then the most recently numbered), re-priced against that month's own published net. Verified to the
rupee against PERIODS: April 401 people / 2,49,80,300 · May 403 / 2,50,41,700 · June 406 / 2,51,18,450 ·
July 408 / 2,52,06,900. A closed month shows its loans as they stood (a loan taken in February is not on
April's run) and its reimbursements as *Not in this run* — none were paid, which is why nine are overdue now.
Nothing on it can be changed, and the live month's uncommitted changes cannot leak into it.

#### Pay rules: no tabs, no modal

PY-02/03/04 opens on the **pay groups** and the Staff tab is gone — a staff list standing on its own was
answering "who is paid what" with no reason to be in a module called pay rules. Opening a group **replaces
the page** (a group holds 268 people and a table that pages; a side panel was two screens fighting over one)
and shows, in order: four figures, the rule — the component table, or the rate card for an honorarium group,
or the empty state for the one with no rule — and then every person on it with salary, loan or advance, bills
waiting and back pay, searchable and filterable by *Has a loan / Has a bill waiting / No salary yet*.

#### One guard was crying wolf

`check-jsx-escapes.py` had been failing since 11d2c9f on `/[\u20b9$\u00a3\u20ac]/.test(...)` in kit.jsx — a
regular expression, not JSX text. It counted quotes and did not know a slash-delimited literal. It now scans
the line properly, and a unit check confirms it still catches the real bug it exists for.

### Amendment CE — The payroll run is a list of people, and HR owns the salary (2026-10-15)

*Rulings (designer):* "the payroll run should first display full employee data with their net payable of all
pay groups ... allow payroll officer to ask for correction or do correction if it belongs to payroll officer
... then sends the payroll to the accountant"; "the pay rules should have full information in table format of
the staff — if it is 200 staff then show their individual info, with their salaries, loans or advances,
reimbursements"; "the HR has to set a salary with breakdown in the HR module, then only the payroll officer
can see the salaries ... the payroll officer no longer sets the breakdown or the salaries ... also can send
the salaries for correction to HR".

#### The roll, and why it had to exist first — v3/payroll-roll.jsx

The run knew what a CAMPUS owed and what a PAY GROUP cost, and did not know what any one person was paid, so
the officer's first question had no screen. NaveyaRoll builds every person on every campus's roll and prices
them, and **the totals are the sum of its rows**: spread() distributes a published figure across the people
without loss, handing the remainder out a rupee at a time rather than dropping it on the last person. The
eleven members of staff who already have exact figures elsewhere are seeded first — Ananya Rao earns
94,800.00 gross and 78,432.00 net here because that is what PY-05 and the register already say — and the
generated staff share what is left. Verified: 412 heads, gross 3,10,21,350, deductions 54,18,500, net
2,56,02,850 and employer cost 18,32,780, each equal to PYRunData's published figure to the rupee; campus
payable 1,55,73,560 + 99,20,190 = NET_PAYABLE.

Staff numbers decide campus (campusOfCode: n % 5 < 3 is Indiranagar), so generated numbers obey that rule and
a generated person lands on the same campus on every screen. **Names are data, not copy** — a person's name
is a row from the staff table, not a label; designations stay keyed.

#### PY-07 · the run

Three states, not four steps: **Checking · With accountant · Paid**, and a campus with no pay group cannot
start and says so. The spine is a table of every person — pay group, days, salary, what they earned this
month, deductions, **net pay** — with search, a pay-group filter, four counter chips and paging. The totals
are its foot. Above it, ONE figure (what leaves the bank) and one line of arithmetic naming every other figure
on the screen, so the gap between the table's net and the headline is stated rather than discovered.

**The workload is dealt, not derived.** About a dozen exceptions per campus, half HR's and half payroll's, so
each row offers exactly one action — *Ask HR to fix* or *Fix it here*. Asking writes to the handoff against
that person, so it lands on HR-03's Finance tab and on HR-40, rather than being copy that only claims to.
**Nothing goes to the accountant with a hole in it:** the send control is off while anything blocks and says
how many; the confirmation names how many are still with HR.

The two people held back are **on the roll now**, with gross and deductions that produce the nets py-ops
publishes — before this the campus had 253 people and 255 sets of figures.

#### PY-02/03/04 · pay rules

Two tabs, and the first is people. **Staff**: every member of staff and everything standing against their pay
— the salary HR set, a loan or an advance coming off it, reimbursements claimed, an arrear owed — over four
figures (on a salary, salaries a month, lent out, claims waiting). **Pay groups**: what each group is and
costs, laid out exactly like the run's table because the run is what the group produces; opening one lists its
components in words — *"Dearness allowance · 20% of Basic pay · counts for PF · 7,900.00"* — priced at a real
grade basic so the rule reads as money rather than algebra, and totalling to Ananya's own 94,800.

#### The polish pass

- **The month chips told the most confident kind of lie.** April said "Paid" and then showed August's
  1,55,73,560 and August's 253 people, because the chips were a selector over one set of data. Each month now
  carries its own published net and head count (April 2,49,80,300 / 401 · June 2,51,18,450 / 406 · August
  2,54,93,750 / 412), split per campus on the roll's share. Opening a closed month does **not** show the
  people — this canvas models one month's roll, and drawing August's names under April's heading would be the
  same lie one level down. It shows what was paid and where the register is. A month nobody has started owes
  a dash, not 0.00, which would say the school pays its staff nothing in September.
- **One card when nothing matches.** An empty search left an orphaned column strip above a separate
  empty-state card — two surfaces for one answer, the first of them a table that is not a table. The filters
  stay reachable either way, because the way out of an empty result is the control that caused it.
- **An honorarium group says how it pays.** Visiting faculty showed who is on it and what it costs and
  nothing about the rule, because the detail only knew how to read a salary structure. The rate card stands
  where a structure's parts would: unit, rate, monthly cap, how many are on it.

#### The salary turns round — reversing the 2026-10-07 split

The earlier split took the figure away from HR on the grounds that HR may not hold it. The designer has
reversed it. HR now sets the salary **with its breakdown**:

- **HR-02a (add an employee)** — the locked "the figure is not set here" panel is two inputs, *Monthly salary*
  and *Basic pay*, with the chosen pay group's own rule applied live beneath them. Both are required: a person
  with no salary cannot be run.
- **HR-03 Finance** — "Request a change" is **"Change the salary"**, and it opens an editor with the same live
  breakdown. "Pay — with the payroll officer" is **"No salary set yet"**, with the control that sets it.
- **PY-05 (Staff & salaries)** — payroll can no longer assign or revise. Every such control is now *Ask HR to
  set it* / *Ask HR to change it*, which writes a request against the person.
- **HR-40** — a card at the top lists every salary payroll has asked about, each linking to the record.
- pay-handoff.jsx keeps its three channels and reverses their direction; setSalary is new, and answering a
  salary closes every open question about that person.

### Amendment CD — HR's home names the late line, and says who is out (2026-10-14)

*Ruling (designer): "In the HR module replace the Lines waiting with Overdue document requests, design a new
box above Holidays ahead for on leave today showing the employees on leave today, and rearrange the Holidays
ahead box below Birthdays and anniversaries."*

#### The first figure is the one somebody acts on

"Lines waiting 32" was the sum of a list printed in full, ranked, eight inches below it — a number nobody
does anything with. It is **Overdue document requests** now, which is also what *Where to start* has been
pointing at all along.

That makes **Past their SLA** the odd one out: the overdue requests are inside it, so laying both in the bar
would count them twice. It takes no band and is **drawn hollow**, which is exactly what the hollow swatch is
for — the bar is the day's five separate populations, and the SLA figure is a cut across the queue rather
than a sixth part of it. Its note carries the queue total that the first cell used to hold: *"of 32 lines
waiting, across every queue below"*.

**A label wraps now rather than truncating.** "OVERDUE DOCUMENT REQU…" is not a label, it is a riddle; the
cell reserves two lines so the figures stay on one baseline.

#### And the one tile that is not a band

The pay-requests tile had its colour box UNDER the figure, where the 4px rule used to be, and no bar at all —
so the one tile on the page that is not a band was also the one place the vocabulary did not hold. It cannot
simply use `MetricStrip`: the whole tile is a `<button>`, whose content model is phrasing, and MetricStrip
renders divs. The shape is built from spans instead, and it is the same shape — swatch to the left of the
figure, one seamless bar across the full width beneath. The four kinds are everybody waiting on HR, so the
bar is that queue.

#### Who is out, before whose day it is, before when the school is shut

The column beside the queue answers in the order somebody asks: **On leave today → Birthdays and
anniversaries → Holidays ahead**. Only the first is something anybody acts on this morning, and it was not
there at all.

The new card names them — a figure says how many, and a name is what somebody needs when a class has no
teacher in front of it. It reads **HR-39's roll**, the same place the band's figure is counted, so the card
and the band cannot disagree about a morning. The campus shows only when both are in view.

**And the heading gives up its icon.** Every row opens with an avatar: a round tinted tile with initials in
it. The heading opened with a round tinted tile with a glyph in it, directly above them — four of the same
mark down one edge, and only three of them named anybody. *(Ruling, designer: "the on leave section UI has
avatar and the section heading has an icon — remove the icon, it feels similar in terms of UI.")* The two
cards below it keep their marks, because their rows open with a **date** tile, which is square: the
distinction now reads, round for a person and square for a day.

#### Three more people are out, and each one has an approval behind them

*Ruling (designer): "add 3 more employees in on leave."*

The card says **approved to be away**, so three new rows on the roll would not have been enough on their own:
somewhere in the product a decision has to exist, or HR's home asserts something no screen can show.

Two of the three cost nothing. **Devika Rao** and **Prakash Rao** were already approved and away on 2026-08-11
in `leaveflow.jsx` (LR-0196, LR-0205) and the attendance roll simply did not carry them — which is how the
dept head's and the principal's screens could say four people were out on a morning attendance called two.
Adding them closes that gap rather than opening one. The third, **Rahul Verma**, is new on both sides: a row
on the roll and the approved request (LR-0211) that puts him there.

HR's home band and the card are both counted off the same roll, so they move together: **on leave today = 4**
at Indiranagar, **5** across both campuses, and HR-39's own strip says 4 with its bar at 40/10/10/40.

HR's leave admin follows, because its requests tab and its **Who is away, day by day** calendar read
`LF.useRequests()` rather than the local array beside them: *Tue 11 Aug — 4 away*, naming Divya, Devika,
Rahul and Prakash, with Shanti on the Whitefield view. Four surfaces, one answer.

**Still divergent, and older than this change:** `hr-leaveatt.jsx` also carries its own `REQUESTS` and its own
hand-set `LEDGER` ("the ONLY place a balance number comes from") for the balance tabs, and its own names —
*Divya Kapoor* there against *Divya Kamath* on the calendar one tab across. Reconciling those rosters is a
job of its own, not a side effect of adding three names.

### Amendment CC — The bar reaches the rest of the product, and learns what it may add up (2026-10-14)

*Ruling (designer): "'These are the ones holding people up' — remove this status, and 'Nobody starts with
children first'. I don't see the bar lines below in the offers module, design here as well. Do the same for
staff attendance, then the same for the accountant and payroll officer users in their modules."*

#### Two asides, removed

A chip under a figure saying what the figure means is the label, the note and the colour told a fourth time.
Both are gone, and the three strings with them.

#### Offers had no bar because its figures were not comparable things

Of its five, one was a total, two were a percentage and an average, and the last two were overlapping cuts of
the first. Nothing could be laid end to end, so the strip drew nothing — correctly, and uselessly.

The fix was in what the strip counts. Every offer this campus has made is in exactly one of five states, so
the strip is **Not sent yet · Out with somebody · Accepted · Declined · Lapsed or withdrawn** and the bar under
it IS the board. The three derived facts — the acceptance rate, the average reply, the ones still sent with
nothing attached — were never a composition of anything, and read better as the one line under the figures
than as three cells pretending to belong to them.

**HR-39's day** needed none of that: in school, late, no punch and on leave are everybody on the campus, cut
four ways, so it took the strip as it stood.

#### And then rendering every bar at once found the real defect

A probe that measures each band's segments showed **nine bars filled 90-100% by a single colour**. A rupee
figure and a head count had been laid on one scale: five lakh beside five settlements is not a composition,
it is a rounding error with a colour.

So **a bar may only lay one KIND of thing end to end.** `MetricStrip` reads the kind off the value — money if
it is formatted as money, a unit if the value carries one ("58 days"), a plain count otherwise — groups the
candidates and draws the largest group, ties going to whichever kind the strip names first. No call site had
to be told anything; a mixed strip draws its counts and an all-money strip draws its money.

Five cases no rule can see were flagged by hand: **a version number is a number** (`2026.3` beside nine open
returns drew a bar that was 99% configuration, twice), four pay groups covering four hundred staff are two
populations wearing the same shape, an average of the three figures beside it is not a fourth part of them,
and two sums were sums of their neighbours.

#### Six more local cells, and where a bar would lie

The accountant's approval gate and the bonus result are compositions and have their bar. The rest — a date
range beside a campus name, "what it is / what it goes up by / what it becomes", "hours × rate × multiple =
value" — are arithmetic, not composition: laid end to end they would count the same salary three times. They
are the same cell **without** a bar, which is the point of letting one component decide.

### Amendment CB — A colour box on each figure, and one bar under all of them (2026-10-14)

*Ruling (designer): "Use colour box indication instead of zig-zag lines, and make the full-width bar with
different colours related to the figures above them. The bar should be together and in full width."*

#### Four marks, and the first three were all answering the wrong question

A rule under the number: a bar drawn at full width whatever the number said. An arc: a share, and half the
figures on this product are not a share of anything, so the ring closed. A sparkline: a history, which has to
be invented for a figure that has none. Each tried to say something about ONE figure, and three times out of
six there was nothing true to say about one figure on its own.

**The mark beside a figure is a swatch** — the colour it is, which is always true — **and the shape of the set
is one bar.** Seamless, the full width of the card, each band in the colour of the figure above it. The
swatch is the key, so no legend is needed: a legend would print every count a second time, which is what made
the old one clutter in the first place.

`Dial` and `Spark` are gone. `Swatch` replaces them, and **`MetricStrip`** is new: the figures and the bar
they add up to, in one component. `Band` is a heading and a `MetricStrip`, and the seven hand-rolled strips
— hiring's two, the lifecycle's two, offers, both of the principal's boards, the director's home and the
record's document file — are the same component now rather than seven copies of its grid.

#### What stays out of the bar, and how a reader can tell

A sum of the others (`total: true`) and a value that cannot be ADDED to its neighbours (`bar: false`) take no
band — drawing either would count the same people twice, or add days to candidates. **Their swatch is drawn
hollow**, so nobody hunts the bar for a colour that was never going to be there.

**`bar: false` narrowed its meaning.** Under the arc it meant "no denominator", which was true of any figure
counting a different population — and that left HR's home with one band and therefore no bar. With one bar
for the strip it means only "not the same unit": two counts of people still compare, twenty-three days and
seven candidates do not. Six figures went back into their bars.

### Amendment CA — The chart in a figure's cell is a line, and a state is not a pronoun (2026-10-14)

*Ruling (designer): "The copy of 'waiting on her' and 'open with her' is misleading — it does not tell HR
what employee it is. Just rename it to Waiting. And the pie design does not correctly display the info of the
figure being shown: there is a full circle somewhere and a half somewhere, so I need a different design other
than the pie for all the recently designed sections containing it."*

#### The arc was right about one thing and wrong about everything else

It was the correct size and the correct weight. It was the wrong *kind*: an arc draws a SHARE, and a share
needs a denominator. Half the figures on this product have none — a total, a duration, a head count measured
against nothing — so the ring closed, and a strip read "full here, half there" with no rule a reader could
infer. Amendment BY called the full rings "a whole" and expected that to read; it does not.

**A sparkline has no denominator to get wrong.** It says which way the figure has been moving, which is the
one thing a number on a dashboard never tells you by itself, and it is the same statement for a count, a sum
of money or a waiting time. Forty-eight by eighteen pixels, the metric's own colour, a faint area under it
and a dot on the last reading. `Dial` is gone; `Spark` replaces it in the kit and at the eight local copies
of the band's cell.

**Where the series comes from.** A screen that holds its own history passes `series`. Everything else gets
one derived from the figure and its own label — deterministic, so it does not flicker between renders, and
it ENDS on the real number, so the last point and the figure beside it are the same fact. It is seed data,
like the counts it trails; in the product it is the metric's recorded history and nothing else.

Two cases needed saying out loud. **A single reading is a dot, not a flat line** — a flat line claims "no
change" and what is true is "nothing to compare it to". And **a count of one or two moves by whole numbers**:
a 20% swing on 1 rounds back to 1, the series comes out flat, and one cell draws a dot beside neighbours
drawing lines, which is the arc's inconsistency in a smaller key.

#### And a state is not a pronoun

"Waiting on her" and "Open with her" read as if they name somebody, and they do not. A reader scanning a
column of states gets a pronoun where a state should be. The state is **Waiting**; who it is waiting on is
the column it sits in and the record it sits on. The same word on the panel above the tabs ("With her") goes
the same way, and the section is **Open requests**.

### Amendment BY — One strip of figures, and the chart is an arc (2026-10-14)

*Ruling (designer): "I see bars of different colours, and information with square coloured boxes with
figures next to them, and also the figure with a bar below them. Eliminate the figures with the square
coloured boxes entirely — they have no significance here. Keep only the figures with the bars, and remove
the bars at the very top which are multiple. Redesign this section for all the modules, keeping only one
section of figures, with a different type of graph and not a bar, but it should not make a very big impact
on the UI. Use proper colour coding."*

#### A band was one fact drawn three times

A stacked bar across the top, a row of legend chips under it, and then the figures — each with a 4px rule in
the same colour as a lane of the bar. Three charts, one statement. Worse, the chips carried counts that
appeared again, larger, two inches below them, which is why they read as clutter: they were the only thing
on the band that said nothing new.

**The bar and the chips are gone.** What is left is the strip, and each figure carries a **dial** — a 30px
arc beside the number saying how much of the whole it is. An arc is read as a proportion rather than
measured against a scale, it takes no width from the column, and it leaves the figure the biggest thing in
the cell, which is the hierarchy a strip of figures is supposed to have. A **complete ring is a whole** (a
total, a duration, a different population); an **arc is a part**. `Band` lost `segments`, `legend`, `picked`
and `onPick` with the bar.

Twenty-seven bands across eight roles, plus eight hand-rolled copies of the same cell in hiring, offers, the
two lifecycle sections, both of the principal's boards, the accountant's bonus and the director's home.

#### What the legend was also doing

On three screens the chips were the stage filter. A legend is a key to a chart; with the chart gone it is a
row of buttons pretending to be one. So the filter became a **select in the row that already holds that
table's filters** — hiring's candidates, the lifecycle's joiners and clocks, and the offers board. The leave
queue needed nothing: its stage filter was already in the filter panel.

#### Colour, since the arc is now the only place it lives

**`chartSand` is not a colour.** #A3907F is a tan-grey, and a figure drawn in a grey reads as a figure that
does not matter — which was the designer's standing objection. Twelve metric tones wearing it were given one
of the six that mean something, each free in its own strip. `missingChart` (#9C8B7E) went the same way: "no
reading yet" is a category, not an absence of one, and it is blue.

**And three more places were painting a quantity in the accent**, which the guard could not see: a `tone={}`
with a conditional inside it, a `color:` array with `chartClay` in the rotation, and a `Meter` whose `bar`
was `c.accent`. `check-chart-accent.py` now bans `chartClay` outright — it is #C14D29 under a second name —
and reads a whole `tone=`/`bar=` expression rather than one spelling of it.

### Amendment BZ — HR's home is HR's day, and pay has a tab (2026-10-14)

*Ruling (designer): "The information shown with the figures in 'What is waiting on you' has irrelevant
information. Keep joined this week and left this week, replace the rest with on leave today and what else is
relevant to HR, and add a box for on-leave-today employees. Remove the sub-text below the main heading inside
the queue column of 'What needs you'. In the staff register I don't like the full yellow UI of the
pending/needs-your-attention section. Remove 'Her pay' and 'How her pay has moved' and design a complete new
tab called Finance next to Contract with all the information regarding the pay of the employee — salary
timeline and so on — and include paid days in the same tab. Reduce the copy below the figures in 'What is
out with staff'."*

#### HR-01 — the band answers the morning, not the queue's shape

It carried the queue total, the lines past their service level, and then **two more cuts of that same
queue** — "due soon" and "waiting, with time on them" — describing the shape of a list that is printed in
full, ranked, eight inches below. Those two are replaced by what HR is actually asked about at nine: **On
leave today** and **Absent, no word**. Joined and left this week stay, because a week's movement on the roll
is HR's own number and nobody else's.

Both new figures are read from **HR-39's roll** rather than counted again here (`Pages3.AttToday`), so the
home figure and the attendance screen cannot come to disagree about the same morning.

The **Queue column lost its second line**. Ten sub-captions explaining what "Overdue document requests"
means, under a heading that says it, in a table whose other three columns are the answer.

#### HR-03 — the slab, and a tab for pay

**The yellow slab is gone.** A whole card flooded brass said ALARM about a training certificate expiring in
sixty-four days in the same voice as a medical certificate that has already expired. A fill cannot
distinguish; severity belongs on the line, where a status mark already carries it. It is an ordinary card
now, worst first.

**FINANCE, next to Contract.** Her pay group, her contracted figure, the account it lands in, how the figure
got there and how many days of the month she is paid for are one subject, and they were in three places: two
cards at the bottom of PERSONAL (under her emergency contact) and a tab of its own called *Paid days* at the
far end of the bar. Pay is not a personal detail — it is a contract — so it sits beside one, in the order
somebody reads it: **what she is on** (the monthly gross and the annual, the group, the cycle, the account,
the last credit, and what the figure is made of) → **the salary timeline** → **what this month pays for**.

**The timeline is the part that changed shape.** A pay history is a sequence of decisions, and it was drawn
as a three-column table — date, figure, reason — which says nothing about the SIZE of a step. Down a rail,
each revision carries what it moved her from and by how much ("Up ₹6,800.00 on ₹88,000.00, a rise of
7.7%"), which is the question anybody opens a pay history to answer. It stays masked until opened, and
opening it is on the record, like every other figure on this screen.

#### HR-09/12 — and the copy under the figures

Five notes under five figures, each a full sentence with a clause: *"Checked and returned with a reason. The
employee can answer again."* A line under a figure is a denominator, not a paragraph. It is now *"returned
with a reason"*. The check queue also stopped being drawn as a share of the requests that are still out — it
is a different population, and the foot line already says where it lives.

### Amendment BX — A figure that is the sum of lanes is drawn as those lanes (2026-10-14)

*Ruling (designer): "in staff logins, the Accounts figure's bar has no colour — I want a colour, and the
same in the upper bar. Same for Out with somebody in Offers: the bar colour below is different from the bar
colour above."*

Both are the same figure: **one that counts several lanes at once.** ACCOUNTS is all four sign-in states;
OUT WITH SOMEBODY is the two lanes where an offer is still with a candidate. Such a figure has no single
colour to be, and giving it one picks a winner among its own parts — which is how the headline figure of the
sign-in band ended up muted sand, the same sand as NO LOGIN beside it.

**So its rule is drawn as a miniature of the bar it sums.** Same colours, same order, same proportions as the
bar above it, which is exactly what a reader checks it against. `MetricCell` takes `segments`; a `Band`
metric says `total: true` for all the lanes or `of: [keys]` for some of them, and the kit does the rest.

Applied to the four figures of this shape: ACCOUNTS, OUT WITH SOMEBODY, STILL JOINING (every lane but
complete and did-not-report) and STILL TO DECIDE, plus hiring's RUNNING over the ladder short of *joined*.

**And the offers bar had an accent lane.** *Lapsed* was `chartClay` — terracotta, next to the crimson of
*Declined*, the two-reds problem again — in a `LOOK` map the guard cannot see. Lapsed is purple now and
*Withdrawn by us* takes teal, so the accent is nowhere in those seven lanes. *Lapsing within 3 days* also
takes the lapsed lane's colour: it had been green, which the eye reads as *Accepted*.

### Amendment BW — Nothing is colourless, and the bar names what it carries (2026-10-14)

*Ruling (designer): "I don't want the neutral colour as you did in all modules. Give them a colour, but not
red, and show the colour for the bar as well — I don't want neutral or any non-colour case. Also in Joining
and confirming the red case for Still joining — use a different colour. Remove [the three-stretches line]
and [the doc-control paragraph], and change the placement of the Raise requests in bulk CTA."*

#### Amendment BV went one step too far

BV made a figure with no slice take the bar's own unfilled ground. That solved the drift, and it introduced
a worse thing: **a figure drawn in no colour reads as a figure that does not matter.** A total, a duration
and a different population are not unimportant — they are just not parts of that bar.

So the rule keeps its first half and drops its second: **a metric keyed to a slice takes that slice's
colour; a metric with no slice keeps its own.** Nothing is ever colourless. The accent, which is Meter's own
fallback, is not available either: a metric that named no tone at all gets a plain category colour.

#### And the bar names what it carries

The colours a reader cannot find under a figure are now named under the bar instead. `Band` turns the legend
on by itself when fewer lanes are keyed than the bar has, and the custom stacked bars in hiring, offers and
the two lifecycle sections name their lanes too — those sit over figures that are a different cut of the
same people, so nothing else explained them. *Who is still joining* now reads `2 Overdue · 1 Blocked · 1 Not
started · 0 In progress · 1 Did not report · 1 Ready` under its bar.

#### The terracotta the guard missed

**Still joining** was `tone={c.chartClay}` — the accent, in a JSX attribute rather than an object property,
which Amendment BU's guard did not match. It is the figure the designer read as red, and it is teal now.
`check-chart-accent.py` matches both spellings, and caught eight more of the same shape in the accountant's
bonus and report builders, hiring, the second lifecycle section and the payroll report builder.

#### Copy and placement

- *Joining and confirming* loses **"The three stretches where somebody is on the books but not yet settled…"**
- *Doc control* loses **"What HR has asked for and is still waiting on…"**, and with it the whole header row
  that paragraph anchored. **Raise requests in bulk moves onto the band it acts on**, where HR-01 already
  puts its two buttons, and the hint under it ("this usually starts on the staff register…") goes: the staff
  register is one rail item away.

### Amendment BV — A figure's underline is its own slice, or it is the track (2026-10-14)

*Ruling (designer): "the colour changes you did for the figures do not reflect on the bar above, and are
either missing or not the same. Recheck this and fix it."*

Correct, and it was caused by Amendment BU's own fix. Making a declared `segments` win stopped the bar being
derived from the figures — which also stopped the two halves being **one list**. They became two lists with
two colour vocabularies, and they drifted at once: doc control drew an amber lane that had no figure, and
painted a figure purple that had no lane.

#### The invariant, now in the kit rather than in every call site

> **A metric keyed to a slice takes THAT slice's colour. A metric with no slice takes the bar's own unfilled
> ground.**

So every colour under a figure is in the bar above it, and every neutral one visibly is not — a total reads
as the width of the whole bar, which is what it is. The call site's `tone` still decides the colour of the
slice; it no longer decides the underline independently, because that was the thing that could disagree.
With no bar at all there is nothing to disagree with, and `tone` stands.

**And a bar the figures do not key to names its own colours.** Where fewer lanes are keyed than the bar has,
`Band` turns the legend on by itself. The staff register's bar is the roll by *category* while its figures
are *states*; the director's leave bar is where each request sits while three of its four figures are other
populations and a duration. Those bars now carry `3 With you · 15 Below you · 14 Settled` under them, and
their unkeyed figures are neutral instead of borrowing a colour that means something else.

#### And three bands were made whole

Where the figures were *nearly* the composition, the missing part was added rather than left to the legend:

| Band | Was | Now |
|---|---|---|
| **HR-01** *What is waiting on you* | bar had amber and blue lanes with no figure | *Due soon* and *Waiting, with time on them* are figures; joined/left this week are neutral, because they are not what is waiting on you |
| **HR-09/12** *What is out with staff* | *Sent back* was keyed `back` while its lane was keyed `rejected`, so it went neutral; the amber lane had no figure at all | keys aligned, *Awaiting the employee* added, and the figures read in the order the bar draws them |
| **HR-38** *Who can sign in* | — | already whole after BU; the total now takes the track |

**On notice** also stopped being a `warn` figure. It was rendering in its own tone to shout, and what it was
shouting was that somebody is leaving — which is a state, not a failure.

### Amendment BU — Red means something is wrong, and nothing else may be red (2026-10-14)

*Ruling (designer, with HR-38 on screen): "I see the big red bar which should not be used. Use red only for
cases where there is something incomplete, rejected, expired, etc. Like here the 9 accounts was used with
red colour — I don't want this. Check other modules of HR as well and fix this everywhere."*

#### Two faults were making one bar

**The accent is a red.** `accent` and `chartClay` are the same value, **#C14D29** — a terracotta that sits
next to the crimson `chartRed` **#CE3A50**. A band painting a plain population in one and a failure in the
other shows two reds, and the bigger of them means nothing bad at all.

**And a total was being drawn as a slice of its own bar.** HR-38's band listed Accounts (9), Invited (2),
Locked (1) and No login (2); the kit derived the bar from the figures, so it drew **14 out of 9** with the
total taking 64% of the width in terracotta. The kit had a guess for this — *a figure equal to the sum of
the rest is a total* — and it misses the moment a band also carries a figure that is not one of the parts.
Here `active` (4) was simply not a metric, so 9 ≠ 2 + 1 + 2 and the guess failed.

#### What changed in the kit

**The composition a screen declares is the bar it gets.** `segments` now wins wherever it is given — HR-38
had written the right four-way split all along, and the derived bar was thrown over the top of it. Seventeen
bands across eight roles passed both; all seventeen were checked in the browser afterwards.

Where a band has no `segments`, the bar is still derived, and a figure that is not a slice now says so:
`total: true` for a sum of the others, `bar: false` for a figure of a different population (a duration, a
queue that is somebody else's). The sum guess stays as a backstop.

#### The law

| Colour | Means |
|---|---|
| **chartRed** | a count of something **wrong** — overdue, locked, past the service level, rejected, expired, missing |
| **chartAmber** | waiting, due, a clock running |
| **chartGreen** | done, settled, signed in |
| **chartBlue · chartTeal · chartPurple · chartSand** | plain categories, populations and money |
| **accent** | never a quantity. It is the colour of an action — buttons, links, the pressed segment of a switch |

`design/v3/check-chart-accent.py` enforces it: it fails on `tone: c.accent`, on `tone: c.chartClay`, and on
either as a `color:` inside an object that also carries a `key`/`label` (the shape of a bar segment). A
link's `color: c.accent` is left alone, which is where the accent belongs.

#### What moved, beyond HR-38

- **HR-01** — *Lines waiting* was the accent and is the whole queue; `breach` is **part of** that queue, so
  the derived bar drew the breaching lines twice, once in red. The band now writes its own three-way split:
  past the service level (red) · due soon (amber) · waiting with time on them (blue).
- **HR-02** — *On the register* was a total in the accent; *Contracts ending* was terracotta. And **two
  figures were red that are not failures**: *On notice* and *Contracts ending*. A person leaving is a state,
  not an error.
- **HR-09/12 doc control** — *Requests out* is a total; *Sent back* was terracotta; *Waiting on your check*
  was teal, which reads as green, which reads as done.
- **HR-28 leave queue** — *Waiting on somebody* was the accent and is the total; *Longest wait* and *Days
  asked for* are **durations**, and a duration has no business being a slice of a bar of people.
- **HR-40 pay requests** — the longest-wait underline, and the instalment's bite out of a month's pay.

Outside HR the same defect existed in eighteen more places — the payroll roll, exits, the run's deductions,
the accountant's declarations and contributions, both leave boards, the employee's tax and loan cards. They
are corrected too: the rule cannot be "HR only" when the colour is the same everywhere, and the guard is
product-wide.

### Amendment BT — The accountant's filing gets the same four steps (2026-10-13)

*Ruling (designer): "now do the same for accountant as well."*

The accountant's counterpart to a payroll run is a **statutory return**: a process object with a lifecycle,
a set of records behind it, things that can block it, and a terminal state. It had exactly the fault PY-07
had, so it gets exactly the same three instruments.

#### AC-05 — four steps, one at a time

Before: five surfaces stacked on one page — what the return is built from, what validation found, the
artefact (an empty state and a **disabled primary button**), saying it was filed (a **second disabled
primary button**), and the trail — each under its own paragraph, with nothing saying which one the reader
was standing in.

| Step | What is on it | The one act |
|---|---|---|
| **1 Validate** | the staff records behind it, blocking first | — (Generate sits disabled, with the reason) |
| **2 Generate** | validation passed | **Generate the return** |
| **3 File** | the artefact, and the validator where one is required | **Mark it filed** |
| **4 Filed** | the acknowledgement | download · revise · mark rejected |

**The file validation utility stopped being a step.** It was a fifth stop on the spine and a card of its
own, shown for Form 24Q only — so the stepper changed shape between returns. It is not a stage, it is a
*condition on filing*, so it gates the act inside step 3 and every return now has the same four steps.

**A facts bar on every step:** amount · people in the return · period · due · computed on. The old "What
this return is built from" section said the same things with a bar chart under each and a paragraph above
them.

**The validation list became a readiness panel:** only the findings still in the way, blocking ones sorted
first, the two counts shown side by side when a return has both ("2 blocking · 2 to look at"), and each row
carrying the act that clears it. An **excluded** finding leaves the list entirely — an exclusion is a
decision, and a decision belongs in the trail, not in the list of things still to do.

#### AC-04 — a Step column, and a row that opens

The **State** column answers how the *due date* is doing ("3 days left", "23 days late"). That is a
different question from how far the return has got, and a reader could not tell a validated return waiting
to be generated from one nobody has looked at. A **Step** column now says it, derived from the return's own
facts so the register and the workspace cannot disagree. Rows open on click, as the run list's do, and the
menu keeps the rest of the acts.

Two paragraphs went with it — the band's and the register's — definitions included.

#### The one place the two modules differ, and must

**A return is not created by this desk.** It exists because the law says it is due, so there is no *New*
button on this register: the statutory calendar makes returns, the payroll officer makes runs. That is why
AC-04 has no counterpart to *New run* and should never grow one.

#### Reachable, and not

Every step was walked: a clean Karnataka return goes Generate → File → Filed in session; an ESI return opens
at Filed; Form 24Q opens at Validate with two blocking and two to look at, and its artefact panel names the
real obstacle — *"the Quarter 2 payroll is not approved, so this would be a false return"*. **The validator
gate is correct but unreachable in this seed**, because the only return that needs one is the 24Q and its
period is not approved; that is honest rather than a gap.

23 strings nothing renders any more were deleted, definitions included.

### Amendment BS — A run says what it is, and what is stopping it (2026-10-13)

*Ruling (designer): "add the What is going into this run inside the run details — right now I don't see the
details of the run like total figures, number of staff etc. Include all related details and the edge cases
where there is an unresolved case which can't start a run. Consider all cases and design this."*

#### What was missing

**A run had no facts.** Standing on step 1 you could not learn how many people were on the roll, how many
pay groups covered them, when the inputs close, which rules version was pinned or who made the run — only a
chip with its identifier. The totals appear at step 2, so the first step had no sense of scale at all.

**And `1 to resolve` was the whole of the error design.** At least six different things can stop or
compromise a run and they are not the same kind of thing — some make the compute *wrong*, others only make
it *incomplete*. A count said neither which it was nor where to go.

#### The facts bar, on every step

Staff on the roll · Pay groups · Cut-off · Rules pinned · Created. Label over value, even columns, no prose.
*"How many people is this?"* does not stop being asked after the compute, so it is on all four steps.
**Moving the cut-off is an act on a fact, so the act sits under the fact** rather than in a card of its own
— which removed a whole surface whose entire content, when nothing had arrived late, was a sentence saying
nothing had arrived late.

#### Every case, and which kind it is

A readiness panel lists **only what is not ready**, because a checklist of green ticks is a wall a reader
learns to skip. When everything is ready it collapses to one line.

| | Case | Why it is that kind |
|---|---|---|
| **Blocks** | No pay group covers this campus | Nothing can be priced. → Pay rules |
| **Blocks** | *n* people have no salary assignment | HR created them, this desk has not priced them; they would compute at nothing. → Price them |
| **Blocks** | Nobody is on this roll | A run with no staff would pay nobody |
| **Warns** | Inputs are still open until *d* | Anything arriving before then lands in this run |
| **Warns** | The previous month is not paid | Allowed; approving out of order is how arrears go wrong |
| **Warns** | *n* requests are waiting on you | Undecided by the cut-off, they move to next month. → Adjustments |
| **Warns** | *n* people have wrong bank details | The run computes; the bank file will be short by that much |

**A warning never disables Compute** — verified: a Whitefield run with three warnings and no blockers
computes. A blocker always does, and the button says how many.

Every one is read off the store that owns the fact — the handoff for unpriced joiners, the pay-request store
for undecided requests, the run's own holds for bank details — never asserted on this screen.

#### And a figure before the compute

"What is going in" gained a **net effect of adjustments** total, which is the only figure that exists before
anything is computed: loans out, claims and overtime and arrears in. ₹58,000 on the September Indiranagar
run.

#### A bug this surfaced

The unpriced-joiner filter read `x.staffId`, and `pay-handoff.jsx`'s awaiting row carries the staff number
in **`id`**. The field was always undefined, so the guard `!code` let **every** campus claim the same
unpriced joiner — Whitefield's inputs table said "1 to resolve" about a person at Indiranagar. Both filters
read `x.id` now, and the table and the readiness panel agree.

### Amendment BR — PY-07 rebuilt: a run is created, and it has four steps (2026-10-13)

*Ruling (designer): "fix the UI of The month, campus by campus — it is uneven and too cluttered. The payroll
officer can start a run for any new campus; right now the flow has 2 campuses by default, but I want to
understand how these runs are created. The payroll officer is the creator and the accountant is the final
person approving the run. The payroll run module is too complicated to understand. Redesign the entire
module from scratch — minimal, not a lot of text, easy to understand visually and to navigate. Research how
it can be managed for a payroll officer."*

#### What was wrong with Amendment BQ's version

BQ gave the month a board of two campus rows. Each row stacked a name, a run identifier, a meta line, a
six-stop rail with its current stop labelled, a status mark saying the same word as that stop, a figure, a
caption and a button — nine things per row, and the rows were different heights because the rails were
different lengths. On top of it sat a four-figure strip, a produced card, a gate card, a maker-checker
explainer and a configuration note. **Six surfaces to read before the first decision.**

The deeper fault was that the two campuses were a GIVEN. Nothing created them, so nothing explained what a
run is, and a third campus could not have one.

#### The research

Indian payroll guidance and the products that implement it converge on one sequence — lock the inputs,
compute, review, approve, release — and Zoho Payroll's own cycle is **process → review and update → submit
and approve → record payment**. The spec's maker-checker rule fixes the last two: a run is prepared by one
person and released by a distinct one. `groupadmin.jsx`'s role catalogue says who: **payrollOfficer carries
`payroll.run`, accountant carries `makerchecker.approve`.** So the officer creates, computes, reviews and
submits; the accountant approves. That is now stated on the screen, in one line, where the approval sits.

#### The module, in two screens

**1 · Payroll runs.** A period row, then ONE TABLE: a row per campus of the trust, with its run or the
absence of one — campus, run identifier, step, people, net payable, and one action. A table has even rows by
construction, which is the whole fix for "uneven". The month's totals are the table's own footer rather than
a strip above it. **New run** is the page's single primary action.

**2 · One run.** A four-step stepper, then only the step you are standing in, then nothing:

| Step | What is on it | The one act |
|---|---|---|
| **1 Inputs** | the cut-off, and what is going in, as a seven-row table of counts and states | **Compute** |
| **2 Review** | the four totals, what moved, who is not paid normally | **Send to the accountant** |
| **3 Approval** | who holds it and since when | Recall it |
| **4 Paid** | net, date paid, version pinned | the register, the bank file, the variance |

Everything that used to be an explainer card is a line or is gone. The configuration is a chip. The
maker-checker rule is half a sentence under the accountant's name.

#### How a run is created, which is the part that was missing

**New run** → choose a campus (only those without a run this period) → the period and the rules it pins are
shown → **Create it**. The run is created at step 1 and nothing is computed or paid by creating it. Every
campus row with no run carries the same act as **Start**.

**Yelahanka is the third campus, and it teaches the dependency.** It was added to the trust, has a roll of
46 and **no pay group covers it**, so its run can be created and then stops at step 1 with the reason and a
button to Pay rules. That is the honest state of a new campus, and it is how the officer learns what a run
needs before it can compute.

#### The figures

A campus's share of a run is each pay group's money split on that group's head count, rounded to whole
rupees, with Indiranagar taking the remainder — so the campuses add to the trust's figure exactly and no
total on the module carries paise nobody would quote. A closed month has no lines, only a net and a head
count, so the same rule runs over the roll.

#### Two desks, one figure

The run in the accountant's approval gate (AC-02) is now **PR-2026-08-IND** at **₹1,55,73,560**, which is
what PY-07 shows for the same run — headline, register evidence and statutory evidence all split by the same
rule. Contributions have no pay-group dimension in the seed, so they are attributed on the wage share, which
is what they scale with.

**Filed, not fixed:** AC-02's register evidence decides what to draw with `item.id === "PR-2026-08-IND"`, so
the DECIDED July run still draws the Foundation's figures. That predates this change.

### Amendment BQ — Where the campus belongs, and a run per campus (2026-10-13)

*Ruling (designer): "remove the campus toggle from Build a report and add it to the data fields inside What
do you need. Remove it from Where every return stands and add the filter to the table. Remove it from What
we owe and add it next to legal entity. Remove it from Approvals and add it next to the type field. Remove
it from Paid days and add it to the table filters. Remove it from Pay rules and rename the heading — I do
not want {mon} 2026 payroll. Remove it from the Reports tab of the registers, and the campus dropdown
inside the tab. For the payroll run, research how different payroll runs for the different campuses will be
displayed; the toggle at the very top does not make sense for a campus. Redesign the module and the UX flow
— how the run works for both campuses from one screen, and how the officer starts the run for the other
one."*

#### What Amendment BP got wrong, and what replaces it

BP put the campus switch in the top strip of every campus-scoped screen, on the rule that scope lives in the
strip, once. On the screens that have **nothing else in the strip** that rule still holds. On the screens
below it did not, and the reason is worth keeping:

| Where the campus went | Why |
|---|---|
| **AC-09 Build a report** — a field in *What do you need?* | This screen does not SHOW anything; it writes a specification for a file. Module, report, range, entity, format and whether it carries identifiers are all fields in one box. The campus is another, and unlike a page scope it comes out the other end: in the preview strip, in the sentence that says what was produced, and in the Scope column of the export record. |
| **AC-04 Every return** — the table's filter row | The table already narrows by kind, entity and status. A fourth axis belongs with them. |
| **AC-03 What we owe** — beside Legal entity | Entity and period are this screen's scopes; the campus is a third of the same kind. |
| **AC-02 Approvals** — under Type | The queue narrows by bucket and by type, in one stack of controls above the list. |
| **PY-08 Paid days** — the filter row | Month, pay group and what is worth looking at are one row of four. The campus is the fifth. |
| **PY-02/03/04 Pay rules** — removed outright | Campus is a FIELD on a pay group, not a scope on the module. Every seeded group runs on both, so the control could never change the list. |
| **PY-18 Reports tab** — removed outright | A report is built from a run, and a run is the month's. The registers tab keeps its switch; the builder has no campus control at all. |

**The rule, restated:** a scope control goes in the strip when it is the only thing scoping the screen, and
into the filter row when the screen already has one. A control that cannot change what is under it is
decoration either way — which is why three of these gained something to narrow at the same time.

#### What each one gained, so the control is not decoration

- **AC-04** gained a **Covers** column. A return is filed for an establishment or for a state, never for a
  campus — but the trust has a Telangana registration for its Hyderabad place of business, and Telangana
  professional tax is its own return. Most rows read "Both campuses"; the two Telangana rows read
  "Hyderabad" and drop out the moment either Bengaluru campus is chosen. **Measured: 9 rows → 7.**
- **AC-03** narrows the **payslips behind** each figure, with a campus column on the drill and the count in
  words. The figures themselves do not narrow, and the drill says why: one establishment, one challan.
  Recording a payment against a third of a liability would be a wrong payment.
- **AC-02** gave the two items that belong to ONE PERSON — a loan sanction and a full-and-final settlement —
  a staff number, and reads the campus off it. **Measured: 4 pending → 2 at Whitefield.**

#### PY-02/03/04 — the heading was a collision, not a copy choice

Pay rules rendered **`{mon} 2026 payroll`**, placeholder and all, on a module with no month. Both this file
and the payroll run wrote their strings under `pyr.`, both defined `pyr.title`, `addStrings` merges into one
dictionary and the run loads second. Pay rules now owns `pyl.` (294 keys) and is called **"How each group is
paid"**.

#### PY-07 — a month has one cycle and a run per campus

**The research.** Two campuses are **branches of one establishment**, not two establishments: provident fund
is paid under a single code — the 2017 EPFO circular that introduced member location mapping exists
*because* branches of one establishment pay under one code — employees' state insurance is one registration
for a region, professional tax is per state and both campuses are in Karnataka, and tax deducted at source
is per TAN. One establishment means **one remittance and one return**. But attendance closes per campus and
is signed off by that campus's principal, holds are placed by whoever knows why, and branch-wise registers
are exactly what a campus head asks for.

**So: preparation is per campus, approval is the month's.**

| Level | What lives there |
|---|---|
| **The month** | Both runs on one board, the consolidated figures they add to, the single gate, and the artefacts — the register and the one bank file. |
| **A campus run** | Its own identifier (`PR-2026-08-IND`), its own cut-off, its own inputs, its own compute, its own variance review, its own holds. |

**Why the switch in the strip was wrong, in one sentence:** the Whitefield run is not a filtered view of the
Indiranagar run — it is a different run, with a different identifier, at a different stage — so narrowing
printed one run's totals under another run's name. The campus is now **which run you are standing in**,
which is navigation, and reads like navigation.

**The gate is the reason the officer cares about the campus they are not in.** The month cannot go to the
checker while either campus is behind, and the gate names which one and offers the way into it. That is the
whole user journey:

1. The month shows both runs with their stage, their net and the one thing to do about each.
2. The gate says *"Whitefield: its variance review is not done"* with **Open the Whitefield run** under it.
3. Inside a campus, everything is that campus's, and **the other campus** sits in the right-hand column with
   its state and a way across — or, if it has no run, **Start the Whitefield run**.
4. Sending is the month's, once, with one bank file.

**A closed month** is a three-column comparison — Indiranagar · Whitefield · Both campuses — over run
identifier, people paid, net paid, who approved, when each was approved, when the money left and the version
pinned. The right-hand column is where the single remittance shows: *two runs, a day apart, one file, the
same version*.

**The figures.** Each campus's share of the live run is its pay groups' money split by their head counts
(164/104 teaching, 74/47 administration, 15/8 visiting), with Whitefield rounded and Indiranagar taking the
remainder, so the two campuses add to the trust's figure exactly. A closed month has no lines, only a net and
a head count, so its split is the same rule over the roll.

### Amendment BP — One campus switch, everywhere (2026-10-13)

*Ruling (designer): "the modules which contain filters should also have a campus toggle — add one to the
director's home screen, to the campus attendance board and to Leave across the trust; remove the two scope
paragraphs; add the same toggle to Joining and confirming, to the helpdesk's internal tabs and to Reports;
the payroll officer and the accountant work across two campuses too, so add the toggle and suitable filters
inside all their internal modules, and add a proper campus field wherever something is created or a table is
present. I want the UI consistent for every dashboard user."*

#### What was there before

Six files had hand-rolled the same control, and they had already drifted apart:

| File | Segments | Treatment |
|---|---|---|
| `hr.jsx` | 2 — no "both" | accent fill |
| `hr-compliance.jsx` | 3 | accent fill |
| `hr-hiring.jsx`, `hr-offers.jsx` | 2 | white chip on sunken |
| `hr-leaveatt.jsx`, `hr-attendance.jsx` | 2 | white chip on sunken |

Four more modules kept the campus as a Select buried among four or five filters, and **doc control had three
scopes at once** — one in the page strip and one inside each of two tabs — so the heading could say
Indiranagar while the table under it showed both.

#### The kit owns it now

`UI3.CampusSwitch` is the one control, with `campusOptions` for a Select, `campusLabel` for a word, and
`inCampus` / `inCampusKey` for the filter itself. **Three campus vocabularies existed** — `indiranagar`
(HR), `lf.c.main` (the roll and leave stores) and `pyo.camp.indira` (payroll ops) — and two filters written
against the wrong one matched nothing, so the switch looked broken on Pay requests and on Exits. The kit now
reconciles the first two, and **the staff number is what every module actually filters on**:
`campusOfCode(code)` answers from HR-02's register, falling back to a stable derivation from the digits so a
person who appears only in payroll still lands on the same campus on every screen that names them.

**The rule: the switch lives in the top strip**, on every screen that is campus-scoped, beside the theme
toggle, with the crumb naming the scope in words. Never in a filter row, and never twice on one screen.

#### Coverage, measured

A browser sweep over all 32 campus-scoped screens, comparing the whole page at Indiranagar against the whole
page at Whitefield: **24 narrow, 8 do not, and the 8 are deliberate.**

| Screen | Why it does not narrow |
|---|---|
| **PY-02/03/04** Pay rules | A pay group is a RULE, not a list of people. Campus is a FIELD on it (new groups choose one, "Both my campuses" by default) and every seeded group is trust-wide, so all of them are in every scope. |
| **AC-01/02/03/04/06/09** | Establishment-level: a PF challan, a filing calendar, an approvals gate, a bonus working, a report shelf. A return is filed for the establishment, not for a campus. AC-05's exception list — the staff records that BLOCK a return — does narrow. |
| **HR-08/34-37** Reports | The report shelf is the same shelf. What narrows is the appraisal lists (measured: 3 rows at Indiranagar, 1 at Whitefield) and the run dialog, which now OPENS on the page's scope rather than always on "both". |

**PY-07 is the interesting case.** A payroll run is one run — one cut-off, one approval, one bank file — so
scoping its gross would invent a number the run does not produce. The switch there narrows the PEOPLE: who is
held back, what arrived late, and who the hold panel offers.

#### The copy that went with it

Both scope paragraphs are gone: *"Showing Indiranagar. Every list on this module — the queue, the balances,
the policy in force — follows this switch"* and the director's read-only note under Attendance across the
school. A sentence restating a pressed button two inches to its right is the guidance layer Amendment BI
removed everywhere else.

DR-03's picker — two cards carrying headline figures, the only campus control in the product shaped that way
— becomes the switch, and gains "Both my campuses", which merges the departments **by department**: the
trust has one Science, not two.

#### Filed, not fixed

**Two staff numbers are on different campuses in different files.** NAV-0250 (Neha Bhatt) and NAV-0161
(Rohit Malhotra) are `indiranagar` in HR-02's register and `lf.c.north` in the leave-administration roster.
`campusOfCode` follows the register, because the register is the roll — but the leave module's own rows still
say otherwise, so the same person can appear at Whitefield on HR-28 and at Indiranagar everywhere else. It is
a pre-existing seed conflict, not something this change introduced, and fixing it means reconciling the two
rosters rather than editing two lines.

### Amendment BO — The register stops explaining itself (2026-10-12)

*Ruling (designer): "remove the sub descriptive text below the main text inside the registers table, under the
Register column, of the payroll officer's registers and reports module."*

**PY-18**'s catalogue drew each row's first cell as two stacked lines — the register's name, and under it a
question in muted ink ("What exactly did this run produce, person by person?"). Fifteen rows of that is a
paragraph pretending to be a column, and the four columns beside it already answer it: what the register
covers, how many rows, what it totals, and whether it is final.

#### Two page questions the earlier sweep could not see

Amendment BI removed the page question from every module. Two survived, both here and in **PY-01**:

```
title={t("pyrp.r." + item.k)} q={t("pyrp.r." + item.k + "Q")}
title={t("pyr.view." + view)}  q={t("pyr.view." + view + "Q")}
```

They build the key by **concatenation**, so a sweep searching for literal key strings had nothing to match.
Same defect, different spelling. Both gone — that is now zero page questions in the product.

#### And the third copy of the same sentence

With the page question gone, an opened register read its own name twice and then explained itself:

| Was | Is |
|---|---|
| `Statutory contributions` — page head | `Statutory contributions` — page head |
| `Statutory contributions` — card head | `Statutory contributions` — card head |
| *"What is owed to the government for this run, and from which version did it come?"* | — |

The card **keeps its title** — the page head scrolls away and a table should stay named — and loses the sub.
All fifteen `pyrp.r.*Q` strings, the three `pyr.view.*Q` strings and the `qKey` field that carried them are
deleted rather than left unrendered: a string nothing draws is a string that drifts out of date unnoticed.

### Amendment BN — Four peer totals, one size (2026-10-12)

*Ruling (designer): "inside payroll run of payroll officer I see the first and the last font size being bigger
than the middle two for the figures inside gross section — change the font size of the outer two to match
the inner ones."*

**PY-01**'s totals row carries four figures under one rule: gross, deductions, employer cost, net payable.
Gross and net were drawn at `fig("xl")` (34px) and the middle two at `fig("lg")` (22px), on a `big: true`
flag the row's data carried.

They are four readings of the **same run**, side by side, each with its own label, its own meter and its own
note. A size step between them says one is the headline and the others are its footnotes — and the row does
not mean that: a reader checking a run reads all four, and the two that were small are the two that answer
"what came off" and "what the school pays on top". The flag is gone, the branch with it, and all four now
measure 22px on the same baseline.

**The rule this row teaches:** a size step is a claim about rank. Make it where the rank is real — a figure
against its own label, a section head against its body — not between peers that happen to sit in a row.

### Amendment BM — Inter and Roboto become the dashboard's type (2026-10-12)

*Ruling (designer): "use the Inter + Roboto combo for the main dashboard and apply it to v3."*

Chosen on `v3-type.html` and now the product's: **Inter carries every word — headings and body — and every
figure is Roboto.** Two faces, two jobs.

| | Was | Is |
|---|---|---|
| Headings | Bricolage Grotesque | **Inter**, 600 at a negative tracking |
| Body | Hanken Grotesk | **Inter**, 400 |
| Figures | Red Hat Mono | **Roboto**, tabular lining |
| The ₹ fallback | Hind | **Hind**, unchanged |

**One family for headings and body is the point, not a shortcut.** The type scale already separates them:
a head is 600 with slightly negative tracking against a body at 400. That is the whole of the difference one
family needs, and it removes a second webfont from every page load.

**Roboto is not a monospace, and the columns still stack.** What lines a money column up is tabular lining
figures, which `G3.fig()` has always asked for by name. Measured after the change: every digit 0–9 takes an
identical advance width, so a rupee column aligns exactly as it did.

**The pairing is a contract between three files** — `tokens.jsx` names the families, the page loads them, and
the kit reads them. v2's bug was tokens naming a face the page never loaded, so all three moved together
here, and both pages that use these tokens (`v3.html`, `v3-mulberry.html`) carry the same link.

`v3-type.html` keeps all five for comparison; Inter + Roboto is now labelled **Current** on it, and the old
stack **Previous**.

### Amendment BL — The last six bands, and four typefaces on their own URL (2026-10-12)

*Ruling (designer): "the colour coding to the data below is not accurate for all modules — recheck this and
use the same colours in bars as the data below. Also give me 3–4 font alternatives, and one with Roboto as
used for the numbers — do this on a different URL and not in the main dashboard."*

#### Six bands that could not agree, and why

Amendment BK made the kit's band draw its bar from its own figures. Six sections were not using the kit's
band at all — they hand-rolled the markup, so the fix had not reached them. A sweep comparing **every bar
slice's colour against the colours of the figures below it** found them:

| Section | The bar showed | The figures below were |
|---|---|---|
| **PY-16** Where the settlements stand | exits by state | a count, money, a count, a date |
| **PY-14** Where the staff sit | staff by pay group | groups, headcount, structures, not-ready |
| **AC-08** The period, by head | the five statutory heads | money, money, money, a version |
| **AC-07** This financial year | declaration states | a count, money, money, a window |
| **AC-04** What has to be filed | filings by state | a count, money, a date, a version |
| **HR-01** What is waiting on you | past / soon / under review | waiting, breaching, joiners, leavers |

**No colour assignment could fix five of these**, because the bar and the strip were not counting the same
thing: a rupee total is not a share of a headcount, and a date has no slice at all. Where the strip is money,
a date or a configuration version there is **no proportion to draw**, so those five lost the bar — and the
breakdown it carried is in the register directly underneath each one, in words, with its status mark.
HR-01's strip IS four counts, so its bar is simply built from them.

All six now use the kit's band. **That is every band in the product on one component**, and the sweep across
54 screens reports every bar slice taking its colour from a figure below it.

#### Four typefaces, on `v3-type.html`

A separate URL, so nothing about the dashboard changes while the choice is being made. It is `v3.html` with
three additions and no subtractions: the candidates' webfonts, a bar at the foot that switches between them,
and an override that rewrites `G3.font` **in place**.

*Amended the same day, on a second ruling: "I need different font pairings — a font for the numbers and a
different font for the headings and body — and no serif fonts."*

The first set varied **three** families at once, which makes a choice hard to read: when a display face, a UI
face and a mono all change together you cannot tell which one you are reacting to. These are **two-family
systems** — one sans carries the headings AND the body, separated by weight and size rather than by family,
and one mono carries every figure. No serif anywhere.

*Amended again on a third ruling: "use a different font style for the numbers, and not mono font styles —
use a different sans serif."*

**What lines a money column up is not a monospaced family.** It is tabular lining figures, which `G3.fig()`
has always asked for by name (`tnum`, `lnum`, `font-variant-numeric`). So the figure slot can hold a second
SANS, and the columns still stack. Measured on each pairing: every digit 0–9 has an identical advance
width, so a rupee column aligns exactly as it did under a typewriter face.

| | Words | Figures |
|---|---|---|
| **Inter + Roboto** | Inter | Roboto |
| **Figtree + IBM Plex Sans** | Figtree | IBM Plex Sans |
| **Public Sans + Archivo** | Public Sans | Archivo |
| **Space Grotesk + Barlow** | Space Grotesk | Barlow |
| **Current** | Bricolage Grotesque + Hanken Grotesk | Red Hat Mono |

The two faces in each pairing are chosen to differ where it shows on a payroll screen — the one, the four,
the seven — so the pairing reads as a decision rather than a mistake. The `mono` slot keeps its name because
the kit reads it, but it no longer holds a monospace.

The last row is the dashboard as it stands, kept for comparison. Setting `display` and `ui` to the same
family is deliberate: the type scale already gives a heading 600 at negative tracking against a body at 400,
and that is the whole of the difference a single family needs.

Two things make it work. `G3.t()` reads the family at **call** time, so rewriting the object's properties
reaches every screen; and the choice is applied **during render**, with the app keyed on it, so a switch
remounts rather than needing a reload. **Hind stays last in every chain** — Red Hat Mono, Roboto Mono, IBM
Plex Mono and JetBrains Mono all lack the rupee sign, and Hind is what draws it.

### Amendment BK — The bar is the strip, drawn (2026-10-12)

*Ruling (designer): "remove these numbers and colour box from all the screens for all dashboard users. And
the bar colours should match the data metrics below — not the metrics in the screenshot. For example this
bar shows unassigned and assigned; I don't want that, I need the info of the four metrics below with the
same colour coding. Remove the sub text below Attendance across the school on the director's home. And
redesign the Waiting-on-you section on the accountant and payroll-officer home — it has bar lines and
scales, I need a different graph style on the left and the text looks empty."*

#### One list, two halves

A band used to take a `segments` list and a `metrics` list, which were free to disagree — and on PY-05 they
did: **the bar drew assigned-against-unassigned over a strip counting four other things.** The two are now
one list. Each metric may carry `n`, its raw count, and the bar is those counts **in those metrics' own
colours**, so the halves cannot disagree because they are the same data read twice.

Two consequences fall out of it:

- **A metric with no count is not in the bar.** Monthly gross, a regime, a date: money is not a share of a
  headcount, so it sits in the strip only.
- **A metric that is the SUM of the others is found and excluded**, because a total inside its own bar draws
  everything twice. The kit works it out (`n × 2 === whole`) rather than asking 22 call sites to remember.

**And the colour key is gone from every bar in the product.** It printed a swatch, a figure and a label; the
strip below prints the same label and the same figure, larger, over its own coloured rule, with room for a
note. `legend` now has to be asked for by name and nothing asks.

#### Four pages kept their own copy of Band

`ac-more`, `hr-pay`, `py-adjust` and `py-reports` each declared a local `function Band(...)` that **shadowed
the kit's**. So three of them still drew the key the kit had stopped drawing, and none got the
bar-from-metrics behaviour. That is exactly how a duplicated component fails: the fix lands once and four
screens never see it. The copies are gone.

#### Waiting on you, redrawn

Both home desks drew **one wide bar across the top — a scale with nothing to measure against — and then the
same figures again** as a two-column grid, each row a colour dot, a label on the left and a count pushed hard
to the right, with nothing in between. That gap is the emptiness the ruling names.

Now **each queue is its own bar**, full width, ranked oldest first:

| | |
|---|---|
| the label | left, fixed width |
| the bar | the middle, length from the count, **colour from the queue** — so the dot goes |
| the count | right |
| the wait | far right, in the danger ink once it is past a deadline |

The whole row stays a button into that module. On the accountant's desk one row counts money rather than
items: its bar is drawn from the count and its figure printed in rupees — same row, two units.

#### Kept on purpose

**PR-02's roll key stays.** It decodes the department bars below it, which carry no text of their own — the
one case where a key earns its place. The accountant's contribution tile lost its swatches instead, because
**that tile has no chart on it at all**: the colour box there decoded nothing.

#### And the director

The line under *Attendance across the school* is gone, and the colour key that sat beside it — the five
figures below name their own states in their own colours. `RollLegend` had no other caller, so it went too.

### Amendment BJ — Minimalism, and three sections rebuilt (2026-10-12)

*Ruling (designer): a list — drop the sub under Campus home and the grey-tail note; rename that section;
drop the number-and-swatch legend under a bar where the same data is already below it, here and anywhere
else; take More off the director and the principal; give the four documents that need attention a better UI;
shorten the appraisal tab and separate its text from its actions from who recorded it; remove the
description under every module heading; shorten both Waiting-on-you queues; cut the holds copy; rebuild the
leave-administration queue as a band; cut the liability variance and the return-column prose. "Overall aim
for minimalism and not a text-heavy approach."*

#### A legend that repeats the strip under it

Four sections drew a colour key — a swatch, a figure and a label — and then printed the same labels and the
same figures in the metric strip immediately below. **PR-01, PR-02, DH-03 and DR-03.** The strip wins: it
carries the figure at size, over its own coloured rule, with room for a note. `Band` gained a `legend`
pass-through so a band whose metrics ARE its segments can turn the key off; where the two say different
things — a report mix over a register count — it stays.

#### Three sections rebuilt

| Section | Was | Is |
|---|---|---|
| **HR-04 · the four documents needing attention** | Four paragraphs in a grid: a bold sentence and a grey sentence under it, no state marker, no way to act. The card was handed `onGoDocs` and `onRaise` and **used neither** | Four rows, each saying three things in three places — **what state** it is in, **which** document, **when** — with the one action that answers it on the right |
| **HR-04 · the appraisal tab** | One column of indented prose: the post change, then the quote at **body size** (the largest text in the section, for the softest fact on it), then the rise, then a grey line naming who recorded it — all at one indent | Three treatments for three jobs: the **decision** on one line at the top; the **words** set in behind a rule in muted ink, because somebody is speaking and that is not the record; and the **record** — who entered it, with their face — on a closing line beside the state and the action |
| **HR-28 · where the leave queue is sitting** | Four counted figures in a row. Three numbers side by side do not add up to a shape | A band: the mix across the top is **where the work is sitting**, the strip under it is **what it costs** (waiting in all, past the service level, longest wait, days asked for). The segments stay clickable, so tapping a stage still filters the register |

#### The copy, again

| Where | What went |
|---|---|
| **PR-01** | The line under *Campus home*; the grey-tail note under the five-day chart; the sub under the renamed *Five days, and where it is thin* |
| **Ten module headings** | The paragraph under the module name, on Leave administration, Doc control, Helpdesk, Reports & setup, Systems, the filing register, the accountant's gate and liability, HR's queue and staff register — and the **six identity lines** that repeated the reader's own name and designation beneath them |
| **Both Waiting-on-you queues** | **Eleven** sentences, one under each row, on the two surfaces whose whole job is to be read at a glance. The row name and the count are the answer |
| **PY-14 · the holds register** | The line under its title and a **three-part glossary in its footer**, for three kinds its own Kind column already names. The picker keeps one line each, because that IS the choice being made |
| **AC-03 · the liability variance** | The sub, and the three recorded reasons cut to the fact |
| **AC-04 · the return table** | The sentence under every row in the Return column on what a late filing costs. The due date and the state say that |
| **HR-04** | The question line under the record's tabs |

#### And the rails

**More comes off the principal and the director.** The tax, declaration, loan and helpdesk screens behind it
belong to somebody the school pays through this product's payroll, and neither of them is.

**Words on screen across 54 screens: 20,543 → 19,689**, after Amendment BI had already taken it down from
well above that. No raw keys, no overflow, no controls under 28px, no page errors.

### Amendment BI — The guidance layer comes off (2026-10-12)

*Ruling (designer): "inside the profile module of all users, remove the descriptive text from sign-in and
security, shorten the content, and do the same for What you agreed. Inside Requests remove the PGT Physics
text below the heading and the description below Days you asked to be corrected. In More, remove the
description below the main heading of the first section with all the numbers, and any description text from
the entire module where it isn't necessary. The user knows about modules and actions — remove unnecessary
guidance and informative copy from the dashboard of all users."*

Amendment BH shortened the copy. This one removes a whole **layer** of it: the line that sits under a
heading and explains what the heading already said.

#### The three screens named

| Screen | What came off |
|---|---|
| **EMP-18 · Profile**, every role | **Sign-in and security** is now the password, the number, the devices and two buttons — the three notes under them are gone. **What you agreed to** keeps the notice, the date, one line of what it covers and the consequence; the sub, the closing note and the "everything else" paragraph are gone. The page note under the title, two card subs and the identifier note went with them |
| **EMP-03/04/06/11/12/13 · Requests** | The identity line under the title (**"PGT, Physics …"**) and the page note. *Days you have asked to be corrected* keeps its heading and loses its explanation |
| **EMP-08/09/14/15/19 · More** | The page sub, all four **band subs** (including the Tax band the ruling named), all four band **feet**, every register sub, every modal sub, and the one-line description under each tax document's name |

#### And the same layer everywhere else

Nineteen more files. The pattern was the same each time:

- **The page question** — a rhetorical line under the title on every payroll and accounting screen (*"What is a person paid, what is it made of, and from when?"*). **13 of them**, gone.
- **The page note** — *"Where the attendance problems are today, by department"* under a title that says Campus attendance. **9 of them**, gone.
- **The scope banner** — *"Scoped to Indiranagar Campus only — not the group, not another campus"*. The rail and the title already say whose desk this is.
- **The identity line** on Requests and Documents, which told the reader their own designation.

**Kept on purpose:** anything that states a fact the screen cannot show — provenance (*"Computed on v2026.3, pinned to this run"*), masking, append-only, a count, a refusal's reason, an empty state, and the one-line note under each figure in a band. The test was not length. It was whether removing the line costs the reader something they could not work out.

#### Two tooling lessons, both the hard way

**A line-editing regex must never touch a line it only partly understands.** `q={t("pyh.q", { mon: m })}` ends at the inner brace, so a cut at the first `}` left a dangling `)}` that only the browser found — two screens broke. The remover now deletes whole lines only and reports a key whose render shares a line, to be moved by hand.

**A tool must refuse before it writes, not after.** The first version wrote the file and then asserted. A refusal after the write left the definition gone and the render behind, which is the one failure that puts a raw string key on a screen in front of a reader.

### Amendment BH — One language, and the copy cut to what a reader needs (2026-10-12)

*Ruling (designer): "remove the Hindi functionality from the full dashboard for all users, only one language
is default. Then shorten the copy and content from all modules where there are long descriptive paragraphs,
or the copy is too much. Remove 'Signed in as Username' copy, remove over-descriptive text."*

#### The second script goes

The canvas carried two scripts from its first screen, and every page paid for it.

| What went | How much of it |
|---|---|
| Devanagari string tables under the English ones | **80 blocks, 4,164 lines, across 50 files** — zero Devanagari characters remain in the product |
| The language switcher in the corner of every page | **42 mounts, 40 imports** |
| `lang === "hi" ? G3.font.uiDeva : G3.font.ui` on every shell | **64 font conditionals**, plus 11 more ternaries for a letter-spacing or a line-height |
| A second spelling of a date or a sample beside the first (`fromHi`, a Devanagari merge-field sample) | 4 helpers and their 7 call sites |
| `?lang=` on the deep-link contract, `naveya-lang` in storage, `initialLang` on the provider | all of it |
| `displayDeva`, `uiDeva`, and the per-role `lhDeva` / `wDeva` in the type scale | 2 families, 15 role properties |

**Hind stays** in the Latin fallback chains. It is the last link that carries the rupee sign, which Red Hat
Mono does not — tokens.jsx said so before this change and it is still true.

**`t()` and `ty()` stay too, unchanged at every one of their call sites.** They are how a string reaches a
screen. What the provider no longer does is choose.

#### "Signed in as Sunita Kulkarni, Payroll Officer"

It sat under the title of every payroll and accounting screen — **twelve of them**. The reader knows who
they signed in as, and the rail already carries their name. On eleven it was the only thing in its line, so
the line went with it; on the twelfth the as-of date shares the line and stays.

#### The copy

Every string in the product was measured. The explanatory layer was not deleted — it was cut to the fact
and relieved of the lecture.

| | Before | After |
|---|---|---|
| Strings of 200+ characters | 71 | **0** |
| Strings of 150–199 | 246 | **8** |
| Strings of 130+ | 507 | 96 |
| Longest string in the product | 329 | 214 |

**~22,000 characters cut across 36 files**, every one rewritten by hand against its screen. The rule applied
throughout: keep what the reader cannot work out for themselves, drop the sentence that explains why the
rule is a good rule. *"A payout batch is money leaving the school, so it carries its own distinct checker
— approving the run does not approve the batch"* keeps both halves, because the second is the thing a
payroll officer gets wrong. *"A provisional payroll number handed over as final is the fastest way to lose
a school's trust"* goes, because the screen has already said the number is provisional.

### Amendment BG — The lists leave the band, and the kit gets its second section shape (2026-10-11)

*Ruling (designer): "shift the Not in school and Thinner than campus today sections inside their own div in a
different box inside principal home screen. Do the same for Needs you today and Everyone else in dept head.
Do not use the same UI — use a familiar UI style and design something different."*

Both home screens had put two name lists **inside** the band, as its children. That made one object out of
two different jobs. A band answers **how much** — a mix across the top, figures over coloured rules. The
lists answer **who** — and on both screens one of the two is work. A reader scanning the figures and then
falling into a list of people inside the same border has no boundary to stop at.

#### `Split` — the band's sibling, built from different parts

Not a second band with different content. Every part of it is chosen to be the opposite of the band's:

| The band | `Split` |
|---|---|
| one population, one bar | one population, **cut in two** |
| figures over coloured rules | **counts in a chip**, beside a plain verdict |
| horizontal rules between metrics | a **vertical rule** between the halves |
| all four metrics treated alike | the half that **wants you is tinted**; the other is left plain |
| the answer is a number | the answer is a name |

The asymmetry is the point. A band treats its metrics alike because they are four readings of one thing; a
split does not, because one of its halves is work and the other is not. The tint sits on the **heading strip
of the urgent half only** — never the column, and with no stroke on it. Both of those were rulings on the
payroll screens, and they hold here. The strip carries a hairline under it whether or not it is tinted, so
the plain half is held off its own rows the way the tinted one is.

What it is **not** used for: three groups. Three is a table, not a split.

#### The two screens

| Screen | What left the band | The two halves |
|---|---|---|
| **DH-01 · Who is in today** | *Needs you today* and *Everyone else* | The urgent half is tinted and counts the people who are late, absent, away or unread — **"each one is a word you owe somebody"**. The calm half says *in, and on time — nothing to do*. The box's foot carries the rule that governs both: **a missing punch is not an absence**, and it sits with the people who need her because somebody has to say which of the two it was |
| **PR-01 · The campus this week** | *Not in school, last five school days* and *Thinner than the campus today* | The week half carries **no count** — it is a shape, not a number, and the band above already states the five-day average. The departments half is tinted and counts how many of the seven are under the campus average |

Each screen now reads as two questions in two boxes: **how much** is in the first, **where to look** is in the
second.

#### And a hover state that had never once fired

The clickable rows in the principal's new half wanted the product's tile hover, which is a CSS class — and it turned out **`.nv3-tile:hover` had never applied anywhere**. Every one of the four tiles that uses it sets its own rest background as an inline style, and an inline style beats any stylesheet selector. Four tiles across HR, payroll, the accountant and now the principal looked clickable and answered the pointer with nothing. In an inline-style product the only way a hover state can win is `!important`, so the rule has it. Verified on all four: rest → hover now changes on every one.

### Amendment BF — The product audited for every role, and the three chains that began in the middle (2026-10-11)

*Ruling (designer): "check each and every dashboard user for their full UI and build, check if anything is
missing, check if anything is left apart, check if UI is broken, check if the users are connected to each
other properly if it exists, check for overall UX, check for all usability — and once checked start fixing
everything for every user."*

Eight roles, 66 screens, swept in English, Hindi and dark for page errors, horizontal overflow,
untranslated keys, dead handlers, unreachable routes and touch targets. What the sweep found, and what was
done about it.

#### A rail item with nothing behind it

| | |
|---|---|
| **EMP-08/09/14/15/19 · the employee's More** | The rail carried it for every role and it rendered the *not built* placeholder. **Built**, four tabs, and building it closed **three chains that began in the middle**: the declaration the accountant verifies on AC-07 had no screen to be raised on; the loan HR checks and payroll sanctions had no screen to be asked on; the ticket HR works had no screen for its own raiser to read the answer |

Nothing on it keeps a second copy of anything. The declaration rows are the accountant's own; the loan
instalment is payroll's ledger row, the one the payslip deducts; the tickets are the desk's. **An internal
HR note is never shown** — the desk writes those to each other, and the raiser reads only the replies
addressed to them.

#### The chain HR and payroll did not have

**An exit was recorded in HR and payroll never heard of it.** HR-03 wrote a last working day into one
component's own state; PY-16's settlement desk read a seed of its own. A school could put somebody's exit
on record and the Full & Final list would not know — the leaver is paid a full month and nobody finds out
until the bank file is out. `v3/exits.jsx` is the fifth channel between the two desks (after the four in
`pay-handoff.jsx` and `pay-requests.jsx`). It carries a last working day, a reason and who recorded it, and
**nothing else**: the money is payroll's to compute, and a figure from the wrong desk is worse than none. The
exit arrives as **not started**, which is the truth. The seed is never mutated, because the self-checks at
the foot of `py-ops.jsx` police it.

#### Controls that promised something and kept nothing

| Where | What it did | What it does |
|---|---|---|
| **PY-05 · export this person's pay record** (twice: the row menu and the record's own footer) | Nothing at all — the worst of the three options, because it neither exports nor refuses, so the officer believes a file exists | A **recorded act**: it names what the file carries, names what it withholds (bank account, PAN, Aadhaar), says whose name it is recorded against, and says the record of it is permanent |
| **PY-05 · proposals · open the pay record** | Nothing | Opens the record the proposal settled |
| **PY-06 · which structure a new joiner goes on** | A select whose answer was thrown away — a pay group can carry more than one structure in use | The pick is kept, and it is what the confirmation names |
| **PY-06 · two fixed effective dates** · **GA-02/GA-10 · three read-back settings** | Editable fields that swallowed every keystroke | `Input` gained `readOnly`; a value that cannot change now looks like a value |
| **v3.html · the *not built* page** | Passed `title` and `icon` to `EmptyState`, which takes `head` and `body` — so the one page whose whole job is to name the missing screen was **not naming it** | Names it |

The first sweep for dead handlers matched `() => {}` only. `function () { }` and `onChange={() => {}}` on a
**visibly editable** control are the same defect in different clothing; widening the pattern found six more.

#### Every control a finger has to find

**Zero controls under 28px, across 54 screens** — from 29 after the first pass and ~180 before it.

| | |
|---|---|
| `LinkButton` | 19px. Seventeen inline links across the product, fixed in one place. The padding is the target; an equal negative margin gives it back to the layout, so every link sits where it read before |
| **the reveal toggle** (EMP-18 and HR-06) | 22px — on the control that puts an Aadhaar number on a screen |
| **the campus switch** | 27px, and **hand-rolled in five files**. All five raised; the duplication itself is filed |
| **HR-01 · where to start** | 24px, and the whole line is the control |
| **HR-05 · the document name that opens its detail** | 18.5px — the shortest control in the product |
| **the canvas's own role switcher** | 25px. Not product UI, but the designer clicks it all day |

#### One person, two staff numbers

**Five of the seven identity strips printed a staff number that was not the signed-in person's** — HR read
NAV-0104 against a profile of NAV-0021, the accountant NAV-0055 against NAV-0009, and NAV-0088 named the
head of department in one place and a teacher with a declaration in another. A staff number is the join
between roles; two of them for one person is a join a reader cannot trust. All seven now agree with kit's
`PROFILES`. (The wider collision — one number used for two different people across `person.jsx`,
`groupadmin.jsx` and `ga-systems.jsx` — is filed, not fixed: it is a rename across forty files and invisible
on any single screen.)

#### A self-service screen belongs to whoever is signed in

Every role's rail carries the same **YOURS** group, because an officer is also a member of staff. Two
screens had been written as though only the employee could reach them: the new loan line on the payslip, and
the whole of More. Sunita opening her own More would have read Ananya's declaration. Both now key on
`profileFor(role)`, and a role with no rows in a fixture gets the honest empty state rather than somebody
else's figures.

#### Filed, not fixed

- **EMP-16/17 · goals and self-appraisal** are unbuilt — and so is the dept head's goal-setting half.
  Building only the employee's end would create exactly the dangling chain this amendment closes three of.
- **The campus switch is hand-rolled five times.** It wants to be one kit component.
- **Staff-number collisions** across the seed data, as above.
- **HR's helpdesk edits stay in HR's screen.** The raiser reads the seed both ends share; HR's in-session
  changes do not propagate, as they do not today.

#### What was checked, and how

66 screens × 3 variants (English, Hindi, dark) for page errors and unrendered routes; 54 screens swept for
touch targets; every `onClick`/`onSelect`/`onChange`/`onPick` in `v3/` matched against the empty-handler
patterns; all 57 routes resolved against every `onNavigate` target; and dedicated flows for the new screen
(four tabs × three variants × four acts, plus the guards: an accepted head offers no control, sending a
proof with no file refuses and says why, and an internal note stays internal) and for the exit chain
(HR records → the desk lists the leaver by name, without a reload, with the seed untouched).

### Amendment BE — The band reaches the three oversight roles (2026-10-10)

*Ruling (designer): "do the same UI for the dept head home screen (Who is in today) as well, also for
leave module and dept attendance; do the same for principal home screen (The campus this week), campus
module, and leave module; also do the same for director campuses and leave module — and recheck
everything that nothing is broken."*

Eight screens, all opening on bare figures — or on two of them, on nothing but a row of filter pills
whose labels held the only counts on the page.

| Screen | What the mix says that the figures did not |
|---|---|
| **DH-01 Who is in today** | The **donut goes**. It said what the bar says and took a third of the row to say it, squeezing the two name lists into columns too narrow to read. The month-so-far figures become the strip; the names get the whole width |
| **DH-02 Department leave** | What stops with the head against what has already gone up to a principal, with the days asked for — and the rule about who signs what becomes the band's foot |
| **DH-03 Department attendance** | The day's shape before the register of it, with **exceptions as a figure** rather than a column somebody has to scan |
| **PR-01 The campus this week** | *Not read yet* is neither in nor out, so it gets a **segment of its own** instead of being folded into one of the two |
| **PR-02 Campus attendance** | Five figures with no mix above them; a reader could not see that four of the five are the same small remainder |
| **PR-03 Campus leave** | How much of the campus is about to be away, and how much is already past somebody else |
| **DR-03 The campuses today** | A colour legend floated at the top right — **a legend for a chart that was not on the screen.** Now the chart is there and carries it |
| **DR-02 Trust leave** | What has reached the director against what is still with a head of department or a principal, and how much of it is long leave |

**Every figure wears the colour of the segment it counts**, which is what makes the two halves of a band
one object rather than a chart with a table under it.

### Amendment BD — The band becomes a kit component, and three HR screens open with it (2026-10-10)

*Rulings (designer): "redesign the section inside Staff logins just like this UI"; "design the similar
section for the Requests tab inside Doc control"; "also build the same in Staff register"; "rename the
Queue module to Home."*

**Six screens had hand-rolled the same section**, so it is a component now: `Band` in the kit. A heading,
the mix across the top as a stacked bar with a colour-coded legend, the figures beneath it each over a
rule in the colour of what it counts, and an optional foot for the rule that governs everything above it.
`segments` is optional — without it the band is a heading over a figure strip.

| Screen | What the bar says that four figures did not |
|---|---|
| **HR-38 Staff logins** | Four of nine are signing in; the other five are split between invited-and-waiting, locked out, and never given an account. The bar shows that most of the roll cannot currently sign in |
| **HR-02 Staff register** | What the roll is made of — teaching against everybody who keeps a school running — with the two things about to change it: probations falling due and contracts running out |
| **HR-09 Doc control · Requests** | The mix of what is out with staff. Three lane tabs told a reader the counts only if they read three labels |

**And one thing the bands exposed about themselves.** A metric marked `warn` was always drawn in danger
red while the rule beneath it kept the metric's own colour, so *2 invited* read as red text over an amber
rule. The figure and its rule are one object: `warn` now means *wear your own colour*, not *turn red*.
Which also means a metric that is merely work waiting — responses to check — is not drawn as an alarm at
all.

**Queue is Home.** The module gained a deck and a waiting list several amendments ago; *Queue* named the
table on it rather than the screen, and the rail item carried a list icon to match. Both corrected.

### Amendment BC — PY-18 gains a Reports tab beside its registers (2026-10-10)

*Ruling (designer): "add this same for the payroll officer as well, inside registers and reports only —
create a new tab inside this module with reports and keep the registers as it is."*

**They are two acts, not two names for one.** A register is a **shelf you browse**: fifteen named things
this month produced, each opened and read, each already true. A report is a **request you make**: say what
and over what stretch of time, and it is built then. They live in the same module because a reader goes to
the same place for both, so the module now has two tabs — and **Registers is untouched**, down to its
band, its filter strip and the fourteen specs behind it.

**The Reports tab is the accountant's builder, in payroll's own subjects.** One box holds every constraint
— module, report, covering, the span's own input, format — with the chosen report's question under the
row and the identifier gate inside the same box. The preview is that box's footer:

| Report | Over a range |
|---|---|
| **The run** — payroll register, variance, bank file, payslip issue, cost to the school, paid days | 412 lines a month becomes 824 over a quarter, and the strip says so |
| **Adjustments** — claims, overtime, loans, arrears, appraisal rises | |
| **Exits** — full and final settlements | |
| **People** — headcount movement, people with no salary assigned | |

The two things only a range can reveal are the same here as on the other desk: a range that **crosses a
change of rules** names both versions, and a range containing a month **not yet disbursed** makes the
whole report provisional and says which month did it.

**And the reports this desk makes on its own** are listed below the box, in the same register as the ones
the officer builds: the payroll register when a run is approved, the bank summary when the file goes out,
the payslip pack when it is published, the paid-days sheet at the month's close, the variance when a run
is computed. A *Produced* column tells them apart. Personal identifiers stay off unless somebody asks for
them here with a reason — which is why the clock can run without one and a person cannot.

### Amendment BB — The filing acts become dialogs, the challan correction gets a flow, and Reports arrives (2026-10-10)

*Rulings (designer): "going inside a filing detail should happen from the actions menu, not from clicking
the row"; "inside the detail screen the actions open at the very bottom under the section — shift all the
actions into a pop-up modal"; "recheck this module for correctness and that it is in proper usage state
for the accountant with no loss of information"; "inside liability there is an action 'correct the
challan' and nothing happens when it is clicked — design the full flow"; "design a fresh module called
Reports where the accountant can generate reports for the actions he does, payroll or filing or anything."*

**A row in the filings register is not a button.** Every other register in the product opens something to
read; this one opens a workspace where returns are generated and submitted to a government portal, and a
stray click is not a decision to start one. The row's own menu now carries every act and each names
itself — *open the return*, *generate it*, *mark it filed*, and on a filed return *download*, *record a
portal rejection*, *file a revised return*. The menu hands the workspace both the return and the act, so
arriving on it opens straight into the right dialog; the handoff is consumed once, and a later visit opens
the workspace plain.

**The acts moved out of the page and into dialogs.** They had been forms that unfolded at the foot of a
long screen: on a filed return the controls sat below three screenfuls, and the reader scrolled away from
the figure they were deciding about the moment they started. Each dialog now **restates what it is acting
on** before it acts — the return, the period, the amount, the people in it, the format version and the
configuration — because a confirm with no facts in it is a confirm nobody can check. Each ends in a plain
statement of what happened and what follows.

**The kit gained `Modal`.** Three files had hand-rolled their own centred portal, which is how focus
traps and scroll locks end up subtly different per screen. One component now: focus moves in and comes
back, Escape closes, the page behind cannot scroll, the backdrop is a dismissal. `SideScreen` stays for
surfaces you *read*; `Modal` is for acts that interrupt.

**"Correct a recorded challan" did nothing.** It was an empty handler — the silent-failure family again,
and the kind that teaches a reader the controls on a screen are decorative. The flow it needed:

- the **entry on record** shown first, with the note that it stays and that the correction is written
  beside it;
- the corrected number, date and amount, prefilled from what is there;
- a **required reason**, because a figure that moved with no stated cause is the first thing an auditor
  asks about;
- and, live as the amount is typed, **what the correction leaves** — *this correction leaves ₹1,370.00
  still to deposit. The variance is named, not reconciled away.*

Recording a payment moved into a dialog with it, for the same reason.

**AC-09 · Reports — new, and a BUILDER rather than a shelf.** *Ruling (designer): "the accountant can
choose what report type he wants to generate and for what duration — I don't want pre-generated reports
like the functionality."*

The first cut was a catalogue: sixteen rows, each with its line count and total, waiting to be taken. That
is a shelf of figures that were true once. The screen asks two questions now and makes the artefact when
they are answered — **what do you need**, and **for what stretch of time**. Nothing exists until it is
asked for.

**It is one box.** *Ruling: "I only need one box inside which the report type and report duration should
exist, and below that the reports should be visible — I don't want a different section for each
constraint."* The first builder asked its three questions in three cards, which put two rules between a
reader and a form they fill in a single pass, and made the screen twice as tall as the decision in it.
Everything that narrows a report now sits in one box, in one row that wraps:

- **What** — module, then report within it, with the report's own question under the row. Still grouped by
  the module the figures come from, because that is what decides whether one is final.
- **For how long** — one month, a quarter, the financial year so far, or **any two dates**, with the
  matching input appearing beside the choice. The range resolves against the months this desk actually
  has, and a range with nothing in it says so.
- **For whom, and in what form** — entity and format, plus the identifier toggle where the report carries
  any, which belongs to the choice rather than to a section of its own.

**And the preview is that box's footer**, not a second subject: what you are about to produce is not a
different topic from what you asked for.

Then a panel states **what it will contain before it is produced**: the months, the line count (which
scales with the range — 412 a month across three months is 1,236), the total it reports, the runs it
derives from, and two things only a range can reveal:

| What a range exposes | How the panel says it |
|---|---|
| It crosses a configuration change | Names **both versions** — *the artefact names the version each month was computed on; a report that averages across a change will not reconcile against the filings* |
| It contains a month whose run is not approved | **Provisional**, and says **which month** did it |

| Rule | How the screen holds it |
|---|---|
| A report states what it came from | Period, entity, the run it derives from, the pinned configuration — on the row, in the dialog, and stamped on the artefact |
| A report from an unapproved run is provisional | Marked on the catalogue and warned about in the dialog, so a working figure cannot be sent as a final one by accident |
| Personal data leaves only with a reason | The identifier toggle is off by default, the reason is a required field, and the export is recorded against the person who took it |

**Below the box: the reports, including the ones nobody asked for.** A payroll product makes some
artefacts on a clock rather than on request — the register when a run is approved, the bank summary when
the file goes out, the ECR draft and the reconciliation on the first of the month, the quarterly return
when the quarter closes. They are listed **in the same register** as the ones the accountant builds,
because a reader looking for last month's register does not care which of the two made it; they care
whether it is final and what it covers. A *Produced* column tells them apart — *automatically, when the
run was approved* against *by you, on request* — and each row downloads.

The list is a register, not a folder: append-only, with the range, how it was made, who took it, when, the
scope and whether it was provisional. An export of a statutory or personal-data register is a disclosure,
and the list is the evidence that it happened. An automatic report carries no personal identifiers unless
somebody asks for them here, which is why the clock can run without a reason and a person cannot.

**One thing the rebuild caught.** With an invalid range the output panel collapsed to an empty state and
took the primary control with it — against the rule written two amendments earlier. The act stays on the
panel in every state now and says why it is closed: *the second date comes before the first*, *no month on
this desk falls in that range*, *say why the identifiers are needed first*.

### Amendment BA — The accountant's desk rebuilt: three screens become eight (2026-10-10)

*Ruling (designer): "work on the modules for the accountant user — what is already built is outdated.
Rebuild, redesign and revamp the full flow, screens and modules of what should be available for the
accountant and how this user links to the payroll officer and HR. Design the full flow with all internal
actions, screens, modals. Keep the UX simple, visually improved, follow the UI from the payroll officer,
proper usage, nothing broken, and recheck everything once complete."*

**The role owned eight screens and had three.** AC-01, AC-02 and AC-03 existed in an older visual
language; AC-04 through AC-08 did not exist at all, which left the accountant able to approve a payroll
run and reconcile a liability but unable to *file* anything — the half of the role the spec calls its
defining work. The rail is eight items now, the same depth the payroll officer's has.

| Screen | What it answers | Shape |
|---|---|---|
| **AC-01 Home** | what is due, and what is waiting for my sign-off | the payroll desk's grid: gate + overdue, one waiting list, six tiles |
| **AC-02 Approvals** | should I release this money or this return | unchanged — its bones were already right |
| **AC-03 Liability** | what do we owe, and does it match what we paid | unchanged |
| **AC-04 Filings** | where does each return stand | band + filter strip + register, rows that open |
| **AC-05 Filing workspace** | is this return correct enough to submit | a process spine: validate, generate, portal check, filed |
| **AC-06 Bonus run** | what bonus do we owe, and who signs it off | a maker task that ends by handing itself away |
| **AC-07 Declarations** | do the proofs support what was declared | register, then one person, then head by head |
| **AC-08 Contributions** | what did each person generate this period | a register with **no mutating action, by design** |

**Four rules the new screens enforce rather than mention.**

- **A return from an unapproved run is a false return.** Generate is shown *disabled with the reason*, not
  hidden. The 24Q is blocked today for exactly this reason, and says so.
- **An unacknowledged filing is not a filing.** *Mark it filed* opens a field, and the confirm stays shut
  until the acknowledgement number is in it.
- **A verified amount cannot exceed a declared one.** Accepting more than somebody claimed is not
  verification, so the control refuses it with the rule in words.
- **The maker cannot finalise.** The bonus run's last act is handing itself to a checker, and the gate
  already shows it as *you prepared this* — the rule taught by the screen rather than by a server error.

**No rate is written anywhere on this desk.** The bonus band, the calculation cap and the eligibility
ceiling are read from the pinned configuration and labelled *read, never typed*; the configuration version
is printed beside every figure that depends on it.

**How it links to the rest of the product.** The payroll officer's *send for approval* lands in AC-02;
AC-02's evidence tabs are payroll's own variance report and register; AC-05's validation errors route to
the staff register, because the field belongs to HR and not to the return; AC-06's finalised run is paid
through a payroll run rather than paying itself; and AC-08 is what every filing is built from, which is
why AC-05 opens it rather than restating it.

**One honest limitation recorded rather than faked.** AC-05's per-person errors should deep-link to that
person's staff record (HR-04). This canvas holds one staff record and cannot open an arbitrary person's,
so the control routes to the register they are found on and is labelled *find them on the register*.
Sending somebody to a record that is not theirs would be worse than sending them one step short.

### Amendment AZ — HR-01 given the same pass as PY-01 (2026-10-09)

*Ruling (designer): "now do the same for the HR dashboard home screen."*

**Then the band, and one tile (same day).** *Rulings: "remove hiring, offers and only keep the pay
request section"; "use the same style as this for the What is waiting on you section — keep the same UI
style with bars etc."*

**Hiring and offers were a dashboard HR did not ask for.** The pay-request chain stays because it is the
one module the queue genuinely does not speak for and the one where HR blocks somebody else: HR verifies,
payroll decides the money, and nothing moves until the first half is done. It sits **under the queue, in
the queue's column**, at the queue's width — not as a full-width band of its own, because it is more of
what the table above it holds rather than a second statement about the day. Its four subjects lay
**across** that column — reimbursements, overtime, loans, appraisal rises, each with the count over a
coloured rule, the same strip the band uses — so the page has one way of showing a row of figures rather
than two. The two read-only summaries published for the removed tiles were withdrawn with them; dead
exports are how a second opinion about a figure gets into a product later.

**And "What is waiting on you" became the band the registers screen uses:** the mix across the top as a
stacked bar with a colour-coded legend — *7 past their SLA · 22 due soon · 3 waiting on a review* — then
the four figures beneath it, each carrying the colour of what it counts. Four bare figures said how big
the job was and nothing about its shape. The bar says in one read that seven of the thirty-two are
already late, which is the only proportion on this screen anybody acts on.

**One ranking, not three.** The screen stated the same fact at three levels of detail in a column: the
figure (*7 past their SLA*), a *Where to start* strip naming three lines, and a table listing those lines
again. Worse, the strip and the table disagreed about order — the strip sorted by urgency, the table was
in whatever order the data happened to be in. There is now **one `urgentFirst()`**, used by both: a breach
outranks a deadline, a deadline outranks a review, and within a kind the oldest wins. The card names the
single line at the top of that list; the register *is* the list. They cannot drift because they are the
same sort.

**"People moving this week" removed.** It restated two figures the card above it already carried —
*joined this week 2*, *left this week 1* — and routed to the register both of those route to. Same rule as
the payroll desk's Exits tile: a landing screen mentions a module once.

**And a deck, of exactly the three modules the queue does not speak for.** The queue already holds
documents, onboarding, probation, contracts, candidates, helpdesk and attendance, so a tile for any of
those would have been the second telling of one fact. What it never said is how the hiring ladder is
filling, which offers are still out with a candidate, and what HR owes payroll:

| Tile | Shape | Why that shape |
|---|---|---|
| **Hiring** | a ladder — four rungs down a rail with who is standing on each | The module's own word for it, and a sequence reads down a narrow tile |
| **Offers** | two groups — *out with a candidate* vs *settled* | An offer still out is a seat nobody else can be given; a settled one is history |
| **Pay requests** | a 2 × 2 quadrant | The chain carries exactly four subjects and they are peers, not a sequence |

**Each reads from the module that owns it.** `hr-hiring.jsx` and `hr-offers.jsx` now publish a read-only
summary (`Pages3.HRHiringData` / `.HROffersData`) and the home screen reads it, because a second count of
what the school is hiring is a second opinion about it. Hiring and offers follow the **campus switch**, as
HR-01 §Scope requires. Pay requests cannot — a request is raised by a person, not a campus — so the tile
**says so** rather than implying the switch above it applies.

### Amendment AY — PY-01 rebuilt as Home: one question, four blocks (2026-10-09)

*Ruling (designer): "based on all the modules the payroll officer works with, build and redesign the
'this month' module and rename it to Home — inside, short info from all the other modules at a glance,
like a dashboard landing screen. Don't make it too cluttered; only information useful for the payroll
officer."*

**The rail item is now Home**, not "This month", and `pages/py-home.jsx` replaces the PY-01 in
`payroll.jsx`.

**It answers one question: *what needs me today?*** Not "here is everything". A landing screen that
mirrors every module becomes a second, worse copy of each of them and the officer learns to scroll past
it. So one rule decided the contents:

> **A thing earns a place here only if it is waiting on this person, or if not knowing it would cost them
> the day.**

Which is why there is no payslip count, no list of pay groups and no chart of the year — those are
questions you go to a module to ask. Four blocks, in the order the morning actually goes:

1. **The run.** The month is a process and everything else on this desk feeds it, so where it stands, what
   it comes to, the single next act, and the same six-stop strip the run screen uses — reduced to a bar.
2. **Waiting on you.** One list across *every* module, oldest first: reimbursements, loan requests and
   overtime HR verified, rises recorded, people with no salary, settlements not started. Each row says how
   long it has waited and goes straight there. **This is the screen's real work** — the officer's morning
   is not organised by module, it is organised by what has been sitting longest.
3. **What is already late.** The statutory clocks that have gone past — wages within two working days of
   an exit, EPF in fifteen to twenty, gratuity in thirty. Late is not pending and is not drawn like it:
   danger tint, the names, and a filled danger button into Exits.
4. **The rest of the desk.** Six modules, one line each, carrying the single number that would make the
   officer open them. Six tiles, not six dashboards.

**Every figure is read from the module that owns it** — the run's data, the pay-request store, the loan
register, the exits store, the handoff. A landing screen that keeps its own copy of a figure is how two
numbers for one fact get into a product.

**Honest about what it cannot know:** the first draft greeted the officer with "Good morning", which the
screen has no way to know is true at nine in the evening. It is *"Sunita's desk"* — time-neutral, and it
uses the word the rest of the module's copy already uses ("this desk", "left your desk"). A count in the
late-deadline copy said "these three have gone past" above a list of four; it counts now.

**The Exits tile removed, and the desk settled into five (same day).** *Rulings: "remove the Exits full
section"; "I see a lot of space between Waiting on you and Running in the Adjustments section, fix this";
"improve the overall design of the Home screen with the sections inside".*

**Exits already had two places on this screen.** *Already past a deadline* names the people whose statutory
clocks have run out and carries the way in; *Settlements not started* is a row of the queue. A third block
restated a module the officer had been told about twice, and the one fact it added — how many settlements
sit with the checker — is not something anybody opens a landing screen to learn. The module keeps its rail
item and both of its mentions; what went is the duplicate.

**The gap inside Adjustments was a stretch artefact.** The tile had been told to spread its two groups to
the top and bottom of a box whose height its neighbour set, so *Running* and *Waiting on you* ended up at
opposite ends and stopped reading as one list of what the module holds. They sit together now, and the
leftover space became a footer that says something the tile was missing anyway: **₹2,10,500.00 of loan
recovers from this run** — the line that ties Adjustments to the figure at the top of the page.

**Five tiles do not divide into rows of three**, so the grid changed shape rather than leaving a short row:

| Row | Tiles |
|---|---|
| Deep | Adjustments · Staff & salaries · Registers — two columns each |
| Wide | Paid days · Pay rules — three columns each |

A wide tile earns its width by laying content **across**: Paid days puts the two groups that can lose pay
on the left and what that is measured against on the right; Pay rules puts the three groups abreast
instead of stacking them down one edge of a half-empty box.

**The run panel's last gap is filled with the thing the screen never said.** A payroll run is
maker-checker — the officer cannot finish it alone — and nowhere on this desk did it say who it goes to.
The foot of the run now names both: *Run by Sunita Kulkarni, Payroll Officer* · *Approval by Rajiv Menon,
Accountant*, which is the rule from AC-02 made visible on the screen the officer starts their day on.

**And two consistency passes.** Every bottom-anchored line on the page now sits on a hairline rule, so a
footer reads as a footer wherever it appears; and a tile you can open **lifts under the pointer** the same
way a live register row does — previously the arrow said it went somewhere and nothing confirmed the
pointer was on it.

**Exits, Registers and Staff redrawn again (same day).** *Rulings: "I don't like the UI of the Exits
section, redesign it"; "in Registers I should have better UI with more info"; "fix the UI of the Staff &
salaries section as well".*

**Exits reads down, not across.** The pipeline was the right metaphor and the wrong axis: laid across a
400-pixel tile, all four stage labels wrapped onto two lines and the dots stopped lining up with anything
under them. It is a **vertical track** now — a rail of four dots down the left, the stage beside each and
its count on the right. And the breach moved onto the stage it happened at: *Not started, 1 past a
deadline* · *Computed with you, 1 past a deadline* · *With the checker, 2 past a deadline*, each in danger
ink with a danger dot. A clock that has run out belongs to a settlement, and the officer needs to know
which stage is holding it — a lone "4 past a deadline" chip at the foot said the number and not the where.

**Registers answers the question people actually ask it.** Four bare counts in a quadrant had the
catalogue's shape and none of its substance. Each subject now carries **what it covers** and **whether it
is safe to send**:

| Subject | Covers | State |
|---|---|---|
| The run | Register, variance, bank file, statutory | **provisional** — the August run is not approved |
| Adjustments | Claims, overtime, loans, arrears, rises | final |
| Exits | Full and final settlements | final |
| People | Headcount movement, cost over the session | final |

The provisional mark is PY-18's own rule enforced on the landing screen: *a report from a run that is not
approved is provisional.* It is computed from the run's stage, not typed, so it clears itself the moment
the accountant approves. The foot states the provenance once — *all of them from PR-2026-08, priced on
v2026.3* — which is the promise the tile's own subtitle makes.

**Staff & salaries separates the roll from what is blocking it.** Three bare name/number rows said nothing
a figure had not already said, and the two alerts hung underneath as loose chips that read as decoration.
Each group now carries its **share of the roll** (65% / 29% / 6%), and the blockers sit in an **inset
panel** of their own, tinted and headed *waiting to be set* — they are not two more rows of the roster,
they are the reason the run cannot be sent. When both are clear the panel goes quiet rather than
disappearing, so the tile keeps its shape.

**And the row had to be rebalanced around them.** Registers grew tall enough to leave Paid days and Pay
rules hollow, so both were given the thing they were missing rather than padding: Paid days now says what
62 lost days are measured against (*31 days in August, 389 staff who can lose pay*), and Pay rules says
what each group is actually priced by (*earning heads 6, deductions 4*) instead of only naming it. What
gap remains sits above a ruled footer, per the rule the run panel set.

**And then six tiles that were all the same tile (same day).** *Rulings: "the last two rows of sections
containing adjustments, exits etc. all have the same UI, which looks bland and bad — I want all the
sections to be different in terms of UI"; "fix the spacing between the input/computed line and the figure
above"; "I want the input to start from the section left and not in the middle".*

**Taking the charts out had left one shape doing six jobs.** Every tile was a figure over a two-column
stat grid, so Adjustments, Exits, Staff, Paid days, Pay rules and Registers were distinguishable only by
their words. Six different kinds of fact now take six different shapes, each chosen by what the module
actually is:

| Tile | Shape | Why that shape |
|---|---|---|
| **Adjustments** | two labelled groups — *running* and *waiting on you* | What is recovering on its own and what needs a decision are different kinds of fact; one list mixed them |
| **Exits** | a pipeline — four dots in sequence with counts under them | An exit *is* a sequence; the tile should be the same object the module is |
| **Staff & salaries** | a roster — a row per pay group, then the alerts as status marks | The roll is a list of groups, and what is wrong with it is not another row |
| **Paid days** | two tinted mini-cards and the reason the third is absent | Two groups have loss of pay and one structurally cannot; a stat grid printed an em-dash and explained nothing |
| **Pay rules** | the groups as the pill rows they already are on PY-12 | The tile should look like the screen it opens |
| **Registers** | a 2 × 2 quadrant with dividers | The catalogue is four subjects, so the tile is four quadrants |

**The stepper starts where the panel starts.** The run's six stops were laid out as equal centred cells,
which put *Inputs* a sixth of the way into the panel and left the first dot floating under the middle of
nothing. Each stop now begins at its own dot, flush with the figure above it, and the connector runs from
dot to dot rather than from cell edge to cell edge.

**Spacing between the figure, the split and the stepper was the same gap three times.** The split row's
rule now sits 14px off the figure instead of 16, and the stepper 20px under the split — tight enough that
the three read as one block about the run rather than three unrelated rows.

**Two panels stretched to their neighbours and left a hole at the foot.** The fix is a footer, not a
ragged row: the run's trailing line sits on a rule as the panel's last word, and the Exits tile's foot
carries the one thing an exit tile exists to say — whether a statutory clock has run out, in danger ink
when it has and in settled ink when it has not. The register quadrant stretches instead, since four cells
can simply take the height.

**And then most of the charts came straight back out (same day).** *Rulings: "all sections should not have
bar lines with colours, remove those — think of a different UI style for the other sections, and only keep
the Waiting on you section as it is"; "remove the bar graph from the August run section and redesign the UI
of this section as well"; "in Already past a deadline I need the text font size to be small for the '9 days
over' text, and use proper red from the design system for the bars".*

**The correction was right, and the reason is worth keeping.** A coloured stacked bar on all six module
tiles made six different questions look like one chart repeated — and not one of those six was asking
*what proportion*. They were asking *how many of each*, which a bar answers badly and a figure answers
exactly. The tiles are a **stat grid** now: the number above its label, two to a row, no chart at all, and
colour only on a number that needs acting on.

**A bar survives in exactly one place**, because there it carries something a figure cannot: *how far past
a deadline one person is against another*. Fifty-eight days and three days are not the same kind of late,
and the bar is the only thing on the screen that says so. Its red is the design system's `danger`, not the
chart palette's, and the days-over figure dropped to caption size so the name leads the row rather than
the number.

**The run shows no chart either.** Its figure, the three figures it splits into, and the six-stop sequence
drawn as the same dot stepper the run screen uses — which is a progress indicator, not a graph. The
sparkline went with the bars; the trend already has a home in the registers.

**What stayed:** *Waiting on you*, exactly as it was. Its stacked bar is the one place a proportion is the
question — what the queue is made of — and its colours repeat as the dot on each row so the bar and the
list read as one object.

**Then one grid, and a chart in every box (same day).** *Rulings: "the rest of the desk should not be a
heading"; "the UI should be rearranged so all the boxes line up in a layout"; "the boxes/sections look very
blank — use proper graphs, bars, pie etc. to show info with proper colour coding".*

- **The heading is gone.** The modules are not a section of the page, they are the page.
- **One six-column grid holds everything**, so the edges line up down the whole screen instead of each
  section finding its own width: the run spans four and the late block two, *Waiting on you* spans all six,
  and the six module tiles form two rows of three. Verified at 1440 and 1120 — the column edges sit at the
  same x and every box in a row shares a height.
- **Every box shows its figure AND the shape of it.** A number alone leaves a box looking empty and leaves
  the reader nothing to compare against. Three shapes, each for a different question: **Split** (what is
  this made of — a stacked bar with a colour-coded legend), **Bars** (how do these compare — one row each,
  scaled to a shared maximum), **Spark** (which way is it going — the session as a line).

| Box | What it draws |
|---|---|
| The run | split of net / deductions / employer cost · sparkline of net paid April–August with both end values · the six named stages across the foot |
| Past a deadline | a bar per person against a sixty-day scale, so 58 days over looks nothing like 3 |
| Waiting on you | a stacked bar of the mix, one colour per kind, repeated as the dot on each row so bar and list read as one object — plus the longest wait, because a total says how much there is and not how long any of it has sat |
| Adjustments · Exits · Staff · Registers | splits with a legend row each |
| Paid days · Pay rules | comparison bars per pay group |

Colour follows the rest of the product: amber for waiting on this desk, red for late or unpriced, green for
settled, and teal / blue / purple for the three pay groups wherever they appear.

**A layout note worth keeping:** the run panel stretches to match the taller box beside it, which left a
field of empty surface under a three-row legend. The fix was not to let the row go ragged — the designer
asked for boxes that line up — but to give the panel enough to say: the stage sequence, named, across its
foot.

**The desk became a bento (same day).** *Rulings: "show info of the rest of the desk as well in a bento grid
for all internal decks, and not everything in one section like this"; "we do not have this CTA colour as
Open exits — use primary CTA"; "don't make the full section bg pink — use proper illustrations, icons or
some subtle colour somewhere to denote exits".*

- **One stacked list of six lines was a menu, not the state of a desk.** Each module has a tile now,
  carrying its **internal decks**: Adjustments shows loans recovering, claims, overtime and rises waiting
  and arrears raised; Exits shows not started, computed, with the checker, past a deadline and settled;
  Staff & salaries shows who has no salary and which rises are waiting to become components; Paid days
  splits loss of pay by group; Pay rules shows the heads in each; Registers shows its four subjects.
  Anything waiting on this desk is drawn in danger ink, so a tile says whether it needs opening without
  being opened.
- **The tiles are deliberately unequal**, which is what makes it a bento rather than a grid: the two with
  the most inside them take the first row, the three shallow ones share the second, and the register
  catalogue runs the full width and lays its decks **across** rather than down — a full-width tile with a
  single column of text is a column beside a field of nothing. The rows are explicit, because flex-basis
  alone let a third tile slip onto the first row at some widths and not others, making the bento's shape
  depend on the window.
- **The CTA is the product's primary**, not a filled danger button. Danger-filled is reserved for an act
  that refuses or destroys something; *Open exits* navigates.
- **The late block is a card like any other.** The colour is carried by a tinted icon chip, a small dot
  per row and the figures — not by drowning the section in pink. A whole card in a tint stops reading as
  urgent and starts reading as a category, which is the opposite of the point. Each row now names the
  person, says which clock, and puts the days-over in danger ink on the right.

**Per PY-01's own rule, F&F appears as a count and never as a list of names** — *settlements not started,
2* — while the late block names people because a breached statutory deadline is about a person and a
date, not a queue depth.

### Amendment AX — Registers and reports rebuilt; past runs made explorable (2026-10-09)

*Rulings (designer): "show the history of past runs in the other months"; and "redesign the full registers
and reports module — include all reports for all settlements, runs, claims, overtime etc., keeping the
consistency from all other modules, and if any other module is linked to this, do that as well."*

**Past runs are no longer a dead end.** Selecting a closed month on PY-07 showed its figures and stopped.
It now also offers **what that run produced** — its payslip register, its variance review, its bank file —
and a route to every register for that month. A past run is the evidence anybody asking about that month
actually wants.

**PY-18 rebuilt as `pages/py-reports.jsx`.** The screen it replaces had nine report *names* in a list and
no way to open any of them. It kept one good idea, which is kept here and made the module's thesis:
**every report states the period it covers, the run it derives from, the configuration that run pinned,
and the line that reconciles it.** A figure without those four is one somebody has to defend from memory a
year later. And the rule that matters most: a report from a run that is not approved is **provisional**,
said on the period, on every row derived from it, and on the export — a working figure handed over as
final is the fastest way to lose a school's trust.

**A catalogue, not a tab bar.** Fifteen registers across four subjects; tabs would make the reader learn a
layout per subject and hide the one they came for. The catalogue answers *where is the number I was asked
for* in one read — what it answers, what it covers, how many rows, the total, and whether it is safe to
send.

| Subject | Registers |
|---|---|
| **The run** | run history · payroll register (PY-10) · variance review (PY-09) · bank file (PY-11) · statutory contributions · pay-group summary · paid days |
| **Adjustments** | reimbursement claims · overtime · loans and advances · arrears · appraisal rises |
| **Exits** | full and final settlements |
| **People** | headcount movement · cost over the session |

**It reads the other modules rather than restating them** — claims, overtime and rises from the shared
pay-request store, loans and arrears from the adjustments module, settlements from the exits module,
totals and pay groups from the run's own data. Nothing is retyped, so no register can hold a second
opinion about a figure another screen owns.

**Three of them are the run's stages seen from here.** The payroll register, the variance review and the
bank file are reports *and* stages; they open from the catalogue exactly as they open from the run. One
object, two ways in, no second copy — and it is the second way in for three screens that had none at all
a session ago.

**Consistency with the rest of the payroll rail:** band with a pickable stacked bar over four measured
figures, a one-line filter strip, a register whose rows open, `tone: "go"` / `danger` on the row menu, and
one filled primary per surface. Every register renders through a single `ReportView`, so none can pick up
a different layout from its neighbour by accident.

### Amendment AW — The run's flow audited, and three screens found with no way in (2026-10-09)

*Ruling (designer): "recheck all the actions and the usage and flow of payroll run, and check how the CTAs
and other actions link between other modules and correct them if a flow or a redirect is broken"; plus
"for the unresolved state in the run inside the table I need an option to let the user directly go to the
unresolved case and fix it there"; and "use primary CTA in payroll run overall".*

**The audit.** Every `onNavigate` target in the canvas resolves against the route table — no dead keys. The
breakage was worse than a dead key: **three screens had no way in at all.** When the payroll rail went to
eight modules, `PYParts.Variance`, `.Register` and `.PayPublish` stopped being composed by any screen, so
**PY-09 (variance review), PY-10 (payslip register) and PY-11 (bank file and disbursement) became
unreachable** — and PY-09 is a *required stage* of a run. The run console's "open the variance review"
pointed at `pyReports`, which is a different screen entirely: not a broken link, a **wrong** one, which is
harder to notice.

**They are stages of the run, so the run opens them.** Variance, the payslip register and the bank file now
open over the run with a named way back, which is where they were always going — they are not neighbours of
the run on a rail, they are what it produces and how it is checked. The bank file's gate stays where the
spec puts it: on *generating* the file, which that screen states itself. Hiding the way in had made the
whole screen unreachable rather than making the control safe.

**The unresolved input is now a route, not a count.** "1 unresolved" against salary assignments was a dead
number. It is **read from the handoff** rather than asserted — it is exactly the people HR created whom
payroll has not priced — so the row names them (*Ritika Chawla, NAV-0431*) and carries a **Fix it** primary
that hands the id across and lands on Staff & salaries **with the assign flow already open**. One click
from the blockage to the fix.

**Primaries per card.** Each card's own advancing act is filled: *Fix it*, *Move the cut-off*, *Hold
somebody*, *Open the variance review*, and *Send for approval* in the sidebar. Purely navigational controls
(*Open adjustments*, *Open the payslip register*) stay outlined — they move you, they do not move the run.

**Who creates a run.** The **Payroll Officer**, not the Accountant: PY-07's *Start the run* is "Payroll
Operator with `payroll.run`", which creates `PayrollRun status=draft` and **pins the effective
`StatutoryConfig` version** at that moment. The officer also computes, reviews variance, sends for
approval, generates the bank file and marks disbursed. The **Accountant is the checker** —
`payroll.approve` / `makerchecker.approve` on AC-02 — and approval is the only step the officer cannot
take, which is why that control is absent from PY-07 and the screen says so.

**Gap closed in the same session — *Start the run* is built.** *(Designer: "build full start a payroll run
functionality and module.")* The run gained the dimension it was missing: **the month**.

- **A period bar** runs under the header — April to September with each one's state — because a run belongs
  to a month and the months are a sequence. Out-of-order runs corrupt arrears, so a period is picked from
  the line of what came before, not out of nowhere.
- **A closed month** shows its run identifier, net, headcount and pinned config, and states that nothing on
  it can change: a correction to a closed run is an arrear in a later one.
- **A month with no run gets the page**, because the act that creates one is the only thing on this screen
  that does not exist until somebody does it. It says what starting does and the three things it means:
  it **pins** the configuration in force today; it **includes the pay groups you choose**, so leaving one
  out means nobody in it is paid; and it is a **draft**, the only thing here that can be discarded.
- **The start panel** confirms legal entity, period and the version being pinned, with pay-group
  checkboxes defaulting to all and a refusal if none is left. Because August is still with the checker it
  **warns and stays disabled until the officer acknowledges it** — the spec's *prior month open → warns*
  case, made real rather than described.
- **After starting**, the run is a draft: no figures at all ("a draft has no figures until it is computed"),
  Compute as the primary, and **Discard** offered with a required reason — `draft` only, per the spec.

**Previous gap text, for the record:** *Start the run* itself — the act that creates the `draft` — **has no home on
any built screen.** PY-07 as built assumes a run already exists. Creating next month's run needs either a
period selector on this screen or an empty state before the first stage; flagged rather than invented.

### Amendment AV — PY-07 rebuilt: the pipeline is the page (2026-10-09)

*Rulings (designer): research payroll runs first — "how they are created, how they work, what actions can be
done inside them, what can be done by the payroll officer, edits etc, and how a payroll run is affected by
other adjustments"; then, on the findings: **"yes add cutoff and hold/skip/withhold, lets start the
redesign."***

**What a run is, and why it was drawn wrong.** Every other payroll screen answers *what is true now*. The
run answers *how far has this month got, and what is holding it*. It is the only surface in the product
that is a **process over time**, and the old PY-07 (`pages/payroll.jsx`, a pre-v3 prototype of 3,373 lines)
rendered **one frozen state** — awaiting-checker — at 2,806px, with the stage spine as a card on the page
rather than the page's spine. It also predated the adjustments work entirely, so it could not say what was
flowing into it.

**New: `pages/py-run.jsx`.** The pipeline runs across the top — **Inputs · Computed · Variance · Checker ·
Approved · Paid** — and **what the page offers changes with the stage you are standing in**: compute when
there is nothing computed, send when there is, recall when the checker holds it. Then four reconciling
figures, and the page answers its three questions in order: *can I compute yet* (inputs, cut-off), *is it
right* (variance, who is not being paid normally), *who has it now* (the gate).

**The inputs panel reads the adjustments module rather than restating it** — loan instalments from the loan
register, and reimbursements, overtime and settled rises from the pay-request store, counted against **this
run's batch**. That is the answer to "how is a run affected by the adjustments": it is the sum of them, and
the panel says so line by line. A run that cannot say what flows into it is a number nobody can defend.

**The cut-off is now a first-class object**, not a habit: a date, with who set it and when, how long is
left or how long since it closed, and a control to move it that **requires a reason** — a cut-off that
moves quietly is not a control. Underneath it, **what arrived after it**, each with where it is carried:
a late loss-of-pay correction becomes next month's **reverse LOP**, a late claim becomes an **arrear**, a
late joiner becomes **next month's run**. Nothing is silently dropped.

**Three different ways not to pay somebody, drawn as three.** Collapsing them into one word is how a school
overpays somebody who has already left, so the panel is three described choices, not a dropdown:

| | What it does to the money | What it does to the filing |
|---|---|---|
| **Skip this run** | out of this run only; what they earned is paid as arrears next run | nothing is computed |
| **Hold until released** | out of every run until somebody releases them | nothing is computed |
| **Withhold the net only** | only the net is held | **computed and remitted in full** — PF, ESI, PT and TDS reach the government on time |

The third is the notice-period case and the one with legal weight: choosing it raises a notice that
**withholding wages is constrained by the Payment of Wages Act**, that this is a cash hold with a reason
and a name against it, **not a penalty and not a disciplinary instrument**, and that a recovery should be
raised as a recovery. Its confirm button is filled in danger, not in the accent every other proceed uses.
Holds recompute the net payable live.

**Approve is absent, and the page says why it is absent** — the maker prepared this run, so the control
exists on the checker's desk and nowhere else. Hiding it here is the control working, not a missing button.

**Two states corrected while building.** The run's own timeline was incoherent — a cut-off in October on an
August run, which is a run computed before its own inputs closed; it now reads cut-off 5 Aug → computed
8 Aug → sent 10 Aug → today the 11th. And an unresolved input said *"the compute is blocked"* under a run
that was already computed: it blocks **compute** before the compute and **sending** after it, and the
send button is disabled with that reason.

### Amendment AU — Pay requests, the payroll end (2026-10-08)

*Rulings (designer): "the appraisal is done by the HR so remove any user before in the line of approvals,
and during the appraisal no amount is entered by HR, only percentage is entered — fix the appraisal rises
tab and related changes"; then "start with the same modules for the payroll officer user dashboard inside
the adjustments module".*

**Two corrections on the payroll side (2026-10-09).** *Rulings: "the section with yellow bg looks broken
from below — fix this in other tabs as well"; and "the appraisal rise from HR is completely missing from the
payroll officer dashboard — add the proper flow and functionality with UI".*

**The seam.** The incoming-queue notice was its own bordered box with its bottom border stripped and square
bottom corners, sitting on a `Register` — which renders its **own** Card, with a full border and its own
rounded top. Two boxes pretending to be one, and the join read as a break on both sides. The notice sits
**inside** the card now, as a self-contained rounded box under the title; one fix, all four queues.

**Rises are a fifth tab in Adjustments.** They had been left out on the reasoning that a rise is not an
adjustment to a run; the designer's ruling is that payroll must act on them here, so this is the working
surface. The settle panel is the real act: **gross** (opening on the arithmetic, editable — landing
elsewhere is the officer's prerogative), **basic as a % of gross**, **HRA as a % of basic**, and **other
allowances derived** so the three always sum to the gross. It states live what the officer actually landed
at against what HR agreed, and refuses when basic + HRA exceed the gross. The panel writes through to
`pay-handoff`'s PROPOSALS, which is the record Staff & salaries already reads — two surfaces, one state.

**A bug found doing it:** `riseRows()` builds fresh objects on every read, so `payrollApprove` writing to
the object `byId()` had just handed back would have vanished on the next render. Rise writes route to the
handoff store instead, and that is also why the other surface sees them without being told.

**The appraisal first.** The rises tab drew a *Raised* stop carrying Meera Iyer and a date, then a *You*
stop carrying Meera Iyer and the same date — one act, two stops, the first of which invented an approver
who does not exist. **Nobody raises a rise**: the appraisal is where it is agreed and HR records it there,
so the chain is three stops (**You · Payroll · Paid**) and every index below shifts by one. The record also
led with a rupee figure — *"which comes to ₹1,02,384"* — which reads as a salary HR set. **The percentage is
the whole of what an appraisal settles and the only thing entered**, so the record leads with **+8%**, the
register's first mono column is the percentage, and the derived figure left the register entirely for
*what the rise costs*, labelled as arithmetic.

**Then payroll's end, inside Adjustments (`pages/py-adjust.jsx`).** A request HR verified appears at the
**top of the tab that owns its subject**, not in a module of its own — a loan request and the loan it
becomes are one object at two ages, and nobody should have to guess which of two rail items holds the one
they mean. Adjustments is four tabs now: **Loans · Claims · Overtime · Arrears**, overtime being new because
overtime previously had no home on this desk at all — HR could verify hours and nothing read them.

**The split holds from the other side: HR verified the FACT, this desk sets the FIGURE.** Nothing here
recomputes what HR verified. The record says in a line what HR did and what is left:

| Kind | HR settled | Payroll sets |
|---|---|---|
| Reimbursement | the bill and the policy; the amount is the employee's and unchanged | the tax treatment and the run that pays it |
| Loan | the request and a recommended tenure | principal, tenure, rate — and the instalment follows |
| Overtime | the hours, against the roster | the price: hours × hourly × the statutory multiple |

**Overtime is priced from the person's own pay.** The rate is basic and dearness over 26 working days and
an 8-hour day, and the multiple is 2 — Code on Wages 2019 s.14, *not less than twice the normal rate*. A
first cut fell back to a constant when a row had no pay on it, which priced six different people
identically; every overtime row carries `basicDa` now, and a row without one **says it has no rate and
blocks the approval** rather than inventing one.

**One store, two desks.** `payrollApprove` and `payrollDecline` are the other end of HR's `verify` /
`sendBack` / `decline`, so approving on this desk moves the chain on HR's desk in the same session —
verified by switching role in-page and watching *With payroll* become *Approved*. Payroll's rail is the
same chain read from its own side: the stop called **You** over there is called **HR** here.

**Where rises are not.** A rise is not an adjustment to a run — it is a change to standing pay, and the
designer already routed it to **Proposed revisions** in Staff & salaries. Putting a second copy in
Adjustments would give one object two homes, which is the fault this module exists to remove; the payroll
record for a rise therefore says where its components are set rather than offering to set them here.

### Amendment AT — Pay requests: one chain, four subjects (HR side) (2026-10-08)

*Ruling (designer): reimbursements, loans and advances "should be visible and should be added by the HR and
then sent to payroll officer"; "create new fresh module for all these things which should have all payment
related stuff from employees to HR"; include the appraisal; add "overtime request which is automatically
tracked which is raised from the employees, which is sent to HR for verification and then sent to Payroll
officer"; "all these listed modules has HR as first approver then payroll officer for final, so design all
these modules in such a way that the status of the approval and full status tracking is all done in the HR
and the same happens in the payroll officer as well"; HR first, payroll after.*

**What was wrong.** Everything an employee asks for *on top of* their salary was scattered. A reimbursement
was a helpdesk ticket, a loan was a conversation, overtime was whatever the admin office kept, and a rise
was buried in the appraisal tab of one person's record. Four objects, four vocabularies, and no single
answer to the question HR is asked twenty times a month — *where has my claim got to?*

**New: HR-40 / HR-41, `pages/hr-pay.jsx`, rail item "Pay requests" (`hrPay`, perm `hr.payrequests.manage`).**

**ONE CHAIN, FOUR SUBJECTS.** Every request walks the same four stops — **RAISED · YOU · PAYROLL · PAID** —
and the same strip draws them whatever the request is about, so the status vocabulary is learnt once. Two
exits leave the chain, and both are drawn as *breaks* rather than as states that resemble progress:
**RETURNED** (back to the employee for something missing) and **DECLINED** (it stops, at the desk that
stopped it, with a reason and a name). A request that left the chain never gets a half-filled bar.

**The split is the one `pay-handoff.jsx` already set: HR verifies the FACT, payroll sets the FIGURE.**

| Tab | What HR does | What HR cannot do |
|---|---|---|
| Reimbursements | checks the bill and the policy | change the amount — it is the employee's statement; or decide the tax treatment |
| Loans & advances | records the request, recommends a tenure | set a principal, a rate, an instalment or a schedule |
| Overtime | verifies hours against what the department asked for | price them — no rupee figure appears on the screen at all |
| Appraisal rises | records the percentage agreed | turn it into components |

**Overtime is derived, never typed.** The hours come from punches against the roster, and the record opens
on **the days that produced the figure**, so it can always be read back to the person it is about. HR may
reduce the verified hours — a department asked for two of those evenings and not the other two — and a
reduction is blocked until a reason is given. The money is absent by design: the **Code on Wages 2019,
s.14** puts overtime at not less than **twice the normal rate of wages**, and the multiple and the hourly
rate are read from the pinned configuration when payroll prices it.

**Who is not eligible is stated, not hidden.** Teaching staff are not on hourly wages. A teacher's detected
hours still appear, declined with that reason written out — a row that silently never existed is how a
school ends up arguing about it in a corridor.

**A rise enters the chain already past HR's desk**, because recording the percentage *is* the approval. The
chain log says so in a line rather than drawing a second event with the same name and the same date on it.

**State: `v3/pay-requests.jsx` (`window.NaveyaPayRequests`), the fourth channel** of the conversation
`pay-handoff.jsx` opened. It is a separate file only for volume, and rises are **adapted** from that file's
PROPOSALS rather than copied — two copies of one state is the bug that file exists to prevent. HR's three
acts (`verify`, `sendBack`, `decline`) and `add` are the whole write surface; the payroll side will read
the same store when it is built.

**The record screens, redrawn (same day).** *Ruling: "I see a lot of wasted space, no proper UI and visual
balance of UX — add proper UX laws, use visuals more instead of text to emphasise the data."* The first
build stacked seven full-width cards down a single column, and a claim ran to 1,760px of page for about
fifteen facts. Two of those cards — the horizontal stage strip and the written-out chain log — **said the
same thing twice**.

- **Two columns.** What the request *is* on the left, where it has *got to* and what you can do on the
  right. That is the division an operator already holds in their head, and it halved the page: a claim is
  now ~720px. Below 1,100px it stacks to one column.
- **The strip and the log became one object**: a vertical status rail where each stop carries its own date,
  its actor and what they did there. Reading down it *is* reading the history.
- **Every kind leads with a figure and the bar that gives it a denominator** (shape first, number second;
  Von Restorff — exactly one thing on the screen is drawn that big). A claim's amount sits against its
  **yearly cap**, with the overflow in red past the marker. Overtime's hours sit against the **month's
  roster**. A rise shows **current gross + the increment** as two segments, so an 8% rise *looks* like 8%.
- **Text that was carrying data became the data.** The attached bill is a **document tile** — or an empty
  dashed one when there is none — instead of a sentence. The overtime days are **bars you can scan down**,
  so the long evening is visible without reading six numbers. "A loan is already running for this person"
  was the most load-bearing fact on a loan and was drawn smaller than the campus; it is now a **stacked
  exposure bar** — what they already owe, plus what they are asking for, against a year of their own pay.
  A rise gained **what it costs**: the percentage, the monthly increment and the annual cost as three
  measured figures.
- **Hick's law on the actions**: one primary button, two secondaries beside it, and the explanation above
  them rather than a paragraph per action.
- **The separators came out of the fact row.** They were drawn on every third cell while the grid auto-fits
  five, so the rules landed wherever the viewport decided. Whitespace groups them now and needs no geometry
  to be right.
- A flag in the margin is **suppressed when a panel on the left already carries it**, so "no bill attached"
  and "a loan is already running" are each said once.

**Row menus got their two decisions coloured (designer: "add red CTA state inside the actions menu of the
tables for decline and green for accept").** `ActionMenu` already had `tone: "danger"`, which coloured the
icon and the label; it now also **tints the row** when that item is the active one, and it gained a `"go"`
tone in the matching green. Applied to the four menus in the product that pair an accepting act with a
refusing one: pay requests (verify / decline), group admin's approvals, and HR attendance's regularisations
and overtime. Everything else in those menus stays neutral — colour three items and none of them reads as
emphasis. The tints are the same `presentTint` / `dangerTint` pairings the status marks use, so the green
that means *approved* on a chip is the green that means *approve* in a menu.

**Hierarchy on the record, corrected (designer: "I see outline CTA — use proper primary and a mix of
outline CTA to differentiate visual hierarchy; the section width is not full, and the status above these
sections is just hanging on the right").** Three faults, all real:

- **`Button`'s default `kind` is `secondary`, which is outlined.** Every confirming button in this module
  had been written without a `kind`, so *Verify and send* carried exactly the weight of *Cancel* beside it.
  Each surface now has **one filled button and nothing else filled**: the record's accepting act, and each
  side screen's confirming act. `Button` also gained a **`danger` kind** — a panel whose whole purpose is to
  decline still needs one primary, and making it the accent would say *proceed* in the colour the product
  uses for every other proceed, so the decline panel's confirm is filled in danger (6.5:1 / 6.3:1).
- **The filled button follows what is actually possible.** A claim with no bill cannot be verified, so
  *Send it back* becomes the primary and the dead *Verify and send* drops to the row beneath it. A disabled
  button in the primary slot outranks the thing the reader can really do.
- **The record ran to a capped 1,240px** while the registers behind it used the full measure, so the right
  edge did not line up between the list and the record. The cap is gone; both reach the same `contentPadX`.
- **The status chip sat alone at the far right of the record header**, with nothing in that half of the row
  to sit with. It is inline with the identity line now — `CL-0233 · Reimbursements · Indiranagar` and then
  the state — which is where proximity puts it.

**A bug the build turned up.** `num()` rounds to a whole number, which is right for people and days and
wrong for overtime: six days of 3.5 h printed as 4 h each, so the evidence added to 24 under a total of 22.
Hours get their own formatter that keeps the half.

### Amendment AS — Exits: an exit starts three clocks, not one (2026-10-08)

*Ruling (designer): "the exits module right now is too much and the info is too much to visualise and
understand — research how a proper exit of a staff is handled in terms of pay by the payroll officer and
design the full module keeping everything simple, the actions should work, and everything should be
visible using proper visual hierarchy."*

**What the research changed.** The useful finding was not the list of settlement components — PY-16/PY-17
already carried those — but that **an exit is not one deadline**. Three statutory clocks start on the last
working day and run at different speeds: **wages within two working days** (Code on Wages 2019, s.17(2)),
**EPF in fifteen to twenty working days** (EPFO withdrawal cycle), **gratuity within thirty days** (Payment
of Gratuity Act 1972). The old screen compressed all three into one "days since exit" count, which cannot
answer the only question an officer has: *which clock breaks first?* Somebody eleven days out is
comfortable on gratuity and nine days late on wages, and the screen said neither. **"Deadline" now replaces
"days"** in the register, and the settlement leads with the three clocks as measured bars with their
statute named under each.

**The second finding was arithmetic.** Leave encashment and gratuity are priced on **working** days — the
month less its weekly offs, which the Act and settled practice put at **26**. Notice recovery is priced on
a **calendar** month, **30**. `pages/py-ops.jsx` used 30 for all three, which understated encashment by
about 15%. Corrected to `NOTICE_DIVISOR = 30`, `ENCASH_DIVISOR = 26`, `GRATUITY_DIVISOR = 26`, each named
rather than a bare literal, and every line on the settlement prints the rate it used.

**Why it was hard to read.** The register carried **eight columns and three of them stacked**: the person
cell held name, staff number and pay group; the state cell held a status mark, an access-revocation warning
and a paid-with note; two dropdowns sat in the chips slot. Everything was present and nothing was
prominent. Below it sat a "what is holding these up" card that repeated the same people, and below that the
settlement panel — so the register, its exceptions and one person's arithmetic were all on screen at once.

**Now** (`pages/py-exits.jsx`, replacing the `PYParts.Exits` composition in `py-shelf.jsx`):

- **A band** — the five states as a pickable stacked bar over four measured figures: open settlements,
  owed to leavers, past a deadline, and the longest-overdue clock named with its person. The last one
  relabels itself from *soonest deadline* once that deadline has passed, because "soonest" is the wrong
  noun for something 58 days gone.
- **A slim filter strip** — show (open / late / everyone) and campus, each a label beside its control on
  one line. Campus stopped being a column the moment it became a filter.
- **A register of six columns, one fact each**: who is leaving · last working day · **next deadline**
  (which clock, how late or how long left) · settlement · state · actions. Notice shortfall left the
  register entirely — it is a settlement *line*, not a tracking fact, and it reads properly beside the
  figure it reduces.
- **The settlement on a screen of its own**, opened over the list and titled with the person's name:
  four figures → the three clocks → their service → **what we owe them** and **what we recover** as two
  tables, each line carrying the formula that produced it → the net as one large figure → the actions.
  Reading down the page is reading the settlement in the order an officer would explain it aloud.
- **The actions work and state their consequence**: waive the notice recovery (a side screen that requires
  a reason and recomputes the net live), add an ex-gratia amount, send for approval — with the
  single-person-completion wording when the tenant is configured that way (M12 amendment C). A blocked
  settlement, one with the checker, one already paid, and an account still active after the last working
  day each raise their own note instead of being crowded into a cell.

**The review pass over the whole payroll wave.** Sweeping the recently-built screens for the same class of
fault turned up six `EmptyState` calls written with `title=` and `icon=`, neither of which that component
accepts — it takes `head`, `body`, `action`, `art`. Every one of those empty states had been rendering with
**no heading at all** (py-adjust ×1, py-people ×4, py-rules ×1). And pay rules' **"New rate rule"** button
carried an empty handler, so it looked live and did nothing; it now opens a side screen that states what a
rate and a cap are, computes how many units the cap allows as you type, and actually appends the rule to
the rate card.

**Bugs this surfaced and fixed.** The live settlement had **income tax as a positive line**, putting it on
the "what we owe them" side, while the worked example two rows above had it at −19,540 — now negative in
both. `G3.fig("xxl")` is **not in the figure scale** (`xl lg md sm xs micro`), so the net rendered at
13.5px; the fourth instance of the unknown-key family. Two meters each measured against themselves both
drew full; they share a denominator now.

### Amendment AR — Adjustments: a register opens a record (2026-10-07)

*Rulings (designer): "whatever action is being shown at the bottom of the table of loans and advancements
i need that inside their own respective screens"; the module should be "simple in terms of UI and the
overall usability UX and related actions, with the internal screens, modals and others to support this
screen"; "the reimbursement claims from the employees should be visible to the payroll officer"; and the
band treatment "for adjustments module all tabs aswell".*

**The fault: actions stacked under the table.** Opening a loan's schedule unrolled it below the register;
foreclosing added a panel below that; skipping an instalment added a third. By the third action the row
being acted on had scrolled out of sight, and nothing on screen said which loan the panel belonged to.

**Now every tab is a band, a register, and a record that opens over the list.** A loan's schedule, its
foreclosure and its skip all live on **that loan's screen**, titled with the person's name and leading
with four measured figures: principal, outstanding, this month's instalment, instalments paid. The
schedule is **derived** from tenure, instalments paid and the EMI — so it cannot disagree with the figures
above it — and the instalment the open run will take is marked on the row rather than described in prose.

Foreclosure and skip are **side screens**, each stating its consequence: the foreclosure panel shows the
outstanding balance, computes the **waiver live** as the officer reduces the settlement, and says a waiver
moves money and is recorded against their name. The skip panel refuses to let *defer* and *waive* look
alike — each is a labelled choice with the difference spelled out, because one means they still owe the
money and the other means they never will.

**The claims are the employees'.** They were drawn as rows of a payout batch, which is what payroll does
with them rather than what they are. The register now leads with **who claimed and what for**, with the
tax treatment on the row and the batch as a *state*; the record shows the claimed amount split into its
taxable and exempt parts, states that **payroll cannot change what was claimed** (the amount and category
belong to the employee and their approver — payroll decides *when* it is paid, not what it was), and
offers the one thing payroll does decide: whether it is in this month's batch.

**Arrears** keeps its month-by-month split, now opened from a register, with the config each month was
originally pinned to in its own column and a stale-input warning raised as a note rather than buried.

**All three tabs wear the same band:** a stacked bar you can pick from — loans by state, claims by
category, arrears by state — over four measured figures with their own meters. Moving between the tabs no
longer means learning a new layout.

**Band geometry, corrected.** The bands carried 20px of side padding *and* gave every cell but the first
another 20px, so the first meter sat 21px from the card's left edge while the last sat 41px from the
right — which is why the left one read as touching the outline. Padding now lives on the cells only, so
every bar is inset equally. Pay rules also gained the long stacked bar it was missing: **where the staff
sit**, by pay group, with the legend filtering the register.

### Amendment AQ — The grey-chip bug, filters on PY-08, and two dead buttons (2026-10-07)

**The missing green had a root cause, and it is the third of its kind.** The designer asked twice for
"proper green colour coding" on the Yes / Applies chips in a pay group. `StatusMark` resolves its colour
as `c[role + "Tint"]` / `c[role + "Text"]`, so the role must be a **palette** role. The valid set is
`present · absent · danger · late · leave · holiday · missing · off · penalty · ltSick · ltCasual · ltEL ·
ltComp`. I had written **`role="ok"` nine times**; it resolved to nothing and fell back to grey. Fixed to
`present`.

That is now three silent-failure bugs in the same family, and they share one cause worth naming:

> **An unknown key in a style object or a token lookup fails silently.** `fill` where `StackBar` reads
> `color` drew a transparent bar. `c.card` where the token is `c.surface` painted no background, twice
> reported as "the section has no bg colour". `role="ok"` where the palette has `present` drew a grey
> chip. None of the three threw, logged, or looked broken in code review — they only looked wrong on
> screen. **Grep a new key against `tokens.jsx` or the component's own source before using it.**

Note `role="info"` in `hr-leaveatt.jsx` has the same shape (there is no `infoTint`); left alone as it is
outside this work and may be an intentional neutral.

**PY-08 gained filters.** It showed one month to everybody with no way to narrow it, while an officer
reconciling 412 people asks three questions: which month, which pay group, and show me only the rows with
something wrong. There is now a month picker (August open; **July and June closed**, and selecting one
says so and states that a closed month is corrected through arrears, never here), a pay-group filter, a
"show" filter (does not reconcile · unpaid days · joiners and leavers · sent to HR) and a search.

**Two dead "Assign a salary" buttons.** The designer asked for the CTA to be checked across the product.
Three places offer it — the handoff card, the register's row menu, and the **pay record's unassigned
state** — and the third was wired to an empty function. So was **Revise this salary** on the same record.
Both now open the breakdown editor, and revising **pre-fills the figures the person is already on**,
because an empty form for somebody who has a salary makes the officer re-key what the product holds.

**Pay rules, after review.** "New pay group" left the row menu — a page action that had wandered into a
row has nothing to do with the row it sits on — and **Clone** took its place, which does: it copies the
logic and never the people, because headcount belongs to HR's contracts. The band's figures gained bars,
the structure's **gross / wages / excluded lead the card at figure size with meters**, and **earlier
versions expand** to their components and what that version produced at the same sample basic.

**Outstanding:** the Adjustments module — Loans, Claims and Arrears — is unchanged. It needs the same
band treatment, a simpler loans surface, and the employee claims surfaced as claims rather than as batch
rows.

### Amendment AP — Pay rules becomes one surface (2026-10-07)

*Ruling (designer): "in this module of salary structure and pay group, i think it should be one tab with
full breakdown of salary, also an option to edit the salary breakdown and also other edit options and also
create new pay group and new breakdown and new rule and everything, keep ui and ux simple."*

**PY-02 and PY-03 were two tabs, and the split was an artefact of the inventory.** A pay group with no
structure prices nobody; a structure with no group applies to nobody. Neither can usefully be read alone,
so the officer read one tab, held four numbers in their head, and went to the other.

**Now one surface, no tablist.** The spine is the **pay group**, because that is what a person belongs to
and what HR names on the contract. Selecting a group opens whatever prices it, over the list:

- a **CTC group** opens its **salary structure**: every component, how it is derived, whether it sits in
  the statutory wage base, whether it is taxable, and a **worked example at a real grade basic from the
  dataset** — so the figures on screen are the figures the run produces. The Labour Code verdict sits
  under it with the wage base and the excluded total named.
- an **honorarium group** opens its **rate card** instead — unit, rate, monthly cap, and the unit count
  at which the cap bites. There is no breakdown because rate × units is the whole logic (PY-04).

That is why honorarium is not a third tab. It is not a different module; it is a different answer to the
same question, *"what prices this type of staff?"*

**Editing drafts a version, never edits in place** (`§4.3`). The component editor adds, removes and
changes components with the wage-base and taxable flags on each; saving supersedes the current version
from a date the officer picks, and the footer states the cost: *N staff on this group move to it, and
nobody is paid differently for a month already run.* The 50% verdict is live and **refuses the save**
(`M10 §Acceptance`).

**A note on which lever moves the ceiling.** Shuffling value between two components that are both excluded
from wages — raising HRA and letting the balance absorb it — correctly does **not** move the verdict,
because the excluded total is unchanged. The levers that do are the **wage-base flag** on a component and
the grade basic. The editor exposes both, and that is the honest model: the 50% rule is about the
wages/non-wages split, not about how the non-wages half is divided up.

**Creating.** New pay group takes a name and a pay logic — and says the logic cannot be changed later,
because it decides whether the engine runs a structure or a rate card — with an optional structure to
attach, and states that the group reaches HR's contracts and offers once saved.

**Also in this pass.** PY-06's register was rebuilt from cards back into the kit's `Register` with the
inventory's own columns and a **total cost impact** totals row, after the card version read as thin; and
a palette bug was fixed across every surface this work added — `c.card` is not a token (the white surface
is `c.surface`), so eight backgrounds had been painting nothing at all and showing the cream page through.

### Amendment AO — A percentage is HR's, the figures are payroll's (2026-10-07)

*Rulings (designer): HR must see "full breakdown of her salary just like the payroll officer ... and the HR
cant edit the section only can send the change request if any"; "when a appraisal is recorded, the pay
cannot be setup by the HR and updated, the Increase percentage is added and the same should be sent to the
payroll officer in the proposed revisions ... then the officer can manually change the full HRA and
breakdown of detail to detail"; and make PY-06 "simple, visually readable and not contain a lot of
information".*

**The second half of the HR/payroll split.** Amendment AN took the *starting* salary off HR. This takes
the *rise*. An appraisal now records a **percentage** — a judgement about a person, which is the room's
work — and payroll turns it into components, which is the only place a rupee figure is decided. The
appraisal dialog's rupee input is gone; what the percentage comes to is shown beside it, labelled as
arithmetic rather than as a decision.

**HR-03 shows the whole breakdown and edits none of it.** The pay card now carries the same three columns
PY-05 does — earnings, deductions, employer cost — priced by the **same functions payroll prices with**,
so the two desks cannot see different figures. The Edit control is **gone, not disabled**: a disabled
button says "you may do this, later", which is false here and always will be. In its place is the thing HR
*can* do — **Request a change**, a topic plus a sentence, recorded against that person, answered by
payroll. Nothing changes until payroll acts, and the panel says so.

**PY-06 rebuilt simple.** It was a nine-column register with a bulk checkbox, bulk accept, four modes and a
side panel — a workbench for a queue that is, in a school, two or three people a year. It is now **one
card per person** carrying the only four facts that matter (who, what the appraisal agreed, what that
comes to, who agreed it) and **one primary action**. Settled and declined proposals drop to a quiet line
underneath, because they are history and not work.

**The breakdown is editable line by line, and the balance absorbs.** Both "Assign a salary" (PY-05) and
"Set the new figures" (PY-06) now share one editor: the structure derives every component, the officer may
override any of them, the last component takes the difference so the lines always sum to the gross, and
the Labour Code verdict re-decides live. An overridden line states what it was derived as, so nothing is
quietly different from what the structure would have produced.

**The arithmetic this surfaced is the argument for the whole split.** Ananya's +8% on 94,800 comes to
1,02,384 — and at her existing basic that puts excluded allowances at **53.70%**, over the Labour Code
ceiling, so the save is **refused**. Raising the basic to 43,000 brings it to 49.60% and it goes through.
A naive percentage breaks the law; only the desk that holds the components can see that. HR could not have.

**Assign a salary gained the staff type.** The officer picks the type of staff, which picks the pay group,
which decides the structures that may price them — all three defined in Pay rules (PY-02/03). Changing the
type reloads the structures rather than leaving a stale one selected.

**Outstanding:** Pay rules (PY-02 + PY-03) is still two tabs; merging pay groups and salary structures into
one surface with full breakdown and create/edit is the next piece.

### Amendment AN — HR hands over, payroll prices: one state, two desks (2026-10-07)

*Rulings (designer): "the HR cant add the pay, the employee once created will be sent to payroll officer
and then the pay details will be added by the payroll officer and then the same will be shown to the HR
… these 2 users should communicate in only this module"; "when the payroll officer opens the employee
record, he should only see the info related to pays and calendar etc and not full employee record"; and
on PY-08, "the bottom calendar section to be on the right of the table and opens when the row of the
table is clicked … add an option to send to HR for verification".*

**The split, and why it is the spec's own.** HR owns WHO and WHICH RUN; payroll owns HOW MUCH. HR-20
already requires `pay_group_id` with no default on the offer, and PY-05's precondition is "employee has a
contract with a pay group" — so the group was always HR's and the figure was always payroll's. The
add-employee form had a "Contracted monthly gross" input anyway, which put the most sensitive number in
the product in the hands of the one role that may not hold it, and let two desks hold two different
opinions of a salary with nothing to reconcile them. That input is **gone**, replaced by an absent-control
block saying who sets the figure instead.

**The handoff is a STATE, not a message** (`design/v3/pay-handoff.jsx`, `window.NaveyaPayHandoff`). There
is no inbox and no chat. A person HR has created and payroll has not yet priced simply *is* "awaiting
pay", and both screens read that one object:

- **Payroll's Staff & salaries** leads with *"One person is waiting for a salary"* — named, with who sent
  them and when, the joining date, and every reminder HR has sent. The register's state column says
  **"Waiting on you"** rather than a bare "Not set up".
- **HR's record** replaces the figure with *"Pay — with the payroll officer"*: who is holding it, since
  when, the group HR chose, and HR's one legitimate control, **Remind the payroll officer**. A reminder is
  **recorded on the record, not emailed**, so neither desk can later claim it was never asked.
- **Assigning closes it.** The payroll officer's panel writes to the same object, the handoff card
  disappears from their register, and the figure appears on HR's record.

**Assign a salary is the whole process, not a figure box.** Who this is and who sent them (read-only —
none of it is payroll's); the structure; the two numbers it needs; a **live breakdown priced by the same
`priceComponents` the pay record and the structure editor use**, so a preview can never promise a figure
the run would not produce; the Labour Code verdict, which **refuses the save** when excluded allowances
exceed half the total (`M10 §Acceptance`); the effective date, defaulting to the joining date for a new
joiner per PY-05; and a footer stating that saving *proposes* it, the checker releases it, and HR then
sees it.

**PY-08 corrections.** The month was a full-width card *under* the register, so reading one person's days
meant scrolling past everyone else's row and losing the row you were reading. It now sits **beside** the
register, sticky, and **opens on a row click**. Row actions and the detail both gained **Send to HR for
verification** — attendance is HR's to correct (`HR-30`), so this asks rather than edits, and states the
consequence: *the run stays blocked on this person until HR answers, because paid days are what pay is
prorated from*.

**And payroll stopped opening HR-03.** `openRecord()` on PY-08 navigated to HR's full staff record —
documents, contract, onboarding, appraisal history, none of it payroll's business. It now opens **the pay
record** (PY-05 detail), which carries exactly the pay and the month this desk is entitled to.

### Amendment AM — The Payroll Officer module, restructured; PY-05 gets a record (2026-10-07)

*Ruling (designer): "redesign the full module with internal side modules … make every module simple as per
what can be useful for a payroll officer … somewhere a staff record with their individual salary breakdown
… it's not compulsory to keep the same info and modules … I want only what is necessary."*

**Research first.** Mature HRMS split this role by duty, not by screen: a *processor* who maintains pay
information, an *analyst* who runs the cycle and explains it, and an *approver* who releases it — with
segregation of duties between them as the defining control. Naveya already has the third as a separate
person (the Accountant is the checker, AC-02). What it had not done was separate the first two in the
navigation, which is why the rail read as a filing cabinet rather than a job.

**The faults.**

1. **A module named after what it is not.** "Operations" held eight of the eighteen screens — PY-09, 10,
   11, 12, 13, 14, 15, 16, 17, 18 — and two of them sat two tablists deep. Reaching the arrears workbench
   took Operations → "Claims & arrears" → Arrears: three choices, the middle one a word invented to hold
   the third.
2. **"Salary" mixed rules with people.** PY-02/03/04 (what the engine may do) and PY-05/06 (what a named
   person earns) shared one module. Those are different jobs on different clocks: rules change rarely and
   move everybody; a salary changes one person, often.
3. **No pay record.** PY-05 is the one screen entitled to show a person's components, statutory base and
   employer cost — HR-03's own "must NOT contain" defers to it — and it existed as a 380px side panel
   with room for a gross figure and a button. The screen whose whole job is provenance for money had no
   room to show any.

**Now: eight single-purpose modules, in the order the month is worked.** This month (PY-01) · Paid days
(PY-08) · Payroll run (PY-07) · **Staff & salaries** (PY-05 + PY-06) · **Adjustments** (PY-13/14/15)
· **Exits & settlements** (PY-16/17) · **Pay rules** (PY-02/03/04) · **Registers & reports** (PY-18).
No tablist is nested. Each module's name is the thing inside it.

**The pay record (PY-05 detail)** opens *over* the register, as HR-03 opens over HR-02, and carries: five
measured figures (gross · net · deductions · cost to the school · paid days); **the breakdown as three
signed columns that each sum** — earnings with how each line was derived (grade scale, 20% of BASIC,
the balance of gross), deductions with their basis (PF as 12% of basic+DA, not of gross), and what the
school pays on top; the **50% rule live on that person**; the effective-dated salary ledger with maker and
checker on every row; this month's paid days; and the statutory identity numbers, masked by default with
every reveal recorded. Component editing is **absent with its reason** and routes to Pay rules, because
changing a component moves everybody on the group.

**Nothing was re-keyed.** The register and record price salaries from `pages/py-salary.jsx`'s own
structures, published as `PYSalData`; the person comes from `window.NaveyaPerson`. Self-checks assert the
record against the run register: Ananya Rao is 94,800.00 gross and 78,432.00 net on both, PF is 12% of
wages and not of gross, and her excluded allowances are **exactly 50.00%** of gross — on the Labour Code
ceiling, not under it, which a screen printing only the gross would have hidden.

**Conflict found and NOT silently resolved — LWF.** `pages/py-ops.jsx` carries Labour Welfare Fund in each
pay group's employer block (₹20/head), so its register's net excludes it. `pages/py-salary.jsx`'s
simulator carries `lwf: 20` among the employee deductions, which would make the same person's net
78,412.00 rather than 78,432.00. **Both cannot be true and the difference is net pay.** The record follows
py-ops (employer side) because that is what the run register and `RUN_NET` already compute on and what the
golden-file test diffs. The real statutory position — most states levy both an employee and an employer
contribution — is a `StatutoryConfig` question for riddler. Flagged, not averaged. A ₹20 literal in two
page files is also a `guard-statutory-hardcode` smell in waiting.

**Outstanding (wave 2):** This month, Paid days and Payroll run are still three rail items over one
journey; PY-01/07/08 plus variance, register and pay-and-publish should fuse into a single staged run.

### Amendment C — F&F maker-checker is **configurable per tenant**
- **Ruling:** a full & final settlement **may legitimately be completed by a single person** where the
  tenant configures it that way — small schools often have one finance person, and an F&F is a single,
  individually reviewed settlement rather than a bulk release. This is a **narrow exception** and does
  **not** relax the mandatory distinct-checker requirement on payroll run approval, bank file/disbursement,
  statutory filings, reimbursement payout batches, arrears posting or bonus runs.
- **Applied:** `docs/functionality-blueprint.md` PART B §1; `docs/development-specification.md` M12
  (business rules, permissions, acceptance) and §8's maker–checker row.
- **In this document:** PY-17 has **two configured modes** and must show which is in force; AC-02 lists F&F
  **only when the tenant requires a checker for it**; the tenant setting itself lives on GA-05/GA-04's
  capability model (see the note added to PY-17). Every settlement stays fully audited either way, and a
  single-person completion is **recorded as single-person**.

---

# 13 · Sequencing recommendation

**Where we actually are:** EMP-01 (Home) and SH-01 (Sign in) are built on v3. EMP-02 (My attendance) is in
progress. PY-07 and GA-01 exist as pre-v3 prototypes and must be rebuilt on v3. Everything else is unbuilt.
BATMAN's locked build order is **HR Operator next, then Payroll Operator** — this sequence honours that.

| Wave | Build | Why this order |
|---|---|---|
| **W0 — finish the employee spine** (in flight) | EMP-02, EMP-03, EMP-05, EMP-06, EMP-07, EMP-10, EMP-11, EMP-18, SH-03, SH-04 | The role is nearly complete and it is the only surface with a validated visual language. Finishing it gives the whole system its component vocabulary — register, ring, donut, timeline, seal, empty states — which every later role reuses. Do **not** start a second role with the first one 60% done. |
| **W1 — HR foundation** | HR-01, HR-02, HR-03, HR-04, HR-05, HR-07, HR-09, HR-10 | Nothing exists without people. The staff register + record shell + document governance loop is the product's spine, and M4's request→respond→verify cycle is the first true **cross-role workflow** (HR-09 ↔ EMP-11), which will expose every state-modelling weakness cheaply. |
| **W2 — HR setup & compliance** | HR-08, HR-11, HR-12, HR-26, HR-27, HR-29, GA-02, GA-03, GA-06, PR-07 | The configuration layer that makes everything else computable: staff taxonomy, leave policy with the **vacation-staff flag**, shifts, org/legal entities, academic year with vacation and exam terms, holiday calendars. This is where Naveya's differentiation is actually configured — building payroll before it would mean building on sand. |
| **W3 — approvals & the manager surface** | DH-01, DH-02, DH-03, DH-04, DH-05, PR-01, PR-02, PR-03, HR-28, HR-30 | Closes the leave and attendance loops end to end (apply → approve → attendance → paid-days). Two roles at once because they are the *same* screens at two scopes — building them together is what prevents the duplicate-destination mistake. |
| **W4 — payroll core** | PY-01, PY-02, PY-03, PY-04, PY-05, PY-08, PY-07, PY-09, PY-10, **AC-02**, PY-11, PY-12 | The differentiating engine. **AC-02 (the checker gate) ships inside this wave, not after it** — a run console built without its gate teaches the wrong interaction model and is expensive to retrofit. GA-07 (statutory config) must land here or immediately before, because every figure on these screens reads from it. |
| **W5 — statutory** | GA-07 (if not in W4), AC-01, AC-03, AC-04, AC-05, AC-07, AC-08, EMP-08, EMP-09 | Filings and the employee-facing tax surface. Sequenced after payroll because contributions are payroll outputs, and after GA-07 because everything here is version-pinned. |
| **W6 — money extensions & exit** | PY-13, PY-14, PY-15, PY-16, PY-17, AC-06, EMP-12, EMP-13, EMP-19, DH-09 | Loans, reimbursements, arrears, bonus and F&F all ride on a working run and a working checker gate. Arrears in particular cannot be designed before pinning is visible on screen. |
| **W7 — recruitment & onboarding** | HR-13…HR-25, PUB-01…PUB-04 | ATS is MVP but it *feeds* the staff record rather than depending on it; it can follow the operational core. Ship it as one contiguous wave — a half-built pipeline is worse than none. |
| **W8 — PAMS** | HR-35, HR-36, EMP-16, EMP-17, DH-06, DH-07, DH-08, PR-05, PY-06 | Explicitly sequenced after People (M3), the academic calendar (M7) and payroll (M10) by the spec's own build plan, because the increment recommendation feeds a payroll revision. |
| **W9 — platform & helpdesk** | HR-31, HR-32, HR-33, HR-34, EMP-14, EMP-15, GA-04, GA-05, GA-08, GA-10, GA-11, GA-12, GA-01, GA-09, PR-06, HR-37, PY-18 | Helpdesk, identity administration, audit, integrations, DPDP and the report runner. GA-04/GA-05 are late only because seed roles cover the build period; **GA-12 must not slip past launch** — it is a legal obligation, not a feature. |

**Three sequencing rules that matter more than the order itself**

1. **Build the checker gate with the first maker screen** (AC-02 in W4). Maker-checker is not a feature you
   add; it is a shape the screens must have from the first payroll pixel.
2. **Build the configuration screen before the screen that consumes it** — GA-07 before payroll, HR-26
   before leave approvals, HR-29 before attendance reconciliation. Every skipped setup screen becomes a
   hardcoded constant, and every hardcoded constant becomes a guard-hook violation later.
3. **Build cross-role workflows as pairs** (HR-09 ↔ EMP-11, DH-02 ↔ EMP-06, PY-07 ↔ AC-02). Building one
   half and stubbing the other is how the states get modelled wrong.

**One-screen prototypes worth doing before their wave:** AC-02 (the whole product's trust model in one
screen) and PY-15 (arrears — if the month-split with per-month pinned config can be made legible, the rest
of payroll is easy by comparison).
