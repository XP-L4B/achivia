/**
 * Le diciassette competenze, in due famiglie.
 *
 * Le **hard** si imparano studiando e facendo. Le **soft** si imparano
 * vivendo: sbagliando, stando con le persone, gestendone. I corsi le
 * allenano male, e infatti nessuna attivita' di studio le tocca.
 *
 * La regola che regge il bilanciamento del gioco sta in `PESO_PER_LIVELLO`
 * (in fondo): quanto pesano le due famiglie in una promozione **cambia con
 * il livello**. In basso conta saper fare; in alto conta saper stare con
 * le persone. Chi investe solo in competenze tecniche deve sbattere contro
 * un muro a meta' gioco — e deve scoprirlo li', non leggerlo nel tutorial.
 */

export const HARD = [
  { id: 'analisi_dati',      nome: 'Analisi dati' },
  { id: 'finanza',           nome: 'Finanza e numeri' },
  { id: 'tecnologia',        nome: 'Tecnologia e coding' },
  { id: 'vendita',           nome: 'Vendita' },
  { id: 'lingue',            nome: 'Lingue' },
  { id: 'gestione_progetti', nome: 'Gestione progetti' },
  { id: 'diritto',           nome: 'Diritto e contratti' },
  { id: 'settore',           nome: 'Competenza tecnica di settore' },
];

export const SOFT = [
  { id: 'comunicazione',         nome: 'Comunicazione' },
  { id: 'leadership',            nome: 'Leadership' },
  { id: 'empatia',               nome: 'Empatia' },
  { id: 'creativita',            nome: 'Creatività' },
  { id: 'lavoro_di_squadra',     nome: 'Lavoro di squadra' },
  { id: 'negoziazione',          nome: 'Negoziazione' },
  { id: 'resilienza',            nome: 'Resilienza' },
  { id: 'pensiero_critico',      nome: 'Pensiero critico' },
  { id: 'intelligenza_politica', nome: 'Intelligenza politica' },
];

export const COMPETENZE = [...HARD, ...SOFT];
export const ID_HARD = new Set(HARD.map((c) => c.id));
export const ID_SOFT = new Set(SOFT.map((c) => c.id));
export const eHard = (id) => ID_HARD.has(id);

/**
 * Quanto pesano le due famiglie nella valutazione, per fascia di livello.
 * Le fasce sono quelle della scala di carriera (`livelli.js`).
 *
 * La usa la fase tre; sta qui perche' e' la definizione di che cos'e' una
 * competenza in questo gioco, non un dettaglio delle promozioni.
 */
export const PESO_PER_LIVELLO = {
  basso:     { hard: 0.75, soft: 0.25 },
  medio:     { hard: 0.50, soft: 0.50 },
  alto:      { hard: 0.30, soft: 0.70 },
  altissimo: { hard: 0.15, soft: 0.85 },
};
