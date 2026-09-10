import { useMemo, useState } from 'react';
import PageShell from '../../components/ui/PageShell';
import Chips from '../../components/ui/Chips';
import Button from '../../components/ui/Button';
import FiltriMercato from '../../components/osservatorio/FiltriMercato';
import Tavola from '../../components/osservatorio/Tavola';
import SchedaCompetenza from '../../components/osservatorio/SchedaCompetenza';
import {
  PERIODO_PREDEFINITO, FILTRI_VUOTI, giorniDi, dettaglio, emergenti,
} from '../../data/osservatorio';

/**
 * Le competenze, una per riga, e ognuna apribile.
 *
 * Tre modi di ordinarle, e sono tre domande diverse. "Le piu' certificate"
 * dice dove sta il grosso del mercato oggi; "in aumento" dice dove si sta
 * spostando; "in calo" dice quali mestieri se ne stanno andando — che per
 * chi progetta un corso di formazione e' l'informazione piu' scomoda e piu'
 * utile delle tre.
 *
 * La tavola pero' e' una griglia, e una griglia sa dire solo quanto. Sul
 * nome si apre la scheda, dove c'e' il resto: a che livello si certifica,
 * con che curva nel tempo, in che tipo di aziende attecchisce, e quali
 * altre competenze tengono le stesse persone. Sono le domande di chi deve
 * decidere che corso aprire, non di chi guarda una classifica.
 *
 * A schermo l'elenco e' corto per scelta: il mercato puo' avere migliaia
 * di competenze, e una tabella lunga come un elenco telefonico non e' una
 * schermata. Con cinque ordinamenti la testa cambia ogni volta e risponde a
 * una domanda diversa.
 *
 * Da qui i dati escono da una porta sola per tavola: l'assessment del
 * mercato per le competenze certificate, quello delle emergenti per le
 * parole appena comparse. Due elenchi che rispondono a domande diverse
 * meritano due file diversi, non lo stesso scarico due volte. Che cosa
 * ci sia dentro lo dira' Riccardo: per ora i pulsanti stanno spenti, e lo
 * dicono.
 */
/* Quante righe si vedono. Non c'e' "tutte", ed e' voluto: il mercato puo'
   avere migliaia di competenze, e una tabella lunga come un elenco
   telefonico non e' una schermata, e' un modo di non decidere che cosa
   guardare. Con cinque ordinamenti diversi, la testa dell'elenco cambia
   ogni volta e risponde a una domanda diversa. La coda lunga sta nel file,
   che infatti le porta via tutte. */
const QUANTE = [10, 25, 50];

const ORDINI = [
  { id: 'volume', nome: 'Più certificate' },
  { id: 'crescita', nome: 'In aumento' },
  { id: 'calo', nome: 'In calo' },
  { id: 'diffusione', nome: 'Più diffuse' },
  { id: 'padronanza', nome: 'Più padroneggiate' },
];

const segno = (v) => (v === null ? 'nuova' : `${v > 0 ? '+' : ''}${v}%`);
const data = (iso) => (iso ? new Date(iso).toLocaleDateString('it-IT', { month: 'short', year: 'numeric' }) : '—');

