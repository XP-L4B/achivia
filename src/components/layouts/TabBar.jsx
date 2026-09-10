import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import AchiviaLogo from '../ui/AchiviaLogo';
import Emblema from '../ui/Emblema';
import MusicIcon from '../ui/MusicIcon';
import { TracciatoAnnunci } from '../ui/AnnunciIcon';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { getUserById, nomeOrgDi } from '../../data/db';
import { accendi, statoMusica, iscriviti } from '../../data/musica';

// Icone della barra, a tratto bianco come nei mockup.
const ICONS = {
  home: (
    <>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6.5 10.5V20h11v-9.5" />
      <path d="M10.5 20v-5h3v5" />
    </>
  ),
  team: (
    <>
      <circle cx="12" cy="7" r="2.6" />
      <circle cx="5.5" cy="9.5" r="2.1" />
      <circle cx="18.5" cy="9.5" r="2.1" />
      <path d="M7.5 16c.8-2 2.4-3 4.5-3s3.7 1 4.5 3" />
      <path d="M2.5 17c.5-1.6 1.6-2.5 3-2.6" />
      <path d="M21.5 17c-.5-1.6-1.6-2.5-3-2.6" />
      <path d="M8 20h8" />
    </>
  ),
  analytics: (
    <>
      <path d="M4 6.5 9 12l4-3 7 -4.5" />
      <circle cx="4" cy="6.5" r="1.1" />
      <circle cx="9" cy="12" r="1.1" />
      <circle cx="13" cy="9" r="1.1" />
      <circle cx="20" cy="4.5" r="1.1" />
      <rect x="4" y="14" width="3.2" height="6" />
      <rect x="10.4" y="11.5" width="3.2" height="8.5" />
      <rect x="16.8" y="15.5" width="3.2" height="4.5" />
    </>
  ),
  trofeo: (
    <>
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" />
      <path d="M7 5.5H4.5V7a3 3 0 0 0 3 3" />
      <path d="M17 5.5h2.5V7a3 3 0 0 1-3 3" />
      <path d="M12 14v3" />
      <path d="M8.5 20h7l-.8-3h-5.4z" />
    </>
  ),
  negozio: (
    <>
      <path d="M4 9h16l-1.2 10.5H5.2z" />
      <path d="M8.5 9V6.5a3.5 3.5 0 0 1 7 0V9" />
    </>
  ),
  /* La cassa: un registro con le colonne dell'incasso dentro. Non e' il
     salvadanaio dei crediti — quello dice quanti ne hai — ma il conto di
     quello che e' entrato, e le colonne lo dicono meglio di una moneta. */
  cassa: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
      <path d="M3.5 8.5h17" />
      <rect x="7" y="11.5" width="2.4" height="5" />
      <rect x="11" y="13.5" width="2.4" height="3" />
      <rect x="15" y="10" width="2.4" height="6.5" />
    </>
  ),
  ordini: (
    <>
      <rect x="4.5" y="3.5" width="15" height="17" rx="1.5" />
      <path d="M8.5 8.5h7" />
      <path d="M8.5 12.5h7" />
      <path d="M8.5 16.5h4" />
    </>
  ),
  // L'altoparlante: un annuncio e' una cosa che si grida a chi non ti
  // conosce, e nessun'altra icona della barra dice quel verso li'. Il
  // disegno e' lo stesso del riquadro nel profilo, e sta scritto una volta
  // sola: due copie prima o poi diventano due disegni diversi.
  annunci: <TracciatoAnnunci />,
  esci: (
    <>
      <path d="M14.5 4.5H6.5a1.5 1.5 0 0 0-1.5 1.5v12a1.5 1.5 0 0 0 1.5 1.5h8" />
      <path d="M18.5 12H10" />
      <path d="M15.5 8.5 19 12l-3.5 3.5" />
    </>
  ),
  menu: (
    <>
      <rect x="3" y="5.5" width="18" height="2.6" />
      <rect x="3" y="11" width="18" height="2.6" />
      <rect x="3" y="16.5" width="18" height="2.6" />
    </>
  ),
};

function NavIcon({ name }) {
  const filled = name === 'menu';
  return (
    <svg
      className="px-nav-icon"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  );
}

