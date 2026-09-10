import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../../components/ui/PageShell';
import Button from '../../components/ui/Button';
import TerminalPanel from '../../components/terminal/TerminalPanel';
import { STORIA, AZIENDA } from '../../giochi/theboss/contenuti/storia';
import { PARTITA, richiesteDelGiorno, secondiDelGiorno } from '../../giochi/theboss/contenuti/bilancio';
import { DIPENDENTI, MANAGER } from '../../giochi/theboss/contenuti/cast';
import { urlAsset } from '../../giochi/theboss/asset';
/* Lo stile viaggia con le pagine e non da `main.jsx`: cosi' arriva solo a
   chi apre il gioco, come i disegni e il motore. */
import '../../styles/theboss.css';

/**
 * L'atrio di The Boss: la storia, la squadra, e la porta per entrare.
 *
 * La storia non e' un fronzolo messo davanti al gioco: e' il tutorial. Dice
 * dove sei e insegna le tre regole — si', no, ne parliamo domani — senza
 * chiamarle regole. Si legge la prima volta, si salta, e si rilegge da qui.
 *
 * La squadra sta in questa schermata e non dentro la partita perche' i
 * venti che bussano alla porta sono la meta' della battuta: chi li ha visti
 * una volta, quando entra il troll dell'imbottigliamento sa gia' chi e'.
 */
export default function TheBossPage() {
  const navigate = useNavigate();
  const [pagina, setPagina] = useState(0);
  const capitolo = STORIA[pagina];
  const ultima = pagina === STORIA.length - 1;

  return (
    <div className="page theboss-atrio">
      <PageShell
        title="The Boss"
        description={`${AZIENDA.nome}: ${AZIENDA.anni} anni di pozioni, e adesso il registro lo tieni tu. Trenta giorni, una squadra particolare, e tre risposte possibili.`}
      />

      <TerminalPanel titolo={capitolo.titolo} meta={`${pagina + 1} di ${STORIA.length}`}>
        {capitolo.testo.map((p, i) => <p key={i} className="theboss-riga">{p}</p>)}
        <div className="theboss-azioni">
          {pagina > 0 && (
            <Button variante="fantasma" onClick={() => setPagina((v) => v - 1)}>Indietro</Button>
          )}
          {!ultima && (
            <Button variante="fantasma" onClick={() => setPagina((v) => v + 1)}>Avanti</Button>
          )}
          {ultima && (
            <Button variante="fantasma" onClick={() => setPagina(0)}>Rileggi</Button>
          )}
        </div>
      </TerminalPanel>

      <TerminalPanel titolo="La squadra" meta={`${DIPENDENTI.length} dipendenti, ${MANAGER.length} assistant manager`}>
        <div className="theboss-squadra">
          {[...DIPENDENTI, ...MANAGER].map((p) => (
            <figure key={p.id} className="theboss-scheda">
              <span
                className="theboss-ritratto"
                style={{ backgroundImage: `url(${urlAsset(`persona.${p.sprite}`)})` }}
                aria-hidden="true"
              />
              <figcaption>
                <b>{p.nome}</b>
                <small>{p.ruolo}</small>
                <span className="tv-nota">{p.nota}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </TerminalPanel>

      <TerminalPanel titolo="Come si gioca" meta={`${PARTITA.giorni} giorni`}>
        <p className="theboss-riga">
          Ogni giornata ha un tempo e una fila di richieste: si comincia con {richiesteDelGiorno(1)} richieste
          in {secondiDelGiorno(1)} secondi e si finisce con {richiesteDelGiorno(PARTITA.giorni)} in {secondiDelGiorno(PARTITA.giorni)}.
          Il tempo scorre mentre leggi, e questo fa parte del gioco.
        </p>
        <p className="theboss-riga">
          Non rispondere è la risposta peggiore: chi resta senza risposta si sente ignorato e non ti
          riconosce nemmeno il merito di avergli detto di no.
        </p>
        <p className="theboss-riga">
          L’officina parte leggermente in perdita, e non è un caso: chi sta bene lavora, chi lavora
          produce, e il fatturato viene da lì. Tenuta su bene, entro la prima settimana comincia a
          guadagnare. Ma dal quindicesimo giorno il regno rincara, e quello che hai messo via nella
          prima metà è quello con cui ti compri la seconda.
        </p>
        <div className="theboss-azioni">
          <Button variante="primario" onClick={() => navigate('/giochi/the-boss/partita')}>Comincia</Button>
          <Button variante="fantasma" onClick={() => navigate('/giochi/the-boss/classifica')}>Classifica</Button>
          <Button variante="fantasma" onClick={() => navigate('/giochi/the-boss/crediti')}>Crediti e licenze</Button>
          <Button variante="fantasma" onClick={() => navigate('/giochi')}>Torna ai giochi</Button>
        </div>
      </TerminalPanel>
    </div>
  );
}
