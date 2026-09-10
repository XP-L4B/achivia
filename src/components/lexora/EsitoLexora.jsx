import Button from '../ui/Button';
import TerminalRows from '../terminal/TerminalRows';

/**
 * Com'e' finita: i punti, le parole indovinate e in quanti tentativi, e
 * quelle che sono rimaste segrete — perche' finita la partita si ha
 * diritto di sapere qual era.
 *
 * Le scoperte non sono un premio, sono il motivo per cui vale la pena
 * giocare in una lingua che non e' la propria: si finisce la partita
 * sapendo tre parole che non si sapevano.
 */
export default function EsitoLexora({ partita, ioSono, onRivincita, onEsci, scoperte = [] }) {
  const esito = partita?.esito;
  const io = partita?.giocatori?.find((g) => g.userId === ioSono) ?? partita?.giocatori?.[0];
  const altro = partita?.giocatori?.find((g) => g !== io);
  /* La prova non si vince contro qualcuno: si passa o non si passa. Il
     confronto con l'avversario, li' dentro, non vuol dire niente —
     l'avversario non c'e'. */
  const prova = Boolean(esito?.prova);
  const come = !esito ? null
    : prova ? (esito.superato ? 'vinta' : 'persa')
      : esito.pareggio ? 'pareggio' : (esito.vincitore === ioSono ? 'vinta' : 'persa');
  const storia = io?.storia ?? [];
  const trovate = storia.filter((s) => s.indovinata).length;

  return (
    <div className={`lex-esito is-${come ?? 'ignoto'}`}>
      <p className="lex-esito-titolo">
        {prova
          ? (esito.superato ? `Livello ${esito.livello} superato.` : `Livello ${esito.livello} non superato.`)
          : (
            <>
              {come === 'vinta' && 'Hai vinto.'}
              {come === 'persa' && 'Hai perso.'}
              {come === 'pareggio' && 'Pareggio.'}
            </>
          )}
      </p>
      {prova ? (
        <>
          <p className="lex-esito-punti">{esito.punti} <span aria-hidden="true">/</span> {esito.soglia}</p>
          <p className="tv-nota">
            {esito.superato
              ? 'Il livello dopo è aperto: meno tempo per tentativo, parole più lunghe.'
              : esito.tutte
                ? 'Le hai trovate tutte e due, ma ci hai messo troppo: la soglia si raggiunge andando più svelti.'
                : 'Per passare vanno indovinate tutte e due le parole. Questa volta ne è rimasta una segreta.'}
          </p>
        </>
      ) : (
        <p className="lex-esito-punti">{io?.punti ?? 0} <span aria-hidden="true">–</span> {altro?.punti ?? 0}</p>
      )}

      {storia.length > 0 && (
        <ul className="lex-parole-finali" aria-label="Le parole di questa partita">
          {storia.map((s, i) => (
            <li key={i} className={s.indovinata ? 'is-trovata' : 'is-persa'}>
              <b>{s.parola.toUpperCase()}</b>
              <span>{s.indovinata ? `trovata in ${s.tentativi} ${s.tentativi === 1 ? 'tentativo' : 'tentativi'}` : 'non trovata'}</span>
              <span className="lex-parole-punti">{s.punti}</span>
            </li>
          ))}
        </ul>
      )}

      <TerminalRows
        voci={[
          ['Parole indovinate', `${trovate} su ${storia.length}`],
          ['Tentativi usati', `${io?.tentativi ?? 0}`],
          ['Il colpo migliore', io?.minimoTentativi ? `${io.minimoTentativi} ${io.minimoTentativi === 1 ? 'tentativo' : 'tentativi'}` : '—'],
          prova ? null : [`Parole di ${altro?.nome ?? 'chi hai davanti'}`, `${altro?.indovinate ?? 0} su ${storia.length}`],
        ].filter(Boolean)}
      />

      {scoperte.length > 0 && (
        <div className="lex-scoperte">
          <p className="lex-scoperte-titolo">Parole scoperte</p>
          <ul>
            {scoperte.map((s) => (
              <li key={s.normalizedWord || s.word}>
                <b>{s.word}</b>
                {s.definition && <span className="lex-scoperta-def">{s.definition}</span>}
                {s.translations?.it && <span className="tv-nota">in italiano: {s.translations.it}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="lex-esito-azioni">
        {/* Dopo una prova non c'e' nessuno con cui rifare i conti: si
            rigioca il livello. */}
        <Button variante="primario" onClick={onRivincita}>{prova ? 'Riprova il livello' : 'Rivincita'}</Button>
        <Button variante="fantasma" onClick={onEsci}>Torna all’atrio</Button>
      </div>
      <p className="tv-nota">Lexora non dà crediti né esperienza: quelli si guadagnano lavorando.</p>
    </div>
  );
}
