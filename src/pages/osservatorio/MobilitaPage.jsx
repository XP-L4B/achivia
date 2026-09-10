import { useMemo, useState } from 'react';
import PageShell from '../../components/ui/PageShell';
import FiltriMercato from '../../components/osservatorio/FiltriMercato';
import Tavola from '../../components/osservatorio/Tavola';
import {
  PERIODO_PREDEFINITO, FILTRI_VUOTI, giorniDi, mobilita,
} from '../../data/osservatorio';

/**
 * Chi si muove: entra, viene promosso, cambia reparto, se ne va.
 *
 * Il registro che alimenta questa pagina non serviva a nessuna schermata
 * dell'app — un profilo mostra il ruolo di adesso, non quelli di prima. E'
 * stato aggiunto per qui: un movimento che nessuno scrive quando succede
 * non si ricostruisce piu' dopo.
 *
 * L'ultima riga e' il saldo, e si legge diversamente dalle altre: quelle
 * contano cose successe, questa e' una differenza. Percio' porta il segno
 * scritto davanti anche quando e' positivo — un "3" in mezzo ad altri numeri
 * si legge come un conteggio, un "+3" no.
 */
const segno = (v) => (v === null ? '—' : `${v > 0 ? '+' : ''}${v}%`);

/* Col segno solo dove il segno vuol dire qualcosa: sulle righe che contano
   movimenti, un "+" davanti sarebbe rumore. */
const conSegno = (r, n) => (r.conSegno && n > 0 ? `+${n}` : String(n));

export default function MobilitaPage() {
  const [finestra, setFinestra] = useState({ periodo: PERIODO_PREDEFINITO, ...FILTRI_VUOTI });
  const chiave = { giorni: giorniDi(finestra.periodo), ...finestra };
  const dati = useMemo(() => mobilita(chiave), [finestra]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <PageShell
        title="Mobilità"
        description="Quanto si muovono le persone dentro le organizzazioni: chi entra, chi viene promosso, chi cambia reparto, chi se ne va — e da che parte pende il saldo."
      />

      <div className="ui-corpo-pagina">
        <FiltriMercato finestra={finestra} onChange={setFinestra} />

        <Tavola
          titolo="Movimenti"
          nota="Ogni movimento è datato nel momento in cui è successo. «Ogni cento» rapporta il numero alle persone del perimetro, così due periodi con campioni diversi restano confrontabili. L'ultima riga non conta movimenti: è la differenza fra i primi e gli ultimi."
          tavola="mobilita"
          periodo={finestra.periodo}
          meta={dati.diffuso ? `${dati.organizzazioni} organizzazioni · ${dati.persone} persone` : 'non diffondibile'}
          righe={dati.voci.map((v) => ({ ...v, diffuso: dati.diffuso }))}
          colonne={[
            { chiave: 'nome', nome: 'Movimento', valore: (r) => r.nome },
            { chiave: 'quanti', nome: 'Nel periodo', numero: true, valore: (r) => r.quanti, mostra: (r) => conSegno(r, r.quanti) },
            { chiave: 'precedenti', nome: 'Periodo prima', numero: true, valore: (r) => r.precedenti, mostra: (r) => conSegno(r, r.precedenti) },
            { chiave: 'variazione', nome: 'Variazione', numero: true, valore: (r) => r.variazione, mostra: (r) => segno(r.variazione) },
            { chiave: 'ogniCento', nome: 'Ogni cento persone', numero: true, valore: (r) => r.ogniCento, mostra: (r) => conSegno(r, r.ogniCento) },
          ]}
        />

        <p className="ui-dialog-hint">
          Il <b>saldo netto</b> è ingressi meno uscite: dice da che parte si muove il perimetro,
          non solo quanto si muove. Non ha una variazione percentuale perché è un numero con il
          segno che può attraversare lo zero, e la percentuale fra due numeri così non vuol dire
          niente: il confronto è la colonna del periodo prima.
        </p>
        <p className="ui-dialog-hint">
          Un’uscita è chi ha cambiato organizzazione e chi se l’è vista togliere da un
          amministratore: da fuori lasciano lo stesso buco, e l’applicazione non sa dire quale
          dei due sia stato.
        </p>
      </div>
    </>
  );
}
