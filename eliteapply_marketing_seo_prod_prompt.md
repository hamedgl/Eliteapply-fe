# EliteApply Marketing, SEO and Production-Readiness Implementation Prompt

## Role

Act as a principal product designer, conversion strategist, technical SEO engineer, accessibility specialist and senior frontend engineer.

Audit and improve the existing EliteApply marketing website at `eliteapply.net`.

EliteApply is a **student-facing scholarship application workspace**. It helps students organise scholarship opportunities, requirements, deadlines, personal statements, supporting evidence, documents, references and submission readiness in one calm workspace.

The current visual direction is premium, editorial and restrained:

- Deep navy and royal blue
- Editorial serif headings
- Clean sans-serif UI text
- Generous whitespace
- Product-led interface previews
- Calm, trustworthy and academically credible tone

Preserve this design language. Do not turn the site into a noisy, gradient-heavy, generic AI SaaS landing page.

---

# Primary objective

Transform the current attractive but under-explained landing page into a production-ready marketing system that:

1. Immediately explains what EliteApply is.
2. Makes the target user and use case unmistakable.
3. Demonstrates the product rather than relying on abstract claims.
4. Builds trust before asking for signup.
5. Creates a strong organic-search foundation.
6. Converts qualified visitors into workspace signups.
7. Works exceptionally well on mobile, tablet and desktop.
8. Meets accessibility, performance, privacy and technical SEO standards.
9. Avoids fake reviews, invented statistics, fake university logos or unsupported security claims.

---

# Important positioning decisions

## Product category

Use these phrases consistently:

- Scholarship application workspace
- Scholarship application tracker
- Scholarship application organiser
- Scholarship deadline tracker
- Personal statement workspace
- Scholarship document organiser
- Reference and evidence tracker

Do not primarily target the phrase **scholarship management software**, because that search intent frequently refers to software used by scholarship providers and institutions rather than students.

## Core positioning

EliteApply is not merely a spreadsheet or a deadline tracker.

It is a guided workspace that connects:

- Opportunities
- Requirements
- Deadlines
- Drafts
- Evidence
- Documents
- References
- Submission readiness
- Follow-up actions

## Brand promise

Use the existing idea of a “calm workspace” as an emotional differentiator, but combine it with clear, searchable product language.

Recommended positioning line:

> One calm workspace to plan, write and submit stronger scholarship applications.

## AI positioning

If AI assistance exists, do not lead with “AI writes your application.”

Position AI as optional assistance for:

- Structuring ideas
- Identifying missing evidence
- Reviewing clarity
- Comparing a draft with requirements
- Suggesting questions
- Improving organisation

Never imply guaranteed scholarship success, automatic admission or replacement of the student's authentic voice.

---

# Phase 0 — Repository and implementation audit

Before changing UI code:

1. Inspect the repository structure and identify:
   - Framework and version
   - Routing model
   - Rendering model for marketing routes
   - Shared design system
   - Typography and font loading
   - Existing analytics
   - Authentication boundaries
   - Current metadata generation
   - Existing `robots.txt`
   - Existing sitemap implementation
   - Existing canonical handling
   - Existing structured data
   - Existing legal pages
   - Existing error, loading and not-found pages

2. Record the current public routes.

3. Identify which routes must be indexable and which must be private/noindex.

4. Confirm that marketing content is present in the initial server-rendered HTML. Do not rely on a fully client-rendered shell for key marketing copy.

5. Preserve existing working authentication, workspace and API integrations.

6. Reuse existing production-ready components where appropriate, but refactor weak or duplicated patterns.

7. Do not add dependencies unless they provide clear value and are maintained.

---

# Phase 1 — Homepage conversion redesign

## 1. Header and navigation

Use a polished, responsive header.

Recommended desktop structure:

- Logo
- Product
  - Application tracker
  - Writing workspace
  - Documents and evidence
  - Reference tracking
  - Readiness review
- How it works
- For students
- Resources
- Pricing
- Sign in
- Primary CTA: `Start free`

