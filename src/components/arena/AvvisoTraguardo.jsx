import { useEffect, useState } from 'react';
import { traguardoById } from '../../game/contenuti/traguardi';

/** Quanto resta a schermo un avviso, in millisecondi; l'uscita e' compresa. */
const DURATA = 3600;

/** Un avviso solo: entra, sta, esce, e dice quando ha finito. Con la `key` sull'id, ogni traguardo ricomincia da capo. */
function Uno({ id, onFatto }) {
  const [uscita, setUscita] = useState(false);
  useEffect(() => {
    const esce = setTimeout(() => setUscita(true), DURATA - 400);
    const fine = setTimeout(() => onFatto(id), DURATA);
    return () => { clearTimeout(esce); clearTimeout(fine); };
  }, [id, onFatto]);
  const t = traguardoById(id);
  if (!t) return null;
  return (
    <div className={`arena-avviso${uscita ? ' is-esce' : ''}`} role="status" aria-live="polite">
      <span className="arena-avviso-segno" aria-hidden="true">★</span>
      <span className="arena-avviso-testo">
        <small>Traguardo sbloccato</small>
        <b>{t.nome}</b>
        <span>{t.descrizione}</span>
      </span>
    </div>
  );
}

/**
 * L'avviso di un traguardo sbloccato: in alto a sinistra, entra, sta
 * qualche secondo, esce. Uno alla volta: gli altri aspettano in coda.
 *
 * `coda` sono gli id in attesa; `onFatto` si chiama quando il primo ha
 * finito, e chi tiene la coda lo toglie. I timer vivono nell'effetto e si
 * cancellano allo smontaggio: niente resta appeso.
 */
export default function AvvisoTraguardo({ coda, onFatto }) {
  const id = coda[0];
  if (!id) return null;
  return <Uno key={id} id={id} onFatto={onFatto} />;
}
