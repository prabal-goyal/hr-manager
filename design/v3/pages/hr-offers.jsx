/* @jsxRuntime classic */
/* ============================================================
   Naveya — HR Operator · Offers · window.NaveyaOffers.Panel
   Drawn as the third tab of Hiring (HR-08); it has no rail slot.

   Rebuilt 2026-10-06 on the designer's ruling. What it used to be:
   four tabs — Candidates, Interviews (with scorecards and a panel
   roster), Offers, and Conversion — modelling an applicant-tracking
   system that schedules interviews, collects 1–4 ratings from a
   panel, and converts an accepted offer into an employee.

   Three of the four tabs described work that happens somewhere else:
   interviews are arranged by phone and held in a room (the hiring
   module records that they happened), and converting somebody into an
   employee is the staff register's job. What is left, and what this
   module is now for, is one question: WHO HAS AN OFFER, AND WHERE
   DOES IT STAND.

   One surface, so no tab bar: a tablist with a single tab is not a
   tabbed interface.

   The ruling that shapes everything here: **an offer goes out by
   email, and Naveya cannot read anybody's mailbox.** So a reply is
   not something the system receives — it is something HR ATTACHES.
   The status of an offer changes only when the forwarded reply and a
   screenshot of it are put on the record, and the dialog says so.
   That is the whole reason "Record their reply" asks for two files
   and refuses to confirm without them: the attachment IS the
   evidence, and a status with no evidence behind it is a rumour.

   The record screen carries the person's WHOLE journey — added to the
   system, resume checked, interviewed, selected, offer sent, reply
   recorded, joining — because the question somebody actually asks is
   "where did this one get to and how long did it take", and that
   answer spans two modules.

   Composed only from window.G3 / window.UI3.
   ============================================================ */
