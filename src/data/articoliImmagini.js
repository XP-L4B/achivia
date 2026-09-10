// Le immagini che un articolo del negozio puo' portare.
//
// Due strade, e la seconda e' quella che si usa tutti i giorni:
//
//   quelle della cartella   i disegni che arrivano col progetto, in
//                           `src/assets/negozio/`
//   quelle caricate         un file scelto da chi tiene il negozio, ridotto
//                           qui nel browser e salvato nel deposito
//
// Un articolo tiene solo il nome della sua immagine: `mug` per le prime,
// `img-...` per le seconde. Cosi' la stessa immagine caricata puo' stare in
// un articolo e in dieci ordini senza esserci scritta undici volte.

import { addImmagine, getImmagineDati } from './db';

const files = import.meta.glob('../assets/negozio/*.png', { eager: true, import: 'default' });

const nomeFile = (percorso) => percorso.split('/').pop().replace('.png', '');

export const IMMAGINI_ARTICOLO = Object.entries(files)
  .map(([percorso, url]) => ({ id: nomeFile(percorso), url }))
  .sort((a, b) => a.id.localeCompare(b.id));

/** L'immagine da mostrare, qualunque delle due strade sia arrivata. */
export function immagineArticolo(chiave) {
  if (!chiave) return null;
  const dalProgetto = IMMAGINI_ARTICOLO.find((i) => i.id === chiave);
  if (dalProgetto) return dalProgetto.url;
  return getImmagineDati(chiave);
}

/* ─── Caricare un'immagine ───────────────────────────────────
   Il deposito e' `localStorage`: cinque megabyte scarsi per tutta l'app,
   e ogni immagine ci sta dentro come testo, che occupa un terzo in piu'
   dei byte del file. Una foto da telefono, cosi' com'e', se ne
   mangerebbe da sola tutto lo spazio.

   Quindi l'immagine non si salva com'e': si ridisegna piu' piccola qui
   nel browser, prima di toccare il deposito. Si prova a 400 pixel di
   lato, poi a 320, poi a 256, e ci si ferma appena sta sotto i 180
   kilobyte. Le immagini con il fondo trasparente restano PNG — un
   articolo ritagliato su un fondo scuro, schiacciato in JPEG, si
   ritroverebbe un rettangolo nero attorno — ma se dopo tre tentativi
   sono ancora troppo grandi si passa al JPEG, perche' un fondo nero e'
   meno peggio di un'immagine che non si puo' salvare. */

const LATI = [400, 320, 256];
const PESO_MASSIMO = 180 * 1024;
const CON_TRASPARENZA = ['image/png', 'image/webp', 'image/gif'];

const leggi = (file) => new Promise((risolvi, rifiuta) => {
  const lettore = new FileReader();
  lettore.onload = () => risolvi(lettore.result);
  lettore.onerror = () => rifiuta(new Error('lettura'));
  lettore.readAsDataURL(file);
});

const disegna = (sorgente) => new Promise((risolvi, rifiuta) => {
  const img = new Image();
  img.onload = () => risolvi(img);
  img.onerror = () => rifiuta(new Error('formato'));
  img.src = sorgente;
});

/** L'immagine ridisegnata dentro un quadrato di `lato`, senza deformarla. */
function riduci(img, lato, formato) {
  const scala = Math.min(1, lato / Math.max(img.width, img.height));
  const tela = document.createElement('canvas');
  tela.width = Math.max(1, Math.round(img.width * scala));
  tela.height = Math.max(1, Math.round(img.height * scala));
  const pennello = tela.getContext('2d');
  pennello.imageSmoothingQuality = 'high';
  pennello.drawImage(img, 0, 0, tela.width, tela.height);
  return formato === 'image/png'
    ? tela.toDataURL('image/png')
    : tela.toDataURL('image/jpeg', 0.82);
}

/**
 * Prende il file scelto e restituisce il nome con cui l'articolo potra'
 * chiamarlo: `{ ok: true, chiave }`, oppure il motivo per cui non si e'
 * potuto fare.
 */
export async function caricaImmagine(file) {
  if (!file) return { ok: false, errore: 'Nessun file scelto.' };
  if (!String(file.type).startsWith('image/')) {
    return { ok: false, errore: 'Questo non e’ un’immagine.' };
  }

  let img;
  try {
    img = await disegna(await leggi(file));
  } catch {
    return { ok: false, errore: 'Non sono riuscito ad aprire questa immagine.' };
  }

  const formato = CON_TRASPARENZA.includes(file.type) ? 'image/png' : 'image/jpeg';
  let dati = null;
  for (const lato of LATI) {
    dati = riduci(img, lato, formato);
    if (dati.length <= PESO_MASSIMO) break;
  }
  // Ultima spiaggia per un PNG che non si comprime: il fondo trasparente
  // diventa nero, ma l'immagine si salva.
  if (dati.length > PESO_MASSIMO && formato === 'image/png') {
    dati = riduci(img, LATI[LATI.length - 1], 'image/jpeg');
  }
  if (dati.length > PESO_MASSIMO) {
    return { ok: false, errore: 'Immagine troppo pesante: provane una piu’ semplice.' };
  }

  const salvata = addImmagine(dati);
  if (!salvata) {
    return { ok: false, errore: 'Non c’e’ piu’ spazio nel browser per un’altra immagine.' };
  }
  return { ok: true, chiave: salvata.id, dati };
}
