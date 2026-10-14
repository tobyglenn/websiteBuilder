# Blog source and quality migration — 2026-10-14

Implemented on the DGX canonical publisher. No trial article was published or queued.

- 41 Python checks cover source identity, broad-topic rotation, source grounding, immutable approval, explicit model/server identity, final publication guards, timestamp capture, section reuse, edited clips, and metadata formatting/recovery.
- Production frontend build passed: 2,444 sitemap URLs; 2,658 HTML files; no broken internal links; 9,951 hreflang links with no failures; all 752 translated blog files valid.
- Recovered actual timed captions for 38 non-Short uploads. Backfill stopped when YouTube began temporarily blocking caption requests; existing progress is retained. Future bounded imports also preserve timing.
- 456 catalog Shorts are excluded from all blog source selection and lineage matching. Sixteen non-Short excerpts map to five originals, including multi-range edits. The machine-readable migration inventory lists exact ranges, hashes and evidence-match ratios.
- Historical coverage remains unresolved for 34 originals. No sufficiently substantial unambiguously unused section remains eligible in this initial snapshot. This is an explicit quality hold, not evidence that every minute was used. New long-form sources enter the section workflow; resolving older coverage requires a supported historical mapping. No old video is automatically marked fresh merely because source tracking changed.
- Real model trials used the pinned MiniMax M3 writer/fact checker and Gemini 3 Flash Preview editor. The new gate held a draft for unmatched numeric forms, caught an output truncation, rejected an added contextual characterization, and rejected invalid evidence references. Increasing the output budget resolved the truncation; source passages now have stable IDs that resolve to actual source quotations. One bounded editorial repair is permitted, followed by a fresh audit. The live trials did not produce an approved publication; the held responses are retained under `/tmp/toft-section-quality-*` on DGX. Passing synthetic approval and failure tests does not prove all future model prose correct.

The original three deleted articles expanded 93, 183 and 130-word Shorts into roughly 900–1,100-word posts. Their reviewer did not receive the transcripts. The replacement publisher supplies the complete selected section to the writer, editor and independent fact checker, binds approval to the exact article and source range, and refuses publication when evidence or model identity is incomplete.

The historical provider logs show Google fallback on two drafting days and MiniMax on the third, with Google reviewing all three. Exact historical model versions were not logged and cannot be asserted.
