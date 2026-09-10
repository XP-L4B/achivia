import TerminalBar from '../terminal/TerminalBar';

/**
 * Il tabellone: chi sta giocando, con quanti punti, e quanto tempo resta.
 *
 * Dell'avversario si vede il punteggio, a che parola e' e quanto ci si e'
 * avvicinato — non le sue parole: sapere che ha provato CANE vorrebbe dire
 * giocare col suo tabellone oltre che col proprio.
 *
 * Il timer e' una barra e non un numero che scende, perche' a mezzo minuto
 * da spendere serve vedere quanto ne resta senza leggere. Il numero c'e'
 * lo stesso, dentro la barra, per chi lo vuole preciso.
 */
export default function Tabellone({ foto, secondi, secondiTotali, ioSono }) {
  return (
    <div className="lex-tabellone">
      <div className="lex-punteggi">
        {foto.giocatori.map((g, i) => (
          <div key={g.userId ?? i} className={`lex-punteggio${foto.diChi === i ? ' is-turno' : ''}${g.userId === ioSono ? ' is-mio' : ''}`}>
            <span className="lex-punteggio-chi">{g.nome}{g.userId === ioSono ? ' (tu)' : ''}</span>
            <b className="lex-punteggio-punti">{g.punti}</b>
            <span className="lex-punteggio-sotto">
              {g.indovinate} trovate · {g.finito ? 'ha chiuso' : `${g.tentativi} tentativi`}
            </span>
          </div>
        ))}
      </div>

      <TerminalBar
        label="TEMPO"
        percentuale={secondiTotali ? Math.max(0, Math.min(100, (secondi / secondiTotali) * 100)) : 0}
        testo={`${Math.max(0, Math.ceil(secondi))}s`}
        etichetta={`${Math.max(0, Math.ceil(secondi))} secondi rimasti`}
      />

      <p className="lex-obiettivo">
        <span className="lex-obiettivo-etichetta">Parola {Math.min(foto.parola + 1, foto.paroleTotali)} di {foto.paroleTotali}</span>
        {foto.lettere} lettere, {foto.tentativiMassimi} tentativi a testa.
      </p>
    </div>
  );
}
