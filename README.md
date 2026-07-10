# Storyboards

## Quick Start

```bash
npm install
npm run dev
```

Open the Vite URL printed by the dev server. `npm run dev` starts both the frontend and the local API shim for image edits (`/api/generate-edit`).

### Running servers separately (optional)

For debugging, you can run each server on its own:

```bash
npm run dev:vite   # frontend only (image edit API will not be available)
npm run dev:api    # API shim only on http://localhost:3000
```

`vite.config.ts` proxies `/api/*` to `http://localhost:3000` when using `dev:vite` alongside `dev:api`.

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
npm run dev       # API shim + Vite frontend (default)
npm run dev:vite  # Vite frontend only
npm run dev:api   # Local Node API shim for /api routes
npm run build     # TypeScript check + Vite production build
npm run lint      # ESLint
npm run preview   # Preview production build
```

## Architecture at a Glance

```text
index.html
  -> src/main.tsx
      -> ReactFlowProvider
      -> MantineProvider
      -> Notifications
      -> src/App.tsx
          -> React Flow canvas
          -> landing/admin/wizard modals
          -> Zustand store actions
              -> src/api/* AI providers
              -> IndexedDB persistence
```

The app is a single page canvas. There is no React Router. Top level user flows are controlled with local component state in `App.tsx` and `StoryWizard.tsx`, while graph data and generation actions live in `src/store.ts`.

## Major Runtime Flows

### 1. App boot

1. `index.html` loads `src/main.tsx`.
2. `src/main.tsx` renders `<App />` inside `ReactFlowProvider`, `MantineProvider`, and Mantine notifications.
3. `src/App.tsx` reads persisted graph state from `useStore`.
4. If the graph is empty, `App` opens the landing/wizard flow.
5. Otherwise, it renders the existing React Flow canvas and modals.

### 2. Canvas/editor flow

`src/App.tsx` configures the React Flow canvas:

- Node types come from `src/rf-components/*`.
- Edge types come from `ContextEdge` and arrow edge helpers.
- Canvas data comes from `useStore().nodes` and `useStore().edges`.
- Keyboard shortcuts can add/copy/paste nodes and fit the viewport.
- The canvas is currently mostly view-oriented: `nodesDraggable` and `nodesConnectable` are disabled.

The graph entities are:

- `Project`
- `Persona`
- `Problem`
- `Solution`
- `Storyboard`
- `Comment`

### 3. Landing and wizard flow

The participant-facing flow starts in `App.tsx`:

1. `UserLandingPage` collects initial study context and prior experience.
2. `StoryWizard` takes over after landing completion.
3. Depending on the feature flag in `src/lib/designerMode.ts`, `StoryWizard` runs either:
   - designer storyboard mode, currently enabled, or
   - the standard AI-generated storyboard flow.

### 4. Standard storyboard flow

This is the original path. It is currently bypassed when `ENABLE_DESIGNER_STORYBOARD_MODE` is `true`.

Key files:

- `src/components/DynamicStoryWizard.tsx`
- `src/types/questionnaire.ts`
- `src/components/StoryWizard.tsx`
- `src/store.ts`
- `src/api/openai.ts`
- `src/api/images.ts`

Flow:

1. `DynamicStoryWizard` asks the warm-up questions from `STORY_QUESTIONS`.
2. After question 2 is answered, it calls `startWarmUpPrefetch()` to begin persona generation early.
3. On submit, `StoryWizard.handleDynamicSubmit()` consumes the prefetch if available.
4. The store creates the node chain:
   - project node
   - persona node
   - problem node
   - placeholder solution node
   - blank storyboard node
5. The wizard generates or sketches four frames:
   - `Context`
   - `Problem`
   - `Action`
   - `Resolution`
6. `StoryWizard` walks through content, aesthetics, story lock, visual style, and final rendering phases.
7. Generated frame data is written back into the storyboard node in the Zustand store.

### 5. Sketch mode

`StoryWizard.tsx` has `ENABLE_SKETCH_MODE = true`.

In the standard flow, this means the app generates all four initial sketch frames quickly with:

- `useStore().generateInitialSketchStoryboard()`
- `generateInitialSketchStoryboardFrames()` in `src/api/openai.ts`
- `SketchFrameRenderer` for display
- `refineSketchStoryboardFrame()` for per-frame refinement

Sketch data is stored on each storyboard frame under `frame.sketch`, and the frame's `renderMode` is set to `sketch`.

### 6. Designer storyboard mode

Designer mode is currently enabled in `src/lib/designerMode.ts`:

```ts
export const ENABLE_DESIGNER_STORYBOARD_MODE = true;
```

When enabled, `StoryWizard` skips the standard persona/problem/solution generation path. Instead:

1. `DesignerVariantPicker` shows predefined storyboard variants.
2. Variants come from `src/data/designerStoryboards.ts`.
3. Default panel images live in `public/storyboards/sb1`, `sb2`, and `sb3`.
4. Picking a variant creates a standalone storyboard node.
5. The participant refines each panel through content/reflection and aesthetics phases.
6. `generateDesignerSceneImage()` edits the current panel image using the selected image provider.
7. Updates are stored back into the storyboard node with `applyDesignerSceneUpdate()`.

Admin overrides for designer mode are managed by `src/components/AdminSetup.tsx` and persisted in the Zustand store. The admin UI can replace the four images for each storyboard variant and update the study topic.

## State Management

The central state file is `src/store.ts`.

It contains:

- React Flow state: `nodes`, `edges`, selection, connection handlers.
- Node creation actions for personas, problems, solutions, storyboards, projects, and comments.
- AI generation actions for each node type.
- Storyboard frame generation and refinement actions.
- Designer mode storyboard overrides.
- Landing state and evaluation state.
- Undo/redo snapshots.
- Study event logging.

The store uses:

- `zustand`
- `zustand/middleware/immer`
- `zustand/middleware/persist`
- `idb-keyval`

Persistence is configured at the bottom of `src/store.ts`:

```ts
export const useStore = create<RFState>()(
  immer(
    persist(createStore, {
      name: 'story-ensemble',
      storage: createJSONStorage(() => indexDbStorage),
      partialize
    })
  )
);
```

The persisted key is `story-ensemble`. Because this is browser IndexedDB state, a developer may need to clear site data while debugging old graph state.

## Data Model

Core domain types live in `src/types.ts`.

Important types:

- `NodeData`: base data shared by custom nodes.
- `Persona`, `Problem`, `Solution`: Zod-backed structured AI outputs.
- `FrameOutline`: storyboard frame type, description, and caption.
- `SketchFrameData`: structured sketch representation for sketch-mode rendering.
- `VisualStylePreferences`: final visual style controls.
- `StoryboardNodeData`: the full storyboard node shape.

A storyboard node contains:

```ts
storyboard: {
  title: string;
  flowMode?: 'standard' | 'designer_storyboard';
  outline: Array<{
    id: string;
    frameType: 'Context' | 'Problem' | 'Action' | 'Resolution';
    description: string;
    caption: string;
    image?: string;
    imagePrompt?: string;
    sketch?: SketchFrameData;
    renderMode?: 'sketch' | 'image';
    contentAnswers?: Record<string, string>;
    reflectionAnswers?: Record<string, string>;
    aestheticNotes?: DesignerAestheticNotes;
  }>;
  artStyle: StylePreset;
  storyLocked?: boolean;
  visualStylePreferences?: VisualStylePreferences;
}
```

## AI and API Layer

The `src/api` folder is split by concern:

- `openai.ts`: text generation, structured JSON generation, sketch frame generation/refinement, storyboard titles, prompt construction, OpenAI image helper.
- `images.ts`: image provider orchestrator and designer image edit wrapper.
- `fal.ts`: FAL/Flux image generation and edit integration.
- `stableDiffusion.ts`: Stability image generation.
- `personas.ts`: persona generation/regeneration prompts.
- `problems.ts`: problem generation/regeneration prompts.
- `solutions.ts`: solution generation/regeneration prompts.
- `storyboards.ts`: storyboard outline and image-prompt generation.
- `feedback.ts`: critique and design feedback prompts.
- `recommendations.ts`: recommendation generation.
- `visualCharacterDescription.ts`: character-description extraction.

Most structured text calls use `generateStructured()` in `openai.ts`, which:

1. Converts a Zod schema to JSON schema.
2. Calls OpenAI chat completions with JSON mode.
3. Parses and validates the response with Zod.

Image generation goes through `generateStoryboardImage()` in `src/api/images.ts`:

1. Resolve provider with `resolveImageProvider()` from `src/lib/envUtils.ts`.
2. Use FAL if configured.
3. Use Stability if configured.
4. Fall back to OpenAI.

Image editing can call `api/generate-edit.ts`, which is the only server-side API route in this project.

## Key Files

### App shell

- `src/main.tsx`: provider setup and React root.
- `src/App.tsx`: top-level canvas, modal orchestration, landing/wizard entry, keyboard shortcuts.
- `src/index.css`: global CSS and Tailwind layers.
- `vite.config.ts`: Vite config, alias setup, `/api` proxy.

### Wizard and participant experience

- `src/components/UserLandingPage.tsx`: first participant screen.
- `src/components/StoryWizard.tsx`: main storyboard flow state machine.
- `src/components/DynamicStoryWizard.tsx`: standard warm-up questionnaire.
- `src/components/ContentPhase.tsx`: per-scene content questions.
- `src/components/AestheticsPhase.tsx`: per-scene visual/aesthetic refinement.
- `src/components/StoryLockPhase.tsx`: story review before final styling.
- `src/components/VisualStylePhase.tsx`: final visual style controls.
- `src/components/ProgressiveStoryboard.tsx`: frame preview during the wizard.
- `src/components/SketchFrameRenderer.tsx`: renders structured sketch frames.

### Designer mode

- `src/lib/designerMode.ts`: feature flag for designer-storyboard mode.
- `src/data/designerStoryboards.ts`: static storyboard variant manifest.
- `public/storyboards/*`: default designer storyboard images.
- `src/components/DesignerVariantPicker.tsx`: variant selection UI.
- `src/components/DesignerContentPhase.tsx`: designer-mode content/reflection flow.
- `src/components/AdminSetup.tsx`: admin overrides for topic and storyboard images.

### Graph nodes and edges

- `src/rf-components/index.ts`: node and edge type enums.
- `src/rf-components/BaseNode.tsx`: shared node shell.
- `src/rf-components/PersonaNode.tsx`: persona node renderer.
- `src/rf-components/ProblemNode.tsx`: problem node renderer.
- `src/rf-components/SolutionNode.tsx`: solution node renderer.
- `src/rf-components/StoryboardNode.tsx`: storyboard node renderer.
- `src/rf-components/ProjectNode.tsx`: project/context node renderer.
- `src/rf-components/CommentNode.tsx`: comment node renderer.
- `src/rf-components/ContextEdge.tsx`: custom React Flow edge.
- `src/rf-components/ArrowEdge.tsx`: helper for creating graph arrows.

### Store and utilities

- `src/store.ts`: central state, generation actions, graph mutation actions, persistence.
- `src/lib/graphHelper.ts`: dependency/dependent graph traversal helpers.
- `src/lib/positioningUtils.ts`: layout positions for generated nodes.
- `src/lib/displayStore.ts`: UI-only display state, such as regeneration indicators.
- `src/lib/envUtils.ts`: API key lookup, validation, provider selection.
- `src/lib/getSanitizedNodeContent.ts`: content sanitization before display/use.
- `src/lib/formatInterviewForAI.ts`: interview/context formatting for prompts.

### Evaluation/study UI

- `src/components/EvaluationRouter.tsx`
- `src/components/EvalLayout.tsx`
- `src/components/evaluation/*`
- Evaluation state is also represented in `src/store.ts`.

These files support study/evaluation flows and are separate from the main canvas/wizard rendering path unless explicitly wired in.

## Common Changes

### Change the standard questionnaire

Edit `src/types/questionnaire.ts`. `DynamicStoryWizard` reads `STORY_QUESTIONS` and supports conditional branching through each question's `dependsOn` field.

### Change the main wizard sequence

Edit `src/components/StoryWizard.tsx`. The local `WizardState` controls the active `phase`, current scene index, and per-scene answers. Be careful here: this file coordinates generation side effects, speculative frame generation, and mode-specific branches.

### Turn designer mode on or off

Edit `src/lib/designerMode.ts`.

When `ENABLE_DESIGNER_STORYBOARD_MODE` is `true`, the app skips standard AI persona/problem/solution generation and starts with static storyboard variants.

### Add or replace designer storyboard variants

1. Add panel images under `public/storyboards/<variant-id>/`.
2. Update `src/data/designerStoryboards.ts`.
3. Make sure each variant has four frames: `Context`, `Problem`, `Action`, `Resolution`.

For runtime/admin overrides, use the Admin Setup UI instead of editing the manifest.

### Change prompt behavior

Start in `src/api/openai.ts`.

Useful functions:

- `generateStructured()`
- `generateDynamicFrameData()`
- `generateImagePrompt()`
- `generateInitialSketchStoryboardFrames()`
- `refineSketchFrameData()`
- `buildDesignerImageEditPrompt()`

For persona/problem/solution-specific prompts, use the domain files in `src/api`.

### Change image provider behavior

Start in:

- `src/api/images.ts`
- `src/lib/envUtils.ts`
- `src/api/fal.ts`
- `src/api/stableDiffusion.ts`
- `api/generate-edit.ts`

`generateStoryboardImage()` is the main dispatch point.

### Change graph/node behavior

Start in:

- `src/store.ts` for mutations and generation actions.
- `src/rf-components/*Node.tsx` for rendering.
- `src/types.ts` for data shape changes.
- `src/lib/positioningUtils.ts` for generated node placement.

## Development Notes and Gotchas

- The store file is large and owns both state and side effects. Before changing a node shape, check both `src/types.ts` and all relevant store update functions.
- Browser state persists in IndexedDB. If UI behavior looks stale, clear site data for the dev URL.
- Some AI calls are intentionally speculative or backgrounded. For example, standard flow starts persona generation after question 2 and may pre-generate upcoming storyboard frames.
- `dangerouslyAllowBrowser: true` is used for OpenAI client calls in the browser. Will be modified before production.
- Designer mode and standard mode share `StoryWizard.tsx` but intentionally skip different parts of the pipeline. Check `ENABLE_DESIGNER_STORYBOARD_MODE` before debugging a generation path.
- `src/components/QuestionField.tsx` exists, but `DynamicStoryWizard.tsx` currently defines its own local `QuestionField` implementation.
- `api/generate-edit.ts` is server-side, but most other `src/api` files run in the browser.
- The graph currently disables dragging and connecting in `App.tsx`. Re-enabling editor behavior will require revisiting React Flow handlers from the store.

## Start Here First

I suggest reading files in this order:

1. `src/main.tsx`
2. `src/App.tsx`
3. `src/lib/designerMode.ts`
4. `src/components/StoryWizard.tsx`
5. `src/store.ts`
6. `src/types.ts`
7. `src/api/images.ts`
8. `src/api/openai.ts`
9. `src/rf-components/StoryboardNode.tsx`

Gives the clearest view of how the app starts, how the current default flow is selected, where data is stored, how generation works, and how the result is rendered.
