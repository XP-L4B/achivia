import { useEffect, useState } from 'react';
import PageShell from '../../components/ui/PageShell';
import Button from '../../components/ui/Button';
import BackTile from '../../components/ui/BackTile';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import useFinestra from '../../hooks/useFinestra';
import { useAuth } from '../../context/AuthContext';
import { getUserById, subscribe } from '../../data/db';
import {
  GRUPPI, PERMESSI, duplicaRuolo, eliminaRuolo, quantiCon, ruoliDi, salvaRuolo,
} from '../../data/permessi';

const persone = (n) => `${n} ${n === 1 ? 'persona' : 'persone'}`;

/**
 * Il modulo di un ruolo: un nome, due righe di descrizione, e i permessi
 * spuntati uno per uno.
 *
 * I permessi stanno raggruppati per famiglia e ognuno porta scritto sotto
 * che cosa accende: un elenco di venticinque interruttori senza spiegazione
 * si spunta a caso, e un ruolo spuntato a caso e' un problema che si scopre
 * settimane dopo.
 */
function RuoloDialog({ me, ruolo, onFatto, onChiudi }) {
  const finestra = useFinestra(true, onChiudi);
  const [dati, setDati] = useState(() => ({
    id: ruolo?.id,
    nome: ruolo?.nome ?? '',
    descrizione: ruolo?.descrizione ?? '',
    permessi: ruolo?.permessi ? [...ruolo.permessi] : [],
  }));
  const [errore, setErrore] = useState('');

  const spunta = (id) => setDati((d) => ({
    ...d,
    permessi: d.permessi.includes(id)
      ? d.permessi.filter((p) => p !== id)
      : [...d.permessi, id],
  }));

  function salva() {
    const esito = salvaRuolo(me, dati);
    if (!esito.ok) { setErrore(esito.errore); return; }
    onFatto();
  }

  return (
    <div className="ui-overlay" role="dialog" aria-modal="true" aria-label={ruolo ? 'Modifica ruolo' : 'Nuovo ruolo'}>
      <div ref={finestra} tabIndex={-1} className="px-panel ui-dialog">
        <b>{ruolo ? `Modifica “${ruolo.nome}”` : 'Nuovo ruolo'}</b>

        <div className="px-filters ui-colonna fitta" style={{ marginTop: 'var(--space-3)' }}>
          <label className="label" htmlFor="ruolo-nome">Nome del ruolo</label>
          <input
            id="ruolo-nome"
            name="ruolo-nome"
            value={dati.nome}
            onChange={(e) => setDati({ ...dati, nome: e.target.value })}
            placeholder="Team Leader, Capo turno, Recruiter…"
          />

          <label className="label" htmlFor="ruolo-desc">A che cosa serve</label>
          <textarea
            id="ruolo-desc"
            name="ruolo-desc"
            rows={2}
            value={dati.descrizione}
            onChange={(e) => setDati({ ...dati, descrizione: e.target.value })}
            placeholder="Due righe per chi lo assegnera’"
          />
        </div>

        <p className="ui-ai-title" style={{ margin: 'var(--space-4) 0 var(--space-2)' }}>
          Permessi <span style={{ color: 'var(--tv-dim)' }}>· {dati.permessi.length} di {PERMESSI.length}</span>
        </p>

        {GRUPPI.map((gruppo) => (
          <fieldset key={gruppo} className="ruolo-gruppo">
            <legend>{gruppo}</legend>
            {PERMESSI.filter((p) => p.gruppo === gruppo).map((p) => (
              <label key={p.id} className="ruolo-permesso">
                <input
                  type="checkbox"
                  name={p.id}
                  checked={dati.permessi.includes(p.id)}
                  onChange={() => spunta(p.id)}
                />
                <span>
                  <b>{p.nome}</b>
                  <small>{p.nota}</small>
                </span>
              </label>
            ))}
          </fieldset>
        ))}

        {errore && <p className="ui-dialog-hint" style={{ color: 'var(--ui-alert-testo)' }}>{errore}</p>}

        <div className="ui-dialog-actions">
          <Button variante="primario" onClick={salva}>Salva</Button>
          <Button variante="fantasma" onClick={onChiudi}>Annulla</Button>
        </div>
      </div>
    </div>
  );
}

