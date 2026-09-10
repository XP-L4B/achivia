import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { avatarForUser } from '../../data/avatars';
import {
  getUnreadCount, getUserById, xpForNextLevel, subscribe, orgPersonalizzata, nomeOrgDi,
} from '../../data/db';
import { presenceStreak } from '../../data/presenze';
import { emblemaDi } from '../../data/emblema';
import Tile from '../ui/Tile';
import ProfileSkills from '../skills/ProfileSkills';
import ProfileAchievements from '../achievements/ProfileAchievements';
import PresenceStreak, { BadgePresenza } from './PresenceStreak';
import HelpButton from '../ui/HelpButton';
import CalendarIcon from '../ui/CalendarIcon';
import LeagueIcon from '../ui/LeagueIcon';
import AnnunciIcon from '../ui/AnnunciIcon';
import TerminalPanel from '../terminal/TerminalPanel';
import TerminalRows, { TerminalValue } from '../terminal/TerminalRows';
import { cifra } from '../terminal/formato';
import TerminalBar from '../terminal/TerminalBar';
import questsIcon from '../../assets/quest_icon.png';
import dataIcon from '../../assets/analytics_icon.png';
import shopIcon from '../../assets/ui/shop.png';
import orgIcon from '../../assets/management_icon.png';
import dmIcon from '../../assets/ui/dm.png';
import adminIcon from '../../assets/ui/joinOrg.png';
import arenaIcon from '../../assets/ui/arena.png';
import { puo } from '../../data/permessi';
import ProfiloOrganizzazione, { StatoOrganizzazione } from './ProfiloOrganizzazione';
import Emblema from '../ui/Emblema';
import NomePersona from '../ui/NomePersona';
import TraguardiOrganizzazione from '../achievements/TraguardiOrganizzazione';

/**
 * I sei riquadri della schermata 8 dei mockup. Marketplace e messaggi sono
 * gli stessi per tutti; quest, dati, organizzazione e notifiche portano
 * ognuno alla pagina del proprio ruolo.
 */
function tilesForRole(persona) {
  const role = persona?.role;
  const comuni = {
    // Il disegno nuovo dello Shop e' una casa e basta: la scritta grande che
    // il vecchio portava sotto non c'e' piu' (resta solo l'insegnetta
    // dipinta sopra la porta, che e' parte del disegno). Quindi il nome lo
    // scrive l'app, come per gli altri cinque.
    shop: { icon: shopIcon, label: 'Shop', to: '/marketplace' },
    // Una tessera sola per tutto quello che arriva, e il pallino sta li'.
    // Prima ce n'erano due — "DM" e "Notifiche" — che portavano allo stesso
    // elenco: il pallino su una delle due non voleva dire niente, perche'
    // l'altra mostrava le stesse cose senza segnarle.
    dm:   { icon: dmIcon,   label: 'Casella', to: '/messaggi', alert: true },
    // La bacheca: le posizioni aperte che le organizzazioni hanno
    // pubblicato. Ci si arrivava da un posto solo — impostazioni, trova
    // lavoro, cerca tra gli annunci — e le impostazioni sono dove si va a
    // cambiare la password, non dove si cerca lavoro.
    //
    // Guardarla non accende niente e non lascia traccia: leggere una
    // bacheca non e' farsi schedare, e per questo la porta sta in chiaro
    // come tutte le altre. Il megafono e' l'unica icona che va in quella
    // direzione: le altre portano dentro — le proprie quest, i propri dati,
    // la propria org — questa porta fuori.
    //
    // Il negozio e l'osservatorio non la vedono, e senza un controllo
    // apposta: questa schermata e' dei profili di persone, e loro hanno una
    // dashboard tutta loro.
    annunci: { icon: <AnnunciIcon size={56} />, label: 'Annunci\ndi lavoro', to: '/annunci' },
    // La lega fra organizzazioni: la stessa porta per tutti quelli che
    // possono entrarci. Il marchio dell'app con una coppa nell'angolo — di
    // casa, ma con dentro una gara.
    //
    // Chi sta in un'organizzazione personalizzata non ce l'ha: quel tipo di
    // organizzazione una lega non ce l'ha proprio, e un riquadro che porta
    // a una classifica in cui non si entrera' mai e' una promessa che
    // nessuno ha intenzione di mantenere.
    league: { icon: <LeagueIcon size={56} />, label: 'Achivia’s\nLeague', to: '/leaderboard' },
    // I giochi. Sono di tutti i profili di persone, e il livello
    // dell'account ci apre personaggi e statistiche — quindi stanno qui,
    // fra le cose che il lavoro sblocca. Il riquadro porta all'elenco e non
    // a un gioco solo: i giochi sono due, e domani saranno tre.
    arena: { icon: arenaIcon, label: 'Games', to: '/giochi' },
  };
  const personalizzata = orgPersonalizzata(persona?.orgId);
  /* Chi un'organizzazione non ce l'ha — ha lasciato quella di prima, o non
     ne ha mai avuta una — al posto di "Persone" trova la porta per
     farsene una. La pagina dell'organizzazione, per lui, e' una stanza
     vuota. */
  const senzaOrg = !persona?.orgId;
  // L'admin ha le stesse scorciatoie del manager: le sue schermate sono
  // quelle, e quelle del dipendente non gli sono nemmeno accessibili.
  if (role === 'manager' || role === 'admin') {
    return [
      { icon: questsIcon, label: 'Quest', to: '/manager/management/quests' },
      { icon: dataIcon,   label: 'Analytics', to: '/manager/data' },
      comuni.shop,
      /* Si chiama come la schermata a cui porta. Prima era «La mia org»
         qui e «Persone» nella griglia di Gestione: due nomi per lo stesso
         posto, e chi li vedeva tutti e due non poteva sapere che erano lo
         stesso posto. */
      { icon: orgIcon,    label: 'Persone', to: '/manager/management/employees' },
      comuni.dm,

      // Ritardi e assenze: c'e' solo per chi ha il permesso di registrarli,
      // perche' si registrano su qualcun altro. L'icona e' il calendario
      // dell'app, in attesa di un disegno suo.
      ...(puo(persona, 'people.attendance')
        ? [{ icon: <CalendarIcon size={56} />, label: 'Time & Attendance', to: '/manager/attendance' }]
        : []),
      comuni.annunci,
      ...(personalizzata ? [] : [comuni.league]),
      comuni.arena,
      // L'admin gira in queste schermate come chiunque altro: questo e' il
      // riquadro da cui torna alle sue. Sta in fondo perche' e' la porta
      // d'uscita, non una delle cose che si fanno qui dentro.
      ...(role === 'admin'
        ? [{ icon: adminIcon, label: 'Dashboard\nadmin', to: '/admin' }]
        : []),
    ];
  }
  return [
    { icon: questsIcon, label: 'Quest', to: '/employee/quests' },
    { icon: dataIcon,   label: 'Analytics', to: '/employee/analytics' },
    comuni.shop,
    senzaOrg
      ? { icon: orgIcon, label: 'Crea\nun’organizzazione', to: '/auth/register/org-type' }
      : { icon: orgIcon, label: 'Persone', to: '/employee/org' },
    comuni.dm,
    comuni.annunci,
    ...(personalizzata ? [] : [comuni.league]),
    comuni.arena,
  ];
}

