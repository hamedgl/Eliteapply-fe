import type { components } from "../../generated/api/schema";
import { apiRequest } from "./client";
export { newMutationId } from "./mutations";

type S = components["schemas"];

export const billingApi = {
  plans: () =>
    apiRequest<S["PlanOption"][]>("/billing/plans", { public: true }),
  subscription: () =>
    apiRequest<S["SubscriptionResponse"]>("/billing/subscription"),
  entitlements: () =>
    apiRequest<S["EntitlementResponse"]>("/billing/entitlements"),
  usage: (cursor?: string | null) =>
    apiRequest<S["UsageResponse"]>(
      `/billing/usage?period=current&limit=25${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`,
    ),
  checkout: (body: S["CheckoutRequest"]) =>
    apiRequest<S["CheckoutResponse"]>("/billing/checkout", {
      method: "POST",
      body,
    }),
  portal: (body: S["CustomerPortalRequest"]) =>
    apiRequest<S["CustomerPortalResponse"]>("/billing/customer-portal", {
      method: "POST",
      body,
    }),
  tokenProduct: () =>
    apiRequest<S["TokenProductInfo"]>("/billing/token-products"),
  tokenCheckout: (body: S["TokenCheckoutRequest"]) =>
    apiRequest<S["TokenCheckoutResponse"]>("/billing/token-checkout", {
      method: "POST",
      body,
    }),
  purchases: () =>
    apiRequest<S["TokenPurchaseResponse"][]>("/billing/purchases"),
};
