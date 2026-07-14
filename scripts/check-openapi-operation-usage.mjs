import { existsSync, readFileSync } from "node:fs";

const manifestPath = "docs/api/openapi-operation-usage.json";
const openapi = JSON.parse(readFileSync("docs/api/openapi.json", "utf8"));
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const required = new Set([
  "GET /api/v1/applications/{application_id}/requirements",
  "GET /api/v1/applications/{application_id}/tasks",
  "GET /api/v1/calendar-feed/{token}.ics",
  "PUT /api/v1/storage/upload",
  "GET /api/v1/storage/file",
  "GET /health",
  "GET /ready",
  "GET /metrics",
  "GET /metric",
]);
const allowed = new Set([
  "direct-spa",
  "indirect-signed-url",
  "external-calendar-client",
  "external-monitoring",
  "deployment-smoke-check",
  "deprecated-external",
  "backend-internal",
  "not-yet-implemented",
]);
const errors = [];

for (const entry of manifest.operations) {
  const key = `${entry.method} ${entry.path}`;
  if (!required.delete(key)) errors.push(`Unexpected or duplicate entry: ${key}`);
  if (!allowed.has(entry.classification))
    errors.push(`Invalid classification for ${key}: ${entry.classification}`);
  for (const field of ["operationId", "reason", "intendedConsumer", "owner", "reviewDate"])
    if (!entry[field]) errors.push(`Missing ${field} for ${key}`);
  const operation = openapi.paths?.[entry.path]?.[entry.method.toLowerCase()];
  if (!operation) errors.push(`Operation is absent from OpenAPI: ${key}`);
  else if (operation.operationId !== entry.operationId)
    errors.push(`Operation ID mismatch for ${key}`);
  if (!Array.isArray(entry.evidence) || !entry.evidence.length)
    errors.push(`Missing evidence for ${key}`);
  else
    for (const evidence of entry.evidence)
      if (!existsSync(evidence)) errors.push(`Missing evidence file for ${key}: ${evidence}`);
}
for (const key of required) errors.push(`Missing usage entry: ${key}`);

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`OpenAPI usage manifest valid: ${manifest.operations.length}/9 target operations classified.`);