export default function CompetenzePage() {
  const [finestra, setFinestra] = useState({ periodo: PERIODO_PREDEFINITO, ...FILTRI_VUOTI });
  const [ordine, setOrdine] = useState('volume');
  const [tipo, setTipo] = useState('tutte');
  const [aperta, setAperta] = useState(null);
  const [quante, setQuante] = useState(QUANTE[1]);

  const chiave = { giorni: giorniDi(finestra.periodo), ...finestra };
  const tutte = useMemo(() => dettaglio(chiave), [finestra]); // eslint-disable-line react-hooks/exhaustive-deps
  const nuove = useMemo(() => emergenti(chiave), [finestra]); // eslint-disable-line react-hooks/exhaustive-deps

  const righe = useMemo(() => {
    const filtrate = tutte.filter((r) => tipo === 'tutte' || r.tipo === tipo);
    const copia = [...filtrate];
    if (ordine === 'crescita') {
      // Chi non ha un precedente non ha una crescita: sta in fondo, non in
      // cima con una percentuale inventata.
      copia.sort((a, b) => (b.variazione ?? -999) - (a.variazione ?? -999));
    } else if (ordine === 'calo') {
      copia.sort((a, b) => (a.variazione ?? 999) - (b.variazione ?? 999));
    } else if (ordine === 'diffusione') {
      copia.sort((a, b) => b.organizzazioni - a.organizzazioni || b.certificazioni - a.certificazioni);
    } else if (ordine === 'padronanza') {
      copia.sort((a, b) => b.padronanza - a.padronanza || b.certificazioni - a.certificazioni);
    }
    return copia;
  }, [tutte, ordine, tipo]);

  const scheda = righe.find((r) => r.chiave === aperta) || null;

  return (
    <>
      <PageShell
        title="Competenze"
        description="Che cosa le organizzazioni certificano davvero, a che livello, in che direzione si sta muovendo e quali parole sono appena comparse. Il nome di ogni riga apre la sua scheda."
      />

      <div className="ui-corpo-pagina">
        <FiltriMercato finestra={finestra} onChange={setFinestra} />

        <label className="label">Ordina per</label>
        <Chips items={ORDINI.map((o) => ({ id: o.id, label: o.nome }))} value={ordine} onChange={setOrdine} ariaLabel="Ordine" />

        <label className="label">Tipo di competenza</label>
        <Chips
          items={[{ id: 'tutte', label: 'Tutte' }, { id: 'soft', label: 'Soft skill' }, { id: 'tecnica', label: 'Tecniche' }]}
          value={tipo}
          onChange={setTipo}
          ariaLabel="Tipo di competenza"
        />

        <label className="label">Quante ne mostro</label>
        <Chips
          items={QUANTE.map((n) => ({ id: n, label: `Prime ${n}` }))}
          value={quante}
          onChange={setQuante}
          ariaLabel="Quante righe mostrare"
        />

        {scheda && <SchedaCompetenza riga={scheda} onChiudi={() => setAperta(null)} />}

        <Tavola
          titolo="Le competenze del mercato"
          nota="Le soft skill hanno lo stesso nome ovunque perché vengono dal catalogo. Le tecniche le crea ogni organizzazione: qui due aziende che chiamano una cosa allo stesso modo contano come una competenza sola, ed è così che si misura quanto una parola si sta diffondendo. Tocca un nome per aprire la scheda. A schermo c'è la testa dell'elenco secondo l'ordine scelto."
          tavola="competenze"
          periodo={finestra.periodo}
          righe={righe}
          mostraSolo={quante}
          scelta={aperta}
          onSceglie={setAperta}
          vuoto="Nessuna certificazione in questo perimetro e in questo periodo."
          scarico={false}
          azioni={(
            <Button
              variante="secondario"
              compatto
              disabled
              title="Funzione ancora da definire"
            >
              Skills assessment file
            </Button>
          )}
          colonne={[
            { chiave: 'nome', nome: 'Competenza', valore: (r) => r.nome },
            { chiave: 'tipo', nome: 'Tipo', valore: (r) => (r.tipo === 'soft' ? 'Soft skill' : 'Tecnica') },
            { chiave: 'categoria', nome: 'Famiglia', valore: (r) => r.categoria },
            { chiave: 'certificazioni', nome: 'Certificazioni', numero: true, valore: (r) => r.certificazioni },
            { chiave: 'variazione', nome: 'Variazione', numero: true, valore: (r) => r.variazione, mostra: (r) => segno(r.variazione) },
            { chiave: 'organizzazioni', nome: 'Organizzazioni', numero: true, valore: (r) => r.organizzazioni },
            { chiave: 'persone', nome: 'Persone', numero: true, valore: (r) => r.persone },
            { chiave: 'penetrazione', nome: 'Quota persone', numero: true, valore: (r) => r.penetrazione, mostra: (r) => `${r.penetrazione}%` },
            { chiave: 'livello', nome: 'Livello medio', numero: true, valore: (r) => r.livelloMedio },
            { chiave: 'padronanza', nome: 'Advanced+', numero: true, valore: (r) => r.padronanza, mostra: (r) => `${r.padronanza}%` },
            { chiave: 'concentrazione', nome: 'Concentrazione', numero: true, valore: (r) => r.concentrazione, mostra: (r) => `${r.concentrazione}%` },
            { chiave: 'guida', nome: 'Da chi guida', numero: true, valore: (r) => r.quotaGuida, mostra: (r) => `${r.quotaGuida}%` },
            { chiave: 'reparti', nome: 'Reparti', numero: true, valore: (r) => r.reparti },
          ]}
        />

        <Tavola
          titolo="Competenze emergenti"
          nota="Competenze certificate per la prima volta dentro il periodo scelto: prima nessuno le riconosceva a nessuno. Ordinate per quante organizzazioni le hanno adottate — è quello, non il volume, che dice se una parola sta attecchendo."
          tavola="emergenti"
          periodo={finestra.periodo}
          righe={nuove}
          mostraSolo={quante}
          scarico={false}
          azioni={(
            <Button
              variante="secondario"
              compatto
              disabled
              title="Funzione ancora da definire"
            >
              Emergent skill assessment file
            </Button>
          )}
          vuoto="Nessuna competenza certificata per la prima volta in questo periodo. Allarga il periodo per vedere più indietro."
          colonne={[
            { chiave: 'nome', nome: 'Competenza', valore: (r) => r.nome },
            { chiave: 'categoria', nome: 'Famiglia', valore: (r) => r.categoria },
            { chiave: 'prima', nome: 'Prima certificazione', valore: (r) => r.prima, mostra: (r) => data(r.prima) },
            { chiave: 'organizzazioni', nome: 'Organizzazioni che la certificano', numero: true, valore: (r) => r.organizzazioni },
            { chiave: 'certificazioni', nome: 'Certificazioni', numero: true, valore: (r) => r.certificazioni },
            { chiave: 'persone', nome: 'Persone', numero: true, valore: (r) => r.persone },
          ]}
        />
      </div>
    </>
  );
}
