import { areaDi, accessoOsservatorio } from '../../data/permessi';

/**
 * Le voci della barra di navigazione, per area.
 *
 * Stavano dentro i tre guscî — dipendente, manager, negozio — e finche' la
 * barra era solo loro andava bene. Adesso la vuole anche una pagina
 * condivisa (la lega), che non sa in che area si trova chi la guarda: le
 * voci escono di li' e diventano una cosa sola, altrimenti la stessa barra
 * finirebbe scritta due volte e prima o poi le due copie divergerebbero.
 *
 * Il marchio sta al centro, con due voci per lato: e' la disposizione dei
 * mockup, e il numero delle voci e' dispari apposta. Il negozio fa
 * eccezione da quando la sua uscita sta qui: quattro voci, e il marchio non
 * cade esattamente in mezzo.
 */

export const TABS_DIPENDENTE = [
  { label: 'Profilo',   to: '/employee/profile',   icon: 'home' },
  { label: 'Quest',     to: '/employee/quests',    icon: 'team' },
  { label: 'Achivia',   to: '/employee/profile',   brand: true },
  { label: 'Analytics', to: '/employee/analytics', icon: 'analytics' },
  { label: 'Menu',      to: '/employee/menu',      icon: 'menu' },
];

// La casetta e' uscita: portava al profilo esattamente come il marchio, e con
// l'arrivo degli Achievement le voci erano diventate sei — un numero pari, in
// cui il centro non esiste e il logo finiva spostato di mezzo posto.
export const TABS_GESTIONE = [
  { label: 'Gestione',     to: '/manager/management',   icon: 'team' },
  { label: 'Dati',         to: '/manager/data',         icon: 'analytics' },
  { label: 'Achivia',      to: '/manager/profile',      brand: true },
  { label: 'Achievements', to: '/manager/achievements', icon: 'trofeo' },
  { label: 'Menu',         to: '/manager/menu',         icon: 'menu' },
];

// Chi tiene il negozio non ha la barra delle organizzazioni — quest,
// competenze, persone: vende, e vede solo quello che gli serve per vendere.
//
// L'uscita e' una voce della barra e non un pulsante in fondo alla pagina:
// il negozio e' una postazione di lavoro, spesso condivisa, e chi stacca la
// cerca dove cerca tutto il resto. Non porta da nessuna parte — `azione`
// invece di `to` — ed e' l'unica voce di tutta l'app fatta cosi': gli altri
// account escono dal menu, che loro hanno e il negozio no.
export const TABS_NEGOZIO = [
  { label: 'Articoli', to: '/shop/articoli', icon: 'negozio' },
  { label: 'Cassa',    to: '/shop/cassa',    icon: 'cassa' },
  { label: 'Negozio',  to: '/shop',          brand: true },
  { label: 'Ordini',   to: '/shop/ordini',   icon: 'ordini' },
  { label: 'Esci',     azione: 'logout',     icon: 'esci' },
];

// L'osservatorio guarda il mercato, non un'organizzazione: le sue voci
// sono le tavole che sa leggere, e nient'altro.
//
// Sono le uniche due voci dell'app che stanno su lati diversi del marchio
// per numero e non per famiglia: da quando c'e' anche la domanda di lavoro
// le tavole sono quattro, e il marchio non cade piu' esattamente in mezzo.
// Tenerlo al centro avrebbe voluto dire togliere una tavola dalla barra,
// che e' l'unico posto da cui questa dashboard si naviga.
export const TABS_OSSERVATORIO = [
  { label: 'Competenze', to: '/osservatorio/competenze', icon: 'analytics' },
  { label: 'Profili',    to: '/osservatorio/profili',    icon: 'team' },
  // Si chiama come l'area, non come una delle sue tavole: "Mercato" era il
  // nome della schermata del colpo d'occhio, e da fuori sembrava che
  // l'osservatorio fosse una cosa e il mercato un'altra.
  { label: 'Osservatorio', to: '/osservatorio',          brand: true },
  { label: 'Annunci',    to: '/osservatorio/annunci',    icon: 'annunci' },
  { label: 'Mobilita',   to: '/osservatorio/mobilita',   icon: 'trofeo' },
  { label: 'Musica',     azione: 'musica' },
  { label: 'Esci',       azione: 'logout', icon: 'esci' },
];

/* La barra di chi entra nell'osservatorio dal proprio piano invece che con
   l'account dell'osservatorio.
   Due differenze da quella di casa, e sono tutte e due necessarie: ci sono
   solo le tavole che il piano apre — una barra che porta in tre posti
   chiusi a chiave non serve a niente — e al posto dell'uscita c'e' il
   ritorno alla propria dashboard. Chi e' entrato di qui non e' uscito da
   nessuna parte: sta guardando il mercato con la sessione della sua
   azienda, e "Esci" gli avrebbe chiuso quella. */
