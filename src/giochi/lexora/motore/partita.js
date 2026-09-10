/**
 * Lexora: lo stato di una partita e le regole che lo cambiano.
 *
 * Qui non c'e' React, non ci sono immagini e non c'e' il deposito: si puo'
 * far girare una partita intera in Node, ed e' cosi' che si prova. Chi
 * chiama passa una mossa e riceve un esito; lo stato lo cambia solo questo
 * file.
 *
 * ─── Il giro ────────────────────────────────────────────────────────────
 *
 * C'e' una parola segreta. Di lei si sa solo quante lettere ha: tante
 * caselle vuote. Si prova una parola della stessa lunghezza e il gioco
 * risponde lettera per lettera — verde se e' quella giusta al posto
 * giusto, gialla se c'e' ma altrove, grigia se non c'e'. Con quello che si
 * impara si stringe il cerchio, finche' la parola esce o finiscono i
 * tentativi.
 *
 * Tutti e due i giocatori hanno la stessa parola e i loro tentativi, e si
 * alternano: cosi' i punteggi si confrontano davvero, invece di dipendere
 * da chi ha pescato la parola piu' facile. Una partita e' fatta di piu'
 * parole; quando tutti e due hanno finito con una, si passa alla
 * successiva.
 *
 * ─── Perche' il motore e' l'unico che conta ─────────────────────────────
 *
 * Una mossa contiene la parola tentata e nient'altro: non il suo esito,
 * non i punti. I colori li decide il motore confrontando con la segreta,
 * il punteggio lo calcola il motore, il tempo lo controlla il motore. Chi
 * gioca non ha modo di dire «questa vale ottanta»: non c'e' un campo dove
 * scriverlo, e se ce lo mettesse verrebbe buttato prima di arrivare qui.
 *
 * E la parola segreta non esce dalla fotografia finche' non e' finita: chi
 * guarda lo stato del turno in corso vede quante lettere ha e nient'altro.
 *
 * Le fasi: 'gioco' finche' ci sono parole, poi 'finita'.
 */

import { creaCaso } from '../../../game/caso';
import { CONFIG, configDiLivello } from '../contenuti/config';
import { linguaById, cerca } from '../contenuti/lingue/registro';
import { confronta, indovinata as tuttaVerde, quantiVerdi, letterePiuChiare } from './esito';
import { pescaSegreta } from './segreta';
import { calcola } from './punteggio';
import { normalizza, inLettere } from './normalizza';

export const VERSIONE_MOTORE = 2;

const giocatoreNuovo = (g, i) => ({
  indice: i,
  userId: g.userId ?? g.id ?? null,
  nome: g.nome ?? 'Giocatore',
  bot: g.bot ?? null,               // 'facile' | 'medio' | 'difficile', o null
  punti: 0,
  righe: [],                        // i tentativi di questa parola: { parola, lettere, esito }
  finito: false,                    // ha indovinato o ha finito i tentativi
  indovinate: 0,                    // quante parole ha indovinato in tutto
  tentativiTotali: 0,
  minimoTentativi: 0,               // il colpo piu' bello: in quanti tentativi
  scoperte: [],                     // le parole rare indovinate, con la scheda
  turniGiocati: 0,
  storia: [],                       // una voce per parola: { parola, indovinata, tentativi, punti }
});

/**
 * Una partita nuova.
 *
 *   lingua      l'id della lingua: decide il dizionario e le parole segrete
 *   seme        due partite con lo stesso seme sono la stessa partita
 *   giocatori   due: { userId, nome, bot? }
 *   adesso      il tempo di chi chiama, per far partire il primo turno
 */
