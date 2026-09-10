import { useState } from 'react';
import { Link } from 'react-router-dom';
import AchievementBadge from './AchievementBadge';
import AchievementDetailDialog from './AchievementDetailDialog';
import TerminalPanel from '../terminal/TerminalPanel';
import { conteggiDi, storicoDi } from '../../data/achievements';
import { VUOTO_PROFILO, VUOTO_RECENTI } from '../../data/achievementsCatalog';

const data = (v) => (v ? new Date(v).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }) : '—');

/**
 * La sezione Achievements del profilo — il proprio e quello che un manager
 * apre di un collaboratore.
 *
 * Non e' un elenco fra gli altri dati: e' un riquadro suo, con le medaglie
 * prese e quante volte, e gli ultimi sblocchi in ordine di data. Da qui si
 * apre il dettaglio di ognuno — comprese le motivazioni di chi ha ricevuto
 * "Go the Extra Mile" e il nome di chi gliel'ha dato.
 *
 * Si guarda soltanto: "Go the Extra Mile" si assegna verificando la quest,
 * che e' l'unico momento in cui si sta guardando il lavoro fatto.
 */
export default function ProfileAchievements({ persona, me, verso }) {
  const [aperto, setAperto] = useState(null);

  const conteggi = conteggiDi(persona);
  const storico = storicoDi(persona).slice(0, 4);
  const proprio = me?.id === persona.id;

  return (
    <TerminalPanel
      titolo={proprio ? 'I MIEI ACHIEVEMENT' : `ACHIEVEMENT · ${persona.name}`}
      meta={verso ? <Link className="profile-skills-link" to={verso}>Vedi tutti</Link> : null}
      piede={conteggi.length > 0 ? `MEDAGLIE_DIVERSE: ${conteggi.length}` : null}
      className="ach-section ui-blocco con-stacco"
    >
      {conteggi.length === 0 ? (
        <div className="tv-vuoto">
          <b>{VUOTO_PROFILO.titolo}</b>
          <p style={{ margin: 'var(--space-2) 0 0' }}>{VUOTO_PROFILO.testo}</p>
        </div>
      ) : (
        <>
          <div className="ach-vetrina">
            {conteggi.map((p) => (
              <button
                key={p.definizione.id}
                type="button"
                className="ach-vetrina-voce"
                onClick={() => setAperto(p)}
                title={`${p.definizione.nome} × ${p.volte}`}
              >
                <AchievementBadge definizione={p.definizione} ottenuto volte={p.volte} size={52} />
                <span>{p.definizione.nome}</span>
              </button>
            ))}
          </div>

          <div className="tv-riga" aria-hidden="true" />
          <h3 className="tv-sottotitolo">Ultimi sblocchi</h3>
          {storico.length === 0 ? (
            <p className="tv-vuoto">{VUOTO_RECENTI}</p>
          ) : (
            <ul className="ach-recenti">
              {storico.map(({ istanza, definizione, assegnatoDa }) => (
                <li key={istanza.id}>
                  <b>{definizione.nome} #{istanza.ciclo}</b>
                  <small>
                    {data(istanza.ottenutoIl)}
                    {istanza.crediti > 0 && ` · +${istanza.crediti} crediti`}
                    {assegnatoDa && ` · da ${assegnatoDa.name}`}
                  </small>
                  {istanza.motivo && <p className="ach-motivo">“{istanza.motivo}”</p>}
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <AchievementDetailDialog progresso={aperto} onChiudi={() => setAperto(null)} />
    </TerminalPanel>
  );
}
