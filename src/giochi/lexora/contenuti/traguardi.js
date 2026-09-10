/**
 * I traguardi di Lexora: ventisei, in quattro categorie.
 *
 * Sono un profilo a parte, come quelli dell'arena. Non toccano gli
 * achievement di Achivia, i loro contatori, le medaglie: stanno nel
 * deposito di Lexora (`traguardiLexora`) e si vedono dall'atrio del
 * gioco. Sbloccarne uno non da' crediti e non da' esperienza — il livello
 * di un account dice quanto ha lavorato, non quanto ha giocato.
 *
 * La forma e' quella dei traguardi dell'arena, e non per pigrizia: la
 * schermata che li mostra e' la stessa, e una seconda forma vorrebbe dire
 * una seconda schermata da tenere allineata.
 *
 * Ogni traguardo si legge da una sola misura contro una soglia, cosi' ha
 * sempre un progresso vero da mostrare. Le misure sono i totali di tutte
 * le partite e i primati di una partita sola; si aggiornano una volta,
 * alla fine di una partita, da `aggiornaMisure`.
 */

export const CATEGORIE = [
  { id: 'vocabolario', nome: 'Vocabolario' },
  { id: 'duello', nome: 'Duello' },
  { id: 'intuito', nome: 'Intuito' },
  { id: 'costanza', nome: 'Costanza' },
];

const T = (id, categoria, nome, descrizione, requisito, almeno, misura, unita = '') => ({ id, categoria, nome, descrizione, requisito, almeno, misura, unita });

export const TRAGUARDI = [
  /* ─── Vocabolario ─── */
  T('prima-parola', 'vocabolario', 'La prima', 'Una parola segreta trovata.', 'Indovina 1 parola', 1, (m) => m.indovinate, 'parole'),
  T('cento-parole', 'vocabolario', 'Cento parole', 'Il dizionario comincia a conoscerti.', 'Indovina 100 parole in totale', 100, (m) => m.indovinate, 'parole'),
  T('mille-parole', 'vocabolario', 'Mille parole', 'Più di quante ne dica una foto.', 'Indovina 1.000 parole in totale', 1000, (m) => m.indovinate, 'parole'),
  T('parola-lunga', 'vocabolario', 'Sette lettere', 'Sette caselle vuote, e le hai riempite tutte.', 'Indovina una parola di 7 lettere', 7, (m) => m.record.lettere, 'lettere'),
  T('prima-scoperta', 'vocabolario', 'Scoperta', 'Una parola rara, con la sua scheda.', 'Indovina 1 parola rara', 1, (m) => m.scoperte, 'parole'),
  T('dieci-scoperte', 'vocabolario', 'Curioso', 'Dieci parole che non si usano tutti i giorni.', 'Indovina 10 parole rare', 10, (m) => m.scoperte, 'parole'),
  T('cinquanta-scoperte', 'vocabolario', 'Collezionista', 'Cinquanta schede, e le hai lette.', 'Indovina 50 parole rare', 50, (m) => m.scoperte, 'parole'),
  T('poliglotta', 'vocabolario', 'Poliglotta', 'Tre lingue, tre dizionari.', 'Gioca in 3 lingue diverse', 3, (m) => m.lingue.length, 'lingue'),
  T('cinque-lingue', 'vocabolario', 'Cinque bandiere', 'Italiano, inglese, francese, spagnolo, tedesco.', 'Gioca in tutte e 5 le lingue', 5, (m) => m.lingue.length, 'lingue'),
  /* ─── Duello ─── */
  T('prima-vittoria', 'duello', 'La prima vittoria', 'Uno a zero.', 'Vinci 1 partita', 1, (m) => m.vittorie, 'vittorie'),
  T('dieci-vittorie', 'duello', 'Dieci vittorie', 'Non era fortuna.', 'Vinci 10 partite', 10, (m) => m.vittorie, 'vittorie'),
  T('cinquanta-vittorie', 'duello', 'Cinquanta vittorie', 'Adesso ti studiano.', 'Vinci 50 partite', 50, (m) => m.vittorie, 'vittorie'),
  T('tre-di-fila', 'duello', 'Tre di fila', 'Tre partite, tre vittorie, di seguito.', 'Vinci 3 partite di fila', 3, (m) => m.record.serieVittorie, 'di fila'),
  T('dominio', 'duello', 'Dominio', 'Cinquanta punti di scarto.', 'Vinci una partita con 50 punti di margine', 50, (m) => m.record.margine, 'punti'),
  T('pareggio', 'duello', 'Testa a testa', 'Stesso punteggio, alla fine.', 'Chiudi 1 partita in pareggio', 1, (m) => m.pareggi, 'pareggi'),
  /* ─── Intuito ─── */
  T('primo-colpo', 'intuito', 'Al primo colpo', 'Scritta a caso, e c’era.', 'Indovina una parola al 1º tentativo', 1, (m) => m.record.colpoSecco, 'tentativi'),
  T('secondo-colpo', 'intuito', 'Due tentativi', 'Uno per guardare, uno per prendere.', 'Indovina una parola in 2 tentativi', 1, (m) => m.duetentativi, 'volte'),
  T('senza-sbagliare', 'intuito', 'Nessuna persa', 'Tutte le parole di una partita, indovinate.', 'Indovina tutte le parole di una partita', 1, (m) => m.partitePiene, 'partite'),
  T('dieci-piene', 'intuito', 'Regolarità', 'Dieci partite chiuse senza lasciarne una.', 'Chiudi 10 partite indovinandole tutte', 10, (m) => m.partitePiene, 'partite'),
  T('media-bassa', 'intuito', 'Poche mosse', 'Cinquanta parole trovate, e in media meno di quattro tentativi.', 'Indovina 50 parole in totale', 50, (m) => m.indovinate, 'parole'),
  T('cento-tentativi', 'intuito', 'Cento prove', 'Cento parole scritte in quelle caselle.', 'Fai 100 tentativi in totale', 100, (m) => m.tentativi, 'tentativi'),
  /* ─── Costanza ─── */
  T('prima-partita', 'costanza', 'La prima partita', 'Sei arrivato in fondo.', 'Completa 1 partita', 1, (m) => m.partite, 'partite'),
  T('dieci-partite', 'costanza', 'Habitué', 'Dieci partite.', 'Completa 10 partite', 10, (m) => m.partite, 'partite'),
  T('cinquanta-partite', 'costanza', 'Di casa', 'Cinquanta partite.', 'Completa 50 partite', 50, (m) => m.partite, 'partite'),
  T('centoventi', 'costanza', 'Centoventi punti', 'Una partita giocata bene dall’inizio alla fine.', 'Fai 120 punti in una partita', 120, (m) => m.record.punti, 'punti'),
  T('duecento', 'costanza', 'Duecento punti', 'Poche parole sbagliate, e presto.', 'Fai 200 punti in una partita', 200, (m) => m.record.punti, 'punti'),
  T('mille-punti', 'costanza', 'Mille punti', 'Sommati, una partita dopo l’altra.', 'Fai 1.000 punti in totale', 1000, (m) => m.punti, 'punti'),
];

