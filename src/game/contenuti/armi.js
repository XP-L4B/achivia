/**
 * Le armi, come dati.
 *
 * Quattordici, ognuna con un comportamento davvero suo, e cinque livelli.
 * Il codice che le fa funzionare sta in `combattimento.js`, un ramo per
 * comportamento; qui ci sono solo i numeri, e i numeri stanno solo qui.
 *
 *   freccia     un proiettile verso il nemico piu' vicino
 *   ventaglio   tre schegge (poi cinque) a ventaglio, corte e veloci
 *   sigillo     un'area che scoppia sul nemico piu' vicino: colpisce chi ci sta dentro
 *   anello      lame che girano intorno al giocatore: colpiscono chi le tocca
 *   lancia      un colpo che attraversa i nemici invece di fermarsi al primo
 *   fulmine     colpisce uno e salta ai vicini, a catena
 *   spirito     un proiettile lento che insegue, e scoppia dove arriva
 *   spine       un'aura intorno al giocatore: chi ci entra si fa male a intervalli
 *   falce       una lama che va e torna: colpisce all'andata e al ritorno
 *   trappola    una trappola dove sei: scatta sul primo che ci passa
 *   raggio      una riga di luce: colpisce tutti quelli sulla riga
 *   pioggia     frecce dal cielo, a caso intorno al bersaglio, col preavviso
 *   spirale     una brace alla volta, ogni volta un po' piu' in la' nel giro
 *   rimbalzo    una sfera che, colpito uno, rimbalza sul vicino
 *
 * Ognuna ha la sua evoluzione: quattordici, e ogni evoluzione cambia il
 * modo, non solo i numeri.
 *
 * Ogni livello e' una riga completa dei numeri di quel livello: chi legge
 * il livello 3 non deve sommare niente. `evoluzione` e' il sesto passo,
 * facoltativo: la stessa arma con un effetto in piu' e un nome suo.
 *
 * I numeri sono la base; le statistiche del giocatore (danno, cadenza,
 * gittata, velocita' dei proiettili, proiettili in piu') sono
 * moltiplicatori che valgono per tutte le armi allo stesso modo, cosi' un
 * modulo "+20% di danno" non deve sapere quante armi ci sono. Sopra
 * ancora, le sinergie (`contenuti/sinergie.js`).
 */

export const LIVELLO_MASSIMO = 5;
/** Il colpo critico: quante volte il danno. La probabilita' la portano il giocatore e gli effetti. */
export const CRITICO = { molt: 2 };
export const ARMI_MASSIME = 4;

