# Flashcard SaaS — AI-Assisted Study Platform

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![License](https://img.shields.io/badge/license-Private-lightgrey)]()

---

## 1. Project Title

**Flashcard SaaS** — AI-assisted flashcard generation, persistence, and study flows on a modern full-stack TypeScript/JavaScript stack (package name: `flashcard-saas`).

---

## 2. Short Technical Overview

> Full-stack SaaS-style application for generating, persisting, and reviewing flashcards. LLM inference runs behind a server-side API; user data lives in a document database with a clear multi-tenant shape; payments use hosted checkout.

**Flashcard SaaS** is a **Next.js 14 (App Router)** application that exposes a small **inference-facing API**: clients submit raw study text, the server calls an **OpenRouter** chat-completions endpoint (`openai/gpt-3.5-turbo`), enforces a **structured JSON contract** (10 Q/A pairs), and returns parsed flashcards. Authenticated users **persist** collections to **Cloud Firestore** via **batched writes**; **Clerk** handles identity at the edge; **Stripe Checkout** (subscription mode) provisions billing and a post-payment confirmation flow.

The codebase is sized for a **portfolio / product prototype** but follows patterns you would extend for real traffic: **secrets on the server**, **middleware-scoped auth**, **idempotent-friendly API design**, and **hierarchical data modeling** per user.

---

## 3. Key Features

| Area | Implementation |
|------|----------------|
| **LLM generation** | Server `POST /api/generate` — OpenRouter HTTP API, system prompt with pedagogical constraints, JSON-only response shape, parse + error handling |
| **AuthN** | Clerk (`ClerkProvider`, `clerkMiddleware`) — protected app routes and API matcher |
| **Persistence** | Firestore — `users/{uid}` metadata + per-collection subcollections; `writeBatch` for atomic multi-document saves |
| **Commerce** | Stripe — server-created Checkout Sessions; client `redirectToCheckout`; session verification via `GET /api/checkout_session` |
| **UX** | MUI — flip-card previews, collection list/detail, loading and error surfaces |

---

## 4. System Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                        Client (React / MUI)                      │
│  Sign-in (Clerk) · Generate UI · Collections · Stripe redirect   │
└───────────────┬─────────────────────────────┬───────────────────┘
                │                             │
                ▼                             ▼
┌───────────────────────┐         ┌──────────────────────┐
│  Next.js Route Handlers│         │  Clerk (hosted)       │
│  /api/generate         │         │  Sessions / JWT       │
│  /api/checkout_session │         └──────────────────────┘
└───────────┬───────────┘
            │
            ├──────────────────► OpenRouter (chat completions)
            │
            ├──────────────────► Stripe API (Checkout Sessions)
            │
            └──────────────────► Firebase Firestore (client SDK)
                    users/{uid}
                    └── {collectionName}/cards...
```

**Design notes**

- **Inference is server-side only** — API keys never ship to the browser.
- **Firestore layout** separates **collection index** (array on the user doc) from **card documents** (subcollection), which scales logically as the number of decks and cards grows.
- **Stripe** uses **hosted Checkout** so PCI scope stays minimal; subscription logic can later move to **webhooks** for entitlements.

---

## 5. AI / ML Components

This project implements a **structured generation** pipeline (not RAG):

- **Model access**: OpenRouter aggregates provider APIs; the app targets **`openai/gpt-3.5-turbo`** for cost/latency appropriate to short outputs.
- **Prompting**: A fixed **system prompt** encodes instructional design rules (single-concept cards, variety of question types, mnemonic hints, fixed count of **10** cards).
- **Contract**: The model must return JSON `{ "flashcards": [{ "front", "back" }] }`; the server **parses and validates** structurally before responding.
- **Failure modes**: Non-JSON or malformed output returns a **500** with a clear error — a hook for future **retry with repair**, **JSON mode / response schema**, or **small-model validators**.

**Natural extensions** for applied-AI interviews: retrieval over user uploads (chunking → embeddings → vector store), evaluation harnesses (BLEU/semantic similarity or LLM-as-judge), streaming tokens, or async job queues for long documents.

---

## 6. Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | **Next.js 14** (App Router), **React 18** |
| Language | **JavaScript** (plus **TypeScript** for `middleware.ts`) |
| UI | **MUI** (Emotion), custom theme provider |
| Auth | **Clerk** (`@clerk/nextjs`) |
| Database | **Firebase / Firestore** (client SDK) |
| LLM gateway | **OpenRouter** (REST, Bearer token) |
| Payments | **Stripe** (server SDK + `@stripe/stripe-js`) |
| Tooling | ESLint (`eslint-config-next`) |

---

## 7. Backend Infrastructure

- **API routes** (`app/api/*/route.js`) run as **serverless-style handlers** on typical Next.js hosts (e.g. Vercel): scale-out is **per-request**, cold starts are the main latency consideration for inference.
- **`/api/generate`**: accepts **plain text body**, forwards to OpenRouter, returns JSON array of cards.
- **`/api/checkout_session`**: **`POST`** creates a **subscription** Checkout Session; **`GET`** retrieves session by `session_id` for the **result** page.
- **Middleware** applies Clerk to matched routes including **`/api`**, aligning with **zero-trust** API access for a locked-down deployment.

**Security posture (current)**

- OpenRouter and Stripe secrets are **environment variables** on the server.
- Firebase uses **public** web config keys (standard for client SDK) — **Firestore Security Rules** should enforce `request.auth.uid == userId` in production (rules are not in-repo; document this in deployment runbooks).

---

## 8. Deployment Details

Typical deployment: **Vercel** (or any Node host supporting Next.js 14).

**Required environment variables**

| Variable | Purpose |
|----------|---------|
| `OPENROUTER_API_KEY` | Server → OpenRouter |
| `STRIPE_SECRET_KEY` | Server → Stripe |
| `NEXT_PUBLIC_STRIPE_PUBLIC_KEY` | Client Stripe.js |
| `NEXT_PUBLIC_*` Firebase keys | Firestore client |
| Clerk keys | As per Clerk dashboard (`NEXT_PUBLIC_CLERK_*`, `CLERK_SECRET_KEY`, etc.) |

Configure **Stripe** success/cancel URLs to match your production domain (currently derived from request `origin` in code). For subscriptions, add **Stripe webhooks** in production to sync **payment_status** and **plan tier** with Firestore or Clerk metadata.

---

## 9. Challenges and Engineering Decisions

1. **Structured output from LLMs** — Free-form text is brittle; the app standardizes on **JSON** and catches parse failures. Trade-off: occasional model drift; mitigation path is provider **JSON mode**, **function calling**, or a lightweight **repair** pass.
2. **Firestore data model** — User doc holds **collection names**; cards live in **subcollections** to avoid huge arrays and to keep queries scoped. Saves use **`writeBatch`** to **reduce round-trips** and keep metadata + cards consistent in one commit.
3. **Auth + data isolation** — Clerk IDs partition data under `users/{uid}`. Production hardening = **Firestore rules** + optional **server-side writes** via Admin SDK for stronger guarantees.
4. **Stripe vs. product entitlements** — Checkout proves payment on the **result** page; **ongoing** Pro gating (e.g. rate limits on `/api/generate`) would use **webhooks** + a **plan** field — intentional next step for SaaS completeness.
5. **OpenRouter vs. direct OpenAI** — Abstracts provider routing and keys; swappable to **Azure OpenAI**, **Anthropic**, or self-hosted inference without changing the client contract.

---

## 10. Performance and Scalability

**Current strengths**

- **Batched Firestore writes** when persisting a full deck.
- **Server-side inference** keeps clients thin and protects keys.
- **Hosted Checkout** offloads payment UI and compliance surface.

**How this scales toward “real users”**

| Direction | Approach |
|-----------|----------|
| **API throughput** | Rate limiting (edge or API gateway), per-user quotas, queue **long** generations to **workers** |
| **LLM cost/latency** | Cache by **content hash**, smaller models for drafts, **streaming** UX |
| **Data** | Firestore indexes on query patterns; move hot paths to **Firestore-triggered** functions if needed |
| **Multi-region** | Deploy Next.js to edge regions; colocate Firestore; consider **global load balancing** |

---

## 11. Future Improvements

- **Stripe webhooks** → sync subscription state; **gate** `/api/generate` by plan.
- **Firestore Security Rules** (and rule tests) checked into the repo.
- **RAG**: chunk uploads, **embeddings**, **vector search** (e.g. Pinecone, pgvector), cite sources on card backs.
- **Observability**: structured logging, traces around OpenRouter latency, error budgets.
- **Testing**: API route tests (msw / vitest), Stripe CLI webhook fixtures, prompt regression set.
- **CI**: GitHub Actions — `lint`, `build`, secret scanning.
- **Admin SDK** route for writes if you want **server-only** persistence and stricter validation.

---

## 12. Screenshots / Demo

_Add 2–4 screenshots or a short Loom/GIF: landing + pricing, generate flow, flip-card preview, collections, post-checkout result._  

**Suggested captions for recruiters**

1. **Product surface** — value prop and Stripe-backed Pro tier.  
2. **Generation** — text in → structured cards out (shows AI integration).  
3. **Persistence** — named collections stored per user.  
4. **Study mode** — flip interaction reading from Firestore.

---

## 13. Installation Instructions

```bash
git clone <your-repo-url>
cd FlashCards(works)
npm install
```

Create a `.env.local` (or host-specific secrets) with the variables in **Deployment Details**.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build && npm start   # production-like run
```

---

## 14. API and System Flow Overview

### `POST /api/generate`

- **Request**: `Content-Type: text/plain`, body = user notes or topic text.  
- **Behavior**: Builds OpenRouter `messages` with system + user content; expects JSON; returns **array** of `{ front, back }`.  
- **Errors**: `500` on upstream or parse failure.

### `POST /api/checkout_session`

- Creates Stripe **subscription** Checkout Session (Pro tier pricing in code).  
- Returns session object (client uses `id` for `redirectToCheckout`).

### `GET /api/checkout_session?session_id=...`

- **Retrieves** session for **payment_status** display on `/result`.

### User flows

1. **Generate** — `POST /api/generate` → preview → **batch** save to Firestore under `users/{uid}/{collectionName}`.  
2. **Browse** — read user doc → navigate to `/flashcard?id={collectionName}` → `getDocs` on subcollection.  
3. **Subscribe** — `POST` checkout → Stripe → `/result` confirms via `GET` session.

---

## 15. Resume-Style Impact Summary

Use bullets like these on a resume or LinkedIn (tune numbers only if you add metrics):

- Architected a **Next.js 14** full-stack app integrating **LLM inference** (OpenRouter / GPT-3.5) behind a **typed JSON API**, with **server-only secrets** and structured error handling for **non-deterministic model output**.  
- Implemented **multi-tenant persistence** in **Firestore** using **hierarchical collections** and **batched writes** to keep deck metadata and card documents consistent.  
- Integrated **Clerk** authentication with **Next.js middleware** and route protection aligned to **API routes**.  
- Shipped **Stripe Checkout** (subscription) with **server-side session creation** and **client-side hosted payment** flow, minimizing PCI scope.  
- Documented **scaling paths**: rate limiting, webhooks for entitlements, optional **RAG** and **observability** for production hardening.

---

## Suggested README / Repo Additions (Optional)

**Sections you may add later**

- **Threat model** — who can read/write which Firestore paths.  
- **Environment template** — `.env.example` (no secrets).  
- **Architecture Decision Records** — e.g. why OpenRouter, why client Firestore vs Admin SDK.

**Badges** (swap in your real links)

- Build: GitHub Actions `build` badge.  
- Deploy: Vercel badge.  
- Links: **Live demo**, **LinkedIn**, **personal site**.

**Repo organization**

- `docs/architecture.md` for diagrams.  
- `src/` or consistent `app/` + `lib/` split if the codebase grows.  
- Single top-level `README.md`; remove duplicate root files (`layout.js` vs `app/layout.js`) if unintentional.

**Stronger signal for AI / new-grad recruiting**

1. **`/.env.example`** + **CI** that runs `npm run lint && npm run build`.  
2. **One integration test** for `/api/generate` (mocked OpenRouter).  
3. **Short “Evaluation” section** — even a table of 5 hand-checked prompts improves credibility.  
4. **Optional RAG v0** — one **embedding** + **cosine** search path demonstrates retrieval fluency.  
5. **Public demo** on Vercel with **test keys** rotated or rate-limited.

---

_Repository: **flashcard-saas** — AI-assisted generation, authenticated storage, and subscription checkout on a modern React stack._
