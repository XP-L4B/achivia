import { useState } from 'react';
import PageShell from '../../components/ui/PageShell';
import MemberRow from '../../components/ui/MemberRow';
import Chips from '../../components/ui/Chips';
import { useAuth } from '../../context/AuthContext';
import {
  getUsersByOrg, getOrgSeats, getUserById, codiceOrg, puoGuidare,
  getEmployeesOfManager, getDepartments,
} from '../../data/db';
import BackTile from '../../components/ui/BackTile';

/**
 * Le persone dell'organizzazione: chi c'è, chi guidi, e come farne entrare
 * altre.
 *
 * Erano due schermate — «Dipendenti» e «Membri» — e facevano la stessa
 * cosa con due elenchi di persone e due modi di filtrarli. Non erano una il
 * doppione dell'altra, il che è peggio: ognuna aveva qualcosa che
 * all'altra mancava, quindi a seconda di quale si apriva mancava qualcosa.
 * «Dipendenti» sapeva cercare per nome, per team e per livello, ma vedeva
 * solo chi ti sta sotto e non diceva quanti posti restano; «Membri» aveva i
 * posti, il codice di invito e i collegamenti aperti solo su chi puoi
 * davvero guidare, ma sapeva filtrare solo per ruolo.
 *
 * Adesso è una sola e tiene tutto. I filtri si combinano invece di
 * escludersi — prima erano tre modalità alternative, e cercare un nome
 * dentro un team voleva dire farlo a mano — e «Chi guido io» è una voce
 * dell'elenco dei filtri come le altre, perché è la stessa domanda:
 * *quale sottoinsieme di persone*.
 *
 * Il perimetro non è cambiato per nessuno: si vede l'organizzazione, come
 * in «Membri», e la scheda di una persona si apre solo se `puoGuidare` dice
 * di sì. Chi prima vedeva meno vede di più solo dove già poteva.
 */

const FILTRI = [
  { id: 'tutti',    label: 'Tutti' },
  { id: 'miei',     label: 'Chi guido io' },
  { id: 'manager',  label: 'Manager' },
  { id: 'employee', label: 'Dipendenti' },
];

export default function PersonePage() {
  const { user } = useAuth();
  const me = getUserById(user.id) || user;
  const [filtro, setFiltro] = useState('tutti');
  const [nome, setNome] = useState('');
  const [team, setTeam] = useState('');
  const [livello, setLivello] = useState('');
  const [copiato, setCopiato] = useState(false);

  const posti = getOrgSeats(me.orgId);
  const tutti = getUsersByOrg(me.orgId);
  /* Chi guidi tu: per l'admin sono tutti tranne gli altri admin, per chi
     guida la propria squadra. Se non guidi nessuno la voce non compare —
     un filtro che non toglie niente non è un filtro. */
  const miei = new Set(getEmployeesOfManager(me.id).map((p) => p.id));
  const voci = miei.size > 0 ? FILTRI : FILTRI.filter((f) => f.id !== 'miei');

  /* I team e i livelli si prendono da chi c'è davvero: un elenco a tendina
     con dentro un reparto in cui non lavora nessuno fa cercare a vuoto. */
  const reparti = getDepartments().filter((d) => tutti.some((u) => u.department === d));
  const livelli = [...new Set(tutti.map((u) => u.level).filter(Boolean))].sort((a, b) => a - b);

  const membri = tutti.filter((u) => {
    if (filtro === 'miei' && !miei.has(u.id)) return false;
    if ((filtro === 'manager' || filtro === 'employee') && u.role !== filtro) return false;
    if (nome && !u.name.toLowerCase().includes(nome.trim().toLowerCase())) return false;
    if (team && u.department !== team) return false;
    if (livello && String(u.level) !== livello) return false;
    return true;
  });

  const codice = codiceOrg(me.orgId) || me.orgId || '—';
  const pieno = posti.liberi === 0;

  const copia = async () => {
    try {
      await navigator.clipboard.writeText(codice);
      setCopiato(true);
      setTimeout(() => setCopiato(false), 1500);
    } catch { /* appunti non disponibili */ }
  };

  return (
    <>
      <PageShell
        title={`Persone ${posti.usati}/${posti.totali === Infinity ? '∞' : posti.totali}`}
        description="Le persone che fanno parte dell’organizzazione. Apri una scheda per vedere le performance, le quest assegnate e i progetti; condividi il codice per farne entrare altre."
      />

      <section className="ui-panel ui-blocco con-stacco">
        <p className="ui-ai-title">Codice di invito</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span className="ui-stat" style={{ letterSpacing: 2 }}>{codice}</span>
          <button type="button" className="px-btn" style={{ width: 'auto' }} onClick={copia}>
            {copiato ? 'Copiato' : 'Copia'}
          </button>
        </div>
        {pieno && (
          <p className="ui-errore" role="alert">
            I posti del piano gratuito sono esauriti: per aggiungere altre persone serve il piano a pagamento.
          </p>
        )}
      </section>

      <Chips items={voci} value={filtro} onChange={setFiltro} ariaLabel="Chi mostrare" />

      <div className="ui-corpo-stretto">
        <input
          type="text"
          placeholder="Nome e cognome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          aria-label="Cerca per nome"
        />
        {reparti.length > 0 && (
          <select value={team} onChange={(e) => setTeam(e.target.value)} aria-label="Filtra per team">
            <option value="">Tutti i team</option>
            {reparti.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        )}
        {livelli.length > 1 && (
          <select value={livello} onChange={(e) => setLivello(e.target.value)} aria-label="Filtra per livello">
            <option value="">Tutti i livelli</option>
            {livelli.map((l) => <option key={l} value={l}>Livello {l}</option>)}
          </select>
        )}
      </div>

      <div className="ui-list">
        {membri.length === 0 ? (
          <div className="empty-state ui-blocco">Nessuna persona trovata.</div>
        ) : membri.map((m) => (
          <MemberRow
            key={m.id}
            user={m}
            /* La scheda del dipendente e' area manager: per gli altri la riga
               resta senza link, altrimenti porterebbe a una pagina vietata. */
            to={puoGuidare(me, m) ? `/manager/management/employees/${m.id}` : undefined}
          />
        ))}
      </div>
      {/* Il guscio della gestione non lo mette: qui il pulsante è della pagina. */}
      <BackTile />
    </>
  );
}