/**
 * Schermata profilo condivisa (manager e dipendente), in stile pixel-art.
 * `customizePath` è l'unica differenza tra i due ruoli.
 */
export default function ProfileScreen({ customizePath }) {
  const { user } = useAuth();
  const [, setVersion] = useState(0);

  // Tiene aggiornati notifiche e ricompense (anche da altre schede/sessioni).
  useEffect(() => subscribe(() => setVersion((v) => v + 1)), []);

  const me = getUserById(user.id) || user;
  const unread = getUnreadCount(me.id);
  const nextLevelXp = xpForNextLevel(me.level);
  const xpPct = Math.min(100, Math.round((me.xp / nextLevelXp) * 100));
  const streak = presenceStreak(me.id);
  // L'admin non esegue quest e non si fa certificare: il suo profilo e'
  // quello dell'organizzazione. Cambia cosa dicono i riquadri sotto
  // l'avatar, non la scheda del personaggio: l'avatar lo sceglie come tutti.
  const eAdmin = me.role === 'admin';

  return (
    <div className="pixel-profile">
      {/* Nella schermata 8 questa parte sta dentro un pannello scuro:
          i riquadri sotto restano invece appoggiati allo sfondo. */}
      <div className="ui-profile-card">
        {/* Nome centrato + icona messaggi a destra sulla stessa riga */}
        <div style={{ position: 'relative', width: '100%' }}>
          {/* La guida sta a sinistra del nome: a destra c'e' gia' l'icona
              dei messaggi, e le due non si devono contendere l'angolo. */}
          <span className="ui-help-ancorata">
            <HelpButton />
          </span>
          <h1 className="px-title" style={{ fontSize: '1.2rem' }}>
            <NomePersona persona={me} grande />
          </h1>
          <Link to="/messaggi" className="px-icon bare" aria-label="Casella" style={{ position: 'absolute', top: 0, right: 0 }}>
            <svg width="25" height="25" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
              <path d="M224,48H32A16,16,0,0,0,16,64V192a16,16,0,0,0,16,16H224a16,16,0,0,0,16-16V64A16,16,0,0,0,224,48ZM32,64H224v92H180.94a16,16,0,0,0-11.32,4.69L153.37,172H102.63L86.38,156.69A16,16,0,0,0,75.06,152H32Zm192,128H32V168H75.06l16.25,16.31A16,16,0,0,0,102.63,189h50.74a16,16,0,0,0,11.32-4.69L180.94,168H224v24Z" />
            </svg>
            {unread > 0 && <span className="px-badge">{unread}</span>}
          </Link>
        </div>

        {/* Nome del team, leggermente più piccolo */}
        {me.department && (
          <span className="px-font" style={{ fontSize: '0.7rem', color: 'var(--px-muted)' }}>{me.department}</span>
        )}

        {/* Avatar senza riquadro visibile; icona modifica in alto a destra dei suoi limiti */}
        <div style={{ position: 'relative', width: 200, height: 200 }}>
          <img
            src={avatarForUser(me)}
            alt="Avatar"
            className="px-avatar"
            style={{ width: '100%', height: '100%' }}
          />
          {/* La medaglia del livello di presenza, appoggiata all'angolo in
              basso: sta sul bordo dell'avatar, non sopra la faccia. */}
          {streak.misurabile && !eAdmin && (
            <span className="ps-badge-avatar">
              <BadgePresenza streak={streak} size={54} />
            </span>
          )}
          <Link
            to={customizePath}
            className="px-icon bare"
            aria-label="Modifica avatar"
            style={{ position: 'absolute', top: '12%', right: '18%' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M7 7H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-1" />
              <path d="M20.385 6.585a2.1 2.1 0 0 0-2.97-2.97L8.5 12V15h3z" />
              <path d="M16 5l3 3" />
            </svg>
          </Link>
        </div>

        {/* Crediti, livello e avanzamento: il terminale di bordo del
            personaggio. Erano tre righe con tre stili diversi — la moneta,
            la barra azzurra, la scritta piccola in mezzo — e dicevano tutte
            e tre la stessa cosa: a che punto sei. */}
        {/* L'insegna dell'organizzazione: sta appena sotto l'avatar, che e'
            il ritratto della persona — questo e' il ritratto dell'azienda, e
            lo mette chi la guida. */}
        {eAdmin && (
          <Link to="/manager/emblema" className="emblema-riga">
            <span className="emblema-riga-immagine">
              <Emblema orgId={me.orgId} nomeOrg={nomeOrgDi(me.orgId)} size={44} />
            </span>
            <span className="emblema-riga-testo">
              <b>{emblemaDi(me.orgId) ? 'Insegna dell’organizzazione' : 'Aggiungi l’insegna'}</b>
              <small>{emblemaDi(me.orgId) ? 'Logo o stemma: cambialo quando vuoi' : 'Carica il logo o disegna uno stemma'}</small>
            </span>
          </Link>
        )}

        {eAdmin ? (
          <StatoOrganizzazione persona={me} />
        ) : (
          <TerminalPanel
            titolo="STATUS"
            meta={`LVL ${me.level}`}
            piede={`XP_AL_LIVELLO_SUCCESSIVO: ${cifra(Math.max(0, nextLevelXp - me.xp))}`}
            style={{ width: '100%' }}
          >
            <TerminalValue valore={cifra(me.xp)} unita="XP" nota={`/ ${cifra(nextLevelXp)}`} />
            <TerminalBar
              percentuale={xpPct}
              etichetta={`${xpPct}% verso il livello ${me.level + 1}`}
            />
            <div className="tv-riga" aria-hidden="true" />
            <TerminalRows
              vivo
              voci={[
                ['Livello', me.level],
                { label: 'Crediti', valore: `◉ ${cifra(me.credits)}`, tono: 'oro' },
              ]}
            />
          </TerminalPanel>
        )}
      </div>

      {eAdmin ? (
        // I numeri dell'azienda al posto dei traguardi personali: quest,
        // persone, crediti. E' quello per cui l'admin apre questa pagina —
        // e sotto, le medaglie che quei numeri hanno fatto vincere.
        <>
          <ProfiloOrganizzazione persona={me} />
          <TraguardiOrganizzazione persona={me} pieghevole />
        </>
      ) : (
        <>
          {/* I giorni di fila senza assenze: il proprio, per chiunque abbia un
              profilo — manager compresi. */}
          <PresenceStreak persona={me} />

          {/* Le competenze gia' riconosciute, come anticipo dello Skill Tree */}
          <ProfileSkills
            persona={me}
            to={me.role === 'employee' ? '/employee/skills' : '/manager/management/skills'}
          />

          {/* Le medaglie conquistate: una sezione sua, non una riga fra i dati */}
          <ProfileAchievements
            persona={me}
            me={me}
            verso={me.role === 'employee' ? '/employee/achievements' : '/manager/achievements'}
          />
        </>
      )}

      {/* I sei riquadri della schermata 8 */}
      <div className="ui-tiles" style={{ width: '100%', padding: 0 }}>
        {tilesForRole(me).map((t) => (
          <Tile
            // La destinazione e' l'unica cosa sempre diversa: l'etichetta
            // manca dove la scritta e' gia' dentro l'immagine.
            key={t.to}
            to={t.to}
            icon={t.icon}
            label={t.label}
            alt={t.alt}
            className={t.className}
            count={t.alert ? unread : 0}
          />
        ))}
      </div>
    </div>
  );
}
