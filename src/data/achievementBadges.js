/**
 * Le immagini delle medaglie degli achievement.
 *
 * Nessuna immagine viene generata: si cercano soltanto i file in
 * `src/assets/achievements/`, e finche' non ci sono il componente disegna un
 * segnaposto. Sostituire un segnaposto con la medaglia vera vuol dire
 * aggiungere un file col nome giusto — nessun codice da toccare.
 *
 * Nomi riconosciuti, dal piu' specifico al piu' generico:
 *
 *   closer-unlocked.png   la medaglia da ottenuta
 *   closer-locked.png     la stessa, da conquistare
 *   closer.png            una sola immagine per i due stati
 *   default-unlocked.png / default-locked.png / default.png
 *
 * Una definizione puo' anche indicare il proprio file nel campo `badgeImage`:
 * in quel caso vince su tutto.
 */

const files = import.meta.glob('../assets/achievements/*.png', { eager: true, import: 'default' });

const byName = Object.fromEntries(
  Object.entries(files).map(([percorso, url]) => [percorso.split('/').pop().replace('.png', ''), url])
);

export const BADGE_ACHIEVEMENT_DISPONIBILI = Object.keys(byName).sort();

export function badgeAchievement(definizione, { ottenuto = false } = {}) {
  if (!definizione) return null;
  const stato = ottenuto ? 'unlocked' : 'locked';
  const candidati = [];
  if (definizione.badgeImage) {
    if (definizione.badgeImage.startsWith('/') || definizione.badgeImage.startsWith('data:')) {
      return definizione.badgeImage;
    }
    candidati.push(`${definizione.badgeImage}-${stato}`, definizione.badgeImage);
  }
  candidati.push(`${definizione.id}-${stato}`, definizione.id, `default-${stato}`, 'default');
  for (const nome of candidati) if (byName[nome]) return byName[nome];
  return null;
}
