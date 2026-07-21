---
name: EliteApply
version: 3.1.0
status: production-ready baseline
description: A calm, credible and quietly premium design system for scholarship and academic application workflows.
sourceOfTruth:
  tokens: eliteapply-design.prod.json
  narrative: eliteapply-design.prod.md
---

# EliteApply Production Design System

## 1. Purpose and source-of-truth policy

EliteApply is a scholarship and academic application workspace. It should help applicants organise requirements, develop stronger written materials, understand system state and take the next responsible action without feeling pressured or losing ownership of their work.

This document is the human-readable design, content, marketing and SEO contract. `eliteapply-design.prod.json` is the machine-readable token and component contract.

When the two files differ:

1. JSON wins for token values, responsive constants and component requirements.
2. Markdown wins for rationale, positioning, content strategy and marketing guidance.
3. Any mismatch must fail design-system CI and be fixed before release.

## 2. Creative north star: The Academic Compass

EliteApply should feel like a dependable orientation tool for a demanding academic journey.

The visual system combines:

- Editorial academic authority from Source Serif 4.
- Clear, modern workflow controls from DM Sans.
- Cool white and pale slate surfaces.
- Restrained cobalt for actions, selection, focus and informative state.
- Thin structural lines and almost no decorative elevation.
- Precise product proof instead of generic “AI magic.”

The result is calm, credible, focused and quietly premium. It should feel more like a carefully designed editorial workspace than a dashboard assembled from generic SaaS cards.

### Brand promise

**Make the next responsible application step clear without taking ownership away from the student.**

### Brand personality

Calm, credible, precise, supportive and quietly premium.

### Non-negotiable principles

**Responsible clarity.** Prioritise one meaningful next action. Explain consequences and never manufacture urgency.

**Evidence over spectacle.** Earn trust with transparent state, useful examples, real product proof and specific language.

**Student control.** AI-assisted work remains editable. Users can review, save, export, retry and recover.

**Academic warmth.** Use editorial typography and generous whitespace without becoming institutional or cold.

**Accessible by default.** Keyboard support, visible focus, semantic HTML, non-colour state cues and reduced motion are component requirements.

## 3. Audit of the original files

The original direction was strong: the palette was restrained, the academic serif/sans pairing was appropriate, flat surfaces suited a high-trust workflow, and the guidance explicitly rejected fake claims and generic AI styling.

The production gaps were:

- Decimal spacing such as `12.48px` and `17.6px` did not map cleanly to a maintainable spacing scale.
- Routine labels were defined at 12px, which is too small for many interactive contexts.
- The light blue focus ring had insufficient contrast against white; the hardened system uses a cobalt outline plus a light halo.
- Primitive colour names were used directly instead of semantic tokens such as `text.primary`, `action.primary` and `status.warning.background`.
- Component definitions lacked complete state, error, loading, accessibility and interaction contracts.
- The fixed-width application board did not define a strong mobile alternative.
- Marketing direction did not specify page hierarchy, proof, claims, CTA strategy or premium composition.
- SEO did not define indexation, canonicalisation, structured data, public route architecture, metadata or performance budgets.
- There were no analytics privacy rules, automated QA gates or release blockers.
- CSS examples mixed design guidance with implementation snippets, encouraging token drift and one-off values.

Version 3 resolves these gaps while preserving the original “Academic Compass” concept.

## 4. Visual foundations

### 4.1 Colour

The colour system has primitive values and semantic aliases. Product code should consume semantic aliases.

Core semantic roles:

- `background.canvas`: cool application canvas.
- `background.surface`: cards, forms, dialogs and content.
- `background.subtle`: secondary grouping and quiet columns.
- `text.primary`: default product text.
- `text.secondary`: helper copy and secondary information.
- `border.default`: dividers and standard containers.
- `border.strong`: form boundaries and higher-emphasis separators.
- `action.primary`: primary action, link, current selection and informative icon.
- `focus.ring`: visible keyboard focus.
- `status.success`, `status.warning`, `status.danger`: explicit semantic states.

#### Responsible Accent Rule

Cobalt communicates action, selection, focus or meaningful state. It is not decorative confetti.

#### Coral Rule

Coral is a rare marketing waypoint used as a small annotation, editorial marker or accent beside dark text. It must not be used as body text on white, a routine product action or a status colour.

#### Contrast requirements

