import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { CheckCircle2, CreditCard, ExternalLink, Gauge } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NavLink, useParams } from "react-router-dom";
import { billingApi, newMutationId } from "../../lib/api/billing";
import { queryKeys } from "../../lib/api/queryKeys";
import { useEntitlements } from "../../lib/billing/provider";
import { preloadAppRoute } from "../../app/preload";

const number = new Intl.NumberFormat();
const date = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

export function BillingPage() {
  const { result } = useParams();
  const qc = useQueryClient();
  const entitlements = useEntitlements();
  const subscription = useQuery({
    queryKey: queryKeys.subscription,
    queryFn: billingApi.subscription,
  });
  const plans = useQuery({
    queryKey: queryKeys.plans,
    queryFn: billingApi.plans,
  });
  const tokenProduct = useQuery({
    queryKey: queryKeys.tokenProduct,
    queryFn: billingApi.tokenProduct,
  });
  const purchases = useQuery({
    queryKey: queryKeys.purchases,
    queryFn: billingApi.purchases,
  });
  const usage = useInfiniteQuery({
    queryKey: queryKeys.usage,
    queryFn: ({ pageParam }) => billingApi.usage(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.logs.next_cursor ?? undefined,
  });
  const ids = useRef(new Map<string, string>());
  const [tokens, setTokens] = useState(0);

  useEffect(() => {
    if (tokenProduct.data && tokens === 0) setTokens(tokenProduct.data.min_tokens);
  }, [tokenProduct.data, tokens]);

  useEffect(() => {
    if (!result) return;
    void qc.invalidateQueries({ queryKey: queryKeys.billing });
  }, [qc, result]);

  const callbacks = {
    success_url: new URL(
      "/app/settings/billing/success",
      window.location.origin,
    ).href,
    cancel_url: new URL(
      "/app/settings/billing/cancel",
      window.location.origin,
    ).href,
  };
  const mutationId = (key: string) => {
    const existing = ids.current.get(key);
    if (existing) return existing;
    const value = newMutationId();
    ids.current.set(key, value);
    return value;
  };
  const checkout = useMutation({
    mutationFn: async (planKey: string) => {
      const response = await billingApi.checkout({
        mutation_id: mutationId(`plan:${planKey}`),
        plan_key: planKey,
        ...callbacks,
      });
      window.location.assign(response.checkout_url);
    },
  });
  const portal = useMutation({
    mutationFn: async () => {
      const response = await billingApi.portal({
        return_url: new URL(
          "/app/settings/billing",
          window.location.origin,
        ).href,
      });
      window.location.assign(response.portal_url);
    },
  });
  const topUp = useMutation({
    mutationFn: async () => {
      const response = await billingApi.tokenCheckout({
        mutation_id: mutationId(`tokens:${tokens}`),
        tokens,
        ...callbacks,
      });
      window.location.assign(response.checkout_url);
    },
  });

  const entitlement = entitlements.data;
  const used = entitlement?.ai_tokens_used ?? 0;
  const limit = entitlement?.ai_tokens_limit ?? 0;
  const usagePercent = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const logs = usage.data?.pages.flatMap((page) => page.logs.items) ?? [];
  const product = tokenProduct.data;
  const topUpPrice = product
    ? new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: product.currency,
      }).format((tokens / 1000) * (product.price_cents_per_1k / 100))
    : "";
  const actionError = checkout.error ?? portal.error ?? topUp.error;

  return (
    <div className="page settings billing-page">
      <header>
        <h1>Billing & usage</h1>
        <SettingsNav />
      </header>

      {result === "success" ? (
        <p className="billing-notice success" role="status">
          <CheckCircle2 aria-hidden="true" /> Payment completed. Your current
          subscription and balances are refreshing.
        </p>
      ) : result === "cancel" ? (
        <p className="billing-notice" role="status">
          Checkout was cancelled. No billing change was made.
        </p>
      ) : null}
      {actionError ? (
        <p className="form-error" role="alert">
          {actionError instanceof Error
            ? actionError.message
            : "The billing action could not be started."}
        </p>
      ) : null}

      <div className="billing-summary">
        <section>
          <CreditCard aria-hidden="true" />
          <div>
            <span>Current plan</span>
            <strong>{entitlement?.plan_label ?? "Loading plan…"}</strong>
            <small>{statusCopy(subscription.data)}</small>
          </div>
          {entitlement?.plan_name !== "free" ? (
            <button
              type="button"
              onClick={() => portal.mutate()}
              disabled={portal.isPending || !subscription.data}
            >
              {portal.isPending ? "Opening…" : "Manage subscription"}
              <ExternalLink aria-hidden="true" />
            </button>
          ) : null}
        </section>
        <section>
          <Gauge aria-hidden="true" />
          <div>
            <span>Monthly AI usage</span>
            <strong>
              {number.format(used)} of {number.format(limit)} tokens
            </strong>
            <small>
              {number.format(entitlement?.purchased_tokens_remaining ?? 0)}
              {" purchased tokens available"}
            </small>
          </div>
          <progress
            value={usagePercent}
            max={100}
            aria-label={`${usagePercent}% of monthly AI allowance used`}
          />
        </section>
      </div>

      {usagePercent >= 80 ? (
        <p className="quota-warning" role="status">
          {usagePercent >= 100
            ? "Your monthly AI allowance is used. Purchased tokens may continue to support entitled features."
            : "You are nearing your monthly AI allowance. Review usage before starting a large generation task."}
        </p>
      ) : null}

      <section className="billing-section" aria-labelledby="plans-title">
        <header>
          <div>
            <h2 id="plans-title">Available plans</h2>
            <p>Availability is controlled by the server-owned plan catalogue.</p>
          </div>
        </header>
        {plans.isPending ? (
          <p role="status">Loading available plans…</p>
        ) : plans.isError ? (
          <p role="alert">Plans could not be loaded. Try again later.</p>
        ) : plans.data?.length ? (
          <div className="billing-plans">
            {plans.data.map((plan) => (
              <article key={plan.key}>
                <div>
                  <h3>{title(plan.plan)}</h3>
                  <p>
                    {title(plan.interval)} billing · {number.format(plan.token_limit)}
                    {" AI tokens per period"}
                  </p>
                  {plan.trial_days ? (
                    <small>{plan.trial_days}-day trial available</small>
                  ) : null}
                </div>
                <button
                  className="primary"
                  type="button"
                  onClick={() => checkout.mutate(plan.key)}
                  disabled={checkout.isPending}
                >
                  Continue to secure checkout
                </button>
                <small>Current price and currency appear before payment.</small>
              </article>
            ))}
          </div>
        ) : (
          <p className="billing-empty">
            No paid plan is currently available in this environment. Your
            existing access remains unchanged.
          </p>
        )}
      </section>

      <section className="billing-section token-top-up" aria-labelledby="tokens-title">
        <header>
          <div>
            <h2 id="tokens-title">Purchased tokens</h2>
            <p>Supplement your plan allowance without changing plans.</p>
          </div>
        </header>
        {product ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              topUp.mutate();
            }}
          >
            <label>
              Token amount
              <input
                type="number"
                value={tokens}
                min={product.min_tokens}
                max={product.max_tokens}
                step={product.step_tokens}
                onChange={(event) => setTokens(event.currentTarget.valueAsNumber)}
              />
            </label>
            <output aria-live="polite">Estimated checkout total: {topUpPrice}</output>
            <button className="primary" disabled={topUp.isPending || !tokens}>
              {topUp.isPending ? "Opening checkout…" : "Buy tokens"}
            </button>
          </form>
        ) : tokenProduct.isPending ? (
          <p role="status">Loading token options…</p>
        ) : (
          <p role="alert">Token products are not available right now.</p>
        )}
      </section>

      <section className="billing-section" aria-labelledby="usage-title">
        <header>
          <div>
            <h2 id="usage-title">Current-month usage</h2>
            <p>Request-level usage from your account only.</p>
          </div>
        </header>
        {usage.isPending ? (
          <p role="status">Loading usage history…</p>
        ) : logs.length ? (
          <div className="table-wrap">
            <table className="billing-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Date</th>
                  <th>Metered tokens</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((row) => (
                  <tr key={row.id}>
                    <td data-label="Task">{title(row.task_type)}</td>
                    <td data-label="Date">{formatDate(row.created_at)}</td>
                    <td data-label="Metered tokens">{number.format(row.metered_tokens)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="billing-empty">No AI usage has been recorded this month.</p>
        )}
        {usage.hasNextPage ? (
          <button
            type="button"
            onClick={() => usage.fetchNextPage()}
            disabled={usage.isFetchingNextPage}
          >
            {usage.isFetchingNextPage ? "Loading…" : "Load more usage"}
          </button>
        ) : null}
      </section>

      {purchases.data?.length ? (
        <section className="billing-section" aria-labelledby="purchases-title">
          <header>
            <div>
              <h2 id="purchases-title">Token purchases</h2>
            </div>
          </header>
          <ul className="purchase-list">
            {purchases.data.map((purchase) => (
              <li key={purchase.id}>
                <strong>{number.format(purchase.metered_tokens)} tokens</strong>
                <span>{title(purchase.status)}</span>
                <time dateTime={purchase.created_at}>{formatDate(purchase.created_at)}</time>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function SettingsNav() {
  const tabs = [
    ["/app/settings/profile", "Profile"],
    ["/app/settings/security", "Security"],
    ["/app/settings/privacy", "Privacy"],
    ["/app/settings/billing", "Billing & usage"],
  ] as const;

  return (
    <nav aria-label="Settings">
      {tabs.map(([to, label]) => (
        <NavLink
          key={to}
          to={to}
          onPointerEnter={() => preloadAppRoute(to)}
          onFocus={() => preloadAppRoute(to)}
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

function statusCopy(subscription?: {
  subscription_status: string;
  cancel_at_period_end: boolean;
  current_period_end: string | null;
}) {
  if (!subscription) return "Subscription status is loading.";
  if (subscription.cancel_at_period_end && subscription.current_period_end)
    return `Access continues until ${formatDate(subscription.current_period_end)}.`;
  if (subscription.current_period_end)
    return `${title(subscription.subscription_status)} · renews ${formatDate(subscription.current_period_end)}`;
  return title(subscription.subscription_status);
}

function title(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Date unavailable" : date.format(parsed);
}
