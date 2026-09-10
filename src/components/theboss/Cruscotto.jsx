import TerminalBar from '../terminal/TerminalBar';
import { climaDi } from '../../giochi/theboss/contenuti/umori';

/**
 * I numeri che il capo vede, e il tempo che gli resta.
 *
 * Il saldo di ieri sta fra questi ed e' il piu' importante: e' la
 * differenza fra quello che l'azienda ha incassato e quello che le e'
 * costato stare aperta, ed e' il solo numero su cui si puo' rispondere
 * alla domanda «devo tagliare?». Senza, si vede la cassa scendere e non si
 * sa di quanto si e' sotto.
 *
 * I due nascosti — indulgenza e rancore — non compaiono, e non e' una
 * dimenticanza: il gioco vuole che si sentano dai dialoghi e si vedano
 * dalle conseguenze. Un numero li renderebbe una barra da ottimizzare.
 *
 * Il tempo non si legge solo dal colore. Un contatore che diventa rosso e
 * basta e' inutile per chi il rosso non lo distingue, e anche per chi
 * guarda altrove: qui ci sono i secondi scritti, la barra, e la parola —
 * «ampio», «stretto», «agli sgoccioli».
 */

const euro = (v) => `${Math.round(v).toLocaleString('it-IT')} mo`;

function statoDelTempo(resta, totale) {
  const q = totale ? resta / totale : 0;
  if (q > 0.5) return { parola: 'ampio', tono: '' };
  if (q > 0.22) return { parola: 'stretto', tono: 'attesa' };
  return { parola: 'agli sgoccioli', tono: 'errore' };
}

export default function Cruscotto({ foto, secondi, secondiTotali, rimaste }) {
  if (!foto) return null;
  const t = statoDelTempo(secondi, secondiTotali);
  const clima = climaDi(foto.morale);
  return (
    <div className="ui-tile tb-cruscotto">
      <div className="tb-barre">
        <TerminalBar
          label="TEMPO"
          percentuale={secondiTotali ? (secondi / secondiTotali) * 100 : 0}
          testo={`${Math.ceil(secondi)}s · ${t.parola}`}
          etichetta={`Restano ${Math.ceil(secondi)} secondi della giornata: tempo ${t.parola}`}
          tono={t.tono}
        />
        <TerminalBar
          label="MORALE"
          percentuale={foto.morale}
          testo={`${Math.round(foto.morale)}%`}
          etichetta={`Morale dell’azienda ${Math.round(foto.morale)} su cento: il clima è ${clima.nome.toLowerCase()}`}
          tono={foto.morale < 35 ? 'errore' : ''}
        />
      </div>
      <div className="tb-numeri">
        <span className="tb-voce"><small>GIORNO</small><b>{foto.giorno}<i>/{foto.giorni}</i></b></span>
        <span className={`tb-voce${foto.cassa < 2000 ? ' is-allarme' : ''}`}><small>CASSA</small><b>{euro(foto.cassa)}</b></span>
        <span className="tb-voce"><small>PRODUTTIVITÀ</small><b>{Math.round(foto.produttivita)}%</b></span>
        <span className="tb-voce"><small>FATTURATO IERI</small><b>{euro(foto.fatturato)}</b></span>
        {/* Il saldo e' il numero che spiega tutti gli altri: senza, la cassa
            scende e non si sa di quanto si e' sotto — e la domanda «devo
            tagliare?» non ha un dato su cui rispondere. */}
        <span className={`tb-voce${foto.saldo < 0 ? ' is-allarme' : ''}`}>
          <small>SALDO IERI</small>
          <b>{foto.saldo > 0 ? `+${euro(foto.saldo)}` : euro(foto.saldo)}</b>
        </span>
        <span className="tb-voce"><small>REPUTAZIONE</small><b>{Math.round(foto.reputazione)}%</b></span>
        <span className="tb-voce"><small>ORGANICO</small><b>{foto.organico}</b></span>
        <span className="tb-voce"><small>IN FILA</small><b>{rimaste}</b></span>
      </div>
      {foto.eventi.length > 0 && (
        <ul className="tb-eventi">
          {foto.eventi.map((e) => (
            <li key={e.id}><b>{e.nome}</b> — {e.racconto}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
