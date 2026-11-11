/* @jsxRuntime classic */
/* ============================================================
   Naveya — SH-01 Sign in + SH-02 one-time code · window.Pages3.Login
   (also published as window.Screens3.Login, which is the name the
   three v3 harnesses destructure).

   DESIGNER RULING (2026-10-27): rebuild the sign-in in the shape of
   the Mural reference — ONE centred card on the page ground, the
   logo over it, flat illustrations along the bottom edge — and carry
   the real flow: email + password + captcha, then a one-time code by
   email or SMS. The old split (cocoa brand panel left, form right)
   is gone with this file.

   WHAT THE SHAPE IS FOR. A split screen spends half the window on a
   tagline nobody reads twice; a teacher signing in at 7:40am on a
   staffroom desktop needs one object on the screen and it is the
   form. So the page is: mark, card, nothing else — and the room she
   is standing in is drawn along the bottom edge, where it is scenery
   and never a thing to read.

   THE ILLUSTRATION IS A PICTURE, NOT A CHART. Flat shapes, one
   cocoa outline weight, no gradient, no shading. It takes its fills
   from the categorical ramp and the two picture tokens (illoWall,
   illoSun) because those are the only colours in the system that are
   allowed to mean nothing. It is aria-hidden and pointer-events
   none; it sits INSET from the window's edges rather than flush to
   them, and it leaves the page entirely under 1200px, where there is
   no room beside the card.

   TWO ROUTES, FIVE STEPS. `route` says which journey this is and
   `step` says where in it, because signing in and recovering a
   password share their middle: proving it is you is the identical
   act either way.

     SIGNING IN      in -> where -> code -> the role's own home
     FORGOTTEN IT    forgot -> where -> code -> reset -> that home

   WHAT EACH STEP GUARDS.
     in     — email, password, characters from the image. Every
              guard names what is wrong, in the field it is wrong in.
              The captcha regenerates on a miss, which is the whole
              point of it, and it is drawn at the height of the box
              beside it so the two read as ONE control.
     forgot — the email alone: no password, and no picture to read,
              because somebody who cannot get in is not asked to
              prove they are not a robot before they may ask for
              help. It never says whether the address is on the roll;
              nobody should learn who works here by typing.
     where  — email or SMS, each one showing its MASKED destination.
              §8 classes a phone number as PII: HR holds it, this
              screen never prints it.
     code   — auto-advancing boxes, paste-aware, a 30s resend
              cooldown (SH-02's default) whose label carries the
              remaining seconds, and a wrong-code state that counts
              the tries left out loud.
     reset  — the new password twice, an eight-character floor, and
              a line saying what the office is told (that it changed,
              never what it is).

   NEVER DISABLE THE BUTTON THAT OWES AN EXPLANATION — every forward
   button here stays live and answers. The one exception is Resend
   during its cooldown, and that button's label IS its reason.

   No hex. No hardcoded copy. Every string goes through t().
   ============================================================ */
