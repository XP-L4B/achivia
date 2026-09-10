import Button from '../ui/Button';
import TerminalPanel from '../terminal/TerminalPanel';
import TerminalRows from '../terminal/TerminalRows';

/**
 * Com'è andata questa parola. E finché non si legge, non si va avanti.
 *
 * Prima una parola finiva e la successiva cominciava nello stesso istante.
 * Chi indovinava lo scopriva da una riga di testo che spariva subito; chi
 * sbagliava vedeva la parola giusta per un battito di ciglia, con il
 * cronometro della parola dopo già partito. Un gioco che non si ferma a
 * dire com'è andata non insegna niente, e la parola che non hai trovato è
 * proprio quella che vale la pena guardare.
 *
 * Nella prova in solitario la pausa è vera: il motore sta in `intervallo`,
 * il turno successivo non è cominciato e l'orologio non scorre. Nella
 * sfida non può esserlo — i due giocano a ore diverse e fermare uno
 * vorrebbe dire fermare l'altro — ma per chi ha appena chiuso la sua
 * parola il tempo era già finito lo stesso, quindi il pannello dice le
 * stesse cose e si chiude quando si è letto.
 */
export default function PausaLexora({ dati, ultima = false, aspetta = false, onContinua }) {
  if (!dati) return null;
  const vinta = Boolean(dati.indovinata);
  const parola = String(dati.segreta || '').toUpperCase();

  const voci = [
    ['La parola', parola],
    ['Tentativi', `${dati.tentativi} su ${dati.tentativiMassimi ?? 8}`],
    dati.secondi != null ? ['Tempo', `${dati.secondi}s`] : null,
    ['Punti', vinta ? `+${dati.punti}` : String(dati.punti)],
    dati.puntiFinora != null ? ['Totale', String(dati.puntiFinora)] : null,
  ];

  return (
    <div className="lex-pausa" role="dialog" aria-modal="true" aria-label={vinta ? 'Parola indovinata' : 'Parola non trovata'}>
      <div className="lex-pausa-foglio">
        <TerminalPanel
          titolo={vinta ? 'Bravo, l’hai indovinata' : 'Peccato, questa volta no'}
          meta={vinta ? 'trovata' : 'persa'}
          tonoPiede={vinta ? '' : 'errore'}
        >
          <p className="tb-testo">
            {vinta
              ? `Era ${parola}, e l’hai presa ${dati.tentativi === 1 ? 'al primo colpo' : `in ${dati.tentativi} tentativi`}.`
              : `Era ${parola}. Guardala bene: la prossima volta la riconosci.`}
          </p>

          <TerminalRows voci={voci.filter(Boolean)} />

          {dati.scheda?.definition && (
            <p className="tv-nota lex-pausa-scheda">{dati.scheda.definition}</p>
          )}

          <div className="lex-azioni">
            {aspetta ? (
              <Button variante="fantasma" onClick={onContinua} autoFocus>Ho capito</Button>
            ) : (
              <Button variante="primario" onClick={onContinua} autoFocus>
                {ultima ? 'Vedi com’è finita' : 'La parola dopo'}
              </Button>
            )}
          </div>
          {!aspetta && !ultima && (
            <p className="tv-nota">Il tempo riparte quando premi: leggi con calma.</p>
          )}
        </TerminalPanel>
      </div>
    </div>
  );
}
