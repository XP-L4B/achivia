/**
 * Le sinergie: un'arma che si ha, piu' una statistica abbastanza alta,
 * e l'arma cambia. Dodici, tutte leggibili in una riga: "Lancia + dardi
 * veloci: attraversa tre nemici in piu'".
 *
 *   arma      l'arma che deve essere in mano
 *   stat      la statistica del giocatore che conta
 *   almeno    la soglia da raggiungere (o `massimo`, per chi scende: la cadenza)
 *   numeri    che cosa cambia nei numeri dell'arma: `piu` somma, `per` moltiplica
 *
 * Si ricalcolano quando cambia qualcosa — una carta, un'arma potenziata da
 * una cassa — e stanno in `giocatore.sinergie`; `numeriEffettivi` le
 * applica sopra i livelli e le statistiche. Non c'e' un contatore a parte:
 * finita la partita, finite le sinergie.
 */

export const SINERGIE = [
  { id: 'giavellotto', nome: 'Giavellotto', arma: 'lancia', stat: 'velocitaProiettili', almeno: 1.3, descrizione: 'Lancia + dardi veloci: attraversa tre nemici in più.', numeri: { perfora: { piu: 3 } } },
  { id: 'muro', nome: 'Muro di schegge', arma: 'ventaglio', stat: 'proiettiliExtra', almeno: 1, descrizione: 'Ventaglio + un dardo in più: due schegge in più, ventaglio più largo.', numeri: { schegge: { piu: 2 }, apertura: { per: 1.4 } } },
  { id: 'turbina', nome: 'Turbina', arma: 'anello', stat: 'velocita', almeno: 105, descrizione: 'Anello + passo rapido: le lame girano una volta e mezza più in fretta.', numeri: { giri: { per: 1.5 } } },
  { id: 'folgore', nome: 'Folgore', arma: 'fulmine', stat: 'critico', almeno: 0.2, descrizione: 'Fulmine + critici frequenti: due salti in più.', numeri: { salti: { piu: 2 } } },
  { id: 'rovi', nome: 'Corazza di rovi', arma: 'spine', stat: 'armatura', almeno: 3, descrizione: 'Spine + armatura: aura più larga e più dolorosa.', numeri: { raggio: { per: 1.3 }, danno: { per: 1.5 } } },
  { id: 'sigilloEsteso', nome: 'Sigillo esteso', arma: 'sigillo', stat: 'gittata', almeno: 1.3, descrizione: 'Sigillo + gittata: il cerchio è più largo del 40%.', numeri: { raggio: { per: 1.4 } } },
  { id: 'anime', nome: 'Anime affamate', arma: 'spirito', stat: 'raccolta', almeno: 50, descrizione: 'Spirito + calamita: lo scoppio è una volta e mezza più largo.', numeri: { scoppio: { per: 1.5 } } },
  { id: 'tiroMortale', nome: 'Tiro mortale', arma: 'freccia', stat: 'criticoDanno', almeno: 2.5, descrizione: 'Freccia + critici pesanti: +30% di danno.', numeri: { danno: { per: 1.3 } } },
  { id: 'ritornoRapido', nome: 'Ritorno rapido', arma: 'falce', stat: 'cadenza', massimo: 0.75, descrizione: 'Falce + mano lesta: torna più in fretta e attraversa due in più.', numeri: { velocita: { per: 1.3 }, perfora: { piu: 2 } } },
  { id: 'campoLargo', nome: 'Campo largo', arma: 'trappola', stat: 'vitaMax', almeno: 160, descrizione: 'Trappola + molta vita: scoppio più largo del 40%.', numeri: { scoppio: { per: 1.4 } } },
  { id: 'prisma', nome: 'Prisma', arma: 'raggio', stat: 'danno', almeno: 1.5, descrizione: 'Raggio + danno alto: la riga è più spessa.', numeri: { spessore: { piu: 4 } } },
  { id: 'monsone', nome: 'Monsone', arma: 'pioggia', stat: 'gittata', almeno: 1.4, descrizione: 'Pioggia + gittata: due frecce in più a ogni scarica.', numeri: { quante: { piu: 2 } } },
];

export const sinergiaById = (id) => SINERGIE.find((s) => s.id === id) || null;

/** Se la condizione di una sinergia vale per queste statistiche. */
export function sinergiaVale(s, stats) {
  const v = stats[s.stat];
  if (v === undefined) return false;
  if (s.almeno !== undefined) return v >= s.almeno;
  if (s.massimo !== undefined) return v <= s.massimo;
  return false;
}

/** Gli id delle sinergie attive per questo giocatore: armi in mano e soglie passate. */
export function sinergieAttive(giocatore) {
  const attive = [];
  for (const s of SINERGIE) {
    if (!giocatore.armi.some((a) => a.id === s.arma)) continue;
    if (sinergiaVale(s, giocatore.stats)) attive.push(s.id);
  }
  return attive;
}

/** Applica ai numeri di un'arma le sinergie attive che la riguardano. */
export function applicaSinergie(numeri, armaId, sinergie) {
  for (let i = 0; i < sinergie.length; i += 1) {
    const s = sinergiaById(sinergie[i]);
    if (!s || s.arma !== armaId) continue;
    for (const k of Object.keys(s.numeri)) {
      const m = s.numeri[k];
      if (m.piu !== undefined) numeri[k] = (numeri[k] || 0) + m.piu;
      if (m.per !== undefined) numeri[k] = (numeri[k] || 0) * m.per;
    }
  }
  return numeri;
}
