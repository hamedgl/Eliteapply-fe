# Design QA — homepage comparison section

final result: passed

## Evidence

- Source visual: `/home/hamed/Eliteapply-fe/ChatGPT Image Jul 14, 2026, 09_50_46 PM.png`
- Desktop implementation: `/tmp/eliteapply-comparison-pass1.png`
- Mobile implementation: `/tmp/eliteapply-comparison-mobile-pass1.png`
- Mobile outcome card: `/tmp/eliteapply-comparison-mobile-right.png`
- Full same-frame comparison: `/tmp/eliteapply-comparison-full.png`
- Focused same-frame comparison: `/tmp/eliteapply-comparison-focused.png`
- Desktop viewport: 1672×941, homepage scrolled to the comparison section beneath the sticky header
- Mobile viewport: 390×844, cards stacked in source order

## Comparison passes

### Pass 1

- P1 — Layout: headline wrapped to two lines and pushed the cards too far below the reference. Fixed by matching the 48px Source Serif display scale, widening the title measure and tightening section spacing.
- P1 — Imagery: both supplied visuals were clipped vertically in the desktop media slots. Fixed by fitting each complete 1052×712 frame inside its card without cropping.
- P2 — Density: card rows and media were too tall. Fixed by matching the reference's 310px desktop media slot and compact proof-row rhythm.
- P2 — Transformation cue: the arrow was vertically centered against the full card instead of the image transition. Fixed by aligning it to the media midpoint on desktop and rotating it for stacked layouts.

### Final pass

- Fidelity: headline hierarchy, semantic colors, card surfaces, 92px headers, 309px media slots, 36px proof rows, icons and card alignment match the selected direction.
- Assets: both supplied 1052×712 images load as optimized WebP files; transparency is preserved for the structured product collage.
- Responsiveness: cards stack cleanly at tablet/mobile widths, the arrow changes direction, and the 390px check reports zero horizontal overflow.
- Accessibility: semantic articles and headings are retained, both images have descriptive alt text, decorative icons are hidden, and the mobile navigation remains keyboard/ARIA operable.
- Runtime: production build passes, the responsive interaction check passes, and browser console/page errors are empty.
