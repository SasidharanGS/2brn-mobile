// On-device speech-to-text model choice (Phase 1, Branch B), via react-native-executorch.
// Same single toolkit as Phase 0 embeddings and Branch A OCR. Access is via the
// `useSpeechToText` hook, so SttProvider holds the instance; this just centralizes the
// model choice. Pure waveform assembly lives in `audioWaveform.ts` (native-free, tested).
import { WHISPER_TINY_EN } from 'react-native-executorch'

/** The 2brn on-device STT model: Whisper tiny (English). Expects 16 kHz mono audio. */
export const STT_MODEL = WHISPER_TINY_EN
