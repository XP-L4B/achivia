/**
 * I giochi di Achivia: l'elenco, e niente altro.
 *
 * Un gioco e' una riga qui dentro. Chi ne aggiunge uno domani scrive una
 * riga e la sua pagina: l'hub non cambia, il menu non cambia, il profilo
 * non cambia. Per questo l'elenco sta nei dati e non dentro la schermata —
 * una schermata che contiene l'elenco delle cose che mostra e' una
 * schermata che va riaperta ogni volta che l'elenco cresce.
 *
 *   id          per il codice e per le statistiche
 *   nome        come si chiama, per chi legge
 *   sommario    una riga: che cosa si fa
 *   descrizione due righe: perche' dovrebbe interessare
 *   icona       quale disegno mettere sulla scheda: il nome, non l'immagine.
 *               I dati non importano un file e non conoscono React; il
 *               collegamento fra questo nome e il disegno lo fa l'hub.
 *   to          dove porta
 *   giocatori   con quante persone si gioca, scritto come si legge
 *   durata      quanto dura una partita, per chi ha cinque minuti
 *   attivo      se il gioco si vede. Manca? Allora si vede: i giochi finiti
 *               non hanno bisogno di dichiararlo. Sta a `false` finche' un
 *               gioco e' in lavorazione — vedi `giochiVisibili` qui sotto,
 *               che e' l'unico elenco che le schermate devono leggere.
 */
export const GIOCHI = [
  {
    id: 'lexora',
    nome: 'Lexora',
    sommario: 'Indovina la parola segreta.',
    descrizione: 'Sai solo quante lettere ha. Provi una parola vera e i colori ti dicono quanto ci sei vicino: verde al posto giusto, giallo fuori posto, grigio non c’è. Stessa parola per tutti e due, vince chi ci arriva prima.',
    icona: 'lexora',
    to: '/giochi/lexora',
    giocatori: 'da solo o in due',
    durata: '5–10 minuti',
  },
  {
    id: 'theboss',
    nome: 'The Boss',
    sommario: 'Comanda tu. Buona fortuna.',
    descrizione: 'Sei a capo di un’azienda di pozioni nel regno di Achivia, e la squadra è fatta di gente particolare. Bussano, chiedono, propongono: accetti, rifiuti o rimandi. Trenta giorni per scoprire che non si può accontentare tutti, e che trattare male le persone si paga sempre — solo più tardi.',
    icona: 'theboss',
    to: '/giochi/the-boss',
    giocatori: 'da solo',
    durata: '15–20 minuti',
  },
  {
    id: 'theclimb',
    nome: 'The Climb',
    sommario: 'Da dove parti non lo scegli. Dove arrivi sì.',
    descrizione: 'Hai diciannove anni e una vita che ti è capitata in sorte: soldi o nessuno, contatti o nessuno. Dodici anni davanti, una settimana alla volta: decidi dove va il tempo, e il gioco ti dice che cosa è cambiato e perché. Arriva più in alto che puoi, e arrivaci intero.',
    icona: 'theclimb',
    to: '/giochi/the-climb',
    giocatori: 'da solo',
    durata: 'a pezzi: si salva a ogni settimana',
  },
  {
    id: 'survival',
    nome: 'Achivia: Survival',
    sommario: 'Sopravvivi il più a lungo possibile.',
    descrizione: 'Un’arena, ondate che non finiscono, e tu che spari da solo. Il tuo livello in Achivia apre personaggi e potenzia le statistiche.',
    icona: 'arena',
    to: '/arena',
    giocatori: 'da solo',
    durata: 'finché resisti',
  },
];

/**
 * L'interruttore dei giochi in lavorazione.
 *
 * Un gioco che si sta scrivendo non deve comparire nel menu ne' avere una
 * rotta raggiungibile: chi apre Achivia oggi non deve inciampare in una
 * schermata a meta'. Ma nasconderlo e basta non basta a chi lo sta
 * scrivendo, che ha bisogno di aprirlo — quindi c'e' una scorciatoia sola,
 * una variabile d'ambiente, che si accende in locale o in un deploy di
 * prova e non esiste in quello pubblico:
 *
 *     VITE_GIOCHI_IN_LAVORAZIONE=theboss npm run dev
 *
 * Piu' nomi si separano con la virgola. Quando il gioco e' pronto si toglie
 * `attivo: false` dalla sua riga e l'interruttore non lo riguarda piu'.
 */
const IN_LAVORAZIONE = String(import.meta.env?.VITE_GIOCHI_IN_LAVORAZIONE || '')
  .split(',').map((s) => s.trim()).filter(Boolean);

export const giocoAcceso = (id) => {
  const g = GIOCHI.find((x) => x.id === id);
  if (!g) return false;
  return g.attivo !== false || IN_LAVORAZIONE.includes(id);
};

/** I giochi che si vedono adesso: il menu e il router leggono questo, non `GIOCHI`. */
export const giochiVisibili = () => GIOCHI.filter((g) => giocoAcceso(g.id));

export const giocoById = (id) => GIOCHI.find((g) => g.id === id) || null;
