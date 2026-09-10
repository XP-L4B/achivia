import { useEffect, useState } from 'react';
import PageShell from '../../components/ui/PageShell';
import BackTile from '../../components/ui/BackTile';
import MySkillTree from '../../components/skills/MySkillTree';
import { useAuth } from '../../context/AuthContext';
import { getUserById, subscribe } from '../../data/db';

/**
 * Lo Skill Tree del dipendente. Qui si guarda soltanto: una competenza la
 * riconosce un manager, non se la assegna chi la possiede.
 */
export default function MySkillsPage() {
  const { user } = useAuth();
  const [, setVersione] = useState(0);
  useEffect(() => subscribe(() => setVersione((v) => v + 1)), []);

  const me = getUserById(user.id) || user;

  return (
    <>
      <PageShell
        title="Skill Tree"
        description="La mappa delle tue competenze: quelle riconosciute e quelle su cui puoi ancora crescere."
      />
      <MySkillTree persona={me} proprio />
      <BackTile />
    </>
  );
}
