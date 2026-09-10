import { useState } from 'react';
import Button from '../ui/Button';
import { CONFIG } from '../../giochi/lexora/contenuti/config';

/**
 * Come si gioca, in quattro schermate.
 *
 * Quattro perche' le regole vere sono quattro: c'e' una parola segreta di
 * cui si sa solo la lunghezza, si prova una parola vera della stessa
 * lunghezza, i colori dicono quanto ci si e' avvicinati, e i tentativi
 * sono contati. Tutto il resto — il punteggio, le due parole di una
 * partita — si capisce giocando, e spiegarlo prima vorrebbe dire farsi
 * leggere un manuale da chi voleva fare una partita di tre minuti.
 */
const PASSI = [
  {
    titolo: 'C’è una parola segreta',
    testo: `All’inizio non sai altro che quante lettere ha: tante caselle vuote. Sono da ${CONFIG.parola.minimo} a ${CONFIG.parola.massimo} lettere, e sono parole di uso comune — non ti verrà chiesto di indovinare qualcosa che nessuno dice.`,
  },
  {
    titolo: 'Provi una combinazione di lettere',
    testo: 'Scrivi qualsiasi combinazione della stessa lunghezza: non deve per forza voler dire qualcosa. Se ti serve provare AEIOU per vedere dove stanno le vocali, fallo — è un modo di ragionare come un altro.',
  },
  {
    titolo: 'I colori dicono quanto ci sei vicino',
    testo: 'Verde: lettera giusta al posto giusto. Giallo: la lettera c’è, ma da un’altra parte. Grigio: non c’è. Se la segreta ha una sola A e tu ne scrivi due, solo una si accende — così il conto delle lettere resta onesto.',
  },
  {
    titolo: 'I tentativi sono contati',
    testo: `Ne hai ${CONFIG.partita.tentativi} per ogni parola. Indovinarla presto vale di più: ogni tentativo risparmiato sono ${CONFIG.punti.perTentativoRisparmiato} punti. E se non ci arrivi, le lettere che avevi messo al posto giusto contano lo stesso qualcosa.`,
  },
];

export default function Tutorial({ onChiudi }) {
  const [i, setI] = useState(0);
  const passo = PASSI[i];
  const ultimo = i === PASSI.length - 1;

  return (
    <div className="lex-tutorial">
      <p className="lex-tutorial-conto">{i + 1} di {PASSI.length}</p>
      <h3 className="lex-tutorial-titolo">{passo.titolo}</h3>
      <p className="lex-tutorial-testo">{passo.testo}</p>
      <div className="lex-tutorial-azioni">
        {i > 0 && <Button variante="fantasma" onClick={() => setI(i - 1)}>Indietro</Button>}
        <Button variante="primario" onClick={() => (ultimo ? onChiudi() : setI(i + 1))}>
          {ultimo ? 'Ho capito' : 'Avanti'}
        </Button>
      </div>
    </div>
  );
}