On mobile:

- Use an accessible menu button with a clear label.
- Keep `Start free` visible or prominent in the opened menu.
- Provide comfortable touch targets.
- Trap focus correctly inside the mobile menu.
- Support Escape to close.

Do not keep the navigation so minimal that users cannot discover features, pricing, trust or educational resources.

## 2. Hero section

Replace the vague opening with an explicit category statement and outcome.

### Recommended hero copy

Eyebrow:

> Scholarship application workspace

H1:

> Plan, write and submit stronger scholarship applications.

Supporting copy:

> Track deadlines, organise requirements, shape personal statements, manage evidence and references, and always know the next step—from one private workspace.

Primary CTA:

> Start free

Secondary CTA:

> Explore a sample workspace

CTA reassurance:

> Free to start · No credit card required · Your work stays yours

Optional emotional line:

> Less application chaos. More focused, confident work.

### Hero visual

Keep the product screenshot, but improve usability:

- Show fewer interface regions at once.
- Increase relevant text size so the screenshot is understandable without zooming.
- Use a focused product story, not a full dashboard compressed into a small frame.
- Highlight three clear product moments:
  1. Next action
  2. Application readiness
  3. Deadline or progress
- Add restrained annotations only where useful.
- Use real UI, not a decorative fake dashboard.
- Provide correct image dimensions to avoid layout shift.
- On mobile, use a dedicated crop or responsive product frame rather than shrinking the desktop screenshot.

## 3. Credibility strip

Add a lightweight trust strip below the hero.

Do not invent logos, awards or user counts.

Until genuine proof exists, use verifiable product principles such as:

- Built for students managing multiple applications
- Private by default
- Structured around real application requirements
- Designed for documents, evidence and references

When genuine usage data exists, this strip can later use measured proof such as completed applications, active workspaces or user satisfaction.

## 4. Problem-to-outcome section

Create a section that reflects the student's actual pain.

Heading:

> Scholarship applications become difficult long before the deadline.

Show a clean comparison.

### Without EliteApply

- Deadlines spread across tabs, emails and calendars
- Repeated requirements copied into notes
- Drafts with unclear versions
- Evidence and documents stored in different places
- Reference requests followed up manually
- Final checks performed under pressure

### With EliteApply

- Every application has a clear plan
- Requirements become actionable tasks
- Drafts stay connected to evidence
- References and documents remain visible
- Readiness is shown before submission
- The next responsible action is always clear

Avoid exaggerated fear-based messaging.

## 5. Product capabilities

Replace abstract benefit cards with product-led sections.

Create five substantial feature sections. Alternate layout direction while preserving visual rhythm.

### A. Scholarship application tracker

Heading:

> See every application, deadline and next action in one place.

Explain:

- Status
- Deadline
- Priority
- Progress
- Missing requirements
- Last activity
- Next responsible action

Primary keyword target:

- scholarship application tracker

### B. Personal statement workspace

Heading:

> Build each statement from evidence—not from a blank page.

Explain:

- Prompt and requirement breakdown
- Evidence mapping
- Draft versions
- Word-count guidance
- Clarity review
- Notes and supporting documents
- Authentic voice

Primary keyword target:

- scholarship personal statement workspace

### C. Documents and evidence

Heading:

> Keep transcripts, certificates and supporting evidence connected to the right application.

Explain:

- Document organisation
- Reuse without duplication
- Requirement-to-document mapping
- Missing-item visibility
- Version clarity
- Secure access

Primary keyword target:

- scholarship document organiser

### D. References

Heading:

> Track reference requirements before they become last-minute emergencies.

Explain:

- Referee
- Requirement
- Request status
- Due date
- Follow-up state
- Supporting context
- Confirmation status

Primary keyword target:

- scholarship reference tracker

Do not claim that EliteApply verifies references unless that functionality genuinely exists in this product.

### E. Submission readiness

Heading:

> Know what is ready, what is missing and what deserves one final review.

