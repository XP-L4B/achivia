import PageShell from '../../components/ui/PageShell';
import BackTile from '../../components/ui/BackTile';
import TerminalPanel from '../../components/terminal/TerminalPanel';
import TerminalRows from '../../components/terminal/TerminalRows';
import { cifra } from '../../components/terminal/formato';
import { useAuth } from '../../context/AuthContext';
import {
  getUserById, vetrinaPiani, getOrgSeats, euro, EMAIL_SU_MISURA,
  LIVELLI_OSSERVATORIO, LIVELLI_PUBBLICITA, orgPersonalizzata,
} from '../../data/db';

const nomeDi = (elenco, id) => elenco.find((x) => x.id === id)?.nome || id;

/**
 * Il piano dell'organizzazione, e gli altri.
 *
 * Prima al suo posto c'era un pulsante "Passa a Premium" che non faceva
 * niente, perche' i piani non esistevano: c'era un interruttore. Adesso
 * esistono, e questa pagina li mette in fila con quello che ognuno da'.
 *
 * Non si compra da qui: il pagamento passa da un servizio esterno che non
 * e' ancora collegato, ed e' scritto. Vale la stessa regola dell'acquisto
 * crediti — mostrare il listino senza poterlo ancora vendere e' onesto, far
 * finta di venderlo no.
 *
 * In fondo c'e' l'indirizzo per chi non ci sta in nessuno dei quattro.
 * Sopra i centocinquanta membri il piano si fa a mano, e non e' una
 * mancanza: chi ne ha cinquecento vuole parlare con qualcuno prima di
 * mettere una carta, e un quinto pulsante non gli avrebbe risposto.
 */
export default function PianiPage() {
  const { user } = useAuth();
  const me = getUserById(user?.id) || user;
  const piani = vetrinaPiani(me?.orgId);
  // I gruppi comprano una cosa sola — quante persone ci stanno e il
  // silenzio dalla pubblicita' — quindi le righe che parlano di annunci,
  // assistente, crediti mensili e osservatorio non le riguardano e non si
  // scrivono: un elenco di "no" e' un elenco che fa sembrare povero un
  // prodotto che semplicemente e' un altro prodotto.
  const gruppo = orgPersonalizzata(me?.orgId);
  const posti = getOrgSeats(me?.orgId);
  const corrente = piani.find((p) => p.corrente);

  return (
    <>
      <PageShell
        title="Il tuo piano"
        description="Che cosa hai adesso e che cosa danno gli altri."
      />

      <div className="ui-blocco con-stacco">
        {corrente && (
          <TerminalPanel
            titolo="ADESSO HAI"
            meta={corrente.nome.toUpperCase()}
            piede={`PERSONE: ${cifra(posti.usati)}${posti.totali === Infinity ? '' : ` SU ${cifra(posti.totali)}`}`}
          >
            <p className="tv-vuoto">{corrente.descrizione}</p>
          </TerminalPanel>
        )}

        {piani.map((p) => (
          <TerminalPanel
            key={p.id}
            titolo={p.nome.toUpperCase()}
            meta={p.prezzo === 0 ? 'GRATUITO' : `${euro(p.finale)} AL ${p.periodicita === 'annuale' ? 'ANNO' : 'MESE'}`}
            piede={p.corrente ? 'È IL TUO PIANO' : undefined}
          >
            <p className="tv-vuoto">{p.descrizione}</p>
            <TerminalRows
              voci={[
                ['Persone', p.limiti.posti == null ? 'senza limite' : `fino a ${cifra(p.limiti.posti)}`],
                gruppo ? null : [
                  'Annunci di lavoro',
                  p.limiti.annunci === 1 ? '1 alla volta' : `fino a ${cifra(p.limiti.annunci)} insieme`,
                ],
                gruppo ? null : [
                  'Assistente sui profili',
                  p.limiti.azioniAi ? `${cifra(p.limiti.azioniAi)} domande al mese` : 'no',
                ],
                gruppo ? null : [
                  'Crediti ogni mese',
                  p.limiti.creditiMensili ? cifra(p.limiti.creditiMensili) : 'no',
                ],
                gruppo ? null : ['Osservatorio', nomeDi(LIVELLI_OSSERVATORIO, p.limiti.osservatorio)],
                ['Pubblicità', nomeDi(LIVELLI_PUBBLICITA, p.limiti.pubblicita)],
              ].filter(Boolean)}
            />
            {p.offerta && (
              <p className="tv-nota">
                Offerta in corso: {p.offerta.nome} — invece di {euro(p.pieno)}.
              </p>
            )}
          </TerminalPanel>
        ))}

        <TerminalPanel titolo="PIÙ DI COSÌ">
          <p className="tv-vuoto">
            Se ti serve tenere più persone di quante ne tiene il piano più grande, il piano si
            fa su misura. Scrivi a <b>{EMAIL_SU_MISURA}</b> e ne parliamo.
          </p>
        </TerminalPanel>

        {gruppo && (
          <TerminalPanel titolo="I CREDITI SI COMPRANO A PARTE">
            <p className="tv-vuoto">
              Nessuno di questi piani porta crediti: si comprano quando servono, a pacchetti, e
              si spendono nel negozio — che sta fuori dalle organizzazioni e vale per tutti.
            </p>
          </TerminalPanel>
        )}

        <TerminalPanel titolo="NON ANCORA">
          <p className="tv-vuoto">
            Il pagamento passa da un servizio esterno che non è ancora collegato: da qui i piani
            si guardano, non si comprano. Preferiamo dirtelo che darti un pulsante che non
            consegna niente.
          </p>
        </TerminalPanel>
      </div>

      <BackTile />
    </>
  );
}
