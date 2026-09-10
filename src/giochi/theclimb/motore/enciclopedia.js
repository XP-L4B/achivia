/**
 * Quali schede questa vita ha sbloccato. Si calcola dallo stato, non si
 * salva: quello che si e' incontrato sta gia' nel log, nelle persone,
 * nelle valutazioni. Il deposito tiene l'unione fra le vite.
 */

import { SCHEDE } from '../contenuti/enciclopedia.js';
import { condizioneVale } from './eventi.js';

function visto(stato, cosa) {
  if (!cosa) return true;
  if (cosa.startsWith('evento:')) return stato.eventiVisti[cosa.slice(7)] !== undefined;
  switch (cosa) {
    case 'valutazione': return stato.valutazioni.some((v) => v.tipo === 'valutazione');
    case 'sponsor': return Boolean(stato.sponsor) || stato.valutazioni.some((v) => v.carte?.some((c) => c.id === 'sponsor'));
    case 'tossico': return stato.persone.some((p) => p.archetipo === 'tossico' && p.svelato);
    case 'manipolatore': return stato.persone.some((p) => p.archetipo === 'manipolatore' && p.svelato);
    case 'scoperta': return stato.conosciute.length > 0;
    case 'muro': return stato.valutazioni.some((v) => v.lezione && /trasversali/.test(v.lezione));
    case 'occasione': return (stato.occasioni?.prese ?? 0) + (stato.occasioni?.lasciate ?? 0) > 0;
    case 'porta_chiusa': return stato.log.some((r) => r.tipo === 'evento' && r.opzione === 'chiusa');
    case 'scorciatoia': return stato.contaScorrettezze.fatte > 0 || stato.persone.some((p) => p.memoria.some((m) => m.cosa === 'torto'));
    case 'scandalo': return stato.esplosioni.length > 0;
    case 'memoria': return stato.persone.some((p) => p.memoria.length > 0);
    case 'impresa': return Boolean(stato.impresa) || stato.eventiVisti.fondare !== undefined;
    default: return false;
  }
}

export function schedeSbloccate(stato) {
  return SCHEDE.filter((s) => condizioneVale(stato, s.quando) && visto(stato, s.visto)).map((s) => s.id);
}
