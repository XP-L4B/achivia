import { useEffect, useState } from 'react';
import PageShell from '../../components/ui/PageShell';
import EmployeeAnalytics from '../../components/ui/EmployeeAnalytics';
import { useAuth } from '../../context/AuthContext';
import { subscribe } from '../../data/db';
import BackTile from '../../components/ui/BackTile';

export default function EmployeeAnalyticsPage() {
  const { user } = useAuth();
  const [, setVersion] = useState(0);
  useEffect(() => subscribe(() => setVersion((v) => v + 1)), []);

  return (
    <>
      <PageShell title="Analytics" description="Le tue performance e i tuoi crediti." />
      <div className="ui-corpo-pagina">
        <EmployeeAnalytics user={user} />
        <button type="button" className="px-btn ghost">Confronta con il team</button>
      </div>
      <BackTile />
    </>
  );
}
