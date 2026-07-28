# Storyboards

Vite + React study app for guided storyboard creation. Participants log in, complete onboarding, build a storyboard with AI assistance, then submit usage data and a storyboard image.

Deployed under **`/storyweaver/`** (e.g. `https://variationweaver.ucsd.edu/storyweaver/`).

## Quick Start

```bash
npm install
npm run dev
```

Open the Vite URL printed by the dev server, then open the `/storyweaver/` path (for example `http://localhost:5173/storyweaver/`). `npm run dev` starts both the frontend and the local API shim (`/storyweaver/api/*` → `http://localhost:8080/api/*`).

### Run servers separately (optional)

```bash
npm run dev:vite   # frontend only
npm run dev:api    # API shim only on http://localhost:8080
```

`vite.config.ts` proxies `/storyweaver/api/*` to `http://localhost:8080/api/*` when using `dev:vite` alongside `dev:api`.

### Subpath deploy (NGINX)

1. Set production env (including `VITE_*` before build, plus server-only `ACCESS_ALLOWLIST`, `SESSION_SECRET`, `SESSION_COOKIE_SECURE=true`, `SESSION_COOKIE_PATH=/storyweaver`).
2. `npm ci && npm run build`
3. Serve `dist/` at `https://variationweaver.ucsd.edu/storyweaver/`
4. Run `node scripts/dev-server.mjs` on localhost (e.g. port 8080) and proxy:

```nginx
location /storyweaver/api/ {
  proxy_pass http://127.0.0.1:8080/api/;
  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
  proxy_read_timeout 120s;
}

location /storyweaver/ {
  alias /path/to/story-ensemble-v2/dist/;
  try_files $uri $uri/ /storyweaver/index.html;
}
```

## Environment

Create a local env file from `.env.template` and provide whichever providers you want to test:

```bash
VITE_OPENAI_API_KEY=
VITE_FAL_KEY=
VITE_STABILITY_API_KEY=
VITE_IMAGE_PROVIDER=auto
```

Important notes:

- `VITE_OPENAI_API_KEY` is used directly in the browser for text generation and some image generation paths.
- Users can also enter API keys in the app; those keys are stored in `sessionStorage` only.
- `VITE_IMAGE_PROVIDER=auto` chooses FAL first when available, then Stability, then OpenAI.
- `api/generate-edit.ts` can use `OPENAI_API_KEY` on the server side, or an API key forwarded from the client for local development.

## Scripts

```bash
npm run dev       # API shim + Vite (default)
npm run dev:vite  # Vite frontend only
npm run dev:api   # Node API shim only
npm run build     # tsc + Vite production build
npm run lint      # ESLint
npm run preview   # Preview production build at /storyweaver/
```

## Architecture

```text
Browser (SPA, base /storyweaver/)
  ├── LoginPage              → POST /storyweaver/api/login
  ├── UserLandingPage        consent + participant name
  ├── StudyOverviewPage      study intro
  ├── CharacterCreationPage  headshot pick / photo upload
  ├── StoryWizard            panel generation (designer mode by default)
  ├── StoryboardEditorPage   edit title/captions, finalize JPG download
  └── PostStoryboardSurveyPage → Firestore upload (+ JSON fallback)

Node API (scripts/dev-server.mjs :8080)
  ├── /api/login, /api/session, /api/logout   access gate
  └── /api/generate-edit                      OpenAI image edit proxy

Client AI (src/api/*)
  └── OpenAI / FAL / Stability called from the browser for text + most images

State (src/store.ts)
  └── Zustand + IndexedDB (graph, character, onboarding flags)
  └── studyEvents in memory only (cleared each session)
```

There is no React Router. [`App.tsx`](src/App.tsx) gates screens with local state and store flags (`hasCompletedLanding`, etc.).

### Participant flow

1. **Login** — [`LoginPage`](src/components/LoginPage.tsx) validates an allowlisted access ID via the server; session cookie scoped to `/storyweaver`.
2. **Consent** — [`UserLandingPage`](src/components/UserLandingPage.tsx); clears `studyEvents` for a fresh session.
3. **Overview** — [`StudyOverviewPage`](src/components/StudyOverviewPage.tsx).
4. **Character** — [`CharacterCreationPage`](src/components/CharacterCreationPage.tsx); preset headshots from [`public/storyboards/character_headshots/`](public/storyboards/character_headshots/) or photo upload.
5. **Wizard** — [`StoryWizard`](src/components/StoryWizard.tsx). With `ENABLE_DESIGNER_STORYBOARD_MODE = true` ([`src/lib/designerMode.ts`](src/lib/designerMode.ts)), participants pick a static variant from [`src/data/designerStoryboards.ts`](src/data/designerStoryboards.ts) and refine panels with AI image edits. The standard persona/problem/solution pipeline is bypassed.
6. **Editor** — [`StoryboardEditorPage`](src/components/StoryboardEditorPage.tsx); downloads a high-res JPG on finalize.
7. **Survey** — [`PostStoryboardSurveyPage`](src/components/PostStoryboardSurveyPage.tsx); uploads usage log + compressed storyboard image to Firestore via [`src/lib/studyDataUpload.ts`](src/lib/studyDataUpload.ts). Falls back to local JSON download on failure.

