# Deployment & CI Checklist

This checklist covers recommended steps to prepare the application for production and CI pipelines.

1. Environment & Secrets
   - Provide secure values for: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`, `JWT_SECRET`, `VITE_API_URL`, and `PORT`.
   - Do NOT commit `.env` with secrets. Use `.env.example` as a template.
   - Use Docker secrets or your cloud provider secret manager for production credentials.

2. Database
   - Use a managed Postgres or a properly backed-up instance.
   - Run migrations instead of `synchronize:true` for production.
   - Configure backups and automated maintenance.

3. Docker & Compose
   - Ensure `docker-compose.yml` uses env vars (it now supports substitution with defaults).
   - In production, consider building images in CI and deploying images to a registry.
   - Use named volumes for persistent storage (Postgres data).

4. CI Pipeline
   - Steps to run in CI (example):
     - Install dependencies
     - Run linting and unit tests (backend Jest, frontend Vitest)
     - Build frontend and backend artifacts
     - Run integration/e2e tests against ephemeral environment (optional)
     - Build Docker images and push to registry (if deploying via images)
   - Example commands:
```bash
# Backend tests
npm run test:ci
# Frontend tests
cd frontend && npx vitest run --reporter verbose --environment jsdom
# Build
npm run build
cd frontend && npm run build
```

5. Swagger / API Docs
   - Swagger available at `/api` (configured in `src/main.ts`). Protect docs in production or expose behind auth.

6. Security & Production Hardening
   - Set a strong `JWT_SECRET` and appropriate expiry.
   - Configure CORS origins explicitly.
   - Add rate-limiting (e.g., `@nestjs/throttler`) if public-facing.
   - Configure HTTPS / SSL termination at load balancer or reverse proxy.

7. Logging & Monitoring
   - Add structured logging (winston, pino) and ship logs to central store.
   - Add healthchecks and readiness probes.

8. Static Files & Uploads
   - `/uploads` is served from the container; for production use S3 or a persistent volume.

9. Migrations & Schema Changes
   - Use TypeORM migrations for production schema changes.

10. Rollback & Backups
   - Have DB backups and a rollback plan for deployments.

---

If you want, I can:
- Create a GitHub Actions workflow that runs backend tests + frontend Vitest + builds images.
- Add a small script for production-ready Docker image tagging.
