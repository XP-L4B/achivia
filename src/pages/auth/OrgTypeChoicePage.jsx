import { Link } from 'react-router-dom';
import PageShell from '../../components/ui/PageShell';
import BackTile from '../../components/ui/BackTile';

/**
 * Azienda o personalizzata: la scelta che decide tutto il resto.
 *
 * Prima erano due pulsanti e basta, e la differenza si scopriva dopo — a
 * organizzazione creata, quando ci si accorgeva che mancava qualcosa o che
 * c'era qualcosa di troppo. Sono due prodotti diversi, non due nomi diversi
 * per la stessa cosa, e il cambio non si fa: sceglierlo alla cieca era
 * l'unico modo garantito di sbagliarlo.
 *
 * Le differenze si leggono in colonna una accanto all'altra, e sono quelle
 * vere: chi lo usa, che competenze e che medaglie ci sono dentro, se si
 * entra in classifica, e — la piu' importante — che cosa resta a una
 * persona quando esce.
 */
const DIFFERENZE = [
  {
    voce: 'Per chi è',
    azienda: 'Imprese, studi, cooperative: chi ha dipendenti o collaboratori.',
    personalizzata: 'Un gruppo o un clan: una famiglia, una squadra sportiva, una classe. Chiunque voglia gamificare compiti e risultati nella propria piccola realtà.',
  },
  {
    voce: 'Competenze',
    azienda: 'Il catalogo standard di Achivia, uguale per tutte le aziende, più quelle che crei tu.',
    personalizzata: 'Solo quelle che crei tu. Il catalogo standard non c’è: “Saldatura” in casa non vuol dire niente.',
  },
  {
    voce: 'Achievement',
    azienda: 'Le medaglie standard, che maturano da sole guardando quest, scadenze e presenze.',
    personalizzata: 'Solo quelle che inventi tu, e le assegni a mano con una motivazione scritta.',
  },
  {
    voce: 'Achivia’s League',
    azienda: 'Con l’abbonamento entri in classifica con le altre aziende.',
    personalizzata: 'Nessuna classifica. Non ci si confronta con nessuno.',
  },
  {
    voce: 'Annunci di lavoro',
    azienda: 'Pubblichi offerte in bacheca, visibili a chiunque abbia un profilo Achivia.',
    personalizzata: 'No: un gruppo o un clan non assume. Gli annunci degli altri si leggono lo stesso.',
  },
  {
    voce: 'Abbonamento',
    azienda: 'Quattro piani: Standard, Silver, Gold e Diamond. Salendo aumentano le persone, gli annunci aperti, le domande all’assistente e i crediti mensili — e sparisce la pubblicità.',
    personalizzata: 'Quattro piani suoi, dai 5 ai 20 € al mese: comprano solo quante persone ci stanno e il silenzio dalla pubblicità. I crediti si acquistano a parte.',
  },
  {
    voce: 'Quando qualcuno esce',
    azienda: 'Le competenze certificate e le medaglie restano alla persona: sono il suo curriculum.',
    personalizzata: 'Non resta niente. Tranne XP e crediti, ogni risultato viene cancellato del tutto.',
  },
  {
    voce: 'Dati verso l’esterno',
    azienda: 'I dati aggregati alimentano l’osservatorio del mercato del lavoro. Mai un nome, mai una persona.',
    personalizzata: 'Nessun dato esce. Quello che succede dentro resta dentro.',
  },
];

export default function OrgTypeChoicePage() {
  return (
    <>
      <PageShell
        title="Tipo Organizzazione"
        description="Sono due prodotti diversi, e la scelta non si cambia dopo: leggi le differenze prima di decidere."
      />

      <div className="ui-corpo-pagina">
        <div className="org-tipi">
          <section className="org-tipo">
            <h2>Azienda</h2>
            <p className="org-tipo-riga">Il lavoro, con quello che ne resta scritto.</p>
            <Link to="/auth/register/org/company" className="ui-btn is-primario is-blocco">
              Crea un’azienda
            </Link>
          </section>
          <section className="org-tipo">
            <h2>Personalizzata</h2>
            <p className="org-tipo-riga">Un gruppo o un clan: la tua piccola realtà, e niente che esca da lì.</p>
            <Link to="/auth/register/org/personalizzata" className="ui-btn is-secondario is-blocco">
              Crea un’organizzazione personalizzata
            </Link>
          </section>
        </div>

        <div className="org-confronto-scorre">
          <table className="org-confronto">
            <thead>
              <tr>
                <th scope="col">Differenza</th>
                <th scope="col">Azienda</th>
                <th scope="col">Personalizzata</th>
              </tr>
            </thead>
            <tbody>
              {DIFFERENZE.map((d) => (
                <tr key={d.voce}>
                  <th scope="row">{d.voce}</th>
                  <td>{d.azienda}</td>
                  <td>{d.personalizzata}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="ui-dialog-hint">
          XP, livello e crediti sono della persona in tutti e due i casi: restano suoi anche
          quando lascia l’organizzazione, perché si spendono in un negozio che sta fuori.
        </p>
      </div>

      <BackTile />
    </>
  );
}
