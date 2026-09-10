import { useState } from 'react';
import { streamChat, DEFAULT_MODEL } from '../../lib/ollama';
import { contatoreAi, consumaAzioneAi } from '../../data/db';
import { puoUsareAi } from '../../data/permessi';
import { cifra } from '../terminal/formato';
import { AZIONI } from './aiAzioni';
import Button from './Button';

const quando = (iso) => (iso ? new Date(iso).toLocaleDateString('it-IT') : '—');

const SYSTEM = `Sei l'assistente di un manager. Rispondi in italiano, in modo diretto e
discorsivo, solo su ciò che riguarda la persona e le sue quest. Niente tabelle, niente
elenchi numerati, niente emoji. Se il dato non c'è, dillo invece di inventarlo.`;

/**
 * Pannello "Achivia AI Assistant": un'analisi dei dati di una persona,
 * chiesta premendo uno dei pulsanti. Se l'assistente non è raggiungibile lo
 * dice e la pagina resta usabile.
 *
 * Tre porte, e vanno tutte e tre aperte perche' il pannello compaia.
 *
 *   L'organizzazione. Nelle personalizzate l'assistente non esiste come
 *   funzione: leggere le performance delle persone e dire come stanno
 *   andando e' una cosa che si fa a dei dipendenti, e in una famiglia o in
 *   una squadra non e' un servizio mancante ma fuori posto.
 *
 *   La persona. Solo chi guida — l'admin, i manager, o chi ha un ruolo con
 *   il permesso `ai.usa`. A un collega qualunque non manca una funzione:
 *   e' una cosa che non gli compete.
 *
 *   Il piano. Quante domande al mese, e il contatore si vede sempre: un
 *   tetto che si scopre nel momento in cui ci si sbatte contro fa
 *   arrabbiare, uno che si vede da subito e' un budget.
 */
export default function AiPanel({ subject, context, orgId, userId, subjectId, chiGuarda }) {
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [versione, setVersione] = useState(0);
  const conto = contatoreAi(orgId);

  async function chiedi(azione) {
    if (busy) return;
    /* Si paga prima di chiedere: una domanda partita e' una domanda
       consumata, anche se poi l'assistente non risponde. Contare le sole
       risposte arrivate vorrebbe dire regalare le domande fatte a un
       servizio che non va. */
    if (!consumaAzioneAi({ orgId, userId, tipo: azione.id, su: subjectId })) {
      setError(`Le domande di questo periodo sono finite. Il conto riparte il ${quando(conto.riparteIl)}.`);
      return;
    }
    setVersione((v) => v + 1);
    setBusy(true);
    setError('');
    setAnswer('');
    try {
      let out = '';
      for await (const chunk of streamChat({
        model: DEFAULT_MODEL,
        messages: [
          { role: 'system', content: `${SYSTEM}\n\nPersona: ${subject}\nDati:\n${JSON.stringify(context)}` },
          { role: 'user', content: azione.q },
        ],
      })) {
        out += chunk;
        setAnswer(out);
      }
    } catch (e) {
      setError(e.message || 'Assistente non raggiungibile.');
    } finally {
      setBusy(false);
    }
  }

  // Dove l'assistente non esiste, e dove non compete a chi sta guardando,
  // il pannello non c'e' e non c'e' nemmeno l'invito a comprarlo: sono due
  // "no" diversi da quello del piano, e nessuno dei due si risolve pagando.
  if (!conto.esiste) return null;
  if (!puoUsareAi(chiGuarda)) return null;

  if (!conto.haAssistente) {
    return (
      <section className="ui-panel ui-blocco con-stacco">
        <p className="ui-ai-title">✦ Achivia AI Assistant</p>
        <p className="ui-ai-conto">
          L’assistente legge i dati di una persona e dice come sta andando e su cosa
          farla crescere. È nei piani dal Silver in su.
        </p>
        <Button variante="secondario" to="/admin/settings/piani">Guarda i piani</Button>
      </section>
    );
  }

  return (
    <section className="ui-panel ui-blocco con-stacco" data-versione={versione}>
      <p className="ui-ai-title">✦ Achivia AI Assistant</p>
      <p className="ui-ai-conto">
        {conto.esaurito
          ? `Domande finite. Il conto riparte il ${quando(conto.riparteIl)}.`
          : `${cifra(conto.restano)} domande su ${cifra(conto.tetto)} in questo periodo.`}
      </p>

      <div className="ui-quick">
        {AZIONI.map((a) => (
          <Button
            key={a.id}
            variante="secondario"
            compatto
            onClick={() => chiedi(a)}
            disabled={busy || conto.esaurito}
          >
            {a.label}
          </Button>
        ))}
      </div>

      {busy && <p style={{ marginTop: 14 }}>Sto guardando i dati…</p>}
      {error && <p className="ui-errore" role="alert">{error}</p>}
      {answer && <p style={{ marginTop: 14, whiteSpace: 'pre-wrap' }}>{answer}</p>}
    </section>
  );
}
