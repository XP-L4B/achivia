import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../../components/ui/PageShell';
import Button from '../../components/ui/Button';
import TerminalPanel from '../../components/terminal/TerminalPanel';
import TerminalRows from '../../components/terminal/TerminalRows';
import SchedaTalento from '../../components/osservatorio/SchedaTalento';
import { useAuth } from '../../context/AuthContext';
import {
  getUserById, puoCercareLavoro, getComparse, getMessaggi,
  rinnovaTrovabilita, revocaTrovabilita, consensoScaduto, giorniAllaScadenza,
} from '../../data/db';
import {
  miaScheda, FUORI_DALLA_SCHEDA, dossierPersonale, nomeDossierPersonale,
} from '../../data/talenti';

/**
 * I tuoi dati: che cosa c'e', chi lo vede, come portarselo via.
 *
 * La parte centrale non e' un elenco di campi: e' la tua scheda vera,
 * disegnata dallo stesso componente che la mostra a chi cerca. Non e' un
 * vezzo — e' l'unico modo di garantire che quello che leggi qui sia quello
 * che vede un'azienda. Un riassunto scritto a mano si sarebbe scollato dal
 * codice al primo campo aggiunto, e nessuno se ne sarebbe accorto.
 *
 * Sotto, l'elenco di quello che non esce mai. Quello si', e' scritto a
 * mano, e va tenuto allineato a mano: un elenco generato dai campi assenti
 * direbbe "questi campi non ci sono", che non e' un'informazione. Questo
 * dice "queste cose le abbiamo e non le diamo", che e' l'unica frase per
 * cui valga la pena aprire questa pagina.
 *
 * Cancellare l'account non e' qui: sta nelle impostazioni, dove uno se lo
 * aspetta, e da qui ci si arriva con un collegamento invece di duplicare un
 * pulsante che cancella tutto.
 */
const giorno = (iso) => (iso ? new Date(iso).toLocaleDateString('it-IT') : '—');