export const ARMI = [
  {
    id: 'freccia', nome: 'Freccia del guardiano', icona: 'ui.arma.freccia', comportamento: 'freccia',
    descrizione: 'Un dardo verso il nemico più vicino. Semplice e sempre utile.',
    livelli: [
      { danno: 12, cadenza: 0.85, gittata: 150, velocita: 260 },
      { danno: 14, cadenza: 0.80, gittata: 160, velocita: 270 },
      { danno: 16, cadenza: 0.74, gittata: 170, velocita: 280 },
      { danno: 20, cadenza: 0.68, gittata: 180, velocita: 290 },
      { danno: 25, cadenza: 0.60, gittata: 195, velocita: 300 },
    ],
    evoluzione: { nome: 'Freccia incendiaria', descrizione: 'Chi viene colpito brucia per due secondi.', effetto: 'brucia', bruciaDanno: 6 },
  },
  {
    id: 'ventaglio', nome: 'Ventaglio di schegge', icona: 'ui.arma.ventaglio', comportamento: 'ventaglio',
    descrizione: 'Tre schegge a ventaglio, corte ma fitte. Da vicino fa male.',
    livelli: [
      { danno: 6, cadenza: 1.0, gittata: 95, velocita: 300, schegge: 3, apertura: 0.55 },
      { danno: 7, cadenza: 0.92, gittata: 100, velocita: 310, schegge: 3, apertura: 0.55 },
      { danno: 8, cadenza: 0.85, gittata: 105, velocita: 320, schegge: 4, apertura: 0.7 },
      { danno: 10, cadenza: 0.78, gittata: 110, velocita: 330, schegge: 5, apertura: 0.85 },
      { danno: 13, cadenza: 0.70, gittata: 120, velocita: 340, schegge: 6, apertura: 0.95 },
    ],
    evoluzione: { nome: 'Tempesta di schegge', descrizione: 'Sette schegge, tutt’intorno.', effetto: 'cerchio', schegge: 7 },
  },
  {
    id: 'sigillo', nome: 'Sigillo di fuoco', icona: 'ui.arma.sigillo', comportamento: 'sigillo',
    descrizione: 'Un cerchio di fuoco scoppia sul nemico più vicino e colpisce chi ci sta dentro.',
    livelli: [
      { danno: 12, cadenza: 2.2, gittata: 140, raggio: 30 },
      { danno: 15, cadenza: 2.0, gittata: 150, raggio: 34 },
      { danno: 18, cadenza: 1.8, gittata: 160, raggio: 38 },
      { danno: 22, cadenza: 1.6, gittata: 170, raggio: 42 },
      { danno: 28, cadenza: 1.4, gittata: 180, raggio: 48 },
    ],
    evoluzione: { nome: 'Rogo', descrizione: 'Il fuoco resta: chi ci sta dentro brucia.', effetto: 'brucia', bruciaDanno: 8 },
  },
  {
    id: 'anello', nome: 'Anello di lame', icona: 'ui.arma.anello', comportamento: 'anello',
    descrizione: 'Lame che girano intorno a te. Chi si avvicina le trova.',
    livelli: [
      { danno: 8, cadenza: 0.35, lame: 2, raggio: 34, giri: 1.4 },
      { danno: 10, cadenza: 0.35, lame: 3, raggio: 36, giri: 1.5 },
      { danno: 12, cadenza: 0.32, lame: 3, raggio: 38, giri: 1.6 },
      { danno: 14, cadenza: 0.30, lame: 4, raggio: 40, giri: 1.7 },
      { danno: 18, cadenza: 0.28, lame: 5, raggio: 44, giri: 1.8 },
    ],
    evoluzione: { nome: 'Corona di lame', descrizione: 'Sei lame, più larghe e più pesanti, che respingono un poco.', effetto: 'respinge', lame: 6, raggio: 52, danno: 24 },
  },
  {
    id: 'lancia', nome: 'Lancia spettrale', icona: 'ui.arma.lancia', comportamento: 'lancia',
    descrizione: 'Un colpo che attraversa i nemici invece di fermarsi al primo.',
    livelli: [
      { danno: 14, cadenza: 1.3, gittata: 190, velocita: 320, perfora: 2 },
      { danno: 17, cadenza: 1.2, gittata: 200, velocita: 330, perfora: 3 },
      { danno: 20, cadenza: 1.1, gittata: 210, velocita: 340, perfora: 4 },
      { danno: 26, cadenza: 0.95, gittata: 220, velocita: 350, perfora: 5 },
      { danno: 34, cadenza: 0.8, gittata: 240, velocita: 360, perfora: 7 },
    ],
    evoluzione: { nome: 'Lancia del varco', descrizione: 'Attraversa tutto, senza limite.', effetto: 'infinita', perfora: 99 },
  },
  {
    id: 'fulmine', nome: 'Fulmine incatenato', icona: 'ui.arma.fulmine', comportamento: 'fulmine',
    descrizione: 'Colpisce il più vicino e salta ai suoi vicini, a catena.',
    livelli: [
      { danno: 9, cadenza: 1.4, gittata: 150, salti: 2, portataSalto: 70 },
      { danno: 11, cadenza: 1.3, gittata: 160, salti: 3, portataSalto: 75 },
      { danno: 13, cadenza: 1.2, gittata: 170, salti: 4, portataSalto: 80 },
      { danno: 15, cadenza: 1.1, gittata: 180, salti: 5, portataSalto: 85 },
      { danno: 18, cadenza: 1.0, gittata: 190, salti: 7, portataSalto: 90 },
    ],
    evoluzione: { nome: 'Tempesta incatenata', descrizione: 'Due catene alla volta.', effetto: 'doppio' },
  },
  {
    id: 'spirito', nome: 'Spirito segugio', icona: 'ui.arma.spirito', comportamento: 'spirito',
    descrizione: 'Uno spirito lento che insegue il nemico più vicino e scoppia dove arriva.',
    livelli: [
      { danno: 16, cadenza: 2.0, gittata: 220, velocita: 130, sterzo: 3.5, scoppio: 24 },
      { danno: 20, cadenza: 1.85, gittata: 230, velocita: 140, sterzo: 3.8, scoppio: 26 },
      { danno: 24, cadenza: 1.7, gittata: 240, velocita: 150, sterzo: 4.1, scoppio: 28 },
      { danno: 29, cadenza: 1.55, gittata: 250, velocita: 160, sterzo: 4.4, scoppio: 31 },
      { danno: 36, cadenza: 1.4, gittata: 260, velocita: 170, sterzo: 4.8, scoppio: 35 },
    ],
    evoluzione: { nome: 'Muta di spiriti', descrizione: 'Due spiriti per volta.', effetto: 'doppio' },
  },
  {
    id: 'spine', nome: 'Muro di spine', icona: 'ui.arma.spine', comportamento: 'spine',
    descrizione: 'Un’aura intorno a te: chi ci entra si fa male, a intervalli.',
    livelli: [
      { danno: 4, cadenza: 0.5, raggio: 36 },
      { danno: 5, cadenza: 0.5, raggio: 40 },
      { danno: 6, cadenza: 0.45, raggio: 44 },
      { danno: 8, cadenza: 0.42, raggio: 48 },
      { danno: 10, cadenza: 0.38, raggio: 54 },
    ],
    evoluzione: { nome: 'Rovi', descrizione: 'Le spine rallentano chi ci passa.', effetto: 'rallenta', rallenta: 0.55 },
  },
  {
    id: 'falce', nome: 'Falce di ritorno', icona: 'ui.arma.falce', comportamento: 'falce',
    descrizione: 'Una lama che va e torna: colpisce all’andata e al ritorno.',
    livelli: [
      { danno: 9, cadenza: 1.6, gittata: 120, velocita: 220, perfora: 3 },
      { danno: 11, cadenza: 1.5, gittata: 130, velocita: 230, perfora: 4 },
      { danno: 13, cadenza: 1.4, gittata: 140, velocita: 240, perfora: 5 },
      { danno: 16, cadenza: 1.3, gittata: 150, velocita: 250, perfora: 6 },
      { danno: 20, cadenza: 1.15, gittata: 165, velocita: 260, perfora: 8 },
    ],
    evoluzione: { nome: 'Falci gemelle', descrizione: 'Due falci, in direzioni opposte.', effetto: 'doppio' },
  },
  {
    id: 'trappola', nome: 'Trappola dentata', icona: 'ui.arma.trappola', comportamento: 'trappola',
    descrizione: 'Lasci una trappola dove sei: scatta sul primo che ci passa e scoppia.',
    livelli: [
      { danno: 22, cadenza: 2.4, scoppio: 30, durata: 12 },
      { danno: 26, cadenza: 2.2, scoppio: 33, durata: 14 },
      { danno: 31, cadenza: 2.0, scoppio: 36, durata: 16 },
      { danno: 37, cadenza: 1.8, scoppio: 40, durata: 18 },
      { danno: 45, cadenza: 1.6, scoppio: 45, durata: 20 },
    ],
    evoluzione: { nome: 'Campo minato', descrizione: 'Due trappole per volta, e chi scoppia brucia.', effetto: 'brucia', bruciaDanno: 7, quante: 2 },
  },
  {
    id: 'raggio', nome: 'Raggio di luce', icona: 'ui.arma.raggio', comportamento: 'raggio',
    descrizione: 'Una riga di luce verso il nemico più vicino, e oltre: colpisce tutti quelli sulla riga.',
    livelli: [
      { danno: 7, cadenza: 0.9, gittata: 170, spessore: 6 },
      { danno: 9, cadenza: 0.85, gittata: 180, spessore: 6 },
      { danno: 11, cadenza: 0.8, gittata: 190, spessore: 7 },
      { danno: 13, cadenza: 0.75, gittata: 200, spessore: 8 },
      { danno: 16, cadenza: 0.65, gittata: 220, spessore: 9 },
    ],
    evoluzione: { nome: 'Raggio prismatico', descrizione: 'Tre raggi, a ventaglio.', effetto: 'triplo', apertura: 0.5 },
  },
  {
    id: 'pioggia', nome: 'Pioggia di frecce', icona: 'ui.arma.pioggia', comportamento: 'pioggia',
    descrizione: 'Frecce dal cielo intorno al nemico più vicino: si vede dove cadranno, poi cadono.',
    livelli: [
      { danno: 12, cadenza: 1.6, gittata: 130, raggio: 22, quante: 2, preavviso: 0.6 },
      { danno: 14, cadenza: 1.5, gittata: 140, raggio: 24, quante: 2, preavviso: 0.6 },
      { danno: 17, cadenza: 1.4, gittata: 150, raggio: 26, quante: 3, preavviso: 0.55 },
      { danno: 18, cadenza: 1.3, gittata: 160, raggio: 28, quante: 3, preavviso: 0.55 },
      { danno: 20, cadenza: 1.2, gittata: 175, raggio: 32, quante: 4, preavviso: 0.5 },
    ],
    evoluzione: { nome: 'Diluvio', descrizione: 'Sei frecce, più larghe.', effetto: 'diluvio', quante: 6, raggio: 36 },
  },
  {
    id: 'spirale', nome: 'Spirale di braci', icona: 'ui.arma.spirale', comportamento: 'spirale',
    descrizione: 'Una brace alla volta, ogni volta un po’ più in là nel giro: copre tutto intorno, senza mirare.',
    livelli: [
      { danno: 7, cadenza: 0.18, gittata: 130, velocita: 170, passo: 0.55 },
      { danno: 8, cadenza: 0.17, gittata: 140, velocita: 180, passo: 0.55 },
      { danno: 10, cadenza: 0.16, gittata: 150, velocita: 190, passo: 0.55 },
      { danno: 12, cadenza: 0.15, gittata: 160, velocita: 200, passo: 0.55 },
      { danno: 15, cadenza: 0.13, gittata: 175, velocita: 210, passo: 0.55 },
    ],
    evoluzione: { nome: 'Doppia spirale', descrizione: 'Due bracci, opposti.', effetto: 'doppio' },
  },
  {
    id: 'rimbalzo', nome: 'Sfera rimbalzante', icona: 'ui.arma.rimbalzo', comportamento: 'rimbalzo',
    descrizione: 'Una sfera che, colpito uno, rimbalza sul vicino. E poi su un altro.',
    livelli: [
      { danno: 11, cadenza: 1.5, gittata: 160, velocita: 240, rimbalzi: 2, portataRimbalzo: 90 },
      { danno: 13, cadenza: 1.4, gittata: 170, velocita: 250, rimbalzi: 3, portataRimbalzo: 95 },
      { danno: 16, cadenza: 1.3, gittata: 180, velocita: 260, rimbalzi: 4, portataRimbalzo: 100 },
      { danno: 19, cadenza: 1.2, gittata: 190, velocita: 270, rimbalzi: 5, portataRimbalzo: 110 },
      { danno: 23, cadenza: 1.05, gittata: 200, velocita: 280, rimbalzi: 7, portataRimbalzo: 120 },
    ],
    evoluzione: { nome: 'Sfera instancabile', descrizione: 'Dieci rimbalzi, e ogni rimbalzo fa un po’ più male.', effetto: 'cresce', rimbalzi: 10, crescita: 0.08 },
  },
];

