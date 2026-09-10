import { Link } from 'react-router-dom';
import { avatarForUser } from '../../data/avatars';
import NomePersona from './NomePersona';

/**
 * Riga della lista membri: nome e identificativo in alto, ruolo sotto,
 * avatar del personaggio a destra.
 */
export default function MemberRow({ user, to }) {
  const body = (
    <>
      <div>
        <p className="ui-member-name"><NomePersona persona={user} /></p>
        <p className="ui-member-role">
          {user.department ? `Reparto: ${user.department}` : 'Nessun reparto'}
        </p>
      </div>
      <img className="ui-member-avatar" src={avatarForUser(user)} alt="" />
    </>
  );

  return to
    ? <Link to={to} className="ui-member">{body}</Link>
    : <div className="ui-member">{body}</div>;
}
