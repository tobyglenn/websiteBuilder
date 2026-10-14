---
layout: "../../layouts/MarkdownBlogPostLayout.astro"
title: "Speediance 2S 1RM and Weight Limits: Customize, Dynamic Modes and PRs"
description: "Understand the Speediance 2S Customize limit, dynamic workout weights, estimated 1RM and PR history using the differences I observed in my own test."
date: "2025-11-21"
updated: "2026-10-14"
categories: ["Field Reports"]
tags: ["Speediance", "1RM", "progressive overload", "home gym", "strength training"]
image: "/images/blog/speediance-1rm-system-exposed.jpg"
author: "Toby Glenn Peters"
---

A limit in the Customize input box is not necessarily the same as the machine's resistance limit. That was the important distinction in my 2S test. I investigated a report that the machine could not provide more than 220 lb outside Free Lift, and found that dynamic workout modes used a different route to select weight.

This guide combines the repeated write-ups of that investigation. It describes the software behavior I observed at the time; menus and progression behavior may change with later releases.

## The short answer

| Value on the screen | What it means | What not to assume |
| --- | --- | --- |
| Customize entry | A manually requested workout load | Its input ceiling is the hardware ceiling |
| Dynamic-mode target | A load selected using exercise settings and an estimate | Every mode will choose the same load |
| Estimated 1RM | A calculated strength estimate from performance | The machine physically delivered that number |
| PR entry | A recorded result for a particular exercise and session | Every partial or interrupted set creates one |
| Free Lift setting | A directly selected load in that mode | Its behavior proves all custom-workout paths work the same way |

## The question I was trying to answer

An owner entered 260 lb through Customize and saw the value return to 220 lb. I had already shown heavy loading in Free Lift, but that did not answer what happened in a programmed workout. I set up a separate test instead of treating the two modes as interchangeable.

On the version I tested, the manual Customize field capped the entry at 220 lb. Dynamic modes used the exercise's estimated 1RM and the selected rep or training settings to calculate a working weight. Those calculated targets could exceed the manual-entry ceiling on the 2S.

That observation explains the apparent contradiction. It does not mean every owner should try to force a higher estimate, or that a software limit should be bypassed. The load still needs to be appropriate for the exercise, the equipment and the person lifting.

## Where the estimate came from

In the exercise statistics I inspected, a prior deadlift performance of 195 lb for 13 reps corresponded to an estimated 1RM of 293 lb. That is a calculation from a set, not a successful single repetition at 293 lb.

Another entry showed no PR after I attempted a heavier set but completed fewer reps than the prescribed target. That missing result initially made the system look inconsistent. The important detail was that the records did not describe equivalent completed sets.

A later completed set produced an updated estimate. The test showed why exercise history and completion matter when diagnosing the next workout's suggested weight. It did not establish the exact formula or every internal rule used by Speediance.

## Why a large 1RM number is not a capacity claim

An estimated maximum can be higher than the resistance available from the machine. A formula can infer a larger hypothetical single-rep number from a submaximal set with many repetitions. That does not create additional physical resistance.

Keep the three questions separate: what load the machine actually applied, what repetitions you completed, and what estimate the software displayed afterward. Reporting only the estimate can make an ordinary training log look like a hardware claim it does not support.

The separate [260 lb pulldown field test](/blog/speediance-260lb-lat-pulldown-machine-test/) concerns an observed loading session. It is not evidence for the accuracy of a 1RM formula.

## A practical way to investigate an unexpected target

Start by checking the exact machine model, software version, exercise entry and training mode. Then compare the prescribed reps with the reps recorded in the completed set. Open the individual exercise history rather than relying only on the session summary.

If an expected PR is missing, document the target, the completed reps and the displayed result. Do not inflate an estimate or attempt an unsafe load just to make the next workout offer a larger number. A useful support report should make the mismatch reproducible without requiring another maximum effort.

If the set ends automatically at the rep target, inspect the [Unlimited Sets setting](/blog/speediance-unlimited-sets-eccentric-mode-setup/). That is a separate behavior from the manual weight-entry ceiling.

## Progression is something to verify over time

My earlier reports also questioned whether automatic progression was behaving as expected in the software I had at the time. One corrected estimate does not prove that every future workout will increase appropriately. Track completed sessions and compare their suggested loads before drawing that conclusion.

My takeaway is to understand which number you are changing. Customize, dynamic targets, PRs and estimated 1RM belong to the same training system, but they are not interchangeable. Once I separated them, the original 220-versus-260 question became much easier to explain.

*Consolidated and revised on October 14, 2026. Earlier overlapping articles now lead to this guide; historical observations are identified in the text.*
