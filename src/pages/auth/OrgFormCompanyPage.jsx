import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../../components/ui/PageShell';
import {
  addUser, updateUser, getUserById, getPendingRegistration, clearPendingRegistration, genOrgCode,
} from '../../data/db';
import { useAuth } from '../../context/AuthContext';
import BackTile from '../../components/ui/BackTile';

/**
 * Creare un'azienda.
 *
 * Due strade portano qui, e vanno trattate in modo diverso. Chi si sta
 * registrando ha lasciato email e password nel passaggio prima: per lui si
 * crea l'account. Chi invece e' gia' dentro e un'organizzazione non ce l'ha
 * — perche' l'ha lasciata, o perche' non l'ha mai avuta — non deve
 * ritrovarsi con un secondo account: la sua organizzazione si attacca a
 * quello che ha gia', con i suoi XP, i suoi crediti e la sua storia.
 *
 * `orgTipo` si scrive sempre, e non e' un dettaglio: e' il campo da cui
 * dipende se questa organizzazione avra' le competenze standard, gli
 * achievement standard, la lega e l'osservatorio. Finche' non lo scriveva
 * nessuno, ogni organizzazione creata dall'applicazione era un'azienda —
 * anche quella che l'utente aveva appena scelto di non fare azienda.
 */
export default function OrgFormCompanyPage() {
  const navigate = useNavigate();
  const { user, entraInOrg } = useAuth();
  const formRef = useRef(null);
  const me = user ? getUserById(user.id) : null;

  function handleConfirm() {
    const reg = getPendingRegistration();
    /* Chi e' gia' dentro non ha un canale aperto: arriva dall'elenco
       delle sue organizzazioni, che e' anche il posto da cui si crea
       quella nuova. La nuova si aggiunge alle sue, non ne prende il
       posto — puo' avere un'azienda e un gruppo, e possederli tutti e
       due. */
    const attacca = !reg && Boolean(me);
    if (!reg && !attacca) {
      navigate('/auth', { replace: true });
      return;
    }
    const root = formRef.current;
    const orgName = root?.querySelector('[name="org-name"]')?.value.trim() || '';

    const org = {
      role: 'admin',
      orgId: `org-${Date.now()}`,
      orgCode: genOrgCode(),
      // Il proprietario si dichiara. Il nome, il tipo e l'abbonamento
      // stanno nel registro dell'organizzazione, non addosso a lui: uno
      // che ne possiede due non saprebbe a quale dei due riferirli.
      orgOwner: true,
      orgTipo: 'azienda',
      // Il giorno in cui l'organizzazione nasce: e' l'unico momento in cui
      // si sa davvero, e serve ai traguardi che parlano di anzianita'.
      orgCreatedAt: new Date().toISOString(),
      org: orgName || undefined,
    };

    if (attacca) {
      updateUser(me.id, org);
      // Si entra subito nell'organizzazione appena creata: e' quello per cui
      // si e' compilato il modulo, e tornare all'elenco per sceglierla
      // sarebbe un passaggio in piu' che non decide niente.
      entraInOrg(org.orgId);
      navigate('/admin', { replace: true });
      return;
    }

    addUser({
      ...org,
      name: orgName ? `Admin ${orgName}` : 'Admin',
      email: reg.email,
      password: reg.password,
    });
    clearPendingRegistration();
    navigate('/auth', { replace: true });
  }

  return (
    <>
      <PageShell title="Dati Azienda" description="Inserisci i dati dell'azienda. Viene generato un codice da condividere con i membri." />
      <div ref={formRef} style={{ padding: '0 2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: 360, margin: '0 auto', width: '100%' }}>
        <input type="text" name="org-name" placeholder="Nome azienda" style={inputStyle} />
        <button type="button" onClick={handleConfirm} className="px-btn block">Conferma dati</button>
      </div>
      <BackTile />
    </>
  );
}

const inputStyle = { padding: '0.6rem 0.9rem', border: '1px solid #ccc', borderRadius: 6, fontSize: '1rem' };
