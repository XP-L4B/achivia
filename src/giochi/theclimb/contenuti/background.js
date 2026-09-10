/**
 * I cinque punti di partenza.
 *
 * Non sono livelli di difficolta': sono **vite diverse**, con risorse,
 * obblighi ed eventi diversi. Le stesse identiche scelte portano in posti
 * diversi a seconda di dove si e' nati, e il gioco lo deve dimostrare con
 * i numeri, non dirlo con un cartello.
 *
 * Qui non c'e' un numero: quanto pesa ognuna sta in `bilancio.js`
 * (`BACKGROUND`). Qui c'e' la forma — chi sei, che cosa devi, quali porte
 * per te non esistono.
 *
 *   obblighi     cose che il gioco impone e non si scelgono
 *   invisibili   le porte che per questa vita non esistono: il giocatore
 *                le vede grigie, con scritto perche'. Sono id di
 *                **occasioni** — un'attivita', un'offerta di lavoro, un
 *                evento — e le tre scritte oggi sono occasioni delle fasi
 *                tre e cinque: nessuna attivita' settimanale di adesso e'
 *                chiusa a qualcuno, perche' nella vita reale non e' il
 *                lunedi' che ti e' vietato, e' l'MBA. Quando quelle fasi
 *                arrivano, `climb:prove` controlla che ogni id qui esista.
 *   lavoraSubito devi avere un lavoro dalla prima settimana
 */
export const BACKGROUND = [
  {
    id: 'erede',
    nome: 'Erede',
    difficolta: 'Molto facile',
    racconto: 'Figlio di una famiglia ricchissima. Niente affitto, una rete di contatti che esiste da prima di te, e ogni catastrofe che qualcuno assorbe al posto tuo. Puoi rischiare, fallire e ripartire.',
    obblighi: [],
    invisibili: [],
    lavoraSubito: false,
    contattiIniziali: ['famiglia_alto'],
  },
  {
    id: 'benestante',
    nome: 'Benestante',
    difficolta: 'Facile',
    racconto: 'Famiglia agiata di provincia. L’università è pagata, qualche contatto utile c’è, e se cadi qualcuno ti tiene — fino a un certo punto.',
    obblighi: [],
    invisibili: [],
    lavoraSubito: false,
    contattiIniziali: ['famiglia_medio'],
  },
  {
    id: 'ceto_medio',
    nome: 'Ceto medio',
    difficolta: 'Normale',
    racconto: 'Nessun aiuto che conti, nessuna emergenza. Devi lavoricchiare mentre studi, e nessuno fa il tuo nome da nessuna parte.',
    obblighi: [],
    invisibili: [],
    lavoraSubito: false,
    contattiIniziali: [],
  },
  {
    id: 'operaia',
    nome: 'Famiglia operaia',
    difficolta: 'Difficile',
    racconto: 'Lavori mentre studi, e vivi lontano da dove stanno i lavori buoni: pendolare costa tempo e soldi. Un imprevisto da ottocento euro è un problema serio, e ogni tanto a casa serve una mano.',
    obblighi: ['pendolarismo', 'rimesse'],
    invisibili: ['mba_estero'],
    lavoraSubito: true,
    contattiIniziali: [],
  },
  {
    id: 'nessuna',
    nome: 'Nessuna rete',
    difficolta: 'Estremo',
    racconto: 'Nessuna famiglia alle spalle, nessun capitale, nessun contatto, nessuna seconda possibilità. Lavori dalla prima settimana, e il tempo per studiare lo togli al sonno. Certe porte per te non esistono: non le vedi nemmeno.',
    obblighi: ['pendolarismo'],
    invisibili: ['mba_estero', 'anno_sabbatico', 'stage_non_pagato'],
    lavoraSubito: true,
    contattiIniziali: [],
  },
];

export const backgroundById = (id) => BACKGROUND.find((b) => b.id === id) || null;
