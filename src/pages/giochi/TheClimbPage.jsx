import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../../components/ui/PageShell';
import Button from '../../components/ui/Button';
import TerminalPanel from '../../components/terminal/TerminalPanel';
import TerminalRows from '../../components/terminal/TerminalRows';
import { useAuth } from '../../context/AuthContext';
import { subscribe } from '../../data/db';
import {
  corsaClimb, nuovaCorsaClimb, abbandonaCorsaClimb, partiteClimb,
  BACKGROUND, PERCORSI, STORIA, finaleDi, nomeBackground, nomePercorso, durataDetta, durataPartita,
} from '../../data/theclimb';
import { LIVELLI } from '../../giochi/theclimb/contenuti/livelli';
/* Lo stile viaggia con le pagine e non da `main.jsx`: arriva solo a chi
   apre il gioco, come il motore. */
import '../../styles/theclimb.css';

const euro = (v) => `${Math.round(v).toLocaleString('it-IT')} €`;

/**
 * L'atrio di The Climb: la vita in corso, la storia, una vita nuova, e le
 * vite finite.
 *
 * La vita in corso sta in cima perche' e' l'unica cosa che aspetta: una
 * partita da seicento settimane si gioca a pezzi, e chi torna vuole
 * riprenderla, non leggere la storia un'altra volta.
 *
 * Una vita nuova si sceglie in due passi — da dove si parte, e che strada
 * si prende — e i due passi si vedono uno dopo l'altro, con la scheda di
 * ognuno scritta per intero: la scelta del background e' la scelta piu'
 * importante del gioco, e va fatta leggendo.
 */
