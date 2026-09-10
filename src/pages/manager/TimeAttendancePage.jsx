import { useEffect, useState } from 'react';
import PageShell from '../../components/ui/PageShell';
import Chips from '../../components/ui/Chips';
import BackTile from '../../components/ui/BackTile';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Button from '../../components/ui/Button';
import TerminalPanel from '../../components/terminal/TerminalPanel';
import TerminalRows, { TerminalValue, TerminalStato } from '../../components/terminal/TerminalRows';
import useFinestra from '../../hooks/useFinestra';
import { useAuth } from '../../context/AuthContext';
import { getUserById, subscribe } from '../../data/db';
import {
  RITARDO, TIPI, elimina, etichettaTipo, eventoDelGiorno,
  oggiIso, registra, registroDi, riepilogoOrg, squadraDi,
} from '../../data/presenze';

const PERIODI = [
  { id: '30',  label: '1 MESE', giorni: 30 },
  { id: '90',  label: '3 MESI', giorni: 90 },
  { id: 'all', label: 'SEMPRE', giorni: null },
];

const VISTE = [
  { id: 'squadra',  label: 'Squadra' },
  { id: 'registro', label: 'Registro' },
];

const data = (giorno) => new Date(`${giorno}T12:00:00`)
  .toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: '2-digit' });

/** "1h 20m" invece di "80m": oltre l'ora i minuti da soli non si leggono. */
const durata = (minuti) => {
  if (!minuti) return '—';
  if (minuti < 60) return `${minuti}m`;
  const h = Math.floor(minuti / 60);
  const m = minuti % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
};

/**
 * La finestra con cui si registra un evento.
 *
 * Un solo evento per persona e per giorno: se quel giorno c'e' gia'
 * qualcosa la finestra lo dice prima di salvare, cosi' chi registra sa che
 * sta correggendo e non aggiungendo.
 */
