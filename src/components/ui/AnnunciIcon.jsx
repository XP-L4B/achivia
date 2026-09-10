/**
 * L'altoparlante degli annunci di lavoro.
 *
 * Un annuncio e' l'unica cosa che un'organizzazione grida a chi non la
 * conosce: nessun'altra icona dell'app dice quel verso li'. Le altre
 * portano dentro — le quest, i dati, la propria org — questa porta fuori.
 *
 * Il tracciato sta qui e non dentro la barra di navigazione perche' lo
 * usano tutte e due, e due copie dello stesso disegno prima o poi
 * diventano due disegni diversi. E' solo il tracciato, senza `<svg>`
 * intorno: chi lo usa decide la misura, lo spessore e il colore, e la barra
 * li ha gia' decisi per tutte le sue voci.
 */
export function TracciatoAnnunci() {
  return (
    <>
      <path d="M3.5 9.5h3l9-4.5v14l-9-4.5h-3A1.5 1.5 0 0 1 2 13v-2a1.5 1.5 0 0 1 1.5-1.5z" />
      <path d="M19 9.2a4 4 0 0 1 0 5.6" />
      <path d="M7.5 15.5V19a1.5 1.5 0 0 0 3 0v-2.2" />
    </>
  );
}

/* Il tratto e' tarato sul riquadro del profilo: a 56 pixel il viewBox si
   ingrandisce di due volte e un terzo, e uno spessore di due diventa 4,7 —
   la stessa aria del calendario di Time & Attendance, che gli sta accanto
   nella griglia. Due icone della stessa fila con pesi diversi si vedono
   subito, e si vede che una delle due e' arrivata dopo. */
export default function AnnunciIcon({ size = 56, spessore = 2, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={spessore}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <TracciatoAnnunci />
    </svg>
  );
}
