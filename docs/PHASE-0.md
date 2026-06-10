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
| 2 | **On-device embeddings** | **`react-native-executorch`** — `useTextEmbeddings`, all-MiniLM-L6-v2 (384-dim) | turns text into a vector on-device; same toolkit also runs the Phase 2 LLM (`useLLM`) + Phase 1 OCR (`useOCR`) |
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

### Step 2 — On-device embeddings ✅ done
- Installed `react-native-executorch` + `react-native-executorch-expo-resource-fetcher` +
  `expo-file-system` + `expo-asset`; call `initExecutorch({ resourceFetcher: ExpoResourceFetcher })`
  once at startup. Requires the New Architecture (already on) and Android 13+.
- Embeddings come from the **`useTextEmbeddings`** hook (`models.text_embedding.all_minilm_l6_v2()`);
  `forward(text)` resolves to a 384-dim `Float32Array`. There is no imperative API, so screens embed via
  the hook (shared through a small context in Steps 3–4). `src/ml/similarity.ts` holds a pure,
  unit-tested `cosineSimilarity`; `src/ml/embeddings.ts` centralizes the model choice.
- ✅ **Verified on-device:** `dim=384`, similar sentences ≈ **0.61**, unrelated ≈ **0.01**.

### Step 3 — Wire capture into the local store
- In `app/share.tsx`, on confirm: `embed(text)` → `insertMemory({...})` **locally first**.
- Keep the existing desktop `POST /ingest/note` call, but make it **best-effort** (wrap in try/catch so
  it silently no-ops when the desktop is unreachable). This preserves the **companion** behavior without
  blocking offline use.
- Add a tiny **"quick add note"** input on the Saved screen so you can create items without the share
  sheet (makes testing easy).
- ✅ **Check:** turn on **airplane mode**, Share a link from Chrome → "Save to 2brn" → it appears in the
  local list.

### Step 4 — The semantic-search screen ✅ done
- Built a standalone **`app/memories.tsx`** ("On this phone"): quick-add, a list, and a search box that
  embeds the query and ranks saved items by cosine similarity (`src/ml/search.ts` → `rankBySimilarity`,
  unit-tested). Reachable **without pairing** via a "Use on this phone without a desktop →" link on the
  pair screen. (The tabbed UI stays pairing-gated for now; fully opening the app unpaired is a Phase 3
  follow-up.)
- ✅ **Verified on-device (money shot):** the query *"how much does the database cost"* ranked the
  "database pricing" note #1 (score 0.567) over unrelated notes — matched by meaning, fully offline.

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
- The embedding model (~90 MB) is **downloaded on first launch** by ExecuTorch's resource fetcher and
  cached on-device — it is *not* bundled, so the APK stays small, but the first run needs network once.
- Keep the embedding **model identical** to whatever you'll use later, so Phase 2/3 vectors stay
  comparable (don't re-embed everything when you add the LLM).

## Suggested commit slices (Conventional Commits)

1. `chore(mobile): add expo-sqlite local memory store`
2. `feat(mobile): on-device text embeddings (react-native-executorch + MiniLM)`
3. `feat(mobile): save shared notes to the local store, embedded`
4. `feat(mobile): offline semantic search over saved items`