function RegistraDialog({ me, persone, personaIniziale, onFatto, onChiudi }) {
  const finestra = useFinestra(true, onChiudi);
  const [employeeId, setEmployeeId] = useState(personaIniziale?.id || persone[0]?.id || '');
  const [giorno, setGiorno] = useState(oggiIso());
  const [tipo, setTipo] = useState(RITARDO);
  const [minuti, setMinuti] = useState(15);
  const [giustificata, setGiustificata] = useState(false);
  const [nota, setNota] = useState('');
  const [errore, setErrore] = useState('');

  const gia = employeeId && giorno ? eventoDelGiorno(employeeId, giorno) : null;

  function salva() {
    const esito = registra(me, { employeeId, giorno, tipo, minuti, giustificata, nota });
    if (!esito) {
      setErrore('Non è stato possibile registrare: controlla persona e data.');
      return;
    }
    onFatto(esito);
  }

  return (
    <div className="ui-overlay" role="dialog" aria-modal="true" aria-label="Registra un evento">
      <div ref={finestra} tabIndex={-1} className="px-panel ui-dialog is-stretta">
        <b>Registra</b>
        <p className="ui-dialog-hint">
          Si scrive solo quello che esce dalla giornata normale: un ritardo o un&apos;assenza.
        </p>

        <label className="label">Persona
          <select value={employeeId} onChange={(e) => { setEmployeeId(e.target.value); setErrore(''); }}>
            {persone.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>

        <label className="label">Giorno
          <input
            type="date"
            value={giorno}
            max={oggiIso()}
            onChange={(e) => { setGiorno(e.target.value); setErrore(''); }}
          />
        </label>

        <div className="ui-blocco" style={{ margin: '10px 0 0' }}>
          <Chips items={TIPI} value={tipo} onChange={setTipo} ariaLabel="Tipo di evento" />
        </div>

        {tipo === RITARDO && (
          <label className="label">Minuti di ritardo
            <input
              type="number"
              min="0"
              step="5"
              value={minuti}
              onChange={(e) => setMinuti(e.target.value)}
            />
          </label>
        )}

        <label className="label" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <input
            type="checkbox"
            checked={giustificata}
            onChange={(e) => setGiustificata(e.target.checked)}
          />
          Giustificata
        </label>

        <label className="label">Nota
          <input
            type="text"
            value={nota}
            placeholder="Facoltativa: il motivo, se serve ricordarlo"
            onChange={(e) => setNota(e.target.value)}
          />
        </label>

        {gia && (
          <TerminalStato tono="attesa">
            Quel giorno c&apos;è già {etichettaTipo(gia.tipo).toLowerCase()}: salvando lo correggi.
          </TerminalStato>
        )}
        {errore && <p className="ui-errore" role="alert">{errore}</p>}

        <div className="ui-dialog-actions">
          <Button variante="primario" disabled={!employeeId} onClick={salva}>
            {gia ? 'Correggi' : 'Registra'}
          </Button>
          <Button variante="fantasma" onClick={onChiudi}>Annulla</Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Time & Attendance: ritardi e assenze della squadra.
 *
 * Due viste sugli stessi eventi. "Squadra" e' il quadro — chi ha quanto, per
 * il periodo scelto — ed e' da li' che si registra, partendo dalla persona.
 * "Registro" e' l'ordine di data, cioe' il posto dove si va a cercare una
 * riga sbagliata per correggerla.
 *
 * Gli stessi numeri finiscono nelle analytics di ognuno, con il periodo
 * scelto la': qui si scrivono, la' si leggono insieme al resto.
 */
export default function TimeAttendancePage() {
  const { user } = useAuth();
  const [, setVersione] = useState(0);
  useEffect(() => subscribe(() => setVersione((v) => v + 1)), []);

  const [vista, setVista] = useState('squadra');
  const [periodo, setPeriodo] = useState('30');
  const [registrando, setRegistrando] = useState(null);   // { persona } oppure null
  const [daEliminare, setDaEliminare] = useState(null);
  const [avviso, setAvviso] = useState('');
  // L'istante di riferimento si fissa all'apertura: un "adesso" che cambia a
  // ogni render sposterebbe il bordo del periodo da solo.
  const [adesso] = useState(() => Date.now());

  const me = getUserById(user.id) || user;
  const giorni = PERIODI.find((p) => p.id === periodo)?.giorni ?? null;
  const finestra = giorni ? { da: adesso - giorni * 86400000, a: adesso } : null;

  const persone = squadraDi(me);
  const org = riepilogoOrg(me, finestra);
  const registro = registroDi(me, { finestra });
  const etichettaPeriodo = PERIODI.find((p) => p.id === periodo)?.label ?? '';

  if (persone.length === 0) {
    return (
      <>
        <PageShell
          title="Time & Attendance"
          description="Ritardi e assenze delle persone che guidi."
        />
        <div className="empty-state ui-blocco">
          Non hai ancora nessuno da seguire: quando avrai delle persone, qui si
          registrano i loro ritardi e le loro assenze.
        </div>
        <BackTile />
      </>
    );
  }

  return (
    <>
      <PageShell
        title="Time & Attendance"
        description="Ritardi e assenze delle persone che guidi. I numeri finiscono nelle loro analytics."
        action={
          <Button variante="primario" onClick={() => { setAvviso(''); setRegistrando({}); }}>
            + Registra
          </Button>
        }
      />

      <Chips items={PERIODI} value={periodo} onChange={setPeriodo} ariaLabel="Periodo" />
      <Chips items={VISTE} value={vista} onChange={setVista} ariaLabel="Cosa vedere" />

      {avviso && (
        <div className="ui-blocco con-stacco">
          <TerminalStato tono="ok">{avviso}</TerminalStato>
        </div>
      )}

      <div className="ui-blocco con-stacco">
        <TerminalPanel
          titolo="REGISTRO"
          meta={etichettaPeriodo}
          piede={org.conEventi > 0
            ? `PERSONE_CON_EVENTI: ${org.conEventi}/${org.persone}`
            : 'NESSUN EVENTO NEL PERIODO'}
          tonoPiede={org.conEventi > 0 ? '' : 'ok'}
        >
          <TerminalValue
            valore={org.assenze + org.ritardi}
            unita="eventi"
            nota={`${org.persone} ${org.persone === 1 ? 'persona' : 'persone'}`}
          />
          <div className="tv-riga" aria-hidden="true" />
          <TerminalRows
            vivo
            voci={[
              { label: 'Assenze', valore: org.assenze, tono: org.assenze > 0 ? 'errore' : 'spento' },
              { label: 'Ritardi', valore: org.ritardi, tono: org.ritardi > 0 ? 'attesa' : 'spento' },
              { label: 'Minuti di ritardo', valore: durata(org.minuti), tono: org.minuti > 0 ? 'attesa' : 'spento' },
              { label: 'Giustificati', valore: org.giustificate, tono: 'spento' },
            ]}
          />
        </TerminalPanel>
      </div>

      {vista === 'squadra' && (
        <div className="ui-corpo-stretto tv-griglia a-due">
          {org.squadra.map(({ persona, riepilogo }) => (
            <TerminalPanel
              key={persona.id}
              livello={3}
              titolo={persona.name}
              meta={persona.department || ''}
              piede={riepilogo.ultimo
                ? `ULTIMO: ${etichettaTipo(riepilogo.ultimo.tipo).toUpperCase()} · ${data(riepilogo.ultimo.giorno)}`
                : 'NESSUN EVENTO'}
              tonoPiede={riepilogo.ultimo ? '' : 'ok'}
              onClick={() => { setAvviso(''); setRegistrando({ persona }); }}
            >
              <TerminalRows
                voci={[
                  { label: 'Assenze', valore: riepilogo.assenze, tono: riepilogo.assenze > 0 ? 'errore' : 'spento' },
                  { label: 'Ritardi', valore: riepilogo.ritardi, tono: riepilogo.ritardi > 0 ? 'attesa' : 'spento' },
                  { label: 'Minuti', valore: durata(riepilogo.minuti), tono: riepilogo.minuti > 0 ? 'attesa' : 'spento' },
                ]}
              />
            </TerminalPanel>
          ))}
        </div>
      )}

      {vista === 'registro' && (
        <div className="ui-corpo-stretto">
          {registro.length === 0 ? (
            <div className="empty-state">
              Nessun ritardo e nessuna assenza nel periodo scelto.
            </div>
          ) : (
            <ul className="ui-colonna fitta" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {registro.map(({ evento, persona }) => (
                <li key={evento.id}>
                  <TerminalPanel
                    livello={3}
                    titolo={`${data(evento.giorno)} · ${etichettaTipo(evento.tipo)}`}
                    meta={persona.name}
                  >
                    <TerminalRows
                      voci={[
                        evento.tipo === RITARDO
                          ? { label: 'Quanto', valore: durata(evento.minuti), tono: 'attesa' }
                          : { label: 'Giornata', valore: 'assente', tono: 'errore' },
                        { label: 'Giustificata', valore: evento.giustificata ? 'sì' : 'no', tono: evento.giustificata ? '' : 'spento' },
                        evento.nota ? { label: 'Nota', valore: evento.nota, tono: 'testo' } : null,
                      ]}
                    />
                    <div className="ui-quest-actions">
                      <Button
                        variante="secondario"
                        compatto
                        onClick={() => { setAvviso(''); setRegistrando({ persona, evento }); }}
                      >
                        Correggi
                      </Button>
                      <Button
                        variante="pericolo"
                        compatto
                        onClick={() => setDaEliminare({ evento, persona })}
                      >
                        Elimina
                      </Button>
                    </div>
                  </TerminalPanel>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {registrando && (
        <RegistraDialog
          me={me}
          persone={persone}
          personaIniziale={registrando.persona}
          onChiudi={() => setRegistrando(null)}
          onFatto={({ evento, sostituita }) => {
            const chi = getUserById(evento.employeeId)?.name || 'la persona';
            setAvviso(`${sostituita ? 'Corretto' : 'Registrato'}: ${etichettaTipo(evento.tipo).toLowerCase()} di ${chi} il ${data(evento.giorno)}.`);
            setRegistrando(null);
          }}
        />
      )}

      {daEliminare && (
        <ConfirmDialog
          titolo="Elimino la registrazione?"
          distruttiva
          testo={`${etichettaTipo(daEliminare.evento.tipo)} di ${daEliminare.persona.name} del ${data(daEliminare.evento.giorno)}. Sparisce anche dalle sue analytics.`}
          conferma="Elimina"
          onConferma={() => {
            elimina(me, daEliminare.evento.id);
            setAvviso(`Eliminata la registrazione di ${daEliminare.persona.name} del ${data(daEliminare.evento.giorno)}.`);
            setDaEliminare(null);
          }}
          onChiudi={() => setDaEliminare(null)}
        />
      )}

      <BackTile />
    </>
  );
}
