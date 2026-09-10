import { lazy } from 'react';

/**
 * Le pagine dei giochi, caricate a parte.
 *
 * Cinque dizionari e un motore pesano, e li paga solo chi gioca. Stanno in
 * un file loro e non nel router per la stessa ragione dell'arena: il
 * ricaricamento a caldo vuole che un file esporti o solo componenti o
 * nessuno, e il router esporta il router.
 */
export const LexoraPagePigra = lazy(() => import('./LexoraPage'));
export const PartitaLexoraPagePigra = lazy(() => import('./PartitaLexoraPage'));
export const TraguardiLexoraPagePigra = lazy(() => import('./TraguardiLexoraPage'));
export const ClassificaLexoraPagePigra = lazy(() => import('./ClassificaLexoraPage'));

/* The Boss: stesso ragionamento. Venti personaggi, i fogli della stanza e
   la banca delle richieste non li paga chi non entra. */
export const TheBossPagePigra = lazy(() => import('./TheBossPage'));
export const CreditiTheBossPagePigra = lazy(() => import('./CreditiTheBossPage'));
export const PartitaTheBossPagePigra = lazy(() => import('./PartitaTheBossPage'));
export const ClassificaTheBossPagePigra = lazy(() => import('./ClassificaTheBossPage'));

/* The Climb: il motore e i contenuti li paga solo chi apre il gioco. */
export const TheClimbPagePigra = lazy(() => import('./TheClimbPage'));
export const PartitaTheClimbPagePigra = lazy(() => import('./PartitaTheClimbPage'));
export const EnciclopediaTheClimbPagePigra = lazy(() => import('./EnciclopediaTheClimbPage'));
export const ClassificaTheClimbPagePigra = lazy(() => import('./ClassificaTheClimbPage'));
