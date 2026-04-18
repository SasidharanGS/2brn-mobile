// On-device LLM model choice (Phase 2), via react-native-executorch — the same
// single toolkit as embeddings (Phase 0), OCR + STT (Phase 1). Access is via the
// `useLLM` hook, so LlmProvider holds the instance; this centralizes the model
// choice. Pure prompt construction lives in `prompt.ts` (native-free, unit-tested).
//
// NOTE: executorch 0.9.0 ships no Gemma (the original PARITY note predated the
// stack lock). We use Meta's Llama 3.2 1B (SpinQuant) — a mobile-optimized
// quantization (~1 GB, well-tested in executorch), a good quality/size/speed
// balance for grounded answers over short note context. Swap this one constant
// for more quality (e.g. LLAMA3_2_3B_SPINQUANT, QWEN2_5_1_5B_QUANTIZED,
// PHI_4_MINI_4B_QUANTIZED) — vectors/notes are unaffected.
import { LLAMA3_2_1B_SPINQUANT } from 'react-native-executorch'

/** The 2brn on-device LLM: Llama 3.2 1B (SpinQuant). Writes grounded answers. */
export const LLM_MODEL = LLAMA3_2_1B_SPINQUANT

/** How many retrieved notes to feed the LLM as grounding context for an answer. */
export const ANSWER_CONTEXT_SIZE = 4
