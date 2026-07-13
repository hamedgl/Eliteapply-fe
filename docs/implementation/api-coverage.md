# API coverage

| Method | Path | Generated operation/type | API module/hook | Screen/flow | Test coverage | Status | Notes |
|---|---|---|---|---|---|---|---|
| POST | `/api/v1/auth/register` | `register_api_v1_auth_register_post` / `RegisterRequest` | `authApi.register` | Register | form validation | `implemented_unverified` | Live mutation not executed. |
| POST | `/api/v1/auth/confirm-email` | `confirm_email_api_v1_auth_confirm_email_post` | `authApi.confirm` | Confirm email | component structure | `implemented_unverified` | Codes never persisted. |
| POST | `/api/v1/auth/resend-confirmation` | generated | `authApi.resend` | API ready | typed compile | `implemented_unverified` | Resend control deferred UI defect. |
| POST | `/api/v1/auth/login` | `LoginRequest` / `LoginResponse` | `authApi.login` | Login | storage assertion | `implemented_unverified` | Tokens memory-only. |
| POST | `/api/v1/auth/refresh` | `LoginResponse` | client/session | bootstrap and 401 retry | concurrent refresh unit test | `implemented` | Single-flight, cookie credentials. |
| POST | `/api/v1/auth/logout` | generated | `authApi.logout` | App shell | typed compile | `implemented_unverified` | Server called before local clear. |
| POST | `/api/v1/auth/forgot-password` | `ForgotPasswordRequest` | `authApi.forgot` | Forgot password | form structure | `implemented_unverified` | Enumeration-safe message. |
| POST | `/api/v1/auth/reset-password` | `ResetPasswordRequest` | `authApi.reset` | Reset password | form validation | `implemented_unverified` | Code never persisted. |
| POST | `/api/v1/auth/set-password` | `SetPasswordRequest` | `authApi.setPassword` | API ready | typed compile | `implemented_unverified` | Dedicated authenticated UI deferred defect. |
| GET | `/api/v1/auth/has-password` | `HasPasswordResponse` | `authApi.hasPassword` | API ready | typed compile | `implemented_unverified` | Used by future set-password gate. |
| POST | `/api/v1/auth/change-password` | `ChangePasswordRequest` | `authApi.changePassword` | Security | form validation | `implemented_unverified` | Real API. |
| GET/PUT/DELETE | `/api/v1/users/me` | generated user types | `usersApi` | profile/deletion | typed compile | `implemented_unverified` | Two-step delete supported. |
| POST/DELETE | `/api/v1/users/me/avatar` | multipart/generated | `usersApi` | Profile | client MIME/size | `implemented_unverified` | 5 MB UI policy pending backend confirmation. |
| POST | `/api/v1/users/me/consent` | `UpdateConsentRequest` | `usersApi.consent` | Privacy | typed compile | `implemented_unverified` | Real API. |
| GET | `/api/v1/users/me/export` | generated | `usersApi.export` | Privacy | typed compile | `implemented_unverified` | Blob download, object URL revoked. |
| POST | `/api/v1/users/me/delete-request` | generated | `usersApi.requestDelete` | Privacy | component flow | `implemented_unverified` | Destructive confirmation. |
| GET | `/api/v1/platform/identity` | generated | `platformApi.identity` | bootstrap-ready | typed compile | `implemented_unverified` | Open-ended response. |
| GET | `/api/v1/platform/capabilities` | `PlatformCapability` | capability provider | shell gating | safe-failure behavior | `implemented_unverified` | Failure enables nothing. |
| GET | `/api/v1/feature-flags/{key}` | generated | `platformApi.flag` | infrastructure | typed compile | `implemented_unverified` | Safe per-key adapter. |
| GET | `/api/v1/onboarding` | `OnboardingResponse` | `platformApi.onboarding` | onboarding foundation | typed compile | `implemented_unverified` | No mutation endpoint. |
| GET | `/api/v1/dashboard` | `DashboardResponse` | dashboard query/guard | Dashboard | adapter unit test | `implemented_unverified` | No fake data. |
| POST | `/api/v1/analytics/events` | `AnalyticsEventCreate` | `track` | milestone wrapper | typed compile | `implemented_unverified` | Sensitive keys stripped. |
| GET | `/health`, `/ready`, `/metric`, `/metrics` | infrastructure | none | none | n/a | `not_required_ui` | Per prompt. |

Phase 2/3 endpoints remain `deferred_to_phase_2` / `deferred_to_phase_3` and are intentionally not implemented in Phase 1.

## Phase 2 additions

