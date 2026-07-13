# Gauge design QA

- Source visual truth: `/tmp/codex-clipboard-AVtLR8.png`
- Implementation full-view captures: `/tmp/eliteapply-tour-discovery-gauge.png`, `/tmp/eliteapply-tour-submission-gauge.png`
- Implementation focused captures: `/tmp/eliteapply-gauge-discovery-focused.png`, `/tmp/eliteapply-gauge-submission-focused.png`
- Responsive capture: `/tmp/eliteapply-tour-mobile-gauge.png`
- Viewports: 1440 × 900 desktop; 390 × 844 mobile
- States: programme fit at 94%; submission readiness at 92%

## Full-view comparison evidence

The reference establishes a speedometer model: progress begins at the lower-left, follows a 180-degree arc, and is reinforced by a value-driven needle. Both EliteApply gauges now use that same directional model while preserving the product's restrained cobalt state language and surrounding layout.

## Focused-region comparison evidence

Focused captures confirm that the 94% and 92% arcs start at the lower-left and terminate near the lower-right. Each needle endpoint is calculated from the same clamped percentage as its arc and text label. The displayed number, arc length, and needle direction therefore remain synchronized.

## Required fidelity surfaces

- Fonts and typography: Existing Source Serif 4 and DM Sans hierarchy is preserved; the percentage remains the primary gauge label.
- Spacing and layout rhythm: Semicircular gauges fit their existing summary columns without changing panel proportions or causing overflow.
- Colors and visual tokens: The reference's multi-colour risk scale is intentionally replaced by EliteApply cobalt because fit/readiness is not a danger scale. Track, progress, needle, and labels use existing semantic marketing tokens.
- Image and asset quality: The source is used as a geometry reference. The implementation is a resolution-independent data visualization, so it remains sharp at desktop and mobile sizes.
- Copy and content: Existing “strong fit” and “ready” labels remain unchanged and correspond to the displayed values.

## Findings

No actionable P0, P1, or P2 mismatches remain. The restrained single-colour scale is an intentional brand-system deviation from the reference.

## Comparison history

1. Earlier implementation used full circular rings with an arbitrary top starting point.
2. Replaced them with a true 180-degree lower-left-to-lower-right path, percentage-derived progress length, and percentage-derived needle.
3. Recaptured desktop, focused, and mobile states; browser tests confirmed `94 6` and `92 8` progress ratios and no console errors.
4. Final polish lowered the pivot, shortened the needle, moved the copy above its path, reduced the arc weight, and removed the oversized rounded progress cap. Focused captures confirm clear separation between text, needle, and arc.

## Follow-up polish

No blocking follow-up. A multi-band scale should only be introduced if product semantics later define meaningful score ranges.

final result: passed
