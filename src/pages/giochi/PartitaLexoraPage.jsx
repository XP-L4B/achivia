import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageShell from '../../components/ui/PageShell';
import Button from '../../components/ui/Button';
import TerminalPanel from '../../components/terminal/TerminalPanel';
import Griglia from '../../components/lexora/Griglia';
import Tastiera from '../../components/lexora/Tastiera';
import Tabellone from '../../components/lexora/Tabellone';
import EsitoLexora from '../../components/lexora/EsitoLexora';
import PausaLexora from '../../components/lexora/PausaLexora';
import { useAuth } from '../../context/AuthContext';
import { getUserById } from '../../data/db';
import {
  fotografiaSfida, apriTavoloLexora, sfidaLexora, giocaSfidaLexora, giocaBotLexora,
  creaSfidaLexora, creaProvaLexora, statisticheLexora, partiteLexora, CONFIG,
} from '../../data/lexora';
import { pausaBot } from '../../giochi/lexora/motore/bot';

/* Ogni quanto si ridisegna il tempo che resta. Dieci volte al secondo e'
   piu' di quanto serva a leggere un numero; quattro volte bastano, e non
   fanno lavorare il telefono per una barra. */
const PASSO_TIMER = 250;

/**
 * La partita: la parola segreta, i tentativi e i loro colori.
 *
 * La pagina non tiene lo stato del gioco: lo tiene il deposito, e qui si
 * legge la fotografia — che della parola segreta dice solo quante lettere
 * ha, finche' non e' finita. Quando si conferma un tentativo parte la
 * parola scritta e nient'altro: i colori li decide il motore confrontando
 * con la segreta, e se questa pagina mentisse sui punti il deposito non se
 * ne accorgerebbe nemmeno, perche' non le crede.
 *
 * Il tavolo sta in un componente suo, con la sfida per chiave: chiedere la
 * rivincita cambia l'indirizzo ma non la pagina, e senza la chiave si
 * resterebbe a guardare la partita di prima.
 */
export default function PartitaLexoraPage() {
  const [parametri] = useSearchParams();
  const sfidaId = parametri.get('s');
  return <Tavolo key={sfidaId || 'nessuna'} sfidaId={sfidaId} />;
}