- Normal text: at least 4.5:1.
- Large text: at least 3:1.
- Interactive boundaries and focus: at least 3:1 against adjacent colours.
- Status must never depend on colour alone.

### 4.2 Typography

**Display and headings:** Source Serif 4, weight 600.  
**Interface:** DM Sans, weights 400, 500, 600 and 700.  
**Code or technical identifiers:** IBM Plex Mono or a system monospace fallback.

Source Serif creates academic authority and warmth. DM Sans keeps controls and dense workflows direct and legible.

Rules:

- Display typography is for marketing statements and primary hierarchy, not buttons or tables.
- Homepage hero display uses Source Serif 4 at weight 500, `clamp(3.4rem, 4.6vw, 4.75rem)`, `0.96` line-height and `-0.03em` letter-spacing for a composed academic-editorial rhythm.
- Interactive labels are at least 14px.
- Twelve-pixel text is limited to non-essential metadata.
- Use sentence case.
- Keep marketing text to roughly 60–70 characters per line and long-form reading text to 65–75.
- Self-host fonts where practical. Use WOFF2, `font-display: swap`, a metric-compatible fallback and only the required weights.

### 4.3 Spacing and geometry

Use the shared 4px-based spacing scale. Do not introduce arbitrary decimal values.

- Action Buttons: Pill shape (`rounded-full`, 9999px radius).
- Icon & Close Controls: 10px-12px rounded squircles.
- Compact cards: 10px radius.
- Panels: 12px radius.
- Dialogs: 14px radius.
- Pills: action buttons, status and count elements.

Primary controls are 44px high. Medium controls are 40px high, small controls are 32px high, and large CTAs are 48px high. Compact 36px controls are permitted only in dense desktop UI and must become touch-safe on small devices.

### 4.4 Elevation

The product is flat by default.

- Resting product cards use a border, not an ambient shadow.
- Popovers and dialogs may use contained elevation because they overlap content.
- Focus uses a clear outline and halo.
- Marketing CTA lift is permitted on hover, but motion remains restrained.
- Never combine a broad decorative shadow with every bordered card.

### 4.5 Motion

Use 120ms, 180ms and 240ms durations. Animate opacity and transform rather than layout.

Motion explains:

- opening or closing navigation,
- selection,
- saving or loading state,
- reversible stage movement,
- modal or popover entry.

Motion must not be used as decoration in the authenticated product. Respect `prefers-reduced-motion`.

## 5. Product layout

### Desktop

- Permanent 264px sidebar above 1024px.
- Workspace max width: 1440px.
- Content gutter: `clamp(16px, 3vw, 32px)`.
- Keep the page title, status and one primary action in a stable header region.
- Use white content surfaces over a cool canvas.

### Tablet

- Collapse permanent navigation at 1024px.
- Prefer a two-column content layout only where both columns remain useful.
- Do not preserve desktop density by shrinking labels or targets.

### Mobile

- Single primary column with 16px gutters.
- Application list is the default; board view is optional.
- Full-width fields and actions where practical.
- Destructive and primary actions must not sit adjacent.
- Sticky actions may be used only when they do not obscure content or keyboard input.

### Application board

Desktop board columns may scroll horizontally, but each card should be approximately 300px wide. Column headers remain visible within the board.

On mobile, use a filterable list grouped by stage. Do not force applicants to navigate a miniature horizontal Kanban. Drag-and-drop is an enhancement; a labelled stage control is always available.

## 6. Component contracts

### Buttons

Variants: `primary`, `secondary`, `ghost`, `outline`, and `danger`.

Component source: `@/components/ui/be-ui-button` (`src/components/ui/be-ui-button.tsx`).

Geometry & Shapes:
- Action buttons across all sizes (`sm`, `md`, `lg`) use full pill geometry (`rounded-full`, 9999px radius).
- Icon buttons (`size="icon"`) use rounded squircle geometry (`rounded-xl`, 10px-12px radius).

Motion Physics & Interactive Feedback:
- Built with Motion (`motion/react`) spring physics (`SPRING_PRESS`: stiffness 500, damping 30, mass 0.6).
- Hover feedback: `whileHover` spring scale 1.02 on desktop pointers.
- Tap/press feedback: `whileTap` spring scale 0.93-0.95 across touch & pointer devices.
- Optional interactive pointer ripple animation (`ripple={true}`).
- Automatically respects `prefers-reduced-motion` via `useReducedMotion()`.