export function creaPartita({ lingua = 'it', seme = 1, giocatori = [], adesso = Date.now(), config = CONFIG, modo = null } = {}) {
  const scheda = linguaById(lingua);
  /* Uno o due. La prova in solitario ne ha uno — si gioca contro se
     stessi — e la sfida due. Il resto del motore non se ne accorge: i
     turni girano su `giocatori.length`, che era gia' scritto cosi'. */
  const quanti = Math.max(1, Math.min(2, giocatori.length || 2));
  const stato = {
    versione: VERSIONE_MOTORE,
    lingua: scheda,
    linguaId: scheda.id,
    seme,
    caso: creaCaso(seme),
    config,
    modo: modo ?? (quanti === 1 ? 'prova' : 'sfida'),
    livello: config.livello?.n ?? null,
    giocatori: Array.from({ length: quanti }, (_, i) => giocatoreNuovo(giocatori[i] || {}, i)),
    diChi: 0,
    /* Quanto e' durata la parola in corso, per chi la sta giocando. Serve
       al premio del tempo, che e' quello che rende il livello una
       difficolta' e non un'etichetta. */
    msParola: 0,
    apertoIl: adesso,
    intervallo: null,
    turno: 0,                 // quanti tentativi si sono giocati in tutto
    parola: 0,                // a che parola segreta si e'
    segreta: null,            // { parola, normalizzata, lettere, scheda }
    scadenza: 0,
    fase: 'gioco',
    registro: [],
    esito: null,
  };
  apriParola(stato, adesso);
  return stato;
}

/* ─── Le parole e i turni ─── */

const dopoDi = (stato, i) => (i + 1) % stato.giocatori.length;

/** Comincia una parola segreta: la si pesca, e tutti e due ripartono da zero tentativi. */
function apriParola(stato, adesso) {
  stato.segreta = pescaSegreta(stato, stato.parola);
  for (const g of stato.giocatori) { g.righe = []; g.finito = false; }
  stato.diChi = 0;
  stato.msParola = 0;
  stato.intervallo = null;
  stato.fase = 'gioco';
  apriTurno(stato, adesso);
}

/** La scadenza del turno di chi tocca adesso. */
function apriTurno(stato, adesso) {
  stato.apertoIl = adesso;
  stato.scadenza = adesso + stato.config.turno.secondi * 1000;
}

/** Quanto e' durato il turno che si sta chiudendo, senza sforare la sua durata. */
function segnaTempo(stato, adesso) {
  const tetto = stato.config.turno.secondi * 1000;
  stato.msParola += Math.max(0, Math.min(tetto, adesso - stato.apertoIl));
}

/**
 * Passa la mano.
 *
 * Chi ha gia' finito questa parola — l'ha indovinata, o ha esaurito i
 * tentativi — si salta: aspettare il proprio turno per non poter fare
 * niente sarebbe solo tempo perso. Quando hanno finito tutti e due si
 * passa alla parola dopo, e se le parole sono finite la partita e' finita.
 */
function chiudiTurno(stato, adesso) {
  stato.turno += 1;
  if (stato.giocatori.every((g) => g.finito)) {
    /* Nella prova ci si ferma un attimo: si legge com'e' andata, e
       l'orologio sta fermo davvero — non e' un pannello sopra un gioco
       che intanto continua. Riparte con `continua`.
       Nella sfida no: i due giocano quando capita, anche a ore diverse, e
       una pausa che aspetta un altro non e' una pausa, e' un blocco. */
    if (stato.modo === 'prova') { apriIntervallo(stato); return; }
    stato.parola += 1;
    if (stato.parola >= stato.config.partita.parole) { finisci(stato); return; }
    apriParola(stato, adesso);
    return;
  }
  let i = dopoDi(stato, stato.diChi);
  let giri = 0;
  while (stato.giocatori[i].finito && giri < stato.giocatori.length) { i = dopoDi(stato, i); giri += 1; }
  stato.diChi = i;
  apriTurno(stato, adesso);
}

/**
 * L'intervallo fra una parola e l'altra.
 *
 * Prima la parola finiva e la successiva cominciava nello stesso istante:
 * chi indovinava lo scopriva da una riga di testo che spariva subito, e
 * chi sbagliava vedeva la parola giusta per il tempo di un battito di
 * ciglia — con il cronometro della parola dopo gia' partito. Un gioco che
 * non si ferma a dire com'e' andata non insegna niente.
 *
 * Adesso si ferma. `stato.intervallo` dice tutto quello che serve a
 * scriverlo a schermo, e finche' dura la fase e' `intervallo`: nessuna
 * mossa passa, e la scadenza del turno dopo non esiste ancora perche' il
 * turno dopo non e' cominciato.
 */
function apriIntervallo(stato) {
  const chi = stato.giocatori[0];
  const ultima = chi.storia.at(-1) ?? null;
  const finite = stato.parola + 1 >= stato.config.partita.parole;
  stato.fase = 'intervallo';
  stato.intervallo = {
    parola: stato.parola,
    di: stato.config.partita.parole,
    segreta: stato.segreta.parola,
    scheda: stato.segreta.scheda ?? null,
    indovinata: Boolean(ultima?.indovinata),
    tentativi: ultima?.tentativi ?? 0,
    punti: ultima?.punti ?? 0,
    parti: ultima?.parti ?? null,
    secondi: Math.round(stato.msParola / 1000),
    puntiFinora: chi.punti,
    ultima: finite,
  };
}

