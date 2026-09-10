import TerminalPanel from '../terminal/TerminalPanel';
import TerminalRows, { TerminalValue } from '../terminal/TerminalRows';
import TerminalBar from '../terminal/TerminalBar';
import riflesso from '../motion/riflesso';
import { LIVELLI_PRESENZA, badgeLivello, presenceStreak } from '../../data/presenze';

const data = (giorno) => (giorno
  ? new Date(`${giorno}T12:00:00`).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: '2-digit' })
  : '—');

const giorniLabel = (n) => `${n} ${n === 1 ? 'giorno' : 'giorni'}`;

/**
 * La medaglia del livello raggiunto.
 *
 * E' una delle medaglie che il progetto ha gia' — l'orologio nella corona
 * d'alloro, nei quattro metalli — non un disegno nuovo: cosi' il livello di
 * presenza e le competenze dello Skill Tree si vedono fatti dalla stessa
 * mano. Sotto il livello di bronzo la medaglia c'e' lo stesso, spenta: si
 * deve vedere che cosa si sta per conquistare — e spenta non prende la luce
 * che ogni tanto attraversa le medaglie conquistate.
 */
export function BadgePresenza({ streak, size = 56, decorativo = false }) {
  const livello = streak?.livello;
  const img = badgeLivello(livello || LIVELLI_PRESENZA[0]);
  if (!img) return null;

  const testo = livello
    ? `Presence Streak: livello ${livello.nome}, ${giorniLabel(streak.giorni)}`
    : `Presence Streak: nessun livello ancora, ${giorniLabel(streak?.giorni ?? 0)}`;

  return (
    <span
      className={`ps-badge${livello ? ' mo-medaglia' : ' is-spento'}`}
      style={{ width: size, height: size, ...riflesso(img, livello?.id, Boolean(livello)) }}
      title={decorativo ? undefined : testo}
    >
      <img src={img} alt={decorativo ? '' : testo} aria-hidden={decorativo || undefined} />
    </span>
  );
}

/**
 * La Presence Streak nel profilo: quanti giorni di fila senza un'assenza, a
 * che livello si e' arrivati e quanto manca al prossimo.
 *
 * La barra misura il tratto fra il livello raggiunto e quello dopo, non la
 * strada dall'inizio: a ogni livello riparte da zero, cosi' si vede sempre
 * quanto manca al prossimo e non un progresso che rallenta all'infinito.
 * Sopra Diamond non c'e' un dopo: la barra resta piena e a salire e' solo il
 * numero dei giorni.
 *
 * Il livello non e' detto solo dal colore della medaglia: c'e' scritto,
 * nell'intestazione e nella riga sotto.
 */
export default function PresenceStreak({ persona, titolo = 'PRESENCE STREAK' }) {
  const streak = presenceStreak(persona.id);

  if (!streak.misurabile) {
    return (
      <div className="ui-blocco con-stacco">
        <TerminalPanel titolo={titolo} meta="in attesa" piede="TRACCIAMENTO: NON ANCORA AVVIATO" tonoPiede="attesa">
          <p className="tv-vuoto">
            Il conto parte con la prima registrazione di Time &amp; Attendance:
            prima di quella non c&apos;è niente da contare.
          </p>
        </TerminalPanel>
      </div>
    );
  }

  const { giorni, livello, prossimo, mancanti, percentuale, alMassimo, piuLunga, inizio } = streak;

  return (
    <div className="ui-blocco con-stacco">
      <TerminalPanel
        titolo={titolo}
        meta={livello ? livello.nome.toUpperCase() : `VERSO ${prossimo.nome.toUpperCase()}`}
        piede={alMassimo
          ? 'LIVELLO MASSIMO · LA SERIE CONTINUA'
          : `MANCANO ${giorniLabel(mancanti).toUpperCase()} A ${prossimo.nome.toUpperCase()}`}
      >
        <div className="ps-testa">
          <BadgePresenza streak={streak} size={64} decorativo />
          <TerminalValue
            valore={giorni}
            unita={giorni === 1 ? 'giorno di fila' : 'giorni di fila'}
            nota={livello ? livello.nome : 'nessun livello'}
          />
        </div>

        <TerminalBar
          percentuale={percentuale}
          label={livello ? livello.nome : '—'}
          testo={alMassimo ? 'MAX' : `${percentuale}%`}
          etichetta={alMassimo
            ? `Livello Diamond raggiunto: ${giorniLabel(giorni)} senza assenze, senza un limite superiore`
            : `${percentuale}% del percorso verso ${prossimo.nome}: mancano ${giorniLabel(mancanti)}`}
        />

        <div className="tv-riga" aria-hidden="true" />
        <TerminalRows
          vivo
          voci={[
            { label: 'Livello', valore: livello ? livello.nome : 'nessuno', tono: livello ? 'testo' : 'spento' },
            alMassimo
              ? { label: 'Prossimo livello', valore: 'nessuno: è il massimo', tono: 'testo' }
              : { label: `Mancano a ${prossimo.nome}`, valore: giorniLabel(mancanti) },
            { label: 'Serie più lunga', valore: giorniLabel(piuLunga), tono: piuLunga > giorni ? '' : 'spento' },
            { label: 'Dal', valore: data(inizio), tono: 'testo' },
          ]}
        />
      </TerminalPanel>
    </div>
  );
}