/**
 * I ruoli dell'organizzazione.
 *
 * Due preimpostati che non si toccano — Manager e Dipendente, quelli che
 * l'app ha sempre avuto — e quelli che l'organizzazione si fa. Un ruolo
 * preimpostato non si modifica ma si duplica: e' da li' che si parte per
 * farne uno su misura, senza rischiare di cambiare sotto i piedi il ruolo
 * su cui sta meta' azienda.
 */
export default function AdminRolesPage() {
  const { user } = useAuth();
  const [, ridisegna] = useState(0);
  const [modulo, setModulo] = useState(null);
  const [daEliminare, setDaEliminare] = useState(null);
  const [errore, setErrore] = useState('');
  useEffect(() => subscribe(() => ridisegna((n) => n + 1)), []);

  const me = getUserById(user.id) || user;
  const ruoli = ruoliDi(me.orgId);

  const agisci = (esito) => {
    setErrore(esito.ok ? '' : esito.errore);
    ridisegna((n) => n + 1);
  };

  return (
    <>
      <PageShell
        title="Ruoli"
        description="Un ruolo dice come si chiama una persona; i permessi dicono che cosa può fare."
        action={<Button variante="primario" onClick={() => setModulo({ ruolo: null })}>Nuovo ruolo</Button>}
      />

      {errore && (
        <p className="ui-blocco ui-errore">{errore}</p>
      )}

      <div className="ui-list">
        {ruoli.map((r) => {
          const quanti = quantiCon(me.orgId, r.id);
          return (
            <article key={r.id} className="ui-panel ruolo-riga">
              <div className="ruolo-corpo">
                <h3 className="ruolo-nome">
                  {r.nome}
                  {r.preimpostato && <span className="badge badge-neutral">preimpostato</span>}
                </h3>
                {r.descrizione && <p className="ruolo-nota">{r.descrizione}</p>}
                <p className="negozio-tag">
                  <span className="badge badge-primary">
                    {r.permessi.length} {r.permessi.length === 1 ? 'permesso' : 'permessi'}
                  </span>
                  <span className={`badge ${quanti ? 'badge-neutral' : 'badge-neutral'}`}>{persone(quanti)}</span>
                </p>
              </div>

              <div className="negozio-azioni">
                {!r.preimpostato && (
                  <Button variante="secondario" compatto onClick={() => setModulo({ ruolo: r })}>Modifica</Button>
                )}
                <Button variante="fantasma" compatto onClick={() => agisci(duplicaRuolo(me, r.id))}>Duplica</Button>
                {!r.preimpostato && (
                  <Button variante="pericolo" compatto onClick={() => setDaEliminare(r)}>Elimina</Button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <BackTile />

      {modulo && (
        <RuoloDialog
          me={me}
          ruolo={modulo.ruolo}
          onFatto={() => { setModulo(null); setErrore(''); ridisegna((n) => n + 1); }}
          onChiudi={() => setModulo(null)}
        />
      )}

      {daEliminare && (
        <ConfirmDialog
          titolo={`Eliminare il ruolo “${daEliminare.nome}”?`}
          testo={quantiCon(me.orgId, daEliminare.id) > 0
            ? 'Ci sono persone che ce l’hanno: vanno spostate su un altro ruolo prima.'
            : 'Nessuno ce l’ha: sparisce e basta.'}
          conferma="Elimina"
          distruttiva
          onConferma={() => { agisci(eliminaRuolo(me, daEliminare.id)); setDaEliminare(null); }}
          onChiudi={() => setDaEliminare(null)}
        />
      )}
    </>
  );
}
