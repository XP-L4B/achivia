/**
 * Le competenze che un'organizzazione puo' chiedere in un annuncio di
 * lavoro: le cento del mestiere, piu' le otto trasversali che il catalogo
 * aveva gia'.
 *
 * Non sono un elenco a parte. Erano cinquanta voci scritte qui, con dei
 * nomi loro, e non volevano dire niente per il resto dell'applicazione:
 * un'azienda poteva chiedere "Saldatura" in bacheca e certificare
 * "Saldatura" ai suoi, e le due parole restavano due parole diverse. Adesso
 * questo file tiene solo dei riferimenti al catalogo standard, e i nomi, le
 * famiglie e le medaglie stanno dove stanno quelli di tutte le altre
 * competenze.
 *
 * Il catalogo ne ha ancora qualcuna in piu': le otto soft che in un annuncio
 * non si chiedono — la resilienza, l'intelligenza emotiva, la creativita' —
 * si certificano e basta. Per questo l'elenco resta un elenco e non "tutto
 * il catalogo".
 *
 * Le competenze in un annuncio restano facoltative: centootto voci sono
 * tante, ma non sono tutti i mestieri del mondo, e la descrizione resta il
 * posto in cui si scrive quello che manca.
 */

import { SKILL_CATEGORIES, SKILLS_STANDARD, skillStandardById } from './skillsCatalog';

/* Per identificativo del catalogo. L'ordine non conta: a ordinare ci pensa
   la famiglia, che e' la stessa dello Skill Tree. */
const RICHIESTE = [
  // Digitale e dati
  'fogli-calcolo', 'analisi-dati', 'sql', 'business-intelligence', 'python',
  'javascript', 'sviluppo-web', 'sviluppo-backend', 'cloud', 'cybersecurity',
  'intelligenza-artificiale', 'automazione', 'reti-sistemi', 'devops',
  'mobile', 'ux-ui', 'gestione-prodotto', 'blockchain', 'gis',
  'supporto-informatico',
  // Tecnica e produzione
  'sicurezza-lavoro', 'manutenzione-meccanica', 'manutenzione-elettrica',
  'saldatura', 'cad', 'cnc', 'automazione-industriale', 'robotica',
  'controllo-qualita', 'logistica', 'idraulica', 'refrigerazione',
  'edilizia', 'carpenteria', 'lean-produzione', 'stampa-3d',
  // Commerciale e clienti
  'vendita', 'gestione-clienti', 'assistenza-clienti', 'marketing-digitale',
  'social-content', 'seo-sem', 'retail', 'e-commerce', 'crm',
  'ricerche-mercato', 'comunicazione-istituzionale', 'export',
  // Amministrazione e finanza
  'contabilita', 'fatturazione', 'controllo-gestione', 'paghe', 'acquisti',
  'compliance', 'fiscale', 'tesoreria', 'analisi-finanziaria', 'revisione',
  'appalti', 'privacy-dati',
  // Persone e organizzazione
  'project-management', 'metodi-agili', 'selezione', 'gestione-cambiamento',
  'relazioni-sindacali', 'valutazione-performance', 'organizzazione-eventi',
  'gestione-rischi', 'segreteria',
  // Cura e salute
  'assistenza-sanitaria', 'primo-soccorso', 'assistenza-persona',
  'riabilitazione', 'farmacia', 'laboratorio-analisi',
  // Creatività e media
  'grafica', 'fotografia', 'video', 'scrittura', 'illustrazione',
  'musica-produzione',
  // Ospitalità e servizi
  'cucina', 'panificazione', 'sala-bar', 'accoglienza', 'turismo',
  // Ambiente ed energia
  'agricoltura', 'sostenibilita', 'energie-rinnovabili',
  // Lingue
  'inglese', 'tedesco', 'francese', 'spagnolo', 'portoghese', 'arabo',
  'cinese', 'russo', 'italiano', 'olandese', 'hindi', 'bengalese',
  'indonesiano', 'giapponese',
  // Nei rami di sempre: negoziare, insegnare, organizzarsi
  'negoziazione',
  'pianificazione',
  'formazione',
  // Queste il catalogo le aveva gia', ed e' giusto cosi': "Communication"
  // certificata da un'azienda e "comunicazione" chiesta da un'altra devono
  // essere la stessa cosa, o non si contano insieme.
  'communication', 'teamwork', 'adaptability', 'problem-solving',
  'critical-thinking', 'ownership', 'time-management', 'leadership',
];

/** Come le tiene il catalogo: nome, famiglia, tipo, medaglia. */
export const COMPETENZE_RICHIESTE = RICHIESTE
  .map((id) => skillStandardById(id))
  .filter(Boolean);

/* Due controlli che scattano alla prima riga eseguita invece che fra sei
   mesi: un identificativo che non trova la sua competenza toglierebbe una
   voce dalla tendina senza dirlo a nessuno, e uno ripetuto la metterebbe
   due volte. */
if (COMPETENZE_RICHIESTE.length !== RICHIESTE.length) {
  const mancanti = RICHIESTE.filter((id) => !skillStandardById(id));
  throw new Error(`Competenze richieste non nel catalogo: ${mancanti.join(', ')}`);
}
if (new Set(RICHIESTE).size !== RICHIESTE.length) {
  const visti = new Set();
  const doppie = RICHIESTE.filter((id) => (visti.has(id) ? true : (visti.add(id), false)));
  throw new Error(`Competenze richieste ripetute: ${[...new Set(doppie)].join(', ')}`);
}

const NEL_MENU = new Set(RICHIESTE);

/** Le famiglie che servono davvero alla tendina, nell'ordine del catalogo. */
export const GRUPPI_COMPETENZE = SKILL_CATEGORIES
  .filter((c) => COMPETENZE_RICHIESTE.some((s) => s.categoria === c.id))
  .map((c) => ({ id: c.id, nome: c.label }));

/** Le voci di una famiglia, per l'`optgroup` della tendina. */
export const competenzeDiGruppo = (gruppo) =>
  COMPETENZE_RICHIESTE.filter((s) => s.categoria === gruppo);

export const competenzaById = (id) => (NEL_MENU.has(id) ? skillStandardById(id) : null);

/** Il nome da mostrare. Vale per qualunque competenza del catalogo, anche
    per una che nella tendina non c'e': un annuncio vecchio non diventa muto
    perche' l'elenco e' cambiato. */
export const nomeCompetenza = (id) =>
  SKILLS_STANDARD.find((s) => s.id === id)?.name || String(id || '');