Explain:

- Requirements coverage
- Evidence coverage
- Writing status
- Reference status
- Declaration status
- Deadline context
- Final review checklist

Primary keyword target:

- scholarship application checklist

## 6. How it works

Keep the current guided-path concept but make it concrete.

Use four stages:

1. **Add the opportunity**
   - Add a scholarship, programme or application.
   - Capture deadline, link and core details.

2. **Break down the requirements**
   - Turn eligibility rules, essays, evidence and references into a plan.

3. **Prepare the application**
   - Draft, organise documents and connect evidence.

4. **Review and submit**
   - Resolve missing items, complete final checks and record the outcome.

Each stage needs:

- A short explanation
- A real product screenshot or interaction
- A visible output
- A clear benefit

## 7. Student use cases

Add a section titled:

> Built for serious applications at every stage.

Use only relevant, non-overlapping cards:

- Undergraduate scholarships
- Master's scholarships
- PhD funding
- International scholarships
- Fellowships and competitive programmes

Do not create separate SEO pages for every category until each page can provide genuinely unique and useful content.

## 8. Privacy and trust section

Add a visible trust section before the final CTA.

Suggested heading:

> Your applications contain personal work. Treating them carefully is part of the product.

Show only claims that are implemented and legally supportable.

Possible items, only when true:

- Clear ownership of uploaded content
- Encryption in transit and at rest
- Account-level access controls
- Document deletion and retention controls
- No model training on user documents without explicit permission
- GDPR-aligned data rights
- Transparent AI-assistance disclosure
- Export and account deletion options

Link to:

- Security
- Privacy
- Terms
- Accessibility
- Contact

Do not use vague claims such as “bank-level security.”

## 9. Comparison section

Create a tasteful comparison:

> Why not use a spreadsheet or a general notes app?

Compare EliteApply with:

- Spreadsheet
- General task manager
- General notes app

Compare on:

- Requirement structure
- Deadline tracking
- Draft and evidence connection
- Reference tracking
- Readiness review
- Reusable documents
- Guided next action

Do not attack competitors or make unsupported claims.

## 10. Testimonials and proof

Add testimonials only when they are genuine and permissioned.

Each testimonial should include:

- First name or approved public name
- Student type
- Programme or application context
- Specific before/after benefit

Do not add fake avatars, generated quotes or fake university affiliations.

If testimonials are not yet available, omit the section and use an honest founder/product note instead.

## 11. FAQ

Include visible, useful answers to:

- What is EliteApply?
- Is EliteApply a scholarship search engine?
- Can I track multiple applications?
- Does EliteApply write my personal statement?
- Can I organise references and supporting documents?
- Is my application content private?
- Can I start for free?
- Can international students use EliteApply?
- Does EliteApply guarantee a scholarship?
- Can I export or delete my data?

Answers must be direct, honest and consistent with product behaviour.

## 12. Final CTA

Retain the dark navy closing section, but make it more informative.

Heading:

> Give every application a clearer path to submission.

Copy:

> Start with one scholarship. Organise the requirements, prepare the evidence and move forward with confidence.

Primary CTA:

> Start free

Secondary CTA:

> Explore the sample workspace

Reassurance:

> No credit card required

---

# Phase 2 — Marketing information architecture

Create a coherent public marketing structure.

## Required core routes

- `/`
- `/features`
- `/features/scholarship-application-tracker`
- `/features/personal-statement-workspace`
- `/features/document-organiser`
- `/features/reference-tracking`
- `/features/submission-readiness`
- `/how-it-works`
- `/for-students`
- `/pricing`
- `/security`
- `/about`
- `/contact`
- `/resources`
- `/privacy`
- `/terms`
- `/accessibility`

Use the spelling strategy appropriate to the primary target market. If targeting both UK and US audiences, choose one canonical house style and naturally mention recognised variants where useful. Do not create duplicate US/UK pages solely for spelling differences.

## High-intent SEO landing pages