export const armaById = (id) => ARMI.find((a) => a.id === id) || null;

/** I numeri di un'arma a un certo livello (1-based), con l'evoluzione sopra se c'e'. */
export function numeriDi(arma, livello, evoluta = false) {
  const base = arma.livelli[Math.min(arma.livelli.length, Math.max(1, livello)) - 1];
  if (!evoluta || !arma.evoluzione) return base;
  return { ...base, ...arma.evoluzione, nome: undefined, descrizione: undefined };
}

/** Che cosa cambia salendo al livello `l`: per la carta della scelta. */
export function descriviLivello(arma, l) {
  const prima = arma.livelli[l - 2]; const dopo = arma.livelli[l - 1];
  if (!prima || !dopo) return '';
  const voci = [];
  if (dopo.danno !== prima.danno) voci.push(`danno ${prima.danno} → ${dopo.danno}`);
  if (dopo.cadenza !== prima.cadenza) voci.push(`ogni ${dopo.cadenza}s`);
  if (dopo.schegge !== prima.schegge) voci.push(`${dopo.schegge} schegge`);
  if (dopo.lame !== prima.lame) voci.push(`${dopo.lame} lame`);
  if (dopo.perfora !== prima.perfora) voci.push(`attraversa ${dopo.perfora}`);
  if (dopo.salti !== prima.salti) voci.push(`${dopo.salti} salti`);
  if (dopo.raggio !== prima.raggio) voci.push(`raggio ${dopo.raggio}`);
  if (dopo.quante !== prima.quante) voci.push(`${dopo.quante} frecce`);
  if (dopo.rimbalzi !== prima.rimbalzi) voci.push(`${dopo.rimbalzi} rimbalzi`);
  if (dopo.spessore !== prima.spessore) voci.push(`spessore ${dopo.spessore}`);
  if (dopo.scoppio !== prima.scoppio) voci.push(`scoppio ${dopo.scoppio}`);
  if (dopo.gittata !== prima.gittata && voci.length < 3) voci.push(`gittata ${dopo.gittata}`);
  return voci.slice(0, 3).join(' · ');
}
