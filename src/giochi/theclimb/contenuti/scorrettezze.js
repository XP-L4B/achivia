/**
 * Le scorrettezze: quello che si puo' fare di sbagliato, e che funziona.
 *
 * Il gioco lo permette, e deve funzionare all'inizio: ogni scorrettezza
 * da' un vantaggio subito — performance, visibilita', soldi — abbassa
 * l'integrita' (che si vede) e alza il sospetto (che non si vede). Le
 * conseguenze arrivano dopo, e arrivano con sospetto × visibilita': chi
 * bara e resta piccolo la passa liscia, chi bara e diventa VP viene
 * scoperto. I numeri di quando esplode stanno in `bilancio.js`
 * (`ETICA`); qui c'e' che cosa si fa e che cosa rende.
 *
 *   quando     le condizioni, nel vocabolario degli eventi
 *   effetti    il vantaggio subito, in gradini (i soldi in euro)
 *   integrita  quanto scende
 *   sospetto   quanto sale
 *   ogni       non si ripete prima di tante settimane
 *   spiega     due righe «nella vita reale»
 *
 * Due scorrettezze — rubare il merito, scaricare la colpa — stanno con le
 * persone (`persone.js`), perche' hanno un bersaglio con la memoria.
 */
export const SCORRETTEZZE = [
  {
    id: 'gonfia_cv', nome: 'Gonfia il curriculum',
    testo: 'Un titolo che non hai finito, un ruolo un po’ più alto di quello che era.',
    quando: {}, effetti: { ricerca: +2, reputazione: +2 }, integrita: 5, sospetto: 8, ogni: 26,
    spiega: 'Funziona spesso. Ma il curriculum resta scritto, e chi lo legge dopo — un capo, un giornalista, HR di ACHIVIA — lo legge tutto.',
  },
  {
    id: 'voci_rivale', nome: 'Spargi una voce su un rivale',
    testo: 'Niente di falso, solo detto nel modo giusto alla persona giusta.',
    quando: { lavoro: 'vero' }, effetti: { visibilita: +4, performance: +2, posti: +0.35 }, integrita: 6, sospetto: 10, ogni: 13,
    spiega: 'Le voci tornano indietro, e chi le sparge diventa quello che sparge voci. Ci vuole poco a passare da furbo a inaffidabile.',
  },
  {
    id: 'favori', nome: 'Un favore sotto banco',
    testo: 'Un fornitore amico, un appalto che va dove deve andare, e un regalo che arriva.',
    quando: { lavoro: 'vero', livelloMin: 2 }, effetti: { soldi: +3000, rete: +3, visibilita: +2 }, integrita: 8, sospetto: 14, ogni: 26,
    spiega: 'È il modo più veloce di fare soldi in un ruolo con potere, e il modo più veloce di finire in un fascicolo.',
  },
  {
    id: 'spremi', nome: 'Spremi chi sta sotto di te',
    testo: 'Straordinari non pagati, ferie negate, pressione. I numeri salgono.',
    quando: { lavoro: 'vero', livelloMin: 3 }, effetti: { performance: +6, visibilita: +4, stress: -2, posti: +0.2 }, integrita: 7, sospetto: 9, ogni: 13,
    spiega: 'Un team spremuto rende per un trimestre e poi si rompe. E si ricorda: le persone sotto di te un giorno sono altrove, con potere.',
  },
  {
    id: 'licenzia_per_proteggerti', nome: 'Licenzia per proteggerti',
    testo: 'Qualcuno sapeva del tuo errore. Adesso non lavora più qui.',
    quando: { lavoro: 'vero', livelloMin: 4 }, effetti: { performance: +3, stress: -4, posti: +0.4 }, integrita: 12, sospetto: 18, ogni: 26,
    spiega: 'Chi viene licenziato per coprire un errore altrui lo racconta. A tutti. Per anni.',
  },
  {
    id: 'menti_clienti', nome: 'Menti a un cliente',
    testo: 'Quella cosa che non è pronta, è pronta. Quel difetto, non esiste.',
    quando: { lavoro: 'vero', livelloMin: 1 }, effetti: { performance: +6, visibilita: +3 }, integrita: 6, sospetto: 12, ogni: 13,
    spiega: 'La vendita si chiude oggi. Il cliente scopre domani, e da domani racconta la sua versione.',
  },
  {
    id: 'taglia_sicurezza', nome: 'Taglia sulla sicurezza',
    testo: 'Quel controllo costa tre settimane. Nessuno se ne accorge, se va tutto bene.',
    quando: { lavoro: 'vero', livelloMin: 4 }, effetti: { performance: +6, visibilita: +4 }, integrita: 14, sospetto: 22, ogni: 26,
    spiega: 'Finché va tutto bene, è un risparmio. Quando non va, è un processo — e un nome.',
  },
];

export const scorrettezzaById = (id) => SCORRETTEZZE.find((s) => s.id === id) || null;

/** La riparazione: lunga, costosa, e possibile. */
export const RIPARAZIONE = {
  id: 'confessa', nome: 'Ammetti quello che hai fatto',
  testo: 'A chi di dovere, prima che lo scoprano. Costa reputazione adesso; il sospetto cala, e l’integrità comincia a risalire.',
  spiega: 'Nella vita reale chi ammette prima di essere scoperto paga meno di chi viene scoperto. Non è gratis: è la strada lunga.',
};
