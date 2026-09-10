import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageShell from '../../components/ui/PageShell';
import Chips from '../../components/ui/Chips';
import BackTile from '../../components/ui/BackTile';
import Button from '../../components/ui/Button';
import SkillBadge from '../../components/skills/SkillBadge';
import MySkillTree from '../../components/skills/MySkillTree';
import AssignSkillDialog from '../../components/skills/AssignSkillDialog';
import CreateSkillDialog from '../../components/skills/CreateSkillDialog';
import SkillDetailDialog from '../../components/skills/SkillDetailDialog';
import TerminalPanel from '../../components/terminal/TerminalPanel';
import TerminalRows, { TerminalValue } from '../../components/terminal/TerminalRows';
import { useAuth } from '../../context/AuthContext';
import { getUserById, subscribe, deleteSkill, revokeCertification, recommendSkill } from '../../data/db';
import {
  getSkills, mappaTeam, storicoOrg, personeCertificabili,
  puoModificareSkill, puoCreareSkill, riepilogoSkill,
} from '../../data/skills';
import { SKILL_CATEGORIES, SKILL_LEVELS } from '../../data/skillsCatalog';
import useFinestra from '../../hooks/useFinestra';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import PromptDialog from '../../components/ui/PromptDialog';

const VISTE = [
  { id: 'team',        label: 'Team' },
  { id: 'competenze',  label: 'Competenze' },
  { id: 'storico',     label: 'Storico' },
];

// L'albero proprio ce l'ha chi le competenze le sviluppa. L'admin no: e' il
// proprietario, non si autocertifica niente, e una vista "Le mie" per lui
// sarebbe un ramo vuoto per sempre.
const VISTA_MIA = { id: 'mie', label: 'Le mie' };

const ORDINAMENTI = [
  { id: 'recenti',  label: 'Più recenti' },
  { id: 'quante',   label: 'Più certificate' },
  { id: 'persona',  label: 'Nome persona' },
];

const data = (v) => (v ? new Date(v).toLocaleDateString('it-IT') : '—');

/**
 * La pagina di chi certifica: manager e admin.
 *
 * Quattro viste sullo stesso materiale — la mappa del team, il catalogo
 * delle competenze, lo storico delle certificazioni e il proprio albero —
 * perche' chi guida ha competenze anche lui e non deve uscire di qui per
 * vederle.
 */