Create only pages that can offer substantial unique value:

- `/scholarship-application-tracker`
- `/scholarship-application-organiser`
- `/scholarship-deadline-tracker`
- `/scholarship-application-checklist`

Prevent keyword cannibalisation:

- Assign one primary search intent to each page.
- Use distinct titles, H1s, examples and internal links.
- Merge pages when the intent is effectively identical.

## Resource hub

Build a useful, expert-led resource hub.

Recommended clusters:

### Organisation

- How to organise multiple scholarship applications
- Scholarship application checklist
- Scholarship deadline planning guide
- How to track references and supporting documents

### Writing

- How to plan a scholarship personal statement
- How to connect claims to evidence
- How to reuse experience without repeating the same essay
- Scholarship essay editing checklist
- How to preserve an authentic voice when using AI assistance

### Evidence and references

- What counts as evidence in a scholarship application
- How to request a scholarship reference
- Scholarship reference request email template
- How early to request a reference letter

### International applicants

- Document checklist for international scholarship applications
- How to manage translations and certified documents
- Scholarship application planning across time zones and deadlines

Every resource must be genuinely useful, fact-checked and written for students. Do not mass-publish thin AI-generated pages.

## Internal linking

Create contextual links between:

- Homepage and feature pages
- Feature pages and relevant guides
- Guides and the correct product capability
- Pricing and all high-intent pages
- Security and any page discussing document privacy
- Related guides within the same topic cluster

Use descriptive anchor text. Avoid repeated “learn more” links without context.

---

# Phase 3 — Technical SEO implementation

## Rendering

- Render all public marketing content on the server or at build time.
- Ensure title, description, canonical, headings and primary copy exist in the initial HTML response.
- Keep client-side JavaScript for interaction, not for basic crawlability.
- Do not require authentication to view public product information.

## Metadata

Implement a typed, central metadata utility.

Every indexable page must have:

- Unique `<title>`
- Unique meta description
- Canonical URL
- Open Graph title
- Open Graph description
- Open Graph image
- Twitter card metadata
- Robots directive
- Correct favicon and app icons
- Correct language attribute
- Optional alternate-language links only when real translations exist

### Homepage metadata

Recommended title:

> Scholarship Application Tracker & Workspace | EliteApply

Recommended description:

> Track scholarship deadlines, organise documents, shape personal statements and manage references in one private workspace. Start free with EliteApply.

Recommended canonical:

> https://eliteapply.net/

## Heading semantics

- Exactly one meaningful H1 per page.
- Do not use heading elements for purely decorative text.
- Maintain a logical H1 → H2 → H3 hierarchy.
- Use visible text that naturally includes the page's main topic.
- Do not keyword-stuff.

## Sitemap

Generate a valid XML sitemap from public canonical routes.

Include only:

- Canonical
- Indexable
- Public
- Successful 200-status pages

Exclude:

- Sign-in
- Sign-up transaction routes
- Workspace routes
- User documents
- Preview tokens
- Invite links
- API routes
- Search/filter combinations
- Duplicate parameter URLs
- Error pages
- Staging routes

Set accurate `lastmod` values based on meaningful content updates, not every deployment.

Add the sitemap location to `robots.txt`.

## Robots and noindex

Create a clear `robots.txt`.

Allow public marketing pages and assets required for rendering.

Use page-level `noindex, nofollow` or appropriate `X-Robots-Tag` headers for private and transactional routes such as:

- Authentication callbacks
- User workspace
- Account pages
- Billing portal return pages
- Private document views
- Invite and token URLs
- Internal previews
- Staging environments

Do not depend on `robots.txt` alone to keep private content out of search results.

All staging and preview deployments must be protected and noindexed.

## Canonicalisation

- Choose one hostname and protocol.
- Permanently redirect all variants to the canonical host.
- Normalise trailing-slash behaviour.
- Remove duplicate query-string versions from the index.
- Use self-referencing canonical tags on public pages.
- Ensure sitemap URLs and canonical URLs agree.
- Avoid canonicalising unrelated pages to the homepage.