function scarica(testo, nome) {
  const url = URL.createObjectURL(new Blob([testo], { type: 'application/json;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function DirittiPage() {
  const { user } = useAuth();
  const me = getUserById(user?.id) || user;
  const [, ridisegna] = useState(0);

  if (!puoCercareLavoro(me)) {
    return <PageShell title="I tuoi dati" description="Non disponibile per questo tipo di accesso." />;
  }

  const t = me?.trovabilita || null;
  const scaduto = consensoScaduto(t);
  const inElenco = Boolean(t?.attiva) && !t?.revocatoIl && !scaduto;
  const mancano = giorniAllaScadenza(t);
  const scheda = miaScheda(me);
  const settimane = getComparse(me.id);
  const messaggi = getMessaggi(me.id);

  return (
    <div className="page">
      <PageShell
        title="I tuoi dati"
        description="Che cosa Achivia tiene su di te, che cosa mostra a chi cerca profili, e che cosa non mostra a nessuno."
      />

      <div className="ui-corpo-pagina">
        <TerminalPanel
          titolo="IL TUO CONSENSO"
          meta={inElenco ? 'IN ELENCO' : 'NON IN ELENCO'}
          tonoPiede={scaduto ? 'attesa' : ''}
          piede={t
            ? (scaduto ? 'SCADUTO' : inElenco ? `SCADE IL ${giorno(t.scadeIl).toUpperCase()}` : 'REVOCATO')
            : 'MAI DATO'}
          className="ui-blocco con-stacco"
        >
          {!t ? (
            <p className="tv-vuoto">
              Non ti sei mai messo in elenco: nessuna azienda può vederti né scriverti.
            </p>
          ) : (
            <>
              <TerminalRows
                vivo
                voci={[
                  ['Dato il', giorno(t.accettatoIl)],
                  ['Scade il', giorno(t.scadeIl)],
                  t.revocatoIl && ['Revocato il', giorno(t.revocatoIl)],
                  ['Posizione', t.posizione ? 'data, arrotondata a 5 km' : 'non data'],
                ].filter(Boolean)}
              />
              {scaduto && (
                <p className="ui-dialog-hint">
                  Il consenso è scaduto e non compari più a nessuno. <b>Non è stato cancellato niente</b>:
                  quello che avevi scritto è al suo posto e torna visibile appena lo rinnovi.
                </p>
              )}
              {!scaduto && inElenco && mancano <= 30 && (
                <p className="ui-dialog-hint">
                  Fra {mancano} {mancano === 1 ? 'giorno' : 'giorni'} smetterai di comparire.
                  Se stai ancora cercando, rinnova.
                </p>
              )}
              <div className="oss-scarico">
                {!inElenco && (
                  <Button
                    variante="primario"
                    compatto
                    onClick={() => { rinnovaTrovabilita(me.id); ridisegna((n) => n + 1); }}
                  >
                    Rimettimi in elenco per un anno
                  </Button>
                )}
                {inElenco && (
                  <>
                    <Button
                      variante="secondario"
                      compatto
                      onClick={() => { rinnovaTrovabilita(me.id); ridisegna((n) => n + 1); }}
                    >
                      Rinnova per un anno
                    </Button>
                    <Button
                      variante="pericolo"
                      compatto
                      onClick={() => { revocaTrovabilita(me.id); ridisegna((n) => n + 1); }}
                    >
                      Revoca adesso
                    </Button>
                  </>
                )}
                <Button variante="fantasma" compatto to="/lavoro/fatti-trovare">Modifica quello che dici</Button>
              </div>
            </>
          )}
        </TerminalPanel>

        <TerminalPanel titolo="QUANTO TI SEI FATTO VEDERE" className="ui-blocco con-stacco">
          {settimane.length === 0 ? (
            <p className="tv-vuoto">
              Non risulti ancora comparso nei risultati di nessuna ricerca.
            </p>
          ) : (
            <TerminalRows
              voci={settimane.slice(0, 8).map((c) => [
                `Settimana del ${giorno(c.settimana)}`,
                `${c.quante} ${c.quante === 1 ? 'azienda' : 'aziende'}`,
              ])}
            />
          )}
          <p className="ui-dialog-hint">
            È il numero di <b>aziende diverse nei cui risultati sei comparso</b>, non quante hanno
            aperto la tua scheda: se qualcuno ti ha guardato o no, Achivia non lo registra e non
            può dirtelo. Non teniamo traccia di chi ha cercato, quando, né con quali filtri.
          </p>
          {messaggi.length > 0 && (
            <p className="ui-dialog-hint">
              Ti hanno scritto in {messaggi.length}: i messaggi sono in{' '}
              <Link to="/lavoro/messaggi">Trova lavoro</Link>.
            </p>
          )}
        </TerminalPanel>

        <h2 className="label ui-blocco">Cosa vede chi cerca profili</h2>
        {scheda ? (
          <>
            <p className="ui-dialog-hint">
              Questa è la tua scheda vera, disegnata dallo stesso codice che la mostra a un’azienda.
              Non è un esempio: è esattamente quello che vedono{inElenco ? '' : ', se ti rimetti in elenco'}.
            </p>
            <SchedaTalento scheda={scheda} onScrivi={() => {}} />
          </>
        ) : (
          <TerminalPanel titolo="ANCORA NIENTE" className="ui-blocco con-stacco">
            <p className="tv-vuoto">
              Non ti sei mai messo in elenco, quindi non esiste nessuna scheda da mostrare.
            </p>
            <Button variante="secondario" compatto to="/lavoro/fatti-trovare">Guarda come sarebbe</Button>
          </TerminalPanel>
        )}

        <TerminalPanel
          titolo="COSA NON VEDE NESSUNO"
          meta={`${FUORI_DALLA_SCHEDA.length} COSE`}
          className="ui-blocco con-stacco"
        >
          <p className="ui-dialog-hint">
            Queste cose l’applicazione le ha, e non escono da nessuna parte — nemmeno come filtro,
            salvo dov’è scritto.
          </p>
          <dl className="dir-elenco">
            {FUORI_DALLA_SCHEDA.map((v) => (
              <div key={v.cosa} className="dir-voce">
                <dt>{v.cosa}</dt>
                <dd>{v.perche}</dd>
              </div>
            ))}
          </dl>
        </TerminalPanel>

        <TerminalPanel titolo="PORTARE VIA I TUOI DATI" className="ui-blocco con-stacco">
          <p className="ui-dialog-hint">
            Un file con tutto quello che Achivia tiene su di te a proposito del lavoro: chi sei,
            il tuo consenso e le sue date, la scheda che vedono le aziende e l’elenco di quello che
            non vedono. È JSON: lo apre un editor di testo, un foglio di calcolo o un altro
            servizio, senza bisogno di noi.
          </p>
          <div className="oss-scarico">
            <Button
              variante="secondario"
              compatto
              onClick={() => scarica(
                `${JSON.stringify(dossierPersonale(me), null, 2)}\n`,
                nomeDossierPersonale(me),
              )}
            >
              Scarica i miei dati (JSON)
            </Button>
          </div>
        </TerminalPanel>

        <TerminalPanel titolo="CANCELLARE L’ACCOUNT" className="ui-blocco con-stacco">
          <p className="ui-dialog-hint">
            Revocare il consenso ti toglie dall’elenco ma lascia il tuo account dov’è. Per
            cancellarlo del tutto si passa dalle impostazioni, dove sta insieme alle altre cose che
            riguardano l’account intero.
          </p>
          <Button variante="fantasma" compatto to="/settings">Vai alle impostazioni</Button>
        </TerminalPanel>
      </div>

    </div>
  );
}
