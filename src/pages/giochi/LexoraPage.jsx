import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../../components/ui/PageShell';
import Button from '../../components/ui/Button';
import TerminalPanel from '../../components/terminal/TerminalPanel';
import TerminalRows from '../../components/terminal/TerminalRows';
import Tutorial from '../../components/lexora/Tutorial';
import Bandiera from '../../components/lexora/Bandiera';
import LexoraIcon from '../../components/ui/LexoraIcon';
import { useAuth } from '../../context/AuthContext';
import { getUserById, subscribe } from '../../data/db';
import {
  schedaLexora, traguardiDi, avversariLexora, creaSfidaLexora,
  creaProvaLexora, livelloLexora, LIVELLI,
  accettaSfidaLexora, rifiutaSfidaLexora, abbandonaSfidaLexora,
  elencoLingue, linguaById, nomeGiocatore, comeFini, durataPartita, CONFIG,
} from '../../data/lexora';

const COME_FINI = { vinta: 'vinta', persa: 'persa', pareggio: 'pareggio' };

/**
 * L'atrio di Lexora: si sceglie la lingua, si sceglie chi si ha
 * davanti, e si comincia.
 *
 * Le sfide aperte stanno in cima perche' sono l'unica cosa che aspetta
 * qualcuno: una partita in cui tocca a te e' piu' urgente di una partita
 * nuova. Il bot sta subito sotto, per chi non ha voglia di aspettare.
 */
