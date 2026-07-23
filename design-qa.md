# Design QA — authentication redesign

final result: passed

## Evidence

- Source visual truth: `/tmp/codex-clipboard-6CutMI.png` (login), `/tmp/codex-clipboard-ckapG9.png` (registration alignment), and `/tmp/codex-clipboard-YCrgoX.png` (password requirements).
- Supplied photo: `/home/hamed/Eliteapply-fe/Background_image_on_left_2K_202607230231.jpeg` (2752×1536).
- Desktop implementation: `/tmp/eliteapply-login-desktop-pass2.png`.
- Mobile implementation: `/tmp/eliteapply-login-mobile-pass2.png`.
- Registration implementation: `/tmp/eliteapply-register-pass3.png` and `/tmp/eliteapply-register-valid-password.png`.
- Full same-frame comparison: `/tmp/eliteapply-login-comparison-final.png`.
- Focused registration comparison: `/tmp/eliteapply-register-comparison.png`.
- Desktop viewport and density: 1850×1041 CSS px, device scale factor 1; source and implementation are both 1850×1041 physical px, so no density normalization was needed.
- Mobile viewport and density: 390×844 CSS px, device scale factor 1.
- Registration viewport: 559×800 CSS px, device scale factor 1. The alignment reference is 559×695; the password-rule crop is 350×303.
- State: logged out; login fields empty for visual comparison; registration captured empty and with a valid password.

## Comparison history

### Pass 1

- P1 — The left headline wrapped to four lines and sat too high. Fixed by widening the copy measure, reducing the display size to the reference scale, and anchoring the two-line block to the lower fade.
- P1 — The supplied photo placed the student too low. Fixed by shifting the natural-scale image upward into the opaque navy fade.
- P2 — Required Email and Password fields had 12px of invisible marker padding while optional Full name did not. Fixed at the shared auth-field selector; all three registration inputs now measure left 24px and right 535px.

### Pass 2

- P2 — Scaling the photo to correct its vertical position made the student too large and narrowed the library corridor. Fixed by keeping the image at 100% height and translating its crop upward instead.

### Final pass

- No actionable P0, P1, or P2 findings remain.
- Fonts and typography: Source Serif 4 matches the editorial display role; DM Sans remains on form labels, fields, helper copy, links, and buttons. The left headline stays at two lines.
- Spacing and layout: the desktop split is 50/50, the form is 480px wide, and the login reference and implementation align at the heading, labels, fields, action, and links. Mobile has no horizontal overflow.
- Colors and tokens: the navy image wash, white panel, cobalt-to-ink action, muted copy, focus ring, and success state remain within the existing EliteApply palette and maintain readable contrast.
- Image quality: the supplied 2.7MB JPEG is represented by a 176KB, 2200×1228 WebP. The crop, subject position, corridor width, and lower-edge fade match the same-frame source comparison.
- Copy and content: login copy matches the selected reference. Registration adds the requested 8–128 characters, uppercase, lowercase, number, and symbol requirements without changing account behavior.
- Focused registration evidence: Full name, Email, and Password share identical 24px/535px edges. All five password rules render and all five switch to completed for `Valid123!`.
- Interaction: email/password entry, visible focus, enabled submit action, Forgot password and Create account destinations, registration rule updates, and responsive layout were checked in Chrome.
- Console: no JavaScript or page errors occurred. Four expected 401 resource messages came from the existing unauthenticated `/auth/refresh` session probe across the two captured pages.
- Workspace guide: its existing three-dot indicator now uses explicit center self-alignment inside the equal-track pagination grid. This authenticated surface had no supplied visual target and was excluded from the image comparison.

## Detector review

- The reported layout-transition finding is a false positive for this change: it points to the pre-existing authenticated app sidebar's deliberate 220ms width/padding collapse transition. The auth redesign does not touch that interaction, so it remains unchanged.

## Follow-up polish

- No P3 follow-up is required for the requested surfaces.