/** Si riparte: la parola dopo, o la fine. */
function giocaContinua(stato, adesso) {
  if (stato.fase !== 'intervallo') return no('Non c’è niente da riprendere.');
  const finita = stato.intervallo?.ultima;
  stato.intervallo = null;
  stato.parola += 1;
  if (finita || stato.parola >= stato.config.partita.parole) { finisci(stato); return { ok: true, tipo: 'continua', fine: true }; }
  apriParola(stato, adesso);
  return { ok: true, tipo: 'continua', fine: false };
}

function finisci(stato) {
  stato.fase = 'finita';
  const punti = stato.giocatori.map((g) => g.punti);

  /* La prova non si vince contro qualcuno: si passa o non si passa. E per
     passare non basta il punteggio — vanno indovinate **tutte e due** le
     parole. Il punteggio dice quanto in fretta, e senza il premio del
     tempo la soglia non si raggiunge: e' cosi' che il livello e' una
     difficolta' e non un'etichetta. */
  if (stato.modo === 'prova') {
    const io = stato.giocatori[0];
    const tutte = io.indovinate >= stato.config.partita.parole;
    const soglia = stato.config.livello?.soglia ?? 0;
    stato.esito = {
      prova: true,
      livello: stato.livello,
      punti: io.punti,
      soglia,
      tutte,
      superato: tutte && io.punti >= soglia,
      indovinate: io.indovinate,
      parole: stato.config.partita.parole,
    };
    return;
  }

  const massimo = Math.max(...punti);
  const primi = stato.giocatori.filter((g) => g.punti === massimo);
  stato.esito = {
    // Pareggio vuol dire che in cima ce n'e' piu' di uno: con due
    // giocatori e' «stesso punteggio», con tre resta vero senza cambiare
    // niente.
    pareggio: primi.length > 1,
    vincitore: primi.length === 1 ? primi[0].userId : null,
    punti,
  };
}

/* ─── Le mosse ─── */

const no = (errore) => ({ ok: false, errore });

/**
 * Una mossa.
 *
 *   { tipo: 'tentativo', parola }   provo questa parola
 *   { tipo: 'passa' }               rinuncio a questa parola
 *   { tipo: 'scaduto' }             il tempo del turno e' finito
 */
export function gioca(stato, mossa, adesso = Date.now()) {
  if (!stato || stato.fase === 'finita') return no('La partita è finita.');
  if (!mossa || typeof mossa !== 'object') return no('Mossa non riconosciuta.');

  /* La pausa fra una parola e l'altra: passa solo «continua», e finche'
     dura non scorre niente. */
  if (mossa.tipo === 'continua') return giocaContinua(stato, adesso);
  if (stato.fase === 'intervallo') return no('Prima leggi com’è andata.');

  /* Il tempo del turno si segna qui, una volta per mossa: e' l'unico
     punto da cui passano tutte e tre, e contarlo piu' in la' vorrebbe
     dire contarlo due volte per i turni che chiudono una parola. */
  segnaTempo(stato, adesso);

  const fuoriTempo = adesso > stato.scadenza + stato.config.turno.tolleranzaMs;
  if (mossa.tipo === 'scaduto' || (fuoriTempo && mossa.tipo === 'tentativo')) {
    return giocaScaduto(stato, adesso);
  }
  if (mossa.tipo === 'passa') return giocaRinuncia(stato, adesso, 'passa');
  if (mossa.tipo === 'tentativo') return giocaTentativo(stato, mossa, adesso);
  return no('Mossa non riconosciuta.');
}

/**
 * Un tentativo.
 *
 * Basta che sia fatto di lettere e che sia lungo come la segreta. Non deve
 * essere una parola vera: chi prova AEIOU per vedere dove stanno le vocali
 * sta giocando, non barando, e un tentativo rifiutato mentre il tempo
 * scorre e' l'unico modo sicuro di far arrabbiare chi sta pensando.
 *
 * Quello che si chiede e' di non ripetersi: la stessa combinazione due
 * volte darebbe gli stessi colori, e sarebbe un tentativo buttato senza
 * accorgersene.
 */
