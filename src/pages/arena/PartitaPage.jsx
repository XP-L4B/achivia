import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getUserById } from '../../data/db';
import { moduliGratisDi, puoUsare, chiudiPartita, primatiArena } from '../../data/arena';
import { traguardiArena } from '../../data/db';
import { aggiornaMisure, raggiunti } from '../../game/contenuti/traguardi';
import { personaggioById } from '../../game/contenuti/personaggi';
import { attenua } from '../../data/musica';
import { useMusicaFermaNellArena } from './musicaArena';
import Tela from '../../components/arena/Tela';
import Cruscotto from '../../components/arena/Cruscotto';
import Leva from '../../components/arena/Leva';
import SceltaModulo from '../../components/arena/SceltaModulo';
import Esito from '../../components/arena/Esito';
import Pausa from '../../components/arena/Pausa';
import AvvisoTraguardo from '../../components/arena/AvvisoTraguardo';

const puntatoreGrosso = () => (typeof window !== 'undefined' && typeof window.matchMedia === 'function'
  ? window.matchMedia('(pointer: coarse)').matches
  : false);

/**
 * La partita, a tutto schermo.
 *
 * Questa pagina non disegna un fotogramma: tiene il cruscotto, la scelta
 * dei moduli e la fine, e passa al motore quello che il dito o la tastiera
 * chiedono. Mentre e' aperta lo sfondo vivo dell'app e' spento e la musica
 * abbassata — sono cose che costano, e sotto un'arena non si vedono.
 */
