/**
 * Pulsante largo con icona a sinistra ed etichetta: la forma usata in
 * "Accetta / Rifiuta / Chiedi informazioni" dei mockup.
 */
export default function ActionRow({ icon, label, onClick, tone = '', type = 'button' }) {
  return (
    <button type={type} className={`ui-action ${tone}`.trim()} onClick={onClick}>
      {typeof icon === 'string' ? <img src={icon} alt="" /> : icon}
      <span>{label}</span>
    </button>
  );
}
