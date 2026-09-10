import TerminalBar from '../terminal/TerminalBar';

/**
 * Il progresso di un achievement: la barra e, soprattutto, i numeri.
 *
 * Una barra da sola dice "quasi"; i requisiti chiedono che si legga a colpo
 * d'occhio quanto manca, quindi il numero c'e' sempre — corrente su target e
 * quante ne restano.
 *
 * Quando l'obiettivo e' appena stato raggiunto il ciclo riparte da solo: qui
 * non si vede mai un 20/20 fermo, si vede il ciclo nuovo a zero e, accanto,
 * le volte in cui e' stato preso.
 *
 * La barra e' quella del terminale: blocchi pieni e blocchi vuoti fra
 * parentesi quadre, con il conteggio scritto al posto della percentuale —
 * "7/20" dice quanto manca meglio di "35%".
 */
export default function AchievementProgress({ progresso, manuale = false }) {
  if (!progresso) return null;
  const { progresso: corrente, target, mancanti, percentuale, volte, ciclo } = progresso;

  if (manuale) {
    return (
      <div className="ach-progress">
        <TerminalBar
          percentuale={volte > 0 ? 100 : 0}
          label="Assegnato"
          testo={volte > 0 ? `×${volte}` : '—'}
          etichetta={`Assegnato ${volte} volte`}
        />
        <p className="ach-numeri">
          <small>
            {volte > 0 ? 'Assegnato da un manager, con una motivazione' : 'Non ancora assegnato'}
          </small>
        </p>
      </div>
    );
  }

  return (
    <div className="ach-progress">
      <TerminalBar
        percentuale={percentuale}
        label="Progress"
        testo={`${corrente}/${target}`}
        etichetta={`${corrente} di ${target}, ${mancanti} ${mancanti === 1 ? 'mancante' : 'mancanti'}`}
      />
      {/* Il conteggio "7/20" ora sta nella barra: qui resta quello che la
          barra non dice, cioe' quanto manca e a che giro siamo. */}
      <p className="ach-numeri">
        <small>
          {mancanti === 0
            ? 'Achievement sbloccato'
            : `${mancanti} ${mancanti === 1 ? 'mancante' : 'mancanti'}`}
          {volte > 0 && (progresso.livelli
            ? ` · livello ${progresso.nomeLivello ?? progresso.livelli[volte - 1]}`
            : ` · ciclo #${ciclo}`)}
        </small>
      </p>
    </div>
  );
}
