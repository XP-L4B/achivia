import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import TerminalPanel from '../../components/terminal/TerminalPanel';
import TerminalRows from '../../components/terminal/TerminalRows';
import Ufficio from '../../components/theboss/Ufficio';
import Cruscotto from '../../components/theboss/Cruscotto';
import Fumetto from '../../components/theboss/Fumetto';
import Battuta from '../../components/theboss/Battuta';
import ReportGiornata from '../../components/theboss/ReportGiornata';
import { porta as suonoPorta, chiudiSuoni } from '../../giochi/theboss/suoni';
import { useAuth } from '../../context/AuthContext';
import {
  creaPartita, iniziaGiornata, richiestaCorrente, decidi, chiudiGiornata,
  prossimoGiorno, fotografia, riassunto, autoreDi,
} from '../../giochi/theboss/motore/partita';
import { secondiDelGiorno, richiesteDelGiorno, PARTITA } from '../../giochi/theboss/contenuti/bilancio';
import { archetipoById } from '../../giochi/theboss/contenuti/archetipi';
import { analizza } from '../../giochi/theboss/motore/analisi';
import { consigliDi } from '../../giochi/theboss/contenuti/consigli';
import { caricaBanca } from '../../giochi/theboss/contenuti/richieste/indice';
import { caricaDisegni } from '../../giochi/theboss/caricatore';
import { registraPartitaTheBoss, momentiChiave } from '../../data/theboss';
import '../../styles/theboss.css';

/**
 * La giornata: il briefing, la fila alla porta, il rapporto della sera.
 *
 * IL TEMPO STA QUI E SOLO QUI. Il motore non sa che ora e' — e' quello che
 * permette di rigiocare una partita — quindi il contatore vive in questa
 * schermata, scende con l'orologio del browser e, quando arriva a zero,
 * chiude la giornata: quello che e' rimasto in fila scade da solo, che e'
 * la risposta peggiore.
 *
 * Il contatore usa `Date.now()` e non un contatore di secondi, perche' i
 * temporizzatori del browser rallentano quando la scheda va in secondo
 * piano: contare i battiti farebbe regalare tempo a chi cambia scheda.
 *
 * La partita in corso non si salva a meta' giornata di proposito. Chi esce
 * ritrova la giornata **chiusa com'era**: uscire non deve diventare il modo
 * di evitare una giornata storta.
 */