function giocaTentativo(stato, mossa, adesso) {
  const chi = stato.giocatori[stato.diChi];
  if (chi.finito) return no('Hai già finito con questa parola.');

  const scritta = typeof mossa.parola === 'string' ? mossa.parola : '';
  const n = normalizza(scritta, stato.lingua);
  const lettere = inLettere(n, stato.lingua);
  const quante = stato.segreta.lettere.length;

  if (lettere.length !== quante) return no(`Servono ${quante} lettere.`);
  /* Lettere, e basta: qualunque combinazione va bene, anche una che non
     vuol dire niente. Il dizionario decide che cos'e' la parola segreta,
     non che cosa si puo' provare — chiedere che ogni tentativo sia una
     parola vera sposta il gioco dall'indovinare al ricordarsi, e chi ha in
     mente le lettere giuste in un ordine che non esiste ha comunque
     diritto di vederle colorate.
     Una lettera qualunque, non solo quelle del sacchetto di questa
     lingua: nell'alfabeto italiano di Lexora la K non c'e' perche' non
     esce mai in una parola segreta, ma chi scrive KIWI sta scrivendo
     lettere, e rifiutargliele mentre il tempo scorre e' il modo piu'
     sicuro di far arrabbiare qualcuno che sta pensando. Restano fuori i
     numeri e i segni, che lettere non sono. */
  const strane = lettere.filter((l) => !/^\p{L}+$/u.test(l));
  if (strane.length > 0) return no(`Solo lettere: ${strane.join(' ')} non ${strane.length === 1 ? 'è una lettera' : 'sono lettere'}.`);
  if (chi.righe.some((r) => r.normalizzata === n)) return no('L’hai già provata.');

  const esito = confronta(stato.segreta.lettere, lettere);
  const scheda = cerca(n, stato.linguaId);
  const riga = { parola: scheda?.word ?? n, normalizzata: n, lettere, esito };
  chi.righe.push(riga);
  chi.tentativiTotali += 1;

  const presa = tuttaVerde(esito);
  const esauriti = chi.righe.length >= stato.config.partita.tentativi;
  if (presa || esauriti) chiudiParolaPer(stato, chi, presa);

  const fuori = {
    ok: true,
    tipo: 'tentativo',
    parola: riga.parola,
    lettere,
    esito,
    tentativi: chi.righe.length,
    restano: Math.max(0, stato.config.partita.tentativi - chi.righe.length),
    indovinata: presa,
    finito: chi.finito,
    punti: chi.finito ? (chi.storia.at(-1)?.punti ?? 0) : 0,
    di: chi.userId,
    // La segreta si dice solo quando per chi gioca e' finita: prima
    // sarebbe la risposta stampata sotto la domanda.
    segreta: chi.finito ? stato.segreta.parola : null,
    scoperta: chi.finito && presa && (stato.segreta.scheda?.rarity ?? 0) >= stato.config.scoperta.rarita
      ? stato.segreta.scheda
      : null,
  };
  stato.registro.push({ turno: stato.turno, parola: stato.parola, di: chi.userId, tipo: 'tentativo', tentativo: riga.parola, indovinata: presa });
  chiudiTurno(stato, adesso);
  return fuori;
}

/** Chi rinuncia o lascia scadere il tempo perde la parola: nessun tentativo, nessun punto. */
function giocaRinuncia(stato, adesso, motivo) {
  const chi = stato.giocatori[stato.diChi];
  chiudiParolaPer(stato, chi, false);
  stato.registro.push({ turno: stato.turno, parola: stato.parola, di: chi.userId, tipo: motivo });
  const fuori = { ok: true, tipo: motivo, punti: chi.storia.at(-1)?.punti ?? 0, segreta: stato.segreta.parola, di: chi.userId };
  chiudiTurno(stato, adesso);
  return fuori;
}

/**
 * Il tempo scaduto e' una rinuncia al tentativo, non alla parola: si perde
 * il turno, non la partita. Con l'ultimo tentativo perso, pero', la parola
 * e' andata: non ne restano altri.
 */