Color Conservation:
- Preserves EliteApply's serene academic color system:
  - Primary: Cobalt (`var(--app-blue)`, `#174bd6`).
  - Secondary / Outline: Surface slate (`var(--app-surface)`, `#ffffff`) with structural line (`var(--app-line)`, `#dfe4ed`).
  - Ghost: Muted ink text (`var(--app-muted)`, `#63708a`) hovering to subtle blue soft tint.
  - Danger: Academic crimson (`var(--app-danger)`, `#b42318`).

Every button supports rest, hover, active, focus-visible, loading and disabled states.

- Loading preserves width and prevents duplicate submission.
- Disabled uses the native disabled state.
- One primary action per visual region.
- Button text describes the result: “Create application,” not “Continue” when the result is creation.

### Links

- Link text describes the destination or action.
- Avoid repeated “Learn more.”
- In body copy, do not rely on colour alone.
- Use links for navigation and buttons for actions.

### Fields

Every field has:

- persistent visible label,
- optional helper text,
- value,
- explicit error and recovery copy,
- correct autocomplete and input type,
- programmatic association using `for`, `aria-describedby` and `aria-invalid` when needed.

Do not clear values after recoverable errors. Do not validate every keystroke unless the feedback genuinely helps.

### Text areas and writing surfaces

- Minimum 128px height and vertical resize.
- Preserve paste, browser spelling tools and keyboard shortcuts.
- Show a word or character guide only when there is a real limit or recommendation.
- Clearly distinguish source material, generated draft and user-edited content.
- Never overwrite a user draft silently.

### Status badges and alerts

Status badges are compact scanning aids, not controls.

Alerts explain:

1. what happened,
2. whether the work is safe,
3. what the applicant can do next.

Blocking errors include a direct recovery action. Do not put an actionable failure only in a temporary toast.

### Navigation and tabs

Use links when each destination has a URL. Use a true tab pattern only for panels that share a page.

- Active navigation uses `aria-current="page"`.
- True tabs use correct roles, roving tabindex and arrow keys.
- Mobile navigation is an off-canvas dialog with a visible close control, scrim and focus restoration.

### Application cards

At rest, show:

- institution or programme,
- application type,
- deadline,
- stage,
- one clear next action,
- no more than two secondary metadata rows.

The card must not become one giant link when it contains selects, menus or buttons.

### Dialogs

Dialogs are for focused decisions, not routine navigation.

- Label the dialog with its visible heading.
- Trap focus and restore it to the trigger.
- Escape closes when safe.
- Destructive confirmation names the object and consequence.
- Long forms belong on pages or dedicated panels, not cramped modals.

### Toasts

- Minimum readable duration for non-critical messages: six seconds.
- Pause on hover or focus.
- Consolidate repeated events and stack no more than three.
- Never use a toast as the only location for an error requiring action.

### Skeletons and loading

Skeletons match final geometry to reduce layout shift. Use explicit loading copy when the task can take more than a moment. Disable shimmer under reduced motion.

## 7. State and recovery language

Recommended base copy:

- Saving: **Saving your changes…**
- Saved: **All changes saved.**
- Offline: **You are offline. Changes will sync when your connection returns.**
- Conflict: **This application changed in another session. Review the latest version before continuing.**
- Generation pending: **Preparing a draft from the information you provided…**
- Generation failed: **We could not prepare this draft. Your original content is safe. Try again or continue manually.**
- Empty applications: **No applications yet. Add one to organise its deadline, requirements and documents.**
- Destructive confirmation: **Delete this application and its workspace? This cannot be undone.**

Product copy should be specific, encouraging, calm, transparent and non-judgmental.

Do not use:

- “guaranteed,”
- “perfect application,”
- “get accepted,”
- fake scarcity,
- unsupported “expert reviewed,”
- claims that AI understands a provider’s decision process.

## 8. Premium marketing direction

Premium does not mean more effects. It means better hierarchy, spacing, composition, proof and restraint.

### Homepage message hierarchy

1. **Outcome:** organise stronger applications with less uncertainty.
2. **Mechanism:** one workspace for deadlines, requirements, evidence and written materials.
3. **Control:** AI-assisted support remains editable and transparent.
4. **Proof:** real workflows, templates, exports, privacy and verifiable customer evidence.

### Recommended hero

**Eyebrow:** Scholarship and academic application workspace

**H1:** Build stronger applications, without losing your voice.

