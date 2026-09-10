import { useEffect, useRef, useState } from 'react';
import { tasto, campanello } from '../../giochi/theboss/suoni';

/**
 * Il testo che arriva a macchina da scrivere.
 *
 * Non e' un vezzo: serve a far sentire che **qualcuno sta parlando adesso**,
 * e a dare alla scena il tempo di una persona che entra e comincia a dire
 * la sua. Ma il tempo della giornata scorre, quindi la velocita' e' tarata
 * per costare poco — otto millesimi a carattere, cioe' poco piu' di due
 * secondi per la richiesta piu' lunga — e si puo' **saltare con un clic o
 * con un tasto qualsiasi**: chi ha gia' letto non deve aspettare la
 * macchina.
 *
 * Il suono non batte a ogni lettera. Una macchina da scrivere vera fa
 * cinque o sei colpi al secondo, non centoventi: si batte ogni terza
 * lettera e si salta lo spazio, e il risultato somiglia a qualcuno che
 * scrive invece che a una sega elettrica.
 *
 * Chi ha chiesto meno movimento (`prefers-reduced-motion`) vede il testo
 * intero subito, e non sente niente: l'effetto e' decorazione, e la
 * decorazione e' la prima cosa che si toglie quando qualcuno lo chiede.
 *
 * LA MACCHINA SI SEGUE DA SOLA. Sul telefono il fumetto e' basso e una
 * richiesta lunga non ci sta: senza far niente, le lettere nuove
 * finiscono sotto il bordo e si guarda una macchina da scrivere che
 * scrive fuori dal foglio. Percio' mentre batte il fumetto scorre dietro
 * al cursore, e quando ha finito torna in cima da solo — perche' a quel
 * punto il testo c'e' tutto e si legge dall'inizio, non dalla fine.
 */

const MS_PER_LETTERA = 8;
const OGNI_QUANTE_SI_BATTE = 3;

const menoMovimento = () => typeof matchMedia === 'function'
  && matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Chi la usa le da' una `key` diversa per ogni richiesta: cosi' il
 * componente rinasce da capo invece di dover azzerarsi da solo dentro un
 * effetto, che e' il modo giusto di far ripartire un'animazione in React.
 */
export default function Battuta({ testo }) {
  const [quante, setQuante] = useState(() => (menoMovimento() ? (testo?.length || 0) : 0));
  const finito = quante >= (testo?.length || 0);
  const battute = useRef(0);
  const riga = useRef(null);

  useEffect(() => {
    if (!testo || menoMovimento()) return undefined;

    let vive = true;
    let n = 0;
    const battito = setInterval(() => {
      if (!vive) return;
      n += 1;
      setQuante(n);
      const lettera = testo[n - 1];
      if (lettera && lettera !== ' ') {
        battute.current += 1;
        if (battute.current % OGNI_QUANTE_SI_BATTE === 0) tasto();
      }
      if (n >= testo.length) {
        clearInterval(battito);
        campanello();
      }
    }, MS_PER_LETTERA);
    return () => { vive = false; clearInterval(battito); };
  }, [testo]);

  /* Il fumetto sta dietro al cursore mentre batte, e torna in cima quando
     ha finito. Chi scorre lo trova gia' li' dove si comincia a leggere. */
  useEffect(() => {
    const contenitore = riga.current?.closest('.tb-scorre');
    if (!contenitore) return;
    if (!finito) { contenitore.scrollTop = contenitore.scrollHeight; return; }
    /* Il ritorno in cima e' l'unica cosa qui dentro che vorrebbe essere
       morbida, ed e' anche l'unica che puo' non esserci: `scrollTo` con le
       opzioni manca ai Safari vecchi e manca del tutto al banco di prova,
       dove mancandogli ha buttato giu' il componente e con lui il report
       di fine giornata. Un vezzo non puo' rompere una schermata: si prova,
       e se non c'e' si torna in cima e basta. */
    try {
      contenitore.scrollTo({ top: 0, behavior: menoMovimento() ? 'auto' : 'smooth' });
    } catch {
      contenitore.scrollTop = 0;
    }
  }, [quante, finito]);

  /* Saltare: un clic sul fumetto, o un tasto qualsiasi. */
  useEffect(() => {
    if (finito || !testo) return undefined;
    const salta = () => setQuante(testo.length);
    window.addEventListener('keydown', salta);
    return () => window.removeEventListener('keydown', salta);
  }, [finito, testo]);

  if (!testo) return null;
  return (
    <p
      ref={riga}
      className={`tb-battuta${finito ? ' is-finita' : ''}`}
      onClick={() => setQuante(testo.length)}
      /* Il testo intero e' sempre nel DOM per chi legge con un lettore di
         schermo: sentire una frase arrivare una lettera per volta sarebbe
         un supplizio, e l'effetto e' per gli occhi. */
      aria-label={testo}
    >
      <span aria-hidden="true">
        {testo.slice(0, quante)}
        {!finito && <span className="tb-cursore" />}
      </span>
    </p>
  );
}