export default function SkillsPage() {
  const { user } = useAuth();
  const [, setVersione] = useState(0);
  useEffect(() => subscribe(() => setVersione((v) => v + 1)), []);
  const aggiorna = () => setVersione((v) => v + 1);

  const me = getUserById(user.id) || user;
  const proprioAlbero = me.role !== 'admin';
  const viste = proprioAlbero ? [...VISTE, VISTA_MIA] : VISTE;
  const [vista, setVista] = useState('team');
  const [cerca, setCerca] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroStato, setFiltroStato] = useState('');
  const [filtroLivello, setFiltroLivello] = useState('');
  const [ordine, setOrdine] = useState('recenti');

  const persone = useMemo(() => personeCertificabili(me), [me]);

  const [assegnando, setAssegnando] = useState(null);   // { persona } oppure {}
  const [creando, setCreando] = useState(null);          // { skill } per modifica
  const [aperto, setAperto] = useState(null);            // nodo nel dettaglio
  const [conferma, setConferma] = useState('');
  const [daEliminare, setDaEliminare] = useState(null);
  const [daRevocare, setDaRevocare] = useState(null);

  // Arrivando dalla scheda di una persona (`?persona=`) la sua mappa e' gia'
  // aperta: il riquadro sulla scheda porta alle sue competenze, non a un
  // elenco in cui ritrovarla. La si cerca fra chi si puo' certificare
  // davvero, cosi' l'indirizzo non diventa una scorciatoia per guardare
  // altrove; ed e' lo stato iniziale, non un effetto, altrimenti chiudere la
  // scheda la riaprirebbe al primo aggiornamento della pagina.
  const [parametri] = useSearchParams();
  const [personaAperta, setPersonaAperta] = useState(
    () => persone.find((p) => p.id === parametri.get('persona')) || null
  );
  const finestraPersona = useFinestra(Boolean(personaAperta), () => setPersonaAperta(null));
  const skills = useMemo(() => getSkills(me.orgId), [me.orgId]);
  const team = useMemo(() => mappaTeam(me), [me]);

  const q = cerca.trim().toLowerCase();

  /* ─── Mappa del team, filtrata e ordinata ─── */
  const teamVisibile = useMemo(() => {
    let righe = team.filter(({ persona, certificate }) => {
      if (!q) return true;
      return persona.name.toLowerCase().includes(q)
        || certificate.some((c) => c.skill.name.toLowerCase().includes(q));
    });
    if (filtroCategoria) {
      righe = righe.filter((r) => r.certificate.some((c) => c.skill.categoria === filtroCategoria));
    }
    if (filtroTipo) {
      righe = righe.filter((r) => r.certificate.some((c) => c.skill.type === filtroTipo));
    }
    if (filtroLivello) {
      righe = righe.filter((r) => r.certificate.some((c) => String(c.certificazione.level) === filtroLivello));
    }
    const ordinata = [...righe];
    if (ordine === 'persona') ordinata.sort((a, b) => a.persona.name.localeCompare(b.persona.name));
    if (ordine === 'quante') ordinata.sort((a, b) => b.riepilogo.certificate - a.riepilogo.certificate);
    if (ordine === 'recenti') {
      const ultima = (r) => Math.max(0, ...r.certificate.map((c) => new Date(c.certificazione.certifiedAt).getTime()));
      ordinata.sort((a, b) => ultima(b) - ultima(a));
    }
    return ordinata;
  }, [team, q, filtroCategoria, filtroTipo, filtroLivello, ordine]);

  /* ─── Catalogo competenze, filtrato ─── */
  const skillVisibili = useMemo(() => skills.filter((s) => {
    if (q && !s.name.toLowerCase().includes(q) && !s.description.toLowerCase().includes(q)) return false;
    if (filtroCategoria && s.categoria !== filtroCategoria) return false;
    if (filtroTipo && s.type !== filtroTipo) return false;
    return true;
  }), [skills, q, filtroCategoria, filtroTipo]);

  const custom = skillVisibili.filter((s) => !s.isStandard);

  /* ─── Storico ─── */
  const storico = useMemo(() => {
    let righe = storicoOrg(me.orgId, { soloPersone: persone });
    if (q) {
      righe = righe.filter((c) => c.persona.name.toLowerCase().includes(q) || c.skill.name.toLowerCase().includes(q));
    }
    if (filtroStato === 'certified') righe = righe.filter((c) => c.status === 'certified');
    if (filtroStato === 'revoked') righe = righe.filter((c) => c.status === 'revoked');
    return righe;
  }, [me.orgId, persone, q, filtroStato]);

  /* ─── Riepilogo in testa ─── */
  const totali = useMemo(() => team.reduce((acc, r) => ({
    certificate: acc.certificate + r.riepilogo.certificate,
    soft: acc.soft + r.riepilogo.soft,
    tecniche: acc.tecniche + r.riepilogo.tecniche,
    daSviluppare: acc.daSviluppare + r.riepilogo.daSviluppare,
    livelli: acc.livelli + r.riepilogo.livelli,
  }), { certificate: 0, soft: 0, tecniche: 0, daSviluppare: 0, livelli: 0 }), [team]);

  function elimina() {
    deleteSkill(daEliminare.id);
    setDaEliminare(null);
    aggiorna();
  }

  function revoca(motivo) {
    revokeCertification(daRevocare.id, { byId: me.id, reason: motivo });
    setDaRevocare(null);
    setAperto(null);
    aggiorna();
  }

  // Azioni disponibili aprendo una competenza nella scheda di una persona.
  const azioniPerNodo = (persona) => (nodo, chiudi) => (
    <>
      {nodo.stato === 'certified' ? (
        <Button variante="pericolo" onClick={() => { setDaRevocare(nodo.certificazione); chiudi(); }}>
          Revoca
        </Button>
      ) : (
        <>
          <Button
            variante="successo"
            onClick={() => { setAssegnando({ persona, skill: nodo.skill }); chiudi(); }}
          >
            Certifica
          </Button>
          {/* Consigliare non e' annullare: era una pillola rossa da
              "annulla" solo perche' era l'unica forma disponibile. */}
          <Button
            variante="secondario"
            onClick={() => { recommendSkill({ employeeId: persona.id, skillId: nodo.skill.id, byId: me.id }); chiudi(); aggiorna(); }}
          >
            Consiglia
          </Button>
        </>
      )}
    </>
  );

  return (
    <>
      <PageShell
        title="Skill Tree"
        description="La mappa delle competenze del team: cosa è già riconosciuto e cosa resta da costruire."
      />

      <div style={{ padding: '0 14px' }}>
        <TerminalPanel
          titolo="SKILL_INDEX"
          meta={`${team.length} ${team.length === 1 ? 'persona' : 'persone'}`}
          piede={`LIVELLI_TOTALI: ${totali.livelli}`}
          style={{ marginBottom: 'var(--space-4)' }}
        >
          <TerminalValue valore={totali.certificate} unita="certificate" nota="in tutto il team" />
          <div className="tv-riga" aria-hidden="true" />
          <TerminalRows
            vivo
            voci={[
              ['Soft skill', totali.soft],
              ['Tecniche', totali.tecniche],
              { label: 'Da sviluppare', valore: totali.daSviluppare, tono: totali.daSviluppare > 0 ? 'attesa' : 'spento' },
            ]}
          />
        </TerminalPanel>

        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-3)' }}>
          {persone.length > 0 && (
            <Button variante="successo" onClick={() => setAssegnando({})}>Certifica competenza</Button>
          )}
          {puoCreareSkill(me) && (
            <Button variante="secondario" onClick={() => setCreando({})}>+ Crea competenza</Button>
          )}
        </div>
      </div>

      <Chips items={viste} value={vista} onChange={setVista} ariaLabel="Cosa vedere" />

      {vista !== 'mie' && (
        <div className="skill-filters">
          <input
            type="search"
            value={cerca}
            onChange={(e) => setCerca(e.target.value)}
            placeholder="Cerca persona o competenza…"
            aria-label="Cerca persona o competenza"
          />
          <div className="skill-filters-row">
            <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} aria-label="Categoria">
              <option value="">Tutte le categorie</option>
              {SKILL_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} aria-label="Tipo">
              <option value="">Soft e tecniche</option>
              <option value="soft">Solo soft skill</option>
              <option value="technical">Solo tecniche</option>
            </select>
            {vista === 'team' && (
              <select value={filtroLivello} onChange={(e) => setFiltroLivello(e.target.value)} aria-label="Livello">
                <option value="">Tutti i livelli</option>
                {SKILL_LEVELS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
              </select>
            )}
            {vista === 'storico' && (
              <select value={filtroStato} onChange={(e) => setFiltroStato(e.target.value)} aria-label="Stato">
                <option value="">Tutte</option>
                <option value="certified">Valide</option>
                <option value="revoked">Revocate</option>
              </select>
            )}
            {vista === 'team' && (
              <select value={ordine} onChange={(e) => setOrdine(e.target.value)} aria-label="Ordina">
                {ORDINAMENTI.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            )}
          </div>
        </div>
      )}

      <div className="ui-list">
        {/* ─── Mappa del team ─── */}
        {vista === 'team' && (
          persone.length === 0 ? (
            <div className="empty-state ui-blocco">
              Non hai ancora persone di cui seguire le competenze.
            </div>
          ) : teamVisibile.length === 0 ? (
            <div className="empty-state ui-blocco">Nessun risultato con questi filtri.</div>
          ) : (
            teamVisibile.map(({ persona, riepilogo, certificate }) => (
              <article key={persona.id} className="ui-panel skill-team-row" style={{ margin: '0 14px 12px' }}>
                <header className="skill-team-head">
                  <button type="button" className="skill-team-name" onClick={() => setPersonaAperta(persona)}>
                    {persona.name}
                  </button>
                  <span className="skill-team-count">{riepilogo.certificate}/{riepilogo.totale}</span>
                </header>
                <div className="skill-branch-bar" role="img" aria-label={`${riepilogo.percentuale}% certificate`}>
                  <span style={{ width: `${riepilogo.percentuale}%` }} />
                </div>

                {certificate.length === 0 ? (
                  <p className="ui-dialog-hint" style={{ marginTop: 'var(--space-3)' }}>
                    Nessuna competenza certificata.
                  </p>
                ) : (
                  <div className="skill-team-badges">
                    {certificate.slice(0, 8).map(({ certificazione, skill, livello }) => (
                      <SkillBadge
                        key={certificazione.id}
                        skill={skill}
                        stato="certified"
                        livello={livello}
                        size={44}
                        title={`${skill.name}${livello ? ` — ${livello.label}` : ''}`}
                        onClick={() => setAperto({ skill, stato: 'certified', certificazione, livello, vienePrima: [] })}
                      />
                    ))}
                    {certificate.length > 8 && (
                      <button type="button" className="skill-more" onClick={() => setPersonaAperta(persona)}>
                        +{certificate.length - 8}
                      </button>
                    )}
                  </div>
                )}

                <Button
                  variante="successo"
                  style={{ marginTop: 'var(--space-3)' }}
                  onClick={() => setAssegnando({ persona })}
                >
                  Certifica una competenza
                </Button>
              </article>
            ))
          )
        )}

        {/* ─── Catalogo delle competenze ─── */}
        {vista === 'competenze' && (
          <>
            {custom.length === 0 && (
              <div className="empty-state" style={{ margin: '0 14px 12px' }}>
                <b>Nessuna competenza tecnica ancora.</b>
                <p style={{ margin: 'var(--space-2) 0 0' }}>
                  Crea le competenze specifiche del tuo team o della tua organizzazione.
                </p>
              </div>
            )}
            {skillVisibili.map((s) => (
              <article key={s.id} className="ui-panel skill-catalog-row" style={{ margin: '0 14px 12px' }}>
                <SkillBadge skill={s} stato="available" size={48} />
                <div className="skill-catalog-body">
                  <b>{s.name}</b>
                  <p>{s.description}</p>
                  <div className="skill-catalog-tags">
                    <span className="badge badge-neutral">{s.type === 'soft' ? 'Soft skill' : 'Tecnica'}</span>
                    {s.isStandard && <span className="badge badge-primary">standard Achivia</span>}
                    <span className="badge badge-neutral">4 livelli</span>
                  </div>
                  {puoModificareSkill(me, s) && (
                    <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                      <Button variante="secondario" compatto onClick={() => setCreando({ skill: s })}>Modifica</Button>
                      <Button variante="pericolo" compatto onClick={() => setDaEliminare(s)}>Elimina</Button>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </>
        )}

        {/* ─── Storico delle certificazioni ─── */}
        {vista === 'storico' && (
          storico.length === 0 ? (
            <div className="empty-state ui-blocco">Nessuna certificazione ancora.</div>
          ) : (
            storico.map((c) => (
              <article key={c.id} className={`ui-panel skill-history-row${c.status === 'revoked' ? ' is-revoked' : ''}`} style={{ margin: '0 14px 12px' }}>
                <SkillBadge skill={c.skill} stato={c.status === 'revoked' ? 'revoked' : 'certified'} livello={c.livello} size={40} />
                <div>
                  <b>{c.persona.name}</b> — {c.skill.name}
                  {c.livello && <span className="badge badge-neutral" style={{ marginLeft: 8 }}>{c.livello.label}</span>}
                  {c.status === 'revoked' && <span className="badge badge-danger" style={{ marginLeft: 8 }}>Revocata</span>}
                  {c.reason && <p className="skill-history-reason">“{c.reason}”</p>}
                  <small>
                    {c.da?.name || '—'} · {data(c.certifiedAt)}
                    {c.status === 'revoked' && ` · revocata da ${c.revocataDa?.name || '—'} il ${data(c.revokedAt)}`}
                  </small>
                  {c.status === 'certified' && (
                    <Button variante="pericolo" compatto style={{ marginTop: 'var(--space-2)' }} onClick={() => setDaRevocare(c)}>
                      Revoca
                    </Button>
                  )}
                </div>
              </article>
            ))
          )
        )}

        {/* ─── Il proprio albero ─── */}
        {vista === 'mie' && proprioAlbero && <MySkillTree persona={me} proprio />}
      </div>

      {/* Scheda di una persona del team */}
      {personaAperta && (
        <div className="ui-overlay" role="dialog" aria-modal="true" onClick={() => setPersonaAperta(null)}>
          <div ref={finestraPersona} tabIndex={-1} className="px-panel ui-dialog is-larga" onClick={(e) => e.stopPropagation()}>
            <b>{personaAperta.name}</b>
            <p className="ui-dialog-hint">
              {riepilogoSkill(personaAperta).certificate} competenze certificate. Apri una
              medaglia per certificarla, consigliarla o revocarla.
            </p>
            <MySkillTree persona={personaAperta} azioniPerNodo={azioniPerNodo(personaAperta)} />
            <Button variante="fantasma" blocco style={{ marginTop: 'var(--space-4)' }} onClick={() => setPersonaAperta(null)}>
              Chiudi
            </Button>
          </div>
        </div>
      )}

      {assegnando && (
        <AssignSkillDialog
          user={me}
          persone={persone}
          personaIniziale={assegnando.persona}
          onChiudi={() => setAssegnando(null)}
          onFatto={({ persona, skill }) => {
            setAssegnando(null);
            setConferma(`${skill.name} certificata a ${persona?.name || 'la persona scelta'}.`);
            setTimeout(() => setConferma(''), 2600);
            aggiorna();
          }}
        />
      )}

      {creando && (
        <CreateSkillDialog
          user={me}
          skill={creando.skill}
          onChiudi={() => setCreando(null)}
          onFatto={(s) => {
            setCreando(null);
            setConferma(`Competenza "${s.name}" salvata.`);
            setTimeout(() => setConferma(''), 2600);
            aggiorna();
          }}
        />
      )}

      <SkillDetailDialog nodo={aperto} onChiudi={() => setAperto(null)} />

      {/* Conferma discreta: il badge e' gia' comparso nella mappa */}
      {daEliminare && (
        <ConfirmDialog
          titolo={`Eliminare "${daEliminare.name}"?`}
          testo="Le certificazioni già assegnate restano nello storico delle persone: sparisce la competenza dal catalogo, non quello che qualcuno ha ottenuto."
          conferma="Elimina"
          distruttiva
          onConferma={elimina}
          onChiudi={() => setDaEliminare(null)}
        />
      )}

      {daRevocare && (
        <PromptDialog
          titolo="Revocare la certificazione?"
          testo="La medaglia resta nello storico della persona, segnata come revocata: non si cancella quello che e' successo, si dice che non vale piu'."
          etichetta="Motivo della revoca"
          segnaposto="Perché viene revocata"
          obbligatorio
          conferma="Revoca"
          distruttiva
          onConferma={revoca}
          onChiudi={() => setDaRevocare(null)}
        />
      )}

      {conferma && <p className="skill-toast" role="status">{conferma}</p>}

      <BackTile />
    </>
  );
}
