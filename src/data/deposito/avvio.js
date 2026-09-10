/**
 * Quello che succede una volta sola, all'avvio.
 *
 * Sta in un modulo suo e non nel nucleo perche' si appoggia ai domini —
 * gli abbonamenti, l'elenco di chi si fa trovare — e il nucleo non li
 * conosce: e' il contrario, sono loro a conoscere lui. Questo file e'
 * l'unico posto in cui il verso si inverte, ed e' anche l'ultimo a essere
 * caricato.
 */

import { db, ensureArticoli, ensureCategorie, ensureListino, ensureMembri, ensureOrganizzazioni, nuovoId } from './nucleo';
import { ARTICOLI_NEGOZIO, ARTICOLI_SUPERATI, CATALOGO_CONSEGNATO, CATEGORIE_NEGOZIO } from './catalogoNegozio';
import { inAzienda, ricostruisciAbbonamenti, sospendiTrovabilita } from './lavoro';
import { PACCHETTI_DI_PARTENZA, PIANI_DI_PARTENZA } from './listino';

/**
 * Quello che il deposito deve avere e che i dati di partenza non portano.
 *
 * Due cose, e tutte e due servono a rispondere a una domanda sola: questo
 * risultato, dove e quando e' stato ottenuto? Un profilo che cambia
 * azienda riparte da zero, ma quello che ha fatto prima non sparisce — e
 * per sapere che cosa tenere bisogna sapere di chi era.
 */