### Study logging

Events accumulate in `studyEvents` ([`src/store.ts`](src/store.ts)) during the session. They are **not** persisted to IndexedDB. On consent / start-over, the log is cleared.

Export shape: [`src/lib/studyUsageData.ts`](src/lib/studyUsageData.ts) (`StudyUsageExport`). Upload includes session `accessId`, events, frame metadata, survey answers, and an embedded JPEG (quality-compressed to fit Firestore's ~1MB doc limit).

### Server API

[`scripts/dev-server.mjs`](scripts/dev-server.mjs) handles:

| Route | Purpose |
|---|---|
| `POST /api/login` | Validate access ID, set `se_session` cookie |
| `GET /api/session` | Return current session (401 if absent) |
| `POST /api/logout` | Clear session cookie |
| `POST /api/generate-edit` | Proxy OpenAI image edit |

Client calls use [`src/lib/apiBase.ts`](src/lib/apiBase.ts) (`/storyweaver/api/...`).

### AI layer

Most generation runs in the browser (`src/api/openai.ts`, `images.ts`, `fal.ts`, `stableDiffusion.ts`). Image edit with a reference photo goes through the server proxy. Provider selection: [`src/lib/envUtils.ts`](src/lib/envUtils.ts) (`resolveImageProvider()`).

## Production deploy (NGINX)

1. Set all env vars (especially `VITE_*` before build).
2. `npm ci && npm run build`
3. Serve `dist/` at `/storyweaver/`
4. Run the API process and proxy `/storyweaver/api/` to it:

```nginx
# API first — use prefix match, not exact (=)
location /storyweaver/api/ {
  proxy_pass http://127.0.0.1:8080/api/;
  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
  proxy_read_timeout 120s;
}

location /storyweaver/ {
  alias /path/to/story-ensemble-v2/dist/;
  try_files $uri $uri/ /storyweaver/index.html;
}
```

**Verify proxy:** `curl https://your.host/storyweaver/api/session` should return **401** JSON (`Not authenticated`), not **200** HTML.

## Key files

| Area | Files |
|---|---|
| App shell / routing | `src/App.tsx`, `src/main.tsx` |
| Onboarding | `LoginPage`, `UserLandingPage`, `StudyOverviewPage`, `CharacterCreationPage` |
| Story creation | `StoryWizard.tsx`, `StoryboardEditorPage.tsx`, `PostStoryboardSurveyPage.tsx` |
| Designer mode | `src/lib/designerMode.ts`, `src/data/designerStoryboards.ts`, `DesignerVariantPicker.tsx` |
| State | `src/store.ts` |
| Study export / upload | `src/lib/studyUsageData.ts`, `src/lib/studyDataUpload.ts`, `src/lib/compressImage.ts` |
| Auth | `src/lib/accessSession.ts`, `scripts/dev-server.mjs` |
| Static assets | `public/storyboards/` (use `import.meta.env.BASE_URL` for paths) |
| Build / proxy | `vite.config.ts` (`base: '/storyweaver/'`) |

### Legacy React Flow code

The repo still contains React Flow node components (`src/rf-components/*`), graph state in the store, and modals wired in `App.tsx`. These are **not** part of the current participant flow; the study uses full-page screens instead of the canvas editor.

Evaluation components (`src/components/evaluation/*`, `EvaluationRouter.tsx`) exist but are not mounted in the current `App.tsx` flow.

## Common changes

- **Access IDs:** edit `ACCESS_ALLOWLIST` in server env.
- **Designer on/off:** `ENABLE_DESIGNER_STORYBOARD_MODE` in `src/lib/designerMode.ts`.
- **Designer variants:** images under `public/storyboards/<id>/`, manifest in `src/data/designerStoryboards.ts`, or Admin Setup at runtime.
- **Survey copy:** `src/content/postSurveyCopy.yaml`.
- **Onboarding copy:** `src/content/*.yaml` imported via `src/content/onboardingCopy.ts`.
- **Prompts:** `src/api/openai.ts` and domain files in `src/api/`.

## Gotchas

- Open **`/storyweaver/`**, not the site root — assets and API paths depend on the Vite base.
- `studyEvents` reset on consent and start-over; only the current session is exported.
- IndexedDB persists graph/onboarding state under key `story-ensemble`. Clear site data if debugging stale state.
- `SESSION_COOKIE_SECURE=true` requires HTTPS; use `false` for local HTTP dev.
- NGINX must proxy `/storyweaver/api/` to Node **before** the static `/storyweaver/` block. A **200** on `/api/session` usually means HTML is being served instead of the API.
- Public asset URLs must include the base path (`import.meta.env.BASE_URL`), not bare `/storyboards/...`.

## Start here

1. `src/App.tsx` — screen flow and access gate
2. `src/components/StoryWizard.tsx` — wizard state machine
3. `src/store.ts` — state and generation actions
4. `src/lib/studyUsageData.ts` + `src/lib/studyDataUpload.ts` — logging and upload
5. `scripts/dev-server.mjs` — server routes and session cookies
