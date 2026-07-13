# EliteResume reuse map

EliteApply has no runtime import from EliteResume. Reuse means deliberate adaptation of proven patterns, not shared product code.

| Foundation                         | EliteApply implementation                                              | Adaptation                                                                                                             |
| ---------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| OIDC session and protected routing | `src/lib/auth`, `src/app/PrivateRoot.tsx`                              | Keeps tokens in memory and EliteApply routes/copy.                                                                     |
| Authenticated transport            | `src/lib/api/client.ts`                                                | Preserves refresh-once, bearer auth, normalized errors and correlation IDs.                                            |
| Server-state ownership             | TanStack Query domain hooks and `src/lib/api/queryKeys.ts`             | Adds EliteApply billing, academic profile, application, document and catalogue keys.                                   |
| Billing checkout/portal pattern    | `src/features/billing/BillingPage.tsx`, `src/lib/billing/provider.tsx` | Removes source-product price IDs and entitlement assumptions; all availability and balances come from EliteApply APIs. |
| Cursor ledger pattern              | Billing usage and application/reference lists                          | Uses opaque `next_cursor` values and explicit load-more controls.                                                      |
| Versioned optimistic update        | Application board move                                                 | Uses `expected_version`, snapshot rollback, refetch and reusable conflict notice.                                      |
| Signed upload/download             | Academic document vault and `downloadResponse`                         | Enforces EliteApply content types, size limits and malware usability before link/download.                             |
| Async polling                      | Document detail scan query                                             | Polls only while processing and stops on a terminal scan state.                                                        |
| Responsive data tables             | Billing ledger and application list                                    | Uses semantic tables on desktop and labeled stacked cells on narrow screens.                                           |
| Reference request lifecycle        | `src/features/references/ReferencePages.tsx`                            | Adapts status/detail/event/verification patterns while preserving EliteApply confidentiality and current reference schemas. |
| Recorded interview turns           | `src/features/interviews/InterviewPage.tsx`                             | Uses browser-native recording, server-owned questions and async transcription instead of realtime or source-product assumptions. |
| Notification and reminder surfaces | `src/features/notifications`, `src/features/reminders`                  | Reuses cursor, preference and calendar-token patterns with EliteApply routes, categories and timezone rules. |
| Admin operations metadata          | `src/features/admin/AdminLaunchPage.tsx`                                | Keeps strict admin gating, confirmations and redaction while avoiding application-content inspection. |

Excluded intentionally: EliteResume career language, routes, analytics names, Stripe price IDs, plan-derived permissions, dark identity and resume-specific document assumptions.