export function avvia() {
  /* Il tipo di organizzazione si chiamava "privata" e adesso si chiama
     "personalizzata". Il nome nuovo non e' un'etichetta appiccicata sopra:
     e' il valore che sta scritto sul proprietario, e da cui dipende tutto
     quello che quel tipo di organizzazione fa e non fa. Chi ha dei dati
     salvati da prima li porta dietro qui, una volta sola, invece di
     ritrovarsi l'organizzazione trattata come un'azienda. */
  for (const u of db.users) {
    if (u.orgTipo === 'privata') u.orgTipo = 'personalizzata';
  }

  /* L'account di prova che non sta da nessuna parte. Serve a provare la
     creazione di un'organizzazione partendo da zero, che e' l'unica cosa
     che nessun altro account del seed permette di fare: gli altri
     un'organizzazione ce l'hanno gia'.
     Si aggiunge qui e non solo nel seed perche' chi ha gia' dei dati
     salvati non li ricarica: senza questa riga l'account comparirebbe solo
     a chi azzera tutto. */
  if (!db.users.some((u) => u.email === 'prova@achivia.test')) {
    db.users.push({
      id: 'u-prova',
      achiviaId: '10000099',
      role: 'employee',
      name: 'Prova Libera',
      email: 'prova@achivia.test',
      password: 'prova',
      orgId: null,
      level: 1,
      xp: 0,
      credits: 0,
      departmentIds: [],
    });
  }

  /* L'accesso al Castello.
     Come il negozio e l'osservatorio, si consegna a mano e non si crea
     dall'applicazione. Sta qui e non solo nei dati di partenza perche' chi
     ha gia' un deposito salvato non lo ricarica: senza questa riga
     l'account comparirebbe solo a chi azzera tutto. */
  if (!db.users.some((u) => u.role === 'castle')) {
    db.users.push({
      id: 'u-castle',
      achiviaId: '10000902',
      role: 'castle',
      name: 'Il Castello',
      email: 'castle@achivia.test',
      password: 'castle',
      orgId: null,
      departmentIds: [],
    });
  }

  /* Da un campo sulla persona a due registri.
     Un'organizzazione viveva sui campi del suo proprietario e
     l'appartenenza era un campo sull'utente. Adesso le organizzazioni
     hanno un registro e chi ci sta dentro ha una riga per ognuna, perche'
     una persona puo' stare in piu' posti e possederne piu' d'uno.
     Chi ha dei dati salvati li porta di la' qui, una volta sola: senza,
     all'aggiornamento si troverebbe fuori da tutto — nessuna appartenenza,
     quindi nessun canale da aprire. Si riconosce da fare perche' la riga
     dell'organizzazione non ha ancora un nome. */
  ensureOrganizzazioni();
  ensureMembri();
  for (const u of db.users) {
    if (!u.orgId) continue;
    const riga = db.organizzazioni[u.orgId] || {};
    if (riga.nome === undefined) {
      /* Il nome e il codice stavano scritti sul proprietario, e solo su di
         lui: gli altri li avevano vuoti. Prendere il primo valore che si
         trova fra chi sta li' dentro e' l'unico modo di non perderli. */
      const capo = db.users.find((x) => x.orgId === u.orgId && (x.orgOwner || x.role === 'admin'));
      db.organizzazioni[u.orgId] = {
        ...riga,
        nome: capo?.org || riga.nome || '',
        codice: capo?.orgCode || riga.codice || '',
        tipo: capo?.orgTipo === 'personalizzata' ? 'personalizzata' : 'azienda',
        premium: Boolean(capo?.premium),
        creataIl: capo?.orgCreatedAt || riga.creataIl || null,
        proprietarioId: capo?.id || null,
      };
    }
    if (!db.membri.some((m) => m.userId === u.id && m.orgId === u.orgId)) {
      db.membri.push({
        id: nuovoId('mem'),
        userId: u.id,
        orgId: u.orgId,
        role: u.role,
        roleId: u.roleId ?? null,
        departmentIds: u.departmentIds ?? [],
        managerId: u.managerId ?? null,
        proprietario: Boolean(u.orgOwner),
        /* La data d'ingresso vera sta nel registro dei movimenti, e per chi
           l'ha e' quella giusta: e' da li' che si conta da quanto uno sta
           in un posto. Chi non ce l'ha nasce con la data dell'
           organizzazione, non con quella di oggi, che direbbe che sono
           tutti entrati il giorno dell'aggiornamento. */
        entratoIl: (db.carriera || [])
          .filter((e) => e.userId === u.id && e.orgId === u.orgId && e.tipo === 'ingresso')
          .map((e) => e.il).sort()[0]
          || db.organizzazioni[u.orgId]?.creataIl
          || new Date().toISOString(),
        uscitoIl: null,
      });
    }
  }

  /* Adesso che il registro c'e', i campi vecchi sulle persone si tolgono.
     Non e' pulizia: e' che due copie della stessa verita' prima o poi
     divergono, e la copia sbagliata e' quella che qualcuno legge. Un
     account che possiede due organizzazioni ha un `premium` solo, e quel
     campo non sa a quale delle due si riferisce — che e' il motivo per cui
     tutto questo e' stato spostato.
     `orgOwner` resta: quello non descrive un'organizzazione, descrive il
     canale che la persona ha aperto adesso, ed e' la proiezione. */
  for (const u of db.users) {
    delete u.org;
    delete u.orgCode;
    delete u.orgTipo;
    delete u.premium;
    delete u.orgCreatedAt;
  }

  /* Le insegne delle organizzazioni di prova.
     Nessuna ne aveva una, quindi ovunque si mostri l'insegna — la barra in
     alto, la classifica, l'elenco dei propri canali — restava un buco.
     Sono ricette di quattro parole, non immagini: pesano niente e si
     ridisegnano nitide a qualunque misura. Si scrivono una volta sola e
     non si toccano piu': chi ne cambia una se la tiene. */
  const INSEGNE = {
    'org-achivia': { forma: 'scudo', sfondo: 'notte', accento: 'oro', simbolo: 'stella' },
    'org-radice': { forma: 'esagono', sfondo: 'bosco', accento: 'smeraldo', simbolo: 'foglia' },
    'org-nordvento': { forma: 'scudo', sfondo: 'indaco', accento: 'ghiaccio', simbolo: 'fulmine' },
    'org-delta': { forma: 'cerchio', sfondo: 'ardesia', accento: 'argento', simbolo: 'ancora' },
    'org-merlino': { forma: 'rombo', sfondo: 'inchiostro', accento: 'porpora', simbolo: 'occhio' },
    'org-vespri': { forma: 'cerchio', sfondo: 'vino', accento: 'rame', simbolo: 'corona' },
    'org-baroni': { forma: 'scudo', sfondo: 'pietra', accento: 'argento', simbolo: 'spada' },
    'org-corvino': { forma: 'esagono', sfondo: 'ruggine', accento: 'rame', simbolo: 'martello' },
    'org-ferrovia': { forma: 'rombo', sfondo: 'ardesia', accento: 'oro', simbolo: 'torre' },
  };
  for (const [orgId, stemma] of Object.entries(INSEGNE)) {
    const riga = db.organizzazioni[orgId];
    if (riga && !riga.logo && riga.stemma === undefined) riga.stemma = stemma;
  }

  /* Un account che sta in due posti, per poter vedere che cosa vuol dire.
     Alice e' una dipendente dell'azienda del seed e, la sera, amministra
     il Clan Baroni: stesso account, due canali, due ruoli diversi. Senza
     un caso cosi' l'elenco delle organizzazioni mostrerebbe sempre una
     riga sola, e non si capirebbe a che cosa serve.
     Si aggiunge qui e non nel seed perche' il gruppo nasce nei dati di
     prova, che il seed non conosce. */
  const clan = 'org-baroni';
  const alice = db.users.find((u) => u.email === 'alice@achivia.test');
  if (alice && db.organizzazioni[clan] && !db.membri.some((m) => m.userId === alice.id && m.orgId === clan)) {
    db.membri.push({
      id: nuovoId('mem'),
      userId: alice.id,
      orgId: clan,
      role: 'admin',
      roleId: null,
      departmentIds: [],
      managerId: null,
      proprietario: false,
      entratoIl: db.organizzazioni[clan].creataIl || new Date().toISOString(),
      uscitoIl: null,
    });
  }

  /* La data di nascita degli account.
     Non e' mai stata scritta: un utente aveva un id, un nome e un
     'organizzazione, e quando fosse arrivato non lo diceva niente. Da adesso
     la scrive `addUser`, ma i conti su chi c'e' gia' resterebbero senza
     fondo, e chi c'e' gia' e' quasi tutto.
     Si ricostruisce dalla traccia piu' vicina che esista: il primo ingresso
     segnato nella carriera; in mancanza, il giorno in cui e' nata
     l'organizzazione in cui sta. Sono stime, e si dichiarano tali con
     `dataStimata`: un conto degli account nuovi di questa settimana deve
     poterle lasciare fuori invece di contarle come se fossero nate oggi. */
  const primoIngresso = new Map();
  for (const c of db.carriera || []) {
    if (c.tipo !== 'ingresso' || !c.userId || !c.il) continue;
    const gia = primoIngresso.get(c.userId);
    if (!gia || c.il < gia) primoIngresso.set(c.userId, c.il);
  }
  for (const u of db.users) {
    if (u.creatoIl) continue;
    const daCarriera = primoIngresso.get(u.id);
    const daOrg = u.orgId ? db.organizzazioni[u.orgId]?.creataIl : null;
    u.creatoIl = daCarriera || daOrg || new Date().toISOString();
    u.dataStimata = true;
  }

  /* Il listino nasce con i due piani che c'erano gia', scritti come piani.
     Non e' un cambio di prodotto: sono gli stessi limiti di prima — cinque
     posti e un annuncio senza abbonamento, posti illimitati e cinque
     annunci con — presi dal codice e messi dove si possono cambiare senza
     ripubblicare l'applicazione. Da qui in avanti il prezzo del premium e
     i suoi limiti si decidono guardandoli, non ricompilandoli. */
  ensureListino();
  /* I due piani di prima — Free e Premium — erano un interruttore travestito
     da listino: o cinque posti o infiniti, e in mezzo niente. I quattro di
     adesso hanno nomi, prezzi e gradini, e non c'e' un modo sensato di
     tradurre l'uno negli altri: si riscrive il listino. Quello che si
     conserva e' dove sta ognuno — vedi qui sotto — che e' la sola cosa che
     riguarda un cliente. */
  const daRifare = db.piani.some((p) => p.id === 'piano-free' || p.id === 'piano-premium')
    // I quattro piani dei gruppi sono arrivati dopo: un listino che ha solo
    // quelli delle aziende e' un listino di ieri, e si riscrive.
    || !db.piani.some((p) => p.perTipo === 'personalizzata');
  if (!db.piani.length || daRifare) {
    db.piani = PIANI_DI_PARTENZA.map((p) => ({
      ...p, limiti: { ...p.limiti }, creatoIl: new Date().toISOString(),
    }));
  }

  /* I sei pacchetti di crediti. Come per i piani: nascono qui perche' si
     possano cambiare da fuori, e non perche' siano scolpiti. */
  if (!db.pacchetti.length) {
    db.pacchetti = PACCHETTI_DI_PARTENZA.map((p) => ({ ...p, creatoIl: new Date().toISOString() }));
  }

  /* Ogni organizzazione dice a quale piano sta. Prima lo diceva un si'/no —
     `premium` — che non sapeva distinguere fra quindici euro e cento. Chi
     pagava finisce sul piu' alto e non sul piu' basso: togliere posti a
     un'azienda che sta pagando sarebbe il modo peggiore di sbagliare, e
     spostarla in giu' e' una decisione da prendere guardandola, non da fare
     di nascosto all'avvio. */
  for (const o of Object.values(db.organizzazioni || {})) {
    if (o.pianoId && db.piani.some((p) => p.id === o.pianoId)) continue;
    const gruppo = o.tipo === 'personalizzata';
    o.pianoId = o.premium
      ? (gruppo ? 'gruppo-diamond' : 'piano-diamond')
      : (gruppo ? 'gruppo-standard' : 'piano-standard');
  }

  /* Il catalogo del negozio, a chi aveva gia' dei dati salvati.
     Il negozio e' uno solo per tutta l'app e arriva con l'app: chi ha
     usato Achivia prima di questa consegna si ritroverebbe per sempre i
     tre articoli segnaposto con cui era nata, perche' il seed lo legge
     solo un deposito che nasce adesso. Quindi il catalogo arriva anche
     qui, una volta sola, e la volta si riconosce dal nome della consegna
     (`CATALOGO_CONSEGNATO`).

     Quello che il negozio ha fatto non si tocca: si aggiungono soltanto
     gli articoli e le categorie che mancano, e si tolgono i tre
     segnaposto. Un articolo che il negozio ha cancellato apposta non
     torna, perche' la consegna e' gia' segnata; uno che ha modificato
     resta com'e' lui l'ha lasciato. */
  if (db.catalogoConsegnato !== CATALOGO_CONSEGNATO) {
    ensureArticoli();
    ensureCategorie();
    db.articoli = db.articoli.filter((a) => !ARTICOLI_SUPERATI.includes(a.id));
    for (const c of CATEGORIE_NEGOZIO) {
      if (!db.categorie.some((x) => x.id === c.id)) db.categorie.push({ ...c });
    }
    for (const a of ARTICOLI_NEGOZIO) {
      if (!db.articoli.some((x) => x.id === a.id)) db.articoli.push({ ...a });
    }
    db.catalogoConsegnato = CATALOGO_CONSEGNATO;
  }

  ricostruisciAbbonamenti();
  // Un risultato senza organizzazione e' di quella in cui la persona sta
  // adesso: e' l'unica risposta possibile per dati nati prima che la
  // domanda esistesse, e da qui in avanti la scrive chi li crea.
  const orgDi = new Map(db.users.map((u) => [u.id, u.orgId ?? null]));
  for (const c of db.certifications || []) {
    if (c.orgId === undefined) c.orgId = orgDi.get(c.employeeId) ?? null;
  }
  for (const i of db.achievementInstances || []) {
    if (i.orgId === undefined) i.orgId = orgDi.get(i.userId) ?? null;
  }

  /* Chi in questo momento sta dentro un'organizzazione e risulta ancora in
     elenco esce adesso. E' il vecchio consenso, dato quando la regola non
     c'era: allora accendere l'interruttore da dentro era permesso e non
     faceva niente, e quelle spunte sono rimaste li' ad aspettare il giorno
     in cui la persona avrebbe lasciato l'azienda. Toglierle e' l'unico modo
     di non ritrovarsi in vetrina per una decisione presa in un'altra
     situazione e mai piu' riletta. Non si cancella nulla: la lettera, le
     zone e le lingue restano, e bastano a rimettersi in elenco in un clic
     il giorno in cui si sara' liberi di farlo. */
  for (const u of db.users) {
    if (u.trovabilita?.attiva && inAzienda(u.id)) sospendiTrovabilita(u);
  }
}