## Structured data

Add JSON-LD only for visible, truthful content.

### Homepage

Use:

- `Organization`
- `WebSite`
- `SoftwareApplication`

Include only verified properties such as:

- Name
- URL
- Logo
- Description
- Application category
- Operating system as web/browser-based where appropriate
- Offers only when real pricing is publicly shown
- Social profiles that officially belong to EliteApply

Do not add fake ratings or review counts.

### Content pages

Use:

- `Article` for editorial guides
- `BreadcrumbList` on nested public pages

Validate with Google's Rich Results Test and Schema.org validator.

## Social previews

Create a dedicated OG image system.

Requirements:

- 1200 × 630
- Clear EliteApply branding
- Readable page-specific title
- Minimal text
- Safe padding
- Correct previews on LinkedIn, X, Facebook and messaging apps
- Absolute image URLs

## Search Console and webmaster setup

Prepare and document:

- Google Search Console domain property
- Sitemap submission
- URL Inspection checks
- Bing Webmaster Tools
- Index coverage review
- Manual actions and security issues review
- Search performance dashboard
- Branded and non-branded query segmentation

## 404 and redirects

- Create a useful branded 404 page.
- Log 404 URLs.
- Add explicit 301 redirects for renamed routes.
- Do not redirect every 404 to the homepage.
- Ensure all navigation and footer links pass automated link checks.

---

# Phase 4 — Performance, accessibility and frontend quality

## Performance targets

Measure mobile first.

Target field performance at the 75th percentile:

- LCP ≤ 2.5 seconds
- INP ≤ 200 milliseconds
- CLS ≤ 0.1

Also target:

- Minimal blocking JavaScript
- Minimal unused CSS
- Fast initial HTML response
- No unexpected layout shifts
- Stable header and product screenshots
- Responsive images
- Efficient font loading

## Image implementation

- Use AVIF or WebP with sensible fallbacks.
- Provide width and height attributes.
- Use responsive `srcset` and `sizes`.
- Do not lazy-load the above-the-fold LCP image.
- Preload or prioritise the actual LCP asset when appropriate.
- Lazy-load below-the-fold product images.
- Provide meaningful alt text for informative screenshots.
- Use empty alt text for purely decorative elements.

## Fonts

- Self-host licensed fonts when appropriate.
- Subset font files.
- Preload only critical weights.
- Avoid downloading unused weights.
- Use `font-display: swap` or an appropriate equivalent.
- Define metric-compatible fallbacks to reduce layout shift.

## JavaScript

- Keep the homepage primarily presentational.
- Prefer server components or equivalent server-rendered patterns.
- Avoid shipping large animation libraries for minor motion.
- Load analytics after consent where legally required.
- Break up long tasks.
- Do not hydrate static sections unnecessarily.

## Accessibility

Meet WCAG 2.2 AA.

Implement:

- Keyboard navigation
- Visible focus states
- Skip-to-content link
- Semantic landmarks
- Correct heading order
- Accessible menu and dialogs
- Accessible form labels and errors
- Sufficient colour contrast
- Minimum comfortable touch targets
- Reduced-motion support
- No information conveyed by colour alone
- Descriptive link labels
- Accessible screenshot alternatives or explanatory surrounding text
- Correct announcement of form success and failure states

The editorial serif typeface may remain, but body text and UI labels must stay highly readable.

## Responsive behaviour

Test at minimum:

- 320 px
- 375 px
- 390 px
- 768 px
- 1024 px
- 1280 px
- 1440 px
- Large desktop

Requirements:

- No horizontal scrolling
- No unreadably compressed screenshots
- No clipped headlines
- No orphaned CTA text
- No inaccessible hover-only content
- Navigation works with touch and keyboard
- Cards stack with deliberate spacing
- Text line length remains readable

---

# Phase 5 — Conversion analytics and experimentation

## Event taxonomy

