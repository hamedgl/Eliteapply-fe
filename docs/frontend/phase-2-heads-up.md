# Phase 2 heads-up

Before starting Phase 2, validate this Phase 1 report against the code and rerun OpenAPI generation/checks.

Phase 2 should begin from these realities:

- Catalogue consumers already use wrapper `.items`, but rich discovery filters, cursor loading, detail/edit permissions and moderation-aware UI remain Phase 2.
- Writing Studio supports `includeArchived`, and stories use `StoryListResponse`; richer story filters/cursors and the expanded editor collaboration/generation operations remain Phase 2.
- The defensive download helper is ready for writing exports and public share downloads.
- Entitlements are server-owned and should gate new AI actions. Do not add plan-name checks.
- Application readiness, requirements/tasks and secure document links are available inputs to intelligence and writing workflows.
- Referee creation/submission breaking schemas are already migrated, but the expanded authenticated reference management belongs to Phase 3.
- No realtime interview voice experience exists in the contract.
- Preserve share passcodes and collaborator invitation tokens through auth without placing them in analytics, query strings or logs.

Prompt deviations to carry forward:

- Native pointer drag and explicit keyboard move controls were implemented without a drag library; add richer drag announcements only if user testing shows the native interaction needs them.
- Plan prices remain undisplayed because the API still lacks presentation metadata.
- Submission override remains hidden until product policy is contract-visible.
- The established Academic Compass visual system takes precedence over generic database style recommendations.
