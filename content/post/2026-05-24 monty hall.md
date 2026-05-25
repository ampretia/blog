---
title: 'An Intuitive View of the Monty Hall Problem'
date: '2026-05-24'
summary: 'A simple, friction-free way to conceptualize why switching doors always works in your favor.'
slug: 'intuitive-monty-hall'
layout: post
tags:
    - logic
    - math
    - puzzles
    - probability
    - game-theory
    - decision-making
keywords:
    - monty hall
    - probability
    - intuition
    - switching strategy
    - counterintuitive
    - decision analysis
---

Finally you've made it to the treasure room; a vast hall with gilded ceiling bathing everything with golden light. Three chests stand before guarded by an emissary of The Guardian.
> Well done, adventurer, you have done well to come this far; pray choose a chest to claim your reward; only 1 chest contains a reward; the others merely dashed hope.

Finally, a simple choice: "I choose the middle."
> A fine choice, but first let me show you one of the chests you did not choose.
>
On lifting the creaking lid, it is clear that only dust has even been in this chest.

> But now adventurer we come to the last challenge and choice of your quest? Would you like to change your mind and chose the other chest?
>
After all the adventures and challenges, finally a simple decision: the solution is intuitive. "I will keep my choice; the odds of me being right haven't changed."

> Oh my young adventurer much to still you have.

## The Monty Hall Problem

You may have recognised the above as the Monty Hall problem. A problem with a simple premise that intuitively suggests a simple answer—yet that intuition is wrong. You are much better off changing your choice. I won't go into the history, merely to say that many professional mathematicians have also refused to believe the solution.

When this was mentioned recently in discussion with the kids I recalled a simple visual understanding that shows the correct answer, and itself then becomes the new intuitive solution.

Quick recap then on the rules, 3 doors/chests/… _[delete as applicable]_ behind one is the prize, the others nothing. When you've made your choice, the host/quiz master/dungeon keeper/… _[delete as applicable]_ will always open one of the doors that does not hide the prize. You have the option to choose the as yet unopened door.

We need to determine whether it's better to swap or stay. A win isn't guaranteed, but which choice gives you better odds?

## Starting Position

Start by looking at one starting point, we have the prize behind the middle door, the outer ones have nothing there. It's important to remember that we want to know if _"swap"_ or no swap gives more chance of winning.

![Three closed doors: left, middle, and right](/20260524/doors.png)

You can choose one door—left, middle, or right—which we can display like this:

![Diagram showing three possible initial choices: left, middle, or right door](/20260524/image.png)

As our adventurer did, let's choose the middle door. The host then opens one of the other doors—either left or right. Since you were correct to start with, swapping in this case won't help you.

![Scenario where you chose middle door, the prize is behind middle, and switching loses](/20260524/middle-no-swap.png)

But there are two other cases. Let's go back in time and choose the left door. Swapping to the middle door is the correct choice.
![Scenario where you chose left door, prize is behind middle, and switching wins](/20260524/swap-to-middle.png)

Choosing the right door mirrors this case—swapping is the correct choice.

## Putting It All Together

Remember, we're looking for where the choice between _"swap"_ or _"no swap"_ is best. Here's the complete picture, starting with the prize behind the middle door. Of the three choices you could have made—left, middle, right—in 2 out of 3 cases, swapping is the best course of action. The same is true if the starting condition has the prize behind the left or right door; this same chart is simply 'rotated'. It's worth trying it out yourself to get that 'eureka' moment!

![Complete analysis of all three starting positions showing swap wins in 2 out of 3 cases](/20260524/final.png)

## The End

"But I've come this far; surely there is something I've gained from this quest… ah, the time amulet!"

> But now, adventurer, we come to the last challenge and choice of your quest. Would you like to change your mind and choose the other chest?

What is obvious isn't and therefore I will swap my choice!

> Oh my young adventurer much learnt you have! Here is your reward.
