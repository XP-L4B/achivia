/**
 * Immagini delle medaglie.
 *
 * Le medaglie vere arrivano come file in `src/assets/skills/`: qui non si
 * disegna nulla, si va solo a cercarle. Finche' un file non c'e', il badge
 * viene disegnato dal componente SkillBadge come segnaposto tecnico, cosi'
 * la pagina funziona da subito e sostituire un segnaposto con la medaglia
 * definitiva significa solo aggiungere un file con il nome giusto.
 *
 * Nomi riconosciuti, dal piu' specifico al piu' generico:
 *
 *   <skillId>-<livello>.png    communication-3.png   una medaglia per livello
 *   <skillId>.png              communication.png     una medaglia per la competenza
 *   <skillId>-revoked.png      communication-revoked.png
 *   default-<livello>.png      default-3.png         valida per tutte le competenze
 *   default.png                                      l'ultima spiaggia
 *   default-revoked.png
 *
 * Le competenze create dai manager hanno un id generato, che nessun file
 * puo' indovinare: scelgono la medaglia dal modulo di creazione fra le
 * famiglie di `src/assets/skills/custom/`. Il campo `badgeImage` tiene solo
 * il nome della famiglia (`custom-07`) e il livello viene aggiunto qui:
 * cosi' una competenza personalizzata cambia metallo salendo di grado
 * esattamente come una soft skill standard.
 */

/* PNG e WebP insieme. Le sessantaquattro medaglie delle soft skill sono
   arrivate in PNG e li' restano; le famiglie del mestiere sono
   duecentottantotto file, e in PNG avrebbero pesato quattro volte tanto per
   una differenza che a occhio non c'e' — mezzo livello di grigio su
   duecentocinquantacinque. Il nome del file resta la sola cosa che conta:
   l'estensione la toglie `nomeDi`, e da li' in poi una medaglia e' una
   medaglia. */
const filesStandard = import.meta.glob('../assets/skills/*.{png,webp}', { eager: true, import: 'default' });
const filesCustom = import.meta.glob('../assets/skills/custom/*.{png,webp}', { eager: true, import: 'default' });

const nomeDi = (percorso) => percorso.split('/').pop().replace(/\.(png|webp)$/, '');

const byName = Object.fromEntries(
  [...Object.entries(filesStandard), ...Object.entries(filesCustom)].map(([percorso, url]) => [
    nomeDi(percorso),
    url,
  ])
);

/** Elenco dei nomi disponibili: serve al modulo di creazione di una skill. */
export const BADGE_DISPONIBILI = Object.keys(byName).sort();

/**
 * Le famiglie fra cui il manager sceglie quando crea una competenza: un
 * disegno per famiglia, nei quattro metalli. Una famiglia entra in elenco
 * solo se ha tutti e quattro i livelli, perche' scegliere una medaglia che
 * sparisce al secondo grado sarebbe una promessa non mantenuta.
 *
 * Sono centoventi: le quarantotto di sempre piu' le settantadue del
 * mestiere. Queste ultime sono arrivate in bronzo e basta — argento, oro e
 * diamante sono stati ricavati misurando i quattro metalli sulle
 * quarantotto che c'erano gia', cosi' la scala dei gradi e' la stessa per
 * tutte e centoventi.
 */
export const BADGE_FAMIGLIE = (() => {
  const perFamiglia = {};
  for (const percorso of Object.keys(filesCustom)) {
    const nome = nomeDi(percorso);
    const m = nome.match(/^(.+)-([1-4])$/);
    if (!m) continue;
    (perFamiglia[m[1]] ||= {})[Number(m[2])] = byName[nome];
  }
  return Object.keys(perFamiglia)
    .filter((id) => [1, 2, 3, 4].every((l) => perFamiglia[id][l]))
    .sort()
    .map((id) => ({ id, livelli: perFamiglia[id] }));
})();

export const badgePerNome = (nome) => byName[nome] ?? null;

const eUnPercorso = (nome) =>
  typeof nome === 'string' && (nome.startsWith('/') || nome.startsWith('data:'));

/**
 * Immagine da usare per una competenza in un certo stato e livello.
 * Restituisce `null` quando non c'e' nessun file: il chiamante disegna il
 * segnaposto.
 */
export function badgeFor(skill, { stato = 'available', livello = null } = {}) {
  if (!skill) return null;

  const candidati = [];
  const scelta = skill.badgeImage;
  if (scelta) {
    // Un percorso gia' pronto si usa com'e'; un nome di famiglia prende il livello.
    if (eUnPercorso(scelta)) return scelta;
    if (stato === 'revoked') candidati.push(`${scelta}-revoked`);
    if (livello) candidati.push(`${scelta}-${livello}`);
    candidati.push(scelta, `${scelta}-1`);
  }

  if (stato === 'revoked') {
    candidati.push(`${skill.id}-revoked`, 'default-revoked');
  }
  if (livello) {
    candidati.push(`${skill.id}-${livello}`);
  }
  candidati.push(skill.id);
  // Una competenza non ancora certificata non ha un livello: si mostra la
  // medaglia del primo grado, attenuata dal componente. Vedere la medaglia
  // che si puo' conquistare dice piu' di un segnaposto anonimo.
  candidati.push(`${skill.id}-1`);
  if (livello) {
    candidati.push(`default-${livello}`);
  }
  candidati.push('default', 'default-1');

  for (const nome of candidati) {
    if (byName[nome]) return byName[nome];
  }
  return null;
}
