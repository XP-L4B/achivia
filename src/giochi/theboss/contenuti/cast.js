/**
 * Chi lavora alla Alambicco & Soci.
 *
 * Venti schede: sedici dipendenti e quattro assistant manager. Qui dentro
 * c'e' solo **chi sono** — nome, mestiere, che disegno li rappresenta, che
 * tratti hanno. Quanto costano, quanto rendono e quanto pesano sul morale
 * sono numeri, e i numeri stanno tutti in `bilancio.js`: una scheda che
 * portasse il proprio stipendio renderebbe impossibile ribilanciare il
 * gioco senza riscrivere il cast.
 *
 * I mestieri sono la battuta. Il troll di pietra imbottiglia ed e'
 * lentissimo, e in quattro anni non ha rotto una fiala. La melma fa il
 * controllo qualita': assaggia. La mano mozzata fa la segreteria, e
 * scrive benissimo. Non c'e' niente da spiegare al giocatore: si capisce
 * guardando chi entra dalla porta.
 *
 * I tratti vengono da una lista chiusa (`TRATTI`) perche' il motore ci
 * ragiona sopra: un tratto scritto a mano in una scheda sarebbe un tratto
 * che nessuna regola conosce, e non farebbe niente.
 *
 * Gli assistant manager sono un'altra cosa e hanno il loro `agenda`: la
 * cosa che spingono sempre, qualunque sia lo stato dell'azienda. Uno di
 * loro ha ragione piu' spesso degli altri, ma il gioco non dice mai chi.
 */

/** I tratti che il motore sa leggere. Aggiungerne uno vuol dire dargli una regola. */
export const TRATTI = [
  'opportunista',    // chiede sempre un po' piu' del necessario
  'onesto',          // quello che dice e' quello che e'
  'fragile',         // il rifiuto gli costa il doppio
  'ambizioso',       // se non sale, se ne va
  'sindacalizzato',  // quello che gli succede lo sanno tutti
  'pettegolo',       // porta in giro le decisioni degli altri
  'indispensabile',  // se se ne va, si ferma qualcosa
  'tossico',         // abbassa il morale di chi gli sta intorno
  'sottopagato',     // ha ragione, e lo sa
  'invisibile',      // nessuno se ne accorge finche' non se ne va
];

/** Le agende degli assistant manager: la cosa che spingono sempre. */
export const AGENDE = ['tagliare', 'investire', 'riorganizzare', 'esternalizzare'];

