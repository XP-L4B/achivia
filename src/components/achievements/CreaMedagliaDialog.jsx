import { useState } from 'react';
import AchievementBadge from './AchievementBadge';
import Button from '../ui/Button';
import { BADGE_FAMIGLIE } from '../../data/skillBadges';
import { addAchievementCreato, updateAchievementCreato } from '../../data/db';
import useFinestra from '../../hooks/useFinestra';

/**
 * Inventare una medaglia.
 *
 * Esiste per le organizzazioni personalizzate, che le medaglie standard non le
 * hanno: "Deadline Master" a un gruppo o a un clan non dice niente,
 * e quello che serve li' dentro — "Ha rifatto il letto per un mese", "Primo
 * posto in gara" — non lo puo' scrivere Achivia al posto di chi ci sta.
 *
 * Quello che si crea qui e' sempre manuale, e il modulo non chiede una
 * condizione: una medaglia automatica ha bisogno di una misura, e le misure
 * sono codice. Si assegna a mano, con una motivazione scritta, che e'
 * l'unica cosa che rende una medaglia diversa da un regalo.
 *
 * La ricompensa in crediti si puo' mettere su tutte, al contrario delle
 * aziende dove ce l'ha una sola: li' le altre premiano un lavoro che le
 * quest hanno gia' pagato, qui non c'e' nessuna quest sotto.
 */
export default function CreaMedagliaDialog({ user, medaglia, onFatto, onChiudi }) {
  const finestra = useFinestra(true, onChiudi);
  const modifica = Boolean(medaglia);
  const [nome, setNome] = useState(medaglia?.nome || '');
  const [descrizione, setDescrizione] = useState(medaglia?.descrizione || '');
  const [crediti, setCrediti] = useState(medaglia?.creditiDefault ?? 0);
  const [badge, setBadge] = useState(medaglia?.badgeFamiglia || '');
  const [errore, setErrore] = useState('');

  /* Il terzo metallo, l'oro: una medaglia che si consegna a qualcuno non e'
     un grado di padronanza, e il bronzo la fa sembrare un primo passo. */
  const disegno = BADGE_FAMIGLIE.find((f) => f.id === badge)?.livelli[3] || null;
  const anteprima = {
    id: medaglia?.id || 'nuova',
    nome: nome || '?',
    descrizione,
    badgeImage: disegno,
  };

  function salva() {
    if (!nome.trim()) { setErrore('Il nome è obbligatorio.'); return; }
    if (!descrizione.trim()) {
      setErrore('Serve una descrizione: senza, chi la riceve non sa per cosa.');
      return;
    }
    const dati = {
      nome: nome.trim(),
      descrizione: descrizione.trim(),
      creditiDefault: Math.max(0, Number(crediti) || 0),
      badgeImage: disegno,
      badgeFamiglia: badge || null,
    };
    const fatta = modifica
      ? updateAchievementCreato(medaglia.id, dati)
      : addAchievementCreato({ ...dati, orgId: user.orgId, creatoDaId: user.id });
    onFatto?.(fatta);
  }

  return (
    <div className="ui-overlay" role="dialog" aria-modal="true">
      <div ref={finestra} tabIndex={-1} className="px-panel ui-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="ui-dialog-head">
          <AchievementBadge definizione={anteprima} ottenuto size={56} />
          <b>{modifica ? 'Modifica la medaglia' : 'Inventa una medaglia'}</b>
        </div>
        <p className="ui-dialog-hint">
          La assegni tu, quando succede, con una motivazione scritta. Resta dentro la tua
          organizzazione: chi esce non se la porta via.
        </p>

        <label className="label" htmlFor="med-nome">Come si chiama</label>
        <input
          id="med-nome"
          name="nome"
          value={nome}
          maxLength={60}
          placeholder="Primo posto in gara"
          onChange={(e) => setNome(e.target.value)}
        />

        <label className="label" htmlFor="med-desc">Per cosa si prende</label>
        <textarea
          id="med-desc"
          name="descrizione"
          rows={3}
          maxLength={300}
          value={descrizione}
          placeholder="Ha vinto una gara ufficiale con i colori della squadra."
          onChange={(e) => setDescrizione(e.target.value)}
        />

        <label className="label" htmlFor="med-crediti">Ricompensa in crediti</label>
        <input
          id="med-crediti"
          name="crediti"
          type="number"
          min="0"
          step="1"
          value={crediti}
          onChange={(e) => setCrediti(e.target.value)}
        />
        <small className="ui-dialog-hint">
          Zero va benissimo: una medaglia vale anche solo perché qualcuno l’ha vista.
        </small>

        <label className="label">Il disegno</label>
        <div className="badge-griglia">
          <button
            type="button"
            className={`badge-scelta is-vuota${badge === '' ? ' is-on' : ''}`}
            onClick={() => setBadge('')}
            aria-label="Nessun disegno"
          >
            —
          </button>
          {BADGE_FAMIGLIE.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`badge-scelta${badge === f.id ? ' is-on' : ''}`}
              onClick={() => setBadge(f.id)}
              aria-label={f.id}
              aria-pressed={badge === f.id}
            >
              <img src={f.livelli[3]} alt="" />
            </button>
          ))}
        </div>

        {errore && <p className="ui-errore">{errore}</p>}

        <div className="ui-dialog-actions">
          <Button variante="primario" onClick={salva}>
            {modifica ? 'Salva' : 'Crea la medaglia'}
          </Button>
          <Button variante="fantasma" onClick={onChiudi}>Annulla</Button>
        </div>
      </div>
    </div>
  );
}
