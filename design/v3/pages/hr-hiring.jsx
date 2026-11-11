/* @jsxRuntime classic */
/* ============================================================
   Naveya — HR Operator · Hiring · window.Pages3.HRHiring

   Rebuilt 2026-10-06 on the designer's ruling. What it used to be:
   Requisitions -> approval -> Job posting -> an inbox of applications
   arriving from a careers site, with eligibility scored and candidates
   advanced through a seven-stage pipeline.

   Almost none of that happens. There is no careers site, nobody
   applies through Naveya, and — the ruling that removes a whole tab —
   an HR Operator needs NOBODY's approval to hire. Every HR is a
   decision maker. A requisition queue modelled a permission that does
   not exist, and a screen that asks for permission nobody needs
   teaches people to wait.

   What hiring actually is at a school this size: somebody decides a
   post is needed, word goes out through heads of department, an
   agency and the staffroom, CVs arrive by WhatsApp and by hand, a
   head of department sits with two or three people, the Principal
   agrees over the phone. Every one of those happens in a room Naveya
   is not in.

   So this module is a RECORD, not a workflow. Two tabs:

     · Openings    — what we are hiring for, and what became of it.
       Current and past, the posts filled against each, and the whole
       dated account of the opening (opened, held, resumed, somebody
       joined, closed and why).
     · Candidates  — where each person has got to on the ladder the
       designer named: shortlisted -> resume checked -> interviewed ->
       selected. Joined is the honest end of it, because that is what
       fills a post; "not taken" and "withdrew" are kept apart,
       because they are different facts about the school.

   Two consequences of being a record rather than a stepper, and both
   are design, not decoration:
     1. A candidate can be ENTERED AT ANY STAGE, ON ANY PAST DATE. The
        interview may have happened on Tuesday and the typing on
        Friday. A form that forced stage one would make people lie to
        it.
     2. NOTHING IS SENT. No candidate is emailed, texted or told
        anything by Naveya, and every dialog says so, because the one
        dangerous belief this screen could create is that pressing
        "Not taken" tells the person.

   Offers live in hr-offers.jsx and joining in hr-lifecycle.jsx — a
   selected candidate hands off to them rather than this file growing
   a second offer surface. One verb, one screen.

   Composed only from window.G3 / window.UI3.
   ============================================================ */