export const DIPENDENTI = [
  { id: 'brocca', nome: 'Grum', specie: 'Troll di pietra', ruolo: 'Imbottigliamento',
    sprite: 'brocca', tratti: ['indispensabile', 'invisibile'],
    nota: 'Lentissimo. In quattro anni non ha rotto una fiala.' },
  { id: 'conto', nome: 'Ossario', specie: 'Scheletro', ruolo: 'Contabilità',
    sprite: 'conto', tratti: ['onesto', 'pettegolo'],
    nota: 'Non dorme, e te lo fa pesare.' },
  { id: 'assaggio', nome: 'Blob', specie: 'Melma ocra', ruolo: 'Controllo qualità',
    sprite: 'assaggio', tratti: ['fragile', 'sottopagato'],
    nota: 'Il metodo è uno solo: assaggia.' },
  { id: 'ricerca', nome: 'Vez', specie: 'Goblin occultista', ruolo: 'Ricerca e sviluppo',
    sprite: 'ricerca', tratti: ['opportunista', 'ambizioso'],
    nota: 'Sette budget per la ricerca, sette casse di candele.' },
  { id: 'vendite', nome: 'Pilucco', specie: 'Bardo halfling', ruolo: 'Vendite',
    sprite: 'vendite', tratti: ['ambizioso', 'opportunista'],
    nota: 'Bravissimo. E lo sa.' },
  { id: 'magazzino', nome: 'Regina', specie: 'Scarabeo reale', ruolo: 'Magazzino',
    sprite: 'magazzino', tratti: ['sindacalizzato', 'onesto'],
    nota: 'Non parla mai da sola: parla per tutte.' },
  { id: 'orto', nome: 'Spora', specie: 'Miconide', ruolo: 'Coltivazione ingredienti',
    sprite: 'orto', tratti: ['sottopagato', 'invisibile'],
    nota: 'Coltiva sé stesso, il che complica il conto delle ferie.' },
  { id: 'consegne', nome: 'Notturno', specie: 'Pipistrello', ruolo: 'Consegne',
    sprite: 'consegne', tratti: ['invisibile', 'fragile'],
    nota: 'Consegna solo dopo il tramonto. È scritto nel contratto.' },
  { id: 'forgia', nome: 'Cinabro', specie: 'Diavoletto', ruolo: 'Forgia e incantesimi minori',
    sprite: 'forgia', tratti: ['tossico', 'indispensabile'],
    nota: 'Lavora benissimo. Con gli altri, meno.' },
  { id: 'erbe', nome: 'Miele', specie: 'Ranger halfling', ruolo: 'Approvvigionamento erbe',
    sprite: 'erbe', tratti: ['onesto', 'sottopagato'],
    nota: 'Cammina sei ore per una radice giusta.' },
  { id: 'guardia', nome: 'Sibilo', specie: 'Lucertoloide', ruolo: 'Sicurezza',
    sprite: 'guardia', tratti: ['fragile', 'onesto'],
    nota: 'Non è mai successo niente. Sostiene che sia merito suo.' },
  { id: 'etichette', nome: 'Occhio', specie: 'Occhio spettrale', ruolo: 'Etichette e conformità',
    sprite: 'etichette', tratti: ['pettegolo', 'indispensabile'],
    nota: 'Legge tutto. Proprio tutto.' },
  { id: 'manutenzione', nome: 'Grimlo', specie: 'Grimlock', ruolo: 'Manutenzione',
    sprite: 'manutenzione', tratti: ['invisibile', 'sottopagato'],
    nota: 'Aggiusta al buio, che per lui è uguale.' },
  { id: 'collaudo', nome: 'Zanna', specie: 'Segugio tossico', ruolo: 'Collaudo',
    sprite: 'collaudo', tratti: ['tossico', 'fragile'],
    nota: 'Prova i veleni. È ancora qui, quindi funziona.' },
  { id: 'segreteria', nome: 'Mano', specie: 'Mano errante', ruolo: 'Segreteria',
    sprite: 'segreteria', tratti: ['indispensabile', 'pettegolo'],
    nota: 'Calligrafia impeccabile. Nessuno le ha mai chiesto di più.' },
  { id: 'carico', nome: 'Ors', specie: 'Ogre', ruolo: 'Carico e scarico',
    sprite: 'carico', tratti: ['sindacalizzato', 'ambizioso'],
    nota: 'Solleva tutto. Vuole che si sappia.' },
];

export const MANAGER = [
  { id: 'am-strategia', nome: 'Corvo', specie: 'Blackguard', ruolo: 'Strategia',
    sprite: 'am-strategia', agenda: 'tagliare',
    nota: 'Parla di numeri con la sicurezza di chi non li ha controllati.' },
  { id: 'am-produzione', nome: 'Monocolo', specie: 'Ciclope', ruolo: 'Produzione',
    sprite: 'am-produzione', agenda: 'riorganizzare',
    nota: 'Le sue previsioni sono ottime. Le sue consuntive un po' + "'" + ' meno.' },
  { id: 'am-efficienza', nome: 'Ago', specie: 'Halfling', ruolo: 'Efficienza operativa',
    sprite: 'am-efficienza', agenda: 'esternalizzare',
    nota: 'Ha sempre un fornitore che costa meno. È sempre lo stesso fornitore.' },
  { id: 'am-innovazione', nome: 'Ghigno', specie: 'Gremlin', ruolo: 'Innovazione',
    sprite: 'am-innovazione', agenda: 'investire',
    nota: 'Una volta ha avuto ragione, e da allora lo ricorda a tutti.' },
];

export const TUTTI = [...DIPENDENTI, ...MANAGER];
export const personaById = (id) => TUTTI.find((p) => p.id === id) || null;
