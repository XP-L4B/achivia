/**
 * Il registro dei disegni di The Boss: l'unico file che sa dove stanno.
 *
 * Stesso patto dell'arena (`src/game/asset.js`): il gioco chiede
 * `'persona.brocca'` e non sa che esista un PNG. Vite raccoglie i file da
 * qui, in questo pezzo separato dell'applicazione, cosi' non finiscono nel
 * pacchetto principale e arrivano solo a chi apre il gioco. Il percorso
 * passa da `BASE_URL` perche' l'app e' pubblicata sotto `/achivia/`.
 *
 *   riquadro    il lato del fotogramma quando il foglio e' una striscia
 *   fotogrammi  quanti ne ha
 *   ancora      'piedi' se il punto d'appoggio e' in basso al centro
 *
 * I personaggi sono tutti uguali di forma: quattro fotogrammi di attesa in
 * un foglio da 64x16. Non ci sono pose "contento" o "arrabbiato" — il
 * pacchetto non le ha — e l'umore lo raccontano la faccina sopra la testa e
 * il movimento, che sta in `contenuti/umori.js`.
 *
 * I fogli della scena non sono strisce ma tavolozze: dentro ci sono decine
 * di mobili, e la stanza si compone ritagliandoli. Le coordinate dei
 * ritagli stanno con la scena, non qui.
 *
 * Provenienza e licenze: `CREDITS.md`, in questa cartella.
 */

import { DIPENDENTI, MANAGER } from './contenuti/cast.js';

const FILE = import.meta.glob('./assets/**/*.png', { eager: true, import: 'default', query: '?url' });
const via = (nome) => FILE[`./assets/${nome}`] ?? null;

const persona = (id) => [`persona.${id}`, {
  via: via(`personaggi/${id}.png`), riquadro: 16, fotogrammi: 4, ancora: 'piedi',
}];

export const ASSET = {
  /* ─── Chi bussa alla porta ─── */
  ...Object.fromEntries([...DIPENDENTI, ...MANAGER].map((p) => persona(p.sprite))),

  /* ─── Il capo: il cavaliere, l'unico visto da vicino ─── */
  'capo.fermo':   { via: via('capo/fermo.png'),   riquadro: 40, fotogrammi: 6, ancora: 'piedi' },
  'capo.cammina': { via: via('capo/cammina.png'), riquadro: 40, fotogrammi: 8, ancora: 'piedi' },

  /* ─── La stanza: tavolozze, non strisce ─── */
  'scena.muri':        { via: via('scena/muri.png'),        riquadro: null, fotogrammi: 1, ancora: 'centro' },
  'scena.pavimenti':   { via: via('scena/pavimenti.png'),   riquadro: null, fotogrammi: 1, ancora: 'centro' },
  'scena.scaffali':    { via: via('scena/scaffali.png'),    riquadro: null, fotogrammi: 1, ancora: 'centro' },
  'scena.libreria':    { via: via('scena/libreria.png'),    riquadro: null, fotogrammi: 1, ancora: 'centro' },
  'scena.riunioni':    { via: via('scena/riunioni.png'),    riquadro: null, fotogrammi: 1, ancora: 'centro' },
  'scena.generico':    { via: via('scena/generico.png'),    riquadro: null, fotogrammi: 1, ancora: 'centro' },
  'scena.laboratorio': { via: via('scena/laboratorio.png'), riquadro: null, fotogrammi: 1, ancora: 'centro' },
  'scena.vetrine':     { via: via('scena/vetrine.png'),     riquadro: null, fotogrammi: 1, ancora: 'centro' },
};

/** L'indirizzo di un disegno, per chi lo mette in un tag `img`. */
export const urlAsset = (nome) => ASSET[nome]?.via ?? null;

/** I nomi che il registro conosce: lo usano le prove per accorgersi dei buchi. */
export const NOMI_ASSET = Object.keys(ASSET);
