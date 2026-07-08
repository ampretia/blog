---
title: 'The Friction Feature'
date: '2026-07-08'
summary: "Why the inbuilt tax of traditional software development wasn't a bug — and what happens when AI removes it entirely."
slug: 'the-friction-feature'
layout: post
tags:
    - AI
    - software
    - engineering
    - development
keywords:
    - friction
    - AI-native development
---

# The Friction Feature

> Why the inbuilt tax of traditional software development wasn't a bug — and what happens when AI removes it entirely.

_A conversation with Gemini · Edited for publication by Bob_

> [Human-in-the loop here - this was prompted by a quiz on how AI-native software development needs to be properly deployed. The 'Review' concept now has increased responsibility. How do we train the next generation of AI-native engineers? So I though let's discuss this with Gemini. Then get Bob to do some editting. All my views are solely my own, and I've reviewed the AIs but not altered it's meaning.]

---

There is a seductive promise inside every AI-native engineering pitch: compress months of junior developer onboarding into weeks. Let the AI handle the synthesis. Let humans focus on the strategic work. Ship faster. Scale cheaper.

The conversation that follows began as a structured exploration of AI-native product delivery — spec-driven pipelines, agent handoffs, human review loops — and quickly became something more uncomfortable. What started with concrete delivery scenarios ended at a structural fault line that may define the next decade of software engineering: **when you automate the construction of code, you silently defund the education of the people responsible for it.**

The interlocutor is Gemini. The challenger is an engineer with 30+ years of production experience. The friction between them is the point.

---

## Part 1: The Spec is the System

The conversation opened on apparently dry ground — the mechanics of AI-assisted delivery pipelines. How do you feed context to an agent? What happens when you skip an artifact? The answers, it turns out, are anything but dry.

> **Scenario:** A team finishes the Low-Level Design and asks the AI to generate the Implementation Plan using only the LLD — without the architecture or HLD outputs.
>
> **Likely outcome:** The plan references components or interfaces that were never approved at the architectural level. Without structural boundaries, the AI invents dependencies that violate the wider system design — producing output that looks authoritative and is quietly broken.

> **Scenario:** An engineer breaks the implementation plan into tasks. The AI has included auth, RBAC, and a reporting dashboard — all explicitly out-of-scope. The engineer reasons the AI must have identified hidden dependencies.
>
> **Likely outcome:** The engineer is experiencing automation bias. The AI hasn't discovered hidden dependencies — it has generated generic boilerplate tasks associated with any software feature. Accepting them creates scope creep, wastes engineering cycles, and breaks alignment with the product plan.

> **Scenario:** A team generates a test coverage report using only the unit test files — without the spec's acceptance criteria. The report states 95% of code lines are covered.
>
> **Likely outcome:** The number measures code line execution, not criterion coverage. The feature may achieve near-perfect coverage while failing entirely to deliver the intended user value — if the tests were never mapped to human-validated acceptance criteria.

The pattern is consistent: the AI is not wrong because it is incompetent. It is wrong because it is _contextually blind_. It has never seen the architecture review. It has never read the sprint contract. It only knows the input it was handed — and it will produce something that looks finished regardless.

**Gemini:** In a spec-driven, AI-native lifecycle, large language models excel at structural translation — turning a concrete spec into a technical architecture. However, if the foundational specification is vague, incomplete, or unapproved, the agent will not stop and ask for clarification. It will confidently extrapolate and fill those logical gaps with statistically plausible but completely unverified assumptions.

---

## Part 2: The Review Paradox

If context isolation is the first failure mode of AI-native delivery, the second is subtler and harder to fix: the review loop itself requires expertise that the people doing the reviewing may not yet have.

**Interviewer:** Given that human engineering review is critical, and automation bias exists and that experience drives expertise. How can new engineers gain that experience purely through the act of review?

**Gemini:** When engineers skip the act of writing code and jump straight into reviewing AI-generated output, traditional learning mechanisms break down. You cannot build deep engineering intuition by just checking a box or reading a polished diff; your brain treats it as passive consumption, which triggers automation bias. For new engineers to build genuine expertise purely through review, the review process itself must be transformed from a passive inspection into an active cognitive exercise.

Gemini outlined four mechanisms for this transformation: tracing code back through its parent artifacts (LLD → HLD → spec), "blind variance" where engineers draft their own solution before opening the AI output, adversarial questioning that hunts for failure modes rather than confirming correctness, and writing Architecture Decision Records to force the articulation of _why_ a system was built as it was.

> _"If you pull a lever and a fully formed block of code appears, you have learned how to pull a lever. If you are forced to dissect that code, trace its ancestry, debate its structural trade-offs, and defend its security model to your team — you are engineering."_

**Interviewer:** So should a junior software engineer be able to write code? Should they be able to single-step through failing code in a debugger?

**Gemini:** Yes, absolutely. An AI-native software engineer — even a junior one — must still be able to write code and proficiently use a debugger. If you cannot write code, you cannot effectively review it, modify it, or prompt an AI to generate it accurately. AI is excellent at generating the first 80% of a feature — the boilerplate and happy paths. The final 20% consists of integration, unique business edge cases, and environment-specific bugs. Solving this "last mile" almost always requires a human developer to manually dive into the codebase and write precise, targeted code.

**Interviewer:** So in effect they have to do the job at the same time as the AI?

**Gemini:** Exactly. They aren't bypassing the work; they are changing what work they do. Instead of doing the raw labor of synthesizing the lines, they are acting as co-pilot, inspector, and structural engineer simultaneously. If a junior engineer just hits "accept" on an AI output, they aren't actually doing the job — they are just letting the AI ship unverified code.

```
Traditional Model:
[Human Synthesizes Code] ──▶ [Human Tests/Debugs] ──▶ [Human Deploys]

AI-Native Model:
[AI Synthesizes Code]
        │
        ▼
[Human Inspects + Validates + Stress-Tests] ──▶ [Human Deploys]
```

**Interviewer:** Yes — but again, how are they able to validate the AI's work if they themselves have never done that work?

**Gemini:** You have hit the exact logical paradox of the AI-native developer lifecycle: how do you judge the quality of a masterpiece if you've never picked up a paintbrush? If a junior engineer has never manually hit a database deadlock, written an unindexed query, or watched a thread pool starve, they lack the scar tissue required to recognize those exact failures hidden in a pristine wall of AI-generated code.

---

## Part 3: The Cognitive Load Reframe

The efficiency argument for AI-native development often leans on a specific claim: that it removes "low-value" cognitive load — syntax friction, boilerplate, framework configuration — and frees engineers to focus on higher-order thinking. The interviewer had a problem with this framing.

**Interviewer:** For an experienced developer, passive synthesis is low cognitive load — true. But learning code initially without experience is a high cognitive load, is it not? Learning something new is by definition high cognitive load. Do you disagree?

**Gemini:** You are entirely right, and I absolutely do not disagree. Learning to code from scratch — whether you are a beginner manually typing it out or a junior engineer trying to decipher an AI's output — is a massive, exhausting cognitive load. My previous point was poorly phrased, and you caught the flaw in it. Where the real difference lies is not in _lowering_ the cognitive load, but in changing what your brain is spending that cognitive energy on.

**Gemini:** You make a completely fair point. Modern LSP-driven editors, real-time linters, and expressive compilers already drove physical syntax friction down to near zero before generative AI hit the scene. So the real cognitive load that AI removes is not syntax — it is _translation fatigue_: the sheer volume of mundane decisions required to translate a known intent into working code across a specific framework, library version, and project convention.

| Traditional Junior Focus                                                                             | AI-Native Junior Focus                                                                                                                             |
| ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| ~70% Synthesis — boilerplate, formatting, implementing basic loops, debugging syntax errors          | ~10% Synthesis — targeted glue code, specialised business logic, minor refactors                                                                   |
| ~30% Investigation & Control — verifying business logic, testing edge cases, system design alignment | ~90% Investigation & Control — trimming hallucinated logic, tracing architectural boundaries, debugging complex integration state, deep validation |

But this table contains a hidden assumption: that a junior engineer on day one can operate effectively at 90% Investigation and Control. The interviewer spotted it immediately.

**Interviewer:** Yes that is true; even as an experienced developer I've found reviewing AI a challenge. So agreeing that "AI-native must be vastly better earlier in their career" — but without the friction guardrail, how can we train these new developers to be better at doing their job quicker?

---

## Part 4: The Business Trap

This is where the conversation moved from engineering theory to economic reality — and where the argument becomes most urgent.

**Interviewer:** By artificially injecting scenarios, you decouple the learning from the artifact. The artifact can be produced and look "ready" — but the learning isn't yet complete. From a business perspective, in the short term this learning and training section is a cost and would be expected to be cut. Having the friction inbuilt in the time to be "ready" implicitly prevented this from happening. Would you agree?

**Gemini:** You have hit on the exact structural flaw of the optimistic AI-native efficiency narrative, and I entirely agree. The "friction education" of manual construction is not low-value — it is the foundation of mechanical sympathy. Decoupling training from delivery turns learning into an explicit corporate cost centre. In the real business world, when a cost centre stands between an executive and a faster release date, that cost centre gets cut.

```
Traditional Feature Timeline (Inbuilt Training):
[   Manual Construction & Friction Education   ] ──▶ [ Feature Ready & Engineer Trained ]

AI-Native Feature Timeline (Decoupled Training):
[ AI Gen ] ──▶ [ Artifact "Ready" ] ───?───▶ [ Fault Injection / Training Section ]
                                                       ▲
                                                       │
                                           (Executive cuts this step
                                            to ship 3 weeks faster)
```

> **Scenario:** A team skips human review after each AI-generated artifact. Engineers accept output directly, decisions go undocumented, and architectural reasoning is never discussed. Six months later nobody can explain the codebase design, junior engineers have stopped proposing solutions, and onboarding takes weeks longer than before.
>
> **Likely outcome:** A negative footprint problem — not a quality problem with individual artifacts, but a systemic erosion of team capability. The habit of bypassing human judgment creates a black-box codebase, knowledge silos, and a junior cohort that never developed the intuition to debug what they ship.

The structural problem is this: historically, you could not get the product without paying the cognitive tax of the human building it. The feature was not ready until the engineer had climbed the learning curve. The learning was _inside_ the delivery contract, invisible to business stakeholders and immune to cost-cutting.

Generative AI breaks that contract. The artifact looks finished on day one. The manager sees deployable code. The training step — fault injection, adversarial debugging, traceability mapping — looks like an artificial delay invented by engineering to slow things down.

**Gemini:** By cutting the "friction education" to capture short-term velocity, companies are running a dangerous experiment: optimising for immediate artifact output at the direct expense of future organisational capability. Six to twelve months later, the business hits a catastrophic wall. The codebase has evolved into an accidental web of unverified AI architectures. A complex systemic edge-case failure occurs in production. Senior engineers are entirely maxed out firefighting. Junior engineers are completely helpless because they were never allowed the time to build the foundational intuition required to debug a live, broken system.

**Gemini:** Engineering leadership must redefine the contract with the business. A feature artifact is not "Ready" when it is written; it is only "Ready" when it is verified, controlled, and explicitly defended by a human operator. By making human validation artifacts a strict gateway for deployment, you bake the friction back into the delivery timeline. The business cannot cut the training because the training is the validation process required to ship.

---

## Closing: The Feature That Funded the Discipline

> _"The inbuilt friction of the past wasn't a bug. It was the feature that kept the engineering discipline alive. If we don't deliberately re-engineer that friction into our modern workflows, the entire system falls apart."_

The traditional model had an organic defence mechanism: you could not get the product without paying the cognitive tax of the human building it. That tax was not waste — it was the budget that funded the engineering team's future capability.

AI removes the tax upfront. What remains is a choice, made explicitly or by omission, about whether to reinvest it. Companies that treat AI as a replacement for engineering intuition rather than a multiplier of it are borrowing against a capability loan they do not yet know they have taken out.

The companies that navigate this transition successfully will not be the ones who ship the fastest in month one. They will be the ones who recognised that the value of an engineer was never the physical typing of syntax — it was always the depth of systemic understanding behind it. And they structured their delivery contracts accordingly, making human verification not an optional post-step, but the definition of done.

The friction feature was never the enemy of velocity. It was, quietly, its guarantor.

---