| Method | Path | Generated operation/type | API module/hook | Screen/flow | Test coverage | Status | Notes |
|---|---|---|---|---|---|---|---|
| GET/PUT | `/api/v1/academic-profile` | `AcademicProfileResponse` / `AcademicProfileUpsert` | `profileApi` | Academic Profile | strict compile | `implemented_unverified` | Unknown keys preserved; explicit save. |
| GET | `/api/v1/academic-profile/versions` | `AcademicProfileVersionResponse[]` | `profileApi.versions` | Profile history | strict compile | `implemented_unverified` | No restore control. |
| GET/POST | `/api/v1/applications` | application generated types | `applicationsApi` | List/create | board adapter/E2E | `implemented_unverified` | Stable UUID per create form. |
| GET | `/api/v1/applications/board` | `ApplicationBoardResponse` | board query | Board/list | malformed fixture + E2E | `implemented` | All backend stages rendered. |
| GET/PATCH | `/api/v1/applications/{application_id}` | `ApplicationResponse` / `ApplicationUpdate` | `applicationsApi` | card movement/workspace | typed + E2E controls | `implemented_unverified` | Sends `expected_version`; conflict copy/refetch. |
| GET | `/api/v1/applications/{application_id}/workspace` | `ApplicationWorkspaceResponse` | workspace query | Cohesive workspace | strict compile | `implemented_unverified` | Composite endpoint first. |
| GET | `/api/v1/applications/{application_id}/history` | `AuditEventResponse[]` | `applicationsApi.history` | targeted API | strict compile | `implemented_unverified` | Composite history used initially. |
| GET/POST | `/api/v1/applications/{application_id}/requirements` | requirement types | workspace module | Requirements | strict compile | `implemented_unverified` | Workflow vs validation shown separately. |
| PATCH/DELETE | `/api/v1/applications/{application_id}/requirements/{requirement_id}` | update/204 | workspace module | API ready | strict compile | `implemented_unverified` | Destructive UI deferred pending dialog primitive. |
| GET/POST | `/api/v1/applications/{application_id}/tasks` | task types | workspace module | Tasks | strict compile | `implemented_unverified` | Unknown status rendered safely. |
| PATCH/DELETE | `/api/v1/applications/{application_id}/tasks/{task_id}` | update/204 | workspace module | API ready | strict compile | `implemented_unverified` | UI update/delete deferred. |
| POST | `/api/v1/applications/{application_id}/documents` | `DocumentLinkCreate` | workspace module | API ready | strict compile | `implemented_unverified` | No unlink invented. |
| GET/POST | `/api/v1/academic-documents` | document types | `documentsApi` | Vault/register | PUT upload unit test | `implemented_unverified` | Real list/register. |
| POST | `/api/v1/academic-documents/upload-url` | upload types | upload helper | Three-step upload | signed PUT + validation tests | `implemented` | PUT and form branches implemented. |
| GET | `/api/v1/academic-documents/{document_id}/download` | `DocumentDownloadResponse` | document vault | Download | strict compile | `implemented_unverified` | Signed URL navigation. |
| DELETE | `/api/v1/academic-documents/{document_id}` | 204 | document vault | Confirmed delete | strict compile | `implemented_unverified` | Native confirmation currently. |
| GET/POST | `/api/v1/catalogue/institutions` | institution types | `catalogueApi` | Debounced combobox/list | E2E-independent compile | `implemented_unverified` | Stale requests aborted; create API ready. |
| GET/POST | `/api/v1/catalogue/programmes` | programme types | `catalogueApi` | API foundation | strict compile | `implemented_unverified` | Exact `institutionId` casing. |
| GET/POST | `/api/v1/catalogue/scholarships` | scholarship types | `catalogueApi` | API foundation | strict compile | `implemented_unverified` | Creation not exposed until no-result UX. |
| POST/GET | `/api/v1/application-intelligence/imports[/{import_id}]` | import types | `intelligenceApi` | Guided import/poll | strict compile | `implemented_unverified` | Stable UUID, cancellable stepped polling. |
| POST | `/api/v1/application-intelligence/imports/{import_id}/confirm` | `ImportConfirmation` | import review | Explicit confirmation | strict compile | `implemented_unverified` | Confidence described as assistance. |
| POST | `/api/v1/application-intelligence/applications/{application_id}/eligibility` | eligibility types | workspace analysis | Readiness | strict compile | `implemented_unverified` | Backend disclaimer always shown; no admission probability label. |

## Phase 3 additions

All writing document list/create/get/update/attach/revisions/restore/generate/analyze/export routes are implemented in `writingApi`; library/editor/revision/generation/quality/export UI is present. Story GET/POST is implemented. Academic reference GET/POST/revoke, referee GET/submit with `X-Reference-Code`, and public verification are implemented. Interview create/answer is implemented for chat/written current-session use. Admin feature flag/gate/readiness methods exist and launch readiness/gate UI is role-guarded. Exact generated schema types are used throughout. Status: `implemented_unverified` for live mutations; public header secrecy, writing editor, board regression, generated types, unit tests and browser routes are `implemented` under mocked contract fixtures. Generation polling, voice transport and durable interview history are `blocked_backend`.
