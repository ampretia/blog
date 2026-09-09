---
title: "When All You've Got Is a Pozidriv, Everything Looks Like a Pozidriv Screw"
date: '2026-10-01'
summary: "A take on the old hammer-and-nail aphorism — and what a screwdriver tells us about tool selection, local maxima, and the difference between good enough and optimal."
slug: 'pozidriv-screwdriver'
layout: post
tags:
    - engineering
    - tools
    - software
    - engineering-thinking-point
keywords:
    - tool selection
    - local maxima
    - pozidriv
---

# When All You've Got Is a Pozidriv, Everything Looks Like a Pozidriv Screw

You know the saying. *When all you have is a hammer, everything looks like a nail.* It's a warning about cognitive bias — the tendency to reach for familiar tools regardless of fit.

But there's a more interesting version of the problem. What if you have a Pozidriv screwdriver, and the screw in front of you is a Phillips?

---

## A brief detour into screwdriver taxonomy

The Pozidriv is a drive type developed by the Phillips Screw Company.[^1] It looks almost identical to a Phillips cross-head — four-armed, recessed — but adds four additional points between the arms, giving it a star-like appearance up close. The design was deliberate: it allows more torque to be applied before the driver slips out of the recess. In the trade this slipping is called *cam-out*, and it is the enemy of clean, controlled fastening.

With the right driver in the right screw, you get maximum torque, minimal cam-out, and a fastener that goes in and comes out cleanly. That is the global optimum.

[^1]: Pozidriv is a registered trademark of the Phillips Screw Company.

---

## Where it gets interesting

Here is what the screwdriver problem actually looks like in practice:

**Pozidriv driver in a Pozidriv screw.** Maximum torque. No cam-out. Best possible result. This is the intended combination.

**Phillips driver in a Pozidriv screw — or vice versa.** Not ideal. The fit is imprecise. You lose some torque, you risk cam-out on a tight fastener, and with enough repetition you start to damage the head. But for a light application? It works. Most of the time. This is the local maximum: a suboptimal tool giving acceptable results under normal conditions.

**Flat-head driver in a Phillips or Pozidriv screw.** This is where things unravel. You can wedge a flat blade into a cross-head recess and apply some torque. In a pinch, it gets the job done. But you're fighting the geometry the whole way. Strip the head once, and you've made the next attempt harder than the one before.

---

## What the screwdriver is actually telling us

Tool selection isn't a binary choice between right and wrong. It sits on a spectrum, and the shape of that spectrum matters.

At the top is the correct tool: purpose-built, efficient, leaves no damage behind. Below that is a large band of *near enough* — tools close enough in form that they interoperate under reasonable load. Below that is a narrower band of *technically possible but inadvisable*. And below that is the flat-head in the cross-head: functional only under the most forgiving conditions, with a compounding cost every time you reach for it.

The mistake isn't always reaching for the wrong tool. Sometimes it's not knowing there *is* a better one. Sometimes it's the comfort of the familiar. And sometimes it's a perfectly rational decision — you need this screw now, and the Pozidriv is in the van.

The important thing is to know which situation you're actually in. A local maximum isn't a failure. Mistaking it for the global optimum is.

---

There's a version of this in software, in process design, in almost any domain where tools and problems meet. The flat-head-in-a-Pozidriv moment is recognisable in retrospect: the growing resistance, the stripped head, the damage you only notice when you try to undo what you built.

The hammer-and-nail aphorism warns you against over-applying a single tool. The screwdriver problem is more subtle. It asks: do you know where you sit on the curve? And are you comfortable with the trade-off you're making?
