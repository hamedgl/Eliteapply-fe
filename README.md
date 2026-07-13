# EliteApply frontend

Independent React/Vite frontend for [eliteapply.net](https://eliteapply.net), built against EliteApply API v0.1.0.

## Setup

1. Copy `.env.example` to `.env` and adjust only environment-specific public values.
2. Run `npm install`.
3. Run `npm run api:generate` whenever `docs/api/openapi.json` changes.
4. Run `npm run dev`.

Tokens are kept in browser memory. Session restoration uses the backend's HttpOnly refresh cookie. Do not add token persistence.

## Checks

`npm run typecheck`, `npm test`, `npm run build`, and `npm run api:check`.

Implementation status and phase handoffs live in `docs/implementation/`.
