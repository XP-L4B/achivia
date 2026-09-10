import { avatarForUser } from '../../data/avatars';
import NomePersona from './NomePersona';
import TerminalPanel from '../terminal/TerminalPanel';
import TerminalRows from '../terminal/TerminalRows';
import { cifra } from '../terminal/formato';

/**
 * Riquadro di intestazione di un utente: avatar e ruolo, e accanto il
 * terminale con i suoi numeri — livello, crediti, team, quest attive,
 * progetti.
 *
 * Prima erano due colonne di testo con due stili diversi (il livello a
 * pixel, i conteggi in grassetto a destra) e nessuna delle due si leggeva
 * come una tabella. Ora sono righe incolonnate: l'etichetta a sinistra, la
 * cifra a destra, tutte allineate sulla stessa griglia.
 */
export default function UserHeaderCard({ user, teams = 0, activeQuests = 0, projects = 0 }) {
  const ruolo = { admin: 'Amministratore', manager: 'Manager', employee: 'Dipendente' }[user.role] || user.role;

  return (
    <section className="ui-userhead">
      <img className="ui-userhead-avatar" src={avatarForUser(user)} alt="" />

      <div className="ui-userhead-main">
        <NomePersona persona={user} grande />
        <p className="ui-userhead-role">Ruolo: {ruolo}</p>
      </div>

      <TerminalPanel titolo="SCHEDA" meta={`LVL ${user.level}`} className="ui-userhead-tv">
        <TerminalRows
          vivo
          voci={[
            ['Livello', user.level],
            { label: 'Crediti', valore: `◉ ${cifra(user.credits)}`, tono: 'oro' },
            ['Team', teams],
            { label: 'Quest attive', valore: activeQuests, tono: activeQuests > 0 ? '' : 'spento' },
            { label: 'Progetti', valore: projects, tono: projects > 0 ? '' : 'spento' },
          ]}
        />
      </TerminalPanel>
    </section>
  );
}