export default function TheClimbPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pagina, setPagina] = useState(0);
  const [background, setBackground] = useState(null);
  const [percorso, setPercorso] = useState(null);
  const [conferma, setConferma] = useState(false);
  /* Il deposito avvisa quando cambia: una vita finita in un'altra scheda
     deve sparire da qui. */
  const [, ridisegna] = useState(0);
  useEffect(() => subscribe(() => ridisegna((v) => v + 1)), []);

  const corsa = user ? corsaClimb(user.id) : null;
  const finite = user ? partiteClimb(user.id) : [];
  const capitolo = STORIA[pagina];
  const ultima = pagina === STORIA.length - 1;

  const comincia = () => {
    const c = nuovaCorsaClimb({ da: user?.id, background, percorso });
    if (c) navigate('/giochi/the-climb/partita');
  };

  return (
    <div className="page tc-atrio">
      <PageShell
        title="The Climb"
        description="Diciannove anni, una vita che non hai scelto, e dodici anni davanti. Ogni settimana decidi dove va il tempo; il gioco ti dice che cosa è cambiato e perché. Arriva più in alto che puoi — e arrivaci intero."
      />

      {corsa && (
        <TerminalPanel titolo="La tua vita in corso" meta={`settimana ${corsa.settimana}`}>
          <TerminalRows voci={[
            ['Da dove parti', nomeBackground(corsa.background)],
            ['La strada', nomePercorso(corsa.percorso)],
            ['Età', String(corsa.motore?.eta ?? '')],
            ['Soldi', euro(corsa.motore?.vita?.soldi ?? 0)],
            ['Lavoro', corsa.motore?.lavoro ? (LIVELLI[corsa.motore.lavoro.livello]?.nome ?? 'sì') : 'nessuno'],
          ]} />
          <div className="tc-azioni">
            <Button variante="primario" onClick={() => navigate('/giochi/the-climb/partita')}>Riprendi</Button>
            {!conferma && <Button variante="fantasma" onClick={() => setConferma(true)}>Abbandona</Button>}
          </div>
          {conferma && (
            <div className="tc-conferma">
              <p className="tv-nota">Sicuro? Questa vita resta scritta fra quelle finite, come lasciata a metà. Non si torna indietro.</p>
              <div className="tc-azioni">
                <Button variante="pericolo" onClick={() => { abbandonaCorsaClimb(user.id); setConferma(false); }}>Sì, abbandona</Button>
                <Button variante="fantasma" onClick={() => setConferma(false)}>No, la tengo</Button>
              </div>
            </div>
          )}
        </TerminalPanel>
      )}

      <TerminalPanel titolo={capitolo.titolo} meta={`${pagina + 1} di ${STORIA.length}`}>
        {capitolo.testo.map((p, i) => <p key={i} className="tc-riga-testo">{p}</p>)}
        <div className="tc-azioni">
          {pagina > 0 && <Button variante="fantasma" onClick={() => setPagina((v) => v - 1)}>Indietro</Button>}
          {!ultima && <Button variante="fantasma" onClick={() => setPagina((v) => v + 1)}>Avanti</Button>}
          {ultima && <Button variante="fantasma" onClick={() => setPagina(0)}>Rileggi</Button>}
        </div>
      </TerminalPanel>

      <TerminalPanel titolo="Una vita nuova" meta={durataPartita()}>
        {corsa ? (
          <p className="tv-nota">Hai già una vita in corso: finiscila o abbandonala, e poi ne cominci un’altra. Una alla volta.</p>
        ) : (
          <>
            <p className="tc-riga-testo">Da dove parti. Non sono livelli di difficoltà: sono vite diverse, con risorse, tempo e porte diverse.</p>
            <div className="tc-vite">
              {BACKGROUND.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  className={`tc-vita${background === b.id ? ' is-scelta' : ''}`}
                  aria-pressed={background === b.id}
                  onClick={() => setBackground(b.id)}
                >
                  <b>{b.nome}</b>
                  <small>{b.difficolta}</small>
                  <span>{b.racconto}</span>
                </button>
              ))}
            </div>

            {background && (
              <div className="tc-passo">
                <p className="tc-riga-testo">Che strada prendi. Nessuna è <em>la</em> strada: tutte arrivano in cima, con colli di bottiglia diversi. Si può cambiare dopo.</p>
                <div className="tc-strade">
                  {PERCORSI.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className={`tc-strada${percorso === p.id ? ' is-scelta' : ''}`}
                      aria-pressed={percorso === p.id}
                      onClick={() => setPercorso(p.id)}
                    >
                      <b>{p.nome}</b>
                      <span>{p.spiega}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {background && percorso && (
              <div className="tc-azioni tc-passo">
                <Button variante="primario" onClick={comincia}>Comincia</Button>
              </div>
            )}
          </>
        )}
      </TerminalPanel>

      {finite.length > 0 && (
        <TerminalPanel titolo="Le vite finite" meta={`${finite.length}`}>
          <ul className="tc-elenco tc-finite">
            {finite.slice(0, 10).map((p) => {
              const r = p.riassunto || {};
              const f = finaleDi(r.esito?.causa);
              return (
                <li key={p.id}>
                  <b>{f.titolo}</b> — {nomeBackground(p.background)}, {nomePercorso(p.percorso)}, {durataDetta(r.settimane || 0)}
                  {r.livelloMassimo > 0 ? `, arrivato a ${LIVELLI[r.livelloMassimo]?.nome ?? r.livelloMassimo}` : ''}.
                  {p.confronto && (
                    <span className="tc-altrove"> Altrove: {p.confronto.filter((c) => !c.mia).map((c) => `${c.nome} → ${c.livelloNome}`).join(' · ')}.</span>
                  )}
                </li>
              );
            })}
          </ul>
        </TerminalPanel>
      )}

      <TerminalPanel titolo="Come si gioca" meta="in breve">
        <p className="tc-riga-testo">
          Ogni settimana dividi il tempo fra le attività e premi «Vivi la settimana». Se non vuoi decidere ogni volta, salvi il piano come routine e avanzi di un mese alla volta.
        </p>
        <p className="tc-riga-testo">
          Il gioco si salva da solo a ogni settimana: chiudi quando vuoi e riprendi da qui. Non dà crediti né esperienza.
        </p>
        <div className="tc-azioni">
          <Button variante="secondario" onClick={() => navigate('/giochi/the-climb/classifica')}>Classifica</Button>
          <Button variante="secondario" onClick={() => navigate('/giochi/the-climb/enciclopedia')}>Nella vita reale</Button>
          <Button variante="fantasma" onClick={() => navigate('/giochi')}>Torna ai giochi</Button>
        </div>
      </TerminalPanel>
    </div>
  );
}
