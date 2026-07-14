# Unused endpoints Phase 3 report

Date: 2026-07-14

## Scope result

The requested product work is finished. Phase 3 operational consumers were not implemented because the user explicitly instructed the frontend task to skip infrastructure and monitoring APIs.

| Operation | Current classification | Result |
| --- | --- | --- |
| `GET /health` | `not-yet-implemented` | No React polling or deployment script added. Intended owner: platform operations. |
| `GET /ready` | `not-yet-implemented` | No React polling or deployment script added. Intended owner: platform operations. |
| `GET /metrics` | `not-yet-implemented` | No React rendering or Prometheus configuration added. |
| `GET /metric` | `not-yet-implemented` | Deprecated alias intentionally not adopted. |

## Coverage governance

`docs/api/openapi-operation-usage.json` records the intended consumer, classification, reason, owner, review date, and evidence for all nine operations in this endpoint programme. `npm run api:usage` validates that:

- all nine target operations are present exactly once;
- method, path, and operation ID match the checked-in OpenAPI document;
- classifications are valid;
- required ownership/review metadata exists;
- every evidence file exists.

This avoids fake React calls for calendar, signed storage, or operational endpoints while keeping skipped work visible.

## CI and operations changes

No deployment or monitoring configuration was added. This repository has no owned CI workflow, and the user excluded the four operational endpoints. The package-level audit command is ready for repository CI if a workflow is added later.

## Deprecation handling

No source code uses `/metric`. The manifest records the OpenAPI deprecation and an unknown removal date without adopting the alias.

## Tests and final coverage

- Requirements/tasks: direct SPA client, cache, deep-link, recovery, and E2E evidence from Phase 1.
- Calendar: URL helper/unit tests and external-client E2E evidence from Phase 2.
- Storage: signed transport unit/integration evidence from Phase 2.
- Operational endpoints: deliberately unimplemented and documented, matching the later scope instruction.

Final result: five product/browser operations have real consumers; four operational operations remain explicit, owned exclusions rather than unexplained unused APIs.

## Unresolved risks

- A platform owner still needs to decide whether and where deployment smoke checks and Prometheus configuration live.
- The deprecated `/metric` removal date is not published.
- Until those decisions are authorized, the four entries must remain `not-yet-implemented`, not be relabeled as deployed consumers.
