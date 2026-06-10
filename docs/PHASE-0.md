# Phase 0 — On-device capture + memory + search

> The first buildable slice of the **fully on-device** 2brn (see the decided architecture in
> [`PARITY.md` Part 6](./PARITY.md#part-6--decided-architecture)). Written for a first-time mobile dev:
> goal, the pieces, step-by-step with a check after each step, and what's deliberately **out** of scope.
>
> _Created 2026-06-10. Target device: OnePlus 15 (also runs on the `Pixel_8` emulator)._

## Goal (one sentence)

**Anything you "Save to 2brn" is stored on the phone and is semantically searchable offline** — with the
desktop off and the network off. No cloud. No LLM yet.

## Why this is Phase 0 (and the LLM isn't)

- **De-risks the hard native pieces** (an on-device database + on-device ML) *before* adding the LLM.
- **Ships a real, usable feature** at the end: offline capture + smart search.
- It's the **foundation** the local LLM (Phase 2) and desktop sync (Phase 3) plug straight into.
- Teaches the core mobile skills in one go: dev client, a native module, a device DB, on-device
  embeddings, a new screen, and rewiring an existing flow.

> "Search" in Phase 0 returns the **matching saved items themselves** (ranked) — not a written answer.
> Turning those hits into a sentence is the LLM's job in **Phase 2**. (This is the "finding vs writing"
> split — finding is cheap and local; writing comes later.)

## What you'll build (4 pieces)

| # | Piece | Library / choice | Why this one |
|---|---|---|---|
| 1 | **Local store** | **`expo-sqlite`** (official Expo) | zero-friction in Expo; one table holds text + its embedding |
| 2 | **On-device embeddings** | **`onnxruntime-react-native`** + a small model (e.g. `bge-small-en-v1.5`, int8 ONNX, ~30–130 MB) | turns text into a vector entirely on-device |
| 3 | **Capture → local** | extend `app/share.tsx` (the existing "Save to 2brn") | reuse the share-sheet you already have |
| 4 | **Search screen** | extend `app/more/saved.tsx` | embed the query, rank saved items by cosine similarity, in JS |

> **Vector search, kept simple:** Phase 0 stores each item's embedding as JSON in SQLite and ranks with
> a **brute-force cosine loop in JS**. For a personal store (hundreds–thousands of items) that's
> instant. Swap in **ObjectBox** or **sqlite-vec** later only if you outgrow it — not now.

## How this slice flows

```
Save to 2brn / quick-add  ──embed()──►  SQLite row { text, …, embedding }
Search box  ──embed(query)──►  cosine vs every row  ──►  ranked results list
                          (all on the phone, offline)
```

## Step-by-step (do them in order; each ends with a concrete check)

### Step 1 — Add the local store
- `npx expo install expo-sqlite`.
- Create `src/db/local.ts`: open a DB, create a table
  `memories(id, text, title, source, source_url, created_at, embedding)` (store `embedding` as a JSON
  string of numbers). Add `insertMemory()` and `getAllMemories()`.
- Rebuild the dev client: `npm run android`.
- ✅ **Check:** a temporary debug button inserts one row and logs `getAllMemories().length === 1`.

### Step 2 — On-device embeddings
- `npx expo install onnxruntime-react-native`. Drop the model file + `tokenizer.json` in `assets/models/`.
- Create `src/ml/embed.ts`: load the ONNX session **once** (cache it), tokenize, run, **mean-pool +
  L2-normalize** the output → `embed(text: string): Promise<number[]>`.
- ✅ **Check:** `embed("hello world")` logs a vector of the model's dim (e.g. 384); calling it twice
  gives the same vector; two *similar* sentences score high cosine, two *unrelated* ones score low.

### Step 3 — Wire capture into the local store
- In `app/share.tsx`, on confirm: `embed(text)` → `insertMemory({...})` **locally first**.
- Keep the existing desktop `POST /ingest/note` call, but make it **best-effort** (wrap in try/catch so
  it silently no-ops when the desktop is unreachable). This preserves the **companion** behavior without
  blocking offline use.
- Add a tiny **"quick add note"** input on the Saved screen so you can create items without the share
  sheet (makes testing easy).
- ✅ **Check:** turn on **airplane mode**, Share a link from Chrome → "Save to 2brn" → it appears in the
  local list.

### Step 4 — The semantic-search screen
- In `app/more/saved.tsx`: load all memories; add a search box. On submit: `embed(query)`, compute
  cosine similarity against every row's embedding, sort desc, show the top results (snippet + source).
- Add empty/offline states (reuse `src/components/states.tsx`).
- ✅ **Check (the money shot):** airplane mode **on**, search **"pricing"** and it surfaces the pricing
  article you saved — even though you never typed the word "pricing" into it.

## Definition of done

- Save items offline; they persist across app restarts; semantic search returns relevant items with the
  **desktop off and network off**.
- `npm run typecheck`, `npm run lint`, `npm test` green; builds and runs on the `Pixel_8` emulator (and
  your OnePlus 15).

## Out of scope for Phase 0 (so it stays small)

- ❌ **Local LLM / written answers** → Phase 2 (search returns items, not prose).
- ❌ **Notifications / voice / app-usage capture** → Phase 1 (Phase 0 = share-sheet + quick-add only).
- ❌ **OCR** → comes with image capture in Phase 1 (Phase 0 handles text only).
- ❌ **Two-way desktop memory sync** → Phase 3 (the optional best-effort note-POST stays, so saving
  still feeds the desktop when it's reachable).

## Gotchas (this repo / machine)

- Native modules need a **dev client** and a clean prebuild. After a **clean** prebuild
  (`expo prebuild --clean`), restore the two files Expo clobbers:
  `git checkout -- expo-env.d.ts tsconfig.json` (see [`PARITY.md` appendix](./PARITY.md#appendix--buildenvironment-gotchas-discovered)).
- The model file is large — `app.json`'s `assetBundlePatterns: ["**/*"]` already bundles `assets/**`, so
  it ships, but expect a bigger APK and a ~1–2 s first-call model load (cache the session).
- Keep the embedding **model identical** to whatever you'll use later, so Phase 2/3 vectors stay
  comparable (don't re-embed everything when you add the LLM).

## Suggested commit slices (Conventional Commits, local only — never push)

1. `chore(mobile): add expo-sqlite local memory store`
2. `feat(mobile): on-device text embeddings (onnxruntime + bge-small)`
3. `feat(mobile): save shared notes to the local store, embedded`
4. `feat(mobile): offline semantic search over saved items`
