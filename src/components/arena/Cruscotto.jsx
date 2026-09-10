import TerminalBar from '../terminal/TerminalBar';
import { tempoLeggibile } from '../../data/arena';
import { urlAsset } from '../../game/asset';
import { effettoById } from '../../game/effetti';

/**
 * Il cruscotto: vita, esperienza, livello, tempo, nemici eliminati.
 *
 * Si aggiorna otto volte al secondo, non sessanta: sono numeri da leggere,
 * non da guardare scorrere. Le due barre sono quelle del terminale
 * dell'app, con i blocchi. Quando c'e' un boss in campo compare la terza,
 * rossa, col suo nome e la fase in cui sta.
 *
 * Arrivati al livello massimo la barra dell'esperienza non ha piu' niente
 * da dire, e al suo posto compare quella della furia: di quanto sono
 * cresciuti i nemici da quando il giocatore ha smesso di crescere, e
 * quanto manca al minuto che li fara' crescere ancora.
 *
 * Sotto i numeri stanno gli effetti delle casse ancora accesi, ognuno con
 * l'icona e una barretta del tempo che resta; e per qualche secondo dopo
 * una cassa, l'annuncio: nome, icona, che cosa fa, per quanto.
 */
export default function Cruscotto({ hud, personaggio, onPausa, inPausa }) {
  if (!hud) return null;
  const pctVita = hud.vitaMax ? (hud.vita / hud.vitaMax) * 100 : 0;
  const pctXp = hud.soglia ? (hud.xp / hud.soglia) * 100 : 0;
  // al tetto non c'e' piu' esperienza da mostrare: al suo posto la barra
  // dice la furia dell'arena — quanto sono cresciuti i nemici, e quanto
  // manca al prossimo scatto di un minuto
  const alTetto = !!hud.alTetto;
  const minutiFuria = hud.furiaMinuti || 0;
  const furia = `×${(hud.furia || 1).toFixed(2).replace('.', ',')}`;
  const pctFuria = (minutiFuria % 1) * 100;
  const bassa = pctVita <= 30;
  const boss = hud.boss;
  const pctBoss = boss && boss.vitaMax ? (boss.vita / boss.vitaMax) * 100 : 0;
  const attivi = (hud.attivi || []).map((a) => ({ ...a, scheda: effettoById(a.id) })).filter((a) => a.scheda);
  const annuncio = hud.annuncio;
  const iconaAnnuncio = annuncio ? urlAsset(annuncio.icona) : null;

  return (
    <div className="arena-hud" aria-live="off">
      <div className="arena-hud-barre">
        <TerminalBar
          label="VITA"
          percentuale={pctVita}
          testo={`${hud.vita}/${hud.vitaMax}`}
          etichetta={`Vita ${hud.vita} su ${hud.vitaMax}`}
          tono={bassa ? 'errore' : ''}
        />
        {alTetto ? (
          <TerminalBar
            label="FURIA"
            percentuale={pctFuria}
            testo={`LIV ${hud.livello} · ${furia}`}
            etichetta={`Livello massimo ${hud.livello}. L’arena è in furia da ${Math.floor(minutiFuria)} minuti: i nemici hanno ${furia} di vita e di danno`}
            tono="errore"
          />
        ) : (
          <TerminalBar
            label={`LIV ${hud.livello}`}
            percentuale={pctXp}
            testo={`${hud.xp}/${hud.soglia}`}
            etichetta={`Livello ${hud.livello}, esperienza ${hud.xp} su ${hud.soglia}`}
          />
        )}
      </div>
      {boss && (
        <div className="arena-hud-boss">
          <TerminalBar
            label={boss.nome.toUpperCase()}
            percentuale={pctBoss}
            testo={`${boss.fase}/${boss.fasi} · ${boss.faseNome}`}
            etichetta={`${boss.nome}, vita ${boss.vita} su ${boss.vitaMax}, fase ${boss.fase} di ${boss.fasi}: ${boss.faseNome}`}
            tono="errore"
          />
        </div>
      )}
      <div className="arena-hud-numeri">
        <span className="arena-hud-voce"><small>TEMPO</small><b>{tempoLeggibile(hud.tempo)}</b></span>
        <span className="arena-hud-voce"><small>ELIMINATI</small><b>{hud.uccisioni}</b></span>
        <span className="arena-hud-voce"><small>IN CAMPO</small><b>{hud.nemici}</b></span>
        {boss || hud.bossAbbattuti > 0 ? <span className="arena-hud-voce"><small>BOSS</small><b>{hud.bossAbbattuti}</b></span> : null}
        {personaggio && <span className="arena-hud-voce"><small>CLASSE</small><b>{personaggio.classe}</b></span>}
        <button
          type="button"
          className="ui-btn is-fantasma is-compatto arena-hud-pausa"
          onClick={onPausa}
          aria-pressed={inPausa}
        >
          {inPausa ? 'Riprendi' : 'Pausa'}
        </button>
      </div>
      {(attivi.length > 0 || (hud.sinergie || []).length > 0) && (
        <ul className="arena-attivi" aria-label="Effetti e sinergie attivi">
          {(hud.sinergie || []).map((s) => (
            <li key={`sinergia-${s.id}`} className="arena-attivo is-sinergia" title="Sinergia">
              <span className="arena-attivo-vuoto" aria-hidden="true" style={{ background: 'var(--ui-gold)' }} />
              <span className="arena-attivo-nome">{s.nome}</span>
              <b className="arena-attivo-tempo">∞</b>
            </li>
          ))}
          {attivi.map((a) => {
            const icona = urlAsset(a.scheda.icona);
            const pct = a.durata ? Math.max(0, Math.min(100, (a.resta / a.durata) * 100)) : 0;
            return (
              <li key={a.id} className="arena-attivo" title={a.scheda.nome}>
                {icona ? <img src={icona} alt="" width={16} height={16} /> : <span className="arena-attivo-vuoto" aria-hidden="true" />}
                <span className="arena-attivo-nome">{a.scheda.nome}</span>
                <b className="arena-attivo-tempo">{Math.ceil(a.resta)}s</b>
                <span className="arena-attivo-barra" aria-hidden="true"><span style={{ width: `${pct}%` }} /></span>
              </li>
            );
          })}
        </ul>
      )}
      {annuncio && (
        <div className={`arena-annuncio is-${annuncio.rarita}`} role="status" aria-live="polite">
          {iconaAnnuncio ? <img className="arena-annuncio-icona" src={iconaAnnuncio} alt="" width={32} height={32} /> : null}
          <span className="arena-annuncio-testo">
            <small className="arena-annuncio-rarita">Cassa {annuncio.raritaNome.toLowerCase()}</small>
            <b className="arena-annuncio-nome">{annuncio.nome}</b>
            <span className="arena-annuncio-desc">
              {annuncio.descrizione}
              {annuncio.durata > 0 ? ` · ${Math.round(annuncio.durata)} s` : ''}
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
