import { csv, nomeFile } from '../../data/osservatorio';
import TerminalPanel from '../terminal/TerminalPanel';
import Button from '../ui/Button';

/**
 * Una tavola dell'osservatorio, con il suo scarico.
 *
 * Due cose che questa tavola fa e una tabella normale no.
 *
 * La prima: le righe che non si possono diffondere non mostrano il numero.
 * Non lo mostrano sbiadito, non fra parentesi — al suo posto c'e' un
 * trattino. Un numero calcolato su due aziende e' il dato di quelle due
 * aziende, e questo prodotto si regge sul fatto che non esca mai.
 *
 * La seconda: lo scarico esce dalla stessa funzione che disegna la tavola,
 * quindi il file e la schermata non possono divergere — e le righe non
 * diffondibili nel file non ci sono affatto, perche' un file uscito
 * dall'app non ha piu' nessuno che lo protegga. Con `scarico` a falso il
 * CSV non c'e': lo prende il posto quello che arriva da `azioni`, e allora
 * la nota in fondo smette di promettere un file che nessuno scarica.
 *
 * Con `mostraSolo` a schermo arriva solo la testa dell'elenco. Il mercato
 * puo' avere migliaia di competenze, e una tabella di migliaia di righe non
 * si legge: si scorre e basta. Quello che resta fuori non e' perso — il
 * file le ha tutte, ed e' li' che si guarda la coda lunga. Il pannello
 * scrive sempre quante ne sta mostrando su quante.
 *
 * Con `onSceglie` il nome di ogni riga diventa la porta della sua scheda.
 * Solo il nome, e solo per le righe che si possono diffondere: aprire la
 * scheda di una riga senza numeri darebbe una finestra vuota, e una riga
 * intera cliccabile non si distingue a occhio da una che non lo e'.
 */
function scarica(testo, nome) {
  const blob = new Blob([testo], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Il browser tiene in vita l'indirizzo finche' non glielo si toglie.
  URL.revokeObjectURL(url);
}

export default function Tavola({
  titolo, nota, colonne, righe, tavola, periodo, meta, vuoto, onSceglie, scelta, azioni,
  mostraSolo, scarico = true,
}) {
  const scaricabili = righe.filter((r) => r.diffuso !== false);
  // A schermo si legge la testa dell'elenco; il file se le porta via tutte.
  const inVista = mostraSolo ? righe.slice(0, mostraSolo) : righe;
  const nascoste = righe.length - inVista.length;

  return (
    <TerminalPanel
      titolo={titolo.toUpperCase()}
      meta={meta ?? (nascoste > 0
        ? `${inVista.length} di ${righe.length}`
        : `${righe.length} ${righe.length === 1 ? 'riga' : 'righe'}`)}
      className="ui-blocco con-stacco"
    >
      {nota && <p className="ui-dialog-hint">{nota}</p>}

      {righe.length === 0 ? (
        <p className="tv-vuoto">{vuoto || 'Nessun dato in questo perimetro.'}</p>
      ) : (
        <div className="oss-tavola-scorre">
          <table className="oss-tavola">
            <thead>
              <tr>
                {colonne.map((c) => (
                  <th key={c.chiave} className={c.numero ? 'in-cifre' : ''}>{c.nome}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {inVista.map((r) => (
                <tr
                  key={r.chiave}
                  className={`${r.diffuso === false ? 'is-riservata' : ''}${scelta === r.chiave ? ' is-scelta' : ''}`.trim()}
                >
                  {colonne.map((c, i) => {
                    const contenuto = r.diffuso === false && i > 0
                      ? <span className="oss-riservato" title="Calcolato su troppo poche organizzazioni per poter uscire">—</span>
                      : (c.mostra ? c.mostra(r) : c.valore(r));
                    return (
                      <td key={c.chiave} className={c.numero ? 'in-cifre' : ''}>
                        {/* La prima cella apre la scheda: il nome e' gia' la
                            cosa che si guarda per prima, e una riga intera
                            cliccabile non si distingue da una che non lo e'. */}
                        {i === 0 && typeof onSceglie === 'function' && r.diffuso !== false ? (
                          <button
                            type="button"
                            className="oss-apre"
                            aria-expanded={scelta === r.chiave}
                            onClick={() => onSceglie(scelta === r.chiave ? null : r.chiave)}
                          >
                            {contenuto}
                          </button>
                        ) : contenuto}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="oss-scarico">
        {scarico && (
          <Button
            variante="secondario"
            compatto
            disabled={scaricabili.length === 0}
            onClick={() => scarica(csv(colonne, righe), nomeFile(tavola, periodo))}
          >
            Scarica CSV
          </Button>
        )}
        {azioni}
        <small className="ui-dialog-hint">
          {scaricabili.length === righe.length
            ? `${scaricabili.length} ${scaricabili.length === 1 ? 'riga' : 'righe'}`
            : `${scaricabili.length} righe su ${righe.length}: le altre non sono diffondibili`}
          {nascoste > 0 && (scarico ? `, ${nascoste} non in elenco ma nel file` : `, ${nascoste} non in elenco`)}
        </small>
      </div>
    </TerminalPanel>
  );
}
