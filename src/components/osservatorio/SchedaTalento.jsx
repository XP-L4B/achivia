import { useState } from 'react';
import TerminalPanel from '../terminal/TerminalPanel';
import TerminalRows from '../terminal/TerminalRows';
import Button from '../ui/Button';
import { nomeZona, linguaById } from '../../data/geografia';
import { distanzaDa, cercaALettere } from '../../data/talenti';
import { NOMI_PRECISIONE } from '../../data/posizione';
import { livelloById } from '../../data/skillsCatalog';

/**
 * La scheda di una persona che si e' resa trovabile.
 *
 * Si chiama con un numero. Non e' una scelta grafica: il nome non arriva
 * nemmeno a questo componente, perche' `scheda()` in talenti.js non lo mette
 * dentro. Una regola scritta qui si perderebbe al primo componente nuovo che
 * qualcuno aggiunge; una regola scritta dove nascono i dati non si dimentica.
 *
 * La distanza si legge a fasce e mai in cifre, e accanto c'e' scritto da
 * dove viene: una cella di cinque chilometri se la persona ha dato la
 * posizione, il centro della zona che ha dichiarato se non l'ha data.
 *
 * Non c'e' un totale di "anni di esperienza", e non e' una dimenticanza.
 * Sommare i giorni passati dentro le organizzazioni che stanno su Achivia
 * misura da quanto tempo qualcuno usa questa applicazione, non da quanto
 * tempo fa il suo mestiere: chi ha lavorato quindici anni altrove e sei
 * mesi qui risulterebbe alle prime armi, e un numero che sbaglia proprio
 * sui profili piu' esperti e' peggio di nessun numero. Quello che resta e'
 * il percorso qui sotto — le organizzazioni con le loro date — che sono
 * fatti e non una somma, e chi cerca li legge da solo.
 *
 * Quello che non c'e' e' importante quanto quello che c'e': niente
 * percentuale di quest riuscite, niente assenze, niente ritardi, niente
 * crediti. Un profilo si presenta con quello che ha fatto. I dati che
 * possono danneggiare chi li ha dati in buona fede non escono, e chi cerca
 * puo' usarli solo come pavimento in un filtro — dove non rivelano una
 * cifra, ma solo che si sta sopra.
 */
const giorno = (iso) => (iso ? new Date(iso).toLocaleDateString('it-IT') : '—');

export default function SchedaTalento({ scheda, centro, onScrivi }) {
  const [tutte, setTutte] = useState(false);
  const competenze = tutte ? scheda.competenze : scheda.competenze.slice(0, 6);
  const distanza = distanzaDa(centro, scheda);
  const vuole = cercaALettere(scheda.cerca);

  return (
    <TerminalPanel
      titolo={`ID ${scheda.achiviaId}`}
      meta={`${scheda.competenze.length} COMPETENZE`}
      piede={`DISPONIBILE DAL ${giorno(scheda.disponibileDa).toUpperCase()}`}
      className="ui-blocco con-stacco"
    >
      {scheda.lettera && <p className="tal-lettera">{scheda.lettera}</p>}

      <TerminalRows
        vivo
        voci={[
          { label: 'Disponibile a lavorare', valore: scheda.zone.map(nomeZona).join(' · ') || '—' },
          {
            label: 'Lingue',
            valore: scheda.lingue.map((l) => linguaById(l)?.nome || l).join(', ') || '—',
          },
          { label: 'Quest portate a termine', valore: scheda.questChiuse },
          // Una fascia, non una cifra: la posizione salvata e' una cella di
          // cinque chilometri, quindi un numero esatto sarebbe piu' preciso
          // del dato che lo genera. Accanto c'e' scritto da dove viene, cosi'
          // chi legge sa quanto fidarsi.
          distanza && {
            label: 'Distanza dal punto cercato',
            valore: `${distanza} · ${NOMI_PRECISIONE[scheda.posizione?.precisione] || 'posizione dichiarata'}`,
          },
        ].filter(Boolean)}
      />

      {vuole.length > 0 && (
        <>
          <div className="tv-riga" aria-hidden="true" />
          <span className="label">Che cosa cerca</span>
          <TerminalRows voci={vuole.map((v) => [v.label, v.valore])} />
        </>
      )}

      <div className="tv-riga" aria-hidden="true" />

      <span className="label">Competenze certificate</span>
      {scheda.competenze.length === 0 ? (
        <p className="tv-vuoto">Nessuna competenza certificata da un’organizzazione in abbonamento.</p>
      ) : (
        <>
          <TerminalRows
            voci={competenze.map((c) => [
              `${c.nome} · ${livelloById(c.livello)?.label || c.livello}`,
              giorno(c.certificatoIl),
            ])}
          />
          {scheda.competenze.length > 6 && (
            <Button variante="fantasma" compatto onClick={() => setTutte(!tutte)}>
              {tutte ? 'Mostra meno' : `Vedi tutte e ${scheda.competenze.length}`}
            </Button>
          )}
        </>
      )}

      {scheda.achievement.length > 0 && (
        <>
          <div className="tv-riga" aria-hidden="true" />
          <span className="label">Achievement</span>
          <TerminalRows
            voci={scheda.achievement.map((a) => [
              a.nome,
              a.quante > 1 ? `${a.quante} volte` : giorno(a.ultimo),
            ])}
          />
        </>
      )}

      {scheda.percorso.length > 0 && (
        <>
          <div className="tv-riga" aria-hidden="true" />
          {/* Quanto e' durato ogni passaggio, non dove. Il nome
              dell'azienda non arriva fin qui: chi certifica resta suo. */}
          <span className="label">Percorso</span>
          <TerminalRows
            voci={scheda.percorso.map((p) => [
              `${p.ordine}ª organizzazione`,
              `${giorno(p.da)} → ${giorno(p.a)}`,
            ])}
          />
        </>
      )}

      <div className="oss-scarico">
        <Button variante="primario" compatto onClick={() => onScrivi(scheda)}>
          Scrivi a questo profilo
        </Button>
        <small className="ui-dialog-hint">
          Riceve il messaggio nell’applicazione e un’email che lo avvisa. Il suo nome resta suo.
        </small>
      </div>
    </TerminalPanel>
  );
}
