import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../../components/ui/PageShell';
import Chips from '../../components/ui/Chips';
import BackTile from '../../components/ui/BackTile';
import AchievementBadge from '../../components/achievements/AchievementBadge';
import AchievementProgress from '../../components/achievements/AchievementProgress';
import AchievementDetailDialog from '../../components/achievements/AchievementDetailDialog';
import TerminalPanel from '../../components/terminal/TerminalPanel';
import TerminalRows, { TerminalValue } from '../../components/terminal/TerminalRows';
import { useAuth } from '../../context/AuthContext';
import {
  getUserById, subscribe, orgPersonalizzata, getUsersByOrg, eliminaAchievementCreato,
} from '../../data/db';
import {
  riepilogoOrg, progressoDi, configuraCrediti, puoConfigurareCrediti, ricompensabile,
  sincronizza, puoAssegnareExtraMile,
} from '../../data/achievements';
import { TIPO_MANUALE, VUOTO_RECENTI } from '../../data/achievementsCatalog';
import CreaMedagliaDialog from '../../components/achievements/CreaMedagliaDialog';
import AssegnaMedagliaDialog from '../../components/achievements/AssegnaMedagliaDialog';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Button from '../../components/ui/Button';
import TraguardiOrganizzazione from '../../components/achievements/TraguardiOrganizzazione';
import { vinceTraguardiOrg, sincronizzaTraguardi } from '../../data/traguardiOrg';

const VISTE = [
  { id: 'quadro',   label: 'Quadro' },
  { id: 'libreria', label: 'Libreria' },
];

// "I miei" ce l'ha chi le medaglie le conquista lavorando. L'admin no: le
// sue sono quelle dell'organizzazione, e stanno nella vista qui sotto.
const VISTA_MIA = { id: 'mie', label: 'I miei' };

// Chi guida l'organizzazione ha una quarta vista: le medaglie dell'azienda,
// che non sono sue e non stanno insieme a quelle delle persone.
const VISTA_ORG = { id: 'org', label: 'Organizzazione' };

const data = (v) => (v ? new Date(v).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }) : '—');

/**
 * La pagina degli achievement per chi guida: come sta andando
 * l'organizzazione, che cosa si puo' ottenere e quanto vale.
 *
 * Il manager configura la ricompensa in crediti di ogni achievement — e solo
 * quella. Le condizioni degli achievement standard non si toccano da qui:
 * cambiarle a meta' strada cambierebbe il significato delle medaglie gia'
 * consegnate.
 */
