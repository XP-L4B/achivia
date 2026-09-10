import { useState } from 'react';
import PageShell from '../../components/ui/PageShell';
import Tile from '../../components/ui/Tile';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import teamsIcon from '../../assets/ui/teams.png';
import membersIcon from '../../assets/ui/members.png';
import infoIcon from '../../assets/ui/info.png';
import creditsIcon from '../../assets/ui/credits.png';
import planIcon from '../../assets/ui/changePlan.png';
import reviewIcon from '../../assets/ui/perfReview.png';
import achievementsIcon from '../../assets/ui/skilltree.png';
import rolesIcon from '../../assets/ui/edit.png';
import AnnunciIcon from '../../components/ui/AnnunciIcon';
import { codiceOrg, getUserById, orgPersonalizzata } from '../../data/db';
import { quantiIngressiInAttesa } from '../../data/ingressi';
import { thumbForUser } from '../../data/avatars';
import BackTile from '../../components/ui/BackTile';

export default function AdminHomePage() {
  const { user } = useAuth();
  const me = getUserById(user.id) || user;
  const [copied, setCopied] = useState(false);
  const inAttesa = quantiIngressiInAttesa(me?.orgId);
  // Una famiglia, un gruppo o un clan non assumono: la bacheca degli
  // annunci non li riguarda, e un pulsante che porta a una pagina che
  // rifiuta e' peggio di un pulsante che non c'e'.
  const cerchiPersonale = !orgPersonalizzata(me.orgId);
  // Il codice e' dell'organizzazione, non di chi la amministra.
  const code = codiceOrg(me.orgId) || me.orgId || '—';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* appunti non disponibili */ }
  };

  // I riquadri di "My org" nei mockup.
  const TILES = [
    { to: '/admin/users',    label: 'Membri',   icon: membersIcon },
    /* Chi bussa. L'etichetta porta il numero di chi aspetta perche' e'
       l'unico riquadro di questa griglia che riguarda qualcuno fermo ad
       aspettare una risposta: gli altri si aprono quando serve, questo ha
       una scadenza che non dipende dall'admin. */
    {
      to: '/admin/ingressi',
      label: inAttesa ? `Ingressi\n(${inAttesa})` : 'Ingressi',
      icon: membersIcon,
    },
    { to: '/admin/roles',    label: 'Ruoli e\npermessi', icon: rolesIcon },
    { to: '/admin/departments', label: 'Dipartimenti', icon: membersIcon },
    // Le schermate del manager sono le stesse, con un perimetro piu' largo:
    // da qui l'admin ci entra invece di avere una copia sua, e ci entra dal
    // proprio profilo — che e' la sua home la' dentro, con l'avatar, le
    // scorciatoie e tutto il resto. Il riquadro porta la faccia che si e'
    // scelto: e' il modo piu' corto per dire "di la' ci sei tu".
    { to: '/manager/profile', label: 'Dashboard\nmanager', icon: thumbForUser(me), className: 'ui-tile-avatar' },
    { to: '/admin/data',     label: 'Dati',     icon: teamsIcon },
    { to: '/admin/skills',   label: 'Competenze', icon: reviewIcon },
    { to: '/admin/achievements', label: 'Achievements', icon: achievementsIcon },
    { to: '/about',          label: 'Info',     icon: infoIcon },
    // La cassa sta accanto all'acquisto perche' sono le due mezze frasi
    // dello stesso discorso: da una parte i crediti entrano, dall'altra si
    // danno a qualcuno.
    { to: '/admin/cassa',    label: 'La cassa', icon: creditsIcon },
    { to: '/compra-crediti', label: 'Ricarica\ncrediti', icon: creditsIcon },
    { to: '/admin/settings/piani', label: 'Il tuo\npiano', icon: planIcon },
  ];

  return (
    <>
      <PageShell
        title="La mia organizzazione"
        description="Gestisci i membri, i dati dell'organizzazione, i crediti e il piano."
      />

      <section className="ui-panel ui-blocco con-stacco">
        <p className="ui-ai-title">Codice organizzazione</p>
        <p style={{ marginBottom: 12 }}>
          Chi ce l’ha può chiedere di entrare, e la richiesta arriva a te. Da solo
          non fa entrare nessuno: puoi condividerlo senza pensarci.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span className="ui-stat" style={{ letterSpacing: 2 }}>{code}</span>
          <button type="button" className="px-btn" style={{ width: 'auto' }} onClick={copy}>
            {copied ? 'Copiato' : 'Copia'}
          </button>
        </div>
      </section>

      {/* Cercare personale non e' gestire chi c'e' gia': e' l'unica cosa che
          l'organizzazione fa verso chi sta fuori, e per questo ha un
          pulsante suo invece di una casella in mezzo alle altre. Porta
          direttamente al foglio bianco: il pulsante dice "scrivi", e quello
          che si apre e' il modulo. L'elenco di quelli gia' pubblicati sta
          li' sotto. */}
      {cerchiPersonale && (
      <section className="ui-panel ui-blocco con-stacco">
        <p className="ui-ai-title">Cerchi personale?</p>
        <p style={{ marginBottom: 12 }}>
          Pubblica un annuncio in bacheca: lo vede chiunque abbia un profilo Achivia.
        </p>
        <Button variante="primario" to="/admin/annunci?nuovo">
          <AnnunciIcon size={20} />
          Scrivi e pubblica un annuncio
        </Button>
      </section>
      )}

      <div className="ui-tiles">
        {TILES.map((t) => (
          <Tile key={t.to} to={t.to} icon={t.icon} label={t.label} className={t.className} />
        ))}
        {/* L'ultima casella della griglia, come nei mockup: l'area
            amministratore si apre dal profilo di gestione, e da qui ci si
            torna. Mancava, perche' questa schermata era stata scritta come
            se fosse una dashboard di partenza — e per l'admin non lo e':
            la sua barra, sotto, e' quella della gestione. */}
        <BackTile inGrid />
      </div>
    </>
  );
}