Implement consistent analytics events:

- `nav_primary_cta_clicked`
- `hero_start_free_clicked`
- `hero_sample_workspace_clicked`
- `feature_cta_clicked`
- `pricing_viewed`
- `pricing_plan_selected`
- `signup_started`
- `signup_completed`
- `sign_in_clicked`
- `sample_workspace_opened`
- `security_page_viewed`
- `faq_item_opened`
- `resource_article_viewed`
- `resource_cta_clicked`

Event properties should include:

- Page
- Placement
- CTA label
- Referrer
- UTM source
- UTM medium
- UTM campaign
- Device class
- Experiment variant when applicable

Preserve UTM values through signup where privacy and architecture allow.

## Funnel

Create a measurable funnel:

1. Landing page visit
2. Product interaction or sample workspace
3. Signup started
4. Signup completed
5. First application created
6. First requirement added
7. First meaningful application milestone

Do not optimise only for button clicks. Track activation.

## Experiments

Do not launch multiple simultaneous experiments on a low-traffic site.

Initial test priorities:

1. `Start free` versus `Create your workspace`
2. Hero category-led H1 versus emotional H1
3. Static product screenshot versus interactive guided preview
4. CTA reassurance placement
5. Product proof before versus after feature explanation

Define one success metric and guardrail metrics per experiment.

---

# Phase 6 — Trust, legal and production hardening

## Required public pages

Implement complete, readable pages for:

- Privacy
- Terms
- Security
- Accessibility
- Contact
- Cookie preferences when non-essential cookies are used

## Product disclosures

Clearly state:

- EliteApply is an organisational and writing-support tool.
- EliteApply does not guarantee scholarship selection.
- The user remains responsible for application accuracy and submission.
- AI-generated or AI-assisted output must be reviewed by the user.
- Users should follow the rules of each scholarship provider.
- Sensitive documents should be handled according to the published privacy and retention policy.

## Security controls

Review and implement as applicable:

- HTTPS-only
- HSTS
- Strong Content Security Policy
- `frame-ancestors`
- Referrer Policy
- Permissions Policy
- Secure and HttpOnly cookies
- SameSite cookie configuration
- CSRF protection
- Rate limiting
- Bot protection on public forms
- Sanitised user-generated content
- Safe file upload validation
- Malware scanning where documents are uploaded
- File size and type limits
- Signed, expiring private download URLs
- Secret scanning in CI
- Dependency auditing
- Security contact or `security.txt`

Do not claim a control publicly until it is implemented and verified.

## Error handling

Create polished states for:

- 404
- 500
- Network failure
- Authentication failure
- Expired invite
- Invalid link
- Upload failure
- Rate limiting
- Maintenance

Errors must explain what happened, what the user can do and how to get support.

---

# Visual design requirements

## Keep

- Navy and blue palette
- Editorial serif display type
- Calm, spacious composition
- Fine borders
- Refined product frames
- Minimal, deliberate motion
- Premium academic tone

## Improve

- Increase body and UI legibility
- Reduce empty areas that do not contribute to hierarchy
- Make screenshots readable
- Add stronger section differentiation
- Use more meaningful product detail
- Improve CTA hierarchy
- Create a richer footer
- Add controlled visual rhythm
- Make mobile feel designed, not merely stacked

## Avoid

- Generic purple gradients
- Neon glows
- Floating glass cards without purpose
- Decorative 3D objects
- Excessive blobs
- Fake university logos
- Fake user counters
- Fake security badges
- Fake five-star reviews
- Aggressive scarcity
- Autoplay video with sound
- Scroll-jacking
- Long entrance animations
- Tiny grey text

---

# Recommended footer

Use a substantial, accessible footer.

Columns:

## Product

- Features
- Application tracker
- Writing workspace
- Documents
- References
- Readiness review
- Pricing

## Students

- How it works
- For students
- International applicants
- Sample workspace

## Resources

- Guides
- Scholarship application checklist
- Personal statement guide
- Reference request guide

