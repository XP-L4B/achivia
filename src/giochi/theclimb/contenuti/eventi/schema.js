/**
 * La forma di un evento, e le parole che puo' usare.
 *
 * Un evento e' una scheda di dati: **niente codice**. Le condizioni sono
 * chiavi di un vocabolario chiuso (`CHIAVI_QUANDO`), gli effetti pure
 * (`CHIAVI_EFFETTI`), e il validatore (`climb:eventi`) rifiuta tutto
 * quello che non conosce. Cosi' se ne aggiungono altri senza toccare il
 * motore, ed e' il motore a dire come si legge ogni parola.
 *
 *   id          unico in tutta la banca
 *   categoria   imprevisto | opportunita | vita | bivio
 *   titolo      corto, si legge come un titolo
 *   testo       che cosa succede, in due o tre frasi
 *   quando      le condizioni, tutte da soddisfare (vedi CHIAVI_QUANDO)
 *   peso        quanto e' probabile rispetto agli altri candidati (1 = normale)
 *   background  moltiplicatori per vita: { nessuna: 2, erede: 0 }. Zero
 *               vuol dire che per quella vita la porta non c'e' — e allora
 *               l'evento compare lo stesso, grigio, con scritto perche'
 *               (`porta: true`): il giocatore deve vedere la porta chiusa
 *   unaVolta    non si ripete (di default si')
 *   opzioni     da due a quattro: { id, testo, effetti, dopo, richiede, lezione, audace }
 *   predefinita l'opzione che vale se non si risponde (avanzare con la
 *               routine): e' sempre quella **prudente**. La routine non si
 *               lancia mai, ed e' per questo che chi vive di routine perde
 *               le occasioni — e' una regola del gioco, non un difetto
 *   audace      l'opzione che e' un salto: costa o rischia adesso, e apre.
 *               Ogni occasione ne ha una; i bivi quando ce l'hanno
 *   lezione     due righe «nella vita reale», facoltative
 *
 * Gli effetti: gradini per le statistiche (come le attivita'), euro per
 * i soldi (`soldi: -900` sono novecento euro), e qualche parola in piu':
 * `lavoro: 'perdi'`, `offerta: 'aziendaId'`, `persona: { archetipo }`,
 * `competenze: { id: gradini }`, `tempo: -20` (la settimana dopo ne hai
 * meno), `ritardo: { settimane, effetti, testo }` (arriva dopo).
 */

export const VERSIONE_EVENTI = 1;

export const CATEGORIE = ['imprevisto', 'opportunita', 'vita', 'bivio'];

export const CHIAVI_QUANDO = new Set([
  'lavoro',            // true | false | 'vero' | 'sopravvivenza'
  'livelloMin', 'livelloMax',
  'settimanaMin', 'settimanaMax',
  'etaMin', 'etaMax',
  'soldiMin', 'soldiMax',
  'stressMin', 'stressMax',
  'saluteMax', 'saluteMin',
  'sonnoMin',
  'noiaMin',
  'felicitaMax', 'felicitaMin',
  'relazioniMin', 'relazioniMax',
  'reteMin', 'reteMax',
  'reputazioneMin',
  'integritaMax', 'integritaMin',
  'performanceMin', 'performanceMax',
  'visibilitaMin',
  'percorso',          // [ids]
  'background',        // [ids] solo questi
  'nonBackground',     // [ids] tutti tranne questi
  'sponsor',           // true | false
  'titolo',            // true | false
  'capo',              // 'tossico' | 'capo_eccellente' | 'qualsiasi'
  'alleato',           // true: c'e' un alleato con fiducia alta
  'mentore',           // true | false
  'offerte',           // true | false: ci sono offerte che aspettano
  'studia',            // true: sta studiando un percorso con durata
  'portfolioMin',
  'aziendaTipo',       // 'vera' | 'sopravvivenza'
  'stabilitaMax',      // dell'azienda in cui si lavora
  'culturaMax',
  'inRosso',           // true: soldi sotto zero
  'impresa',           // true: ha un'impresa in piedi
  'macchia',           // true | false: uno scandalo alle spalle
]);

export const CHIAVI_EFFETTI = new Set([
  'salute', 'sonno', 'stress', 'felicita', 'noia',
  'relazioni', 'rete', 'reputazione', 'integrita', 'sospetto',
  'performance', 'visibilita',
  'soldi', 'ricerca', 'portfolio', 'tempo',
  'lavoro', 'offerta', 'persona', 'competenze', 'ritardo', 'sponsorFiducia', 'titolo',
  'impresa',           // true: da qui in poi ha un'impresa in piedi
  'fine',              // una causa di fine: 'impresa'
  'posti',             // +0.3: alla prossima valutazione il posto c'e' piu' spesso (un rivale in meno)
]);

/** Un evento, con i valori di default riempiti. */
export const e = (id, categoria, titolo, testo, opzioni, extra = {}) => ({
  id, categoria, titolo, testo, opzioni,
  quando: extra.quando ?? {},
  peso: extra.peso ?? 1,
  background: extra.background ?? {},
  unaVolta: extra.unaVolta ?? true,
  predefinita: extra.predefinita ?? opzioni[0].id,
  lezione: extra.lezione ?? null,
  porta: extra.porta ?? false,
  /* un'occasione senza un salto dentro (un bonus: si mette via o si spende) lo dichiara */
  salto: extra.salto ?? true,
});

/** Un'opzione. */
export const o = (id, testo, effetti = {}, extra = {}) => ({ id, testo, effetti, dopo: extra.dopo ?? null, richiede: extra.richiede ?? null, lezione: extra.lezione ?? null, audace: extra.audace ?? false });
