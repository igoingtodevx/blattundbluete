# Blatt & Blüte Freudenberg

A React/Vite storefront prototype for a florist: product catalogue, example sale items, flower knowledge, about content, reservation prefill flow, and a conversational bouquet adviser.

## Public deployment

The following URL was checked anonymously during this audit and returned HTTP 200:

- <https://blatt-und-bluete-freudenberg.vercel.app/>

The page is public, but the chat still depends on server-side provider configuration and the reservation flow is explicitly demo-only.

## Evidence-backed stack

- React 19 and TypeScript
- Vite 8 with a hash-routed single-page frontend
- Vercel static hosting configuration and a TypeScript server function at `api/chat.ts`
- Vitest tests and ESLint
- `chess.js` is not used here; the conversational logic is custom TypeScript with local product/content data

## Implemented scope

- Frontend pages for home, catalogue, sale items, flower knowledge, about, and reservation preparation.
- Local product catalogue with product modals and chat-driven suggestions.
- Chat rules for preference extraction, opening-hours answers, example-only inventory handling, action validation, and an in-memory rate limit.
- `api/chat.ts` provider chain: Amazon Bedrock Converse first when `AWS_BEARER_TOKEN_BEDROCK` is present, then an OpenAI-compatible `/chat/completions` endpoint when `CHAT_LLM_API_KEY` is present.
- Unit tests for chat parsing/rules, product data, inventory helpers, reservations, and related utilities.

## Status

This is a publicly deployed storefront/demo prototype. The frontend and chat handler are implemented, but real shop operations are not connected: inventory and reservations remain demo services, and the catalogue is explicitly example data rather than a live stock feed.

## Local setup

The repository uses pnpm:

```bash
pnpm install
pnpm dev
pnpm build
pnpm test
pnpm lint
```

`pnpm dev` starts Vite for the frontend. Because `api/chat.ts` is a Vercel-style server function, use a Vercel-compatible local runtime (for example `vercel dev`) or a deployed environment when exercising `/api/chat`; plain Vite alone does not provide that endpoint.

## Chat configuration

Keep credentials server-side. The provider variables read by `api/chat.ts` are:

| Variable | Purpose |
| --- | --- |
| `AWS_BEARER_TOKEN_BEDROCK` | Enables the preferred Bedrock Converse path |
| `AWS_BEDROCK_REGION` | Bedrock region; code default is `eu-central-1` |
| `AWS_BEDROCK_MODEL` | Bedrock model; code default is `eu.anthropic.claude-sonnet-4-6` |
| `CHAT_LLM_API_KEY` | Enables the OpenAI-compatible fallback |
| `CHAT_LLM_BASE_URL` | Optional fallback base URL; set it to your provider's `/v1`-style base |
| `CHAT_LLM_MODEL` | Optional fallback model; code default is `gpt-4o-mini` |
| `CHAT_PROVIDER_TIMEOUT_MS` | Optional provider timeout, bounded by the handler |

The checked-in example environment file also contains a Gemini-related variable, but the current `api/chat.ts` implementation does not call Gemini. Treat that entry as unused until the code changes.

## Limitations

- Product stock is `example-only`; the demo inventory service is in-memory and is not a POS integration.
- Reservation submission validates input locally and returns `demo-accepted`; it does not save or send a reservation to the shop.
- Chat availability, latency, cost, and output quality depend on the configured provider. Bedrock failure can fall back to the OpenAI-compatible provider only when both are configured.
- The repository does not document or guarantee a live inventory, payment, delivery, or webhook integration.
