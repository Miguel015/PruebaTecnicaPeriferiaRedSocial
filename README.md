# Prueba Técnica — Red Social (Microservicios)

Resumen rápido
- Proyecto de ejemplo que implementa una red social mínima con autenticación JWT, servicio de publicaciones, likes y perfil de usuario.
- Stack: NestJS (backend), TypeORM + Postgres (DB, con fallback sqlite en dev), React + Vite + Tailwind (frontend), Jest/Vitest (tests), Playwright (E2E UI).

Estado actual
- Backend: endpoints de autenticación, posts, users; seeder para usuarios/posts al bootstrap; pruebas unitarias y E2E API.
- Frontend: pantallas de Login, Posts y Profile; mejoras UX (header hide-on-scroll, evitar salto al dar like); pruebas unitarias con Vitest y tests Playwright preparados.

Requisitos funcionales cubiertos
- Autenticación JWT (GET `/auth/login`) — Backend
- Ver publicaciones (GET `/posts?page=...`) — Backend + Frontend
- Crear publicación (POST `/posts`) — Backend + Frontend
- Envío de like (POST `/posts/:id/like`) — Backend + Frontend
- Ver perfil (GET `/users/:id` o `/users/me`) — Backend + Frontend
- Seeder: creado y ejecutado al iniciar la app (`src/seed/seeder.service.ts`).
- Docker: `Dockerfile` y `docker-compose.yml` incluidos para levantar servicios (ajustar variables de entorno).

Archivos y tests relevantes
- Backend:
	- Código: [src/app.module.ts](src/app.module.ts)
	- Seeder: [src/seed/seeder.service.ts](src/seed/seeder.service.ts)
	- Tests unitarios: [src/posts/posts.service.spec.ts](src/posts/posts.service.spec.ts), [src/users/users.service.spec.ts](src/users/users.service.spec.ts), [src/auth/auth.service.spec.ts](src/auth/auth.service.spec.ts)
	- E2E API: [src/e2e/posts.e2e.spec.ts](src/e2e/posts.e2e.spec.ts)
- Frontend:
	- Código principal: [frontend/src/pages/Posts.tsx](frontend/src/pages/Posts.tsx), [frontend/src/context/AuthContext.tsx](frontend/src/context/AuthContext.tsx)
	- Config tests: [frontend/vitest.config.ts](frontend/vitest.config.ts), [frontend/vitest.setup.ts](frontend/vitest.setup.ts)
	- Tests unitarios: [frontend/src/pages/Posts.test.tsx](frontend/src/pages/Posts.test.tsx), [frontend/src/pages/Posts.extra.test.tsx](frontend/src/pages/Posts.extra.test.tsx)
	- Playwright UI test: [frontend/tests/e2e.ui.spec.ts](frontend/tests/e2e.ui.spec.ts)

Cómo ejecutar (desarrollo)
Prerequisitos: Node 18+, npm, Docker (opcional para Postgres)

1) Clonar e instalar (raíz del repo):

```bash
npm install
cd frontend
npm install
```

2) Variables de entorno
- Copiar y ajustar variables en el entorno (ej. `.env`) según `src/config/configuration.ts`.
- Variables importantes:
	- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`
	- `JWT_SECRET`, `NODE_ENV`

3) Usar Docker Compose (opcional):

```bash
docker-compose up -d
# Esto levantará Postgres y, si está configurado, otros servicios.
```

4) Iniciar backend en modo desarrollo:

```bash
# desde la raíz
npm run start:dev
```

5) Iniciar frontend (Vite):

```bash
cd frontend
npm run dev
```

Endpoints principales (rápido)
- Autenticación: `GET /auth/login?username=<user>&password=<pw>` — devuelve `access_token`.
- Listar posts: `GET /posts?page=0&size=5` — paginado.
- Crear post: `POST /posts` — body JSON { content } o FormData con `images`.
- Like: `POST /posts/:id/like` — token requerido.
- Perfil: `GET /users/me` o `GET /users/:id` — token requerido.
- Cleanup huérfanos (dev): `DELETE /posts/cleanup-orphans` — token requerido.

Pruebas
- Backend unit + E2E API (Jest/ts-jest):
	- Ejecutar desde la raíz:

```bash
npm test
```

	- Ejecutar solo E2E API:

```bash
npx jest --config jest.config.ts src/e2e/posts.e2e.spec.ts --runInBand
```

- Frontend unit (Vitest):

```bash
cd frontend
npm test
```

- Playwright UI (opcional — descarga navegadores requerida):

```bash
cd frontend
npm install
npx playwright install
npm run test:e2e:ui
```

Resultados de pruebas (ejecución local)

- Backend (Jest / ts-jest):
	- Resultado final en mi ejecución local: 4 suites, 9 tests pasados. Incluye pruebas unitarias y un test E2E API con `supertest`.

- Frontend (Vitest):
	- Resultado final en mi ejecución local: 2 archivos de test ejecutados, 3 tests pasados.

- E2E UI (Playwright):
	- Se añadió un test de ejemplo en `frontend/tests/e2e.ui.spec.ts`. El test está listo pero no se ejecutó en CI por requerir navegadores; para ejecutarlo localmente use `npx playwright install` y luego `npx playwright test`.

Notas:
- El workflow de CI (`.github/workflows/ci.yml`) incluye ejecución de pruebas backend y frontend y un job para el E2E API; Playwright no se ejecuta por defecto en CI ya que necesita instalar navegadores.
- Todos los resultados anteriores provienen de ejecuciones locales y se han documentado aquí para referencia.

Notas de implementación y decisiones
- El backend usa NestJS + TypeORM. En `src/app.module.ts` hay lógica para usar sqlite local cuando `NODE_ENV=development` y `DB_HOST=postgres` (facilita pruebas sin docker). Ver [src/app.module.ts](src/app.module.ts).
- Seeder (`src/seed/seeder.service.ts`) crea varios usuarios y una publicación por usuario con likes entre ellos.
- El frontend usa React + Context (`frontend/src/context/AuthContext.tsx`) para manejar sesión; `frontend/src/pages/Posts.tsx` contiene lógica de representación, previews locales y manejo de likes.
- Tests: incluí unit tests backend y frontend, además de un test E2E API y un test Playwright de ejemplo para UI.

Buenas prácticas y recomendaciones
- Añadir CI (GitHub Actions) que ejecute: `npm test` (backend) y `cd frontend && npm test` (frontend), y opcionalmente tests E2E en un job separado con servicios dockerizados.
- Añadir cobertura de tests y generar badge.
- Validar errores y respuestas del API con DTOs y excepciones (NestJS) — ya se usan DTOs en `src/posts/dto`.
- Documentar Swagger: si no está activado, exponer Swagger en `/api` añadiendo `SwaggerModule` en `main.ts`.

¿Qué más incluir en el README?
- Puedo añadir ejemplos curl más detallados por endpoint, un diagrama de arquitectura simple, y pasos concretos para configurar CI. ¿Quieres que lo añada ahora? 

---
Archivos modificados/añadidos por mí recientemente:
- `frontend/vitest.config.ts`, `frontend/vitest.setup.ts` (config tests)
- `frontend/src/pages/Posts.extra.test.tsx`, `frontend/src/pages/Posts.test.tsx` (tests)
- `frontend/playwright.config.ts`, `frontend/tests/e2e.ui.spec.ts` (Playwright)
- `src/e2e/posts.e2e.spec.ts` (E2E API)

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
