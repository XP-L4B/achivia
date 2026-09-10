import { LIVELLI } from '../../giochi/theclimb/contenuti/livelli';
import { umoreDi, battutaDi, UMORI } from '../../giochi/theclimb/contenuti/battute';
import { calendarioDi } from '../../giochi/theclimb/contenuti/calendario';
import { nomePercorso } from '../../data/theclimb';

/**
 * La stanza: l'avatar in mezzo, e intorno quello che la vita ha messo.
 *
 * E' la schermata di Tabboz adattata a questa partita: un personaggio in
 * piedi in una stanza, e la stanza che dice come sta — non con un numero
 * ma con quello che c'e' dentro. La finestra cambia cielo con la stagione
 * (la settimana lo dice), sul muro c'e' la targa del posto di lavoro e
 * il titolo di studio se c'e', accanto alla mano l'umore, sopra il
 * fumetto con quello che dice — o con l'ultima cosa che e' successa,
 * quando c'e' una nota da leggere.
 *
 * L'avatar e' quello del profilo di Achivia: la stessa immagine che sta
 * in cima al profilo, disegnata a pixel e ingrandita senza sfumare
 * (`image-rendering: pixelated`). Non si disegna nient'altro: niente
 * vestiti, niente oggetti in mano — quello che cambia e' la stanza, e il
 * modo in cui l'avatar sta in piedi (`is-stress`, `is-stanco`, ...),
 * che e' solo CSS e si spegne con `prefers-reduced-motion`.
 *
 * Tutto quello che si legge e' testo vero: la stagione, la targa, l'umore
 * hanno un'etichetta, e il fumetto e' un paragrafo. Un lettore di schermo
 * legge la stanza come una frase.
 */

export default function Stanza({ foto, avatar, nota }) {
  if (!foto) return null;
  const umore = umoreDi(foto);
  const etichetta = UMORI[umore];
  const cal = calendarioDi(foto.settimana);
  const dice = nota || battutaDi(foto);
  const c = foto.corpo;
  const classi = [
    'tc-avatar',
    `is-${umore}`,
    c.salute < 40 ? 'is-malato' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={`tc-stanza is-${cal.stagione}`} aria-label={`La stanza. ${cal.mese}, anno ${cal.anno}. ${etichetta.testo ? `Sei ${etichetta.testo}.` : ''}`}>
      <div className="tc-muro" aria-hidden="true" />
      <div className="tc-pavimento" aria-hidden="true" />

      <div className="tc-cielo" title={`${cal.mese}, ${cal.stagione}`}>
        <span className="tc-cielo-sole" aria-hidden="true" />
        <small>{cal.mese}</small>
      </div>

      <div className="tc-targa">
        {foto.lavoro ? (
          <>
            <b>{foto.lavoro.azienda?.nome ?? foto.lavoro.aziendaId}</b>
            <small>{foto.lavoro.livelloNome}</small>
          </>
        ) : (
          <>
            <b>Senza lavoro</b>
            <small>{nomePercorso(foto.percorso)}</small>
          </>
        )}
      </div>

      {foto.titoli.length > 0 && (
        <div className="tc-diploma" title={foto.titoli.map(nomePercorso).join(', ')}>
          <small>{foto.titoli.length === 1 ? 'titolo' : 'titoli'}</small>
          <b>{foto.titoli.map(nomePercorso).join(' · ')}</b>
        </div>
      )}

      <p className="ui-tile tc-scorre tc-fumetto">
        {dice}
        <span className="tc-fumetto-coda" aria-hidden="true" />
      </p>

      <figure className="tc-figura">
        <img className={classi} src={avatar} alt="Il tuo avatar" draggable="false" />
        {etichetta.segno && (
          <figcaption className="tc-umore" aria-label={etichetta.testo}>{etichetta.segno}</figcaption>
        )}
      </figure>

      <div className="tc-scritta">
        <small>{cal.mese} · anno {cal.anno} di 12</small>
        <b>{foto.lavoro ? LIVELLI[foto.lavoro.livello]?.nome ?? foto.lavoro.livelloNome : `${foto.eta} anni`}</b>
      </div>
    </div>
  );
}
