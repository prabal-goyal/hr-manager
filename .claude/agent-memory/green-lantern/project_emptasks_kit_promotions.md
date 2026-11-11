---
name: emptasks-kit-promotions
description: three local primitives emp-tasks.jsx needed that kit.jsx still lacks — TextArea (now 2x independently used), FileField (new, needed by every task form), ConfirmRow (new, the inline pre-irreversible-action confirm)
metadata:
  type: project
---

Building `design/v3/pages/emp-tasks.jsx` (EMP-03/04/06/11/12/13) surfaced three kit gaps, kept local per this dispatch's file-boundary rule (`kit.jsx` out of scope):

- **`TextArea`** — `leave.jsx` already flagged this once as a promotion candidate; this file is the second independent use (reason fields on Regularise, Apply-for-leave, Respond-to-HR). Two independent uses was leave.jsx's own stated bar for promoting it — now met.
- **`FileField`** (new) — a visually-hidden native `<input type="file">` behind a real `Button`, tracking the chosen name via an uncontrolled `onPick(name)` callback (file inputs cannot be controlled). Every one of this file's five tabs needed a file control (regularisation evidence, HR-response upload, reimbursement receipts) and `kit.jsx` has no file primitive at all yet — the strongest promotion candidate found so far.
- **`ConfirmRow`** (new) — an inline "are you sure?" row (prompt + confirm/cancel buttons) that a withdraw/cancel action expands into instead of firing immediately, per "nothing irreversible in one click". Used for regularisation-withdraw and reimbursement-claim-withdraw; generalises past `leave.jsx`'s and `attendance.jsx`'s one-off inline patterns for the same need.

**How to apply:** the next agent touching `kit.jsx` for any reason should promote `FileField` first (highest reuse pressure — no page with a document/receipt/evidence upload has a shared way to do it yet) and `TextArea` second (now proven 2x). See [[project_v3_emptasks_screens]].
