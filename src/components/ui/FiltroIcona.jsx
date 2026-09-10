/**
 * L'imbuto dei filtri, con la freccia che dice che si apre.
 *
 * Due forme piene e nessun tratto: a sedici pixel una linea sottile
 * sparisce, e questa icona vive dentro un pulsante piccolo. La freccia sta
 * staccata in basso a destra invece che attaccata all'imbuto perche' non e'
 * parte dell'imbuto — dice "qui sotto c'e' altro", ed e' lei a girarsi
 * quando il menu e' aperto.
 */
export default function FiltroIcona({ size = 18, aperto = false, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M2.7 2.3h13.6a1.2 1.2 0 0 1 .94 1.95l-5.74 7.2v7.1a1.2 1.2 0 0 1-2.05.85l-1.9-1.9a1.2 1.2 0 0 1-.35-.85v-5.2L1.76 4.25A1.2 1.2 0 0 1 2.7 2.3Z" />
      <path
        d="M13 15h9l-4.5 5.6z"
        style={{
          transformOrigin: '17.5px 17.8px',
          transform: aperto ? 'rotate(180deg)' : 'none',
          transition: 'transform var(--mo-istante) var(--mo-uscita)',
        }}
      />
    </svg>
  );
}