export default function PartitaTheBossPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pronto, setPronto] = useState(false);
  const [asset, setAsset] = useState(null);
  const stato = useRef(null);
  /* Il motore vive in un riferimento e non nello stato: e' un oggetto grosso
     che cambia in continuazione, e React non deve confrontarlo. Quello che
     serve a disegnare — e solo quello — viene copiato in `vista` a ogni
     mossa. E' anche la regola che il controllo dei riferimenti impone: si
     legge il motore dentro un gestore o un effetto, mai durante il disegno. */
  const [vista, setVista] = useState(null);
  const aggiorna = useCallback(() => {
    const s = stato.current;
    if (!s) return;
    const corrente = richiestaCorrente(s);
    setVista({
      foto: fotografia(s),
      corrente,
      chi: corrente ? autoreDi(s, corrente) : null,
      totale: secondiDelGiorno(s.giorno),
      riassunto: s.fase === 'finita' ? riassunto(s) : null,
      momenti: s.fase === 'finita' ? momentiChiave(s) : [],
      /* Che cosa fare meglio la prossima volta. Le misure le fa
         `motore/analisi.js`, le soglie stanno in `contenuti/consigli.js` e
         vengono dal confronto fra migliaia di partite vinte e perse: non
         sono impressioni. Se ne mostrano tre — dieci non sono dieci
         consigli, sono un muro. */
      consigli: s.fase === 'finita' ? consigliDi(analizza(s), 3) : [],
    });
  }, []);
  const [fase, setFase] = useState('carico');       // carico | briefing | giornata | rapporto | fine
  const [secondi, setSecondi] = useState(0);
  /* L'umore ha una vita di un secondo esatto: appare, resta, sfuma. Porta
     con se' un numero che cresce, cosi' due reazioni uguali di fila sono
     comunque due nodi diversi e l'animazione riparte davvero. */
  const [umore, setUmore] = useState(null);
  const contaUmori = useRef(0);
  const [rapporto, setRapporto] = useState(null);
  const [esito, setEsito] = useState(null);
  const scadenza = useRef(0);
  const salvata = useRef(false);

  /* Il caricamento: i disegni e la banca dei testi, una volta sola. */
  useEffect(() => {
    let vivo = true;
    Promise.all([caricaDisegni(), caricaBanca()]).then(([disegni, banca]) => {
      if (!vivo) return;
      setAsset(disegni);
      stato.current = creaPartita({ seme: Math.floor(Math.random() * 1e9), banca });
      aggiorna();
      setPronto(true);
      setFase('briefing');
    });
    return () => { vivo = false; };
  }, [aggiorna]);

  const chiudi = useCallback(() => {
    const s = stato.current;
    if (!s || s.fase === 'finita') return;
    const r = chiudiGiornata(s);
    setRapporto(r);
    setFase(s.fase === 'finita' ? 'fine' : 'rapporto');
    if (s.fase === 'finita') setEsito(s.esito);
    aggiorna();
  }, [aggiorna]);

  /* Il contatore della giornata. Usa l'orologio e non un conteggio di
     battiti: i temporizzatori del browser rallentano quando la scheda va in
     secondo piano, e contare i battiti regalerebbe tempo a chi cambia
     finestra. */
  useEffect(() => {
    if (fase !== 'giornata') return undefined;
    const battito = setInterval(() => {
      const resta = Math.max(0, (scadenza.current - Date.now()) / 1000);
      setSecondi(resta);
      if (resta <= 0) chiudi();
    }, 200);
    return () => clearInterval(battito);
  }, [fase, chiudi]);

  const apri = useCallback(() => {
    const s = stato.current;
    iniziaGiornata(s);
    const totale = secondiDelGiorno(s.giorno);
    scadenza.current = Date.now() + totale * 1000;
    setSecondi(totale);
    setUmore(null);
    /* La porta si apre sul primo che entra. Il suono sta qui e nella
       risposta, e non in un effetto che guarda cambiare chi c'e': un
       effetto dovrebbe ricordarsi chi era prima, e quella memoria e' un
       riferimento che React preferisce non far scrivere. Qui invece i due
       momenti in cui qualcuno entra sono esattamente due, e si vedono. */
    if (richiestaCorrente(s)) suonoPorta();
    setFase('giornata');
    aggiorna();
  }, [aggiorna]);

  const rispondi = useCallback((azione) => {
    const s = stato.current;
    if (!s || !richiestaCorrente(s)) return;
    const e = decidi(s, azione);
    contaUmori.current += 1;
    setUmore(e?.umore ? { id: e.umore, n: contaUmori.current } : null);
    aggiorna();
    if (!richiestaCorrente(s)) chiudi();
    else suonoPorta();                     // esce lui, entra il prossimo
  }, [aggiorna, chiudi]);

  /* La faccina vive un secondo e poi non c'e' piu'. */
  useEffect(() => {
    if (!umore) return undefined;
    const orologio = setTimeout(() => setUmore(null), 1000);
    return () => clearTimeout(orologio);
  }, [umore]);

  /* Uscendo dal gioco il contesto audio si chiude: non deve restare aperto
     a consumare mentre si guarda un'altra schermata. */
  useEffect(() => chiudiSuoni, []);

  /* I tasti 1, 2 e 3, come nella scelta dei moduli dell'arena. */
  useEffect(() => {
    if (fase !== 'giornata') return undefined;
    const tasto = (e) => {
      if (e.key === '1') rispondi('accetta');
      if (e.key === '2') rispondi('rimanda');
      if (e.key === '3') rispondi('rifiuta');
    };
    window.addEventListener('keydown', tasto);
    return () => window.removeEventListener('keydown', tasto);
  }, [fase, rispondi]);

  /* Il salvataggio: una volta sola, a partita finita. */
  useEffect(() => {
    if (fase !== 'fine' || salvata.current || !user?.id) return;
    salvata.current = true;
    registraPartitaTheBoss(user.id, riassunto(stato.current), stato.current.decisioni);
  }, [fase, user]);

  const foto = vista?.foto || null;
  const corrente = vista?.corrente || null;
  const chi = vista?.chi || null;
  const totaleGiorno = vista?.totale || 0;
  const momenti = vista?.momenti || [];
  const fin = vista?.riassunto || null;
  const consigli = vista?.consigli || [];

  if (!pronto || !foto) {
    return <div className="page tb-partita"><p className="tv-nota">&gt;&gt; Apro l’ufficio…</p></div>;
  }

  return (
    <div className="page tb-partita">
      {fase === 'briefing' && (
        <TerminalPanel titolo={`Giorno ${foto.giorno} di ${PARTITA.giorni}`} meta="briefing">
          <TerminalRows voci={[
            ['Cassa', `${Math.round(foto.cassa).toLocaleString('it-IT')} mo`],
            ['Produttività', `${Math.round(foto.produttivita)}%`],
            ['Morale', `${Math.round(foto.morale)}%`],
            ['Reputazione', `${Math.round(foto.reputazione)}%`],
            ['Organico', String(foto.organico)],
            ['Oggi bussano', `${richiesteDelGiorno(foto.giorno)} volte`],
            ['Hai', `${secondiDelGiorno(foto.giorno)} secondi`],
          ]} />
          {foto.eventi.length > 0 && (
            <ul className="tb-elenco">
              {foto.eventi.map((e) => <li key={e.id}><b>{e.nome}</b> — {e.racconto}</li>)}
            </ul>
          )}
          <div className="tb-scelte">
            <Button variante="primario" onClick={apri}>Apri la porta</Button>
            <Button variante="fantasma" onClick={() => navigate('/giochi/the-boss')}>Esci</Button>
          </div>
        </TerminalPanel>
      )}

      {(fase === 'giornata' || fase === 'rapporto') && (
        <>
          <Cruscotto foto={foto} secondi={secondi} secondiTotali={totaleGiorno} rimaste={foto.rimaste} />
          <div className="tb-scena">
            <Ufficio asset={asset} visitatore={chi?.sprite} umore={umore} />

            {/* Il fumetto di chi ha bussato: in alto a sinistra, sopra di lui. */}
            {fase === 'giornata' && corrente && (
              <Fumetto
                dove="richiesta"
                verso="giu-sinistra"
                titolo={chi?.nome}
                meta={`${chi?.ruolo}${chi?.anzianita > 0 ? ` · qui da ${chi.anzianita} ${chi.anzianita === 1 ? 'anno' : 'anni'}` : ' · arrivato quest’anno'}`}
              >
                <p className="tb-fumetto-titolo">{corrente.voce?.titolo}</p>
                <Battuta key={corrente.id} testo={corrente.voce?.testo || ''} />
                {memoriaDi(chi) && <p className="tv-nota tb-memoria">{memoriaDi(chi)}</p>}
              </Fumetto>
            )}

            {/* Il fumetto del capo: in basso a destra, con le tre risposte. */}
            {fase === 'giornata' && corrente && (
              <Fumetto dove="scelta" verso="sinistra" titolo="Tu">
                {/* Che cosa si sta decidendo, in poche parole. I testi
                    delle richieste sono racconti — chi entra descrive il
                    suo problema come lo descriverebbe davvero — e in mezzo
                    a un racconto la domanda si perde: con nove secondi sul
                    cronometro si finisce per premere «Accetta» senza sapere
                    che cosa si sta accettando. La domanda sta
                    sull'archetipo, una volta sola (vedi `archetipi.js`). */}
                {archetipoById(corrente.archetipo)?.chiede && (
                  <p className="tb-chiede">{archetipoById(corrente.archetipo).chiede}</p>
                )}
                <div className="tb-scelte">
                  <Button variante="primario" onClick={() => rispondi('accetta')}>
                    <span className="tb-tasto">1</span> Accetta
                  </Button>
                  <Button variante="fantasma" onClick={() => rispondi('rimanda')}>
                    <span className="tb-tasto">2</span> Ne parliamo domani
                  </Button>
                  <Button variante="fantasma" onClick={() => rispondi('rifiuta')}>
                    <span className="tb-tasto">3</span> Rifiuta
                  </Button>
                </div>
              </Fumetto>
            )}

            {/* Il report: sopra la stanza, senza uscire dalla schermata. */}
            {fase === 'rapporto' && (
              <ReportGiornata
                rapporto={rapporto}
                ultimo={false}
                onAvanti={() => { prossimoGiorno(stato.current); setFase('briefing'); aggiorna(); }}
              />
            )}
          </div>
        </>
      )}

      {fase === 'fine' && (
        <div className="tb-fine">
          <TerminalPanel
            titolo={esito?.vinta ? 'Ce l’hai fatta' : 'È finita'}
            meta={`giorno ${esito?.giorno} di ${PARTITA.giorni}`}
            tonoPiede={esito?.vinta ? '' : 'errore'}
          >
            <p className="tb-testo">{fineDetta(esito)}</p>
            {fin && (
              <TerminalRows voci={[
                ['Giorni sopravvissuti', String(fin.giorni)],
                ['Cassa finale', `${fin.cassaFinale.toLocaleString('it-IT')} mo`],
                ['Produttività media', `${fin.produttivitaMedia}%`],
                ['Fatturato medio', `${fin.fatturatoMedio.toLocaleString('it-IT')} mo`],
                ['Morale finale', `${fin.moraleFinale}%`],
                ['Chi se n’è andato', String(fin.usciti)],
                ['Accettate / rifiutate / rimandate', `${fin.accettate} / ${fin.rifiutate} / ${fin.rimandate}`],
                ['Rimaste senza risposta', String(fin.scadute)],
              ]} />
            )}
          </TerminalPanel>

          {/* Il consuntivo dice com'e' andata; questo dice perche', ed e'
              la sola parte che serve alla partita dopo. */}
          {consigli.length > 0 && (
            <TerminalPanel titolo="Che cosa fare meglio" meta={consigli.length === 1 ? 'una cosa' : `${consigli.length} cose`}>
              <ul className="tb-consigli">
                {consigli.map((c) => <li key={c.id}>{c.testo}</li>)}
              </ul>
            </TerminalPanel>
          )}

          {momenti.length > 0 && (
            <TerminalPanel titolo="I tre momenti che hanno deciso la partita">
              <ul className="tb-elenco">
                {momenti.map((m, i) => <li key={i}><b>Giorno {m.giorno}:</b> {m.testo}</li>)}
              </ul>
            </TerminalPanel>
          )}

          <div className="tb-scelte">
            <Button variante="primario" onClick={() => window.location.reload()}>Un’altra</Button>
            <Button variante="fantasma" onClick={() => navigate('/giochi/the-boss/classifica')}>Classifica</Button>
            <Button variante="fantasma" onClick={() => navigate('/giochi/the-boss')}>Torna all’ufficio</Button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Quello che chi parla si ricorda di te. Sta nel fumetto perche' e'
 * un'informazione che cambia la decisione, e deve essere sul tavolo mentre
 * si decide — non in un pannello sotto, dove nessuno la legge.
 */
function memoriaDi(p) {
  if (!p) return null;
  const m = p.memoria;
  if (m.ignorate >= 2) return `L’hai già lasciato senza risposta ${m.ignorate} volte.`;
  if (m.rifiutate >= 3) return `Gli hai già detto di no ${m.rifiutate} volte.`;
  if (m.rifiutate === 2) return 'Gli hai già detto di no due volte.';
  if (m.ignorate === 1) return 'Una volta è rimasto senza risposta.';
  if (m.rimandate >= 2) return `Ha già sentito «ne parliamo domani» ${m.rimandate} volte.`;
  if (m.accettate >= 3) return `Gli hai detto di sì ${m.accettate} volte.`;
  return null;
}

function fineDetta(esito) {
  if (!esito) return '';
  if (esito.vinta) return 'Trenta giorni. L’officina è ancora in piedi, e la gente ci lavora ancora. Non è poco: quasi nessuno ci arriva.';
  if (esito.causa === 'cassa') return 'La cassa è rimasta sotto zero per tre giorni. Il Gran Ciambellano ha ripreso le chiavi senza dire niente.';
  if (esito.causa === 'produttivita') return 'Non si produceva più niente da giorni. Un’officina che non produce è un magazzino con dentro delle persone tristi.';
  if (esito.causa === 'organico') return 'Se ne sono andati quasi tutti. Chi è rimasto non basta a tenere aperto, e lo sapeva anche lui.';
  return 'È finita.';
}
