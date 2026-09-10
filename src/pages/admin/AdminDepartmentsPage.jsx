import { useEffect, useState } from 'react';
import PageShell from '../../components/ui/PageShell';
import Button from '../../components/ui/Button';
import BackTile from '../../components/ui/BackTile';
import { useAuth } from '../../context/AuthContext';
import { getUserById, getUsersByOrg, subscribe } from '../../data/db';
import { dipartimentiDi, eliminaDipartimento, salvaDipartimento } from '../../data/permessi';

const persone = (n) => `${n} ${n === 1 ? 'persona' : 'persone'}`;

/**
 * I dipartimenti dell'organizzazione.
 *
 * Sono il posto dove una persona atterra: non il ruolo — un capo turno puo'
 * stare in produzione o in magazzino — ma il reparto che l'admin le
 * assegna. Chi tiene due reparti ne ha due, e chi guida vede le persone dei
 * propri.
 *
 * Un dipartimento con dentro qualcuno non si elimina: prima le persone si
 * spostano. Un reparto che sparisce sotto i piedi lascia gente senza posto
 * e chi la guidava senza sapere piu' chi guida.
 */
export default function AdminDepartmentsPage() {
  const { user } = useAuth();
  const [, ridisegna] = useState(0);
  const [nuovo, setNuovo] = useState('');
  const [inModifica, setInModifica] = useState(null);
  const [daEliminare, setDaEliminare] = useState(null);
  const [errore, setErrore] = useState('');
  useEffect(() => subscribe(() => ridisegna((n) => n + 1)), []);

  const me = getUserById(user.id) || user;
  const elenco = dipartimentiDi(me.orgId);
  const gente = getUsersByOrg(me.orgId);
  const quantiIn = (id) => gente.filter((u) => (u.departmentIds ?? []).includes(id)).length;

  const agisci = (esito, dopo) => {
    setErrore(esito.ok ? '' : esito.errore);
    if (esito.ok && dopo) dopo();
    ridisegna((n) => n + 1);
  };

  return (
    <>
      <PageShell
        title="Dipartimenti"
        description="I reparti dell’organizzazione: è qui che le persone atterrano, e da qui si vedono fra loro."
      />

      <div className="ui-blocco con-stacco px-filters ui-colonna fitta tv-modulo">
        <label className="label" htmlFor="dip-nuovo">Aggiungi un dipartimento</label>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <input
            id="dip-nuovo"
            name="dip-nuovo"
            value={nuovo}
            onChange={(e) => setNuovo(e.target.value)}
            placeholder="Marketing, Produzione, Magazzino…"
            style={{ flex: '1 1 180px' }}
          />
          <Button
            variante="primario"
            disabled={!nuovo.trim()}
            onClick={() => agisci(salvaDipartimento(me, { nome: nuovo }), () => setNuovo(''))}
          >
            Aggiungi
          </Button>
        </div>
        {errore && <p className="ui-dialog-hint" style={{ color: 'var(--ui-alert-testo)' }}>{errore}</p>}
      </div>

      <div className="ui-list">
        {elenco.length === 0 ? (
          <div className="empty-state ui-blocco">Non c’è ancora nessun dipartimento.</div>
        ) : elenco.map((d) => (
          <article key={d.id} className="ui-panel ruolo-riga">
            <div className="ruolo-corpo">
              {inModifica?.id === d.id ? (
                <input
                  value={inModifica.nome}
                  onChange={(e) => setInModifica({ ...inModifica, nome: e.target.value })}
                  aria-label={`Nuovo nome per ${d.nome}`}
                />
              ) : (
                <>
                  <h3 className="ruolo-nome">{d.nome}</h3>
                  <p className="negozio-tag">
                    <span className="badge badge-neutral">{persone(quantiIn(d.id))}</span>
                  </p>
                </>
              )}
            </div>

            <div className="negozio-azioni">
              {inModifica?.id === d.id ? (
                <>
                  <Button
                    variante="primario"
                    compatto
                    onClick={() => agisci(salvaDipartimento(me, inModifica), () => setInModifica(null))}
                  >
                    Salva
                  </Button>
                  <Button variante="fantasma" compatto onClick={() => setInModifica(null)}>Annulla</Button>
                </>
              ) : daEliminare?.id === d.id ? (
                <>
                  <span style={{ flex: '1 1 100%' }}>
                    Eliminare “{d.nome}”?{' '}
                    {quantiIn(d.id) > 0
                      ? `${persone(quantiIn(d.id))} ci stanno dentro: vanno spostate prima.`
                      : 'Non ci sta nessuno.'}
                  </span>
                  <Button
                    variante="pericolo"
                    compatto
                    onClick={() => agisci(eliminaDipartimento(me, d.id), () => setDaEliminare(null))}
                  >
                    Elimina
                  </Button>
                  <Button variante="fantasma" compatto onClick={() => setDaEliminare(null)}>Lascia stare</Button>
                </>
              ) : (
                <>
                  <Button variante="secondario" compatto onClick={() => setInModifica({ id: d.id, nome: d.nome })}>Rinomina</Button>
                  <Button variante="pericolo" compatto onClick={() => setDaEliminare(d)}>Elimina</Button>
                </>
              )}
            </div>
          </article>
        ))}
      </div>

      <BackTile />
    </>
  );
}