function Tavolo({ sfidaId }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const me = user ? getUserById(user.id) || user : null;

  /* Ci si siede al tavolo aprendo la pagina: se il turno era scaduto
     mentre la pagina era chiusa — una sfida a una persona puo' restare
     ferma un giorno — il tempo riparte da adesso. Una volta per turno, e
     lo controlla il deposito. */
  const [foto, setFoto] = useState(() => {
    if (!sfidaId) return null;
    return apriTavoloLexora(sfidaId, user?.id, Date.now()) ?? fotografiaSfida(sfidaId, Date.now(), user?.id);
  });
  const [scritto, setScritto] = useState('');
  const [avviso, setAvviso] = useState(null);
  const [tono, setTono] = useState('');
  const [scoperte, setScoperte] = useState([]);
  /* La pausa della sfida: nella prova la tiene il motore — l'orologio sta
     fermo davvero — qui invece e' solo un pannello, perche' fermare un
     giocatore vorrebbe dire fermare anche l'altro. */
  const [pausaSfida, setPausaSfida] = useState(null);
  const [adesso, setAdesso] = useState(() => Date.now());
  /* Il turno per cui abbiamo gia' detto «scaduto», perche' lo si dice una
     volta sola. Parte da `null` e non da zero: il primo turno di una
     partita *e'* il turno zero. */
  const scadenza = useRef(null);
  const campo = useRef(null);
  const finita = foto?.fase === 'finita';
  /* La pausa della prova: il motore l'ha aperta, e finche' dura non c'e'
     nessun turno in corso da cronometrare. */
  const intervallo = foto?.intervallo ?? null;
  const sfida = sfidaId ? sfidaLexora(sfidaId) : null;
  const mioTurno = Boolean(foto && !finita && foto.giocatori[foto.diChi]?.userId === me?.id);

  const aggiorna = useCallback(() => {
    if (!sfidaId) return null;
    const f = fotografiaSfida(sfidaId, Date.now(), me?.id);
    setFoto(f);
    setScritto('');
    return f;
  }, [sfidaId, me?.id]);

  /* Il tempo. Un intervallo solo, che si ferma quando la partita finisce. */
  useEffect(() => {
    if (finita || intervallo) return undefined;
    const t = setInterval(() => setAdesso(Date.now()), PASSO_TIMER);
    return () => clearInterval(t);
  }, [finita, intervallo]);

  /* Il turno scaduto: il motore lo sa, ma qualcuno deve dirglielo. Lo dice
     chi ha il turno, ed e' l'unico caso in cui la pagina manda una mossa
     che nessuno ha premuto. */
  useEffect(() => {
    if (!mioTurno || !foto || intervallo) return;
    if (foto.scadenza - adesso > 0) return;
    if (scadenza.current === foto.turno) return;
    scadenza.current = foto.turno;
    giocaSfidaLexora(sfidaId, me?.id, { tipo: 'scaduto' }, Date.now());
    setAvviso('Tempo scaduto: tentativo perso.');
    setTono('avviso');
    aggiorna();
  }, [mioTurno, foto, adesso, sfidaId, me, aggiorna, intervallo]);

  /* Il bot pensa un attimo e gioca. La pausa non serve al motore, serve a
     chi guarda: una risposta istantanea non sembra una partita. */
  useEffect(() => {
    if (!foto || finita || intervallo) return undefined;
    const chi = foto.giocatori[foto.diChi];
    if (!chi?.bot) return undefined;
    const t = setTimeout(() => { giocaBotLexora(sfidaId, Date.now()); aggiorna(); }, pausaBot(chi.bot));
    return () => clearTimeout(t);
  }, [foto, finita, sfidaId, aggiorna, intervallo]);

  const manda = (mossa) => {
    const r = giocaSfidaLexora(sfidaId, me?.id, mossa, Date.now());
    if (!r.ok) { setAvviso(r.errore); setTono('errore'); return; }
    if (r.scoperta) setScoperte((s) => [...s, r.scoperta]);
    /* Quando la parola si chiude, si legge com'e' andata prima di andare
       avanti. Nella prova la pausa e' del motore e arriva dalla
       fotografia; nella sfida la apre questo pannello, con quello che la
       mossa ha appena detto. */
    const chiusa = (r.tipo === 'tentativo' && r.finito) || r.tipo === 'passa';
    if (chiusa && foto?.modo !== 'prova') {
      setPausaSfida({
        segreta: r.segreta,
        indovinata: Boolean(r.indovinata),
        tentativi: r.tentativi ?? 0,
        tentativiMassimi: foto?.tentativiMassimi,
        punti: r.punti ?? 0,
        scheda: r.scoperta ?? null,
      });
      setAvviso(null);
      setTono('');
    } else if (r.tipo === 'tentativo' && !r.finito) {
      setAvviso(`${r.restano} ${r.restano === 1 ? 'tentativo' : 'tentativi'} rimasti`);
      setTono('');
    }
    aggiorna();
    campo.current?.focus();
  };

  const conferma = (e) => {
    e?.preventDefault?.();
    if (!mioTurno) return;
    manda({ tipo: 'tentativo', parola: scritto });
  };

  const rivincita = () => {
    /* Dopo una prova «Ancora» vuol dire rifare quel livello, non sfidare
       qualcuno: nella prova un avversario non c'e', e cercarlo torna
       niente — la pagina finiva per rimandare all'atrio. */
    const s = sfida?.prova
      ? creaProvaLexora({ da: me?.id, lingua: sfida.lingua, livello: sfida.prova })
      : (() => {
        const avversario = sfida?.motore?.giocatori?.find((g) => g.userId !== me?.id);
        return creaSfidaLexora({
          da: me?.id,
          lingua: sfida?.lingua,
          bot: avversario?.bot || null,
          a: avversario?.bot ? null : avversario?.userId,
        });
      })();
    if (!s) { navigate('/giochi/lexora'); return; }
    setScoperte([]);
    setAvviso(null);
    navigate(`/giochi/lexora/partita?s=${s.id}`);
  };

  if (!sfidaId || !foto) {
    return (
      <div className="page lex-partita">
        <PageShell title="Lexora" description="Questa partita non c’è più." />
        <TerminalPanel titolo="Niente da giocare">
          <p className="tv-nota">La sfida che cercavi non esiste, oppure è già stata chiusa.</p>
          <div className="lex-azioni">
            <Button variante="primario" onClick={() => navigate('/giochi/lexora')}>Torna all’atrio</Button>
          </div>
        </TerminalPanel>
      </div>
    );
  }

  if (finita) {
    const partita = partiteLexora(me?.id).find((p) => p.sfidaId === sfidaId)
      || { esito: foto.esito, giocatori: foto.giocatori };
    const st = statisticheLexora(me?.id);
    return (
      <div className="page lex-partita">
        <PageShell title="Fine partita" description={`Questo è il risultato. Hai giocato ${st.partite} partite in tutto.`} />
        <TerminalPanel titolo="Com’è finita" meta={foto.lingua.toUpperCase()}>
          <EsitoLexora
            partita={partita}
            ioSono={me?.id}
            scoperte={scoperte}
            onRivincita={rivincita}
            onEsci={() => navigate('/giochi/lexora')}
          />
        </TerminalPanel>
      </div>
    );
  }

  const secondi = intervallo ? 0 : Math.max(0, (foto.scadenza - adesso) / 1000);
  const chi = foto.giocatori[foto.diChi];
  const io = foto.giocatori.find((g) => g.userId === me?.id);
  const chiuso = Boolean(io?.finito);

  return (
    <div className="page lex-partita">
      <PageShell
        title="Lexora"
        description={mioTurno ? 'Tocca a te: prova una parola.' : `Sta giocando ${chi?.nome}.`}
      />

      <TerminalPanel titolo="Il tavolo" meta={foto.lingua.toUpperCase()}>
        <Tabellone foto={foto} secondi={secondi} secondiTotali={CONFIG.turno.secondi} ioSono={me?.id} />
      </TerminalPanel>

      <TerminalPanel titolo="Il tuo tabellone" meta={`${foto.mie.length}/${foto.tentativiMassimi}`}>
        <Griglia
          lettere={foto.lettere}
          righe={foto.mie}
          tentativiMassimi={foto.tentativiMassimi}
          soluzione={foto.soluzione}
        />

        {avviso && <p className={`lex-avviso${tono ? ` is-${tono}` : ''}`} role="status">{avviso}</p>}

        {chiuso ? (
          <p className="tv-nota">
            Per questa parola hai finito. {foto.giocatori.some((g) => !g.finito) ? 'Aspetta che chiuda anche chi hai davanti.' : ''}
          </p>
        ) : (
          <form className="lex-tentativo" onSubmit={conferma}>
            <label className="lex-campo-scelta">
              <span className="ui-label">Il tuo tentativo</span>
              <input
                ref={campo}
                className="ui-input lex-input"
                value={scritto}
                onChange={(e) => setScritto(e.target.value)}
                maxLength={foto.lettere}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck="false"
                disabled={!mioTurno}
                placeholder={mioTurno ? `${foto.lettere} lettere` : 'non è il tuo turno'}
                aria-label={`Scrivi una parola di ${foto.lettere} lettere`}
              />
            </label>
            <Button variante="primario" type="submit" disabled={!mioTurno || scritto.trim().length === 0}>
              Prova
            </Button>
            <Button variante="fantasma" type="button" disabled={!mioTurno} onClick={() => manda({ tipo: 'passa' })}>
              Lascia
            </Button>
          </form>
        )}

        <Tastiera stato={foto.tastiera} />
      </TerminalPanel>

      <div className="lex-azioni">
        <Button variante="fantasma" onClick={() => navigate('/giochi/lexora')}>Esci</Button>
      </div>

      {/* La pausa: quella vera della prova, o quella di cortesia della sfida. */}
      {intervallo && (
        <PausaLexora
          dati={{ ...intervallo, tentativiMassimi: foto.tentativiMassimi }}
          ultima={intervallo.ultima}
          onContinua={() => { manda({ tipo: 'continua' }); }}
        />
      )}
      {!intervallo && pausaSfida && (
        <PausaLexora dati={pausaSfida} aspetta onContinua={() => setPausaSfida(null)} />
      )}
    </div>
  );
}
