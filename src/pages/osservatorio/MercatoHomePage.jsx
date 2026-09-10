import { useMemo, useState } from 'react';
import PageShell from '../../components/ui/PageShell';
import TerminalPanel from '../../components/terminal/TerminalPanel';
import TerminalRows, { TerminalValue } from '../../components/terminal/TerminalRows';
import FiltriMercato from '../../components/osservatorio/FiltriMercato';
import Tavola from '../../components/osservatorio/Tavola';
import {
  PERIODO_PREDEFINITO, FILTRI_VUOTI, giorniDi, riepilogo, categorie, struttura,
  SOGLIA_ORG, SOGLIA_PERSONE,
} from '../../data/osservatorio';

/**
 * Il colpo d'occhio sul mercato: quanto e' grande il campione, quanto si
 * certifica, come si distribuisce fra le famiglie di competenze e come sono
 * fatte dentro le organizzazioni.
 *
 * Il dettaglio competenza per competenza sta nella sua pagina: qui si
 * guarda l'insieme.
 */
const segno = (v) => (v === null ? '—' : `${v > 0 ? '+' : ''}${v}%`);

export default function MercatoHomePage() {
  const [finestra, setFinestra] = useState({ periodo: PERIODO_PREDEFINITO, ...FILTRI_VUOTI });
  const chiave = { giorni: giorniDi(finestra.periodo), ...finestra };

  const testa = useMemo(() => riepilogo(chiave), [finestra]); // eslint-disable-line react-hooks/exhaustive-deps
  const fam = useMemo(() => categorie(chiave), [finestra]); // eslint-disable-line react-hooks/exhaustive-deps
  const str = useMemo(() => struttura(finestra), [finestra]);

  return (
    <>
      <PageShell
        title="Osservatorio del mercato"
        description="Le competenze che si certificano davvero nelle organizzazioni con abbonamento, aggregate e mai riconducibili a una sola."
      />

      <div className="ui-corpo-pagina">
        <FiltriMercato finestra={finestra} onChange={setFinestra} />

        <TerminalPanel
          titolo="IL CAMPIONE"
          meta={testa.diffuso ? 'DIFFONDIBILE' : 'TROPPO STRETTO'}
          tonoPiede={testa.diffuso ? '' : 'attesa'}
          piede={testa.diffuso
            ? `${testa.organizzazioni} ORGANIZZAZIONI · ${testa.persone} PERSONE`
            : `SERVONO ALMENO ${SOGLIA_ORG} ORGANIZZAZIONI E ${SOGLIA_PERSONE} PERSONE`}
          className="ui-blocco con-stacco"
        >
          {testa.diffuso ? (
            <>
              <TerminalValue
                valore={testa.certificazioni}
                unita="certificazioni"
                nota={`${segno(testa.variazione)} sul periodo precedente`}
              />
              <div className="tv-riga" aria-hidden="true" />
              <TerminalRows
                vivo
                voci={[
                  { label: 'Organizzazioni nel perimetro', valore: testa.organizzazioni },
                  { label: 'Persone', valore: testa.persone },
                  { label: 'Competenze distinte certificate', valore: testa.competenzeDistinte },
                ]}
              />
            </>
          ) : (
            <p className="tv-vuoto">
              Con questi filtri restano {testa.organizzazioni} organizzazioni: troppo poche perché
              un numero aggregato resti aggregato. Allarga il perimetro.
            </p>
          )}
        </TerminalPanel>

        <Tavola
          titolo="Famiglie di competenze"
          nota="Come si distribuisce il lavoro di certificazione fra le cinque famiglie, e come si sposta rispetto al periodo prima."
          tavola="famiglie"
          periodo={finestra.periodo}
          righe={fam}
          colonne={[
            { chiave: 'nome', nome: 'Famiglia', valore: (r) => r.nome },
            { chiave: 'certificazioni', nome: 'Certificazioni', numero: true, valore: (r) => r.certificazioni },
            { chiave: 'variazione', nome: 'Variazione', numero: true, valore: (r) => r.variazione, mostra: (r) => segno(r.variazione) },
            { chiave: 'distinte', nome: 'Competenze distinte', numero: true, valore: (r) => r.competenzeDistinte },
            { chiave: 'organizzazioni', nome: 'Organizzazioni', numero: true, valore: (r) => r.organizzazioni },
          ]}
        />

        <Tavola
          titolo="Come sono fatte dentro"
          nota="Medie sulle organizzazioni del perimetro. I ruoli su misura sono il numero più interessante: un ruolo che un'azienda si inventa è un mestiere che nasce e non aveva ancora un nome."
          tavola="struttura"
          periodo={finestra.periodo}
          meta={str.diffuso ? `${str.organizzazioni} organizzazioni` : 'non diffondibile'}
          righe={str.voci.map((v) => ({ ...v, diffuso: str.diffuso }))}
          colonne={[
            { chiave: 'nome', nome: 'Misura', valore: (r) => r.nome },
            { chiave: 'valore', nome: 'Media', numero: true, valore: (r) => r.valore, mostra: (r) => `${r.valore}${r.unita || ''}` },
          ]}
        />
      </div>
    </>
  );
}
