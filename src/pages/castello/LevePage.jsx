import PageShell from '../../components/ui/PageShell';
import BackTile from '../../components/ui/BackTile';
import TerminalPanel from '../../components/terminal/TerminalPanel';
import TerminalRows from '../../components/terminal/TerminalRows';
import { cifra } from '../../components/terminal/formato';
import {
  getPiani, getPacchetti, getOfferte, offertaValida, getRisalto,
  euro, FREE_SEATS,
} from '../../data/db';

/**
 * LE LEVE — che cosa comanda che cosa.
 *
 * Non e' una schermata di comandi: e' la mappa di dove stanno i comandi.
 * Ogni riga dice una regola che governa l'applicazione e da dove si cambia.
 * Serve a una cosa sola, ed e' la ragione per cui il Castello esiste: non
 * dover riaprire il codice per ricordarsi che cosa paga l'abbonamento.
 *
 * Quello che e' ancora nel codice sta scritto anche lui, e sta scritto che
 * ci sta: un elenco onesto di quello che si puo' cambiare vale solo se dice
 * anche quello che non si puo'.
 */
export default function LevePage() {
  const piani = getPiani();
  const attivi = piani.filter((p) => p.attivo);
  const offerteVive = getOfferte().filter((o) => offertaValida(o));

  return (
    <>
      <PageShell
        title="Le leve"
        description="Che cosa comanda che cosa, e da dove si cambia."
      />

      <div className="ui-blocco con-stacco">
        <TerminalPanel titolo="SI CAMBIANO DA QUI" meta="LISTINO E OFFERTE">
          <TerminalRows
            voci={[
              ['Quante persone stanno in un’organizzazione', 'Listino · posti del piano'],
              ['Quanti annunci si tengono aperti', 'Listino · annunci del piano'],
              ['Quante domande all’assistente al mese', 'Listino · assistente del piano'],
              ['I crediti che il piano mette a disposizione', 'Listino · crediti ogni mese'],
              ['L’accesso all’osservatorio per piano', 'Listino · osservatorio'],
              ['Il prezzo di un abbonamento', 'Listino · prezzo del piano'],
              ['Che cosa costa un pacchetto di crediti', 'Listino · pacchetti'],
              ['Quanto costa mettere un annuncio in cima', 'Listino · risalto'],
              ['Che pubblicità vede un piano', 'Listino · pubblicità del piano'],
              ['Sconti e promozioni a tempo', 'Offerte'],
              ['Quando escono i crediti di un piano', 'Pagamenti · si registra l’incasso'],
              ['Che cosa compare negli spazi pubblicitari', 'Pubblicità'],
            ]}
          />
        </TerminalPanel>

        <TerminalPanel titolo="COM’È ADESSO" meta="FOTOGRAFIA">
          <TerminalRows
            voci={[
              ['Piani in vendita', cifra(attivi.length)],
              ['Il più caro', attivi.length ? euro(Math.max(...attivi.map((p) => p.prezzo))) : '—'],
              ['Pacchetti in vendita', cifra(getPacchetti().filter((p) => p.attivo).length)],
              {
                id: 'off',
                label: 'Offerte accese',
                valore: cifra(offerteVive.length),
                tono: offerteVive.length > 0 ? 'attesa' : 'spento',
              },
              ['Risalto, una settimana', `${cifra(getRisalto()[0]?.costo ?? 0)} crediti`],
            ]}
          />
        </TerminalPanel>

        {/* Le cose che restano nel codice. Elencarle e' l'unico modo di non
            cercarle: una regola che nessuno sa dove sta e' una regola che
            nessuno cambia. */}
        <TerminalPanel titolo="ANCORA NEL CODICE" meta="SERVE UNA PUBBLICAZIONE">
          <TerminalRows
            voci={[
              ['Quanto vale un credito in denaro', 'cambierebbe ogni prezzo mai fatto'],
              ['Posti di partenza del piano Standard', cifra(FREE_SEATS)],
              ['Che cosa fa un ruolo (i permessi)', 'permessi.js'],
              ['Le medaglie e le loro soglie', 'catalogo dei traguardi'],
              ['Le lettere e i testi delle schermate', 'nelle pagine'],
            ]}
          />
          <p className="tv-nota">
            Quanto vale un credito in denaro sta nel codice apposta, e non si mostra a nessuno:
            quello che si dice a chi compra è quanti crediti prende con quella cifra, che è
            l’unica informazione che gli serve.
          </p>
        </TerminalPanel>
      </div>

      <BackTile />
    </>
  );
}
