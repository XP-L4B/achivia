import { useNavigate, Link } from 'react-router-dom';
import PageShell from '../../components/ui/PageShell';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';

const VOCI = [
  { label: 'Pagamenti', to: '/castle/pagamenti' },
  { label: 'Offerte', to: '/castle/offerte' },
  { label: 'Pubblicità', to: '/castle/pubblicita' },
  { label: 'Chi ha guardato', to: '/castle/accessi' },
  { label: 'Le leve', to: '/castle/leve' },
];

/**
 * Il menu del Castello: quello che non sta nella barra.
 *
 * Quattro voci e l'uscita. Sono le sezioni che si aprono di rado — le
 * offerte quando se ne fa una, la pubblicita' quando si cambia una reclame,
 * il registro delle occhiate quando c'e' da controllare, la mappa delle
 * leve quando non ci si ricorda dove si cambia una cosa — e per questo non
 * occupano un posto nella barra.
 *
 * La forma e' quella del menu che l'applicazione ha gia': un elenco di
 * collegamenti e l'uscita in fondo. Non serviva inventarne una seconda.
 */
export default function CastelloMenuPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <PageShell title="Menu" description="Le sezioni che non stanno nella barra." />

      <ul className="menu-list" style={{ marginTop: 'var(--space-2)' }}>
        {VOCI.map((v) => (
          <li key={v.to} className="menu-item">
            <Link to={v.to} className="menu-link">{v.label}</Link>
          </li>
        ))}
        <li className="menu-item">
          <Button
            variante="fantasma"
            blocco
            className="menu-azione"
            onClick={() => { logout(); navigate('/auth', { replace: true }); }}
          >
            Esci
          </Button>
        </li>
      </ul>
    </>
  );
}
