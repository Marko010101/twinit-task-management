# Task Management — Technical Assessment

This is a full-stack task manager. The goal wasn't to build a massive feature factory, but to demonstrate how I structure a real codebase: clear boundaries, honest tests, and architectural decisions I can actually defend.

---

## Running the Project

The project is a monorepo with three workspaces: `shared`, `backend`, and `frontend`.

**Option 1: The Monorepo Way (Recommended)**

```bash
npm install      # installs dependencies across all workspaces
npm run dev      # starts backend on :3000 and frontend on :5173
npm test         # runs all 71 tests across the stack
```

**Option 2: Individual Setup**

Terminal 1: API

cd backend
npm install
npm run dev

Terminal 2: Client

cd frontend
npm install
npm run dev

---

## Backend Architecture

The Node.js/Express API is built on strict layers: **Routes → Controllers → Services → Repositories**. Controllers just handle HTTP; all business logic lives in the Service layer.

- **Express 5 Native Async:** No `try/catch` boilerplate. Unhandled promise rejections flow directly into the global error middleware.
- **`ITaskRepository` Interface:** The service doesn't care _how_ data is stored. Swapping the in-memory store for PostgreSQL later requires writing one new class and changing exactly one line of code.
- **Honest Tests:** We inject real, isolated in-memory repositories into our service tests instead of using mocks. If the data layer logic breaks, the tests actually fail.
- **Dumb Data Layer:** The service handles all state mutations (`{ ...task, completed: true }`) and hands the final object to the repository. The data layer just saves what it is told.

---

## Frontend Architecture

The frontend is a React SPA built with Vite, styled with Tailwind, and focused on immediate user feedback.

**URL as the source of truth.** Filtering (`?filter=active`) and pagination (`?page=2`) are driven entirely by the URL — not local `useState`. The app survives page refreshes, handles browser back/forward correctly, and every view is deep-linkable.

**TanStack Query for server state.** Each filter tab gets its own cache entry keyed by filter + page. Switching back to a previously visited tab is instantaneous, served straight from cache while revalidating silently in the background.

**Optimistic UI updates.** Task managers need to feel fast — waiting 200ms watching a spinner for a checkbox feels broken. Both task creation and task completion use optimistic updates: on interaction, we snapshot the cache and update the UI instantly. If the server returns an error, it silently rolls back to the snapshot.

**Centralized error normalization.** An Axios response interceptor catches all transport errors and normalizes them into a standard `Error` with `.message` set — in one place. Components and hooks never import anything from Axios; they just receive a plain `Error`.

---

## Testing Strategy

**71 tests total** covering every critical path.

**Backend — 41 tests (Jest + Supertest)**

- Service tests verify business rules in complete isolation
- Route tests verify HTTP wiring, status codes, and request parsing via real HTTP calls
- The two layers test different things on purpose — no duplication

**Frontend — 30 tests (Vitest + React Testing Library + MSW)**

- MSW intercepts network calls at the Node level — we don't mock Axios or TanStack Query. The real interceptor and real query logic run, so if either breaks, tests fail.
- All queries are accessibility-first: `getByRole('button', { name: /add/i })`. No CSS classes, no internal React state.
- Optimistic update states are explicitly verified using MSW network delays — tests assert the UI updates well within the delay window, proving the update is happening before the server responds, not after.

---

## Trade-offs & Future Considerations

Building software is about picking the right tool for the current constraints. Here is what I deliberately chose *not* to use for this assessment, and why:

* **Vite SPA over Next.js:** Vite provides a blazing-fast dev experience for a private dashboard. We trade away Server-Side Rendering (SSR), Static Site Generation (SSG), and SEO optimizations. If the app expands to include public-facing pages, Next.js is the obvious pivot.
* **Express over NestJS:** Express allows me to explicitly demonstrate how to wire up strict architectural layers manually. We trade away Nest's out-of-the-box scalability. If the domain grows to need microservices, WebSockets, or a larger engineering team, NestJS's unified structure becomes necessary.
* **In-Memory Storage over an ORM:** This keeps the project entirely self-contained so reviewers don't have to spin up Docker or PostgreSQL just to run it. We trade away the heavy lifting of a modern ORM (like Prisma or TypeORM) such as automated migrations and relationship handling. However, because the app relies on the `ITaskRepository` interface, migrating to a real ORM later is a trivial, single-file change.
