# Auth microservice (NestJS + TypeORM + PostgreSQL + JWT)

Endpoints:

- GET /auth/login?username=&password=  -> returns { access_token }
- GET /users/me  (protected) -> returns user profile without passwordHash

Environment: copy `.env.example` to `.env` and set DB and JWT values.

Run locally:

```bash
npm install
npm run start:dev
```

Run with Docker Compose (backend, DB, and frontend):

```bash
docker compose up --build
```

Frontend will be available at: http://localhost:5173

Seeded credentials created by the seeder:

- Username: `alice` / Password: `password1`
- Username: `bob` / Password: `password2`

API endpoints: `http://localhost:3000`
Frontend configuration:

- The frontend reads the API base URL from `VITE_API_URL` at build time. The docker-compose sets it to `http://app:3000` so the nginx-served static build talks to the backend service.

Basic UI flow to validate after bringing up the stack:

1. Open http://localhost:5173
2. Go to Login and enter `alice` / `password1` (or `bob` / `password2`).
3. After login you should see posts. Create a post and toggle Like/Unlike.
4. Visit Profile to view `/users/me` data.

If the token expires or you receive 401, the app will auto logout and redirect to Login.
