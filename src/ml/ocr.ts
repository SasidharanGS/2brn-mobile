// On-device OCR model choice (Phase 1, Branch A), powered by react-native-executorch.
// The same single toolkit as Phase 0 embeddings and the Phase 2 LLM — runs fully
// on the phone. Access is via the `useOCR` hook (no imperative API), so the
// OcrProvider holds the instance; this module just centralizes the model choice.
// (Pure text assembly lives in `ocrText.ts`, kept native-free for unit tests.)
import { OCR_ENGLISH } from 'react-native-executorch'

/** The 2brn on-device OCR model: English detector + recognizer pair. */
export const OCR_MODEL = OCR_ENGLISH
