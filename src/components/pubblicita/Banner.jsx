import { useEffect, useState } from 'react';
import { vedeBanner, reclamePer, segnaVista } from '../../data/db';

/**
 * Il banner: la pubblicita' che sta ferma in fondo alla schermata.
 *
 * Compare solo se il piano dell'organizzazione la prevede — lo Standard e
 * il Silver — e sparisce dal Gold in su. Non compare mai fuori da
 * un'organizzazione: il negozio, l'osservatorio e il Castello non sono
 * profili di clienti, e nella pagina di accesso non c'e' ancora nessuno a
 * cui mostrarla.
 *
 * Quando non c'e' niente da mostrare lo spazio resta e si vede che e' uno
 * spazio. E' voluto: chi sta sul piano con la pubblicita' deve vedere che
 * c'e' la pubblicita' anche il giorno in cui non e' stata venduta, se no il
 * piano di sopra sembra togliere qualcosa che non c'era.
 */
export default function Banner({ orgId }) {
  const mostra = Boolean(orgId) && vedeBanner(orgId);
  // La reclame si sceglie una volta per montaggio e non a ogni ridisegno:
  // un banner che cambia mentre lo si guarda e' un banner che nessuno legge.
  const [reclame] = useState(() => (mostra ? reclamePer('banner') : null));

  useEffect(() => {
    if (reclame) segnaVista(reclame.id);
  }, [reclame]);

  if (!mostra) return null;

  const dentro = reclame ? (
    <>
      <span className="pub-etichetta">Pubblicità</span>
      <b className="pub-titolo">{reclame.titolo}</b>
      {reclame.testo && <span className="pub-testo">{reclame.testo}</span>}
    </>
  ) : (
    <>
      <span className="pub-etichetta">Spazio pubblicitario</span>
      <span className="pub-testo">Con un piano a pagamento questo spazio non c’è.</span>
    </>
  );

  if (reclame?.collegamento) {
    return (
      <a
        className="pub-banner"
        href={reclame.collegamento}
        target="_blank"
        rel="noreferrer noopener"
      >
        {dentro}
      </a>
    );
  }
  return <aside className="pub-banner">{dentro}</aside>;
}
