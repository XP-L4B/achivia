/**
 * Il registro degli asset: l'unico file che sa dove stanno le immagini.
 *
 * Il gioco chiede `'nemico.ossa'` e non sa che esista un PNG. Cambiare il
 * disegno vuol dire sostituire il file; cambiare la griglia dei fotogrammi
 * vuol dire toccare una riga qui. Nessun altro file del motore contiene un
 * percorso.
 *
 * I file stanno in `src/game/assets/` e Vite li raccoglie da qui, in questo
 * pezzo separato dell'applicazione: non finiscono nel pacchetto principale,
 * e arrivano solo a chi apre l'arena. Il percorso di ognuno passa da
 * `BASE_URL`, perche' l'app e' pubblicata sotto `/achivia/` e un percorso
 * scritto a mano si romperebbe in produzione.
 *
 *   riquadro    il lato del fotogramma, quando il foglio e' una striscia di
 *               fotogrammi quadrati; `null` per un'immagine sola
 *   fotogrammi  quanti ne ha la striscia
 *   ancora      'piedi' se il punto di appoggio e' in basso al centro,
 *               'centro' se e' il centro
 *
 * La provenienza e le licenze di ogni file stanno in `assets/PROVENIENZA.md`.
 */

const FILE = import.meta.glob('./assets/**/*.png', { eager: true, import: 'default', query: '?url' });

const via = (nome) => FILE[`./assets/${nome}`] ?? null;

