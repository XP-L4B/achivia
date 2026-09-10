import { Link } from 'react-router-dom';
import BackTile from '../../components/ui/BackTile';

export default function RegFormNewPage() {
  return (
    <div className="page-center">
      <div style={{ textAlign: 'center' }}>
        <h2>La tua organizzazione</h2>
        <p className="page-desc" style={{ marginTop: '0.4rem' }}>Vuoi creare una nuova organizzazione o unirti a una esistente?</p>
      </div>

      <div className="form">
        <Link to="/auth/register/org-type" className="px-btn block">
          Crea organizzazione
        </Link>
        <Link to="/auth/register/join" className="px-btn ghost block">
          Accedi a organizzazione esistente
        </Link>
      </div>
      <BackTile />
    </div>
  );
}
