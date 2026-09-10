/**
 * Le aziende. Tutte inventate.
 *
 * Quattro **lavori che si trovano subito**, dieci **aziende strutturate** e in cima
 * ACHIVIA SPA. I numeri stanno in `bilancio.js` (`SOPRAVVIVENZA`,
 * `AZIENDA`); qui c'e' chi sono, che cosa insegnano stando li' — le
 * competenze che crescono per il solo fatto di lavorarci — e **che cosa
 * dicono di se' al colloquio**.
 *
 * `dice` e' la bugia: gli attributi che l'azienda dichiara e che non sono
 * quelli veri. Il giocatore vede quelli finche' non ci lavora dentro da
 * abbastanza settimane (`COLLOQUIO.scoperta`); poi vede la verita', e la
 * scheda mostra tutte e due le colonne. Nella realta' i colloqui mentono,
 * e il gioco deve farlo scoprire, non dirlo.
 *
 *   tipo      sopravvivenza | vera | meta
 *   insegna   gradini per unita' di lavoro sulle competenze
 */
export const AZIENDE = [
  /* ─── I lavori che si trovano subito: senza colloquio, e con un mestiere dentro ─── */
  {
    id: 'bar', nome: 'Caffè Duemari', tipo: 'sopravvivenza',
    racconto: 'Un bar. Turni, mance, gente: si impara a stare con le persone.',
    insegna: { comunicazione: +1, resilienza: +1 },
  },
  {
    id: 'magazzino', nome: 'LogiPack Srl', tipo: 'sopravvivenza',
    racconto: 'Un magazzino. Pesante, e si vede il lavoro fatto: squadra e organizzazione.',
    insegna: { lavoro_di_squadra: +1, gestione_progetti: +1 },
  },
  {
    id: 'callcenter', nome: 'PhoneVerse', tipo: 'sopravvivenza',
    racconto: 'Un call center. Paga poco e i turni sono duri, ma dopo un anno lì sai parlare con tutti — e sai tenere.',
    insegna: { comunicazione: +2, resilienza: +2, vendita: +1 },
  },
  {
    id: 'negozio', nome: 'Nova Retail', tipo: 'sopravvivenza',
    racconto: 'Un negozio. Clienti, scaffali, sabati: si impara a vendere e ad ascoltare.',
    insegna: { vendita: +1, comunicazione: +1 },
  },

  /* ─── Le aziende: posti con una carriera a gradini ─── */
  {
    id: 'pixelia', nome: 'Pixelia Studio', tipo: 'vera',
    racconto: 'Un piccolo studio creativo. Paga poco, ma la cultura è buona e la creatività alle stelle.',
    insegna: { creativita: +2, tecnologia: +1, lavoro_di_squadra: +1, comunicazione: +1 },
    dice: {},
  },
  {
    id: 'bytefarm', nome: 'ByteFarm', tipo: 'vera',
    racconto: 'Una startup caotica. Impari tantissimo, o ti bruci. Al colloquio dicono che «la fase difficile è passata».',
    insegna: { tecnologia: +2, analisi_dati: +1, gestione_progetti: +1, resilienza: +1, pensiero_critico: +1 },
    dice: { stabilita: 6, equilibrio: 5 },
  },
  {
    id: 'cartesio', nome: 'Cartesio Srl', tipo: 'vera',
    racconto: 'Una piccola azienda di famiglia. Tranquilla, gentile, ferma. Non si cresce.',
    insegna: { settore: +1, diritto: +1, empatia: +1 },
    dice: {},
  },

  /* ─── Il salto ─── */
  {
    id: 'meridian', nome: 'Meridian Consulting', tipo: 'vera',
    racconto: 'Prestigio altissimo: apre tutte le porte. Settanta ore a settimana. «Ci resisti due anni e poi vai dove vuoi.»',
    insegna: { analisi_dati: +2, gestione_progetti: +2, comunicazione: +1, negoziazione: +1, resilienza: +1 },
    dice: { equilibrio: 5, cultura: 7 },
  },
  {
    id: 'volturno', nome: 'Volturno Capital', tipo: 'vera',
    racconto: 'Finanza. Stipendio doppio rispetto a chiunque. Al colloquio parlano di «ambiente sfidante e meritocratico».',
    insegna: { finanza: +2, analisi_dati: +1, negoziazione: +2, intelligenza_politica: +1 },
    dice: { cultura: 7, management: 7 },
  },
  {
    id: 'helvex', nome: 'Helvex Systems', tipo: 'vera',
    racconto: 'Corporate solida. Buona vita, buoni colleghi, promozioni lentissime. Dopo due anni sai già com’è il terzo.',
    insegna: { settore: +1, gestione_progetti: +1, diritto: +1, lavoro_di_squadra: +1 },
    dice: {},
  },

  /* ─── Le grandi ─── */
  {
    id: 'aurelia', nome: 'Aurelia Group', tipo: 'vera',
    racconto: 'Multinazionale industriale. Politica interna feroce: al colloquio la chiamano «una cultura di squadra molto forte».',
    insegna: { settore: +2, gestione_progetti: +1, negoziazione: +1, intelligenza_politica: +2 },
    dice: { cultura: 7 },
  },
  {
    id: 'kaleido', nome: 'Kaleido Labs', tipo: 'vera',
    racconto: 'Ricerca e creatività. Meritocratica davvero, e difficilissima da entrare: dicono di no a quasi tutti.',
    insegna: { creativita: +2, analisi_dati: +2, tecnologia: +1, pensiero_critico: +2, lavoro_di_squadra: +1 },
    dice: {},
  },
  {
    id: 'orion', nome: 'Orion Dynamics', tipo: 'vera',
    racconto: 'Grande tech. Ottimo stipendio, e una riorganizzazione ogni sei mesi. Al colloquio non la nominano.',
    insegna: { tecnologia: +2, analisi_dati: +1, gestione_progetti: +1, comunicazione: +1, resilienza: +1 },
    dice: { stabilita: 7 },
  },

  /* ─── La cima ─── */
  {
    id: 'achivia', nome: 'ACHIVIA SPA', tipo: 'meta',
    racconto: 'L’azienda più importante del mondo. Entrarci è quasi impossibile: serve reputazione, rete, soft skill altissime e qualcuno dentro che faccia il tuo nome. Molte carriere bellissime non ci passano mai, e va benissimo così.',
    insegna: { leadership: +1, negoziazione: +1, intelligenza_politica: +1, pensiero_critico: +1, settore: +1 },
    dice: {},
  },
];

export const aziendaById = (id) => AZIENDE.find((a) => a.id === id) || null;
export const AZIENDE_VERE = AZIENDE.filter((a) => a.tipo !== 'sopravvivenza');