function giocaScaduto(stato, adesso) {
  const chi = stato.giocatori[stato.diChi];
  chi.righe.push({ parola: null, normalizzata: null, lettere: [], esito: [], persa: true });
  const esauriti = chi.righe.length >= stato.config.partita.tentativi;
  if (esauriti) chiudiParolaPer(stato, chi, false);
  stato.registro.push({ turno: stato.turno, parola: stato.parola, di: chi.userId, tipo: 'scaduto' });
  const fuori = {
    ok: true,
    tipo: 'scaduto',
    restano: Math.max(0, stato.config.partita.tentativi - chi.righe.length),
    finito: chi.finito,
    di: chi.userId,
    segreta: chi.finito ? stato.segreta.parola : null,
  };
  chiudiTurno(stato, adesso);
  return fuori;
}

/** Una parola si chiude per un giocatore: si contano i punti e si scrive la riga di storia. */
function chiudiParolaPer(stato, chi, presa) {
  chi.finito = true;
  const usati = chi.righe.filter((r) => !r.persa).length;
  const verdiMigliori = chi.righe.reduce((m, r) => Math.max(m, quantiVerdi(r.esito || [])), 0);
  const conto = calcola({
    segreta: stato.segreta.scheda,
    tentativi: usati,
    indovinata: presa,
    verdiMigliori,
    /* Il premio del tempo vale solo dove il tempo e' la difficolta',
       cioe' nella prova: nella sfida i due giocano a ore diverse e
       premiare i secondi vorrebbe dire premiare chi era comodo. */
    secondiUsati: stato.modo === 'prova' ? stato.msParola / 1000 : null,
    config: stato.config,
  });
  chi.punti += conto.totale;
  if (presa) {
    chi.indovinate += 1;
    chi.minimoTentativi = chi.minimoTentativi === 0 ? usati : Math.min(chi.minimoTentativi, usati);
    if ((stato.segreta.scheda?.rarity ?? 0) >= stato.config.scoperta.rarita) chi.scoperte.push(stato.segreta.scheda);
  }
  chi.turniGiocati += 1;
  chi.storia.push({
    parola: stato.segreta.parola,
    indovinata: presa,
    tentativi: usati,
    punti: conto.totale,
    parti: conto.parti,
  });
}

/* ─── Quello che si vede ─── */

/**
 * La partita come la guarda chi gioca.
 *
 * Della parola segreta esce quante lettere ha e nient'altro, finche' per
 * chi guarda non e' finita. Dell'avversario si vedono i punti e a che
 * punto e' — quanti tentativi ha fatto e quante lettere ha in verde — ma
 * non le sue parole: sapere che ha provato CANE vorrebbe dire giocare con
 * il suo tabellone oltre che col proprio.
 */
export function fotografia(stato, adesso = Date.now(), perChi = null) {
  /* Nella prova il giocatore e' uno solo ed e' chi guarda: cercarlo per
     `userId` fallirebbe quando la partita e' stata aperta senza un
     account, e la pagina resterebbe senza tabellone. */
  const io = stato.modo === 'prova'
    ? stato.giocatori[0]
    : stato.giocatori.find((g) => g.userId === perChi) ?? null;
  const finitaPerMe = stato.fase === 'finita' || Boolean(io?.finito);
  return {
    fase: stato.fase,
    modo: stato.modo,
    livello: stato.livello,
    /* Quello che si legge nella pausa fra una parola e l'altra. Fuori
       dalla pausa e' `null`, quindi chi disegna non deve chiedersi in che
       fase si trova: se c'e' si mostra. */
    intervallo: stato.intervallo ?? null,
    lingua: stato.linguaId,
    turno: stato.turno,
    parola: stato.parola,
    paroleTotali: stato.config.partita.parole,
    tentativiMassimi: stato.config.partita.tentativi,
    lettere: stato.segreta ? stato.segreta.lettere.length : 0,
    // La soluzione: solo a parola chiusa per chi guarda.
    soluzione: finitaPerMe && stato.segreta ? stato.segreta.parola : null,
    diChi: stato.diChi,
    /* La scadenza vera, non i secondi che restano: chi disegna un timer
       deve poterlo far scorrere senza richiedere la fotografia dieci volte
       al secondo. I secondi restano perche' chi vuole solo leggerli non
       debba fare il conto. */
    scadenza: stato.scadenza,
    secondiRimasti: Math.max(0, Math.round((stato.scadenza - adesso) / 100) / 10),
    mie: io ? io.righe.map((r) => ({ parola: r.parola, lettere: r.lettere, esito: r.esito, persa: Boolean(r.persa) })) : [],
    tastiera: io ? letterePiuChiare(io.righe.filter((r) => !r.persa)) : {},
    giocatori: stato.giocatori.map((g) => ({
      userId: g.userId, nome: g.nome, bot: g.bot, punti: g.punti,
      tentativi: g.righe.length,
      finito: g.finito,
      indovinate: g.indovinate,
      // quanto e' vicino: le lettere verdi del suo tentativo migliore
      verdi: g.righe.reduce((m, r) => Math.max(m, quantiVerdi(r.esito || [])), 0),
    })),
    esito: stato.esito,
  };
}