export const TABS_OSSERVATORIO_PROFILI = [
  { label: 'Profili',      to: '/osservatorio/profili', icon: 'team' },
  { label: 'Osservatorio', to: '/osservatorio/profili', brand: true },
  { label: 'Indietro',     to: '/admin',                icon: 'home' },
];

export const TABS_OSSERVATORIO_OSPITE = [
  { label: 'Competenze',   to: '/osservatorio/competenze', icon: 'analytics' },
  { label: 'Profili',      to: '/osservatorio/profili',    icon: 'team' },
  { label: 'Osservatorio', to: '/osservatorio',            brand: true },
  { label: 'Annunci',      to: '/osservatorio/annunci',    icon: 'annunci' },
  { label: 'Mobilita',     to: '/osservatorio/mobilita',   icon: 'trofeo' },
  { label: 'Indietro',     to: '/admin',                   icon: 'home' },
];

/**
 * La barra dentro l'osservatorio, per chi lo sta guardando.
 *
 * L'account dell'osservatorio ha la sua, con la musica e l'uscita. Chi
 * arriva dal piano ha quella ridotta alle tavole che gli spettano.
 */
export function tabsOsservatorio(persona) {
  if (persona?.role === 'osservatorio') return TABS_OSSERVATORIO;
  const accesso = accessoOsservatorio(persona);
  if (accesso === 'profili') return TABS_OSSERVATORIO_PROFILI;
  if (accesso === 'completo') return TABS_OSSERVATORIO_OSPITE;
  return TABS_OSSERVATORIO;
}

/* Il Castello: la dashboard con cui si tiene in piedi l'applicazione.
 *
 * Cinque voci come le aree delle organizzazioni, e il marchio al centro
 * porta al polso — che e' la prima cosa che si guarda entrando e l'unica
 * che si guarda tutti i giorni. Le tre sezioni che si aprono di rado — le
 * offerte, chi ha guardato che cosa, le leve — stanno nel menu: metterle
 * nella barra avrebbe voluto dire otto voci, e una barra da otto voci non
 * e' piu' una barra. */
export const TABS_CASTELLO = [
  { label: 'Organizzazioni', to: '/castle/organizzazioni', icon: 'team' },
  { label: 'Listino',        to: '/castle/listino',        icon: 'negozio' },
  { label: 'Castello',       to: '/castle',                brand: true },
  { label: 'CRM',            to: '/castle/crm',            icon: 'analytics' },
  { label: 'Menu',           to: '/castle/menu',           icon: 'menu' },
];

/**
 * La barra di chi sta guardando. `null` per chi non e' entrato: una barra
 * che porta in cinque posti chiusi a chiave non serve a niente.
 */
export function tabsPer(persona) {
  if (!persona) return null;
  const area = areaDi(persona);
  if (area === 'shop') return TABS_NEGOZIO;
  if (area === 'osservatorio') return TABS_OSSERVATORIO;
  if (area === 'castle') return TABS_CASTELLO;
  /* Senza un canale aperto non c'e' barra: le sue voci portano nelle
     schermate di un'organizzazione, e quale non e' ancora stato deciso.
     Il negozio, l'osservatorio e il Castello stanno sopra questa riga
     apposta — vivono fuori dalle organizzazioni e una barra ce l'hanno
     sempre. */
  if (!persona.orgId) return null;
  if (area === 'admin' || area === 'manager') return TABS_GESTIONE;
  if (area === 'employee') return TABS_DIPENDENTE;
  return null;
}

/** Dove porta il marchio in cima alla pagina, per la stessa persona. */
export function casaDi(persona) {
  const tabs = tabsPer(persona);
  return tabs?.find((t) => t.brand)?.to ?? null;
}

/**
 * Il menu di chi guarda. Il negozio e l'osservatorio non ce l'hanno: la
 * loro uscita sta nella barra, e sopra la barra non c'e' altro.
 */
export function menuDi(persona) {
  const area = areaDi(persona);
  if (area === 'castle') return '/castle/menu';
  if (area === 'employee') return '/employee/menu';
  if (area === 'admin' || area === 'manager') return '/manager/menu';
  return casaDi(persona);
}

/**
 * Quello che la mappa della risalita deve sapere di chi guarda, gia'
 * risolto: `risalita.js` non conosce ne' i ruoli ne' i permessi, e non
 * deve conoscerli. Sa la forma dell'applicazione; chi la guarda lo dice
 * questo file, che e' lo stesso che decide dove porta la barra.
 */
export function doveSi(persona) {
  return {
    entrato: Boolean(persona),
    ruolo: persona?.role ?? null,
    area: persona ? areaDi(persona) : null,
    casa: casaDi(persona),
    menu: persona ? menuDi(persona) : null,
  };
}