/**
 * Barra di navigazione in basso.
 * `tabs` sono le voci; quella con `brand: true` mostra il marchio al posto
 * dell'icona ed è, nei mockup, sempre la voce centrale.
 *
 * Da scrivania la barra diventa la colonna di sinistra, e in fondo alla
 * colonna sta l'insegna dell'organizzazione di chi guarda. Prima stava
 * accanto alla scritta ACHIVIA in cima alla pagina, ma da scrivania quella
 * scritta non c'e' — la colonna la mostra gia' — e l'insegna restava
 * appesa al nulla. In fondo alla colonna invece ha un posto suo: si vede
 * da ogni schermata, e non toglie niente al profilo.
 *
 * Sul telefono non compare: la barra in basso e' larga uno schermo e ha
 * gia' le sue voci, e li' l'insegna sta accanto al marchio in alto.
 *
 * Una voce puo' anche non portare da nessuna parte: con `azione: 'musica'`
 * accende e spegne la musica restando dov'e', e con `azione: 'logout'`
 * — oggi solo il negozio, che il menu non ce l'ha — diventa un pulsante che
 * chiede conferma e fa uscire. La barra e' il posto dove si cerca tutto il
 * resto, quindi e' il posto dove si cerca anche l'uscita.
 */
export default function TabBar({ tabs }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const me = user ? getUserById(user.id) || user : null;
  const [uscita, setUscita] = useState(false);
  // La musica si accende e si spegne da un altro punto dell'applicazione:
  // se la barra non ascolta, il suo interruttore resta indietro e dice il
  // falso.
  const [, ridisegna] = useState(0);
  useEffect(() => iscriviti(() => ridisegna((n) => n + 1)), []);
  const musica = statoMusica();
  // Il nome dell'organizzazione sta sul proprietario, non su chi ci
  // lavora: senza andarlo a prendere, la colonna del dipendente
  // mostrerebbe l'insegna e accanto uno spazio vuoto.
  const nomeOrg = me?.orgId ? me.org || nomeOrgDi(me.orgId) : '';

  return (
    <>
    <nav className="px-nav px-rail">
      {tabs.map((t) => (t.azione === 'musica' ? (
        <button
          key={`${t.label}-musica`}
          type="button"
          className={`px-nav-item${musica.accesa ? ' active' : ''}`}
          aria-pressed={musica.accesa}
          aria-label={musica.accesa ? 'Spegni la musica' : 'Accendi la musica'}
          onClick={() => accendi(!musica.accesa)}
        >
          <MusicIcon spenta={!musica.accesa} size={24} className="px-nav-icon" />
          <span className="px-nav-label">{t.label}</span>
        </button>
      ) : t.azione === 'logout' ? (
        <button
          key={`${t.label}-uscita`}
          type="button"
          className="px-nav-item esce"
          aria-label={t.label}
          onClick={() => setUscita(true)}
        >
          <NavIcon name={t.icon} />
          <span className="px-nav-label">{t.label}</span>
        </button>
      ) : (
        <NavLink
          // Due voci possono portare allo stesso posto — nel dipendente
          // "Profilo" e il marchio portano tutte e due al profilo — quindi
          // la chiave e' la voce, non la destinazione.
          key={`${t.label}-${t.to}`}
          to={t.to}
          aria-label={t.label}
          className={({ isActive }) =>
            `px-nav-item${t.brand ? ' brand' : ''}${isActive ? ' active' : ''}`
          }
        >
          {t.brand
            ? <AchiviaLogo className="px-nav-icon" />
            : <NavIcon name={t.icon} />}
          <span className="px-nav-label">{t.label}</span>
        </NavLink>
      )))}

      {me?.orgId && (
        <span className="px-rail-insegna">
          <Emblema
            orgId={me.orgId}
            nomeOrg={nomeOrg}
            size={34}
            titolo={nomeOrg ? `Insegna di ${nomeOrg}` : 'Insegna dell’organizzazione'}
          />
          <span className="px-rail-insegna-nome">{nomeOrg}</span>
        </span>
      )}
    </nav>

    {/* La finestra sta fuori dalla barra: la barra e' fissa allo schermo,
        e una finestra dentro una barra fissa nasce gia' schiacciata in un
        angolo. */}
    {uscita && (
      <ConfirmDialog
        titolo="Uscire dall’account?"
        testo="Torni alla schermata di accesso. Quello che c’è resta dov’è."
        conferma="Esci"
        onConferma={() => { logout(); navigate('/auth', { replace: true }); }}
        onChiudi={() => setUscita(false)}
      />
    )}
    </>
  );
}
