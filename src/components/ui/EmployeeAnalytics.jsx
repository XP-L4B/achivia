import { useId, useState } from 'react';
import Chips from './Chips';
import TrendChart from './TrendChart';
import TerminalPanel from '../terminal/TerminalPanel';
import TerminalRows, { TerminalValue } from '../terminal/TerminalRows';
import TerminalBar from '../terminal/TerminalBar';
import CalendarIcon from './CalendarIcon';
import FinestraPeriodo from './FinestraPeriodo';
import { PERIODI, breve, finestraDi, etichettaPeriodo } from './periodi';
import { presenceStreak, riepilogoDi } from '../../data/presenze';
import { ordiniDi } from '../../data/negozio';
import {
  getQuestsForUser,
  getHelpRequestsByRequester,
  getHelpRequestsByHelper,
  getUserById,
  quotaDi,
} from '../../data/db';

const pct = (n, d) => (d > 0 ? Math.round((n / d) * 100) : 0);

/**
 * Griglie Performance e Crediti di un dipendente, con selettore di periodo.
 * Riusata dalla pagina Analytics del dipendente e dal dettaglio lato manager.
 */
export default function EmployeeAnalytics({ user }) {
  const [vista, setVista] = useState('valori');
  // Quale riga comanda la lettura in cima al pannello Performance.
  const [metrica, setMetrica] = useState('pct-in-tempo');
  const idLettura = useId();
  const [periodo, setPeriodo] = useState('all');
  const [intervallo, setIntervallo] = useState(null);   // { da, a } in aaaa-mm-gg
  const [scegliendo, setScegliendo] = useState(false);
  // L'istante di riferimento si fissa all'apertura della pagina: se lo
  // leggessimo a ogni render i conteggi ballerebbero senza motivo.
  const [adesso] = useState(() => Date.now());
  const me = getUserById(user.id) || user;

  const finestra = finestraDi(periodo, intervallo, adesso);

  // Il periodo si applica alle quest concluse, che sono le uniche con una data
  // di chiusura. Quelle chiuse prima che registrassimo la data restano fuori
  // dai periodi limitati: meglio non contarle che datarle a caso.
  const nelPeriodo = (q) => {
    if (!finestra) return true;
    if (!q.approvedAt) return false;
    const quando = new Date(q.approvedAt).getTime();
    return quando >= finestra.da && quando <= finestra.a;
  };

  const tutte = getQuestsForUser(me).filter((q) => q.status !== 'template');
  const quests = tutte.filter((q) => (q.status === 'approvata' ? nelPeriodo(q) : !finestra));
  const total = quests.length;
  const completed = quests.filter((q) => q.status === 'approvata');
  const failed = quests.filter((q) => q.status === 'scaduta');
  const late = completed.filter((q) => q.late === true);
  const onTime = completed.length - late.length;

  const helpGiven = getHelpRequestsByHelper(me.id);
  const helpAsked = getHelpRequestsByRequester(me.id);

  // Aiutare un collega non sposta crediti: la ricompensa di una quest resta
  // intera a chi la porta a termine. Una quest di gruppo invece si divide, e
  // qui si conta la parte arrivata a questa persona, non quella scritta
  // sulla quest.
  const totalEarned = completed.reduce((sum, q) => sum + quotaDi(q, me.id), 0);

  // La percentuale di quest chiuse in tempo e' il dato con cui la pagina si
  // apre: sta in cima, grande, con la sua barra. Ma ogni riga sotto puo'
  // prendere quel posto — si clicca e la lettura in alto diventa la sua.
  //
  // Ogni voce dice due cose: come si legge nella riga (`valore`, compatto,
  // incolonnato con gli altri) e come si legge in cima (`focale` con
  // `unita`, che deve stare in piedi da solo). Chi ha una `percentuale` ha
  // anche la barra; chi non ce l'ha mostra il numero e basta, perche' una
  // barra senza un intero a cui riferirsi non misura niente — "5 aiuti
  // forniti" su quanto?
  const completamento = pct(onTime, total);

  // Ritardi e assenze arrivano dal registro di Time & Attendance, con la
  // stessa finestra scelta qui sopra: un'assenza di marzo non deve comparire
  // fra i dati di questa settimana.
  const presenze = riepilogoDi(me.id, finestra);
  // La serie e' una fotografia di oggi, non un totale del periodo: come i
  // crediti attuali, non si taglia con la finestra scelta sopra.
  const streak = presenceStreak(me.id);
  const perse = pct(failed.length, total);
  const tarde = pct(late.length, total);
  const allarme = failed.length > 0 ? 'errore' : 'spento';
  const attesa = late.length > 0 ? 'attesa' : 'spento';

  const performance = [
    { id: 'in-tempo', label: 'Completate in tempo', valore: onTime,
      focale: `${onTime}/${total}`, unita: 'completate in tempo' },
    { id: 'pct-in-tempo', label: '% sul totale', valore: `${completamento}%`,
      focale: `${completamento}%`, unita: 'in tempo', percentuale: completamento,
      nota: `${onTime}/${total} quest` },
    { id: 'aiuti-dati', label: 'Aiuti forniti', valore: helpGiven.length,
      focale: helpGiven.length, unita: 'aiuti forniti' },
    { id: 'aiuti-chiesti', label: 'Aiuti richiesti', valore: helpAsked.length,
      focale: helpAsked.length, unita: 'aiuti richiesti' },
    { id: 'fallite', label: 'Quest fallite', valore: failed.length, tono: allarme,
      focale: `${failed.length}/${total}`, unita: 'quest fallite' },
    { id: 'pct-fallite', label: '% quest fallite', valore: `${perse}%`, tono: allarme,
      focale: `${perse}%`, unita: 'quest fallite', percentuale: perse,
      nota: `${failed.length}/${total} quest` },
    { id: 'ritardo', label: 'Consegne in ritardo', valore: late.length, tono: attesa,
      focale: `${late.length}/${total}`, unita: 'consegnate in ritardo' },
    { id: 'pct-ritardo', label: '% consegne in ritardo', valore: `${tarde}%`, tono: attesa,
      focale: `${tarde}%`, unita: 'in ritardo', percentuale: tarde,
      nota: `${late.length}/${total} quest` },
    // Dal registro delle presenze. "In ritardo" qui sopra e' la quest
    // consegnata tardi; questo e' arrivare tardi la mattina — due cose
    // diverse che prima si sarebbero chiamate uguale.
    { id: 'assenze', label: 'Assenze', valore: presenze.assenze,
      tono: presenze.assenze > 0 ? 'errore' : 'spento',
      focale: presenze.assenze, unita: 'assenze',
      nota: presenze.assenzeGiustificate > 0 ? `${presenze.assenzeGiustificate} giustificate` : undefined },
    { id: 'ritardi-ingresso', label: 'Ritardi in ingresso', valore: presenze.ritardi,
      tono: presenze.ritardi > 0 ? 'attesa' : 'spento',
      focale: presenze.ritardi, unita: 'ritardi in ingresso',
      nota: presenze.ritardiGiustificati > 0 ? `${presenze.ritardiGiustificati} giustificati` : undefined },
    { id: 'minuti-ritardo', label: 'Minuti di ritardo', valore: presenze.minuti,
      tono: presenze.minuti > 0 ? 'attesa' : 'spento',
      focale: presenze.minuti, unita: 'minuti di ritardo',
      nota: presenze.ritardi > 0 ? `su ${presenze.ritardi} ${presenze.ritardi === 1 ? 'ritardo' : 'ritardi'}` : undefined },
    { id: 'presenze', label: 'Presence Streak', valore: streak.giorni,
      tono: streak.livello ? '' : 'spento',
      focale: streak.giorni, unita: streak.giorni === 1 ? 'giorno senza assenze' : 'giorni senza assenze',
      nota: streak.livello ? `livello ${streak.livello.nome}` : undefined },
  ];

  const scelta = performance.find((m) => m.id === metrica) ?? performance[0];

  // Quanto e' uscito davvero: la somma degli ordini che non sono stati
  // annullati. Prima questa riga leggeva un campo che nessuno scriveva mai,
  // e diceva sempre zero.
  const totalSpent = ordiniDi(me.id)
    .filter((o) => o.stato !== 'annullato')
    .reduce((somma, o) => somma + (Number(o.crediti) || 0), 0);

  const credits = [
    ['Totale guadagnati', totalEarned],
    ['Totale spesi', totalSpent],
  ];

  const periodoScritto = etichettaPeriodo(periodo, intervallo);

  // Le due viste guardano gli stessi dati: i valori di oggi e il loro
  // andamento nel tempo. Il grafico ha un periodo suo, a mesi, che non
  // c'entra con quello delle griglie.
  if (vista === 'grafico') {
    return (
      <>
        <button type="button" className="px-btn ghost" onClick={() => setVista('valori')}>
          Vedi i valori
        </button>
        <TrendChart user={user} />
      </>
    );
  }

  return (
    <>
      <Chips
        items={[...PERIODI, {
          id: 'scelta',
          label: (
            <span className="ui-chip-cal">
              <CalendarIcon style={{ flex: '0 0 auto' }} />
              {intervallo ? `${breve(intervallo.da)}–${breve(intervallo.a)}` : 'SCEGLI'}
            </span>
          ),
        }]}
        value={periodo}
        // Il calendario non e' un periodo da selezionare al volo: apre la
        // scelta delle date, e diventa il periodo attivo solo se si conferma.
        onChange={(id) => (id === 'scelta' ? setScegliendo(true) : setPeriodo(id))}
        ariaLabel="Periodo"
      />
      <button type="button" className="px-btn ghost" onClick={() => setVista('grafico')}>
        Vedi il grafico
      </button>
      <div className="ui-blocco con-stacco">
        <TerminalPanel
          titolo="PERFORMANCE"
          meta={periodoScritto}
          piede={total > 0 ? `QUEST_ANALIZZATE: ${total}` : 'NESSUNA QUEST NEL PERIODO'}
          tonoPiede={total > 0 ? '' : 'attesa'}
        >
          {/* La lettura cambia sotto le dita: chi usa un lettore di schermo
              deve sentirla cambiare, non scoprirlo tornando indietro. */}
          <div id={idLettura} role="tabpanel" aria-live="polite">
            <TerminalValue valore={scelta.focale} unita={scelta.unita} nota={scelta.nota} />
            {scelta.percentuale != null && (
              <TerminalBar
                percentuale={scelta.percentuale}
                tono={scelta.tono === 'errore' ? 'errore' : ''}
                etichetta={`${scelta.percentuale}% — ${scelta.label}`}
              />
            )}
          </div>
          <div className="tv-riga" aria-hidden="true" />
          <TerminalRows
            voci={performance}
            attivo={scelta.id}
            onSceglie={setMetrica}
            controlla={idLettura}
            ariaLabel="Quale dato vedere in cima"
          />
        </TerminalPanel>
      </div>

      <div className="ui-blocco con-stacco">
        <TerminalPanel titolo="CREDITI" meta={periodoScritto} piede="WALLET: SINCRONIZZATO">
          <TerminalValue valore={me.credits} unita="crediti" nota="saldo attuale" />
          <div className="tv-riga" aria-hidden="true" />
          <TerminalRows voci={credits} vivo />
        </TerminalPanel>
      </div>

      {scegliendo && (
        <FinestraPeriodo
          iniziale={intervallo}
          oggi={adesso}
          onChiudi={() => setScegliendo(false)}
          onConferma={(scelta) => {
            setIntervallo(scelta);
            setPeriodo('scelta');
            setScegliendo(false);
          }}
        />
      )}
    </>
  );
}