**Supporting copy:** Organise deadlines and requirements, shape your written materials and keep every application moving from one focused workspace.

**Primary CTA:** Start an application  
**Secondary CTA:** See how it works

Use a real product composition showing an application checklist, document state and deadline. Avoid a generic student stock photo, floating AI orb or abstract 3D objects.

#### Homepage hero visual specification

- Use the supplied Oxford campus photograph as a full-bleed architectural backdrop behind both the message and live product preview.
- Ship the background as a 1600×894 WebP near the 220KB hero-image budget; do not load the multi-megabyte source JPEG in production.
- Apply a white directional wash that is strongest beneath the copy and slightly lighter beneath the product preview. The image supplies academic atmosphere without reducing text contrast or product legibility.
- Treat the CSS background as decorative. The adjacent copy and interactive preview carry the hero's meaning, so no duplicate image description is required.
- On tablet and mobile, retain the image with a stronger uniform white wash, stack the product preview below the message and preserve the existing touch-safe actions.
- Keep the display serif at weight 500 with a compact `0.96` line-height; interface copy, CTAs and the product preview remain DM Sans.

#### Before-and-after proof section

- Center the editorial headline and use coral only for the problem word and brand blue only for the outcome word.
- Present “Without EliteApply” and “With EliteApply” as equal, lightly tinted comparison cards with real optimized WebP imagery, status icons and six concise proof rows.
- Keep the desktop transformation arrow between the cards; rotate it vertically when the cards stack below 1024px.
- Preserve the supplied 1052×712 image ratio on mobile and use descriptive alt text for both comparison assets.

### Recommended homepage sequence

1. Hero with product proof.
2. Trust strip using only verifiable proof.
3. Problem-to-outcome narrative.
4. Three-part workflow: organise, write, review.
5. Detailed product walkthrough.
6. Templates or examples.
7. Privacy and responsible AI.
8. Pricing.
9. FAQ.
10. Focused closing CTA.

### Visual composition

- Use editorial asymmetry, not endless equal cards.
- Alternate true white and cool workspace sections.
- Reserve one dark marketing-ink band for proof or the closing CTA.
- Use thin rules, captions, document details and real UI crops.
- Use coral as a small waypoint or annotation.
- Avoid more than three same-weight feature cards in a row.
- Use one strong visual idea per section.

### Claims and proof

Allowed:

- capabilities that exist in the current release,
- documented customer quotes with permission,
- measured outcomes with timeframe, sample size and methodology.

Prohibited:

- guaranteed scholarships or admissions outcomes,
- fabricated acceptance rates, amounts won, time saved or user totals,
- unauthorised university or customer logos,
- countdown timers not tied to a real deadline,
- implying a partnership from public data or compatibility.

## 9. SEO contract

### Indexation

Public marketing, pricing, examples and editorial pages may be `index,follow`.

Authenticated routes, user workspaces, drafts, account pages, checkout state, previews and staging must be `noindex,nofollow`.

Important:

- Do not block a page in `robots.txt` when relying on its `noindex`; the crawler must fetch the page to see the directive.
- Put only canonical, indexable, successful public URLs in the XML sitemap.
- Use one canonical HTTPS host and redirect other host and protocol variants.
- Staging should be authenticated where practical, not merely hidden from navigation.

### Metadata

Every indexable page needs:

- unique title,
- unique meta description,
- canonical URL,
- one descriptive H1,
- Open Graph and social metadata,
- language declaration,
- useful image with explicit dimensions.

Base template:

- Title template: `%s | EliteApply`
- Default title: `EliteApply — Scholarship & Academic Application Workspace`
- Default description: `Organise deadlines, requirements and written materials in one focused workspace for scholarship and academic applications.`

### Recommended public information architecture

Publish a route only when the corresponding capability and useful content exist.

- `/` — category and brand page.
- `/scholarship-application-tracker` — feature page.
- `/scholarship-essay-builder` — feature page.
- `/personal-statement-builder` — feature page.
- `/templates` — curated template hub.
- `/examples` — useful example hub, not thin programmatic pages.
- `/pricing` — transparent pricing.
- `/resources` — editorial guides and applicant education.

Each feature page should answer a distinct search intent and include:

- a clear problem,
- actual workflow,
- screenshots,
- who it is for,
- limitations,
- relevant examples,
- privacy notes,
- FAQ,
- contextual links to pricing and adjacent features.

Do not create dozens of near-duplicate pages by swapping scholarship, country or university names.