export default function LexoraPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const me = user ? getUserById(user.id) || user : null;
  const [lingua, setLingua] = useState('it');
  const [avversario, setAvversario] = useState('');
  /* Quale delle due porte e' aperta: nessuna finche' non si sceglie. */
  const [modo, setModo] = useState(null);
  const [tutorial, setTutorial] = useState(false);
  /* Il deposito avvisa quando cambia: accettare una sfida, abbandonarne
     una, finire una partita in un'altra scheda. Senza questa riga
     l'elenco delle sfide resterebbe quello del momento in cui si e'
     aperta la pagina. */
  const [, ridisegna] = useState(0);
  useEffect(() => subscribe(() => ridisegna((v) => v + 1)), []);

  const scheda = schedaLexora(me?.id);
  const traguardi = traguardiDi(me?.id);
  const persone = avversariLexora(me?.id);
  const lingue = elencoLingue();

  const apriProva = (livello) => {
    const s = creaProvaLexora({ da: me?.id, lingua, livello });
    if (s) navigate(`/giochi/lexora/partita?s=${s.id}`);
  };
  const scala = livelloLexora(me?.id);

  return (
    <div className="page lex-atrio">
      <PageShell
        title="Lexora"
        description="C’è una parola segreta e sai solo quante lettere ha. Provi una parola vera, e i colori ti dicono quanto ci sei vicino: verde al posto giusto, giallo fuori posto, grigio non c’è. Da soli contro l’orologio, salendo di livello, o in due contro un collega con la stessa parola per tutti e due."
      />

      {scheda.tocca.length > 0 && (
        <TerminalPanel titolo="Tocca a te" meta={`${scheda.tocca.length}`}>
          <ul className="lex-elenco">
            {scheda.tocca.map((s) => (
              <li key={s.id} className="lex-riga">
                <span className="lex-riga-chi">
                  {nomeGiocatore(s.motore.giocatori.find((g) => g.userId !== me?.id))}
                  <small><Bandiera lingua={s.lingua} size={14} /> {linguaById(s.lingua).nome} · turno {s.motore.turno + 1}</small>
                </span>
                <span className="lex-riga-azioni">
                  <Button compatto variante="primario" onClick={() => navigate(`/giochi/lexora/partita?s=${s.id}`)}>Gioca</Button>
                  <Button compatto variante="fantasma" onClick={() => { abbandonaSfidaLexora(s.id, me?.id); }}>Abbandona</Button>
                </span>
              </li>
            ))}
          </ul>
        </TerminalPanel>
      )}

      {scheda.inviti.length > 0 && (
        <TerminalPanel titolo="Ti hanno sfidato" meta={`${scheda.inviti.length}`}>
          <ul className="lex-elenco">
            {scheda.inviti.map((s) => (
              <li key={s.id} className="lex-riga">
                <span className="lex-riga-chi">
                  {nomeGiocatore(s.motore.giocatori[0])}
                  <small><Bandiera lingua={s.lingua} size={14} /> {linguaById(s.lingua).nome}</small>
                </span>
                <span className="lex-riga-azioni">
                  <Button compatto variante="primario" onClick={() => { accettaSfidaLexora(s.id, me?.id); navigate(`/giochi/lexora/partita?s=${s.id}`); }}>Accetta</Button>
                  <Button compatto variante="fantasma" onClick={() => { rifiutaSfidaLexora(s.id, me?.id); }}>Rifiuta</Button>
                </span>
              </li>
            ))}
          </ul>
        </TerminalPanel>
      )}

      <TerminalPanel titolo="Una partita nuova" meta={durataPartita()}>
        {/* La lingua sta in cima e vale per tutte e due i modi: e' la prima
            cosa da scegliere, e non cambia niente di quello che viene dopo.
            A tendina e non a pillole perche' le lingue cresceranno, e cinque
            pillole diventano dieci senza che nessuno se ne accorga. */}
        <div className="lex-lingua">
          <label className="lex-campo-scelta">
            <span className="ui-label">Scegli la lingua</span>
            <select className="ui-input" value={lingua} onChange={(e) => setLingua(e.target.value)}>
              {lingue.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
            </select>
          </label>
          <span className="lex-lingua-scelta">
            <Bandiera lingua={lingua} size={26} titolo />
            <b>{linguaById(lingua).nome}</b>
          </span>
        </div>
        <p className="tv-nota">La lingua decide da che dizionario esce la parola segreta, e quali lettere si possono scrivere.</p>

        <div className="tv-riga" aria-hidden="true" />

        {/* Due porte, una accanto all'altra: da solo o in due. Quello che
            serve a una non si vede finche' non la si e' scelta — prima la
            schermata mostrava le difficolta' del computer e l'elenco dei
            colleghi tutte insieme, e chi arrivava doveva leggere due cose
            per farne una. */}
        <div className="lex-modi" role="radiogroup" aria-label="Come vuoi giocare">
          <button
            type="button"
            role="radio"
            aria-checked={modo === 'singolo'}
            className={`lex-modo${modo === 'singolo' ? ' is-scelto' : ''}`}
            onClick={() => setModo('singolo')}
          >
            <LexoraIcon size={30} />
            <b>Giocatore singolo</b>
            <small>La prova: tu, l’orologio e sei livelli</small>
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={modo === 'multi'}
            className={`lex-modo${modo === 'multi' ? ' is-scelto' : ''}`}
            onClick={() => setModo('multi')}
          >
            <LexoraIcon size={30} />
            <b>Multiplayer</b>
            <small>Sfida una persona della tua organizzazione</small>
          </button>
        </div>

        {modo === 'singolo' && (
          <div className="lex-passo">
            <p className="lex-sezione">La prova: sei livelli, e cambia il tempo</p>
            <div className="lex-livelli">
              {LIVELLI.map((l) => {
                const aperto = l.n <= scala.aperto;
                const fatto = l.n < scala.aperto;
                const migliore = scala.migliori?.[l.n] || 0;
                return (
                  <button
                    key={l.n}
                    type="button"
                    className={`lex-livello${aperto ? '' : ' is-chiuso'}${fatto ? ' is-fatto' : ''}${l.n === scala.aperto ? ' is-prossimo' : ''}`}
                    disabled={!aperto}
                    onClick={() => apriProva(l.n)}
                  >
                    <span className="lex-livello-n">{l.n}</span>
                    <b>{l.nome}</b>
                    <small>
                      {l.secondi}s a tentativo · parole da {l.parola.minimo}
                      {l.parola.massimo !== l.parola.minimo ? `-${l.parola.massimo}` : ''} lettere
                    </small>
                    <small className="lex-livello-conto">
                      {aperto
                        ? (migliore > 0 ? `il tuo record: ${migliore} · servono ${l.soglia}` : `servono ${l.soglia} punti`)
                        : 'chiuso'}
                    </small>
                  </button>
                );
              })}
            </div>
            <p className="tv-nota">
              Due parole segrete, {CONFIG.partita.tentativi} tentativi per ognuna. Per passare vanno
              indovinate tutte e due e serve arrivare a {LIVELLI[0].soglia} punti: la soglia è sempre
              quella, quello che cambia è il tempo che hai per raggiungerla.
            </p>
            {scala.aperto >= LIVELLI[LIVELLI.length - 1].n && (
              <p className="tv-nota">Sei arrivato all’ultimo livello. Da qui in poi si gioca per il record.</p>
            )}
          </div>
        )}

        {modo === 'multi' && (
          <div className="lex-passo">
            <p className="lex-sezione">Scegli chi sfidare</p>
            {persone.length > 0 ? (
              <>
                <div className="lex-sfida-persona">
                  <label className="lex-campo-scelta">
                    <span className="ui-label">Chi</span>
                    <select className="ui-input" value={avversario} onChange={(e) => setAvversario(e.target.value)}>
                      <option value="">Scegli…</option>
                      {persone.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                    </select>
                  </label>
                  <Button
                    variante="primario"
                    disabled={!avversario}
                    onClick={() => { creaSfidaLexora({ da: me?.id, a: avversario, lingua }); setAvversario(''); setModo(null); }}
                  >
                    Sfida
                  </Button>
                </div>
                <p className="tv-nota">
                  La sfida resta aperta finché non la accetta: {CONFIG.partita.parole} parole segrete, {CONFIG.partita.tentativi} tentativi a testa per ognuna.
                </p>
              </>
            ) : (
              <p className="tv-nota">Nella tua organizzazione non c’è ancora nessun altro da sfidare. Il computer però c’è sempre.</p>
            )}
          </div>
        )}

        <p className="tv-nota">Lexora non dà crediti né esperienza: quelli si guadagnano lavorando.</p>
      </TerminalPanel>

      <TerminalPanel titolo="Come si gioca" meta="un minuto">
        {tutorial
          ? <Tutorial onChiudi={() => setTutorial(false)} />
          : (
            <>
              <p className="tv-nota">
                Indovina la parola segreta in {CONFIG.partita.tentativi} tentativi. Un tentativo è una qualsiasi combinazione di lettere della lunghezza giusta, e i colori ti dicono quanto ci sei vicino.
              </p>
              <div className="lex-azioni">
                <Button variante="fantasma" onClick={() => setTutorial(true)}>Leggi le regole</Button>
                <Button variante="fantasma" onClick={() => navigate('/giochi/lexora/traguardi')}>
                  Traguardi {traguardi.sbloccati}/{traguardi.totale}
                </Button>
                <Button variante="fantasma" onClick={() => navigate('/giochi/lexora/classifica')}>Classifica</Button>
              </div>
            </>
          )}
      </TerminalPanel>

      <TerminalPanel titolo="Le tue statistiche" meta={`${scheda.statistiche.partite} partite`}>
        {scheda.statistiche.partite > 0 ? (
          <>
            <TerminalRows
              voci={[
                ['Vinte / perse / pari', `${scheda.statistiche.vittorie} / ${scheda.statistiche.sconfitte} / ${scheda.statistiche.pareggi}`],
                ['Punteggio migliore', scheda.statistiche.migliorPunteggio],
                ['Parola migliore', scheda.statistiche.migliorParola ? `${scheda.statistiche.migliorParola.parola} · ${scheda.statistiche.migliorParola.punti} punti` : '—'],
                ['Parole indovinate', scheda.statistiche.indovinate],
                ['Tentativi usati', scheda.statistiche.tentativi],
                ['Il colpo migliore', scheda.statistiche.miglioreColpo ? `${scheda.statistiche.miglioreColpo} tentativi` : '—'],
                ['Parole scoperte', scheda.statistiche.scoperte],
              ]}
            />
            {scheda.ultime.length > 0 && (
              <>
                <div className="tv-riga" aria-hidden="true" />
                <TerminalRows
                  voci={scheda.ultime.map((p) => {
                    const io = p.giocatori.find((g) => g.userId === me?.id);
                    const altro = p.giocatori.find((g) => g !== io);
                    return {
                      id: p.id,
                      label: `${new Date(p.giocataIl).toLocaleDateString('it-IT')} · ${nomeGiocatore(altro)}`,
                      valore: `${io?.punti ?? 0}–${altro?.punti ?? 0} · ${COME_FINI[comeFini(p, me?.id)] ?? ''}`,
                    };
                  })}
                />
              </>
            )}
          </>
        ) : (
          <p className="tv-nota">Nessuna partita ancora. Il primo livello della prova serve a capire il campo.</p>
        )}
      </TerminalPanel>
    </div>
  );
}
