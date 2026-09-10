import { useState } from 'react';
import { vedeSpotSullaQuest, reclamePer } from '../../data/db';

/**
 * Far partire uno spot dopo aver assegnato una quest.
 *
 * Una schermata che assegna quest chiama `parti(dopo)` e non deve sapere
 * niente di piani: se il piano dell'organizzazione non prevede lo spot,
 * `dopo` viene eseguito subito e non succede altro. Se lo prevede, lo spot
 * si apre e `dopo` parte alla chiusura.
 *
 * Il seguito passa di qui e non dopo la chiamata perche' quasi sempre e' un
 * cambio di schermata: farlo prima vorrebbe dire mostrare lo spot sopra la
 * pagina sbagliata, e farlo senza aspettare vorrebbe dire non mostrarlo.
 *
 * Sta in un file suo e non accanto al componente perche' non e' un
 * componente: mescolarlo agli altri export rompe il ricaricamento a caldo.
 */
export default function useSpot(orgId) {
  const [spot, setSpot] = useState(null);

  const parti = (dopo) => {
    if (!orgId || !vedeSpotSullaQuest(orgId)) { dopo?.(); return; }
    setSpot({ reclame: reclamePer('spot'), dopo });
  };

  const chiudi = () => {
    const seguito = spot?.dopo;
    setSpot(null);
    seguito?.();
  };

  return { spot, parti, chiudi };
}
