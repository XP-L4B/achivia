import { useEffect, useRef, useState } from 'react';
import AchievementBadge from './AchievementBadge';
import { useAuth } from '../../context/AuthContext';
import { subscribe } from '../../data/db';
import { sincronizza } from '../../data/achievements';
import { achievementById } from '../../data/achievementsCatalog';
import { sincronizzaTraguardi } from '../../data/traguardiOrg';
import { traguardoOrgById, conMedaglia, NOMI_LIVELLO } from '../../data/achievementsOrg';

/**
 * Tiene allineati gli achievement di chi sta usando l'app e annuncia quelli
 * appena sbloccati.
 *
 * Non c'e' nessun controllo a intervalli: si guarda quando i dati cambiano,
 * cioe' quando qualcosa e' successo davvero. E rimettere in ordine costa
 * quanto una lettura, perche' se non c'e' niente di nuovo non scrive niente
 * e quindi non innesca un altro giro.
 *
 * L'avviso e' un riquadro che entra da sotto e se ne va da solo: la notifica
 * vera resta comunque fra i messaggi, quindi qui si puo' essere leggeri.
 */
export default function AchievementWatcher() {
  const { user } = useAuth();
  const [coda, setCoda] = useState([]);
  const timer = useRef(null);

  useEffect(() => {
    if (!user) return undefined;

    const accoda = (nate) => {
      if (nate.length) setCoda((c) => [...c, ...nate]);
    };
    // Gli achievement della persona e — per chi guida l'organizzazione — i
    // traguardi dell'azienda: due elenchi diversi, lo stesso momento.
    const allinea = () => [...sincronizza(user.id), ...sincronizzaTraguardi(user.id)];
    // Quello che e' maturato mentre non si guardava: fuori dal giro
    // dell'effetto, cosi' il primo disegno non viene interrotto a meta'.
    queueMicrotask(() => accoda(allinea()));
    return subscribe(() => accoda(allinea()));
  }, [user]);

  useEffect(() => {
    if (coda.length === 0) return undefined;
    timer.current = setTimeout(() => setCoda((c) => c.slice(1)), 6000);
    return () => clearTimeout(timer.current);
  }, [coda]);

  if (coda.length === 0) return null;
  const istanza = coda[0];
  const traguardo = traguardoOrgById(istanza.achievementId);
  const definizione = traguardo
    ? conMedaglia(traguardo, istanza.livello || 0)
    : achievementById(istanza.achievementId);
  if (!definizione) return null;

  return (
    <div className="ach-toast" role="status" aria-live="polite">
      <AchievementBadge definizione={definizione} ottenuto size={44} />
      <div>
        <b>{traguardo ? 'Traguardo dell’organizzazione' : 'Achievement sbloccato'}</b>
        <span>{definizione.nome}</span>
        <small>
          {istanza.livello
            ? NOMI_LIVELLO[istanza.livello - 1]
            : `${istanza.progresso}/${istanza.target} ${definizione.unita}`}
          {istanza.crediti > 0 && ` · +${istanza.crediti} crediti`}
        </small>
      </div>
      <button type="button" className="ach-toast-chiudi" aria-label="Chiudi" onClick={() => setCoda((c) => c.slice(1))}>
        ×
      </button>
    </div>
  );
}
