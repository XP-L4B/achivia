/**
 * L'icona di The Climb: una montagna a gradini e una bandierina in cima.
 * Disegnata a vettori e non a pixel perche' sta accanto alle altre due
 * icone dell'hub, che sono di misure diverse, e un SVG si adatta senza
 * sfocarsi. Prende il colore del testo intorno.
 */
export default function ClimbIcon({ size = 44, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
      <path d="M2 40h40" />
      <path d="M4 40 L12 32 L12 26 L18 26 L18 19 L24 19 L24 12 L30 12 L30 6 L34 6" />
      <path d="M30 40 L30 26 L36 20 L42 26 L42 40" opacity="0.5" />
      <path d="M34 6 h6 l-2 2.5 2 2.5 h-6z" fill="currentColor" stroke="none" />
    </svg>
  );
}