export default function AchievementsPage() {
  const { user } = useAuth();
  const [, setVersione] = useState(0);
  const [vista, setVista] = useState('quadro');
  const [aperto, setAperto] = useState(null);
  // Le tre finestre delle medaglie su misura: inventarne una, consegnarla,
  // cancellarla. Esistono solo nelle organizzazioni personalizzate.
  const [creando, setCreando] = useState(null);      // null | {} | medaglia
  const [consegnando, setConsegnando] = useState(null);
  const [daEliminare, setDaEliminare] = useState(null);
  useEffect(() => subscribe(() => setVersione((v) => v + 1)), []);

  const me = getUserById(user.id) || user;
  const guida = vinceTraguardiOrg(me);
  // Chi apre la pagina vede numeri aggiornati anche se il suo ultimo sblocco
  // e' maturato altrove.
  useEffect(() => { sincronizza(me.id); sincronizzaTraguardi(me.id); }, [me.id]);

  const org = riepilogoOrg(me.orgId);
  /* In un'organizzazione personalizzata le medaglie standard non ci sono: quelle
     che si vedono le ha inventate qualcuno qui dentro, e da qui si
     inventano, si consegnano e si cancellano. */
  const personalizzata = orgPersonalizzata(me.orgId);
  const squadra = personalizzata
    ? getUsersByOrg(me.orgId).filter((p) => p.role !== 'admin' && puoAssegnareExtraMile(me, p))
    : [];

  return (
    <>
      <PageShell
        title="Achievements"
        description="Le medaglie che il team può conquistare, quante volte sono state prese e quanto valgono."
      />

      <Chips
        items={guida ? [...VISTE, VISTA_ORG] : [...VISTE, VISTA_MIA]}
        value={vista}
        onChange={setVista}
        ariaLabel="Cosa vedere"
      />

      {vista === 'quadro' && (
        <div className="ui-corpo-stretto tv-griglia a-due">
          <TerminalPanel
            titolo="ACHIEVEMENT_LOG"
            meta={`${org.perAchievement.length} obiettivi`}
            piede={org.istanze > 0 ? 'REGISTRO: AGGIORNATO' : 'REGISTRO: VUOTO'}
            tonoPiede={org.istanze > 0 ? '' : 'attesa'}
          >
            <TerminalValue valore={org.istanze} unita="medaglie" nota="consegnate al team" />
            <div className="tv-riga" aria-hidden="true" />
            <TerminalRows
              vivo
              voci={[
                ['Achievement sbloccati', org.sbloccati],
                ['Persone premiate', org.perPersona.length],
                {
                  label: 'Il più ottenuto',
                  valore: org.piuOttenuto ? `${org.piuOttenuto.definizione.nome} ×${org.piuOttenuto.volte}` : '—',
                  tono: org.piuOttenuto ? 'testo' : 'spento',
                },
              ]}
            />
          </TerminalPanel>

          <TerminalPanel titolo="ULTIMI_SBLOCCHI" meta={org.recenti.length > 0 ? `${org.recenti.length} record` : ''}>
            {org.recenti.length === 0 ? (
              <p className="tv-vuoto">{VUOTO_RECENTI}</p>
            ) : (
              <ul className="ach-recenti">
                {org.recenti.map(({ istanza, definizione, persona }) => (
                  <li key={istanza.id}>
                    <b>{persona?.name || 'Qualcuno'} · {definizione?.nome} #{istanza.ciclo}</b>
                    <small>
                      {data(istanza.ottenutoIl)}
                      {istanza.crediti > 0 && ` · +${istanza.crediti} crediti`}
                      {istanza.fonte === 'manual' && ' · assegnato'}
                    </small>
                  </li>
                ))}
              </ul>
            )}
          </TerminalPanel>

          <TerminalPanel titolo="CLASSIFICA" meta="chi ne ha di più">
            {org.perPersona.length === 0 ? (
              <p className="tv-vuoto">Nessuno ha ancora sbloccato un achievement.</p>
            ) : (
              <ul className="ach-classifica">
                {org.perPersona.slice(0, 8).map(({ persona, volte }) => (
                  <li key={persona.id}>
                    <Link to={`/manager/management/employees/${persona.id}`}>{persona.name}</Link>
                    <span>{volte}</span>
                  </li>
                ))}
              </ul>
            )}
          </TerminalPanel>
        </div>
      )}

      {vista === 'libreria' && (
        <div style={{ padding: '0 14px 16px', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {/* Detto una volta qui invece che otto volte sotto le medaglie. */}
          {personalizzata ? (
            <>
              <small className="ach-nota">
                Qui le medaglie le inventi tu: Achivia non ne porta nessuna. Si assegnano a
                mano, con una motivazione scritta, e restano dentro l’organizzazione — chi
                esce non se le porta via.
              </small>
              {puoConfigurareCrediti(me, { ricompensabile: true }) && (
                <Button variante="primario" onClick={() => setCreando({})}>
                  Inventa una medaglia
                </Button>
              )}
              {org.perAchievement.length === 0 && (
                <div className="empty-state ui-blocco">
                  <b>Nessuna medaglia, per ora.</b>
                  <p style={{ margin: 'var(--space-2) 0 0' }}>
                    Pensa a una cosa che vorresti vedere succedere più spesso, e dalle un nome.
                  </p>
                </div>
              )}
            </>
          ) : (
            <small className="ach-nota">
              Solo “Go the Extra Mile” porta una ricompensa in crediti, e la stabilisce
              l’amministratore dell’organizzazione. Gli altri si conquistano lavorando, e
              quel lavoro i crediti li ha già dati con le quest.
            </small>
          )}
          {org.perAchievement.map(({ definizione, volte, crediti }) => (
            <article key={definizione.id} className="ach-card">
              <AchievementBadge definizione={definizione} ottenuto={volte > 0} size={56} />
              <div className="ach-card-testo">
                <b>{definizione.nome}</b>
                <small>{definizione.descrizione}</small>
                <div className="ach-tag-riga">
                  <span className="badge badge-neutral">
                    {definizione.tipo === TIPO_MANUALE ? 'Manuale' : 'Automatico'}
                  </span>
                  <span className="badge badge-neutral">Ripetibile</span>
                  <span className="tv-chip">
                    {definizione.target}
                    <span className="tv-chip-label">{definizione.unita}</span>
                  </span>
                  <span className="tv-chip">
                    ×{volte}
                    <span className="tv-chip-label">dal team</span>
                  </span>
                </div>
                {/* La casella dei crediti c'e' su una medaglia sola, e solo per
                    chi puo' metterci mano: l'admin e i co-admin. Sulle altre
                    non c'e' niente da configurare, quindi non c'e' niente. */}
                {personalizzata && puoConfigurareCrediti(me, definizione) && (
                  <div className="ach-comandi">
                    <Button
                      variante="secondario"
                      compatto
                      disabled={squadra.length === 0}
                      onClick={() => setConsegnando(definizione)}
                    >
                      Consegna
                    </Button>
                    <Button variante="fantasma" compatto onClick={() => setCreando(definizione)}>
                      Modifica
                    </Button>
                    <Button variante="pericolo" compatto onClick={() => setDaEliminare(definizione)}>
                      Elimina
                    </Button>
                  </div>
                )}
                {ricompensabile(definizione) && (
                  puoConfigurareCrediti(me, definizione) ? (
                    <>
                      <label className="label ach-crediti">
                        Ricompensa in crediti
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={crediti}
                          onChange={(e) => { configuraCrediti(me, me.orgId, definizione.id, e.target.value); setVersione((v) => v + 1); }}
                        />
                      </label>
                      <small className="ach-nota">
                        Vale dal prossimo sblocco: le medaglie già consegnate tengono la ricompensa che avevano.
                      </small>
                    </>
                  ) : (
                    <small className="ach-nota">
                      Ricompensa: {crediti === 0 ? 'nessuna' : `${crediti} crediti`}. La stabilisce l’amministratore
                      dell’organizzazione, uguale per tutti.
                    </small>
                  )
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {vista === 'mie' && !guida && (
        <div style={{ padding: '0 14px 16px', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {org.perAchievement.map(({ definizione, crediti }) => {
            const p = progressoDi(me, definizione);
            return (
              <button key={definizione.id} type="button" className="ach-card is-cliccabile" onClick={() => setAperto(p)}>
                <AchievementBadge definizione={definizione} ottenuto={p.volte > 0} volte={p.volte} size={56} />
                <div className="ach-card-testo">
                  <b>{definizione.nome}</b>
                  <small>{definizione.descrizione}</small>
                  <AchievementProgress progresso={p} manuale={definizione.tipo === TIPO_MANUALE} />
                  {crediti > 0 && <span className="badge badge-primary">{crediti} crediti</span>}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {vista === 'org' && guida && (
        <div className="ui-corpo-stretto">
          <TraguardiOrganizzazione persona={me} />
        </div>
      )}

      {creando && (
        <CreaMedagliaDialog
          user={me}
          medaglia={creando.id ? creando : null}
          onFatto={() => { setCreando(null); setVersione((v) => v + 1); }}
          onChiudi={() => setCreando(null)}
        />
      )}

      {consegnando && (
        <AssegnaMedagliaDialog
          user={me}
          medaglia={consegnando}
          persone={squadra}
          onFatto={() => { setConsegnando(null); setVersione((v) => v + 1); }}
          onChiudi={() => setConsegnando(null)}
        />
      )}

      {daEliminare && (
        <ConfirmDialog
          titolo="Eliminare la medaglia?"
          testo={`Sparisce «${daEliminare.nome}» e anche tutte le volte che è stata consegnata: chi ce l'ha non ce l'ha più. Non si torna indietro.`}
          conferma="Elimina"
          distruttiva
          onConferma={() => { eliminaAchievementCreato(daEliminare.id); setDaEliminare(null); setVersione((v) => v + 1); }}
          onChiudi={() => setDaEliminare(null)}
        />
      )}

      <AchievementDetailDialog progresso={aperto} onChiudi={() => setAperto(null)} />
      <BackTile />
    </>
  );
}