export const ASSET = {
  /* ─── Personaggi ───
     Il soldato e l'orco hanno le animazioni per intero; gli altri quattro
     hanno la sola posa ferma, e il resto lo fa il codice. */
  'personaggio.soldato.idle':    { via: via('characters/soldato-idle.png'),    riquadro: 40, fotogrammi: 6, ancora: 'piedi' },
  'personaggio.soldato.cammino': { via: via('characters/soldato-cammino.png'), riquadro: 40, fotogrammi: 8, ancora: 'piedi' },
  'personaggio.soldato.colpito': { via: via('characters/soldato-colpito.png'), riquadro: 40, fotogrammi: 4, ancora: 'piedi' },
  'personaggio.soldato.morte':   { via: via('characters/soldato-morte.png'),   riquadro: 40, fotogrammi: 4, ancora: 'piedi' },
  'personaggio.orco.idle':       { via: via('characters/orco-idle.png'),       riquadro: 40, fotogrammi: 6, ancora: 'piedi' },
  'personaggio.orco.cammino':    { via: via('characters/orco-cammino.png'),    riquadro: 40, fotogrammi: 8, ancora: 'piedi' },
  'personaggio.orco.colpito':    { via: via('characters/orco-colpito.png'),    riquadro: 40, fotogrammi: 4, ancora: 'piedi' },
  'personaggio.orco.morte':      { via: via('characters/orco-morte.png'),      riquadro: 40, fotogrammi: 4, ancora: 'piedi' },
  'personaggio.furfante.idle':   { via: via('characters/furfante-idle.png'),   riquadro: 16, fotogrammi: 4, ancora: 'piedi' },
  'personaggio.arciere.idle':    { via: via('characters/arciere-idle.png'),    riquadro: 16, fotogrammi: 4, ancora: 'piedi' },
  'personaggio.occultista.idle': { via: via('characters/occultista-idle.png'), riquadro: 16, fotogrammi: 4, ancora: 'piedi' },
  'personaggio.gladiatore.idle': { via: via('characters/gladiatore-idle.png'), riquadro: 16, fotogrammi: 4, ancora: 'piedi' },

  /* ─── Nemici: tutti 16x16, quattro fotogrammi di posa ferma ─── */
  'nemico.ossa':        { via: via('enemies/ossa.png'),        riquadro: 16, fotogrammi: 4, ancora: 'piedi' },
  'nemico.mano':        { via: via('enemies/mano.png'),        riquadro: 16, fotogrammi: 4, ancora: 'piedi' },
  'nemico.segugio':     { via: via('enemies/segugio.png'),     riquadro: 16, fotogrammi: 4, ancora: 'piedi' },
  'nemico.troll':       { via: via('enemies/troll.png'),       riquadro: 16, fotogrammi: 4, ancora: 'piedi' },
  'nemico.arciere':     { via: via('enemies/arciere.png'),     riquadro: 16, fotogrammi: 4, ancora: 'piedi' },
  'nemico.scarabeo':    { via: via('enemies/scarabeo.png'),    riquadro: 16, fotogrammi: 4, ancora: 'piedi' },
  'nemico.cavalcalupo': { via: via('enemies/cavalcalupo.png'), riquadro: 16, fotogrammi: 4, ancora: 'piedi' },
  'nemico.melma':       { via: via('enemies/melma.png'),       riquadro: 16, fotogrammi: 4, ancora: 'piedi' },
  'nemico.melmetta':    { via: via('enemies/melmetta.png'),    riquadro: 16, fotogrammi: 4, ancora: 'piedi' },
  'nemico.ciclope':     { via: via('enemies/ciclope.png'),     riquadro: 16, fotogrammi: 4, ancora: 'piedi' },

  /* ─── I boss: stessi fogli 16x16, ingranditi dalla scheda ─── */
  'nemico.ettin':       { via: via('enemies/ettin.png'),       riquadro: 16, fotogrammi: 4, ancora: 'piedi' },
  'nemico.occhio':      { via: via('enemies/occhio.png'),      riquadro: 16, fotogrammi: 4, ancora: 'piedi' },
  'nemico.balor':       { via: via('enemies/balor.png'),       riquadro: 16, fotogrammi: 4, ancora: 'piedi' },

  /* ─── Proiettili ─── */
  'proiettile.freccia': { via: via('weapons/freccia.png'), riquadro: null, fotogrammi: 1, ancora: 'centro' },

  /* ─── Mondo ─── */
  'mondo.pavimento': { via: via('world/pavimento.png'), riquadro: 48, fotogrammi: 1, ancora: 'centro' },
  'mondo.torcia':    { via: via('world/torcia.png'),    riquadro: 16, fotogrammi: 4, ancora: 'piedi' },

  /* ─── Interfaccia ─── */
  'ui.modulo.danno':    { via: via('ui/modulo-danno.png'),    riquadro: 16, fotogrammi: 1, ancora: 'centro' },
  'ui.modulo.cadenza':  { via: via('ui/modulo-cadenza.png'),  riquadro: 16, fotogrammi: 1, ancora: 'centro' },
  'ui.modulo.gittata':  { via: via('ui/modulo-gittata.png'),  riquadro: 16, fotogrammi: 1, ancora: 'centro' },
  'ui.modulo.velocita': { via: via('ui/modulo-velocita.png'), riquadro: 16, fotogrammi: 1, ancora: 'centro' },
  'ui.modulo.vita':     { via: via('ui/modulo-vita.png'),     riquadro: 16, fotogrammi: 1, ancora: 'centro' },
  'ui.modulo.raccolta': { via: via('ui/modulo-raccolta.png'), riquadro: 16, fotogrammi: 1, ancora: 'centro' },
  'ui.arma.freccia':    { via: via('ui/arma-freccia.png'),    riquadro: 16, fotogrammi: 1, ancora: 'centro' },
  'ui.arma.ventaglio':  { via: via('ui/arma-ventaglio.png'),  riquadro: 16, fotogrammi: 1, ancora: 'centro' },
  'ui.arma.sigillo':    { via: via('ui/arma-sigillo.png'),    riquadro: 16, fotogrammi: 1, ancora: 'centro' },
  'ui.arma.anello':     { via: via('ui/arma-anello.png'),     riquadro: 16, fotogrammi: 1, ancora: 'centro' },
  'ui.arma.lancia':     { via: via('ui/arma-lancia.png'),     riquadro: 16, fotogrammi: 1, ancora: 'centro' },
  'ui.arma.fulmine':    { via: via('ui/arma-fulmine.png'),    riquadro: 16, fotogrammi: 1, ancora: 'centro' },
  'ui.arma.spirito':    { via: via('ui/arma-spirito.png'),    riquadro: 16, fotogrammi: 1, ancora: 'centro' },
  'ui.arma.spine':      { via: via('ui/arma-spine.png'),      riquadro: 16, fotogrammi: 1, ancora: 'centro' },
  'ui.arma.falce':      { via: via('ui/arma-falce.png'),      riquadro: 16, fotogrammi: 1, ancora: 'centro' },
  'ui.arma.trappola':   { via: via('ui/arma-trappola.png'),   riquadro: 16, fotogrammi: 1, ancora: 'centro' },
  'ui.arma.raggio':     { via: via('ui/arma-raggio.png'),     riquadro: 16, fotogrammi: 1, ancora: 'centro' },
  'ui.arma.pioggia':    { via: via('ui/arma-pioggia.png'),    riquadro: 16, fotogrammi: 1, ancora: 'centro' },
  'ui.arma.spirale':    { via: via('ui/arma-spirale.png'),    riquadro: 16, fotogrammi: 1, ancora: 'centro' },
  'ui.arma.rimbalzo':   { via: via('ui/arma-rimbalzo.png'),   riquadro: 16, fotogrammi: 1, ancora: 'centro' },

  /* ─── Gli effetti delle casse ─── */
  'ui.effetto.ristoro':      { via: via('ui/effetto-ristoro.png'),      riquadro: 16, fotogrammi: 1, ancora: 'centro' },
  'ui.effetto.magnete':      { via: via('ui/effetto-magnete.png'),      riquadro: 16, fotogrammi: 1, ancora: 'centro' },
  'ui.effetto.devastazione': { via: via('ui/effetto-devastazione.png'), riquadro: 16, fotogrammi: 1, ancora: 'centro' },
  'ui.effetto.potenzia':     { via: via('ui/effetto-potenzia.png'),     riquadro: 16, fotogrammi: 1, ancora: 'centro' },
  'ui.effetto.furia':        { via: via('ui/effetto-furia.png'),        riquadro: 16, fotogrammi: 1, ancora: 'centro' },
  'ui.effetto.sovraccarico': { via: via('ui/effetto-sovraccarico.png'), riquadro: 16, fotogrammi: 1, ancora: 'centro' },
  'ui.effetto.barriera':     { via: via('ui/effetto-barriera.png'),     riquadro: 16, fotogrammi: 1, ancora: 'centro' },
  'ui.effetto.supermagnete': { via: via('ui/effetto-supermagnete.png'), riquadro: 16, fotogrammi: 1, ancora: 'centro' },
  'ui.effetto.rallenta':     { via: via('ui/effetto-rallenta.png'),     riquadro: 16, fotogrammi: 1, ancora: 'centro' },
  'ui.effetto.fantasma':     { via: via('ui/effetto-fantasma.png'),     riquadro: 16, fotogrammi: 1, ancora: 'centro' },
  'ui.effetto.precisione':   { via: via('ui/effetto-precisione.png'),   riquadro: 16, fotogrammi: 1, ancora: 'centro' },
  'ui.effetto.tempesta':     { via: via('ui/effetto-tempesta.png'),     riquadro: 16, fotogrammi: 1, ancora: 'centro' },
  'ui.effetto.doppiaXp':     { via: via('ui/effetto-doppiaXp.png'),     riquadro: 16, fotogrammi: 1, ancora: 'centro' },
  'ui.effetto.berserker':    { via: via('ui/effetto-berserker.png'),    riquadro: 16, fotogrammi: 1, ancora: 'centro' },
};

/** La scheda di un asset, o `null` se il nome non esiste. */
export const scheda = (nome) => ASSET[nome] ?? null;

/** L'indirizzo dell'immagine, per chi la mostra fuori dal canvas (le icone dei moduli nella scelta). */
export const urlAsset = (nome) => ASSET[nome]?.via ?? null;
