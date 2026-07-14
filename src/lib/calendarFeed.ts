import { resolveSafeHttpUrl } from "./api/signedTransport";

export function calendarFeedUrls(value: string) {
  const https = resolveSafeHttpUrl(value);
  return {
    https,
    webcal: https.replace(/^https?:/i, "webcal:"),
    masked: maskCalendarFeedUrl(https),
  };
}

export function maskCalendarFeedUrl(value: string) {
  const parsed = new URL(resolveSafeHttpUrl(value));
  const slash = parsed.pathname.lastIndexOf("/");
  const suffix = parsed.pathname.endsWith(".ics") ? ".ics" : "";
  return `${parsed.origin}${parsed.pathname.slice(0, slash + 1)}••••••••${suffix}`;
}
