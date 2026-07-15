# Design QA — homepage workflow section

final result: passed

## Evidence

- Source visual truth: `/tmp/codex-clipboard-aoba2A.png`
- Gauge correction reference: `/tmp/codex-clipboard-FJHPob.png`
- Desktop implementation: `/tmp/eliteapply-workflow-desktop.png`
- Mobile implementation: `/tmp/eliteapply-workflow-mobile.png`
- Full same-frame comparison: `/tmp/eliteapply-workflow-comparison.png`
- Focused gauge comparison: `/tmp/eliteapply-workflow-gauge-comparison.png`
- Desktop viewport: 1600×1100; stage 1 selected and tour paused for stable capture.
- Mobile viewport: 390×844; stage 1 selected and tour paused for stable capture.

## Findings and comparison history

### Pass 1

- P2 — Progress gauge alignment: the percentage sat too high against the arc and the label felt detached. Fixed by increasing the arc weight, rounding the active stroke and centring the value/label as one block in the open area.

### Final pass

- No actionable P0, P1 or P2 findings remain.
- Typography: Source Serif remains limited to the marketing heading; the dense workflow UI uses DM Sans with readable weights and sizes.
- Layout: the four-stage rail, application header, stage navigation, checklist and progress panel match the reference hierarchy without clipping. The mobile layout becomes one column and has no page overflow.
- Colour: semantic cobalt, green and cool-slate tokens match the existing EliteApply system. The reference's one-off purple final stage was intentionally kept cobalt for brand consistency.
- Assets and icons: the source is a code-native product UI with no raster imagery to reproduce. Existing Lucide icons are used consistently; no placeholder or handcrafted icon assets were introduced.
- Copy: realistic application-stage content preserves the reference's meaning while matching EliteApply terminology and responsible-clarity principles.
- Interaction: automatic stage progression, manual stage selection, pause/play and the full-application link work. Selecting stage 2 updated the central checklist and progress state at both viewports.
- Runtime: browser console/page errors were empty; desktop and mobile overflow checks passed; all 12 landing-page Playwright tests passed.

## Focused comparison

The gauge received a dedicated same-frame comparison because its text alignment and arc treatment were the final fidelity-sensitive detail. No other focused crop was needed: the full comparison uses dedicated section captures at legible native density.

## Previous completed QA

The homepage comparison section previously passed responsive, image-fit, transformation-cue, semantic and browser checks. Its supplied WebP assets and stacked mobile layout were not changed by this workflow-section update.