export const traguardoById = (id) => TRAGUARDI.find((t) => t.id === id) || null;

/** Le misure di chi non ha ancora giocato. */
export function misureVuote() {
  return {
    partite: 0, vittorie: 0, pareggi: 0, punti: 0,
    indovinate: 0, tentativi: 0, scoperte: 0,
    duetentativi: 0, partitePiene: 0,
    lingue: [],
    /* Non e' un primato ne' un totale: e' la serie aperta, e serve solo a
       far crescere `record.serieVittorie`. */
    serieVittorieInCorso: 0,
    record: { punti: 0, lettere: 0, margine: 0, serieVittorie: 0, colpoSecco: 0 },
  };
}

const n = (v) => Math.max(0, Number(v) || 0);

/**
 * Le misure dopo una partita: i totali sommano, i primati tengono il
 * massimo. Torna un oggetto nuovo; quello di prima non si tocca.
 *
 * `r` e' il riassunto di **una persona** in una partita — quello che
 * scrive il deposito, non il client.
 */
export function aggiornaMisure(prima, r) {
  const m = { ...misureVuote(), ...(prima || {}), record: { ...misureVuote().record, ...(prima?.record || {}) } };
  if (!r) return m;
  m.partite += 1;
  if (r.vinta) m.vittorie += 1;
  if (r.pareggio) m.pareggi += 1;
  m.punti += n(r.punti);
  m.indovinate += n(r.indovinate);
  m.tentativi += n(r.tentativi);
  m.scoperte += n(r.scoperte);
  m.duetentativi += n(r.duetentativi);
  if (r.paroleTotali && n(r.indovinate) >= n(r.paroleTotali)) m.partitePiene += 1;
  if (r.lingua && !m.lingue.includes(r.lingua)) m.lingue = [...m.lingue, r.lingua];
  const rec = m.record;
  rec.punti = Math.max(rec.punti, n(r.punti));
  rec.lettere = Math.max(rec.lettere, n(r.lettereMassime));
  if (r.vinta) rec.margine = Math.max(rec.margine, n(r.margine));
  /* Il colpo secco: indovinata al primo tentativo. Si tiene come primato e
     non come totale perche' e' una cosa che o e' successa o no. */
  if (r.minimoTentativi === 1) rec.colpoSecco = 1;
  const serie = r.vinta ? n(prima?.serieVittorieInCorso) + 1 : 0;
  m.serieVittorieInCorso = serie;
  rec.serieVittorie = Math.max(rec.serieVittorie, serie);
  return m;
}

/** Gli id che con queste misure risultano raggiunti. */
export const raggiunti = (m) => TRAGUARDI.filter((t) => t.misura(m) >= t.almeno).map((t) => t.id);

/** La lista completa per la schermata: valore di adesso, progresso, stato, data. */
export function valuta(m, sbloccati = {}) {
  const misure = m || misureVuote();
  return TRAGUARDI.map((t) => {
    const valore = t.misura(misure);
    const quando = sbloccati[t.id] || null;
    return {
      id: t.id, categoria: t.categoria, nome: t.nome, descrizione: t.descrizione, requisito: t.requisito,
      almeno: t.almeno, unita: t.unita,
      valore: Math.min(valore, t.almeno),
      progresso: Math.max(0, Math.min(1, valore / t.almeno)),
      sbloccato: Boolean(quando) || valore >= t.almeno,
      quando,
    };
  });
}

/** Il valore e la soglia come si leggono: 3/10. */
export const progressoLeggibile = (v) => `${v.valore} / ${v.almeno}`;
