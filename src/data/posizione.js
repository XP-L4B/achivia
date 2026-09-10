/**
 * Dove sta una persona, con la precisione giusta e non una di piu'.
 *
 * Chi cerca lavoro puo' voler essere trovato «vicino», e chi cerca persone
 * ha bisogno di sapere chi e' a portata. Ma «vicino» non richiede di sapere
 * dove qualcuno abita, e qui la differenza fra le due cose e' l'intero
 * progetto.
 *
 * LA GRIGLIA. La posizione non si salva mai com'e' arrivata: si aggancia a
 * una griglia di cinque chilometri, una volta sola, al momento di scriverla.
 * Da quel momento l'informazione fine non esiste piu' da nessuna parte —
 * non e' nascosta, non e' filtrata all'uscita, non c'e'.
 *
 * E' l'unica difesa che regge davvero. Se si salvasse la posizione esatta e
 * si arrotondasse solo mostrandola, chi cerca potrebbe fare tre ricerche con
 * raggio piccolo da tre punti diversi e incrociare i risultati: tre cerchi
 * si intersecano in un punto, e quel punto e' casa di qualcuno. Con la
 * griglia non serve a niente insistere — mille ricerche danno la stessa
 * cella di una.
 *
 * Le altre due difese sono di contorno ma restano: il raggio minimo e'
 * dieci chilometri, e a schermo si dice «entro venticinque», mai «a tre
 * virgola due».
 *
 * Il permesso lo da' la persona, una volta, e si revoca come tutto il resto.
 * Chi non lo da' resta comunque cercabile per distanza: si usa il centro
 * della zona che ha dichiarato, e la scheda dice che e' quello.
 */

const RAGGIO_TERRA_KM = 6371;
const KM_PER_GRADO_LAT = 111.32;

/** Il lato della cella. Cambiarlo qui cambia la precisione ovunque. */
export const PASSO_GRIGLIA_KM = 5;

/** Sotto i dieci chilometri non si cerca: e' li' che il cerchio diventa un dito puntato. */
export const RAGGIO_MINIMO_KM = 10;

export const RAGGI = [10, 25, 50, 100, 200];

const radianti = (g) => (g * Math.PI) / 180;

/**
 * Aggancia una posizione alla griglia.
 *
 * In latitudine un grado vale sempre gli stessi chilometri; in longitudine
 * no — si stringono avvicinandosi ai poli. Il passo in longitudine si
 * calcola percio' alla latitudine della cella, altrimenti a Oslo le celle
 * sarebbero larghe la meta' che a Palermo e la promessa dei cinque
 * chilometri varrebbe solo all'equatore.
 */
export function aggancia(lat, lon) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const passoLat = PASSO_GRIGLIA_KM / KM_PER_GRADO_LAT;
  const laty = Math.round(lat / passoLat) * passoLat;

  // Vicino ai poli il coseno va a zero e il passo esploderebbe: si tiene un
  // fondo, che oltre l'ottantacinquesimo parallelo non cambia la vita a
  // nessuno.
  const kmPerGradoLon = Math.max(KM_PER_GRADO_LAT * Math.cos(radianti(laty)), 1);
  const passoLon = PASSO_GRIGLIA_KM / kmPerGradoLon;
  const lony = Math.round(lon / passoLon) * passoLon;

  return {
    lat: Number(laty.toFixed(4)),
    lon: Number(lony.toFixed(4)),
  };
}

/** Quanti chilometri ci sono fra due punti, in linea d'aria. */
export function distanzaKm(a, b) {
  if (!a || !b) return null;
  const dLat = radianti(b.lat - a.lat);
  const dLon = radianti(b.lon - a.lon);
  const s = Math.sin(dLat / 2) ** 2
    + Math.cos(radianti(a.lat)) * Math.cos(radianti(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * RAGGIO_TERRA_KM * Math.asin(Math.min(1, Math.sqrt(s)));
}

/**
 * La fascia in cui cade una distanza, che e' l'unica cosa che si mostra.
 * Un numero esatto direbbe piu' di quanto la griglia stessa garantisce, e
 * sarebbe anche falso: la cella e' larga cinque chilometri.
 */
export function fasciaDi(km) {
  if (km === null || km === undefined) return null;
  const scaglione = RAGGI.find((r) => km <= r);
  return scaglione ? `entro ${scaglione} km` : `oltre ${RAGGI[RAGGI.length - 1]} km`;
}

/**
 * Chiede la posizione al browser. Una volta sola, quando la persona preme
 * il pulsante: nessun ascolto continuo, niente in sottofondo.
 *
 * Torna gia' agganciata alla griglia — chi chiama non vede mai la posizione
 * esatta, cosi' non puo' nemmeno salvarla per sbaglio.
 */
export function chiediPosizione() {
  return new Promise((risolvi) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      risolvi({ ok: false, motivo: 'non-disponibile' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const cella = aggancia(p.coords.latitude, p.coords.longitude);
        risolvi(cella ? { ok: true, posizione: { ...cella, precisione: 'gps' } }
          : { ok: false, motivo: 'coordinate-non-valide' });
      },
      (errore) => risolvi({
        ok: false,
        motivo: errore?.code === 1 ? 'negato' : 'non-riuscito',
      }),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
    );
  });
}

/** Quanto vale, a parole, la precisione di una posizione. */
export const NOMI_PRECISIONE = {
  gps: `posizione approssimata a ${PASSO_GRIGLIA_KM} km`,
  area: 'centro dell’area dichiarata',
  paese: 'centro del paese dichiarato',
  continente: 'centro del continente dichiarato',
};
