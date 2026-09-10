// Selettore della modalità del chatbot. Riesporta l'interfaccia comune
// (streamChat, DEFAULT_MODEL) così le pagine non sanno quale backend è attivo.
//
//   - VITE_OLLAMA_URL valorizzato → modalità "locale" (Ollama LLM locale,
//     webapp su GitHub Pages): vedi ./ollama-local.
//   - altrimenti → modalità "cloud" (backend proxy ↔ Ollama cloud,
//     webapp in locale): vedi ./ollama-cloud.

import * as local from './ollama-local';
import * as cloud from './ollama-cloud';

const useLocal = !!import.meta.env.VITE_OLLAMA_URL;
const impl = useLocal ? local : cloud;

export const DEFAULT_MODEL = impl.DEFAULT_MODEL;
export const streamChat = impl.streamChat;