/** Il riassunto di fine partita: quello che si salva e quello che si mostra. */
export function riassunto(stato) {
  return {
    versione: VERSIONE_MOTORE,
    lingua: stato.linguaId,
    seme: stato.seme,
    turni: stato.turno,
    parole: stato.parola,
    esito: stato.esito,
    giocatori: stato.giocatori.map((g) => ({
      userId: g.userId,
      nome: g.nome,
      bot: g.bot,
      punti: g.punti,
      indovinate: g.indovinate,
      tentativi: g.tentativiTotali,
      minimoTentativi: g.minimoTentativi,
      storia: g.storia,
      migliore: g.storia.filter((s) => s.indovinata).sort((a, b) => b.punti - a.punti)[0] ?? null,
      scoperte: g.scoperte.map((s) => s.word),
    })),
  };
}

/* ─── Salvare e riprendere ───
   Lo stato ha dentro il caso e la scheda della lingua, che non si scrivono
   nel deposito: si scrive quello che serve a rifarlo — il seme, quanti
   numeri il caso ha gia' dato — e riaprendo si rimette dov'era. */

export function serializza(stato) {
  return {
    versione: stato.versione,
    lingua: stato.linguaId,
    seme: stato.seme,
    passiCaso: stato.caso.passi ? stato.caso.passi() : null,
    modo: stato.modo,
    livello: stato.livello,
    giocatori: stato.giocatori,
    diChi: stato.diChi,
    turno: stato.turno,
    parola: stato.parola,
    /* Il cronometro della parola in corso e l'istante in cui e' partito il
       turno: senza, riaprire il tavolo azzererebbe il tempo speso e il
       premio della velocita' sarebbe un regalo a chi ricarica la pagina. */
    msParola: stato.msParola ?? 0,
    apertoIl: stato.apertoIl ?? 0,
    intervallo: stato.intervallo ?? null,
    // La segreta si salva senza la scheda: si ritrova dal dizionario.
    segreta: stato.segreta ? { parola: stato.segreta.parola, normalizzata: stato.segreta.normalizzata } : null,
    scadenza: stato.scadenza,
    fase: stato.fase,
    registro: stato.registro,
    esito: stato.esito,
  };
}

export function deserializza(riga, config = CONFIG) {
  const lingua = linguaById(riga.lingua);
  /* Una prova si riapre con la configurazione del suo livello: e' li' che
     stanno il tempo del turno e le parole ammesse. Le partite salvate
     prima che i livelli esistessero non hanno `modo`, e restano sfide. */
  const suo = riga.modo === 'prova' && riga.livello ? configDiLivello(riga.livello) : config;
  const caso = creaCaso(riga.seme);
  // Il caso si riporta dov'era bruciando i numeri gia' usati: e' l'unico
  // modo per riprendere una partita e vedere lo stesso futuro che avrebbe
  // avuto senza interruzioni.
  if (riga.passiCaso) for (let i = 0; i < riga.passiCaso; i += 1) caso.numero();
  const segreta = riga.segreta
    ? {
      parola: riga.segreta.parola,
      normalizzata: riga.segreta.normalizzata,
      lettere: inLettere(riga.segreta.normalizzata, lingua),
      scheda: cerca(riga.segreta.normalizzata, lingua.id),
    }
    : null;
  return {
    ...riga,
    lingua,
    linguaId: lingua.id,
    caso,
    config: suo,
    segreta,
    modo: riga.modo ?? 'sfida',
    livello: riga.livello ?? null,
    msParola: riga.msParola ?? 0,
    apertoIl: riga.apertoIl ?? 0,
    intervallo: riga.intervallo ?? null,
    versione: riga.versione ?? VERSIONE_MOTORE,
  };
}
