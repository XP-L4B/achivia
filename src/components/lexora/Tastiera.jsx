/**
 * Quello che si sa delle lettere, finora.
 *
 * Non e' una tastiera per scrivere — si scrive con la propria — e' la
 * memoria dei tentativi: ogni lettera provata col colore migliore che ha
 * preso. Serve a non riprovare una lettera che si e' gia' vista grigia,
 * che e' l'errore piu' comune quando si tiene tutto a mente.
 */
const RIGHE = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];

export default function Tastiera({ stato = {} }) {
  const usate = Object.keys(stato).length;
  if (usate === 0) return null;
  return (
    <div className="lex-tastiera" aria-label="Le lettere che hai già provato">
      {RIGHE.map((riga) => (
        <div key={riga} className="lex-tastiera-riga">
          {[...riga].map((l) => (
            <span key={l} className={`lex-tasto${stato[l] ? ` is-${stato[l]}` : ''}`}>{l}</span>
          ))}
        </div>
      ))}
    </div>
  );
}
