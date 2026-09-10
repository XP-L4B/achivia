/**
 * I moduli: i potenziamenti che si scelgono salendo di livello.
 *
 * Trentaquattro, in quattro rarita'. Un modulo tocca le statistiche del
 * giocatore e basta — le dieci di `statistichePartenza`: vita massima,
 * velocita', danno, cadenza, velocita' dei proiettili, proiettili in piu',
 * raggio di raccolta, probabilita' e danno del critico, armatura — e le
 * armi le leggono come moltiplicatori. Cosi' un modulo non deve sapere
 * quante armi ci sono. Il danno si somma (+12% e +20% fanno +32%), non si
 * moltiplica: dieci moduli di danno insieme valgono x4, non x14.
 *
 * Ogni modulo ha un tetto di prese, e piu' e' raro meno esce (i pesi
 * stanno in `scelte.js`). La descrizione dice il numero: chi sceglie deve
 * capire in un secondo che cosa prende.
 *
 * `applica` riceve le statistiche e le cambia sul posto: e' l'unico punto
 * in cui un modulo tocca i numeri. `cura` e' una frazione della vita
 * massima che `applicaScelta` restituisce subito e azzera.
 */

const I = {
  danno: 'ui.modulo.danno', cadenza: 'ui.modulo.cadenza', vita: 'ui.modulo.vita', velocita: 'ui.modulo.velocita',
  raccolta: 'ui.modulo.raccolta', gittata: 'ui.modulo.gittata', dardi: 'ui.arma.freccia', proiettili: 'ui.arma.ventaglio',
  critico: 'ui.effetto.precisione', criticoDanno: 'ui.effetto.berserker', armatura: 'ui.effetto.barriera',
};

