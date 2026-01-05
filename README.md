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
<!-- Se eliminó el endpoint de limpieza de posts huérfanos de la documentación final. -->

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

-
Entrega y notas finales
- Este documento contiene la información mínima necesaria para ejecutar y verificar la aplicación (endpoints, usuarios de prueba, comandos para tests y ejecución local).
- Se han eliminado las recomendaciones y sugerencias adicionales para mantener la documentación enfocada en la entrega.

Usuarios de prueba (seeded)
- Username: `alice` / Password: `password1`
- Username: `bob` / Password: `password2`
- Username: `carla` / Password: `password3`
- Username: `dan` / Password: `password4`

Archivos modificados/añadidos por mí recientemente:
- `frontend/vitest.config.ts`, `frontend/vitest.setup.ts` (config tests)
- `frontend/src/pages/Posts.extra.test.tsx`, `frontend/src/pages/Posts.test.tsx` (tests)
- `frontend/playwright.config.ts`, `frontend/tests/e2e.ui.spec.ts` (Playwright)
- `src/e2e/posts.e2e.spec.ts` (E2E API)

# Servicio de autenticación (Auth)

Endpoints principales

- `GET /auth/login?username=<user>&password=<pw>` → devuelve `{ "access_token": "..." }`.
- `GET /users/me` (protegido) → devuelve el perfil del usuario (sin `passwordHash`).

Entorno

- Copiar `.env.example` a `.env` y ajustar las variables de conexión a la base de datos y `JWT_SECRET`.

Ejecución local

```bash
npm install
npm run start:dev
```

Ejecución con Docker Compose (backend, DB y frontend)

```bash
docker compose up --build
```

La aplicación frontend estará disponible en: http://localhost:5173

Credenciales de prueba (seeded)

- `alice` / `password1`
- `bob` / `password2`
- `carla` / `password3`
- `dan` / `password4`

API base: http://localhost:3000

Configuración del frontend

- El frontend lee la variable `VITE_API_URL` en tiempo de build; en `docker-compose` se establece `http://app:3000` para que la build estática hable con el servicio backend.

Flujo UI básico para validar

1. Abrir http://localhost:5173
2. Iniciar sesión con `alice` / `password1` (o `bob` / `password2`).
3. Ver publicaciones, crear una publicación y alternar like/unlike.
4. Ver perfil en `/users/me`.

Nota: si el token expira o se recibe un `401`, la aplicación realiza logout automático y redirige a la pantalla de Login.