### Structured data

Use JSON-LD that matches visible content:

- Homepage: `Organization`, `WebSite`.
- Product or feature landing page: `SoftwareApplication`, `BreadcrumbList`.
- Editorial guide: `Article` or `BlogPosting`, `BreadcrumbList`.

Do not add reviews, ratings, pricing or availability that are not visible and current. Structured data is not a substitute for useful page content.

### Performance and Core Web Vitals

Field targets at the 75th percentile:

- LCP: 2.5 seconds or less.
- INP: 200 milliseconds or less.
- CLS: 0.1 or less.

Implementation direction:

- server-render or statically render indexable marketing content,
- do not hide the primary message behind client-only rendering,
- set explicit media dimensions,
- use responsive AVIF/WebP images,
- lazy-load below-fold media,
- defer non-critical scripts,
- self-host and subset fonts,
- monitor real-user field data.

Suggested budgets:

- Initial marketing JavaScript: 180KB gzip target.
- Hero visual: 220KB where practical.
- Above-fold font files: 160KB total target.

### Editorial quality

- Write for a real applicant question or decision.
- Add authorship, review and update information where useful.
- Include concrete examples, not generic filler.
- Build descriptive internal links among features, examples, guides and pricing.
- Use informative alt text; decorative images use empty alt text.
- Never optimise for keyword density.

## 10. Accessibility contract

Target WCAG 2.2 AA.

Required:

- complete keyboard operation,
- logical focus order,
- visible 3px focus outline with 2px offset,
- persistent field labels,
- non-colour state cues,
- 44x44 primary pointer targets,
- semantic HTML,
- accessible dialogs and menus,
- touch and keyboard alternatives to drag-and-drop,
- live status messages that do not steal focus,
- 200% zoom support,
- reflow at 320 CSS pixels,
- reduced-motion support.

Meaningful icons require accessible names. Decorative icons are hidden.

Any accessibility failure in a primary workflow is a release blocker.

## 11. Analytics and privacy

Analytics must not contain essay text, personal statements, uploaded document content or sensitive field values.

Recommended stable events:

- `marketing_cta_clicked`
- `signup_started`
- `signup_completed`
- `application_created`
- `application_stage_changed`
- `deadline_added`
- `document_created`
- `draft_generation_started`
- `draft_generation_completed`
- `draft_generation_failed`
- `export_started`
- `export_completed`
- `upgrade_viewed`
- `checkout_started`
- `checkout_completed`

Version event properties and document their purpose. Collect only what is needed to improve the product.

## 12. Production quality gates

### Design-system CI

- JSON parses.
- All token references resolve.
- JSON and Markdown versions match.
- Product components do not introduce undocumented raw colours, spacing, radius, typography or shadow values.
- Component stories cover every documented state.

### Automated testing

- axe-core: no serious or critical violations on representative pages.
- Playwright: keyboard navigation, focus restoration, form errors, dialogs, navigation and responsive behaviour.
- Visual regression: 375, 768, 1024 and 1440 pixel widths.
- Lighthouse CI: enforce agreed accessibility, SEO, performance and best-practice thresholds.
- Metadata tests: title, description, canonical, robots and structured data.
- Link checker: no broken internal links or accidental staging URLs.

### Manual testing

- Complete all primary flows using keyboard only.
- VoiceOver or NVDA smoke test.
- 200% zoom and 320 CSS pixel reflow.
- High-contrast mode.
- Reduced motion.
- Slow connection and offline recovery.
- Session expiry.
- Concurrent edit conflict.
- Partial API failure and safe retry.
- Unsupported-claim review.

### Release blockers

Do not release with:

- inaccessible primary workflow,
- missing visible focus,
- failing colour contrast,
- indexable authenticated or staging pages,
- unsupported marketing claims,
- data loss after retry or refresh,
- missing core metadata on an indexable route,
- critical overflow at supported widths.

## 13. Implementation rules

1. Generate CSS variables from `eliteapply-design.prod.json`.
2. Components consume semantic tokens, not primitive colours.
3. Keep raw visual values out of feature code.
4. Build accessible primitives before page-specific compositions.
5. Create Storybook or equivalent stories for every state.
6. Validate token references and Markdown/JSON version consistency in CI.
7. Add visual regression snapshots before broad rollout.
8. Treat this system as a baseline. New patterns require a documented use case, accessibility review and token-compatible implementation.