(function () {
  const G3 = window.G3;
  const UI = window.UI3;
  const { useState, useRef, useEffect, useMemo } = React;
  const {
    useTheme, ThemeToggle, useLang, addStrings,
    Rail, Motif, Card, Register, Button, LinkButton, Chip,
    StatusMark, Icon, ActionMenu, EmptyState, Field, Input, Select,
    Meter, Figure, StackBar, MetricCell, MetricStrip, Avatar, SideScreen, BackBar, FileField, inr, num,
    CampusSwitch, campusLabel, inCampus, CAMPUS_ALL,
  } = UI;

  addStrings({
    en: {
      "hro3.top.scope": "Who has an offer, and where it stands",
      "hro3.title": "Offers",
      "hro3.back": "Back to offers",
      "hro3.whatHappens": "What this does",
      "hro3.cta.cancel": "Cancel",
      "hro3.col.act": "Actions",
      "hro3.menuAria": "Actions on {name}",
      "hro3.menu.open": "Open the record",
      "hro3.find": "Find",
      "hro3.allStatus": "Any state",
      "hro3.findPh": "A name or a post",
      "hro3.empty.head": "No offers at this campus",
      "hro3.empty.body": "An offer starts from somebody selected in Hiring. Until one is drafted, there is nothing to stand here.",

      "hro3.mon.01": "Jan", "hro3.mon.02": "Feb", "hro3.mon.03": "Mar", "hro3.mon.04": "Apr",
      "hro3.mon.05": "May", "hro3.mon.06": "Jun", "hro3.mon.07": "Jul", "hro3.mon.08": "Aug",
      "hro3.mon.09": "Sep", "hro3.mon.10": "Oct", "hro3.mon.11": "Nov", "hro3.mon.12": "Dec",
      "hro3.age.today": "Today",
      "hro3.age.day1": "1 day",
      "hro3.age.days": "{n} days",

      "hro3.who.meera": "Meera Iyer",
      "hro3.who.rajan": "Rajan Pillai",
      "hro3.who.farhan": "Farhan Qureshi",

      "hro3.st.draft": "Not sent yet",
      "hro3.st.sent": "Sent, waiting",
      "hro3.st.talking": "They have questions",
      "hro3.st.accepted": "Accepted",
      "hro3.st.declined": "Declined",
      "hro3.st.expired": "Lapsed",
      "hro3.st.withdrawn": "Withdrawn by us",
      "hro3.decline.tookOther": "Took a post elsewhere.",

      "hro3.j.by": "by {who}",
      "hro3.j.to": "To {to}",
      "hro3.j.met": "Met {who}",
      "hro3.j.added": "Added to the system",
      "hro3.j.resume": "Resume checked",
      "hro3.j.interview": "Interviewed",
      "hro3.j.selected": "Selected",
      "hro3.j.drafted": "Offer drafted",
      "hro3.j.sent": "Offer sent",
      "hro3.j.revised": "Offer revised and sent again",
      "hro3.j.extended": "Expiry moved",
      "hro3.j.replied": "Their reply attached",
      "hro3.j.accepted": "Accepted",
      "hro3.j.talking": "Asked for something",
      "hro3.j.declined": "Declined",
      "hro3.j.expired": "Lapsed with no reply",
      "hro3.j.withdrawn": "Withdrawn by us",
      "hro3.j.joined": "Joined",

      "hro3.m.draft": "Written, not sent",
      "hro3.m.draftNote": "No letter has gone out yet",
      "hro3.m.accepted": "They said yes",
      "hro3.m.acceptedNote": "{n}% of the ones who answered",
      "hro3.m.declined": "They said no",
      "hro3.m.declinedNote": "Turned the post down",
      "hro3.m.lapsed": "Over",
      "hro3.m.lapsedNote": "The date passed, or we took it back",
      "hro3.m.foot": "A reply takes {reply} days on average; the slowest took {slow}. {proof} sent with nothing filed back.",
      "hro3.m.out": "Sent, waiting",
      "hro3.m.outNote": "No reply from them yet",
      "hro3.m.closing": "Lapsing within 3 days",
      "hro3.m.closingMark": "Ring them before the date passes",
      "hro3.band.all": "offers",
      "hro3.band.out": "{n} out with somebody right now",
      "hro3.band.donutAria": "{n} offers, by state",
      "hro3.band.hint": "Choose a state to see only those.",
      "hro3.band.waiting": "Oldest wait for an answer",
      "hro3.band.expires": "Lapses in {n} days",
      "hro3.band.none": "Nothing out with anybody.",

      "hro3.reg.title": "Offers",
      "hro3.reg.sub": "Who has one, and what we hold from them",
      "hro3.reg.foot": "Nothing on this screen sends an offer or reads a reply. Naveya records what you did in your own mailbox, and holds the proof.",
      "hro3.col.who": "Candidate",
      "hro3.col.pay": "A month",
      "hro3.col.sent": "Sent",
      "hro3.col.status": "Where it stands",
      "hro3.col.reply": "Their reply",
      "hro3.col.replyOn": "Attached {date}",
      "hro3.col.replyFiles": "Email and screenshot on file",
      "hro3.col.noReply": "Nothing attached yet",

      "hro3.screenSub": "The offer, what we hold from them, and how they got here — added, interviewed, selected, offered, answered.",
      "hro3.card.offer": "The offer",
      "hro3.card.them": "How to reach them",
      "hro3.card.journey": "What has happened",
      "hro3.card.journeyFoot": "Each line is the date the thing happened, not the day it was typed in. Everything before the offer was recorded in Hiring.",

      "hro3.f.post": "The post",
      "hro3.f.pay": "Pay offered",
      "hro3.f.perMonth": "a month",
      "hro3.f.perPeriod": "for each period taught",
      "hro3.f.join": "Joining on",
      "hro3.f.sent": "Offer sent",
      "hro3.f.sentBy": "Sent by {who}",
      "hro3.f.notSet": "Not set yet",
      "hro3.f.notSent": "Not sent yet",
      "hro3.f.expiry": "Answer wanted by",
      "hro3.f.noExpiry": "No date set",
      "hro3.f.leftDays": "{n} days left to answer",
      "hro3.f.lapsedToday": "The date has passed",
      "hro3.f.joined": "On the register",
      "hro3.f.onRegister": "Joined, as {code}",
      "hro3.f.openRegister": "Open the staff register",
      "hro3.f.email": "Email",
      "hro3.f.noEmail": "No email on record",
      "hro3.f.noEmailNote": "An offer cannot go out until there is one. Ask them for it and add it in Hiring.",
      "hro3.f.phone": "Phone",
      "hro3.talking.head": "They have asked for something",
      "hro3.declined.head": "Declined on {date}",
      "hro3.withdrawn.head": "We withdrew this offer",

      "hro3.menu.send": "Record the offer",
      "hro3.menu.reply": "Record their reply",
      "hro3.menu.replyLate": "Record a late reply",
      "hro3.menu.revise": "Revise and send again",
      "hro3.menu.extend": "Extend the date",
      "hro3.menu.reopen": "Put it back with a new date",
      "hro3.menu.withdraw": "Withdraw the offer",

      "hro3.reply.title": "Record their reply",
      "hro3.reply.sub": "{name}",
      "hro3.reply.why.head": "Why this asks for files",
      "hro3.reply.why.body": "Naveya cannot read a mailbox. The status changes when the message they sent is sitting on this record, and not before.",
      "hro3.reply.said": "What did they say?",
      "hro3.reply.said.accepted": "They accepted",
      "hro3.reply.said.talking": "They asked for something",
      "hro3.reply.said.declined": "They declined",
      "hro3.reply.when": "When they replied",
      "hro3.reply.whenHint": "The date on their message, not today.",
      "hro3.reply.whenFuture": "That date has not happened yet.",
      "hro3.reply.from": "Replied from",
      "hro3.reply.fromHint": "The offer went to {to}.",
      "hro3.reply.fromNoEmail": "There was no email on record when this was sent.",
      "hro3.reply.mismatch": "That is not the address the offer went to",
      "hro3.reply.mismatchNote": "People answer from a work address, a spouse's, a phone. Say below how you know it is them \u2014 your word is what ties the reply to the person.",
      "hro3.reply.lapsed": "The offer lapsed on {date}",
      "hro3.reply.lapsedNote": "You can still record their acceptance. Say who agreed to honour it \u2014 the letter's date and their answer no longer agree.",
      "hro3.reply.evidence": "What you are attaching",
      "hro3.reply.file": "Their message",
      "hro3.reply.fileHint": "Forward the reply out of your mailbox and attach it — .eml, .msg or a PDF print.",
      "hro3.reply.shot": "A screenshot of it",
      "hro3.reply.shotHint": "The message as it appeared on your screen, with the sender and the date visible.",
      "hro3.reply.needBoth": "Both are needed before the status can change",
      "hro3.reply.why": "How you know it is them",
      "hro3.reply.whyHint": "Rang them, recognised the address, confirmed with the referrer.",
      "hro3.reply.note": "Anything to add",
      "hro3.reply.noteHint": "What they actually said, in your words.",
      "hro3.reply.cta": "Attach and record",
      "hro3.reply.c1": "The offer moves to “{status}”, dated the day they replied.",
      "hro3.reply.c2": "Both files stay on the offer for good. They cannot be swapped or taken off, by you or anybody.",
      "hro3.reply.c3": "Accepting does not create a staff record. That happens when they join, in the staff register.",
      "hro3.reply.c3talking": "The offer stays live and the clock keeps running. Give them longer if the questions will take a while.",
      "hro3.reply.c3declined": "The post stays open. Whoever else is in the running for it is untouched.",

      "hro3.send.title": "Record the offer you sent",
      "hro3.send.sub": "{name} · {post}",
      "hro3.send.letter": "The offer letter",
      "hro3.send.letterHint": "The PDF you e-mailed them. It is kept as the record of what was offered.",
      "hro3.send.email": "Send it to",
      "hro3.send.emailHint": "Naveya does not send it; you do, from your own mailbox. This is the address, so the reply can be matched later.",
      "hro3.send.emailBad": "That does not look like an email address.",
      "hro3.send.pay": "Pay offered, a month",
      "hro3.send.payHint": "What goes in the letter. The payroll structure is built later, on the staff record.",
      "hro3.send.join": "Joining on",
      "hro3.send.days": "Days to answer",
      "hro3.send.daysHint": "A week is usual. Somebody serving notice will need longer.",
      "hro3.send.cta": "Record it as sent",
      "hro3.send.c1": "This records that YOU sent it. Naveya sends nothing — write the email and attach the letter yourself.",
      "hro3.send.c2": "The address is kept, so a reply from somewhere else is flagged rather than quietly accepted.",
      "hro3.send.c3": "If nothing is attached within {n} days the offer shows as lapsed. It is not cancelled; it is just no longer waiting on you.",

      "hro3.revise.title": "Revise and send again",
      "hro3.revise.why": "What changed, and why",
      "hro3.revise.whyHint": "In a year this is the only record of why the second letter differs from the first.",
      "hro3.revise.cta": "Record the revision",
      "hro3.revise.c1": "The offer goes back to waiting, with the new terms on it.",
      "hro3.revise.c2": "The earlier terms stay on the account below. Nothing is rewritten.",
      "hro3.revise.c3": "Send the new letter yourself. Naveya has not.",

      "hro3.extend.title": "Give them longer",
      "hro3.extend.days": "How many more days",
      "hro3.extend.daysHint": "Counted from the current date to answer, or from today if it has passed.",
      "hro3.extend.cta": "Move the date",
      "hro3.extend.c1": "They have {n} more days to answer.",
      "hro3.extend.c2": "The move is on the account, with your name.",
      "hro3.extend.c3": "Tell them yourself — nothing goes out from here.",

      "hro3.withdraw.title": "Withdraw this offer",
      "hro3.withdraw.why": "Why are you withdrawing it?",
      "hro3.withdraw.whyHint": "The post went to somebody else, the budget went, something came up in the checks.",
      "hro3.withdraw.cta": "Withdraw it",
      "hro3.withdraw.c1": "The offer stops being live and cannot be answered.",
      "hro3.withdraw.c2": "Your name and reason go on the account, and stay there.",
      "hro3.withdraw.c3": "They have not been told. An offer taken back is a phone call, not an email.",

      "hro3.ev.title": "Their reply, on file",
      "hro3.ev.none.head": "Nothing on file yet",
      "hro3.ev.none.body": "Forward their message and attach a screenshot of it.",
      "hro3.ev.when": "Replied on",
      "hro3.ev.from": "Replied from",
      "hro3.ev.mismatch": "Not the address it was sent to ({to})",
      "hro3.ev.letter": "The offer letter",
      "hro3.ev.file": "Their message",
      "hro3.ev.shot": "Screenshot",
      "hro3.ev.foot": "Attached once and kept — neither file can be replaced or removed.",

      "hro3.said.fromHiring": "Started from hiring for {name}. Record the letter you e-mailed.",
      "hro3.said.got": "{file} — downloading.",
      "hro3.said.sent": "Recorded as sent to {email}. Now send it from your mailbox.",
      "hro3.said.reply": "Attached. The offer now reads “{status}”.",
      "hro3.said.revised": "The revision is recorded. Send the new letter yourself.",
      "hro3.said.extended": "{n} more days to answer. Tell them yourself.",
      "hro3.said.withdrawn": "Withdrawn, with your reason on the account. Ring them.",
    },
  });

  /* ============================================================
     SEED

     The people here are the people in the hiring module, carried
     forward: an offer is what happens to somebody who was selected,
     and two modules naming the same person differently is how a
     register stops being believed.
     ============================================================ */
  const TODAY = ["11", "08", "2026"];
  const SCHOOL_DOMAIN = "sunriseeducation.org";


  const OFFER_LOOK = {
    draft: { role: "off", fill: "chartSand", glyph: "document" },
    sent: { role: "late", fill: "chartAmber", glyph: "mail" },
    talking: { role: "ltEL", fill: "chartBlue", glyph: "clock" },
    accepted: { role: "present", fill: "chartGreen", glyph: "check" },
    declined: { role: "absent", fill: "chartRed", glyph: "signout" },
    expired: { role: "missing", fill: "chartPurple", glyph: "alert" },
    withdrawn: { role: "penalty", fill: "chartTeal", glyph: "lock" },
  };
  const STATUS_ORDER = ["draft", "sent", "talking", "accepted", "declined", "expired", "withdrawn"];
  const LIVE_STATUSES = ["draft", "sent", "talking"];

  /* `journey` is the whole account, hiring and offer together. Each
     line is the date the thing HAPPENED. */
  const OFFERS_SEED = [
    {
      id: "of1", campus: "indiranagar", name: "Devika Pillai", post: "PGT Physics, grades 11–12",
      email: "d.pillai@example.com", phone: "+91 98XXX X4482",
      monthly: 60000, joinOn: ["1", "04", "2027"], status: "accepted",
      sentOn: ["8", "08", "2026"], sentByKey: "hro3.who.meera", expiryOn: ["15", "08", "2026"],
      repliedOn: ["10", "08", "2026"], replyFrom: "d.pillai@example.com",
      replyFile: "re-offer-pgt-physics.eml", replyShot: "devika-acceptance.png",
      journey: [
        { k: "hro3.j.added", d: ["22", "07", "2026"], by: "hro3.who.meera", noteText: "Referred by Anjali Deshpande." },
        { k: "hro3.j.resume", d: ["25", "07", "2026"], by: "hro3.who.meera" },
        { k: "hro3.j.interview", d: ["4", "08", "2026"], by: "hro3.who.meera", metText: "Anjali Deshpande and the Principal" },
        { k: "hro3.j.selected", d: ["6", "08", "2026"], by: "hro3.who.meera" },
        { k: "hro3.j.sent", d: ["8", "08", "2026"], by: "hro3.who.meera", toText: "d.pillai@example.com" },
        { k: "hro3.j.replied", d: ["10", "08", "2026"], by: "hro3.who.meera", noteText: "Forwarded her reply and a screenshot of it." },
        { k: "hro3.j.accepted", d: ["10", "08", "2026"], by: "hro3.who.meera" },
      ],
    },
    {
      id: "of2", campus: "indiranagar", name: "Ayesha Merchant", post: "TGT Mathematics, grades 6–8",
      email: "ayesha.m@example.com", phone: "+91 96XXX X3318",
      monthly: 46000, joinOn: ["1", "10", "2026"], status: "sent",
      sentOn: ["9", "08", "2026"], sentByKey: "hro3.who.meera", expiryOn: ["16", "08", "2026"],
      journey: [
        { k: "hro3.j.added", d: ["25", "07", "2026"], by: "hro3.who.meera" },
        { k: "hro3.j.resume", d: ["28", "07", "2026"], by: "hro3.who.meera" },
        { k: "hro3.j.interview", d: ["3", "08", "2026"], by: "hro3.who.meera", metText: "Head of Mathematics and the Principal" },
        { k: "hro3.j.selected", d: ["8", "08", "2026"], by: "hro3.who.meera", noteText: "She asked for a week to answer." },
        { k: "hro3.j.sent", d: ["9", "08", "2026"], by: "hro3.who.meera", toText: "ayesha.m@example.com" },
      ],
    },
    {
      id: "of3", campus: "indiranagar", name: "Farida Ansari", post: "Hostel warden (assistant)",
      email: null, phone: "+91 91XXX X4409",
      monthly: 30000, joinOn: ["1", "09", "2026"], status: "draft",
      draftedOn: ["11", "08", "2026"],
      journey: [
        { k: "hro3.j.added", d: ["18", "07", "2026"], by: "hro3.who.meera", noteText: "Known to the matron." },
        { k: "hro3.j.interview", d: ["24", "07", "2026"], by: "hro3.who.meera", metText: "The matron and the Principal" },
        { k: "hro3.j.selected", d: ["10", "08", "2026"], by: "hro3.who.meera" },
        { k: "hro3.j.drafted", d: ["11", "08", "2026"], by: "hro3.who.meera" },
      ],
    },
    {
      id: "of4", campus: "indiranagar", name: "Devansh Oberoi", post: "Sports coach (assistant)",
      email: "d.oberoi@example.com", phone: "+91 93XXX X7781",
      monthly: 28000, joinOn: ["1", "09", "2026"], status: "expired",
      sentOn: ["20", "07", "2026"], sentByKey: "hro3.who.rajan", expiryOn: ["27", "07", "2026"],
      journey: [
        { k: "hro3.j.added", d: ["5", "07", "2026"], by: "hro3.who.rajan" },
        { k: "hro3.j.interview", d: ["15", "07", "2026"], by: "hro3.who.rajan", metText: "The sports in-charge" },
        { k: "hro3.j.selected", d: ["18", "07", "2026"], by: "hro3.who.rajan" },
        { k: "hro3.j.sent", d: ["20", "07", "2026"], by: "hro3.who.rajan", toText: "d.oberoi@example.com" },
        { k: "hro3.j.expired", d: ["27", "07", "2026"] },
      ],
    },
    {
      id: "of5", campus: "indiranagar", name: "Aditi Rao", post: "Guest faculty, French",
      email: "aditi.rao@example.com", phone: "+91 90XXX X1193",
      monthly: 8000, perPeriod: true, joinOn: ["1", "07", "2026"], status: "declined",
      sentOn: ["3", "07", "2026"], sentByKey: "hro3.who.meera", expiryOn: ["10", "07", "2026"],
      repliedOn: ["8", "07", "2026"], replyFrom: "aditi.rao@example.com",
      replyFile: "re-guest-faculty-french.eml", replyShot: "aditi-decline.png",
      declineReasonKey: "hro3.decline.tookOther",
      journey: [
        { k: "hro3.j.added", d: ["12", "06", "2026"], by: "hro3.who.meera" },
        { k: "hro3.j.interview", d: ["24", "06", "2026"], by: "hro3.who.meera", metText: "The head of Languages" },
        { k: "hro3.j.selected", d: ["1", "07", "2026"], by: "hro3.who.meera" },
        { k: "hro3.j.sent", d: ["3", "07", "2026"], by: "hro3.who.meera", toText: "aditi.rao@example.com" },
        { k: "hro3.j.replied", d: ["8", "07", "2026"], by: "hro3.who.meera" },
        { k: "hro3.j.declined", d: ["8", "07", "2026"], by: "hro3.who.meera", noteText: "Took a full-time post elsewhere." },
      ],
    },
    {
      id: "of6", campus: "indiranagar", name: "Kabir Sanghvi", post: "TGT Mathematics, grades 6–8",
      email: "kabir.s@example.com", phone: "+91 98XXX X9014",
      monthly: 44000, joinOn: ["4", "08", "2026"], status: "accepted",
      sentOn: ["25", "07", "2026"], sentByKey: "hro3.who.meera", expiryOn: ["1", "08", "2026"],
      repliedOn: ["28", "07", "2026"], replyFrom: "k.sanghvi.work@example.com", replyMismatchNoteText: "He replied from his office address; same person, confirmed on the phone.",
      replyFile: "fwd-acceptance-kabir.eml", replyShot: "kabir-acceptance.png",
      joined: true, staffCode: "NAV-0266",
      journey: [
        { k: "hro3.j.added", d: ["12", "07", "2026"], by: "hro3.who.meera" },
        { k: "hro3.j.resume", d: ["15", "07", "2026"], by: "hro3.who.meera" },
        { k: "hro3.j.interview", d: ["21", "07", "2026"], by: "hro3.who.meera", metText: "Head of Mathematics" },
        { k: "hro3.j.selected", d: ["24", "07", "2026"], by: "hro3.who.meera" },
        { k: "hro3.j.sent", d: ["25", "07", "2026"], by: "hro3.who.meera", toText: "kabir.s@example.com" },
        { k: "hro3.j.replied", d: ["28", "07", "2026"], by: "hro3.who.meera", noteText: "Reply came from a different address; confirmed on the phone." },
        { k: "hro3.j.accepted", d: ["28", "07", "2026"], by: "hro3.who.meera" },
        { k: "hro3.j.joined", d: ["4", "08", "2026"], by: "hro3.who.meera", noteText: "On the register as NAV-0266." },
      ],
    },
    {
      id: "of7", campus: "whitefield", name: "Ibrahim Sheikh", post: "PRT Art, grades 1–5",
      email: "i.sheikh@example.com", phone: "+91 97XXX X2240",
      monthly: 32500, joinOn: ["1", "04", "2027"], status: "talking",
      sentOn: ["7", "08", "2026"], sentByKey: "hro3.who.farhan", expiryOn: ["14", "08", "2026"],
      repliedOn: ["9", "08", "2026"], replyFrom: "i.sheikh@example.com",
      replyFile: "re-prt-art-offer.eml", replyShot: "ibrahim-reply.png",
      talkingNoteText: "He has asked whether the joining date can move to June, and about the transport allowance.",
      journey: [
        { k: "hro3.j.added", d: ["20", "07", "2026"], by: "hro3.who.farhan" },
        { k: "hro3.j.resume", d: ["23", "07", "2026"], by: "hro3.who.farhan" },
        { k: "hro3.j.interview", d: ["1", "08", "2026"], by: "hro3.who.farhan", metText: "The art teacher and the Principal" },
        { k: "hro3.j.selected", d: ["5", "08", "2026"], by: "hro3.who.farhan" },
        { k: "hro3.j.sent", d: ["7", "08", "2026"], by: "hro3.who.farhan", toText: "i.sheikh@example.com" },
        { k: "hro3.j.replied", d: ["9", "08", "2026"], by: "hro3.who.farhan", noteText: "Asked about the joining date and transport." },
      ],
    },
  ];

  /* ============================================================
     HELPERS
     ============================================================ */
  function dmy(t, d) { return d ? d[0] + " " + t("hro3.mon." + d[1]) + " " + d[2] : null; }
  function toDate(d) { return new Date(parseInt(d[2], 10), parseInt(d[1], 10) - 1, parseInt(d[0], 10)); }
  function daysSince(d) { return Math.round((toDate(TODAY) - toDate(d)) / 86400000); }
  function daysUntil(d) { return Math.round((toDate(d) - toDate(TODAY)) / 86400000); }
  function ageWord(t, n) { return n <= 0 ? t("hro3.age.today") : n === 1 ? t("hro3.age.day1") : t("hro3.age.days", { n: num(n) }); }
  function isoToArr(s) { const p = String(s).split("-"); return p.length === 3 ? [String(Number(p[2])), p[1], p[0]] : null; }
  function arrToIso(d) { return d ? d[2] + "-" + d[1] + "-" + (d[0].length === 1 ? "0" + d[0] : d[0]) : ""; }
  function isLive(o) { return LIVE_STATUSES.indexOf(o.status) >= 0; }
  function waitingDays(o) { return o.status === "sent" ? daysSince(o.sentOn) : o.status === "talking" ? daysSince(o.repliedOn) : 0; }

  /* ---- local primitives (promotion candidates: Pop / PopFoot /
     Consequence / DefRow / Trail / BarRow are now in their fourth and
     fifth independent copies across pages) ---- */
  function Pop({ title, sub, onClose, children, width }) {
    const { c, shadow } = useTheme();
    const { ty } = useLang();
    return ReactDOM.createPortal(
      <div style={{ position: "fixed", inset: 0, zIndex: 2400, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div aria-hidden="true" onMouseDown={onClose} style={{ position: "absolute", inset: 0, background: c.rail, opacity: 0.55 }} />
        <div
          role="dialog" aria-modal="true"
          style={{
            position: "relative", width: width || 580, maxWidth: "100%", maxHeight: "86vh", overflowY: "auto",
            background: c.surface, border: "1px solid " + c.border, borderRadius: G3.r.lg,
            boxShadow: shadow(4), padding: "24px 26px 22px",
          }}
        >
          <h2 style={ty("h2", { margin: 0, color: c.ink })}>{title}</h2>
          {sub ? <p style={ty("small", { color: c.inkMuted, margin: "7px 0 0" })}>{sub}</p> : null}
          <div style={{ marginTop: 2 }}>{children}</div>
        </div>
      </div>,
      document.body
    );
  }

  function Consequence({ lines }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const real = lines.filter(Boolean);
    if (!real.length) return null;
    return (
      <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid " + c.rule }}>
        <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 7 })}>{t("hro3.whatHappens")}</div>
        {real.map(function (l, i) {
          return (
            <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start", padding: "3px 0" }}>
              <span aria-hidden="true" style={{ width: 4, height: 4, borderRadius: 4, background: c.inkFaint, marginTop: 8, flexShrink: 0 }} />
              <span style={ty("small", { color: c.ink })}>{l}</span>
            </div>
          );
        })}
      </div>
    );
  }

  function PopFoot({ confirmLabel, onConfirm, onCancel, danger, disabled }) {
    const { c } = useTheme();
    const { t } = useLang();
    return (
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20, paddingTop: 16, borderTop: "1px solid " + c.rule }}>
        <Button kind="ghost" onClick={onCancel}>{t("hro3.cta.cancel")}</Button>
        <Button kind={danger ? "danger" : "primary"} onClick={onConfirm} disabled={disabled}>{confirmLabel}</Button>
      </div>
    );
  }

  function DefRow({ label, children, last }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return (
      <div style={{ display: "flex", gap: 16, alignItems: "baseline", padding: "11px 0", borderBottom: last ? "none" : "1px dashed " + c.border }}>
        <span style={ty("caption", { color: c.inkFaint, width: 190, flexShrink: 0 })}>{label}</span>
        <span style={{ flex: 1, minWidth: 0 }}>{children}</span>
      </div>
    );
  }

  function Value({ children, muted }) {
    const { c } = useTheme();
    const { ty } = useLang();
    return <span style={ty("small", { color: muted ? c.inkMuted : c.ink })}>{children}</span>;
  }

  function Flash({ text }) {
    const { c } = useTheme();
    const { ty } = useLang();
    if (!text) return null;
    return (
      <div role="status" style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "11px 14px", borderRadius: G3.r.md, border: "1px solid " + c.presentBorder, background: c.presentTint, marginBottom: G3.layout.gap }}>
        <span aria-hidden="true" style={{ color: c.presentText, display: "flex", paddingTop: 1 }}><Icon name="check" size={15} /></span>
        <span style={ty("small", { color: c.ink })}>{text}</span>
      </div>
    );
  }

  function TopStrip({ campus, onCampus, fixed }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, marginBottom: 14, flexWrap: "wrap" }}>
        <div style={ty("small", { color: c.inkMuted })}>
          <span style={{ color: c.ink, fontWeight: 700 }}>{t("nav.hrOffers")}</span>
          <span style={{ margin: "0 8px", color: c.inkFaint }}>·</span>
          <span>{t("hro3.top.scope")}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {fixed ? <Chip>{campusLabel(t, campus)}</Chip> : <CampusSwitch value={campus} onChange={onCampus} />}
          <ThemeToggle />
        </div>
      </div>
    );
  }



  function Trail({ items }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    return (
      <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {items.map(function (it, i) {
          return (
            <li key={i} style={{ display: "flex", gap: 13, alignItems: "flex-start", paddingBottom: i < items.length - 1 ? 16 : 0 }}>
              <span aria-hidden="true" style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, alignSelf: "stretch" }}>
                <span style={{ width: 8, height: 8, borderRadius: G3.r.pill, background: c.accent, marginTop: 6, flexShrink: 0 }} />
                {i < items.length - 1 ? <span style={{ width: 1, flex: 1, background: c.border, marginTop: 4 }} /> : null}
              </span>
              <span style={{ minWidth: 0, flex: 1 }}>
                <span style={ty("small", { display: "block", color: c.ink, fontWeight: 600 })}>{t(it.k)}</span>
                <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 3 })}>
                  {dmy(t, it.d)}{it.by ? " · " + t("hro3.j.by", { who: t(it.by) }) : ""}
                </span>
                {/* what happened, when, and whose hand it was — the
                    sentences typed at the time belong to the record */}
              </span>
            </li>
          );
        })}
      </ol>
    );
  }

  /* ============================================================
     THE ONE THAT MATTERS · RECORDING A REPLY

     Naveya cannot read anybody's mailbox. An offer goes out from
     somebody's email client and the answer comes back to it. So the
     status does not change because the system learned something — it
     changes because HR PUT THE EVIDENCE ON THE RECORD. Two files are
     required, not one: the forwarded message, and a screenshot of it
     as it appeared. The message alone can be retyped; the screenshot
     alone cannot be searched.
     ============================================================ */
  function RecordReplyPop({ offer, onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [said, setSaid] = useState("accepted");
    const [when, setWhen] = useState(arrToIso(TODAY));
    const [from, setFrom] = useState(offer.email || "");
    const [file, setFile] = useState(null);
    const [shot, setShot] = useState(null);
    const [note, setNote] = useState("");
    const [why, setWhy] = useState("");

    const future = when && when > arrToIso(TODAY);
    const mismatch = !!(from.trim() && offer.email && from.trim().toLowerCase() !== offer.email.toLowerCase());
    const lapsed = offer.expiryOn && when && when > arrToIso(offer.expiryOn);
    const needsWhy = (mismatch || lapsed) && said === "accepted";
    const ready = !!file && !!shot && !!when && !future && !!from.trim() && (!needsWhy || why.trim()) && (said !== "declined" || why.trim() || true);

    return (
      <Pop title={t("hro3.reply.title")} sub={t("hro3.reply.sub", { name: offer.name })} onClose={onClose} width={660}>
        <div style={{ marginBottom: 18 }}>
          <Card>
            <div style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
              <span aria-hidden="true" style={{ color: c.inkMuted, display: "flex", paddingTop: 2 }}><Icon name="mail" size={16} /></span>
              <div>
                <div style={ty("small", { color: c.ink, fontWeight: 700 })}>{t("hro3.reply.why.head")}</div>
                <p style={ty("small", { color: c.inkMuted, margin: "4px 0 0", maxWidth: 520 })}>{t("hro3.reply.why.body")}</p>
              </div>
            </div>
          </Card>
        </div>

        <Field id="hro3-reply-said" label={t("hro3.reply.said")}>
          <Select id="hro3-reply-said" value={said} onChange={setSaid}
            options={[
              { value: "accepted", label: t("hro3.reply.said.accepted") },
              { value: "talking", label: t("hro3.reply.said.talking") },
              { value: "declined", label: t("hro3.reply.said.declined") },
            ]} />
        </Field>

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 190px" }}>
            <Field id="hro3-reply-when" label={t("hro3.reply.when")} hint={t("hro3.reply.whenHint")} error={future ? t("hro3.reply.whenFuture") : null}>
              <Input id="hro3-reply-when" type="date" value={when} onChange={setWhen} invalid={!!future} />
            </Field>
          </div>
          <div style={{ flex: "1 1 240px" }}>
            <Field id="hro3-reply-from" label={t("hro3.reply.from")} hint={offer.email ? t("hro3.reply.fromHint", { to: offer.email }) : t("hro3.reply.fromNoEmail")}>
              <Input id="hro3-reply-from" value={from} onChange={setFrom} />
            </Field>
          </div>
        </div>

        {mismatch ? (
          <div style={{ marginTop: -6, marginBottom: 16 }}>
            <StatusMark role="late" glyph="alert" word={t("hro3.reply.mismatch")} />
            <p style={ty("caption", { color: c.inkMuted, margin: "6px 0 0", maxWidth: 560 })}>{t("hro3.reply.mismatchNote", { to: offer.email })}</p>
          </div>
        ) : null}
        {lapsed && said === "accepted" ? (
          <div style={{ marginTop: -6, marginBottom: 16 }}>
            <StatusMark role="absent" glyph="alert" word={t("hro3.reply.lapsed", { date: dmy(t, offer.expiryOn) })} />
            <p style={ty("caption", { color: c.inkMuted, margin: "6px 0 0", maxWidth: 560 })}>{t("hro3.reply.lapsedNote")}</p>
          </div>
        ) : null}

        {/* the two attachments, and the refusal to proceed without them */}
        <div style={{ padding: "16px 0 4px", borderTop: "1px solid " + c.rule, marginTop: 4 }}>
          <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 12 })}>{t("hro3.reply.evidence")}</div>
          <Field id="hro3-reply-file" label={t("hro3.reply.file")} hint={t("hro3.reply.fileHint")}>
            <FileField id="hro3-reply-file" fileName={file} onPick={setFile} accept=".eml,.msg,.pdf" invalid={!file} />
          </Field>
          <Field id="hro3-reply-shot" label={t("hro3.reply.shot")} hint={t("hro3.reply.shotHint")}>
            <FileField id="hro3-reply-shot" fileName={shot} onPick={setShot} accept=".png,.jpg,.jpeg" invalid={!shot} />
          </Field>
          {!file || !shot ? (
            <div style={{ marginTop: -6, marginBottom: 14 }}>
              <StatusMark role="missing" glyph="lock" word={t("hro3.reply.needBoth")} />
            </div>
          ) : null}
        </div>

        {needsWhy ? (
          <Field id="hro3-reply-why" label={t("hro3.reply.why")} hint={t("hro3.reply.whyHint")}>
            <Input id="hro3-reply-why" value={why} onChange={setWhy} />
          </Field>
        ) : null}
        <Field id="hro3-reply-note" label={t("hro3.reply.note")} hint={t("hro3.reply.noteHint")}>
          <Input id="hro3-reply-note" value={note} onChange={setNote} />
        </Field>

        <Consequence lines={[
          t("hro3.reply.c1", { status: t("hro3.st." + (said === "talking" ? "talking" : said)) }),
          t("hro3.reply.c2"),
          said === "accepted" ? t("hro3.reply.c3") : null,
          said === "talking" ? t("hro3.reply.c3talking") : null,
          said === "declined" ? t("hro3.reply.c3declined") : null,
        ]} />
        <PopFoot confirmLabel={t("hro3.reply.cta")} onCancel={onClose} disabled={!ready}
          onConfirm={function () { onDone({ said: said, when: when, from: from.trim(), file: file, shot: shot, note: note.trim(), why: why.trim() }); }} />
      </Pop>
    );
  }

  function SendOfferPop({ offer, onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [email, setEmail] = useState(offer.email || "");
    const [days, setDays] = useState("7");
    const [monthly, setMonthly] = useState(String(offer.monthly || ""));
    const [join, setJoin] = useState(arrToIso(offer.joinOn));
    const [letter, setLetter] = useState(null);
    const looksEmail = /.+@.+\..+/.test(email.trim());
    /* NOTHING IS SENT FROM HERE. The letter went out of somebody's
       mail client; this is where the school keeps what went, to whom
       and when, so the file and the address are the two things it
       cannot be recorded without. */
    const ready = !!letter && looksEmail && Number(days) > 0 && Number(monthly) > 0 && join;
    return (
      <Pop title={t("hro3.send.title")} sub={t("hro3.send.sub", { name: offer.name, post: offer.post })} onClose={onClose} width={640}>
        <Field id="hro3-send-letter" label={t("hro3.send.letter")}>
          <FileField id="hro3-send-letter" fileName={letter} onPick={setLetter} accept=".pdf" hint={t("hro3.send.letterHint")} />
        </Field>
        <Field id="hro3-send-email" label={t("hro3.send.email")} hint={t("hro3.send.emailHint")}
          error={email.trim() && !looksEmail ? t("hro3.send.emailBad") : null}>
          <Input id="hro3-send-email" value={email} onChange={setEmail} invalid={!!(email.trim() && !looksEmail)} />
        </Field>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 190px" }}>
            <Field id="hro3-send-pay" label={t("hro3.send.pay")} hint={t("hro3.send.payHint")}>
              <Input id="hro3-send-pay" inputMode="numeric" value={monthly} onChange={function (x) { setMonthly(x.replace(/[^0-9]/g, "")); }} />
            </Field>
          </div>
          <div style={{ flex: "1 1 190px" }}>
            <Field id="hro3-send-join" label={t("hro3.send.join")}>
              <Input id="hro3-send-join" type="date" value={join} onChange={setJoin} />
            </Field>
          </div>
          <div style={{ flex: "1 1 150px" }}>
            <Field id="hro3-send-days" label={t("hro3.send.days")} hint={t("hro3.send.daysHint")}>
              <Input id="hro3-send-days" inputMode="numeric" value={days} onChange={function (x) { setDays(x.replace(/[^0-9]/g, "")); }} />
            </Field>
          </div>
        </div>
        <Consequence lines={[t("hro3.send.c1"), t("hro3.send.c2"), t("hro3.send.c3", { n: num(Number(days) || 0) })]} />
        <PopFoot confirmLabel={t("hro3.send.cta")} onCancel={onClose} disabled={!ready}
          onConfirm={function () { onDone({ email: email.trim(), days: Number(days), monthly: Number(monthly), join: join, letter: letter }); }} />
      </Pop>
    );
  }

  function ReviseOfferPop({ offer, onClose, onDone }) {
    const { t } = useLang();
    const [monthly, setMonthly] = useState(String(offer.monthly || ""));
    const [join, setJoin] = useState(arrToIso(offer.joinOn));
    const [why, setWhy] = useState("");
    const ready = Number(monthly) > 0 && join && why.trim();
    return (
      <Pop title={t("hro3.revise.title")} sub={offer.name} onClose={onClose}>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 190px" }}>
            <Field id="hro3-rev-pay" label={t("hro3.send.pay")}>
              <Input id="hro3-rev-pay" inputMode="numeric" value={monthly} onChange={function (x) { setMonthly(x.replace(/[^0-9]/g, "")); }} />
            </Field>
          </div>
          <div style={{ flex: "1 1 190px" }}>
            <Field id="hro3-rev-join" label={t("hro3.send.join")}>
              <Input id="hro3-rev-join" type="date" value={join} onChange={setJoin} />
            </Field>
          </div>
        </div>
        <Field id="hro3-rev-why" label={t("hro3.revise.why")} hint={t("hro3.revise.whyHint")}>
          <Input id="hro3-rev-why" value={why} onChange={setWhy} />
        </Field>
        <Consequence lines={[t("hro3.revise.c1"), t("hro3.revise.c2"), t("hro3.revise.c3")]} />
        <PopFoot confirmLabel={t("hro3.revise.cta")} onCancel={onClose} disabled={!ready}
          onConfirm={function () { onDone({ monthly: Number(monthly), join: join, why: why.trim() }); }} />
      </Pop>
    );
  }

  function WithdrawPop({ offer, onClose, onDone }) {
    const { t } = useLang();
    const [why, setWhy] = useState("");
    return (
      <Pop title={t("hro3.withdraw.title")} sub={offer.name} onClose={onClose}>
        <Field id="hro3-wd-why" label={t("hro3.withdraw.why")} hint={t("hro3.withdraw.whyHint")}>
          <Input id="hro3-wd-why" value={why} onChange={setWhy} />
        </Field>
        <Consequence lines={[t("hro3.withdraw.c1"), t("hro3.withdraw.c2"), t("hro3.withdraw.c3")]} />
        <PopFoot danger confirmLabel={t("hro3.withdraw.cta")} onCancel={onClose} disabled={!why.trim()}
          onConfirm={function () { onDone(why.trim()); }} />
      </Pop>
    );
  }

  function ExtendPop({ offer, onClose, onDone }) {
    const { t } = useLang();
    const [days, setDays] = useState("7");
    return (
      <Pop title={t("hro3.extend.title")} sub={offer.name} onClose={onClose}>
        <Field id="hro3-ex-days" label={t("hro3.extend.days")} hint={t("hro3.extend.daysHint")}>
          <Input id="hro3-ex-days" inputMode="numeric" value={days} onChange={function (x) { setDays(x.replace(/[^0-9]/g, "")); }} />
        </Field>
        <Consequence lines={[t("hro3.extend.c1", { n: num(Number(days) || 0) }), t("hro3.extend.c2"), t("hro3.extend.c3")]} />
        <PopFoot confirmLabel={t("hro3.extend.cta")} onCancel={onClose} disabled={!(Number(days) > 0)}
          onConfirm={function () { onDone(Number(days)); }} />
      </Pop>
    );
  }

  /* what we hold, shown as what it is: two files and where they came
     from. A status with nothing behind it is a rumour. */
  function FileChip({ name, onGet }) {
    const { c } = useTheme();
    const { ty } = useLang();
    if (!name) return null;
    const pic = /\.(png|jpg|jpeg|gif|webp)$/i.test(name);
    return (
      <button
        type="button" onClick={onGet}
        style={{
          display: "inline-flex", alignItems: "center", gap: 9, cursor: "pointer",
          border: "1px solid " + c.border, background: c.surface, borderRadius: G3.r.md,
          padding: "7px 11px", maxWidth: "100%", textAlign: "left",
        }}
      >
        <span aria-hidden="true" style={{
          width: 26, height: 26, borderRadius: G3.r.sm, flexShrink: 0,
          background: c.sunken, color: c.inkMuted,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}><Icon name={pic ? "scan" : "document"} size={14} /></span>
        <span style={{ minWidth: 0 }}>
          <span style={{ display: "block", fontFamily: G3.font.mono, fontSize: 12, color: c.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
        </span>
        <span aria-hidden="true" style={{ display: "flex", color: c.action, flexShrink: 0 }}><Icon name="download" size={14} /></span>
      </button>
    );
  }

  function EvidenceCard({ offer, onGet }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    if (!offer.replyFile) {
      return (
        <Card title={t("hro3.ev.title")}>
          <EmptyState compact head={t("hro3.ev.none.head")} body={t("hro3.ev.none.body")} />
        </Card>
      );
    }
    const mismatch = offer.email && offer.replyFrom && offer.replyFrom.toLowerCase() !== offer.email.toLowerCase();
    return (
      <Card title={t("hro3.ev.title")}>
        <DefRow label={t("hro3.ev.when")}><Value>{dmy(t, offer.repliedOn)}</Value></DefRow>
        <DefRow label={t("hro3.ev.from")}>
          <span style={{ fontFamily: G3.font.mono, fontSize: 12.5, color: c.ink }}>{offer.replyFrom}</span>
          {mismatch ? (
            <React.Fragment>
              <div style={{ marginTop: 6 }}><StatusMark role="late" glyph="alert" word={t("hro3.ev.mismatch", { to: offer.email })} /></div>
              {offer.replyMismatchNoteText ? <div style={{ marginTop: 5 }}><Value muted>{offer.replyMismatchNoteText}</Value></div> : null}
            </React.Fragment>
          ) : null}
        </DefRow>
        <DefRow label={t("hro3.ev.file")}>
          <FileChip name={offer.replyFile} onGet={function () { onGet && onGet(offer.replyFile); }} />
        </DefRow>
        <DefRow label={t("hro3.ev.shot")} last>
          <FileChip name={offer.replyShot} onGet={function () { onGet && onGet(offer.replyShot); }} />
        </DefRow>
        <p style={ty("caption", { color: c.inkFaint, margin: "16px 0 0", paddingTop: 13, borderTop: "1px solid " + c.rule })}>{t("hro3.ev.foot")}</p>
      </Card>
    );
  }

  /* ONE PERSON'S OFFER, on a screen of its own — and with it the
     whole journey, because "when were they added, when was the
     interview, when did the offer go out" is one question, not three
     screens' worth. */
  /* THE OFFER, IN THE SIDE SCREEN. It was a page of its own with the
     name, the post and the state across the top — all three of which
     the row the reader just clicked already says. What the row cannot
     hold is the money, the dates, what is filed against it and what
     has happened to it, so that is what is in here.

     NOTHING IN HERE SENDS ANYTHING. HR writes the letter, e-mails it
     and then records it; the school's copy of the offer is the PDF
     that went and the reply that came back. */
  function OfferSheet({ offer, onClose, onPatch, onNavigate, onGet }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [pop, setPop] = useState(null);
    const left = offer.expiryOn && (offer.status === "sent" || offer.status === "talking") ? daysUntil(offer.expiryOn) : null;

    /* EVERY ACTION IN THE SHEET. Three dots over a sheet drew their
       menu behind it, and hid three things that fit on one line. */
    const canRevise = offer.status === "sent" || offer.status === "talking";
    const canExtend = canRevise || offer.status === "expired";
    const canWithdraw = isLive(offer) || offer.status === "expired";

    const primary = offer.status === "draft"
      ? <Button kind="primary" size="sm" iconLeft="mail" onClick={function () { setPop("send"); }}>{t("hro3.menu.send")}</Button>
      : (offer.status === "sent" || offer.status === "talking" || offer.status === "expired")
        ? <Button kind="primary" size="sm" iconLeft="download" onClick={function () { setPop("reply"); }}>{t("hro3.menu.reply")}</Button>
        : null;

    return (
      <SideScreen
        title={offer.name} sub={offer.post} width={680} onClose={onClose}
        footer={
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            {primary}
            {canRevise ? <Button kind="secondary" size="sm" onClick={function () { setPop("revise"); }}>{t("hro3.menu.revise")}</Button> : null}
            {canExtend ? (
              <Button kind="secondary" size="sm" onClick={function () { setPop("extend"); }}>
                {offer.status === "expired" ? t("hro3.menu.reopen") : t("hro3.menu.extend")}
              </Button>
            ) : null}
            {canWithdraw ? <Button kind="dangerOutline" size="sm" onClick={function () { setPop("withdraw"); }}>{t("hro3.menu.withdraw")}</Button> : null}
          </div>
        }
      >
        <div style={{ marginBottom: 18 }}>
          {/* a draft started from hiring has neither yet: both are
              written down when the letter that carries them is */}
          <DefRow label={t("hro3.f.pay")}>
            {offer.monthly ? (
              <React.Fragment>
                <span style={G3.fig("md", { color: c.ink, fontWeight: 700 })}>{inr(offer.monthly)}</span>
                <div style={{ marginTop: 3 }}><Value muted>{offer.perPeriod ? t("hro3.f.perPeriod") : t("hro3.f.perMonth")}</Value></div>
              </React.Fragment>
            ) : <Value muted>{t("hro3.f.notSet")}</Value>}
          </DefRow>
          <DefRow label={t("hro3.f.join")}>
            {offer.joinOn ? <Value>{dmy(t, offer.joinOn)}</Value> : <Value muted>{t("hro3.f.notSet")}</Value>}
          </DefRow>
          <DefRow label={t("hro3.f.sent")} last={!offer.joined}>
            {offer.sentOn ? (
              <React.Fragment>
                <Value>{dmy(t, offer.sentOn)}</Value>
                <div style={{ marginTop: 3 }}><Value muted>{t("hro3.f.sentBy", { who: t(offer.sentByKey) })}</Value></div>
                <div style={{ marginTop: 3 }}>
                  <span style={{ fontFamily: G3.font.mono, fontSize: 12, color: c.inkMuted }}>{offer.email}</span>
                </div>
              </React.Fragment>
            ) : <Value muted>{t("hro3.f.notSent")}</Value>}
          </DefRow>
          {offer.joined ? (
            <DefRow label={t("hro3.f.joined")} last>
              <Value>{t("hro3.f.onRegister", { code: offer.staffCode })}</Value>
              <div style={{ marginTop: 9 }}>
                <Button kind="secondary" size="sm" iconLeft="staff" onClick={function () { onNavigate && onNavigate("hrStaff"); }}>{t("hro3.f.openRegister")}</Button>
              </div>
            </DefRow>
          ) : null}
          {offer.status === "talking" && offer.talkingNoteText ? (
            <p style={ty("small", { color: c.inkMuted, margin: "12px 0 0", maxWidth: 580 })}>{offer.talkingNoteText}</p>
          ) : null}
          {offer.status === "declined" && offer.declineReasonKey ? (
            <p style={ty("small", { color: c.inkMuted, margin: "12px 0 0" })}>{t(offer.declineReasonKey)}</p>
          ) : null}
          {offer.status === "withdrawn" ? (
            <p style={ty("small", { color: c.inkMuted, margin: "12px 0 0" })}>{offer.withdrawReasonText}</p>
          ) : null}
        </div>

        {offer.letterFile ? (
          <div style={{ marginBottom: 18 }}>
            <DefRow label={t("hro3.ev.letter")} last>
              <FileChip name={offer.letterFile} onGet={function () { onGet(offer.letterFile); }} />
            </DefRow>
          </div>
        ) : null}

        <div style={{ marginBottom: 18 }}><EvidenceCard offer={offer} onGet={onGet} /></div>

        <div style={{ paddingTop: 16, borderTop: "1px solid " + c.rule }}>
          <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 10 })}>{t("hro3.card.journey")}</div>
          <Trail items={(offer.journey || []).slice().reverse()} />
        </div>

        {pop === "send" ? <SendOfferPop offer={offer} onClose={function () { setPop(null); }} onDone={function (v) { setPop(null); onPatch(offer.id, "send", v); }} /> : null}
        {pop === "reply" ? <RecordReplyPop offer={offer} onClose={function () { setPop(null); }} onDone={function (v) { setPop(null); onPatch(offer.id, "reply", v); }} /> : null}
        {pop === "revise" ? <ReviseOfferPop offer={offer} onClose={function () { setPop(null); }} onDone={function (v) { setPop(null); onPatch(offer.id, "revise", v); }} /> : null}
        {pop === "extend" ? <ExtendPop offer={offer} onClose={function () { setPop(null); }} onDone={function (d) { setPop(null); onPatch(offer.id, "extend", d); }} /> : null}
        {pop === "withdraw" ? <WithdrawPop offer={offer} onClose={function () { setPop(null); }} onDone={function (w) { setPop(null); onPatch(offer.id, "withdraw", w); }} /> : null}
      </SideScreen>
    );
  }

  function OffersList({ campus, offers, onOpen, flash }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [status, setStatus] = useState("all");
    const [q, setQ] = useState("");

    const here = offers.filter(function (o) { return inCampus(campus, o.campus); });
    const needle = q.trim().toLowerCase();
    const list = here.filter(function (o) {
      if (status !== "all" && o.status !== status) return false;
      if (needle && (o.name + " " + o.post).toLowerCase().indexOf(needle) === -1) return false;
      return true;
    });

    const band = STATUS_ORDER.map(function (s) {
      return { key: s, label: t("hro3.st." + s), value: here.filter(function (o) { return o.status === s; }).length, color: c[OFFER_LOOK[s].fill] || c.chartBlue };
    });
    const out = here.filter(function (o) { return o.status === "sent" || o.status === "talking"; });
    const outCount = out.length;
    /* an offer that got an answer, either way — the denominator the
       acceptance rate is actually out of */
    const answered = here.filter(function (o) { return o.status === "accepted" || o.status === "declined"; });
    const acceptedCount = here.filter(function (o) { return o.status === "accepted"; }).length;
    const acceptRate = answered.length ? Math.round((acceptedCount / answered.length) * 100) : 0;
    const replyDays = here
      .filter(function (o) { return o.repliedOn && o.sentOn; })
      .map(function (o) { return Math.max(0, Math.round((toDate(o.repliedOn) - toDate(o.sentOn)) / 86400000)); });
    const avgReply = replyDays.length ? Math.round(replyDays.reduce(function (s, n2) { return s + n2; }, 0) / replyDays.length) : 0;
    const maxReply = replyDays.length ? Math.max.apply(null, replyDays) : 0;
    const closing = out.filter(function (o) { return o.expiryOn && daysUntil(o.expiryOn) <= 3; }).length;
    /* the five states every offer is in exactly one of */
    const draftCount = here.filter(function (o) { return o.status === "draft"; }).length;
    const declinedCount = here.filter(function (o) { return o.status === "declined"; }).length;
    const lapsedCount = here.filter(function (o) { return o.status === "expired" || o.status === "withdrawn"; }).length;
    const noProof = here.filter(function (o) { return (o.status === "sent" || o.status === "expired") && !o.replyFile; }).length;

    const columns = [
      { key: "who", label: t("hro3.col.who") },
      { key: "pay", label: t("hro3.col.pay"), align: "right", mono: true, width: 140 },
      { key: "sent", label: t("hro3.col.sent"), mono: true, width: 130 },
      { key: "status", label: t("hro3.col.status"), width: 190 },
      { key: "reply", label: t("hro3.col.reply"), width: 210 },
    ];
    const rows = list.map(function (o) {
      const look = OFFER_LOOK[o.status];
      const left = o.expiryOn && (o.status === "sent" || o.status === "talking") ? daysUntil(o.expiryOn) : null;
      return {
        id: o.id, live: true,
        cells: {
          who: (
            <span style={{ display: "flex", gap: 11, alignItems: "center", minWidth: 0 }}>
              <Avatar name={o.name} size={30} />
              <span style={{ minWidth: 0 }}>
                <span style={ty("small", { display: "block", color: c.ink, fontWeight: 600 })}>{o.name}</span>
                <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 1 })}>{o.post}</span>
              </span>
            </span>
          ),
          pay: (
            <span>
              <span style={{ display: "block" }}>{inr(o.monthly)}</span>
              {o.perPeriod ? <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 2 })}>{t("hro3.f.perPeriod")}</span> : null}
            </span>
          ),
          sent: o.sentOn ? dmy(t, o.sentOn) : "—",
          status: (
            <span>
              <StatusMark role={look.role} glyph={look.glyph} word={t("hro3.st." + o.status)} />
              {left != null ? (
                <span style={ty("caption", { display: "block", color: left <= 2 ? c.dangerText : c.inkMuted, marginTop: 3 })}>
                  {left <= 0 ? t("hro3.f.lapsedToday") : t("hro3.f.leftDays", { n: num(left) })}
                </span>
              ) : null}
            </span>
          ),
          reply: o.replyFile
            ? (
              <span>
                <StatusMark role="present" glyph="check" word={t("hro3.col.replyOn", { date: dmy(t, o.repliedOn) })} />
                <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 2 })}>{t("hro3.col.replyFiles")}</span>
              </span>
            )
            : (o.status === "sent" || o.status === "expired")
              ? <StatusMark role="missing" glyph="clock" word={t("hro3.col.noReply")} />
              : <Value muted>—</Value>,
        },
      };
    });

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: G3.layout.gap }}>
        <Flash text={flash} />
        <Card>
          {/* EVERY OFFER IS IN EXACTLY ONE OF THESE, which is what makes
              the bar underneath the board rather than a coincidence. The
              acceptance rate, the average reply and the ones sent with
              nothing attached are not a composition of anything; they are
              the line under the figures. */}
          <MetricStrip
            pad={0} style={{ marginTop: 2, marginBottom: 2 }}
            metrics={[
              { k: "draft", label: t("hro3.m.draft"), value: num(draftCount), tone: c.chartAmber,
                note: t("hro3.m.draftNote") },
              { k: "out", label: t("hro3.m.out"), value: num(outCount), tone: c.chartBlue,
                note: t("hro3.m.outNote") },
              { k: "accepted", label: t("hro3.m.accepted"), value: num(acceptedCount), tone: c.chartGreen,
                note: t("hro3.m.acceptedNote", { n: num(acceptRate) }) },
              { k: "declined", label: t("hro3.m.declined"), value: num(declinedCount), tone: c.chartRed,
                note: t("hro3.m.declinedNote") },
              { k: "lapsed", label: t("hro3.m.lapsed"), value: num(lapsedCount), tone: c.chartPurple,
                note: t("hro3.m.lapsedNote") },
            ]}
          />
          <p style={ty("caption", {
            color: c.inkFaint, margin: "16px 0 0", paddingTop: 13, borderTop: "1px solid " + c.rule,
          })}>
            {t("hro3.m.foot", { reply: num(avgReply), slow: num(maxReply), proof: num(noProof) })}
          </p>

        </Card>

        {rows.length === 0 ? (
          <Card><EmptyState head={t("hro3.empty.head")} body={t("hro3.empty.body")} /></Card>
        ) : (
          <Register
            title={t("hro3.reg.title")} sub={t("hro3.reg.sub")}
            action={
              <span style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <span style={{ width: 240 }}>
                  <Input id="hro3-q" value={q} onChange={setQ} placeholder={t("hro3.findPh")} />
                </span>
                {/* what the bar's legend used to narrow */}
                <span style={{ width: 210 }}>
                  <Select id="hro3-status" ariaLabel={t("hro3.col.status")} value={status} onChange={setStatus}
                    options={[{ value: "all", label: t("hro3.allStatus") }].concat(
                      band.map(function (sg) { return { value: sg.key, label: sg.label + " (" + num(sg.value) + ")" }; })
                    )} />
                </span>
              </span>
            }
            columns={columns} rows={rows} onSelect={onOpen}
            footer={<span style={ty("caption", { color: c.inkFaint })}>{t("hro3.reg.foot")}</span>}
          />
        )}
      </div>
    );
  }

  /* ============================================================
     SHELL — one surface, so no tab bar
     ============================================================ */
  /* THE OFFERS, AS A PANEL. Hiring draws this under a tab of its own:
     an offer is the last rung of the ladder the other two tabs climb,
     not a module somebody navigates to from a rail. The panel keeps
     the state; the page around it is whatever is holding it. */
  function OffersPanel({ campus, onNavigate }) {
    const { t } = useLang();
    const [offers, setOffers] = useState(OFFERS_SEED);
    const [openId, setOpenId] = useState(null);
    const [flash, setFlash] = useState(null);

    function patch(id, action, payload) {
      setOffers(function (cur) {
        return cur.map(function (o) {
          if (o.id !== id) return o;
          const j = (o.journey || []).slice();
          if (action === "send") {
            const exp = new Date(toDate(TODAY).getTime() + payload.days * 86400000);
            const expArr = [String(exp.getDate()), String(exp.getMonth() + 1).padStart(2, "0"), String(exp.getFullYear())];
            j.push({ k: "hro3.j.sent", d: TODAY, by: "hro3.who.meera", toText: payload.email });
            return Object.assign({}, o, {
              status: "sent", email: payload.email, monthly: payload.monthly,
              joinOn: isoToArr(payload.join) || o.joinOn, sentOn: TODAY,
              sentByKey: "hro3.who.meera", expiryOn: expArr, letterFile: payload.letter, journey: j,
            });
          }
          if (action === "reply") {
            const when = isoToArr(payload.when) || TODAY;
            const status = payload.said === "talking" ? "talking" : payload.said;
            j.push({ k: "hro3.j.replied", d: when, by: "hro3.who.meera", noteText: payload.note || null });
            j.push({ k: "hro3.j." + status, d: when, by: "hro3.who.meera", noteText: payload.why || null });
            return Object.assign({}, o, {
              status: status, repliedOn: when, replyFrom: payload.from,
              replyFile: payload.file, replyShot: payload.shot,
              replyMismatchNoteText: payload.why || o.replyMismatchNoteText,
              talkingNoteText: status === "talking" ? (payload.note || o.talkingNoteText) : o.talkingNoteText,
              journey: j,
            });
          }
          if (action === "revise") {
            j.push({ k: "hro3.j.revised", d: TODAY, by: "hro3.who.meera", noteText: payload.why });
            return Object.assign({}, o, { monthly: payload.monthly, joinOn: isoToArr(payload.join) || o.joinOn, status: "sent", journey: j });
          }
          if (action === "extend") {
            const base = o.expiryOn && daysUntil(o.expiryOn) > 0 ? toDate(o.expiryOn) : toDate(TODAY);
            const exp = new Date(base.getTime() + payload * 86400000);
            const expArr = [String(exp.getDate()), String(exp.getMonth() + 1).padStart(2, "0"), String(exp.getFullYear())];
            j.push({ k: "hro3.j.extended", d: TODAY, by: "hro3.who.meera" });
            return Object.assign({}, o, { expiryOn: expArr, status: o.status === "expired" ? "sent" : o.status, journey: j });
          }
          if (action === "withdraw") {
            j.push({ k: "hro3.j.withdrawn", d: TODAY, by: "hro3.who.meera", noteText: payload });
            return Object.assign({}, o, { status: "withdrawn", withdrawReasonText: payload, journey: j });
          }
          return o;
        });
      });
      if (action === "send") setFlash(t("hro3.said.sent", { email: payload.email }));
      if (action === "reply") setFlash(t("hro3.said.reply", { status: t("hro3.st." + (payload.said === "talking" ? "talking" : payload.said)) }));
      if (action === "revise") setFlash(t("hro3.said.revised"));
      if (action === "extend") setFlash(t("hro3.said.extended", { n: num(payload) }));
      if (action === "withdraw") setFlash(t("hro3.said.withdrawn"));
    }

    const open = openId ? offers.filter(function (o) { return o.id === openId; })[0] : null;

    /* A DOOR FROM HIRING. "Record an offer" on a candidate opens this
       screen with a draft already standing in their name, so nobody
       types a name, a post and a campus that are already written down
       one module along. */
    useEffect(function () {
      const bridge = window.NaveyaOffers;
      if (!bridge || !bridge.pending) return;
      const p = bridge.pending;
      bridge.pending = null;
      const id = "of-new-" + Date.now();
      setOffers(function (cur) {
        return [{
          id: id, campus: p.campus || campus, name: p.name, post: p.post || "",
          email: p.email || "", phone: p.phone || "", monthly: 0, joinOn: null,
          status: "draft", journey: [{ k: "hro3.j.added", d: TODAY, by: "hro3.who.meera" }],
        }].concat(cur);
      });
      setOpenId(id);
      setFlash(t("hro3.said.fromHiring", { name: p.name }));
      // eslint-disable-next-line
    }, []);

    return (
      <React.Fragment>
        <OffersList campus={campus} offers={offers} flash={flash} onOpen={function (id) { setFlash(null); setOpenId(id); }} />
        {open ? (
          <OfferSheet offer={open} onNavigate={onNavigate} onPatch={patch} onClose={function () { setOpenId(null); }}
            onGet={function (f) { setFlash(t("hro3.said.got", { file: f })); }} />
        ) : null}
      </React.Fragment>
    );
  }

  /* the bridge hiring hands a candidate across, and the panel it draws */
  window.NaveyaOffers = window.NaveyaOffers || { pending: null };
  window.NaveyaOffers.start = function (cand) { window.NaveyaOffers.pending = cand; };
  window.NaveyaOffers.Panel = OffersPanel;
})();