(function () {
  const G3 = window.G3;
  const UI = window.UI3;
  const { useState, useRef, useEffect } = React;
  const {
    useTheme, ThemeToggle, useLang, addStrings,
    BoatMark, Button, LinkButton, Field, Input, Icon, profileFor,
  } = UI;

  addStrings({
    en: {
      /* ---- the page ---- */
      "lg.brand": "Naveya",
      "lg.trust": "Sunrise Public School Trust",
      "lg.terms": "Terms of service",
      "lg.privacy": "Privacy policy",

      /* ---- step 1 · credentials ---- */
      "lg.head": "Sign in",
      "lg.sub": "Use the work email your HR office set up for you.",
      "lg.email": "Work email",
      "lg.pw": "Password",
      "lg.show": "Show",
      "lg.hide": "Hide",
      "lg.cap": "Type the characters in the image",
      "lg.capHint": "Six characters, any case.",
      "lg.capNew": "Try a different image",
      "lg.capAria": "A picture of six characters you are asked to retype. Try a different image if you cannot read this one.",
      "lg.capNewSaid": "A new set of characters.",
      "lg.go": "Continue",
      "lg.forgot": "Forgot your password?",
      "lg.errEmail": "Enter your work email.",
      "lg.errEmailForm": "That does not look like an email address.",
      "lg.errPw": "Enter your password.",
      "lg.errCapEmpty": "Type the characters from the image.",
      "lg.errCap": "Those characters do not match the image. Here is a new one.",

      /* ---- the forgotten password ---- */
      "lg.fgHead": "Forgotten your password?",
      "lg.fgSub": "Say which account it is. We send a one-time code, and you set a new password after it.",
      "lg.fgSend": "Send me a code",
      "lg.fgBack": "Back to sign in",
      "lg.fgQuiet": "If that address is on the roll, the code goes out. We do not say either way — nobody should learn who works here by typing.",
      "lg.rsHead": "Set a new password",
      "lg.rsSub": "Last step. Pick one you can remember without writing it down.",
      "lg.rsNew": "New password",
      "lg.rsAgain": "Type it again",
      "lg.rsHint": "Eight characters at the very least.",
      "lg.rsGo": "Save it and sign in",
      "lg.rsNote": "The office is told that it changed, never what it is. You are signed out of every other device.",
      "lg.errRs": "Choose a new password.",
      "lg.errRsShort": "Eight characters at the very least.",
      "lg.errRsAgain": "The two do not match.",

      /* ---- step 2 · where the code goes ---- */
      "lg.chHead": "One more check",
      "lg.chSub": "Pay and staff records sit behind a second step. Where should the code go?",
      "lg.chHeadFg": "Where should the code go?",
      "lg.chSubFg": "Six digits, good for ten minutes. Pick whichever you can read right now.",
      "lg.chStep": "Step 2 of 2",
      "lg.chStepFg": "Step 2 of 3",
      "lg.chMail": "Email",
      "lg.chMailNote": "Arrives in a few seconds.",
      "lg.chSms": "Text message",
      "lg.chSmsNote": "Goes to the number HR holds for you.",
      "lg.chMasked": "Naveya shows neither in full. Only your HR office holds them.",
      "lg.chSend": "Send the code",
      "lg.chBack": "Sign in as somebody else",

      /* ---- step 3 · the code ---- */
      "lg.otHead": "Enter the code",
      "lg.otSubMail": "Six digits, sent to {dest} just now.",
      "lg.otSubSms": "Six digits, texted to {dest} just now.",
      "lg.otExpiry": "The code is good for 10 minutes.",
      "lg.otLabel": "One-time code",
      "lg.otBox": "Digit {n} of 6",
      "lg.otGo": "Sign in",
      "lg.otGoFg": "Continue",
      "lg.otStepFg": "Step 3 of 3",
      "lg.otResend": "Send another code",
      "lg.otResendIn": "Send another code in {n}s",
      "lg.otResendNote": "A new code cancels the one before it.",
      "lg.otSent": "A new code is on its way.",
      "lg.otChange": "Send it somewhere else",
      "lg.errOt": "Enter all six digits.",
      "lg.errOtWrong": "That code is not right. {n} tries left.",
      "lg.errOtOut": "No tries left. Ask your HR office to unlock the account.",
    },
  });

  /* ============================================================
     THE STAFFROOM — two flat clusters, drawn once, cropped by the
     bottom of the window exactly as the reference crops its own.
     Outline is cocoa in light and a warm grey in dark: a near-black
     outline on an espresso ground is a hole, not a line.
     ============================================================ */
  const W = 2.6;

  function Room({ side, c, o }) {
    const stroke = { stroke: o, strokeWidth: W, strokeLinecap: "round", strokeLinejoin: "round" };
    if (side === "left") {
      return (
        <svg viewBox="0 0 520 268" fill="none" aria-hidden="true" focusable="false"
             style={{ width: "100%", height: "auto", display: "block" }}>
          {/* ---- a plant in a clay pot ---- */}
          <path d="M71 192V128" {...stroke} />
          <path d="M71 152c-30 0-44-18-44-44 28-4 46 14 44 44z" fill={c.chartGreen} {...stroke} />
          <path d="M71 142c30-2 44-22 42-46-28 2-44 22-42 46z" fill={c.chartGreen} {...stroke} />
          <path d="M71 120c-16-13-16-37 0-50 16 13 16 37 0 50z" fill={c.chartGreen} {...stroke} />
          <path d="M34 206h74l-9 62H43z" fill={c.accent} {...stroke} />
          <rect x="26" y="190" width="90" height="18" rx="7" fill={c.accent} {...stroke} />

          {/* ---- the staffroom chair ---- */}
          <rect x="150" y="126" width="42" height="78" rx="19" fill={c.chartPurple} {...stroke} />
          <rect x="150" y="186" width="112" height="28" rx="14" fill={c.chartPurple} {...stroke} />
          <circle cx="214" cy="200" r="2.6" fill={o} />
          <circle cx="228" cy="200" r="2.6" fill={o} />
          <circle cx="242" cy="200" r="2.6" fill={o} />
          <path d="M206 214v24" strokeWidth="5" stroke={o} strokeLinecap="round" />
          <path d="M206 238l-28 14M206 238l28 14" {...stroke} />
          <circle cx="174" cy="256" r="9" fill={c.chartPurple} {...stroke} />
          <circle cx="238" cy="256" r="9" fill={c.chartPurple} {...stroke} />

          {/* ---- the desk: books, a mug, wire legs ---- */}
          <rect x="324" y="128" width="60" height="14" rx="3.5" fill={c.chartTeal} {...stroke} />
          <rect x="318" y="142" width="72" height="14" rx="3.5" fill={c.chartBlue} {...stroke} />
          <rect x="312" y="156" width="84" height="14" rx="3.5" fill={c.chartAmber} {...stroke} />
          <path d="M436 138h44v22a10 10 0 0 1-10 10h-24a10 10 0 0 1-10-10z" fill={c.accent} {...stroke} />
          <path d="M480 144h7a9 9 0 0 1 0 18h-7" {...stroke} />
          <rect x="292" y="170" width="214" height="14" rx="7" fill={c.illoWall} {...stroke} />
          <path d="M308 184l-14 84M490 184l14 84M304 224h190" {...stroke} />
        </svg>
      );
    }
    return (
      <svg viewBox="0 0 560 268" fill="none" aria-hidden="true" focusable="false"
           style={{ width: "100%", height: "auto", display: "block" }}>
        {/* ---- the noticeboard, two sheets pinned to it ---- */}
        <rect x="150" y="16" width="166" height="98" rx="8" fill={c.illoWall} {...stroke} />
        <g transform="rotate(-4 196 58)">
          <rect x="170" y="36" width="52" height="44" rx="3" fill={c.surface} {...stroke} />
          <path d="M180 50h32M180 60h32M180 70h20" {...stroke} strokeWidth="2" />
        </g>
        <g transform="rotate(5 268 70)">
          <rect x="240" y="46" width="56" height="48" rx="3" fill={c.surface} {...stroke} />
          <path d="M250 60h36M250 70h36M250 80h22" {...stroke} strokeWidth="2" />
        </g>
        <circle cx="196" cy="38" r="4.5" fill={c.accent} {...stroke} strokeWidth="2" />
        <circle cx="268" cy="48" r="4.5" fill={c.chartAmber} {...stroke} strokeWidth="2" />

        {/* ---- the clock on the wall ---- */}
        <circle cx="500" cy="62" r="34" fill={c.surface} {...stroke} />
        <path d="M500 32v6M530 62h-6M500 92v-6M470 62h6" {...stroke} strokeWidth="2.2" />
        <path d="M500 62V42M500 62l15 10" {...stroke} />
        <circle cx="500" cy="62" r="3.4" fill={o} />

        {/* ---- a tall plant ---- */}
        <path d="M79 214V136" {...stroke} />
        <path d="M79 180c-24 0-38-16-40-40 26-4 42 12 40 40z" fill={c.chartGreen} {...stroke} />
        <path d="M79 168c24-2 36-20 34-44-26 2-38 20-34 44z" fill={c.chartGreen} {...stroke} />
        <path d="M79 142c-15-12-15-34 0-46 15 12 15 34 0 46z" fill={c.chartGreen} {...stroke} />
        <path d="M50 212h58l-7 56H57z" fill={c.illoSun} {...stroke} />

        {/* ---- the staffroom sofa ---- */}
        <rect x="140" y="148" width="256" height="64" rx="26" fill={c.chartBlue} {...stroke} />
        <rect x="116" y="174" width="36" height="68" rx="17" fill={c.chartBlue} {...stroke} />
        <rect x="384" y="174" width="36" height="68" rx="17" fill={c.chartBlue} {...stroke} />
        <rect x="130" y="194" width="276" height="48" rx="18" fill={c.chartBlue} {...stroke} />
        <path d="M268 194v-42M268 198v44" {...stroke} />
        <path d="M152 242v22M384 242v22" strokeWidth="5" stroke={o} strokeLinecap="round" />

        {/* ---- a globe on a stool ---- */}
        <circle cx="488" cy="132" r="28" fill={c.illoSun} {...stroke} />
        <path d="M488 104c-14 10-14 46 0 56M488 104c14 10 14 46 0 56M461 126h54" {...stroke} strokeWidth="2.2" />
        <path d="M488 160v6" {...stroke} />
        <rect x="440" y="166" width="96" height="16" rx="8" fill={c.chartRed} {...stroke} />
        <path d="M452 182l-10 86M524 182l10 86M450 226h76" {...stroke} />
      </svg>
    );
  }

  /* ============================================================
     THE CAPTCHA. Deterministic on first paint — a canvas that
     reshuffles itself every render cannot be screenshotted — and a
     fresh draw on every miss or on "Try a different image".
     I, l, 1, O and 0 are not in the set: a challenge nobody can read
     is not a security control, it is a locked door.
     ============================================================ */
  const CAP_SET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const CAP_FIRST = "H7KQM4";

  function newCode() {
    let s = "";
    for (let i = 0; i < 6; i++) s += CAP_SET.charAt(Math.floor(Math.random() * CAP_SET.length));
    return s;
  }

  /* the jitter is a function of the character, so one code always
     draws the same way and a screenshot of it is stable */
  function jitter(ch, i) {
    const n = ch.charCodeAt(0) + i * 7;
    return { rot: ((n % 23) - 11) * 1.1, dy: ((n % 9) - 4) * 1.6 };
  }

  /* THE SAME HEIGHT AS THE BOX BESIDE IT. At 208x66 the picture was
     taller than the field it belongs to and the pair read as a panel
     with an input stuck under it; at the field's own 50px the two are
     one control. */
  function CaptchaImage({ code }) {
    const { c } = useTheme();
    const { t } = useLang();
    const chars = String(code).split("");
    const H = G3.layout.fieldH;
    return (
      <svg viewBox="0 0 176 50" width="176" height={H} role="img" aria-label={t("lg.capAria")}
           style={{ display: "block", borderRadius: G3.r.md, flexShrink: 0,
                    userSelect: "none", WebkitUserSelect: "none", pointerEvents: "none" }}>
        <rect x="0.8" y="0.8" width="174.4" height="48.4" rx={G3.r.md} fill={c.sunken} stroke={c.borderStrong} strokeWidth="1.6" />
        <path d="M7 35c22-17 44 11 66-5s44 8 64-8" stroke={c.inkFaint} strokeWidth="1.5" fill="none" opacity="0.5" />
        <path d="M7 17c25 12 47-9 72 3s41-2 57 9" stroke={c.inkFaint} strokeWidth="1.5" fill="none" opacity="0.35" />
        {chars.map(function (ch, i) {
          const j = jitter(ch, i);
          const x = 23 + i * 26;
          const y = 34 + j.dy * 0.7;
          return (
            <text key={i} x={x} y={y} transform={"rotate(" + j.rot + " " + x + " " + y + ")"}
                  textAnchor="middle" fill={i % 2 ? c.action : c.ink}
                  style={{ fontFamily: G3.font.display, fontSize: 23, fontWeight: 700, letterSpacing: "0.02em" }}>
              {ch}
            </text>
          );
        })}
      </svg>
    );
  }

  /* ============================================================
     THE SIX BOXES. One input per digit, because a code arrives as
     six separate things and is read back out loud as six separate
     things. Paste fills all of them; backspace walks back.
     ============================================================ */
  function CodeBoxes({ value, onChange, invalid, firstRef }) {
    const { c } = useTheme();
    const { t } = useLang();
    const refs = useRef([]);
    const digits = String(value || "").padEnd(6, " ").slice(0, 6).split("");

    function put(i, ch) {
      const next = digits.slice();
      next[i] = ch || " ";
      onChange(next.join("").replace(/\s+$/, ""));
    }
    function focus(i) {
      const el = refs.current[i];
      if (el) { el.focus(); el.select(); }
    }
    function type(i, raw) {
      const only = String(raw).replace(/\D/g, "");
      if (!only) { put(i, ""); return; }
      if (only.length > 1) { paste(i, only); return; }
      put(i, only);
      if (i < 5) focus(i + 1);
    }
    function paste(from, text) {
      const only = String(text).replace(/\D/g, "").slice(0, 6 - from);
      const next = digits.slice();
      for (let k = 0; k < only.length; k++) next[from + k] = only.charAt(k);
      onChange(next.join("").replace(/\s+$/, ""));
      focus(Math.min(5, from + only.length));
    }
    function key(i, ev) {
      if (ev.key === "Backspace" && (digits[i] === " " || digits[i] === "") && i > 0) { ev.preventDefault(); put(i - 1, ""); focus(i - 1); }
      else if (ev.key === "ArrowLeft" && i > 0) { ev.preventDefault(); focus(i - 1); }
      else if (ev.key === "ArrowRight" && i < 5) { ev.preventDefault(); focus(i + 1); }
    }

    return (
      <div role="group" aria-label={t("lg.otLabel")} style={{ display: "flex", gap: 9 }}>
        {digits.map(function (d, i) {
          return (
            <input
              key={i} ref={function (el) { refs.current[i] = el; if (i === 0 && firstRef) firstRef.current = el; }}
              value={d === " " ? "" : d}
              onChange={function (e) { type(i, e.target.value); }}
              onKeyDown={function (e) { key(i, e); }}
              onPaste={function (e) { e.preventDefault(); paste(i, (e.clipboardData || window.clipboardData).getData("text")); }}
              onFocus={function (e) { e.target.select(); }}
              inputMode="numeric" autoComplete={i === 0 ? "one-time-code" : "off"}
              aria-label={t("lg.otBox", { n: i + 1 })} aria-invalid={invalid ? "true" : undefined}
              maxLength={1} spellCheck="false"
              style={G3.fig(22, {
                width: 52, height: 60, textAlign: "center", fontWeight: 600,
                border: "1px solid " + (invalid ? c.danger : d !== " " ? c.borderStrong : c.border),
                borderRadius: G3.r.md, background: c.surface, color: c.ink, outlineOffset: 1, padding: 0,
              })}
            />
          );
        })}
      </div>
    );
  }

  /* one of the two destinations, as a radio you can click anywhere on */
  function Channel({ id, picked, onPick, icon, label, dest, note }) {
    const { c } = useTheme();
    const { ty } = useLang();
    const on = picked === id;
    return (
      <button
        type="button" role="radio" aria-checked={on ? "true" : "false"} onClick={function () { onPick(id); }}
        style={{
          display: "flex", alignItems: "flex-start", gap: 13, width: "100%", textAlign: "left",
          padding: "15px 16px", marginBottom: 12, cursor: "pointer",
          border: "1px solid " + (on ? c.accent : c.border),
          background: on ? c.accentSoft : c.surface,
          borderRadius: G3.r.lg, boxShadow: on ? "inset 0 0 0 1px " + c.accent : "none",
        }}
      >
        <span style={{ color: on ? c.action : c.inkMuted, display: "flex", marginTop: 1 }}>
          <Icon name={icon} size={19} />
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={ty("h3", { display: "block", color: c.ink })}>{label}</span>
          <span style={G3.fig("sm", { display: "block", color: c.ink, margin: "3px 0 2px", letterSpacing: "0.01em" })}>{dest}</span>
          <span style={ty("caption", { display: "block", color: c.inkMuted, fontWeight: 500 })}>{note}</span>
        </span>
        <span aria-hidden="true" style={{
          width: 19, height: 19, borderRadius: G3.r.pill, flexShrink: 0, marginTop: 3,
          border: "2px solid " + (on ? c.accent : c.borderStrong),
          background: on ? c.accent : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center", color: c.onAccent,
        }}>
          {on ? <Icon name="check" size={12} strokeWidth={2.6} /> : null}
        </span>
      </button>
    );
  }

  /* a line of quiet text under a card step */
  function Note({ children }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return <p style={ty("caption", { color: c.inkMuted, fontWeight: 500, margin: "12px 0 0", textAlign: "center" })}>{children}</p>;
  }

  /* ============================================================
     THE SCREEN
     ============================================================ */
  function Login({ role, onSignIn }) {
    const { c, mode, shadow } = useTheme();
    const { t, ty } = useLang();
    const who = profileFor(role || "employee");

    const parts = String(who.name).toLowerCase().split(" ");
    const mail = parts[0] + "." + (parts[1] || "staff") + "@sunrisepublic.edu.in";
    const maskedMail = parts[0].charAt(0) + "••••@sunrisepublic.edu.in";
    const maskedSms = "•••••• 4821";

    /* in | forgot | where | code | reset.
       THE FORGOTTEN PASSWORD IS NOT A SECOND SCREEN, IT IS A SECOND
       ROUTE THROUGH THE SAME ONE. Proving it is you is the identical
       act either way -- pick a channel, read six digits back -- so the
       flow forks at the start, shares the middle, and rejoins at the
       end with one extra step: setting the new password. `route` is
       what the shared steps read to know which journey they are in
       (`mode` is taken: it is the theme's). */
    const [route, setRoute] = useState("in");
    const [step, setStep] = useState("in");
    const [email, setEmail] = useState(mail);
    const [pw, setPw] = useState("");
    const [pwOpen, setPwOpen] = useState(false);
    const [cap, setCap] = useState("");
    const [code, setCode] = useState(CAP_FIRST);
    const [said, setSaid] = useState("");
    const [channel, setChannel] = useState("mail");
    const [otp, setOtp] = useState("");
    const [tries, setTries] = useState(3);
    const [left, setLeft] = useState(0);
    const [sent, setSent] = useState(false);
    const [np, setNp] = useState("");
    const [np2, setNp2] = useState("");
    const [npOpen, setNpOpen] = useState(false);
    const [err, setErr] = useState({});
    const otpFirst = useRef(null);
    const forgot = route === "forgot";

    /* the resend cooldown. One interval, cleared on unmount — a timer
       that outlives its screen is how a canvas starts ticking twice. */
    useEffect(function () {
      if (left <= 0) return undefined;
      const id = setInterval(function () { setLeft(function (n) { return n - 1; }); }, 1000);
      return function () { clearInterval(id); };
    }, [left > 0]);

    useEffect(function () {
      if (step === "code" && otpFirst.current) otpFirst.current.focus();
    }, [step]);

    /* CHANGING THE PERSON ON THE CANVAS CHANGES WHO IS SIGNING IN.
       The email seeded itself once at mount and then sat there saying
       the last person's name while the switcher said somebody else's.
       Picking a person here means "sign in as them", so the whole form
       goes back to its first step as them. */
    useEffect(function () {
      setEmail(mail);
      setPw(""); setCap(""); setOtp(""); setSaid(""); setErr({});
      setNp(""); setNp2(""); setRoute("in");
      setStep("in");
    }, [mail]);

    function reshuffle(spoken) {
      setCode(newCode());
      setCap("");
      setSaid(spoken || "");
    }

    function submitCreds(ev) {
      ev.preventDefault();
      const next = {};
      if (!email.trim()) next.email = t("lg.errEmail");
      else if (email.indexOf("@") < 1 || email.indexOf(".", email.indexOf("@")) < 0) next.email = t("lg.errEmailForm");
      if (!pw) next.pw = t("lg.errPw");
      if (!cap.trim()) next.cap = t("lg.errCapEmpty");
      else if (cap.trim().toUpperCase() !== code) next.cap = t("lg.errCap");
      setErr(next);
      if (next.cap === t("lg.errCap")) reshuffle("");
      if (!Object.keys(next).length) { setStep("where"); setSaid(""); }
    }

    /* the fork: same email box, no password, no picture to read --
       somebody who cannot get in is not asked to prove they are not a
       robot before they are allowed to ask for help */
    function openForgot() {
      setRoute("forgot");
      setStep("forgot");
      setPw(""); setCap(""); setOtp(""); setErr({}); setSaid("");
    }

    function askForCode(ev) {
      ev.preventDefault();
      const next = {};
      if (!email.trim()) next.email = t("lg.errEmail");
      else if (email.indexOf("@") < 1 || email.indexOf(".", email.indexOf("@")) < 0) next.email = t("lg.errEmailForm");
      setErr(next);
      if (!Object.keys(next).length) setStep("where");
    }

    function saveNew(ev) {
      ev.preventDefault();
      const next = {};
      if (!np) next.np = t("lg.errRs");
      else if (np.length < 8) next.np = t("lg.errRsShort");
      else if (np !== np2) next.np2 = t("lg.errRsAgain");
      setErr(next);
      if (!Object.keys(next).length && onSignIn) onSignIn();
    }

    function sendCode() {
      setOtp("");
      setErr({});
      setTries(3);
      setLeft(30);
      setSent(false);
      setStep("code");
    }

    function resend() {
      if (left > 0) return;
      setOtp("");
      setErr({});
      setLeft(30);
      setSent(true);
    }

    /* the canvas accepts any six digits but 000000, so the wrong-code
       state is reachable by somebody driving the screen rather than
       hidden behind a password only this file knows */
    function verify(ev) {
      ev.preventDefault();
      if (otp.replace(/\D/g, "").length < 6) { setErr({ otp: t("lg.errOt") }); return; }
      if (otp === "000000") {
        const n = tries - 1;
        setTries(n);
        setOtp("");
        setErr({ otp: n > 0 ? t("lg.errOtWrong", { n: n }) : t("lg.errOtOut") });
        if (otpFirst.current) otpFirst.current.focus();
        return;
      }
      /* the code is all that stood between a forgetful person and a
         new password, so the two routes part again here */
      if (forgot) { setStep("reset"); setErr({}); return; }
      if (onSignIn) onSignIn();
    }

    const o = mode === "dark" ? c.inkMuted : c.rail;
    const dest = channel === "mail" ? maskedMail : maskedSms;

    const headStyle = ty("display", { margin: 0, color: c.ink, textAlign: "center" });
    const subStyle = ty("body", { color: c.inkMuted, margin: "9px 0 26px", textAlign: "center" });
    const stepStyle = ty("caption", { color: c.action, fontWeight: 700, margin: 0, textAlign: "center",
                                      letterSpacing: "0.04em", textTransform: "uppercase" });

    return (
      <div className="nv3 nv3-login" style={{
        position: "relative", minHeight: "100vh", overflow: "hidden",
        background: c.page, color: c.ink, fontFamily: G3.font.ui,
        display: "flex", flexDirection: "column",
      }}>
        <style>{
          ".nv3-login .nv3-login-card{padding:36px 38px 32px}" +
          "@media (max-width:539px){.nv3-login .nv3-login-card{padding:30px 22px 26px}}" +
          ".nv3-login .nv3-room{position:absolute;bottom:-16px;z-index:0;pointer-events:none}" +
          /* INSET, NOT FLUSH. Pinned to left:0/right:0 the furniture was
             pushed into the corners of the window and read as two
             bookends; a margin of its own brings it in towards the
             card without ever reaching it. */
          ".nv3-login .nv3-room-l{left:clamp(12px,4.5vw,110px);width:clamp(250px,26vw,430px)}" +
          ".nv3-login .nv3-room-r{right:clamp(12px,4.5vw,110px);width:clamp(260px,27vw,450px)}" +
          /* the room leaves rather than crowds. WIDTH is the whole of the
             test: a short window simply grows and the scenery lands at
             the foot of it, but a narrow one has no room beside the card
             and the furniture would be standing on the footer links. */
          "@media (max-width:1199px){.nv3-login .nv3-room{display:none}}"
        }</style>

        <div className="nv3-room nv3-room-l"><Room side="left" c={c} o={o} /></div>
        <div className="nv3-room nv3-room-r"><Room side="right" c={c} o={o} /></div>

        <div style={{ position: "absolute", top: 20, right: 22, zIndex: 3 }}><ThemeToggle /></div>

        <main style={{
          position: "relative", zIndex: 2, flex: 1,
          display: "flex", flexDirection: "column", alignItems: "center",
          padding: "46px 20px 54px",
        }}>
          {/* ---------- the mark ---------- */}
          <div style={{ display: "flex", alignItems: "center", gap: 11, color: c.accent }}>
            <BoatMark size={42} />
            <span style={ty("h1", { color: c.ink, fontSize: 31, letterSpacing: "-0.015em" })}>{t("lg.brand")}</span>
          </div>
          <p style={ty("caption", { color: c.inkMuted, fontWeight: 500, margin: "9px 0 0" })}>{t("lg.trust")}</p>

          {/* ---------- the card ---------- */}
          <div style={{
            width: "min(100%, 468px)", marginTop: 30,
            background: c.surface, border: "1px solid " + c.border,
            borderRadius: G3.r.card, boxShadow: shadow(2),
          }} className="nv3-login-card">
            {step === "in" ? (
              <form onSubmit={submitCreds} noValidate>
                <h1 style={headStyle}>{t("lg.head")}</h1>
                <p style={subStyle}>{t("lg.sub")}</p>

                <Field id="lg-email" label={t("lg.email")} error={err.email}>
                  <Input id="lg-email" type="email" value={email} onChange={setEmail}
                         autoComplete="username" invalid={!!err.email} inputMode="email" />
                </Field>

                <Field id="lg-pw" label={t("lg.pw")} error={err.pw}>
                  <Input
                    id="lg-pw" type={pwOpen ? "text" : "password"} value={pw} onChange={setPw}
                    autoComplete="current-password" invalid={!!err.pw}
                    trailing={
                      <button type="button" onClick={function () { setPwOpen(!pwOpen); }}
                        style={ty("small", {
                          border: "none", background: "transparent", color: c.action, fontWeight: 600,
                          padding: "8px 11px", borderRadius: G3.r.sm, cursor: "pointer",
                        })}>
                        {pwOpen ? t("lg.hide") : t("lg.show")}
                      </button>
                    }
                  />
                </Field>

                <Field id="lg-cap" label={t("lg.cap")} error={err.cap}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <CaptchaImage code={code} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Input id="lg-cap" value={cap} onChange={setCap} autoComplete="off"
                             invalid={!!err.cap} ariaLabel={t("lg.cap")} />
                    </div>
                  </div>
                  {/* the way out and the rule share a line: two stacked
                      captions under a 50px control is more chrome than
                      the control */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 14, marginTop: 9, flexWrap: "wrap" }}>
                    <LinkButton onClick={function () { reshuffle(t("lg.capNewSaid")); }}>{t("lg.capNew")}</LinkButton>
                    <span style={ty("caption", { color: c.inkMuted, fontWeight: 500 })}>{t("lg.capHint")}</span>
                  </div>
                </Field>
                <div aria-live="polite" style={ty("caption", { color: c.inkMuted, fontWeight: 500, margin: "-8px 0 14px", minHeight: 15 })}>{said}</div>

                <Button kind="primary" size="lg" full type="submit">{t("lg.go")}</Button>

                <div style={{ textAlign: "center", marginTop: 20 }}>
                  <LinkButton onClick={openForgot}>{t("lg.forgot")}</LinkButton>
                </div>
              </form>
            ) : step === "forgot" ? (
              <form onSubmit={askForCode} noValidate>
                <h1 style={headStyle}>{t("lg.fgHead")}</h1>
                <p style={subStyle}>{t("lg.fgSub")}</p>

                <Field id="lg-email" label={t("lg.email")} error={err.email}>
                  <Input id="lg-email" type="email" value={email} onChange={setEmail}
                         autoComplete="username" invalid={!!err.email} inputMode="email" />
                </Field>

                <p style={ty("caption", { color: c.inkMuted, fontWeight: 500, margin: "-6px 0 20px" })}>{t("lg.fgQuiet")}</p>
                <Button kind="primary" size="lg" full type="submit">{t("lg.fgSend")}</Button>

                <div style={{ textAlign: "center", marginTop: 20 }}>
                  <LinkButton onClick={function () { setRoute("in"); setStep("in"); setErr({}); reshuffle(""); }}>{t("lg.fgBack")}</LinkButton>
                </div>
              </form>
            ) : step === "reset" ? (
              <form onSubmit={saveNew} noValidate>
                <p style={stepStyle}>{t("lg.otStepFg")}</p>
                <h1 style={Object.assign({}, headStyle, { marginTop: 8 })}>{t("lg.rsHead")}</h1>
                <p style={subStyle}>{t("lg.rsSub")}</p>

                <Field id="lg-np" label={t("lg.rsNew")} error={err.np} hint={t("lg.rsHint")}>
                  <Input
                    id="lg-np" type={npOpen ? "text" : "password"} value={np} onChange={setNp}
                    autoComplete="new-password" invalid={!!err.np}
                    trailing={
                      <button type="button" onClick={function () { setNpOpen(!npOpen); }}
                        style={ty("small", {
                          border: "none", background: "transparent", color: c.action, fontWeight: 600,
                          padding: "8px 11px", borderRadius: G3.r.sm, cursor: "pointer",
                        })}>
                        {npOpen ? t("lg.hide") : t("lg.show")}
                      </button>
                    }
                  />
                </Field>

                <Field id="lg-np2" label={t("lg.rsAgain")} error={err.np2}>
                  <Input id="lg-np2" type={npOpen ? "text" : "password"} value={np2} onChange={setNp2}
                         autoComplete="new-password" invalid={!!err.np2} />
                </Field>

                <Button kind="primary" size="lg" full type="submit">{t("lg.rsGo")}</Button>
                <Note>{t("lg.rsNote")}</Note>
              </form>
            ) : step === "where" ? (
              <div>
                <p style={stepStyle}>{t(forgot ? "lg.chStepFg" : "lg.chStep")}</p>
                <h1 style={Object.assign({}, headStyle, { marginTop: 8 })}>{t(forgot ? "lg.chHeadFg" : "lg.chHead")}</h1>
                <p style={subStyle}>{t(forgot ? "lg.chSubFg" : "lg.chSub")}</p>

                <div role="radiogroup" aria-label={t("lg.chSub")}>
                  <Channel id="mail" picked={channel} onPick={setChannel} icon="mail"
                           label={t("lg.chMail")} dest={maskedMail} note={t("lg.chMailNote")} />
                  <Channel id="sms" picked={channel} onPick={setChannel} icon="phone"
                           label={t("lg.chSms")} dest={maskedSms} note={t("lg.chSmsNote")} />
                </div>

                <p style={ty("caption", { color: c.inkMuted, fontWeight: 500, margin: "4px 0 22px" })}>{t("lg.chMasked")}</p>
                <Button kind="primary" size="lg" full onClick={sendCode}>{t("lg.chSend")}</Button>
                <div style={{ textAlign: "center", marginTop: 20 }}>
                  <LinkButton onClick={function () { setStep(forgot ? "forgot" : "in"); setPw(""); reshuffle(""); setErr({}); }}>{t(forgot ? "lg.fgBack" : "lg.chBack")}</LinkButton>
                </div>
              </div>
            ) : (
              <form onSubmit={verify} noValidate>
                <p style={stepStyle}>{t(forgot ? "lg.chStepFg" : "lg.chStep")}</p>
                <h1 style={Object.assign({}, headStyle, { marginTop: 8 })}>{t("lg.otHead")}</h1>
                <p style={subStyle}>{t(channel === "mail" ? "lg.otSubMail" : "lg.otSubSms", { dest: dest })}</p>

                <div style={{ display: "flex", justifyContent: "center" }}>
                  <CodeBoxes value={otp} onChange={setOtp} invalid={!!err.otp} firstRef={otpFirst} />
                </div>
                {err.otp
                  ? <div role="alert" style={ty("caption", { color: c.dangerText, margin: "12px 0 0", textAlign: "center" })}>{err.otp}</div>
                  : <Note>{sent ? t("lg.otSent") : t("lg.otExpiry")}</Note>}

                <div style={{ marginTop: 24 }}>
                  <Button kind="primary" size="lg" full type="submit">{t(forgot ? "lg.otGoFg" : "lg.otGo")}</Button>
                </div>

                <div style={{ display: "flex", justifyContent: "center", marginTop: 20 }}>
                  {left > 0
                    ? <Button size="sm" disabled iconLeft="clock">{t("lg.otResendIn", { n: left })}</Button>
                    : <Button size="sm" onClick={resend} iconLeft="mail">{t("lg.otResend")}</Button>}
                </div>
                <Note>{t("lg.otResendNote")}</Note>

                <div style={{ textAlign: "center", marginTop: 16 }}>
                  <LinkButton onClick={function () { setStep("where"); setErr({}); setOtp(""); }}>{t("lg.otChange")}</LinkButton>
                </div>
              </form>
            )}
          </div>

          {/* ---------- under the card ---------- */}
          <div style={{ display: "flex", gap: 26, marginTop: 22 }}>
            <LinkButton color={c.inkMuted}>{t("lg.terms")}</LinkButton>
            <LinkButton color={c.inkMuted}>{t("lg.privacy")}</LinkButton>
          </div>
        </main>
      </div>
    );
  }

  window.Pages3 = window.Pages3 || {};
  window.Pages3.Login = Login;
  /* the three harnesses destructure Screens3 — keep the old address
     working rather than editing a frozen exploration's bootstrap */
  window.Screens3 = Object.assign(window.Screens3 || {}, { Login: Login });
})();
