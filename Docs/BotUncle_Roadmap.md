# BotUncle — Zero-Spend, Production-Grade RAG SaaS
### Full from-scratch rebuild roadmap + infrastructure plan + learning companion

> Supersedes the earlier "Botangirl" draft. Renamed back to **BotUncle** (matches your existing repo). This version rebuilds the project from scratch with a production folder structure, Docker from day one, and an architecture that costs you **₹0 upfront and ₹0 recurring until a business actually pays you** — at which point specific, named upgrade triggers tell you exactly what to switch. **Build locally first; deploy to Cloud Run + Cloudflare only in Phase 11** when the MVP is worth hosting.

---

## 0. How to use this document

- Keep it as `docs/ROADMAP.md` in a fresh repository (don't keep patching the old one — Section 4 gives you the new structure to build into; you can copy individual React components like login forms over from the old repo, but the project is being re-architected, not incrementally patched).
- Paste a phase's section to your AI coding agent at the start of each session, plus your current folder tree, so it has real context instead of guessing.
- After the agent writes something, ask it *"why this approach and not X"* before accepting — that question is what turns this into interview prep instead of copy-paste.
- Section 7 (security) directly answers the widget-snippet question you asked — read that one carefully before you build Phase 2, because the defenses need to be designed in from the start, not bolted on later.

---

## 1. What's different from the first draft

| Change | Why |
|---|---|
| Name: Botangirl → **BotUncle** | Matches your actual repo and brand |
| Full from-scratch rebuild, not an incremental patch | You want production-grade folder structure and Docker from day one — easier to build it right than retrofit it |
| **₹0 infrastructure spend** until you have a paying business | Every single component below has a genuinely free tier; paid upgrades are listed as explicit triggers, not a fixed monthly bill you carry while pre-revenue |
| Dedicated **widget security section** (Section 7) | You asked a sharp, real question about the embed snippet — it deserves a full architectural answer, not a footnote |
| Dropped Vercel for the dashboard | Vercel's Hobby (free) plan **terms of service explicitly prohibit commercial use** — the day a business pays you, you're in violation. Swapped for Cloudflare Pages, which has no such restriction, and which you'll already be using for DNS |
| Dropped reliance on Appwrite Functions | Appwrite's free plan was cut to **2 functions max** (Jan 2026 change). All compute logic now lives in one FastAPI service you fully control, which is also a better interview story than a handful of platform functions |
| **Local-first build, deploy in Phase 11** | Google Cloud may require a refundable billing prepayment (e.g. ₹1000) before Cloud Run is usable — that violates "₹0 upfront" during skeleton/MVP work. Architecture unchanged; only the *schedule* moves cloud deploy to after the product is built locally |

---

## 2. Vision

**Product:** any business signs up, drops in their documents (no manual FAQ typing required), gets a chat widget live on their site in minutes, and pays a monthly subscription. You run this for real businesses, not just as a portfolio piece.

**Learning:** by the end, you can whiteboard — without notes — embeddings, vector search, chunking, RAG failure modes, agentic tool-calling, multi-tenant security, containerized deployment, and SaaS billing. Every phase below is written so the *building* teaches the concept.

---

## 3. The zero-spend philosophy

The rule: **every component must have a free tier that is free indefinitely (not a 12-month trial), and you upgrade only when a specific, named trigger fires** — almost always "a paying customer's usage requires it," which means the upgrade pays for itself.

**Local-first corollary:** Phases 0–10 run entirely on your machine via Docker Compose + free-tier SaaS APIs (Appwrite, Pinecone, Gemini). No Google Cloud billing account, no Cloudflare domain setup, and no CI deploy pipeline are required until **Phase 11 — Production Deployment**, when you have a real MVP to host.

Two free-tier traps to avoid, found while researching this:
- **AWS S3 / EC2 "free tier"** is free for 12 months only, then billed — avoided here by not using S3 for storage (Appwrite Storage instead) and not using EC2 (Cloud Run instead, whose free tier is permanent).
- **Vercel Hobby** plan free tier is permanent *but contractually for non-commercial use only* — avoided by using Cloudflare Pages for the dashboard instead.
- **AWS Route 53** (DNS) costs ~$0.50/month per hosted zone — avoided by keeping DNS at your existing registrar or, better, pointing your domain's nameservers to **Cloudflare**, which is free DNS *and* gives you WAF/CDN/bot-protection as a side effect.
- **Google Cloud billing prepayment** (refundable, but upfront — e.g. ₹1000 in some regions) is required before Cloud Run activates — deferred to Phase 11 so Phase 0 skeleton work stays truly ₹0 out of pocket.

Full upgrade-trigger table is in Section 13 — read it once now so every stack choice below makes sense as "free until X happens."

---

## 4. Repository structure (build this in Phase 0)

A monorepo, Docker-first, everything in components/services — not one giant React app talking directly to Gemini.

```
botuncle/
├── apps/
│   ├── dashboard/                 # React + Vite — business-facing dashboard
│   │   ├── src/
│   │   │   ├── components/        # one component per file, no god-components
│   │   │   ├── features/          # documents/, billing/, analytics/, widget-config/
│   │   │   ├── lib/appwrite.ts    # Appwrite client SDK setup
│   │   │   └── lib/api.ts         # typed client for the ai-service API
│   │   ├── Dockerfile             # for local dev parity, not required at deploy (Cloudflare Pages builds it)
│   │   └── package.json
│   └── widget/                    # the embeddable script — deliberately separate from dashboard
│       ├── src/
│       │   ├── init.ts            # handshake logic (Section 7)
│       │   ├── ui.ts              # renders the bubble + chat panel inside an iframe
│       │   └── index.ts           # entry point, bundled to one tiny file
│       ├── vite.config.ts         # library mode, target: a single widget.js, <30KB gzip goal
│       └── package.json
├── services/
│   └── ai-service/                # FastAPI — the brain: ingestion, RAG, agents, billing webhooks, widget auth
│       ├── app/
│       │   ├── main.py
│       │   ├── core/               # config, security/jwt, rate_limit.py, logging
│       │   ├── ingestion/          # parsers/ (pdf.py, docx.py, xlsx.py), chunker.py, pipeline.py
│       │   ├── retrieval/          # embeddings.py, vector_store.py (Pinecone), retriever.py
│       │   ├── agent/              # tools.py, router.py, loop.py
│       │   ├── widget/             # init.py (handshake), chat.py
│       │   ├── billing/            # razorpay.py, webhooks.py, quotas.py
│       │   └── integrations/       # appwrite_client.py, gemini_client.py, redis_client.py
│       ├── tests/
│       ├── Dockerfile
│       └── requirements.txt / pyproject.toml
├── infra/
│   ├── docker-compose.yml          # local dev: ai-service + redis + .env.example
│   ├── github-actions/             # Phase 11 templates: deploy-ai-service.yml, deploy-dashboard.yml
│   └── scripts/                    # one-off setup scripts (create Pinecone index, seed Appwrite collections)
├── docs/
│   ├── ARCHITECTURE.md             # condensed Section 5 + 8 from this file
│   ├── SECURITY.md                 # condensed Section 7
│   └── ROADMAP.md                  # this file
└── README.md
```

**Why this shape, in one sentence each:** `apps/widget` is separate from `apps/dashboard` because they ship to different places and have wildly different size budgets (a widget injected into someone else's site must be tiny; a dashboard doesn't); `services/ai-service` is one Python service, not split into microservices, because at this scale multiple services would mean more deployment surface for no real benefit — name this tradeoff explicitly if asked in an interview ("modular monolith over premature microservices").

**Docker from day one:** `infra/docker-compose.yml` runs `ai-service` + a local Redis container — your laptop is the dev environment through Phase 10. The same Dockerfile is what Cloud Run will use in Phase 11, so there is no "works on my machine" gap when you eventually deploy. The dashboard runs via Vite's dev server locally (faster iteration); it gets a Dockerfile for Phase 11 portability.

---

## 5. Target architecture

```mermaid
flowchart TB
    subgraph Client["Business website"]
        W[Widget iframe]
    end
    subgraph CF["Cloudflare (free) — your domain"]
        DNS[DNS + WAF + Bot Fight Mode]
        Pages[Cloudflare Pages: dashboard + widget.js]
    end
    subgraph CR["Google Cloud Run (free tier) — Docker"]
        API[FastAPI ai-service]
    end
    subgraph Appwrite["Appwrite Cloud (free)"]
        Auth[Auth]
        DB[Business / Plan / Lead / Conversation DB]
        Storage[Document storage]
    end
    subgraph Ext["External — all free tier today"]
        Pinecone[(Pinecone vector DB)]
        Gemini[Gemini API: LLM + embeddings]
        Upstash[(Upstash Redis: rate limit + cache)]
        Razorpay[Razorpay: webhooks only, no upfront cost]
    end

    W -->|HTTPS via your domain| DNS --> API
    Pages --> DNS
    API --> Auth
    API --> DB
    API --> Storage
    API --> Pinecone
    API --> Gemini
    API --> Upstash
    Razorpay -->|webhook| API
```

Everything inside the `CR` and `Ext` boxes is a single FastAPI codebase calling out to managed free-tier services — no AWS Lambda, no Appwrite Functions, one place to read the logic end to end.

---

## 6. Tech stack — zero-cost mapping

| Layer | Choice | Free tier (today) | Why | Upgrade trigger |
|---|---|---|---|---|
| DNS / CDN / WAF / bot protection | **Cloudflare (Free)** | Free DDoS protection, Bot Fight Mode, 1 rate-limit rule (IP, 10s window), free SSL, Turnstile (free CAPTCHA alternative) | You already own the domain — point its nameservers here once, get a real security layer for nothing | Need >1 rate-limit rule / Super Bot Fight Mode / more WAF custom rules → Cloudflare Pro (~$20/mo) |
| Dashboard + widget hosting | **Cloudflare Pages** | Generous free static/SSR hosting, **no commercial-use restriction** (unlike Vercel Hobby) | Avoids the Vercel ToS trap entirely; one less account to manage since DNS is already here | Team features / advanced analytics needed → Pages paid add-ons |
| AI microservice compute | **Google Cloud Run** | 2M requests, 360,000 GiB-seconds, 180,000 vCPU-seconds **every month, forever** (not a trial) — region must be us-central1/us-east1/us-west1 to count | Native Docker deploys, scales to zero (no idle cost), genuinely indefinite free tier, real production-grade compute | Sustained traffic past free quota → pay-as-you-go Cloud Run (still cheap, scales gradually, not a cliff) |
| Background/async jobs | **Cloud Tasks** (free quota) queuing back to the same Cloud Run service | Needed so a 1,000-row spreadsheet upload doesn't block an HTTP request | Volume of ingestion jobs grows a lot → still Cloud Tasks, just paid past free quota |
| Auth + business/billing DB + file storage | **Appwrite Cloud (Free)** | 100% free org, generous storage/bandwidth/DB; **note: free plan capped at 2 Functions as of Jan 2026** — so this plan uses zero Appwrite Functions, all logic lives in ai-service instead | Already familiar to you from the MVP, saves rebuilding auth from scratch | Outgrow storage/bandwidth, or want dedicated (non-shared) resources → Appwrite Pro (~$25+/project/mo) |
| Vector DB | **Pinecone (free Starter)** | ~2GB storage / ~350K vectors, one serverless index, namespace per business | Managed, zero ops, exactly what you specified wanting | Approaching free storage cap, or need multiple indexes/higher QPS → Pinecone Standard (~$50/mo minimum) |
| LLM | **Gemini API free tier** (Flash-Lite for answers, escalate to Flash for harder agent reasoning) | Free tier with lower rate limits (RPM/RPD caps) | Same provider as embeddings, one key, low latency tier built for chat-volume workloads | Free-tier rate limits start rejecting real paying customers' traffic → pay-as-you-go Gemini (still ~$0.10–$0.40/1M tokens at Flash tier — cheap even paid) |
| Embeddings | **Gemini embedding model** (`gemini-embedding-001`) free tier | Free tier covers ingestion at MVP/pilot volume | Same vendor, simpler billing | Rarely the bottleneck — ~$0.15/1M tokens paid, low priority to upgrade |
| Cache / rate limiting | **Upstash Redis (free tier)** | Serverless-friendly, designed for exactly this Cloud Run + edge pattern | Free daily command quota, no idle server to pay for | Exceed free daily commands at real scale → Upstash pay-as-you-go |
| Payments | **Razorpay Subscriptions** | No setup fee, no monthly fee — only ~2% + ~0.99% per actual transaction | Costs only appear once you have actual revenue, scales with you by construction | Never a discrete "upgrade" — it's already usage-based |
| Container registry | **GitHub Container Registry (ghcr.io)** | Free for both public and private images at this scale | Already using GitHub; one less account | Heavy image traffic → still free at any realistic indie-SaaS scale |
| CI/CD | **GitHub Actions** | Free minutes tier | Build Docker image → push to ghcr.io → deploy to Cloud Run, and deploy dashboard to Cloudflare Pages | More private-repo build minutes needed → GitHub paid minutes |
| Error tracking | **Sentry (free Developer tier)** | A few thousand events/month free | Catch production bugs before a business owner emails you about them | Event volume outgrows free tier → Sentry Team plan |

**The one thing to internalize for interviews:** this is a real *serverless, scale-to-zero* architecture — every compute component is billed by actual usage with a meaningful free allowance, not a server you're renting 24/7 and hoping stays under a limit. That's a deliberate, defensible architectural choice, not just "free stuff I found."

---

## 7. Security deep-dive: the embeddable widget problem

You asked the right question. Here's the honest, complete answer.

### 7.1 The fact you have to accept first

**Whatever you put in client-side code is public.** The widget script runs in someone else's browser; anyone can open dev tools, view source, or just copy the `<script>` tag. There is no way to ship a "secret" inside a snippet that runs in a browser — this isn't a bug you can fix, it's a property of how browsers work.

This is not a problem unique to you. **Google Analytics tracking IDs, Stripe publishable keys, Google Maps JavaScript API keys, and reCAPTCHA/Turnstile site keys are all public by the exact same design** — and all of them solve this the same way: the public ID identifies *who* is asking, and the server enforces *what they're allowed to do*, restricted by domain. You're not solving a new problem; you're applying a pattern that already exists across the industry. Say this explicitly in an interview — it shows you understand the security model isn't "broken," it's the standard one.

### 7.2 What actually happens if someone copy-pastes your snippet onto an unauthorized site

Your literal scenario: a business's embed snippet (with their public `businessId`) ends up on a website they didn't authorize. A real visitor opens that page in a real browser. Here's the defense chain:

1. **Domain allowlisting, enforced server-side.** Each business registers their domain(s) in the dashboard. Every request to your backend includes the browser's real `Origin` header — and crucially, **a real browser cannot be made to lie about its own Origin header via JavaScript**; that's enforced by the browser itself, not by your code. Your backend checks this Origin against the business's allowlist *before* doing any expensive work (before touching Pinecone or Gemini), and rejects immediately if it doesn't match.
2. **Strict CORS as a second, independent layer.** Your backend's CORS configuration should reflect `Access-Control-Allow-Origin` only for the *matching* allowed origin — never `*`. This means even if step 1 had a bug, the browser itself would block the unauthorized site's JavaScript from reading the response. Two independent layers catching the same mistake is the point.
3. **A handshake token, not a raw businessId, for every chat message.** Don't have the widget send the public `businessId` on every single chat call. Instead: on page load, the widget calls `POST /widget/init` once. That endpoint does the Origin check (step 1) and, if it passes, issues a short-lived signed token (a JWT, ~15–30 minutes, scoped to `{businessId, sessionId, origin}`). Every subsequent `/chat` call must present this token; the backend validates the signature and expiry, not the Origin again. This is the diagram shown above. Why bother with this extra step instead of just checking Origin on every message? Because it gives you **one chokepoint to monitor, rate-limit, and challenge** (see point 5) instead of scattering that logic across every chat call, and it means a leaked/old token expires on its own.

**For your exact scenario — someone copies the snippet to a site they don't control, a real visitor loads it in a real browser** — steps 1–3 stop this cleanly, because the visiting browser sends the *true* origin of the unauthorized site, which isn't on the allowlist.

### 7.3 What this does *not* stop, and why you add more layers anyway

A determined attacker doesn't have to use a browser at all — they can write a script that calls your API directly with a forged `Origin` header (curl, a Python script, a server-to-server call). Browsers enforce Origin headers; arbitrary HTTP clients don't have to. This is the honest limit of allowlisting alone, so you add layers that don't depend on Origin being trustworthy:

4. **Rate limiting at two layers.** Cloudflare's free plan gives you one edge-level rate-limit rule (by IP) — cheap first line of defense, blocks obvious blasts before they even reach Cloud Run. Layer a second, more granular limit in your app via Upstash Redis: per `businessId`, per IP, per plan tier (a Free-trial business should have a tighter cap than a paying Growth-tier one).
5. **Hard usage quotas — your real financial backstop.** Track `messagesUsed` per business per month. Once a business's plan quota is hit, `/chat` returns a graceful fallback ("this assistant has reached its monthly limit") instead of calling Gemini. This caps your downstream LLM cost *regardless of how the abuse happened* — it's the one defense that doesn't care whether the attacker bypassed Origin checking, spoofed headers, or did anything clever. This matters because the cost exposure is really twofold: the *business's* paid-for quota getting drained by unauthorized traffic, and *your* Gemini bill rising with no matching revenue — quotas cap both at once.
6. **Turnstile (Cloudflare's free CAPTCHA) on the `/widget/init` handshake**, not on every chat message — invisible to real users almost all the time, but raises the cost of scripting mass fake "page loads" against your init endpoint.
7. **Key/token rotation.** Give the business owner a "Regenerate widget key" button in the dashboard. If you ever detect abuse tied to one business's key, they (or you, on their behalf) can rotate it, instantly invalidating anything built against the old one.
8. **Anomaly alerts.** If a business that normally gets 50 messages/day suddenly gets 5,000 in an hour, auto-pause and email both them and you, rather than silently burning quota and API cost until someone notices the bill.

### 7.4 Other issues worth handling while you're in this part of the system

- **XSS via the bot's own output.** You're injecting LLM-generated text into the DOM of someone else's live website. Never use `innerHTML` with raw model output — render with `textContent` or a strict sanitizer if you ever support rich formatting (markdown links, bold, etc.). A malicious or successfully-injected prompt should never be able to execute script in the business's website context.
- **Render the widget inside an `<iframe>`**, not directly into the host page's DOM. This is what Intercom/Crisp/Tawk-style widgets do for two reasons: it isolates your CSS from the host site's styles (no visual collisions), and it adds a real security boundary — the host page's JavaScript can't freely reach into a cross-origin iframe's DOM, which shrinks the blast radius of any bug on either side.
- **Prompt injection from retrieved documents**, covered in Phase 6 — a malicious or just confusing FAQ/document shouldn't be able to make the agent ignore its instructions or call tools it shouldn't.
- **Webhook signature verification** for Razorpay (Phase 7) — never trust a webhook payload without verifying its signature; never trust the client to self-report a successful payment.
- **Secrets never touch the client.** Gemini/Pinecone/Razorpay secret keys live only in Cloud Run environment variables, never in the dashboard or widget bundle. Use GitHub Actions encrypted secrets to inject them at deploy time, never commit `.env` files.

This whole section is exactly the kind of "I identified a real security tradeoff and designed defense-in-depth instead of a single silver bullet" story that performs well in an interview — practice explaining points 7.2 and 7.3 as a pair, since they show you understand both what a defense achieves *and* its honest limit.

---

## 8. Data model

### 8.1 Appwrite collections

```mermaid
erDiagram
  BUSINESSES ||--o{ DOCUMENTS : uploads
  BUSINESSES ||--o{ CONVERSATIONS : has
  BUSINESSES ||--o{ LEADS : captures
  BUSINESSES ||--|| SUBSCRIPTIONS : has
  CONVERSATIONS ||--o{ MESSAGES : contains
  PLANS ||--o{ SUBSCRIPTIONS : defines
  BUSINESSES {
    string id PK
    string ownerId
    string name
    string widgetKey
    string allowedDomains
    string widgetConfig
  }
  DOCUMENTS {
    string id PK
    string businessId FK
    string fileName
    string status
    int chunkCount
  }
  CONVERSATIONS {
    string id PK
    string businessId FK
    string sessionId
    string channel
  }
  MESSAGES {
    string id PK
    string conversationId FK
    string role
    string content
  }
  LEADS {
    string id PK
    string businessId FK
    string name
    string email
  }
  PLANS {
    string id PK
    string name
    float price
    int messageQuota
  }
  SUBSCRIPTIONS {
    string id PK
    string businessId FK
    string planId FK
    string razorpaySubId
    string status
  }
```

Add `UsageMeters {businessId, month, messagesUsed, embeddingTokensUsed}` for quota enforcement (Section 7.3) and your own cost tracking. No separate "WidgetSessions" table needed — the handshake token (Section 7.2) is a stateless signed JWT, deliberately not stored anywhere, so validating it costs you zero database reads.

### 8.2 Pinecone schema

One index, **namespace = `businessId`** — never query across namespaces. Vector metadata: `{documentId, chunkIndex, sourceFileName, text}`. Storing the full chunk text directly in Pinecone metadata (rather than a second round-trip to Appwrite) is the simplest correct choice for this scale, and a perfectly defensible one to state plainly if asked why.

---

## 9. Phase-by-phase build plan

### Phase 0 — Monorepo, Docker & local dev environment (2–3 days)
**Goal:** the skeleton from Section 4 exists, builds, and runs **locally** end-to-end before any real feature is written.

- [ ] Create the repo with the `apps/`, `services/`, `infra/`, `docs/` structure.
- [ ] `services/ai-service`: FastAPI skeleton with `/health`, Dockerfile (multi-stage, non-root user), `infra/docker-compose.yml` with Redis.
- [ ] `apps/dashboard`: Vite + React skeleton — runs at `http://localhost:5173` via `pnpm --filter dashboard dev`.
- [ ] `apps/widget`: Vite library-mode scaffold — builds to `dist/widget.js`.
- [ ] `infra/.env.example` + local `.env` wired into docker-compose.
- [ ] **Local verification (replaces Cloud Run deploy for this phase):**
  - `docker compose up` in `infra/` → `http://localhost:8000/health` returns `{"status":"healthy",...}`
  - `pnpm --filter dashboard dev` → BotUncle landing page loads
  - `pnpm --filter widget build` → `dist/widget.js` produced
- [ ] Sign up for free-tier services with **no upfront payment**: Appwrite Cloud (free org), Pinecone (free index), Gemini API (free tier), Razorpay (test mode). Optional now: Sentry (free Developer tier).

**Explicitly deferred to Phase 11:** Google Cloud (billing, Cloud Run), Cloudflare (domain, Pages, WAF), GitHub Actions → GHCR → Cloud Run deploy, production secrets.

**Concepts:** containerization (why Docker — "the same Dockerfile runs on my laptop and later on Cloud Run"); monorepo vs microservices; **local-first development** — prove the product works in Docker Compose before spending anything on hosting.

**Agent prompt:** *"Scaffold a monorepo with apps/dashboard (Vite+React), apps/widget (Vite library mode), services/ai-service (FastAPI with a /health endpoint), and infra/docker-compose.yml running ai-service plus a local Redis container. Add a Dockerfile for ai-service using a slim Python base image, multi-stage build, non-root user. Verify everything runs locally — no cloud deploy."*

### Phase 1 — Core auth & business management (1 week)
**Goal:** a business can sign up, log in, and see an empty dashboard with a `Business` record created.

- [ ] Appwrite Auth wired into `apps/dashboard` (signup/login/session).
- [ ] `Businesses`, `Plans` collections in Appwrite; on signup, create a Business row with a generated `widgetKey` and a default Free plan.
- [ ] Dashboard: business profile page, "add allowed domain" form (just data entry for now — enforcement comes in Phase 2).
- [ ] `services/ai-service`: an `integrations/appwrite_client.py` module the rest of the service will reuse — server-side Appwrite SDK with an API key, never the client SDK.

**Concepts:** session vs API-key auth (the dashboard uses Appwrite's session/JWT auth for the business owner; the ai-service talks to Appwrite as a trusted server using a private API key — two different trust boundaries, don't mix them up).

**Agent prompt:** *"Implement Appwrite email/password auth in the React dashboard (signup, login, logout, protected routes). On successful signup, call an Appwrite Function-free server endpoint (we'll build this in ai-service) that creates a Business document with a generated widgetKey, an empty allowedDomains array, and a default Free plan reference."*

### Phase 2 — Embeddable widget + security handshake (1–1.5 weeks)
**Goal:** the widget renders on a test HTML page, completes the handshake from Section 7.2, and exchanges a stub "echo" reply — the full security plumbing exists *before* RAG is built on top of it.

- [ ] `apps/widget`: tiny bundle (target <30KB gzip) that injects an iframe, renders a chat bubble, and on load calls `POST /widget/init`.
- [ ] `services/ai-service/app/widget/init.py`: validates `Origin` against the business's `allowedDomains`, issues a short-lived JWT on match, returns 403 + logs on mismatch.
- [ ] `services/ai-service/app/widget/chat.py`: validates the JWT, for now just echoes the message back (real RAG comes in Phase 5).
- [ ] Strict CORS config: reflect `Access-Control-Allow-Origin` only for the matching allowed origin.
- [ ] Dashboard: show the embed snippet (`<script src="https://yourdomain.com/widget.js" data-business="...">`), the "regenerate widget key" button, and the allowed-domains list actually enforced now.
- [ ] Test it for real: paste the snippet into a throwaway static HTML file on a *different* local origin and confirm the handshake is rejected; then add that origin to the allowlist and confirm it passes.

**Concepts:** everything in Section 7 — this phase *is* that section, built. Be ready to explain the Origin-check / JWT-handshake / rate-limit / quota stack as four independent, complementary layers, not redundant copies of the same check.

**Agent prompt:** *"Build the widget security handshake: a POST /widget/init endpoint that reads the Origin header, looks up the business by widgetKey, checks Origin against allowedDomains, and on match returns a JWT (15 min expiry, payload {businessId, sessionId, origin}, signed with a server secret). Add middleware on /chat that validates this JWT and rejects expired/invalid/origin-mismatched tokens with 401. Configure CORS to reflect Access-Control-Allow-Origin only when it matches an allowed origin, never a wildcard."*

### Phase 3 — Document ingestion pipeline (1–1.5 weeks)
**Goal:** a business uploads a PDF/DOCX/XLSX/CSV from the dashboard; it gets parsed and chunked.

- [ ] Dashboard: file upload → `Documents` Appwrite Storage + a `Documents` record with `status=processing`.
- [ ] `ai-service/app/ingestion/parsers/`: one module per file type (pdf via `pdfplumber`, docx via `python-docx`, xlsx/csv via `pandas`), each outputting a normalized `{text, sourceMeta}` list.
- [ ] `ai-service/app/ingestion/chunker.py`: recursive chunking, ~300–500 tokens, ~10–15% overlap — write this by hand before reaching for a library.
- [ ] Make it async: the upload endpoint enqueues a job and returns immediately; a worker does the actual parsing/chunking and updates `Documents.status`. **Locally:** use a Redis-backed queue or a background task in the same FastAPI process. **Production (Phase 11):** Cloud Tasks pointing back at Cloud Run.

**Concepts:** the chunk-size/overlap tradeoff; why this has to be async (you cannot block an HTTP request on parsing a 1,000-row spreadsheet); Cloud Tasks as a free, managed queue vs rolling your own with Celery+Redis.

**Agent prompt:** *"Build a document ingestion module: an upload endpoint that stores the file reference and creates a Documents record with status=processing, then enqueues a Cloud Task pointing at a /ingestion/process endpoint. That endpoint detects file type, parses it via the right parser module, chunks the text recursively into ~400-token pieces with 12% overlap, and updates status=done with chunkCount. Keep parsing and chunking as independently unit-testable functions."*

### Phase 4 — Embeddings & vector store (1 week)
**Goal:** chunks become searchable vectors in Pinecone.

- [ ] Batch-embed all chunks of a document via the Gemini embeddings API (never one-at-a-time).
- [ ] Upsert to Pinecone under `namespace=businessId`.
- [ ] Re-ingestion handling: deleting/re-uploading a document must delete its old vectors by `documentId` filter first.
- [ ] A standalone retrieval test script: embed a query, print top-k results with scores, sanity-check quality by hand before wiring into chat.

**Concepts:** cosine similarity and why it's the default for text embeddings; embedding model version pinning (changing models means re-embedding everything); namespace isolation as your multi-tenancy boundary.

**Agent prompt:** *"Add an embedding+upsert pipeline: batch-embed the chunk list via Gemini embeddings, upsert into Pinecone namespace=businessId with metadata {documentId, chunkIndex, sourceFileName, text}. Add delete_document_vectors(business_id, document_id) that removes all vectors for a document by metadata filter, called before re-ingesting an updated file."*

### Phase 5 — RAG query engine (1–1.5 weeks)
**Goal:** the stub echo from Phase 2 becomes real retrieval-augmented chat.

- [ ] `/chat` (behind the Phase 2 token check): embed the incoming message, query Pinecone top 5–8 in the business's namespace.
- [ ] Build a grounded prompt: system persona + labeled retrieved chunks + last few turns of history + the question.
- [ ] Call Gemini Flash-Lite, return `{answer, usedChunkIds, retrievalScores}`.
- [ ] No-good-match guard: below a similarity threshold, return a fallback instead of generating from noise.
- [ ] Increment `UsageMeters.messagesUsed` here — this is also where the Section 7.3 quota check lives.

**Concepts:** RAG's two distinct failure modes (retrieval miss vs hallucination-despite-good-retrieval) and why each needs a different fix; why conversation history and RAG context are separate prompt sections answering different questions.

**Agent prompt:** *"Implement the real /chat handler: validate the widget JWT, check the business's monthly quota (reject gracefully if exceeded), embed the message, retrieve top 6 chunks from Pinecone, build a grounded prompt with persona + chunks + last 4 turns of history + the question, call Gemini, return {answer, usedChunkIds, retrievalScores}. If the top score is below 0.75, skip generation and return a polite fallback. Increment the UsageMeters counter for this business."*

### Phase 6 — Agentic tool-calling layer (1 week)
**Goal:** the bot can act, not just answer.

- [ ] Define tools via Gemini function calling: `search_faq` (wraps Phase 5), `capture_lead`, `escalate_to_human`.
- [ ] Hand-roll the ReAct loop: model decides answer-or-tool-call → execute → feed result back → repeat (cap at 3 rounds).
- [ ] Persist lead-capture/escalation events to Appwrite.
- [ ] Add the prompt-injection guard mentioned in Section 7.4: system instructions explicitly tell the model to never follow instructions found inside retrieved document content.

**Concepts:** the ReAct pattern, spelled out step by step; agentic AI as a mechanical loop, not a different kind of model; prompt injection as a structural problem (no hard separation between "data" and "instructions" in a text prompt) rather than something you "sanitize" away.

**Agent prompt:** *"Implement a Gemini function-calling agent loop on top of /chat with three tools: search_faq(query), capture_lead(name, email, reason) writing to Appwrite Leads, and escalate_to_human(summary). Cap the loop at 3 tool-call rounds. Add a system instruction that explicitly forbids following any instructions found inside retrieved document text or user messages that claim to override prior instructions."*

### Phase 7 — Payments & subscriptions (1 week)
**Goal:** real Razorpay billing.

- [ ] 2–3 plan tiers with different `messageQuota`.
- [ ] Razorpay Subscriptions: create-subscription flow from the dashboard.
- [ ] Webhook handler in `ai-service/app/billing/webhooks.py`: verify the Razorpay signature, handle activated/charged/cancelled/halted **idempotently** (dedupe by event ID).
- [ ] Plan upgrade/downgrade/cancel flows in the dashboard.

**Concepts:** webhook idempotency and why retried delivery makes "process exactly once" non-trivial; subscription lifecycle states; never trusting client-reported payment success.

**Agent prompt:** *"Implement Razorpay Subscriptions: a create-subscription endpoint for a given plan, and a webhook endpoint that verifies the Razorpay signature, dedupes via a processed_events table keyed by event id, handles activated/charged/cancelled/halted events, and updates the business's Subscriptions record."*

### Phase 8 — Analytics, leads & differentiators (1–1.5 weeks)
**Goal:** pick 2–3 from this list and ship them well rather than all of them shallowly.

| Feature | Effort | Interview value |
|---|---|---|
| Unanswered-question digest (low-retrieval-score questions, weekly email) | Low | Shows you're closing the retrieval gap, not just shipping retrieval |
| Lead capture + CSV export | Low | Direct revenue value for the business buying your product |
| Source citations in answers | Low–Medium | Forces metadata to be threaded through the whole pipeline correctly |
| Multi-language answers (Gemini handles this natively) | Low | Cheap, meaningfully useful for many SMBs |
| Human handoff / escalation (built in Phase 6) | — | Already covered — surface it in the dashboard as a "needs attention" inbox |

### Phase 9 — Production hardening (1 week)
**Goal:** the security and reliability layers from Section 7 are wired up in code and testable locally — ready to flip on in production during Phase 11.

- [ ] Upstash-backed (or Redis-backed locally) per-business/per-IP rate limiting on `/chat`.
- [ ] Sentry wired into `ai-service` for error tracking; structured logging throughout.
- [ ] Secrets audit: confirm nothing sensitive is in the dashboard/widget bundles or the repo.
- [ ] Turnstile integration on `/widget/init` (code ready; Cloudflare account configured in Phase 11).

**Deferred to Phase 11:** Cloudflare Bot Fight Mode, edge rate-limit rules, GCP budget alerts, production domain allowlisting.

### Phase 10 — Testing, load testing & demo polish (1 week)
**Goal:** something you can confidently demo and defend.

- [ ] Unit tests: chunking, retrieval threshold logic, webhook idempotency, JWT handshake validation — the four places a subtle bug is most damaging.
- [ ] Basic load test on `/chat` (e.g. `locust`/`k6`) — know your real latency/throughput numbers.
- [ ] Record a demo: upload a real document, ask a question, show retrieved chunks, then deliberately try the "copy the snippet to an unauthorized page" attack live and show it getting rejected — that's a genuinely good demo moment.

### Phase 11 — Production Deployment (3–5 days)
**Goal:** deploy the completed MVP to the **same target architecture** from Section 5. Only start this phase when the product is feature-complete and you are willing to pay any required upfront billing prepayment (e.g. GCP's refundable ₹1000).

- [ ] **Google Cloud:** create/link project, billing account (+ prepayment if required), $1 budget alert, enable Cloud Run Admin API, `us-central1` region, service account (`Cloud Run Admin` + `Service Account User`), GitHub secrets (`GCP_PROJECT_ID`, `GCP_SA_KEY`).
- [ ] **GitHub Actions → GHCR → Cloud Run:** copy `infra/github-actions/deploy-ai-service.yml` to `.github/workflows/`, build Docker image, push to `ghcr.io`, deploy with min-instances `0`, max-instances `2`, 512Mi, request-based billing.
- [ ] **Cloudflare:** add domain, point nameservers, enable Bot Fight Mode + one free rate-limit rule.
- [ ] **Cloudflare Pages:** deploy `apps/dashboard` (static build) and host `apps/widget/dist/widget.js`.
- [ ] **Production environment variables:** Gemini, Pinecone, Appwrite, Upstash Redis, Razorpay, JWT signing secret — injected via Cloud Run env vars and GitHub encrypted secrets, never committed.
- [ ] **Domain configuration:** dashboard URL, widget script URL, API base URL (Cloud Run service URL or custom domain).
- [ ] **Monitoring:** Sentry production DSN, GCP billing alerts, smoke-test `/health` + login + widget handshake on a real allowed domain.

**Concepts:** the deploy artifact is the same Docker image you already built locally; Phase 11 is wiring hosting, DNS, and secrets — not rewriting application logic.

**Agent prompt:** *"Set up production deployment: GitHub Actions workflow building ai-service Dockerfile, pushing to ghcr.io, deploying to Cloud Run us-central1 with scale-to-zero. Deploy dashboard and widget.js to Cloudflare Pages. Document all production env vars in infra/.env.example with a separate production checklist."*

---

## 10. Concept mastery checklist & interview prep

| Concept | 90-second answer to practice |
|---|---|
| Embeddings | Dense vectors where semantic similarity maps to geometric closeness, produced by a model trained so that meaning, not exact wording, determines position in space. |
| Cosine similarity | Measures angle, not magnitude, between two vectors — right choice when direction encodes meaning, which is the case for text embeddings. |
| Chunking tradeoff | Too small loses context within a chunk; too large dilutes retrieval precision and wastes tokens; overlap prevents a meaning-carrying sentence from being split with no shared context on either side. |
| RAG architecture & failure modes | Retrieve → augment → generate; retrieval miss (chunking/embedding problem) vs hallucination despite good retrieval (prompting/grounding problem) need different fixes. |
| Multi-tenancy | Logical isolation on shared infrastructure (Pinecone namespaces by business ID) vs full physical isolation — a cost/complexity tradeoff, not a "more secure is always better" decision. |
| Agentic AI / ReAct | A loop: the model either answers or requests a tool call; your code executes it and returns the result for another turn. Reason → Act → Observe → repeat. This is the mechanical reality behind "AI agent." |
| Public client-side identifiers | The businessId/widget key is public by design, like a Google Analytics ID or Stripe publishable key — the security boundary is server-side domain validation and rate limiting, not secrecy. |
| Defense in depth (the widget problem) | Origin/CORS checks stop browser-based copy-paste abuse; rate limiting + hard quotas cap damage from any bypass that doesn't go through a browser at all — layers that catch different attack shapes, not duplicates of each other. |
| Webhook idempotency | External services retry delivery; dedupe by event ID so "process exactly once" holds even under retries. |
| Serverless / scale-to-zero | Cloud Run bills by actual CPU/memory/request usage with a real free allowance, rather than a server you rent 24/7 — a deliberate cost/architecture choice, explainable on its own merits. |
| Containerization | Docker gives you "the same artifact runs in dev, CI, and production" — eliminates an entire category of environment-mismatch bugs, and is what makes the Cloud Run deploy trivial. |

**Sample questions to rehearse:**
- *"Why not just stuff all FAQs into the Gemini prompt since its context window is huge?"* → cost and latency scale with every token on every request; retrieval quality also degrades in very long contexts; RAG sends only what's relevant.
- *"Walk me through what happens, step by step, if I copy your widget snippet onto my own unrelated website."* → walk through Section 7.2 exactly, then proactively raise 7.3's honest limit and the layers that cover it — this two-part answer is exactly what separates "I added a check" from "I designed a system."
- *"How would this scale to 10,000 businesses on one Pinecone index?"* → namespaces, the point at which you'd reconsider pgvector for cost, and that you'd actually measure before guessing.
- *"What's your single point of failure?"* → be honest: Gemini API and Pinecone are both external dependencies with no built-in fallback in this design; name it as a known tradeoff for v1, not something you're unaware of.

---

## 11. Working with AI coding agents

- One phase per session. Paste the phase block + your current file tree.
- Ask "why" before accepting anything security- or billing-related (Phases 2, 7, 9) — review those diffs personally, line by line.
- Treat the agent's first answer as a draft to interrogate, not a final answer to ship — this is what makes the building process double as interview prep instead of just code generation.

---

## 12. Suggested timeline

| Weeks | Phase(s) |
|---|---|
| 1 | Phase 0 |
| 2 | Phase 1 |
| 3 | Phase 2 |
| 4–5 | Phase 3 |
| 6 | Phase 4 |
| 7–8 | Phase 5 |
| 9 | Phase 6 |
| 10 | Phase 7 |
| 11 | Phase 8 |
| 12 | Phase 9 |
| 13 | Phase 10 + demo polish |
| 14 | Phase 11 — Production Deployment |

~14 weeks part-time. Phase 8 can run partly in parallel with Phase 7 since they touch mostly disjoint code. **Do not start Phase 11 until Phases 0–10 are done** — deploy only when there is an application worth hosting.

---

## 13. Cost & upgrade triggers — the full table

| Component | Free today | Specific trigger to upgrade | Upgrade to |
|---|---|---|---|
| Cloudflare | Free DNS/WAF/bot protection, 1 rate-limit rule | Need >1 rate-limit rule, Super Bot Fight Mode, or >5 WAF custom rules | Pro (~$20–25/mo) |
| Cloudflare Pages | Free, commercial use allowed | Need advanced team/analytics features | Paid add-ons |
| Cloud Run | 2M requests / 360,000 GiB-s / 180,000 vCPU-s every month, forever (after billing activated) | MVP complete + willing to pay any required billing prepayment (Phase 11) | Pay-as-you-go Cloud Run — gradual, not a cliff |
| Appwrite Cloud | 100% free org, generous storage/bandwidth, 2 functions max (unused here) | Outgrow storage/bandwidth, or want dedicated (non-shared) resources | Pro (~$25+/project/mo) |
| Pinecone | ~2GB / ~350K vectors, one index | Approaching free storage cap, need multiple indexes or higher QPS | Standard (~$50/mo minimum) |
| Gemini (LLM) | Free tier, rate-limited | Free-tier RPM/RPD limits start rejecting real customer traffic | Pay-as-you-go (Flash-tier still ~$0.10–0.40/1M tokens) |
| Gemini (embeddings) | Free tier | Rarely the bottleneck | ~$0.15/1M tokens paid |
| Upstash Redis | Free daily command quota | Exceed free daily commands at real scale | Pay-as-you-go |
| Razorpay | No upfront cost ever | Never a discrete trigger — it's already usage-based | Same, just higher volume |
| GitHub Actions / ghcr.io | Free minutes / free image storage at this scale | Heavy private-repo build volume | Paid minutes |
| Sentry | Free Developer tier (~few thousand events/mo) | Event volume outgrows free tier | Team plan |

**The headline number to internalize:** during Phases 0–10, your out-of-pocket cost is **₹0** — everything runs locally or on genuinely free SaaS tiers. The first money you may spend is Phase 11: optionally GCP's refundable billing prepayment to activate Cloud Run, then pay-as-you-go only if traffic exceeds free tier. Pinecone Standard (~$50/mo minimum) is the next meaningful jump once a business's data genuinely needs it.

---

## 14. Appendix — quick reference

- Cloud Run pricing & free tier: https://cloud.google.com/run/pricing
- Cloudflare WAF rate limiting docs: https://developers.cloudflare.com/waf/rate-limiting-rules/
- Appwrite Cloud pricing: https://appwrite.io/pricing
- Pinecone pricing: https://www.pinecone.io/pricing/
- Gemini API pricing: https://ai.google.dev/gemini-api/docs/pricing
- Razorpay Subscriptions docs: https://razorpay.com/docs/payments/subscriptions/
- Vercel Hobby fair-use terms (why it's avoided here): https://vercel.com/docs/limits/fair-use-guidelines
- Original repo: https://github.com/Aayushgupta2005/BotUncle

*All free-tier figures above can change — re-check the live pricing pages before each major deploy, and definitely before onboarding your first paying business.*
