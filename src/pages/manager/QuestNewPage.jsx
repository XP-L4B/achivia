import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageShell from '../../components/ui/PageShell';
import { useAuth } from '../../context/AuthContext';
import BackTile from '../../components/ui/BackTile';
import Spot from '../../components/pubblicita/Spot';
import useSpot from '../../components/pubblicita/useSpot';
import {
  addQuest, addNotification, getEmployeesOfManager,
  getProjectsByManager, getQuestById, getUserById,
} from '../../data/db';
import { puo } from '../../data/permessi';

const TYPES = [
  { id: 'principale', label: 'Principale' },
  { id: 'side',       label: 'Side Quest' },
  { id: 'istanza',    label: 'Istanza / gruppo' },
];

export default function QuestNewPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const template = params.get('template') ? getQuestById(params.get('template')) : null;

  const [title, setTitle] = useState(template?.title || '');
  const [description, setDescription] = useState(template?.description || '');
  const [deadline, setDeadline] = useState('');
  const [type, setType] = useState(template?.type || 'principale');
  const [credits, setCredits] = useState(template?.credits ?? 0);
  // Arrivando dalla scheda di un dipendente, il destinatario è già scelto.
  const [assignee, setAssignee] = useState(params.get('assignee') || '');
  const [asTemplate, setAsTemplate] = useState(false);
  const [error, setError] = useState('');

  const me = getUserById(user.id) || user;
  const { spot, parti, chiudi } = useSpot(me.orgId);
  const employees = getEmployeesOfManager(user.id);
  const projects = getProjectsByManager(user.id);

  function save() {
    if (!title.trim()) { setError('Il titolo e’ obbligatorio.'); return; }
    if (!asTemplate && !deadline && type !== 'side') { setError('Indica una scadenza oppure salva come modello.'); return; }

    // Il permesso si controlla qui, non solo nascondendo il riquadro: chi
    // arriva all'indirizzo a mano deve trovare la stessa risposta.
    if (!puo(me, 'quest.create')) {
      setError('Non hai il permesso di creare quest.');
      return;
    }

    const isProject = type === 'istanza';
    const base = {
      title: title.trim(),
      description: description.trim(),
      deadline: deadline || null,
      type,
      // L'esperienza non si sceglie: e' la ricompensa in crediti. Un lavoro
      // vale quello che vale, e l'esperienza lo segue. E la ricompensa la
      // mette solo chi ha il permesso di metterla: senza, la quest si crea
      // lo stesso, ma non porta crediti.
      credits: puo(me, 'quest.credits') ? Number(credits) || 0 : 0,
      createdById: user.id,
      createdAt: new Date().toISOString(),
    };

    if (asTemplate) {
      addQuest({ ...base, status: 'template' });
      navigate('/manager/management/quests/saved');
      return;
    }

    // Il tipo di destinatario segue chi e' stato scelto: una quest data a un
    // manager va segnata come sua, altrimenti non la troverebbe fra le
    // proprie. Solo l'admin arriva a sceglierne uno.
    const scelto = assignee && !isProject ? getUserById(assignee) : null;
    const quest = addQuest({
      ...base,
      status: 'in_corso',
      assigneeType: assignee
        ? (isProject ? 'project' : (scelto?.role === 'manager' ? 'manager' : 'employee'))
        : null,
      assigneeId: assignee || null,
      projectId: isProject && assignee ? assignee : undefined,
    });

    if (assignee && !isProject) {
      addNotification({
        userId: assignee,
        kind: 'quest_proposta',
        text: `Ti e’ stata proposta la quest "${quest.title}"`,
        questId: quest.id,
      });
    }
    /* Sul piano gratuito, assegnare una quest fa partire uno spot. Il
       passaggio alla schermata delle quest attive aspetta che si chiuda: se
       cambiassimo pagina prima, lo spot comparirebbe sopra quella sbagliata,
       e se non aspettassimo affatto non lo vedrebbe nessuno. Sugli altri
       piani `parti` esegue subito il seguito e non succede niente. */
    parti(() => navigate('/manager/management/quests/active'));
  }

  return (
    <>
      <PageShell title="Nuova Quest" description={template ? 'Dati precompilati dal modello: scegli l’assegnatario.' : 'Compila i dettagli della quest.'} />
      <div className="px-filters" style={{ padding: '0 var(--space-6) var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <input type="text" placeholder="Nome quest" value={title} onChange={(e) => { setTitle(e.target.value); setError(''); }} />
        <textarea rows={3} placeholder="Descrizione" value={description} onChange={(e) => setDescription(e.target.value)} style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.6rem', lineHeight: 1.6 }} />
        <label className="label">Scadenza</label>
        <input type="datetime-local" value={deadline} onChange={(e) => { setDeadline(e.target.value); setError(''); }} />

        <label className="label">Tipologia</label>
        <select value={type} onChange={(e) => { setType(e.target.value); setAssignee(''); }}>
          {TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>

        <label className="label">Ricompensa in crediti</label>
        <input type="number" min="0" value={credits} onChange={(e) => setCredits(e.target.value)} />
        <p className="ui-dialog-hint">
          Vale anche come esperienza: chi chiude la quest guadagna
          {' '}{Number(credits) || 0} crediti e altrettanti punti.
          {type === 'istanza' && ' Su una quest di gruppo la ricompensa si divide in parti uguali fra chi ci lavora.'}
        </p>

        <label className="label">Assegna a</label>
        <select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
          <option value="">Nessuno (diventa Side Quest)</option>
          {type === 'istanza'
            ? projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)
            : employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>

        <label className="px-check" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <input type="checkbox" checked={asTemplate} onChange={(e) => { setAsTemplate(e.target.checked); setError(''); }} style={{ width: 'auto' }} />
          <span className="label">Salva come modello</span>
        </label>

        {error && <p className="ui-errore" role="alert">{error}</p>}

        <button type="button" className="px-btn block" onClick={save}>
          {asTemplate ? 'Usa come template' : 'Salva'}
        </button>
      </div>
      <BackTile />
      {spot && <Spot reclame={spot.reclame} onChiudi={chiudi} />}
    </>
  );
}
