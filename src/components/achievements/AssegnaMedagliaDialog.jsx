import { useState } from 'react';
import AchievementBadge from './AchievementBadge';
import Button from '../ui/Button';
import { assegnaMedaglia } from '../../data/achievements';
import useFinestra from '../../hooks/useFinestra';

/**
 * Consegnare una medaglia a qualcuno.
 *
 * Non passa da una quest, e non e' una svista: in un gruppo o in un clan
 * il motivo per premiare spesso non e' un compito assegnato — e' una cosa
 * che e' successa. Quello che resta obbligatorio e'
 * la motivazione: e' quella a trasformare una medaglia in un riconoscimento
 * invece che in un regalo, ed e' la sola parte che chi la riceve rilegge.
 */
export default function AssegnaMedagliaDialog({ user, medaglia, persone, onFatto, onChiudi }) {
  const finestra = useFinestra(true, onChiudi);
  const [personaId, setPersonaId] = useState(persone[0]?.id || '');
  const [motivo, setMotivo] = useState('');
  const [errore, setErrore] = useState('');

  function conferma() {
    const esito = assegnaMedaglia({
      byId: user.id,
      employeeId: personaId,
      achievementId: medaglia.id,
      motivo,
    });
    if (esito.errore) { setErrore(esito.errore); return; }
    onFatto?.(esito.istanza);
  }

  return (
    <div className="ui-overlay" role="dialog" aria-modal="true">
      <div ref={finestra} tabIndex={-1} className="px-panel ui-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="ui-dialog-head">
          <AchievementBadge definizione={medaglia} ottenuto size={56} />
          <b>{medaglia.nome}</b>
        </div>
        <p className="ui-dialog-hint">{medaglia.descrizione}</p>

        <label className="label" htmlFor="med-chi">A chi</label>
        <select id="med-chi" value={personaId} onChange={(e) => setPersonaId(e.target.value)}>
          {persone.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        <label className="label" htmlFor="med-motivo">Perché</label>
        <textarea
          id="med-motivo"
          name="motivo"
          rows={3}
          maxLength={300}
          value={motivo}
          placeholder="Che cosa ha fatto, in una riga. La leggerà."
          onChange={(e) => setMotivo(e.target.value)}
        />

        {errore && <p className="ui-errore">{errore}</p>}

        <div className="ui-dialog-actions">
          <Button variante="primario" disabled={!personaId} onClick={conferma}>Consegna</Button>
          <Button variante="fantasma" onClick={onChiudi}>Annulla</Button>
        </div>
      </div>
    </div>
  );
}
