# Historical blog source reconciliation — October 14, 2026

Baseline: commit `92ef9039dd0968be34bd2463b27ec27ef342a669`, 34 older original videos with unbounded historical coverage. This audit changes future source eligibility; it does not publish or rewrite articles.

## Result

- All 34 originals have an article-reference inventory and an explicit reservation decision.
- **2 originals have one verified unused passage each**, available for selection after topic rotation and duplication checks: 636 and 772 words after removing overlapping rolling captions.
- **28 originals retain conservative whole-recording reservations.** These are not precise claims that every minute was previously published. Their old articles cover their main topics; finer unused details have not been certified. They are not automatic-reuse inventory.
- **4 originals remain blocked for missing real caption timing.** YouTube returned `IpBlocked` during bounded recovery attempts from both DGX and the Mac. No timing was inferred from word positions.
- The 16 existing excerpt aliases and their original ranges remain enforced. A published clip overrides any historical release it overlaps. Shorts remain excluded (456 in this snapshot).
- Existing source-grounded writing, fact checks, approvals, guide-intent checks and broad-topic rotation remain mandatory. An available passage is not a published article.

## Verified unused passages

### Balancing training goals with family time

Original: [How I Train Around Elbow & Wrist Pain Without Skipping Progressive Overload](https://www.youtube.com/watch?v=FV2IyHFDWTQ&t=2512s)
Range: **41:52–45:03**; exact seconds `2512.319–2703.28`; 636 words.

The historical pain article covers positioning, supports, equipment and seasonal cutting. It does not tell the Hershey Park / skipped Sunday run story or develop intentional family-time decisions. Reviewed full article and this entire caption passage; other family-workout articles cover lifting with children, not this time-allocation story.

Caption evidence:
- 41:52: “in general I think you should have fun”
- 43:29: “both a cardio form and a strength”
- 44:57: “think is a big measure of success.”

Related historical articles: `mock:how-i-train-around-elbow-wrist-pain-without-skipping-progressive-overload`

### Checking AI-written biographies and choosing website photos

Original: [Build BJJ Buddy Live + Speediance | AI Dev Session 🔥](https://www.youtube.com/watch?v=_43qCeKVCNw&t=3785s)
Range: **1:03:05–1:07:25**; exact seconds `3785.4–4045.3590000000004`; 772 words.

The stream article covers BJJ Buddy backend, coding agents, lifting and wearable metrics. This separate website segment describes correcting a false claim about winning all white-belt matches and checking Facebook photo selections. Reviewed full stream article and full passage, and searched legacy corpus for these incidents; neither incident appears in the historical article corpus.

Caption evidence:
- 1:03:05: “launch. So, first it was my new website”
- 1:05:16: “is that I was so new to BJJ and so happy”
- 1:07:20: “information that I would want on there.”

Related historical articles: `mock:build-bjj-buddy-live-speediance-ai-dev-session`

## All 34 originals

| Original | Decision | Article records |
|---|---|---|
| [Speediance V3 Software Is Here… But Is It Good?](https://www.youtube.com/watch?v=-BuRtR6WNOc) (`-BuRtR6WNOc`) | Entire recording reserved; no certified unused passage | 2 |
| [AEKE K1 vs Speediance: The Camera Changes Everything](https://www.youtube.com/watch?v=5BLoGlR1DZ4) (`5BLoGlR1DZ4`) | Entire recording reserved; no certified unused passage | 1 |
| [Whoop 5.0 Garments Failed Grapplers](https://www.youtube.com/watch?v=69-NIAJIhtA) (`69-NIAJIhtA`) | Entire recording reserved; no certified unused passage | 1 |
| [What AI Actually Does for Me: Codex, Claude, Blender & Everyday Tasks](https://www.youtube.com/watch?v=9JA9pjANcPo) (`9JA9pjANcPo`) | Entire recording reserved; no certified unused passage | 1 |
| [Progressive Overload: The Science of Never Plateauing (Animated)](https://www.youtube.com/watch?v=BJXsv663p4E) (`BJXsv663p4E`) | Timing missing; hold | 1 |
| [Basics of Node Part 1](https://www.youtube.com/watch?v=BeNyWQYINz8) (`BeNyWQYINz8`) | Entire recording reserved; no certified unused passage | 1 |
| [How I Train Around Elbow & Wrist Pain Without Skipping Progressive Overload](https://www.youtube.com/watch?v=FV2IyHFDWTQ) (`FV2IyHFDWTQ`) | One verified passage released; remainder reserved | 1 |
| [I Owe Greg Doucette an Apology](https://www.youtube.com/watch?v=GzqAzoSKBWQ) (`GzqAzoSKBWQ`) | Entire recording reserved; no certified unused passage | 1 |
| [Speediance 2S vs Original: Real User Review, Tips & Upgrades After 600,000+ lbs Lifted!](https://www.youtube.com/watch?v=J3W59IR2Las) (`J3W59IR2Las`) | Entire recording reserved; no certified unused passage | 6 |
| [Build Your Best Training Split: Arnold Blueprint (PPL), Full Body, or Bro Split?](https://www.youtube.com/watch?v=JxRdaMTOOHo) (`JxRdaMTOOHo`) | Entire recording reserved; no certified unused passage | 3 |
| [Extreme Weight Loss The Honest Truth About My Transformation, Prescription Meds, and Fitness Journey](https://www.youtube.com/watch?v=M07Aq93TCkM) (`M07Aq93TCkM`) | Entire recording reserved; no certified unused passage | 5 |
| [BJJ Buddy Progress, OpenClaw basics/setup, my use cases](https://www.youtube.com/watch?v=MsdQU6uuHaE) (`MsdQU6uuHaE`) | Entire recording reserved; no certified unused passage | 1 |
| [Stop Asking How Many Days You Should Train (Do This Instead)](https://www.youtube.com/watch?v=NDe6b6yzrCk) (`NDe6b6yzrCk`) | Timing missing; hold | 1 |
| [Speediance 2s Max Lat Pulldown 260lbs -Does it break the machine?](https://www.youtube.com/watch?v=NKY4uXpFTns) (`NKY4uXpFTns`) | Entire recording reserved; no certified unused passage | 8 |
| [Family Fitness Fun: Speediance Workout With Dad & Daughter / Safe Lifting for Kids](https://www.youtube.com/watch?v=Ndso4yB1GbM) (`Ndso4yB1GbM`) | Entire recording reserved; no certified unused passage | 2 |
| [INNODIGYM vs Speediance: Smart Home Gym Comparison](https://www.youtube.com/watch?v=UMCJi_Mkn8w) (`UMCJi_Mkn8w`) | Timing missing; hold | 1 |
| [Healthy Foods Can Still Make You Gain Fat (Here's Why)"](https://www.youtube.com/watch?v=VRIcxx1GD-8) (`VRIcxx1GD-8`) | Timing missing; hold | 1 |
| [Speediance 2S V3.1 Review: New Safety Start, Firmware Changes & Real‑World Lifting](https://www.youtube.com/watch?v=ZbEstduW90I) (`ZbEstduW90I`) | Entire recording reserved; no certified unused passage | 7 |
| [Build BJJ Buddy Live + Speediance / AI Dev Session 🔥](https://www.youtube.com/watch?v=_43qCeKVCNw) (`_43qCeKVCNw`) | One verified passage released; remainder reserved | 1 |
| [Speediance 2S 1RM EXPOSED: How to Actually Unlock 260lbs on the 2S](https://www.youtube.com/watch?v=cN4YyRwoxXc) (`cN4YyRwoxXc`) | Entire recording reserved; no certified unused passage | 4 |
| [Purple Belt Changed Everything: Coaching, Ego, Real Progress](https://www.youtube.com/watch?v=csEZTntGi3E) (`csEZTntGi3E`) | Entire recording reserved; no certified unused passage | 1 |
| [Is Mike Israetel Really a Legit BJJ Black Belt? My Experience & Why the Internet Is Wrong](https://www.youtube.com/watch?v=dG8GPamRHmA) (`dG8GPamRHmA`) | Entire recording reserved; no certified unused passage | 6 |
| [How I Avoided Blue Belt Blues in Brazilian Jiu-Jitsu](https://www.youtube.com/watch?v=h6wBT76Ivq8) (`h6wBT76Ivq8`) | Entire recording reserved; no certified unused passage | 1 |
| [Is Tonal a scam!](https://www.youtube.com/watch?v=iOYPjqDTdas) (`iOYPjqDTdas`) | Entire recording reserved; no certified unused passage | 4 |
| [Is the Speediance Ring Actually Trash? Here's the Truth](https://www.youtube.com/watch?v=kgjZDRp90kA) (`kgjZDRp90kA`) | Entire recording reserved; no certified unused passage | 1 |
| [What White Belts Actually Need to Learn in Brazilian Jiu-Jitsu](https://www.youtube.com/watch?v=lUpvAAglrEs) (`lUpvAAglrEs`) | Entire recording reserved; no certified unused passage | 1 |
| [Hermes Desktop vs Claude Code vs Codex vs MiniMax Code vs OpenClaw vs Antigravity — Live Showdown](https://www.youtube.com/watch?v=moinyXD_iMc) (`moinyXD_iMc`) | Entire recording reserved; no certified unused passage | 1 |
| [Speediance Spotter Modes Explained: How to Safely Do Drop Sets & Avoid Injury](https://www.youtube.com/watch?v=pMdn1a5EA1s) (`pMdn1a5EA1s`) | Entire recording reserved; no certified unused passage | 3 |
| [Speediance 2s Modes Explained](https://www.youtube.com/watch?v=qyXBR0vhxxw) (`qyXBR0vhxxw`) | Entire recording reserved; no certified unused passage | 2 |
| [Speediance Gym Monster 3 & Ultra: Why I'm Keeping My 2S](https://www.youtube.com/watch?v=txBZRCIcbXA) (`txBZRCIcbXA`) | Entire recording reserved; no certified unused passage | 1 |
| [Speediance first thing to do, Immediately change this setting!](https://www.youtube.com/watch?v=udS5Iu6SXWM) (`udS5Iu6SXWM`) | Entire recording reserved; no certified unused passage | 5 |
| [Speediance Broke Partner Mode?! The “Lost” Free Lift Feature Demo With My Daughter](https://www.youtube.com/watch?v=wMT8i8E14NU) (`wMT8i8E14NU`) | Entire recording reserved; no certified unused passage | 6 |
| [OpenClaw basics, current setup, my primary use case](https://www.youtube.com/watch?v=xFknwPPhVnI) (`xFknwPPhVnI`) | Entire recording reserved; no certified unused passage | 5 |
| [Speediance 2s first look and demo](https://www.youtube.com/watch?v=yeYeMNBC2Lc) (`yeYeMNBC2Lc`) | Entire recording reserved; no certified unused passage | 2 |

## Evidence and limits

The manifest `scripts/dgx/blog-historical-ranges.json` records exact intervals, caption quotations for each release, source hashes, article references and article hashes. Its corpus hash covers raw legacy posts (including duplicate slugs and retired posts), Markdown overrides, and consolidation configuration. Routine new articles with committed `source_section` metadata do not invalidate it; they consume their own ranges. Any unbounded article addition or historical article/guide edit closes all historical releases pending review. Source transcript, duration, identity or recording-date drift closes the affected source.

The V3 recording `-BuRtR6WNOc` is 28:16, but its catalog chapters run past 34 minutes and fail to align with its actual captions. This audit bypasses those bad chapter boundaries only with an explicit full-recording reservation; it does not silently repair the public chapter list or enable its reuse.

Old articles contain unsupported or suspect assertions. Mapping a topic does not validate those claims. Future writing must use the original caption passage, not old article prose. This audit does not certify the quality of every old article.

Coverage remains intentionally conservative: the 28 whole-recording reservations can be refined later by reviewing a specific passage against the full legacy corpus. The four missing-caption originals are Progressive Overload (BJXsv663p4E), Training Frequency (NDe6b6yzrCk), INNODIGYM (UMCJi_Mkn8w), and Nutrition (VRIcxx1GD-8).

## Validation

53 Python regression tests passed (28 section/coverage, 17 quality, 6 editorial, 2 identity). The live source-selection dry run returned both released passages after the existing duplication and topic-rotation gates. No draft/review/publish stage or model call was run as a test.

Production build passed: 2,444 sitemap pages, 9,951 hreflang links with zero failures, 752 valid translated blog files, and zero broken internal links.
