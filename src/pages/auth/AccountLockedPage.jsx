import { Link } from 'react-router-dom';
import PageShell from '../../components/ui/PageShell';
import BackTile from '../../components/ui/BackTile';

export default function AccountLockedPage() {
  return (
    <>
      <PageShell title="Account bloccato" description="Troppi tentativi di accesso falliti (5/5)." />
      <div style={{ padding: '0 2rem' }}>
        <Link to="/auth/reset-password" style={btnStyle}>Avvia sblocco</Link>
      </div>
      <BackTile />
    </>
  );
}

const btnStyle = { display: 'inline-block', marginTop: '1rem', padding: '0.7rem 1.5rem', background: '#6c3fc5', color: '#fff', borderRadius: 6, textDecoration: 'none' };
