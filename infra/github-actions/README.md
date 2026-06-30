# Phase 11 deployment workflows

These files are **templates** — not active until you copy them to `.github/workflows/` during Phase 11.

| File | Purpose |
|------|---------|
| `deploy-ai-service.yml` | Build Docker image → push to GHCR → deploy to Cloud Run |
| `deploy-dashboard.yml` | *(add in Phase 11)* Deploy dashboard + widget to Cloudflare Pages |

**Prerequisites:** GCP billing activated, GitHub secrets configured, GHCR package public. See `docs/BotUncle_Roadmap.md` Phase 11.
