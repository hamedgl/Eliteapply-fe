import type { QueryClient } from "@tanstack/react-query";
import { ApiError } from "../../lib/api/errors";
import { queryKeys } from "../../lib/api/queryKeys";
import { label, stages } from "./model";

export function refreshApplications(qc: QueryClient) {
  void qc.invalidateQueries({ queryKey: queryKeys.applications });
  void qc.invalidateQueries({ queryKey: queryKeys.dashboard });
}

export function safeFilename(value: string) {
  return (
    value
      .trim()
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-|-$/g, "")
      .toLocaleLowerCase() || "application"
  );
}

function humanizeStages(text: string) {
  return stages.reduce(
    (acc, stage) => acc.replace(new RegExp(`\\b${stage}\\b`, "g"), label(stage)),
    text,
  );
}

export function readableApiError(error: unknown) {
  if (!(error instanceof ApiError))
    return error instanceof Error
      ? error.message
      : "Please refresh and try again.";
  const details = error.fields.map(({ field, message }) => {
    const cleanMessage = message.replace(/^Value error,\s*/i, "");
    return !field || field === "global"
      ? cleanMessage
      : `${label(field)}: ${cleanMessage}`;
  });
  const rawReason = [...new Set(details)].join(" ") || error.message;
  const reason = humanizeStages(rawReason).trim();
  const sentence = /[.!?]$/.test(reason) ? reason : `${reason}.`;
  return error.correlationId
    ? `${sentence} (Reference: ${error.correlationId})`
    : sentence;
}
