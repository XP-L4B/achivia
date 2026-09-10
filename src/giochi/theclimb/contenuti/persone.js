/**
 * Le persone: gli archetipi, i nomi, e le schede «Nella vita reale».
 *
 * Il gioco genera persone con nome, ruolo e memoria. Quello che fanno ogni
 * settimana e quanto pesano sta in `bilancio.js` (`PERSONE`) e nel motore
 * (`motore/persone.js`); qui c'e' chi sono, che cosa si puo' fare con
 * loro, e le due righe che lo spiegano a chi le incontra.
 *
 *   svelato   se l'archetipo si vede subito: il capo tossico si capisce
 *             in un mese, il manipolatore no — serve intelligenza politica
 *   azioni    le mosse possibili con questa persona; quando sono
 *             disponibili lo decide il motore, che le spiega una per una
 */
export const ARCHETIPI = [
  {
    id: 'mentore', nome: 'Il mentore', svelato: true,
    spiega: 'Ti insegna davvero, gratis. Investire tempo in questa relazione rende moltissimo, ma piano: le competenze trasversali crescono soprattutto così, stando vicino a chi le ha.',
    azioni: ['consiglio'],
  },
  {
    id: 'sponsor', nome: 'Lo sponsor', svelato: true,
    spiega: 'Diverso dal mentore: è chi fa il tuo nome nelle stanze dove tu non sei. Da metà scala in su, senza, non si sale — per quanto tu sia bravo. La fiducia si costruisce facendosi vedere, e mantenendo quello che si promette.',
    azioni: ['proponi'],
  },
  {
    id: 'tossico', nome: 'Il capo tossico', svelato: false,
    spiega: 'Ti carica di lavoro, si prende i meriti, ti sminuisce davanti agli altri. Le opzioni sono vere e costano tutte: subire, documentare, andare da HR (che tutela l’azienda, non necessariamente te), cercare qualcuno più in alto, andartene.',
    azioni: ['documenta', 'hr', 'appello', 'vattene'],
  },
  {
    id: 'manipolatore', nome: 'Il collega manipolatore', svelato: false,
    spiega: 'Sembra un amico. Ti ruba le idee e sparge voci. Se non lo riconosci in tempo — serve intelligenza politica — ti danneggia per mesi senza che tu capisca da dove arrivano i colpi.',
    azioni: ['confronta', 'evita', 'hr'],
  },
  {
    id: 'alleato', nome: 'L’alleato', svelato: true,
    spiega: 'Cresce con te. Se lo aiuti quando è in basso, ti aiuta quando è in alto — anche fra molti anni, anche da un’altra azienda. È la ricompensa più lenta del gioco, e la più sicura.',
    azioni: ['aiuta', 'chiedi'],
  },
  {
    id: 'hr', nome: 'HR', svelato: true,
    spiega: 'L’ufficio del personale tutela l’azienda. A volte questo coincide con tutelare te, a volte no. Non è il cattivo: è una funzione, e conviene sapere di chi.',
    azioni: [],
  },
  {
    id: 'capo', nome: 'Il capo', svelato: true,
    spiega: 'Un capo normale: né una risorsa né un problema. Il lavoro lo giudica lui, e la visibilità passa da lui.',
    azioni: ['proponi'],
  },
  {
    id: 'capo_eccellente', nome: 'Il capo eccellente', svelato: true,
    spiega: 'Esiste. Sotto un buon manager si cresce quasi il doppio, la visibilità arriva da sola e gli errori diventano lezioni invece che colpe. Quando ne trovi uno, ricordati com’era.',
    azioni: ['proponi', 'consiglio'],
  },
];

export const archetipoById = (id) => ARCHETIPI.find((a) => a.id === id) || null;

/** Le mosse, come si leggono. Il costo e la probabilita' li dice il motore. */
export const AZIONI = {
  consiglio: { nome: 'Chiedi consiglio', spiega: 'Un’ora del suo tempo. Le competenze trasversali crescono, e la fiducia con loro.' },
  proponi: { nome: 'Proponi un progetto', spiega: 'Ti esponi. Se la performance regge, la visibilità sale e la fiducia anche; se no, ti sei fatto notare per la ragione sbagliata.' },
  documenta: { nome: 'Documenta tutto', spiega: 'Date, mail, testimoni. Costa un po’ di stress ogni settimana, e rende forte tutto quello che viene dopo.' },
  hr: { nome: 'Vai da HR', spiega: 'Un tiro. Con un dossier e in un’azienda sana può funzionare; senza, HR protegge l’azienda e tu resti con la reputazione di chi si lamenta.' },
  appello: { nome: 'Chiedi aiuto a chi sta più in alto', spiega: 'Serve uno sponsor con più potere del capo. Se c’è, di solito funziona; se non funziona, hai speso fiducia.' },
  vattene: { nome: 'Vattene', spiega: 'Lasci il posto. Senza stipendio, ma con la testa intera.' },
  confronta: { nome: 'Affrontalo', spiega: 'Un tiro: serve intelligenza politica e comunicazione. Se va, smette; se no, la voce che sparge è che sei tu il problema.' },
  evita: { nome: 'Tienilo a distanza', spiega: 'Niente più idee condivise, niente più confidenze. Il danno si dimezza, per sempre.' },
  aiuta: { nome: 'Aiutalo', spiega: 'Un po’ di stress in più questa settimana, e una persona che se lo ricorda.' },
  chiedi: { nome: 'Chiedigli una mano', spiega: 'Quando la fiducia c’è: ti copre, ti passa un’informazione, ti fa il nome.' },
  ruba_merito: { nome: 'Prenditi il merito', spiega: 'Il lavoro era suo, il nome sul risultato è il tuo. Performance e visibilità subito; l’integrità scende, il sospetto sale, e lui se lo ricorda.' },
  scarica_colpa: { nome: 'Scarica la colpa', spiega: 'L’errore era tuo, la colpa è sua. Meno stress adesso; una persona che ti aspetta al varco.' },
};

/** I nomi: si pescano dal seme, cosi' due partite con lo stesso seme incontrano le stesse persone. */
export const NOMI = [
  'Marta Fenoglio', 'Elena Prati', 'Riccardo Sanna', 'Davide Ruggeri', 'Giulia Morandi', 'Luca Bertolini',
  'Sara Colombo', 'Andrea Ferraro', 'Chiara Vitale', 'Matteo Greco', 'Francesca Rizzo', 'Alessandro Conti',
  'Valentina Marino', 'Simone Galli', 'Silvia Fontana', 'Federico Caruso', 'Laura Santoro', 'Marco De Luca',
  'Alice Ferri', 'Giorgio Mancini', 'Beatrice Costa', 'Tommaso Longo', 'Irene Barbieri', 'Nicola Gentile',
  'Paola Leone', 'Stefano Martini', 'Camilla Serra', 'Daniele Lombardi', 'Roberta Testa', 'Emanuele Villa',
  'Anna Moretti', 'Lorenzo Bianco', 'Elisa Pellegrini', 'Fabio Orlando', 'Claudia Neri', 'Michele Sala',
  'Noemi Battaglia', 'Pietro Farina', 'Serena Basile', 'Giacomo Riva',
];