export default function PartitaPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [parametri] = useSearchParams();
  const me = user ? getUserById(user.id) || user : null;
  const personaggioId = parametri.get('p') || 'soldato';
  const personaggio = personaggioById(personaggioId);

  const [hud, setHud] = useState(null);
  const [offerta, setOfferta] = useState(null);
  const [motivo, setMotivo] = useState('livello');
  const [esito, setEsito] = useState(null);
  const [nuoviTraguardi, setNuoviTraguardi] = useState([]);
  // gli avvisi dei traguardi mentre si gioca: la coda a schermo, le misure con cui si parte, quelli gia' detti
  const [avvisi, setAvvisi] = useState([]);
  const misurePartenza = useRef(null);
  const traguardiDetti = useRef(new Set());
  const ultimoControllo = useRef(-1);
  const [inPausa, setInPausa] = useState(false);
  // Il numero di partita: cambiarlo rimonta la tela con un seme nuovo.
  const [partita, setPartita] = useState(1);
  const [coarse] = useState(puntatoreGrosso);
  const motore = useRef(null);
  const chiusa = useRef(false);

  const moduliGratis = moduliGratisDi(me);
  const [restano, setRestano] = useState(moduliGratis);
  // I primati di prima della partita: "nuovo primato" si dice confrontando con quelli,
  // non con quelli appena scritti. Si leggono una volta per partita — cambiano solo
  // quando ne comincia una nuova — cosi' la fine della partita li trova come stavano.
  // `partita` non entra nel calcolo, entra nel *quando*: cambia quando se ne comincia
  // un'altra, ed e' li' che i primati vanno riletti. Il linter non puo' saperlo, perche'
  // il valore arriva dal deposito e non dagli argomenti.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const primatiPrima = useMemo(() => (me ? primatiArena(me.id) : null), [me, partita]);

  useMusicaFermaNellArena();

  // Lo sfondo e la musica: spenti finche' si gioca, com'erano dopo.
  useEffect(() => {
    document.body.classList.add('is-in-arena');
    attenua(0.35);
    return () => {
      document.body.classList.remove('is-in-arena');
      attenua(1);
    };
  }, []);

  // Le misure da cui si parte, e gli sbloccati gia' noti: a ogni partita nuova si rilegge il deposito.
  useEffect(() => {
    if (!me) return;
    const t = traguardiArena(me.id);
    misurePartenza.current = t.misure;
    traguardiDetti.current = new Set(Object.keys(t.sbloccati));
    ultimoControllo.current = -1;
  }, [me, partita]);

  // Due volte al secondo si guarda se la partita com'e' adesso passa una soglia nuova:
  // stesse funzioni del deposito, cosi' l'avviso e la scrittura a fine partita dicono la stessa cosa.
  useEffect(() => {
    if (!hud?.parziale || !misurePartenza.current || hud.fase !== 'gioco') return;
    const tick = Math.floor(hud.tempo * 2);
    if (tick === ultimoControllo.current) return;
    ultimoControllo.current = tick;
    const nuovi = raggiunti(aggiornaMisure(misurePartenza.current, hud.parziale)).filter((id) => !traguardiDetti.current.has(id));
    if (nuovi.length === 0) return;
    nuovi.forEach((id) => traguardiDetti.current.add(id));
    setAvvisi((coda) => [...coda, ...nuovi]);
  }, [hud]);
  const avvisoFatto = useCallback((id) => setAvvisi((coda) => coda.filter((x) => x !== id)), []);

  const suMotore = useCallback((m) => { motore.current = m; }, []);
  const suScelta = useCallback((o, m) => { setOfferta(o); setMotivo(m || 'livello'); }, []);
  const suFine = useCallback((r) => {
    setOfferta(null);
    setEsito(r);
    if (!chiusa.current && me) {
      chiusa.current = true;
      const riga = chiudiPartita(me.id, r);
      setNuoviTraguardi(riga?.nuoviTraguardi || []);
    }
  }, [me]);

  const scegli = useCallback((id) => {
    const m = motore.current;
    if (!m) return;
    const riprende = m.scegli(id);
    setRestano((r) => Math.max(0, r - 1));
    if (riprende) setOfferta(null);
  }, []);

  // Lo stato di pausa arriva dal motore, non dal pulsante: il ciclo si
  // ferma anche da solo quando la scheda va in secondo piano, e il
  // cruscotto deve dirlo.
  const suPausa = useCallback((v) => setInPausa(v), []);
  const pausa = () => {
    const m = motore.current;
    if (!m || esito) return;
    m.pausa(!m.inPausa);
  };

  /**
   * Si esce dalla partita dalla pausa.
   *
   * Quello che si e' fatto viene registrato come una partita finita —
   * il tempo sopravvissuto e' quello vero — e poi si torna all'atrio.
   * Passa dalla stessa porta della morte, `chiudiPartita`, perche' una
   * seconda strada per scrivere una partita sarebbe una seconda strada da
   * tenere allineata.
   */
  const esci = () => {
    const m = motore.current;
    const r = m?.abbandona?.() ?? null;
    if (r && !chiusa.current && me) {
      chiusa.current = true;
      chiudiPartita(me.id, r);
    }
    navigate('/arena');
  };

  const ancora = () => {
    chiusa.current = false;
    setEsito(null); setHud(null); setOfferta(null); setInPausa(false); setNuoviTraguardi([]); setAvvisi([]);
    setRestano(moduliGratis);
    setPartita((n) => n + 1);
  };

  if (!me) return <Navigate to="/auth" replace />;
  if (!puoUsare(me, personaggioId)) return <Navigate to="/arena" replace />;

  const iniziale = Boolean(offerta) && restano > 0 && (hud?.tempo ?? 0) === 0;

  return (
    <div className="arena-partita">
      <Tela
        key={partita}
        personaggio={personaggioId}
        livello={me?.level ?? 1}
        moduliGratis={moduliGratis}
        onMotore={suMotore}
        onHud={setHud}
        onScelta={suScelta}
        onFine={suFine}
        onPausa={suPausa}
      />
      <Cruscotto hud={hud} personaggio={personaggio} onPausa={pausa} inPausa={inPausa} />
      {avvisi.length > 0 && !esito && <AvvisoTraguardo coda={avvisi} onFatto={avvisoFatto} />}
      {coarse && !offerta && !esito && <Leva onMuovi={(x, y) => motore.current?.leva(x, y)} />}
      {offerta && !esito && (
        <SceltaModulo offerta={offerta} iniziale={iniziale} bottino={motivo === 'bottino'} restano={restano} onScegli={scegli} />
      )}
      {esito && (
        <Esito
          riassunto={esito}
          personaggio={personaggio}
          primati={primatiPrima}
          nuoviTraguardi={nuoviTraguardi}
          onAncora={ancora}
          onAtrio={() => navigate('/arena')}
        />
      )}
      {inPausa && !offerta && !esito && <Pausa hud={hud} onRiprendi={pausa} onEsci={esci} />}
    </div>
  );
}