## Company

- About
- Contact
- Security
- Accessibility

## Legal

- Privacy
- Terms
- Cookie preferences

Footer bottom:

- Copyright
- Product status link if available
- Social links that are actively maintained
- Language selector only when translations exist

---

# Homepage design system guidance

Use a restrained, consistent system.

Suggested layout:

- Content max width: approximately 1200–1280 px
- Text reading width: approximately 620–760 px
- 12-column desktop grid
- 8 px spacing scale
- Generous section spacing with tighter internal grouping
- Border radius consistent with the application UI
- One dominant primary button style
- One clear secondary button or text-link style
- Avoid more than three visual emphasis levels in one section

Suggested heading behaviour:

- H1 should remain editorial and confident.
- Keep line length controlled.
- Avoid an H1 so large that it dominates the entire first viewport.
- Ensure the product preview remains visible without excessive scrolling on common laptop screens.

---

# Copy principles

Use:

- Specific nouns
- Active verbs
- Honest outcomes
- Student language
- Clear descriptions
- Calm confidence

Prefer:

> Track every requirement and know the next step.

Instead of:

> Unlock your potential with an innovative end-to-end solution.

Prefer:

> Connect each claim in your statement to evidence.

Instead of:

> Leverage intelligent workflows to optimise your narrative.

Avoid:

- Revolutionise
- Game-changing
- Guaranteed
- Effortless
- Best-in-class
- Industry-leading
- Win every scholarship
- AI-powered excellence

unless evidence and context genuinely support the claim.

---

# QA and acceptance criteria

The work is not complete until all items below pass.

## SEO

- Every public page has unique metadata.
- Canonical URLs are correct.
- Sitemap is valid.
- `robots.txt` is valid.
- Private routes are noindexed.
- Public content exists in initial HTML.
- One meaningful H1 per page.
- No accidental duplicate pages.
- Structured data validates without critical errors.
- No fake structured-data ratings.
- All public pages return correct status codes.

## UX

- The product is understandable within five seconds.
- The target audience is explicit.
- The first viewport includes a clear outcome, category and CTA.
- Screenshots are readable.
- Navigation exposes product, resources and pricing.
- Every major page has an appropriate next action.
- No dead ends.
- No fabricated social proof.

## Accessibility

- Keyboard-only flow passes.
- Focus is visible.
- Menu and dialogs are accessible.
- Contrast passes AA.
- Forms have labels and useful errors.
- Reduced-motion mode works.
- Automated checks show no critical accessibility violations.

## Performance

- Core Web Vitals targets are met or a documented remediation plan exists.
- Images are responsive and dimensioned.
- Above-the-fold assets are correctly prioritised.
- Below-the-fold assets are lazy-loaded.
- No unnecessary client hydration.
- No major console errors.
- No major layout shift.

## Responsive

- No horizontal overflow.
- Mobile hero remains clear.
- CTA buttons fit without truncation.
- Screenshots use mobile-specific presentation.
- Footer and navigation remain accessible.
- Test across all required breakpoints.

## Engineering quality

- Type checking passes.
- Linting passes.
- Production build passes.
- Unit/component tests pass.
- Critical user journeys pass with Playwright or equivalent.
- Broken-link test passes.
- Metadata tests pass.
- No secrets or environment-specific values are committed.
- Existing authenticated product flows remain functional.

---

# Required delivery format

When implementation is complete, provide:

1. Summary of the existing problems found.
2. List of routes created or changed.
3. List of components created or refactored.
4. Before-and-after explanation of the homepage.
5. Metadata map for every indexable route.
6. Keyword-to-page map.
7. Structured data implemented.
8. Sitemap and robots behaviour.
9. Accessibility results.
10. Performance results for mobile and desktop.
11. Analytics events implemented.
12. Security and legal items completed.
13. Known limitations and follow-up tasks.
14. Screenshots at mobile, tablet and desktop widths.

Do not claim completion for any item that was not implemented and tested.