(function () {
  const G3 = window.G3;
  const UI = window.UI3;
  const { useState } = React;
  const {
    useTheme, ThemeToggle, useLang, addStrings,
    Rail, Motif, Card, Register, Button, LinkButton, Chip,
    StatusMark, Icon, ActionMenu, EmptyState, Field, Input, Select,
    Switch, Tabs, TabPanel, Meter, Figure, StackBar, MetricCell, MetricStrip, Avatar, SideScreen, BackBar, FileField, num,
    CampusSwitch, campusLabel, campusOptions, inCampus, CAMPUS_ALL,
  } = UI;

  addStrings({
    en: {
      "hrh.top.scope": "Openings and candidates, one campus at a time",
      "hrh.tabs.aria": "Hiring",
      "hrh.tab.openings": "Openings",
      "hrh.tab.offers": "Offers",
      "hrh.tab.candidates": "Candidates",
      "hrh.title": "Hiring",
      "hrh.col.act": "Actions",
      "hrh.cta.cancel": "Cancel",
      "hrh.whatHappens": "What this does",
      "hrh.back.openings": "Back to openings",
      "hrh.back.candidates": "Back to candidates",

      "hrh.mon.01": "Jan", "hrh.mon.02": "Feb", "hrh.mon.03": "Mar", "hrh.mon.04": "Apr",
      "hrh.mon.05": "May", "hrh.mon.06": "Jun", "hrh.mon.07": "Jul", "hrh.mon.08": "Aug",
      "hrh.mon.09": "Sep", "hrh.mon.10": "Oct", "hrh.mon.11": "Nov", "hrh.mon.12": "Dec",
      "hrh.age.today": "Today",
      "hrh.age.day1": "1 day",
      "hrh.age.days": "{n} days",

      "hrh.who.meera": "Meera Iyer",
      "hrh.who.rajan": "Rajan Pillai",
      "hrh.who.farhan": "Farhan Qureshi",

      "hrh.cat.teaching": "Teaching",
      "hrh.cat.non_teaching": "Non-teaching",
      "hrh.cat.support": "Support",
      "hrh.cat.guest": "Guest",
      "hrh.emp.permanent": "Permanent",
      "hrh.emp.fixed": "Fixed term",
      "hrh.emp.guest": "Guest, by the period",

      "hrh.why.replacement": "Replacing somebody",
      "hrh.why.growth": "A section is growing",
      "hrh.why.newPost": "A new post",
      "hrh.why.cover": "Cover for a long absence",

      "hrh.need.pgPhysics": "M.Sc Physics",
      "hrh.need.bed": "B.Ed",
      "hrh.need.netSet": "NET or SET",
      "hrh.need.ctet": "CTET level 2",
      "hrh.need.ntt": "Nursery teacher training",
      "hrh.need.graduate": "A degree",
      "hrh.need.english": "Fluent English",
      "hrh.need.residential": "Residential-care experience",
      "hrh.need.licence": "Heavy vehicle licence",
      "hrh.need.frenchB2": "French at B2 or better",

      "hrh.state.open": "Open",
      "hrh.state.partly": "Partly filled",
      "hrh.state.filled": "Filled",
      "hrh.state.hold": "On hold",
      "hrh.state.closed": "Closed",

      "hrh.close.filled": "We filled it",
      "hrh.close.notNeeded": "No longer needed",
      "hrh.close.postponed": "Put off to next year",
      "hrh.close.noCandidates": "Nobody suitable came",

      "hrh.tr.opened": "Opened",
      "hrh.tr.edited": "Details changed",
      "hrh.tr.held": "Put on hold",
      "hrh.tr.reopened": "Opened again",
      "hrh.tr.closed": "Closed",
      "hrh.tr.copied": "Copied from an earlier opening",
      "hrh.tr.joined": "{name} joined",
      "hrh.tr.by": "by {who}",
      "hrh.tr.met": "Met {who}",

      "hrh.d.o1.note": "Anjali Deshpande is taking the classes until somebody is found.",
      "hrh.d.o2.note": "Two posts. One is filled; the second is for the new section from April.",
      "hrh.d.o5.note": "The matron has asked for help with the evening shift since June.",

      "hrh.op.reg.title": "Openings",
      "hrh.op.reg.sub": "What this campus is hiring for",
      "hrh.op.reg.foot": "Nothing here is advertised. An opening is where you keep what is happening about a post, not a way of announcing it.",
      "hrh.op.col.title": "The post",
      "hrh.op.col.cat": "Staff type",
      "hrh.op.col.posts": "Filled",
      "hrh.op.col.people": "In the running",
      "hrh.op.col.opened": "Opened",
      "hrh.op.col.state": "Where it stands",
      "hrh.op.openDays": "Open {n} days",
      "hrh.op.show": "Show",
      "hrh.op.show.current": "Open and on hold",
      "hrh.op.show.past": "Filled and closed",
      "hrh.op.show.all": "Everything",
      "hrh.op.k.open": "Open now",
      "hrh.op.k.posts": "Posts still to fill",
      "hrh.op.k.people": "People in the running",
      "hrh.op.k.oldest": "Oldest opening",
      "hrh.op.m.toFill": "Posts to fill",
      "hrh.op.m.toFillNote": "{filled} of {total} already filled",
      "hrh.op.m.open": "Openings going",
      "hrh.op.m.openNote": "of {total} ever opened here",
      "hrh.op.m.people": "People in the running",
      "hrh.op.m.peopleNote": "{n} others already decided",
      "hrh.op.m.age": "Average age",
      "hrh.op.m.days": "days",
      "hrh.op.m.ageNote": "the oldest has run {n} days",
      "hrh.op.m.stale": "Open past 30 days",
      "hrh.op.m.staleNote": "of {n} going",
      "hrh.op.band.toFill": "to fill",
      "hrh.op.band.donutAria": "{left} of {total} posts still to fill",
      "hrh.op.band.leg.left": "still to fill",
      "hrh.op.band.leg.filled": "filled",
      "hrh.op.band.across": "across {n} open postings",
      "hrh.op.band.people": "{n} people in the running against them",
      "hrh.op.band.longest": "Oldest opening",
      "hrh.op.band.slow": "Worth asking what is holding it up",
      "hrh.op.band.none": "Nothing open at this campus.",
      "hrh.op.k.oldestNote": "worth asking what is holding it up",
      "hrh.op.empty.head": "Nothing here yet",
      "hrh.op.empty.body": "Open one when a post is agreed. Everything that happens about it afterwards is kept against it.",
      "hrh.op.menuAria": "Actions on {title}",
      "hrh.op.menu.open": "Open this",
      "hrh.op.menu.add": "Add a candidate",
      "hrh.op.menu.addClosed": "This opening is closed. Open it again first.",
      "hrh.op.menu.edit": "Change the details",
      "hrh.op.menu.hold": "Put it on hold",
      "hrh.op.menu.resume": "Take it off hold",
      "hrh.op.menu.reopen": "Open it again",
      "hrh.op.menu.copy": "Copy it for a new one",
      "hrh.op.menu.close": "Close it",

      "hrh.op.screenSub": "Everything about this post in one place — what it is, who is in the running, and what has happened to it.",
      "hrh.op.card.what": "What this opening is",
      "hrh.op.card.people": "Who is in the running",
      "hrh.op.card.peopleSub": "People somebody has met, in the order they were added",
      "hrh.op.card.history": "What has happened",
      "hrh.op.card.historySub": "Added to, never edited",
      "hrh.op.postsFilled": "{n} of {total} posts filled",
      "hrh.op.stillLive": "{n} still in the running",
      "hrh.op.openFor": "Open {n} days so far",
      "hrh.op.noNeeds": "Nothing written down",
      "hrh.op.onHoldSince": "On hold since {date}",
      "hrh.op.closedOn": "Closed on {date}",
      "hrh.op.noPeople.head": "Nobody added yet",
      "hrh.op.noPeople.body": "When somebody is shortlisted — in a staffroom, over the phone, from a stack of CVs — put them here.",

      "hrh.op.f.title": "What the post is",
      "hrh.op.f.titleHint": "As you would say it to a candidate, not a code.",
      "hrh.op.f.titlePh": "PGT Physics, grades 11–12",
      "hrh.op.f.campus": "Campus",
      "hrh.op.f.dept": "Department",
      "hrh.op.f.deptPick": "Choose a department",
      "hrh.op.f.cat": "Staff type",
      "hrh.op.f.employment": "Employment",
      "hrh.op.f.posts": "How many posts",
      "hrh.op.f.postsHint": "Two posts means two people, and the opening stays open until both are filled.",
      "hrh.op.f.neededBy": "Needed by",
      "hrh.op.f.neededByHint": "When somebody has to be in the classroom.",
      "hrh.op.f.why": "Why we are hiring",
      "hrh.op.f.handler": "Who is handling it",
      "hrh.op.f.handlerHint": "Any HR here can change anything on it — this is who to ask, not who is allowed.",
      "hrh.op.f.needs": "What the person must have",
      "hrh.op.f.needsHint": "Separate them with commas. Nothing here rejects anybody; it is what you tell people when they ask.",
      "hrh.op.f.needsPh": "M.Sc Physics, B.Ed, NET or SET",
      "hrh.op.f.note": "Anything else worth knowing",
      "hrh.op.f.noteHint": "Who is covering meanwhile, what the Principal said, where the CVs are coming from.",

      "hrh.op.new.title": "Open a post",
      "hrh.op.new.sub": "A place to keep what happens about a post you have decided to fill.",
      "hrh.op.new.ctaShort": "Open a post",
      "hrh.op.new.cta": "Open it",
      "hrh.op.new.c1": "The opening is created now, open, with your name on it.",
      "hrh.op.new.c2": "Nothing is advertised and nobody is told. Naveya has no careers page and sends nothing.",
      "hrh.op.new.c3": "You can change every one of these afterwards; the opening keeps what it was before.",

      "hrh.op.edit.title": "Change the details",
      "hrh.op.edit.cta": "Save the changes",
      "hrh.op.edit.c1": "The opening carries the new details from now on.",
      "hrh.op.edit.c2": "The change is on its history, with your name and today's date. Nothing already recorded is rewritten.",

      "hrh.op.hold.title": "Put this opening on hold",
      "hrh.op.hold.why": "Why is it on hold?",
      "hrh.op.hold.whyHint": "Whoever picks this up in three weeks reads this and nothing else.",
      "hrh.op.hold.whyPh": "Waiting on the trust office to confirm the budget",
      "hrh.op.hold.cta": "Put it on hold",
      "hrh.op.hold.c1": "It leaves the open list and sits under “on hold” until somebody takes it off.",
      "hrh.op.hold.c2": "{n} people in the running stay exactly where they are. Nothing moves on its own.",
      "hrh.op.hold.c2none": "Nobody is in the running against it, so nobody is affected.",
      "hrh.op.hold.c3": "Nobody is told. If somebody is waiting on an answer, ring them.",

      "hrh.op.reopen.title": "Open this again",
      "hrh.op.reopen.body": "It was stopped on {date}.",
      "hrh.op.reopen.c1": "It goes back on the open list, with everybody still standing against it.",
      "hrh.op.reopen.cta": "Open it again",
      "hrh.op.reopen.c2": "Both the stopping and the reopening stay on its history.",

      "hrh.op.close.title": "Close this opening",
      "hrh.op.close.reason": "Why are you closing it?",
      "hrh.op.close.reasonPick": "Choose a reason",
      "hrh.op.close.note": "Anything to add",
      "hrh.op.close.noteHint": "In a year's time this is the only explanation anybody has.",
      "hrh.op.close.stillLive": "{n} people are still in the running against it",
      "hrh.op.close.cta": "Close it",
      "hrh.op.close.c1": "It moves to the past list. No new candidate can be added to it.",
      "hrh.op.close.c2": "Closing the post does NOT decide the {n} people standing against it \u2014 each still has to be marked not taken.",
      "hrh.op.close.c3": "It can be opened again, and everything on it comes back with it.",

      "hrh.op.copy.title": "Copy this opening",
      "hrh.op.copy.body": "The same post comes round every year. This makes a fresh one with the same details, opened today.",
      "hrh.op.copy.c1": "A new opening is created and opened — the details copied, the history and the candidates not.",
      "hrh.op.copy.cta": "Make the copy",
      "hrh.op.copy.c2": "This opening is left exactly as it is.",

      "hrh.stage.shortlisted": "Shortlisted",
      "hrh.stage.resume": "Resume checked",
      "hrh.stage.interview": "Interviewed",
      "hrh.stage.selected": "Selected",
      "hrh.stage.joined": "Joined",
      "hrh.stage.notTaken": "Not selected",
      "hrh.stage.withdrew": "Withdrew",

      "hrh.src.walkIn": "Walked in",
      "hrh.src.referral": "Referred by staff",
      "hrh.src.consultant": "Through an agency",
      "hrh.src.paper": "Newspaper",
      "hrh.src.portal": "Job portal",
      "hrh.src.knownToStaff": "Known to somebody here",

      "hrh.notice.immediate": "Can start at once",
      "hrh.notice.30": "30 days' notice",
      "hrh.notice.60": "60 days' notice",
      "hrh.notice.90": "90 days' notice",

      "hrh.end.betterFit": "Somebody else suited the post better",
      "hrh.end.notQualified": "Does not have what the post needs",
      "hrh.end.didNotAttend": "Did not come to the interview",
      "hrh.end.payGap": "We could not meet what they asked for",
      "hrh.end.noLonger": "The post is no longer being filled",
      "hrh.end.tookOther": "Took a post elsewhere",
      "hrh.end.personal": "Personal reasons",
      "hrh.end.distance": "Too far to travel",

      "hrh.ca.reg.title": "Candidates",
      "hrh.ca.m.running": "In the running",
      "hrh.ca.m.runningNote": "Still being considered",
      "hrh.ca.m.deep": "Past the interview",
      "hrh.ca.m.deepNote": "Interviewed, or further along",
      "hrh.ca.m.wait": "Average wait",
      "hrh.ca.m.waitNote": "The oldest has waited {n} days",
      "hrh.ca.m.slow": "Waiting too long",
      "hrh.ca.m.slowNote": "Nothing recorded for {n} days or more",
      "hrh.ca.m.hired": "Hired",
      "hrh.ca.m.hiredNote": "They have joined the school",
      "hrh.ca.band.inPlay": "in the running",
      "hrh.ca.band.donutAria": "{n} people in the running, by stage",
      "hrh.ca.band.waiting": "Oldest wait",
      "hrh.ca.band.waitingSub": "Nothing recorded since {stage}",
      "hrh.ca.band.none": "Nobody in the running at this campus.",
      "hrh.ca.band.hint": "Choose a stage to see only those people.",
      "hrh.ca.reg.sub": "Where each person has got to",
      "hrh.ca.reg.foot": "Every line here was decided in a room. This is where you write down what was decided — Naveya tells nobody anything.",
      "hrh.ca.col.who": "Candidate",
      "hrh.ca.col.opening": "For",
      "hrh.ca.col.stage": "Where they are",
      "hrh.ca.col.since": "Since",
      "hrh.ca.col.added": "Added",
      "hrh.ca.stageNow": "Where they stand now",
      "hrh.ca.stageOn": "On",
      "hrh.ca.record": "Save",
      "hrh.ca.openOne": "Open",
      "hrh.ca.backToOpening": "Back to {title}",
      "hrh.ca.editShort": "Edit",
      "hrh.ca.forOpening": "For",
      "hrh.ca.moveShort": "Move",
      "hrh.ca.offerWhen": "Record an offer once the interview is done.",
      "hrh.ca.col.handler": "Who is handling",
      "hrh.ca.allStages": "Any stage",
      "hrh.ca.allOpenings": "Every opening",
      "hrh.ca.showGoneShort": "Show everybody",
      "hrh.ca.showGone": "Include people no longer in the running",
      "hrh.ca.waiting": "Waiting on you",
      "hrh.ca.openingClosed": "This opening is closed",
      "hrh.ca.menuAria": "Actions on {name}",
      "hrh.ca.cv.get": "Resume",
      "hrh.ca.cv.none": "No resume on file",
      "hrh.said.cvGot": "{file} — downloading.",
      "hrh.ca.decide": "What happens next",
      "hrh.ca.menu.offer": "Record an offer",
      "hrh.said.offerGo": "Record the offer in Offers — the letter you e-mailed, and their reply when it comes.",
      "hrh.ca.menu.open": "Open their record",
      "hrh.ca.menu.step": "Record what happened",
      "hrh.ca.menu.edit": "Change their details",
      "hrh.ca.menu.move": "Move to another opening",
      "hrh.ca.menu.notTaken": "Not taken",
      "hrh.ca.menu.withdrew": "They withdrew",
      "hrh.ca.empty.head": "Nobody here yet",
      "hrh.ca.empty.body": "Add somebody the moment they are shortlisted, even if all you have is a name and a number.",

      "hrh.ca.screenSub": "What has happened with this person, in the order it happened. Nothing on this screen contacts them.",
      "hrh.ca.card.where": "Where they are",
      "hrh.ca.card.them": "About them",
      "hrh.ca.card.themSub": "What you were given, and what is still missing",
      "hrh.ca.card.history": "What has happened",
      "hrh.ca.card.historySub": "Added to, never edited",
      "hrh.ca.card.historyFoot": "Each line is the date the thing happened, not the day it was typed in.",
      "hrh.ca.since": "Since {date} · {n}",
      "hrh.ca.slow": "Nothing recorded for {n} days",
      "hrh.ca.none": "Not given",
      "hrh.ca.noEmail": "No email — reach them on the phone",
      "hrh.ca.noCv": "No resume on file",
      "hrh.ca.noCvNote": "Perfectly normal for a walk-in. Add it from “Change their details” when it arrives.",
      "hrh.ca.openClosed.head": "The opening they were for is closed",
      "hrh.ca.openClosed.body": "They are still standing here. Mark them not taken, or move them to an opening that is still going.",
      "hrh.ca.selected.head": "Selected is a decision, not an offer",
      "hrh.ca.selected.body": "The post is not filled until they accept and join. The offer is written, sent and tracked in Offers.",
      "hrh.ca.selected.cta": "Go to Offers",
      "hrh.ca.joined.head": "On the register as {code}",
      "hrh.ca.joined.body": "They are an employee now. Everything about them lives on the staff record from here, not on this screen.",
      "hrh.ca.joined.cta": "Open the staff register",

      "hrh.ca.f.find": "Find",
      "hrh.ca.f.findPh": "A name, an opening, a qualification",
      "hrh.ca.f.opening": "Which opening",
      "hrh.ca.f.openingHint": "Only openings that are still going are listed.",
      "hrh.ca.f.openingPick": "Choose an opening",
      "hrh.ca.f.name": "Their name",
      "hrh.ca.f.phone": "Phone",
      "hrh.ca.f.phoneHint": "Usually the only way anybody reaches them.",
      "hrh.ca.f.email": "Email",
      "hrh.ca.f.source": "Where they came from",
      "hrh.ca.f.handler": "Who is handling them",
      "hrh.ca.f.qual": "What they have",
      "hrh.ca.f.qualHint": "In your own words — degrees, certificates, years taught.",
      "hrh.ca.f.notice": "How soon they can start",
      "hrh.ca.f.noticeUnknown": "Not asked yet",
      "hrh.ca.f.stage": "Where they are now",
      "hrh.ca.f.stageHint": "Start wherever they actually are. Somebody interviewed last week does not go in as newly shortlisted.",
      "hrh.ca.f.when": "When that happened",
      "hrh.ca.f.whenHint": "The day it happened, not today.",
      "hrh.ca.f.whenFuture": "That date has not happened yet.",
      "hrh.ca.f.note": "What happened",
      "hrh.ca.f.noteHint": "Who sent them, how it went, what was said.",
      "hrh.ca.f.cv": "Their resume",
      "hrh.ca.f.cvHint": "If you have it. Plenty of good candidates arrive without one.",
      "hrh.ca.f.stageNow": "Stage",
      "hrh.ca.f.endReason": "Reason",

      "hrh.ca.new.title": "Add a candidate",
      "hrh.ca.new.sub": "Somebody shortlisted off this screen — in a staffroom, over the phone, from a stack of CVs.",
      "hrh.ca.new.ctaShort": "Add a candidate",
      "hrh.ca.new.cta": "Add them",
      "hrh.ca.new.c1": "They appear against that opening, at the stage and on the date you gave.",
      "hrh.ca.new.c2": "Nothing is sent to them. Naveya does not email, text or call a candidate, ever.",
      "hrh.ca.new.c3": "Everything after this is recorded the same way: you do it, then you write it down here.",

      "hrh.ca.edit.title": "Change their details",
      "hrh.ca.edit.cta": "Save the changes",
      "hrh.ca.edit.c1": "Their details change from now on. The account of what happened is untouched.",
      "hrh.ca.edit.c2": "Nothing is sent to them.",

      "hrh.ca.step.title": "Record what happened",
      "hrh.ca.step.sub": "{name}",
      "hrh.ca.step.stage": "What stage they reached",
      "hrh.ca.step.stageHint": "Where they are AFTER what you are writing down.",
      "hrh.ca.step.backwards": "This moves them back a stage",
      "hrh.ca.step.backwardsNote": "That is allowed — a second interview, a resume looked at again. Both lines stay on their record.",
      "hrh.ca.step.when": "When",
      "hrh.ca.step.whenHint": "The day it happened. Backdate it freely.",
      "hrh.ca.step.met": "Who saw them",
      "hrh.ca.step.metHint": "The head of department, the Principal, whoever was in the room.",
      "hrh.ca.step.metPh": "Anjali Deshpande and the Principal",
      "hrh.ca.step.note": "How it went",
      "hrh.ca.step.noteHint": "The one thing somebody reading this in a month needs to know.",
      "hrh.ca.step.cta": "Record it",
      "hrh.ca.step.c1": "It goes on their record as of {date}, with your name.",
      "hrh.ca.step.c2": "Nothing is sent to them. Tell them yourself.",
      "hrh.ca.step.cSelected": "Selected does not fill the post. The offer is made in Offers, and the post is filled when they join.",
      "hrh.ca.step.cJoined": "Joined counts against the opening's posts. HR still creates the staff record in the staff register.",

      "hrh.ca.end.reasonPick": "Choose a reason",
      "hrh.ca.end.note": "Anything to add",
      "hrh.ca.end.noteHint": "Whether you told them, and what you said.",
      "hrh.ca.end.c2": "They leave the running and stop showing in the list, unless you ask to see everybody.",
      "hrh.ca.end.c3": "Nothing is sent to them. If they are owed an answer, give it yourself.",
      "hrh.ca.end.notTaken.title": "Mark them not taken",
      "hrh.ca.end.notTaken.reason": "Why were they not taken?",
      "hrh.ca.end.notTaken.cta": "Mark not taken",
      "hrh.ca.end.notTaken.c1": "Their record keeps everything, with the reason and your name against it.",
      "hrh.ca.end.withdrew.title": "They withdrew",
      "hrh.ca.end.withdrew.reason": "Why did they withdraw?",
      "hrh.ca.end.withdrew.cta": "Record it",
      "hrh.ca.end.withdrew.c1": "Kept apart from not taken on purpose \u2014 losing three people to better pay is a different problem from turning three away.",

      "hrh.ca.move.title": "Move them to another opening",
      "hrh.ca.move.to": "Which opening",
      "hrh.ca.move.toHint": "A good candidate for the wrong post is still a good candidate.",
      "hrh.ca.move.pick": "Choose an opening",
      "hrh.ca.move.cta": "Move them",
      "hrh.ca.move.c1": "They stand against the new opening from now on, at the stage they are already at.",
      "hrh.ca.move.c2": "Everything that has happened travels with them — nothing is lost and nothing starts again.",
      "hrh.ca.move.c3": "Nothing is sent to them.",
      "hrh.ca.move.trailNote": "Moved to a different opening.",

      "hrh.said.openingMade": "{title} is open. Add candidates to it as you meet them.",
      "hrh.said.openingEdited": "The details are changed, and the change is on its history.",
      "hrh.said.openingHeld": "On hold. Nobody standing against it was moved or told.",
      "hrh.said.openingReopened": "Open again, with everybody still standing against it.",
      "hrh.said.openingClosed": "Closed. Anybody still in the running against it still needs an answer from you.",
      "hrh.said.openingCopied": "A fresh opening made from {title}, opened today.",
      "hrh.said.candAdded": "{name} added at {stage}. Nothing was sent to them.",
      "hrh.said.candEdited": "Their details are changed. What happened is untouched.",
      "hrh.said.stepRecorded": "Recorded — {stage}, {date}.",
      "hrh.said.notTaken": "Marked not taken. Tell them yourself; Naveya has not.",
      "hrh.said.withdrew": "Recorded as withdrawn.",
      "hrh.said.candMoved": "Moved to {title}, with everything that had happened.",
    },
  });

  /* ============================================================
     SEED

     Two objects, because the module now has exactly two: an OPENING
     (a post the school is hiring for) and a CANDIDATE (a person
     somebody met). Everything else the old module modelled —
     requisitions, approvals, published adverts, an inbox of
     applications — described work that does not happen in Naveya.
     ============================================================ */
  const TODAY = ["11", "08", "2026"];

  const DEPARTMENTS = ["Science", "Mathematics", "Primary", "Pre-primary", "Languages", "Administration", "Transport", "Hostel", "Arts", "Sports"];
  const HANDLERS = ["hrh.who.meera", "hrh.who.rajan", "hrh.who.farhan"];

  /* An opening's state is DERIVED wherever it can be: "partly filled"
     is a count of joiners against posts, not a field somebody sets and
     forgets. Only the two states a person decides — on hold, closed —
     are stored. */
  const OPENINGS_SEED = [
    {
      id: "o1", title: "PGT Physics, grades 11–12", campus: "indiranagar", dept: "Science", cat: "teaching",
      posts: 1, employment: "permanent", openedOn: ["28", "07", "2026"], neededBy: ["1", "04", "2027"],
      whyKey: "hrh.why.replacement", handlerKey: "hrh.who.meera", state: "open",
      needsKeys: ["hrh.need.pgPhysics", "hrh.need.bed", "hrh.need.netSet"],
      noteKey: "hrh.d.o1.note",
      trail: [{ k: "hrh.tr.opened", who: "hrh.who.meera", d: ["28", "07", "2026"] }],
    },
    {
      id: "o2", title: "TGT Mathematics, grades 6–8", campus: "indiranagar", dept: "Mathematics", cat: "teaching",
      posts: 2, employment: "permanent", openedOn: ["20", "07", "2026"], neededBy: ["1", "04", "2027"],
      whyKey: "hrh.why.growth", handlerKey: "hrh.who.meera", state: "open",
      needsKeys: ["hrh.need.bed", "hrh.need.ctet"],
      noteKey: "hrh.d.o2.note",
      trail: [
        { k: "hrh.tr.opened", who: "hrh.who.meera", d: ["20", "07", "2026"] },
        { k: "hrh.tr.joined", who: "hrh.who.meera", d: ["4", "08", "2026"], nameText: "Kabir Sanghvi" },
      ],
    },
    {
      id: "o3", title: "Pre-primary teacher", campus: "whitefield", dept: "Pre-primary", cat: "teaching",
      posts: 1, employment: "permanent", openedOn: ["8", "08", "2026"], neededBy: ["1", "04", "2027"],
      whyKey: "hrh.why.replacement", handlerKey: "hrh.who.farhan", state: "open",
      needsKeys: ["hrh.need.ntt"],
      trail: [{ k: "hrh.tr.opened", who: "hrh.who.farhan", d: ["8", "08", "2026"] }],
    },
    {
      id: "o4", title: "Front office executive", campus: "indiranagar", dept: "Administration", cat: "non_teaching",
      posts: 1, employment: "fixed", openedOn: ["9", "08", "2026"], neededBy: ["1", "10", "2026"],
      whyKey: "hrh.why.replacement", handlerKey: "hrh.who.rajan", state: "hold",
      holdOn: ["10", "08", "2026"], holdReasonText: "The trust office wants the front desk looked at again before we hire.",
      needsKeys: ["hrh.need.graduate", "hrh.need.english"],
      trail: [
        { k: "hrh.tr.opened", who: "hrh.who.rajan", d: ["9", "08", "2026"] },
        { k: "hrh.tr.held", who: "hrh.who.rajan", d: ["10", "08", "2026"] },
      ],
    },
    {
      id: "o5", title: "Hostel warden (assistant)", campus: "indiranagar", dept: "Hostel", cat: "support",
      posts: 1, employment: "permanent", openedOn: ["10", "07", "2026"], neededBy: ["1", "09", "2026"],
      whyKey: "hrh.why.newPost", handlerKey: "hrh.who.meera", state: "open",
      needsKeys: ["hrh.need.graduate", "hrh.need.residential"],
      noteKey: "hrh.d.o5.note",
      trail: [{ k: "hrh.tr.opened", who: "hrh.who.meera", d: ["10", "07", "2026"] }],
    },
    {
      id: "o6", title: "Bus driver, route 7", campus: "whitefield", dept: "Transport", cat: "support",
      posts: 1, employment: "permanent", openedOn: ["30", "07", "2026"], neededBy: ["1", "09", "2026"],
      whyKey: "hrh.why.replacement", handlerKey: "hrh.who.farhan", state: "closed",
      closedOn: ["6", "08", "2026"], closeReasonKey: "hrh.close.notNeeded",
      closeNoteText: "Route 7 was merged into route 4, so the seat went with it.",
      needsKeys: ["hrh.need.licence"],
      trail: [
        { k: "hrh.tr.opened", who: "hrh.who.farhan", d: ["30", "07", "2026"] },
        { k: "hrh.tr.closed", who: "hrh.who.farhan", d: ["6", "08", "2026"] },
      ],
    },
    {
      id: "o7", title: "Guest faculty, French", campus: "indiranagar", dept: "Languages", cat: "guest",
      posts: 1, employment: "guest", openedOn: ["1", "07", "2026"], neededBy: ["1", "07", "2026"],
      whyKey: "hrh.why.newPost", handlerKey: "hrh.who.meera", state: "closed",
      closedOn: ["1", "08", "2026"], closeReasonKey: "hrh.close.filled",
      needsKeys: ["hrh.need.frenchB2"],
      trail: [
        { k: "hrh.tr.opened", who: "hrh.who.meera", d: ["1", "07", "2026"] },
        { k: "hrh.tr.joined", who: "hrh.who.meera", d: ["28", "07", "2026"], nameText: "Camille Dubois" },
        { k: "hrh.tr.closed", who: "hrh.who.meera", d: ["1", "08", "2026"] },
      ],
    },
  ];

  /* The ladder the designer named: shortlisted → resume checked →
     interviewed → selected. Joined is the honest end of it (it is what
     fills a post), and the two ways somebody leaves the ladder are
     kept apart, because "we did not take them" and "they went
     elsewhere" are different facts about the school. */
  const LADDER = ["shortlisted", "resume", "interview", "selected", "joined"];
  const OFF_LADDER = ["notTaken", "withdrew"];
  /* a progression through five distinct hues, ending on green where
     the good outcome is — "late", "holiday" and "ltComp" are all the
     same amber in the palette, so using three of them in one bar gave
     three segments nobody could tell apart */
  const STAGE_LOOK = {
    shortlisted: { role: "off", fill: "chartSand", glyph: "staff" },
    resume: { role: "ltEL", fill: "chartBlue", glyph: "document" },
    interview: { role: "late", fill: "chartAmber", glyph: "clock" },
    selected: { role: "ltSick", fill: "chartTeal", glyph: "check" },
    joined: { role: "present", fill: "chartGreen", glyph: "briefcase" },
    notTaken: { role: "absent", fill: "chartRed", glyph: "signout" },
    withdrew: { role: "penalty", fill: "chartPurple", glyph: "arrow" },
  };
  const SOURCES = ["walkIn", "referral", "consultant", "paper", "portal", "knownToStaff"];
  const SLOW_DAYS = 14;

  const CANDIDATES_SEED = [
    {
      id: "c1", name: "Devika Pillai", openingId: "o1", phone: "+91 98XXX X4482", email: "d.pillai@example.com",
      source: "referral", handlerKey: "hrh.who.meera", stage: "interview", stageOn: ["4", "08", "2026"],
      qual: "M.Sc Physics · B.Ed · 4 years as a PGT", noticeKey: "hrh.notice.30", resume: "devika-pillai-cv.pdf",
      trail: [
        { stage: "shortlisted", d: ["22", "07", "2026"], by: "hrh.who.meera", noteText: "Came through Anjali Deshpande. Taught at Sacred Heart for four years." },
        { stage: "resume", d: ["25", "07", "2026"], by: "hrh.who.meera", noteText: "Degrees and B.Ed seen in original. NET 2019." },
        { stage: "interview", d: ["4", "08", "2026"], by: "hrh.who.meera", metText: "Anjali Deshpande and the Principal", noteText: "Demonstration lesson on optics, class 11. Strong. Principal wants a second sitting before we decide." },
      ],
    },
    {
      id: "c2", name: "Aarav Chatterjee", openingId: "o1", phone: "+91 97XXX X1120", email: "aarav.c@example.com",
      source: "consultant", handlerKey: "hrh.who.meera", stage: "resume", stageOn: ["30", "07", "2026"],
      qual: "M.Sc Physics · B.Ed · SET 2021", noticeKey: "hrh.notice.60", resume: "aarav-chatterjee-cv.pdf",
      trail: [
        { stage: "shortlisted", d: ["28", "07", "2026"], by: "hrh.who.meera", noteText: "Sent by Vidya Placements." },
        { stage: "resume", d: ["30", "07", "2026"], by: "hrh.who.meera", noteText: "Papers in order. Waiting on him to confirm a date for the demonstration lesson." },
      ],
    },
    {
      id: "c3", name: "Meher Kaul", openingId: "o1", phone: "+91 99XXX X7731", email: null,
      source: "walkIn", handlerKey: "hrh.who.meera", stage: "shortlisted", stageOn: ["9", "08", "2026"],
      qual: "M.Sc Physics · B.Ed · NET 2023", noticeKey: "hrh.notice.immediate", resume: null,
      trail: [
        { stage: "shortlisted", d: ["9", "08", "2026"], by: "hrh.who.meera", noteText: "Walked in on Saturday. Left her number; the CV is still to come." },
      ],
    },
    {
      id: "c4", name: "Simran Dutta", openingId: "o1", phone: "+91 90XXX X2250", email: "simran.d@example.com",
      source: "portal", handlerKey: "hrh.who.meera", stage: "notTaken", stageOn: ["5", "08", "2026"],
      qual: "M.Sc Physics · B.Ed", noticeKey: "hrh.notice.30", resume: "simran-dutta-cv.pdf",
      endReasonKey: "hrh.end.betterFit",
      trail: [
        { stage: "shortlisted", d: ["30", "07", "2026"], by: "hrh.who.meera" },
        { stage: "resume", d: ["2", "08", "2026"], by: "hrh.who.meera", noteText: "Teaching certificate lapsed in 2016 and has not been renewed." },
        { stage: "notTaken", d: ["5", "08", "2026"], by: "hrh.who.meera", noteText: "Told on the phone the same evening." },
      ],
    },
    {
      id: "c5", name: "Kabir Sanghvi", openingId: "o2", phone: "+91 98XXX X9014", email: "kabir.s@example.com",
      source: "referral", handlerKey: "hrh.who.meera", stage: "joined", stageOn: ["4", "08", "2026"],
      qual: "B.Ed · CTET level 2, 2025", noticeKey: "hrh.notice.immediate", resume: "kabir-sanghvi-cv.pdf",
      staffCode: "NAV-0266",
      trail: [
        { stage: "shortlisted", d: ["12", "07", "2026"], by: "hrh.who.meera" },
        { stage: "resume", d: ["15", "07", "2026"], by: "hrh.who.meera" },
        { stage: "interview", d: ["21", "07", "2026"], by: "hrh.who.meera", metText: "Head of Mathematics" },
        { stage: "selected", d: ["24", "07", "2026"], by: "hrh.who.meera", noteText: "Offer made the same week." },
        { stage: "joined", d: ["4", "08", "2026"], by: "hrh.who.meera", noteText: "On the register as NAV-0266." },
      ],
    },
    {
      id: "c6", name: "Ayesha Merchant", openingId: "o2", phone: "+91 96XXX X3318", email: "ayesha.m@example.com",
      source: "paper", handlerKey: "hrh.who.meera", stage: "selected", stageOn: ["8", "08", "2026"],
      qual: "B.Ed · CTET level 2, 2024", noticeKey: "hrh.notice.60", resume: "ayesha-merchant-cv.pdf",
      trail: [
        { stage: "shortlisted", d: ["25", "07", "2026"], by: "hrh.who.meera" },
        { stage: "resume", d: ["28", "07", "2026"], by: "hrh.who.meera" },
        { stage: "interview", d: ["3", "08", "2026"], by: "hrh.who.meera", metText: "Head of Mathematics and the Principal" },
        { stage: "selected", d: ["8", "08", "2026"], by: "hrh.who.meera", noteText: "Decided on Saturday. She has asked for a week to answer." },
      ],
    },
    {
      id: "c7", name: "Tanvi Oberoi", openingId: "o2", phone: "+91 93XXX X8806", email: null,
      source: "walkIn", handlerKey: "hrh.who.meera", stage: "withdrew", stageOn: ["7", "08", "2026"],
      qual: "B.Ed, 2025", noticeKey: null, resume: null, endReasonKey: "hrh.end.tookOther",
      trail: [
        { stage: "shortlisted", d: ["31", "07", "2026"], by: "hrh.who.meera" },
        { stage: "withdrew", d: ["7", "08", "2026"], by: "hrh.who.meera", noteText: "Took a post at Greenwood. Said to call her next April." },
      ],
    },
    {
      id: "c8", name: "Farida Ansari", openingId: "o5", phone: "+91 91XXX X4409", email: null,
      source: "knownToStaff", handlerKey: "hrh.who.meera", stage: "interview", stageOn: ["24", "07", "2026"],
      qual: "Higher secondary · five years in a girls' hostel", noticeKey: "hrh.notice.immediate", resume: null,
      trail: [
        { stage: "shortlisted", d: ["18", "07", "2026"], by: "hrh.who.meera", noteText: "Known to the matron. No formal qualification, long experience." },
        { stage: "interview", d: ["24", "07", "2026"], by: "hrh.who.meera", metText: "The matron and the Principal", noteText: "Good with the girls. The Principal wants to think about the qualification." },
      ],
    },
    {
      id: "c9", name: "Suresh Bhat", openingId: "o5", phone: "+91 94XXX X6652", email: "s.bhat@example.com",
      source: "portal", handlerKey: "hrh.who.meera", stage: "shortlisted", stageOn: ["10", "08", "2026"],
      qual: "B.Com · three years in residential care", noticeKey: "hrh.notice.30", resume: "suresh-bhat-cv.pdf",
      trail: [{ stage: "shortlisted", d: ["10", "08", "2026"], by: "hrh.who.meera" }],
    },
    {
      id: "c10", name: "Nandita Rao", openingId: "o3", phone: "+91 95XXX X2284", email: "nandita.rao@example.com",
      source: "referral", handlerKey: "hrh.who.farhan", stage: "resume", stageOn: ["10", "08", "2026"],
      qual: "NTT · two years pre-primary", noticeKey: "hrh.notice.immediate", resume: "nandita-rao-cv.pdf",
      trail: [
        { stage: "shortlisted", d: ["9", "08", "2026"], by: "hrh.who.farhan" },
        { stage: "resume", d: ["10", "08", "2026"], by: "hrh.who.farhan" },
      ],
    },
    {
      id: "c11", name: "Rohit Nambiar", openingId: "o6", phone: "+91 97XXX X5540", email: null,
      source: "walkIn", handlerKey: "hrh.who.farhan", stage: "shortlisted", stageOn: ["2", "08", "2026"],
      qual: "Heavy licence · nine years", noticeKey: "hrh.notice.immediate", resume: null,
      trail: [{ stage: "shortlisted", d: ["2", "08", "2026"], by: "hrh.who.farhan" }],
    },
  ];

  /* ============================================================
     HELPERS AND LOCAL PRIMITIVES
     ============================================================ */
  function dmy(t, d) { return d ? d[0] + " " + t("hrh.mon." + d[1]) + " " + d[2] : null; }
  function toDate(d) { return new Date(parseInt(d[2], 10), parseInt(d[1], 10) - 1, parseInt(d[0], 10)); }
  function daysSince(d) { return Math.round((toDate(TODAY) - toDate(d)) / 86400000); }
  function ageWord(t, n) { return n <= 0 ? t("hrh.age.today") : n === 1 ? t("hrh.age.day1") : t("hrh.age.days", { n: num(n) }); }
  function isoToArr(s) { const p = String(s).split("-"); return p.length === 3 ? [String(Number(p[2])), p[1], p[0]] : null; }
  function arrToIso(d) { return d ? d[2] + "-" + d[1] + "-" + (d[0].length === 1 ? "0" + d[0] : d[0]) : ""; }

  function openingOf(id, list) { return list.filter(function (o) { return o.id === id; })[0] || null; }
  function joinedCount(openingId, cands) { return cands.filter(function (c2) { return c2.openingId === openingId && c2.stage === "joined"; }).length; }
  function liveCount(openingId, cands) {
    return cands.filter(function (c2) { return c2.openingId === openingId && LADDER.indexOf(c2.stage) >= 0 && c2.stage !== "joined"; }).length;
  }
  /* open · partly · filled are COUNTED; hold and closed are decided */
  function openingState(o, cands) {
    if (o.state === "closed") return "closed";
    if (o.state === "hold") return "hold";
    const j = joinedCount(o.id, cands);
    if (j >= o.posts) return "filled";
    if (j > 0) return "partly";
    return "open";
  }
  const OPEN_LOOK = {
    open: { role: "ltEL", fill: "chartBlue", glyph: "check" },
    partly: { role: "ltSick", fill: "chartTeal", glyph: "half" },
    filled: { role: "present", fill: "chartGreen", glyph: "briefcase" },
    hold: { role: "late", fill: "chartAmber", glyph: "clock" },
    closed: { role: "off", fill: "chartSand", glyph: "signout" },
  };

  /* PROMOTION CANDIDATE · Pop + PopFoot + Consequence — the third
     independent copy (groupadmin.jsx, ga-systems.jsx, here). A modal
     opened FROM a side screen is a centred pop-up, never a second
     side screen sliding over the first. */
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
        <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 7 })}>{t("hrh.whatHappens")}</div>
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
        <Button kind="ghost" onClick={onCancel}>{t("hrh.cta.cancel")}</Button>
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
          <span style={{ color: c.ink, fontWeight: 700 }}>{t("nav.hrHiring")}</span>
          <span style={{ margin: "0 8px", color: c.inkFaint }}>·</span>
          <span>{t("hrh.top.scope")}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {fixed ? <Chip>{campusLabel(t, campus)}</Chip> : <CampusSwitch value={campus} onChange={onCampus} />}
          <ThemeToggle />
        </div>
      </div>
    );
  }



  /* the dated, attributed, append-only account of a thing */
  function Trail({ items, renderHead, bare }) {
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
                {renderHead(it)}
                <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 3 })}>
                  {dmy(t, it.d)}{it.by ? " · " + t("hrh.tr.by", { who: t(it.by) }) : ""}
                </span>
                {/* BARE: a history is what happened, when, and whose
                    hand it was — the sentences somebody typed at the
                    time belong to the record, not to a list that is
                    read at a glance. */}
                {!bare && it.metText ? <span style={ty("caption", { display: "block", color: c.inkMuted, marginTop: 2 })}>{t("hrh.tr.met", { who: it.metText })}</span> : null}
                {!bare && it.noteText ? <span style={ty("small", { display: "block", color: c.ink, marginTop: 5 })}>{it.noteText}</span> : null}
              </span>
            </li>
          );
        })}
      </ol>
    );
  }

  /* ============================================================
     TAB 1 · OPENINGS — what we are hiring for, and what became of it
     ============================================================ */

  function OpeningFields({ v, setV, idBase }) {
    const { t } = useLang();
    function set(k, x) { setV(Object.assign({}, v, { [k]: x })); }
    return (
      <React.Fragment>
        <Field id={idBase + "-title"} label={t("hrh.op.f.title")} hint={t("hrh.op.f.titleHint")}>
          <Input id={idBase + "-title"} value={v.title} onChange={function (x) { set("title", x); }} placeholder={t("hrh.op.f.titlePh")} />
        </Field>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 200px" }}>
            <Field id={idBase + "-campus"} label={t("hrh.op.f.campus")}>
              <Select id={idBase + "-campus"} value={v.campus} onChange={function (x) { set("campus", x); }}
                options={campusOptions(t, { both: false })} />
            </Field>
          </div>
          <div style={{ flex: "1 1 200px" }}>
            <Field id={idBase + "-dept"} label={t("hrh.op.f.dept")}>
              <Select id={idBase + "-dept"} value={v.dept} onChange={function (x) { set("dept", x); }}
                options={[{ value: "", label: t("hrh.op.f.deptPick") }].concat(DEPARTMENTS.map(function (d) { return { value: d, label: d }; }))} />
            </Field>
          </div>
        </div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 200px" }}>
            <Field id={idBase + "-cat"} label={t("hrh.op.f.cat")}>
              <Select id={idBase + "-cat"} value={v.cat} onChange={function (x) { set("cat", x); }}
                options={["teaching", "non_teaching", "support", "guest"].map(function (k) { return { value: k, label: t("hrh.cat." + k) }; })} />
            </Field>
          </div>
          <div style={{ flex: "1 1 200px" }}>
            <Field id={idBase + "-emp"} label={t("hrh.op.f.employment")}>
              <Select id={idBase + "-emp"} value={v.employment} onChange={function (x) { set("employment", x); }}
                options={["permanent", "fixed", "guest"].map(function (k) { return { value: k, label: t("hrh.emp." + k) }; })} />
            </Field>
          </div>
        </div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 160px" }}>
            <Field id={idBase + "-posts"} label={t("hrh.op.f.posts")} hint={t("hrh.op.f.postsHint")}>
              <Input id={idBase + "-posts"} inputMode="numeric" value={v.posts} onChange={function (x) { set("posts", x.replace(/[^0-9]/g, "")); }} />
            </Field>
          </div>
          <div style={{ flex: "1 1 200px" }}>
            <Field id={idBase + "-needed"} label={t("hrh.op.f.neededBy")} hint={t("hrh.op.f.neededByHint")}>
              <Input id={idBase + "-needed"} type="date" value={v.neededBy} onChange={function (x) { set("neededBy", x); }} />
            </Field>
          </div>
        </div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 220px" }}>
            <Field id={idBase + "-why"} label={t("hrh.op.f.why")}>
              <Select id={idBase + "-why"} value={v.why} onChange={function (x) { set("why", x); }}
                options={["replacement", "growth", "newPost", "cover"].map(function (k) { return { value: "hrh.why." + k, label: t("hrh.why." + k) }; })} />
            </Field>
          </div>
          <div style={{ flex: "1 1 220px" }}>
            <Field id={idBase + "-handler"} label={t("hrh.op.f.handler")} hint={t("hrh.op.f.handlerHint")}>
              <Select id={idBase + "-handler"} value={v.handler} onChange={function (x) { set("handler", x); }}
                options={HANDLERS.map(function (k) { return { value: k, label: t(k) }; })} />
            </Field>
          </div>
        </div>
        <Field id={idBase + "-needs"} label={t("hrh.op.f.needs")} hint={t("hrh.op.f.needsHint")}>
          <Input id={idBase + "-needs"} value={v.needs} onChange={function (x) { set("needs", x); }} placeholder={t("hrh.op.f.needsPh")} />
        </Field>
        <Field id={idBase + "-note"} label={t("hrh.op.f.note")} hint={t("hrh.op.f.noteHint")}>
          <Input id={idBase + "-note"} value={v.note} onChange={function (x) { set("note", x); }} />
        </Field>
      </React.Fragment>
    );
  }

  function blankOpening(campus) {
    return { title: "", campus: campus, dept: "", cat: "teaching", employment: "permanent", posts: "1", neededBy: "", why: "hrh.why.replacement", handler: "hrh.who.meera", needs: "", note: "" };
  }

  /* CREATING ONE. A side screen, because it is an "ask for something"
     form — and the consequence says the thing this module exists to
     say: nothing leaves the building. */
  function CreateOpeningScreen({ campus, onClose, onCreate }) {
    const { t } = useLang();
    const [v, setV] = useState(blankOpening(campus));
    const ready = v.title.trim() && v.dept && Number(v.posts) > 0;
    return (
      <SideScreen
        title={t("hrh.op.new.title")} sub={t("hrh.op.new.sub")} width={680} onClose={onClose}
        footer={
          <React.Fragment>
            <Button kind="ghost" onClick={onClose}>{t("hrh.cta.cancel")}</Button>
            <Button kind="primary" iconLeft="plus" disabled={!ready} onClick={function () { onCreate(v); }}>{t("hrh.op.new.cta")}</Button>
          </React.Fragment>
        }
      >
        <OpeningFields v={v} setV={setV} idBase="hrh-newop" />
        <Consequence lines={[t("hrh.op.new.c1"), t("hrh.op.new.c2"), t("hrh.op.new.c3")]} />
      </SideScreen>
    );
  }

  function EditOpeningPop({ opening, onClose, onDone }) {
    const { t } = useLang();
    const [v, setV] = useState({
      title: opening.title, campus: opening.campus, dept: opening.dept, cat: opening.cat,
      employment: opening.employment, posts: String(opening.posts), neededBy: arrToIso(opening.neededBy),
      why: opening.whyKey, handler: opening.handlerKey,
      needs: (opening.needsKeys || []).map(function (k) { return t(k); }).join(", "),
      note: opening.noteKey ? t(opening.noteKey) : (opening.noteText || ""),
    });
    const ready = v.title.trim() && v.dept && Number(v.posts) > 0;
    return (
      <Pop title={t("hrh.op.edit.title")} sub={opening.title} onClose={onClose} width={660}>
        <OpeningFields v={v} setV={setV} idBase="hrh-editop" />
        <Consequence lines={[t("hrh.op.edit.c1"), t("hrh.op.edit.c2")]} />
        <PopFoot confirmLabel={t("hrh.op.edit.cta")} onCancel={onClose} disabled={!ready} onConfirm={function () { onDone(v); }} />
      </Pop>
    );
  }

  function HoldPop({ opening, live, onClose, onDone }) {
    const { t } = useLang();
    const [why, setWhy] = useState("");
    return (
      <Pop title={t("hrh.op.hold.title")} sub={opening.title} onClose={onClose}>
        <Field id="hrh-hold-why" label={t("hrh.op.hold.why")} hint={t("hrh.op.hold.whyHint")}>
          <Input id="hrh-hold-why" value={why} onChange={setWhy} placeholder={t("hrh.op.hold.whyPh")} />
        </Field>
        <Consequence lines={[
          t("hrh.op.hold.c1"),
          live > 0 ? t("hrh.op.hold.c2", { n: num(live) }) : t("hrh.op.hold.c2none"),
          t("hrh.op.hold.c3"),
        ]} />
        <PopFoot confirmLabel={t("hrh.op.hold.cta")} onCancel={onClose} disabled={!why.trim()} onConfirm={function () { onDone(why.trim()); }} />
      </Pop>
    );
  }

  function ReopenPop({ opening, onClose, onDone }) {
    const { t } = useLang();
    return (
      <Pop title={t("hrh.op.reopen.title")} sub={opening.title} onClose={onClose}>
        <Value muted>{t("hrh.op.reopen.body", { date: dmy(t, opening.holdOn || opening.closedOn) })}</Value>
        <Consequence lines={[t("hrh.op.reopen.c1"), t("hrh.op.reopen.c2")]} />
        <PopFoot confirmLabel={t("hrh.op.reopen.cta")} onCancel={onClose} onConfirm={onDone} />
      </Pop>
    );
  }

  /* CLOSING ONE. The consequence that matters is the people still
     standing against it — closing the post does not decide them, and
     a screen that let you think it did would leave them sitting here
     for a year. */
  function CloseOpeningPop({ opening, live, filled, onClose, onDone }) {
    const { t } = useLang();
    const [reason, setReason] = useState(filled ? "filled" : "");
    const [note, setNote] = useState("");
    const REASONS = ["filled", "notNeeded", "postponed", "noCandidates"];
    return (
      <Pop title={t("hrh.op.close.title")} sub={opening.title} onClose={onClose}>
        <Field id="hrh-close-reason" label={t("hrh.op.close.reason")}>
          <Select id="hrh-close-reason" value={reason} onChange={setReason}
            options={[{ value: "", label: t("hrh.op.close.reasonPick") }].concat(REASONS.map(function (k) { return { value: k, label: t("hrh.close." + k) }; }))} />
        </Field>
        <Field id="hrh-close-note" label={t("hrh.op.close.note")} hint={t("hrh.op.close.noteHint")}>
          <Input id="hrh-close-note" value={note} onChange={setNote} />
        </Field>
        {live > 0 ? (
          <div style={{ marginTop: 4 }}>
            <StatusMark role="late" glyph="alert" word={t("hrh.op.close.stillLive", { n: num(live) })} />
          </div>
        ) : null}
        <Consequence lines={[
          t("hrh.op.close.c1"),
          live > 0 ? t("hrh.op.close.c2", { n: num(live) }) : null,
          t("hrh.op.close.c3"),
        ]} />
        <PopFoot danger confirmLabel={t("hrh.op.close.cta")} onCancel={onClose} disabled={!reason}
          onConfirm={function () { onDone(reason, note.trim()); }} />
      </Pop>
    );
  }

  function CopyOpeningPop({ opening, onClose, onDone }) {
    const { t } = useLang();
    return (
      <Pop title={t("hrh.op.copy.title")} sub={opening.title} onClose={onClose}>
        <Value muted>{t("hrh.op.copy.body")}</Value>
        <Consequence lines={[t("hrh.op.copy.c1"), t("hrh.op.copy.c2")]} />
        <PopFoot confirmLabel={t("hrh.op.copy.cta")} onCancel={onClose} onConfirm={onDone} />
      </Pop>
    );
  }

  /* ONE OPENING, on a screen of its own: what it is, who is standing
     against it, and everything that has happened to it. */
  /* THE OPENING, IN THE SIDE SCREEN (designer). It was a page of its
     own behind an actions menu, with a card restating everything the
     row already said — what the post is, how many of it there are, who
     is handling it. The row says that. What the row cannot hold is WHO
     IS IN THE RUNNING for it and what has happened to it, so that is
     the whole of the sheet.

     NO STATE CHIP IN HERE EITHER: "Open", "On hold" and "Partly
     filled" are in the column the reader just clicked. */
  function OpeningSheet({ opening, candidates, onClose, onPatch, onAddCandidate, onOpenCandidate, onResume }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [pop, setPop] = useState(null);

    const mine = candidates.filter(function (x) { return x.openingId === opening.id; });
    const live = mine.filter(function (x) { return LADDER.indexOf(x.stage) >= 0 && x.stage !== "joined"; });
    const joined = joinedCount(opening.id, candidates);
    const state = openingState(opening, candidates);

    /* EVERY ACTION IS IN THE SHEET (designer). The three dots held
       five things nobody could see without opening them, and the menu
       drew itself behind the sheet it belonged to. Five buttons in a
       row that wraps is five buttons a reader can count. */
    const holdBtn = state === "hold"
      ? { k: "reopen", label: t("hrh.op.menu.resume"), icon: "check" }
      : state === "closed"
        ? { k: "reopen", label: t("hrh.op.menu.reopen"), icon: "check" }
        : { k: "hold", label: t("hrh.op.menu.hold"), icon: "clock" };

    /* the row carries what was written down when they were added:
       who they are, where they came from, where they have got to,
       when that was, and whether a resume is on file */
    const columns = [
      { key: "who", label: t("hrh.ca.col.who") },
      { key: "stage", label: t("hrh.ca.col.stage"), width: 160 },
      { key: "since", label: t("hrh.ca.col.since"), width: 120 },
      { key: "cv", label: t("hrh.ca.f.cv"), width: 120 },
      { key: "go", label: "", align: "right", width: 88 },
    ];
    const rows = mine.map(function (x) {
      const sl = STAGE_LOOK[x.stage];
      return {
        id: x.id,
        cells: {
          who: (
            <span style={{ display: "flex", gap: 11, alignItems: "center", minWidth: 0 }}>
              <Avatar name={x.name} size={30} />
              <span style={{ minWidth: 0 }}>
                <span style={ty("small", { display: "block", color: c.ink, fontWeight: 600 })}>{x.name}</span>
                <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 1 })}>{t("hrh.src." + x.source)}</span>
              </span>
            </span>
          ),
          stage: <StatusMark role={sl.role} glyph={sl.glyph} word={t("hrh.stage." + x.stage)} />,
          since: <span style={ty("caption", { color: c.inkMuted })}>{dmy(t, x.stageOn)}</span>,
          /* a file you can take away is written in the colour this
             product writes every other link in */
          cv: x.resume
            ? (
              <button
                type="button"
                onClick={function (e) { e.stopPropagation(); onResume(x); }}
                style={ty("caption", {
                  background: "none", border: "none", padding: 0, cursor: "pointer",
                  color: c.action, fontWeight: 700, textDecoration: "underline", textUnderlineOffset: 3,
                })}
              >{t("hrh.ca.cv.get")}</button>
            )
            : <span style={ty("caption", { color: c.inkFaint })}>{t("hrh.ca.cv.none")}</span>,
          go: (
            <span style={{ display: "flex", justifyContent: "flex-end" }}>
              <Button kind="ghost" size="sm" onClick={function () { onOpenCandidate(x.id); }}>{t("hrh.ca.openOne")}</Button>
            </span>
          ),
        },
      };
    });

    return (
      <SideScreen
        title={opening.title}
        sub={opening.dept + " \u00b7 " + t("hrh.cat." + opening.cat) + " \u00b7 " + t("hrh.op.postsFilled", { n: num(joined), total: num(opening.posts) })}
        width={660} onClose={onClose}
        footer={
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <Button kind="primary" size="sm" iconLeft="plus" disabled={state === "closed"}
              onClick={function () { onAddCandidate(opening.id); }}>{t("hrh.op.menu.add")}</Button>
            <Button kind="secondary" size="sm" onClick={function () { setPop("edit"); }}>{t("hrh.op.menu.edit")}</Button>
            <Button kind="secondary" size="sm" onClick={function () { setPop(holdBtn.k); }}>{holdBtn.label}</Button>
            <Button kind="ghost" size="sm" onClick={function () { setPop("copy"); }}>{t("hrh.op.menu.copy")}</Button>
            {state !== "closed" ? (
              <Button kind="dangerOutline" size="sm" onClick={function () { setPop("close"); }}>{t("hrh.op.menu.close")}</Button>
            ) : null}
          </div>
        }
      >
        <div style={{ marginBottom: 18 }}>
          <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 10 })}>{t("hrh.op.card.people")}</div>
          {rows.length
            ? <Register columns={columns} rows={rows} onSelect={onOpenCandidate} />
            : <EmptyState compact head={t("hrh.op.noPeople.head")} body={t("hrh.op.noPeople.body")} />}
        </div>

        <div style={{ paddingTop: 16, borderTop: "1px solid " + c.rule }}>
          <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 10 })}>{t("hrh.op.card.history")}</div>
          <Trail
            bare
            items={(opening.trail || []).slice().reverse()}
            renderHead={function (it) {
              return <span style={ty("small", { display: "block", color: c.ink, fontWeight: 600 })}>{t(it.k, it.nameText ? { name: it.nameText } : undefined)}</span>;
            }}
          />
        </div>

        {pop === "edit" ? <EditOpeningPop opening={opening} onClose={function () { setPop(null); }} onDone={function (v) { setPop(null); onPatch(opening.id, "edit", v); }} /> : null}
        {pop === "hold" ? <HoldPop opening={opening} live={live.length} onClose={function () { setPop(null); }} onDone={function (w) { setPop(null); onPatch(opening.id, "hold", w); }} /> : null}
        {pop === "reopen" ? <ReopenPop opening={opening} onClose={function () { setPop(null); }} onDone={function () { setPop(null); onPatch(opening.id, "reopen"); }} /> : null}
        {pop === "close" ? <CloseOpeningPop opening={opening} live={live.length} filled={joined >= opening.posts} onClose={function () { setPop(null); }} onDone={function (r, n2) { setPop(null); onPatch(opening.id, "close", { reason: r, note: n2 }); }} /> : null}
        {pop === "copy" ? <CopyOpeningPop opening={opening} onClose={function () { setPop(null); }} onDone={function () { setPop(null); onPatch(opening.id, "copy"); }} /> : null}
      </SideScreen>
    );
  }

  function OpeningsTab({ campus, openings, candidates, onNew, onOpen, flash }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [show, setShow] = useState("current");

    const all = openings.filter(function (o) { return inCampus(campus, o.campus); });
    const withState = all.map(function (o) { return { o: o, s: openingState(o, candidates) }; });
    const list = withState.filter(function (x) {
      if (show === "current") return x.s === "open" || x.s === "partly" || x.s === "hold";
      if (show === "past") return x.s === "filled" || x.s === "closed";
      return true;
    });

    const openNow = withState.filter(function (x) { return x.s === "open" || x.s === "partly"; });
    const postsLeft = openNow.reduce(function (s, x) { return s + Math.max(0, x.o.posts - joinedCount(x.o.id, candidates)); }, 0);
    const inPlay = candidates.filter(function (x) {
      const o = openingOf(x.openingId, openings);
      return o && inCampus(campus, o.campus) && LADDER.indexOf(x.stage) >= 0 && x.stage !== "joined";
    }).length;
    const oldest = openNow.reduce(function (m, x) { return Math.max(m, daysSince(x.o.openedOn)); }, 0);

    const postsTotal = openNow.reduce(function (s, x) { return s + x.o.posts; }, 0);
    const postsFilled = Math.max(0, postsTotal - postsLeft);
    const ages = openNow.map(function (x) { return daysSince(x.o.openedOn); });
    const avgAge = ages.length ? Math.round(ages.reduce(function (s, n2) { return s + n2; }, 0) / ages.length) : 0;
    const maxAge = ages.length ? Math.max.apply(null, ages) : 0;
    const stale = ages.filter(function (n2) { return n2 > 30; }).length;
    const settledPeople = candidates.filter(function (x) {
      const o = openingOf(x.openingId, openings);
      return o && inCampus(campus, o.campus) && OFF_LADDER.indexOf(x.stage) >= 0;
    }).length;
    const STATE_ORDER = ["open", "partly", "hold", "filled", "closed"];
    const stateBand = STATE_ORDER.map(function (s) {
      return { key: s, label: t("hrh.state." + s), value: withState.filter(function (x) { return x.s === s; }).length, color: c[OPEN_LOOK[s].fill] || c.accent };
    });

    const columns = [
      { key: "title", label: t("hrh.op.col.title") },
      { key: "cat", label: t("hrh.op.col.cat"), width: 140 },
      { key: "posts", label: t("hrh.op.col.posts"), align: "right", mono: true, width: 120 },
      { key: "people", label: t("hrh.op.col.people"), align: "right", mono: true, width: 130 },
      { key: "opened", label: t("hrh.op.col.opened"), mono: true, width: 120 },
      { key: "state", label: t("hrh.op.col.state"), width: 170 },
    ];
    const rows = list.map(function (x) {
      const o = x.o;
      const look = OPEN_LOOK[x.s];
      const j = joinedCount(o.id, candidates);
      const lv = liveCount(o.id, candidates);
      return {
        id: o.id, live: true,
        cells: {
          title: (
            <span>
              <span style={ty("small", { display: "block", color: c.ink, fontWeight: 600 })}>{o.title}</span>
              <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 2 })}>{o.dept} · {t(o.whyKey)}</span>
            </span>
          ),
          cat: <Chip>{t("hrh.cat." + o.cat)}</Chip>,
          posts: num(j) + " / " + num(o.posts),
          people: lv ? num(lv) : "—",
          opened: dmy(t, o.openedOn),
          state: (
            <span>
              <StatusMark role={look.role} glyph={look.glyph} word={t("hrh.state." + x.s)} />
              {(x.s === "open" || x.s === "partly") && daysSince(o.openedOn) > 30 ? (
                <span style={ty("caption", { display: "block", color: c.lateText, marginTop: 3 })}>{t("hrh.op.openDays", { n: num(daysSince(o.openedOn)) })}</span>
              ) : null}
            </span>
          ),
        },
      };
    });

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: G3.layout.gap }}>
        <Flash text={flash} />
        <Card>
          <MetricStrip
            pad={0} style={{ marginTop: 2, marginBottom: 2 }}
            metrics={[
              /* amber is already the stale openings two cells along; a post
                 still to fill is a plain quantity, not a second warning */
              { k: "toFill", label: t("hrh.op.m.toFill"), value: num(postsLeft),
                tone: postsLeft ? c.chartPurple : c.chartGreen,
                note: t("hrh.op.m.toFillNote", { filled: num(postsFilled), total: num(postsTotal) }) },
              { k: "open", label: t("hrh.op.m.open"), value: num(openNow.length), tone: c.chartBlue,
                note: t("hrh.op.m.openNote", { total: num(withState.length) }) },
              { k: "people", label: t("hrh.op.m.people"), value: num(inPlay), tone: c.chartTeal,
                note: t("hrh.op.m.peopleNote", { n: num(settledPeople) }) },
              { k: "stale", label: t("hrh.op.m.stale"), value: num(stale),
                tone: stale ? c.chartAmber : c.chartGreen,
                note: t("hrh.op.m.staleNote", { n: num(openNow.length) }) },
            ]}
          />
        </Card>

        {rows.length === 0 ? (
          <Card>
            <EmptyState head={t("hrh.op.empty.head")} body={t("hrh.op.empty.body")}
              action={<Button kind="primary" iconLeft="plus" onClick={onNew}>{t("hrh.op.new.ctaShort")}</Button>} />
          </Card>
        ) : (
          <Register
            title={t("hrh.op.reg.title")} sub={t("hrh.op.reg.sub")}
            action={
              <span style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ width: 190 }}>
                  <Select id="hrh-op-show" size="sm" ariaLabel={t("hrh.op.show")} value={show} onChange={setShow}
                    options={[
                      { value: "current", label: t("hrh.op.show.current") },
                      { value: "past", label: t("hrh.op.show.past") },
                      { value: "all", label: t("hrh.op.show.all") },
                    ]} />
                </span>
                <Button kind="primary" size="sm" iconLeft="plus" onClick={onNew}>{t("hrh.op.new.ctaShort")}</Button>
              </span>
            }
            columns={columns} rows={rows} onSelect={onOpen}
            footer={<span style={ty("caption", { color: c.inkFaint })}>{t("hrh.op.reg.foot")}</span>}
          />
        )}
      </div>
    );
  }

  /* ============================================================
     TAB 2 · CANDIDATES — where each person has got to

     Every one of these steps happened in a room: somebody read a CV
     on a Saturday, a head of department sat with a candidate on a
     Tuesday, a principal decided over the phone. Naveya is not in any
     of those rooms. So this tab is a RECORD of what was done, never a
     stepper that pretends to drive it — which is why a person can be
     entered at any stage, on any past date, and why nothing here
     sends anybody anything.
     ============================================================ */

  function openingOptions(t, openings, campus) {
    return openings
      .filter(function (o) { return inCampus(campus, o.campus) && o.state !== "closed"; })
      .map(function (o) { return { value: o.id, label: o.title }; });
  }

  function CandidateFields({ v, setV, openings, campus, idBase, withStage }) {
    const { t } = useLang();
    function set(k, x) { setV(Object.assign({}, v, { [k]: x })); }
    const future = v.when && v.when > arrToIso(TODAY);
    return (
      <React.Fragment>
        <Field id={idBase + "-opening"} label={t("hrh.ca.f.opening")} hint={t("hrh.ca.f.openingHint")}>
          <Select id={idBase + "-opening"} value={v.openingId} onChange={function (x) { set("openingId", x); }}
            options={[{ value: "", label: t("hrh.ca.f.openingPick") }].concat(openingOptions(t, openings, campus))} />
        </Field>
        <Field id={idBase + "-name"} label={t("hrh.ca.f.name")}>
          <Input id={idBase + "-name"} value={v.name} onChange={function (x) { set("name", x); }} />
        </Field>
        {/* FIVE THINGS (designer): the post, the name, where they came
            from, where they have got to, when, and the resume. A phone
            number, a qualification and a notice period are things HR
            finds out later and adds to the record — not things that
            should stand between somebody and writing a name down. */}
        <Field id={idBase + "-source"} label={t("hrh.ca.f.source")}>
          <Select id={idBase + "-source"} value={v.source} onChange={function (x) { set("source", x); }}
            options={SOURCES.map(function (sc) { return { value: sc, label: t("hrh.src." + sc) }; })} />
        </Field>
        {withStage ? (
          <React.Fragment>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 220px" }}>
                {/* THE POINT OF THE WHOLE FORM. Somebody may already have
                    been interviewed before anybody opened this screen. */}
                <Field id={idBase + "-stage"} label={t("hrh.ca.f.stage")} hint={t("hrh.ca.f.stageHint")}>
                  <Select id={idBase + "-stage"} value={v.stage} onChange={function (x) { set("stage", x); }}
                    options={LADDER.filter(function (s) { return s !== "joined"; }).map(function (s) { return { value: s, label: t("hrh.stage." + s) }; })} />
                </Field>
              </div>
              <div style={{ flex: "1 1 200px" }}>
                <Field id={idBase + "-when"} label={t("hrh.ca.f.when")} hint={t("hrh.ca.f.whenHint")} error={future ? t("hrh.ca.f.whenFuture") : null}>
                  <Input id={idBase + "-when"} type="date" value={v.when} onChange={function (x) { set("when", x); }} invalid={!!future} />
                </Field>
              </div>
            </div>
            <Field id={idBase + "-cv"} label={t("hrh.ca.f.cv")} hint={t("hrh.ca.f.cvHint")}>
              <FileField id={idBase + "-cv"} fileName={v.cv} onPick={function (f) { set("cv", f); }} accept=".pdf,.doc,.docx" />
            </Field>
          </React.Fragment>
        ) : null}
      </React.Fragment>
    );
  }

  function AddCandidateScreen({ campus, openings, defaultOpeningId, onClose, onCreate }) {
    const { t } = useLang();
    const [v, setV] = useState({
      openingId: defaultOpeningId || "", name: "", phone: "", email: "", source: "walkIn",
      handler: "hrh.who.meera", qual: "", notice: "", stage: "shortlisted", when: arrToIso(TODAY), note: "", cv: null,
    });
    const future = v.when && v.when > arrToIso(TODAY);
    const ready = v.name.trim() && v.openingId && v.when && !future;
    return (
      <SideScreen
        title={t("hrh.ca.new.title")} sub={t("hrh.ca.new.sub")} width={680} onClose={onClose}
        footer={
          <React.Fragment>
            <Button kind="ghost" onClick={onClose}>{t("hrh.cta.cancel")}</Button>
            <Button kind="primary" iconLeft="plus" disabled={!ready} onClick={function () { onCreate(v); }}>{t("hrh.ca.new.cta")}</Button>
          </React.Fragment>
        }
      >
        <CandidateFields v={v} setV={setV} openings={openings} campus={campus} idBase="hrh-newca" withStage />
        <Consequence lines={[t("hrh.ca.new.c1"), t("hrh.ca.new.c2"), t("hrh.ca.new.c3")]} />
      </SideScreen>
    );
  }

  function EditCandidatePop({ cand, openings, campus, onClose, onDone }) {
    const { t } = useLang();
    const [v, setV] = useState({
      openingId: cand.openingId, name: cand.name, phone: cand.phone || "", email: cand.email || "",
      source: cand.source, handler: cand.handlerKey, qual: cand.qual || "", notice: cand.noticeKey || "",
    });
    return (
      <Pop title={t("hrh.ca.edit.title")} sub={cand.name} onClose={onClose} width={660}>
        <CandidateFields v={v} setV={setV} openings={openings} campus={campus} idBase="hrh-editca" />
        <Consequence lines={[t("hrh.ca.edit.c1"), t("hrh.ca.edit.c2")]} />
        <PopFoot confirmLabel={t("hrh.ca.edit.cta")} onCancel={onClose} disabled={!v.name.trim()} onConfirm={function () { onDone(v); }} />
      </Pop>
    );
  }

  /* THE ONE ACTION THIS MODULE IS FOR: writing down what happened,
     when it happened, and who was in the room. */
  function RecordStepPop({ cand, onClose, onDone }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const idx = LADDER.indexOf(cand.stage);
    const [stage, setStage] = useState(idx >= 0 && idx < LADDER.length - 1 ? LADDER[idx + 1] : "interview");
    const [when, setWhen] = useState(arrToIso(TODAY));
    const [met, setMet] = useState("");
    const [note, setNote] = useState("");
    const future = when && when > arrToIso(TODAY);
    const back = LADDER.indexOf(stage) >= 0 && idx >= 0 && LADDER.indexOf(stage) < idx;
    const isSelected = stage === "selected";
    const isJoined = stage === "joined";
    return (
      <Pop title={t("hrh.ca.step.title")} sub={t("hrh.ca.step.sub", { name: cand.name })} onClose={onClose} width={620}>
        <Field id="hrh-step-stage" label={t("hrh.ca.step.stage")} hint={t("hrh.ca.step.stageHint")}>
          <Select id="hrh-step-stage" value={stage} onChange={setStage}
            options={LADDER.map(function (s) { return { value: s, label: t("hrh.stage." + s) }; })} />
        </Field>
        {back ? (
          <div style={{ marginBottom: 16, marginTop: -8 }}>
            <StatusMark role="late" glyph="alert" word={t("hrh.ca.step.backwards")} />
            <p style={ty("caption", { color: c.inkMuted, margin: "6px 0 0" })}>{t("hrh.ca.step.backwardsNote")}</p>
          </div>
        ) : null}
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 200px" }}>
            <Field id="hrh-step-when" label={t("hrh.ca.step.when")} hint={t("hrh.ca.step.whenHint")} error={future ? t("hrh.ca.f.whenFuture") : null}>
              <Input id="hrh-step-when" type="date" value={when} onChange={setWhen} invalid={!!future} />
            </Field>
          </div>
          <div style={{ flex: "1 1 220px" }}>
            <Field id="hrh-step-met" label={t("hrh.ca.step.met")} hint={t("hrh.ca.step.metHint")}>
              <Input id="hrh-step-met" value={met} onChange={setMet} placeholder={t("hrh.ca.step.metPh")} />
            </Field>
          </div>
        </div>
        <Field id="hrh-step-note" label={t("hrh.ca.step.note")} hint={t("hrh.ca.step.noteHint")}>
          <Input id="hrh-step-note" value={note} onChange={setNote} />
        </Field>
        <Consequence lines={[
          t("hrh.ca.step.c1", { date: when ? dmy(t, isoToArr(when)) : "—" }),
          t("hrh.ca.step.c2"),
          isSelected ? t("hrh.ca.step.cSelected") : null,
          isJoined ? t("hrh.ca.step.cJoined") : null,
        ]} />
        <PopFoot confirmLabel={t("hrh.ca.step.cta")} onCancel={onClose} disabled={!when || !!future}
          onConfirm={function () { onDone(stage, when, met.trim(), note.trim()); }} />
      </Pop>
    );
  }

  function EndPop({ cand, kind, onClose, onDone }) {
    const { t } = useLang();
    const [reason, setReason] = useState("");
    const [when, setWhen] = useState(arrToIso(TODAY));
    const [note, setNote] = useState("");
    const REASONS = kind === "notTaken"
      ? ["betterFit", "notQualified", "didNotAttend", "payGap", "noLonger"]
      : ["tookOther", "personal", "payGap", "distance"];
    const future = when && when > arrToIso(TODAY);
    return (
      <Pop title={t("hrh.ca.end." + kind + ".title")} sub={cand.name} onClose={onClose}>
        <Field id="hrh-end-reason" label={t("hrh.ca.end." + kind + ".reason")}>
          <Select id="hrh-end-reason" value={reason} onChange={setReason}
            options={[{ value: "", label: t("hrh.ca.end.reasonPick") }].concat(REASONS.map(function (k) { return { value: "hrh.end." + k, label: t("hrh.end." + k) }; }))} />
        </Field>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 200px" }}>
            <Field id="hrh-end-when" label={t("hrh.ca.step.when")} error={future ? t("hrh.ca.f.whenFuture") : null}>
              <Input id="hrh-end-when" type="date" value={when} onChange={setWhen} invalid={!!future} />
            </Field>
          </div>
        </div>
        <Field id="hrh-end-note" label={t("hrh.ca.end.note")} hint={t("hrh.ca.end.noteHint")}>
          <Input id="hrh-end-note" value={note} onChange={setNote} />
        </Field>
        <Consequence lines={[
          t("hrh.ca.end." + kind + ".c1"),
          t("hrh.ca.end.c2"),
          t("hrh.ca.end.c3"),
        ]} />
        <PopFoot danger={kind === "notTaken"} confirmLabel={t("hrh.ca.end." + kind + ".cta")} onCancel={onClose}
          disabled={!reason || !when || !!future} onConfirm={function () { onDone(reason, when, note.trim()); }} />
      </Pop>
    );
  }

  function MoveOpeningPop({ cand, openings, campus, onClose, onDone }) {
    const { t } = useLang();
    const [to, setTo] = useState("");
    const options = openingOptions(t, openings, campus).filter(function (o) { return o.value !== cand.openingId; });
    return (
      <Pop title={t("hrh.ca.move.title")} sub={cand.name} onClose={onClose}>
        <Field id="hrh-move-to" label={t("hrh.ca.move.to")} hint={t("hrh.ca.move.toHint")}>
          <Select id="hrh-move-to" value={to} onChange={setTo}
            options={[{ value: "", label: t("hrh.ca.move.pick") }].concat(options)} />
        </Field>
        <Consequence lines={[t("hrh.ca.move.c1"), t("hrh.ca.move.c2"), t("hrh.ca.move.c3")]} />
        <PopFoot confirmLabel={t("hrh.ca.move.cta")} onCancel={onClose} disabled={!to} onConfirm={function () { onDone(to); }} />
      </Pop>
    );
  }

  /* ONE CANDIDATE, on a screen of its own. */
  /* THE CANDIDATE, IN THE SIDE SCREEN. Two cards of facts and a page
     of its own have gone: the row above says the name, the post, the
     stage and the wait, so the sheet holds what the row cannot — what
     is on file about the person, what has happened to them, and the
     decision.

     THE DECISION IS THE FOOT OF IT. A candidate ends one of three
     ways: an offer goes out, we do not take them, or they walk away.
     The offer itself is not made here — HR e-mails it and records it
     in Offers, which is where the letter and their reply are kept. */
  function CandidateSheet({ cand, opening, openings, campus, onClose, onPatch, onResume, onGoOffers, back }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [pop, setPop] = useState(null);
    const onLadder = LADDER.indexOf(cand.stage) >= 0;
    const live = onLadder && cand.stage !== "joined";

    /* ONE CONTROL, NOT A ROW OF THEM (designer). Where somebody stands
       is one question with one answer, so it is one select and one
       date — not four buttons competing to be pressed. The two ends of
       the ladder are answers to the same question, so they are in the
       same list; choosing one asks for the reason, because an ending
       without a reason is a record nobody can read later. */
    const [stage, setStage] = useState(cand.stage);
    const [when, setWhen] = useState(arrToIso(TODAY));
    const future = when && when > arrToIso(TODAY);
    const changed = stage !== cand.stage;
    const interviewed = LADDER.indexOf(cand.stage) >= LADDER.indexOf("interview");

    function record() {
      if (!changed || future) return;
      if (OFF_LADDER.indexOf(stage) >= 0) { setPop(stage); return; }
      onPatch(cand.id, "step", { stage: stage, when: when, met: null, note: null });
      onClose();
    }

    return (
      <SideScreen
        title={cand.name}
        sub={t("hrh.src." + cand.source)}
        width={660} onClose={onClose}
        back={back}
        footer={
          /* THE FOOT IS THE CONTROL, so it takes the width of the sheet:
             the two fields stretch and the two buttons hold the
             right-hand end. A 200px select floating off the right of a
             660px bar reads as an afterthought. */
          live ? (
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap", width: "100%" }}>
              <span style={{ flex: "1 1 190px", minWidth: 0 }}>
                <Field id="hrh-stage-now" label={t("hrh.ca.stageNow")}>
                  <Select id="hrh-stage-now" size="sm" value={stage} onChange={setStage}
                    options={LADDER.concat(OFF_LADDER).map(function (sg) { return { value: sg, label: t("hrh.stage." + sg) }; })} />
                </Field>
              </span>
              <span style={{ flex: "0 1 170px", minWidth: 150 }}>
                <Field id="hrh-stage-on" label={t("hrh.ca.stageOn")} error={future ? t("hrh.ca.f.whenFuture") : null}>
                  <Input id="hrh-stage-on" size="sm" type="date" value={when} onChange={setWhen} invalid={!!future} />
                </Field>
              </span>
              <span style={{ paddingBottom: 20, display: "flex", gap: 10, flexWrap: "wrap", marginLeft: "auto" }}>
                <Button kind="primary" size="sm" disabled={!changed || !!future} onClick={record}>{t("hrh.ca.record")}</Button>
                {/* an offer is a thing you do AFTER meeting somebody */}
                {interviewed ? (
                  <Button kind="secondary" size="sm" iconLeft="mail" onClick={function () { onGoOffers(cand); }}>{t("hrh.ca.menu.offer")}</Button>
                ) : null}
              </span>
            </div>
          ) : null
        }
      >
        <div style={{ marginBottom: 18 }}>
          {/* MOVE SITS WITH THE THING IT MOVES. A button at the foot
              said "move to another opening" without showing which one
              they are in; here the opening is on the row, and the move
              is the quiet link beside it. */}
          {opening ? (
            <DefRow label={t("hrh.ca.forOpening")}>
              <span style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <Value>{opening.title}</Value>
                {live ? <LinkButton onClick={function () { setPop("move"); }}>{t("hrh.ca.moveShort")}</LinkButton> : null}
              </span>
            </DefRow>
          ) : null}
          <DefRow label={t("hrh.ca.f.handler")}>
            <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <Avatar name={t(cand.handlerKey)} size={26} />
              <Value>{t(cand.handlerKey)}</Value>
            </span>
          </DefRow>
          <DefRow label={t("hrh.ca.f.phone")}>
            {cand.phone ? <span style={{ fontFamily: G3.font.mono, fontSize: 12.5, color: c.ink }}>{cand.phone}</span> : <Value muted>{t("hrh.ca.none")}</Value>}
          </DefRow>
          <DefRow label={t("hrh.ca.f.email")}>
            {cand.email ? <Value>{cand.email}</Value> : <Value muted>{t("hrh.ca.noEmail")}</Value>}
          </DefRow>
          <DefRow label={t("hrh.ca.f.cv")} last>
            {cand.resume
              ? <Button kind="secondary" size="sm" iconLeft="download" onClick={function () { onResume(cand); }}>{t("hrh.ca.cv.get")}</Button>
              : <Value muted>{t("hrh.ca.cv.none")}</Value>}
          </DefRow>
          {cand.endReasonKey ? (
            <DefRow label={t("hrh.ca.f.endReason")} last><Value>{t(cand.endReasonKey)}</Value></DefRow>
          ) : null}
          {/* under the facts it changes, where a reader looking at a
              wrong phone number already is */}
          <div style={{ marginTop: 14 }}>
            <Button kind="ghost" size="sm" iconLeft="document" onClick={function () { setPop("edit"); }}>{t("hrh.ca.editShort")}</Button>
          </div>
        </div>

        {!interviewed && live ? (
          <p style={ty("caption", { color: c.inkFaint, margin: "0 0 18px" })}>{t("hrh.ca.offerWhen")}</p>
        ) : null}

        <div style={{ paddingTop: 16, borderTop: "1px solid " + c.rule }}>
          <div style={ty("caption", { color: c.inkFaint, fontWeight: 700, marginBottom: 10 })}>{t("hrh.ca.card.history")}</div>
          <Trail
            bare
            items={(cand.trail || []).slice().reverse()}
            renderHead={function (it) {
              const sl = STAGE_LOOK[it.stage] || STAGE_LOOK.shortlisted;
              return <StatusMark role={sl.role} glyph={sl.glyph} word={t("hrh.stage." + it.stage)} />;
            }}
          />
        </div>

        {pop === "edit" ? <EditCandidatePop cand={cand} openings={openings} campus={campus} onClose={function () { setPop(null); }} onDone={function (v) { setPop(null); onPatch(cand.id, "edit", v); }} /> : null}
        {pop === "move" ? <MoveOpeningPop cand={cand} openings={openings} campus={campus} onClose={function () { setPop(null); }} onDone={function (to) { setPop(null); onPatch(cand.id, "move", to); }} /> : null}
        {pop === "notTaken" || pop === "withdrew" ? (
          <EndPop cand={cand} kind={pop} onClose={function () { setPop(null); }}
            onDone={function (r, w, n2) { const k = pop; setPop(null); onPatch(cand.id, "end", { kind: k, reason: r, when: w, note: n2 }); }} />
        ) : null}
      </SideScreen>
    );
  }

  function CandidatesTab({ campus, openings, candidates, onAdd, onOpen, flash }) {
    const { c } = useTheme();
    const { t, ty } = useLang();
    const [q, setQ] = useState("");
    const [openingId, setOpeningId] = useState("all");
    const [stage, setStage] = useState("all");
    const [showGone, setShowGone] = useState(false);

    const here = candidates.filter(function (x) {
      const o = openingOf(x.openingId, openings);
      return o && inCampus(campus, o.campus);
    });
    const needle = q.trim().toLowerCase();
    const list = here.filter(function (x) {
      if (!showGone && OFF_LADDER.indexOf(x.stage) >= 0) return false;
      if (openingId !== "all" && x.openingId !== openingId) return false;
      if (stage !== "all" && x.stage !== stage) return false;
      if (needle) {
        const o = openingOf(x.openingId, openings);
        const hay = (x.name + " " + (o ? o.title : "") + " " + (x.qual || "")).toLowerCase();
        if (hay.indexOf(needle) === -1) return false;
      }
      return true;
    });

    const band = LADDER.map(function (s) {
      return { k: s, n: here.filter(function (x) { return x.stage === s; }).length };
    });
    const running = here.filter(function (x) { return LADDER.indexOf(x.stage) >= 0 && x.stage !== "joined"; });
    const inPlay = running.length;
    const gone = here.filter(function (x) { return OFF_LADDER.indexOf(x.stage) >= 0; }).length;
    const hired = here.filter(function (x) { return x.stage === "joined"; }).length;
    const deep = running.filter(function (x) { return LADDER.indexOf(x.stage) >= LADDER.indexOf("interview"); }).length;
    const waits = running.map(function (x) { return daysSince(x.stageOn); });
    const avgWait = waits.length ? Math.round(waits.reduce(function (s, n2) { return s + n2; }, 0) / waits.length) : 0;
    const maxWait = waits.length ? Math.max.apply(null, waits) : 0;
    const slowCount = waits.filter(function (n2) { return n2 >= SLOW_DAYS; }).length;
    const stageBand = LADDER.map(function (s) {
      return { key: s, label: t("hrh.stage." + s), value: here.filter(function (x) { return x.stage === s; }).length, color: c[STAGE_LOOK[s].fill] || c.accent };
    });

    const columns = [
      { key: "who", label: t("hrh.ca.col.who") },
      { key: "opening", label: t("hrh.ca.col.opening") },
      { key: "stage", label: t("hrh.ca.col.stage"), width: 190 },
      { key: "since", label: t("hrh.ca.col.since"), width: 160 },
      { key: "handler", label: t("hrh.ca.col.handler"), width: 160 },
    ];
    const rows = list.map(function (x) {
      const o = openingOf(x.openingId, openings);
      const sl = STAGE_LOOK[x.stage];
      const days = daysSince(x.stageOn);
      const slow = LADDER.indexOf(x.stage) >= 0 && x.stage !== "joined" && days >= SLOW_DAYS;
      return {
        id: x.id, live: true,
        cells: {
          who: (
            <span style={{ display: "flex", gap: 11, alignItems: "center", minWidth: 0 }}>
              <Avatar name={x.name} size={30} />
              <span style={{ minWidth: 0 }}>
                <span style={ty("small", { display: "block", color: c.ink, fontWeight: 600 })}>{x.name}</span>
                <span style={ty("caption", { display: "block", color: c.inkFaint, marginTop: 1 })}>{t("hrh.src." + x.source)}</span>
              </span>
            </span>
          ),
          opening: (
            <span>
              <span style={ty("small", { display: "block", color: c.ink })}>{o ? o.title : "—"}</span>
              {o && o.state === "closed" ? (
                <span style={ty("caption", { display: "block", color: c.lateText, marginTop: 2 })}>{t("hrh.ca.openingClosed")}</span>
              ) : null}
            </span>
          ),
          stage: <StatusMark role={sl.role} glyph={sl.glyph} word={t("hrh.stage." + x.stage)} />,
          since: (
            <span>
              <span style={ty("caption", { display: "block", color: c.inkMuted })}>{ageWord(t, days)}</span>
              {slow ? <span style={ty("caption", { display: "block", color: c.lateText, marginTop: 2 })}>{t("hrh.ca.waiting")}</span> : null}
            </span>
          ),
          handler: <span style={ty("small", { color: c.inkMuted })}>{t(x.handlerKey)}</span>,
        },
      };
    });

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: G3.layout.gap }}>
        <Flash text={flash} />
        <Card>
          <MetricStrip
            pad={0} style={{ marginTop: 2, marginBottom: 2 }}
            metrics={[
              /* five plain readings of the same roll: who is still
                 being considered, how far they have got, how long they
                 have been waiting, who has been left too long, and who
                 actually started. `deep` and `slow` are cuts of the
                 first, so it carries the bar alone. */
              { k: "running", label: t("hrh.ca.m.running"), value: num(inPlay), total: true, tone: c.chartBlue,
                note: t("hrh.ca.m.runningNote") },
              { k: "deep", label: t("hrh.ca.m.deep"), value: num(deep), tone: c.chartTeal,
                note: t("hrh.ca.m.deepNote") },
              { k: "slow", label: t("hrh.ca.m.slow"), value: num(slowCount),
                tone: slowCount ? c.chartAmber : c.chartGreen,
                note: t("hrh.ca.m.slowNote", { n: num(SLOW_DAYS) }) },
              { k: "hired", label: t("hrh.ca.m.hired"), value: num(hired), tone: c.chartGreen,
                note: t("hrh.ca.m.hiredNote") },
            ]}
          />

        </Card>

        {rows.length === 0 ? (
          <Card>
            <EmptyState head={t("hrh.ca.empty.head")} body={t("hrh.ca.empty.body")}
              action={<Button kind="primary" iconLeft="plus" onClick={function () { onAdd(null); }}>{t("hrh.ca.new.ctaShort")}</Button>} />
          </Card>
        ) : (
          <Register
            title={t("hrh.ca.reg.title")} sub={t("hrh.ca.reg.sub")}
            action={
              <span style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ width: 200 }}>
                  <Input id="hrh-ca-q" value={q} onChange={setQ} placeholder={t("hrh.ca.f.findPh")} />
                </span>
                <span style={{ width: 190 }}>
                  <Select id="hrh-ca-opening" ariaLabel={t("hrh.ca.col.opening")} value={openingId} onChange={setOpeningId}
                    options={[{ value: "all", label: t("hrh.ca.allOpenings") }].concat(
                      openings.filter(function (o) { return inCampus(campus, o.campus); }).map(function (o) { return { value: o.id, label: o.title }; })
                    )} />
                </span>
                <span style={{ width: 190 }}>
                  <Select id="hrh-ca-stage" ariaLabel={t("hrh.ca.col.stage")} value={stage} onChange={setStage}
                    options={[{ value: "all", label: t("hrh.ca.allStages") }].concat(
                      stageBand.map(function (sg) { return { value: sg.key, label: sg.label + " (" + num(sg.value) + ")" }; })
                    )} />
                </span>
                <Switch id="hrh-ca-gone" checked={showGone} onChange={setShowGone} label={t("hrh.ca.showGoneShort")} />
                <Button kind="primary" size="sm" iconLeft="plus" onClick={function () { onAdd(null); }}>{t("hrh.ca.new.ctaShort")}</Button>
              </span>
            }
            columns={columns} rows={rows} onSelect={onOpen}
            footer={<span style={ty("caption", { color: c.inkFaint })}>{t("hrh.ca.reg.foot")}</span>}
          />
        )}
      </div>
    );
  }

  /* ============================================================
     SHELL
     ============================================================ */
  function HRHiring({ role, onNavigate }) {
    const { c } = useTheme();
    const { t, lang } = useLang();
    const L = G3.layout;
    const TABS_ID = "hrh-tabs";

    const [campus, setCampus] = useState("indiranagar");
    const [tab, setTab] = useState("openings");
    const [openings, setOpenings] = useState(OPENINGS_SEED);
    const [cands, setCands] = useState(CANDIDATES_SEED);
    const [view, setView] = useState(null);        /* {kind,id} */
    const [side, setSide] = useState(null);        /* "newOpening" | {addFor} */
    const [flash, setFlash] = useState(null);

    function say(msg) { setFlash(msg); }
    let seq = openings.length + cands.length;

    function createOpening(v) {
      const id = "o-new-" + (++seq);
      const o = {
        id: id, title: v.title.trim(), campus: v.campus, dept: v.dept, cat: v.cat,
        posts: Math.max(1, Number(v.posts) || 1), employment: v.employment,
        openedOn: TODAY, neededBy: v.neededBy ? isoToArr(v.neededBy) : null,
        whyKey: v.why, handlerKey: v.handler, state: "open",
        needsText: v.needs, noteText: v.note,
        trail: [{ k: "hrh.tr.opened", who: v.handler, d: TODAY }],
      };
      setOpenings(function (cur) { return [o].concat(cur); });
      setSide(null);
      say(t("hrh.said.openingMade", { title: o.title }));
    }

    function patchOpening(id, action, payload) {
      setOpenings(function (cur) {
        return cur.map(function (o) {
          if (o.id !== id) return o;
          const trail = (o.trail || []).slice();
          if (action === "edit") {
            trail.push({ k: "hrh.tr.edited", who: "hrh.who.meera", d: TODAY });
            return Object.assign({}, o, {
              title: payload.title.trim(), campus: payload.campus, dept: payload.dept, cat: payload.cat,
              employment: payload.employment, posts: Math.max(1, Number(payload.posts) || 1),
              neededBy: payload.neededBy ? isoToArr(payload.neededBy) : o.neededBy,
              whyKey: payload.why, handlerKey: payload.handler,
              needsKeys: null, needsText: payload.needs, noteKey: null, noteText: payload.note, trail: trail,
            });
          }
          if (action === "hold") {
            trail.push({ k: "hrh.tr.held", who: "hrh.who.meera", d: TODAY });
            return Object.assign({}, o, { state: "hold", holdOn: TODAY, holdReasonText: payload, trail: trail });
          }
          if (action === "reopen") {
            trail.push({ k: "hrh.tr.reopened", who: "hrh.who.meera", d: TODAY });
            return Object.assign({}, o, { state: "open", holdOn: null, holdReasonText: null, closedOn: null, closeReasonKey: null, closeNoteText: null, trail: trail });
          }
          if (action === "close") {
            trail.push({ k: "hrh.tr.closed", who: "hrh.who.meera", d: TODAY });
            return Object.assign({}, o, { state: "closed", closedOn: TODAY, closeReasonKey: "hrh.close." + payload.reason, closeNoteText: payload.note || null, trail: trail });
          }
          return o;
        });
      });
      if (action === "copy") {
        const src = openingOf(id, openings);
        if (src) {
          const nid = "o-new-" + (++seq);
          const copy = Object.assign({}, src, {
            id: nid, state: "open", openedOn: TODAY, holdOn: null, holdReasonText: null,
            closedOn: null, closeReasonKey: null, closeNoteText: null,
            trail: [{ k: "hrh.tr.copied", who: "hrh.who.meera", d: TODAY }],
          });
          setOpenings(function (cur) { return [copy].concat(cur); });
          setView({ kind: "opening", id: nid });
          say(t("hrh.said.openingCopied", { title: src.title }));
          return;
        }
      }
      if (action === "edit") say(t("hrh.said.openingEdited"));
      if (action === "hold") say(t("hrh.said.openingHeld"));
      if (action === "reopen") say(t("hrh.said.openingReopened"));
      if (action === "close") say(t("hrh.said.openingClosed"));
    }

    function createCandidate(v) {
      const id = "c-new-" + (++seq);
      const when = v.when ? isoToArr(v.when) : TODAY;
      const cand = {
        id: id, name: v.name.trim(), openingId: v.openingId, phone: v.phone || null, email: v.email || null,
        source: v.source, handlerKey: v.handler, stage: v.stage, stageOn: when,
        qual: v.qual || null, noticeKey: v.notice || null, resume: v.cv || null,
        trail: [{ stage: v.stage, d: when, by: v.handler, noteText: v.note || null }],
      };
      setCands(function (cur) { return [cand].concat(cur); });
      setSide(null);
      setTab("candidates");
      say(t("hrh.said.candAdded", { name: cand.name, stage: t("hrh.stage." + v.stage) }));
    }

    function patchCandidate(id, action, payload) {
      setCands(function (cur) {
        return cur.map(function (x) {
          if (x.id !== id) return x;
          const trail = (x.trail || []).slice();
          if (action === "step") {
            const when = isoToArr(payload.when) || TODAY;
            trail.push({ stage: payload.stage, d: when, by: "hrh.who.meera", metText: payload.met || null, noteText: payload.note || null });
            return Object.assign({}, x, { stage: payload.stage, stageOn: when, trail: trail });
          }
          if (action === "end") {
            const when = isoToArr(payload.when) || TODAY;
            trail.push({ stage: payload.kind, d: when, by: "hrh.who.meera", noteText: payload.note || null });
            return Object.assign({}, x, { stage: payload.kind, stageOn: when, endReasonKey: payload.reason, trail: trail });
          }
          if (action === "edit") {
            return Object.assign({}, x, {
              name: payload.name.trim(), openingId: payload.openingId, phone: payload.phone || null,
              email: payload.email || null, source: payload.source, handlerKey: payload.handler,
              qual: payload.qual || null, noticeKey: payload.notice || null,
            });
          }
          if (action === "move") {
            trail.push({ stage: x.stage, d: TODAY, by: "hrh.who.meera", noteText: t("hrh.ca.move.trailNote") });
            return Object.assign({}, x, { openingId: payload, trail: trail });
          }
          return x;
        });
      });
      if (action === "step") say(t("hrh.said.stepRecorded", { stage: t("hrh.stage." + payload.stage), date: dmy(t, isoToArr(payload.when) || TODAY) }));
      if (action === "end") say(t("hrh.said." + payload.kind));
      if (action === "edit") say(t("hrh.said.candEdited"));
      if (action === "move") {
        const to = openingOf(payload, openings);
        say(t("hrh.said.candMoved", { title: to ? to.title : "" }));
      }
    }

    const openSheet = view && view.kind === "opening" ? openingOf(view.id, openings) : null;
    const candSheet = view && view.kind === "candidate" ? cands.filter(function (y) { return y.id === view.id; })[0] : null;

    function resumeOf(x) { say(t("hrh.said.cvGot", { file: x.resume })); }

    /* ONE MODULE, THREE RUNGS: the posts, the people, and the offers
       those people were made. An offer was never a place of its own —
       it is the last thing that happens to a candidate. */
    const TAB_ITEMS = [
      { key: "openings", label: t("hrh.tab.openings") },
      { key: "candidates", label: t("hrh.tab.candidates") },
      { key: "offers", label: t("hrh.tab.offers") },
    ];

    return (
      <div className="nv3" style={{ display: "flex", minHeight: "100vh", background: c.page, color: c.ink, fontFamily: G3.font.ui }}>
        <Rail role={role || "hr"} active="hrHiring" onNavigate={onNavigate} initials="MI" />
        <main style={{ flex: 1, minWidth: 0, position: "relative", overflowX: "clip" }}>
          <Motif />
          <div style={{ position: "relative", zIndex: 1, maxWidth: L.contentMax, margin: "0 auto", padding: "22px " + L.contentPadX + "px 56px" }}>
            <TopStrip campus={campus} onCampus={function (cm) { setCampus(cm); setFlash(null); }} />

            <div style={{ marginBottom: 20 }}>
              <h1 style={{ margin: 0, fontFamily: G3.font.display, fontSize: 32, lineHeight: 1.15, color: c.ink }}>{t("hrh.title")}</h1>
            </div>

            <Tabs items={TAB_ITEMS} active={tab} onChange={function (k) { setTab(k); setFlash(null); }} ariaLabel={t("hrh.tabs.aria")} idBase={TABS_ID} />

            <div style={{ marginTop: 20 }}>
              {tab === "openings" ? (
                <TabPanel idBase={TABS_ID} tabKey="openings">
                  <OpeningsTab
                    campus={campus} openings={openings} candidates={cands} flash={flash}
                    onNew={function () { setSide("newOpening"); }}
                    onOpen={function (id) { setFlash(null); setView({ kind: "opening", id: id }); }}
                  />
                </TabPanel>
              ) : tab === "candidates" ? (
                <TabPanel idBase={TABS_ID} tabKey="candidates">
                  <CandidatesTab
                    campus={campus} openings={openings} candidates={cands} flash={flash}
                    onAdd={function (oid) { setSide({ addFor: oid || null }); }}
                    onOpen={function (id) { setFlash(null); setView({ kind: "candidate", id: id }); }}
                  />
                </TabPanel>
              ) : (
                <TabPanel idBase={TABS_ID} tabKey="offers">
                  {window.NaveyaOffers && window.NaveyaOffers.Panel
                    ? React.createElement(window.NaveyaOffers.Panel, { campus: campus, onNavigate: onNavigate })
                    : null}
                </TabPanel>
              )}
            </div>
          </div>
        </main>

        {/* AN OPENING AND A CANDIDATE OPEN HERE, over the register
            they were clicked in — not on a page of their own that the
            reader has to find their way back from. */}
        {openSheet ? (
          <OpeningSheet
            opening={openSheet} candidates={cands}
            onClose={function () { setView(null); }}
            onPatch={patchOpening}
            onAddCandidate={function (oid) { setSide({ addFor: oid }); }}
            onOpenCandidate={function (cid) { setView({ kind: "candidate", id: cid, from: { kind: "opening", id: openSheet.id } }); }}
            onResume={resumeOf}
          />
        ) : null}
        {candSheet ? (
          <CandidateSheet
            cand={candSheet} opening={openingOf(candSheet.openingId, openings)} openings={openings} campus={campus}
            onClose={function () { setView(null); }}
            back={view && view.from ? {
              label: t("hrh.ca.backToOpening", { title: (openingOf(view.from.id, openings) || {}).title || "" }),
              onBack: function () { setView(view.from); },
            } : null}
            onPatch={patchCandidate}
            onResume={resumeOf}
            onGoOffers={function (x) {
              /* the candidate goes with them: Offers opens on a draft
                 already in their name, so nobody retypes what hiring
                 already holds */
              if (window.NaveyaOffers && window.NaveyaOffers.start) {
                const o = openingOf(x.openingId, openings);
                window.NaveyaOffers.start({
                  name: x.name, post: o ? o.title : "", campus: o ? o.campus : campus,
                  email: x.email || "", phone: x.phone || "",
                });
              }
              setView(null);
              setTab("offers");
            }}
          />
        ) : null}

        {side === "newOpening" ? (
          <CreateOpeningScreen campus={campus} onClose={function () { setSide(null); }} onCreate={createOpening} />
        ) : null}
        {side && side.addFor !== undefined ? (
          <AddCandidateScreen campus={campus} openings={openings} defaultOpeningId={side.addFor}
            onClose={function () { setSide(null); }} onCreate={createCandidate} />
        ) : null}
      </div>
    );
  }

  window.Pages3 = window.Pages3 || {};
  window.Pages3.HRHiring = HRHiring;
})();