export const MODULI = [
  /* ─── Comuni: un passo alla volta ─── */
  { id: 'filo', rarita: 'comune', nome: 'Filo affilato', icona: I.danno, tetto: 6, descrizione: 'Danno +12%.', applica: (s) => { s.danno += 0.12; } },
  { id: 'mano', rarita: 'comune', nome: 'Mano lesta', icona: I.cadenza, tetto: 6, descrizione: 'Ricarica delle armi −10%.', applica: (s) => { s.cadenza *= 0.9; } },
  { id: 'cuore', rarita: 'comune', nome: 'Cuore saldo', icona: I.vita, tetto: 6, descrizione: 'Vita massima +15, e recuperi il 20%.', applica: (s) => { s.vitaMax += 15; s.cura = 0.2; } },
  { id: 'passo', rarita: 'comune', nome: 'Passo leggero', icona: I.velocita, tetto: 5, descrizione: 'Velocità +8%.', applica: (s) => { s.velocita *= 1.08; } },
  { id: 'calamita', rarita: 'comune', nome: 'Calamita', icona: I.raccolta, tetto: 4, descrizione: 'Raggio di raccolta +30%.', applica: (s) => { s.raccolta *= 1.3; } },
  { id: 'occhio', rarita: 'comune', nome: 'Occhio lungo', icona: I.gittata, tetto: 5, descrizione: 'Gittata +12%.', applica: (s) => { s.gittata *= 1.12; } },
  { id: 'corda', rarita: 'comune', nome: 'Corda tesa', icona: I.dardi, tetto: 5, descrizione: 'Proiettili più veloci del 15%.', applica: (s) => { s.velocitaProiettili *= 1.15; } },
  { id: 'mira', rarita: 'comune', nome: 'Mira ferma', icona: I.critico, tetto: 5, descrizione: 'Probabilità di critico +4%.', applica: (s) => { s.critico += 0.04; } },
  { id: 'cuoio', rarita: 'comune', nome: 'Giaco di cuoio', icona: I.armatura, tetto: 5, descrizione: 'Armatura +1: ogni colpo subito fa un danno in meno.', applica: (s) => { s.armatura += 1; } },
  { id: 'fiato', rarita: 'comune', nome: 'Fiato lungo', icona: I.vita, tetto: 4, descrizione: 'Vita massima +10%.', applica: (s) => { s.vitaMax = Math.round(s.vitaMax * 1.1); } },
  /* ─── Insolite: un passo più lungo ─── */
  { id: 'lama', rarita: 'insolita', nome: 'Lama temprata', icona: I.danno, tetto: 4, descrizione: 'Danno +20%.', applica: (s) => { s.danno += 0.2; } },
  { id: 'polso', rarita: 'insolita', nome: 'Polso rapido', icona: I.cadenza, tetto: 4, descrizione: 'Ricarica delle armi −18%.', applica: (s) => { s.cadenza *= 0.82; } },
  { id: 'torace', rarita: 'insolita', nome: 'Torace largo', icona: I.vita, tetto: 4, descrizione: 'Vita massima +35, e recuperi il 30%.', applica: (s) => { s.vitaMax += 35; s.cura = 0.3; } },
  { id: 'stivali', rarita: 'insolita', nome: 'Stivali del corriere', icona: I.velocita, tetto: 3, descrizione: 'Velocità +15%.', applica: (s) => { s.velocita *= 1.15; } },
  { id: 'ferro', rarita: 'insolita', nome: 'Ferro di calamita', icona: I.raccolta, tetto: 3, descrizione: 'Raggio di raccolta +60%.', applica: (s) => { s.raccolta *= 1.6; } },
  { id: 'dardo', rarita: 'insolita', nome: 'Dardo veloce', icona: I.dardi, tetto: 3, descrizione: 'Proiettili più veloci del 30%.', applica: (s) => { s.velocitaProiettili *= 1.3; } },
  { id: 'punta', rarita: 'insolita', nome: 'Punta avvelenata', icona: I.criticoDanno, tetto: 4, descrizione: 'I critici fanno +25% di danno.', applica: (s) => { s.criticoDanno += 0.25; } },
  { id: 'maglia', rarita: 'insolita', nome: 'Maglia di ferro', icona: I.armatura, tetto: 4, descrizione: 'Armatura +2.', applica: (s) => { s.armatura += 2; } },
  { id: 'sguardo', rarita: 'insolita', nome: 'Sguardo del falco', icona: I.critico, tetto: 4, descrizione: 'Probabilità di critico +8%.', applica: (s) => { s.critico += 0.08; } },
  { id: 'braccio', rarita: 'insolita', nome: 'Braccio lungo', icona: I.gittata, tetto: 3, descrizione: 'Gittata +25%.', applica: (s) => { s.gittata *= 1.25; } },
  /* ─── Rare: due cose insieme, o una grande ─── */
  { id: 'secondo', rarita: 'rara', nome: 'Secondo dardo', icona: I.proiettili, tetto: 2, descrizione: '+1 proiettile per ogni arma che ne lancia.', applica: (s) => { s.proiettiliExtra += 1; } },
  { id: 'furore', rarita: 'rara', nome: 'Furore freddo', icona: I.danno, tetto: 3, descrizione: 'Danno +35%.', applica: (s) => { s.danno += 0.35; } },
  { id: 'raffica', rarita: 'rara', nome: 'Raffica', icona: I.cadenza, tetto: 3, descrizione: 'Ricarica delle armi −28%.', applica: (s) => { s.cadenza *= 0.72; } },
  { id: 'falco', rarita: 'rara', nome: 'Occhio del falco', icona: I.critico, tetto: 3, descrizione: 'Critico +12% di probabilità e +30% di danno.', applica: (s) => { s.critico += 0.12; s.criticoDanno += 0.3; } },
  { id: 'corazza', rarita: 'rara', nome: 'Corazza di piastre', icona: I.armatura, tetto: 3, descrizione: 'Armatura +3 e vita massima +20.', applica: (s) => { s.armatura += 3; s.vitaMax += 20; } },
  { id: 'vento', rarita: 'rara', nome: 'Passo del vento', icona: I.velocita, tetto: 2, descrizione: 'Velocità +20% e raccolta +30%.', applica: (s) => { s.velocita *= 1.2; s.raccolta *= 1.3; } },
  { id: 'roccia', rarita: 'rara', nome: 'Cuore di roccia', icona: I.vita, tetto: 2, descrizione: 'Vita massima +35%, e recuperi la metà.', applica: (s) => { s.vitaMax = Math.round(s.vitaMax * 1.35); s.cura = 0.5; } },
  { id: 'lungo', rarita: 'rara', nome: 'Tiro lungo', icona: I.gittata, tetto: 2, descrizione: 'Gittata +40% e proiettili più veloci del 20%.', applica: (s) => { s.gittata *= 1.4; s.velocitaProiettili *= 1.2; } },
  /* ─── Epiche: grandi, e una volta sola ─── */
  { id: 'grandine', rarita: 'epica', nome: 'Grandine', icona: I.proiettili, tetto: 1, descrizione: '+2 proiettili per ogni arma che ne lancia.', applica: (s) => { s.proiettiliExtra += 2; } },
  { id: 'patto', rarita: 'epica', nome: 'Patto di sangue', icona: I.danno, tetto: 1, descrizione: 'Danno +60%, ma vita massima −20.', applica: (s) => { s.danno += 0.6; s.vitaMax = Math.max(30, s.vitaMax - 20); } },
  { id: 'grilletto', rarita: 'epica', nome: 'Grilletto facile', icona: I.cadenza, tetto: 1, descrizione: 'Ricarica −40%, ma danno −10%.', applica: (s) => { s.cadenza *= 0.6; s.danno -= 0.1; } },
  { id: 'cecchino', rarita: 'epica', nome: 'Colpo del cecchino', icona: I.critico, tetto: 1, descrizione: 'Critico +25% di probabilità e +60% di danno.', applica: (s) => { s.critico += 0.25; s.criticoDanno += 0.6; } },
  { id: 'baluardo', rarita: 'epica', nome: 'Baluardo', icona: I.armatura, tetto: 1, descrizione: 'Armatura +5, ma velocità −5%.', applica: (s) => { s.armatura += 5; s.velocita *= 0.95; } },
  { id: 'rinascita', rarita: 'epica', nome: 'Rinascita', icona: I.vita, tetto: 1, descrizione: 'Vita massima +60, e torni al massimo.', applica: (s) => { s.vitaMax += 60; s.cura = 1; } },
];

export const moduloById = (id) => MODULI.find((m) => m.id === id) || null;

/** Quanta esperienza serve per salire dal livello `l` al successivo. */
export const sogliaLivello = (l) => Math.round(8 + l * 6 + l * l * 0.9);

/**
 * Il tetto: piu' in su di cosi' non si sale, in una partita.
 *
 * Trenta livelli sono trenta carte, e con trenta carte addosso il
 * personaggio ha vinto: i nemici non arrivano piu' addosso e la partita
 * smette di essere una partita. Il tetto non serve a punire chi gioca
 * bene, serve a spostare la domanda: da «quanto divento forte» a «quanto
 * resisto». Da qui in poi non cresce piu' il giocatore, cresce l'arena —
 * la furia, in `contenuti/nemici.js`.
 *
 * Il traguardo piu' alto che chiede un livello chiede il 20 (`traguardi.js`),
 * quindi il tetto non ne chiude nessuno: chi lo alza o lo abbassa guardi
 * prima li'.
 */
export const LIVELLO_MASSIMO = 30;
