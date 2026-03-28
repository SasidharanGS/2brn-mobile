// On-device text embeddings (Phase 0, Step 2), powered by react-native-executorch.
// The model runs entirely on the phone; the same toolkit also provides the
// Phase 2 on-device LLM (useLLM) and Phase 1 OCR (useOCR).
//
// Access is via the `useTextEmbeddings` hook (there is no imperative API), so
// screens that need to embed text use the hook and call `forward(text)`, which
// resolves to a Float32Array. This module just centralizes the model choice.
import { models } from 'react-native-executorch'

/** The 2brn on-device embedding model: all-MiniLM-L6-v2 (384-dim). */
export const EMBEDDING_MODEL = models.text_embedding.all_minilm_l6_v2()

/** Dimensionality of EMBEDDING_MODEL's output vectors. */
export const EMBEDDING_DIM = 384
