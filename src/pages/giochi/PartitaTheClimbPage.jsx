import { useCallback, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import TerminalPanel from '../../components/terminal/TerminalPanel';
import TerminalRows from '../../components/terminal/TerminalRows';
import Cruscotto from '../../components/theclimb/Cruscotto';
import Stanza from '../../components/theclimb/Stanza';
import Finestra from '../../components/theclimb/Finestra';
import Tutorial from '../../components/theclimb/Tutorial';
import Piano from '../../components/theclimb/Piano';
import Riepilogo from '../../components/theclimb/Riepilogo';
import Carte from '../../components/theclimb/Carte';
import SchedaAzienda from '../../components/theclimb/SchedaAzienda';
import Persone from '../../components/theclimb/Persone';
import Evento from '../../components/theclimb/Evento';
import { useAuth } from '../../context/AuthContext';
import { avatarForUser } from '../../data/avatars';
import {
  giocaSettimana, impostaRoutine, prendiLavoro, lasciaLavoro, scegliPercorso,
  faiColloquio, accettaOfferta, rifiutaOfferta, agisci, rispondiEvento, bara, fermati, molla, epilogo,
  fotografia, riassunto, pianoDiRoutine, energiaChiesta,
} from '../../giochi/theclimb/motore/partita';
import { PARTITA } from '../../giochi/theclimb/contenuti/bilancio';
import { confronto } from '../../giochi/theclimb/motore/replay';
import { LIVELLI } from '../../giochi/theclimb/contenuti/livelli';
import { PASSI_TUTORIAL } from '../../giochi/theclimb/contenuti/tutorial';
import { HARD, SOFT } from '../../giochi/theclimb/contenuti/competenze';
import {
  apriCorsaClimb, salvaCorsaClimb, tutorialClimbVisto, segnaTutorialClimb,
  AZIENDE, PERCORSI, finaleDi, nomeBackground, nomePercorso, durataDetta,
} from '../../data/theclimb';
import '../../styles/theclimb.css';

const euro = (v) => `${Math.round(v).toLocaleString('it-IT')} €`;

/**
 * La settimana: il piano, la vita che la vive, il riepilogo.
 *
 * Il motore vive in un riferimento, come in The Boss: e' un oggetto grosso
 * che cambia a ogni mossa, e quello che serve a disegnare viene copiato in
 * `foto` dopo ogni mossa. Non c'e' un orologio: una settimana dura quanto
 * ci si mette a decidere.
 *
 * IL SALVATAGGIO E' A OGNI SETTIMANA, e a ogni decisione che non e' una
 * settimana (la routine, un lavoro, il percorso). Chi chiude la pagina
 * ritrova la settimana in cui era, con il piano com'era la routine. Non
 * si salva a meta' di niente perche' non c'e' una meta': la settimana o
 * e' vissuta o no.
 *
 * «Avanza un mese» gioca quattro settimane con la routine e mostra il
 * riepilogo dell'ultima: e' per le settimane in cui non cambia niente, e
 * si ferma da solo se la vita finisce prima.
 *
 * LA SCHERMATA E' UNA STANZA, alla Tabboz: l'avatar del profilo in mezzo,
 * i contatori a lato, sotto la fila dei tasti — il piano, il lavoro, le
 * porte, le offerte, le persone, le competenze, la strada, le
 * scorciatoie, chiudere qui. Ogni tasto apre una finestra sopra la
 * stanza (`finestra`), e la finestra si chiude senza che sia successo
 * niente: le decisioni che aspettano una risposta — un evento, il
 * riepilogo, l'esito di un colloquio — restano i fogli di prima.
 */
export default function PartitaTheClimbPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  /* La corsa in corso si apre una volta, alla nascita della schermata:
     negli inizializzatori, non in un effetto — e' una lettura sincrona
     del deposito, e un effetto che imposta lo stato appena montato
     farebbe due disegni per uno. */
  const [inizio] = useState(() => (user?.id ? apriCorsaClimb(user.id) : null));
  const stato = useRef(inizio);
  const [foto, setFoto] = useState(() => (inizio ? fotografia(inizio) : null));
  const [piano, setPiano] = useState(() => (inizio ? pianoDiRoutine(inizio) : {}));
  const [fase, setFase] = useState(inizio ? 'pianifica' : 'carico');       // carico | pianifica | riepilogo | fine
  const [riepilogo, setRiepilogo] = useState(null);
  const [giocate, setGiocate] = useState(1);
  const [nota, setNota] = useState(null);
  const [finale, setFinale] = useState(null);
  /* l'esito dell'ultimo colloquio: compare sopra la pagina, come il riepilogo */
  const [colloquio, setColloquio] = useState(null);
  /* la finestra aperta sopra la stanza: uno dei posti in cui si va */
  const [finestra, setFinestra] = useState(null);
  const avatar = avatarForUser(user);
  /* la guida della schermata: da sola la prima volta, poi da «Come funziona» */
  const [guida, setGuida] = useState(() => Boolean(inizio && user?.id && !tutorialClimbVisto(user.id)));
  const chiudiGuida = useCallback(() => {
    if (user?.id) segnaTutorialClimb(user.id);
    setGuida(false);
  }, [user]);
  /* L'energia che il piano chiede si calcola quando il piano cambia, non
     durante il disegno: il motore sta in un riferimento, e un riferimento
     non si legge disegnando. */
  const [chiesta, setChiesta] = useState(() => (inizio ? energiaChiesta(inizio, pianoDiRoutine(inizio)) : 0));

  const aggiorna = useCallback(() => {
    const s = stato.current;
    if (!s) return;
    setFoto(fotografia(s));
  }, []);

  const impostaPiano = useCallback((nuovo) => {
    setPiano(nuovo);
    setChiesta(stato.current ? energiaChiesta(stato.current, nuovo) : 0);
  }, []);

  const salva = useCallback(() => {
    if (user?.id && stato.current) salvaCorsaClimb(user.id, stato.current);
  }, [user]);

  const cambia = useCallback((id, valore) => {
    impostaPiano({ ...piano, [id]: valore });
  }, [piano, impostaPiano]);

  const chiudiSeFinita = useCallback(() => {
    const s = stato.current;
    if (s.fase === 'finita') {
      setFinale({ riassunto: riassunto(s), finale: finaleDi(s.esito?.causa), esito: s.esito, epilogo: epilogo(s), altrove: confronto(s) });
      return true;
    }
    return false;
  }, []);

  /* le scorciatoie, e le due porte per chiudere: decisioni come le altre */
  const [confermaFine, setConfermaFine] = useState(null);     // 'fermati' | 'molla' | null
  const scorciatoia = useCallback((id) => {
    const s = stato.current;
    const r = bara(s, id);
    if (!r.ok) { setNota(r.errore); return; }
    setNota(r.testo);
    salva();
    aggiorna();
  }, [salva, aggiorna]);
  const chiudiVita = useCallback((come) => {
    const s = stato.current;
    const r = come === 'fermati' ? fermati(s) : molla(s);
    if (!r.ok) { setNota(r.errore); setConfermaFine(null); return; }
    setConfermaFine(null);
    chiudiSeFinita();
    salva();
    aggiorna();
    setFase('fine');
  }, [salva, aggiorna, chiudiSeFinita]);

  const vivi = useCallback(() => {
    const s = stato.current;
    if (!s || s.fase === 'finita') return;
    const x = giocaSettimana(s, piano);
    if (!x.ok) { setNota(x.errore); return; }
    setNota(null);
    setFinestra(null);
    chiudiSeFinita();
    salva();
    setRiepilogo(x);
    setGiocate(1);
    setFase('riepilogo');
    aggiorna();
  }, [piano, aggiorna, salva, chiudiSeFinita]);

  const avanza = useCallback((quante) => {
    const s = stato.current;
    if (!s || s.fase === 'finita') return;
    let ultimo = null;
    let n = 0;
    for (let i = 0; i < quante && s.fase !== 'finita'; i += 1) {
      /* con la routine si va avanti finche' non succede qualcosa: quello
         che succede lo si legge, non lo decide la routine */
      if (s.eventi.length) break;
      const x = giocaSettimana(s);
      if (!x.ok) { setNota(x.errore); break; }
      ultimo = x;
      n += 1;
      salva();
    }
    if (!ultimo) return;
    setFinestra(null);
    chiudiSeFinita();
    setRiepilogo(ultimo);
    setGiocate(n);
    setFase('riepilogo');
    aggiorna();
  }, [aggiorna, salva, chiudiSeFinita]);

  const dopoRiepilogo = useCallback(() => {
    const s = stato.current;
    if (s.fase === 'finita') { setFase('fine'); return; }
    impostaPiano(pianoDiRoutine(s));
    setFase('pianifica');
  }, [impostaPiano]);

  const salvaRoutine = useCallback(() => {
    const s = stato.current;
    const r = impostaRoutine(s, piano);
    setNota(r.ok ? 'Routine salvata: da qui in poi, se non decidi, si fa così.' : r.errore);
    if (r.ok) salva();
    aggiorna();
  }, [piano, salva, aggiorna]);

  const lavoro = useCallback((aziendaId) => {
    const s = stato.current;
    const r = aziendaId ? prendiLavoro(s, aziendaId) : lasciaLavoro(s);
    if (!r.ok) { setNota(r.errore); return; }
    setNota(aziendaId ? 'Da questa settimana il lavoro chiede le sue ore: il piano è stato riadattato.' : 'Senza lavoro le ore sono tue, e lo stipendio no.');
    salva();
    impostaPiano(pianoDiRoutine(s));
    aggiorna();
  }, [salva, aggiorna, impostaPiano]);

  const bussa = useCallback((aziendaId) => {
    const s = stato.current;
    const r = faiColloquio(s, aziendaId);
    if (!r.ok) { setNota(r.errore); return; }
    setNota(null);
    salva();
    setColloquio(r);
    aggiorna();
  }, [salva, aggiorna]);

  const rispondi = useCallback((aziendaId, si) => {
    const s = stato.current;
    const r = si ? accettaOfferta(s, aziendaId) : rifiutaOfferta(s, aziendaId);
    if (!r.ok) { setNota(r.errore); return; }
    setNota(si ? 'Da questa settimana lavori lì: il piano è stato riadattato alle ore che chiede.' : 'Offerta lasciata cadere.');
    salva();
    impostaPiano(pianoDiRoutine(s));
    aggiorna();
  }, [salva, aggiorna, impostaPiano]);

  const mossa = useCallback((personaId, azione) => {
    const s = stato.current;
    const r = agisci(s, personaId, azione);
    if (!r.ok) { setNota(r.errore); return; }
    setNota(r.testo);
    salva();
    if (r.lascia) impostaPiano(pianoDiRoutine(s));
    aggiorna();
  }, [salva, aggiorna, impostaPiano]);

  const rispondiEv = useCallback((eventoId, opzioneId) => {
    const s = stato.current;
    const r = rispondiEvento(s, eventoId, opzioneId);
    if (!r.ok) { setNota(r.errore); return; }
    const righe = r.perche.map((p) => p.testo);
    setNota(righe.length ? `${r.titolo}: ${righe.join(' ')}` : r.lezione ? `${r.titolo}. ${r.lezione}` : `${r.titolo}: fatto.`);
    salva();
    impostaPiano(pianoDiRoutine(s));
    aggiorna();
  }, [salva, aggiorna, impostaPiano]);

  const strada = useCallback((id) => {
    const s = stato.current;
    const r = scegliPercorso(s, id);
    if (!r.ok) { setNota(r.errore); return; }
    setNota(null);
    salva();
    aggiorna();
  }, [salva, aggiorna]);

  if (!inizio) return <Navigate to="/giochi/the-climb" replace />;
  if (!foto) return <div className="page tc-partita"><p className="tv-nota">&gt;&gt; Riprendo la settimana…</p></div>;

  if (fase === 'fine' && finale) {
    const r = finale.riassunto;
    const ep = finale.epilogo;
    return (
      <div className="page tc-partita tc-fine">
        <TerminalPanel titolo={finale.finale.titolo} meta={`settimana ${finale.esito?.settimana ?? r.settimane}`}>
          <p className="tc-riga-testo">{finale.finale.testo}</p>
          {ep?.cause?.length > 0 && (
            <>
              <p className="tc-riga-testo"><b>Che cosa l’ha costruito</b></p>
              <ul className="tc-elenco">{ep.cause.map((c, i) => <li key={i}>{c}</li>)}</ul>
            </>
          )}
          {ep?.consiglio && (
            <div className="tc-passo">
              <p className="tc-riga-testo"><b>Il consiglio di amministrazione</b> — {ep.consiglio.testo}</p>
              <Carte carte={ep.consiglio.carte} />
              <ul className="tc-elenco">{ep.consiglio.domande.map((d, i) => <li key={i}><i>{d.domanda}</i></li>)}</ul>
              {ep.consiglio.lezione && <p className="tc-lezione">{ep.consiglio.lezione}</p>}
            </div>
          )}
          <TerminalRows voci={[
            ['Da dove partivi', nomeBackground(r.background)],
            ['La strada', nomePercorso(r.percorso)],
            ['Quanto è durata', durataDetta(r.settimane)],
            ['Età', String(r.eta)],
            ['Dove sei arrivato', LIVELLI[r.livelloMassimo]?.nome ?? String(r.livelloMassimo)],
            r.aziende?.length ? ['Dove hai lavorato', r.aziende.map((id) => AZIENDE.find((a) => a.id === id)?.nome ?? id).join(', ')] : null,
            ['Soldi', euro(r.soldi)],
            ['Competenze tecniche, in media', String(r.mediaHard)],
            ['Competenze trasversali, in media', String(r.mediaSoft)],
            ['Relazioni', String(r.relazioni)],
            ['Rete', String(r.rete)],
            r.titoli?.length ? ['Titoli', r.titoli.map(nomePercorso).join(', ')] : null,
            ['Integrità', String(r.integrita)],
            r.scorrettezze ? ['Angoli tagliati', String(r.scorrettezze)] : null,
          ]} />
          {ep?.carriera?.length > 0 && (
            <div className="tc-passo">
              <p className="tc-riga-testo"><b>La carriera</b></p>
              <ul className="tc-elenco">{ep.carriera.map((c, i) => <li key={i}><small>settimana {c.s}</small> — {c.testo}</li>)}</ul>
            </div>
          )}
          {finale.altrove && (
            <div className="tc-passo">
              <p className="tc-riga-testo"><b>E se fossi nato altrove?</b> Con esattamente le stesse scelte che hai fatto tu:</p>
              <ul className="tc-elenco tc-altrove-elenco">
                {finale.altrove.map((c) => (
                  <li key={c.background} className={c.mia ? 'is-mia' : ''}>
                    <b>{c.nome}</b>: {c.testo}{c.mia ? ' — la tua vita' : ''}
                    {!c.mia && (c.conta.saltate > 0 || c.conta.nonArrivate > 0) && (
                      <small className="tc-altrove-conta"> ({[c.conta.saltate ? `${c.conta.saltate} scelte che lì non si potevano fare` : null, c.conta.nonArrivate ? `${c.conta.nonArrivate} occasioni che lì non sono arrivate` : null].filter(Boolean).join(', ')})</small>
                    )}
                  </li>
                ))}
              </ul>
              <p className="tc-lezione">Le scelte erano identiche. Cambiava solo da dove partivi.</p>
            </div>
          )}
          {ep?.decisioni?.length > 0 && (
            <div className="tc-passo">
              <p className="tc-riga-testo"><b>Le decisioni che hanno pesato</b> — calcolate dal diario: dove la curva ha cambiato pendenza, non un giudizio.</p>
              <ul className="tc-elenco">{ep.decisioni.map((d, i) => <li key={i}><small>settimana {d.s}</small> — {d.testo}: da lì in {d.verso}.</li>)}</ul>
            </div>
          )}
          <div className="tc-azioni">
            <Button variante="primario" onClick={() => navigate('/giochi/the-climb')}>Un’altra vita</Button>
            <Button variante="fantasma" onClick={() => navigate('/giochi')}>Torna ai giochi</Button>
          </div>
        </TerminalPanel>
      </div>
    );
  }

  const aperte = foto.porte.filter((p) => !p.chiusa).length;
  const metaLavoro = foto.lavoro ? `${foto.lavoro.livelloNome} · da ${foto.lavoro.anzianita} settimane` : 'nessuno';

  return (
    <div className="page tc-partita tc-tabboz">
      <header className="tc-testata">
        <span><b>Settimana {foto.settimana}</b> <small>di {foto.settimaneMassime}</small></span>
        <span><b>{foto.eta} anni</b> <small>· {nomePercorso(foto.percorso)}</small></span>
        <span><small>energia</small> <b>{foto.energia}</b> <small>· il piano ne chiede</small> <b>{chiesta}</b></span>
        <Button variante="secondario" compatto onClick={() => setGuida(true)} aria-label="Come funziona la schermata">Come funziona</Button>
      </header>

      <div className="tc-schermo">
        <Stanza foto={foto} avatar={avatar} nota={nota} />
        <Cruscotto foto={foto} />
      </div>

      {foto.differite.length > 0 && (
        <p className="tv-nota">In arrivo: {foto.differite.map((d) => `${d.testo.replace(/\.$/, '')} (fra ${d.fra} ${d.fra === 1 ? 'settimana' : 'settimane'})`).join(' · ')}.</p>
      )}

      {/* I posti in cui si va: ogni tasto apre una finestra sopra la stanza. */}
      <nav className="tc-tasti" aria-label="Dove vai">
        <Button variante="primario" onClick={() => setFinestra('piano')}>Il piano della settimana{foto.eventi.length > 0 && <span className="tc-conta" aria-label="qualcosa aspetta">!</span>}</Button>
        <Button variante="secondario" onClick={() => setFinestra('lavoro')}>Il lavoro<small className="tc-tag">{foto.lavoro ? foto.lavoro.livelloNome : 'nessuno'}</small></Button>
        <Button variante="secondario" onClick={() => setFinestra('offerte')} disabled={foto.offerte.length === 0}>Le offerte{foto.offerte.length > 0 && <span className="tc-conta">{foto.offerte.length}</span>}</Button>
        <Button variante="secondario" onClick={() => setFinestra('porte')}>Le porte{aperte > 0 && <span className="tc-conta">{aperte}</span>}</Button>
        <Button variante="secondario" onClick={() => setFinestra('persone')}>Le persone{foto.persone.length > 0 && <span className="tc-conta">{foto.persone.length}</span>}</Button>
        <Button variante="secondario" onClick={() => setFinestra('competenze')}>Le competenze<small className="tc-tag">{foto.mediaHard} · {foto.mediaSoft}</small></Button>
        <Button variante="secondario" onClick={() => setFinestra('strada')}>La strada</Button>
        <Button variante="secondario" onClick={() => setFinestra('scorciatoie')}>Le scorciatoie<small className="tc-tag">integrità {Math.round(foto.vita.integrita)}</small></Button>
        <Button variante="secondario" onClick={() => setFinestra('chiudere')}>Chiudere qui</Button>
      </nav>

      <div className="tc-azioni tc-comandi">
        <Button variante="primario" onClick={vivi} disabled={foto.eventi.length > 0}>Vivi la settimana</Button>
        <Button variante="secondario" onClick={() => avanza(PARTITA.settimanePerMese)} disabled={foto.eventi.length > 0}>Avanza un mese con la routine</Button>
        <Button variante="secondario" onClick={() => navigate('/giochi/the-climb')}>Esci (è tutto salvato)</Button>
      </div>

      {/* La guida aspetta che non ci sia niente da rispondere: sopra un
          evento sarebbero due fogli, e nessuno dei due si leggerebbe. */}
      {guida && fase === 'pianifica' && foto.eventi.length === 0 && !finestra && (
        <Tutorial passi={PASSI_TUTORIAL} onChiudi={chiudiGuida} />
      )}

      {fase === 'riepilogo' && (
        <Riepilogo riepilogo={riepilogo} settimaneGiocate={giocate} finita={foto.fase === 'finita'} onAvanti={dopoRiepilogo} />
      )}

      {/* Quello che e' successo aspetta: dopo il riepilogo, prima del piano. */}
      {fase === 'pianifica' && foto.eventi.length > 0 && (
        <Evento evento={foto.eventi[0]} onRispondi={rispondiEv} />
      )}

      {colloquio && (
        <div className="tc-riepilogo" role="dialog" aria-modal="true" aria-label="Il colloquio">
          <div className="tc-scorre tc-foglio">
            <TerminalPanel titolo={colloquio.preso ? 'Ti vogliono' : 'Hanno detto di no'} meta={colloquio.nome}>
              <p className="tc-riga-testo">{colloquio.testo}</p>
              {colloquio.scene?.map((sc, i) => <p key={i} className="tc-lezione">{sc}</p>)}
              <Carte carte={colloquio.carte} />
              <p className="tv-nota">Avevi {Math.round(colloquio.probabilita * 100)} probabilità su cento. {colloquio.preso ? 'L’offerta aspetta qui sotto, per qualche settimana.' : 'Le carte che mancavano sono quelle con la croce.'}</p>
            </TerminalPanel>
            <div className="tc-azioni">
              <Button variante="primario" onClick={() => setColloquio(null)}>Ho capito</Button>
            </div>
          </div>
        </div>
      )}


      {finestra === 'piano' && (
        <Finestra titolo="Il piano della settimana" meta={`energia ${foto.energia} · chiesta ${chiesta}`} onChiudi={() => setFinestra(null)}
          azioni={(
            <>
              <Button variante="primario" onClick={vivi} disabled={foto.eventi.length > 0}>Vivi la settimana</Button>
              <Button variante="secondario" onClick={salvaRoutine}>Salva come routine</Button>
            </>
          )}>
          <Piano foto={foto} piano={piano} energiaChiesta={chiesta} onCambia={cambia} />
          {nota && <p className="tv-nota tc-nota" role="status">{nota}</p>}
        </Finestra>
      )}

      {finestra === 'lavoro' && (
        <Finestra titolo="Il lavoro" meta={metaLavoro} onChiudi={() => setFinestra(null)}>
      {foto.lavoro ? (
        <>
          <TerminalRows voci={[
            ['Dove', foto.lavoro.azienda?.nome ?? foto.lavoro.aziendaId],
            ['Stipendio', `${euro(foto.lavoro.stipendio)} al mese`],
            ['Performance', `${Math.round(foto.lavoro.performance)}`],
            ['Visibilità', `${Math.round(foto.lavoro.visibilita)}`],
            ['Ore obbligatorie', `${foto.oreObbligatorie} punti a settimana`],
            foto.lavoro.prossimaValutazione ? ['Prossima valutazione', `fra ${foto.lavoro.prossimaValutazione} ${foto.lavoro.prossimaValutazione === 1 ? 'settimana' : 'settimane'}`] : null,
            foto.lavoro.azienda?.tipo !== 'sopravvivenza' ? ['Qui si arriva fino a', LIVELLI[foto.lavoro.azienda.tetto]?.nome ?? ''] : null,
          ]} />
          <SchedaAzienda scheda={foto.lavoro.azienda} />
          {foto.valutazioni.length > 0 && (
            <div className="tc-passo">
              <p className="tc-riga-testo"><b>L’ultima valutazione</b> — {foto.valutazioni.at(-1).testo}</p>
              <Carte carte={foto.valutazioni.at(-1).carte} />
              {foto.valutazioni.at(-1).lezione && <p className="tc-lezione">{foto.valutazioni.at(-1).lezione}</p>}
            </div>
          )}
          <div className="tc-azioni">
            <Button variante="fantasma" onClick={() => lavoro(null)}>Lascia il lavoro</Button>
          </div>
        </>
      ) : (
        <>
          <p className="tc-riga-testo">Senza stipendio i conti di fine mese sono tutti in uscita. Questi quattro lavori si trovano subito, senza colloquio: pagano l’affitto, tengono in piedi e insegnano un mestiere. Per una carriera a gradini si bussa alle porte delle aziende.</p>
          <div className="tc-lavori">
            {AZIENDE.filter((a) => a.tipo === 'sopravvivenza').map((a) => (
              <button key={a.id} type="button" className="tc-lavoro" onClick={() => lavoro(a.id)}>
                <b>{a.nome}</b>
                <span>{a.racconto}</span>
              </button>
            ))}
          </div>
        </>
      )}
        </Finestra>
      )}

      {finestra === 'offerte' && (
        <Finestra titolo="Le offerte" meta={`${foto.offerte.length}`} onChiudi={() => setFinestra(null)}>
      {foto.offerte.map((o) => (
        <div key={o.aziendaId} className="tc-offerta">
          <p className="tc-riga-testo">
            <b>{o.nome}</b> ti vuole come <b>{o.livelloNome}</b>: {euro(o.stipendio)} al mese, {o.ore} punti di tempo a settimana
            {foto.lavoro ? ` (adesso: ${euro(foto.lavoro.stipendio)}, ${foto.oreObbligatorie} punti)` : ''}. Scade fra {o.scade - foto.settimana} {o.scade - foto.settimana === 1 ? 'settimana' : 'settimane'}.
          </p>
          <SchedaAzienda scheda={o.scheda} compatta />
          <div className="tc-azioni">
            <Button variante="primario" onClick={() => rispondi(o.aziendaId, true)}>Accetta</Button>
            <Button variante="fantasma" onClick={() => rispondi(o.aziendaId, false)}>Lascia cadere</Button>
          </div>
        </div>
      ))}
        </Finestra>
      )}

      {finestra === 'porte' && (
        <Finestra titolo="Le porte" meta={`ricerca ${foto.ricerca} · un colloquio ne costa ${foto.costoColloquio}`} onChiudi={() => setFinestra(null)}>
      <p className="tc-riga-testo">
        Le aziende strutturate — quelle con una carriera a gradini — e a che condizioni parlerebbero con te adesso. Per bussare serve aver cercato lavoro («Cercare lavoro», nel piano): un colloquio spende {foto.costoColloquio} unità di ricerca, e poi decide il caso — con le probabilità scritte qui.
      </p>
      <ul className="tc-porte">
        {foto.porte.map((p) => (
          <li key={p.aziendaId} className={`tc-porta${p.chiusa ? ' is-chiusa' : ''}`}>
            <div className="tc-porta-testa">
              <span className="tc-porta-nome">
                <b>{p.nome}</b>
                <small>{p.livelloNome} · {euro(p.stipendio)} al mese · {p.ore} punti a settimana</small>
              </span>
              <span className="tc-porta-azione">
                {p.chiusa
                  ? <small className="tc-porta-chiusa">{p.chiusa}</small>
                  : <Button compatto variante={p.probabilita >= 0.5 ? 'primario' : 'secondario'} disabled={foto.ricerca < foto.costoColloquio} onClick={() => bussa(p.aziendaId)}>Bussa · {Math.round(p.probabilita * 100)}%</Button>}
              </span>
            </div>
            <Carte carte={p.carte} />
          </li>
        ))}
      </ul>
        </Finestra>
      )}

      {finestra === 'persone' && (
        <Finestra titolo="Le persone" meta={foto.sponsor ? `sponsor: ${foto.sponsor.nome}` : `${foto.persone.length}`} onChiudi={() => setFinestra(null)}>
          <Persone persone={foto.persone} onAgisci={mossa} />
        </Finestra>
      )}

      {finestra === 'competenze' && (
        <Finestra titolo="Le competenze" meta={`tecniche ${foto.mediaHard} · trasversali ${foto.mediaSoft}`} onChiudi={() => setFinestra(null)}>
          <div className="tc-competenze">
            <TerminalRows voci={HARD.map((h) => [h.nome, String(Math.round(foto.hard[h.id] ?? 0))])} />
            <TerminalRows voci={SOFT.map((s) => [s.nome, String(Math.round(foto.soft[s.id] ?? 0))])} />
          </div>
        </Finestra>
      )}

      {finestra === 'strada' && (
        <Finestra titolo="La strada" meta={foto.titoli.length ? `titoli: ${foto.titoli.map(nomePercorso).join(', ')}` : nomePercorso(foto.percorso)} onChiudi={() => setFinestra(null)}>
      <p className="tc-riga-testo">Si può cambiare strada. Quello che si è studiato resta; quello che costa cambia.</p>
      <div className="tc-strade">
        {PERCORSI.map((p) => (
          <button key={p.id} type="button" className={`tc-strada${foto.percorso === p.id ? ' is-scelta' : ''}`} aria-pressed={foto.percorso === p.id} onClick={() => strada(p.id)}>
            <b>{p.nome}</b>
            <span>{p.spiega}</span>
          </button>
        ))}
      </div>
        </Finestra>
      )}

      {finestra === 'scorciatoie' && (
        <Finestra titolo="Le scorciatoie" meta={foto.macchia ? (foto.macchia.perSempre ? 'uno scandalo alle spalle, per sempre' : `uno scandalo alle spalle, ancora ${Math.max(0, foto.macchia.fino - foto.settimana)} settimane`) : `integrità ${Math.round(foto.vita.integrita)}`} onChiudi={() => setFinestra(null)}>
      <p className="tc-riga-testo">
        Si può barare, e all’inizio funziona: ogni scorciatoia rende subito e abbassa l’integrità, che vedi. Quello che non vedi è quanto sei diventato rintracciabile — e cresce con quanto sei visibile.
      </p>
      <ul className="tc-porte">
        {foto.scorrettezze.map((sc) => (
          <li key={sc.id} className={`tc-porta${sc.disponibile ? '' : ' is-chiusa'}`}>
            <div className="tc-porta-testa">
              <span className="tc-porta-nome">
                <b>{sc.nome}</b>
                <small>{sc.testo}{sc.integrita ? ` · integrità −${sc.integrita}` : ''}</small>
              </span>
              <span className="tc-porta-azione">
                {sc.disponibile
                  ? <Button compatto variante={sc.riparazione ? 'successo' : 'pericolo'} onClick={() => scorciatoia(sc.id)}>{sc.riparazione ? 'Ammetti' : 'Fallo'}</Button>
                  : <small className="tc-porta-chiusa">{sc.perche}</small>}
              </span>
            </div>
            <p className="tc-persona-spiega">{sc.spiega}</p>
          </li>
        ))}
      </ul>
      {foto.esplosioni.length > 0 && (
        <ul className="tc-elenco tc-passo">
          {foto.esplosioni.map((e, i) => <li key={i}><small>settimana {e.s}</small> — {e.testo}</li>)}
        </ul>
      )}
        </Finestra>
      )}

      {finestra === 'chiudere' && (
        <Finestra titolo="Chiudere qui" meta="due porte che non sono sconfitte" onChiudi={() => setFinestra(null)}>
      <p className="tc-riga-testo">Fermarsi dove si è arrivati, con una buona vita; o mollare tutto e fare altro. Sono finali, non fallimenti: la partita finisce e resta scritta così.</p>
      {!confermaFine ? (
        <div className="tc-azioni">
          <Button variante="secondario" disabled={!foto.fermarsi.ok} title={foto.fermarsi.perche ?? undefined} onClick={() => setConfermaFine('fermati')}>Mi fermo qui</Button>
          {!foto.fermarsi.ok && <small className="tc-mossa-perche">{foto.fermarsi.perche}</small>}
          <Button variante="fantasma" disabled={!foto.mollare.ok} title={foto.mollare.perche ?? undefined} onClick={() => setConfermaFine('molla')}>Mollo tutto</Button>
          {!foto.mollare.ok && <small className="tc-mossa-perche">{foto.mollare.perche}</small>}
        </div>
      ) : (
        <div className="tc-conferma">
          <p className="tv-nota">{confermaFine === 'fermati' ? 'Ti fermi qui: la vita finisce così, e resta scritta come una buona vita. Sicuro?' : 'Molli tutto: la vita finisce qui. Sicuro?'}</p>
          <div className="tc-azioni">
            <Button variante="pericolo" onClick={() => chiudiVita(confermaFine)}>Sì</Button>
            <Button variante="fantasma" onClick={() => setConfermaFine(null)}>No</Button>
          </div>
        </div>
      )}
        </Finestra>
      )}
    </div>
  );
}
