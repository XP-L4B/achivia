import { useState } from 'react';
import Chips from '../../components/ui/Chips';
import CalendarIcon from '../../components/ui/CalendarIcon';
import FinestraPeriodo from '../../components/ui/FinestraPeriodo';
import { breve, giornoIso } from '../../components/ui/periodi';
import { FINESTRE } from '../../data/castello';

/**
 * Il selettore del periodo del Castello.
 *
 * Le finestre fisse sono sette e non tre come nelle griglie delle
 * organizzazioni: qui si guardano cose che cambiano ogni giorno — quanti si
 * sono iscritti, quanti si sono fatti vedere — e due giorni e' una domanda
 * vera, non un caso limite.
 *
 * Le chip e la finestra a mano sono quelle che l'applicazione usa gia': lo
 * stesso gesto in due posti deve avere la stessa forma, e una seconda
 * famiglia di comandi per fare la stessa cosa e' il modo piu' rapido di far
 * sembrare due prodotti quello che ne e' uno.
 */
export default function FinestraCastello({ periodo, intervallo, onCambia, oggi }) {
  const [scegliendo, setScegliendo] = useState(false);

  return (
    <>
      <Chips
        items={[
          ...FINESTRE.map((f) => ({ id: f.id, label: f.nome.toUpperCase() })),
          {
            id: 'personalizzata',
            label: (
              <span className="ui-chip-cal">
                <CalendarIcon style={{ flex: '0 0 auto' }} />
                {intervallo ? `${breve(intervallo.da)}–${breve(intervallo.a)}` : 'SCEGLI'}
              </span>
            ),
          },
        ]}
        value={periodo}
        onChange={(id) => (id === 'personalizzata' ? setScegliendo(true) : onCambia(id, null))}
        ariaLabel="Periodo"
      />
      {scegliendo && (
        <FinestraPeriodo
          iniziale={intervallo || { da: giornoIso(oggi - 29 * 86400000), a: giornoIso(oggi) }}
          oggi={oggi}
          onConferma={(scelto) => { onCambia('personalizzata', scelto); setScegliendo(false); }}
          onChiudi={() => setScegliendo(false)}
        />
      )}
    </>
  );
}
