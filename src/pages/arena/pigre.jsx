import { lazy } from 'react';

/**
 * Le pagine dell'arena, caricate a parte.
 *
 * Il motore e le sue immagini pesano, e li paga solo chi entra: sono le
 * uniche pagine dell'app dietro un `lazy()`. Stanno in un file loro e
 * non nel router perche' il ricaricamento a caldo vuole che un file
 * esporti o solo componenti o nessuno — e il router esporta il router.
 */
export const ArenaPagePigra = lazy(() => import('./ArenaPage'));
export const PartitaPagePigra = lazy(() => import('./PartitaPage'));
export const TraguardiArenaPagePigra = lazy(() => import('./TraguardiArenaPage'));
export const ClassificaArenaPagePigra = lazy(() => import('./ClassificaArenaPage'));
